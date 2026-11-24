import React from "react";
import { SeriesSubtitles } from "../episode/SeriesSubtitles";
import { cueLocalStory, pausesFor, storyToReal } from "../episode/storyClock";
import { Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { EP02_AUDIO, EP02_BREATHS, EP02_DISSOLVES, EP02_SCENES } from "./timing";
import { EP02_CUES } from "./subtitles";
import { Scene00Intro } from "./scenes/Scene00Intro";
import { Scene01Shashthi } from "./scenes/Scene01Shashthi";
import { Scene01cMotherLap } from "./scenes/Scene01cMotherLap";
import { Scene01dRain } from "./scenes/Scene01dRain";
import { Scene01d2HandsMiracle } from "./scenes/Scene01d2HandsMiracle";
import { Scene01eFather } from "./scenes/Scene01eFather";
import { Scene02a0Journey } from "./scenes/Scene02a0Journey";
import { Scene02aUjanchar } from "./scenes/Scene02aUjanchar";
import { Scene02Fox } from "./scenes/Scene02Fox";
import { Scene03Goshaap } from "./scenes/Scene03Goshaap";
import { ricePotStoryFrame, Scene04RicePot } from "./scenes/Scene04RicePot";
import { Scene99Outro } from "./scenes/Scene99Outro";
import { SourceCard } from "../episode/SourceCard";

/** Source attribution card (Bengali and English), shown right after the title line. */
const SOURCE_BN = "‘শ্রীশ্রীবালক ব্রহ্মচারীর শৈশব কাহিনী’ (জননী শ্রীচারুশীলা দেবী ও ছোট মাসীমা শ্রীসরলা দেবীর স্মৃতিকথা অবলম্বনে)";
const SOURCE_EN = "Based on \"Sri Sri Balak Brahmachari's Childhood Stories\" (accounts of Mother Charushila Devi, Sarala Devi & eyewitnesses)";
const SourceAttributionScene: React.FC = () => {
  // The card stays up (and fades out) until the first story scene starts, so no empty frames show in the gap.
  const i = EP02_SCENES.findIndex((s) => s.sceneId === "00b_source_attribution");
  const card = EP02_SCENES[i];
  const next = EP02_SCENES[i + 1];
  const frames = card ? (next ? Math.max(card.durationFrames, next.startFrame - card.startFrame) : card.durationFrames) : 454;
  return <SourceCard bn={SOURCE_BN} en={SOURCE_EN} frames={frames} />;
};

/** Scene components by sceneId. Each scene reads its own local frame via useCurrentFrame(). */
const SCENE_COMPONENTS: Record<string, React.FC> = {
  "00_intro": Scene00Intro,
  "00b_source_attribution": SourceAttributionScene,
  "01_shashthi_mystery": Scene01Shashthi,
  "01c_mother_lap": Scene01cMotherLap,
  "01d_shashthi_rain": Scene01dRain,
  "01d2_shashthi_hands_miracle": Scene01d2HandsMiracle,
  "01e_father_letter": Scene01eFather,
  "02a0_journey_to_ujanchar": Scene02a0Journey,
  "02a_ujanchar": Scene02aUjanchar,
  "02_fox_and_bagha_dog": Scene02Fox,
  "03_lemon_tree_goshaap": Scene03Goshaap,
  "04_rice_pot_miracle": Scene04RicePot,
  "99_closing_sequential_outro": Scene99Outro,
};

/* ------------------------------------------------------------------ */
/* Timeline anchors: scenes, story frames, pauses, narration phrases     */
/* ------------------------------------------------------------------ */

const sceneRow = (id: string) => {
  const s = EP02_SCENES.find((x) => x.sceneId === id);
  if (!s) throw new Error(`Episode02: unknown scene ${id}`);
  return s;
};
const sceneStart = (id: string): number => sceneRow(id).startFrame;

/**
 * Story frame -> real local frame of a scene (rule CAM-14 pauses, EP02_PAUSES). Cues were authored in the
 * scene's ORIGINAL local frames, which are now STORY frames: real = story + the frames of every pause of that
 * scene whose atStory is BEFORE it. A cue exactly at a pause's atStory plays at the pause start (storyToReal).
 */
const storyReal = (sceneId: string, story: number): number => storyToReal(story, pausesFor(sceneId));

/** Pause `index` (0-based, sorted by atStory) of a scene, as a real local window. */
const pauseWindow = (sceneId: string, index: number): { start: number; end: number; frames: number } => {
  const p = pausesFor(sceneId)[index];
  if (!p) throw new Error(`Episode02: scene ${sceneId} has no pause ${index}`);
  const start = p.startFrame - sceneStart(sceneId);
  return { start, end: start + p.frames, frames: p.frames };
};

/**
 * Real local frame where the first subtitle phrase of a scene containing `snippet` starts. Used for cues that
 * follow a line which starts right after a pause (its story frame equals the pause's atStory, so a story anchor
 * would land at the pause start). Undefined when the phrase is missing (the cue is then skipped with a warning).
 */
const phraseLocal = (sceneId: string, snippet: string): number | undefined => {
  const i = EP02_SCENES.findIndex((s) => s.sceneId === sceneId);
  const s = EP02_SCENES[i];
  const next = EP02_SCENES[i + 1];
  if (!s) return undefined;
  const end = Math.min(s.startFrame + s.durationFrames, next ? next.startFrame : Infinity);
  const c = EP02_CUES.find((q) => q.from >= s.startFrame && q.from < end && q.text.includes(snippet));
  return c ? c.from - s.startFrame : undefined;
};

/** 0 while the scene's story clock is held (inside one of its pauses), 1 otherwise, with short ramps. */
const GATE_RAMP = 5;
const storyRunning = (sceneId: string, absFrame: number): number => {
  let g = 1;
  for (const p of pausesFor(sceneId)) {
    const a = p.startFrame;
    const b = p.startFrame + p.frames;
    const d = absFrame < a ? a - absFrame : absFrame > b ? absFrame - b : 0;
    g = Math.min(g, Math.min(1, d / GATE_RAMP));
  }
  return g;
};

/* ------------------------------------------------------------------ */
/* Sound beds                                                          */
/* ------------------------------------------------------------------ */

/**
 * Per-scene sound beds. The ambience is a deep, low-passed version so the night and river carry
 * weight under the narration. Music stays low so it never masks the voice.
 */
interface SceneBed {
  ambient?: string; // looping deep ambience
  ambientGain?: number; // scales the ambient level (default 1)
  music?: string; // looping low music
  sfx?: string; // one-shot at scene start
}
const SCENE_BEDS: Record<string, SceneBed> = {
  // Beds follow the audit: a daytime bed for the village, crickets only at night, one rain layer,
  // no shimmer on the miracle or the fox entrance, and the divine motif only at sacred moments.
  "00_intro": { music: "music/Theme_Intro_Bansuri.wav", sfx: "sfx/chime_pop.wav" },
  "00b_source_attribution": { music: "music/Theme_Intro_Bansuri.wav" },
  "01_shashthi_mystery": { ambient: "ep02/deep/deep_padma_river_day.wav", music: "music/Village_Peace_Loop.wav" },
  "01c_mother_lap": { ambient: "ep02/deep/deep_bengal_night_crickets.wav", music: "music/Village_Peace_Loop.wav" },
  "01d_shashthi_rain": { ambient: "ep02/deep/deep_monsoon_rain_courtyard.wav" },
  // the rain in this room follows the baby's hands: the scene file plays its own rain at a varying level
  "01d2_shashthi_hands_miracle": { music: "music/Sacred_Night_Ambient.wav" },
  // The departure is a grey rainy DAY (STO-16 answer 2): a soft rain bed instead of the night crickets.
  // Village_Peace_Loop swells on the news pause and fades out over the dissolve into the journey (MUSIC_SWELLS).
  "01e_father_letter": { ambient: "ep02/deep/deep_monsoon_rain_courtyard.wav", ambientGain: 0.6, music: "music/Village_Peace_Loop.wav" },
  // No bed for the journey (02a0): JOURNEY_MUSIC and its effects carry it.
  // No music bed in 02a: the journey's single pass of Warm_Family_Flute runs on and resolves under its line.
  "02a_ujanchar": { ambient: "ep02/deep/deep_padma_river_day.wav" },
  "02_fox_and_bagha_dog": { ambient: "ep02/deep/deep_bengal_night_crickets.wav", music: "music/Sacred_Night_Ambient.wav" },
  "03_lemon_tree_goshaap": { ambient: "ep02/deep/deep_padma_river_day.wav", music: "music/Warm_Family_Flute.wav", sfx: "sfx/river_water.wav" },
  "04_rice_pot_miracle": { ambient: "ep02/deep/deep_padma_river_day.wav", music: "music/Sacred_Night_Ambient.wav" },
  "99_closing_sequential_outro": { ambient: "ep02/deep/deep_padma_river_day.wav", music: "music/Theme_Intro_Bansuri.wav", sfx: "sfx/soft_magical_shimmer.wav" },
};

/* ------------------------------------------------------------------ */
/* Sound effects                                                       */
/* ------------------------------------------------------------------ */

/**
 * Sound effects (scripts/synthesize_ep02_sfx.js and recordings -> public/audio/sfx/ep02/), placed at scene
 * events. One-shots play for their own length (SFX_SECONDS); loops (loopFrames set) repeat with a short fade
 * at each end (fadeIn / fadeOut override it). `levels` ([frame, volume] keys, frames from the cue start) shapes a
 * loop's level over time. `gate` silences a loop while its scene's story clock is held in a pause (an action
 * sound: steps, pats, stirring). Volumes stay between 0.15 and 0.45, loops at 0.25 or below.
 * `file` is a name in audio/sfx/ep02, or a path under audio/ when it contains a slash.
 */
const SFX_SECONDS: Record<string, number> = {
  baby_soft_cry: 3.5, cot_creak: 1.2, cloth_rustle: 1.2, thunder_roll: 5, water_splash: 1, paper_rustle: 1,
  door_creak: 1.8, fox_yip: 1, dog_growl: 2, dog_bark: 1, scuffle: 1.8, pot_clatter: 1.2, saap_hiss: 1.5,
  cow_moo: 2.5, cow_bell: 2, rope_creak: 2.5, rope_snap: 0.8, whoosh_soft: 1.2, clay_thud: 1.5, rice_spill: 1.5,
  chime_pop: 1.2, temple_bell_drop: 2.2, river_water: 4, monsoon_rain: 4,
};
interface SfxSound {
  file: string;
  volume: number;
  loopFrames?: number;
  fadeIn?: number;
  fadeOut?: number;
  levels?: [number, number][];
  gate?: boolean;
  /** Playback rate (default 1): a quicker pace for hurried footsteps. */
  rate?: number;
}
/**
 * A scene cue. Without `cue`, `at` is a STORY frame (the scene's original authored local frame) and a loop's
 * `loopFrames` are story frames too (a loop that spans a pause is stretched across it). With `cue`, the sound
 * starts `at` real frames after the start of the scene's narration phrase containing that text, and
 * `loopFrames` are real frames. With `real`, `at` and `loopFrames` are the scene's REAL local frames (for
 * events a scene plays on its real or acting clock, e.g. the father's handover and the fox fight).
 */
interface SfxCue extends SfxSound { scene: string; at: number; cue?: string; real?: boolean }

/**
 * The journey's shots J1-J6, laid out exactly as Scene02a0Journey does (2.0 : 1.5 : 2.0 : 2.5 : 1.5 : 1.5 s in
 * proportion to the scene length): shot i runs from JOURNEY_CUT[i] to JOURNEY_CUT[i + 1] - 1 (0/48/84/132/192/228/264).
 */
const JOURNEY_ID = "02a0_journey_to_ujanchar";
const JOURNEY_DUR = sceneRow(JOURNEY_ID).durationFrames;
const JOURNEY_CUT: number[] = (() => {
  const s = [2.0, 1.5, 2.0, 2.5, 1.5, 1.5];
  const sum = s.reduce((a, b) => a + b, 0);
  return s.reduce<number[]>((acc, x) => [...acc, acc[acc.length - 1] + x], [0]).map((t) => Math.round((t / sum) * JOURNEY_DUR));
})();
/**
 * The journey's effects (plan "Sound plan for the stretch"; no narration and no pauses, so story = real). The cart
 * sounds run all the way and fade over the dissolve into Ujanchar (the last 40 frames).
 */
const JOURNEY_SFX: SfxCue[] = (() => {
  const J = JOURNEY_CUT;
  const c = (at: number, file: string, volume: number, more: Partial<SfxSound> = {}): SfxCue => ({ scene: JOURNEY_ID, at, file, volume, ...more });
  return [
    c(0, "rain_on_thatch", 0.15, { loopFrames: J[1], fadeIn: 10, fadeOut: J[1] - 10 }), // J1: the last of the rain
    // the wheels all the way: 0.20, 0.25 on the J2 close-up, 0.15 under J4 (Balak and the sky), 0.20 from J5
    c(0, "cart_wheel_creak", 0.2, {
      loopFrames: J[6], fadeIn: 20, fadeOut: 40,
      levels: [[J[1], 0.2], [J[1] + 4, 0.25], [J[2] - 4, 0.25], [J[2] + 4, 0.2], [J[3] - 4, 0.2], [J[3] + 4, 0.15], [J[4] - 4, 0.15], [J[4] + 4, 0.2]],
    }),
    // the bullock's steps all the way, a little forward (0.20) on J3, the medium-wide side view of the bullock walking
    c(0, "hooves_soft", 0.15, {
      loopFrames: J[6], fadeIn: 20, fadeOut: 40,
      levels: [[J[2] - 4, 0.15], [J[2] + 4, 0.2], [J[3] - 4, 0.2], [J[3] + 4, 0.15]],
    }),
    c(J[1] + 8, "water_splash", 0.15), // J2: the wheel through a puddle
    // J3 on: the neck bells, continuous (J3 is a side view now, no close-up of the bell, so no single ring)
    c(J[2], "bullock_bells", 0.2, { loopFrames: J[6] - J[2], fadeIn: 6, fadeOut: 40 }),
    c(J[2], "wind_soft", 0.15, { loopFrames: J[5] - J[2], fadeIn: 16, fadeOut: 16 }), // J3 to J5: open fields
    c(J[3], "birds_village", 0.18, { loopFrames: J[4] - J[3], fadeIn: 10, fadeOut: 10 }), // J4: the birds he watches
    c(J[4], "sfx/river_water", 0.2, { loopFrames: J[5] - J[4] + 4, fadeIn: 6, fadeOut: 10 }), // J5: the river
    c(J[4], "oars_water", 0.15, { loopFrames: J[5] - J[4], fadeIn: 6, fadeOut: 8 }), // J5: a boatman rowing past
    c(J[5], "birds_village", 0.15, { loopFrames: 60, fadeIn: 8, fadeOut: 40 }), // J6: settling, handing over to 02a
  ];
})();

/**
 * 01e Father's letter: its beats in REAL local frames, derived exactly as Scene01eFather derives them (from the
 * narration cues and EP02_PAUSES), so the sounds follow the picture when the timing changes. Shots 1 to 4a play the
 * handover on its own clock o through a warp anchored on the narration (the scene's HAND_WARP): hOf(o) is the real
 * frame of handover frame o. Beats at today's timing in brackets.
 */
const FATHER_ID = "01e_father_letter";
const FATHER = (() => {
  const R = (story: number) => storyReal(FATHER_ID, story);
  const L3 = cueLocalStory("সুরেন্দ্রচন্দ্রের", FATHER_ID) ?? { from: 74, to: 160 };
  const news = pauseWindow(FATHER_ID, 1);
  const farewell = pauseWindow(FATHER_ID, 2);
  const hTake = R(Math.round(L3.from + 0.72 * (L3.to - L3.from))); // [160] he takes the letter on "খবর"
  const cutCall = news.start + Math.round(news.frames / 3); // [208] 4b: he calls inside
  const cutGate = phraseLocal(FATHER_ID, "কৃষ্ণনগরে") ?? R(249); // [345] the gate, the blessing
  // the handover warp (Scene01eFather HAND_WARP): [real h, handover o]
  const ARRIVE_H = 12;
  const stopH = ARRIVE_H + 67;
  const span = Math.max(32, hTake - stopH);
  const pts: [number, number][] = [[0, -47 - ARRIVE_H], [stopH, 20]];
  let h = stopH;
  for (const [o, w] of [[34, 21], [43, 18], [52, 22], [59, 20]] as const) {
    h += (span * w) / 81;
    pts.push([h, o]);
  }
  pts.push([Math.max(h + 12, news.start), 72], [Math.max(h + 30, cutCall), 90]);
  const hOf = (o: number): number => {
    if (o <= pts[0][1]) return pts[0][0] + (o - pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [h0, o0] = pts[i - 1];
      const [h1, o1] = pts[i];
      if (o <= o1) return Math.round(h0 + ((o - o0) / (o1 - o0)) * (h1 - h0));
    }
    return Math.round(pts[pts.length - 1][0] + (o - pts[pts.length - 1][1]));
  };
  return {
    peonIn: ARRIVE_H, // [12] the peon's umbrella at the frame edge; he walks in
    peonStop: hOf(18), // [77] he stops and furls his umbrella (o 18-26)
    envelope: hOf(45), // [123] the envelope comes out of the satchel
    take: hTake, // [160] the father takes the letter
    open: hOf(63), // [167] he opens it (o 63-72)
    umbOpen: hOf(82), // [197] the peon opens his umbrella again (o 82-90)
    peonLeave: hOf(86), // [203] and walks off along the veranda
    cutCall, // [208]
    cutHouse: news.end, // [256] the wide of the house front, the family walks out and down the steps
    cutGate, // [345]
    lookBack: farewell.start + Math.round(0.3 * farewell.frames), // [387] Charu's last look back
  };
})();

const CRICKETS = "ambient/bengal_night_crickets";
/** 04 Rice pot: a cue written in the scene's authored choreography frames, as a story frame (ricePotStoryFrame). */
const rp = (authored: number) => Math.round(ricePotStoryFrame(authored));
const SFX_CUES: SfxCue[] = [
  // 01 Shashthi. Shot 1 (story 0 to the cut inside on "লম্বা ঘরে", story 101; real 0-125 with P1): a calm bright day
  // outside the Vedic house, birds and a soft breeze, no rain (P1 adds its morning birds). Inside: a baby cries on the
  // cut; Charu walks in (story 101 to her stop at 252, easing from 225); the reach on "নতুন খোকাটি" (story 305): her
  // sari rustles as she leans, the cot creaks as her weight comes over it (cupped hands at 339). Her straightening
  // and the cry on the low cut are pause cues (P3).
  { scene: "01_shashthi_mystery", at: 0, file: "birds_village", volume: 0.18, loopFrames: 102, fadeIn: 12, fadeOut: 8 },
  { scene: "01_shashthi_mystery", at: 0, file: "wind_soft", volume: 0.15, loopFrames: 102, fadeIn: 16, fadeOut: 8 },
  { scene: "01_shashthi_mystery", at: 103, file: "baby_soft_cry", volume: 0.18 },
  { scene: "01_shashthi_mystery", at: 102, file: "footsteps_floor", volume: 0.18, loopFrames: 148, fadeIn: 6, fadeOut: 22, gate: true },
  { scene: "01_shashthi_mystery", at: 305, file: "cloth_rustle", volume: 0.18 },
  { scene: "01_shashthi_mystery", at: 336, file: "cot_creak", volume: 0.22 },
  // 01c Mother's lap: her forearms slide under him and lift him (story 0-66, after the open pause)
  { scene: "01c_mother_lap", at: 1, file: "cloth_rustle", volume: 0.25 },
  // 01d Rain: rain and wind beds (from the open pause on), one thunder roll just after the single lightning
  // flash (story 76), and a splash as the villagers reach the water over the path (116-124)
  { scene: "01d_shashthi_rain", at: 0, file: "rain_on_thatch", volume: 0.22, loopFrames: 202 },
  { scene: "01d_shashthi_rain", at: 0, file: "wind_soft", volume: 0.15, loopFrames: 202 },
  { scene: "01d_shashthi_rain", at: 82, file: "thunder_roll", volume: 0.4 },
  { scene: "01d_shashthi_rain", at: 116, file: "water_splash", volume: 0.2 },
  // 01e Father's letter (rebuilt scene; beats from FATHER, real local frames). A grey rainy day: steady rain on the
  // veranda roof and the lantern by the door through shots 1 to 4b (to the cut to the house front); the peon walks in
  // under his umbrella, stops and furls it; the envelope comes out of his satchel, the father takes it on "খবর" and
  // opens it; the peon opens his umbrella and walks off; on the call Charu (Balak in her arms) and Thakurma come into
  // the doorway (a creak of the old threshold, their steps inside); the family walks out, down the steps and along
  // the muddy path to the gate (to the stop at the gate, u 16); a soft auspicious bell as the elders' blessing hands
  // reach the top (u 14); Charu's sari as she turns for the last look back; in the rear wide the bullock's bell, and
  // the cart deck creaks as the family climbs on (rear story 312, mid-lift).
  { scene: FATHER_ID, real: true, at: 0, file: "rain_on_thatch", volume: 0.18, loopFrames: FATHER.cutHouse + 1, fadeIn: 8, fadeOut: 10 },
  { scene: FATHER_ID, real: true, at: 0, file: "lantern_hiss", volume: 0.15, loopFrames: FATHER.cutHouse + 1, fadeIn: 8, fadeOut: 6 },
  { scene: FATHER_ID, real: true, at: FATHER.peonIn - 2, file: "rain_on_umbrella", volume: 0.12, loopFrames: FATHER.peonStop + 4 - (FATHER.peonIn - 2), fadeIn: 8, fadeOut: 6 },
  { scene: FATHER_ID, real: true, at: FATHER.peonIn, file: "footsteps_mud", volume: 0.15, loopFrames: FATHER.peonStop - FATHER.peonIn, fadeIn: 8, fadeOut: 12 },
  { scene: FATHER_ID, real: true, at: FATHER.peonStop - 1, file: "cloth_rustle", volume: 0.18 },
  { scene: FATHER_ID, real: true, at: FATHER.envelope - 1, file: "paper_rustle", volume: 0.18 },
  { scene: FATHER_ID, real: true, at: FATHER.take - 1, file: "paper_rustle", volume: 0.3 },
  { scene: FATHER_ID, real: true, at: FATHER.open, file: "paper_rustle", volume: 0.2 },
  { scene: FATHER_ID, real: true, at: FATHER.umbOpen - 1, file: "cloth_rustle", volume: 0.15 },
  { scene: FATHER_ID, real: true, at: FATHER.umbOpen + 3, file: "rain_on_umbrella", volume: 0.15, loopFrames: FATHER.cutHouse - (FATHER.umbOpen + 3), fadeIn: 6, fadeOut: 16 },
  { scene: FATHER_ID, real: true, at: FATHER.peonLeave, file: "footsteps_mud", volume: 0.15, loopFrames: FATHER.cutHouse - FATHER.peonLeave, fadeIn: 6, fadeOut: 24 },
  { scene: FATHER_ID, real: true, at: FATHER.cutCall + 1, file: "door_creak", volume: 0.2 },
  { scene: FATHER_ID, real: true, at: FATHER.cutCall, file: "footsteps_floor", volume: 0.15, loopFrames: 32, fadeIn: 4, fadeOut: 10 },
  { scene: FATHER_ID, real: true, at: FATHER.cutHouse, file: "footsteps_mud", volume: 0.18, loopFrames: FATHER.cutGate + 16 - FATHER.cutHouse, fadeIn: 8, fadeOut: 14 },
  { scene: FATHER_ID, real: true, at: FATHER.cutGate + 14, file: "sfx/temple_bell_drop", volume: 0.18 },
  { scene: FATHER_ID, real: true, at: FATHER.lookBack - 1, file: "cloth_rustle", volume: 0.15 },
  { scene: FATHER_ID, at: 280, file: "cow_bell", volume: 0.15 },
  { scene: FATHER_ID, at: 312, file: "cot_creak", volume: 0.2 },
  // 02a0 Journey: JOURNEY_SFX (above), placed on its shots J1-J6.
  ...JOURNEY_SFX,
  // 02a Ujanchar: one held wide (no cart sounds; the journey's cart fades over the dissolve). Dawn birds take over
  // from the journey's. (The boats are moored still, so the oars that sat here are gone.)
  { scene: "02a_ujanchar", at: 0, file: "birds_village", volume: 0.18, loopFrames: 111, fadeIn: 24 },
  // 02 Fox (straight cuts, no whip-pans, no whooshes). Events on the scene's acting clock (story with only P1 held):
  // real = acting below P1 (198), acting + 24 after it; story = acting up to P2 (350). Charu stirs at the hearth
  // (shot 1, to the cut at 95); the fire is heard to the cut back to the room (real 416); the fox scratches the hole
  // open in three bursts (story 104-110, 114-121, 126-135) with crumbs falling; Bagha bursts in (206), checks into a
  // growling stalk (238), lunges (270), the fox rears back yipping (276), the tussle (contact 290-292), the fox breaks
  // away (305), squeezes out through the hole (crumbs, 324) and Bagha barks at it (344). P2 (pause cues): his bark,
  // the panting, the kitchen cut and the ladle slipping. Charu hurries in (real 416, stride to the stop at 514: a
  // quicker step), kneels on "ও আমার সোনা মানিক" (real 696-723) and lays her hand on his chest (real 769).
  { scene: "02_fox_and_bagha_dog", real: true, at: 0, file: "fire_crackle", volume: 0.15, loopFrames: 416, fadeOut: 10 },
  { scene: "02_fox_and_bagha_dog", at: 0, file: "ladle_stir", volume: 0.2, loopFrames: 94, fadeOut: 6, gate: true },
  { scene: "02_fox_and_bagha_dog", at: 103, file: "sand_pat", volume: 0.18, loopFrames: 8, fadeIn: 2, fadeOut: 3 },
  { scene: "02_fox_and_bagha_dog", at: 113, file: "sand_pat", volume: 0.18, loopFrames: 9, fadeIn: 2, fadeOut: 3 },
  { scene: "02_fox_and_bagha_dog", at: 125, file: "sand_pat", volume: 0.18, loopFrames: 11, fadeIn: 2, fadeOut: 3 },
  { scene: "02_fox_and_bagha_dog", at: 104, file: "rice_spill", volume: 0.18 },
  { scene: "02_fox_and_bagha_dog", at: 114, file: "rice_spill", volume: 0.15 },
  { scene: "02_fox_and_bagha_dog", at: 126, file: "rice_spill", volume: 0.18 },
  { scene: "02_fox_and_bagha_dog", at: 205, file: "dog_bark", volume: 0.35 },
  { scene: "02_fox_and_bagha_dog", at: 237, file: "dog_growl", volume: 0.35 },
  { scene: "02_fox_and_bagha_dog", at: 269, file: "dog_bark", volume: 0.4 },
  { scene: "02_fox_and_bagha_dog", at: 275, file: "fox_yip", volume: 0.3 },
  { scene: "02_fox_and_bagha_dog", at: 289, file: "scuffle", volume: 0.35 },
  { scene: "02_fox_and_bagha_dog", at: 305, file: "fox_yip", volume: 0.3 },
  { scene: "02_fox_and_bagha_dog", at: 324, file: "rice_spill", volume: 0.15 },
  { scene: "02_fox_and_bagha_dog", at: 342, file: "dog_bark", volume: 0.35 },
  { scene: "02_fox_and_bagha_dog", real: true, at: 416, file: "footsteps_floor", volume: 0.22, loopFrames: 98, fadeIn: 4, fadeOut: 24, rate: 1.35 },
  { scene: "02_fox_and_bagha_dog", real: true, at: 697, file: "cloth_rustle", volume: 0.2 },
  { scene: "02_fox_and_bagha_dog", real: true, at: 768, file: "cloth_rustle", volume: 0.15 },
  // 03 Go-saap: birds and breeze in the courtyard (stretched across the pauses); the crawl's soft hand pats only
  // while he moves (he slows to a stop with every limb planted at 70 = P1, 186 and 250 = P2, and stops at 344);
  // calm, occasional soft hisses where a go-saap flicks or hisses: A's first flick (170) and C's hiss behind him
  // (266-304, now gentle); the cow lifts its head on its own life clock (real 150-172 and 390-412: a soft bell);
  // pats on A's neck (372-402), soft pats as they settle (454-504) and glee pats (528-576); the cut to Charu's
  // close-up (596): her gasp, and her hand lowering on the breath of relief (622)
  { scene: "03_lemon_tree_goshaap", at: 0, file: "birds_village", volume: 0.15, loopFrames: 583 },
  { scene: "03_lemon_tree_goshaap", at: 0, file: "wind_soft", volume: 0.15, loopFrames: 583 },
  { scene: "03_lemon_tree_goshaap", at: 2, file: "sand_pat", volume: 0.18, loopFrames: 60, fadeIn: 10, fadeOut: 8, gate: true },
  { scene: "03_lemon_tree_goshaap", at: 80, file: "sand_pat", volume: 0.18, loopFrames: 96, fadeIn: 8, fadeOut: 8, gate: true },
  { scene: "03_lemon_tree_goshaap", at: 197, file: "sand_pat", volume: 0.18, loopFrames: 45, fadeIn: 6, fadeOut: 8, gate: true },
  { scene: "03_lemon_tree_goshaap", at: 260, file: "sand_pat", volume: 0.18, loopFrames: 72, fadeIn: 6, fadeOut: 16, gate: true },
  { scene: "03_lemon_tree_goshaap", real: true, at: 148, file: "cow_bell", volume: 0.18 },
  { scene: "03_lemon_tree_goshaap", real: true, at: 388, file: "cow_bell", volume: 0.15 },
  { scene: "03_lemon_tree_goshaap", at: 169, file: "saap_hiss", volume: 0.15 },
  { scene: "03_lemon_tree_goshaap", at: 265, file: "saap_hiss", volume: 0.18 },
  { scene: "03_lemon_tree_goshaap", at: 371, file: "sand_pat", volume: 0.15, loopFrames: 32, gate: true },
  { scene: "03_lemon_tree_goshaap", at: 453, file: "sand_pat", volume: 0.15, loopFrames: 52, gate: true },
  { scene: "03_lemon_tree_goshaap", at: 527, file: "sand_pat", volume: 0.18, loopFrames: 50, gate: true },
  { scene: "03_lemon_tree_goshaap", at: 597, file: "cloth_rustle", volume: 0.2 },
  { scene: "03_lemon_tree_goshaap", at: 621, file: "cloth_rustle", volume: 0.15 },
  // 04 Rice pot, in the scene's authored frames (rp: ricePotStoryFrame): his pats in the spilled rice (7-53), the rope
  // strains (14) and snaps (72), the pot falls in slow motion (72-111) and lands over him with a clay thud (111);
  // the parents rush in (189-229) and kneel (229-245), grip and strain (241-266), tip it (264-281) and let it drop
  // onto its side (291); his pats in the rice inside (353-381, 433-467), grains let fall (374), a slow trickle of
  // grains through his fingers in the blessing (632)
  { scene: "04_rice_pot_miracle", at: rp(5), file: "sand_pat", volume: 0.15, loopFrames: rp(57) - rp(5), fadeIn: 6, fadeOut: 8, gate: true },
  { scene: "04_rice_pot_miracle", at: rp(14), file: "rope_creak", volume: 0.25 },
  { scene: "04_rice_pot_miracle", at: rp(71), file: "rope_snap", volume: 0.4 },
  { scene: "04_rice_pot_miracle", at: rp(84), file: "whoosh_soft", volume: 0.25 },
  { scene: "04_rice_pot_miracle", at: rp(110), file: "clay_thud", volume: 0.45 },
  { scene: "04_rice_pot_miracle", at: rp(112), file: "rice_spill", volume: 0.3 },
  { scene: "04_rice_pot_miracle", at: rp(190), file: "footsteps_floor", volume: 0.2, loopFrames: rp(229) - rp(190), fadeOut: 6, gate: true, rate: 1.25 },
  { scene: "04_rice_pot_miracle", at: rp(229), file: "cloth_rustle", volume: 0.2 },
  { scene: "04_rice_pot_miracle", at: rp(290), file: "clay_thud", volume: 0.3 },
  { scene: "04_rice_pot_miracle", at: rp(292), file: "rice_spill", volume: 0.18 },
  { scene: "04_rice_pot_miracle", at: rp(351), file: "sand_pat", volume: 0.15, loopFrames: rp(385) - rp(351), gate: true },
  { scene: "04_rice_pot_miracle", at: rp(374), file: "rice_spill", volume: 0.15 },
  { scene: "04_rice_pot_miracle", at: rp(431), file: "sand_pat", volume: 0.15, loopFrames: rp(470) - rp(431), gate: true },
  { scene: "04_rice_pot_miracle", at: rp(632), file: "rice_spill", volume: 0.15 },
];

/**
 * Sounds in the pauses (EP02_PAUSES, rule CAM-14): the sound column of each scene's approved Pauses table
 * (Ep02_Shots_and_Pauses_DRAFT.md). `pause` is the scene's pause index (sorted by atStory); `at` is in real
 * frames from the pause start, or from its end when `fromEnd` is set (negative values start before it).
 */
interface PauseCue extends SfxSound { scene: string; pause: number; at: number; fromEnd?: boolean }
const PAUSE_CUES: PauseCue[] = [
  // 01 P1 "…বিরাট বৈদিক বাড়ি।": morning birds over the held wide of the house (the crow crosses)
  { scene: "01_shashthi_mystery", pause: 0, at: -2, file: "ambient/dawn_birds_temple", volume: 0.2, loopFrames: 30, fadeIn: 8, fadeOut: 10 },
  // 01 P2 "…শিশুরা শুয়ে থাকে।": a distant cry from the next cots while she looks down at him (her hands rest at her
  // sides now, so the rail creak that sat here is gone)
  { scene: "01_shashthi_mystery", pause: 1, at: 4, file: "baby_soft_cry", volume: 0.18 },
  // 01 P3 "…সবার চেয়ে আলাদা!": the kiss lands and lingers; she starts to straighten 36 f in (her clock runs through
  // P3: KISS + 36); a cry on the low cut (7 f before the end of P3), leading into line 4
  { scene: "01_shashthi_mystery", pause: 2, at: 35, file: "cloth_rustle", volume: 0.2 },
  { scene: "01_shashthi_mystery", pause: 2, at: -8, fromEnd: true, file: "baby_soft_cry", volume: 0.2 },
  // 01c P1 (open): soft room tone of crickets, a rustle as her hands move
  { scene: "01c_mother_lap", pause: 0, at: 0, file: CRICKETS, volume: 0.15, loopFrames: 30, fadeIn: 8, fadeOut: 10 },
  { scene: "01c_mother_lap", pause: 0, at: 10, file: "cloth_rustle", volume: 0.15 },
  // 01c P2 (end): the warm flute rising under the bed as she rocks him
  { scene: "01c_mother_lap", pause: 1, at: 0, file: "music/Warm_Family_Flute", volume: 0.12, loopFrames: 42, fadeIn: 14, fadeOut: 16 },
  // 01d P1 (open): a distant thunder roll over the held wide (the rain and wind loops already run from here)
  { scene: "01d_shashthi_rain", pause: 0, at: 4, file: "thunder_roll", volume: 0.3 },
  // 01d P2 (end): heavy rain on the empty veranda and a thunder roll after the last word
  { scene: "01d_shashthi_rain", pause: 1, at: 0, file: "sfx/monsoon_rain", volume: 0.22, loopFrames: 26, fadeIn: 12, fadeOut: 6 },
  { scene: "01d_shashthi_rain", pause: 1, at: 2, file: "thunder_roll", volume: 0.3 },
  // 01d2: no pause cues here. Scene01d2HandsMiracle plays its own pause sounds (P1 distant thunder, P2 thunder with
  // the flash, P3 sari rustle) on top of its own rain, so nothing plays twice.
  // 01e farewell pause and shot 8: the rain easing to a drizzle (0.18 to 0.10), fading out over the dissolve.
  // (The news-pause sounds and the cart creak are SFX cues on the rebuilt scene's beats: FATHER.)
  { scene: "01e_father_letter", pause: 2, at: 0, file: "rain_on_umbrella", volume: 0.18, loopFrames: 99, fadeIn: 10, fadeOut: 40, levels: [[0, 0.18], [48, 0.1]] },
  // 02 P1 "…শেয়াল ঢুকে পড়েছে!": night crickets over the held room (the kitchen fire loop runs through it)
  { scene: "02_fox_and_bagha_dog", pause: 0, at: -4, file: CRICKETS, volume: 0.18, loopFrames: 34, fadeIn: 8, fadeOut: 12 },
  // 02 P2 "…শেয়ালকে তাড়িয়ে দিল!": Bagha barks once more at the hole (P2 0-9) and turns back panting (fading out
  // before Charu's line); on the kitchen cut (+20) Charu hears, and the ladle slips from her hand (+36). Her hurried
  // steps on line 5 are an SFX cue (real clock).
  { scene: "02_fox_and_bagha_dog", pause: 1, at: 2, file: "dog_bark", volume: 0.25 },
  { scene: "02_fox_and_bagha_dog", pause: 1, at: 14, file: "dog_pant", volume: 0.2, loopFrames: 240, fadeIn: 12, fadeOut: 36 },
  { scene: "02_fox_and_bagha_dog", pause: 1, at: 35, file: "pot_clatter", volume: 0.3 },
  // 02 P3 "…মিষ্টি হাসছে!": her hand comes to her chest (+12 to +28; the divine motif starts here: DIVINE_MOTIF)
  { scene: "02_fox_and_bagha_dog", pause: 2, at: 12, file: "cloth_rustle", volume: 0.15 },
  // 03 P1: the birds and wind loops only (the cow lifts its head on its own clock: SFX cues). P2: a go-saap's slow
  // tongue flick (+7) with a soft hiss.
  { scene: "03_lemon_tree_goshaap", pause: 1, at: 6, file: "saap_hiss", volume: 0.15 },
  // 03 P3 "…হাত বুলিয়ে খেলতেন!": his slow soft strokes on the go-saap
  { scene: "03_lemon_tree_goshaap", pause: 2, at: 4, file: "sand_pat", volume: 0.15, loopFrames: 42, fadeIn: 6, fadeOut: 8 },
  // 04 P1 (open): the rope creaks as the pot turns a little (the chapter chime sounds on the black beat at its start)
  { scene: "04_rice_pot_miracle", pause: 0, at: 10, file: "rope_creak", volume: 0.2 },
  // 04 P2 "…ছোট্ট শিশুর ওপর!": a last trickle of grains, then near silence
  { scene: "04_rice_pot_miracle", pause: 1, at: 8, file: "rice_spill", volume: 0.2 },
  // 04 P3 "…আঁচড়ও লাগেনি!": his two pats in the rice (+12, +27); a soft temple bell near the end, leading into
  // "নারায়ণের অপার কৃপা"
  { scene: "04_rice_pot_miracle", pause: 2, at: 11, file: "rice_spill", volume: 0.15 },
  { scene: "04_rice_pot_miracle", pause: 2, at: 26, file: "rice_spill", volume: 0.15 },
  { scene: "04_rice_pot_miracle", pause: 2, at: -30, fromEnd: true, file: "sfx/temple_bell_drop", volume: 0.2 },
];

/**
 * Sounds in the breaths (the holds after a scene's narration, EP02_BREATHS from the timing generator).
 * `at` is relative to the start of the breath after scene `after`; negative values start a little before it.
 */
interface BreathCue extends SfxSound { after: string; at: number }
const BREATH_CUES: BreathCue[] = [
  // Mother's lap -> rain (48 f): crickets in the quiet room and a soft breath of night air
  { after: "01c_mother_lap", at: -6, file: CRICKETS, volume: 0.2, loopFrames: 60, fadeIn: 14, fadeOut: 10 },
  { after: "01c_mother_lap", at: 6, file: "wind_soft", volume: 0.15, loopFrames: 40, fadeIn: 16, fadeOut: 18 },
  // Rain -> the hands miracle inside (36 f): heavy rain that runs into the room (the thunder roll moved into the
  // rain scene's end pause, after the last word)
  { after: "01d_shashthi_rain", at: -4, file: "sfx/monsoon_rain", volume: 0.25, loopFrames: 56, fadeIn: 6, fadeOut: 16 },
  // Hands miracle -> father (36 f): the rain settles to a steady patter as the awe sinks in
  { after: "01d2_shashthi_hands_miracle", at: -4, file: "rain_on_thatch", volume: 0.16, loopFrames: 44, fadeIn: 8, fadeOut: 20 },
  // (The father scene flows into the journey by a dissolve: its sounds are in the journey plan above.)
  // Ujanchar -> fox (60 f): the forest at dusk, birds settling and insects rising into the night kitchen dissolve
  { after: "02a_ujanchar", at: -4, file: "birds_village", volume: 0.18, loopFrames: 64, fadeIn: 6, fadeOut: 40 },
  { after: "02a_ujanchar", at: 10, file: CRICKETS, volume: 0.18, loopFrames: 90, fadeIn: 30, fadeOut: 24 },
  // Fox -> go-saap (48 f): night crickets around the khat and Bagha's slow, settled panting at his guard post
  { after: "02_fox_and_bagha_dog", at: -6, file: CRICKETS, volume: 0.2, loopFrames: 58, fadeIn: 12, fadeOut: 12 },
  { after: "02_fox_and_bagha_dog", at: 0, file: "dog_pant", volume: 0.15, loopFrames: 44, fadeIn: 10, fadeOut: 16 },
  // Go-saap -> rice pot (72 f): courtyard birds under Charu's close-up, fading out with the chapter-break fade to
  // black (the cow bell that sat here landed on the cut to her face, so it was removed; her gasp is a SFX cue)
  { after: "03_lemon_tree_goshaap", at: -4, file: "birds_village", volume: 0.15, loopFrames: 76, fadeIn: 6, fadeOut: 30 },
  // Rice pot -> outro (48 f): a soft chime, then rice grains under his slow pat in the breath (rice-pot local 703)
  { after: "04_rice_pot_miracle", at: 4, file: "sfx/chime_pop", volume: 0.18 },
  { after: "04_rice_pot_miracle", at: 32, file: "rice_spill", volume: 0.2 },
];

const breathStart = (after: string): number => {
  const b = EP02_BREATHS.find((x) => x.after === after);
  if (!b) throw new Error(`Episode02: no breath after scene ${after}`);
  return b.startFrame;
};

/** A sound placed on the absolute timeline: start, real length, and the scene whose pauses gate it. */
interface PlacedSfx extends SfxSound { from: number; frames?: number; gateScene?: string }
const placeScene = (c: SfxCue): PlacedSfx | null => {
  const start = sceneStart(c.scene);
  if (c.cue !== undefined) {
    const p = phraseLocal(c.scene, c.cue);
    if (p === undefined) {
      console.warn(`Episode02: no phrase "${c.cue}" in ${c.scene}; cue ${c.file} skipped`);
      return null;
    }
    return { ...c, from: start + p + c.at, frames: c.loopFrames, gateScene: c.gate ? c.scene : undefined };
  }
  if (c.real) return { ...c, from: start + Math.round(c.at), frames: c.loopFrames, gateScene: c.gate ? c.scene : undefined };
  const a = storyReal(c.scene, c.at);
  const frames = c.loopFrames !== undefined ? storyReal(c.scene, c.at + c.loopFrames) - a : undefined;
  return { ...c, from: start + a, frames, gateScene: c.gate ? c.scene : undefined };
};
const placePause = (c: PauseCue): PlacedSfx => {
  const w = pauseWindow(c.scene, c.pause);
  return { ...c, from: sceneStart(c.scene) + (c.fromEnd ? w.end : w.start) + c.at, frames: c.loopFrames, gateScene: c.gate ? c.scene : undefined };
};
/** Every sound cue on the absolute timeline, resolved from its scene, pause or breath anchor. */
const PLACED_SFX: PlacedSfx[] = [
  ...SFX_CUES.map(placeScene).filter((c): c is PlacedSfx => c !== null),
  ...PAUSE_CUES.map(placePause),
  ...BREATH_CUES.map((c) => ({ ...c, from: breathStart(c.after) + c.at, frames: c.loopFrames })),
].filter((c) => c.frames === undefined || c.frames > 0);
const sfxSrc = (file: string) => staticFile(file.includes("/") ? `audio/${file}.wav` : `audio/sfx/ep02/${file}.wav`);
const sfxSeconds = (file: string) => SFX_SECONDS[file.split("/").pop() ?? file] ?? 2;

/** Piecewise-linear level from [frame, volume] keys (held flat before the first and after the last key). */
const levelAt = (keys: [number, number][], f: number): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [b, vb] = keys[i];
    if (f <= b) {
      const [a, va] = keys[i - 1];
      return va + (vb - va) * ((f - a) / Math.max(1, b - a));
    }
  }
  return keys[keys.length - 1][1];
};

/** Loop volume with a fade in and out, so a bed never starts or stops with a click. */
const loopVolume = (vol: (f: number) => number, frames: number, fadeIn?: number, fadeOut?: number) => (f: number) => {
  const def = Math.max(1, Math.min(8, Math.floor(frames / 4)));
  const fi = Math.max(1, fadeIn ?? def);
  const fo = Math.max(1, fadeOut ?? def);
  return vol(f) * Math.max(0, Math.min(1, f / fi, (frames - f) / fo));
};
/** The volume function of a placed cue: its level (or level keys), its loop fades, and its pause gate. */
const cueVolume = (c: PlacedSfx) => {
  const lvl = (f: number) => (c.levels && c.levels.length ? levelAt(c.levels, f) : c.volume);
  const base = c.frames !== undefined ? loopVolume(lvl, c.frames, c.fadeIn, c.fadeOut) : lvl;
  const gs = c.gateScene;
  return gs ? (f: number) => base(f) * storyRunning(gs, c.from + f) : base;
};

/* ------------------------------------------------------------------ */
/* Ducking and levels                                                  */
/* ------------------------------------------------------------------ */

/**
 * Ambient ducking. The ambient bed and the music rise in the pauses and sink under the voice, from
 * EP02_AUDIO: a clip counts as speech from its start to its end; gaps shorter than DUCK_MERGE frames
 * stay ducked so the bed never pumps between two lines. The level moves over DUCK_RAMP frames with a
 * sine ease, reaching the ducked level as the voice starts and rising only after it ends.
 * Levels (AUD-02, AUD-03; STO-16 answer 9): ambient loops open to at most 0.25 in a pause; music never above 0.25.
 */
const DUCK_RAMP = 12;
const DUCK_MERGE = 24;
const AMBIENT_OPEN = 0.25;
const AMBIENT_DUCKED = 0.16;
const MUSIC_OPEN = 0.14;
const MUSIC_DUCKED = 0.08;
const SPEECH: [number, number][] = (() => {
  const spans = EP02_AUDIO.map((a) => [a.startFrame, a.startFrame + a.frames] as [number, number]).sort((x, y) => x[0] - y[0]);
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] - last[1] < DUCK_MERGE) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
})();
/** 1 while a voice is speaking, 0 in a pause, eased in between. */
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
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));
/** A level that sits at `open` in the quiet and at `ducked` under a voice. */
const ducked = (open: number, under: number, frame: number) => open + (under - open) * speechAmount(frame);
const ambientVolumeAt = (frame: number) => ducked(AMBIENT_OPEN, AMBIENT_DUCKED, frame);

/**
 * Music swells inside a pause (plan "Sound plan for the stretch"): the scene's music bed opens to `open`
 * (instead of MUSIC_OPEN) over `ramp` frames from the pause start, and sinks under the next line as usual.
 */
const MUSIC_SWELLS: { scene: string; pause: number; open: number; ramp: number }[] = [
  // the news lands: Village_Peace_Loop rises 0.08 -> 0.18 over 1 s on the father's joy
  { scene: "01e_father_letter", pause: 1, open: 0.18, ramp: 24 },
];
const musicVolumeAt = (sceneId: string, frame: number) => {
  let open = MUSIC_OPEN;
  for (const s of MUSIC_SWELLS) {
    if (s.scene !== sceneId) continue;
    const w = pauseWindow(s.scene, s.pause);
    const a = sceneStart(s.scene) + w.start;
    if (frame >= a && frame <= a + w.frames) open = MUSIC_OPEN + (s.open - MUSIC_OPEN) * ease((frame - a) / s.ramp);
  }
  return ducked(open, MUSIC_DUCKED, frame);
};

/** Bed fade over a timed dissolve (EP02_DISSOLVES): out when the scene dissolves away, in when it dissolves in. */
const bedFade = (sceneId: string, frame: number): number => {
  let g = 1;
  for (const d of EP02_DISSOLVES) {
    const t = (frame - d.startFrame) / d.frames;
    if (d.from === sceneId) g = Math.min(g, 1 - ease(t));
    if (d.into === sceneId) g = Math.min(g, ease(t));
  }
  return g;
};

/**
 * The journey's music thread: ONE pass of Warm_Family_Flute (13.2 s) from its top on J1. It fades in 0 -> 0.20
 * over J1, lifts to 0.22 on J4 (Balak and the sky), 0.20 through J6, runs on into Ujanchar, ducks to 0.10 under
 * "চারদিকে জঙ্গলঘেরা…" and, since the file is a loop with no natural close, fades out over its last 1.5 s.
 */
const JOURNEY_MUSIC = { file: "music/Warm_Family_Flute.wav", frames: Math.floor(13.2 * 24), outFade: 36, under: 0.1 };
const journeyMusicVolume = (f: number): number => {
  const J = JOURNEY_CUT;
  const open = levelAt([[0, 0], [J[1], 0.2], [J[3], 0.2], [J[3] + 18, 0.22], [J[4] - 4, 0.22], [J[4] + 14, 0.2]], f);
  const out = Math.min(1, Math.max(0, (JOURNEY_MUSIC.frames - f) / JOURNEY_MUSIC.outFade));
  return ducked(open, JOURNEY_MUSIC.under, sceneStart(JOURNEY_ID) + f) * out;
};

/* ------------------------------------------------------------------ */
/* Dissolves                                                           */
/* ------------------------------------------------------------------ */

/**
 * Cross-dissolve from the Ujanchar dusk into the night kitchen: the Ujanchar picture keeps rendering
 * (its own clock runs on past its last local frame; its ambient motion continues) for this many frames
 * underneath, while the fox scene fades in from opacity 0 on top. A true image-to-image blend, with no
 * black between them: fox local frames 0 to 43. Only the pictures overlap; the sound beds keep their own
 * scene lengths, and the narration follows EP02_AUDIO.
 */
const UJ_DISSOLVE = 44;
/** Extra frames a scene's picture keeps rendering past its own length (under the next scene's dissolve). */
const SCENE_TAIL: Record<string, number> = { "02a_ujanchar": UJ_DISSOLVE };
/**
 * Scenes whose picture fades in from opacity 0 over the scene drawn underneath. The timed dissolves from the
 * generator (EP02_DISSOLVES: the father's letter into the journey, the journey into Ujanchar) need no tail:
 * the `from` scene's durationFrames already run to the end of the overlap.
 */
const SCENE_DISSOLVE_IN: Record<string, number> = {
  "02_fox_and_bagha_dog": UJ_DISSOLVE,
  ...Object.fromEntries(EP02_DISSOLVES.map((d) => [d.into, d.frames])),
};

/** Fades its children in from opacity 0 (a gentle sine ease), for a cross-dissolve over the scene below. */
const DissolveIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const t = Math.min(1, Math.max(0, f / frames));
  const opacity = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;
};

/**
 * Chapter break between the go-saap and the rice pot: the go-saap scene fades to black at its end, black
 * holds over the start of the rice pot, and the rice pot fades in from black after it. One soft chime sounds
 * on the black beat (rice-pot story 0, which is the start of its open pause).
 */
const CHAPTER_CHIME = { scene: "04_rice_pot_miracle", at: 0 };
/**
 * The divine motif plays only at Charu's arrival: it starts at the fox scene's P3 ("…মিষ্টি হাসছে!", plan:
 * moved there from her line) and runs to fox story 787 (where it ended before), ducked a little under her voice.
 */
const DIVINE_MOTIF = (() => {
  const scene = "02_fox_and_bagha_dog";
  const w = pauseWindow(scene, 2);
  return { from: sceneStart(scene) + w.start, frames: storyReal(scene, 787) - w.start, open: 0.22, under: 0.14 };
})();

export const Episode02: React.FC = () => (
  <div style={{ position: "relative", width: 1920, height: 1080, backgroundColor: "#0a0818" }}>
    {EP02_SCENES.map((scene, i) => {
      const SceneComponent = SCENE_COMPONENTS[scene.sceneId];
      const bed = SCENE_BEDS[scene.sceneId] ?? {};
      // A scene keeps drawing until the next one starts, so a timing gap (for example the 6 frames between
      // the mother's lap and the rain) never shows a black flash. The dissolve tail wins when it is longer.
      const next = EP02_SCENES[i + 1];
      const gap = next ? Math.max(0, next.startFrame - (scene.startFrame + scene.durationFrames)) : 0;
      const tail = Math.max(SCENE_TAIL[scene.sceneId] ?? 0, gap);
      const dissolveIn = SCENE_DISSOLVE_IN[scene.sceneId];
      const gain = bed.ambientGain ?? 1;
      return (
        <React.Fragment key={scene.sceneId}>
          <Sequence from={scene.startFrame} durationInFrames={scene.durationFrames + tail}>
            {dissolveIn ? (
              <DissolveIn frames={dissolveIn}>
                <SceneComponent />
              </DissolveIn>
            ) : (
              <SceneComponent />
            )}
          </Sequence>
          <Sequence from={scene.startFrame} durationInFrames={scene.durationFrames} layout="none">
            {/* Beds rise in the pauses and duck under the voice (absolute frame = scene start + local) */}
            {bed.ambient && (
              <Audio
                src={staticFile(`audio/${bed.ambient}`)}
                loop
                volume={(f) => gain * ambientVolumeAt(scene.startFrame + f) * bedFade(scene.sceneId, scene.startFrame + f)}
              />
            )}
            {bed.music && (
              <Audio
                src={staticFile(`audio/${bed.music}`)}
                loop
                volume={(f) => musicVolumeAt(scene.sceneId, scene.startFrame + f) * bedFade(scene.sceneId, scene.startFrame + f)}
              />
            )}
            {bed.sfx && <Audio src={staticFile(`audio/${bed.sfx}`)} volume={0.4} />}
          </Sequence>
        </React.Fragment>
      );
    })}
    {/* The journey's music thread, one pass from J1 into Ujanchar */}
    <Sequence from={sceneStart(JOURNEY_ID)} durationInFrames={JOURNEY_MUSIC.frames}>
      <Audio src={staticFile(`audio/${JOURNEY_MUSIC.file}`)} volume={journeyMusicVolume} />
    </Sequence>
    {/* One soft chime on the black beat between the go-saap and the rice pot */}
    <Sequence from={sceneStart(CHAPTER_CHIME.scene) + storyReal(CHAPTER_CHIME.scene, CHAPTER_CHIME.at)} durationInFrames={60}>
      <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={(f) => 0.2 * Math.min(1, (60 - f) / 12)} />
    </Sequence>
    {/* The divine motif plays only at Charu's arrival in the fox scene */}
    <Sequence from={DIVINE_MOTIF.from} durationInFrames={DIVINE_MOTIF.frames}>
      <Audio
        src={staticFile("audio/music/Divine_Motif.wav")}
        loop
        volume={(f) =>
          ducked(DIVINE_MOTIF.open, DIVINE_MOTIF.under, DIVINE_MOTIF.from + f) *
          Math.max(0, Math.min(1, f / 12, (DIVINE_MOTIF.frames - f) / 24))
        }
      />
    </Sequence>
    {/* Sound effects at the scene events, in the pauses and in the breaths */}
    {PLACED_SFX.map((c, k) => (
      <Sequence key={`sfx-${k}-${c.file}-${c.from}`} from={c.from} durationInFrames={c.frames ?? Math.ceil(sfxSeconds(c.file) * 24)}>
        <Audio src={sfxSrc(c.file)} loop={c.frames !== undefined} volume={cueVolume(c)} playbackRate={c.rate ?? 1} />
      </Sequence>
    ))}
    {/* Narration clips (EP02_AUDIO; a clip cut at a scene split or a pause plays as NAME_p1, NAME_p2, ...) */}
    {EP02_AUDIO.map((a) => (
      <Sequence key={a.file} from={a.startFrame} durationInFrames={a.frames}>
        <Audio src={staticFile(`audio/ep02/${a.file}`)} volume={1} />
      </Sequence>
    ))}
    {/* The intro title page carries no narration captions; captions start with the source card. */}
    <SeriesSubtitles cues={EP02_CUES.filter((c) => c.from >= EP02_SCENES[1].startFrame)} />
  </div>
);
