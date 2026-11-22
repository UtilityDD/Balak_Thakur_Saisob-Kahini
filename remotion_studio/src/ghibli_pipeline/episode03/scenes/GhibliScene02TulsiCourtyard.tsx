import React from "react";
import { staticFile } from "remotion";
import { clamp, EASE, hash, lerp, makeActing, noise1, PoseKey, track, windowed } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { DivineDefs } from "../../../cinematic/divine/Divine";
import { Flame, Glow, GlowDefs } from "../../../cinematic/fx/Fx";
import { FACE_LOOKS } from "../../../cinematic/rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../../../cinematic/rig/lipsync";
import { BASE_POSE, CastMember, Lighting, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../../../cinematic/rig/Puppet";
import { BirulGlow } from "../../../episode03/rig/BirulGlow";
import { SeatedChild, seatedChildHands } from "../../../episode03/rig/SeatedChild";
import { S01_MINA, S01_REKHA, S01_SARALA, S01_TUNI, VEDIC_COURTYARD } from "../../../episode03/scenes/Scene01SharadFlowerGathering";
import { EP03_CUES } from "../../../episode03/subtitles";
import { EP03_SCENES } from "../../../episode03/timing";
import { clipSpan3, cueLocalStory3, pausesFor3, storyToReal, useStory3 } from "../../../episode/storyClock";
import {
  ContactShadow,
  GhibliAtmosphericHaze,
  GhibliCharFilterDefs,
  GhibliCourtyardShadows,
  GhibliCutout,
  GhibliFallenShiuli,
  GhibliForegroundBokeh,
  GhibliGrade,
  GhibliInkBloom,
  GhibliJabaBlossom,
  GhibliLayer,
  GhibliPreload,
  GhibliSketchedLeaf,
  GhibliStage,
} from "../../GhibliStage";
import { GHIBLI_ANCHORS } from "../plateAnchors";

/**
 * Episode 3 (Ghibli Sketch Test) · Scene 02 "Flowers on own feet".
 * Preserves 100% of Balak Thakur's SeatedChild (plate age 5) choreography, BirulGlow,
 * lip-sync envelopes, 3 scolding girls, 4 watching women, 9 pauses, and camera cuts/pushes,
 * while rendering the Vedic courtyard and static props as high-res hand-drawn Ghibli watercolor sketches.
 */

const SCENE_ID = "02_flowers_on_own_feet";
const SCENE = EP03_SCENES.find((s) => s.sceneId === SCENE_ID)!;
const DUR = SCENE.durationFrames;
const PAUSES = pausesFor3(SCENE_ID);

const PRELOAD = [
  "images/ghibli_ep03/sky_morning_gold.png",
  "images/ghibli_ep03/far_trees_sketch.png",
  "images/ghibli_ep03/courtyard_back_sketch.png",
  "images/ghibli_ep03/courtyard_floor_sketch.png",
  "images/ghibli_ep03/tree_shiuli_sketch.png",
  "images/ghibli_ep03/tree_jhumko_sketch.png",
  "images/ghibli_ep03/tree_jaba_sketch.png",
  "images/ghibli_ep03/tulsi_mancha_sketch.png",
  "images/ghibli_ep03/prop_ground_saji_a.png",
  "images/ghibli_ep03/prop_ground_saji_b.png",
  "images/ghibli_ep03/prop_dala_basket.png",
  "images/ghibli_ep03/prop_pidi_sketch.png",
  "images/ghibli_ep03/watercolor_paper_grain.png",
] as const;

const cueReal = (snippet: string, fallback: number): number => {
  const c = EP03_CUES.find((q) => q.from >= SCENE.startFrame && q.from < SCENE.startFrame + DUR && q.text.includes(snippet));
  return c ? c.from - SCENE.startFrame : fallback;
};
const cueStory = (snippet: string, fallback: number): number => cueLocalStory3(snippet, SCENE_ID)?.from ?? fallback;
const pauseStory = (i: number, fallback: number): number => PAUSES[i]?.atStory ?? fallback;
const pauseReal = (i: number): [number, number] => {
  const p = PAUSES[i];
  if (!p) return [0, 0];
  const s = storyToReal(p.atStory, PAUSES);
  return [s, s + p.frames];
};

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

const P_FLOWERS = pauseReal(1);
const P_PRANAM = pauseReal(2);
const P_KANDO = pauseReal(3);
const P_KENO = pauseReal(4);
const P_SHAP = pauseReal(5);
const P_BOJHE = pauseReal(7);
const P_END = pauseReal(8);

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

const GIRLS_PARTS = clipSpan3("02b_Girls_Tease.wav")?.parts ?? [];
const BALAK_PARTS = clipSpan3("02c_Toddler_Thakur.wav")?.parts ?? [];

const voiceAt = (parts: typeof GIRLS_PARTS, realLocal: number) => {
  const abs = SCENE.startFrame + realLocal;
  for (const p of parts) {
    if (abs >= p.startFrame && abs < p.startFrame + p.frames) return { env: ENV[p.file], rel: abs - p.startFrame, text: TEXT[p.file] };
  }
  return null;
};
const eldestMouth = (fr: number): MouthState => {
  const v = voiceAt(GIRLS_PARTS, fr);
  return v ? visemeFromEnvelope(v.env, v.rel, 13, v.text) : MOUTH_REST;
};
const eldestVoiced = (fr: number): boolean => {
  const v = voiceAt(GIRLS_PARTS, fr);
  return !!v && speechLevel(v.env, v.rel) > 0.06;
};
const eldestSpeechEnergy = (fr: number): number => {
  const v = voiceAt(GIRLS_PARTS, fr);
  if (!v) return 0;
  // 3-frame smoothed envelope energy for natural head/torso syllable emphasis
  const e0 = speechLevel(v.env, Math.max(0, v.rel - 1));
  const e1 = speechLevel(v.env, v.rel);
  const e2 = speechLevel(v.env, Math.min(v.env.length - 1, v.rel + 1));
  return (0.25 * e0 + 0.5 * e1 + 0.25 * e2);
};
const eldestTalk = (fr: number): number => {
  for (let k = -6; k <= 6; k++) if (eldestVoiced(fr + k)) return 0.6;
  return 0;
};
const balakMouth = (fr: number): number => {
  const v = voiceAt(BALAK_PARTS, fr);
  return v ? clamp(visemeFromEnvelope(v.env, v.rel, 17, v.text).open * 0.9, 0, 0.9) : 0;
};

/* ---------------- layout ---------------- */

const S0 = { x: 930, y: 950 };
const W0 = { x: 1487, y: 858 };
const STAGE_K = 0.85;
const toWorld = (x: number, y: number) => ({ x: W0.x + STAGE_K * (x - S0.x), y: W0.y + STAGE_K * (y - S0.y) });
const toStage = (x: number, y: number) => ({ x: S0.x + (x - W0.x) / STAGE_K, y: S0.y + (y - W0.y) / STAGE_K });
const STAGING_TRANSFORM = `translate(${W0.x} ${W0.y}) scale(${STAGE_K}) translate(${-S0.x} ${-S0.y})`;

const BALAK_POS = { x: S0.x, y: S0.y, s: 1.25 };
const TULSI_WORLD = VEDIC_COURTYARD.tulsi;
const TULSI = { ...toStage(TULSI_WORLD.x, TULSI_WORLD.y), s: TULSI_WORLD.s / STAGE_K };
const LAMP = { x: TULSI.x, y: TULSI.y - 94 * TULSI.s };
const KOLSI_REST = { x: BALAK_POS.x + 148, y: 946 - 26 * 0.85 - 9 };
const BASKET_AT = { x: 92, y: -30 };
const BASKET_SCALE = 0.75;
const BASKET = {
  x: BALAK_POS.x + BASKET_AT.x * BALAK_POS.s,
  y: BALAK_POS.y + BASKET_AT.y * BALAK_POS.s + 24 * BASKET_SCALE,
};
const PICK_LEAF = { x: BALAK_POS.x + 96 * BALAK_POS.s, y: BALAK_POS.y - 2 * BALAK_POS.s };
const FLOOR_LEAVES = [
  { dx: 170, dy: 22, rot: 20, s: 1.0 },
  { dx: 45, dy: 30, rot: -60, s: 0.9 },
  { dx: 205, dy: 36, rot: 75, s: 0.85 },
  { dx: 80, dy: 44, rot: 110, s: 0.8, c: "#8f7a3a" },
];

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

const WOMEN_S = 0.9;
const WOMEN_AT = [toStage(1880, 866), toStage(1972, 860), toStage(2058, 870), toStage(2146, 863)];

const CY = { sky: 0.12, back: 0.55, floor: 1 } as const;
const CY_BG = "#e9d2a8";
const CY_SET_X: Array<[number, number, number]> = [
  [CY.floor, -400, 2320],
  [CY.back, -300, 2220],
  [CY.sky, -1200, 3200],
];
const CY_FLOOR_TOP = 784;
const CY_FLOOR_BOTTOM = 1384;

const smax = (a: number, b: number, k: number) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
const smin = (a: number, b: number, k: number) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + k * k));

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

interface Frame {
  cx: number;
  cy: number;
  z: number;
  world?: boolean;
}
const WIDE: Frame = { cx: 1200, cy: 600, z: 1.0, world: true };
const MED: Frame = { cx: 990, cy: 832, z: 1.8 };
const MED_CLOSE: Frame = { cx: 1050, cy: 872, z: 2.3 };
const BOW_MCU: Frame = { cx: 1000, cy: 800, z: 2.6 };
const ELDEST_MCU: Frame = { cx: 455, cy: 780, z: 3.0 };
const TWO_SHOT: Frame = { cx: 770, cy: 822, z: 2.4 };
const GROUP: Frame = { cx: 660, cy: 790, z: 1.7 };
const BALAK_MCU: Frame = { cx: 1020, cy: 795, z: 2.5 };
const REVERSE: Frame = { cx: 420, cy: 780, z: 2.5 };
const FINAL_CU: Frame = { cx: 950, cy: 772, z: 3.38 };

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
const PUSH_FEET = { a: V.nijerPaye - 3, b: V.nijerPaye + 27 };
const PUSH_END = { a: V.gach - 3, b: DUR - 14 };

const mixFrame = (a: Frame, b: Frame, t: number): Frame => ({
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
  z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)),
});

const cameraAt = (lf: number): Cam => {
  let k = 0;
  for (let i = 0; i < SHOTS.length; i++) if (lf >= SHOTS[i].from) k = i;
  let fr = SHOTS[k].fr;
  if (fr === MED && lf >= PUSH_FEET.a) fr = mixFrame(MED, MED_CLOSE, EASE.inOut(clamp((lf - PUSH_FEET.a) / (PUSH_FEET.b - PUSH_FEET.a))));
  if (k === SHOTS.length - 1 && lf >= PUSH_END.a) fr = mixFrame(BALAK_MCU, FINAL_CU, EASE.inOut(clamp((lf - PUSH_END.a) / (PUSH_END.b - PUSH_END.a))));
  const p = fr.world ? { x: fr.cx, y: fr.cy } : toWorld(fr.cx, fr.cy);
  const z = fr.world ? fr.z : fr.z / STAGE_K;
  // Zoom-proportional depth of field: crisp deep focus on wide, creamy multiplane bokeh on 3x-4x close-ups
  const dof = clamp(0.28 + Math.max(0, z - 1) * 0.52, 0.28, 1.85);
  return courtyardKeepInSet({ x: p.x - 960, y: p.y - 540, zoom: z, focus: 1, dof, shake: 0 });
};

/* ---------------- Balak (SeatedChild) ---------------- */

type ChildProps = React.ComponentProps<typeof SeatedChild>;
type ChildPose = NonNullable<ChildProps["pose"]>;
type ChildFace = NonNullable<ChildProps["face"]>;
type ExprName = NonNullable<ChildProps["expression"]>;

const POUR_AT = ST.tulsi + 4;
const RIG_PHASE = 2766 - POUR_AT;
const LEAF_AT = POUR_AT + 42;

const PLACE_WARP: Array<[number, number]> = [
  [0, 0],
  [7, 10],
  [11, 14],
  [23, 24],
  [26, 30],
  [32, 44],
];
const PLACE_LEN = 32;
const PLACE_CONTACT = 23;
const PLACE_TAIL = 44 - PLACE_LEN;

const placeClock = (tau: number): number => {
  if (tau <= 0) return tau;
  for (let i = 1; i < PLACE_WARP.length; i++) {
    const [a, ra] = PLACE_WARP[i - 1];
    const [b, rb] = PLACE_WARP[i];
    if (tau <= b) return ra + ((tau - a) / (b - a)) * (rb - ra);
  }
  return tau + PLACE_TAIL;
};

const CARRY_ARC = 22;
const PLACE_END = pauseStory(1, 268);
const PLACE_1 = PLACE_END - 3 * PLACE_LEN;
const PALMS_AT = ST.ar + 4;
const BOW_AT = PALMS_AT + 16;
const RISE_AT = pauseStory(2, 328) - 18;

const BALAK_BEATS: Array<{ from: number; pose: ChildPose; place?: boolean }> = [
  { from: -999, pose: "sitCross" },
  { from: POUR_AT, pose: "pour" },
  { from: LEAF_AT, pose: "pickLeaf" },
  { from: PLACE_1, pose: "placeFlowerOnFoot", place: true },
  { from: PLACE_1 + PLACE_LEN, pose: "placeFlowerOnFoot", place: true },
  { from: PLACE_1 + 2 * PLACE_LEN, pose: "placeFlowerOnFoot", place: true },
  { from: PALMS_AT, pose: "bless" },
  { from: BOW_AT, pose: "bowHands" },
  { from: RISE_AT, pose: "bless" },
  { from: pauseStory(2, 328) + 1, pose: "sitCross" },
  { from: ST.toder - 1, pose: "palmRaise" },
  { from: ST.toder + 54, pose: "sitCross" },
  { from: ST.amar + 52, pose: "bless" },
  { from: ST.tomader + 15, pose: "palmRaise" },
  { from: ST.kichu - 9, pose: "sitCross" },
  { from: pauseStory(7, 847) - 13, pose: "bless" },
  { from: ST.ami + 37, pose: "sitCross" },
  { from: ST.gach + 10, pose: "palmRaise" },
  { from: ST.gach + 46, pose: "bowHands" },
  { from: ST.gach + 64, pose: "bless" },
];

const beatIndex = (f: number): number => {
  let idx = 0;
  BALAK_BEATS.forEach((b, i) => {
    if (f >= b.from) idx = i;
  });
  return idx;
};

const footFlowersAt = (f: number): number => BALAK_BEATS.filter((b) => b.place && f >= b.from + PLACE_CONTACT).length;

interface BalakRig {
  pose: ChildPose;
  prevPose?: ChildPose;
  poseStart: number;
  prevPoseStart?: number;
  basketAt: { x: number; y: number };
}

const balakRig = (f: number): BalakRig => {
  const i = beatIndex(f);
  const beat = BALAK_BEATS[i];
  const prev = i > 0 ? BALAK_BEATS[i - 1] : undefined;
  const tau = f - beat.from;
  const clock = beat.place ? placeClock(tau) : tau;
  const out: BalakRig = {
    pose: beat.pose,
    prevPose: prev && prev.pose !== beat.pose ? prev.pose : undefined,
    poseStart: f - clock + RIG_PHASE,
    prevPoseStart: prev ? prev.from + RIG_PHASE - (prev.place ? PLACE_TAIL : 0) : undefined,
    basketAt: BASKET_AT,
  };
  if (beat.place) {
    const s = clamp((clock - 14) / 10);
    const sm = s * s * (3 - 2 * s);
    out.basketAt = { x: BASKET_AT.x, y: BASKET_AT.y - 4 * CARRY_ARC * sm };
  }
  return out;
};

const BALAK_EXPR: Array<{ from: number; e: ExprName }> = [
  { from: -999, e: "serene" },
  { from: ST.ar + 10, e: "compassionate" },
  { from: pauseStory(2, 328) + 1, e: "serene" },
  { from: ST.amar + 50, e: "compassionate" },
  { from: ST.tomader + 15, e: "serene" },
  { from: ST.gach + 8, e: "compassionate" },
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

const balakFaceAt = (f: number): Required<ChildFace> => {
  const seeFlowers = ST.tui + 46;
  const amar = ST.amar + 20;
  const keno = ST.ami + 43;
  const kauke = ST.gach + 36;
  return {
    lookX: track(f, [
      [0, 0.1],
      [ST.oma - 4, 0.1],
      [ST.oma + 8, -0.75, "inOut"],
      [seeFlowers, -0.75],
      [seeFlowers + 12, -0.12, "inOut"],
      [pauseStory(4, 494), -0.12],
      [pauseStory(4, 494) + 1, -0.75],
      [pauseStory(4, 494) + 26, -0.75],
      [pauseStory(4, 494) + 40, -0.85, "inOut"],
      [ST.toder - 6, -0.85],
      [ST.toder + 4, -0.75, "inOut"],
      [amar - 2, -0.75],
      [amar + 10, -0.18, "inOut"],
      [amar + 26, -0.18],
      [amar + 38, -0.75, "inOut"],
      [ST.tomader + 6, -0.75],
      [ST.tomader + 16, -0.85, "inOut"],
      [ST.ami - 6, -0.85],
      [ST.ami + 2, -0.75, "inOut"],
      [keno - 4, -0.75],
      [keno + 8, -0.14, "inOut"],
      [keno + 16, -0.14],
      [keno + 28, -0.75, "inOut"],
      [kauke - 6, -0.75],
      [kauke + 8, -0.85, "inOut"],
      [ST.gach + 62, -0.85],
      [ST.gach + 82, -0.5, "inOut"],
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

const balakPauseFace = (base: Required<ChildFace>, pause: ReturnType<typeof useStory3>["pause"], f = 0, mouthOpen = 0): Required<ChildFace> => {
  // Subtle organic gaze micro-saccade & speech-cadence smile warmth
  const saccadeX = noise1(f * 0.032, 91) * 0.035;
  const saccadeY = noise1(f * 0.026, 97) * 0.025;
  const speechSmile = mouthOpen * 0.045;
  const aliveBase: Required<ChildFace> = {
    lookX: clamp(base.lookX + saccadeX, -1, 1),
    eyesDown: clamp(base.eyesDown + saccadeY, 0, 1),
    smile: clamp(base.smile + speechSmile, 0, 1),
  };
  if (!pause.inPause) return aliveBase;
  const t = pause.t;
  if (pause.index === 1) {
    const w = bump(t, 0.05, 0.35, 0.82, 1);
    return { lookX: lerp(aliveBase.lookX, 0.2, w), eyesDown: lerp(aliveBase.eyesDown, 0.55, w), smile: aliveBase.smile + 0.12 * w };
  }
  if (pause.index === 4) {
    const up = EASE.inOut(clamp((t - 0.3) / 0.4));
    return { lookX: lerp(-0.12, -0.75, up), eyesDown: lerp(0.6, 0, up), smile: aliveBase.smile + 0.1 * up };
  }
  if (pause.index === 8) return { ...aliveBase, smile: aliveBase.smile + 0.06 * EASE.inOut(clamp(t / 0.6)) };
  return aliveBase;
};

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

const END_BLINK_SHIFT = 20;
const rigLifeShift = (lf: number): number => END_BLINK_SHIFT * EASE.inOut(clamp((lf - (P_END[0] - 97)) / 111));

/* ---------------- standing cast ---------------- */

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

const sway = (base: (fr: number) => Pose, seed: number, amp = 1) => (fr: number): Partial<Pose> => {
  const k = base(fr);
  const t = fr + seed * 9;
  const breath = Math.sin(fr * 0.052 + seed * 1.3);
  return {
    ...k,
    bodyX: k.bodyX + noise1(t * 0.011, seed) * 2.4 * amp,
    bodyY: k.bodyY + breath * 0.75 * amp,
    lean: k.lean + noise1(t * 0.017, seed + 2) * 0.9 * amp + breath * 0.32 * amp,
    headTilt: k.headTilt + noise1(t * 0.023, seed + 4) * 1.2 * amp,
    headNod: k.headNod + breath * 0.55 * amp,
  };
};

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

const nodsAt = (fr: number, windows: Array<[number, number]>, period: number, phase: number, amp = 3.4) => {
  let nod = 0;
  for (const [a, b] of windows) {
    const env = windowed(fr, a, b, 8);
    if (env <= 0) continue;
    nod += Math.max(0, Math.sin(((fr - a) / period) * Math.PI * 2 + phase)) * amp * env;
  }
  return nod;
};

/**
 * Zero-slip step progression: advances the character's forward position in phase with the
 * planted stance foot's backward velocity (`cos(2*(f*0.3 + seed))`), so the planted foot
 * pushes the body forward during stance while slowing slightly during the mid-swing cross,
 * and computes exact anatomical stride (`|dx/df| / (0.3 * 0.42 * thigh * s)`) + vertical gait bob.
 */
const walkSpot = (from: Spot, to: Spot, a: number, b: number, seed: number) => (lf: number): Spot => {
  const u = clamp((lf - a) / (b - a));
  const baseT = EASE.inOut(u);
  const env = Math.sin(u * Math.PI); // 0 at start/stop, 1 in mid-walk
  // 2 steps per leg cycle (2 * 0.3 rad/frame = 0.6 rad/frame): surges slightly on each foot push-off
  const cadenceRipple = (Math.sin(2 * (lf * 0.3 + seed)) / (b - a)) * 1.15 * env;
  const t = clamp(baseT + cadenceRipple, 0, 1);
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), s: lerp(from.s, to.s, t) };
};
const strideOf = (spot: (lf: number) => Spot, c: CastMember) => (lf: number): number => {
  const a = spot(lf - 1);
  const b = spot(lf + 1);
  const speed = Math.hypot(b.x - a.x, b.y - a.y) * 0.5;
  const thigh = (c.age === "child" ? 47 : 80) * c.height;
  // Exact zero-slip denominator for Puppet.tsx legGeo: 0.3 * 0.42 * (thigh + 0.7*shin) * scale
  const stepDenom = Math.max(1.5, 0.21 * thigh * spot(lf).s);
  return clamp(speed / stepDenom, 0, 1);
};
const WALK_A = V.sabai + 14;
const ELDEST_AT = walkSpot(ELDEST_FROM, ELDEST_TO, WALK_A, WALK_A + 86, 53);
const MIDDLE_AT = walkSpot(MIDDLE_FROM, MIDDLE_TO, WALK_A + 4, WALK_A + 96, 71);
const YOUNG_AT = walkSpot(YOUNG_FROM, YOUNG_TO, WALK_A + 10, WALK_A + 94, 61);

const skinMid = { skin: "#c98d63", skinLight: "#e6b088", skinShade: "#a0663f", lips: "#a35448" };
const skinWarm = { skin: "#d9a07a", skinLight: "#f0c4a0", skinShade: "#b47853", lips: "#b0605a" };
const skinDeep = { skin: "#b97a52", skinLight: "#d89a70", skinShade: "#8d5536", lips: "#94493f" };

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

const ELDEST_KEYS: PoseKey<Pose>[] = [
  { f: 0, bodyTurn: 0.3, headTurn: -0.35, smile: 0.5, rS: 8, rE: -10, lS: 8, lE: -10, rHand: "relaxed", lHand: "relaxed" },
  { f: V.sabai + 6, in: 12, ease: "inOut", headTurn: 0.42, eyeX: 0.3, smile: 0.4 },
  { f: WALK_A + 18, in: 16, ease: "inOut", bodyTurn: 0.36, headTurn: 0.38 },
  { f: WALK_A + 94, in: 16, ease: "inOut", bodyTurn: 0.34, headTurn: 0.44, brow: 0.25, smile: 0.4, lean: 1 },
  { f: V.nijerPaye + 6, in: 12, ease: "inOut", brow: 0.55, smile: 0.25, headTilt: 4 },
  { f: P_FLOWERS[0] + 6, in: 7, ease: "inOut", headTurn: -0.18, eyeX: -0.35 },
  { f: P_FLOWERS[0] + 20, in: 8, ease: "inOut", headTurn: 0.44, eyeX: 0.3 },
  { f: V.ar + 40, in: 14, ease: "inOut", brow: 0.65, smile: 0.15, lean: -1, headTilt: 0 },
  { f: P_PRANAM[0] + 14, in: 8, ease: "inOut", headTurn: -0.2, eyeX: -0.4 },
  { f: P_PRANAM[0] + 34, in: 10, ease: "inOut", headTurn: 0.44, eyeX: 0.3, gasp: 0.12 },
  { f: V.oma + 4, in: 12, ease: "out", lS: 32, lE: -170, lHand: "relaxed", gasp: 0.3, brow: 0.75, smile: 0.2, headTurn: 0.46, lean: -1 },
  { f: V.eki + 10, in: 10, ease: "inOut", headTilt: 4 },
  { f: V.eki + 20, in: 10, ease: "inOut", headTilt: -3 },
  { f: P_KANDO[0] + 8, in: 8, ease: "inOut", headTilt: 2 },
  { f: P_KANDO[0] + 22, in: 14, ease: "inOut", lS: 8, lE: -10, gasp: 0, brow: 0.5, headTilt: 0, smile: 0.38 },
  { f: V.tui + 4, in: 12, ease: "inOut", bodyTurn: 0.34, headTurn: 0.52, lean: 3, brow: 0.45, smile: 0.3, headTilt: 3 },
  { f: V.tuiPaye + 2, in: 10, ease: "out", rS: 55, rE: -6, rHand: "point", eyeY: 0.35, headNod: 3 },
  { f: V.tuiPaye + 40, in: 12, ease: "inOut", rS: 30, rE: -42, rHand: "open", eyeY: 0, headNod: 0, headTilt: 6, brow: 0.6 },
  { f: P_KENO[0] + 22, in: 14, ease: "inOut", rS: 12, rE: -16, rHand: "relaxed", headTilt: 7, brow: 0.55, smile: 0.4, lean: 2 },
  { f: V.dekhis + 2, in: 10, ease: "out", rS: 32, rE: 125, rHand: "point", lean: 5, headTilt: -3, smile: 0.3, brow: 0.5 },
  { f: V.shap + 6, in: 12, ease: "inOut", lean: 6, headNod: 4, brow: 0.6, smile: 0.35 },
  { f: P_SHAP[0] + 16, in: 16, ease: "inOut", lean: 2, headNod: 0, headTilt: 4, rS: 10, rE: -14, rHand: "relaxed", smile: 0.42, brow: 0.4 },
  { f: V.toder + 10, in: 12, ease: "inOut", brow: 0.58, smile: 0.25, headTilt: -2, lean: -1.5, bodyX: -3.5 },
  { f: V.amar + 18, in: 18, ease: "inOut", brow: 0.42, smile: 0.26, headTilt: 3, eyeY: 0.25, lean: 0, bodyX: -1.5 },
  { f: V.amar + 44, in: 20, ease: "inOut", brow: 0.28, smile: 0.3, headTilt: 2, eyeY: 0 },
  { f: V.tomader + 16, in: 16, ease: "inOut", smile: 0.16, brow: 0.46, headTilt: -3, lean: -1 },
  { f: V.tomader + 48, in: 24, ease: "inOut", smile: 0.14, brow: 0.36, headTilt: -1.5, lean: 0 },
  { f: P_BOJHE[0] + 12, in: 9, ease: "inOut", headTurn: -0.18, eyeX: -0.35, brow: 0.3 },
  { f: P_BOJHE[0] + 30, in: 12, ease: "inOut", headTurn: 0.45, eyeX: 0.3, brow: 0.05, smile: 0.3, lid: 0.1, headTilt: 4 },
  { f: V.ami + 18, in: 20, ease: "inOut", brow: 0.18, smile: 0.36, headTilt: 3, lean: 1.2 },
  { f: V.gach + 24, in: 24, ease: "inOut", brow: 0.08, smile: 0.48, headTilt: 5, lean: 1.8 },
];
const eldestBase = sway(A(ELDEST_KEYS), 53, 0.8);
const ELDEST_STRIDE = strideOf(ELDEST_AT, GIRL_A_CAST);
const eldestWag = (fr: number) => windowed(fr, V.dekhis + 6, V.shap + 34, 8) * Math.sin((fr - V.dekhis) * 0.62);
const ELDEST_ACT = (fr: number): Partial<Pose> => {
  const k = eldestBase(fr);
  const chat = windowed(fr, -20, V.sabai + 6, 8) * 2.5 * Math.sin(fr * 0.33 + 53);
  const wag = eldestWag(fr);
  const st = ELDEST_STRIDE(fr);
  const ph = fr * 0.3 + 53;
  const walkBob = st > 0.03 ? -Math.abs(Math.sin(ph)) * 2.4 * st : 0;
  const armSwing = st > 0.03 ? Math.sin(ph) * 14 * st : 0;
  // Syllable-synced head, torso & brow emphasis while speaking her lines
  const sp = eldestSpeechEnergy(fr);
  const sylPulse = sp * (0.65 + 0.35 * Math.sin(fr * 0.55));
  return {
    ...k,
    bodyY: (k.bodyY ?? 0) + walkBob,
    headNod: (k.headNod ?? 0) + chat + sylPulse * 3.1,
    lean: (k.lean ?? 0) + sp * 1.45 + st * 1.8,
    brow: clamp((k.brow ?? 0) + sp * 0.12, -1, 1),
    rE: (k.rE ?? 0) + 13 * wag,
    rS: (k.rS ?? 0) + 3 * wag + armSwing,
    lS: (k.lS ?? 0) - armSwing,
    stride: st,
  };
};

const followerKeys = (d: number, chatTurn: number, toEldest: number, toOther: number): PoseKey<Pose>[] => [
  { f: 0, bodyTurn: 0.3, headTurn: chatTurn, smile: 0.5, rS: 8, rE: -10, lS: 8, lE: -10, rHand: "relaxed", lHand: "relaxed" },
  { f: V.sabai + 6 + d, in: 12, ease: "inOut", headTurn: 0.42, eyeX: 0.3, smile: 0.4 },
  { f: WALK_A + 22 + d, in: 16, ease: "inOut", bodyTurn: 0.35, headTurn: 0.38 },
  { f: WALK_A + 98 + d, in: 16, ease: "inOut", bodyTurn: 0.34, headTurn: 0.44, brow: 0.2, smile: 0.45 },
  { f: V.nijerPaye + 10 + d, in: 12, ease: "inOut", brow: 0.5, smile: 0.3 },
  { f: P_FLOWERS[0] + 6 + d * 0.5, in: 7, ease: "inOut", headTurn: toEldest, eyeX: toEldest * 0.6 },
  { f: P_FLOWERS[0] + 20 + d * 0.5, in: 8, ease: "inOut", headTurn: 0.42, eyeX: 0.3 },
  { f: P_PRANAM[0] + 12 + d, in: 8, ease: "inOut", headTurn: toEldest, eyeX: toEldest * 0.6, brow: 0.6 },
  { f: P_PRANAM[0] + 32 + d, in: 10, ease: "inOut", headTurn: 0.42, eyeX: 0.3 },
  { f: V.oma + 8 + d, in: 10, ease: "inOut", headTurn: toEldest, eyeX: toEldest * 0.6, brow: 0.3, smile: 0.45 },
  { f: P_KANDO[0] + 6 + d, in: 9, ease: "out", headTurn: 0.45, eyeX: 0.3, lS: 14, lE: -166, lHand: "open", lean: 4, smile: 0.9, lid: 0.3, headTilt: 6 },
  { f: P_KANDO[0] + 26 + d * 0.6, in: 12, ease: "inOut", lS: 8, lE: -10, lHand: "relaxed", lean: 3, lid: 0, smile: 0.6, headTilt: 2, brow: 0.1 },
  { f: V.dekhis + 10 + d, in: 12, ease: "inOut", lean: 5, smile: 0.55 },
  { f: P_SHAP[0] + 6 + d, in: 8, ease: "out", lS: 14, lE: -166, lHand: "open", lean: 5, smile: 0.95, lid: 0.3, headTilt: 7 },
  { f: P_SHAP[0] + 30 + d * 0.6, in: 12, ease: "inOut", lS: 8, lE: -10, lHand: "relaxed", lean: 2, lid: 0, smile: 0.6, headTilt: 1 },
  { f: V.toder + 12 + d, in: 14, ease: "inOut", lean: -1, bodyX: -2.5, brow: 0.42, smile: 0.35, headTilt: -2 },
  { f: V.amar + 22 + d, in: 18, ease: "inOut", lean: 0.5, bodyX: 0, brow: 0.22, smile: 0.38, eyeY: 0.2, headTilt: 3 },
  { f: V.tomader + 20 + d, in: 22, ease: "inOut", smile: 0.25, brow: 0.32, lean: -0.5, eyeY: 0, headTilt: -1.5 },
  { f: V.tomader + 60 + d, in: 32, ease: "inOut", smile: 0.28, brow: 0.2, lean: 0 },
  { f: P_BOJHE[0] + 18 + d * 0.3, in: 10, ease: "inOut", headTurn: toOther, eyeX: toOther * 0.6, brow: 0.38, smile: 0.22 },
  { f: P_BOJHE[0] + 34 + d * 0.3, in: 12, ease: "inOut", headTurn: 0.42, eyeX: 0.3, brow: 0.15, smile: 0.32 },
  { f: V.ami + 20 + d, in: 22, ease: "inOut", brow: 0.12, smile: 0.42, headTilt: 3.5, lean: 1 },
  { f: V.gach + 26 + d, in: 24, ease: "inOut", brow: 0.05, smile: 0.52, headTilt: 4.5, lean: 1.5 },
];
const followerAct = (
  keys: PoseKey<Pose>[],
  seed: number,
  spot: (lf: number) => Spot,
  cast: CastMember,
  period: number,
  phase: number,
  giggles: Array<[number, number]>,
  nods: Array<[number, number]>,
) => {
  const base = sway(A(keys), seed, 1);
  const strideAt = strideOf(spot, cast);
  return (fr: number): Partial<Pose> => {
    const k = base(fr);
    const g = giggleAt(fr, giggles, period, phase);
    const chat = windowed(fr, -20, V.sabai + 6, 8) * 2.5 * Math.sin(fr * 0.33 + seed);
    const nod = nodsAt(fr, nods, period + 4, phase);
    const st = strideAt(fr);
    const ph = fr * 0.3 + seed;
    const walkBob = st > 0.03 ? -Math.abs(Math.sin(ph)) * 2.2 * st : 0;
    const armSwing = st > 0.03 ? Math.sin(ph) * 14 * st : 0;
    return {
      ...k,
      headNod: (k.headNod ?? 0) + g.nod + chat + nod,
      bodyX: (k.bodyX ?? 0) + g.dx,
      bodyY: (k.bodyY ?? 0) + walkBob,
      lean: (k.lean ?? 0) + st * 1.6,
      rS: (k.rS ?? 0) + armSwing,
      lS: (k.lS ?? 0) - armSwing,
      stride: st,
    };
  };
};
const MIDDLE_ACT = followerAct(
  followerKeys(4, 0.55, 0.62, -0.3),
  71,
  MIDDLE_AT,
  GIRL_C_CAST,
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
  GIRL_B_CAST,
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

const Sprig: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale * 0.9}) translate(0, -18)`}>
    <path d="M 0 0 Q 6 -18 12 -34" stroke="#7a5a2c" strokeWidth={2} fill="none" strokeLinecap="round" />
    <GhibliInkBloom x={12} y={-34} r={7} kind="shiuli" />
    <GhibliInkBloom x={-2} y={-22} r={5.5} kind="shiuli" rot={30} />
    <GhibliInkBloom x={24} y={-22} r={5.5} kind="shiuli" rot={-20} />
  </g>
);

const LooseHair: React.FC<{ cast: CastMember; pose: Partial<Pose>; lifeF: number; x: number; y: number; scale: number }> = ({
  cast,
  pose,
  lifeF,
  x,
  y,
  scale,
}) => {
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
const WOMEN: Array<{ cast: CastMember; x: number; y: number; act: (fr: number) => Partial<Pose>; props: Record<string, PropRenderer>; hair?: boolean }> = [
  { cast: S01_SARALA, ...WOMEN_AT[0], act: womanAct(101, 0, 0.3, { lHand: "relaxed", rHand: "relaxed" }), props: {}, hair: true },
  { cast: S01_MINA, ...WOMEN_AT[1], act: womanAct(207, 6, -0.3, { lHand: "relaxed", rHand: "relaxed" }), props: {}, hair: true },
  { cast: S01_TUNI, ...WOMEN_AT[2], act: womanAct(311, 10, 0.25, { rS: 80, rE: -84, rHand: "hold", rProp: "sprig" }), props: { sprig: Sprig } },
  { cast: S01_REKHA, ...WOMEN_AT[3], act: womanAct(419, 3, -0.3, { lHand: "relaxed", rHand: "relaxed" }), props: {}, hair: true },
];

/* ---------------- Ghibli ink-styled hand-off props ---------------- */

const KolsiShape: React.FC = () => (
  <g>
    <path d="M -10 -4 Q -20 2 -10 9" stroke="#5a2e16" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <path d="M 7 -4 Q 13 -8 17 -12" stroke="#6a3a1e" strokeWidth={4} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={2} rx={11} ry={11} fill="#b8703f" stroke="#422616" strokeWidth={1.1} />
    <ellipse cx={-3} cy={-1} rx={5} ry={6} fill="#dca070" opacity={0.6} />
    <ellipse cx={0} cy={-11} rx={5} ry={2.2} fill="#8a4a24" stroke="#422616" strokeWidth={0.9} />
  </g>
);

const Leaf: React.FC<{ x: number; y: number; rot?: number; s?: number; c?: string }> = ({ x, y, rot = 0, s = 1, c = "#5f9a3c" }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 -15 Q 10 -4 0 15 Q -10 -4 0 -15 Z" fill={c} stroke="#362216" strokeWidth={0.9} strokeOpacity={0.75} />
    <path d="M 0 -11 L 0 10" stroke="#2d5a22" strokeWidth={1} opacity={0.6} />
  </g>
);

const PickLeaf: React.FC<{ opacity: number }> = ({ opacity }) => (
  <g opacity={opacity} transform={`translate(${PICK_LEAF.x}, ${PICK_LEAF.y}) rotate(-18) scale(${BALAK_POS.s})`}>
    <ellipse rx={9} ry={4.2} fill="#5f9a46" stroke="#362216" strokeWidth={0.9} />
    <path d="M -7 0 L 6 0" stroke="#3f6e2e" strokeWidth={0.9} />
  </g>
);

const GroundGlow: React.FC<{ level: number }> = ({ level }) => (
  <g opacity={level}>
    <defs>
      <radialGradient id="g-s02-ground-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.48} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={BALAK_POS.x + 10} cy={BALAK_POS.y + 4} rx={150} ry={26} fill="url(#g-s02-ground-glow)" />
  </g>
);

const VC = VEDIC_COURTYARD;
const BRANCH_REST: Array<{ x: number; y: number }> = [
  { x: 1100, y: 455 },
  { x: 1186, y: 526 },
  { x: 1274, y: 526 },
  { x: 1468, y: 528 },
  { x: 1550, y: 530 },
  { x: 1662, y: 552 },
];
const GhibliJabaBranchRest: React.FC<{ f: number }> = ({ f }) => {
  const breeze = 2.4 * noise1(f * 0.018, 77) + 1.2 * noise1(f * 0.041, 78);
  const pts = BRANCH_REST.map((p, i) => ({ x: p.x, y: p.y + (i / (BRANCH_REST.length - 1)) * breeze }));
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  return (
    <g>
      <path d={d} stroke="#362013" strokeWidth={8.4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      <path d={d} stroke="#785337" strokeWidth={6.0} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#9e7450" strokeWidth={2.0} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.5} transform="translate(0, -1.2)" />
      {pts.slice(1).map((p, i) => {
        const q = pts[i];
        return [0.25, 0.6, 0.9].map((u, k) => {
          const x = q.x + (p.x - q.x) * u;
          const y = q.y + (p.y - q.y) * u;
          const side = (i + k) % 2 ? 1 : -1;
          return (
            <GhibliSketchedLeaf
              key={`l${i}-${k}`}
              x={x + side * 4}
              y={y + side * 9}
              len={17}
              rot={side * 22}
              variant={i + k}
            />
          );
        });
      })}
      {[1, 3, 4].map((i, k) => (
        <GhibliJabaBlossom key={`b${k}`} x={pts[i].x + 4} y={pts[i].y + 12} r={12} rot={k * 61 + 15} />
      ))}
    </g>
  );
};

const SAJIS = VC.sajisAtTulsi.slice(1);

const MorningBackWash: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="g-s02-back-sun" x1="1" y1="0" x2="0" y2="0.6">
        <stop offset="0%" stopColor="#fff0c8" stopOpacity={0.28} />
        <stop offset="55%" stopColor="#ffe2a8" stopOpacity={0.14} />
        <stop offset="100%" stopColor="#ffd9a0" stopOpacity={0.05} />
      </linearGradient>
    </defs>
    <rect x={-400} y={150} width={2720} height={640} fill="url(#g-s02-back-sun)" style={{ mixBlendMode: "screen" }} />
  </g>
);

const MorningFloorWash: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="g-s02-floor-sun" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe6b8" stopOpacity={0.22} />
        <stop offset="100%" stopColor="#ffd9a0" stopOpacity={0.08} />
      </linearGradient>
      <radialGradient id="g-s02-floor-pool">
        <stop offset="0%" stopColor="#ffe9bf" stopOpacity={0.26} />
        <stop offset="100%" stopColor="#ffe9bf" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-400} y={784} width={2720} height={600} fill="url(#g-s02-floor-sun)" style={{ mixBlendMode: "screen" }} />
    <ellipse cx={1150} cy={950} rx={900} ry={140} fill="url(#g-s02-floor-pool)" style={{ mixBlendMode: "screen" }} />
  </g>
);

const DAY_LIGHTS: SceneLight[] = [
  { x: 1700, y: 80, color: "#ffe2a0", intensity: 0.4, radius: 1400 },
  { x: LAMP.x, y: LAMP.y, color: "#ffb04a", intensity: 0.55, radius: 300, flicker: 7 },
];
const SUN: Lighting = { keySide: 1, rim: "#ffd98a", rimStrength: 0.35 };

export const GhibliScene02TulsiCourtyard: React.FC = () => {
  const { f, lifeF, pause } = useStory3(SCENE_ID);
  const cam = cameraAt(lifeF);

  const kolsiRestOp = f < POUR_AT + 22 ? 1 - clamp((f - POUR_AT + 4) / 4) : clamp((f - (POUR_AT + 58)) / 3);
  const pickLeafOp = 1 - EASE.inOut(clamp((f - LEAF_AT) / 16));

  const rig = balakRig(f);
  const expr = balakExpr(f);
  const mouth = balakMouth(lifeF);
  const face = balakPauseFace(balakFaceAt(f), pause, lifeF, mouth);
  // Subtle meditative breathing carrier & speech cadence lift
  const balakBreathY = Math.sin(lifeF * 0.052) * 0.55 - mouth * 0.45;

  const beat = glowBeat(lifeF);
  const glow = GLOW_BASE + (1 - GLOW_BASE) * beat;
  const haloR = 190 * (1 + 0.1 * beat);

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
  const glowAt = seatedChildHands(balakProps).glowAnchor;

  const fade = clamp(lifeF / 10) * clamp((DUR - lifeF) / 12);
  const eldest = ELDEST_AT(lifeF);
  const middle = MIDDLE_AT(lifeF);
  const young = YOUNG_AT(lifeF);

  const shiuliSway = 0.55 * Math.sin(lifeF * 0.026 + 1) + 0.4 * noise1(lifeF * 0.016, 5);
  const jhumkoSway = 0.28 * noise1(lifeF * 0.015, 63);
  const jabaSway = 0.22 * noise1(lifeF * 0.014, 61);

  return (
    <div style={{ position: "absolute", inset: 0, background: CY_BG, overflow: "hidden" }}>
      <GhibliPreload files={PRELOAD} />
      <GhibliStage cam={cam} background={CY_BG} opacity={fade}>
        <SceneLights.Provider value={DAY_LIGHTS}>
          <GhibliLayer depth={CY.sky} extraBlur={1.8}>
            <image href={staticFile("images/ghibli_ep03/sky_morning_gold.png")} x={-1200} y={-900} width={4400} height={2475} preserveAspectRatio="xMidYMid slice" />
          </GhibliLayer>
          <GhibliLayer depth={0.38} extraBlur={1.4}>
            <image href={staticFile("images/ghibli_ep03/far_trees_sketch.png")} x={-600} y={-10} width={3200} height={360} preserveAspectRatio="none" />
          </GhibliLayer>
          <GhibliLayer depth={CY.back} extraBlur={1.0}>
            <GlowDefs />
            <rect x={-600} y={770} width={3200} height={900} fill="#b89878" />
            <image href={staticFile("images/ghibli_ep03/courtyard_back_sketch.png")} x={-300} y={140} width={2520} height={660} preserveAspectRatio="none" />
            <MorningBackWash />
          </GhibliLayer>
          <GhibliLayer depth={0.68}>
            <GhibliAtmosphericHaze f={lifeF} intensity={0.95} seed={43} />
          </GhibliLayer>
          <GhibliLayer depth={CY.floor}>
            <GlowDefs />
            <DivineDefs />
            <GhibliCharFilterDefs />
            <image href={staticFile("images/ghibli_ep03/courtyard_floor_sketch.png")} x={-400} y={784} width={2720} height={600} preserveAspectRatio="none" />
            <GhibliCourtyardShadows f={lifeF} shiuli={VC.shiuli} jhumko={VC.jhumko} jaba={VC.jaba} tulsi={VC.tulsi} />
            <MorningFloorWash />

            <GhibliFallenShiuli x={VC.shiuli.x + 40} y={VC.shiuli.y - 12} />
          </GhibliLayer>

          {/* Mid-ground trees & distant watching women plane (ground-locked with subtle DOF bokeh on close-ups) */}
          <GhibliLayer depth={0.82} groundLocked parallaxDrift={-0.022}>
            <GhibliCharFilterDefs />
            <g transform={`rotate(${shiuliSway} ${VC.shiuli.x} ${VC.shiuli.y})`}>
              <GhibliCutout file="images/ghibli_ep03/tree_shiuli_sketch.png" anchor={GHIBLI_ANCHORS.tree_shiuli_sketch} x={VC.shiuli.x} y={VC.shiuli.y} targetHeight={620} />
            </g>
            <g transform={`rotate(${jhumkoSway} ${VC.jhumko.x} ${VC.jhumko.y})`}>
              <GhibliCutout file="images/ghibli_ep03/tree_jhumko_sketch.png" anchor={GHIBLI_ANCHORS.tree_jhumko_sketch} x={VC.jhumko.x} y={VC.jhumko.y} targetHeight={600} />
            </g>
            <g transform={`rotate(${jabaSway} ${VC.jaba.x} ${VC.jaba.y})`}>
              <GhibliCutout file="images/ghibli_ep03/tree_jaba_sketch.png" anchor={GHIBLI_ANCHORS.tree_jaba_sketch} x={VC.jaba.x} y={VC.jaba.y} targetHeight={650} />
            </g>
            <GhibliJabaBranchRest f={lifeF} />

            <g transform={STAGING_TRANSFORM}>
              {WOMEN.map((w) => (
                <React.Fragment key={w.cast.id}>
                  <ContactShadow x={w.x} y={w.y} rx={30} ry={7} />
                  <g filter="url(#ghibli-char-ink)">
                    {w.hair && <LooseHair cast={w.cast} pose={w.act(lifeF)} lifeF={lifeF} x={w.x} y={w.y} scale={WOMEN_S} />}
                    <Puppet cast={w.cast} f={lifeF} lifeF={lifeF} x={w.x} y={w.y} scale={WOMEN_S} acting={w.act} props={w.props} light={SUN} stillness={0.2} />
                  </g>
                </React.Fragment>
              ))}
            </g>
          </GhibliLayer>

          {/* Upstage Tulsi Mancha & ground sajis plane */}
          <GhibliLayer depth={0.94} groundLocked parallaxDrift={-0.008}>
            <GlowDefs />
            {/* Tulsi Mancha high-res sketch + live flickering flame inside niche */}
            <ContactShadow x={VC.tulsi.x} y={VC.tulsi.y + 4} rx={115 * VC.tulsi.s} ry={18 * VC.tulsi.s} opacity={0.28} />
            <GhibliCutout
              file="images/ghibli_ep03/tulsi_mancha_sketch.png"
              anchor={GHIBLI_ANCHORS.tulsi_mancha_sketch}
              x={VC.tulsi.x}
              y={VC.tulsi.y}
              targetHeight={355 * VC.tulsi.s}
            />
            <Glow x={VC.tulsi.x} y={VC.tulsi.y - 102 * VC.tulsi.s} r={62 * VC.tulsi.s} kind="warm" o={0.55} />
            <Flame x={VC.tulsi.x} y={VC.tulsi.y - 94 * VC.tulsi.s} s={1.0 * VC.tulsi.s} f={lifeF} seed={99} />

            {SAJIS.map((sx, i) => {
              const sy = VC.tulsi.y + 16 + ((i + 1) % 2) * 6;
              const file = i % 2 === 0 ? "images/ghibli_ep03/prop_ground_saji_b.png" : "images/ghibli_ep03/prop_ground_saji_a.png";
              const anc = i % 2 === 0 ? GHIBLI_ANCHORS.prop_ground_saji_b : GHIBLI_ANCHORS.prop_ground_saji_a;
              return (
                <React.Fragment key={sx}>
                  <ContactShadow x={sx} y={sy} rx={28} ry={6} opacity={0.3} />
                  <GhibliCutout file={file} anchor={anc} x={sx} y={sy} targetHeight={68} />
                </React.Fragment>
              );
            })}
          </GhibliLayer>

          {/* Principal foreground plane (focus = 1.0): Balak Thakur, his worship props, and the 3 scolding girls */}
          <GhibliLayer depth={CY.floor}>
            <GlowDefs />
            <DivineDefs />
            <GhibliCharFilterDefs />
            <g transform={STAGING_TRANSFORM}>
              <ContactShadow x={middle.x} y={middle.y} rx={32 * middle.s} ry={8 * middle.s} />
              <g filter="url(#ghibli-char-ink)">
                <Puppet cast={GIRL_C_CAST} f={lifeF} lifeF={lifeF} x={middle.x} y={middle.y} scale={middle.s} acting={MIDDLE_ACT} light={SUN} />
              </g>

              <ContactShadow x={young.x} y={young.y} rx={30 * young.s} ry={8 * young.s} />
              <g filter="url(#ghibli-char-ink)">
                <Puppet cast={GIRL_B_CAST} f={lifeF} lifeF={lifeF} x={young.x} y={young.y} scale={young.s} acting={YOUNG_ACT} light={SUN} />
              </g>

              {FLOOR_LEAVES.map((l, i) => (
                <Leaf key={i} x={BALAK_POS.x + l.dx} y={BALAK_POS.y + l.dy} rot={l.rot} s={l.s} c={l.c} />
              ))}

              {/* Dala basket of red hibiscus (anchored cleanly around Balak's pick point) */}
              <ContactShadow x={BASKET.x} y={BASKET.y + 18 * BASKET_SCALE} rx={38} ry={7} opacity={0.3} />
              <GhibliCutout
                file="images/ghibli_ep03/prop_dala_basket.png"
                anchor={GHIBLI_ANCHORS.prop_dala_basket}
                x={BASKET.x}
                y={BASKET.y + 18 * BASKET_SCALE}
                targetHeight={58}
              />

              {/* Wooden pidi stool under the resting clay kolsi */}
              <ContactShadow x={KOLSI_REST.x} y={BALAK_POS.y + 2} rx={26} ry={6} opacity={0.3} />
              <GhibliCutout
                file="images/ghibli_ep03/prop_pidi_sketch.png"
                anchor={GHIBLI_ANCHORS.prop_pidi_sketch}
                x={KOLSI_REST.x}
                y={BALAK_POS.y + 2}
                targetHeight={34}
              />

              {pickLeafOp > 0.01 && <PickLeaf opacity={pickLeafOp} />}
              {kolsiRestOp > 0.01 && (
                <g opacity={kolsiRestOp} transform={`translate(${KOLSI_REST.x}, ${KOLSI_REST.y})`}>
                  <KolsiShape />
                </g>
              )}

              <ContactShadow x={eldest.x} y={eldest.y} rx={34 * eldest.s} ry={9 * eldest.s} />
              <g filter="url(#ghibli-char-ink)">
                <Puppet cast={GIRL_A_CAST} f={lifeF} lifeF={lifeF} x={eldest.x} y={eldest.y} scale={eldest.s} acting={ELDEST_ACT} mouth={eldestMouth} talk={eldestTalk} light={SUN} />
              </g>

              {/* Balak's grounded contact shadow + restrained divine light + unchanged SeatedChild */}
              <ContactShadow x={BALAK_POS.x + 8} y={BALAK_POS.y + 4} rx={86} ry={16} opacity={0.28} />
              <GroundGlow level={0.55 + 0.45 * beat} />
              <BirulGlow cx={glowAt.cx} cy={glowAt.cy} r={haloR} glow={glow} f={lifeF} />
              <g filter="url(#ghibli-char-ink)" transform={`translate(0, ${balakBreathY.toFixed(2)})`}>
                <SeatedChild {...balakProps} />
              </g>
            </g>
          </GhibliLayer>
          <GhibliLayer depth={1.22} extraBlur={3.2}>
            <GhibliForegroundBokeh f={lifeF} zoom={cam.zoom} />
          </GhibliLayer>
          <GhibliGrade warmth={0.26} vignette={0.34} bloomAt={[66, 30]} paperOpacity={0.22} />
        </SceneLights.Provider>
      </GhibliStage>
    </div>
  );
};
