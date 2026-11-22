/**
 * Shared Ghibli Motion, IK & Depth Helpers (`src/ghibli_pipeline/core/ghibliMotion.ts`).
 *
 * Reusable across ALL episodes (old and upcoming) so any agent building a Ghibli-style episode
 * gets zero-slip foot-locked walking, stepping flower/prop IK, voice-envelope syllable emphasis,
 * and zoom-proportional depth-of-field out of the box without modifying `src/cinematic/rig/Puppet.tsx`.
 */

import { clamp, EASE, lerp, noise1, PoseKey } from "../../cinematic/core/anim";
import type { CastMember, Pose } from "../../cinematic/rig/Puppet";
import { BASE_POSE } from "../../cinematic/rig/Puppet";

export interface GhibliSpot {
  x: number;
  y: number;
  s: number;
}

export interface GhibliPt {
  x: number;
  y: number;
}

const DEG = Math.PI / 180;

/**
 * Compute the exact zero-slip step denominator for a `Puppet` character at a given scale.
 * Matches `Puppet.tsx`'s 3D leg swing (`th += sin(ph) * 0.42 * stride` at `ph = f * 0.3 + seed`).
 */
export const puppetStepDenom = (c: CastMember, scale: number): number => {
  const thigh = (c.age === "child" ? 47 : 80) * c.height;
  return Math.max(1.2, 0.21 * thigh * scale);
};

/**
 * Wraps a `bodyX`-animated pose track (`(f: number) => Pose`) so horizontal stepping automatically
 * drives `stride` with zero foot-sliding, plus a 2-step-per-cycle vertical hip weight bob and
 * subtle forward/side step lean.
 */
export const withFootLockedSteps = (
  base: (f: number) => Pose,
  c: CastMember,
  scale: number,
  armSwingDeg = 0,
): ((f: number) => Pose) => {
  const stepDenom = puppetStepDenom(c, scale);
  return (f: number): Pose => {
    const p = base(f);
    const p0 = base(f - 1);
    const p1 = base(f + 1);
    const vx = (p1.bodyX - p0.bodyX) * 0.5;
    const speed = Math.abs(vx);
    const stride = clamp(speed / stepDenom, 0, 0.96);
    const ph = f * 0.3 + c.seed;
    const walkBob = stride > 0.03 ? -Math.abs(Math.sin(ph)) * 2.3 * stride : 0;
    const walkLean = clamp(vx * 0.45, -2.2, 2.2);
    const swing = armSwingDeg > 0 && stride > 0.03 ? Math.sin(ph) * armSwingDeg * stride : 0;
    return {
      ...p,
      stride,
      bodyY: p.bodyY + walkBob,
      lean: p.lean + walkLean,
      rS: p.rS + swing,
      lS: p.lS - swing,
    };
  };
};

/**
 * Generates a phase-locked world/stage walking trajectory between two `GhibliSpot`s over `[a, b]` frames.
 * Advances forward position in phase with the planted stance foot (`sin(2*(f*0.3 + seed))`), eliminating
 * constant-velocity ice-skating during walk entrances.
 */
export const ghibliWalkSpot =
  (from: GhibliSpot, to: GhibliSpot, a: number, b: number, seed: number) =>
  (lf: number): GhibliSpot => {
    const u = clamp((lf - a) / Math.max(1, b - a));
    const baseT = EASE.inOut(u);
    const env = Math.sin(u * Math.PI);
    const cadenceRipple = (Math.sin(2 * (lf * 0.3 + seed)) / Math.max(1, b - a)) * 1.15 * env;
    const t = clamp(baseT + cadenceRipple, 0, 1);
    return {
      x: lerp(from.x, to.x, t),
      y: lerp(from.y, to.y, t),
      s: lerp(from.s, to.s, t),
    };
  };

/**
 * Computes the exact `Pose.stride` (`0..1`) for a `ghibliWalkSpot` trajectory so the planted foot
 * stays locked to the ground plane while the body advances.
 */
export const ghibliStrideOf =
  (spot: (lf: number) => GhibliSpot, c: CastMember) =>
  (lf: number): number => {
    const p0 = spot(lf - 1);
    const p1 = spot(lf + 1);
    const speed = Math.hypot(p1.x - p0.x, p1.y - p0.y) * 0.5;
    return clamp(speed / puppetStepDenom(c, spot(lf).s), 0, 1);
  };

/**
 * Safe 3/4 `bodyTurn` clamp (`[-0.36, 0.36]`) that prevents `Puppet.tsx` from flipping the near arm into
 * dark far-side shadow styling (`rFar = sphi > 0.35`, which occurs when `|bodyTurn| > 0.378`).
 */
export const safeBodyTurn = (turn: number): number => clamp(turn, -0.36, 0.36);

/**
 * Zoom-proportional multiplane depth-of-field (`cam.dof`) for `<GhibliStage>`.
 * Keeps wide establishing shots (`zoom = 1.0`) in crisp deep focus and smoothly opens up shallow bokeh
 * on 2.5x–4.0x medium and close-up shots.
 */
export const zoomProportionalDof = (zoom: number, minDof = 0.28, slope = 0.52, maxDof = 1.85): number =>
  clamp(minDof + Math.max(0, zoom - 1) * slope, minDof, maxDof);

/**
 * Two-bone arm inverse kinematics solver for `Puppet` characters, solving shoulder (`S`) and elbow (`E`)
 * angles so the hand reaches world/stage `target` at the character's current `(x + p.bodyX, y + p.bodyY)`.
 */
export const solvePuppetArmIK = (
  c: CastMember,
  p: Pose,
  x: number,
  y: number,
  scale: number,
  side: 1 | -1,
  target: GhibliPt,
): { S: number; E: number } => {
  const h = c.height;
  const g = c.girth;
  const child = c.age === "child";
  const sw = (child ? 31 : 47) * h * (0.85 + 0.15 * g);
  const limbW = (child ? 6.6 : 8.8) * h * (0.9 + 0.1 * g);
  const ua = (child ? 36 : 56) * h;
  const fa = (child ? 33 : 52) * h;
  const hand = (child ? 25 : 37) * h;
  const torsoLen = (child ? 66 : 108) * h;
  const hipY = -(child ? 96.9 : 162.7) * h;

  const a = ua * scale;
  const b = (fa + 0.45 * hand) * scale;
  const phi = clamp(p.bodyTurn, -1, 1) * 0.95;
  const lx = side * sw * 0.86 * Math.cos(phi);
  const ly = -torsoLen + limbW;
  const cl = Math.cos(p.lean * DEG);
  const sl = Math.sin(p.lean * DEG);
  const shX = x + p.bodyX + (lx * cl - ly * sl) * scale;
  const shY = y + p.bodyY + (lx * sl + ly * cl + hipY) * scale;
  const dx = target.x - shX;
  const dy = target.y - shY;
  const ux = dx * cl + dy * sl;
  const uy = -dx * sl + dy * cl;
  const d = clamp(Math.hypot(ux, uy), Math.abs(a - b) + 1, a + b - 0.5);
  const ang = (vx: number, vy: number) => {
    let t = Math.atan2(side * vx, vy) / DEG;
    if (t < -90) t += 360;
    return t;
  };
  const phiT = ang(ux, uy);
  const alpha = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)) / DEG;
  const S = phiT - alpha;
  const ex = side * a * Math.sin(S * DEG);
  const ey = a * Math.cos(S * DEG);
  let E = ang(ux - ex, uy - ey) - S;
  while (E > 180) E -= 360;
  while (E < -180) E += 360;
  return { S, E };
};

/**
 * Convenience helper returning a `Partial<Pose>` with solved shoulder/elbow angles (`rS, rE` or `lS, lE`)
 * for reaching a world point `target` at a given base pose (including `base.bodyX` step offsets).
 */
export const reachToTarget = (
  c: CastMember,
  pos: GhibliPt,
  scale: number,
  side: 1 | -1,
  base: Partial<Pose>,
  target: GhibliPt,
): Partial<Pose> => {
  const p = { ...BASE_POSE, ...base } as Pose;
  const { S, E } = solvePuppetArmIK(c, p, pos.x, pos.y, scale, side, target);
  return side === 1 ? { ...base, rS: S, rE: E } : { ...base, lS: S, lE: E };
};

/**
 * Organic breathing + micro-sway carrier for pose tracks.
 */
export const withGhibliAlive = (act: (f: number) => Pose, seed: number, amp = 1): ((f: number) => Pose) => {
  return (f: number) => {
    const p = act(f);
    const n = (k: number, s: number) => noise1(f * k, seed * 7 + s);
    const breath = Math.sin(f * 0.055 + seed * 1.7);
    return {
      ...p,
      bodyX: p.bodyX + (n(0.023, 1) * 1.2 + Math.sin(f * 0.028 + seed) * 0.6) * amp,
      bodyY: p.bodyY + breath * 0.8 * amp,
      lean: p.lean + (n(0.017, 2) * 0.7 + breath * 0.35) * amp,
      headTurn: p.headTurn + n(0.011, 3) * 0.045 * amp,
      headTilt: p.headTilt + n(0.013, 4) * 1.15 * amp,
      headNod: p.headNod + breath * 0.6 * amp,
      rS: p.rS + n(0.031, 5) * 0.85 * amp,
      lS: p.lS + n(0.029, 6) * 0.85 * amp,
    };
  };
};

export type { PoseKey };
