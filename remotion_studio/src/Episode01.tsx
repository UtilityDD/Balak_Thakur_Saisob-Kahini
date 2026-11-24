import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import seriesConfig from "../../00_Agent_Manifest/series_config.json";
import { EPISODE_01_SCENES } from "./data/episode01Data";
import { SceneRenderer } from "./scenes/Episode01Scenes";
import { SceneTiming } from "./types/studio";
import { EASE, clamp, lerp, progress } from "./lib/motion";
import { voiceActivity } from "./lib/speech";

const AUDIO = seriesConfig.audio_specs;
/** Cross-dissolve length between scenes (frames). */
const XFADE = 16;
const BED_FADE = 20;

const edgeFade = (f: number, dur: number, fade: number): number =>
  Math.min(EASE.inOutSine(clamp(f / fade, 0, 1)), EASE.inOutSine(clamp((dur - f) / fade, 0, 1)));

/** Renders a scene with a pre-roll so it can dissolve in over the previous one, keeping lip-sync locked to audio. */
const SceneVisual: React.FC<{ scene: SceneTiming; preRoll: number; isFirst: boolean; isLast: boolean }> = ({ scene, preRoll, isFirst, isLast }) => {
  const local = useCurrentFrame();
  const sceneFrame = local - preRoll;
  let opacity = preRoll > 0 ? EASE.inOutSine(clamp(local / preRoll, 0, 1)) : 1;
  if (isFirst) opacity = Math.min(opacity, progress(sceneFrame, 0, 14, "outCubic"));
  if (isLast) opacity = Math.min(opacity, 1 - progress(sceneFrame, scene.durationFrames - 36, 36, "inOutSine"));
  return (
    <AbsoluteFill style={{ opacity }}>
      <SceneRenderer scene={scene} frame={sceneFrame} />
    </AbsoluteFill>
  );
};

/* ---------- subtitles: readable cues instead of whole paragraphs ---------- */

interface Cue {
  start: number;
  end: number;
  text: string;
}

const MAX_CUE_CHARS = 84;

const splitLong = (s: string): string[] => {
  if (s.length <= MAX_CUE_CHARS) return [s];
  const parts: string[] = [];
  let cur = "";
  for (const word of s.split(/\s+/)) {
    if ((cur + " " + word).trim().length > MAX_CUE_CHARS && cur) {
      parts.push(cur.trim());
      cur = word;
    } else cur = `${cur} ${word}`;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
};

const cueCache = new Map<string, Cue[]>();
const buildCues = (text: string, frames: number, offset: number): Cue[] => {
  const key = `${offset}:${frames}:${text}`;
  const hit = cueCache.get(key);
  if (hit) return hit;
  const sentences = text
    .split(/(?<=[।!?…|,;—])\s+/)
    .flatMap(splitLong)
    .filter(Boolean);
  // Merge short fragments so cues are not flashy.
  const merged: string[] = [];
  for (const s of sentences) {
    const last = merged[merged.length - 1];
    if (last && (last + " " + s).length <= MAX_CUE_CHARS && (last.length < 28 || s.length < 18)) merged[merged.length - 1] = `${last} ${s}`;
    else merged.push(s);
  }
  const total = merged.reduce((n, s) => n + s.length, 0) || 1;
  let t = offset;
  const cues = merged.map((s) => {
    const len = (s.length / total) * frames;
    const cue = { start: Math.round(t), end: Math.round(t + len), text: s };
    t += len;
    return cue;
  });
  cueCache.set(key, cues);
  return cues;
};

const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  let cue: Cue | null = null;
  for (const sc of EPISODE_01_SCENES) {
    if (frame < sc.startFrame || frame >= sc.startFrame + sc.durationFrames) continue;
    for (const clip of sc.clips) {
      const start = sc.startFrame + clip.offsetFrame;
      if (frame < start || frame >= start + clip.frames) continue;
      cue = buildCues(clip.subtitleBn, clip.frames, start).find((c) => frame >= c.start && frame < c.end) ?? null;
      break;
    }
    break;
  }
  if (!cue) return null;
  const inP = progress(frame, cue.start, 5, "outCubic");
  const outP = 1 - progress(frame, cue.end - 4, 4, "linear");
  const op = Math.min(inP, outP);

  return (
    <div style={{ position: "absolute", bottom: 56, left: 160, right: 160, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 50 }}>
      <div
        style={{
          color: "#fff8e8",
          padding: "10px 26px",
          borderRadius: 10,
          fontSize: 38,
          lineHeight: 1.45,
          fontWeight: 600,
          fontFamily: "'Noto Sans Bengali', 'Nirmala UI', sans-serif",
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(10,8,24,0.55), rgba(10,8,24,0.68))",
          textShadow: "0 2px 6px rgba(0,0,0,0.6)",
          opacity: op,
          transform: `translateY(${(1 - inP) * 8}px)`,
          maxWidth: 1400,
        }}
      >
        {cue.text}
      </div>
    </div>
  );
};

/* ---------- episode ---------- */

export const Episode01: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#05030a" }}>
      {EPISODE_01_SCENES.map((scene, i) => {
        const preRoll = i === 0 ? 0 : XFADE;
        const d = scene.durationFrames;
        return (
          <React.Fragment key={scene.sceneId}>
            <Sequence from={scene.startFrame - preRoll} durationInFrames={d + preRoll} name={`${scene.sceneId} (picture)`}>
              <SceneVisual scene={scene} preRoll={preRoll} isFirst={i === 0} isLast={i === EPISODE_01_SCENES.length - 1} />
            </Sequence>

            <Sequence from={scene.startFrame} durationInFrames={d} name={`${scene.sceneId} (sound)`} layout="none">
              {/* Bus 1: normalised 48 kHz Bengali voice */}
              {scene.clips.map((clip) => (
                <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
                  <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={AUDIO.narration_volume} />
                </Sequence>
              ))}

              {/* Bus 2: ambient bed, faded at scene edges so cuts never click */}
              {scene.ambientBed && !scene.ambientBed.startsWith("NONE") && (
                <Audio src={staticFile(`audio/ambient/${scene.ambientBed}`)} loop volume={(f) => AUDIO.ambient_bed_volume * edgeFade(f, d, BED_FADE)} />
              )}

              {/* Bus 3: music swells in gaps and ducks under dialogue */}
              {scene.musicCue && !scene.musicCue.startsWith("NONE") && (
                <Audio
                  src={staticFile(`audio/music/${scene.musicCue}`)}
                  loop
                  volume={(f) => lerp(AUDIO.music_swell_volume, AUDIO.music_duck_volume, voiceActivity(scene, f)) * edgeFade(f, d, BED_FADE)}
                />
              )}

              {/* Bus 4: beat-synced foley */}
              {scene.sfx.map((sfxFile, idx) => {
                let sfxFrame = idx * 42;
                if (sfxFile === "uludhwani.wav" && scene.clips[0]) {
                  sfxFrame = scene.clips[0].offsetFrame + scene.clips[0].frames + 2;
                } else if (sfxFile === "temple_bell_drop.wav" && scene.clips[0]) {
                  sfxFrame = scene.clips[0].offsetFrame + scene.clips[0].frames + 28;
                } else if (sfxFile === "goat_bleat_happy.wav" && scene.clips[1]) {
                  sfxFrame = scene.clips[1].offsetFrame + Math.round(scene.clips[1].frames * 0.62);
                }
                return (
                  <Sequence key={`${sfxFile}-${idx}`} from={Math.min(sfxFrame, Math.max(0, d - 24))} durationInFrames={120} layout="none">
                    <Audio src={staticFile(`audio/sfx/${sfxFile}`)} volume={AUDIO.sfx_volume} />
                  </Sequence>
                );
              })}
            </Sequence>
          </React.Fragment>
        );
      })}

      <Subtitles />
    </AbsoluteFill>
  );
};
