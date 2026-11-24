import React, { useId, useMemo } from "react";
import { clamp, EASE, hash, lerp, noise1 } from "../../cinematic/core/anim";
import { Sparrow, VILLAGE_LIFE_PX_PER_CM } from "../../cinematic/life/VillageLife";
import { ContactShadow, GhibliInkBloom, GhibliJabaBlossom, GhibliSketchedLeaf } from "../GhibliStage";

/**
 * GhibliLifeKit (`src/ghibli_pipeline/core/GhibliLifeKit.tsx`): the immersive world-and-light layer for the Ghibli
 * episodes (STO-22b, decided 2026-11-24). One reusable kit of light, sky, creatures, set dressing and depth helpers,
 * placed per scene. QA sheet: composition `GhibliLifeKitQA` (`./GhibliLifeKitQA.tsx`).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * CONVENTIONS (every component)
 * ---------------------------------------------------------------------------------------------------------------
 * - Every component returns SVG (`<g>`) for a `<GhibliLayer>`: coordinates are STAGE px of that layer's
 *   1920 x 1080 viewBox (the same numbers you give `GhibliCutout` / `ContactShadow` in that layer).
 * - `lifeF`: the real frame (keeps running in a pause; story clock rules, CLAUDE.md "Pauses"). Everything alive
 *   (wing beats, sway, drift, blinks, idle behaviours) runs on it.
 * - `f` + `at`/`start`/`diveAt`/`arriveAt`/`plopAt`: one-off actions keyed to the STORY clock (`useStory..().f` or
 *   the scene's local frame), so they hold in a pause and can be tied to narration cues (`cueLocalStory`).
 * - `s`: scale. Creatures use the VillageLife scale: s = 1 is real size at VILLAGE_LIFE_PX_PER_CM (2.3 px per cm, the
 *   adult Puppet at scale 1). For a creature at the depth of a character drawn at Puppet scale k, pass s = k.
 *   Light/set pieces use s = 1 for "as designed at stage size".
 * - `flip`: mirror (creatures face right by default unless noted). `seed`: varies the random choices.
 * - Depth: put a component in the GhibliLayer of the plane it belongs to (water creatures in the water/bank layer,
 *   ground cover in the cut-out's own layer, foreground frames at depth 1.15-1.35). Sizes are in that layer's px,
 *   so the layer's zoom^depth handles perspective; inside one layer, scale far things down yourself
 *   (`s` smaller near the horizon, as GhibliPondBank does with `bankPersp`).
 * - Ink is warm sepia (`GHIBLI_INK` #3A2618, ~1-1.4 px, `vectorEffect="non-scaling-stroke"` in scaled art).
 * - BAL-05: no glow on anything but Balak. Sun, lamp, moon and fireflies here are ordinary light: soft, small,
 *   never pulsing halos. Do not put kit light on Balak's halo beats.
 * - Cost: no feTurbulence except GhibliReflection (one small filter each) and GhibliForegroundFrame's optional blur;
 *   everything else is gradients and paths (cheap). Stills of the full QA sheet render in a few seconds.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * API (one line each; full props in each component's doc)
 * ---------------------------------------------------------------------------------------------------------------
 * LIGHT AND SKY
 *   ghibliSunrise({f,start,dur,horizonY,sunX})        -> {p,u,x,y,r,elevation}: sun state to drive rays/shadows.
 *   <GhibliSunrise f lifeF start dur horizonY sunX sky="paint|tint|none" mist birds />  scene-opening sunrise.
 *   <GhibliMorningMist y x0 x1 lifeF lift opacity />   lifting, thinning mist banks (also used by GhibliSunrise).
 *   <GhibliSunRays lifeF openings={[{x,y,w,h,arch}]} light={{x,y}} | angle length intensity motes /> god-rays.
 *   <GhibliMovingShadows casters={[{x,y,w,h}]} azimuth elevation squash opacity />  pillar shadows with the sun.
 *   <GhibliDappledLight region={{x,y,w,h}} lifeF mode="both|light|shadow" intensity squash /> leaf dapple.
 *   <GhibliCloudShadows region | shape lifeF speed opacity />  slow cloud shadows over ground or water.
 *   <GhibliWaterLight region lifeF intensity fade="bottom|top|none" /> caustic light on walls/steps by water.
 *   <GhibliMoonbeam window={{x,y,w,h,bars}} floor={[tl,tr,br,bl]} lifeF />  barred moonbeam + bar shadows.
 * CREATURES
 *   <GhibliButterflies flowers={[{x,y}]} count kinds lifeF s />  yellow / white / swallowtail, land and bask.
 *   <GhibliBirdFlock f start dur from to count formation="v|loose" s loop />  small birds crossing the sky.
 *   <GhibliPigeons perches={[{x,y,flip}]} lifeF s flutterAt />  bobbing, cooing, stepping, fluttering pigeons.
 *   <GhibliSparrowFlight f lifeF from perch arriveAt leaveAt to s />  sparrow flies in, lands on a twig/ground.
 *   ghibliPerchDip(f, arriveAt) -> px the perch dips on landing (bend your twig with the same value).
 *   GhibliGroundSparrow = VillageLife Sparrow (hops/pecks on the ground; props x y s flip lifeF hopAt peckAt...).
 *   <GhibliSquirrel path={[{x,y},...]} lifeF s keys />  palm squirrel running on a ledge/branch, pausing, flicking.
 *   <GhibliDucks region count lifeF s />  gliding ducks with V wakes, dabbling.
 *   <GhibliLilyPads pads | region count lifeF s />  bobbing pads with pink lotus / white lilies / buds.
 *   <GhibliFishRings region lifeF count period />  rings at random spots.
 *   <GhibliSplashRings x y t size squash />  one splash's rings (t = frames since impact) for your own hooks.
 *   <GhibliKingfisher f lifeF perch target diveAt s />  white-throated kingfisher, one dive, splash, return, fish.
 *   <GhibliFrog x y target plopAt f lifeF s />  frog sits, throat pulses, plops into the water.
 *   <GhibliFireflies region count lifeF />  soft blinking points, slow drift.
 *   <GhibliMoth lamp={{x,y}} lifeF radius s />  moth circling a lamp.
 *   <GhibliGecko area lifeF s keys />  tiktiki on a wall: still, dart, head tilt, tail curl.
 *   <GhibliFallingFlowers kind="shiuli|mandar|jaba" source={{x0,x1,y}} ground={{y0,y1}} lifeF water onWater />
 * SET DRESSING
 *   <GhibliGroundCover x y w s lifeF preset="garden|pond|courtyard|grove" litter part="all|back|front" />
 *   <GhibliWaterlineMist y={number | (x)=>y} x0 x1 lifeF />  thin drifting mist band on a waterline.
 *   <GhibliForegroundFrame items={[{kind:"bananaLeaf|flowerBranch|creeper|pillar",x,y,s,rot,flip}]} lifeF blur parallax />
 * DEPTH
 *   <GhibliReflection waterY clip lifeF opacity tint ripple>{characters}</GhibliReflection>  mirrored, rippling.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * DEPTH PATTERNS (copy these)
 * ---------------------------------------------------------------------------------------------------------------
 * 1) PUSH-THROUGH AN OPENING (arch, door, banana leaves). The opening frame sits on a near layer (depth 1.2-1.35);
 *    a push (zoom 1.0 -> 1.6 over 60-90 frames, eased, starting on its line) scales it by zoom^depth, faster than
 *    the subject at depth 1, so the frame slides off the edges and the camera seems to pass through it. Fade it as
 *    it leaves, and keep cam.x/y centred on the opening:
 *
 *      const push = EASE.inOut(clamp((f - cueAt) / 80));
 *      const cam: Cam = { x: lerp(0, 40, push), y: lerp(0, -20, push), zoom: lerp(1, 1.6, push) };
 *      cam.dof = zoomProportionalDof(cam.zoom);
 *      <GhibliStage cam={cam}>
 *        ...sky / back plate / set layers...
 *        <GhibliLayer depth={1} groundLocked>{characters}</GhibliLayer>
 *        <GhibliLayer depth={1.28} opacity={clamp(1.5 - push * 1.4, 0, 1)}>
 *          <GhibliForegroundFrame lifeF={lifeF} blur={0}
 *            items={[{ kind: "pillar", x: 70, y: -40 }, { kind: "pillar", x: 1850, y: -40, flip: true },
 *                    { kind: "creeper", x: 300, y: -20, length: 420 }]} />
 *        </GhibliLayer>
 *      </GhibliStage>
 *    (GhibliLayer already blurs by |depth - cam.focus| * cam.dof, so leave `blur` at 0 inside a near layer.)
 *
 * 2) RACK FOCUS. Animate cam.focus between the depths of two subjects over 12-18 frames from the line's cue, and
 *    hold enough dof for the change to read (blur px = |depth - focus| * dof, max 14):
 *
 *      const rack = EASE.inOut(clamp((f - cueLocalStory("...", SCENE_ID).a + 6) / 16));
 *      cam.focus = lerp(1.0, 0.78, rack);                       // from Balak (depth 1) to Charu (depth 0.78)
 *      cam.dof = Math.max(zoomProportionalDof(cam.zoom), 1.6);  // wide shots need extra dof for a visible rack
 *
 * 3) CHARACTERS BETWEEN OCCLUDERS (pillars, tree trunks, curtains). Give the occluders and the character the SAME
 *    depth (so they never slide against each other) and draw the occluders in a second layer AFTER the characters,
 *    as GhibliCourtyardPillars does. A character passing behind: just keep drawing it; the occluder layer hides it.
 *
 *      <GhibliLayer depth={0.86} groundLocked>{set back wall, ground}</GhibliLayer>
 *      <GhibliLayer depth={0.86} groundLocked>{walkingCousin}</GhibliLayer>        // behind the pillars
 *      <GhibliLayer depth={0.86} groundLocked><GhibliCourtyardPillars .../></GhibliLayer>
 *      <GhibliLayer depth={1} groundLocked>{Balak and family in front}</GhibliLayer>
 *    Tree trunks: draw the trunk cut-out in its layer, the character in a layer of equal depth before it, and a
 *    GhibliGroundCover part="front" after both so the trunk base and the feet share the same grass.
 *
 * 4) REFLECTIONS AT THE POND. Draw the reflection in the SAME layer as the character, before the character, from the
 *    same render function, clipped to the water so it never shows on the bank:
 *
 *      <GhibliLayer depth={1} groundLocked>
 *        <GhibliReflection waterY={836} clip={{ x: -600, y: 836, w: 3200, h: 400 }} lifeF={lifeF}>
 *          {drawCharacters()}
 *        </GhibliReflection>
 *        {drawCharacters()}
 *      </GhibliLayer>
 *    The mirror line is the WATERLINE BELOW THE FEET (for a figure on the bank, waterY = the bank edge in front of
 *    it; the reflection only shows where it falls on water). Characters are drawn twice: use it in the shots that
 *    need it.
 *
 * 5) GROUND COVER OVER CUT-OUT BASES. Put GhibliGroundCover in the cut-out's own layer right after the cut-out, at
 *    the anchor point (x, y) with w about the trunk/clump width x 1.6. For a character standing in front of the
 *    same clump, use part="back" before the character and part="front" after.
 */

/* ================================================================================================================ */
/* Shared helpers                                                                                                    */
/* ================================================================================================================ */

export const GHIBLI_INK = "#3A2618";
const PXCM = VILLAGE_LIFE_PX_PER_CM;

export interface GPt {
  x: number;
  y: number;
}
export interface GRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const useSid = (prefix: string) => `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
const n1 = (v: number) => v.toFixed(1);
const n2 = (v: number) => v.toFixed(2);
const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** 0 before a; rises over `rise`, holds `hold`, falls over `fall`. */
const env = (t: number, a: number, rise: number, hold: number, fall: number) => {
  if (t < a) return 0;
  if (t < a + rise) return sstep(0, 1, (t - a) / rise);
  if (t < a + rise + hold) return 1;
  return 1 - sstep(0, 1, (t - a - rise - hold) / Math.max(1, fall));
};
const lastAt = (t: number, list?: number[]) => {
  let best = -Infinity;
  for (const a of list ?? []) if (a <= t && a > best) best = a;
  return best;
};
/** Deterministic idle events: one per `period` bucket (probability `prob`); the latest start <= t, or -Infinity. */
const bucketEvent = (t: number, period: number, seed: number, prob = 1) => {
  const k0 = Math.floor(t / period);
  for (let k = k0; k >= k0 - 1; k--) {
    if (hash(k * 7.31 + seed * 3.7) > prob) continue;
    const at = k * period + Math.floor(hash(k * 1.97 + seed * 11.3) * period * 0.55);
    if (at <= t) return at;
  }
  return -Infinity;
};
/** Small jerky moves (bird heads): a new random value every `period` frames, snapped to over 2.5 frames. */
const jerk = (t: number, seed: number, period: number, amp: number) => {
  const k = Math.floor(t / period);
  const v = (i: number) => (hash(i * 3.71 + seed * 9.1) - 0.5) * 2 * amp;
  return lerp(v(k - 1), v(k), sstep(0, 2.5, t - k * period));
};
const hexToRgb = (h: string): [number, number, number] => {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const mixHex = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
/** Monotone-chain convex hull. */
const hull = (pts: GPt[]): GPt[] => {
  const p = [...pts].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (p.length < 3) return p;
  const cross = (o: GPt, a: GPt, b: GPt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: GPt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: GPt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
};
const polyD = (pts: GPt[]) => `M ${pts.map((q) => `${n1(q.x)} ${n1(q.y)}`).join(" L ")} Z`;
const bezier = (a: GPt, b: GPt, c: GPt, d: GPt, t: number): GPt => {
  const m = 1 - t;
  return {
    x: m * m * m * a.x + 3 * m * m * t * b.x + 3 * m * t * t * c.x + t * t * t * d.x,
    y: m * m * m * a.y + 3 * m * m * t * b.y + 3 * m * t * t * c.y + t * t * t * d.y,
  };
};
const NSS = { vectorEffect: "non-scaling-stroke" as const };

/* ================================================================================================================ */
/* LIGHT AND SKY                                                                                                     */
/* ================================================================================================================ */

export interface GhibliSunState {
  /** Linear progress 0..1 over [start, start + dur]. */
  p: number;
  /** Eased rise 0..1 (fast at first, settling). */
  u: number;
  /** Sun disc centre (stage px). */
  x: number;
  y: number;
  r: number;
  /** Sun elevation in degrees (2 at first light .. about 34): feed GhibliMovingShadows. */
  elevation: number;
}

/** Sun position for a sunrise, so rays, shadows and grading can follow the same sun. */
export const ghibliSunrise = (o: {
  f: number;
  start?: number;
  dur?: number;
  horizonY: number;
  sunX?: number;
  /** How far the disc centre ends above the horizon (px, default 240). */
  rise?: number;
  sunR?: number;
  /** Sideways drift of the disc while it rises (px, default 40: the sun climbs to the right). */
  driftX?: number;
}): GhibliSunState => {
  const { f, start = 0, dur = 240, horizonY, sunX = 1480, rise = 240, sunR = 44, driftX = 40 } = o;
  const p = clamp((f - start) / Math.max(1, dur));
  const u = 1 - Math.pow(1 - p, 1.7);
  return {
    p,
    u,
    x: sunX + driftX * u,
    y: horizonY + sunR * 1.15 - (rise + sunR * 1.15) * u,
    r: sunR,
    elevation: lerp(2, 34, u),
  };
};

/* sky colours top / middle / horizon at dawn, rose and gold */
const SKY_DAWN = ["#717d92", "#a19da8", "#cbaea3"];
const SKY_ROSE = ["#8796ae", "#d8aaa6", "#efba98"];
const SKY_GOLD = ["#a3b9cd", "#efd5ad", "#ffd893"];
const skyAt = (p: number) =>
  [0, 1, 2].map((i) => (p < 0.45 ? mixHex(SKY_DAWN[i], SKY_ROSE[i], p / 0.45) : mixHex(SKY_ROSE[i], SKY_GOLD[i], (p - 0.45) / 0.55)));

/**
 * Lifting, thinning mist banks (soft cream ellipses) along a ground line. `lift` 0..1: 0 = low, dense morning mist;
 * 1 = lifted ~60 px and nearly gone. Place it in the layer of the ground it lies on (in front of the far set).
 */
export const GhibliMorningMist: React.FC<{
  /** Base line of the mist (stage y). */
  y: number;
  x0?: number;
  x1?: number;
  lifeF: number;
  /** 0 = dense and low .. 1 = lifted and gone. */
  lift?: number;
  /** Thickness of the bank (px, default 90). */
  height?: number;
  opacity?: number;
  color?: string;
  seed?: number;
}> = ({ y, x0 = -500, x1 = 2420, lifeF, lift = 0, height = 90, opacity = 0.75, color = "#f6efe4", seed = 5 }) => {
  const id = useSid("gmist");
  const o = opacity * (1 - 0.92 * clamp(lift));
  if (o < 0.01) return null;
  const n = Math.max(4, Math.round((x1 - x0) / 240));
  const span = x1 - x0 + 600;
  return (
    <g pointerEvents="none" opacity={o}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity={0.85} />
          <stop offset="60%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      {Array.from({ length: n * 2 }, (_, i) => {
        const h1 = hash(i * 3.17 + seed);
        const h2 = hash(i * 7.91 + seed * 2.3);
        const row = i % 2;
        const speed = (0.12 + h2 * 0.18) * (row ? 1 : -0.7);
        const cx = x0 - 300 + ((((h1 * span + lifeF * speed) % span) + span) % span);
        const rx = 200 + h2 * 220;
        const ry = height * (0.35 + h1 * 0.35) * (1 - 0.35 * lift);
        const cy = y - row * height * 0.35 - lift * (60 + h1 * 40) + Math.sin(lifeF * 0.012 + i) * 4;
        return <ellipse key={i} cx={n1(cx)} cy={n1(cy)} rx={n1(rx)} ry={n1(ry)} fill={`url(#${id})`} />;
      })}
    </g>
  );
};

/**
 * A scene-opening sunrise behind an occluding edge (parapet, roof line, far bank) at `horizonY`.
 * Draw it in the SKY layer (depth ~0.08-0.2); the parapet / far set in front of it hides the disc's lower part,
 * and the disc is also clipped to above `horizonY` so it never shows below the edge.
 *
 *   const sun = ghibliSunrise({ f, start: 0, dur: 240, horizonY: 420, sunX: 1450 });
 *   <GhibliLayer depth={0.1}><GhibliSunrise f={f} lifeF={lifeF} start={0} dur={240} horizonY={420} sunX={1450}
 *      sky="tint" mist={{ y: 600 }} birds /></GhibliLayer>
 *   <GhibliLayer depth={0.62}><GhibliSunRays light={sun} openings={ARCHES} lifeF={lifeF} intensity={0.55 * sun.u} />
 *
 * sky: "paint" draws an opaque gradient sky (dawn blue-grey -> rose -> gold); "tint" lays the same gradient over an
 * existing painted sky plate (multiply, fading as the day warms); "none" draws only sun, bloom, mist and birds.
 */
export const GhibliSunrise: React.FC<{
  /** Story clock. */
  f: number;
  /** Life clock for mist drift and birds (defaults to f). */
  lifeF?: number;
  start?: number;
  /** Frames from first light to full gold (default 240). */
  dur?: number;
  horizonY: number;
  sunX?: number;
  rise?: number;
  sunR?: number;
  driftX?: number;
  sky?: "paint" | "tint" | "none";
  /** Sky rectangle (default covers the stage with margin for camera moves, down to horizonY + 80). */
  region?: GRect;
  /** Multiplier for the sun's soft bloom (default 1). Ordinary sunlight: never pulses. */
  bloom?: number;
  /** Mist that lifts and thins with the sunrise (true = at horizonY + 120). */
  mist?: boolean | { y?: number; x0?: number; x1?: number; height?: number; opacity?: number };
  /** Birds crossing the sky (true = 9 birds, loose, from left to right in the second half). */
  birds?: boolean | { count?: number; y?: number; start?: number; dur?: number; formation?: "v" | "loose"; s?: number };
}> = ({ f, lifeF, start = 0, dur = 240, horizonY, sunX = 1480, rise, sunR = 44, driftX, sky = "paint", region, bloom = 1, mist, birds }) => {
  const id = useSid("gsun");
  const lf = lifeF ?? f;
  const sun = ghibliSunrise({ f, start, dur, horizonY, sunX, rise, sunR, driftX });
  const R = region ?? { x: -700, y: -420, w: 3320, h: horizonY + 500 };
  const [cTop, cMid, cLow] = skyAt(sun.p);
  const bloomO = bloom * (0.25 + 0.75 * sstep(0, 0.35, sun.u)) * (1 - 0.35 * sun.u);
  const discO = sstep(0.0, 0.08, sun.p);
  const mistO = typeof mist === "object" ? mist : {};
  const birdO = typeof birds === "object" ? birds : {};
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1={R.y} x2="0" y2={horizonY + 40} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={cTop} />
          <stop offset="62%" stopColor={cMid} />
          <stop offset="100%" stopColor={cLow} />
        </linearGradient>
        <radialGradient id={`${id}-bloom`}>
          <stop offset="0%" stopColor="#fff3d2" stopOpacity={0.75} />
          <stop offset="18%" stopColor="#ffe2a6" stopOpacity={0.42} />
          <stop offset="55%" stopColor="#f7c486" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#f7c486" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-disc`}>
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="70%" stopColor="#fff0c8" />
          <stop offset="100%" stopColor={mixHex("#ffc98a", "#ffe9b8", sun.u)} />
        </radialGradient>
        <clipPath id={`${id}-above`}>
          <rect x={R.x} y={R.y} width={R.w} height={horizonY - R.y} />
        </clipPath>
      </defs>
      {sky === "paint" && <rect x={R.x} y={R.y} width={R.w} height={R.h} fill={`url(#${id}-sky)`} />}
      {sky === "tint" && (
        <rect
          x={R.x}
          y={R.y}
          width={R.w}
          height={R.h}
          fill={`url(#${id}-sky)`}
          opacity={lerp(0.9, 0.25, sun.u)}
          style={{ mixBlendMode: "multiply" }}
        />
      )}
      {/* soft sun bloom (ordinary sunlight, screen) */}
      <circle cx={n1(sun.x)} cy={n1(sun.y)} r={n1(sunR * 7.5)} fill={`url(#${id}-bloom)`} opacity={bloomO} style={{ mixBlendMode: "screen" }} />
      <ellipse
        cx={n1(sun.x)}
        cy={horizonY}
        rx={n1(sunR * 14)}
        ry={n1(sunR * 2.2)}
        fill={`url(#${id}-bloom)`}
        opacity={bloomO * 0.7}
        style={{ mixBlendMode: "screen" }}
      />
      <g clipPath={`url(#${id}-above)`} opacity={discO}>
        <circle cx={n1(sun.x)} cy={n1(sun.y)} r={n1(sunR * 1.5)} fill="#fff1cc" opacity={0.28} />
        <circle cx={n1(sun.x)} cy={n1(sun.y)} r={sunR} fill={`url(#${id}-disc)`} />
      </g>
      {mist && (
        <GhibliMorningMist
          y={mistO.y ?? horizonY + 120}
          x0={mistO.x0 ?? R.x}
          x1={mistO.x1 ?? R.x + R.w}
          height={mistO.height}
          opacity={mistO.opacity}
          lifeF={lf}
          lift={sstep(0.25, 1, sun.p)}
        />
      )}
      {birds && (
        <GhibliBirdFlock
          f={f}
          start={birdO.start ?? start + dur * 0.45}
          dur={birdO.dur ?? 170}
          from={{ x: R.x + 500, y: birdO.y ?? horizonY - 230 }}
          to={{ x: R.x + R.w - 500, y: (birdO.y ?? horizonY - 230) - 70 }}
          count={birdO.count ?? 9}
          formation={birdO.formation ?? "loose"}
          s={birdO.s ?? 1}
          lifeF={lf}
        />
      )}
    </g>
  );
};

/** An opening light passes through (stage px). `arch` = rounded top (semicircle over the width). */
export interface GhibliOpening {
  x: number;
  y: number;
  w: number;
  h: number;
  arch?: boolean;
}

const openingOutline = (o: GhibliOpening): GPt[] => {
  const pts: GPt[] = [
    { x: o.x, y: o.y + o.h },
    { x: o.x + o.w, y: o.y + o.h },
  ];
  if (o.arch) {
    const r = o.w / 2;
    const cy = o.y + r;
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI;
      pts.push({ x: o.x + r + Math.cos(a) * r, y: cy - Math.sin(a) * r });
    }
  } else {
    pts.push({ x: o.x + o.w, y: o.y }, { x: o.x, y: o.y });
  }
  return pts;
};

/**
 * Soft volumetric god-rays through openings (arches, windows, gaps in leaves), with drifting dust motes inside the
 * beams. Light comes from a point (`light`, e.g. the sun state from ghibliSunrise, rays diverge) or a direction
 * (`angle`, degrees: the direction the light TRAVELS on screen, 0 = right, 90 = straight down, 120 = down-left).
 * Animate angle/length/intensity per frame (e.g. a sweep while the sun rises). Screen blend, no glow.
 *
 *   <GhibliSunRays lifeF={lifeF} openings={[{ x: 610, y: 300, w: 120, h: 260, arch: true }]}
 *      angle={lerp(150, 118, sun.u)} length={lerp(1100, 700, sun.u)} intensity={0.5} />
 */
export const GhibliSunRays: React.FC<{
  lifeF: number;
  openings: GhibliOpening[];
  light?: GPt;
  angle?: number;
  /** Beam length (px, default 800). */
  length?: number;
  /** 0..1 (default 0.45). */
  intensity?: number;
  color?: string;
  /** How much a beam widens over its length in `angle` mode (default 0.12). */
  spread?: number;
  /** Dust motes per beam (default 10, 0 = none). */
  motes?: number;
  seed?: number;
  /** Optional clip rectangle (e.g. the floor + air in front of the arches). */
  clip?: GRect;
}> = ({ lifeF, openings, light, angle = 120, length = 800, intensity = 0.45, color = "#fff0c8", spread = 0.12, motes = 10, seed = 3, clip }) => {
  const id = useSid("grays");
  if (intensity <= 0.005) return null;
  const a = (angle * Math.PI) / 180;
  const shimmer = 0.92 + 0.08 * noise1(lifeF * 0.02, seed);
  return (
    <g pointerEvents="none" opacity={clamp(intensity) * shimmer} style={{ mixBlendMode: "screen" }}>
      <defs>
        {clip && (
          <clipPath id={`${id}-clip`}>
            <rect x={clip.x} y={clip.y} width={clip.w} height={clip.h} />
          </clipPath>
        )}
      </defs>
      <g clipPath={clip ? `url(#${id}-clip)` : undefined}>
        {openings.map((o, bi) => {
          const near = openingOutline(o);
          const c = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
          const axis = light
            ? (() => {
                const dx = c.x - light.x;
                const dy = c.y - light.y;
                const L = Math.hypot(dx, dy) || 1;
                return { x: dx / L, y: dy / L };
              })()
            : { x: Math.cos(a), y: Math.sin(a) };
          const perp = { x: -axis.y, y: axis.x };
          const beam = (grow: number) => {
            const nn = near.map((q) => ({ x: c.x + (q.x - c.x) * grow, y: c.y + (q.y - c.y) * grow }));
            const far = nn.map((q) => {
              let d = axis;
              if (light) {
                const dx = q.x - light.x;
                const dy = q.y - light.y;
                const L = Math.hypot(dx, dy) || 1;
                d = { x: dx / L, y: dy / L };
              }
              const side = (q.x - c.x) * perp.x + (q.y - c.y) * perp.y;
              const wide = light ? 0 : side * spread * (length / 300);
              return { x: q.x + d.x * length + perp.x * wide, y: q.y + d.y * length + perp.y * wide };
            });
            return hull(nn.concat(far));
          };
          const end = { x: c.x + axis.x * length, y: c.y + axis.y * length };
          const core = beam(1);
          // widths across the beam at the opening and at the far end (for motes)
          const across = (pts: GPt[]) => {
            const v = pts.map((q) => (q.x - c.x) * perp.x + (q.y - c.y) * perp.y);
            return [Math.min(...v), Math.max(...v)];
          };
          const [nw0, nw1] = across(near);
          const farPts = core.filter((q) => (q.x - c.x) * axis.x + (q.y - c.y) * axis.y > length * 0.5);
          const [fw0, fw1] = farPts.length ? across(farPts.map((q) => ({ x: q.x - axis.x * length, y: q.y - axis.y * length }))) : [nw0, nw1];
          return (
            <g key={bi}>
              <defs>
                <linearGradient id={`${id}-g${bi}`} x1={n1(c.x)} y1={n1(c.y)} x2={n1(end.x)} y2={n1(end.y)} gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                  <stop offset="45%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <clipPath id={`${id}-c${bi}`}>
                  <path d={polyD(core)} />
                </clipPath>
              </defs>
              {/* three nested hulls fake a soft edge without a blur filter */}
              <path d={polyD(beam(1.32))} fill={`url(#${id}-g${bi})`} opacity={0.22} />
              <path d={polyD(beam(1.14))} fill={`url(#${id}-g${bi})`} opacity={0.3} />
              <path d={polyD(core)} fill={`url(#${id}-g${bi})`} opacity={0.55} />
              {motes > 0 && (
                <g clipPath={`url(#${id}-c${bi})`}>
                  {Array.from({ length: motes }, (_, i) => {
                    const h1 = hash(i * 5.13 + bi * 31 + seed);
                    const h2 = hash(i * 9.71 + bi * 17 + seed * 3);
                    const u = (((h1 + lifeF * (0.0007 + h2 * 0.0008)) % 1) + 1) % 1;
                    const w0 = lerp(nw0, fw0, u);
                    const w1 = lerp(nw1, fw1, u);
                    const v = lerp(w0, w1, 0.15 + 0.7 * ((h2 + 0.08 * Math.sin(lifeF * 0.02 + i)) % 1));
                    const px = c.x + axis.x * length * u * 0.85 + perp.x * v + Math.sin(lifeF * 0.03 + i * 1.7) * 4;
                    const py = c.y + axis.y * length * u * 0.85 + perp.y * v + Math.cos(lifeF * 0.026 + i) * 4;
                    const tw = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(lifeF * (0.05 + h1 * 0.04) + i * 2.1), 2);
                    return <circle key={i} cx={n1(px)} cy={n1(py)} r={n2(1 + h2 * 1.6)} fill="#fffbea" opacity={tw * Math.sin(u * Math.PI)} />;
                  })}
                </g>
              )}
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** A shadow caster standing on the floor: base centre (x, y), width w, height h (px). */
export interface GhibliCaster {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Soft cast shadows (pillars, posts, a tulsi mancha) that lengthen, shorten and turn with the sun. Shadow length
 * = h / tan(elevation) foreshortened by `squash` onto the floor. Drive `elevation` from ghibliSunrise(...).elevation
 * for a sunrise (shadows shorten) or lower it for the afternoon (shadows creep longer). Multiply blend.
 *
 *   <GhibliMovingShadows casters={[{ x: 520, y: 760, w: 70, h: 360 }]} azimuth={168} elevation={sun.elevation} />
 */
export const GhibliMovingShadows: React.FC<{
  casters: GhibliCaster[];
  /** Screen direction the shadows fall from the base (deg; 180 = left, 160 = left and slightly down). */
  azimuth: number;
  /** Sun elevation in degrees (5 = long, 60 = short). */
  elevation: number;
  /** Floor foreshortening of the y component (default 0.35). */
  squash?: number;
  /** Cap on the length (px, default 1400). */
  maxLen?: number;
  opacity?: number;
  color?: string;
  clip?: GRect;
}> = ({ casters, azimuth, elevation, squash = 0.35, maxLen = 1400, opacity = 0.32, color = "#3c2a24", clip }) => {
  const id = useSid("gmsh");
  const a = (azimuth * Math.PI) / 180;
  const tanE = Math.tan((clamp(elevation, 3, 85) * Math.PI) / 180);
  return (
    <g pointerEvents="none" opacity={opacity} style={{ mixBlendMode: "multiply" }}>
      <defs>
        {clip && (
          <clipPath id={`${id}-clip`}>
            <rect x={clip.x} y={clip.y} width={clip.w} height={clip.h} />
          </clipPath>
        )}
      </defs>
      <g clipPath={clip ? `url(#${id}-clip)` : undefined}>
        {casters.map((c, i) => {
          const len = Math.min(maxLen, c.h / tanE);
          const dx = Math.cos(a) * len;
          const dy = Math.sin(a) * len * squash;
          const quad = (grow: number) =>
            polyD([
              { x: c.x - (c.w / 2) * grow, y: c.y },
              { x: c.x + (c.w / 2) * grow, y: c.y },
              { x: c.x + (c.w / 2) * 1.25 * grow + dx, y: c.y + dy },
              { x: c.x - (c.w / 2) * 1.25 * grow + dx, y: c.y + dy },
            ]);
          return (
            <g key={i}>
              <defs>
                <linearGradient id={`${id}-g${i}`} x1={c.x} y1={c.y} x2={n1(c.x + dx)} y2={n1(c.y + dy)} gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                  <stop offset="70%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.12} />
                </linearGradient>
              </defs>
              <path d={quad(1.5)} fill={`url(#${id}-g${i})`} opacity={0.25} />
              <path d={quad(1.2)} fill={`url(#${id}-g${i})`} opacity={0.35} />
              <path d={quad(1)} fill={`url(#${id}-g${i})`} opacity={0.6} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

/**
 * Moving leaf-dapple light and shade under a tree, laid over the ground AND characters standing there (put it in a
 * layer above the characters at their depth). "light" = warm flecks (screen), "shadow" = cool leaf shade
 * (multiply), "both" = both. Edges fade softly so no rectangle shows.
 *
 *   <GhibliDappledLight region={{ x: 1100, y: 560, w: 700, h: 420 }} lifeF={lifeF} intensity={0.6} />
 */
export const GhibliDappledLight: React.FC<{
  region: GRect;
  lifeF: number;
  mode?: "both" | "light" | "shadow";
  intensity?: number;
  /** Blob density multiplier (default 1). */
  density?: number;
  /** Vertical squash of the blobs (0.45 = lying on a floor; 1 = on a wall or figure). */
  squash?: number;
  wind?: number;
  lightColor?: string;
  shadeColor?: string;
  seed?: number;
}> = ({ region, lifeF, mode = "both", intensity = 0.55, density = 1, squash = 0.5, wind = 1, lightColor = "#fff1c6", shadeColor = "#2e3622", seed = 13 }) => {
  const id = useSid("gdap");
  const R = region;
  const n = Math.round(clamp(((R.w * R.h) / 9000) * density, 8, 70));
  const blob = (i: number, kind: "l" | "s") => {
    const h1 = hash(i * 3.3 + seed + (kind === "l" ? 0 : 50));
    const h2 = hash(i * 7.7 + seed * 1.3 + (kind === "l" ? 9 : 77));
    const h3 = hash(i * 1.9 + seed * 0.7 + (kind === "l" ? 21 : 33));
    const t = lifeF * 0.03 * wind;
    const x = R.x + h1 * R.w + Math.sin(t + h2 * 6) * 10 * wind + noise1(lifeF * 0.012 * wind, seed + i) * 14;
    const y = R.y + h2 * R.h + Math.cos(t * 0.8 + h1 * 5) * 4 * wind;
    const r = kind === "l" ? 8 + h3 * 20 : 30 + h3 * 46;
    const breathe = 1 + 0.12 * Math.sin(t * 1.3 + i);
    const op = kind === "l" ? clamp(0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + h3 * 9)) ) : 0.55 + 0.25 * Math.sin(t + i);
    return (
      <ellipse
        key={`${kind}${i}`}
        cx={n1(x)}
        cy={n1(y)}
        rx={n1(r * breathe)}
        ry={n1(r * breathe * squash)}
        transform={`rotate(${n1((h1 - 0.5) * 30)} ${n1(x)} ${n1(y)})`}
        fill={`url(#${id}-${kind})`}
        opacity={op}
      />
    );
  };
  return (
    <g pointerEvents="none" opacity={intensity}>
      <defs>
        <radialGradient id={`${id}-l`}>
          <stop offset="0%" stopColor={lightColor} stopOpacity={0.9} />
          <stop offset="55%" stopColor={lightColor} stopOpacity={0.45} />
          <stop offset="100%" stopColor={lightColor} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0%" stopColor={shadeColor} stopOpacity={0.55} />
          <stop offset="60%" stopColor={shadeColor} stopOpacity={0.28} />
          <stop offset="100%" stopColor={shadeColor} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-m`}>
          <stop offset="0%" stopColor="#fff" />
          <stop offset="65%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={R.x - 80} y={R.y - 80} width={R.w + 160} height={R.h + 160}>
          <ellipse cx={R.x + R.w / 2} cy={R.y + R.h / 2} rx={R.w * 0.56} ry={R.h * 0.56} fill={`url(#${id}-m)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        {mode !== "light" && <g style={{ mixBlendMode: "multiply" }}>{Array.from({ length: Math.ceil(n * 0.45) }, (_, i) => blob(i, "s"))}</g>}
        {mode !== "shadow" && <g style={{ mixBlendMode: "screen" }}>{Array.from({ length: n }, (_, i) => blob(i, "l"))}</g>}
      </g>
    </g>
  );
};

/**
 * Slow soft cloud shadows sliding across ground or water. Clip to a rectangle (`region`) or any path (`shape`, e.g.
 * the pond outline). Multiply blend.
 *
 *   <GhibliCloudShadows region={{ x: -400, y: 560, w: 2700, h: 300 }} lifeF={lifeF} speed={0.5} opacity={0.2} />
 */
export const GhibliCloudShadows: React.FC<{
  region: GRect;
  /** Optional clip path (stage px); the region still sets where clouds travel. */
  shape?: string;
  lifeF: number;
  /** px per frame (default 0.5); negative = right to left. */
  speed?: number;
  count?: number;
  opacity?: number;
  /** Vertical squash of the shadows (default 0.4 for a floor seen at an angle). */
  squash?: number;
  /** Size multiplier (default 1: clouds ~600 px across). */
  size?: number;
  color?: string;
  seed?: number;
}> = ({ region, shape, lifeF, speed = 0.5, count = 3, opacity = 0.2, squash = 0.4, size = 1, color = "#2f3648", seed = 7 }) => {
  const id = useSid("gcld");
  const R = region;
  const cw = 650 * size;
  const span = R.w + cw * 2;
  return (
    <g pointerEvents="none" opacity={opacity} style={{ mixBlendMode: "multiply" }}>
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0%" stopColor={color} stopOpacity={0.8} />
          <stop offset="55%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-clip`}>{shape ? <path d={shape} /> : <rect x={R.x} y={R.y} width={R.w} height={R.h} />}</clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        {Array.from({ length: count }, (_, i) => {
          const h1 = hash(i * 4.1 + seed);
          const h2 = hash(i * 6.7 + seed * 2);
          const x = R.x - cw + ((((h1 * span + lifeF * speed * (0.8 + h2 * 0.4)) % span) + span) % span);
          const y = R.y + R.h * (0.2 + 0.6 * h2);
          return (
            <g key={i}>
              {[0, 1, 2, 3].map((k) => {
                const hk = hash(i * 13 + k * 3.3 + seed);
                return (
                  <ellipse
                    key={k}
                    cx={n1(x + (k - 1.5) * cw * 0.22 + (hk - 0.5) * 60)}
                    cy={n1(y + (hk - 0.5) * 50 * squash)}
                    rx={n1(cw * (0.28 + hk * 0.18))}
                    ry={n1(cw * (0.28 + hk * 0.18) * squash)}
                    fill={`url(#${id}-g)`}
                  />
                );
              })}
            </g>
          );
        })}
      </g>
    </g>
  );
};

/**
 * Rippling caustic light lines reflected from water onto a wall, ghat steps or a tree trunk. Bright near the water
 * (`fade="bottom"` when the water is below the region), drifting slowly upward. Screen blend.
 *
 *   <GhibliWaterLight region={{ x: 40, y: 760, w: 600, h: 180 }} lifeF={lifeF} intensity={0.45} />
 */
export const GhibliWaterLight: React.FC<{
  region: GRect;
  lifeF: number;
  intensity?: number;
  color?: string;
  /** Pattern scale (default 1). */
  scale?: number;
  fade?: "bottom" | "top" | "none";
  speed?: number;
  /** Number of caustic strands (default by height). */
  lines?: number;
  /** Optional clip path (e.g. a step face) instead of the region rectangle. */
  shape?: string;
  seed?: number;
}> = ({ region, lifeF, intensity = 0.45, color = "#fff7de", scale = 1, fade = "bottom", speed = 1, lines, shape, seed = 2 }) => {
  const id = useSid("gwl");
  const R = region;
  const spacing = 18 * scale;
  const n = lines ?? Math.max(4, Math.ceil(R.h / spacing) + 2);
  const drift = (lifeF * 0.22 * speed) % spacing;
  const step = 16 * scale;
  const nx = Math.ceil(R.w / step) + 2;
  return (
    <g pointerEvents="none" opacity={intensity} style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${id}-fade`} x1="0" y1={R.y} x2="0" y2={R.y + R.h} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity={fade === "bottom" ? 0.1 : 1} />
          <stop offset="100%" stopColor="#fff" stopOpacity={fade === "top" ? 0.1 : 1} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={R.x} y={R.y} width={R.w} height={R.h}>
          <rect x={R.x} y={R.y} width={R.w} height={R.h} fill={`url(#${id}-fade)`} />
        </mask>
        <clipPath id={`${id}-c`}>{shape ? <path d={shape} /> : <rect x={R.x} y={R.y} width={R.w} height={R.h} />}</clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`} mask={fade === "none" ? undefined : `url(#${id}-m)`}>
        {Array.from({ length: n }, (_, i) => {
          const y0 = R.y + R.h + spacing - i * spacing - drift;
          const ph = hash(i * 2.7 + seed) * 6.28;
          const strand = (k: number) => {
            const pts: string[] = [];
            for (let j = 0; j < nx; j++) {
              const x = R.x - step + j * step;
              const y =
                y0 +
                Math.sin(x * (0.028 / scale) + lifeF * 0.09 * speed + ph + k * 2.2) * 5.5 * scale +
                Math.sin(x * (0.067 / scale) - lifeF * 0.13 * speed + ph * 1.7 + k) * 2.6 * scale;
              pts.push(`${n1(x)} ${n1(y)}`);
            }
            return `M ${pts.join(" L ")}`;
          };
          const flick = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(lifeF * 0.07 * speed + ph * 3));
          return (
            <g key={i} opacity={flick}>
              <path d={strand(0)} fill="none" stroke={color} strokeWidth={n2((1.1 + hash(i + seed) * 1.6) * scale)} strokeLinecap="round" />
              <path d={strand(1)} fill="none" stroke={color} strokeWidth={n2(0.9 * scale)} strokeLinecap="round" opacity={0.6} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

/**
 * A cool moonbeam through a barred window: the volume of light from the window to the floor, the lit patch on the
 * floor with the bar shadows in it, and a few slow motes. `floor` = where the window's corners land on the floor
 * [top-left, top-right, bottom-right, bottom-left] (the scene decides the moon's direction). Screen blend.
 *
 *   <GhibliMoonbeam window={{ x: 1380, y: 260, w: 170, h: 230, bars: 5 }} lifeF={lifeF}
 *      floor={[{ x: 820, y: 900 }, { x: 1080, y: 880 }, { x: 1180, y: 1010 }, { x: 860, y: 1040 }]} />
 */
export const GhibliMoonbeam: React.FC<{
  window: GRect & { bars?: number; barW?: number; crossbar?: boolean };
  floor: [GPt, GPt, GPt, GPt];
  lifeF: number;
  intensity?: number;
  color?: string;
  /** Show the volume between window and floor (default true). */
  beam?: boolean;
  motes?: number;
  /** Draw dark bar silhouettes over the window itself (for a plain wall; default false). */
  drawBars?: boolean;
  seed?: number;
}> = ({ window: W, floor, lifeF, intensity = 0.55, color = "#cfdcf0", beam = true, motes = 12, drawBars = false, seed = 4 }) => {
  const id = useSid("gmoon");
  const bars = W.bars ?? 5;
  const barW = W.barW ?? Math.max(4, W.w * 0.045);
  const [F0, F1, F2, F3] = floor;
  // bilinear maps window (u right, v down) -> window plane and -> floor quad
  const winPt = (u: number, v: number): GPt => ({ x: W.x + u * W.w, y: W.y + v * W.h });
  const flPt = (u: number, v: number): GPt => {
    const top = { x: lerp(F0.x, F1.x, u), y: lerp(F0.y, F1.y, u) };
    const bot = { x: lerp(F3.x, F2.x, u), y: lerp(F3.y, F2.y, u) };
    return { x: lerp(top.x, bot.x, v), y: lerp(top.y, bot.y, v) };
  };
  const bu = barW / W.w;
  const cols: Array<[number, number]> = [];
  for (let i = 0; i <= bars; i++) {
    const a = i === 0 ? 0 : i / (bars + 1) + bu / 2;
    const b = i === bars ? 1 : (i + 1) / (bars + 1) - bu / 2;
    cols.push([a, b]);
  }
  const rows: Array<[number, number]> = W.crossbar ? [[0, 0.48], [0.52, 1]] : [[0, 1]];
  const cell = (map: (u: number, v: number) => GPt, [a, b]: [number, number], [c, d]: [number, number]) => [map(a, c), map(b, c), map(b, d), map(a, d)];
  const wc = winPt(0.5, 0.5);
  const fc = flPt(0.5, 0.5);
  const whole = hull([winPt(0, 0), winPt(1, 0), winPt(1, 1), winPt(0, 1), F0, F1, F2, F3]);
  const breathe = 0.94 + 0.06 * Math.sin(lifeF * 0.013 + seed);
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={`${id}-v`} x1={n1(wc.x)} y1={n1(wc.y)} x2={n1(fc.x)} y2={n1(fc.y)} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity={0.5} />
          <stop offset="100%" stopColor={color} stopOpacity={0.12} />
        </linearGradient>
        <clipPath id={`${id}-all`}>
          <path d={polyD(whole)} />
        </clipPath>
        <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={1.8} />
        </filter>
      </defs>
      <g opacity={intensity * breathe} style={{ mixBlendMode: "screen" }}>
        {beam &&
          cols.map((cl, i) =>
            rows.map((rw, j) => (
              <path key={`b${i}-${j}`} d={polyD(hull(cell(winPt, cl, rw).concat(cell(flPt, cl, rw))))} fill={`url(#${id}-v)`} opacity={0.42} />
            )),
          )}
        <g filter={`url(#${id}-soft)`}>
          {cols.map((cl, i) => rows.map((rw, j) => <path key={`f${i}-${j}`} d={polyD(cell(flPt, cl, rw))} fill={color} opacity={0.62} />))}
        </g>
        {motes > 0 && (
          <g clipPath={`url(#${id}-all)`}>
            {Array.from({ length: motes }, (_, i) => {
              const h1 = hash(i * 3.9 + seed);
              const h2 = hash(i * 8.3 + seed * 2);
              const t = (((h1 + lifeF * (0.0009 + h2 * 0.0006)) % 1) + 1) % 1;
              const p = { x: lerp(wc.x, fc.x, t) + (h2 - 0.5) * W.w * 1.1 + Math.sin(lifeF * 0.02 + i) * 6, y: lerp(wc.y, fc.y, t) + Math.cos(lifeF * 0.017 + i) * 5 };
              return <circle key={i} cx={n1(p.x)} cy={n1(p.y)} r={n2(0.9 + h2 * 1.2)} fill="#eef4ff" opacity={0.6 * Math.sin(t * Math.PI)} />;
            })}
          </g>
        )}
      </g>
      {drawBars && (
        <g>
          {Array.from({ length: bars }, (_, i) => {
            const x = W.x + ((i + 1) / (bars + 1)) * W.w - barW / 2;
            return <rect key={i} x={n1(x)} y={W.y} width={n1(barW)} height={W.h} fill="#2a2420" stroke={GHIBLI_INK} strokeWidth={0.8} />;
          })}
          {W.crossbar && <rect x={W.x} y={W.y + W.h * 0.48} width={W.w} height={W.h * 0.04} fill="#2a2420" />}
        </g>
      )}
    </g>
  );
};

/* -------------------------------------------------------------------------------------------------------------- */
/* Set dressing (STO-22c). Small painted marks so cut-out feet, water and a run sit in the picture.               */
/* -------------------------------------------------------------------------------------------------------------- */

const TUFT = "#5d6b3a";
const LEAF = "#7a4a28";

/**
 * Grass, reeds or leaf litter along a ground line. `part="back"` is the row behind the feet,
 * `part="front"` the blades that overlap the cut. `preset` only changes the mix.
 */
export const GhibliGroundCover: React.FC<{
  x: number;
  y: number;
  w: number;
  lifeF: number;
  s?: number;
  preset?: "garden" | "pond" | "courtyard" | "grove";
  litter?: boolean;
  part?: "all" | "back" | "front";
}> = ({ x, y, w, lifeF, s = 1, preset = "courtyard", litter = true, part = "all" }) => {
  const n = Math.max(4, Math.round(w / (28 * s)));
  const reeds = preset === "pond" || preset === "grove";
  const showBack = part !== "front";
  const showFront = part !== "back";
  return (
    <g pointerEvents="none">
      {Array.from({ length: n }, (_, i) => {
        const h = hash(i * 4.1 + x * 0.01);
        const px = x - w / 2 + ((i + 0.3 + h * 0.4) / n) * w;
        const sway = Math.sin(lifeF * 0.05 + i) * (reeds ? 4 : 1.6) * s;
        const bh = (reeds ? 28 + h * 36 : 10 + h * 14) * s;
        const by = y + (h - 0.5) * 4 * s;
        return (
          <g key={i}>
            {showBack && (
              <path
                d={`M ${n1(px)} ${n1(by)} q ${n1(sway)} ${n1(-bh * 0.55)} ${n1(sway * 0.35)} ${n1(-bh)}`}
                fill="none"
                stroke={reeds ? "#6d7a48" : TUFT}
                strokeWidth={reeds ? 1.6 : 1.2}
                strokeLinecap="round"
                opacity={0.45}
              />
            )}
            {showFront && h > 0.45 && (
              <path
                d={`M ${n1(px + 3)} ${n1(by + 2)} q ${n1(-sway)} ${n1(-bh * 0.4)} ${n1(2)} ${n1(-bh * 0.65)}`}
                fill="none"
                stroke={TUFT}
                strokeWidth={1.3}
                strokeLinecap="round"
                opacity={0.7}
              />
            )}
            {litter && showFront && h > 0.72 && (
              <ellipse
                cx={n1(px)}
                cy={n1(by + 1)}
                rx={n1((6 + h * 8) * s)}
                ry={n1(2.4 * s)}
                fill={h > 0.85 ? LEAF : "#8a6840"}
                opacity={0.55}
                transform={`rotate(${n1((h - 0.5) * 50)} ${n1(px)} ${n1(by)})`}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

/** A few reeds. Same ground line as the feet. */
export const GhibliReeds: React.FC<{ x: number; y: number; w: number; lifeF: number; s?: number }> = (p) => (
  <GhibliGroundCover {...p} preset="pond" litter={false} />
);

/** Lily pads on a water region. `lifeF` rocks them. */
export const GhibliLilyPads: React.FC<{
  pads?: Array<{ x: number; y: number; kind?: "lily" | "lotus" | "bud" }>;
  lifeF: number;
  s?: number;
}> = ({ pads = [], lifeF, s = 1 }) => (
  <g pointerEvents="none">
    {pads.map((p, i) => {
      const rock = Math.sin(lifeF * 0.04 + i) * 1.5;
      const col = p.kind === "lotus" ? "#e09098" : p.kind === "bud" ? "#d8e2c0" : "#f4f0e4";
      return (
        <g key={i} transform={`translate(${n1(p.x)} ${n1(p.y + rock)})`}>
          <ellipse cx={0} cy={0} rx={16 * s} ry={7 * s} fill="#3e6a40" opacity={0.85} />
          <ellipse cx={-4 * s} cy={-1} rx={7 * s} ry={3.5 * s} fill="#4e7a48" />
          <circle cx={2 * s} cy={-5 * s} r={(p.kind === "bud" ? 3 : 4.5) * s} fill={col} opacity={0.9} />
        </g>
      );
    })}
  </g>
);

/** A puff of dust at the feet. `start` is the frame the foot lands. */
export const GhibliDustPuff: React.FC<{ x: number; y: number; f: number; start: number; s?: number }> = ({ x, y, f, start, s = 1 }) => {
  const t = (f - start) / 16;
  if (t < 0 || t > 1) return null;
  return (
    <g pointerEvents="none" opacity={1 - t}>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI - 0.4;
        return (
          <circle
            key={i}
            cx={n1(x + Math.cos(a) * 10 * t * s)}
            cy={n1(y - (4 + i * 3) * t * s)}
            r={n1((2 + t * 3) * s)}
            fill="#c4a882"
            opacity={0.45}
          />
        );
      })}
    </g>
  );
};
