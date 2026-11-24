import React, { useId } from "react";
import { blink, clamp, flicker, hash, lerp, noise1, safeId, saccade } from "../core/anim";
import { Hand, HandShape } from "./Hand";
import { Head, HeadLook } from "./Head";
import { FACE_LOOKS, FaceLook } from "./cast";
import { FACE_ADULT_F, FACE_ADULT_M, FACE_CHILD, FaceShape, headModel, smoothPath } from "./head3d";
import { MOUTH_REST, MouthState } from "./lipsync";

/**
 * Character rig v2.
 *  - Head: true 3D-projected head (head3d.ts / Head.tsx) — 3/4 & profile turns, distinct face shapes.
 *  - Body: torso turns in 3/4 (bodyTurn); far arm / far leg tuck behind the body.
 *  - Legs: hip/knee/ankle posed in 3D (thigh pitch, knee bend, abduction) and projected;
 *    ground contact is solved automatically (walk, crouch, one-knee kneel, cross-legged sit).
 *  - Hands: five fingers with curl, palm/back/side views and gesture presets (Hand.tsx).
 *  - Clothing built over the legs: dhoti wraps each leg + front pleats; saree/frock hulls the legs.
 */

export type { HandShape } from "./Hand";
export type HairStyle = "parted" | "tousled" | "balding" | "cropped" | "veil" | "pigtails" | "wrap";
export type Outfit = "kurta" | "vest" | "bare" | "frock" | "blouse";
export type Lower = "dhoti" | "saree" | "none";

export interface CastMember {
  id: string;
  age: "child" | "adult" | "elder";
  sex?: "m" | "f";
  height: number;
  girth: number;
  skin: string;
  skinLight: string;
  skinShade: string;
  lips: string;
  hair: string;
  hairLight: string;
  hairStyle: HairStyle;
  outfit: Outfit;
  top: string;
  topLight: string;
  topShade: string;
  topTrim?: string;
  sleeve: "full" | "rolled" | "half" | "none";
  lower: Lower;
  lowerColor: string;
  lowerShade: string;
  lowerTrim?: string;
  /** "hitched" (Episode 5 on): a working man's dhoti tucked up for work (malkochha), the hem above the knee. */
  dhotiLength?: "knee" | "calf" | "hitched";
  /**
   * "gamchha" (Episode 5 on): a checked cotton towel folded over the left shoulder, one end down the chest.
   * "waist" (Episode 6 on): a checked gamchha tied round the waist over the dhoti, knotted at the near hip with a short
   * end hanging (the culprit friend's red gamchha).
   */
  scarf?: { color: string; shade: string; trim?: string; style: "drape" | "neck" | "shawl" | "check" | "gamchha" | "waist" };
  /**
   * A small block print on the top's cloth (Episode 6 on: the elder brother's printed cotton shirt): tiny four-petal
   * buti (`motif` "buti", default) or dots, in `color` (and `color2` for the centres), over the body and sleeves.
   */
  print?: { color: string; color2?: string; motif?: "buti" | "dots" };
  /**
   * Head size relative to the rig's default for this age and height (Episode 6 on, CHR-08: the village children get
   * 0.8 so they sit closer to Balak's plate proportions). Below 1 the shoulders, hips, limbs and hands slim a little
   * with it (by about a third of the change) so the figure never looks pin-headed. Absent = 1 = exactly as before.
   */
  headScale?: number;
  mustache?: string;
  glasses?: boolean;
  tilak?: boolean;
  sindoor?: boolean;
  bindi?: boolean;
  paita?: boolean;
  wiry?: boolean;
  ribbon?: string;
  face?: Partial<FaceShape>;
  /**
   * A cloth shoulder bag (jhola, Episode 5 on): the strap runs from the opposite shoulder across the chest to the
   * bag at the hip on `side` (-1 = the figure's left hip, the default; it is the near hip of a figure turned to
   * screen right). Swings a little with the body.
   */
  bag?: { color: string; shade: string; strap?: string; side?: 1 | -1 };
  seed: number;
}

export interface Pose {
  lean: number;
  bodyX: number;
  bodyY: number;
  bodyTurn: number;
  crouch: number;
  headTurn: number;
  headTilt: number;
  headNod: number;
  eyeX: number;
  eyeY: number;
  lid: number;
  brow: number;
  browTilt: number;
  smile: number;
  gasp: number;
  cheeks: number;
  flush: number;
  tears: number;
  rS: number;
  rE: number;
  lS: number;
  lE: number;
  rHand: HandShape;
  lHand: HandShape;
  rProp: string;
  lProp: string;
  stride: number;
  rBack: number;
  lBack: number;
  /**
   * 0 = legs as before (standing, crouch or `seated`); 1 = kneeling on both knees, sitting back on the heels (a
   * woman's puja seat, vajrasana). Blends from standing, from a crouch or from the `seated` prop. A sari covers the
   * legs completely while kneeling (only the soles show behind). Key it with ease "inOut" over 18 to 30 frames.
   */
  kneel: number;
  /**
   * 0..1 the kneeling bow (pranam, "matite upur hoye pranam"); use with kneel = 1 and bodyTurn about +-0.8 to 1 (the
   * bow goes toward the side the figure faces). The hips rise a little off the heels, the upper body folds forward
   * from the hips until the forehead is near the floor, and over the second half of the bow both arms reach the floor
   * on their own (solved every frame, so the hands always touch it): the joined hands lie on the floor in front of
   * the head. Breathing goes on. See `kneelingPranam` below for a ready-made down, hold and rise timeline.
   */
  bow: number;
  /**
   * 0..1 both hands joined in front of the breastbone (namaskar, with rHand / lHand "pranam"): the wrists are solved
   * every frame for any body turn, so the palms always meet. Overrides rS / rE / lS / lE by its weight.
   */
  join: number;
  /* ---- Episode 5 gestures (all 0 = off; every one is solved every frame and blends with its weight) ---- */
  /** 0..1 both hands clapped to the sides of the head (alarm: Binoy's "hay hay, gelo gelo"). Use with `shoutMouth`. */
  headHands: number;
  /** -1..1 one hand scratching the side of the head (puzzled); the sign picks the arm (+ right, - left). The fingers
   * keep scratching on the life clock, so it goes on in a pause. */
  scratch: number;
  /** -1..1 fingertips to the mouth (shock, worry: Binoy's mother at her door); the sign picks the arm. */
  mouthHand: number;
  /** 0..1 both hands go to the point PuppetProps.holdAt gives (a child's hand held in both hands: Charu). */
  hold: number;
  /** 0..1 the held hand turning in her hands: 0 as taken, 0.5 palm up, 1 turned over again (her wrists roll with it). */
  holdTurn: number;
  /** 0..1 with `hold`: the held hand is raised to her near cheek (the grip point then comes from the Puppet: read it
   * from PuppetProps.anchors to place the child's hand). */
  cheek: number;
  /** -1..1 a jab of one hand toward PuppetProps.pointAt (the sign picks the arm); see `jabPulse`. */
  jab: number;
  /** -1..1 one hand flung up, palm open (exasperation); the sign picks the arm. */
  throwUp: number;
  /** Bamboo pole (rProp or lProp "bamboo"): tilt of the pole from upright, degrees; + leans its top toward the side
   * the figure faces. */
  poleTilt: number;
  /** Bamboo pole: 0 = carried (it rides the hand as the pose's arm angles put it), 1 = its foot planted on the
   * ground (the arm is solved so the fist holds it there). */
  poleDrop: number;
  /** Bamboo pole: lift of its foot above the ground while planted (figure px); `bambooThump` keys it. */
  poleLift: number;
  /* ---- Episode 6 gestures (all 0 = off; solved every frame, blend with their weight; see EPISODE 6 PEOPLE below) ---- */
  /** -1..1 one open hand swung down onto PuppetProps.swatAt (sign = arm); drive it and swatHit with `swatPulse`. */
  swat: number;
  /** 0..1 the swat's travel along its arc: 0 = raised above the shoulder, 1 = the palm on swatAt. Not smoothed. */
  swatHit: number;
  /** 0..1 shoulders drawn up and the head sunk between them (fright, cowering). */
  hunch: number;
  /** -1..1 the index finger upright across the lips ("shh"); sign = arm. */
  shush: number;
  /** 0..1 both fists on the hips, elbows out. */
  hips: number;
  /** 0..1 both hands clasped behind the back (sheepish); both arms are drawn behind the body while > 0.5. */
  behind: number;
  /** -1..1 one hand to PuppetProps.reachAt (palm centre; sign = arm), with the pose's own hand shape. */
  reach: number;
  /** 0..1 with reach: 0 palm down (on a shoulder, dropping coins into a palm), 1 palm up (held out, asking). */
  reachUp: number;
  /** 0..1 both hands cupped together, palms up, at PuppetProps.reachAt (default: in front of the chest). */
  cupHands: number;
  /** -1..1 one foot lifted, knee up (sign = leg: + right, - left); drive with `stampPulse`. Not smoothed. */
  stamp: number;
}

export const BASE_POSE: Pose = {
  lean: 0,
  bodyX: 0,
  bodyY: 0,
  bodyTurn: 0,
  crouch: 0,
  headTurn: 0,
  headTilt: 0,
  headNod: 0,
  eyeX: 0,
  eyeY: 0,
  lid: 0,
  brow: 0,
  browTilt: 0,
  smile: 0.35,
  gasp: 0,
  cheeks: 0,
  flush: 0,
  tears: 0,
  rS: 6,
  rE: -8,
  lS: 6,
  lE: -8,
  rHand: "relaxed",
  lHand: "relaxed",
  rProp: "",
  lProp: "",
  stride: 0,
  rBack: 0,
  lBack: 0,
  kneel: 0,
  bow: 0,
  join: 0,
  headHands: 0,
  scratch: 0,
  mouthHand: 0,
  hold: 0,
  holdTurn: 0,
  cheek: 0,
  jab: 0,
  throwUp: 0,
  poleTilt: 0,
  poleDrop: 0,
  poleLift: 0,
  swat: 0,
  swatHit: 0,
  hunch: 0,
  shush: 0,
  hips: 0,
  behind: 0,
  reach: 0,
  reachUp: 0,
  cupHands: 0,
  stamp: 0,
};

export interface PropCtx {
  f: number;
  worldRot: number;
  side: 1 | -1;
  scale: number;
}
export type PropRenderer = (ctx: PropCtx) => React.ReactNode;

/** A light source in the same coordinates as the puppet (diya, sparkler, lantern, divine glow…). */
export interface SceneLight {
  x: number;
  y: number;
  color: string;
  intensity: number; // 0..1+
  radius: number; // falloff distance in px
  flicker?: number; // seed → flame flicker
}

/** Shot-level light sources; every Puppet inside reacts to them. */
export const SceneLights = React.createContext<SceneLight[]>([]);

export interface Lighting {
  keySide: 1 | -1;
  rim?: string;
  rimStrength?: number;
  rimSide?: 1 | -1;
  brightness?: number;
}

/* ------------------------------------------------------------------ */
/* Proportions                                                         */
/* ------------------------------------------------------------------ */

interface Body {
  headR: number;
  thigh: number;
  shin: number;
  foot: number;
  torsoLen: number;
  sw: number;
  hw: number;
  ua: number;
  fa: number;
  limbW: number;
  hand: number;
  neck: number;
  child: boolean;
}

const bodyFor = (c: CastMember): Body => {
  const b = bodyBase(c);
  const k = c.headScale;
  if (k === undefined || k === 1) return b;
  const m = lerp(1, k, 0.3);
  return { ...b, headR: b.headR * k, sw: b.sw * m, hw: b.hw * m, limbW: b.limbW * m, hand: b.hand * lerp(1, k, 0.4) };
};

const bodyBase = (c: CastMember): Body => {
  const h = c.height;
  const g = c.girth;
  if (c.age === "child") {
    return {
      headR: 40 * Math.sqrt(h),
      thigh: 47 * h,
      shin: 44 * h,
      foot: 21 * h,
      torsoLen: 66 * h,
      sw: 31 * h * (0.85 + g * 0.15),
      hw: 22 * h * g,
      ua: 36 * h,
      fa: 33 * h,
      limbW: 6.6 * h * (c.wiry ? 0.85 : 1),
      hand: 25 * h,
      neck: 7 * h,
      child: true,
    };
  }
  return {
    headR: 41 * Math.sqrt(h),
    thigh: 80 * h,
    shin: 74 * h,
    foot: 31 * h,
    torsoLen: 108 * h,
    sw: 47 * h * (0.85 + g * 0.15),
    hw: 34 * h * g,
    ua: 56 * h,
    fa: 52 * h,
    limbW: 8.8 * h * (c.wiry ? 0.82 : 1) * (0.9 + g * 0.1),
    hand: 37 * h,
    neck: 11 * h,
    child: false,
  };
};

const isFemale = (c: CastMember) => c.sex === "f" || c.hairStyle === "veil" || c.hairStyle === "pigtails" || c.outfit === "blouse" || c.outfit === "frock";

export const faceFor = (c: CastMember): FaceShape => {
  const base = c.age === "child" ? FACE_CHILD : isFemale(c) ? FACE_ADULT_F : FACE_ADULT_M;
  const elder: Partial<FaceShape> = c.age === "elder" ? { faceLen: base.faceLen * 1.05, cheek: base.cheek - 0.03, nose: base.nose * 1.12 } : {};
  return { ...base, ...elder, ...(c.face ?? {}) };
};

const capsule = (len: number, w1: number, w2: number) =>
  `M ${-w1} 0 Q ${-w1 * 1.06} ${len * 0.5} ${-w2} ${len} A ${w2} ${w2} 0 0 0 ${w2} ${len} Q ${w1 * 1.06} ${len * 0.5} ${w1} 0 A ${w1} ${w1} 0 0 0 ${-w1} 0 Z`;

/**
 * Anatomical limb segment along +y: wTop at the joint, swelling to wMid (muscle belly at
 * `midAt`), tapering to wEnd — e.g. deltoid→biceps→elbow, or forearm swell→wrist.
 */
const seg = (len: number, wTop: number, wMid: number, wEnd: number, midAt = 0.35) => {
  const m = len * midAt;
  return `M ${-wTop} 0 C ${-wTop * 1.06} ${m * 0.5} ${-wMid * 1.04} ${m * 0.8} ${-wMid} ${m} C ${-wMid * 0.98} ${m + (len - m) * 0.45} ${-wEnd * 1.04} ${len * 0.85} ${-wEnd} ${len} A ${wEnd} ${wEnd} 0 0 0 ${wEnd} ${len} C ${wEnd * 1.04} ${len * 0.85} ${wMid * 0.98} ${m + (len - m) * 0.45} ${wMid} ${m} C ${wMid * 1.04} ${m * 0.8} ${wTop * 1.06} ${m * 0.5} ${wTop} 0 A ${wTop} ${wTop} 0 0 0 ${-wTop} 0 Z`;
};

/** Tapered limb between two points. */
const limb = (ax: number, ay: number, bx: number, by: number, w1: number, w2: number) => {
  const len = Math.hypot(bx - ax, by - ay);
  const ang = (Math.atan2(bx - ax, by - ay) * 180) / Math.PI;
  return { d: capsule(len, w1, w2), t: `translate(${ax}, ${ay}) rotate(${-ang})` };
};

type V3 = [number, number, number];
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];

/** Convex hull (monotone chain) of 2D points. */
const hull = (pts: Array<[number, number]>) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Array<[number, number]> = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

export function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/* ------------------------------------------------------------------ */
/* Puppet                                                              */
/* ------------------------------------------------------------------ */

/**
 * How much a pose is a deliberate hold (0 = relaxed rest, 1 = clearly posed).
 * The default idle layer fades out as this rises, so crying, pointing or holding a child stay readable.
 */
const poseHold = (q: Pose): number => {
  const reach = Math.max(0, Math.max(Math.abs(q.rS - BASE_POSE.rS), Math.abs(q.lS - BASE_POSE.lS)) - 6) / 25;
  const elbow = Math.max(0, Math.max(Math.abs(q.rE - BASE_POSE.rE), Math.abs(q.lE - BASE_POSE.lE)) - 8) / 40;
  const back = Math.max(q.rBack, q.lBack);
  const hands = q.rHand !== BASE_POSE.rHand || q.lHand !== BASE_POSE.lHand || q.rProp || q.lProp ? 1 : 0;
  const body = Math.abs(q.lean) / 3 + q.crouch + Math.abs(q.headTurn) / 0.5 + Math.abs(q.headNod) / 4 + Math.abs(q.headTilt) / 4 + q.kneel + q.bow + q.join + Math.abs(q.headHands) + Math.abs(q.scratch) + Math.abs(q.mouthHand) + q.hold + Math.abs(q.jab) + Math.abs(q.throwUp) + Math.abs(q.swat) + q.hunch + Math.abs(q.shush) + q.hips + q.behind + Math.abs(q.reach) + q.cupHands + Math.abs(q.stamp);
  const emotion = Math.max(q.tears, q.gasp) * 2;
  const moving = Math.abs(q.stride) * 2;
  return clamp(Math.max(reach, elbow, back, hands, body, emotion, moving));
};

/**
 * Head roll (degrees, the sum of the pose's headTilt, idle tilt and speech emphasis), softly limited to about +-14 deg:
 * unchanged up to 10 deg, so ordinary tilts look exactly as before; a stronger roll no longer swings the head off the
 * neck line (Episode 4 audit: a 20 deg roll read as a sheared, detached head).
 */
const headRoll = (t: number) => {
  const a = Math.abs(t);
  return a <= 10 ? t : Math.sign(t) * (10 + 4 * Math.tanh((a - 10) / 4));
};
/**
 * How far a rolled head pivots at the neck top instead of its own centre: 0 below 6 deg (exactly as before), 1 from
 * 14 deg (the jaw stays over the neck, the crown swings), eased between.
 */
const neckPivotW = (rollDeg: number) => {
  const k = clamp((Math.abs(rollDeg) - 6) / 8);
  return k * k * (3 - 2 * k);
};

/* Idle-layer helpers (adults only). Deterministic in frame and seed; timings assume 24 fps. */

/** Ease in and out over the unit interval. */
const easeIO = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));

/** Soft 0 -> 1 -> 0 envelope: eases in over `rise` frames from `start`, holds, eases out over `fall` frames ending at start + dur. */
const bump = (t: number, start: number, dur: number, rise: number, fall: number) =>
  easeIO((t - start) / rise) * easeIO((start + dur - t) / fall);

/** Wrap an angle into [-pi, pi). */
const wrapPh = (a: number) => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI));

/** 0 -> 1 -> 0 over the angles a < b < e: eases up from a to the peak at b, back down by e. */
const hump = (q: number, a: number, b: number, e: number) =>
  q <= a || q >= e ? 0 : q < b ? easeIO((q - a) / (b - a)) : easeIO((e - q) / (e - b));

/** The irregular segment containing frame f; segment lengths are drawn in [minF, maxF] from the figure's seed. */
const segmentAt = (f: number, seed: number, ch: number, minF: number, maxF: number) => {
  let start = 0;
  for (let k = 0; k < 4000; k++) {
    const len = minF + (maxF - minF) * hash(seed * 31.7 + ch * 17.3 + k * 5.9);
    if (f < start + len) return { k, start, len };
    start += len;
  }
  return { k: 4000, start, len: minF };
};

/** Weight transfer between the feet: -1 = all weight on the left foot, +1 = on the right. Changes every 3 to 5 s, eased. */
const weightAt = (f: number, seed: number): number => {
  const bit = hash(seed * 3.3 + 1.7) < 0.5 ? 0 : 1;
  const target = (k: number) => ((k + bit) & 1 ? 1 : -1) * (0.8 + 0.2 * hash(seed * 9.1 + k * 2.3 + 5));
  const s = segmentAt(f, seed, 1, 72, 120);
  const tr = s.len * (0.35 + 0.15 * hash(seed * 4.1 + s.k * 1.7 + 9));
  return lerp(target(s.k - 1), target(s.k), easeIO((f - s.start) / tr));
};

/** Head glance in headTurn units: every 4 to 7 s the head turns to one side, holds, then returns. */
const glanceAt = (t: number, seed: number): number => {
  const s = segmentAt(t, seed, 9, 96, 168);
  const h = (j: number) => hash(seed * 6.2 + s.k * 3.7 + j);
  const dur = 56 + 24 * h(2);
  const start = s.start + 8 + h(4) * Math.max(0, s.len - dur - 16);
  return (h(6) < 0.5 ? -1 : 1) * (0.22 + 0.16 * h(8)) * bump(t, start, dur, 14, 18);
};

/** Occasional hand-to-hip touch for one arm: 0..1 envelope, about 2.5 to 3.5 s, on roughly half of the 12 to 20 s segments. */
const fidgetAt = (t: number, seed: number, side: 1 | -1): number => {
  const s = segmentAt(t, seed, 5, 300, 480);
  const h = (j: number) => hash(seed * 2.9 + s.k * 1.3 + j);
  if (h(1) > 0.55) return 0;
  if ((h(2) < 0.5 ? 1 : -1) !== side) return 0;
  const dur = 60 + 20 * h(3);
  const start = s.start + 30 + h(4) * (s.len - dur - 60);
  return bump(t, start, dur, 14, 18);
};

/* Breathing (MOT-20). Every cycle is its own irregular segment: 3.5 to 5 s for adults, a little quicker for
 * children, with its own depth. Inside a cycle the inhale is a touch quicker than the exhale and there is a
 * short rest at the bottom. Output is a lift in [0, ~1.15] (0 = rest, 1 = a normal full inhale). */

/** One breath on a fixed-rate clock tau (frames at the calm rate); child cycles are shorter. */
const breathCycle = (tau: number, seed: number, child: boolean): number => {
  const s = child ? segmentAt(tau, seed, 13, 80, 100) : segmentAt(tau, seed, 13, 88, 120);
  const h = (j: number) => hash(seed * 7.3 + s.k * 2.9 + j);
  const u = (tau - s.start) / s.len;
  const inh = 0.34 + 0.06 * h(1); // inhale share of the cycle
  const exh = 0.44 + 0.08 * h(2); // exhale share; the rest of the cycle is the pause at the bottom
  const depth = 0.82 + 0.33 * h(3);
  if (u < inh) return depth * easeIO(u / inh);
  if (u < inh + exh) return depth * (0.5 + 0.5 * Math.cos(Math.PI * Math.pow((u - inh) / exh, 0.85)));
  return 0;
};

/** Breathing rate levels: an animated breathRate cross-fades between two fixed-rate clocks, so the phase never races. */
const BREATH_RATES = [0.6, 0.8, 1, 1.3, 1.6, 2, 2.5];

const breathAtRate = (t: number, rate: number, seed: number, child: boolean): number => {
  const r = clamp(rate, BREATH_RATES[0], BREATH_RATES[BREATH_RATES.length - 1]);
  let i = 0;
  while (i < BREATH_RATES.length - 2 && r > BREATH_RATES[i + 1]) i++;
  const r0 = BREATH_RATES[i];
  const r1 = BREATH_RATES[i + 1];
  const k = easeIO((r - r0) / (r1 - r0));
  const b0 = k < 1 ? breathCycle(t * r0, seed, child) : 0;
  const b1 = k > 0 ? breathCycle(t * r1 + 500, seed + 0.37, child) : 0;
  return lerp(b0, b1, k);
};

export interface BreathInput {
  /** Life clock (frames): drives the breathing cycles. */
  t: number;
  /** Story clock (frames): talk and sigh are sampled on it. */
  f: number;
  seed: number;
  child?: boolean;
  stillness?: number;
  /** 1 = calm; about 1.6 = frightened; may be animated per frame. */
  rate?: number;
  /** 0..1 envelope of a visible deep breath of relief. */
  sigh?: (f: number) => number;
  talk?: (f: number) => number;
}

/**
 * Breath lift for a Puppet figure, in body units before the figure's scale (positive = up).
 * `chest` raises the shoulders (and the arms, which hang from them); `head` is the smaller, slightly later
 * share the head takes. Exported so scenes that mirror Puppet's shoulder for arm targets (a held baby) can
 * use exactly the same numbers.
 */
export const puppetBreath = ({ t, f, seed, child = false, stillness = 0, rate = 1, sigh, talk }: BreathInput) => {
  const still = clamp(stillness);
  const amp = (child ? 1.0 : 1.3) * (1 - 0.35 * still);
  const r = rate * (1 - 0.12 * still);
  const ampRate = Math.min(1.3, 0.85 + 0.15 * r); // frightened breaths sit higher in the chest

  // speech: shallower breathing during a passage of talk, with a small catch-breath in each phrase pause
  let speaking = 0;
  let pauseLift = 0;
  if (talk) {
    const on = (fr: number) => talk(fr) >= 0.05;
    for (let k = -30; k <= 12; k += 2) {
      if (on(f + k)) speaking = Math.max(speaking, 1 - Math.abs(k) / (k < 0 ? 32 : 14));
    }
    // the latest pause (5+ frames of silence after speech): a quick catch-breath in the gap (about 9 frames), then the
    // air goes out slowly, through the next phrase (about 2 s) or, in a long silence, back into the calm cycle
    const inPause = (g: number, gap: number) => clamp((gap - 3) / 10) * easeIO(g / Math.min(9, gap)) * (1 - easeIO((g - 12) / 40));
    let back = 0;
    while (back < 72 && on(f - back)) back++; // frames of speech since the pause ended (0 = in a pause now)
    if (back < 72) {
      let g0 = 0;
      while (g0 < 60 && !on(f - back - g0)) g0++;
      let g1 = 0;
      if (back === 0) while (g1 < 24 && !on(f + 1 + g1)) g1++;
      const spokeBefore = g0 < 60 && on(f - back - g0);
      const gap = back === 0 ? g0 + g1 : g0;
      if (spokeBefore && gap >= 5) {
        pauseLift = back === 0 ? inPause(g0, gap) : inPause(gap, gap) * (1 - easeIO(back / 48));
      }
    }
  }

  // sigh of relief: a slower, deeper inhale that follows the cue, a long exhale (about 2 s) after its peak, and a small
  // drop of the shoulders below rest as the air goes out, which then recovers
  let sighLift = 0;
  let sighBusy = 0;
  if (sigh) {
    const sv = (fr: number) => clamp(sigh(fr));
    // held envelope: the cue, or its recent peak released slowly
    const held = (fr: number) => {
      let m = 0;
      for (let k = 0; k <= 48; k += 2) m = Math.max(m, sv(fr - k) * (1 - easeIO(k / 48)));
      return m;
    };
    const env = (held(f) + held(f - 2) + held(f - 4) + held(f - 6)) / 4; // smoothed, so the inhale is slow too
    let b = 0;
    for (let k = 12; k <= 48; k += 4) b += sv(f - k);
    const late = b / 10;
    sighLift = 2.2 * env - 1.0 * clamp(late - env);
    sighBusy = clamp(Math.max(env, late) * 1.6);
  }

  const reg = breathAtRate(t, r, seed, child) * ampRate * (1 - 0.75 * speaking) * (1 - sighBusy);
  const chest = amp * (reg + 0.55 * pauseLift + sighLift);
  const regHead = breathAtRate(t - 3, r, seed, child) * ampRate * (1 - 0.75 * speaking) * (1 - sighBusy);
  const head = amp * 0.38 * (regHead + 0.55 * pauseLift + sighLift);
  return { chest, head };
};

/* Pose blending (adults). Scene poses may arrive stepped, linear or keyed; every body channel is filtered with a
 * raised-cosine kernel, so a step becomes an ease-in-out over about 9 frames and no joint jumps faster than that. */

type NumKey = { [K in keyof Pose]: Pose[K] extends number ? K : never }[keyof Pose];
const BODY_KEYS: NumKey[] = ["lean", "bodyX", "bodyY", "bodyTurn", "crouch", "headTurn", "headTilt", "headNod", "rS", "rE", "lS", "lE", "stride", "rBack", "lBack", "kneel", "bow", "join", "headHands", "scratch", "mouthHand", "hold", "holdTurn", "cheek", "jab", "throwUp", "poleTilt", "poleDrop", "poleLift", "swat", "hunch", "shush", "hips", "behind", "reach", "reachUp", "cupHands"];
const EYE_KEYS: NumKey[] = ["eyeX", "eyeY"];
/** Raised-cosine weights for offsets -r..r (window of 2r + 2 frames, so the ends carry a little weight). */
const kernel = (r: number) => Array.from({ length: 2 * r + 1 }, (_, i) => 0.5 + 0.5 * Math.cos((Math.PI * (i - r)) / (r + 1)));
const BODY_W = kernel(4); // a step eases over ~9 frames
const EYE_W = kernel(2); // eyes stay quick
/** Position jumps bigger than this inside the window are cuts or re-entries, not motion: they are never smeared. */
const CUT_PX = 120;

const blendPose = (at: (fr: number) => Pose, t: number): Pose => {
  const base = at(t);
  const out: Pose = { ...base };
  const run = (keys: NumKey[], W: number[]) => {
    const r = (W.length - 1) / 2;
    for (const k of keys) {
      const b0 = base[k];
      let s = 0;
      let w = 0;
      for (let i = -r; i <= r; i++) {
        const v = at(t + i)[k];
        if (!Number.isFinite(v)) continue;
        if ((k === "bodyX" || k === "bodyY") && Math.abs(v - b0) > CUT_PX) continue;
        s += v * W[i + r];
        w += W[i + r];
      }
      out[k] = w > 0 ? s / w : b0;
    }
  };
  run(BODY_KEYS, BODY_W);
  run(EYE_KEYS, EYE_W);
  return out;
};

export interface PuppetProps {
  cast: CastMember;
  f: number;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  acting?: (f: number) => Partial<Pose>;
  mouth?: (f: number) => MouthState;
  talk?: (f: number) => number;
  light?: Lighting;
  lights?: SceneLight[];
  seated?: boolean;
  props?: Record<string, PropRenderer>;
  opacity?: number;
  stillness?: number;
  /** Breathing rate: 1 = calm (default), about 1.6 = frightened. May be animated per frame. */
  breathRate?: number;
  /** 0..1 envelope (story clock) for a visible deep breath of relief: slow deeper inhale, long exhale, shoulder drop. */
  sigh?: (f: number) => number;
  /**
   * Life clock. Breathing, blinks, saccades, idle sway, weight shifts and other idle life run on lifeF ?? f;
   * poses, acting, mouth, talk and everything story-driven stay on f, so a scene can hold its story while life goes on.
   */
  lifeF?: number;
  /** World point (story clock) the hands go to under Pose.hold: the child's hand Charu takes (Episode 5). */
  holdAt?: (f: number) => { x: number; y: number };
  /** World point (story clock) a Pose.jab points at (Haricharan's jab toward the grove). */
  pointAt?: (f: number) => { x: number; y: number };
  /** Bamboo pole length in figure px (before scale); default about 1.05 x the figure's own height. */
  poleLength?: number;
  /**
   * Called during render with this frame's world points (after the figure's x, y, scale and flip): the head centre,
   * the near cheek, the mouth, both wrists, the hold point (Pose.hold / cheek) and, with a bamboo, the pole's grip,
   * foot (`poleBase`) and top (`poleTip`). Write them into a plain object and render whatever must touch them (a
   * child's arm, a dust puff at the pole's foot) AFTER this Puppet in the same tree: React renders siblings in order.
   */
  anchors?: (a: PuppetAnchors) => void;
  /** World point (story clock) the open palm lands on under Pose.swat (the younger brother's back). */
  swatAt?: (f: number) => { x: number; y: number };
  /** World point (story clock) for Pose.reach (palm centre) and Pose.cupHands (the cupped palms' centre). */
  reachAt?: (f: number) => { x: number; y: number };
  /**
   * Episode 6: "khadam" puts wooden sandals (খড়ম) under both feet: a flat wooden sole a little longer than the foot
   * with a toe peg and its round knob held between the big and second toe, in the colours of the resting pair in
   * episode05 Scene99 (KhadamOne). The figure stands on them (raised by the sole's thickness); the sole stays flat on
   * the ground while the foot is planted and lifts with it in a walk. Standing, walking and crouching only (not seated,
   * kneeling, or under a sari). Default: barefoot, exactly as before. See `walkPlantFrames` for the clack frames.
   */
  footwear?: "khadam";
  /**
   * Episode 4 (Ghibli) on, opt-in floor-sitting bodies (absent = exactly the older looks):
   *  - "crossLegged": sitting cross-legged on the floor (sukhasana / the priest's puja seat): two thighs out to the
   *    knees, the shins crossed in front with the feet tucked under the opposite knees, a compact folded dhoti lap
   *    (knee lobes, front pleats, the hem over the shins, bare feet), seen a little from above. The upper body bends
   *    at the waist over planted hips. Weight: 1 with `seated`, else Pose.kneel (so a scene that keys kneel 1 -> 0
   *    gets up out of it).
   *  - "kneel": a woman kneeling sitting back on her heels (vajrasana) under her sari: compact knee volume and the
   *    soles behind, not a flat cloth pool; with Pose.bow the kneeling pranam (panchanga) reads as hips back on the
   *    heels, the back rounded forward over the knees and the forehead and joined hands on the floor. Weight:
   *    Pose.kneel (with or without `seated`).
   */
  sitStyle?: "crossLegged" | "kneel";
  /**
   * Episode 4 (Ghibli) on, opt-in: softer fitted blouse sleeves (a woman's half sleeve ends above the elbow, tapers
   * and carries a fold and an inner shade), so the upper arms no longer read as rigid coloured tubes. Absent = as before.
   */
  softSleeves?: boolean;
  /**
   * Episode 4 (Ghibli) on, opt-in: Pose.reach lands ON reachAt. The hand's grip (curled fingers) closes on the point
   * instead of the palm centre stopping a little before it, and a target just past the straight arm is still met: the
   * arm stretches up to 15% (imperceptible at that length) rather than stopping short. Use with rHand / lHand "hold"
   * to grip (a brother taking a child's wrist). Absent = the older reach, unchanged.
   */
  reachExact?: boolean;
  /**
   * Episode 4 (Ghibli) on, opt-in: how far a pointing arm (Pose.jab) extends toward pointAt, as a fraction of the arm's
   * length (default 0.93, nearly straight). About 0.8 keeps a soft elbow bend for a scolding finger.
   */
  pointReach?: number;
}

type XY = { x: number; y: number };
/** World points of a Puppet for one frame (see PuppetProps.anchors). */
export interface PuppetAnchors {
  head: XY;
  cheek: XY;
  mouth: XY;
  rWrist: XY;
  lWrist: XY;
  hold: XY | null;
  poleGrip: XY | null;
  poleBase: XY | null;
  poleTip: XY | null;
  /**
   * Episode 6: each foot's sole centre on the ground plane (world px; with khadam, the wooden sole's underside) and its
   * lift above the ground (world px, 0 = planted). The leg with the larger lift is the swinging one.
   */
  feet: Array<{ side: 1 | -1; x: number; y: number; lift: number }>;
}

export const Puppet: React.FC<PuppetProps> = ({
  cast: c,
  f,
  x,
  y,
  scale = 1,
  flip = false,
  acting,
  mouth,
  talk,
  light = { keySide: -1 },
  seated = false,
  props = {},
  opacity = 1,
  stillness = 0,
  lights: ownLights = [],
  breathRate = 1,
  sigh,
  lifeF,
  holdAt,
  pointAt,
  poleLength,
  anchors,
  swatAt,
  reachAt,
  footwear,
  sitStyle: sitStyleProp,
  softSleeves = false,
  reachExact = false,
  pointReach = 0.93,
}) => {
  const sitStyle = sitStyleProp;
  const life = lifeF ?? f; // life clock (idle life); f stays the story clock
  const ctxLights = React.useContext(SceneLights);
  const lights = ctxLights.length ? [...ctxLights, ...ownLights] : ownLights;
  const uid = safeId(useId()) + c.id;
  const B = bodyFor(c);
  const female = isFemale(c);
  const adult = c.age !== "child";
  // raw scene poses, sampled once per frame offset
  const rawCache = new Map<number, Pose>();
  const at = (fr: number): Pose => {
    let q = rawCache.get(fr);
    if (!q) {
      q = { ...BASE_POSE, ...(acting ? acting(fr) : {}) };
      rawCache.set(fr, q);
    }
    return q;
  };
  // adults: eased (blended) poses; children keep the scene's own timing
  const blendCache = new Map<number, Pose>();
  const sample = (fr: number): Pose => {
    if (!adult || !acting) return at(fr);
    let q = blendCache.get(fr);
    if (!q) {
      q = blendPose(at, fr);
      blendCache.set(fr, q);
    }
    return q;
  };
  // overlap, follow-through and anticipation strength: off for children, scaled down by stillness so holds stay readable
  const live = adult ? 1 - clamp(stillness) : 0;
  const lagF = (n: number) => Math.round(n * live);
  const p = sample(f);
  const pHead = sample(f - 2);
  const pEye = sample(f - 2 + lagF(3)); // the eyes lead the head by ~3 frames
  const pCloth = sample(f - 5);
  const pPrev = sample(f - 4);
  // arms: the upper arm leads; the forearm follows ~3 frames behind and the hand ~2 more
  const armLag = lagF(3);
  const pArm = sample(f - armLag);
  const pArm2 = sample(f - armLag - lagF(2));
  const foreArm = (S: number, Slag: number, Elag: number) => {
    const drag = Elag - clamp(0.35 * (S - Slag), -20, 20);
    return Math.min(drag, Math.max(0, Elag)); // follow-through never hyperextends the elbow
  };
  const eR = foreArm(p.rS, pArm.rS, pArm.rE);
  const eL = foreArm(p.lS, pArm.lS, pArm.lE);
  const wristR = live * clamp(0.3 * (pArm2.rS + pArm2.rE - (pArm.rS + pArm.rE)), -14, 14);
  const wristL = live * clamp(0.3 * (pArm2.lS + pArm2.lE - (pArm.lS + pArm.lE)), -14, 14);
  // loose cloth (sari end, dhoti, scarf, hair) trails the body by ~6 frames
  const fs = flip ? -1 : 1;
  const pTrail = sample(f - lagF(6));
  const clothTrail = live * clamp((pTrail.bodyX - p.bodyX) * fs * 0.12 + (pTrail.lean - p.lean) * 1.2, -7, 7);
  // anticipation + settle: before a large change in height / lean / travel a small opposite dip (~5 frames ahead),
  // after it a small overshoot that eases back over ~8 frames. The two terms cancel during steady motion.
  const pAhead = adult ? sample(f + 5) : p;
  const pBehind = adult ? sample(f - 8) : p;
  const antic = (sig: (q: Pose) => number, gain: number, mNeg: number, mPos: number) => {
    if (live <= 0) return 0;
    const now = sig(p);
    const L = gain * (-(sig(pAhead) - now) + 0.625 * (now - sig(pBehind)));
    const M = L < 0 ? mNeg : mPos;
    return live * M * Math.tanh(L / M);
  };
  const crouchPx = (B.thigh + B.shin) * 0.55;
  const antY = antic((q) => q.bodyY + clamp(q.crouch) * crouchPx, 0.12, 2.5, 3.5); // px, up is negative
  const antX = fs * antic((q) => q.bodyX, 0.06, 3, 3); // px, in the puppet's local frame
  const antLean = antic((q) => q.lean, 0.15, 1.2, 1.2); // degrees (~3 px at the shoulders)

  const keySide = light.keySide;
  // ---- motivated lighting: nearby sources set rim colour/side, brightness and light-wrap ----
  const headWX = x + p.bodyX;
  const headWY = y + p.bodyY - (c.age === "child" ? 190 : 300) * scale;
  let lightSum = 0;
  let dom: { l: SceneLight; k: number } | null = null;
  for (const l of lights) {
    const d = Math.hypot(l.x - headWX, l.y - headWY);
    const fl = l.flicker !== undefined ? flicker(f, l.flicker) : 1;
    const k = l.intensity * Math.pow(clamp(1 - d / l.radius), 1.5) * fl;
    lightSum += k;
    if (!dom || k > dom.k) dom = { l, k };
  }
  const domSide: 1 | -1 = dom && dom.l.x >= headWX ? 1 : -1;
  const useDom = dom !== null && dom.k > 0.04;
  const rim = useDom ? dom!.l.color : light.rim ?? "#ffcf87";
  const rimStrength = Math.min(0.95, (light.rimStrength ?? 0.55) + lightSum * 0.5);
  const rimSide: 1 | -1 = useDom ? ((flip ? -domSide : domSide) as 1 | -1) : light.rimSide ?? (-keySide as 1 | -1);
  const wrap = clamp(lightSum * 0.55, 0, 0.6);

  // breathing (MOT-20): irregular cycles on the life clock; shallower under speech, quicker in fright, sighs on cue.
  // Only the chest and shoulders rise (the arms hang from them); the head takes a smaller, later share.
  const breath = puppetBreath({ t: life, f, seed: c.seed, child: c.age === "child", stillness, rate: breathRate, sigh, talk });
  const level = talk ? talk(f) : 0;
  const emphasis = level * Math.sin(f * 0.55 + c.seed) * 2.2 * (1 - 0.7 * stillness);

  // Idle life: default layer for adult figures only; scaled down by stillness and by any deliberate pose hold.
  const idle = c.age === "child" ? 0 : Math.max(0, 1 - stillness) * (1 - poseHold(p));
  // weight transfer: hips and shoulders move toward the bearing foot, eased every 3 to 5 s (seated figures keep their hips)
  const wNow = weightAt(life, c.seed);
  const kneelK = clamp(p.kneel); // kneeling on both knees (see Pose.kneel)
  const bowK = clamp(p.bow); // the kneeling bow (see Pose.bow)
  // PuppetProps.sitStyle (opt-in floor sits): their weights; 0 = the older bodies, unchanged
  const crossW = sitStyle === "crossLegged" ? (seated ? 1 : kneelK) : 0;
  const crossOn = crossW > 0.5;
  const vajraW = sitStyle === "kneel" && c.lower === "saree" ? kneelK : 0;
  const vajraOn = vajraW > 0.5;
  // in the kneeling pranam (sitStyle "kneel") the head turns on to full profile, so the forehead (not a cheek) is down
  const bowProfile = sitStyle === "kneel" ? (p.bodyTurn >= 0 ? 1 : -1) * 0.6 * clamp(p.bow) : 0;
  // ... and the neck bends on down, so the forehead (not the crown) meets the floor
  const bowNeck = sitStyle === "kneel" ? (p.bodyTurn >= 0 ? 1 : -1) * 18 * clamp(p.bow) : 0;
  const shift = seated || crossW > 0 ? 0 : idle * 3 * wNow * (1 - kneelK);
  // slow side-to-side drift of the upper body, about 2.5 px, irregular per figure, plus the weight transfer
  const weightX = idle * 2.5 * noise1(life / 144, c.seed + 11) + shift;
  // shoulders tip toward the bearing side, up to about 0.9 deg
  const tiltIdle = idle * 0.9 * wNow;
  // head: small tilt, plus a glance toward a point of interest every 4 to 7 s; the eyes lead it by 4 frames
  const headTiltIdle = idle * 2.5 * noise1(life / 96, c.seed + 3);
  const headTurnIdle = idle * 0.035 * noise1(life / 112, c.seed + 7) + idle * glanceAt(life, c.seed);
  const eyeGlance = idle * glanceAt(life + 4, c.seed) * 1.15;
  // elbows: a soft 8 to 12 degree bend at rest, never locked straight
  const restElbow = (n: number) => -(10 + 2 * noise1(life / 120, c.seed + n));
  const elbowR = lerp(eR, Math.min(eR, restElbow(21)), idle);
  const elbowL = lerp(eL, Math.min(eL, restElbow(23)), idle);
  // resting arms: swing from the shoulder (lagging the body's weight shift, plus noise), the elbow bends with the swing,
  // the hand closes slightly; an occasional hand-to-hip touch rides on top
  const armIdle = (side: 1 | -1) => {
    const lagV = wNow - weightAt(life - 6, c.seed);
    const swing = idle * 2.2 * noise1(life / 58, c.seed + 31 + side * 4) - idle * side * 12 * lagV;
    const touch = idle * fidgetAt(life, c.seed, side);
    return {
      dS: swing - 3 * touch,
      dE: -0.6 * swing - 40 * touch,
      flex: idle * (0.3 * (0.5 + 0.5 * noise1(life / 90, c.seed + 51 + side)) + 0.5 * touch),
    };
  };
  const armR = armIdle(1);
  const armL = armIdle(-1);
  // cloth follows the weight shift with a short lag
  const clothWeight = idle * 2.0 * weightAt(life - 8, c.seed);

  const phi = clamp(p.bodyTurn, -1, 1) * 0.95; // body yaw (rad)
  const cphi = Math.cos(phi);
  const sphi = Math.sin(phi);
  const swingVel = (p.lean - pPrev.lean) * 1.6 + (p.bodyX - pPrev.bodyX) * 0.4;
  const clothSway = Math.sin(life * 0.07 + c.seed) * 2.2 * (1 - 0.6 * idle) - swingVel * 3 + clothWeight + idle * 1.2 * noise1(life / 58, c.seed + 41) + clothTrail;

  /* ---------------- legs in 3D ---------------- */
  // Wider hip sockets when seated / kneeling so the lower cloth base reads as a stable lap, not a tube.
  const hipX = B.hw * (seated || kneelK > 0.35 ? 0.88 : 0.48);
  const phase = f * 0.3 + c.seed;
  const stride = p.stride;
  const crouch = clamp(p.crouch);
  // how low the figure is for the sari's drape: a crouch or a kneel (identical to crouch when not kneeling)
  const lowK = Math.max(crouch, kneelK);
  const nearSide: 1 | -1 = sphi > 0.05 ? -1 : 1; // leg nearer the camera
  // `plant`: the stance-leg model (no swing knee flick). Scenes match their travel speed to it, so a foot placed with
  // it stays fixed on the floor through the stance and moves smoothly forward through the swing.
  // kneeling (Pose.kneel): thighs forward and down to the knees on the floor, shins straight back along the floor
  // (sp = th - kn stays at -1.5); as she bows the hips rise a little off the heels (the thigh stands up)
  const KNEEL_TH = lerp(1.3, 0.92, bowK);
  // Seated + dhoti (male purohit): keep cross-legged seat — do not let kneel override into a flat wedge.
  // Saree seated+kneel (Charu / Thakurma pranam) still blends kneel for vajrasana under the cloth pool.
  const kneelLegs = seated && c.lower !== "saree" ? 0 : kneelK;
  const legAnglesK = (side: 1 | -1, plant = false) => {
    const a = legAnglesBase(side, plant);
    if (kneelLegs <= 0) return a;
    // Ep04 adults sit with kneel=1 (not seated=true). Male dhoti village squat: knees open wide (not a closed
    // women's cloth balloon). Saree floor-sit: wider knees so two cloth mounds read under the pool.
    const kneelAb = c.lower === "saree" ? (seated ? 0.92 : 0.62) : seated ? 1.05 : 1.42;
    const kneelTh = c.lower === "saree" && seated ? lerp(KNEEL_TH, 1.12, 0.55) : c.lower === "dhoti" && !seated ? lerp(KNEEL_TH, 1.05, 0.35) : KNEEL_TH;
    return { th: lerp(a.th, kneelTh, kneelLegs), ab: lerp(a.ab, kneelAb, kneelLegs), kn: lerp(a.kn, kneelTh + 1.5, kneelLegs) };
  };
  // Episode 6 (Pose.stamp): one knee comes up (thigh forward, shin folded back) and the foot drops back flat
  const stampK = seated ? 0 : clamp(Math.abs(p.stamp)) * (1 - kneelK);
  const legAngles = (side: 1 | -1, plant = false) => {
    const a = legAnglesK(side, plant);
    if (stampK <= 0 || Math.sign(p.stamp) !== side) return a;
    return { th: a.th + 0.62 * stampK, ab: a.ab, kn: a.kn + 1.15 * stampK };
  };
  function legAnglesBase(side: 1 | -1, plant = false) {
    // Cross-legged / floor seat: dhoti keeps a wide lap; saree sits with knees forward under a soft cloth crown (ref lady sit).
    if (seated) return c.lower === "saree" ? { th: 1.12, ab: 0.98, kn: 2.42 } : { th: 1.42, ab: 1.12, kn: 2.72 };
    let th = 0.03;
    let kn = 0.05;
    let ab = 0.04;
    if (stride > 0) {
      const ph = phase + (side > 0 ? Math.PI : 0);
      th += Math.sin(ph) * 0.42 * stride;
      kn += (0.12 + (plant ? 0 : Math.max(0, Math.sin(ph + 1.7)) * 0.9)) * stride;
    }
    if (crouch > 0) {
      const k = clamp(crouch / 0.6);
      th = lerp(th, 0.85, k);
      kn = lerp(kn, 1.55, k);
      ab = lerp(ab, 0.12, k);
      if (crouch > 0.6) {
        const k2 = clamp((crouch - 0.6) / 0.4);
        if (side === nearSide) {
          th = lerp(th, 1.45, k2);
          kn = lerp(kn, 1.5, k2);
        } else {
          th = lerp(th, 0.05, k2);
          kn = lerp(kn, 1.8, k2);
        }
      }
    }
    // the bearing knee takes a little bend; the free leg stays straight
    if (!seated) kn += idle * 0.1 * Math.max(0, side > 0 ? wNow : -wNow);
    return { th, ab, kn };
  }
  const rotY = (v: V3): { x: number; y: number; z: number } => ({ x: v[0] * cphi + v[2] * sphi, y: v[1], z: -v[0] * sphi + v[2] * cphi });
  const legGeo = (side: 1 | -1, plant = false) => {
    const { th, ab: abRaw, kn } = legAngles(side, plant);
    // the hip moves with the weight shift; abduction compensates so the foot stays planted
    const ab = abRaw - (shift * side) / (B.thigh + 0.3 * B.shin);
    const hip: V3 = [side * hipX + shift, 0, 0];
    const tdir: V3 = [Math.sin(ab) * side, Math.cos(th) * Math.cos(ab), Math.sin(th) * Math.cos(ab)];
    const knee = add3(hip, mul3(tdir, B.thigh));
    const sp = th - kn;
    // Kneeling: keep shins folded back under a wide knee spread (do not pull ankles inward).
    const sdir: V3 = [
      Math.sin(ab) * side * (kneelLegs > 0 ? lerp(seated ? -1.2 : -0.85, seated ? -1.05 : -0.7, kneelLegs) : seated ? -1.2 : 0.3),
      Math.cos(sp),
      Math.sin(sp),
    ];
    const ankle = add3(knee, mul3(sdir, B.shin));
    let fv: V3 = [0, 0, 1];
    if (seated) fv = [-side * 0.9, 0, 0.45];
    else if (sp < -1.0) fv = [0, 0.25, -1];
    if (kneelLegs > 0 && (seated || sp < -1.0)) {
      // kneeling: the top of the foot lies on the floor, toes pointing back
      const kv: V3 = [lerp(fv[0], 0, kneelLegs), lerp(fv[1], 0.05, kneelLegs), lerp(fv[2], -1, kneelLegs)];
      const n = Math.hypot(kv[0], kv[1], kv[2]) || 1;
      fv = [kv[0] / n, kv[1] / n, kv[2] / n];
    }
    const fh = B.foot * 0.28;
    const sole = add3(ankle, [0, fh, 0]);
    const perp: V3 = [fv[2], 0, -fv[0]];
    const heel = add3(sole, mul3(fv, -B.foot * 0.22));
    const toe = add3(sole, mul3(fv, B.foot * 0.82));
    const fw = B.foot * 0.3;
    return {
      side,
      hip: rotY(hip),
      knee: rotY(knee),
      ankle: rotY(ankle),
      heelL: rotY(add3(heel, mul3(perp, -fw * 0.8))),
      heelR: rotY(add3(heel, mul3(perp, fw * 0.8))),
      toeL: rotY(add3(toe, mul3(perp, -fw))),
      toeR: rotY(add3(toe, mul3(perp, fw))),
      toeTip: rotY(add3(toe, mul3(fv, B.foot * 0.12))),
      lowest: Math.max(sole[1], knee[1] + B.limbW * 1.2),
      kneeDown: kn > 1.6 && th < 0.3,
      z: rotY(knee).z + rotY(hip).z,
      // Episode 6 (khadam): the sole centre and the foot's own axes, in the rotated figure frame
      soleP: rotY(sole),
      fwdP: rotY(fv),
      perpP: rotY(perp),
    };
  };
  const legs = [legGeo(-1), legGeo(1)];
  // cross-legged (sitStyle): the hip joints sit about a thigh's thickness above the floor
  const crossSeatH = B.limbW * 1.45 * 1.55;
  const groundLegacy = Math.max(...legs.map((l) => l.lowest));
  // kneeling on the heels (sitStyle "kneel"): heel + shin + a little seat under the hip joints; the hips lift off the
  // heels as she bows (pranam)
  const vajraSeatH = B.limbW * 1.05 * 1.1 + B.limbW * 1.45 * 1.45 + B.thigh * 0.72 * bowK;
  const ground = crossW > 0 ? lerp(groundLegacy, crossSeatH, crossW) : vajraW > 0 ? lerp(groundLegacy, vajraSeatH, vajraW) : groundLegacy;
  // Episode 6: wooden khadam under the feet (PuppetProps.footwear); the figure stands on their soles
  const khadamOn = footwear === "khadam" && !seated && kneelK < 0.5 && c.lower !== "saree";
  const KH_T = B.foot * KHADAM_FOOT.thick; // the sole's thickness
  const hipY = khadamOn ? -ground - KH_T : -ground; // hips relative to the ground (feet at y = 0)
  const legsSorted = [...legs].sort((a, b) => a.z - b.z); // far first

  // Bare feet below the sari: standing and walking only (kneeling, squatting and sitting keep the covered look).
  const sareeFeet = c.lower === "saree" && !seated && lowK < 0.45;
  const feetK = sareeFeet ? clamp(1 - lowK / 0.3) : 0; // how far the hem takes its raised, foot-revealing line
  const walkK = clamp(stride) * feetK; // step articulation (heel strike, toe-off, hem lift)
  const plantLegs = sareeFeet && stride > 0 ? [legGeo(-1, true), legGeo(1, true)] : legs;

  // Episode 6 (Pose.hunch): the shoulders draw up and the head sinks a little between them
  const hunchPx = clamp(p.hunch) * B.neck * 1.15;
  const shY = hunchPx ? hipY - B.torsoLen - breath.chest - hunchPx : hipY - B.torsoLen - breath.chest;
  // the head rides the shoulders minus the part of the breath it does not take (it follows by a fraction, later)
  const headBreathY = hunchPx ? breath.chest - breath.head + hunchPx * 1.3 : breath.chest - breath.head;
  const kf = Math.sqrt(cphi * cphi + 0.3 * sphi * sphi);
  const swp = B.sw * kf;
  const hwp = B.hw * Math.sqrt(cphi * cphi + 0.45 * sphi * sphi);
  const belly = c.girth > 1.12 ? (c.girth - 1) * B.hw * 0.9 : 0;
  const frontX = B.sw * 0.42 * sphi; // torso front centre line

  /* ---------------- gradients ---------------- */
  const kx1 = keySide < 0 ? "0" : "1";
  const kx2 = keySide < 0 ? "1" : "0";
  const rx1 = rimSide > 0 ? "0" : "1";
  const rx2 = rimSide > 0 ? "1" : "0";

  /* ---------------- legs & lower garment ---------------- */
  const legW1 = B.limbW * 1.45;
  const legW2 = B.limbW * 1.05;

  /* ---------------- bare feet below the sari ---------------- */
  // Floor at y = 0. Foot frame: u forward along the foot, v outward (away from the body), w up.
  const FT = B.foot * 0.92; // a woman's bare foot, a touch smaller than the rig's walking foot
  const ankleH = B.foot * 0.28; // ankle height above the sole (as in legGeo)
  const liftMax = B.foot * 0.32; // the swinging foot lifts only a little; the rest of the swing passes under the sari
  const hemBase = B.foot * 0.06; // standing: the hem just clears the floor; only the toes peek out
  const hemR = legW1 * 1.5 * 1.15; // half-width of the hem around each foot
  const hemAmp = B.foot * 0.27; // walking: extra hem lift over the stepping foot (~8 px for Charu)
  const hemSway = feetK * clothSway * 0.25 + walkK * B.foot * 0.14 * Math.sin(phase - 0.5);
  /** Foot pitch (rad, + = toes up). q is the leg's phase: swing for cos q > 0, heel strike at q = pi/2, toe-off at -pi/2. */
  const footPitch = (q: number) => {
    if (walkK <= 0) return 0;
    const H = Math.PI / 2;
    const off = hump(q, -H - 0.95, -H + 0.15, 0.2); // late stance: the heel peels up over the ball; recovers in early swing
    const on = hump(q, 0.45, H - 0.05, H + 0.5); // end of swing: toes rise so the heel lands first, then the foot rolls flat
    return walkK * (0.36 * on - 0.5 * off);
  };
  type FootGeo = {
    side: 1 | -1;
    body: string;
    ring: string;
    toes: Array<{ x: number; y: number; r: number; z: number }>;
    nail: [number, number, number];
    bone: [number, number];
    ankle: [number, number];
    shadow: { cx: number; rx: number; ry: number; o: number };
    hemX: number;
    hemY: number;
    overlay: number;
  };
  const footGeo = (side: 1 | -1): FootGeo => {
    const P = plantLegs.find((l) => l.side === side) ?? legs[side > 0 ? 1 : 0];
    const q = wrapPh(phase + (side > 0 ? Math.PI : 0));
    // stance: flat on the floor (the planted-leg ankle travels back exactly as the body moves on); swing: a low arc
    const swing = walkK > 0 && Math.cos(q) > 0;
    const lift = swing ? liftMax * walkK * Math.pow(Math.sin(Math.PI * clamp((q + Math.PI / 2) / Math.PI)), 0.9) : 0;
    const a = footPitch(q);
    const pu = a >= 0 ? -0.16 * FT : 0.62 * FT; // pivot on the floor: the heel when the toes rise, the ball when the heel peels
    const aToe = a >= 0 ? a : a * 0.12; // the toes bend at the ball, staying flat on the floor at push-off
    const pitch = (u: number, w: number): [number, number] => {
      const k = u > 0.7 * FT ? aToe : a;
      const du = u - pu;
      return [pu + du * Math.cos(k) - w * Math.sin(k), du * Math.sin(k) + w * Math.cos(k)];
    };
    type P3 = [number, number, number];
    const pp = (u: number, v: number, w: number): P3 => {
      const [u2, w2] = pitch(u * FT, w * FT);
      return [u2, v * FT, w2];
    };
    const body: P3[] = [
      pp(-0.21, 0.08, 0.1), pp(-0.21, -0.08, 0.1), pp(-0.16, 0.085, 0), pp(-0.16, -0.085, 0), pp(-0.2, 0, 0.26), // heel
      pp(0, 0.12, ankleH / FT), pp(0, -0.12, ankleH / FT), // ankle bones
      pp(0.3, 0.15, 0), pp(0.3, -0.13, 0.05), pp(0.3, 0, 0.26), pp(0.5, 0, 0.18), // midfoot, arch, instep
      pp(0.62, 0.16, 0), pp(0.62, -0.17, 0), pp(0.62, -0.05, 0.13), // ball
      pp(0.76, -0.15, 0.03), pp(0.74, 0.13, 0.03), pp(0.76, -0.06, 0.09), // toe roots
    ];
    const TOES: Array<[number, number, number]> = [
      [-0.11, 0.075, 0.85], // big toe
      [-0.025, 0.055, 0.84],
      [0.04, 0.05, 0.81],
      [0.095, 0.045, 0.77],
      [0.14, 0.04, 0.72],
    ];
    const toes3 = TOES.map(([v, r, u]) => ({ c: pp(u, v, r), r: r * FT }));
    // keep every part at or above the floor (toes drag until the swing lifts them clear)
    const minW = Math.min(...body.map((b) => b[2]), ...toes3.map((t) => t.c[2] - t.r));
    const up = Math.max(lift, -minW);
    const fx = sphi;
    const lx = side * cphi;
    const X0 = P.ankle.x;
    const proj = ([u, v, w]: P3): [number, number] => [X0 + u * fx + v * lx, -w - up];
    const depth = ([u, v]: P3) => -v * side * sphi + u * cphi;
    // ankle stub, rising into the sari (its top is always hidden by the hem); it joins the shin
    const [au, aw] = pitch(0, ankleH);
    const r = legW2 * 0.72;
    const stub: P3[] = [
      [au - r, r * 0.9, aw], [au + r, -r * 0.9, aw], [au - r, -r * 0.9, aw], [au + r, r * 0.9, aw],
      [au - r * 0.95, 0, aw + FT * 0.5], [au + r * 0.95, 0, aw + FT * 0.5],
    ];
    const outline = hull([...body, ...stub].map(proj));
    const ring: P3[] = [
      pp(-0.21, 0, 0.03), pp(-0.15, 0.085, 0.03), pp(0.3, 0.15, 0.03), pp(0.62, 0.16, 0.03),
      pp(0.72, 0.155, 0.03), pp(0.8, 0.11, 0.03), pp(0.86, 0.04, 0.03), pp(0.92, -0.06, 0.03), pp(0.9, -0.15, 0.03),
      pp(0.62, -0.17, 0.03), pp(0.3, -0.13, 0.07), pp(-0.15, -0.085, 0.03),
    ];
    const big = toes3[0];
    const [nx, ny] = proj([big.c[0] + big.r * 0.45, big.c[1], big.c[2] + big.r * 0.35]);
    const liftN = clamp(up / liftMax);
    // Facing the camera, toes that reach past the front of the hem are nearer than the sari and are drawn over it.
    const frontZ = Math.max(...plantLegs.map((l) => l.ankle.z)) + hemR * 0.7;
    const overlay = clamp((cphi - 0.8) / 0.12) * (1 - liftN) * feetK * clamp((P.ankle.z + 0.9 * FT * cphi - frontZ) / (0.25 * FT));
    return {
      side,
      body: smoothPath(outline, 1),
      ring: smoothPath(ring.map(proj), 1),
      toes: toes3
        .map((t) => {
          const [x2, y2] = proj(t.c);
          return { x: x2, y: y2, r: t.r, z: depth(t.c) };
        })
        .sort((m1, m2) => m1.z - m2.z),
      nail: [nx, ny, big.r * 0.42],
      bone: proj([au, 0.12 * FT, aw * 0.85]),
      ankle: proj([au, 0, aw]),
      shadow: {
        cx: X0 + 0.35 * FT * fx,
        rx: (Math.max(1.15 * FT * Math.abs(fx), 0.34 * FT * Math.abs(lx)) / 2 + FT * 0.12) * (1 - 0.3 * liftN),
        ry: FT * 0.09 * (1 - 0.3 * liftN),
        o: 0.3 * (1 - 0.6 * liftN),
      },
      // centred a little behind the ankle, so the heel stays covered and the toes come out in front
      hemX: X0 - 0.22 * FT * fx + hemSway,
      overlay,
      // the hem rides up over the stepping (forward) foot and trails it slightly
      hemY: -(hemBase + walkK * hemAmp * (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(q - 0.35)))),
    };
  };
  const feetMap = sareeFeet ? new Map<number, FootGeo>([[-1, footGeo(-1)], [1, footGeo(1)]]) : null;
  const drawFoot = (g: FootGeo, far: boolean) => {
    const skin = far ? c.skinShade : c.skin;
    return (
      <g key={`ft${g.side}`}>
        <path d={g.body} fill={skin} />
        {g.toes.map((t, i) => (
          <circle key={i} cx={t.x} cy={t.y} r={t.r} fill={skin} stroke={c.skinShade} strokeWidth={0.6} strokeOpacity={far ? 0.3 : 0.55} />
        ))}
        <circle cx={g.nail[0]} cy={g.nail[1]} r={g.nail[2]} fill={c.skinLight} opacity={far ? 0.3 : 0.6} />
        <ellipse cx={g.bone[0]} cy={g.bone[1]} rx={FT * 0.05} ry={FT * 0.04} fill={c.skinShade} opacity={0.35} />
        {/* sole contour (it also shows the arch), and the alta line of a married woman */}
        <path d={g.ring} fill="none" stroke={c.skinShade} strokeWidth={FT * 0.08} strokeOpacity={0.45} strokeLinejoin="round" />
        {c.sindoor && <path d={g.ring} fill="none" stroke="#c8172c" strokeWidth={Math.max(0.9, FT * 0.04)} strokeLinejoin="round" opacity={0.9} />}
      </g>
    );
  };
  /** Toes peeking out in front of the hem (front-facing views). */
  const toesOver = (g: FootGeo, far: boolean) =>
    g.overlay > 0.01 ? (
      <g key={`fo${g.side}`} opacity={g.overlay}>
        {g.toes.map((t, i) => (
          <circle key={i} cx={t.x} cy={t.y} r={t.r} fill={far ? c.skinShade : c.skin} stroke={c.skinShade} strokeWidth={0.6} strokeOpacity={far ? 0.3 : 0.55} />
        ))}
        {c.sindoor && g.toes.map((t, i) => <path key={`a${i}`} d={`M ${t.x - t.r * 0.8} ${t.y + t.r * 0.55} Q ${t.x} ${t.y + t.r * 1.05} ${t.x + t.r * 0.8} ${t.y + t.r * 0.55}`} fill="none" stroke="#c8172c" strokeWidth={Math.max(0.8, FT * 0.035)} opacity={0.85} />)}
      </g>
    ) : null;
  const footShadow = (g: FootGeo) => (
    <ellipse key={`fs${g.side}`} cx={g.shadow.cx} cy={0.6} rx={g.shadow.rx} ry={g.shadow.ry} fill="#1a0e08" opacity={g.shadow.o} />
  );

  /* ---------------- Episode 6: wooden khadam under the feet (PuppetProps.footwear) ---------------- */
  // The rig has no camera pitch (the ground is edge-on), so the sole's top is shown with a slight look-down: points
  // nearer the camera sit a little lower, about the sole's centre, as the resting pair in Episode 5's Scene99 is drawn.
  const KH_PITCH = 0.36;
  // the sole's outline in foot units (u along the foot from the sole centre under the ankle, v across, + = perp side)
  const KH_OUTLINE: Array<[number, number]> = [
    [-0.31, 0], [-0.29, 0.17], [-0.22, 0.27], [-0.1, 0.3], [0.2, 0.31], [0.52, 0.34], [0.8, 0.31], [0.94, 0.23], [1.0, 0.1],
    [1.0, -0.1], [0.94, -0.23], [0.8, -0.31], [0.52, -0.34], [0.2, -0.31], [-0.1, -0.3], [-0.22, -0.27], [-0.29, -0.17],
  ];
  const khadamPt = (L: ReturnType<typeof legGeo>, u: number, v: number, h: number): [number, number] => {
    const F = B.foot;
    const S0 = L.soleP;
    const X = S0.x + (L.fwdP.x * u + L.perpP.x * v) * F;
    const Y = S0.y + (L.fwdP.y * u + L.perpP.y * v) * F - h;
    const Z = (L.fwdP.z * u + L.perpP.z * v) * F;
    return [X, Y + hipY + Z * KH_PITCH];
  };
  /** Height of a foot's sole above the ground (figure px; 0 = planted). */
  const footLift = (L: ReturnType<typeof legGeo>) => Math.max(0, -(L.soleP.y + hipY) - (khadamOn ? KH_T : 0));
  const khadamShadow = (L: ReturnType<typeof legGeo>) => {
    const F = B.foot;
    const lift = footLift(L);
    const lk = clamp(lift / (F * 0.7));
    const a = khadamPt(L, -0.31, 0, 0);
    const b = khadamPt(L, 1.0, 0, 0);
    return (
      <ellipse key={`khs${L.side}`} cx={(a[0] + b[0]) / 2} cy={1} rx={(Math.abs(b[0] - a[0]) / 2 + F * 0.22) * (1 - 0.3 * lk)} ry={F * 0.1 * (1 - 0.3 * lk)} fill="#3a2414" opacity={0.34 * (1 - 0.7 * lk)} />
    );
  };
  /** The sole (under the foot) and the toe peg with its knob (over the toes). */
  const khadamDraw = (L: ReturnType<typeof legGeo>, far: boolean) => {
    const F = B.foot;
    const top = KH_OUTLINE.map(([u, v]) => khadamPt(L, u, v, 0));
    const bot = KH_OUTLINE.map(([u, v]) => khadamPt(L, u, v, -KH_T));
    const body = smoothPath(hull([...top, ...bot]), 1);
    const topD = smoothPath(top, 1);
    const inner = -L.side; // the big-toe side of this foot (v sign)
    const heel = Array.from({ length: 10 }, (_, i) => {
      const t = (i / 10) * Math.PI * 2;
      return khadamPt(L, -0.1 + 0.13 * Math.cos(t), 0.17 * Math.sin(t), 0);
    });
    const g0 = khadamPt(L, -0.2, 0.02, 0);
    const g1 = khadamPt(L, 0.35, 0.05, 0);
    const g2 = khadamPt(L, 0.86, 0.01, 0);
    const pegB = khadamPt(L, 0.68, inner * 0.07, 0);
    const pegT = khadamPt(L, 0.68, inner * 0.07, F * 0.27);
    const knob = khadamPt(L, 0.68, inner * 0.07, F * 0.32);
    const kr = F * 0.095;
    const style = far ? { filter: "brightness(0.82)" } : undefined;
    return {
      under: (
        <g key={`khu${L.side}`} style={style}>
          <path d={body} fill="#5a3a1e" />
          <path d={topD} fill={L.side > 0 ? "#9a6a3c" : "#94643a"} />
          <path d={`M ${g0[0]} ${g0[1]} Q ${g1[0]} ${g1[1]} ${g2[0]} ${g2[1]}`} stroke="#7a5230" strokeWidth={Math.max(0.5, F * 0.025)} fill="none" opacity={0.6} />
          <path d={smoothPath(heel, 1)} fill="#7e5430" opacity={0.45} />
          <path d={topD} fill="none" stroke="#c89a62" strokeWidth={Math.max(0.5, F * 0.02)} opacity={0.35} />
        </g>
      ),
      over: (
        <g key={`kho${L.side}`} style={style}>
          <path d={`M ${pegB[0]} ${pegB[1]} L ${pegT[0]} ${pegT[1]}`} stroke="#6a4426" strokeWidth={F * 0.08} strokeLinecap="round" />
          <circle cx={knob[0]} cy={knob[1]} r={kr} fill="#8a5a32" />
          <circle cx={knob[0] + kr * 0.3} cy={knob[1] - kr * 0.32} r={kr * 0.4} fill="#e0b274" opacity={0.7} />
        </g>
      ),
    };
  };

  // feetOnly: the sari covers the leg (seated, kneeling, squatting); only the foot is drawn, tucked under the hem,
  // so no thigh, knee or shin skin can ever show past the cloth's edge
  const drawLeg = (L: ReturnType<typeof legGeo>, far: boolean, foot?: FootGeo, feetOnly = false) => {
    const yy = (v: number) => v + hipY;
    const t1 = limb(L.hip.x, yy(L.hip.y), L.knee.x, yy(L.knee.y), legW1, legW2 * 1.08);
    // with a bare foot drawn below the sari, the (hidden) shin runs to that foot's ankle
    const t2 = foot
      ? limb(L.knee.x, yy(L.knee.y), foot.ankle[0], foot.ankle[1], legW2 * 1.05, legW2 * 0.72)
      : limb(L.knee.x, yy(L.knee.y), L.ankle.x, yy(L.ankle.y), legW2 * 1.05, legW2 * 0.72);
    const footPts: Array<[number, number]> = [
      [L.ankle.x - legW2 * 0.7, yy(L.ankle.y)],
      [L.ankle.x + legW2 * 0.7, yy(L.ankle.y)],
      [L.heelL.x, yy(L.heelL.y)],
      [L.heelR.x, yy(L.heelR.y)],
      [L.toeL.x, yy(L.toeL.y)],
      [L.toeR.x, yy(L.toeR.y)],
      [L.toeTip.x, yy(L.toeTip.y)],
    ];
    const footD = smoothPath(hull(footPts), 1);
    const skin = far ? c.skinShade : c.skin;
    const kh = khadamOn && !foot ? khadamDraw(L, far) : null;
    return (
      <g key={`leg${L.side}`}>
        {kh && kh.under}
        {!feetOnly && <path d={t1.d} transform={t1.t} fill={skin} />}
        {!feetOnly && <path d={t2.d} transform={t2.t} fill={skin} />}
        {!feetOnly && <ellipse cx={L.knee.x} cy={yy(L.knee.y)} rx={legW2 * 1.05} ry={legW2 * 0.95} fill={skin} />}
        {!foot && <path d={footD} fill={skin} />}
        {!foot && (
          <path
            d={`M ${lerp(L.toeL.x, L.toeTip.x, 0.4)} ${yy(L.toeL.y) - 1} L ${lerp(L.toeR.x, L.toeTip.x, 0.4)} ${yy(L.toeR.y) - 1}`}
            stroke={c.skinShade}
            strokeWidth={1.2}
            opacity={0.6}
          />
        )}
        {kh && kh.over}
      </g>
    );
  };

  const dhoti = () => {
    const yy = (v: number) => v + hipY;
    const hemK = c.dhotiLength === "knee" ? 0.12 : 0.55;
    // malkochha (Episode 5): tucked up for work, the hem a little above the knee, close round the thigh
    const hitched = c.dhotiLength === "hitched";
    const panels = legsSorted.map((L) => {
      // Hitched + village squat: wrap cloth along each open thigh (malkochha), not a short hip tutu.
      const squatOpen = !seated && kneelK > 0.35;
      const hitchK = hitched ? (squatOpen ? 0.72 : 0.2) : hemK;
      const hx = hitched || squatOpen ? lerp(L.knee.x, L.hip.x, 1 - hitchK) : lerp(L.knee.x, L.ankle.x, hemK);
      const hy0 = hitched || squatOpen ? yy(lerp(L.knee.y, L.hip.y, 1 - hitchK)) : yy(lerp(L.knee.y, L.ankle.y, hemK));
      const top: [number, number] = [L.hip.x, yy(L.hip.y) - 6];
      // Seated: fuller lap cloth. Kneeling open squat: tube along thigh so knees stay readable.
      const seatWide = seated || kneelK > 0.35;
      const flare = hitched
        ? legW1 * (squatOpen ? 1.05 : 1.32)
        : legW2 * (seatWide ? (seated ? 2.05 : 1.2) : 2.05);
      const hipSpread = squatOpen ? legW1 * 1.05 : seatWide ? legW1 * (seated ? 2.7 : 1.75) : legW1 * 1.5;
      const kneeSpread = squatOpen ? legW1 * 1.1 : seatWide ? legW1 * (seated ? 1.95 : 1.55) : legW1 * 1.35;
      const hy = seated ? Math.max(hy0 + legW1 * 0.25, -legW1 * 0.12) : squatOpen ? hy0 : seatWide ? hy0 + legW1 * 0.22 : hy0;
      const thighMx = lerp(L.hip.x, L.knee.x, 0.48);
      const thighMy = yy(lerp(L.hip.y, L.knee.y, 0.48));
      const mound = seatWide && !squatOpen ? legW1 * (seated ? 3.25 : 2.55) : 0;
      const pts: Array<[number, number]> = hitched && !squatOpen
        ? [
            [top[0] - hipSpread, top[1]],
            [top[0] + hipSpread, top[1]],
            [hx - flare, hy],
            [hx + flare, hy],
          ]
        : squatOpen
          ? [
              // Thin thigh wrap — open knees read as legs, not a skirt balloon.
              [top[0] - hipSpread, top[1]],
              [top[0] + hipSpread, top[1]],
              [L.knee.x - kneeSpread, yy(L.knee.y) - legW1 * 0.15],
              [L.knee.x + kneeSpread, yy(L.knee.y) - legW1 * 0.15],
              [hx - flare, hy],
              [hx + flare, hy],
            ]
          : [
            [top[0] - hipSpread, top[1]],
            [top[0] + hipSpread, top[1]],
            [L.knee.x - kneeSpread, yy(L.knee.y)],
            [L.knee.x + kneeSpread, yy(L.knee.y)],
            [hx - flare, hy],
            [hx + flare, hy],
            ...(seatWide
              ? ([
                  [thighMx, thighMy - mound],
                  [thighMx - kneeSpread * 0.8, thighMy - mound * 0.78],
                  [thighMx + kneeSpread * 0.8, thighMy - mound * 0.78],
                  [L.hip.x, yy(L.hip.y) - mound * 0.35],
                  [L.knee.x, yy(L.knee.y) - mound * 0.65],
                  [L.knee.x - flare * 0.45, hy - legW1 * 0.45],
                  [L.knee.x + flare * 0.45, hy - legW1 * 0.45],
                  [hx, hy + legW1 * (seated ? 0.5 : 0.25)],
                  ...(seated ? ([[hx - flare * 0.45, 0], [hx + flare * 0.45, 0]] as Array<[number, number]>) : []),
                ] as Array<[number, number]>)
              : []),
          ];
      const d = smoothPath(hull(pts), 1);
      return (
        <g key={`dh${L.side}`}>
          <path d={d} fill={`url(#${uid}-lowg)`} />
          <path d={d} fill={`url(#${uid}-rim)`} />
          <path d={`M ${hx - flare} ${hy - 2} L ${hx + flare} ${hy - 2}`} stroke={c.lowerTrim ?? c.lowerShade} strokeWidth={c.lowerTrim ? 3 : 1.6} strokeLinecap="round" />
          <path d={`M ${top[0]} ${top[1] + 10} Q ${L.knee.x + clothSway * 0.3} ${yy(L.knee.y) - 10 - (seatWide && !squatOpen ? mound * 0.35 : 0)} ${hx + clothSway * 0.4} ${hy - 4}`} stroke={c.lowerShade} strokeWidth={1.6} fill="none" opacity={0.6} />
        </g>
      );
    });
    // waist + crotch bridge
    const waistY = hipY - 8;
    const crotchY = hipY + B.thigh * 0.32;
    const squatOpen = !seated && kneelK > 0.35;
    const seatBridge = seated || kneelK > 0.35;
    // Hitched open squat: tiny waist bridge only — no skirt fill between the open knees.
    const bridgeW = squatOpen ? 1.05 : seatBridge ? (seated ? 1.55 : 1.22) : 1.08;
    const crotchW = squatOpen ? 0.55 : seatBridge ? (seated ? 1.28 : 0.85) : 0.6;
    const bridge = `M ${-hwp * bridgeW} ${waistY} L ${hwp * bridgeW} ${waistY} L ${hwp * crotchW} ${crotchY} L ${-hwp * crotchW} ${crotchY} Z`;
    // Seated: fuller lap cloth. Kneeling open squat: light crotch only (skip when hitched malkochha — thighs stay bare).
    let lapFill: React.ReactNode = null;
    if (seatBridge && !(hitched && squatOpen)) {
      const L0 = legs[0];
      const L1 = legs[1];
      const knL = L0.side < 0 ? L0 : L1;
      const knR = L0.side > 0 ? L0 : L1;
      const midX = (knL.knee.x + knR.knee.x) * 0.5 + shift * 0.35;
      const kneeY = (yy(knL.knee.y) + yy(knR.knee.y)) * 0.5;
      const kneeSpan = Math.abs(knR.knee.x - knL.knee.x);
      // Open squat: follow the wide knees with a shallow cloth, not a women's balloon mound.
      const rx = seated
        ? Math.max(B.hw * 3.05, kneeSpan * 0.68 + B.limbW * 4.2)
        : Math.max(B.hw * 1.55, kneeSpan * 0.42 + B.limbW * 2.1);
      const ry = seated ? Math.max(B.hw * 1.5, rx * 0.46) : Math.max(B.hw * 0.72, rx * 0.28);
      const cy = Math.max(waistY + ry * (seated ? 0.66 : 0.42), kneeY + ry * (seated ? 0.08 : -0.15));
      const lapTop = cy - ry;
      const lapBot = seated ? Math.max(cy + ry * 0.85, -legW1 * 0.05) : cy + ry * 0.75;
      const lapPts: Array<[number, number]> = seated
        ? [
            [-hwp * bridgeW + shift, waistY],
            [hwp * bridgeW + shift, waistY],
            [midX - rx * 0.35, waistY + 2],
            [midX + rx * 0.35, waistY + 2],
            [midX - rx * 0.55, lapTop + ry * 0.35],
            [midX + rx * 0.55, lapTop + ry * 0.35],
            [midX - rx, cy],
            [midX + rx, cy],
            [midX - rx * 0.85, lapBot - ry * 0.25],
            [midX + rx * 0.85, lapBot - ry * 0.25],
            [midX, lapBot],
            [knR.knee.x + legW1 * 1.35, kneeY + legW1 * 0.4],
            [knL.knee.x - legW1 * 1.35, kneeY + legW1 * 0.4],
            [midX - rx * 0.5, 0],
            [midX + rx * 0.5, 0],
            [midX, legW1 * 0.12],
          ]
        : [
            // Shallow crotch cloth between open knees (no ellipse balloon).
            [-hwp * 1.15 + shift, waistY],
            [hwp * 1.15 + shift, waistY],
            [midX - rx * 0.55, waistY + ry * 0.55],
            [midX + rx * 0.55, waistY + ry * 0.55],
            [knL.knee.x + legW1 * 0.35, kneeY - legW1 * 0.15],
            [knR.knee.x - legW1 * 0.35, kneeY - legW1 * 0.15],
            [midX, kneeY + legW1 * 0.35],
          ];
      const lapD = smoothPath(hull(lapPts), 1);
      lapFill = (
        <g>
          {seated && <path d={lapD} fill={`url(#${uid}-lowg)`} />}
          {seated && <path d={lapD} fill={`url(#${uid}-rim)`} opacity={0.5} />}
          {!seated && <path d={lapD} fill={`url(#${uid}-lowg)`} opacity={0.88} />}
          {!seated && <path d={lapD} fill={`url(#${uid}-rim)`} opacity={0.35} />}
          {seated && (
            <>
              <path
                d={`M ${midX - rx * 0.7} ${cy - ry * 0.15} Q ${midX} ${lapBot - ry * 0.2} ${midX + rx * 0.7} ${cy - ry * 0.15}`}
                stroke={c.lowerShade}
                strokeWidth={1.7}
                fill="none"
                opacity={0.48}
              />
              <path
                d={`M ${midX - rx * 0.45} ${cy - ry * 0.45} Q ${midX} ${lapTop + ry * 0.35} ${midX + rx * 0.45} ${cy - ry * 0.45}`}
                stroke={c.lowerShade}
                strokeWidth={1.35}
                fill="none"
                opacity={0.4}
              />
            </>
          )}
          {!seated && (
            <path
              d={`M ${knL.knee.x + legW1 * 0.2} ${kneeY - legW1 * 0.1} Q ${midX} ${kneeY + legW1 * 0.55} ${knR.knee.x - legW1 * 0.2} ${kneeY - legW1 * 0.1}`}
              stroke={c.lowerShade}
              strokeWidth={1.4}
              fill="none"
              opacity={0.4}
            />
          )}
        </g>
      );
    }
    // front pleats (kochi) — seated/kneeling get a short wide lap tuck instead of hanging folds
    const kx = frontX * 0.7 - B.hw * 0.12;
    const kLen0 = Math.max(20, Math.min(...legs.map((L) => yy(L.knee.y))) - waistY + 14);
    const kLen = hitched ? Math.max(16, kLen0 * 0.45) : seated || kneelK > 0.5 ? Math.max(22, kLen0 * 0.62) : kLen0;
    const showKochi = !seated || kneelK > 0.4;
    // Open squat: narrow front tuck so it doesn't re-inflate a skirt balloon between the knees.
    const kochiW = seated ? 18 : kneelK > 0.35 ? 11 : 8;
    return (
      <g>
        {panels[0]}
        <path d={bridge} transform={`translate(${shift}, 0)`} fill={`url(#${uid}-lowg)`} />
        {panels[1]}
        {lapFill}
        {showKochi && (
          <g transform={`translate(${kx}, ${waistY + 4}) rotate(${clothSway * 0.8})`}>
            <path d={`M ${-kochiW} 0 L ${kochiW} 0 L ${kochiW + 4} ${kLen} L ${-kochiW - 2} ${kLen + 4} Z`} fill={c.lowerColor} />
            {[-8, -2, 4, 10].map((px) => (
              <path key={px} d={`M ${px * 0.5} 4 L ${px} ${kLen}`} stroke={c.lowerShade} strokeWidth={1.3} opacity={0.75} />
            ))}
            {c.lowerTrim && <path d={`M ${-kochiW - 2} ${kLen + 4} L ${kochiW + 4} ${kLen}`} stroke={c.lowerTrim} strokeWidth={3} />}
          </g>
        )}
        <path d={`M ${-hwp * (seatBridge ? (seated ? 1.55 : 1.2) : 1.1)} ${waistY + 2} Q 0 ${waistY + 10} ${hwp * (seatBridge ? (seated ? 1.55 : 1.2) : 1.1)} ${waistY + 2}`} transform={`translate(${shift}, 0)`} stroke={c.lowerShade} strokeWidth={4} fill="none" opacity={0.65} />
      </g>
    );
  };

  /* ---------------- sari: the hem and its border follow the cloth ---------------- */
  // 0 = hanging cloth (standing, walking), 1 = cloth draped on the floor (kneeling, sitting)
  const drapeK = c.lower === "saree" ? (seated ? 1 : clamp((lowK - 0.25) / 0.45)) : 0;
  const sareeSkirt = () => {
    const yy = (v: number) => v + hipY;
    const waistY = hipY - 10;
    // Floor-sit (ref: soft cloth pool over folded knees) vs standing hang.
    const floorSit = drapeK > 0.35;
    const waistSpread = floorSit ? 1.28 : drapeK > 0.2 ? 1.5 : 1.05;
    const pts: Array<[number, number]> = [
      [-hwp * waistSpread, waistY],
      [hwp * waistSpread, waistY],
    ];
    const footHems: Array<{ x: number; y: number; r: number }> = [];
    const knL0 = legs[0].side < 0 ? legs[0] : legs[1];
    const knR0 = legs[0].side > 0 ? legs[0] : legs[1];
    const midSitX = (knL0.knee.x + knR0.knee.x) * 0.5 + shift * 0.2;
    const kneeSitY = (yy(knL0.knee.y) + yy(knR0.knee.y)) * 0.5;

    // Floor-sit: build a concave silhouette (waist → knee lobes → soft floor pool). Convex hull alone
    // collapses to a pancake / beanbag and cannot show the sitting gesture (ref lady sit).
    if (floorSit) {
      const knLx = knL0.knee.x;
      const knRx = knR0.knee.x;
      const knLy = yy(knL0.knee.y);
      const knRy = yy(knR0.knee.y);
      const kneeY = (knLy + knRy) * 0.5;
      const poolRx = B.hw * lerp(3.15, 3.85, drapeK);
      const floorY = Math.min(B.foot * 0.22, Math.max(legW1 * 0.15, kneeY + legW1 * 2.05));
      const lobeR = legW1 * 1.55;
      const sideX = poolRx * 0.92;
      // Closed ring, clockwise from left waist: left hip → left lobe → front dip → right lobe → right hip → waist.
      const ring: Array<[number, number]> = [
        [-hwp * waistSpread, waistY],
        [-hwp * waistSpread * 1.05, waistY + B.hw * 0.55],
        [midSitX - sideX, kneeY - lobeR * 0.15],
        [knLx - lobeR * 0.95, kneeY + lobeR * 0.15],
        [knLx - lobeR * 0.2, kneeY + lobeR * 0.95],
        [knLx + lobeR * 0.35, kneeY + lobeR * 1.05],
        [midSitX - B.hw * 0.55, kneeY + lobeR * 0.72],
        [midSitX, kneeY + lobeR * 0.55],
        [midSitX + B.hw * 0.55, kneeY + lobeR * 0.72],
        [knRx - lobeR * 0.35, kneeY + lobeR * 1.05],
        [knRx + lobeR * 0.2, kneeY + lobeR * 0.95],
        [knRx + lobeR * 0.95, kneeY + lobeR * 0.15],
        [midSitX + sideX, kneeY - lobeR * 0.15],
        [hwp * waistSpread * 1.05, waistY + B.hw * 0.55],
        [hwp * waistSpread, waistY],
      ];
      // Soft floor hem under the lobes (scalloped), left → right.
      const hemN = 18;
      const hemPts: Array<[number, number]> = [];
      for (let i = 0; i <= hemN; i++) {
        const t = i / hemN;
        const xv = midSitX + lerp(-sideX * 1.02, sideX * 1.02, t);
        const u = t * 2 - 1;
        const scallop = Math.sin(t * Math.PI * 3.2 + c.seed) * B.foot * 0.11;
        const dip = Math.abs(u) < 0.22 ? -B.foot * 0.08 : 0; // slight tuck between the feet
        const yv = floorY - (1 - u * u) * B.foot * 0.06 + scallop + dip;
        hemPts.push([xv, Math.min(yv, B.foot * 0.28)]);
      }
      // Full cloth path: left waist down left side to hem start, along hem, up right side to right waist, close on waist.
      const leftDown: Array<[number, number]> = [
        ring[0],
        ring[1],
        ring[2],
        [hemPts[0][0], lerp(kneeY + lobeR * 0.4, hemPts[0][1], 0.55)],
        hemPts[0],
      ];
      const rightUp: Array<[number, number]> = [
        hemPts[hemPts.length - 1],
        [hemPts[hemPts.length - 1][0], lerp(kneeY + lobeR * 0.4, hemPts[hemPts.length - 1][1], 0.55)],
        ring[12],
        ring[13],
        ring[14],
      ];
      const bodyPts: Array<[number, number]> = [...ring.slice(0, 3), ...ring.slice(3, 12)];
      const dBody = smoothPath(bodyPts, 1, false);
      // Prefer a single closed fill: waist → sides → hem → back.
      const fillPts: Array<[number, number]> = [...leftDown, ...hemPts.slice(1), ...rightUp.slice(1), [-hwp * waistSpread, waistY]];
      const d = `${smoothPath(fillPts, 1, false)} Z`;
      const bw = 6.5;
      const edge: Array<[number, number]> = [[hemPts[0][0] - 10, hemPts[0][1]], ...hemPts, [hemPts[hemPts.length - 1][0] + 10, hemPts[hemPts.length - 1][1]]];
      const shiftY = (dy: number) => edge.map(([xv, yv]): [number, number] => [xv, yv + dy]);
      const band = `${smoothPath(shiftY(-bw), 1, false)} ${smoothPath(shiftY(2).reverse(), 1, false).replace(/^M/, "L")} Z`;
      const stripe = smoothPath(shiftY(-bw - 2.2), 1, false);
      const trim = c.lowerTrim || c.topTrim ? c.lowerTrim ?? c.lowerShade : null;
      const clipId = `${uid}-hemclip`;
      const crownPeak = waistY + Math.max(B.hw * 0.95, (kneeY - waistY) * 0.4);
      const crownPath = `M ${-hwp * waistSpread * 0.9} ${waistY + 1}
        Q ${midSitX} ${waistY + B.hw * 0.5} ${hwp * waistSpread * 0.9} ${waistY + 1}
        Q ${knRx + lobeR * 0.55} ${crownPeak} ${knRx} ${kneeY + lobeR * 0.2}
        Q ${midSitX} ${kneeY + lobeR * 0.85} ${knLx} ${kneeY + lobeR * 0.2}
        Q ${knLx - lobeR * 0.55} ${crownPeak} ${-hwp * waistSpread * 0.9} ${waistY + 1} Z`;
      const shadePath = `M ${knLx} ${kneeY + lobeR * 0.15}
        Q ${midSitX} ${kneeY + lobeR * 1.15} ${knRx} ${kneeY + lobeR * 0.15}
        Q ${midSitX} ${kneeY + lobeR * 0.4} ${knLx} ${kneeY + lobeR * 0.15} Z`;
      const pleatX = frontX * 0.55;
      const pleatYs = [waistY + B.hw * 0.7, kneeY + lobeR * 0.35, floorY - B.foot * 0.15];
      return (
        <g>
          <defs>
            <clipPath id={clipId}>
              <path d={d} />
            </clipPath>
          </defs>
          <path d={d} fill={`url(#${uid}-lowg)`} />
          <path d={d} fill={`url(#${uid}-rim)`} />
          {/* Knee lobes + lap crown read as folded legs under the sari (ref lady sit). */}
          <ellipse cx={knLx} cy={kneeY + lobeR * 0.15} rx={lobeR * 1.05} ry={lobeR * 0.72} fill={`url(#${uid}-lowg)`} opacity={0.98} />
          <ellipse cx={knRx} cy={kneeY + lobeR * 0.15} rx={lobeR * 1.05} ry={lobeR * 0.72} fill={`url(#${uid}-lowg)`} opacity={0.98} />
          <path d={crownPath} fill={`url(#${uid}-lowg)`} opacity={0.9} />
          <path d={crownPath} fill={`url(#${uid}-rim)`} opacity={0.32} />
          <path d={shadePath} fill={c.lowerShade} opacity={0.2} />
          <ellipse cx={midSitX} cy={crownPeak + legW1 * 0.1} rx={B.hw * 1.2} ry={legW1 * 0.45} fill={c.lowerShade} opacity={0.12} />
          <g opacity={0.52}>
            <path d={`M ${knLx - lobeR * 0.7} ${waistY + B.hw * 0.5} Q ${knLx} ${kneeY + lobeR * 0.35} ${midSitX - B.hw * 0.4} ${kneeY + lobeR * 0.85}`} fill="none" stroke={c.lowerShade} strokeWidth={1.25} strokeLinecap="round" />
            <path d={`M ${knRx + lobeR * 0.7} ${waistY + B.hw * 0.5} Q ${knRx} ${kneeY + lobeR * 0.35} ${midSitX + B.hw * 0.4} ${kneeY + lobeR * 0.85}`} fill="none" stroke={c.lowerShade} strokeWidth={1.25} strokeLinecap="round" />
            <path d={`M ${midSitX - B.hw * 1.45} ${waistY + B.hw * 0.65} Q ${midSitX} ${kneeY} ${midSitX + B.hw * 1.45} ${waistY + B.hw * 0.65}`} fill="none" stroke={c.lowerShade} strokeWidth={1.15} strokeLinecap="round" />
            <path d={`M ${midSitX - B.hw * 0.95} ${waistY + B.hw * 1.05} Q ${midSitX} ${kneeY + lobeR * 0.55} ${midSitX + B.hw * 0.95} ${waistY + B.hw * 1.05}`} fill="none" stroke={c.lowerShade} strokeWidth={1.0} strokeLinecap="round" />
          </g>
          {[-7, -2, 3, 8].map((px) => (
            <path
              key={px}
              d={`M ${pleatX + px * 0.55} ${pleatYs[0]} Q ${pleatX + px * 1.1} ${pleatYs[1]} ${pleatX + px * 1.55} ${pleatYs[2]}`}
              fill="none"
              stroke={c.lowerShade}
              strokeWidth={1.05}
              opacity={0.4}
            />
          ))}
          {/* Keep body ring stroke soft so the concave waist→knee silhouette stays readable. */}
          <path d={dBody} fill="none" stroke={c.lowerShade} strokeWidth={0.7} opacity={0.18} />
          {trim && (
            <g clipPath={`url(#${clipId})`}>
              <path d={band} fill={trim} />
              <path d={stripe} fill="none" stroke={trim} strokeWidth={1.1} opacity={0.85} />
            </g>
          )}
        </g>
      );
    }

    for (const L of legs) {
      const m = legW1 * (drapeK > 0.2 ? 2.85 : 1.5);
      pts.push([L.knee.x - m, yy(L.knee.y)], [L.knee.x + m, yy(L.knee.y)]);
      if (drapeK > 0) {
        const ky = yy(L.knee.y);
        const mx = lerp(L.hip.x, L.knee.x, 0.55);
        const my = yy(lerp(L.hip.y, L.knee.y, 0.55));
        const up = legW1 * 2.45 * drapeK;
        pts.push(
          [L.knee.x, ky - up],
          [L.knee.x - m * 0.95, ky - up * 0.82],
          [L.knee.x + m * 0.95, ky - up * 0.82],
          [mx - m * 0.4, my - up * 1.25],
          [mx + m * 0.4, my - up * 1.25],
          [mx, my - up * 1.45],
          [L.hip.x - m * 0.65, yy(L.hip.y) + 2],
          [L.hip.x + m * 0.65, yy(L.hip.y) + 2],
          [L.knee.x - m * 0.7, ky + legW1 * 0.85 * drapeK],
          [L.knee.x + m * 0.7, ky + legW1 * 0.85 * drapeK],
        );
      }
      const fx = (L.toeTip.x + L.heelL.x) / 2;
      const oy = yy(L.ankle.y) + 4 + (drapeK > 0.2 ? legW1 * 0.45 * drapeK : 0);
      const ft = feetMap?.get(L.side);
      const hemM = drapeK > 0.2 ? m * 1.7 : m * 1.35;
      if (ft && feetK > 0) {
        const hy = lerp(oy, ft.hemY, feetK);
        const x1 = lerp(fx - hemM, ft.hemX - hemR, feetK);
        const x2 = lerp(fx + hemM, ft.hemX + hemR, feetK);
        pts.push([x1, hy], [x2, hy]);
        footHems.push({ x: (x1 + x2) / 2, y: hy, r: Math.max(1, (x2 - x1) / 2) });
      } else {
        pts.push([fx - hemM, oy], [fx + hemM, oy]);
      }
    }
    const H0 = hull(pts);
    // split the silhouette at its leftmost and rightmost points; the lower chain (x-monotone) carries the hem
    let iL = 0;
    H0.forEach((q, i) => {
      if (q[0] < H0[iL][0]) iL = i;
    });
    const H = [...H0.slice(iL), ...H0.slice(0, iL)];
    let iR = 0;
    H.forEach((q, i) => {
      if (q[0] > H[iR][0]) iR = i;
    });
    const chainA = H.slice(0, iR + 1);
    const chainB = [...H.slice(iR), H[0]].reverse();
    const meanY = (ch: Array<[number, number]>) => ch.reduce((s, q) => s + q[1], 0) / ch.length;
    const bot = meanY(chainA) >= meanY(chainB) ? chainA : chainB;
    const top = bot === chainA ? chainB : chainA;
    // the hem is the part of the lower chain that runs across, not up the sides
    const steep = (q1: [number, number], q2: [number, number]) => Math.abs(q2[1] - q1[1]) > 1.2 * Math.abs(q2[0] - q1[0]);
    let a = 0;
    let b = bot.length - 1;
    while (b - a >= 2 && steep(bot[a], bot[a + 1])) a++;
    while (b - a >= 2 && steep(bot[b - 1], bot[b])) b--;
    const lowest = Math.max(...bot.slice(a, b + 1).map((q) => q[1]));
    const tall = B.foot * lerp(0.55, 2, drapeK);
    while (b - a >= 2 && bot[a][1] < lowest - tall) a++;
    while (b - a >= 2 && bot[b][1] < lowest - tall) b--;
    const chain = bot.slice(a, b + 1);
    const xa = chain[0][0];
    const xb = chain[chain.length - 1][0];
    const span = Math.max(1, xb - xa);
    const xm = (xa + xb) / 2;
    const baseAt = (xv: number) => {
      if (xv <= chain[0][0]) return chain[0][1];
      for (let i = 0; i < chain.length - 1; i++) {
        const [x1, y1] = chain[i];
        const [x2, y2] = chain[i + 1];
        if (xv <= x2) return x2 - x1 < 1e-6 ? Math.max(y1, y2) : lerp(y1, y2, (xv - x1) / (x2 - x1));
      }
      return chain[chain.length - 1][1];
    };

    // motion: the hem lags the body by a few frames (weight shift, travel, lean, stride); cloth on the floor barely sways
    const hemLive = 1 - 0.8 * drapeK;
    const pHem = sample(f - lagF(4));
    const drag = clamp((pHem.bodyX - p.bodyX) * fs * 0.1 + (pHem.lean - p.lean) * 0.9, -5, 5);
    const wLag = seated ? 0 : idle * weightAt(life - 6, c.seed);
    const strideLag = walkK * Math.sin(phase - 1.2); // ~4 frames behind the step
    const hemShift = hemLive * (clothSway * 0.4 + drag * 0.5);
    const hemTilt = hemLive * (-1.3 * wLag + B.foot * 0.05 * strideLag); // px at the ends; the bearing side hangs higher
    const roundK = B.foot * lerp(0.07, floorSit ? 0.22 : 0.1, drapeK); // floor-sit: softer oval sides (ref lady sit)
    const foldUp = B.foot * (0.06 + 0.04 * walkK); // hanging folds lift the edge in soft scallops
    const foldFloor = B.foot * (floorSit ? 0.14 : 0.09); // folds lying on the floor ripple both ways
    const seedH = c.seed * 1.37;
    const drift = (life * 0.012 * (1 - 0.6 * clamp(stillness)) + 0.9 * strideLag) * hemLive + hemShift * 0.05;
    const fold = (xv: number) => {
      const s = xv - hemShift;
      return (
        0.55 * Math.sin(s / (B.foot * 0.21) + seedH + drift) +
        0.3 * Math.sin(s / (B.foot * 0.12) + seedH * 2.3 - drift * 1.3) +
        0.15 * Math.sin(s / (B.foot * 0.07) + seedH * 4.1 + drift * 0.7)
      );
    };
    // front pleats (kuchi): their creases reach the hem, which breaks into small V-shaped dips there
    const pleatX = frontX * 0.6;
    const kick = walkK * B.foot * 0.08 * Math.sin(phase - 1.0);
    const pleats = [-8, -3, 2, 7, 12].map((px) => ({ px, x: Math.min(xb - 1, Math.max(xa + 1, pleatX + px * 1.6 + clothSway + kick)) }));
    const wV = B.foot * 0.1;
    const vDepth = B.foot * 0.075 * (0.4 + 0.6 * cphi);
    const vDip = (xv: number) => pleats.reduce((s, q) => s + vDepth * Math.max(0, 1 - Math.abs(xv - q.x) / wV), 0);
    const floorLim = B.foot * lerp(0.03, 0.3, drapeK);
    const hemAt = (xv: number) => {
      const u = clamp((xv - xm) / (span / 2), -1, 1);
      let yb = baseAt(xv);
      // soft arch over each bare foot: the hem rides up over the stepping foot
      if (footHems.length && feetK > 0) {
        let wsum = 0;
        let lift = 0;
        for (const fh of footHems) {
          const w = easeIO((fh.r * 1.2 - Math.abs(xv - fh.x)) / (fh.r * 0.6));
          wsum += w;
          lift += w * Math.min(0, fh.y - yb);
        }
        yb += (feetK * lift) / Math.max(1, wsum);
      }
      yb = lerp(yb, Math.max(yb, -B.foot * 0.05), drapeK); // draped: the cloth reaches the floor and lies on it
      const wv = fold(xv);
      const yv =
        yb -
        roundK * u * u +
        drapeK * B.foot * (floorSit ? 0.28 : 0.16) * (1 - u * u) + // floor-sit: fuller soft pool toward camera
        hemTilt * u +
        lerp(-foldUp * (0.5 + 0.5 * wv), foldFloor * wv, drapeK) +
        vDip(xv);
      return Math.min(yv, floorLim);
    };
    // dense samples along the hem, plus the exact corners of every pleat V
    const vPts: number[] = [];
    for (const q of pleats) if (q.x > xa + wV && q.x < xb - wV) vPts.push(q.x - wV, q.x, q.x + wV);
    const n = Math.max(6, Math.min(64, Math.ceil(span / 2.5)));
    const xs: number[] = [...vPts];
    for (let i = 0; i <= n; i++) {
      const xv = xa + (span * i) / n;
      if (i === 0 || i === n || vPts.every((v) => Math.abs(v - xv) > 0.8)) xs.push(xv);
    }
    xs.sort((p1, p2) => p1 - p2);
    const hemPts: Array<[number, number]> = [];
    for (const xv of xs) {
      if (hemPts.length && xv - hemPts[hemPts.length - 1][0] < 0.3) continue;
      const u = clamp((xv - xm) / (span / 2), -1, 1);
      hemPts.push([xv + drapeK * B.foot * 0.12 * u * u * u, hemAt(xv)]); // draped ends spread out a little on the floor
    }
    // the dense hem and the sparse sides/top are smoothed separately (a closed spline would overshoot at the corners)
    const rest: Array<[number, number]> = [hemPts[hemPts.length - 1], ...bot.slice(b + 1), ...top.slice(1, -1).reverse(), ...bot.slice(0, a), hemPts[0]];
    const d = `${smoothPath(hemPts, 1, false)} ${smoothPath(rest, 1, false).replace(/^M\s+\S+\s+\S+/, "")} Z`;
    // the border: the same curve as the edge, offset inward, clipped to the cloth
    const bw = 6.5;
    const last = hemPts[hemPts.length - 1];
    const edge: Array<[number, number]> = [[hemPts[0][0] - 12, hemPts[0][1]], ...hemPts, [last[0] + 12, last[1]]];
    const shiftY = (dy: number) => edge.map(([xv, yv]): [number, number] => [xv, yv + dy]);
    const band = `${smoothPath(shiftY(-bw), 1, false)} ${smoothPath(shiftY(2).reverse(), 1, false).replace(/^M/, "L")} Z`;
    const stripe = smoothPath(shiftY(-bw - 2.2), 1, false);
    const trim = c.lowerTrim || c.topTrim ? c.lowerTrim ?? c.lowerShade : null;
    const clipId = `${uid}-hemclip`;
    return (
      <g>
        <defs>
          <clipPath id={clipId}>
            <path d={d} />
          </clipPath>
        </defs>
        <path d={d} fill={`url(#${uid}-lowg)`} />
        <path d={d} fill={`url(#${uid}-rim)`} />
        {pleats.map((q) => {
          const ye = hemAt(q.x) - 0.6;
          return (
            <path key={q.px} d={`M ${pleatX + q.px * 0.6} ${waistY + 10} Q ${pleatX + q.px + clothSway * 0.5} ${(waistY + ye) / 2} ${q.x} ${ye}`} stroke={c.lowerShade} strokeWidth={1.3} fill="none" opacity={0.7} />
          );
        })}
        {trim && (
          <g clipPath={`url(#${clipId})`}>
            <path d={band} fill={trim} />
            <path d={stripe} fill="none" stroke={trim} strokeWidth={1.1} opacity={0.85} />
            {/* the pleat creases run on through the border */}
            {pleats.map((q) => {
              const ye = hemAt(q.x);
              return <path key={`bc${q.px}`} d={`M ${q.x - wV * 0.15} ${ye - bw - 2.6} L ${q.x} ${ye}`} stroke="#000" strokeOpacity={0.22} strokeWidth={1} fill="none" />;
            })}
          </g>
        )}
      </g>
    );
  };

  const skirt = (to: "ankle" | "knee") => {
    if (to === "ankle") return sareeSkirt();
    const yy = (v: number) => v + hipY;
    const waistY = c.outfit === "frock" ? shY + B.torsoLen * 0.38 : hipY - 10;
    const pts: Array<[number, number]> = [
      [-hwp * 1.05, waistY],
      [hwp * 1.05, waistY],
    ];
    for (const L of legs) {
      const m = legW1 * 1.5;
      pts.push([L.knee.x - m, yy(L.knee.y)], [L.knee.x + m, yy(L.knee.y)]);
      const kx = lerp(L.knee.x, L.ankle.x, 0.12);
      const ky = yy(lerp(L.knee.y, L.ankle.y, 0.12));
      pts.push([kx - m * 1.5 + clothSway * 0.4, ky], [kx + m * 1.5 + clothSway * 0.4, ky]);
    }
    const H = hull(pts);
    const d = smoothPath(H, 1);
    const bottom = H.filter(([, yv]) => yv > Math.max(...H.map((q) => q[1])) - 14).sort((a, b) => a[0] - b[0]);
    return (
      <g>
        <path d={d} fill={`url(#${uid}-lowg)`} />
        <path d={d} fill={`url(#${uid}-rim)`} />
        {bottom.length >= 2 && (c.lowerTrim || c.topTrim) && (
          <path
            d={`M ${bottom[0][0] + 4} ${bottom[0][1] - 4} L ${bottom[bottom.length - 1][0] - 4} ${bottom[bottom.length - 1][1] - 4}`}
            stroke={(c.outfit === "frock" ? c.topTrim : c.lowerTrim) ?? c.lowerShade}
            strokeWidth={c.lower === "saree" ? 7 : 5}
            strokeLinecap="round"
          />
        )}
      </g>
    );
  };

  /* ---------------- cross-legged floor sit (PuppetProps.sitStyle "crossLegged") ---------------- */
  // Own geometry, seen a little from above (a point nearer the camera sits lower on screen), so the crossed shins
  // read in front of the knees instead of flattening into one line with them.
  const crossLower = () => {
    const CT = 0.42; // camera look-down: screen drop per unit of depth toward the camera
    const zMid = B.thigh * 0.3;
    type Q = { x: number; y: number; z: number };
    const P = (v: V3): Q => {
      const r = rotY(v);
      return { x: r.x, y: hipY + v[1] + CT * (r.z - zMid), z: r.z };
    };
    const sH = crossSeatH;
    const hipXc = B.hw * 0.66;
    const kneeH = legW1 * 1.6;
    const frontSide: 1 | -1 = 1; // the right shin crosses in front (mirrors with flip)
    const legC = (side: 1 | -1) => {
      const isF = side === frontSide;
      const hip: V3 = [side * hipXc, 0, 0];
      const knee: V3 = [side * (hipXc + B.thigh * 0.7), sH - kneeH, B.thigh * 0.34];
      const ankle: V3 = isF ? [-side * B.shin * 0.1, sH - legW2 * 1.5, B.thigh * 0.84] : [-side * B.shin * 0.16, sH - legW2 * 1.0, B.thigh * 0.54];
      const n = Math.hypot(1, 0.3);
      const fd: V3 = [-side / n, 0, -0.3 / n];
      return {
        side,
        isF,
        hip: P(hip),
        knee: P(knee),
        ankle: P(ankle),
        heel: P(add3(ankle, mul3(fd, -B.foot * 0.2))),
        toe: P(add3(ankle, mul3(fd, B.foot * 0.8))),
      };
    };
    const LB = legC(-frontSide as 1 | -1);
    const LF = legC(frontSide);
    const tube = (a: Q, b: Q, w1: number, w2: number, fill: string, key: string, opacity = 1) => {
      const t = limb(a.x, a.y, b.x, b.y, w1, w2);
      return <path key={key} d={t.d} transform={t.t} fill={fill} opacity={opacity} />;
    };
    const mix = (a: Q, b: Q, k: number): Q => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) });
    const soleCol = lerpColor(c.skin, "#f4dcc4", 0.45);
    const foot = (L: ReturnType<typeof legC>, skin: string, key: string) => {
      const fw = B.foot * 0.27;
      const t = limb(L.heel.x, L.heel.y, L.toe.x, L.toe.y, fw * 0.95, fw * 0.82);
      const ux = L.toe.x - L.heel.x;
      const uy = L.toe.y - L.heel.y;
      const ul = Math.hypot(ux, uy) || 1;
      // the sole faces up and back: a pale strip along the foot's upper edge
      const nx = (uy / ul) * (ux > 0 ? 1 : -1);
      const ny = (-ux / ul) * (ux > 0 ? 1 : -1);
      const s0 = { x: lerp(L.heel.x, L.toe.x, 0.08) + nx * fw * 0.35, y: lerp(L.heel.y, L.toe.y, 0.08) + ny * fw * 0.35 };
      const s1 = { x: lerp(L.heel.x, L.toe.x, 0.9) + nx * fw * 0.3, y: lerp(L.heel.y, L.toe.y, 0.9) + ny * fw * 0.3 };
      return (
        <g key={key}>
          <path d={t.d} transform={t.t} fill={skin} />
          <path d={`M ${s0.x} ${s0.y} L ${s1.x} ${s1.y}`} stroke={soleCol} strokeWidth={fw * 0.75} strokeLinecap="round" opacity={0.85} />
          {/* toes at the far end */}
          {[0, 1, 2].map((k) => {
            const tx = lerp(L.heel.x, L.toe.x, 0.86 + k * 0.045) - nx * fw * (0.2 - k * 0.2);
            const ty = lerp(L.heel.y, L.toe.y, 0.86 + k * 0.045) - ny * fw * (0.2 - k * 0.2);
            return <circle key={k} cx={tx} cy={ty} r={fw * 0.2} fill={skin} stroke={c.skinShade} strokeWidth={0.6} strokeOpacity={0.5} />;
          })}
          <ellipse cx={L.ankle.x} cy={L.ankle.y} rx={legW2 * 0.62} ry={legW2 * 0.55} fill={skin} />
        </g>
      );
    };
    const shin = (L: ReturnType<typeof legC>, skin: string, key: string) => (
      <g key={key}>
        {tube(L.knee, L.ankle, legW2 * 1.12, legW2 * 0.74, skin, "s")}
        {/* calf swell on the under side */}
        {tube(mix(L.knee, L.ankle, 0.08), mix(L.knee, L.ankle, 0.62), legW2 * 0.5, legW2 * 0.2, c.skinShade, "c", 0.3)}
      </g>
    );
    const thighSkin = (L: ReturnType<typeof legC>, key: string) => (
      <g key={key}>
        {tube(L.hip, L.knee, legW1 * 1.3, legW2 * 1.22, c.skin, "t")}
        <ellipse cx={L.knee.x} cy={L.knee.y} rx={legW2 * 1.28} ry={legW2 * 1.12} fill={c.skin} />
        <path d={`M ${L.knee.x - legW2 * 0.5} ${L.knee.y - legW2 * 0.2} q ${legW2 * 0.5} ${-legW2 * 0.45} ${legW2 * 1.0} 0`} stroke={c.skinShade} strokeWidth={1.1} fill="none" opacity={0.55} />
      </g>
    );
    const backSkin = c.skinShade;
    const hitched = c.dhotiLength === "hitched";
    const clothed = c.lower === "dhoti";
    const waistY = hipY - 8;
    const lowg = `url(#${uid}-lowg)`;
    const rimg = `url(#${uid}-rim)`;
    const rT = legW1 * 1.42; // cloth radius round the thigh at the hip
    const rK = legW1 * (hitched ? 1.22 : 1.38); // ... and at the knee (or the malkochha's end)
    const wrapEnd = (L: ReturnType<typeof legC>) => (hitched ? mix(L.hip, L.knee, 0.68) : L.knee);
    const thighCloth = (L: ReturnType<typeof legC>, key: string) => {
      const e = wrapEnd(L);
      const t = limb(L.hip.x, L.hip.y - legW1 * 0.25, e.x, e.y, rT, rK);
      const ux = e.x - L.hip.x;
      return (
        <g key={key}>
          <path d={t.d} transform={t.t} fill={lowg} />
          <path d={t.d} transform={t.t} fill={rimg} />
          {/* the cloth's shaded underside along the thigh, and the fold from the crotch toward the knee */}
          <path d={`M ${L.hip.x + ux * 0.1} ${L.hip.y + rT * 0.75} Q ${lerp(L.hip.x, e.x, 0.55)} ${lerp(L.hip.y, e.y, 0.55) + rK * 1.05} ${e.x - Math.sign(ux) * rK * 0.2} ${e.y + rK * 0.85}`} stroke={c.lowerShade} strokeWidth={2.4} fill="none" opacity={0.6} strokeLinecap="round" />
          <path d={`M ${L.hip.x + ux * 0.05} ${L.hip.y - rT * 0.2} Q ${lerp(L.hip.x, e.x, 0.5)} ${lerp(L.hip.y, e.y, 0.5) - rK * 0.1} ${e.x - Math.sign(ux) * rK * 0.6} ${e.y - rK * 0.05}`} stroke={c.lowerShade} strokeWidth={1.3} fill="none" opacity={0.45} strokeLinecap="round" />
          {hitched && <path d={`M ${e.x - (e.y - L.hip.y) * 0.0 - rK * 0.15} ${e.y - rK * 0.95} L ${e.x + rK * 0.15} ${e.y + rK * 0.95}`} stroke={c.lowerTrim ?? c.lowerShade} strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />}
        </g>
      );
    };
    // central lap cloth: the waist, between the thighs and (a long dhoti) draped over the crossed shins
    const midF = mix(LF.knee, LF.ankle, 0.55);
    const midB = mix(LB.knee, LB.ankle, 0.5);
    const lapPts: Array<[number, number]> = hitched
      ? [
          [-hwp * 1.1, waistY],
          [hwp * 1.1, waistY],
          [LB.hip.x, LB.hip.y + legW1 * 0.7],
          [LF.hip.x, LF.hip.y + legW1 * 0.7],
          [(LB.hip.x + LF.hip.x) / 2, hipY + legW1 * 1.15],
        ]
      : [
          [-hwp * 1.12, waistY],
          [hwp * 1.12, waistY],
          [LB.hip.x, LB.hip.y + rT * 0.6],
          [LF.hip.x, LF.hip.y + rT * 0.6],
          [LB.knee.x, LB.knee.y + rK * 0.5],
          [LF.knee.x, LF.knee.y + rK * 0.5],
          [midF.x, midF.y + legW2 * 1.15],
          [midB.x, midB.y + legW2 * 1.05],
          [(midF.x + midB.x) / 2, (midF.y + midB.y) / 2 + legW2 * 1.25],
        ];
    const lapD = smoothPath(hull(lapPts), 1);
    // the hem across the shins (long dhoti): from the back shin's middle, under the front-centre, to the front shin
    const hemD = `M ${midB.x} ${midB.y + legW2 * 1.0} Q ${(midF.x + midB.x) / 2} ${(midF.y + midB.y) / 2 + legW2 * 1.5} ${midF.x} ${midF.y + legW2 * 1.1}`;
    // front pleats (kochi) falling from the waist into the lap
    const kx = frontX * 0.6;
    const kBot = hitched ? hipY + legW1 * 1.3 : (midF.y + midB.y) / 2 + legW2 * 0.9;
    const kw0 = B.hw * 0.22;
    const kw1 = B.hw * (hitched ? 0.3 : 0.42);
    const kochi = (
      <g>
        <path d={`M ${kx - kw0} ${waistY + 3} L ${kx + kw0} ${waistY + 3} L ${kx + kw1} ${kBot} Q ${kx} ${kBot + 3} ${kx - kw1} ${kBot} Z`} fill={c.lowerColor} />
        <path d={`M ${kx - kw0} ${waistY + 3} L ${kx + kw0} ${waistY + 3} L ${kx + kw1} ${kBot} Q ${kx} ${kBot + 3} ${kx - kw1} ${kBot} Z`} fill={rimg} opacity={0.6} />
        {[-0.6, -0.2, 0.2, 0.6].map((k) => (
          <path key={k} d={`M ${kx + k * kw0} ${waistY + 5} L ${kx + k * kw1} ${kBot}`} stroke={c.lowerShade} strokeWidth={1.2} opacity={0.7} />
        ))}
        {c.lowerTrim && <path d={`M ${kx - kw1} ${kBot - 1} Q ${kx} ${kBot + 2} ${kx + kw1} ${kBot - 1}`} stroke={c.lowerTrim} strokeWidth={2.6} fill="none" />}
      </g>
    );
    const kneeLobe = (L: ReturnType<typeof legC>, key: string) => (
      <g key={key}>
        <ellipse cx={L.knee.x} cy={L.knee.y} rx={rK * 1.08} ry={rK * 0.92} fill={lowg} />
        <ellipse cx={L.knee.x} cy={L.knee.y} rx={rK * 1.08} ry={rK * 0.92} fill={rimg} opacity={0.7} />
        <ellipse cx={L.knee.x - Math.sign(L.knee.x) * rK * 0.1} cy={L.knee.y - rK * 0.38} rx={rK * 0.55} ry={rK * 0.28} fill={lerpColor(c.lowerColor, "#ffffff", 0.5)} opacity={0.45} />
        <path d={`M ${L.knee.x - rK * 0.85} ${L.knee.y + rK * 0.35} Q ${L.knee.x} ${L.knee.y + rK * 1.05} ${L.knee.x + rK * 0.85} ${L.knee.y + rK * 0.35}`} stroke={c.lowerShade} strokeWidth={1.6} fill="none" opacity={0.55} />
      </g>
    );
    // the feet tuck under the opposite knee: draw the back foot first, the front one over the cloth's hem
    return (
      <g>
        {shin(LB, backSkin, "shB")}
        {foot(LB, backSkin, "ftB")}
        {(!clothed || hitched) && thighSkin(LB, "thB")}
        {(!clothed || hitched) && thighSkin(LF, "thF")}
        {shin(LF, c.skin, "shF")}
        {clothed && (
          <g>
            <path d={lapD} fill={lowg} />
            <path d={lapD} fill={rimg} opacity={0.6} />
            {thighCloth(LB, "tcB")}
            {thighCloth(LF, "tcF")}
            {!hitched && kneeLobe(LB, "klB")}
            {!hitched && kneeLobe(LF, "klF")}
            {!hitched && <path d={hemD} stroke={c.lowerTrim ?? c.lowerShade} strokeWidth={c.lowerTrim ? 3 : 1.8} fill="none" strokeLinecap="round" />}
            {!hitched && (
              <path
                d={`M ${(LB.hip.x + LF.hip.x) / 2} ${hipY + legW1 * 0.5} Q ${lerp(LB.knee.x, LF.knee.x, 0.5)} ${(LB.knee.y + LF.knee.y) / 2 + legW1 * 0.9} ${midF.x} ${midF.y + legW2 * 0.4}`}
                stroke={c.lowerShade}
                strokeWidth={1.4}
                fill="none"
                opacity={0.45}
              />
            )}
            {kochi}
            <path d={`M ${-hwp * 1.12} ${waistY + 2} Q 0 ${waistY + 9} ${hwp * 1.12} ${waistY + 2}`} stroke={c.lowerShade} strokeWidth={4} fill="none" opacity={0.65} />
          </g>
        )}
        {clothed && !hitched ? (
          <g>
            {tube(mix(LF.knee, LF.ankle, 0.62), LF.ankle, legW2 * 0.86, legW2 * 0.74, c.skin, "ankF")}
            {foot(LF, c.skin, "ftF")}
          </g>
        ) : (
          foot(LF, c.skin, "ftF")
        )}
      </g>
    );
  };

  /* ---------------- kneeling on the heels under the sari (PuppetProps.sitStyle "kneel") ---------------- */
  const vajraLower = () => {
    const CT = 0.44;
    type Q = { x: number; y: number; z: number };
    const zMid = B.thigh * 0.35;
    const P = (v: V3): Q => {
      const r = rotY(v);
      return { x: r.x, y: hipY + v[1] + CT * (r.z - zMid), z: r.z };
    };
    const sH = vajraSeatH;
    const hx = B.hw * 0.6;
    const kneeR = legW1 * 1.4;
    const kneeZ = B.thigh * lerp(0.9, 0.58, bowK);
    const pts: Q[] = [];
    const side = (sd: 1 | -1) => {
      const hip = P([sd * hx, 0, -legW1 * 0.2]);
      const knee = P([sd * hx * 1.3, sH - kneeR * 0.85, kneeZ]);
      const ankle = P([sd * hx * 0.75, sH - legW2 * 0.85, -B.thigh * 0.02]);
      const toe = P([sd * hx * 0.7, sH - legW2 * 0.35, -B.thigh * 0.02 - B.foot * 0.85]);
      const buttock = P([sd * (hx + legW1 * 0.4), legW1 * 0.25, -legW1 * 1.35]);
      const floorK = P([sd * (hx * 1.3 + kneeR * 1.05), sH, kneeZ + kneeR * 0.35]);
      const floorB = P([sd * (hx * 0.9 + legW2), sH, -B.thigh * 0.1 - B.foot * 0.4]);
      // the sari spreads on the floor beside the folded legs (a frontal view then widens toward the floor)
      const floorS = P([sd * (hx + legW1 * 2.2), sH, B.thigh * 0.2]);
      return { sd, hip, knee, ankle, toe, buttock, floorK, floorB, floorS };
    };
    const S1 = side(-1);
    const S2 = side(1);
    const waistY = hipY - 10;
    const ws = 1.15;
    const all = [S1, S2];
    for (const S of all) {
      pts.push(S.buttock, S.floorK, S.floorB, S.floorS);
      pts.push({ x: S.knee.x - kneeR, y: S.knee.y, z: S.knee.z }, { x: S.knee.x + kneeR, y: S.knee.y, z: S.knee.z }, { x: S.knee.x, y: S.knee.y - kneeR * 0.95, z: S.knee.z });
      pts.push({ x: S.hip.x, y: S.hip.y - legW1 * 1.1, z: S.hip.z });
    }
    pts.push({ x: -hwp * ws, y: waistY, z: 0 }, { x: hwp * ws, y: waistY, z: 0 });
    const H = hull(pts.map((q) => [q.x, q.y] as [number, number]));
    const d = smoothPath(H, 1);
    const lowg = `url(#${uid}-lowg)`;
    const rimg = `url(#${uid}-rim)`;
    const clipId = `${uid}-vjclip`;
    // the hem lies on the floor: the part of the outline near the floor line
    const floorLine = hipY + sH;
    const nearFloor = H.filter((q) => q[1] > floorLine - legW1 * 1.6).sort((a, b) => a[0] - b[0]);
    const trim = c.lowerTrim ?? c.topTrim ?? c.lowerShade;
    const soleCol = lerpColor(c.skin, "#f2d6bc", 0.5);
    const kneeMid = { x: (S1.knee.x + S2.knee.x) / 2, y: (S1.knee.y + S2.knee.y) / 2 };
    const foot = (S: ReturnType<typeof side>) => {
      const t = limb(S.ankle.x, S.ankle.y, S.toe.x, S.toe.y, B.foot * 0.25, B.foot * 0.21);
      return (
        <g key={`vf${S.sd}`}>
          <path d={t.d} transform={t.t} fill={c.skinShade} />
          <path d={`M ${lerp(S.ankle.x, S.toe.x, 0.1)} ${lerp(S.ankle.y, S.toe.y, 0.1) + B.foot * 0.08} L ${lerp(S.ankle.x, S.toe.x, 0.9)} ${lerp(S.ankle.y, S.toe.y, 0.9) + B.foot * 0.08}`} stroke={soleCol} strokeWidth={B.foot * 0.2} strokeLinecap="round" />
        </g>
      );
    };
    // the far-side foot first; both soles show behind her, under the sari's back edge
    const feetSorted = [S1, S2].sort((a, b) => a.toe.z - b.toe.z);
    const pleatX = kneeMid.x;
    return (
      <g>
        {feetSorted.map(foot)}
        <defs>
          <clipPath id={clipId}>
            <path d={d} />
          </clipPath>
        </defs>
        <path d={d} fill={lowg} />
        <path d={d} fill={rimg} />
        <g clipPath={`url(#${clipId})`}>
          {/* the folded legs under the cloth: thigh tops catch the light, the knees are round, shade between them */}
          {all.map((S) => (
            <g key={`vk${S.sd}`}>
              <path d={`M ${S.hip.x} ${S.hip.y - legW1 * 0.7} Q ${lerp(S.hip.x, S.knee.x, 0.5)} ${lerp(S.hip.y, S.knee.y, 0.5) - kneeR * 1.1} ${S.knee.x} ${S.knee.y - kneeR * 0.75}`} stroke={lerpColor(c.lowerColor, "#ffffff", 0.45)} strokeWidth={legW1 * 0.9} fill="none" strokeLinecap="round" opacity={0.45} />
              <ellipse cx={S.knee.x} cy={S.knee.y} rx={kneeR * 0.98} ry={kneeR * 0.82} fill={lowg} />
              <ellipse cx={S.knee.x} cy={S.knee.y - kneeR * 0.35} rx={kneeR * 0.55} ry={kneeR * 0.3} fill={lerpColor(c.lowerColor, "#ffffff", 0.5)} opacity={0.5} />
              <path d={`M ${S.knee.x - kneeR * 0.85} ${S.knee.y + kneeR * 0.3} Q ${S.knee.x} ${S.knee.y + kneeR * 0.95} ${S.knee.x + kneeR * 0.85} ${S.knee.y + kneeR * 0.3}`} stroke={c.lowerShade} strokeWidth={1.5} fill="none" opacity={0.6} />
              {/* the cloth's fold from the hip down over the heel */}
              <path d={`M ${S.hip.x} ${S.hip.y} Q ${S.buttock.x} ${lerp(S.hip.y, floorLine, 0.6)} ${S.floorB.x} ${floorLine - legW2 * 0.4}`} stroke={c.lowerShade} strokeWidth={1.3} fill="none" opacity={0.45} />
            </g>
          ))}
          <path d={`M ${(S1.hip.x + S2.hip.x) / 2} ${hipY + legW1 * 0.2} Q ${kneeMid.x} ${kneeMid.y - kneeR * 0.4} ${kneeMid.x} ${kneeMid.y + kneeR * 0.6}`} stroke={c.lowerShade} strokeWidth={2} fill="none" opacity={0.5} />
          {/* front pleats, falling from the waist between the knees onto the floor */}
          {[-3, -1, 1, 3].map((k) => (
            <path key={k} d={`M ${frontX * 0.5 + k * 1.6} ${waistY + 6} Q ${lerp(frontX * 0.5, pleatX, 0.6) + k * 2.4} ${kneeMid.y - kneeR * 0.2} ${pleatX + k * 3.2} ${floorLine}`} stroke={c.lowerShade} strokeWidth={1.1} fill="none" opacity={0.45} />
          ))}
          {nearFloor.length >= 2 && (
            <path d={smoothPath(nearFloor.map((q) => [q[0], q[1] - 3.2] as [number, number]), 1, false)} stroke={trim} strokeWidth={6} fill="none" strokeLinecap="round" />
          )}
        </g>
      </g>
    );
  };

  const lowerBody = () =>
    crossOn ? (
      crossLower()
    ) : vajraOn ? (
      vajraLower()
    ) : (
    <g>
      {c.lower === "saree" ? (
        <>
          {feetMap && legsSorted.map((L) => footShadow(feetMap.get(L.side)!))}
          {legsSorted.map((L) => drawLeg(L, L === legsSorted[0] && Math.abs(sphi) > 0.15, feetMap?.get(L.side), !feetMap || drapeK > 0))}
          {feetMap && legsSorted.map((L) => drawFoot(feetMap.get(L.side)!, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
          {skirt("ankle")}
          {feetMap && legsSorted.map((L) => toesOver(feetMap.get(L.side)!, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
        </>
      ) : c.lower === "none" ? (
        <>
          {khadamOn && legsSorted.map((L) => khadamShadow(L))}
          {legsSorted.map((L) => drawLeg(L, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
        </>
      ) : (
        <>
          {khadamOn && legsSorted.map((L) => khadamShadow(L))}
          {legsSorted.map((L) => drawLeg(L, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
          {dhoti()}
        </>
      )}
    </g>
    );

  /* ---------------- torso ---------------- */
  const torso = () => {
    const hemY = crossOn
      ? c.outfit === "kurta"
        ? hipY + legW1 * 0.9
        : hipY - B.torsoLen * 0.1
      : seated || c.outfit === "frock"
        ? hipY + 4
        : c.outfit === "kurta"
          ? hipY + B.thigh * (B.child ? 0.38 : 0.42)
          : c.outfit === "vest"
            ? hipY - 2
            : hipY + 2;
    const flare = c.outfit === "kurta" ? 1.22 : 1.04;
    const cs = clothSway * 0.5;
    const bF = belly * (0.5 + 0.5 * Math.abs(sphi));
    const bL = sphi < 0 ? bF : belly * 0.4 * cphi;
    const bR = sphi > 0 ? bF : belly * 0.4 * cphi;
    const path = `M ${-B.sw * 0.3 * kf} ${shY - 5}
      Q ${-swp * 0.82} ${shY - 6} ${-swp} ${shY + 7}
      Q ${-swp * 1.04} ${shY + B.torsoLen * 0.25} ${-swp * 0.96 - bL * 0.4} ${shY + B.torsoLen * 0.45}
      Q ${-hwp * 1.12 - bL} ${shY + B.torsoLen * 0.8} ${-hwp * flare + cs} ${hemY}
      Q ${cs * 0.5} ${hemY + 6} ${hwp * flare + cs} ${hemY}
      Q ${hwp * 1.12 + bR} ${shY + B.torsoLen * 0.8} ${swp * 0.96 + bR * 0.4} ${shY + B.torsoLen * 0.45}
      Q ${swp * 1.04} ${shY + B.torsoLen * 0.25} ${swp} ${shY + 7}
      Q ${swp * 0.82} ${shY - 6} ${B.sw * 0.3 * kf} ${shY - 5}
      Q ${frontX * 0.3} ${shY + 3} ${-B.sw * 0.3 * kf} ${shY - 5} Z`;
    const isSkin = c.outfit === "bare";
    const px = frontX;
    return (
      <g>
        {/* tapered neck (narrower under the jaw, wider at the base) with throat shading */}
        <path
          d={`M ${-B.headR * 0.24} ${shY - B.neck - 18} L ${B.headR * 0.24} ${shY - B.neck - 18} Q ${B.headR * 0.26} ${shY - 6} ${B.headR * 0.36} ${shY + 2} L ${-B.headR * 0.36} ${shY + 2} Q ${-B.headR * 0.26} ${shY - 6} ${-B.headR * 0.24} ${shY - B.neck - 18} Z`}
          fill={c.skin}
        />
        <path d={`M ${-B.headR * 0.24} ${shY - B.neck - 18} L ${B.headR * 0.24} ${shY - B.neck - 18} L ${B.headR * 0.22} ${shY - B.neck - 6} Q 0 ${shY - B.neck} ${-B.headR * 0.22} ${shY - B.neck - 6} Z`} fill={c.skinShade} opacity={0.55} />
        {!B.child && <path d={`M ${keySide * -B.headR * 0.12} ${shY - B.neck - 8} Q ${keySide * -B.headR * 0.06} ${shY - 8} ${keySide * B.headR * 0.04} ${shY}`} stroke={c.skinShade} strokeWidth={1.3} fill="none" opacity={0.45} />}
        <path d={path} fill={isSkin ? `url(#${uid}-skin-body)` : `url(#${uid}-topg)`} />
        {c.print && !isSkin && <path d={path} fill={`url(#${uid}-print)`} />}
        {isSkin && (
          <g stroke={c.skinShade} fill="none" opacity={0.55} strokeLinecap="round">
            <path d={`M ${px - 3} ${shY + 3} Q ${-swp * 0.35 + px * 0.5} ${shY + 1} ${-swp * 0.8} ${shY + 6}`} strokeWidth={1.4} />
            <path d={`M ${px + 3} ${shY + 3} Q ${swp * 0.35 + px * 0.5} ${shY + 1} ${swp * 0.8} ${shY + 6}`} strokeWidth={1.4} />
          </g>
        )}
        {c.outfit === "kurta" && !seated && (
          <g>
            {/* side slits: the dhoti shows through */}
            {[-1, 1].map((sd) => {
              const sxh = sd * hwp * flare * 0.96 + cs;
              const top = hemY - B.thigh * 0.2;
              return <path key={sd} d={`M ${sxh} ${top} L ${sxh - sd * 4} ${hemY + 1} L ${sxh + sd * 2} ${hemY + 1} Z`} fill={c.lowerColor} stroke={c.topShade} strokeWidth={1} />;
            })}
            {/* tension folds pulled from the armpit when an arm is raised */}
            {[
              { sd: 1, S: p.rS },
              { sd: -1, S: p.lS },
            ].map(({ sd, S }) =>
              S > 45 ? (
                <path
                  key={sd}
                  d={`M ${sd * swp * 0.85} ${shY + 16} Q ${sd * swp * 0.5} ${shY + B.torsoLen * 0.3} ${sd * swp * 0.15 + px * 0.5} ${shY + B.torsoLen * 0.5}`}
                  stroke={c.topShade}
                  strokeWidth={1.8}
                  fill="none"
                  opacity={clamp((S - 45) / 60) * 0.6}
                />
              ) : null,
            )}
          </g>
        )}
        {c.outfit === "vest" && <path d={`M ${-B.sw * 0.28 * kf + px * 0.3} ${shY - 4} L ${px} ${shY + B.torsoLen * 0.55} L ${B.sw * 0.28 * kf + px * 0.3} ${shY - 4} Z`} fill={c.skin} />}
        {isSkin && (
          <g opacity={0.5} stroke={c.skinShade} fill="none">
            <path d={`M ${-swp * 0.55 + px * 0.5} ${shY + B.torsoLen * 0.3} Q ${-swp * 0.25 + px} ${shY + B.torsoLen * 0.38} ${px - 2} ${shY + B.torsoLen * 0.28} M ${swp * 0.55 + px * 0.5} ${shY + B.torsoLen * 0.3} Q ${swp * 0.25 + px} ${shY + B.torsoLen * 0.38} ${px + 2} ${shY + B.torsoLen * 0.28}`} strokeWidth={2} />
            <ellipse cx={px} cy={shY + B.torsoLen * 0.78} rx={1.6} ry={2.4} fill={c.skinShade} />
            {c.wiry &&
              [0.42, 0.5, 0.58].map((k) => (
                <path key={k} d={`M ${-swp * 0.7 + px * 0.3} ${shY + B.torsoLen * k} q ${swp * 0.25} 4 ${swp * 0.42} 0 M ${swp * 0.7 + px * 0.3} ${shY + B.torsoLen * k} q ${-swp * 0.25} 4 ${-swp * 0.42} 0`} strokeWidth={1.2} />
              ))}
          </g>
        )}
        {!isSkin && (
          <g opacity={0.45} fill="none" stroke={c.topShade} strokeLinecap="round">
            <path d={`M ${-swp * 0.9} ${shY + 18} Q ${-swp * 0.4} ${shY + B.torsoLen * 0.5} ${-hwp * 0.7 + cs} ${hemY - 8}`} strokeWidth={2.2} />
            <path d={`M ${swp * 0.9} ${shY + 22} Q ${swp * 0.45} ${shY + B.torsoLen * 0.55} ${hwp * 0.8 + cs} ${hemY - 10}`} strokeWidth={2.2} />
          </g>
        )}
        {c.outfit === "kurta" && (
          <g>
            <path d={`M ${px} ${shY - 2} L ${px} ${shY + B.torsoLen * 0.42}`} stroke={c.topShade} strokeWidth={2} />
            {[0.1, 0.22, 0.34].map((k) => (
              <circle key={k} cx={px + 3.2 * cphi} cy={shY + B.torsoLen * k} r={2.1} fill={c.topTrim ?? "#c9a24a"} />
            ))}
            <path d={`M ${-B.headR * 0.32 * kf + px * 0.4} ${shY - 5} Q ${px} ${shY + 4} ${B.headR * 0.32 * kf + px * 0.4} ${shY - 5}`} stroke={c.topShade} strokeWidth={3} fill="none" />
          </g>
        )}
        {c.outfit === "vest" && [0.18, 0.34, 0.5].map((k) => <circle key={k} cx={px + B.sw * 0.12 * (1 - k * 1.5)} cy={shY + B.torsoLen * k} r={1.8} fill={c.topTrim ?? "#f3d27a"} />)}
        {c.outfit === "blouse" && <path d={`M ${-hwp * 1.05} ${hipY - 12} Q 0 ${hipY - 6} ${hwp * 1.05} ${hipY - 12} L ${hwp * 1.05} ${hipY - 3} Q 0 ${hipY + 3} ${-hwp * 1.05} ${hipY - 3} Z`} fill={c.skin} />}
        <path d={path} fill={`url(#${uid}-rim)`} />
        {c.paita && <path d={`M ${-swp * 0.62} ${shY + 2} Q ${-swp * 0.05 + px} ${shY + B.torsoLen * 0.55} ${hwp * 0.85} ${hipY - 4}`} stroke="#f6efe0" strokeWidth={1.6} fill="none" />}
      </g>
    );
  };

  /* ---------------- scarf / anchal ---------------- */
  const scarf = () => {
    const s = c.scarf;
    if (!s || c.hairStyle === "wrap") return s && c.hairStyle === "wrap" ? scarfDrape(s, true) : null;
    return scarfDrape(s, false);
  };
  const scarfDrape = (s: NonNullable<CastMember["scarf"]>, gamchha: boolean) => {
    const cs = (clothSway + Math.sin(life * 0.11 + c.seed) * 1.5) * 1.2;
    const pc = pCloth.lean - p.lean;
    if (s.style === "neck") {
      return (
        <g>
          <path d={`M ${-swp * 0.55} ${shY - 2} Q ${frontX * 0.3} ${shY + 14} ${swp * 0.55} ${shY - 2} Q 0 ${shY + 4} ${-swp * 0.55} ${shY - 2} Z`} fill={s.color} />
          <path
            d={`M ${swp * 0.42 + frontX * 0.3} ${shY + 2} Q ${swp * 0.5 + cs + frontX * 0.3} ${shY + B.torsoLen * 0.45} ${swp * 0.38 + cs * 1.6 + pc} ${shY + B.torsoLen * 0.8} L ${swp * 0.12 + cs * 1.6 + pc} ${shY + B.torsoLen * 0.78} Q ${swp * 0.25 + cs} ${shY + B.torsoLen * 0.4} ${swp * 0.18} ${shY + 6} Z`}
            fill={s.color}
          />
          <path
            d={`M ${-swp * 0.42 + frontX * 0.3} ${shY + 2} Q ${-swp * 0.52 + cs} ${shY + B.torsoLen * 0.4} ${-swp * 0.45 + cs * 1.4 + pc} ${shY + B.torsoLen * 0.7} L ${-swp * 0.2 + cs * 1.4 + pc} ${shY + B.torsoLen * 0.7} Q ${-swp * 0.28 + cs} ${shY + B.torsoLen * 0.35} ${-swp * 0.18} ${shY + 6} Z`}
            fill={s.shade}
          />
          {s.trim && <path d={`M ${swp * 0.38 + cs * 1.6 + pc} ${shY + B.torsoLen * 0.8} L ${swp * 0.12 + cs * 1.6 + pc} ${shY + B.torsoLen * 0.78}`} stroke={s.trim} strokeWidth={4} />}
        </g>
      );
    }
    if (s.style === "shawl") {
      return (
        <g>
          <path
            d={`M ${-swp * 1.08} ${shY + 4} Q 0 ${shY - 10} ${swp * 1.08} ${shY + 4} L ${swp * 1.12 + cs} ${shY + B.torsoLen * 0.62} Q ${swp * 0.3 + frontX} ${shY + B.torsoLen * 0.5} ${frontX + 2} ${shY + 14} Q ${-swp * 0.3 + frontX} ${shY + B.torsoLen * 0.5} ${-swp * 1.12 + cs} ${shY + B.torsoLen * 0.62} Z`}
            fill={s.color}
          />
          <path d={`M ${frontX + 2} ${shY + 14} Q ${swp * 0.3 + frontX} ${shY + B.torsoLen * 0.5} ${swp * 1.12 + cs} ${shY + B.torsoLen * 0.62}`} stroke={s.trim ?? s.shade} strokeWidth={3.5} fill="none" />
          <path d={`M ${frontX + 2} ${shY + 14} Q ${-swp * 0.3 + frontX} ${shY + B.torsoLen * 0.5} ${-swp * 1.12 + cs} ${shY + B.torsoLen * 0.62}`} stroke={s.trim ?? s.shade} strokeWidth={3.5} fill="none" />
        </g>
      );
    }
    if (s.style === "waist") {
      // Episode 6: a checked gamchha tied round the waist over the dhoti, knotted toward the near hip, one end hanging
      const ns: 1 | -1 = sphi > 0.05 ? -1 : 1;
      const y0 = hipY - B.torsoLen * 0.12;
      const y1 = hipY + B.thigh * 0.06;
      const wx = hwp * 1.14;
      const kx = frontX * 0.55 + ns * hwp * 0.5;
      const ky = (y0 + y1) / 2;
      const sw3 = cs * 0.9 + pc * 1.2;
      const endL = B.thigh * 0.55;
      const ew = B.sw * 0.17;
      const band = `M ${-wx} ${y0 + 2} Q 0 ${y0 - 3} ${wx} ${y0 + 2} L ${wx * 1.02} ${y1} Q 0 ${y1 + 5} ${-wx * 1.02} ${y1} Z`;
      const endD = `M ${kx - ew * 0.6} ${ky} L ${kx + ew * 0.6} ${ky} L ${kx + ew * 0.75 + sw3} ${ky + endL} Q ${kx + sw3 * 1.05} ${ky + endL + 3} ${kx - ew * 0.75 + sw3 * 1.1} ${ky + endL} Z`;
      const tr = s.trim ?? "#f3e6cf";
      return (
        <g>
          <path d={band} fill={s.color} />
          <path d={`M ${-wx} ${y1 - 2.5} Q 0 ${y1 + 2.5} ${wx * 1.02} ${y1 - 2.5}`} stroke={s.shade} strokeWidth={2.4} fill="none" opacity={0.8} />
          {[0.3, 0.62].map((k) => (
            <path key={k} d={`M ${-wx} ${lerp(y0, y1, k) + 1} Q 0 ${lerp(y0, y1, k) + 3} ${wx} ${lerp(y0, y1, k) + 1}`} stroke={tr} strokeWidth={1.5} fill="none" opacity={0.75} />
          ))}
          {[-0.6, -0.2, 0.2, 0.6].map((k) => (
            <path key={`v${k}`} d={`M ${k * wx + frontX * 0.3} ${y0 + 1} L ${k * wx + frontX * 0.3} ${y1}`} stroke={tr} strokeWidth={1.1} opacity={0.55} />
          ))}
          <path d={endD} fill={s.shade} />
          {[0.35, 0.7].map((k) => (
            <path key={`e${k}`} d={`M ${kx - ew * 0.65 + sw3 * k} ${ky + endL * k} L ${kx + ew * 0.7 + sw3 * k} ${ky + endL * k}`} stroke={tr} strokeWidth={1.4} opacity={0.75} />
          ))}
          {[0.2, 0.5, 0.8].map((k) => {
            const fx = lerp(kx - ew * 0.7, kx + ew * 0.7, k) + sw3 * 1.05;
            return <path key={`r${k}`} d={`M ${fx} ${ky + endL} l ${sw3 * 0.12} 4`} stroke={s.shade} strokeWidth={1.2} strokeLinecap="round" />;
          })}
          {/* the knot */}
          <ellipse cx={kx} cy={ky} rx={ew * 0.75} ry={ew * 0.6} fill={s.color} />
          <path d={`M ${kx - ew * 0.5} ${ky - ew * 0.2} Q ${kx} ${ky + ew * 0.35} ${kx + ew * 0.55} ${ky - ew * 0.15}`} stroke={s.shade} strokeWidth={1.2} fill="none" opacity={0.85} />
        </g>
      );
    }
    if (s.style === "gamchha") {
      // a checked towel folded over the left shoulder: the fold lies on the shoulder, one end hangs down the chest
      const gx = -swp * 0.56 + frontX * 0.35;
      const w = B.sw * 0.2;
      const top = shY - 5;
      const bot = shY + B.torsoLen * 0.56;
      const sw2 = cs * 0.9 + pc * 1.2;
      const xl = (k: number) => lerp(gx - w * 1.25, gx - w + sw2 * 1.05, k);
      const xr = (k: number) => lerp(gx + w * 1.1, gx + w + sw2, k);
      const yk = (k: number) => lerp(top + 3, bot + 1.5, k);
      const end = `M ${gx - w * 1.25} ${top + 4} Q ${gx} ${top - 5} ${gx + w * 1.1} ${top + 2} L ${gx + w + sw2} ${bot} Q ${gx + sw2} ${bot + 3} ${gx - w + sw2 * 1.05} ${bot + 3} Z`;
      const fold = `M ${-swp * 1.02} ${shY + 8} Q ${-swp * 0.88} ${shY - 9} ${gx + w * 1.1} ${top + 2} L ${gx - w * 1.25} ${top + 4} Q ${-swp * 0.93} ${shY - 1} ${-swp * 1.06} ${shY + 14} Z`;
      const tr = s.trim ?? "#f3e6cf";
      return (
        <g>
          <path d={fold} fill={s.shade} />
          <path d={end} fill={s.color} />
          {[0.18, 0.42, 0.66, 0.9].map((k) => (
            <path key={k} d={`M ${xl(k)} ${yk(k)} L ${xr(k)} ${yk(k) - 1}`} stroke={tr} strokeWidth={2.2} opacity={0.85} />
          ))}
          {[0.34, 0.68].map((k) => (
            <path key={`v${k}`} d={`M ${lerp(xl(0.04), xr(0.04), k)} ${yk(0.04)} L ${lerp(xl(1), xr(1), k)} ${yk(1)}`} stroke={tr} strokeWidth={1.6} opacity={0.7} />
          ))}
          {/* the fringe at the hanging end */}
          {[0.15, 0.35, 0.55, 0.75, 0.92].map((k) => {
            const fx = lerp(xl(1), xr(1), k);
            return <path key={`r${k}`} d={`M ${fx} ${bot + 2} l ${sw2 * 0.15} 5`} stroke={s.color} strokeWidth={1.3} strokeLinecap="round" />;
          })}
          <path d={`M ${gx - w * 1.25} ${top + 4} Q ${gx} ${top - 5} ${gx + w * 1.1} ${top + 2}`} stroke={s.shade} strokeWidth={1.4} fill="none" opacity={0.8} />
        </g>
      );
    }
    const check = s.style === "check";
    return (
      <g>
        <path
          d={`M ${-swp * 0.95} ${shY + 2} Q ${-swp * 0.4} ${shY - 6} ${-swp * 0.1 + frontX * 0.3} ${shY - 1}
              Q ${swp * 0.25 + frontX * 0.6} ${shY + B.torsoLen * 0.45} ${hwp * 1.05} ${hipY - 2}
              L ${hwp * 0.7} ${hipY + 10} Q ${-swp * 0.2 + frontX * 0.5} ${shY + B.torsoLen * 0.62} ${-swp * 1.02} ${shY + 26} Z`}
          fill={s.color}
        />
        <path
          d={`M ${-swp * 1.0} ${shY + 6} Q ${-swp * 1.2 + cs} ${shY + B.torsoLen * 0.5} ${-swp * 1.1 + cs * 1.8 + pc * 1.5} ${shY + B.torsoLen * 0.95} L ${-swp * 0.82 + cs * 1.8 + pc * 1.5} ${shY + B.torsoLen * 0.95} Q ${-swp * 0.95 + cs} ${shY + B.torsoLen * 0.45} ${-swp * 0.8} ${shY + 18} Z`}
          fill={s.shade}
        />
        {check &&
          [0.2, 0.4, 0.6, 0.8].map((k) => (
            <path key={k} d={`M ${lerp(-swp * 0.4, hwp * 0.9, k) - 10} ${lerp(shY + 2, hipY, k) + 4} l 18 -6`} stroke={s.trim ?? "#ffffff"} strokeWidth={2} opacity={0.7} />
          ))}
        {s.trim && !check && (
          <path d={`M ${-swp * 0.1 + frontX * 0.3} ${shY - 1} Q ${swp * 0.25 + frontX * 0.6} ${shY + B.torsoLen * 0.45} ${hwp * 1.05} ${hipY - 2}`} stroke={s.trim} strokeWidth={4} fill="none" />
        )}
        {gamchha && null}
      </g>
    );
  };

  /* ---------------- the anchal over the back in the kneeling pranam (sitStyle "kneel") ---------------- */
  // Bowed down, a Bengali woman's back is covered by her sari's end (the anchal, over her head as a ghomta): one smooth
  // cloth from the raised hips over the rounded back to the veiled head, its border along the edge. Torso frame.
  const pranamCloak = () => {
    if (sitStyle !== "kneel" || c.lower !== "saree") return null;
    const k = clamp((bowK - 0.12) / 0.4);
    if (k <= 0) return null;
    const fw: 1 | -1 = sphi >= 0 ? 1 : -1;
    const nT = shY - B.neck + headBreathY;
    const R = B.headR;
    const col = c.scarf?.color ?? c.lowerColor;
    const shade = c.scarf?.shade ?? c.lowerShade;
    const trim = c.scarf?.trim ?? c.lowerTrim ?? c.topTrim ?? shade;
    const bx = (v: number) => -fw * v; // toward the back
    const d = `M ${bx(hwp * 1.3)} ${hipY + 8}
      C ${bx(swp * 1.45)} ${hipY - B.torsoLen * 0.35} ${bx(swp * 1.35)} ${shY + B.torsoLen * 0.1} ${bx(swp * 1.05)} ${shY - 6}
      C ${bx(swp * 0.8)} ${shY - B.neck - 4} ${bx(R * 0.95)} ${nT - R * 0.7} ${bx(R * 0.35)} ${nT - R * 1.25}
      L ${fw * R * 0.45} ${nT - R * 0.4}
      C ${fw * swp * 0.8} ${shY + 2} ${fw * swp * 1.05} ${shY + B.torsoLen * 0.45} ${fw * hwp * 1.2} ${hipY + 6}
      Q 0 ${hipY + 14} ${bx(hwp * 1.3)} ${hipY + 8} Z`;
    const edge = `M ${fw * R * 0.45} ${nT - R * 0.4} C ${fw * swp * 0.8} ${shY + 2} ${fw * swp * 1.05} ${shY + B.torsoLen * 0.45} ${fw * hwp * 1.2} ${hipY + 6}`;
    return (
      <g opacity={k}>
        <path d={d} fill={col} />
        <path d={d} fill={`url(#${uid}-rim)`} opacity={0.7} />
        {/* soft folds running along the back, and the shade under the front edge */}
        {[0.35, 0.6, 0.82].map((t) => (
          <path key={t} d={`M ${bx(hwp * (1.25 - 0.5 * t))} ${hipY + 4} Q ${bx(swp * (1.3 - 0.45 * t))} ${lerp(hipY, shY, 0.5)} ${bx(swp * (1.0 - 0.4 * t))} ${shY - 2}`} stroke={shade} strokeWidth={1.4} fill="none" opacity={0.55} />
        ))}
        <path d={edge} stroke={shade} strokeWidth={5} fill="none" opacity={0.5} transform={`translate(${-fw * 3}, 0)`} />
        <path d={edge} stroke={trim} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </g>
    );
  };

  /* ---------------- shoulder bag (jhola, Episode 5 on) ---------------- */
  const bag = () => {
    const b = c.bag;
    if (!b) return null;
    const bs = b.side ?? -1;
    const sway = (clothSway + Math.sin(life * 0.09 + c.seed) * 0.8) * 0.8;
    const bw = B.sw * 0.66;
    const bh = B.sw * 0.74;
    const bx = bs * hwp * 1.02 + frontX * 0.5 + sway;
    const by = hipY - B.torsoLen * 0.12;
    const sx0 = -bs * swp * 0.6 + frontX * 0.3;
    const sy0 = shY - 3;
    const ex = bx - bs * bw * 0.3;
    const strap = b.strap ?? b.shade;
    const body = `M ${bx - bw * 0.46} ${by} L ${bx + bw * 0.46} ${by} Q ${bx + bw * 0.56} ${by + bh * 0.6} ${bx + bw * 0.5} ${by + bh} Q ${bx} ${by + bh * 1.06} ${bx - bw * 0.5} ${by + bh} Q ${bx - bw * 0.56} ${by + bh * 0.6} ${bx - bw * 0.46} ${by} Z`;
    return (
      <g>
        <path d={`M ${sx0} ${sy0} Q ${frontX * 0.6 - bs * swp * 0.05} ${lerp(sy0, by, 0.42)} ${ex} ${by + 2}`} stroke={strap} strokeWidth={B.limbW * 0.55} fill="none" strokeLinecap="round" />
        <path d={body} fill={b.color} />
        <path d={`M ${bx - bw * 0.46} ${by} L ${bx + bw * 0.46} ${by} Q ${bx + bw * 0.48} ${by + bh * 0.34} ${bx} ${by + bh * 0.4} Q ${bx - bw * 0.48} ${by + bh * 0.34} ${bx - bw * 0.46} ${by} Z`} fill={b.shade} opacity={0.75} />
        <path d={`M ${bx - bw * 0.3} ${by + bh * 0.62} Q ${bx} ${by + bh * 0.7} ${bx + bw * 0.32} ${by + bh * 0.6}`} stroke={b.shade} strokeWidth={1.2} fill="none" opacity={0.6} />
      </g>
    );
  };

  /* ---------------- arms ---------------- */
  // PuppetProps.reachExact: a per-arm stretch (1 = the rig's own lengths), set by the reach solve below
  const armStretch: Record<number, number> = { 1: 1, [-1]: 1 };
  const arm = (side: 1 | -1, S: number, E: number, shape: HandShape, propId: string, back: boolean, extraFlex: number, wrist = 0, turn?: number, backK?: number) => {
    const UA = B.ua * armStretch[side];
    const FA = (B.fa - 2) * armStretch[side] + 2;
    const sx = side * B.sw * 0.86 * cphi;
    const rot1 = -side * S;
    const rot2 = -side * E;
    const sleeveCol = c.outfit === "kurta" || c.outfit === "blouse" || c.outfit === "frock" ? c.top : null;
    const upperSleeve = sleeveCol && c.sleeve !== "none";
    const foreSleeve = sleeveCol && (c.sleeve === "full" || c.sleeve === "rolled");
    const foreSleeveLen = c.sleeve === "full" ? 0.84 : 0.42;
    const soft = softSleeves && (c.outfit === "blouse" || c.outfit === "frock") && c.sleeve === "half";
    const upperLen = c.sleeve === "half" ? (soft ? 0.6 : 0.78) : 1.05;
    const slim = (female ? 0.88 : 1) * (c.wiry ? 0.9 : 1);
    const fitted = c.outfit === "blouse" || c.outfit === "frock"; // blouse sleeves hug the arm
    const L = B.limbW * slim;
    const PropR = propId ? props[propId] : undefined;
    // backK (Episode 5, Pose.hold): eases a far arm out of its dark far-side styling to a light shade of her own skin
    const skin = backK !== undefined ? lerpColor(c.skin, c.skinShade, lerp(0.22, 1, backK)) : back ? c.skinShade : c.skin;
    const backStyle = backK !== undefined ? (backK > 0.001 ? { filter: `brightness(${lerp(1, 0.85, backK)})` } : undefined) : back ? { filter: "brightness(0.85)" } : undefined;
    const bend = clamp(Math.abs(E) / 120); // elbow flexion 0..1
    const inner = -Math.sign(rot2 || 1); // side of the arm the elbow folds toward
    const sleeveFill = `url(#${uid}-topg)`;
    // sleeve tube with a flared opening at `len`
    const sleeve = (len: number, wTop: number, wEnd: number) => (
      <g>
        <path d={seg(len, wTop, (wTop + wEnd) / 2 * 1.04, wEnd, 0.4)} fill={sleeveFill} />
        {c.print && <path d={seg(len, wTop, (wTop + wEnd) / 2 * 1.04, wEnd, 0.4)} fill={`url(#${uid}-print)`} />}
        <ellipse cx={0} cy={len} rx={wEnd} ry={wEnd * 0.32} fill={c.topShade} opacity={0.9} />
        <path d={`M ${-wTop * 0.3} ${len * 0.15} Q ${wTop * 0.2} ${len * 0.55} ${-wEnd * 0.2} ${len * 0.92}`} stroke={c.topShade} strokeWidth={1.4} fill="none" opacity={0.5} />
      </g>
    );
    return (
      <g transform={`translate(${sx}, ${shY + B.limbW}) rotate(${rot1})`} style={backStyle}>
        {/* upper arm: deltoid → biceps → elbow */}
        <path d={seg(UA, L * 1.25, L * 1.1, L * 0.86, 0.3)} fill={skin} />
        {upperSleeve && sleeve(UA * upperLen, L * (fitted ? (soft ? 1.32 : 1.38) : 1.75), c.sleeve === "half" ? L * (fitted ? (soft ? 1.1 : 1.22) : 1.6) : L * 1.3)}
        {upperSleeve && soft && (
          <g>
            {/* inner shade and a soft fold, so the sleeve reads round, not as a flat tube */}
            <path d={`M ${-side * L * 0.95} ${UA * 0.08} Q ${-side * L * 1.15} ${UA * upperLen * 0.5} ${-side * L * 0.9} ${UA * upperLen * 0.95}`} stroke={c.topShade} strokeWidth={L * 0.55} fill="none" opacity={0.55} strokeLinecap="round" />
            <path d={`M ${side * L * 0.4} ${UA * upperLen * 0.35} Q ${side * L * 0.05} ${UA * upperLen * 0.6} ${-side * L * 0.35} ${UA * upperLen * 0.72}`} stroke={c.topShade} strokeWidth={1.2} fill="none" opacity={0.6} />
            <path d={`M ${side * L * 0.8} ${UA * 0.1} L ${side * L * 0.7} ${UA * upperLen * 0.8}`} stroke={c.topLight} strokeWidth={L * 0.35} fill="none" opacity={0.45} strokeLinecap="round" />
          </g>
        )}
        {/* shoulder cap merges the arm into the torso */}
        <circle cx={0} cy={0} r={L * (upperSleeve ? (fitted ? 1.38 : 1.7) : 1.3)} fill={upperSleeve ? sleeveFill : skin} />
        <g transform={`translate(0, ${UA}) rotate(${rot2})`}>
          {/* forearm: swell below the elbow → narrow wrist */}
          <path d={seg(FA, L * 0.9, L * 1.0, L * 0.6, 0.25)} fill={skin} />
          <path d={seg(FA * 0.8, L * 0.35, L * 0.4, L * 0.22, 0.25)} fill={c.skinShade} opacity={0.22} transform={`translate(${side * L * 0.45}, 0)`} />
          {foreSleeve && (
            <g>
              {sleeve(FA * foreSleeveLen, L * 1.45, c.sleeve === "full" ? L * 1.0 : L * 1.25)}
              {c.sleeve === "rolled" && (
                <g>
                  <rect x={-L * 1.4} y={FA * foreSleeveLen - L * 0.75} width={L * 2.8} height={L * 1.2} rx={L * 0.55} fill={c.topLight} />
                  <path d={`M ${-L * 1.3} ${FA * foreSleeveLen - L * 0.15} L ${L * 1.3} ${FA * foreSleeveLen - L * 0.15}`} stroke={c.topShade} strokeWidth={1.1} opacity={0.6} />
                </g>
              )}
            </g>
          )}
          {/* elbow joint + creases that bunch as the elbow bends */}
          <circle cx={0} cy={0} r={L * (upperSleeve && c.sleeve !== "half" ? 1.32 : 0.9)} fill={upperSleeve && c.sleeve !== "half" ? sleeveFill : skin} />
          {bend > 0.2 &&
            [0, 1].map((k) => (
              <path
                key={k}
                d={`M ${inner * L * (0.2 + k * 0.35)} ${-L * (0.6 - k * 0.25)} q ${inner * L * 0.5} ${L * 0.25} ${inner * L * 0.9} ${L * 0.05}`}
                stroke={upperSleeve && c.sleeve !== "half" ? c.topShade : c.skinShade}
                strokeWidth={1.2}
                fill="none"
                opacity={0.6 * bend}
              />
            ))}
          <g transform={`translate(0, ${FA - 2})${PropR ? "" : ` rotate(${-side * wrist})`}`}>
            <Hand shape={shape} L={B.hand} skin={skin} shade={c.skinShade} side={side} flex={noise1(life * 0.04, c.seed + side) * 0.5 + 0.5 + extraFlex} turn={turn} />
            {PropR && <g transform={`translate(0, ${B.hand * 0.62})`}>{PropR({ f, worldRot: rot1 + rot2 + p.lean, side, scale: B.hand / 30 })}</g>}
          </g>
        </g>
      </g>
    );
  };

  /* ---------------- head ---------------- */
  const shape = faceFor(c);
  const look: HeadLook = {
    noBlink: true, // Puppet's own speech-aware blink is the only blink for these figures
    skin: c.skin,
    skinLight: c.skinLight,
    skinShade: c.skinShade,
    lips: c.lips,
    hair: c.hair,
    hairLight: c.hairLight,
    hairStyle: c.hairStyle,
    cloth: c.scarf ? { color: c.scarf.color, shade: c.scarf.shade, trim: c.scarf.trim } : undefined,
    mustache: c.mustache,
    glasses: c.glasses,
    tilak: c.tilak,
    sindoor: c.sindoor,
    bindi: c.bindi,
    ribbon: c.ribbon,
    age: c.age,
    // Per-character face tuning (lashes, kajal, brows, lip tint, mustache weight, age lines, grey hair) from
    // cast.ts: a cast entry's own `look` wins, else the table entry for its id. Spread last so it takes priority.
    ...((c as CastMember & { look?: FaceLook }).look ?? FACE_LOOKS[c.id] ?? {}),
  };
  const head = () => {
    const ph = pHead;
    // the eyes reach the new look direction ~3 frames before the head turn lands
    const eyeLead = live * clamp(pEye.headTurn - ph.headTurn, -0.6, 0.6) * 1.15;
    const sac0 = saccade(life, c.seed);
    const bl = blink(life, c.seed);
    // speech-driven face: brows lift on stressed syllables; blink at natural pauses
    const lv = talk ? (talk(f) + talk(f - 1) + talk(f - 2)) / 3 : 0;
    const browSpeech = clamp((lv - 0.32) * 0.9, 0, 0.35);
    let pauseBlink = 0;
    if (talk) {
      for (let k = 0; k < 6; k++) {
        const now = talk(f - k);
        const before = talk(f - k - 1);
        // a pause begins after at least ~8 frames of speech
        if (now < 0.05 && before >= 0.05 && talk(f - k - 8) >= 0.05) {
          pauseBlink = [0.45, 1, 1, 0.65, 0.25, 0][k];
          break;
        }
      }
    }
    const mth = mouth ? mouth(f) : MOUTH_REST;
    const m = headModel(shape);
    const R = B.headR;
    const neckTop = shY - B.neck + headBreathY;
    const cy = neckTop - m.bottom * R * 0.92 + R * 0.06;
    const yaw = clamp(phi + clamp(ph.headTurn + headTurnIdle, -1, 1) * 1.15 + bowProfile, -1.45, 1.45);
    const roll = headRoll(ph.headTilt + headTiltIdle + emphasis * 0.5) + bowNeck;
    const cyN = cy + ph.headNod + Math.abs(emphasis) * 0.6;
    const pivY = lerp(cyN, neckTop, neckPivotW(roll));
    return (
      <g transform={`translate(${sphi * B.sw * 0.12}, ${pivY}) rotate(${roll}) translate(0, ${cyN - pivY})`}>
        <Head
          R={R}
          shape={shape}
          look={look}
          uid={`${uid}h`}
          keySide={keySide}
          rim={rim}
          rimStrength={rimStrength}
          st={{
            yaw,
            eyeX: clamp((pEye.eyeX * 0.9 - yaw + eyeGlance + eyeLead) / 0.75 + sac0.x * 0.6 * (1 - stillness), -1, 1),
            eyeY: clamp(pEye.eyeY + sac0.y * 0.6 * (1 - stillness), -1, 1),
            close: Math.max(bl, ph.lid, pauseBlink),
            squint: clamp((ph.smile - 0.55) * 1.6, 0, 0.55),
            brow: ph.brow + browSpeech,
            browTilt: ph.browTilt,
            mouth: mth,
            smile: ph.smile,
            gasp: ph.gasp,
            cheeks: ph.cheeks,
            flush: ph.flush,
            tears: ph.tears,
            sway: clothSway,
            f: life, // eye drift, saccades and other face life run on the life clock
          }}
        />
      </g>
    );
  };

  /* ---------------- assembly ---------------- */
  const S = flip ? -scale : scale;
  const brightness = (light.brightness ?? 1) * (lights.length ? 0.9 + Math.min(0.35, lightSum * 0.3) : 1);
  const rFar = p.rBack > 0.5 || (sphi > 0.25 && !female) || sphi > 0.35 || p.behind > 0.5;
  const lFar = p.lBack > 0.5 || sphi < -0.35 || p.behind > 0.5;
  const upperX = weightX + antX;
  // the kneeling bow (Pose.bow): the upper body folds forward from the hips, toward the side the figure faces
  const fwd: 1 | -1 = sphi >= 0 ? 1 : -1;
  const upperRot = p.lean + tiltIdle + antLean;
  // the upper body turns about the hip; a cross-legged sit (sitStyle) bends at the waist over planted hips instead
  const pivY = crossOn ? hipY - B.torsoLen * 0.24 : hipY;
  // group (torso) coordinates <-> figure coordinates for an upper-body rotation r (rad) about the hip (pivY)
  const toFig = (lx: number, ly: number, r: number): [number, number] => [
    upperX + lx * Math.cos(r) - (ly - pivY) * Math.sin(r),
    antY + pivY + lx * Math.sin(r) + (ly - pivY) * Math.cos(r),
  ];
  const toLocal = (X: number, Y: number, r: number): [number, number] => {
    const dx = X - upperX;
    const dy = Y - antY - pivY;
    return [dx * Math.cos(-r) - dy * Math.sin(-r), pivY + dx * Math.sin(-r) + dy * Math.cos(-r)];
  };
  // the head centre in the torso frame (as head() places it, without the nod)
  const headLocal = (): [number, number] => {
    const mH = headModel(shape);
    return [sphi * B.sw * 0.12, shY - B.neck + headBreathY - mH.bottom * B.headR * 0.92 + B.headR * 0.06];
  };
  // the full bow angle: the upper body turns about the hip until the forehead rests just above the floor (on the
  // joined hands), so the head never sinks into the floor whatever the figure's size or hip lift
  let bowDeg = 0;
  if (bowK > 0) {
    const [hx, hy] = headLocal();
    const px = fwd * hx;
    const py = hy - hipY;
    const clear = B.headR * 1.1 + B.hand * 0.22;
    const A = Math.hypot(px, py);
    const target = clamp((-(antY + hipY) - clear) / A, -1, 1);
    const phi0 = Math.atan2(px, py);
    const wrapR = (v: number) => v - 2 * Math.PI * Math.floor((v + Math.PI) / (2 * Math.PI));
    const cands = [wrapR(phi0 - Math.acos(target)), wrapR(phi0 + Math.acos(target))].filter((v) => v > 0.5 && v < 2.3);
    const full = cands.length ? Math.min(...cands) : 1.6;
    bowDeg = fwd * bowK * ((full * 180) / Math.PI);
  }
  const Rnear = ((upperRot + bowDeg) * Math.PI) / 180;
  const wrapDeg = (v: number) => v - 360 * Math.floor((v + 180) / 360);
  /**
   * Two-bone arm solve: the shoulder and elbow angles (S, E, in this rig's convention) that put the wrist on the figure
   * point (tx, ty), taking the elbow solution `pref` asks for; returned near the given S and E so blends never wrap.
   */
  const solveArm = (
    side: 1 | -1,
    far: boolean,
    tx: number,
    ty: number,
    S: number,
    E: number,
    lowK = 1,
    /** Episode 5: picks the elbow solution with the larger score of the elbow's figure point (overrides lowK). */
    pref?: (ex: number, ey: number) => number,
  ): [number, number] => {
    const R = far ? (bowDeg * Math.PI) / 180 : Rnear;
    const sx0 = side * B.sw * 0.86 * cphi;
    const sy0 = shY + B.limbW;
    const [lx, ly] = toLocal(tx, ty, R);
    const vx = lx - sx0;
    const vy = ly - sy0;
    const ua = B.ua * armStretch[side];
    const fa = (B.fa - 2) * armStretch[side];
    const d = clamp(Math.hypot(vx, vy), Math.abs(ua - fa) + 1, ua + fa - 0.5);
    const alpha = Math.atan2(-vx, vy);
    const beta = Math.acos(clamp((ua * ua + d * d - fa * fa) / (2 * ua * d), -1, 1));
    const bend = Math.PI - Math.acos(clamp((ua * ua + fa * fa - d * d) / (2 * ua * fa), -1, 1));
    // lowK 1: the elbow nearer the floor; 0: the elbow tucked back beside the body (away from the facing side)
    const elbowK = (r1: number) => {
      const [ex, ey] = toFig(sx0 - Math.sin(r1) * ua, sy0 + Math.cos(r1) * ua, R);
      return lowK * ey - (1 - lowK) * fwd * ex;
    };
    const elbowP = (r1: number) => {
      const [ex, ey] = toFig(sx0 - Math.sin(r1) * ua, sy0 + Math.cos(r1) * ua, R);
      return pref ? pref(ex, ey) : 0;
    };
    const sgn = pref ? (elbowP(alpha + beta) >= elbowP(alpha - beta) ? 1 : -1) : elbowK(alpha + beta) >= elbowK(alpha - beta) ? 1 : -1;
    const r1 = alpha + sgn * beta;
    const r2 = -sgn * bend;
    return [S + wrapDeg((-side * r1 * 180) / Math.PI - S), E + wrapDeg((-side * r2 * 180) / Math.PI - E)];
  };
  // Pose.join: both wrists meet in front of the breastbone (namaskar), solved for any body turn
  const joinK = clamp(p.join);
  const joinPt = (): [number, number] => toFig(frontX + fwd * B.sw * 0.3 * Math.abs(sphi), shY + B.torsoLen * 0.3, Rnear);
  // over the second half of the bow both arms reach the floor, solved every frame so the hands never float: each
  // elbow comes down onto the floor in front of its shoulder and the forearm lies flat on the floor, pointing forward,
  // so the joined hands rest on the floor by the bowed head
  const reachK = bowK > 0 ? easeIO((bowK - 0.42) / 0.5) : 0;
  const floorY = -B.limbW * 0.95;
  const floorPt = (side: 1 | -1, far: boolean): [number, number] => {
    const R = far ? (bowDeg * Math.PI) / 180 : Rnear;
    const [shx, shy] = toFig(side * B.sw * 0.86 * cphi, shY + B.limbW, R);
    const dy = floorY - shy;
    // the elbow on the floor in front of the shoulder, or (shoulder too high) straight below it
    const ex = dy <= B.ua ? shx + fwd * Math.sqrt(Math.max(0, B.ua * B.ua - dy * dy)) : shx;
    const ey = dy <= B.ua ? floorY : shy + B.ua;
    const fa = (B.fa - 2) * 0.97;
    const fdy = floorY - ey;
    return [ex + fwd * Math.sqrt(Math.max(0, fa * fa - fdy * fdy)), floorY];
  };
  /**
   * The wrist turn that aims a solved hand: fingers up (slightly forward) for joined hands at the chest, flat along the
   * floor pointing forward in the bow. Blended with the pose's own wrist by the join and reach weights.
   */
  const handAim = (side: 1 | -1, far: boolean, S: number, E: number, wrist: number): number => {
    const w = Math.max(joinK, reachK);
    if (w <= 0) return wrist;
    const R = far ? (bowDeg * Math.PI) / 180 : Rnear;
    const tot = R + ((-side * S - side * E) * Math.PI) / 180; // the forearm's rotation in figure space
    const aUp = Math.PI + fwd * 0.3;
    const aFloor = -fwd * (Math.PI / 2 - 0.06);
    const wrapR = (v: number) => v - 2 * Math.PI * Math.floor((v + Math.PI) / (2 * Math.PI));
    const aim = aUp + wrapR(aFloor - aUp) * (joinK > 0 ? reachK : 1);
    const want = (-side * (wrapR(aim - tot) * 180)) / Math.PI;
    return lerp(wrist, clamp(want, -80, 80), w);
  };
  const armSolve = (side: 1 | -1, far: boolean, S0: number, E0: number): [number, number] => {
    if (joinK <= 0 && reachK <= 0) return [S0, E0];
    if (joinK > 0) {
      // joined hands: the wrists travel in a straight blend from the chest to the floor, solved as one target
      const [jx, jy] = joinPt();
      let tx = jx;
      let ty = jy;
      if (reachK > 0) {
        const [fx, fy] = floorPt(side, far);
        tx = lerp(jx, fx, reachK);
        ty = lerp(jy, fy, reachK);
      }
      const [js, je] = solveArm(side, far, tx, ty, S0, E0, reachK);
      return [lerp(S0, js, joinK), lerp(E0, je, joinK)];
    }
    const [fx, fy] = floorPt(side, far);
    const [fs2, fe2] = solveArm(side, far, fx, fy, S0, E0, 1);
    return [lerp(S0, fs2, reachK), lerp(E0, fe2, reachK)];
  };
  const [rS1, rE1] = armSolve(1, rFar, p.rS + armR.dS, elbowR + armR.dE);
  const [lS1, lE1] = armSolve(-1, lFar, p.lS + armL.dS, elbowL + armL.dE);

  /* ---------------- Episode 5: hands to the head, the held hand, the jab, the flung hand, the bamboo ---------------- */
  // Everything here is off at the Pose defaults (no weight, no "bamboo" prop): the arms are then exactly as before.
  const deg = Math.PI / 180;
  const bounce5 = Math.min(0.032, Math.abs(p.lean) * 0.0028); // = the assembly's squash below
  const wsx = S * (1 + bounce5);
  const wsy = scale * (1 - bounce5);
  const toWorld = (q: [number, number]): XY => ({ x: x + p.bodyX + wsx * q[0], y: y + p.bodyY + wsy * q[1] });
  const fromWorld = (q: XY): [number, number] => [(q.x - x - p.bodyX) / wsx, (q.y - y - p.bodyY) / wsy];
  const armFrame = (far: boolean) => (far ? bowDeg * deg : Rnear);
  const wrap5 = (v: number) => v - 2 * Math.PI * Math.floor((v + Math.PI) / (2 * Math.PI));
  /** The rotation that turns +y toward (dx, dy) (SVG rotate, radians). */
  const angOf = (dx: number, dy: number) => Math.atan2(-dx, dy);
  // head points: an offset from the head centre in the head's own frame (its tilt), placed as head() places the head
  const tilt5 = (headRoll(pHead.headTilt + headTiltIdle + emphasis * 0.5) + bowNeck) * deg;
  const yaw5 = clamp(phi + clamp(pHead.headTurn + headTurnIdle, -1, 1) * 1.15 + bowProfile, -1.45, 1.45);
  const headPt = (ox: number, oy: number): [number, number] => {
    const [hx, hy] = headLocal();
    const cy0 = hy + pHead.headNod + Math.abs(emphasis) * 0.6;
    // the same pivot as head(): toward the neck top for a strong roll
    const pv = lerp(cy0, shY - B.neck + headBreathY, neckPivotW(tilt5 / deg));
    const oy2 = oy + cy0 - pv;
    return toFig(hx + ox * Math.cos(tilt5) - oy2 * Math.sin(tilt5), pv + ox * Math.sin(tilt5) + oy2 * Math.cos(tilt5), Rnear);
  };
  const Rh = B.headR;
  const faceSide: 1 | -1 = yaw5 >= 0 ? 1 : -1;
  const mouthFig = () => headPt(Rh * 0.74 * Math.sin(yaw5), Rh * 0.52);
  // the cheek turned toward the camera (in a three-quarter view: between the nose and the ear)
  const cheekFig = () => headPt(Rh * (0.75 * Math.sin(yaw5) - 0.35 * faceSide * Math.cos(yaw5)), Rh * 0.34);
  /** Forward kinematics of one arm in figure space: shoulder, wrist and the hand's rotation (radians). */
  const fk = (side: 1 | -1, far: boolean, S0: number, E0: number, w0: number) => {
    const R = armFrame(far);
    const r1 = -side * S0 * deg;
    const r2 = -side * E0 * deg;
    const sx0 = side * B.sw * 0.86 * cphi;
    const sy0 = shY + B.limbW;
    const ex = sx0 - Math.sin(r1) * B.ua * armStretch[side];
    const ey = sy0 + Math.cos(r1) * B.ua * armStretch[side];
    const fa = (B.fa - 2) * armStretch[side];
    return {
      sh: toFig(sx0, sy0, R),
      wr: toFig(ex - Math.sin(r1 + r2) * fa, ey + Math.cos(r1 + r2) * fa, R),
      handA: R + r1 + r2 - side * w0 * deg,
    };
  };
  /** The wrist turn (degrees, this rig's convention) that points the hand along the figure-space rotation a. */
  const aimWrist = (side: 1 | -1, far: boolean, S0: number, E0: number, a: number, lim = 95) =>
    clamp((-side * wrap5(a - (armFrame(far) + (-side * S0 - side * E0) * deg))) / deg, -lim, lim);
  const norm2 = (dx: number, dy: number): [number, number] => {
    const n = Math.hypot(dx, dy) || 1;
    return [dx / n, dy / n];
  };
  const reachLen = B.ua + B.fa - 2;
  // the hold point (Pose.hold): the scene's world point, raised toward the near cheek by Pose.cheek
  const holdK = clamp(p.hold);
  let holdFig: [number, number] | null = null;
  if (holdK > 1e-4 || (anchors && holdAt)) {
    const t0 = holdAt ? fromWorld(holdAt(f)) : toFig(frontX + fwd * B.sw * 0.9, shY + B.torsoLen * 0.45, Rnear);
    const ck = cheekFig();
    const k = clamp(p.cheek);
    holdFig = [lerp(t0[0], ck[0], k), lerp(t0[1], ck[1], k)];
  }
  // the bamboo pole (rProp / lProp "bamboo" when the scene supplies no renderer of its own)
  const poleSide: 0 | 1 | -1 = props.bamboo ? 0 : p.rProp === "bamboo" ? 1 : p.lProp === "bamboo" ? -1 : 0;
  const figH = B.thigh + B.shin + B.foot * 0.28 + B.torsoLen + B.neck + B.headR * 2.1;
  const poleLen = poleLength ?? figH * 1.05;
  const tiltP = p.poleTilt * deg * fwd;
  const poleU: [number, number] = [Math.sin(tiltP), -Math.cos(tiltP)]; // up the pole
  const poleN: [number, number] = (() => {
    const a: [number, number] = [-poleU[1], poleU[0]];
    return a[0] * fwd >= 0 ? a : [-a[0], -a[1]];
  })(); // across the pole, toward the facing side: the fist's long axis
  const gripCarry = (B.thigh + B.shin) * 0.8; // grip to the pole's foot while carried
  const fistOff = B.hand * 0.4; // wrist to the middle of the curled fingers
  const e6On = Math.abs(p.swat) + Math.abs(p.shush) + p.hips + p.behind + Math.abs(p.reach) + p.cupHands > 1e-4;
  const e5On = e6On || poleSide !== 0 || Math.abs(p.headHands) + Math.abs(p.scratch) + Math.abs(p.mouthHand) + holdK + Math.abs(p.jab) + Math.abs(p.throwUp) > 1e-4;
  type Arm5 = { S: number; E: number; hand: HandShape; wrist: number; turn?: number };
  const arm5 = (side: 1 | -1, far: boolean, S0: number, E0: number, hand0: HandShape, w0: number): Arm5 => {
    const st: Arm5 = { S: S0, E: E0, hand: hand0, wrist: w0 };
    if (!e5On) return st;
    let best = 0.4;
    const go = (w: number, t: [number, number], pref: ((ex: number, ey: number) => number) | undefined, aim: number | null, shape: HandShape, turn?: number) => {
      if (w <= 1e-4) return;
      const [s2, e2] = solveArm(side, far, t[0], t[1], st.S, st.E, 1, pref);
      st.S = lerp(st.S, s2, w);
      st.E = lerp(st.E, e2, w);
      if (aim !== null) st.wrist = lerp(st.wrist, aimWrist(side, far, st.S, st.E, aim), w);
      if (w >= best) {
        best = w;
        st.hand = shape;
        st.turn = turn;
      }
    };
    const shoulder = fk(side, far, 0, 0, 0).sh;
    const elbowOut = (ex: number, ey: number) => side * ex - 0.5 * ey;
    const elbowLow = (_ex: number, ey: number) => ey;
    // both hands clapped to the sides of the head, fingers up over the temples, elbows out (alarm)
    const hh = clamp(Math.abs(p.headHands));
    if (hh > 1e-4) {
      const [dx, dy] = norm2(-side * 0.35, -1);
      go(hh, headPt(side * Rh * 1.02, Rh * 0.2), elbowOut, angOf(dx, dy), "open", Math.PI);
    }
    // scratching the side of the head: the fingertips work in small irregular strokes on the life clock
    const sc = clamp(Math.abs(p.scratch));
    if (sc > 1e-4 && Math.sign(p.scratch) === side) {
      const t = life * 0.9;
      const wig = Math.sin(t) + 0.35 * Math.sin(t * 2.3 + 1.1);
      const [dx, dy] = norm2(-side * 0.45, -1);
      const tip = headPt(side * Rh * 0.62 + Rh * 0.05 * wig, -Rh * 0.62 + Rh * 0.045 * Math.sin(t * 1.7 + 0.4));
      go(sc, [tip[0] - dx * B.hand * 0.68, tip[1] - dy * B.hand * 0.68], (ex, ey) => side * ex - 0.7 * ey, angOf(dx, dy), "relaxed", Math.PI);
    }
    // fingertips to the mouth
    const mh = clamp(Math.abs(p.mouthHand));
    if (mh > 1e-4 && Math.sign(p.mouthHand) === side) {
      const [dx, dy] = norm2(fwd * 0.2, -1);
      const tip = mouthFig();
      go(mh, [tip[0] - dx * B.hand * 0.66, tip[1] - dy * B.hand * 0.66], elbowLow, angOf(dx, dy), "relaxed");
    }
    // a child's hand held in both of hers: the far hand cups UNDER it (palm up, seen edge-on, the fingers curling up
    // round its little-finger side), the near hand rests over its back; the held hand stays visible between them.
    // Her wrists roll a little as it turns.
    if (holdK > 1e-4 && holdFig) {
      const nearArm = rFar === lFar ? side === 1 : !far;
      const roll = Math.sin(Math.PI * clamp(p.holdTurn));
      if (!nearArm) {
        const [dx, dy] = norm2(fwd, -0.12 - 0.12 * roll);
        const psi = side * fwd * (Math.PI / 2 - 0.3 + 0.2 * roll); // curl toward screen-up = palm up
        // the elbow drops back behind the hand, so the forearm comes in low and level under his hand
        go(holdK, [holdFig[0] - dx * B.hand * 0.4, holdFig[1] - dy * B.hand * 0.4 + B.hand * 0.3], (ex, ey) => -fwd * ex + 0.25 * ey, angOf(dx, dy), "cup", psi);
      } else {
        const [dx, dy] = norm2(fwd, 0.5 + 0.15 * roll);
        go(holdK, [holdFig[0] - dx * B.hand * 0.55, holdFig[1] - dy * B.hand * 0.55 - B.hand * 0.27], undefined, angOf(dx, dy), "relaxed");
      }
    }
    // the jab: the arm shoots out toward PuppetProps.pointAt, index finger leading
    const jb = clamp(Math.abs(p.jab));
    if (jb > 1e-4 && Math.sign(p.jab) === side) {
      const P = pointAt ? fromWorld(pointAt(f)) : ([shoulder[0] + fwd * 200, shoulder[1] - 30] as [number, number]);
      const [dx, dy] = norm2(P[0] - shoulder[0], P[1] - shoulder[1]);
      const pr = clamp(pointReach, 0.55, 0.97);
      go(jb, [shoulder[0] + dx * reachLen * pr, shoulder[1] + dy * reachLen * pr], elbowLow, angOf(dx, dy), "point");
    }
    // the hand flung up, palm open
    const tu = clamp(Math.abs(p.throwUp));
    if (tu > 1e-4 && Math.sign(p.throwUp) === side) {
      const [dx, dy] = norm2(fwd * 0.35, -1);
      const [ax, ay] = norm2(fwd * 0.2, -1);
      go(tu, [shoulder[0] + dx * reachLen * 0.86, shoulder[1] + dy * reachLen * 0.86], (ex, ey) => side * ex + 0.2 * ey, angOf(ax, ay), "open", 0);
    }
    /* ---- Episode 6 ---- */
    if (e6On) {
      // the swat: an open hand swung in an arc about the shoulder, from raised above it to the palm on swatAt
      const sw6 = clamp(Math.abs(p.swat));
      if (sw6 > 1e-4 && Math.sign(p.swat) === side) {
        const hitK = clamp(p.swatHit);
        const T: [number, number] = swatAt ? fromWorld(swatAt(f)) : [shoulder[0] + fwd * reachLen * 0.8, shoulder[1] + reachLen * 0.5];
        const [rx0, ry0] = norm2(-fwd * 0.3, -1);
        const rR = reachLen * 0.78;
        const [cx0, cy0] = norm2(T[0] - shoulder[0], T[1] - shoulder[1]);
        const rC = clamp(Math.hypot(T[0] - shoulder[0], T[1] - shoulder[1]) - B.hand * 0.45, reachLen * 0.3, reachLen * 0.99);
        const a0 = Math.atan2(ry0, rx0);
        const a1 = Math.atan2(cy0, cx0);
        const a = a0 + wrap5(a1 - a0) * hitK;
        const r = lerp(rR, rC, hitK);
        const ux = Math.cos(a);
        const uy = Math.sin(a);
        go(sw6, [shoulder[0] + ux * r, shoulder[1] + uy * r], elbowLow, angOf(ux, uy), "open");
      }
      // "shh": the index finger upright across the lips
      const sh6 = clamp(Math.abs(p.shush));
      if (sh6 > 1e-4 && Math.sign(p.shush) === side) {
        const lips = mouthFig();
        const [dx, dy] = norm2(fwd * 0.12, -1);
        const mid: [number, number] = [lips[0] + fwd * Rh * 0.1, lips[1]];
        go(sh6, [mid[0] - dx * B.hand * 0.62, mid[1] - dy * B.hand * 0.62], elbowLow, angOf(dx, dy), "point");
      }
      // fists on the hips, elbows out
      const hp6 = clamp(p.hips);
      if (hp6 > 1e-4) {
        const H = toFig(side * hwp * 1.0 + frontX * 0.2, hipY - B.torsoLen * 0.08, Rnear);
        const [dx, dy] = norm2(-side * 0.3, 1);
        go(hp6, [H[0] - dx * B.hand * 0.3, H[1] - dy * B.hand * 0.3], elbowOut, angOf(dx, dy), "fist");
      }
      // both hands clasped behind the back (the arms are drawn behind the body: see rFar / lFar)
      const bh6 = clamp(p.behind);
      if (bh6 > 1e-4) {
        const back = toFig(-fwd * hwp * 0.95 * Math.abs(sphi) + side * hwp * 0.35 * cphi, hipY - B.torsoLen * 0.04, Rnear);
        const [dx, dy] = norm2(-fwd * 0.15 * Math.abs(sphi), 1);
        go(bh6, [back[0] - dx * B.hand * 0.35, back[1] - dy * B.hand * 0.35], (ex, ey) => -fwd * ex * Math.abs(sphi) + side * ex * cphi * 0.5 + 0.3 * ey, angOf(dx, dy), "relaxed");
      }
      // one hand to reachAt: palm down (on a shoulder, dropping coins) or palm up (held out, asking)
      const rc6 = clamp(Math.abs(p.reach));
      if (rc6 > 1e-4 && Math.sign(p.reach) === side) {
        const T: [number, number] = reachAt ? fromWorld(reachAt(f)) : [shoulder[0] + fwd * reachLen * 0.85, shoulder[1] + reachLen * 0.3];
        const up = clamp(p.reachUp);
        const [ax, ay] = norm2(T[0] - shoulder[0], T[1] - shoulder[1]);
        const [dx, dy] = norm2(lerp(ax, fwd, up), lerp(ay + 0.35, -0.08, up));
        // reachExact: the curled fingers (not the palm centre) close on T, and the arm stretches (<= 15%) to meet it
        const off = reachExact ? B.hand * 0.3 : B.hand * 0.45;
        if (reachExact) {
          const need = Math.hypot(T[0] - dx * off - shoulder[0], T[1] - dy * off - shoulder[1]);
          armStretch[side] = lerp(1, clamp(need / (reachLen - 0.5), 1, 1.15), rc6);
        }
        go(rc6, [T[0] - dx * off, T[1] - dy * off], elbowLow, angOf(dx, dy), hand0, up > 0.5 ? side * fwd * (Math.PI / 2 - 0.3) : undefined);
      }
      // both hands cupped together, palms up (the boys holding out their palms for a lozenge)
      const cu6 = clamp(p.cupHands);
      if (cu6 > 1e-4) {
        const C: [number, number] = reachAt ? fromWorld(reachAt(f)) : toFig(frontX + fwd * B.sw * 1.05, shY + B.torsoLen * 0.55, Rnear);
        const nearArm = rFar === lFar ? side === 1 : !far;
        const T: [number, number] = nearArm ? [C[0] + fwd * B.hand * 0.08, C[1] + B.hand * 0.04] : [C[0] - fwd * B.hand * 0.22, C[1] - B.hand * 0.06];
        const [dx, dy] = norm2(fwd, -0.12);
        go(cu6, [T[0] - dx * B.hand * 0.4, T[1] - dy * B.hand * 0.4], elbowLow, angOf(dx, dy), "cup", side * fwd * (Math.PI / 2 - 0.3));
      }
    }
    // the bamboo hand: planted (poleDrop) the fist is solved onto the standing pole; the fist always grips across it
    if (side === poleSide) {
      const pd = clamp(p.poleDrop);
      if (pd > 1e-4) {
        const baseX = shoulder[0] + fwd * B.sw * 0.55;
        const gripH = B.thigh + B.shin + B.torsoLen * 0.22;
        const gx = baseX + poleU[0] * gripH;
        const gy = -p.poleLift + poleU[1] * gripH;
        const [s2, e2] = solveArm(side, far, gx - poleN[0] * fistOff, gy - poleN[1] * fistOff, st.S, st.E, 1, (ex, ey) => ey - fwd * ex * 0.5);
        st.S = lerp(st.S, s2, pd);
        st.E = lerp(st.E, e2, pd);
      }
      st.wrist = aimWrist(side, far, st.S, st.E, angOf(poleN[0], poleN[1]));
      st.hand = "hold";
      st.turn = undefined;
    }
    return st;
  };
  const r5 = arm5(1, rFar, rS1, rE1, p.rHand, handAim(1, rFar, rS1, rE1, wristR));
  const l5 = arm5(-1, lFar, lS1, lE1, p.lHand, handAim(-1, lFar, lS1, lE1, wristL));
  // holding a child's hand, the far arm comes forward to cup it: it loses the dark far-side styling by the hold weight
  const farLight = (far: boolean) => (far && holdK > 1e-4 && holdFig ? 1 - holdK : undefined);
  const rDraw = arm(1, r5.S, r5.E, r5.hand, p.rProp, rFar, armR.flex, r5.wrist, r5.turn, farLight(rFar));
  const lDraw = arm(-1, l5.S, l5.E, l5.hand, p.lProp, lFar, armL.flex, l5.wrist, l5.turn, farLight(lFar));
  // the pole itself: through the fist, its foot on the ground when planted and never below it (MOT-07)
  let pole: { grip: [number, number]; base: [number, number]; tip: [number, number] } | null = null;
  if (poleSide !== 0) {
    const a5 = poleSide === 1 ? r5 : l5;
    const g = fk(poleSide, poleSide === 1 ? rFar : lFar, a5.S, a5.E, a5.wrist);
    const grip: [number, number] = [g.wr[0] - Math.sin(g.handA) * fistOff, g.wr[1] + Math.cos(g.handA) * fistOff];
    const cosT = Math.max(0.2, -poleU[1]);
    const toFloor = (0 - grip[1]) / cosT;
    const planted = (-p.poleLift - grip[1]) / cosT;
    const len = clamp(Math.min(lerp(gripCarry, planted, clamp(p.poleDrop)), toFloor), poleLen * 0.12, poleLen * 0.88);
    const base: [number, number] = [grip[0] - poleU[0] * len, grip[1] - poleU[1] * len];
    pole = { grip, base, tip: [base[0] + poleU[0] * poleLen, base[1] + poleU[1] * poleLen] };
  }
  const poleFar = poleSide !== 0 && (poleSide === 1 ? rFar : lFar);
  /** The bamboo: green-brown, knotted, a little thicker at the foot; drawn behind the fist so the fingers wrap it. */
  const poleDraw = (local: boolean) => {
    if (!pole) return null;
    const [bx, by] = local ? toLocal(pole.base[0], pole.base[1], Rnear) : pole.base;
    const rot = (tiltP - (local ? Rnear : 0)) / deg;
    const w0 = B.limbW * 0.62;
    const w1 = B.limbW * 0.5;
    const Lq = poleLen;
    const body = `M ${-w0} 0 L ${-w1} ${-Lq} Q 0 ${-Lq - w1 * 0.5} ${w1} ${-Lq} L ${w0} 0 Q 0 ${w0 * 0.45} ${-w0} 0 Z`;
    const nodes = [0.1, 0.27, 0.44, 0.61, 0.78, 0.94];
    return (
      <g transform={`translate(${bx}, ${by}) rotate(${rot})`}>
        <path d={body} fill="#8c8a45" />
        <path d={`M ${-w0 * 0.55} -2 L ${-w1 * 0.55} ${-Lq + 2}`} stroke="#c2bd72" strokeWidth={w1 * 0.55} strokeLinecap="round" opacity={0.75} />
        <path d={`M ${w0 * 0.6} -2 L ${w1 * 0.6} ${-Lq + 2}`} stroke="#5f5b28" strokeWidth={w1 * 0.6} strokeLinecap="round" opacity={0.7} />
        {nodes.map((k) => {
          const wk = lerp(w0, w1, k) * 1.12;
          const yk = -Lq * k;
          return (
            <g key={k}>
              <path d={`M ${-wk} ${yk} Q 0 ${yk + wk * 0.4} ${wk} ${yk}`} stroke="#545022" strokeWidth={1.6} fill="none" />
              <path d={`M ${-wk * 0.9} ${yk - 2.2} Q 0 ${yk - 2.2 + wk * 0.35} ${wk * 0.9} ${yk - 2.2}`} stroke="#cfc983" strokeWidth={0.9} fill="none" opacity={0.7} />
            </g>
          );
        })}
        <ellipse cx={0} cy={-Lq} rx={w1} ry={w1 * 0.35} fill="#6d6a33" />
      </g>
    );
  };
  if (anchors) {
    const rw = fk(1, rFar, r5.S, r5.E, r5.wrist).wr;
    const lw = fk(-1, lFar, l5.S, l5.E, l5.wrist).wr;
    anchors({
      head: toWorld(headPt(0, 0)),
      cheek: toWorld(cheekFig()),
      mouth: toWorld(mouthFig()),
      rWrist: toWorld(rw),
      lWrist: toWorld(lw),
      hold: holdFig ? toWorld(holdFig) : null,
      poleGrip: pole ? toWorld(pole.grip) : null,
      poleBase: pole ? toWorld(pole.base) : null,
      poleTip: pole ? toWorld(pole.tip) : null,
      feet: legs.map((L) => {
        const gx = L.soleP.x + L.fwdP.x * B.foot * 0.35;
        const lift = footLift(L);
        return { side: L.side, ...toWorld([gx, -lift]), lift: lift * scale };
      }),
    });
  }
  const farT = `translate(${upperX}, ${antY})${bowDeg ? ` rotate(${bowDeg}, 0, ${hipY})` : ""}`;

  // squash with the lean only (a pose shape, story-driven); no periodic bounce: breathing never scales the figure (MOT-20)
  const bounce = Math.min(0.032, Math.abs(p.lean) * 0.0028);
  const sx = S * (1 + bounce);
  const sy = scale * (1 - bounce);
  const celFilter = `${brightness !== 1 ? `brightness(${brightness}) ` : ""}drop-shadow(0 0 1.4px rgba(59,36,28,0.52))`;

  return (
    <g transform={`translate(${x + p.bodyX}, ${y + p.bodyY}) scale(${sx}, ${sy})`} opacity={opacity} style={{ filter: celFilter }}>
      <defs>
        {/* Crisp 2-tone anime cel-shading gradients */}
        <linearGradient id={`${uid}-topg`} x1={kx1} y1="0" x2={kx2} y2="0">
          <stop offset="0%" stopColor={c.topLight} />
          <stop offset="56%" stopColor={c.top} />
          <stop offset="63%" stopColor={c.topShade} />
          <stop offset="100%" stopColor={c.topShade} />
        </linearGradient>
        <linearGradient id={`${uid}-lowg`} x1={kx1} y1="0" x2={kx2} y2="0.4">
          <stop offset="0%" stopColor={lerpColor(c.lowerColor, "#ffffff", 0.25)} />
          <stop offset="56%" stopColor={c.lowerColor} />
          <stop offset="63%" stopColor={c.lowerShade} />
          <stop offset="100%" stopColor={c.lowerShade} />
        </linearGradient>
        <linearGradient id={`${uid}-skin-body`} x1={kx1} y1="0" x2={kx2} y2="0">
          <stop offset="0%" stopColor={c.skinLight} />
          <stop offset="58%" stopColor={c.skin} />
          <stop offset="65%" stopColor={c.skinShade} />
          <stop offset="100%" stopColor={c.skinShade} />
        </linearGradient>
        <linearGradient id={`${uid}-rim`} x1={rx1} y1="0" x2={rx2} y2="0">
          <stop offset="0%" stopColor={rim} stopOpacity={0} />
          <stop offset="78%" stopColor={rim} stopOpacity={0} />
          <stop offset="100%" stopColor={rim} stopOpacity={rimStrength} />
        </linearGradient>
        {c.print && (
          <pattern id={`${uid}-print`} patternUnits="userSpaceOnUse" width={B.sw * 0.3} height={B.sw * 0.3} patternTransform="rotate(8)">
            {(c.print.motif ?? "buti") === "buti" ? (
              <g>
                {[0, 1, 2, 3].map((k) => (
                  <circle key={k} cx={B.sw * (0.075 + 0.028 * Math.cos((k * Math.PI) / 2))} cy={B.sw * (0.075 + 0.028 * Math.sin((k * Math.PI) / 2))} r={B.sw * 0.018} fill={c.print!.color} opacity={0.85} />
                ))}
                <circle cx={B.sw * 0.075} cy={B.sw * 0.075} r={B.sw * 0.012} fill={c.print.color2 ?? c.print.color} />
                <circle cx={B.sw * 0.225} cy={B.sw * 0.225} r={B.sw * 0.014} fill={c.print.color2 ?? c.print.color} opacity={0.8} />
              </g>
            ) : (
              <g>
                <circle cx={B.sw * 0.075} cy={B.sw * 0.075} r={B.sw * 0.022} fill={c.print.color} opacity={0.85} />
                <circle cx={B.sw * 0.225} cy={B.sw * 0.225} r={B.sw * 0.016} fill={c.print.color2 ?? c.print.color} opacity={0.8} />
              </g>
            )}
          </pattern>
        )}
        <radialGradient id={`${uid}-ao`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0b0608" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#0b0608" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={0}
        cy={2}
        rx={B.hw * (crossOn ? 4.3 : seated ? (c.lower === "saree" ? 5.9 : 5.35) : kneelK > 0.35 ? 4.2 : 2.4)}
        ry={B.hw * (crossOn ? 0.95 : seated ? (c.lower === "saree" ? 1.05 : 0.78) : kneelK > 0.35 ? 0.62 : 0.42)}
        fill={`url(#${uid}-ao)`}
      />
      {poleFar && poleDraw(false)}
      {lFar && <g transform={farT}>{lDraw}</g>}
      {rFar && <g transform={farT}>{rDraw}</g>}
      {lowerBody()}
      {crossOn && (
        // the belly / waist between the planted hips and the bending torso (fills the gap as the upper body leans)
        <g transform={`translate(${upperX}, ${antY})`}>
          <path
            d={`M ${-hwp * 1.02} ${pivY - 4} L ${hwp * 1.02} ${pivY - 4} Q ${hwp * 1.12} ${(pivY + hipY) / 2} ${hwp * 1.06} ${hipY - 4} Q 0 ${hipY + 2} ${-hwp * 1.06} ${hipY - 4} Q ${-hwp * 1.12} ${(pivY + hipY) / 2} ${-hwp * 1.02} ${pivY - 4} Z`}
            fill={c.outfit === "bare" ? `url(#${uid}-skin-body)` : `url(#${uid}-topg)`}
          />
          {c.lower === "dhoti" && c.outfit !== "kurta" && (
            <path d={`M ${-hwp * 1.1} ${hipY - 9} Q 0 ${hipY - 2} ${hwp * 1.1} ${hipY - 9} L ${hwp * 1.12} ${hipY - 3} Q 0 ${hipY + 4} ${-hwp * 1.12} ${hipY - 3} Z`} fill={`url(#${uid}-lowg)`} />
          )}
        </g>
      )}
      <g transform={`translate(${upperX}, ${antY}) rotate(${bowDeg ? upperRot + bowDeg : upperRot}, 0, ${pivY})`}>
        {c.outfit === "frock" && skirt("knee")}
        {torso()}
        {scarf()}
        {bag()}
        {pranamCloak()}
        {head()}
        {pole && !poleFar && poleDraw(true)}
        {!lFar && lDraw}
        {!rFar && rDraw}
        {wrap > 0.02 && dom && (
          <g style={{ mixBlendMode: "screen" }} opacity={wrap}>
            <defs>
              <radialGradient id={`${uid}-wrap`}>
                <stop offset="0%" stopColor={dom.l.color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={dom.l.color} stopOpacity={0} />
              </radialGradient>
            </defs>
            {/* wrap light kept to the head's edge so it never washes the face features out */}
            <ellipse cx={rimSide * B.headR * 1.15} cy={shY - B.neck - B.headR * 0.9} rx={B.headR * 0.9} ry={B.headR * 1.3} fill={`url(#${uid}-wrap)`} opacity={0.6} />
            <ellipse cx={rimSide * B.sw * 0.7} cy={shY + B.torsoLen * 0.35} rx={B.sw * 1.1} ry={B.torsoLen * 0.6} fill={`url(#${uid}-wrap)`} />
          </g>
        )}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Adult gestures (Episode 4 on). Pure helpers on the story clock: add their output to a scene's keyed pose.       */
/* ------------------------------------------------------------------ */

/** Soft 0 -> 1 -> 0 envelope over [start, start + dur] with eased ends of `ramp` frames. */
export const gestureEnv = (f: number, start: number, dur: number, ramp = 8) => bump(f, start, dur, Math.min(ramp, dur / 2), Math.min(ramp, dur / 2));

/** A side-to-side oscillation inside the envelope (amp at the peak, `period` frames per full swing). */
export const wobble = (f: number, start: number, dur: number, amp: number, period: number, ramp = 8) =>
  gestureEnv(f, start, dur, ramp) * amp * Math.sin((2 * Math.PI * (f - start)) / period);

/**
 * Head shake ("no", or a grumbling "what has come into our house"): add to headTurn. About 2.5 slow swings in `dur`,
 * a touch of tilt with it (add `headShakeTilt` to headTilt).
 */
export const headShake = (f: number, start: number, dur: number, amp = 0.26, swings = 2.5) => wobble(f, start, dur, amp, dur / swings, 10);
export const headShakeTilt = (f: number, start: number, dur: number, amp = 2.5, swings = 2.5) => wobble(f, start + 3, dur, amp, dur / swings, 10);

/** Small nods ("hun hun"): add to headNod (px, down is positive). `count` dips, `period` frames each. */
export const headNods = (f: number, start: number, count = 2, period = 12, depth = 6) => {
  const u = (f - start) / period;
  if (u <= 0 || u >= count) return 0;
  return depth * Math.pow(Math.sin(Math.PI * (u - Math.floor(u))), 1.5);
};

/** Coaxing open hand (Sundar: "give it to me"): a gentle repeated curl of the forearm toward the body. Add to that arm's elbow (E). */
export const beckon = (f: number, start: number, dur: number, amp = 12, period = 26) =>
  -gestureEnv(f, start, dur, 10) * amp * (0.5 - 0.5 * Math.cos((2 * Math.PI * (f - start)) / period));

/** Arati: the lamp hand circles slowly (clockwise on screen). Add dS and dE to that arm's S and E. */
export const aratiCircle = (f: number, start: number, dur: number, radius = 9, period = 40) => {
  const env = gestureEnv(f, start, dur, 12);
  const a = (2 * Math.PI * (f - start)) / period;
  return { dS: env * radius * Math.sin(a), dE: env * radius * 1.2 * Math.cos(a) };
};

/** Ringing a small hand bell: quick small shakes of the forearm. Add to that arm's elbow (E). */
export const ringBell = (f: number, start: number, dur: number, amp = 5) => wobble(f, start, dur, amp, 5, 3);

/**
 * Offering a flower or sprinkling water ("ete gandhe pushpe"): the hand lifts a little, then flicks forward and down
 * once per `period`. Returns dS / dE for that arm.
 */
export const offerFlick = (f: number, start: number, count = 1, period = 22, amp = 14) => {
  const u = (f - start) / period;
  if (u <= 0 || u >= count) return { dS: 0, dE: 0 };
  const ph = u - Math.floor(u);
  const lift = Math.sin(Math.PI * Math.min(1, ph / 0.6));
  const flick = ph > 0.55 ? Math.sin((Math.PI * (ph - 0.55)) / 0.45) : 0;
  return { dS: amp * (0.6 * lift + 0.5 * flick), dE: -amp * (0.8 * lift - 1.4 * flick) };
};

/**
 * Arm presets (right arm, or both), checked on figures turned about +-0.4 (three-quarter front). Spread into a pose key
 * and adjust per shot. The right arm is the NEAR arm only when bodyTurn < 0; for a figure turned the other way use
 * the same numbers on lS / lE / lHand (the face-touching ones hide behind the head on the far arm).
 */
export const GESTURES = {
  /** Both palms open and turned out at the waist: "what is to be done?" (Harendra, with `headShake`). */
  palmsUp: { rS: 10, rE: 48, lS: 10, lE: 48, rHand: "open", lHand: "open" } as Partial<Pose>,
  /** One open hand held out toward a child, the other relaxed (Sundar; works crouching too). Add `beckon` to rE. */
  coaxHand: { rS: 40, rE: 30, rHand: "open", lS: 8, lE: -40, lHand: "relaxed" } as Partial<Pose>,
  /** A hand raised to quiet the others, palm out (Thakurma: "tora oke jotoi..."). */
  hushHand: { rS: 38, rE: 105, rHand: "abhaya" } as Partial<Pose>,
  /** The priest calling, one hand held out toward the door. */
  callOut: { rS: 70, rE: 18, rHand: "open" } as Partial<Pose>,
  /** Palm raised to the temple and forehead (speechless dismay). */
  palmToForehead: { rS: -100, rE: -130, rHand: "open" } as Partial<Pose>,
  /** Fingers to the mouth (shock). */
  handToMouth: { rS: -45, rE: -125, rHand: "relaxed" } as Partial<Pose>,
};

export interface PranamTiming {
  /** Story frame the pranam starts (she is upright or seated before it). */
  start: number;
  /** Frames to go down onto the knees from the pose before (0 = already kneeling, e.g. at her puja). */
  kneelIn?: number;
  /** Frames to join the hands at the chest (default 14). */
  join?: number;
  /** Frames to bow down until the forehead is near the floor (default 30). */
  down?: number;
  /** Frames held in the bow (default 48). */
  hold?: number;
  /** Frames to rise back to kneeling upright (default 30). */
  up?: number;
  /** Frames after rising to release the hands to the lap (default 16). */
  release?: number;
}

/**
 * A woman's kneeling pranam (Charu after her clay-Shiva puja): she kneels (if not already), joins her hands at the
 * chest, bows down with her forehead near the floor and her joined hands on the floor in front of it, holds, rises,
 * and lowers her hands to her lap. Returns the pose channels for frame f; spread it over the scene's own keys
 * (bodyTurn about 0.85 to face the plate; flip the Puppet to face left). All phases ease in and out; outside
 * [start, end] it returns kneel only (or nothing if kneelIn > 0 and f < start).
 */
export const kneelingPranam = (f: number, t: PranamTiming): Partial<Pose> => {
  const kIn = t.kneelIn ?? 0;
  const join = t.join ?? 14;
  const down = t.down ?? 30;
  const hold = t.hold ?? 48;
  const up = t.up ?? 30;
  const release = t.release ?? 16;
  const t0 = t.start;
  const tJ = t0 + kIn;
  const tD = tJ + join;
  const tH = tD + down;
  const tU = tH + hold;
  const tR = tU + up;
  const kneel = kIn > 0 ? easeIO((f - t0) / kIn) : 1;
  const joinK = easeIO((f - tJ) / join) * (1 - easeIO((f - tR) / release));
  const bow = easeIO((f - tD) / down) * (1 - easeIO((f - tU) / up));
  // hands: resting on the thighs -> joined at the chest (Pose.join); the floor reach during the bow is solved by the Puppet
  const handsJoined = joinK > 0.3;
  return {
    kneel,
    bow,
    join: joinK,
    rS: 4,
    rE: -38,
    lS: -4,
    lE: -38,
    rHand: handsJoined ? "pranam" : "relaxed",
    lHand: handsJoined ? "pranam" : "relaxed",
    lid: 0.15 + 0.6 * Math.max(bow, 0.5 * joinK),
    headTilt: 7 * bow,
    smile: 0.25,
  };
};

/* ------------------------------------------------------------------ */
/* Episode 5 helpers: walks, the bamboo thump, the jab, silent shouts.  */
/* ------------------------------------------------------------------ */

/**
 * EPISODE 5 PEOPLE: poses, gestures and props (all additive; Episodes 1 to 4 never set them)
 *
 * Pose channels (blend like every other body channel; key them with ease "inOut" over 10 to 18 frames):
 *   headHands 0..1      both hands clapped to the head (Binoy's alarm; with `shoutMouth` and GESTURES.handsOnHead)
 *   scratch   -1..1     scratching the head, sign = arm (+ right, - left); strokes run on lifeF (go on in a pause)
 *   mouthHand -1..1     fingertips to the mouth (Binoy's mother at her door: CAST.womanA + GESTURES.handAtMouth)
 *   hold      0..1      both hands on PuppetProps.holdAt's world point (Charu takes Balak's hand)
 *   holdTurn  0..1      0 as taken, 0.5 palm up, 1 turned over (her wrists roll; the child's rig turns its own hand)
 *   cheek     0..1      with hold: the held hand goes up to her near cheek; read PuppetProps.anchors().hold to place
 *                       the child's hand there (render the child after Charu)
 *   jab       -1..1     the arm shoots out toward PuppetProps.pointAt (sign = arm); drive it with `jabPulse`
 *   throwUp   -1..1     one hand flung up, palm open (sign = arm); drive it with `throwUpPulse`
 *   rProp/lProp "bamboo" a bamboo pole in that fist every frame (unless the scene passes its own props.bamboo):
 *     poleTilt (deg, + top toward the facing side), poleDrop (0 carried in the fist, 1 foot planted on the ground,
 *     the arm solved onto the standing pole), poleLift (foot above the ground while planted; `bambooThump` keys it).
 *     The pole never goes below the ground; anchors() gives poleGrip, poleBase (its foot) and poleTip in world px.
 * Cast extras (CastMember): bag (a jhola across the chest), scarf style "gamchha", dhotiLength "hitched".
 * Faces: knitted angry brows are browTilt about -0.8 with brow -0.2 (GESTURES.angryBrows). Agitated breathing is the
 * existing breathRate prop (about 2.0 to 2.5 for Haricharan after the run, 1.6 for Binoy's fright); a relief sigh is
 * the existing `sigh` prop (envelope on the clock passed as f: inside a pause, pass a clock that advances).
 * Actions inside a pause (P3: the cheek, the sigh, the scratch, the bend) need an f that advances: give that Puppet
 * f = the pause's own running frame offset from the story frame, or key them on lifeF.
 */

const cycleSpeed = (o: { speed: number; scale: number; height: number; bodyTurn: number; child?: boolean }) => {
  const leg = (o.child ? 91 : 154) * o.height; // thigh + shin
  // mean speed of a planted foot sweeping back at stride 1: leg * 0.42 (thigh swing) * 0.3 (phase per frame) * 2/pi
  const perStride = leg * 0.42 * 0.3 * (2 / Math.PI) * Math.max(0.25, Math.abs(Math.sin(clamp(o.bodyTurn, -1, 1) * 0.95)));
  return o.speed / Math.max(1e-6, o.scale) / perStride;
};

export interface WalkOpts {
  /** Story frame the walk starts and its length in frames (start to stop). */
  start: number;
  dur: number;
  /** bodyX at the start and at the stop (world px). */
  fromX: number;
  toX: number;
  /** The Puppet's scale and the cast member's height (they set the stride that keeps the feet planted). */
  scale: number;
  height: number;
  /** cast.seed (the rig's leg phase: arms swing and the body bobs on it). */
  seed: number;
  /** Set when the Puppet is drawn flipped. */
  flip?: boolean;
  /** Body turn while walking; default 0.85 toward the travel direction. */
  bodyTurn?: number;
  /** Frames of speeding up and of slowing down (default 10 and 8). A short `stopIn` is a "stop short". */
  startIn?: number;
  stopIn?: number;
  /**
   * "hurry": a quick walk (Charu, Surendra: arms swing a little, slight lean); "run": hurried run-in (Haricharan:
   * strong lean, pumping bent arms); "stomp": a heavy angry walk (shoulders forward, head down, a jolt at each step).
   */
  kind?: "hurry" | "run" | "stomp";
  /** Arm that carries something (the bamboo): it swings only a little. */
  carrySide?: 1 | -1;
  /** Base arm angles the swing rides on (default a relaxed hang). */
  rS?: number;
  rE?: number;
  lS?: number;
  lE?: number;
  child?: boolean;
  /**
   * Put the travel into Pose.bodyX (default false). Leave it false and add walkTravel(f, o).bodyX to the Puppet's
   * `x` instead: Pose.bodyX velocity drives the rig's cloth drag, which at a hurry or a run pulls a veil or a sari
   * end out into a long thin streak behind the figure.
   */
  travelInBodyX?: boolean;
}

/** Travel along x with eased speed up and slow down (trapezoid speed profile): bodyX and the speed in px a frame. */
export const walkTravel = (f: number, o: Pick<WalkOpts, "start" | "dur" | "fromX" | "toX" | "startIn" | "stopIn">) => {
  const a = Math.max(1, o.startIn ?? 10);
  const b = Math.max(1, o.stopIn ?? 8);
  const T = Math.max(a + b + 1, o.dur);
  const D = o.toX - o.fromX;
  const vmax = D / (T - (a + b) / 2);
  const u = clamp(f - o.start, 0, T);
  let pos: number;
  let v: number;
  if (u < a) {
    pos = (vmax * u * u) / (2 * a);
    v = (vmax * u) / a;
  } else if (u < T - b) {
    pos = vmax * (a / 2 + (u - a));
    v = vmax;
  } else {
    const r = T - u;
    pos = D - (vmax * r * r) / (2 * b);
    v = (vmax * r) / b;
  }
  return { bodyX: o.fromX + pos, speed: Math.abs(f - o.start < 0 || f - o.start > T ? 0 : v), moving: f >= o.start && f <= o.start + T };
};

/**
 * A walk in, run in or stomp off as Pose channels for frame f: bodyY (bob), stride (matched to the travel speed so
 * the feet stay planted), bodyTurn, lean, headNod and the arm swing. Move the Puppet itself by walkTravel(f, o).bodyX
 * (add it to `x`), or set travelInBodyX. Spread it over the scene's own keys (and add gestures on top). Before the
 * start and after the stop it returns the standing values.
 * Charu's sari hem lifts over the forward foot by itself in any walk (CHR-05 to CHR-07).
 */
export const walkPose = (f: number, o: WalkOpts): Partial<Pose> => {
  const kind = o.kind ?? "hurry";
  const tr = walkTravel(f, o);
  const dir = Math.sign(o.toX - o.fromX) || 1;
  const turn = o.bodyTurn ?? 0.85 * dir * (o.flip ? -1 : 1);
  const fwdF = Math.sign(turn) || 1; // facing side in figure space
  const vmax = Math.abs(o.toX - o.fromX) / Math.max(1, o.dur - ((o.startIn ?? 10) + (o.stopIn ?? 8)) / 2);
  const k = vmax > 0 ? clamp(tr.speed / vmax) : 0; // 0 standing .. 1 full pace
  const stride = clamp(cycleSpeed({ speed: tr.speed, scale: o.scale, height: o.height, bodyTurn: turn, child: o.child }), 0, kind === "run" ? 1.9 : 1.5);
  const ph = f * 0.3 + o.seed; // = Puppet's leg phase; sin(ph) > 0: the left leg forward
  const phLag = (f - 2) * 0.3 + o.seed; // the shoulders follow the hips
  const P = {
    hurry: { lean: 4, swing: 12, bend: 22, bob: 2.6, nod: 0 },
    run: { lean: 11, swing: 30, bend: 72, bob: 4.5, nod: 1.5 },
    stomp: { lean: 6, swing: 14, bend: 28, bob: 2.2, nod: 4 },
  }[kind];
  // arms swing opposite their own leg; the carrying arm only a little
  const swingOf = (sd: 1 | -1) => {
    const legFwd = sd < 0 ? Math.sin(phLag) : -Math.sin(phLag);
    const amp = P.swing * (o.carrySide === sd ? 0.25 : 1) * k;
    return fwdF * sd * amp * -legFwd;
  };
  const bendOf = (sd: 1 | -1) => fwdF * sd * P.bend * k * (o.carrySide === sd ? 0.3 : 1);
  // the body is highest as the legs pass and lowest at each foot strike; a stomp adds a sharp jolt at the strike
  const strike = Math.pow(Math.sin(ph) * Math.sin(ph), 6);
  const bodyY = -P.bob * k * Math.cos(ph) * Math.cos(ph) + (kind === "stomp" ? 3.2 * k * strike : 0);
  return {
    ...(o.travelInBodyX ? { bodyX: tr.bodyX } : {}),
    bodyY,
    stride,
    bodyTurn: turn,
    lean: fwdF * P.lean * k,
    headNod: P.nod * k + (kind === "stomp" ? 2.5 * k * strike : 0),
    rS: (o.rS ?? 6) + swingOf(1),
    rE: (o.rE ?? -10) + bendOf(1),
    lS: (o.lS ?? 6) + swingOf(-1),
    lE: (o.lE ?? -10) + bendOf(-1),
  };
};

/** Eased turn of the body from one bodyTurn to another (a turn on the spot before walking off: 10 to 16 frames). */
export const turnBody = (f: number, start: number, dur: number, from: number, to: number) => lerp(from, to, easeIO((f - start) / Math.max(1, dur)));

/** Bamboo thump timings (frames from its start): the pole lifts, then strikes the ground at `hit`. */
export const BAMBOO_THUMP = { lift: 9, hit: 13, end: 26 } as const;

/**
 * One thump of the bamboo's foot on the ground (Haricharan's exasperation, AG2). Use with poleDrop = 1. Returns
 * poleLift (set it) and dLean / dY / dS (add them: the body and the pole arm rise with the lift and jolt at the hit).
 * The foot meets the ground on frame start + BAMBOO_THUMP.hit: put the thud and a little dust there.
 */
export const bambooThump = (f: number, start: number) => {
  const u = f - start;
  if (u <= 0 || u >= BAMBOO_THUMP.end) return { poleLift: 0, dLean: 0, dY: 0, dS: 0 };
  const up = easeIO(u / BAMBOO_THUMP.lift); // lift with a little anticipation
  const down = clamp((u - BAMBOO_THUMP.lift) / (BAMBOO_THUMP.hit - BAMBOO_THUMP.lift)); // the strike: fast, accelerating
  const lift = 30 * up * (1 - down * down);
  const after = u > BAMBOO_THUMP.hit ? u - BAMBOO_THUMP.hit : -1;
  const jolt = after >= 0 ? Math.exp(-after / 3) : 0;
  const rebound = after >= 0 ? 4 * Math.sin(Math.PI * clamp(after / 6)) : 0;
  return { poleLift: lift + rebound, dLean: -2 * up * (1 - down) + 2.5 * jolt, dY: -3 * up * (1 - down) + 2.5 * jolt, dS: 10 * up * (1 - down) };
};

/** A jab of the hand toward a point (with Pose.jab and PuppetProps.pointAt): shoots out fast, holds, eases back. */
export const jabPulse = (f: number, start: number, hold = 14, count = 1, gapF = 10) => {
  let v = 0;
  for (let i = 0; i < count; i++) {
    const s0 = start + i * (6 + hold + gapF);
    const u = f - s0;
    if (u <= 0 || u >= 6 + hold + 12) continue;
    const out = u < 6 ? Math.sin((Math.PI / 2) * (u / 6)) * 1.06 : u < 9 ? lerp(1.06, 1, (u - 6) / 3) : 1;
    const back = u > 6 + hold ? easeIO((u - 6 - hold) / 12) : 0;
    v = Math.max(v, Math.min(1.06, out) * (1 - back));
  }
  return Math.min(1, v);
};

/** The free hand flung up in exasperation and dropped: quick up (6 frames), a beat, a slower fall (14 frames). */
export const throwUpPulse = (f: number, start: number, hold = 8) => {
  const u = f - start;
  if (u <= 0 || u >= 6 + hold + 14) return 0;
  return easeIO(u / 6) * (1 - easeIO((u - 6 - hold) / 14));
};

/**
 * A silent shout's mouth (Binoy's "hay hay, gelo gelo": the narrator quotes him, so no lip sync): opens wide over
 * 4 frames, holds with a small irregular working of the jaw, closes over 6. Pass as the Puppet's `mouth`.
 */
export const shoutMouth = (f: number, start: number, dur: number, seed = 1): MouthState => {
  const u = f - start;
  if (u <= 0 || u >= dur) return MOUTH_REST;
  const env = easeIO(u / 4) * (1 - easeIO((u - (dur - 6)) / 6));
  const work = 0.12 * noise1(u / 5, seed) + 0.06 * Math.sin(u * 0.9 + seed);
  return { open: env * clamp(0.82 + work), width: 1 + 0.12 * env, round: 0.25 * env, teeth: 0.45 * env };
};

/** Ready-made Episode 5 expressions and gestures (spread into a pose key; lean presets assume bodyTurn > 0). */
export const GESTURES5 = {
  /** Binoy, watching quietly: a curious head tilt, brows up a little, a hint of a smile. */
  curiousTilt: { headTilt: 9, headTurn: 0.12, brow: 0.45, eyeY: 0.15, smile: 0.32 } as Partial<Pose>,
  /** Binoy's alarm: both hands to the head, brows up and drawn together (add shoutMouth as his mouth). */
  handsOnHead: { headHands: 1, brow: 0.9, browTilt: 0.55, smile: 0, lean: -3 } as Partial<Pose>,
  /** Binoy, puzzled: scratches his head with the right hand, head tipped, one brow worried. */
  scratchHead: { scratch: 1, headTilt: -7, brow: 0.25, browTilt: 0.35, smile: 0.12, eyeY: -0.1 } as Partial<Pose>,
  /** Surendra bends forward to look (with bodyTurn > 0; mirror lean for bodyTurn < 0). */
  bendToLook: { lean: 16, crouch: 0.1, headNod: 5, brow: 0.35, eyeY: 0.45, smile: 0.15 } as Partial<Pose>,
  /** Puzzled, standing (Surendra, after the look): head tipped, brows uneven, mouth flat. */
  puzzled: { headTilt: -6, brow: 0.3, browTilt: 0.3, smile: 0.12 } as Partial<Pose>,
  /** Haricharan's anger: knitted brows, no smile (bluster, not menace). */
  angryBrows: { brow: -0.2, browTilt: -0.85, smile: 0, lid: 0.12 } as Partial<Pose>,
  /** Haricharan standing with the bamboo upright beside him in his right fist. */
  bambooUpright: { rProp: "bamboo", rHand: "hold", poleDrop: 1, poleTilt: 3 } as Partial<Pose>,
  /** Haricharan carrying the bamboo on the run: slanted forward, foot off the ground. */
  bambooCarried: { rProp: "bamboo", rHand: "hold", poleDrop: 0, poleTilt: 22, rS: 22, rE: 55 } as Partial<Pose>,
  /** Binoy's mother at her door: fingertips to her mouth (left hand; use mouthHand: 1 for the right). */
  handAtMouth: { mouthHand: -1, brow: 0.5, browTilt: 0.45, smile: 0 } as Partial<Pose>,
  /** Charu kneeling, both hands round the child's hand (PuppetProps.holdAt); key holdTurn and cheek on top. */
  holdChildHand: { kneel: 1, hold: 1, brow: 0.3, browTilt: 0.4, smile: 0.1, eyeY: 0.35 } as Partial<Pose>,
};

/* ------------------------------------------------------------------ */
/* Episode 6 helpers: the swat, the stamp, scolding, searching, the khadam's clack frames.                        */
/* ------------------------------------------------------------------ */

/**
 * EPISODE 6 PEOPLE: poses, gestures and props (all additive; Episodes 1 to 5 never set them, so they render as before)
 *
 * Pose channels (key them with ease "inOut" over 8 to 16 frames, or drive them with the pulse helpers below):
 *   swat      -1..1  an open hand swung down in an arc onto PuppetProps.swatAt (sign = arm); with
 *   swatHit    0..1  the travel (0 raised above the shoulder, 1 the palm on swatAt). `swatPulse` drives both; the palm
 *                    lands on frame start + SWAT.hit (the slap sound, the younger boy's flinch).
 *   hunch      0..1  shoulders up, head sunk (fright; GESTURES6.frightFreeze, with breathRate about 2.2)
 *   shush     -1..1  index finger upright across the lips (sign = arm; GESTURES6.peekShush)
 *   hips       0..1  both fists on the hips, elbows out (GESTURES6.handsOnHips)
 *   behind     0..1  both hands clasped behind the back, the arms drawn behind the body (GESTURES6.sheepish)
 *   reach     -1..1  one hand to PuppetProps.reachAt (palm centre; sign = arm) with the pose's own hand shape; the
 *                    target must be within arm's reach of the shoulder (B.ua + B.fa, about 0.29 of an adult's height),
 *                    else the arm points at it fully stretched: place the figures (or add lean / crouch) so it is;
 *   reachUp    0..1  0 palm down (a hand on a shoulder, coins dropped into a palm), 1 palm up (held out, asking)
 *   cupHands   0..1  both hands cupped together, palms up, at reachAt (or in front of the chest)
 *   stamp     -1..1  one knee up and the foot back down (sign = leg); `stampPulse`, the foot lands at start + STAMP.hit
 * Reused from earlier episodes: jab + pointAt (scolding finger: drive it with `scoldPulse`), join (pleading palms,
 * GESTURES6.plead), throwUp + headShake (exasperation), hold + holdAt (pressing a note into a seated child's hands:
 * GESTURES6.crouchGive), mouthHand (the whisper), walkPose kind "run" with child: true (running off).
 * Props: PuppetProps.footwear "khadam" (wooden sandals; `walkPlantFrames` / `footPlants` give the clack frames, and
 * anchors().feet each sole's ground point and lift). Cast: CastMember.print (block-printed shirt), scarf style "waist".
 * Arm signs: a figure turned to +x (bodyTurn > 0) shows its LEFT arm (-1) as the near arm (a woman's only past about
 * 0.37); lean > 0 leans toward +x. Mirror the signs for a figure turned the other way.
 */

/**
 * The worn khadam's proportions in foot units (Puppet's B.foot = 31 x height for adults): sole length 1.31, thickness
 * 0.15 (Episode 5's KhadamOne: 26 long, 3 thick). Colours are KhadamOne's (and Ep06Props' KhadamOne/KhadamPair).
 */
export const KHADAM_FOOT = { length: 1.31, thick: 0.15 } as const;

/**
 * Length in world px of the khadam a Puppet wears (footwear "khadam"), so a resting pair drawn beside him (Ep06Props
 * KhadamPair, 52 px long at s = 1) is the same size: KhadamPair s = khadamLengthPx(cast, scale) / 52.
 */
export const khadamLengthPx = (c: Pick<CastMember, "age" | "height">, scale: number) => (c.age === "child" ? 21 : 31) * c.height * KHADAM_FOOT.length * scale;

/** Swat timings (frames from its start): wind-up, the palm lands, held on the back, back to rest. */
export const SWAT = { raise: 8, hit: 12, hold: 17, end: 30 } as const;

/**
 * One swat of an open hand (the elder brother's blow): the arm winds up over the shoulder, swings down fast and the
 * palm lands on PuppetProps.swatAt at frame start + SWAT.hit, rests there a moment, then the arm drops back. Set
 * swat = arm sign * .swat and swatHit = .swatHit; add .dLean (toward the target) to lean.
 */
export const swatPulse = (f: number, start: number) => {
  const u = f - start;
  if (u <= 0 || u >= SWAT.end) return { swat: 0, swatHit: 0, dLean: 0 };
  const w = easeIO(u / SWAT.raise) * (1 - easeIO((u - SWAT.hold) / (SWAT.end - SWAT.hold)));
  const k = clamp((u - SWAT.raise) / (SWAT.hit - SWAT.raise));
  const swatHit = k * k; // accelerating into the hit
  const after = u >= SWAT.hit ? Math.exp(-(u - SWAT.hit) / 4) : 0;
  return { swat: w, swatHit, dLean: -2 * easeIO(u / SWAT.raise) * (1 - k) + 3.5 * k * (1 - easeIO((u - SWAT.hold) / 10)) + after };
};

/** Stamp timings (frames from its start): the knee comes up, the foot lands, settled. */
export const STAMP = { lift: 7, hit: 11, end: 20 } as const;

/**
 * One stamp of a foot (the culprit's temper): set stamp = leg sign * .stamp and add .dY to bodyY (a jolt as the foot
 * lands at start + STAMP.hit: put the thump there).
 */
export const stampPulse = (f: number, start: number) => {
  const u = f - start;
  if (u <= 0 || u >= STAMP.end) return { stamp: 0, dY: 0 };
  const up = easeIO(u / STAMP.lift);
  const down = clamp((u - STAMP.lift) / (STAMP.hit - STAMP.lift));
  const after = u >= STAMP.hit ? u - STAMP.hit : -1;
  return { stamp: up * (1 - down * down), dY: after >= 0 ? 3 * Math.exp(-after / 2.5) : -1.5 * up * (1 - down) };
};

/**
 * Scolding finger (the elder brother's bluster): a weight for Pose.jab (times the arm sign, with "point" coming by
 * itself and PuppetProps.pointAt at the other child's face) that jabs `period` frames apart between about 0.7 and 1.
 */
export const scoldPulse = (f: number, start: number, dur: number, period = 10) => {
  const env = gestureEnv(f, start, dur, 8);
  const pump = 0.5 - 0.5 * Math.cos((2 * Math.PI * (f - start)) / period);
  return env * (0.7 + 0.3 * pump);
};

/**
 * Searching look (the father: "where is he?"): the head turns one way, holds, sweeps to the other side, holds, and
 * comes back, with the eyes leading by 3 frames. Add headTurn and eyeX to the pose. `dir` -1 looks left first.
 */
export const lookAround = (f: number, start: number, dur: number, amp = 0.45, dir: 1 | -1 = -1) => {
  const curve = (t: number) => {
    if (t <= 0 || t >= 1) return 0;
    if (t < 0.14) return -easeIO(t / 0.14);
    if (t < 0.38) return -1;
    if (t < 0.56) return lerp(-1, 1, easeIO((t - 0.38) / 0.18));
    if (t < 0.8) return 1;
    return lerp(1, 0, easeIO((t - 0.8) / 0.2));
  };
  const at = (fr: number) => curve((fr - start) / Math.max(1, dur));
  return { headTurn: -dir * amp * at(f), eyeX: -dir * 0.7 * at(f + 3) };
};

/** Pleading bob (from hiding, palms joined): small quick dips of the head and body. Add to headNod and lean. */
export const pleadBob = (f: number, start: number, dur: number) => ({
  headNod: gestureEnv(f, start, dur, 6) * 2.5 * (0.5 - 0.5 * Math.cos((2 * Math.PI * (f - start)) / 12)),
  lean: wobble(f, start, dur, 1.4, 12, 6),
});

/** The leg model of Puppet (legAnglesBase, standing, no crouch): each sole's depth below the hips, figure px. */
const soleDepths = (c: Pick<CastMember, "age" | "height" | "seed">, stride: number, stamp: number, fr: number) => {
  const child = c.age === "child";
  const thigh = (child ? 47 : 80) * c.height;
  const shin = (child ? 44 : 74) * c.height;
  const phase = fr * 0.3 + c.seed;
  const ab = 0.04;
  const out = { 1: 0, [-1]: 0 } as Record<1 | -1, number>;
  for (const side of [-1, 1] as const) {
    let th = 0.03;
    let kn = 0.05;
    if (stride > 0) {
      const ph = phase + (side > 0 ? Math.PI : 0);
      th += Math.sin(ph) * 0.42 * stride;
      kn += (0.12 + Math.max(0, Math.sin(ph + 1.7)) * 0.9) * stride;
    }
    const sk = clamp(Math.abs(stamp));
    if (sk > 0 && Math.sign(stamp) === side) {
      th += 0.62 * sk;
      kn += 1.15 * sk;
    }
    out[side] = thigh * Math.cos(th) * Math.cos(ab) + shin * Math.cos(th - kn);
  }
  return out;
};

/**
 * The frames on which a foot comes down onto the ground (heel strike; with khadam, the wooden sole's clack): every
 * frame in [from, to] where a sole that was lifted by more than ~0.3% of the leg is back on the ground. Uses the same
 * leg model, leg phase (cast.seed) and pose smoothing (adults) as Puppet, so the frames match the drawn feet to within a
 * frame. `acting` is the Puppet's acting (walkPose spread over the scene's keys; stride and stamp are read).
 */
export const footPlants = (c: Pick<CastMember, "age" | "height" | "seed">, acting: (f: number) => Partial<Pose>, from: number, to: number) => {
  const adult = c.age !== "child";
  const W = BODY_W;
  const r = (W.length - 1) / 2;
  const strideAt = (fr: number) => {
    if (!adult) return acting(fr).stride ?? 0;
    let s0 = 0;
    let w = 0;
    for (let i = -r; i <= r; i++) {
      const v = acting(fr + i).stride ?? 0;
      if (!Number.isFinite(v)) continue;
      s0 += v * W[i + r];
      w += W[i + r];
    }
    return w > 0 ? s0 / w : 0;
  };
  const eps = (adult ? 154 : 91) * c.height * 0.003;
  const lifts = (fr: number) => {
    const d = soleDepths(c, strideAt(fr), acting(fr).stamp ?? 0, fr);
    const g = Math.max(d[1], d[-1]);
    return { 1: g - d[1], [-1]: g - d[-1] } as Record<1 | -1, number>;
  };
  const out: Array<{ f: number; side: 1 | -1 }> = [];
  let prev = lifts(from - 1);
  for (let fr = from; fr <= to; fr++) {
    const cur = lifts(fr);
    for (const side of [-1, 1] as const) if (prev[side] > eps && cur[side] <= eps) out.push({ f: fr, side });
    prev = cur;
  }
  return out;
};

/**
 * The clack frames of a walk made with walkPose (Surendra's khadam: put one clack per frame returned, 0.15 to 0.45).
 * Covers the walk from its start to 4 frames after its stop. Pass the same WalkOpts the Puppet's acting uses.
 */
export const walkPlantFrames = (o: WalkOpts) =>
  footPlants({ age: o.child ? "child" : "adult", height: o.height, seed: o.seed }, (fr) => walkPose(fr, o), o.start, o.start + o.dur + 4);

/** Ready-made Episode 6 gestures and expressions (spread into a pose key; arm signs and leans for bodyTurn > 0). */
export const GESTURES6 = {
  /** The elder brother scolding: knitted brows, chin up, leaning in; add jab: -scoldPulse(...) and pointAt. */
  scold: { brow: -0.15, browTilt: -0.8, smile: 0, lean: 4, headNod: -2, lid: 0.06 } as Partial<Pose>,
  /** Fright freeze at the khadam's clack: hunched, fists drawn up to the chest, eyes wide (breathRate about 2.2). */
  frightFreeze: { hunch: 1, gasp: 0.32, brow: 0.95, browTilt: 0.55, smile: 0, lean: -5, rS: -4, rE: -112, lS: -4, lE: -112, rHand: "fist", lHand: "fist" } as Partial<Pose>,
  /** Peeking out from hiding with a finger to the lips (near hand; leans out toward +x round the wall's edge). */
  peekShush: { lean: 11, headTilt: 8, shush: -1, brow: 0.6, browTilt: 0.6, smile: 0, eyeX: 0.2 } as Partial<Pose>,
  /**
   * Palms joined, pleading ("don't tell"): brows up and drawn together, head tipped; add pleadBob. Use it turned about
   * 0.4 to 0.8 (Pose.join's elbow choice is made for a three-quarter view; near the front the far elbow crosses the
   * chest); the far palm then sits behind the near one, as joined hands read from the side.
   */
  plead: { join: 1, rHand: "pranam", lHand: "pranam", brow: 0.85, browTilt: 0.8, smile: 0.05, headTilt: 6, lean: 3 } as Partial<Pose>,
  /** Sheepish: head down, hands behind the back, a small shy smile, eyes low. */
  sheepish: { behind: 1, headNod: 7, headTilt: -5, eyeY: 0.45, smile: 0.25, brow: 0.3, browTilt: 0.45 } as Partial<Pose>,
  /** The grin before he runs off (a child's face keeps it soft). */
  grin: { smile: 0.95, brow: 0.35, eyeY: 0, headTilt: 4 } as Partial<Pose>,
  /** The father's stern search (add lookAround). */
  searchLook: { brow: 0.15, browTilt: -0.45, smile: 0.05 } as Partial<Pose>,
  /** The father bends toward the child, near hand held out palm up, asking (set reachAt near the child's chest). */
  askBend: { lean: 12, crouch: 0.08, headNod: 3, reach: -1, reachUp: 1, lHand: "open", brow: 0.3, browTilt: -0.25, smile: 0.08, eyeY: 0.4 } as Partial<Pose>,
  /** Exasperated (the unspoken "বোকাটা…"): brows up; add throwUp: throwUpPulse(...) on the far arm and headShake. */
  exasperated: { brow: 0.45, browTilt: 0.45, smile: 0.08, headTilt: -4 } as Partial<Pose>,
  /** The friend crouching to press the note into a seated child's hands (both hands on PuppetProps.holdAt). */
  crouchGive: { crouch: 0.75, hold: 1, lean: 8, eyeY: 0.3, smile: 0.35, browTilt: -0.3 } as Partial<Pose>,
  /** The whisper: leaning in, a hand at the side of the mouth, a sly sideways glance. */
  whisper: { lean: 10, headTilt: 9, mouthHand: -1, smile: 0.42, brow: 0.1, browTilt: -0.3, lid: 0.22, eyeX: -0.45 } as Partial<Pose>,
  /** A sly, lively look (the culprit friend). */
  sly: { smile: 0.5, brow: 0.1, browTilt: -0.35, lid: 0.25, eyeX: -0.4, headTilt: -5 } as Partial<Pose>,
  /** Holding out an open palm, demanding (near hand, palm up; set reachAt or leave it straight out in front). */
  palmOut: { reach: -1, reachUp: 1, lHand: "open", lean: 3, smile: 0.05, brow: -0.1, browTilt: -0.45 } as Partial<Pose>,
  /** Temper before the stamp (add stampPulse). */
  stampTemper: { brow: -0.2, browTilt: -0.85, smile: 0, lean: -2 } as Partial<Pose>,
  /** The friend's dada: fists on the hips, chin up, stern. */
  handsOnHips: { hips: 1, lean: -2, headTilt: 3, browTilt: -0.45, smile: 0.05 } as Partial<Pose>,
  /** A hand laid on another's shoulder (near hand palm down; set reachAt on the shoulder). */
  handOnShoulder: { reach: -1, reachUp: 0, lHand: "open", lean: 3 } as Partial<Pose>,
  /** The boys holding out cupped palms for a lozenge, amazed ("থ"). */
  cuppedPalms: { cupHands: 1, lean: 4, eyeY: 0.3, brow: 0.5, smile: 0.4, gasp: 0.12 } as Partial<Pose>,
  /** The boudi bending to a child, warm. */
  bendToChild: { lean: 14, crouch: 0.12, headNod: 4, headTilt: 6, eyeY: 0.45, smile: 0.45, brow: 0.25 } as Partial<Pose>,
  /** Holding a small paper up beside the face in the near hand (lProp "note": the scene passes props.note). */
  holdUpPaper: { lS: -32, lE: -118, lHand: "hold", lProp: "note", brow: 0.55, smile: 0.3 } as Partial<Pose>,
  /** Placing coins in a child's palm: bent toward him, near hand palm down at reachAt (his palm). */
  placeInPalm: { reach: -1, reachUp: 0, lHand: "relaxed", lean: 16, crouch: 0.22, headNod: 3, eyeY: 0.5, smile: 0.5 } as Partial<Pose>,
};
