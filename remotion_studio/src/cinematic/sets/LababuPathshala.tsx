import React, { useId } from "react";
import { clamp, noise1, safeId } from "../core/anim";
import { Cam, Grade, Layer } from "../core/Stage";
import { BN_FONT } from "../fonts";
import { Banana, Palm } from "./S01_DaySets";
import { MangoTree } from "./KrishnanagarKachari";
import {
  UJANCHAR_PALETTE as P,
  UjancharBush,
  UjancharFenceRun,
  UjancharForegroundLayer,
  UjancharJungleLayer,
  UjancharSkyLayer,
  ujancharBgBlur,
  ujancharGrade,
  ujancharHash as hashS,
} from "./UjancharHouse";

/**
 * LABABU'S PATHSHALA (লববাবুর পাঠশালা), Ujanchar: the village school of Episode 7 (book chapter তেরো), first seen in
 * Episode 6's outro glimpse (STO-21, plan decision 17).
 *
 * The book: "বেশ নূতন টিনের বাংলো প্যাটার্ণের চৌচালা ঘর, বেড়ায় রং দেওয়া, বেশ গুছানো ঘরটি। ঘরের ভেতর তিন রকমের
 * বসবার ব্যবস্থা রয়েছে। প্রথম শ্রেণী মেঝেতে চাটাই পেতে বসত, দ্বিতীয় শ্রেণী মাটিতে গাছা পোতা রয়েছে, তাতে বসত।
 * ... তৃতীয় শ্রেণীর জন্য বাঁশের মাচা বা বেঞ্চের মত সারি সারি মঞ্চ তৈরী করা হয়েছে।" So: a NEW four-sloped (চৌচালা)
 * corrugated-tin roof, seen three-quarter from the front-left so the front slope and the right hip both read; walls of
 * woven bamboo mat (বেড়া) painted pale ochre with a terracotta dado, the posts, door frame and window frames painted
 * teal; a wide double doorway with its two plank leaves opened inward; two barred windows; a mud plinth with a step.
 * Inside, through the doorway: palm-leaf mats (চাটাই) in the front row with slates on them (first class), short wooden
 * stumps driven into the earth floor (গাছা, second class), the long raised bamboo platform (মাচা, third class) along
 * the back wall under a barred window, and the teacher's low desk with his cane (বেত) and a brass inkpot. A big mango
 * tree stands beside the schoolroom on the left. The Ujanchar world around it: the same sky, jungle, palms, bananas,
 * bushes, bamboo fence and earth colours as src/cinematic/sets/UjancharHouse.tsx (read only; its pieces are reused).
 * No people are drawn here (Lababu still needs a design): characters go in the slots.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * API (everything renders INSIDE a <Stage>; the layer components wrap their own <Layer>)
 * ---------------------------------------------------------------------------------------------------------------
 *  Quick use, the whole set:
 *    const cam = pathshalaKeepInSet({ x, y, zoom });
 *    <Stage cam={cam} background={PATHSHALA_BG}>
 *      <LababuPathshala f={lifeF} cam={cam} inside={<>a seated child at PATHSHALA.inside.balak ...</>}
 *        floor={<>characters in the yard (depth 1)</>} />
 *    </Stage>
 *
 *  Or layer by layer:
 *    <PathshalaBackdrop f cam calm />          sky 0.15, jungle 0.35, trees 0.5 (Ujanchar sky and jungle, own palms)
 *    <PathshalaSchoolLayer f cam calm inside front mango />   depth 0.8: the yard earth, fence, bushes, the school,
 *                                               the interior seen through the doorway, the mango tree
 *    <PathshalaFloorLayer f under>{characters}</PathshalaFloorLayer>    depth 1: the school yard in front
 *    <PathshalaLightLayer f level mask />       screen: soft morning light from the upper left, motes
 *    <UjancharForegroundLayer f grass bokeh leaves />   (re-exported as PathshalaForegroundLayer)
 *    <Grade {...pathshalaGrade()} />
 *
 *  Common props
 *    f      LIFE clock (lifeF): leaf sway, clouds, motes. Never a held story clock.
 *    cam    the Stage cam (optional; only for the CAM-11 depth blur, so the camera's own DOF is not doubled).
 *    calm   0..1 (default 1): the CAM-11 background treatment of the far planes, as the Ujanchar house. The school
 *           layer takes its own `calm` (default 0: it is the subject).
 *  PathshalaSchoolLayer slots (ReactNodes, drawn on the 0.8 plane in WORLD coordinates of that plane)
 *    inside  drawn INSIDE the room: after the furniture and the room's shade, before the light from the door, the
 *            opened door leaves and the facade, and clipped to the doorway (a child on the front mat, a teacher at
 *            the desk). Placement points: PATHSHALA.inside.* (already in world coordinates).
 *    front   drawn in front of the school (a figure on the step or in the yard on the 0.8 plane).
 *    mango   (default true) the mango tree beside the school (PATHSHALA.mango).
 *    doorLight 0..1 (default 1): the morning light falling in through the doorway onto the floor and the front mat.
 *  PathshalaFloorLayer: `under` (drawn on the yard first) and children (characters on depth 1).
 *
 *  Pieces (exported, each drawn at (x, y) = its base on the ground, any scale s; usable in an interior view too):
 *    PalmMat { x, y, w?, d?, s?, seed? }       চাটাই: woven palm-leaf mat lying on the floor, centre (x, y), w wide,
 *                                              d deep (foreshortened; default 0.22 w)
 *    Slate { x, y, s?, rot?, lie?, writing? }  a school slate in its wooden frame; (x, y) = middle of its bottom edge;
 *                                              lie 0 upright facing us .. 1 flat on the ground (foreshortened);
 *                                              writing: chalk letters (default "ক খ") in Baloo Da 2, or null
 *    Chalk { x, y, s?, rot? }                  a stick of chalk (খড়ি)
 *    Gachha { x, y, s?, seed? }                গাছা: a short wooden stump driven into the floor, a seat
 *    BambooMachan { x0, x1, y, h?, s? }        মাচা: the long raised bamboo platform, legs on the floor at y
 *    TeacherDesk { x, y, s?, cane?, inkpot? }  the teacher's low wooden desk; cane (default true) = the বেত on it
 *    Cane { x, y, len?, rot?, s? }             the বেত alone (x, y = its butt)
 *    PathshalaInterior { x, y, k?, halfW?, f, inside?, doorLight? }   the whole furnished room in local units
 *                                              (threshold centre at (x, y), scale k; x -520..520, back wall base at
 *                                              -150, beam at -292): the front view draws it through the doorway;
 *                                              an interior view can draw it big on its own Layer (k 2 to 3).
 *    PathshalaBuilding { f, inside?, doorLight? }    the school itself at its fixed place (PATHSHALA.BUILDING).
 *  Constants: PATHSHALA (planes, BUILDING, DOOR, ROOF, INTERIOR local points, inside.* world points, mango, GLIMPSE
 *    cam, extents), PATHSHALA_BG, PATHSHALA_PALETTE; helpers pathshalaGrade(), pathshalaKeepInSet(cam),
 *    pathshalaInsidePoint(local) (interior local -> world on the 0.8 plane).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * PLACEMENT POINTS (world, 0.8 plane unless noted)
 * ---------------------------------------------------------------------------------------------------------------
 *  PATHSHALA.inside.balak    { x: 800, y: 812, s: 0.55 }  the left front mat: a SeatedChild (plate, age 6) at s 0.55
 *  PATHSHALA.inside.matB     the right front mat (a slate and chalk lie on it)
 *  PATHSHALA.inside.desk     the teacher's desk (base centre); PATHSHALA.inside.teacher where he would sit behind it
 *  PATHSHALA.inside.gachha[] the three stumps; PATHSHALA.inside.machan the platform (x0, x1, y)
 *  PATHSHALA.step            the mud step in front of the doorway (an adult at s about 0.42 on the 0.8 plane)
 *  PATHSHALA.mango           the mango tree's base (x, y, s)
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SAFE CAMERA RANGE (CAM-08): pathshalaKeepInSet(cam) clamps any cam (zoom 1..3) so no plane's edge shows, with soft
 * corners. Extents: floor (1) and school (0.8) planes x -1500..3500, trees 0.5 x -1700..3700, jungle -1800..3800, sky
 * -2200..4200; the school plane's earth runs down to y 1150 so the floor's back edge (y 900) never opens a gap. The
 * school's doorway is at x 690..1190 (centre 940), y 540..840; its eave at y 500, ridge 350 (0.8 plane). The outro
 * glimpse framing is PATHSHALA.GLIMPSE (zoom 1.5 on the doorway). Keep faces above y 820 on screen.
 *
 * Planes, back to front: 0.15 sky; 0.35 jungle; 0.5 palms and bananas; 0.8 the school, its yard earth, fence, bushes
 * and the mango tree; 1 the school yard (characters); 0.95 light (screen); 1.35 near grass; 1.6 near leaves.
 */

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const PLANES = { sky: 0.15, jungle: 0.35, trees: 0.5, school: 0.8, light: 0.95, floor: 1, grass: 1.35, leaves: 1.6 } as const;

/** The school on the 0.8 plane (plane px). The right side wall recedes from x1 to x1 + side, rising `rise`. */
const BUILDING = { x0: 420, x1: 1440, eave: 500, plinthTop: 840, plinthBottom: 878, side: 150, rise: 12, plinthOut: 20 } as const;
const DOOR = { x0: 690, x1: 1190, top: 540, cx: 940 } as const;
const ROOF = { eaveY: 506, eaveX0: 360, eaveX1: 1500, ridgeY: 350, ridgeX0: 770, ridgeX1: 1090, backX: 1660, backY: 492 } as const;
const WINDOWS = [
  { x0: 500, x1: 620, y0: 610, y1: 700 },
  { x0: 1260, x1: 1380, y0: 610, y1: 700 },
] as const;
const STEP = { x0: 870, x1: 1010, y: 878, h: 14 } as const;
const MANGO = { x: 335, y: 890, s: 0.78, seed: 5 } as const;
const GROUND_TOP = 866;
const YARD_BOTTOM = 1150;
const FLOOR_TOP = 900;
const FLOOR_BOTTOM = 1500;

/** Interior layout in local units (threshold centre at 0, 0; back wall base at -150; visible through the door |x| < 250). */
const INTERIOR = {
  backBase: -150,
  beam: -292,
  top: -340,
  window: { x0: -110, x1: 30, y0: -270, y1: -200 },
  machan: { x0: -520, x1: 520, y: -150, h: 38 },
  desk: { x: 170, y: -122, s: 0.9 },
  teacher: { x: 190, y: -138 },
  gachha: [
    { x: -40, y: -96 },
    { x: 30, y: -100 },
    { x: 96, y: -94 },
  ],
  matA: { x: -140, y: -30, w: 190 },
  matB: { x: 125, y: -30, w: 180 },
  balak: { x: -140, y: -28 },
} as const;

/** Interior local point -> world point on the 0.8 plane (the front view draws the interior at k 1). */
export const pathshalaInsidePoint = (p: { x: number; y: number }): { x: number; y: number } => ({ x: DOOR.cx + p.x, y: BUILDING.plinthTop + p.y });

const SET_X: Array<[number, number, number]> = [
  [1, -1500, 3500],
  [0.8, -1500, 3500],
  [0.5, -1700, 3700],
  [0.35, -1800, 3800],
  [0.15, -2200, 4200],
];

/** The outro glimpse's framing (Episode 6 TTL-10a): zoom 1.5, the doorway a little below the frame centre. */
const GLIMPSE_FOCUS = { x: 885, y: 680 };
const GLIMPSE_ZOOM = 1.5;

export const PATHSHALA = {
  PLANES,
  BUILDING,
  DOOR,
  ROOF,
  WINDOWS,
  INTERIOR,
  GROUND_TOP,
  FLOOR_TOP,
  FLOOR_BOTTOM,
  YARD_BOTTOM,
  SET_X,
  step: { x: (STEP.x0 + STEP.x1) / 2, y: STEP.y + STEP.h, depth: 0.8, s: 0.42 },
  mango: MANGO,
  inside: {
    balak: { ...pathshalaInsidePoint(INTERIOR.balak), depth: 0.8, s: 0.55 },
    matA: { ...pathshalaInsidePoint(INTERIOR.matA), depth: 0.8 },
    matB: { ...pathshalaInsidePoint(INTERIOR.matB), depth: 0.8 },
    desk: { ...pathshalaInsidePoint(INTERIOR.desk), depth: 0.8 },
    teacher: { ...pathshalaInsidePoint(INTERIOR.teacher), depth: 0.8, s: 0.36 },
    gachha: INTERIOR.gachha.map((g) => ({ ...pathshalaInsidePoint(g), depth: 0.8 })),
    machan: { x0: DOOR.cx + INTERIOR.machan.x0, x1: DOOR.cx + INTERIOR.machan.x1, y: BUILDING.plinthTop + INTERIOR.machan.y, depth: 0.8 },
  },
  GLIMPSE: {
    focus: GLIMPSE_FOCUS,
    cam: { x: (GLIMPSE_FOCUS.x - 960) / PLANES.school, y: (GLIMPSE_FOCUS.y - 540) / PLANES.school, zoom: GLIMPSE_ZOOM } as Cam,
  },
} as const;

/** Stage background (shows only through soft edges): the Ujanchar morning. */
export const PATHSHALA_BG = P.bg;

/** The schoolroom's own colours (the Ujanchar palette, UJANCHAR_PALETTE, for everything shared with the village). */
export const PATHSHALA_PALETTE = {
  /** new corrugated tin: body, lit sheen, rib shadow, hip (in shade), ridge cap */
  tin: "#b7bfc4",
  tinLight: "#e8edf0",
  tinRib: "#959ea5",
  tinHip: "#8d969d",
  tinRidge: "#cfd5d8",
  /** painted bamboo-mat wall (বেড়ায় রং): pale ochre, its weave, the terracotta dado and its weave */
  wall: "#e0cb92",
  wallWeave: "#c3ad72",
  dado: "#b3593d",
  dadoWeave: "#93452e",
  /** painted woodwork: posts, frames, door leaves */
  trim: "#4f7f76",
  trimLight: "#76a59a",
  trimDark: "#355b54",
  /** inside: unpainted bamboo mat, earth floor (back, front), the dark under the roof */
  inWall: "#b39565",
  inWeave: "#987a4c",
  inFloorBack: "#8f6b45",
  inFloorFront: "#b88f60",
  rafters: "#4a3828",
  /** palm-leaf mat, its weave and binding */
  mat: "#d9be7c",
  matWeave: "#b89a58",
  matEdge: "#a2833f",
  /** slate and its frame */
  slate: "#3b4146",
  slateLight: "#56606a",
  slateFrame: "#8a5a32",
  chalk: "#ecebe2",
  /** wood: stumps, the desk, the cane */
  wood: "#6e4a2c",
  woodTop: "#94683f",
  desk: "#6a4426",
  deskTop: "#8e5e36",
  cane: "#b48c4c",
  caneNode: "#8a6630",
  brass: "#c9a043",
} as const;
const Q = PATHSHALA_PALETTE;

/** The Ujanchar morning grade, the bloom a little to the upper left (the morning sun over the mango tree). */
export const pathshalaGrade = (): React.ComponentProps<typeof Grade> => ({ ...ujancharGrade("morning"), bloomAt: [34, 30] });

const smax = (a: number, b: number, k: number) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
const smin = (a: number, b: number, k: number) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + k * k));

/** Clamps a Stage cam so no plane's edge comes into frame (soft corners). Keeps every other cam field. */
export const pathshalaKeepInSet = <C extends Cam>(c: C): C => {
  const EDGE = 16;
  const z = Math.max(1, c.zoom);
  let lo = -Infinity;
  let hi = Infinity;
  for (const [d, x0, x1] of SET_X) {
    const s = Math.pow(z, d);
    lo = Math.max(lo, (x0 + EDGE - 960 + 960 / s) / d);
    hi = Math.min(hi, (x1 - EDGE - 960 - 960 / s) / d);
  }
  const yd = PLANES.school;
  const w = Math.pow(z, yd);
  const den = z - yd * w;
  const yLo = den > 1e-6 ? Math.max(-200, (z * (FLOOR_TOP - 540) - w * (YARD_BOTTOM - 540) + 6) / den) : -200;
  const yHi = FLOOR_BOTTOM - EDGE - 540 - 540 / z;
  return { ...c, x: smin(smax(c.x, lo, 24), hi, 24), y: smin(smax(c.y, yLo, 24), yHi, 24) };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const f1 = (n: number) => n.toFixed(1);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** A basket-weave (bamboo mat) pattern: alternate quadrants of horizontal and vertical strips. */
const WeavePattern: React.FC<{ id: string; base: string; line: string; size?: number; op?: number }> = ({ id, base, line, size = 16, op = 0.55 }) => {
  const h = size / 2;
  const q = size / 8;
  return (
    <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
      <rect width={size} height={size} fill={base} />
      <g stroke={line} strokeWidth={0.9} opacity={op}>
        {[1, 2, 3].map((k) => (
          <React.Fragment key={k}>
            <line x1={0} y1={k * q} x2={h} y2={k * q} />
            <line x1={h + k * q} y1={0} x2={h + k * q} y2={h} />
            <line x1={k * q} y1={h} x2={k * q} y2={size} />
            <line x1={h} y1={h + k * q} x2={size} y2={h + k * q} />
          </React.Fragment>
        ))}
      </g>
    </pattern>
  );
};

/** A run of the Ujanchar bamboo fence at any size, clipped to x0..x1, base on `base`, scaled by k. */
const FenceAt: React.FC<{ x0: number; x1: number; base: number; k?: number; seed: number }> = ({ x0, x1, base, k = 1, seed }) => {
  const id = safeId(useId());
  return (
    <g>
      <defs>
        <clipPath id={`pf-${id}`}>
          <rect x={x0 - 6 * k} y={base - 260 * k} width={x1 - x0 + 12 * k} height={280 * k} />
        </clipPath>
      </defs>
      <g clipPath={`url(#pf-${id})`}>
        <g transform={`translate(${x0}, ${base}) scale(${k}) translate(0, -862)`}>
          <UjancharFenceRun x0={0} x1={(x1 - x0) / k} seed={seed} />
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

/** চাটাই: a woven palm-leaf mat lying on the floor, centre (x, y), w wide and d deep (foreshortened). */
export const PalmMat: React.FC<{ x: number; y: number; w?: number; d?: number; s?: number; seed?: number }> = ({ x, y, w = 180, d, s = 1, seed = 0 }) => {
  const dd = d ?? w * 0.22;
  const hw = w / 2;
  const back = hw * 0.9; // the far edge a little narrower (perspective)
  const outline = `M ${-back} ${-dd / 2} L ${back} ${-dd / 2} L ${hw} ${dd / 2} L ${-hw} ${dd / 2} Z`;
  const n = Math.round(w / 9);
  return (
    <g transform={`translate(${f1(x)}, ${f1(y)}) scale(${s}) rotate(${f1((hashS(seed + 3) - 0.5) * 2)})`}>
      <ellipse cx={0} cy={dd / 2 + 1} rx={hw * 1.02} ry={3} fill={P.shadow} opacity={0.22} />
      <path d={outline} fill={Q.mat} />
      {/* the plait: diagonal strips both ways */}
      <g stroke={Q.matWeave} strokeWidth={1} opacity={0.7}>
        {range(n).map((i) => {
          const u = -hw + (i + 0.5) * (w / n);
          return (
            <React.Fragment key={i}>
              <line x1={f1(u * 0.9 - 4)} y1={-dd / 2 + 1} x2={f1(u + 4)} y2={dd / 2 - 1} />
              <line x1={f1(u * 0.9 + 4)} y1={-dd / 2 + 1} x2={f1(u - 4)} y2={dd / 2 - 1} opacity={0.5} />
            </React.Fragment>
          );
        })}
      </g>
      {/* the bound edges and a soft lit band */}
      <path d={outline} fill="none" stroke={Q.matEdge} strokeWidth={2} />
      <path d={`M ${-hw + 4} ${dd / 2 - 2} L ${hw - 4} ${dd / 2 - 2}`} stroke="#f0dca4" strokeWidth={1.2} opacity={0.6} />
    </g>
  );
};

/**
 * A school slate in its wooden frame. (x, y) = the middle of its bottom edge; about 64 x 46 at s 1 upright. lie 0 =
 * upright facing the camera, 1 = flat on the ground (foreshortened). writing: chalk letters (Baloo Da 2) or null.
 */
export const Slate: React.FC<{ x: number; y: number; s?: number; rot?: number; lie?: number; writing?: string | null }> = ({ x, y, s = 1, rot = 0, lie = 0, writing = "ক খ" }) => {
  const W = 64;
  const H = 46;
  const fr = 5;
  const sy = 1 - 0.7 * clamp(lie);
  return (
    <g transform={`translate(${f1(x)}, ${f1(y)}) rotate(${f1(rot)}) scale(${s}, ${(s * sy).toFixed(3)})`}>
      {lie > 0.5 && <ellipse cx={1} cy={1} rx={W * 0.55} ry={4 / sy} fill={P.shadow} opacity={0.25} />}
      <rect x={-W / 2} y={-H} width={W} height={H} rx={3} fill={Q.slateFrame} />
      <rect x={-W / 2 + 1} y={-H + 1} width={W - 2} height={2} fill="#b98654" opacity={0.6} />
      <rect x={-W / 2 + fr} y={-H + fr} width={W - 2 * fr} height={H - 2 * fr} fill={Q.slate} />
      <rect x={-W / 2 + fr} y={-H + fr} width={W - 2 * fr} height={(H - 2 * fr) * 0.45} fill={Q.slateLight} opacity={0.35} />
      {/* old chalk smudges */}
      <ellipse cx={-8} cy={-H * 0.42} rx={14} ry={6} fill={Q.chalk} opacity={0.08} />
      {writing && (
        <text x={0} y={-H * 0.36} textAnchor="middle" fontFamily={BN_FONT} fontWeight={600} fontSize={17} fill={Q.chalk} opacity={0.82}>
          {writing}
        </text>
      )}
    </g>
  );
};

/** A stick of chalk (খড়ি) lying on the floor or a slate. */
export const Chalk: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${f1(x)}, ${f1(y)}) rotate(${f1(rot)}) scale(${s})`}>
    <rect x={-7} y={-2} width={14} height={3.4} rx={1.6} fill={Q.chalk} />
    <rect x={-7} y={0.6} width={14} height={0.8} fill="#bdbbb0" opacity={0.6} />
  </g>
);

/** গাছা: a short wooden stump driven into the earth floor, worn smooth on top; a seat. Base at (x, y). */
export const Gachha: React.FC<{ x: number; y: number; s?: number; seed?: number }> = ({ x, y, s = 1, seed = 0 }) => {
  const h = 26 + 6 * hashS(seed + 1);
  const r = 10;
  return (
    <g transform={`translate(${f1(x)}, ${f1(y)}) scale(${s})`}>
      <ellipse cx={0} cy={1} rx={r + 6} ry={3.5} fill={P.shadow} opacity={0.3} />
      <path d={`M ${-r} 0 L ${-r + 1} ${-h} L ${r - 1} ${-h} L ${r} 0 Z`} fill={Q.wood} />
      <path d={`M ${-r + 3} -2 L ${-r + 3.5} ${-h + 2}`} stroke="#8a6040" strokeWidth={2.2} opacity={0.6} />
      <path d={`M ${r - 3} -3 L ${r - 3.4} ${-h + 3}`} stroke="#4a3018" strokeWidth={2} opacity={0.5} />
      <ellipse cx={0} cy={-h} rx={r - 1} ry={3.6} fill={Q.woodTop} />
      <ellipse cx={-2} cy={-h - 0.6} rx={r - 4} ry={1.8} fill="#b8895a" opacity={0.6} />
    </g>
  );
};

/** মাচা: the long raised bamboo platform (third class), its legs on the floor at y, top h above it. */
export const BambooMachan: React.FC<{ x0: number; x1: number; y: number; h?: number; s?: number }> = ({ x0, x1, y, h = 38, s = 1 }) => {
  const top = y - h * s;
  const depth = 12 * s;
  const legs: number[] = [];
  for (let x = x0 + 30 * s; x <= x1 - 20 * s; x += 120 * s) legs.push(x);
  return (
    <g>
      <rect x={x0} y={top + 4 * s} width={x1 - x0} height={h * s - 4 * s} fill={P.shadow} opacity={0.32} />
      {legs.map((x) => (
        <g key={x}>
          <rect x={x - 3.5 * s} y={top} width={7 * s} height={h * s} rx={3 * s} fill={P.bamboo} />
          <rect x={x - 1.5 * s} y={top} width={2 * s} height={h * s} fill={P.bambooLight} opacity={0.4} />
        </g>
      ))}
      {/* the slatted top seen a little from above, then the round front pole */}
      <rect x={x0} y={top - depth} width={x1 - x0} height={depth} fill={P.bambooLight} opacity={0.9} />
      {range(Math.ceil(((x1 - x0) / s) / 14)).map((i) => (
        <line key={i} x1={x0 + i * 14 * s} y1={top - depth} x2={x0 + i * 14 * s - 2 * s} y2={top} stroke={P.bamboo} strokeWidth={0.8} opacity={0.5} />
      ))}
      <rect x={x0} y={top - 2 * s} width={x1 - x0} height={6 * s} rx={3 * s} fill={P.bamboo} />
      <rect x={x0} y={top - 1.5 * s} width={x1 - x0} height={1.6 * s} fill={P.bambooLight} opacity={0.6} />
      {legs.map((x) => (
        <rect key={`t${x}`} x={x - 4.5 * s} y={top - 2.5 * s} width={9 * s} height={3 * s} fill={P.bambooTie} />
      ))}
    </g>
  );
};

/** বেত: the teacher's cane, a long thin rattan with nodes, its butt at (x, y), pointing along rot (degrees). */
export const Cane: React.FC<{ x: number; y: number; len?: number; rot?: number; s?: number }> = ({ x, y, len = 150, rot = 0, s = 1 }) => (
  <g transform={`translate(${f1(x)}, ${f1(y)}) rotate(${f1(rot)}) scale(${s})`}>
    <path d={`M 0 -1.6 Q ${len * 0.5} -2.6 ${len} -0.6 L ${len} 0.6 Q ${len * 0.5} 1.4 0 1.6 Z`} fill={Q.cane} />
    <path d={`M 2 -0.8 Q ${len * 0.5} -1.8 ${len - 2} -0.4`} stroke="#dcb978" strokeWidth={0.7} fill="none" opacity={0.7} />
    {[0.18, 0.4, 0.62, 0.84].map((u) => (
      <rect key={u} x={len * u - 0.8} y={-2.2} width={1.6} height={4.2} fill={Q.caneNode} />
    ))}
  </g>
);

/** The teacher's low wooden desk with its sloping top; the cane (বেত) laid across it and a brass inkpot. Base at (x, y). */
export const TeacherDesk: React.FC<{ x: number; y: number; s?: number; cane?: boolean; inkpot?: boolean }> = ({ x, y, s = 1, cane = true, inkpot = true }) => {
  const W = 110;
  const H = 40;
  return (
    <g transform={`translate(${f1(x)}, ${f1(y)}) scale(${s})`}>
      <ellipse cx={0} cy={1} rx={W * 0.6} ry={5} fill={P.shadow} opacity={0.3} />
      {/* the two side boards and the front apron */}
      <rect x={-W / 2} y={-H} width={8} height={H} fill={Q.desk} />
      <rect x={W / 2 - 8} y={-H} width={8} height={H} fill={Q.desk} />
      <rect x={-W / 2} y={-H} width={W} height={14} fill={Q.desk} />
      <rect x={-W / 2 + 8} y={-H + 14} width={W - 16} height={H - 14} fill="#2a1a0e" opacity={0.55} />
      <rect x={-W / 2} y={-H + 12} width={W} height={2} fill="#4a2e18" />
      {/* the sloping top, lit */}
      <path d={`M ${-W / 2 - 4} ${-H} L ${W / 2 + 4} ${-H} L ${W / 2} ${-H - 12} L ${-W / 2} ${-H - 12} Z`} fill={Q.deskTop} />
      <path d={`M ${-W / 2} ${-H - 11} L ${W / 2} ${-H - 11}`} stroke="#b88452" strokeWidth={1.4} opacity={0.7} />
      {/* a palm-leaf register and the inkpot on top */}
      <rect x={-W / 2 + 10} y={-H - 10} width={34} height={6} rx={1} fill="#d6c08a" />
      <line x1={-W / 2 + 12} y1={-H - 7} x2={-W / 2 + 42} y2={-H - 7} stroke="#8a6a3a" strokeWidth={0.6} />
      {inkpot && (
        <g transform={`translate(${W / 2 - 20}, ${-H - 8})`}>
          <ellipse cx={0} cy={0} rx={7} ry={2.5} fill="#3a2a10" opacity={0.4} />
          <path d="M -6 0 Q -7 -8 -3 -10 L 3 -10 Q 7 -8 6 0 Z" fill={Q.brass} />
          <ellipse cx={0} cy={-10} rx={3} ry={1.2} fill="#5a4214" />
          <path d="M -4 -2 Q -5 -7 -2 -9" stroke="#f2d488" strokeWidth={1} fill="none" opacity={0.8} />
        </g>
      )}
      {cane && <Cane x={-W / 2 - 18} y={-H - 9} len={W + 42} rot={-3} />}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The interior                                                        */
/* ------------------------------------------------------------------ */

/**
 * The furnished room in local units: the threshold centre at (x, y), scale k. Draws x -halfW..halfW (default 520, the
 * whole room), from the roof's underside (y -340) to the threshold (0). `inside` (world coordinates of the drawing
 * plane) is drawn after the furniture and the room's shade, before the door's light.
 */
export const PathshalaInterior: React.FC<{ x: number; y: number; k?: number; halfW?: number; f: number; inside?: React.ReactNode; doorLight?: number }> = ({
  x,
  y,
  k = 1,
  halfW = 520,
  f,
  inside,
  doorLight = 1,
}) => {
  const id = safeId(useId());
  const I = INTERIOR;
  const win = I.window;
  return (
    <g>
      <defs>
        <WeavePattern id={`pi-weave-${id}`} base={Q.inWall} line={Q.inWeave} size={14} op={0.5} />
        <linearGradient id={`pi-floor-${id}`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={Q.inFloorBack} />
          <stop offset={1} stopColor={Q.inFloorFront} />
        </linearGradient>
        <linearGradient id={`pi-shade-${id}`} gradientUnits="userSpaceOnUse" x1={0} y1={I.top} x2={0} y2={0}>
          <stop offset={0} stopColor="#2a1a0c" stopOpacity={0.55} />
          <stop offset={0.45} stopColor="#2a1a0c" stopOpacity={0.28} />
          <stop offset={0.8} stopColor="#2a1a0c" stopOpacity={0.08} />
          <stop offset={1} stopColor="#2a1a0c" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`pi-win-${id}`} cx="0.5" cy="0.4" r="0.7">
          <stop offset={0} stopColor="#fff6d8" />
          <stop offset={0.6} stopColor="#f4e2a8" />
          <stop offset={1} stopColor="#b9cc84" />
        </radialGradient>
        <linearGradient id={`pi-sun-${id}`} gradientUnits="userSpaceOnUse" x1={0} y1={-130} x2={0} y2={0}>
          <stop offset={0} stopColor="#ffe6aa" stopOpacity={0} />
          <stop offset={0.5} stopColor="#ffe2a0" stopOpacity={0.5} />
          <stop offset={1} stopColor="#ffeebc" stopOpacity={0.75} />
        </linearGradient>
        <filter id={`pi-soft-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <g transform={`translate(${f1(x)}, ${f1(y)}) scale(${k})`}>
        {/* back wall (unpainted bamboo mat) and the earth floor */}
        <rect x={-halfW} y={I.top} width={halfW * 2} height={I.backBase - I.top} fill={`url(#pi-weave-${id})`} />
        <rect x={-halfW} y={I.backBase} width={halfW * 2} height={-I.backBase} fill={`url(#pi-floor-${id})`} />
        <rect x={-halfW} y={I.backBase - 3} width={halfW * 2} height={5} fill="#6e5032" opacity={0.6} />
        {/* the barred back window, morning green and light beyond it */}
        <rect x={win.x0 - 6} y={win.y0 - 6} width={win.x1 - win.x0 + 12} height={win.y1 - win.y0 + 12} fill={Q.trimDark} />
        <rect x={win.x0} y={win.y0} width={win.x1 - win.x0} height={win.y1 - win.y0} fill={`url(#pi-win-${id})`} />
        <path d={`M ${win.x0} ${win.y1} Q ${win.x0 + 40} ${win.y1 - 26} ${win.x0 + 80} ${win.y1 - 14} Q ${win.x1 - 20} ${win.y1 - 30} ${win.x1} ${win.y1 - 18} L ${win.x1} ${win.y1} Z`} fill="#7fa04e" opacity={0.75} />
        {range(5).map((i) => (
          <rect key={i} x={win.x0 + ((i + 1) * (win.x1 - win.x0)) / 6 - 2} y={win.y0} width={4} height={win.y1 - win.y0} fill={Q.trimDark} />
        ))}
        {/* the window's soft light on the wall below it */}
        <ellipse cx={(win.x0 + win.x1) / 2} cy={win.y1 + 22} rx={110} ry={26} fill="#ffe8b8" opacity={0.18} filter={`url(#pi-soft-${id})`} />
        {/* the roof's underside, the rafters and the bamboo tie beam */}
        <rect x={-halfW} y={I.top} width={halfW * 2} height={I.beam - I.top + 6} fill={Q.rafters} />
        {range(Math.ceil(halfW / 40)).map((i) => (
          <React.Fragment key={i}>
            <line x1={i * 40} y1={I.top} x2={i * 40 + 6} y2={I.beam} stroke="#6a5038" strokeWidth={3} opacity={0.6} />
            <line x1={-i * 40} y1={I.top} x2={-i * 40 - 6} y2={I.beam} stroke="#6a5038" strokeWidth={3} opacity={0.6} />
          </React.Fragment>
        ))}
        <rect x={-halfW} y={I.beam - 2} width={halfW * 2} height={10} rx={5} fill={P.bamboo} />
        <rect x={-halfW} y={I.beam} width={halfW * 2} height={2.4} fill={P.bambooLight} opacity={0.5} />
        {/* third class: the bamboo machan along the back wall, a couple of slates left on it */}
        <BambooMachan x0={I.machan.x0} x1={I.machan.x1} y={I.machan.y} h={I.machan.h} s={0.85} />
        <Slate x={-200} y={I.machan.y - I.machan.h * 0.85 - 7} s={0.5} lie={0.85} writing={null} rot={2} />
        <Slate x={-20} y={I.machan.y - I.machan.h * 0.85 - 7} s={0.5} lie={0.85} writing={null} rot={-3} />
        {/* the teacher's place: his small seat-mat and the low desk with the cane */}
        <rect x={I.teacher.x - 40} y={I.teacher.y - 6} width={80} height={10} fill="#a86a3a" opacity={0.85} />
        <TeacherDesk x={I.desk.x} y={I.desk.y} s={I.desk.s} />
        {/* second class: the gachha stumps */}
        {I.gachha.map((g, i) => (
          <Gachha key={i} x={g.x} y={g.y} s={0.85} seed={i * 3 + 1} />
        ))}
        {/* first class: the palm-leaf mats in the front row, a slate and chalk on the right one */}
        <PalmMat x={I.matA.x} y={I.matA.y} w={I.matA.w} seed={1} />
        <PalmMat x={I.matB.x} y={I.matB.y} w={I.matB.w} seed={2} />
        <Slate x={I.matB.x - 20} y={I.matB.y + 10} s={0.72} lie={1} rot={-4} writing="অ আ" />
        <Chalk x={I.matB.x + 40} y={I.matB.y + 4} s={0.8} rot={18} />
        {/* the room's shade: darker toward the roof and the back */}
        <rect x={-halfW} y={I.top} width={halfW * 2} height={-I.top} fill={`url(#pi-shade-${id})`} />
      </g>
      {inside}
      {/* the morning light falling in through the doorway onto the floor and the front mats (screen) */}
      {doorLight > 0 && (
        <g transform={`translate(${f1(x)}, ${f1(y)}) scale(${k})`} style={{ mixBlendMode: "screen" }} opacity={0.55 * doorLight * (0.94 + 0.06 * noise1(f * 0.01, 77))}>
          <path d="M -250 0 L 210 0 L 260 -130 L -120 -130 Z" fill={`url(#pi-sun-${id})`} filter={`url(#pi-soft-${id})`} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The school building                                                 */
/* ------------------------------------------------------------------ */

/** The new four-sloped tin roof: the front slope with its ribs and sheen, the right hip in shade, ridge and eave. */
const TinRoof: React.FC = () => {
  const id = safeId(useId());
  const R = ROOF;
  const front = `M ${R.eaveX0} ${R.eaveY} L ${R.eaveX1} ${R.eaveY} L ${R.ridgeX1} ${R.ridgeY} L ${R.ridgeX0} ${R.ridgeY} Z`;
  const hip = `M ${R.eaveX1} ${R.eaveY} L ${R.backX} ${R.backY} L ${R.ridgeX1} ${R.ridgeY} Z`;
  const ribs: number[] = [];
  for (let x = R.eaveX0 + 14; x < R.eaveX1; x += 18) ribs.push(x);
  return (
    <g>
      <defs>
        <clipPath id={`pr-front-${id}`}>
          <path d={front} />
        </clipPath>
        <clipPath id={`pr-hip-${id}`}>
          <path d={hip} />
        </clipPath>
        <linearGradient id={`pr-sheen-${id}`} x1={0} y1={0} x2={1} y2={0.3}>
          <stop offset={0} stopColor="#fff6e0" stopOpacity={0.55} />
          <stop offset={0.35} stopColor="#fff2d8" stopOpacity={0.18} />
          <stop offset={0.7} stopColor="#ffffff" stopOpacity={0} />
          <stop offset={1} stopColor="#5a646a" stopOpacity={0.15} />
        </linearGradient>
      </defs>
      {/* the hip in shade, its ribs running down to its own eave */}
      <path d={hip} fill={Q.tinHip} />
      <g clipPath={`url(#pr-hip-${id})`}>
        {range(16).map((i) => {
          const u = i / 15;
          const ex = R.eaveX1 + (R.backX - R.eaveX1) * u;
          const ey = R.eaveY + (R.backY - R.eaveY) * u;
          return <line key={i} x1={ex} y1={ey} x2={R.ridgeX1 + (ex - R.ridgeX1) * 0.02} y2={R.ridgeY + 4} stroke="#7a838a" strokeWidth={1.4} opacity={0.6} />;
        })}
      </g>
      <path d={`M ${R.eaveX1} ${R.eaveY} L ${R.backX} ${R.backY}`} stroke="#6f787f" strokeWidth={5} />
      {/* the front slope */}
      <path d={front} fill={Q.tin} />
      <g clipPath={`url(#pr-front-${id})`}>
        {ribs.map((x) => (
          <React.Fragment key={x}>
            <line x1={x} y1={R.ridgeY} x2={x} y2={R.eaveY} stroke={Q.tinRib} strokeWidth={2.2} opacity={0.75} />
            <line x1={x + 3} y1={R.ridgeY} x2={x + 3} y2={R.eaveY} stroke={Q.tinLight} strokeWidth={1.2} opacity={0.6} />
          </React.Fragment>
        ))}
        {/* sheet laps */}
        <line x1={R.eaveX0} y1={(R.eaveY + R.ridgeY) / 2 + 6} x2={R.eaveX1} y2={(R.eaveY + R.ridgeY) / 2 + 6} stroke="#8e979e" strokeWidth={1.4} opacity={0.6} />
        <rect x={R.eaveX0} y={R.ridgeY} width={R.eaveX1 - R.eaveX0} height={R.eaveY - R.ridgeY} fill={`url(#pr-sheen-${id})`} />
      </g>
      {/* hip ridges, the ridge cap and the eave edge */}
      <path d={`M ${R.eaveX0} ${R.eaveY} L ${R.ridgeX0} ${R.ridgeY}`} stroke={Q.tinRidge} strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${R.eaveX1} ${R.eaveY} L ${R.ridgeX1} ${R.ridgeY}`} stroke={Q.tinRidge} strokeWidth={7} strokeLinecap="round" />
      <path d={`M ${R.ridgeX0} ${R.ridgeY} L ${R.ridgeX1} ${R.ridgeY}`} stroke={Q.tinRidge} strokeWidth={9} strokeLinecap="round" />
      <path d={`M ${R.ridgeX0} ${R.ridgeY - 2} L ${R.ridgeX1} ${R.ridgeY - 2}`} stroke="#f4f7f8" strokeWidth={2} opacity={0.8} />
      <rect x={R.eaveX0 - 4} y={R.eaveY - 3} width={R.eaveX1 - R.eaveX0 + 8} height={7} fill="#8a939a" />
      <rect x={R.eaveX0 - 4} y={R.eaveY - 3} width={R.eaveX1 - R.eaveX0 + 8} height={2} fill="#eef2f4" opacity={0.7} />
    </g>
  );
};

/** A painted post (teal) from y0 to y1, w wide. */
const PaintedPost: React.FC<{ x: number; y0: number; y1: number; w?: number }> = ({ x, y0, y1, w = 16 }) => (
  <g>
    <rect x={x - w / 2} y={y0} width={w} height={y1 - y0} fill={Q.trim} />
    <rect x={x - w / 2 + 2} y={y0} width={w * 0.28} height={y1 - y0} fill={Q.trimLight} opacity={0.55} />
    <rect x={x + w / 2 - 3} y={y0} width={3} height={y1 - y0} fill={Q.trimDark} opacity={0.6} />
  </g>
);

/** The school at its fixed place on the 0.8 plane. `inside` (world coordinates) is drawn inside the room. */
export const PathshalaBuilding: React.FC<{ f: number; inside?: React.ReactNode; doorLight?: number }> = ({ f, inside, doorLight = 1 }) => {
  const id = safeId(useId());
  const B = BUILDING;
  const sx = B.x1 + B.side;
  const dadoTop = B.plinthTop - 50;
  return (
    <g>
      <defs>
        <WeavePattern id={`pb-wall-${id}`} base={Q.wall} line={Q.wallWeave} size={16} op={0.6} />
        <WeavePattern id={`pb-dado-${id}`} base={Q.dado} line={Q.dadoWeave} size={16} op={0.6} />
        <clipPath id={`pb-door-${id}`}>
          <rect x={DOOR.x0} y={DOOR.top} width={DOOR.x1 - DOOR.x0} height={B.plinthTop - DOOR.top + 1} />
        </clipPath>
        <linearGradient id={`pb-eave-${id}`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={P.eaveShadow} stopOpacity={0.4} />
          <stop offset={1} stopColor={P.eaveShadow} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* ground shadow of the building */}
      <ellipse cx={(B.x0 + sx) / 2} cy={B.plinthBottom + 6} rx={(sx - B.x0) * 0.58} ry={16} fill={P.shadow} opacity={0.22} />

      {/* the right side wall, receding, in soft shade */}
      <path d={`M ${B.x1} ${B.eave} L ${sx} ${B.eave - B.rise} L ${sx} ${B.plinthTop - B.rise} L ${B.x1} ${B.plinthTop} Z`} fill={`url(#pb-wall-${id})`} />
      <path d={`M ${B.x1} ${dadoTop} L ${sx} ${dadoTop - B.rise} L ${sx} ${B.plinthTop - B.rise} L ${B.x1} ${B.plinthTop} Z`} fill={`url(#pb-dado-${id})`} />
      <path d={`M ${B.x1} ${B.eave} L ${sx} ${B.eave - B.rise} L ${sx} ${B.plinthTop - B.rise} L ${B.x1} ${B.plinthTop} Z`} fill="#3a2614" opacity={0.28} />
      <PaintedPost x={sx - 6} y0={B.eave - B.rise} y1={B.plinthTop - B.rise} w={12} />
      {/* the plinth: front face, top edge, the right side */}
      <path
        d={`M ${B.x1 + B.plinthOut} ${B.plinthTop} L ${sx + B.plinthOut} ${B.plinthTop - B.rise} L ${sx + B.plinthOut} ${B.plinthBottom - B.rise - 4} L ${B.x1 + B.plinthOut} ${B.plinthBottom} Z`}
        fill={P.plinthShade}
      />
      <rect x={B.x0 - B.plinthOut} y={B.plinthTop} width={B.x1 - B.x0 + 2 * B.plinthOut} height={B.plinthBottom - B.plinthTop} fill={P.plinthFace} />
      <rect x={B.x0 - B.plinthOut} y={B.plinthTop - 3} width={B.x1 - B.x0 + 2 * B.plinthOut} height={6} fill={P.plinthTop} />
      <rect x={B.x0 - B.plinthOut} y={B.plinthBottom - 8} width={B.x1 - B.x0 + 2 * B.plinthOut} height={8} fill={P.plinthShade} opacity={0.5} />
      {range(9).map((i) => (
        <path key={i} d={`M ${B.x0 + 30 + i * 120} ${B.plinthTop + 14 + 10 * (i % 2)} q 40 -6 80 0`} stroke={P.wallStroke} strokeWidth={1.6} fill="none" opacity={0.5} />
      ))}

      {/* the room, seen through the doorway */}
      <g clipPath={`url(#pb-door-${id})`}>
        <PathshalaInterior x={DOOR.cx} y={B.plinthTop} f={f} inside={inside} doorLight={doorLight} halfW={(DOOR.x1 - DOOR.x0) / 2 + 20} />
        {/* the two plank leaves, opened inward against the room's front wall */}
        {[-1, 1].map((sd) => {
          const xe = sd < 0 ? DOOR.x0 : DOOR.x1;
          const xi = xe - sd * 46;
          return (
            <g key={sd}>
              <path d={`M ${xe} ${DOOR.top} L ${xi} ${DOOR.top + 16} L ${xi} ${B.plinthTop - 10} L ${xe} ${B.plinthTop}`} fill={Q.trimDark} />
              {[0.33, 0.66].map((u) => (
                <line key={u} x1={xe + (xi - xe) * u} y1={DOOR.top + 16 * u} x2={xe + (xi - xe) * u} y2={B.plinthTop - 10 * u} stroke="#24403b" strokeWidth={1.4} opacity={0.7} />
              ))}
              <path d={`M ${xi} ${DOOR.top + 16} L ${xi} ${B.plinthTop - 10}`} stroke={Q.trimLight} strokeWidth={2} opacity={0.5} />
            </g>
          );
        })}
        <rect x={DOOR.x0} y={B.plinthTop - 4} width={DOOR.x1 - DOOR.x0} height={5} fill={Q.desk} />
      </g>

      {/* the painted front wall around the doorway and windows */}
      <path
        d={`M ${B.x0} ${B.eave} L ${B.x1} ${B.eave} L ${B.x1} ${B.plinthTop} L ${DOOR.x1} ${B.plinthTop} L ${DOOR.x1} ${DOOR.top} L ${DOOR.x0} ${DOOR.top} L ${DOOR.x0} ${B.plinthTop} L ${B.x0} ${B.plinthTop} Z`}
        fill={`url(#pb-wall-${id})`}
      />
      <rect x={B.x0} y={dadoTop} width={DOOR.x0 - B.x0} height={B.plinthTop - dadoTop} fill={`url(#pb-dado-${id})`} />
      <rect x={DOOR.x1} y={dadoTop} width={B.x1 - DOOR.x1} height={B.plinthTop - dadoTop} fill={`url(#pb-dado-${id})`} />
      {/* painted battens: the mid rail and the dado rail */}
      {[
        [B.x0, DOOR.x0],
        [DOOR.x1, B.x1],
      ].map(([a, b]) => (
        <g key={a}>
          <rect x={a} y={dadoTop - 4} width={b - a} height={6} fill={Q.trim} />
          <rect x={a} y={B.eave + 64} width={b - a} height={5} fill={Q.trim} opacity={0.9} />
        </g>
      ))}
      {/* the windows: teal frames, wooden bars, the dim room behind */}
      {WINDOWS.map((w, i) => (
        <g key={i}>
          <rect x={w.x0 - 8} y={w.y0 - 8} width={w.x1 - w.x0 + 16} height={w.y1 - w.y0 + 16} fill={Q.trim} />
          <rect x={w.x0} y={w.y0} width={w.x1 - w.x0} height={w.y1 - w.y0} fill="#3a2a1a" />
          <rect x={w.x0} y={w.y0} width={w.x1 - w.x0} height={(w.y1 - w.y0) * 0.5} fill="#5a4630" opacity={0.6} />
          {range(5).map((k) => (
            <rect key={k} x={w.x0 + ((k + 1) * (w.x1 - w.x0)) / 6 - 3} y={w.y0} width={6} height={w.y1 - w.y0} fill={Q.trimDark} />
          ))}
          <rect x={w.x0 - 10} y={w.y1 + 6} width={w.x1 - w.x0 + 20} height={6} fill={Q.trimDark} />
        </g>
      ))}
      {/* the door frame and lintel */}
      <PaintedPost x={DOOR.x0 - 6} y0={DOOR.top - 12} y1={B.plinthTop} w={16} />
      <PaintedPost x={DOOR.x1 + 6} y0={DOOR.top - 12} y1={B.plinthTop} w={16} />
      <rect x={DOOR.x0 - 16} y={DOOR.top - 14} width={DOOR.x1 - DOOR.x0 + 32} height={16} fill={Q.trim} />
      <rect x={DOOR.x0 - 16} y={DOOR.top - 14} width={DOOR.x1 - DOOR.x0 + 32} height={4} fill={Q.trimLight} opacity={0.6} />
      {/* the corner posts */}
      <PaintedPost x={B.x0 + 8} y0={B.eave} y1={B.plinthTop} />
      <PaintedPost x={B.x1 - 8} y0={B.eave} y1={B.plinthTop} />
      {/* the eave's shadow on the wall */}
      <rect x={B.x0} y={B.eave} width={B.x1 - B.x0} height={46} fill={`url(#pb-eave-${id})`} />
      <path d={`M ${B.x1} ${B.eave} L ${sx} ${B.eave - B.rise} L ${sx} ${B.eave - B.rise + 40} L ${B.x1} ${B.eave + 46} Z`} fill={`url(#pb-eave-${id})`} />
      {/* the mud step before the doorway */}
      <rect x={STEP.x0} y={STEP.y - 2} width={STEP.x1 - STEP.x0} height={STEP.h + 2} fill={P.plinthFace} />
      <rect x={STEP.x0} y={STEP.y - 3} width={STEP.x1 - STEP.x0} height={4} fill={P.plinthLight} />
      <TinRoof />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Layers                                                              */
/* ------------------------------------------------------------------ */

/** Palms and bananas behind the school (0.5), the Ujanchar trees in a new arrangement. */
export const PathshalaTreesLayer: React.FC<{ f: number; cam?: Cam; calm?: number }> = ({ f, cam, calm = 1 }) => (
  <Layer depth={PLANES.trees} extraBlur={ujancharBgBlur(PLANES.trees, calm, cam)}>
    {[
      [-1300, 1.1, 6],
      [-560, 1.05, 2],
      [180, 1.2, 5],
      [1500, 1.25, 8],
      [2160, 1.1, 4],
      [2900, 1.2, 9],
      [3500, 1.1, 3],
    ].map(([x, s, sd]) => (
      <Palm key={`p${x}`} x={x} y={860} s={s} f={f} seed={sd} />
    ))}
    {[-900, -200, 620, 1180, 1820, 2500, 3200].map((x, i) => (
      <Banana key={`b${x}`} x={x} y={866} s={1.5 + 0.2 * hashS(i * 3 + 1)} f={f} />
    ))}
  </Layer>
);

/** Sky, jungle and trees, inside the calm CAM-11 treatment. */
export const PathshalaBackdrop: React.FC<{ f: number; cam?: Cam; calm?: number }> = ({ f, cam, calm = 1 }) => (
  <>
    <UjancharSkyLayer f={f} time="morning" cam={cam} calm={calm} />
    <UjancharJungleLayer f={f} time="morning" cam={cam} calm={calm} />
    <PathshalaTreesLayer f={f} cam={cam} calm={calm} />
  </>
);

export interface PathshalaSchoolLayerProps {
  f: number;
  cam?: Cam;
  /** CAM-11 background treatment of this plane, 0..1 (default 0: the school is the subject). */
  calm?: number;
  inside?: React.ReactNode;
  front?: React.ReactNode;
  mango?: boolean;
  doorLight?: number;
}

/** Depth 0.8: the yard earth, the fence runs and bushes, the school with its room, the mango tree beside it. */
export const PathshalaSchoolLayer: React.FC<PathshalaSchoolLayerProps> = ({ f, cam, calm = 0, inside, front, mango = true, doorLight = 1 }) => (
  <Layer depth={PLANES.school} extraBlur={ujancharBgBlur(PLANES.school, calm, cam)}>
    <rect x={-1500} y={GROUND_TOP} width={5000} height={YARD_BOTTOM - GROUND_TOP} fill={P.yard} />
    <path d={`M -1500 ${GROUND_TOP} Q 960 ${GROUND_TOP - 8} 3500 ${GROUND_TOP} L 3500 ${GROUND_TOP + 30} L -1500 ${GROUND_TOP + 30} Z`} fill="#8e6a42" opacity={0.5} />
    <FenceAt x0={-1500} x1={60} base={GROUND_TOP + 4} k={0.62} seed={23} />
    <FenceAt x0={1760} x1={3500} base={GROUND_TOP + 4} k={0.62} seed={29} />
    {[
      [-1200, 220, 4],
      [-520, 260, 7],
      [1700, 220, 11],
      [2300, 240, 13],
      [2900, 220, 17],
    ].map(([x, w, sd]) => (
      <g key={x} transform={`translate(${x}, ${GROUND_TOP + 10}) scale(0.62)`}>
        <UjancharBush x={0} y={0} w={w} f={f} seed={sd} />
      </g>
    ))}
    <PathshalaBuilding f={f} inside={inside} doorLight={doorLight} />
    {/* bushes at the plinth's foot */}
    <g transform={`translate(${BUILDING.x1 + BUILDING.side + 60}, ${BUILDING.plinthBottom}) scale(0.55)`}>
      <UjancharBush x={0} y={0} w={200} f={f} seed={31} />
    </g>
    <g transform={`translate(${BUILDING.x0 - 10}, ${BUILDING.plinthBottom + 2}) scale(0.5)`}>
      <UjancharBush x={0} y={0} w={170} f={f} seed={37} />
    </g>
    {mango && <MangoTree x={MANGO.x} y={MANGO.y} s={MANGO.s} f={f} seed={MANGO.seed} />}
    {front}
  </Layer>
);

/** Depth 1: the school yard, beaten earth with broom sweeps and a worn path to the step. */
export const PathshalaFloorLayer: React.FC<{ f: number; under?: React.ReactNode; children?: React.ReactNode }> = ({ under, children }) => (
  <Layer depth={PLANES.floor}>
    <path d={`M -1500 ${FLOOR_TOP} Q 960 ${FLOOR_TOP - 10} 3500 ${FLOOR_TOP} L 3500 ${FLOOR_BOTTOM} L -1500 ${FLOOR_BOTTOM} Z`} fill={P.floor} />
    {[-1100, -620, -200, 300, 1500, 1900, 2400, 2900, 3300].map((x, i) => (
      <path key={x} d={`M ${x} ${980 + 30 * (i % 2)} q 90 -18 180 0`} stroke={P.floorSweep} strokeWidth={2} fill="none" opacity={0.35} />
    ))}
    <path d={`M 860 ${FLOOR_TOP} Q 840 1000 760 ${FLOOR_BOTTOM} L 1240 ${FLOOR_BOTTOM} Q 1080 1000 1040 ${FLOOR_TOP} Z`} fill="#c69a66" opacity={0.4} />
    {range(10).map((i) => (
      <g key={i} transform={`translate(${f1(-300 + i * 330 + 90 * hashS(i * 3))}, ${f1(950 + 200 * hashS(i * 7))}) rotate(${f1(360 * hashS(i * 5))}) scale(1, 0.4)`}>
        <path d="M 0 0 Q 16 -9 34 -2 Q 18 5 0 0 Z" fill={i % 2 ? "#5d7a2e" : "#8a7a3a"} opacity={0.7} />
      </g>
    ))}
    {under}
    {children}
  </Layer>
);

/** Soft morning light from the upper left (screen): a broad warm wash, two soft shafts past the mango tree, motes. */
export const PathshalaLightLayer: React.FC<{ f: number; level?: number; mask?: string }> = ({ f, level = 1, mask }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", opacity: 0.55 * level, WebkitMaskImage: mask, maskImage: mask }}>
    <Layer depth={PLANES.light}>
      <defs>
        <linearGradient id="pp-shaft" gradientUnits="userSpaceOnUse" x1={0} y1={-100} x2={0} y2={1000}>
          <stop offset="0" stopColor="#fff0c8" stopOpacity={0} />
          <stop offset="0.3" stopColor="#ffe8b0" stopOpacity={0.7} />
          <stop offset="1" stopColor="#ffd890" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="pp-wash" cx="0.2" cy="0.15" r="0.8">
          <stop offset="0" stopColor="#ffe8b8" stopOpacity={0.55} />
          <stop offset="0.6" stopColor="#ffdca0" stopOpacity={0.12} />
          <stop offset="1" stopColor="#ffdca0" stopOpacity={0} />
        </radialGradient>
        <filter id="pp-shaft-blur" x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      <rect x={-600} y={-300} width={3200} height={1600} fill="url(#pp-wash)" />
      <g filter="url(#pp-shaft-blur)" opacity={0.3}>
        {[
          [120, 70, 0],
          [380, 50, 2.1],
        ].map(([x, w, ph], i) => {
          const xt = x + 14 * Math.sin(f * 0.008 + ph);
          const a = 0.7 + 0.3 * noise1(f * 0.015, 300 + i);
          return <polygon key={i} points={`${xt - w / 2},-100 ${xt + w / 2},-100 ${xt + 420 + w * 1.6},1000 ${xt + 420 - w * 1.6},1000`} fill="url(#pp-shaft)" opacity={a} />;
        })}
      </g>
      {range(18).map((i) => {
        const period = 260 + 90 * hashS(i * 1.9);
        const ph = ((((f + hashS(i * 4.3) * period) % period) + period) % period) / period;
        const x = 300 + 1300 * hashS(i * 7.1) + 26 * Math.sin(f * 0.012 + i * 2.3) + 24 * ph;
        const y = 380 + 460 * hashS(i * 3.7) - 40 * ph;
        const o = 0.4 * Math.pow(Math.sin(Math.PI * ph), 1.2);
        return (
          <g key={i} opacity={o}>
            <circle cx={x} cy={y} r={4} fill="#fff0c4" opacity={0.25} />
            <circle cx={x} cy={y} r={1.3} fill="#fff8e2" />
          </g>
        );
      })}
    </Layer>
  </div>
);

/** The near grass, bokeh and leaves: the Ujanchar foreground in the morning. */
export const PathshalaForegroundLayer: React.FC<{ f: number; grass?: boolean; leaves?: boolean; bokeh?: boolean }> = ({ f, grass = true, leaves = false, bokeh = true }) => (
  <UjancharForegroundLayer f={f} time="morning" grass={grass} leaves={leaves} bokeh={bokeh} />
);

/* ------------------------------------------------------------------ */
/* The whole set                                                       */
/* ------------------------------------------------------------------ */

export interface LababuPathshalaProps extends PathshalaSchoolLayerProps {
  /** CAM-11 treatment of the far planes (default 1). The school plane uses `schoolCalm` (default 0). */
  schoolCalm?: number;
  /** ReactNode on the floor plane (depth 1) under the characters. */
  under?: React.ReactNode;
  /** ReactNode on the floor plane (depth 1): characters in the yard. */
  floor?: React.ReactNode;
  light?: boolean;
  lightLevel?: number;
  lightMask?: string;
  foreground?: boolean;
  leaves?: boolean;
  grade?: boolean;
}

/** The whole pathshala set in plane order, with optional characters inside the room and in the yard, and the Grade. */
export const LababuPathshala: React.FC<LababuPathshalaProps> = ({
  f,
  cam,
  calm = 1,
  schoolCalm = 0,
  inside,
  front,
  mango = true,
  doorLight = 1,
  under,
  floor,
  light = true,
  lightLevel = 1,
  lightMask,
  foreground = true,
  leaves = false,
  grade = true,
}) => (
  <>
    <PathshalaBackdrop f={f} cam={cam} calm={calm} />
    <PathshalaSchoolLayer f={f} cam={cam} calm={schoolCalm} inside={inside} front={front} mango={mango} doorLight={doorLight} />
    <PathshalaFloorLayer f={f} under={under}>
      {floor}
    </PathshalaFloorLayer>
    {light && <PathshalaLightLayer f={f} level={lightLevel} mask={lightMask} />}
    {(foreground || leaves) && <PathshalaForegroundLayer f={f} grass={foreground} bokeh={foreground} leaves={leaves} />}
    {grade && <Grade {...pathshalaGrade()} />}
  </>
);
