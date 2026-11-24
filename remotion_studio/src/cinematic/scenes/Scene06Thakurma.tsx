import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "../audio/Mix";
import { EPISODE_01_SCENES } from "../../data/episode01Data";
import { SceneTiming } from "../../types/studio";
import { clamp, makeActing, noise1, PoseKey, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { BabyThakur, DivineDefs, Motes } from "../divine/Divine";
import { Bokeh, GlowDefs } from "../fx/Fx";
import { CAST } from "../rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeChatter, visemeFromEnvelope } from "../rig/lipsync";
import { BASE_POSE, CastMember, Pose, Puppet, SceneLight, SceneLights } from "../rig/Puppet";
import { CueSubtitles } from "../Scene02Demo";
import { HurricaneLantern } from "../sets/Interiors";
import { KaliMandap } from "../sets/Sacred";
import { ElevenLights, Khat, Offerings, Petals, RoomFloor, RoomWall } from "../sets/S06_Room";

/**
 * Episode 1 · Scene 06 — "Thakurma's Joy".
 * The birth room an hour later. A relative grumbles that the baby has not cried once and the
 * great puja has stopped; the household realises the newborn truly never cried. Thakurma
 * sweeps in, overjoyed: a grandson is a greater joy than any puja — look how calmly he
 * gazes about; eleven children of her own and never such a peaceful arrival; no grand rites
 * or sacrifice today — just offer Ma flowers and bhog with a simple heart.
 * Newborn stays at divine Level 1 (steady soft aura, star catchlight), serene, never crying.
 */

export const SCENE06 = EPISODE_01_SCENES.find((s) => s.sceneId === "06_thakurma_joy")!;

const SHOTS = {
  grumpyA: { from: 0, to: 92 }, // কী অদ্ভুত! এক ঘণ্টা হয়ে গেল, বাচ্চা একবারও কাঁদল না!
  babyA: { from: 86, to: 146 }, // (insert) the calm baby
  grumpyB: { from: 140, to: 232 }, // তার ওপর এত বড় পূজো বন্ধ হয়ে গেল!
  wonder: { from: 226, to: 400 }, // তখনই সবার খেয়াল হলো—… একবারও কাঁদেনি!
  mutter: { from: 394, to: 520 }, // একজন আত্মীয় যখন এ নিয়ে খুঁত ধরতে লাগলেন,
  enter: { from: 514, to: 583 }, // তখন এগিয়ে এলেন বাড়ির ঠাকুরমা।
  thakA: { from: 577, to: 672 }, // আমার ছেলের ঘরে ছেলে হয়েছে—
  grumpyR: { from: 666, to: 718 }, // তাতে এত হইচই কিসের? (reverse on the relative)
  joy: { from: 712, to: 840 }, // আমার নাতি হয়েছে, পূজোর চেয়েও আমার আনন্দ অনেক বেশি!
  point: { from: 834, to: 866 }, // চেয়ে দেখো,
  babyB: { from: 860, to: 990 }, // আমার নাতি কেমন চুপচাপ শুয়ে … এদিক-ওদিক তাকাচ্ছে!
  eleven: { from: 984, to: 1112 }, // আমার এগারোটি সন্তান হয়েছে, এমন শান্ত আগমন …
  mandap: { from: 1106, to: 1190 }, // দ্যাখো, সব আয়োজন তো হয়েই আছে।
  rules: { from: 1184, to: 1282 }, // আজ আর বড় নিয়মকানুন বা বলির দরকার নেই।
  offer: { from: 1276, to: 1403 }, // তোরা শুধু সরল মনে মাকে ফুল আর নৈবেদ্য ভোগ নিবেদন করে আয়।
};
const DIS = 6;

export const SCENE06_CUES = [
  { from: 0, to: 32, who: "আত্মীয়", text: "কী অদ্ভুত!" },
  { from: 42, to: 122, who: "আত্মীয়", text: "এক ঘণ্টা হয়ে গেল, বাচ্চা একবারও কাঁদল না!" },
  { from: 145, to: 222, who: "আত্মীয়", text: "তার ওপর এত বড় পূজো বন্ধ হয়ে গেল!" },
  { from: 230, to: 313, who: "কথক", text: "তখনই সবার খেয়াল হলো—" },
  { from: 319, to: 380, who: "কথক", text: "জন্মের পর থেকে শিশুটি একবারও কাঁদেনি!" },
  { from: 399, to: 515, who: "কথক", text: "একজন আত্মীয় যখন এ নিয়ে খুঁত ধরতে লাগলেন," },
  { from: 518, to: 562, who: "কথক", text: "তখন এগিয়ে এলেন বাড়ির ঠাকুরমা।" },
  { from: 583, to: 660, who: "ঠাকুরমা", text: "আমার ছেলের ঘরে ছেলে হয়েছে—" },
  { from: 670, to: 710, who: "ঠাকুরমা", text: "তাতে এত হইচই কিসের?" },
  { from: 721, to: 825, who: "ঠাকুরমা", text: "আমার নাতি হয়েছে, পূজোর চেয়েও আমার আনন্দ অনেক বেশি!" },
  { from: 838, to: 860, who: "ঠাকুরমা", text: "চেয়ে দেখো," },
  { from: 862, to: 983, who: "ঠাকুরমা", text: "আমার নাতি কেমন চুপচাপ শুয়ে বুদ্ধিমানের মতো এদিক-ওদিক তাকাচ্ছে!" },
  { from: 988, to: 1032, who: "ঠাকুরমা", text: "আমার এগারোটি সন্তান হয়েছে," },
  { from: 1036, to: 1103, who: "ঠাকুরমা", text: "এমন শান্ত আগমন আমি কখনো দেখিনি!" },
  { from: 1119, to: 1180, who: "ঠাকুরমা", text: "দ্যাখো, সব আয়োজন তো হয়েই আছে।" },
  { from: 1192, to: 1265, who: "ঠাকুরমা", text: "আজ আর বড় নিয়মকানুন বা বলির দরকার নেই।" },
  { from: 1281, to: 1395, who: "ঠাকুরমা", text: "তোরা শুধু সরল মনে মাকে ফুল আর নৈবেদ্য ভোগ নিবেদন করে আয়।" },
];

/* ---------------- cast (local to this scene) ---------------- */

const skinWarm = { skin: "#d9a07a", skinLight: "#f0c4a0", skinShade: "#b47853", lips: "#b0605a" };
const skinFair = { skin: "#e4b18c", skinLight: "#f6d2b2", skinShade: "#c48d68", lips: "#bb6a63" };

/** Thakurma — the matriarch; widow's white thaan (no border), white hair, strong and joyful. */
const THAKURMA: CastMember = {
  id: "thakurma",
  age: "elder",
  sex: "f",
  height: 0.93,
  girth: 1.04,
  ...skinFair,
  hair: "#e8e4dc",
  hairLight: "#ffffff",
  hairStyle: "veil",
  outfit: "blouse",
  top: "#f4efe4",
  topLight: "#ffffff",
  topShade: "#d6ccb8",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#f7f2e8",
  lowerShade: "#d9cfbd",
  scarf: { color: "#f7f2e8", shade: "#d6ccb8", style: "drape" },
  face: { faceLen: 1.0, jaw: 0.8 },
  seed: 161,
};

/** The grumbling relative (pishemoshai): spectacles, grey moustache, check shawl. */
const GRUMPY: CastMember = {
  id: "grumpy",
  age: "elder",
  sex: "m",
  height: 1.0,
  girth: 1.12,
  ...skinWarm,
  hair: "#8a8580",
  hairLight: "#c8c2b8",
  hairStyle: "balding",
  outfit: "kurta",
  top: "#c9b48a",
  topLight: "#e0cfa6",
  topShade: "#9a8460",
  sleeve: "full",
  lower: "dhoti",
  lowerColor: "#f3ecdc",
  lowerShade: "#d2c6ae",
  dhotiLength: "calf",
  scarf: { color: "#6a4a3a", shade: "#4a3226", trim: "#c9932e", style: "check" },
  mustache: "#8a8580",
  glasses: true,
  seed: 173,
};

/* ---------------- staging constants (world coords) ---------------- */

const GRUMPY_X = 300;
const THAK_X = 640;
const BABY = { x: 930, y: 772 };
const ENTER = 500;

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

const voice = (scene: SceneTiming, file: string, seed: number) => {
  const clip = scene.clips.find((c) => c.file === file);
  return {
    mouth: (fr: number): MouthState => (clip ? visemeFromEnvelope(clip.rmsEnvelope, fr - clip.offsetFrame, seed, clip.subtitleBn) : MOUTH_REST),
    talk: (fr: number) => (clip ? speechLevel(clip.rmsEnvelope, fr - clip.offsetFrame) : 0),
  };
};

/* ---------------- acting (continuous across all shots) ---------------- */

const grumpyKeys = A([
  { f: 0, bodyTurn: 0.3, headTurn: 0.35, eyeX: 0.5, brow: -0.3, browTilt: -0.6, smile: 0, lean: 3, rS: 8, rE: -20, lS: 8, lE: -20, rHand: "relaxed", lHand: "relaxed" },
  { f: 8, rS: 38, rE: 55, lS: 38, lE: 55, rHand: "open", lHand: "open", headTilt: 6, brow: 0.4, browTilt: -0.2, in: 8, ease: "out" },
  { f: 42, rS: 18, rE: 10, lS: 12, lE: -20, rHand: "relaxed", lHand: "relaxed", headTurn: 0.25, eyeX: 0.7, eyeY: -0.6, headNod: -4, brow: 0.1, in: 10 },
  { f: 80, bodyTurn: 0.5, headTurn: 0.6, eyeX: 0.8, eyeY: 0.45, headNod: 2, rS: 70, rE: 15, rHand: "point", brow: -0.3, browTilt: -0.7, in: 10 },
  { f: 145, bodyTurn: -0.15, headTurn: -0.5, eyeX: -0.7, eyeY: -0.8, lS: 85, lE: 25, lHand: "open", rS: 10, rE: -30, rHand: "relaxed", brow: -0.1, in: 14 },
  { f: 196, lS: 30, lE: -10, brow: -0.5, browTilt: -0.7, headNod: 4, in: 16 },
  { f: 250, bodyTurn: 0.3, headTurn: 0.45, eyeX: 0.6, eyeY: 0.3, rS: -18, rE: -115, lS: -18, lE: -115, rHand: "relaxed", lHand: "relaxed", brow: -0.4, headNod: 0, in: 22 },
  { f: 400, rS: 50, rE: 60, rHand: "point", lS: 6, lE: -30, headTurn: 0.6, eyeX: 0.9, brow: -0.5, browTilt: -0.8, in: 12 },
  { f: 515, bodyTurn: -0.4, headTurn: -0.7, eyeX: -0.9, eyeY: 0, rS: 8, rE: -25, rHand: "relaxed", brow: 0.45, browTilt: 0.2, in: 10, ease: "out" },
  { f: 586, bodyTurn: 0.35, headTurn: 0.5, eyeX: 0.8, brow: 0.5, in: 12 },
  { f: 680, headNod: 9, lid: 0.35, eyeX: 0.2, eyeY: 0.6, brow: 0.3, browTilt: 0.6, rS: -14, rE: -60, lS: -14, lE: -60, in: 16 },
  { f: 1040, headNod: 4, lid: 0.1, smile: 0.35, brow: 0.2, browTilt: 0.2, eyeX: 0.5, eyeY: 0.4, in: 30 },
  { f: 1200, headNod: 7, smile: 0.45, in: 14 },
  { f: 1230, headNod: 2, in: 14 },
]);
const grumpyAct = (fr: number): Partial<Pose> => {
  const p = grumpyKeys(fr);
  const shake = fr > 196 && fr < 230 ? Math.sin(fr * 0.5) * 0.12 : 0;
  const wag = fr > 404 && fr < 512 ? Math.sin(fr * 0.6) * 14 : 0;
  return { ...p, headTurn: (p.headTurn ?? 0) + shake, rE: (p.rE ?? 0) + wag, bodyX: noise1(fr * 0.01, 3) * 3 };
};

const thakKeys = A([
  { f: 0, bodyX: -1100, bodyTurn: 0.65, stride: 0, smile: 0.6, brow: 0.3 },
  { f: ENTER, bodyX: -830, stride: 0.75, bodyTurn: 0.65, headTurn: 0.3, eyeX: 0.4, smile: 0.7, brow: 0.35, rS: 6, rE: -25, lS: 6, lE: -25 },
  { f: 576, bodyX: 0, stride: 0.75, headTurn: -0.2, eyeX: -0.5, ease: "linear", in: 76 },
  { f: 588, stride: 0, bodyTurn: -0.35, headTurn: -0.45, eyeX: -0.7, in: 12, ease: "out" },
  // আমার ছেলের ঘরে ছেলে হয়েছে— (to the relative, at her left)
  { f: 594, rS: -10, rE: -118, rHand: "open", lS: 30, lE: 20, lHand: "open", headTilt: 5, headTurn: -0.45, eyeX: -0.7, smile: 0.75, brow: 0.5, in: 10 },
  // তাতে এত হইচই কিসের?
  { f: 672, rS: 45, rE: 60, lS: 45, lE: 60, rHand: "open", lHand: "open", headTilt: -6, headTurn: -0.55, eyeX: -0.8, brow: 0.75, browTilt: 0.25, smile: 0.6, in: 10 },
  // আমার নাতি হয়েছে — arms open in joy
  { f: 723, rS: 112, rE: 40, lS: 112, lE: 40, headNod: -5, smile: 1, lid: 0.3, brow: 0.6, browTilt: 0, headTurn: -0.2, eyeX: -0.2, in: 10, ease: "backOut" },
  // … আনন্দ অনেক বেশি — hands to the heart
  { f: 772, rS: -12, rE: -125, lS: -12, lE: -125, headTilt: 8, lid: 0.35, in: 14 },
  // চেয়ে দেখো — points to the baby
  { f: 838, bodyTurn: 0.55, rS: 72, rE: 12, rHand: "point", lS: 8, lE: -30, lHand: "relaxed", headTilt: 0, headTurn: 0.7, eyeX: 0.9, eyeY: 0.5, lid: 0, smile: 0.9, in: 8 },
  { f: 880, rS: 20, rE: -40, rHand: "relaxed", headTilt: 6, eyeY: 0.6, in: 20 },
  // আমার এগারোটি সন্তান — remembering, a hand raised counting
  { f: 988, bodyTurn: 0.25, lS: 62, lE: 75, lHand: "open", headTurn: 0.1, eyeX: -0.3, eyeY: -0.55, smile: 0.6, lid: 0.2, headTilt: -4, in: 12 },
  // এমন শান্ত আগমন… — hand on heart, wondering head-shake toward the baby
  { f: 1036, rS: -12, rE: -125, lS: 10, lE: -30, lHand: "relaxed", headTurn: 0.6, eyeX: 0.8, eyeY: 0.45, brow: 0.6, browTilt: 0.4, smile: 0.85, headTilt: 4, lid: 0, in: 14 },
  // দ্যাখো, সব আয়োজন… — gestures out toward the mandap (window behind-left)
  { f: 1118, bodyTurn: 0.1, lS: 82, lE: 30, lHand: "open", rS: 8, rE: -30, headTurn: -0.45, eyeX: -0.8, eyeY: -0.2, brow: 0.4, browTilt: 0, smile: 0.6, in: 12 },
  // আজ আর বড় নিয়মকানুন বা বলির দরকার নেই — calm palm-down "no need"
  { f: 1192, bodyTurn: 0.4, lS: 8, lE: -30, lHand: "relaxed", rS: 45, rE: 12, rHand: "open", headTurn: 0.4, eyeX: 0.7, eyeY: 0.1, brow: 0.25, smile: 0.45, in: 12 },
  // তোরা শুধু সরল মনে … নিবেদন করে আয় — cupped offering, then pranam
  { f: 1282, rS: 35, rE: 70, lS: 35, lE: 70, rHand: "cup", lHand: "cup", headTilt: -4, eyeY: -0.45, eyeX: 0.2, smile: 0.8, in: 14 },
  { f: 1345, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", lid: 0.5, headNod: 5, smile: 0.7, in: 18 },
]);
const thakAct = (fr: number): Partial<Pose> => {
  const p = thakKeys(fr);
  const wonder = fr > 1040 && fr < 1100 ? Math.sin((fr - 1040) * 0.2) * 0.14 : 0;
  const noNeed = fr > 1196 && fr < 1262 ? Math.sin((fr - 1196) * 0.32) * 10 : 0;
  const shake = fr > 1196 && fr < 1262 ? Math.sin((fr - 1196) * 0.16) * 0.1 : 0;
  const joyBounce = fr > 723 && fr < 770 ? Math.abs(Math.sin(fr * 0.35)) * 3 : 0;
  return { ...p, headTurn: (p.headTurn ?? 0) + wonder + shake, rS: (p.rS ?? 0) + noNeed, headNod: (p.headNod ?? 0) - joyBounce };
};

const manoramaAct = A([
  { f: 0, bodyTurn: -0.35, headTurn: -0.4, eyeX: -0.6, eyeY: 0.3, smile: 0.55, brow: 0.25, rS: 6, rE: -30, lS: 6, lE: -30 },
  { f: 150, headTurn: -0.55, eyeX: -0.8, eyeY: 0, brow: -0.1, browTilt: 0.3, smile: 0.2, in: 16 },
  { f: 300, headTurn: -0.3, eyeX: -0.5, eyeY: 0.6, rS: -14, rE: -168, rHand: "open", brow: 0.7, browTilt: 0.3, smile: 0.4, in: 14 },
  { f: 360, rS: 6, rE: -40, rHand: "relaxed", smile: 0.8, in: 20 },
  { f: 420, headTurn: -0.55, eyeX: -0.9, eyeY: 0, brow: 0.1, browTilt: 0.4, smile: 0.3, in: 14 },
  { f: 520, headTurn: -0.75, eyeX: -1, smile: 0.7, brow: 0.4, in: 14 },
  { f: 724, smile: 1, lid: 0.3, in: 12 },
  { f: 850, headTurn: -0.35, eyeX: -0.5, eyeY: 0.6, lid: 0, smile: 0.9, in: 16 },
  { f: 1200, headNod: 6, in: 10 },
  { f: 1222, headNod: 0, in: 12 },
  { f: 1300, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", lid: 0.4, in: 20 },
]);
const womanAAct = A([
  { f: 0, bodyTurn: -0.45, headTurn: -0.5, eyeX: -0.7, eyeY: 0.3, smile: 0.4, rS: 6, rE: -30, lS: 6, lE: -30 },
  { f: 318, rS: -10, rE: -125, rHand: "open", brow: 0.6, smile: 0.6, eyeY: 0.6, in: 14 },
  { f: 420, headTurn: -0.65, eyeX: -0.9, eyeY: 0, brow: 0.2, browTilt: 0.5, smile: 0.2, rS: 6, rE: -30, in: 16 },
  { f: 524, headTurn: -0.75, smile: 0.7, in: 14 },
  { f: 726, smile: 1, lid: 0.3, headTilt: 6, in: 12 },
]);
const charuAct = A([
  { f: 0, bodyTurn: -0.5, headTurn: -0.55, eyeX: -0.7, eyeY: 0.65, headTilt: 7, smile: 0.7, lid: 0.25, brow: 0.3, rS: -6, rE: -40, lS: 10, lE: -50 },
  { f: 150, smile: 0.35, browTilt: 0.4, in: 20 },
  { f: 320, rS: -12, rE: -160, rHand: "open", smile: 0.8, lid: 0.15, tears: 0.3, in: 16 },
  { f: 420, rS: -6, rE: -40, rHand: "relaxed", smile: 0.4, eyeX: -0.9, eyeY: 0, headTurn: -0.7, in: 16 },
  { f: 590, headTurn: -0.8, eyeX: -1, smile: 0.8, in: 14 },
  { f: 860, headTurn: -0.5, eyeX: -0.6, eyeY: 0.65, smile: 0.9, tears: 0.2, in: 16 },
]);

/** Newborn: lying on his back, calm; "এদিক-ওদিক তাকাচ্ছে" — slow, wise looks left and right. */
const babyLook = (f: number) => ({
  lookX: track(f, [
    [0, 0.2],
    [90, -0.35],
    [140, 0.3],
    [600, -0.6],
    [860, -0.4],
    [882, -0.85, "inOut"],
    [906, -0.85],
    [924, 0.8, "inOut"],
    [950, 0.8],
    [966, -0.1, "inOut"],
    [1040, -0.6],
    [1300, -0.3],
  ]),
  lookY: track(f, [
    [0, 0],
    [860, -0.1],
    [900, 0.15],
    [940, -0.25],
    [1000, 0],
  ]),
  turn: track(f, [
    [0, 0.05],
    [860, -0.1],
    [882, -0.3, "inOut"],
    [906, -0.3],
    [924, 0.3, "inOut"],
    [950, 0.3],
    [966, 0, "inOut"],
  ]),
});

/* ---------------- the room (all characters live here; shots only move the camera) ---------------- */

const Room: React.FC<{ f: number; scene: SceneTiming; mandap?: number; extra?: React.ReactNode; front?: React.ReactNode }> = ({ f, scene, mandap = 0.35, extra, front }) => {
  const g = voice(scene, "06a_Grumpy.wav", 61);
  const t = voice(scene, "06c_Thakurma.wav", 67);
  const grumpyMouth = (fr: number) => (fr < 230 ? g.mouth(fr) : fr > 402 && fr < 512 ? visemeChatter(fr, 5, 0.6) : MOUTH_REST);
  const look = babyLook(f);
  const clockSpin = interpolate(f, [44, 104], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const doorLight = clamp((f - (ENTER - 30)) / 30) * clamp((640 - f) / 60 + 0.4);
  return (
    <>
      <Layer depth={0.6}>
        <GlowDefs />
        <RoomWall f={f} mandap={mandap} clockSpin={clockSpin} doorLight={doorLight} />
      </Layer>
      <Layer depth={0.85}>
        <GlowDefs />
        <Puppet cast={CAST.womanA} f={f} x={1720} y={930} scale={1.32} acting={womanAAct} />
        <Puppet cast={CAST.manorama} f={f} x={1480} y={950} scale={1.38} acting={manoramaAct} />
      </Layer>
      <Layer depth={1}>
        <GlowDefs />
        <DivineDefs />
        <RoomFloor />
        <Khat x={960} />
        {extra}
        <BabyThakur f={f} x={BABY.x} y={BABY.y} s={1.15} open={1} aura={1} headRoll={-48} lookX={look.lookX} lookY={look.lookY} turn={look.turn} smile={0.6} wiggle={0.8} />
        <Puppet cast={CAST.charu} f={f} x={1230} y={806} scale={1.28} seated acting={charuAct} stillness={0.4} />
        <Puppet cast={GRUMPY} f={f} x={GRUMPY_X} y={1010} scale={1.45} acting={grumpyAct} mouth={grumpyMouth} talk={g.talk} />
        {f > ENTER - 4 && <Puppet cast={THAKURMA} f={f} x={THAK_X} y={1012} scale={1.42} acting={thakAct} mouth={t.mouth} talk={t.talk} />}
      </Layer>
      <Layer depth={1.2}>
        <GlowDefs />
        <HurricaneLantern x={1180} y={-60} f={f} s={1.1} />
      </Layer>
      <Layer depth={1.3} blend="screen">
        <Bokeh f={f} n={10} seed={66} />
      </Layer>
      {front}
    </>
  );
};

/** Lights of the room: the lantern, the niche lamp, the baby's soft white-gold glow, the door spill. */
const roomLights = (f: number): SceneLight[] => [
  { x: 1180, y: 60, color: "#ffcf87", intensity: 0.9, radius: 1500, flicker: 5 },
  { x: 1500, y: 520, color: "#ffb04a", intensity: 0.45, radius: 700, flicker: 11 },
  { x: BABY.x - 50, y: BABY.y - 20, color: "#FFF4D6", intensity: 0.55, radius: 650 },
  { x: -190, y: 560, color: "#ffc070", intensity: 0.8 * clamp((f - ENTER + 30) / 30), radius: 900, flicker: 9 },
];

/** cam that centres world point (tx, ty) at depth 1 */
const C = (tx: number, ty: number) => [tx - 960, ty - 540] as const;

type CamKey = [number, number, number, number]; // frame, tx, ty, zoom
const camFrom = (f: number, keys: CamKey[], dof = 2.4) => ({
  x: track(f, keys.map(([fr, tx]) => [fr, C(tx, 0)[0]] as [number, number])),
  y: track(f, keys.map(([fr, , ty]) => [fr, C(0, ty)[1]] as [number, number])),
  zoom: track(f, keys.map(([fr, , , z]) => [fr, z] as [number, number])),
  focus: 1,
  dof,
});

/* ---------------- shots ---------------- */

type ShotProps = { scene: SceneTiming };

const RoomShot: React.FC<
  ShotProps & { k: keyof typeof SHOTS; keys: CamKey[]; grade?: Partial<{ warmth: number; vignette: number; bloomAt: [number, number] }>; mandap?: number | ((f: number) => number); extra?: (f: number) => React.ReactNode; front?: (f: number) => React.ReactNode; last?: boolean }
> = ({ scene, k, keys, grade, mandap, extra, front, last }) => {
  const f = useCurrentFrame() + SHOTS[k].from;
  const cam = camFrom(f, keys);
  const o = clamp((f - SHOTS[k].from) / DIS) * (last ? clamp((SHOTS[k].to - f) / 14) : 1);
  return (
    <Stage cam={cam} opacity={SHOTS[k].from === 0 ? clamp(f / 10) : o}>
      <SceneLights.Provider value={roomLights(f)}>
        <Room f={f} scene={scene} mandap={typeof mandap === "function" ? mandap(f) : mandap} extra={extra?.(f)} front={front?.(f)} />
        <Grade warmth={grade?.warmth ?? 0.42} vignette={grade?.vignette ?? 0.6} bloomAt={grade?.bloomAt ?? [55, 55]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/** Mandap insert: everything is ready for the puja; the Presence glows quietly. */
const ShotMandap: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.mandap.from;
  const cam = camFrom(f, [
    [1106, 760, 640, 1.45],
    [1190, 1160, 620, 1.55],
  ]);
  const SHOT_LIGHTS: SceneLight[] = [{ x: 950, y: 430, color: "#ff8a3c", intensity: 0.9, radius: 1600, flicker: 7 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.mandap.from) / DIS)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.8}>
          <GlowDefs />
          <KaliMandap f={f} presence={0.55} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <rect x={-400} y={860} width={2720} height={600} fill="#2a110c" />
          <Offerings f={f} />
        </Layer>
        <Layer depth={1.3} blend="screen">
          <Bokeh f={f} n={12} seed={67} />
        </Layer>
        <Grade warmth={0.36} vignette={0.62} bloomAt={[50, 40]} />
      </SceneLights.Provider>
    </Stage>
  );
};

const babyMotes = (f: number) => <Motes f={f} x={BABY.x - 60} y={BABY.y - 40} n={8} spread={120} rise={-90} seed={6} o={0.7} />;

/* ================================================================== */

export const Scene06Thakurma: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const seq = (k: keyof typeof SHOTS, el: React.ReactNode, last = false) => (
    <Sequence from={SHOTS[k].from} durationInFrames={SHOTS[k].to - SHOTS[k].from + (last ? 0 : DIS)} layout="none">
      {el}
    </Sequence>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
      {/* the relative grumbles (MCU), the calm baby (insert), the stopped puja (window) */}
      {seq("grumpyA", <RoomShot scene={scene} k="grumpyA" keys={[[0, 440, 560, 1.9], [92, 460, 560, 2.0]]} />)}
      {seq("babyA", <RoomShot scene={scene} k="babyA" keys={[[86, 900, 760, 3.0], [146, 905, 760, 3.15]]} extra={babyMotes} grade={{ bloomAt: [45, 55] }} />)}
      {seq("grumpyB", <RoomShot scene={scene} k="grumpyB" keys={[[140, 380, 500, 1.55], [232, 360, 500, 1.6]]} mandap={(f) => track(f, [[140, 0.85], [168, 0.85], [200, 0.12, "inOut"]])} />)}
      {/* the whole household realises */}
      {seq("wonder", <RoomShot scene={scene} k="wonder" keys={[[226, 980, 600, 1.05], [320, 980, 620, 1.18], [400, 960, 640, 1.26]]} extra={babyMotes} />)}
      {seq("mutter", <RoomShot scene={scene} k="mutter" keys={[[394, 600, 600, 1.55], [520, 580, 600, 1.6]]} />)}
      {/* Thakurma sweeps in from the dalan */}
      {seq("enter", <RoomShot scene={scene} k="enter" keys={[[500, 220, 600, 1.3], [583, 470, 600, 1.4]]} />)}
      {seq("thakA", <RoomShot scene={scene} k="thakA" keys={[[577, 600, 560, 2.0], [672, 610, 560, 2.1]]} />)}
      {seq("grumpyR", <RoomShot scene={scene} k="grumpyR" keys={[[666, 340, 540, 2.1], [718, 340, 540, 2.15]]} />)}
      {seq(
        "joy",
        <RoomShot
          scene={scene}
          k="joy"
          keys={[[712, 520, 570, 1.7], [840, 560, 560, 1.85]]}
          front={(f) => (
            <Layer depth={1.05} blend="screen">
              <Motes f={f} x={THAK_X} y={560} n={10} spread={260} rise={-120} seed={21} o={clamp((f - 724) / 12) * 0.6} />
            </Layer>
          )}
        />,
      )}
      {seq("point", <RoomShot scene={scene} k="point" keys={[[834, 790, 640, 1.5], [866, 800, 650, 1.55]]} />)}
      {seq("babyB", <RoomShot scene={scene} k="babyB" keys={[[860, 905, 755, 3.1], [990, 900, 760, 3.35]]} extra={babyMotes} grade={{ bloomAt: [45, 55] }} />)}
      {seq(
        "eleven",
        <RoomShot
          scene={scene}
          k="eleven"
          keys={[[984, 620, 560, 1.85], [1112, 640, 560, 2.05]]}
          front={(f) => (
            <Layer depth={0.95}>
              <ElevenLights f={f} start={990} gap={3.6} x={THAK_X + 70} y={600} r={250} o={clamp((1046 - f) / 16)} />
            </Layer>
          )}
        />,
      )}
      {seq("mandap", <ShotMandap />)}
      {seq("rules", <RoomShot scene={scene} k="rules" keys={[[1184, 800, 580, 1.5], [1282, 820, 590, 1.55]]} />)}
      {seq(
        "offer",
        <RoomShot
          scene={scene}
          k="offer"
          keys={[[1276, 760, 600, 1.4], [1403, 900, 620, 1.12]]}
          mandap={(f) => track(f, [[1276, 0.2], [1360, 0.8, "inOut"]])}
          front={(f) => (
            <Layer depth={1.25}>
              <Petals f={f} start={1300} n={30} dir={-1} />
            </Layer>
          )}
          last
        />,
        true,
      )}
    </div>
  );
};

/** Sound bed (no voices): crickets; warm family flute rises when Thakurma enters; soft shimmers on the baby. */
export const Scene06SoundBed: React.FC<{ scene: SceneTiming }> = () => (
  <>
    <Audio src={staticFile("audio/ambient/bengal_night_crickets.wav")} loop volume={(fr) => interpolate(fr, [0, 20, 1360, 1403], [0, 0.14, 0.14, 0], { extrapolateRight: "clamp" })} />
    <Sequence from={ENTER - 10} durationInFrames={1403 - ENTER + 10} layout="none">
      <Audio
        src={staticFile("audio/music/Warm_Family_Flute.wav")}
        loop
        volume={(fr) => interpolate(fr, [0, 40, 200, 300, 840, 889], [0, 0.12, 0.2, 0.15, 0.16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    </Sequence>
    {[92, 866].map((at) => (
      <Sequence key={at} from={at} durationInFrames={110} layout="none">
        <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={0.18} />
      </Sequence>
    ))}
    <Sequence from={990} durationInFrames={60} layout="none">
      <Audio src={staticFile("audio/sfx/chime_pop.wav")} volume={0.12} />
    </Sequence>
  </>
);

export const Scene06Demo: React.FC = () => {
  const scene = SCENE06;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene06Thakurma scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
        <Scene06SoundBed scene={scene} />
      </DuckProvider>
      <CueSubtitles cues={SCENE06_CUES} />
    </div>
  );
};
