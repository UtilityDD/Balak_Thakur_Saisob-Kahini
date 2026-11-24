import React, { useId } from "react";
import { EASE, EaseName, blink, clamp, hash, lerp, noise1, safeId } from "../core/anim";

/**
 * GENTLE COW (গাভী): Episode 2's Ujanchar cow, now able to act (Episode 5 scene 02).
 *
 * The same animal as `Cow` in src/cinematic/sets/UjancharHouse.tsx and src/episode02/scenes/Scene03Goshaap.tsx (and the
 * Episode 4 outro glimpse): a humped Bengal zebu (ANI-04), fawn-brown hide with brown and white patches, hump, dewlap,
 * short horns, a tufted tail. The art (paths, colours, patches, gradient) is copied from there unchanged, so at rest and
 * in side view this rig draws the Episode 2 cow exactly; on top of it the legs, neck, head, jaw, ears, eyelids, tail
 * and dewlap are articulated. No glow (BAL-05). She wears no bell in Episode 2, so none here (`solve.bell` is null).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * Coordinates
 * ---------------------------------------------------------------------------------------------------------------
 *  Drawn in the parent SVG's coordinates (a Remotion <Layer>, or any <svg>). (x, y) is the point on the ground under
 *  the middle of the barrel; hooves stand on y. Local units: withers about 190 above the ground, muzzle tip about 245
 *  ahead of x, tail about 130 behind; s = 1 is about 380 px long. She faces +x; `flip` faces her to -x.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * Props (GentleCowProps)
 * ---------------------------------------------------------------------------------------------------------------
 *  x, y, s, flip       placement (ignored for x / y / s while a `path` is given: the path places her).
 *  f                   story clock: actions, path, tugs, the slow blink and breath-out of "nuzzle".
 *  lifeF               real frame: breathing, blinks, chewing, ear flicks, tail swishes, idle head drift (PIT-03).
 *  action              "idle" | "walk" | "trot" | "graze" | "alarm" | "hidden" | "nuzzle"   (head, ears, eyes, tail)
 *                        idle    standing, head easy, chewing her cud by default.
 *                        walk    head carried a little low, nodding with the front steps.
 *                        trot    head up and forward, ears half forward, tail lifted, quicker breath.
 *                        graze   muzzle to `target` (the vine on the trellis); `tugs` pull it back; `cucumber` in the
 *                                mouth; chewing once a cucumber shows (or `chew`).
 *                        alarm   head throws up (6 frames, a little overshoot), both ears prick forward, the white of
 *                                the eye shows, tail lifts, the body rocks back; quicker breath.
 *                        hidden  the idle for standing out of sight between banana trunks: cud chewing, frequent ear
 *                                flicks and tail swishes (so an ear and the tail alone still read as alive).
 *                        nuzzle  muzzle lowered to `target` (a seated child's raised palm) over 24 frames; a slow blink
 *                                at actionStart + 18; a soft breath out at actionStart + 32 (nostril flare, a tiny
 *                                head dip, the barrel settles). Then she rests there, alive, ears soft.
 *  actionStart         story frame the action began (drives the timed beats above and the blend).
 *  prevAction, prevActionStart   the action being left: the head, ears, eyes, tail and breath blend from it
 *                      (alarm 7 f with overshoot, trot 10 f, nuzzle 24 f, others 16 f). prevActionStart lets the
 *                      leaving action keep its own clock (default actionStart - 60).
 *  path                CowPathKey[] { f, x, y?, s?, ease? }: where she is on the story clock (keys are world
 *                      positions of the ground point; ease of the segment arriving at that key, default "inOut").
 *                      The legs are driven by the DISTANCE travelled along the path, so hooves never slide: each
 *                      hoof stays planted (fixed world point) through its stance and swings to its next footfall.
 *                      Speed decides the gait unless `gait` is set: below about 6 local units/frame a four-beat
 *                      lateral-sequence walk (near hind, near fore, far hind, far fore), above about 10 a trot
 *                      (diagonal pairs), blended in between. A walk at 4 to 5 u/f (s 1: 4 to 5 px/f; a stride every
 *                      24 to 30 frames) is the gentle pace; a trot at 12 to 14 u/f. She starts from her standing stance and settles her feet when she stops.
 *                      Moving deeper into the picture: raise y (up the screen) and shrink s along the path and set
 *                      `turn`; the distance counts y / 0.35 (ground foreshortening).
 *  gait                "auto" (default) | "walk" | "trot".
 *  turn                -1..1 (default 0): 0 side view; +1 three-quarter going AWAY (rear three-quarter, the rump
 *                      and tail toward the camera, the front end rising into depth); -1 three-quarter toward the
 *                      camera (use small values). Key it per frame (she trots off into the grove: 0 -> 1).
 *  target              { x, y } world point for the muzzle in "graze" and "nuzzle" (the scene gives it). The neck
 *                      and head solve to it every frame (two-joint reach with a slightly stretching neck);
 *                      `solve.reachError` says how far it was out of reach (place her so it is about 0).
 *  tugs                story frames at which a pull on the vine starts (graze). Each tug: a 7-frame pull back,
 *                      a 4-frame hold, a 13-frame give. cowTug(f, tugs) gives the same 0..1 for the vine.
 *  cucumber            false | true | 0..1 (opacity): a young cucumber held crosswise in her mouth.
 *  chew                force chewing on (true) or off (false); default per action (idle, hidden: on; graze: on
 *                      while a cucumber shows; others off).
 *  seed                variety for blinks, flicks and swishes when there are several cows (default 7).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * Helpers (all pure, deterministic, cheap; call them with the SAME props you pass the component)
 * ---------------------------------------------------------------------------------------------------------------
 *  solveGentleCow(props) -> GentleCowSolve, world points every frame (for MOT-07 contact):
 *      muzzle (the soft nose pad: where the palm meets her), mouth (where the vine / cucumber is held),
 *      forehead (between the eyes: the stroking hand), bridge (the face between forehead and muzzle), cheek, eye,
 *      poll (the top of the head between the horns), neck (side of the upper neck: the hand strokes down it),
 *      withers, hooves[4] (ground contact points, order: near hind, near fore, far hind, far fore),
 *      contacts[4] (true while that hoof is planted), tug, gait (0 walk .. 1 trot), speed (local u/f),
 *      moving (0..1), reachError (local units), headDeg (head rotation), x / y / s (where she is), bell: null.
 *  cowTug(f, tugs)                  0..1 pull on the vine.
 *  cowPathAt(path, f)               { x, y, s } on the path.
 *  cowHoofContacts(props)           { hooves, contacts } (a lighter call when only the feet matter).
 *  cowGaitHistory(path, s, f, n)    contact rows for the last n frames (footfall diagrams, QA).
 *  COW_LEGS                         leg order / names.
 *
 *  Quick use (scene 02):
 *    const P = { x: 0, y: 0, s: 0.9, f, lifeF, action: "graze", actionStart: 150, target: VINE, tugs: [168, 190],
 *                cucumber: f > 196 } as const;
 *    const cow = solveGentleCow(P);        // cow.mouth -> the vine end, cow.tug -> how far it is pulled
 *    <GentleCow {...P} />
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type V2 = { x: number; y: number };
export type CowAction = "idle" | "walk" | "trot" | "graze" | "alarm" | "hidden" | "nuzzle";
export type CowGait = "auto" | "walk" | "trot";

export interface CowPathKey {
  f: number;
  x: number;
  y?: number;
  s?: number;
  ease?: EaseName;
}

export interface GentleCowProps {
  x?: number;
  y?: number;
  s?: number;
  flip?: boolean;
  f: number;
  lifeF?: number;
  action?: CowAction;
  actionStart?: number;
  prevAction?: CowAction;
  prevActionStart?: number;
  path?: CowPathKey[];
  gait?: CowGait;
  turn?: number;
  target?: V2;
  tugs?: number[];
  cucumber?: boolean | number;
  chew?: boolean;
  seed?: number;
}

export interface GentleCowSolve {
  x: number;
  y: number;
  s: number;
  dir: 1 | -1;
  muzzle: V2;
  mouth: V2;
  forehead: V2;
  bridge: V2;
  cheek: V2;
  eye: V2;
  poll: V2;
  neck: V2;
  withers: V2;
  hooves: [V2, V2, V2, V2];
  contacts: [boolean, boolean, boolean, boolean];
  tug: number;
  gait: number;
  speed: number;
  moving: number;
  reachError: number;
  headDeg: number;
  bell: null;
}

/* ------------------------------------------------------------------ */
/* Art: the Episode 2 cow, unchanged                                   */
/* ------------------------------------------------------------------ */

const COW_HIDE_DARK = "#5f4a3a";
const COW_NEAR = "#7d6349";
const COW_FAR = "#55422f";
const COW_HOOF = "#2e221a";
const COW_WHITE = "#ece4d0";
const COW_BROWN = "#6e4a2e";
const HORN = "#e8dcb6";
const HORN_FAR = "#b3a27a";
const LID = "#a48a6c";
const COW_TORSO =
  "M -120 -160 C -120 -176 -80 -168 -40 -168 C 0 -170 20 -178 50 -186 C 74 -194 96 -180 104 -160 C 112 -140 112 -110 100 -90 C 92 -72 60 -58 20 -56 C -20 -54 -70 -60 -100 -72 C -118 -82 -124 -120 -120 -160 Z";
const COW_HEAD =
  "M 164 -218 C 182 -226 204 -222 214 -210 C 228 -194 238 -170 244 -150 C 248 -136 244 -122 232 -118 C 218 -114 204 -122 190 -140 C 180 -152 170 -180 164 -218 Z";
/** The hump, drawn again on top so it can lag the body bob a touch (follow-through). */
const COW_HUMP = "M 30 -176 C 46 -184 66 -196 84 -190 C 98 -185 104 -172 103 -160 C 88 -167 58 -170 30 -176 Z";

/* ------------------------------------------------------------------ */
/* Small math                                                          */
/* ------------------------------------------------------------------ */

const D2R = Math.PI / 180;
const smooth = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const fract = (v: number) => v - Math.floor(v);
const rot = (p: V2, deg: number): V2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
};
const add = (a: V2, b: V2): V2 => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: V2, b: V2): V2 => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: V2, k: number): V2 => ({ x: a.x * k, y: a.y * k });
const len = (a: V2) => Math.hypot(a.x, a.y);
const angDeg = (a: V2) => Math.atan2(a.y, a.x) / D2R;
const P = (x: number, y: number): V2 => ({ x, y });
const fmt = (p: V2) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

/** Frames since the last of an irregular event stream (gaps minGap..maxGap), its index, and a per-event random. */
const lastEvent = (frame: number, seed: number, minGap: number, maxGap: number) => {
  let t = Math.round(hash(seed * 3.7) * maxGap) - maxGap;
  let i = 0;
  let last = -9999;
  let lastI = -1;
  while (t <= frame && i < 20000) {
    last = t;
    lastI = i;
    t += Math.round(minGap + hash(seed * 17.3 + i * 1.91) * (maxGap - minGap));
    i++;
  }
  return { d: frame - last, i: lastI, r: hash(seed * 5.1 + lastI * 2.3) };
};

/* ------------------------------------------------------------------ */
/* Path and gait simulation                                            */
/* ------------------------------------------------------------------ */

/** Ground foreshortening: a step up the screen covers 1 / 0.35 as much ground. */
const GROUND_K = 0.35;
/** How much the back line rises into depth as she turns away (a camera a little above her). */
const TURN_K = 0.16;

export const cowPathAt = (path: CowPathKey[] | undefined, f: number, fallback?: { x: number; y: number; s: number }) => {
  const fb = fallback ?? { x: 0, y: 0, s: 1 };
  if (!path || path.length === 0) return fb;
  const val = (k: CowPathKey) => ({ x: k.x, y: k.y ?? fb.y, s: k.s ?? fb.s });
  if (f <= path[0].f) return val(path[0]);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (f <= b.f) {
      const t = b.f === a.f ? 1 : EASE[b.ease ?? "inOut"](clamp((f - a.f) / (b.f - a.f)));
      const va = val(a);
      const vb = val(b);
      return { x: lerp(va.x, vb.x, t), y: lerp(va.y, vb.y, t), s: lerp(va.s, vb.s, t) };
    }
  }
  return val(path[path.length - 1]);
};

export const COW_LEGS = [
  { key: "nearHind", hipX: -84, hind: true, near: true, walkOff: 0, trotOff: 0 },
  { key: "nearFore", hipX: 66, hind: false, near: true, walkOff: 0.75, trotOff: 0.5 },
  { key: "farHind", hipX: -62, hind: true, near: false, walkOff: 0.5, trotOff: 0.5 },
  { key: "farFore", hipX: 42, hind: false, near: false, walkOff: 0.25, trotOff: 0 },
] as const;

const HIP_Y = -84;
const FOOT_Y = -9; // fetlock height when planted; the hoof sits below it
const footRest = (i: number) => COW_LEGS[i].hipX + (COW_LEGS[i].hind ? -9 : 0);
const WALK_L = 120;
const TROT_L = 200;
const WALK_DUTY = 0.64;
const TROT_DUTY = 0.42;

interface LegState {
  planted: boolean;
  footD: number;
  fromD: number;
  p: number;
  lastCycle: number;
  lift: number;
}

interface GaitState {
  D: number;
  phi: number;
  g: number;
  speed: number;
  moving: number;
  legs: LegState[];
  phiHist: number[];
  movingHist: number[];
}

/**
 * Steps the gait from the first path key to frame f. Hooves are world-fixed while planted (zero slide by
 * construction); a hoof lifts when its phase enters swing and lands half a stance ahead of the hip.
 */
const simulateGait = (
  path: CowPathKey[] | undefined,
  s0: number,
  f: number,
  gait: CowGait,
  record?: (k: number, st: GaitState) => void,
): GaitState => {
  const st: GaitState = {
    D: 0,
    phi: 0,
    g: gait === "trot" ? 1 : 0,
    speed: 0,
    moving: 0,
    legs: COW_LEGS.map((_, i) => ({ planted: true, footD: footRest(i), fromD: footRest(i), p: 0, lastCycle: -1e9, lift: 0 })),
    phiHist: [],
    movingHist: [],
  };
  if (!path || path.length < 2) {
    record?.(Math.floor(f), st);
    return st;
  }
  const f0 = Math.floor(path[0].f);
  const F = Math.floor(f);
  const fb = { x: 0, y: 0, s: s0 };
  let prev = cowPathAt(path, f0, fb);
  for (let k = f0 + 1; k <= F; k++) {
    const cur = cowPathAt(path, k, fb);
    const sc = Math.max(0.05, (prev.s + cur.s) / 2);
    const dD = Math.hypot(cur.x - prev.x, (cur.y - prev.y) / GROUND_K) / sc;
    prev = cur;
    st.D += dD;
    st.speed = dD;
    const gT = gait === "walk" ? 0 : gait === "trot" ? 1 : smooth((dD - 6) / 4);
    st.g += (gT - st.g) * 0.25;
    const L = lerp(WALK_L, TROT_L, st.g);
    const duty = lerp(WALK_DUTY, TROT_DUTY, st.g);
    st.phi += dD / L;
    st.moving = clamp(dD / 1.2);
    const stride = clamp(dD / 3);
    for (let i = 0; i < 4; i++) {
      const lg = st.legs[i];
      const off = lerp(COW_LEGS[i].walkOff, COW_LEGS[i].trotOff, st.g);
      const ph = st.phi + off;
      const u = fract(ph);
      const cyc = Math.floor(ph);
      const target = st.D + footRest(i) + duty * L * 0.5 * stride;
      if (lg.planted) {
        // lift when this cycle's swing begins (only while she is really moving), or when the hip has run far
        // past a planted hoof (a stop-start safety so no leg is ever left stretched behind)
        const behind = st.D + footRest(i) - lg.footD;
        if ((u >= duty && cyc !== lg.lastCycle && st.moving > 0.05) || (behind > duty * L * 0.75 && st.moving > 0.05)) {
          lg.planted = false;
          lg.fromD = lg.footD;
          lg.p = 0;
          lg.lastCycle = cyc;
        }
      }
      if (!lg.planted) {
        lg.p += Math.max(dD / L / Math.max(0.2, 1 - duty), 1 / 12);
        if (lg.p >= 1) {
          lg.planted = true;
          lg.footD = target;
          lg.lift = 0;
        } else {
          lg.footD = lerp(lg.fromD, target, EASE.inOut(lg.p));
          lg.lift = lerp(14, 24, st.g) * Math.sin(Math.PI * lg.p) * (0.5 + 0.5 * stride);
        }
      }
    }
    if (k > F - 8) {
      st.phiHist.push(st.phi);
      st.movingHist.push(st.moving);
    }
    record?.(k, st);
  }
  return st;
};

/** Contact rows of the last n frames, oldest first: [nearHind, nearFore, farHind, farFore] planted flags. */
export const cowGaitHistory = (path: CowPathKey[], s: number, f: number, n: number, gait: CowGait = "auto") => {
  const rows: Array<{ f: number; contacts: boolean[]; lift: number[] }> = [];
  simulateGait(path, s, f, gait, (k, st) => {
    if (k > f - n) rows.push({ f: k, contacts: st.legs.map((l) => l.planted), lift: st.legs.map((l) => l.lift) });
  });
  return rows;
};

/* ------------------------------------------------------------------ */
/* Tug                                                                 */
/* ------------------------------------------------------------------ */

/** 0..1 pull on the vine: a 7-frame pull back, a 4-frame hold and a 13-frame give, per tug start frame. */
export const cowTug = (f: number, tugs: number[] | undefined) => {
  if (!tugs) return 0;
  let v = 0;
  for (const t of tugs) {
    const d = f - t;
    if (d < 0 || d > 24) continue;
    const a = d < 7 ? EASE.out(d / 7) : d < 11 ? 1 : 1 - EASE.inOut((d - 11) / 13);
    v = Math.max(v, a);
  }
  return v;
};

/* ------------------------------------------------------------------ */
/* Head reach                                                          */
/* ------------------------------------------------------------------ */

/** Neck root inside the shoulder, the head's pivot (in head art), and the muzzle point the reach aims. */
const NECK_ROOT = P(96, -158);
const HEAD_PIVOT = P(172, -196);
const NECK_LEN = len(sub(HEAD_PIVOT, NECK_ROOT));
const ALPHA0 = angDeg(sub(HEAD_PIVOT, NECK_ROOT));
const MUZZLE_ART = P(238, -128);
const MUZ_OFF = sub(MUZZLE_ART, HEAD_PIVOT);
const MUZ_LEN = len(MUZ_OFF);
const MUZ_ANG = angDeg(MUZ_OFF);

interface Reach {
  alpha: number;
  rel: number;
  st: number;
  err: number;
}

/** Two-joint reach: neck angle (with a slight stretch) and head rotation that put the muzzle on T (body local). */
const headReach = (T: V2, prefRel: number): Reach => {
  const v = sub(T, NECK_ROOT);
  const D = Math.max(1e-3, len(v));
  let stv = 1;
  if (D > NECK_LEN + MUZ_LEN * 0.96) stv = (D - MUZ_LEN * 0.96) / NECK_LEN;
  if (D < MUZ_LEN - NECK_LEN * 0.9) stv = (MUZ_LEN - D) / NECK_LEN;
  stv = clamp(stv, 0.8, 1.3);
  const r1 = NECK_LEN * stv;
  const r2 = MUZ_LEN;
  const a = (r1 * r1 - r2 * r2 + D * D) / (2 * D);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const u = mul(v, 1 / D);
  const n = P(-u.y, u.x);
  const base = add(NECK_ROOT, mul(u, a));
  let best: Reach | null = null;
  for (const sg of [1, -1]) {
    const pv = add(base, mul(n, h * sg));
    const alpha = angDeg(sub(pv, NECK_ROOT));
    const headTot = angDeg(sub(T, pv)) - MUZ_ANG;
    let rel = headTot - (alpha - ALPHA0);
    while (rel > 180) rel -= 360;
    while (rel < -180) rel += 360;
    const reach = add(pv, rot(MUZ_OFF, alpha - ALPHA0 + rel));
    const cand = { alpha, rel, st: stv, err: len(sub(reach, T)) };
    if (!best || Math.abs(cand.rel - prefRel) < Math.abs(best.rel - prefRel)) best = cand;
  }
  return best as Reach;
};

/* ------------------------------------------------------------------ */
/* Action parameters                                                   */
/* ------------------------------------------------------------------ */

interface HeadP {
  alpha: number; // neck angle (deg)
  rel: number; // head rotation relative to the neck (deg, + = muzzle down)
  st: number; // neck stretch
  earFwd: number; // 0 relaxed back .. 1 pricked forward
  eyeWide: number;
  chew: number;
  tailUp: number;
  lean: number; // body shift along x (local units)
  fast: number; // quick breath weight
  flare: number; // nostril flare / breath out
  lid: number; // slow-blink closure
  err: number;
}

const BLEND: Record<CowAction, { len: number; ease: EaseName }> = {
  idle: { len: 16, ease: "inOut" },
  walk: { len: 16, ease: "inOut" },
  trot: { len: 10, ease: "inOut" },
  graze: { len: 16, ease: "inOut" },
  alarm: { len: 7, ease: "backOut" },
  hidden: { len: 16, ease: "inOut" },
  nuzzle: { len: 24, ease: "inOut" },
};

const trap = (d: number, up: number, hold: number, down: number) =>
  d < 0 ? 0 : d < up ? smooth(d / up) : d < up + hold ? 1 : 1 - smooth((d - up - hold) / down);

interface ParamCtx {
  lifeF: number;
  tLocal: V2 | null;
  tugs?: number[];
  cucumber: number;
  chew?: boolean;
  seed: number;
}

const actionParams = (action: CowAction, start: number, f: number, c: ParamCtx): HeadP => {
  const L = c.lifeF;
  const drift = 2.6 * Math.sin(L * 0.017 + c.seed) + 2 * noise1(L * 0.012, c.seed + 3);
  const relDrift = 2 * noise1(L * 0.015, c.seed + 9);
  const p: HeadP = {
    alpha: ALPHA0 + drift,
    rel: relDrift,
    st: 1,
    earFwd: 0,
    eyeWide: 0,
    chew: 0,
    tailUp: 0,
    lean: 0,
    fast: 0,
    flare: 0,
    lid: 0,
    err: 0,
  };
  const d = f - start;
  switch (action) {
    case "idle":
      p.chew = c.chew ?? true ? 1 : 0;
      break;
    case "hidden":
      p.alpha = ALPHA0 + 5 + drift * 0.7;
      p.chew = c.chew ?? true ? 1 : 0;
      break;
    case "walk":
      p.alpha = ALPHA0 + 9 + drift * 0.4;
      p.rel = 4 + relDrift * 0.5;
      p.chew = c.chew ? 1 : 0;
      break;
    case "trot":
      p.alpha = ALPHA0 - 5;
      p.rel = -3;
      p.earFwd = 0.35;
      p.tailUp = 0.35;
      p.fast = 1;
      p.chew = c.chew ? 1 : 0;
      break;
    case "alarm": {
      const settle = smooth((d - 24) / 30);
      p.alpha = ALPHA0 - 30 + 6 * settle + drift * 0.3;
      p.rel = -8 + 3 * settle;
      p.earFwd = 1;
      p.eyeWide = 1 - 0.4 * settle;
      p.tailUp = 0.45;
      p.lean = -6 + 3 * settle;
      p.fast = 1;
      p.chew = 0;
      break;
    }
    case "graze":
    case "nuzzle": {
      const graze = action === "graze";
      const tug = graze ? cowTug(f, c.tugs) : 0;
      // the breath out (nuzzle): an in-breath, then a soft snort with the nostrils flaring, a tiny head dip
      const flare = graze ? 0 : trap(d - 32, 5, 5, 18);
      const inhale = graze ? 0 : trap(d - 22, 9, 1, 6);
      if (c.tLocal) {
        const jitter = P(1.2 * noise1(L * 0.02, c.seed + 21), 1.2 * noise1(L * 0.018, c.seed + 23));
        const T = add(add(c.tLocal, jitter), P(-30 * tug, -10 * tug + 4 * flare - 2 * inhale));
        const r = headReach(T, graze ? 18 : 8);
        p.alpha = r.alpha;
        p.rel = r.rel - 6 * tug;
        p.st = r.st;
        p.err = r.err;
      } else {
        p.alpha = ALPHA0 + (graze ? 55 : 30);
        p.rel = graze ? 20 : 10;
      }
      p.lean = -5 * tug + (graze ? 0 : 2);
      p.chew = c.chew ?? (graze && c.cucumber > 0.5) ? 1 : 0;
      p.earFwd = graze ? 0.1 : 0.15;
      p.flare = Math.max(flare, 0.25 * inhale);
      p.lid = graze ? 0 : trap(d - 18, 6, 5, 9);
      break;
    }
  }
  return p;
};

const blendP = (a: HeadP, b: HeadP, u: number): HeadP => {
  const o = { ...b };
  (Object.keys(b) as Array<keyof HeadP>).forEach((k) => {
    o[k] = lerp(a[k], b[k], u);
  });
  return o;
};

/* ------------------------------------------------------------------ */
/* The solve                                                           */
/* ------------------------------------------------------------------ */

interface Internal {
  pub: GentleCowSolve;
  aff: { a: number; b: number };
  sinT: number;
  farShift: number;
  bodyX: number;
  bodyY: number;
  pitch: number;
  humpDy: number;
  hp: HeadP;
  headTot: number;
  pivot: V2;
  neckPath: string;
  dewlap: string;
  dewFold: string;
  legs: Array<{ hip: V2; knee: V2; foot: V2; hind: boolean; near: boolean; lift: number; planted: boolean }>;
  tailA: number;
  tailLag: number;
  earDeg: number;
  lidC: number;
  jawDrop: number;
  jawSide: number;
  cheekPh: number;
  cucumber: number;
  breath: number;
}

const FAR_W = 46; // body width: far legs shift sideways by this much as she turns

const compute = (props: GentleCowProps): Internal => {
  const {
    flip = false,
    f,
    lifeF = f,
    action = "idle",
    actionStart = 0,
    prevAction,
    prevActionStart,
    path,
    gait = "auto",
    turn = 0,
    target,
    tugs,
    cucumber = false,
    chew,
    seed = 7,
  } = props;
  const dir: 1 | -1 = flip ? -1 : 1;
  const place = cowPathAt(path, f, { x: props.x ?? 0, y: props.y ?? 0, s: props.s ?? 1 });
  const X = path && path.length ? place.x : props.x ?? 0;
  const Y = path && path.length ? place.y : props.y ?? 0;
  const S = path && path.length ? place.s : props.s ?? 1;
  const cuc = typeof cucumber === "number" ? clamp(cucumber) : cucumber ? 1 : 0;

  // turn: the body axis rotated in the ground plane, seen from a little above (affine: x' = a x, y' = y + b x)
  const th = clamp(turn, -1, 1) * 55 * D2R;
  const aff = { a: Math.cos(th), b: -Math.sin(th) * TURN_K };
  const sinT = Math.sin(th);
  const farShift = -FAR_W * sinT;
  const affP = (p: V2): V2 => ({ x: aff.a * p.x, y: p.y + aff.b * p.x });
  const affInv = (q: V2): V2 => {
    const x = q.x / aff.a;
    return { x, y: q.y - aff.b * x };
  };
  const toWorld = (q: V2): V2 => ({ x: X + dir * S * q.x, y: Y + S * q.y });

  // gait
  const g = simulateGait(path, S, f, gait);
  const moving = g.moving;
  const bobOf = (phi: number, m: number) => -m * lerp(1.8, 4, g.g) * (0.5 + 0.5 * Math.cos(4 * Math.PI * (phi + 0.1)));
  const bob = bobOf(g.phi, moving);
  const lagI = Math.max(0, g.phiHist.length - 4);
  const bobLag = g.phiHist.length ? bobOf(g.phiHist[lagI], g.movingHist[lagI]) : bob;
  const humpDy = (bobLag - bob) * 0.8;
  const pitch = moving * lerp(0.6, 1.2, g.g) * Math.sin(2 * Math.PI * g.phi);

  // action parameters (blended from the action being left), with a soft follow-through on the head
  const ctxFor = (tl: V2 | null): ParamCtx => ({ lifeF, tLocal: tl, tugs, cucumber: cuc, chew, seed });
  // target in body-local coordinates (the body transform below uses this frame's breath/bob; small enough)
  const tLocal = target
    ? (() => {
        const q = affInv({ x: (target.x - X) / (dir * S), y: (target.y - Y) / S });
        return rot(sub(q, P(0, bob)), -pitch);
      })()
    : null;
  const paramsAt = (ff: number, lf: number): HeadP => {
    const c = { ...ctxFor(tLocal), lifeF: lf };
    const cur = actionParams(action, actionStart, ff, c);
    if (prevAction && prevAction !== action) {
      const bl = BLEND[action];
      const u = clamp((ff - actionStart) / bl.len);
      if (u < 1) {
        const prev = actionParams(prevAction, prevActionStart ?? actionStart - 60, ff, c);
        return blendP(prev, cur, EASE[bl.ease](u));
      }
    }
    return cur;
  };
  const h0 = paramsAt(f, lifeF);
  const h1 = paramsAt(f - 2, lifeF - 2);
  const h2 = paramsAt(f - 4, lifeF - 4);
  const hp = blendP(blendP(h2, h1, 0.6), h0, 0.55);
  hp.err = h0.err;
  hp.lid = h0.lid;

  // walk nod: once per front footfall
  const nod = moving * lerp(4, 2.5, g.g) * Math.sin(4 * Math.PI * g.phi + 0.8);
  const alpha = hp.alpha + nod;
  const headTot = alpha - ALPHA0 + hp.rel;
  const pivot = add(NECK_ROOT, rot(mul(sub(HEAD_PIVOT, NECK_ROOT), hp.st), alpha - ALPHA0));
  const Hx = (p: V2): V2 => add(pivot, rot(sub(p, HEAD_PIVOT), headTot));
  const N = (p: V2, k: number): V2 => add(NECK_ROOT, rot(mul(sub(p, NECK_ROOT), 1 + k * (hp.st - 1)), k * (alpha - ALPHA0)));

  // breath (MOT-20: her own slow, slightly irregular rhythm, quicker in fright; the barrel only)
  const slow = 0.5 + 0.5 * Math.sin((2 * Math.PI * lifeF) / 104 + 0.9 * noise1(lifeF / 90, seed + 1));
  const quick = 0.5 + 0.5 * Math.sin((2 * Math.PI * lifeF) / 38 + 0.6 * noise1(lifeF / 50, seed + 2));
  const breath = lerp(slow, quick, clamp(hp.fast)) - 0.6 * hp.flare;
  const bodyX = hp.lean;
  const bodyY = bob - 1.8 * breath;

  // body-frame point -> screen (cow-local, before the flip/scale) -> world
  const bodyToLocal = (p: V2): V2 => affP(add(rot(p, pitch), P(bodyX, bodyY)));
  const W = (p: V2) => toWorld(bodyToLocal(p));

  // neck: fixed bases on the torso, the head end carried by the head transform (identical to the Ep 2 neck at rest)
  const neckPath = [
    `M 60 -186`,
    `C ${fmt(N(P(110, -200), 0.35))} ${fmt(Hx(P(150, -214)))} ${fmt(Hx(P(178, -216)))}`,
    `L ${fmt(Hx(P(190, -172)))}`,
    `C ${fmt(Hx(P(170, -160)))} ${fmt(N(P(150, -140), 0.7))} ${fmt(N(P(128, -110), 0.5))}`,
    `C ${fmt(N(P(118, -96), 0.2))} 108 -92 100 -92`,
    `L 80 -120 C 66 -150 60 -170 60 -186 Z`,
  ].join(" ");

  // dewlap: top rides the neck, the hanging fold lags behind it and swings with the bob
  const d1 = sub(N(P(120, -128), 0.45), P(120, -128));
  const hLag = (() => {
    const a2 = h2.alpha - ALPHA0;
    const pl = add(NECK_ROOT, rot(mul(sub(P(120, -128), NECK_ROOT), 1 + 0.45 * (h2.st - 1)), 0.45 * a2));
    return sub(pl, P(120, -128));
  })();
  const d2 = add(mul(d1, 0.55), add(mul(sub(hLag, d1), 0.5), P(0, humpDy * 1.6)));
  const dm = (k: number) => add(d1, mul(sub(d2, d1), k));
  const q = (x: number, y: number, k: number) => fmt(add(P(x, y), dm(k)));
  const dewlap = `M ${q(126, -132, 0)} C ${q(134, -112, 0.35)} ${q(120, -92, 0.7)} ${q(110, -66, 1)} C ${q(104, -56, 1)} ${q(92, -60, 1)} ${q(94, -72, 1)} C ${q(100, -96, 0.7)} ${q(108, -116, 0.35)} ${q(112, -130, 0)} Z`;
  const dewFold = `M ${q(116, -128, 0)} C ${q(110, -104, 0.4)} ${q(104, -84, 0.75)} ${q(100, -66, 1)}`;

  // legs: hips ride the body (lean, bob, pitch; not the breath), hooves from the gait, two-bone IK
  const legs = COW_LEGS.map((d, i) => {
    const ls = g.legs[i];
    const hip = add(rot(P(d.hipX, HIP_Y), pitch), P(bodyX, bob));
    const footX = ls.footD - g.D;
    const foot = P(footX, FOOT_Y - ls.lift);
    const L1 = d.hind ? 48.5 : 49;
    const L2 = d.hind ? 29.5 : 27.5;
    const v = sub(foot, hip);
    const D = Math.min(len(v), L1 + L2 - 0.01);
    const u = mul(v, 1 / Math.max(1e-3, len(v)));
    const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D);
    const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const n = P(-u.y, u.x);
    const knee = add(add(hip, mul(u, a)), mul(n, d.hind ? h : -h));
    return { hip, knee, foot, hind: d.hind, near: d.near, lift: ls.lift, planted: ls.planted };
  });

  // tail: gait swing, lifeF swishes (irregular, never a loop), lift in alarm / trot, a lagging tuft
  const tailAt = (lf: number) => {
    const ev = lastEvent(lf, seed + 31, action === "hidden" ? 46 : 60, action === "hidden" ? 110 : 150);
    const on = action === "hidden" || ev.r > 0.3;
    const env = on && ev.d < 44 ? smooth(ev.d / 8) * (1 - smooth((ev.d - 28) / 16)) : 0;
    return 17 * env * Math.sin(ev.d * 0.52) + 2.5 * Math.sin(lf * 0.05 + seed);
  };
  const walkTail = moving * 6 * Math.sin(2 * Math.PI * g.phi - 0.6);
  const tailA = tailAt(lifeF) + walkTail + 22 * hp.tailUp;
  const tailLag = (tailAt(lifeF - 4) - tailAt(lifeF)) * 0.8 - 0.5 * walkTail;

  // ears: action carriage plus quick irregular flicks on lifeF
  const ev = lastEvent(lifeF, seed + 57, 26, 80);
  const flickOn = action === "hidden" || ev.r > 0.45;
  const flick = flickOn && ev.d < 8 ? 26 * Math.sin((Math.PI * ev.d) / 8) * (ev.r > 0.8 && ev.d > 3 ? 0.6 : 1) : 0;
  const earDeg = lerp(-8, 52, clamp(hp.earFwd)) + 4 * Math.sin(lifeF * 0.09 + seed) * (1 - hp.earFwd) + flick * (1 - 0.6 * hp.earFwd);

  // eyelids: life blinks plus the slow blink
  const lidC = Math.max(blink(lifeF, seed + 4), hp.lid);

  // chewing (cud or cucumber): the jaw drops and grinds sideways, with small irregular pauses
  const chewAmp = clamp(hp.chew) * (0.7 + 0.3 * noise1(lifeF * 0.03, seed + 11));
  const cph = (2 * Math.PI * lifeF) / 20;
  const jawDrop = chewAmp * 2.8 * (0.5 - 0.5 * Math.cos(cph));
  const jawSide = chewAmp * 1.5 * Math.sin(cph);

  const tug = action === "graze" ? cowTug(f, tugs) : 0;

  const hooves = legs.map((l) => {
    const local = affP(P(l.foot.x, -l.lift));
    return toWorld(l.near ? local : add(local, P(farShift, 0)));
  }) as [V2, V2, V2, V2];

  const pub: GentleCowSolve = {
    x: X,
    y: Y,
    s: S,
    dir,
    muzzle: W(Hx(P(237, -132))),
    mouth: W(Hx(P(238, -121 + jawDrop * 0.5))),
    forehead: W(Hx(P(221, -187))),
    bridge: W(Hx(P(234, -160))),
    cheek: W(Hx(P(199, -160))),
    eye: W(Hx(P(206, -190))),
    poll: W(Hx(P(184, -220))),
    neck: W(N(P(126, -150), 0.5)),
    withers: W(P(66, -192)),
    hooves,
    contacts: legs.map((l) => l.planted) as [boolean, boolean, boolean, boolean],
    tug,
    gait: g.g,
    speed: g.speed,
    moving,
    reachError: hp.err,
    headDeg: headTot,
    bell: null,
  };

  return {
    pub,
    aff,
    sinT,
    farShift,
    bodyX,
    bodyY,
    pitch,
    humpDy,
    hp,
    headTot,
    pivot,
    neckPath,
    dewlap,
    dewFold,
    legs,
    tailA,
    tailLag,
    earDeg,
    lidC,
    jawDrop,
    jawSide,
    cheekPh: cph,
    cucumber: cuc,
    breath,
  };
};

/** World points, contacts, tug and gait for this frame (same props as the component). */
export const solveGentleCow = (props: GentleCowProps): GentleCowSolve => compute(props).pub;

/** Just the hooves (world ground-contact points) and whether each is planted. Order: COW_LEGS. */
export const cowHoofContacts = (props: GentleCowProps) => {
  const s = compute(props).pub;
  return { hooves: s.hooves, contacts: s.contacts };
};

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

const Leg: React.FC<{ hip: V2; knee: V2; foot: V2; hind: boolean; col: string }> = ({ hip, knee, foot, hind, col }) => {
  const dv = sub(foot, knee);
  const dl = Math.max(1e-3, len(dv));
  const hoof = add(foot, mul(dv, 5 / dl));
  const hoofDeg = angDeg(dv) - 90;
  return (
    <g>
      <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} stroke={col} strokeWidth={hind ? 22 : 24} strokeLinecap="round" />
      <circle cx={knee.x} cy={knee.y} r={hind ? 7 : 8} fill={col} />
      <line x1={knee.x} y1={knee.y} x2={foot.x} y2={foot.y} stroke={col} strokeWidth={12} strokeLinecap="round" />
      <ellipse cx={hoof.x} cy={hoof.y} rx={8} ry={4.2} fill={COW_HOOF} transform={`rotate(${hoofDeg.toFixed(2)} ${hoof.x.toFixed(2)} ${hoof.y.toFixed(2)})`} />
    </g>
  );
};

const Tail: React.FC<{ a: number; lag: number; opacity?: number }> = ({ a, lag, opacity = 1 }) => {
  const p0 = P(-118, -160);
  const p1 = add(p0, rot(P(-9, 55), a));
  const p2 = add(p1, rot(P(-4, 55), a + lag));
  const c1 = add(p0, rot(P(-16, 30), a));
  const c2 = add(p1, rot(P(-4, 26), a + lag * 0.6));
  const tuftDeg = a + lag;
  return (
    <g opacity={opacity}>
      <path d={`M ${fmt(p0)} Q ${fmt(c1)} ${fmt(p1)} Q ${fmt(c2)} ${fmt(p2)}`} stroke={COW_HIDE_DARK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <g transform={`translate(${fmt(p2)}) rotate(${tuftDeg.toFixed(2)})`}>
        <path d="M 0 -4 C -9 6 -10 20 -1 32 C 7 24 9 6 0 -4 Z" fill={COW_HOOF} />
      </g>
    </g>
  );
};

export const GentleCow: React.FC<GentleCowProps> = (props) => {
  const uid = safeId(useId());
  const c = compute(props);
  const { pub, aff, legs, hp } = c;
  const matrix = `matrix(${aff.a.toFixed(4)} ${aff.b.toFixed(4)} 0 1 0 0)`;
  const bodyT = `${matrix} translate(${c.bodyX.toFixed(2)} ${c.bodyY.toFixed(2)}) rotate(${c.pitch.toFixed(3)})`;
  const headT = `translate(${fmt(c.pivot)}) rotate(${c.headTot.toFixed(2)}) translate(${-HEAD_PIVOT.x} ${-HEAD_PIVOT.y})`;
  const away = smooth((c.sinT - 0.12) / 0.35);
  // three-quarter away: the rear face shows; the haunches widen past the end of the barrel (drawn in body space,
  // under the torso, so the same gradient joins them without a seam) and the tail hangs from its middle
  const wR = (FAR_W * c.sinT) / Math.max(0.3, aff.a);
  const rumpX = -116 - wR * 0.5;
  const grad = `${uid}-grad`;
  const flare = clamp(hp.flare);
  const eyeR = 1 + 0.12 * hp.eyeWide;
  const jd = c.jawDrop;
  const js = c.jawSide;

  return (
    <g transform={`translate(${pub.x.toFixed(2)}, ${pub.y.toFixed(2)}) scale(${(pub.dir * pub.s).toFixed(4)}, ${pub.s.toFixed(4)})`}>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1={0} y1={-196} x2={0} y2={-54}>
          <stop offset={0} stopColor="#d2bea0" />
          <stop offset={0.5} stopColor="#a68b6d" />
          <stop offset={1} stopColor="#5a4536" />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <path d={COW_TORSO} />
          <path d={c.neckPath} />
        </clipPath>
        <clipPath id={`${uid}-hump`}>
          <path d={COW_HUMP} />
        </clipPath>
        <clipPath id={`${uid}-head`}>
          <path d={COW_HEAD} />
        </clipPath>
        <clipPath id={`${uid}-eye`}>
          <ellipse cx={206} cy={-190} rx={6.4 * eyeR} ry={5.8 * eyeR} />
        </clipPath>
      </defs>

      {/* ground shadow under the hooves (in the ground plane, so it turns with her) */}
      <ellipse cx={0} cy={0} rx={176} ry={11} fill="#2a1a0c" opacity={0.32} transform={matrix} />

      {/* tail (side view), behind the legs and body as in Episode 2 */}
      {away < 1 && (
        <g transform={bodyT}>
          <Tail a={c.tailA} lag={c.tailLag} opacity={1 - away} />
        </g>
      )}

      {/* far legs (they slide out to the side as she turns) */}
      <g transform={`translate(${c.farShift.toFixed(2)} 0) ${matrix}`}>
        {legs.filter((l) => !l.near).map((l, i) => (
          <Leg key={`far${i}`} hip={l.hip} knee={l.knee} foot={l.foot} hind={l.hind} col={COW_FAR} />
        ))}
      </g>
      {/* near legs: their tops are hidden under the belly */}
      <g transform={matrix}>
        {legs.filter((l) => l.near).map((l, i) => (
          <Leg key={`near${i}`} hip={l.hip} knee={l.knee} foot={l.foot} hind={l.hind} col={COW_NEAR} />
        ))}
      </g>

      <g transform={bodyT}>
        {away > 0 && (
          <g opacity={away}>
            <ellipse cx={rumpX} cy={-124} rx={12 + wR * 0.55} ry={52} fill={`url(#${grad})`} />
            <ellipse cx={rumpX - wR * 0.2} cy={-122} rx={8 + wR * 0.3} ry={44} fill="#3e2e23" opacity={0.1} />
          </g>
        )}
        <path d={COW_TORSO} fill={`url(#${grad})`} />
        <path d={c.neckPath} fill={`url(#${grad})`} />
        <g clipPath={`url(#${uid}-clip)`}>
          <ellipse cx={-42} cy={-150} rx={50} ry={20} fill={COW_BROWN} opacity={0.85} transform="rotate(-6 -42 -150)" />
          <ellipse cx={66} cy={-176} rx={30} ry={14} fill="#7a5233" opacity={0.7} />
          <ellipse cx={-104} cy={-126} rx={26} ry={28} fill={COW_BROWN} opacity={0.8} />
          <ellipse cx={92} cy={-150} rx={18} ry={12} fill={COW_BROWN} opacity={0.6} />
          <ellipse cx={-6} cy={-98} rx={44} ry={20} fill={COW_WHITE} opacity={0.92} />
          <ellipse cx={-76} cy={-104} rx={20} ry={16} fill={COW_WHITE} opacity={0.8} />
          <ellipse cx={4} cy={-56} rx={118} ry={22} fill="#2a1d14" opacity={0.38} />
          <ellipse cx={-6} cy={-178} rx={100} ry={10} fill="#fff4dc" opacity={0.16} />
        </g>
        {/* the hump lags the bob by a touch */}
        <g transform={`translate(0 ${(-c.humpDy).toFixed(2)})`}>
          <path d={COW_HUMP} fill={`url(#${grad})`} />
          <g clipPath={`url(#${uid}-hump)`}>
            <ellipse cx={66} cy={-176} rx={30} ry={14} fill="#7a5233" opacity={0.7} />
            <ellipse cx={-6} cy={-178} rx={100} ry={10} fill="#fff4dc" opacity={0.16} />
          </g>
        </g>
        <path d={c.dewlap} fill={COW_HIDE_DARK} opacity={0.9} />
        <path d={c.dewFold} stroke="#3e2e23" strokeWidth={1} fill="none" opacity={0.5} />
        {away > 0 && (
          <g opacity={away}>
            <path d={`M ${(rumpX + 2).toFixed(2)} -160 Q ${(rumpX - 1).toFixed(2)} -124 ${(rumpX + 2).toFixed(2)} -84`} stroke="#3e2e23" strokeWidth={1.2} fill="none" opacity={0.3} />
            <g transform={`translate(${(rumpX + 118).toFixed(2)} 2)`}>
              <Tail a={c.tailA * 0.35 - 6} lag={c.tailLag} />
            </g>
          </g>
        )}

        {/* head */}
        <g transform={headT}>
          <path d="M 186 -220 C 186 -230 192 -236 200 -238 C 198 -231 198 -226 199 -218 Z" fill={HORN_FAR} />
          {/* far ear, only when the ears prick forward (alarm) */}
          {hp.earFwd > 0.3 && (
            <g transform={`translate(182, -214) rotate(${(c.earDeg + 10).toFixed(2)})`} opacity={clamp((hp.earFwd - 0.3) / 0.4)}>
              <path d="M 0 0 C -18 -10 -36 -8 -46 2 C -34 9 -16 11 0 6 Z" fill="#4c3a2d" />
            </g>
          )}
          <path d="M 172 -214 C 168 -226 172 -234 182 -238 C 181 -230 181 -222 184 -212 Z" fill={HORN} />
          <g transform={`translate(170, -206) rotate(${c.earDeg.toFixed(2)})`}>
            <path d="M 0 0 C -18 -10 -38 -8 -50 2 C -36 10 -16 12 0 6 Z" fill={COW_HIDE_DARK} />
            <path d="M -4 1 C -16 -3 -30 -2 -40 3 C -28 6 -14 7 -4 4 Z" fill="#c49a80" opacity={0.7} />
          </g>
          {/* lower jaw: shows under the face as she chews */}
          <ellipse cx={226 + js} cy={-121 + jd} rx={13} ry={6} fill="#6d553f" />
          <path d={COW_HEAD} fill={`url(#${grad})`} />
          <g clipPath={`url(#${uid}-head)`}>
            <ellipse cx={222} cy={-172} rx={6} ry={16} fill={COW_WHITE} opacity={0.8} transform="rotate(18 222 -172)" />
            {/* the cheek muscle working with the chew */}
            {hp.chew > 0.02 && (
              <ellipse cx={200 + 1.2 * Math.cos(c.cheekPh)} cy={-158 + 1.4 * Math.sin(c.cheekPh)} rx={11} ry={8} fill="#fff4dc" opacity={0.1 * clamp(hp.chew)} />
            )}
          </g>
          <ellipse cx={236} cy={-132} rx={11 + 0.8 * flare} ry={14 + 0.6 * flare} fill="#b98d7a" />
          <ellipse cx={243} cy={-140} rx={2.2 + 1.1 * flare} ry={2.2 + 0.6 * flare} fill="#4a3026" />
          <path d={`M 226 ${-122 + jd * 0.6} Q ${236 + js * 0.5} ${-117 + jd} 244 ${-124 + jd * 0.4}`} stroke="#5a3e32" strokeWidth={1.2} fill="none" opacity={0.6} />
          {/* a young cucumber held crosswise in the mouth */}
          {c.cucumber > 0.01 && (
            <g opacity={c.cucumber} transform={`translate(${(239 + js * 0.6).toFixed(2)} ${(-120 + jd * 0.7).toFixed(2)}) rotate(28)`}>
              <ellipse cx={8} cy={0} rx={19} ry={5.6} fill="#5f8a36" />
              <ellipse cx={9} cy={-1.8} rx={15} ry={2} fill="#9cc25e" opacity={0.6} />
              <circle cx={1} cy={1.5} r={0.9} fill="#3f6224" />
              <circle cx={9} cy={2.4} r={0.9} fill="#3f6224" />
              <circle cx={17} cy={1.2} r={0.9} fill="#3f6224" />
              <ellipse cx={26} cy={0} rx={2.4} ry={4.4} fill="#e9efc4" />
              <path d="M -10 0 C -14 -3 -16 -6 -15 -9" stroke="#d6b648" strokeWidth={1.4} fill="none" />
            </g>
          )}
          <ellipse cx={204} cy={-196} rx={9} ry={3} fill={COW_HIDE_DARK} opacity={0.4} />
          {hp.eyeWide > 0.02 && <ellipse cx={206} cy={-190} rx={6.2 * eyeR} ry={5.4 * eyeR} fill="#efe6d2" opacity={clamp(hp.eyeWide)} />}
          <ellipse cx={206} cy={-190} rx={4.6} ry={4} fill="#1a110c" />
          <circle cx={207.4} cy={-191.4} r={1.2} fill="#ffffff" opacity={0.85 * (1 - c.lidC)} />
          {c.lidC > 0.02 && (
            <g clipPath={`url(#${uid}-eye)`}>
              <rect x={198} y={-197} width={16} height={12.5 * c.lidC} fill={LID} />
              <path d={`M 199 ${(-197 + 12.5 * c.lidC).toFixed(2)} Q 206 ${(-195 + 12.5 * c.lidC).toFixed(2)} 213 ${(-197 + 12.5 * c.lidC).toFixed(2)}`} stroke="#3e2e23" strokeWidth={1} fill="none" opacity={0.6} />
            </g>
          )}
        </g>
      </g>

    </g>
  );
};
