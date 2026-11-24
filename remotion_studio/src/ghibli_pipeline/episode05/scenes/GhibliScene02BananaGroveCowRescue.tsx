import React from "react";
import { clamp, EASE, lerp, makeActing, PoseKey, track } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { cowTug, GentleCow, GentleCowProps, solveGentleCow } from "../../../cinematic/animals/GentleCow";
import { CAST } from "../../../cinematic/rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../../../cinematic/rig/lipsync";
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
} from "../../../cinematic/rig/Puppet";
import { ujancharBgBlur, ujancharBgFilter } from "../../../cinematic/sets/UjancharHouse";
import { clipLocalStory5, clipSpan5, cueLocalStory5, gapsFor5, pausesFor5, storyToReal, useStory5 } from "../../../episode/storyClock";
import { BirulGlow } from "../../../episode03/rig/BirulGlow";
import { PebblesArt, SeatedChild, SeatedPose } from "../../../episode03/rig/SeatedChild";
import { EP05_SCENES } from "../../../episode05/timing";
import { ContactShadow, GhibliCharFilterDefs, GhibliLayer, GhibliStage } from "../../GhibliStage";
import { ghibliClock, withGhibliActing } from "../../core/ghibliActing";
import { arcLerp, balakLivingBodyTransform, GhibliBalakLapDetails } from "../../core/ghibliBalak";
import { GhibliFootstepDust } from "../../core/GhibliAtmosphere";
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { GhibliBalakFaceDetail } from "../../core/GhibliFaceDetail";
import { zoomProportionalDof } from "../../core/ghibliMotion";
import {
  GhibliKachariBackdrop,
  GhibliKachariFloorLayer,
  GhibliKachariForegroundAndGrade,
  KACHARI,
  KACHARI_BG,
  kachariKeepInSet,
  trellisPoint,
} from "../GhibliKachariSet";

/**
 * Episode 5 (Ghibli Watercolor + Sepia-Ink Pipeline) · Scene 02 (`02_banana_grove_cow_rescue`).
 * Preserves 100% of Episode 5 Scene 02's approved timing, pauses, action gaps, voice lip-sync,
 * interactive cucumber trellis tearing, cow hiding & nuzzling, and Haricharan's bamboo pole acting,
 * while staging the banana grove in hand-drawn Ghibli watercolor plates and `#ghibli-char-ink` harmony.
 */

const SCENE_ID = "02_banana_grove_cow_rescue";
const SCENE = EP05_SCENES.find((s) => s.sceneId === SCENE_ID);
const SCENE_START = SCENE?.startFrame ?? 1254;
const PAUSES = pausesFor5(SCENE_ID);
const GAPS = gapsFor5(SCENE_ID);
const real = (story: number) => storyToReal(story, PAUSES);
const io = "inOut" as const;

const cue = (snip: string, fb: number) => cueLocalStory5(snip, SCENE_ID) ?? { from: fb, to: fb + 40 };
const A0 = clipLocalStory5("02a_Narrator_Cow.wav", SCENE_ID)?.from ?? 0;
const B0 = clipLocalStory5("02b_Haricharan.wav", SCENE_ID)?.from ?? 383;
const C0 = clipLocalStory5("02c_Thakur_Truth.wav", SCENE_ID)?.from ?? 473;
const K = {
  chupchap: cue("চুপচাপ", A0 + 84).from,
  ekdin: A0 + 171,
  hari: A0 + 224,
  eiBiru: B0 + 3,
  konDike: B0 + 55,
  bole: cue("বলে দিলে", C0 + 54).from,
  khide: cue("ওর খিদে", C0 + 117).from,
  oKi: cue("ও কি আর", C0 + 175).from,
  oKiEnd: cue("ও কি আর", C0 + 249).to,
  ami: cue("আমি ওর খবর", C0 + 249).from,
  balakEnd: C0 + 301,
};
const P2_STORY = PAUSES[1]?.atStory ?? 462;
const P3_STORY = PAUSES[2]?.atStory ?? 851;
const P2_REAL = real(P2_STORY);
const P3_REAL = real(P3_STORY);
const AG1 = GAPS[0] ?? { fromStory: 310, frames: 60, beats: [] };
const AG1_B = AG1.beats.find((b) => b.id === "b_haricharan_arrives")?.fromStory ?? AG1.fromStory + 36;
const AG2_FROM = GAPS[1]?.fromStory ?? 791;

const CUT = {
  trellis: K.ekdin,
  wide2: K.hari,
  med: AG1.fromStory,
  hmcu: K.eiBiru - 7,
  two: K.bole - 1,
  agWide: K.balakEnd + 2,
};

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
  hmcu: { cx: 982, cy: 628, z: 3.2 },
  bcu: { cx: 1398, cy: 800, z: 3.0 },
  two: { cx: 1222, cy: 702, z: 1.55 },
  bmcu: { cx: 1420, cy: 792, z: 2.5 },
  agWide: { cx: 900, cy: 620, z: 1.08 },
  p3: { cx: 1480, cy: 752, z: 2.3 },
};
const camOf = (fr: Frame): Cam =>
  kachariKeepInSet("grove", {
    x: fr.cx - 960,
    y: fr.cy - 540,
    zoom: fr.z,
    focus: 1,
    dof: zoomProportionalDof(fr.z, 0.28, 0.5, 1.75),
    shake: 0,
  });
const mixFrame = (a: Frame, b: Frame, t: number): Frame => {
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
      const t = EASE.inOut(clamp((f - K.chupchap) / 62));
      return camOf(mixFrame(FR.wide, FR.medWide, t));
    }
    case "two": {
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

const toScreen = (p: { x: number; y: number }, d: number, c: Cam) => {
  const s = Math.pow(c.zoom, d);
  return { x: 960 + s * (p.x - 960 - c.x * d), y: 540 + s * (p.y - 540 - c.y * d) };
};
const fromScreen = (p: { x: number; y: number }, d: number, c: Cam) => {
  const s = Math.pow(c.zoom, d);
  return { x: 960 + (p.x - 960) / s + c.x * d, y: 540 + (p.y - 540) / s + c.y * d };
};
const planeTo = (p: { x: number; y: number; s?: number }, d1: number, d2: number, c: Cam) => {
  const q = fromScreen(toScreen(p, d1, c), d2, c);
  return { x: q.x, y: q.y, s: (p.s ?? 1) * Math.pow(c.zoom, d1 - d2) };
};

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
const voiceAt = (file: string, lf: number) => {
  const span = clipSpan5(file);
  if (!span) return null;
  const abs = SCENE_START + lf;
  for (const p of span.parts) if (abs >= p.startFrame && abs < p.startFrame + p.frames) return { env: ENV[file], rel: abs - p.startFrame, text: TEXT[file] };
  return null;
};
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

const G = KACHARI.grove;
const BAL = { x: G.balak.x, y: G.balak.y, s: 0.95 };
const HALO = { x: BAL.x, y: BAL.y - 176 * BAL.s, r: 150 * BAL.s };

const PEB1 = -24;
const PEB1_END = PEB1 + 104;
const LOOK_NOISE = K.hari + 14;
const PEB2_ON = AG1.fromStory + 16;
const PEB2 = PEB2_ON - 120;
const PEB2_END = PEB2_ON + 39;
const PALM = K.bole - 7;
const POINT = K.khide - 7;
const SHAKE_POSE = K.oKi - 8;
const HEAD_SHAKE = K.oKi + 8;
const WATCH = AG2_FROM + 6;

const PALM_AT = { x: 230, y: -112 };
const PALM_LOW = { x: 110, y: -46 };
const TRELLIS_AT = { x: 236, y: -104 };
const STROKE_PALM = { x: 112, y: -120 };

const balakPose = (bf: number): Partial<React.ComponentProps<typeof SeatedChild>> => {
  if (bf < PEB1_END) return { pose: "playPebbles", poseStart: PEB1 };
  if (bf < LOOK_NOISE) return { pose: "lookUp", prevPose: "playPebbles", prevPoseStart: PEB1, poseStart: PEB1_END, face: { smile: 0.55 } };
  if (bf < PEB2_ON) return { pose: "sitCross", prevPose: "lookUp", poseStart: LOOK_NOISE, face: { lookX: 0.25, smile: 0.42 } };
  if (bf < PEB2_END) return { pose: "playPebbles", prevPose: "sitCross", prevPoseStart: LOOK_NOISE, poseStart: PEB2 };
  if (bf < PALM) return { pose: "lookUp", prevPose: "playPebbles", prevPoseStart: PEB2, poseStart: PEB2_END };
  if (bf < SHAKE_POSE) {
    // Graceful curved wrist arc rising from lap to chest palm, then gently arcing left toward the torn trellis
    const up = clamp((bf - PALM) / 14);
    const k = clamp((bf - POINT) / 12);
    const palm = arcLerp(PALM_LOW, PALM_AT, up, 24, 6);
    const atP = arcLerp(palm, TRELLIS_AT, k, 16, 4);
    return { pose: "pointIn", prevPose: "lookUp", poseStart: PALM, pointAt: atP, expression: "compassionate" };
  }
  if (bf < WATCH) return { pose: "lookUp", prevPose: "pointIn", poseStart: SHAKE_POSE, prevExpression: "compassionate", expressionStart: SHAKE_POSE, pointAt: TRELLIS_AT, headShake: HEAD_SHAKE };
  return { pose: "sitCross", prevPose: "lookUp", poseStart: WATCH, face: { lookX: 0.35, smile: 0.55 } };
};

const pebblesT = (bf: number) => {
  if (bf < PEB2_ON) return Math.min(bf - PEB1, PEB1_END - PEB1);
  return Math.min(bf - PEB2, PEB2_END - PEB2);
};

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

const GLOW_BASE = 0.6;
const GLOW_BEAT_AT = 24;
const glowBeat = (pc: number) => track(pc, [[GLOW_BEAT_AT - 4, 0], [GLOW_BEAT_AT + 22, 1, io]]);

const GroundGlow: React.FC<{ x: number; y: number; w: number; level: number }> = ({ x, y, w, level }) => (
  <g opacity={level}>
    <defs>
      <radialGradient id="gh5s02-gg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y} rx={w} ry={w * 0.17} fill="url(#gh5s02-gg)" />
  </g>
);

const HIDE = G.cowHide;
const COW_AT_TRELLIS = G.cowAtTrellis;
const TUGS = [K.ekdin + 6, K.ekdin + 22, K.ekdin + 38];
const VINE_K = 0.9;
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

const COW_W2 = { x: 950, y: 908, s: 1.2 };
const ALARM = K.hari + 16;
const TROT = ALARM + 12;
const COW_PAST = { x: 1380, y: 897, s: 1.1 };
const HIDE_ON_FLOOR = planeTo({ x: HIDE.x, y: HIDE.y, s: HIDE.s ?? 1.05 }, 0.85, 1, CAMS.med);
const HIDE_AT = AG1.fromStory + 32;
const COW_PATH = [
  { f: TROT, x: COW_W2.x, y: COW_W2.y, s: COW_W2.s },
  { f: AG1.fromStory - 6, x: COW_PAST.x, y: COW_PAST.y, s: COW_PAST.s, ease: "in" as const },
  { f: HIDE_AT, x: HIDE_ON_FLOOR.x, y: HIDE_ON_FLOOR.y, s: HIDE_ON_FLOOR.s, ease: "out" as const },
];
const COW_CALM_FROM = HIDE_AT - 18;

const P3_COW_FROM = planeTo({ x: HIDE.x + 90, y: HIDE.y, s: HIDE.s ?? 1.05 }, 0.85, 1, CAMS.p3);
const P3_COW_TO = { x: BAL.x + 112 * BAL.s + 245, y: 934, s: 1.05 };
const p3MaskAt = (pc: number) => 1 - EASE.inOut(clamp((pc - 2) / 10));
const P3_NUZZLE = 8;
const P3_STROKE = 0;

type CowRender = { where: "none" | "floor" | "slot"; props: GentleCowProps; calm: number; mask?: number };

const balakFigToWorld = (p: { x: number; y: number }, flip: boolean) => ({ x: BAL.x + (flip ? -p.x : p.x) * BAL.s, y: BAL.y + p.y * BAL.s });
const worldToBalakFig = (p: { x: number; y: number }, flip: boolean) => ({ x: ((p.x - BAL.x) / BAL.s) * (flip ? -1 : 1), y: (p.y - BAL.y) / BAL.s });

const cowAt = (f: number, lifeF: number, pc: number | null): CowRender => {
  if (pc !== null) {
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
      turn: track(pc, [[0, -0.12], [16, -0.06, io]]),
      target: { x: palm.x, y: palm.y },
      seed: 7,
    };
    const mask = p3MaskAt(pc);
    return { where: "floor", props, calm: 0.35 * mask, mask };
  }
  if (f < K.ekdin) return { where: "none", props: { f, lifeF }, calm: 0 };
  if (f < K.hari) {
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
        turn: track(f, [[AG1.fromStory - 10, 0], [HIDE_AT, 0.22, io]]),
        cucumber: f < ALARM + 3 ? 1 : 0,
        chew: f < ALARM ? true : undefined,
        seed: 7,
      },
    };
  }
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
      turn: track(f, [[HIDE_AT, 0.22], [HIDE_AT + 24, 0, io]]),
      seed: 7,
    },
  };
};

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
  const a = Math.pow(cam.zoom, 0.85 - 1);
  const o = planeTo({ x: 0, y: 0 }, 0.85, 1, cam);
  const groundL = planeTo({ x: HIDE.x - 40, y: 0 }, 0.85, 1, cam).x;
  return (
    <div style={{ position: "absolute", inset: 0, filter: r.calm > 0.01 ? ujancharBgFilter(r.calm, "morning") : undefined }}>
      <GhibliLayer depth={1} extraBlur={r.calm * ujancharBgBlur(0.85, 1, cam)}>
        <GhibliCharFilterDefs dapple shadeFactor={0.18} bounceColor="#7c9c78" sunColor="#ffe7aa" />
        <defs>
          <filter id="gh5s02-clumpsoft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <mask id="gh5s02-clump" maskUnits="userSpaceOnUse" x={-2000} y={-1000} width={7000} height={4000}>
            <rect x={-2000} y={-1000} width={7000} height={4000} fill="#fff" />
            <g opacity={r.mask ?? 1}>
              <g transform={`translate(${o.x.toFixed(2)} ${o.y.toFixed(2)}) scale(${a.toFixed(5)})`} filter="url(#gh5s02-clumpsoft)">
                <ClumpMaskShapes />
              </g>
              <rect x={groundL} y={870} width={4000} height={1200} fill="#000" filter="url(#gh5s02-clumpsoft)" />
            </g>
          </mask>
        </defs>
        <g mask="url(#gh5s02-clump)" filter="url(#ghibli-char-ink)">
          <GentleCow {...r.props} />
        </g>
      </GhibliLayer>
    </div>
  );
};

const HC = CAST.haricharan;
const HC_S = 1.2;
const DOOR = G.backDoor;
const DOOR_BANG = K.hari + 12;
const HC_IN_DOOR = DOOR_BANG + 1;
const HC_OUT = DOOR_BANG + 7;
const HC_DOOR_X0 = DOOR.x - 14;
const HC_DOOR_X1 = DOOR.x + 12;
const THRESH_W2 = planeTo({ x: HC_DOOR_X1, y: DOOR.y, s: DOOR.s ?? 0.75 }, 0.8, 1, CAMS.wide2);
const THRESH_AG = planeTo({ x: HC_DOOR_X1, y: DOOR.y, s: DOOR.s ?? 0.75 }, 0.8, 1, CAMS.agWide);
const HC_STOP1 = 740;
const HC_RUN2 = AG1_B - 10;
const HC_ARRIVE = AG1_B + 22;
const HC_STOP = G.haricharanStop.x - 70;
const THROW = K.balakEnd - 8;
const THUMP = THROW + 6;
const TURN = THUMP + 12;
const STOMP = TURN + 8;
const HC_IN_AGAIN = AG2_FROM + 55;

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

const hcPlace = (f: number): { where: "none" | "door" | "floor"; x: number; y: number; s: number } => {
  if (f < HC_IN_DOOR) return { where: "none", x: 0, y: 0, s: HC_S };
  if (f < HC_OUT) return { where: "door", x: walkTravel(f, W_DOOR_OUT).bodyX, y: DOOR.y, s: DOOR.s ?? 0.75 };
  if (f >= HC_IN_AGAIN) return { where: "door", x: walkTravel(f, W_DOOR_IN).bodyX, y: DOOR.y, s: DOOR.s ?? 0.75 };
  let x = W1.fromX;
  for (const w of WALKS) if (f >= w.start) x = walkTravel(f, w).bodyX;
  const th = f < STOMP ? THRESH_W2 : THRESH_AG;
  if (x < PATH_X[0]) {
    const k = clamp((x - th.x) / (PATH_X[0] - th.x));
    return { where: "floor", x, y: lerp(th.y, PATH_Y[0], k), s: lerp(th.s, HC_S, k) };
  }
  return { where: "floor", x, y: pathY(x), s: HC_S };
};

const HC_KEYS: PoseKey<Pose>[] = [
  { f: -999, ...GESTURES5.bambooCarried, ...GESTURES5.angryBrows, bodyTurn: 0.85 },
  { f: W1.start + W1.dur + 4, in: 10, ease: io, poleDrop: 1, poleTilt: 3, rS: 10, rE: 20, bodyTurn: 0.4, headTurn: -0.42, eyeX: -0.6, headNod: 7, eyeY: 0.35, lean: 3 },
  { f: W1.start + W1.dur + 30, in: 14, ease: io, bodyTurn: 0.7, headTurn: 0.35, eyeX: 0.6, headNod: 0, eyeY: 0, lean: 0 },
  { f: HC_RUN2 - 8, in: 8, ease: io, bodyTurn: 0.85, headTurn: 0.12, eyeX: 0.3, eyeY: 0.3 },
  { f: HC_RUN2 + 2, in: 6, ease: io, poleDrop: 0, poleTilt: 22, rS: 22, rE: 55 },
  { f: HC_ARRIVE + 6, in: 10, ease: io, poleDrop: 1, poleTilt: 3, rS: 10, rE: 20, bodyTurn: 1, headTurn: 0.45, eyeX: 0.5, headTilt: 9, headNod: 2, eyeY: 0.8, lean: 3 },
  { f: K.eiBiru + 2, in: 8, ease: io, lean: 6, headTilt: 7, brow: -0.1 },
  { f: K.eiBiru + 40, in: 10, ease: io, lean: 4, headTilt: 9 },
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
/** Fast-action story windows in Scene 02 that run on ones (24 fps); all other acting steps on twos (12 fps). */
const S02_FAST_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [DOOR_BANG, HC_OUT + 18], // Door bang & Haricharan burst
  [THUMP, THUMP + 18], // Bamboo pole thump
];

const hcActBase = (f: number): Pose => {
  let k: Pose = HC_ACT(f);
  k = { ...k, ...walkAt(f) };
  k.jab = -jabPulse(f, K.konDike - 7, 16, 1);
  k.headTurn += puppetHeadShake(f, K.khide + 24, 30, 0.14);
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
const hcSpeechRms = (storyF: number): number => {
  const v = voiceAt(HC_FILE, real(storyF));
  return v ? speechLevel(v.env, v.rel) : 0;
};
const hcAct = withGhibliActing(hcActBase, {
  personality: "stomp",
  seed: HC.seed,
  cadence: "twos",
  fastWindows: S02_FAST_WINDOWS,
  speechRms: hcSpeechRms,
  speechActAmp: 0.78,
});
const hcBreathRate = (f: number) => (f < HC_ARRIVE + 40 ? 2.5 : f < C0 ? 2.3 : f < THROW ? 2.1 : 2.5);
const JAB_AT = { x: 2350, y: 640 };

const LIGHT: Lighting = { keySide: 1, rim: "#ffd79a", rimStrength: 0.4, rimSide: 1 };
const LIGHT_DOOR: Lighting = { keySide: 1, rim: "#ffd79a", rimStrength: 0.15, brightness: 0.86 };

export const GhibliScene02BananaGroveCowRescue: React.FC = () => {
  const { f, lifeF, pause } = useStory5(SCENE_ID);
  // Step Haricharan & cow on twos (12 fps) for anime weight; keep Balak's delicate hand/face acting on smooth 24 fps
  const cf = ghibliClock(f, "twos", S02_FAST_WINDOWS);
  const cLifeF = ghibliClock(lifeF, "twos");
  const inP3 = lifeF >= P3_REAL;
  const pc = inP3 ? lifeF - P3_REAL : null;
  const shot = shotAt(f, lifeF);
  const cam = camAt(shot, f);

  const bf = lifeF < (PAUSES[0]?.frames ?? 24) ? lifeF - (PAUSES[0]?.frames ?? 24) : f;
  const p2t = pause.inPause && pause.index === 1 ? pause.t : null;
  const flip = !inP3;
  const balakVoice = voiceAt(BALAK_FILE, lifeF);
  const balakSpeechRms = balakVoice && !inP3 ? speechLevel(balakVoice.env, balakVoice.rel) : 0;
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
  // Radiant GhibliBalakAura flaring gently during "বলে দিলে তুমি ওকে মারবে... ওর খিদে পেয়েছিল"
  const speechAuraFlare = track(f, [
    [K.bole - 4, 0],
    [K.bole + 16, 0.42, io],
    [K.khide + 30, 0.48],
    [K.balakEnd - 10, 0.42, io],
    [K.balakEnd + 14, 0, io],
  ]);
  const auraFlare = Math.max(beat, speechAuraFlare);
  const glow = GLOW_BASE + (1 - GLOW_BASE) * auraFlare;
  const balakBodyXform = balakLivingBodyTransform({
    x: BAL.x,
    y: BAL.y,
    f: lifeF,
    facing: flip ? -1 : 1,
    speechRms: balakSpeechRms,
    tenderness: inP3 ? 0.75 : 0,
    seed: 29,
  });

  const cowR = cowAt(cf, cLifeF, pc);
  const torn = cf < K.ekdin ? 0 : cf < K.hari ? trellisTornAt(cf) : 1;
  const doorOpen = cf < DOOR_BANG ? 0 : track(cf, [[DOOR_BANG, 0], [DOOR_BANG + 5, 1, "backOut"]]);
  const hp = hcPlace(cf);
  const showHc = hp.where !== "none" && !inP3;
  const hcMouth = (fr: number): MouthState => hcMouthReal(cLifeF + (fr - cf));
  const hcTalk = (fr: number): number => hcTalkReal(cLifeF + (fr - cf));
  const hcPuppet = (where: "door" | "floor") => (
    <Puppet
      cast={HC}
      f={cf}
      lifeF={cLifeF}
      x={hp.x}
      y={hp.y}
      scale={hp.s}
      acting={hcAct}
      mouth={hcMouth}
      talk={hcTalk}
      light={where === "door" ? LIGHT_DOOR : LIGHT}
      breathRate={hcBreathRate(cf)}
      pointAt={() => JAB_AT}
    />
  );

  const slotCow =
    cowR.where === "slot" ? (
      <GhibliLayer depth={0.85} extraBlur={ujancharBgBlur(0.85, 1, cam) * 0.45}>
        <GhibliCharFilterDefs f={lifeF} dapple />
        <g filter="url(#ghibli-char-ink)">
          <GentleCow {...cowR.props} />
        </g>
      </GhibliLayer>
    ) : null;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <GhibliStage cam={cam} background={KACHARI_BG.grove}>
        <GhibliKachariBackdrop
          view="grove"
          f={lifeF}
          cam={cam}
          doorOpen={doorOpen}
          doorway={showHc && hp.where === "door" ? hcPuppet("door") : undefined}
          cow={slotCow}
        />
        <GhibliKachariFloorLayer view="grove" f={lifeF} trellisTorn={torn} />
        {cowR.where === "floor" && <FloorCow r={cowR} cam={cam} />}
        <GhibliLayer depth={1}>
          <GhibliCharFilterDefs f={lifeF} dapple shadeFactor={0.18} bounceColor="#7c9c78" sunColor="#ffe7aa" />
          {showHc && hp.where === "floor" && (
            <>
              <ContactShadow x={hp.x} y={hp.y} rx={36 * hp.s} ry={10 * hp.s} opacity={0.36} castStretch={1.15} />
              <GhibliFootstepDust
                x={hp.x}
                y={hp.y}
                activity={
                  (cf >= HC_OUT && cf <= HC_STOP1 + 6) ||
                  (cf >= HC_RUN2 && cf <= HC_ARRIVE + 4) ||
                  (cf >= THUMP + 11 && cf <= THUMP + 20) ||
                  (cf >= STOMP && cf <= HC_IN_AGAIN)
                    ? 0.9
                    : 0
                }
                dir={cf >= STOMP ? -1 : 1}
                s={hp.s}
                f={lifeF}
                seed={21}
              />
              <g filter="url(#ghibli-char-ink)">{hcPuppet("floor")}</g>
            </>
          )}
          <g filter="url(#ghibli-prop-watercolor)">
            <PebblesArt x={BAL.x} y={BAL.y} s={BAL.s} flip t={pebblesT(inP3 ? 9999 : bf)} />
          </g>
          <ContactShadow x={BAL.x} y={BAL.y + 2} rx={62 * BAL.s} ry={13 * BAL.s} opacity={0.32} castStretch={1.1} />
          <GhibliBalakGroundGlow x={BAL.x} y={BAL.y + 4} rx={150 * BAL.s} ry={26 * BAL.s} level={0.5 + 0.5 * auraFlare} />
          <GhibliBalakAura cx={HALO.x} cy={HALO.y} r={HALO.r * (1 + 0.15 * auraFlare)} glow={glow} f={lifeF} />
          {/* Child Thakur rendered with dedicated luminous `#ghibli-balak-ink`, smooth 24 fps gestures, living breath/speech spine, painted face detail, and warm/cool cotton lap folds */}
          <g filter="url(#ghibli-balak-ink)" transform={balakBodyXform}>
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
            <GhibliBalakLapDetails x={BAL.x} y={BAL.y} s={BAL.s} flip={flip} f={lifeF} />
            <GhibliBalakFaceDetail cx={HALO.x} cy={HALO.y} s={BAL.s} flip={flip} zoom={cam.zoom} />
          </g>
        </GhibliLayer>
        <GhibliKachariForegroundAndGrade view="grove" f={lifeF} zoom={cam.zoom} showBokeh />
      </GhibliStage>
    </div>
  );
};
