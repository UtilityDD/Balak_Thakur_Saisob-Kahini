import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { blink, clamp, flicker, hash, lerp, makeActing, noise1, PoseKey } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { BabyThakur, DivineDefs } from "../../cinematic/divine/Divine";
import { Bokeh, Flame, Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { CAST } from "../../cinematic/rig/cast";
import { bnSyllables, MOUTH_REST, MouthState } from "../../cinematic/rig/lipsync";
import { BASE_POSE, CastMember, Pose, Puppet, SceneLight, SceneLights } from "../../cinematic/rig/Puppet";
import { absToStory, clipSpan, cueLocalStory, pausesFor, storyFrame, storyToReal, useStory } from "../../episode/storyClock";
import { EP02_CUES } from "../subtitles";
import { EP02_BREATHS, EP02_SCENES } from "../timing";

/**
 * Episode 2 · scene 01d2_shashthi_hands_miracle: "the baby's hands and the rain".
 *
 * Inside a room of the Baidik Bari on the rainy Shashthi morning (same warm plaster room as the birth-ward
 * scenes, with two barred windows full of the slate monsoon outside). The Shashthi arrangements wait unused:
 * three asans for the Brahmins, brass plates of sweets and fruit, flowers, the Shashthi ghot, a lit pradip on
 * its brass stand and a white alpana on the floor. The newborn Balak lies on a kantha on a low cot under the
 * big window; Charu sits beside him (she does not lift him). Thakurma sits just past the foot of the cot, by the big
 * window; Surendra and a woman of the household are by the other window (she calls them over: "এদিকে এসে দ্যাখ").
 *
 * Clocks (CAM-14 pauses, src/episode/storyClock.ts): f = story clock (holds in the pauses): poses, lip sync, the
 * hands and the rain INTENSITY. lf = real clock: breathing and blinks (rigs' lifeF), rain streak motion, splashes,
 * mist and gusts, the camera, the flash and the sounds. Voice clips are found with clipSpan (they are cut in parts).
 *
 * THE MIRACLE: one hand-motion curve (handMotion) drives the baby's `wave` (and a slow `bless` lift for the
 * last gesture). rainIntensity(f) is computed from that curve with a short eased lag (weighted average of the
 * previous 1-6 frames) and drives everything wet: streak density, speed, length and opacity, the water curtain
 * off the eaves, the splashes on the sills, the gusts in the trees and shutters, the mist, the room light (dimmer
 * and cooler when heavy) and the rain loops' volume (read through the pauses with rainIntensityReal).
 *
 * Shots (CAM-13, approved shot list; keyed to the subtitle cues, see SHOTS): 1 held wide, one slow push along the
 * asans on "সব আয়োজন" | 2 the big window pouring, cot below, Thakurma at the right (P1) | 3 the relatives by the other
 * window | 4 Thakurma close, 7 f before "ওরে তোরা" | 5-6 MATCH on "খোকা", held through the waving, P2 and the
 * stopping | 7 Thakurma close 7 f before "এ কি মানুষের কাজ রে!", one slow push (P3) | 8-9 Surendra close, 7 f
 * before his line | 10 MATCH, the slow gesture | end: warm two-shot of Charu and the baby (the breath holds here).
 *
 * Divine rules: the light is Balak's only (BabyThakur's restrained halo, rim and motes), brightening gently
 * only on the surge and on Surendra's line. No jewellery, tilak or thread; curly dark hair (BabyThakur).
 * Nobody but Charu touches him, and nobody lifts him in this scene. Feet stay planted (no stepping).
 */

/* ------------------------------------------------------------------ */
/* Timing from the episode data                                        */
/* ------------------------------------------------------------------ */

const SCENE_ID = "01d2_shashthi_hands_miracle";
const SCENE = EP02_SCENES.find((s) => s.sceneId === SCENE_ID);
const SCENE_START = SCENE?.startFrame ?? 1929;
/** Real (played) length of the scene, pauses included. */
const SCENE_FRAMES = SCENE?.durationFrames ?? 1161;
/**
 * The scene's held moments (CAM-14, EP02_PAUSES; story clock src/episode/storyClock.ts). Story frames hold at atStory
 * while the real (life) clock runs on. Approved plan (Ep02_Shots_and_Pauses_DRAFT.md, Scene 01d2):
 *   P1 after "...এক ফোঁটা বৃষ্টিও থামছে না!" (36 f): hold on the pouring window; Thakurma sighs and looks out at it.
 *   P2 after Thakurma's "...মুষলধারে বাড়ছে!" (24 f): the MATCH shot holds, his hands still wave hard, the heaviest
 *      downpour, one soft flash and a thunder roll; at the frame edge Thakurma's eyes go baby -> window -> baby.
 *   P3 after "এ কি মানুষের কাজ রে!" (48 f): her close-up holds, eyes wet, she turns to Surendra; the rain is a
 *      drizzle; the baby's glow brightens gently behind her.
 */
const PAUSES = pausesFor(SCENE_ID);
const PAUSE_AT = (i: number, fallback: number) => PAUSES[i]?.atStory ?? fallback;
const P1_AT = PAUSE_AT(0, 278);
const P2_AT = PAUSE_AT(1, 648);
const P3_AT = PAUSE_AT(2, 767);
/** Story length of the scene (the authored timing, pauses removed). */
const SCENE_STORY_FRAMES = storyFrame(SCENE_FRAMES, PAUSES);
/** Real local frame where pause i begins / ends. */
const pauseRealStart = (i: number) => (PAUSES[i] ? storyToReal(PAUSES[i].atStory, PAUSES) : -9999);
const pauseRealEnd = (i: number) => (PAUSES[i] ? pauseRealStart(i) + PAUSES[i].frames : -9999);
/**
 * Real local frame of a story frame. A story frame equal to a pause's atStory plays both before and after that pause;
 * `after` picks the end of the pause (for a cut on the line that follows it).
 */
const realOf = (story: number, after = false) => {
  const p = PAUSES.find((q) => q.atStory === story);
  return storyToReal(story, PAUSES) + (after && p ? p.frames : 0);
};
/** The breath after the scene's last line starts here (real local); the scene holds on the calm room to the end. */
const BREATH_AT = (() => {
  const b = EP02_BREATHS.find((x) => x.after === SCENE_ID);
  return b ? b.startFrame - SCENE_START : SCENE_FRAMES - 36;
})();

interface Phrase {
  from: number;
  to: number;
  text: string;
}
interface Clip {
  from: number;
  to: number;
  phrases: Phrase[];
}

/**
 * A voice clip in STORY frames (scene-local, authored timing) with its subtitle phrases (speaker-filtered, clamped to
 * the clip). clipSpan finds the clip even when the timing generator has cut it into parts around a pause, and the
 * phrases are converted to story frames, so lip sync and beats stay on the voice through the pauses.
 */
const clipOf = (file: string, speaker: string, fallback: Phrase[]): Clip => {
  const span = clipSpan(file);
  if (!span) return { from: fallback[0].from, to: fallback[fallback.length - 1].to, phrases: fallback };
  const from = absToStory(span.startFrame, SCENE_ID);
  const to = absToStory(span.endFrame, SCENE_ID);
  const phrases = EP02_CUES.filter((c) => c.speaker === speaker && c.to > span.startFrame && c.from < span.endFrame).map((c) => ({
    from: Math.max(from, absToStory(c.from, SCENE_ID)),
    to: Math.min(to, absToStory(c.to, SCENE_ID)),
    text: c.text,
  }));
  return { from, to, phrases: phrases.length ? phrases : [{ from, to, text: "" }] };
};
/** The real (played) windows of a voice clip's parts, scene-local: the rain ducks under the voices, not the pauses. */
const voicePartsReal = (file: string): [number, number][] =>
  (clipSpan(file)?.parts ?? []).map((p) => [p.startFrame - SCENE_START, p.startFrame - SCENE_START + p.frames]);

const NARR = clipOf("01d2a_Narrator_Inside.wav", "", [
  { from: 14, to: 105, text: "" },
  { from: 105, to: 195, text: "" },
  { from: 195, to: 274, text: "" },
  { from: 274, to: 354, text: "" },
  { from: 354, to: 415, text: "" },
]);
const THAK = clipOf("01d2b_Thakurma_Rain.wav", "ঠাকুরমা", [
  { from: 427, to: 483, text: "" },
  { from: 483, to: 567, text: "" },
  { from: 567, to: 646, text: "" },
  { from: 646, to: 720, text: "" },
  { from: 720, to: 766, text: "" },
]);
const SURE = clipOf("01d2c_Surendra_Awe.wav", "সুরেন্দ্রচন্দ্র", [
  { from: 780, to: 823, text: "" },
  { from: 823, to: 912, text: "" },
  { from: 912, to: 998, text: "" },
]);

/** Phrase start i of a clip, falling back to a fraction of the clip when the cue count differs. */
const cueAt = (c: Clip, i: number, frac: number) => (c.phrases[i] ? c.phrases[i].from : Math.round(lerp(c.from, c.to, frac)));

/** A subtitle phrase's start in story frames (CAM-13: beats follow the narration), else the clip-based fallback. */
const cueS = (snippet: string, fallback: number) => cueLocalStory(snippet, SCENE_ID)?.from ?? fallback;

// Narration beats (story frames)
const N_FIRST = cueS("গ্রামের ব্রাহ্মণরা", NARR.from); // "গ্রামের ব্রাহ্মণরা নবজাতককে পায়ের"
const N_ARR = cueS("ধুলো দিতে", cueAt(NARR, 1, 0.23)); // "ধুলো দিতে আসবেন বলে সব আয়োজন ছিল—"
const N_ARR_END = cueLocalStory("ধুলো দিতে", SCENE_ID)?.to ?? N_ARR + 91;
/** "সব আয়োজন" inside that phrase: about 9 of its 16 syllables in. */
const N_SOB = Math.round(lerp(N_ARR, N_ARR_END, 0.56));
const N_RAIN = cueS("এক ফোঁটা বৃষ্টিও", cueAt(NARR, 2, 0.45)); // "অথচ এক ফোঁটা বৃষ্টিও থামছে না!"
const N_REL = cueS("আত্মীয়রা", cueAt(NARR, 3, 0.65)); // "আর ঘরের ভেতর আত্মীয়রা হঠাৎ এক"
const N_ODD = cueS("অদ্ভুত কাণ্ড", cueAt(NARR, 4, 0.85)); // "অদ্ভুত কাণ্ড দেখে অবাক—"
// Thakurma's beats
const T_CALL = cueS("ওরে তোরা", THAK.from); // "ওরে তোরা এদিকে এসে দ্যাখ!"
const T_WAVE = cueS("খোকা যেমন", cueAt(THAK, 1, 0.17)); // "খোকা যেমন ছোট্ট হাত দুটো জোরে নাড়ছে,"
const T_POUR = cueS("মুষলধারে", cueAt(THAK, 2, 0.41)); // "বাইরে বৃষ্টিও অমনি মুষলধারে বাড়ছে!"
const T_STOP = cueS("হাত থামালেই", cueAt(THAK, 3, 0.65)); // "আবার হাত থামালেই বৃষ্টি কমে আসছে—"
const T_HUMAN = cueS("মানুষের কাজ", cueAt(THAK, 4, 0.86)); // "এ কি মানুষের কাজ রে!"
// Surendra's beats
const S_WONDER = cueS("বড় আশ্চর্য", SURE.from); // "বড় আশ্চর্য মা!"
const S_DUST = cueS("পদধূলি", cueAt(SURE, 1, 0.2)); // "কারও পদধূলি যেন ও নিতে চাইল না—"
const S_NATURE = cueS("প্রকৃতিই", cueAt(SURE, 2, 0.6)); // "প্রকৃতিই যেন ওর ইশারায় খেলছে!"
const S_END = SURE.to;

/** Gestures start this many frames before their cue. */
const LEAD = 7;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const sineInOut = (t: number) => (1 - Math.cos(clamp(t) * Math.PI)) / 2;
const sineRamp = (f: number, a: number, b: number) => sineInOut((f - a) / Math.max(1, b - a));
const smooth01 = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
/** 0 → 1 → 0 window with sine edges: up over [a, a + rin], down over [b - rout, b]. */
const bump = (f: number, a: number, b: number, rin = 10, rout = rin) => sineRamp(f, a, a + rin) * (1 - sineRamp(f, b - rout, b));
/** Piecewise track with sine ease between keys. */
const sineTrack = (f: number, keys: [number, number][]) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (f <= f1) return lerp(v0, v1, sineInOut((f - f0) / Math.max(1, f1 - f0)));
  }
  return keys[keys.length - 1][1];
};

/* ------------------------------------------------------------------ */
/* THE MIRACLE: the baby's hands → rainIntensity                       */
/* ------------------------------------------------------------------ */

/**
 * The baby's wave strength 0..1 (fed straight to BabyThakur's `wave`). He has been waving all morning (the storm
 * is his); his hands rest as the relatives notice, then wave again on the narration's "অদ্ভুত কাণ্ড", rest for
 * Thakurma's call, wave hard on "হাত দুটো জোরে নাড়ছে" (harder still on "মুষলধারে"), stop on "হাত থামালেই",
 * wave gently once more near the end of her line, and rest. Every change starts LEAD frames before its cue.
 */
const waveCurve = (f: number) =>
  sineTrack(f, [
    [0, 0.8],
    [N_REL + 20, 0.8],
    [N_REL + 26, 0], // his hands come to rest: the rain eases, the relatives turn to him
    [N_ODD - LEAD, 0],
    [N_ODD - 1, 0.85], // "অদ্ভুত কাণ্ড": he waves again and the storm answers
    [T_CALL - 12, 0.85],
    [T_CALL - 6, 0], // rest while Thakurma calls the others
    [T_WAVE - LEAD, 0],
    [T_WAVE - 1, 0.72], // "হাত দুটো জোরে নাড়ছে"
    [T_POUR - LEAD, 0.72],
    [T_POUR - 1, 1], // "মুষলধারে বাড়ছে": hardest
    // P2 holds the story at the start of "আবার হাত থামালেই" with his hands still waving hard, so the stop begins only
    // after that pause (on "হাত থামালেই", quickly, so the rain's drop reads as his doing)
    [Math.max(T_STOP - LEAD, P2_AT + 1), 1],
    [Math.max(T_STOP - 2, P2_AT + 6), 0],
    [T_STOP + 36, 0],
    [T_STOP + 42, 0.6], // gently once more: the rain rises again
    [T_HUMAN + 22, 0.6],
    [T_HUMAN + 28, 0],
  ]);

/** The slow gesture on Surendra's "প্রকৃতিই যেন ওর ইশারায়": his near hand lifts softly (bless 0..0.7) and lowers. */
const gestureCurve = (f: number) =>
  sineTrack(f, [
    [S_NATURE - LEAD, 0],
    [S_NATURE + 22, 0.7],
    [S_NATURE + 50, 0.7],
    [S_NATURE + 78, 0],
  ]);

/** The baby's `wave` prop: the wave curve, plus soft arcs of both arms during the slow gesture. */
const wavePropAt = (f: number) => Math.max(waveCurve(f), 0.45 * gestureCurve(f));
/**
 * The baby's own clock runs a little faster while he waves, so his waves are quick and small. It is integrated over
 * REAL frames (the wave strength read on the story clock), so in a pause his arms keep waving at the held strength
 * (P2: still waving hard) instead of freezing mid-wave.
 */
const BF_TAB: number[] = (() => {
  const out: number[] = [];
  let acc = -60;
  for (let i = 0; i < SCENE_FRAMES + 160; i++) {
    out.push(acc);
    const sf = i - 60 < 0 ? i - 60 : storyFrame(i - 60, PAUSES);
    acc += 1 + 0.8 * Math.max(waveCurve(sf), 0.45 * gestureCurve(sf));
  }
  return out;
})();
/** Baby clock on a REAL local frame. */
const babyClock = (lf: number) => BF_TAB[Math.max(0, Math.min(BF_TAB.length - 1, Math.round(lf) + 60))];
/**
 * Baby's LIFE clock (BabyThakur's lifeF), on a REAL local frame. BabyThakur's own blink is a slow, sleepy lid fall
 * (about 20 frames, about 10 of them fully shut), which made him look asleep while he works the miracle. He is wide
 * awake through this whole scene, so his life clock runs quickly through each of his blinks (BLINK_SPEED x): a soft
 * natural blink of a few frames, never a long closure. Outside a blink it runs at normal speed (breathing, saccades,
 * wriggles unchanged). The blink window replicates BabyThakur's softBlink(L, 97): blink() sampled at L * 0.3.
 */
const BLINK_SPEED = 3.4;
const babyBlinking = (L: number) => {
  const i = Math.floor(L * 0.3);
  return blink(i, 97) > 0 || blink(i + 1, 97) > 0;
};
const BL_TAB: number[] = (() => {
  const out: number[] = [];
  let acc = -60;
  for (let i = 0; i < SCENE_FRAMES + 160; i++) {
    out.push(acc);
    acc += babyBlinking(acc) ? BLINK_SPEED : 1;
  }
  return out;
})();
const babyLife = (lf: number) => BL_TAB[Math.max(0, Math.min(BL_TAB.length - 1, Math.round(lf) + 60))];
/** The hand-motion curve the rain follows: the waving, or the slow lift of the gesture. */
const handMotion = (f: number) => Math.max(wavePropAt(f), gestureCurve(f) * 0.95);

const TAB0 = -60;
const TAB_N = SCENE_FRAMES + 160;
const H_TAB = Array.from({ length: TAB_N }, (_, i) => handMotion(i + TAB0));
const handAt = (f: number) => H_TAB[Math.max(0, Math.min(TAB_N - 1, Math.round(f) - TAB0))];
/** Lag kernel over the previous 1..6 frames (mean lag about 3.5 frames): the rain answers the hands, eased. */
const LAG_W = [0.3, 0.8, 1, 1, 0.6, 0.3];
const LAG_SUM = LAG_W.reduce((s, w) => s + w, 0);
const R_TAB = Array.from({ length: TAB_N }, (_, i) => {
  let s = 0;
  LAG_W.forEach((w, k) => {
    s += w * handAt(i + TAB0 - (k + 1));
  });
  return 0.04 + 0.96 * Math.pow(clamp(s / LAG_SUM), 1.5);
});

/**
 * rainIntensity 0..1 on a local frame: about 0.04 at a drizzle, 1 at the heaviest. It falls to the drizzle within
 * about 6-12 frames after his hands stop and rises as fast when they move. Everything wet in the scene,
 * the room light and the rain loop's volume read this one function.
 */
export const rainIntensity = (f: number) => R_TAB[Math.max(0, Math.min(TAB_N - 1, Math.round(f) - TAB0))];

/** rainIntensity on a REAL local frame (the story clock read through the pauses): for sound and accumulated motion. */
const rainIntensityReal = (lf: number) => rainIntensity(lf < 0 ? lf : storyFrame(lf, PAUSES));

/**
 * Accumulated rain fall (frames of travel) on the REAL clock, so the streaks speed up and slow down without ever
 * jumping, and keep falling through the pauses at the held intensity.
 */
const PH_N = SCENE_FRAMES + 160;
const PH_TAB: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i < PH_N; i++) {
    acc += 0.35 + 0.9 * rainIntensityReal(i + TAB0);
    out.push(acc);
  }
  return out;
})();
const rainPhase = (lf: number) => PH_TAB[Math.max(0, Math.min(PH_N - 1, Math.round(lf) - TAB0))];

/**
 * Wind gusts 0..1: the strength follows the rain (story clock f), the gusting itself moves on the life clock lf,
 * for the trees, the shutters and the slant of the streaks.
 */
const gustAt = (f: number, lf: number) => (0.03 + 0.97 * Math.pow(rainIntensity(f), 1.2)) * (0.55 + 0.45 * noise1(lf * 0.05, 7) + 0.2 * noise1(lf * 0.17, 9));

/**
 * The one soft flash and thunder roll: in pause P2, at the heaviest downpour (real local frames). If the scene has
 * no P2, just after "মুষলধারে" as before.
 */
const FLASH_AT = PAUSES[1] ? pauseRealStart(1) + 5 : realOf(T_POUR + 20);
const THUNDER_AT = FLASH_AT + 3;
const flashAt = (lf: number) => {
  const d = lf - FLASH_AT;
  if (d < 0) return 0;
  return 0.8 * (Math.exp(-d / 2.4) + (d >= 4 ? 0.45 * Math.exp(-(d - 4) / 3) : 0));
};

/** The divine glow brightens gently only on the key beats: the surge (held through P2) and Surendra's line. */
const keyBeat = (f: number) => Math.max(bump(f, T_POUR - 8, T_STOP + 10, 16, 20), bump(f, S_NATURE - 10, S_END + 10, 18, 24));

/* ------------------------------------------------------------------ */
/* Set geometry (main layer, depth 1; the back wall is at WALL_D)       */
/* ------------------------------------------------------------------ */

const WALL_D = 0.8;
const FLOOR_Y = 650;
/** The big window over the baby and the window by the relatives (back-wall coordinates). */
const W1 = { x: 400, y: 170, w: 440, h: 430 };
const W2 = { x: 1340, y: 210, w: 380, h: 350 };
const COT = { x: 640, top: 700, w: 300 };
const BABY = { x: 650, y: 668, s: 1.3 };
/** Balak's head centre (BabyThakur's head offset -50, -10 in his body frame). */
const BABY_HEAD = { x: BABY.x - 50 * BABY.s, y: BABY.y - 10 * BABY.s };
const CHARU = { x: 360, y: 790, s: 1.43 };
/**
 * Staging (2026-11-21 pass, for the approved shot list): Thakurma sits on the floor just past the foot of the cot,
 * by the big window, watching the baby (so she is at the edge of the window shot and of the MATCH shot, the baby is
 * in her close-ups, and her "ওরে তোরা এদিকে এসে দ্যাখ!" calls the others over from the other window). The woman of the
 * household and Surendra are "the relatives by the other window". The arrangements move right to make room.
 */
const WOMAN = { x: 1590, y: 862, s: 1.42 };
const THAKURMA_POS = { x: 912, y: 852, s: 1.42 };
const SURENDRA_POS = { x: 1840, y: 884, s: 1.45 };
const ASANS = [1080, 1200, 1320];
const ASAN_Y = 735;
/** Centre of the alpana and the flower heap (under the middle asan). */
const ALPANA_X = ASANS[1];
const PRADIP = { x: 1418, y: 712 };

/* Local copies of the father and grandmother (same look as Scene01eFather, which defines them for its own use). */
const SURENDRA: CastMember = {
  id: "surendra",
  age: "adult",
  sex: "m",
  height: 1.0,
  girth: 0.95,
  skin: "#c98f63",
  skinLight: "#e8b48a",
  skinShade: "#a86d46",
  lips: "#9c5a4e",
  hair: "#1a1210",
  hairLight: "#4e3a2e",
  hairStyle: "parted",
  outfit: "kurta",
  top: "#fbf8f0",
  topLight: "#ffffff",
  topShade: "#d4cab6",
  sleeve: "full",
  lower: "dhoti",
  lowerColor: "#f7f3e8",
  lowerShade: "#d2c7b0",
  dhotiLength: "calf",
  scarf: { color: "#7a5230", shade: "#5a3a20", trim: "#c99a5a", style: "shawl" },
  seed: 47,
};
const THAKURMA: CastMember = {
  id: "thakurma",
  age: "elder",
  sex: "f",
  height: 0.95,
  girth: 1.05,
  skin: "#b07a52",
  skinLight: "#cc9468",
  skinShade: "#84573a",
  lips: "#8a4f43",
  hair: "#e4e0d8",
  hairLight: "#f6f3ec",
  hairStyle: "veil",
  outfit: "blouse",
  top: "#f3efe6",
  topLight: "#ffffff",
  topShade: "#cfc6b2",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#fbf8f1",
  lowerShade: "#d9d0bc",
  scarf: { color: "#ece6d8", shade: "#bfb59f", trim: "#d8cdb4", style: "shawl" },
  seed: 131,
};

/* ------------------------------------------------------------------ */
/* Lip sync (as Scene02Fox's charuMouth, for any speaker)               */
/* ------------------------------------------------------------------ */

const VISEMES: Record<string, MouthState> = {
  A: { open: 1, width: 1.05, round: 0.1, teeth: 0.6 },
  E: { open: 0.6, width: 1.22, round: 0, teeth: 0.85 },
  I: { open: 0.38, width: 1.26, round: 0, teeth: 0.9 },
  O: { open: 0.82, width: 0.78, round: 0.8, teeth: 0.2 },
  U: { open: 0.42, width: 0.64, round: 0.95, teeth: 0 },
  MBP: { open: 0.12, width: 0.94, round: 0.12, teeth: 0 },
};
const LIP_EASE = 2.5;
const LIP_GAP = 2.5;

const makeLips = (clip: Clip, seed: number) => {
  const gate = (fr: number): { w: number; i: number } => {
    if (fr < clip.from || fr >= clip.to) return { w: 0, i: -1 };
    for (let i = 0; i < clip.phrases.length; i++) {
      const c = clip.phrases[i];
      if (fr >= c.from && fr < c.to) {
        const end = c.to - LIP_GAP;
        return { w: sineRamp(fr, c.from, c.from + LIP_EASE) * (1 - sineRamp(fr, end - LIP_EASE, end)), i };
      }
    }
    return { w: 0, i: -1 };
  };
  const sylPhase = (fr: number) => (2 * Math.PI * 5.5 * fr) / 24 + 2.0 * noise1(fr * 0.06, seed) + 0.9 * noise1(fr * 0.13, seed + 1);
  const mouth = (fr: number): MouthState => {
    const g = gate(fr);
    if (g.w <= 0.001) return MOUTH_REST;
    const c = clip.phrases[g.i];
    const ph = sylPhase(fr);
    const k = Math.floor(ph / (2 * Math.PI));
    const frac = ph / (2 * Math.PI) - k;
    const k0 = Math.floor(sylPhase(c.from) / (2 * Math.PI));
    const k1 = Math.max(k0 + 1, Math.floor(sylPhase(c.to - LIP_GAP) / (2 * Math.PI)));
    const syl = bnSyllables(c.text);
    const at = (kk: number) => {
      if (!syl.length) return { v: ["A", "O", "E", "A", "I", "O"][Math.floor(hash(kk * 3.7 + seed) * 6)], labial: false };
      const idx = Math.min(syl.length - 1, Math.max(0, Math.floor(((kk - k0) * syl.length) / (k1 - k0))));
      return syl[idx];
    };
    const cur = at(k);
    const prev = at(k - 1);
    const sCur = VISEMES[cur.v] ?? VISEMES.A;
    const sPrev = VISEMES[prev.v] ?? VISEMES.A;
    const t = smooth01(frac / 0.35);
    const shape: MouthState = {
      open: lerp(sPrev.open, sCur.open, t),
      width: lerp(sPrev.width, sCur.width, t),
      round: lerp(sPrev.round, sCur.round, t),
      teeth: lerp(sPrev.teeth, sCur.teeth, t),
    };
    let cyc = Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * frac), 0.85);
    if (cur.labial) cyc *= smooth01((frac - 0.08) / 0.22);
    const amp = 0.62 + 0.3 * noise1(fr * 0.31, seed + 2) + 0.08 * Math.sin(fr * 0.9 + 1.7);
    const w = g.w;
    return {
      open: clamp(w * cyc * amp * shape.open * 0.9),
      width: lerp(1, shape.width, w * (0.45 + 0.55 * cyc)),
      round: shape.round * w * (0.4 + 0.6 * cyc),
      teeth: shape.teeth * w * cyc * clamp(amp),
    };
  };
  /**
   * Speech level for the head emphasis (low, so the brows keep the expression). It never drops below 0.075 inside
   * the clip, so the Puppet's pause blink does not fire at the joins between phrases (only after the line).
   */
  const talk = (fr: number) => 0.3 * Math.max(gate(fr).w, fr >= clip.from && fr < clip.to - 2 ? 0.25 : 0);
  /** 0..1 while the clip plays: the expression's open-mouthed gasp is handed over to the speech mouth. */
  const speaking = (fr: number) => sineRamp(fr, clip.from - 3, clip.from + 3) * (1 - sineRamp(fr, clip.to - 3, clip.to + 3));
  return { mouth, talk, speaking };
};

const THAK_LIPS = makeLips(THAK, 411);
const SURE_LIPS = makeLips(SURE, 431);

/* ------------------------------------------------------------------ */
/* Acting                                                              */
/* ------------------------------------------------------------------ */

/** A key whose move starts LEAD frames before the cue and takes `dur` frames. */
const cue = (c: number, dur: number) => ({ f: c - LEAD + dur, in: dur, ease: "inOut" as const });
type K = PoseKey<Pose>;

/**
 * Charu: seated beside the cot, turned to him. Her near hand rests on the kantha beside him (she does not lift
 * him). Tender, then amazed: she looks up at the window when the rain surges and back down to him, her hand
 * goes to her chest, and at the end she leans in close with a soft, wet-eyed smile.
 */
const charuKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.35, headTurn: 0.35, headNod: 9, headTilt: 6, eyeX: 0.5, eyeY: 0.5, lid: 0.04, smile: 0.5, brow: 0.05, lean: 4, rS: -6, rE: 92, rHand: "relaxed", lS: 10, lE: -70, lHand: "relaxed" } as K,
  // "...থামছে না": a worried glance up at the window
  { ...cue(N_RAIN, 16), headNod: -2, headTurn: 0.25, eyeY: -0.55, eyeX: 0.3, brow: 0.3, browTilt: 0.4, smile: 0.15, lid: 0.05 } as K,
  { ...cue(N_RAIN + 46, 18), headNod: 8, headTurn: 0.35, eyeY: 0.5, eyeX: 0.5, brow: 0.15, browTilt: 0.2, smile: 0.35, lid: 0.04 } as K,
  // "অদ্ভুত কাণ্ড": amazed, eyes from him to the window and back
  { ...cue(N_ODD, 12), brow: 0.6, browTilt: 0.2, gasp: 0.22, smile: 0.1, lid: 0, eyeY: 0.2, headNod: 3 } as K,
  { ...cue(N_ODD + 30, 14), eyeY: -0.5, headNod: -3 } as K,
  { ...cue(T_CALL, 16), eyeY: 0.5, headNod: 8, gasp: 0.12, brow: 0.45, smile: 0.3 } as K,
  // "মুষলধারে": up at the pouring window, her hand to her chest
  { ...cue(T_POUR, 14), eyeY: -0.6, headNod: -4, headTurn: 0.2, brow: 0.8, browTilt: 0.3, gasp: 0.35, smile: 0, lean: 1, lS: 18, lE: -150, lHand: "relaxed" } as K,
  // "হাত থামালেই": back down to him, wonder softening to tenderness
  { ...cue(T_STOP, 16), eyeY: 0.5, headNod: 9, headTurn: 0.35, brow: 0.5, browTilt: 0.15, gasp: 0.1, smile: 0.35, lean: 4 } as K,
  { ...cue(S_DUST, 24), brow: 0.3, gasp: 0, smile: 0.55, tears: 0.15, headTilt: 9, lid: 0.06, lS: 10, lE: -70, lHand: "relaxed" } as K,
  // the end: she leans in close, a wet-eyed tender smile
  { ...cue(S_END, 30), lean: 8, headNod: 11, headTilt: 10, smile: 0.62, tears: 0.18, brow: 0.2, lid: 0.1 } as K,
]);
const charuFrame = (f: number, lf: number = f): Partial<Pose> => {
  const k = charuKeys(f);
  return {
    ...k,
    headTilt: k.headTilt + noise1(lf * 0.02, 4) * 1.4,
    eyeX: k.eyeX + noise1(lf * 0.031, 6) * 0.05,
    lean: k.lean + Math.sin(lf * 0.045) * 0.6,
  };
};

/**
 * Thakurma: seated just past the foot of the cot, by the big window (screen-left of her: the baby low, the window
 * high), the others at the far window (screen-right). Worried, she watches the pouring window; turns to the baby as
 * the narration says "হঠাৎ"; beckons the others on "ওরে তোরা এদিকে এসে দ্যাখ!" and points at him; glances up at the
 * pouring window on "মুষলধারে"; hand to her cheek and a slow shake of the head on "এ কি মানুষের কাজ রে!", eyes wet;
 * listens to her son. The pause moments (P1 sigh, P2 glance, P3 turn to Surendra) are laid over this in the scene.
 */
const thakKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: -0.25, headTurn: -0.4, headNod: -4, eyeX: -0.55, eyeY: -0.55, brow: 0.3, browTilt: 0.55, smile: 0.05, rS: -55, rE: -128, rHand: "relaxed", lS: 8, lE: -40 } as K,
  { ...cue(N_RAIN, 20), headTurn: -0.45, headTilt: 4, eyeY: -0.6, brow: 0.38, browTilt: 0.65 } as K,
  // "হঠাৎ": she turns down to the baby
  { ...cue(N_REL + 22, 14), bodyTurn: -0.3, headTurn: -0.6, headTilt: 0, headNod: 6, eyeX: -0.8, eyeY: 0.35, brow: 0.55, browTilt: 0.25, gasp: 0.15, rS: 6, rE: -20 } as K,
  { ...cue(N_ODD, 12), brow: 0.85, browTilt: 0.2, gasp: 0.4, smile: 0 } as K,
  // "ওরে তোরা এদিকে এসে দ্যাখ!": turns to the others and beckons with her right hand
  { ...cue(T_CALL, 10), bodyTurn: 0.25, headTurn: 0.55, headNod: 0, eyeX: 0.75, eyeY: -0.05, rS: 58, rE: 100, rHand: "open", brow: 0.9, browTilt: 0.2, gasp: 0.45 } as K,
  // ... then points at him with her left
  { ...cue(T_CALL + 26, 12), bodyTurn: -0.35, headTurn: -0.45, headNod: 5, eyeX: -0.8, eyeY: 0.3, rS: 8, rE: -30, rHand: "relaxed", lS: 55, lE: 62, lHand: "open" } as K, // a short open-palm point, the elbow bent, her hand clear of him
  // ... and the hand goes back to her lap before the MATCH shot, so in that frame it never seems to touch him
  { f: T_WAVE, in: 14, ease: "inOut", lS: 8, lE: -40, lHand: "relaxed" } as K,
  { ...cue(T_WAVE + 40, 20), headTurn: -0.4, headTilt: -5, brow: 0.9, browTilt: 0.3 } as K,
  // "মুষলধারে": a glance up at the pouring window over him
  { ...cue(T_POUR, 12), headTurn: -0.5, headNod: -5, eyeX: -0.6, eyeY: -0.6, brow: 1, browTilt: 0.35, gasp: 0.45 } as K,
  { ...cue(T_POUR + 34, 14), headTurn: -0.45, headNod: 5, eyeX: -0.8, eyeY: 0.3, brow: 1, gasp: 0.45, lS: 30, lE: -20, lHand: "relaxed" } as K,
  // "হাত থামালেই": back on him
  { ...cue(T_STOP + 4, 14), headTurn: -0.5, eyeY: 0.3, brow: 0.9, browTilt: 0.25, gasp: 0.4, lS: 8, lE: -30 } as K,
  // hand comes to her chest in wonder as the rain eases
  { f: T_STOP + 40, in: 16, ease: "inOut", rS: 14, rE: -150, rHand: "relaxed", brow: 0.95, gasp: 0.4 } as K,
  // "এ কি মানুষের কাজ রে!": hand to her cheek (relaxed hand, not a wave), eyes wet. In her close-up the head turns only a
  // little toward him (the eyes do the rest): at a deeper left turn the far brow pokes out past her hood's edge
  { ...cue(T_HUMAN, 14), bodyTurn: -0.12, headTurn: -0.18, rS: -58, rE: -132, rHand: "relaxed", headTilt: -3, headNod: 0, eyeY: -0.05, eyeX: -0.75, brow: 0.9, browTilt: 0.25, gasp: 0.45, tears: 0.22, smile: 0.15, cheeks: 0.2 } as K,
  // listening to her son: she turns to him, nods softly, the hand comes down to her chest (P3 has already turned her)
  { ...cue(S_WONDER, 16), bodyTurn: 0.1, headTurn: 0.38, eyeX: 0.62, eyeY: -0.06, headTilt: 4, headNod: 0, rS: 14, rE: -150, rHand: "relaxed", brow: 0.72, browTilt: 0.28, gasp: 0.28, tears: 0.22, smile: 0.2 } as K,
  { ...cue(S_NATURE, 20), headTurn: -0.4, headNod: 5, eyeX: -0.8, eyeY: 0.3, smile: 0.35, brow: 0.45 } as K,
]);
/** Thakurma's pose on story frame f; lf is the life clock at that sample (idle noise keeps moving in a pause). */
const thakFrame = (f: number, lf: number = f): Partial<Pose> => {
  const k = thakKeys(f);
  const sp = THAK_LIPS.speaking(f);
  // beckoning flicks of the forearm, then a slow shake of the head at "এ কি মানুষের কাজ"
  const beck = bump(f, T_CALL - LEAD + 6, T_CALL + 30, 6, 8);
  const shake = bump(f, T_HUMAN - 2, T_HUMAN + 44, 8, 10);
  return {
    ...k,
    rE: k.rE + beck * 26 * Math.sin((f - T_CALL) * 0.55),
    headTurn: k.headTurn + shake * 0.09 * Math.sin((f - T_HUMAN) * 0.24) + noise1(lf * 0.025, 21) * 0.04,
    headTilt: k.headTilt + noise1(lf * 0.02, 22) * 1.6,
    headNod: k.headNod + (f > S_WONDER && f < S_END ? Math.sin((f - S_WONDER) * 0.13) * 1.5 : 0),
    // while she speaks most of the gasp goes to the speech mouth, but enough stays to keep her eyes wide
    gasp: k.gasp * (1 - 0.65 * sp),
    lid: 0,
  };
};

/* The pause moments for Thakurma, on the REAL local clock lf (the story clock is held inside a pause). */
const P_S = [0, 1, 2].map(pauseRealStart);
const P_E = [0, 1, 2].map(pauseRealEnd);
/** P1: she lifts her eyes and looks out at the pouring rain (0..1, back to 0 by the pause's end). */
const thakLookOut = (lf: number) => (PAUSES[0] ? bump(lf, P_S[0] + 2, P_E[0], 10, 12) : 0);
/** P1: her sigh (Puppet `sigh` envelope; the Puppet adds the slow inhale and long exhale). */
const thakSigh = (lf: number) => (PAUSES[0] ? bump(lf, P_S[0] + 3, P_S[0] + 22, 8, 10) : 0);
/** P2: eyes from the baby up to the window and back (0..1). */
const thakGlance = (lf: number) => (PAUSES[1] ? bump(lf, P_S[1] + 2, P_E[1] - 1, 5, 6) : 0);
/** P3: she turns to Surendra in the pause and stays turned until her story keys take over on his line. */
const thakTurnSon = (lf: number, f: number) => {
  if (!PAUSES[2]) return 0;
  if (lf < P_E[2]) return sineRamp(lf, P_S[2] + 10, P_S[2] + 34);
  return 1 - sineRamp(f, S_WONDER - LEAD, S_WONDER - LEAD + 16);
};
/** Thakurma with the pause moments laid over her story pose. */
const thakWithPauses = (f: number, lf: number): Partial<Pose> => {
  const k = thakFrame(f, lf);
  const look = thakLookOut(lf);
  const gl = thakGlance(lf);
  const son = thakTurnSon(lf, f);
  const o: Partial<Pose> = { ...k };
  const mix = (key: "headTurn" | "headNod" | "eyeX" | "eyeY" | "bodyTurn" | "headTilt" | "brow" | "browTilt" | "tears" | "smile" | "gasp" | "rS" | "rE", target: number, w: number) => {
    o[key] = lerp((o[key] as number | undefined) ?? (BASE_POSE[key] as number), target, w);
  };
  // P1: up and out at the window, a worried brow
  mix("eyeY", -0.7, look);
  mix("headNod", -7, look);
  mix("headTurn", -0.5, look);
  mix("brow", 0.5, look * 0.6);
  // P2: baby -> window -> baby
  mix("eyeY", -0.65, gl);
  mix("eyeX", -0.55, gl);
  mix("headNod", -4, gl * 0.8);
  // P3: wet-eyed, she turns to her son
  // P3: moved and full of wonder (eyes open and bright, brows gently lifted, a faint tremulous smile, a little wet),
  // she turns her head (not just her eyes) to her son and her hand comes down from her cheek to her chest
  mix("bodyTurn", 0.1, son);
  mix("headTurn", 0.38, son);
  mix("eyeX", 0.62, son);
  mix("eyeY", -0.06, son);
  mix("headTilt", 4, son);
  mix("brow", 0.72, son);
  mix("browTilt", 0.28, son);
  mix("gasp", 0.28, son);
  mix("smile", 0.2 + 0.03 * Math.sin(lf * 0.5), son);
  mix("tears", 0.22, son);
  mix("rS", 14, son);
  mix("rE", -150, son);
  // Keep her head turn moderate (the eyes take the rest of the look): past about this yaw the shared Head draws her
  // far brow sticking out beyond the hood's edge as a pale ghost arc (seen at 2405 and 2765).
  const ht = (o.headTurn as number | undefined) ?? 0;
  const bt = (o.bodyTurn as number | undefined) ?? 0;
  const htC = clamp(ht, -0.3, 0.4);
  const btC = clamp(bt, -0.15, 0.15);
  o.headTurn = htC;
  o.bodyTurn = btC;
  o.eyeX = clamp(((o.eyeX as number | undefined) ?? 0) + 0.8 * (ht - htC + 0.5 * (bt - btC)), -0.9, 0.9);
  return o;
};

/** The woman of the household: worried at the window, turns to the baby a beat after Thakurma, hand to her mouth. */
const womanKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.2, headTurn: 0.5, eyeX: 0.7, eyeY: -0.1, brow: 0.25, browTilt: 0.5, smile: 0.05, rS: 10, rE: -60, lS: 10, lE: -64 } as K,
  { ...cue(N_RAIN + 20, 20), headTurn: 0.6, headTilt: 5 } as K,
  { ...cue(N_ODD - 2, 14), bodyTurn: -0.25, headTurn: -0.6, headTilt: 0, eyeX: -0.8, eyeY: 0.3, brow: 0.5, browTilt: 0.2, gasp: 0.12 } as K,
  { ...cue(N_ODD + 14, 12), brow: 0.8, gasp: 0.35, rS: -40, rE: -140, rHand: "relaxed" } as K,
  { ...cue(T_WAVE, 16), rS: 10, rE: -60, rHand: "relaxed", gasp: 0.25, lean: -2 } as K,
  { ...cue(T_POUR + 6, 12), headTurn: 0.5, eyeX: 0.8, eyeY: -0.2, brow: 0.95, gasp: 0.45 } as K,
  { ...cue(T_POUR + 40, 14), headTurn: -0.55, eyeX: -0.8, eyeY: 0.3, rS: -40, rE: -140, rHand: "relaxed" } as K,
  { ...cue(T_STOP + 30, 16), rS: 10, rE: -60, rHand: "relaxed", brow: 0.7, gasp: 0.2, smile: 0.15 } as K,
  { ...cue(S_DUST, 20), smile: 0.3, brow: 0.5, gasp: 0.08 } as K,
]);
const womanFrame = (f: number, lf: number = f): Partial<Pose> => {
  const k = womanKeys(f);
  return { ...k, headTilt: k.headTilt + noise1(lf * 0.022, 31) * 1.5, eyeX: k.eyeX + noise1(lf * 0.03, 32) * 0.05 };
};

/**
 * Surendra: worried at the window, arms folded loosely; turns to the baby after the women; leans a little toward
 * him when Thakurma calls; then to his mother on "বড় আশ্চর্য মা!" (hand on his chest, brows lifted), and on
 * "প্রকৃতিই যেন ওর ইশারায় খেলছে" his open palm turns out toward the baby and the window.
 */
const sureKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.15, headTurn: 0.45, headNod: -1, eyeX: 0.7, eyeY: -0.1, brow: 0.2, browTilt: 0.45, smile: 0.05, rS: 8, rE: -95, lS: 8, lE: -100 } as K,
  { ...cue(N_RAIN + 10, 20), headTurn: 0.55, headNod: -3 } as K,
  { ...cue(N_ODD + 2, 16), bodyTurn: -0.3, headTurn: -0.55, headNod: 3, eyeX: -0.8, eyeY: 0.25, brow: 0.45, browTilt: 0.15, gasp: 0.1 } as K,
  { ...cue(N_ODD + 20, 12), brow: 0.7, gasp: 0.25, rS: 8, rE: -30, lS: 8, lE: -30 } as K,
  { ...cue(T_CALL + 20, 18), lean: -3 } as K,
  { ...cue(T_POUR + 10, 12), headTurn: 0.45, eyeX: 0.8, eyeY: -0.25, brow: 0.9, gasp: 0.35 } as K,
  { ...cue(T_POUR + 44, 14), headTurn: -0.55, eyeX: -0.8, eyeY: 0.25 } as K,
  { ...cue(T_STOP, 16), brow: 0.75, browTilt: 0.3, gasp: 0.25, lean: -1 } as K,
  // "বড় আশ্চর্য মা!": to his mother, hand on his chest
  { ...cue(S_WONDER, 14), bodyTurn: -0.2, headTurn: -0.5, eyeX: -0.75, eyeY: 0.05, headNod: 1, brow: 0.8, browTilt: 0.35, gasp: 0.25, smile: 0.15, rS: 14, rE: -150, rHand: "relaxed" } as K,
  { ...cue(S_DUST + 30, 20), headTilt: -4, brow: 0.6, smile: 0.25 } as K,
  // "প্রকৃতিই যেন ওর ইশারায় খেলছে": the open palm turns out toward the baby and the window
  { ...cue(S_NATURE, 16), headTurn: -0.6, eyeX: -0.85, eyeY: 0.25, headTilt: 0, lS: 58, lE: -22, lHand: "open", brow: 0.75, smile: 0.3 } as K,
  { ...cue(S_END, 24), lS: 10, lE: -30, lHand: "relaxed", smile: 0.4, brow: 0.45, tears: 0.08 } as K,
]);
const sureFrame = (f: number, lf: number = f): Partial<Pose> => {
  const k = sureKeys(f);
  const sp = SURE_LIPS.speaking(f);
  return {
    ...k,
    headTilt: k.headTilt + noise1(lf * 0.02, 41) * 1.4,
    headTurn: k.headTurn + noise1(lf * 0.027, 42) * 0.04,
    gasp: k.gasp * (1 - 0.85 * sp),
  };
};

/* ------------------------------------------------------------------ */
/* Camera (CAM-13): the approved shot list, held shots keyed to the cues */
/* ------------------------------------------------------------------ */

/** Camera that puts point (px, py) on depth d at screen (sx, sy) with the given zoom. */
const aim = (px: number, py: number, zoom: number, sx = 960, sy = 540, d = 1): Cam => {
  const zd = Math.pow(zoom, d);
  return { x: (px - 960 - (sx - 960) / zd) / d, y: (py - 540 - (sy - 540) / zd) / d, zoom };
};
const mixCam = (a: Cam, b: Cam, t: number): Cam => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), zoom: lerp(a.zoom, b.zoom, t) });

/**
 * One shot, in REAL local frames (so a pause inside a shot simply lengthens the hold). `a` is the framing; a shot
 * with one motivated move eases from `a` to `b` over [m0, m1] and holds there.
 */
interface Shot {
  name: string;
  from: number;
  a: Cam;
  b?: Cam;
  m0?: number;
  m1?: number;
}

// Window centre on the back wall, and the match framing: the baby in front, the window behind him.
const W1C = { x: W1.x + W1.w / 2, y: W1.y + W1.h / 2 };
const W2C = { x: W2.x + W2.w / 2, y: W2.y + W2.h / 2 };
/** MATCH: the baby in front, the big window behind him, Thakurma at the right edge of frame. Held, no creep. */
const MATCH = aim(BABY.x - 45, 617, 2.7, 960, 560);
/** Thakurma's head (seated) and Surendra's head (standing), main layer. */
const TH_HEAD = { x: THAKURMA_POS.x + 2, y: THAKURMA_POS.y - 285 };
const SU_HEAD = { x: SURENDRA_POS.x, y: SURENDRA_POS.y - 319 * SURENDRA_POS.s };

/** Real local frames of the cue anchors (cueLocalStory -> real; a cut after a pause lands at the pause's end). */
const R_SOB = realOf(N_SOB);
const R_RAIN = realOf(N_RAIN);
const R_REL = realOf(N_REL, true);
const R_CALL = realOf(T_CALL - LEAD);
const R_WAVE = realOf(T_WAVE);
const R_HUMAN = realOf(T_HUMAN - LEAD);
const R_WONDER = realOf(S_WONDER - LEAD);
const R_NATURE = realOf(S_NATURE - LEAD);
const R_END = realOf(S_END);

const SHOTS: Shot[] = [
  // 1 "গ্রামের ব্রাহ্মণরা ... সব আয়োজন ছিল—": held wide of the room (the waiting asans, plates and pradip, the family,
  //   the baby by the window), then ONE slow push in along the empty asans and plates, starting on "সব আয়োজন".
  { name: "1 wide + push", from: 0, a: aim(1080, 560, 1.02, 960, 560), b: aim(1190, 716, 1.3, 960, 640), m0: R_SOB, m1: R_RAIN },
  // 2 "অথচ এক ফোঁটা বৃষ্টিও থামছে না!": cut to the big window pouring, the cot under it, Thakurma at the frame's
  //   right; held through P1 (she sighs and looks out at the rain).
  { name: "2 window", from: R_RAIN, a: aim(620, 420, 1.55, 820, 400) },
  // 3 "আর ঘরের ভেতর আত্মীয়রা ...": cut (after P1) to the relatives by the other window; held (their heads turn to the
  //   baby on "অদ্ভুত কাণ্ড").
  { name: "3 relatives", from: R_REL, a: aim(1720, 520, 1.6, 960, 540) },
  // 4 Thakurma "ওরে তোরা এদিকে এসে দ্যাখ!": her close-up 7 f before the line, the baby beside her; held.
  { name: "4 Thakurma CU", from: R_CALL, a: aim(TH_HEAD.x, TH_HEAD.y, 2.4, 1190, 420) },
  // 5-6 "খোকা যেমন ...": cut on "খোকা" to the MATCH shot and HOLD it through the waving, P2 and the stopping, so cause
  //   and effect play in one frame.
  { name: "5-6 MATCH", from: R_WAVE, a: MATCH },
  // 7 "এ কি মানুষের কাজ রে!": her close-up 7 f before, one slow push in (the emotional peak) that settles early in P3;
  //   P3 holds on her (wet eyes, she turns to Surendra, the baby's glow brightening beside her).
  {
    name: "7 Thakurma CU push",
    from: R_HUMAN,
    a: aim(TH_HEAD.x, TH_HEAD.y, 2.25, 1170, 430),
    b: aim(TH_HEAD.x, TH_HEAD.y, 2.6, 1170, 430),
    m0: R_HUMAN,
    m1: PAUSES[2] ? P_S[2] + 14 : R_HUMAN + 70,
  },
  // 8-9 Surendra "বড় আশ্চর্য মা! ... কারও পদধূলি ...": his close-up 7 f before, turned to his mother; held.
  { name: "8-9 Surendra CU", from: R_WONDER, a: aim(SU_HEAD.x, SU_HEAD.y + 30, 2.8, 1240, 420) },
  // 10 "প্রকৃতিই যেন ওর ইশারায় খেলছে!": the MATCH shot: one slow gesture of his hand, the rain answers; held.
  { name: "10 MATCH gesture", from: R_NATURE, a: MATCH },
  // end: the warm two-shot of Charu and the baby for the scene's end hold (static).
  { name: "end two-shot", from: R_END, a: aim((CHARU.x + BABY_HEAD.x) / 2 + 30, 594, 2.12, 960, 500) },
];

/** The camera on a REAL local frame. */
const camAt = (lf: number): { cam: Cam; shot: Shot } => {
  let i = 0;
  while (i + 1 < SHOTS.length && lf >= SHOTS[i + 1].from) i++;
  const s = SHOTS[i];
  if (!s.b || s.m0 === undefined || s.m1 === undefined) return { cam: s.a, shot: s };
  return { cam: mixCam(s.a, s.b, sineInOut((lf - s.m0) / Math.max(1, s.m1 - s.m0))), shot: s };
};

/* ------------------------------------------------------------------ */
/* The room                                                            */
/* ------------------------------------------------------------------ */

/** Stylised wind-bent palm silhouette for the view outside. */
const OutPalm: React.FC<{ x: number; y: number; s: number; f: number; lf: number; seed: number; col: string }> = ({ x, y, s, f, lf, seed, col }) => {
  const g = gustAt(f, lf + seed * 3);
  const tipX = 30 + 70 * g;
  const fronds = [-150, -110, -70, -30, 10, 50, 90, 130];
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <path d={`M -9 0 Q ${tipX * 0.3 - 5} -150 ${tipX - 5} -280 L ${tipX + 5} -280 Q ${tipX * 0.3 + 7} -150 9 0 Z`} fill={col} />
      {fronds.map((a, j) => {
        const sway = Math.sin(lf * 0.17 + j * 1.7 + seed) * (3 + 9 * g) + noise1(lf * 0.12, j + seed) * 8 * g + (a < 0 ? 22 * g : 6 * g);
        return <path key={j} d="M 0 0 Q 60 -60 140 -24 Q 76 -42 0 10 Z" fill={col} transform={`translate(${tipX}, -280) rotate(${a + sway})`} />;
      })}
    </g>
  );
};

/** Banana plant silhouette, its torn leaves thrashing in the gusts. */
const OutBanana: React.FC<{ x: number; y: number; s: number; f: number; lf: number; seed: number; col: string }> = ({ x, y, s, f, lf, seed, col }) => {
  const g = gustAt(f, lf + seed * 5);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <path d="M -10 0 L -6 -150 L 6 -150 L 10 0 Z" fill={col} />
      {[-60, -20, 25, 65].map((a, j) => {
        const sway = Math.sin(lf * 0.21 + j * 2.1 + seed) * (4 + 12 * g) + 18 * g;
        return <path key={j} d="M 0 0 Q 40 -40 120 -30 Q 70 -10 0 8 Z" fill={col} transform={`translate(0, -150) rotate(${a + sway - 20})`} />;
      })}
    </g>
  );
};

/**
 * Everything seen through a window, all driven by rainIntensity R: at a drizzle a few thin, slow, faint streaks,
 * an occasional drip off the eave, still trees and a brighter sky; at a downpour dense slanted sheets, a white mist
 * of spray, splashes bouncing on the ground outside, a curtain of water off the eave and the trees whipping.
 */
const WindowView: React.FC<{ id: string; x: number; y: number; w: number; h: number; f: number; lf: number; seed: number }> = ({ id, x, y, w, h, f, lf, seed }) => {
  const R = rainIntensity(f);
  const heavy = clamp((R - 0.45) / 0.55);
  const fl = flashAt(lf);
  const ph = rainPhase(lf);
  const gust = gustAt(f, lf);
  const wind = 0.03 + 0.5 * R + 0.12 * gust;
  const span = h + 160;
  // thin streaks: only a handful at a drizzle, the whole sheet in a downpour
  const vis = 0.02 + 0.98 * Math.pow(R, 1.3);
  const thin = Array.from({ length: 170 }, (_, i) => {
    const hi = hash(i * 1.37 + seed);
    const a = clamp((vis - hi) * 12);
    if (a <= 0.01) return null;
    const near = hash(i * 4.1 + seed) > 0.7;
    const len = (near ? 30 : 18) + (near ? 60 : 30) * R;
    const sp = (near ? 34 : 24) * (0.8 + 0.4 * hash(i * 5.3 + seed));
    const yy = y - 80 + ((hash(i * 3.1 + seed) * span + ph * sp) % span);
    const x0 = x - 120 + hash(i * 1.7 + seed) * (w + 160);
    const xx = x0 + (yy - y) * wind;
    const op = a * (near ? 0.5 : 0.32) * (0.4 + 0.6 * R) * (0.6 + 0.4 * hash(i * 9.7 + seed));
    return (
      <line key={i} x1={xx} y1={yy} x2={xx - wind * len} y2={yy - len} stroke={near ? "#dfe9f3" : "#a9b8c8"} strokeWidth={(near ? 1.4 : 0.9) + 1.2 * R} strokeLinecap="round" opacity={op} />
    );
  });
  // heavy sheets: thick, long, bright streaks that only come with the downpour
  const sheets = Array.from({ length: 110 }, (_, i) => {
    const hi = hash(i * 2.71 + seed + 5);
    const a = clamp((heavy - hi) * 8);
    if (a <= 0.01) return null;
    const len = 80 + 60 * hash(i * 3.9 + seed);
    const sp = 40 * (0.85 + 0.3 * hash(i * 6.3 + seed));
    const yy = y - 120 + ((hash(i * 8.1 + seed) * (h + 240) + ph * sp) % (h + 240));
    const x0 = x - 160 + hash(i * 2.2 + seed) * (w + 200);
    const xx = x0 + (yy - y) * wind;
    return <line key={i} x1={xx} y1={yy} x2={xx - wind * len} y2={yy - len} stroke="#eef4fa" strokeWidth={2.6 + 1.4 * hash(i + seed)} strokeLinecap="round" opacity={a * 0.55} />;
  });
  // gusting sheets of spray drifting across in a downpour
  const bands = Array.from({ length: 3 }, (_, i) => {
    const bx = x - w + ((lf * (6 + 4 * gust) + i * w * 0.8 + hash(i + seed) * w) % (w * 2.4));
    return <rect key={i} x={bx} y={y - 40} width={w * 0.35} height={h + 80} fill="#e8eff6" opacity={0.18 * heavy} transform={`skewX(${-20 - 25 * wind})`} />;
  });
  // the curtain off the eave: none at a drizzle, a pouring sheet in a downpour
  const streams = Array.from({ length: 18 }, (_, i) => {
    const hi = hash(i * 2.9 + seed + 40);
    const a = clamp((R - 0.35 - hi * 0.55) * 5);
    if (a <= 0.01) return null;
    const sx = x + 10 + hash(i * 6.1 + seed) * (w - 20);
    const wob = (k: number) => Math.sin(k * 0.04 + i * 1.3 + lf * 0.3) * (1 + 4 * R) + wind * k * 0.3;
    const d = `M ${sx} ${y - 4} Q ${sx + wob(h * 0.5)} ${y + h * 0.5} ${sx + wob(h)} ${y + h + 4}`;
    return (
      <g key={i} opacity={a}>
        <path d={d} stroke="#d6e1ec" strokeWidth={2 + 5 * R * hash(i * 1.1 + seed)} fill="none" opacity={0.2 + 0.35 * R} />
        <path d={d} stroke="#f6f9fc" strokeWidth={1.6} fill="none" strokeDasharray={`${30 + 30 * R} 14`} strokeDashoffset={-ph * (34 + 10 * hash(i + seed))} opacity={0.3 + 0.45 * R} />
      </g>
    );
  });
  // an occasional drip off the eave (the drizzle's own sign; lost in the curtain when it pours)
  const drips = Array.from({ length: 4 }, (_, i) => {
    const period = 26 + Math.floor(hash(i * 3.3 + seed) * 18);
    const ofs = hash(i * 5.7 + seed) * period;
    const p = ((lf + ofs) % period) / period;
    const dx = x + 30 + hash(i * 7.9 + seed + Math.floor((lf + ofs) / period)) * (w - 60);
    const dy = y + 4 + p * p * h * 0.95;
    return <ellipse key={i} cx={dx} cy={dy} rx={2.2} ry={3.6} fill="#e6eef6" opacity={0.75 * (1 - 0.7 * R) * clamp((1 - p) * 4)} />;
  });
  // splashes bouncing on the ground outside
  const groundY = y + h * 0.9;
  const ground = Array.from({ length: 30 }, (_, i) => {
    const hi = hash(i * 4.7 + seed + 90);
    const a = clamp((Math.pow(R, 1.2) - hi) * 6);
    if (a <= 0.01) return null;
    const period = 8 + Math.floor(hash(i * 2.3 + seed) * 6);
    const k = Math.floor((lf + hash(i * 7.3) * period) / period);
    const p = ((lf + hash(i * 7.3) * period) % period) / period;
    const gx = x + hash(i * 3.1 + k * 1.7 + seed) * w;
    const gy = groundY + hash(i * 5.5 + k * 2.1 + seed) * h * 0.08;
    const r = 2 + p * (4 + 10 * R);
    return (
      <g key={i} opacity={a * (1 - p) * 0.8}>
        <ellipse cx={gx} cy={gy} rx={r} ry={r * 0.3} fill="none" stroke="#dde7f0" strokeWidth={1.2} />
        <circle cx={gx} cy={gy - Math.sin(p * Math.PI) * 10 * R} r={1.3} fill="#eef4fa" />
      </g>
    );
  });
  const clouds = Array.from({ length: 7 }, (_, i) => {
    const cx = x - 120 + ((hash(i * 1.9 + seed) * (w + 240) + lf * (0.2 + 1.2 * R) * (0.6 + hash(i))) % (w + 240));
    const cy = y + 20 + hash(i * 3.3 + seed) * h * 0.35;
    return <ellipse key={i} cx={cx} cy={cy} rx={90 + hash(i * 5.1) * 90} ry={22 + hash(i * 7.7) * 18} fill={i % 2 ? "#2b3646" : "#3b4859"} opacity={0.35 + 0.45 * R} />;
  });
  return (
    <g>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#25303e" />
          <stop offset="55%" stopColor="#4a5869" />
          <stop offset="100%" stopColor="#6f8091" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
        {/* a drizzle lets the grey morning light through */}
        <rect x={x} y={y} width={w} height={h} fill="#c4d0db" opacity={0.32 * (1 - R)} />
        {clouds}
        <path
          d={`M ${x - 20} ${y + h * 0.72} Q ${x + w * 0.2} ${y + h * 0.6} ${x + w * 0.4} ${y + h * 0.68} Q ${x + w * 0.62} ${y + h * 0.58} ${x + w * 0.85} ${y + h * 0.66} Q ${x + w} ${y + h * 0.62} ${x + w + 20} ${y + h * 0.7} L ${x + w + 20} ${y + h} L ${x - 20} ${y + h} Z`}
          fill="#2a3440"
        />
        <OutPalm x={x + w * 0.22} y={y + h + 20} s={0.95} f={f} lf={lf} seed={seed} col="#1c242d" />
        <OutPalm x={x + w * 0.78} y={y + h + 30} s={1.1} f={f} lf={lf} seed={seed + 4} col="#1a2129" />
        <OutBanana x={x + w * 0.5} y={y + h + 10} s={1.05} f={f} lf={lf} seed={seed + 2} col="#202a26" />
        <rect x={x - 20} y={y + h * 0.86} width={w + 40} height={h * 0.2} fill="#3a4148" />
        <rect x={x - 20} y={y + h * 0.86} width={w + 40} height={4} fill="#5d6b78" opacity={0.6} />
        {ground}
        {thin}
        {/* the white mist of a heavy downpour */}
        <rect x={x} y={y} width={w} height={h} fill="#dfe8f0" opacity={0.02 + 0.42 * Math.pow(R, 1.6)} />
        {bands}
        {sheets}
        {streams}
        {drips}
        {/* lightning brightens the sky for a moment at the very heaviest */}
        <rect x={x} y={y} width={w} height={h} fill="#eef4fb" opacity={0.75 * fl} />
      </g>
    </g>
  );
};

/** Barred window with open wooden shutters (they knock in the gusts) and a wet sill where the splashes bounce. */
const RoomWindow: React.FC<{ id: string; x: number; y: number; w: number; h: number; f: number; lf: number; seed: number }> = ({ id, x, y, w, h, f, lf, seed }) => {
  const R = rainIntensity(f);
  const gust = gustAt(f, lf);
  const knock = (side: number) => (0.3 + 7 * gust) * (0.5 + 0.5 * noise1(lf * 0.21 + side, seed + 13));
  const bars = 5;
  return (
    <g>
      {/* cool daylight spilling onto the wall around the window (brighter in a drizzle) */}
      <ellipse cx={x + w / 2} cy={y + h * 0.7} rx={w * 0.95} ry={h * 0.9} fill="#c8d6e4" opacity={0.05 + 0.17 * (1 - R)} />
      <WindowView id={id} x={x} y={y} w={w} h={h} f={f} lf={lf} seed={seed} />
      <rect x={x - 20} y={y - 22} width={w + 40} height={22} fill="#4a2c18" />
      <rect x={x - 20} y={y} width={20} height={h} fill="#4a2c18" />
      <rect x={x + w} y={y} width={20} height={h} fill="#4a2c18" />
      {Array.from({ length: bars }, (_, i) => {
        const bx = x + ((i + 1) * w) / (bars + 1) - 5;
        return (
          <g key={i}>
            <rect x={bx} y={y} width={10} height={h} fill="#5a3820" />
            <rect x={bx + 1} y={y} width={3} height={h} fill="#7a5232" opacity={0.6} />
            <rect x={bx + 6} y={y} width={2} height={h} fill="#cfdbe8" opacity={0.04 + 0.35 * R} />
          </g>
        );
      })}
      <g transform={`translate(${x - 20}, ${y - 10}) skewY(${-knock(0)})`}>
        <path d={`M 0 0 L -${w * 0.28} 26 L -${w * 0.28} ${h - 6} L 0 ${h + 10} Z`} fill="#5e3a20" />
        <path d={`M -8 18 L -${w * 0.24} 38 L -${w * 0.24} ${h - 18} L -8 ${h - 4} Z`} fill="#4a2c18" opacity={0.6} />
      </g>
      <g transform={`translate(${x + w + 20}, ${y - 10}) skewY(${knock(1)})`}>
        <path d={`M 0 0 L ${w * 0.28} 26 L ${w * 0.28} ${h - 6} L 0 ${h + 10} Z`} fill="#5e3a20" />
        <path d={`M 8 18 L ${w * 0.24} 38 L ${w * 0.24} ${h - 18} L 8 ${h - 4} Z`} fill="#4a2c18" opacity={0.6} />
      </g>
      <rect x={x - 30} y={y + h} width={w + 60} height={18} fill="#6a4228" />
      <rect x={x - 30} y={y + h} width={w + 60} height={5} fill="#a9b9c9" opacity={0.08 + 0.4 * R} />
      {/* big splashes bouncing on the sill in a downpour, none in a drizzle */}
      {Array.from({ length: 28 }, (_, i) => {
        const hi = hash(i * 2.3 + seed + 70);
        const a = clamp((Math.pow(R, 1.4) - hi) * 6);
        if (a <= 0.01) return null;
        const period = 8 + Math.floor(hash(i * 1.9 + seed) * 6);
        const k = Math.floor((lf + hash(i * 7.1) * period) / period);
        const p = ((lf + hash(i * 7.1) * period) % period) / period;
        const sx = x + hash(i * 3.7 + k * 1.31 + seed) * w;
        const sy = y + h + 2;
        const r = 3 + p * (6 + 18 * R);
        const up = Math.sin(p * Math.PI) * (8 + 26 * R);
        return (
          <g key={i} opacity={a * (1 - p * 0.8) * 0.85}>
            <ellipse cx={sx} cy={sy} rx={r} ry={r * 0.3} fill="none" stroke="#e2ebf3" strokeWidth={1.5} />
            <circle cx={sx - r * 0.7} cy={sy - up} r={1.8} fill="#eef4fa" />
            <circle cx={sx + r * 0.6} cy={sy - up * 1.2} r={1.5} fill="#eef4fa" />
            <circle cx={sx} cy={sy - up * 0.7} r={1.3} fill="#eef4fa" />
          </g>
        );
      })}
      {/* drips off the sill edge */}
      {Array.from({ length: 6 }, (_, i) => {
        const dx = x + 20 + hash(i * 4.4 + seed) * (w - 40);
        const p = (lf * (0.02 + 0.07 * R) + hash(i * 2.2 + seed)) % 1;
        return <circle key={i} cx={dx} cy={y + h + 20 + p * 60} r={1.8} fill="#cfdbe8" opacity={(0.1 + 0.45 * R) * (1 - p)} />;
      })}
    </g>
  );
};

/** The back wall: the same warm plaster as the birth-ward scenes, beams above, the two windows, a niche and a shelf. */
const BackWall: React.FC<{ f: number; lf: number }> = ({ f, lf }) => (
  <g>
    <defs>
      <linearGradient id="ep2s1d2-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b8946c" />
        <stop offset="70%" stopColor="#9a7048" />
        <stop offset="100%" stopColor="#664228" />
      </linearGradient>
    </defs>
    {/* the wall runs on below the floor line so the parallax never opens a gap at the skirting */}
    <rect x={-900} y={-500} width={4000} height={2000} fill="url(#ep2s1d2-wall)" />
    {Array.from({ length: 18 }, (_, i) => (
      <ellipse
        key={i}
        cx={-400 + hash(i * 3.3) * 3000}
        cy={-40 + hash(i * 5.1) * 640}
        rx={60 + hash(i * 7.7) * 140}
        ry={30 + hash(i * 2.2) * 70}
        fill="#4a2c18"
        opacity={0.04 + hash(i) * 0.04}
      />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={i}
        d={`M ${-150 + i * 640 + hash(i) * 120} ${90 + hash(i * 2) * 140} l 10 22 l -7 18 l 12 26`}
        stroke="#3a2214"
        strokeWidth={1.4}
        fill="none"
        opacity={0.35}
      />
    ))}
    {/* ceiling beams */}
    <rect x={-900} y={-500} width={4000} height={540} fill="#3a2414" />
    <rect x={-900} y={30} width={4000} height={18} fill="#5a3820" />
    {Array.from({ length: 22 }, (_, i) => (
      <rect key={i} x={-860 + i * 190} y={-40} width={26} height={80} fill="#4a2c18" />
    ))}
    {/* dado: darker lower band */}
    <rect x={-900} y={620} width={4000} height={300} fill="#5a3820" opacity={0.35} />
    <RoomWindow id="ep2s1d2-w1" x={W1.x} y={W1.y} w={W1.w} h={W1.h} f={f} lf={lf} seed={3} />
    <RoomWindow id="ep2s1d2-w2" x={W2.x} y={W2.y} w={W2.w} h={W2.h} f={f} lf={lf} seed={11} />
    {/* niche with a clay lamp between the windows */}
    <path d="M 1080 470 L 1080 390 Q 1120 350 1160 390 L 1160 470 Z" fill="#3a2214" />
    <Glow x={1120} y={440} r={200} kind="warm" o={0.14 * flicker(lf, 61)} />
    <Flame x={1120} y={462} s={0.9} f={lf} seed={61} />
    <rect x={1100} y={466} width={40} height={8} rx={4} fill="#8a4a24" />
    {/* shelf with brass pots */}
    <rect x={920} y={300} width={300} height={14} fill="#5a3820" />
    {[960, 1040, 1130, 1190].map((x, i) => (
      <g key={x} transform={`translate(${x}, 300)`}>
        <ellipse cx={0} cy={-20 - i * 2} rx={18 + (i % 2) * 6} ry={22 + (i % 2) * 4} fill={i % 2 ? "#c9932e" : "#a87420"} />
        <rect x={-7} y={-48 - i * 3} width={14} height={8} fill="#8a6018" />
      </g>
    ))}
  </g>
);

/** The floor, with a cool sheen of window light. */
const Floor: React.FC<{ f: number }> = ({ f }) => {
  const R = rainIntensity(f);
  return (
    <g>
      <defs>
        <linearGradient id="ep2s1d2-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a4e2c" />
          <stop offset="100%" stopColor="#3e2412" />
        </linearGradient>
      </defs>
      <rect x={-900} y={FLOOR_Y} width={4000} height={900} fill="url(#ep2s1d2-floor)" />
      <rect x={-900} y={FLOOR_Y - 4} width={4000} height={8} fill="#2e1a0c" opacity={0.6} />
      <ellipse cx={W1C.x} cy={FLOOR_Y + 70} rx={340} ry={50} fill="#b9c8d8" opacity={0.08 + 0.06 * (1 - R)} />
      <ellipse cx={W2C.x} cy={FLOOR_Y + 70} rx={280} ry={44} fill="#b9c8d8" opacity={0.07 + 0.05 * (1 - R)} />
    </g>
  );
};

/** White rice-paste alpana: a lotus wheel with a dotted border, around the Brahmins' places. */
const Alpana: React.FC = () => {
  const petals = Array.from({ length: 12 }, (_, k) => k * 30);
  return (
    <g transform={`translate(${ALPANA_X}, 812) scale(0.8, ${0.8 * 0.26})`} fill="none" stroke="#efe9dc" strokeLinecap="round" opacity={0.85}>
      <circle r={40} strokeWidth={6} />
      <circle r={16} strokeWidth={5} />
      {petals.map((a) => (
        <path key={a} d="M 0 -54 Q 30 -110 0 -170 Q -30 -110 0 -54" strokeWidth={6} transform={`rotate(${a})`} />
      ))}
      {petals.map((a) => (
        <path key={`v${a}`} d="M 0 -196 q 34 -22 26 -58 q -12 18 -26 10" strokeWidth={5} transform={`rotate(${a + 15})`} />
      ))}
      {Array.from({ length: 40 }, (_, k) => (
        <circle key={k} cx={Math.cos((k / 40) * Math.PI * 2) * 300} cy={Math.sin((k / 40) * Math.PI * 2) * 300} r={7} fill="#efe9dc" stroke="none" />
      ))}
      <circle r={276} strokeWidth={5} />
    </g>
  );
};

/** A woven asan (kusha mat) with a red border, waiting for a Brahmin. */
const Asan: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path d="M -56 -18 L 56 -18 L 66 18 L -66 18 Z" fill="#b8933f" />
    {Array.from({ length: 9 }, (_, i) => (
      <line key={i} x1={-50 + i * 12.5} y1={-16} x2={-58 + i * 14.5} y2={16} stroke="#8e6c28" strokeWidth={1.4} opacity={0.6} />
    ))}
    <path d="M -56 -18 L 56 -18 L 66 18 L -66 18 Z" fill="none" stroke="#9a2a22" strokeWidth={6} />
    <path d="M -46 -10 L 46 -10 L 53 10 L -53 10 Z" fill="none" stroke="#e2b13c" strokeWidth={1.6} opacity={0.8} />
  </g>
);

/** A brass plate with sandesh, laddoos, a banana and flowers; a brass water glass beside it. */
const Plate: React.FC<{ x: number; y: number; seed: number }> = ({ x, y, seed }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx={0} cy={4} rx={46} ry={14} fill="#2e1a0c" opacity={0.35} />
    <ellipse cx={0} cy={0} rx={44} ry={13} fill="#b88a2a" />
    <ellipse cx={0} cy={-1} rx={38} ry={10} fill="#d8ac48" />
    <ellipse cx={-10} cy={-3} rx={16} ry={4} fill="#f6dc8a" opacity={0.6} />
    {/* banana */}
    <path d="M -30 -4 Q -16 4 6 -6 Q -14 -1 -30 -8 Z" fill="#e8c232" stroke="#a88a1e" strokeWidth={1} />
    {/* sandesh and laddoos */}
    {[-4, 8, 20].map((sx, i) => (
      <ellipse key={i} cx={sx} cy={-6 - (i % 2) * 2} rx={6} ry={4} fill="#f6f0e2" stroke="#d8cfba" strokeWidth={0.8} />
    ))}
    {[14, 26].map((sx, i) => (
      <circle key={i} cx={sx} cy={-11 - i} r={5} fill="#e89a2a" stroke="#b8701a" strokeWidth={0.8} />
    ))}
    {/* a red jaba and marigolds */}
    <circle cx={-22} cy={-10} r={4.5} fill="#c8202a" />
    <circle cx={30 - (seed % 2) * 6} cy={-4} r={4} fill="#f29a1a" />
    <circle cx={-34} cy={-1} r={3.5} fill="#f2b21a" />
    {/* brass ghoti */}
    <g transform="translate(58, -4)">
      <ellipse cx={0} cy={6} rx={10} ry={3} fill="#2e1a0c" opacity={0.35} />
      <path d="M -9 4 Q -12 -8 -6 -14 L 6 -14 Q 12 -8 9 4 Z" fill="#c9932e" />
      <ellipse cx={0} cy={-14} rx={7} ry={2.4} fill="#e2b85a" />
      <path d="M -5 -2 Q -6 -8 -3 -11" stroke="#f6dc8a" strokeWidth={1.4} fill="none" opacity={0.7} />
    </g>
  </g>
);

/** The Shashthi ghot: a brass pot with mango leaves and a green coconut, on a small alpana. */
const Ghot: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx={0} cy={4} rx={40} ry={10} fill="none" stroke="#efe9dc" strokeWidth={2.5} opacity={0.8} />
    <path d="M -24 0 Q -34 -26 -18 -44 L 18 -44 Q 34 -26 24 0 Z" fill="#c08a2a" />
    <path d="M -14 -6 Q -22 -26 -10 -40" stroke="#f0cf78" strokeWidth={3} fill="none" opacity={0.55} />
    <path d="M -24 -24 Q 0 -18 24 -24" stroke="#9a2a22" strokeWidth={3} fill="none" opacity={0.8} />
    {[-40, -20, 0, 20, 40].map((a, i) => (
      <path key={i} d="M 0 0 Q 6 -14 0 -32 Q -6 -14 0 0 Z" fill="#3f7a32" transform={`translate(0, -46) rotate(${a})`} />
    ))}
    <ellipse cx={0} cy={-62} rx={15} ry={17} fill="#5d8a2e" />
    <ellipse cx={-5} cy={-66} rx={5} ry={6} fill="#86b048" opacity={0.6} />
  </g>
);

/** The lit pradip on its brass stand (pilsuj). */
const Pradip: React.FC<{ x: number; y: number; f: number }> = ({ x, y, f }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx={0} cy={2} rx={26} ry={7} fill="#2e1a0c" opacity={0.4} />
    <path d="M -22 0 Q 0 -10 22 0 L 16 -8 Q 0 -14 -16 -8 Z" fill="#b88a2a" />
    <rect x={-3.5} y={-128} width={7} height={122} fill="#c9932e" />
    <rect x={-1} y={-128} width={2} height={122} fill="#f0cf78" opacity={0.6} />
    {[-40, -84].map((yy) => (
      <ellipse key={yy} cx={0} cy={yy} rx={8} ry={4} fill="#b88a2a" />
    ))}
    <path d="M -18 -128 Q 0 -120 18 -128 Q 12 -136 0 -136 Q -12 -136 -18 -128 Z" fill="#c9932e" />
    <Glow x={0} y={-150} r={180} kind="warm" o={0.22 * flicker(f, 21)} />
    <Flame x={10} y={-134} s={1.1} f={f} seed={21} />
  </g>
);

/** Low wooden cot with a folded kantha (running-stitch quilt) under the baby. */
const Cot: React.FC = () => {
  const { x, top, w } = COT;
  const l = x - w / 2;
  return (
    <g>
      <ellipse cx={x} cy={792} rx={w * 0.6} ry={14} fill="#1e1008" opacity={0.4} />
      {[l + 14, l + w - 22].map((lx, i) => (
        <rect key={i} x={lx} y={top + 16} width={12} height={74} fill="#4a2c18" />
      ))}
      <rect x={l} y={top} width={w} height={24} rx={3} fill="#6a4228" />
      <rect x={l} y={top} width={w} height={6} fill="#8a5a34" />
      {/* kantha: folded quilt with rows of running stitches */}
      <path d={`M ${l + 8} ${top + 2} Q ${l + 4} ${top - 18} ${l + 22} ${top - 22} L ${l + w - 20} ${top - 22} Q ${l + w - 4} ${top - 18} ${l + w - 8} ${top + 2} Z`} fill="#e9dcc4" />
      {[0, 1, 2].map((r) => (
        <path
          key={r}
          d={`M ${l + 20} ${top - 16 + r * 6} L ${l + w - 20} ${top - 16 + r * 6}`}
          stroke={["#b8292f", "#2f6b8f", "#c98a1e"][r]}
          strokeWidth={1.4}
          strokeDasharray="5 4"
          opacity={0.75}
        />
      ))}
      <path d={`M ${l + 8} ${top + 2} L ${l + w - 8} ${top + 2}`} stroke="#c9b898" strokeWidth={2} />
      {/* a small pillow under his head */}
      <ellipse cx={BABY_HEAD.x - 6} cy={top - 22} rx={30} ry={9} fill="#f5efe2" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/** Real (played) windows of every voice part in the scene: the rain ducks a little under them, never in a pause. */
const VOICE_REAL: [number, number][] = [
  ...voicePartsReal("01d2a_Narrator_Inside.wav"),
  ...voicePartsReal("01d2b_Thakurma_Rain.wav"),
  ...voicePartsReal("01d2c_Surendra_Awe.wav"),
];

/** Pause sounds (approved plan, real local frames): P1 distant thunder, P2 thunder with the flash, P3 her sari. */
const PAUSE_SFX: { at: number; file: string; volume: number; frames: number }[] = [
  ...(PAUSES[0] ? [{ at: P_S[0] + 4, file: "thunder_roll", volume: 0.25, frames: 130 }] : []),
  { at: THUNDER_AT, file: "thunder_roll", volume: 0.3, frames: 130 },
  ...(PAUSES[2] ? [{ at: P_S[2] + 10, file: "cloth_rustle", volume: 0.15, frames: 32 }] : []),
];

export const Scene01d2HandsMiracle: React.FC = () => {
  // f: story clock (holds in the pauses) for every story action; lf: real clock for life, rain motion and the camera
  const { f, lifeF: lf, pause } = useStory(SCENE_ID);
  const R = rainIntensity(f);
  const fl = flashAt(lf);
  // P3: the baby's glow brightens gently in the held moment (a key beat), then settles
  const p3Glow = pause.inPause && pause.index === 2 ? sineRamp(pause.t, 0.05, 0.4) * (1 - sineRamp(pause.t, 0.72, 1)) : 0;
  const kb = Math.max(keyBeat(f), 0.9 * p3Glow);
  /** Life clock at a story sample fr (the rigs sample poses around f): keeps idle noise and pause moments smooth. */
  const lifeAt = (fr: number) => lf + (fr - f);
  // The Puppet blinks at the end of a spoken phrase by reading talk(f - k) on the story clock. P3 begins right after
  // her last word, so with the story held that end-of-speech blink froze half-closed (0.65) for the whole pause and
  // made her look sleepy. Around P3 her talk reads silent; her natural life-clock blinks go on.
  const thakQuiet = PAUSES[2] !== undefined && lf >= P_S[2] - 2 && lf < P_E[2] + 12;
  const thakTalk = (fr: number) => (thakQuiet ? 0 : THAK_LIPS.talk(fr));

  const { cam: c } = camAt(lf);
  const cam: Cam = { ...c, focus: 1, dof: 2.2 };
  /** Is a main-layer box (world x0..x1, y0..y1) on screen in this shot? Off-screen figures are not drawn. */
  const onScreen = (x0: number, x1: number, y0: number, y1: number) => {
    const m = 120;
    const sx0 = 960 + c.zoom * (x0 - c.x - 960);
    const sx1 = 960 + c.zoom * (x1 - c.x - 960);
    const sy0 = 540 + c.zoom * (y0 - c.y - 540);
    const sy1 = 540 + c.zoom * (y1 - c.y - 540);
    return sx1 > -m && sx0 < 1920 + m && sy1 > -m && sy0 < 1080 + m;
  };
  const showBaby = onScreen(BABY.x - 140, BABY.x + 140, BABY.y - 140, BABY.y + 80);
  const showCharu = onScreen(CHARU.x - 200, CHARU.x + 220, CHARU.y - 320, CHARU.y + 20);
  const showFig = (x: number, y: number, h = 520) => onScreen(x - 190, x + 190, y - h, y + 20);

  // the baby: eyes open and bright, serene faint smile, gaze on his hands / the window while he waves
  const wave = wavePropAt(f);
  const gest = gestureCurve(f);
  const active = Math.max(wave, gest);
  const babySmile = 0.42 + 0.1 * kb + 0.06 * active;
  const lookY = lerp(-0.25, -0.6, smooth01(active * 1.5));
  const gaze = lerp(-0.25, 0.15, smooth01(active * 1.5)) + noise1(lf * 0.02, 5) * 0.08;

  // room light: dimmer and cooler as the rain thickens; the lamp flickers
  const lamp = flicker(lf, 21);
  const lights: SceneLight[] = [
    { x: PRADIP.x, y: PRADIP.y - 140, color: "#ffb35a", intensity: 0.42, radius: 1100, flicker: 21 },
    { x: W1C.x, y: W1C.y + 80, color: "#c3d1e0", intensity: 0.1 + 0.34 * (1 - R) + 0.4 * fl, radius: 900 },
    { x: W2C.x, y: W2C.y + 80, color: "#c3d1e0", intensity: 0.08 + 0.3 * (1 - R) + 0.35 * fl, radius: 800 },
  ];
  const coolRim = "#b4c6da";

  // sound: the rain loops follow the same curve. The volume callbacks get REAL frames: the intensity is read on the
  // story clock through the pauses (rainIntensityReal), so the sound follows the picture; ducked a little under the
  // voice parts only (not in the pauses), and every loop stays at 0.25 or below.
  const voiceAt = (g: number) => VOICE_REAL.reduce((m, [a, b]) => Math.max(m, bump(g, a - 4, b + 4, 6)), 0);
  const fadeIn = (g: number) => clamp((g + 2) / 10);
  // the episode starts its own soft rain_on_thatch bed in the breath at the end, so this loop hands over to it
  const handOver = (g: number) => 1 - 0.7 * sineRamp(g, BREATH_AT - 8, BREATH_AT + 16);
  const thatchVol = (g: number) => clamp((0.055 + 0.065 * rainIntensityReal(g)) * (1 - 0.2 * voiceAt(g)) * fadeIn(g) * handOver(g), 0, 0.25);
  const heavyVol = (g: number) => clamp(0.19 * Math.pow(rainIntensityReal(g), 1.4) * (1 - 0.25 * voiceAt(g)) * fadeIn(g), 0, 0.25);

  return (
    <Stage cam={cam} background="#2a1e14">
      <Audio src={staticFile("audio/sfx/ep02/rain_on_thatch.wav")} loop volume={thatchVol} />
      <Audio src={staticFile("audio/sfx/monsoon_rain.wav")} loop volume={heavyVol} />
      {PAUSE_SFX.map((q) => (
        <Sequence key={`${q.file}-${q.at}`} from={q.at} durationInFrames={q.frames} layout="none">
          <Audio src={staticFile(`audio/sfx/ep02/${q.file}.wav`)} volume={(g) => q.volume * clamp((q.frames - g) / 20)} />
        </Sequence>
      ))}
      <SceneLights.Provider value={lights}>
        <Layer depth={WALL_D}>
          <GlowDefs />
          <BackWall f={f} lf={lf} />
        </Layer>
        <Layer depth={1}>
          <DivineDefs />
          <Floor f={f} />
          <Alpana />
          <Ghot x={ASANS[1]} y={704} />
          <Pradip x={PRADIP.x} y={PRADIP.y} f={lf} />
          {ASANS.map((x) => (
            <Asan key={x} x={x} y={ASAN_Y} />
          ))}
          {ASANS.map((x, i) => (
            <Plate key={x} x={x - 6} y={ASAN_Y + 42} seed={i} />
          ))}
          {/* flowers heaped on a banana leaf */}
          <path d={`M ${ALPANA_X - 50} 846 Q ${ALPANA_X - 10} 824 ${ALPANA_X + 40} 842 Q ${ALPANA_X - 4} 858 ${ALPANA_X - 50} 846 Z`} fill="#4f8a3a" />
          {[-38, -24, -10, 4, 18, -16, -2].map((dx, i) => (
            <circle key={i} cx={ALPANA_X + dx} cy={838 - (i > 4 ? 7 : 0)} r={6} fill={i % 3 === 0 ? "#c8202a" : "#f29a1a"} />
          ))}
          <Cot />
          {showCharu && (
            <Puppet
              cast={CAST.charu}
              f={f}
              lifeF={lf}
              x={CHARU.x}
              y={CHARU.y}
              scale={CHARU.s}
              seated
              acting={(fr) => charuFrame(fr, lifeAt(fr))}
              light={{ keySide: 1, rim: coolRim, rimStrength: 0.35, brightness: 1 - 0.06 * R }}
            />
          )}
          {showBaby && (
            <BabyThakur
              f={babyClock(lf)}
              lifeF={babyLife(lf)}
              x={BABY.x}
              y={BABY.y}
              s={BABY.s}
              awake={1}
              aura={1 + 0.22 * kb}
              smile={babySmile}
              lookY={lookY}
              gaze={gaze}
              turn={0.05}
              headRoll={-40}
              wiggle={lerp(0.15, 0.7, smooth01(active * 2))}
              wave={wave}
              bless={gest}
              kick={0.25 * wave}
            />
          )}
          {showFig(THAKURMA_POS.x, THAKURMA_POS.y, 360) && (
            <Puppet
              cast={THAKURMA}
              f={f}
              lifeF={lf}
              x={THAKURMA_POS.x}
              y={THAKURMA_POS.y}
              scale={THAKURMA_POS.s}
              seated
              acting={(fr) => thakWithPauses(fr, lifeAt(fr))}
              mouth={THAK_LIPS.mouth}
              talk={thakTalk}
              sigh={(fr) => thakSigh(lifeAt(fr))}
              light={{ keySide: -1, rim: coolRim, rimStrength: 0.45, brightness: 1 - 0.08 * R }}
            />
          )}
          {showFig(WOMAN.x, WOMAN.y, 320) && (
            <Puppet
              cast={CAST.womanA}
              f={f}
              lifeF={lf}
              x={WOMAN.x}
              y={WOMAN.y}
              scale={WOMAN.s}
              seated
              acting={(fr) => womanFrame(fr, lifeAt(fr))}
              light={{ keySide: -1, rim: coolRim, rimStrength: 0.4, brightness: 1 - 0.08 * R }}
            />
          )}
          {showFig(SURENDRA_POS.x, SURENDRA_POS.y) && (
            <Puppet
              cast={SURENDRA}
              f={f}
              lifeF={lf}
              x={SURENDRA_POS.x}
              y={SURENDRA_POS.y}
              scale={SURENDRA_POS.s}
              acting={(fr) => sureFrame(fr, lifeAt(fr))}
              mouth={SURE_LIPS.mouth}
              talk={SURE_LIPS.talk}
              light={{ keySide: -1, rim: coolRim, rimStrength: 0.45, brightness: 1 - 0.08 * R }}
            />
          )}
        </Layer>
        <Layer depth={1.3}>
          <Bokeh f={lf} n={7} seed={53} color="#ffc46b" area={[-600, -200, 4000, 1300]} size={[6, 18]} rise={0.25} />
        </Layer>
        <Grade
          warmth={0.3 * (0.92 + 0.08 * lamp) * (1 - 0.3 * R)}
          vignette={0.6}
          tint="#8794aa"
          tintAmount={0.05 + 0.26 * R}
          flash={0.24 * fl}
          flashColor="#dce8f6"
          bloomAt={[50, 52]}
          grain={0.05}
        />
      </SceneLights.Provider>
    </Stage>
  );
};

/** Exposed for QA: the shot starts (real local frames) and the scene's story length. */
export const HANDS_MIRACLE_SHOTS = SHOTS.map((s) => s.from);
export const HANDS_MIRACLE_STORY_FRAMES = SCENE_STORY_FRAMES;
