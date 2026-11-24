import React from "react";
import { EP03_SCENES } from "../timing";
import { EP03_CUES } from "../subtitles";
import { clamp, EASE, hash, lerp, makeActing, noise1, PoseKey, track, windowed } from "../../cinematic/core/anim";
import { Cam } from "../../cinematic/core/Stage";
import { DivineDefs } from "../../cinematic/divine/Divine";
import { GlowDefs } from "../../cinematic/fx/Fx";
import { FACE_LOOKS } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../../cinematic/rig/lipsync";
import { BASE_POSE, CastMember, Lighting, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../../cinematic/rig/Puppet";
import { Layer, Stage } from "../../cinematic/core/Stage";
import { CourtyardBack, CourtyardFloor, TulsiMancha } from "../../cinematic/sets/Interiors";
import { DaySky } from "../../cinematic/sets/S01_DaySets";
import { Grade } from "../../cinematic/core/Stage";
import { clipSpan3, cueLocalStory3, pausesFor3, storyToReal, useStory3 } from "../../episode/storyClock";
import { SeatedChild, seatedChildHands } from "../rig/SeatedChild";
import { S01_MINA, S01_REKHA, S01_SARALA, S01_TUNI, VEDIC_COURTYARD } from "./Scene01SharadFlowerGathering";
import { BirulGlow } from "../rig/BirulGlow";

/**
 * Episode 3, scene 02 (02_flowers_on_own_feet): the main story, at the VEDIC HOUSE (Bhagabati Thakur's big joint
 * family, STO-18, book chapter 5), in its established inner courtyard (CourtyardBack and CourtyardFloor from
 * src/cinematic/sets/Interiors.tsx, untouched) in morning light, laid out exactly as scene 01 lays it out
 * (VEDIC_COURTYARD, exported by Scene01SharadFlowerGathering.tsx): the shiuli, jhumko and big jaba trees, the tulsi
 * mancha (Interiors TulsiMancha) and the full sajis the young girls of the house have set down at the tulsi-tala.
 * Five-year-old Balak sits at the foot of the tulsi mancha, waters it, lays three red hibiscus from the girls' dala
 * on his OWN feet and bows to himself; the girls who came to pick flowers gather round him and scold him, half
 * shocked and half teasing (STO-17a: the eldest girl speaks the recorded line, lip-synced, while the others nod and
 * giggle behind their hands; Charu is NOT in this scene); he answers THEM with simple divine wisdom. Approved plan:
 * 03_Episodes/Episode_03_Five_Year_Old_Wisdom/01_Script_and_Storyboard/Ep03_Shots_and_Pauses_DRAFT.md (Scene 02,
 * beats 02A, 02B, 02C), with the scolding re-assigned to the girls by STO-17a.
 *
 * Clocks (src/episode/storyClock.ts, EP03_PAUSES): `f` is the story clock (it holds in the nine pauses) and drives
 * Balak's choreography; `lifeF` is the real local frame and drives breathing, blinks, the glow, the fade, the
 * camera (whose cuts sit on narration cues, never inside a pause) and the standing figures (the three girls and the
 * scene 01 women), whose pause reactions are keyed on the real frames of each pause. Every key is tied to a subtitle
 * cue (cueReal / cueStory) plus the measured voice onset inside that phrase (V below), or to a pause.
 *
 * Staging: the three girls start at the left of the courtyard; on "হঠাৎ সবাই দেখে" they turn to him and walk over,
 * gathering in a gentle half-circle at his left (the eldest in front and nearest him, the middle girl behind her,
 * the youngest at the left) before the medium; they watch him from there and scold him on the line.
 *
 * Shots (CAM-13; hard cuts, held frames, one motivated move at most per line; real frames from the cue data):
 *   1 wide             open pause and "হঠাৎ সবাই দেখে…": the courtyard, Balak at the tulsi mancha, the girls at the
 *                      left, the scene 01 women at the right with their full sajhis; heads turn on "সবাই" and the
 *                      girls walk over to him
 *   2 medium           cut on "তুলসীতলায়": the pour, the fallen leaf, the flowers from the dala; one slow push in
 *                      (x1.31) on "নিজের পায়ে" to his hands, the basket and his feet; held through 02A P2 (the girls
 *                      exchange a glance)
 *   3 MCU              cut on "আর নিজেই": palms join, the bow (প্রণাম), his head rises; held through 02A P3 while his
 *                      glow brightens gently (key beat 1) and the girls glance at each other, wide-eyed
 *   4 eldest girl MCU  cut 7 f before "ওমা": hand to her cheek; 02B P1 a small shake of the head, the hand comes down,
 *                      the others lean in and giggle behind their hands
 *   5 two-shot         cut on "তুই": the eldest at the left, Balak at the right with the three hibiscus on his feet
 *                      (above y 820); she points gently at them on "নিজের পায়ে"; he glances down at them and back up
 *                      at her in 02B P2 while she waits, brows up
 *   6 group            cut on "দেখিস": the girls round him, the eldest wagging a finger, the others nodding; held
 *                      through 02B P3 (they giggle, the eldest waits for his answer)
 *   7 Balak MCU        cut 7 f before "তোদের ভগবান…": open palm, eyes to his feet, palms to his chest; 02C P1
 *   8 reverse          cut on "তোমাদের": the girls listening, smiles fading; 02C P2 they glance at each other, unsure
 *   9 Balak MCU        cut 7 f before "আমি ভগবান হলে": then one slow push in on "গাছ কেটে" (x1.35, on lifeF) held
 *                      through his last line and the end pause as his glow brightens gently (key beat 2)
 * No handheld, no rack focus, no letterbox. Every cam goes through courtyardKeepInSet (no background edge).
 *
 * Balak is drawn by SeatedChild; the girls and the women by Puppet.
 */

const SCENE_ID = "02_flowers_on_own_feet";
const SCENE = EP03_SCENES.find((s) => s.sceneId === SCENE_ID)!;
const DUR = SCENE.durationFrames;
const PAUSES = pausesFor3(SCENE_ID);

/* ---------------- narration anchors ---------------- */

/** Real local start frame of the first subtitle phrase of this scene containing `snippet`. */
const cueReal = (snippet: string, fallback: number): number => {
  const c = EP03_CUES.find((q) => q.from >= SCENE.startFrame && q.from < SCENE.startFrame + DUR && q.text.includes(snippet));
  return c ? c.from - SCENE.startFrame : fallback;
};
/** Story frame (scene-local) where the phrase containing `snippet` starts. */
const cueStory = (snippet: string, fallback: number): number => cueLocalStory3(snippet, SCENE_ID)?.from ?? fallback;
/** Story frame of pause i (sorted by atStory). */
const pauseStory = (i: number, fallback: number): number => PAUSES[i]?.atStory ?? fallback;
/** Real local frames [start, end) of pause i. */
const pauseReal = (i: number): [number, number] => {
  const p = PAUSES[i];
  if (!p) return [0, 0];
  const s = storyToReal(p.atStory, PAUSES);
  return [s, s + p.frames];
};

/**
 * Voice onsets, real local frames: each phrase start plus where the voice really begins inside it (measured from the
 * clip silences at -35 dB; the caption phrases start up to 20 frames early).
 */
const V = {
  sabai: cueReal("হঠাৎ সবাই", 24) + 14,
  tulsi: cueReal("তুলসীতলায়", 118) + 17,
  nijerPaye: cueReal("থেকে ফুল", 206) + 53,
  ar: cueReal("আর নিজেই", 316) + 8,
  oma: cueReal("ওমা", 429) + 6,
  eki: cueReal("একি কাণ্ড", 443) + 6,
  tui: cueReal("তুই ঠাকুরের", 501) + 9,
  tuiPaye: cueReal("তুই ঠাকুরের", 501) + 44,
  dekhis: cueReal("দেখিস", 650) + 8,
  shap: cueReal("ভগবান শাপ", 699) + 1,
  toder: cueReal("তোদের ভগবান", 789) + 7,
  amar: cueReal("আমার পায়ে", 848) + 20,
  tomader: cueReal("তোমাদের", 957) + 9,
  ami: cueReal("আমি ভগবান হলে", 1099) + 11,
  gach: cueReal("গাছ কেটে", 1160) + 17,
};

/** Phrase starts on the story clock (Balak's choreography). */
const ST = {
  tulsi: cueStory("তুলসীতলায়", 94),
  ar: cueStory("আর নিজেই", 268),
  oma: cueStory("ওমা", 333),
  tui: cueStory("তুই ঠাকুরের", 381),
  toder: cueStory("তোদের ভগবান", 597),
  amar: cueStory("আমার পায়ে", 656),
  tomader: cueStory("তোমাদের", 741),
  kichu: cueStory("কিছু বোঝেও", 815),
  ami: cueStory("আমি ভগবান হলে", 847),
  gach: cueStory("গাছ কেটে", 908),
};

/** The nine pauses (CAM-14, STO-17), real frames. */
const P_OPEN = pauseReal(0); // 02A open
const P_FLOWERS = pauseReal(1); // 02A after "…নিজের পায়ে দিচ্ছে,"
const P_PRANAM = pauseReal(2); // 02A after "…প্রণাম করছে!"
const P_KANDO = pauseReal(3); // 02B after "…একি কাণ্ড!"
const P_KENO = pauseReal(4); // 02B after "…কেন রে?"
const P_SHAP = pauseReal(5); // 02B after "…শাপ দেবেন!"
const P_TER = pauseReal(6); // 02C after "…টের পাই।"
const P_BOJHE = pauseReal(7); // 02C after "…বোঝেও না!"
const P_END = pauseReal(8); // 02C end

/* ---------------- lip sync (real voice envelopes) ---------------- */

/**
 * Per-frame RMS envelopes (24 fps, 0..1) of the played voice parts, measured from public/audio/ep03/*_pN.wav.
 * visemeFromEnvelope turns them into mouth shapes, with the vowels taken from the Bengali text.
 */
const ENV: Record<string, number[]> = {
  "02b_Girls_Tease_p1.wav": [0,0,0,0,0,0,0.08,0.35,0.53,0.58,0.66,0.92,1,1,0.85,0.42,0.49,0.51,0.73,0.9,0.83,0.93,0.66,0.52,0.49,0.48,0.5,0.48,0.42,0.53,0.53,0.53,0.52,0.47,0.31,0.1,0,0,0,0.01,0.01,0.01,0.01,0.01,0,0.01,0,0],
  "02b_Girls_Tease_p2.wav": [0,0.02,0.15,0.25,0.23,0.19,0.05,0,0.01,0.14,0.58,0.36,0.04,0,0.28,0.66,0.46,0.47,0.43,0.62,0.49,0.56,0.95,0.72,0.74,0.65,0.48,0.29,0.11,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0.04,0.44,1,0.94,0.04,0,0,0.26,0.23,0.32,0.12,0.25,0.34,0.19,0.01,0.01,0.21,0.78,0.5,0.7,0.57,0.33,0.04,0.01,0.04,0.45,1,0.9,0.67,0.71,0.77,0.59,0.61,0.54,0.56,0.76,0.81,0.3,0.42,0.54,0.26,0.34,0,0.05,0.56,0.77,1,0.46,0.07,0.24,0.04,0.03,0.16,0.1,0.33,0.28,0.02,0.1,0.58,0.36,0.38,1,0.85,0.54,0.96,0.88,0.51,0.32,0.1,0.01,0],
  "02b_Girls_Tease_p3.wav": [0,0.01,0.01,0.01,0.01,0.01,0,0,0.29,0.23,0.08,1,0.83,0.25,0.05,0.1,0.68,0.47,0.18,0,0.06,0.79,0.4,0,0,0,0,0.17,0.54,0.26,0.39,0.51,0.54,0.35,0.01,0.09,0.47,0.7,0.91,0.17,0.8,0.61,0.19,0,0.01,0.01,0,0,0,0,0.21,0.48,0.08,0.09,0.49,0.78,0.2,0.21,0.47,0.56,0.71,0.34,0.14,0.16,0.19,0.17,0.13,0.06,0.1,0.2,0.71,1,0.22,0.14,0.83,0.43,0.98,0.92,0.38,1,1,0.68,0.51,0.34,0.17,0.08,0,0,0,0,0,0,0,0,0,0,0],
  "02c_Toddler_Thakur_p1.wav": [0,0,0,0,0,0,0,0.51,0.94,0.25,0.91,0.75,0.27,0,0.02,0.84,0.13,0.15,1,0.56,0.25,0.75,0.3,0.79,0.49,0.41,0.13,0.1,0.73,0.37,0.89,0.98,0.43,0.37,0.47,0.35,0.27,0.81,1,0.94,1,0.32,0,0.02,0.1,0.62,0.9,0.83,0.36,1,0.61,0.47,0.34,0.15,0.09,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01,0,0.01,0.01,0,0,0,0,0.14,0.74,0.59,0.48,0.51,0.61,0.5,0.42,0.14,0,0,0.89,0.74,0.58,0.14,0,0.08,0.05,0.9,0.58,0.82,1,0.79,0.88,0.9,0.53,0.64,0.56,0.02,0.07,0.93,0.92,0.82,0.49,0.66,0.56,0.73,0.58,0.79,0.63,0.56,0.18,0.34,0.1,0.01,0.48,0.7,0.79,0.68,0.28,0.01,0.09,0.25,0.17,0.1,0.07,0,0.01,0,0,0,0,0,0,0],
  "02c_Toddler_Thakur_p2.wav": [0,0,0,0,0,0,0,0.03,0,0.11,1,0.83,0.82,0.63,0.51,0.58,0.27,0.55,0.6,0.55,0.53,0.61,0.68,0.72,0.43,0.1,0.41,0.67,0.43,0.57,0.51,0.49,0.39,0.03,0,0.07,1,0.4,0,0.76,0.92,0.55,0.09,0.04,0.04,0.02,0.01,0.02,0,0.45,0.71,0.77,0.74,0.58,0.68,0.57,0.61,0.46,0.37,0.3,0.31,0.36,0.42,0.53,0.45,0.5,0.5,0.39,0.23,0.1,0.01,0,0,0.05,0.68,0.06,0.3,0.92,0.25,0.27,0.21,1,0.76,1,0.64,0.18,0.14,0.25,0.9,0.51,0.42,0.35,0.64,0.49,0.03,0,0,0,0,0,0,0,0,0,0,0,0],
  "02c_Toddler_Thakur_p3.wav": [0,0,0,0,0,0,0,0,0,0,0,0.75,0.9,0.7,0.61,0.46,0.48,0.53,0.59,0.39,0.67,1,1,0.32,0.43,0.7,0.48,1,0.65,0.37,0.06,0.03,0.7,0.6,1,0.57,0.45,0.08,0.02,0.02,0.02,0.01,0,0,0.03,0.55,0.76,0.04,0.49,0.81,0,0,0,0.07,0.08,0.03,0.76,0.69,0.87,0.81,0.91,0.54,0.58,0.58,0.61,0.52,0.79,0.73,0.47,0.2,0.04,0,0,0,0,0,0,0,0.13,0.24,0.11,0.68,0.73,0.65,0.5,0.13,0.1,0.14,0.01,0.18,0.35,0.06,0.43,0.5,0.47,0.56,0.56,0.2,0.91,1,0.16,0.13,0.94,0.89,0.24,0.04,0.67,0.78,0.51,0.82,0.39,0.08,0.01,0,0.2,0.36,0.11,0.01,0.05,0.28,0.25,0.19,0.18,0.15,0.11,0.06,0,0,0,0,0,0,0,0,0,0,0,0],
};
const TEXT: Record<string, string> = {
  "02b_Girls_Tease_p1.wav": "ওমা, একি কাণ্ড!",
  "02b_Girls_Tease_p2.wav": "তুই ঠাকুরের ফুল নিজের পায়ে দিচ্ছিস কেন রে?",
  "02b_Girls_Tease_p3.wav": "দেখিস তোর পাপ হবে, ভগবান শাপ দেবেন!",
  "02c_Toddler_Thakur_p1.wav": "তোদের ভগবান তোদের শাপ দেবে! আমার পায়ে ফুল দিলে তো আমি বেশ টের পাই।",
  "02c_Toddler_Thakur_p2.wav": "তোমাদের মাটির মূর্তি তো নড়েও না, কিছু বোঝেও না!",
  "02c_Toddler_Thakur_p3.wav": "আমি ভগবান হলে কিন্তু ফুল কেন, গাছ কেটে নিলেও কাউকে রাগ করতাম না!",
};
/**
 * The girls' clip (02b_Girls_Tease, caption মেয়েরা; spoken on screen by the eldest girl, STO-17a) and Balak's, from
 * the timing data.
 */
const GIRLS_PARTS = clipSpan3("02b_Girls_Tease.wav")?.parts ?? [];
const BALAK_PARTS = clipSpan3("02c_Toddler_Thakur.wav")?.parts ?? [];

const voiceAt = (parts: typeof GIRLS_PARTS, realLocal: number) => {
  const abs = SCENE.startFrame + realLocal;
  for (const p of parts) {
    if (abs >= p.startFrame && abs < p.startFrame + p.frames) return { env: ENV[p.file], rel: abs - p.startFrame, text: TEXT[p.file] };
  }
  return null;
};
/** The eldest girl's mouth at real local frame fr (only she moves her lips to this clip; the other girls never do). */
const eldestMouth = (fr: number): MouthState => {
  const v = voiceAt(GIRLS_PARTS, fr);
  return v ? visemeFromEnvelope(v.env, v.rel, 13, v.text) : MOUTH_REST;
};
/**
 * Her speech envelope for the rig, phrase-level: on while any frame within 6 of fr is voiced, so the dips between
 * syllables do not read as pauses (the rig blinks at every speech pause; per-syllable gaps made a speaker blink almost
 * continuously and look asleep). It runs on the real clock, so it is silent across every pause boundary (PIT-03).
 */
const eldestVoiced = (fr: number): boolean => {
  const v = voiceAt(GIRLS_PARTS, fr);
  return !!v && speechLevel(v.env, v.rel) > 0.06;
};
const eldestTalk = (fr: number): number => {
  for (let k = -6; k <= 6; k++) if (eldestVoiced(fr + k)) return 0.6;
  return 0;
};
/** Balak's mouth openness (0..0.9) at real local frame fr. */
const balakMouth = (fr: number): number => {
  const v = voiceAt(BALAK_PARTS, fr);
  return v ? clamp(visemeFromEnvelope(v.env, v.rel, 17, v.text).open * 0.9, 0, 0.9) : 0;
};

/* ---------------- layout ---------------- */

/*
 * Two coordinate systems.
 *  WORLD: the Vedic house inner courtyard's own coordinates (CourtyardFloor on depth 1, floor from y 784), shared with
 *    scene 01 (its header "SHARED LAYOUT FOR SCENES 01 AND 02"): the trees, the tulsi mancha at (1700, 842, s 1.1),
 *    the sajis at its foot, and the camera.
 *  STAGING: the coordinates Balak's choreography, the girls and every shot were built in (Balak at (930, 950), s 1.25).
 *    One group transform places the staging in the world: Balak sits at the mancha's foot (W0) and everything in the
 *    staging is scaled by STAGE_K (he is that much further back on the floor), so every composition is unchanged.
 */
const S0 = { x: 930, y: 950 };
const W0 = { x: 1487, y: 858 };
const STAGE_K = 0.85;
const toWorld = (x: number, y: number) => ({ x: W0.x + STAGE_K * (x - S0.x), y: W0.y + STAGE_K * (y - S0.y) });
const toStage = (x: number, y: number) => ({ x: S0.x + (x - W0.x) / STAGE_K, y: S0.y + (y - W0.y) / STAGE_K });
const STAGING_TRANSFORM = `translate(${W0.x} ${W0.y}) scale(${STAGE_K}) translate(${-S0.x} ${-S0.y})`;

const BALAK_POS = { x: S0.x, y: S0.y, s: 1.25 };
/**
 * The tulsi mancha where scene 01 has it (world (1700, 842), Interiors TulsiMancha at s 1.1), in staging units. The
 * water from the rig's kolsi lands at the left corner of its step (figure x 120).
 */
const TULSI_WORLD = VEDIC_COURTYARD.tulsi;
const TULSI = { ...toStage(TULSI_WORLD.x, TULSI_WORLD.y), s: TULSI_WORLD.s / STAGE_K };
/** The mancha's niche lamp (lit): the diya of the scene (Interiors TulsiMancha's niche diya at (0, -62)). */
const LAMP = { x: TULSI.x, y: TULSI.y - 62 * TULSI.s };
/** The kolsi rests on a low wooden pidi beside him, where the rig's hand takes it up for the pour. */
const KOLSI_REST = { x: BALAK_POS.x + 148, y: 946 - 26 * 0.85 - 9 };
/**
 * Where Balak's hand picks a hibiscus (SeatedChild `basketAt`, figure units, ground at y = 0): just past his far
 * knee, inside reach. The scene's single basket is drawn around this point, so the rig hand always dips into the
 * visible basket (the rig's own basket is off).
 */
const BASKET_AT = { x: 92, y: -30 };
const BASKET_SCALE = 0.75;
const BASKET = {
  x: BALAK_POS.x + BASKET_AT.x * BALAK_POS.s,
  // The top flower of the basket sits 24 basket units above its centre.
  y: BALAK_POS.y + BASKET_AT.y * BALAK_POS.s + 24 * BASKET_SCALE,
};
/** The fallen tulsi leaf he picks up: exactly where SeatedChild's pickLeaf hand goes (figure (96, -2)). */
const PICK_LEAF = { x: BALAK_POS.x + 96 * BALAK_POS.s, y: BALAK_POS.y - 2 * BALAK_POS.s };
const FLOOR_LEAVES = [
  { dx: 170, dy: 22, rot: 20, s: 1.0 },
  { dx: 45, dy: 30, rot: -60, s: 0.9 },
  { dx: 205, dy: 36, rot: 75, s: 0.85 },
  { dx: 80, dy: 44, rot: 110, s: 0.8, c: "#8f7a3a" },
];

/**
 * The three girls: where they stand at the start (by the big jaba tree, in front of its bed) and their places in the
 * half-circle at Balak's left once they have walked over (the eldest in front and nearest him, the middle girl
 * behind her, the youngest at the left), a step nearer the camera than Balak at the mancha. The scale grows a touch
 * as they come forward.
 */
interface Spot {
  x: number;
  y: number;
  s: number;
}
const ELDEST_FROM: Spot = { x: 345, y: 1000, s: 1.04 };
const ELDEST_TO: Spot = { x: 560, y: 1035, s: 1.1 };
const YOUNG_FROM: Spot = { x: 205, y: 990, s: 1.0 };
const YOUNG_TO: Spot = { x: 350, y: 1022, s: 1.05 };
const MIDDLE_FROM: Spot = { x: 275, y: 980, s: 0.97 };
const MIDDLE_TO: Spot = { x: 460, y: 1010, s: 1.0 };
/**
 * The scene 01 girls of the house, at the right past the tulsi mancha, their full sajis set down at the tulsi-tala
 * (STO-18): world spots, drawn in staging units.
 */
const WOMEN_S = 0.9;
const WOMEN_AT = [
  toStage(1880, 866),
  toStage(1972, 860),
  toStage(2058, 870),
  toStage(2146, 863),
];

/* ---------------- the Vedic house's inner courtyard (STO-18) ---------------- */

/**
 * Planes, back to front: the morning sky above the balcony (0.12); the back building of the inner courtyard, with
 * its balcony, arches and plinth (CourtyardBack, 0.55, as Episode 1 stages it); the courtyard floor with its flagstones
 * and alpona (CourtyardFloor, 1), on which the big trees, the tulsi mancha, the sajis and every figure stand.
 */
const CY = { sky: 0.12, back: 0.55, floor: 1 } as const;
/** Stage background (only seen through soft layer edges). */
const CY_BG = "#e9d2a8";
/** Horizontal extents per plane [depth, x0, x1] (stage px) and the floor's bottom edge. */
const CY_SET_X: Array<[number, number, number]> = [
  [CY.floor, -400, 2320],
  [CY.back, -300, 2220],
  [CY.sky, -1200, 3200],
];
const CY_FLOOR_TOP = 784;
const CY_FLOOR_BOTTOM = 1384;

const smax = (a: number, b: number, k: number) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
const smin = (a: number, b: number, k: number) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + k * k));

/**
 * Clamps a Stage cam so no plane's edge comes into frame (soft corners): left and right edges of every plane, the
 * floor's bottom, and the seam between the back building's plinth (0.55) and the floor's front (1), which must stay
 * covered by the floor.
 */
const courtyardKeepInSet = (c: Cam): Cam => {
  const EDGE = 16;
  const z = Math.max(1, c.zoom);
  let lo = -Infinity;
  let hi = Infinity;
  for (const [d, x0, x1] of CY_SET_X) {
    const s = Math.pow(z, d);
    lo = Math.max(lo, (x0 + EDGE - 960 + 960 / s) / d);
    hi = Math.min(hi, (x1 - EDGE - 960 - 960 / s) / d);
  }
  const w = Math.pow(z, CY.back);
  const yLo = z > 1.0001 ? ((CY_FLOOR_TOP - 540) * (z - w) + 6) / (z - CY.back * w) : 6;
  const yHi = CY_FLOOR_BOTTOM - EDGE - 540 - 540 / z;
  return { ...c, x: smin(smax(c.x, lo, 24), hi, 24), y: smin(smax(c.y, yLo, 24), yHi, 24) };
};

/* ---------------- camera ---------------- */

/** A camera frame: centre and zoom in STAGING units (world: true for a frame given in WORLD units). */
interface Frame {
  cx: number;
  cy: number;
  z: number;
  world?: boolean;
}
/**
 * The establishing wide, in WORLD units: the whole inner courtyard as scene 01 shows it (the shiuli, jhumko and big
 * jaba trees, the arches), Balak small at the tulsi mancha on the right, the girls under the jaba tree.
 */
const WIDE: Frame = { cx: 1200, cy: 600, z: 1.0, world: true };
const MED: Frame = { cx: 990, cy: 832, z: 1.8 };
/** The medium after its push (x1.31): hands, basket and feet, the feet and flowers above y 820. */
const MED_CLOSE: Frame = { cx: 1050, cy: 872, z: 2.3 };
const BOW_MCU: Frame = { cx: 1000, cy: 800, z: 2.6 };
/** The eldest girl's close-up: her face right of centre, Balak just off frame at the right (his soft halo at the edge). */
const ELDEST_MCU: Frame = { cx: 455, cy: 780, z: 3.0 };
/** The eldest and Balak, the three hibiscus on his feet in view (above y 820). */
const TWO_SHOT: Frame = { cx: 770, cy: 822, z: 2.4 };
/** The girls round him, Balak at the right. */
const GROUP: Frame = { cx: 660, cy: 790, z: 1.7 };
/** His close-ups keep the eldest girl (x 560) fully out of frame on the left (no half figure at the edge). */
const BALAK_MCU: Frame = { cx: 1020, cy: 795, z: 2.5 };
/** The girls listening, Balak just off frame at the right. */
const REVERSE: Frame = { cx: 420, cy: 780, z: 2.5 };
/** Where the last push lands: about x1.35 on his face. */
const FINAL_CU: Frame = { cx: 950, cy: 772, z: 3.38 };

/** Hard cuts, real local frames, each on its narration cue (a speaker's close-up 7 frames before the voice). */
const SHOTS: Array<{ from: number; fr: Frame }> = [
  { from: -Infinity, fr: WIDE },
  { from: V.tulsi - 2, fr: MED },
  { from: V.ar - 2, fr: BOW_MCU },
  { from: V.oma - 7, fr: ELDEST_MCU },
  { from: V.tui - 2, fr: TWO_SHOT },
  { from: V.dekhis - 2, fr: GROUP },
  { from: V.toder - 7, fr: BALAK_MCU },
  { from: V.tomader - 2, fr: REVERSE },
  { from: V.ami - 7, fr: BALAK_MCU },
];
/** The one push of 02A: on "নিজের পায়ে", 30 frames, then held through the flowers and 02A P2. */
const PUSH_FEET = { a: V.nijerPaye - 3, b: V.nijerPaye + 27 };
/** The one push of 02C: on "গাছ কেটে", slow, on lifeF, landing just before the scene's fade-out. */
const PUSH_END = { a: V.gach - 3, b: DUR - 14 };

const mixFrame = (a: Frame, b: Frame, t: number): Frame => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  // log-zoom mix: an even pace from the wider start to the tight end
  z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)),
});

const cameraAt = (lf: number): Cam => {
  let k = 0;
  for (let i = 0; i < SHOTS.length; i++) if (lf >= SHOTS[i].from) k = i;
  let fr = SHOTS[k].fr;
  if (fr === MED && lf >= PUSH_FEET.a) fr = mixFrame(MED, MED_CLOSE, EASE.inOut(clamp((lf - PUSH_FEET.a) / (PUSH_FEET.b - PUSH_FEET.a))));
  if (k === SHOTS.length - 1 && lf >= PUSH_END.a) fr = mixFrame(BALAK_MCU, FINAL_CU, EASE.inOut(clamp((lf - PUSH_END.a) / (PUSH_END.b - PUSH_END.a))));
  // staging frames go through the staging transform, so each shot frames exactly what it was built to frame
  const p = fr.world ? { x: fr.cx, y: fr.cy } : toWorld(fr.cx, fr.cy);
  const z = fr.world ? fr.z : fr.z / STAGE_K;
  return courtyardKeepInSet({ x: p.x - 960, y: p.y - 540, zoom: z, focus: 1, dof: 0.8, shake: 0 });
};

/* ---------------- Balak (SeatedChild) ---------------- */

type ChildProps = React.ComponentProps<typeof SeatedChild>;
type ChildPose = NonNullable<ChildProps["pose"]>;
type ChildFace = NonNullable<ChildProps["face"]>;
type ExprName = NonNullable<ChildProps["expression"]>;

/**
 * The pour starts 4 frames into "তুলসীতলায়": he lifts the kolsi as the word begins and the water runs through
 * "তুলসীতলায় জল ঢেলে".
 */
const POUR_AT = ST.tulsi + 4;
/**
 * Rig clock phase. SeatedChild runs two cycles on its own frame clock (the pour tilt, the leaf-pick reach). Every
 * frame number handed to the rig (f, poseStart, prevPoseStart, expressionStart) is shifted by this constant, which
 * phases those cycles onto the pour beat: the water runs from 2 to 34 frames after POUR_AT and the hand closes on the
 * fallen leaf 67 frames after it (inside "ঝরাপাতা"). Breathing, blinks and glances run on lifeF.
 */
const RIG_PHASE = 2766 - POUR_AT;
const LEAF_AT = POUR_AT + 42;

/**
 * Placement clock: local frames since a placement beat began -> the rig's placeFlowerOnFoot clock. The rig's phases
 * are reach into the basket (rig 0-10), grip (10-14), carry to the foot (14-24), let go (24-30) and hand back to the
 * knee (30-44). Here the three placements fit between the leaf pick and 02A P2 (the third flower is laid and the hand
 * is back on the knee when the pause begins): reach 7, grip 4, a visible 12-frame arced carry (basketArc), let go 3,
 * hand back 6; 32 local frames for the rig's 44.
 */
const PLACE_WARP: Array<[number, number]> = [
  [0, 0],
  [7, 10], // reach into the basket
  [11, 14], // pick: fingers close on a flower in the basket
  [23, 24], // lift and carry to the foot (12 frames, arced)
  [26, 30], // lay it down and let go
  [32, 44], // hand back to the knee
];
const PLACE_LEN = 32;
const PLACE_CONTACT = 23; // local frame of a placement where the rig lays the flower (rig clock 24)
const PLACE_TAIL = 44 - PLACE_LEN; // the rig clock runs this far ahead of the local clock after a placement

const placeClock = (tau: number): number => {
  if (tau <= 0) return tau;
  for (let i = 1; i < PLACE_WARP.length; i++) {
    const [a, ra] = PLACE_WARP[i - 1];
    const [b, rb] = PLACE_WARP[i];
    if (tau <= b) return ra + ((tau - a) / (b - a)) * (rb - ra);
  }
  return tau + PLACE_TAIL; // past the end: rest on the knee
};

/** Arc height of the carry, in figure units (about 27 px on screen at s = 1.25): the hand clears the far knee. */
const CARRY_ARC = 22;

/** The three placements end exactly where 02A P2 holds the story. */
const PLACE_END = pauseStory(1, 268);
const PLACE_1 = PLACE_END - 3 * PLACE_LEN;
/** 02A: palms join on "আর নিজেই", the bow on "প্রণাম", the head rises and is settled when 02A P3 begins. */
const PALMS_AT = ST.ar + 4;
const BOW_AT = PALMS_AT + 16;
const RISE_AT = pauseStory(2, 328) - 18;

/**
 * Balak's pose timeline (story frames). The rig eases every joint from the previous pose over 16 frames, so beats are
 * at least 16 frames apart, and every pause falls on a settled pose (never mid-action).
 */
const BALAK_BEATS: Array<{ from: number; pose: ChildPose; place?: boolean }> = [
  { from: -999, pose: "sitCross" }, // seated quietly at the foot of the tulsi mancha
  { from: POUR_AT, pose: "pour" }, // lifts the kolsi and pours ("তুলসীতলায় জল ঢেলে")
  { from: LEAF_AT, pose: "pickLeaf" }, // reaches down to the fallen leaf ("ঝরাপাতা")
  // Three hibiscus from the dala onto his feet ("ডালা থেকে ফুল তুলে নিজের পায়ে দিচ্ছে"): reach, pick, a visible arc,
  // lay, hand back. Laid at PLACE_1 + 23, + 55, + 87; the hand is back on the knee at 02A P2.
  { from: PLACE_1, pose: "placeFlowerOnFoot", place: true },
  { from: PLACE_1 + PLACE_LEN, pose: "placeFlowerOnFoot", place: true },
  { from: PLACE_1 + 2 * PLACE_LEN, pose: "placeFlowerOnFoot", place: true },
  { from: PALMS_AT, pose: "bless" }, // "আর নিজেই নিজেকে": palms join at his chest
  { from: BOW_AT, pose: "bowHands" }, // "প্রণাম করছে": the bow to himself
  { from: RISE_AT, pose: "bless" }, // head rises, palms still joined: held through 02A P3
  { from: pauseStory(2, 328) + 1, pose: "sitCross" }, // hands back to his knees as the eldest girl gasps
  // 02C, his answer: full poses only (a part-way blend reads as a hand on the hip), the gaze carries the phrasing.
  { from: ST.toder - 1, pose: "palmRaise" }, // "তোদের ভগবান তোদের শাপ দেবে!": an open blessing palm
  { from: ST.toder + 54, pose: "sitCross" }, // hand back to his knee; on "আমার পায়ে" he looks down at his feet
  { from: ST.amar + 52, pose: "bless" }, // "আমি বেশ টের পাই": palms come together at his chest (held in 02C P1)
  { from: ST.tomader + 15, pose: "palmRaise" }, // "তোমাদের মাটির মূর্তি তো নড়েও না,": the open palm to them
  { from: ST.kichu - 9, pose: "sitCross" }, // lowered on "নড়েও না"
  { from: pauseStory(7, 847) - 13, pose: "bless" }, // "আমি ভগবান হলে": hands at his chest
  { from: ST.ami + 37, pose: "sitCross" }, // "কিন্তু ফুল কেন": hands down, eyes on the flowers
  { from: ST.gach + 10, pose: "palmRaise" }, // key line "গাছ কেটে নিলেও…": a blessing hand
  { from: ST.gach + 46, pose: "bowHands" }, // "রাগ করতাম না": palms join with a small bow of the head
  { from: ST.gach + 64, pose: "bless" }, // the head rises, serene, palms joined: held through the end pause
];

const beatIndex = (f: number): number => {
  let idx = 0;
  BALAK_BEATS.forEach((b, i) => {
    if (f >= b.from) idx = i;
  });
  return idx;
};

/** Number of flowers laid on his feet by story frame f (1, 2, 3; they stay on his feet to the end). */
const footFlowersAt = (f: number): number => BALAK_BEATS.filter((b) => b.place && f >= b.from + PLACE_CONTACT).length;

interface BalakRig {
  pose: ChildPose;
  prevPose?: ChildPose;
  poseStart: number;
  prevPoseStart?: number;
  basketAt: { x: number; y: number };
}

/** All pose props for SeatedChild at story frame f (frame numbers already on the rig clock). */
const balakRig = (f: number): BalakRig => {
  const i = beatIndex(f);
  const beat = BALAK_BEATS[i];
  const prev = i > 0 ? BALAK_BEATS[i - 1] : undefined;
  const tau = f - beat.from;
  // Timed placements run on the warped clock; poseStart is chosen so that f - poseStart is that clock.
  const clock = beat.place ? placeClock(tau) : tau;
  const out: BalakRig = {
    pose: beat.pose,
    // A placement following another placement is the same pose: no blend (the hand is back on the knee at the end of
    // each one, where the next starts).
    prevPose: prev && prev.pose !== beat.pose ? prev.pose : undefined,
    poseStart: f - clock + RIG_PHASE,
    // A finished placement is evaluated past its end (rig clock >= 44: hand resting on the knee).
    prevPoseStart: prev ? prev.from + RIG_PHASE - (prev.place ? PLACE_TAIL : 0) : undefined,
    basketAt: BASKET_AT,
  };
  if (beat.place) {
    // Carry arc: the rig moves the wrist in a straight line from the basket grip to the foot over rig clock 14-24.
    // Raising basketAt by 4H*s during it adds a parabola that lifts the flower by CARRY_ARC at the middle and lands
    // exactly on the foot.
    const s = clamp((clock - 14) / 10);
    const sm = s * s * (3 - 2 * s);
    out.basketAt = { x: BASKET_AT.x, y: BASKET_AT.y - 4 * CARRY_ARC * sm };
  }
  return out;
};

/** Facial expression track (story frames); each entry blends in over 18 frames from the one before. */
const BALAK_EXPR: Array<{ from: number; e: ExprName }> = [
  { from: -999, e: "serene" },
  { from: ST.ar + 10, e: "compassionate" }, // the pranam
  { from: pauseStory(2, 328) + 1, e: "serene" }, // calm while the girls scold him
  { from: ST.amar + 50, e: "compassionate" }, // "আমি বেশ টের পাই"
  { from: ST.tomader + 15, e: "serene" },
  // "কিছু বোঝেও না!" and "আমি ভগবান হলে": serene (playful and thoughtful read sly: lopsided smile, heavy lids)
  { from: ST.gach + 8, e: "compassionate" }, // the key line, to the end
];

const balakExpr = (f: number) => {
  let idx = 0;
  BALAK_EXPR.forEach((x, i) => {
    if (f >= x.from) idx = i;
  });
  return {
    expression: BALAK_EXPR[idx].e,
    prevExpression: idx > 0 ? BALAK_EXPR[idx - 1].e : undefined,
    expressionStart: BALAK_EXPR[idx].from + RIG_PHASE,
  };
};

/**
 * Gaze (story frames). lookX < 0 turns toward the girls at his left (-0.75 the eldest, -0.85 the group: enough to read as looking at them, never a side-eye), > 0 toward the tulsi in front of him.
 * While he works the rig points his eyes at the water, the leaf and each flower itself. While he answers he looks at
 * the people he speaks to (no lookUp), except where his words name his feet or the flowers.
 */
const balakFaceAt = (f: number): Required<ChildFace> => {
  const seeFlowers = ST.tui + 46; // the eldest girl's "নিজের পায়ে" (voice)
  const amar = ST.amar + 20; // his "আমার পায়ে" (voice)
  const keno = ST.ami + 43; // "কিন্তু ফুল কেন" (voice)
  const kauke = ST.gach + 36; // "কাউকে"
  return {
    lookX: track(f, [
      [0, 0.1],
      [ST.oma - 4, 0.1],
      [ST.oma + 8, -0.75, "inOut"], // the eldest girl gasps at his left
      [seeFlowers, -0.75],
      [seeFlowers + 12, -0.12, "inOut"], // glances down at the flowers on his feet
      [pauseStory(4, 494), -0.12],
      [pauseStory(4, 494) + 1, -0.75], // (02B P2 brings his eyes back up to the eldest: balakPauseFace)
      [pauseStory(4, 494) + 26, -0.75],
      [pauseStory(4, 494) + 40, -0.85, "inOut"], // the girls giggle
      [ST.toder - 6, -0.85],
      [ST.toder + 4, -0.75, "inOut"], // answers the girls (the eldest first)
      [amar - 2, -0.75],
      [amar + 10, -0.18, "inOut"], // "আমার পায়ে": his feet
      [amar + 26, -0.18],
      [amar + 38, -0.75, "inOut"], // "আমি বেশ টের পাই", to the eldest
      [ST.tomader + 6, -0.75],
      [ST.tomader + 16, -0.85, "inOut"], // "তোমাদের মাটির মূর্তি", to all of them
      [ST.ami - 6, -0.85],
      [ST.ami + 2, -0.75, "inOut"], // "আমি ভগবান হলে", to the eldest
      [keno - 4, -0.75],
      [keno + 8, -0.14, "inOut"], // "কিন্তু ফুল কেন": the flowers on his feet
      [keno + 16, -0.14],
      [keno + 28, -0.75, "inOut"], // the key line, to the eldest
      [kauke - 6, -0.75],
      [kauke + 8, -0.85, "inOut"], // "কাউকে": across to the girls
      [ST.gach + 62, -0.85],
      [ST.gach + 82, -0.5, "inOut"], // the head rises, serene, softly toward them and us
    ]),
    eyesDown: track(f, [
      [0, 0],
      [seeFlowers, 0],
      [seeFlowers + 12, 0.6, "inOut"],
      [pauseStory(4, 494), 0.6],
      [pauseStory(4, 494) + 1, 0],
      [amar - 2, 0],
      [amar + 10, 0.6, "inOut"],
      [amar + 26, 0.6],
      [amar + 38, 0, "inOut"],
      [keno - 4, 0],
      [keno + 8, 0.5, "inOut"],
      [keno + 16, 0.5],
      [keno + 28, 0, "inOut"],
    ]),
    smile: track(f, [
      [0, 0.45],
      [60, 0.55],
      [ST.oma, 0.5],
      [ST.toder, 0.5],
      [ST.amar + 50, 0.66, "inOut"],
      [ST.ami, 0.7],
      [ST.gach + 40, 0.8, "inOut"],
      [ST.gach + 100, 0.86],
    ]),
  };
};

const bump = (t: number, a: number, b: number, c: number, d: number) =>
  EASE.inOut(clamp((t - a) / (b - a))) * (1 - EASE.inOut(clamp((t - c) / (d - c))));

/**
 * The pause moments on his face (the story clock is held, so these run on the pause's own progress t):
 *  02A P2: he looks down at the three red flowers on his feet with a serene, faint smile.
 *  02B P2: his eyes come back up from the flowers to the eldest girl, unbothered, with a faint smile.
 *  02C P3 (end): the smile settles, serene.
 */
const balakPauseFace = (base: Required<ChildFace>, pause: ReturnType<typeof useStory3>["pause"]): Required<ChildFace> => {
  if (!pause.inPause) return base;
  const t = pause.t;
  if (pause.index === 1) {
    const w = bump(t, 0.05, 0.35, 0.82, 1);
    return { lookX: lerp(base.lookX, 0.2, w), eyesDown: lerp(base.eyesDown, 0.55, w), smile: base.smile + 0.12 * w };
  }
  if (pause.index === 4) {
    const up = EASE.inOut(clamp((t - 0.3) / 0.4));
    return { lookX: lerp(-0.12, -0.75, up), eyesDown: lerp(0.6, 0, up), smile: base.smile + 0.1 * up };
  }
  if (pause.index === 8) return { ...base, smile: base.smile + 0.06 * EASE.inOut(clamp(t / 0.6)) };
  return base;
};

/** The glow: steady and restrained, brightening gently only on the pranam (02A P3) and his last line (to the end). */
const GLOW_BASE = 0.72;
const glowBeat = (lf: number): number => {
  const bowReal = storyToReal(BOW_AT, PAUSES);
  const beat1 = track(lf, [
    [bowReal, 0],
    [P_PRANAM[0] + 8, 1, "inOut"],
    [P_PRANAM[1], 1],
    [P_PRANAM[1] + 90, 0, "inOut"],
  ]);
  const beat2 = track(lf, [
    [V.gach - 4, 0],
    [P_END[0] + 12, 1, "inOut"],
  ]);
  return Math.max(beat1, beat2);
};

/**
 * End-of-scene blink placement (BAL serene eyes, PIT-03). The rig's seeded blink schedule put a slow blink at the very
 * end of 02C P3 (from about 2382 global), so the shot faded out on lids half-way down: sleepy, even sly. The rig's life
 * clock is eased 20 frames ahead between his last blink during "গাছ কেটে…" and the end pause (at most about 1.27x for a
 * few seconds, unnoticeable in breath and sway), which lands that blink inside the pause (about 2362 to 2377): one
 * short natural blink while the story waits, and his eyes are softly open for the rest of the pause and the fade.
 */
const END_BLINK_SHIFT = 20;
const rigLifeShift = (lf: number): number =>
  END_BLINK_SHIFT * EASE.inOut(clamp((lf - (P_END[0] - 97)) / 111));

/* ---------------- standing cast: acting on real frames ---------------- */

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

/** Small weight shifts and sway on top of keyed poses; `seed` gives each figure its own rhythm. */
const sway = (base: (fr: number) => Pose, seed: number, amp = 1) => (fr: number): Partial<Pose> => {
  const k = base(fr);
  const t = fr + seed * 9;
  return {
    ...k,
    bodyX: k.bodyX + noise1(t * 0.011, seed) * 2.4 * amp,
    lean: k.lean + noise1(t * 0.017, seed + 2) * 0.9 * amp,
    headTilt: k.headTilt + noise1(t * 0.023, seed + 4) * 1.2 * amp,
  };
};

/** A giggle: a quick head bob and a shoulder shake inside [a, b], each girl with her own period and phase. */
const giggleAt = (fr: number, windows: Array<[number, number]>, period: number, phase: number) => {
  let nod = 0;
  let dx = 0;
  for (const [a, b] of windows) {
    const env = windowed(fr, a, b, 6);
    if (env <= 0) continue;
    const u = (fr - a) / period;
    nod += Math.sin(u * Math.PI * 2 + phase) * 4.5 * env;
    dx += Math.sin(u * Math.PI * 2 * 0.62 + phase * 0.5) * 3 * env;
  }
  return { nod, dx };
};

/** Slow agreeing nods inside each window (headNod degrees, downward only), each girl with her own period and phase. */
const nodsAt = (fr: number, windows: Array<[number, number]>, period: number, phase: number, amp = 3.4) => {
  let nod = 0;
  for (const [a, b] of windows) {
    const env = windowed(fr, a, b, 8);
    if (env <= 0) continue;
    nod += Math.max(0, Math.sin(((fr - a) / period) * Math.PI * 2 + phase)) * amp * env;
  }
  return nod;
};

/*
 * The three girls who came to pick flowers (STO-17a). On "হঠাৎ সবাই দেখে" they turn to him and walk over, gathering
 * in a gentle half-circle at his left; the eldest speaks the scolding line (lip sync), the other two nod, lean in and
 * giggle behind their hands. Charu is not in this scene: the girls even threaten to tell his mother.
 */

/** Each girl eases from her start spot to her place in the half-circle. */
const walkSpot = (from: Spot, to: Spot, a: number, b: number) => (lf: number): Spot => {
  const t = EASE.inOut(clamp((lf - a) / (b - a)));
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), s: lerp(from.s, to.s, t) };
};
/** Step amplitude follows the travel speed (about 13 px a frame at stride 1 for a girl at scale 1): no sliding feet. */
const strideOf = (spot: (lf: number) => Spot) => (lf: number): number => {
  const a = spot(lf - 1);
  const b = spot(lf + 1);
  return clamp(Math.hypot(b.x - a.x, b.y - a.y) / 2 / (13 * spot(lf).s), 0, 1);
};
/** The eldest sets off a beat after the heads turn on "সবাই"; all three are in place soon after the cut to the medium. */
const WALK_A = V.sabai + 14;
const ELDEST_AT = walkSpot(ELDEST_FROM, ELDEST_TO, WALK_A, WALK_A + 86);
const MIDDLE_AT = walkSpot(MIDDLE_FROM, MIDDLE_TO, WALK_A + 4, WALK_A + 96);
const YOUNG_AT = walkSpot(YOUNG_FROM, YOUNG_TO, WALK_A + 10, WALK_A + 94);

const skinMid = { skin: "#c98d63", skinLight: "#e6b088", skinShade: "#a0663f", lips: "#a35448" };
const skinWarm = { skin: "#d9a07a", skinLight: "#f0c4a0", skinShade: "#b47853", lips: "#b0605a" };
const skinDeep = { skin: "#b97a52", skinLight: "#d89a70", skinShade: "#8d5536", lips: "#94493f" };

/** The eldest girl (about thirteen, the speaker), teen-sized, cotton saree with a teal blouse, long plaits. */
const GIRL_A_CAST: CastMember & { look?: (typeof FACE_LOOKS)[string] } = {
  id: "cousin_a",
  age: "adult",
  sex: "f",
  height: 0.86,
  girth: 1.0,
  ...skinDeep,
  hair: "#1b1211",
  hairLight: "#45342c",
  hairStyle: "pigtails",
  outfit: "blouse",
  top: "#3f8f7a",
  topLight: "#63b09c",
  topShade: "#2a6a5a",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#f4ecd8",
  lowerShade: "#d6c9ad",
  lowerTrim: "#c2563a",
  ribbon: "#ffd23f",
  look: FACE_LOOKS.madhu,
  seed: 53,
};

/** The youngest girl, a rose frock and plaits. */
const GIRL_B_CAST: CastMember & { look?: (typeof FACE_LOOKS)[string] } = {
  id: "cousin_b",
  age: "child",
  sex: "f",
  height: 1.0,
  girth: 1.0,
  ...skinWarm,
  hair: "#1c1312",
  hairLight: "#4d3a31",
  hairStyle: "pigtails",
  outfit: "frock",
  top: "#d0587a",
  topLight: "#e27a96",
  topShade: "#9c3556",
  sleeve: "half",
  lower: "none",
  lowerColor: "#5b7ec0",
  lowerShade: "#3f5c96",
  look: FACE_LOOKS.madhu,
  seed: 61,
};

/** A middle girl, about ten, a marigold frock and plaits. */
const GIRL_C_CAST: CastMember & { look?: (typeof FACE_LOOKS)[string] } = {
  id: "cousin_c",
  age: "child",
  sex: "f",
  height: 1.1,
  girth: 1.0,
  ...skinMid,
  hair: "#1a1110",
  hairLight: "#47362d",
  hairStyle: "pigtails",
  outfit: "frock",
  top: "#e0a32c",
  topLight: "#f0c25e",
  topShade: "#a87616",
  sleeve: "half",
  lower: "none",
  lowerColor: "#4f8f5a",
  lowerShade: "#356b40",
  ribbon: "#d0587a",
  look: FACE_LOOKS.madhu,
  seed: 71,
};

/*
 * The eldest girl ("elder sisterly", half shocked, half teasing). Keys reach their pose at `f` after `in` frames, so a
 * gesture keyed at cue + in - 8 starts 8 frames before its word.
 */
const ELDEST_KEYS: PoseKey<Pose>[] = [
  { f: 0, bodyTurn: 0.3, headTurn: -0.35, smile: 0.5, rS: 8, rE: -10, lS: 8, lE: -10, rHand: "relaxed", lHand: "relaxed" },
  // "সবাই দেখে": she turns to him, then walks over (body turned to her travel)
  { f: V.sabai + 6, in: 12, ease: "inOut", headTurn: 0.42, eyeX: 0.3, smile: 0.4 },
  { f: WALK_A + 18, in: 16, ease: "inOut", bodyTurn: 0.45, headTurn: 0.34 },
  // in her place, facing him, curious
  { f: WALK_A + 94, in: 16, ease: "inOut", bodyTurn: 0.38, headTurn: 0.42, brow: 0.25, smile: 0.4, lean: 1 },
  // "নিজের পায়ে": her brows go up (on his own feet?)
  { f: V.nijerPaye + 6, in: 12, ease: "inOut", brow: 0.55, smile: 0.25, headTilt: 4 },
  // 02A P2: a quick wide-eyed glance at the youngest beside her, then back to him
  { f: P_FLOWERS[0] + 6, in: 7, ease: "inOut", headTurn: -0.18, eyeX: -0.35 },
  { f: P_FLOWERS[0] + 20, in: 8, ease: "inOut", headTurn: 0.42, eyeX: 0.3 },
  // "প্রণাম করছে": he bows to himself; she straightens, eyes wide
  { f: V.ar + 40, in: 14, ease: "inOut", brow: 0.65, smile: 0.15, lean: -1, headTilt: 0 },
  // 02A P3: she glances back at the other two, wide-eyed; a breath in before she speaks
  { f: P_PRANAM[0] + 14, in: 8, ease: "inOut", headTurn: -0.2, eyeX: -0.4 },
  { f: P_PRANAM[0] + 34, in: 10, ease: "inOut", headTurn: 0.42, eyeX: 0.3, gasp: 0.12 },
  // "ওমা": her hand flies up to her cheek and chin (8 frames before the voice; the frontal arm rig stops at the jaw)
  { f: V.oma + 4, in: 12, ease: "out", lS: 32, lE: -170, lHand: "relaxed", gasp: 0.3, brow: 0.75, smile: 0.2, headTurn: 0.45, lean: -1 },
  // "একি কাণ্ড!": a small shake of the head, the hand still at her cheek
  { f: V.eki + 10, in: 10, ease: "inOut", headTilt: 4 },
  { f: V.eki + 20, in: 10, ease: "inOut", headTilt: -3 },
  // 02B P1: one more little shake, then the hand comes down and a teasing smile grows
  { f: P_KANDO[0] + 8, in: 8, ease: "inOut", headTilt: 2 },
  { f: P_KANDO[0] + 22, in: 14, ease: "inOut", lS: 8, lE: -10, gasp: 0, brow: 0.5, headTilt: 0, smile: 0.38 },
  // "তুই ঠাকুরের ফুল…": the elder-sister tone, she leans toward him
  { f: V.tui + 4, in: 12, ease: "inOut", bodyTurn: 0.44, headTurn: 0.48, lean: 3, brow: 0.45, smile: 0.3, headTilt: 3 },
  // "নিজের পায়ে": she points gently at the flowers on his feet (8 frames before the words), eyes on them
  { f: V.tuiPaye + 2, in: 10, ease: "out", rS: 55, rE: -6, rHand: "point", eyeY: 0.35, headNod: 3 },
  // "দিচ্ছিস কেন রে?": the point opens into a questioning palm, the head tilts
  { f: V.tuiPaye + 40, in: 12, ease: "inOut", rS: 30, rE: -42, rHand: "open", eyeY: 0, headNod: 0, headTilt: 6, brow: 0.6 },
  // 02B P2: she waits for an answer, brows up, a playful tilt; the palm drops
  { f: P_KENO[0] + 22, in: 14, ease: "inOut", rS: 12, rE: -16, rHand: "relaxed", headTilt: 7, brow: 0.55, smile: 0.4, lean: 2 },
  // "দেখিস তোর পাপ হবে": the forefinger comes up (eldestWag wags it), she leans in
  { f: V.dekhis + 2, in: 10, ease: "out", rS: 32, rE: 125, rHand: "point", lean: 5, headTilt: -3, smile: 0.3, brow: 0.5 },
  // "ভগবান শাপ দেবেন!": a little nod with it
  { f: V.shap + 6, in: 12, ease: "inOut", lean: 6, headNod: 4, brow: 0.6, smile: 0.35 },
  // 02B P3: the finger comes down; she waits for his answer, half scolding, half smiling
  { f: P_SHAP[0] + 16, in: 16, ease: "inOut", lean: 2, headNod: 0, headTilt: 4, rS: 10, rE: -14, rHand: "relaxed", smile: 0.42, brow: 0.4 },
  // 02C: she listens
  { f: V.toder + 10, in: 12, ease: "inOut", brow: 0.55, smile: 0.3, headTilt: 1 },
  { f: V.amar + 30, in: 30, ease: "inOut", brow: 0.3, smile: 0.28, headTilt: 3 },
  // "তোমাদের মাটির মূর্তি…": the smile fades, a little puzzled
  { f: V.tomader + 40, in: 40, ease: "inOut", smile: 0.12, brow: 0.38, headTilt: -2 },
  // 02C P2: a glance at the youngest, unsure; back to him, her brow softening
  { f: P_BOJHE[0] + 12, in: 9, ease: "inOut", headTurn: -0.18, eyeX: -0.35, brow: 0.3 },
  { f: P_BOJHE[0] + 30, in: 12, ease: "inOut", headTurn: 0.45, eyeX: 0.3, brow: 0.05, smile: 0.3, lid: 0.1, headTilt: 4 },
];
const eldestBase = sway(A(ELDEST_KEYS), 53, 0.8);
const ELDEST_STRIDE = strideOf(ELDEST_AT);
/** The finger wag on "দেখিস তোর পাপ হবে, ভগবান শাপ দেবেন!": small, quick, playful. */
const eldestWag = (fr: number) => windowed(fr, V.dekhis + 6, V.shap + 34, 8) * Math.sin((fr - V.dekhis) * 0.62);
const ELDEST_ACT = (fr: number): Partial<Pose> => {
  const k = eldestBase(fr);
  const chat = windowed(fr, -20, V.sabai + 6, 8) * 2.5 * Math.sin(fr * 0.33 + 53);
  const wag = eldestWag(fr);
  return {
    ...k,
    headNod: (k.headNod ?? 0) + chat,
    rE: (k.rE ?? 0) + 13 * wag,
    rS: (k.rS ?? 0) + 3 * wag,
    stride: ELDEST_STRIDE(fr),
  };
};

/**
 * The other two girls (they never speak). `d` staggers them; `toEldest` is the head turn that looks at the eldest;
 * `toOther` the turn that looks at the other follower (02C P2).
 */
const followerKeys = (d: number, chatTurn: number, toEldest: number, toOther: number): PoseKey<Pose>[] => [
  { f: 0, bodyTurn: 0.3, headTurn: chatTurn, smile: 0.5, rS: 8, rE: -10, lS: 8, lE: -10, rHand: "relaxed", lHand: "relaxed" },
  // "সবাই দেখে": they turn to him and follow the eldest over
  { f: V.sabai + 6 + d, in: 12, ease: "inOut", headTurn: 0.42, eyeX: 0.3, smile: 0.4 },
  { f: WALK_A + 22 + d, in: 16, ease: "inOut", bodyTurn: 0.45, headTurn: 0.34 },
  { f: WALK_A + 98 + d, in: 16, ease: "inOut", bodyTurn: 0.36, headTurn: 0.42, brow: 0.2, smile: 0.45 },
  // "নিজের পায়ে": eyes wide
  { f: V.nijerPaye + 10 + d, in: 12, ease: "inOut", brow: 0.5, smile: 0.3 },
  // 02A P2: a glance at the eldest, back to him
  { f: P_FLOWERS[0] + 6 + d * 0.5, in: 7, ease: "inOut", headTurn: toEldest, eyeX: toEldest * 0.6 },
  { f: P_FLOWERS[0] + 20 + d * 0.5, in: 8, ease: "inOut", headTurn: 0.42, eyeX: 0.3 },
  // 02A P3: the glance again, brows up
  { f: P_PRANAM[0] + 12 + d, in: 8, ease: "inOut", headTurn: toEldest, eyeX: toEldest * 0.6, brow: 0.6 },
  { f: P_PRANAM[0] + 32 + d, in: 10, ease: "inOut", headTurn: 0.42, eyeX: 0.3 },
  // "ওমা": they look at the eldest as she gasps
  { f: V.oma + 8 + d, in: 10, ease: "inOut", headTurn: toEldest, eyeX: toEldest * 0.6, brow: 0.3, smile: 0.45 },
  // 02B P1: back to him, leaning in, a giggle behind the hand
  { f: P_KANDO[0] + 6 + d, in: 9, ease: "out", headTurn: 0.45, eyeX: 0.3, lS: 14, lE: -166, lHand: "open", lean: 4, smile: 0.9, lid: 0.3, headTilt: 6 },
  { f: P_KANDO[0] + 26 + d * 0.6, in: 12, ease: "inOut", lS: 8, lE: -10, lHand: "relaxed", lean: 3, lid: 0, smile: 0.6, headTilt: 2, brow: 0.1 },
  // "দেখিস তোর পাপ হবে": they lean in, nodding along (nodsAt)
  { f: V.dekhis + 10 + d, in: 12, ease: "inOut", lean: 5, smile: 0.55 },
  // 02B P3: the giggle behind the hand
  { f: P_SHAP[0] + 6 + d, in: 8, ease: "out", lS: 14, lE: -166, lHand: "open", lean: 5, smile: 0.95, lid: 0.3, headTilt: 7 },
  { f: P_SHAP[0] + 30 + d * 0.6, in: 12, ease: "inOut", lS: 8, lE: -10, lHand: "relaxed", lean: 2, lid: 0, smile: 0.6, headTilt: 1 },
  // "তোমাদের মাটির মূর্তি…": their smiles slowly fade
  { f: V.tomader + 60 + d, in: 50, ease: "inOut", smile: 0.28, brow: 0.2, lean: 0 },
  // 02C P2: the last giggle fades; they glance at each other, unsure, and back to him
  { f: P_BOJHE[0] + 18 + d * 0.3, in: 10, ease: "inOut", headTurn: toOther, eyeX: toOther * 0.6, brow: 0.38, smile: 0.22 },
  { f: P_BOJHE[0] + 34 + d * 0.3, in: 12, ease: "inOut", headTurn: 0.42, eyeX: 0.3, brow: 0.15, smile: 0.32 },
];
const followerAct = (
  keys: PoseKey<Pose>[],
  seed: number,
  spot: (lf: number) => Spot,
  period: number,
  phase: number,
  giggles: Array<[number, number]>,
  nods: Array<[number, number]>,
) => {
  const base = sway(A(keys), seed, 1);
  const strideAt = strideOf(spot);
  return (fr: number): Partial<Pose> => {
    const k = base(fr);
    const g = giggleAt(fr, giggles, period, phase);
    // the open pause: a few nods as they chat, before they turn to him
    const chat = windowed(fr, -20, V.sabai + 6, 8) * 2.5 * Math.sin(fr * 0.33 + seed);
    const nod = nodsAt(fr, nods, period + 4, phase);
    return { ...k, headNod: (k.headNod ?? 0) + g.nod + chat + nod, bodyX: (k.bodyX ?? 0) + g.dx, stride: strideAt(fr) };
  };
};
const MIDDLE_ACT = followerAct(
  followerKeys(4, 0.55, 0.62, -0.3),
  71,
  MIDDLE_AT,
  16,
  1,
  [
    [P_KANDO[0] + 4, P_KANDO[0] + 28],
    [P_SHAP[0] + 4, P_SHAP[0] + 30],
    [P_BOJHE[0], P_BOJHE[0] + 12],
  ],
  [
    [V.tuiPaye - 4, V.tuiPaye + 50],
    [V.dekhis + 12, V.shap + 30],
  ],
);
const YOUNG_ACT = followerAct(
  followerKeys(10, 0.55, 0.62, 0.2),
  61,
  YOUNG_AT,
  14,
  2,
  [
    [P_KANDO[0] + 10, P_KANDO[0] + 34],
    [P_SHAP[0] + 11, P_SHAP[0] + 36],
  ],
  [
    [V.tuiPaye + 2, V.tuiPaye + 56],
    [V.dekhis + 18, V.shap + 34],
  ],
);

/* The scene 01 girls of the house (STO-18): their full sajis set down at the tulsi-tala, they stand past the mancha
 * at the right, chat in the open pause and turn to him on "সবাই দেখে", one after another. */

const SPOTS: Array<[number, number]> = [
  [-16, -12],
  [-4, -18],
  [10, -14],
  [20, -7],
  [-22, -5],
  [2, -7],
  [14, -2],
  [-9, -3],
  [-1, -24],
];
type FlowerKind = "jaba" | "shiuli" | "jhumko";
const Bloom: React.FC<{ x: number; y: number; r: number; kind: FlowerKind; rot?: number }> = ({ x, y, r, kind, rot = 0 }) => {
  const petal = kind === "jaba" ? "#d8222f" : kind === "shiuli" ? "#fbf7f0" : "#f5a524";
  const core = kind === "jaba" ? "#6f0a12" : kind === "shiuli" ? "#f0962c" : "#b8600e";
  const n = kind === "jhumko" ? 6 : 5;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
      {Array.from({ length: n }, (_, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={-r * 0.52}
          rx={r * (kind === "shiuli" ? 0.3 : 0.42)}
          ry={r * (kind === "shiuli" ? 0.56 : 0.6)}
          fill={petal}
          transform={`rotate(${(i * 360) / n})`}
        />
      ))}
      <circle r={r * 0.2} fill={core} />
    </g>
  );
};
const Sprig: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale * 0.9}) translate(0, -18)`}>
    <path d="M 0 0 Q 6 -18 12 -34" stroke="#7a5a2c" strokeWidth={2} fill="none" strokeLinecap="round" />
    <Bloom x={12} y={-34} r={7} kind="shiuli" />
    <Bloom x={-2} y={-22} r={5.5} kind="shiuli" rot={30} />
    <Bloom x={24} y={-22} r={5.5} kind="shiuli" rot={-20} />
  </g>
);

/**
 * Loose, damp hair down the back (just bathed, STO-01), as scene 01 draws it: behind a standing Puppet in its own
 * coordinates, following the pose's bodyX, bodyY and lean; the rig's parted hair cap sits on top of it.
 */
const LooseHair: React.FC<{ cast: CastMember; pose: Partial<Pose>; lifeF: number; x: number; y: number; scale: number }> = ({ cast, pose, lifeF, x, y, scale }) => {
  const h = cast.height;
  const R = 41 * Math.sqrt(h);
  const hipY = -162.7 * h;
  const shY = hipY - 108 * h;
  const headY = shY - 11 * h - R * 0.86;
  const turn = pose.bodyTurn ?? 0;
  const xb = -Math.sign(turn || 0.001) * clamp(Math.abs(turn) / 0.5) * R * 0.32;
  const sw = 47 * h;
  const endY = shY + 108 * h * 0.62;
  const sw2 = 3 * noise1(lifeF * 0.03, cast.seed) + 2 * Math.sin(lifeF * 0.05 + cast.seed);
  const d = `M ${xb - R * 0.98} ${headY - R * 0.2}
    Q ${xb - R * 1.08} ${headY + R * 0.9} ${xb - sw * 0.78} ${shY + 10}
    Q ${xb - sw * 0.84 + sw2 * 0.5} ${shY + (endY - shY) * 0.55} ${xb - sw * 0.6 + sw2} ${endY}
    Q ${xb + sw2} ${endY + 12} ${xb + sw * 0.6 + sw2} ${endY - 4}
    Q ${xb + sw * 0.82 + sw2 * 0.5} ${shY + (endY - shY) * 0.5} ${xb + sw * 0.76} ${shY + 8}
    Q ${xb + R * 1.08} ${headY + R * 0.9} ${xb + R * 0.98} ${headY - R * 0.2}
    Q ${xb} ${headY - R * 1.25} ${xb - R * 0.98} ${headY - R * 0.2} Z`;
  return (
    <g transform={`translate(${x + (pose.bodyX ?? 0)}, ${y + (pose.bodyY ?? 0)}) scale(${scale}) rotate(${pose.lean ?? 0}, 0, ${hipY})`}>
      <path d={d} fill={cast.hair} />
      {[-0.5, -0.15, 0.2, 0.5].map((k, i) => (
        <path
          key={i}
          d={`M ${xb + k * R * 1.4} ${headY + R * 0.4} Q ${xb + k * sw * 1.3 + sw2 * 0.3} ${shY + 20} ${xb + k * sw * 1.05 + sw2 * 0.8} ${endY - 6}`}
          stroke={cast.hairLight}
          strokeWidth={1.6}
          fill="none"
          opacity={0.55}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

/**
 * A woman's track: in the open pause she chats (head toward her neighbour, a few nods), then turns to him on
 * "সবাই" (`d` staggers the turns) and watches.
 */
const womanAct = (seed: number, d: number, chatTurn: number, hold: Partial<Pose>) => {
  const base = sway(
    A([
      { f: 0, bodyTurn: -0.22, headTurn: chatTurn, smile: 0.45, rS: 6, rE: -8, lS: 6, lE: -8, ...hold },
      { f: V.sabai + 4 + d, in: 12, ease: "inOut", headTurn: -0.45, eyeX: -0.4, smile: 0.35, brow: 0.25 },
      { f: V.sabai + 60 + d, in: 30, ease: "inOut", brow: 0.1, smile: 0.45, eyeX: -0.25 },
    ]),
    seed,
    0.8,
  );
  return (fr: number): Partial<Pose> => {
    const k = base(fr);
    const chat = windowed(fr, -20, V.sabai + d, 8) * 2.5 * Math.sin(fr * 0.3 + seed);
    return { ...k, headNod: (k.headNod ?? 0) + chat };
  };
};
/** Sarala, Mina, Tuni and Rekha, exactly as scene 01 dresses them (loose damp hair on the three elder girls). */
const WOMEN: Array<{ cast: CastMember; x: number; y: number; act: (fr: number) => Partial<Pose>; props: Record<string, PropRenderer>; hair?: boolean }> = [
  { cast: S01_SARALA, ...WOMEN_AT[0], act: womanAct(101, 0, 0.3, { lHand: "relaxed", rHand: "relaxed" }), props: {}, hair: true },
  { cast: S01_MINA, ...WOMEN_AT[1], act: womanAct(207, 6, -0.3, { lHand: "relaxed", rHand: "relaxed" }), props: {}, hair: true },
  { cast: S01_TUNI, ...WOMEN_AT[2], act: womanAct(311, 10, 0.25, { rS: 80, rE: -84, rHand: "hold", rProp: "sprig" }), props: { sprig: Sprig } },
  { cast: S01_REKHA, ...WOMEN_AT[3], act: womanAct(419, 3, -0.3, { lHand: "relaxed", rHand: "relaxed" }), props: {}, hair: true },
];

/* ---------------- drawn pieces ---------------- */

const KolsiShape: React.FC = () => (
  <g>
    <path d="M -10 -4 Q -20 2 -10 9" stroke="#8a4a24" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <path d="M 7 -4 Q 13 -8 17 -12" stroke="#9a5a30" strokeWidth={4} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={2} rx={11} ry={11} fill="#b8703f" />
    <ellipse cx={-3} cy={-1} rx={5} ry={6} fill="#dca070" opacity={0.6} />
    <ellipse cx={0} cy={-11} rx={5} ry={2.2} fill="#8a4a24" />
  </g>
);

const Hibiscus: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    {[0, 1, 2, 3, 4].map((i) => (
      <ellipse key={i} cx={0} cy={-8} rx={6.5} ry={9} fill={i % 2 ? "#f0473f" : "#d81f26"} transform={`rotate(${i * 72})`} />
    ))}
    <circle cx={0} cy={0} r={3} fill="#5e0610" />
    <path d="M 0 0 L 3 -9" stroke="#f2c14e" strokeWidth={1.4} strokeLinecap="round" />
  </g>
);

const Leaf: React.FC<{ x: number; y: number; rot?: number; s?: number; c?: string }> = ({ x, y, rot = 0, s = 1, c = "#5f9a3c" }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 -15 Q 10 -4 0 15 Q -10 -4 0 -15 Z" fill={c} />
    <path d="M 0 -11 L 0 10" stroke="#2d5a22" strokeWidth={1} opacity={0.6} />
  </g>
);

/**
 * The scene's single woven bamboo basket (ডালা) of red hibiscus and leaves, just past Balak's far knee at the foot
 * of the tulsi mancha. Its top flower sits on BASKET_AT, where the rig hand picks; the rig fades its own flower in
 * there before each pick, so the basket always looks full.
 */
const Basket: React.FC = () => (
  <g transform={`translate(${BASKET.x}, ${BASKET.y}) scale(${BASKET_SCALE})`}>
    <ellipse cx={0} cy={20} rx={50} ry={8} fill="#000" opacity={0.25} />
    <path d="M -42 -12 Q 0 4 42 -12 L 32 14 Q 0 26 -32 14 Z" fill="#a67c3c" />
    <path d="M -38 -2 Q 0 13 38 -2" stroke="#7a5a28" strokeWidth={2} fill="none" />
    <path d="M -35 7 Q 0 21 35 7" stroke="#7a5a28" strokeWidth={1.6} fill="none" opacity={0.7} />
    <ellipse cx={0} cy={-12} rx={42} ry={9} fill="#c9a36a" />
    <ellipse cx={0} cy={-12} rx={36} ry={6} fill="#7a5a28" opacity={0.55} />
    <Leaf x={-26} y={-18} rot={-40} s={1.1} />
    <Leaf x={28} y={-17} rot={50} s={1} />
    <Hibiscus x={-16} y={-19} s={0.95} rot={-14} />
    <Hibiscus x={16} y={-18} s={0.95} rot={24} />
    <Hibiscus x={0} y={-24} s={1} rot={6} />
  </g>
);

/** The fallen tulsi leaf at the tulsi's foot, drawn like SeatedChild's leaf so the hand-off is invisible. */
const PickLeaf: React.FC<{ opacity: number }> = ({ opacity }) => (
  <g opacity={opacity} transform={`translate(${PICK_LEAF.x}, ${PICK_LEAF.y}) rotate(-18) scale(${BALAK_POS.s})`}>
    <ellipse rx={9} ry={4.2} fill="#5f9a46" />
    <path d="M -7 0 L 6 0" stroke="#3f6e2e" strokeWidth={0.9} />
  </g>
);

/** A faint warm glow on the ground under him (part of his restrained divine light). */
const GroundGlow: React.FC<{ level: number }> = ({ level }) => (
  <g opacity={level}>
    <defs>
      <radialGradient id="s02-ground-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={BALAK_POS.x + 10} cy={BALAK_POS.y + 4} rx={150} ry={26} fill="url(#s02-ground-glow)" />
  </g>
);

/* ---------------- courtyard pieces (the same courtyard as scene 01) ---------------- */

/*
 * The trees, tree beds and sajis are drawn as scene 01 draws them (copied from Scene01SharadFlowerGathering.tsx, whose
 * layout VEDIC_COURTYARD both scenes share), in WORLD units on the floor plane: the shiuli tree with its carpet of
 * fallen flowers, the big jhumko tree and the big jaba tree in their brick-rimmed earthen beds, and at the foot of the
 * tulsi mancha the full sajis the girls set down (the first of them, nearest Balak, is the dala he takes flowers from:
 * the Basket below, drawn where the rig's hand reaches).
 */
const VC = VEDIC_COURTYARD;

/** A big open jaba (hibiscus) with its long stamen column. */
const JabaBlossom: React.FC<{ x: number; y: number; r: number; rot?: number }> = ({ x, y, r, rot = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
    <Bloom x={0} y={0} r={r} kind="jaba" />
    <circle r={r * 0.62} fill="#b0141f" opacity={0.35} />
    <path d={`M 0 0 L ${r * 0.95} ${r * 0.55}`} stroke="#f2c14a" strokeWidth={Math.max(1.2, r * 0.1)} strokeLinecap="round" />
    <circle cx={r * 0.98} cy={r * 0.57} r={r * 0.13} fill="#ffd54a" />
  </g>
);

/** A hanging jhumko bloom (earring-like bell of orange-red frilled petals and a dangling stamen); (0, 0) is its top. */
const JhumkoBell: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -9 2 Q 0 -6 9 2 Q 12 13 6 18 L 3 14 L 0 19 L -3 14 L -6 18 Q -12 13 -9 2 Z" fill="#ec5b2a" />
    <path d="M -5 3 Q 0 -1 5 3 Q 6 9 0 12 Q -6 9 -5 3 Z" fill="#f79a3e" opacity={0.85} />
    <path d="M 0 12 L 1 28" stroke="#f3c24a" strokeWidth={1.4} />
    <circle cx={1} cy={29} r={2.2} fill="#ffd24a" />
  </g>
);

/** Raised earthen ring bed with a brick rim round a tree's foot. */
const TreeBed: React.FC<{ x: number; y: number; rx: number }> = ({ x, y, rx }) => (
  <g>
    <ellipse cx={x} cy={y + 4} rx={rx + 10} ry={rx * 0.22 + 4} fill="#1a0e08" opacity={0.28} />
    <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.22} fill="#8a5a3a" />
    <ellipse cx={x} cy={y - 3} rx={rx - 7} ry={rx * 0.22 - 3} fill="#5a3a26" />
    <ellipse cx={x + rx * 0.3} cy={y - 4} rx={rx * 0.35} ry={rx * 0.06} fill="#7a5236" opacity={0.6} />
  </g>
);

/** Shiuli (night jasmine) tree: sways from the trunk base, white flowers, orange stems. */
const ShiuliTree: React.FC<{ x: number; y: number; seed: number; f: number }> = ({ x, y, seed, f }) => {
  const angle = 0.6 * Math.sin(f * 0.026 + seed) + 0.45 * noise1(f * 0.016, seed + 4);
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <path d="M -16 0 Q -6 -180 -2 -330 L 10 -330 Q 8 -180 18 0 Z" fill="#6e4b30" />
      <path d="M 0 -280 L -120 -420" stroke="#6e4b30" strokeWidth={8} strokeLinecap="round" />
      <path d="M 10 -300 L 130 -440" stroke="#6e4b30" strokeWidth={8} strokeLinecap="round" />
      <path d="M 0 -330 L -20 -500" stroke="#6e4b30" strokeWidth={7} strokeLinecap="round" />
      {Array.from({ length: 10 }, (_, i) => (
        <circle
          key={`c${i}`}
          cx={(hash(seed * 17 + i) - 0.5) * 360}
          cy={-470 + (hash(seed * 29 + i) - 0.5) * 190}
          r={86 + hash(seed * 41 + i) * 40}
          fill={i % 3 === 0 ? "#2f5a31" : i % 3 === 1 ? "#3d6b3a" : "#4d7f45"}
        />
      ))}
      <ellipse cx={110} cy={-500} rx={120} ry={90} fill="#ffd89a" opacity={0.14} />
      {Array.from({ length: 80 }, (_, i) => {
        const cx = (hash(seed * 100 + i * 3.7) - 0.5) * 400;
        const cy = -490 + (hash(seed * 100 + i * 5.1) - 0.5) * 260;
        return (
          <g key={`f${i}`}>
            <circle cx={cx} cy={cy} r={3.6} fill="#fbf7f0" />
            <circle cx={cx} cy={cy + 1.2} r={1.3} fill="#f0962c" />
          </g>
        );
      })}
    </g>
  );
};

/** The carpet of fallen shiuli on the flagstones under the tree. */
const FallenShiuli: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    {Array.from({ length: 60 }, (_, i) => {
      const a = hash(i * 3.9 + 2) * Math.PI * 2;
      const r = Math.sqrt(hash(i * 5.3 + 1));
      return <Bloom key={i} x={x + Math.cos(a) * 240 * r} y={y + 40 + Math.sin(a) * 44 * r + 12} r={5} kind="shiuli" rot={i * 37} />;
    })}
  </g>
);

/** Leafy crown made of overlapping clusters, darker below and warm-lit on the sun side (right). */
const Crown: React.FC<{ cx: number; cy: number; rx: number; ry: number; seed: number; tones: [string, string, string] }> = ({ cx, cy, rx, ry, seed, tones }) => (
  <g>
    {Array.from({ length: 20 }, (_, i) => {
      const a = hash(seed * 13 + i * 2.7) * Math.PI * 2;
      const r = Math.sqrt(hash(seed * 7 + i * 4.1)) * 0.78;
      const x = cx + Math.cos(a) * rx * r;
      const y = cy + Math.sin(a) * ry * r;
      return <circle key={i} cx={x} cy={y} r={(0.34 + hash(seed * 3 + i) * 0.16) * rx} fill={tones[i % 3]} />;
    })}
    <ellipse cx={cx} cy={cy + ry * 0.55} rx={rx * 0.8} ry={ry * 0.32} fill="#1c3a1c" opacity={0.28} />
    <ellipse cx={cx + rx * 0.45} cy={cy - ry * 0.3} rx={rx * 0.5} ry={ry * 0.45} fill="#ffd89a" opacity={0.13} />
    {Array.from({ length: 34 }, (_, i) => {
      const a = hash(seed * 31 + i * 1.9) * Math.PI * 2;
      const r = 0.55 + hash(seed * 37 + i) * 0.45;
      const x = cx + Math.cos(a) * rx * r;
      const y = cy + Math.sin(a) * ry * r;
      return <ellipse key={`l${i}`} cx={x} cy={y} rx={13} ry={6} fill={i % 2 ? "#4e8a44" : "#2e5e2c"} transform={`rotate(${a * 57 + 20} ${x} ${y})`} />;
    })}
  </g>
);

/** Big jaba tree (taller than the girls): trunk, forks, a broad crown dotted with big red jaba. */
const JabaTree: React.FC<{ f: number }> = ({ f }) => {
  const { x, y, crown } = VC.jaba;
  const sway = 0.25 * noise1(f * 0.014, 61);
  return (
    <g transform={`rotate(${sway} ${x} ${y})`}>
      <path d={`M ${x - 18} ${y} Q ${x - 10} ${y - 200} ${x - 24} ${y - 330} L ${x - 4} ${y - 334} Q ${x + 8} ${y - 200} ${x + 18} ${y} Z`} fill="#6a4a32" />
      <path d={`M ${x - 4} ${y - 30} Q ${x + 2} ${y - 200} ${x - 8} ${y - 320}`} stroke="#8a6446" strokeWidth={4} fill="none" opacity={0.6} />
      <path d={`M ${x - 14} ${y - 300} Q ${x - 90} ${y - 380} ${x - 170} ${y - 420}`} stroke="#6a4a32" strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d={`M ${x - 10} ${y - 310} Q ${x + 10} ${y - 380} ${x + 40} ${y - 470}`} stroke="#6a4a32" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d={`M ${x - 6} ${y - 320} Q ${x + 10} ${y - 380} ${x + 30} ${y - 410}`} stroke="#6a4a32" strokeWidth={12} fill="none" strokeLinecap="round" />
      <Crown cx={crown.x} cy={crown.y} rx={210} ry={170} seed={11} tones={["#2c5a2a", "#3a6c34", "#467a3c"]} />
      {Array.from({ length: 22 }, (_, i) => {
        const a = hash(i * 6.1 + 3) * Math.PI * 2;
        const r = 0.45 + hash(i * 4.3 + 8) * 0.5;
        return <JabaBlossom key={i} x={crown.x + Math.cos(a) * 200 * r} y={crown.y + Math.sin(a) * 160 * r} r={12 + hash(i * 2.2) * 4} rot={i * 47} />;
      })}
    </g>
  );
};

/**
 * The jaba tree's long low branch reaching right toward the tulsi (scene 01's girls held it down to pick from it);
 * released now, it rests a little higher and sways gently, with the flowers the girls left on it.
 */
const BRANCH_REST: Array<{ x: number; y: number }> = [
  { x: 1100, y: 455 },
  { x: 1186, y: 526 },
  { x: 1274, y: 526 },
  { x: 1468, y: 528 },
  { x: 1550, y: 530 },
  { x: 1662, y: 552 },
];
const JabaBranch: React.FC<{ f: number }> = ({ f }) => {
  const breeze = 2.4 * noise1(f * 0.018, 77) + 1.2 * noise1(f * 0.041, 78);
  const pts = BRANCH_REST.map((p, i) => ({ x: p.x, y: p.y + (i / (BRANCH_REST.length - 1)) * breeze }));
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <g>
      <path d={d} stroke="#6a4a32" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.slice(1).map((p, i) => {
        const q = pts[i];
        return [0.25, 0.6, 0.9].map((u, k) => {
          const x = q.x + (p.x - q.x) * u;
          const y = q.y + (p.y - q.y) * u;
          const side = (i + k) % 2 ? 1 : -1;
          return <ellipse key={`l${i}-${k}`} cx={x + side * 4} cy={y + side * 9} rx={16} ry={6} fill={(i + k) % 3 ? "#3a6c34" : "#2c5a2a"} transform={`rotate(${side * 18} ${x} ${y})`} />;
        });
      })}
      {[1, 3, 4].map((i, k) => (
        <JabaBlossom key={`b${k}`} x={pts[i].x + 4} y={pts[i].y + 12} r={12} rot={k * 61 + 15} />
      ))}
    </g>
  );
};

/** Big jhumko tree: trunk, a lighter crown, and orange-red bells hanging on long stalks. */
const JhumkoTree: React.FC<{ f: number }> = ({ f }) => {
  const { x, y, crown } = VC.jhumko;
  const sway = 0.3 * noise1(f * 0.015, 63);
  return (
    <g transform={`rotate(${sway} ${x} ${y})`}>
      <path d={`M ${x - 15} ${y} Q ${x - 6} ${y - 180} ${x - 16} ${y - 300} L ${x + 2} ${y - 302} Q ${x + 6} ${y - 180} ${x + 15} ${y} Z`} fill="#6e4e34" />
      <path d={`M ${x - 8} ${y - 280} Q ${x - 70} ${y - 340} ${x - 130} ${y - 380}`} stroke="#6e4e34" strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d={`M ${x - 4} ${y - 290} Q ${x + 40} ${y - 340} ${x + 110} ${y - 360}`} stroke="#6e4e34" strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d={`M ${x - 6} ${y - 300} Q ${x - 20} ${y - 250} ${x - 50} ${y - 236}`} stroke="#6e4e34" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Crown cx={crown.x} cy={crown.y} rx={185} ry={155} seed={23} tones={["#33632e", "#447a3a", "#52894a"]} />
      {Array.from({ length: 18 }, (_, i) => {
        const bx = crown.x + (hash(i * 5.9 + 1) - 0.5) * 330;
        const top = crown.y + 70 + hash(i * 3.1 + 2) * 70 - Math.abs(bx - crown.x) * 0.35;
        const len = 18 + hash(i * 2.7 + 5) * 26;
        const sw = 2.5 * noise1(f * 0.03, i * 3 + 9);
        return (
          <g key={i}>
            <path d={`M ${bx} ${top} Q ${bx + sw * 0.5} ${top + len * 0.5} ${bx + sw} ${top + len}`} stroke="#3f6b35" strokeWidth={1.4} fill="none" />
            <JhumkoBell x={bx + sw} y={top + len} s={0.95} rot={-sw * 3} />
          </g>
        );
      })}
    </g>
  );
};

const MIX_JABA: FlowerKind[] = ["jaba", "jaba", "shiuli"];
const MIX_JHUMKO: FlowerKind[] = ["jhumko", "jhumko", "jaba"];
const MIX_MIXED: FlowerKind[] = ["jaba", "jhumko", "shiuli"];
/** Scene 01's eleven flower spots in a full saji. */
const SAJI_SPOTS: Array<[number, number]> = [...SPOTS, [-12, -20], [8, -22]];

/** A full saji standing on the ground (bottom at y), as scene 01 draws it. */
const GroundSaji: React.FC<{ x: number; y: number; s?: number; mix: FlowerKind[] }> = ({ x, y, s = 1.06, mix }) => (
  <g transform={`translate(${x}, ${y}) scale(${s}) translate(0, -46)`}>
    <ellipse cx={0} cy={46} rx={30} ry={6} fill="#1a0e08" opacity={0.3} />
    <path d="M -24 17 Q 0 -17 24 17" stroke="#8c5f30" strokeWidth={3} fill="none" />
    <path d="M -26 19 Q -28 43 0 46 Q 28 43 26 19 Z" fill="#b8844a" />
    {[27, 34, 41].map((yy) => (
      <path key={yy} d={`M ${-25 + (yy - 19) * 0.05} ${yy} Q 0 ${yy + 6} ${25 - (yy - 19) * 0.05} ${yy}`} stroke="#7a5227" strokeWidth={1.2} fill="none" opacity={0.6} />
    ))}
    <ellipse cx={0} cy={19} rx={26} ry={5.5} fill="#d6a867" stroke="#7a5227" strokeWidth={1.1} />
    {SAJI_SPOTS.map(([fx, fy], i) => (
      <Bloom key={i} x={fx} y={19 + fy * 0.6} r={6.5} kind={mix[i % mix.length]} rot={i * 23} />
    ))}
  </g>
);

/**
 * The girls' sajis at the tulsi-tala, where scene 01 sets them down (WORLD units). The first one, nearest Balak, is
 * the dala he picks from (Basket), drawn where the rig's hand reaches.
 */
const SAJIS = VC.sajisAtTulsi.map((x, i) => ({ x, y: VC.tulsi.y + 16 + (i % 2) * 6, mix: [MIX_JABA, MIX_JHUMKO, MIX_MIXED, MIX_JABA][i] })).slice(1);

/** The low wooden pidi the kolsi rests on beside him (staging units). */
const Pidi: React.FC = () => (
  <g transform={`translate(${KOLSI_REST.x}, ${BALAK_POS.y})`}>
    <ellipse cx={0} cy={2} rx={26} ry={5} fill="#1a0e08" opacity={0.3} />
    <rect x={-22} y={-24} width={44} height={8} rx={2} fill="#8a5a34" />
    <rect x={-22} y={-24} width={44} height={2.5} fill="#b07a4a" />
    <rect x={-19} y={-16} width={6} height={16} fill="#6a4226" />
    <rect x={13} y={-16} width={6} height={16} fill="#6a4226" />
  </g>
);

/** Morning light on the back building (a night-dressed set): a warm wash and the sun from the upper right. */
const MorningBackWash: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="s02-back-sun" x1="1" y1="0" x2="0" y2="0.6">
        <stop offset="0%" stopColor="#fff0c8" stopOpacity={0.5} />
        <stop offset="55%" stopColor="#ffe2a8" stopOpacity={0.24} />
        <stop offset="100%" stopColor="#ffd9a0" stopOpacity={0.12} />
      </linearGradient>
    </defs>
    <rect x={-400} y={150} width={2720} height={640} fill="url(#s02-back-sun)" style={{ mixBlendMode: "screen" }} />
  </g>
);

/** Morning light on the flagstones: a warm wash, brightest at the back, and a soft pool of sun around the tulsi. */
const MorningFloorWash: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="s02-floor-sun" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe6b8" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#ffd9a0" stopOpacity={0.2} />
      </linearGradient>
      <radialGradient id="s02-floor-pool">
        <stop offset="0%" stopColor="#ffe9bf" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#ffe9bf" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-400} y={784} width={2720} height={600} fill="url(#s02-floor-sun)" style={{ mixBlendMode: "screen" }} />
    <ellipse cx={1150} cy={950} rx={900} ry={140} fill="url(#s02-floor-pool)" style={{ mixBlendMode: "screen" }} />
  </g>
);

/* ---------------- scene ---------------- */

const DAY_LIGHTS: SceneLight[] = [
  { x: 1700, y: 80, color: "#ffe2a0", intensity: 0.4, radius: 1400 },
  { x: LAMP.x, y: LAMP.y, color: "#ffb04a", intensity: 0.55, radius: 300, flicker: 7 },
];
const SUN: Lighting = { keySide: 1, rim: "#ffd98a", rimStrength: 0.35 };

export const Scene02FlowersOnOwnFeet: React.FC = () => {
  const { f, lifeF, pause } = useStory3(SCENE_ID);

  const cam = cameraAt(lifeF);

  // The kolsi on the mancha step: the rig draws it in his hand from the start of the pour beat until the pour has
  // blended out into the leaf pick, so the resting one hides for exactly that window.
  const kolsiRestOp = f < POUR_AT + 22 ? 1 - clamp((f - POUR_AT + 4) / 4) : clamp((f - (POUR_AT + 58)) / 3);
  // The fallen leaf: the rig fades its own copy in at the same spot as the pick beat blends in.
  const pickLeafOp = 1 - EASE.inOut(clamp((f - LEAF_AT) / 16));

  // Balak's pose, flowers, face and voice for this frame (rig frame numbers carry RIG_PHASE).
  const rig = balakRig(f);
  const expr = balakExpr(f);
  const face = balakPauseFace(balakFaceAt(f), pause);
  const mouth = balakMouth(lifeF);

  // The glow: steady, brightening gently on the two key beats (soft halo only, no rays).
  const beat = glowBeat(lifeF);
  const glow = GLOW_BASE + (1 - GLOW_BASE) * beat;
  const haloR = 190 * (1 + 0.1 * beat);

  // BAL-26 (2026-11-22): Balak is drawn in the reference-plate design at five (shared ThakurHeadPlate). Poses, timing,
  // lip sync, blinks and expressions are the delivered ones; only the design changes.
  const balakProps: React.ComponentProps<typeof SeatedChild> = {
    x: BALAK_POS.x,
    y: BALAK_POS.y,
    s: BALAK_POS.s,
    f: f + RIG_PHASE,
    lifeF: lifeF + RIG_PHASE + rigLifeShift(lifeF),
    pose: rig.pose,
    prevPose: rig.prevPose,
    poseStart: rig.poseStart,
    prevPoseStart: rig.prevPoseStart,
    basketAt: rig.basketAt,
    showBasket: false,
    footFlowers: footFlowersAt(f),
    expression: expr.expression,
    prevExpression: expr.prevExpression,
    expressionStart: expr.expressionStart,
    face,
    mouth,
    glow,
    design: "plate",
    age: 5,
  };
  // The halo is centred behind the plate head, from the rig's own solve this frame (glow anchor).
  const glowAt = seatedChildHands(balakProps).glowAnchor;

  // Scene 02's open pause holds through the dissolve from scene 01: the fade-in runs on the real clock.
  const fade = clamp(lifeF / 10) * clamp((DUR - lifeF) / 12);

  // The girls walk over on "হঠাৎ সবাই দেখে" and stand round him in a half-circle.
  const eldest = ELDEST_AT(lifeF);
  const middle = MIDDLE_AT(lifeF);
  const young = YOUNG_AT(lifeF);

  return (
    <div style={{ position: "absolute", inset: 0, background: CY_BG, overflow: "hidden" }}>
      <Stage cam={cam} background={CY_BG} opacity={fade}>
        <SceneLights.Provider value={DAY_LIGHTS}>
          {/* the morning sky above the balcony */}
          <Layer depth={CY.sky} extraBlur={2}>
            <DaySky f={lifeF} sunX={1650} sunY={-40} />
          </Layer>
          {/* the Vedic house's inner courtyard: the back building (calmer than the subjects, CAM-11) */}
          <Layer depth={CY.back} extraBlur={1.2}>
            <GlowDefs />
            <CourtyardBack f={lifeF} />
            <MorningBackWash />
          </Layer>
          <Layer depth={CY.floor}>
            <GlowDefs />
            <DivineDefs />
            <CourtyardFloor f={lifeF} />
            <MorningFloorWash />
            {/* the courtyard as scene 01 shows it: tree beds, the shiuli carpet, the three trees, the released jaba branch */}
            <TreeBed x={VC.shiuli.x} y={VC.shiuli.y + 2} rx={70} />
            <TreeBed x={VC.jhumko.x} y={VC.jhumko.y + 2} rx={64} />
            <TreeBed x={VC.jaba.x} y={VC.jaba.y + 2} rx={76} />
            <FallenShiuli x={VC.shiuli.x + 40} y={VC.shiuli.y - 12} />
            <ShiuliTree x={VC.shiuli.x} y={VC.shiuli.y} seed={1} f={lifeF} />
            <JhumkoTree f={lifeF} />
            <JabaTree f={lifeF} />
            <JabaBranch f={lifeF} />
            {/* the tulsi mancha where scene 01 has it, and the girls' full sajis set down at its foot */}
            <TulsiMancha x={VC.tulsi.x} y={VC.tulsi.y} f={lifeF} s={VC.tulsi.s} />
            {SAJIS.map((sj) => (
              <GroundSaji key={sj.x} x={sj.x} y={sj.y} mix={sj.mix} />
            ))}
            {/* Balak, the girls and the scene 01 girls of the house, in staging units */}
            <g transform={STAGING_TRANSFORM}>
            {/* the scene 01 girls of the house at the right, past the mancha */}
            {WOMEN.map((w) => (
              <React.Fragment key={w.cast.id}>
                {w.hair && <LooseHair cast={w.cast} pose={w.act(lifeF)} lifeF={lifeF} x={w.x} y={w.y} scale={WOMEN_S} />}
                <Puppet cast={w.cast} f={lifeF} lifeF={lifeF} x={w.x} y={w.y} scale={WOMEN_S} acting={w.act} props={w.props} light={SUN} stillness={0.2} />
              </React.Fragment>
            ))}
            {/* the middle girl (behind, nearest him) and the youngest (at the left); they never speak */}
            <Puppet cast={GIRL_C_CAST} f={lifeF} lifeF={lifeF} x={middle.x} y={middle.y} scale={middle.s} acting={MIDDLE_ACT} light={SUN} />
            <Puppet cast={GIRL_B_CAST} f={lifeF} lifeF={lifeF} x={young.x} y={young.y} scale={young.s} acting={YOUNG_ACT} light={SUN} />
            {/* fallen tulsi leaves, the dala, the leaf he picks and the resting kolsi */}
            {FLOOR_LEAVES.map((l, i) => (
              <Leaf key={i} x={BALAK_POS.x + l.dx} y={BALAK_POS.y + l.dy} rot={l.rot} s={l.s} c={l.c} />
            ))}
            <Basket />
            <Pidi />
            {pickLeafOp > 0.01 && <PickLeaf opacity={pickLeafOp} />}
            {kolsiRestOp > 0.01 && (
              <g opacity={kolsiRestOp} transform={`translate(${KOLSI_REST.x}, ${KOLSI_REST.y})`}>
                <KolsiShape />
              </g>
            )}
            {/* the eldest girl, in front at his left: she speaks the scolding line (the only mouth that moves to it) */}
            <Puppet cast={GIRL_A_CAST} f={lifeF} lifeF={lifeF} x={eldest.x} y={eldest.y} scale={eldest.s} acting={ELDEST_ACT} mouth={eldestMouth} talk={eldestTalk} light={SUN} />
            {/* Balak's restrained divine light: a soft warm halo behind his head and a faint ground glow */}
            <GroundGlow level={0.55 + 0.45 * beat} />
            <BirulGlow cx={glowAt.cx} cy={glowAt.cy} r={haloR} glow={glow} f={lifeF} />
            <SeatedChild {...balakProps} />
            </g>
          </Layer>
          <Grade warmth={0.45} vignette={0.5} grain={0.04} bloomAt={[66, 30]} />
        </SceneLights.Provider>
      </Stage>
    </div>
  );
};
