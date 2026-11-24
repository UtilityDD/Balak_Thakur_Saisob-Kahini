import React from "react";
import { Audio as RemotionAudio, useCurrentFrame } from "remotion";
import { SceneTiming } from "../../types/studio";

/**
 * Broadcast-style mix for the cinematic scenes.
 *  - All voice WAVs are loudness-normalised on disk (≈ -17 dBFS speech RMS), music loops ≈ -16.
 *  - Music and ambience beds duck automatically under ANY dialogue/narration (side-chain from the
 *    clips' RMS envelopes, fast attack / slow release) so the voice always sits clearly on top.
 * Scene files import `Audio` from here instead of "remotion"; voices and sfx pass straight through.
 */

type DuckState = { rootFrame: number; speech: (sceneFrame: number) => number };
const DuckCtx = React.createContext<DuckState | null>(null);

const cache = new WeakMap<SceneTiming, Float32Array>();
function speechTrack(scene: SceneTiming): Float32Array {
  const hit = cache.get(scene);
  if (hit) return hit;
  const n = scene.durationFrames;
  const raw = new Float32Array(n);
  for (const c of scene.clips) {
    for (let i = 0; i < c.rmsEnvelope.length; i++) {
      const t = c.offsetFrame + i;
      if (t >= 0 && t < n) raw[t] = Math.max(raw[t], c.rmsEnvelope[i] > 0.05 ? 1 : 0);
    }
  }
  // side-chain envelope: attack 4 frames (pre-roll so the bed is already down at the first syllable), release 14
  const out = new Float32Array(n);
  for (let t = 0; t < n; t++) {
    let v = 0;
    for (let k = -4; k <= 14; k++) {
      const tt = t - k; // k<0 looks ahead (pre-roll), k>0 looks behind (release)
      const val = tt >= 0 && tt < n ? raw[tt] : 0;
      const w = k < 0 ? 1 + k / 5 : 1 - k / 15;
      v = Math.max(v, val * w);
    }
    out[t] = v;
  }
  cache.set(scene, out);
  return out;
}

/** Wrap a scene's sound bed (rendered at scene-local frames) so its beds duck under the dialogue. */
export const DuckProvider: React.FC<{ scene: SceneTiming; depth?: number; children: React.ReactNode }> = ({ scene, children }) => {
  const rootFrame = useCurrentFrame();
  const track = speechTrack(scene);
  const value = React.useMemo(() => ({ rootFrame, speech: (sf: number) => track[Math.max(0, Math.min(track.length - 1, Math.round(sf)))] ?? 0 }), [rootFrame, track]);
  return <DuckCtx.Provider value={value}>{children}</DuckCtx.Provider>;
};

/** How far beds drop under speech: music −11 dB, ambience −7 dB. */
const DUCK_MUSIC = 0.28;
const DUCK_AMB = 0.45;

type AudioProps = React.ComponentProps<typeof RemotionAudio>;

export const Audio: React.FC<AudioProps> = (props) => {
  const ctx = React.useContext(DuckCtx);
  const local = useCurrentFrame();
  const src = String(props.src ?? "");
  const kind = src.includes("/music/") ? "music" : src.includes("/ambient/") ? "amb" : null;
  if (!ctx || !kind) return <RemotionAudio {...props} />;
  const offset = ctx.rootFrame - local; // scene frame of this Audio's local frame 0
  const depth = kind === "music" ? DUCK_MUSIC : DUCK_AMB;
  const base = props.volume;
  const volume = (fr: number) => {
    const v = typeof base === "function" ? base(fr) : base ?? 1;
    const s = ctx.speech(fr + offset);
    return v * (1 - (1 - depth) * s);
  };
  return <RemotionAudio {...props} volume={volume} />;
};
