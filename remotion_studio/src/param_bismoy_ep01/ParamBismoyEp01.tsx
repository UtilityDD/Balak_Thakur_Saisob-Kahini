import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { SeriesSubtitles } from "../episode/SeriesSubtitles";
import { S2_EP01_AUDIO, S2_EP01_SCENES } from "./timing";
import { S2_EP01_CUES } from "./subtitles";
import { Scene00bSourceCard, Scene00Intro } from "./scenes/Scene00IntroAndSource";
import { Scene01LokenathProphecy } from "./scenes/Scene01LokenathProphecy";
import { Scene02PadmaKaulipara } from "./scenes/Scene02PadmaKaulipara";
import { Scene03PagolMonsoonBaidikBari } from "./scenes/Scene03PagolMonsoonBaidikBari";
import { Scene99Outro } from "./scenes/Scene99Outro";

const SCENE_COMPONENTS: Record<string, React.FC> = {
  "00_intro": Scene00Intro,
  "00b_source_attribution": Scene00bSourceCard,
  "01_lokenath_prophecy": Scene01LokenathProphecy,
  "02_padma_kaulipara_warning": Scene02PadmaKaulipara,
  "03_pagol_monsoon_omen": Scene03PagolMonsoonBaidikBari,
  "99_closing_sequential_outro": Scene99Outro,
};

interface SceneBed {
  ambient?: string;
  music?: string;
  sfx?: string;
}

const SCENE_BEDS: Record<string, SceneBed> = {
  "00_intro": { music: "music/Theme_Intro_Bansuri.wav", sfx: "sfx/chime_pop.wav" },
  "00b_source_attribution": { music: "music/Theme_Intro_Bansuri.wav" },
  "01_lokenath_prophecy": {
    ambient: "ep02/deep/deep_bengal_night_crickets.wav",
    music: "music/Sacred_Night_Ambient.wav",
    sfx: "sfx/soft_magical_shimmer.wav",
  },
  "02_padma_kaulipara_warning": {
    ambient: "ep02/deep/deep_padma_river_day.wav",
    music: "music/Village_Peace_Loop.wav",
  },
  "03_pagol_monsoon_omen": {
    ambient: "ep02/deep/deep_monsoon_rain_courtyard.wav",
    music: "music/Sacred_Night_Ambient.wav",
  },
  "99_closing_sequential_outro": {
    ambient: "ep02/deep/deep_padma_river_day.wav",
    music: "music/Theme_Intro_Bansuri.wav",
    sfx: "sfx/soft_magical_shimmer.wav",
  },
};

// Smooth 4-bus voice ducking matching Episode02's architecture
const DUCK_RAMP = 12;
const DUCK_MERGE = 24;
const AMBIENT_OPEN = 0.42;
const AMBIENT_DUCKED = 0.24;
const MUSIC_OPEN = 0.16;
const MUSIC_DUCKED = 0.08;

const SPEECH: [number, number][] = (() => {
  const spans = S2_EP01_AUDIO.map((a) => [a.startFrame, a.startFrame + a.frames] as [number, number]).sort(
    (x, y) => x[0] - y[0]
  );
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] - last[1] < DUCK_MERGE) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
})();

const speechAmount = (frame: number): number => {
  let amt = 0;
  for (const [a, b] of SPEECH) {
    if (frame < a - DUCK_RAMP) break;
    let t = 0;
    if (frame >= a && frame <= b) t = 1;
    else if (frame < a) t = (frame - (a - DUCK_RAMP)) / DUCK_RAMP;
    else if (frame <= b + DUCK_RAMP) t = 1 - (frame - b) / DUCK_RAMP;
    amt = Math.max(amt, 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t))));
  }
  return amt;
};

const ambientVolumeAt = (frame: number) => AMBIENT_OPEN + (AMBIENT_DUCKED - AMBIENT_OPEN) * speechAmount(frame);
const musicVolumeAt = (frame: number) => MUSIC_OPEN + (MUSIC_DUCKED - MUSIC_OPEN) * speechAmount(frame);

export const ParamBismoyEp01: React.FC = () => (
  <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#0a0818" }}>
    {S2_EP01_SCENES.map((scene) => {
      const SceneComponent = SCENE_COMPONENTS[scene.sceneId];
      const bed = SCENE_BEDS[scene.sceneId] ?? {};
      return (
        <React.Fragment key={scene.sceneId}>
          <Sequence from={scene.startFrame} durationInFrames={scene.durationFrames}>
            <SceneComponent />
          </Sequence>
          <Sequence from={scene.startFrame} durationInFrames={scene.durationFrames} layout="none">
            {bed.ambient && (
              <Audio
                src={staticFile(`audio/${bed.ambient}`)}
                loop
                volume={(f) => ambientVolumeAt(scene.startFrame + f)}
              />
            )}
            {bed.music && (
              <Audio
                src={staticFile(`audio/${bed.music}`)}
                loop
                volume={(f) => musicVolumeAt(scene.startFrame + f)}
              />
            )}
            {bed.sfx && <Audio src={staticFile(`audio/${bed.sfx}`)} volume={0.35} />}
          </Sequence>
        </React.Fragment>
      );
    })}

    {/* Thunder & water-spurt accents synced to scene moments */}
    <Sequence from={2210 + 637} durationInFrames={24}>
      <Audio src={staticFile("audio/sfx/ep02/water_splash.wav")} volume={0.32} />
    </Sequence>
    <Sequence from={3590 + 628} durationInFrames={120}>
      <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.38} />
    </Sequence>

    {/* All 13 Bengali voice clips (clean TV anime frame — no burned-in on-screen subtitle text; separate .srt file provided) */}
    {S2_EP01_AUDIO.map((a) => (
      <Sequence key={a.file} from={a.startFrame} durationInFrames={a.frames}>
        <Audio src={staticFile(`audio/s2_ep01/${a.file}`)} volume={1} />
      </Sequence>
    ))}
  </div>
);
