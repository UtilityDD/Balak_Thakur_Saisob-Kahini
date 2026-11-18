/**
 * Core animation math for the cinematic layer.
 * Everything is deterministic in `frame` so Remotion can render any frame in isolation.
 */

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const TAU = Math.PI * 2;

export type EaseName = "inOut" | "out" | "in" | "linear" | "backOut" | "snap";

export const EASE: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  // overshoot + settle: gives poses "snap" and weight
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  snap: (t) => 1 - Math.pow(1 - t, 5),
};

/** Deterministic hash noise in [0,1). */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

/** Smooth 1D value noise in [-1,1]. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 57.3), hash(i + 1 + seed * 57.3), u) * 2 - 1;
};

/** Numeric keyframe track: [[frame, value], ...] with per-segment easing. */
export const track = (
  frame: number,
  keys: Array<[number, number, EaseName?]>,
): number => {
  if (keys.length === 0) return 0;
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1, e] = keys[i + 1];
    if (frame <= f1) {
      const t = f1 === f0 ? 1 : (frame - f0) / (f1 - f0);
      return lerp(v0, v1, EASE[e ?? "inOut"](clamp(t)));
    }
  }
  return keys[keys.length - 1][1];
};

/** 0→1→0 window with soft edges. */
export const windowed = (frame: number, a: number, b: number, fade = 8) =>
  clamp((frame - a) / fade) * clamp((b - frame) / fade);

/** Organic flame flicker around 1.0 */
export const flicker = (frame: number, seed = 0) =>
  0.86 +
  0.08 * Math.sin(frame * 0.9 + seed * 3.1) +
  0.05 * Math.sin(frame * 2.37 + seed * 7.7) +
  0.05 * noise1(frame * 0.35, seed);

/** Natural blink: returns 0 (open) .. 1 (closed). 3–4.6s irregular intervals, ~5 frame blink. */
export const blink = (frame: number, seed: number) => {
  const fr = Math.floor(frame);
  let t = (seed * 37) % 40;
  let i = 0;
  let last = -999;
  let lastI = 0;
  while (t <= fr && i < 5000) {
    last = t;
    lastI = i;
    t += Math.round(72 + hash(seed * 13 + i) * 40);
    i++;
  }
  const d = fr - Math.round(last);
  if (d >= 0 && d < 6) return [0.45, 1, 1, 0.65, 0.25, 0][d];
  // occasional double blink
  if (hash(seed + lastI) > 0.8 && d >= 8 && d < 13) return [0.5, 1, 0.8, 0.35, 0][d - 8];
  return 0;
};

/** Small eye saccades: discrete gaze jumps held for ~1-2s. */
export const saccade = (frame: number, seed: number) => {
  const seg = Math.floor((frame + seed * 11) / 34);
  return {
    x: (hash(seg * 3.1 + seed) - 0.5) * 0.35,
    y: (hash(seg * 7.7 + seed) - 0.5) * 0.18,
  };
};

/** Pose interpolation: keys inherit previous values; numbers ease, strings switch. */
/** `in` = transition length in frames: the move starts at (f - in) and ARRIVES at f, holding before that (pose-to-pose). */
export type PoseKey<P> = { f: number; ease?: EaseName; in?: number } & Partial<P>;

export function makeActing<P extends object>(base: P, keys: PoseKey<P>[]): (frame: number) => P {
  type R = Record<string, unknown>;
  const sorted = [...keys].sort((a, b) => a.f - b.f);
  const states: Array<{ f: number; ease: EaseName; inDur: number; p: R }> = [];
  let cur: R = { ...(base as R) };
  for (const k of sorted) {
    const { f, ease, in: inDur, ...rest } = k as PoseKey<P> & R;
    cur = { ...cur, ...(rest as R) };
    states.push({ f, ease: ease ?? "inOut", inDur: (inDur as number | undefined) ?? 10, p: { ...cur } });
  }
  return (frame: number) => {
    if (states.length === 0) return base;
    if (frame <= states[0].f) return states[0].p as P;
    for (let i = 0; i < states.length - 1; i++) {
      const a = states[i];
      const b = states[i + 1];
      if (frame <= b.f) {
        const start = Math.max(a.f, b.f - b.inDur);
        const t = EASE[b.ease](clamp((frame - start) / Math.max(1, b.f - start)));
        const out: R = {};
        for (const key of Object.keys(b.p)) {
          const va = a.p[key];
          const vb = b.p[key];
          out[key] =
            typeof va === "number" && typeof vb === "number"
              ? lerp(va, vb, t)
              : t < 0.5
                ? va
                : vb;
        }
        return out as P;
      }
    }
    return states[states.length - 1].p as P;
  };
}

/** React-safe SVG id (useId returns ':r1:' which breaks url(#...)). */
export const safeId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, "");
