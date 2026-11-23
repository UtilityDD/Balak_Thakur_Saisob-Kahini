import React from "react";
import { useSetSkin } from "./SetSkin";
import { clamp, lerp, noise1 } from "../core/anim";
import { Cam, Grade, Layer } from "../core/Stage";
import { Bokeh, Flame, GlowDefs } from "../fx/Fx";
import { Banana, Birds, DaySky, Palm } from "./S01_DaySets";

/**
 * THE FAMILY'S UJANCHAR VILLAGE HOUSE: one shared set (STO-10, STO-17; continuity STO-04).
 *
 * The corner of the courtyard (উঠোন) of the small mud-walled, thatched village house the family moves to in
 * Episode 2. It recreates the go-saap courtyard of Episode 2 (src/episode02/scenes/Scene03Goshaap.tsx, which stays
 * untouched) with the same architecture, colours, materials and layout: the hut with its curved do-chala thatch,
 * bamboo posts, low veranda on a mud plinth, open door, barred window, clay pots and broom; the bamboo lattice fence
 * with bushes at its foot; the lemon tree in the corner; coconut palms and banana trees; the dense jungle beyond; the
 * beaten-earth courtyard; the near end of the veranda plinth on the left. Same world coordinates as Episode 2, so the
 * Episode 2 wide (cam { x: 60, y: 110, zoom: 1 }) frames the same view. Every later Ujanchar scene uses this set.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * API (everything renders INSIDE a <Stage>; the layer components wrap their own <Layer>)
 * ---------------------------------------------------------------------------------------------------------------
 *  type UjancharTime = "morning" | "dawn"
 *    "morning": Episode 2's warm morning (high sun upper right, sun shafts through the lemon tree). Episode 3 scene 02.
 *    "dawn":    an autumn (শরৎ) dawn: low sun on the right behind the jungle, soft gold light, pale rose-gold sky,
 *               mist lying in the jungle, among the trees and low over the courtyard. Episode 3 scene 01.
 *
 *  Quick use, the whole set with characters on the floor plane:
 *    <Stage cam={ujancharKeepInSet(cam)} background={UJANCHAR_BG[time]}>
 *      <UjancharHouse f={f} time="dawn" cam={cam} tulsi={{ x: 1000 }} jaba={UJANCHAR_JABA}
 *        floor={<>...puppets on depth 1...</>} />
 *    </Stage>
 *
 *  Or layer by layer, to put characters between the planes or give them their own rack-focus layers:
 *    <UjancharBackdrop f time cam calm fenceJaba cow veranda yard />   sky 0.15, jungle 0.35, trees 0.5, yard 0.65,
 *                                                                       cow 0.85, inside the calm CAM-11 grade
 *    <UjancharFloorLayer f time tulsi jaba nearVeranda edgeBushes under>{characters}</UjancharFloorLayer>   depth 1
 *    <UjancharLightLayer f time level mask />       depth 0.95, screen: sun shafts and dust (dawn: low gold shafts)
 *    <UjancharForegroundLayer f time grass leaves bokeh />   depth 1.35 / 1.6, soft out-of-focus near grass, leaves
 *    <Grade {...ujancharGrade(time)} />
 *  (UjancharSkyLayer, UjancharJungleLayer, UjancharTreesLayer, UjancharYardLayer and UjancharCowLayer are exported
 *  too; UjancharBackdrop is just those five inside the calm filter.)
 *
 *  Common props
 *    f        frame for life (sway, clouds, smoke, mist drift). Pass the real (life) clock, not a held story clock.
 *    time     "morning" (default) | "dawn".
 *    cam      the Stage cam, optional. Only used for the CAM-11 depth blur, so the camera's own DOF is not doubled.
 *    calm     0..1 (default 1): the CAM-11 background treatment (less saturation and contrast, slightly dimmer and
 *             warmer, blur growing with distance). 1 = Episode 2's treatment; 0 = raw.
 *  UjancharBackdrop / UjancharYardLayer
 *    fenceJaba  (default true) red hibiscus flowers on two of the fence-foot bushes.
 *    veranda    ReactNode drawn on the 0.65 plane on the veranda floor, in front of the wall and behind the posts
 *               (a far figure at the door: the door is DOOR.x, the veranda floor HUT.top, Episode 2's Charu s 0.46).
 *    yard       ReactNode drawn on the 0.65 plane in front of the hut, fence and lemon tree.
 *    cow        false (default) | true | { x, y, s, flip }: the Episode 2 Bengal cow idling on the 0.85 plane.
 *  UjancharFloorLayer (depth 1; the courtyard floor, back edge y 874 to 880, Episode 2's ground line y 900)
 *    tulsi      false (default) | true | { x, y?, s?, lamp? }: the tulsi mancha (default { x: 1000, y: 930, s: 1 }).
 *               lamp: "unlit" (default, a clay pradip in the niche) | "lit" | "none".
 *               To let characters pass behind it, pass false and draw <UjancharTulsiMancha> in your own layer.
 *    jaba       JabaPlacement[] (default []): flowering hibiscus (জবা) shrubs. UJANCHAR_JABA puts two by the fence on the
 *               right, past the lemon tree. { x, y?, s?, seed?, hide? }: `hide` lists flower indices already picked;
 *               jabaFlowerAt(placement, i) gives flower i's world point (for a picking hand); JABA_FLOWERS flowers.
 *    nearVeranda (default true) the near end of the veranda plinth at the left (x < 112), as in Episode 2.
 *    edgeBushes  (default true) the two bushes at the courtyard edge (x 470 and 2420), as in Episode 2.
 *    under      ReactNode drawn on the floor before the tulsi and shrubs; children are drawn after them.
 *  UjancharLightLayer: level (default 1) scales it; mask is an optional CSS mask-image (e.g. a radial gradient that
 *    thins the light over the subjects, like Episode 2's veilMask).
 *  UjancharForegroundLayer: grass (default true), leaves (default false: soft leaf sprays in the top corners, kept
 *    above y 300 at zoom 1 so they never cross faces), bokeh (default true).
 *  UjancharHouse: all of the above in order; props = backdrop + floor + light + foreground props, plus `floor`
 *    (ReactNode on depth 1 after the set), `front` (ReactNode on depth 1 after the light layer), light (default true),
 *    foreground (default true), leaves, grade (default true).
 *  Pieces: UjancharTulsiMancha { x, y, s?, f, lamp?, seed? } (base centre at x, y; about 300 px tall at s 1, the niche
 *    lamp at (x, y - 40 s)); JabaShrub { x, y, s?, f, seed?, hide? } (base at x, y; about 330 px tall at s 1).
 *  Constants: UJANCHAR (planes, GROUND, FLOOR_TOP, HUT, DOOR, LEMON, COW, TULSI, extents), UJANCHAR_BG[time],
 *    UJANCHAR_JABA, UJANCHAR_SAFE; helpers ujancharGrade(time), ujancharKeepInSet(cam).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SAFE CAMERA RANGE (Stage cam: x = world centre x - 960, y = world centre y - 540)
 * ---------------------------------------------------------------------------------------------------------------
 *  Plane extents (stage px): floor (1) x -1500..3500, y to 1500; yard (0.65) x -1500..3500, beaten earth down to
 *  y 1100 (so the floor's back edge never opens a gap); jungle (0.35) x -1800..3800; sky (0.15) x -2200..4200.
 *  At zoom 1:  cam.x -1500..1580 (world centre x -540..2540), cam.y -200..400 (world centre y 340..940).
 *  At zoom z:  cam.x -2460 + 960/z .. 2540 - 960/z;  cam.y up to 944 - 540/z.  Zoom 1..3.
 *  Upward tilts below cam.y -200 lose the floor but show no edge (sky to y -1200). ujancharKeepInSet(cam) clamps any
 *  cam into the safe range with soft corners (a move meeting a limit eases into it). Interesting x: the hut -500..1250
 *  (door 860), the lemon tree 1480 (0.65 plane), the fence 1170..3500, the hibiscus by the fence 1880 / 2330.
 *
 * Planes, back to front: 0.15 sky; 0.35 jungle; 0.5 palms and banana trees; 0.65 the back of the courtyard (hut,
 * veranda, fence, bushes, lemon tree); 0.85 the cow; 1 the courtyard floor, the near veranda, the tulsi mancha, the
 * hibiscus shrubs (characters go here); 0.95 light (screen); 1.35 near grass; 1.6 near leaves.
 */

export type UjancharTime = "morning" | "dawn";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** The hut on the 0.65 plane: plinth, wall, door and roof lines (plane px). Same as Episode 2. */
const HUT = { x0: -440, x1: 1190, top: 806, bottom: 852, eave: 618, ridge: 436 };
const DOOR = { x: 860, w: 86, top: 630 };
const LEMON = { x: 1480, y: 850, s: 1.1 };
const COW = { x: 1900, y: 815, s: 0.95, flip: true };
const GROUND = 900;
const FLOOR_TOP = 880;
const PLINTH = { edge: 40, foot: 112, h: 40 };
const TULSI_DEFAULT = { x: 1000, y: 930, s: 1 };

/** Horizontal extents per plane [depth, x0, x1] and the floor's vertical limits (stage px). */
const SET_X: Array<[number, number, number]> = [
  [1, -1500, 3500],
  [0.65, -1500, 3500],
  [0.35, -1800, 3800],
  [0.15, -2200, 4200],
];
const FLOOR_BOTTOM = 1500;
const YARD_BOTTOM = 1100;

export const UJANCHAR = {
  PLANES: { sky: 0.15, jungle: 0.35, trees: 0.5, yard: 0.65, cow: 0.85, light: 0.95, floor: 1, grass: 1.35, leaves: 1.6 },
  GROUND,
  FLOOR_TOP,
  HUT,
  DOOR,
  LEMON,
  COW,
  TULSI: TULSI_DEFAULT,
  PLINTH,
  SET_X,
  FLOOR_BOTTOM,
} as const;

/** Stage background colour per time of day (shows only through the soft edges of blurred layers). */
export const UJANCHAR_BG: Record<UjancharTime, string> = { morning: "#f2d9a6", dawn: "#ead2b6" };

/** Safe camera ranges at zoom 1 (see the header); ujancharKeepInSet handles other zooms. */
export const UJANCHAR_SAFE = { zoom1: { x: [-1500, 1580], y: [-200, 400] }, zoom: [1, 3] } as const;

/** The Grade for each time of day (Episode 2's go-saap grade for the morning). */
export const ujancharGrade = (time: UjancharTime = "morning"): React.ComponentProps<typeof Grade> =>
  time === "dawn"
    ? { warmth: 0.55, vignette: 0.5, grain: 0.04, bloomAt: [80, 44], tint: "#ffe6cc", tintAmount: 0.1 }
    : { warmth: 0.45, vignette: 0.5, grain: 0.04, bloomAt: [62, 42] };

const smax = (a: number, b: number, k: number) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
const smin = (a: number, b: number, k: number) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + k * k));

/** Clamps a Stage cam so no plane's edge comes into frame (soft corners). Keeps every other cam field. */
export const ujancharKeepInSet = <C extends Cam>(c: C): C => {
  const EDGE = 16;
  const z = Math.max(1, c.zoom);
  let lo = -Infinity;
  let hi = Infinity;
  for (const [d, x0, x1] of SET_X) {
    const s = Math.pow(z, d);
    lo = Math.max(lo, (x0 + EDGE - 960 + 960 / s) / d);
    hi = Math.min(hi, (x1 - EDGE - 960 - 960 / s) / d);
  }
  // the floor's back edge (depth 1) must stay above the bottom of the yard's beaten earth (depth 0.65)
  const w = Math.pow(z, 0.65);
  const yLo = Math.max(-200, (z * (FLOOR_TOP - 540) - w * (YARD_BOTTOM - 540) + 6) / (z - 0.65 * w));
  const yHi = FLOOR_BOTTOM - EDGE - 540 - 540 / z;
  return { ...c, x: smin(smax(c.x, lo, 24), hi, 24), y: smin(smax(c.y, yLo, 24), yHi, 24) };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const hashS = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const sstep = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const ramp = (f: number, a: number, b: number) => (b <= a ? (f >= b ? 1 : 0) : sstep((f - a) / (b - a)));

/** CAM-11 depth blur (CSS px): grows with distance; the camera's own DOF blur counts toward it. */
const bgBlur = (d: number, calm: number, cam?: Cam) => {
  const camBlur = cam ? Math.min(14, Math.abs(d - (cam.focus ?? 1)) * (cam.dof ?? 0)) : 0;
  return Math.max(0, 4.9 * (1 - d) * calm - camBlur);
};

/** CAM-11 background grade (Episode 2: saturate 0.78, contrast 0.88, brightness 0.95, sepia 0.12), plus the dawn cast. */
const bgFilter = (calm: number, time: UjancharTime) => {
  const dawn = time === "dawn";
  const sat = (1 - 0.22 * calm) * (dawn ? 0.95 : 1);
  const con = 1 - 0.12 * calm;
  const bri = (1 - 0.05 * calm) * (dawn ? 0.97 : 1);
  const sep = 0.12 * calm + (dawn ? 0.1 : 0);
  return `saturate(${sat.toFixed(3)}) contrast(${con.toFixed(3)}) brightness(${bri.toFixed(3)}) sepia(${sep.toFixed(3)})`;
};

/** A soft drifting mist band (dawn): long blurred ellipses, slowly sliding sideways. */
const Mist: React.FC<{ f: number; y: number; h: number; x0: number; x1: number; op: number; col?: string; seed: number; speed?: number }> = ({
  f,
  y,
  h,
  x0,
  x1,
  op,
  col = "#fbeedd",
  seed,
  speed = 0.12,
}) => {
  const n = Math.ceil((x1 - x0) / 420) + 2;
  return (
    <g filter="url(#uj-mist-blur)" opacity={op}>
      {Array.from({ length: n }, (_, i) => {
        const w = x1 - x0 + 840;
        const cx = x0 - 420 + ((((i * 420 + 160 * hashS(seed + i) + f * speed * (0.7 + 0.6 * hashS(seed + i + 9))) % w) + w) % w);
        const cy = y + h * (0.5 + 0.3 * (hashS(seed + i * 3) - 0.5)) + 6 * Math.sin(f * 0.01 + i);
        return <ellipse key={i} cx={cx} cy={cy} rx={300 + 160 * hashS(seed + i * 5)} ry={h * (0.35 + 0.25 * hashS(seed + i * 7))} fill={col} />;
      })}
    </g>
  );
};

const MistDefs: React.FC = () => (
  <defs>
    <filter id="uj-mist-blur" x="-30%" y="-100%" width="160%" height="300%">
      <feGaussianBlur stdDeviation={22} />
    </filter>
  </defs>
);

/* ------------------------------------------------------------------ */
/* Sky (0.15)                                                          */
/* ------------------------------------------------------------------ */

/** Autumn dawn sky: pale blue overhead to rose and gold at the horizon, the low sun behind the jungle on the right. */
const DawnSky: React.FC<{ f: number; sunX?: number; sunY?: number }> = ({ f, sunX = 1860, sunY = 250 }) => (
  <g>
    <defs>
      {/* in user space, so the visible band (sky-plane y about -100 to 700) spans blue overhead to gold at the horizon */}
      <linearGradient id="uj-dawn-sky" gradientUnits="userSpaceOnUse" x1={0} y1={-200} x2={0} y2={720}>
        <stop offset="0%" stopColor="#86a8cc" />
        <stop offset="34%" stopColor="#c4c4d8" />
        <stop offset="60%" stopColor="#f2c9ae" />
        <stop offset="82%" stopColor="#ffc184" />
        <stop offset="100%" stopColor="#ffb470" />
      </linearGradient>
      <radialGradient id="uj-dawn-sun">
        <stop offset="0%" stopColor="#fff4d6" stopOpacity={0.95} />
        <stop offset="9%" stopColor="#ffe2a8" stopOpacity={0.8} />
        <stop offset="32%" stopColor="#ffc884" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#ffc078" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-2200} y={-1200} width={6400} height={2400} fill="url(#uj-dawn-sky)" />
    <circle cx={sunX} cy={sunY} r={560} fill="url(#uj-dawn-sun)" />
    <circle cx={sunX} cy={sunY} r={58} fill="#fff2cc" opacity={0.7} />
    <circle cx={sunX} cy={sunY} r={44} fill="#fffaf0" />
    {/* thin autumn cloud streaks, lit rose-gold from below, drifting slowly */}
    {Array.from({ length: 11 }, (_, i) => {
      const span = 5200;
      const cx = ((((-1600 + i * 480 + f * (0.12 + 0.12 * hashS(i + 3))) % span) + span) % span) - 1600;
      const cy = -60 + 360 * hashS(i * 3 + 1);
      const s = 0.7 + 0.8 * hashS(i * 5 + 2);
      return (
        <g key={i} transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${s.toFixed(3)})`} opacity={0.8}>
          <ellipse cx={0} cy={0} rx={230} ry={16} fill="#f7e6dc" />
          <ellipse cx={-60} cy={-10} rx={110} ry={14} fill="#fbf0ea" />
          <ellipse cx={30} cy={8} rx={210} ry={8} fill="#ffcf9a" opacity={0.75} />
        </g>
      );
    })}
    <Birds f={f} x={420} y={300} n={5} s={0.8} />
  </g>
);

export const UjancharSkyLayer: React.FC<{ f: number; time?: UjancharTime; cam?: Cam; calm?: number }> = ({ f, time = "morning", cam, calm = 1 }) => (
  <Layer depth={0.15} extraBlur={bgBlur(0.15, calm, cam)}>
    {time === "dawn" ? (
      <DawnSky f={f} />
    ) : (
      <g>
        {/* Episode 2's morning sky, with a wider backing so wide pans never reach its edge */}
        <rect x={-2200} y={-1200} width={6400} height={2400} fill="#cfe0d8" />
        <DaySky f={f} sunX={1480} sunY={230} />
      </g>
    )}
  </Layer>
);

/* ------------------------------------------------------------------ */
/* Jungle (0.35)                                                       */
/* ------------------------------------------------------------------ */

/** Episode 2's canopy masses (i 0..69 are identical), extended on both sides for wide pans. */
const JUNGLE: Array<[number, number, number, number]> = Array.from({ length: 100 }, (_, k) => {
  const i = k - 15;
  return [-950 + i * 57 + 30 * hashS(i), 470 + 120 * hashS(i + 40), 70 + 70 * hashS(i + 80), Math.floor(3 * hashS(i + 120))];
});
const JUNGLE_COL = ["#2c5428", "#36632f", "#24481f"];

export const UjancharJungleLayer: React.FC<{ f: number; time?: UjancharTime; cam?: Cam; calm?: number }> = ({ f, time = "morning", cam, calm = 1 }) => {
  const dawn = time === "dawn";
  return (
    <Layer depth={0.35} extraBlur={bgBlur(0.35, calm, cam)}>
      <MistDefs />
      <rect x={-1800} y={560} width={5600} height={1040} fill="#264a22" />
      {[-1250, -700, -250, 380, 980, 1620, 2240, 2780, 3330].map((x, i) => (
        <Palm key={`jp${x}`} x={x} y={640} s={0.85 + 0.2 * hashS(i + 7)} f={f} seed={i + 11} col="#2f5a2c" />
      ))}
      {JUNGLE.map(([x, y, r, k], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={JUNGLE_COL[k]} />
          <circle cx={x + r * 0.25} cy={y - r * 0.35} r={r * 0.5} fill={dawn ? "#c0a86a" : "#5d8a45"} opacity={dawn ? 0.18 : 0.25} />
        </g>
      ))}
      {/* distance haze: Episode 2's sunlit haze in the morning; a thicker rose-gold haze and lying mist at dawn */}
      <rect x={-1800} y={380} width={5600} height={1220} fill={dawn ? "#f6d6b0" : "#d9e6c2"} opacity={dawn ? 0.18 : 0.16} />
      {dawn && <Mist f={f} y={610} h={140} x0={-1800} x1={3800} op={0.38} col="#fde6c6" seed={3} />}
    </Layer>
  );
};

/* ------------------------------------------------------------------ */
/* Palms and banana trees (0.5)                                        */
/* ------------------------------------------------------------------ */

export const UjancharTreesLayer: React.FC<{ f: number; time?: UjancharTime; cam?: Cam; calm?: number }> = ({ f, time = "morning", cam, calm = 1 }) => (
  <Layer depth={0.5} extraBlur={bgBlur(0.5, calm, cam)}>
    <MistDefs />
    {[
      [-1100, 1.1, 6],
      [-300, 1.05, 2],
      [520, 1.15, 5],
      [1320, 1.25, 8],
      [1820, 1.1, 4],
      [2420, 1.2, 9],
      [3120, 1.1, 3],
    ].map(([x, s, sd]) => (
      <Palm key={`p${x}`} x={x} y={860} s={s} f={f} seed={sd} />
    ))}
    {[
      [-760, 1.55],
      [140, 1.5],
      [1060, 1.7],
      [1640, 1.55],
      [2120, 1.75],
      [2700, 1.6],
      [3300, 1.5],
    ].map(([x, s]) => (
      <Banana key={`b${x}`} x={x} y={866} s={s} f={f} />
    ))}
    {time === "dawn" && <Mist f={f} y={770} h={110} x0={-1500} x1={3500} op={0.3} col="#fde6c6" seed={17} speed={0.18} />}
  </Layer>
);

/* ------------------------------------------------------------------ */
/* The back of the courtyard (0.65): fence, bushes, hut, lemon tree      */
/* ------------------------------------------------------------------ */

/** Red hibiscus flower, face on: five broad overlapping petals, a dark eye and the long staminal column. */
const JabaFlower: React.FC<{ x: number; y: number; r: number; rot?: number; open?: number }> = ({ x, y, r, rot = 0, open = 1 }) => (
  <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
    {[0, 1, 2, 3, 4].map((k) => (
      <ellipse key={k} cx={0} cy={-r * 0.5 * open} rx={r * 0.5} ry={r * 0.58 * open + r * 0.1} fill={k % 2 ? "#cf1f2b" : "#e0303a"} transform={`rotate(${k * 72})`} />
    ))}
    {[0, 1, 2, 3, 4].map((k) => (
      <path key={`v${k}`} d={`M 0 0 L 0 ${(-r * 0.8 * open).toFixed(1)}`} stroke="#9a0f1c" strokeWidth={Math.max(0.6, r * 0.05)} opacity={0.45} transform={`rotate(${k * 72 + 8})`} />
    ))}
    <circle r={r * 0.24} fill="#7d0a16" />
    <path d={`M 0 0 Q ${(r * 0.35).toFixed(1)} ${(-r * 0.5).toFixed(1)} ${(r * 0.55).toFixed(1)} ${(-r * 1.05).toFixed(1)}`} stroke="#f2c6c0" strokeWidth={Math.max(0.8, r * 0.09)} fill="none" strokeLinecap="round" />
    <circle cx={r * 0.55} cy={-r * 1.05} r={Math.max(1, r * 0.13)} fill="#f7c63a" />
    <ellipse cx={-r * 0.18} cy={-r * 0.42} rx={r * 0.16} ry={r * 0.08} fill="#ff8a8a" opacity={0.5} transform={`rotate(-30 ${(-r * 0.18).toFixed(1)} ${(-r * 0.42).toFixed(1)})`} />
  </g>
);

/** Episode 2's round leafy bush; `flowers` sprinkles small hibiscus blooms over it. Base at (x, y). */
const Bush: React.FC<{ x: number; y: number; w: number; f: number; seed: number; flowers?: number }> = ({ x, y, w, f, seed, flowers = 0 }) => {
  const n = Math.max(4, Math.round(w / 34));
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={w * 0.55} ry={8} fill="#1d1408" opacity={0.25} />
      {Array.from({ length: n }, (_, i) => {
        const u = n === 1 ? 0.5 : i / (n - 1);
        const r = 26 + 20 * hashS(seed + i) + 18 * Math.sin(Math.PI * u);
        const cx = x - w / 2 + w * u + 4 * Math.sin(f * 0.03 + seed + i);
        const cy = y - r * 0.7;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={i % 2 ? "#3f7232" : "#33602b"} />
            <circle cx={cx + r * 0.2} cy={cy - r * 0.35} r={r * 0.55} fill="#7aa64a" opacity={0.35} />
          </g>
        );
      })}
      {Array.from({ length: flowers }, (_, i) => {
        const u = (i + 0.5) / flowers;
        const fx = x - w * 0.42 + w * 0.84 * u + 10 * (hashS(seed * 7 + i) - 0.5) + 3 * Math.sin(f * 0.03 + seed + i);
        const fy = y - 22 - 50 * hashS(seed * 3 + i * 2) * Math.sin(Math.PI * u) - 8;
        return <JabaFlower key={`f${i}`} x={fx} y={fy} r={7 + 2 * hashS(seed + i * 5)} rot={360 * hashS(seed + i * 11)} />;
      })}
    </g>
  );
};

/** The bamboo lattice fence (Episode 2), from x0 to x1, posts every 58 px. */
const FenceRun: React.FC<{ x0: number; x1: number; seed: number }> = ({ x0, x1, seed }) => {
  const posts: number[] = [];
  for (let x = x0; x <= x1; x += 58) posts.push(x);
  return (
    <g>
      <g stroke="#b39556" strokeWidth={2.6} opacity={0.9}>
        {Array.from({ length: Math.ceil((x1 - x0) / 22) + 8 }, (_, i) => {
          const x = x0 - 120 + i * 22;
          return (
            <g key={i}>
              <line x1={x} y1={860} x2={x + 110} y2={726} />
              <line x1={x + 110} y1={860} x2={x} y2={726} stroke="#9c7f45" />
            </g>
          );
        })}
      </g>
      <rect x={x0} y={736} width={x1 - x0} height={7} fill="#a8894c" />
      <rect x={x0} y={800} width={x1 - x0} height={7} fill="#a8894c" />
      {posts.map((x, i) => {
        const h = 150 + 14 * hashS(i + seed);
        return (
          <g key={x}>
            <rect x={x - 5} y={862 - h} width={10} height={h} rx={4} fill="#9c7a44" />
            {[0.3, 0.62].map((k) => (
              <rect key={k} x={x - 6} y={862 - h * k} width={12} height={3} fill="#6f5530" />
            ))}
            <rect x={x - 2} y={862 - h} width={3} height={h} fill="#d8bd7c" opacity={0.4} />
          </g>
        );
      })}
    </g>
  );
};

/** The fence along the back of the courtyard (Episode 2's run from the hut to the right, extended both ways). */
const Fence: React.FC<{ f: number; fenceJaba: boolean }> = ({ f, fenceJaba }) => (
  <g>
    {/* a short run behind the hut on the left, so wide pans to the left still close the courtyard */}
    <FenceRun x0={-1500} x1={HUT.x0 + 60} seed={41} />
    {/* Episode 2's run (x0 = HUT.x1 - 20, posts from there), continued to the set edge */}
    <FenceRun x0={HUT.x1 - 20} x1={3500} seed={3} />
    {[1290, 1700, 2010, 2380, 2760].map((x, i) => (
      <Bush key={x} x={x} y={872} w={170 + 60 * hashS(i + 5)} f={f} seed={i * 3 + 1} flowers={fenceJaba && (x === 1700 || x === 2380) ? 5 : 0} />
    ))}
    {[-1300, -960, 3080, 3360].map((x, i) => (
      <Bush key={x} x={x} y={872} w={190 + 50 * hashS(i + 31)} f={f} seed={i * 5 + 40} />
    ))}
  </g>
);

/** A clay water pot (kolshi). Base at (x, y). */
const Kolshi: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={18} ry={3.5} fill="#2a1a0c" opacity={0.3} />
    <path d="M -9 -38 C -9 -32 -20 -30 -20 -16 C -20 -4 -10 0 0 0 C 10 0 20 -4 20 -16 C 20 -30 9 -32 9 -38 Z" fill="#b25a2e" />
    <ellipse cx={0} cy={-39} rx={11} ry={3.4} fill="#8e4220" />
    <path d="M -14 -24 C -10 -28 -4 -29 2 -28" stroke="#e08a52" strokeWidth={3} fill="none" opacity={0.6} strokeLinecap="round" />
    <path d="M -18 -15 C -8 -11 8 -11 18 -15" stroke="#7a3818" strokeWidth={1.4} fill="none" opacity={0.6} />
  </g>
);

/** A grass broom (jhata) leaning on the wall. Foot at (x, y). */
const Broom: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <line x1={x + 22} y1={y - 120} x2={x + 6} y2={y - 34} stroke="#7a5a32" strokeWidth={4} strokeLinecap="round" />
    {Array.from({ length: 9 }, (_, i) => (
      <line key={i} x1={x + 6} y1={y - 36} x2={x - 10 + i * 3.4} y2={y} stroke={i % 2 ? "#c9a85e" : "#a8874a"} strokeWidth={1.6} />
    ))}
    <rect x={x + 1} y={y - 40} width={10} height={5} rx={2} fill="#6a4a28" transform={`rotate(-10 ${x + 6} ${y - 38})`} />
  </g>
);

/** Episode 2's mud-walled hut with its curved (do-chala) thatched roof, veranda posts, door, window, pots and broom. */
const Hut: React.FC<{ f: number; children?: React.ReactNode }> = ({ f, children }) => {
  const { x0, x1, top, bottom, eave, ridge } = HUT;
  const mid = (x0 + x1) / 2;
  const posts = [x0 + 50, x0 + 420, x0 + 820, DOOR.x - 120, x1 - 46];
  return (
    <g>
      <rect x={x0 + 26} y={eave - 20} width={x1 - x0 - 52} height={top - eave + 20} fill="#b8875a" />
      <rect x={x0 + 26} y={top - 40} width={x1 - x0 - 52} height={40} fill="#9e6e44" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M ${x0 + 60 + i * 130} ${680 + 40 * hashS(i)} q 40 -6 80 2`} stroke="#a2744a" strokeWidth={2} fill="none" opacity={0.5} />
      ))}
      <rect x={x0 + 560} y={672} width={70} height={58} fill="#2c1c10" />
      {[0, 1, 2, 3].map((k) => (
        <rect key={k} x={x0 + 568 + k * 16} y={672} width={5} height={58} fill="#9c7a44" />
      ))}
      <rect x={x0 + 554} y={666} width={82} height={7} fill="#6b4528" />
      <rect x={DOOR.x - DOOR.w / 2} y={DOOR.top} width={DOOR.w} height={top - DOOR.top} fill="#24160c" />
      <rect x={DOOR.x - DOOR.w / 2} y={top - 50} width={DOOR.w} height={50} fill="#3a2414" opacity={0.6} />
      <path d={`M ${DOOR.x - DOOR.w / 2} ${DOOR.top} L ${DOOR.x - DOOR.w / 2 - 26} ${DOOR.top + 10} L ${DOOR.x - DOOR.w / 2 - 26} ${top - 4} L ${DOOR.x - DOOR.w / 2} ${top} Z`} fill="#7a5232" />
      <rect x={DOOR.x - DOOR.w / 2 - 7} y={DOOR.top - 8} width={DOOR.w + 14} height={9} fill="#6b4528" />
      <rect x={DOOR.x - DOOR.w / 2 - 7} y={DOOR.top} width={7} height={top - DOOR.top} fill="#6b4528" />
      <rect x={DOOR.x + DOOR.w / 2} y={DOOR.top} width={7} height={top - DOOR.top} fill="#6b4528" />
      <rect x={x0 + 26} y={eave - 20} width={x1 - x0 - 52} height={60} fill="#2a1608" opacity={0.28} />
      <Kolshi x={x0 + 300} y={top} />
      <Kolshi x={x0 + 336} y={top} s={0.85} />
      <Kolshi x={DOOR.x + 96} y={top} s={0.9} />
      <Broom x={DOOR.x - 190} y={top} />
      <rect x={x0} y={top - 6} width={x1 - x0} height={8} fill="#c9a06c" />
      <rect x={x0} y={top + 2} width={x1 - x0} height={bottom - top - 2} fill="#a8794a" />
      <rect x={x0} y={top + 2} width={x1 - x0} height={4} fill="#d4ad78" opacity={0.6} />
      <rect x={x0} y={bottom - 8} width={x1 - x0} height={8} fill="#7e5632" opacity={0.6} />
      {children}
      {posts.map((x) => (
        <g key={x}>
          <rect x={x - 5} y={eave - 6} width={10} height={top - eave + 6} fill="#9c7a44" />
          <rect x={x - 2} y={eave - 6} width={3} height={top - eave + 6} fill="#d8bd7c" opacity={0.4} />
          {[0.35, 0.7].map((k) => (
            <rect key={k} x={x - 6} y={eave + (top - eave) * k} width={12} height={3} fill="#6f5530" />
          ))}
        </g>
      ))}
      <path
        d={`M ${x0 - 60} ${eave + 26} Q ${mid} ${eave - 30} ${x1 + 60} ${eave + 26} L ${x1 - 40} ${ridge + 16} Q ${mid} ${ridge - 34} ${x0 + 40} ${ridge + 16} Z`}
        fill="#c9a35a"
      />
      <path d={`M ${x0 + 40} ${ridge + 16} Q ${mid} ${ridge - 34} ${x1 - 40} ${ridge + 16}`} stroke="#e4c47c" strokeWidth={8} fill="none" opacity={0.6} />
      {Array.from({ length: 46 }, (_, i) => {
        const u = i / 45;
        const xb = x0 - 50 + (x1 - x0 + 100) * u;
        const yb = eave + 22 - 56 * Math.sin(Math.PI * u) * 0.5;
        return <line key={i} x1={xb} y1={yb} x2={xb + (u - 0.5) * 40} y2={yb - 110 - 30 * hashS(i)} stroke="#a8823e" strokeWidth={1.6} opacity={0.55} />;
      })}
      <path d={`M ${x0 - 60} ${eave + 26} Q ${mid} ${eave - 30} ${x1 + 60} ${eave + 26} L ${x1 + 56} ${eave + 40} Q ${mid} ${eave - 16} ${x0 - 56} ${eave + 40} Z`} fill="#8e6a32" />
      {/* a wisp of cooking smoke from behind the roof */}
      {[0, 1, 2].map((k) => {
        const t = ((f + k * 30) % 90) / 90;
        return <circle key={k} cx={x0 + 260 + Math.sin(t * 5 + k) * 14 + t * 30} cy={ridge - 10 - t * 170} r={12 + t * 28} fill="#f4efe8" opacity={0.35 * (1 - t)} />;
      })}
    </g>
  );
};

/** Episode 2's lemon tree with a sway and yellow fruit. Base at (x, y). */
const LemonTree: React.FC<{ f: number; x: number; y: number; s?: number }> = ({ f, x, y, s = 1 }) => {
  const sway = Math.sin(f * 0.035) * 1.6;
  const canopy: Array<[number, number, number, string]> = [
    [-120, -330, 120, "#2e5c2c"],
    [110, -340, 130, "#346a31"],
    [0, -430, 150, "#3b7a37"],
    [-60, -250, 110, "#2a5428"],
    [90, -240, 105, "#2f5f2d"],
  ];
  const lemons: Array<[number, number]> = [
    [-150, -300],
    [-90, -220],
    [-30, -400],
    [40, -300],
    [120, -250],
    [160, -360],
    [-120, -410],
    [60, -440],
    [-20, -260],
    [100, -410],
    [-180, -330],
    [150, -420],
  ];
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={260} ry={22} fill="#000" opacity={0.25} />
      <path d="M -26 0 Q -18 -150 -10 -260 L 14 -260 Q 22 -150 30 0 Z" fill="#5a3f28" />
      <path d="M -6 -210 Q 40 -270 80 -300" stroke="#5a3f28" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d="M -10 -200 Q -60 -250 -100 -280" stroke="#5a3f28" strokeWidth={12} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${sway} 0 -260)`}>
        {canopy.map(([cx, cy, r, col], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={col} />
        ))}
        {canopy.map(([cx, cy, r], i) => (
          <circle key={`h${i}`} cx={cx + r * 0.25} cy={cy - r * 0.3} r={r * 0.55} fill="#7aa64a" opacity={0.28} />
        ))}
        {lemons.map(([lx, ly], i) => (
          <g key={`l${i}`}>
            <circle cx={lx} cy={ly} r={9} fill="#f2d24a" />
            <circle cx={lx - 3} cy={ly - 3} r={3} fill="#fff6c0" opacity={0.8} />
          </g>
        ))}
      </g>
    </g>
  );
};

export const UjancharYardLayer: React.FC<{
  f: number;
  time?: UjancharTime;
  cam?: Cam;
  calm?: number;
  fenceJaba?: boolean;
  veranda?: React.ReactNode;
  yard?: React.ReactNode;
}> = ({ f, time = "morning", cam, calm = 1, fenceJaba = true, veranda, yard }) => (
  <Layer depth={0.65} extraBlur={bgBlur(0.65, calm, cam)}>
    <MistDefs />
    {/* the back of the courtyard: beaten earth (deep, so the floor's back edge never opens a gap), fence, hut, lemon tree */}
    <rect x={-1500} y={800} width={5000} height={YARD_BOTTOM - 800} fill="#9c7448" />
    <Fence f={f} fenceJaba={fenceJaba} />
    <Hut f={f}>{veranda}</Hut>
    <LemonTree f={f} x={LEMON.x} y={LEMON.y} s={LEMON.s} />
    {time === "dawn" && (
      <g>
        {/* the low sun from the right warms the thatch and the fence; mist lies low along the back of the courtyard */}
        <rect x={-1500} y={380} width={5000} height={520} fill="#ffcf96" opacity={0.08} />
        <Mist f={f} y={820} h={70} x0={-1500} x1={3500} op={0.3} seed={29} speed={0.22} />
      </g>
    )}
    {yard}
  </Layer>
);

/* ------------------------------------------------------------------ */
/* The cow (0.85), optional                                            */
/* ------------------------------------------------------------------ */

const COW_HIDE_DARK = "#5f4a3a";
const COW_NEAR = "#7d6349";
const COW_FAR = "#55422f";
const COW_HOOF = "#2e221a";
const COW_WHITE = "#ece4d0";
const COW_BROWN = "#6e4a2e";
const HORN = "#e8dcb6";
const HORN_FAR = "#b3a27a";
const COW_TORSO =
  "M -120 -160 C -120 -176 -80 -168 -40 -168 C 0 -170 20 -178 50 -186 C 74 -194 96 -180 104 -160 C 112 -140 112 -110 100 -90 C 92 -72 60 -58 20 -56 C -20 -54 -70 -60 -100 -72 C -118 -82 -124 -120 -120 -160 Z";
const COW_NECK = "M 60 -186 C 110 -200 150 -214 178 -216 L 190 -172 C 170 -160 150 -140 128 -110 C 118 -96 108 -92 100 -92 L 80 -120 C 66 -150 60 -170 60 -186 Z";
const COW_HEAD =
  "M 164 -218 C 182 -226 204 -222 214 -210 C 228 -194 238 -170 244 -150 C 248 -136 244 -122 232 -118 C 218 -114 204 -122 190 -140 C 180 -152 170 -180 164 -218 Z";
const COW_DEWLAP = "M 126 -132 C 134 -112 120 -92 110 -66 C 104 -56 92 -60 94 -72 C 100 -96 108 -116 112 -130 Z";

const Bone: React.FC<{ a: [number, number]; b: [number, number]; w: number; col: string }> = ({ a, b, w, col }) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={w} strokeLinecap="round" />
);

const CowLeg: React.FC<{ x: number; hind: boolean; col: string }> = ({ x, hind, col }) => {
  const knee: [number, number] = hind ? [x - 14, -38] : [x + 1, -36];
  const footX = hind ? x - 9 : x;
  return (
    <g>
      <Bone a={[x, -84]} b={knee} w={hind ? 22 : 24} col={col} />
      <circle cx={knee[0]} cy={knee[1]} r={hind ? 7 : 8} fill={col} />
      <Bone a={knee} b={[footX, -9]} w={12} col={col} />
      <ellipse cx={footX} cy={-4} rx={8} ry={4.2} fill={COW_HOOF} />
    </g>
  );
};

/** Episode 2's cow idle: a slow head sway and, every 240 frames, a look up. */
const cowLean = (f: number) => {
  const k = f % 240;
  const look = ramp(k, 150, 172) * (1 - ramp(k, 206, 228));
  return 0.2 + 0.1 * Math.sin(f * 0.021) + 0.1 * noise1(f * 0.03, 11) + 0.22 * look;
};

/** Episode 2's Bengal cow (zebu, side profile facing +x; flip turns it to face -x). Feet on y = 0. */
const Cow: React.FC<{ x: number; y: number; s?: number; flip?: boolean; f: number }> = ({ x, y, s = 1, flip = false, f }) => {
  const lean = cowLean(f);
  const headDeg = ((-(lean - 0.2) * 0.9 + 0.05 * Math.sin(f * 0.017)) * 180) / Math.PI;
  const earDeg = -8 + 5 * Math.sin(f * 0.09);
  const k = f % 150;
  const swish = ramp(k, 0, 8) * (1 - ramp(k, 34, 50));
  const tailDeg = 16 * swish * Math.sin(k * 0.55) + 2.5 * Math.sin(f * 0.05);
  const breath = 2 * (0.5 + 0.5 * Math.sin(f * 0.11));
  return (
    <g transform={`translate(${x}, ${y}) scale(${flip ? -s : s}, ${s})`}>
      <defs>
        <linearGradient id="uj-cow-grad" gradientUnits="userSpaceOnUse" x1={0} y1={-196} x2={0} y2={-54}>
          <stop offset={0} stopColor="#d2bea0" />
          <stop offset={0.5} stopColor="#a68b6d" />
          <stop offset={1} stopColor="#5a4536" />
        </linearGradient>
        <clipPath id="uj-cow-clip">
          <path d={COW_TORSO} />
          <path d={COW_NECK} />
        </clipPath>
        <clipPath id="uj-cow-head-clip">
          <path d={COW_HEAD} />
        </clipPath>
      </defs>
      <ellipse cx={0} cy={0} rx={176} ry={11} fill="#2a1a0c" opacity={0.32} />
      <g transform={`rotate(${tailDeg} -118 -160)`}>
        <path d="M -118 -160 C -134 -128 -137 -92 -131 -50" stroke={COW_HIDE_DARK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <path d="M -131 -54 C -140 -44 -141 -30 -132 -18 C -124 -26 -122 -44 -131 -54 Z" fill={COW_HOOF} />
      </g>
      <CowLeg x={42} hind={false} col={COW_FAR} />
      <CowLeg x={-62} hind col={COW_FAR} />
      <CowLeg x={66} hind={false} col={COW_NEAR} />
      <CowLeg x={-84} hind col={COW_NEAR} />
      <g transform={`translate(0, ${-breath})`}>
        <path d={COW_TORSO} fill="url(#uj-cow-grad)" />
        <path d={COW_NECK} fill="url(#uj-cow-grad)" />
        <g clipPath="url(#uj-cow-clip)">
          <ellipse cx={-42} cy={-150} rx={50} ry={20} fill={COW_BROWN} opacity={0.85} transform="rotate(-6 -42 -150)" />
          <ellipse cx={66} cy={-176} rx={30} ry={14} fill="#7a5233" opacity={0.7} />
          <ellipse cx={-104} cy={-126} rx={26} ry={28} fill={COW_BROWN} opacity={0.8} />
          <ellipse cx={92} cy={-150} rx={18} ry={12} fill={COW_BROWN} opacity={0.6} />
          <ellipse cx={-6} cy={-98} rx={44} ry={20} fill={COW_WHITE} opacity={0.92} />
          <ellipse cx={-76} cy={-104} rx={20} ry={16} fill={COW_WHITE} opacity={0.8} />
          <ellipse cx={4} cy={-56} rx={118} ry={22} fill="#2a1d14" opacity={0.38} />
          <ellipse cx={-6} cy={-178} rx={100} ry={10} fill="#fff4dc" opacity={0.16} />
        </g>
        <path d={COW_DEWLAP} fill={COW_HIDE_DARK} opacity={0.9} />
        <path d="M 116 -128 C 110 -104 104 -84 100 -66" stroke="#3e2e23" strokeWidth={1} fill="none" opacity={0.5} />
        <g transform={`rotate(${headDeg} 172 -196)`}>
          <path d="M 186 -220 C 186 -230 192 -236 200 -238 C 198 -231 198 -226 199 -218 Z" fill={HORN_FAR} />
          <path d="M 172 -214 C 168 -226 172 -234 182 -238 C 181 -230 181 -222 184 -212 Z" fill={HORN} />
          <g transform={`translate(170, -206) rotate(${earDeg})`}>
            <path d="M 0 0 C -18 -10 -38 -8 -50 2 C -36 10 -16 12 0 6 Z" fill={COW_HIDE_DARK} />
            <path d="M -4 1 C -16 -3 -30 -2 -40 3 C -28 6 -14 7 -4 4 Z" fill="#c49a80" opacity={0.7} />
          </g>
          <path d={COW_HEAD} fill="url(#uj-cow-grad)" />
          <g clipPath="url(#uj-cow-head-clip)">
            <ellipse cx={222} cy={-172} rx={6} ry={16} fill={COW_WHITE} opacity={0.8} transform="rotate(18 222 -172)" />
          </g>
          <ellipse cx={236} cy={-132} rx={11} ry={14} fill="#b98d7a" />
          <circle cx={243} cy={-140} r={2.2} fill="#4a3026" />
          <path d="M 226 -122 Q 236 -117 244 -124" stroke="#5a3e32" strokeWidth={1.2} fill="none" opacity={0.6} />
          <ellipse cx={204} cy={-196} rx={9} ry={3} fill={COW_HIDE_DARK} opacity={0.4} />
          <ellipse cx={206} cy={-190} rx={4.6} ry={4} fill="#1a110c" />
          <circle cx={207.4} cy={-191.4} r={1.2} fill="#ffffff" opacity={0.85} />
        </g>
      </g>
    </g>
  );
};

export interface CowPlacement {
  x?: number;
  y?: number;
  s?: number;
  flip?: boolean;
}

export const UjancharCowLayer: React.FC<{ f: number; cam?: Cam; calm?: number; cow?: boolean | CowPlacement }> = ({ f, cam, calm = 1, cow = false }) => {
  if (!cow) return null;
  const c = { ...COW, ...(cow === true ? {} : cow) };
  return (
    <Layer depth={0.85} extraBlur={bgBlur(0.85, calm, cam)}>
      <Cow x={c.x} y={c.y} s={c.s} flip={c.flip} f={f} />
    </Layer>
  );
};

/* ------------------------------------------------------------------ */
/* The whole backdrop, calmed (CAM-11)                                  */
/* ------------------------------------------------------------------ */

export interface UjancharBackdropProps {
  f: number;
  time?: UjancharTime;
  cam?: Cam;
  calm?: number;
  fenceJaba?: boolean;
  cow?: boolean | CowPlacement;
  veranda?: React.ReactNode;
  yard?: React.ReactNode;
}

/** Sky, jungle, trees, the back of the courtyard and the optional cow, inside the CAM-11 background grade. */
export const UjancharBackdrop: React.FC<UjancharBackdropProps> = ({ f, time = "morning", cam, calm = 1, fenceJaba = true, cow = false, veranda, yard }) => {
  const skinned = useSetSkin()?.ujancharBackdrop?.({ f, time, cam, calm, fenceJaba, cow, veranda, yard });
  if (skinned !== undefined) return <>{skinned}</>;
  return (
    <div style={{ position: "absolute", inset: 0, filter: bgFilter(calm, time) }}>
      <UjancharSkyLayer f={f} time={time} cam={cam} calm={calm} />
      <UjancharJungleLayer f={f} time={time} cam={cam} calm={calm} />
      <UjancharTreesLayer f={f} time={time} cam={cam} calm={calm} />
      <UjancharYardLayer f={f} time={time} cam={cam} calm={calm} fenceJaba={fenceJaba} veranda={veranda} yard={yard} />
      <UjancharCowLayer f={f} cam={cam} calm={calm} cow={cow} />
      {time === "dawn" && (
        // the gold of the low sun over the far planes, strongest on the sun side (right)
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(ellipse 60% 75% at 92% 36%, rgba(255,196,110,0.6) 0%, rgba(255,170,90,0.16) 50%, rgba(0,0,0,0) 100%)",
            mixBlendMode: "screen",
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Tulsi mancha and hibiscus shrub (floor-plane pieces)                  */
/* ------------------------------------------------------------------ */

export type TulsiLamp = "unlit" | "lit" | "none";

/**
 * The tulsi mancha (তুলসী মঞ্চ): a raised mud-plastered platform in the courtyard, in the hut's materials. A low step,
 * a square pedestal with a small arched lamp niche in front (a clay pradip inside; lit or unlit), a terracotta
 * planter rim with soil and a bushy tulsi plant with purple flower spikes. Base centre at (x, y); at s 1 the pedestal
 * top is at y - 190 and the plant reaches y - 300. The niche lamp sits at (x, y - 40 s). Light from the upper right.
 */
export const UjancharTulsiMancha: React.FC<{ x: number; y: number; s?: number; f: number; lamp?: TulsiLamp; seed?: number }> = ({
  x,
  y,
  s = 1,
  f,
  lamp = "unlit",
  seed = 0,
}) => {
  const sway = 1.6 * Math.sin(f * 0.04 + seed) + 0.8 * noise1(f * 0.03, 70 + seed);
  // tulsi: a few woody stems rising from the soil and branching, a bushy dome of leaf pairs, purple flower spikes
  const stems = Array.from({ length: 7 }, (_, i) => {
    const bx = -36 + i * 12 + 4 * (hashS(seed + i) - 0.5);
    const tx = bx * 2.1 + 14 * (hashS(seed + i * 3) - 0.5);
    const ty = -78 - 34 * Math.sin((Math.PI * (i + 0.5)) / 7) - 10 * hashS(seed + i * 5);
    return { bx, tx, ty };
  });
  const leafs = Array.from({ length: 64 }, (_, i) => {
    const th = Math.PI * (0.04 + 0.92 * hashS(seed * 31 + i * 1.7));
    const r = Math.sqrt(0.15 + 0.85 * hashS(seed * 37 + i * 2.3));
    return { x: -Math.cos(th) * 80 * r, y: -16 - Math.sin(th) * 98 * r, rot: 70 * (hashS(seed + i * 4.1) - 0.5) + (th * 180) / Math.PI - 90, k: i % 3 };
  });
  const spikes = Array.from({ length: 11 }, (_, i) => {
    const th = Math.PI * (0.12 + (0.76 * i) / 10);
    const r = 0.92 + 0.12 * hashS(seed * 41 + i);
    return { x: -Math.cos(th) * 80 * r, y: -14 - Math.sin(th) * 100 * r, rot: (th * 180) / Math.PI - 90 };
  });
  const TL = ["#3a7232", "#4c8a3c", "#2f6229"];
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {lamp === "lit" && <GlowDefs />}
      {/* ground shadow, cast to the lower left by the sun at the upper right */}
      <ellipse cx={-14} cy={4} rx={150} ry={16} fill="#2a1a0c" opacity={0.28} />
      {/* the low step */}
      <path d="M -112 0 L -104 -26 L 104 -26 L 112 0 Z" fill="#a8794a" />
      <rect x={-104} y={-30} width={208} height={6} fill="#d4ad78" />
      <rect x={-112} y={-6} width={224} height={6} fill="#7e5632" opacity={0.5} />
      {/* the pedestal: front face (lit), the left side face (in shade) */}
      <path d="M -78 -26 L -70 -168 L -84 -176 L -94 -26 Z" fill="#8e6440" />
      <path d="M -78 -26 L -70 -168 L 70 -168 L 78 -26 Z" fill="#c9a06c" />
      <path d="M 52 -26 L 50 -168 L 70 -168 L 78 -26 Z" fill="#dcb67e" opacity={0.6} />
      {/* a whitewashed band with rice-paste alpana dots under the top */}
      <rect x={-71} y={-150} width={142} height={14} fill="#efe2c6" opacity={0.85} />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={-60 + i * 15} cy={-143} r={2.6} fill="#c0502e" opacity={0.75} />
      ))}
      {/* mud texture strokes */}
      <path d="M -50 -100 q 20 -4 40 1 M 14 -70 q 18 -3 34 2 M -46 -60 q 12 -2 24 1" stroke="#a87c50" strokeWidth={2} fill="none" opacity={0.5} />
      {/* the lamp niche: a small arched opening, dark inside */}
      <path d="M -24 -28 L -24 -68 Q 0 -94 24 -68 L 24 -28 Z" fill="#7a5232" />
      <path d="M -19 -28 L -19 -66 Q 0 -86 19 -66 L 19 -28 Z" fill="#2a180c" />
      <rect x={-26} y={-30} width={52} height={5} fill="#a8794a" />
      {lamp !== "none" && (
        <g transform="translate(0, -38)">
          {lamp === "lit" && <circle cx={0} cy={-10} r={30} fill="url(#fx-glow-warm)" opacity={0.7} />}
          <path d="M -11 -2 Q -10 7 0 8 Q 10 7 11 -2 Q 6 1 0 1 Q -6 1 -11 -2 Z" fill="#a4522a" />
          <path d="M -11 -2 Q 0 -5 11 -2 Q 6 1 0 1 Q -6 1 -11 -2 Z" fill="#6a2f16" />
          <path d="M 9 -3 Q 13 -6 12 -2 Z" fill="#a4522a" />
          {lamp === "lit" && <Flame x={10} y={-3} s={0.75} f={f} seed={seed + 5} glow={false} />}
        </g>
      )}
      {/* the planter on top: a terracotta rim, slightly wider, with dark soil */}
      <path d="M -86 -168 L -80 -192 L 80 -192 L 86 -168 Z" fill="#b0643a" />
      <rect x={-82} y={-196} width={164} height={7} rx={3} fill="#c97a48" />
      <path d="M -86 -168 L -80 -192 L -66 -192 L -72 -168 Z" fill="#8a4a28" />
      <ellipse cx={0} cy={-194} rx={74} ry={5} fill="#3a2414" />
      {/* the tulsi plant: woody stems, layered leaf clusters, purple flower spikes; it sways gently */}
      <g transform={`translate(0, -194) rotate(${sway.toFixed(2)})`}>
        {stems.map((st, i) => (
          <path key={`s${i}`} d={`M ${st.bx.toFixed(1)} 0 Q ${(st.bx * 1.2).toFixed(1)} ${(st.ty * 0.5).toFixed(1)} ${st.tx.toFixed(1)} ${st.ty.toFixed(1)}`} stroke="#5a4a2a" strokeWidth={3} fill="none" strokeLinecap="round" />
        ))}
        <ellipse cx={0} cy={-62} rx={70} ry={52} fill="#2c5a26" />
        {leafs.map((l, i) => (
          <g key={i} transform={`translate(${l.x.toFixed(1)}, ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)})`}>
            <ellipse cx={-6} cy={0} rx={8} ry={4.4} fill={TL[l.k]} transform="rotate(-28)" />
            <ellipse cx={6} cy={0} rx={8} ry={4.4} fill={TL[(l.k + 1) % 3]} transform="rotate(28)" />
            <ellipse cx={0} cy={-6} rx={3.6} ry={6} fill={TL[(l.k + 2) % 3]} />
          </g>
        ))}
        {spikes.map((sp, i) => (
          <g key={`f${i}`} transform={`translate(${sp.x.toFixed(1)}, ${sp.y.toFixed(1)}) rotate(${sp.rot.toFixed(1)})`}>
            <line x1={0} y1={6} x2={0} y2={-14} stroke="#5a5a2a" strokeWidth={1.4} />
            {[0, 1, 2, 3].map((k) => (
              <ellipse key={k} cx={0} cy={-2 - k * 4.4} rx={2.6 - k * 0.35} ry={2.2} fill={k % 2 ? "#9a6a9a" : "#7e4e80"} />
            ))}
          </g>
        ))}
        {/* soft top light on the crown */}
        <ellipse cx={20} cy={-88} rx={54} ry={30} fill="#a8cf6a" opacity={0.18} />
      </g>
    </g>
  );
};

export interface JabaPlacement {
  x: number;
  y?: number;
  s?: number;
  seed?: number;
  /** indices of flowers already picked (not drawn) */
  hide?: number[];
}

/** Number of flowers on a JabaShrub. */
export const JABA_FLOWERS = 14;

/** Two flowering hibiscus shrubs by the fence on the right, past the lemon tree (floor plane, depth 1). */
export const UJANCHAR_JABA: JabaPlacement[] = [
  { x: 1880, y: 892, s: 1, seed: 1 },
  { x: 2330, y: 888, s: 0.85, seed: 2 },
];

/** Flower i of a shrub in the shrub's own units (base at 0, 0), before sway: spread over the face of the leaf mass. */
const jabaLocal = (seed: number, i: number): [number, number, number] => {
  // golden-angle spiral over the ellipse, jittered per seed, so flowers never bunch
  const th = i * 2.39996 + 6.28 * hashS(seed * 13);
  const r = 0.9 * Math.sqrt((i + 0.5 + 0.4 * (hashS(seed * 5 + i * 3) - 0.5)) / JABA_FLOWERS);
  return [Math.cos(th) * 150 * r, -176 + Math.sin(th) * 108 * r, 13 + 4 * hashS(seed * 7 + i)];
};

/** World point of flower i of a placed shrub (for a picking hand). */
export const jabaFlowerAt = (p: JabaPlacement, i: number): { x: number; y: number } => {
  const s = p.s ?? 1;
  const [lx, ly] = jabaLocal(p.seed ?? 0, i);
  return { x: p.x + lx * s, y: (p.y ?? 892) + ly * s };
};

/**
 * A flowering hibiscus (জবা) shrub: woody stems, glossy dark pointed leaves, red flowers with long staminal columns
 * and a few closed buds. Base at (x, y); about 330 px tall and 340 px wide at s 1. It sways a little in the breeze.
 */
export const JabaShrub: React.FC<{ x: number; y: number; s?: number; f: number; seed?: number; hide?: number[] }> = ({ x, y, s = 1, f, seed = 0, hide = [] }) => {
  const sway = 1.2 * Math.sin(f * 0.033 + seed * 2) + 0.6 * noise1(f * 0.025, 90 + seed);
  const leaves = Array.from({ length: 120 }, (_, i) => {
    const th = 6.2832 * hashS(seed * 17 + i * 1.3);
    const rr = Math.sqrt(0.08 + 0.92 * hashS(seed * 23 + i * 2.1));
    // leaves point outward from the centre of the mass, so the rim reads leafy
    return {
      x: Math.cos(th) * 168 * rr,
      y: -170 + Math.sin(th) * 128 * rr,
      rot: (th * 180) / Math.PI + 90 + 40 * (hashS(seed + i * 4.7) - 0.5),
      len: 24 + 12 * hashS(seed * 3 + i),
      k: i % 3,
    };
  });
  const LEAF = ["#2a5524", "#336a2c", "#3e7a33"];
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx={-10} cy={4} rx={170} ry={14} fill="#2a1a0c" opacity={0.28} />
      {/* woody stems */}
      {[-50, -24, 0, 22, 46].map((a, i) => (
        <path key={i} d={`M ${i * 4 - 8} 0 Q ${a * 0.8} -80 ${a * 2.2} -${150 + 30 * hashS(seed + i)}`} stroke="#5a4028" strokeWidth={6 - Math.abs(i - 2)} fill="none" strokeLinecap="round" />
      ))}
      <g transform={`rotate(${sway.toFixed(2)} 0 0)`}>
        {/* the dark mass behind the leaves */}
        <ellipse cx={0} cy={-170} rx={150} ry={112} fill="#244a20" />
        <ellipse cx={-70} cy={-118} rx={84} ry={64} fill="#264d21" />
        <ellipse cx={78} cy={-122} rx={84} ry={64} fill="#264d21" />
        {/* glossy pointed leaves */}
        {leaves.map((l, i) => (
          <g key={i} transform={`translate(${l.x.toFixed(1)}, ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)})`}>
            <path d={`M 0 0 Q ${(l.len * 0.42).toFixed(1)} ${(-l.len * 0.45).toFixed(1)} 0 ${(-l.len).toFixed(1)} Q ${(-l.len * 0.42).toFixed(1)} ${(-l.len * 0.45).toFixed(1)} 0 0 Z`} fill={LEAF[l.k]} />
            <path d={`M 0 -2 L 0 ${(-l.len * 0.85).toFixed(1)}`} stroke="#1e3e1a" strokeWidth={0.9} opacity={0.6} />
            <path d={`M 2 ${(-l.len * 0.3).toFixed(1)} Q ${(l.len * 0.25).toFixed(1)} ${(-l.len * 0.5).toFixed(1)} 2 ${(-l.len * 0.78).toFixed(1)}`} stroke="#9cc46a" strokeWidth={1.4} fill="none" opacity={0.35} />
          </g>
        ))}
        {/* sunlit top */}
        <ellipse cx={40} cy={-250} rx={100} ry={44} fill="#8ab858" opacity={0.18} />
        {/* buds */}
        {[0, 1, 2, 3, 4].map((i) => {
          const [bx, by] = jabaLocal(seed + 50, i * 2 + 4);
          return (
            <g key={`b${i}`} transform={`translate(${(bx * 1.05).toFixed(1)}, ${(by - 6).toFixed(1)}) rotate(${(40 * (hashS(seed + i) - 0.5)).toFixed(1)})`}>
              <path d="M 0 0 Q -5 -10 0 -20 Q 5 -10 0 0 Z" fill="#c21c28" />
              <path d="M -4 0 L 0 6 L 4 0 Z" fill="#3a6e30" />
            </g>
          );
        })}
        {/* the flowers */}
        {Array.from({ length: JABA_FLOWERS }, (_, i) => {
          if (hide.includes(i)) return null;
          const [fx, fy, r] = jabaLocal(seed, i);
          return <JabaFlower key={`f${i}`} x={fx} y={fy} r={r} rot={360 * hashS(seed * 11 + i)} open={0.92 + 0.08 * Math.sin(f * 0.02 + i)} />;
        })}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Floor (1)                                                           */
/* ------------------------------------------------------------------ */

/** Episode 2's near end of the veranda plinth on the floor plane, extended to the set's left edge. */
const NearPlinth: React.FC = () => {
  const { edge, foot, h } = PLINTH;
  const top = GROUND - h;
  const L = -1500;
  return (
    <g>
      <path d={`M ${L} ${top - 14} L ${edge - 10} ${top - 14} C ${edge + 2} ${top - 14} ${edge + 8} ${top - 6} ${edge} ${top} L ${L} ${top} Z`} fill="#c9a06c" />
      <path d={`M ${L} ${top} L ${edge} ${top} C ${edge + 30} ${top} ${foot - 30} ${GROUND} ${foot + 6} ${GROUND + 3} L ${L} ${GROUND + 3} Z`} fill="#a8794a" />
      <path d={`M ${L} ${top + 1} L ${edge} ${top + 1} C ${edge + 30} ${top + 1} ${foot - 30} ${GROUND + 1} ${foot + 6} ${GROUND + 3}`} stroke="#d9b37c" strokeWidth={3} fill="none" opacity={0.7} />
      <rect x={L} y={GROUND - 8} width={-L + edge - 30} height={10} fill="#7e5632" opacity={0.5} />
      <Kolshi x={-420} y={top - 6} s={1.15} />
      <Kolshi x={-372} y={top - 4} s={0.95} />
    </g>
  );
};

export interface TulsiPlacement {
  x: number;
  y?: number;
  s?: number;
  lamp?: TulsiLamp;
}

export interface UjancharFloorProps {
  f: number;
  time?: UjancharTime;
  tulsi?: boolean | TulsiPlacement;
  jaba?: JabaPlacement[];
  nearVeranda?: boolean;
  edgeBushes?: boolean;
  under?: React.ReactNode;
  children?: React.ReactNode;
}

export const UjancharFloorLayer: React.FC<UjancharFloorProps> = ({ f, time = "morning", tulsi = false, jaba = [], nearVeranda = true, edgeBushes = true, under, children }) => {
  const skin = useSetSkin();
  const dawn = time === "dawn";
  const t = tulsi ? { ...TULSI_DEFAULT, ...(tulsi === true ? {} : tulsi) } : null;
  const original = (
    <Layer depth={1}>
      <MistDefs />
      <defs>
        <linearGradient id="uj-floor-dawn" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c8b4a6" stopOpacity={0.22} />
          <stop offset="60%" stopColor="#f0cfa4" stopOpacity={0.1} />
          <stop offset="100%" stopColor="#ffd49a" stopOpacity={0.26} />
        </linearGradient>
      </defs>
      {/* Episode 2's sunlit beaten-earth floor with faint broom sweeps (wider for pans) */}
      <path d={`M -1500 880 Q 960 868 3500 880 L 3500 ${FLOOR_BOTTOM} L -1500 ${FLOOR_BOTTOM} Z`} fill="#b88a58" />
      {[-1100, -620, -200, 380, 900, 1700, 2300, 2900, 3300].map((x, i) => (
        <path key={x} d={`M ${x} ${960 + 30 * (i % 2)} q 90 -18 180 0`} stroke="#a57a4a" strokeWidth={2} fill="none" opacity={0.35} />
      ))}
      {dawn ? (
        <g>
          {/* dawn: cool shade on the left, gold from the low sun on the right, a long soft pool of light under the tree */}
          <rect x={-1500} y={868} width={5000} height={FLOOR_BOTTOM - 868} fill="url(#uj-floor-dawn)" />
          <ellipse cx={1500} cy={940} rx={620} ry={54} fill="#ffd9a0" opacity={0.28} />
        </g>
      ) : (
        <ellipse cx={1300} cy={930} rx={420} ry={60} fill="#e7c48a" opacity={0.35} />
      )}
      {nearVeranda && <NearPlinth />}
      {edgeBushes && (
        <g>
          <Bush x={2420} y={884} w={300} f={f} seed={21} />
          <Bush x={470} y={882} w={240} f={f} seed={31} />
        </g>
      )}
      {dawn && <Mist f={f} y={866} h={46} x0={-1500} x1={3500} op={0.26} seed={53} speed={0.25} />}
      {under}
      {jaba.map((p, i) => (
        <JabaShrub key={`jaba${i}`} x={p.x} y={p.y ?? 892} s={p.s ?? 1} f={f} seed={p.seed ?? i + 1} hide={p.hide} />
      ))}
      {t && <UjancharTulsiMancha x={t.x} y={t.y} s={t.s} f={f} lamp={t.lamp ?? "unlit"} />}
      {skin?.inkCharacters ? <g filter="url(#ghibli-char-ink)">{children}</g> : children}
    </Layer>
  );
  const skinned = skin?.ujancharFloor?.({ f, time, under, children, original });
  return skinned !== undefined ? <>{skinned}</> : original;
};

/* ------------------------------------------------------------------ */
/* Light (0.95, screen)                                                */
/* ------------------------------------------------------------------ */

/** [x where the shaft leaves the canopy, width there, drift phase, strength] (Episode 2's shafts through the lemon tree). */
const SHAFTS: Array<[number, number, number, number]> = [
  [1290, 46, 0.0, 0.7],
  [1385, 70, 1.7, 1.0],
  [1470, 38, 3.1, 0.8],
  [1560, 82, 4.4, 0.95],
  [1665, 52, 5.6, 0.75],
];
const SHAFT_TOP = 380;
const SHAFT_BOTTOM = 990;

const shaftGeom = (f: number, dawn: boolean) =>
  SHAFTS.map(([x, w, ph, k], i) => {
    const xt = x + 22 * Math.sin(f * 0.012 + ph) + 8 * noise1(f * 0.01, 40 + i);
    // morning: the high sun spreads the shafts out under the tree; dawn: the low sun from the right slants them left
    const xb = dawn ? xt - 520 + 40 * Math.sin(ph) : LEMON.x + (xt - LEMON.x) * 1.9 - 60;
    return { xt, xb, w: dawn ? w * 1.3 : w, wb: w * (dawn ? 3 : 2.2), a: k * (0.75 + 0.25 * noise1(f * 0.025, 60 + i)) };
  });

const shaftLight = (sh: ReturnType<typeof shaftGeom>, x: number, y: number) => {
  const v = clamp((y - SHAFT_TOP) / (SHAFT_BOTTOM - SHAFT_TOP));
  let L = 0;
  for (const s of sh) {
    const cx = lerp(s.xt, s.xb, v);
    const hw = lerp(s.w, s.wb, v) * 0.5;
    L += s.a * Math.exp(-Math.pow((x - cx) / hw, 2));
  }
  return clamp(L);
};

export const UjancharLightLayer: React.FC<{ f: number; time?: UjancharTime; level?: number; mask?: string }> = ({ f, time = "morning", level = 1, mask }) => {
  const dawn = time === "dawn";
  const sh = shaftGeom(f, dawn);
  const id = dawn ? "uj-shaft-dawn" : "uj-shaft-day";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 0.62 * level,
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <Layer depth={0.95}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={SHAFT_TOP} x2={0} y2={SHAFT_BOTTOM}>
            <stop offset={0} stopColor={dawn ? "#ffe0b0" : "#fff1c8"} stopOpacity={0} />
            <stop offset={0.28} stopColor={dawn ? "#ffd08a" : "#ffe7a6"} stopOpacity={0.85} />
            <stop offset={0.72} stopColor={dawn ? "#ffbf78" : "#ffd88a"} stopOpacity={0.45} />
            <stop offset={1} stopColor={dawn ? "#ffb870" : "#ffd07a"} stopOpacity={0} />
          </linearGradient>
          <radialGradient id={`${id}-pool`}>
            <stop offset={0} stopColor={dawn ? "#ffd394" : "#ffe3a0"} stopOpacity={0.8} />
            <stop offset={1} stopColor={dawn ? "#ffd394" : "#ffe3a0"} stopOpacity={0} />
          </radialGradient>
          <filter id="uj-shaft-blur" x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
        </defs>
        <g opacity={dawn ? 0.4 : 0.36}>
          <g filter="url(#uj-shaft-blur)">
            {sh.map((s, i) => (
              <polygon
                key={i}
                points={`${s.xt - s.w / 2},${SHAFT_TOP} ${s.xt + s.w / 2},${SHAFT_TOP} ${s.xb + s.wb / 2},${SHAFT_BOTTOM} ${s.xb - s.wb / 2},${SHAFT_BOTTOM}`}
                fill={`url(#${id})`}
                opacity={s.a}
              />
            ))}
          </g>
          {sh.map((s, i) => (
            <ellipse key={`p${i}`} cx={lerp(s.xt, s.xb, 0.9)} cy={935} rx={s.wb * 0.75} ry={16} fill={`url(#${id}-pool)`} opacity={0.6 * s.a} />
          ))}
        </g>
        {/* dust and pollen drifting in the light: faint in shade, flaring warm in a shaft */}
        {Array.from({ length: 46 }, (_, i) => {
          const pollen = i % 4 === 0;
          const period = pollen ? 260 + 50 * hashS(i * 1.7) : 200 + 90 * hashS(i * 2.9);
          const ph = ((((f + hashS(i * 4.1) * period) % period) + period) % period) / period;
          const x0 = lerp(dawn ? 800 : 1120, 1900, hashS(i * 7.3 + 1));
          const yb = lerp(520, 940, hashS(i * 3.3 + 2));
          const x = x0 + 30 * Math.sin(f * 0.013 + i * 2.1) + 12 * noise1(f * 0.02, 100 + i) + (pollen ? 50 : 16) * ph;
          const y = pollen ? yb - 110 + 220 * ph + 8 * Math.sin(f * 0.05 + i) : yb + 20 - 60 * ph + 6 * noise1(f * 0.015, 200 + i);
          const lit = 0.12 + 0.88 * shaftLight(sh, x, y);
          const fade = Math.pow(Math.sin(Math.PI * ph), 1.2);
          const r = (pollen ? 1.8 + 0.8 * hashS(i * 5.5) : 0.9 + 0.7 * hashS(i * 6.6)) * (1 + 0.25 * Math.sin(f * 0.3 + i));
          const o = 0.5 * fade * lit;
          if (o < 0.02) return null;
          return (
            <g key={`d${i}`} opacity={o}>
              <circle cx={x} cy={y} r={r * 3.4} fill={pollen ? "#ffd970" : "#fff0c4"} opacity={0.25} />
              <circle cx={x} cy={y} r={r} fill={pollen ? "#ffe58a" : "#fff8e2"} />
            </g>
          );
        })}
      </Layer>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Foreground (1.35 grass, 1.6 leaves)                                  */
/* ------------------------------------------------------------------ */

/** Near grass and flowers: Episode 2's 30 plants (k 0..29) plus more on both sides. [x, base y, height, kind, seed] */
const FG_PLANTS: Array<[number, number, number, number, number]> = Array.from({ length: 64 }, (_, k) => {
  const i = k - 14;
  const r = hashS(i * 9.1 + 4);
  return [420 + i * 92 + 40 * (hashS(i * 3.1) - 0.5), 1014 + 32 * hashS(i * 5.7), 24 + 30 * hashS(i * 2.2), r < 0.2 ? 1 : r < 0.32 ? 2 : 0, i];
});

const ForegroundGrass: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {FG_PLANTS.map(([x, y, h, kind, i]) => {
      const sway = 2.5 * Math.sin(f * 0.04 + i * 1.3) + 1.2 * noise1(f * 0.03, 300 + i);
      const blades = 6 + Math.floor(4 * hashS(i * 1.9));
      return (
        <g key={i} transform={`rotate(${sway.toFixed(2)} ${x.toFixed(1)} ${y.toFixed(1)})`}>
          {Array.from({ length: blades }, (_, j) => {
            const bx = x + (j - blades / 2) * 3.4;
            const hh = h * (0.55 + 0.45 * hashS(i * 13 + j * 3.7));
            const lean = 10 * (hashS(i * 7 + j * 1.3) - 0.5) + (j - blades / 2) * 1.6;
            const tx = bx + lean;
            const ty = y - hh;
            return (
              <path
                key={j}
                d={`M ${(bx - 1.8).toFixed(1)} ${y} Q ${(bx + lean * 0.3).toFixed(1)} ${(y - hh * 0.6).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q ${(bx + lean * 0.3 + 1.2).toFixed(1)} ${(y - hh * 0.55).toFixed(1)} ${(bx + 1.8).toFixed(1)} ${y} Z`}
                fill={j % 3 === 0 ? "#3b5620" : j % 3 === 1 ? "#55742a" : "#6b8a33"}
              />
            );
          })}
          {kind === 1 && (
            <g>
              <path d={`M ${x} ${y} Q ${x + 3} ${y - h * 0.7} ${x + 2} ${y - h - 8}`} stroke="#4a6a26" strokeWidth={2} fill="none" />
              <circle cx={x + 2} cy={y - h - 10} r={7} fill="#f2a52c" />
              <circle cx={x + 2} cy={y - h - 10} r={4.2} fill="#f7c04a" />
              <circle cx={x + 2} cy={y - h - 10} r={1.8} fill="#c8641a" />
            </g>
          )}
          {kind === 2 &&
            [-6, 0, 5].map((o, j) => (
              <g key={`w${j}`}>
                <path d={`M ${x + o * 0.4} ${y} L ${x + o} ${y - h - 2 + 3 * j}`} stroke="#4a6a26" strokeWidth={1.2} />
                <circle cx={x + o} cy={y - h - 3 + 3 * j} r={3.2} fill="#f6f1e3" />
                <circle cx={x + o} cy={y - h - 3 + 3 * j} r={1} fill="#e8c04a" />
              </g>
            ))}
          <ellipse cx={x + 2} cy={y - h * 0.8} rx={8} ry={h * 0.25} fill="#e6d070" opacity={0.18} />
        </g>
      );
    })}
  </g>
);

/** Soft out-of-focus leaf sprays hanging into the top corners (lemon leaves), drifting gently. */
const NearLeaves: React.FC<{ f: number }> = ({ f }) => {
  const sprays: Array<[number, number, number, number]> = [
    // [anchor x, anchor y, direction (1 hangs to the right), seed]
    [-140, 80, 1, 1],
    [2160, 70, -1, 2],
    [-700, 90, 1, 3],
    [2760, 80, -1, 4],
  ];
  return (
    <g>
      {sprays.map(([ax, ay, dir, sd]) => {
        const sw = 2.2 * Math.sin(f * 0.03 + sd) + noise1(f * 0.02, 400 + sd);
        return (
          <g key={sd} transform={`rotate(${sw.toFixed(2)} ${ax} ${ay})`}>
            <path d={`M ${ax} ${ay} Q ${ax + dir * 160} ${ay + 120} ${ax + dir * 330} ${ay + 230}`} stroke="#2a3a1a" strokeWidth={7} fill="none" strokeLinecap="round" />
            {Array.from({ length: 11 }, (_, i) => {
              const u = (i + 1) / 12;
              const px = ax + dir * 330 * u;
              const py = ay + 230 * u - 40 * Math.sin(Math.PI * u);
              const side = i % 2 ? 1 : -1;
              const rot = dir * (40 + 30 * side) + 20 * (hashS(sd * 9 + i) - 0.5);
              const len = 70 + 30 * hashS(sd * 5 + i);
              return (
                <path
                  key={i}
                  d={`M 0 0 Q ${len * 0.4} ${-len * 0.22} ${len} 0 Q ${len * 0.4} ${len * 0.22} 0 0 Z`}
                  fill={i % 3 ? "#2f4e22" : "#3d6229"}
                  transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})`}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

export const UjancharForegroundLayer: React.FC<{ f: number; time?: UjancharTime; grass?: boolean; leaves?: boolean; bokeh?: boolean }> = ({
  f,
  time = "morning",
  grass = true,
  leaves = false,
  bokeh = true,
}) => (
  <>
    {grass && (
      <Layer depth={1.35} extraBlur={2.6}>
        <ForegroundGrass f={f} />
      </Layer>
    )}
    {bokeh && (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", opacity: 0.5 }}>
        <Layer depth={1.35}>
          <Bokeh f={f} n={10} seed={7} color={time === "dawn" ? "#ffcf8a" : undefined} />
        </Layer>
      </div>
    )}
    {leaves && (
      <Layer depth={1.6} extraBlur={6}>
        <NearLeaves f={f} />
      </Layer>
    )}
  </>
);

/* ------------------------------------------------------------------ */
/* The whole set                                                       */
/* ------------------------------------------------------------------ */

export interface UjancharHouseProps extends UjancharBackdropProps, Omit<UjancharFloorProps, "children"> {
  /** ReactNode on the floor plane (depth 1), drawn after the set pieces: characters. */
  floor?: React.ReactNode;
  /** ReactNode on depth 1 drawn after the light layer (in front of the shafts). */
  front?: React.ReactNode;
  light?: boolean;
  lightLevel?: number;
  lightMask?: string;
  foreground?: boolean;
  leaves?: boolean;
  grade?: boolean;
}

/** The whole Ujanchar house set in plane order, with optional characters on the floor plane and the time's Grade. */
export const UjancharHouse: React.FC<UjancharHouseProps> = ({
  f,
  time = "morning",
  cam,
  calm = 1,
  fenceJaba = true,
  cow = false,
  veranda,
  yard,
  tulsi = false,
  jaba = [],
  nearVeranda = true,
  edgeBushes = true,
  under,
  floor,
  front,
  light = true,
  lightLevel = 1,
  lightMask,
  foreground = true,
  leaves = false,
  grade = true,
}) => (
  <>
    <UjancharBackdrop f={f} time={time} cam={cam} calm={calm} fenceJaba={fenceJaba} cow={cow} veranda={veranda} yard={yard} />
    <UjancharFloorLayer f={f} time={time} tulsi={tulsi} jaba={jaba} nearVeranda={nearVeranda} edgeBushes={edgeBushes} under={under}>
      {floor}
    </UjancharFloorLayer>
    {light && <UjancharLightLayer f={f} time={time} level={lightLevel} mask={lightMask} />}
    {front && <Layer depth={1}>{front}</Layer>}
    {(foreground || leaves) && <UjancharForegroundLayer f={f} time={time} grass={foreground} bokeh={foreground} leaves={leaves} />}
    {grade && <Grade {...ujancharGrade(time)} />}
  </>
);

/* ------------------------------------------------------------------ */
/* Shared pieces for other sets in this world (Episode 5, 2026-11-22)   */
/* ------------------------------------------------------------------ */

/**
 * The village's materials and colours, and the internal pieces above, exported (additively, nothing above changed) so
 * other Ujanchar-world sets (src/cinematic/sets/KrishnanagarKachari.tsx) are built from the same parts:
 *  UjancharFenceRun { x0, x1, seed }        bamboo lattice fence, base on y 862 (draw it in a translated <g> elsewhere)
 *  UjancharBush { x, y, w, f, seed, flowers? }   round leafy bush, base at (x, y)
 *  UjancharKolshi { x, y, s? }              clay water pot, base at (x, y)
 *  UjancharBroom { x, y }                   grass broom leaning on a wall, foot at (x, y)
 *  UjancharHut { f, children? }             the family's hut exactly as drawn here (fixed geometry: UJANCHAR.HUT)
 *  UjancharLemonTree { f, x, y, s? }        the lemon tree, base at (x, y)
 *  UjancharJabaFlower { x, y, r, rot?, open? }  one hibiscus flower
 *  UjancharMist / UjancharMistDefs          the dawn mist band and its blur filter
 *  UjancharForegroundGrass { f } / UjancharNearLeaves { f }   the near grass and the top-corner leaf sprays
 *  ujancharBgBlur(depth, calm, cam?) / ujancharBgFilter(calm, time)   the CAM-11 depth blur and background grade
 *  ujancharHash(n)                          the seeded hash every piece here uses
 *  UJANCHAR_PALETTE                         the colours of the walls, thatch, bamboo, earth, foliage and pots
 */
export const UJANCHAR_PALETTE = {
  /** mud wall: face, lower band, texture strokes, eave shadow (#2a1608 at 0.28) */
  wall: "#b8875a",
  wallLow: "#9e6e44",
  wallStroke: "#a2744a",
  eaveShadow: "#2a1608",
  /** mud plinth: top edge, face, highlight, foot shade */
  plinthTop: "#c9a06c",
  plinthFace: "#a8794a",
  plinthLight: "#d4ad78",
  plinthShade: "#7e5632",
  /** doorway, door leaf, frame, window bars */
  doorDark: "#24160c",
  doorDeep: "#3a2414",
  doorLeaf: "#7a5232",
  doorFrame: "#6b4528",
  windowDark: "#2c1c10",
  /** thatch: body, ridge highlight, straw lines, eave edge */
  thatch: "#c9a35a",
  thatchRidge: "#e4c47c",
  thatchStraw: "#a8823e",
  thatchEave: "#8e6a32",
  /** bamboo: post, highlight, lashings, fence lattice light and dark, fence rails */
  bamboo: "#9c7a44",
  bambooLight: "#d8bd7c",
  bambooTie: "#6f5530",
  fenceLight: "#b39556",
  fenceDark: "#9c7f45",
  fenceRail: "#a8894c",
  /** earth: the courtyard floor, broom sweeps, the yard plane, shadow colour */
  floor: "#b88a58",
  floorSweep: "#a57a4a",
  yard: "#9c7448",
  shadow: "#2a1a0c",
  /** foliage: bush dark and light, bush highlight, jungle masses, deep jungle */
  bushDark: "#33602b",
  bushLight: "#3f7232",
  bushHi: "#7aa64a",
  jungle: ["#2c5428", "#36632f", "#24481f"] as readonly string[],
  jungleDeep: "#264a22",
  /** clay pot body, rim, highlight; trunk brown */
  clay: "#b25a2e",
  clayRim: "#8e4220",
  clayLight: "#e08a52",
  trunk: "#5a3f28",
  /** the morning stage background */
  bg: "#f2d9a6",
} as const;

export {
  FenceRun as UjancharFenceRun,
  Bush as UjancharBush,
  Kolshi as UjancharKolshi,
  Broom as UjancharBroom,
  Hut as UjancharHut,
  LemonTree as UjancharLemonTree,
  JabaFlower as UjancharJabaFlower,
  Mist as UjancharMist,
  MistDefs as UjancharMistDefs,
  ForegroundGrass as UjancharForegroundGrass,
  NearLeaves as UjancharNearLeaves,
  bgBlur as ujancharBgBlur,
  bgFilter as ujancharBgFilter,
  hashS as ujancharHash,
};
