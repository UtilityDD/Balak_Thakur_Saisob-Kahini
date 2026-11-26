import React from "react";
import { AbsoluteFill, Audio, Freeze, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SeriesSubtitles } from "../../episode/SeriesSubtitles";
import { GhibliWashTransition } from "../core/GhibliWashTransition";
import { GhibliScene00bSource } from "../episode03/scenes/GhibliScene00bSource";
import { GhibliChapterBreak, GhibliScene00IntroEp04, GhibliScene99OutroEp04 } from "./Ep04GhibliShared";
import { Scene01ClayShivaGhibli } from "./scenes/Scene01ClayShivaGhibli";
import { Scene02GobindaManglaGhibli } from "./scenes/Scene02GobindaManglaGhibli";
import { Scene03PondStandoffGhibli } from "./scenes/Scene03PondStandoffGhibli";
import { Scene04KailashpatiProphecyGhibli } from "./scenes/Scene04KailashpatiProphecyGhibli";
import { Scene05DhoopAndCoconutGhibli } from "./scenes/Scene05DhoopAndCoconutGhibli";
import { Scene06PriestUproarGhibli } from "./scenes/Scene06PriestUproarGhibli";
import { EP04G_CUES } from "./subtitles";
import { EP04G_AUDIO, EP04G_SCENES, EP04G_TOTAL_FRAMES, ep04gSpan } from "./timing";

/**
 * Studio Ghibli Watercolor + Sepia-Ink Full Production Composition for Episode 4
 * ("পর্ব চার — শিবলিঙ্গ, গোবিন্দ ও নারিকেলোদক", 8,594 frames @ 24 fps, 1920x1080).
 *
 * Sequences all 10 dramatic timeline blocks, hand-painted watercolor wash transitions,
 * ducked Bengal village/pond/shrine/river ambient beds, Indian classical score cues (AUD-07),
 * frame-accurate action SFX, 32 voice clips, and Bengali subtitles.
 */

const INTRO = "00_intro";
const SOURCE = "00b_source_attribution";
const S01 = "01_clay_shiva_swap";
const S02 = "02_gobinda_and_mangla";
const S03 = "03_pond_standoff_and_rescue";
const S04 = "04_kalapahar_to_kailashpati";
const CB1 = "cb1_chapter_break";
const S05 = "05_dhoop_and_coconut_water";
const S06 = "06_priest_uproar_and_ants";
const OUTRO = "99_closing_sequential_outro";

const sceneById = (id: string) => {
  const s = EP04G_SCENES.find((x) => x.sceneId === id);
  if (!s) throw new Error(`Episode04Ghibli: unknown scene ${id}`);
  return s;
};
const sceneStart = (id: string): number => sceneById(id).startFrame;
const sceneEnd = (id: string): number => {
  const s = sceneById(id);
  return s.startFrame + s.durationFrames;
};
const spanAbs = (sceneId: string, key: string) => {
  const base = sceneStart(sceneId);
  const w = ep04gSpan(sceneId, key);
  return { from: base + w.from, to: base + w.to, frames: w.frames };
};

const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

/* ------------------------------------------------------------------ */
/* Chapter-break & bookend fades                                       */
/* ------------------------------------------------------------------ */

const SCENE_FADE: Record<string, { in?: number; out?: number; color?: string }> = {
  [S01]: { in: 14, color: "#1c120a" },
  [S04]: { out: 18, color: "#120d08" },
  [S05]: { in: 24, color: "#120d08" },
  // Scene 06 -> outro is a true cross-dissolve (CAM-09, OUTRO_DISSOLVE below), never a dip to black; the episode ends
  // on a slow gentle fade
  [OUTRO]: { out: 40, color: "#120d08" },
};

/** CAM-09: the outro's first frame dissolves in over the last frames of Scene 06 (image to image). */
const OUTRO_DISSOLVE = 40;
const DissolveIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: ease((f + 1) / frames) }}>{children}</AbsoluteFill>;
};

const EdgeFade: React.FC<{
  fadeIn?: number;
  fadeOut?: number;
  durationFrames: number;
  color?: string;
  children: React.ReactNode;
}> = ({ fadeIn, fadeOut, durationFrames, color = "#120d08", children }) => {
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

/* ------------------------------------------------------------------ */
/* Speech-aware ducking (AUD-03 / AUD-06)                              */
/* ------------------------------------------------------------------ */

const DUCK_RAMP = 10;
const DUCK_MERGE = 20;
const SPEECH: [number, number][] = (() => {
  const spans = EP04G_AUDIO.map((a) => [a.startFrame, a.startFrame + a.frames] as [number, number]).sort(
    (x, y) => x[0] - y[0],
  );
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] - last[1] < DUCK_MERGE) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
})();

const speechAmount = (frame: number, ramp = DUCK_RAMP): number => {
  let amt = 0;
  for (const [a, b] of SPEECH) {
    if (frame < a - ramp) break;
    let t = 0;
    if (frame >= a && frame <= b) t = 1;
    else if (frame < a) t = (frame - (a - ramp)) / ramp;
    else if (frame <= b + ramp) t = 1 - (frame - b) / ramp;
    amt = Math.max(amt, ease(t));
  }
  return amt;
};

const ducked = (open: number, under: number, frame: number, cap = 0.22, ramp = DUCK_RAMP): number => {
  const o = Math.min(cap, open);
  const u = Math.min(o, under);
  return o + (u - o) * speechAmount(frame, ramp);
};

/* ------------------------------------------------------------------ */
/* Ambient Beds (<= 0.22 open, <= 0.07 under speech)                   */
/* ------------------------------------------------------------------ */

interface BedLayer {
  file: string;
  open: number;
  under: number;
}
interface Bed {
  name: string;
  from: number;
  to: number;
  fadeIn: number;
  fadeOut: number;
  layers: BedLayer[];
}

const BED_TAIL = 8;

/** The shared Ghibli life kit (STO-22b): `public/audio/sfx/ghibli_life/` (lengths, levels and credits in its README). */
const LIFE = "sfx/ghibli_life";

const BEDS: readonly Bed[] = [
  {
    name: "01-courtyard-morning",
    from: sceneStart(S01),
    to: sceneStart(S02) + 12,
    fadeIn: 24,
    fadeOut: 24,
    // STO-22b world layer: the Birbhum dawn chorus leads, the older village birds and wind sit lower under it
    layers: [
      { file: "sfx/ep02/birds_village.wav", open: 0.12, under: 0.05 },
      { file: "sfx/ep02/wind_soft.wav", open: 0.07, under: 0.04 },
      { file: `${LIFE}/dawn_birds_loop.wav`, open: 0.15, under: 0.06 },
      { file: `${LIFE}/wind_leaves.wav`, open: 0.09, under: 0.05 },
    ],
  },
  {
    name: "02-03-pond-day",
    from: sceneStart(S02) - 10,
    to: sceneStart(S04) + 12,
    fadeIn: 24,
    fadeOut: 24,
    // STO-22b: the ghat's lapping water and the ducks' paddling lead; river water, birds and wind lowered under them
    layers: [
      { file: "sfx/ep02/birds_village.wav", open: 0.1, under: 0.05 },
      { file: "sfx/ep02/wind_soft.wav", open: 0.08, under: 0.04 },
      { file: "sfx/river_water.wav", open: 0.08, under: 0.04 },
      { file: `${LIFE}/pond_lapping_loop.wav`, open: 0.16, under: 0.07 },
      { file: `${LIFE}/water_glide.wav`, open: 0.12, under: 0.06 },
      { file: `${LIFE}/dawn_birds_loop.wav`, open: 0.08, under: 0.04 },
    ],
  },
  {
    name: "04-courtyard-afternoon",
    from: sceneStart(S04) - 10,
    to: sceneStart(CB1) + BED_TAIL,
    fadeIn: 24,
    fadeOut: 22,
    layers: [
      { file: "sfx/ep02/birds_village.wav", open: 0.16, under: 0.06 },
      { file: "sfx/ep02/wind_soft.wav", open: 0.06, under: 0.04 },
      { file: `${LIFE}/wind_leaves.wav`, open: 0.08, under: 0.05 },
    ],
  },
  {
    name: "05-06-evening-shrine",
    from: sceneStart(S05),
    to: sceneStart(OUTRO) + BED_TAIL,
    fadeIn: 28,
    fadeOut: 24,
    // STO-22b: the Indian village night insects lead; the older cricket bed is lowered under them
    layers: [
      { file: "ambient/bengal_night_crickets.wav", open: 0.07, under: 0.03 },
      { file: "sfx/ep02/lantern_hiss.wav", open: 0.05, under: 0.03 },
      { file: `${LIFE}/night_crickets_loop.wav`, open: 0.15, under: 0.06 },
    ],
  },
  {
    name: "99-outro-padma",
    from: sceneStart(OUTRO),
    to: EP04G_TOTAL_FRAMES,
    fadeIn: 24,
    fadeOut: 36,
    layers: [{ file: "ambient/padma_river_day.wav", open: 0.22, under: 0.07 }],
  },
];

const bedLayerVolume = (bed: Bed, layer: BedLayer) => (f: number) => {
  const abs = bed.from + f;
  const len = bed.to - bed.from;
  const edge = Math.max(0, Math.min(1, f / Math.max(1, bed.fadeIn), (len - f) / Math.max(1, bed.fadeOut)));
  return ducked(layer.open, layer.under, abs, 0.22) * edge;
};

/* ------------------------------------------------------------------ */
/* Indian Classical Score Cues (AUD-07, AUD-09: the recorded music/ep05 library only)                         */
/* ------------------------------------------------------------------ */

/**
 * AUD-09 (2026-11-25): the score is the recorded Indian instrument library in `public/audio/music/ep05/` (tanpura
 * drones, bansuri phrases, tabla, swarmandal plucks; README there). The synthesised Theme_Intro_Bansuri,
 * Village_Peace_Loop, Warm_Family_Flute and Divine_Motif are no longer used in this episode.
 *
 * TV-show balance: each cue gives its layer's target loudness in the mix (LUFS) `open` (wordless moments: intro
 * gaps, AG1-AG7, pauses, the chapter break, the outro tail) and `under` (while someone speaks). The layers of a
 * wordless stretch sum to about -22 LUFS; under the voices (-16 LUFS) the music sits about 12-18 dB lower. Music
 * ducks on its own speech map (`MUSIC_SPEECH`: gaps under 30 frames stay ducked, a 14-frame ramp) so it does not
 * pump in the short breaths between sentences.
 *
 * Key: the library is in C (Sa = C). `tanpura_drone_cs` is in C# (it was made for the C# Divine_Motif), so it is not
 * used under the C bansuri phrases.
 */

interface MusicFile {
  lufs: number;
  seconds: number;
  loop: boolean;
}

const MUSIC_LIB: Record<string, MusicFile> = {
  "music/ep05/tanpura_drone": { lufs: -24.0, seconds: 33.714, loop: true },
  // the low drone 7 dB hotter (same loop), so it can reach the wordless level without gain above unity
  "music/ep05/tanpura_drone_low_hot": { lufs: -21.0, seconds: 33.714, loop: true },
  "music/ep05/play_plucks": { lufs: -24.0, seconds: 8.211, loop: true },
  "music/ep05/cheeky_plucks": { lufs: -19.8, seconds: 14.0, loop: true },
  "music/ep05/tabla_soft": { lufs: -24.0, seconds: 9.87, loop: true },
  "music/ep05/drum_pulse": { lufs: -24.0, seconds: 6.0, loop: true },
  "music/ep05/drum_pulse_fast": { lufs: -24.0, seconds: 4.0, loop: true },
  "music/ep05/tabla_run": { lufs: -20.1, seconds: 2.694, loop: false },
  "music/ep05/cheeky_pluck_1": { lufs: -20.0, seconds: 2.511, loop: false },
  "music/ep05/cheeky_pluck_2": { lufs: -20.0, seconds: 2.405, loop: false },
  "music/ep05/cheeky_pluck_3": { lufs: -20.0, seconds: 1.382, loop: false },
  "music/ep05/tension_rise": { lufs: -20.0, seconds: 1.3, loop: false },
  "music/ep05/drum_hit_low": { lufs: -20.0, seconds: 2.6, loop: false },
  "music/ep05/bansuri_relief": { lufs: -20.0, seconds: 12.311, loop: false },
  "music/ep05/bansuri_compassion": { lufs: -20.0, seconds: 9.529, loop: false },
};

/** Gain ceiling for any music layer (never above unity; the library files are -20 to -28 LUFS). */
const MUSIC_VOL_MAX = 1.0;

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
  /** A one-shot figure (pluck, roll, hit): never looped. */
  hit?: boolean;
}

const lufsToVol = (target: number, file: string) =>
  Math.min(MUSIC_VOL_MAX, Math.pow(10, (target - (MUSIC_LIB[file]?.lufs ?? -20)) / 20));

/* Music's own speech map: the voice spans, gaps under MUSIC_MERGE frames bridged (no swell in a breath). */
const MUSIC_RAMP = 14;
const MUSIC_MERGE = 30;
const MUSIC_SPEECH: [number, number][] = (() => {
  const spans = EP04G_AUDIO.map((a) => [a.startFrame, a.startFrame + a.frames] as [number, number]).sort(
    (x, y) => x[0] - y[0],
  );
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] - last[1] < MUSIC_MERGE) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
})();
const musicSpeech = (frame: number): number => {
  let amt = 0;
  for (const [a, b] of MUSIC_SPEECH) {
    if (frame < a - MUSIC_RAMP) break;
    let t = 0;
    if (frame >= a && frame <= b) t = 1;
    else if (frame < a) t = (frame - (a - MUSIC_RAMP)) / MUSIC_RAMP;
    else if (frame <= b + MUSIC_RAMP) t = 1 - (frame - b) / MUSIC_RAMP;
    amt = Math.max(amt, ease(t));
  }
  return amt;
};

// Absolute story anchors from EP04G_SPANS
const s01Ag2 = spanAbs(S01, "AG2_swap_clay");
const s01Shock = spanAbs(S01, "01b_Charu_Shock.wav");
const s01Logic = spanAbs(S01, "01e_Balak_ClayLogic.wav");

const s02Deal = spanAbs(S02, "02b_Balak_DealMangla.wav");
const s02Panic = spanAbs(S02, "02c_Mangla_Panic.wav");

const s03Sundar = spanAbs(S03, "03c_Sundar_Coax.wav");

const s04Grumble = spanAbs(S04, "04a_Harendra_Grumble.wav");
const s04Prophecy = spanAbs(S04, "04b_Thakurma_Prophecy.wav");

const s05AskSit = spanAbs(S05, "05e_Balak_AskSit.wav");
const s05Heist = spanAbs(S05, "AG7_drink_heist");

const s06Explode = spanAbs(S06, "06b_Bhagabati_Explode.wav");
const s06Ants = spanAbs(S06, "06c_Balak_AntsLogic.wav");
const s06Defense = spanAbs(S06, "06e_Balak_LegalDefense.wav");

const DRONE = { under: -36, open: -24.5 };
const PLUCKS = { under: -37, open: -23 };
const HIT = { under: -31, open: -22.5 };
const BANSURI_RELIEF_FRAMES = Math.floor(MUSIC_LIB["music/ep05/bansuri_relief"].seconds * 24);
const BANSURI_COMPASSION_FRAMES = Math.floor(MUSIC_LIB["music/ep05/bansuri_compassion"].seconds * 24);
const TENSION_RISE_FRAMES = Math.round(MUSIC_LIB["music/ep05/tension_rise"].seconds * 24);
const HEIST_GULP_ABS = s05Heist.from + 52;
/** Scene crossfade overlap: the outgoing scene's music runs this far past the cut, the next one starts this early. */
const XF = 12;

const MUSIC_CUES: readonly MusicCue[] = [
  /* Intro & source card: tanpura, a bansuri phrase over the title, soft tabla entering with the source card, and the
     tender phrase carrying over the cut into Scene 01's dawn (AG1) */
  { beat: "M0-IntroDrone", file: "music/ep05/tanpura_drone", from: 0, to: sceneStart(S01) + 30, fadeIn: 6, fadeOut: 30, under: -35, open: -24.5 },
  { beat: "M0-IntroBansuri", file: "music/ep05/bansuri_relief", from: 0, to: BANSURI_RELIEF_FRAMES, fadeIn: 2, fadeOut: 12, under: -32, open: -20.5, hit: true },
  { beat: "M0-SourceTabla", file: "music/ep05/tabla_soft", from: sceneStart(SOURCE) - 18, to: sceneStart(S01) + 12, fadeIn: 30, fadeOut: 24, under: -38, open: -24.5 },
  {
    beat: "M0-CarryBansuri",
    file: "music/ep05/bansuri_compassion",
    from: sceneStart(S01) - 96,
    to: sceneStart(S01) - 96 + BANSURI_COMPASSION_FRAMES,
    fadeIn: 2,
    fadeOut: 12,
    under: -34,
    open: -21,
    hit: true,
  },

  /* Scene 01: morning puja (tanpura + play_plucks), the clay Shiva swap and the innocent clay logic */
  { beat: "M1-Drone", file: "music/ep05/tanpura_drone", from: sceneStart(S01), to: sceneEnd(S01) + XF, fadeIn: 30, fadeOut: 24, ...DRONE },
  { beat: "M1-MorningPlucks", file: "music/ep05/play_plucks", from: sceneStart(S01) + 12, to: s01Ag2.from + 30, fadeIn: 30, fadeOut: 24, ...PLUCKS },
  { beat: "M2-SwapPluck", file: "music/ep05/cheeky_pluck_3", from: s01Ag2.from - 2, to: s01Ag2.from + 34, fadeIn: 1, fadeOut: 8, ...HIT, hit: true },
  { beat: "M2-SwapTabla", file: "music/ep05/tabla_soft", from: s01Ag2.from, to: s01Ag2.to + 6, fadeIn: 10, fadeOut: 14, under: -38, open: -23.5 },
  { beat: "M2-CharuShockPluck", file: "music/ep05/cheeky_pluck_1", from: s01Shock.from - 2, to: s01Shock.from + 58, fadeIn: 1, fadeOut: 10, ...HIT, hit: true },
  { beat: "M3-ClayLogicPlucks", file: "music/ep05/play_plucks", from: s01Logic.from - 8, to: sceneEnd(S01) + XF, fadeIn: 24, fadeOut: 24, ...PLUCKS },

  /* Scenes 02-03: Gobinda by the pond, Mangla's comic panic, Sundar's warm coaxing (tanpura_drone_low + bansuri) */
  { beat: "M4-PondDrone", file: "music/ep05/tanpura_drone", from: sceneStart(S02) - XF, to: s03Sundar.from + 14, fadeIn: 24, fadeOut: 28, ...DRONE },
  { beat: "M4-PondPlucks", file: "music/ep05/play_plucks", from: sceneStart(S02) - XF, to: s02Panic.from - 4, fadeIn: 24, fadeOut: 16, ...PLUCKS },
  { beat: "M4b-DealPluck", file: "music/ep05/cheeky_pluck_3", from: s02Deal.from - 2, to: s02Deal.from + 34, fadeIn: 1, fadeOut: 8, ...HIT, hit: true },
  { beat: "M4c-ManglaPanicPluck", file: "music/ep05/cheeky_pluck_2", from: s02Panic.from - 2, to: s02Panic.from + 56, fadeIn: 1, fadeOut: 10, ...HIT, hit: true },
  { beat: "M4c-ManglaSprintTabla", file: "music/ep05/tabla_run", from: s02Panic.from + 14, to: s02Panic.from + 78, fadeIn: 2, fadeOut: 10, under: -31, open: -23.5, hit: true },
  { beat: "M4c-ManglaTailTabla", file: "music/ep05/tabla_soft", from: s02Panic.from + 60, to: sceneStart(S03) + 400, fadeIn: 16, fadeOut: 24, under: -38, open: -24.5 },
  { beat: "M5-SundarDroneLow", file: "music/ep05/tanpura_drone_low_hot", from: s03Sundar.from - 10, to: sceneEnd(S03) + XF, fadeIn: 28, fadeOut: 24, under: -36, open: -23.5 },
  {
    // the warm phrase rises under Balak's handover lines and blooms in P6 as Sundar draws Gobinda to his chest
    beat: "M5-SundarBansuri",
    file: "music/ep05/bansuri_relief",
    from: sceneEnd(S03) - BANSURI_RELIEF_FRAMES,
    to: sceneEnd(S03),
    fadeIn: 2,
    fadeOut: 10,
    under: -34,
    open: -21,
    hit: true,
  },

  /* Scene 04: Harendra's grumble (tanpura_drone_low + a warm bansuri under it) -> Thakurma's Kailashpati prophecy
     (Shot 19 glow beat + P8: the brighter tanpura and the tender bansuri settling on Sa, gently) */
  { beat: "M6a-GrumbleLowDrone", file: "music/ep05/tanpura_drone_low_hot", from: sceneStart(S04) - XF, to: s04Prophecy.from + 10, fadeIn: 20, fadeOut: 28, under: -36, open: -23.5 },
  { beat: "M6a-GrumbleDrum", file: "music/ep05/drum_hit_low", from: s04Grumble.from - 2, to: s04Grumble.from + 56, fadeIn: 1, fadeOut: 12, under: -32, open: -24.5, hit: true },
  {
    beat: "M6a-FamilyBansuri",
    file: "music/ep05/bansuri_relief",
    from: s04Grumble.from + 10,
    to: s04Grumble.from + 10 + BANSURI_RELIEF_FRAMES,
    fadeIn: 2,
    fadeOut: 12,
    under: -36,
    open: -22.5,
    hit: true,
  },
  { beat: "M6b-ProphecyDrone", file: "music/ep05/tanpura_drone", from: s04Prophecy.from - 6, to: sceneStart(S05) + 30, fadeIn: 30, fadeOut: 30, under: -35, open: -24 },
  {
    beat: "M6b-ProphecyBansuri",
    file: "music/ep05/bansuri_compassion",
    from: sceneStart(CB1) - BANSURI_COMPASSION_FRAMES + 6,
    to: sceneStart(CB1) + 6,
    fadeIn: 2,
    fadeOut: 8,
    under: -33,
    open: -20.5,
    hit: true,
  },

  /* Scene 05: evening Purnima abhishek (tanpura, the warm phrase over the shrine opening AG6) & the coconut heist
     (tabla + cheeky plucks + a sneaky low heartbeat, the rise into the gulp) */
  { beat: "M7-ShrineDrone", file: "music/ep05/tanpura_drone", from: sceneStart(S05), to: sceneEnd(S06) + 8, fadeIn: 30, fadeOut: 24, ...DRONE },
  {
    beat: "M7-ShrineBansuri",
    file: "music/ep05/bansuri_relief",
    from: sceneStart(S05) - 6,
    to: sceneStart(S05) - 6 + BANSURI_RELIEF_FRAMES,
    fadeIn: 2,
    fadeOut: 12,
    under: -35,
    open: -21.5,
    hit: true,
  },
  { beat: "M8-AskSitPluck", file: "music/ep05/cheeky_pluck_3", from: s05AskSit.from - 2, to: s05AskSit.from + 34, fadeIn: 1, fadeOut: 8, ...HIT, hit: true },
  { beat: "M9-HeistTabla", file: "music/ep05/tabla_soft", from: s05Heist.from - 14, to: s05Heist.to, fadeIn: 14, fadeOut: 14, under: -38, open: -26.5 },
  { beat: "M9-HeistCheekyPlucks", file: "music/ep05/cheeky_plucks", from: s05Heist.from + 4, to: s05Heist.to, fadeIn: 10, fadeOut: 16, under: -38, open: -25.5 },
  { beat: "M9-HeistPulse", file: "music/ep05/drum_pulse", from: s05Heist.from, to: HEIST_GULP_ABS + 6, fadeIn: 16, fadeOut: 6, under: -38, open: -29.5 },
  { beat: "M9-HeistRise", file: "music/ep05/tension_rise", from: HEIST_GULP_ABS - TENSION_RISE_FRAMES, to: HEIST_GULP_ABS + 2, fadeIn: 2, fadeOut: 3, under: -30, open: -26, hit: true },
  { beat: "M9-HeistGulpPluck", file: "music/ep05/cheeky_pluck_2", from: HEIST_GULP_ABS, to: HEIST_GULP_ABS + 56, fadeIn: 1, fadeOut: 10, under: -30, open: -24.5, hit: true },

  /* Scene 06: priest uproar (a quick worried pulse under his outburst), the ants' wisdom, compassionate afterglow */
  { beat: "M10a-PriestShockPluck", file: "music/ep05/cheeky_pluck_1", from: s06Explode.from - 2, to: s06Explode.from + 56, fadeIn: 1, fadeOut: 10, ...HIT, hit: true },
  { beat: "M10a-UproarPulse", file: "music/ep05/drum_pulse_fast", from: s06Explode.from + 20, to: s06Explode.to + 6, fadeIn: 20, fadeOut: 18, under: -39, open: -27.5 },
  { beat: "M10b-AntsLogicPlucks", file: "music/ep05/play_plucks", from: s06Ants.from - 6, to: s06Ants.to + 10, fadeIn: 22, fadeOut: 20, ...PLUCKS },
  {
    // its body falls in P11 (Bhagabati speechless), settling on Sa as the outro's first words begin (ducked)
    beat: "M10c-AfterglowBansuri",
    file: "music/ep05/bansuri_compassion",
    from: s06Defense.to - 110,
    to: s06Defense.to - 110 + BANSURI_COMPASSION_FRAMES,
    fadeIn: 2,
    fadeOut: 10,
    under: -34,
    open: -24,
    hit: true,
  },

  /* Outro: tanpura and the warm bansuri phrase (carrying on from the afterglow), the tender phrase settling at the end */
  { beat: "M11-OutroDrone", file: "music/ep05/tanpura_drone", from: sceneStart(OUTRO) - XF, to: EP04G_TOTAL_FRAMES, fadeIn: 24, fadeOut: 36, under: -35, open: -23.5 },
  {
    beat: "M11-OutroBansuri",
    file: "music/ep05/bansuri_relief",
    from: sceneStart(OUTRO) + 56,
    to: sceneStart(OUTRO) + 56 + BANSURI_RELIEF_FRAMES,
    fadeIn: 2,
    fadeOut: 12,
    under: -34,
    open: -21,
    hit: true,
  },
  {
    beat: "M11-OutroEndBansuri",
    file: "music/ep05/bansuri_compassion",
    from: EP04G_TOTAL_FRAMES - BANSURI_COMPASSION_FRAMES,
    to: EP04G_TOTAL_FRAMES,
    fadeIn: 2,
    fadeOut: 36,
    under: -34,
    open: -21.5,
    hit: true,
  },
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
/* One-Shot & Action SFX                                               */
/* ------------------------------------------------------------------ */

const SFX_SECONDS: Record<string, number> = {
  "sfx/chime_pop.wav": 1.2,
  "sfx/ep06/plate_clink.wav": 1.2,
  "sfx/ep02/sand_pat.wav": 3.0,
  "sfx/ep02/cloth_rustle.wav": 1.2,
  "sfx/ep02/footsteps_floor.wav": 2.5,
  "sfx/ep02/footsteps_mud.wav": 2.8,
  "sfx/ep02/water_splash.wav": 1.0,
  "sfx/temple_bell_drop.wav": 2.2,
  "sfx/ep04/brass_tap.wav": 1.3,
  "sfx/ep04/drink_gulp.wav": 2.2,
  "sfx/ep02/clay_thud.wav": 1.5,
  "sfx/soft_magical_shimmer.wav": 2.5,
  "sfx/ep03/water_pour.wav": 2.98,
  // the Ghibli life kit one-shots (STO-22b)
  [`${LIFE}/rooster_crow.wav`]: 2.4,
  [`${LIFE}/pigeons_coo.wav`]: 2.1,
  [`${LIFE}/squirrel_chirp.wav`]: 2.2,
  [`${LIFE}/ducks_quack.wav`]: 2.0,
  [`${LIFE}/frog_croak.wav`]: 1.9,
  [`${LIFE}/fish_plop.wav`]: 0.52,
  [`${LIFE}/kingfisher_call.wav`]: 1.65,
  [`${LIFE}/small_splash.wav`]: 0.93,
  [`${LIFE}/cow_bell_distant.wav`]: 2.4,
  [`${LIFE}/moth_flutter.wav`]: 2.5,
  [`${LIFE}/gecko_tiktiki.wav`]: 2.6,
};

interface PlacedSfx {
  file: string;
  from: number;
  volume: number;
  frames?: number;
  fadeIn?: number;
  fadeOut?: number;
  rate?: number;
}

const s01Elder = spanAbs(S01, "01c_ElderBrother_Report.wav");
const s03Shout = spanAbs(S03, "03a_Family_Shout.wav");
const s03Sprint = spanAbs(S03, "AG5_runner_sprint");
const s03Give = spanAbs(S03, "03f_Balak_ToSundar.wav");
const s05Open = spanAbs(S05, "AG6_shrine_open");
const s05Huhu1 = spanAbs(S05, "05d_Bhagabati_Huhu1.wav");

const s01Flash = spanAbs(S01, "01g_Charu_FlashbackIntro.wav");
const s02Ag4 = spanAbs(S02, "AG4_distant_shouts");
const s03Negotiate = spanAbs(S03, "03d_Balak_Negotiate.wav");
const s05Dhoop = spanAbs(S05, "05b_Bhagabati_Dhoop.wav");
const s06Confess = spanAbs(S06, "06a_Balak_CoconutConfess.wav");
const s06Scold = spanAbs(S06, "06d_Family_ScoldShrine.wav");

/**
 * The kingfisher (Scene 03 `kingfisherDiveAt={900}` = episode 4718, Ep04PondLife `PondKingfisher`): crouches 4718-4725,
 * dives 4725-4734, enters the water at 4734 (splash droplets and rings from 4734-4736, checked on the rendered clip),
 * back up on the post by ~4752. `small_splash` has its "plip" at 0.06 s, so cued at the entry frame it lands at ~4735.
 * Keyed to AG5 (4714) + 20: keep in step with Scene03 / Ep04PondLife if the dive moves.
 */
const KF_SPLASH_ABS = s03Sprint.from + 20;

/**
 * Fish rings at the pond (`PondFishRings` in GhibliPondBackdrop: 4 slots, period 120, seed 5, on Scene 03's local
 * frame) open at Scene 03 local 410, 1082 and 1251, all in wordless gaps (P5, after 03e, P6). `fish_plop`'s onset is
 * at 0.08 s, so each plop starts 2 frames before its ring.
 */
const S03_FISH_RINGS = [410, 1082, 1251] as const;

// Sc04 prophecy glow beat: right as Thakurma proclaims "দেখিস, এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!"
const SC04_GLOW_BEAT_ABS = s04Prophecy.from + 79;

const PLACED_SFX: readonly PlacedSfx[] = [
  /* Intro chime */
  { file: "sfx/chime_pop.wav", from: 0, volume: 0.36 },

  /* Scene 01 world layer (STO-22b): the village rooster over the opening (AG1, before the narration), a pigeon pair
     cooing in P2 after Balak's clay logic, a squirrel's alarm in P3 as Charu leans in to tell the story */
  { file: `${LIFE}/rooster_crow.wav`, from: sceneStart(S01) + 6, volume: 0.22 },
  { file: `${LIFE}/pigeons_coo.wav`, from: s01Logic.to - 8, volume: 0.2 },
  { file: `${LIFE}/squirrel_chirp.wav`, from: s01Flash.to - 6, volume: 0.18 },

  /* Scene 01: morning puja bell, pranam rustle, wooden doll swap plate clink, clay rolling, elder brother steps */
  { file: "sfx/temple_bell_drop.wav", from: sceneStart(S01) + 22, volume: 0.18 },
  { file: "sfx/ep02/cloth_rustle.wav", from: sceneStart(S01) + 230, volume: 0.14 },
  // the doll touches the brass at scene + 324 (Scene01: CLINK = RISE + 32, moved earlier for Biru's walk-off)
  { file: "sfx/ep06/plate_clink.wav", from: sceneStart(S01) + 324, volume: 0.28 },
  { file: "sfx/ep02/sand_pat.wav", from: s01Ag2.from + 52, volume: 0.16, frames: 42, fadeIn: 6, fadeOut: 12 },
  { file: "sfx/ep02/cloth_rustle.wav", from: s01Shock.from - 4, volume: 0.16 },
  // the brother walks Biru in (Scene01 BRO_WALK: 54 to 6 frames before his line), then leaves after his report
  { file: "sfx/ep02/footsteps_floor.wav", from: s01Elder.from - 52, volume: 0.15, frames: 48, fadeIn: 6, fadeOut: 10 },
  { file: "sfx/ep02/footsteps_floor.wav", from: s01Elder.to - 10, volume: 0.1, frames: 40, fadeIn: 4, fadeOut: 14 },

  /* Scene 02: pond petal plop & Mangla panic sprint footsteps */
  { file: "sfx/ep02/water_splash.wav", from: sceneStart(S02) + 26, volume: 0.12, rate: 1.5 },
  {
    file: "sfx/ep02/footsteps_mud.wav",
    from: s02Panic.from + 14,
    volume: 0.22,
    frames: Math.max(24, s02Panic.to - s02Panic.from),
    fadeIn: 4,
    fadeOut: 14,
  },

  /* Scenes 02-03 pond life (STO-22b), every call in a wordless gap: ducks at the pond reveal (AG3), startled by the
     distant shouts (AG4) and settling in P6; a frog after Mangla's sprint (P4); fish plops on the fish rings; the
     kingfisher's trill just before its dive and the small splash on its splash rings (AG5) */
  { file: `${LIFE}/ducks_quack.wav`, from: sceneStart(S02) + 6, volume: 0.22 },
  { file: `${LIFE}/ducks_quack.wav`, from: s02Ag4.from - 13, volume: 0.24 },
  { file: `${LIFE}/frog_croak.wav`, from: s02Panic.to + 2, volume: 0.2 },
  ...S03_FISH_RINGS.map((local, i) => ({
    file: `${LIFE}/fish_plop.wav`,
    from: sceneStart(S03) + local - 2,
    volume: i === 0 ? 0.24 : 0.22,
  })),
  // only its first trill (0.13-0.65 s), just before it crouches at 4718, so the dive itself is silent until the splash
  { file: `${LIFE}/kingfisher_call.wav`, from: s03Negotiate.to - 8, volume: 0.22, frames: 18, fadeIn: 1, fadeOut: 3 },
  { file: `${LIFE}/small_splash.wav`, from: KF_SPLASH_ABS, volume: 0.32 },
  { file: `${LIFE}/ducks_quack.wav`, from: s03Give.to - 6, volume: 0.22 },

  /* Scene 03: family arrival steps, runner sprint out & back with wooden doll, handover rustle */
  { file: "sfx/ep02/footsteps_mud.wav", from: sceneStart(S03) + 4, volume: 0.16, frames: s03Shout.frames, fadeIn: 6, fadeOut: 14 },
  { file: "sfx/ep02/footsteps_mud.wav", from: s03Sprint.from, volume: 0.22, frames: s03Sprint.frames, fadeIn: 4, fadeOut: 10 },
  { file: "sfx/ep02/cloth_rustle.wav", from: s03Give.from + 44, volume: 0.15 },

  /* Scene 04: Thakurma's Kailashpati prophecy glow shimmer (0.15) */
  { file: "sfx/soft_magical_shimmer.wav", from: SC04_GLOW_BEAT_ABS, volume: 0.15 },

  /* Scene 04: a far cattle bell in P7, after Harendra's grumble (STO-22b) */
  { file: `${LIFE}/cow_bell_distant.wav`, from: s04Grumble.to - 4, volume: 0.22 },

  /* Chapter Break CB1: soft temple bell drop */
  { file: "sfx/temple_bell_drop.wav", from: sceneStart(CB1) + 4, volume: 0.18 },

  /* Scene 05: evening shrine puja bells, dhoop-dani brass tap, bare feet entering, coconut water gulp & bowl set-down */
  { file: "sfx/temple_bell_drop.wav", from: s05Open.from + 14, volume: 0.16 },
  { file: "sfx/temple_bell_drop.wav", from: s05Open.from + 36, volume: 0.15 },
  // soft knee-steps while he carries the dhoop-dani in (Scene05 S05.lift / walk), then its set-down (local 644)
  { file: "sfx/ep02/footsteps_floor.wav", from: s05Huhu1.from + 32, volume: 0.15, frames: 36, fadeIn: 4, fadeOut: 10 },
  { file: "sfx/ep04/brass_tap.wav", from: s05Huhu1.to + 30, volume: 0.18 },
  // a quiet trickle while the water is poured (Scene 05 local 632-718), under 05e
  { file: "sfx/ep03/water_pour.wav", from: sceneStart(S05) + 632, volume: 0.15, frames: 86, fadeIn: 8, fadeOut: 16, rate: 0.85 },
  // he shuffles back to the khat (S05.backFrom-backTo)
  { file: "sfx/ep02/footsteps_floor.wav", from: s05AskSit.to + 26, volume: 0.14, frames: 36, fadeIn: 4, fadeOut: 10 },
  { file: "sfx/temple_bell_drop.wav", from: s05Heist.from + 18, volume: 0.15 },
  // the priest shakes the bell again (seen silent before)
  { file: "sfx/temple_bell_drop.wav", from: s05Heist.from + 48, volume: 0.15 },
  { file: "sfx/ep04/drink_gulp.wav", from: HEIST_GULP_ABS - 4, volume: 0.28 },
  { file: "sfx/ep02/clay_thud.wav", from: s05Heist.from + 92, volume: 0.16, rate: 1.25 },

  /* Scene 05 night life (STO-22b): a moth's soft flutter over the lamp-flame insert of P9 (nobody comes) */
  { file: `${LIFE}/moth_flutter.wav`, from: s05Dhoop.to - 7, volume: 0.18, frames: 44, fadeIn: 4, fadeOut: 12 },

  /* Scene 06 night life (STO-22b): the tiktiki's "tik-tik" (folk "thik thik", it is true) in P10 after Balak's
     confession (cut short before the priest's outburst) and in P11 after his defence */
  { file: `${LIFE}/gecko_tiktiki.wav`, from: s06Confess.to - 6, volume: 0.2, frames: 32, fadeIn: 1, fadeOut: 5 },
  { file: `${LIFE}/gecko_tiktiki.wav`, from: s06Defense.to - 4, volume: 0.18 },

  /* Scene 06: priest bell drop on uproar */
  { file: "sfx/temple_bell_drop.wav", from: s06Explode.from + 4, volume: 0.16 },
  // the stone bowl set back down during the ants logic (absolute 7324)
  { file: "sfx/ep02/clay_thud.wav", from: s06Ants.from + 165, volume: 0.16, rate: 1.25 },
  // the family rushes in for their scold
  { file: "sfx/ep02/footsteps_floor.wav", from: s06Scold.from - 18, volume: 0.22, frames: 48, fadeIn: 4, fadeOut: 12 },

  /* Outro: soft magical shimmer (0.12) */
  { file: "sfx/soft_magical_shimmer.wav", from: sceneStart(OUTRO), volume: 0.12 },
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
/* Master Episode 04 Ghibli Composition                                */
/* ------------------------------------------------------------------ */

export const Episode04Ghibli: React.FC = () => (
  <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#120d08" }}>
    {EP04G_SCENES.map((scene) => {
      let node: React.ReactNode = null;
      switch (scene.sceneId) {
        case INTRO:
          node = <GhibliScene00IntroEp04 />;
          break;
        case SOURCE:
          node = <GhibliScene00bSource frames={scene.durationFrames} />;
          break;
        case S01:
          node = <Scene01ClayShivaGhibli />;
          break;
        case S02:
          node = <Scene02GobindaManglaGhibli />;
          break;
        case S03:
          node = <Scene03PondStandoffGhibli />;
          break;
        case S04:
          node = <Scene04KailashpatiProphecyGhibli />;
          break;
        case CB1:
          node = <GhibliChapterBreak />;
          break;
        case S05:
          node = <Scene05DhoopAndCoconutGhibli />;
          break;
        case S06:
          node = <Scene06PriestUproarGhibli />;
          break;
        case OUTRO:
          node = <GhibliScene99OutroEp04 />;
          break;
        default:
          return null;
      }

      const fade = SCENE_FADE[scene.sceneId];
      const wrapped = fade ? (
        <EdgeFade fadeIn={fade.in} fadeOut={fade.out} durationFrames={scene.durationFrames} color={fade.color}>
          {node}
        </EdgeFade>
      ) : (
        node
      );

      return (
        <Sequence key={scene.sceneId} from={scene.startFrame} durationInFrames={scene.durationFrames}>
          {wrapped}
        </Sequence>
      );
    })}

    {/* Scene 06 -> outro: the outro's opening frame dissolves in over Scene 06's last frames (CAM-09) */}
    <Sequence from={sceneStart(OUTRO) - OUTRO_DISSOLVE} durationInFrames={OUTRO_DISSOLVE}>
      <DissolveIn frames={OUTRO_DISSOLVE}>
        <Freeze frame={0}>
          <GhibliScene99OutroEp04 />
        </Freeze>
      </DissolveIn>
    </Sequence>

    {/* Hand-painted watercolor wash transitions at Scene 01->02 and Scene 03->04 */}
    <Sequence from={sceneStart(S02) - 13} durationInFrames={26}>
      <GhibliWashTransition durationFrames={26} />
    </Sequence>
    <Sequence from={sceneStart(S04) - 13} durationInFrames={26}>
      <GhibliWashTransition durationFrames={26} />
    </Sequence>

    {/* Ducked natural ambient beds */}
    {BEDS.map((bed) =>
      bed.layers.map((layer) => (
        <Sequence
          key={`bed-${bed.name}-${layer.file}`}
          from={bed.from}
          durationInFrames={Math.max(1, bed.to - bed.from)}
          layout="none"
        >
          <Audio src={staticFile(`audio/${layer.file}`)} loop volume={bedLayerVolume(bed, layer)} />
        </Sequence>
      )),
    )}

    {/* Indian classical score cues (AUD-07) */}
    {MUSIC_PLACED.map((c, idx) => (
      <Sequence key={`music-${idx}-${c.beat}-${c.file}`} from={c.from} durationInFrames={cueFrames(c)} layout="none">
        <Audio
          src={staticFile(`audio/${c.file}.wav`)}
          loop={MUSIC_LIB[c.file].loop && !c.hit}
          volume={musicVolume(c)}
        />
      </Sequence>
    ))}

    {/* Action & pause SFX */}
    {PLACED_SFX.map((c, idx) => (
      <Sequence key={`sfx-${idx}-${c.file}-${c.from}`} from={c.from} durationInFrames={sfxDuration(c)} layout="none">
        <Audio
          src={staticFile(`audio/${c.file}`)}
          loop={c.frames !== undefined}
          volume={sfxVolume(c)}
          playbackRate={c.rate ?? 1}
        />
      </Sequence>
    ))}

    {/* 32 Voice dialogue & narration clips */}
    {EP04G_AUDIO.map((a) => (
      <Sequence key={a.file} from={a.startFrame} durationInFrames={a.frames} layout="none">
        <Audio src={staticFile(`audio/ep04_ghibli/${a.file}`)} volume={1} />
      </Sequence>
    ))}

    {/* Bengali subtitles */}
    <SeriesSubtitles cues={EP04G_CUES} />
  </div>
);
