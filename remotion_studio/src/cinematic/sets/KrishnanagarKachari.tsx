import React, { useId } from "react";
import { clamp, lerp, noise1, safeId } from "../core/anim";
import { Cam, Grade, Layer } from "../core/Stage";
import { Banana, Palm } from "./S01_DaySets";
import {
  UJANCHAR_PALETTE as P,
  UjancharBush,
  UjancharFenceRun,
  UjancharForegroundLayer,
  UjancharJungleLayer,
  UjancharKolshi,
  UjancharBroom,
  UjancharLightLayer,
  UjancharSkyLayer,
  ujancharBgBlur,
  ujancharBgFilter,
  ujancharHash as hashS,
} from "./UjancharHouse";

/**
 * THE KRISHNANAGAR KACHARI (কৃষ্ণনগর কাছারি): Episode 5's set (STO-20), three views of one place.
 *
 * Built from the Ujanchar village house's own pieces and materials (src/cinematic/sets/UjancharHouse.tsx: the same
 * thatch, mud walls, bamboo posts and lattice fence, clay pots, bushes, jungle, sky, light shafts, near grass and the
 * CAM-11 background grade), so the neighbour's house and the grove belong to the same world as the family's house.
 *
 *  "compound"  late morning. The kachari at left (a long single-storey lime-washed brick building on a raised plinth,
 *              tiled roof, deep front veranda with square pillars, a sloping clerk's desk with ledgers, a bench), the
 *              big mango tree, the neighbour's mud house at right with its corner room (কোণের ঘর) stepping forward,
 *              the bamboo fence with a gap toward the family's house (a bit of its thatch beyond), jungle beyond.
 *              Scene 01 shot 1. Characters are small: they go in the `yard` slot on the 0.65 plane.
 *  "corner"    late morning. The neighbour's courtyard corner (scene 01 shots 2 to 6): the corner room big on the
 *              left (0.85 plane; its right side wall is the corner Binoy comes round), the neighbour's main house
 *              behind with Binoy's mother's door, the fence with the gap where Charu and Surendra come in, clay pots,
 *              the beaten-earth yard, the tipped bamboo basket. Characters on the floor plane (depth 1).
 *  "grove"     warm early afternoon. Behind the kachari (scene 02): its back wall and back door at left (0.8 plane),
 *              the cucumber trellis against it (floor plane; `trellisTorn` 0 whole .. 1 torn), the path from the
 *              door, the banana grove filling the right in deep planes (0.5, 0.65, 0.85 and near plants on the
 *              floor), dappled moving light. The cow can hide BEHIND a banana clump on the 0.85 plane: the plants
 *              behind her and the clump in front of her are separate layers (`cow` slot between them).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * API (everything renders INSIDE a <Stage>; the layer components wrap their own <Layer>)
 * ---------------------------------------------------------------------------------------------------------------
 *  Quick use:
 *    const cam = kachariKeepInSet("corner", rawCam);
 *    <Stage cam={cam} background={KACHARI_BG.corner}>
 *      <KrishnanagarKachari view="corner" f={lifeF} cam={cam} veranda={mother} cornerBehind={binoy}
 *        floor={<>balak, tortoises, Charu ...</>} />
 *    </Stage>
 *
 *  Or layer by layer (characters between the planes, their own rack-focus layers):
 *    <KachariBackdrop view f cam calm veranda yard cornerBehind mid doorway doorOpen cow basket />
 *        sky 0.15, jungle 0.35, trees 0.5, back 0.65, (grove) wall 0.8, mid 0.85, inside the calm CAM-11 grade
 *    <KachariFloorLayer view f trellisTorn basket under>{characters}</KachariFloorLayer>     depth 1
 *    <KachariLightLayer view f level mask />       screen light: sun shafts and dust (grove: dapples and shafts)
 *    <KachariForegroundLayer view f grass leaves bokeh />
 *    <Grade {...kachariGrade(view)} />
 *  The planes one by one: KachariSkyLayer, KachariJungleLayer, KachariTreesLayer, KachariBackLayer,
 *  KachariWallLayer (grove), KachariMidLayer (corner: the corner room; grove: behind-cow plants + cow + screen),
 *  KachariGroveBehindCowLayer, KachariGroveCowScreenLayer (the cow-hiding split, both on 0.85).
 *
 *  Common props
 *    view     "compound" | "corner" | "grove".
 *    f        LIFE clock (lifeF): leaf sway, clouds, smoke, dapples. Never a held story clock.
 *    cam      the Stage cam (optional; only for the CAM-11 depth blur so the camera's DOF is not doubled).
 *    calm     0..1 (default 1): the CAM-11 background treatment, exactly as the Ujanchar house.
 *  Slots (ReactNodes, drawn in that plane's coordinates)
 *    veranda       0.65. compound: on the kachari veranda floor, behind the clerk's desk (the clerk: KACHARI.compound.clerk).
 *                  corner: in the neighbour's main-house doorway, behind the door frame (Binoy's mother: .corner.motherDoor).
 *    yard          0.65, in front of the buildings and fence. compound: Balak, tortoises, basket (small); corner: anything far.
 *    cornerBehind  0.85 (corner): drawn BEHIND the corner room, so a figure walking right comes round its corner
 *                  (Binoy: .corner.binoyHidden -> .corner.binoyStop).
 *    mid           0.85 (corner): in front of the corner room (a figure standing by it).
 *    doorway       0.8 (grove): inside the kachari's back door opening, behind the frame and door leaf (Haricharan at
 *                  .grove.backDoor). doorOpen 0..1 (default 1) swings the leaf outward.
 *    cowScreenOpacity  0..1 (default 1): the clump in front of the cow (QA, or a reveal).
 *    cow           ReactNode drawn on the 0.85 plane between the plants behind the cow and the clump in front of her
 *                  (grove). Draw the cow there at .grove.cowHide (or wrap her in your own <Layer depth={0.85}>: it is
 *                  inserted raw, inside the calm filter).
 *  Props
 *    basket       (default true in compound and corner) the tipped bamboo basket at .basket.
 *    trellisTorn  0 (default) whole .. 1 torn (grove): values between animate the pull (key it on the story clock).
 *
 *  Pieces (exported): BambooBasket { x, y, s?, tipped? }; CucumberTrellis { x, y, s?, f, torn? } (also
 *    trellisPoint(torn, k) for the cow's mouth and Balak's point); BananaPlant { x, y, s?, f, seed?, leaves?, dead?,
 *    flower?, tone?, lean?, suckers?, tears? }; MangoTree { x, y, s?, f, seed? }; MudHouse { x, y, w, s?, f, door?,
 *    window?, corner?, ... }; KachariFront { x, y, s, w?, f, veranda? }; KachariBack { x0, x1, y, s, door, windows, f,
 *    doorOpen?, doorway? }.
 *  Constants: KACHARI (planes, per-view cams, extents and placement points), KACHARI_BG[view]; helpers
 *    kachariGrade(view), kachariKeepInSet(view, cam).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * PLACEMENT POINTS: KACHARI[view].<name> = { x, y, depth, s?, flip? } (y = feet / base; s = a suggested Puppet scale
 * for an adult at that point, or the prop's scale). Draw the character in the layer of that depth.
 * ---------------------------------------------------------------------------------------------------------------
 *  compound (depth 0.65 unless noted; adult s 0.26): clerk (seated behind the desk), desk, bench, kachariSteps,
 *    balak, tortoises[0..3], basket, cornerRoomCorner, motherDoor, fenceGap, familyThatch, mango.
 *  corner (floor depth 1, adult s 1.15 unless noted): balak, tortoises[0..3], basket, charuKneel, surendraStand,
 *    binoyHidden / binoyStop (0.85, s 0.75), motherDoor (0.65, s 0.46), fenceGap (0.65, s 0.46), fenceEntry
 *    (floor, where they reach the yard), cornerRoomCorner (0.85).
 *  grove (floor depth 1, adult s 1.1 unless noted): balak (seated), pebbles, trellis, trellisRoot, cowAtTrellis
 *    (flip: faces the trellis), cowFlight[] (path into the grove), cowHide (0.85, s 1.05: behind the screen clump),
 *    cowStepOut (floor, P3: before Balak), backDoor (0.8, s 0.75: in the doorway), doorStep (floor: where he lands),
 *    haricharanPath[] (door -> over Balak), haricharanStop.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SAFE CAMERA RANGE (CAM-08): kachariKeepInSet(view, cam) clamps any cam (zoom 1..3) so no plane's edge shows, with
 * soft corners. Extents: compound and corner x -1500..3500 on the floor and 0.65 planes (jungle and trees to 3800,
 * sky to 4200), so at zoom 1 cam.x is about -1500..1580; grove x -1500..3400 (cam.x about -1500..1480). Upward
 * tilts are clamped at cam.y -200; downward to the floor's bottom (y 1500). The default framings are
 * KACHARI[view].cam. Keep faces and action above y 820 on screen (the captions band): the ground line of the floor
 * plane is y 900 to 960, so close shots raise it with cam.y (the low tortoise close: zoom 2.4, cam.y about 330).
 *
 * Planes, back to front: 0.15 sky; 0.35 jungle; 0.5 palms, bananas, mango, the family's thatch; 0.65 the back of the
 * yard (buildings, fence, bushes; grove: a banana row and a low fence); 0.8 the kachari's back wall (grove); 0.85
 * the corner room (corner) or the near grove clumps (grove); 1 the floor (characters; the trellis, the basket, near
 * banana plants); 0.95 light (screen); 1.35 near grass and litter; 1.6 near leaves.
 */

export type KachariView = "compound" | "corner" | "grove";

export interface KPoint {
  x: number;
  y: number;
  depth: number;
  s?: number;
  flip?: boolean;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const PLANES = { sky: 0.15, jungle: 0.35, trees: 0.5, back: 0.65, wall: 0.8, mid: 0.85, light: 0.95, floor: 1, grass: 1.35, leaves: 1.6 } as const;

interface ViewExtents {
  setX: Array<[number, number, number]>;
  floorTop: number;
  yardBottom: number;
  yardDepth: number;
  floorBottom: number;
}

const EXTENTS: Record<KachariView, ViewExtents> = {
  compound: {
    setX: [
      [1, -1500, 3500],
      [0.65, -1500, 3500],
      [0.5, -1800, 3800],
      [0.35, -1800, 3800],
      [0.15, -2200, 4200],
    ],
    floorTop: 880,
    yardBottom: 1100,
    yardDepth: 0.65,
    floorBottom: 1500,
  },
  corner: {
    setX: [
      [1, -1500, 3500],
      [0.85, -1500, 3500],
      [0.65, -1500, 3500],
      [0.5, -1800, 3800],
      [0.35, -1800, 3800],
      [0.15, -2200, 4200],
    ],
    floorTop: 880,
    yardBottom: 1100,
    yardDepth: 0.65,
    floorBottom: 1500,
  },
  grove: {
    setX: [
      [1, -1500, 3400],
      [0.85, -1500, 3400],
      [0.8, -1500, 3400],
      [0.65, -1600, 3600],
      [0.5, -1800, 3800],
      [0.35, -1800, 3800],
      [0.15, -2200, 4200],
    ],
    floorTop: 872,
    yardBottom: 1100,
    yardDepth: 0.8,
    floorBottom: 1500,
  },
};

/* geometry shared by the drawing code and the placement points */
const C_KACHARI = { x: -200, y: 806, s: 0.6, w: 1700 };
const C_MAIN = { x: 1220, y: 812, s: 0.55, w: 910, door: 600, window: 250 };
const C_CORNER = { x: 1010, y: 826, s: 0.62, w: 470, window: 170 };
const C_GAP = { x0: 1790, x1: 1870, base: 806, k: 0.6 };
const N_MAIN = { x: 300, y: 852, s: 1, w: 1080, door: 820, window: 260 };
const N_CORNER = { x: -900, y: 884, s: 1.6, w: 800, window: 300 };
const N_GAP = { x0: 1760, x1: 1880 };
const G_BACK = { x0: -1500, x1: 860, y: 872, s: 1.65, door: 560, windows: [-480, 120] };
const G_TRELLIS = { x: 330, y: 905, s: 1 };
const G_HIDE = { x: 1650, y: 892, s: 1.05 };

const pt = (x: number, y: number, depth: number, s?: number, flip?: boolean): KPoint => ({ x, y, depth, s, flip });

export const KACHARI = {
  PLANES,
  EXTENTS,
  compound: {
    cam: { x: 0, y: 60, zoom: 1 } as Cam,
    adultS: 0.26,
    clerk: pt(C_KACHARI.x + 520 * C_KACHARI.s, C_KACHARI.y - 64 * C_KACHARI.s, 0.65, 0.26),
    desk: pt(C_KACHARI.x + 520 * C_KACHARI.s, C_KACHARI.y - 64 * C_KACHARI.s, 0.65),
    bench: pt(C_KACHARI.x + 1180 * C_KACHARI.s, C_KACHARI.y - 64 * C_KACHARI.s, 0.65),
    kachariSteps: pt(C_KACHARI.x + 850 * C_KACHARI.s, C_KACHARI.y + 4, 0.65, 0.26),
    balak: pt(1340, 838, 0.65, 0.26),
    tortoises: [pt(1300, 842, 0.65, 0.22), pt(1372, 846, 0.65, 0.22), pt(1410, 838, 0.65, 0.22), pt(1268, 846, 0.65, 0.22)],
    basket: pt(1262, 834, 0.65, 0.3),
    cornerRoomCorner: pt(C_CORNER.x + C_CORNER.w * C_CORNER.s, C_CORNER.y, 0.65),
    motherDoor: pt(C_MAIN.x + C_MAIN.door * C_MAIN.s, C_MAIN.y - 46 * C_MAIN.s, 0.65, 0.25),
    fenceGap: pt((C_GAP.x0 + C_GAP.x1) / 2, C_GAP.base, 0.65, 0.25),
    familyThatch: pt(1960, 760, 0.5),
    mango: pt(980, 806, 0.5),
  },
  corner: {
    cam: { x: 60, y: 80, zoom: 1 } as Cam,
    adultS: 1.15,
    balak: pt(760, 938, 1, 1.15),
    tortoises: [pt(700, 930, 1, 1), pt(880, 948, 1, 1), pt(985, 926, 1, 1), pt(600, 946, 1, 1)],
    basket: pt(500, 914, 1, 1),
    charuKneel: pt(890, 952, 1, 1.15),
    surendraStand: pt(1040, 940, 1, 1.15),
    binoyHidden: pt(250, 884, 0.85, 0.75),
    binoyStop: pt(560, 886, 0.85, 0.75),
    motherDoor: pt(N_MAIN.x + N_MAIN.door, N_MAIN.y - 46, 0.65, 0.46),
    fenceGap: pt((N_GAP.x0 + N_GAP.x1) / 2, 856, 0.65, 0.46),
    fenceEntry: pt(1660, 912, 1, 1.15),
    cornerRoomCorner: pt(N_CORNER.x + N_CORNER.w * N_CORNER.s, N_CORNER.y, 0.85),
  },
  grove: {
    cam: { x: 0, y: 40, zoom: 1 } as Cam,
    adultS: 1.1,
    balak: pt(1340, 958, 1, 1.1),
    pebbles: pt(1268, 978, 1),
    trellis: pt(G_TRELLIS.x, G_TRELLIS.y, 1, G_TRELLIS.s),
    trellisRoot: pt(G_TRELLIS.x - 250 * G_TRELLIS.s, G_TRELLIS.y + 6, 1),
    cowAtTrellis: pt(760, 914, 1, 1.25, true),
    cowFlight: [pt(760, 914, 1, 1.25), pt(1060, 902, 1, 1.2), pt(1420, 892, 1, 1.12), pt(G_HIDE.x, G_HIDE.y, 0.85, G_HIDE.s)],
    cowHide: pt(G_HIDE.x, G_HIDE.y, 0.85, G_HIDE.s, false),
    cowStepOut: pt(1560, 948, 1, 1.2, true),
    backDoor: pt(G_BACK.door, G_BACK.y - 36 * G_BACK.s, 0.8, 0.75),
    doorStep: pt(G_BACK.door + 70, 900, 1, 1.1),
    haricharanPath: [pt(G_BACK.door + 70, 900, 1, 1.1), pt(860, 922, 1, 1.1), pt(1060, 940, 1, 1.1), pt(1180, 952, 1, 1.1)],
    haricharanStop: pt(1180, 952, 1, 1.1),
  },
} as const;

/** Stage background per view (shows only through the soft edges of blurred layers). */
export const KACHARI_BG: Record<KachariView, string> = { compound: P.bg, corner: P.bg, grove: "#e9d3a4" };

/** Grade per view: the Ujanchar morning grade for the late-morning views; warmer and lower for the afternoon grove. */
export const kachariGrade = (view: KachariView): React.ComponentProps<typeof Grade> =>
  view === "grove"
    ? { warmth: 0.55, vignette: 0.5, grain: 0.04, bloomAt: [74, 26], tint: "#ffe4c0", tintAmount: 0.08 }
    : { warmth: 0.45, vignette: 0.5, grain: 0.04, bloomAt: [64, 36] };

const smax = (a: number, b: number, k: number) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
const smin = (a: number, b: number, k: number) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + k * k));

/** Clamps a Stage cam so no plane's edge comes into frame in that view (soft corners). Keeps every other cam field. */
export const kachariKeepInSet = <C extends Cam>(view: KachariView, c: C): C => {
  const E = EXTENTS[view];
  const EDGE = 16;
  const z = Math.max(1, c.zoom);
  let lo = -Infinity;
  let hi = Infinity;
  for (const [d, x0, x1] of E.setX) {
    const s = Math.pow(z, d);
    lo = Math.max(lo, (x0 + EDGE - 960 + 960 / s) / d);
    hi = Math.min(hi, (x1 - EDGE - 960 - 960 / s) / d);
  }
  const w = Math.pow(z, E.yardDepth);
  const den = z - E.yardDepth * w;
  const yLo = den > 1e-6 ? Math.max(-200, (z * (E.floorTop - 540) - w * (E.yardBottom - 540) + 6) / den) : -200;
  const yHi = E.floorBottom - EDGE - 540 - 540 / z;
  return { ...c, x: smin(smax(c.x, lo, 24), hi, 24), y: smin(smax(c.y, yLo, 24), yHi, 24) };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sstep = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const f1 = (n: number) => n.toFixed(1);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** A run of the Ujanchar bamboo fence at any size: from x0 to x1 (plane px), base on `base`, scaled by k. */
const FenceAt: React.FC<{ x0: number; x1: number; base: number; k?: number; seed: number }> = ({ x0, x1, base, k = 1, seed }) => {
  // the Ujanchar fence's lattice starts 120 px before its first post: clip it to the run, so a gap stays open
  const id = safeId(useId());
  return (
    <g>
      <defs>
        <clipPath id={`kf-${id}`}>
          <rect x={x0 - 6 * k} y={base - 260 * k} width={x1 - x0 + 12 * k} height={280 * k} />
        </clipPath>
      </defs>
      <g clipPath={`url(#kf-${id})`}>
        <g transform={`translate(${x0}, ${base}) scale(${k}) translate(0, -862)`}>
          <UjancharFenceRun x0={0} x1={(x1 - x0) / k} seed={seed} />
        </g>
      </g>
    </g>
  );
};

/** A taller bamboo gate post at a fence gap. */
const GatePost: React.FC<{ x: number; base: number; k?: number }> = ({ x, base, k = 1 }) => (
  <g transform={`translate(${x}, ${base}) scale(${k})`}>
    <rect x={-7} y={-190} width={14} height={192} rx={5} fill={P.bamboo} />
    <rect x={-3} y={-190} width={4} height={192} fill={P.bambooLight} opacity={0.45} />
    {[0.25, 0.55, 0.82].map((q) => (
      <rect key={q} x={-8} y={-190 * q} width={16} height={4} fill={P.bambooTie} />
    ))}
  </g>
);

const BushAt: React.FC<{ x: number; y: number; w: number; f: number; seed: number; k?: number }> = ({ x, y, w, f, seed, k = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${k})`}>
    <UjancharBush x={0} y={0} w={w} f={f} seed={seed} />
  </g>
);

/* ------------------------------------------------------------------ */
/* The neighbour's mud house (Ujanchar hut, parametric)                 */
/* ------------------------------------------------------------------ */

/** Local geometry of the Ujanchar hut (plane px at s 1, relative to the plinth's bottom). */
const HUT_L = { top: -46, eave: -234, ridge: -416 };

export interface MudHouseProps {
  /** left end of the plinth (plane px) */
  x: number;
  /** bottom of the plinth (plane px) */
  y: number;
  /** length in local units (the Ujanchar hut is 1630) */
  w: number;
  s?: number;
  f: number;
  /** door centre in local units from the left end (null: no door) */
  door?: number | null;
  /** barred window centre in local units (null: none) */
  window?: number | null;
  /** draw the right end's side wall and hip (the house's corner) */
  corner?: boolean;
  /** local x of veranda posts (default: evenly spaced) */
  posts?: number[];
  pots?: number[];
  broom?: number | null;
  smoke?: boolean;
  /** world-space ReactNode drawn on the veranda floor, behind the posts and inside the door (a figure at the door) */
  children?: React.ReactNode;
}

/**
 * A mud-walled, do-chala thatched village house in the Ujanchar hut's exact materials (wall, plinth, door, barred
 * window, kolshi pots, broom, bamboo posts, curved thatch), at any length and scale. With `corner` the right end shows
 * its side wall and the hip of the roof: the house's corner.
 */
export const MudHouse: React.FC<MudHouseProps> = ({ x, y, w, s = 1, f, door = null, window: win = null, corner = false, posts, pots, broom = null, smoke = false, children }) => {
  const { top, eave, ridge } = HUT_L;
  const x0 = 0;
  const x1 = w;
  const mid = w / 2;
  const DW = 86;
  const DT = -222;
  const postXs = posts ?? range(Math.max(2, Math.round(w / 380) + 1)).map((_, i, a) => 50 + ((w - 96) * i) / (a.length - 1));
  const T = `translate(${x}, ${y}) scale(${s})`;
  return (
    <g>
      <g transform={T}>
        {corner && (
          <g>
            {/* the right end: side wall (lit by the sun at the upper right), its plinth, receding to the right */}
            <path d={`M ${x1 - 26} ${eave - 20} L ${x1 + 92} ${eave - 34} L ${x1 + 92} ${top} L ${x1 - 26} ${top} Z`} fill="#a27548" />
            <path d={`M ${x1 - 26} ${top - 40} L ${x1 + 92} ${top - 42} L ${x1 + 92} ${top} L ${x1 - 26} ${top} Z`} fill="#8c623c" />
            <path d={`M ${x1 + 10} ${eave + 50} q 24 -3 44 -2 M ${x1 + 6} ${eave + 120} q 22 -2 50 -4`} stroke="#8e6440" strokeWidth={2} fill="none" opacity={0.6} />
            <path d={`M ${x1} ${top - 6} L ${x1 + 104} ${top - 10} L ${x1 + 104} ${-6} L ${x1} ${0} Z`} fill="#94683e" />
            <path d={`M ${x1} ${top - 6} L ${x1 + 104} ${top - 10} L ${x1 + 104} ${top - 4} L ${x1} ${top + 2} Z`} fill={P.plinthLight} opacity={0.5} />
          </g>
        )}
        <rect x={x0 + 26} y={eave - 20} width={x1 - x0 - 52} height={top - eave + 20} fill={P.wall} />
        <rect x={x0 + 26} y={top - 40} width={x1 - x0 - 52} height={40} fill={P.wallLow} />
        {Array.from({ length: Math.max(2, Math.round(w / 135)) }, (_, i) => (
          <path key={i} d={`M ${x0 + 60 + i * 130} ${-172 + 40 * hashS(i + x)} q 40 -6 80 2`} stroke={P.wallStroke} strokeWidth={2} fill="none" opacity={0.5} />
        ))}
        {win !== null && (
          <g>
            <rect x={win - 35} y={-180} width={70} height={58} fill={P.windowDark} />
            {[0, 1, 2, 3].map((k) => (
              <rect key={k} x={win - 27 + k * 16} y={-180} width={5} height={58} fill={P.bamboo} />
            ))}
            <rect x={win - 41} y={-186} width={82} height={7} fill={P.doorFrame} />
          </g>
        )}
        {door !== null && (
          <g>
            <rect x={door - DW / 2} y={DT} width={DW} height={top - DT} fill={P.doorDark} />
            <rect x={door - DW / 2} y={top - 50} width={DW} height={50} fill={P.doorDeep} opacity={0.6} />
          </g>
        )}
      </g>
      {/* the slot sits in the doorway, so the door leaf and frame are drawn after it */}
      {children}
      <g transform={T}>
        {door !== null && (
          <g>
            <path d={`M ${door - DW / 2} ${DT} L ${door - DW / 2 - 26} ${DT + 10} L ${door - DW / 2 - 26} ${top - 4} L ${door - DW / 2} ${top} Z`} fill={P.doorLeaf} />
            <rect x={door - DW / 2 - 7} y={DT - 8} width={DW + 14} height={9} fill={P.doorFrame} />
            <rect x={door - DW / 2 - 7} y={DT} width={7} height={top - DT} fill={P.doorFrame} />
            <rect x={door + DW / 2} y={DT} width={7} height={top - DT} fill={P.doorFrame} />
          </g>
        )}
        <rect x={x0 + 26} y={eave - 20} width={x1 - x0 - 52} height={60} fill={P.eaveShadow} opacity={0.28} />
        {(pots ?? []).map((px, i) => (
          <UjancharKolshi key={i} x={px} y={top} s={i % 2 ? 0.86 : 1} />
        ))}
        {broom !== null && <UjancharBroom x={broom} y={top} />}
        <rect x={x0} y={top - 6} width={x1 - x0} height={8} fill={P.plinthTop} />
        <rect x={x0} y={top + 2} width={x1 - x0} height={-top - 2} fill={P.plinthFace} />
        <rect x={x0} y={top + 2} width={x1 - x0} height={4} fill={P.plinthLight} opacity={0.6} />
        <rect x={x0} y={-8} width={x1 - x0} height={8} fill={P.plinthShade} opacity={0.6} />
        {postXs.map((px) => (
          <g key={px}>
            <rect x={px - 5} y={eave - 6} width={10} height={top - eave + 6} fill={P.bamboo} />
            <rect x={px - 2} y={eave - 6} width={3} height={top - eave + 6} fill={P.bambooLight} opacity={0.4} />
            {[0.35, 0.7].map((k) => (
              <rect key={k} x={px - 6} y={eave + (top - eave) * k} width={12} height={3} fill={P.bambooTie} />
            ))}
          </g>
        ))}
        {corner && (
          <g>
            {/* the side slope of the thatch over the corner (behind the front slope), in soft shade */}
            <path d={`M ${x1 + 50} ${eave + 26} L ${x1 + 160} ${eave + 8} L ${x1 + 70} ${ridge + 60} L ${x1 - 40} ${ridge + 16} Z`} fill="#b39050" />
            {Array.from({ length: 10 }, (_, i) => {
              const u = (i + 0.5) / 10;
              const bx = lerp(x1 + 60, x1 + 156, u);
              const by = lerp(eave + 24, eave + 9, u);
              return <line key={i} x1={bx} y1={by} x2={lerp(bx, x1 + 20, 0.6)} y2={lerp(by, ridge + 40, 0.6)} stroke={P.thatchStraw} strokeWidth={1.6} opacity={0.5} />;
            })}
            <path d={`M ${x1 + 50} ${eave + 26} L ${x1 + 160} ${eave + 8} L ${x1 + 160} ${eave + 20} L ${x1 + 50} ${eave + 40} Z`} fill={P.thatchEave} />
          </g>
        )}
        <path
          d={`M ${x0 - 60} ${eave + 26} Q ${mid} ${eave - 30} ${x1 + 60} ${eave + 26} L ${x1 - 40} ${ridge + 16} Q ${mid} ${ridge - 34} ${x0 + 40} ${ridge + 16} Z`}
          fill={P.thatch}
        />
        <path d={`M ${x0 + 40} ${ridge + 16} Q ${mid} ${ridge - 34} ${x1 - 40} ${ridge + 16}`} stroke={P.thatchRidge} strokeWidth={8} fill="none" opacity={0.6} />
        {range(Math.round(w / 36)).map((_, i, a) => {
          const u = i / (a.length - 1);
          const xb = x0 - 50 + (x1 - x0 + 100) * u;
          const yb = eave + 22 - 56 * Math.sin(Math.PI * u) * 0.5;
          return <line key={i} x1={xb} y1={yb} x2={xb + (u - 0.5) * 40} y2={yb - 110 - 30 * hashS(i + w)} stroke={P.thatchStraw} strokeWidth={1.6} opacity={0.55} />;
        })}
        <path d={`M ${x0 - 60} ${eave + 26} Q ${mid} ${eave - 30} ${x1 + 60} ${eave + 26} L ${x1 + 56} ${eave + 40} Q ${mid} ${eave - 16} ${x0 - 56} ${eave + 40} Z`} fill={P.thatchEave} />
        {smoke &&
          [0, 1, 2].map((k) => {
            const t = ((((f + k * 30) % 90) + 90) % 90) / 90;
            return <circle key={k} cx={x0 + 200 + Math.sin(t * 5 + k) * 14 + t * 30} cy={ridge - 10 - t * 170} r={12 + t * 28} fill="#f4efe8" opacity={0.35 * (1 - t)} />;
          })}
      </g>
    </g>
  );
};

/** Just the roof (and a strip of wall) of a thatched hut: the family's house glimpsed beyond the fence. */
const ThatchGlimpse: React.FC<{ x: number; y: number; w: number; s: number }> = ({ x, y, w, s }) => {
  const { top, eave, ridge } = HUT_L;
  const mid = w / 2;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <rect x={26} y={eave - 20} width={w - 52} height={top - eave + 20} fill={P.wall} />
      <rect x={26} y={eave - 20} width={w - 52} height={60} fill={P.eaveShadow} opacity={0.28} />
      <path d={`M -60 ${eave + 26} Q ${mid} ${eave - 30} ${w + 60} ${eave + 26} L ${w - 40} ${ridge + 16} Q ${mid} ${ridge - 34} 40 ${ridge + 16} Z`} fill={P.thatch} />
      <path d={`M 40 ${ridge + 16} Q ${mid} ${ridge - 34} ${w - 40} ${ridge + 16}`} stroke={P.thatchRidge} strokeWidth={8} fill="none" opacity={0.6} />
      {range(Math.round(w / 40)).map((_, i, a) => {
        const u = i / (a.length - 1);
        const xb = -50 + (w + 100) * u;
        const yb = eave + 22 - 28 * Math.sin(Math.PI * u);
        return <line key={i} x1={xb} y1={yb} x2={xb + (u - 0.5) * 40} y2={yb - 110 - 30 * hashS(i + 7)} stroke={P.thatchStraw} strokeWidth={1.6} opacity={0.55} />;
      })}
      <path d={`M -60 ${eave + 26} Q ${mid} ${eave - 30} ${w + 60} ${eave + 26} L ${w + 56} ${eave + 40} Q ${mid} ${eave - 16} -56 ${eave + 40} Z`} fill={P.thatchEave} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The kachari (lime-washed brick, tiled roof)                          */
/* ------------------------------------------------------------------ */

const LIME = "#efe6d2";
const LIME_SHADE = "#cbbd9e";
const LIME_DEEP = "#b3a382";
const LIME_STAIN = "#c9b48c";
const DADO = "#b46a44";
const TILE = "#b0573a";
const TILE_LIGHT = "#d07a52";
const TILE_DARK = "#7e3822";
const SHUTTER = "#5d7b5a";
const SHUTTER_DARK = "#455e44";
const WOOD = "#7a5232";
const LEDGER = ["#9a2a22", "#b8862e", "#7a2a1e"];

/** A band of terracotta tile courses (front view of a tiled roof slope), from x0 to x1, y0 (eave) up to y1. */
const TileBand: React.FC<{ x0: number; x1: number; y0: number; y1: number; rows: number; tw?: number; seed?: number }> = ({ x0, x1, y0, y1, rows, tw = 26, seed = 0 }) => {
  const rh = (y0 - y1) / rows;
  const n = Math.ceil((x1 - x0) / tw);
  return (
    <g>
      <rect x={x0} y={y1} width={x1 - x0} height={y0 - y1} fill={TILE} />
      {Array.from({ length: rows }, (_, r) => {
        const yb = y0 - r * rh;
        const off = r % 2 ? tw / 2 : 0;
        return (
          <g key={r}>
            <rect x={x0} y={yb - rh} width={x1 - x0} height={rh * 0.45} fill={TILE_LIGHT} opacity={0.35} />
            {Array.from({ length: n + 1 }, (_, i) => {
              const cx = x0 + off + i * tw;
              if (cx > x1) return null;
              const shade = 0.75 + 0.25 * hashS(seed + r * 31 + i);
              return <path key={i} d={`M ${f1(cx - tw / 2)} ${f1(yb)} Q ${f1(cx)} ${f1(yb + rh * 0.32)} ${f1(cx + tw / 2)} ${f1(yb)} L ${f1(cx + tw / 2)} ${f1(yb - rh * 0.25)} L ${f1(cx - tw / 2)} ${f1(yb - rh * 0.25)} Z`} fill={TILE_DARK} opacity={0.38 * shade} />;
            })}
          </g>
        );
      })}
      {/* weathering: dark streaks and a few moss patches */}
      {Array.from({ length: Math.ceil((x1 - x0) / 140) }, (_, i) => (
        <ellipse key={`w${i}`} cx={x0 + 60 + i * 140 + 40 * hashS(seed + i)} cy={lerp(y1, y0, 0.3 + 0.5 * hashS(seed + i * 3))} rx={40 + 30 * hashS(i + 5)} ry={rh * 0.9} fill={i % 3 ? "#5a3a2a" : "#5f6e3a"} opacity={0.12} />
      ))}
    </g>
  );
};

/** A slatted green wooden shutter window in a lime wall (centre x, top y, width, height). */
const ShutterWindow: React.FC<{ x: number; y: number; w: number; h: number; open?: number }> = ({ x, y, w, h, open = 0.55 }) => (
  <g>
    <rect x={x - w / 2 - 8} y={y - 8} width={w + 16} height={h + 14} fill={LIME_DEEP} opacity={0.5} />
    <rect x={x - w / 2} y={y} width={w} height={h} fill="#2a1c12" />
    {Array.from({ length: 4 }, (_, k) => (
      <rect key={k} x={x - w / 2 + (w * (k + 1)) / 5 - 2} y={y} width={4} height={h} fill="#4a4a42" />
    ))}
    {/* two leaves, opened outward a little */}
    {[-1, 1].map((sd) => {
      const lw = (w / 2) * (1 - 0.6 * open);
      const ex = x + sd * (w / 2);
      return (
        <g key={sd}>
          <rect x={sd < 0 ? ex - lw * open * 0.9 : ex - (1 - open) * lw} y={y} width={lw} height={h} fill={SHUTTER} />
          {Array.from({ length: Math.floor(h / 10) }, (_, k) => (
            <rect key={k} x={sd < 0 ? ex - lw * open * 0.9 : ex - (1 - open) * lw} y={y + 4 + k * 10} width={lw} height={3} fill={SHUTTER_DARK} opacity={0.7} />
          ))}
        </g>
      );
    })}
    <rect x={x - w / 2 - 6} y={y + h} width={w + 12} height={6} fill={LIME} />
  </g>
);

export interface KachariFrontProps {
  x: number;
  y: number;
  s: number;
  /** length in local units (default 1700) */
  w?: number;
  f: number;
  /** world-space ReactNode on the veranda floor, behind the desk (the clerk) */
  veranda?: React.ReactNode;
}

/**
 * The kachari seen from the compound: a long single-storey lime-washed brick building on a raised plinth with front
 * steps, a deep veranda behind square pillars, green-shuttered windows and doors in the shaded inner wall, a sloping
 * clerk's desk (ডেস্ক) with ledgers (খাতা) and an inkpot, a long bench, and a tiled roof. The right end shows its side
 * wall. Local units: plinth top -64, pillars to -300, eave beam -316, ridge -470.
 */
export const KachariFront: React.FC<KachariFrontProps> = ({ x, y, s, w = 1700, f, veranda }) => {
  const T = `translate(${x}, ${y}) scale(${s})`;
  const PT = -64;
  const PILLAR_TOP = -300;
  const pillars = Array.from({ length: 9 }, (_, i) => 60 + ((w - 120) * i) / 8);
  const doors = [300, 850, 1400];
  const windows = [570, 1130];
  const desk = 520;
  const bench = 1180;
  const steps = 850;
  return (
    <g>
      <g transform={T}>
        {/* the right end's side wall and the end of its plinth (lit) */}
        <path d={`M ${w} ${PILLAR_TOP - 16} L ${w + 64} ${PILLAR_TOP - 26} L ${w + 64} ${PT - 4} L ${w} ${PT} Z`} fill={LIME} />
        <path d={`M ${w} ${PT} L ${w + 64} ${PT - 4} L ${w + 64} ${-4} L ${w} 0 Z`} fill="#d8c8a6" />
        <rect x={w + 22} y={-230} width={22} height={70} fill="#2a1c12" opacity={0.75} transform={`skewY(-8)`} />
        {/* the shaded inner wall at the back of the veranda */}
        <rect x={30} y={PILLAR_TOP} width={w - 60} height={PT - PILLAR_TOP} fill={LIME_SHADE} />
        <rect x={30} y={PT - 34} width={w - 60} height={34} fill={DADO} opacity={0.55} />
        {doors.map((dx) => (
          <g key={dx}>
            <rect x={dx - 62} y={-276} width={124} height={212} fill={LIME_DEEP} opacity={0.6} />
            <rect x={dx - 52} y={-268} width={104} height={204} fill="#24180e" />
            <rect x={dx - 52} y={-268} width={30} height={204} fill={SHUTTER} />
            <rect x={dx + 22} y={-268} width={30} height={204} fill={SHUTTER} />
            {[0, 1, 2].map((k) => (
              <rect key={k} x={dx - 48} y={-256 + k * 66} width={22} height={54} fill={SHUTTER_DARK} opacity={0.55} />
            ))}
            {[0, 1, 2].map((k) => (
              <rect key={`r${k}`} x={dx + 26} y={-256 + k * 66} width={22} height={54} fill={SHUTTER_DARK} opacity={0.55} />
            ))}
            {/* an arched fanlight above the door */}
            <path d={`M ${dx - 52} -268 Q ${dx} -310 ${dx + 52} -268 Z`} fill="#3a2a1c" />
          </g>
        ))}
        {windows.map((wx) => (
          <ShutterWindow key={wx} x={wx} y={-246} w={90} h={110} />
        ))}
        {/* a wall clock-shaped calendar and a hanging lantern: the office */}
        <rect x={720} y={-262} width={40} height={54} fill="#e9dcc0" />
        <rect x={720} y={-262} width={40} height={14} fill="#b04a30" />
        <line x1={1000} y1={PILLAR_TOP} x2={1000} y2={-262} stroke="#3a2a1c" strokeWidth={2} />
        <path d="M 988 -262 L 1012 -262 L 1008 -226 L 992 -226 Z" fill="#8a6a3a" />
        <rect x={993} y={-254} width={14} height={22} fill="#f2dfa0" opacity={0.6} />
        {/* the veranda ceiling's shadow */}
        <rect x={30} y={PILLAR_TOP} width={w - 60} height={60} fill="#3a2a18" opacity={0.28} />
        {/* the bench along the inner wall */}
        <g>
          <rect x={bench - 150} y={PT - 44} width={300} height={12} fill={WOOD} />
          <rect x={bench - 150} y={PT - 34} width={300} height={4} fill="#5a3a20" />
          {[-136, 126].map((lx) => (
            <rect key={lx} x={bench + lx} y={PT - 34} width={10} height={34} fill="#5a3a20" />
          ))}
        </g>
      </g>
      {veranda}
      <g transform={T}>
        {/* the clerk's low sloping desk with ledgers and an inkpot (in front of the clerk) */}
        <g>
          <path d={`M ${desk - 74} ${PT} L ${desk - 74} ${PT - 30} L ${desk + 74} ${PT - 46} L ${desk + 74} ${PT} Z`} fill={WOOD} />
          <path d={`M ${desk - 78} ${PT - 30} L ${desk + 78} ${PT - 48} L ${desk + 78} ${PT - 42} L ${desk - 78} ${PT - 24} Z`} fill="#9a6e44" />
          <rect x={desk - 70} y={PT - 10} width={140} height={4} fill="#4a2e18" opacity={0.6} />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={desk - 60 + k * 6} y={PT - 44 - k * 8 - 2} width={58} height={8} rx={2} fill={LEDGER[k]} transform={`rotate(-6 ${desk - 30} ${PT - 40})`} />
          ))}
          <rect x={desk + 20} y={PT - 66} width={46} height={10} rx={2} fill="#e8dcc0" transform={`rotate(-6 ${desk + 40} ${PT - 60})`} />
          <rect x={desk + 52} y={PT - 64} width={10} height={12} rx={3} fill="#2a2a30" />
        </g>
        {/* the plinth with its front steps */}
        <rect x={0} y={PT - 6} width={w} height={10} fill="#f6efe0" />
        <rect x={0} y={PT + 4} width={w} height={-PT - 4} fill="#ddd0b2" />
        <rect x={0} y={-16} width={w} height={16} fill={LIME_STAIN} opacity={0.8} />
        <rect x={0} y={-6} width={w} height={6} fill="#7e6a48" opacity={0.4} />
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <rect x={steps - 110 - k * 14} y={PT + 4 + k * 20} width={220 + k * 28} height={20} fill={k % 2 ? "#d6c8a8" : "#e6dac0"} />
            <rect x={steps - 110 - k * 14} y={PT + 4 + k * 20} width={220 + k * 28} height={4} fill="#f6efe0" />
          </g>
        ))}
        {/* square pillars: lit right face, shaded left face, base and capital blocks */}
        {pillars.map((px) => (
          <g key={px}>
            <rect x={px - 14} y={PILLAR_TOP} width={28} height={PT - PILLAR_TOP} fill={LIME} />
            <rect x={px - 14} y={PILLAR_TOP} width={9} height={PT - PILLAR_TOP} fill={LIME_SHADE} />
            <rect x={px - 19} y={PT - 18} width={38} height={18} fill="#e2d6bc" />
            <rect x={px - 19} y={PILLAR_TOP} width={38} height={14} fill="#e2d6bc" />
            <rect x={px - 14} y={PT - 40} width={28} height={22} fill={LIME_STAIN} opacity={0.5} />
          </g>
        ))}
        {/* eave beam and the tiled roof */}
        <rect x={-30} y={PILLAR_TOP - 18} width={w + 60} height={20} fill="#8a6a46" />
        <rect x={-30} y={PILLAR_TOP - 4} width={w + 60} height={6} fill="#5a3e24" opacity={0.6} />
        <TileBand x0={-44} x1={w + 44} y0={PILLAR_TOP - 16} y1={-462} rows={7} tw={28} seed={3} />
        <path d={`M ${w + 44} ${PILLAR_TOP - 16} L ${w + 96} ${PILLAR_TOP - 30} L ${w + 30} -470 L ${w + 44} -462 Z`} fill="#94462c" />
        <rect x={-50} y={-474} width={w + 90} height={14} rx={4} fill={TILE_DARK} />
        <rect x={-50} y={-474} width={w + 90} height={4} rx={2} fill={TILE_LIGHT} opacity={0.5} />
        {/* soft flicker of the leaf shadows from the mango on the roof's right end */}
        <ellipse cx={w - 120 + 10 * Math.sin(f * 0.02)} cy={-400} rx={160} ry={40} fill="#3a2a1a" opacity={0.1} />
      </g>
    </g>
  );
};

export interface KachariBackProps {
  x0: number;
  x1: number;
  /** ground line (plane px) */
  y: number;
  s: number;
  /** door centre x (plane px) */
  door: number;
  windows?: number[];
  f: number;
  /** 0 closed .. 1 open (the leaf swings outward, toward the grove) */
  doorOpen?: number;
  /** world-space ReactNode inside the door opening (a figure in the doorway) */
  doorway?: React.ReactNode;
}

/**
 * The kachari's back wall from the grove: weathered lime-wash over brick (damp stain at the foot, a few flaked patches
 * showing the bricks), an exposed brick footing, small barred windows, the plank back door with a brick step, the
 * tiled roof's eave with rafter ends above, and the building's back corner at x1 (its side wall lit). Heights scale
 * with s (local: footing -36, door 70 wide and 190 tall from the footing, eave -240).
 */
export const KachariBack: React.FC<KachariBackProps> = ({ x0, x1, y, s, door, windows = [], f, doorOpen = 1, doorway }) => {
  const H = (v: number) => y + v * s;
  const foot = H(-36);
  const eave = H(-240);
  const dw = 70 * s;
  const dTop = H(-36 - 190);
  const dl = door - dw / 2;
  const dr = door + dw / 2;
  const th = (clamp(doorOpen) * 100 * Math.PI) / 180;
  const xe = dl + dw * Math.cos(th) - dw * Math.sin(th) * 0.32;
  const grow = 10 * s * Math.sin(th);
  const id = safeId(useId());
  return (
    <g>
      <defs>
        <linearGradient id={`kb-damp-${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#7d7a5a" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7d7a5a" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* the back corner: side wall receding to the right, lit by the afternoon sun */}
      <path d={`M ${x1} ${eave} L ${x1 + 70 * s} ${eave - 14 * s} L ${x1 + 70 * s} ${y - 8 * s} L ${x1} ${y} Z`} fill="#f4ead2" />
      <path d={`M ${x1} ${foot} L ${x1 + 70 * s} ${foot - 8 * s} L ${x1 + 70 * s} ${y - 8 * s} L ${x1} ${y} Z`} fill="#b7704c" />
      {/* the wall */}
      <rect x={x0} y={eave} width={x1 - x0} height={foot - eave} fill="#e3d7bc" />
      <rect x={x0} y={foot - 80 * s} width={x1 - x0} height={80 * s} fill={`url(#kb-damp-${id})`} />
      {/* lime streaks and stains */}
      {Array.from({ length: Math.ceil((x1 - x0) / 120) }, (_, i) => {
        const sx = x0 + 40 + i * 120 + 50 * hashS(i * 3 + 1);
        return <rect key={i} x={sx} y={eave + 20 * s} width={6 + 10 * hashS(i)} height={(60 + 90 * hashS(i * 5)) * s} fill={LIME_STAIN} opacity={0.22} />;
      })}
      {/* flaked patches showing the bricks */}
      {[
        [x0 + 260, H(-120)],
        [door - 190 * s, H(-70)],
        [x1 - 150 * s, H(-180)],
        [x0 + 900, H(-60)],
      ].map(([px, py], i) => (
        <g key={`fl${i}`}>
          <ellipse cx={px} cy={py} rx={46 * s} ry={22 * s} fill="#cdb08a" />
          {Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 3 }, (_, c) => (
              <rect key={`${r}${c}`} x={px - 34 * s + c * 22 * s + (r % 2) * 11 * s} y={py - 15 * s + r * 10 * s} width={19 * s} height={8 * s} fill={r % 2 ? "#b4603e" : "#a65534"} opacity={0.85} />
            )),
          )}
        </g>
      ))}
      {/* brick footing */}
      <rect x={x0} y={foot} width={x1 - x0} height={y - foot} fill="#a85a3a" />
      {Array.from({ length: 3 }, (_, r) => (
        <rect key={r} x={x0} y={foot + ((r + 1) * (y - foot)) / 4} width={x1 - x0} height={1.5 * s} fill="#7a3a22" opacity={0.6} />
      ))}
      <rect x={x0} y={foot} width={x1 - x0} height={4 * s} fill="#d9c9a8" opacity={0.7} />
      {/* small barred windows */}
      {windows.map((wx) => (
        <g key={wx}>
          <rect x={wx - 30 * s} y={H(-176)} width={60 * s} height={56 * s} fill="#cbbd9e" />
          <rect x={wx - 24 * s} y={H(-170)} width={48 * s} height={46 * s} fill="#2a1c12" />
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={wx - 20 * s + k * 12 * s} y={H(-170)} width={3 * s} height={46 * s} fill="#4a4a46" />
          ))}
          <rect x={wx - 32 * s} y={H(-124)} width={64 * s} height={5 * s} fill={LIME} />
        </g>
      ))}
      {/* the back door: dark inside, the slot, then the frame and the leaf */}
      <rect x={dl} y={dTop} width={dw} height={foot - dTop} fill="#1e140c" />
      <rect x={dl} y={foot - 40 * s} width={dw} height={40 * s} fill="#3a2414" opacity={0.6} />
      {doorway}
      <rect x={dl - 8 * s} y={dTop - 10 * s} width={dw + 16 * s} height={10 * s} fill="#6b4528" />
      <rect x={dl - 8 * s} y={dTop} width={8 * s} height={foot - dTop} fill="#6b4528" />
      <rect x={dr} y={dTop} width={8 * s} height={foot - dTop} fill="#6b4528" />
      <path d={`M ${f1(dl)} ${f1(dTop)} L ${f1(xe)} ${f1(dTop - grow)} L ${f1(xe)} ${f1(foot + grow * 0.4)} L ${f1(dl)} ${f1(foot)} Z`} fill={th > 1.2 ? "#6a4428" : "#7a5232"} />
      {Array.from({ length: 3 }, (_, k) => {
        const u = (k + 1) / 4;
        return <line key={k} x1={dl} y1={lerp(dTop, foot, u)} x2={xe} y2={lerp(dTop - grow, foot + grow * 0.4, u)} stroke="#4e321c" strokeWidth={2 * s} opacity={0.6} />;
      })}
      {/* brick step below the door */}
      <rect x={door - 52 * s} y={foot} width={104 * s} height={y - foot} fill="#b8694a" />
      <rect x={door - 52 * s} y={foot} width={104 * s} height={4 * s} fill="#d79a74" />
      {/* eave: rafter ends and the tiled roof rising away */}
      <rect x={x0} y={eave - 12 * s} width={x1 - x0 + 70 * s} height={12 * s} fill="#5a3e24" />
      {Array.from({ length: Math.ceil((x1 - x0) / (34 * s)) }, (_, i) => (
        <rect key={`rf${i}`} x={x0 + i * 34 * s} y={eave - 4 * s} width={8 * s} height={9 * s} fill="#4a321c" />
      ))}
      <rect x={x0} y={eave} width={x1 - x0} height={26 * s} fill="#3a2614" opacity={0.25} />
      <TileBand x0={x0 - 20} x1={x1 + 90 * s} y0={eave - 10 * s} y1={eave - 150 * s} rows={6} tw={26 * s} seed={11} />
      <path d={`M ${x1 + 90 * s} ${eave - 10 * s} L ${x1 + 124 * s} ${eave - 22 * s} L ${x1 + 60 * s} ${eave - 156 * s} L ${x1 + 90 * s} ${eave - 150 * s} Z`} fill="#94462c" />
      <rect x={x0 - 20} y={eave - 160 * s} width={x1 - x0 + 110 * s} height={12 * s} fill={TILE_DARK} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Trees and plants                                                    */
/* ------------------------------------------------------------------ */

/** A big mango tree (আম গাছ): thick trunk, dense dark crown of long leaves, a few green-gold mangoes. Base at (x, y); about 640 px tall at s 1. */
export const MangoTree: React.FC<{ x: number; y: number; s?: number; f: number; seed?: number }> = ({ x, y, s = 1, f, seed = 0 }) => {
  const sway = 1.1 * Math.sin(f * 0.025 + seed) + 0.5 * noise1(f * 0.02, 40 + seed);
  const blobs = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + hashS(seed + i);
    const r = 150 + 90 * hashS(seed + i * 3);
    return { cx: Math.cos(a) * r * 1.35, cy: -430 + Math.sin(a) * r * 0.62, r: 95 + 55 * hashS(seed + i * 5), k: i % 3 };
  });
  const COL = ["#24502a", "#2d5e2c", "#376a32"];
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={300} ry={24} fill={P.shadow} opacity={0.25} />
      <path d="M -42 0 Q -30 -140 -20 -300 L 22 -300 Q 30 -140 46 0 Z" fill="#4e3622" />
      <path d="M -8 -40 Q -4 -160 6 -290" stroke="#6a4c30" strokeWidth={8} fill="none" opacity={0.5} />
      <path d="M -10 -250 Q -90 -320 -190 -360" stroke="#4e3622" strokeWidth={20} fill="none" strokeLinecap="round" />
      <path d="M 10 -260 Q 100 -330 200 -350" stroke="#4e3622" strokeWidth={18} fill="none" strokeLinecap="round" />
      <path d="M 0 -280 Q 10 -380 -10 -470" stroke="#4e3622" strokeWidth={16} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${sway.toFixed(2)} 0 -300)`}>
        <ellipse cx={0} cy={-430} rx={330} ry={190} fill="#1f4524" />
        {blobs.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={COL[b.k]} />
        ))}
        {blobs.map((b, i) => (
          <circle key={`h${i}`} cx={b.cx + b.r * 0.22} cy={b.cy - b.r * 0.32} r={b.r * 0.5} fill="#6f9a48" opacity={0.22} />
        ))}
        {/* long lanceolate leaves lying along the upper edges of the leaf masses (texture, not rays) */}
        {blobs.map((b, i) =>
          [0, 1, 2, 3, 4].map((j) => {
            const th = Math.PI * (1.08 + (0.84 * (j + 0.5)) / 5);
            const lx = b.cx + Math.cos(th) * b.r * 0.86;
            const ly = b.cy + Math.sin(th) * b.r * 0.86;
            const rot = (th * 180) / Math.PI + 90 + 30 * (hashS(seed + i * 7 + j) - 0.5) + 18;
            return <path key={`l${i}-${j}`} d="M 0 0 Q 14 -5 32 2 Q 14 6 0 0 Z" fill={j % 2 ? "#4a7e3a" : "#3e7034"} opacity={0.85} transform={`translate(${f1(lx)}, ${f1(ly)}) rotate(${f1(rot)})`} />;
          }),
        )}
        {Array.from({ length: 11 }, (_, i) => {
          const mx = -260 + 520 * hashS(seed + i * 13);
          const my = -330 - 160 * hashS(seed + i * 17);
          return (
            <g key={`m${i}`}>
              <line x1={mx} y1={my - 18} x2={mx} y2={my - 6} stroke="#3a4a20" strokeWidth={2} />
              <ellipse cx={mx} cy={my + 4} rx={9} ry={13} fill={i % 3 === 0 ? "#d8c050" : "#9fb244"} />
              <ellipse cx={mx - 3} cy={my} rx={3} ry={5} fill="#f2e6a0" opacity={0.6} />
            </g>
          );
        })}
      </g>
    </g>
  );
};

const BAN_UP = ["#62a03e", "#579638", "#6eab46"];
const BAN_DN = ["#467f2f", "#3e742a", "#4c8733"];
const BAN_RIB = "#c6d488";
const BAN_DEAD = "#8f6d3c";
const BAN_DEAD_DK = "#6a4c26";
const BAN_DEAD_LT = "#b5925a";

/**
 * One banana leaf (কলা পাতা) pointing along +x from its petiole at (0, 0): an arching blade with a pale midrib and
 * tears (slits from the edge to the midrib, the strips drooping a little). droop: tip height as a fraction of len
 * (negative = still rising). tone: 0 fresh .. 1 darker (far rows).
 */
const BananaLeaf: React.FC<{ len: number; wid: number; droop: number; tears: number; seed: number; tone?: number; brownEdge?: number }> = ({ len, wid, droop, tears, seed, tone = 0, brownEdge = 0 }) => {
  const C = { x: len * 0.5, y: -len * 0.26 };
  const E = { x: len, y: len * droop };
  const pAt = (u: number) => ({
    x: 2 * u * (1 - u) * C.x + u * u * E.x,
    y: 2 * u * (1 - u) * C.y + u * u * E.y,
  });
  const nAt = (u: number) => {
    const tx = 2 * (1 - u) * C.x + 2 * u * (E.x - C.x);
    const ty = 2 * (1 - u) * C.y + 2 * u * (E.y - C.y);
    const l = Math.hypot(tx, ty) || 1;
    return { x: -ty / l, y: tx / l };
  };
  const half = (u: number) => (u < 0.14 ? wid * 0.04 : wid * 0.5 * Math.pow(Math.sin(Math.PI * clamp((u - 0.12) / 0.9)), 0.42));
  const up = BAN_UP[Math.floor(hashS(seed) * 3)];
  const dn = BAN_DN[Math.floor(hashS(seed + 1) * 3)];
  // tear positions per side
  const cuts = (side: number) => {
    const c = [0.16];
    for (let i = 0; i < tears; i++) c.push(0.22 + 0.74 * hashS(seed * 7 + side * 13 + i * 3.1));
    c.push(1);
    return c.sort((a, b) => a - b);
  };
  const strip = (side: number, a: number, b: number, k: number) => {
    const pts: string[] = [];
    const n = 5;
    const gap = b < 1 ? 0.007 : 0;
    const aa = a + (a > 0.16 ? 0.007 : 0);
    const bb = b - gap;
    for (let i = 0; i <= n; i++) {
      const u = lerp(aa, bb, i / n);
      const p = pAt(u);
      pts.push(`${f1(p.x)},${f1(p.y)}`);
    }
    const sag = side > 0 ? 4 + 3 * k : 2 + 2 * k;
    for (let i = n; i >= 0; i--) {
      const u = lerp(aa, bb, i / n);
      const p = pAt(u);
      const nn = nAt(u);
      const h = half(u) * (side > 0 ? 0.82 : 1);
      // the lower half (+normal, side > 0) hangs down a little more and its strips droop
      pts.push(`${f1(p.x + nn.x * h * side)},${f1(p.y + nn.y * h * side + (side > 0 ? sag * Math.sin(Math.PI * (i / n)) : 0))}`);
    }
    return pts.join(" ");
  };
  const sides = [-1, 1];
  return (
    <g>
      {sides.map((side) => {
        const c = cuts(side);
        return (
          <g key={side}>
            {c.slice(0, -1).map((a, k) => (
              <polygon key={k} points={strip(side, a, c[k + 1], k)} fill={side < 0 ? up : dn} />
            ))}
          </g>
        );
      })}
      {brownEdge > 0 &&
        sides.map((side) => {
          const pts: string[] = [];
          for (let i = 0; i <= 10; i++) {
            const u = lerp(0.3, 1, i / 10);
            const p = pAt(u);
            const nn = nAt(u);
            const h = half(u) * (side > 0 ? 0.82 : 1);
            pts.push(`${f1(p.x + nn.x * h * side)},${f1(p.y + nn.y * h * side)}`);
          }
          return <polyline key={`b${side}`} points={pts.join(" ")} stroke={BAN_DEAD} strokeWidth={wid * 0.08 * brownEdge} fill="none" opacity={0.8} strokeLinejoin="round" />;
        })}
      <path d={`M 0 0 Q ${f1(C.x)} ${f1(C.y)} ${f1(E.x)} ${f1(E.y)}`} stroke={BAN_RIB} strokeWidth={Math.max(1.5, wid * 0.05)} fill="none" opacity={0.85} />
      {tone > 0 && <path d={`M 0 0 Q ${f1(C.x)} ${f1(C.y)} ${f1(E.x)} ${f1(E.y)}`} stroke="#1a2a14" strokeWidth={wid} fill="none" opacity={0.22 * tone} />}
    </g>
  );
};

/** A dry old banana leaf hanging down along the stem from the crown: folded, brown and torn. Top at (0, 0). */
const DeadLeaf: React.FC<{ len: number; wid: number; seed: number; swing: number }> = ({ len, wid, seed, swing }) => {
  const bend = 24 * (hashS(seed) - 0.5);
  return (
    <g transform={`rotate(${f1(swing)})`}>
      <path d={`M 0 0 Q ${f1(18 + bend)} 30 ${f1(10 + bend)} 60`} stroke={BAN_DEAD_DK} strokeWidth={5} fill="none" />
      <path
        d={`M ${f1(10 + bend)} 50 C ${f1(10 + bend - wid * 0.6)} ${f1(len * 0.35)} ${f1(bend - wid * 0.4)} ${f1(len * 0.75)} ${f1(bend * 0.4 - 4)} ${f1(len)} L ${f1(bend * 0.4 + 6)} ${f1(len * 0.92)} C ${f1(bend + wid * 0.5)} ${f1(len * 0.7)} ${f1(bend + wid * 0.55)} ${f1(len * 0.3)} ${f1(14 + bend)} 50 Z`}
        fill={BAN_DEAD}
      />
      <path d={`M ${f1(12 + bend)} 56 C ${f1(bend + 4)} ${f1(len * 0.4)} ${f1(bend * 0.6)} ${f1(len * 0.7)} ${f1(bend * 0.4)} ${f1(len * 0.98)}`} stroke={BAN_DEAD_DK} strokeWidth={3} fill="none" opacity={0.7} />
      {[0.3, 0.5, 0.68, 0.84].map((q, i) => (
        <path key={i} d={`M ${f1(bend * (1 - q * 0.6) + 2)} ${f1(len * q)} l ${f1(wid * 0.45)} ${f1(10 + 6 * hashS(seed + i))}`} stroke={BAN_DEAD_LT} strokeWidth={2} opacity={0.6} />
      ))}
    </g>
  );
};

/** The hanging banana flower (মোচা) with a few hands of young green bananas above it, from (0, 0) at the crown. */
const BananaBunch: React.FC<{ sway: number }> = ({ sway }) => (
  <g transform={`rotate(${f1(sway)})`}>
    <path d="M 0 0 Q 70 -40 96 40 Q 108 110 112 200" stroke="#7a8a3e" strokeWidth={9} fill="none" strokeLinecap="round" />
    {[0, 1, 2, 3].map((h) => {
      const y = 50 + h * 30;
      const x = 98 + h * 3;
      return (
        <g key={h}>
          {Array.from({ length: 6 }, (_, k) => {
            const a = -60 + k * 24;
            return <path key={k} d={`M ${x} ${y} q ${f1(Math.cos((a * Math.PI) / 180) * 22)} ${f1(-10 + Math.sin((a * Math.PI) / 180) * 6)} ${f1(Math.cos((a * Math.PI) / 180) * 30)} ${f1(-28)}`} stroke={k % 2 ? "#8db04a" : "#9cbc56"} strokeWidth={8} fill="none" strokeLinecap="round" />;
          })}
        </g>
      );
    })}
    <path d="M 112 196 C 96 214 96 252 112 278 C 128 252 128 214 112 196 Z" fill="#6e2436" />
    <path d="M 112 200 C 104 214 103 240 110 262" stroke="#a04a5c" strokeWidth={4} fill="none" opacity={0.7} />
    <path d="M 114 214 C 128 208 136 214 138 224 C 128 226 120 224 114 214 Z" fill="#8a3446" />
  </g>
);

export interface BananaPlantProps {
  x: number;
  y: number;
  s?: number;
  f: number;
  seed?: number;
  /** number of green leaves (default 7) */
  leaves?: number;
  /** dry leaves hanging along the stem (default 1) */
  dead?: number;
  /** the hanging flower and young bunch */
  flower?: boolean;
  /** 0 fresh .. 1 darker (far rows) */
  tone?: number;
  /** stem lean in degrees */
  lean?: number;
  /** young suckers with low broad leaves at the foot */
  suckers?: number;
  /** tears per leaf half (default 3) */
  tears?: number;
  /** stem height in local units (default 470) */
  h?: number;
}

/**
 * A tall banana plant (কলা গাছ): a stout pseudostem with sheath stripes and dark blotches, dried sheath strips at the
 * foot, a crown of long arching leaves torn into strips, a rolled young leaf in the centre, old dry leaves hanging
 * down the stem, optionally a hanging flower with a young bunch and young suckers at the foot. Base at (x, y); the
 * crown at y - h·s, the plant about 760 px tall at s 1. Leaves sway slowly on f (life clock).
 */
export const BananaPlant: React.FC<BananaPlantProps> = ({ x, y, s = 1, f, seed = 0, leaves = 7, dead = 1, flower = false, tone = 0, lean = 0, suckers = 0, tears = 3, h = 470 }) => {
  const top = { x: Math.sin((lean * Math.PI) / 180) * h, y: -h };
  const leafSpecs = Array.from({ length: leaves }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const age = i / Math.max(1, leaves - 1); // 0 youngest (upright) .. 1 oldest (drooping)
    const elev = lerp(-68, 8, age) + 14 * (hashS(seed * 3 + i) - 0.5);
    return {
      side,
      elev,
      len: (290 + 90 * hashS(seed + i * 5)) * (1 - 0.15 * age),
      wid: 86 + 26 * hashS(seed + i * 9),
      droop: lerp(-0.12, 0.55, age) + 0.12 * hashS(seed + i * 2),
      tears: Math.round(tears * (0.4 + age)),
      ph: 6.28 * hashS(seed + i * 11),
      brown: age > 0.7 ? 0.8 : 0,
    };
  });
  // older leaves behind, younger in front
  const order = [...leafSpecs.keys()].sort((a, b) => leafSpecs[b].elev - leafSpecs[a].elev);
  const stemSway = 0.5 * Math.sin(f * 0.018 + seed);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx={-10} cy={4} rx={110} ry={12} fill={P.shadow} opacity={0.22} />
      {Array.from({ length: suckers }, (_, k) => {
        const sx = (k % 2 ? 1 : -1) * (46 + 26 * k);
        const sw = 2 * Math.sin(f * 0.03 + seed + k);
        return (
          <g key={`sk${k}`} transform={`translate(${sx}, 0)`}>
            <path d="M -9 0 L -6 -90 L 6 -90 L 9 0 Z" fill="#7d9a4a" />
            {[-1, 1, -1].map((sd, j) => (
              <g key={j} transform={`translate(0, -86) scale(${sd}, 1) rotate(${f1(35 + 20 * j - 90 + sw)})`}>
                <BananaLeaf len={130 + 30 * j} wid={60} droop={0.1 + 0.15 * j} tears={1} seed={seed * 5 + k * 3 + j} tone={tone} />
              </g>
            ))}
          </g>
        );
      })}
      <g transform={`rotate(${f1(stemSway)} 0 0)`}>
        {/* pseudostem */}
        <path d={`M -31 0 Q ${f1(top.x * 0.4 - 22)} ${f1(-h * 0.5)} ${f1(top.x - 14)} ${f1(top.y)} L ${f1(top.x + 14)} ${f1(top.y)} Q ${f1(top.x * 0.4 + 24)} ${f1(-h * 0.5)} 33 0 Z`} fill="#86a04c" />
        <path d={`M -31 0 Q ${f1(top.x * 0.4 - 22)} ${f1(-h * 0.5)} ${f1(top.x - 14)} ${f1(top.y)} L ${f1(top.x - 6)} ${f1(top.y)} Q ${f1(top.x * 0.4 - 12)} ${f1(-h * 0.5)} -16 0 Z`} fill="#5f7a38" opacity={0.55} />
        <path d={`M 8 0 Q ${f1(top.x * 0.4 + 10)} ${f1(-h * 0.5)} ${f1(top.x + 4)} ${f1(top.y)} L ${f1(top.x + 14)} ${f1(top.y)} Q ${f1(top.x * 0.4 + 24)} ${f1(-h * 0.5)} 33 0 Z`} fill="#b4c470" opacity={0.55} />
        {[-14, 2, 18].map((o, i) => (
          <path key={i} d={`M ${o} 0 Q ${f1(top.x * 0.4 + o * 0.7)} ${f1(-h * 0.5)} ${f1(top.x + o * 0.45)} ${f1(top.y)}`} stroke="#6a8040" strokeWidth={1.4} fill="none" opacity={0.45} />
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <path key={`bl${i}`} d={`M ${f1(-14 + 24 * hashS(seed + i))} ${f1(-60 - (h - 140) * hashS(seed * 2 + i * 3))} q 3 -12 1 -26`} stroke="#5a3e2c" strokeWidth={4 + 3 * hashS(i)} strokeLinecap="round" fill="none" opacity={0.35} />
        ))}
        {/* dried sheath strips peeling at the foot */}
        <path d="M -34 0 Q -40 -60 -26 -130 L -16 -124 Q -26 -60 -20 0 Z" fill={BAN_DEAD} />
        <path d="M 22 0 Q 38 -50 30 -96 L 38 -92 Q 44 -48 34 0 Z" fill={BAN_DEAD_LT} opacity={0.9} />
        <g transform={`translate(${f1(top.x)}, ${f1(top.y)})`}>
          {Array.from({ length: dead }, (_, k) => (
            <g key={`d${k}`} transform={`translate(${(k % 2 ? 1 : -1) * 10}, 6)`}>
              <DeadLeaf len={250 + 40 * hashS(seed + k * 7)} wid={44} seed={seed * 9 + k} swing={(k % 2 ? -1 : 1) * (8 + 6 * k) + 1.5 * Math.sin(f * 0.02 + k + seed)} />
            </g>
          ))}
          {flower && <BananaBunch sway={1.5 * Math.sin(f * 0.022 + seed)} />}
          {order.map((i) => {
            const L = leafSpecs[i];
            const sw = 2.4 * Math.sin(f * 0.028 + L.ph) + 1.4 * noise1(f * 0.02, seed * 10 + i);
            const ang = L.side > 0 ? L.elev + sw : 180 - L.elev - sw;
            return (
              <g key={i} transform={`rotate(${f1(ang)}) ${L.side > 0 ? "" : "scale(1, -1)"}`}>
                <BananaLeaf len={L.len} wid={L.wid} droop={L.droop} tears={L.tears} seed={seed * 17 + i} tone={tone} brownEdge={L.brown} />
              </g>
            );
          })}
          {/* the rolled young leaf in the centre */}
          <path d={`M -7 4 Q -6 -80 ${f1(4 + 2 * Math.sin(f * 0.03 + seed))} -150 Q 10 -80 8 4 Z`} fill="#93c060" />
          <path d="M 0 0 Q 0 -70 4 -140" stroke="#b9d888" strokeWidth={2} fill="none" opacity={0.7} />
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Props: the bamboo basket and the cucumber trellis                    */
/* ------------------------------------------------------------------ */

/**
 * The big shallow woven bamboo basket (ঝাঁকা). tipped (default true): lying on its side, the open mouth turned toward
 * the camera's right (the tortoises were kept under it). Base (ground contact) at (x, y); about 150 px across at s 1.
 */
export const BambooBasket: React.FC<{ x: number; y: number; s?: number; tipped?: boolean }> = ({ x, y, s = 1, tipped = true }) => {
  const id = safeId(useId());
  if (!tipped) {
    return (
      <g transform={`translate(${x}, ${y}) scale(${s})`}>
        <defs>
          <clipPath id={`kbk-${id}`}>
            <path d="M -76 -44 L -50 0 L 50 0 L 76 -44 Z" />
          </clipPath>
        </defs>
        <ellipse cx={0} cy={2} rx={70} ry={9} fill={P.shadow} opacity={0.3} />
        <path d="M -76 -44 L -50 0 L 50 0 L 76 -44 Z" fill="#b9975a" />
        <g clipPath={`url(#kbk-${id})`} opacity={0.6}>
          {Array.from({ length: 20 }, (_, i) => (
            <line key={i} x1={-90 + i * 10} y1={-50} x2={-70 + i * 10} y2={4} stroke="#8a6a36" strokeWidth={2} />
          ))}
          {[-34, -22, -10].map((yy) => (
            <line key={yy} x1={-80} y1={yy} x2={80} y2={yy} stroke="#d8bc7c" strokeWidth={3} />
          ))}
        </g>
        <ellipse cx={0} cy={-44} rx={76} ry={16} fill="#6e5228" />
        <ellipse cx={0} cy={-44} rx={76} ry={16} fill="none" stroke="#d0b070" strokeWidth={5} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <defs>
        <clipPath id={`kbk-${id}`}>
          <path d="M 30 -150 C -40 -150 -78 -110 -78 -66 C -78 -24 -40 0 30 0 Z" />
        </clipPath>
      </defs>
      <ellipse cx={-6} cy={3} rx={92} ry={10} fill={P.shadow} opacity={0.32} />
      {/* the shell (the basket's underside, facing left) */}
      <path d="M 30 -150 C -40 -150 -78 -110 -78 -66 C -78 -24 -40 0 30 0 Z" fill="#b39352" />
      <g clipPath={`url(#kbk-${id})`}>
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M 30 ${-150 + i * 13.6} C -20 ${-150 + i * 13.6 - 8 + i * 1.4} -60 ${-90 + i * 6} -78 ${-80 + i * 8}`} stroke={i % 2 ? "#8e6e36" : "#d2b676"} strokeWidth={3} fill="none" opacity={0.7} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={-70 + i * 12} y1={-150} x2={-74 + i * 12} y2={0} stroke="#7a5c2c" strokeWidth={1.6} opacity={0.45} />
        ))}
        <ellipse cx={-20} cy={-110} rx={40} ry={22} fill="#f2dca0" opacity={0.18} />
      </g>
      {/* the open mouth: dark inside, a thick bound rim */}
      <ellipse cx={30} cy={-75} rx={34} ry={75} fill="#3a2a14" />
      <ellipse cx={36} cy={-75} rx={24} ry={64} fill="#5a4220" opacity={0.6} />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={`in${i}`} d={`M ${30 - 20 + i * 6} -140 Q ${46 + i * 2} -75 ${30 - 20 + i * 6} -10`} stroke="#7a5c2c" strokeWidth={1.4} fill="none" opacity={0.5} />
      ))}
      <ellipse cx={30} cy={-75} rx={34} ry={75} fill="none" stroke="#c9a868" strokeWidth={7} />
      <ellipse cx={30} cy={-75} rx={34} ry={75} fill="none" stroke="#8a6a36" strokeWidth={1.5} strokeDasharray="5 6" opacity={0.7} />
    </g>
  );
};

/** Cucumber leaf: a rough palmate leaf with five pointed lobes, base at (0, 0), pointing up. */
const CUKE_LEAF = "M 0 0 C -12 -2 -22 -12 -20 -24 C -16 -24 -14 -27 -14 -31 C -8 -32 -5 -36 -4 -42 C -1 -38 1 -38 4 -42 C 5 -36 8 -32 14 -31 C 14 -27 16 -24 20 -24 C 22 -12 12 -2 0 0 Z";
const CukeLeaf: React.FC<{ x: number; y: number; r: number; s: number; col: string; torn?: number }> = ({ x, y, r, s, col, torn = 0 }) => (
  <g transform={`translate(${f1(x)}, ${f1(y)}) rotate(${f1(r)}) scale(${(s * (1 - 0.25 * torn)).toFixed(3)}, ${(s * (1 - 0.1 * torn)).toFixed(3)})`}>
    <path d={CUKE_LEAF} fill={col} />
    <path d="M 0 0 L 0 -36 M 0 -8 L -14 -22 M 0 -8 L 14 -22 M 0 -18 L -8 -32 M 0 -18 L 8 -32" stroke="#3e6e2a" strokeWidth={1.1} fill="none" opacity={0.55} />
    {torn > 0.3 && <path d="M 6 -40 C 4 -32 10 -30 8 -22 C 14 -24 18 -26 20 -24 C 18 -30 12 -36 6 -40 Z" fill="#c9a870" opacity={0.85} />}
  </g>
);

const CukeFlower: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 6 }) => (
  <g transform={`translate(${f1(x)}, ${f1(y)})`}>
    {[0, 1, 2, 3, 4].map((k) => (
      <ellipse key={k} cx={0} cy={-r * 0.6} rx={r * 0.45} ry={r * 0.62} fill="#f5d23a" transform={`rotate(${k * 72})`} />
    ))}
    <circle r={r * 0.3} fill="#d89a1c" />
  </g>
);

/** A young cucumber (কচি শশা), hanging from (0, 0) downward (rot rotates it); bitten shows a bite with pale flesh. */
const Cucumber: React.FC<{ x: number; y: number; rot: number; len?: number; bitten?: boolean }> = ({ x, y, rot, len = 48, bitten = false }) => (
  <g transform={`translate(${f1(x)}, ${f1(y)}) rotate(${f1(rot)})`}>
    <path d={`M 0 0 L 0 6`} stroke="#5a7a30" strokeWidth={2} />
    <path d={`M -6 6 C -8 ${len * 0.4} -7 ${len * 0.8} -1 ${len} C 6 ${len * 0.8} 8 ${len * 0.4} 6 6 Z`} fill="#6f9a3a" />
    <path d={`M -2 9 C -3 ${len * 0.4} -3 ${len * 0.7} -1 ${len - 4}`} stroke="#b2cc72" strokeWidth={2} fill="none" opacity={0.7} />
    {[0.3, 0.5, 0.7].map((q) => (
      <circle key={q} cx={3} cy={len * q} r={0.9} fill="#e8f0b0" opacity={0.8} />
    ))}
    {!bitten && <circle cx={-1} cy={len + 1} r={2.4} fill="#f2c840" />}
    {bitten && (
      <g>
        <path d={`M -7 ${len * 0.62} Q -3 ${len * 0.56} 0 ${len * 0.64} Q 3 ${len * 0.56} 8 ${len * 0.62} L 8 ${len + 4} L -8 ${len + 4} Z`} fill={P.floor} />
        <ellipse cx={0.5} cy={len * 0.63} rx={6.6} ry={2.6} fill="#e9f0c2" />
        {[-3, 0, 3].map((dx) => (
          <circle key={dx} cx={dx + 0.5} cy={len * 0.63} r={0.8} fill="#c4d488" />
        ))}
      </g>
    )}
  </g>
);

/* trellis geometry (local units: base centre of the front legs at (0, 0)) */
const TR = { W: 560, H: 170, DX: 22, DY: 46 };
const TR_LEGS = [-270, -90, 90, 270];
const TR_ROOT = { x: -250, y: 6 };
/** where the cow pulls toward (her mouth when she tears at it from the right front) */
const TR_PULL = { x: 400, y: -70 };

interface TrAnchor {
  x: number;
  y: number;
  r: number;
  s: number;
  th: number;
  fall: boolean;
  gx: number;
  col: number;
}

/** The vine's leaf anchors on the machan: spread over the platform (front -H, back -H-DY), with detach thresholds. */
const TR_ANCHORS: TrAnchor[] = Array.from({ length: 30 }, (_, i) => {
  const u = hashS(i * 3.7 + 1);
  const v = hashS(i * 5.3 + 2);
  const x = -TR.W / 2 + 20 + (TR.W - 30) * u + TR.DX * v;
  const y = -TR.H - TR.DY * v - 4;
  // the right end (near the cow) goes first; the left (near the root) last
  const th = 0.04 + 0.5 * (1 - u) * 0.9 + 0.22 * hashS(i * 9.1);
  return { x, y, r: 70 * (hashS(i * 2.2) - 0.5), s: 1.4 + 0.5 * hashS(i * 6.6), th, fall: hashS(i * 4.4) < 0.4, gx: 160 + 260 * hashS(i * 8.8), col: i % 3 };
});
/** Leaves hanging off the front bar (the vine spills over the edge). */
const TR_HANG: TrAnchor[] = Array.from({ length: 12 }, (_, i) => {
  const u = (i + 0.5) / 12 + 0.03 * (hashS(i * 7.7) - 0.5);
  const x = -TR.W / 2 + TR.W * u;
  const th = 0.04 + 0.48 * (1 - u) + 0.15 * hashS(i * 3.3);
  return { x, y: -TR.H + 16 + 26 * hashS(i * 1.9), r: 160 + 40 * (hashS(i) - 0.5), s: 1.3 + 0.4 * hashS(i * 2.9), th, fall: hashS(i * 5.5) < 0.5, gx: 120 + 280 * hashS(i * 6.1), col: (i + 1) % 3 };
});
const TR_CUKES = Array.from({ length: 9 }, (_, i) => {
  const u = (i + 0.6) / 9.4;
  const x = -TR.W / 2 + 30 + (TR.W - 50) * u + 10 * (hashS(i * 3.9) - 0.5);
  const th = 0.06 + 0.5 * (1 - u) + 0.12 * hashS(i * 2.3);
  // three are bitten and dropped on the earth
  const drop = i === 7 || i === 5 || i === 2;
  return { x, y: -TR.H + 2, len: 40 + 14 * hashS(i * 4.4), rot: 8 * (hashS(i * 6.2) - 0.5), th, drop, gx: 90 + 70 * i * 0.5 + 60 * hashS(i * 8.3), gr: 70 + 40 * hashS(i) };
});
const TR_FLOWERS = Array.from({ length: 11 }, (_, i) => ({ a: (i * 7 + 3) % 30, dx: 8 * (hashS(i) - 0.5), dy: -10 - 8 * hashS(i * 2) }));
const CUKE_COL = ["#5e9a3c", "#4f8a34", "#69a646"];

/** Where an anchor is at a given tear state: attached on the machan, dragged down the front toward the cow, or fallen. */
const trAnchorAt = (a: TrAnchor, torn: number) => {
  const d = sstep((torn - a.th) / 0.22);
  if (d <= 0) return { x: a.x, y: a.y, r: a.r, d: 0 };
  // dragged: over the front edge, toward the pull point, hanging; fallen leaves end on the earth
  const hx = lerp(a.x, TR_PULL.x, 0.35 + 0.2 * hashS(a.x)) + 20 * (hashS(a.y) - 0.5);
  const hy = a.fall ? -4 - 6 * hashS(a.x * 3) : lerp(-TR.H + 30, -40, 0.4 + 0.5 * hashS(a.x * 2));
  const gx = a.fall ? a.x * 0.4 + a.gx * 0.6 : hx;
  const x = lerp(a.x, gx, d);
  // an arc: up and over the bar, then down
  const y = lerp(a.y, hy, d) - 30 * Math.sin(Math.PI * d) * (a.fall ? 0.4 : 1);
  return { x, y, r: a.r + d * (a.fall ? 120 : 150), d };
};

/** Points along the vine at a tear state, for a cow's mouth or a pointing hand: k 0 = root .. 1 = the far right tip. */
export const trellisPoint = (torn: number, k: number, at: { x: number; y: number; s?: number } = { x: G_TRELLIS.x, y: G_TRELLIS.y, s: G_TRELLIS.s }) => {
  const s = at.s ?? 1;
  const p = vinePath(torn)[Math.round(clamp(k) * (VINE_N - 1))];
  return { x: at.x + p.x * s, y: at.y + p.y * s };
};

const VINE_N = 14;
/** The main stem: root -> up the front-left leg -> along the platform to the right; dragged toward the pull point when torn. */
const vinePath = (torn: number) => {
  const r = sstep((torn - 0.5) / 0.3);
  const root = { x: TR_ROOT.x + 10 * r, y: TR_ROOT.y - 16 * r };
  return Array.from({ length: VINE_N }, (_, i) => {
    const u = i / (VINE_N - 1);
    let x: number;
    let y: number;
    if (u < 0.22) {
      const q = u / 0.22;
      x = lerp(TR_ROOT.x, TR_LEGS[0] + 6, q) + 8 * Math.sin(q * 6);
      y = lerp(TR_ROOT.y, -TR.H - 4, q);
    } else {
      const q = (u - 0.22) / 0.78;
      x = lerp(TR_LEGS[0] + 6, TR.W / 2 - 10, q);
      y = -TR.H - 6 - TR.DY * 0.45 * Math.sin(q * Math.PI * 2.2) * 0.5 - 8;
    }
    if (i === 0) return root;
    // detach from the right first; the dragged stem hangs in a curve from the root toward the pull point, near the ground
    const th = 0.05 + 0.6 * (1 - u);
    const d = sstep((torn - th) / 0.3);
    const tx = lerp(root.x, TR_PULL.x - 30, u);
    const ty = lerp(root.y, -18, u) - 60 * Math.sin(Math.PI * u) * (1 - 0.6 * torn);
    return { x: lerp(x, tx, d), y: lerp(y, ty, d) };
  });
};

const smoothD = (pts: Array<{ x: number; y: number }>) => {
  let d = `M ${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${f1(pts[i].x)} ${f1(pts[i].y)} ${f1(mx)} ${f1(my)}`;
  }
  const l = pts[pts.length - 1];
  return `${d} L ${f1(l.x)} ${f1(l.y)}`;
};

export interface CucumberTrellisProps {
  /** base centre of the front legs (plane px) */
  x: number;
  y: number;
  s?: number;
  /** life clock: leaves stir */
  f: number;
  /** 0 whole .. 1 torn (vine dragged down, leaves torn, root out, bitten cucumbers on the earth); values between animate the pull */
  torn?: number;
}

/**
 * The cucumber trellis (শশার মাচা): a waist-high bamboo machan (four front legs, four back legs, a lashed platform of
 * poles and crossed sticks) with a big cucumber vine spread over it, yellow flowers and young cucumbers hanging from
 * the front bar. `torn` drags it apart from the right (where the cow pulls): leaves leave the platform and hang or
 * fall, the main stem sags to the earth, the root comes up out of a hole, three bitten cucumbers drop on the earth.
 * About 600 px wide and 220 px tall at s 1; the platform's front bar at y - 170 s.
 */
export const CucumberTrellis: React.FC<CucumberTrellisProps> = ({ x, y, s = 1, f, torn = 0 }) => {
  const t = clamp(torn);
  const rootOut = sstep((t - 0.5) / 0.3);
  const vine = vinePath(t);
  const stir = (i: number) => 3 * Math.sin(f * 0.04 + i * 1.7) + 2 * noise1(f * 0.03, 700 + i);
  const bamboo = (x1: number, y1: number, x2: number, y2: number, w = 7, key?: string) => (
    <g key={key}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={P.bamboo} strokeWidth={w} strokeLinecap="round" />
      <line x1={x1} y1={y1 - w * 0.2} x2={x2} y2={y2 - w * 0.2} stroke={P.bambooLight} strokeWidth={w * 0.3} strokeLinecap="round" opacity={0.45} />
    </g>
  );
  const frontY = -TR.H;
  const backY = -TR.H - TR.DY;
  const leafAt = (a: TrAnchor, i: number, keyp: string) => {
    const p = trAnchorAt(a, t);
    const torn01 = p.d;
    return <CukeLeaf key={`${keyp}${i}`} x={p.x} y={p.y} r={p.r + stir(i) * (1 - torn01)} s={a.s} col={torn01 > 0.5 ? "#6f8a3a" : CUKE_COL[a.col]} torn={torn01} />;
  };
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx={20} cy={4} rx={320} ry={18} fill={P.shadow} opacity={0.2} />
      {/* back legs and back bar */}
      {TR_LEGS.map((lx, i) => bamboo(lx + TR.DX, -TR.DY + 2, lx + TR.DX, backY, 6, `bl${i}`))}
      {bamboo(-TR.W / 2 + TR.DX - 14, backY, TR.W / 2 + TR.DX + 14, backY, 7, "bb")}
      {/* the platform: depth poles over each leg pair and crossed sticks */}
      {TR_LEGS.map((lx, i) => bamboo(lx, frontY, lx + TR.DX, backY, 5, `dp${i}`))}
      {Array.from({ length: 14 }, (_, i) => {
        const u = (i + 0.5) / 14;
        const xa = -TR.W / 2 + TR.W * u;
        return <line key={`st${i}`} x1={xa} y1={frontY} x2={xa + TR.DX} y2={backY} stroke="#b39556" strokeWidth={2.2} opacity={0.85} />;
      })}
      {Array.from({ length: 3 }, (_, i) => (
        <line key={`lx${i}`} x1={-TR.W / 2 + 6} y1={lerp(frontY, backY, (i + 1) / 4)} x2={TR.W / 2 + TR.DX - 6} y2={lerp(frontY, backY, (i + 1) / 4)} stroke="#a8894c" strokeWidth={3} />
      ))}
      {/* the hole the root leaves */}
      <ellipse cx={TR_ROOT.x} cy={TR_ROOT.y + 2} rx={22} ry={6} fill="#4a3018" opacity={0.75 * rootOut} />
      {/* leaves on the platform (behind the front bar) */}
      {TR_ANCHORS.map((a, i) => (trAnchorAt(a, t).d < 0.15 ? leafAt(a, i, "a") : null))}
      {/* the main stem */}
      <path d={smoothD(vine)} stroke="#4a7a2a" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <path d={smoothD(vine)} stroke="#7aa648" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.6} />
      {/* tendrils */}
      {[3, 6, 9, 11].map((k, i) => {
        const p = vine[k];
        return <path key={`td${i}`} d={`M ${f1(p.x)} ${f1(p.y)} c 6 -10 16 -6 12 2 c -3 6 -10 3 -6 -2`} stroke="#86ad50" strokeWidth={1.3} fill="none" />;
      })}
      {/* front legs and front bar */}
      {TR_LEGS.map((lx, i) => bamboo(lx, 2, lx, frontY, 7, `fl${i}`))}
      {bamboo(-TR.W / 2 - 16, frontY, TR.W / 2 + 16, frontY, 8, "fb")}
      {TR_LEGS.map((lx, i) => (
        <rect key={`tie${i}`} x={lx - 6} y={frontY - 4} width={12} height={8} fill={P.bambooTie} opacity={0.85} />
      ))}
      {/* the root: in the earth, then pulled up with its clump of soil and hair roots */}
      <g transform={`translate(${TR_ROOT.x + 10 * rootOut}, ${TR_ROOT.y - 16 * rootOut}) rotate(${-40 * rootOut})`}>
        <g opacity={rootOut}>
          {[-8, -3, 2, 7].map((dx, i) => (
            <path key={i} d={`M ${dx * 0.3} 4 q ${dx} 10 ${dx * 1.6} ${16 + 4 * i}`} stroke="#d6c4a0" strokeWidth={1.4} fill="none" />
          ))}
          <ellipse cx={0} cy={6} rx={13} ry={9} fill="#6a4a2a" />
        </g>
        <path d="M -3 4 L -2 -14 L 3 -14 L 4 4 Z" fill="#5f8a34" />
      </g>
      {/* leaves spilling over the front bar, then the dragged and fallen ones */}
      {TR_HANG.map((a, i) => leafAt(a, i, "h"))}
      {TR_ANCHORS.map((a, i) => (trAnchorAt(a, t).d >= 0.15 ? leafAt(a, i, "ad") : null))}
      {/* flowers on the vine */}
      {TR_FLOWERS.map((fl, i) => {
        const p = trAnchorAt(TR_ANCHORS[fl.a], t);
        if (p.d > 0.6) return null;
        return <CukeFlower key={`fl${i}`} x={p.x + fl.dx} y={p.y + fl.dy * (1 - p.d)} r={6 + 1.5 * hashS(i)} />;
      })}
      {/* young cucumbers hanging from the front bar; three are bitten off and dropped */}
      {TR_CUKES.map((c, i) => {
        const d = sstep((t - c.th) / 0.22);
        if (c.drop) {
          const g = clamp((t - c.th) / 0.16);
          const yy = lerp(c.y, -6, g * g);
          const xx = lerp(c.x, c.x * 0.5 + c.gx, sstep(g));
          return <Cucumber key={`ck${i}`} x={xx} y={yy} rot={lerp(c.rot, c.gr, sstep(g))} len={c.len} bitten={g > 0.05} />;
        }
        // the rest go with the sagging vine
        const hx = lerp(c.x, lerp(c.x, TR_PULL.x, 0.4), d);
        const hy = lerp(c.y, -60 + 20 * hashS(i), d);
        return <Cucumber key={`ck${i}`} x={hx} y={hy} rot={c.rot + d * 50 + stir(i + 40) * 0.6 * (1 - d)} len={c.len} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Sky, jungle (reused from the Ujanchar house) and the grove's sky      */
/* ------------------------------------------------------------------ */

const GroveSky: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="kc-grove-sky" gradientUnits="userSpaceOnUse" x1={0} y1={-300} x2={0} y2={820}>
        <stop offset="0%" stopColor="#8fb8d4" />
        <stop offset="45%" stopColor="#e2e2c8" />
        <stop offset="100%" stopColor="#ffd9a0" />
      </linearGradient>
      <radialGradient id="kc-grove-sun">
        <stop offset="0%" stopColor="#fff6dc" stopOpacity={0.95} />
        <stop offset="30%" stopColor="#ffe2a4" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#ffd090" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-2200} y={-1200} width={6400} height={2400} fill="url(#kc-grove-sky)" />
    <circle cx={1560} cy={150} r={600} fill="url(#kc-grove-sun)" />
    {Array.from({ length: 6 }, (_, i) => {
      const span = 5200;
      const cx = ((((-1400 + i * 760 + f * (0.1 + 0.1 * hashS(i + 3))) % span) + span) % span) - 1400;
      return (
        <g key={i} transform={`translate(${f1(cx)}, ${f1(-40 + 220 * hashS(i * 3))}) scale(${(0.8 + 0.6 * hashS(i * 5)).toFixed(3)})`} opacity={0.75}>
          <ellipse cx={0} cy={0} rx={150} ry={30} fill="#fffaf0" />
          <ellipse cx={-50} cy={-16} rx={70} ry={30} fill="#fffaf0" />
          <ellipse cx={0} cy={12} rx={150} ry={12} fill="#f2dcc0" opacity={0.6} />
        </g>
      );
    })}
  </g>
);

export const KachariSkyLayer: React.FC<{ view: KachariView; f: number; cam?: Cam; calm?: number }> = ({ view, f, cam, calm = 1 }) =>
  view === "grove" ? (
    <Layer depth={0.15} extraBlur={ujancharBgBlur(0.15, calm, cam)}>
      <GroveSky f={f} />
    </Layer>
  ) : (
    <UjancharSkyLayer f={f} time="morning" cam={cam} calm={calm} />
  );

export const KachariJungleLayer: React.FC<{ view: KachariView; f: number; cam?: Cam; calm?: number }> = ({ view, f, cam, calm = 1 }) => (
  <>
    <UjancharJungleLayer f={f} time="morning" cam={cam} calm={calm} />
    {view === "grove" && (
      // a warm afternoon haze over the far jungle, and far banana silhouettes along its foot
      <Layer depth={0.35} extraBlur={ujancharBgBlur(0.35, calm, cam)}>
        {Array.from({ length: 22 }, (_, i) => (
          <Banana key={i} x={-1700 + i * 250 + 60 * hashS(i * 3)} y={760 + 30 * hashS(i)} s={1.6 + 0.5 * hashS(i * 7)} f={f} />
        ))}
        <rect x={-1800} y={300} width={5600} height={1300} fill="#ffd9a0" opacity={0.12} />
      </Layer>
    )}
  </>
);

/* ------------------------------------------------------------------ */
/* Trees (0.5)                                                         */
/* ------------------------------------------------------------------ */

export const KachariTreesLayer: React.FC<{ view: KachariView; f: number; cam?: Cam; calm?: number }> = ({ view, f, cam, calm = 1 }) => (
  <Layer depth={0.5} extraBlur={ujancharBgBlur(0.5, calm, cam)}>
    {view === "grove" ? (
      <g>
        {[-1500, -700, 300, 1500, 2600, 3500].map((x, i) => (
          <Palm key={`p${x}`} x={x} y={820} s={1.2 + 0.15 * hashS(i)} f={f} seed={i + 2} />
        ))}
        <rect x={-1800} y={800} width={5600} height={400} fill="#5e6a34" />
        {Array.from({ length: 19 }, (_, i) => (
          <BananaPlant key={`gb${i}`} x={-1650 + i * 290 + 70 * hashS(i * 5)} y={840 + 16 * hashS(i)} s={0.62 + 0.12 * hashS(i * 3)} f={f} seed={100 + i} leaves={6} dead={1} tears={2} tone={0.6} lean={6 * (hashS(i * 9) - 0.5)} />
        ))}
      </g>
    ) : (
      <g>
        {(view === "compound"
          ? [
              [-1100, 1.1, 6],
              [-420, 1.05, 2],
              [520, 1.15, 5],
              [1560, 1.2, 8],
              [2420, 1.2, 9],
              [3120, 1.1, 3],
            ]
          : [
              [-1100, 1.1, 6],
              [-300, 1.05, 2],
              [620, 1.15, 5],
              [1220, 1.25, 8],
              [2420, 1.2, 9],
              [3120, 1.1, 3],
            ]
        ).map(([x, s, sd]) => (
          <Palm key={`p${x}`} x={x} y={860} s={s} f={f} seed={sd} />
        ))}
        {(view === "compound" ? [-760, 140, 1300, 2300, 2700, 3300] : [-760, 140, 1060, 2160, 2700, 3300]).map((x, i) => (
          <Banana key={`b${x}`} x={x} y={866} s={1.5 + 0.2 * hashS(i)} f={f} />
        ))}
        {/* the family's own house, glimpsed beyond the fence gap: a strip of its yard, its wall and thatch */}
        {view === "compound" ? (
          <g>
            <rect x={1700} y={760} width={700} height={240} fill="#a07a4c" />
            <ThatchGlimpse x={1880} y={790} w={700} s={0.42} />
            <MangoTree x={990} y={806} s={0.9} f={f} />
          </g>
        ) : (
          <g>
            <MangoTree x={1430} y={860} s={1.2} f={f} seed={3} />
            <rect x={1500} y={790} width={900} height={300} fill="#a07a4c" />
            <ThatchGlimpse x={1700} y={850} w={760} s={0.62} />
            <UjancharKolshi x={1900} y={850} s={0.6} />
          </g>
        )}
      </g>
    )}
  </Layer>
);

/* ------------------------------------------------------------------ */
/* Back of the yard (0.65)                                             */
/* ------------------------------------------------------------------ */

export interface KachariBackLayerProps {
  view: KachariView;
  f: number;
  cam?: Cam;
  calm?: number;
  veranda?: React.ReactNode;
  yard?: React.ReactNode;
  basket?: boolean;
}

export const KachariBackLayer: React.FC<KachariBackLayerProps> = ({ view, f, cam, calm = 1, veranda, yard, basket = true }) => (
  <Layer depth={0.65} extraBlur={ujancharBgBlur(0.65, calm, cam)}>
    {view === "compound" && (
      <g>
        <rect x={-1500} y={790} width={5000} height={1100 - 790} fill={P.yard} />
        <FenceAt x0={-1500} x1={-160} base={800} k={0.6} seed={41} />
        <FenceAt x0={840} x1={1240} base={800} k={0.6} seed={17} />
        <FenceAt x0={C_MAIN.x + C_MAIN.w * C_MAIN.s - 10} x1={C_GAP.x0} base={C_GAP.base} k={C_GAP.k} seed={3} />
        <FenceAt x0={C_GAP.x1} x1={3500} base={C_GAP.base} k={C_GAP.k} seed={5} />
        <GatePost x={C_GAP.x0} base={C_GAP.base} k={C_GAP.k} />
        <GatePost x={C_GAP.x1} base={C_GAP.base} k={C_GAP.k} />
        {[2050, 2420, 2900, 3300, -1300, -900, -500].map((x, i) => (
          <BushAt key={x} x={x} y={C_GAP.base + 6} w={200} k={0.6} f={f} seed={i * 3 + 2} />
        ))}
        <KachariFront x={C_KACHARI.x} y={C_KACHARI.y} s={C_KACHARI.s} w={C_KACHARI.w} f={f} veranda={veranda} />
        <MudHouse x={C_MAIN.x} y={C_MAIN.y} w={C_MAIN.w} s={C_MAIN.s} f={f} door={C_MAIN.door} window={C_MAIN.window} pots={[700, 740]} broom={460} smoke />
        <MudHouse x={C_CORNER.x} y={C_CORNER.y} w={C_CORNER.w} s={C_CORNER.s} f={f} window={C_CORNER.window} corner posts={[40, 250, 430]} pots={[380, 410]} />
        <BushAt x={920} y={814} w={220} k={0.6} f={f} seed={9} />
        {basket && <BambooBasket x={KACHARI.compound.basket.x} y={KACHARI.compound.basket.y} s={KACHARI.compound.basket.s} />}
      </g>
    )}
    {view === "corner" && (
      <g>
        <rect x={-1500} y={800} width={5000} height={1100 - 800} fill={P.yard} />
        <FenceAt x0={-1500} x1={N_MAIN.x + 60} base={862} seed={41} />
        <FenceAt x0={N_MAIN.x + N_MAIN.w - 20} x1={N_GAP.x0} base={862} seed={3} />
        <FenceAt x0={N_GAP.x1} x1={3500} base={862} seed={7} />
        {/* the worn path through the gap toward the family's house */}
        <path d={`M ${N_GAP.x0 + 4} 862 L ${N_GAP.x1 - 4} 862 L ${N_GAP.x1 + 60} 900 L ${N_GAP.x0 - 90} 900 Z`} fill="#b48a58" opacity={0.6} />
        <GatePost x={N_GAP.x0} base={862} />
        <GatePost x={N_GAP.x1} base={862} />
        {[1500, 2080, 2440, 2820, 3200].map((x, i) => (
          <UjancharBush key={x} x={x} y={872} w={170 + 60 * hashS(i + 5)} f={f} seed={i * 3 + 1} />
        ))}
        <MudHouse x={N_MAIN.x} y={N_MAIN.y} w={N_MAIN.w} s={N_MAIN.s} f={f} door={N_MAIN.door} window={N_MAIN.window} pots={[560, 596, 916]} broom={640} smoke>
          {veranda}
        </MudHouse>
      </g>
    )}
    {view === "grove" && (
      <g>
        <rect x={-1600} y={820} width={5200} height={1100 - 820} fill="#7e6a3c" />
        <FenceAt x0={1100} x1={3600} base={862} seed={13} />
        {Array.from({ length: 14 }, (_, i) => (
          <BananaPlant
            key={`mb${i}`}
            x={-1500 + i * 370 + 90 * hashS(i * 7 + 3)}
            y={880 + 14 * hashS(i * 2)}
            s={0.8 + 0.14 * hashS(i * 5)}
            f={f}
            seed={200 + i}
            leaves={7}
            dead={1 + (i % 2)}
            flower={i === 9}
            tone={0.3}
            lean={8 * (hashS(i * 11) - 0.5)}
            suckers={i % 3 === 0 ? 1 : 0}
          />
        ))}
      </g>
    )}
    {yard}
  </Layer>
);

/* ------------------------------------------------------------------ */
/* The kachari's back wall (0.8, grove)                                 */
/* ------------------------------------------------------------------ */

export const KachariWallLayer: React.FC<{ f: number; cam?: Cam; calm?: number; doorOpen?: number; doorway?: React.ReactNode }> = ({ f, cam, calm = 1, doorOpen = 1, doorway }) => (
  <Layer depth={0.8} extraBlur={ujancharBgBlur(0.8, calm, cam)}>
    {/* the grove floor behind (deep, so the floor's back edge never opens a gap) */}
    <rect x={-1500} y={856} width={4900} height={1100 - 856} fill="#8e6a40" />
    <KachariBack x0={G_BACK.x0} x1={G_BACK.x1} y={G_BACK.y} s={G_BACK.s} door={G_BACK.door} windows={G_BACK.windows} f={f} doorOpen={doorOpen} doorway={doorway} />
    {/* weeds at the foot of the wall */}
    {Array.from({ length: 16 }, (_, i) => {
      const wx = -1400 + i * 150 + 60 * hashS(i * 3);
      if (Math.abs(wx - G_BACK.door) < 110) return null;
      return (
        <g key={i}>
          {[-6, 0, 6].map((o, j) => (
            <path key={j} d={`M ${wx + o} ${G_BACK.y + 2} q ${o * 0.8} -18 ${o * 1.6 + 4} -${26 + 10 * hashS(i + j)}`} stroke={j % 2 ? "#5a7a30" : "#6e8a3a"} strokeWidth={3} fill="none" strokeLinecap="round" />
          ))}
        </g>
      );
    })}
  </Layer>
);

/* ------------------------------------------------------------------ */
/* Mid plane (0.85): the corner room, or the near grove and the cow split */
/* ------------------------------------------------------------------ */

/** The banana clumps behind the cow's hiding place and across the near grove (0.85), drawn before the cow. */
export const KachariGroveBehindCowLayer: React.FC<{ f: number; cam?: Cam; calm?: number }> = ({ f, cam, calm = 1 }) => (
  <Layer depth={0.85} extraBlur={ujancharBgBlur(0.85, calm, cam)}>
    {[
      [1080, 1.0, 1, 2, false],
      [1300, 1.08, 2, 1, true],
      [1880, 1.04, 3, 2, false],
      [2240, 1.1, 4, 1, false],
      [2640, 1.0, 5, 2, true],
      [3080, 1.06, 6, 1, false],
      [3360, 1.0, 7, 2, false],
    ].map(([x, s, sd, dead, flower]) => (
      <BananaPlant key={`nb${x}`} x={x as number} y={884} s={s as number} f={f} seed={300 + (sd as number)} leaves={8} dead={dead as number} flower={flower as boolean} lean={4 * (hashS((sd as number) * 3) - 0.5)} suckers={1} />
    ))}
  </Layer>
);

/**
 * The clump IN FRONT of the hidden cow (0.85): three close trunks and a low mass of young suckers' broad leaves,
 * covering a cow standing at KACHARI.grove.cowHide (Ujanchar cow, facing right, s 1.05) except her ear
 * between the two right trunks and her tail past the left trunk.
 */
export const KachariGroveCowScreenLayer: React.FC<{ f: number; cam?: Cam; calm?: number; opacity?: number }> = ({ f, cam, calm = 1, opacity = 1 }) => (
  <Layer depth={0.85} extraBlur={ujancharBgBlur(0.85, calm, cam)} opacity={opacity}>
    <CowScreenClump f={f} />
  </Layer>
);

const CowScreenClump: React.FC<{ f: number }> = ({ f }) => {
  const { x, y } = G_HIDE;
  // The cow at cowHide (Ujanchar cow, s 1.05, facing +x): tail at x - 124..147 (left of trunk A: visible), hump at
  // x + 52 (trunk B), ear at x + 126..178, y - 210..227 (the gap between trunks B and C, above the leaf mass: visible),
  // head at x + 172..256 (behind trunks C and D). The leaf mass of young suckers covers everything below y - 196.
  const leaf = (dx: number, dy: number, dir: number, len: number, wid: number, k: number, ang: number) => {
    const sw = 1.8 * Math.sin(f * 0.03 + k * 1.3) + 0.8 * noise1(f * 0.02, 800 + k);
    return (
      <g key={`cl${k}`} transform={`translate(${f1(x + dx)}, ${f1(y + dy)}) scale(${dir}, 1) rotate(${f1(ang + sw)})`}>
        <BananaLeaf len={len} wid={wid} droop={0.55} tears={1} seed={900 + k} />
      </g>
    );
  };
  const upper: Array<[number, number]> = [
    [-110, 1],
    [-50, 1],
    [10, 1],
    [70, 1],
    [130, 1],
    [190, 1],
    [245, 1],
    [80, -1],
    [150, -1],
    [215, -1],
    [280, -1],
  ];
  const lower: Array<[number, number]> = [
    [-100, 1],
    [-30, 1],
    [40, 1],
    [110, 1],
    [180, 1],
    [250, 1],
    [70, -1],
    [200, -1],
  ];
  return (
    <g>
      {/* the three trunks of the clump */}
      <BananaPlant x={x - 70} y={y + 4} s={1.12} f={f} seed={410} leaves={7} dead={2} lean={-3} />
      <BananaPlant x={x + 52} y={y + 8} s={1.18} f={f} seed={411} leaves={8} dead={2} lean={2} flower />
      <BananaPlant x={x + 262} y={y + 4} s={1.0} f={f} seed={413} leaves={6} dead={1} lean={-2} />
      <BananaPlant x={x + 200} y={y + 6} s={1.12} f={f} seed={412} leaves={7} dead={1} lean={1} />
      {/* the young suckers' stems and their low broad leaves */}
      {upper.map(([dx], i) => (
        <path key={`ss${i}`} d={`M ${f1(x + dx - 6)} ${y + 2} L ${f1(x + dx - 4)} ${y - 146} L ${f1(x + dx + 4)} ${y - 146} L ${f1(x + dx + 6)} ${y + 2} Z`} fill={i % 2 ? "#7d9a4a" : "#8aa654"} />
      ))}
      {upper.map(([dx, dir], i) => leaf(dx, -146, dir, 165, 64, i, -12))}
      {lower.map(([dx, dir], i) => leaf(dx, -62, dir, 120, 54, i + 20, -4))}
    </g>
  );
};

export const KachariMidLayer: React.FC<{
  view: KachariView;
  f: number;
  cam?: Cam;
  calm?: number;
  cornerBehind?: React.ReactNode;
  mid?: React.ReactNode;
  cow?: React.ReactNode;
  cowScreenOpacity?: number;
}> = ({ view, f, cam, calm = 1, cornerBehind, mid, cow, cowScreenOpacity = 1 }) => {
  if (view === "grove") {
    return (
      <>
        <KachariGroveBehindCowLayer f={f} cam={cam} calm={calm} />
        {cow}
        <KachariGroveCowScreenLayer f={f} cam={cam} calm={calm} opacity={cowScreenOpacity} />
        {mid && <Layer depth={0.85}>{mid}</Layer>}
      </>
    );
  }
  if (view !== "corner") return mid ? <Layer depth={0.85}>{mid}</Layer> : null;
  const right = N_CORNER.x + N_CORNER.w * N_CORNER.s;
  return (
    <Layer depth={0.85} extraBlur={ujancharBgBlur(0.85, calm, cam)}>
      {/* earth under the corner room (its own footing; it meets the floor's back edge) */}
      <path d={`M -1500 870 L ${right + 140} 870 Q ${right + 230} 874 ${right + 260} 900 L -1500 1000 Z`} fill="#a98052" />
      {cornerBehind}
      <MudHouse x={N_CORNER.x} y={N_CORNER.y} w={N_CORNER.w} s={N_CORNER.s} f={f} window={N_CORNER.window} corner posts={[40, 330, 620, 770]} pots={[640, 676]} />
      {mid}
    </Layer>
  );
};

/* ------------------------------------------------------------------ */
/* The whole backdrop, calmed (CAM-11)                                  */
/* ------------------------------------------------------------------ */

export interface KachariBackdropProps {
  view: KachariView;
  f: number;
  cam?: Cam;
  calm?: number;
  veranda?: React.ReactNode;
  yard?: React.ReactNode;
  cornerBehind?: React.ReactNode;
  mid?: React.ReactNode;
  doorway?: React.ReactNode;
  doorOpen?: number;
  cow?: React.ReactNode;
  /** opacity of the clump in front of the cow (default 1; QA and reveals) */
  cowScreenOpacity?: number;
  basket?: boolean;
}

export const KachariBackdrop: React.FC<KachariBackdropProps> = ({ view, f, cam, calm = 1, veranda, yard, cornerBehind, mid, doorway, doorOpen = 1, cow, cowScreenOpacity = 1, basket = true }) => (
  <div style={{ position: "absolute", inset: 0, filter: ujancharBgFilter(calm, "morning") }}>
    <KachariSkyLayer view={view} f={f} cam={cam} calm={calm} />
    <KachariJungleLayer view={view} f={f} cam={cam} calm={calm} />
    <KachariTreesLayer view={view} f={f} cam={cam} calm={calm} />
    <KachariBackLayer view={view} f={f} cam={cam} calm={calm} veranda={veranda} yard={yard} basket={basket} />
    {view === "grove" && <KachariWallLayer f={f} cam={cam} calm={calm} doorOpen={doorOpen} doorway={doorway} />}
    <KachariMidLayer view={view} f={f} cam={cam} calm={calm} cornerBehind={cornerBehind} mid={mid} cow={cow} cowScreenOpacity={cowScreenOpacity} />
    {view === "grove" && (
      // the warm afternoon over the far planes, strongest on the sun side (upper right)
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 70% at 82% 18%, rgba(255,206,130,0.55) 0%, rgba(255,180,100,0.14) 50%, rgba(0,0,0,0) 100%)",
          mixBlendMode: "screen",
          opacity: 0.45,
        }}
      />
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Floor (1)                                                           */
/* ------------------------------------------------------------------ */

export interface KachariFloorProps {
  view: KachariView;
  f: number;
  trellisTorn?: number;
  basket?: boolean;
  /** near banana plants on the floor plane at the grove's right (default true) */
  nearPlants?: boolean;
  under?: React.ReactNode;
  children?: React.ReactNode;
}

const GroveLitter: React.FC = () => (
  <g>
    {Array.from({ length: 34 }, (_, i) => {
      const lx = -1400 + i * 140 + 80 * hashS(i * 3.3);
      const ly = 900 + 360 * hashS(i * 5.1);
      const r = 360 * hashS(i * 7.7);
      const big = hashS(i * 2.9) < 0.35;
      return (
        <g key={i} transform={`translate(${f1(lx)}, ${f1(ly)}) rotate(${f1(r)}) scale(1, 0.35)`}>
          <path d={big ? "M 0 0 Q 30 -16 70 -4 Q 36 8 0 0 Z" : "M 0 0 Q 14 -8 30 -2 Q 16 4 0 0 Z"} fill={i % 3 ? BAN_DEAD : BAN_DEAD_LT} opacity={0.75} />
        </g>
      );
    })}
  </g>
);

export const KachariFloorLayer: React.FC<KachariFloorProps> = ({ view, f, trellisTorn = 0, basket = true, nearPlants = true, under, children }) => (
  <Layer depth={1}>
    {view === "grove" ? (
      <g>
        {/* the shaded grove floor, warmer where the sun comes through on the right */}
        <path d="M -1500 872 Q 960 864 3400 872 L 3400 1500 L -1500 1500 Z" fill="#a07848" />
        <ellipse cx={1500} cy={990} rx={900} ry={90} fill="#c49460" opacity={0.35} />
        {/* the narrow worn path from the back door into the grove */}
        <path d={`M ${G_BACK.door - 50} 874 Q ${G_BACK.door + 120} 900 900 940 Q 1100 980 1240 1010 L 1300 1070 Q 1080 1040 860 990 Q ${G_BACK.door + 80} 930 ${G_BACK.door - 90} 878 Z`} fill="#c09a68" opacity={0.75} />
        <GroveLitter />
        <CucumberTrellis x={G_TRELLIS.x} y={G_TRELLIS.y} s={G_TRELLIS.s} f={f} torn={trellisTorn} />
        {under}
        {nearPlants && (
          <g>
            <BananaPlant x={2120} y={930} s={1.32} f={f} seed={520} leaves={8} dead={2} suckers={2} lean={-3} />
            <BananaPlant x={2600} y={960} s={1.4} f={f} seed={521} leaves={8} dead={1} flower lean={3} />
            <BananaPlant x={-1100} y={940} s={1.3} f={f} seed={522} leaves={7} dead={2} />
          </g>
        )}
      </g>
    ) : (
      <g>
        <path d="M -1500 880 Q 960 868 3500 880 L 3500 1500 L -1500 1500 Z" fill={P.floor} />
        {[-1100, -620, -200, 380, 900, 1700, 2300, 2900, 3300].map((x, i) => (
          <path key={x} d={`M ${x} ${960 + 30 * (i % 2)} q 90 -18 180 0`} stroke={P.floorSweep} strokeWidth={2} fill="none" opacity={0.35} />
        ))}
        {view === "compound" ? (
          <g>
            {/* the compound path to the kachari steps */}
            <path d="M 240 880 Q 300 960 160 1500 L 620 1500 Q 520 960 420 880 Z" fill="#c69a66" opacity={0.45} />
            <ellipse cx={1320} cy={930} rx={460} ry={50} fill="#e7c48a" opacity={0.3} />
          </g>
        ) : (
          <g>
            <ellipse cx={1000} cy={950} rx={520} ry={64} fill="#e7c48a" opacity={0.35} />
            {/* a few pebbles and a dropped leaf in the yard */}
            {Array.from({ length: 9 }, (_, i) => (
              <ellipse key={i} cx={-200 + i * 260 + 80 * hashS(i * 3)} cy={980 + 120 * hashS(i * 5)} rx={5 + 4 * hashS(i)} ry={3} fill="#8a6a44" opacity={0.6} />
            ))}
            {basket && <BambooBasket x={KACHARI.corner.basket.x} y={KACHARI.corner.basket.y} s={KACHARI.corner.basket.s} />}
          </g>
        )}
        {under}
      </g>
    )}
    {children}
  </Layer>
);

/* ------------------------------------------------------------------ */
/* Light (0.95, screen)                                                */
/* ------------------------------------------------------------------ */

/** The grove's dappled afternoon light: soft sun flecks on the earth and the wall that come and go with the leaves, slanted shafts and drifting motes. */
export const KachariGroveLightLayer: React.FC<{ f: number; level?: number; mask?: string }> = ({ f, level = 1, mask }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", opacity: 0.6 * level, WebkitMaskImage: mask, maskImage: mask }}>
    <Layer depth={0.95}>
      <defs>
        <radialGradient id="kc-fleck">
          <stop offset="0" stopColor="#ffe8b0" stopOpacity={0.95} />
          <stop offset="0.6" stopColor="#ffd890" stopOpacity={0.4} />
          <stop offset="1" stopColor="#ffd890" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="kc-shaft" gradientUnits="userSpaceOnUse" x1={0} y1={-100} x2={0} y2={1000}>
          <stop offset="0" stopColor="#fff0c8" stopOpacity={0} />
          <stop offset="0.3" stopColor="#ffe2a0" stopOpacity={0.7} />
          <stop offset="1" stopColor="#ffd080" stopOpacity={0} />
        </linearGradient>
        <filter id="kc-shaft-blur" x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={16} />
        </filter>
      </defs>
      <g filter="url(#kc-shaft-blur)" opacity={0.32}>
        {[
          [1300, 60, 0],
          [1560, 90, 1.7],
          [1820, 50, 3.2],
          [980, 40, 4.4],
        ].map(([x, w, ph], i) => {
          const xt = x + 18 * Math.sin(f * 0.01 + ph);
          const a = 0.6 + 0.4 * noise1(f * 0.02, 600 + i);
          return <polygon key={i} points={`${xt - w / 2},-100 ${xt + w / 2},-100 ${xt - 360 + w * 1.6},1000 ${xt - 360 - w * 1.6},1000`} fill="url(#kc-shaft)" opacity={a} />;
        })}
      </g>
      {/* flecks on the earth: flattened, coming and going as the leaves move */}
      {Array.from({ length: 48 }, (_, i) => {
        const bx = -500 + 3000 * hashS(i * 3.1 + 1);
        const by = 890 + 380 * Math.pow(hashS(i * 5.3 + 2), 1.3);
        const o = clamp(0.25 + 0.9 * noise1(f * 0.018 + i * 0.37, 900 + i));
        if (o < 0.04) return null;
        const r = (24 + 46 * hashS(i * 7.9)) * (0.7 + 0.5 * ((by - 880) / 400));
        return <ellipse key={i} cx={bx + 8 * noise1(f * 0.012, 1000 + i)} cy={by} rx={r} ry={r * 0.32} fill="url(#kc-fleck)" opacity={o * (bx > 1000 ? 1 : 0.6)} />;
      })}
      {/* flecks on the kachari's back wall */}
      {Array.from({ length: 14 }, (_, i) => {
        const bx = -500 + 1300 * hashS(i * 4.7 + 3);
        const by = 520 + 300 * hashS(i * 6.1 + 4);
        const o = clamp(0.2 + 0.9 * noise1(f * 0.02 + i * 0.5, 1100 + i));
        if (o < 0.04) return null;
        const r = 16 + 26 * hashS(i * 2.3);
        return <ellipse key={`w${i}`} cx={bx} cy={by} rx={r} ry={r * 0.8} fill="url(#kc-fleck)" opacity={o * 0.7} />;
      })}
      {/* motes drifting in the light */}
      {Array.from({ length: 30 }, (_, i) => {
        const period = 240 + 80 * hashS(i * 1.7);
        const ph = ((((f + hashS(i * 4.1) * period) % period) + period) % period) / period;
        const x = 700 + 1500 * hashS(i * 7.3) + 30 * Math.sin(f * 0.013 + i * 2.1) + 30 * ph;
        const y = 420 + 480 * hashS(i * 3.3) - 50 * ph + 6 * noise1(f * 0.015, 1200 + i);
        const o = 0.45 * Math.pow(Math.sin(Math.PI * ph), 1.2);
        return (
          <g key={`m${i}`} opacity={o}>
            <circle cx={x} cy={y} r={4} fill="#fff0c4" opacity={0.25} />
            <circle cx={x} cy={y} r={1.3} fill="#fff8e2" />
          </g>
        );
      })}
    </Layer>
  </div>
);

export const KachariLightLayer: React.FC<{ view: KachariView; f: number; level?: number; mask?: string }> = ({ view, f, level = 1, mask }) =>
  view === "grove" ? <KachariGroveLightLayer f={f} level={level} mask={mask} /> : <UjancharLightLayer f={f} time="morning" level={(view === "compound" ? 0.55 : 0.85) * level} mask={mask} />;

/* ------------------------------------------------------------------ */
/* Foreground (1.35, 1.6)                                              */
/* ------------------------------------------------------------------ */

/** Near grass and dry banana litter at the bottom of the grove frame, and big soft banana leaves into the top corners. */
export const KachariForegroundLayer: React.FC<{ view: KachariView; f: number; grass?: boolean; leaves?: boolean; bokeh?: boolean }> = ({ view, f, grass = true, leaves, bokeh = true }) => {
  if (view !== "grove") return <UjancharForegroundLayer f={f} time="morning" grass={grass} bokeh={bokeh} leaves={leaves ?? false} />;
  const showLeaves = leaves ?? true;
  return (
    <>
      {grass && (
        <Layer depth={1.35} extraBlur={2.6}>
          {Array.from({ length: 40 }, (_, i) => {
            const x = -800 + i * 110 + 50 * (hashS(i * 3.1) - 0.5);
            const y = 1030 + 30 * hashS(i * 5.7);
            const h = 26 + 34 * hashS(i * 2.2);
            const sw = 2.5 * Math.sin(f * 0.04 + i * 1.3) + 1.2 * noise1(f * 0.03, 1300 + i);
            return (
              <g key={i} transform={`rotate(${f1(sw)} ${f1(x)} ${f1(y)})`}>
                {Array.from({ length: 7 }, (_, j) => {
                  const bx = x + (j - 3.5) * 3.4;
                  const hh = h * (0.55 + 0.45 * hashS(i * 13 + j * 3.7));
                  const lean = 10 * (hashS(i * 7 + j * 1.3) - 0.5) + (j - 3.5) * 1.6;
                  return <path key={j} d={`M ${f1(bx - 1.8)} ${f1(y)} Q ${f1(bx + lean * 0.3)} ${f1(y - hh * 0.6)} ${f1(bx + lean)} ${f1(y - hh)} Q ${f1(bx + lean * 0.3 + 1.2)} ${f1(y - hh * 0.55)} ${f1(bx + 1.8)} ${f1(y)} Z`} fill={j % 3 === 0 ? "#3b5620" : j % 3 === 1 ? "#55742a" : "#6b8a33"} />;
                })}
                {i % 4 === 0 && (
                  <g transform={`translate(${f1(x + 20)}, ${f1(y + 6)}) rotate(${f1(-20 + 40 * hashS(i))}) scale(1, 0.4)`}>
                    <path d="M 0 0 Q 40 -20 90 -4 Q 44 10 0 0 Z" fill={BAN_DEAD} />
                  </g>
                )}
              </g>
            );
          })}
        </Layer>
      )}
      {showLeaves && (
        <Layer depth={1.6} extraBlur={6}>
          {[
            [2140, -90, 150, 601],
            [2380, -120, 120, 602],
            [-260, -110, 40, 603],
          ].map(([ax, ay, ang, sd]) => {
            const sw = 1.6 * Math.sin(f * 0.025 + sd) + noise1(f * 0.02, 1400 + sd);
            return (
              <g key={sd} transform={`translate(${ax}, ${ay}) rotate(${f1(ang + sw)})`}>
                <BananaLeaf len={460} wid={150} droop={0.22} tears={4} seed={sd} tone={0.4} />
              </g>
            );
          })}
        </Layer>
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* The whole set                                                       */
/* ------------------------------------------------------------------ */

export interface KrishnanagarKachariProps extends KachariBackdropProps {
  trellisTorn?: number;
  nearPlants?: boolean;
  under?: React.ReactNode;
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

/** The whole Krishnanagar kachari set for a view, in plane order, with optional characters on the floor and the view's Grade. */
export const KrishnanagarKachari: React.FC<KrishnanagarKachariProps> = ({
  view,
  f,
  cam,
  calm = 1,
  veranda,
  yard,
  cornerBehind,
  mid,
  doorway,
  doorOpen = 1,
  cow,
  cowScreenOpacity = 1,
  basket = true,
  trellisTorn = 0,
  nearPlants = true,
  under,
  floor,
  front,
  light = true,
  lightLevel = 1,
  lightMask,
  foreground = true,
  leaves,
  grade = true,
}) => (
  <>
    <KachariBackdrop view={view} f={f} cam={cam} calm={calm} veranda={veranda} yard={yard} cornerBehind={cornerBehind} mid={mid} doorway={doorway} doorOpen={doorOpen} cow={cow} cowScreenOpacity={cowScreenOpacity} basket={basket} />
    <KachariFloorLayer view={view} f={f} trellisTorn={trellisTorn} basket={basket} nearPlants={nearPlants} under={under}>
      {floor}
    </KachariFloorLayer>
    {light && <KachariLightLayer view={view} f={f} level={lightLevel} mask={lightMask} />}
    {front && <Layer depth={1}>{front}</Layer>}
    {(foreground || leaves) && <KachariForegroundLayer view={view} f={f} grass={foreground} bokeh={foreground} leaves={leaves} />}
    {grade && <Grade {...kachariGrade(view)} />}
  </>
);
