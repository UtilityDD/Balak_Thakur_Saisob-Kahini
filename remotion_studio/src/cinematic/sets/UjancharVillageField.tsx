import React, { useId } from "react";
import { useSetSkin } from "./SetSkin";
import { clamp, lerp, noise1, safeId } from "../core/anim";
import { Cam, Grade, Layer } from "../core/Stage";
import { Bokeh } from "../fx/Fx";
import { Banana, Birds, Palm } from "./S01_DaySets";
import {
  UJANCHAR_PALETTE as P,
  UjancharBroom,
  UjancharBush,
  UjancharFenceRun,
  UjancharForegroundGrass,
  UjancharJungleLayer,
  UjancharKolshi,
  UjancharSkyLayer,
  ujancharBgBlur,
  ujancharBgFilter,
  ujancharHash as hashS,
} from "./UjancharHouse";
import { BananaPlant, MangoTree, MudHouse } from "./KrishnanagarKachari";

/**
 * THE UJANCHAR VILLAGE FIELD (উজানচর, খেলার মাঠ): Episode 6 scene 02's set (STO-21), one world in three views (the
 * lane, the log and the sunset added 2026-11-23 for the immersive re-cut, STO-22a; the delivered field and house
 * views and times are unchanged, checked pixel for pixel against the delivered build).
 *
 * Built from the Ujanchar village house's own pieces and materials (src/cinematic/sets/UjancharHouse.tsx: the same
 * thatch, mud walls, bamboo posts and lattice fence, clay pots, bushes, jungle, sky, near grass and the CAM-11
 * background grade) and Episode 5's parametric pieces (src/cinematic/sets/KrishnanagarKachari.tsx: MudHouse,
 * MangoTree, BananaPlant), so the field, the sweet stall and the friend's house belong to the family's village.
 *
 *  view "field"  THE PLAYING FIELD at the village edge, and THE SWEET STALL (মুদির দোকান) at its right-hand edge (one
 *                continuous floor: the stall is reached by panning / cutting right, cams below). Beaten earth and worn
 *                grass; the NEAR big mango tree on the floor plane at the left (Balak's seat under it, dappled shade);
 *                the FAR big mango on the mid-field plane; the field running back to a line of thatched huts at the
 *                village edge, banana plants, coconut palms and the dense jungle. The stall: a small thatched open-front
 *                stall on a low mud plinth, a plank counter with glass jars (one of round coloured marble-lozenges),
 *                jute sacks and a basket of puffed rice in front, shelves, a hanging hand of bananas and a hand scale.
 *  view "house"  THE FRIEND'S HOUSE "a few steps into the village": another Ujanchar household's courtyard (not the
 *                family's: the house shows its corner, a different door and window, a bottle-gourd vine over the thatch,
 *                a clothes line with a sari and a gamchha, a door step, a kitchen hut and a haystack behind), with the
 *                dada's WHITE SHIRT HANGING ON A BAMBOO PEG on the veranda post left of the door (breast pocket).
 *  view "lane"   THE VILLAGE LANE (গ্রামের পথ, W1 a and L1): a broad beaten-earth path running left to right between
 *                bamboo fences and mud-hut walls (hut A behind the fence at the left, hut B fronting the path with its
 *                door and window, hut C at the right), banana plants and a tall palm behind the fences, a big HAYSTACK
 *                right on the path's back edge (about 2 m: a six-year-old crouches behind it), and beyond the haystack a
 *                gap in the fence where a SIDE LANE recedes between two fences to a CROSS LANE far ahead; beyond the
 *                cross lane, on the far plane, THE FRIEND'S HOUSE at the lane's end (the same house as view "house":
 *                corner, door, barred window, bottle-gourd vine), the village's other huts and the jungle. Wide enough
 *                for slow lateral tracks (floor x -1500..4200).
 *  FIELD EXTRAS  THE FALLEN LOG at the field's edge (G2; opt-in `log`, or the FallenLog piece) with six seats on its top.
 *  time "sunset" (G2): low, warm, golden-orange light: the big sun just above the jungle's crowns right of centre, a
 *                dusky blue-to-rose-to-gold sky with lit cloud streaks, the jungle a warm darker silhouette, long
 *                shadows to the left (LongShadow for figures), gold rims on the log, an amber grade. Works in every view.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * API (everything renders INSIDE a <Stage>; the layer components wrap their own <Layer>)
 * ---------------------------------------------------------------------------------------------------------------
 *  Quick use:
 *    const cam = villageKeepInSet("field", VILLAGE_CAMS.field.mangoMedium);
 *    <Stage cam={cam} background={VILLAGE_BG[time]}>
 *      <UjancharVillageField view="field" time="lateMorning" f={lifeF} cam={cam} floor={<>balak, boys ...</>} />
 *    </Stage>
 *
 *  Or layer by layer (characters between the planes, their own rack-focus layers):
 *    <VillageBackdrop view time f cam calm far mid yard />   sky 0.15, jungle 0.35, trees 0.5, far 0.65, (field) mid
 *                                                            0.8, inside the calm CAM-11 grade (+ the afternoon / sunset warmth)
 *    <VillageFloorLayer view time f seller lozengeJar doorway inPocket log crossing under>{characters}</VillageFloorLayer>
 *    <VillageLightLayer view time f level mask />            screen: dapples under the mango, shafts, motes
 *    <VillageForegroundLayer view time f grass leaves bokeh />   1.35 near grass, 1.6 mango-leaf sprays (field)
 *    <Grade {...villageGrade(time)} />
 *  The planes one by one: VillageSkyLayer, VillageJungleLayer, VillageTreesLayer, VillageFarLayer, VillageMidLayer.
 *
 *  Common props
 *    view     "field" | "house" | "lane".
 *    time     "lateMorning" (default: bright, high sun upper right; scene 02's opening) | "afternoon" (warmer and lower,
 *             longer shadows to the left, gold on the far planes: the lozenges and the end) | "sunset" (G2: the sun low
 *             just above the jungle, golden-orange light, very long shadows to the left, an amber grade; always pair it
 *             with VILLAGE_BG.sunset and villageGrade("sunset")).
 *    f        LIFE clock (lifeF): mango leaves, banana leaves, clothes, dapples, smoke, clouds. Never a held story clock.
 *    cam      the Stage cam (optional; only for the CAM-11 depth blur so the camera's DOF is not doubled).
 *    calm     0..1 (default 1): the CAM-11 background treatment, exactly as the Ujanchar house.
 *  Slots (ReactNodes in that plane's world coordinates)
 *    far       0.65 (both): tiny far figures at the village edge / the house's back fence and gate gap.
 *    mid       0.8 (field): the boys' ball game beyond Balak (VILLAGE.field.game[]).
 *    yard      alias of `far` kept for the Ujanchar API (drawn on 0.65 after `far`).
 *    seller    floor (field): the sweet-seller, drawn behind the counter and jars, in front of the stall's back
 *              wall and his platform (Puppet listenerB, `seated`, at VILLAGE.field.sellerSeat).
 *    lozengeJar (default true, field) the set's own lozenge jar at VILLAGE.field.lozengeJar; pass false when the
 *              props agent's jar is drawn there instead.
 *    doorway   floor (house): inside the friend's doorway, behind the door leaf, frame and veranda posts, inside the
 *              house's light calm (half CAM-11; once she is out of the door draw her in `floor` / children) (the boudi
 *              coming out: VILLAGE.house.doorway).
 *    inPocket  floor (house): drawn between the shirt's body and its breast-pocket face, so a note drawn here with its
 *              lower part below VILLAGE.house.shirtPocket.y is hidden by the pocket (slide it up to pull it out).
 *    shirt     (default true, house) the shirt on its peg; false = only the peg (after the shirt is taken).
 *    log       (default false, field) the fallen log at VILLAGE.field.log, drawn after the stall and before `under` and
 *              the characters (children seated on it are drawn in `floor` / children, so their legs hang in front).
 *    logShadows (field, with `log`) [{ x: seat x, h: figure height, w? }]: the seated children's long shadows, drawn on
 *              the ground UNDER the log (so they don't cross its face), falling left as long as the time asks.
 *    crossing  floor (lane): figures on the cross lane far ahead (the culprit crossing at VILLAGE.lane.farCross), drawn
 *              on the ground before the huts, fences, receding side-lane fences and the haystack, so they pass behind
 *              them and show in the side lane's mouth.
 *    under     floor: drawn on the ground after the set pieces, before `children` (put LongShadow here).
 *    floor / front (UjancharVillageField only): characters on depth 1 / depth 1 after the light layer.
 *
 *  Pieces (exported): SweetStall { x, y, s?, f, time?, seller?, lozengeJar? }; GlassJar { x, y, s?, kind?, f? };
 *    ShirtOnPeg { x, y, s?, f, sway?, inPocket?, shirt? } with shirtPocketAt(...) / shirtPegAt(...); JuteSack;
 *    Haystack; ClothesLine; GourdVine; FallenLog { x, y, s?, len?, d?, time?, seed?, shadows? } (base centre; seat line
 *    y - d + 4);
 *    LongShadow { x, y, h, w?, time?, opacity? } (a soft cast shadow from a figure's feet, falling left: short in the
 *    late morning, 0.9 h in the afternoon, 2.3 h at sunset).
 *  Constants: VILLAGE (planes, extents, per-view placement points), VILLAGE_CAMS (named working cams per view),
 *    VILLAGE_BG[time]; helpers villageGrade(time), villageKeepInSet(view, cam), villageFrameOn(wx, wy, sx, sy, zoom),
 *    villageScaleAt(y) (the depth factor for figures on the floor plane, see below).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * PLACEMENT POINTS: VILLAGE[view].<name> = { x, y, depth, s?, flip? } (y = feet / seat / base; s = the suggested
 * scale for the figure named in the point's comment below). Draw the figure in the layer of that depth.
 * ---------------------------------------------------------------------------------------------------------------
 *  Figure scales on the floor plane follow Episode 5 (adult Puppet 1.15, StandingChild 0.56, SeatedChild plate 0.95,
 *  all at y 960) times villageScaleAt(y) = 1 + (y - 960) * 0.0032: a figure further back (smaller y) is smaller.
 *  field (depth 1 unless noted):
 *    balakSeat (SeatedChild 0.95, facing right, under the near mango, in its shade), treasury (the spread gamchha's
 *    centre, in front of him), ballGiver (standing child), smirkers[0..1] (standing children behind, hands to mouths),
 *    friendCrouch (the culprit crouching to press the note into his hands), friendExit[0..2] (the path toward the
 *    village: the last point is on the far edge of the floor), gangReturn[0..3] (AG3: the friend nearest, then three
 *    boys), game[0..3] (0.8: the ball game beyond; StandingChild 0.3), stall points: counterTop (y of the plank top,
 *    x0..x1 in the point's `x0`/`x1`), lozengeJar (the hero jar's base centre on the counter), jarA / jarB (the set's
 *    other jars), sellerSeat (Puppet seated, adult 0.9), sellerHands (the counter point in front of him, where the
 *    twist is filled), coinPlace (counter, where coins are laid), twistStack, buyer (Balak standing before the
 *    counter, StandingChild), crowd[0..4] (the playmates round him by the stall).
 *  house (depth 1):
 *    shirtPeg (the peg's tip), shirtPocket (the top centre of the pocket's mouth; the hand goes here), culpritAtShirt
 *    (a boy on the veranda floor reaching right to the pocket), doorway (the boudi in the door, adult on the veranda
 *    floor), verandaEdge (where she bends down to Balak), doorStep (the step's top), verandaFoot (Balak standing at the
 *    veranda's foot, holding the note up), dada (hands on hips), culprit, boudiOut (on the veranda edge holding up the
 *    note), balak, gang[0..3] (the boys behind), gateGap (0.65: where the gang come in through the back fence).
 *  field, G2 (with `log`): log (the log's base centre, len, d), logSeat (the seat line on its top: x, y = the log's top
 *    where a seated child's seat point goes, s = SeatedChild 0.95 x villageScaleAt(1010) = 1.10 (the depth is the log's
 *    ground contact), standS = StandingChild scale there, ground = 1010 (feet), x0..x1 the usable top, seats[0..5] six
 *    seat points 200 px apart, x 800..1800 (seats 3..5 flipped), balak = 2, culprit = 3: side by side).
 *  lane (depth 1 unless noted):
 *    pathLine { y 982, x0 -1300, x1 4000, top 914, bottom 1060 } (the walking line and the path band), w1Elder[0..1] /
 *    w1Balak[0..1] (W1 a: the elder ahead on the near side of the path, Balak behind; [0] at laneTrackStart, [1] at
 *    laneTrackEnd, 440 px on), l1Walk (L1: Balak's start), haystackApproach (where he sees the culprit and ducks),
 *    haystack (its base centre, s 1.4), haystackHide (crouched at its left front edge, peeking right around it toward
 *    the side lane; StandingChild crouch), haystackLeave (on again), toHouse[0..3] (along the path, into the side lane,
 *    to its mouth at the cross lane), farCross[0..1] (the culprit crosses the cross lane left to right, StandingChild
 *    0.32, in the `crossing` slot), laneMouth (the side lane's mouth, x0 2700..x1 3050 visible between the receding
 *    fences), houseEnd (0.65: the friend's door at the lane's end, a figure there about 0.16).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * WORKING CAMS (VILLAGE_CAMS[view].<name>; always pass through villageKeepInSet)
 * ---------------------------------------------------------------------------------------------------------------
 *  field.wide          { x: 40, y: 20, zoom: 1 }       shot 2: the whole field; Balak at the left under the near mango.
 *  field.mangoMedium   frameOn(780, 760 -> 960, 540, 1.5)   shots 1 and AG3, P1: Balak, the giver, two smirkers.
 *  field.mangoTwo      frameOn(640, 800 -> 960, 540, 2.0)   shot 4 and P2: Balak and the crouching friend.
 *  field.stallMedium   frameOn(2620, 760 -> 960, 540, 1.6)  shot 7: the seller, the counter and jars, Balak.
 *  field.stallWide     frameOn(2560, 760 -> 960, 540, 1.15) shot 8 and P3: the crowd of boys by the stall.
 *  house.courtyard     { x: 20, y: 60, zoom: 1 }       shot 6: the whole courtyard, 6 to 8 figures.
 *  house.verandaFoot   frameOn(1120, 730 -> 960, 540, 1.6)  shot 5: Balak at the veranda foot, the boudi bending.
 *  house.shirtInsert   frameOn(pocket.x - 10, pocket.y + 40 -> 960, 520, 2.6)   shot 3: the shirt on its peg.
 *  field.logTwo        frameOn(1300, 800 -> 960, 540, 2.2)  G2 start: Balak (seat 2) and the culprit (seat 3) on the log.
 *  field.logRow        frameOn(1300, 770 -> 960, 540, 1.2)  G2 end: the whole row on the log, the sunset sky above.
 *  lane.laneWide       { x: 560, y: 20, zoom: 1 }      establishing: hut B, the path, the haystack.
 *  lane.laneTrackStart frameOn(820, 730 -> 960, 540, 1.3)   W1 a: the slow lateral track with the two boys (start)...
 *  lane.laneTrackEnd   frameOn(1260, 730 -> 960, 540, 1.3)  ...to here (440 px; ease the cam between the two).
 *  lane.l1TrackStart   frameOn(1340, 730 -> 960, 540, 1.35) L1: tracking alongside Balak toward the haystack (start)...
 *  lane.l1TrackEnd     frameOn(1760, 730 -> 960, 540, 1.35) ...to here.
 *  lane.haystackHold   frameOn(2400, 740 -> 960, 540, 1.3)  L1: the held frame: Balak crouched at the haystack's left,
 *                      the side lane, the culprit crossing far ahead and the friend's house beyond.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SAFE CAMERA RANGE (CAM-08): villageKeepInSet(view, cam) clamps any cam (zoom 1..3) so no plane's edge shows, with
 * soft corners. field: floor x -1500..4000, mid (0.8) -1600..4400, far (0.65) -1700..4600, jungle -1800..3800, sky
 * -2200..4200, so at zoom 1 cam.x is about -1484..2064. house: floor x -1500..3500, far (0.65) -1600..3800, so cam.x
 * about -1484..1564. lane: floor x -1500..4200, far (0.65) -1700..4600, so cam.x about -1484..2264 (the floor's top
 * edge is y 800, covered by the far plane's ground). Upward tilts are clamped at cam.y -200; downward to the floor's bottom (y 1500). Keep faces and
 * key action above y 820 on screen (the captions band): the working cams above do (see the QA sheet VillageFieldQA).
 *
 * Planes, back to front: 0.15 sky; 0.35 jungle; 0.5 palms, bananas, far trees; 0.65 the village edge (huts, fences,
 * haystack; house: the back fence, kitchen hut, neighbour's thatch; lane: the village beyond the cross lane and the
 * friend's house); 0.8 (field) the mid field and the far mango; 1 the floor (field: the near mango, the stall, the log;
 * house: the friend's house, clothes line, shirt; lane: the cross lane, the side lane and its fences, the huts, the
 * back fences, the path, the haystack; characters); 0.95 light (screen); 1.35 near grass; 1.6 near mango leaves
 * (field, optional).
 */

export type VillageView = "field" | "house" | "lane";
export type VillageTime = "lateMorning" | "afternoon" | "sunset";

export interface VPoint {
  x: number;
  y: number;
  depth: number;
  s?: number;
  flip?: boolean;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const PLANES = { sky: 0.15, jungle: 0.35, trees: 0.5, far: 0.65, mid: 0.8, light: 0.95, floor: 1, grass: 1.35, leaves: 1.6 } as const;

interface ViewExtents {
  setX: Array<[number, number, number]>;
  floorTop: number;
  yardBottom: number;
  yardDepth: number;
  floorBottom: number;
}

const EXTENTS: Record<VillageView, ViewExtents> = {
  field: {
    setX: [
      [1, -1500, 4000],
      [0.8, -1600, 4400],
      [0.65, -1700, 4600],
      [0.35, -1800, 3800],
      [0.15, -2200, 4200],
    ],
    floorTop: 860,
    yardBottom: 1100,
    yardDepth: 0.8,
    floorBottom: 1500,
  },
  house: {
    setX: [
      [1, -1500, 3500],
      [0.65, -1600, 3800],
      [0.35, -1800, 3800],
      [0.15, -2200, 4200],
    ],
    floorTop: 862,
    yardBottom: 1100,
    yardDepth: 0.65,
    floorBottom: 1500,
  },
  lane: {
    setX: [
      [1, -1500, 4200],
      [0.65, -1700, 4600],
      [0.35, -1800, 3800],
      [0.15, -2200, 4200],
    ],
    floorTop: 800,
    yardBottom: 1100,
    yardDepth: 0.65,
    floorBottom: 1500,
  },
};

/** Field geometry (floor plane unless noted). */
const F_FLOOR_TOP = 860;
const F_MID_TOP = 742; // 0.8 plane: where the mid field meets the village edge
const F_FAR_GROUND = 724; // 0.65 plane: the huts' plinth bottoms
const F_MANGO = { x: 250, y: 908, s: 1.45 };
const F_MANGO_FAR = { x: 1960, y: 790, s: 0.88 }; // 0.8 plane
const F_STALL = { x: 2620, y: 930, s: 1 }; // the plinth's front-bottom centre
/** Stall local geometry (s 1, origin at the plinth's front-bottom centre). */
const ST = { half: 300, plinthH: 34, counterTop: -170, counterHalf: 232, seatY: -130, eave: -436, ridge: -566, postX: 284 };

/** House geometry (floor plane): the friend's mud house. */
const H = { x: 170, y: 860, s: 1.45, w: 960, door: 640, window: 330, posts: [46, 290, 520, 790, 914] };
const H_TOP = H.y - 46 * H.s; // the veranda floor
const H_POST_SHIRT = H.x + 520 * H.s; // the post left of the door
const H_DOOR = H.x + H.door * H.s;
const H_SHIRT = { x: H_POST_SHIRT + 8, y: H_TOP - 196, s: 0.86 };
const H_STEP = { x: H_DOOR, top: H.y - 38, half: 64 };
const H_LINE = { x0: -40, x1: 470, y: 900, h: 260 };
const H_GATE = { x0: 2040, x1: 2140, base: 862 }; // 0.65 plane

/** The fallen log at the field's edge (G2, opt-in `log`): centre of its ground contact, length and thickness (s 1). */
const F_LOG = { x: 1300, y: 1010, len: 1240, d: 66 };
const F_LOG_TOP = F_LOG.y - F_LOG.d + 4; // the seat line along its top
const F_LOG_SEATS = [0, 1, 2, 3, 4, 5].map((i) => F_LOG.x - F_LOG.len / 2 + 120 + i * ((F_LOG.len - 240) / 5));

/** Lane geometry (floor plane unless noted): the Ujanchar village lane (W1 a, L1). */
const L_FLOOR_TOP = 800;
const L_BACK = 900; // base of the fences and the hut plinths along the back of the path
const L_PATH = { top: 914, bottom: 1060, y: 982 }; // the beaten-earth path band and its walking line
const L_HAY = { x: 1980, y: 940, s: 1.4 }; // the haystack, right on the path's back edge
const L_GAP = { x0: 2470, x1: 3270 }; // the side lane's mouth in the back fence (toward the friend's house)
const L_MOUTH = { x0: 2700, x1: 3050, y: 842 }; // where the side lane meets the cross lane
const L_CROSS = { y0: 810, y1: 844, y: 828 }; // the cross lane far ahead (the culprit crosses here)
const L_FAR_GROUND = 786; // 0.65 plane: the plinth bottoms beyond the cross lane
const L_HOUSE = { x: 2120, y: 792, s: 0.56, w: 960, door: 640, window: 330 }; // the friend's house at the lane's end (0.65)
const L_HUT_A = { x: -1460, y: 872, w: 640, s: 1.2 }; // a hut behind the fence, left
const L_HUT_B = { x: 880, y: 912, w: 560, s: 1.12 }; // a hut fronting the path (its wall is the lane's edge)
const L_HUT_C = { x: 3420, y: 872, w: 620, s: 1.2 }; // a hut behind the fence, right

/** Depth factor for figures on the floor plane: 1 at y 960, smaller further back. */
export const villageScaleAt = (y: number) => clamp(1 + (y - 960) * 0.0032, 0.5, 1.6);
const k = villageScaleAt;
const ADULT = 1.15;
const STAND = 0.56;
const SEAT = 0.95;
/** The friend's courtyard is framed a little wider: its figures are 0.85 of the field's at the same y. */
const HOUSE_K = 0.85;
const hk = (y: number) => HOUSE_K * k(y);

const pt = (x: number, y: number, depth: number, s?: number, flip?: boolean): VPoint => ({ x, y, depth, s, flip });
const st = (lx: number, ly: number) => ({ x: F_STALL.x + lx * F_STALL.s, y: F_STALL.y + ly * F_STALL.s });

/** Puts world point (wx, wy) on the floor plane at screen (sx, sy) at zoom z (a Stage cam). */
export const villageFrameOn = (wx: number, wy: number, sx: number, sy: number, z: number): Cam => ({
  x: wx - 960 - (sx - 960) / z,
  y: wy - 540 - (sy - 540) / z,
  zoom: z,
});

/** World point of the shirt's peg tip and pocket for a ShirtOnPeg hung at (x, y) with scale s (sway on f). */
const shirtSway = (f: number, sway: number) => sway * (0.7 * Math.sin(f * 0.031) + 0.35 * noise1(f * 0.02, 77));
export const shirtPegAt = (x: number, y: number) => ({ x, y });
export const shirtPocketAt = (x: number, y: number, s = 1, f = 0, sway = 1) => {
  const a = (shirtSway(f, sway) * Math.PI) / 180;
  const lx = 24 * s;
  const ly = 44 * s;
  return { x: x + lx * Math.cos(a) - ly * Math.sin(a), y: y + lx * Math.sin(a) + ly * Math.cos(a) };
};

const SHIRT_POCKET = shirtPocketAt(H_SHIRT.x, H_SHIRT.y, H_SHIRT.s, 0, 0);

export const VILLAGE = {
  PLANES,
  EXTENTS,
  field: {
    adultS: ADULT,
    standS: STAND,
    seatS: SEAT,
    mangoNear: pt(F_MANGO.x, F_MANGO.y, 1, F_MANGO.s),
    mangoFar: pt(F_MANGO_FAR.x, F_MANGO_FAR.y, 0.8, F_MANGO_FAR.s),
    balakSeat: pt(560, 958, 1, SEAT * k(958)),
    treasury: pt(712, 994, 1),
    ballGiver: pt(770, 964, 1, STAND * k(964), true),
    smirkers: [pt(930, 936, 1, STAND * k(936), true), pt(1036, 930, 1, STAND * k(930), true)],
    friendCrouch: pt(694, 972, 1, STAND * k(972), true),
    friendExit: [pt(900, 948, 1, STAND * k(948)), pt(1300, 900, 1, STAND * k(900)), pt(1680, 868, 1, STAND * k(868))],
    gangReturn: [pt(790, 966, 1, STAND * k(966), true), pt(900, 944, 1, STAND * k(944), true), pt(1000, 936, 1, STAND * k(936), true), pt(1100, 946, 1, STAND * k(946), true)],
    game: [pt(1150, 792, 0.8, 0.21), pt(1380, 782, 0.8, 0.2), pt(1610, 796, 0.8, 0.21), pt(1290, 806, 0.8, 0.22)],
    stall: pt(F_STALL.x, F_STALL.y, 1, F_STALL.s),
    counterTop: { ...pt(st(0, ST.counterTop).x, st(0, ST.counterTop).y, 1), x0: st(-ST.counterHalf, 0).x, x1: st(ST.counterHalf, 0).x },
    lozengeJar: pt(st(118, ST.counterTop).x, st(118, ST.counterTop).y, 1, F_STALL.s),
    jarA: pt(st(-164, ST.counterTop).x, st(-164, ST.counterTop).y, 1, F_STALL.s),
    jarB: pt(st(-96, ST.counterTop).x, st(-96, ST.counterTop).y, 1, F_STALL.s),
    twistStack: pt(st(-30, ST.counterTop).x, st(-30, ST.counterTop).y, 1),
    sellerSeat: pt(st(30, ST.seatY).x, st(30, ST.seatY).y, 1, 1.05, true),
    sellerHands: pt(st(56, ST.counterTop - 6).x, st(56, ST.counterTop - 6).y, 1),
    coinPlace: pt(st(10, ST.counterTop).x, st(10, ST.counterTop).y, 1),
    buyer: pt(st(-120, 56).x, st(-120, 56).y, 1, STAND * k(st(0, 56).y)),
    crowd: [
      pt(st(-330, 66).x, st(-330, 66).y, 1, STAND * k(st(0, 66).y)),
      pt(st(-236, 92).x, st(-236, 92).y, 1, STAND * k(st(0, 92).y)),
      pt(st(-30, 104).x, st(-30, 104).y, 1, STAND * k(st(0, 104).y), true),
      pt(st(250, 84).x, st(250, 84).y, 1, STAND * k(st(0, 84).y), true),
      pt(st(350, 62).x, st(350, 62).y, 1, STAND * k(st(0, 62).y), true),
    ],
    /** G2: the fallen log (draw it with `log` on the floor layer, or <FallenLog {...VILLAGE.field.log} />) */
    log: { ...pt(F_LOG.x, F_LOG.y, 1, 1), len: F_LOG.len, d: F_LOG.d },
    /**
     * G2: the seat line on the log's top. x, y: its centre (y = the log's top, where a seated child's seat point
     * goes); s: SeatedChild scale there (the depth is the log's ground contact, y 1010); ground: the earth in front
     * (feet); x0 / x1: the usable top; seats[0..5]: six seat points left to right, 200 px apart (Balak at
     * `balak` = 2, the culprit next to him at `culprit` = 3). StandingChild scale for the same depth: standS.
     */
    logSeat: {
      ...pt(F_LOG.x, F_LOG_TOP, 1, SEAT * k(F_LOG.y)),
      ground: F_LOG.y,
      x0: F_LOG.x - F_LOG.len / 2 + 60,
      x1: F_LOG.x + F_LOG.len / 2 - 60,
      standS: STAND * k(F_LOG.y),
      seats: F_LOG_SEATS.map((x, i) => pt(x, F_LOG_TOP + (i % 2 ? 1 : 0), 1, SEAT * k(F_LOG.y), i >= 3)),
      balak: 2,
      culprit: 3,
    },
  },
  house: {
    adultS: ADULT * HOUSE_K,
    standS: STAND * HOUSE_K,
    houseRect: { x0: H.x, x1: H.x + H.w * H.s, plinthBottom: H.y, verandaTop: H_TOP, eave: H.y - 234 * H.s, ridge: H.y - 416 * H.s },
    shirtPeg: pt(H_SHIRT.x, H_SHIRT.y, 1, H_SHIRT.s),
    shirtPocket: pt(SHIRT_POCKET.x, SHIRT_POCKET.y, 1),
    culpritAtShirt: pt(H_SHIRT.x - 52, H_TOP, 1, STAND * hk(872)),
    doorway: pt(H_DOOR, H_TOP, 1, ADULT * hk(866)),
    verandaEdge: pt(H_DOOR - 62, H_TOP + 2, 1, ADULT * hk(866), true),
    doorStep: pt(H_STEP.x, H_STEP.top, 1),
    verandaFoot: pt(H_DOOR - 84, 896, 1, STAND * hk(896)),
    dada: pt(800, 930, 1, ADULT * hk(930)),
    culprit: pt(930, 940, 1, STAND * hk(940), true),
    boudiOut: pt(H_DOOR - 56, H_TOP + 2, 1, ADULT * hk(866), true),
    balak: pt(1060, 956, 1, STAND * hk(956)),
    gang: [pt(1420, 906, 1, STAND * hk(906), true), pt(1520, 900, 1, STAND * hk(900), true), pt(1620, 910, 1, STAND * hk(910), true), pt(1330, 924, 1, STAND * hk(924), true)],
    gateGap: pt((H_GATE.x0 + H_GATE.x1) / 2, H_GATE.base, 0.65, 0.42),
  },
  lane: {
    adultS: ADULT,
    standS: STAND,
    /** the walking line along the path (y) and its usable run (x0..x1) */
    pathLine: { y: L_PATH.y, x0: -1300, x1: 4000, top: L_PATH.top, bottom: L_PATH.bottom },
    /** W1 (a): the two boys walking home along the path, left to right, at the track's start and end */
    w1Elder: [pt(860, L_PATH.y + 10, 1, STAND * k(L_PATH.y + 10)), pt(1300, L_PATH.y + 10, 1, STAND * k(L_PATH.y + 10))],
    w1Balak: [pt(620, L_PATH.y - 8, 1, STAND * k(L_PATH.y - 8)), pt(1020, L_PATH.y - 8, 1, STAND * k(L_PATH.y - 8))],
    /** L1: Balak walking toward the friend's house (start, the duck, the hide, on again) */
    l1Walk: pt(1240, L_PATH.y, 1, STAND * k(L_PATH.y)),
    haystackApproach: pt(1620, L_PATH.y - 4, 1, STAND * k(L_PATH.y - 4)),
    haystack: pt(L_HAY.x, L_HAY.y, 1, L_HAY.s),
    /** crouched at the haystack's left front edge, peeking right around it toward the cross lane (StandingChild) */
    haystackHide: pt(L_HAY.x - 168, L_HAY.y + 22, 1, STAND * k(L_HAY.y + 22)),
    haystackLeave: pt(2320, L_PATH.y + 2, 1, STAND * k(L_PATH.y + 2)),
    /** on toward the friend's house: along the path, into the side lane, to its mouth at the cross lane */
    toHouse: [pt(2600, L_PATH.y, 1, STAND * k(L_PATH.y)), pt(2840, 930, 1, STAND * k(930)), pt(2880, 880, 1, STAND * k(880)), pt(2880, L_MOUTH.y + 4, 1, STAND * k(L_MOUTH.y + 4))],
    /** the cross lane far ahead: the culprit crosses from [0] to [1] (draw him in the `crossing` slot, behind the fences) */
    farCross: [pt(2540, L_CROSS.y, 1, STAND * k(L_CROSS.y)), pt(3240, L_CROSS.y, 1, STAND * k(L_CROSS.y))],
    /** the side lane's mouth at the cross lane (x0..x1 visible between the receding fences) */
    laneMouth: { ...pt((L_MOUTH.x0 + L_MOUTH.x1) / 2, L_MOUTH.y, 1), x0: L_MOUTH.x0, x1: L_MOUTH.x1 },
    /** 0.65: the friend's house at the lane's end, its door (a figure there: s about 0.16) */
    houseEnd: pt(L_HOUSE.x + L_HOUSE.door * L_HOUSE.s, L_HOUSE.y - 46 * L_HOUSE.s, 0.65, 0.16),
  },
} as const;

/** Named working cams per view (raw; pass them through villageKeepInSet). */
export const VILLAGE_CAMS = {
  field: {
    wide: { x: 40, y: 20, zoom: 1 } as Cam,
    mangoMedium: villageFrameOn(780, 760, 960, 540, 1.5),
    mangoTwo: villageFrameOn(640, 800, 960, 540, 2.0),
    stallMedium: villageFrameOn(2620, 760, 960, 540, 1.6),
    stallWide: villageFrameOn(2560, 760, 960, 540, 1.15),
    /** G2: Balak and the culprit side by side on the log (the pull-back starts here) */
    logTwo: villageFrameOn((F_LOG_SEATS[2] + F_LOG_SEATS[3]) / 2, 800, 960, 540, 2.2),
    /** G2: the whole row on the log in the sunset (the pull-back ends here) */
    logRow: villageFrameOn(F_LOG.x, 770, 960, 540, 1.2),
  },
  house: {
    courtyard: { x: 20, y: 60, zoom: 1 } as Cam,
    verandaFoot: villageFrameOn(1120, 730, 960, 540, 1.6),
    shirtInsert: villageFrameOn(SHIRT_POCKET.x - 10, SHIRT_POCKET.y + 40, 960, 520, 2.6),
  },
  lane: {
    /** the whole lane from the hut on the left to the haystack (establishing) */
    laneWide: { x: 560, y: 20, zoom: 1 } as Cam,
    /** W1 (a): the slow lateral track with the two boys, left to right (start -> end, about 440 px) */
    laneTrackStart: villageFrameOn(820, 730, 960, 540, 1.3),
    laneTrackEnd: villageFrameOn(1260, 730, 960, 540, 1.3),
    /** L1: the tracking shot alongside Balak toward the haystack (start -> end) */
    l1TrackStart: villageFrameOn(1340, 730, 960, 540, 1.35),
    l1TrackEnd: villageFrameOn(1760, 730, 960, 540, 1.35),
    /** L1: the held frame on the haystack: Balak crouched at its left, the cross lane and the friend's house beyond */
    haystackHold: villageFrameOn(2400, 740, 960, 540, 1.3),
  },
} as const;

/** Stage background per time (shows only through the soft edges of blurred layers). */
export const VILLAGE_BG: Record<VillageTime, string> = { lateMorning: P.bg, afternoon: "#efd2a0", sunset: "#e8b07a" };

/**
 * Grade per time: the Ujanchar morning grade for late morning; warmer, lower and a little golden for the afternoon;
 * for the sunset (G2) a strong golden-orange bloom low on the right where the sun sets, a deeper vignette and an
 * amber multiply tint, so the whole frame (characters too) sits in the low warm light.
 */
export const villageGrade = (time: VillageTime = "lateMorning"): React.ComponentProps<typeof Grade> =>
  time === "sunset"
    ? { warmth: 0.6, vignette: 0.62, grain: 0.04, bloomAt: [66, 32], tint: "#ffa860", tintAmount: 0.22 }
    : time === "afternoon"
    ? { warmth: 0.58, vignette: 0.52, grain: 0.04, bloomAt: [82, 30], tint: "#ffe0b8", tintAmount: 0.1 }
    : { warmth: 0.45, vignette: 0.5, grain: 0.04, bloomAt: [64, 30] };

/** The sunset's sun on the sky plane (0.15): low on the right, just above the jungle's crowns. */
const SUNSET_SUN = { x: 1250, y: 332 };

const smax = (a: number, b: number, kk: number) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + kk * kk));
const smin = (a: number, b: number, kk: number) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + kk * kk));

/** Clamps a Stage cam so no plane's edge comes into frame in that view (soft corners). Keeps every other cam field. */
export const villageKeepInSet = <C extends Cam>(view: VillageView, c: C): C => {
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

const f1 = (n: number) => n.toFixed(1);
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const pm = (n: number) => ((n % 1) + 1) % 1;

/** A run of the Ujanchar bamboo fence at any size: from x0 to x1 (plane px), base on `base`, scaled by kk. */
const FenceAt: React.FC<{ x0: number; x1: number; base: number; k?: number; seed: number }> = ({ x0, x1, base, k: kk = 1, seed }) => {
  const id = safeId(useId());
  return (
    <g>
      <defs>
        <clipPath id={`vff-${id}`}>
          <rect x={x0 - 6 * kk} y={base - 260 * kk} width={x1 - x0 + 12 * kk} height={280 * kk} />
        </clipPath>
      </defs>
      <g clipPath={`url(#vff-${id})`}>
        <g transform={`translate(${x0}, ${base}) scale(${kk}) translate(0, -862)`}>
          <UjancharFenceRun x0={0} x1={(x1 - x0) / kk} seed={seed} />
        </g>
      </g>
    </g>
  );
};

const GatePost: React.FC<{ x: number; base: number; k?: number }> = ({ x, base, k: kk = 1 }) => (
  <g transform={`translate(${x}, ${base}) scale(${kk})`}>
    <rect x={-7} y={-190} width={14} height={192} rx={5} fill={P.bamboo} />
    <rect x={-3} y={-190} width={4} height={192} fill={P.bambooLight} opacity={0.45} />
    {[0.25, 0.55, 0.82].map((q) => (
      <rect key={q} x={-8} y={-190 * q} width={16} height={4} fill={P.bambooTie} />
    ))}
  </g>
);

const BushAt: React.FC<{ x: number; y: number; w: number; f: number; seed: number; k?: number; flowers?: number }> = ({ x, y, w, f, seed, k: kk = 1, flowers = 0 }) => (
  <g transform={`translate(${x}, ${y}) scale(${kk})`}>
    <UjancharBush x={0} y={0} w={w} f={f} seed={seed} flowers={flowers} />
  </g>
);

/** A round haystack (খড়ের গাদা) on its centre pole. Base centre at (x, y); about 300 px tall at s 1. */
export const Haystack: React.FC<{ x: number; y: number; s?: number; seed?: number }> = ({ x, y, s = 1, seed = 0 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={-14} cy={4} rx={170} ry={14} fill={P.shadow} opacity={0.25} />
    <line x1={0} y1={-250} x2={0} y2={-330} stroke={P.bamboo} strokeWidth={8} strokeLinecap="round" />
    <path d="M -150 0 C -160 -90 -110 -200 -24 -250 Q 0 -262 24 -250 C 110 -200 160 -90 150 0 Z" fill="#c9a35a" />
    <path d="M -150 0 C -160 -90 -110 -200 -24 -250 Q -8 -258 0 -258 C -60 -200 -96 -100 -90 0 Z" fill="#a8823e" opacity={0.55} />
    <path d="M 40 -238 C 110 -190 150 -90 146 0 L 120 0 C 120 -80 96 -170 40 -238 Z" fill="#e4c47c" opacity={0.5} />
    {range(26).map((i) => {
      const u = i / 25;
      const xb = -146 + 292 * u;
      return <line key={i} x1={f1(xb)} y1={-2} x2={f1(xb * 0.55 + 8 * (hashS(seed + i) - 0.5))} y2={f1(-80 - 140 * Math.sin(Math.PI * u) - 20 * hashS(seed + i * 3))} stroke={P.thatchStraw} strokeWidth={1.6} opacity={0.5} />;
    })}
    <path d="M -150 0 Q 0 16 150 0 L 146 -14 Q 0 0 -146 -14 Z" fill={P.thatchEave} opacity={0.7} />
  </g>
);

/** Shadow length per height, by time (the sun is on the right: shadows fall to the left, a little toward camera). */
const SHADOW_LEN: Record<VillageTime, number> = { lateMorning: 0.3, afternoon: 0.9, sunset: 2.3 };

/**
 * A soft cast shadow on the ground for a figure or prop standing at (x, y) (feet / base centre), h tall and w wide at
 * the base: short in the late morning, long to the left in the afternoon, very long and thin at sunset (G2). Draw it
 * in the floor's `under` slot (or before the figure), on the same plane as the figure.
 */
export const LongShadow: React.FC<{ x: number; y: number; h: number; w?: number; time?: VillageTime; opacity?: number }> = ({ x, y, h, w = 60, time = "afternoon", opacity = 1 }) => {
  const id = safeId(useId());
  const L = h * SHADOW_LEN[time];
  const dy = L * (time === "sunset" ? 0.16 : 0.07);
  const o = (time === "sunset" ? 0.5 : time === "afternoon" ? 0.3 : 0.26) * opacity;
  return (
    <g>
      <defs>
        <linearGradient id={`vls-${id}`} gradientUnits="userSpaceOnUse" x1={x} y1={y} x2={x - L} y2={y + dy}>
          <stop offset="0" stopColor={P.shadow} stopOpacity={o} />
          <stop offset="0.75" stopColor={P.shadow} stopOpacity={o * 0.45} />
          <stop offset="1" stopColor={P.shadow} stopOpacity={0} />
        </linearGradient>
        <filter id={`vlsb-${id}`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation={time === "sunset" ? 5 : 4} />
        </filter>
      </defs>
      <path
        d={`M ${f1(x + w * 0.5)} ${f1(y - 2)} Q ${f1(x)} ${f1(y - w * 0.12)} ${f1(x - w * 0.5)} ${f1(y - 3)} L ${f1(x - L)} ${f1(y + dy - w * 0.12)} Q ${f1(x - L - w * 0.2)} ${f1(y + dy)} ${f1(x - L)} ${f1(y + dy + w * 0.14)} L ${f1(x + w * 0.4)} ${f1(y + 6)} Z`}
        fill={`url(#vls-${id})`}
        filter={`url(#vlsb-${id})`}
      />
    </g>
  );
};

export interface FallenLogProps {
  /** centre of the log's ground contact (floor plane) */
  x: number;
  y: number;
  s?: number;
  /** length and thickness in local units (default 1240 x 66: about 4.5 m, a seat for six children) */
  len?: number;
  d?: number;
  time?: VillageTime;
  seed?: number;
  /** long shadows of children seated on it (world x of each seat, figure height h, base width w): drawn on the ground under the log */
  shadows?: Array<{ x: number; h: number; w?: number }>;
}

export type LogShadow = { x: number; h: number; w?: number };

/**
 * A fallen tree trunk lying along the ground at the field's edge (G2): grey-brown bark with long grooves and a few
 * moss patches, its sawn left end showing pale rings, a broken stub of a branch at the right end, the top worn smooth
 * where children sit, grass growing along its foot, and its shadow (long to the left at sunset, with a gold rim of light
 * along the top). Base centre at (x, y); the seat line is y - d + 4 (VILLAGE.field.logSeat).
 */
export const FallenLog: React.FC<FallenLogProps> = ({ x, y, s = 1, len = F_LOG.len, d = F_LOG.d, time = "lateMorning", seed = 3, shadows }) => {
  const id = safeId(useId());
  const h = len / 2;
  const dr = d * 0.86; // the right end is a little thinner
  const sunset = time === "sunset";
  const warm = time === "afternoon" || sunset;
  // top and bottom edges: a gentle irregular line, thicker at the left (the root end)
  const topAt = (u: number) => -lerp(d, dr, u) + 3 * Math.sin(u * 9 + seed) + 2 * Math.sin(u * 23 + seed * 2);
  const N = 24;
  const tops = range(N + 1).map((i) => [-h + (2 * h * i) / N, topAt(i / N)] as const);
  const body = `M ${-h} ${f1(topAt(0) * 0.5)} ${tops.map(([px, py]) => `L ${f1(px)} ${f1(py)}`).join(" ")} L ${h} ${f1(-dr * 0.5)} L ${f1(h - 6)} -2 Q 0 4 ${-h + 6} -2 Z`;
  const shadowL = sunset ? 2.4 * d : warm ? 1.0 * d : 0.4 * d;
  return (
    <g>
      {shadows?.map((sh, i) => (
        <LongShadow key={i} x={sh.x} y={y + 4 * s} h={sh.h} w={sh.w ?? 0.45 * sh.h} time={time} />
      ))}
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <defs>
        <linearGradient id={`vlog-${id}`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor={sunset ? "#8a6648" : "#7e664c"} />
          <stop offset="0.45" stopColor="#6a5038" />
          <stop offset="1" stopColor="#3e2c1c" />
        </linearGradient>
        <clipPath id={`vlogc-${id}`}>
          <path d={body} />
        </clipPath>
        <filter id={`vlogb-${id}`} x="-10%" y="-100%" width="120%" height="300%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
      </defs>
      {/* the log's shadow: under it, and cast to the left (long at sunset) */}
      <path d={`M ${h + 10} 2 L ${-h - shadowL} ${f1(4 + shadowL * 0.08)} L ${-h - shadowL} ${f1(4 + shadowL * 0.08 + d * 0.5)} L ${h} 12 Z`} fill={P.shadow} opacity={sunset ? 0.36 : 0.2} filter={`url(#vlogb-${id})`} />
      <ellipse cx={0} cy={3} rx={h + 20} ry={9} fill={P.shadow} opacity={0.32} />
      {/* the trunk */}
      <path d={body} fill={`url(#vlog-${id})`} />
      <g clipPath={`url(#vlogc-${id})`}>
        {/* long bark grooves along the trunk */}
        {range(9).map((i) => {
          const v = 0.12 + 0.09 * i;
          return (
            <path
              key={`g${i}`}
              d={range(13)
                .map((j) => {
                  const u = j / 12;
                  const px = -h + 2 * h * u;
                  const py = topAt(u) * (1 - v) + 2.2 * Math.sin(u * 31 + i * 1.7 + seed);
                  return `${j ? "L" : "M"} ${f1(px)} ${f1(py)}`;
                })
                .join(" ")}
              stroke={i % 2 ? "#4a3624" : "#594230"}
              strokeWidth={1.6 + (i % 3) * 0.6}
              fill="none"
              opacity={0.55}
            />
          );
        })}
        {/* bark plates: short dark checks */}
        {range(40).map((i) => {
          const u = hashS(seed * 11 + i * 3.1);
          const v = 0.2 + 0.7 * hashS(seed * 7 + i * 5.3);
          const px = -h + 2 * h * u;
          const py = topAt(u) * (1 - v);
          return <path key={`c${i}`} d={`M ${f1(px)} ${f1(py)} l ${f1(10 + 14 * hashS(i))} ${f1(1.5 * (hashS(i * 2) - 0.5))}`} stroke="#33251a" strokeWidth={1.4} opacity={0.5} />;
        })}
        {/* moss patches on the shaded lower side */}
        {range(6).map((i) => {
          const u = 0.08 + 0.84 * hashS(seed * 3 + i * 4.7);
          return <ellipse key={`m${i}`} cx={f1(-h + 2 * h * u)} cy={f1(topAt(u) * 0.28)} rx={f1(24 + 26 * hashS(i * 9))} ry={f1(5 + 4 * hashS(i * 5))} fill={i % 2 ? "#5e6e30" : "#6f7e3a"} opacity={0.6} />;
        })}
        {/* the top: worn smooth where children sit, lit by the sun (a gold rim at sunset) */}
        <path d={`M ${-h} ${f1(topAt(0) + 1)} ${tops.map(([px, py]) => `L ${f1(px)} ${f1(py + 1)}`).join(" ")} L ${h} ${f1(topAt(1) + 12)} ${[...tops].reverse().map(([px, py]) => `L ${f1(px)} ${f1(py + 12)}`).join(" ")} Z`} fill={sunset ? "#c08a58" : "#9a7c5a"} opacity={0.55} />
        <path d={tops.map(([px, py], i) => `${i ? "L" : "M"} ${f1(px)} ${f1(py + 1.5)}`).join(" ")} stroke={sunset ? "#ffc070" : warm ? "#f2cf96" : "#d9c29a"} strokeWidth={sunset ? 4 : 3} fill="none" opacity={sunset ? 0.85 : 0.6} />
        {/* the underside in deep shade */}
        <path d={`M ${-h} -10 Q 0 -4 ${h} -10 L ${h} 6 L ${-h} 6 Z`} fill="#24180e" opacity={0.4} />
      </g>
      {/* the sawn left end, facing a little toward camera: pale wood with rings and a dark heart crack */}
      <g transform={`translate(${-h + 4}, ${f1(topAt(0) * 0.5 - 1)})`}>
        <ellipse cx={0} cy={0} rx={d * 0.3} ry={d * 0.5} fill="#5a4230" />
        <ellipse cx={-1.5} cy={0} rx={d * 0.26} ry={d * 0.45} fill="#d4ae78" />
        {[0.78, 0.56, 0.36, 0.18].map((q) => (
          <ellipse key={q} cx={-1.5} cy={0} rx={d * 0.26 * q} ry={d * 0.45 * q} fill="none" stroke="#b08452" strokeWidth={1.2} opacity={0.7} />
        ))}
        <path d={`M -1 -2 l -4 ${-d * 0.2} M -1 2 l 3 ${d * 0.16}`} stroke="#7a5634" strokeWidth={1.4} />
        {warm && <ellipse cx={-3} cy={-d * 0.12} rx={d * 0.14} ry={d * 0.24} fill={sunset ? "#ffb868" : "#ffe0aa"} opacity={0.25} />}
      </g>
      {/* the broken right end with a stub of a branch reaching up */}
      <path d={`M ${h - 4} ${f1(-dr)} l 10 6 l -6 8 l 12 6 l -8 10 l 10 8 l -8 ${f1(dr - 40)}`} fill="#5a4230" />
      <path d={`M ${h - 70} ${f1(topAt(0.94) + 4)} Q ${h - 60} ${f1(topAt(0.94) - 30)} ${h - 34} ${f1(topAt(0.94) - 58)} L ${h - 26} ${f1(topAt(0.94) - 54)} Q ${h - 46} ${f1(topAt(0.94) - 24)} ${h - 50} ${f1(topAt(0.94) + 4)} Z`} fill="#5e4632" />
      <path d={`M ${h - 34} ${f1(topAt(0.94) - 58)} l 8 4`} stroke={sunset ? "#ffc070" : "#c9b08a"} strokeWidth={2} />
      {/* grass growing along its foot */}
      <GrassTufts n={26} x0={-h - 30} x1={h + 30} y0={-2} y1={8} seed={seed * 13 + 5} scale={1.5} col={sunset ? ["#7a6e34", "#8e7e3c", "#6a6030"] : undefined} />
    </g>
    </g>
  );
};

/** A bamboo fence receding from (x0, y0) to (x1, y1) (plane px), posts and lattice shrinking with distance by k0 -> k1. */
const RecedingFence: React.FC<{ x0: number; y0: number; x1: number; y1: number; k0: number; k1: number; n: number; seed: number }> = ({ x0, y0, x1, y1, k0, k1, n, seed }) => {
  const posts = range(n + 1).map((i) => {
    const u = i / n;
    const uu = 1 - Math.pow(1 - u, 1.25); // posts bunch up a little toward the far end
    const kk = lerp(k0, k1, uu);
    return { x: lerp(x0, x1, uu), y: lerp(y0, y1, uu), h: (150 + 14 * hashS(seed + i)) * kk, kk };
  });
  const rail = (q: number) => posts.map((p, i) => `${i ? "L" : "M"} ${f1(p.x)} ${f1(p.y - p.h * q)}`).join(" ");
  return (
    <g>
      {/* the woven lattice: crossing slats between each pair of posts */}
      {posts.slice(1).map((p, i) => {
        const a = posts[i];
        const m = 5;
        return (
          <g key={`l${i}`} stroke={P.fenceLight} strokeWidth={2.4 * a.kk} opacity={0.9}>
            {range(m).map((j) => {
              const u0 = j / m;
              const u1 = (j + 1) / m;
              const xa = lerp(a.x, p.x, u0);
              const xb = lerp(a.x, p.x, u1);
              const ya = lerp(a.y, p.y, u0);
              const yb = lerp(a.y, p.y, u1);
              const ha = lerp(a.h, p.h, u0) * 0.86;
              const hb = lerp(a.h, p.h, u1) * 0.86;
              return (
                <g key={j}>
                  <line x1={f1(xa)} y1={f1(ya - 2)} x2={f1(xb)} y2={f1(yb - hb)} />
                  <line x1={f1(xb)} y1={f1(yb - 2)} x2={f1(xa)} y2={f1(ya - ha)} stroke={P.fenceDark} />
                </g>
              );
            })}
          </g>
        );
      })}
      <path d={rail(0.82)} stroke={P.fenceRail} strokeWidth={6 * k0} fill="none" strokeLinejoin="round" />
      <path d={rail(0.38)} stroke={P.fenceRail} strokeWidth={6 * k0} fill="none" strokeLinejoin="round" />
      {posts.map((p, i) => (
        <g key={`p${i}`}>
          <rect x={f1(p.x - 5 * p.kk)} y={f1(p.y - p.h)} width={f1(10 * p.kk)} height={f1(p.h)} rx={4 * p.kk} fill={P.bamboo} />
          <rect x={f1(p.x - 2 * p.kk)} y={f1(p.y - p.h)} width={f1(3 * p.kk)} height={f1(p.h)} fill={P.bambooLight} opacity={0.4} />
          {[0.3, 0.62].map((q) => (
            <rect key={q} x={f1(p.x - 6 * p.kk)} y={f1(p.y - p.h * q)} width={f1(12 * p.kk)} height={f1(3 * p.kk)} fill={P.bambooTie} />
          ))}
        </g>
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Small props: glass jar, jute sack, paper twists                      */
/* ------------------------------------------------------------------ */

export type JarKind = "lozenge" | "batasha" | "toffee" | "empty";

const LOZ = ["#e0303a", "#f2b424", "#3f9a3c", "#f07a2a", "#e85a9a", "#f6e6c0", "#4a8ad0"];

/**
 * A squat glass sweet jar with a turned wooden lid. Base centre at (x, y); about 84 px tall and 52 px wide at s 1.
 * kind: "lozenge" (round coloured marble-lozenges, মার্বেল-লজেন্স), "batasha" (white sugar drops), "toffee" (wrapped
 * yellow-orange sweets) or "empty". The contents fill to about 70 %.
 */
export const GlassJar: React.FC<{ x: number; y: number; s?: number; kind?: JarKind; lid?: boolean; seed?: number }> = ({ x, y, s = 1, kind = "lozenge", lid = true, seed = 0 }) => {
  const id = safeId(useId());
  const body = "M -24 0 Q -27 0 -27 -6 L -27 -54 Q -27 -62 -18 -64 L -16 -68 L 16 -68 L 18 -64 Q 27 -62 27 -54 L 27 -6 Q 27 0 24 0 Z";
  const fillTop = -44;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <defs>
        <clipPath id={`vjar-${id}`}>
          <path d={body} />
        </clipPath>
      </defs>
      <ellipse cx={-3} cy={1} rx={30} ry={4} fill={P.shadow} opacity={0.3} />
      {/* the glass, faintly tinted, the far wall seen through it */}
      <path d={body} fill="#dfeee6" opacity={0.42} />
      <g clipPath={`url(#vjar-${id})`}>
        {kind === "lozenge" &&
          range(30).map((i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const cx = -22 + col * 9 + (row % 2 ? 4.5 : 0) + 1.5 * (hashS(seed + i) - 0.5);
            const cy = -5 - row * 8.2 - 1.2 * hashS(seed + i * 3);
            if (cy < fillTop) return null;
            const c = LOZ[Math.floor(hashS(seed * 7 + i * 1.7) * LOZ.length)];
            return (
              <g key={i}>
                <circle cx={f1(cx)} cy={f1(cy)} r={4.6} fill={c} />
                <circle cx={f1(cx - 1.4)} cy={f1(cy - 1.6)} r={1.4} fill="#fff" opacity={0.65} />
              </g>
            );
          })}
        {kind === "batasha" &&
          range(34).map((i) => {
            const row = Math.floor(i / 7);
            const col = i % 7;
            const cx = -24 + col * 8 + (row % 2 ? 4 : 0);
            const cy = -4 - row * 6.5;
            if (cy < fillTop) return null;
            return <ellipse key={i} cx={cx} cy={cy} rx={4.6} ry={3.2} fill={i % 3 ? "#f8f2e4" : "#ece2cc"} />;
          })}
        {kind === "toffee" &&
          range(26).map((i) => {
            const row = Math.floor(i / 5);
            const col = i % 5;
            const cx = -20 + col * 10 + (row % 2 ? 5 : 0);
            const cy = -6 - row * 8;
            if (cy < fillTop) return null;
            const c = i % 2 ? "#f2b424" : "#e86a2a";
            return (
              <g key={i} transform={`rotate(${f1(40 * (hashS(seed + i) - 0.5))} ${cx} ${cy})`}>
                <rect x={cx - 4} y={cy - 3} width={8} height={6} rx={2} fill={c} />
                <path d={`M ${cx - 4} ${cy} l -3 -3 l 0 6 Z M ${cx + 4} ${cy} l 3 -3 l 0 6 Z`} fill={c} opacity={0.85} />
              </g>
            );
          })}
        {/* the glass over the contents: a soft side shade and the curved rim lines */}
        <rect x={14} y={-70} width={14} height={72} fill="#1e3a30" opacity={0.12} />
      </g>
      {/* highlights: a long streak on the left, a short one on the right, the shoulder rim */}
      <path d="M -20 -10 Q -22 -34 -19 -56" stroke="#ffffff" strokeWidth={3.4} fill="none" opacity={0.6} strokeLinecap="round" />
      <path d="M 20 -18 L 20 -40" stroke="#ffffff" strokeWidth={1.8} fill="none" opacity={0.4} strokeLinecap="round" />
      <path d="M -18 -64 Q 0 -60 18 -64" stroke="#ffffff" strokeWidth={1.4} fill="none" opacity={0.5} />
      {lid && (
        <g>
          <rect x={-19} y={-76} width={38} height={9} rx={3} fill="#7a5232" />
          <rect x={-19} y={-76} width={38} height={3} rx={1.5} fill="#a8794a" />
          <ellipse cx={0} cy={-80} rx={7} ry={4.4} fill="#6b4528" />
          <ellipse cx={-2} cy={-81.5} rx={3} ry={1.6} fill="#a8794a" opacity={0.8} />
        </g>
      )}
    </g>
  );
};

/** An open jute sack (চটের বস্তা) with its rim rolled down and a heap of grain. Base centre at (x, y); about 110 px tall at s 1. */
export const JuteSack: React.FC<{ x: number; y: number; s?: number; grain?: string; grainHi?: string; seed?: number }> = ({ x, y, s = 1, grain = "#efe4c8", grainHi = "#fffaf0", seed = 0 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={-4} cy={2} rx={62} ry={8} fill={P.shadow} opacity={0.3} />
    <path d="M -52 0 Q -60 -50 -48 -92 L 48 -92 Q 60 -50 52 0 Q 0 8 -52 0 Z" fill="#b8955e" />
    {range(9).map((i) => (
      <line key={i} x1={-48 + i * 12} y1={-90} x2={-50 + i * 12.6} y2={-2} stroke="#9c7a44" strokeWidth={1.2} opacity={0.45} />
    ))}
    {range(7).map((i) => (
      <line key={`h${i}`} x1={-54} y1={-12 - i * 12} x2={54} y2={-12 - i * 12} stroke="#a8874e" strokeWidth={1} opacity={0.35} />
    ))}
    <path d="M -52 0 Q -60 -50 -48 -92 L -36 -92 Q -46 -50 -40 2 Z" fill="#8e6e40" opacity={0.5} />
    {/* the rolled rim */}
    <path d="M -54 -94 Q 0 -108 54 -94 Q 58 -84 52 -80 Q 0 -92 -52 -80 Q -58 -84 -54 -94 Z" fill="#c9a870" />
    <path d="M -50 -96 Q 0 -110 50 -96" stroke="#e0c690" strokeWidth={2} fill="none" opacity={0.7} />
    {/* the grain heap */}
    <path d="M -46 -98 Q -30 -120 0 -124 Q 30 -120 46 -98 Q 0 -104 -46 -98 Z" fill={grain} />
    {range(14).map((i) => (
      <circle key={`g${i}`} cx={f1(-36 + 72 * hashS(seed + i))} cy={f1(-102 - 18 * hashS(seed + i * 3) * (1 - Math.abs(hashS(seed + i) - 0.5) * 1.6))} r={1.8} fill={grainHi} opacity={0.8} />
    ))}
  </g>
);

/** A low round bamboo basket heaped with puffed rice (মুড়ি). Base centre at (x, y); about 70 px tall at s 1. */
const MuriBasket: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={-2} cy={2} rx={66} ry={8} fill={P.shadow} opacity={0.3} />
    <path d="M -60 -40 L -46 0 L 46 0 L 60 -40 Z" fill="#b9975a" />
    {range(12).map((i) => (
      <line key={i} x1={-58 + i * 10.5} y1={-40} x2={-46 + i * 8.4} y2={0} stroke="#8a6a36" strokeWidth={2} opacity={0.5} />
    ))}
    {[-30, -18].map((yy) => (
      <line key={yy} x1={-56} y1={yy} x2={56} y2={yy} stroke="#8a6a36" strokeWidth={2} opacity={0.4} />
    ))}
    <path d="M -62 -42 Q -40 -76 0 -80 Q 40 -76 62 -42 Q 0 -48 -62 -42 Z" fill="#f4e8cc" />
    {range(22).map((i) => (
      <ellipse key={`m${i}`} cx={f1(-50 + 100 * hashS(i * 3.3))} cy={f1(-46 - 26 * hashS(i * 5.1) * Math.sin(Math.PI * hashS(i * 3.3)))} rx={3} ry={1.8} fill={i % 2 ? "#e6d4a8" : "#fffaf0"} />
    ))}
    <rect x={-62} y={-44} width={124} height={5} rx={2} fill="#a8874a" />
  </g>
);

/** A stack of folded newspaper twists (ঠোঙা) lying on the counter. Base at (x, y). */
const TwistStack: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    {range(4).map((i) => (
      <g key={i} transform={`translate(${f1(-2 + 2 * hashS(i))}, ${-i * 3}) rotate(${f1(8 * (hashS(i * 3) - 0.5))})`}>
        <path d="M -18 0 L 16 0 L 4 -9 Z" fill={i % 2 ? "#e9e1cf" : "#ddd3bc"} />
        <line x1={-12} y1={-2} x2={8} y2={-2} stroke="#8a8270" strokeWidth={0.8} opacity={0.6} />
      </g>
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* The sweet stall (মুদির দোকান)                                       */
/* ------------------------------------------------------------------ */

export interface SweetStallProps {
  /** the plinth's front-bottom centre (floor plane) */
  x: number;
  y: number;
  s?: number;
  f: number;
  time?: VillageTime;
  /** world-space ReactNode: the seller behind the counter (in front of the back wall and his platform) */
  seller?: React.ReactNode;
  /** draw the set's own lozenge jar at the hero position (default true) */
  lozengeJar?: boolean;
}

/**
 * A small thatched, open-front village stall on a low mud plinth, in the Ujanchar materials: bamboo posts, a woven
 * bamboo-mat back wall with two plank shelves (jars, tins, bottles), a do-chala thatch, a raised wooden platform for the
 * seller, a plank counter with three glass jars and a stack of paper twists, a hanging hand of bananas and a hand
 * scale, jute sacks and a basket of puffed rice on the ground in front. About 600 px wide and 570 px tall at s 1.
 */
export const SweetStall: React.FC<SweetStallProps> = ({ x, y, s = 1, f, time = "lateMorning", seller, lozengeJar = true }) => {
  const T = `translate(${x}, ${y}) scale(${s})`;
  const { half, plinthH, counterTop, counterHalf, seatY, eave, ridge, postX } = ST;
  const sway = 1.2 * Math.sin(f * 0.04) + 0.6 * noise1(f * 0.03, 31);
  const pmSway = 1.6 * Math.sin(f * 0.035 + 1.3);
  const warm = time === "afternoon" || time === "sunset";
  return (
    <g>
      <g transform={T}>
        <ellipse cx={warm ? -60 : -20} cy={4} rx={warm ? 360 : 320} ry={18} fill={P.shadow} opacity={0.28} />
        {/* the low mud plinth, seen from the front: top strip and face */}
        <path d={`M ${-half} ${-plinthH} L ${-half + 10} ${-plinthH - 10} L ${half - 10} ${-plinthH - 10} L ${half} ${-plinthH} Z`} fill={P.plinthTop} />
        {/* the back wall: woven bamboo mat (দরমা) */}
        <rect x={-postX + 6} y={eave + 10} width={2 * postX - 12} height={-eave - plinthH - 18} fill="#c4a368" />
        <g opacity={0.5}>
          {range(28).map((i) => (
            <line key={`wv${i}`} x1={-postX + 6 + i * 21} y1={eave + 10} x2={-postX + 6 + i * 21 - 40} y2={-plinthH - 8} stroke="#9c7f45" strokeWidth={2} />
          ))}
          {range(28).map((i) => (
            <line key={`wd${i}`} x1={-postX - 34 + i * 21} y1={eave + 10} x2={-postX + 6 + i * 21} y2={-plinthH - 8} stroke="#b39556" strokeWidth={2} />
          ))}
        </g>
        <rect x={-postX + 6} y={eave + 10} width={2 * postX - 12} height={70} fill={P.eaveShadow} opacity={0.3} />
        <rect x={-postX + 6} y={-plinthH - 90} width={2 * postX - 12} height={80} fill={P.eaveShadow} opacity={0.16} />
        {/* shelves with jars, tins and bottles */}
        {[-300, -228].map((sy, r) => (
          <g key={sy}>
            {range(7).map((i) => {
              const ix = -230 + i * 76 + 10 * hashS(r * 9 + i);
              const kind = Math.floor(hashS(r * 5 + i * 3) * 4);
              if (kind === 0)
                return (
                  <g key={i}>
                    <rect x={ix - 13} y={sy - 40} width={26} height={40} rx={4} fill="#d8e2d6" opacity={0.6} />
                    <rect x={ix - 12} y={sy - 26} width={24} height={26} rx={3} fill={r ? "#d89a3a" : "#c9573a"} opacity={0.8} />
                    <rect x={ix - 10} y={sy - 46} width={20} height={7} rx={2} fill="#7a5232" />
                  </g>
                );
              if (kind === 1)
                return (
                  <g key={i}>
                    <rect x={ix - 14} y={sy - 34} width={28} height={34} fill={r ? "#b0442e" : "#3e6a8a"} />
                    <rect x={ix - 14} y={sy - 24} width={28} height={10} fill="#e8d6a0" opacity={0.8} />
                  </g>
                );
              if (kind === 2)
                return (
                  <g key={i}>
                    <rect x={ix - 7} y={sy - 44} width={14} height={44} rx={4} fill="#3a6a4a" opacity={0.75} />
                    <rect x={ix - 3} y={sy - 54} width={6} height={12} fill="#3a6a4a" opacity={0.75} />
                    <rect x={ix - 4} y={sy - 58} width={8} height={5} fill="#7a5232" />
                  </g>
                );
              return (
                <g key={i}>
                  <path d={`M ${ix - 16} 0 L ${ix + 16} 0 L ${ix + 10} -26 L ${ix - 10} -26 Z`} transform={`translate(0, ${sy})`} fill="#e9dfc6" />
                  <path d={`M ${ix - 10} -26 Q ${ix} -34 ${ix + 10} -26`} transform={`translate(0, ${sy})`} fill="#f2c94a" />
                </g>
              );
            })}
            <rect x={-postX + 10} y={sy} width={2 * postX - 20} height={8} fill="#8a5e36" />
            <rect x={-postX + 10} y={sy} width={2 * postX - 20} height={2.5} fill="#b98a5a" />
          </g>
        ))}
        {/* the seller's raised platform (চৌকি) behind the counter */}
        <rect x={-210} y={seatY} width={420} height={-seatY - plinthH - 10} fill="#7a5232" />
        <rect x={-210} y={seatY} width={420} height={6} fill="#a8794a" />
      </g>
      {seller}
      <g transform={T}>
        {/* the hand of bananas hanging from the roof beam, left; the hand scale (দাঁড়িপাল্লা), right */}
        <g transform={`rotate(${f1(sway)} -196 ${eave + 20})`}>
          <line x1={-196} y1={eave + 20} x2={-196} y2={eave + 92} stroke="#6f5530" strokeWidth={2.4} />
          {range(9).map((i) => {
            const a = -70 + i * 17;
            const bx = -196 + Math.sin((a * Math.PI) / 180) * 14;
            return <path key={i} d={`M ${f1(bx)} ${eave + 92} q ${f1(Math.sin((a * Math.PI) / 180) * 24)} 26 ${f1(Math.sin((a * Math.PI) / 180) * 18 + 4)} 58`} stroke={i % 2 ? "#e6c43a" : "#d8b030"} strokeWidth={11} fill="none" strokeLinecap="round" />;
          })}
          <ellipse cx={-196} cy={eave + 92} rx={10} ry={7} fill="#7a8a3e" />
        </g>
        <g transform={`rotate(${f1(pmSway)} 206 ${eave + 20})`}>
          <line x1={206} y1={eave + 20} x2={206} y2={eave + 60} stroke="#4a3a2a" strokeWidth={2} />
          <rect x={150} y={eave + 58} width={112} height={5} rx={2} fill="#8a6a3a" />
          {[156, 256].map((bx) => (
            <g key={bx}>
              <line x1={bx} y1={eave + 62} x2={bx - 16} y2={eave + 118} stroke="#5a4a3a" strokeWidth={1.2} />
              <line x1={bx} y1={eave + 62} x2={bx + 16} y2={eave + 118} stroke="#5a4a3a" strokeWidth={1.2} />
              <path d={`M ${bx - 22} ${eave + 118} Q ${bx} ${eave + 132} ${bx + 22} ${eave + 118} Z`} fill="#b8862e" />
            </g>
          ))}
        </g>
        {/* the counter: a plank top and a board front standing on the plinth */}
        <rect x={-counterHalf + 6} y={counterTop + 8} width={2 * counterHalf - 12} height={-counterTop - plinthH - 8} fill="#8a5e36" />
        {range(6).map((i) => (
          <line key={`cb${i}`} x1={-counterHalf + 6 + (i + 1) * ((2 * counterHalf - 12) / 7)} y1={counterTop + 10} x2={-counterHalf + 6 + (i + 1) * ((2 * counterHalf - 12) / 7)} y2={-plinthH} stroke="#5e3e22" strokeWidth={2} opacity={0.6} />
        ))}
        <rect x={-counterHalf + 6} y={counterTop + 8} width={2 * counterHalf - 12} height={18} fill={P.eaveShadow} opacity={0.22} />
        <rect x={-counterHalf} y={counterTop} width={2 * counterHalf} height={10} fill="#a8794a" />
        <rect x={-counterHalf} y={counterTop} width={2 * counterHalf} height={3} fill="#d4ad78" />
      </g>
      {/* jars and twists on the counter (world space, so the anchors are exact) */}
      <GlassJar x={x - 164 * s} y={y + counterTop * s} s={s} kind="batasha" seed={2} />
      <GlassJar x={x - 96 * s} y={y + counterTop * s} s={s * 0.9} kind="toffee" seed={5} />
      {lozengeJar && <GlassJar x={x + 118 * s} y={y + counterTop * s} s={s} kind="lozenge" seed={9} />}
      <TwistStack x={x - 30 * s} y={y + counterTop * s} />
      <g transform={T}>
        {/* the plinth's face (in front of the counter's foot) */}
        <rect x={-half} y={-plinthH} width={2 * half} height={plinthH} fill={P.plinthFace} />
        <rect x={-half} y={-plinthH} width={2 * half} height={4} fill={P.plinthLight} opacity={0.6} />
        <rect x={-half} y={-8} width={2 * half} height={8} fill={P.plinthShade} opacity={0.6} />
        {/* bamboo posts and the thatch */}
        {[-postX, postX].map((px) => (
          <g key={px}>
            <rect x={px - 7} y={eave + 4} width={14} height={-eave - plinthH - 4} fill={P.bamboo} />
            <rect x={px - 3} y={eave + 4} width={4} height={-eave - plinthH - 4} fill={P.bambooLight} opacity={0.4} />
            {[0.3, 0.62].map((q) => (
              <rect key={q} x={px - 8} y={eave + (-eave - plinthH) * q} width={16} height={4} fill={P.bambooTie} />
            ))}
          </g>
        ))}
        <path d={`M ${-postX - 70} ${eave + 26} Q 0 ${eave - 22} ${postX + 70} ${eave + 26} L ${postX - 30} ${ridge + 16} Q 0 ${ridge - 26} ${-postX + 30} ${ridge + 16} Z`} fill={P.thatch} />
        <path d={`M ${-postX + 30} ${ridge + 16} Q 0 ${ridge - 26} ${postX - 30} ${ridge + 16}`} stroke={P.thatchRidge} strokeWidth={7} fill="none" opacity={0.6} />
        {range(22).map((i) => {
          const u = i / 21;
          const xb = -postX - 60 + (2 * postX + 120) * u;
          const yb = eave + 22 - 24 * Math.sin(Math.PI * u);
          return <line key={`ts${i}`} x1={f1(xb)} y1={f1(yb)} x2={f1(xb + (u - 0.5) * 30)} y2={f1(yb - 96 - 24 * hashS(i + 5))} stroke={P.thatchStraw} strokeWidth={1.6} opacity={0.55} />;
        })}
        <path d={`M ${-postX - 70} ${eave + 26} Q 0 ${eave - 22} ${postX + 70} ${eave + 26} L ${postX + 66} ${eave + 40} Q 0 ${eave - 8} ${-postX - 66} ${eave + 40} Z`} fill={P.thatchEave} />
        {warm && <path d={`M ${postX - 30} ${ridge + 16} L ${postX + 70} ${eave + 26} L ${postX + 20} ${eave + 20} Z`} fill="#ffd08a" opacity={0.18} />}
      </g>
      {/* on the ground in front: two jute sacks at the left, the puffed-rice basket at the right */}
      <JuteSack x={x - 262 * s} y={y + 14 * s} s={0.9 * s} seed={1} />
      <JuteSack x={x - 330 * s} y={y + 20 * s} s={0.8 * s} grain="#e8b84a" grainHi="#f6d880" seed={4} />
      <MuriBasket x={x + 290 * s} y={y + 18 * s} s={0.95 * s} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The shirt on its peg, the clothes line, the gourd vine                */
/* ------------------------------------------------------------------ */

export interface ShirtOnPegProps {
  /** the peg's tip (the shirt hangs from it by its collar) */
  x: number;
  y: number;
  s?: number;
  f: number;
  /** sway amplitude (default 1: a gentle stir in the breeze; 0 = still) */
  sway?: number;
  /** world-space ReactNode drawn between the shirt's body and its pocket face (a note inside the pocket) */
  inPocket?: React.ReactNode;
  /** draw the shirt (default true); false leaves only the peg */
  shirt?: boolean;
}

/**
 * A man's plain white cotton shirt (a collarless village shirt, ফতুয়া-style) hanging by its collar from a bamboo peg
 * driven into a veranda post, with a breast pocket on the wearer's left (the viewer's right). About 120 px wide and
 * 160 px long at s 1. The pocket's mouth (top centre) is shirtPocketAt(x, y, s, f, sway): 24 s right of and 44 s below
 * the peg tip before sway. The `inPocket` slot is drawn between the body and the pocket face.
 */
export const ShirtOnPeg: React.FC<ShirtOnPegProps> = ({ x, y, s = 1, f, sway = 1, inPocket, shirt = true }) => {
  const a = shirtSway(f, sway);
  const T = `translate(${x}, ${y}) rotate(${a.toFixed(3)}) scale(${s})`;
  const W = "#f4f1e8";
  const WS = "#d9d3c2";
  return (
    <g>
      {/* the peg: a short bamboo stub, seen nearly end-on, slanting up out of the post */}
      <g transform={`translate(${x}, ${y})`}>
        <path d={`M -10 4 L 2 -2 L 4 3 L -8 9 Z`} fill={P.bambooTie} transform={`scale(${s})`} />
        <ellipse cx={3 * s} cy={0.5 * s} rx={3.6 * s} ry={3 * s} fill={P.bamboo} />
        <ellipse cx={3.4 * s} cy={0.2 * s} rx={1.8 * s} ry={1.4 * s} fill={P.bambooLight} opacity={0.7} />
      </g>
      {shirt && (
        <>
          <g transform={T}>
            {/* soft shadow on the post and wall behind */}
            <path d="M -44 22 L 50 22 L 54 166 L -40 166 Z" fill={P.shadow} opacity={0.12} transform="translate(5, 4)" />
            {/* sleeves hanging down at the sides */}
            <path d="M -40 10 Q -58 22 -62 48 L -66 104 Q -56 108 -46 104 L -40 52 Z" fill={WS} />
            <path d="M 40 10 Q 58 22 62 48 L 66 104 Q 56 108 46 104 L 40 52 Z" fill={WS} />
            <path d="M -64 98 L -46 100 L -46 106 Q -56 110 -66 104 Z" fill="#cfc8b4" />
            <path d="M 64 98 L 46 100 L 46 106 Q 56 110 66 104 Z" fill="#cfc8b4" />
            {/* the body: shoulders sloping from the collar hung on the peg, the hem a little curved */}
            <path d="M -8 2 Q 0 -2 8 2 L 40 10 Q 46 30 46 60 L 48 154 Q 0 164 -48 154 L -46 60 Q -46 30 -40 10 Z" fill={W} />
            {/* shading folds: the cloth draping from the peg */}
            <path d="M 0 4 Q -6 60 -16 156" stroke={WS} strokeWidth={5} fill="none" opacity={0.7} />
            <path d="M 4 6 Q 14 70 20 158" stroke={WS} strokeWidth={4} fill="none" opacity={0.6} />
            <path d="M -44 40 Q -40 100 -44 154" stroke={WS} strokeWidth={6} fill="none" opacity={0.5} />
            <path d="M 46 60 L 48 154 Q 40 156 34 156 L 36 60 Z" fill={WS} opacity={0.55} />
            {/* the collar band and the front placket with small buttons */}
            <path d="M -14 2 Q 0 14 14 2 Q 10 -2 0 -2 Q -10 -2 -14 2 Z" fill="#e8e2d2" />
            <line x1={0} y1={12} x2={0} y2={76} stroke={WS} strokeWidth={2.2} />
            {[24, 42, 60].map((by) => (
              <circle key={by} cx={0} cy={by} r={2} fill="#c9c0aa" />
            ))}
            <path d="M -48 150 Q 0 160 48 150" stroke={WS} strokeWidth={2} fill="none" opacity={0.8} />
            {/* the pocket's back (the inside, a little darker) */}
            <path d="M 8 44 L 40 44 L 40 50 L 8 50 Z" fill="#cdc6b2" />
          </g>
          {inPocket}
          <g transform={T}>
            {/* the pocket face over whatever is in it */}
            <path d="M 9 78 Q 24 84 41 78 L 41 81 Q 24 87 9 81 Z" fill={P.shadow} opacity={0.12} />
            <path d="M 8 46 L 40 46 L 40 76 Q 24 82 8 76 Z" fill="#ebe6d6" />
            <path d="M 10.5 48.5 L 37.5 48.5 L 37.5 74.5 Q 24 80 10.5 74.5 Z" fill="none" stroke="#b9b09a" strokeWidth={1.3} strokeDasharray="2.4 2" />
            <path d="M 40 46 L 40 76 Q 36 78 33 79 L 34 48 Z" fill={WS} opacity={0.6} />
            <line x1={8} y1={46.5} x2={40} y2={46.5} stroke="#cfc8b4" strokeWidth={2} />
            <path d="M 10 70 Q 24 76 38 70" stroke={WS} strokeWidth={2} fill="none" opacity={0.7} />
          </g>
        </>
      )}
    </g>
  );
};

/** A clothes line (দড়ি) on two bamboo poles with a sari and a checked gamchha hanging on it, stirring in the breeze. */
export const ClothesLine: React.FC<{ x0: number; x1: number; y: number; h: number; f: number; time?: VillageTime }> = ({ x0, x1, y, h, f }) => {
  const top = y - h;
  const sag = 26;
  const lineY = (xx: number) => top + 12 + sag * Math.sin((Math.PI * (xx - x0)) / (x1 - x0));
  const stir = (i: number) => 2.2 * Math.sin(f * 0.04 + i * 1.7) + 1.2 * noise1(f * 0.03, 500 + i);
  const cloth = (cx0: number, cx1: number, len: number, i: number, body: React.ReactNode) => {
    const a = lineY(cx0);
    const b = lineY(cx1);
    const sk = stir(i);
    return (
      <g key={i}>
        <path d={`M ${cx0} ${f1(a)} L ${cx1} ${f1(b)} L ${f1(cx1 + sk)} ${f1(b + len)} Q ${f1((cx0 + cx1) / 2 + sk)} ${f1((a + b) / 2 + len + 8)} ${f1(cx0 + sk)} ${f1(a + len)} Z`} fill={P.shadow} opacity={0.1} transform="translate(8, 6)" />
        <g transform={`translate(0, 0)`}>{body}</g>
      </g>
    );
  };
  const s1 = stir(1);
  const s2 = stir(2);
  const a0 = lineY(x0 + 70);
  const a1 = lineY(x0 + 280);
  const g0 = lineY(x0 + 360);
  const g1 = lineY(x0 + 450);
  return (
    <g>
      {[x0, x1].map((px, i) => (
        <g key={px}>
          <ellipse cx={px - 6} cy={y + 2} rx={16} ry={4} fill={P.shadow} opacity={0.3} />
          <rect x={px - 5} y={top} width={10} height={h} rx={4} fill={P.bamboo} />
          <rect x={px - 2} y={top} width={3} height={h} fill={P.bambooLight} opacity={0.4} />
          <rect x={px - 6} y={top + 8 + 4 * i} width={12} height={3} fill={P.bambooTie} />
        </g>
      ))}
      <path d={`M ${x0} ${top + 12} Q ${(x0 + x1) / 2} ${top + 12 + 2 * sag} ${x1} ${top + 12}`} stroke="#8a7650" strokeWidth={2} fill="none" />
      {/* a blue cotton sari with a red border, folded over the line */}
      {cloth(
        x0 + 70,
        x0 + 280,
        150,
        1,
        <g>
          <path d={`M ${x0 + 70} ${f1(a0)} L ${x0 + 280} ${f1(a1)} L ${f1(x0 + 284 + s1)} ${f1(a1 + 150)} Q ${f1(x0 + 176 + s1)} ${f1((a0 + a1) / 2 + 162)} ${f1(x0 + 66 + s1)} ${f1(a0 + 146)} Z`} fill="#5a86b8" />
          <path d={`M ${f1(x0 + 66 + s1)} ${f1(a0 + 132)} Q ${f1(x0 + 176 + s1)} ${f1((a0 + a1) / 2 + 148)} ${f1(x0 + 284 + s1)} ${f1(a1 + 136)} L ${f1(x0 + 284 + s1)} ${f1(a1 + 150)} Q ${f1(x0 + 176 + s1)} ${f1((a0 + a1) / 2 + 162)} ${f1(x0 + 66 + s1)} ${f1(a0 + 146)} Z`} fill="#c0303a" />
          <path d={`M ${x0 + 70} ${f1(a0)} L ${x0 + 280} ${f1(a1)} L ${x0 + 280} ${f1(a1 + 10)} L ${x0 + 70} ${f1(a0 + 10)} Z`} fill="#c0303a" />
          {[0.3, 0.55, 0.8].map((q) => (
            <path key={q} d={`M ${f1(lerp(x0 + 70, x0 + 280, q))} ${f1(lerp(a0, a1, q) + 12)} q ${f1(s1 * 0.5)} 60 ${f1(s1)} 128`} stroke="#4a72a0" strokeWidth={5} fill="none" opacity={0.6} />
          ))}
        </g>,
      )}
      {/* a red-and-white checked gamchha */}
      {cloth(
        x0 + 360,
        x0 + 450,
        120,
        2,
        <g>
          <path d={`M ${x0 + 360} ${f1(g0)} L ${x0 + 450} ${f1(g1)} L ${f1(x0 + 452 + s2)} ${f1(g1 + 120)} L ${f1(x0 + 358 + s2)} ${f1(g0 + 118)} Z`} fill="#f0e6d6" />
          {range(5).map((i) => (
            <path key={`gv${i}`} d={`M ${x0 + 368 + i * 18} ${f1(lerp(g0, g1, (8 + i * 18) / 90) + 2)} l ${f1(s2)} 116`} stroke="#c8303a" strokeWidth={4} opacity={0.75} />
          ))}
          {range(6).map((i) => (
            <path key={`gh${i}`} d={`M ${f1(x0 + 360 + s2 * (i / 6))} ${f1(g0 + 14 + i * 19)} L ${f1(x0 + 450 + s2 * (i / 6))} ${f1(g1 + 14 + i * 19)}`} stroke="#c8303a" strokeWidth={4} opacity={0.7} />
          ))}
          {range(9).map((i) => (
            <line key={`fr${i}`} x1={f1(x0 + 362 + s2 + i * 11)} y1={f1(lerp(g0, g1, i / 8) + 118)} x2={f1(x0 + 362 + s2 * 1.2 + i * 11)} y2={f1(lerp(g0, g1, i / 8) + 128)} stroke="#e8dcc8" strokeWidth={1.6} />
          ))}
        </g>,
      )}
    </g>
  );
};

/** A bottle-gourd (লাউ) vine running over a thatch roof: stems, broad round leaves, white flowers and one hanging gourd. */
export const GourdVine: React.FC<{ pts: Array<[number, number]>; f: number; gourd?: [number, number]; seed?: number }> = ({ pts, f, gourd, seed = 0 }) => {
  const d = pts.map(([px, py], i) => `${i ? "L" : "M"} ${px} ${py}`).join(" ");
  return (
    <g>
      <path d={d} stroke="#5a7a30" strokeWidth={3} fill="none" strokeLinejoin="round" />
      {pts.slice(1).map(([px, py], i) => {
        const [qx, qy] = pts[i];
        return range(3).map((j) => {
          const u = (j + 0.5) / 3;
          const lx = lerp(qx, px, u);
          const ly = lerp(qy, py, u);
          const r = 15 + 7 * hashS(seed + i * 5 + j);
          const sw = 3 * Math.sin(f * 0.035 + i + j);
          const side = (i + j) % 2 ? 1 : -1;
          return (
            <g key={`${i}-${j}`} transform={`translate(${f1(lx)}, ${f1(ly)}) rotate(${f1(sw + side * 30)})`}>
              <path d={`M 0 0 C ${-r} ${-r * 0.4} ${-r * 0.9} ${-r * 1.6} 0 ${-r * 1.4} C ${r * 0.9} ${-r * 1.6} ${r} ${-r * 0.4} 0 0 Z`} fill={j % 2 ? "#4c8a3c" : "#3e7a34"} />
              <path d={`M 0 -2 L 0 ${-r * 1.2}`} stroke="#2e5a26" strokeWidth={1} opacity={0.6} />
              {(i + j) % 3 === 0 && (
                <g transform={`translate(${side * r * 0.9}, ${-r * 0.6})`}>
                  {range(5).map((q) => (
                    <ellipse key={q} cx={0} cy={-4} rx={3.4} ry={5} fill="#fbfaf2" transform={`rotate(${q * 72})`} />
                  ))}
                  <circle r={2} fill="#e8d070" />
                </g>
              )}
            </g>
          );
        });
      })}
      {gourd && (
        <g transform={`rotate(${f1(1.5 * Math.sin(f * 0.03 + seed))} ${gourd[0]} ${gourd[1]})`}>
          <line x1={gourd[0]} y1={gourd[1]} x2={gourd[0]} y2={gourd[1] + 22} stroke="#5a7a30" strokeWidth={2.4} />
          <path d={`M ${gourd[0]} ${gourd[1] + 20} C ${gourd[0] - 12} ${gourd[1] + 26} ${gourd[0] - 10} ${gourd[1] + 50} ${gourd[0] - 20} ${gourd[1] + 74} C ${gourd[0] - 30} ${gourd[1] + 104} ${gourd[0] + 30} ${gourd[1] + 104} ${gourd[0] + 20} ${gourd[1] + 74} C ${gourd[0] + 10} ${gourd[1] + 50} ${gourd[0] + 12} ${gourd[1] + 26} ${gourd[0]} ${gourd[1] + 20} Z`} fill="#9cbc56" />
          <path d={`M ${gourd[0] - 8} ${gourd[1] + 40} Q ${gourd[0] - 18} ${gourd[1] + 70} ${gourd[0] - 12} ${gourd[1] + 92}`} stroke="#d6e6a0" strokeWidth={4} fill="none" opacity={0.6} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Sky (0.15) and jungle (0.35)                                        */
/* ------------------------------------------------------------------ */

/** Afternoon sky: blue overhead warming to gold at the horizon, the sun lower on the right, a few soft clouds. */
const AfternoonSky: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="vf-pm-sky" gradientUnits="userSpaceOnUse" x1={0} y1={-300} x2={0} y2={760}>
        <stop offset="0%" stopColor="#8db4d2" />
        <stop offset="48%" stopColor="#e4dfc4" />
        <stop offset="100%" stopColor="#ffd398" />
      </linearGradient>
      <radialGradient id="vf-pm-sun">
        <stop offset="0%" stopColor="#fff4d8" stopOpacity={0.95} />
        <stop offset="12%" stopColor="#ffe2a2" stopOpacity={0.7} />
        <stop offset="40%" stopColor="#ffc880" stopOpacity={0.25} />
        <stop offset="100%" stopColor="#ffc078" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-2200} y={-1200} width={6400} height={2400} fill="url(#vf-pm-sky)" />
    <circle cx={1700} cy={300} r={620} fill="url(#vf-pm-sun)" />
    <circle cx={1700} cy={300} r={46} fill="#fff6e0" opacity={0.9} />
    {range(7).map((i) => {
      const span = 5600;
      const cx = pm((-1600 + i * 720 + f * (0.1 + 0.1 * hashS(i + 3)) + 1600) / span) * span - 1600;
      return (
        <g key={i} transform={`translate(${f1(cx)}, ${f1(-30 + 260 * hashS(i * 3))}) scale(${(0.8 + 0.6 * hashS(i * 5)).toFixed(3)})`} opacity={0.75}>
          <ellipse cx={0} cy={0} rx={160} ry={28} fill="#fff8ea" />
          <ellipse cx={-50} cy={-16} rx={74} ry={28} fill="#fffaf0" />
          <ellipse cx={0} cy={12} rx={160} ry={12} fill="#f6d2a8" opacity={0.7} />
        </g>
      );
    })}
    <Birds f={f} x={-200} y={240} n={5} s={0.8} />
  </g>
);

/**
 * Sunset sky (G2): dusky blue overhead through rose to a deep gold-orange at the horizon, the big low sun on the right
 * just above the jungle's crowns with a wide glow, long thin clouds lit orange-pink from below, birds flying home.
 */
const SunsetSky: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="vf-ss-sky" gradientUnits="userSpaceOnUse" x1={0} y1={-300} x2={0} y2={720}>
        <stop offset="0%" stopColor="#6d86b4" />
        <stop offset="26%" stopColor="#b8a0b0" />
        <stop offset="48%" stopColor="#efab84" />
        <stop offset="70%" stopColor="#f9b060" />
        <stop offset="100%" stopColor="#ffd27c" />
      </linearGradient>
      <radialGradient id="vf-ss-sun">
        <stop offset="0%" stopColor="#fff2c8" stopOpacity={1} />
        <stop offset="8%" stopColor="#ffd88a" stopOpacity={0.85} />
        <stop offset="30%" stopColor="#ffa858" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#ff9a50" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-2200} y={-1200} width={6400} height={2400} fill="url(#vf-ss-sky)" />
    <ellipse cx={SUNSET_SUN.x} cy={SUNSET_SUN.y + 120} rx={1500} ry={300} fill="url(#vf-ss-sun)" opacity={0.6} />
    <circle cx={SUNSET_SUN.x} cy={SUNSET_SUN.y} r={520} fill="url(#vf-ss-sun)" />
    <circle cx={SUNSET_SUN.x} cy={SUNSET_SUN.y} r={74} fill="#ffe0a0" opacity={0.55} />
    <circle cx={SUNSET_SUN.x} cy={SUNSET_SUN.y} r={56} fill="#fff1c6" />
    {/* long thin clouds: violet-grey above, lit orange-pink from below, drifting slowly */}
    {range(10).map((i) => {
      const span = 5600;
      const cx = pm((-1600 + i * 560 + f * (0.08 + 0.08 * hashS(i + 13)) + 1600) / span) * span - 1600;
      const cy = -40 + 380 * hashS(i * 3 + 7);
      const sc = 0.7 + 0.8 * hashS(i * 5 + 4);
      return (
        <g key={i} transform={`translate(${f1(cx)}, ${f1(cy)}) scale(${sc.toFixed(3)})`} opacity={0.85}>
          <ellipse cx={0} cy={0} rx={260} ry={15} fill="#b892a6" />
          <ellipse cx={-70} cy={-8} rx={120} ry={13} fill="#c8a2b0" />
          <ellipse cx={20} cy={8} rx={240} ry={8} fill="#ffb27a" opacity={0.85} />
        </g>
      );
    })}
    <Birds f={f} x={-300} y={300} n={6} s={0.7} />
    <Birds f={f * 0.8} x={500} y={200} n={4} s={0.55} />
  </g>
);

export const VillageSkyLayer: React.FC<{ time?: VillageTime; f: number; cam?: Cam; calm?: number }> = ({ time = "lateMorning", f, cam, calm = 1 }) =>
  time === "sunset" ? (
    <Layer depth={0.15} extraBlur={ujancharBgBlur(0.15, calm, cam)}>
      <SunsetSky f={f} />
    </Layer>
  ) : time === "afternoon" ? (
    <Layer depth={0.15} extraBlur={ujancharBgBlur(0.15, calm, cam)}>
      <AfternoonSky f={f} />
    </Layer>
  ) : (
    <UjancharSkyLayer f={f} time="morning" cam={cam} calm={calm} />
  );

export const VillageJungleLayer: React.FC<{ time?: VillageTime; f: number; cam?: Cam; calm?: number }> = ({ time = "lateMorning", f, cam, calm = 1 }) => (
  <>
    <UjancharJungleLayer f={f} time="morning" cam={cam} calm={calm} />
    {time === "afternoon" && (
      <Layer depth={0.35} extraBlur={ujancharBgBlur(0.35, calm, cam)}>
        {/* the afternoon's warm haze over the far jungle */}
        <rect x={-1800} y={300} width={5600} height={1300} fill="#ffd9a0" opacity={0.14} />
      </Layer>
    )}
    {time === "sunset" && (
      <Layer depth={0.35} extraBlur={ujancharBgBlur(0.35, calm, cam)}>
        {/* the sunset: the jungle goes to a warm, darker silhouette, an orange haze glowing on the sun side */}
        <defs>
          <linearGradient id="vf-ss-jhaze" gradientUnits="userSpaceOnUse" x1={0} y1={440} x2={0} y2={700}>
            <stop offset="0" stopColor="#ffaa60" stopOpacity={0} />
            <stop offset="0.5" stopColor="#ffaa60" stopOpacity={0.16} />
            <stop offset="1" stopColor="#ff9a58" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="vf-ss-jdark" gradientUnits="userSpaceOnUse" x1={0} y1={520} x2={0} y2={640}>
            <stop offset="0" stopColor="#2a160e" stopOpacity={0} />
            <stop offset="1" stopColor="#2a160e" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <rect x={-1800} y={520} width={5600} height={1080} fill="url(#vf-ss-jdark)" />
        <rect x={-1800} y={440} width={5600} height={1160} fill="url(#vf-ss-jhaze)" />
      </Layer>
    )}
  </>
);

/* ------------------------------------------------------------------ */
/* Trees (0.5)                                                         */
/* ------------------------------------------------------------------ */

export const VillageTreesLayer: React.FC<{ view: VillageView; f: number; cam?: Cam; calm?: number }> = ({ view, f, cam, calm = 1 }) => (
  <Layer depth={0.5} extraBlur={ujancharBgBlur(0.5, calm, cam)}>
    {view === "field" ? (
      <g>
        {/* coconut palms and banana trees rising behind the village edge */}
        {[
          [-1300, 1.05, 6],
          [-620, 1.15, 2],
          [180, 1.1, 5],
          [760, 1.2, 8],
          [1420, 1.05, 4],
          [2040, 1.25, 9],
          [2760, 1.1, 3],
          [3420, 1.15, 7],
          [4100, 1.05, 1],
        ].map(([x, s, sd]) => (
          <Palm key={`p${x}`} x={x} y={748} s={s} f={f} seed={sd} />
        ))}
        {[-980, -260, 480, 1120, 1760, 2400, 3060, 3760].map((x, i) => (
          <Banana key={`b${x}`} x={x} y={754} s={1.35 + 0.2 * hashS(i)} f={f} />
        ))}
        <MangoTree x={-860} y={766} s={0.62} f={f} seed={5} />
        <MangoTree x={3200} y={766} s={0.66} f={f} seed={6} />
      </g>
    ) : view === "lane" ? (
      <g>
        {/* palms, banana trees and a mango or two over the roofs beyond the lane */}
        {[
          [-1250, 1.1, 3],
          [-520, 1.2, 7],
          [240, 1.05, 1],
          [900, 1.25, 6],
          [1600, 1.1, 2],
          [2520, 1.2, 9],
          [3260, 1.1, 5],
          [3980, 1.15, 8],
        ].map(([x, s, sd]) => (
          <Palm key={`p${x}`} x={x} y={792} s={s} f={f} seed={sd} />
        ))}
        {[-880, -120, 560, 1260, 2060, 2900, 3640].map((x, i) => (
          <Banana key={`b${x}`} x={x} y={798} s={1.4 + 0.2 * hashS(i + 11)} f={f} />
        ))}
        <MangoTree x={-200} y={806} s={0.7} f={f} seed={7} />
        <MangoTree x={3500} y={806} s={0.74} f={f} seed={3} />
      </g>
    ) : (
      <g>
        {[
          [-1100, 1.1, 6],
          [-200, 1.2, 2],
          [700, 1.1, 5],
          [1600, 1.25, 8],
          [2300, 1.1, 4],
          [3100, 1.2, 9],
        ].map(([x, s, sd]) => (
          <Palm key={`p${x}`} x={x} y={860} s={s} f={f} seed={sd} />
        ))}
        {[-700, 300, 1250, 2000, 2700, 3400].map((x, i) => (
          <Banana key={`b${x}`} x={x} y={866} s={1.5 + 0.2 * hashS(i + 4)} f={f} />
        ))}
        <MangoTree x={1900} y={850} s={0.85} f={f} seed={8} />
      </g>
    )}
  </Layer>
);

/* ------------------------------------------------------------------ */
/* The far plane (0.65): the village edge / the house's back fence      */
/* ------------------------------------------------------------------ */

/** The line of thatched huts at the village edge, beyond the field: [x, w, s, door, window, corner, smoke] */
const FAR_HUTS: Array<[number, number, number, number | null, number | null, boolean, boolean]> = [
  [-1640, 820, 0.4, 300, 600, false, false],
  [-840, 640, 0.36, null, 220, true, false],
  [-60, 900, 0.42, 620, 260, false, true],
  [700, 700, 0.37, 260, null, true, false],
  [1420, 960, 0.43, 360, 700, false, false],
  [2260, 760, 0.38, 520, 200, true, true],
  [3000, 900, 0.42, 300, 640, false, false],
  [3820, 760, 0.39, 420, null, true, false],
];

export const VillageFarLayer: React.FC<{ view: VillageView; time?: VillageTime; f: number; cam?: Cam; calm?: number; far?: React.ReactNode }> = ({ view, time = "lateMorning", f, cam, calm = 1, far }) => (
  <Layer depth={0.65} extraBlur={ujancharBgBlur(0.65, calm, cam)}>
    {view === "field" ? (
      <g>
        {/* the village edge: its beaten earth (deep, so the mid field's back edge never opens a gap) */}
        <path d={`M -1700 ${F_FAR_GROUND - 18} Q 1400 ${F_FAR_GROUND - 30} 4600 ${F_FAR_GROUND - 16} L 4600 1100 L -1700 1100 Z`} fill={P.yard} />
        {FAR_HUTS.map(([x, w, s, door, win, corner, smoke], i) => (
          <g key={x}>
            <MudHouse x={x} y={F_FAR_GROUND + 4 * hashS(i)} w={w} s={s * 0.85} f={f} door={door} window={win} corner={corner} pots={door !== null ? [door + 120, door + 156] : undefined} smoke={smoke} />
            {i < FAR_HUTS.length - 1 && (
              <FenceAt x0={x + w * s * 0.85 + (corner ? 44 : 6)} x1={FAR_HUTS[i + 1][0] - 6} base={F_FAR_GROUND + 8} k={0.34} seed={i * 3 + 5} />
            )}
          </g>
        ))}
        <Haystack x={1180} y={F_FAR_GROUND + 10} s={0.32} seed={2} />
        <Haystack x={3560} y={F_FAR_GROUND + 12} s={0.36} seed={7} />
        {[-1200, -420, 330, 1060, 1900, 2700, 3420, 4300].map((x, i) => (
          <BushAt key={x} x={x} y={F_FAR_GROUND + 16} w={200} k={0.42} f={f} seed={i * 5 + 3} />
        ))}
        {[-1480, -300, 620, 1680, 2520, 3300, 4100].map((x, i) => (
          <BananaPlant key={`fb${x}`} x={x} y={F_FAR_GROUND + 18} s={0.29 + 0.04 * hashS(i * 3)} f={f} seed={700 + i} leaves={6} dead={1} tears={2} tone={0.35} lean={6 * (hashS(i * 7) - 0.5)} />
        ))}
        {time === "afternoon" && <rect x={-1700} y={380} width={6300} height={400} fill="#ffcf96" opacity={0.08} />}
        {time === "sunset" && <SunsetFarWash x0={-1700} x1={4600} top={F_FAR_GROUND - 150} />}
      </g>
    ) : view === "lane" ? (
      <LaneFar time={time} f={f} />
    ) : (
      <g>
        <rect x={-1600} y={800} width={5400} height={1100 - 800} fill={P.yard} />
        {/* the kitchen hut (রান্নাঘর) at the left, its open front and clay oven, smoke from under the thatch */}
        <MudHouse x={-980} y={856} w={760} s={0.62} f={f} window={null} door={420} corner pots={[200, 236]} smoke />
        <path d={`M ${-980 + 360 * 0.62} 838 q 14 -22 30 0 Z`} fill="#8e4a2a" />
        {/* the back fence with a gate gap at the right (where the boys come in) */}
        <FenceAt x0={-1600} x1={-990} base={862} seed={41} />
        <FenceAt x0={-200} x1={H_GATE.x0} base={862} seed={3} />
        <FenceAt x0={H_GATE.x1} x1={3800} base={862} seed={7} />
        <path d={`M ${H_GATE.x0 + 4} 862 L ${H_GATE.x1 - 4} 862 L ${H_GATE.x1 + 50} 900 L ${H_GATE.x0 - 70} 900 Z`} fill="#b48a58" opacity={0.6} />
        <GatePost x={H_GATE.x0} base={862} />
        <GatePost x={H_GATE.x1} base={862} />
        {/* the neighbour's thatch beyond the fence and a haystack */}
        <MudHouse x={2600} y={812} w={900} s={0.46} f={f} window={300} door={640} pots={[760]} />
        <Haystack x={2380} y={872} s={0.62} seed={3} />
        {[-1400, -560, 1960, 2900, 3400].map((x, i) => (
          <UjancharBush key={x} x={x} y={872} w={170 + 60 * hashS(i + 9)} f={f} seed={i * 4 + 2} flowers={i === 2 ? 4 : 0} />
        ))}
        {[-1250, 3250].map((x, i) => (
          <BananaPlant key={`hb${x}`} x={x} y={880} s={0.62} f={f} seed={760 + i} leaves={7} dead={1} tone={0.25} />
        ))}
        {time === "afternoon" && <rect x={-1600} y={380} width={5400} height={520} fill="#ffcf96" opacity={0.08} />}
        {time === "sunset" && <SunsetFarWash x0={-1600} x1={3800} top={700} />}
      </g>
    )}
    {far}
  </Layer>
);

/** The sunset's wash over a far plane below `top` (so the sky is untouched): warm light, deeper shade toward the ground. */
const SunsetFarWash: React.FC<{ x0: number; x1: number; top: number }> = ({ x0, x1, top }) => (
  <g>
    <rect x={x0} y={top} width={x1 - x0} height={1100 - top} fill="#ffa860" opacity={0.08} />
    <rect x={x0} y={top + 60} width={x1 - x0} height={1040 - top} fill="#3a2014" opacity={0.14} />
  </g>
);

/** The lane's far plane (0.65): the village beyond the cross lane, and the friend's house at the lane's end. */
const LANE_FAR_HUTS: Array<[number, number, number, number | null, number | null, boolean, boolean]> = [
  [-1680, 820, 0.46, 300, 600, false, false],
  [-860, 700, 0.42, null, 240, true, true],
  [-40, 880, 0.47, 600, 260, false, false],
  [820, 720, 0.43, 260, null, true, false],
  [3060, 800, 0.45, 300, 600, true, true],
  [3820, 760, 0.42, 420, null, false, false],
];

const LaneFar: React.FC<{ time: VillageTime; f: number }> = ({ time, f }) => {
  const hx1 = L_HOUSE.x + L_HOUSE.w * L_HOUSE.s;
  const hs = L_HOUSE.s;
  const doorX = L_HOUSE.x + L_HOUSE.door * hs;
  return (
    <g>
      {/* the beaten earth beyond the cross lane (deep, so the floor's back edge never opens a gap) */}
      <path d={`M -1700 ${L_FAR_GROUND - 16} Q 1400 ${L_FAR_GROUND - 26} 4600 ${L_FAR_GROUND - 14} L 4600 1100 L -1700 1100 Z`} fill={P.yard} />
      {LANE_FAR_HUTS.map(([x, w, s, door, win, corner, smoke], i) => (
        <g key={x}>
          <MudHouse x={x} y={L_FAR_GROUND + 4 * hashS(i + 3)} w={w} s={s} f={f} door={door} window={win} corner={corner} pots={door !== null ? [door + 120] : undefined} smoke={smoke} />
          {i < LANE_FAR_HUTS.length - 1 && LANE_FAR_HUTS[i + 1][0] - (x + w * s + (corner ? 50 : 6)) > 30 && (
            <FenceAt x0={x + w * s + (corner ? 50 : 6)} x1={LANE_FAR_HUTS[i + 1][0] - 6} base={L_FAR_GROUND + 8} k={0.4} seed={i * 5 + 2} />
          )}
        </g>
      ))}
      {/* the fences on either side of the friend's house */}
      <FenceAt x0={820 + 720 * 0.43 + 50} x1={L_HOUSE.x - 30} base={L_FAR_GROUND + 8} k={0.4} seed={23} />
      <FenceAt x0={hx1 + 70} x1={3054} base={L_FAR_GROUND + 8} k={0.4} seed={29} />
      {/* THE FRIEND'S HOUSE at the lane's end: the same house as view "house" (corner, door, barred window, gourd vine) */}
      <path d={`M ${doorX - 30} ${L_FAR_GROUND + 6} L ${doorX + 30} ${L_FAR_GROUND + 6} L ${doorX + 120} 1100 L ${doorX - 160} 1100 Z`} fill="#b8946a" opacity={0.55} />
      <MudHouse x={L_HOUSE.x} y={L_HOUSE.y} w={L_HOUSE.w} s={hs} f={f} door={L_HOUSE.door} window={L_HOUSE.window} corner posts={H.posts} pots={[150, 186, 760]} broom={440} />
      <GourdVine
        f={f}
        seed={3}
        pts={[
          [hx1 + 120 * (hs / H.s), L_HOUSE.y - 200 * hs],
          [hx1 + 40 * (hs / H.s), L_HOUSE.y - 236 * hs],
          [hx1 - 140 * (hs / H.s), L_HOUSE.y - 290 * hs],
          [hx1 - 360 * (hs / H.s), L_HOUSE.y - 330 * hs],
          [hx1 - 560 * (hs / H.s), L_HOUSE.y - 356 * hs],
        ]}
      />
      <Haystack x={hx1 + 260} y={L_FAR_GROUND + 10} s={0.5} seed={5} />
      {[-1300, -480, 420, 1500, 2860, 3560, 4300].map((x, i) => (
        <BushAt key={x} x={x} y={L_FAR_GROUND + 18} w={200} k={0.5} f={f} seed={i * 7 + 4} flowers={i === 3 ? 3 : 0} />
      ))}
      {[-1500, -200, 1200, 3300, 4100].map((x, i) => (
        <BananaPlant key={`lb${x}`} x={x} y={L_FAR_GROUND + 20} s={0.34 + 0.05 * hashS(i * 3 + 1)} f={f} seed={720 + i} leaves={6} dead={1} tears={2} tone={0.3} lean={6 * (hashS(i * 7 + 2) - 0.5)} />
      ))}
      {time === "afternoon" && <rect x={-1700} y={380} width={6300} height={440} fill="#ffcf96" opacity={0.08} />}
      {time === "sunset" && <SunsetFarWash x0={-1700} x1={4600} top={L_FAR_GROUND - 200} />}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Mid field (0.8, field only)                                         */
/* ------------------------------------------------------------------ */

const GrassTufts: React.FC<{ n: number; x0: number; x1: number; y0: number; y1: number; seed: number; scale?: number; col?: string[] }> = ({ n, x0, x1, y0, y1, seed, scale = 1, col = ["#6f7f3a", "#7f9044", "#5f7034"] }) => (
  <g>
    {range(n).map((i) => {
      const x = lerp(x0, x1, hashS(seed + i * 3.1));
      const y = lerp(y0, y1, Math.pow(hashS(seed + i * 5.7), 0.8));
      const sc = scale * (0.6 + 0.6 * ((y - y0) / Math.max(1, y1 - y0))) * (0.7 + 0.5 * hashS(seed + i));
      return (
        <g key={i} transform={`translate(${f1(x)}, ${f1(y)}) scale(${sc.toFixed(3)})`}>
          {range(5).map((j) => (
            <path key={j} d={`M ${-6 + j * 3} 0 Q ${-6 + j * 3 + (j - 2) * 2} -8 ${-6 + j * 3 + (j - 2) * 4} -${12 + 6 * hashS(seed + i + j)}`} stroke={col[(i + j) % col.length]} strokeWidth={2} fill="none" strokeLinecap="round" />
          ))}
        </g>
      );
    })}
  </g>
);

export const VillageMidLayer: React.FC<{ time?: VillageTime; f: number; cam?: Cam; calm?: number; mid?: React.ReactNode }> = ({ time = "lateMorning", f, cam, calm = 1, mid }) => {
  const pmT = time === "afternoon";
  const ssT = time === "sunset";
  return (
    <Layer depth={0.8} extraBlur={ujancharBgBlur(0.8, calm, cam)}>
      {/* the mid field: worn grass over beaten earth, deep so the floor's back edge never opens a gap */}
      <path d={`M -1600 ${F_MID_TOP} Q 300 ${F_MID_TOP - 10} 1400 ${F_MID_TOP + 2} Q 2800 ${F_MID_TOP + 10} 4400 ${F_MID_TOP - 4} L 4400 1100 L -1600 1100 Z`} fill="#a89458" />
      {range(9).map((i) => (
        <ellipse key={i} cx={-1300 + i * 640 + 160 * hashS(i * 3)} cy={F_MID_TOP + 40 + 40 * hashS(i * 5)} rx={260 + 120 * hashS(i)} ry={22 + 10 * hashS(i * 7)} fill={i % 2 ? "#8f9a52" : "#b89a62"} opacity={0.45} />
      ))}
      <GrassTufts n={110} x0={-1600} x1={4400} y0={F_MID_TOP + 6} y1={900} seed={21} scale={0.7} />
      {/* the far big mango tree, its shadow on the field */}
      <ellipse cx={F_MANGO_FAR.x + (ssT ? -330 : pmT ? -150 : -20)} cy={F_MANGO_FAR.y + 6} rx={ssT ? 640 : pmT ? 420 : 300} ry={26} fill={P.shadow} opacity={0.22} />
      <MangoTree x={F_MANGO_FAR.x} y={F_MANGO_FAR.y} s={F_MANGO_FAR.s} f={f} seed={4} />
      {[-1100, -300, 3000, 3700].map((x, i) => (
        <BushAt key={x} x={x} y={F_MID_TOP + 30} w={220} k={0.62} f={f} seed={i * 3 + 11} />
      ))}
      {/* the worn path from the field into the village (toward the stall's lane) */}
      <path d={`M 1500 ${F_MID_TOP + 4} Q 1560 820 1780 900 L 1980 900 Q 1700 820 1620 ${F_MID_TOP + 2} Z`} fill="#c09a68" opacity={0.5} />
      {pmT && <rect x={-1600} y={F_MID_TOP - 300} width={6000} height={700} fill="#ffcf96" opacity={0.06} />}
      {ssT && <rect x={-1600} y={F_MID_TOP - 6} width={6000} height={1100 - F_MID_TOP} fill="#3a2014" opacity={0.1} />}
      {mid}
    </Layer>
  );
};

/* ------------------------------------------------------------------ */
/* The whole backdrop, calmed (CAM-11)                                  */
/* ------------------------------------------------------------------ */

export interface VillageBackdropProps {
  view: VillageView;
  time?: VillageTime;
  f: number;
  cam?: Cam;
  calm?: number;
  far?: React.ReactNode;
  yard?: React.ReactNode;
  mid?: React.ReactNode;
}

export const VillageBackdrop: React.FC<VillageBackdropProps> = ({ view, time = "lateMorning", f, cam, calm = 1, far, yard, mid }) => {
  // opt-in painted skin (SetSkin.tsx); with no provider this is skipped and the vector backdrop renders as before
  const skinned = useSetSkin()?.villageBackdrop?.({ view, time, f, cam, calm, far, yard, mid });
  if (skinned !== undefined) return <>{skinned}</>;
  return <VillageBackdropVector view={view} time={time} f={f} cam={cam} calm={calm} far={far} yard={yard} mid={mid} />;
};

const VillageBackdropVector: React.FC<VillageBackdropProps> = ({ view, time = "lateMorning", f, cam, calm = 1, far, yard, mid }) => (
  <div style={{ position: "absolute", inset: 0, filter: ujancharBgFilter(calm, "morning") }}>
    <VillageSkyLayer time={time} f={f} cam={cam} calm={calm} />
    <VillageJungleLayer time={time} f={f} cam={cam} calm={calm} />
    <VillageTreesLayer view={view} f={f} cam={cam} calm={calm} />
    <VillageFarLayer
      view={view}
      time={time}
      f={f}
      cam={cam}
      calm={calm}
      far={
        far || yard ? (
          <>
            {far}
            {yard}
          </>
        ) : undefined
      }
    />
    {view === "field" && <VillageMidLayer time={time} f={f} cam={cam} calm={calm} mid={mid} />}
    {time === "afternoon" && (
      // the warm, lower afternoon sun over the far planes, strongest on the sun side (right)
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 62% 72% at 86% 26%, rgba(255,200,120,0.58) 0%, rgba(255,176,96,0.16) 52%, rgba(0,0,0,0) 100%)",
          mixBlendMode: "screen",
          opacity: 0.5,
        }}
      />
    )}
    {time === "sunset" && (
      // the low setting sun behind the far planes on the right: a broad golden-orange glow along the horizon
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 46% 34% at 65% 31%, rgba(255,200,120,0.8) 0%, rgba(255,150,70,0.2) 50%, rgba(0,0,0,0) 100%)",
          mixBlendMode: "screen",
          opacity: 0.42,
        }}
      />
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Floor (1)                                                           */
/* ------------------------------------------------------------------ */

export interface VillageFloorProps {
  view: VillageView;
  time?: VillageTime;
  f: number;
  /** 0..1 (default 1): the set pieces behind the subjects get half the background's CAM-11 calm */
  calm?: number;
  /** field: the sweet-seller (behind the counter) */
  seller?: React.ReactNode;
  /** field: draw the set's own lozenge jar (default true) */
  lozengeJar?: boolean;
  /** house: inside the friend's doorway (behind the door leaf, frame and posts) */
  doorway?: React.ReactNode;
  /** house: between the shirt's body and its pocket face */
  inPocket?: React.ReactNode;
  /** house: the shirt on its peg (default true) */
  shirt?: boolean;
  /** field: draw the fallen log at VILLAGE.field.log (G2; default false, so the delivered field is unchanged) */
  log?: boolean;
  /** field: long shadows of the children seated on the log ({ x: seat x, h: figure height }), drawn on the ground under it */
  logShadows?: LogShadow[];
  /** lane: floor-plane figures on the cross lane far ahead (VILLAGE.lane.farCross), drawn behind the lane's fences, huts and haystack */
  crossing?: React.ReactNode;
  under?: React.ReactNode;
  children?: React.ReactNode;
}

type Part = "ground" | "set" | "near";

const FieldFloor: React.FC<{ part: Part; time: VillageTime; f: number; seller?: React.ReactNode; lozengeJar: boolean; log?: boolean; logShadows?: LogShadow[] }> = ({ part, time, f, seller, lozengeJar, log = false, logShadows }) => {
  const pmT = time === "afternoon";
  const ssT = time === "sunset";
  if (part === "set")
    return (
      <g>
        {/* the NEAR big mango tree (Balak sits in its shade) and its surface roots */}
        {[-1, 1].map((sd) =>
          [0, 1].map((j) => (
            <path key={`r${sd}${j}`} d={`M ${F_MANGO.x + sd * 40} ${F_MANGO.y - 4} Q ${F_MANGO.x + sd * (110 + 50 * j)} ${F_MANGO.y + 4 + 8 * j} ${F_MANGO.x + sd * (190 + 90 * j)} ${F_MANGO.y + 14 + 14 * j}`} stroke="#4e3622" strokeWidth={10 - 3 * j} fill="none" strokeLinecap="round" />
          )),
        )}
        <MangoTree x={F_MANGO.x} y={F_MANGO.y} s={F_MANGO.s} f={f} seed={1} />
      </g>
    );
  if (part === "near")
    return (
      <g>
        {/* the sweet stall at the field's right-hand edge, with a bush and banana plants beside it */}
        <BananaPlant x={F_STALL.x + 420} y={F_STALL.y - 40} s={0.95} f={f} seed={801} leaves={7} dead={1} lean={3} suckers={1} />
        <UjancharBush x={F_STALL.x - 420} y={F_STALL.y - 36} w={200} f={f} seed={77} />
        <SweetStall x={F_STALL.x} y={F_STALL.y} s={F_STALL.s} f={f} time={time} seller={seller} lozengeJar={lozengeJar} />
        <BananaPlant x={3460} y={980} s={1.25} f={f} seed={802} leaves={8} dead={2} lean={-3} suckers={1} />
        {log && <FallenLog x={F_LOG.x} y={F_LOG.y} len={F_LOG.len} d={F_LOG.d} time={time} shadows={logShadows} />}
      </g>
    );
  return (
    <g>
      <defs>
        <radialGradient id="vf-shade">
          <stop offset="0" stopColor={P.shadow} stopOpacity={0.34} />
          <stop offset="0.7" stopColor={P.shadow} stopOpacity={0.22} />
          <stop offset="1" stopColor={P.shadow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="vf-sunpool">
          <stop offset="0" stopColor={ssT ? "#ffa44e" : pmT ? "#ffcf8a" : "#f0d29a"} stopOpacity={0.5} />
          <stop offset="1" stopColor={ssT ? "#ffa44e" : pmT ? "#ffcf8a" : "#f0d29a"} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the field: beaten earth with worn grass, sunlit */}
      <path d={`M -1500 ${F_FLOOR_TOP} Q 1200 ${F_FLOOR_TOP - 10} 4000 ${F_FLOOR_TOP} L 4000 1500 L -1500 1500 Z`} fill="#b08a56" />
      {range(14).map((i) => (
        <ellipse key={`gp${i}`} cx={-1300 + i * 390 + 120 * hashS(i * 3.3)} cy={F_FLOOR_TOP + 60 + 380 * hashS(i * 5.1)} rx={220 + 160 * hashS(i * 2.7)} ry={30 + 30 * hashS(i * 4.1)} fill={i % 3 ? "#93954e" : "#a29a58"} opacity={0.5} />
      ))}
      <GrassTufts n={150} x0={-1500} x1={4000} y0={F_FLOOR_TOP + 6} y1={1400} seed={61} scale={1.4} />
      {/* the bare, beaten patch under the near mango where the boys sit, and the path to the stall */}
      <ellipse cx={560} cy={984} rx={460} ry={70} fill="#b88a58" opacity={0.85} />
      <path d={`M 900 1500 Q 1300 1020 1760 ${F_FLOOR_TOP + 6} L 1900 ${F_FLOOR_TOP + 6} Q 1500 1040 1260 1500 Z`} fill="#c09a68" opacity={0.42} />
      <path d={`M 1700 1500 Q 2100 1010 2440 960 L 2820 960 Q 2400 1040 2200 1500 Z`} fill="#c09a68" opacity={0.42} />
      {/* sunlit field in the open */}
      <ellipse cx={ssT ? 1900 : pmT ? 1700 : 1500} cy={960} rx={ssT ? 1300 : 900} ry={90} fill="url(#vf-sunpool)" />
      {/* the near mango's broad shade: Balak's seat is inside it (the dapples are in the light layer) */}
      <ellipse cx={F_MANGO.x + (ssT ? -420 : pmT ? -10 : 150)} cy={968} rx={ssT ? 1100 : pmT ? 820 : 700} ry={ssT ? 84 : 98} fill="url(#vf-shade)" />
      {/* fallen mango leaves and a few pebbles */}
      {range(24).map((i) => {
        const lx = -300 + 1300 * hashS(i * 3.7);
        const ly = 900 + 200 * hashS(i * 6.1);
        return (
          <g key={`lf${i}`} transform={`translate(${f1(lx)}, ${f1(ly)}) rotate(${f1(360 * hashS(i * 2.3))}) scale(1, 0.4)`}>
            <path d="M 0 0 Q 12 -6 26 0 Q 12 6 0 0 Z" fill={i % 3 ? "#8a7a3a" : "#5e6e34"} opacity={0.7} />
          </g>
        );
      })}
      {range(10).map((i) => (
        <ellipse key={`pb${i}`} cx={-200 + i * 380 + 90 * hashS(i * 3)} cy={990 + 160 * hashS(i * 5)} rx={5 + 4 * hashS(i)} ry={3} fill="#8a6a44" opacity={0.6} />
      ))}
      </g>
    );
  return (
    <g>
      <defs>
        <radialGradient id="vf-shade">
          <stop offset="0" stopColor={P.shadow} stopOpacity={0.34} />
          <stop offset="0.7" stopColor={P.shadow} stopOpacity={0.22} />
          <stop offset="1" stopColor={P.shadow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="vf-sunpool">
          <stop offset="0" stopColor={pmT ? "#ffcf8a" : "#f0d29a"} stopOpacity={0.5} />
          <stop offset="1" stopColor={pmT ? "#ffcf8a" : "#f0d29a"} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the field: beaten earth with worn grass, sunlit */}
      <path d={`M -1500 ${F_FLOOR_TOP} Q 1200 ${F_FLOOR_TOP - 10} 4000 ${F_FLOOR_TOP} L 4000 1500 L -1500 1500 Z`} fill="#b08a56" />
      {range(14).map((i) => (
        <ellipse key={`gp${i}`} cx={-1300 + i * 390 + 120 * hashS(i * 3.3)} cy={F_FLOOR_TOP + 60 + 380 * hashS(i * 5.1)} rx={220 + 160 * hashS(i * 2.7)} ry={30 + 30 * hashS(i * 4.1)} fill={i % 3 ? "#93954e" : "#a29a58"} opacity={0.5} />
      ))}
      <GrassTufts n={150} x0={-1500} x1={4000} y0={F_FLOOR_TOP + 6} y1={1400} seed={61} scale={1.4} />
      {/* the bare, beaten patch under the near mango where the boys sit, and the path to the stall */}
      <ellipse cx={560} cy={984} rx={460} ry={70} fill="#b88a58" opacity={0.85} />
      <path d={`M 900 1500 Q 1300 1020 1760 ${F_FLOOR_TOP + 6} L 1900 ${F_FLOOR_TOP + 6} Q 1500 1040 1260 1500 Z`} fill="#c09a68" opacity={0.42} />
      <path d={`M 1700 1500 Q 2100 1010 2440 960 L 2820 960 Q 2400 1040 2200 1500 Z`} fill="#c09a68" opacity={0.42} />
      {/* sunlit field in the open */}
      <ellipse cx={pmT ? 1700 : 1500} cy={960} rx={900} ry={90} fill="url(#vf-sunpool)" />
      {/* the near mango's broad shade: Balak's seat is inside it (the dapples are in the light layer) */}
      <ellipse cx={F_MANGO.x + (pmT ? -10 : 150)} cy={968} rx={pmT ? 820 : 700} ry={98} fill="url(#vf-shade)" />
      {/* fallen mango leaves and a few pebbles */}
      {range(24).map((i) => {
        const lx = -300 + 1300 * hashS(i * 3.7);
        const ly = 900 + 200 * hashS(i * 6.1);
        return (
          <g key={`lf${i}`} transform={`translate(${f1(lx)}, ${f1(ly)}) rotate(${f1(360 * hashS(i * 2.3))}) scale(1, 0.4)`}>
            <path d="M 0 0 Q 12 -6 26 0 Q 12 6 0 0 Z" fill={i % 3 ? "#8a7a3a" : "#5e6e34"} opacity={0.7} />
          </g>
        );
      })}
      {range(10).map((i) => (
        <ellipse key={`pb${i}`} cx={-200 + i * 380 + 90 * hashS(i * 3)} cy={990 + 160 * hashS(i * 5)} rx={5 + 4 * hashS(i)} ry={3} fill="#8a6a44" opacity={0.6} />
      ))}
      {/* the NEAR big mango tree (Balak sits in its shade) */}
      <MangoTree x={F_MANGO.x} y={F_MANGO.y} s={F_MANGO.s} f={f} seed={1} />
      {/* surface roots spreading from the trunk */}
      {[-1, 1].map((sd) =>
        [0, 1].map((j) => (
          <path key={`r${sd}${j}`} d={`M ${F_MANGO.x + sd * 40} ${F_MANGO.y - 4} Q ${F_MANGO.x + sd * (110 + 50 * j)} ${F_MANGO.y + 4 + 8 * j} ${F_MANGO.x + sd * (190 + 90 * j)} ${F_MANGO.y + 14 + 14 * j}`} stroke="#4e3622" strokeWidth={10 - 3 * j} fill="none" strokeLinecap="round" />
        )),
      )}
      {/* the sweet stall at the field's right-hand edge, with a bush and a banana plant beside it */}
      <BananaPlant x={F_STALL.x + 420} y={F_STALL.y - 40} s={0.95} f={f} seed={801} leaves={7} dead={1} lean={3} suckers={1} />
      <UjancharBush x={F_STALL.x - 420} y={F_STALL.y - 36} w={200} f={f} seed={77} />
      <SweetStall x={F_STALL.x} y={F_STALL.y} s={F_STALL.s} f={f} time={time} seller={seller} lozengeJar={lozengeJar} />
      <BananaPlant x={3460} y={980} s={1.25} f={f} seed={802} leaves={8} dead={2} lean={-3} suckers={1} />
    </g>
  );
};

const HouseFloor: React.FC<{ part: Part; time: VillageTime; f: number; doorway?: React.ReactNode; inPocket?: React.ReactNode; shirt: boolean }> = ({ part, time, f, doorway, inPocket, shirt }) => {
  const pmT = time === "afternoon" || time === "sunset";
  const x1 = H.x + H.w * H.s;
  if (part === "set")
    return (
      <g>
      {/* the friend's house: a mud-walled do-chala hut showing its corner (right), door, barred window */}
      <MudHouse x={H.x} y={H.y} w={H.w} s={H.s} f={f} door={H.door} window={H.window} corner posts={H.posts} pots={[150, 186, 760]} broom={440} smoke={false}>
        {doorway}
      </MudHouse>
      {/* the bottle-gourd vine over the thatch (this house's own mark), a gourd hanging at the eave */}
      <GourdVine
        f={f}
        seed={3}
        pts={[
          [x1 + 120, H.y - 200 * H.s],
          [x1 + 40, H.y - 236 * H.s],
          [x1 - 140, H.y - 290 * H.s],
          [x1 - 360, H.y - 330 * H.s],
          [x1 - 560, H.y - 356 * H.s],
          [x1 - 760, H.y - 370 * H.s],
        ]}
        gourd={[x1 - 250, H.y - 216 * H.s]}
      />
      {/* the door step */}
      <path d={`M ${H_STEP.x - H_STEP.half} ${H.y} L ${H_STEP.x - H_STEP.half + 6} ${H_STEP.top} L ${H_STEP.x + H_STEP.half - 6} ${H_STEP.top} L ${H_STEP.x + H_STEP.half} ${H.y} Z`} fill={P.plinthFace} />
      <rect x={H_STEP.x - H_STEP.half + 6} y={H_STEP.top - 3} width={2 * H_STEP.half - 12} height={6} fill={P.plinthTop} />
      <rect x={H_STEP.x - H_STEP.half} y={H.y - 6} width={2 * H_STEP.half} height={6} fill={P.plinthShade} opacity={0.5} />
      {/* a kolshi on the veranda's far end and a broom by the corner */}
      <UjancharKolshi x={H.x + 880 * H.s} y={H_TOP} s={1.1} />
      <UjancharBroom x={x1 + 140} y={H.y - 6} />
      </g>
    );
  if (part === "near")
    return (
      <g>
      {/* the dada's white shirt on its bamboo peg, on the post left of the door */}
      <ShirtOnPeg x={H_SHIRT.x} y={H_SHIRT.y} s={H_SHIRT.s} f={f} inPocket={inPocket} shirt={shirt} />
      {/* the clothes line across the left of the courtyard */}
      <ClothesLine x0={H_LINE.x0} x1={H_LINE.x1} y={H_LINE.y} h={H_LINE.h} f={f} time={time} />
      {/* a tulsi-less courtyard corner: a low bush and a stack of firewood by the right corner */}
      <UjancharBush x={x1 + 380} y={880} w={240} f={f} seed={55} />
      <g>
        {range(7).map((i) => (
          <rect key={i} x={x1 + 200 + i * 14} y={850 - (i % 3) * 10} width={70} height={10} rx={5} fill={i % 2 ? "#7a5634" : "#8e6a40"} transform={`rotate(${-8 + 4 * hashS(i)} ${x1 + 230 + i * 14} 860)`} />
        ))}
      </g>
      </g>
    );
  return (
    <g>
      {/* the friend's courtyard: beaten earth with broom sweeps */}
      <path d="M -1500 862 Q 960 856 3500 862 L 3500 1500 L -1500 1500 Z" fill={P.floor} />
      {[-1100, -620, -200, 380, 900, 1500, 2100, 2700, 3200].map((x, i) => (
        <path key={x} d={`M ${x} ${950 + 34 * (i % 2)} q 90 -18 180 0`} stroke={P.floorSweep} strokeWidth={2} fill="none" opacity={0.35} />
      ))}
      <ellipse cx={pmT ? 1450 : 1250} cy={950} rx={620} ry={66} fill={pmT ? "#f2c482" : "#e7c48a"} opacity={0.32} />
      {/* the house's own shadow on the courtyard (longer to the left in the afternoon) */}
      <path d={`M ${H.x - (pmT ? 120 : 20)} ${H.y} L ${x1 + 180} ${H.y} L ${x1 + 150} ${H.y + (pmT ? 30 : 16)} L ${H.x - (pmT ? 200 : 60)} ${H.y + (pmT ? 34 : 18)} Z`} fill={P.shadow} opacity={0.2} />
    </g>
  );
};

/**
 * The lane's floor (depth 1): ground (verges, the path, the side lane and the cross lane, then `crossing`: figures far
 * ahead); set (huts, the back fences, the side lane's receding fences, plants behind them); near (the haystack, the
 * front verge's bushes and stones).
 */
const LaneFloor: React.FC<{ part: Part; time: VillageTime; f: number; crossing?: React.ReactNode }> = ({ part, time, f, crossing }) => {
  const pmT = time === "afternoon";
  const ssT = time === "sunset";
  const warm = pmT || ssT;
  const kFence = (y: number) => (1.35 * k(y)) / k(L_BACK);
  if (part === "set")
    return (
      <g>
        {/* plants behind the back fences: banana plants, a palm, a bush */}
        <BananaPlant x={-300} y={L_BACK - 26} s={1.0} f={f} seed={811} leaves={8} dead={1} lean={-2} suckers={1} />
        <BananaPlant x={300} y={L_BACK - 30} s={0.9} f={f} seed={812} leaves={7} dead={2} lean={3} />
        <Palm x={560} y={L_BACK - 30} s={2.3} f={f} seed={4} />
        <UjancharBush x={20} y={L_BACK - 24} w={260} f={f} seed={91} flowers={3} />
        <BananaPlant x={2330} y={L_BACK - 26} s={0.95} f={f} seed={813} leaves={7} dead={1} lean={4} suckers={1} />
        <BananaPlant x={3300} y={L_BACK - 24} s={1.05} f={f} seed={814} leaves={8} dead={1} lean={-3} />
        {/* hut A (left), behind the fence: its wall and thatch over the lattice */}
        <MudHouse x={L_HUT_A.x} y={L_HUT_A.y} w={L_HUT_A.w} s={L_HUT_A.s} f={f} door={null} window={300} corner smoke={warm} />
        {/* the back fences along the path, with the gap where the side lane leaves for the friend's house */}
        <FenceAt x0={-1500} x1={L_HUT_A.x + 40} base={L_BACK} k={kFence(L_BACK)} seed={51} />
        <FenceAt x0={L_HUT_A.x + L_HUT_A.w * L_HUT_A.s + 120} x1={L_HUT_B.x - 10} base={L_BACK} k={kFence(L_BACK)} seed={53} />
        <FenceAt x0={L_HUT_B.x + L_HUT_B.w * L_HUT_B.s + 110} x1={L_GAP.x0} base={L_BACK} k={kFence(L_BACK)} seed={57} />
        <FenceAt x0={L_GAP.x1} x1={4200} base={L_BACK} k={kFence(L_BACK)} seed={59} />
        <GatePost x={L_GAP.x0} base={L_BACK + 2} k={kFence(L_BACK) * 1.05} />
        <GatePost x={L_GAP.x1} base={L_BACK + 2} k={kFence(L_BACK) * 1.05} />
        {/* the side lane's fences, receding to the cross lane */}
        <RecedingFence x0={L_GAP.x0} y0={L_BACK} x1={L_MOUTH.x0 - 6} y1={L_MOUTH.y} k0={kFence(L_BACK)} k1={kFence(L_MOUTH.y)} n={6} seed={61} />
        <RecedingFence x0={L_GAP.x1} y0={L_BACK} x1={L_MOUTH.x1 + 6} y1={L_MOUTH.y} k0={kFence(L_BACK)} k1={kFence(L_MOUTH.y)} n={6} seed={67} />
        {/* hut B fronts the path: its mud wall is the lane's edge (door, window, a pot by the door) */}
        <MudHouse x={L_HUT_B.x} y={L_HUT_B.y} w={L_HUT_B.w} s={L_HUT_B.s} f={f} door={400} window={150} corner posts={[40, 270, 520]} pots={[480]} />
        {/* hut C (right), behind the fence */}
        <MudHouse x={L_HUT_C.x} y={L_HUT_C.y} w={L_HUT_C.w} s={L_HUT_C.s} f={f} door={null} window={220} corner={false} />
        <FenceAt x0={L_HUT_C.x - 160} x1={4200} base={L_BACK} k={kFence(L_BACK)} seed={71} />
      </g>
    );
  if (part === "near")
    return (
      <g>
        {/* THE HAYSTACK right on the path's back edge (big enough for a six-year-old to crouch behind) */}
        <Haystack x={L_HAY.x} y={L_HAY.y} s={L_HAY.s} seed={11} />
        {/* loose straw on the path around it */}
        {range(18).map((i) => {
          const sx = L_HAY.x - 240 + 480 * hashS(i * 2.9 + 3);
          const sy = L_HAY.y + 4 + 34 * hashS(i * 4.3 + 1);
          return <line key={`st${i}`} x1={f1(sx)} y1={f1(sy)} x2={f1(sx + 18 * (hashS(i * 7) - 0.4))} y2={f1(sy - 3 + 6 * hashS(i * 5))} stroke={P.thatchStraw} strokeWidth={1.6} opacity={0.7} />;
        })}
        {/* the front verge: a bush or two and stones at the path's near edge */}
        <UjancharBush x={-520} y={L_PATH.bottom + 34} w={240} f={f} seed={93} />
        <UjancharBush x={3560} y={L_PATH.bottom + 30} w={200} f={f} seed={95} flowers={2} />
        {range(9).map((i) => (
          <ellipse key={`sn${i}`} cx={-1100 + i * 560 + 120 * hashS(i * 3 + 2)} cy={L_PATH.bottom + 8 + 10 * hashS(i * 5)} rx={8 + 6 * hashS(i)} ry={4.5} fill="#8a6a44" opacity={0.7} />
        ))}
      </g>
    );
  return (
    <g>
      {/* behind the fences: the compounds' beaten earth (deep, to the floor's top edge) */}
      <path d={`M -1500 ${L_FLOOR_TOP} Q 1400 ${L_FLOOR_TOP - 6} 4200 ${L_FLOOR_TOP} L 4200 1500 L -1500 1500 Z`} fill={P.yard} />
      {/* the cross lane far ahead, and its far verge */}
      <path d={`M -1500 ${L_CROSS.y0} L 4200 ${L_CROSS.y0 - 2} L 4200 ${L_CROSS.y1} L -1500 ${L_CROSS.y1 + 2} Z`} fill="#c09a68" />
      <GrassTufts n={40} x0={2200} x1={3600} y0={L_FLOOR_TOP + 2} y1={L_CROSS.y0 - 2} seed={81} scale={0.6} />
      {/* the back verge under the fences */}
      <path d={`M -1500 ${L_BACK - 14} L 4200 ${L_BACK - 14} L 4200 ${L_PATH.top + 4} L -1500 ${L_PATH.top + 4} Z`} fill="#a08a52" />
      {/* the side lane: from the path up between the receding fences to the cross lane */}
      <path d={`M ${L_GAP.x0 - 30} ${L_PATH.top + 6} Q ${L_GAP.x0 + 90} ${L_BACK - 20} ${L_MOUTH.x0 - 10} ${L_CROSS.y1} L ${L_MOUTH.x1 + 10} ${L_CROSS.y1} Q ${L_GAP.x1 - 90} ${L_BACK - 20} ${L_GAP.x1 + 30} ${L_PATH.top + 6} Z`} fill="#c09a68" />
      <path d={`M ${(L_GAP.x0 + L_GAP.x1) / 2 - 60} ${L_PATH.top} Q ${(L_MOUTH.x0 + L_MOUTH.x1) / 2 - 10} 880 ${(L_MOUTH.x0 + L_MOUTH.x1) / 2} ${L_CROSS.y1}`} stroke="#a8845a" strokeWidth={10} fill="none" opacity={0.35} />
      {/* the path: beaten earth, two worn foot tracks, its grassy edges */}
      <path d={`M -1500 ${L_PATH.top} Q 1300 ${L_PATH.top - 6} 4200 ${L_PATH.top} L 4200 ${L_PATH.bottom} Q 1300 ${L_PATH.bottom + 8} -1500 ${L_PATH.bottom} Z`} fill="#c6a070" />
      {[L_PATH.y - 22, L_PATH.y + 26].map((ty, j) => (
        <path key={`tr${j}`} d={`M -1500 ${ty} Q -200 ${ty - 6} 1200 ${ty + 2} Q 2600 ${ty + 8} 4200 ${ty}`} stroke="#b08a5a" strokeWidth={16} fill="none" opacity={0.35} />
      ))}
      {range(30).map((i) => (
        <ellipse key={`pp${i}`} cx={-1400 + 5500 * hashS(i * 3.7 + 1)} cy={L_PATH.top + 10 + (L_PATH.bottom - L_PATH.top - 20) * hashS(i * 5.3)} rx={3 + 3 * hashS(i)} ry={2} fill="#9a7a4e" opacity={0.6} />
      ))}
      <GrassTufts n={70} x0={-1500} x1={4200} y0={L_BACK - 12} y1={L_PATH.top + 6} seed={83} scale={1.1} />
      {/* the front verge: worn grass */}
      <path d={`M -1500 ${L_PATH.bottom - 2} Q 1300 ${L_PATH.bottom + 6} 4200 ${L_PATH.bottom - 2} L 4200 1500 L -1500 1500 Z`} fill="#a8905a" />
      {range(10).map((i) => (
        <ellipse key={`fv${i}`} cx={-1300 + i * 560 + 140 * hashS(i * 3.3)} cy={L_PATH.bottom + 90 + 260 * hashS(i * 5.1)} rx={220 + 140 * hashS(i * 2.7)} ry={30 + 26 * hashS(i * 4.1)} fill={i % 3 ? "#93954e" : "#a29a58"} opacity={0.5} />
      ))}
      <GrassTufts n={110} x0={-1500} x1={4200} y0={L_PATH.bottom - 4} y1={1400} seed={87} scale={1.4} />
      {/* sunlight on the path; the fences' and huts' shade along its back edge (longer as the sun gets lower) */}
      <ellipse cx={ssT ? 1900 : pmT ? 1600 : 1300} cy={L_PATH.y} rx={1400} ry={60} fill={ssT ? "#ffa44e" : pmT ? "#ffcf8a" : "#f0d29a"} opacity={ssT ? 0.3 : 0.24} />
      <path d={`M -1500 ${L_PATH.top - 2} L 4200 ${L_PATH.top - 2} L 4200 ${L_PATH.top + (ssT ? 40 : pmT ? 26 : 12)} L -1500 ${L_PATH.top + (ssT ? 40 : pmT ? 26 : 12)} Z`} fill={P.shadow} opacity={0.14} />
      {/* the haystack's own shade on the path */}
      <ellipse cx={L_HAY.x - (ssT ? 260 : pmT ? 120 : 20)} cy={L_HAY.y + 12} rx={ssT ? 420 : pmT ? 290 : 230} ry={26} fill={P.shadow} opacity={0.22} />
      {crossing}
    </g>
  );
};

/**
 * The floor plane (depth 1) in three stacked layers: the ground; the big set pieces behind the subjects (the near
 * mango, the friend's house with its `doorway` slot) under a light CAM-11 calm (half the background's); then, untouched,
 * the stall (with `seller`), the shirt (with `inPocket`), the clothes line, `under` and the characters (`children`).
 */
export const VillageFloorLayer: React.FC<VillageFloorProps> = ({ view, time = "lateMorning", f, calm = 1, seller, lozengeJar = true, doorway, inPocket, shirt = true, log = false, logShadows, crossing, under, children }) => {
  const skin = useSetSkin();
  const part = (pp: Part) => {
    const original = partVector(pp);
    // opt-in painted skin (SetSkin.tsx); with no provider the vector part renders as before
    const skinned = skin?.villagePart?.({
      view,
      part: pp,
      time,
      f,
      original,
      seller,
      lozengeJar,
      log,
      logShadows,
      crossing,
      doorway,
      inPocket,
      shirt,
    });
    return skinned !== undefined ? skinned : original;
  };
  const partVector = (pp: Part) =>
    view === "field" ? (
      <FieldFloor part={pp} time={time} f={f} seller={seller} lozengeJar={lozengeJar} log={log} logShadows={logShadows} />
    ) : view === "lane" ? (
      <LaneFloor part={pp} time={time} f={f} crossing={crossing} />
    ) : (
      <HouseFloor part={pp} time={time} f={f} doorway={doorway} inPocket={inPocket} shirt={shirt} />
    );
  const filterTime = time === "sunset" ? "dawn" : "morning";
  return (
    <>
      <Layer depth={1}>{part("ground")}</Layer>
      <div style={{ position: "absolute", inset: 0, filter: ujancharBgFilter(0.5 * calm, filterTime) }}>
        <Layer depth={1}>{part("set")}</Layer>
      </div>
      <Layer depth={1}>
        {part("near")}
        {under}
        {skin?.inkCharacters ? <g filter="url(#ghibli-char-ink)">{children}</g> : children}
      </Layer>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Light (0.95, screen)                                                */
/* ------------------------------------------------------------------ */

/** Dapples under the near mango, soft shafts through its canopy edge, drifting motes; the house: shafts over the veranda. */
export const VillageLightLayer: React.FC<{ view: VillageView; time?: VillageTime; f: number; level?: number; mask?: string }> = ({ view, time = "lateMorning", f, level = 1, mask }) => {
  const ssT = time === "sunset";
  const pmT = time === "afternoon" || ssT;
  const shaftCol = ssT ? ["#ffc890", "#ffaa60", "#ff9a50"] : pmT ? ["#ffe0aa", "#ffc878", "#ffb868"] : ["#fff1c8", "#ffe7a6", "#ffd88a"];
  // shafts: [x where the shaft leaves the canopy / eave, width, phase]
  const shafts: Array<[number, number, number]> =
    view === "field"
      ? [
          [520, 54, 0],
          [660, 80, 1.7],
          [800, 46, 3.1],
          [930, 70, 4.4],
        ]
      : view === "lane"
      ? [
          [700, 60, 0.4],
          [1460, 90, 2.0],
          [2280, 70, 3.4],
          [3020, 64, 4.8],
        ]
      : [
          [1500, 70, 0],
          [1680, 96, 1.9],
          [1860, 60, 3.3],
        ];
  const slant = ssT ? -760 : pmT ? -420 : -140;
  const top = view === "field" ? 300 : view === "lane" ? 160 : 120;
  const bottom = view === "field" ? 1000 : view === "lane" ? 1040 : 960;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", opacity: 0.6 * level, WebkitMaskImage: mask, maskImage: mask }}>
      <Layer depth={0.95}>
        <defs>
          <radialGradient id="vf-fleck">
            <stop offset="0" stopColor={pmT ? "#ffdc9c" : "#ffe8b0"} stopOpacity={0.95} />
            <stop offset="0.6" stopColor={pmT ? "#ffc878" : "#ffd890"} stopOpacity={0.4} />
            <stop offset="1" stopColor="#ffd890" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="vf-shaft" gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={bottom}>
            <stop offset="0" stopColor={shaftCol[0]} stopOpacity={0} />
            <stop offset="0.3" stopColor={shaftCol[1]} stopOpacity={0.75} />
            <stop offset="1" stopColor={shaftCol[2]} stopOpacity={0} />
          </linearGradient>
          <filter id="vf-shaft-blur" x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation={16} />
          </filter>
        </defs>
        <g filter="url(#vf-shaft-blur)" opacity={ssT ? 0.42 : pmT ? 0.38 : 0.3}>
          {shafts.map(([x, w, ph], i) => {
            const xt = x + 18 * Math.sin(f * 0.011 + ph);
            const a = 0.6 + 0.4 * noise1(f * 0.02, 1600 + i);
            return <polygon key={i} points={`${f1(xt - w / 2)},${top} ${f1(xt + w / 2)},${top} ${f1(xt + slant + w * 1.7)},${bottom} ${f1(xt + slant - w * 1.7)},${bottom}`} fill="url(#vf-shaft)" opacity={a} />;
          })}
        </g>
        {view === "field" && (
          <g>
            {/* dapples on the earth under the mango: flattened, coming and going as the leaves move */}
            {range(46).map((i) => {
              const bx = F_MANGO.x - 520 + 1260 * hashS(i * 3.1 + 1) + (pmT ? -120 : 60);
              const by = 900 + 170 * Math.pow(hashS(i * 5.3 + 2), 1.2);
              const o = clamp(0.2 + 0.95 * noise1(f * 0.02 + i * 0.37, 1700 + i));
              if (o < 0.04) return null;
              const r = (16 + 34 * hashS(i * 7.9)) * (0.7 + 0.6 * ((by - 900) / 170));
              return <ellipse key={i} cx={f1(bx + 6 * noise1(f * 0.012, 1800 + i))} cy={f1(by)} rx={f1(r)} ry={f1(r * 0.32)} fill="url(#vf-fleck)" opacity={o * 0.85} />;
            })}
            {/* a few on the trunk */}
            {range(6).map((i) => {
              const o = clamp(0.1 + 0.9 * noise1(f * 0.025 + i * 0.6, 1900 + i));
              if (o < 0.05) return null;
              return <ellipse key={`t${i}`} cx={F_MANGO.x - 10 + 40 * hashS(i * 2.2)} cy={F_MANGO.y - 60 - 300 * hashS(i * 3.4)} rx={9} ry={14} fill="url(#vf-fleck)" opacity={o * 0.6} />;
            })}
          </g>
        )}
        {/* motes drifting in the light */}
        {range(28).map((i) => {
          const period = 240 + 80 * hashS(i * 1.7);
          const ph = pm((f + hashS(i * 4.1) * period) / period);
          const x0 = view === "field" ? 300 + 900 * hashS(i * 7.3) : view === "lane" ? 400 + 2400 * hashS(i * 7.3) : 1100 + 900 * hashS(i * 7.3);
          const x = x0 + 30 * Math.sin(f * 0.013 + i * 2.1) + 30 * ph;
          const y = 460 + 440 * hashS(i * 3.3) - 50 * ph + 6 * noise1(f * 0.015, 2000 + i);
          const o = 0.45 * Math.pow(Math.sin(Math.PI * ph), 1.2);
          return (
            <g key={`m${i}`} opacity={o}>
              <circle cx={f1(x)} cy={f1(y)} r={4} fill="#fff0c4" opacity={0.25} />
              <circle cx={f1(x)} cy={f1(y)} r={1.3} fill="#fff8e2" />
            </g>
          );
        })}
      </Layer>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Foreground (1.35 grass, 1.6 mango leaves)                             */
/* ------------------------------------------------------------------ */

/** Soft out-of-focus mango-leaf sprays hanging into the top-left corner (the near tree), drifting gently. */
const MangoSprays: React.FC<{ f: number }> = ({ f }) => {
  const sprays: Array<[number, number, number, number]> = [
    [-120, -40, 1, 1],
    [300, -70, 1, 2],
    [-420, 10, 1, 3],
  ];
  return (
    <g>
      {sprays.map(([ax, ay, dir, sd]) => {
        const sw = 2 * Math.sin(f * 0.028 + sd) + noise1(f * 0.02, 2100 + sd);
        return (
          <g key={sd} transform={`rotate(${f1(sw)} ${ax} ${ay})`}>
            <path d={`M ${ax} ${ay} Q ${ax + dir * 170} ${ay + 90} ${ax + dir * 360} ${ay + 150}`} stroke="#2e3a1c" strokeWidth={6} fill="none" strokeLinecap="round" />
            {range(12).map((i) => {
              const u = (i + 1) / 13;
              const px = ax + dir * 360 * u;
              const py = ay + 150 * u - 30 * Math.sin(Math.PI * u);
              const side = i % 2 ? 1 : -1;
              const rot = dir * (50 + 34 * side) + 16 * (hashS(sd * 9 + i) - 0.5);
              const len = 90 + 34 * hashS(sd * 5 + i);
              return <path key={i} d={`M 0 0 Q ${f1(len * 0.45)} ${f1(-len * 0.14)} ${f1(len)} 0 Q ${f1(len * 0.45)} ${f1(len * 0.14)} 0 0 Z`} fill={i % 3 ? "#26431f" : "#335a28"} transform={`translate(${f1(px)}, ${f1(py)}) rotate(${f1(rot)})`} />;
            })}
          </g>
        );
      })}
    </g>
  );
};

export const VillageForegroundLayer: React.FC<{ view: VillageView; time?: VillageTime; f: number; grass?: boolean; leaves?: boolean; bokeh?: boolean }> = ({ view, time = "lateMorning", f, grass = true, leaves = false, bokeh = true }) => (
  <>
    {grass && (
      <Layer depth={1.35} extraBlur={2.6}>
        <UjancharForegroundGrass f={f} />
      </Layer>
    )}
    {bokeh && (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen", opacity: 0.5 }}>
        <Layer depth={1.35}>
          <Bokeh f={f} n={10} seed={view === "field" ? 11 : 13} color={time === "sunset" ? "#ffb070" : time === "afternoon" ? "#ffcf8a" : undefined} />
        </Layer>
      </div>
    )}
    {leaves && view === "field" && (
      <Layer depth={1.6} extraBlur={6}>
        <MangoSprays f={f} />
      </Layer>
    )}
  </>
);

/* ------------------------------------------------------------------ */
/* The whole set                                                       */
/* ------------------------------------------------------------------ */

export interface UjancharVillageFieldProps extends VillageBackdropProps, Omit<VillageFloorProps, "children" | "view" | "time" | "f" | "calm"> {
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

/** The whole village-field set for a view and time, in plane order, with optional characters on the floor and the Grade. */
export const UjancharVillageField: React.FC<UjancharVillageFieldProps> = ({
  view,
  time = "lateMorning",
  f,
  cam,
  calm = 1,
  far,
  yard,
  mid,
  seller,
  lozengeJar = true,
  doorway,
  inPocket,
  shirt = true,
  log = false,
  logShadows,
  crossing,
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
    <VillageBackdrop view={view} time={time} f={f} cam={cam} calm={calm} far={far} yard={yard} mid={mid} />
    <VillageFloorLayer view={view} time={time} f={f} calm={calm} seller={seller} lozengeJar={lozengeJar} doorway={doorway} inPocket={inPocket} shirt={shirt} log={log} logShadows={logShadows} crossing={crossing} under={under}>
      {floor}
    </VillageFloorLayer>
    {light && <VillageLightLayer view={view} time={time} f={f} level={lightLevel} mask={lightMask} />}
    {front && <Layer depth={1}>{front}</Layer>}
    {(foreground || leaves) && <VillageForegroundLayer view={view} time={time} f={f} grass={foreground} bokeh={foreground} leaves={leaves} />}
    {grade && <Grade {...villageGrade(time)} />}
  </>
);
