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
import { EP05R_CUES, ep05rPhraseLocal } from "./subtitles";
import { EP05R_AUDIO, EP05R_SCENES, EP05R_TOTAL_FRAMES, ep05rAbs, ep05rSpan } from "./timing";

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
 * SOUND (blueprint section 6): ducked ambient beds (6A), the AUD-09 score with open/under LUFS targets (6C) and the one-shot
 * SFX table (6B), every cue keyed to spans, beats or caption phrases plus an offset (see the SOUND section's anchor helpers).
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
/* SOUND (blueprint section 6): anchors                                */
/* ------------------------------------------------------------------ */
/*
 * Every cue below is keyed to the generated timing, never to a raw frame:
 *   S(scene, off)            scene start + off            X(scene, off)   scene end + off
 *   A(scene, key, off)       start of a line or beat + off (key: "02c_Charu_NoMark.wav", "P3", "AG10_the_cow" ...)
 *   Z(scene, key, off)       end of a line or beat + off
 *   P(scene, phrase, off, k) the frame a caption phrase starts + off (falls back to the start of line/beat `k`)
 * TO RETIME A CUE (scene agents' action offsets): change only the last number (the offset) of its anchor.
 * Tables: BEDS (6A), MUSIC_CUES (6C, AUD-09), PLACED_SFX (6B).
 */

/** Only clips whose WAV was measured by the prepare script; estimated ones (WAV missing) never reach <Audio>. */
const VOICES = EP05R_AUDIO.filter((a) => !a.estimated);

const S = (scene: string, off = 0): number => sceneStart(scene) + off;
const X = (scene: string, off = 0): number => sceneStart(scene) + (sceneById(scene)?.durationFrames ?? 0) + off;
const A = (scene: string, key: string, off = 0): number => ep05rAbs(scene, key).from + off;
const Z = (scene: string, key: string, off = 0): number => ep05rAbs(scene, key).to + off;
const P = (scene: string, phrase: string, off: number, fallbackKey: string): number =>
  sceneStart(scene) + ep05rPhraseLocal(scene, phrase, ep05rSpan(scene, fallbackKey).from) + off;

/* Line and beat keys (EP05R_SPANS) */
const L = {
  kachari: "01a_Narrator_Kachari.wav",
  eyeOnHim: "01b_Charu_EyeOnHim.wav",
  chuckle: "01c_Surendra_Chuckle.wav",
  slip: "01d_Narrator_Slip.wav",
  shout: "01e_Binoy_Shout.wav",
  alarm: "01f_Charu_Alarm.wav",
  run: "01g_Surendra_Run.wav",
  bitten: "02a_Surendra_Bitten.wav",
  freeHand: "02b_Charu_FreeHand.wav",
  noMark: "02c_Charu_NoMark.wav",
  askBinoy: "02d_Surendra_AskBinoy.wav",
  account1: "02e_Binoy_Account1.wav",
  account2: "02f_Binoy_Account2.wav",
  account3: "02g_Binoy_Account3.wav",
  balakTortoise: "02h_Balak_Tortoise.wav",
  shouted: "02i_Binoy_Shouted.wav",
  six: "03a_Narrator_Six.wav",
  scold: "03b_Surendra_Scold.wav",
  alone: "03c_Narrator_Alone.wav",
  places: "03d_Narrator_Places.wav",
  relief: "03e_Charu_Relief.wav",
  thatDay: "04a_Narrator_ThatDay.wav",
  q1: "04b_Haricharan_Q1.wav",
  whatHappened: "04c_Balak_WhatHappened.wav",
  cucumber: "04d_Haricharan_Cucumber.wav",
  inner1: "04e_Balak_Inner1.wav",
  q2: "04f_Haricharan_Q2.wav",
  inner2: "04g_Balak_Inner2.wav",
  truth1: "04h_Balak_Truth1.wav",
  sputter: "04i_Haricharan_Sputter.wav",
  truth2: "04j_Balak_Truth2.wav",
  truth3: "04k_Balak_Truth3.wav",
  storm: "04l_Haricharan_Storm.wav",
  report: "05a_Haricharan_Report.wav",
  sawEat: "05b_ClerkA_SawEat.wav",
  fedIt: "05c_ClerkB_FedIt.wav",
  verdict: "05d_ClerkA_Verdict.wav",
  agree: "05e_Haricharan_Agree.wav",
} as const;
const AG1 = "AG1_world_open";
const AG2 = "AG2_the_slip";
const AG3 = "AG3_time_passes";
const AG4 = "AG4_the_run";
const AG5 = "AG5_already_free";
const AG6 = "AG6_the_play";
const AG7 = "AG7_the_shout";
const AG8 = "AG8_world_open";
const AG9 = "AG9_world_open";
const AG10 = "AG10_the_cow";
const AG11 = "AG11_haricharan";
const AG12 = "AG12_storms_off";
const AG13 = "AG13_world_open";
const AG14 = "AG14_afterglow";

/* Phrase anchors used by more than one cue (snippets avoid the nukta letters য়/ড়, whose encoding can differ) */
/** "…কোথাও তো একটা দাগও নেই!" (02c): the no-mark wonder. */
const NO_MARK = P(S02, "দাগও নেই", 0, L.noMark);
/** "…তারপর একবার লেজ ভেবে…" (02g): the play turns toward the bite. */
const TOWARD_BITE = P(S02, "তারপর", 0, L.account3);
/** "…খপ করে হাত কামড়ে ধরল!" (02g): the jaws clamp (the scene agent's clamp frame; retime here). */
const KHOP = P(S02, "খপ", 0, L.account3);
/** "না—গরুও থাকবে, সত্যও থাকবে।" (04g): the decision; the heartbeat stops on "না—". */
const DECISION = P(S04, "গরুও থাকবে", -6, L.inner2);
/** Scene 03 montage place words (03d): the debdaru at the field's end, the jam tree by the river (30 f dissolves). */
const PLACE_FIELD = P(S03, "মাঠের শেষে", 0, L.places);
const PLACE_RIVER = P(S03, "নদীর ধারে", 0, L.places);

/* ------------------------------------------------------------------ */
/* Speech-aware ducking (AUD-03 / AUD-06), as Episode04Ghibli          */
/* ------------------------------------------------------------------ */

const mergeSpeech = (gap: number): [number, number][] => {
  const spans = VOICES.map((v) => [v.startFrame, v.startFrame + v.frames] as [number, number]).sort((x, y) => x[0] - y[0]);
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] - last[1] < gap) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
};
const speechAmountOf = (map: [number, number][], ramp: number) => (frame: number): number => {
  let amt = 0;
  for (const [a, b] of map) {
    if (frame < a - ramp) break;
    let t = 0;
    if (frame >= a && frame <= b) t = 1;
    else if (frame < a) t = (frame - (a - ramp)) / ramp;
    else if (frame <= b + ramp) t = 1 - (frame - b) / ramp;
    amt = Math.max(amt, ease(t));
  }
  return amt;
};
/** Beds: gaps under 20 f stay ducked, 10 f ramps. */
const bedSpeech = speechAmountOf(mergeSpeech(20), 10);
/** Music: gaps under 30 f stay ducked (no swell in a breath between sentences), 14 f ramps. */
const musicSpeech = speechAmountOf(mergeSpeech(30), 14);

/* ------------------------------------------------------------------ */
/* 6A. Ambient beds (loops: <= 0.25 open, lower under speech; AUD-03)  */
/* ------------------------------------------------------------------ */

/** Loop gain ceiling (AUD-03). */
const BED_CAP = 0.25;

interface BedLayer {
  /** path under public/audio/ */
  file: string;
  /** gain in wordless moments (<= 0.25) */
  open: number;
  /** gain while someone speaks */
  under: number;
  /** absolute windows where this layer drops out (10 f ramps), e.g. P8 "leaves only" */
  holes?: readonly [number, number][];
}
interface Bed {
  name: string;
  from: number;
  to: number;
  fadeIn: number;
  fadeOut: number;
  layers: BedLayer[];
}

const LIFE = "sfx/ghibli_life";
const R5 = "sfx/ep05_rewrite";
const E5 = "sfx/ep05";
/** The real Nasik afternoon recording (-28 LUFS), in place of the generated ep02/birds_village (R5 README). */
const BIRDS = `${R5}/afternoon_birds_loop.wav`;
const HENS = "sfx/ep06/hens_cluck_loop.wav";
const LEAVES = `${E5}/banana_leaves.wav`;
const WIND_LEAVES = `${LIFE}/wind_leaves.wav`;
const WIND = "sfx/ep02/wind_soft.wav";
const RIVER = "ambient/padma_river_day.wav";
const LAPPING = `${LIFE}/pond_lapping_loop.wav`;

/** P8 (the silence before the decision): the grove bed is leaves only. */
const P8_HOLE: readonly [number, number][] = [[A(S04, "P8", -6), Z(S04, "P8", 4)]];

const BEDS: readonly Bed[] = [
  {
    // the kachari compound and the family veranda, late morning: small birds, hens, a little air in the leaves
    name: "01-compound-veranda",
    from: S(S01),
    to: S(S02, 12),
    fadeIn: 24,
    fadeOut: 24,
    layers: [
      { file: BIRDS, open: 0.22, under: 0.12 },
      { file: HENS, open: 0.12, under: 0.06 },
      { file: WIND_LEAVES, open: 0.08, under: 0.05 },
    ],
  },
  {
    // the parents' walla (6B 1): from their shared laugh in P1, through the slip, shot 4 and AG3, cut by Binoy's shout
    name: "01-parents-walla",
    from: A(S01, "P1", 0),
    to: A(S01, L.shout, 4),
    fadeIn: 12,
    fadeOut: 5,
    layers: [{ file: `${R5}/adults_murmur_laugh.wav`, open: 0.2, under: 0.08 }],
  },
  {
    // Binoy's corner room (present and flashback: the same yard)
    name: "02-corner-room",
    from: S(S02, -10),
    to: S(CB1, 8),
    fadeIn: 24,
    fadeOut: 20,
    layers: [
      { file: BIRDS, open: 0.2, under: 0.1 },
      { file: WIND, open: 0.12, under: 0.06 },
    ],
  },
  {
    // Scene 03: the family yard in the afternoon (AG8, 03a, 03b)
    name: "03a-family-yard",
    from: S(S03),
    to: A(S03, L.alone, 14),
    fadeIn: 14,
    fadeOut: 26,
    layers: [
      { file: BIRDS, open: 0.2, under: 0.08 },
      { file: HENS, open: 0.1, under: 0.05 },
    ],
  },
  {
    // the path behind the kachari, Balak walking alone (03c): wind
    name: "03b-path-wind",
    from: A(S03, L.alone, -12),
    to: A(S03, L.places, 16),
    fadeIn: 26,
    fadeOut: 28,
    layers: [
      { file: WIND, open: 0.14, under: 0.08 },
      { file: BIRDS, open: 0.12, under: 0.06 },
    ],
  },
  {
    // montage (a): the banana grove
    name: "03c-montage-grove",
    from: A(S03, L.places, -12),
    to: PLACE_FIELD + 15,
    fadeIn: 28,
    fadeOut: 30,
    layers: [
      { file: LEAVES, open: 0.2, under: 0.1 },
      { file: BIRDS, open: 0.12, under: 0.06 },
    ],
  },
  {
    // montage (b): the debdaru at the field's end, open air
    name: "03d-montage-field",
    from: PLACE_FIELD - 15,
    to: PLACE_RIVER + 15,
    fadeIn: 30,
    fadeOut: 30,
    layers: [
      { file: WIND, open: 0.14, under: 0.08 },
      { file: WIND_LEAVES, open: 0.12, under: 0.07 },
    ],
  },
  {
    // montage (c) + P5: the jam tree by the river
    name: "03e-montage-river",
    from: PLACE_RIVER - 15,
    to: A(S03, L.relief, 8),
    fadeIn: 30,
    fadeOut: 20,
    layers: [
      { file: RIVER, open: 0.14, under: 0.08 },
      { file: LAPPING, open: 0.2, under: 0.1 },
      { file: WIND_LEAVES, open: 0.08, under: 0.05 },
    ],
  },
  {
    // Charu on the family veranda (03e), until P6's dissolve to the grove
    name: "03f-veranda-charu",
    from: A(S03, L.relief, -10),
    to: A(S03, "P6", 24),
    fadeIn: 18,
    fadeOut: 30,
    layers: [
      { file: BIRDS, open: 0.2, under: 0.08 },
      { file: HENS, open: 0.1, under: 0.05 },
    ],
  },
  {
    // the banana grove behind the kachari, from P6's dissolve to the dissolve into Scene 05; P8 is leaves only
    name: "04-grove",
    from: A(S03, "P6", 0),
    to: S(S05, 18),
    fadeIn: 30,
    fadeOut: 36,
    layers: [
      { file: BIRDS, open: 0.2, under: 0.08, holes: P8_HOLE },
      { file: LEAVES, open: 0.16, under: 0.07 },
      { file: WIND_LEAVES, open: 0.1, under: 0.05, holes: P8_HOLE },
    ],
  },
  {
    // the kachari's front veranda, later afternoon (the pigeons are one-shots in PLACED_SFX)
    name: "05-kachari-veranda",
    from: S(S05, -18),
    to: A(S05, AG14, 22),
    fadeIn: 36,
    fadeOut: 40,
    layers: [
      { file: BIRDS, open: 0.18, under: 0.08 },
      { file: WIND_LEAVES, open: 0.06, under: 0.04 },
    ],
  },
  {
    // AG14 + the outro: the riverbank at sunset
    name: "06-riverbank-sunset",
    from: A(S05, AG14, -18),
    to: EP05R_TOTAL_FRAMES,
    fadeIn: 40,
    fadeOut: 36,
    layers: [
      { file: RIVER, open: 0.16, under: 0.1 },
      { file: LAPPING, open: 0.2, under: 0.1 },
      { file: `${LIFE}/dawn_birds_loop.wav`, open: 0.08, under: 0.04 },
      { file: WIND_LEAVES, open: 0.08, under: 0.05 },
    ],
  },
];

const HOLE_RAMP = 10;
const holeFactor = (abs: number, holes?: readonly [number, number][]): number => {
  if (!holes) return 1;
  let k = 1;
  for (const [a, b] of holes) {
    const inside = Math.min((abs - (a - HOLE_RAMP)) / HOLE_RAMP, (b + HOLE_RAMP - abs) / HOLE_RAMP);
    k = Math.min(k, 1 - ease(inside));
  }
  return k;
};

const bedLayerVolume = (bed: Bed, layer: BedLayer) => (f: number) => {
  const abs = bed.from + f;
  const len = bed.to - bed.from;
  const edge = Math.max(0, Math.min(1, f / Math.max(1, bed.fadeIn), (len - f) / Math.max(1, bed.fadeOut)));
  const open = Math.min(BED_CAP, layer.open);
  const under = Math.min(open, layer.under);
  return (open + (under - open) * bedSpeech(abs)) * edge * holeFactor(abs, layer.holes);
};

/* ------------------------------------------------------------------ */
/* 6C. Score: the recorded Indian instrument library only (AUD-09)     */
/* ------------------------------------------------------------------ */

/**
 * AUD-09: every cue is a file of `public/audio/music/ep05/` (tanpura, bansuri, tabla, swarmandal plucks; README there).
 * Balance as Ghibli Episode 4: each cue gives its layer's target loudness in the mix (LUFS), `open` in wordless
 * moments (action gaps, pauses, intro and outro tails; the layers of a wordless stretch sum to about -22 LUFS) and
 * `under` while someone speaks (12 to 18 dB or more under the -16 LUFS voices). Music ducks on its own speech map.
 *
 * Key: the library is in C (Sa = C). `tanpura_drone_cs` is in C# (made for the unused Divine_Motif), so the glow
 * beats (P3, P9) and the afterglow use the C `tanpura_drone` under the C bansuri phrases, not the blueprint's
 * `tanpura_drone_cs` (as decided for Ghibli Episode 4).
 */
interface MusicFile {
  lufs: number;
  seconds: number;
  loop: boolean;
}
const MUSIC_LIB: Record<string, MusicFile> = {
  "music/ep05/tanpura_drone": { lufs: -24.0, seconds: 33.714, loop: true },
  "music/ep05/tanpura_drone_low": { lufs: -28.0, seconds: 33.714, loop: true },
  // the low drone 7 dB hotter (same loop), so it can reach the wordless level without gain above unity
  "music/ep05/tanpura_drone_low_hot": { lufs: -21.0, seconds: 33.714, loop: true },
  "music/ep05/play_plucks": { lufs: -24.0, seconds: 8.211, loop: true },
  "music/ep05/tabla_soft": { lufs: -24.0, seconds: 9.87, loop: true },
  "music/ep05/drum_pulse_hot": { lufs: -17.0, seconds: 6.0, loop: true },
  "music/ep05/drum_pulse_fast_hot": { lufs: -17.0, seconds: 4.0, loop: true },
  "music/ep05/tabla_run": { lufs: -20.1, seconds: 2.694, loop: false },
  "music/ep05/cheeky_pluck_1": { lufs: -20.0, seconds: 2.511, loop: false },
  "music/ep05/cheeky_pluck_2": { lufs: -20.0, seconds: 2.405, loop: false },
  "music/ep05/cheeky_pluck_3": { lufs: -20.0, seconds: 1.382, loop: false },
  "music/ep05/cheeky_pluck_4": { lufs: -20.0, seconds: 2.356, loop: false },
  "music/ep05/tension_rise": { lufs: -20.0, seconds: 1.3, loop: false },
  "music/ep05/drum_hit_low": { lufs: -20.0, seconds: 2.6, loop: false },
  "music/ep05/bansuri_relief": { lufs: -20.0, seconds: 12.311, loop: false },
  "music/ep05/bansuri_compassion": { lufs: -20.0, seconds: 9.529, loop: false },
};
const M = (name: string) => `music/ep05/${name}`;
const libFrames = (name: string) => Math.floor(MUSIC_LIB[M(name)].seconds * 24);

/** Gain ceiling for any music layer (never above unity). */
const MUSIC_VOL_MAX = 1.0;
const lufsToVol = (target: number, file: string) =>
  Math.min(MUSIC_VOL_MAX, Math.pow(10, (target - (MUSIC_LIB[file]?.lufs ?? -20)) / 20));

interface MusicCue {
  beat: string;
  file: string;
  from: number;
  to: number;
  fadeIn: number;
  fadeOut: number;
  /** Target loudness of this layer while someone speaks (LUFS in the mix). */
  under: number;
  /** Target loudness of this layer in wordless moments (LUFS in the mix). */
  open: number;
  /** A one-shot figure (phrase, pluck, roll, hit): never looped. */
  hit?: boolean;
}

const RELIEF_F = libFrames("bansuri_relief"); // 295 f
const COMPASSION_F = libFrames("bansuri_compassion"); // 228 f
const RISE_F = Math.round(MUSIC_LIB[M("tension_rise")].seconds * 24); // 31 f
/** Scene crossfade overlap. */
const XF = 12;

/* level presets (LUFS in the mix) */
const DRONE = { under: -36, open: -23.5 };
const LOW_DRONE = { under: -36, open: -23 };
const PLUCKS = { under: -37, open: -24.5 };
const TABLA = { under: -38, open: -25.5 };
/** a comic pluck figure */
const PLUCK_HIT = { under: -31, open: -22.5 };
/** a bansuri phrase: clearly there under a voice, singing in the open */
const BANSURI = { under: -31, open: -21.5 };

/* cue start anchors shared with SFX */
const S02_RELIEF_AT = NO_MARK - 34; // enters on "ওমা! কোথাও তো…", climbing through "দাগও নেই", held high note in P3
const S02_AFTERGLOW_AT = A(S02, AG7, 0);
const S03_MONTAGE_1_AT = A(S03, L.places, -10);
const S03_MONTAGE_2_AT = PLACE_RIVER - 8;
const S04_ANSWER_AT = A(S04, L.truth2, 8);
/** P9 (glow beat 2): the warm phrase is placed so its last notes come down as Scene 04 dissolves into Scene 05. */
const S04_GLOW_AT = S(S05, 24) - RELIEF_F;
const S05_RIVER_AT = A(S05, "P11", -12);
const OUT_RELIEF_AT = S(OUTRO, 110);

const MUSIC_CUES: readonly MusicCue[] = [
  /* Intro and source card (the series theme as Ghibli Episode 4): tanpura, the warm bansuri over the title, soft tabla
     with the source card, the tender phrase carrying over the cut into Scene 01's world moment (AG1) */
  { beat: "M0-IntroDrone", file: M("tanpura_drone"), from: 0, to: S(S01, 30), fadeIn: 6, fadeOut: 30, under: -35, open: -24.5 },
  { beat: "M0-IntroBansuri", file: M("bansuri_relief"), from: 0, to: RELIEF_F, fadeIn: 2, fadeOut: 12, under: -32, open: -20.5, hit: true },
  { beat: "M0-SourceTabla", file: M("tabla_soft"), from: S(SOURCE, -18), to: S(S01, 12), fadeIn: 30, fadeOut: 24, under: -38, open: -24.5 },
  { beat: "M0-CarryBansuri", file: M("bansuri_compassion"), from: S(S01, -96), to: S(S01, -96) + COMPASSION_F, fadeIn: 2, fadeOut: 12, under: -34, open: -21.5, hit: true },

  /* Scene 01: drone + light playful plucks under the chat (brightest in P1) -> pluck + tabla tiptoe (the slip) ->
     drone alone (shot 4, P2, AG3) -> the jolt on Binoy's shout -> low drone (Charu's alarm) -> quick pulse + tabla run */
  { beat: "M1-ChatDrone", file: M("tanpura_drone"), from: S(S01), to: A(S01, L.shout, 8), fadeIn: 30, fadeOut: 10, ...DRONE },
  { beat: "M1-ChatPlucks", file: M("play_plucks"), from: A(S01, L.kachari, -16), to: A(S01, AG2, 14), fadeIn: 30, fadeOut: 20, ...PLUCKS },
  { beat: "M1-SlipPluck", file: M("cheeky_pluck_3"), from: A(S01, AG2, 6), to: A(S01, AG2, 40), fadeIn: 1, fadeOut: 8, ...PLUCK_HIT, hit: true },
  { beat: "M1-SlipTabla", file: M("tabla_soft"), from: A(S01, AG2, -2), to: Z(S01, AG2, 8), fadeIn: 10, fadeOut: 14, ...TABLA, open: -24 },
  { beat: "M1-ShoutHit", file: M("drum_hit_low"), from: A(S01, L.shout, -1), to: A(S01, L.shout, 61), fadeIn: 1, fadeOut: 14, under: -27, open: -22, hit: true },
  { beat: "M1-AlarmLowDrone", file: M("tanpura_drone_low_hot"), from: A(S01, L.shout, 0), to: A(S02, L.noMark, 30), fadeIn: 14, fadeOut: 36, under: -35, open: -24.5 },
  { beat: "M1-RunPulse", file: M("drum_pulse_fast_hot"), from: A(S01, L.run, 0), to: Z(S01, AG4, 6), fadeIn: 18, fadeOut: 6, under: -35, open: -27 },
  { beat: "M1-RunTabla", file: M("tabla_run"), from: A(S01, AG4, 2), to: A(S01, AG4, 66), fadeIn: 2, fadeOut: 10, under: -31, open: -24.5, hit: true },

  /* Scene 02: the heartbeat while the bite is held, stopping dead as the hands arrive (AG5) -> the warm bansuri on
     "দাগও নেই" (glow beat 1, P3) over a warm drone -> flashback: playful plucks + tabla -> the rise into the bite ->
     Balak's teasing pluck -> Binoy's sheepish pluck -> the tender phrase over the afterglow (P4), fading with the picture */
  { beat: "M2-BitePulse", file: M("drum_pulse_hot"), from: S(S02, -6), to: A(S02, AG5, 2), fadeIn: 8, fadeOut: 3, under: -32, open: -25 },
  { beat: "M2-ReliefBansuri", file: M("bansuri_relief"), from: S02_RELIEF_AT, to: S02_RELIEF_AT + RELIEF_F, fadeIn: 2, fadeOut: 12, under: -30, open: -21, hit: true },
  { beat: "M2-WarmDrone", file: M("tanpura_drone"), from: A(S02, L.noMark, 10), to: S(CB1, 10), fadeIn: 36, fadeOut: 24, ...DRONE },
  { beat: "M2-PlayPlucks", file: M("play_plucks"), from: A(S02, L.account2, -8), to: TOWARD_BITE + 6, fadeIn: 24, fadeOut: 20, ...PLUCKS },
  { beat: "M2-PlayTabla", file: M("tabla_soft"), from: A(S02, L.account2, 0), to: TOWARD_BITE + 14, fadeIn: 24, fadeOut: 20, ...TABLA },
  { beat: "M2-BiteRise", file: M("tension_rise"), from: KHOP - RISE_F, to: KHOP + 2, fadeIn: 2, fadeOut: 3, under: -27, open: -24, hit: true },
  { beat: "M2-BiteHit", file: M("drum_hit_low"), from: KHOP - 1, to: KHOP + 61, fadeIn: 1, fadeOut: 14, under: -26, open: -22, hit: true },
  { beat: "M2-TeasePluck", file: M("cheeky_pluck_2"), from: P(S02, "দেখাচ্ছি মজা", 0, L.balakTortoise), to: P(S02, "দেখাচ্ছি মজা", 57, L.balakTortoise), fadeIn: 1, fadeOut: 10, ...PLUCK_HIT, hit: true },
  { beat: "M2-SheepishPluck", file: M("cheeky_pluck_1"), from: A(S02, L.shouted, 10), to: A(S02, L.shouted, 70), fadeIn: 1, fadeOut: 10, under: -32, open: -24, hit: true },
  { beat: "M2-AfterglowBansuri", file: M("bansuri_compassion"), from: S02_AFTERGLOW_AT, to: S(CB1, 12), fadeIn: 2, fadeOut: 36, under: -33, open: -21.5, hit: true },

  /* Scene 03: the wistful low drone alone (no melody under the scolding) -> the tender bansuri twice across the montage
     (the second settles on Sa in P5 at the river) -> the drone fades in P6 */
  { beat: "M3-WistfulLowDrone", file: M("tanpura_drone_low_hot"), from: S(S03, -4), to: Z(S03, "P6", 6), fadeIn: 20, fadeOut: 40, under: -36, open: -22.5 },
  { beat: "M3-MontageBansuri1", file: M("bansuri_compassion"), from: S03_MONTAGE_1_AT, to: S03_MONTAGE_1_AT + COMPASSION_F, fadeIn: 2, fadeOut: 12, ...BANSURI, hit: true },
  { beat: "M3-MontageBansuri2", file: M("bansuri_compassion"), from: S03_MONTAGE_2_AT, to: S03_MONTAGE_2_AT + COMPASSION_F, fadeIn: 2, fadeOut: 12, ...BANSURI, hit: true },

  /* Scene 04: drone (the grove) -> plucks on the cow's two tugs -> the door bang + quick pulse (Haricharan's run) ->
     a held low drone under his anger, the soft heartbeat under his second question and Balak's dilemma, stopping on
     "না—" -> P8 near-silence -> no music under Truth 1 -> a small pluck on the sputter -> the compassion bansuri under
     Balak's answer (Truth 2) over a warm drone -> a soft low grumble as he storms off -> the warm phrase coming down
     over the cow's trust (glow beat 2, P9) */
  { beat: "M4-GroveDrone", file: M("tanpura_drone"), from: S(S04, -XF), to: A(S04, AG11, 10), fadeIn: 24, fadeOut: 20, under: -36, open: -23 },
  { beat: "M4-CowTugPluck1", file: M("cheeky_pluck_1"), from: A(S04, AG10, 8), to: A(S04, AG10, 68), fadeIn: 1, fadeOut: 10, ...PLUCK_HIT, hit: true },
  { beat: "M4-CowTugPluck2", file: M("cheeky_pluck_4"), from: A(S04, AG10, 50), to: A(S04, AG10, 106), fadeIn: 1, fadeOut: 10, ...PLUCK_HIT, hit: true },
  { beat: "M4-DoorHit", file: M("drum_hit_low"), from: A(S04, AG11, 2), to: A(S04, AG11, 64), fadeIn: 1, fadeOut: 14, under: -28, open: -22, hit: true },
  { beat: "M4-RunPulse", file: M("drum_pulse_fast_hot"), from: A(S04, AG11, 4), to: A(S04, L.q1, 24), fadeIn: 6, fadeOut: 22, under: -35, open: -26 },
  { beat: "M4-AngerLowDrone", file: M("tanpura_drone_low_hot"), from: A(S04, AG11, 0), to: Z(S04, L.inner2, 4), fadeIn: 24, fadeOut: 44, ...LOW_DRONE },
  { beat: "M4-RantPluck", file: M("cheeky_pluck_3"), from: P(S04, "কচি কচি শশা", 0, L.cucumber), to: P(S04, "কচি কচি শশা", 33, L.cucumber), fadeIn: 1, fadeOut: 8, under: -32, open: -23, hit: true },
  { beat: "M4-DilemmaPulse", file: M("drum_pulse_hot"), from: A(S04, L.q2, -6), to: DECISION, fadeIn: 30, fadeOut: 3, under: -33, open: -26 },
  { beat: "M4-SputterPluck", file: M("cheeky_pluck_3"), from: A(S04, L.sputter, 4), to: A(S04, L.sputter, 37), fadeIn: 1, fadeOut: 8, under: -32, open: -23, hit: true },
  { beat: "M4-AnswerDrone", file: M("tanpura_drone"), from: A(S04, L.truth2, -10), to: S(S05, 30), fadeIn: 36, fadeOut: 40, ...DRONE },
  { beat: "M4-AnswerBansuri", file: M("bansuri_compassion"), from: S04_ANSWER_AT, to: S04_ANSWER_AT + COMPASSION_F, fadeIn: 2, fadeOut: 12, ...BANSURI, hit: true },
  { beat: "M4-GrumbleHit", file: M("drum_hit_low"), from: A(S04, AG12, 4), to: A(S04, AG12, 66), fadeIn: 1, fadeOut: 14, under: -32, open: -25.5, hit: true },
  // silent under Haricharan's storm (under: -44); its held high note opens as he leaves, the descent falls in P9
  { beat: "M4-GlowBansuri", file: M("bansuri_relief"), from: S04_GLOW_AT, to: S04_GLOW_AT + RELIEF_F, fadeIn: 2, fadeOut: 14, under: -44, open: -21.5, hit: true },

  /* Scene 05: dry and comic: light tabla, a pluck after Haricharan's quote, one on the junior clerk's wild guess
     (cut for P10's silence), the tumble on the verdict -> a serene bansuri rising in P11 and settling on Sa over the
     riverbank (AG14) -> the outro theme */
  { beat: "M5-ClerkTabla", file: M("tabla_soft"), from: S(S05, -6), to: A(S05, "P10", 2), fadeIn: 30, fadeOut: 6, under: -38, open: -24 },
  // a quiet drone under the office (tabla_soft is already at unity in AG13); it drops out with the tabla for P10's silence
  { beat: "M5-ClerkDrone", file: M("tanpura_drone"), from: S(S05, 6), to: A(S05, "P10", 4), fadeIn: 30, fadeOut: 8, under: -38, open: -25 },
  { beat: "M5-QuotePluck", file: M("cheeky_pluck_3"), from: Z(S05, L.report, -3), to: Z(S05, L.report, 30), fadeIn: 1, fadeOut: 8, ...PLUCK_HIT, hit: true },
  { beat: "M5-GuessPluck", file: M("cheeky_pluck_2"), from: P(S05, "আসতে পারে", -6, L.fedIt), to: A(S05, "P10", 6), fadeIn: 1, fadeOut: 8, ...PLUCK_HIT, hit: true },
  { beat: "M5-VerdictTabla", file: M("tabla_soft"), from: A(S05, L.verdict, 6), to: A(S05, AG14, 10), fadeIn: 24, fadeOut: 30, under: -38, open: -25.5 },
  { beat: "M5-VerdictDrone", file: M("tanpura_drone"), from: A(S05, L.verdict, 0), to: A(S05, "P11", 6), fadeIn: 24, fadeOut: 12, under: -38, open: -25 },
  { beat: "M5-VerdictPluck", file: M("cheeky_pluck_4"), from: P(S05, "অদ্ভুত পদার্থ", 0, L.verdict), to: P(S05, "অদ্ভুত পদার্থ", 56, L.verdict), fadeIn: 1, fadeOut: 10, ...PLUCK_HIT, hit: true },
  { beat: "M5-RiverDrone", file: M("tanpura_drone"), from: A(S05, "P11", -6), to: EP05R_TOTAL_FRAMES, fadeIn: 36, fadeOut: 36, under: -35, open: -23.5 },
  { beat: "M5-RiverBansuri", file: M("bansuri_compassion"), from: S05_RIVER_AT, to: S05_RIVER_AT + COMPASSION_F, fadeIn: 2, fadeOut: 12, under: -33, open: -21.5, hit: true },

  /* Outro: the warm phrase under the closing words, the tender phrase settling on Sa at the very end */
  { beat: "M9-OutroBansuri", file: M("bansuri_relief"), from: OUT_RELIEF_AT, to: OUT_RELIEF_AT + RELIEF_F, fadeIn: 2, fadeOut: 12, under: -34, open: -21, hit: true },
  { beat: "M9-OutroEndBansuri", file: M("bansuri_compassion"), from: EP05R_TOTAL_FRAMES - COMPASSION_F, to: EP05R_TOTAL_FRAMES, fadeIn: 2, fadeOut: 36, under: -34, open: -21.5, hit: true },
];

const MUSIC_PLACED = MUSIC_CUES.filter((c) => MUSIC_LIB[c.file] !== undefined && c.to > c.from);

const cueFrames = (c: MusicCue): number => {
  const lib = MUSIC_LIB[c.file];
  const win = c.to - c.from;
  return lib && !lib.loop ? Math.max(1, Math.min(win, Math.floor(lib.seconds * 24))) : win;
};

const musicVolume = (c: MusicCue) => {
  const len = cueFrames(c);
  const open = lufsToVol(c.open, c.file);
  const under = Math.min(open, lufsToVol(c.under, c.file));
  return (f: number) => {
    const abs = c.from + f;
    const edge = ease(Math.min(f / Math.max(1, c.fadeIn), (len - f) / Math.max(1, c.fadeOut)));
    return (open + (under - open) * musicSpeech(abs)) * edge;
  };
};

/* ------------------------------------------------------------------ */
/* 6B. One-shot and action SFX (0.15 to 0.45; AUD-02)                  */
/* ------------------------------------------------------------------ */

const SFX_SECONDS: Record<string, number> = {
  "sfx/chime_pop.wav": 1.2,
  "sfx/soft_magical_shimmer.wav": 2.5,
  "sfx/ep02/cloth_rustle.wav": 1.2,
  "sfx/ep02/sand_pat.wav": 3.0,
  "sfx/ep02/door_creak.wav": 1.8,
  "sfx/ep02/hooves_soft.wav": 4.0,
  "sfx/ep02/rice_spill.wav": 1.5,
  "sfx/ep02/oars_water.wav": 4.0,
  "sfx/ep02/paper_rustle.wav": 1.0,
  "sfx/ep02/footsteps_mud.wav": 3.0,
  "sfx/ep02/footsteps_floor.wav": 3.0,
  "sfx/ep06/khadam_floor.wav": 4.55,
  "sfx/ep06/hens_scatter.wav": 1.45,
  "sfx/ep06/crow_caw.wav": 1.42,
  "sfx/ep06/sparrow_chirp.wav": 1.9,
  [`${E5}/shell_scrape.wav`]: 1.45,
  [`${E5}/vine_tear.wav`]: 1.8,
  [`${E5}/cow_munch.wav`]: 3.2,
  [`${E5}/bamboo_thump.wav`]: 0.4,
  [`${E5}/cow_breath.wav`]: 1.2,
  [`${R5}/run_barefoot_pair.wav`]: 3.0,
  [`${R5}/run_barefoot_single.wav`]: 2.23,
  [`${R5}/shell_knock.wav`]: 0.6,
  [`${R5}/tortoise_scrabble.wav`]: 2.0,
  [`${R5}/tortoise_hiss_soft.wav`]: 0.63,
  [`${R5}/chil_kite_call.wav`]: 3.5,
  [`${R5}/quill_scratch.wav`]: 4.7,
  [`${R5}/palm_fan_flap.wav`]: 2.6,
  [`${LIFE}/pigeon_flutter.wav`]: 2.2,
  [`${LIFE}/pigeons_coo.wav`]: 2.1,
  [`${LIFE}/kingfisher_call.wav`]: 1.65,
  [`${LIFE}/small_splash.wav`]: 0.93,
  [`${LIFE}/cow_bell_distant.wav`]: 2.4,
  [`${LIFE}/squirrel_chirp.wav`]: 2.2,
};

interface PlacedSfx {
  /** what the sound is in the picture (for the scene agents' retiming reports) */
  id: string;
  /** path under public/audio/ */
  file: string;
  /** absolute start: an anchor helper + offset (S, X, A, Z, P above) */
  from: number;
  volume: number;
  /** play only this many frames (faded); the file loops if the window is longer than it */
  frames?: number;
  fadeIn?: number;
  fadeOut?: number;
  rate?: number;
}

/**
 * THE SFX TABLE. First timings are from the blueprint's shot tables (the scenes were still being staged); each row's
 * `from` is anchor + offset, so a scene agent's "X happens at <span> + N" is a one-number change.
 * Sound onsets inside the files (READMEs): shell_knock 0.02 s, bamboo_thump 0.02 s, vine_tear snaps 0.35 / 0.65 s,
 * cow_breath strongest 0.15 to 0.45 s, shell_scrape scrape 0 to 0.95 s then a knock at 1.02 s, run_barefoot_single
 * last step 1.73 s, tortoise_scrabble strongest 0.75 to 0.95 s, drum hits 0.03 s (music table).
 */
const PLACED_SFX: readonly PlacedSfx[] = [
  /* Intro chime (blueprint: 0.30) */
  { id: "intro chime", file: "sfx/chime_pop.wav", from: 0, volume: 0.3 },

  /* Scene 01 */
  { id: "AG1 pigeons lift from the kachari roof", file: `${LIFE}/pigeon_flutter.wav`, from: A(S01, AG1, 10), volume: 0.18 },
  { id: "shot 1 the sparrow on the eave (Balak glances up)", file: "sfx/ep06/sparrow_chirp.wav", from: P(S01, "আর ছোট্ট বীরু", 16, L.kachari), volume: 0.15 },
  { id: "shot 2 Charu wags her finger (sari rustle)", file: "sfx/ep02/cloth_rustle.wav", from: A(S01, L.eyeOnHim, 30), volume: 0.15 },
  { id: "AG2 Balak's tiptoe pats off the plinth", file: "sfx/ep02/sand_pat.wav", from: A(S01, AG2, 16), volume: 0.16, frames: 46, fadeIn: 4, fadeOut: 12 },
  { id: "AG3 a crow caws on the fence", file: "sfx/ep06/crow_caw.wav", from: A(S01, AG3, 10), volume: 0.2 },
  { id: "shot 5 hens scatter at Binoy's shout", file: "sfx/ep06/hens_scatter.wav", from: A(S01, L.shout, 8), volume: 0.28 },
  { id: "shot 7 Surendra springs up, khadam clack", file: "sfx/ep06/khadam_floor.wav", from: A(S01, L.run, 10), volume: 0.25, frames: 40, fadeIn: 2, fadeOut: 10 },
  { id: "AG4 Charu and Surendra run barefoot through the fence gap", file: `${R5}/run_barefoot_pair.wav`, from: A(S01, AG4, 2), volume: 0.38 },

  /* Scene 02 */
  { id: "shot 8 T2 hangs on, shell scrapes the earth", file: `${E5}/shell_scrape.wav`, from: A(S02, L.bitten, 44), volume: 0.15 },
  { id: "shot 9 Charu drops to her knees", file: "sfx/ep02/cloth_rustle.wav", from: A(S02, L.freeHand, 8), volume: 0.15 },
  { id: "AG5 T2 opens its jaws and draws its head in (hiss)", file: `${R5}/tortoise_hiss_soft.wav`, from: A(S02, AG5, 8), volume: 0.24 },
  { id: "AG5 T2 drops to the earth", file: `${E5}/shell_scrape.wav`, from: A(S02, AG5, 14), volume: 0.16 },
  { id: "AG5 T2 plods off toward the basket", file: `${R5}/tortoise_scrabble.wav`, from: A(S02, AG5, 24), volume: 0.18 },
  { id: "P3 glow beat 1 shimmer", file: "sfx/soft_magical_shimmer.wav", from: A(S02, "P3", 0), volume: 0.15 },
  { id: "shot 13 Balak rolls T1 onto its back", file: `${E5}/shell_scrape.wav`, from: P(S02, "উল্টে দিচ্ছে", -4, L.account2), volume: 0.15 },
  { id: "shot 13 T1's legs paddle", file: `${R5}/tortoise_scrabble.wav`, from: P(S02, "উল্টে দিচ্ছে", 30, L.account2), volume: 0.16 },
  { id: "AG6 Balak rights T1 (shell lands)", file: `${R5}/shell_knock.wav`, from: A(S02, AG6, 26), volume: 0.22 },
  { id: "AG6 T1's claws catch the ground", file: `${R5}/tortoise_scrabble.wav`, from: A(S02, AG6, 32), volume: 0.16 },
  { id: "shot 14 another tortoise turned over", file: `${E5}/shell_scrape.wav`, from: A(S02, L.account3, 36), volume: 0.15 },
  { id: "shot 14 T2's head shoots out (hiss before the clamp)", file: `${R5}/tortoise_hiss_soft.wav`, from: KHOP - 5, volume: 0.24 },
  { id: "AG7 Binoy's bag slips off", file: "sfx/ep02/cloth_rustle.wav", from: A(S02, AG7, 2), volume: 0.15 },
  // blueprint AG7: the shout as a soft echo of 01e (about -10 dB), its first words only, fading into the dissolve
  { id: "AG7 echo of Binoy's shout (01e)", file: "ep05_ghibli_rewrite/01e_Binoy_Shout.wav", from: A(S02, AG7, 0), volume: 0.3, frames: 28, fadeIn: 2, fadeOut: 10 },
  { id: "P4 T2 pokes its head out toward Balak", file: `${R5}/tortoise_scrabble.wav`, from: A(S02, "P4", 12), volume: 0.15, frames: 30, fadeIn: 2, fadeOut: 8 },

  /* Chapter break CB1 (blueprint: 0.18) */
  { id: "CB1 chime", file: "sfx/chime_pop.wav", from: S(CB1, 4), volume: 0.18 },

  /* Scene 03 */
  { id: "AG8 a sparrow in the yard", file: "sfx/ep06/sparrow_chirp.wav", from: A(S03, AG8, 22), volume: 0.16 },
  { id: "shot 18 Balak rises and walks off quietly", file: "sfx/ep02/sand_pat.wav", from: Z(S03, L.scold, -22), volume: 0.15, frames: 40, fadeIn: 4, fadeOut: 12 },
  { id: "shot 20b the kite circling over the debdaru", file: `${R5}/chil_kite_call.wav`, from: PLACE_FIELD + 36, volume: 0.18 },
  { id: "P5 the kingfisher's call", file: `${LIFE}/kingfisher_call.wav`, from: A(S03, "P5", 0), volume: 0.18, frames: 20, fadeIn: 1, fadeOut: 4 },
  { id: "P5 the kingfisher's dive (splash)", file: `${LIFE}/small_splash.wav`, from: A(S03, "P5", 22), volume: 0.28 },
  { id: "P6 Charu goes back to cleaning rice in the thali", file: "sfx/ep02/rice_spill.wav", from: A(S03, "P6", -6), volume: 0.15 },

  /* Scene 04 */
  { id: "AG9 a far cattle bell (the cow is near)", file: `${LIFE}/cow_bell_distant.wav`, from: A(S04, AG9, 34), volume: 0.22 },
  { id: "AG10 the cow munches at the trellis", file: `${E5}/cow_munch.wav`, from: A(S04, AG10, 2), volume: 0.2, frames: 44, fadeIn: 2, fadeOut: 10 },
  { id: "AG10 the vine tears off, the root comes out", file: `${E5}/vine_tear.wav`, from: A(S04, AG10, 20), volume: 0.26 },
  { id: "AG10 she ambles past Balak to the banana clump", file: "sfx/ep02/hooves_soft.wav", from: A(S04, AG10, 50), volume: 0.18, frames: 44, fadeIn: 4, fadeOut: 12 },
  { id: "AG11 the back door bangs open", file: "sfx/ep02/door_creak.wav", from: A(S04, AG11, 0), volume: 0.3, frames: 26, fadeIn: 1, fadeOut: 8 },
  { id: "AG11 Haricharan runs out and stops over Balak", file: `${R5}/run_barefoot_single.wav`, from: A(S04, AG11, 3), volume: 0.36, rate: 1.2 },
  { id: "shot 27 the bamboo end taps the earth once", file: `${E5}/bamboo_thump.wav`, from: A(S04, L.q2, 54), volume: 0.18 },
  { id: "AG12 one bamboo thump on the earth", file: `${E5}/bamboo_thump.wav`, from: A(S04, AG12, 6), volume: 0.24 },
  { id: "AG12 he stomps along the path", file: "sfx/ep02/footsteps_mud.wav", from: A(S04, AG12, 14), volume: 0.26, frames: 30, fadeIn: 3, fadeOut: 10 },
  { id: "AG12 the kachari back door shuts", file: "sfx/ep02/door_creak.wav", from: Z(S04, AG12, -18), volume: 0.24, frames: 24, fadeIn: 1, fadeOut: 10 },
  { id: "P9 the cow steps out between the trunks", file: "sfx/ep02/hooves_soft.wav", from: A(S04, "P9", 2), volume: 0.15, frames: 26, fadeIn: 3, fadeOut: 10 },
  { id: "P9 glow beat 2 shimmer", file: "sfx/soft_magical_shimmer.wav", from: A(S04, "P9", 24), volume: 0.15 },
  { id: "P9 the cow's soft breath out as he strokes her", file: `${E5}/cow_breath.wav`, from: A(S04, "P9", 42), volume: 0.16 },

  /* Scene 05 */
  { id: "AG13 the senior clerk writes in the ledger", file: `${R5}/quill_scratch.wav`, from: A(S05, AG13, 4), volume: 0.2, frames: 60, fadeIn: 2, fadeOut: 10 },
  { id: "AG13 the junior clerk fans himself", file: `${R5}/palm_fan_flap.wav`, from: A(S05, AG13, 10), volume: 0.18 },
  { id: "AG13 pigeons coo on the roof edge", file: `${LIFE}/pigeons_coo.wav`, from: A(S05, AG13, 2), volume: 0.16 },
  { id: "AG13 Haricharan stomps up the steps", file: "sfx/ep02/footsteps_floor.wav", from: A(S05, AG13, 30), volume: 0.2, frames: 28, fadeIn: 3, fadeOut: 8 },
  { id: "shot 35 the junior clerk still fanning (stops in shot 36)", file: `${R5}/palm_fan_flap.wav`, from: A(S05, L.sawEat, 30), volume: 0.15 },
  { id: "P10 a ledger page lifts in the breeze", file: "sfx/ep02/paper_rustle.wav", from: A(S05, "P10", 6), volume: 0.15 },
  { id: "P10 a pigeon coos", file: `${LIFE}/pigeons_coo.wav`, from: A(S05, "P10", 12), volume: 0.16, frames: 26, fadeIn: 1, fadeOut: 6 },
  { id: "shot 37 the senior clerk dips his pen and writes again", file: `${R5}/quill_scratch.wav`, from: Z(S05, L.verdict, -36), volume: 0.18, frames: 44, fadeIn: 2, fadeOut: 10 },
  { id: "AG14 a boat's oars far off on the river", file: "sfx/ep02/oars_water.wav", from: A(S05, AG14, 44), volume: 0.15, frames: 60, fadeIn: 10, fadeOut: 20 },

  /* Outro: the template sparkle at 0.12 (AUD-08a) */
  { id: "outro shimmer", file: "sfx/soft_magical_shimmer.wav", from: S(OUTRO), volume: 0.12 },
];

const sfxDuration = (c: PlacedSfx): number =>
  c.frames ?? Math.max(1, Math.ceil(((SFX_SECONDS[c.file] ?? 2) * 24) / (c.rate ?? 1)));

const sfxVolume = (c: PlacedSfx) => {
  if (c.frames === undefined) return c.volume;
  const frames = c.frames;
  const def = Math.max(1, Math.min(8, Math.floor(frames / 4)));
  const fi = Math.max(1, c.fadeIn ?? def);
  const fo = Math.max(1, c.fadeOut ?? def);
  return (f: number) => c.volume * Math.max(0, Math.min(1, f / fi, (frames - f) / fo));
};

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

    {/* SOUND 6A: ducked ambient beds. Every looped <Audio> uses loopVolumeCurveBehavior="extend": with Remotion's default
        ("repeat") the volume callback's frame restarts on each loop, so the absolute-frame ducking and fades would be wrong. */}
    {BEDS.map((bed) =>
      bed.layers.map((layer) => (
        <Sequence key={`bed-${bed.name}-${layer.file}`} from={bed.from} durationInFrames={Math.max(1, bed.to - bed.from)} layout="none">
          <Audio src={staticFile(`audio/${layer.file}`)} loop loopVolumeCurveBehavior="extend" volume={bedLayerVolume(bed, layer)} />
        </Sequence>
      )),
    )}

    {/* SOUND 6C: the score (AUD-09) */}
    {MUSIC_PLACED.map((c, idx) => (
      <Sequence key={`music-${idx}-${c.beat}`} from={c.from} durationInFrames={cueFrames(c)} layout="none">
        <Audio src={staticFile(`audio/${c.file}.wav`)} loop={MUSIC_LIB[c.file].loop && !c.hit} loopVolumeCurveBehavior="extend" volume={musicVolume(c)} />
      </Sequence>
    ))}

    {/* SOUND 6B: one-shots */}
    {PLACED_SFX.map((c, idx) => (
      <Sequence key={`sfx-${idx}-${c.file}-${c.from}`} from={c.from} durationInFrames={sfxDuration(c)} layout="none">
        <Audio src={staticFile(`audio/${c.file}`)} loop={c.frames !== undefined} loopVolumeCurveBehavior="extend" volume={sfxVolume(c)} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}

    {/* voices (measured clips only) */}
    {VOICES.map((a) => (
      <Sequence key={a.file} from={a.startFrame} durationInFrames={a.frames} layout="none">
        <Audio src={staticFile(`audio/ep05_ghibli_rewrite/${a.file}`)} volume={1} />
      </Sequence>
    ))}

    {/* TTL-14 one-line Bengali captions (none on the title page or the source card) */}
    <SeriesSubtitles cues={EP05R_CUES.filter((c) => c.text !== "ছোটদের বালক ঠাকুরের গল্প—")} />
  </div>
);

