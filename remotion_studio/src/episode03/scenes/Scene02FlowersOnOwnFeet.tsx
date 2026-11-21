import React from "react";
import { EP03_SCENES } from "../timing";
import { EP03_CUES } from "../subtitles";
import { clamp, EASE, lerp, makeActing, noise1, PoseKey, track, windowed } from "../../cinematic/core/anim";
import { Cam } from "../../cinematic/core/Stage";
import { DivineDefs } from "../../cinematic/divine/Divine";
import { GlowDefs } from "../../cinematic/fx/Fx";
import { CAST, FACE_LOOKS } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../../cinematic/rig/lipsync";
import { BASE_POSE, CastMember, Lighting, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../../cinematic/rig/Puppet";
import { Stage } from "../../cinematic/core/Stage";
import {
  UJANCHAR_BG,
  UJANCHAR_JABA,
  UjancharBackdrop,
  UjancharFloorLayer,
  UjancharForegroundLayer,
  UjancharLightLayer,
  ujancharGrade,
  ujancharKeepInSet,
} from "../../cinematic/sets/UjancharHouse";
import { Grade } from "../../cinematic/core/Stage";
import { clipSpan3, cueLocalStory3, pausesFor3, storyToReal, useStory3 } from "../../episode/storyClock";
import { SeatedChild } from "../rig/SeatedChild";
import { S01_MINA, S01_REKHA, S01_SARALA, S01_TUNI } from "./Scene01SharadFlowerGathering";
import { BirulGlow } from "../rig/BirulGlow";

/**
 * Episode 3, scene 02 (02_flowers_on_own_feet): the main story, at the family's Ujanchar village house in the
 * morning (the shared set src/cinematic/sets/UjancharHouse.tsx, the same courtyard as Episode 2's go-saap scene;
 * STO-17). Five-year-old Balak sits at the foot of the tulsi mancha, waters it, lays three red hibiscus from his dala
 * on his OWN feet and bows to himself; Charu scolds him (she speaks, lip-synced to her voice clip; the two girls behind
 * her only giggle); he answers with simple divine wisdom. Approved plan: 03_Episodes/Episode_03_Five_Year_Old_Wisdom/
 * 01_Script_and_Storyboard/Ep03_Shots_and_Pauses_DRAFT.md (Scene 02, beats 02A, 02B, 02C).
 *
 * Clocks (src/episode/storyClock.ts, EP03_PAUSES): `f` is the story clock (it holds in the nine pauses) and drives
 * Balak's choreography; `lifeF` is the real local frame and drives breathing, blinks, the glow, the fade, the
 * camera (whose cuts sit on narration cues, never inside a pause) and the standing figures (Charu, the girls and the
 * scene 01 women), whose pause reactions are keyed on the real frames of each pause. Every key is tied to a subtitle
 * cue (cueReal / cueStory) plus the measured voice onset inside that phrase (V below), or to a pause.
 *
 * Shots (CAM-13; hard cuts, held frames, one motivated move at most per line; real frames from the cue data):
 *   1 wide             open pause and "হঠাৎ সবাই দেখে…": the courtyard, Balak at the tulsi mancha, the girls at the
 *                      left, the scene 01 women at the right with their full sajhis; their heads turn on "সবাই"
 *   2 medium           cut on "তুলসীতলায়": the pour, the fallen leaf, the flowers from the dala; one slow push in
 *                      (x1.31) on "নিজের পায়ে" to his hands, the basket and his feet; held through 02A P2
 *   3 MCU              cut on "আর নিজেই": palms join, the bow (প্রণাম), his head rises; held through 02A P3 while his
 *                      glow brightens gently (key beat 1) and Charu's steps approach off screen
 *   4 Charu MCU        cut 7 f before "ওমা": hand to her mouth; 02B P1 her hand comes down, the girls turn
 *   5 two-shot         cut on "তুই": Charu at the left, Balak at the right with the three hibiscus on his feet (above
 *                      y 820); he glances down at them on "নিজের পায়ে" and back up at her in 02B P2
 *   6 group            cut on "দেখিস": Charu leaning in, the two girls behind her giggling; held through 02B P3
 *   7 Balak MCU        cut 7 f before "তোদের ভগবান…": open palm, eyes to his feet, palms to his chest; 02C P1
 *   8 reverse          cut on "তোমাদের": Charu and the girls listening, smiles fading; 02C P2 they glance, unsure
 *   9 Balak MCU        cut 7 f before "আমি ভগবান হলে": then one slow push in on "গাছ কেটে" (x1.35, on lifeF) held
 *                      through his last line and the end pause as his glow brightens gently (key beat 2)
 * No handheld, no rack focus, no letterbox. Every cam goes through ujancharKeepInSet (no background edge).
 *
 * Balak is drawn by SeatedChild; Charu, the girls and the women by Puppet.
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
/** Charu's clip (the file is called 02b_Girls_Tease, the voice is hers: STO-17) and Balak's, from the timing data. */
const CHARU_PARTS = clipSpan3("02b_Girls_Tease.wav")?.parts ?? [];
const BALAK_PARTS = clipSpan3("02c_Toddler_Thakur.wav")?.parts ?? [];

const voiceAt = (parts: typeof CHARU_PARTS, realLocal: number) => {
  const abs = SCENE.startFrame + realLocal;
  for (const p of parts) {
    if (abs >= p.startFrame && abs < p.startFrame + p.frames) return { env: ENV[p.file], rel: abs - p.startFrame, text: TEXT[p.file] };
  }
  return null;
};
/** Charu's mouth at real local frame fr (only Charu moves her lips to this clip; the girls never do). */
const charuMouth = (fr: number): MouthState => {
  const v = voiceAt(CHARU_PARTS, fr);
  return v ? visemeFromEnvelope(v.env, v.rel, 13, v.text) : MOUTH_REST;
};
/**
 * Charu's speech envelope for the rig, phrase-level: on while any frame within 6 of fr is voiced, so the dips between
 * syllables do not read as pauses (the rig blinks at every speech pause; per-syllable gaps made her blink almost
 * continuously and look asleep). It runs on the real clock, so it is silent across every pause boundary.
 */
const charuVoiced = (fr: number): boolean => {
  const v = voiceAt(CHARU_PARTS, fr);
  return !!v && speechLevel(v.env, v.rel) > 0.06;
};
const charuTalk = (fr: number): number => {
  for (let k = -6; k <= 6; k++) if (charuVoiced(fr + k)) return 0.6;
  return 0;
};
/** Balak's mouth openness (0..0.9) at real local frame fr. */
const balakMouth = (fr: number): number => {
  const v = voiceAt(BALAK_PARTS, fr);
  return v ? clamp(visemeFromEnvelope(v.env, v.rel, 17, v.text).open * 0.9, 0, 0.9) : 0;
};

/* ---------------- layout (world px; the Ujanchar set's coordinates, ground line about y 900) ---------------- */

const BALAK_POS = { x: 930, y: 950, s: 1.25 };
/** The tulsi mancha just past his front: the water from the rig's kolsi lands at its foot (figure x 120). */
const TULSI = { x: BALAK_POS.x + 215, y: 946, s: 0.85 };
/** The mancha's niche lamp (lit): the diya of the scene. */
const LAMP = { x: TULSI.x, y: TULSI.y - 40 * TULSI.s - 10 };
const KOLSI_REST = { x: BALAK_POS.x + 148, y: TULSI.y - 26 * TULSI.s - 9 };
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

/** Charu's spot at the left of Balak, and the two girls behind her (nearer the hut). */
const CHARU_X = 520;
const CHARU_Y = 962;
const GIRL_A = { x: 345, y: 924, s: 1.0 };
const GIRL_B = { x: 205, y: 916, s: 0.96 };
/** The scene 01 women at the right, by the fence and the hibiscus shrubs, with their full sajhis. */
const WOMEN_S = 0.9;
const WOMEN_Y = 906;

/* ---------------- camera ---------------- */

interface Frame {
  cx: number;
  cy: number;
  z: number;
}
const WIDE: Frame = { cx: 1075, cy: 690, z: 1.0 };
const MED: Frame = { cx: 990, cy: 832, z: 1.8 };
/** The medium after its push (x1.31): hands, basket and feet, the feet and flowers above y 820. */
const MED_CLOSE: Frame = { cx: 990, cy: 872, z: 2.3 };
const BOW_MCU: Frame = { cx: 960, cy: 800, z: 2.6 };
const CHARU_MCU: Frame = { cx: 470, cy: 650, z: 2.6 };
const TWO_SHOT: Frame = { cx: 860, cy: 800, z: 1.6 };
const GROUP: Frame = { cx: 360, cy: 700, z: 2.0 };
const BALAK_MCU: Frame = { cx: 985, cy: 795, z: 2.5 };
const REVERSE: Frame = { cx: 395, cy: 660, z: 2.3 };
/** Where the last push lands: about x1.35 on his face. */
const FINAL_CU: Frame = { cx: 950, cy: 772, z: 3.38 };

/** Hard cuts, real local frames, each on its narration cue (a speaker's close-up 7 frames before the voice). */
const SHOTS: Array<{ from: number; fr: Frame }> = [
  { from: -Infinity, fr: WIDE },
  { from: V.tulsi - 2, fr: MED },
  { from: V.ar - 2, fr: BOW_MCU },
  { from: V.oma - 7, fr: CHARU_MCU },
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
  return ujancharKeepInSet({ x: fr.cx - 960, y: fr.cy - 540, zoom: fr.z, focus: 1, dof: 0.8, shake: 0 });
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
  { from: pauseStory(2, 328) + 1, pose: "sitCross" }, // hands back to his knees as Charu arrives
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
  { from: pauseStory(2, 328) + 1, e: "serene" }, // calm while he is scolded
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
 * Gaze (story frames). lookX < 0 turns toward Charu and the girls at his left (-0.75 Charu, -0.85 the group: enough to read as looking at them, never a side-eye), > 0 toward the tulsi in front of him.
 * While he works the rig points his eyes at the water, the leaf and each flower itself. While he answers he looks at
 * the people he speaks to (no lookUp), except where his words name his feet or the flowers.
 */
const balakFaceAt = (f: number): Required<ChildFace> => {
  const seeFlowers = ST.tui + 46; // Charu's "নিজের পায়ে" (voice)
  const amar = ST.amar + 20; // his "আমার পায়ে" (voice)
  const keno = ST.ami + 43; // "কিন্তু ফুল কেন" (voice)
  const kauke = ST.gach + 36; // "কাউকে"
  return {
    lookX: track(f, [
      [0, 0.1],
      [ST.oma - 4, 0.1],
      [ST.oma + 8, -0.75, "inOut"], // Charu arrives at his left
      [seeFlowers, -0.75],
      [seeFlowers + 12, -0.12, "inOut"], // glances down at the flowers on his feet
      [pauseStory(4, 494), -0.12],
      [pauseStory(4, 494) + 1, -0.75], // (02B P2 brings his eyes back up to her: balakPauseFace)
      [pauseStory(4, 494) + 26, -0.75],
      [pauseStory(4, 494) + 40, -0.85, "inOut"], // the girls giggle
      [ST.toder - 6, -0.85],
      [ST.toder + 4, -0.75, "inOut"], // answers Charu and the girls
      [amar - 2, -0.75],
      [amar + 10, -0.18, "inOut"], // "আমার পায়ে": his feet
      [amar + 26, -0.18],
      [amar + 38, -0.75, "inOut"], // "আমি বেশ টের পাই", to Charu
      [ST.tomader + 6, -0.75],
      [ST.tomader + 16, -0.85, "inOut"], // "তোমাদের মাটির মূর্তি", to all of them
      [ST.ami - 6, -0.85],
      [ST.ami + 2, -0.75, "inOut"], // "আমি ভগবান হলে", to Charu
      [keno - 4, -0.75],
      [keno + 8, -0.14, "inOut"], // "কিন্তু ফুল কেন": the flowers on his feet
      [keno + 16, -0.14],
      [keno + 28, -0.75, "inOut"], // the key line, to Charu
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
 *  02B P2: his eyes come back up from the flowers to Charu, unbothered, with a faint smile.
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

/* Charu (the mother, mid-20s): walks in during 02A P3 (her steps are heard off screen), scolds, listens. */

/** She arrives as the camera cuts to her, a beat before "ওমা". */
const CH_ARRIVE = V.oma - 2;
const CH_FROM = CH_ARRIVE - 60;
const charuXAt = (lf: number) => track(lf, [[CH_FROM, -320], [CH_ARRIVE, CHARU_X, "inOut"]]);
/** Step amplitude follows her travel speed (about 15 px a frame at stride 1), so the feet never slide. */
const charuStride = (lf: number) => clamp(Math.abs(charuXAt(lf + 1) - charuXAt(lf - 1)) / 2 / 15, 0, 1);

const CHARU_KEYS: PoseKey<Pose>[] = [
  { f: 0, bodyTurn: 0.35, headTurn: 0.3, smile: 0.4, rS: 8, rE: -10, lS: 8, lE: -10, lean: 2 },
  // "ওমা": her hand flies to her chest (the frontal arm rig cannot bring a hand to the mouth)
  { f: V.oma + 4, in: 9, ease: "out", lean: 0, rS: 16, rE: -150, rHand: "relaxed", gasp: 0.3, brow: 0.7, smile: 0.1, headTurn: 0.42 },
  // "একি কাণ্ড!": still at her mouth, eyes wide, a small shake of the head
  { f: V.eki + 10, in: 10, ease: "inOut", headTilt: 3 },
  { f: V.eki + 20, in: 10, ease: "inOut", headTilt: -2 },
  // 02B P1: her hand comes down, brows still up
  { f: P_KANDO[0] + 22, in: 14, ease: "inOut", rS: 10, rE: -14, rHand: "relaxed", gasp: 0, brow: 0.5, headTilt: 0, smile: 0.15 },
  // "তুই ঠাকুরের ফুল…": an open palm toward him (charuGesture lifts the forearm on "নিজের পায়ে দিচ্ছিস কেন রে?")
  { f: V.tui + 2, in: 10, ease: "out", rS: 32, rE: -8, rHand: "open", headTurn: 0.46, bodyTurn: 0.42, brow: 0.4, smile: 0.28, lid: 0, lean: 2 },
  // 02B P2: waits, palm still open, brows knit
  { f: P_KENO[0] + 12, in: 12, ease: "inOut", headTilt: 4, brow: 0.45, smile: 0.3, lean: 3 },
  // "দেখিস তোর পাপ হবে": leans in, palm lowered, half a tease
  { f: V.dekhis + 4, in: 12, ease: "inOut", lean: 6, headTilt: -3, rS: 22, rE: -22, smile: 0.25, brow: 0.45 },
  // "ভগবান শাপ দেবেন!": a touch more, a small nod
  { f: V.shap + 6, in: 12, ease: "inOut", lean: 8, headNod: 4, brow: 0.55 },
  // 02B P3: waits for his answer with a half-scolding look
  { f: P_SHAP[0] + 14, in: 16, ease: "inOut", lean: 3, headNod: 0, smile: 0.3, brow: 0.4, rS: 10, rE: -14, rHand: "relaxed" },
  // 02C: listens
  { f: V.amar + 30, in: 30, ease: "inOut", brow: 0.3, smile: 0.25, headTilt: 3 },
  // "তোমাদের মাটির মূর্তি…": the smile fades, a little puzzled
  { f: V.tomader + 40, in: 40, ease: "inOut", smile: 0.12, brow: 0.38, headTilt: -2 },
  // 02C P2: her brow softens
  { f: P_BOJHE[0] + 28, in: 26, ease: "inOut", brow: 0.05, smile: 0.3, headTilt: 4, lid: 0.12 },
];
const charuBase = sway(A(CHARU_KEYS), 83, 0.6);
/** Small forearm lift while the open palm scolds; no pointing, no flailing. */
const charuGesture = (fr: number) => windowed(fr, V.tuiPaye - 6, V.tuiPaye + 62, 12) * 6 * Math.sin((fr - V.tuiPaye + 6) * 0.3);
const charuAct = (fr: number): Partial<Pose> => {
  const k = charuBase(fr);
  return { ...k, rE: (k.rE ?? 0) + charuGesture(fr), stride: charuStride(fr) };
};

/* The two girls (Charu's young relatives), behind her at the left. They never speak: they only giggle. */

const skinWarm = { skin: "#d9a07a", skinLight: "#f0c4a0", skinShade: "#b47853", lips: "#b0605a" };
const skinDeep = { skin: "#b97a52", skinLight: "#d89a70", skinShade: "#8d5536", lips: "#94493f" };

/** Older girl, teen-sized, cotton saree with a teal blouse, long plaits. */
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

/** Younger girl, a rose frock and plaits. */
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

/** Girl keys; `d` staggers the second girl so they move one after the other. */
const girlKeys = (d: number, chatTurn: number): PoseKey<Pose>[] => [
  { f: 0, bodyTurn: 0.3, headTurn: chatTurn, smile: 0.5, rS: 8, rE: -10, lS: 8, lE: -10, rHand: "relaxed", lHand: "relaxed" },
  // "সবাই দেখে": they turn to him
  { f: V.sabai + 6 + d, in: 12, ease: "inOut", headTurn: 0.42, eyeX: 0.3, smile: 0.4 },
  // "ওমা": a glance at Charu
  { f: V.oma + 6 + d, in: 10, ease: "inOut", headTurn: 0.18, eyeX: 0.1, brow: 0.3, smile: 0.3 },
  // 02B P1: one after the other they turn back to him, a teasing smile growing
  { f: P_KANDO[0] + 10 + d, in: 12, ease: "inOut", headTurn: 0.45, eyeX: 0.3, brow: 0.1, smile: 0.62 },
  // "দেখিস তোর পাপ হবে": a giggle, a hand up at the chest
  { f: V.dekhis + 10 + d, in: 10, ease: "out", rS: 16, rE: -152, rHand: "open", lean: 3, smile: 0.95, lid: 0.3, headTilt: 6 },
  { f: V.dekhis + 40 + d, in: 14, ease: "inOut", rS: 10, rE: -40, rHand: "relaxed", lean: 1, lid: 0, smile: 0.7, headTilt: 2 },
  // 02B P3: the giggle (girls_giggle at the pause start, the second girl 11 frames later)
  { f: P_SHAP[0] + 6 + d, in: 8, ease: "out", rS: 16, rE: -152, rHand: "open", lean: 4, smile: 0.95, lid: 0.3, headTilt: 7 },
  { f: P_SHAP[0] + 30 + d * 0.6, in: 12, ease: "inOut", rS: 8, rE: -10, rHand: "relaxed", lean: 0, lid: 0, smile: 0.62, headTilt: 1 },
  // "তোমাদের মাটির মূর্তি…": their smiles slowly fade
  { f: V.tomader + 60 + d, in: 50, ease: "inOut", smile: 0.28, brow: 0.2 },
  // 02C P2: the last giggle fades; they glance at each other, unsure, and back to him
  { f: P_BOJHE[0] + 18, in: 10, ease: "inOut", headTurn: d ? 0.62 : -0.1, brow: 0.38, smile: 0.22 },
  { f: P_BOJHE[0] + 34, in: 12, ease: "inOut", headTurn: 0.42, brow: 0.15, smile: 0.32 },
];
const girlAct = (keys: PoseKey<Pose>[], seed: number, period: number, phase: number, windows: Array<[number, number]>) => {
  const base = sway(A(keys), seed, 1);
  return (fr: number): Partial<Pose> => {
    const k = base(fr);
    const g = giggleAt(fr, windows, period, phase);
    // the open pause: a few nods as they chat, before they turn to him
    const chat = windowed(fr, -20, V.sabai + 6, 8) * 2.5 * Math.sin(fr * 0.33 + seed);
    return { ...k, headNod: (k.headNod ?? 0) + g.nod + chat, bodyX: (k.bodyX ?? 0) + g.dx };
  };
};
const GIRL_A_ACT = girlAct(girlKeys(0, -0.35), 53, 19, 0, [
  [V.dekhis + 8, V.dekhis + 42],
  [P_SHAP[0], P_SHAP[0] + 28],
  [P_BOJHE[0], P_BOJHE[0] + 12],
]);
const GIRL_B_ACT = girlAct(girlKeys(10, 0.55), 61, 14, 2, [
  [V.dekhis + 18, V.dekhis + 50],
  [P_SHAP[0] + 11, P_SHAP[0] + 36],
]);

/* The scene 01 women (STO-17 default): back from the flower gathering with their full sajhis, by the fence at the
 * right. They chat in the open pause and turn to him on "সবাই দেখে", one after another. */

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
/** A full sajhi basket hanging from its handle (the grip point), as in scene 01. */
const sajhi =
  (mix: FlowerKind[]): PropRenderer =>
  ({ scale }) => (
    <g transform={`scale(${scale * 0.9})`}>
      <path d="M -24 17 Q 0 -17 24 17" stroke="#8c5f30" strokeWidth={3} fill="none" />
      <path d="M -26 19 Q -28 43 0 46 Q 28 43 26 19 Z" fill="#b8844a" />
      {[27, 34, 41].map((y) => (
        <path key={y} d={`M ${-25 + (y - 19) * 0.05} ${y} Q 0 ${y + 6} ${25 - (y - 19) * 0.05} ${y}`} stroke="#7a5227" strokeWidth={1.2} fill="none" opacity={0.6} />
      ))}
      <ellipse cx={0} cy={19} rx={26} ry={5.5} fill="#d6a867" stroke="#7a5227" strokeWidth={1.1} />
      {SPOTS.map(([x, y], i) => (
        <Bloom key={i} x={x} y={19 + y * 0.6} r={6.5} kind={mix[i % mix.length]} rot={i * 23} />
      ))}
    </g>
  );
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
/** Sarala, Mina, Tuni and Rekha, exactly as scene 01 dresses them (loose damp hair on the three women). */
const WOMEN: Array<{ cast: CastMember; x: number; y: number; act: (fr: number) => Partial<Pose>; props: Record<string, PropRenderer>; hair?: boolean }> = [
  { cast: S01_SARALA, x: 1600, y: WOMEN_Y + 2, act: womanAct(101, 0, 0.3, { lS: 4, lE: 0, lHand: "hold", lProp: "basket" }), props: { basket: sajhi(["jaba", "jhumko", "shiuli"]) }, hair: true },
  { cast: S01_MINA, x: 1722, y: WOMEN_Y - 2, act: womanAct(207, 6, -0.3, { rS: 6, rE: -2, rHand: "hold", rProp: "basket" }), props: { basket: sajhi(["jhumko", "jhumko", "shiuli"]) }, hair: true },
  { cast: S01_TUNI, x: 1835, y: WOMEN_Y + 6, act: womanAct(311, 10, 0.25, { rS: 80, rE: -84, rHand: "hold", rProp: "sprig" }), props: { sprig: Sprig } },
  { cast: S01_REKHA, x: 1945, y: WOMEN_Y, act: womanAct(419, 3, -0.3, { rS: 2, rE: 1, rHand: "hold", rProp: "basket" }), props: { basket: sajhi(["jaba", "shiuli"]) }, hair: true },
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

  // Scene 02's open pause holds through the dissolve from scene 01: the fade-in runs on the real clock.
  const fade = clamp(lifeF / 10) * clamp((DUR - lifeF) / 12);

  const charuX = charuXAt(lifeF);

  return (
    <div style={{ position: "absolute", inset: 0, background: UJANCHAR_BG.morning, overflow: "hidden" }}>
      <Stage cam={cam} background={UJANCHAR_BG.morning} opacity={fade}>
        <SceneLights.Provider value={DAY_LIGHTS}>
          <UjancharBackdrop f={lifeF} time="morning" cam={cam} cow={false} />
          <UjancharFloorLayer f={lifeF} time="morning" tulsi={{ x: TULSI.x, y: TULSI.y, s: TULSI.s, lamp: "lit" }} jaba={UJANCHAR_JABA}>
            <GlowDefs />
            <DivineDefs />
            {/* the scene 01 women at the right, by the fence */}
            {WOMEN.map((w) => (
              <React.Fragment key={w.cast.id}>
                {w.hair && <LooseHair cast={w.cast} pose={w.act(lifeF)} lifeF={lifeF} x={w.x} y={w.y} scale={WOMEN_S} />}
                <Puppet cast={w.cast} f={lifeF} lifeF={lifeF} x={w.x} y={w.y} scale={WOMEN_S} acting={w.act} props={w.props} light={SUN} stillness={0.2} />
              </React.Fragment>
            ))}
            {/* the two girls behind Charu's spot, at the left */}
            <Puppet cast={GIRL_B_CAST} f={lifeF} lifeF={lifeF} x={GIRL_B.x} y={GIRL_B.y} scale={GIRL_B.s} acting={GIRL_B_ACT} light={SUN} />
            <Puppet cast={GIRL_A_CAST} f={lifeF} lifeF={lifeF} x={GIRL_A.x} y={GIRL_A.y} scale={GIRL_A.s} acting={GIRL_A_ACT} light={SUN} />
            {/* fallen tulsi leaves, the dala, the leaf he picks and the resting kolsi */}
            {FLOOR_LEAVES.map((l, i) => (
              <Leaf key={i} x={BALAK_POS.x + l.dx} y={BALAK_POS.y + l.dy} rot={l.rot} s={l.s} c={l.c} />
            ))}
            <Basket />
            {pickLeafOp > 0.01 && <PickLeaf opacity={pickLeafOp} />}
            {kolsiRestOp > 0.01 && (
              <g opacity={kolsiRestOp} transform={`translate(${KOLSI_REST.x}, ${KOLSI_REST.y})`}>
                <KolsiShape />
              </g>
            )}
            {/* Charu (walks in from the left during 02A P3) */}
            {charuX > -300 && (
              <Puppet cast={CAST.charu} f={lifeF} lifeF={lifeF} x={charuX} y={CHARU_Y} scale={1.12} acting={charuAct} mouth={charuMouth} talk={charuTalk} light={SUN} />
            )}
            {/* Balak's restrained divine light: a soft warm halo behind his head and a faint ground glow */}
            <GroundGlow level={0.55 + 0.45 * beat} />
            <BirulGlow cx={BALAK_POS.x} cy={BALAK_POS.y - 150 * BALAK_POS.s} r={haloR} glow={glow} f={lifeF} />
            <SeatedChild
              x={BALAK_POS.x}
              y={BALAK_POS.y}
              s={BALAK_POS.s}
              f={f + RIG_PHASE}
              lifeF={lifeF + RIG_PHASE}
              pose={rig.pose}
              prevPose={rig.prevPose}
              poseStart={rig.poseStart}
              prevPoseStart={rig.prevPoseStart}
              basketAt={rig.basketAt}
              showBasket={false}
              footFlowers={footFlowersAt(f)}
              expression={expr.expression}
              prevExpression={expr.prevExpression}
              expressionStart={expr.expressionStart}
              face={face}
              mouth={mouth}
              glow={glow}
            />
          </UjancharFloorLayer>
          <UjancharLightLayer f={lifeF} time="morning" level={0.85} />
          <UjancharForegroundLayer f={lifeF} time="morning" grass={false} bokeh />
          <Grade {...ujancharGrade("morning")} />
        </SceneLights.Provider>
      </Stage>
    </div>
  );
};
