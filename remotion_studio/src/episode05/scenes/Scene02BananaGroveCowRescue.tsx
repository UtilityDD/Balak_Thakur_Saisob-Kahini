import React from "react";
import { clamp, EASE, lerp, makeActing, PoseKey, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { cowTug, GentleCow, GentleCowProps, solveGentleCow } from "../../cinematic/animals/GentleCow";
import { CAST } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../../cinematic/rig/lipsync";
import {
  BASE_POSE,
  bambooThump,
  GESTURES5,
  headShake as puppetHeadShake,
  jabPulse,
  Lighting,
  Pose,
  Puppet,
  throwUpPulse,
  turnBody,
  walkPose,
  WalkOpts,
  walkTravel,
} from "../../cinematic/rig/Puppet";
import {
  KACHARI,
  KACHARI_BG,
  KachariBackdrop,
  KachariFloorLayer,
  KachariForegroundLayer,
  kachariGrade,
  kachariKeepInSet,
  KachariLightLayer,
  trellisPoint,
} from "../../cinematic/sets/KrishnanagarKachari";
import { ujancharBgBlur, ujancharBgFilter } from "../../cinematic/sets/UjancharHouse";
import { clipLocalStory5, clipSpan5, cueLocalStory5, gapsFor5, pausesFor5, storyToReal, useStory5 } from "../../episode/storyClock";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { PebblesArt, SeatedChild, SeatedPose } from "../../episode03/rig/SeatedChild";
import { EP05_SCENES } from "../timing";

/**
 * Episode 5, scene 02 (02_banana_grove_cow_rescue): the cow in the banana grove behind the Krishnanagar kachari.
 * Approved plan STO-20: 03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/01_Script_and_Storyboard/
 * Ep05_Shots_and_Pauses_DRAFT.md, "Scene 02". Book chapter 9 (book.xlsx row 15).
 *
 * Set: KrishnanagarKachari view "grove" (warm early afternoon), composed plane by plane so the cow can walk on the floor
 * plane and then stand hidden in the set's cow slot (between KachariGroveBehindCowLayer and KachariGroveCowScreenLayer).
 * Balak (SeatedChild design "plate", age 6) sits cross-legged under the banana plants facing LEFT (flip) toward the
 * path and the back door, so Haricharan stands on his left and the hidden cow is BEHIND him (his eyes never go to her);
 * in P3 (a cut) he faces right, toward the cow who comes out from the trunks (the Episode 4 glimpse composition).
 *
 * Shots (CAM-13; hard cuts keyed to narration cues; one move per line at most; close-ups 6 to 8 f before the speaker):
 *   1 WIDE      P1 open + "ছয় বছরের বীরু…": the grove, the back wall, door, trellis (whole), Balak playing pebbles. Held.
 *               (The fade-in from the chapter-break black is Episode05.tsx's, on the Sequence's real frame, as Episode 4.)
 *   2 push      from "চুপচাপ": slow push to a medium wide on Balak (hands still, looking up into the leaves), settling in
 *               the voice's own quiet after the sentence.
 *   3 TRELLIS   cut on "একদিন" (voice): the cow at the trellis tears the vine (tugs), cucumber, the root comes up.
 *   4 WIDE2     cut on "হরিচরণ" (voice): the door bangs open, Haricharan bursts out with his bamboo, runs to the wreck and
 *               glares about; the cow (a beat later, by the wreck, chewing) throws up her head and trots off right.
 *   AG1 MED     cut at the gap: a medium on Balak. (a) the cow walks past behind him and stops behind the banana clump
 *               (ear and tail only); he watches her go, then looks back down to his pebbles. (b) Haricharan pounds in
 *               from the left and stops short over him; Balak looks up.
 *   5-6 HMCU    cut 7 f before "এই বীরু!": Haricharan, eye level, panting, bamboo upright; jab 7 f before "কোন দিকে".
 *   P2, 7 BCU   cut at the pause: Balak's close-up; his eyes lower for a moment and lift again (never to the cow); held
 *               into "দেখলেও বলব না হরিচরণদা!".
 *   8-9 TWO     cut on "বলে দিলে": the two-shot in profile (Haricharan left, Balak right); Balak's small open palm lifted
 *               toward the bamboo, then a gentle point off left to the torn trellis on "ওর খিদে পেয়েছিল".
 *   10-11 push  from "ও কি আর": slow push into a medium close-up on Balak (head shake), settling by the line's end;
 *               held through "আমি ওর খবর বলতে পারব না!".
 *   AG2 WIDEX   cut as his voice ends: Haricharan throws up his hand, thumps the bamboo once, turns and stomps back along
 *               the path into the back door; Balak watches him go.
 *   P3 COW      cut at the pause: Balak alone under the plants, the cow's head comes out from the trunks, she lowers her
 *               muzzle to his raised palm, he strokes her face; his glow brightens gently (the episode's second beat).
 *
 * Clocks: `f` story (holds in P1/P2/P3; runs through AG1/AG2): choreography, mouths, camera keys. `lifeF` real: every rig's
 * lifeF, leaves, light, glow motes. Balak's pebble play in P1 runs on `bf` (lifeF - 24 during P1, = f after), so the
 * pebble is laid during the open pause. P2's eye movement is keyed on the pause's own t. P3 runs on its own clock
 * `pc` = real frames since P3 began (story is held there): the cow's step-out and nuzzle, Balak's strokeCow, the glow.
 * Every cue comes from cueLocalStory5 / clipLocalStory5; offsets inside a clip are the measured voice onsets
 * (plan "Measured silences").
 */

const SCENE_ID = "02_banana_grove_cow_rescue";
const SCENE = EP05_SCENES.find((s) => s.sceneId === SCENE_ID);
const SCENE_START = SCENE?.startFrame ?? 1254;
const DUR = SCENE?.durationFrames ?? 985;
const PAUSES = pausesFor5(SCENE_ID);
const GAPS = gapsFor5(SCENE_ID);
const real = (story: number) => storyToReal(story, PAUSES);
const io = "inOut" as const;

/* ------------------------------------------------------------------ */
/* Narration anchors (story frames, scene-local)                        */
/* ------------------------------------------------------------------ */

const cue = (snip: string, fb: number) => cueLocalStory5(snip, SCENE_ID) ?? { from: fb, to: fb + 40 };
const A0 = clipLocalStory5("02a_Narrator_Cow.wav", SCENE_ID)?.from ?? 0;
const B0 = clipLocalStory5("02b_Haricharan.wav", SCENE_ID)?.from ?? 383;
const C0 = clipLocalStory5("02c_Thakur_Truth.wav", SCENE_ID)?.from ?? 473;
const K = {
  /** "চুপচাপ বসে থাকতে ভালোবাসত।" (phrase cue = voice 3.50 s) */
  chupchap: cue("চুপচাপ", A0 + 84).from,
  /** "একদিন" by the VOICE (7.13 s; the caption phrase starts about 1 s early) */
  ekdin: A0 + 171,
  /** "হরিচরণ" by the voice (9.32 s; the last word of the caption phrase "…ফেলায় হরিচরণ") */
  hari: A0 + 224,
  /** Haricharan's first word "এই বীরু!" (voice 0.11 s) */
  eiBiru: B0 + 3,
  /** "কোন দিকে" (voice about 2.29 s) */
  konDike: B0 + 55,
  /** "বলে দিলে" (phrase cue; voice 2.27 s) */
  bole: cue("বলে দিলে", C0 + 54).from,
  /** "ওর খিদে পেয়েছিল" (voice 4.89 s) */
  khide: cue("ওর খিদে", C0 + 117).from,
  /** "ও কি আর বুঝেছে…" and its end */
  oKi: cue("ও কি আর", C0 + 175).from,
  oKiEnd: cue("ও কি আর", C0 + 249).to,
  /** "আমি ওর খবর বলতে পারব না!" */
  ami: cue("আমি ওর খবর", C0 + 249).from,
  /** Balak's voice ends (12.55 s) */
  balakEnd: C0 + 301,
};
const P2_STORY = PAUSES[1]?.atStory ?? 462;
const P3_STORY = PAUSES[2]?.atStory ?? 851;
const P2_REAL = real(P2_STORY);
const P3_REAL = real(P3_STORY);
const AG1 = GAPS[0] ?? { fromStory: 310, frames: 60, beats: [] };
const AG1_B = AG1.beats.find((b) => b.id === "b_haricharan_arrives")?.fromStory ?? AG1.fromStory + 36;
const AG2_FROM = GAPS[1]?.fromStory ?? 791;

/** Shot boundaries (story frames). */
const CUT = {
  trellis: K.ekdin,
  wide2: K.hari,
  med: AG1.fromStory,
  hmcu: K.eiBiru - 7,
  two: K.bole - 1,
  agWide: K.balakEnd + 2,
};

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

interface Frame {
  cx: number;
  cy: number;
  z: number;
}
const FR: Record<string, Frame> = {
  wide: { cx: 960, cy: 580, z: 1.0 },
  medWide: { cx: 1430, cy: 740, z: 1.9 },
  trellis: { cx: 600, cy: 742, z: 1.62 },
  wide2: { cx: 860, cy: 610, z: 1.1 },
  med: { cx: 1470, cy: 742, z: 1.85 },
  hmcu: { cx: 982, cy: 628, z: 3.2 }, // Balak just out of frame right (no face in the captions band)
  bcu: { cx: 1398, cy: 800, z: 3.0 },
  two: { cx: 1222, cy: 702, z: 1.55 },
  bmcu: { cx: 1420, cy: 792, z: 2.5 },
  agWide: { cx: 900, cy: 620, z: 1.08 },
  p3: { cx: 1480, cy: 752, z: 2.3 },
};
const camOf = (fr: Frame): Cam => kachariKeepInSet("grove", { x: fr.cx - 960, y: fr.cy - 540, zoom: fr.z, focus: 1, dof: 0, shake: 0 });
const mixFrame = (a: Frame, b: Frame, t: number): Frame => {
  // zoom eases in log space so the push feels even
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), t));
  return { cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), z };
};
const CAMS = {
  wide2: camOf(FR.wide2),
  med: camOf(FR.med),
  agWide: camOf(FR.agWide),
  p3: camOf(FR.p3),
};

type ShotId = "wide" | "trellis" | "wide2" | "med" | "hmcu" | "bcu" | "two" | "agWide" | "p3";
const shotAt = (f: number, lifeF: number): ShotId => {
  if (lifeF >= P3_REAL) return "p3";
  if (lifeF >= P2_REAL && f <= P2_STORY) return "bcu";
  if (f < CUT.trellis) return "wide";
  if (f < CUT.wide2) return "trellis";
  if (f < CUT.med) return "wide2";
  if (f < CUT.hmcu) return "med";
  if (f < P2_STORY) return "hmcu";
  if (f < CUT.two) return "bcu";
  if (f < CUT.agWide) return "two";
  return "agWide";
};
const camAt = (shot: ShotId, f: number): Cam => {
  switch (shot) {
    case "wide": {
      // shot 1 held; shot 2: the slow push from "চুপচাপ", settling in the voice's quiet after the sentence
      const t = EASE.inOut(clamp((f - K.chupchap) / 62));
      return camOf(mixFrame(FR.wide, FR.medWide, t));
    }
    case "two": {
      // shots 8-9 held; 10: the slow push from "ও কি আর", settling by the line's end; 11 held
      const t = EASE.inOut(clamp((f - K.oKi) / Math.max(30, K.oKiEnd - K.oKi)));
      return camOf(mixFrame(FR.two, FR.bmcu, t));
    }
    case "trellis":
      return camOf(FR.trellis);
    case "wide2":
      return CAMS.wide2;
    case "med":
      return CAMS.med;
    case "hmcu":
      return camOf(FR.hmcu);
    case "bcu":
      return camOf(FR.bcu);
    case "agWide":
      return CAMS.agWide;
    case "p3":
      return CAMS.p3;
  }
};

/* Plane conversions for a static cam (the cow and Haricharan change planes: floor 1 <-> cow slot 0.85 / doorway 0.8). */
const toScreen = (p: { x: number; y: number }, d: number, c: Cam) => {
  const s = Math.pow(c.zoom, d);
  return { x: 960 + s * (p.x - 960 - c.x * d), y: 540 + s * (p.y - 540 - c.y * d) };
};
const fromScreen = (p: { x: number; y: number }, d: number, c: Cam) => {
  const s = Math.pow(c.zoom, d);
  return { x: 960 + (p.x - 960) / s + c.x * d, y: 540 + (p.y - 540) / s + c.y * d };
};
/** A point (and a scale) on plane d1 expressed on plane d2 for the same screen position. */
const planeTo = (p: { x: number; y: number; s?: number }, d1: number, d2: number, c: Cam) => {
  const q = fromScreen(toScreen(p, d1, c), d2, c);
  return { x: q.x, y: q.y, s: (p.s ?? 1) * Math.pow(c.zoom, d1 - d2) };
};

/* ------------------------------------------------------------------ */
/* Lip sync (real voice envelopes)                                      */
/* ------------------------------------------------------------------ */

/** Per-frame RMS envelopes (24 fps, 0..1) of public/audio/ep05/02b_Haricharan.wav and 02c_Thakur_Truth.wav. */
const ENV: Record<string, number[]> = {
  "02b_Haricharan.wav": [
    0, 0, 0.22, 0.63, 0.67, 0.71, 0.64, 0.43, 0.61, 1, 0.73, 0.88, 0.79, 0.61, 0.27, 0.04, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.55, 0.53, 0.51, 0.52, 0.33, 0.69, 0.71, 0.5, 0.69, 1, 0.52,
    0.12, 0.82, 0.71, 0.33, 0, 0, 0, 0.13, 0.27, 0.16, 0.17, 0.25, 0.28, 0.33, 1, 0.95, 0.59, 0.3, 0.93, 0.47, 0.43, 0.85, 0.76, 0.55, 0.6, 0.26, 0.72, 0.22, 0.72, 0.43, 0.29, 0.4, 0.23,
    0.09, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  "02c_Thakur_Truth.wav": [
    0, 0, 0.31, 0.62, 0.51, 0.53, 1, 0.71, 0, 0, 0.16, 0.74, 1, 1, 1, 0.55, 0.16, 0.85, 0.98, 0.94, 0.86, 0.29, 0.6, 0.86, 0.76, 0.54, 0.39, 0.42, 0.44, 0.26, 0.5, 0.7, 0.5, 0.51, 0.17, 0.48,
    0.59, 0.44, 0.47, 0.38, 0.44, 0.45, 0.51, 0.34, 0.16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.05, 0.08, 0.08, 0.05, 0, 0.45, 0.46, 0.57, 0.88, 0.68, 0.56, 0.7, 0.43, 0.09, 0.87, 0.31, 0.8, 0.73,
    0.06, 0.53, 0.85, 0.7, 0.42, 0.1, 0.52, 0.96, 0.77, 0.59, 0.1, 0.38, 0.79, 0.71, 0.78, 0.65, 0.67, 0.59, 0.64, 0.64, 0.62, 0.66, 0.47, 0.34, 0, 0.19, 0.37, 0.26, 0.21, 0.19, 0.14, 0.1,
    0.05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.75, 0.82, 0.42, 0, 0, 0.08, 0.14, 0.16, 0.11, 0.06, 0.18, 0.1, 0.97, 0.73, 0.09, 0, 0.46, 0.35, 0.3, 0.19, 0.21, 0.34, 0.2, 0.37, 0.17,
    0.11, 0.27, 0.12, 0.07, 0, 0, 0, 0, 0.2, 0.49, 0.41, 0.26, 0, 0.08, 0.13, 0.08, 0.56, 0.61, 0.58, 0.38, 0.21, 0.25, 0.11, 0.3, 0.16, 0.06, 0, 0, 0, 0, 0, 0.06, 0.08, 0.06, 0.05, 0,
    0.67, 0.88, 0.21, 0.1, 0.16, 0.76, 1, 0.82, 0.68, 0.36, 0.18, 0.29, 0.54, 0.77, 0.43, 0.28, 0.85, 0.82, 0.3, 0.5, 0.17, 0.61, 0.65, 0.57, 0.42, 0.53, 0.65, 0.32, 0, 0, 0.06, 0.38, 0.61,
    0.6, 0.63, 0.52, 0.42, 0.78, 0.67, 0.5, 0.24, 0.28, 0.23, 0.47, 0.69, 0.61, 0.56, 0.52, 0.46, 0.53, 0.48, 0.45, 0.49, 0.23, 0.26, 0.59, 0.45, 0.41, 0.19, 0.08, 0.21, 0.19, 0.07, 0, 0,
    0, 0, 0, 0, 0.08, 0.11, 0.12, 0.13, 0.17, 0.05, 0.32, 1, 1, 0.93, 0.73, 0.95, 0.8, 0.88, 0.82, 0.81, 0.75, 0.6, 0.09, 0.44, 0.26, 0.19, 0.46, 0.61, 0.24, 0.26, 0.67, 0.79, 0.77, 0.38,
    0.2, 0.3, 0.59, 0.54, 0.34, 0.09, 0.24, 0.69, 0.27, 0, 0.36, 0.44, 0.47, 0.45, 0.26, 0.06, 0.19, 0.24, 0.16, 0.12, 0.15, 0.1, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};
const TEXT: Record<string, string> = {
  "02b_Haricharan.wav": "এই বীরু! তাড়াতাড়ি বল তো, গরুটা কোন দিকে গেছে?",
  "02c_Thakur_Truth.wav": "দেখলেও বলব না হরিচরণদা! বলে দিলে তো আপনি ওকে মারবেন। ওর খিদে পেয়েছিল, তাই খেয়েছে— ও কি আর বুঝেছে আপনার গাছ না আমার গাছ? আমি ওর খবর বলতে পারব না!",
};
/** The clip and its relative frame playing at REAL local frame lf (null outside the clip: silent in pauses). */
const voiceAt = (file: string, lf: number) => {
  const span = clipSpan5(file);
  if (!span) return null;
  const abs = SCENE_START + lf;
  for (const p of span.parts) if (abs >= p.startFrame && abs < p.startFrame + p.frames) return { env: ENV[file], rel: abs - p.startFrame, text: TEXT[file] };
  return null;
};
/** Phrase-level speech envelope (on while any frame within 6 is voiced), for quieter breathing while speaking. */
const talkOf = (file: string, level: number) => (lf: number): number => {
  for (let k = -6; k <= 6; k++) {
    const v = voiceAt(file, lf + k);
    if (v && speechLevel(v.env, v.rel) > 0.06) return level;
  }
  return 0;
};
const HC_FILE = "02b_Haricharan.wav";
const BALAK_FILE = "02c_Thakur_Truth.wav";
const hcMouthReal = (lf: number): MouthState => {
  const v = voiceAt(HC_FILE, lf);
  return v ? visemeFromEnvelope(v.env, v.rel, 41, v.text) : MOUTH_REST;
};
const hcTalkReal = talkOf(HC_FILE, 0.8);
const balakMouth = (lf: number): number => {
  const v = voiceAt(BALAK_FILE, lf);
  return v ? clamp(visemeFromEnvelope(v.env, v.rel, 17, v.text).open * 0.9, 0, 0.9) : 0;
};
const balakTalk = talkOf(BALAK_FILE, 1);

/* ------------------------------------------------------------------ */
/* Balak                                                                */
/* ------------------------------------------------------------------ */

const G = KACHARI.grove;
const BAL = { x: G.balak.x, y: G.balak.y, s: 0.95 };
/** Head centre of the plate design (about 186 figure units above the seat) and the halo radius. */
const HALO = { x: BAL.x, y: BAL.y - 176 * BAL.s, r: 150 * BAL.s };

/** Pebble play (playPebbles, poseStart on Balak's clock bf). Session 1 from the start of P1; session 2 after AG1 a. */
const PEB1 = -24;
const PEB1_END = PEB1 + 104; // a release point (cycle 1, u 44): two pebbles laid, hand on its way back
const LOOK_NOISE = K.hari + 14; // he looks up at the bang of the door
const PEB2_ON = AG1.fromStory + 16; // looks back down at his pebbles after the cow has gone by
const PEB2 = PEB2_ON - 120; // the rig's clock enters cycle 2 at PEB2_ON (the third pebble), so the row continues
const PEB2_END = PEB2_ON + 39; // just after the third pebble is set down
const PALM = K.bole - 7; // the small open palm toward the bamboo (gesture 7 f before the words)
const POINT = K.khide - 7; // the gentle point off left to the torn trellis
const SHAKE_POSE = K.oKi - 8;
const HEAD_SHAKE = K.oKi + 8;
const WATCH = AG2_FROM + 6; // AG2: he lowers his eyes to follow Haricharan going away

/** Figure-unit targets (flipped: +x is to HIS front = screen left). */
const PALM_AT = { x: 230, y: -112 }; // forward at chest height: a small calm palm, elbow low
const PALM_LOW = { x: 110, y: -46 }; // where it starts: just off the knee // toward Haricharan's bamboo, up
const TRELLIS_AT = { x: 236, y: -104 }; // off left toward the torn trellis (away from the hidden cow, behind him)
/** P3: where his palm meets the cow's muzzle (unflipped, figure units). */
const STROKE_PALM = { x: 112, y: -120 };

/** Balak's pose on his clock bf (story frames; lifeF - 24 inside P1). */
const balakPose = (bf: number): Partial<React.ComponentProps<typeof SeatedChild>> => {
  if (bf < PEB1_END) return { pose: "playPebbles", poseStart: PEB1 };
  if (bf < LOOK_NOISE) return { pose: "lookUp", prevPose: "playPebbles", prevPoseStart: PEB1, poseStart: PEB1_END, face: { smile: 0.55 } };
  if (bf < PEB2_ON) return { pose: "sitCross", prevPose: "lookUp", poseStart: LOOK_NOISE, face: { lookX: 0.25, smile: 0.42 } };
  if (bf < PEB2_END) return { pose: "playPebbles", prevPose: "sitCross", prevPoseStart: LOOK_NOISE, poseStart: PEB2 };
  if (bf < PALM) return { pose: "lookUp", prevPose: "playPebbles", prevPoseStart: PEB2, poseStart: PEB2_END };
  if (bf < SHAKE_POSE) {
    // the palm starts low by the lap and rises forward to chest height (no wide arc: the chadar stays closed)
    const up = EASE.inOut(clamp((bf - PALM) / 14));
    const k = EASE.inOut(clamp((bf - POINT) / 12));
    const palm = { x: lerp(PALM_LOW.x, PALM_AT.x, up), y: lerp(PALM_LOW.y, PALM_AT.y, up) };
    const at = { x: lerp(palm.x, TRELLIS_AT.x, k), y: lerp(palm.y, TRELLIS_AT.y, k) };
    return { pose: "pointIn", prevPose: "lookUp", poseStart: PALM, pointAt: at, expression: "compassionate" };
  }
  if (bf < WATCH) return { pose: "lookUp", prevPose: "pointIn", poseStart: SHAKE_POSE, prevExpression: "compassionate", expressionStart: SHAKE_POSE, pointAt: TRELLIS_AT, headShake: HEAD_SHAKE };
  return { pose: "sitCross", prevPose: "lookUp", poseStart: WATCH, face: { lookX: 0.35, smile: 0.55 } };
};

/** The pebbles on the earth: frozen between the sessions (two laid, then three). */
const pebblesT = (bf: number) => {
  if (bf < PEB2_ON) return Math.min(bf - PEB1, PEB1_END - PEB1);
  return Math.min(bf - PEB2, PEB2_END - PEB2);
};

/** Face extras on the story clock: the faint final smile, and the P2 eyes lowering for a moment (pause t). */
const balakFace = (bf: number, p2t: number | null): { lookX?: number; smile?: number; eyesDown?: number } => {
  if (p2t !== null) {
    const down = track(p2t, [
      [0.18, 0],
      [0.38, 0.62, io],
      [0.6, 0.62],
      [0.82, 0, io],
    ]);
    return { eyesDown: down, smile: 0.42 };
  }
  if (bf >= K.ami - 4 && bf < WATCH) return { smile: lerp(0.5, 0.66, clamp((bf - K.ami + 4) / 20)) };
  return {};
};

/* ------------------------------------------------------------------ */
/* Glow (BAL-05 to BAL-07, BAL-11): restrained; the one beat in P3      */
/* ------------------------------------------------------------------ */

const GLOW_BASE = 0.6;
const GLOW_BEAT_AT = 24; // P3 clock: as the palm reaches her muzzle
const glowBeat = (pc: number) => track(pc, [[GLOW_BEAT_AT - 4, 0], [GLOW_BEAT_AT + 22, 1, io]]);

const GroundGlow: React.FC<{ x: number; y: number; w: number; level: number }> = ({ x, y, w, level }) => (
  <g opacity={level}>
    <defs>
      <radialGradient id="e5s02-gg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y} rx={w} ry={w * 0.17} fill="url(#e5s02-gg)" />
  </g>
);

/* ------------------------------------------------------------------ */
/* The cow                                                              */
/* ------------------------------------------------------------------ */

const HIDE = G.cowHide; // 0.85 plane, facing +x
const COW_AT_TRELLIS = G.cowAtTrellis;
const TUGS = [K.ekdin + 6, K.ekdin + 22, K.ekdin + 38];
const VINE_K = 0.9;
/** The vine's tear on the story clock: grows with each tug; whole before shot 3, torn from shot 4 on. */
const trellisTornAt = (f: number) => {
  if (f < K.ekdin) return 0;
  const base = track(f, [
    [K.ekdin, 0.1],
    [TUGS[0] + 9, 0.3, "out"],
    [TUGS[1] + 9, 0.58, "out"],
    [TUGS[2] + 9, 0.86, "out"],
    [K.hari, 0.94],
  ]);
  return clamp(base + 0.05 * cowTug(f, TUGS));
};
const CUKE_AT = TUGS[1] + 8;

/** Where she stands by the wreck at the cut to shot 4 (a beat later: she has turned away, chewing the cucumber). */
const COW_W2 = { x: 950, y: 908, s: 1.2 };
const ALARM = K.hari + 16; // a beat after the door bangs open
const TROT = ALARM + 12;
const COW_PAST = { x: 1380, y: 897, s: 1.1 };
/** The hide point (0.85) on the floor plane for the AG1 camera: she walks there and is then drawn in the slot. */
const HIDE_ON_FLOOR = planeTo({ x: HIDE.x, y: HIDE.y, s: HIDE.s ?? 1.05 }, 0.85, 1, CAMS.med);
const HIDE_AT = AG1.fromStory + 32; // she stops behind the clump (beat a)
const COW_PATH = [
  { f: TROT, x: COW_W2.x, y: COW_W2.y, s: COW_W2.s },
  { f: AG1.fromStory - 6, x: COW_PAST.x, y: COW_PAST.y, s: COW_PAST.s, ease: "in" as const },
  { f: HIDE_AT, x: HIDE_ON_FLOOR.x, y: HIDE_ON_FLOOR.y, s: HIDE_ON_FLOOR.s, ease: "out" as const },
];
/** The calm background treatment fades onto her as she goes in among the plants (so the slot swap is seamless). */
const COW_CALM_FROM = HIDE_AT - 18;

/**
 * P3: she starts behind the clump (her hiding place, facing left, converted to the floor plane for the P3 cam, the clump
 * masking her) and steps forward and left out in FRONT of it onto the floor, where she is drawn whole (the clump mask
 * fades as she clears it), and lowers her muzzle to his palm.
 */
const P3_COW_FROM = planeTo({ x: HIDE.x + 90, y: HIDE.y, s: HIDE.s ?? 1.05 }, 0.85, 1, CAMS.p3);
const P3_COW_TO = { x: BAL.x + 112 * BAL.s + 245, y: 934, s: 1.05 };
/** P3 clock: the clump's mask over her fades as she steps out in front of it. */
const p3MaskAt = (pc: number) => 1 - EASE.inOut(clamp((pc - 2) / 10));
const P3_NUZZLE = 8; // P3 clock: her muzzle lowers over 24 f (arrives at 32)
const P3_STROKE = 0; // Balak's strokeCow starts (touch at +32 = when her muzzle arrives)

type CowRender = { where: "none" | "floor" | "slot"; props: GentleCowProps; calm: number; mask?: number };

const balakFigToWorld = (p: { x: number; y: number }, flip: boolean) => ({ x: BAL.x + (flip ? -p.x : p.x) * BAL.s, y: BAL.y + p.y * BAL.s });
const worldToBalakFig = (p: { x: number; y: number }, flip: boolean) => ({ x: ((p.x - BAL.x) / BAL.s) * (flip ? -1 : 1), y: (p.y - BAL.y) / BAL.s });

const cowAt = (f: number, lifeF: number, pc: number | null): CowRender => {
  if (pc !== null) {
    // P3, on its own clock (story is held): stepping out of the clump onto the floor, facing left
    const cf = P3_STORY + pc;
    const palm = balakFigToWorld(STROKE_PALM, false);
    const props: GentleCowProps = {
      f: cf,
      lifeF,
      s: P3_COW_TO.s,
      flip: true,
      action: pc < P3_NUZZLE ? "walk" : "nuzzle",
      actionStart: pc < P3_NUZZLE ? P3_STORY - 10 : P3_STORY + P3_NUZZLE,
      prevAction: pc < P3_NUZZLE ? "hidden" : "walk",
      prevActionStart: P3_STORY - 10,
      path: [
        { f: P3_STORY - 4, x: P3_COW_FROM.x, y: P3_COW_FROM.y, s: P3_COW_FROM.s },
        { f: P3_STORY + 14, x: P3_COW_TO.x, y: P3_COW_TO.y, s: P3_COW_TO.s, ease: "out" },
      ],
      turn: track(pc, [
        [0, -0.12],
        [16, -0.06, io],
      ]),
      target: { x: palm.x, y: palm.y },
      seed: 7,
    };
    const mask = p3MaskAt(pc);
    return { where: "floor", props, calm: 0.35 * mask, mask };
  }
  if (f < K.ekdin) return { where: "none", props: { f, lifeF }, calm: 0 };
  if (f < K.hari) {
    // shot 3: at the trellis, tearing the vine
    const torn = trellisTornAt(f);
    return {
      where: "floor",
      calm: 0,
      props: {
        f,
        lifeF,
        x: COW_AT_TRELLIS.x,
        y: COW_AT_TRELLIS.y,
        s: COW_AT_TRELLIS.s ?? 1.25,
        flip: true,
        action: "graze",
        actionStart: K.ekdin - 30,
        target: trellisPoint(torn, VINE_K),
        tugs: TUGS,
        cucumber: clamp((f - CUKE_AT) / 4),
        seed: 7,
      },
    };
  }
  if (f < HIDE_AT + 2) {
    // shot 4 and AG1 a: by the wreck chewing, the alarm, the trot off and the walk in among the plants
    const action = f < ALARM ? "idle" : f < TROT ? "alarm" : f < AG1.fromStory ? "trot" : "walk";
    const start = f < ALARM ? K.hari - 40 : f < TROT ? ALARM : f < AG1.fromStory ? TROT : AG1.fromStory;
    const prev = f < ALARM ? undefined : f < TROT ? "idle" : f < AG1.fromStory ? "alarm" : "trot";
    const prevStart = f < TROT ? K.hari - 40 : f < AG1.fromStory ? ALARM : TROT;
    return {
      where: "floor",
      calm: EASE.inOut(clamp((f - COW_CALM_FROM) / 18)),
      props: {
        f,
        lifeF,
        s: COW_W2.s,
        action,
        actionStart: start,
        prevAction: prev,
        prevActionStart: prevStart,
        path: COW_PATH,
        turn: track(f, [
          [AG1.fromStory - 10, 0],
          [HIDE_AT, 0.22, io],
        ]),
        cucumber: f < ALARM + 3 ? 1 : 0,
        chew: f < ALARM ? true : undefined,
        seed: 7,
      },
    };
  }
  // hidden behind the clump (slot), shots 5 to 11 and AG2: ear and tail only, chewing her cud
  return {
    where: "slot",
    calm: 1,
    props: {
      f,
      lifeF,
      x: HIDE.x,
      y: HIDE.y,
      s: HIDE.s ?? 1.05,
      action: "hidden",
      actionStart: HIDE_AT,
      prevAction: "walk",
      prevActionStart: AG1.fromStory,
      turn: track(f, [
        [HIDE_AT, 0.22],
        [HIDE_AT + 24, 0, io],
      ]),
      seed: 7,
    },
  };
};

/**
 * The clump in front of the hiding place (set: CowScreenClump, 0.85 plane), as a mask region for the floor-plane cow while
 * she walks in among the plants: the low mass of sucker leaves (everything below cowHide.y - 196 from x - 120 to x + 300)
 * and the four trunks above it. Drawn in 0.85 coordinates inside a transform to the floor plane.
 */
const ClumpMaskShapes: React.FC = () => {
  const { x, y } = HIDE;
  const trunk = (cx: number, base: number, s: number, key: string) => (
    <path key={key} d={`M ${cx - 32 * s} ${base} L ${cx - 15 * s} ${base - 470 * s} L ${cx + 15 * s} ${base - 470 * s} L ${cx + 33 * s} ${base} Z`} />
  );
  return (
    <g fill="#000">
      <path d={`M ${x - 122} ${y - 186} Q ${x - 40} ${y - 204} ${x + 60} ${y - 196} Q ${x + 180} ${y - 206} ${x + 310} ${y - 190} L ${x + 310} ${y + 60} L ${x - 122} ${y + 60} Z`} />
      {trunk(x - 70, y + 4, 1.12, "a")}
      {trunk(x + 52, y + 8, 1.18, "b")}
      {trunk(x + 200, y + 6, 1.12, "d")}
      {trunk(x + 262, y + 4, 1.0, "c")}
    </g>
  );
};
const FloorCow: React.FC<{ r: CowRender; cam: Cam }> = ({ r, cam }) => {
  // affine 0.85 -> floor for this cam: x1 = a x + bx
  const a = Math.pow(cam.zoom, 0.85 - 1);
  const o = planeTo({ x: 0, y: 0 }, 0.85, 1, cam);
  // where she stands among the plants her hooves and shadow go below the floor plane's back edge (as in the slot)
  const groundL = planeTo({ x: HIDE.x - 40, y: 0 }, 0.85, 1, cam).x;
  return (
    <div style={{ position: "absolute", inset: 0, filter: r.calm > 0.01 ? ujancharBgFilter(r.calm, "morning") : undefined }}>
      <Layer depth={1} extraBlur={r.calm * ujancharBgBlur(0.85, 1, cam)}>
        <defs>
          <filter id="e5s02-clumpsoft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <mask id="e5s02-clump" maskUnits="userSpaceOnUse" x={-2000} y={-1000} width={7000} height={4000}>
            <rect x={-2000} y={-1000} width={7000} height={4000} fill="#fff" />
            <g opacity={r.mask ?? 1}>
              <g transform={`translate(${o.x.toFixed(2)} ${o.y.toFixed(2)}) scale(${a.toFixed(5)})`} filter="url(#e5s02-clumpsoft)">
                <ClumpMaskShapes />
              </g>
              <rect x={groundL} y={870} width={4000} height={1200} fill="#000" filter="url(#e5s02-clumpsoft)" />
            </g>
          </mask>
        </defs>
        <g mask="url(#e5s02-clump)">
          <GentleCow {...r.props} />
        </g>
      </Layer>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Haricharan                                                           */
/* ------------------------------------------------------------------ */

const HC = CAST.haricharan;
const HC_S = 1.2;
const DOOR = G.backDoor; // 0.8 plane, s 0.75
const DOOR_BANG = K.hari + 12;
const HC_IN_DOOR = DOOR_BANG + 1; // seen in the opening (behind the frame)
const HC_OUT = DOOR_BANG + 7; // crosses the threshold onto the floor plane
const HC_DOOR_X0 = DOOR.x - 14;
const HC_DOOR_X1 = DOOR.x + 12;
/** The threshold point on the floor plane for the shot-4 cam and for the AG2 cam. */
const THRESH_W2 = planeTo({ x: HC_DOOR_X1, y: DOOR.y, s: DOOR.s ?? 0.75 }, 0.8, 1, CAMS.wide2);
const THRESH_AG = planeTo({ x: HC_DOOR_X1, y: DOOR.y, s: DOOR.s ?? 0.75 }, 0.8, 1, CAMS.agWide);
const HC_STOP1 = 740; // by the wreck
const HC_RUN2 = AG1_B - 10;
const HC_ARRIVE = AG1_B + 22;
const HC_STOP = G.haricharanStop.x - 70; // a step back from the boy, so he towers without crowding him
const THROW = K.balakEnd - 8;
const THUMP = THROW + 6; // hit at THUMP + 13
const TURN = THUMP + 12;
const STOMP = TURN + 8;
const HC_IN_AGAIN = AG2_FROM + 55; // back over the threshold into the doorway (just before P3)

const PATH_X = [640, 860, 1060, 1180];
const PATH_Y = [900, 922, 940, 952];
const pathY = (x: number) => {
  if (x <= PATH_X[0]) return PATH_Y[0];
  for (let i = 0; i < PATH_X.length - 1; i++) if (x <= PATH_X[i + 1]) return lerp(PATH_Y[i], PATH_Y[i + 1], (x - PATH_X[i]) / (PATH_X[i + 1] - PATH_X[i]));
  return PATH_Y[PATH_Y.length - 1];
};

const walkBase = { scale: HC_S, height: HC.height, seed: HC.seed, carrySide: 1 as const };
const W1: WalkOpts = { ...walkBase, start: HC_OUT, dur: 26, fromX: THRESH_W2.x, toX: HC_STOP1, startIn: 4, stopIn: 7, kind: "run", bodyTurn: 0.85, rS: 22, rE: 55 };
const W2: WalkOpts = { ...walkBase, start: HC_RUN2, dur: HC_ARRIVE - HC_RUN2, fromX: HC_STOP1, toX: HC_STOP, startIn: 8, stopIn: 6, kind: "run", bodyTurn: 0.85, rS: 22, rE: 55 };
const W3: WalkOpts = { ...walkBase, start: STOMP, dur: HC_IN_AGAIN - STOMP, fromX: HC_STOP, toX: THRESH_AG.x, startIn: 8, stopIn: 3, kind: "stomp", bodyTurn: -0.85, rS: 8, rE: -24 };
const W_DOOR_OUT: WalkOpts = { ...walkBase, scale: DOOR.s ?? 0.75, start: HC_IN_DOOR - 4, dur: HC_OUT - HC_IN_DOOR + 4, fromX: HC_DOOR_X0, toX: HC_DOOR_X1, startIn: 2, stopIn: 1, kind: "run", bodyTurn: 0.85, rS: 22, rE: 55 };
const W_DOOR_IN: WalkOpts = { ...walkBase, scale: DOOR.s ?? 0.75, start: HC_IN_AGAIN, dur: 10, fromX: HC_DOOR_X1, toX: HC_DOOR_X0 - 20, startIn: 1, stopIn: 3, kind: "stomp", bodyTurn: -0.85, rS: 8, rE: -24 };
const WALKS = [W1, W2, W3];

/** Haricharan's place: in the doorway slot (0.8) or on the floor (x from his walks; y and scale along the path). */
const hcPlace = (f: number): { where: "none" | "door" | "floor"; x: number; y: number; s: number } => {
  if (f < HC_IN_DOOR) return { where: "none", x: 0, y: 0, s: HC_S };
  if (f < HC_OUT) return { where: "door", x: walkTravel(f, W_DOOR_OUT).bodyX, y: DOOR.y, s: DOOR.s ?? 0.75 };
  if (f >= HC_IN_AGAIN) return { where: "door", x: walkTravel(f, W_DOOR_IN).bodyX, y: DOOR.y, s: DOOR.s ?? 0.75 };
  let x = W1.fromX;
  for (const w of WALKS) if (f >= w.start) x = walkTravel(f, w).bodyX;
  // the step between the threshold and the door step: grow from the doorway's size to the floor's
  const th = f < STOMP ? THRESH_W2 : THRESH_AG;
  if (x < PATH_X[0]) {
    const k = clamp((x - th.x) / (PATH_X[0] - th.x));
    return { where: "floor", x, y: lerp(th.y, PATH_Y[0], k), s: lerp(th.s, HC_S, k) };
  }
  return { where: "floor", x, y: pathY(x), s: HC_S };
};

const HC_KEYS: PoseKey<Pose>[] = [
  { f: -999, ...GESTURES5.bambooCarried, ...GESTURES5.angryBrows, bodyTurn: 0.85 },
  // at the wreck: looks back down at the torn vine, then scans the grove, spots the boy
  { f: W1.start + W1.dur + 4, in: 10, ease: io, poleDrop: 1, poleTilt: 3, rS: 10, rE: 20, bodyTurn: 0.4, headTurn: -0.42, eyeX: -0.6, headNod: 7, eyeY: 0.35, lean: 3 },
  { f: W1.start + W1.dur + 30, in: 14, ease: io, bodyTurn: 0.7, headTurn: 0.35, eyeX: 0.6, headNod: 0, eyeY: 0, lean: 0 },
  { f: HC_RUN2 - 8, in: 8, ease: io, bodyTurn: 0.85, headTurn: 0.12, eyeX: 0.3, eyeY: 0.3 },
  { f: HC_RUN2 + 2, in: 6, ease: io, poleDrop: 0, poleTilt: 22, rS: 22, rE: 55 },
  // stops short over Balak and plants the pole, turned to him in profile and glaring DOWN at his face (eye-level camera;
  // bluster, no menace). Head yaw = bodyTurn * 0.95 + headTurn * 1.15 (rad): about 80 degrees, toward Balak; headTilt +
  // tips the face down for a figure facing right; eyeY + looks down.
  { f: HC_ARRIVE + 6, in: 10, ease: io, poleDrop: 1, poleTilt: 3, rS: 10, rE: 20, bodyTurn: 1, headTurn: 0.45, eyeX: 0.5, headTilt: 9, headNod: 2, eyeY: 0.8, lean: 3 },
  // speaking: leaning in a little, still looking down at him
  { f: K.eiBiru + 2, in: 8, ease: io, lean: 6, headTilt: 7, brow: -0.1 },
  { f: K.eiBiru + 40, in: 10, ease: io, lean: 4, headTilt: 9 },
  // listening to the boy: the brows knit harder, a scoffing tilt
  { f: C0 + 10, in: 14, ease: io, lean: 2, headTilt: 10, browTilt: -0.95, brow: -0.25 },
  { f: K.khide + 6, in: 14, ease: io, headTilt: 5, lean: 0 },
  { f: K.ami, in: 12, ease: io, headTilt: 11, lean: 2, brow: -0.3 },
];
const HC_ACT = makeActing<Pose>(BASE_POSE, HC_KEYS);
const walkAt = (f: number): Partial<Pose> => {
  const w = WALKS.find((x) => f >= x.start && f <= x.start + x.dur + 2);
  if (w) return walkPose(f, w);
  if (f >= W_DOOR_OUT.start && f < HC_OUT) return walkPose(f, W_DOOR_OUT);
  if (f >= HC_IN_AGAIN) return walkPose(f, W_DOOR_IN);
  return {};
};
const hcAct = (f: number): Pose => {
  let k: Pose = HC_ACT(f);
  k = { ...k, ...walkAt(f) };
  // the jab toward the grove (his free LEFT hand: the near one at bodyTurn > 0), 7 f before "কোন দিকে"
  k.jab = -jabPulse(f, K.konDike - 7, 16, 1);
  // a small unconvinced shake of the head while the boy speaks
  k.headTurn += puppetHeadShake(f, K.khide + 24, 30, 0.14);
  // AG2: the flung-up free hand, one thump of the bamboo, the turn, the stomp off
  k.throwUp = -throwUpPulse(f, THROW, 10);
  const th = bambooThump(f, THUMP);
  k.poleLift = th.poleLift;
  k.lean += th.dLean;
  k.bodyY += th.dY;
  k.rS += th.dS;
  if (f >= TURN) {
    k.bodyTurn = turnBody(f, TURN, 12, 1, -0.85);
    k.headTurn = lerp(k.headTurn, 0, clamp((f - TURN) / 12));
    k.headTilt = lerp(k.headTilt, 2, clamp((f - TURN) / 12));
    k.poleDrop = clamp(1 - (f - TURN) / 10);
    k.poleTilt = 3 - 17 * clamp((f - TURN) / 12);
    k.eyeY = lerp(k.eyeY, 0.1, clamp((f - TURN) / 12));
  }
  if (f >= STOMP) k = { ...k, ...walkAt(f) };
  return k;
};
/** Agitated breathing (MOT-20): quick after the run, settling a little, quicker again as he storms off. */
const hcBreathRate = (f: number) => (f < HC_ARRIVE + 40 ? 2.5 : f < C0 ? 2.3 : f < THROW ? 2.1 : 2.5);
/** Where he jabs: the deeper grove up and to the right (not at the clump where she hides). */
const JAB_AT = { x: 2350, y: 640 };

const LIGHT: Lighting = { keySide: 1, rim: "#ffd79a", rimStrength: 0.4, rimSide: 1 };
const LIGHT_DOOR: Lighting = { keySide: 1, rim: "#ffd79a", rimStrength: 0.15, brightness: 0.86 };

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene02BananaGroveCowRescue: React.FC = () => {
  const { f, lifeF, pause } = useStory5(SCENE_ID);
  const inP3 = lifeF >= P3_REAL;
  const pc = inP3 ? lifeF - P3_REAL : null;
  const shot = shotAt(f, lifeF);
  const cam = camAt(shot, f);

  /* Balak */
  const bf = lifeF < (PAUSES[0]?.frames ?? 24) ? lifeF - (PAUSES[0]?.frames ?? 24) : f;
  const p2t = pause.inPause && pause.index === 1 ? pause.t : null;
  const flip = !inP3;
  const bProps = inP3
    ? (() => {
        const bfc = P3_STORY + (pc ?? 0);
        const cow = solveGentleCow(cowAt(f, lifeF, pc).props);
        const muzzle = worldToBalakFig(cow.muzzle, false);
        const fore = worldToBalakFig(cow.forehead, false);
        return {
          f: bfc,
          pose: "strokeCow" as SeatedPose,
          prevPose: "sitCross" as SeatedPose,
          poseStart: P3_STORY + P3_STROKE,
          strokeAt: muzzle,
          strokeDir: { x: fore.x - muzzle.x, y: fore.y - muzzle.y },
          face: { smile: 0.62 },
        };
      })()
    : { f: bf, ...balakPose(bf), face: { ...(balakPose(bf).face ?? {}), ...balakFace(bf, p2t) } };
  const beat = pc !== null ? glowBeat(pc) : 0;
  const glow = GLOW_BASE + (1 - GLOW_BASE) * beat;

  /* cow, trellis, door, Haricharan */
  const cowR = cowAt(f, lifeF, pc);
  const torn = f < K.ekdin ? 0 : f < K.hari ? trellisTornAt(f) : 1;
  const doorOpen = f < DOOR_BANG ? 0 : track(f, [[DOOR_BANG, 0], [DOOR_BANG + 5, 1, "backOut"]]);
  const hp = hcPlace(f);
  const showHc = hp.where !== "none" && !inP3;
  const hcMouth = (fr: number): MouthState => hcMouthReal(lifeF + (fr - f));
  const hcTalk = (fr: number): number => hcTalkReal(lifeF + (fr - f));
  const hcPuppet = (where: "door" | "floor") => (
    <Puppet
      cast={HC}
      f={f}
      lifeF={lifeF}
      x={hp.x}
      y={hp.y}
      scale={hp.s}
      acting={hcAct}
      mouth={hcMouth}
      talk={hcTalk}
      light={where === "door" ? LIGHT_DOOR : LIGHT}
      breathRate={hcBreathRate(f)}
      pointAt={() => JAB_AT}
    />
  );

  const slotCow =
    cowR.where === "slot" ? (
      <Layer depth={0.85} extraBlur={ujancharBgBlur(0.85, 1, cam)}>
        <GentleCow {...cowR.props} />
      </Layer>
    ) : null;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <Stage cam={cam} background={KACHARI_BG.grove}>
        <KachariBackdrop view="grove" f={lifeF} cam={cam} doorOpen={doorOpen} doorway={showHc && hp.where === "door" ? hcPuppet("door") : undefined} cow={slotCow} />
        <KachariFloorLayer view="grove" f={lifeF} trellisTorn={torn} />
        {cowR.where === "floor" && <FloorCow r={cowR} cam={cam} />}
        <Layer depth={1}>
          {showHc && hp.where === "floor" && hcPuppet("floor")}
          <PebblesArt x={BAL.x} y={BAL.y} s={BAL.s} flip t={pebblesT(inP3 ? 9999 : bf)} />
          <GroundGlow x={BAL.x} y={BAL.y + 4} w={150 * BAL.s} level={0.5 + 0.5 * beat} />
          <BirulGlow cx={HALO.x} cy={HALO.y} r={HALO.r * (1 + 0.15 * beat)} glow={glow} f={lifeF} />
          <SeatedChild
            x={BAL.x}
            y={BAL.y}
            s={BAL.s}
            lifeF={lifeF}
            flip={flip}
            design="plate"
            age={6}
            mouth={inP3 ? 0 : balakMouth(lifeF)}
            talk={inP3 ? 0 : balakTalk(lifeF)}
            {...bProps}
          />
        </Layer>
        <KachariLightLayer view="grove" f={lifeF} />
        <KachariForegroundLayer view="grove" f={lifeF} />
        <Grade {...kachariGrade("grove")} />
      </Stage>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sound events (for Episode05.tsx)                                     */
/* ------------------------------------------------------------------ */

/**
 * S02_EVENTS: this scene's one-shots, placed on the action. `f` is a SCENE-LOCAL REAL frame (absolute = scene start + f;
 * real frames because P3's events happen while the story clock is held). `story` is the same moment on the story clock
 * where it has one. `loopFrames` marks a footstep or hoof run (loop the file for that many frames). Volumes follow
 * AUD-02 (one-shots 0.15 to 0.45).
 */
export interface S02Event {
  id: string;
  f: number;
  story?: number;
  file: string;
  volume: number;
  loopFrames?: number;
}
const ev = (id: string, story: number, file: string, volume: number, loopFrames?: number): S02Event => ({ id, f: real(story), story, file, volume, loopFrames });
const evP3 = (id: string, pcFrame: number, file: string, volume: number): S02Event => ({ id, f: P3_REAL + pcFrame, file, volume });
export const S02_EVENTS: S02Event[] = [
  // shot 3: the cow tears the vine (one tear per tug) and munches the cucumber (optional, very low)
  ...TUGS.map((t, i) => ev(`vine_tear_${i + 1}`, t, "sfx/ep05/vine_tear", i === 2 ? 0.34 : 0.28)),
  ev("cow_munch", CUKE_AT + 2, "sfx/ep05/cow_munch", 0.12, K.hari - CUKE_AT),
  // shot 4: the back door flung open, Haricharan's running feet, the cow's hooves as she trots off
  ev("door_bang", DOOR_BANG, "sfx/ep02/door_creak", 0.32),
  ev("hc_run_1", HC_OUT, "sfx/ep02/footsteps_mud", 0.3, W1.dur),
  // the legs visibly break into the trot ~18 f after TROT (main-session check, 2026-11-22): the hooves follow the legs
  ev("cow_trot", TROT + 18, "sfx/ep02/hooves_soft", 0.22, HIDE_AT - TROT - 18),
  // AG1 b: Haricharan pounds in and stops short
  ev("hc_run_2", HC_RUN2, "sfx/ep02/footsteps_mud", 0.32, HC_ARRIVE - HC_RUN2),
  // AG2: the bamboo thump at the hit frame, the stomp back, the door
  ev("bamboo_thump", THUMP + 13, "sfx/ep05/bamboo_thump", 0.4),
  ev("hc_stomp", STOMP, "sfx/ep02/footsteps_mud", 0.3, HC_IN_AGAIN - STOMP),
  ev("door_close", HC_IN_AGAIN + 4, "sfx/ep02/door_creak", 0.22),
  // P3: banana leaves as she steps out, the glow shimmer as his palm meets her, her soft breath out
  evP3("banana_leaves", 0, "sfx/ep05/banana_leaves", 0.2),
  evP3("glow_shimmer", GLOW_BEAT_AT - 2, "sfx/soft_magical_shimmer", 0.15),
  evP3("cow_breath", P3_NUZZLE + 32, "sfx/ep05/cow_breath", 0.15),
];
/** Other anchors Episode05.tsx may want (scene-local real frames). */
export const S02_TIMES = {
  /** Haricharan bursts out: Warm_Family_Flute fades out from here (plan: beds) */
  haricharanBurst: real(DOOR_BANG),
  p2Start: P2_REAL,
  p3Start: P3_REAL,
  glowBeat: P3_REAL + GLOW_BEAT_AT,
  durationFrames: DUR,
};

