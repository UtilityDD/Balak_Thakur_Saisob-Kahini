import React, { useId } from "react";
import { Hand, type HandShape } from "../../cinematic/rig/Hand";
import {
  PLATE_COLORS,
  PLATE_COLORS_HEALTHY,
  PLATE_HAIR_TOP,
  ThakurHeadPlate,
  ThakurNeckPlate,
  plateChinY,
  plateEyeAt,
  plateFaceState,
  type PlateColors,
  type PlateExpression,
  type PlateFaceState,
} from "../../cinematic/rig/ThakurHeadPlate";

/**
 * StandingChild: Balak at about six, STANDING, in the BAL-26 design (plate 01,
 * 01_Series_Bible/Thakur_Reference_Plates/01_Thakur_Age06_Child_Ujanchar.jpg). Episode 5 scene 01 (the tortoises) and
 * the Episode 6 glimpse; later standing scenes can reuse it.
 *
 * LOOK: the one plate head (src/cinematic/rig/ThakurHeadPlate.tsx, shared with SeatedChild design="plate"), a slim
 * child body (head about 1/5.5 of the height), warm medium-brown skin (PLATE_COLORS), a plain white dhoti from the waist
 * to mid-calf with a front pleat fall, a white chadar wrapped across the chest (V at the neck) and over both shoulders,
 * draping over the upper arms, one end hanging in front; bare feet with separated toes. Borderless shapes with soft form
 * shading, light from the upper left. No jewellery, tilak, thread, bangles or anklets (BAL-01 to BAL-03). No glow: the
 * scene places BirulGlow (use the `head` point of standingChildJoints).
 *
 * COORDINATES: (x, y) is the point between the feet on the ground line. Figure units, y down, ground at y = 0, facing
 * +x (three-quarter view) unless `flip`. The figure is about STANDING_HEIGHT (485) units tall at s = 1, with the same
 * head size as SeatedChild at the same `s` (head scale 0.97). Targets (hands, bite, held hand) are given in figure
 * units BEFORE the flip (as if facing +x), relative to (x, y), unscaled: convert a scene point P with
 * `standingLocal(P, x, y, s, flip)`.
 *
 * VIEW: `yaw` 0..1 turns the body from front (0) to three-quarter (1, default, about 55 degrees toward +x). The body is
 * built in 3D body space (legs and torso) and projected, so a turnaround is yaw 0 (front), 1 (three-quarter right) and
 * 1 with `flip` (three-quarter left). The bend poses are designed for yaw 1.
 *
 * CLOCKS: `f` (story clock) drives the poses, gestures, expressions and the mouth; `lifeF` (real frame, default f)
 * drives breathing, blinks, saccades, glances, weight shifts and finger life, so they go on in a pause (PIT-03).
 *
 * POSES (`pose`, with `poseStart` = the frame the pose began; t = f - poseStart):
 *   standIdle     upright, arms loose at the sides; weight shifts every 4 to 6 s (the feet stay planted, MOT-06),
 *                 glances with the eyes leading and the head following (MOT-13: never frozen).
 *   standQuiet    Episode 6 glimpse: upright, calm, hands loosely together in front of the waist, eyes a little low.
 *   standBend     "উপুড় হয়ে দাঁড়িয়ে": feet apart and planted, bent forward at the hips, knees soft, both hands down
 *                 at tortoise height. Hands at `handTargets` (palm centres) or around `bendAt` (default
 *                 BEND_AT = { x: 112, y: -34 }). The bend depth is solved from the targets, so hands always reach.
 *   turnTortoise  both hands at a shell's rim (palm centres from `handTargets.near` / `.far`, given per frame by the
 *                 scene, which draws the tortoise from them, MOT-07). Hands grip ("hold"); no overlap lag while in
 *                 contact. Without targets it plays turnTortoiseRim(t) at `bendAt` (the demo roll: over and back).
 *   reachGrab     the near hand goes to `reachAt` (default { x: 128, y: -30 }) over REACH_T (starts at t 0, arrives
 *                 at t 12, closes 12 to 16); the far hand stays at its bend target. Start it 6 to 8 f before the line.
 *   bitten        the near hand is held at `biteAt` (the tortoise's jaws: move it with the head, the hand follows),
 *                 the body still bent, the far hand on his far knee. Face: a blink of surprise at the start (from
 *                 `expressionStart`, default poseStart), then a calm, slightly amused regard; breathing stays steady.
 *                 Defaults to expression "surprised-calm".
 *   rise          straightens from the previous pose (prevPose, default standBend) to upright over RISE_LEN frames:
 *                 the head lifts first, then the back unrolls, the arms trail and settle loose.
 *   handInHands   upright, leaning a touch toward the person in front; the near hand lies passive at `heldAt` (default
 *                 { x: 74, y: -262 }) where another character's hands hold it; `palmUp` (0 = back of the hand up,
 *                 1 = palm up) turns it, driven by that character. Far hand loose at the side.
 *
 * BLENDS: `prevPose` (+ `prevPoseStart` for timed poses) blends every joint from the previous pose with an ease over
 * `blendFrames` (default 18; rise uses RISE_LEN). Overlapping action: the upper arm leads, the forearm trails by 3
 * frames and the fingers by 6 (only while the hand is not in contact).
 *
 * CLOTH (BAL-18): dhoti and chadar are built on the body joints each frame; the chadar end, the shawl's lower edge, the
 * pleat fall and the dhoti hem hang with gravity in the bend and trail motion (from the pose 4 frames earlier).
 *
 * BREATHING (MOT-20): about 3 s per breath on a noisy phase (irregular, each breath its own depth), quick inhale and a
 * passive exhale; shoulders and chest rise about 1 px, the head follows a fraction 4 frames late; shallow while he
 * speaks (`talk`, or an open `mouth`); `sigh` (sighCurve from SeatedChild works) adds a deep calm breath.
 *
 * FACE: `expression` serene | joyful | thoughtful | compassionate | playful | surprised-calm, blending over 18 frames
 * from `prevExpression` at `expressionStart`; `mouth` 0..1 (lip sync); `face` { lookX, lookY, eyesDown, smile } steers
 * the eyes (eyes lead, the head follows about 5 frames later).
 *
 * HELPERS: standingChildJoints(props) returns WORLD positions (after x, y, s, flip) of the palms, wrists, the little-
 * finger edge of each hand (where a tortoise bites), the feet (sole centre and toe), knees, shoulders, head centre,
 * head top, chin, chest and the halo anchor (glowAnchor), so scenes can attach things. All follow `headScale`. The palm
 * points are the palm centres of the hands as drawn (equal to the targets whenever the targets are within reach). standingLocal() converts a world point to figure units.
 * turnTortoiseRim(t, at) gives the demo roll's rim points.
 *
 * EPISODE 6 (2026-11-22; all opt-in: every Episode 5 pose, expression and default renders byte-identically):
 *   standScolded  upright, head a little low (neck forward), hands loosely together in front, eyes down; default
 *                 expression "thoughtful" (closed, quiet mouth).
 *   hurtBack      after the swat: bent forward HURT_BEND (prop `hurtBend`) at the waist, knees soft, the near hand round
 *                 at the small of his back (palm on the back, fingers down), the far hand on the far thigh just above
 *                 the knee (as near the knee as the arm reaches). Both targets come from the body every frame (contact
 *                 kept). Over an arm turned back the chadar stays a short cap on the shoulder (no wing or panel on the
 *                 back: STO-20a). Key it with prevPose "standScolded", blendFrames about 8: the flinch (forward lurch,
 *                 the head lags, eyes squeeze; HURT_T, prop `flinch` 0..1, 0 when cutting in on him already bent) and
 *                 quick, uneven breathing that settles over about 2 s (`hurtBreath` overrides). Expression "hurt".
 *   wipeEye       hurtBack body; the back of the far hand rises to his far eye (WIPE_T.up), rubs, comes down to the
 *                 thigh (WIPE_T.down), then the small forgiving smile (expression hurt > forgiving at WIPE_T.smile,
 *                 unless the scene sets `expression`). The near hand stays at his back. The far hand is drawn over the
 *                 face. Blend from hurtBack with blendFrames about 8.
 *   holdOut       both hands hold a small folded note out at chest height: thumb-and-finger pinches at its two side
 *                 edges. `noteAt` (centre, default NOTE_AT), `noteW` (NOTE_W), `noteAngle` (degrees). Joints `note`
 *                 gives the contacts, anchor, angle and width for the props agent's note; draw it in `layerMid` so the
 *                 near hand lies over it.
 *   giveOut       the far hand holds a paper twist at the chest (`twistAt`, TWIST_AT; draw it in `layerFar`); the near
 *                 hand takes a lozenge from the twist's mouth and puts it in the palm at each `gives` key
 *                 ({ at, start, yaw? }, GIVE_T cycle: pick, carry, put, release, withdraw). He turns on the spot from
 *                 boy to boy (body yaw from giveYaw(key), no walk cycle: the feet pivot in place); the eyes lead to each
 *                 palm. Joints `twist` and `give` (current lozenge: in the hand at pinchNear, or released at the palm).
 *   Gaze (any pose): `gaze` keys { at?, start } (figure units): the eyes arrive in GAZE_T.eyes frames, the head follows
 *                 (turn, chin up or down, neck), the eyes counter as it arrives. glanceHideThenFather({ hideAt,
 *                 fatherAt, start, gap?, back? }) builds the two glances of shot 4.
 *   headShake 0..1 a small slow "no" (period 22 f, story clock), the eyes stay on their target; with `mouth` the breath
 *                 is the quiet speaking breath (also in hurtBack). `teary` 0..1 (ThakurHeadPlate `tear`: wet lower lids,
 *                 slightly reddened rim, a second catchlight; no streaming). `sniffAt` [life frames]: a quick double
 *                 inhale with a small lift of the head. Expressions "hurt" (brows raised and drawn, mouth closed, eyes
 *                 soft) and "forgiving" (a small closed-lip smile, soft eyes); never a grin (BAL-22).
 *   Joints also give pinchNear / pinchFar (thumb-and-index pinch of each hand) for any pose.
 *
 * BAL-26c (2026-11-23), opt-in `build="healthy"` (default "classic" = byte-identical): HEALTHY_BUILD proportions
 * (shoulders about 34% wider, torso 30% fuller with a rounder chest and slight belly, arms x1.5 and legs x1.3 thicker,
 * a thicker neck, legs about 10% shorter and the torso 11% longer, so the overall height is about 3% less), hands 15%
 * larger, smaller sturdy feet; upright open posture (head up, weight on one leg with an easy sway, arms clear of the body
 * with a soft elbow); the chadar across the chest and over the shoulders ending above the dhoti's rolled waist and tuck,
 * the drape over both shoulders and the whole upper arms to the elbow (BAL-26d, plate 01; forearms and hands free, a
 * slim drape hem where the forearm comes out), a fuller mid-calf dhoti with front pleats and a little rise between the legs;
 * PLATE_COLORS_HEALTHY (warm skin, warm cotton shading) and ThakurHeadPlate `vivid` (open bright eyes). Gestures: wrists
 * trail and settle; holdOut elbows at the sides with the forearms angled up and the note at the fingertips; giveOut
 * leans in and turns the palm up toward each boy; wipeEye with the back of the fingers; the hurt bend smaller (0.34)
 * with the back of the hand resting at the waist. Works with `look="painted"`.
 */

/* ------------------------------------------------------------------ */
/* Types and props                                                      */
/* ------------------------------------------------------------------ */

export type StandingPose =
  | "standIdle"
  | "standQuiet"
  | "standBend"
  | "turnTortoise"
  | "reachGrab"
  | "bitten"
  | "rise"
  | "handInHands"
  // Episode 6 (opt-in additions; see EPISODE 6 in the header)
  | "standScolded"
  | "hurtBack"
  | "wipeEye"
  | "holdOut"
  | "giveOut";

export type StandingExpression = "serene" | "joyful" | "thoughtful" | "compassionate" | "playful" | "surprised-calm" | "hurt" | "forgiving";

export interface V {
  x: number;
  y: number;
}

/** A gaze key (Episode 6): from `start` (story frame) the eyes go to `at` (figure units before flip, like the hand
 * targets), the head follows a few frames later. `at` undefined hands the look back to the pose. */
export interface GazeKey {
  at?: V;
  start: number;
}

/** A giveOut key (Episode 6): from `start` he takes a lozenge from the paper twist and puts it in the palm at `at`
 * (figure units before flip). `yaw` (0 front .. 1 three-quarter) is the body turn toward that boy; default from `at`. */
export interface GiveKey {
  at: V;
  start: number;
  yaw?: number;
}

export interface StandingChildProps {
  x: number;
  y: number;
  s?: number;
  /** Story clock: poses, gestures, expressions, mouth. */
  f: number;
  /** Life clock (real frame): breathing, blinks, saccades, glances, weight shifts. Default f. */
  lifeF?: number;
  pose?: StandingPose;
  poseStart?: number;
  prevPose?: StandingPose;
  prevPoseStart?: number;
  /** Frames of the blend from prevPose (default 18; rise uses RISE_LEN). */
  blendFrames?: number;
  flip?: boolean;
  /** 0 = front view, 1 = three-quarter facing +x (default). */
  yaw?: number;
  /** Feet apart, 0 = together (idle) .. 1 = apart (the bend). Default by pose. */
  stance?: number;
  /** Palm-centre targets (figure units before flip). Override the pose's own hand targets (contact: no lag). */
  handTargets?: { near?: V; far?: V };
  /** standBend / turnTortoise default centre for both hands. */
  bendAt?: V;
  /** reachGrab target for the near hand. */
  reachAt?: V;
  /** bitten: where the tortoise's jaws hold the near hand (palm centre follows it). Default reachAt. */
  biteAt?: V;
  /** handInHands: where the near hand is held (palm centre). */
  heldAt?: V;
  /** handInHands: 0 = back of the hand up, 1 = palm up. */
  palmUp?: number;
  expression?: StandingExpression;
  prevExpression?: StandingExpression;
  expressionStart?: number;
  /** Lip sync 0..1. */
  mouth?: number;
  /** Speech envelope 0..1 (shallow breath). Default: from mouth. */
  talk?: number;
  /** A deep calm breath curve on the story clock (sighCurve). */
  sigh?: (f: number) => number;
  face?: { lookX?: number; lookY?: number; eyesDown?: number; smile?: number };
  /** Age in years (default 6). */
  age?: number;
  /**
   * Head size relative to the body (default 1 = the design proportions). Scales the head (ThakurHeadPlate) and the neck
   * about the neck base, so a scene can match the big-headed Puppet adults (e.g. 1.35 with a smaller `s`). Every
   * head-derived point of standingChildJoints (head, headTop, chin, glowAnchor, headScale) follows.
   */
  headScale?: number;

  /* ---------------- Episode 6 (all opt-in; absent = the Episode 5 behaviour) ---------------- */
  /** Gaze keys: eyes lead, the head follows (MOT-13). See glanceHideThenFather(). Works on every pose. */
  gaze?: GazeKey[];
  /** Small slow head shake 0..1 (a "no" while talking); the eyes stay on their target. Story clock. */
  headShake?: number;
  /** Teary eyes 0..1 (ThakurHeadPlate `tear`): wet lower lids, reddened rim, glistening catchlight. Fade it out. */
  teary?: number;
  /** Sniffs at these LIFE frames: a quick double inhale with a small lift of the head. */
  sniffAt?: number[];
  /** Override of the quick uneven hurt breathing 0..1 (default: hurtBack 1 at the swat, settling over about 2 s). */
  hurtBreath?: number;
  /** hurtBack: the flinch at the swat 0..1 (default 1; 0 when a scene cuts in on him already bent). */
  flinch?: number;
  /** hurtBack / wipeEye: forward bend of the back in radians (default HURT_BEND). */
  hurtBend?: number;
  /** holdOut: the note's centre (figure units before flip), its width and in-plane angle (degrees). */
  noteAt?: V;
  noteW?: number;
  noteAngle?: number;
  /** giveOut: the keyed gives (boy to boy) and where the far hand holds the paper twist (figure units). */
  gives?: GiveKey[];
  twistAt?: V;
  /**
   * Prop layers in WORLD coordinates, drawn inside the figure: `layerFar` just before the far forearm and hand (the far
   * fingers close over it: the paper twist), `layerMid` after the far hand and before the near arm (the near hand lies
   * over it: the note). Absent = the Episode 5 drawing order.
   */
  layerFar?: React.ReactNode;
  layerMid?: React.ReactNode;
  /**
   * BAL-26c (2026-11-23), opt-in: "healthy" = a healthy, lively six-year-old: sturdier child proportions (broader
   * shoulders, rounder chest and a slight belly, thicker limbs and neck, legs a little shorter), an upright open posture
   * with weight on one leg at rest, the chadar across the chest and shoulders with a dhoti waist and pleats showing,
   * warm cotton and skin (PLATE_COLORS_HEALTHY), bright open eyes (ThakurHeadPlate `vivid`), hands about 15% larger
   * with wrists that lead and settle. Every pose, prop and helper works with it. Default "classic" = the Episode 5 build,
   * byte-identical.
   */
  build?: "classic" | "healthy";
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

// Per-build values (BAL-26c): `let`, set by applyBuild() at every entry point (StandingChild, standingChildJoints); the
// child components (ArmEl, FootEl) get their sizes as props, so nothing reads them after the entry returns.
let C: PlateColors = PLATE_COLORS;
export const STANDING_HEIGHT = 485;
const HEAD_K = 0.97;
const YAW_MAX = (55 * Math.PI) / 180;
let THIGH = 116;
let SHIN = 112;
const ANKLE_H = 15;
let HIP_Y = -(ANKLE_H + (THIGH + SHIN) * 0.994); // upright pelvis height (legs almost straight)
let HIP_HALF = 12;
let TORSO = 126; // pelvis to the shoulder line
let SH_HALF = 32; // shoulder joints, half width (front)
const NECK_TO_HEAD = 57; // shoulder-line centre to head centre
let UPPER = 76;
let FORE = 68;
let REACH = (UPPER + FORE) * 0.95;
let HAND_L = 50;
const HAND_SX = 1.06;
const HAND_SY = 0.97;
let PALM_OFF = 0.24 * HAND_L * HAND_SY; // wrist to palm centre
/** Episode 6: palm centre to the thumb-and-index pinch (where a note edge or a lozenge is held). */
let PINCH_OFF = 0.3 * HAND_L;
let FOOT_K = 1.55;
/** BAL-26c healthy build active, and its thickness factors (1 in the classic build). */
let HB = false;
let ARM_R = 1;
let LEG_R = 1;
let NECK_L = 1;
let NECK_R = 1;
let TORSO_W = 1;
/** BAL-26c: the healthy build's proportions (figure units at s = 1; the classic build is the Episode 5 one). */
export const HEALTHY_BUILD = {
  thigh: 106,
  shin: 100,
  hipHalf: 14,
  torso: 140,
  shoulderHalf: 43,
  upper: 72,
  fore: 64,
  hand: 57.5,
  foot: 1.42,
  armR: 1.5,
  legR: 1.3,
  neckLen: 0.95,
  neckR: 1.45,
  torsoW: 1.3,
};
const applyBuild = (p: StandingChildProps): void => {
  const h = p.build === "healthy";
  if (h === HB) return;
  HB = h;
  const B = HEALTHY_BUILD;
  C = h ? PLATE_COLORS_HEALTHY : PLATE_COLORS;
  THIGH = h ? B.thigh : 116;
  SHIN = h ? B.shin : 112;
  HIP_Y = -(ANKLE_H + (THIGH + SHIN) * 0.994);
  HIP_HALF = h ? B.hipHalf : 12;
  TORSO = h ? B.torso : 126;
  SH_HALF = h ? B.shoulderHalf : 32;
  UPPER = h ? B.upper : 76;
  FORE = h ? B.fore : 68;
  REACH = (UPPER + FORE) * 0.95;
  HAND_L = h ? B.hand : 50;
  PALM_OFF = 0.24 * HAND_L * HAND_SY;
  // healthy: the note is held lightly at the fingertips
  PINCH_OFF = (h ? 0.4 : 0.3) * HAND_L;
  FOOT_K = h ? B.foot : 1.55;
  ARM_R = h ? B.armR : 1;
  LEG_R = h ? B.legR : 1;
  NECK_L = h ? B.neckLen : 1;
  NECK_R = h ? B.neckR : 1;
  TORSO_W = h ? B.torsoW : 1;
};
const TILT = 0.1; // a camera a little above: far points sit a touch higher

export const BEND_AT: V = { x: 112, y: -34 };
const REACH_AT: V = { x: 128, y: -30 };
const HELD_AT: V = { x: 74, y: -262 };
export const REACH_T = { reach: 12, grip: 16 };
export const RISE_LEN = 26;
export const TURN_TORTOISE_LEN = 56;

/* Episode 6 */
/** hurtBack: forward bend of the back (radians, about 26 degrees). */
export const HURT_BEND = 0.46;
/** hurtBack: the flinch (frames from poseStart): peak at `peak`, settled by `settle`; the hurt breathing settles by `breath`. */
export const HURT_T = { peak: 3, settle: 20, breath: 56 };
/** hurtBack: the near upper arm hangs down and back at this angle from vertical (degrees). */
export const HURT_ELBOW_DEG = 48;
/** wipeEye (frames from poseStart): the hand at the eye by `up`, rubs to `rubEnd`, back down by `down`; the smile from `smile`. */
export const WIPE_T = { up: 12, rubEnd: 30, down: 44, smile: 42 };
/** holdOut defaults (figure units). */
export const NOTE_AT: V = { x: 70, y: -318 };
export const NOTE_W = 40;
/** giveOut: the paper twist in the far hand (palm centre) and the give cycle (frames from each key's start). */
export const TWIST_AT: V = { x: 30, y: -292 };
export const GIVE_T = { pick: 8, lift: 12, over: 24, put: 29, release: 27, withdraw: 42, turn0: 3, turn1: 18 };
/** Gaze timing: the eyes arrive in `eyes` frames, the head starts `headDelay` later and takes `head` frames. */
export const GAZE_T = { eyes: 4, headDelay: 4, head: 14 };

/* ------------------------------------------------------------------ */
/* Small maths                                                          */
/* ------------------------------------------------------------------ */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const easeIO = (t: number) => {
  const u = clamp(t, 0, 1);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k });
const lerpV = (a: V, b: V, t: number): V => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const len = (a: V) => Math.hypot(a.x, a.y);
const unit = (a: V): V => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
};
const perpL = (a: V): V => ({ x: -a.y, y: a.x });
const pt = (p: V) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
const wrapA = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
const lerpA = (a: number, b: number, t: number) => a + wrapA(b - a) * t;
const mixHex = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};
const skinEdge = (base: string, shade: string) => mixHex(base, shade, 0.34);

const hash01 = (n: number, salt: number): number => {
  let h = (Math.imul(n | 0, 2654435761) ^ Math.imul(salt | 0, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const wob = (f: number, seed: number, rate = 1) =>
  0.55 * Math.sin(f * 0.061 * rate + seed) + 0.3 * Math.sin(f * 0.1543 * rate + seed * 1.31 + 0.7) + 0.15 * Math.sin(f * 0.0227 * rate + seed * 2.17);

/* Paths */
const smoothClosed = (pts: V[]): string => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${pt({ x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 })} ${pt({ x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 })} ${pt(p2)}`;
  }
  return d + "Z";
};
const smoothOpen = (pts: V[]): string => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    d += ` C${pt({ x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 })} ${pt({ x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 })} ${pt(p2)}`;
  }
  return d;
};
/** Capsule from A (radius rA) to B (radius rB). */
const capD = (A: V, B: V, rA: number, rB: number): string => {
  const l = Math.hypot(B.x - A.x, B.y - A.y) || 1;
  const nx = -(B.y - A.y) / l;
  const ny = (B.x - A.x) / l;
  const p = (c: V, k: number, r: number) => `${(c.x + nx * r * k).toFixed(2)} ${(c.y + ny * r * k).toFixed(2)}`;
  return `M${p(A, 1, rA)} L${p(B, 1, rB)} A${rB.toFixed(2)} ${rB.toFixed(2)} 0 0 0 ${p(B, -1, rB)} L${p(A, -1, rA)} A${rA.toFixed(2)} ${rA.toFixed(2)} 0 0 0 ${p(A, 1, rA)} Z`;
};
/** Tapered limb as a union of sub-capsules (round joints, no seams). */
const chainD = (pts: V[], radii: number[], o: { grow?: number; dx?: number; dy?: number; sub?: number } = {}): string => {
  const g = o.grow ?? 0;
  const dx = o.dx ?? 0;
  const dy = o.dy ?? 0;
  const sb = o.sub ?? 4;
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < sb; k++) {
      const t0 = k / sb;
      const t1 = (k + 1) / sb;
      const A = lerpV(pts[i], pts[i + 1], t0);
      const B = lerpV(pts[i], pts[i + 1], t1);
      d += capD({ x: A.x + dx, y: A.y + dy }, { x: B.x + dx, y: B.y + dy }, Math.max(0.2, lerp(radii[i], radii[i + 1], t0) + g), Math.max(0.2, lerp(radii[i], radii[i + 1], t1) + g));
    }
  }
  return d;
};
/** Borderless skin limb: soft shade silhouette, lit copy nudged toward the light (MOT-19: no outline). */
const skinLimb = (pts: V[], radii: number[], base: string = C.skin, shade: string = C.skinShade, key?: string): React.ReactElement => (
  <g key={key}>
    <path d={chainD(pts, radii)} fill={skinEdge(base, shade)} />
    <path d={chainD(pts, radii, { grow: -1.3, dx: -1, dy: -1.2 })} fill={base} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Breathing (MOT-20), same model as SeatedChild                         */
/* ------------------------------------------------------------------ */

const BREATH_P = 74;
const easeSin = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));
const calmBreath = (L: number): number => {
  const ph = L / BREATH_P + 0.15 * Math.sin(L * 0.0109 + 1.6) + 0.11 * Math.sin(L * 0.0067 + 0.3) + 0.03 * Math.sin(L * 0.0231 + 2.1);
  const n = Math.floor(ph);
  const u = ph - n;
  const depth = 0.8 + 0.32 * hash01(n, 19);
  const inF = 0.3 + 0.07 * hash01(n, 29);
  const exEnd = 0.78 + 0.09 * hash01(n, 41);
  if (u < inF) return depth * easeSin(u / inF);
  if (u < exEnd) return depth * Math.pow(1 - easeSin((u - inF) / (exEnd - inF)), 1.35);
  return 0;
};
const speechBreath = (L: number): number => {
  const ph = L / 44 + 0.18 * Math.sin(L * 0.019 + 0.4) + 0.08 * Math.sin(L * 0.0431 + 1.3);
  const n = Math.floor(ph);
  const u = ph - n;
  const depth = 0.24 + 0.14 * hash01(n, 57);
  return depth * (u < 0.15 ? easeSin(u / 0.15) : 1 - easeSin((u - 0.15) / 0.85));
};
const breathAt = (L: number, speak: number, sigh: ((f: number) => number) | undefined, sf: number): number => {
  let b = lerp(calmBreath(L), speechBreath(L), clamp(speak, 0, 1));
  if (sigh) {
    let win = 0;
    for (let k = -30; k <= 8; k += 2) win = Math.max(win, clamp(sigh(sf + k), 0, 1));
    const w = easeSin(win / 0.12);
    if (w > 0) b = lerp(b, 2.3 * clamp(sigh(sf), 0, 1), w);
  }
  return b;
};

/* ------------------------------------------------------------------ */
/* Seeded idle tracks (no visible loop)                                 */
/* ------------------------------------------------------------------ */

interface Track {
  t: number[];
  v: number[];
  ramp: number;
}
const makeTrack = (seed: number, minGap: number, maxGap: number, ramp: number, val: (r: number, i: number) => number): Track => {
  let st = seed >>> 0;
  const rnd = () => {
    st = (Math.imul(st, 1664525) + 1013904223) >>> 0;
    return st / 4294967296;
  };
  const t: number[] = [-100000];
  const v: number[] = [0];
  let at = 20 + rnd() * minGap;
  let i = 0;
  while (at < 40000) {
    t.push(at);
    v.push(val(rnd(), i++));
    at += minGap + rnd() * (maxGap - minGap);
  }
  return { t, v, ramp };
};
const trackAt = (tr: Track, f: number): number => {
  let lo = 0;
  let hi = tr.t.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (tr.t[mid] <= f) lo = mid;
    else hi = mid - 1;
  }
  const prev = lo > 0 ? tr.v[lo - 1] : 0;
  return lerp(prev, tr.v[lo], smooth((f - tr.t[lo]) / tr.ramp));
};
const WEIGHT_TRACK = makeTrack(5101, 96, 150, 34, (r, i) => (i % 2 ? 1 : -1) * (0.6 + 0.4 * r));
const GLANCE_TRACK = makeTrack(6203, 96, 168, 5, (r) => (r < 0.35 ? 0 : 2 * r - 1.05));
const GLANCE_Y_TRACK = makeTrack(7307, 120, 200, 8, (r) => 0.6 * r - 0.3);
const SWAY_TRACK = makeTrack(8419, 60, 120, 40, (r) => 2 * r - 1);
const FIDGET_TRACK = makeTrack(9521, 50, 110, 14, (r) => 2 * r - 1);

/* ------------------------------------------------------------------ */
/* Demo tortoise roll (QA and default turnTortoise)                     */
/* ------------------------------------------------------------------ */

/**
 * The demo roll used by turnTortoise without targets, and by the QA sheet: a shell of about 26 units half length at
 * `at`, rolled over onto its back about its long axis (t 6..22), held upside down (22..34), rolled back (34..50).
 * Returns the palm targets (near hand at the tail end, far hand at the far side of the rim) and the roll angle phi
 * (0 upright .. PI on its back). A scene with a real tortoise computes its own rim points from its shell.
 */
export const turnTortoiseRim = (t: number, at: V = BEND_AT): { near: V; far: V; phi: number; lift: number } => {
  const tt = ((t % TURN_TORTOISE_LEN) + TURN_TORTOISE_LEN) % TURN_TORTOISE_LEN;
  const phi = Math.PI * (tt < 22 ? easeIO((tt - 6) / 16) : tt < 34 ? 1 : 1 - easeIO((tt - 34) / 16));
  const lift = Math.sin(phi) * 10; // the shell rises a little while on edge
  const near: V = { x: at.x - 26, y: at.y - 6 - lift };
  // the far hand rides the far rim: over the top and down the other side
  const far: V = { x: at.x + 8 + 10 * Math.sin(phi), y: at.y - 14 - lift - 10 * Math.cos(phi) };
  return { near, far, phi, lift };
};

/* ------------------------------------------------------------------ */
/* Episode 6 helpers: give cycle, gaze, hurt breathing, sniffs           */
/* ------------------------------------------------------------------ */

const giveKeys = (p: StandingChildProps): GiveKey[] => (p.gives ?? []).slice().sort((a, b) => a.start - b.start);
const keyIndex = (starts: number[], f: number): number => {
  let idx = -1;
  for (let i = 0; i < starts.length; i++) if (starts[i] <= f) idx = i;
  return idx;
};
/** Body turn toward a boy at `at` (figure units): 0 front .. 1 three-quarter. */
export const giveYaw = (k: GiveKey): number => k.yaw ?? clamp(0.3 + k.at.x / 150, 0.1, 1);
const twistMouthOf = (tw: V): V => add(tw, { x: 3, y: -27 });

interface GiveHand {
  P: V;
  D: V;
  curl: number;
  turn: number;
  contact: number;
  idx: number;
  inHand: boolean;
  released: boolean;
  /** BAL-26c: how far he leans in toward the boy (0..1). */
  lean: number;
}

const giveHandAt = (keys: GiveKey[], idx: number, t: number, tw: V, L: number): GiveHand => {
  const restD = unit({ x: 0.3, y: 1 });
  if (idx < 0) {
    return { P: add(tw, { x: 30 + 0.8 * wob(L, 1.1, 0.5), y: 32 }), D: restD, curl: 0.32, turn: -2.35, contact: 0, idx, inHand: false, released: false, lean: 0 };
  }
  const k = keys[idx];
  const G = GIVE_T;
  const dDown = unit({ x: 0.12, y: 1 });
  const dOut = unit({ x: 0.62, y: 0.78 });
  // palm centres for the pinch (fingertips) at the twist's mouth and just above the boy's palm
  const PM = sub(twistMouthOf(tw), mul(dDown, PINCH_OFF));
  const PA = sub(add(k.at, { x: 0, y: -6 }), mul(dOut, PINCH_OFF));
  const PAup = add(PA, { x: -3, y: -14 });
  const PW = add(lerpV(PA, PM, 0.5), { x: 2, y: 10 });
  const from = idx > 0 ? giveHandAt(keys, idx - 1, k.start - keys[idx - 1].start, tw, L) : giveHandAt(keys, -1, 0, tw, L);
  const base = { idx, inHand: false, released: false, contact: 0, lean: 0 };
  if (t < G.pick) {
    const u = easeIO(t / G.pick);
    return { ...base, P: add(lerpV(from.P, PM, u), { x: 0, y: -8 * Math.sin(Math.PI * u) }), D: unit(lerpV(from.D, dDown, u)), curl: lerp(from.curl, 0.2, u), turn: lerpA(from.turn, -2.3, u) };
  }
  if (t < G.lift) {
    const u = smooth((t - G.pick) / (G.lift - G.pick));
    return { ...base, P: add(PM, { x: 0, y: 3 * Math.sin(Math.PI * u) }), D: dDown, curl: lerp(0.2, 0.55, u), turn: -2.3, inHand: u > 0.5 };
  }
  if (t < G.over) {
    const u = easeIO((t - G.lift) / (G.over - G.lift));
    return { ...base, P: add(lerpV(PM, PAup, u), { x: 0, y: -10 * Math.sin(Math.PI * u) }), D: unit(lerpV(dDown, dOut, u)), curl: 0.55, turn: HB ? lerpA(-2.3, -1.3, u) : -2.3, inHand: true, lean: 0.6 * u };
  }
  if (t < G.put) {
    const u = easeIO((t - G.over) / (G.put - G.over));
    const rel = t >= G.release;
    return { ...base, P: lerpV(PAup, PA, u), D: dOut, curl: rel ? lerp(0.55, 0.14, smooth((t - G.release) / 2)) : 0.55, turn: HB ? lerpA(-1.3, -0.75, u) : -2.3, contact: u, inHand: !rel, released: rel, lean: 0.6 + 0.4 * u };
  }
  if (t < G.withdraw) {
    const u = easeIO((t - G.put) / (G.withdraw - G.put));
    return { ...base, P: lerpV(PA, PW, u), D: unit(lerpV(dOut, restD, u)), curl: lerp(0.14, 0.3, u), turn: HB ? lerpA(-0.75, -2.2, u) : -2.3, contact: 1 - u, released: true, lean: 1 - easeIO(u) };
  }
  return { ...base, P: add(PW, { x: 0.8 * wob(L, 5.3, 0.5), y: 0.6 * wob(L, 8.2, 0.4) }), D: restD, curl: 0.3 + 0.05 * wob(L, 3.9, 0.6), turn: HB ? -2.2 : -2.3, released: true };
};

const giveHand = (p: StandingChildProps, f: number, tw: V, L: number): GiveHand => {
  const keys = giveKeys(p);
  const idx = keyIndex(
    keys.map((k) => k.start),
    f,
  );
  return giveHandAt(keys, idx, idx < 0 ? 0 : f - keys[idx].start, tw, L);
};

/** Body yaw: the prop, or in giveOut with keyed gives the turn from boy to boy (turning on the spot, no walk). */
const yawOf = (props: StandingChildProps, sf: number): number => {
  if (props.pose === "giveOut" && props.gives && props.gives.length) {
    const keys = giveKeys(props);
    const idx = keyIndex(
      keys.map((k) => k.start),
      sf,
    );
    if (idx < 0) return props.yaw ?? 1;
    const y0 = idx > 0 ? giveYaw(keys[idx - 1]) : props.yaw ?? 1;
    const u = easeIO((sf - keys[idx].start - GIVE_T.turn0) / (GIVE_T.turn1 - GIVE_T.turn0));
    return lerp(y0, giveYaw(keys[idx]), u);
  }
  return props.yaw ?? 1;
};

interface GazeOut {
  eyeX: number;
  eyeY: number;
  up: number;
  turn: number;
  tilt: number;
  neck: number;
}
/** Look values toward T from the head centre H (figure units, facing +x). */
const gazeTo = (H: V, T: V): GazeOut => {
  const d = sub(T, H);
  const l = len(d) || 1;
  const ux = d.x / l;
  const uy = d.y / l;
  return {
    eyeX: clamp(1.15 * ux, -1, 1),
    eyeY: uy > 0 ? clamp(0.9 * uy, 0, 1) : 0,
    up: uy < 0 ? clamp(-1.2 * uy, 0, 1) : 0,
    turn: clamp(0.9 * (ux - 0.55), -1.3, 0.35),
    tilt: uy < 0 ? 13 * uy : 6 * uy,
    neck: uy < 0 ? 0.32 * uy : 0.12 * uy,
  };
};
const gazeKeysOf = (props: StandingChildProps): GazeKey[] | undefined => {
  if (props.gaze && props.gaze.length) return props.gaze.slice().sort((a, b) => a.start - b.start);
  if (props.pose === "giveOut" && props.gives && props.gives.length) return giveKeys(props).map((k) => ({ at: add(k.at, { x: 0, y: -4 }), start: k.start - 2 }));
  return undefined;
};
/** Gaze at story frame sf: the eyes arrive first, the head follows (MOT-13). Null before the first key. */
const gazeFor = (keys: GazeKey[], sf: number, H: V, own: GazeOut): GazeOut | null => {
  const idx = keyIndex(
    keys.map((k) => k.start),
    sf,
  );
  if (idx < 0) return null;
  const t = sf - keys[idx].start;
  const at = keys[idx].at;
  const to = at ? gazeTo(H, at) : own;
  const pAt = idx > 0 ? keys[idx - 1].at : undefined;
  const from = idx > 0 && pAt ? gazeTo(H, pAt) : own;
  const ke = smooth(t / GAZE_T.eyes);
  const kh = easeIO((t - GAZE_T.headDelay) / GAZE_T.head);
  return {
    eyeX: lerp(from.eyeX, to.eyeX, ke),
    eyeY: lerp(from.eyeY, to.eyeY, ke),
    up: lerp(from.up, to.up, ke),
    turn: lerp(from.turn, to.turn, kh),
    tilt: lerp(from.tilt, to.tilt, kh),
    neck: lerp(from.neck, to.neck, kh),
  };
};

/**
 * Gaze keys for Episode 6 shot 4: the eyes (then the head) go to the hiding place, then up to the father's face.
 * Points in figure units before flip (convert scene points with standingLocal). `gap` frames between the glances,
 * `back` (optional) frames after the second glance to hand the look back to the pose.
 */
export const glanceHideThenFather = (o: { hideAt: V; fatherAt: V; start: number; gap?: number; back?: number }): GazeKey[] => {
  const keys: GazeKey[] = [
    { at: o.hideAt, start: o.start },
    { at: o.fatherAt, start: o.start + (o.gap ?? 30) },
  ];
  if (o.back !== undefined) keys.push({ start: o.start + (o.gap ?? 30) + o.back });
  return keys;
};

/** A quick, uneven breath (hurt, after crying): about 1.3 s, some inhales caught in two steps. */
const quickBreath = (L: number): number => {
  const ph = L / 31 + 0.2 * Math.sin(L * 0.05 + 0.9) + 0.1 * Math.sin(L * 0.13 + 2.2);
  const n = Math.floor(ph);
  const u = ph - n;
  const depth = 1 + 0.55 * hash01(n, 71);
  const inF = 0.36;
  if (u < inF) {
    const w = u / inF;
    const hitch = hash01(n, 83) < 0.45;
    const inh = hitch ? (w < 0.5 ? 0.6 * easeSin(w / 0.5) : w < 0.62 ? 0.6 : 0.6 + 0.4 * easeSin((w - 0.62) / 0.38)) : easeSin(w);
    return depth * inh;
  }
  return depth * Math.pow(1 - easeSin((u - inF) / (1 - inF)), 1.2);
};
const hurtBreathW = (props: StandingChildProps, sf: number): number => {
  if (props.hurtBreath !== undefined) return clamp(props.hurtBreath, 0, 1);
  if (props.pose !== "hurtBack") return 0;
  const t = sf - (props.poseStart ?? 0);
  return t < 0 ? 0 : 1 - smooth((t - 8) / (HURT_T.breath - 8));
};
/** A sniff: two quick little inhales, then out (life frames). */
const sniffAt = (list: number[] | undefined, L: number): number => {
  if (!list) return 0;
  let s = 0;
  for (const s0 of list) {
    const t = L - s0;
    if (t < 0 || t >= 15) continue;
    const v = t < 3 ? 0.6 * smooth(t / 3) : t < 5 ? 0.6 - 0.15 * smooth((t - 3) / 2) : t < 8 ? 0.45 + 0.55 * smooth((t - 5) / 3) : 1 - smooth((t - 8) / 7);
    s = Math.max(s, v);
  }
  return s;
};

/* ------------------------------------------------------------------ */
/* Pose solving                                                         */
/* ------------------------------------------------------------------ */

interface PoseVals {
  theta: number; // torso pitch (rad, 0 upright)
  drop: number; // pelvis drop with the knees
  back: number; // pelvis moves back (body Z) to balance
  shiftX: number; // pelvis sideways (weight)
  hipTilt: number;
  stance: number;
  nP: V; // near palm centre (2D figure units)
  fP: V;
  nD: V; // fingertip direction
  fD: V;
  nTurn: number;
  fTurn: number;
  nCurl: number;
  fCurl: number;
  nShape: HandShape;
  fShape: HandShape;
  nContact: number; // 1 = hand in contact with something (no lag)
  fContact: number;
  headNeck: number; // share of the pitch the neck/head follow (0..1)
  headTilt: number; // extra in-plane head tilt, degrees
  lookX: number;
  lookY: number;
  eyesDown: number;
  turnAdd: number;
  close: number;
  surprise: number;
  // Episode 6 (all 0 in the Episode 5 poses)
  nBack: number; // near palm to the small of the back (weight; target from the body each frame)
  fThigh: number; // far palm on the far thigh, as near the knee as the arm reaches
  fFace: number; // far hand at his far eye (the back of the hand: wipeEye)
  fRub: number; // small rub offset while at the eye (units)
  fIk: number; // far elbow chosen by the bend's sense (1) instead of the Episode 5 rule (0): for the hand to the face
  neckAdd: number; // extra neck pitch (radians, + = head lower)
  eyesUp: number;
}

interface Ctx {
  yaw: number;
  props: StandingChildProps;
  life: number; // life frame
}

const sinA = (yaw: number) => Math.sin(YAW_MAX * yaw);
const cosA = (yaw: number) => Math.cos(YAW_MAX * yaw);

interface V3 {
  x: number;
  y: number;
  z: number;
}
const proj = (p: V3, yaw: number): V => {
  const ca = cosA(yaw);
  const sa = sinA(yaw);
  const depth = -p.x * sa + p.z * ca;
  return { x: p.x * ca + p.z * sa, y: p.y + TILT * depth };
};
const depthOf = (p: V3, yaw: number) => -p.x * sinA(yaw) + p.z * cosA(yaw);

/** Pelvis (3D) and the shoulder joints (2D) for a pitch, used by the reach solver and the geometry. */
const pelvis3 = (theta: number, drop: number, back: number, shiftX: number): V3 => ({ x: shiftX, y: HIP_Y + drop, z: -back });
const axis3 = (theta: number): V3 => ({ x: 0, y: -Math.cos(theta), z: Math.sin(theta) });
const bendDrop = (theta: number) => 40 * smooth(theta / 1.9);
const bendBack = (theta: number) => 30 * Math.sin(clamp(theta, 0, Math.PI / 2));
const shoulders2 = (theta: number, yaw: number, shiftX = 0): { n: V; f: V; c: V } => {
  const P = pelvis3(theta, bendDrop(theta), bendBack(theta), shiftX);
  const ax = axis3(theta);
  const Sc: V3 = { x: P.x, y: P.y + ax.y * TORSO, z: P.z + ax.z * TORSO };
  return {
    c: proj(Sc, yaw),
    n: proj({ ...Sc, x: Sc.x - SH_HALF }, yaw), // near = his right (toward the camera when facing +x)
    f: proj({ ...Sc, x: Sc.x + SH_HALF }, yaw),
  };
};

/** Smallest pitch at which both wrists are within reach (bisection; continuous in the targets). */
const reachTheta = (nW: V, fW: V, yaw: number, minT: number): number => {
  const need = (th: number) => {
    const sh = shoulders2(th, yaw);
    return Math.max(len(sub(nW, sh.n)), len(sub(fW, sh.f))) - REACH;
  };
  if (need(minT) <= 0) return minT;
  let lo = minT;
  let hi = 2.05;
  if (need(hi) > 0) return hi;
  for (let i = 0; i < 22; i++) {
    const m = (lo + hi) / 2;
    if (need(m) > 0) lo = m;
    else hi = m;
  }
  return hi;
};

const wristOf = (palm: V, dir: V): V => sub(palm, mul(dir, PALM_OFF));

/** Hands hanging loose beside the thighs (upright). */
const looseHands = (ctx: Ctx, theta: number, shiftX: number) => {
  const sh = shoulders2(theta, ctx.yaw, shiftX);
  const L = ctx.life;
  const sw = trackAt(SWAY_TRACK, L);
  const fd = trackAt(FIDGET_TRACK, L);
  const ca = cosA(ctx.yaw);
  return {
    nP: add(sh.n, { x: -8 * ca + 3 + 2.5 * sw, y: 150 }),
    fP: add(sh.f, { x: 8 * ca + 2 - 2 * sw, y: 148 }),
    nD: unit({ x: 0.08 + 0.03 * sw, y: 1 }),
    fD: unit({ x: 0.1 - 0.03 * sw, y: 1 }),
    nTurn: -2.35 + 0.08 * fd,
    fTurn: -0.75 - 0.08 * fd,
    nCurl: clamp(0.3 + 0.12 * fd, 0.1, 0.6),
    fCurl: clamp(0.32 - 0.1 * fd, 0.1, 0.6),
  };
};

const BASE: Omit<PoseVals, "nP" | "fP" | "nD" | "fD" | "nTurn" | "fTurn" | "nCurl" | "fCurl"> = {
  theta: 0,
  drop: 0,
  back: 0,
  shiftX: 0,
  hipTilt: 0,
  stance: 0.3,
  nShape: "relaxed",
  fShape: "relaxed",
  nContact: 0,
  fContact: 0,
  headNeck: 0.5,
  headTilt: 0,
  lookX: 0,
  lookY: 0,
  eyesDown: 0,
  turnAdd: 0,
  close: 0,
  surprise: 0,
  nBack: 0,
  fThigh: 0,
  fFace: 0,
  fRub: 0,
  fIk: 0,
  neckAdd: 0,
  eyesUp: 0,
};

/** Hands hanging loose, healthy build (BAL-26c): a small gap from the body, a soft elbow bend, relaxed curls. */
const looseHandsH = (ctx: Ctx, theta: number, shiftX: number) => {
  const sh = shoulders2(theta, ctx.yaw, shiftX);
  const L = ctx.life;
  const sw = trackAt(SWAY_TRACK, L);
  const fd = trackAt(FIDGET_TRACK, L);
  const ca = cosA(ctx.yaw);
  return {
    nP: add(sh.n, { x: -15 * ca + 4 + 2.5 * sw, y: 126 }),
    fP: add(sh.f, { x: 13 * ca + 4 - 2 * sw, y: 124 }),
    nD: unit({ x: 0.16 + 0.04 * sw, y: 1 }),
    fD: unit({ x: 0.2 - 0.04 * sw, y: 1 }),
    nTurn: -2.2 + 0.08 * fd,
    fTurn: -0.85 - 0.08 * fd,
    nCurl: clamp(0.4 + 0.1 * fd, 0.2, 0.62),
    fCurl: clamp(0.42 - 0.08 * fd, 0.2, 0.62),
  };
};

/**
 * BAL-26c healthy build: the same poses held upright and open (head up, weight on one leg with an easy sway, arms clear
 * of the body), the hurt bend less collapsed, holdOut with the elbows at the sides, giveOut leaning in. Classic: unchanged.
 */
const healthyAdjust = (pose: StandingPose, v: PoseVals, f: number, ctx: Ctx): PoseVals => {
  const p = ctx.props;
  const L = ctx.life;
  const o: PoseVals = { ...v };
  const fd = trackAt(FIDGET_TRACK, L);
  if (pose === "standIdle" || pose === "rise") {
    const w = trackAt(WEIGHT_TRACK, L);
    o.shiftX = 6.8 * w + 1.3 * wob(L, 2.9, 0.22);
    o.hipTilt = 4.4 * w;
    o.headTilt = -1.6 * w - 2;
    Object.assign(o, looseHandsH(ctx, 0, o.shiftX));
  } else if (pose === "handInHands") {
    const h = looseHandsH(ctx, 0.12, 0);
    if (!p.handTargets?.far) o.fP = h.fP;
    o.fD = h.fD;
    o.headTilt = v.headTilt - 2;
  } else if (pose === "standQuiet") {
    const dy = HIP_Y - 8 + 238;
    o.nP = add(v.nP, { x: 2, y: dy });
    o.fP = add(v.fP, { x: 2, y: dy });
    o.headTilt = v.headTilt - 3;
    o.eyesDown = 0.15;
    o.nCurl = v.nCurl + 0.06;
  } else if (pose === "standScolded") {
    const dy = HIP_Y + 4 + 229;
    o.nP = add(v.nP, { x: 2, y: dy });
    o.fP = add(v.fP, { x: 2, y: dy });
    o.headTilt = v.headTilt - 2.5;
    o.neckAdd = 0.12;
    o.eyesDown = 0.8;
  } else if (pose === "hurtBack" || pose === "wipeEye") {
    // a hurt child, not an ill one: a smaller bend, the head up, the back of the hand resting at the waist
    if (p.hurtBend === undefined) o.theta = 0.34;
    o.drop = 3;
    o.headTilt = v.headTilt - 3;
    o.neckAdd = -0.06;
    o.nTurn = -1.75;
    o.nCurl = 0.44 + 0.04 * fd;
    if (pose === "wipeEye") {
      // the back of the fingers to the eye, not the fist
      o.fCurl = lerp(0.4, 0.3, v.fFace);
      o.fTurn = lerpA(-2.5, 0.35, v.fFace);
    }
  } else if (pose === "holdOut") {
    // elbows at the sides, forearms angled up, wrists tilted, the note held lightly at the fingertips
    const N0 = p.noteAt ?? { x: 50, y: HIP_Y - 108 };
    const N = add(N0, { x: 0.6 * wob(L, 4.4, 0.5), y: 0.5 * wob(L, 7.1, 0.45) });
    const hw = (p.noteW ?? 34) / 2;
    const a = ((p.noteAngle ?? -6) * Math.PI) / 180;
    const ux: V = { x: Math.cos(a), y: Math.sin(a) };
    const nD = unit({ x: 0.42, y: -0.9 });
    const fD = unit({ x: 0.18, y: -0.98 });
    o.nP = sub(sub(N, mul(ux, hw)), mul(nD, PINCH_OFF));
    o.fP = sub(add(N, mul(ux, hw)), mul(fD, PINCH_OFF));
    o.nD = nD;
    o.fD = fD;
    o.nTurn = -2.55;
    o.fTurn = -0.45;
    o.nCurl = 0.42 + 0.03 * fd;
    o.fCurl = 0.44;
    o.theta = 0.04;
    o.headTilt = -1.5;
  } else if (pose === "giveOut") {
    const h = giveHand(p, f, p.twistAt ?? TWIST_AT, L);
    o.theta = 0.05 + 0.09 * h.lean;
    o.headTilt = v.headTilt - 1.5 + 2 * h.lean;
  }
  return o;
};

function solvePose(pose: StandingPose, f: number, poseStart: number, ctx: Ctx): PoseVals {
  const v = solvePoseBase(pose, f, poseStart, ctx);
  return HB ? healthyAdjust(pose, v, f, ctx) : v;
}

function solvePoseBase(pose: StandingPose, f: number, poseStart: number, ctx: Ctx): PoseVals {
  const p = ctx.props;
  const t = f - poseStart;
  const L = ctx.life;
  const tgN = p.handTargets?.near;
  const tgF = p.handTargets?.far;
  const bendAt = p.bendAt ?? BEND_AT;

  if (pose === "standIdle" || pose === "rise") {
    const w = trackAt(WEIGHT_TRACK, L);
    const shiftX = 4.2 * w;
    const h = looseHands(ctx, 0, shiftX);
    return {
      ...BASE,
      ...h,
      shiftX,
      hipTilt: 2.2 * w,
      stance: p.stance ?? 0.35,
      headTilt: -1.4 * w,
      lookX: trackAt(GLANCE_TRACK, L) * 0.8,
      lookY: trackAt(GLANCE_Y_TRACK, L),
    };
  }
  if (pose === "standQuiet") {
    const w = trackAt(WEIGHT_TRACK, L) * 0.5;
    const shiftX = 2.2 * w;
    const sh = shoulders2(0, ctx.yaw, shiftX);
    const fd = trackAt(FIDGET_TRACK, L);
    const front = 20 * sinA(ctx.yaw);
    const c: V = { x: shiftX * cosA(ctx.yaw) + front + 6, y: -238 };
    return {
      ...BASE,
      shiftX,
      hipTilt: 1.2 * w,
      stance: p.stance ?? 0.3,
      nP: add(c, { x: -3, y: 2 + 0.6 * fd }),
      fP: add(c, { x: 5, y: -4 }),
      nD: unit({ x: 0.75, y: 0.66 }),
      fD: unit({ x: -0.45, y: 0.9 }),
      nTurn: -2.5,
      fTurn: -0.5,
      nCurl: 0.32 + 0.05 * fd,
      fCurl: 0.36,
      eyesDown: 0.35,
      lookX: 0.2 * trackAt(GLANCE_TRACK, L),
      headTilt: 2 - 0.8 * w + 0 * sh.c.x,
    };
  }
  if (pose === "handInHands") {
    const held = p.heldAt ?? HELD_AT;
    const pu = clamp(p.palmUp ?? 0.5, 0, 1);
    const h = looseHands(ctx, 0.12, 0);
    return {
      ...BASE,
      theta: 0.12,
      stance: p.stance ?? 0.4,
      nP: tgN ?? held,
      fP: tgF ?? h.fP,
      nD: unit({ x: 0.92, y: 0.4 }),
      fD: h.fD,
      nTurn: lerp(-2.7, -0.25, pu),
      fTurn: h.fTurn,
      nCurl: 0.22,
      fCurl: h.fCurl,
      nShape: "relaxed",
      nContact: 1,
      headNeck: 0.6,
      headTilt: 4,
      lookX: 0.5,
      lookY: 0.15,
      eyesDown: 0.25,
    };
  }
  // ---- Episode 6 poses ----
  if (pose === "standScolded") {
    // upright, head a little low, hands loosely together in front, eyes down (he takes the scolding silently)
    const w = trackAt(WEIGHT_TRACK, L) * 0.45;
    const shiftX = 2 * w;
    const fd = trackAt(FIDGET_TRACK, L);
    const front = 20 * sinA(ctx.yaw);
    const c: V = { x: shiftX * cosA(ctx.yaw) + front + 3, y: -229 };
    return {
      ...BASE,
      theta: 0.035,
      shiftX,
      hipTilt: 1.1 * w,
      stance: p.stance ?? 0.28,
      nP: add(c, { x: -4, y: 3 + 0.8 * fd }),
      fP: add(c, { x: 5, y: -3 + 0.4 * fd }),
      nD: unit({ x: 0.72, y: 0.7 }),
      fD: unit({ x: -0.5, y: 0.87 }),
      nTurn: -2.5,
      fTurn: -0.5,
      nCurl: 0.4 + 0.07 * fd,
      fCurl: 0.42 - 0.05 * fd,
      headNeck: 0.5,
      headTilt: 6.5 - 0.7 * w,
      neckAdd: 0.2,
      eyesDown: 0.9,
      lookX: 0.1 + 0.08 * trackAt(GLANCE_TRACK, L),
    };
  }
  if (pose === "hurtBack" || pose === "wipeEye") {
    // bent forward a little at the waist, the near hand round at the small of his back, the far hand on his far thigh
    // just above the knee (targets from the body every frame: nBack, fThigh)
    const w = trackAt(WEIGHT_TRACK, L) * 0.3;
    const fd = trackAt(FIDGET_TRACK, L);
    const body: PoseVals = {
      ...BASE,
      theta: p.hurtBend ?? HURT_BEND,
      drop: 6,
      shiftX: 1.4 * w,
      hipTilt: 0.8 * w,
      stance: p.stance ?? 0.55,
      // placeholders: the path the hands take on the way to the computed targets
      nP: { x: -36, y: -262 },
      fP: { x: 44, y: -226 },
      nD: unit({ x: -0.15, y: 1 }),
      fD: unit({ x: 0.45, y: 1 }),
      nTurn: -2.95,
      fTurn: -2.5,
      nCurl: 0.24 + 0.04 * fd,
      fCurl: 0.4 - 0.05 * fd,
      nContact: 1,
      fContact: 1,
      nBack: 1,
      fThigh: 1,
      headNeck: 0.55,
      headTilt: 2 - 0.5 * w,
      lookX: 0.3 + 0.12 * trackAt(GLANCE_TRACK, L),
      lookY: 0.15,
      eyesDown: 0.45,
    };
    if (pose === "hurtBack") return body;
    // wipeEye: the back of the far hand up to his far eye, a small rub, then down to the thigh again
    const up = easeIO(t / WIPE_T.up);
    const down = easeIO((t - WIPE_T.rubEnd) / (WIPE_T.down - WIPE_T.rubEnd));
    const face = up * (1 - down);
    const rubEnv = smooth((t - WIPE_T.up + 3) / 5) * (1 - smooth((t - WIPE_T.rubEnd + 5) / 5));
    return {
      ...body,
      fP: { x: 40, y: -312 }, // through the front of the chest on the way up and down
      fD: unit({ x: 0.1, y: -1 }),
      fThigh: 1 - face,
      fFace: face,
      fRub: rubEnv * 2.4 * Math.sin((t - WIPE_T.up) * 0.62),
      fIk: 1,
      fCurl: lerp(0.4, 0.7, face),
      fTurn: lerp(-2.5, -0.9, face),
      close: 0.42 * rubEnv,
      headTilt: body.headTilt + 3.5 * face,
      eyesDown: lerp(0.45, 0.25, face),
    };
  }
  if (pose === "holdOut") {
    // both hands hold a small folded note out at chest height (thumb-and-finger pinch at its two side edges)
    const N0 = p.noteAt ?? NOTE_AT;
    const N = add(N0, { x: 0.6 * wob(L, 4.4, 0.5), y: 0.5 * wob(L, 7.1, 0.45) });
    const hw = (p.noteW ?? NOTE_W) / 2;
    const a = ((p.noteAngle ?? -4) * Math.PI) / 180;
    const ux: V = { x: Math.cos(a), y: Math.sin(a) };
    const cN = sub(N, mul(ux, hw));
    const cF = add(N, mul(ux, hw));
    const nD = unit({ x: 0.62, y: -0.78 });
    const fD = unit({ x: 0.05, y: -1 });
    return {
      ...BASE,
      theta: 0.07,
      stance: p.stance ?? 0.35,
      nP: sub(cN, mul(nD, PINCH_OFF)),
      fP: sub(cF, mul(fD, PINCH_OFF)),
      nD,
      fD,
      nTurn: -2.75,
      fTurn: -0.35,
      nCurl: 0.5,
      fCurl: 0.52,
      nContact: 1,
      fContact: 1,
      headNeck: 0.55,
      headTilt: -1,
      lookX: 0.45,
      lookY: -0.05,
      eyesDown: 0.05,
    };
  }
  if (pose === "giveOut") {
    // the far hand holds the paper twist at the chest; the near hand takes a lozenge from it and puts it in a palm
    const tw = p.twistAt ?? TWIST_AT;
    const h = giveHand(p, f, tw, L);
    return {
      ...BASE,
      theta: 0.08,
      stance: p.stance ?? 0.4,
      nP: h.P,
      nD: h.D,
      nTurn: h.turn,
      nCurl: h.curl,
      nShape: "relaxed",
      nContact: h.contact,
      fP: add(tw, { x: 0, y: 0.5 * wob(L, 2.2, 0.4) }),
      fD: unit({ x: -0.78, y: 0.62 }),
      fTurn: -1.7,
      fCurl: 0.66,
      fShape: "hold",
      fContact: 1,
      headNeck: 0.6,
      headTilt: 3,
      lookX: 0.5,
      lookY: 0.35,
      eyesDown: 0.35,
    };
  }
  // ---- bend family ----
  const fd = trackAt(FIDGET_TRACK, L);
  const restN: V = add(bendAt, { x: -16 + 2 * fd, y: 3 });
  const restF: V = add(bendAt, { x: 18 - 1.5 * fd, y: -3 });
  let nP = tgN ?? restN;
  let fP = tgF ?? restF;
  let nD = unit({ x: 0.35, y: 1 });
  let fD = unit({ x: 0.45, y: 1 });
  let nTurn = -2.3;
  let fTurn = -0.9;
  let nCurl = 0.34 + 0.08 * fd;
  let fCurl = 0.34 - 0.06 * fd;
  let nShape: HandShape = "relaxed";
  let fShape: HandShape = "relaxed";
  let nContact = 0.6;
  let fContact = 0.6;
  let lookX = 0.35;
  let lookY = 0.35;
  let eyesDown = 0.75;
  let close = 0;
  let surprise = 0;
  let headTilt = 0;
  if (pose === "turnTortoise") {
    const r = turnTortoiseRim(t, bendAt);
    nP = tgN ?? r.near;
    fP = tgF ?? r.far;
    nShape = "hold";
    fShape = "hold";
    nTurn = -1.95;
    fTurn = -1.1;
    nCurl = 0.62;
    fCurl = 0.62;
    nD = unit({ x: 0.55, y: 0.85 });
    fD = unit({ x: 0.1 + 0.4 * Math.cos(r.phi), y: 1 });
    nContact = 1;
    fContact = 1;
    eyesDown = 0.6;
    headTilt = 3 * Math.sin(r.phi);
  } else if (pose === "reachGrab") {
    const at = tgN ?? p.reachAt ?? REACH_AT;
    const k = easeIO(t / REACH_T.reach);
    // a small anticipation: the hand lifts a little on the way
    const arc = Math.sin(Math.PI * clamp(t / REACH_T.reach, 0, 1)) * 14;
    nP = add(lerpV(restN, at, k), { x: 0, y: -arc });
    nD = unit(lerpV({ x: 0.35, y: 1 }, { x: 0.75, y: 0.7 }, k));
    nCurl = t < REACH_T.reach ? lerp(0.3, 0.06, k) : lerp(0.06, 0.6, smooth((t - REACH_T.reach) / (REACH_T.grip - REACH_T.reach)));
    nShape = t < REACH_T.reach ? (nCurl < 0.17 ? "open" : "relaxed") : "hold";
    nTurn = -2.1;
    nContact = t >= REACH_T.reach ? 1 : 0;
    lookX = 0.45;
  } else if (pose === "bitten") {
    const at = tgN ?? p.biteAt ?? p.reachAt ?? REACH_AT;
    nP = at;
    nD = unit({ x: 0.7, y: 0.72 });
    nShape = "relaxed";
    nCurl = 0.18;
    nTurn = -2.0;
    nContact = 1;
    // far hand on his far knee: set from the knee in the geometry pass (flag with NaN)
    fP = tgF ?? { x: NaN, y: NaN };
    fD = unit({ x: 0.85, y: 0.55 });
    fTurn = -2.3;
    fCurl = 0.42;
    fContact = 1;
    lookX = 0.55;
    lookY = 0.15;
    eyesDown = 0.4; // the regard: the face lifts a little toward the tortoise
    const es = p.expressionStart ?? poseStart;
    const te = f - es;
    surprise = te < 0 ? 0 : te < 3 ? smooth(te / 3) : 1 - smooth((te - 10) / 16);
    // the blink of surprise
    close = te > 3 && te < 16 ? Math.sin((Math.PI * (te - 3)) / 13) : 0;
    headTilt = -5 - 3 * surprise;
  }
  return {
    ...BASE,
    stance: p.stance ?? 1,
    nP,
    fP,
    nD,
    fD,
    nTurn,
    fTurn,
    nCurl,
    fCurl,
    nShape,
    fShape,
    nContact,
    fContact,
    theta: -1, // solved from the targets in the geometry pass
    headNeck: 0.5,
    headTilt,
    lookX,
    lookY,
    eyesDown,
    close,
    surprise,
  };
}

const blendVals = (a: PoseVals, b: PoseVals, k: number, kHead: number): PoseVals => {
  const lv = (x: V, y: V, t: number) => (Number.isNaN(x.x) || Number.isNaN(y.x) ? (t < 0.5 ? x : y) : lerpV(x, y, t));
  return {
    theta: lerp(a.theta, b.theta, k),
    drop: lerp(a.drop, b.drop, k),
    back: lerp(a.back, b.back, k),
    shiftX: lerp(a.shiftX, b.shiftX, k),
    hipTilt: lerp(a.hipTilt, b.hipTilt, k),
    stance: lerp(a.stance, b.stance, k),
    nP: lv(a.nP, b.nP, k),
    fP: lv(a.fP, b.fP, k),
    nD: unit(lerpV(a.nD, b.nD, k)),
    fD: unit(lerpV(a.fD, b.fD, k)),
    nTurn: lerpA(a.nTurn, b.nTurn, k),
    fTurn: lerpA(a.fTurn, b.fTurn, k),
    nCurl: lerp(a.nCurl, b.nCurl, k),
    fCurl: lerp(a.fCurl, b.fCurl, k),
    nShape: k < 0.5 ? a.nShape : b.nShape,
    fShape: k < 0.5 ? a.fShape : b.fShape,
    nContact: lerp(a.nContact, b.nContact, k),
    fContact: lerp(a.fContact, b.fContact, k),
    headNeck: lerp(a.headNeck, b.headNeck, kHead),
    headTilt: lerp(a.headTilt, b.headTilt, kHead),
    lookX: lerp(a.lookX, b.lookX, kHead),
    lookY: lerp(a.lookY, b.lookY, kHead),
    eyesDown: lerp(a.eyesDown, b.eyesDown, kHead),
    turnAdd: lerp(a.turnAdd, b.turnAdd, kHead),
    close: lerp(a.close, b.close, k),
    surprise: lerp(a.surprise, b.surprise, k),
    nBack: lerp(a.nBack, b.nBack, k),
    fThigh: lerp(a.fThigh, b.fThigh, k),
    fFace: lerp(a.fFace, b.fFace, k),
    fRub: lerp(a.fRub, b.fRub, k),
    fIk: k < 0.5 ? a.fIk : b.fIk,
    neckAdd: lerp(a.neckAdd, b.neckAdd, kHead),
    eyesUp: lerp(a.eyesUp, b.eyesUp, kHead),
  };
};

/* ------------------------------------------------------------------ */
/* Geometry                                                             */
/* ------------------------------------------------------------------ */

interface Leg {
  hip: V;
  knee: V;
  ankle: V;
  ground: number; // sole y
  toeDir: number; // signed foreshortened toe direction
  depth: number;
}

interface Arm {
  sh: V;
  E: V;
  W: V; // wrist
  P: V; // palm centre
  dir: V;
  turn: number;
  curl: number;
  shape: HandShape;
  side: 1 | -1;
}

interface Geom {
  yaw: number;
  theta: number;
  P3: V3;
  ax3: V3;
  P: V; // pelvis 2D
  ax: V; // projected torso axis (unit)
  axLen: number; // projected length factor
  Sc: V;
  legN: Leg;
  legF: Leg;
  armN: Arm;
  armF: Arm;
  neckBase: V;
  neckTop: V;
  head: V;
  headRot: number;
  breath: number;
  vals: PoseVals;
  gravity: number; // 0 upright .. 1 fully bent (how much free cloth hangs off the body)
  /** Episode 6: the gaze (null without keys) and the head-shake turn (0 without headShake). */
  gz: GazeOut | null;
  shakeTurn: number;
}

/** Two-bone IK in 2D; side picks the bend (+1 = elbow toward +x). */
const ik2 = (S: V, T: V, a: number, b: number, side: number): { E: V; H: V } => {
  let d = sub(T, S);
  let dl = len(d);
  const maxD = a + b - 0.5;
  const minD = Math.abs(a - b) + 0.5;
  if (dl > maxD) {
    d = mul(d, maxD / dl);
    dl = maxD;
  }
  if (dl < minD) {
    d = dl < 0.01 ? { x: 0, y: minD } : mul(d, minD / dl);
    dl = minD;
  }
  const u = mul(d, 1 / dl);
  const aa = (a * a - b * b + dl * dl) / (2 * dl);
  const h = Math.sqrt(Math.max(a * a - aa * aa, 0));
  const B = add(S, mul(u, aa));
  const c1 = { x: B.x - u.y * h, y: B.y + u.x * h };
  const c2 = { x: B.x + u.y * h, y: B.y - u.x * h };
  const E = side * c1.x >= side * c2.x ? c1 : c2;
  return { E, H: add(S, d) };
};

/** Episode 6: two-bone IK in 2D that keeps the elbow on one side of the shoulder-to-hand line (by the bend's sense),
 * continuous as the hand rises past the shoulder; equals ik2(..., -1) whenever the hand is below the shoulder. */
const ikSense = (S: V, T: V, a: number, b: number): { E: V; H: V } => {
  let d = sub(T, S);
  let dl = len(d);
  const maxD = a + b - 0.5;
  const minD = Math.abs(a - b) + 0.5;
  if (dl > maxD) {
    d = mul(d, maxD / dl);
    dl = maxD;
  }
  if (dl < minD) {
    d = dl < 0.01 ? { x: 0, y: minD } : mul(d, minD / dl);
    dl = minD;
  }
  const u = mul(d, 1 / dl);
  const aa = (a * a - b * b + dl * dl) / (2 * dl);
  const h = Math.sqrt(Math.max(a * a - aa * aa, 0));
  const B = add(S, mul(u, aa));
  return { E: { x: B.x - u.y * h, y: B.y + u.x * h }, H: add(S, d) };
};

/** Two-bone IK in 3D with a pole direction (the knee bends toward it). */
const ik3 = (S: V3, T: V3, a: number, b: number, pole: V3): V3 => {
  const d = { x: T.x - S.x, y: T.y - S.y, z: T.z - S.z };
  let dl = Math.hypot(d.x, d.y, d.z) || 1;
  dl = clamp(dl, Math.abs(a - b) + 0.5, a + b - 0.01);
  const u = { x: d.x / (Math.hypot(d.x, d.y, d.z) || 1), y: d.y / (Math.hypot(d.x, d.y, d.z) || 1), z: d.z / (Math.hypot(d.x, d.y, d.z) || 1) };
  const aa = (a * a - b * b + dl * dl) / (2 * dl);
  const h = Math.sqrt(Math.max(a * a - aa * aa, 0));
  const pd = pole.x * u.x + pole.y * u.y + pole.z * u.z;
  let w = { x: pole.x - u.x * pd, y: pole.y - u.y * pd, z: pole.z - u.z * pd };
  const wl = Math.hypot(w.x, w.y, w.z) || 1;
  w = { x: w.x / wl, y: w.y / wl, z: w.z / wl };
  return { x: S.x + u.x * aa + w.x * h, y: S.y + u.y * aa + w.y * h, z: S.z + u.z * aa + w.z * h };
};

const POSE_EXPR: Record<StandingPose, StandingExpression> = {
  standIdle: "serene",
  standQuiet: "serene",
  standBend: "serene",
  turnTortoise: "serene",
  reachGrab: "serene",
  bitten: "surprised-calm",
  rise: "serene",
  handInHands: "serene",
  standScolded: "thoughtful",
  hurtBack: "hurt",
  wipeEye: "hurt",
  holdOut: "serene",
  giveOut: "compassionate",
};

/** Blended pose values at story frame sf (life frame L). */
const valsAt = (props: StandingChildProps, sf: number, L: number, yaw: number): PoseVals => {
  const pose = props.pose ?? "standIdle";
  const ps = props.poseStart ?? 0;
  const ctx: Ctx = { yaw, props, life: L };
  let cur = solvePose(pose, sf, ps, ctx);
  const prev = props.prevPose ?? (pose === "rise" ? "standBend" : undefined);
  const bf = pose === "rise" ? RISE_LEN : props.blendFrames ?? 18;
  if (prev && sf - ps < bf) {
    const pv = solvePose(prev, props.prevPoseStart !== undefined ? sf : ps, props.prevPoseStart ?? ps - 1, ctx);
    const u = (sf - ps) / bf;
    // rise: the head lifts first, then the back unrolls
    const k = pose === "rise" ? easeIO(clamp((u - 0.12) / 0.88, 0, 1)) : easeIO(u);
    const kh = pose === "rise" ? easeIO(clamp(u / 0.6, 0, 1)) : easeIO(clamp(u * 1.25, 0, 1));
    // Pitch has to be known on both sides before blending: solve the bend side's pitch first.
    if (pv.theta < 0) pv.theta = thetaFor(pv, yaw);
    if (cur.theta < 0) cur.theta = thetaFor(cur, yaw);
    cur = blendVals(pv, cur, k, kh);
  } else if (cur.theta < 0) {
    cur.theta = thetaFor(cur, yaw);
  }
  if (pose === "hurtBack") {
    // the swat: a quick flinch forward (the head lags, the eyes squeeze), then the settle into the hurt bend
    const amp = props.flinch ?? 1;
    const t = sf - ps;
    if (amp > 0 && t >= 0 && t < HURT_T.settle) {
      const imp = t < HURT_T.peak ? smooth(t / HURT_T.peak) : 1 - smooth((t - HURT_T.peak) / (HURT_T.settle - HURT_T.peak));
      cur = {
        ...cur,
        theta: cur.theta + 0.24 * amp * imp,
        drop: cur.drop + 5 * amp * imp,
        headTilt: cur.headTilt - 6 * amp * Math.sin(Math.PI * clamp(t / 9, 0, 1)),
        close: Math.max(cur.close, 0.8 * amp * Math.sin(Math.PI * clamp((t - 1) / 10, 0, 1))),
      };
    }
  }
  return cur;
};

/** Pitch for a bend pose: from its hand targets (the far-knee hand uses the near target's height). */
const thetaFor = (v: PoseVals, yaw: number): number => {
  const nW = wristOf(v.nP, v.nD);
  const fW = Number.isNaN(v.fP.x) ? nW : wristOf(v.fP, v.fD);
  return reachTheta(nW, fW, yaw, 0.55);
};

const buildGeom = (props: StandingChildProps, sf: number, L: number): Geom => {
  const yaw = clamp(yawOf(props, sf), 0, 1);
  const v = valsAt(props, sf, L, yaw);
  const theta = v.theta;
  const drop = bendDrop(theta) + v.drop;
  const back = bendBack(theta) + v.back;
  const P3 = pelvis3(theta, drop, back, v.shiftX);
  const ax3 = axis3(theta);
  const P = proj(P3, yaw);
  const ScRaw = proj({ x: P3.x, y: P3.y + ax3.y * TORSO, z: P3.z + ax3.z * TORSO }, yaw);
  const axV = sub(ScRaw, P);
  const axLen = len(axV) / TORSO;
  const ax = unit(axV);

  // breath (life clock; shallow while speaking)
  const speak = props.talk ?? ((props.mouth ?? 0) > 0.02 ? 1 : 0);
  let b = breathAt(L, speak, props.sigh, sf);
  let bLate = breathAt(L - 4, speak, props.sigh, sf - 4);
  // Episode 6: quick uneven breathing after the swat, settling (quieter while speaking); sniffs
  const hb = hurtBreathW(props, sf);
  if (hb > 0) {
    const w = hb * (1 - 0.6 * clamp(speak, 0, 1));
    b = lerp(b, quickBreath(L), w);
    bLate = lerp(bLate, quickBreath(L - 4), w);
  }
  const sn = sniffAt(props.sniffAt, L);
  if (props.sniffAt) {
    b += 0.9 * sn;
    bLate += 0.9 * sniffAt(props.sniffAt, L - 4);
  }
  const rise = 1.1 * b; // shoulder rise in units (about 1 px at the QA scale ... 2 px)

  // legs (3D, feet planted)
  const st = clamp(v.stance, 0, 1);
  const ax0 = 11 + 11 * st;
  const legFor = (sideX: number, nearLeg: boolean): Leg => {
    const ank3: V3 = { x: sideX * ax0, y: -ANKLE_H, z: nearLeg ? 2 : -2 };
    const hip3: V3 = { x: P3.x + sideX * HIP_HALF, y: P3.y + sideX * v.hipTilt * 0.5, z: P3.z };
    const knee3 = ik3(hip3, ank3, THIGH, SHIN, { x: sideX * 0.18, y: 0, z: 1 });
    const turnOut = sideX * 0.18;
    const toe = Math.sin(YAW_MAX * yaw + turnOut);
    const toeDir = Math.sign(toe || 1) * Math.max(0.34, Math.abs(toe));
    return {
      hip: proj(hip3, yaw),
      knee: proj(knee3, yaw),
      ankle: proj(ank3, yaw),
      ground: proj({ ...ank3, y: 0 }, yaw).y,
      toeDir,
      depth: depthOf(ank3, yaw),
    };
  };
  const legN = legFor(-1, true);
  const legF = legFor(1, false);

  // shoulders, with breath
  const Sc3: V3 = { x: P3.x, y: P3.y + ax3.y * TORSO, z: P3.z + ax3.z * TORSO };
  const shN = add(proj({ ...Sc3, x: Sc3.x - SH_HALF }, yaw), { x: 0, y: -rise });
  const shF = add(proj({ ...Sc3, x: Sc3.x + SH_HALF }, yaw), { x: 0, y: -rise });
  const Sc = add(ScRaw, { x: 0, y: -rise * 0.8 });

  // neck and head. Upright the head sits on the neck. In the bend the neck continues the spine's line with a slight
  // lift and joins the back of the skull; the head (a three-quarter face) rolls only a little (at most about 13
  // degrees) and looks DOWN at the hands with the eyes, seen a little from above.
  const gvH = smooth(theta / 1.4);
  const neckPitch0 = lerp(theta * lerp(0.35, 0.62, v.headNeck), Math.max(0, theta - 0.62), gvH);
  const neckBase = add(Sc, mul(ax, -4));
  const headBreath = 0.35 * bLate;
  const headRot0 = 13 * gvH + v.headTilt + 0.6 * wob(L, 3.3, 0.4);
  const neckTopLocal = lerpV({ x: 2, y: 20 }, { x: -13, y: 15 }, gvH);
  const hs = props.headScale ?? 1;
  const headAt = (neckPitch: number, headRot: number) => {
    const nd3 = axis3(neckPitch);
    const ndP = proj(nd3, yaw);
    const rr = (headRot * Math.PI) / 180;
    const rotL = (p: V): V => ({ x: p.x * Math.cos(rr) - p.y * Math.sin(rr), y: p.x * Math.sin(rr) + p.y * Math.cos(rr) });
    const neckTop = add(add(neckBase, mul(ndP, HB ? lerp(34, 22, gvH) * hs * NECK_L : lerp(34, 22, gvH) * hs)), { x: 0, y: -headBreath });
    const head = sub(neckTop, mul(rotL(neckTopLocal), HEAD_K * hs));
    return { neckTop, head, rotL };
  };
  // Episode 6 additions (opt-in): extra neck pitch, the gaze (eyes lead, the head follows), a head shake, a sniff
  let neckPitch = v.neckAdd ? neckPitch0 + v.neckAdd : neckPitch0;
  let headRot = headRot0;
  let hd = headAt(neckPitch, headRot);
  const gKeys = gazeKeysOf(props);
  const gz = gKeys ? gazeFor(gKeys, sf, hd.head, { eyeX: v.lookX, eyeY: v.lookY, up: v.eyesUp, turn: 0, tilt: 0, neck: 0 }) : null;
  const shakeAmt = clamp(props.headShake ?? 0, 0, 1);
  const shakeTurn = shakeAmt > 0 ? shakeAmt * 0.3 * Math.sin((2 * Math.PI * sf) / 22) : 0;
  if (gz || shakeAmt > 0 || sn > 0) {
    if (gz) {
      neckPitch += gz.neck;
      headRot += gz.tilt;
    }
    if (shakeAmt > 0) headRot += shakeAmt * 1.2 * Math.sin((2 * Math.PI * sf) / 22 + 0.6);
    if (sn > 0) headRot -= 1.6 * sn;
    hd = headAt(neckPitch, headRot);
  }
  const { neckTop, head } = hd;

  // Episode 6 computed hand targets (used only when the pose's weights are on)
  const hwBk = (w: number) => 1.08 * Math.hypot(w * cosA(yaw), 0.82 * w * sinA(yaw)) * lerp(1, 0.8, smooth(theta / 1.4)) * (HB ? TORSO_W : 1);
  const backTarget = (): { p: V; d: V } => {
    const c = proj({ x: P3.x, y: P3.y + ax3.y * 14, z: P3.z + ax3.z * 14 }, yaw);
    const pa = perpL(ax);
    return { p: sub(c, mul(pa, hwBk(24) - 2)), d: unit(add(mul(ax, -1), mul(pa, 0.6))) };
  };
  const thighTarget = (sh: V): { p: V; d: V } => {
    const td = unit(sub(legF.knee, legF.hip));
    let n = perpL(td);
    if (n.x < 0) n = mul(n, -1);
    const d = unit(add(mul(td, 0.8), mul(n, 0.3)));
    const Q = (fr: number) => add(lerpV(legF.hip, legF.knee, fr), mul(n, 9));
    const ok = (fr: number) => len(sub(wristOf(Q(fr), d), sh)) <= UPPER + FORE - 2;
    let fr = 0.9;
    if (!ok(fr)) {
      let lo = 0.2;
      let hi = 0.9;
      for (let i = 0; i < 18; i++) {
        const m = (lo + hi) / 2;
        if (ok(m)) lo = m;
        else hi = m;
      }
      fr = lo;
    }
    return { p: Q(fr), d };
  };
  const faceTarget = (rub: number): { p: V; d: V } => {
    const T = 1.35 * yaw + 0.22 * v.lookX + v.turnAdd + (gz ? gz.turn : 0) + shakeTurn;
    const age = props.age ?? 6;
    const e0 = props.flip ? plateEyeAt(-T, age, -1) : plateEyeAt(T, age, 1);
    const eL = props.flip ? { x: -e0.x, y: e0.y } : e0;
    const eye = add(head, mul(hd.rotL(eL), HEAD_K * hs));
    const d = HB ? unit({ x: -0.42, y: -0.9 }) : unit({ x: -0.3, y: -1 });
    return HB ? { p: add(add(eye, { x: 9, y: 5 }), add(mul(d, -20), mul(perpL(d), rub))), d } : { p: add(add(eye, { x: 7, y: 4 }), add(mul(d, -12), mul(perpL(d), rub))), d };
  };

  // arms: upper arm leads (targets at sf), forearm trails 3 f, fingers 6 f, unless in contact
  const solveArm = (side: "n" | "f", vv: PoseVals, vLag3: PoseVals, vLag6: PoseVals): Arm => {
    const near = side === "n";
    const sh = near ? shN : shF;
    let palm = near ? vv.nP : vv.fP;
    let dir = near ? vv.nD : vv.fD;
    if (Number.isNaN(palm.x)) palm = add(legF.knee, { x: 20, y: -1 }); // far hand on the front of the far knee (bitten)
    const contact = clamp(near ? vv.nContact : vv.fContact, 0, 1);
    const lagW = 1 - contact;
    let palmLag = near ? vLag3.nP : vLag3.fP;
    if (Number.isNaN(palmLag.x)) palmLag = palm;
    let dirLag = near ? vLag3.nD : vLag3.fD;
    // Episode 6: targets computed from the body (back, thigh, eye), blended in by the pose's weights
    const e6 = (vals: PoseVals, p0: V, d0: V): { p: V; d: V } => {
      let p1 = p0;
      let d1 = d0;
      if (near && vals.nBack > 0) {
        const bt = backTarget();
        p1 = lerpV(p1, bt.p, vals.nBack);
        d1 = unit(lerpV(d1, bt.d, vals.nBack));
      }
      if (!near && vals.fThigh > 0) {
        const tt = thighTarget(sh);
        p1 = lerpV(p1, tt.p, vals.fThigh);
        d1 = unit(lerpV(d1, tt.d, vals.fThigh));
      }
      if (!near && vals.fFace > 0) {
        const ft = faceTarget(vals.fRub);
        p1 = lerpV(p1, ft.p, vals.fFace);
        d1 = unit(lerpV(d1, ft.d, vals.fFace));
      }
      return { p: p1, d: d1 };
    };
    if (vv.nBack > 0 || vv.fThigh > 0 || vv.fFace > 0) {
      const c = e6(vv, palm, dir);
      palm = c.p;
      dir = c.d;
    }
    if (vLag3.nBack > 0 || vLag3.fThigh > 0 || vLag3.fFace > 0) {
      const c = e6(vLag3, palmLag, dirLag);
      palmLag = c.p;
      dirLag = c.d;
    }
    const W = wristOf(palm, dir);
    const WLag = lerpV(W, wristOf(palmLag, dirLag), lagW);
    // Episode 6: the far hand to the face keeps the elbow on the bend's own side (continuous while the hand rises)
    const ikArm = !near && vv.fIk > 0.5 ? ikSense : (S: V, T: V, a: number, b: number) => ik2(S, T, a, b, -1);
    let { E } = ikArm(sh, W, UPPER, FORE);
    // Episode 6 hurtBack: the hand at the small of the back. The upper arm hangs down and back (HURT_ELBOW_DEG from
    // vertical), the elbow bent behind the hip line; the forearm runs round the body to the back, so it is drawn
    // foreshortened (shorter than FORE) instead of the 2D IK lifting the elbow up into a wing.
    if (near && vv.nBack > 0) {
      // the elbow swings by angle (from vertical, + = back) from where the IK put it to the hanging-back angle; never
      // above that angle (no wing on the way)
      const aB = ((HB ? 38 : HURT_ELBOW_DEG) * Math.PI) / 180;
      const d0 = sub(E, sh);
      const a0 = Math.min(Math.atan2(-d0.x, d0.y), aB);
      const a = lerp(a0, aB, vv.nBack);
      const l = lerp(len(d0), UPPER * 0.96, vv.nBack);
      let Eb = add(sh, mul({ x: -Math.sin(a), y: Math.cos(a) }, l));
      const dW = len(sub(W, Eb));
      if (dW > FORE * 0.97) Eb = add(W, mul(unit(sub(Eb, W)), FORE * 0.97));
      E = Eb;
    }
    // forearm from the elbow toward the lagging wrist (keeps the length)
    const fa = unit(sub(WLag, E));
    let Wd = add(E, mul(fa, FORE));
    // in contact the wrist is exactly where the target puts it
    if (contact > 0.01) {
      const ex = ikArm(sh, W, UPPER, FORE);
      Wd = lerpV(Wd, ex.H, contact);
    }
    // keep the hand within a natural wrist bend of the forearm
    const faDir = unit(sub(Wd, E));
    const ang = Math.atan2(dir.y, dir.x);
    const fang = Math.atan2(faDir.y, faDir.x);
    const dA = clamp(wrapA(ang - fang), -1.1, 1.1);
    dir = { x: Math.cos(fang + dA), y: Math.sin(fang + dA) };
    // BAL-26c healthy: the hand's angle trails the forearm a little, then settles (the wrist leads and follows through)
    if (HB && lagW > 0.01) {
      const dl = near ? vLag6.nD : vLag6.fD;
      const dd = unit(lerpV(dir, dl, 0.45 * lagW));
      const a2 = clamp(wrapA(Math.atan2(dd.y, dd.x) - fang), -1.1, 1.1);
      dir = { x: Math.cos(fang + a2), y: Math.sin(fang + a2) };
    }
    // the palm centre of the hand as drawn (wrist + hand direction); equals the target whenever it is in reach
    const P = add(Wd, mul(dir, PALM_OFF));
    const curlLag = near ? vLag6.nCurl : vLag6.fCurl;
    const curlNow = near ? vv.nCurl : vv.fCurl;
    return {
      sh,
      E,
      W: Wd,
      P,
      dir,
      turn: near ? vv.nTurn : vv.fTurn,
      curl: lerp(curlNow, curlLag, lagW),
      shape: near ? vv.nShape : vv.fShape,
      side: near ? -1 : 1,
    };
  };
  const v3 = valsAt(props, sf - 3, L - 3, yaw);
  const v6 = valsAt(props, sf - 6, L - 6, yaw);
  const armN = solveArm("n", v, v3, v6);
  const armF = solveArm("f", v, v3, v6);

  return {
    yaw,
    theta,
    P3,
    ax3,
    P,
    ax,
    axLen,
    Sc,
    legN,
    legF,
    armN,
    armF,
    neckBase,
    neckTop,
    head,
    headRot,
    breath: b,
    vals: v,
    gravity: smooth(theta / 1.4),
    gz,
    shakeTurn,
  };
};

/* ------------------------------------------------------------------ */
/* Face                                                                 */
/* ------------------------------------------------------------------ */

const toPlateExpr = (e: StandingExpression): PlateExpression => (e === "surprised-calm" ? "playful" : e);

const faceFor = (props: StandingChildProps, g: Geom, L: number, sf: number): PlateFaceState => {
  const pose = props.pose ?? "standIdle";
  const v = g.vals;
  let expr = props.expression ?? POSE_EXPR[pose];
  let prevE = props.prevExpression ?? (props.prevPose ? POSE_EXPR[props.prevPose] : undefined);
  let exprStart = props.expressionStart ?? props.poseStart ?? 0;
  // wipeEye: hurt, then the small forgiving smile after the hand comes down (unless the scene sets the expression)
  if (pose === "wipeEye" && props.expression === undefined) {
    expr = "forgiving";
    prevE = props.prevExpression ?? "hurt";
    exprStart = props.expressionStart ?? (props.poseStart ?? 0) + WIPE_T.smile;
  }
  // eyes lead: gaze uses the current look; the head turn follows about 5 frames later (valsAt at sf - 5)
  const vh = valsAt(props, sf - 5, L - 5, g.yaw);
  let lookX = props.face?.lookX ?? v.lookX;
  let headLookX = props.face?.lookX ?? vh.lookX;
  let lookY = props.face?.lookY ?? v.lookY;
  let eyesDown = props.face?.eyesDown ?? v.eyesDown;
  let eyesUp: number | undefined;
  let turnX = 0;
  // Episode 6: gaze keys (the head turn comes from the gaze, the eyes counter it as it arrives) and the head shake
  if (g.gz) {
    const gz = g.gz;
    headLookX = 0;
    lookX = props.face?.lookX ?? clamp(gz.eyeX - 0.35 * gz.turn, -1, 1);
    lookY = props.face?.lookY ?? gz.eyeY;
    eyesUp = gz.up;
    eyesDown = props.face?.eyesDown ?? eyesDown * (1 - gz.up);
    turnX += gz.turn;
  }
  if (g.shakeTurn) {
    turnX += g.shakeTurn;
    lookX = clamp(lookX - 1.5 * g.shakeTurn, -1, 1);
  }
  const turnBase = 1.35 * g.yaw + 0.22 * headLookX + v.turnAdd; // past three-quarter toward profile (ThakurHeadPlate allows up to 1.8)
  const st = plateFaceState({
    f: sf,
    lifeF: L,
    expression: toPlateExpr(expr),
    prevExpression: prevE ? toPlateExpr(prevE) : undefined,
    expressionStart: exprStart,
    mouth: props.mouth ?? 0,
    turn: turnX ? turnBase + turnX : turnBase,
    lookX: clamp(lookX - 0.25 * headLookX, -1, 1),
    lookY,
    eyesDown,
    eyesUp: eyesUp ?? (v.eyesUp ? v.eyesUp : undefined),
    smile: props.face?.smile,
    close: v.close,
    tear: props.teary,
  });
  if (expr === "surprised-calm" || v.surprise > 0) {
    const sp = v.surprise;
    st.browLift += 2.4 * sp;
    st.lid = clamp(st.lid - 0.12 * sp, 0.03, 0.9);
    st.smile = clamp(st.smile - 0.25 * sp, 0, 1.15);
    // the calm, slightly amused regard afterwards: a softer "playful"
    st.play *= 0.55;
    st.lowLift *= 0.6;
  }
  return st;
};

/* ------------------------------------------------------------------ */
/* Helpers for scenes                                                   */
/* ------------------------------------------------------------------ */

export interface StandingJoints {
  handNear: V;
  handFar: V;
  wristNear: V;
  wristFar: V;
  /** Little-finger edge of each hand (where a tortoise bites). */
  edgeNear: V;
  edgeFar: V;
  footNear: V;
  footFar: V;
  toeNear: V;
  toeFar: V;
  ankleNear: V;
  ankleFar: V;
  kneeNear: V;
  kneeFar: V;
  shoulderNear: V;
  shoulderFar: V;
  head: V;
  headTop: V;
  chin: V;
  chest: V;
  pelvis: V;
  /** Centre of the halo behind the head (BirulGlow anchor): the skull centre, a touch toward the crown. */
  glowAnchor: V;
  /** World size of one head-local unit (for BirulGlow radius etc.; includes headScale). */
  headScale: number;
  /** Torso pitch in radians (0 upright). */
  theta: number;
  /** Episode 6: the thumb-and-index pinch point of each hand (a note edge, a lozenge). */
  pinchNear: V;
  pinchFar: V;
  /**
   * Episode 6 holdOut: the note between the two pinches. `near`/`far` = the near and far hand's contact, `anchor` = the
   * note's centre, `angle` = degrees from the left contact to the right one (world, -90..90), `width` = the distance
   * between the contacts (world px). Present while the pose (or the pose it blends from) is holdOut.
   */
  note?: { near: V; far: V; anchor: V; angle: number; width: number };
  /** Episode 6 giveOut: the paper twist in the far hand: `grip` (the fist), `mouth` (its open top), world. */
  twist?: { grip: V; mouth: V };
  /**
   * Episode 6 giveOut: the current lozenge. `inHand` = carried at pinchNear; `released` = it now lies in the boy's palm
   * at `palm` (world); `index` = which give key (-1 before the first). Keys before `index` are all given.
   */
  give?: { index: number; inHand: boolean; released: boolean; palm: V | null; lozenge: V | null };
}

/** World point (scene px) to figure units for this rig's placement. */
export const standingLocal = (P: V, x: number, y: number, s = 1, flip = false): V => ({ x: ((P.x - x) / s) * (flip ? -1 : 1), y: (P.y - y) / s });

const handEdge = (a: Arm): V => {
  // pinky edge of Hand at turn psi: knuckle X = -0.37 pw, projected x = side * X * cos(psi); halfway down the palm.
  const pw = 0.42 * HAND_L;
  const pl = 0.44 * HAND_L;
  const lx = a.side * (-0.5 * pw) * Math.cos(a.turn) * HAND_SX + a.side * 0.11 * HAND_L * Math.sin(a.turn) * -0.5;
  const ly = 0.55 * pl * HAND_SY;
  const n = perpL(a.dir); // local +x after the hand's rotation (dir is local +y)
  return add(a.W, add(mul({ x: -n.x, y: -n.y }, lx), mul(a.dir, ly)));
};

export const standingChildJoints = (props: StandingChildProps): StandingJoints => {
  applyBuild(props);
  const sf = props.f;
  const L = props.lifeF ?? props.f;
  const g = buildGeom(props, sf, L);
  const s = props.s ?? 1;
  const fl = props.flip ? -1 : 1;
  const W = (p: V): V => ({ x: props.x + fl * s * p.x, y: props.y + s * p.y });
  const footC = (l: Leg): V => ({ x: l.ankle.x + l.toeDir * 7 * FOOT_K, y: l.ground });
  const toeP = (l: Leg): V => ({ x: l.ankle.x + l.toeDir * 24 * FOOT_K, y: l.ground - 2 });
  const rot = (g.headRot * Math.PI) / 180;
  const up = { x: Math.sin(rot), y: -Math.cos(rot) };
  const age = props.age ?? 6;
  const hs = props.headScale ?? 1;
  // Episode 6 attachment points
  const pinchNear = W(add(g.armN.P, mul(g.armN.dir, PINCH_OFF)));
  const pinchFar = W(add(g.armF.P, mul(g.armF.dir, PINCH_OFF)));
  const pose = props.pose ?? "standIdle";
  let note: StandingJoints["note"];
  if (pose === "holdOut" || props.prevPose === "holdOut") {
    const [l, r] = pinchNear.x <= pinchFar.x ? [pinchNear, pinchFar] : [pinchFar, pinchNear];
    note = {
      near: pinchNear,
      far: pinchFar,
      anchor: lerpV(pinchNear, pinchFar, 0.5),
      angle: (Math.atan2(r.y - l.y, r.x - l.x) * 180) / Math.PI,
      width: len(sub(r, l)),
    };
  }
  let twist: StandingJoints["twist"];
  let give: StandingJoints["give"];
  if (pose === "giveOut") {
    const tw = props.twistAt ?? TWIST_AT;
    twist = { grip: W(g.armF.P), mouth: W(add(g.armF.P, sub(twistMouthOf(tw), tw))) };
    const h = giveHand(props, sf, tw, L);
    const keys = giveKeys(props);
    const palm = h.idx >= 0 ? W(keys[h.idx].at) : null;
    give = { index: h.idx, inHand: h.inHand, released: h.released, palm, lozenge: h.inHand ? pinchNear : h.released ? palm : null };
  }
  return {
    handNear: W(g.armN.P),
    handFar: W(g.armF.P),
    wristNear: W(g.armN.W),
    wristFar: W(g.armF.W),
    edgeNear: W(handEdge(g.armN)),
    edgeFar: W(handEdge(g.armF)),
    footNear: W(footC(g.legN)),
    footFar: W(footC(g.legF)),
    toeNear: W(toeP(g.legN)),
    toeFar: W(toeP(g.legF)),
    ankleNear: W(g.legN.ankle),
    ankleFar: W(g.legF.ankle),
    kneeNear: W(g.legN.knee),
    kneeFar: W(g.legF.knee),
    shoulderNear: W(g.armN.sh),
    shoulderFar: W(g.armF.sh),
    head: W(g.head),
    headTop: W(add(g.head, mul(up, -PLATE_HAIR_TOP * HEAD_K * hs))),
    chin: W(add(g.head, mul(up, -plateChinY(age) * HEAD_K * hs))),
    glowAnchor: W(add(g.head, mul(up, 6 * HEAD_K * hs))),
    chest: W(add(g.P, mul(g.ax, TORSO * g.axLen * 0.72))),
    pelvis: W(g.P),
    headScale: HEAD_K * hs * s,
    theta: g.theta,
    pinchNear,
    pinchFar,
    ...(note ? { note } : {}),
    ...(twist ? { twist } : {}),
    ...(give ? { give } : {}),
  };
};

/* ------------------------------------------------------------------ */
/* Drawing pieces                                                       */
/* ------------------------------------------------------------------ */

const wristRadius = (turn: number, hl: number = HAND_L): number => (0.15 * hl * Math.abs(Math.cos(turn)) + 0.11 * hl * Math.abs(Math.sin(turn))) * HAND_SX + 0.4;

const SHAPE_CURL: Record<HandShape, [number, number]> = {
  relaxed: [0.3, 13],
  open: [0.07, 6],
  point: [0.3, 0],
  fist: [1, 0],
  hold: [0.62, 4],
  pranam: [0.03, 4],
  abhaya: [0.07, 6],
  cup: [0.45, 6],
};

type StandingPal = Record<keyof typeof C, string>;

/** The child's arm (shoulder to wrist) and the shared Hand (MOT-19), seamless at the wrist. */
const ArmEl: React.FC<{ a: Arm; id: string; lit: number; fore?: boolean; cloth?: string; edgeK?: number; upFrom?: number; pal?: StandingPal; hl?: number; rk?: number }> = ({ a, id, lit, fore = false, cloth, edgeK, upFrom, pal = C, hl = 50, rk = 1 }) => {
  const wristR = wristRadius(a.turn, hl);
  // Centre line: upper arm, a soft curve through the elbow, forearm
  const E1 = lerpV(a.sh, a.E, 0.8);
  const E2 = lerpV(a.E, a.W, 0.2);
  const curve: V[] = [];
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    curve.push(lerpV(lerpV(E1, a.E, t), lerpV(a.E, E2, t), t));
  }
  // fore: only the forearm (from just past the elbow) and the hand, drawn again over the chadar that hides the elbow
  const F0 = lerpV(a.E, a.W, 0.1);
  // upFrom (Episode 6): the fore piece starts this far down the upper arm, so the elbow bend shows over the drape
  const U0 = upFrom !== undefined ? lerpV(a.sh, a.E, upFrom) : F0;
  const pts = fore
    ? upFrom !== undefined
      ? [U0, lerpV(U0, a.E, 0.5), a.E, lerpV(a.E, a.W, 0.5), a.W]
      : [F0, lerpV(F0, a.W, 0.5), a.W]
    : [a.sh, lerpV(a.sh, E1, 0.5), E1, ...curve, E2, lerpV(E2, a.W, 0.55), a.W];
  const R0 = fore ? (upFrom !== undefined ? [11.2, 10.6, 10, 9.6, wristR] : [9.8, 9.3, wristR]) : [12.8, 11.8, 10.6, 10.2, 10, 9.8, 9.6, 9.4, 9, wristR];
  // BAL-26c healthy: thicker arms (rk), tapering into the wrist so the wrist reads
  const R = rk === 1 ? R0 : R0.map((r, i) => (i === R0.length - 1 ? r : r * rk * (fore ? 1 : 1 - 0.12 * (i / (R0.length - 1)))));
  const faAng = (Math.atan2(a.W.y - a.E.y, a.W.x - a.E.x) * 180) / Math.PI;
  const rot = (Math.atan2(-a.dir.x, a.dir.y) * 180) / Math.PI;
  const [c0, k] = SHAPE_CURL[a.shape];
  const flex = clamp((a.curl - c0) * k, -4, 4);
  const fa = unit(sub(a.W, a.E));
  const A = sub(a.W, mul(fa, 8));
  const B = add(a.W, mul(a.dir, 3));
  const stub = [A, a.W, B];
  const stubR = [wristR + 0.2, wristR, wristR * 0.96];
  const shade = pal.skinShade;
  return (
    <g>
      <path d={chainD(pts, R)} fill={skinEdge(pal.skin, shade)} />
      <path d={chainD(pts, R, { grow: -1.3, dx: -1, dy: -1.2 })} fill={pal.skin} />
      {!fore && <path d={smoothOpen([lerpV(a.sh, E1, 0.35), E1, lerpV(a.E, E2, 0.5), lerpV(E2, a.W, 0.7)].map((p) => add(p, { x: -4.5, y: -3 })))} fill="none" stroke={pal.skinLit} strokeWidth={2.2} strokeLinecap="round" opacity={0.28 * lit} />}
      {fore && (edgeK === undefined || edgeK > 0.01) && (
        // the chadar's edge lying over the elbow: a soft tongue of cloth with a curved hem, the forearm comes out below it
        <g transform={`translate(${pt(F0)}) rotate(${faAng.toFixed(2)})${edgeK === undefined ? "" : ` scale(${edgeK.toFixed(3)})`}`}>
          <path d="M-12 -12.4 L-2 -12.2 C0.6 -10.6 0.4 -8 0.4 -8 C2.6 -5.6 0.2 -3.4 1.6 -1 C3.4 1.8 0.4 3.6 1.4 6.2 C2.2 8.8 -0.6 10.8 -3 12.4 L-12 12.6 Z" fill={cloth ?? pal.cloth} />
          <path d="M-2 -12.2 C0.6 -10.6 0.4 -8 0.4 -8 C2.6 -5.6 0.2 -3.4 1.6 -1 C3.4 1.8 0.4 3.6 1.4 6.2 C2.2 8.8 -0.6 10.8 -3 12.4" fill="none" stroke={pal.clothShade} strokeWidth={1.1} strokeLinecap="round" />
        </g>
      )}
      <g transform={`translate(${pt(a.W)}) rotate(${rot.toFixed(2)}) scale(${HAND_SX} ${HAND_SY})`}>
        <defs>
          <clipPath id={`${id}-hc`}>
            <rect x={-60} y={0.3} width={120} height={120} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-hc)`}>
          <Hand shape={a.shape} L={hl} skin={pal.skin} shade={shade} side={a.side} flex={flex} turn={a.turn} />
        </g>
      </g>
      <defs>
        <linearGradient id={`${id}-wg`} gradientUnits="userSpaceOnUse" x1={A.x} y1={A.y} x2={B.x} y2={B.y}>
          <stop offset={0} stopColor="#fff" stopOpacity={0} />
          <stop offset={0.3} stopColor="#fff" stopOpacity={1} />
          <stop offset={0.66} stopColor="#fff" stopOpacity={1} />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={-1200} y={-1200} width={2400} height={2400}>
          <rect x={-1200} y={-1200} width={2400} height={2400} fill={`url(#${id}-wg)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-wm)`}>
        <path d={chainD(stub, stubR, { sub: 2 })} fill={skinEdge(pal.skin, shade)} />
        <path d={chainD(stub, stubR, { grow: -1.3, dx: -1, dy: -1.2, sub: 2 })} fill={pal.skin} />
      </g>
    </g>
  );
};

/** Bare foot flat on the ground (sole at `ground`), toes along toeDir (signed, foreshortened), separated toes. */
const FootEl: React.FC<{ l: Leg; far: boolean; pal?: StandingPal; fk?: number }> = ({ l, far, pal = C, fk = 1.55 }) => {
  const k = fk;
  const td = l.toeDir;
  const a = l.ankle;
  const P = (u: number, v: number): V => ({ x: a.x + u * td * k, y: l.ground + v * k });
  const col = far ? pal.skinFar : pal.skin;
  const shade = pal.skinShade;
  const sole = far ? pal.soleFar : pal.soleNear;
  const outline = [
    P(-9.2, -2.6),
    P(-9.8, -6.2),
    P(-7.6, -9.8),
    P(-3.2, -11.6),
    P(0.8, -12),
    P(5, -11),
    P(10, -9.3),
    P(15, -7.3),
    P(19.4, -5.3),
    P(22.8, -3.7),
    P(24.8, -1.9),
    P(24, -0.3),
    P(20.5, 0),
    P(13, 0),
    P(5, 0),
    P(-2, 0),
    P(-7.2, -0.6),
  ];
  const soleBand = [P(-7.2, -0.6), P(-2, 0), P(5, 0), P(13, 0), P(20.5, 0), P(23.4, -0.4), P(21, -2), P(13, -2.1), P(5, -2), P(-3, -2), P(-7.2, -1.9)];
  const toes: Array<[number, number, number]> = [
    [23.4, -2.2, 1.55],
    [21.7, -4.1, 1.25],
    [19.9, -5.4, 1.1],
    [18.1, -6.3, 1],
    [16.3, -6.9, 0.9],
  ];
  return (
    <g>
      <path d={smoothClosed(outline)} fill={skinEdge(col, shade)} />
      <path d={smoothClosed(outline.map((p) => ({ x: p.x - 0.6 * td, y: p.y - 1 })))} fill={col} />
      <path d={smoothClosed(soleBand)} fill={mixHex(col, sole, 0.7)} />
      <path d={smoothOpen([P(-6, -9.8), P(0.6, -11.1), P(8, -9.6), P(15, -7)])} fill="none" stroke={pal.skinLit} strokeWidth={1.3} strokeLinecap="round" opacity={0.3} />
      <path d={smoothOpen([P(-6.6, -10), P(-3.2, -8.4), P(0.8, -8.9), P(3.6, -10.4)])} fill="none" stroke={shade} strokeWidth={0.9} strokeLinecap="round" opacity={0.4} />
      {toes.map(([u, v, r], j) => {
        const c = P(u, v);
        const rr = r * k * 0.95;
        return (
          <g key={j}>
            <circle cx={c.x.toFixed(2)} cy={c.y.toFixed(2)} r={rr.toFixed(2)} fill={col} />
            <path d={`M${pt(P(u - r * 0.95, v - r * 0.2))} Q${pt(P(u - r * 0.75, v + r * 0.6))} ${pt(P(u - r * 0.2, v + r * 0.95))}`} fill="none" stroke={shade} strokeWidth={0.6} strokeLinecap="round" opacity={0.55} />
            <circle cx={P(u + r * 0.25, v - r * 0.3).x.toFixed(2)} cy={P(u, v - r * 0.3).y.toFixed(2)} r={(r * 0.35 * k).toFixed(2)} fill={pal.skinLit} opacity={0.42} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * Opaque cloth (BAL-26 palette, PLATE_COLORS, shared with SeatedChild): the outer silhouette in the deep shade with a
 * soft darker contour, a warm-grey shade band on the side away from the light, the cream body nudged toward the light.
 */
const clothPaint = (d: (dx: number, dy: number) => string, base: string = C.cloth, key?: string, pal: StandingPal = C, painted = false): React.ReactElement => (
  <g key={key}>
    <path
      d={d(0, 0)}
      fill={pal.clothShade}
      stroke={pal.clothInner}
      strokeWidth={painted ? 0.95 : 1.5}
      strokeOpacity={painted ? 0.55 : undefined}
      strokeLinejoin="round"
    />
    <path d={d(-1.2, -1.3)} fill={pal.clothFold} />
    <path d={d(-3.6, -3.4)} fill={base} />
  </g>
);

/** A free-hanging cloth point: rest position on the body blended to hanging under gravity, plus the trail. */
const hang = (rest: V, anchor: V, length: number, g: number, trail: V): V => {
  const free = add(anchor, { x: trail.x * 0.6, y: length });
  return add(lerpV(rest, free, g), mul(trail, 0.4 * g + 0.25));
};

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export const StandingChild: React.FC<StandingChildProps> = (props) => {
  applyBuild(props);
  const uid = "sc" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const { x, y, s = 1, flip = false } = props;
  const PAL = C;
  const sf = props.f;
  const L = props.lifeF ?? props.f;
  const age = props.age ?? 6;
  const g = buildGeom(props, sf, L);
  const gPrev = buildGeom(props, sf - 4, L - 4); // for cloth trail
  const face = faceFor(props, g, L, sf);
  const yaw = g.yaw;
  const sa = sinA(yaw);
  const ca = cosA(yaw);

  // trail: how far the body moved in the last 4 frames, opposite (cloth lags)
  const trailOf = (now: V, before: V): V => {
    const d = sub(before, now);
    const l = len(d);
    return l > 14 ? mul(d, 14 / l) : d;
  };
  const trailP = trailOf(g.P, gPrev.P);
  const trailS = trailOf(g.Sc, gPrev.Sc);
  const gv = g.gravity;
  const wind = 0.28 * wob(L, 1.7, 0.22); // the faint stir of free edges

  /* ---------- torso centre line (3D sections projected) ---------- */
  const Tp = (v: number, u = 0, dz = 0): V => {
    // body point at height v along the torso axis, across u (his left +), forward dz
    const P3 = g.P3;
    const ax3 = g.ax3;
    const fw3 = { x: 0, y: Math.sin(g.theta), z: Math.cos(g.theta) }; // body forward, pitched
    return proj({ x: P3.x + u, y: P3.y + ax3.y * v + fw3.y * dz, z: P3.z + ax3.z * v + fw3.z * dz }, yaw);
  };
  const hwOf = (w: number) => (HB ? 1.08 * Math.hypot(w * ca, 0.82 * w * sa) * TORSO_W : 1.08 * Math.hypot(w * ca, 0.82 * w * sa));
  // in the bend the wrap lies close on the back (a child bending, not a bundle of cloth)
  const hwB = (w: number) => hwOf(w) * lerp(1, 0.8, smooth(g.theta / 1.4));
  const bR = 0.6 * g.breath;
  // bare torso only where it can show (the V at the neck); the rest is under the chadar
  const torsoPts = [Tp(78), Tp(108), Tp(TORSO - 4)];
  const torsoR = [hwOf(13), hwOf(14) + bR, hwOf(12)];

  /* ---------- dhoti: a child's dhoti to mid-calf, one soft cloth over both legs ---------- */
  const pa = perpL(g.ax);
  const hemOf = (l: Leg): { hem: V; dir: V } => {
    const shin = unit(sub(l.ankle, l.knee));
    const dir = unit(add(lerpV(shin, { x: 0, y: 1 }, 0.5 + 0.3 * gv), mul(trailP, 0.02)));
    return { hem: add(l.knee, mul(dir, (HB ? 38 : 40) + 1.5 * wind)), dir };
  };
  const hN = hemOf(g.legN);
  const hF = hemOf(g.legF);
  const nearIsA = g.legN.hip.x <= g.legF.hip.x;
  const lA = nearIsA ? g.legN : g.legF;
  const lB = nearIsA ? g.legF : g.legN;
  const hA = nearIsA ? hN : hF;
  const hB = nearIsA ? hF : hN;
  const outN = (d: V, sx: number): V => {
    const n = perpL(d);
    return n.x * sx < 0 ? mul(n, -1) : n;
  };
  const thA = unit(sub(lA.knee, lA.hip));
  const thB = unit(sub(lB.knee, lB.hip));
  // gb: 0 upright (and in handInHands) .. 1 in a full bend. In the bend the hips are one modest curve continuous with
  // the back and the backs of the thighs, the dhoti lying close over them (no separate seat shape, no seam).
  const gb = smooth((g.theta - 0.3) / 0.9);
  // BAL-26c healthy: a fuller dhoti over sturdier legs, a little flare at the hem (classic: LK = HK = 1)
  const LK = HB ? 1.22 : 1;
  const HK = HB ? 1.32 : 1;
  const pA1 = add(lerpV(lA.hip, lA.knee, 0.45), mul(outN(thA, -1), lerp(26, 16, gb) * LK));
  const pA2 = add(lA.knee, mul(outN(unit(add(thA, hA.dir)), -1), lerp(23, 16.5, gb) * LK));
  const pA3 = add(hA.hem, mul(outN(hA.dir, -1), 23 * HK));
  const pA4 = add(hA.hem, mul(hA.dir, 2.5));
  const pB1 = add(lerpV(lB.hip, lB.knee, 0.45), mul(outN(thB, 1), 26 * LK));
  const pB2 = add(lB.knee, mul(outN(unit(add(thB, hB.dir)), 1), 23 * LK));
  const pB3 = add(hB.hem, mul(outN(hB.dir, 1), 23 * HK));
  const pB4 = add(hB.hem, mul(hB.dir, 2.5));
  // the hem between the legs dips a little (the pleat fall hangs there)
  const hemDirM = unit(lerpV(hA.dir, hB.dir, 0.5));
  const dip0 = add(lerpV(hA.hem, hB.hem, 0.5), mul(hemDirM, 8));
  const dip = HB ? add(lerpV(hA.hem, hB.hem, 0.5), mul(hemDirM, -9)) : dip0;
  // the waist on the back: in the bend it starts on the wrap's back line, so the back runs on into the hip curve
  const WV = HB ? 30 : 20;
  const wL = lerpV(add(Tp(WV), mul(pa, -hwOf(24))), add(Tp(16), mul(pa, -hwB(19))), gb);
  // the round of the hip, never higher than the back line
  // the corner where the back line (through wL, along the spine) meets the back of the thigh (through pA1), pulled in
  // toward the pelvis: a rounded hip that never stands out beyond either line
  const hipCorner = ((): V => {
    const d1 = mul(g.ax, -1);
    const d2 = mul(thA, -1);
    const det = d1.x * d2.y - d1.y * d2.x;
    if (Math.abs(det) < 0.15) return lerpV(wL, pA1, 0.5);
    const r = sub(pA1, wL);
    const t = clamp((r.x * d2.y - r.y * d2.x) / det, 0, 60);
    return add(wL, mul(d1, t));
  })();
  // a smooth curve inside that corner (a quadratic arc from the back line to the thigh), never beyond either line
  const hipK = lerpV(lerpV(wL, pA1, 0.5), lerpV(hipCorner, g.P, 0.2), gb);
  const qArc = (t: number): V => add(add(mul(wL, (1 - t) * (1 - t)), mul(hipK, 2 * t * (1 - t))), mul(pA1, t * t));
  const hipArc = [qArc(0.3), qArc(0.55), qArc(0.8)];
  const wR = add(Tp(WV), mul(pa, hwOf(24)));
  const skirt = gb > 0 ? [wL, ...hipArc, pA1, pA2, pA3, pA4, dip, pB4, pB3, pB2, pB1, wR] : [wL, pA1, pA2, pA3, pA4, dip, pB4, pB3, pB2, pB1, wR];
  const crotch = lerpV(g.P, lerpV(lA.knee, lB.knee, 0.5), 0.38);
  const seat = [Tp(-2, 0, -7), Tp(12, 0, -3)];
  // the seat shape is only for the upright figure (hidden under the cloth there); it melts away in the bend
  const seatR = [lerp(hwOf(20), 0.2, gb), lerp(hwOf(21), 0.2, gb)];
  // the front pleat fall (kochi): hangs from the waist front to the hem dip, with gravity, trailing motion
  const pleatTop = HB ? Tp(21, 3, 20) : Tp(14, 2, 0.8 * 22);
  const pleatRest = sub(HB ? dip0 : dip, mul(hemDirM, 6));
  const pleatLen = len(sub(pleatRest, pleatTop));
  const pleatBot = hang(pleatRest, pleatTop, pleatLen, gv * (1 - gb), add(trailP, { x: 1.2 * wind, y: 0 }));
  const pleatMid = add(lerpV(pleatTop, pleatBot, 0.5), { x: 1.5 * wind, y: 0 });
  const pdir = unit(sub(pleatBot, pleatTop));
  const pn = perpL(pdir);
  const PK = HB ? 1.3 : 1;
  const pleatShape = [
    add(pleatTop, mul(pn, 6 * PK)),
    add(pleatMid, mul(pn, 8.5 * PK)),
    add(pleatBot, mul(pn, 11 * PK)),
    add(pleatBot, mul(pdir, 3)),
    add(pleatBot, mul(pn, -10 * PK)),
    add(pleatMid, mul(pn, -7.5 * PK)),
    add(pleatTop, mul(pn, -5 * PK)),
  ];

  /* ---------- chadar: opaque white cotton wrapped across the chest (V at the neck), lying close over the shoulders and
     falling over the upper arms in long soft folds to about the hip; the forearms come out below the elbows ---------- */
  const vApex = Tp(96, 3, 15);
  const vL = Tp(TORSO + 3, -10, 11);
  const vR = Tp(TORSO + 3, 10, 11);
  const wrapSide = (sgn: number) =>
    ([
      [lerp(12, 16, gb), lerp(24.5, 19, gb)],
      [40, lerp(23.5, 22, gb)],
      [70, 24],
      [96, 26 + bR],
      [114, 27 + bR],
      [TORSO - 2, 23.5],
    ] as Array<[number, number]>).map(([v, w]) => add(Tp(v), mul(pa, sgn * hwB(w))));
  const wrapSideH = (sgn: number) =>
    ([
      [lerp(sgn > 0 ? 26 : 33, 30, gb), lerp(24.5, 20, gb) + (sgn > 0 ? 2.5 : 0)],
      [44, lerp(25, 22.5, gb) + (sgn > 0 ? 3.2 : 0)],
      [70, 26 + (sgn > 0 ? 2.6 : 0)],
      [96, 27.5 + bR + (sgn > 0 ? 1.4 : 0)],
      [116, 29.5 + bR],
      [TORSO - 2, 27.5],
    ] as Array<[number, number]>).map(([v, w]) => add(Tp(v), mul(pa, sgn * hwB(w))));
  const wrapPoly = HB
    ? [...wrapSideH(1), Tp(TORSO + 6, 0, 0), ...wrapSideH(-1).reverse(), add(Tp(31), mul(pa, -hwOf(21))), add(Tp(25), mul(pa, hwOf(22)))]
    : [
        ...wrapSide(1),
        Tp(TORSO + 6, 0, 0),
        ...wrapSide(-1).reverse(),
        add(Tp(11), mul(pa, -hwOf(17))),
        add(Tp(10), mul(pa, hwOf(17))),
      ];
  // healthy: the dhoti's rolled waist (with the pleats tucked in at the front) shows below the chadar's hem
  const waistRoll = HB ? [add(Tp(24), mul(pa, -hwOf(24.5))), Tp(22.5, -2, 19), Tp(23, 6, 20), add(Tp(25), mul(pa, hwOf(24.5)))] : null;
  const chadarHem = HB ? [add(Tp(33), mul(pa, -hwB(24))), Tp(29, 0, 21), add(Tp(26), mul(pa, hwB(27)))] : null;
  // one drape per side: neck, close over the shoulder and the upper arm to the elbow, then hanging with gravity to
  // about the hip (in the bend it falls from the shoulders and the chest toward the ground), the front edge up the chest
  // tight (Episode 6, 0 = Episode 5 drape): over an arm turned back (hand at the back) or raised (hand at the face) the
  // drape stays a short cap on the shoulder and its hem returns to the body's side, so no cloth wing or panel forms.
  // BAL-26d healthy shawl: the arm part of each drape (where the forearm comes out from under the cloth) and the edge
  // line for the contact shadow, filled in by capeFor
  const shawlArm: Record<string, { sleeve: V[]; edge: V[]; fa: V } | undefined> = {};
  const capeFor = (a: Arm, sgn: number, tight = 0, aPrev?: Arm, key?: string): V[] => {
    const ua = unit(sub(a.E, a.sh));
    let n = perpL(ua);
    const outV = sub(a.sh, g.Sc);
    if (n.x * outV.x + n.y * outV.y < 0) n = mul(n, -1);
    // BAL-26c healthy: the drape lies lower round the neck, so the head sits up out of it
    const neckF = Tp(TORSO + (HB ? 0 : 4), sgn * (HB ? 11 : 9), 11);
    const neckT = Tp(TORSO + (HB ? 1 : 8), sgn * (HB ? 19 : 17), -3);
    const shTop = add(sub(a.sh, mul(ua, 14)), mul(n, 5));
    const shO = add(sub(a.sh, mul(ua, 3)), mul(n, tight ? lerp(14.5, 10.5, tight) : 14.5));
    const midO = add(lerpV(a.sh, a.E, tight ? lerp(0.5, 0.36, tight) : 0.5), mul(n, tight ? lerp(12.8, 9.5, tight) : 12.8));
    // in the bend the drape covers the upper arm only to about 60 % and its hem is short
    // BAL-26d: the healthy drape covers the shoulder and the whole upper arm to the elbow (plate 01); forearms free
    const cov0 = HB ? lerp(1.02, 0.7, gb) : lerp(1, 0.6, gb);
    const cov = tight ? lerp(cov0, 0.52, tight) : cov0;
    const elO = add(add(lerpV(a.sh, a.E, cov), mul(n, tight ? lerp(lerp(12, 13, gb), 9, tight) : lerp(12, 13, gb))), mul(ua, lerp(4, 0, gb)));
    let hemO = add(add(elO, { x: 0, y: HB ? lerp(lerp(11, 9, gv), 8, gb) : lerp(lerp(50, 24, gv), 14, gb) }), add(mul(trailS, 0.6), { x: 1.2 * wind * sgn, y: 0 }));
    if (tight) hemO = lerpV(hemO, lerpV(add(elO, { x: 0, y: 8 }), Tp(84, sgn * 19, 2), 0.6), tight);
    const frontBot = HB
      ? hang(Tp(sgn > 0 ? 30 : 36, sgn * 18, 20), Tp(lerp(88, 42, gb), sgn * 14, lerp(19, 10, gb)), lerp(28, 16, gb), gv, add(trailS, { x: 1.4 * wind, y: 0 }))
      : hang(Tp(12, sgn * 17, 20), Tp(lerp(84, 34, gb), sgn * 14, lerp(19, 10, gb)), lerp(40, 20, gb), gv, add(trailS, { x: 1.4 * wind, y: 0 }));
    const hemMid = add(lerpV(hemO, frontBot, 0.5), { x: 0, y: 6 + 4 * gv });
    const dzF = lerp(21, 12, gb);
    if (HB) {
      // BAL-26d: one soft shawl over the shoulder and the upper arm (plate 01). Its lower edge is a soft diagonal curve:
      // a little below the elbow on the outside of the arm, higher on the inside, sagging a touch unevenly between,
      // swinging after the elbow (follow-through); no hem band, the forearm comes out from under it.
      const inner = mul(n, -1);
      const fa = unit(sub(a.W, a.E));
      const tE = aPrev ? (() => {
        const d = sub(aPrev.E, a.E);
        const l = len(d);
        return l > 14 ? mul(d, 14 / l) : d;
      })() : { x: 0, y: 0 };
      const cv = tight ? lerp(1, 0.6, tight) : 1;
      const rA = 10.2 * ARM_R;
      const hO = add(add(add(lerpV(a.sh, a.E, lerp(1, 0.75, gb) * cv), mul(n, rA + 2.5)), { x: 0, y: 7 * cv }), mul(tE, 0.7));
      const hIn = add(add(lerpV(a.sh, a.E, lerp(0.84, 0.62, gb) * cv), mul(inner, rA + 2)), mul(tE, 0.35));
      const hW = add(add(lerpV(hO, hIn, 0.5), mul(ua, 3 + 1.1 * wind)), add(mul(perpL(ua), 1.2 * Math.sin(L * 0.05 + sgn)), mul(tE, 0.5)));
      const sleeve = [shTop, shO, midO, elO, hO, hW, hIn, add(lerpV(a.sh, a.E, 0.45), mul(inner, rA + 4)), add(a.sh, mul(inner, 9))];
      if (key) shawlArm[key] = { sleeve, edge: [hO, hW, hIn], fa };
      return [neckF, neckT, shTop, shO, midO, elO, hO, hW, hIn, frontBot, Tp(48, sgn * 16.5, dzF), Tp(76, sgn * 15, dzF), Tp(104, sgn * 12.5, lerp(19, 11, gb))];
    }
    return [neckF, neckT, shTop, shO, midO, elO, hemO, hemMid, frontBot, Tp(HB ? 48 : 40, sgn * 16.5, dzF), Tp(76, sgn * 15, dzF), Tp(104, sgn * 12.5, lerp(19, 11, gb))];
  };
  // healthy (BAL-26d): the drape stays on the upper arm even with the hand at the back or at the face (a lighter tight)
  const capeN = HB
    ? capeFor(g.armN, -1, 0.3 * g.vals.nBack, gPrev.armN, "n")
    : g.vals.nBack
      ? capeFor(g.armN, -1, 0.5 * g.vals.nBack)
      : capeFor(g.armN, -1);
  const capeF = HB
    ? capeFor(g.armF, 1, clamp(g.vals.fFace, 0, 1), gPrev.armF, "f")
    : g.vals.fFace
      ? capeFor(g.armF, 1, clamp(g.vals.fFace * 1.6, 0, 1))
      : capeFor(g.armF, 1);
  const capeEl = (pts: V[], lit: boolean, key: string): React.ReactElement => {
    const sh13 = pts.length === 13;
    const [neckF, neckT, , shO, midO, elO, hemO] = pts;
    const hemMid = sh13 ? pts[8] : pts[7];
    const frontBot = sh13 ? pts[9] : pts[8];
    const front = sh13 ? [pts[12], pts[11], pts[10], frontBot] : [pts[11], pts[10], pts[9], frontBot];
    const foldA = [lerpV(neckT, shO, 0.6), lerpV(midO, elO, 0.3), add(lerpV(elO, hemO, 0.6), mul(sub(hemMid, hemO), 0.15)), add(hemO, mul(sub(hemMid, hemO), 0.2))];
    const p10 = sh13 ? pts[11] : pts[10];
    const p9 = sh13 ? pts[10] : pts[9];
    const foldB = [lerpV(neckF, neckT, 0.5), lerpV(midO, p10, 0.5), lerpV(hemO, hemMid, 0.7)];
    const foldC = [lerpV(p10, midO, 0.25), lerpV(p9, hemMid, 0.4), lerpV(frontBot, hemMid, 0.35)];
    // healthy shawl: loose folds radiating from the shoulder down toward the soft edge
    const radFolds = sh13
      ? [
          [lerpV(pts[2], shO, 0.4), lerpV(midO, elO, 0.45), lerpV(hemO, pts[7], 0.3)],
          [lerpV(neckT, shO, 0.35), lerpV(midO, pts[8], 0.4), lerpV(pts[7], pts[8], 0.55)],
        ]
      : [];
    return (
      <g key={key}>
        <path d={smoothClosed(pts.map((q) => add(q, { x: 0.8, y: 1.8 })))} fill={PAL.skinDeep} opacity={0.07} />
        {clothPaint((dx, dy) => smoothClosed(pts.map((q) => add(q, { x: dx, y: dy }))), lit ? PAL.cloth : PAL.clothMid, undefined, PAL)}
        <path d={smoothOpen(foldA)} fill="none" stroke={PAL.clothShade} strokeWidth={2} strokeLinecap="round" />
        <path d={smoothOpen(foldA.map((q) => add(q, { x: -2, y: -0.7 })))} fill="none" stroke={PAL.clothLit} strokeWidth={1.4} strokeLinecap="round" />
        <path d={smoothOpen(foldB)} fill="none" stroke={PAL.clothFold} strokeWidth={1.8} strokeLinecap="round" />
        <path d={smoothOpen(foldC)} fill="none" stroke={PAL.clothFold} strokeWidth={1.6} strokeLinecap="round" />
        <path d={smoothOpen([neckT, shO, lerpV(shO, midO, 0.5)].map((q) => add(q, { x: 0, y: 2.4 })))} fill="none" stroke={PAL.clothLit} strokeWidth={2} strokeLinecap="round" />
        {radFolds.map((fp, i) => (
          <path key={i} d={smoothOpen(fp)} fill="none" stroke={PAL.clothFold} strokeWidth={1.5} strokeLinecap="round" opacity={0.75} />
        ))}
        {/* the rolled front edge */}
        <path d={smoothOpen(front)} fill="none" stroke={PAL.clothLit} strokeWidth={2.6} strokeLinecap="round" />
        <path d={smoothOpen(front.map((q) => add(q, { x: 2.8, y: 0 })))} fill="none" stroke={PAL.clothShade} strokeWidth={1.4} strokeLinecap="round" />
      </g>
    );
  };

  /* ---------- shins ---------- */
  const shinEl = (l: Leg, hem: V, far: boolean, key: string) => {
    const kn = lerpV(l.knee, hem, 0.55);
    const pts = [kn, lerpV(kn, l.ankle, 0.45), l.ankle];
    const r = HB ? [16.6, 15.2, 9.8] : [12.4, 11.6, 7.8];
    return skinLimb(pts, r, far ? PAL.skinFar : PAL.skin, PAL.skinShade, key);
  };

  const clothTube = (pts: V[], r: number[], base: string, key?: string) =>
    clothPaint((dx, dy) => chainD(pts, r, { grow: dx === 0 ? 0 : -2, dx, dy }), base, key, PAL);

  const fl = flip ? -1 : 1;
  const farArmFront = g.theta > 0.6;
  const legFold = (l: Leg, h: { hem: V }, k: number, key: string) => (
    <path
      key={key}
      d={smoothOpen([lerpV(l.hip, l.knee, 0.25), add(l.knee, { x: 5 * k, y: 0 }), add(h.hem, { x: 7 * k, y: -3 })])}
      fill="none"
      stroke={PAL.clothFold}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  );

  // Episode 6: prop layers inside the figure (absent = the Episode 5 drawing order), the hand over the face (wipeEye)
  const bodyT = `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(s * fl).toFixed(4)} ${s.toFixed(4)})`;
  const layered = props.layerFar !== undefined || props.layerMid !== undefined;
  const faceHand = g.vals.fFace > 0.04;
  // the chadar's edge over the elbow goes with the tight drape (Episode 6: hand at the back / at the face)
  // healthy: a slim drape hem across the top of the forearm where it comes out from under the chadar
  const shawlFore = (side: "n" | "f", el: React.ReactElement): React.ReactElement => {
    const sa2 = shawlArm[side];
    if (!sa2) return el;
    const a = side === "n" ? g.armN : g.armF;
    const mid = `${uid}-sm${side}`;
    const cid = `${uid}-sc${side}`;
    const sh = sa2.edge.map((q) => add(q, mul(sa2.fa, 3)));
    return (
      <g>
        <defs>
          <mask id={mid} maskUnits="userSpaceOnUse" x={-3000} y={-3000} width={6000} height={6000}>
            <rect x={-3000} y={-3000} width={6000} height={6000} fill="#fff" />
            <path d={smoothClosed(sa2.sleeve)} fill="#000" />
          </mask>
          <clipPath id={cid}>
            <path d={chainD([a.E, lerpV(a.E, a.W, 0.5), a.W], [11 * ARM_R, 10 * ARM_R, 9 * ARM_R])} />
          </clipPath>
        </defs>
        <g mask={`url(#${mid})`}>{el}</g>
        <g clipPath={`url(#${cid})`}>
          <path d={smoothOpen(sh.map((q) => add(q, mul(sa2.fa, 2))))} fill="none" stroke={PAL.skinDeep} strokeWidth={9} strokeLinecap="round" opacity={0.1} />
          <path d={smoothOpen(sh)} fill="none" stroke={PAL.skinDeep} strokeWidth={4.5} strokeLinecap="round" opacity={0.24} />
        </g>
      </g>
    );
  };
  const edgeOf = (tight: number) => (tight ? (gb > 0 ? 1 - gb : 1) * clamp(1 - 1.4 * tight, 0, 1) : gb > 0 ? 1 - gb : undefined);
  const farFore = HB ? (
    shawlFore("f", <ArmEl a={g.armF} id={`${uid}-aff`} lit={0.6} fore edgeK={0} pal={PAL} hl={HAND_L} rk={ARM_R} />)
  ) : (
    <ArmEl a={g.armF} id={`${uid}-aff`} lit={0.6} fore cloth={PAL.clothMid} edgeK={edgeOf(g.vals.fFace)} pal={PAL} hl={HAND_L} rk={ARM_R} />
  );
  const nearArm = (
    <>
      {/* near arm, its drape, the near forearm coming out below it */}
      <ArmEl a={g.armN} id={`${uid}-an`} lit={1} pal={PAL} hl={HAND_L} rk={ARM_R} />
      {capeEl(capeN, true, "capeN")}
      {g.vals.nBack > 0.02 && !HB ? (
        <ArmEl a={g.armN} id={`${uid}-anf`} lit={1} fore edgeK={0} upFrom={0.62} pal={PAL} hl={HAND_L} rk={ARM_R} />
      ) : (
        HB ? (
          shawlFore("n", <ArmEl a={g.armN} id={`${uid}-anf`} lit={1} fore edgeK={0} pal={PAL} hl={HAND_L} rk={ARM_R} />)
        ) : (
          <ArmEl a={g.armN} id={`${uid}-anf`} lit={1} fore edgeK={edgeOf(g.vals.nBack)} pal={PAL} hl={HAND_L} rk={ARM_R} />
        )
      )}
    </>
  );

  return (
    <g>
      <g transform={bodyT}>
        {/* far leg: bare shin and foot */}
        {shinEl(g.legF, hF.hem, true, "shinF")}
        <FootEl l={g.legF} far pal={PAL} fk={FOOT_K} />
        {gb < 0.995 && clothTube(seat, seatR, PAL.cloth, "seat")}
        {!farArmFront && <ArmEl a={g.armF} id={`${uid}-af`} lit={0.6} pal={PAL} hl={HAND_L} rk={ARM_R} />}
        {/* near leg */}
        {shinEl(g.legN, hN.hem, false, "shinN")}
        <FootEl l={g.legN} far={false} pal={PAL} fk={FOOT_K} />
        {/* the dhoti: one soft cloth, the legs read under it, the hem dips between them */}
        {clothPaint((dx, dy) => smoothClosed(skirt.map((q) => add(q, { x: dx, y: dy }))), PAL.cloth, "skirt", PAL)}
        <path d={smoothOpen([crotch, lerpV(crotch, dip, 0.6), add(dip, mul(hemDirM, -6))])} fill="none" stroke={PAL.clothFold} strokeWidth={1.4} strokeLinecap="round" opacity={0.35} />
        {legFold(lA, hA, -1, "lfA")}
        {legFold(lB, hB, 1, "lfB")}
        <path d={smoothOpen([pA3, pA4, dip, pB4, pB3].map((q) => add(q, { x: 0, y: -2.6 })))} fill="none" stroke={PAL.clothFold} strokeWidth={2} strokeLinecap="round" />
        {/* the front pleat fall (kochi) */}
        {clothPaint((dx, dy) => smoothClosed(pleatShape.map((q) => add(q, { x: dx * 0.6, y: dy * 0.6 }))), PAL.cloth, "pleat", PAL)}
        <path d={smoothOpen([add(pleatTop, mul(pn, 1.5)), add(pleatMid, mul(pn, 2.5)), add(pleatBot, mul(pn, 3.5))])} fill="none" stroke={PAL.clothFold} strokeWidth={1.2} opacity={0.45} />
        {HB && waistRoll && (
          <g>
            {/* the dhoti's front pleats (kacha folds) running down from the waist, and its rolled waist */}
            <path d={smoothOpen([Tp(23, -6, 19), lerpV(crotch, hA.hem, 0.35), add(hA.hem, { x: 3, y: -3 })])} fill="none" stroke={PAL.clothFold} strokeWidth={1.8} strokeLinecap="round" opacity={0.8} />
            <path d={smoothOpen([Tp(23, 9, 19), lerpV(crotch, hB.hem, 0.4), add(hB.hem, { x: -2, y: -3 })])} fill="none" stroke={PAL.clothFold} strokeWidth={1.6} strokeLinecap="round" opacity={0.7} />
            <path d={smoothOpen(waistRoll)} fill="none" stroke={PAL.clothMid} strokeWidth={8} strokeLinecap="round" />
            <path d={smoothOpen(waistRoll.map((q) => add(q, { x: 0, y: -3.4 })))} fill="none" stroke={PAL.clothShade} strokeWidth={1.3} strokeLinecap="round" opacity={0.85} />
            <path d={smoothOpen(waistRoll.map((q) => add(q, { x: -0.6, y: 1.6 })))} fill="none" stroke={PAL.clothLit} strokeWidth={1.6} strokeLinecap="round" opacity={0.9} />
            <ellipse cx={Tp(23, 6, 21).x} cy={Tp(23, 6, 21).y} rx={4.6} ry={3.4} fill={PAL.clothMid} stroke={PAL.clothShade} strokeWidth={0.9} />
          </g>
        )}
        {/* far arm in the bend: the arms hang forward of the knees (and the free hand rests on the far knee) */}
        {farArmFront && <ArmEl a={g.armF} id={`${uid}-af`} lit={0.6} pal={PAL} hl={HAND_L} rk={ARM_R} />}
        {/* torso skin (shows only at the V), the neck */}
        <path d={chainD(torsoPts, torsoR)} fill={skinEdge(PAL.skin, PAL.skinShade)} />
        <ThakurNeckPlate base={g.neckBase} top={g.neckTop} scale={HB ? HEAD_K * (props.headScale ?? 1) * NECK_R : HEAD_K * (props.headScale ?? 1)} colors={HB ? C : undefined} />
        {/* the wrap across the chest, the V at the neck, the overlapping edge and soft diagonal folds */}
        {clothPaint((dx, dy) => smoothClosed(wrapPoly.map((q) => add(q, { x: dx, y: dy }))), PAL.cloth, "wrap", PAL)}
        {HB && chadarHem && (
          <g>
            <path d={smoothOpen(chadarHem.map((q) => add(q, { x: 0, y: 1.8 })))} fill="none" stroke={PAL.clothShade} strokeWidth={2.2} strokeLinecap="round" opacity={0.75} />
            <path d={smoothOpen(chadarHem)} fill="none" stroke={PAL.clothLit} strokeWidth={1.8} strokeLinecap="round" />
          </g>
        )}
        <path d={`M${pt(vL)} L${pt(vApex)} L${pt(vR)} Q${pt(add(lerpV(vL, vR, 0.5), mul(g.ax, 6)))} ${pt(vL)} Z`} fill={PAL.skin} />
        <path d={`M${pt(add(vL, { x: 0, y: 2 }))} Q${pt(lerpV(vL, vR, 0.5))} ${pt(add(vR, { x: 0, y: 2 }))}`} fill="none" stroke={PAL.skinShade} strokeWidth={2} opacity={0.22} />
        <path d={smoothOpen([vL, add(vApex, mul(g.ax, -1))])} fill="none" stroke={PAL.clothLit} strokeWidth={2.4} strokeLinecap="round" opacity={0.95} />
        <path d={smoothOpen([vR, add(vApex, mul(g.ax, -1))])} fill="none" stroke={PAL.clothFold} strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
        <path d={smoothOpen([vApex, Tp(76, 9, 21), Tp(48, 15, 21), Tp(HB ? 30 : 22, 19, 20)])} fill="none" stroke={PAL.clothShade} strokeWidth={2} strokeLinecap="round" />
        <path d={smoothOpen([Tp(TORSO - 6, -14, 13), Tp(96, -4, 20), Tp(70, 4, 21)])} fill="none" stroke={PAL.clothFold} strokeWidth={1.8} strokeLinecap="round" />
        {/* far drape and the far forearm coming out below it */}
        {capeEl(capeF, false, "capeF")}
        {!layered && farFore}
        {!layered && nearArm}
      </g>
      {layered && (
        <>
          {props.layerFar}
          <g transform={bodyT}>{farFore}</g>
          {props.layerMid}
          <g transform={bodyT}>{nearArm}</g>
        </>
      )}
      {/* the one plate head, drawn unmirrored so the side part stays on his right */}
      <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})`}>
        <ThakurHeadPlate
          x={fl * g.head.x}
          y={g.head.y}
          rot={fl * g.headRot}
          scale={HEAD_K * (props.headScale ?? 1)}
          age={age}
          {...(HB ? { colors: C, vivid: true } : {})}
          state={flip ? { ...face, turn: -face.turn, gazeX: -face.gazeX } : face}
        />
      </g>
      {faceHand && (
        <g transform={bodyT} opacity={smooth((g.vals.fFace - 0.04) / 0.3).toFixed(3)}>
          {HB ? shawlFore("f", <ArmEl a={g.armF} id={`${uid}-afx`} lit={0.6} fore edgeK={0} pal={PAL} hl={HAND_L} rk={ARM_R} />) : <ArmEl a={g.armF} id={`${uid}-afx`} lit={0.6} fore edgeK={0} pal={PAL} hl={HAND_L} rk={ARM_R} />}
        </g>
      )}
    </g>
  );
};
