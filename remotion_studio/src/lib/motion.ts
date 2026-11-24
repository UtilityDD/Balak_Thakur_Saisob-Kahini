/**
 * Deterministic motion helpers. Every value is a pure function of the frame,
 * so any frame renders identically regardless of render order or concurrency.
 */

const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

/** Smooth 1D value noise in the range 0..1. */
export const noise1D = (x: number, seed = 0): number => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const o = seed * 1013.37;
  return hash(i + o) * (1 - u) + hash(i + 1 + o) * u;
};

/** Fractal noise in the range -1..1 for organic drift, gusts, and handheld shake. */
export const fbm1D = (x: number, seed = 0, octaves = 3): number => {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * (noise1D(x * freq, seed + o * 7.13) * 2 - 1);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
};

/** Deterministic 0..1 random for an integer/string seed. */
export const rand = (seed: number): number => hash(seed * 0.618034 + 0.1234);

export const seedOf = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
  return h;
};

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const EASE = {
  linear: (t: number) => t,
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuint: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
} as const;

export type EaseName = keyof typeof EASE;

/** 0..1 progress of `frame` through [start, start + dur], eased. */
export const progress = (frame: number, start: number, dur: number, ease: EaseName = "inOutSine"): number =>
  EASE[ease](clamp((frame - start) / Math.max(1, dur), 0, 1));

/**
 * Natural blink: returns eyelid openness 0..1. Blinks are spaced 2-5.5 s apart
 * with occasional double blinks, using a 5-frame close/open curve.
 */
export const blinkOpenness = (frame: number, seed: number, fps = 24): number => {
  // Walk the deterministic blink schedule up to the current frame.
  let t = Math.floor(rand(seed) * fps * 2);
  let k = 0;
  while (t <= frame) {
    const curve = [0.55, 0.08, 0.0, 0.35, 0.8];
    const d = frame - t;
    if (d < curve.length) return curve[d];
    // A double blink trails the first by 7 frames 18% of the time.
    if (rand(seed + k * 3.7 + 1.1) < 0.18) {
      const d2 = frame - (t + 7);
      if (d2 >= 0 && d2 < curve.length) return curve[d2];
    }
    t += Math.floor(fps * (2 + rand(seed + k * 1.9) * 3.5));
    k++;
  }
  return 1;
};
