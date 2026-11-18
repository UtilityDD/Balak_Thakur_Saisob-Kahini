import { CharacterId, SceneTiming } from "../types/studio";
import { clamp } from "./motion";

type Clip = SceneTiming["clips"][number];

/** Per-clip percentile normalisation so quiet and loud takes animate the mouth equally. */
const normCache = new WeakMap<number[], number>();
const clipGain = (env: number[]): number => {
  const cached = normCache.get(env);
  if (cached !== undefined) return cached;
  const voiced = env.filter((v) => v > 0.03).sort((a, b) => a - b);
  const p90 = voiced.length ? voiced[Math.floor(voiced.length * 0.9)] : 1;
  const gain = 0.92 / Math.max(0.05, p90);
  normCache.set(env, gain);
  return gain;
};

const rawAt = (clip: Clip, relFrame: number): number => {
  // Audio volume callbacks are sampled at fractional frames.
  const rel = Math.floor(relFrame);
  return rel >= 0 && rel < clip.rmsEnvelope.length ? clip.rmsEnvelope[rel] * clipGain(clip.rmsEnvelope) : 0;
};

/**
 * Animator-style mouth energy: fast attack with a 1-frame lead (mouths open
 * just before the sound), soft exponential release, and gentle compression so
 * clipped envelopes do not hold the jaw wide open.
 */
export const mouthEnergy = (clip: Clip, rel: number): number => {
  let v = rawAt(clip, rel + 1) * 0.85;
  for (let k = 0; k <= 4; k++) v = Math.max(v, rawAt(clip, rel - k) * Math.pow(0.62, k));
  return clamp(Math.pow(clamp(v, 0, 1), 0.8), 0, 1);
};

export const activeClip = (scene: SceneTiming, localFrame: number): Clip | null => {
  for (const clip of scene.clips) {
    if (localFrame >= clip.offsetFrame && localFrame < clip.offsetFrame + clip.frames) return clip;
  }
  return null;
};

/** Smoothed 0..1 speaking energy for a character at the scene-local frame. */
export const speakerEnergy = (scene: SceneTiming, localFrame: number, who: CharacterId): number => {
  for (const clip of scene.clips) {
    if (clip.speaker !== who) continue;
    const rel = localFrame - clip.offsetFrame;
    if (rel >= -2 && rel < clip.rmsEnvelope.length + 5) return mouthEnergy(clip, rel);
  }
  return 0;
};

/** Any voice energy in the scene (drives music ducking). */
export const voiceActivity = (scene: SceneTiming, localFrame: number): number => {
  let best = 0;
  for (const clip of scene.clips) {
    const rel = localFrame - clip.offsetFrame;
    if (rel < -6 || rel > clip.frames + 10) continue;
    // Wide, slow envelope: look back/forward ~0.5s so ducking does not pump.
    for (let k = -6; k <= 12; k += 3) best = Math.max(best, rawAt(clip, rel - k));
  }
  return clamp(best, 0, 1);
};
