import React, { useId } from "react";
import { clamp, noise1 } from "../core/anim";
import { CLOTH, CLOTH_LIT, CLOTH_SHADE, HAIR, HAIR_HI, INK, SKIN, SKIN_LIT, SKIN_SHADE } from "./thakurRefPalette";
import { ThakurRefArm } from "./ThakurRefArm";
import { THAKUR_HAND_GRIP_NECK, THAKUR_HAND_PINCH_POINT, THAKUR_HAND_PRANAM_PALM_X, ThakurHandType } from "./ThakurRefHands";

/**
 * Precision Coordinate-Traced SVG Rig of Balak Thakur (`01_Thakur_Age06_Child_Ujanchar.jpg`)
 * with full Episode 3 seated gesture animation.
 *
 * Standalone module (does not touch any existing library rig or delivered Episode 1-6 file).
 * Built in normalized 1920x1080 reference coordinates centered on (963, 1000) so `x, y`
 * places Balak's seated mat baseline cleanly at any scale `s` (at `s = 0.235`, matches
 * SeatedChild's exact height in Episode 3).
 *
 * Supported Episode 3 seated poses (16-frame ease-in-out blend with a small anticipation and a soft settle; eyes
 * lead, head follows, arm last; arms blend in joint-angle space so limbs never stretch or shrink mid-move):
 *   - `sitCross`           Exact Reference Plate 01 serene seated posture
 *   - `bowHands`           Divine Namaskar (palms joined at the heart, fingertips near the chin, gentle bow)
 *   - `bless`              Warm Abhaya blessing: his right forearm raised in front of the shoulder, palm out
 *   - `palmRaise`          Gentle open-palm speaking/teaching gesture at chest height
 *   - `pickLeaf`           Leaning a little and reaching down to the flower basket beside him; picks a flower
 *   - `placeFlowerOnFoot`  Picks a shiuli and arcs it down onto his own bare right foot
 *   - `pour`               Holding a small copper ghoti by its neck and pouring water beside him
 */

export type RefTracedPose =
  | "sitCross"
  | "bowHands"
  | "bless"
  | "palmRaise"
  | "pickLeaf"
  | "placeFlowerOnFoot"
  | "pour";

export interface ThakurRefTracedProps {
  /** World X of seated center (baseline). */
  x: number;
  /** World Y of seated mat baseline. */
  y: number;
  /** Uniform scale (1.0 = exact 1920x1080 reference plate size; ~0.235 matches SeatedChild s=1). */
  s?: number;
  /** Horizontal flip (default false). */
  flip?: boolean;
  /** Story clock frame (drives timed poses like placeFlowerOnFoot, pour, and pose transitions). */
  f?: number;
  /** Life clock frame (drives breathing, blinks, and gentle micro-motion during pauses). Default `f`. */
  lifeF?: number;
  /** Current Episode 3 seated pose (default "sitCross"). */
  pose?: RefTracedPose;
  /** Previous pose to smoothly blend from over 16 frames. */
  prevPose?: RefTracedPose;
  /** Story frame when `pose` started. */
  poseStart?: number;
  /** Number of shiuli/tulsi flowers resting on Balak's own bare right foot (0..3). */
  footFlowers?: number;
  /** Lip-sync mouth opening (0 = calm closed-lip smile, 1 = open). */
  mouth?: number;
  /** Override blink (0 = open, 1 = closed). If omitted, blinks naturally every ~3.6s. */
  blink?: number;
  /** Gaze X offset (-1..1). */
  gazeX?: number;
  /** Gaze Y offset (-1..1). */
  gazeY?: number;
  /** Head tilt in degrees. */
  headTilt?: number;
  /** Optional face steering (compatible with SeatedChild `face` prop). */
  face?: { lookX?: number; lookY?: number; eyesDown?: number; smile?: number };
  /** Divine halo intensity (0..1, default 0.55; set 0 when scene draws its own aura). */
  halo?: number;
}


const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIO = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};

/**
 * Gesture timing curve over `dur` frames: a small anticipation (dips a little the other way), the main ease-in-out
 * move, then a gentle overshoot that settles back to exactly 1 at about 1.36 x dur.
 */
const gestureCurve = (t: number, dur: number, antic = 0.055, over = 0.05) => {
  const u = t / dur;
  if (u <= 0) return 0;
  if (u >= 1.36) return 1;
  let v = easeIO(u);
  if (u < 0.22) v -= antic * Math.sin(Math.PI * (u / 0.22));
  if (u > 0.72) v += over * Math.sin(Math.PI * ((u - 0.72) / 0.64));
  return v;
};
/** One in-pose move segment (from frame `t0`, `dur` long) with a soft settle (no anticipation). */
const seg = (t: number, t0: number, dur: number, over = 0.04) => gestureCurve(t - t0, dur, 0, over);

const wrapDeg = (d: number) => {
  let a = d % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
};

function naturalBlink(f: number): number {
  const period = 88;
  const phase = ((f % period) + period) % period;
  if (phase < 78 || phase > 84) return 0;
  const u = (phase - 78) / 6;
  return Math.sin(u * Math.PI);
}

/** Delicate white-and-orange shiuli flower (for held offering & resting on foot). */
const ShiuliFlower: React.FC<{ x: number; y: number; scale?: number; rot?: number }> = ({ x, y, scale = 1, rot = 0 }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${scale.toFixed(2)})`}>
    {/* Tiny green tulsi leaf beside flower */}
    <path d="M -22 4 Q -10 -12 4 0 Q -8 10 -22 4 Z" fill="#4f7a3c" stroke={INK} strokeWidth={1.8} />
    {/* 5 soft white shiuli petals */}
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse
        key={a}
        cx={0}
        cy={-11}
        rx={5.5}
        ry={10}
        fill="#fffaf0"
        stroke={INK}
        strokeWidth={1.6}
        transform={`rotate(${a})`}
      />
    ))}
    {/* Signature bright coral-orange shiuli center */}
    <circle cx={0} cy={0} r={4.8} fill="#e86d2c" stroke={INK} strokeWidth={1.4} />
  </g>
);

/** A held shiuli: a short orange stem in the pinch, the flower head just beyond the fingertips. */
const HeldShiuli: React.FC<{ x: number; y: number; dirDeg: number; scale?: number; twirl?: number }> = ({ x, y, dirDeg, scale = 0.82, twirl = 0 }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(dirDeg + twirl).toFixed(1)})`}>
    <path d="M 0 4 L 0 -14" stroke="#e86d2c" strokeWidth={3.2} strokeLinecap="round" />
    <path d="M 0 4 L 0 -14" stroke={INK} strokeWidth={0.9} strokeLinecap="round" opacity={0.5} />
    <g transform={`translate(0 -22) scale(${scale.toFixed(2)})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-11} rx={5.5} ry={10} fill="#fffaf0" stroke={INK} strokeWidth={1.6} transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={0} r={4.8} fill="#e86d2c" stroke={INK} strokeWidth={1.4} />
    </g>
  </g>
);

const COPPER = "#c97442";
const COPPER_LIT = "#e9a272";
const COPPER_SHADE = "#9a5230";
/** Ghoti neck radius (local units) and the rim point water leaves from when tilted clockwise. */
const GHOTI_NECK_R = 21;
const GHOTI_LIP: [number, number] = [29, -21];

/**
 * Small warm Bengali copper ghoti (lota), drawn with its origin at the CENTRE OF THE NECK (where the hand grips it),
 * mouth up (-y). `angle` tilts it clockwise (mouth toward +x) for pouring. The stream is drawn separately in world
 * space (gravity) by the rig.
 */
const CopperGhoti: React.FC<{ x: number; y: number; angle: number; scale?: number; opacity?: number }> = ({
  x,
  y,
  angle,
  scale = 1,
  opacity = 1,
}) => (
  <g
    transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)}) scale(${scale.toFixed(3)})`}
    opacity={opacity}
  >
    {/* foot ring */}
    <path d="M -19 100 L -16 111 Q 0 114 16 111 L 19 100 Z" fill={COPPER_SHADE} stroke={INK} strokeWidth={2.8} strokeLinejoin="round" />
    {/* neck + round belly */}
    <path
      d="M -24 -18 C -21 -12 -21 -4 -21 4 C -21 10 -25 14 -32 19 C -48 30 -54 48 -51 66 C -47 90 -26 104 0 104 C 26 104 47 90 51 66 C 54 48 48 30 32 19 C 25 14 21 10 21 4 C 21 -4 21 -12 24 -18 Z"
      fill={COPPER}
      stroke={INK}
      strokeWidth={3.0}
      strokeLinejoin="round"
    />
    {/* cel shade on the far side of the belly */}
    <path d="M 22 24 C 44 34 52 54 49 70 C 45 90 26 102 4 103 C 28 92 40 74 38 56 C 37 42 32 32 22 24 Z" fill={COPPER_SHADE} opacity={0.75} />
    {/* sun glint on the near side */}
    <path d="M -38 44 C -44 60 -40 80 -26 92" fill="none" stroke={COPPER_LIT} strokeWidth={6} strokeLinecap="round" opacity={0.8} />
    <path d="M -30 34 C -32 37 -34 40 -35 43" fill="none" stroke="#fde0c0" strokeWidth={3.5} strokeLinecap="round" opacity={0.75} />
    {/* turned bands on the shoulder */}
    <path d="M -32 20 Q 0 30 32 20" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.7} />
    <path d="M -50 56 Q 0 70 50 56" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" opacity={0.55} />
    {/* flared lip and dark mouth */}
    <ellipse cx={0} cy={-20} rx={29} ry={7.5} fill={COPPER_LIT} stroke={INK} strokeWidth={2.8} />
    <ellipse cx={0} cy={-21} rx={20} ry={4} fill="#4a2414" />
  </g>
);

type V2 = [number, number];

interface PoseRig {
  /** Upper body sinks forward by this (bow / reach), px. */
  leanY: number;
  /** Upper body sways sideways (deg, + toward viewer's right), pivoting at the hips. */
  leanRot: number;
  headTiltAdd: number;
  /** Head bows a little lower than the body (nod), px. */
  headDropY: number;
  eyesDownAdd: number;
  /** Where the eyes look (added to the free gaze), -1..1. */
  gazeXAdd: number;
  gazeYAdd: number;
  /** 0 = exact traced lap hands, 1 = articulated gesture hands */
  useArticulatedL: number;
  useArticulatedR: number;
  // Viewer's left arm (Balak's right hand — primary gesture hand!)
  lSh: V2;
  lEl: V2;
  lWr: V2;
  lRot: number;
  lType: ThakurHandType;
  // Viewer's right arm (Balak's left hand)
  rSh: V2;
  rEl: V2;
  rWr: V2;
  rRot: number;
  rType: ThakurHandType;
  /** 1 = the right wrist is planted in world space (on the foot / at the basket): it does not ride the breath. */
  plantR: number;
  holdingFlower: number;
  holdingGhoti: number;
  /** 1 = the ghoti still stands on the mat (root coords GHOTI_MAT_NECK), not yet in the hand. */
  ghotiOnMat: number;
  pourT: number;
  /** Frames since the stream started (stream front falls to the ground over ~6 frames). */
  flowT: number;
}

/** Mirror x about the body centre (963): viewer's left arm <-> viewer's right arm. */
const MX = (p: V2): V2 => [1926 - p[0], p[1]];
const lerpV = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** Shoulders: inside the chadar near its outer edge, at a six-year-old's shoulder height. */
const SH_L: V2 = [822, 486];
const SH_R: V2 = MX(SH_L);

/**
 * Binding arm proportions (measured from the approved traced lap arm, rig units at s = 1): upper arm 230, forearm
 * 150. A pose may only look shorter by pointing a segment toward the camera (foreshortening factor < 1).
 */
const UA = 230;
const FA = 150;

/**
 * 2-bone IK: the elbow for a shoulder + wrist target with segment lengths U, F, on the side nearest the `pole`
 * (outward / downward). An out-of-reach target pulls the wrist in along the reach line (never stretches the arm).
 */
function ik(sh: V2, wrTarget: V2, U: number, F: number, pole: V2): { el: V2; wr: V2 } {
  const dx = wrTarget[0] - sh[0];
  const dy = wrTarget[1] - sh[1];
  const d0 = Math.max(1e-3, Math.hypot(dx, dy));
  const ux = dx / d0;
  const uy = dy / d0;
  const d = clamp(d0, Math.abs(U - F) + 0.5, U + F - 0.5);
  const wr: V2 = d === d0 ? wrTarget : [sh[0] + ux * d, sh[1] + uy * d];
  const a = (U * U - F * F + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, U * U - a * a));
  const bx = sh[0] + ux * a;
  const by = sh[1] + uy * a;
  const e1: V2 = [bx - uy * h, by + ux * h];
  const e2: V2 = [bx + uy * h, by - ux * h];
  const d1 = Math.hypot(e1[0] - pole[0], e1[1] - pole[1]);
  const d2 = Math.hypot(e2[0] - pole[0], e2[1] - pole[1]);
  return { el: d1 <= d2 ? e1 : e2, wr };
}

/** Wrist position that puts a hand anchor (wrist-local, unmirrored hand coords) at `target` for hand rotation `rot`. */
function wristForAnchor(target: V2, rot: number, isR: boolean, anchor: V2): V2 {
  const r = (rot * Math.PI) / 180;
  const xm = anchor[0] * (isR ? -1 : 1);
  return [target[0] - (xm * Math.cos(r) - anchor[1] * Math.sin(r)), target[1] - (xm * Math.sin(r) + anchor[1] * Math.cos(r))];
}

/** Arm from a shoulder, a wrist target, foreshortening factors and an elbow pole: the PoseRig fields for one side. */
function armIK(sh: V2, wrTarget: V2, pole: V2, fu = 1, ff = 1): { sh: V2; el: V2; wr: V2 } {
  const r = ik(sh, wrTarget, UA * fu, FA * ff, pole);
  return { sh, el: r.el, wr: r.wr };
}

/** Frames for an arm's return to the traced lap pose. */
const RET_DUR = 9;

/** Where the ghoti's neck stands on the mat beside his left knee (root coords) and when his hand closes on it. */
const GHOTI_MAT_NECK: V2 = [1286, 876];
const GHOTI_GRIP_T = 20;
/** A root-space point -> upper-body space for a pose's own lean (breath excluded). */
function poseBody(p: V2, leanY: number, leanRot: number): V2 {
  const a = (-leanRot * Math.PI) / 180;
  const qx = p[0] - 963;
  const qy = p[1] - leanY - 900;
  return [963 + qx * Math.cos(a) - qy * Math.sin(a), 900 + qx * Math.sin(a) + qy * Math.cos(a)];
}

/** Articulated stand-in for the traced lap arm (used only around the lap-hand swap). */
const REST_L = armIK([822, 494], [874, 866], [740, 700]);
// Two pranam hands meet with their wrists THAKUR_HAND_PRANAM_PALM_X * 2 * cos(tilt) apart.
const BOW_TILT = 9;
const BOW_L = armIK([828, 490], [963 - THAKUR_HAND_PRANAM_PALM_X * Math.cos((BOW_TILT * Math.PI) / 180), 552], [770, 660], 0.6, 1);
const BLESS_L = armIK([820, 484], [852, 490], [785, 640], 0.65, 1);
/** Teaching palm hand shape (switch to the hands module's "teach" shape once it exists). */
const TEACH_HAND: ThakurHandType = "teach";

function poseRigFor(pose: RefTracedPose, t: number, mouth: number, lf: number): PoseRig {
  // The articulated "rest" approximates the traced lap arm, so the swap between the traced lap hand and the
  // articulated arm happens where the two nearly coincide.
  const rest: PoseRig = {
    leanY: 0,
    leanRot: 0,
    headTiltAdd: 0,
    headDropY: 0,
    eyesDownAdd: 0,
    gazeXAdd: 0,
    gazeYAdd: 0,
    useArticulatedL: 0,
    useArticulatedR: 0,
    lSh: REST_L.sh,
    lEl: REST_L.el,
    lWr: REST_L.wr,
    lRot: 136,
    lType: "relaxed",
    rSh: MX(REST_L.sh),
    rEl: MX(REST_L.el),
    rWr: MX(REST_L.wr),
    rRot: -136,
    rType: "relaxed",
    plantR: 0,
    holdingFlower: 0,
    holdingGhoti: 0,
    ghotiOnMat: 0,
    pourT: 0,
    flowT: 0,
  };

  if (pose === "sitCross") return rest;

  if (pose === "bowHands") {
    // Namaskar: palms joined at the heart, fingertips near the chin line, elbows out and down; the upper arms come
    // forward (foreshortened), the forearms stay full length.
    const press = Math.sin(lf * 0.06) * 1.4;
    const sway = noise1(lf * 0.03, 71) * 0.8;
    return {
      ...rest,
      leanY: 12,
      headTiltAdd: 1.5,
      headDropY: 9,
      eyesDownAdd: 0.62,
      useArticulatedL: 1,
      useArticulatedR: 1,
      lSh: BOW_L.sh,
      lEl: BOW_L.el,
      lWr: [BOW_L.wr[0] + sway, BOW_L.wr[1] + press],
      lRot: BOW_TILT,
      lType: "pranam",
      rSh: MX(BOW_L.sh),
      rEl: MX(BOW_L.el),
      rWr: [MX(BOW_L.wr)[0] + sway, BOW_L.wr[1] + press],
      rRot: -BOW_TILT,
      rType: "pranam",
    };
  }

  if (pose === "bless") {
    // Abhaya: his right forearm near-vertical in front of the shoulder, palm out at shoulder-to-chin height.
    // The wrist stays put (the forearm is folded up over the upper arm); life is in the hand and the sleeve.
    return {
      ...rest,
      leanY: -2,
      headTiltAdd: -2.0,
      eyesDownAdd: 0.08,
      useArticulatedL: 1,
      useArticulatedR: 0,
      lSh: BLESS_L.sh,
      lEl: BLESS_L.el,
      lWr: BLESS_L.wr,
      lRot: 3 + Math.sin(lf * 0.043 + 1) * 1.8 - mouth * 2,
      lType: "open",
    };
  }

  if (pose === "palmRaise") {
    // Teaching: a smaller, lower open palm at chest height, offered toward the listener.
    const talk = 0.3 + 0.7 * clamp(mouth, 0, 1);
    const speakLift = Math.sin(lf * 0.22) * 5 * talk;
    const arm = armIK([822, 488], [866, 630 - speakLift], [770, 740], 1, 0.87);
    return {
      ...rest,
      leanY: 3,
      headTiltAdd: -2.6,
      eyesDownAdd: 0,
      gazeXAdd: -0.12,
      useArticulatedL: 1,
      useArticulatedR: 0,
      lSh: arm.sh,
      lEl: arm.el,
      lWr: arm.wr,
      lRot: 26 + Math.sin(lf * 0.11) * 4 * talk,
      lType: TEACH_HAND,
    };
  }

  // Basket beside his left knee (viewer's right): where the pinch (thumb + index) picks, and the outward elbow pole.
  const BASKET_PINCH: V2 = [1338, 896];
  const BASKET_ROT = 150;
  const R_POLE: V2 = [1236, 740];
  const POUR_POLE: V2 = [1150, 760];
  const pinchWrist = (target: V2, rot: number) => wristForAnchor(target, rot, true, THAKUR_HAND_PINCH_POINT);

  if (pose === "pickLeaf") {
    // Reach down and out to the basket (the pose blend carries the arm there), pinch a flower, lift it a little.
    const pick = seg(t, 20, 6, 0);
    const lift = seg(t, 27, 18);
    const dip = Math.sin(Math.PI * clamp((t - 20) / 7, 0, 1)) * 7;
    const hold = clamp((t - 40) / 12, 0, 1);
    const rot = lerp(BASKET_ROT, 136, lift) + pick * 6 + hold * Math.sin(lf * 0.09) * 3;
    const target: V2 = [lerp(BASKET_PINCH[0], 1292, lift) + hold * Math.sin(lf * 0.05) * 1.5, lerp(BASKET_PINCH[1], 846, lift) + dip + hold * Math.sin(lf * 0.07 + 2) * 1.8];
    const arm = armIK([1110, 494], pinchWrist(target, rot), R_POLE);
    return {
      ...rest,
      leanY: 14,
      leanRot: 2.2,
      headTiltAdd: 3.2,
      eyesDownAdd: 0.35,
      gazeXAdd: lerp(0.8, 0.62, lift),
      gazeYAdd: lerp(0.55, 0.4, lift),
      useArticulatedL: 0,
      useArticulatedR: 1,
      rSh: arm.sh,
      rEl: arm.el,
      rWr: arm.wr,
      rRot: rot,
      rType: "pinch",
      plantR: 1,
      holdingFlower: t >= 23 ? 1 : 0,
    };
  }

  if (pose === "placeFlowerOnFoot") {
    // Basket -> pinch -> lift in a soft arc -> lower slowly and place the shiuli on his bare right foot -> rest.
    const pick = Math.sin(Math.PI * clamp((t - 12) / 7, 0, 1)) * 6;
    const p2 = seg(t, 17, 20, 0.02);
    const p3 = seg(t, 37, 21, 0.03);
    const release = seg(t, 58, 8, 0);
    // Pinch targets: basket -> above the knee -> the shiuli spot on his bare right foot -> a little above it.
    const MID_PINCH: V2 = [1222, 846];
    const FOOT_PINCH: V2 = [1096, 938];
    const AFTER_PINCH: V2 = [1108, 920];
    let target: V2;
    let rot: number;
    if (t < 37) {
      target = lerpV(BASKET_PINCH, MID_PINCH, p2);
      target = [target[0], target[1] - Math.sin(Math.PI * clamp(p2, 0, 1)) * 26 + pick];
      rot = lerp(BASKET_ROT, 178, p2);
    } else {
      target = lerpV(lerpV(MID_PINCH, FOOT_PINCH, p3), AFTER_PINCH, release);
      rot = lerp(178, 200, p3) - release * 6;
    }
    const life = clamp((t - 60) / 12, 0, 1);
    rot += life * Math.sin(lf * 0.06) * 1.5;
    target = [target[0] + life * Math.sin(lf * 0.05) * 1.2, target[1] + life * Math.sin(lf * 0.07 + 1) * 1.4];
    const arm = armIK([1108, 494], pinchWrist(target, rot), R_POLE);
    // Eyes: on the basket, then follow the flower down to the foot.
    const toFoot = clamp((t - 22) / 22, 0, 1);
    return {
      ...rest,
      leanY: 12 + 8 * easeIO(t / 40),
      leanRot: lerp(2.0, 0.9, easeIO((t - 18) / 24)),
      headTiltAdd: lerp(3.2, 2.2, toFoot),
      headDropY: 6 * easeIO((t - 30) / 20),
      eyesDownAdd: lerp(0.4, 0.7, toFoot),
      gazeXAdd: lerp(0.8, 0.35, toFoot),
      gazeYAdd: lerp(0.5, 0.95, toFoot),
      useArticulatedL: 0,
      useArticulatedR: 1,
      rSh: arm.sh,
      rEl: arm.el,
      rWr: arm.wr,
      rRot: rot,
      rType: "pinch",
      plantR: 1,
      holdingFlower: t > 15 && t < 58 ? 1 : 0,
    };
  }

  // `pour`: the ghoti held firmly by its neck in his left hand; the wrist rolls to tilt it and the water falls beside
  // his knee (viewer's right).
  // The ghoti stands on the mat beside his knee from the start of the beat; he leans, reaches, closes his hand on
  // its neck (frame GHOTI_GRIP_T), lifts it in a small arc and rolls the wrist to pour.
  const lift = seg(t, GHOTI_GRIP_T, 14, 0.05);
  const pourT = clamp(seg(t, GHOTI_GRIP_T + 8, 16, 0.05), 0, 1.05);
  const steady = clamp((t - (GHOTI_GRIP_T + 20)) / 12, 0, 1);
  const tilt = 6 * clamp(lift, 0, 1) + 56 * pourT + steady * Math.sin(lf * 0.09) * 1.5;
  const leanRot = lerp(3.6, 1.1, clamp(lift, 0, 1));
  const leanY = lerp(20, 12, clamp(lift, 0, 1));
  const matWr = poseBody(wristForAnchor(GHOTI_MAT_NECK, 90, true, THAKUR_HAND_GRIP_NECK.center), leanY, leanRot);
  const pourWr: V2 = [1282 + steady * Math.sin(lf * 0.05) * 1.2, 744 - 10 * (1 - pourT) + steady * Math.sin(lf * 0.07) * 1.5];
  const wrT = lerpV(matWr, pourWr, lift);
  const arm = armIK([1108, 490], [wrT[0], wrT[1] - Math.sin(Math.PI * clamp(lift, 0, 1)) * 18], lerpV(R_POLE, POUR_POLE, clamp(lift, 0, 1)));
  return {
    ...rest,
    leanY,
    leanRot,
    headTiltAdd: lerp(3.4, 2.6, clamp(lift, 0, 1)),
    eyesDownAdd: lerp(0.6, 0.42, clamp(lift, 0, 1)),
    gazeXAdd: 0.72,
    gazeYAdd: lerp(0.9, 0.7, clamp(lift, 0, 1)),
    useArticulatedL: 0,
    useArticulatedR: 1,
    rSh: arm.sh,
    rEl: arm.el,
    rWr: arm.wr,
    rRot: 90 + tilt,
    rType: "grip",
    plantR: 0,
    holdingGhoti: t >= GHOTI_GRIP_T ? 1 : 0,
    ghotiOnMat: t < GHOTI_GRIP_T ? 1 : 0,
    pourT,
    flowT: t - (GHOTI_GRIP_T + 17),
  };
}

/** One arm in joint-angle form (viewer's-left frame; the right arm is mirrored in), so blends keep limb lengths. */
interface ArmPolar {
  sh: V2;
  a1: number;
  U: number;
  a2: number;
  F: number;
  flex: number;
}
function toPolar(sh: V2, el: V2, wr: V2, rot: number, isR: boolean): ArmPolar {
  const s = isR ? MX(sh) : sh;
  const e = isR ? MX(el) : el;
  const w = isR ? MX(wr) : wr;
  const r = isR ? -rot : rot;
  const a1 = Math.atan2(e[1] - s[1], e[0] - s[0]);
  const a2 = Math.atan2(w[1] - e[1], w[0] - e[0]);
  return {
    sh: s,
    a1,
    U: Math.hypot(e[0] - s[0], e[1] - s[1]),
    a2,
    F: Math.hypot(w[0] - e[0], w[1] - e[1]),
    flex: wrapDeg(r - ((a2 * 180) / Math.PI + 90)),
  };
}
/** Per-joint blend weights: the upper arm leads, the forearm follows, the hand trails (follow-through). */
interface ArmK {
  u: number;
  f: number;
  h: number;
}
const polarWrist = (a: ArmPolar): V2 => {
  const e: V2 = [a.sh[0] + Math.cos(a.a1) * a.U, a.sh[1] + Math.sin(a.a1) * a.U];
  return [e[0] + Math.cos(a.a2) * a.F, e[1] + Math.sin(a.a2) * a.F];
};
function blendArm(p: ArmPolar, c: ArmPolar, kk: number | ArmK, isR: boolean): { sh: V2; el: V2; wr: V2; rot: number } {
  const k: ArmK = typeof kk === "number" ? { u: kk, f: kk, h: kk } : kk;
  const sh = lerpV(p.sh, c.sh, k.u);
  const a1 = lerp(p.a1, c.a1, k.u);
  const a2 = lerp(p.a2, c.a2, k.f);
  // A big forearm turn (e.g. lap -> raised) swings through depth: the arm comes toward the camera mid-move, so the
  // forearm and upper arm read shorter there and the wrist travels on a compact arc instead of lying flat.
  const depth = clamp((Math.abs(c.a2 - p.a2) - 0.45) / 1.1, 0, 1) * 0.42;
  const U = Math.max(10, lerp(p.U, c.U, k.u) * (1 - depth * 0.35 * Math.sin(Math.PI * clamp(k.u, 0, 1))));
  const F = Math.max(10, lerp(p.F, c.F, k.f) * (1 - depth * Math.sin(Math.PI * clamp(k.f, 0, 1))));
  let el: V2 = [sh[0] + Math.cos(a1) * U, sh[1] + Math.sin(a1) * U];
  let wr: V2 = [el[0] + Math.cos(a2) * F, el[1] + Math.sin(a2) * F];
  // The wrist travels on an arc that bulges outward (away from the body midline) mid-move, and never comes further
  // in than either end pose: the two hands stay apart and never cross or overlap on the way.
  const pw = polarWrist(p);
  const cw = polarWrist(c);
  const bump = Math.sin(Math.PI * clamp(k.f, 0, 1));
  const travel = clamp(Math.hypot(cw[0] - pw[0], cw[1] - pw[1]) / 160, 0, 1);
  const xMax = Math.max(pw[0], cw[0]) + 2 - 46 * bump * travel;
  const xArc = wr[0] - 40 * bump * travel;
  const xNew = Math.min(xArc, xMax);
  // Rising moves lift the wrist early (up first, then in), so the forearm stays angled rather than lying flat.
  const rise = clamp((pw[1] - cw[1]) / 220, 0, 1);
  const early = Math.sin(Math.PI * Math.pow(clamp(k.f, 0, 1), 0.65));
  const yNew = wr[1] - 48 * rise * early;
  if (xNew !== wr[0] || yNew !== wr[1]) {
    wr = [xNew, yNew];
    el = ik(sh, wr, U, F, el).el;
  }
  const fa = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  const rot = (fa * 180) / Math.PI + 90 + lerp(p.flex, c.flex, k.h);
  return isR ? { sh: MX(sh), el: MX(el), wr: MX(wr), rot: -rot } : { sh, el, wr, rot };
}

/** A point in the gesture hand's wrist-local frame (unmirrored hand coords) -> body coords. */
const handPt = (wr: V2, rot: number, isR: boolean, p: V2): V2 => {
  const r = (rot * Math.PI) / 180;
  const xm = p[0] * (isR ? -1 : 1);
  return [wr[0] + xm * Math.cos(r) - p[1] * Math.sin(r), wr[1] + xm * Math.sin(r) + p[1] * Math.cos(r)];
};

export const ThakurRefTraced: React.FC<ThakurRefTracedProps> = ({
  x,
  y,
  s = 1,
  flip = false,
  f = 0,
  lifeF,
  pose = "sitCross",
  prevPose,
  poseStart = 0,
  footFlowers = 0,
  mouth = 0,
  blink,
  gazeX,
  gazeY,
  headTilt = 0,
  face,
  halo = 0.55,
}) => {
  const uid = "trt" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const lf = lifeF ?? f;

  // Pose transition: eyes lead (fast), the head follows, the body and arm move last with a small anticipation and a
  // gentle overshoot / settle (MOT-13).
  const poseT = Math.max(0, f - poseStart);
  const blending = !!prevPose && prevPose !== pose;
  const curRig = poseRigFor(pose, poseT, mouth, lf);
  const prevRig = blending ? poseRigFor(prevPose!, 1e4, mouth, lf) : curRig;
  const blend = blending ? gestureCurve(poseT - 1, 16) : 1; // arm + body
  const headBlend = blending ? gestureCurve(poseT - 1, 14, 0.04, 0.06) : 1;
  const eyeBlend = blending ? easeIO(poseT / 7) : 1;
  const swapT = blending ? easeIO(poseT / 16) : 1; // monotonic, for the lap-hand <-> articulated swap
  // The eyes look where the gesture is going a few frames ahead.
  const eyeRig = blending || poseT < 80 ? poseRigFor(pose, poseT + 6, mouth, lf) : curRig;

  const useArtLFor = (p: PoseRig, c: PoseRig) => p.useArticulatedL > 0.5 || c.useArticulatedL > 0.5;
  const useArtRFor = (p: PoseRig, c: PoseRig) => p.useArticulatedR > 0.5 || c.useArticulatedR > 0.5;
  const leanY = lerp(prevRig.leanY, curRig.leanY, blend);
  const leanRot = lerp(prevRig.leanRot, curRig.leanRot, blend);
  const headDropY = lerp(prevRig.headDropY, curRig.headDropY, headBlend);
  // Returning to the lap: swap to the traced lap hand as soon as the quick return has landed.
  const artFor = (p: number, c: number) => (p === c ? c : c > p ? (swapT > 0.06 ? c : p) : poseT >= RET_DUR + 2 ? c : p);
  const useArtL = artFor(prevRig.useArticulatedL, curRig.useArticulatedL);
  const useArtR = artFor(prevRig.useArticulatedR, curRig.useArticulatedR);
  // Leaving the lap the hand keeps the soft lap shape ("relaxed") until the move is well under way.
  const typeFor = (pT: ThakurHandType, cT: ThakurHandType, pArt: number) =>
    !blending ? cT : pArt < 0.5 ? (swapT > 0.6 ? cT : "relaxed") : swapT > 0.5 ? cT : pT;
  const lType = typeFor(prevRig.lType, curRig.lType, prevRig.useArticulatedL);
  const rType = typeFor(prevRig.rType, curRig.rType, prevRig.useArticulatedR);

  // Gentle organic life (24 fps)
  const breath = Math.sin(lf * 0.085) * 2.2 + noise1(lf * 0.04, 11) * 0.7;
  const headBreathY = Math.sin((lf - 4) * 0.085) * 1.4;

  // Upper-body transform (translate after a small sideways sway about the hips) and its inverse for planted hands.
  const bodyTy = leanY - breath;
  const leanRad = (leanRot * Math.PI) / 180;
  const PIV: V2 = [963, 900];
  const toBody = (p: V2): V2 => {
    const qx = p[0] - PIV[0];
    const qy = p[1] - bodyTy - PIV[1];
    const c = Math.cos(-leanRad);
    const sn = Math.sin(-leanRad);
    return [PIV[0] + qx * c - qy * sn, PIV[1] + qx * sn + qy * c];
  };
  const toRoot = (p: V2): V2 => {
    const qx = p[0] - PIV[0];
    const qy = p[1] - PIV[1];
    const c = Math.cos(leanRad);
    const sn = Math.sin(leanRad);
    return [PIV[0] + qx * c - qy * sn, PIV[1] + qx * sn + qy * c + bodyTy];
  };

  /** Both arms at a given story / life frame (no planting): used for the pose and for the sleeve's follow-through. */
  const armsAt = (fq: number, lq: number) => {
    const tq = Math.max(0, fq - poseStart);
    const c = poseRigFor(pose, tq, mouth, lq);
    const p = blending ? poseRigFor(prevPose!, 1e4, mouth, lq) : c;
    const kFor = (toLap: boolean): ArmK => {
      if (!blending) return { u: 1, f: 1, h: 1 };
      // An arm going back to the lap settles quickly (RET_DUR) so it is never seen lying across the belly.
      const d = toLap ? RET_DUR : 16;
      return { u: gestureCurve(tq + 1, d), f: gestureCurve(tq - 1.5, d), h: gestureCurve(tq - 3.5, d) };
    };
    const kL = kFor(p.useArticulatedL > 0.5 && c.useArticulatedL < 0.5);
    const kR = kFor(p.useArticulatedR > 0.5 && c.useArticulatedR < 0.5);
    return {
      L: blendArm(toPolar(p.lSh, p.lEl, p.lWr, p.lRot, false), toPolar(c.lSh, c.lEl, c.lWr, c.lRot, false), kL, false),
      R: blendArm(toPolar(p.rSh, p.rEl, p.rWr, p.rRot, true), toPolar(c.rSh, c.rEl, c.rWr, c.rRot, true), kR, true),
    };
  };
  const armsNow = armsAt(f, lf);
  const armL = armsNow.L;
  let armR = armsNow.R;
  // Sleeve follow-through: a damped spring driven by the elbow's sideways velocity (cloth lags, swings past, settles),
  // plus a faint breath of air in holds.
  let swayL = Math.sin(lf * 0.05 + 0.7) * 1.1;
  let swayR = Math.sin(lf * 0.05 + 2.1) * 1.1;
  if (useArtLFor(prevRig, curRig) || useArtRFor(prevRig, curRig)) {
    const hist: Array<{ L: number; R: number }> = [];
    for (let k = 0; k <= 13; k++) {
      const a = k === 0 ? armsNow : armsAt(f - k, lf - k);
      hist.push({ L: (a.L.el[0] * 2 + a.L.wr[0]) / 3, R: (a.R.el[0] * 2 + a.R.wr[0]) / 3 });
    }
    for (let k = 0; k < 13; k++) {
      const w = Math.exp(-k / 4.5) * Math.cos(k * 0.42) * 0.55;
      swayL -= (hist[k].L - hist[k + 1].L) * w;
      swayR -= (hist[k].R - hist[k + 1].R) * w;
    }
    swayL = clamp(swayL, -16, 16);
    swayR = clamp(swayR, -16, 16);
  }
  // Planted right hand: keep the wrist fixed in the world while the body breathes and leans.
  const plant = clamp(lerp(prevRig.plantR, curRig.plantR, clamp(blend, 0, 1)), 0, 1);
  if (plant > 0.001) {
    const tw = toBody(armR.wr);
    const dx = (tw[0] - armR.wr[0]) * plant;
    const dy = (tw[1] - armR.wr[1]) * plant;
    armR = { ...armR, wr: [armR.wr[0] + dx, armR.wr[1] + dy], el: [armR.el[0] + dx * 0.5, armR.el[1] + dy * 0.5] };
  }

  // Props follow the hand that holds them (always the viewer's-right arm in the current poses).
  const propK = blending ? clamp(poseT / 6, 0, 1) : 1;
  const flowerOn = (blending && swapT < 0.5 ? prevRig.holdingFlower : curRig.holdingFlower) > 0.5 && useArtR > 0.5 && rType === "pinch";
  // The ghoti fades in once the hand is nearly in place (so it never appears upside-down mid-swing) and out quickly.
  // Picked up from the mat (no fade in); when leaving `pour` it is let go quickly.
  const ghotiOnMat = curRig.ghotiOnMat > 0.5;
  const ghotiOp =
    useArtR > 0.5 && curRig.holdingGhoti > 0.5 ? 1 : useArtR > 0.5 && prevRig.holdingGhoti > 0.5 && blending ? 1 - propK : 0;
  const gripPt = handPt(armR.wr, armR.rot, true, THAKUR_HAND_GRIP_NECK.center);
  const ghotiAngle = armR.rot - 90;
  const ghotiScale = (THAKUR_HAND_GRIP_NECK.diameter * 0.9) / (2 * GHOTI_NECK_R);
  const pinchPt = handPt(armR.wr, armR.rot, true, THAKUR_HAND_PINCH_POINT);
  // Pouring stream (world space, falls with gravity from the lowered lip).
  const tiltNow = wrapDeg(ghotiAngle);
  const flowFrontRaw = curRig.holdingGhoti > 0.5 ? clamp(curRig.flowT / 6, 0, 1) : 1;
  const flowAmt = flowFrontRaw > 0 ? ghotiOp * clamp((tiltNow - 30) / 14, 0, 1) : 0;
  const flowFront = flowFrontRaw;
  const lipBody: V2 = (() => {
    const r = (ghotiAngle * Math.PI) / 180;
    const lx = GHOTI_LIP[0] * ghotiScale;
    const ly = GHOTI_LIP[1] * ghotiScale;
    return [gripPt[0] + lx * Math.cos(r) - ly * Math.sin(r), gripPt[1] + lx * Math.sin(r) + ly * Math.cos(r)];
  })();
  const lip = toRoot(lipBody);

  const tilt =
    headTilt +
    lerp(prevRig.headTiltAdd, curRig.headTiltAdd, headBlend) +
    Math.sin(lf * 0.032) * 0.75 +
    noise1(lf * 0.025, 29) * 0.5 +
    leanRot * 0.6;
  const kBlink = clamp(blink ?? naturalBlink(lf), 0, 1);
  const eyesDown = clamp((face?.eyesDown ?? 0) + lerp(prevRig.eyesDownAdd, eyeRig.eyesDownAdd, eyeBlend), 0, 1);
  const poseGazeX = lerp(prevRig.gazeXAdd, eyeRig.gazeXAdd, eyeBlend);
  const poseGazeY = lerp(prevRig.gazeYAdd, eyeRig.gazeYAdd, eyeBlend);
  const rawGazeX = gazeX ?? (face?.lookX !== undefined ? face.lookX * 0.75 : noise1(lf * 0.04, 53) * 0.35) + poseGazeX;
  const rawGazeY = gazeY ?? ((face?.lookY ?? 0) * 0.6 + eyesDown * 0.85) + poseGazeY;
  const gx = clamp(rawGazeX, -1, 1) * 3.2;
  const gy = clamp(rawGazeY, -1, 1) * 2.4;
  const mOpen = clamp(mouth, 0, 1);
  const fl = flip ? -1 : 1;
  // Head rides the body's sideways sway (rotation about the hips) plus its own bow.
  const headX = 963 + 500 * Math.sin(leanRad);
  const headY = 400 + leanY - headBreathY + headDropY + 500 * (1 - Math.cos(leanRad));

  // Eye renderer (exact traced soulful open child lids + blink clip + warm iris & dual catchlights)
  const renderEye = (side: "L" | "R") => {
    const isL = side === "L";
    const cx = isL ? 912 : 1015;
    const cy = 278;
    const ox = isL ? 885 : 1042;
    const ix = isL ? 936 : 990;
    const lidRest = eyesDown * 5.5;
    const lidTopY = 249 + lidRest + kBlink * (29 - lidRest);
    const lidBotY = 303 - kBlink * 24;
    const upperD = `M ${ox} 279 Q ${cx} ${lidTopY.toFixed(1)} ${ix} 279`;
    const lowerD = `Q ${cx} ${lidBotY.toFixed(1)} ${ox} 279 Z`;
    const clipId = `${uid}-eye-${side}`;
    const creaseY = 244 + lidRest * 0.6 + kBlink * 18;

    return (
      <g key={side}>
        <defs>
          <clipPath id={clipId}>
            <path d={`${upperD} ${lowerD}`} />
          </clipPath>
        </defs>

        {kBlink < 0.94 && <path d={`${upperD} ${lowerD}`} fill="#fdf8ef" />}

        {kBlink < 0.94 && (
          <g clipPath={`url(#${clipId})`}>
            <path d={`M ${ox} 279 Q ${cx} ${(lidTopY + 7).toFixed(1)} ${ix} 279 L ${ix} 252 L ${ox} 252 Z`} fill="#cfc1ae" opacity={0.42} />
            <circle cx={(cx + gx).toFixed(1)} cy={(cy + gy).toFixed(1)} r={14.0} fill="#261911" />
            <circle cx={(cx + gx).toFixed(1)} cy={(cy + gy).toFixed(1)} r={12.0} fill="#362317" />
            <ellipse cx={(cx + gx).toFixed(1)} cy={(cy + gy + 5.8).toFixed(1)} rx={7.4} ry={3.4} fill="#6b472b" opacity={0.55} />
            <circle cx={(cx + gx).toFixed(1)} cy={(cy + gy).toFixed(1)} r={6.2} fill="#140c08" />
            <circle cx={(cx - 6.0 + gx).toFixed(1)} cy={(cy - 4.8 + gy).toFixed(1)} r={3.5} fill="#fffdf7" />
            <circle cx={(cx + 5.8 + gx).toFixed(1)} cy={(cy + 5.2 + gy).toFixed(1)} r={1.4} fill="#fff4df" opacity={0.72} />
          </g>
        )}

        <path d={upperD} fill="none" stroke={INK} strokeWidth={kBlink > 0.85 ? 3.2 : 4.4} strokeLinecap="round" />
        {kBlink < 0.88 && (
          <path
            d={`M ${ox + (isL ? 3 : -3)} 281 Q ${cx} ${(lidBotY + 1).toFixed(1)} ${ix + (isL ? -3 : 3)} 281`}
            fill="none"
            stroke={INK}
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.78}
          />
        )}
        <path
          d={`M ${ox + (isL ? 1 : -1)} 270 Q ${cx} ${creaseY.toFixed(1)} ${ix + (isL ? -1 : 1)} 270`}
          fill="none"
          stroke={INK}
          strokeWidth={1.9}
          strokeLinecap="round"
          opacity={0.75}
        />
      </g>
    );
  };

  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(s * fl).toFixed(4)} ${s.toFixed(4)}) translate(-963 -1000)`}>
      <defs>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8e0" stopOpacity={0.62 * halo} />
          <stop offset="48%" stopColor="#fce4a8" stopOpacity={0.26 * halo} />
          <stop offset="100%" stopColor="#fce4a8" stopOpacity={0} />
        </radialGradient>

        <linearGradient id={`${uid}-skin`} x1="0" y1="0.1" x2="1" y2="0.85">
          <stop offset="0%" stopColor="#e2aa74" />
          <stop offset="38%" stopColor={SKIN} />
          <stop offset="82%" stopColor="#bf8352" />
          <stop offset="100%" stopColor={SKIN_SHADE} />
        </linearGradient>

        <linearGradient id={`${uid}-cloth`} x1="0.1" y1="0" x2="0.95" y2="1">
          <stop offset="0%" stopColor={CLOTH_LIT} />
          <stop offset="55%" stopColor={CLOTH} />
          <stop offset="100%" stopColor="#e6d9c4" />
        </linearGradient>

        {/* Soft feathered sunlight rim reflection on dark hair (upper-left sun) */}
        <radialGradient id={`${uid}-hair-sun`} cx="16%" cy="22%" r="68%">
          <stop offset="0%" stopColor="#d8a872" stopOpacity={0.78} />
          <stop offset="32%" stopColor="#8c623d" stopOpacity={0.42} />
          <stop offset="62%" stopColor="#4a3324" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#2a1e17" stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}-hair-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>

        <clipPath id={`${uid}-face-clip`}>
          <path d="M 864 240 C 862 288 869 332 885 362 C 905 397 936 417 963 417 C 990 417 1021 397 1041 362 C 1057 332 1064 288 1062 240 C 1060 185 1024 156 963 156 C 902 156 866 185 864 240 Z" />
        </clipPath>

        <clipPath id={`${uid}-hair-clip`}>
          <path d="M 865 278 C 845 245 836 205 846 164 C 862 118 914 94 966 95 C 1008 96 1036 112 1042 132 C 1072 142 1094 176 1091 218 C 1089 248 1077 268 1064 280 L 1063 242 C 1061 206 1045 186 1031 171 L 1035 154 L 1021 167 C 994 166 962 164 932 167 C 896 172 874 198 866 240 Z" />
        </clipPath>
      </defs>

      {halo > 0.01 && <circle cx={963} cy={258} r={215} fill={`url(#${uid}-halo)`} pointerEvents="none" />}

      {/* ================================================================ */}
      {/* 1. SEATED CROSSED LEGS, DHOTI & CONNECTED BARE RIGHT FOOT        */}
      {/* ================================================================ */}
      <g>
        <path
          d="M 650 886 C 618 912 572 938 524 950 C 516 954 522 962 544 964 C 586 968 632 962 666 950 Z"
          fill={CLOTH}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 636 912 C 602 930 572 946 544 956" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.7} />

        <path
          d="M 1278 886 C 1312 912 1368 938 1426 952 C 1435 955 1428 963 1404 965 C 1360 968 1312 962 1268 948 Z"
          fill={CLOTH_SHADE}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 1296 912 C 1330 932 1366 946 1398 955" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.7} />

        {/* Right crossed knee/thigh */}
        <path
          d="M 962 840 C 1040 818 1175 814 1252 848 C 1296 868 1306 916 1280 952 C 1254 988 1192 998 1120 996 L 950 980 Z"
          fill={`url(#${uid}-cloth)`}
          stroke={INK}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path
          d="M 1245 848 C 1290 868 1300 916 1274 950 C 1250 982 1196 994 1140 993 C 1205 974 1248 942 1252 895 Z"
          fill={CLOTH_SHADE}
          opacity={0.72}
        />
        <path d="M 1110 865 C 1168 852 1222 854 1265 876" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
        <path d="M 1116 912 C 1172 916 1226 908 1266 892" fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" opacity={0.8} />

        {/* Bare right foot emerging seamlessly from underneath the crossed left dhoti leg */}
        <path
          d="M 884 1002 C 918 972 958 952 996 949 C 1020 944 1042 949 1068 951 C 1100 950 1126 942 1146 944 C 1160 946 1176 952 1185 959 C 1190 964 1190 976 1183 982 C 1190 986 1190 994 1185 998 C 1188 1003 1186 1009 1180 1011 C 1181 1016 1177 1020 1171 1020 C 1170 1025 1161 1028 1148 1026 C 1118 1022 1068 1017 1012 1008 C 966 1003 920 1002 884 1002 Z"
          fill={SKIN}
          stroke={INK}
          strokeWidth={3.1}
          strokeLinejoin="round"
        />
        <path
          d="M 896 1001 C 930 974 966 955 996 950 C 1016 946 1040 949 1058 952 C 1044 962 1024 968 1002 968 C 990 968 982 978 982 985 C 1030 994 1094 1002 1152 1006 C 1166 1007 1174 1014 1170 1022 C 1162 1027 1146 1026 1122 1022 C 1068 1016 986 1004 896 1001 Z"
          fill={SKIN_SHADE}
          opacity={0.72}
        />
        <path d="M 1038 960 C 1084 952 1130 949 1158 956 C 1140 962 1098 966 1048 968 Z" fill={SKIN_LIT} opacity={0.34} />
        <path
          d="M 1168 962 C 1174 961 1179 965 1179 972 C 1179 978 1174 981 1168 979 C 1165 975 1165 966 1168 962 Z"
          fill={SKIN_LIT}
          stroke={INK}
          strokeWidth={1.8}
          opacity={0.85}
        />
        <path d="M 1151 974 Q 1168 982 1183 982" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M 1155 991 Q 1171 997 1185 997" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M 1157 1004 Q 1171 1009 1181 1009" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        <path d="M 1154 1014 Q 1165 1019 1173 1018" fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" />

        {/* Offered shiuli flowers & tulsi leaf resting on Balak's own bare right foot (Episode 3 climax!) */}
        {footFlowers >= 1 && <ShiuliFlower x={1064} y={945} scale={1.15} rot={-12} />}
        {footFlowers >= 2 && <ShiuliFlower x={1098} y={940} scale={1.10} rot={18} />}
        {footFlowers >= 3 && <ShiuliFlower x={1126} y={947} scale={1.05} rot={-6} />}

        {/* Left crossed knee/thigh (in foreground — overlaps cleanly over the right ankle) */}
        <path
          d="M 962 840 C 880 818 742 814 668 852 C 626 874 618 924 646 962 C 676 1002 746 1012 842 1010 C 886 1009 918 1006 936 994 C 958 976 978 958 994 946 L 982 882 Z"
          fill={`url(#${uid}-cloth)`}
          stroke={INK}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path
          d="M 652 958 C 682 996 748 1008 840 1005 C 882 1004 914 1000 934 990 C 952 976 968 962 982 948 C 928 968 848 986 754 986 C 702 986 668 974 652 958 Z"
          fill={CLOTH_SHADE}
          opacity={0.75}
        />
        <path d="M 796 862 C 742 852 696 858 662 878" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
        <path d="M 812 918 C 756 916 708 906 672 890" fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" opacity={0.8} />
      </g>

      {/* ================================================================ */}
      {/* 2. BREATHING & LEANING UPPER BODY: NECK, CHADAR, SLEEVES & HANDS */}
      {/* ================================================================ */}
      {/* Ghoti standing on the mat, waiting to be picked up (root coords, drawn under the reaching hand). */}
      {ghotiOnMat && <CopperGhoti x={GHOTI_MAT_NECK[0]} y={GHOTI_MAT_NECK[1]} angle={0} scale={ghotiScale} />}
      <g transform={`translate(0 ${bodyTy.toFixed(2)})${leanRot !== 0 ? ` rotate(${leanRot.toFixed(3)} ${PIV[0]} ${PIV[1]})` : ""}`}>
        {/* Neck & upper chest skin */}
        <path
          d="M 914 392 L 906 462 L 892 558 L 1036 558 L 1022 462 L 1014 392 Z"
          fill={SKIN}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 913 402 C 938 424 988 424 1015 402 L 1018 434 C 986 452 940 452 910 434 Z" fill={SKIN_SHADE} opacity={0.72} />
        <path d="M 988 418 L 1016 408 L 1026 492 L 992 492 Z" fill={SKIN_SHADE} opacity={0.48} />
        <path d="M 910 468 Q 928 474 944 472" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.75} />
        <path d="M 982 472 Q 998 474 1014 467" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.75} />
        <path d="M 958 479 Q 964 484 970 479" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" opacity={0.65} />

        {/* Inner white diagonal chest wrap */}
        <path
          d="M 1030 434 C 998 486 942 536 894 562 L 894 826 L 1044 826 L 1048 456 Z"
          fill={CLOTH}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 1032 456 C 1002 518 962 586 922 660 L 922 820 L 1042 820 L 1046 476 Z" fill={CLOTH_SHADE} opacity={0.45} />
        <path d="M 1024 468 C 990 520 950 572 908 614" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />
        <path d="M 1034 510 C 1000 578 964 646 926 704" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.75} />
        <path d="M 926 610 C 920 688 920 752 924 812" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.65} />

        {/* Left outer chadar drape & wide flowing sleeve */}
        <path
          d="M 918 395 C 896 404 868 424 844 446 C 796 462 764 494 748 548 C 724 624 704 696 686 756 C 676 782 686 802 714 812 C 756 824 806 832 856 842 L 896 814 C 912 756 916 682 908 606 C 902 536 902 466 918 395 Z"
          fill={`url(#${uid}-cloth)`}
          stroke={INK}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path
          d="M 886 426 C 864 496 854 584 864 676 C 870 732 878 776 888 814 L 856 840 C 824 832 798 824 776 814 C 814 786 838 746 846 694 C 854 636 852 538 886 426 Z"
          fill={CLOTH_SHADE}
          opacity={0.62}
        />
        <path d="M 884 422 C 866 492 862 586 878 692" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M 792 486 C 794 568 810 656 838 744" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" opacity={0.85} />
        <path d="M 702 742 C 734 736 776 742 818 764" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />

        {/* Right outer chadar drape & wide flowing sleeve */}
        <path
          d="M 1008 395 C 1030 404 1058 424 1082 446 C 1130 462 1162 494 1178 548 C 1202 624 1222 696 1240 756 C 1250 782 1240 802 1212 812 C 1170 824 1120 832 1070 842 L 1030 814 C 1014 756 1010 682 1018 606 C 1024 536 1024 466 1008 395 Z"
          fill={`url(#${uid}-cloth)`}
          stroke={INK}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path
          d="M 1082 446 C 1130 462 1162 494 1178 548 C 1202 624 1222 696 1240 756 C 1250 782 1240 802 1212 812 C 1170 824 1120 832 1070 842 L 1094 794 C 1152 768 1172 714 1162 630 C 1154 552 1122 486 1082 446 Z"
          fill={CLOTH_SHADE}
          opacity={0.72}
        />
        <path d="M 1042 422 C 1060 492 1064 586 1048 692" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M 1134 486 C 1132 568 1116 656 1088 744" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" opacity={0.85} />
        <path d="M 1224 742 C 1192 736 1150 742 1108 764" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />

        {/* Viewer's LEFT arm (Balak's right arm): exact traced lap hand OR articulated Episode 3 gesture */}
        {useArtL < 0.35 ? (
          <g>
            <path
              d="M 764 824 C 794 804 824 794 844 798 C 864 822 886 846 908 862 C 926 874 942 886 952 904 C 960 918 964 934 960 944 C 956 950 948 950 944 945 C 940 953 930 954 924 947 C 920 955 910 956 904 949 C 898 957 886 955 878 944 C 868 928 858 906 854 884 C 824 862 794 842 764 824 Z"
              fill={SKIN}
              stroke={INK}
              strokeWidth={3.1}
              strokeLinejoin="round"
            />
            <path
              d="M 766 824 C 794 805 824 796 843 799 C 822 808 806 822 800 834 C 822 850 846 866 860 882 L 854 884 C 824 862 794 842 766 824 Z"
              fill={SKIN_SHADE}
              opacity={0.62}
            />
            <path
              d="M 880 944 C 888 954 898 955 904 948 C 910 954 920 953 924 946 C 930 952 940 951 944 944 C 948 949 956 948 959 942 C 948 938 922 938 880 944 Z"
              fill={SKIN_SHADE}
              opacity={0.55}
            />
            <path d="M 932 908 C 942 922 947 934 945 944" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            <path d="M 915 922 C 922 933 926 941 925 947" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M 898 932 C 903 940 906 945 905 949" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
            <path d="M 930 880 C 942 890 952 908 956 926" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.65} />
          </g>
        ) : (
          <g>
            <ThakurRefArm
              shX={armL.sh[0]}
              shY={armL.sh[1]}
              elX={armL.el[0]}
              elY={armL.el[1]}
              wrX={armL.wr[0]}
              wrY={armL.wr[1]}
              handRot={armL.rot}
              handType={lType}
              side="L"
              clothSway={swayL}
            />
          </g>
        )}

        {/* Viewer's RIGHT arm (Balak's left arm): exact traced lap hand OR articulated Namaskar arm */}
        {useArtR < 0.35 ? (
          <g>
            <path
              d="M 1152 824 C 1122 804 1094 794 1074 798 C 1054 822 1034 846 1012 862 C 994 874 978 886 968 904 C 960 918 958 934 962 944 C 966 950 974 950 979 945 C 983 953 993 954 999 947 C 1003 955 1013 956 1019 949 C 1025 957 1037 955 1045 944 C 1055 928 1064 906 1068 884 C 1098 862 1126 842 1152 824 Z"
              fill={SKIN}
              stroke={INK}
              strokeWidth={3.1}
              strokeLinejoin="round"
            />
            <path
              d="M 1150 824 C 1122 805 1094 796 1076 799 C 1096 808 1110 820 1112 832 C 1090 854 1064 876 1056 894 C 1048 916 1038 936 1024 948 C 1034 954 1042 949 1046 942 C 1056 926 1064 904 1068 884 C 1098 862 1126 842 1150 824 Z"
              fill={SKIN_SHADE}
              opacity={0.65}
            />
            <path d="M 990 908 C 981 922 977 934 979 944" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            <path d="M 1008 922 C 1001 933 997 941 998 947" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M 1026 932 C 1021 940 1018 945 1019 949" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
            <path d="M 992 880 C 980 890 970 908 966 926" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.65} />
          </g>
        ) : (
          <g>
            {/* The ghoti sits in the fist: drawn first so the fingers wrap over its neck. */}
            {ghotiOp > 0.01 && <CopperGhoti x={gripPt[0]} y={gripPt[1]} angle={ghotiAngle} scale={ghotiScale} opacity={ghotiOp} />}
            <ThakurRefArm
              shX={armR.sh[0]}
              shY={armR.sh[1]}
              elX={armR.el[0]}
              elY={armR.el[1]}
              wrX={armR.wr[0]}
              wrY={armR.wr[1]}
              handRot={armR.rot}
              handType={rType}
              side="R"
              clothSway={swayR}
            />
            {flowerOn && <HeldShiuli x={pinchPt[0]} y={pinchPt[1]} dirDeg={armR.rot} twirl={Math.sin(lf * 0.09) * 6} />}
          </g>
        )}
      </g>

      {/* Water stream from the ghoti's lowered lip: falls with gravity to the mat, thinning, with a small splash. */}
      {flowAmt > 0.02 && (() => {
        const groundY = 1000;
        const fall = groundY - lip[1];
        const endY = lip[1] + fall * flowFront;
        const wob = Math.sin(lf * 0.9) * 1.2;
        const k = flowFront;
        const sx = lip[0];
        const d = `M ${sx.toFixed(1)} ${lip[1].toFixed(1)} C ${(sx + 14 * k).toFixed(1)} ${(lip[1] + 6 * k).toFixed(1)} ${(sx + (22 + wob) * k).toFixed(1)} ${(lip[1] + fall * 0.3 * k).toFixed(1)} ${(sx + (24 + wob) * k).toFixed(1)} ${endY.toFixed(1)}`;
        const w = 3 + 4 * flowAmt;
        return (
          <g opacity={0.9}>
            <path d={d} fill="none" stroke="#8fc3da" strokeWidth={w + 2} strokeLinecap="round" opacity={0.55 * flowAmt} />
            <path d={d} fill="none" stroke="#d8eef7" strokeWidth={w} strokeLinecap="round" opacity={0.85 * flowAmt} />
            <path d={d} fill="none" stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" opacity={0.7 * flowAmt} strokeDasharray="10 14" strokeDashoffset={-lf * 9} />
            {flowFront >= 1 && (
              <g opacity={flowAmt}>
                <ellipse cx={sx + 24} cy={groundY} rx={18 + Math.sin(lf * 0.5) * 2} ry={4} fill="none" stroke="#a9d3e6" strokeWidth={2.2} opacity={0.75} />
                {[0, 1, 2].map((i) => {
                  const ph = ((lf * 0.11 + i / 3) % 1 + 1) % 1;
                  const dx = (i - 1) * 14 * ph;
                  const dy = -Math.sin(ph * Math.PI) * 14;
                  return <circle key={i} cx={sx + 24 + dx} cy={groundY - 2 + dy} r={2.6 * (1 - ph * 0.5)} fill="#d8eef7" stroke="#8fc3da" strokeWidth={0.8} opacity={0.9 * (1 - ph)} />;
                })}
              </g>
            )}
          </g>
        );
      })()}

      {/* ================================================================ */}
      {/* 3. PRECISION-TRACED HEAD (EARS, FACE OVAL, HAIR, EYES, SMILE)   */}
      {/* ================================================================ */}
      <g transform={`translate(${leanRot !== 0 ? headX.toFixed(2) : "963"} ${headY.toFixed(2)}) rotate(${tilt.toFixed(2)}) translate(-963 -400)`}>
        {/* Left Ear */}
        <path
          d="M 868 286 C 858 268 844 268 839 282 C 834 300 842 332 856 346 C 864 354 873 352 878 344 Z"
          fill={SKIN}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 862 292 C 852 282 846 288 847 304 C 848 320 856 334 866 338" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.78} />
        <path d="M 864 304 C 855 306 854 318 864 324" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.68} />

        {/* Right Ear */}
        <path
          d="M 1058 286 C 1068 268 1082 268 1087 282 C 1092 300 1084 332 1070 346 C 1062 354 1053 352 1048 344 Z"
          fill={SKIN_SHADE}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 1064 292 C 1074 282 1080 288 1079 304 C 1078 320 1070 334 1060 338" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.78} />
        <path d="M 1062 304 C 1071 306 1072 318 1062 324" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.68} />

        {/* Face Oval Base */}
        <path
          d="M 864 240 C 862 288 869 332 885 362 C 905 397 936 417 963 417 C 990 417 1021 397 1041 362 C 1057 332 1064 288 1062 240 C 1060 185 1024 156 963 156 C 902 156 866 185 864 240 Z"
          fill={`url(#${uid}-skin)`}
        />

        {/* 2-Tone Cel Shading inside Face Oval */}
        <g clipPath={`url(#${uid}-face-clip)`}>
          <path d="M 860 220 C 874 252 878 310 894 358 C 908 394 934 412 954 418 L 860 418 Z" fill={SKIN_LIT} opacity={0.52} />
          <path d="M 1026 164 C 1036 226 1042 294 1028 348 C 1014 394 978 412 940 416 L 1068 418 L 1068 164 Z" fill={SKIN_SHADE} opacity={0.58} />
          <ellipse cx={902} cy={322} rx={20} ry={11} fill="#df7b5c" opacity={0.14} />
          <ellipse cx={1024} cy={322} rx={20} ry={11} fill="#df7b5c" opacity={0.12} />
          <path d="M 964 268 C 974 282 978 308 974 326 L 964 326 Z" fill={SKIN_SHADE} opacity={0.44} />
          <ellipse cx={952} cy={314} rx={3.5} ry={7.5} fill={SKIN_LIT} opacity={0.72} />
        </g>

        <path
          d="M 864 240 C 862 288 869 332 885 362 C 905 397 936 417 963 417 C 990 417 1021 397 1041 362 C 1057 332 1064 288 1062 240"
          fill="none"
          stroke={INK}
          strokeWidth={3.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Scalp skin backing behind hair part */}
        <path d="M 1014 148 L 1046 148 L 1044 180 L 1014 180 Z" fill={SKIN} />

        {/* Hair Mass */}
        <path
          d="M 865 278 C 845 245 836 205 846 164 C 862 118 914 94 966 95 C 1008 96 1036 112 1042 132 C 1072 142 1094 176 1091 218 C 1089 248 1077 268 1064 280 L 1063 242 C 1061 206 1045 186 1031 171 L 1035 154 L 1021 167 C 994 166 962 164 932 167 C 896 172 874 198 866 240 Z"
          fill={HAIR}
          stroke={INK}
          strokeWidth={3.3}
          strokeLinejoin="round"
        />
        <g clipPath={`url(#${uid}-hair-clip)`}>
          <path
            d="M 844 246 C 838 192 862 132 924 104 C 966 88 1012 96 1036 118 C 1004 107 958 103 920 119 C 870 142 852 192 854 246 Z"
            fill={`url(#${uid}-hair-sun)`}
            filter={`url(#${uid}-hair-blur)`}
          />
          <path d="M 852 194 C 862 146 898 112 954 102" fill="none" stroke="#e4bc8a" strokeWidth={2.4} strokeLinecap="round" opacity={0.48} filter={`url(#${uid}-hair-blur)`} />
          <path d="M 870 172 Q 906 132 958 124" fill="none" stroke={HAIR_HI} strokeWidth={2.2} strokeLinecap="round" opacity={0.42} />
          <path d="M 862 204 Q 892 158 936 144" fill="none" stroke={HAIR_HI} strokeWidth={1.8} strokeLinecap="round" opacity={0.38} />
          <path d="M 946 146 Q 992 140 1026 148" fill="none" stroke={HAIR_HI} strokeWidth={1.6} strokeLinecap="round" opacity={0.28} />
          <path d="M 1054 156 Q 1076 184 1078 228" fill="none" stroke={HAIR_HI} strokeWidth={1.6} strokeLinecap="round" opacity={0.24} />
        </g>

        {/* Eyebrows */}
        <path d="M 875 258 C 892 243 920 241 941 249 C 943 252 941 256 937 256 C 918 250 894 251 875 258 Z" fill="#3f2b20" stroke={INK} strokeWidth={2.1} strokeLinejoin="round" />
        <path d="M 1052 258 C 1035 243 1007 241 986 249 C 984 252 986 256 990 256 C 1009 250 1033 251 1052 258 Z" fill="#3f2b20" stroke={INK} strokeWidth={2.1} strokeLinejoin="round" />

        {renderEye("L")}
        {renderEye("R")}

        {/* Nose */}
        <path d="M 951 271 Q 954 278 954 285" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.72} />
        <path d="M 951 329 Q 955 326 959 328" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M 968 328 Q 973 326 977 329" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />

        {/* Mouth: serene closed-lip smile with center-lip dip (or gentle lip-sync) */}
        {mOpen < 0.05 ? (
          <>
            <ellipse cx={963} cy={369.5} rx={13} ry={3.4} fill={SKIN_LIT} opacity={0.32} />
            <path d="M 931 358.5 Q 946 362.2 956 362.5 Q 963 365.4 970 362.5 Q 980 362.2 996 358.5" fill="none" stroke={INK} strokeWidth={3.0} strokeLinecap="round" />
            <ellipse cx={963} cy={378.5} rx={9.5} ry={2.0} fill={SKIN_SHADE} opacity={0.42} />
            <path d="M 953 376.5 Q 963 378.2 973 376.5" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.76} />
          </>
        ) : (
          <>
            <path
              d={`M 934 360 Q 963 ${(357 - mOpen * 2).toFixed(1)} 992 360 Q 963 ${(364 + mOpen * 13).toFixed(1)} 934 360 Z`}
              fill="#6e3528"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            <path
              d={`M 953 ${(377 + mOpen * 4).toFixed(1)} Q 963 ${(379 + mOpen * 4).toFixed(1)} 973 ${(377 + mOpen * 4).toFixed(1)}`}
              fill="none"
              stroke={INK}
              strokeWidth={1.9}
              strokeLinecap="round"
              opacity={0.7}
            />
          </>
        )}
      </g>
    </g>
  );
};
