import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
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
  [S06]: { out: 18, color: "#1e1610" },
  [OUTRO]: { in: 18, out: 24, color: "#120d08" },
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

const BEDS: readonly Bed[] = [
  {
    name: "01-courtyard-morning",
    from: sceneStart(S01),
    to: sceneStart(S02) + 12,
    fadeIn: 24,
    fadeOut: 24,
    layers: [
      { file: "sfx/ep02/birds_village.wav", open: 0.2, under: 0.07 },
      { file: "sfx/ep02/wind_soft.wav", open: 0.11, under: 0.05 },
    ],
  },
  {
    name: "02-03-pond-day",
    from: sceneStart(S02) - 10,
    to: sceneStart(S04) + 12,
    fadeIn: 24,
    fadeOut: 24,
    layers: [
      { file: "sfx/ep02/birds_village.wav", open: 0.18, under: 0.07 },
      { file: "sfx/ep02/wind_soft.wav", open: 0.12, under: 0.06 },
      { file: "sfx/river_water.wav", open: 0.18, under: 0.07 },
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
      { file: "sfx/ep02/wind_soft.wav", open: 0.1, under: 0.05 },
    ],
  },
  {
    name: "05-06-evening-shrine",
    from: sceneStart(S05),
    to: sceneStart(OUTRO) + BED_TAIL,
    fadeIn: 28,
    fadeOut: 24,
    layers: [
      { file: "ambient/bengal_night_crickets.wav", open: 0.14, under: 0.06 },
      { file: "sfx/ep02/lantern_hiss.wav", open: 0.05, under: 0.03 },
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
/* Indian Classical Score Cues (AUD-07)                                */
/* ------------------------------------------------------------------ */

interface MusicFile {
  lufs: number;
  seconds: number;
  loop: boolean;
}

const MUSIC_LIB: Record<string, MusicFile> = {
  "music/Theme_Intro_Bansuri": { lufs: -11.5, seconds: 28.0, loop: true },
  "music/Village_Peace_Loop": { lufs: -8.5, seconds: 15.2, loop: true },
  "music/Warm_Family_Flute": { lufs: -8.1, seconds: 13.2, loop: true },
  "music/Divine_Motif": { lufs: -15.0, seconds: 36.0, loop: false },
  "music/ep05/tanpura_drone": { lufs: -24.0, seconds: 33.714, loop: true },
  "music/ep05/tanpura_drone_low": { lufs: -28.0, seconds: 33.714, loop: true },
  "music/ep05/tanpura_drone_cs": { lufs: -24.0, seconds: 31.825, loop: true },
  "music/ep05/play_plucks": { lufs: -24.0, seconds: 8.211, loop: true },
  "music/ep05/cheeky_plucks": { lufs: -22.0, seconds: 8.0, loop: true },
  "music/ep05/tabla_soft": { lufs: -24.0, seconds: 9.87, loop: true },
  "music/ep05/tabla_run": { lufs: -20.1, seconds: 2.694, loop: false },
  "music/ep05/cheeky_pluck_1": { lufs: -20.0, seconds: 2.511, loop: false },
  "music/ep05/cheeky_pluck_2": { lufs: -20.0, seconds: 2.405, loop: false },
  "music/ep05/cheeky_pluck_3": { lufs: -20.0, seconds: 1.382, loop: false },
  "music/ep05/tension_rise": { lufs: -20.0, seconds: 1.3, loop: false },
  "music/ep05/drum_hit_low": { lufs: -20.0, seconds: 2.6, loop: false },
  "music/ep05/bansuri_compassion": { lufs: -20.0, seconds: 9.529, loop: false },
};

const MUSIC_LOOP_MAX = 0.22;
const MUSIC_HIT_MAX = 0.42;

interface MusicCue {
  beat: string;
  file: string;
  from: number;
  to: number;
  fadeIn: number;
  fadeOut: number;
  under: number;
  open: number;
  directVol?: { open: number; under: number };
  hit?: boolean;
}

const lufsToVol = (target: number, file: string) => Math.pow(10, (target - (MUSIC_LIB[file]?.lufs ?? -14)) / 20);

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

const DRONE = { under: -44, open: -37 };
const BANSURI_COMPASSION_FRAMES = Math.floor(MUSIC_LIB["music/ep05/bansuri_compassion"].seconds * 24);
const TENSION_RISE_FRAMES = Math.round(MUSIC_LIB["music/ep05/tension_rise"].seconds * 24);
const HEIST_GULP_ABS = s05Heist.from + 52;

const MUSIC_CUES: readonly MusicCue[] = [
  /* Intro & Source Card: series bansuri theme */
  {
    beat: "M0-Intro",
    file: "music/Theme_Intro_Bansuri",
    from: 0,
    to: sceneStart(S01) + 24,
    fadeIn: 4,
    fadeOut: 24,
    under: -32,
    open: -26,
    directVol: { open: 0.14, under: 0.07 },
  },

  /* Scene 01: Morning puja, clay Shiva swap & innocent clay logic */
  {
    beat: "M1-MorningPeace",
    file: "music/Village_Peace_Loop",
    from: sceneStart(S01),
    to: s01Ag2.from + 12,
    fadeIn: 24,
    fadeOut: 24,
    under: -37,
    open: -31,
  },
  {
    beat: "M1-Drone",
    file: "music/ep05/tanpura_drone",
    from: sceneStart(S01),
    to: sceneEnd(S01),
    fadeIn: 30,
    fadeOut: 24,
    ...DRONE,
  },
  {
    beat: "M2-SwapPluck",
    file: "music/ep05/cheeky_pluck_3",
    from: s01Ag2.from - 2,
    to: s01Ag2.from + 34,
    fadeIn: 1,
    fadeOut: 8,
    under: -38,
    open: -38,
    hit: true,
  },
  {
    beat: "M2-SwapTabla",
    file: "music/ep05/tabla_soft",
    from: s01Ag2.from,
    to: s01Ag2.from + 48,
    fadeIn: 10,
    fadeOut: 8,
    under: -40,
    open: -38,
  },
  {
    beat: "M2-CharuShockPluck",
    file: "music/ep05/cheeky_pluck_1",
    from: s01Shock.from - 2,
    to: s01Shock.from + 58,
    fadeIn: 1,
    fadeOut: 10,
    under: -36,
    open: -36,
    hit: true,
  },
  {
    beat: "M3-ClayLogicPlucks",
    file: "music/ep05/play_plucks",
    from: s01Logic.from - 8,
    to: sceneEnd(S01),
    fadeIn: 24,
    fadeOut: 24,
    under: -41,
    open: -37,
  },

  /* Scene 02: Gobinda by the pond & Mangla's comic panic */
  {
    beat: "M4-PondDrone",
    file: "music/ep05/tanpura_drone",
    from: sceneStart(S02),
    to: sceneEnd(S03),
    fadeIn: 24,
    fadeOut: 24,
    ...DRONE,
  },
  {
    beat: "M4-PondPlucks",
    file: "music/ep05/play_plucks",
    from: sceneStart(S02),
    to: s02Panic.from - 4,
    fadeIn: 24,
    fadeOut: 16,
    under: -41,
    open: -37,
  },
  {
    beat: "M4b-DealPluck",
    file: "music/ep05/cheeky_pluck_3",
    from: s02Deal.from - 2,
    to: s02Deal.from + 34,
    fadeIn: 1,
    fadeOut: 8,
    under: -38,
    open: -38,
    hit: true,
  },
  {
    beat: "M4c-ManglaPanicPluck",
    file: "music/ep05/cheeky_pluck_2",
    from: s02Panic.from - 2,
    to: s02Panic.from + 56,
    fadeIn: 1,
    fadeOut: 10,
    under: -36,
    open: -36,
    hit: true,
  },
  {
    beat: "M4c-ManglaSprintTabla",
    file: "music/ep05/tabla_run",
    from: s02Panic.from + 14,
    to: s02Panic.from + 78,
    fadeIn: 2,
    fadeOut: 10,
    under: -36,
    open: -35,
    hit: true,
  },
  {
    beat: "M4c-ManglaTailTabla",
    file: "music/ep05/tabla_soft",
    from: s02Panic.from + 60,
    to: sceneStart(S03) + 400,
    fadeIn: 16,
    fadeOut: 24,
    under: -42,
    open: -38,
  },

  /* Scene 03: Sundar Jyetha's warm coaxing & rescue of Gobinda */
  {
    beat: "M5-SundarFlute",
    file: "music/Warm_Family_Flute",
    from: s03Sundar.from - 10,
    to: sceneEnd(S03) + 8,
    fadeIn: 28,
    fadeOut: 28,
    under: -38,
    open: -31,
  },

  /* Scene 04: Harendra's grumble -> Thakurma's Kailashpati prophecy (Divine_Motif on 04b + P8) */
  {
    beat: "M6a-GrumbleLowDrone",
    file: "music/ep05/tanpura_drone_low",
    from: sceneStart(S04),
    to: s04Prophecy.from - 8,
    fadeIn: 20,
    fadeOut: 20,
    under: -44,
    open: -40,
  },
  {
    beat: "M6a-GrumbleDrum",
    file: "music/ep05/drum_hit_low",
    from: s04Grumble.from - 2,
    to: s04Grumble.from + 56,
    fadeIn: 1,
    fadeOut: 12,
    under: -40,
    open: -40,
    hit: true,
  },
  {
    beat: "M6b-ProphecyDivineMotif",
    file: "music/Divine_Motif",
    from: s04Prophecy.from - 6,
    to: sceneStart(CB1) + BED_TAIL,
    fadeIn: 30,
    fadeOut: 22,
    under: -36,
    open: -30,
  },
  {
    beat: "M6b-ProphecyDroneCs",
    file: "music/ep05/tanpura_drone_cs",
    from: s04Prophecy.from - 6,
    to: sceneStart(CB1) + BED_TAIL,
    fadeIn: 30,
    fadeOut: 22,
    ...DRONE,
  },

  /* Scene 05: Evening Purnima abhishek & cheeky coconut water heist */
  {
    beat: "M7-ShrineDrone",
    file: "music/ep05/tanpura_drone",
    from: sceneStart(S05),
    to: sceneEnd(S06) + BED_TAIL,
    fadeIn: 28,
    fadeOut: 24,
    ...DRONE,
  },
  {
    beat: "M8-AskSitPluck",
    file: "music/ep05/cheeky_pluck_3",
    from: s05AskSit.from - 2,
    to: s05AskSit.from + 34,
    fadeIn: 1,
    fadeOut: 8,
    under: -38,
    open: -38,
    hit: true,
  },
  {
    beat: "M9-HeistTabla",
    file: "music/ep05/tabla_soft",
    from: s05Heist.from,
    to: s05Heist.to,
    fadeIn: 12,
    fadeOut: 14,
    under: -40,
    open: -37,
  },
  {
    beat: "M9-HeistCheekyPlucks",
    file: "music/ep05/cheeky_plucks",
    from: s05Heist.from + 4,
    to: s05Heist.to,
    fadeIn: 10,
    fadeOut: 16,
    under: -41,
    open: -37,
  },
  {
    beat: "M9-HeistRise",
    file: "music/ep05/tension_rise",
    from: HEIST_GULP_ABS - TENSION_RISE_FRAMES,
    to: HEIST_GULP_ABS + 2,
    fadeIn: 2,
    fadeOut: 3,
    under: -37,
    open: -37,
    hit: true,
  },
  {
    beat: "M9-HeistGulpPluck",
    file: "music/ep05/cheeky_pluck_2",
    from: HEIST_GULP_ABS,
    to: HEIST_GULP_ABS + 56,
    fadeIn: 1,
    fadeOut: 10,
    under: -36,
    open: -36,
    hit: true,
  },

  /* Scene 06: Priest uproar, ants wisdom & compassionate bansuri afterglow */
  {
    beat: "M10a-PriestShockPluck",
    file: "music/ep05/cheeky_pluck_1",
    from: s06Explode.from - 2,
    to: s06Explode.from + 56,
    fadeIn: 1,
    fadeOut: 10,
    under: -36,
    open: -36,
    hit: true,
  },
  {
    beat: "M10b-AntsLogicPlucks",
    file: "music/ep05/play_plucks",
    from: s06Ants.from - 6,
    to: s06Ants.to + 10,
    fadeIn: 22,
    fadeOut: 20,
    under: -41,
    open: -37,
  },
  {
    beat: "M10c-AfterglowBansuri",
    file: "music/ep05/bansuri_compassion",
    from: Math.max(s06Defense.from + 12, sceneEnd(S06) - BANSURI_COMPASSION_FRAMES),
    to: sceneEnd(S06),
    fadeIn: 28,
    fadeOut: 20,
    under: -39,
    open: -33,
  },

  /* Outro: series bansuri theme */
  {
    beat: "M11-OutroBansuri",
    file: "music/Theme_Intro_Bansuri",
    from: sceneStart(OUTRO),
    to: EP04G_TOTAL_FRAMES,
    fadeIn: 24,
    fadeOut: 36,
    under: -32,
    open: -26,
    directVol: { open: 0.14, under: 0.07 },
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
  return (f: number) => {
    const abs = c.from + f;
    const edge = ease(Math.min(f / Math.max(1, c.fadeIn), (len - f) / Math.max(1, c.fadeOut)));
    if (c.directVol) {
      return ducked(c.directVol.open, c.directVol.under, abs, MUSIC_LOOP_MAX) * edge;
    }
    if (c.hit) {
      return Math.min(MUSIC_HIT_MAX, lufsToVol(c.open, c.file)) * edge;
    }
    const open = Math.min(MUSIC_LOOP_MAX, lufsToVol(c.open, c.file));
    const under = Math.min(open, lufsToVol(c.under, c.file));
    return ducked(open, under, abs, MUSIC_LOOP_MAX) * edge;
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

// Sc04 prophecy glow beat: right as Thakurma proclaims "দেখিস, এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!"
const SC04_GLOW_BEAT_ABS = s04Prophecy.from + 79;

const PLACED_SFX: readonly PlacedSfx[] = [
  /* Intro chime */
  { file: "sfx/chime_pop.wav", from: 0, volume: 0.36 },

  /* Scene 01: morning puja bell, pranam rustle, wooden doll swap plate clink, clay rolling, elder brother steps */
  { file: "sfx/temple_bell_drop.wav", from: sceneStart(S01) + 22, volume: 0.18 },
  { file: "sfx/ep02/cloth_rustle.wav", from: sceneStart(S01) + 230, volume: 0.14 },
  { file: "sfx/ep06/plate_clink.wav", from: s01Ag2.from + 44, volume: 0.28 },
  { file: "sfx/ep02/sand_pat.wav", from: s01Ag2.from + 52, volume: 0.16, frames: 42, fadeIn: 6, fadeOut: 12 },
  { file: "sfx/ep02/cloth_rustle.wav", from: s01Shock.from - 4, volume: 0.16 },
  { file: "sfx/ep02/footsteps_floor.wav", from: s01Elder.from - 34, volume: 0.15, frames: 48, fadeIn: 6, fadeOut: 12 },

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

  /* Scene 03: family arrival steps, runner sprint out & back with wooden doll, handover rustle */
  { file: "sfx/ep02/footsteps_mud.wav", from: sceneStart(S03) + 4, volume: 0.16, frames: s03Shout.frames, fadeIn: 6, fadeOut: 14 },
  { file: "sfx/ep02/footsteps_mud.wav", from: s03Sprint.from, volume: 0.22, frames: s03Sprint.frames, fadeIn: 4, fadeOut: 10 },
  { file: "sfx/ep02/cloth_rustle.wav", from: s03Give.from + 44, volume: 0.15 },

  /* Scene 04: Thakurma's Kailashpati prophecy glow shimmer (0.15) */
  { file: "sfx/soft_magical_shimmer.wav", from: SC04_GLOW_BEAT_ABS, volume: 0.15 },

  /* Chapter Break CB1: soft temple bell drop */
  { file: "sfx/temple_bell_drop.wav", from: sceneStart(CB1) + 4, volume: 0.18 },

  /* Scene 05: evening shrine puja bells, dhoop-dani brass tap, bare feet entering, coconut water gulp & bowl set-down */
  { file: "sfx/temple_bell_drop.wav", from: s05Open.from + 14, volume: 0.16 },
  { file: "sfx/temple_bell_drop.wav", from: s05Open.from + 36, volume: 0.15 },
  { file: "sfx/ep04/brass_tap.wav", from: s05Huhu1.to + 4, volume: 0.18 },
  { file: "sfx/ep02/footsteps_floor.wav", from: s05AskSit.to + 8, volume: 0.14, frames: 18, fadeIn: 3, fadeOut: 8 },
  { file: "sfx/temple_bell_drop.wav", from: s05Heist.from + 18, volume: 0.15 },
  { file: "sfx/ep04/drink_gulp.wav", from: HEIST_GULP_ABS - 4, volume: 0.28 },
  { file: "sfx/ep02/clay_thud.wav", from: s05Heist.from + 92, volume: 0.16, rate: 1.25 },

  /* Scene 06: priest bell drop on uproar */
  { file: "sfx/temple_bell_drop.wav", from: s06Explode.from + 4, volume: 0.16 },

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
