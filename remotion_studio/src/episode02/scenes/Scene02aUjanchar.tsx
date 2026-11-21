import React from "react";
import { Easing, interpolate } from "remotion";
import { Cam, Layer, Stage } from "../../cinematic/core/Stage";
import { clamp } from "../../cinematic/core/anim";
import { EP02_DISSOLVES, EP02_PAUSES, EP02_SCENES } from "../timing";
import { cueLocalStory, useStory } from "../../episode/storyClock";

/**
 * Episode 2 · scene 02a_ujanchar: arrival (plan "02a_ujanchar: arrival" in Ep02_Shots_and_Pauses_DRAFT.md,
 * STO-09, STO-16, CAM-13, CAM-14). Its real length is read from EP02_SCENES (207 frames at today's timing:
 * 171 story frames plus a 36-frame END pause).
 * One held wide aerial of Ujanchar Krishnanagar: a riverside village ringed on all sides by dense jungle,
 * seen in golden evening light as dusk falls (the next scene is the night-time fox scene).
 *
 * The cart ride is gone from this scene: the journey scene (02a0_journey_to_ujanchar) carries it now and
 * cross-dissolves into this wide over its last 40 frames (EP02_DISSOLVES).
 *
 * Shots (story frames f from useStory; keys tied to the narration with cueLocalStory, CAM-13):
 *  1. From local 0: the wide aerial, HELD (no push). It comes in by the cross-dissolve from the journey's
 *     J6 (dusk gold): this whole scene fades up from opacity 0 over the dissolve frames, drawn over the
 *     journey's last shot (no dark backdrop, no fade through black). The line "চারদিকে জঙ্গলঘেরা উজানচর
 *     কৃষ্ণনগর।" starts about 0.6 s in. Smoke rises from the huts, mist lies on the river.
 *  2. After the line (today's end hold) the evening lamps in two hut doorways and at the temple come on,
 *     the fireflies wake, and a first small flock flies home into the far forest.
 *  END pause (EP02_PAUSES, 36 f): the story holds; a second flock flies home into the far forest left of
 *     the sun, and the light dims toward dusk (a cool multiply wash over the pause). Then Episode02 keeps
 *     this picture rendering for 44 more frames past the scene's end while the night-kitchen fox scene
 *     cross-dissolves in over it (kept).
 *  Life never stops (lifeF, the real local frame): smoke, mist, water glitter, palm sway, light shafts,
 *  fireflies and birds keep moving through the pause and under the outgoing dissolve.
 *
 * Wide shot layers (back to front): golden evening sky with the low sun and lit cloud streaks; three
 * misty blue-green distant tree lines with mist between them; birds flying home into the far forest;
 * the valley (ground, the winding river with sky and tree reflections and sun glitter, the forest ring of
 * mango, banyan, bamboo clumps, banana and tall palms around the thatched huts, the small temple and two
 * country boats); hut smoke; low mist; soft light shafts from the sun; fireflies and light motes; dark near
 * foliage framing the edges. Every plane is drawn wider than the frame, so the held framing never shows an
 * edge. There is no on-screen place-name title or name board; the narration caption names Ujanchar.
 * No characters appear in this shot, so there is no divine light in it.
 */

const SCENE_ID = "02a_ujanchar";
/** The scene's real length, from the episode timing (story frames plus the END pause). */
const DUR = EP02_SCENES.find((s) => s.sceneId === SCENE_ID)?.durationFrames ?? 207;
/** The END pause: the story holds at its atStory while the birds fly home and the light dims. */
const END_PAUSE = EP02_PAUSES.find((p) => p.sceneId === SCENE_ID) ?? { atStory: DUR - 1, frames: 0 };
/** Real local frame where the END pause begins (it is the scene's only pause, so real = story here). */
const PAUSE0 = END_PAUSE.atStory;
/** The cross-dissolve in from the journey: this scene fades up over the journey's last shot for these frames. */
const DISSOLVE_IN = EP02_DISSOLVES.find((d) => d.into === SCENE_ID)?.frames ?? 40;
/** The narration line (story frames, scene-local). */
const LINE = cueLocalStory("চারদিকে জঙ্গলঘেরা", SCENE_ID) ?? { from: 14, to: 124 };
/** Evening lamps come on just after the line ends... */
const LAMP0 = LINE.to + 10;
/** ...and the fireflies wake a little after them. */
const MOTES0 = LINE.to + 16;
/** First flock (end hold): it sets off just after the line and is gone before the pause. */
const BIRDS_FROM = LINE.to + 2;
const BIRDS_FLIGHT = Math.max(20, Math.min(34, PAUSE0 - BIRDS_FROM - 12));
/** Second flock (the END pause moment): it flies home into the far forest during the pause. */
const BIRDS2_FROM = PAUSE0 - 4;
const BIRDS2_FLIGHT = Math.max(20, END_PAUSE.frames - 4);
/** Outgoing dusk: the light dims over the END pause (no fade to dark: the fox scene dissolves in over it). */
const DIM0 = PAUSE0;
const DIM1 = Math.max(PAUSE0 + 12, DUR - 2);

/** Deterministic pseudo-random in [0, 1). */
const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * Mud hut with a thatched roof. (x, y) is the centre of the floor line. `lamp` (0 to 1) lights a small
 * evening lamp in the doorway (the wide shot only; it uses the wide shot's lamp gradient).
 */
const Hut: React.FC<{ x: number; y: number; w: number; h: number; lamp?: number }> = ({ x, y, w, h, lamp = 0 }) => {
  const wallTop = y - h * 0.5;
  const ridgeY = y - h * 1.12;
  return (
    <g>
      <rect x={x - w / 2} y={wallTop} width={w} height={h * 0.5} fill="#c49a72" />
      <rect x={x + w * 0.12} y={wallTop} width={w * 0.38} height={h * 0.5} fill="#a6805b" />
      <rect x={x - w * 0.08} y={y - h * 0.22} width={w * 0.16} height={h * 0.22} fill="#2b1d14" />
      <path
        d={`M ${x - w * 0.68} ${wallTop + h * 0.04} L ${x} ${ridgeY} L ${x + w * 0.68} ${wallTop + h * 0.04} Q ${x} ${wallTop - h * 0.05} ${x - w * 0.68} ${wallTop + h * 0.04} Z`}
        fill="#b98a3e"
      />
      {[-0.4, -0.15, 0.1, 0.35].map((t) => (
        <line
          key={t}
          x1={x + w * t * 0.9}
          y1={wallTop + h * 0.02}
          x2={x + w * t * 0.1}
          y2={ridgeY + h * 0.12}
          stroke="#7d5a24"
          strokeWidth={2}
          opacity={0.45}
        />
      ))}
      {lamp > 0.001 && (
        <g opacity={lamp}>
          <circle cx={x} cy={y - h * 0.1} r={w * 0.2} fill="url(#ujw-lamp)" />
          <circle cx={x} cy={y - h * 0.08} r={Math.max(1.5, w * 0.022)} fill="#fff1b8" />
        </g>
      )}
    </g>
  );
};

/** Small temple-style shrine, stepped curved roof, empty dark doorway. No deity is shown. */
const Shrine: React.FC<{ x: number; baseY: number }> = ({ x, baseY }) => (
  <g>
    <rect x={x - 96} y={baseY - 18} width={192} height={18} fill="#b7a58c" />
    <rect x={x - 62} y={baseY - 96} width={124} height={80} fill="#c9a27a" />
    <rect x={x + 18} y={baseY - 96} width={44} height={80} fill="#a9825c" />
    <rect x={x - 18} y={baseY - 66} width={36} height={48} fill="#2a1a14" />
    <path d={`M ${x - 92} ${baseY - 94} L ${x + 92} ${baseY - 94} L ${x + 72} ${baseY - 122} L ${x - 72} ${baseY - 122} Z`} fill="#9a6a3c" />
    <path d={`M ${x - 70} ${baseY - 120} L ${x + 70} ${baseY - 120} L ${x + 48} ${baseY - 148} L ${x - 48} ${baseY - 148} Z`} fill="#b07c44" />
    <path d={`M ${x - 46} ${baseY - 146} L ${x + 46} ${baseY - 146} L ${x + 26} ${baseY - 186} L ${x - 26} ${baseY - 186} Z`} fill="#c08c4c" />
    <path d={`M ${x - 24} ${baseY - 184} L ${x + 24} ${baseY - 184} L ${x} ${baseY - 228} Z`} fill="#b8893f" />
    <circle cx={x} cy={baseY - 232} r={6} fill="#b8893f" />
  </g>
);

/** Smooth 0 to 1 ramp, input clamped. */
const smoothStep = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/**
 * Every background plane runs from PLANE_L to PLANE_R and down to PLANE_B, well past the 1920 x 1080
 * frame, so the held framing never reveals an edge.
 */
const PLANE_L = -400;
const PLANE_R = 2320;
const PLANE_B = 1200;

/**
 * The held camera of the wide aerial (CAM-13: an establishing view is a held wide; no push, no drift). A touch
 * inside 1.0 so the near foliage frames the corners the way the journey's last shot leaves them.
 */
const WIDE_CAM: Cam = { x: 4, y: 6, zoom: 1.03 };

/* ------------------------------------------------------------------ */
/* The wide shot: Ujanchar ringed by jungle, in golden evening light   */
/* ------------------------------------------------------------------ */

/** Linear mix of two #rrggbb colours, t in [0, 1]. */
const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const tt = clamp(t);
  const ch = (sh: number) => {
    const ca = (pa >> sh) & 255;
    const cb = (pb >> sh) & 255;
    return Math.round(ca + (cb - ca) * tt);
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
};

/** The low evening sun, setting into the far misty forest above the river's source. */
const SUN = { x: 1010, y: 440 };
/** Ground horizon of the wide shot: the river emerges from the forest here. */
const WH = 566;
/** Atmospheric haze for the farther trees, the golden rim of the backlit canopies, and the near shadow. */
const W_HAZE = "#93a99a";
const W_RIM = "#f2c46c";
const W_DEEP = "#13221a";

/** Depth along the valley floor: 0 at the wide horizon, 1 at the bottom of the frame. */
const wideS = (y: number) => (y - WH) / (1080 - WH);
/** Perspective scale of a tree standing at y. */
const kOf = (y: number) => 0.22 + wideS(y) * 1.55;

/** The winding river: its centre line and half-width at height y (a meander widening toward the viewer). */
const wRiverC = (y: number) => {
  const s = Math.max(0, wideS(y));
  return 960 + Math.sin(s * 3.6 + 0.3) * (30 + 260 * s);
};
const wRiverHW = (y: number) => 4 + 255 * Math.pow(Math.max(0, wideS(y)), 1.45);
const W_RIVER_YS = Array.from({ length: 90 }, (_, i) => WH + i * 8);
/** Points along one bank (side -1 left, 1 right), or a line `inset` of the way in toward the centre. */
const wEdge = (side: -1 | 1, inset = 0) =>
  W_RIVER_YS.map((y) => `${(wRiverC(y) + side * wRiverHW(y) * (1 - inset)).toFixed(1)} ${y}`);
const W_RIVER_D = `M ${wEdge(-1).join(" L ")} L ${[...wEdge(1)].reverse().join(" L ")} Z`;
/** The forest's dark reflection in the water, a band along each bank. */
const W_REFL_L = `M ${wEdge(-1).join(" L ")} L ${[...wEdge(-1, 0.4)].reverse().join(" L ")} Z`;
const W_REFL_R = `M ${wEdge(1).join(" L ")} L ${[...wEdge(1, 0.4)].reverse().join(" L ")} Z`;
const W_BANK_L = `M ${wEdge(-1).join(" L ")}`;
const W_BANK_R = `M ${wEdge(1).join(" L ")}`;

type WKind = "mango" | "banyan" | "bamboo" | "banana" | "palm";
type WTreeItem = { kind: WKind; x: number; y: number; k: number; seed: number };
type WItem =
  | WTreeItem
  | { kind: "hut"; x: number; y: number; w: number; h: number; lamp: boolean }
  | { kind: "shrine"; x: number; y: number }
  | { kind: "boat"; x: number; y: number; s: number; seed: number };

/**
 * The forest ring: rows of trees from the far edge of the valley forward, kept off the river (with a
 * clear vista down it to the sun) and out of the village and temple yards in the nearer rows. The far
 * rows are mostly mango and banyan crowns with palms rising out of them; the nearer rows mix in bamboo
 * clumps and bananas.
 */
const W_ROWS = [578, 590, 603, 617, 632, 648, 665, 684];
const W_RING: WItem[] = [];
W_ROWS.forEach((ry, r) => {
  const step = 80 * kOf(ry) + 22;
  let x = -300 + rnd(r * 13 + 5) * step;
  let n = 0;
  while (x < 2220) {
    const seed = r * 101 + n;
    const y = ry + (rnd(seed * 1.7 + 3) - 0.5) * 10;
    const k = kOf(y) * (0.85 + rnd(seed * 2.3 + 1) * 0.35);
    const vista = Math.abs(x - wRiverC(y)) < wRiverHW(y) + 110 * k + 25;
    const yard = y > 664 && ((x > 60 && x < 770) || (x > 1310 && x < 1570));
    if (!vista && !yard) {
      const p = rnd(seed * 3.1 + 7);
      const kind: WKind =
        r < 3
          ? p < 0.6
            ? "mango"
            : p < 0.86
              ? "banyan"
              : "palm"
          : p < 0.36
            ? "mango"
            : p < 0.54
              ? "banyan"
              : p < 0.72
                ? "bamboo"
                : p < 0.86
                  ? "banana"
                  : "palm";
      W_RING.push({ kind, x, y, k, seed });
    }
    x += step * (0.7 + rnd(seed * 0.9 + 11) * 0.6);
    n++;
  }
});

/** Hand-placed trees around the huts and the temple, the big trees of the near jungle, the village and the boats. */
const W_FEATURES: WItem[] = [
  { kind: "palm", x: 300, y: 702, k: 0.66, seed: 901 },
  { kind: "palm", x: 828, y: 694, k: 0.6, seed: 902 },
  { kind: "palm", x: 52, y: 772, k: 0.86, seed: 903 },
  { kind: "palm", x: 1612, y: 772, k: 0.8, seed: 904 },
  { kind: "palm", x: 1812, y: 716, k: 0.72, seed: 905 },
  { kind: "bamboo", x: 466, y: 700, k: 0.62, seed: 911 },
  { kind: "banana", x: 612, y: 724, k: 0.66, seed: 912 },
  { kind: "banana", x: 182, y: 770, k: 0.72, seed: 913 },
  { kind: "bamboo", x: 1290, y: 752, k: 0.74, seed: 914 },
  { kind: "banana", x: 1566, y: 790, k: 0.8, seed: 915 },
  { kind: "mango", x: 1372, y: 690, k: 0.6, seed: 916 },
  { kind: "mango", x: 1530, y: 686, k: 0.58, seed: 917 },
  { kind: "mango", x: 742, y: 690, k: 0.6, seed: 918 },
  { kind: "banyan", x: -240, y: 905, k: 1.25, seed: 921 },
  { kind: "mango", x: 2010, y: 900, k: 1.3, seed: 922 },
  { kind: "bamboo", x: 1770, y: 884, k: 1.1, seed: 923 },
  { kind: "hut", x: 230, y: 716, w: 150, h: 120, lamp: false },
  { kind: "hut", x: 386, y: 728, w: 170, h: 132, lamp: true },
  { kind: "hut", x: 540, y: 708, w: 128, h: 108, lamp: false },
  { kind: "hut", x: 676, y: 738, w: 150, h: 122, lamp: true },
  { kind: "hut", x: 120, y: 748, w: 140, h: 112, lamp: false },
  { kind: "shrine", x: 1440, y: 770 },
  { kind: "boat", x: 1060, y: 712, s: 0.32, seed: 1 },
  { kind: "boat", x: 1050, y: 912, s: 0.7, seed: 2 },
];

/** Everything on the valley floor, drawn back to front. */
const W_ITEMS: WItem[] = [...W_RING, ...W_FEATURES].sort((a, b) => a.y - b.y);

const MANGO_C = ["#2f5232", "#365c36", "#2a4a2e", "#3c6038"];
const BANYAN_C = ["#3a5a34", "#33502f", "#405f38"];
/** Mango crown: a dense dome of overlapping rounds (unit coordinates, foot at the origin). */
const MANGO_BLOBS: Array<[number, number, number]> = [
  [0, -205, 92],
  [-72, -168, 70],
  [74, -166, 72],
  [-38, -258, 64],
  [42, -252, 66],
  [0, -140, 66],
  [-104, -206, 48],
  [106, -200, 50],
];
/** Banyan crown: broad and flat, spreading wider than it is tall. */
const BANYAN_EL: Array<[number, number, number, number]> = [
  [0, -232, 168, 60],
  [-132, -204, 100, 50],
  [134, -206, 104, 52],
  [-62, -272, 108, 48],
  [70, -268, 100, 46],
  [0, -190, 150, 38],
  [-205, -190, 52, 30],
  [210, -192, 54, 30],
];
/** Bamboo clump: the feathery leaf masses behind the culms (cx, cy, rx, ry, rotation). */
const BAMBOO_MASS: Array<[number, number, number, number, number]> = [
  [-112, -282, 70, 118, -24],
  [0, -318, 80, 128, 0],
  [112, -282, 70, 118, 24],
  [-62, -212, 72, 80, -10],
  [62, -212, 72, 80, 10],
];

const f1 = (n: number) => n.toFixed(1);

/**
 * One tree of the forest, in unit coordinates scaled by k. Farther trees are mixed toward the blue-green
 * haze, nearer ones toward deep shadow. Every crown is backlit by the low sun: a gold copy of the crown,
 * shifted toward the sun and up, shows as a warm rim along its lit edge.
 */
const WTreeShape: React.FC<{ t: WTreeItem }> = ({ t }) => {
  const { kind, x, y, k, seed } = t;
  const haze = clamp((705 - y) / 150, 0, 0.62);
  const deep = clamp((y - 780) / 220, 0, 0.42);
  const tone = (c: string) => mix(mix(c, W_HAZE, haze), W_DEEP, deep);
  const rim = mix(W_RIM, "#f8e0b0", haze);
  const dir = x < SUN.x ? 1 : -1;
  const lit = `translate(${dir * 6} -6)`;
  const detail = k >= 0.42;
  const r = (n: number) => rnd(seed * 7.13 + n);
  let body: React.ReactNode = null;

  if (kind === "mango") {
    const c = tone(MANGO_C[seed % MANGO_C.length]);
    const blobs = detail ? MANGO_BLOBS : MANGO_BLOBS.slice(0, 5);
    const crown = blobs.map(([bx, by, br], i) => <circle key={i} cx={bx} cy={by} r={br} />);
    body = (
      <>
        <path d="M -10 0 L -7 -150 L 7 -150 L 11 0 Z" fill={tone("#2a1d13")} />
        <path d="M 0 -118 L -42 -172 M 0 -128 L 40 -178" stroke={tone("#2a1d13")} strokeWidth={7} strokeLinecap="round" />
        <g transform={lit} fill={rim}>
          {crown}
        </g>
        <g fill={c}>{crown}</g>
        <ellipse cx={0} cy={-142} rx={118} ry={32} fill={W_DEEP} opacity={0.3} />
        {detail &&
          Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={`d${i}`}
              cx={f1((r(i) - 0.5) * 170)}
              cy={f1(-165 - r(i + 20) * 125)}
              rx={f1(14 + r(i + 40) * 12)}
              ry={f1(8 + r(i + 60) * 6)}
              fill={mix(c, rim, 0.32)}
              opacity={0.5}
            />
          ))}
      </>
    );
  } else if (kind === "banyan") {
    const c = tone(BANYAN_C[seed % BANYAN_C.length]);
    const els = detail ? BANYAN_EL : BANYAN_EL.slice(0, 6);
    const crown = els.map(([ex, ey, rx, ry], i) => <ellipse key={i} cx={ex} cy={ey} rx={rx} ry={ry} />);
    const roots = detail ? 12 : 6;
    body = (
      <>
        <path d="M -28 0 Q -18 -100 -15 -196 L 15 -196 Q 20 -100 30 0 Z" fill={tone("#3a2a1c")} />
        {[-112, 98].map((px) => (
          <rect key={px} x={px - 5} y={-188} width={10} height={188} fill={tone("#3a2a1c")} opacity={0.9} />
        ))}
        <g stroke={tone("#4a3828")} strokeWidth={2.4} opacity={0.7}>
          {Array.from({ length: roots }, (_, i) => {
            const rx = -180 + (i / (roots - 1)) * 360 + (r(i) - 0.5) * 16;
            return <line key={i} x1={f1(rx)} y1={-182} x2={f1(rx + (r(i + 30) - 0.5) * 6)} y2={f1(-r(i + 10) * 100)} />;
          })}
        </g>
        <g transform={lit} fill={rim}>
          {crown}
        </g>
        <g fill={c}>{crown}</g>
        <ellipse cx={0} cy={-184} rx={168} ry={24} fill={W_DEEP} opacity={0.3} />
        {detail &&
          Array.from({ length: 9 }, (_, i) => (
            <ellipse
              key={`d${i}`}
              cx={f1((r(i) - 0.5) * 360)}
              cy={f1(-196 - r(i + 20) * 90)}
              rx={f1(16 + r(i + 40) * 14)}
              ry={f1(7 + r(i + 60) * 5)}
              fill={mix(c, rim, 0.3)}
              opacity={0.5}
            />
          ))}
      </>
    );
  } else if (kind === "bamboo") {
    const n = detail ? 8 : 5;
    const culms = Array.from({ length: n }, (_, i) => {
      const u = i / (n - 1) - 0.5;
      return {
        u,
        bx: u * 34,
        cx: u * 70,
        tx: u * 300 + (r(i) - 0.5) * 50,
        ty: -(320 + r(i + 9) * 90),
      };
    });
    const mass = BAMBOO_MASS.map(([mx, my, rx, ry, rot], i) => (
      <ellipse key={i} cx={mx} cy={my} rx={rx} ry={ry} transform={`rotate(${rot} ${mx} ${my})`} />
    ));
    const leafA = tone("#7a9a3e");
    const leafB = tone("#5c8236");
    body = (
      <>
        <g transform={lit} fill={rim}>
          {mass}
        </g>
        <g fill={tone("#4f7432")}>{mass}</g>
        <g stroke={tone("#8f9c50")} strokeWidth={5} fill="none" strokeLinecap="round">
          {culms.map((c, i) => (
            <path key={i} d={`M ${f1(c.bx)} 0 Q ${f1(c.cx)} -210 ${f1(c.tx)} ${f1(c.ty)}`} />
          ))}
        </g>
        {detail &&
          culms.map((c, i) =>
            [0.55, 0.7, 0.85, 1].map((tt, ti) => {
              const u = 1 - tt;
              const px = u * u * c.bx + 2 * u * tt * c.cx + tt * tt * c.tx;
              const py = 2 * u * tt * -210 + tt * tt * c.ty;
              return [0, 1].map((j) => {
                const ang = (c.u >= 0 ? 35 : 145) + (j ? 28 : -28) + (r(i * 8 + ti * 2 + j + 50) - 0.5) * 20;
                return (
                  <ellipse
                    key={`${i}-${ti}-${j}`}
                    cx={16}
                    cy={0}
                    rx={18}
                    ry={4.2}
                    transform={`translate(${f1(px)} ${f1(py)}) rotate(${f1(ang)})`}
                    fill={j ? leafA : leafB}
                  />
                );
              });
            }),
          )}
      </>
    );
  } else if (kind === "banana") {
    const top = { x: 0, y: -108 };
    const leaves = [-162, -130, -100, -74, -44, -16].map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const len = 120 + r(i) * 34;
      const droop = len * 0.5 * Math.abs(Math.cos(a)) + 10;
      const ex = top.x + Math.cos(a) * len;
      const ey = top.y + Math.sin(a) * len + droop;
      const mx = top.x + Math.cos(a) * len * 0.5;
      const my = top.y + Math.sin(a) * len * 0.5 - len * 0.08;
      const nx = -Math.sin(a) * 22;
      const ny = Math.cos(a) * 22;
      return {
        d: `M ${top.x} ${top.y} Q ${f1(mx + nx)} ${f1(my + ny)} ${f1(ex)} ${f1(ey)} Q ${f1(mx - nx)} ${f1(my - ny)} ${top.x} ${top.y} Z`,
        rib: `M ${top.x} ${top.y} Q ${f1(mx)} ${f1(my)} ${f1(ex)} ${f1(ey)}`,
      };
    });
    body = (
      <>
        <path d="M -8 0 L -5 -110 L 5 -110 L 9 0 Z" fill={tone("#6e7f3a")} />
        <g transform={lit} fill={rim}>
          {leaves.map((l, i) => (
            <path key={i} d={l.d} />
          ))}
        </g>
        {leaves.map((l, i) => (
          <g key={i}>
            <path d={l.d} fill={tone(i % 2 ? "#7ea43f" : "#6b9536")} />
            <path d={l.rib} stroke={tone("#55762c")} strokeWidth={2} fill="none" />
          </g>
        ))}
      </>
    );
  } else {
    // palm
    const H = 430 + r(1) * 110;
    const lean = (r(2) - 0.5) * 140;
    const tx = lean;
    const ty = -H;
    const fronds = [-178, -152, -128, -106, -84, -62, -40, -16, 4].map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const len = H * (0.3 + r(10 + i) * 0.07);
      const ex = tx + Math.cos(a) * len;
      const ey = ty + Math.sin(a) * len + len * 0.55;
      const cx = tx + Math.cos(a) * len * 0.5;
      const cy = ty + Math.sin(a) * len * 0.5 - len * 0.12;
      const nx = -Math.sin(a) * 13;
      const ny = Math.cos(a) * 13;
      return `M ${f1(tx)} ${f1(ty)} Q ${f1(cx + nx)} ${f1(cy + ny)} ${f1(ex)} ${f1(ey)} Q ${f1(cx - nx * 0.2)} ${f1(cy - ny * 0.2)} ${f1(tx)} ${f1(ty)} Z`;
    });
    const trunk = `M 0 0 Q ${f1(lean * 0.2)} ${f1(-H * 0.55)} ${f1(tx)} ${f1(ty)}`;
    body = (
      <>
        <path d={trunk} stroke={tone("#4b3828")} strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d={trunk} transform={`translate(${dir * 3} 0)`} stroke={rim} strokeWidth={3} fill="none" opacity={0.35} />
        <g transform={lit} fill={rim}>
          {fronds.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <g fill={tone("#2f5a31")}>
          {fronds.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {[-8, 6, -1].map((dx, i) => (
          <circle key={i} cx={f1(tx + dx)} cy={f1(ty + 8 + (i === 2 ? 8 : 0))} r={7} fill={tone("#5a4626")} />
        ))}
      </>
    );
  }
  return <g transform={`translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(3)})`}>{body}</g>;
};

/** A country boat (nouka) with a bamboo hood and a boatman at the pole, moored still on the river. */
const Nouka: React.FC<{ x: number; y: number; s: number; f: number; ph: number }> = ({ x, y, s, f, ph }) => {
  const bob = Math.sin(f * 0.05 + ph) * 1.2;
  return (
    <g transform={`translate(${x} ${f1(y + bob)}) scale(${s})`}>
      <path d="M -110 30 Q 0 46 116 26" stroke="#2a2a3a" strokeWidth={8} opacity={0.22} fill="none" />
      <path d="M -120 -4 Q -60 26 0 26 Q 60 26 124 -10 Q 60 6 0 6 Q -60 6 -120 -4 Z" fill="#3e2a1a" />
      <path d="M -40 5 Q -36 -40 10 -42 Q 52 -40 56 5 Z" fill="#9a7444" />
      <path d="M -40 5 Q -36 -40 10 -42" stroke="#e2b46a" strokeWidth={3} fill="none" opacity={0.6} />
      <line x1={98} y1={-4} x2={70} y2={-78} stroke="#3a2a1c" strokeWidth={3} />
      <circle cx={86} cy={-54} r={7} fill="#2a1e16" />
      <path d="M 79 -47 L 92 -47 L 94 -8 L 77 -8 Z" fill="#2a1e16" />
    </g>
  );
};

/** One item of the valley floor. */
const WItemShape: React.FC<{ it: WItem; f: number; lamp: number }> = ({ it, f, lamp }) => {
  if (it.kind === "hut") return <Hut x={it.x} y={it.y} w={it.w} h={it.h} lamp={it.lamp ? lamp : 0} />;
  if (it.kind === "shrine")
    return (
      <g>
        <Shrine x={it.x} baseY={it.y} />
        {lamp > 0.001 && (
          <g opacity={lamp}>
            <circle cx={it.x} cy={it.y - 36} r={30} fill="url(#ujw-lamp)" />
            <circle cx={it.x} cy={it.y - 30} r={2.6} fill="#fff1b8" />
          </g>
        )}
      </g>
    );
  if (it.kind === "boat") return <Nouka x={it.x} y={it.y} s={it.s} f={f} ph={it.seed * 2.1} />;
  return <WTreeShape t={it} />;
};

/** The wide shot's own gradients and filters. */
const WideDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <linearGradient id="ujw-sky" x1="0" y1="-320" x2="0" y2="600" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2f3f6e" />
        <stop offset="26%" stopColor="#5e6a9a" />
        <stop offset="50%" stopColor="#c99a8e" />
        <stop offset="68%" stopColor="#f0b872" />
        <stop offset="84%" stopColor="#f8d48a" />
        <stop offset="100%" stopColor="#fbe6b0" />
      </linearGradient>
      <radialGradient id="ujw-sun" cx={SUN.x} cy={SUN.y} r="720" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff0c0" stopOpacity={0.9} />
        <stop offset="12%" stopColor="#ffd98a" stopOpacity={0.7} />
        <stop offset="40%" stopColor="#f3ad62" stopOpacity={0.28} />
        <stop offset="100%" stopColor="#f3ad62" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="ujw-water" x1="0" y1={WH} x2="0" y2="1080" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fde4a6" />
        <stop offset="18%" stopColor="#f0bd7e" />
        <stop offset="45%" stopColor="#a98f9e" />
        <stop offset="100%" stopColor="#3c5068" />
      </linearGradient>
      <linearGradient id="ujw-ground" x1="0" y1="550" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8a8c4c" />
        <stop offset="15%" stopColor="#5f7a40" />
        <stop offset="50%" stopColor="#3d5a32" />
        <stop offset="100%" stopColor="#22371f" />
      </linearGradient>
      <linearGradient id="ujw-mistband" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbe6c4" stopOpacity={0} />
        <stop offset="50%" stopColor="#fbe6c4" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#fbe6c4" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="ujw-ray" x1="0" y1={SUN.y} x2="0" y2={SUN.y + 640} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffe6a8" stopOpacity={0.6} />
        <stop offset="100%" stopColor="#ffe6a8" stopOpacity={0} />
      </linearGradient>
      <radialGradient id="ujw-lamp">
        <stop offset="0%" stopColor="#fff2b0" stopOpacity={0.95} />
        <stop offset="30%" stopColor="#ffc860" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#ffc860" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="ujw-mote">
        <stop offset="0%" stopColor="#fffbd0" stopOpacity={1} />
        <stop offset="35%" stopColor="#f8f08a" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#f8f08a" stopOpacity={0} />
      </radialGradient>
      <filter id="ujw-soft" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation={4} />
      </filter>
      <filter id="ujw-mist" x="-20%" y="-100%" width="140%" height="300%">
        <feGaussianBlur stdDeviation={14} />
      </filter>
      <filter id="ujw-ray-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={8} />
      </filter>
    </defs>
  </svg>
);

/** Thin cloud streaks, lit gold from below by the low sun. */
const W_CLOUDS: Array<[number, number, number, number]> = [
  [380, 236, 280, 13],
  [690, 292, 190, 9],
  [1460, 196, 320, 15],
  [1700, 268, 210, 10],
  [1230, 330, 170, 8],
  [200, 330, 160, 8],
];

/** Plane 1: the golden evening sky, the sun glow and the low sun. */
const WideSky: React.FC = () => (
  <g>
    <rect x={PLANE_L} y={-320} width={PLANE_R - PLANE_L} height={960} fill="url(#ujw-sky)" />
    <rect x={PLANE_L} y={-320} width={PLANE_R - PLANE_L} height={960} fill="url(#ujw-sun)" />
    <g filter="url(#ujw-soft)">
      {W_CLOUDS.map(([cx, cy, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy - ry * 0.5} rx={rx} ry={ry} fill="#a88aa4" opacity={0.35} />
          <ellipse cx={cx + 10} cy={cy + ry * 0.4} rx={rx * 0.92} ry={ry * 0.8} fill="#ffd29a" opacity={0.6} />
        </g>
      ))}
    </g>
    <circle cx={SUN.x} cy={SUN.y} r={96} fill="#ffe7a8" opacity={0.45} filter="url(#ujw-soft)" />
    <circle cx={SUN.x} cy={SUN.y} r={40} fill="#fff4d2" />
  </g>
);

/** A soft line of rounded tree crowns across the whole plane, closed down to `bottom`. */
const scallop = (seed: number, top: number, amp: number, bw: number, bottom: number) => {
  let x = PLANE_L - 40;
  let y = top + rnd(seed) * amp;
  let d = `M ${x} ${bottom} L ${x} ${f1(y)}`;
  let i = 0;
  while (x < PLANE_R + 40) {
    const w = bw * (0.6 + rnd(seed + i * 3.7) * 0.8);
    const ny = top + rnd(seed + i * 5.3 + 1) * amp;
    const h = bw * 0.35 * (0.6 + rnd(seed + i * 2.9 + 2) * 0.8);
    d += ` Q ${f1(x + w / 2)} ${f1(Math.min(y, ny) - h)} ${f1(x + w)} ${f1(ny)}`;
    x += w;
    y = ny;
    i++;
  }
  return `${d} L ${f1(x)} ${bottom} Z`;
};

/** Three distant tree lines, palest and bluest at the back, with mist lying between them. */
const W_FAR = [
  { d: scallop(11, 418, 24, 74, 660), c: "#a6b8bb", mistY: 452 },
  { d: scallop(37, 452, 26, 62, 660), c: "#83a09b", mistY: 488 },
  { d: scallop(71, 486, 24, 54, 660), c: "#62847a", mistY: 524 },
];
/** Distant palms standing up out of the second tree line: (x, foot y, height). */
const FAR_PALMS: Array<[number, number, number]> = [
  [180, 476, 70],
  [640, 468, 64],
  [1380, 480, 72],
  [1660, 464, 60],
  [1880, 474, 66],
  [300, 482, 54],
];

const FarPalm: React.FC<{ x: number; y: number; h: number; c: string }> = ({ x, y, h, c }) => {
  const tx = x + h * 0.08;
  const ty = y - h;
  return (
    <g stroke={c} fill="none" strokeLinecap="round">
      <path d={`M ${x} ${y} Q ${f1(x + h * 0.02)} ${f1(y - h * 0.5)} ${f1(tx)} ${f1(ty)}`} strokeWidth={3} />
      {[-165, -130, -95, -60, -20].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const len = h * 0.32;
        return (
          <path
            key={deg}
            d={`M ${f1(tx)} ${f1(ty)} Q ${f1(tx + Math.cos(a) * len * 0.5)} ${f1(ty + Math.sin(a) * len * 0.5 - 3)} ${f1(tx + Math.cos(a) * len)} ${f1(ty + Math.sin(a) * len + len * 0.5)}`}
            strokeWidth={3.5}
          />
        );
      })}
    </g>
  );
};

/** Plane 2: the far misty forest, washed gold near the sun. */
const WideFar: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {W_FAR.map((b, i) => (
      <g key={i}>
        <path d={b.d} fill={b.c} />
        {i === 0 && FAR_PALMS.map(([x, y, h], j) => <FarPalm key={j} x={x} y={y} h={h} c="#93aaa9" />)}
        <rect
          x={PLANE_L - 200 + Math.sin(f * 0.01 + i) * 20}
          y={b.mistY - 20}
          width={PLANE_R - PLANE_L + 400}
          height={48}
          fill="url(#ujw-mistband)"
          opacity={0.75}
        />
      </g>
    ))}
    <rect x={PLANE_L} y={300} width={PLANE_R - PLANE_L} height={360} fill="url(#ujw-sun)" opacity={0.5} />
  </g>
);

/** Plane 3: the valley floor, the winding river, the forest ring, the village, the temple and the boats. */
const WideValley: React.FC<{ f: number; lamp: number }> = ({ f, lamp }) => (
  <g>
    <rect x={PLANE_L} y={WH - 12} width={PLANE_R - PLANE_L} height={PLANE_B + 100 - WH} fill="url(#ujw-ground)" />
    {/* the packed-earth yards of the village and the temple, warm in the low light */}
    <ellipse cx={420} cy={748} rx={380} ry={46} fill="#a8945e" opacity={0.4} />
    <ellipse cx={1440} cy={784} rx={170} ry={26} fill="#a8945e" opacity={0.4} />

    {/* the river: the evening sky in the water, the forest's dark reflection along both banks, sun glitter */}
    <path d={W_RIVER_D} fill="url(#ujw-water)" />
    <path d={W_REFL_L} fill="#2b4430" opacity={0.42} filter="url(#ujw-soft)" />
    <path d={W_REFL_R} fill="#2b4430" opacity={0.42} filter="url(#ujw-soft)" />
    {Array.from({ length: 16 }, (_, i) => {
      const y = WH + 5 + i * i + i * 5;
      const hw = wRiverHW(y);
      const cx = wRiverC(y) + Math.sin(f * 0.05 + i * 2.1) * hw * 0.08;
      const half = hw * (0.5 - i * 0.022);
      const op = (0.6 - i * 0.032) * (0.8 + 0.2 * Math.sin(f * 0.09 + i * 1.7));
      return (
        <line
          key={`g${i}`}
          x1={f1(cx - half)}
          y1={y}
          x2={f1(cx + half)}
          y2={y}
          stroke="#fff2c6"
          strokeWidth={1.4 + i * 0.22}
          strokeLinecap="round"
          opacity={op}
        />
      );
    })}
    {Array.from({ length: 9 }, (_, i) => {
      const y = 860 + i * 30;
      const hw = wRiverHW(y);
      const cx = wRiverC(y) + Math.sin(f * 0.025 + i * 1.3) * 8 + (rnd(i + 700) - 0.5) * hw * 0.6;
      const half = hw * (0.14 + rnd(i + 720) * 0.14);
      return (
        <line key={`r${i}`} x1={f1(cx - half)} y1={y} x2={f1(cx + half)} y2={y} stroke="#d8c3b4" strokeWidth={2} strokeLinecap="round" opacity={0.2} />
      );
    })}
    <path d={W_BANK_L} stroke="#d9b880" strokeWidth={3} fill="none" opacity={0.5} />
    <path d={W_BANK_R} stroke="#d9b880" strokeWidth={3} fill="none" opacity={0.5} />

    {W_ITEMS.map((it, i) => (
      <WItemShape key={i} it={it} f={f} lamp={lamp} />
    ))}
  </g>
);

/** Low mist lying in the valley and over the water, drifting very slowly. */
const W_MIST: Array<[number, number, number, number, number]> = [
  [520, 652, 560, 24, 0.36],
  [1500, 640, 520, 22, 0.32],
  [1010, 598, 320, 14, 0.45],
  [250, 800, 420, 26, 0.24],
  [1640, 812, 420, 24, 0.22],
  [1050, 730, 280, 22, 0.32],
];
const WideMist: React.FC<{ f: number }> = ({ f }) => (
  <g filter="url(#ujw-mist)">
    {W_MIST.map(([cx, cy, rx, ry, o], i) => (
      <ellipse key={i} cx={f1(cx + (i % 2 ? 1 : -1) * f * 0.3)} cy={cy} rx={rx} ry={ry} fill="#fbe2bc" opacity={o} />
    ))}
  </g>
);

/**
 * Evening cooking smoke rising from three of the huts (kitchen fires): soft puffs that rise from just above
 * the ridge, swell, lean a little with the breeze and fade. Driven by lifeF, so it keeps rising in the pause.
 */
const W_SMOKE: Array<{ x: number; y: number; ph: number }> = [
  { x: 392, y: 584, ph: 0 },
  { x: 546, y: 590, ph: 0.37 },
  { x: 684, y: 604, ph: 0.71 },
];
const SMOKE_PERIOD = 96;
const SMOKE_PUFFS = 7;
const HutSmoke: React.FC<{ f: number }> = ({ f }) => (
  <g filter="url(#ujw-soft)">
    {W_SMOKE.map((s, j) =>
      Array.from({ length: SMOKE_PUFFS }, (_, k) => {
        const a = (((f / SMOKE_PERIOD + k / SMOKE_PUFFS + s.ph) % 1) + 1) % 1;
        const x = s.x + a * a * 70 + Math.sin(f * 0.04 + k * 1.7 + j) * 5 * a;
        const y = s.y - 4 - a * 190;
        const r = 6 + a * 30;
        const op = 0.58 * Math.sin(Math.PI * Math.min(1, a * 1.15)) * (1 - a * 0.4);
        return <circle key={`${j}-${k}`} cx={f1(x)} cy={f1(y)} r={f1(r)} fill={mix("#bdb6c0", "#e8d6c0", a)} opacity={op.toFixed(3)} />;
      }),
    )}
  </g>
);

/** Soft shafts of evening light fanning down from the sun through the trees (screen-blended). */
const W_RAYS: Array<[number, number]> = [
  [-58, 4],
  [-36, 6],
  [-16, 3.5],
  [12, 5],
  [34, 3.5],
  [56, 5],
];
const WideRays: React.FC<{ f: number }> = ({ f }) => (
  <g filter="url(#ujw-ray-blur)">
    {W_RAYS.map(([a, w], i) => {
      const L = 640;
      const a0 = ((a - w) * Math.PI) / 180;
      const a1 = ((a + w) * Math.PI) / 180;
      const d =
        `M ${SUN.x} ${SUN.y} L ${f1(SUN.x + Math.sin(a0) * L)} ${f1(SUN.y + Math.cos(a0) * L)} ` +
        `L ${f1(SUN.x + Math.sin(a1) * L)} ${f1(SUN.y + Math.cos(a1) * L)} Z`;
      return <path key={i} d={d} fill="url(#ujw-ray)" opacity={0.3 * (0.85 + 0.15 * Math.sin(f * 0.035 + i * 1.9))} />;
    })}
  </g>
);

/** Fireflies and light motes over the village as dusk comes on. */
const W_MOTES = Array.from({ length: 28 }, (_, i) => ({
  x: 140 + rnd(i * 3 + 801) * 1640,
  y: 600 + rnd(i * 5 + 803) * 380,
  r: 1.8 + rnd(i * 7 + 805) * 1.8,
  ph: rnd(i * 11 + 807) * 6.28,
}));
const WideMotes: React.FC<{ f: number; on: number }> = ({ f, on }) => {
  if (on < 0.001) return null;
  return (
    <g opacity={on}>
      {W_MOTES.map((m, i) => {
        const x = m.x + Math.sin(f * 0.021 + m.ph) * 10;
        const y = m.y + Math.cos(f * 0.017 + m.ph * 1.3) * 6 - (f - MOTES0) * 0.12;
        const tw = 0.65 + 0.35 * Math.sin(f * 0.1 + m.ph * 2);
        return (
          <g key={i} opacity={tw}>
            <circle cx={f1(x)} cy={f1(y)} r={m.r * 4.5} fill="url(#ujw-mote)" />
            <circle cx={f1(x)} cy={f1(y)} r={m.r * 0.7} fill="#fffbe2" />
          </g>
        );
      })}
    </g>
  );
};

/**
 * Birds flying home into the far forest. First flock (end hold, after the line): from the upper left, gliding
 * down and away toward the distant trees right of the sun, shrinking and fading as they go; gone before the
 * END pause. Driven by lifeF.
 */
const W_BIRDS = Array.from({ length: 6 }, (_, i) => ({
  x0: 180 + i * 90 + rnd(i * 23 + 601) * 120,
  y0: 170 + rnd(i * 29 + 603) * 130,
  x1: 1180 + rnd(i * 31 + 607) * 260,
  y1: 420 + rnd(i * 37 + 609) * 30,
  s: 1 + rnd(i * 41 + 611) * 0.4,
  ph: rnd(i * 43 + 613) * 6.28,
  lag: i * 1.2,
}));

/**
 * The END pause moment: a second, smaller flock flies home from the upper right toward the far forest left of
 * the sun, slower and higher, as the light dims; all gone before the pause ends. Driven by lifeF.
 */
const W_BIRDS_HOME = Array.from({ length: 5 }, (_, i) => ({
  x0: 1780 - i * 70 - rnd(i * 23 + 701) * 110,
  y0: 150 + rnd(i * 29 + 703) * 110,
  x1: 640 + rnd(i * 31 + 707) * 220,
  y1: 410 + rnd(i * 37 + 709) * 30,
  s: 0.9 + rnd(i * 41 + 711) * 0.35,
  ph: rnd(i * 43 + 713) * 6.28,
  lag: i * 1.6,
}));
const BIRDS2_ON = END_PAUSE.frames >= 20;

const WideBirds: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[
      ...W_BIRDS.map((b) => ({ ...b, from: BIRDS_FROM, flight: BIRDS_FLIGHT, fadeIn: true })),
      ...(BIRDS2_ON ? W_BIRDS_HOME.map((b) => ({ ...b, from: BIRDS2_FROM, flight: BIRDS2_FLIGHT, fadeIn: true })) : []),
    ].map((b, i) => {
      const p = clamp((f - b.from - b.lag) / b.flight);
      if (p <= 0) return null;
      if (p >= 1) return null;
      const e = 1 - Math.pow(1 - p, 1.6);
      const x = b.x0 + (b.x1 - b.x0) * e;
      const y = b.y0 + (b.y1 - b.y0) * e + Math.sin(f * 0.08 + b.ph) * 3;
      const s = b.s * (1 - 0.65 * e);
      const op = 0.85 * (1 - smoothStep((p - 0.6) / 0.4)) * (b.fadeIn ? smoothStep(p / 0.15) : 1);
      const tip = 6 * Math.sin(f * 0.5 + b.ph);
      return (
        <path
          key={i}
          transform={`translate(${f1(x)}, ${f1(y)}) scale(${s.toFixed(2)})`}
          d={`M -14 ${tip.toFixed(2)} Q -7 -5 0 0 Q 7 -5 14 ${tip.toFixed(2)}`}
          stroke="#3a2a3a"
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
          opacity={op}
        />
      );
    })}
  </g>
);

/* The near foliage: dark, out-of-focus leaves framing the edges of the wide shot. */
const NEAR_DARK = "#0e1b13";
const NEAR_DARK2 = "#142619";
const NEAR_RIM = "#c79c52";
/** A pointed leaf from the origin along +x. */
const leafD = (len: number, w: number) => `M 0 0 Q ${f1(len * 0.45)} ${f1(-w)} ${f1(len)} 0 Q ${f1(len * 0.45)} ${f1(w)} 0 0 Z`;
const qpt = (p0: number, c: number, p1: number, t: number) => (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * c + t * t * p1;

/** Top left: a mango bough reaching in, its leaves hanging. */
const BOUGH = { x0: -140, y0: 30, cx: 160, cy: 110, x1: 470, y1: -10 };
const TL_LEAVES = Array.from({ length: 26 }, (_, i) => {
  const t = i / 25;
  return {
    x: qpt(BOUGH.x0, BOUGH.cx, BOUGH.x1, t) + (rnd(i + 901) - 0.5) * 30,
    y: qpt(BOUGH.y0, BOUGH.cy, BOUGH.y1, t) + (rnd(i + 903) - 0.5) * 24,
    len: 70 + rnd(i + 905) * 40,
    w: 15 + rnd(i + 907) * 8,
    a: 70 + rnd(i + 909) * 50 - t * 20,
    c: i % 3 ? NEAR_DARK : NEAR_DARK2,
  };
});
/** Top right: bamboo culms leaning in from the right edge, with drooping leaf sprays near their tips. */
const TR_CULMS = Array.from({ length: 4 }, (_, i) => ({ bx: 2010 + i * 14, by: 1160, cx: 1930 - i * 10, cy: 520, tx: 1700 + i * 45, ty: -100 }));
const TR_LEAVES = TR_CULMS.flatMap((c, i) =>
  Array.from({ length: 7 }, (_, j) => {
    const t = 0.62 + j * 0.06;
    return [0, 1].map((m) => ({
      x: qpt(c.bx, c.cx, c.tx, t),
      y: qpt(c.by, c.cy, c.ty, t),
      a: (m ? 120 : 165) + (rnd(i * 31 + j * 3 + m + 951) - 0.5) * 30,
      len: 80 + rnd(i * 17 + j * 5 + m + 953) * 30,
      w: 9 + rnd(i * 13 + j + m + 955) * 3,
    }));
  }).flat(),
);
/** Bottom left: a banana plant, its broad leaves arching up into the corner. */
const BANANA_TOP = { x: 60, y: 990 };
const BL_LEAVES = [
  [-170, 280],
  [-140, 300],
  [-108, 300],
  [-76, 260],
  [-40, 230],
].map(([deg, len]) => {
  const a = (deg * Math.PI) / 180;
  const droop = len * 0.35 * Math.abs(Math.cos(a)) + 10;
  const ex = BANANA_TOP.x + Math.cos(a) * len;
  const ey = BANANA_TOP.y + Math.sin(a) * len + droop;
  const mx = BANANA_TOP.x + Math.cos(a) * len * 0.5;
  const my = BANANA_TOP.y + Math.sin(a) * len * 0.5 - len * 0.06;
  const nx = -Math.sin(a) * 56;
  const ny = Math.cos(a) * 56;
  return {
    d: `M ${BANANA_TOP.x} ${BANANA_TOP.y} Q ${f1(mx + nx)} ${f1(my + ny)} ${f1(ex)} ${f1(ey)} Q ${f1(mx - nx)} ${f1(my - ny)} ${BANANA_TOP.x} ${BANANA_TOP.y} Z`,
    rib: `M ${BANANA_TOP.x} ${BANANA_TOP.y} Q ${f1(mx)} ${f1(my)} ${f1(ex)} ${f1(ey)}`,
  };
});
/** Bottom right: a fern fan over a low dark shrub. */
const BR_FERNS = Array.from({ length: 9 }, (_, i) => ({
  a: -172 + i * 9.5 + (rnd(i + 971) - 0.5) * 6,
  len: 170 + rnd(i + 973) * 70,
  w: 20 + rnd(i + 975) * 6,
}));

const NearFoliage: React.FC<{ f: number }> = ({ f }) => {
  const sway = (ph: number) => Math.sin(f * 0.03 + ph) * 0.6;
  return (
    <g>
      {/* top left: dark crown and the hanging bough */}
      <g transform={`rotate(${sway(0).toFixed(3)} -140 30)`}>
        <ellipse cx={-80} cy={-40} rx={300} ry={140} fill={NEAR_DARK} />
        <path
          d={`M ${BOUGH.x0} ${BOUGH.y0} Q ${BOUGH.cx} ${BOUGH.cy} ${BOUGH.x1} ${BOUGH.y1}`}
          stroke={NEAR_DARK2}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        {TL_LEAVES.map((l, i) => (
          <g key={i} transform={`translate(${f1(l.x)} ${f1(l.y)}) rotate(${f1(l.a)})`}>
            <path d={leafD(l.len, l.w)} transform="translate(-3 3)" fill={NEAR_RIM} opacity={0.4} />
            <path d={leafD(l.len, l.w)} fill={l.c} />
          </g>
        ))}
      </g>

      {/* top right: dark crown and the leaning bamboo */}
      <g transform={`rotate(${sway(1.7).toFixed(3)} 2010 1160)`}>
        <ellipse cx={2000} cy={-20} rx={240} ry={130} fill={NEAR_DARK} />
        {TR_CULMS.map((c, i) => (
          <path
            key={i}
            d={`M ${c.bx} ${c.by} Q ${c.cx} ${c.cy} ${c.tx} ${c.ty}`}
            stroke={NEAR_DARK2}
            strokeWidth={16 - i * 1.5}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {TR_LEAVES.map((l, i) => (
          <g key={i} transform={`translate(${f1(l.x)} ${f1(l.y)}) rotate(${f1(l.a)})`}>
            <path d={leafD(l.len, l.w)} transform="translate(-3 -3)" fill={NEAR_RIM} opacity={0.35} />
            <path d={leafD(l.len, l.w)} fill={i % 3 ? NEAR_DARK : NEAR_DARK2} />
          </g>
        ))}
      </g>

      {/* bottom left: the banana plant */}
      <g transform={`rotate(${sway(3.1).toFixed(3)} 40 1180)`}>
        <path d="M 22 1200 L 46 990 L 74 990 L 64 1200 Z" fill={NEAR_DARK2} />
        {BL_LEAVES.map((l, i) => (
          <g key={i}>
            <path d={l.d} transform="translate(4 -4)" fill={NEAR_RIM} opacity={0.35} />
            <path d={l.d} fill={i % 2 ? NEAR_DARK : NEAR_DARK2} />
            <path d={l.rib} stroke="#22382a" strokeWidth={3} fill="none" opacity={0.8} />
          </g>
        ))}
      </g>

      {/* bottom right: a shrub and a fern fan */}
      <g transform={`rotate(${sway(4.4).toFixed(3)} 1720 1080)`}>
        <ellipse cx={1790} cy={1100} rx={320} ry={100} fill={NEAR_DARK} />
        <ellipse cx={1560} cy={1125} rx={220} ry={70} fill={NEAR_DARK2} />
        {BR_FERNS.map((l, i) => (
          <g key={i} transform={`translate(1720 1070) rotate(${f1(l.a)})`}>
            <path d={leafD(l.len, l.w)} transform="translate(-4 -4)" fill={NEAR_RIM} opacity={0.3} />
            <path d={leafD(l.len, l.w)} fill={i % 2 ? NEAR_DARK : NEAR_DARK2} />
          </g>
        ))}
      </g>
    </g>
  );
};

export const Scene02aUjanchar: React.FC = () => {
  // f: the story clock (holds in the END pause); lifeF: the real local frame (life keeps moving in the pause).
  const { f, lifeF } = useStory(SCENE_ID);

  // Opening: the cross-dissolve in from the journey's last shot (J6, dusk gold). The whole picture fades up from
  // opacity 0 over the journey, which Episode02 draws underneath; there is no dark backdrop and no black between.
  const t = clamp(lifeF / DISSOLVE_IN);
  const rootOpacity = 0.5 - 0.5 * Math.cos(Math.PI * t);

  // After the line: the evening lamps in two hut doorways and at the temple, then the fireflies, come on. They
  // follow the story clock (lamps are story events), and they are fully on before the END pause.
  const lampOn = interpolate(f, [LAMP0, LAMP0 + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const motesOn = interpolate(f, [MOTES0, MOTES0 + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // The END pause moment, then the outgoing dissolve: the light dims toward dusk over the pause (a cool multiply
  // wash), while the second flock flies home. There is no fade to dark: Episode02 keeps this scene rendering for
  // 44 frames past its last local frame while the fox scene cross-dissolves in on top; every value here is
  // clamped or continuous past the end.
  const duskDim = interpolate(lifeF, [DIM0, DIM1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: rootOpacity }}>
      <WideDefs />
      {/* The held wide aerial: Ujanchar ringed by jungle, the river and the low sun (no push, no drift). */}
      <Stage cam={WIDE_CAM} background="#2a2038">
        <Layer depth={0.25}>
          <WideSky />
        </Layer>
        <Layer depth={0.42}>
          <WideFar f={lifeF} />
        </Layer>
        <Layer depth={0.5}>
          <WideBirds f={lifeF} />
        </Layer>
        <Layer depth={0.75}>
          <WideValley f={lifeF} lamp={lampOn} />
          <HutSmoke f={lifeF} />
        </Layer>
        <Layer depth={0.8}>
          <WideMist f={lifeF} />
        </Layer>
        <Layer depth={0.85} blend="screen">
          <WideRays f={lifeF} />
        </Layer>
        <Layer depth={1}>
          <WideMotes f={lifeF} on={motesOn} />
        </Layer>
        <Layer depth={1.3} extraBlur={3}>
          <NearFoliage f={lifeF} />
        </Layer>
      </Stage>

      {/* The END pause: the light dims toward dusk; the fox scene then cross-dissolves in over this picture */}
      {duskDim > 0.001 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "linear-gradient(to bottom, #2b2c62, #45304f)",
            mixBlendMode: "multiply",
            opacity: duskDim * 0.62,
          }}
        />
      )}
    </div>
  );
};

export default Scene02aUjanchar;
