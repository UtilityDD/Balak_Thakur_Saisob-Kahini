import React from "react";
import { clamp, flicker, hash, lerp, noise1 } from "../core/anim";
import { Cam, Grade, Layer } from "../core/Stage";
import { Flame, Garland, GlowDefs } from "../fx/Fx";
import { TulsiMancha } from "./Interiors";
import { BaidikBariDay, Banana, Birds, DaySky, Palm } from "./S01_DaySets";

/**
 * THE VEDIC HOUSE (বৈদিক বাড়ী) BY DAY: the places Episode 4 needs that were never seen in daylight (STO-02,
 * STO-03, STO-19). Everything matches the established house: the orange brick and cream mouldings of the
 * exterior (BaidikBariDay, S01_DaySets.tsx) and the arcade, balcony, pillars, plinth, flagstones and tulsi mancha
 * of the inner courtyard (CourtyardBack / CourtyardFloor / TulsiMancha, Interiors.tsx, Episode 1 at night), in the
 * same world coordinates, so the Episode 1 wide (cam { x: 0, y: 0, zoom: 1 }) frames the same arcade.
 * Nothing on any idol or prop glows (BAL-05): brass reads by its highlights only; the only light sources are the
 * sun, the door and the lamp flames.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * API (everything renders INSIDE a <Stage>; the set components wrap their own <Layer>s)
 * ---------------------------------------------------------------------------------------------------------------
 * Common props: f = the LIFE clock (lifeF: clouds, leaves, water, flames, smoke keep moving in a pause);
 *   calm 0..1 (default 1) = the CAM-11 background treatment (far planes a little softer, calmer and blurred);
 *   grade (default true) adds the set's Grade; cam (optional) only feeds the depth blur so the camera DOF is not doubled.
 *
 * 1. INNER COURTYARD BY DAY (scene 01 morning, 02B afternoon, 03 AG1 wide with the shrine door)
 *    <Stage cam={vedicCourtyardKeepInSet(cam)} background={VEDIC_COURTYARD_BG[time]}>
 *      <VedicCourtyardDay f={lifeF} time="morning" nearVeranda tulsi
 *        far={...figures on the far plinth / arcade line (0.55 plane, feet y 740)...}
 *        yard={...figures in the courtyard or by the tulsi (0.8 plane, floor y 784..1700)...}
 *        floor={...figures on the near veranda (1.0 plane, seated y 960..1080)...} />
 *    </Stage>
 *    time        "morning" (sun from the upper left behind camera, far facade lit, the near wing's balustrade shadow
 *                across the near floor) | "afternoon" (low gold sun behind the far wing: facade in soft shade with a
 *                lit rim, the far wing's shadow on the far floor, a warm sun patch near the camera).
 *    nearVeranda false (default) | true | { lip }: the red-oxide floor of the near veranda (camera side) on the 1.0
 *                plane, its edge at y lip (default 920); characters sit on it (`floor` slot).
 *    tulsi       true (default) | false | { x, y, s }: the Episode 1 tulsi mancha (default { x: 1760, y: 830, s: 1.1 }).
 *    shrineArch  false (default) | arch index (-4..10; 3 = the arch at x 830..1050, centre 940): that arch becomes the
 *                family shrine room's door (ThakurGhar): carved teak frame, door leaves folded back, maroon curtain
 *                tied to one side, threshold, mango-leaf toran, lamplit interior with the khat; `inShrine` is drawn
 *                inside it (0.55 plane coordinates, clipped to the door; e.g. the priest), shrineDhoop puts the
 *                smoking dhoop-dani on the plinth beside the door. courtyardArchX(i) gives an arch's left x.
 *    nearPillars number[] (default []): out-of-focus pillars of the near arcade on the 1.3 plane (x positions).
 *    Layer by layer: VedicCourtyardSkyLayer (0.12), VedicCourtyardBackLayer (0.55), VedicCourtyardFloorLayer (0.8),
 *    VedicNearVerandaLayer (1.0), VedicCourtyardForegroundLayer (1.3); vedicCourtyardGrade(time).
 *
 * 2. THE SHRINE ROOM DOOR FROM THE VERANDA (scene 03: Balak on the veranda looking in, the dhoop, the hand-over)
 *    <Stage cam={vedicVerandaKeepInSet(cam)} background="#2a1a10">
 *      <VedicShrineVeranda f={lifeF} time="morning" dhoop inside={...priest seen through the door (0.9 plane)...}
 *        floor={...Balak, Thakurma on the veranda (1.0 plane)...} />
 *    </Stage>
 *    The door (VERANDA.DOOR: opening x 800..1120, threshold top y 845) in the courtyard wall style, the veranda floor
 *    (y 870 to the edge at 1010), the plinth face and the sunlit courtyard flagstones below; the interior on the 0.9
 *    plane just behind the wall, so a hand from inside can meet a hand at the threshold.
 *    dhoop       true (default) | false | { x, y, smoke }: the dhoop-dani on the veranda floor by the door (default
 *                VERANDA.DHOOP, left of the door). Set false when a character is holding it (draw <DhoopDani> yourself).
 *    pillar      true (default): a soft arcade pillar on the 1.3 plane at the left edge.  insideProps: RiteShow below.
 *    VERANDA.SPOTS: balak (seated on the veranda left of the door, s 1.3), threshold (kneeling at the threshold),
 *    priestInside (just inside the door, 0.9 plane).
 *
 * 3. THE FAMILY SHRINE ROOM (ঠাকুরঘর) INTERIOR (scene 03 AG2c to the end)
 *    <Stage cam={thakurGharKeepInSet(cam)} background="#2a160c">
 *      <ThakurGhar f={lifeF} show={{ bowl: { level: 1 } }} behind={...priest...} front={...Balak...} />
 *    </Stage>
 *    Whitewashed walls with a red-oxide dado, kodi-borga ceiling beams, the carved teak khat with a red canopy and
 *    marigold swags, on it the brass Gobinda (centre), a small stone Gopal (left) and the shalagram on a tiny throne
 *    (right); brass lamps; the rite on the floor: the stone bowl of coconut water with the whole fopra, two cut green
 *    coconuts, the conch on its stand, the hand bell, copper kosha-kushi, a brass plate of flowers and bel leaves, a
 *    mangal ghot, the priest's kusha asana; the veranda door in the left wall with daylight falling in.
 *    show (RiteShow, every key optional, default all shown, bowl full):
 *      bowl: false | { level 0..1 (coconut water), fopra (default true) }   coconuts, conch, bell, kosha, plate, ghot,
 *      lamp (the tall pilsuj), dhoop: false (default) | true | { x, y } (the dhoop-dani after Balak hands it in).
 *      Hide a piece when a character holds it and draw the exported prop yourself at THAKURGHAR.PROPS.<name>.
 *    daylight 0..1 (default 1): the door light.   behind: ReactNode on the 1.0 plane drawn before the rite props (the
 *    priest sits behind them); front: ReactNode after the props (Balak in front of them).
 *    THAKURGHAR.SPOTS: priest (on the asana, facing right to the khat), balakInside (seated near the bowl, s 1.3),
 *    threshold (kneeling in the doorway). THAKURGHAR.PROPS: every rite prop's base point. KHAT: the throne.
 *
 * 4. THE POND BY THE HOUSE IN DAYLIGHT (scene 02A)
 *    <Stage cam={vedicPondKeepInSet(cam)} background="#cfe0d8">
 *      <VedicPondDay f={lifeF} flowerDrop={P1_START} bank={...Balak under the mandar tree, Sundar, Charu on the ghat...} />
 *    </Stage>
 *    The sky, the far tree line, the Vedic house across the water (BaidikBariDay, unchanged, scaled) with its compound
 *    wall, the still green pond holding the house's reflection (sliced, gently wobbling), soft ripples and the odd
 *    ring; on the near side the brick ghat descending into the water at the left, the grassy right bank with the
 *    mandar (coral) tree in red bloom (fallen blossoms on the grass and floating), reeds at the water's edge, a thin
 *    near bank along the bottom, soft near reeds in the corners.
 *    flowerDrop  optional life frame: a blossom falls from the tree from that frame (about 40 f) and lands at
 *                POND.DROP, then floats with spreading rings (about 90 f).
 *    foreground  true (default): the soft near reeds (1.3).   bank: ReactNode on the 1.0 plane (characters).
 *    POND.SPOTS: balak (under the tree, s 1.3, about 300 px tall), sundar (crouching spot a few steps from him),
 *    ghatTop / ghatStep (standing spots on the ghat), runner (where a runner arrives along the bank).
 *    pondBankY(x): the right bank's ground line (for feet). POND.MANDAR: the tree.
 *
 * Props (exported, one design each, reusable in any scene; (x, y) is the base point on the floor unless noted):
 *    BrassGobinda { x, y, s } about 110 px tall at s 1, flute held across, no face detail, no glow.
 *    StoneGopal { x, y, s }  ShalagramThrone { x, y, s }  KhatThrone { x, y, s, f, deities?, lamps? }
 *    StoneBowl { x, y, s, level, tilt }  about 150 px wide at s 1 (stoneBowlArt, the one bowl design, is also
 *    Balak's held bowl).   Fopra { x, y, s }
 *    GreenCoconut { x, y, s, rot }  Conch { x, y, s, stand }  BrassBell { x, y, s, swing }  KoshaKushi { x, y, s }
 *    FlowerPlate { x, y, s }  MangalGhot { x, y, s }  BrassLamp { x, y, s, f, kind: "pilsuj" | "pradip", seed }
 *    DhoopDani { x, y, s, f, smoke 0..1 } (smoke curls from the coals, about 120 px tall).  VhdDefs (gradients;
 *    drawn by every set layer here; include it once in your own layer when you draw a prop outside these sets).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SAFE CAMERA RANGES (Stage cam: x = world centre x - 960, y = world centre y - 540; zoom 1..3)
 * ---------------------------------------------------------------------------------------------------------------
 *  Each set's keep-in-set clamp (soft corners, keeps every other cam field) stops any plane edge or seam from coming
 *  into frame (CAM-08). At zoom 1:
 *   Courtyard  cam.x -2700..2650, cam.y -600..770 (with nearVeranda -600..800). The arcade repeats every 330 px; the
 *              tulsi is at x 1760; interesting x 0..1900. Tilting down at zoom 1 raises the far plinth over the
 *              pillar bases a little (a depth cheat, no gap).
 *   Veranda    cam.x -1480..1460, cam.y -480..800. The door centre x 960; Balak's spot x 620.
 *   ThakurGhar cam.x -1380..1360, cam.y -680..800. The khat x 1300..1780, the rite x 950..1400, the door x 30..240.
 *   Pond       cam.x -1580..1460, cam.y -900..800. The house across the water x 500..1150, the tree x 1100..2150,
 *              Balak x 1420, the ghat x -800..420.
 *  At zoom z the x range narrows by about 960 (1 - 1/z) on each side; the clamp handles it.
 */

/* ------------------------------------------------------------------ */
/* Shared helpers                                                       */
/* ------------------------------------------------------------------ */

const hs = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const sstep = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const smax = (a: number, b: number, k: number) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
const smin = (a: number, b: number, k: number) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + k * k));
const n1 = (v: number) => v.toFixed(1);

/** A plane that must fill the frame horizontally (and vertically where y0 / y1 are given). */
interface PlaneBox {
  d: number;
  x0: number;
  x1: number;
  y0?: number;
  y1?: number;
}
/** A front plane whose top edge must never rise above... no: must never drop below the back plane's bottom (a gap). */
interface Seam {
  back: number;
  front: number;
  frontTop: number;
  backBottom: number;
}

/** Generic keep-in-set clamp (same maths and soft corners as ujancharKeepInSet). */
const keepInSet = <C extends Cam>(c: C, planes: PlaneBox[], seams: Seam[]): C => {
  const EDGE = 16;
  const z = Math.max(1, c.zoom);
  let xlo = -Infinity;
  let xhi = Infinity;
  let ylo = -Infinity;
  let yhi = Infinity;
  for (const p of planes) {
    const s = Math.pow(z, p.d);
    xlo = Math.max(xlo, (p.x0 + EDGE - 960 + 960 / s) / p.d);
    xhi = Math.min(xhi, (p.x1 - EDGE - 960 - 960 / s) / p.d);
    if (p.y0 !== undefined) ylo = Math.max(ylo, (p.y0 + EDGE - 540 + 540 / s) / p.d);
    if (p.y1 !== undefined) yhi = Math.min(yhi, (p.y1 - EDGE - 540 - 540 / s) / p.d);
  }
  for (const m of seams) {
    const zb = Math.pow(z, m.back);
    const zf = Math.pow(z, m.front);
    const K = zf * m.front - zb * m.back;
    if (K > 1e-6) ylo = Math.max(ylo, (zf * (m.frontTop - 540) - zb * (m.backBottom - 540) + 6) / K);
  }
  if (xlo > xhi) xlo = xhi = (xlo + xhi) / 2;
  if (ylo > yhi) ylo = yhi = (ylo + yhi) / 2;
  return { ...c, x: smin(smax(c.x, xlo, 24), xhi, 24), y: smin(smax(c.y, ylo, 24), yhi, 24) };
};

/** CAM-11 depth blur (CSS px): grows with distance; the camera's own DOF blur counts toward it. */
const bgBlur = (d: number, calm: number, cam?: Cam) => {
  const camBlur = cam ? Math.min(14, Math.abs(d - (cam.focus ?? 1)) * (cam.dof ?? 0)) : 0;
  return Math.max(0, 4.4 * (1 - d) * calm - camBlur);
};
/** CAM-11 background grade (as Episode 2 / Ujanchar: calmer, softer, a little warmer). */
const calmStyle = (calm: number, k = 1): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  filter: `saturate(${(1 - 0.2 * calm * k).toFixed(3)}) contrast(${(1 - 0.1 * calm * k).toFixed(3)}) brightness(${(1 - 0.04 * calm * k).toFixed(3)}) sepia(${(0.1 * calm * k).toFixed(3)})`,
});

/* ------------------------------------------------------------------ */
/* Gradients shared by the props                                        */
/* ------------------------------------------------------------------ */

export const VhdDefs: React.FC = () => (
  <defs>
    <linearGradient id="vhd-brass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#7a4e12" />
      <stop offset="30%" stopColor="#d9a63a" />
      <stop offset="42%" stopColor="#ffe6a0" />
      <stop offset="58%" stopColor="#d49a30" />
      <stop offset="100%" stopColor="#6a420c" />
    </linearGradient>
    <linearGradient id="vhd-brass-v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f6d27a" />
      <stop offset="45%" stopColor="#c8902e" />
      <stop offset="100%" stopColor="#6a420c" />
    </linearGradient>
    <linearGradient id="vhd-copper" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#6a2e14" />
      <stop offset="38%" stopColor="#d07a48" />
      <stop offset="50%" stopColor="#f2b088" />
      <stop offset="100%" stopColor="#5a2410" />
    </linearGradient>
    <linearGradient id="vhd-stone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#5c5a54" />
      <stop offset="35%" stopColor="#a4a29a" />
      <stop offset="55%" stopColor="#8e8c84" />
      <stop offset="100%" stopColor="#4a4844" />
    </linearGradient>
    <linearGradient id="vhd-darkstone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#1e1e22" />
      <stop offset="40%" stopColor="#5a5a62" />
      <stop offset="100%" stopColor="#18181c" />
    </linearGradient>
    <linearGradient id="vhd-teak" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#8a5228" />
      <stop offset="100%" stopColor="#4a2610" />
    </linearGradient>
    <linearGradient id="vhd-coconut" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#3e6a1e" />
      <stop offset="40%" stopColor="#7aaa3a" />
      <stop offset="100%" stopColor="#2e5216" />
    </linearGradient>
    <radialGradient id="vhd-water" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0%" stopColor="#f4f2e0" stopOpacity={0.9} />
      <stop offset="60%" stopColor="#d8dcc8" stopOpacity={0.75} />
      <stop offset="100%" stopColor="#b8bca4" stopOpacity={0.8} />
    </radialGradient>
    <radialGradient id="vhd-lamp-wash">
      <stop offset="0%" stopColor="#ffd890" stopOpacity={0.55} />
      <stop offset="45%" stopColor="#ffb860" stopOpacity={0.18} />
      <stop offset="100%" stopColor="#ff9a40" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="vhd-shade">
      <stop offset="0%" stopColor="#1a0c06" stopOpacity={0.45} />
      <stop offset="100%" stopColor="#1a0c06" stopOpacity={0} />
    </radialGradient>
  </defs>
);

/* ------------------------------------------------------------------ */
/* PROPS                                                                */
/* ------------------------------------------------------------------ */

/** The small standing brass Gobinda with the flute (about 110 px at s 1). Simplified, no face detail, no glow. */
export const BrassGobinda: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    {/* round lotus pedestal */}
    <ellipse cx={0} cy={0} rx={27} ry={6} fill="#5a380c" />
    <path d="M -24 0 L -22 -9 L 22 -9 L 24 0 Z" fill="url(#vhd-brass)" />
    {Array.from({ length: 9 }, (_, i) => (
      <path key={i} d={`M ${-20 + i * 5} -9 q 2.5 -7 5 0 Z`} fill={i % 2 ? "#e8bc5a" : "#b8822a"} />
    ))}
    <ellipse cx={0} cy={-15} rx={16} ry={3.4} fill="#c8902e" />
    {/* legs: the right leg straight, the left crossed in front at the ankle (tribhanga), feet on the pedestal */}
    <path d="M 3 -17 L 6 -40 L 13 -40 L 10 -17 Z" fill="#a8741e" />
    <path d="M -10 -17 Q -6 -30 6 -40 L 12 -36 Q 0 -28 -3 -17 Z" fill="url(#vhd-brass)" />
    <ellipse cx={-7} cy={-16} rx={6} ry={2.2} fill="#d9a63a" />
    <ellipse cx={8} cy={-16} rx={5} ry={2} fill="#b8822a" />
    {/* dhoti flaring at the knees, pleat lines */}
    <path d="M -12 -62 Q -16 -50 -12 -40 L 16 -40 Q 18 -52 12 -64 Z" fill="url(#vhd-brass)" />
    <path d="M -2 -62 L -1 -41 M 5 -62 L 7 -41" stroke="#8a5a14" strokeWidth={1.1} fill="none" opacity={0.7} />
    <path d="M -12 -42 Q 2 -37 16 -41" stroke="#ffe6a0" strokeWidth={1.2} fill="none" opacity={0.6} />
    {/* torso with the gentle sway of the stance */}
    <path d="M -10 -64 Q -12 -78 -8 -88 L 9 -88 Q 12 -76 12 -64 Z" fill="url(#vhd-brass)" />
    {/* bead garland */}
    <path d="M -8 -86 Q 0 -66 10 -86" stroke="#ffe09a" strokeWidth={1.6} fill="none" strokeDasharray="1.6 1.6" />
    {/* arms raised, holding the flute across at the lips (to his right) */}
    <path d="M -8 -86 Q -18 -80 -20 -90 L -14 -94 Q -12 -86 -6 -88 Z" fill="#b8822a" />
    <path d="M 9 -86 Q 6 -78 -4 -88 L -2 -93 Q 6 -86 10 -88 Z" fill="url(#vhd-brass)" />
    <path d="M -40 -96 L 8 -89" stroke="#8a5a14" strokeWidth={3.4} strokeLinecap="round" />
    <path d="M -40 -96.6 L 8 -89.6" stroke="#ffe6a0" strokeWidth={1} strokeLinecap="round" opacity={0.75} />
    <circle cx={-19} cy={-93} r={3.2} fill="#d9a63a" />
    <circle cx={-3} cy={-91} r={3.2} fill="#e8bc5a" />
    {/* head, smooth, tilted toward the flute; crown with a peacock feather (all brass) */}
    <path d="M -3 -88 L 3 -88 L 3 -92 L -3 -92 Z" fill="#a8741e" />
    <ellipse cx={-1} cy={-100} rx={8} ry={9} fill="url(#vhd-brass)" />
    <path d="M -8 -103 Q -6 -112 -1 -114 Q 5 -112 7 -103 Z" fill="#c8902e" />
    <path d="M -6 -108 L -4 -121 L -1 -112 L 2 -122 L 4 -112 L 6 -108 Z" fill="url(#vhd-brass)" />
    <path d="M 2 -118 Q 10 -132 6 -142 Q 1 -132 2 -118 Z" fill="#c8902e" />
    <ellipse cx={5.5} cy={-136} rx={2.6} ry={3.6} fill="#8a5a14" />
    <ellipse cx={-3.6} cy={-101} rx={2} ry={4.5} fill="#fff0c0" opacity={0.5} />
  </g>
);

/**
 * A small seated Gopal of dark stone (about 60 px), dressed as family deities are: a yellow cloth, a tiny brass crown,
 * a laddu in the outstretched hand, on a red cushion. Deliberately simple and unlike Balak (no curls, no face detail).
 */
export const StoneGopal: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={-3} rx={28} ry={7} fill="#9a1c1c" />
    <ellipse cx={0} cy={-6} rx={26} ry={5} fill="#c8302a" />
    <ellipse cx={-6} cy={-12} rx={16} ry={6} fill="#34343a" />
    <path d="M 4 -10 Q 8 -30 16 -26 Q 22 -16 16 -9 Z" fill="#3e3e46" />
    <path d="M -12 -12 Q -15 -30 -6 -38 L 8 -38 Q 14 -28 12 -12 Z" fill="#e8b830" />
    <path d="M -10 -22 Q 0 -18 11 -22" stroke="#c8902a" strokeWidth={1.4} fill="none" />
    <path d="M -6 -34 Q -18 -30 -24 -24" stroke="#2e2e34" strokeWidth={5.5} strokeLinecap="round" fill="none" />
    <circle cx={-26} cy={-23} r={4.4} fill="#f0b040" />
    <path d="M 8 -34 Q 14 -26 10 -18" stroke="#2e2e34" strokeWidth={5} strokeLinecap="round" fill="none" />
    <circle cx={1} cy={-47} r={10.5} fill="url(#vhd-darkstone)" />
    <path d="M -8 -53 L -6 -64 L -2 -58 L 1 -67 L 4 -58 L 8 -64 L 10 -53 Z" fill="url(#vhd-brass)" />
    <ellipse cx={-2.5} cy={-48} rx={2.2} ry={3.6} fill="#9a9aa4" opacity={0.45} />
  </g>
);

/** The shalagram: a smooth black oval stone on a tiny brass throne, with tulsi leaves. */
export const ShalagramThrone: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M -20 0 L -16 -10 L 16 -10 L 20 0 Z" fill="url(#vhd-brass)" />
    <path d="M -14 -10 L -14 -30 Q 0 -40 14 -30 L 14 -10 Z" fill="url(#vhd-brass-v)" opacity={0.85} />
    <ellipse cx={0} cy={-18} rx={11} ry={9} fill="url(#vhd-darkstone)" />
    <path d="M -5 -18 Q 0 -24 5 -18 Q 0 -13 -5 -18 Z" fill="none" stroke="#c8c4b8" strokeWidth={0.8} opacity={0.6} />
    <ellipse cx={-4} cy={-21} rx={2.2} ry={3} fill="#9a9aa4" opacity={0.5} />
    {[-9, -3, 4, 9].map((dx, i) => (
      <ellipse key={i} cx={dx} cy={-9} rx={3.2} ry={1.6} fill={i % 2 ? "#3e7a2e" : "#4f8a3a"} transform={`rotate(${dx * 4} ${dx} -9)`} />
    ))}
  </g>
);

/** Marigold, jaba and jasmine flowers scattered along a line (offerings on the khat steps, the plate). */
const Flowers: React.FC<{ x0: number; x1: number; y: number; n: number; seed: number; s?: number }> = ({ x0, x1, y, n, seed, s = 1 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const x = lerp(x0, x1, (i + 0.5) / n) + (hs(seed + i * 3.1) - 0.5) * 8;
      const yy = y - hs(seed + i * 5.3) * 4 * s;
      const k = hs(seed + i * 7.7);
      if (k < 0.45)
        return (
          <g key={i}>
            <circle cx={x} cy={yy} r={5.4 * s} fill="#f29a1a" />
            <circle cx={x - 1} cy={yy - 1.2} r={3.2 * s} fill="#ffc23a" />
          </g>
        );
      if (k < 0.7)
        return (
          <g key={i}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={x} cy={yy - 3.6 * s} rx={2.2 * s} ry={3.8 * s} fill="#d41c1c" transform={`rotate(${a} ${x} ${yy})`} />
            ))}
            <circle cx={x} cy={yy} r={1.4 * s} fill="#ffd040" />
          </g>
        );
      if (k < 0.85) return <circle key={i} cx={x} cy={yy} r={3 * s} fill="#fbf6ea" />;
      return (
        <g key={i}>
          {[-30, 0, 30].map((a) => (
            <ellipse key={a} cx={x} cy={yy - 5 * s} rx={2.4 * s} ry={5 * s} fill="#4f8a3a" transform={`rotate(${a} ${x} ${yy})`} />
          ))}
        </g>
      );
    })}
  </g>
);

/**
 * The deities' khat: a carved teak throne in three tiers with an arched back panel of red velvet, turned posts and a
 * red canopy with gold trim and marigold swags. Base centre (x, y); about 480 px wide and 470 px tall at s 1.
 * The deities stand on the top tier at y - 170 s: Gobinda in the centre, the stone Gopal at -80, the shalagram at +95.
 */
export const KhatThrone: React.FC<{ x: number; y: number; s?: number; f: number; deities?: boolean; lamps?: boolean }> = ({
  x,
  y,
  s = 1,
  f,
  deities = true,
  lamps = true,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={260} ry={16} fill="#1a0c06" opacity={0.35} />
    {/* canopy posts */}
    {[-228, 228].map((px) => (
      <g key={px}>
        <rect x={px - 6} y={-470} width={12} height={410} fill="url(#vhd-teak)" />
        {[-420, -330, -240, -150].map((py) => (
          <ellipse key={py} cx={px} cy={py} rx={10} ry={6} fill="#6a3a1a" />
        ))}
      </g>
    ))}
    {/* back panel: arched, carved border, red velvet inside (a cloth, not a light) */}
    <path d="M -160 -176 L -160 -300 Q -160 -372 0 -380 Q 160 -372 160 -300 L 160 -176 Z" fill="#5a2c12" />
    <path d="M -142 -176 L -142 -296 Q -142 -354 0 -360 Q 142 -354 142 -296 L 142 -176 Z" fill="#7a1a18" />
    <path d="M -142 -296 Q -142 -354 0 -360 Q 142 -354 142 -296" stroke="#c8902e" strokeWidth={3} fill="none" opacity={0.8} />
    {Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      const a = Math.PI * (1 - t);
      return <circle key={i} cx={Math.cos(a) * 150} cy={-300 - Math.sin(a) * 66} r={3} fill="#e0b050" opacity={0.85} />;
    })}
    {/* folds in the velvet */}
    {[-90, -30, 30, 90].map((fx) => (
      <path key={fx} d={`M ${fx} -350 Q ${fx + 6} -260 ${fx - 4} -180`} stroke="#5a1010" strokeWidth={4} fill="none" opacity={0.5} />
    ))}
    {/* tiers */}
    {[
      [-240, 240, -60, 0],
      [-205, 205, -118, -60],
      [-170, 170, -176, -118],
    ].map(([a, b, t, bot], i) => (
      <g key={i}>
        <rect x={a} y={t} width={b - a} height={bot - t} fill="url(#vhd-teak)" />
        <rect x={a - 4} y={t - 6} width={b - a + 8} height={8} rx={2} fill="#9a6230" />
        <rect x={a - 4} y={t - 6} width={b - a + 8} height={2} fill="#c8884a" opacity={0.7} />
        {/* carved panels */}
        {Array.from({ length: Math.floor((b - a) / 70) }, (_, k) => {
          const w = (b - a) / Math.floor((b - a) / 70);
          return (
            <g key={k}>
              <rect x={a + k * w + 8} y={t + 9} width={w - 16} height={bot - t - 18} rx={4} fill="none" stroke="#3a1c0a" strokeWidth={2} opacity={0.75} />
              <path d={`M ${a + k * w + w / 2 - 9} ${(t + bot) / 2} q 9 -10 18 0 q -9 10 -18 0 Z`} fill="#3a1c0a" opacity={0.6} />
            </g>
          );
        })}
      </g>
    ))}
    {/* a cloth on the top tier */}
    <path d="M -170 -176 L 170 -176 L 160 -150 Q 0 -140 -160 -150 Z" fill="#e8c24a" opacity={0.95} />
    <path d="M -160 -150 Q 0 -140 160 -150" stroke="#b8202a" strokeWidth={3} fill="none" />
    {/* offerings on the tiers */}
    <Flowers x0={-190} x1={190} y={-122} n={20} seed={11} />
    <Flowers x0={-225} x1={225} y={-64} n={24} seed={23} />
    {deities && (
      <g>
        <StoneGopal x={-84} y={-174} s={1.1} />
        <BrassGobinda x={0} y={-174} s={1.12} />
        <ShalagramThrone x={96} y={-174} s={1.1} />
        <Flowers x0={-40} x1={40} y={-176} n={6} seed={41} s={0.8} />
      </g>
    )}
    {/* canopy: red cloth with gold trim, scalloped, marigold swags */}
    <rect x={-250} y={-488} width={500} height={26} fill="#a81c1c" />
    <rect x={-250} y={-490} width={500} height={5} fill="#e8b84a" />
    {Array.from({ length: 12 }, (_, i) => (
      <path key={i} d={`M ${-250 + i * 41.7} -462 q 20.8 ${18 + Math.sin(f * 0.03 + i) * 1.2} 41.7 0 Z`} fill={i % 2 ? "#c8302a" : "#b81c1c"} />
    ))}
    <path d="M -250 -462 L 250 -462" stroke="#e8b84a" strokeWidth={2.5} />
    <Garland x1={-236} y1={-446} x2={0} y2={-446} sag={34} s={0.8} f={f} />
    <Garland x1={0} y1={-446} x2={236} y2={-446} sag={34} s={0.8} f={f} seed={3} />
    {/* small brass lamps on the lowest tier, well to the sides (no light near the deities) */}
    {lamps &&
      [-212, 212].map((lx, i) => (
        <g key={lx}>
          <ellipse cx={lx} cy={-62} rx={11} ry={3} fill="#6a420c" />
          <path d={`M ${lx - 10} -64 Q ${lx} -56 ${lx + 10} -64 L ${lx + 8} -70 L ${lx - 8} -70 Z`} fill="url(#vhd-brass)" />
          <Flame x={lx + 2} y={-70} s={0.85} f={f} seed={60 + i} glow={false} />
        </g>
      ))}
  </g>
);

/** The whole fopra (the spongy coconut apple): off-white, round, a little textured. Centre (x, y), about 52 px wide. */
export const Fopra: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={26} ry={21} fill="#efe6cc" />
    <ellipse cx={4} cy={5} rx={22} ry={15} fill="#d8cca8" opacity={0.6} />
    <ellipse cx={-8} cy={-8} rx={10} ry={7} fill="#fffaec" opacity={0.85} />
    {Array.from({ length: 16 }, (_, i) => (
      <circle key={i} cx={(hs(i * 2.3) - 0.5) * 38} cy={(hs(i * 4.1) - 0.5) * 28} r={1.2 + hs(i * 6.7)} fill="#c8b88e" opacity={0.6} />
    ))}
  </g>
);

/**
 * THE stone bowl (পাথরের বাটি) of the full-moon abhishek: a big, heavy, carved grey-brown stone bowl, wide and fairly
 * deep, with a thick rim, the pale coconut water inside and the big whole fopra (ফোপড়া) sitting in it (Episode 4,
 * STO-19). One drawing for every place it appears: the set's StoneBowl below and Balak's held "stoneBowl"
 * (src/episode03/rig/SeatedChild.tsx) both draw stoneBowlArt, so a hand-over shows no jump.
 *
 * Bowl units: origin at the centre of the rim's grip line (the rim ellipse is centred at y = -6), y down; the rim is
 * STONE_BOWL_UNITS.rimRx (24) wide each side, the base STONE_BOWL_UNITS.bottom (20) below the origin. `fill` 1 =
 * brimming .. 0 = drunk (the fopra left alone in it). `gid` makes the gradient and clip ids unique.
 */
export const STONE_BOWL_UNITS = { rimRx: 24, rimRy: 6.2, rimY: -6, bottom: 20, footRx: 12.5 } as const;
export const stoneBowlArt = (gid: string, fill: number): React.ReactElement => {
  const w = clamp(fill);
  const e = 1 - w;
  const { rimRx, rimRy, rimY } = STONE_BOWL_UNITS;
  const inRx = rimRx - 3.2;
  const inRy = rimRy - 1.5;
  const inY = rimY + 0.5;
  const waterY = inY + 0.4 + 5.5 * e;
  const waterRx = inRx - 0.4 - 4.5 * e;
  const fopraY = waterY - 4.2 + 1.2 * e;
  // the outer body: the front half of the rim, the full belly, a narrow base
  const body = `M ${-rimRx} ${rimY} A ${rimRx} ${rimRy} 0 0 0 ${rimRx} ${rimY} C ${rimRx + 0.4} 5 19.5 14.5 12.5 17.6 Q 0 19.4 -12.5 17.6 C -19.5 14.5 ${-rimRx - 0.4} 5 ${-rimRx} ${rimY} Z`;
  // carved bands following the belly's curve, and the flutes between them
  const band = (y: number, rx: number, ry: number) => `M ${-rx} ${y} A ${rx} ${ry} 0 0 0 ${rx} ${y}`;
  const flutes = Array.from({ length: 9 }, (_, i) => {
    const a = -0.86 + (i * 1.72) / 8; // across the front, -50 .. 50 degrees
    const x0 = Math.sin(a) * 22.6;
    const y0 = 0.6 + Math.cos(a) * 5.4;
    const x1 = Math.sin(a) * 17.2;
    const y1 = 9 + Math.cos(a) * 4.6;
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} Q ${(x0 * 0.94 + x1 * 0.06 + 0.8 * Math.sign(x0)).toFixed(2)} ${((y0 + y1) / 2).toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  });
  const pits: Array<[number, number, number]> = [
    [-17, 6, 0.55],
    [-9, 13, 0.5],
    [4, 14.5, 0.45],
    [14, 10, 0.55],
    [19, 2.5, 0.45],
    [-21, 0.5, 0.4],
    [8, 2.8, 0.4],
    [-3, 5.5, 0.35],
    [12.5, 15.5, 0.4],
  ];
  return (
    <g>
      <defs>
        <linearGradient id={`${gid}-sbody`} x1="0" y1="0" x2="1" y2="0.18">
          <stop offset="0" stopColor="#76685a" />
          <stop offset="0.22" stopColor="#b4a28a" />
          <stop offset="0.45" stopColor="#9b8873" />
          <stop offset="0.78" stopColor="#736352" />
          <stop offset="1" stopColor="#4d4036" />
        </linearGradient>
        <linearGradient id={`${gid}-sshade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2e2620" stopOpacity={0} />
          <stop offset="0.55" stopColor="#2e2620" stopOpacity={0.08} />
          <stop offset="1" stopColor="#2e2620" stopOpacity={0.42} />
        </linearGradient>
        <linearGradient id={`${gid}-srim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a8957d" />
          <stop offset="0.3" stopColor="#d0c0a6" />
          <stop offset="0.7" stopColor="#a9967e" />
          <stop offset="1" stopColor="#7f6e5c" />
        </linearGradient>
        <clipPath id={`${gid}-sin`}>
          {/* everything above the inner front lip: the fopra shows over the rim, never through the bowl's wall */}
          <path d={`M ${-inRx} ${inY} A ${inRx} ${inRy} 0 0 0 ${inRx} ${inY} L ${inRx} -60 L ${-inRx} -60 Z`} />
        </clipPath>
      </defs>
      {/* foot ring */}
      <ellipse cx={0} cy={18.6} rx={STONE_BOWL_UNITS.footRx} ry={2.3} fill="#3e362f" />
      <path d="M -12.5 17.4 L -12 19.2 Q 0 21.2 12 19.2 L 12.5 17.4 Z" fill="#5e544a" />
      {/* belly: stone gradient, a darker underside */}
      <path d={body} fill={`url(#${gid}-sbody)`} />
      <path d={body} fill={`url(#${gid}-sshade)`} />
      {/* carved bands (an incised line with a lit lower edge) and the flutes between them */}
      <path d={band(0.6, 22.6, 5.4)} fill="none" stroke="#3f362e" strokeWidth={0.9} opacity={0.75} />
      <path d={band(1.4, 22.4, 5.3)} fill="none" stroke="#d2c6b0" strokeWidth={0.55} opacity={0.45} />
      <path d={band(9, 17.2, 4.6)} fill="none" stroke="#3f362e" strokeWidth={0.85} opacity={0.7} />
      <path d={band(9.8, 17, 4.5)} fill="none" stroke="#c9bca6" strokeWidth={0.5} opacity={0.38} />
      {flutes.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#3f362e" strokeWidth={0.7} strokeLinecap="round" opacity={0.5} />
      ))}
      {/* chisel pits and a soft sheen on the lit flank */}
      {pits.map(([px, py, r], i) => (
        <circle key={i} cx={px} cy={py} r={r} fill={i % 3 === 0 ? "#d6cab4" : "#3a322b"} opacity={0.5} />
      ))}
      <path d="M -21.5 -1.5 Q -20 8 -13 14" stroke="#e0d4be" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.32} />
      {/* thick rim: lit top, inner wall in shadow */}
      <ellipse cx={0} cy={rimY} rx={rimRx} ry={rimRy} fill={`url(#${gid}-srim)`} />
      <ellipse cx={0} cy={inY} rx={inRx} ry={inRy} fill="#3a322b" />
      <ellipse cx={0} cy={inY + 0.9} rx={inRx - 1.2} ry={inRy - 0.9} fill="#4a4138" />
      {/* the pale coconut water */}
      {w > 0.02 && (
        <g>
          <ellipse cx={0} cy={waterY} rx={waterRx} ry={inRy - 0.4 - 1.1 * e} fill="#e3e8cf" opacity={0.55 + 0.37 * w} />
          <ellipse cx={-1} cy={waterY + 0.6} rx={waterRx * 0.8} ry={(inRy - 1.3) * 0.75} fill="#f1f3e2" opacity={0.35 * w} />
          <ellipse cx={-waterRx * 0.42} cy={waterY - 0.8} rx={waterRx * 0.26} ry={0.8} fill="#ffffff" opacity={0.7 * w} />
        </g>
      )}
      {/* the big whole fopra sitting in the water, its top above the rim */}
      <g clipPath={`url(#${gid}-sin)`}>
        <g transform={`translate(3.2 ${fopraY.toFixed(2)})`}>
          <ellipse cx={0} cy={0} rx={9.6} ry={8.2} fill="#f3ecd8" />
          <ellipse cx={1.8} cy={2.2} rx={7.6} ry={5.6} fill="#d9cda9" opacity={0.55} />
          <ellipse cx={-3} cy={-3.2} rx={4} ry={2.8} fill="#fffbef" opacity={0.9} />
          {[
            [-4.5, 1.5],
            [-1, 4],
            [3.5, -2.5],
            [5.5, 1.8],
            [0.5, -0.5],
            [-5.8, -1.6],
            [2.4, 5],
          ].map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={0.55} fill="#c6b68c" opacity={0.65} />
          ))}
        </g>
        {w > 0.02 && <ellipse cx={3.2} cy={waterY + 0.2} rx={9} ry={1.6} fill="#e3e8cf" opacity={0.35 * w} />}
      </g>
      {/* lit front edge of the rim */}
      <path d={`M ${-rimRx + 0.6} ${rimY + 0.8} A ${rimRx - 0.6} ${rimRy - 0.4} 0 0 0 ${rimRx - 0.6} ${rimY + 0.8}`} fill="none" stroke="#ddd1bb" strokeWidth={0.8} opacity={0.55} />
    </g>
  );
};

/**
 * The stone bowl standing on the floor, drawn with stoneBowlArt (the same bowl Balak lifts). (x, y) = bottom centre
 * on the floor; about 150 px wide at s 1. level 0..1 = the coconut water (0 = drunk); the fopra is always in it
 * (`fopra` is kept for the API); tilt (deg) rotates about the bottom centre.
 */
const STONE_BOWL_K = 75 / STONE_BOWL_UNITS.rimRx;
export const StoneBowl: React.FC<{ x: number; y: number; s?: number; level?: number; fopra?: boolean; tilt?: number }> = ({
  x,
  y,
  s = 1,
  level = 1,
  tilt = 0,
}) => {
  const gid = "vsb" + React.useId().replace(/[^A-Za-z0-9_-]/g, "");
  return (
    <g transform={`translate(${x}, ${y}) rotate(${tilt}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={66} ry={8} fill="#1a0c06" opacity={0.3} />
      <g transform={`scale(${STONE_BOWL_K.toFixed(4)}) translate(0 ${-STONE_BOWL_UNITS.bottom - 1})`}>{stoneBowlArt(gid, level)}</g>
    </g>
  );
};

/** A cut green coconut (ডাব) lying on its side or upright. (x, y) = base centre. About 70 px long. */
export const GreenCoconut: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = -70 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={34} ry={6} fill="#1a0c06" opacity={0.3} />
    <g transform={`translate(0, -24) rotate(${rot})`}>
      <ellipse cx={0} cy={0} rx={24} ry={34} fill="url(#vhd-coconut)" />
      <ellipse cx={-7} cy={-6} rx={6} ry={16} fill="#9ac45a" opacity={0.45} />
      {/* the cut top: white flesh ring, a dark opening */}
      <ellipse cx={0} cy={-31} rx={14} ry={5} fill="#f4f0dc" />
      <ellipse cx={0} cy={-31} rx={6} ry={2.4} fill="#3a2a10" />
      <path d="M -14 -31 Q 0 -26 14 -31" stroke="#5a8a2a" strokeWidth={2} fill="none" />
    </g>
  </g>
);

/** The conch (shankha) on a small brass stand. (x, y) = base centre; about 80 px long. */
export const Conch: React.FC<{ x: number; y: number; s?: number; stand?: boolean }> = ({ x, y, s = 1, stand = true }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    {stand && (
      <g>
        <ellipse cx={0} cy={0} rx={22} ry={5} fill="#6a420c" />
        <path d="M -18 -2 L -10 -14 M 18 -2 L 10 -14 M 0 0 L 0 -14" stroke="#c8902e" strokeWidth={3} strokeLinecap="round" />
        <ellipse cx={0} cy={-14} rx={17} ry={4} fill="url(#vhd-brass)" />
      </g>
    )}
    <g transform={`translate(0, ${stand ? -26 : -12}) rotate(-8)`}>
      <path d="M -40 2 Q -30 -4 -18 -12 Q 0 -22 18 -16 L 30 -12 L 40 -6 L 30 -1 Q 10 14 -16 10 Q -30 8 -40 2 Z" fill="#fbf4e6" />
      <path d="M 18 -16 L 26 -20 L 30 -12 Z M 30 -12 L 36 -14 L 40 -6 Z" fill="#efe2c8" />
      {[-10, 0, 10].map((kx) => (
        <ellipse key={kx} cx={kx} cy={-16 + Math.abs(kx) * 0.15} rx={3.4} ry={2.4} fill="#e6d6b8" />
      ))}
      <path d="M -24 -6 Q 0 -16 26 -10 M -26 2 Q 0 -4 28 -4" stroke="#d8c6a2" strokeWidth={1.5} fill="none" />
      <path d="M -30 4 Q -6 14 20 4 Q -4 8 -30 4 Z" fill="#f0b4a0" />
      <path d="M -36 1 Q -38 -2 -42 -1" stroke="#e0cfae" strokeWidth={2} fill="none" />
      <ellipse cx={-6} cy={-8} rx={10} ry={2.6} fill="#ffffff" opacity={0.6} />
    </g>
  </g>
);

/** The brass hand bell (ঘণ্টা). (x, y) = the bell's lip centre resting on the floor; about 62 px tall. swing (deg). */
export const BrassBell: React.FC<{ x: number; y: number; s?: number; swing?: number }> = ({ x, y, s = 1, swing = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${swing}, 0, -34) scale(${s})`}>
    <ellipse cx={0} cy={1} rx={18} ry={4} fill="#1a0c06" opacity={0.3} />
    <path d="M -17 0 Q -16 -24 0 -27 Q 16 -24 17 0 Z" fill="url(#vhd-brass)" />
    <ellipse cx={0} cy={0} rx={17} ry={3.6} fill="#8a5a14" />
    <rect x={-3} y={-50} width={6} height={24} fill="url(#vhd-brass)" />
    <circle cx={0} cy={-52} r={5} fill="#d9a63a" />
    <path d="M -4 -56 Q 0 -66 4 -56 Z" fill="#c8902e" />
  </g>
);

/** Copper kosha (a boat-shaped vessel) with its small kushi spoon. (x, y) = base centre; about 80 px wide. */
export const KoshaKushi: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={1} rx={38} ry={5} fill="#1a0c06" opacity={0.3} />
    <path d="M -40 -18 Q -20 2 0 2 Q 20 2 40 -18 Q 20 -10 0 -10 Q -20 -10 -40 -18 Z" fill="url(#vhd-copper)" />
    <path d="M -40 -18 Q 0 -26 40 -18 Q 0 -10 -40 -18 Z" fill="#7a3418" />
    <path d="M -34 -17 Q 0 -22 34 -17" stroke="#f2b088" strokeWidth={1.4} fill="none" opacity={0.7} />
    {/* the kushi resting across it */}
    <path d="M -10 -22 L 34 -36" stroke="#b8643a" strokeWidth={3} strokeLinecap="round" />
    <ellipse cx={-12} cy={-21} rx={6} ry={3} fill="#d07a48" />
  </g>
);

/** A brass puja plate heaped with flowers and bel leaves. (x, y) = centre on the floor; about 110 px wide. */
export const FlowerPlate: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={56} ry={10} fill="#1a0c06" opacity={0.3} />
    <ellipse cx={0} cy={-2} rx={55} ry={12} fill="url(#vhd-brass)" />
    <ellipse cx={0} cy={-3} rx={47} ry={9} fill="#c8902e" />
    <Flowers x0={-40} x1={40} y={-6} n={10} seed={71} />
    <Flowers x0={-28} x1={28} y={-12} n={6} seed={83} />
    {/* sandal paste dots */}
    {[-30, 26].map((dx) => (
      <circle key={dx} cx={dx} cy={-2} r={3} fill="#f4e2c0" />
    ))}
  </g>
);

/** The mangal ghot: a brass pot with mango leaves and a green coconut, a sindoor mark. (x, y) = base centre. */
export const MangalGhot: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={30} ry={6} fill="#1a0c06" opacity={0.3} />
    <path d="M -16 0 Q -34 -18 -26 -40 Q -18 -54 -12 -56 L 12 -56 Q 18 -54 26 -40 Q 34 -18 16 0 Z" fill="url(#vhd-brass)" />
    <rect x={-13} y={-62} width={26} height={7} rx={2} fill="#c8902e" />
    <circle cx={0} cy={-30} r={4} fill="#c8102e" />
    {[-55, -30, -8, 14, 36, 58].map((a, i) => (
      <path key={a} d="M 0 -60 Q 8 -84 2 -104 Q -6 -84 0 -60 Z" fill={i % 2 ? "#3e7a2e" : "#5a9a3a"} transform={`rotate(${a} 0 -60)`} />
    ))}
    <ellipse cx={0} cy={-76} rx={17} ry={20} fill="url(#vhd-coconut)" />
    <path d="M -4 -94 Q 0 -104 4 -94" stroke="#3e6a1e" strokeWidth={3} fill="none" />
  </g>
);

/**
 * Brass lamps. "pilsuj": the tall lamp stand (about 190 px) with a clay pradip on top; "pradip": a small brass
 * lamp on the floor. (x, y) = base centre. The flame keeps its own small warm glow (a light source, not an idol).
 */
export const BrassLamp: React.FC<{ x: number; y: number; s?: number; f: number; kind?: "pilsuj" | "pradip"; seed?: number; lit?: boolean }> = ({
  x,
  y,
  s = 1,
  f,
  kind = "pilsuj",
  seed = 0,
  lit = true,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    {kind === "pilsuj" ? (
      <g>
        <ellipse cx={0} cy={2} rx={36} ry={7} fill="#1a0c06" opacity={0.3} />
        <ellipse cx={0} cy={-2} rx={32} ry={7} fill="url(#vhd-brass)" />
        <path d="M -24 -4 Q 0 -20 24 -4 Z" fill="#c8902e" />
        <rect x={-4} y={-170} width={8} height={160} fill="url(#vhd-brass)" />
        {[-40, -90, -140].map((ky) => (
          <ellipse key={ky} cx={0} cy={ky} rx={9} ry={5} fill="url(#vhd-brass)" />
        ))}
        <ellipse cx={0} cy={-172} rx={22} ry={5} fill="url(#vhd-brass)" />
        <path d="M -14 -176 Q -13 -166 0 -165 Q 13 -166 14 -176 Q 0 -172 -14 -176 Z" fill="#a4522a" />
        <path d="M 12 -176 Q 18 -180 17 -174 Z" fill="#a4522a" />
        {lit && <Flame x={14} y={-178} s={1.05} f={f} seed={seed} />}
      </g>
    ) : (
      <g>
        <ellipse cx={0} cy={2} rx={18} ry={4} fill="#1a0c06" opacity={0.3} />
        <path d="M -8 0 L -5 -10 L 5 -10 L 8 0 Z" fill="url(#vhd-brass)" />
        <path d="M -16 -12 Q 0 -2 16 -12 L 14 -16 Q 0 -12 -14 -16 Z" fill="url(#vhd-brass)" />
        <path d="M 14 -15 Q 20 -19 19 -13 Z" fill="#c8902e" />
        {lit && <Flame x={17} y={-16} s={0.9} f={f} seed={seed} />}
      </g>
    )}
  </g>
);

/**
 * The brass dhoop-dani (incense burner) with a long handle: coals and a thin curl of smoke. (x, y) = base centre;
 * the bowl about 46 px wide, the smoke rising about 120 px. smoke 0..1. Handle points left (the grip at x - 70).
 */
export const DhoopDani: React.FC<{ x: number; y: number; s?: number; f: number; smoke?: number }> = ({ x, y, s = 1, f, smoke = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={2} rx={22} ry={4} fill="#1a0c06" opacity={0.3} />
    <path d="M -9 0 L -6 -12 L 6 -12 L 9 0 Z" fill="url(#vhd-brass)" />
    <path d="M -23 -26 Q -20 -10 0 -10 Q 20 -10 23 -26 Z" fill="url(#vhd-brass)" />
    <ellipse cx={0} cy={-26} rx={23} ry={5} fill="#5a3a12" />
    {/* coals and resin: dull red, no glow */}
    {[-10, -3, 5, 12].map((cx, i) => (
      <ellipse key={i} cx={cx} cy={-27 - (i % 2)} rx={4} ry={2.4} fill={i % 2 ? "#8a2a14" : "#5a2010"} />
    ))}
    <ellipse cx={1} cy={-28} rx={3} ry={1.6} fill="#d8602a" opacity={0.55 + 0.25 * flicker(f, 31)} />
    {/* handle */}
    <path d="M -22 -24 Q -46 -30 -70 -40" stroke="#b8822a" strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M -22 -25.5 Q -46 -31.5 -70 -41.5" stroke="#ffe6a0" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.6} />
    <circle cx={-72} cy={-41} r={5} fill="#c8902e" />
    {/* smoke: a few thin ribbons that curl and thin out */}
    {smoke > 0.01 &&
      [0, 1, 2].map((k) => {
        const ph = f * 0.035 + k * 2.1;
        const pts = Array.from({ length: 9 }, (_, i) => {
          const u = i / 8;
          const xx = 2 + Math.sin(ph + u * 4.2) * (4 + u * 16) + noise1(f * 0.02 + u * 2, 50 + k) * 6 * u + u * 10 * (k - 1);
          return `${n1(xx)} ${n1(-30 - u * 120)}`;
        });
        return (
          <path
            key={k}
            d={`M ${pts[0]} Q ${pts[1]} ${pts[2]} T ${pts[4]} T ${pts[6]} T ${pts[8]}`}
            stroke="#ece6f0"
            strokeWidth={3.2 - k * 0.6}
            fill="none"
            strokeLinecap="round"
            opacity={(0.42 - k * 0.1) * smoke}
          />
        );
      })}
  </g>
);

/* ------------------------------------------------------------------ */
/* 1. INNER COURTYARD BY DAY                                            */
/* ------------------------------------------------------------------ */

export type CourtyardTime = "morning" | "afternoon";

const ARCH_FIRST = -4;
const ARCH_LAST = 10;
/** Left x of arch i on the 0.55 plane (Episode 1: i 0..6 at -160 + 330 i). */
export const courtyardArchX = (i: number) => -160 + i * 330;

export const VEDIC_COURTYARD = {
  PLANES: { sky: 0.12, back: 0.55, floor: 0.8, veranda: 1, foreground: 1.3 },
  /** far plinth (on the 0.8 plane): tread 740..764, riser 764..784; flagstones from 784. */
  PLINTH: { top: 740, riser: 764, ground: 784 },
  ARCH: { first: ARCH_FIRST, last: ARCH_LAST, w: 220, springY: 470, bottomY: 740 },
  TULSI: { x: 1760, y: 830, s: 1.1 },
  VERANDA_LIP: 920,
  BACK_X: [-1560, 3420] as const,
  FLOOR_X: [-2400, 4400] as const,
  FLOOR_BOTTOM: 1700,
  VERANDA_X: [-2800, 4800] as const,
  VERANDA_BOTTOM: 1900,
} as const;

export const VEDIC_COURTYARD_BG: Record<CourtyardTime, string> = { morning: "#cfe0d8", afternoon: "#e8d2a8" };

export const vedicCourtyardGrade = (time: CourtyardTime = "morning"): React.ComponentProps<typeof Grade> =>
  time === "afternoon"
    ? { warmth: 0.55, vignette: 0.52, grain: 0.04, bloomAt: [62, 6], tint: "#ffcf96", tintAmount: 0.14 }
    : { warmth: 0.32, vignette: 0.46, grain: 0.04, bloomAt: [18, 8] };

export const vedicCourtyardKeepInSet = <C extends Cam>(c: C, nearVeranda = false): C =>
  keepInSet(
    c,
    [
      { d: 0.12, x0: -2600, x1: 4600, y0: -1500 },
      { d: 0.55, x0: VEDIC_COURTYARD.BACK_X[0], x1: VEDIC_COURTYARD.BACK_X[1] },
      { d: 0.8, x0: VEDIC_COURTYARD.FLOOR_X[0], x1: VEDIC_COURTYARD.FLOOR_X[1], y1: VEDIC_COURTYARD.FLOOR_BOTTOM },
      ...(nearVeranda ? [{ d: 1, x0: VEDIC_COURTYARD.VERANDA_X[0], x1: VEDIC_COURTYARD.VERANDA_X[1], y1: VEDIC_COURTYARD.VERANDA_BOTTOM }] : []),
    ],
    // the far plinth (0.8) must never drop below the bottom of the back wall's lower band (0.55, y 900)
    [{ back: 0.55, front: 0.8, frontTop: 734, backBottom: 900 }],
  );

/** Lime-plastered brick wall weathering for the day courtyard (as Episode 1's, lighter). */
const DayWallWeathering: React.FC = () => (
  <g>
    {Array.from({ length: 30 }, (_, i) => (
      <ellipse key={`st${i}`} cx={-1500 + hs(i * 3.1) * 4900} cy={320 + hs(i * 5.7) * 360} rx={60 + hs(i * 7.3) * 140} ry={40 + hs(i * 2.9) * 90} fill="#7a3a1c" opacity={0.07} />
    ))}
    <rect x={-1600} y={640} width={5100} height={100} fill="#5a2a14" opacity={0.1} />
    {Array.from({ length: 14 }, (_, i) => {
      const bx = -1460 + i * 330 + 140 + hs(i * 11) * 40;
      const by = 300 + hs(i * 13) * 30;
      if (hs(i * 17) < 0.45) return null;
      const w = 70 + hs(i * 19) * 50;
      const h = 30 + hs(i * 23) * 22;
      return (
        <g key={`br${i}`} opacity={0.42}>
          <path d={`M ${bx} ${by + 6} L ${bx + w * 0.3} ${by - 2} L ${bx + w * 0.7} ${by + 3} L ${bx + w} ${by + h * 0.4} L ${bx + w * 0.8} ${by + h} L ${bx + w * 0.3} ${by + h * 0.85} L ${bx - 4} ${by + h * 0.5} Z`} fill="#b0583a" />
          {Array.from({ length: 3 }, (_, r) => (
            <line key={r} x1={bx + 2} y1={by + 6 + r * 9} x2={bx + w - 4} y2={by + 6 + r * 9} stroke="#7a3420" strokeWidth={1.2} opacity={0.7} />
          ))}
        </g>
      );
    })}
    {Array.from({ length: 16 }, (_, i) => {
      const cx = -1400 + hs(i * 29) * 4600;
      const cy = 300 + hs(i * 31) * 300;
      return <path key={`ck${i}`} d={`M ${cx} ${cy} l ${8 + hs(i) * 10} ${14 + hs(i * 2) * 10} l -6 ${12 + hs(i * 3) * 8} l ${10 + hs(i * 4) * 8} ${16 + hs(i * 5) * 12}`} stroke="#6a3018" strokeWidth={1.2} fill="none" opacity={0.35} />;
    })}
  </g>
);

/** The lamplit shrine interior seen small through a door: wall, dado, the khat with the deities, lamps. Local
 *  coordinates: the door opening spans x -110..110, floor at y 0. */
const MiniShrineInterior: React.FC<{ f: number; k: number }> = ({ f, k }) => (
  <g>
    <rect x={-160} y={-420} width={320} height={460} fill="#b88a58" />
    <rect x={-160} y={-420} width={320} height={460} fill="url(#vhd-mini-wall)" />
    <rect x={-160} y={-70} width={320} height={70} fill="#7a2e1a" />
    <rect x={-160} y={0} width={320} height={40} fill="#5a2414" />
    <KhatThrone x={30} y={6} s={0.4 * k} f={f} />
    <BrassLamp x={-70} y={4} s={0.42 * k} f={f} kind="pilsuj" seed={88} />
    <ellipse cx={-50} cy={-80} rx={120} ry={110} fill="url(#vhd-lamp-wash)" />
  </g>
);

const ShrineDoorDressing: React.FC<{ f: number; ax: number; inShrine?: React.ReactNode }> = ({ f, ax, inShrine }) => {
  const cx = ax + 110;
  const clipId = `vhd-shrine-arch-${ax}`;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={`M ${ax + 14} 740 L ${ax + 14} 476 Q ${ax + 110} 384 ${ax + 206} 476 L ${ax + 206} 740 Z`} />
        </clipPath>
        <linearGradient id="vhd-mini-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2c18" stopOpacity={0.6} />
          <stop offset="60%" stopColor="#d8a868" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${cx}, 734)`}>
          <MiniShrineInterior f={f} k={1} />
        </g>
        {inShrine}
        {/* the shade of the doorway's depth */}
        <path d={`M ${ax + 14} 740 L ${ax + 14} 476 Q ${ax + 110} 384 ${ax + 206} 476 L ${ax + 196} 480 Q ${ax + 110} 400 ${ax + 24} 480 L ${ax + 24} 740 Z`} fill="#2a140a" opacity={0.45} />
      </g>
      {/* carved teak frame and the folded-back door leaves */}
      <path d={`M ${ax + 16} 740 L ${ax + 16} 477 Q ${ax + 110} 386 ${ax + 204} 477 L ${ax + 204} 740`} stroke="#5a3016" strokeWidth={7} fill="none" />
      {[ax + 16, ax + 192].map((x) => (
        <g key={x}>
          <rect x={x} y={560} width={13} height={178} fill="#4a2810" />
          {[590, 650, 700].map((y) => (
            <circle key={y} cx={x + 6.5} cy={y} r={1.3} fill="#d8a84a" />
          ))}
        </g>
      ))}
      {/* maroon curtain tied back to the left jamb */}
      <path d={`M ${ax + 18} 478 Q ${ax + 60} 470 ${ax + 92} 486 Q ${ax + 60} 560 ${ax + 44} 600 Q ${ax + 52} 670 ${ax + 30} 738 L ${ax + 18} 738 Z`} fill="#7a1a1e" />
      <path d={`M ${ax + 30} 490 Q ${ax + 46} 560 ${ax + 36} 610 M ${ax + 54} 492 Q ${ax + 58} 548 ${ax + 44} 600`} stroke="#5a0e12" strokeWidth={2} fill="none" />
      <path d={`M ${ax + 36} 600 L ${ax + 50} 604`} stroke="#e0b050" strokeWidth={3} />
      {/* threshold */}
      <rect x={ax + 12} y={732} width={196} height={9} fill="#6a3a1a" />
      <rect x={ax + 12} y={732} width={196} height={2} fill="#a8703a" />
      {/* mango-leaf toran across the spring of the arch */}
      {Array.from({ length: 13 }, (_, i) => {
        const x = ax + 22 + i * 14.6;
        const y = 474 - Math.sin((i / 12) * Math.PI) * 20;
        return <path key={i} d={`M ${x} ${y} q -3.5 9 0 16 q 3.5 -7 0 -16 Z`} fill={i % 2 ? "#3e7a2e" : "#5a9a3a"} />;
      })}
    </g>
  );
};

export const VedicCourtyardSkyLayer: React.FC<{ f: number; time?: CourtyardTime; cam?: Cam; calm?: number }> = ({ f, time = "morning", cam, calm = 1 }) => (
  <Layer depth={0.12} extraBlur={bgBlur(0.12, calm, cam)}>
    <rect x={-2600} y={-1600} width={7200} height={2800} fill="#a8c8dc" />
    <g transform="translate(0, 260)">
      <DaySky f={f} sunX={time === "afternoon" ? 1500 : 300} sunY={-900} />
    </g>
    {time === "afternoon" && <rect x={-2600} y={-1600} width={7200} height={2800} fill="#ffc47a" opacity={0.3} />}
    <Birds f={f * 0.8} x={-200} y={60} n={4} s={0.6} />
  </Layer>
);

export const VedicCourtyardBackLayer: React.FC<{
  f: number;
  time?: CourtyardTime;
  cam?: Cam;
  calm?: number;
  shrineArch?: number | false;
  inShrine?: React.ReactNode;
  far?: React.ReactNode;
}> = ({ f, time = "morning", cam, calm = 1, shrineArch = false, inShrine, far }) => {
  const aft = time === "afternoon";
  const arches = Array.from({ length: ARCH_LAST - ARCH_FIRST + 1 }, (_, k) => ARCH_FIRST + k);
  return (
    <Layer depth={0.55} extraBlur={bgBlur(0.55, calm, cam) * 0.6}>
      <VhdDefs />
      <GlowDefs />
      <defs>
        <linearGradient id="vhd-cy-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e08e56" />
          <stop offset="100%" stopColor="#c07042" />
        </linearGradient>
        <pattern id="vhd-cy-brick" width={40} height={20} patternUnits="userSpaceOnUse">
          <path d="M 0 0 H 40 M 0 10 H 40 M 10 0 V 10 M 30 10 V 20" stroke="#9a5232" strokeWidth={1.1} />
        </pattern>
        <linearGradient id="vhd-cy-room" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24140c" />
          <stop offset="70%" stopColor="#3e2416" />
          <stop offset="100%" stopColor="#5a3a26" />
        </linearGradient>
        <linearGradient id="vhd-cy-aft-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1e2a" stopOpacity={0.05} />
          <stop offset="30%" stopColor="#3a1e2a" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#2a1420" stopOpacity={0.48} />
        </linearGradient>
      </defs>
      <g>
        {/* back building */}
        <rect x={-1600} y={180} width={5100} height={720} fill="url(#vhd-cy-wall)" />
        <rect x={-1600} y={180} width={5100} height={560} fill="url(#vhd-cy-brick)" opacity={0.28} />
        <DayWallWeathering />
        {/* cornice with dentils under the balcony (cream, as the exterior's mouldings) */}
        <rect x={-1600} y={262} width={5100} height={14} fill="#f2c89a" />
        {Array.from({ length: 256 }, (_, i) => (
          <rect key={`dn${i}`} x={-1596 + i * 20} y={276} width={11} height={9} fill="#d8a878" />
        ))}
        <rect x={-1600} y={285} width={5100} height={3} fill="#8a4a2a" opacity={0.45} />
        {/* balcony balustrade (cream balusters as the exterior terrace railing) */}
        <rect x={-1600} y={170} width={5100} height={14} fill="#f6d4a8" />
        <rect x={-1600} y={184} width={5100} height={14} fill="#e8b888" />
        {Array.from({ length: 122 }, (_, i) => (
          <g key={i}>
            <rect x={-1590 + i * 42} y={198} width={14} height={52} rx={6} fill="#f2c89a" />
            <rect x={-1590 + i * 42 + 9} y={200} width={5} height={48} rx={2.5} fill="#c8946a" opacity={0.6} />
          </g>
        ))}
        <rect x={-1600} y={248} width={5100} height={14} fill="#e8b888" />
        {/* the sky shows between the balusters only above the wall line: a plain back wall behind them */}
        {/* arches: rooms in shade, cream archivolts and capitals, brick pillars */}
        {arches.map((i) => {
          const ax = courtyardArchX(i);
          const isShrine = shrineArch !== false && i === shrineArch;
          return (
            <g key={i}>
              {!isShrine && (
                <g>
                  <path d={`M ${ax} 900 L ${ax} 470 Q ${ax + 110} 360 ${ax + 220} 470 L ${ax + 220} 900 Z`} fill="url(#vhd-cy-room)" />
                  {/* a hint of the room: a doorway further in, a hanging cloth, a niche */}
                  {i % 3 === 0 && <rect x={ax + 80} y={600} width={60} height={140} fill="#1a0e08" opacity={0.55} />}
                  {i % 3 === 2 && <path d={`M ${ax + 92} 640 L ${ax + 92} 600 Q ${ax + 110} 584 ${ax + 128} 600 L ${ax + 128} 640 Z`} fill="#140a06" opacity={0.6} />}
                  {/* daylight falling in on the floor just inside */}
                  <path d={`M ${ax + 6} 740 L ${ax + 214} 740 L ${ax + 200} 712 L ${ax + 20} 712 Z`} fill="#c89a6a" opacity={aft ? 0.12 : 0.22} />
                </g>
              )}
              {isShrine && <ShrineDoorDressing f={f} ax={ax} inShrine={inShrine} />}
              {/* inner reveal (wall thickness) */}
              <path d={`M ${ax} 740 L ${ax} 470 Q ${ax + 110} 360 ${ax + 220} 470 L ${ax + 206} 476 Q ${ax + 110} 384 ${ax + 14} 476 L ${ax + 14} 740 Z`} fill="#8a4a2a" opacity={0.55} />
              {/* moulded archivolt */}
              <path d={`M ${ax - 6} 472 Q ${ax + 110} 344 ${ax + 226} 472`} stroke="#f2c89a" strokeWidth={9} fill="none" />
              <path d={`M ${ax - 14} 474 Q ${ax + 110} 330 ${ax + 234} 474`} stroke="#9a5232" strokeWidth={2} fill="none" opacity={0.6} />
              <path d={`M ${ax + 100} 404 L ${ax + 120} 404 L ${ax + 124} 428 L ${ax + 96} 428 Z`} fill="#f6d4a8" stroke="#a8643a" strokeWidth={1.2} />
              {/* pillar */}
              <rect x={ax - 46} y={420} width={46} height={480} fill="#cc7a44" />
              <rect x={ax - 46} y={420} width={7} height={320} fill="#e8a878" opacity={0.75} />
              {[-34, -23, -12].map((dx) => (
                <line key={dx} x1={ax + dx} y1={440} x2={ax + dx} y2={700} stroke="#8a4a28" strokeWidth={2} opacity={0.5} />
              ))}
              <rect x={ax - 56} y={700} width={66} height={14} fill="#f2c89a" />
              <rect x={ax - 60} y={714} width={74} height={26} fill="#e2b484" />
              <rect x={ax - 54} y={410} width={62} height={20} fill="#f2c89a" />
              <rect x={ax - 58} y={402} width={70} height={9} fill="#f8dcb4" />
              <path d={`M ${ax - 54} 430 q -10 10 0 22 l 8 -2 q -6 -8 0 -16 Z`} fill="#d8a878" />
              <path d={`M ${ax + 8} 430 q 10 10 0 22 l -8 -2 q 6 -8 0 -16 Z`} fill="#d8a878" />
              {/* an unlit wall lamp bracket where Episode 1's lamps stood */}
              <rect x={ax - 32} y={512} width={18} height={6} fill="#a8783a" />
            </g>
          );
        })}
        {/* below the arcade floor line: the plinth face (shows only on upward tilts) */}
        <rect x={-1600} y={740} width={5100} height={160} fill="#c8946a" />
        <rect x={-1600} y={764} width={5100} height={136} fill="#a87450" />
        {/* light: morning sun on the facade from the upper left; afternoon the facade in soft shade, a warm rim on top */}
        {!aft && <rect x={-1600} y={170} width={5100} height={570} fill="#fff4d8" opacity={0.08} />}
        {aft && (
          <g>
            <rect x={-1600} y={196} width={5100} height={704} fill="url(#vhd-cy-aft-shade)" />
            <rect x={-1600} y={168} width={5100} height={5} fill="#ffe2a0" opacity={0.85} />
          </g>
        )}
        {far}
      </g>
    </Layer>
  );
};

/** Courtyard flagstones in perspective (Episode 1's pattern, day stone colours, extended for wide pans). */
const DayFlagstones: React.FC = () => {
  const Y0 = 784;
  const H = 916;
  const xAt = (x: number, y: number) => 960 + (x - 960) * lerp(0.55, 2.1, (y - Y0) / H);
  return (
    <g>
      <rect x={-2400} y={Y0} width={6800} height={H} fill="url(#vhd-cy-floor)" />
      {Array.from({ length: 10 }, (_, r) => {
        const y = Y0 + Math.pow(r / 10, 1.6) * H;
        return <line key={`h${r}`} x1={-2400} y1={y} x2={4400} y2={y} stroke="#7e6a54" strokeWidth={2} opacity={0.6} />;
      })}
      {Array.from({ length: 44 }, (_, i) => {
        const x = -1900 + i * 130;
        return <line key={`v${i}`} x1={xAt(x, Y0)} y1={Y0} x2={xAt(x, Y0 + H)} y2={Y0 + H} stroke="#7e6a54" strokeWidth={2} opacity={0.5} />;
      })}
      {Array.from({ length: 50 }, (_, i) => {
        const r = Math.floor(hs(i * 3.7) * 9);
        const c = Math.floor(hs(i * 5.3) * 40);
        const y0 = Y0 + Math.pow(r / 10, 1.6) * H;
        const y1 = Y0 + Math.pow((r + 1) / 10, 1.6) * H;
        const xa = -1900 + c * 130;
        const xb = xa + 130;
        return (
          <path
            key={`ws${i}`}
            d={`M ${xAt(xa, y0)} ${y0} L ${xAt(xb, y0)} ${y0} L ${xAt(xb, y1)} ${y1} L ${xAt(xa, y1)} ${y1} Z`}
            fill={hs(i * 7.1) > 0.5 ? "#d8c4a4" : "#8e7a62"}
            opacity={0.18 + hs(i * 9.3) * 0.2}
          />
        );
      })}
      <ellipse cx={960} cy={1000} rx={760} ry={160} fill="#e8d6b8" opacity={0.12} />
    </g>
  );
};

export interface CourtyardFloorProps {
  f: number;
  time?: CourtyardTime;
  tulsi?: boolean | { x: number; y: number; s?: number };
  shrineArch?: number | false;
  shrineDhoop?: boolean;
  /** shadow band of the near wing (morning), its edge y at x = 960 (default 900); ignored in the afternoon. */
  shadowY?: number;
  children?: React.ReactNode;
}

export const VedicCourtyardFloorLayer: React.FC<CourtyardFloorProps> = ({ f, time = "morning", tulsi = true, shrineArch = false, shrineDhoop = false, shadowY = 900, children }) => {
  const aft = time === "afternoon";
  const t = tulsi === true ? VEDIC_COURTYARD.TULSI : tulsi || null;
  const P = VEDIC_COURTYARD.PLINTH;
  // shadow edge: the near wing's balustrade (morning, across the near floor) or the far wing's (afternoon, far floor)
  /** points of a balustrade-patterned shadow edge, left to right: square posts every 42 px (as the balusters) */
  const balEdge = (y: number, dir: 1 | -1, amp: number) => {
    const pts: string[] = [];
    for (let x = -2400; x <= 4400; x += 42) {
      const yy = (xx: number) => y + (xx - 960) * 0.02;
      pts.push(`${x} ${n1(yy(x))}`, `${x} ${n1(yy(x) + dir * amp)}`, `${x + 15} ${n1(yy(x) + dir * amp)}`, `${x + 15} ${n1(yy(x))}`);
    }
    return pts;
  };
  const L = (pts: string[]) => pts.join(" L ");
  return (
    <Layer depth={0.8}>
      <VhdDefs />
      <GlowDefs />
      <defs>
        <linearGradient id="vhd-cy-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4ae8e" />
          <stop offset="100%" stopColor="#9c866a" />
        </linearGradient>
      </defs>
      {/* far plinth: the front of the far wing's veranda (tread and riser, as Episode 1's) */}
      <rect x={-2400} y={734} width={6800} height={8} fill="#8a5a3a" opacity={0.55} />
      <rect x={-2400} y={P.top} width={6800} height={P.riser - P.top} fill="#e2c4a0" />
      <rect x={-2400} y={P.top} width={6800} height={3} fill="#fbe6c8" opacity={0.8} />
      <rect x={-2400} y={P.riser} width={6800} height={P.ground - P.riser} fill="#b8865e" />
      <DayFlagstones />
      <rect x={-2400} y={P.ground} width={6800} height={14} fill="#3a2414" opacity={0.18} />
      {/* faded alpona from the last festival */}
      <g transform="translate(960, 930) scale(1.5, 0.42)" opacity={0.42}>
        <circle r={190} fill="none" stroke="#fffaf0" strokeWidth={6} strokeDasharray="16 12" />
        <circle r={140} fill="none" stroke="#c8402e" strokeWidth={5} />
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx={0} cy={-88} rx={22} ry={46} fill="none" stroke="#fffaf0" strokeWidth={5} transform={`rotate(${i * 30})`} />
        ))}
      </g>
      {/* the shrine door's lamplight on the plinth, and the dhoop left by the door */}
      {shrineArch !== false && (
        <g>
          <ellipse cx={courtyardArchX(shrineArch) + 110} cy={752} rx={120} ry={14} fill="url(#vhd-lamp-wash)" opacity={0.7} />
          {shrineDhoop && <DhoopDani x={courtyardArchX(shrineArch) + 236} y={756} s={0.5} f={f} />}
        </g>
      )}
      {/* sun and shade */}
      <filter id="vhd-cy-softshadow" x="-5%" y="-20%" width="110%" height="140%">
        <feGaussianBlur stdDeviation={3.5} />
      </filter>
      {!aft ? (
        <g filter="url(#vhd-cy-softshadow)">
          <path d={`M -2400 ${P.ground} L 4400 ${P.ground} L ${L(balEdge(shadowY, -1, 26).reverse())} Z`} fill="#fff2cc" opacity={0.13} />
          <path d={`M ${L(balEdge(shadowY, -1, 26))} L 4400 1700 L -2400 1700 Z`} fill="#2a2a48" opacity={0.26} />
        </g>
      ) : (
        <g filter="url(#vhd-cy-softshadow)">
          <path d={`M -2400 ${P.top} L 4400 ${P.top} L ${L(balEdge(880, 1, 22).reverse())} Z`} fill="#3a2440" opacity={0.36} />
          <path d={`M ${L(balEdge(880, 1, 22))} L 4400 1700 L -2400 1700 Z`} fill="#ffc060" opacity={0.24} />
        </g>
      )}
      {t && <TulsiMancha x={t.x} y={t.y} f={f} s={t.s ?? 1.1} />}
      {t && <ellipse cx={t.x + (aft ? -60 : 70)} cy={t.y + 6} rx={140 * (t.s ?? 1.1)} ry={14} fill="#1a0c06" opacity={0.22} />}
      {children}
    </Layer>
  );
};

export const VedicNearVerandaLayer: React.FC<{ f: number; time?: CourtyardTime; lip?: number; children?: React.ReactNode }> = ({ f, time = "morning", lip = 920, children }) => {
  const aft = time === "afternoon";
  return (
    <Layer depth={1}>
      <VhdDefs />
      <GlowDefs />
      <defs>
        <linearGradient id="vhd-ver-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={aft ? "#a8472a" : "#9a3c24"} />
          <stop offset="35%" stopColor="#7a2c1a" />
          <stop offset="100%" stopColor="#4a1a10" />
        </linearGradient>
      </defs>
      <rect x={-2800} y={lip} width={7600} height={1900 - lip} fill="url(#vhd-ver-floor)" />
      {/* bullnose edge catching the courtyard light */}
      <rect x={-2800} y={lip} width={7600} height={5} fill="#e6a080" opacity={0.75} />
      <rect x={-2800} y={lip + 5} width={7600} height={3} fill="#3a1208" opacity={0.4} />
      {/* the polished floor reflects the bright courtyard near the edge */}
      <rect x={-2800} y={lip + 8} width={7600} height={46} fill="#ffd8b0" opacity={0.08} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={-1800 + i * 640 + 40 * Math.sin(f * 0.004 + i)} y={lip + 14} width={180} height={4} rx={2} fill="#ffe8c8" opacity={0.08} />
      ))}
      {/* faint joints of the red-oxide screed */}
      {Array.from({ length: 4 }, (_, r) => (
        <line key={r} x1={-2800} y1={lip + 70 + r * r * 50} x2={4800} y2={lip + 70 + r * r * 50} stroke="#3a1208" strokeWidth={1.5} opacity={0.2} />
      ))}
      {children}
    </Layer>
  );
};

export const VedicCourtyardForegroundLayer: React.FC<{ f: number; time?: CourtyardTime; nearPillars?: number[] }> = ({ time = "morning", nearPillars = [] }) =>
  nearPillars.length ? (
    <Layer depth={1.3} extraBlur={4}>
      {nearPillars.map((x) => (
        <g key={x}>
          <rect x={x - 70} y={-600} width={140} height={2600} fill={time === "afternoon" ? "#8a4a2a" : "#7a4228"} />
          <rect x={x - 70} y={-600} width={14} height={2600} fill="#c8845a" opacity={0.6} />
          <rect x={x + 50} y={-600} width={20} height={2600} fill="#3a1a0c" opacity={0.4} />
        </g>
      ))}
    </Layer>
  ) : null;

export interface VedicCourtyardDayProps {
  f: number;
  time?: CourtyardTime;
  cam?: Cam;
  calm?: number;
  nearVeranda?: boolean | { lip?: number };
  tulsi?: boolean | { x: number; y: number; s?: number };
  shrineArch?: number | false;
  shrineDhoop?: boolean;
  inShrine?: React.ReactNode;
  far?: React.ReactNode;
  yard?: React.ReactNode;
  floor?: React.ReactNode;
  nearPillars?: number[];
  grade?: boolean;
}

/** The whole day courtyard in plane order with the time's Grade. */
export const VedicCourtyardDay: React.FC<VedicCourtyardDayProps> = ({
  f,
  time = "morning",
  cam,
  calm = 1,
  nearVeranda = false,
  tulsi = true,
  shrineArch = false,
  shrineDhoop = false,
  inShrine,
  far,
  yard,
  floor,
  nearPillars = [],
  grade = true,
}) => {
  const lip = typeof nearVeranda === "object" ? nearVeranda.lip ?? VEDIC_COURTYARD.VERANDA_LIP : VEDIC_COURTYARD.VERANDA_LIP;
  return (
    <>
      <div style={calmStyle(calm, 0.6)}>
        <VedicCourtyardSkyLayer f={f} time={time} cam={cam} calm={calm} />
        <VedicCourtyardBackLayer f={f} time={time} cam={cam} calm={calm} shrineArch={shrineArch} inShrine={inShrine} far={far} />
      </div>
      <VedicCourtyardFloorLayer f={f} time={time} tulsi={tulsi} shrineArch={shrineArch} shrineDhoop={shrineDhoop}>
        {yard}
      </VedicCourtyardFloorLayer>
      {nearVeranda ? (
        <VedicNearVerandaLayer f={f} time={time} lip={lip}>
          {floor}
        </VedicNearVerandaLayer>
      ) : (
        floor && <Layer depth={1}>{floor}</Layer>
      )}
      <VedicCourtyardForegroundLayer f={f} time={time} nearPillars={nearPillars} />
      {grade && <Grade {...vedicCourtyardGrade(time)} />}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 3. THE SHRINE ROOM (ThakurGhar) INTERIOR                             */
/* ------------------------------------------------------------------ */

export const KHAT = { x: 1540, y: 822, s: 1 } as const;

export const THAKURGHAR = {
  PLANES: { wall: 0.9, floor: 1, foreground: 1.3 },
  WALL_BASE: 800,
  KHAT,
  /** the veranda door in the left wall (plane 1): opening corners, the threshold line from (30, 921) to (240, 836) */
  DOOR: { x0: 30, x1: 240, top0: 241, top1: 266, bottom0: 921, bottom1: 836 },
  PROPS: {
    asana: { x: 850, y: 935 },
    bell: { x: 985, y: 965 },
    kosha: { x: 1015, y: 905 },
    plate: { x: 1100, y: 902 },
    conch: { x: 1196, y: 884 },
    bowl: { x: 1135, y: 985 },
    coconutA: { x: 1262, y: 952 },
    coconutB: { x: 1300, y: 982 },
    lamp: { x: 1238, y: 846 },
    ghot: { x: 1360, y: 878 },
    dhoop: { x: 1050, y: 870 },
  },
  SPOTS: {
    priest: { x: 850, y: 940, s: 1 },
    balakInside: { x: 1330, y: 1010, s: 1.3 },
    threshold: { x: 150, y: 900, s: 1.3 },
  },
  WALL_X: [-1400, 3300] as const,
  FLOOR_BOTTOM: 1900,
  TOP: -700,
} as const;

export interface RiteShow {
  bowl?: false | { level?: number; fopra?: boolean };
  coconuts?: boolean;
  conch?: boolean;
  bell?: boolean;
  kosha?: boolean;
  plate?: boolean;
  ghot?: boolean;
  lamp?: boolean;
  dhoop?: boolean | { x: number; y: number };
  asana?: boolean;
}

export const thakurGharKeepInSet = <C extends Cam>(c: C): C =>
  keepInSet(
    c,
    [
      { d: 0.9, x0: THAKURGHAR.WALL_X[0], x1: THAKURGHAR.WALL_X[1], y0: THAKURGHAR.TOP },
      { d: 1, x0: THAKURGHAR.WALL_X[0], x1: THAKURGHAR.WALL_X[1], y1: THAKURGHAR.FLOOR_BOTTOM },
    ],
    [{ back: 0.9, front: 1, frontTop: THAKURGHAR.WALL_BASE, backBottom: 1000 }],
  );

export const thakurGharGrade = (): React.ComponentProps<typeof Grade> => ({ warmth: 0.5, vignette: 0.58, grain: 0.045, bloomAt: [70, 44] });

/** The back wall (0.9 plane): whitewash in lamplight, red-oxide dado, kodi-borga beams, a niche, a shelf of vessels. */
const ThakurGharWall: React.FC<{ f: number }> = ({ f }) => {
  const fl = flicker(f, 7);
  return (
    <g>
      <defs>
        <linearGradient id="vhd-tg-wall" gradientUnits="userSpaceOnUse" x1={0} y1={60} x2={0} y2={660}>
          <stop offset="0%" stopColor="#a88a64" />
          <stop offset="45%" stopColor="#dcc6a0" />
          <stop offset="100%" stopColor="#e8d4ae" />
        </linearGradient>
        <radialGradient id="vhd-tg-warm" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffd890" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#ffb060" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-1500} y={-800} width={4900} height={1900} fill="url(#vhd-tg-wall)" />
      {/* lime-wash texture */}
      {Array.from({ length: 22 }, (_, i) => (
        <ellipse key={i} cx={-1200 + hs(i) * 4400} cy={150 + hs(i * 3) * 420} rx={60 + hs(i * 5) * 140} ry={24 + hs(i * 7) * 50} fill="#8a6a44" opacity={0.1} />
      ))}
      {/* lamp warmth on the wall (beside the khat and by the tall lamp, never centred behind a deity) */}
      <ellipse cx={1150} cy={560} rx={430} ry={330} fill="url(#vhd-tg-warm)" opacity={0.9 * fl} />
      <ellipse cx={1880} cy={620} rx={300} ry={240} fill="url(#vhd-tg-warm)" opacity={0.55 * fl} />
      {/* ceiling: kodi-borga (beams and rafters) */}
      <rect x={-1500} y={-800} width={4900} height={860} fill="#3a2414" />
      {Array.from({ length: 64 }, (_, i) => (
        <rect key={i} x={-1480 + i * 78} y={-800} width={22} height={860} fill="#4e321c" />
      ))}
      <rect x={-1500} y={40} width={4900} height={28} fill="#5a3a20" />
      <rect x={-1500} y={66} width={4900} height={10} fill="#2a1a0e" opacity={0.5} />
      {/* a little wall niche (kulungi) with a pradip, left of the khat */}
      <path d="M 640 470 L 640 380 Q 700 330 760 380 L 760 470 Z" fill="#6a4a2a" />
      <path d="M 646 470 L 646 384 Q 700 340 754 384 L 754 470 Z" fill="#3a2414" />
      <rect x={632} y={468} width={136} height={10} fill="#c8a878" />
      <BrassLamp x={700} y={468} s={0.7} f={f} kind="pradip" seed={17} />
      {/* a wooden shelf of copper and brass vessels */}
      <rect x={300} y={430} width={230} height={12} fill="#5a3418" />
      {[[330, "url(#vhd-copper)"], [390, "url(#vhd-brass)"], [452, "url(#vhd-copper)"], [500, "url(#vhd-brass)"]].map(([vx, fill], i) => (
        <g key={i}>
          <ellipse cx={vx as number} cy={410} rx={20 - (i % 2) * 5} ry={20} fill={fill as string} />
          <rect x={(vx as number) - 8} y={384} width={16} height={8} fill="#8a5a24" />
        </g>
      ))}
      {/* a second niche, right of the khat, with a copper pot */}
      <path d="M 2020 470 L 2020 390 Q 2070 348 2120 390 L 2120 470 Z" fill="#6a4a2a" />
      <path d="M 2026 470 L 2026 394 Q 2070 358 2114 394 L 2114 470 Z" fill="#3a2414" />
      <rect x={2012} y={468} width={116} height={9} fill="#c8a878" />
      <ellipse cx={2070} cy={462} rx={16} ry={8} fill="url(#vhd-copper)" />
      {/* painted lotus border on the wall above the dado */}
      <rect x={-1500} y={630} width={4900} height={10} fill="#c8902e" opacity={0.7} />
      {Array.from({ length: 70 }, (_, i) => (
        <path key={i} d={`M ${-1480 + i * 70} 630 q 12 -22 24 0 q -12 -8 -24 0 Z`} fill="#b8402a" opacity={0.55} />
      ))}
      {/* red-oxide dado */}
      <rect x={-1500} y={640} width={4900} height={460} fill="#8a3420" />
      <rect x={-1500} y={640} width={4900} height={4} fill="#b85a3a" />
      <rect x={-1500} y={640} width={4900} height={160} fill="#2a0c06" opacity={0.08} />
    </g>
  );
};

/** The floor (plane 1) and the left wall with the veranda door; the daylight falling in. */
const ThakurGharFloor: React.FC<{ f: number; daylight: number }> = ({ f, daylight }) => {
  const D = THAKURGHAR.DOOR;
  return (
    <g>
      <defs>
        <linearGradient id="vhd-tg-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a2616" />
          <stop offset="40%" stopColor="#8a3420" />
          <stop offset="100%" stopColor="#4a180c" />
        </linearGradient>
        <linearGradient id="vhd-tg-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a7458" />
          <stop offset="100%" stopColor="#c8b08a" />
        </linearGradient>
        <linearGradient id="vhd-tg-out" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6e2" />
          <stop offset="55%" stopColor="#ffe8c0" />
          <stop offset="100%" stopColor="#e8c8a0" />
        </linearGradient>
        <linearGradient id="vhd-tg-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff2d0" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#fff2d0" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* floor: polished red oxide */}
      <rect x={-1500} y={THAKURGHAR.WALL_BASE} width={4900} height={1100} fill="url(#vhd-tg-floor)" />
      <rect x={-1500} y={THAKURGHAR.WALL_BASE} width={4900} height={6} fill="#2a0c06" opacity={0.45} />
      {/* reflections of the lamps on the polished floor */}
      {[[1238, 0.5], [1328, 0.3], [1752, 0.3]].map(([lx, o], i) => (
        <ellipse key={i} cx={lx as number} cy={880 + i * 4} rx={16} ry={70} fill="#ffc870" opacity={(o as number) * 0.5 * flicker(f, 40 + i)} />
      ))}
      {/* daylight from the door across the floor */}
      <path d={`M ${D.x0} ${D.bottom0} L ${D.x1} ${D.bottom1} L 900 ${D.bottom1 + 70} L 760 1060 Z`} fill="url(#vhd-tg-beam)" opacity={daylight} />
      {/* the left wall in perspective (vanishing toward the khat) */}
      <path d={`M 330 30 L -1500 -640 L -1500 1560 L 330 800 Z`} fill="url(#vhd-tg-side)" />
      <path d={`M 330 640 L -1500 1180 L -1500 1560 L 330 800 Z`} fill="#7a2c1a" />
      <path d={`M 330 30 L 330 800`} stroke="#5a4028" strokeWidth={4} opacity={0.6} />
      <path d={`M 330 30 L -1500 -640 L -1500 -700 L 330 0 Z`} fill="#3a2414" />
      {/* the door: daylight outside, the veranda floor and a pillar beyond */}
      <path d={`M ${D.x0} ${D.top0} L ${D.x1} ${D.top1} L ${D.x1} ${D.bottom1} L ${D.x0} ${D.bottom0} Z`} fill="url(#vhd-tg-out)" opacity={0.6 + 0.4 * daylight} />
      <path d={`M ${D.x0} ${D.bottom0 - 70} L ${D.x1} ${D.bottom1 - 40} L ${D.x1} ${D.bottom1} L ${D.x0} ${D.bottom0} Z`} fill="#c8805a" opacity={0.55} />
      <path d={`M ${D.x0 + 120} ${D.top0 + 30} L ${D.x0 + 150} ${D.top0 + 34} L ${D.x0 + 150} ${D.bottom0 - 60} L ${D.x0 + 120} ${D.bottom0 - 50} Z`} fill="#d8a070" opacity={0.6} />
      {/* door frame (teak) and the folded leaf */}
      <path d={`M ${D.x0} ${D.bottom0} L ${D.x0} ${D.top0} L ${D.x1} ${D.top1} L ${D.x1} ${D.bottom1}`} stroke="#4a2810" strokeWidth={12} fill="none" />
      <path d={`M ${D.x0 - 8} ${D.top0 - 10} L ${D.x1 + 8} ${D.top1 - 6}`} stroke="#5a3418" strokeWidth={8} />
      <path d={`M ${D.x1 + 6} ${D.top1 + 8} L ${D.x1 + 64} ${D.top1 + 20} L ${D.x1 + 64} ${D.bottom1 - 18} L ${D.x1 + 6} ${D.bottom1} Z`} fill="#5a3016" />
      <path d={`M ${D.x1 + 16} ${D.top1 + 40} L ${D.x1 + 54} ${D.top1 + 48} L ${D.x1 + 54} ${D.top1 + 260} L ${D.x1 + 16} ${D.top1 + 256} Z`} fill="none" stroke="#2a1608" strokeWidth={2} />
      {/* threshold */}
      <path d={`M ${D.x0 - 6} ${D.bottom0 + 2} L ${D.x1 + 6} ${D.bottom1 + 2} L ${D.x1 + 6} ${D.bottom1 + 14} L ${D.x0 - 6} ${D.bottom0 + 16} Z`} fill="#6a3a1a" />
      {/* daylight on the door's inner jamb */}
      <path d={`M ${D.x1 - 6} ${D.top1 + 4} L ${D.x1} ${D.top1 + 4} L ${D.x1} ${D.bottom1} L ${D.x1 - 6} ${D.bottom1} Z`} fill="#ffe6b8" opacity={0.6 * daylight} />
    </g>
  );
};

/** The priest's kusha asana (drawn under the priest). */
const KushaAsana: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <ellipse cx={x} cy={y} rx={92} ry={20} fill="#b8a050" />
    {Array.from({ length: 12 }, (_, i) => (
      <line key={i} x1={x - 84 + i * 15} y1={y - 14} x2={x - 88 + i * 15.5} y2={y + 14} stroke="#8a7438" strokeWidth={2} opacity={0.6} />
    ))}
  </g>
);

/** The rite laid out on the floor before the khat (plane 1). */
const RiteSetup: React.FC<{ f: number; show: RiteShow }> = ({ f, show }) => {
  const P = THAKURGHAR.PROPS;
  const on = (v: unknown) => v !== false;
  const bowl = show.bowl === undefined ? {} : show.bowl;
  const dh = show.dhoop === true ? P.dhoop : show.dhoop || null;
  return (
    <g>
      {on(show.ghot) && <MangalGhot x={P.ghot.x} y={P.ghot.y} s={1} />}
      {on(show.lamp) && <BrassLamp x={P.lamp.x} y={P.lamp.y} s={1} f={f} kind="pilsuj" seed={5} />}
      {on(show.conch) && <Conch x={P.conch.x} y={P.conch.y} s={1.15} />}
      {on(show.kosha) && <KoshaKushi x={P.kosha.x} y={P.kosha.y} s={1} />}
      {on(show.plate) && <FlowerPlate x={P.plate.x} y={P.plate.y} s={1} />}
      {dh && <DhoopDani x={dh.x} y={dh.y} s={0.9} f={f} />}
      {on(show.coconuts) && (
        <g>
          <GreenCoconut x={P.coconutA.x} y={P.coconutA.y} s={0.95} rot={-75} />
          <GreenCoconut x={P.coconutB.x} y={P.coconutB.y} s={0.95} rot={68} />
        </g>
      )}
      {on(show.bell) && <BrassBell x={P.bell.x} y={P.bell.y} s={1} />}
      {bowl && <StoneBowl x={P.bowl.x} y={P.bowl.y} s={1} level={bowl.level ?? 1} fopra={bowl.fopra ?? true} />}
    </g>
  );
};

export interface ThakurGharProps {
  f: number;
  show?: RiteShow;
  daylight?: number;
  behind?: React.ReactNode;
  front?: React.ReactNode;
  foreground?: boolean;
  cam?: Cam;
  calm?: number;
  grade?: boolean;
}

/** The family shrine room, in plane order, with its Grade. */
export const ThakurGhar: React.FC<ThakurGharProps> = ({ f, show = {}, daylight = 1, behind, front, foreground = true, cam, calm = 1, grade = true }) => (
  <>
    <div style={calmStyle(calm, 0.5)}>
      <Layer depth={0.9} extraBlur={bgBlur(0.9, calm, cam)}>
        <VhdDefs />
        <GlowDefs />
        <ThakurGharWall f={f} />
      </Layer>
    </div>
    <Layer depth={1}>
      <VhdDefs />
      <GlowDefs />
      <ThakurGharFloor f={f} daylight={daylight} />
      <KhatThrone x={KHAT.x} y={KHAT.y} s={KHAT.s} f={f} />
      {/* a hanging brass bell over the khat's corner */}
      <g transform={`rotate(${Math.sin(f * 0.03) * 1.5}, 1830, 70)`}>
        <line x1={1830} y1={70} x2={1830} y2={250} stroke="#5a3a1a" strokeWidth={2} />
        <BrassBell x={1830} y={300} s={0.9} />
      </g>
      {show.asana !== false && <KushaAsana x={THAKURGHAR.PROPS.asana.x} y={THAKURGHAR.PROPS.asana.y} />}
      {behind}
      <RiteSetup f={f} show={show} />
      {front}
    </Layer>
    {foreground && (
      <Layer depth={1.3} extraBlur={5}>
        <Garland x1={-400} y1={-30} x2={500} y2={-30} sag={90} s={2.2} f={f} seed={7} />
        <Garland x1={1500} y1={-30} x2={2400} y2={-30} sag={90} s={2.2} f={f} seed={9} />
      </Layer>
    )}
    {grade && <Grade {...thakurGharGrade()} />}
  </>
);

/* ------------------------------------------------------------------ */
/* 2. THE SHRINE DOOR FROM THE VERANDA                                  */
/* ------------------------------------------------------------------ */

export const VERANDA = {
  PLANES: { inside: 0.9, wall: 1, foreground: 1.3 },
  DOOR: { x0: 800, x1: 1120, cx: 960, springY: 420, apexY: 296, threshold: 845 },
  FLOOR: { top: 870, edge: 1010, riser: 1062 },
  DHOOP: { x: 690, y: 912 },
  SPOTS: {
    balak: { x: 560, y: 960, s: 1.3 },
    threshold: { x: 900, y: 905, s: 1.3 },
    priestInside: { x: 1010, y: 818, s: 0.62 },
  },
  WALL_X: [-1500, 3400] as const,
  TOP: -500,
  BOTTOM: 1900,
} as const;

export const vedicVerandaKeepInSet = <C extends Cam>(c: C): C =>
  keepInSet(c, [
    { d: 0.9, x0: VERANDA.WALL_X[0], x1: VERANDA.WALL_X[1] },
    { d: 1, x0: VERANDA.WALL_X[0], x1: VERANDA.WALL_X[1], y0: VERANDA.TOP, y1: VERANDA.BOTTOM },
  ], []);

export const vedicVerandaGrade = (): React.ComponentProps<typeof Grade> => ({ warmth: 0.38, vignette: 0.5, grain: 0.04, bloomAt: [50, 52] });

/** The room seen through the door (0.9 plane): the khat straight ahead, the rite on the floor, lamplight. */
const ShrineRoomView: React.FC<{ f: number; show: RiteShow; inside?: React.ReactNode }> = ({ f, show, inside }) => (
  <g>
    <g transform="translate(960, 300) scale(0.62) translate(-1300, -300)">
      <ThakurGharWall f={f} />
      <rect x={-1500} y={800} width={4900} height={1200} fill="#7a2c1a" />
      <rect x={-1500} y={800} width={4900} height={6} fill="#2a0c06" opacity={0.4} />
      <KhatThrone x={1420} y={840} s={1} f={f} />
    </g>
    {inside}
    <g transform="translate(960, 300) scale(0.62) translate(-1300, -300)">
      <g transform="translate(-60, 70)">
        <RiteSetup f={f} show={{ ...show, asana: false }} />
      </g>
    </g>
  </g>
);

export interface VedicShrineVerandaProps {
  f: number;
  time?: CourtyardTime;
  dhoop?: boolean | { x: number; y: number; smoke?: number };
  pillar?: boolean;
  inside?: React.ReactNode;
  insideProps?: RiteShow;
  floor?: React.ReactNode;
  cam?: Cam;
  calm?: number;
  grade?: boolean;
}

export const VedicShrineVeranda: React.FC<VedicShrineVerandaProps> = ({
  f,
  time = "morning",
  dhoop = true,
  pillar = true,
  inside,
  insideProps = {},
  floor,
  cam,
  calm = 1,
  grade = true,
}) => {
  const D = VERANDA.DOOR;
  const F = VERANDA.FLOOR;
  const aft = time === "afternoon";
  const dh = dhoop === true ? { ...VERANDA.DHOOP, smoke: 1 } : dhoop || null;
  const door = `M ${D.x0} ${D.threshold} L ${D.x0} ${D.springY} Q ${D.x0} ${D.apexY} ${D.cx} ${D.apexY} Q ${D.x1} ${D.apexY} ${D.x1} ${D.springY} L ${D.x1} ${D.threshold} Z`;
  const fl = flicker(f, 3);
  return (
    <>
      <div style={calmStyle(calm, 0.4)}>
        <Layer depth={0.9} extraBlur={bgBlur(0.9, calm, cam) + 0.6}>
          <VhdDefs />
          <GlowDefs />
          <rect x={-1500} y={-600} width={4900} height={2600} fill="#4a2a16" />
          <ShrineRoomView f={f} show={insideProps} inside={inside} />
        </Layer>
      </div>
      <Layer depth={1}>
        <VhdDefs />
        <GlowDefs />
        <defs>
          <linearGradient id="vhd-vr-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5236" />
            <stop offset="40%" stopColor="#c07a4e" />
            <stop offset="100%" stopColor="#b8724a" />
          </linearGradient>
          <linearGradient id="vhd-vr-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6a2616" />
            <stop offset="100%" stopColor="#9a3e26" />
          </linearGradient>
          <linearGradient id="vhd-vr-yard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8c4a2" />
            <stop offset="100%" stopColor="#b8a282" />
          </linearGradient>
          <radialGradient id="vhd-vr-spill" cx="0.5" cy="0" r="0.8">
            <stop offset="0%" stopColor="#ffcf80" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ffb060" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* the wall, with the door cut out */}
        <path d={`M -1600 -600 L 3500 -600 L 3500 ${F.top} L -1600 ${F.top} Z ${door}`} fill="url(#vhd-vr-wall)" fillRule="evenodd" />
        <path d={`M -1600 -600 L 3500 -600 L 3500 ${F.top} L -1600 ${F.top} Z ${door}`} fill="url(#vhd-cy-brick2)" fillRule="evenodd" opacity={0.22} />
        <defs>
          <pattern id="vhd-cy-brick2" width={48} height={24} patternUnits="userSpaceOnUse">
            <path d="M 0 0 H 48 M 0 12 H 48 M 12 0 V 12 M 36 12 V 24" stroke="#8a4a2a" strokeWidth={1.2} />
          </pattern>
        </defs>
        {/* veranda ceiling beams and the cornice */}
        <rect x={-1600} y={-600} width={5100} height={640} fill="#3e2616" />
        {Array.from({ length: 34 }, (_, i) => (
          <rect key={i} x={-1590 + i * 150} y={-600} width={34} height={640} fill="#55361e" />
        ))}
        <rect x={-1600} y={30} width={5100} height={22} fill="#f2c89a" />
        <rect x={-1600} y={52} width={5100} height={6} fill="#8a4a2a" opacity={0.5} />
        {/* red-oxide dado */}
        {/* (cut at the doorway, so the opening and the room show down to the threshold) */}
        {[
          [-1600, D.x0],
          [D.x1, 3500],
        ].map(([a, b]) => (
          <g key={a}>
            <rect x={a} y={770} width={b - a} height={F.top - 770} fill="#8a3420" />
            <rect x={a} y={770} width={b - a} height={4} fill="#c06a48" />
          </g>
        ))}
        {/* the door: reveal, carved teak frame, folded leaves, curtain, threshold, toran */}
        <path d={`M ${D.x0} ${D.threshold} L ${D.x0} ${D.springY} Q ${D.x0} ${D.apexY} ${D.cx} ${D.apexY} Q ${D.x1} ${D.apexY} ${D.x1} ${D.springY} L ${D.x1} ${D.threshold} L ${D.x1 - 22} ${D.threshold} L ${D.x1 - 22} ${D.springY + 6} Q ${D.x1 - 24} ${D.apexY + 22} ${D.cx} ${D.apexY + 22} Q ${D.x0 + 24} ${D.apexY + 22} ${D.x0 + 22} ${D.springY + 6} L ${D.x0 + 22} ${D.threshold} Z`} fill="#6a3a22" opacity={0.85} />
        <path d={`M ${D.x0 - 8} ${D.threshold} L ${D.x0 - 8} ${D.springY} Q ${D.x0 - 8} ${D.apexY - 10} ${D.cx} ${D.apexY - 10} Q ${D.x1 + 8} ${D.apexY - 10} ${D.x1 + 8} ${D.springY} L ${D.x1 + 8} ${D.threshold}`} stroke="#4a2810" strokeWidth={16} fill="none" />
        <path d={`M ${D.x0 - 20} ${D.threshold} L ${D.x0 - 20} ${D.springY} Q ${D.x0 - 20} ${D.apexY - 24} ${D.cx} ${D.apexY - 24} Q ${D.x1 + 20} ${D.apexY - 24} ${D.x1 + 20} ${D.springY} L ${D.x1 + 20} ${D.threshold}`} stroke="#f2c89a" strokeWidth={8} fill="none" />
        {Array.from({ length: 15 }, (_, i) => {
          const y = D.springY + 20 + i * 28;
          return y < D.threshold - 10 ? (
            <g key={i}>
              <circle cx={D.x0 - 8} cy={y} r={2.2} fill="#d8a84a" />
              <circle cx={D.x1 + 8} cy={y} r={2.2} fill="#d8a84a" />
            </g>
          ) : null;
        })}
        {[D.x0 + 2, D.x1 - 30].map((x) => (
          <g key={x}>
            <rect x={x} y={D.springY + 10} width={28} height={D.threshold - D.springY - 12} fill="#4a2810" />
            <rect x={x + 4} y={D.springY + 40} width={20} height={120} fill="none" stroke="#2a1608" strokeWidth={1.6} />
            <rect x={x + 4} y={D.springY + 190} width={20} height={160} fill="none" stroke="#2a1608" strokeWidth={1.6} />
          </g>
        ))}
        {/* maroon curtain tied back on the left */}
        <path d={`M ${D.x0 + 4} ${D.springY - 50} Q ${D.x0 + 90} ${D.springY - 70} ${D.x0 + 150} ${D.springY - 40} Q ${D.x0 + 100} ${D.springY + 110} ${D.x0 + 62} ${D.springY + 190} Q ${D.x0 + 74} ${D.springY + 300} ${D.x0 + 34} ${D.threshold} L ${D.x0 + 4} ${D.threshold} Z`} fill="#7a1a1e" />
        <path d={`M ${D.x0 + 30} ${D.springY - 40} Q ${D.x0 + 60} ${D.springY + 80} ${D.x0 + 44} ${D.springY + 190} M ${D.x0 + 70} ${D.springY - 50} Q ${D.x0 + 86} ${D.springY + 60} ${D.x0 + 60} ${D.springY + 186} M ${D.x0 + 50} ${D.springY + 200} Q ${D.x0 + 58} ${D.springY + 300} ${D.x0 + 24} ${D.threshold - 4}`} stroke="#4a0a0e" strokeWidth={3} fill="none" opacity={0.7} />
        <path d={`M ${D.x0 + 40} ${D.springY + 186} Q ${D.x0 + 60} ${D.springY + 196} ${D.x0 + 76} ${D.springY + 190}`} stroke="#e0b050" strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d={`M ${D.x0 + 4} ${D.springY - 50} Q ${D.x0 + 90} ${D.springY - 70} ${D.x0 + 150} ${D.springY - 40}`} stroke="#c8902e" strokeWidth={4} fill="none" />
        {/* threshold sill */}
        <rect x={D.x0 - 16} y={D.threshold} width={D.x1 - D.x0 + 32} height={F.top - D.threshold + 4} fill="#6a3a1a" />
        <rect x={D.x0 - 16} y={D.threshold} width={D.x1 - D.x0 + 32} height={4} fill="#b07a42" />
        {/* lamplight spilling out over the threshold */}
        <ellipse cx={D.cx} cy={F.top + 6} rx={240} ry={44} fill="url(#vhd-vr-spill)" opacity={0.45 * fl} />
        {/* mango-leaf toran */}
        {Array.from({ length: 19 }, (_, i) => {
          const x = D.x0 - 10 + i * ((D.x1 - D.x0 + 20) / 18);
          const y = D.apexY - 30 + Math.sin((i / 18) * Math.PI) * 22;
          return <path key={i} d={`M ${x} ${y} q -6 15 0 28 q 6 -13 0 -28 Z`} fill={i % 2 ? "#3e7a2e" : "#5a9a3a"} />;
        })}
        <path d={`M ${D.x0 - 12} ${D.apexY - 30} Q ${D.cx} ${D.apexY - 6} ${D.x1 + 12} ${D.apexY - 30}`} stroke="#6a4a1a" strokeWidth={2} fill="none" />
        {/* the veranda floor, its edge, the plinth face and the sunlit courtyard below */}
        <rect x={-1600} y={F.top} width={5100} height={F.edge - F.top} fill="url(#vhd-vr-floor)" />
        <rect x={-1600} y={F.top} width={5100} height={5} fill="#2a0c06" opacity={0.45} />
        <ellipse cx={D.cx} cy={F.top + 34} rx={200} ry={34} fill="url(#vhd-vr-spill)" opacity={0.4 * fl} />
        {/* small alpona at the threshold */}
        <g transform={`translate(${D.cx}, ${F.top + 44}) scale(1, 0.3)`} opacity={0.55}>
          <circle r={70} fill="none" stroke="#fffaf0" strokeWidth={5} strokeDasharray="10 8" />
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} cx={0} cy={-38} rx={10} ry={22} fill="none" stroke="#fffaf0" strokeWidth={4} transform={`rotate(${i * 45})`} />
          ))}
        </g>
        <rect x={-1600} y={F.edge - 8} width={5100} height={8} fill="#c86a48" opacity={0.6} />
        <rect x={-1600} y={F.edge} width={5100} height={5} fill="#f0b090" opacity={0.85} />
        <rect x={-1600} y={F.edge + 5} width={5100} height={F.riser - F.edge - 5} fill="#c8946a" />
        <rect x={-1600} y={F.edge + 5} width={5100} height={F.riser - F.edge - 5} fill="url(#vhd-cy-brick2)" opacity={0.25} />
        <rect x={-1600} y={F.riser} width={5100} height={1000} fill="url(#vhd-vr-yard)" />
        {Array.from({ length: 30 }, (_, i) => (
          <line key={i} x1={-1600 + i * 180} y1={F.riser} x2={-1600 + i * 180 + (i * 180 - 2560) * 0.4} y2={F.riser + 900} stroke="#8e7a62" strokeWidth={2} opacity={0.45} />
        ))}
        {[F.riser + 60, F.riser + 180, F.riser + 380].map((y) => (
          <line key={y} x1={-1600} y1={y} x2={3500} y2={y} stroke="#8e7a62" strokeWidth={2} opacity={0.45} />
        ))}
        <rect x={-1600} y={F.riser} width={5100} height={900} fill="#fff2cc" opacity={aft ? 0.2 : 0.12} />
        {/* shade under the veranda roof: soft, the wall top darker */}
        <rect x={-1600} y={-600} width={5100} height={F.edge + 600} fill="#2a1a2a" opacity={0.12} />
        {dh && <DhoopDani x={dh.x} y={dh.y} s={1} f={f} smoke={"smoke" in dh ? dh.smoke ?? 1 : 1} />}
        {floor}
      </Layer>
      {pillar && (
        <Layer depth={1.3} extraBlur={4}>
          <rect x={-150} y={-700} width={150} height={1830} fill="#b06a42" />
          <rect x={-150} y={-700} width={16} height={1830} fill="#e8a878" opacity={0.6} />
          <rect x={-20} y={-700} width={20} height={1830} fill="#4a2010" opacity={0.35} />
          <rect x={-176} y={1100} width={200} height={40} fill="#f2c89a" />
        </Layer>
      )}
      {grade && <Grade {...vedicVerandaGrade()} />}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* 4. THE POND IN DAYLIGHT, WITH THE MANDAR TREE                        */
/* ------------------------------------------------------------------ */

/** BaidikBariDay placed across the water on the 0.45 plane: X = HOUSE.tx + HOUSE.k x, Y = HOUSE.ty + HOUSE.k y. */
const HOUSE = { k: 0.4, tx: 436, ty: 280 };
const FAR_BANK_Y = HOUSE.ty + HOUSE.k * 790; // 596: the far bank's waterline

export const POND = {
  PLANES: { sky: 0.12, trees: 0.3, house: 0.45, bank: 1, foreground: 1.3 },
  FAR_BANK_Y,
  HOUSE,
  MANDAR: { x: 1620, y: 878 },
  DROP: { x: 1130, y: 930 },
  SPOTS: {
    balak: { x: 1430, y: 912, s: 1.3 },
    sundar: { x: 1210, y: 935 },
    runner: { x: 2100, y: 900 },
    ghatTop: { x: -260, y: 770 },
    ghatStep: { x: 150, y: 848 },
  },
  BANK_X: [-1600, 3400] as const,
  WATER_X: [-2600, 4600] as const,
  WATER_BOTTOM: 1700,
} as const;

/** The right bank's ground line y at x (for feet on the bank); NaN left of the bank. */
export const pondBankY = (x: number) => {
  if (x < 1040) return NaN;
  if (x < 1200) return lerp(990, 905, sstep((x - 1040) / 160));
  if (x < 1500) return lerp(905, 884, (x - 1200) / 300);
  return lerp(884, 852, clamp((x - 1500) / 1900));
};

export const vedicPondKeepInSet = <C extends Cam>(c: C): C =>
  keepInSet(c, [
    { d: 0.12, x0: -2600, x1: 4600, y0: -1500 },
    { d: 0.45, x0: POND.WATER_X[0], x1: POND.WATER_X[1], y1: POND.WATER_BOTTOM },
    { d: 1, x0: POND.BANK_X[0], x1: POND.BANK_X[1], y1: 1900 },
  ], []);

export const vedicPondGrade = (): React.ComponentProps<typeof Grade> => ({ warmth: 0.3, vignette: 0.45, grain: 0.04, bloomAt: [80, 12] });

/** A simplified BaidikBariDay for the water reflection (local house coordinates, flipped by the caller). */
const HouseReflection: React.FC = () => (
  <g>
    <rect x={-700} y={700} width={3300} height={90} fill="#b8745a" />
    <rect x={160} y={300} width={1600} height={440} fill="#c8805a" />
    <rect x={140} y={286} width={1640} height={22} fill="#e8c09a" />
    <rect x={140} y={510} width={1640} height={16} fill="#e8c09a" />
    <rect x={150} y={236} width={1620} height={54} fill="#e8c09a" opacity={0.7} />
    {Array.from({ length: 11 }, (_, i) => (
      <rect key={i} x={216 + i * 142} y={380} width={68} height={110} fill="#3a5a4a" />
    ))}
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={234 + i * 168} y={600} width={112} height={140} fill="#5a3020" />
    ))}
    <rect x={850} y={500} width={220} height={240} fill="#b86a3a" />
    <rect x={870} y={580} width={180} height={160} fill="#4a2a18" />
  </g>
);

/**
 * A coral-tree (mandar) raceme: a dense red torch of sickle-shaped scarlet petals curving up and out around a short
 * axis, smaller toward the tip, a few dark buds at the top. Base at (x, y), about 40 px tall at s 1.
 */
const MandarRaceme: React.FC<{ x: number; y: number; s: number; rot: number; seed: number }> = ({ x, y, s, rot, seed }) => (
  <g transform={`translate(${n1(x)}, ${n1(y)}) rotate(${n1(rot)}) scale(${s.toFixed(3)})`}>
    <path d="M 0 8 L 0 -30" stroke="#5a3a26" strokeWidth={2.6} />
    <ellipse cx={0} cy={-16} rx={9} ry={17} fill="#a8160f" />
    {Array.from({ length: 11 }, (_, i) => {
      const t = i / 10;
      const side = i % 2 ? 1 : -1;
      const L = (17 - 8 * t) * (0.85 + 0.3 * hs(seed + i * 1.7));
      const ang = side * (10 + 34 * (1 - t)) + (hs(seed + i * 3.1) - 0.5) * 14;
      const col = ["#d8241c", "#e8402a", "#c41a14", "#f05a30"][Math.floor(hs(seed + i * 5.3) * 4)];
      return (
        <path
          key={i}
          d={`M 0 0 Q ${n1(L * 0.18)} ${n1(-L * 0.62)} ${n1(L * 0.62)} ${n1(-L)} Q ${n1(L * 0.5)} ${n1(-L * 0.42)} ${n1(L * 0.2)} 2 Z`}
          fill={col}
          transform={`translate(${side * 1.5}, ${n1(-t * 30)}) scale(${side}, 1) rotate(${n1(Math.abs(ang))})`}
        />
      );
    })}
    {[-3, 2, 0].map((bx, i) => (
      <ellipse key={i} cx={bx} cy={-33 - i * 3} rx={2.6} ry={4} fill="#8a120c" />
    ))}
  </g>
);

/** A trifoliate coral-tree leaf on its stalk (about 50 px). */
const MandarLeaf: React.FC<{ x: number; y: number; r: number; s: number; k: number }> = ({ x, y, r, s, k }) => (
  <g transform={`translate(${n1(x)}, ${n1(y)}) rotate(${n1(r)}) scale(${s.toFixed(3)})`}>
    <path d="M 0 0 L 0 -16" stroke="#4a6a2a" strokeWidth={2} />
    {[
      [-46, 0.85],
      [0, 1],
      [46, 0.85],
    ].map(([a, sc]) => (
      <g key={a} transform={`translate(0, -16) rotate(${a}) scale(${sc})`}>
        <path d="M 0 0 Q 15 -12 0 -32 Q -15 -12 0 0 Z" fill={k ? "#4e8a34" : "#63a040"} />
        <path d="M 0 -2 L 0 -28" stroke="#3a6a26" strokeWidth={1} opacity={0.7} />
      </g>
    ))}
  </g>
);

/** The mandar (coral) tree in bloom: grey thorny trunk, spreading branches, sparse trifoliate leaves, red racemes. */
const MandarTree: React.FC<{ f: number }> = ({ f }) => {
  const T = POND.MANDAR;
  const sway = 0.8 * Math.sin(f * 0.021) + 0.5 * noise1(f * 0.017, 13);
  // branch skeleton relative to the trunk base: [x0, y0, x1, y1, cx, cy, width]
  const branches: Array<[number, number, number, number, number, number, number]> = [
    [-50, -360, -340, -560, -180, -500, 22],
    [-50, -360, -200, -700, -160, -560, 20],
    [-50, -360, 30, -740, -10, -560, 18],
    [-40, -380, 240, -640, 120, -560, 18],
    [-30, -350, 420, -520, 220, -470, 16],
    [-340, -560, -560, -470, -460, -560, 11],
    [-340, -560, -470, -700, -420, -640, 10],
    [-200, -700, -330, -800, -280, -770, 9],
    [30, -740, 140, -830, 80, -800, 9],
    [240, -640, 400, -720, 330, -700, 9],
    [420, -520, 560, -560, 500, -560, 8],
    [-560, -470, -680, -400, -630, -450, 7],
  ];
  // flower clusters near branch ends and along the crown
  const racemes = Array.from({ length: 64 }, (_, i) => {
    const b = branches[i % branches.length];
    const t = 0.55 + 0.45 * hs(i * 2.7);
    const u = 1 - t;
    const bx = u * u * b[0] + 2 * u * t * b[4] + t * t * b[2];
    const by = u * u * b[1] + 2 * u * t * b[5] + t * t * b[3];
    return { x: bx + (hs(i * 4.3) - 0.5) * 90, y: by + (hs(i * 6.1) - 0.5) * 70 - 10, s: 1.4 + 0.7 * hs(i * 7.9), rot: (hs(i * 9.7) - 0.5) * 50, seed: i * 13 };
  });
  const leaves = Array.from({ length: 44 }, (_, i) => {
    const b = branches[(i * 5) % branches.length];
    const t = 0.5 + 0.5 * hs(i * 3.9);
    const u = 1 - t;
    return { x: u * u * b[0] + 2 * u * t * b[4] + t * t * b[2] + (hs(i * 2.2) - 0.5) * 80, y: u * u * b[1] + 2 * u * t * b[5] + t * t * b[3] + (hs(i * 8.8) - 0.5) * 60, r: (hs(i * 5.5) - 0.5) * 160, s: 1.1 + 0.5 * hs(i * 6.6) };
  });
  // soft leaf masses at the branch ends give the crown some body behind the flowers
  const masses = branches.slice(5).map((b, i) => ({ x: b[2], y: b[3] + 10, rx: 70 + 30 * hs(i * 3.3), ry: 40 + 20 * hs(i * 4.4) }));
  return (
    <g transform={`translate(${T.x}, ${T.y}) scale(0.86)`}>
      {/* trunk: grey-brown, a slight lean, a flared base with roots, small thorns */}
      <path d="M -46 0 Q -60 -10 -80 4 L 70 4 Q 52 -8 40 0 Q 26 -180 -20 -360 L -78 -360 Q -36 -180 -46 0 Z" fill="#8a7c68" />
      <path d="M -30 -10 Q -20 -180 -60 -350" stroke="#a89a84" strokeWidth={8} fill="none" opacity={0.6} />
      <path d="M 26 -6 Q 14 -170 -26 -350" stroke="#5e5446" strokeWidth={6} fill="none" opacity={0.5} />
      {Array.from({ length: 14 }, (_, i) => {
        const y = -30 - i * 24;
        const x = lerp(-40, -54, i / 14) + (i % 2 ? 36 : -6) * (1 - i / 20);
        return <path key={i} d={`M ${x} ${y} l ${i % 2 ? 6 : -6} -3 l ${i % 2 ? -4 : 4} 6 Z`} fill="#4e4436" />;
      })}
      <path d="M -80 4 Q -110 10 -130 22 M 70 4 Q 100 10 124 20" stroke="#7a6c58" strokeWidth={10} strokeLinecap="round" fill="none" />
      <g transform={`rotate(${sway.toFixed(2)} -50 -360)`}>
        {branches.map(([x0, y0, x1, y1, cx, cy, w], i) => (
          <path key={i} d={`M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`} stroke={i % 3 ? "#857762" : "#7a6c58"} strokeWidth={w} strokeLinecap="round" fill="none" />
        ))}
        {masses.map((m, i) => (
          <g key={`m${i}`} opacity={0.9}>
            {Array.from({ length: 6 }, (_, k) => (
              <circle
                key={k}
                cx={m.x + (hs(i * 9 + k * 2.3) - 0.5) * m.rx * 1.4}
                cy={m.y + (hs(i * 7 + k * 3.1) - 0.5) * m.ry * 1.2}
                r={m.ry * (0.45 + 0.3 * hs(i * 5 + k))}
                fill={k % 3 === 0 ? "#3a6626" : k % 3 === 1 ? "#447430" : "#4e7e36"}
              />
            ))}
          </g>
        ))}
        {leaves.map((l, i) => (
          <MandarLeaf key={i} x={l.x} y={l.y} r={l.r + Math.sin(f * 0.04 + i) * 5} s={l.s} k={i % 3} />
        ))}
        {racemes.map((r, i) => (
          <MandarRaceme key={i} x={r.x} y={r.y} s={r.s} rot={r.rot + Math.sin(f * 0.05 + i) * 3} seed={r.seed} />
        ))}
      </g>
    </g>
  );
};

/** A small fallen mandar blossom (on the grass or floating). */
const FallenBlossom: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${n1(x)}, ${n1(y)}) rotate(${n1(rot)}) scale(${s})`}>
    <path d="M -9 0 Q -4 -10 2 -12 Q 0 -4 -9 0 Z" fill="#d8241c" />
    <path d="M -2 1 Q 6 -8 12 -6 Q 6 0 -2 1 Z" fill="#e8402a" />
    <path d="M -6 2 Q 2 4 8 2" stroke="#a8180f" strokeWidth={2} fill="none" />
  </g>
);

/** Reeds with seed heads at the water's edge; sway on f. */
const Reeds: React.FC<{ x: number; y: number; n: number; f: number; seed: number; h?: number; dark?: boolean }> = ({ x, y, n, f, seed, h = 120, dark = false }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const bx = x + (i - n / 2) * 9 + (hs(seed + i) - 0.5) * 10;
      const hh = h * (0.6 + 0.5 * hs(seed + i * 3));
      const sw = Math.sin(f * 0.035 + i * 0.7 + seed) * 6 + noise1(f * 0.02, seed + i) * 4;
      const tx = bx + sw + (hs(seed + i * 5) - 0.5) * 20;
      const col = dark ? "#3a5a26" : i % 3 ? "#5a7a30" : "#7a9a3e";
      return (
        <g key={i}>
          <path d={`M ${n1(bx - 2)} ${y} Q ${n1(bx + sw * 0.3)} ${n1(y - hh * 0.6)} ${n1(tx)} ${n1(y - hh)} Q ${n1(bx + sw * 0.3 + 1.5)} ${n1(y - hh * 0.6)} ${n1(bx + 2)} ${y} Z`} fill={col} />
          {i % 3 === 0 && <ellipse cx={tx} cy={y - hh - 4} rx={3} ry={10} fill="#8a6a3a" transform={`rotate(${n1(sw * 2)} ${n1(tx)} ${n1(y - hh)})`} />}
        </g>
      );
    })}
  </g>
);

/** The far tree line behind the house (0.3 plane). */
const FarTreeLine: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 70 }, (_, i) => {
      const x = -2600 + i * 100 + hs(i) * 40;
      const r = 40 + hs(i * 3) * 46;
      return <circle key={i} cx={x} cy={580 - r * 0.45} r={r} fill={i % 3 ? "#6a8e66" : "#5e8460"} />;
    })}
    <rect x={-2700} y={570} width={7400} height={200} fill="#6a8e66" />
    {[-1800, -900, -400, 1700, 2300, 3100].map((x, i) => (
      <Palm key={x} x={x} y={600} s={0.6 + hs(i) * 0.2} f={f} seed={i} col="#4e7a48" />
    ))}
  </g>
);

export interface VedicPondDayProps {
  f: number;
  flowerDrop?: number;
  bank?: React.ReactNode;
  foreground?: boolean;
  cam?: Cam;
  calm?: number;
  grade?: boolean;
}

export const VedicPondDay: React.FC<VedicPondDayProps> = ({ f, flowerDrop, bank, foreground = true, cam, calm = 1, grade = true }) => {
  const WY = FAR_BANK_Y;
  // the falling blossom: from the crown to the water, then floating with rings
  const drop = flowerDrop === undefined ? null : f - flowerDrop;
  const FALL = 40;
  const fallT = drop === null ? -1 : drop / FALL;
  const start = { x: 1250, y: 380 };
  const D = POND.DROP;
  return (
    <>
      <div style={calmStyle(calm)}>
        <Layer depth={0.12} extraBlur={bgBlur(0.12, calm, cam)}>
          <rect x={-2600} y={-1600} width={7200} height={2800} fill="#bcd6dc" />
          <DaySky f={f} sunX={1700} sunY={120} />
        </Layer>
        <Layer depth={0.3} extraBlur={bgBlur(0.3, calm, cam)}>
          <FarTreeLine f={f} />
        </Layer>
        <Layer depth={0.45} extraBlur={bgBlur(0.45, calm, cam) * 0.7}>
          <defs>
            <linearGradient id="vhd-pond-water-u" gradientUnits="userSpaceOnUse" x1={0} y1={WY} x2={0} y2={1300}>
              <stop offset="0%" stopColor="#9ab8a6" />
              <stop offset="35%" stopColor="#6a9480" />
              <stop offset="100%" stopColor="#355e4a" />
            </linearGradient>
            <linearGradient id="vhd-pond-reflfade" gradientUnits="userSpaceOnUse" x1={0} y1={WY} x2={0} y2={WY + 260}>
              <stop offset="0%" stopColor="#6a9480" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#5a8672" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          {/* trees and palms either side of the house on the far bank */}
          {[-1500, -1100, -700, -380, 1640, 1900, 2300, 2800, 3300].map((x, i) => (
            <g key={x}>
              <circle cx={x} cy={WY - 70 - hs(i) * 30} r={90 + hs(i * 3) * 50} fill={i % 2 ? "#4f7d44" : "#5f8f50"} />
              <circle cx={x + 70} cy={WY - 40} r={70} fill="#4a7640" />
            </g>
          ))}
          {[-900, 260, 1560, 2050].map((x, i) => (
            <Palm key={x} x={x} y={WY + 4} s={0.7 + hs(i) * 0.15} f={f} seed={i + 3} />
          ))}
          <Banana x={190} y={WY + 2} s={0.7} f={f} />
          <Banana x={1500} y={WY + 2} s={0.65} f={f} />
          {/* the house, unchanged, across the water */}
          <g transform={`translate(${HOUSE.tx}, ${HOUSE.ty}) scale(${HOUSE.k})`}>
            <BaidikBariDay f={f} />
          </g>
          {/* far bank strip */}
          <path d={`M -2700 ${WY - 8} Q 0 ${WY - 14} 960 ${WY - 6} T 4700 ${WY - 8} L 4700 ${WY + 4} L -2700 ${WY + 4} Z`} fill="#7a9a5a" />
          <path d={`M -2700 ${WY} L 4700 ${WY}`} stroke="#5a7040" strokeWidth={3} />
          {/* water */}
          <rect x={-2700} y={WY + 2} width={7400} height={1200} fill="url(#vhd-pond-water-u)" />
          {/* reflections: the far trees and the house, in gently wobbling slices */}
          {[-1500, -1100, -700, -380, 1640, 1900, 2300, 2800, 3300].map((x, i) => (
            <ellipse key={x} cx={x + 20} cy={WY + 60} rx={120 + hs(i * 3) * 40} ry={60} fill="#3e6a48" opacity={0.35} />
          ))}
          {Array.from({ length: 14 }, (_, i) => {
            const y0 = WY + 2 + i * 17;
            const dx = 3.2 * Math.sin(f * 0.05 + i * 0.9) + 1.5 * noise1(f * 0.03, i + 5);
            return (
              <g key={i}>
                <clipPath id={`vhd-refl-${i}`}>
                  <rect x={-2700} y={y0} width={7400} height={17.5} />
                </clipPath>
                <g clipPath={`url(#vhd-refl-${i})`} opacity={0.55 - i * 0.03}>
                  <g transform={`translate(${n1(HOUSE.tx + dx)}, ${2 * WY - HOUSE.ty}) scale(${HOUSE.k}, ${-HOUSE.k})`}>
                    <HouseReflection />
                  </g>
                </g>
              </g>
            );
          })}
          <rect x={-2700} y={WY + 2} width={7400} height={260} fill="url(#vhd-pond-reflfade)" />
          {/* soft ripples: drifting sky-light streaks */}
          {Array.from({ length: 60 }, (_, i) => {
            const row = hs(i * 1.3);
            const y = WY + 8 + Math.pow(row, 1.3) * 560;
            const len = 30 + row * 90;
            const x = -1400 + ((hs(i * 2.9) * 4400 + f * (0.15 + row * 0.25)) % 4400);
            const o = 0.18 + 0.2 * Math.sin(f * 0.03 + i * 1.7);
            return o > 0.05 ? <rect key={i} x={n1(x)} y={n1(y)} width={n1(len)} height={1.6 + row * 2} rx={1} fill="#eef6ee" opacity={o} /> : null;
          })}
          {/* sun glitter */}
          {Array.from({ length: 16 }, (_, i) => {
            const on = 0.5 + 0.5 * Math.sin(f * 0.25 + i * 2.1);
            return <rect key={i} x={1000 + hs(i) * 340} y={WY + 30 + hs(i * 3) * 120} width={10 + hs(i * 5) * 22} height={2.5} rx={1.2} fill="#fffbe8" opacity={on * 0.55} />;
          })}
          {/* the odd ring (an insect, a fish) */}
          {Array.from({ length: 5 }, (_, k) => {
            const period = 150 + k * 37;
            const age = (((f + k * 61) % period) + period) % period;
            const t = age / 90;
            if (t > 1) return null;
            const cyc = Math.floor((f + k * 61) / period);
            const x = -300 + hs(k * 7 + cyc * 3.1) * 1500;
            const y = WY + 60 + hs(k * 11 + cyc * 1.7) * 380;
            return (
              <g key={k} opacity={(1 - t) * 0.5}>
                <ellipse cx={x} cy={y} rx={8 + t * 60} ry={(8 + t * 60) * 0.22} fill="none" stroke="#e8f2ea" strokeWidth={1.6} />
                {t > 0.25 && <ellipse cx={x} cy={y} rx={4 + (t - 0.25) * 50} ry={(4 + (t - 0.25) * 50) * 0.22} fill="none" stroke="#e8f2ea" strokeWidth={1.2} />}
              </g>
            );
          })}
        </Layer>
      </div>
      <Layer depth={1}>
        <VhdDefs />
        <GlowDefs />
        <defs>
          <linearGradient id="vhd-bank-grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c9a46" />
            <stop offset="100%" stopColor="#4e6a2a" />
          </linearGradient>
          <linearGradient id="vhd-ghat-brick" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8724a" />
            <stop offset="100%" stopColor="#9a5236" />
          </linearGradient>
          <pattern id="vhd-ghat-bricks" width={30} height={12} patternUnits="userSpaceOnUse">
            <path d="M 0 0 H 30 M 0 6 H 30 M 8 0 V 6 M 23 6 V 12" stroke="#7a3a22" strokeWidth={1} />
          </pattern>
        </defs>
        {/* water-surface effects on the near plane: the tree's reflection, floating blossoms, the dropped blossom */}
        <g opacity={0.35}>
          <path d={`M ${POND.MANDAR.x - 70} 900 L ${POND.MANDAR.x - 30} 900 L ${POND.MANDAR.x - 120} 1080 L ${POND.MANDAR.x - 170} 1080 Z`} fill="#3a4a3a" />
        </g>
        {Array.from({ length: 5 }, (_, i) => {
          const x = 640 + i * 110 + Math.sin(f * 0.006 + i) * 18 + f * 0.03;
          const y = 940 + hs(i * 3) * 70;
          return <FallenBlossom key={i} x={((x - 600) % 520) + 600} y={y} s={1} rot={hs(i) * 360 + f * 0.05} />;
        })}
        {drop !== null && fallT > 1 && drop - FALL < 150 && (
          <g>
            {[0, 18, 40].map((lag, k) => {
              const t = (drop - FALL - lag) / 90;
              if (t < 0 || t > 1) return null;
              const r = 6 + t * 70;
              return <ellipse key={k} cx={D.x} cy={D.y} rx={r} ry={r * 0.24} fill="none" stroke="#eef6ee" strokeWidth={1.8 - k * 0.4} opacity={(1 - t) * 0.6} />;
            })}
          </g>
        )}
        {drop !== null && fallT > 1 && <FallenBlossom x={D.x + (drop - FALL) * 0.04} y={D.y} s={1.2} rot={30 + (drop - FALL) * 0.08} />}
        {/* the ghat (left): brick steps descending to the right into the water, a parapet with a rounded end */}
        <g>
          <path d="M -1700 760 L 40 760 L 40 1100 L -1700 1100 Z" fill="url(#vhd-ghat-brick)" />
          <rect x={-1700} y={746} width={1740} height={16} fill="#e2b48a" />
          <rect x={-1700} y={746} width={1740} height={4} fill="#f6d8b4" />
          {Array.from({ length: 8 }, (_, i) => {
            const x0 = 40 + i * 52;
            const y0 = 770 + i * 30;
            return (
              <g key={i}>
                <rect x={-1700} y={y0 + 14} width={1740 + x0 + 52 - 40} height={30} fill="url(#vhd-ghat-brick)" />
                <rect x={-1700} y={y0 + 14} width={1740 + x0 + 52 - 40} height={30} fill="url(#vhd-ghat-bricks)" opacity={0.35} />
                <rect x={-1700} y={y0} width={1740 + x0 + 52 - 40} height={15} fill="#dca882" />
                <rect x={-1700} y={y0} width={1740 + x0 + 52 - 40} height={3} fill="#f2ccA6" />
              </g>
            );
          })}
          {/* the ghat's entrance pillar on the platform, with its rounded cap */}
          <rect x={-40} y={600} width={56} height={160} fill="#c8724a" />
          <rect x={-40} y={600} width={56} height={160} fill="url(#vhd-ghat-bricks)" opacity={0.35} />
          <rect x={-48} y={590} width={72} height={14} fill="#e2b48a" />
          <path d="M -40 590 Q -12 556 16 590 Z" fill="#e2b48a" />
          <rect x={-40} y={600} width={10} height={160} fill="#e8a070" opacity={0.6} />
          {/* moss and lime staining where the water reaches */}
          {[6, 7].map((i) => (
            <rect key={i} x={-1700} y={770 + i * 30} width={1740 + i * 52 + 12} height={60} fill="#3a5a3a" opacity={0.45} />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} cx={-200 + i * 70} cy={950 + (i % 3) * 6} rx={30} ry={6} fill="#5a7a4a" opacity={0.45} />
          ))}
        </g>
        {/* water over the lowest steps, with the lapping line */}
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M ${-760 + i * 190} ${966 + Math.sin(f * 0.06 + i) * 2} q 40 -4 80 0`} stroke="#e8f2ea" strokeWidth={2} fill="none" opacity={0.55} />
        ))}
        <Reeds x={580} y={968} n={12} f={f} seed={3} h={110} />
        {/* the right bank: grass, a soil lip with roots at the water, fallen blossoms, dappled shade under the tree */}
        <path d={`M 1040 1900 L 1040 990 Q 1110 920 1200 905 Q 1360 886 1500 884 Q 2200 860 3500 848 L 3500 1900 Z`} fill="url(#vhd-bank-grass)" />
        <path d={`M 1040 990 Q 1110 920 1200 905 Q 1360 886 1500 884 Q 2200 860 3500 848`} stroke="#6a4a2a" strokeWidth={7} fill="none" />
        <path d={`M 1044 1000 Q 1112 932 1202 917`} stroke="#3a2a1a" strokeWidth={4} fill="none" opacity={0.5} />
        <ellipse cx={1560} cy={930} rx={420} ry={48} fill="#2a3a1a" opacity={0.22} />
        {Array.from({ length: 18 }, (_, i) => (
          <ellipse key={i} cx={1250 + hs(i * 3) * 650} cy={905 + hs(i * 5) * 70} rx={30 + hs(i) * 40} ry={6} fill="#a8c068" opacity={0.18 + 0.06 * Math.sin(f * 0.03 + i)} />
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <FallenBlossom key={i} x={1180 + hs(i * 7.7) * 900} y={905 + hs(i * 3.3) * 110} s={0.9} rot={hs(i * 2.1) * 360} />
        ))}
        {Array.from({ length: 30 }, (_, i) => {
          const x = 1100 + i * 80 + hs(i) * 30;
          const y = pondBankY(Math.max(1041, x)) + 4 + hs(i * 3) * 30;
          const sw = Math.sin(f * 0.05 + i) * 3;
          return <path key={i} d={`M ${x} ${y} q ${sw} -10 ${sw * 1.4} -18 M ${x + 6} ${y} q ${sw} -8 ${sw * 1.6} -14`} stroke="#4e6e26" strokeWidth={2.4} fill="none" />;
        })}
        <Reeds x={1060} y={1000} n={10} f={f} seed={7} h={130} />
        <MandarTree f={f} />
        {/* the thin near bank along the bottom, joining the ghat and the right bank */}
        <path d="M -1700 1062 Q -400 1040 400 1056 Q 800 1064 1100 1050 L 1100 1900 L -1700 1900 Z" fill="#5e7a32" />
        <path d="M -1700 1062 Q -400 1040 400 1056 Q 800 1064 1100 1050" stroke="#5a4a2a" strokeWidth={5} fill="none" />
        {/* the falling blossom (drawn in front of the tree) */}
        {fallT >= 0 && fallT <= 1 && (
          <FallenBlossom
            x={lerp(start.x, D.x, fallT) + Math.sin(fallT * 9) * 30 * (1 - fallT)}
            y={lerp(start.y, D.y, fallT * fallT * 0.4 + fallT * 0.6)}
            s={1.3}
            rot={fallT * 500}
          />
        )}
        {bank}
      </Layer>
      {foreground && (
        <Layer depth={1.3} extraBlur={3.5}>
          <Reeds x={60} y={1120} n={16} f={f} seed={21} h={230} dark />
          <Reeds x={-200} y={1120} n={12} f={f} seed={25} h={190} dark />
          <Reeds x={2150} y={1120} n={12} f={f} seed={29} h={200} dark />
        </Layer>
      )}
      {grade && <Grade {...vedicPondGrade()} />}
    </>
  );
};
