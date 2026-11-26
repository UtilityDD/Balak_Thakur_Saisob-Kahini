import React from "react";
import { AbsoluteFill, Audio, Freeze, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SeriesSubtitles } from "../../episode/SeriesSubtitles";
import { GhibliScene00Intro } from "../episode03/scenes/GhibliScene00Intro";
import { GhibliScene00bSource } from "../episode03/scenes/GhibliScene00bSource";
import { Scene01RewriteKachariChat } from "./scenes/Scene01RewriteKachariChat";
import { Scene02RewriteTortoiseBinoy } from "./scenes/Scene02RewriteTortoiseBinoy";
import { Scene03RewriteSixAndAlone } from "./scenes/Scene03RewriteSixAndAlone";
import { Scene04RewriteCucumberBamboo } from "./scenes/Scene04RewriteCucumberBamboo";
import { Scene05RewriteSereshtaGossip } from "./scenes/Scene05RewriteSereshtaGossip";
import { Scene99RewriteOutro } from "./scenes/Scene99RewriteOutro";
import { EP05R_CUES } from "./subtitles";
import { EP05R_AUDIO, EP05R_SCENES } from "./timing";

/**
 * Ghibli Episode 5, conversation-led rewrite (STO-23): composition `Episode05GhibliRewrite`
 * ("পর্ব পাঁচ — কচ্ছপ খেলা ও গাভী রক্ষা", watercolour + sepia-ink, 1920 x 1080, 24 fps; length from the generated timing).
 * Plan: 03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/01_Script_and_Storyboard/Episode_05_FULL_PRODUCTION_BLUEPRINT.md (DRAFT).
 *
 * TIMING is generated (never hand-edited): python scripts/prepare_ep05g_voices.py && node scripts/build_ep05g_timing.js
 * (lines.json + the measured WAVs; missing WAVs use the blueprint's estimates and are NOT played: `estimated`).
 *
 * Shell (as Episode04Ghibli): title card (the Ghibli series title template with this episode's name; no captions) ·
 * source card (the existing 00a_Source_Attribution.wav, Q16) · scenes 01, 02 · chapter break CB1 (fade to black, a quiet
 * hold, fade in: CAM-10) · scenes 03, 04, 05 · outro with the soft boxless Episode 6 glimpse (TTL-10a). Transitions:
 * scene 01 fades in over the source card's end; 02 fades out into CB1 and 03 fades in from it; 04 → 05 a 36 f dissolve
 * (blueprint P9); 05 (AG14 riverbank) → outro a 40 f dissolve (CAM-09).
 * The SOUND section (beds, music cues, one-shot SFX) is a marked placeholder for the sound pass (blueprint section 6).
 */

const INTRO = "00_intro";
const SOURCE = "00b_source_attribution";
const S01 = "01_kachari_chat_and_slip";
const S02 = "02_tortoise_bite_and_binoy";
const CB1 = "cb1_chapter_break";
const S03 = "03_six_and_alone";
const S04 = "04_cucumber_and_bamboo";
const S05 = "05_sereshta_gossip";
const OUTRO = "99_closing_sequential_outro";

const sceneById = (id: string) => EP05R_SCENES.find((x) => x.sceneId === id);
const sceneStart = (id: string): number => sceneById(id)?.startFrame ?? 0;

const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

/* ------------------------------------------------------------------ */
/* Fades and dissolves                                                 */
/* ------------------------------------------------------------------ */

const SCENE_FADE: Record<string, { in?: number; out?: number; color?: string }> = {
  [S01]: { in: 14, color: "#1c120a" },
  [S02]: { out: 12, color: "#120d08" },
  [S03]: { in: 12, color: "#120d08" },
  [OUTRO]: { out: 40, color: "#120d08" },
};
/** Frames the NEXT scene's first frame dissolves in over the end of this one (image to image, CAM-09). */
const DISSOLVE_INTO: Record<string, number> = {
  [S05]: 36, // 04 (P9, the cow) -> 05
  [OUTRO]: 40, // 05 (AG14, the riverbank) -> the outro
};

const EdgeFade: React.FC<{ fadeIn?: number; fadeOut?: number; durationFrames: number; color?: string; children: React.ReactNode }> = ({
  fadeIn,
  fadeOut,
  durationFrames,
  color = "#120d08",
  children,
}) => {
  const f = useCurrentFrame();
  let v = 1;
  if (fadeIn) v = Math.min(v, ease(f / fadeIn));
  if (fadeOut) v = Math.min(v, ease((durationFrames - f) / fadeOut));
  return (
    <AbsoluteFill>
      {children}
      {v < 1 && <AbsoluteFill style={{ background: color, opacity: 1 - v, pointerEvents: "none" }} />}
    </AbsoluteFill>
  );
};

const DissolveIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: ease((f + 1) / frames) }}>{children}</AbsoluteFill>;
};

const ChapterBreak: React.FC = () => <AbsoluteFill style={{ background: "#120d08" }} />;

const sceneNode = (id: string, frames: number): React.ReactNode => {
  switch (id) {
    case INTRO:
      return <GhibliScene00Intro episodeLabel="পর্ব পাঁচ" episodeName="কচ্ছপ খেলা ও গাভী রক্ষা" />;
    case SOURCE:
      return <GhibliScene00bSource frames={frames} />;
    case S01:
      return <Scene01RewriteKachariChat />;
    case S02:
      return <Scene02RewriteTortoiseBinoy />;
    case CB1:
      return <ChapterBreak />;
    case S03:
      return <Scene03RewriteSixAndAlone />;
    case S04:
      return <Scene04RewriteCucumberBamboo />;
    case S05:
      return <Scene05RewriteSereshtaGossip />;
    case OUTRO:
      return <Scene99RewriteOutro />;
    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* SOUND (placeholder: filled by the sound pass, blueprint section 6)  */
/* ------------------------------------------------------------------ */
/*
 * SOUND PASS TODO. Fill the three tables below; the rendering code at the end of the composition already places them.
 *  - BEDS: ambient loops per scene (6A), <= 0.25 open, 0.08-0.12 under voice; anchor `from`/`to` on sceneStart() or
 *    ep05rAbs(sceneId, key) from ./timing (P8 leaves only, 0.10).
 *  - MUSIC: the AUD-09 library public/audio/music/ep05/ (6C), 12-18 dB under dialogue, about -22 LUFS in wordless beats;
 *    copy MUSIC_LIB / lufsToVol / musicSpeech from episode04/Episode04Ghibli.tsx and key every cue to spans or beats
 *    (e.g. ep05rAbs(S02, "P3") for bansuri_relief, ep05rAbs(S04, "04g_Balak_Inner2.wav") for the drum_pulse heartbeat).
 *  - SFX: one-shots 0.15-0.45 (6B), the CB1 chime_pop at sceneStart(CB1) + 4 (0.18), the outro shimmer at 0.12 (AUD-08a).
 * Every voice is placed from EP05R_AUDIO below (estimated clips are skipped until their WAV exists).
 */

interface LoopLayer {
  /** path under public/audio/ */
  file: string;
  from: number;
  to: number;
  /** constant gain or a per-frame (local) volume */
  volume: number | ((f: number) => number);
  loop?: boolean;
  rate?: number;
}

const BEDS: readonly LoopLayer[] = [];
const MUSIC: readonly LoopLayer[] = [];
const SFX: readonly LoopLayer[] = [];

/* ------------------------------------------------------------------ */
/* Voices                                                              */
/* ------------------------------------------------------------------ */

/** Only clips whose WAV was measured by the prepare script; estimated ones (WAV missing) never reach <Audio>. */
const VOICES = EP05R_AUDIO.filter((a) => !a.estimated);

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

export const Episode05Rewrite: React.FC = () => (
  <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#120d08" }}>
    {EP05R_SCENES.map((scene) => {
      const node = sceneNode(scene.sceneId, scene.durationFrames);
      if (!node) return null;
      const fade = SCENE_FADE[scene.sceneId];
      const wrapped = fade ? (
        <EdgeFade fadeIn={fade.in} fadeOut={fade.out} durationFrames={scene.durationFrames} color={fade.color}>
          {node}
        </EdgeFade>
      ) : (
        node
      );
      return (
        <Sequence key={scene.sceneId} from={scene.startFrame} durationInFrames={scene.durationFrames} name={scene.sceneId}>
          {wrapped}
        </Sequence>
      );
    })}

    {/* image-to-image dissolves: the next scene's first frame fades in over the end of the previous one */}
    {Object.entries(DISSOLVE_INTO).map(([id, frames]) => {
      const node = sceneNode(id, sceneById(id)?.durationFrames ?? 1);
      if (!node || !sceneById(id)) return null;
      return (
        <Sequence key={`dissolve-${id}`} from={Math.max(0, sceneStart(id) - frames)} durationInFrames={frames} name={`dissolve into ${id}`}>
          <DissolveIn frames={frames}>
            <Freeze frame={0}>{node}</Freeze>
          </DissolveIn>
        </Sequence>
      );
    })}

    {/* SOUND (placeholder tables above) */}
    {[...BEDS, ...MUSIC, ...SFX].map((c, i) => (
      <Sequence key={`snd-${i}-${c.file}-${c.from}`} from={c.from} durationInFrames={Math.max(1, c.to - c.from)} layout="none">
        <Audio src={staticFile(`audio/${c.file}`)} loop={c.loop ?? false} volume={c.volume} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}

    {/* voices (measured clips only) */}
    {VOICES.map((a) => (
      <Sequence key={a.file} from={a.startFrame} durationInFrames={a.frames} layout="none">
        <Audio src={staticFile(`audio/ep05_ghibli_rewrite/${a.file}`)} volume={1} />
      </Sequence>
    ))}

    {/* TTL-14 one-line Bengali captions (none on the title page or the source card) */}
    <SeriesSubtitles cues={EP05R_CUES} />
  </div>
);

