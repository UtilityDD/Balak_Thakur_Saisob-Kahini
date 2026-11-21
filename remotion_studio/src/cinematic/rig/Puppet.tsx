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
  dhotiLength?: "knee" | "calf";
  scarf?: { color: string; shade: string; trim?: string; style: "drape" | "neck" | "shawl" | "check" };
  mustache?: string;
  glasses?: boolean;
  tilak?: boolean;
  sindoor?: boolean;
  bindi?: boolean;
  paita?: boolean;
  wiry?: boolean;
  ribbon?: string;
  face?: Partial<FaceShape>;
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
  const body = Math.abs(q.lean) / 3 + q.crouch + Math.abs(q.headTurn) / 0.5 + Math.abs(q.headNod) / 4 + Math.abs(q.headTilt) / 4;
  const emotion = Math.max(q.tears, q.gasp) * 2;
  const moving = Math.abs(q.stride) * 2;
  return clamp(Math.max(reach, elbow, back, hands, body, emotion, moving));
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
const BODY_KEYS: NumKey[] = ["lean", "bodyX", "bodyY", "bodyTurn", "crouch", "headTurn", "headTilt", "headNod", "rS", "rE", "lS", "lE", "stride", "rBack", "lBack"];
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
}) => {
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
  const shift = seated ? 0 : idle * 3 * wNow;
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
  const hipX = B.hw * 0.48;
  const phase = f * 0.3 + c.seed;
  const stride = p.stride;
  const crouch = clamp(p.crouch);
  const nearSide: 1 | -1 = sphi > 0.05 ? -1 : 1; // leg nearer the camera
  // `plant`: the stance-leg model (no swing knee flick). Scenes match their travel speed to it, so a foot placed with
  // it stays fixed on the floor through the stance and moves smoothly forward through the swing.
  const legAngles = (side: 1 | -1, plant = false) => {
    if (seated) return { th: 1.42, ab: 0.95, kn: 2.7 };
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
  };
  const rotY = (v: V3): { x: number; y: number; z: number } => ({ x: v[0] * cphi + v[2] * sphi, y: v[1], z: -v[0] * sphi + v[2] * cphi });
  const legGeo = (side: 1 | -1, plant = false) => {
    const { th, ab: abRaw, kn } = legAngles(side, plant);
    // the hip moves with the weight shift; abduction compensates so the foot stays planted
    const ab = abRaw - (shift * side) / (B.thigh + 0.3 * B.shin);
    const hip: V3 = [side * hipX + shift, 0, 0];
    const tdir: V3 = [Math.sin(ab) * side, Math.cos(th) * Math.cos(ab), Math.sin(th) * Math.cos(ab)];
    const knee = add3(hip, mul3(tdir, B.thigh));
    const sp = th - kn;
    const sdir: V3 = [Math.sin(ab) * side * (seated ? -1.2 : 0.3), Math.cos(sp), Math.sin(sp)];
    const ankle = add3(knee, mul3(sdir, B.shin));
    let fv: V3 = [0, 0, 1];
    if (seated) fv = [-side * 0.9, 0, 0.45];
    else if (sp < -1.0) fv = [0, 0.25, -1];
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
    };
  };
  const legs = [legGeo(-1), legGeo(1)];
  const ground = Math.max(...legs.map((l) => l.lowest));
  const hipY = -ground; // hips relative to the ground (feet at y = 0)
  const legsSorted = [...legs].sort((a, b) => a.z - b.z); // far first

  // Bare feet below the sari: standing and walking only (kneeling, squatting and sitting keep the covered look).
  const sareeFeet = c.lower === "saree" && !seated && crouch < 0.45;
  const feetK = sareeFeet ? clamp(1 - crouch / 0.3) : 0; // how far the hem takes its raised, foot-revealing line
  const walkK = clamp(stride) * feetK; // step articulation (heel strike, toe-off, hem lift)
  const plantLegs = sareeFeet && stride > 0 ? [legGeo(-1, true), legGeo(1, true)] : legs;

  const shY = hipY - B.torsoLen - breath.chest;
  // the head rides the shoulders minus the part of the breath it does not take (it follows by a fraction, later)
  const headBreathY = breath.chest - breath.head;
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
    return (
      <g key={`leg${L.side}`}>
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
      </g>
    );
  };

  const dhoti = () => {
    const yy = (v: number) => v + hipY;
    const hemK = c.dhotiLength === "knee" ? 0.12 : 0.55;
    const panels = legsSorted.map((L) => {
      const hx = lerp(L.knee.x, L.ankle.x, hemK);
      const hy = yy(lerp(L.knee.y, L.ankle.y, hemK));
      const top: [number, number] = [L.hip.x, yy(L.hip.y) - 6];
      const flare = legW2 * (seated ? 2.4 : 2.05);
      const pts: Array<[number, number]> = [
        [top[0] - legW1 * 1.5, top[1]],
        [top[0] + legW1 * 1.5, top[1]],
        [L.knee.x - legW1 * 1.35, yy(L.knee.y)],
        [L.knee.x + legW1 * 1.35, yy(L.knee.y)],
        [hx - flare, hy],
        [hx + flare, hy],
      ];
      const d = smoothPath(hull(pts), 1);
      return (
        <g key={`dh${L.side}`}>
          <path d={d} fill={`url(#${uid}-lowg)`} />
          <path d={d} fill={`url(#${uid}-rim)`} />
          <path d={`M ${hx - flare} ${hy - 2} L ${hx + flare} ${hy - 2}`} stroke={c.lowerTrim ?? c.lowerShade} strokeWidth={c.lowerTrim ? 3 : 1.6} strokeLinecap="round" />
          <path d={`M ${top[0]} ${top[1] + 10} Q ${L.knee.x + clothSway * 0.3} ${yy(L.knee.y) - 10} ${hx + clothSway * 0.4} ${hy - 4}`} stroke={c.lowerShade} strokeWidth={1.6} fill="none" opacity={0.6} />
        </g>
      );
    });
    // waist + crotch bridge
    const waistY = hipY - 8;
    const crotchY = hipY + B.thigh * 0.32;
    const bridge = `M ${-hwp * 1.08} ${waistY} L ${hwp * 1.08} ${waistY} L ${hwp * 0.6} ${crotchY} L ${-hwp * 0.6} ${crotchY} Z`;
    // front pleats (kochi)
    const kx = frontX * 0.7 - B.hw * 0.12;
    const kLen = Math.max(20, Math.min(...legs.map((L) => yy(L.knee.y))) - waistY + 14);
    return (
      <g>
        {panels[0]}
        <path d={bridge} transform={`translate(${shift}, 0)`} fill={`url(#${uid}-lowg)`} />
        {panels[1]}
        {!seated && (
          <g transform={`translate(${kx}, ${waistY + 4}) rotate(${clothSway * 0.8})`}>
            <path d={`M -8 0 L 8 0 L 14 ${kLen} L -12 ${kLen + 4} Z`} fill={c.lowerColor} />
            {[-6, -1, 4, 9].map((px) => (
              <path key={px} d={`M ${px * 0.5} 4 L ${px} ${kLen}`} stroke={c.lowerShade} strokeWidth={1.3} opacity={0.75} />
            ))}
            {c.lowerTrim && <path d={`M -12 ${kLen + 4} L 14 ${kLen}`} stroke={c.lowerTrim} strokeWidth={3} />}
          </g>
        )}
        <path d={`M ${-hwp * 1.1} ${waistY + 2} Q 0 ${waistY + 8} ${hwp * 1.1} ${waistY + 2}`} transform={`translate(${shift}, 0)`} stroke={c.lowerShade} strokeWidth={4} fill="none" opacity={0.65} />
      </g>
    );
  };

  /* ---------------- sari: the hem and its border follow the cloth ---------------- */
  // 0 = hanging cloth (standing, walking), 1 = cloth draped on the floor (kneeling, sitting)
  const drapeK = c.lower === "saree" ? (seated ? 1 : clamp((crouch - 0.35) / 0.4)) : 0;
  const sareeSkirt = () => {
    const yy = (v: number) => v + hipY;
    const waistY = hipY - 10;
    const pts: Array<[number, number]> = [
      [-hwp * 1.05, waistY],
      [hwp * 1.05, waistY],
    ];
    const footHems: Array<{ x: number; y: number; r: number }> = [];
    for (const L of legs) {
      const m = legW1 * 1.5;
      pts.push([L.knee.x - m, yy(L.knee.y)], [L.knee.x + m, yy(L.knee.y)]);
      if (drapeK > 0) {
        // seated / kneeling: the cloth rises over the thigh and wraps round the knee in a soft mound (the lap)
        const ky = yy(L.knee.y);
        const mx = lerp(L.hip.x, L.knee.x, 0.55);
        const my = yy(lerp(L.hip.y, L.knee.y, 0.55));
        const up = legW1 * 1.25 * drapeK;
        pts.push([L.knee.x, ky - up], [L.knee.x - m * 0.75, ky - up * 0.75], [L.knee.x + m * 0.75, ky - up * 0.75], [mx, my - up * 1.05]);
      }
      const fx = (L.toeTip.x + L.heelL.x) / 2;
      const oy = yy(L.ankle.y) + 4;
      const ft = feetMap?.get(L.side);
      if (ft && feetK > 0) {
        // raised hem over the bare foot: lifts and sways with each stride (blends back to the covering hem as she crouches)
        const hy = lerp(oy, ft.hemY, feetK);
        const x1 = lerp(fx - m * 1.35, ft.hemX - hemR, feetK);
        const x2 = lerp(fx + m * 1.35, ft.hemX + hemR, feetK);
        pts.push([x1, hy], [x2, hy]);
        footHems.push({ x: (x1 + x2) / 2, y: hy, r: Math.max(1, (x2 - x1) / 2) });
      } else {
        pts.push([fx - m * 1.35, oy], [fx + m * 1.35, oy]);
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
    const roundK = B.foot * lerp(0.07, 0.1, drapeK); // the hem wraps round the body: its sides sit a little higher
    const foldUp = B.foot * (0.06 + 0.04 * walkK); // hanging folds lift the edge in soft scallops
    const foldFloor = B.foot * 0.09; // folds lying on the floor ripple both ways
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
        drapeK * B.foot * 0.16 * (1 - u * u) + // spread on the floor towards the camera
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

  const lowerBody = () => (
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
          {legsSorted.map((L) => drawLeg(L, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
        </>
      ) : (
        <>
          {legsSorted.map((L) => drawLeg(L, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
          {dhoti()}
        </>
      )}
    </g>
  );

  /* ---------------- torso ---------------- */
  const torso = () => {
    const hemY =
      seated || c.outfit === "frock"
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

  /* ---------------- arms ---------------- */
  const arm = (side: 1 | -1, S: number, E: number, shape: HandShape, propId: string, back: boolean, extraFlex: number, wrist = 0) => {
    const sx = side * B.sw * 0.86 * cphi;
    const rot1 = -side * S;
    const rot2 = -side * E;
    const sleeveCol = c.outfit === "kurta" || c.outfit === "blouse" || c.outfit === "frock" ? c.top : null;
    const upperSleeve = sleeveCol && c.sleeve !== "none";
    const foreSleeve = sleeveCol && (c.sleeve === "full" || c.sleeve === "rolled");
    const foreSleeveLen = c.sleeve === "full" ? 0.84 : 0.42;
    const upperLen = c.sleeve === "half" ? 0.78 : 1.05;
    const slim = (female ? 0.88 : 1) * (c.wiry ? 0.9 : 1);
    const fitted = c.outfit === "blouse" || c.outfit === "frock"; // blouse sleeves hug the arm
    const L = B.limbW * slim;
    const PropR = propId ? props[propId] : undefined;
    const skin = back ? c.skinShade : c.skin;
    const bend = clamp(Math.abs(E) / 120); // elbow flexion 0..1
    const inner = -Math.sign(rot2 || 1); // side of the arm the elbow folds toward
    const sleeveFill = `url(#${uid}-topg)`;
    // sleeve tube with a flared opening at `len`
    const sleeve = (len: number, wTop: number, wEnd: number) => (
      <g>
        <path d={seg(len, wTop, (wTop + wEnd) / 2 * 1.04, wEnd, 0.4)} fill={sleeveFill} />
        <ellipse cx={0} cy={len} rx={wEnd} ry={wEnd * 0.32} fill={c.topShade} opacity={0.9} />
        <path d={`M ${-wTop * 0.3} ${len * 0.15} Q ${wTop * 0.2} ${len * 0.55} ${-wEnd * 0.2} ${len * 0.92}`} stroke={c.topShade} strokeWidth={1.4} fill="none" opacity={0.5} />
      </g>
    );
    return (
      <g transform={`translate(${sx}, ${shY + B.limbW}) rotate(${rot1})`} style={back ? { filter: "brightness(0.85)" } : undefined}>
        {/* upper arm: deltoid → biceps → elbow */}
        <path d={seg(B.ua, L * 1.25, L * 1.1, L * 0.86, 0.3)} fill={skin} />
        {upperSleeve && sleeve(B.ua * upperLen, L * (fitted ? 1.38 : 1.75), c.sleeve === "half" ? L * (fitted ? 1.22 : 1.6) : L * 1.3)}
        {/* shoulder cap merges the arm into the torso */}
        <circle cx={0} cy={0} r={L * (upperSleeve ? (fitted ? 1.38 : 1.7) : 1.3)} fill={upperSleeve ? sleeveFill : skin} />
        <g transform={`translate(0, ${B.ua}) rotate(${rot2})`}>
          {/* forearm: swell below the elbow → narrow wrist */}
          <path d={seg(B.fa, L * 0.9, L * 1.0, L * 0.6, 0.25)} fill={skin} />
          <path d={seg(B.fa * 0.8, L * 0.35, L * 0.4, L * 0.22, 0.25)} fill={c.skinShade} opacity={0.22} transform={`translate(${side * L * 0.45}, 0)`} />
          {foreSleeve && (
            <g>
              {sleeve(B.fa * foreSleeveLen, L * 1.45, c.sleeve === "full" ? L * 1.0 : L * 1.25)}
              {c.sleeve === "rolled" && (
                <g>
                  <rect x={-L * 1.4} y={B.fa * foreSleeveLen - L * 0.75} width={L * 2.8} height={L * 1.2} rx={L * 0.55} fill={c.topLight} />
                  <path d={`M ${-L * 1.3} ${B.fa * foreSleeveLen - L * 0.15} L ${L * 1.3} ${B.fa * foreSleeveLen - L * 0.15}`} stroke={c.topShade} strokeWidth={1.1} opacity={0.6} />
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
          <g transform={`translate(0, ${B.fa - 2})${PropR ? "" : ` rotate(${-side * wrist})`}`}>
            <Hand shape={shape} L={B.hand} skin={skin} shade={c.skinShade} side={side} flex={noise1(life * 0.04, c.seed + side) * 0.5 + 0.5 + extraFlex} />
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
    const yaw = clamp(phi + clamp(ph.headTurn + headTurnIdle, -1, 1) * 1.15, -1.45, 1.45);
    return (
      <g transform={`translate(${sphi * B.sw * 0.12}, ${cy + ph.headNod + Math.abs(emphasis) * 0.6}) rotate(${ph.headTilt + headTiltIdle + emphasis * 0.5})`}>
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
  const rFar = p.rBack > 0.5 || (sphi > 0.25 && !female) || sphi > 0.35;
  const lFar = p.lBack > 0.5 || sphi < -0.35;
  const rDraw = arm(1, p.rS + armR.dS, elbowR + armR.dE, p.rHand, p.rProp, rFar, armR.flex, wristR);
  const lDraw = arm(-1, p.lS + armL.dS, elbowL + armL.dE, p.lHand, p.lProp, lFar, armL.flex, wristL);
  const upperX = weightX + antX;

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
        <radialGradient id={`${uid}-ao`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0b0608" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#0b0608" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={2} rx={B.hw * (seated ? 3.4 : 2.4)} ry={B.hw * 0.42} fill={`url(#${uid}-ao)`} />
      {lFar && <g transform={`translate(${upperX}, ${antY})`}>{lDraw}</g>}
      {rFar && <g transform={`translate(${upperX}, ${antY})`}>{rDraw}</g>}
      {lowerBody()}
      <g transform={`translate(${upperX}, ${antY}) rotate(${p.lean + tiltIdle + antLean}, 0, ${hipY})`}>
        {c.outfit === "frock" && skirt("knee")}
        {torso()}
        {scarf()}
        {head()}
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
