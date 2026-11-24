import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, lerp, track } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { Flame } from "../../../cinematic/fx/Fx";
import { MOUTH_REST, visemeFromEnvelope, type MouthState } from "../../../cinematic/rig/lipsync";
import {
  GESTURES,
  headShake,
  headShakeTilt,
  kneelingPranam,
  lookAround,
  Puppet,
  ringBell,
  wobble,
  type Pose,
  type PropRenderer,
} from "../../../cinematic/rig/Puppet";
import { HELD_OBJECT_BOTTOM, HeldObjectArt, SeatedChild, seatedEp6Anchors, sighCurve, type SeatedChildProps } from "../../../episode03/rig/SeatedChild";
import { StandingChild, standingChildJoints, type StandingChildProps } from "../../../episode05/rig/StandingChild";
import { ContactShadow, GhibliCharFilterDefs, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { GhibliBalakLapDetails } from "../../core/ghibliBalak";
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { withGhibliActing } from "../../core/ghibliActing";
import { GhibliDappledLight, GhibliGroundCover, GhibliSunRays } from "../../core/GhibliLifeKit";
import { ghibliStrideOf, ghibliWalkSpot, zoomProportionalDof } from "../../core/ghibliMotion";
import { EP04G_RMS, EP04G_SCENES, ep04gSpan } from "../timing";
import {
  EP04G_CAST,
  EP04G_MORNING_LIGHT,
  GhibliCourtyardBackdrop,
  GhibliEp04ForegroundFinish,
  GhibliSmokeCurls,
} from "../Ep04GhibliShared";

/**
 * Episode 4 Ghibli, Scene 01 (`01_clay_shiva_swap`): the clay Shiva and the wooden doll, after the blueprint
 * (Episode_04_FULL_PRODUCTION_BLUEPRINT.md, "Scene 01": AG1, Shots 1-7, P1-P3, the dissolve into Scene 02).
 *
 * Blocking (world = the 1.0 plane, K = adult Puppet scale 1.0; CHR-08 child scales: seated Balak 0.72 K, standing
 * Balak 0.5 K with head 1.45):
 *   Charu kneels at her puja at the left, facing right, her brass taat on the floor in front of her (clay Shiva, diya,
 *   bel leaves). Balak sits at the right, facing left, his painted doll in his lap.
 *   AG1    held wide with a slow lateral truck: she rings the little bell; he watches.
 *   Shot 1 medium two-shot (cut on 01a): the bel leaf at her forehead, tossed onto the plate, palms joined, the long
 *          kneeling pranam (forehead to the floor) held through AG2.
 *   AG2    medium close on the plate and his hands, slow push 1.0 -> 1.15x: he rises onto his knees, his far hand lifts
 *          the clay Shiva, the near hand stands the doll in the middle of the plate (the clink, placed by
 *          Episode04Ghibli at AG2 + 44), both hands take the clay and roll it, he sits back on his heels and scoots
 *          back. Hands and objects: SeatedChild "handsTo" palm targets; the objects are drawn at the rig's own drawn
 *          palms (seatedEp6Anchors) through `propInHands`, so they never float (MOT-07).
 *   Shot 2 close-up on Charu (6 f before 01b): her head comes up at the clink, hand to mouth on "অ্যাঁ!", an insert on
 *          the doll on the plate ("থালায় ওটা কী…") with a rack focus to the empty courtyard, back to her calling "বীরু!".
 *          Balak is gone (he ran off while she bowed). P1 holds on her.
 *   Shot 3 medium wide: the elder brother has brought him back (the walk-in happens just off the close-up: the
 *          seated and standing rigs have no walk cycle), his hand on Balak's shoulder; Balak stands rolling the clay
 *          ball between his palms; the brother points at it.
 *   Shot 4 medium two-shot: Charu, kneeling at his eye level, wags a finger (no hitting), then hands on hips; Balak
 *          unbothered.
 *   Shot 5 medium close-up on Balak (6 f before 01e), push 1.0 -> 1.15x on "আমার রঙচঙে পুতুলটা": he holds up the ball,
 *          the near hand flicks back over his shoulder on "ঘরের পেছনে ফেলে দাও", an open palm toward the doll on "ওটা আর
 *          ফেলতে হবে না!". P2: cut to Charu, palm to her forehead.
 *   Shot 6 medium: Jyethi by the veranda, hand at her cheek, shaking her head, brows up; Charu glances at her.
 *   Shot 7 medium close on Charu (6 f before 01g): a sigh, a half-smile of awe, she leans in to Jyethi; P3 holds while
 *          the sunlight warms into the flashback (Episode04Ghibli lays the wash transition over the cut).
 * Lip sync: each speaker's mouth runs only on her or his own clip (text-aligned visemes from the clip's RMS); every
 * other mouth stays closed. Everything runs on the scene frame (no story clock in this pipeline), so breathing and
 * blinks never stop.
 */

const SCENE_ID = "01_clay_shiva_swap";
const SCENE_FRAMES = EP04G_SCENES.find((s) => s.sceneId === SCENE_ID)?.durationFrames ?? 2183;

const PRELOAD = [
  "images/ghibli_ep04/sky_ep04_morning_courtyard.png",
  "images/ghibli_ep04/far_trees_ep04_sketch.png",
  "images/ghibli_ep04/courtyard_back_ep04_morning.png",
  "images/ghibli_ep04/courtyard_floor_ep04_sketch.png",
  "images/ghibli_ep04/tulsi_mancha_ep04_sketch.png",
  "images/ghibli_ep04/watercolor_paper_grain.png",
] as const;

/* ------------------------------------------------------------------ */
/* Timing (scene-local frames, from the generated spans)                */
/* ------------------------------------------------------------------ */

const AG1 = ep04gSpan(SCENE_ID, "AG1_world_open");
const S1A = ep04gSpan(SCENE_ID, "01a_Narrator_Morning.wav");
const AG2 = ep04gSpan(SCENE_ID, "AG2_swap_clay");
const S1B = ep04gSpan(SCENE_ID, "01b_Charu_Shock.wav");
const S1C = ep04gSpan(SCENE_ID, "01c_ElderBrother_Report.wav");
const S1D = ep04gSpan(SCENE_ID, "01d_Charu_Scold.wav");
const S1E = ep04gSpan(SCENE_ID, "01e_Balak_ClayLogic.wav");
const S1F = ep04gSpan(SCENE_ID, "01f_Jyethi_Remark.wav");
const S1G = ep04gSpan(SCENE_ID, "01g_Charu_FlashbackIntro.wav");

/** Charu's puja: the bell in AG1 (Episode04Ghibli's bell at +22), the bel leaf, the pranam (rustle at +230). */
const BELL_RING = AG1.from + 20;
const LEAF = { head: S1A.from + 40, out: S1A.from + 68, toss: S1A.from + 76, land: S1A.from + 92 };
const PRANAM_AT = 200;
/** The doll touches the brass (Episode04Ghibli's plate clink at AG2 + 44). */
const CLINK = AG2.from + 44;
/** Charu's head comes up at the clink. */
const STARTLE = CLINK + 2;

/** Balak's swap (AG2): the cut, the rise, the far hand to the Shiva, the doll down, the roll, sitting back. */
const SWAP_CUT = S1A.to + 4; // cut to the plate-and-hands shot just after the narration
const RISE = AG2.from;
const FAR_GRIP = AG2.from + 28;
const SHIVA_UP = AG2.from + 40;
const DOLL_RELEASE = CLINK + 4;
const BOTH_ON_CLAY = CLINK + 16;
const ROLL_SQUEEZE = { from: BOTH_ON_CLAY, to: BOTH_ON_CLAY + 30 };
const SIT_BACK = CLINK + 12;
const SCOOT = { from: CLINK + 18, to: CLINK + 40 };

/** Shot 2 cuts: Charu's close-up 6 f before 01b, the insert on the doll ("থালায় ওটা কী…"), back to her. */
const CU_CHARU = S1B.from - 6;
const INSERT = { from: S1B.from + 97, to: S1B.from + 174 };
/** Shot 3: the brother arrives just before the cut. */
const BRO_WALK = { from: S1C.from - 40, to: S1C.from - 8 };
const SHOT3 = S1C.from - 6;
const SHOT4 = S1D.from - 6;
const SHOT5 = S1E.from - 6;
const P2_CUT = S1E.to;
const SHOT6 = S1F.from - 6;
const SHOT7 = S1G.from - 6;

/* ------------------------------------------------------------------ */
/* Lip sync: own clip only                                              */
/* ------------------------------------------------------------------ */

const TEXT: Record<string, string> = {
  "01b_Charu_Shock.wav": "অ্যাঁ! একি কাণ্ড! আমার মাটির শিব কোথায় গেল? থালায় ওটা কী—গলৈয়ার কাঠের পুতুল?! ওরে বীরু! বীরু কোথায় গেলি?",
  "01c_ElderBrother_Report.wav": "মা, ধরে এনেছি! কই, শিব তো দেখলাম না—দেখলাম ও শিবের মাটিটা হাতে পাকিয়ে গোল গোল লাড্ডু বানাচ্ছে!",
  "01d_Charu_Scold.wav": "ওরে দুষ্টু ছেলে, ঠাকুরের শিবলিঙ্গ নিয়ে কেউ খেলা করে? তোর কি একটুও ভয়-ডর নেই?",
  "01e_Balak_ClayLogic.wav":
    "মা, তুমি তো রোজ ক্ষেতের মাটির ঢেলা আনিয়ে শিব গড়ে পুজো করে ঘরের পেছনে ফেলে দাও! তখন তো চটো না? আমি তো শুধু ওটা নিয়ে খেলছি, আর বদলে আমার রঙচঙে পুতুলটা তো তোমায় দিয়ে গেলাম—ওটা আর ফেলতে হবে না!",
  "01f_Jyethi_Remark.wav": "চারু, তোর ছেলেটা তো বড্ড ঠেটা! বাড়ির আর সবার দেব-দেবীতে কত ভক্তি—আর তোর বীরুর একটুও ভয় নেই!",
  "01g_Charu_FlashbackIntro.wav":
    "কী আর বলব দিদি! সেদিন তুমি ছিলে না—আমার পাঁচ বছরের ছেলে কী বুকের পাটা নিয়ে ঠাকুরঘর থেকে পিতলের গোবিন্দ মূর্তি নিয়ে পালাল, শুনলে অবাক হবে!",
};

const clipMouth = (files: readonly string[], seed: number) => (fr: number): MouthState => {
  for (const file of files) {
    const w = ep04gSpan(SCENE_ID, file);
    if (fr >= w.from && fr < w.to) return visemeFromEnvelope(EP04G_RMS[file] as number[] | undefined, fr - w.from, seed, TEXT[file]);
  }
  return MOUTH_REST;
};
/** Phrase-level speech (1 inside a spoken phrase, syllable dips ignored): quiet breathing while speaking. */
const clipTalk = (files: readonly string[]) => (fr: number): number => {
  for (const file of files) {
    const w = ep04gSpan(SCENE_ID, file);
    const env = EP04G_RMS[file];
    if (!env || fr < w.from - 6 || fr >= w.to + 6) continue;
    for (let k = -6; k <= 6; k++) {
      const i = fr + k - w.from;
      if (i >= 0 && i < env.length && env[i] > 0.06) return 1;
    }
  }
  return 0;
};

const CHARU_FILES = ["01b_Charu_Shock.wav", "01d_Charu_Scold.wav", "01g_Charu_FlashbackIntro.wav"] as const;
const BRO_FILES = ["01c_ElderBrother_Report.wav"] as const;
const BALAK_FILES = ["01e_Balak_ClayLogic.wav"] as const;
const JYETHI_FILES = ["01f_Jyethi_Remark.wav"] as const;

const charuMouth = clipMouth(CHARU_FILES, 5);
const charuTalk = clipTalk(CHARU_FILES);
const broMouth = clipMouth(BRO_FILES, 11);
const broTalk = clipTalk(BRO_FILES);
const jyethiMouth = clipMouth(JYETHI_FILES, 17);
const jyethiTalk = clipTalk(JYETHI_FILES);
const balakMouthState = clipMouth(BALAK_FILES, 23);
const balakTalk = clipTalk(BALAK_FILES);
const balakMouth = (fr: number) => clamp(balakMouthState(fr).open * 0.9, 0, 0.9);

/* ------------------------------------------------------------------ */
/* Layout                                                               */
/* ------------------------------------------------------------------ */

type V = { x: number; y: number };

/** Ground line of the figures: just in front of the veranda plinth (floor top at stage y 734), so the arcade reads
 * behind them in the closer shots. */
const CHARU = { x: 640, y: 800, s: 1.0 };
const JYETHI = { x: 425, y: 784, s: 0.98 };
/** The brass taat on the floor in front of Charu (centre of its rim, world). */
const PLATE = { x: 938, y: 796, rx: 40, ry: 9 };
const PLATE_SURF = PLATE.y - 3;
/** Seated Balak (facing left, flipped) at the plate. */
const BS = { x: 1010, y: 802, s: 0.72 };
/** Standing Balak (from Shot 3), brought back by his brother. */
const BST = { x: 1068, y: 804, s: 0.515, head: 1.45 };
const BRO_END = { x: 1176, y: 802, s: 1.0 };
const BRO_START = { x: 1430, y: 802, s: 1.0 };

/** Object grip heights (object units x k, from SeatedChild's GRIP table) and the object scale (Balak's hands). */
const SHIVA_GY = 4 * 1.3;
const DOLL_GY = 2 * 1.2;
const OBJ_S = BS.s;

const SHIVA_ON_PLATE: V = { x: PLATE.x, y: PLATE_SURF - HELD_OBJECT_BOTTOM.clayShiva * OBJ_S };
const DOLL_ON_PLATE: V = { x: PLATE.x + 2, y: PLATE_SURF - HELD_OBJECT_BOTTOM.doll * OBJ_S };

/** Seated Balak: figure units (before the flip) <-> world, at seat x `bx`. */
const toFig = (w: V, bx: number): V => ({ x: (bx - w.x) / BS.s, y: (w.y - BS.y) / BS.s });

/** Keyed 2D path with eased segments. */
const path = (fr: number, keys: Array<[number, V]>): V => {
  if (fr <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, pa] = keys[i];
    const [b, pb] = keys[i + 1];
    if (fr <= b) {
      const t = EASE.inOut(clamp((fr - a) / Math.max(1, b - a)));
      return { x: lerp(pa.x, pb.x, t), y: lerp(pa.y, pb.y, t) };
    }
  }
  return keys[keys.length - 1][1];
};

/** Seat x during the scoot back (three little knee shuffles). */
const seatX = (fr: number) => BS.x + 46 * EASE.inOut(clamp((fr - SCOOT.from) / (SCOOT.to - SCOOT.from)));
const seatDip = (fr: number) => {
  const u = clamp((fr - SCOOT.from) / (SCOOT.to - SCOOT.from));
  return u > 0 && u < 1 ? -2 * Math.abs(Math.sin(u * Math.PI * 3)) : 0;
};

/** Seat: cross-legged, up on the knees for the swap, back on the heels to roll the clay. */
const seatKneel = (fr: number) =>
  track(fr, [
    [RISE, 0],
    [RISE + 14, 2, "inOut"],
    [SIT_BACK, 2],
    [SIT_BACK + 16, 1, "inOut"],
  ]);

/** Rolling the clay between the palms (figure units): the far palm cupped under it, the near palm circling on top. */
const BALL_AT: V = { x: 54, y: -104 };
const rollPalms = (fr: number, at: V) => {
  const a = (fr - BOTH_ON_CLAY) * 0.32;
  return {
    near: { x: at.x + 5 * Math.cos(a), y: at.y - 9 + 2.5 * Math.sin(a) },
    far: { x: at.x + 1.5 * Math.sin(a * 0.5), y: at.y + 8 },
  };
};

/** The swap: palm targets (figure units) for the near hand (the doll) and the far hand (the Shiva). */
const swapTargets = (fr: number, bx: number): { near: V; far: V } => {
  const dollPalm = toFig({ x: DOLL_ON_PLATE.x, y: DOLL_ON_PLATE.y + DOLL_GY * OBJ_S }, bx);
  const shivaPalm = toFig({ x: SHIVA_ON_PLATE.x, y: SHIVA_ON_PLATE.y + SHIVA_GY * OBJ_S }, bx);
  const LAP_N: V = { x: 40, y: -82 };
  const LAP_F: V = { x: 47, y: -88 };
  // the doll stays low, at the thighs, while he kneels up (it must never hide his face)
  const CHEST_N: V = { x: 46, y: -100 };
  const ASIDE_N: V = { x: 52, y: -104 };
  const roll = rollPalms(fr, BALL_AT);
  const near = path(fr, [
    [RISE, LAP_N],
    [RISE + 16, CHEST_N],
    [FAR_GRIP, ASIDE_N],
    [CLINK, dollPalm],
    [DOLL_RELEASE, dollPalm],
    [BOTH_ON_CLAY, { x: BALL_AT.x + 5, y: BALL_AT.y - 9 }],
  ]);
  const far = path(fr, [
    [RISE + 4, LAP_F],
    [FAR_GRIP - 10, { x: shivaPalm.x - 6, y: shivaPalm.y - 30 }],
    [FAR_GRIP, shivaPalm],
    [FAR_GRIP + 4, shivaPalm],
    [SHIVA_UP + 6, { x: 64, y: -118 }],
    [BOTH_ON_CLAY, { x: BALL_AT.x, y: BALL_AT.y + 8 }],
  ]);
  if (fr <= BOTH_ON_CLAY) return { near, far };
  return roll;
};

/* ------------------------------------------------------------------ */
/* Camera (hard cuts; the only moves are AG1's truck, AG2's push and Shot 5's push) */
/* ------------------------------------------------------------------ */

/**
 * Director proof, 2026-11-24: the first 3 seconds after the fade (local 14–85) are a medium two-shot.
 * Charu and Biru fill the frame, their feet stay above the caption, and the push is large enough to feel.
 * Frame 86 returns to the existing shot. Characters themselves are unchanged.
 */
const FEEL_FRAMES = 86;

/** Frame a world point (cx, wy) at screen y `sy` with zoom z. */
const frameAt = (cx: number, wy: number, sy: number, z: number): Cam => ({ x: cx - 960, y: wy - 540 - (sy - 540) / z, zoom: z, focus: 1 });

/** Charu's head centre when kneeling upright (world, measured on the stills). */
const CHARU_HEAD_Y = CHARU.y - 170;
const BALAK_STAND_HEAD_Y = BST.y - 226;

const cameraAt = (fr: number): Cam => {
  if (fr < FEEL_FRAMES) {
    const t = EASE.inOut(fr / (FEEL_FRAMES - 1));
    return frameAt(lerp(850, 900, t), 802, lerp(860, 840, t), lerp(2.15, 2.6, t));
  }
  if (fr < S1A.from) {
    // AG1: held wide, a gentle 90 px lateral truck (blueprint 3.2b)
    const t = EASE.inOut(clamp((fr - AG1.from) / AG1.frames));
    return frameAt(lerp(790, 880, t), CHARU.y, 905, 1.3);
  }
  if (fr < SWAP_CUT) return frameAt(860, 802, 840, 2.15); // Shot 1: medium two-shot, feet clear of the caption
  if (fr < CU_CHARU) {
    // AG2: medium close on the plate and his hands, slow push 1.0 -> 1.15x as he reaches
    const t = EASE.inOut(clamp((fr - AG2.from) / AG2.frames));
    return frameAt(925, PLATE.y - 16, 760, lerp(2.4, 2.76, t));
  }
  if (fr >= INSERT.from && fr < INSERT.to) {
    // Insert on the doll on the brass plate; rack focus to the empty courtyard and back
    const rack = track(fr, [
      [INSERT.from + 34, 1],
      [INSERT.from + 50, 0.78, "inOut"],
      [INSERT.to - 14, 0.78],
      [INSERT.to - 2, 1, "inOut"],
    ]);
    return { ...frameAt(DOLL_ON_PLATE.x, DOLL_ON_PLATE.y, 500, 5.2), focus: rack };
  }
  if (fr < BRO_WALK.from + 6) return frameAt(652, CHARU_HEAD_Y, 430, 3.8); // Shot 2: close-up on Charu (+ P1)
  if (fr < SHOT4) {
    // The brother walks Biru in through the arch; the camera meets them, then settles for the line.
    const bro = broSpot(fr);
    const pair = bro.x - 54;
    const settle = EASE.inOut(clamp((fr - SHOT3) / 18));
    return frameAt(lerp(pair, 1000, settle), 802, 830, lerp(1.85, 2.2, settle));
  }
  if (fr < SHOT5) return frameAt(900, 802, 820, 2.35); // Shot 4: medium two-shot, the scolding
  if (fr < P2_CUT) {
    // Shot 5: medium close-up on Balak; push 1.0 -> 1.15x on "আমার রঙচঙে পুতুলটা"
    const t = EASE.inOut(clamp((fr - (S1E.from + 268)) / 70));
    return frameAt(BST.x - 14, BALAK_STAND_HEAD_Y, 430, lerp(3.5, 4.0, t));
  }
  if (fr < SHOT6) return frameAt(700, CHARU_HEAD_Y, 440, 3.6); // P2: Charu, palm to her forehead
  if (fr < SHOT7) return frameAt(560, 790, 780, 2.55); // Shot 6: Jyethi by the veranda, Charu nearer the camera
  return frameAt(712, CHARU_HEAD_Y, 450, 3.6); // Shot 7: medium close on Charu, held through P3 and the dissolve
};

/* ------------------------------------------------------------------ */
/* Charu                                                                */
/* ------------------------------------------------------------------ */

/** A bel leaf held at the stalk. */
const BelLeafProp: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale * 0.9}) translate(0, -6)`}>
    {[-48, 0, 48].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <ellipse cx={0} cy={-9} rx={4.2} ry={9} fill="#4f7d2c" />
        <path d="M0 -1 L0 -16" stroke="#2f5418" strokeWidth={0.8} />
      </g>
    ))}
  </g>
);
/** The small brass puja bell (handle up in the fist). */
const BellArt: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <g transform={`scale(${s})`}>
    <rect x={-2.6} y={-22} width={5.2} height={16} rx={2} fill="#a8761e" stroke="#5a3a0c" strokeWidth={0.8} />
    <circle cx={0} cy={-23} r={3.4} fill="#c8922e" stroke="#5a3a0c" strokeWidth={0.8} />
    <path d="M -11 12 Q -10 -6 0 -7 Q 10 -6 11 12 Z" fill="#d8a640" stroke="#5a3a0c" strokeWidth={1} />
    <ellipse cx={0} cy={12} rx={11} ry={2.6} fill="#9c6a18" />
    <path d="M -6 8 Q -5 -2 -1 -4" stroke="#ffe7a8" strokeWidth={1.4} fill="none" opacity={0.7} />
  </g>
);
const BellProp: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale}) translate(0, 20)`}>
    <BellArt s={0.9} />
  </g>
);
const CHARU_PROPS: Record<string, PropRenderer> = { bel: BelLeafProp, bell: BellProp };

const charuBase = (fr: number): Partial<Pose> => {
  const base: Partial<Pose> = { kneel: 1, bodyTurn: 0.85, lean: 4, headTilt: 4, smile: 0.3, lid: 0.2, eyeY: 0.25 };
  if (fr < PRANAM_AT) {
    // AG1: the far hand rings the little bell; Shot 1: the bel leaf at her forehead (eyes closed), held out, tossed
    // gently onto the plate; then her hands rest before the pranam
    const toHead = track(fr, [
      [LEAF.head - 16, 0],
      [LEAF.head, 1, "inOut"],
      [LEAF.head + 10, 1],
      [LEAF.out - 12, 0, "inOut"],
    ]);
    const out = track(fr, [
      [LEAF.out - 16, 0],
      [LEAF.out, 1, "inOut"],
      [LEAF.toss + 6, 1],
      [LEAF.toss + 30, 0, "inOut"],
    ]);
    const flick = track(fr, [
      [LEAF.toss - 6, 0],
      [LEAF.toss - 2, -1, "inOut"],
      [LEAF.toss + 3, 1, "out"],
      [LEAF.toss + 12, 0, "inOut"],
    ]);
    const rest = 1 - Math.max(toHead, out);
    const bellUp = track(fr, [
      [0, 1],
      [S1A.from - 8, 1],
      [S1A.from + 4, 0, "inOut"],
    ]);
    const ring = ringBell(fr, BELL_RING, 26, 9);
    const leafIn = fr >= S1A.from && fr < LEAF.toss;
    return {
      ...base,
      lean: 4 + 3 * out + 2 * toHead,
      // Left arm, she faces the plate (+x). A negative shoulder swings that hand toward the plate; reach keeps the elbow bent.
      lS: -8 * rest - 96 * toHead - 40 * out + 6 * flick,
      lE: -36 * rest - 118 * toHead + 64 * out - 10 * flick,
      reach: -out,
      reachUp: 0.2 * out,
      lHand: leafIn ? "hold" : out > 0.5 ? "open" : "relaxed",
      lProp: leafIn ? "bel" : "",
      rS: lerp(14, 34, bellUp),
      rE: lerp(-50, 78, bellUp) + ring,
      rHand: bellUp > 0.5 ? "hold" : "relaxed",
      rProp: bellUp > 0.5 ? "bell" : "",
      headTilt: 6 + 6 * toHead + 3 * out,
      lid: 0.2 + 0.6 * toHead,
      eyeY: 0.25 - 0.1 * toHead,
    };
  }
  const pr = kneelingPranam(fr, {
    start: PRANAM_AT,
    join: 14,
    down: 30,
    hold: Math.max(10, STARTLE - (PRANAM_AT + 44)),
    up: 18,
    release: 14,
  });
  // the startle at the clink: a jolt, the quick rise, wide eyes
  const jolt = track(fr, [
    [STARTLE - 1, 0],
    [STARTLE + 2, 1, "out"],
    [STARTLE + 9, 0, "inOut"],
  ]);
  const startled = track(fr, [
    [STARTLE, 0],
    [STARTLE + 10, 1, "out"],
    [S1C.from - 10, 1],
    [S1C.from + 20, 0.35, "inOut"],
  ]);
  // turn from the plate (side view) to three-quarter once she is upright (Ghibli safe turn for the close-up)
  const turnFront = track(fr, [
    [STARTLE + 24, 0],
    [STARTLE + 44, 1, "inOut"],
    [SHOT7 - 4, 1],
    [SHOT7 + 16, 2, "inOut"],
  ]);
  const bodyTurn = turnFront <= 1 ? lerp(0.85, 0.34, turnFront) : lerp(0.34, -0.3, turnFront - 1);
  // "অ্যাঁ!": her hand flies to her mouth (near = left arm), down again on "আমার মাটির শিব…"
  const toMouth = track(fr, [
    [S1B.from, 0],
    [S1B.from + 8, 1, "out"],
    [S1B.from + 44, 1],
    [S1B.from + 60, 0, "inOut"],
  ]);
  // eyes dart: to the plate, then (after the insert) round to the empty spot, calling him
  const dart = track(fr, [
    [S1B.from + 50, 0],
    [S1B.from + 60, 1, "inOut"],
    [INSERT.to + 4, 1],
    [INSERT.to + 14, 1.6, "inOut"],
    [S1C.from - 4, 1.6],
    [S1C.from + 6, 1.2, "inOut"],
  ]);
  const look = lookAround(fr, S1B.from + 214, 34, 0.22, 1);
  // Shot 3/4: stern listening, then the scold: a wagging finger, then fists on the hips
  const stern = track(fr, [
    [S1C.from + 80, 0],
    [S1C.from + 120, 0.6, "inOut"],
    [S1D.from - 4, 1, "inOut"],
    [S1D.to + 10, 1],
    [S1E.from + 300, 0.45, "inOut"],
  ]);
  const wag = track(fr, [
    [S1D.from - 2, 0],
    [S1D.from + 12, 1, "inOut"],
    [S1D.from + 92, 1],
    [S1D.from + 104, 0, "inOut"],
  ]);
  const hips = track(fr, [
    [S1D.from + 96, 0],
    [S1D.from + 112, 1, "inOut"],
    [S1E.from + 130, 1],
    [S1E.from + 150, 0, "inOut"],
  ]);
  const toBalak = track(fr, [
    [SHOT4 - 10, 0],
    [S1D.from + 4, 1, "inOut"],
  ]);
  // P2: palm to her forehead (helpless disbelief), down again in Shot 6
  const palm = track(fr, [
    [P2_CUT - 4, 0],
    [P2_CUT + 12, 1, "inOut"],
    [SHOT6 + 22, 1],
    [SHOT6 + 40, 0, "inOut"],
  ]);
  const palmE = track(fr, [
    [P2_CUT - 8, 0],
    [P2_CUT + 6, 1, "inOut"],
    [SHOT6 + 24, 1],
    [SHOT6 + 36, 0, "inOut"],
  ]);
  // Shot 6: she glances over at Jyethi; Shot 7: turns to her, sighs, a half-smile of awe, leans in
  const toJyethi = track(fr, [
    [S1F.from + 10, 0],
    [S1F.from + 26, 1, "inOut"],
  ]);
  const awe = track(fr, [
    [S1G.from + 4, 0],
    [S1G.from + 40, 1, "inOut"],
  ]);
  const lean = track(fr, [
    [S1G.from + 60, 0],
    [S1G.from + 100, 1, "inOut"],
  ]);
  const handsDown = fr > PRANAM_AT + 14 + 30 + Math.max(10, STARTLE - (PRANAM_AT + 44)) + 18 + 14;

  // arms: the pranam's own, then the gestures on the near (left) arm while she faces right
  let lS = pr.lS ?? -4;
  let lE = pr.lE ?? -38;
  let lHand: Pose["lHand"] = (pr.lHand as Pose["lHand"]) ?? "relaxed";
  if (handsDown) {
    lS = -6;
    lE = -40;
    lHand = "relaxed";
    if (palm > 0 || palmE > 0) {
      lS = lerp(lS, GESTURES.palmToForehead.rS!, palm);
      lE = lerp(lE, GESTURES.palmToForehead.rE!, palmE);
      lHand = palm > 0.3 ? "open" : lHand;
    }
  }
  return {
    ...base,
    ...pr,
    bodyTurn,
    bow: Math.max(0, (pr.bow ?? 0) - 0.12 * jolt),
    lS,
    lE,
    lHand,
    // the scold: the right hand (on his side of her) comes up, index finger raised, wagging gently (never a swing)
    rS: handsDown ? lerp(4, -50, wag) : pr.rS,
    rE: handsDown ? lerp(-40, -64, wag) + wobble(fr, S1D.from + 8, 88, 10, 13) * wag : pr.rE,
    rHand: handsDown ? (wag > 0.4 ? "point" : "relaxed") : pr.rHand,
    mouthHand: -toMouth,
    hips: handsDown ? hips : 0,
    headTurn:
      0.12 * dart +
      look.headTurn +
      0.18 * toBalak * (1 - toJyethi) -
      0.75 * toJyethi * (1 - (turnFront > 1 ? turnFront - 1 : 0)) -
      0.22 * (turnFront > 1 ? turnFront - 1 : 0) +
      headShake(fr, S1D.from + 40, 44, 0.12, 2),
    headTilt: (pr.headTilt ?? 0) + 3 - 2 * startled + 4 * awe,
    headNod: -2 * startled + 3 * lean,
    lean: 4 + 6 * toBalak * (1 - toJyethi) + 7 * lean - 4 * palm,
    eyeY: 0.3 * startled + 0.08 * stern - 0.1 * dart,
    eyeX: 0.15 * dart + look.eyeX,
    lid: handsDown ? lerp(0.12, 0.02, startled) + 0.06 * stern + 0.1 * awe : pr.lid,
    brow: 0.55 * startled - 0.15 * stern + 0.35 * palm + 0.2 * awe,
    browTilt: -0.6 * stern * (1 - palm) + 0.35 * palm + 0.25 * awe,
    gasp: 0.32 * startled * (1 - stern) * (1 - toMouth * 0.5),
    smile: handsDown ? lerp(lerp(0.25, 0.02, Math.max(startled, stern)), 0.42, awe) : 0.25,
    cheeks: 0.2 * stern + 0.15 * awe,
  };
};
const charuActing = withGhibliActing(charuBase, { personality: "mother", seed: 31, speechRms: charuTalk, speechActAmp: 0.6 });
const charuBreath = (fr: number) => track(fr, [
  [STARTLE - 1, 1],
  [STARTLE + 6, 1.7, "out"],
  [S1C.from + 30, 1.15, "inOut"],
  [S1D.from, 1.3, "inOut"],
  [S1E.from + 60, 1, "inOut"],
]);
const charuSigh = sighCurve(S1G.from - 2, 26, 52, 4);

/* ------------------------------------------------------------------ */
/* Elder brother                                                        */
/* ------------------------------------------------------------------ */

const broSpot = ghibliWalkSpot(BRO_START, BRO_END, BRO_WALK.from, BRO_WALK.to, 17);
const broStride = ghibliStrideOf(broSpot, EP04G_CAST.elderBrother);

const broBase = (fr: number): Partial<Pose> => {
  const hand = track(fr, [
    [BRO_WALK.to - 10, 0],
    [BRO_WALK.to, 1, "inOut"],
    [S1D.from + 20, 1],
    [S1D.from + 36, 0, "inOut"],
  ]);
  const point = track(fr, [
    [S1C.from + 86, 0],
    [S1C.from + 98, 1, "inOut"],
    [S1C.from + 180, 1],
    [S1C.from + 196, 0, "inOut"],
  ]);
  const proud = track(fr, [
    [S1C.from - 4, 0],
    [S1C.from + 8, 1, "inOut"],
    [S1C.from + 40, 1],
    [S1C.from + 60, 0.4, "inOut"],
  ]);
  return {
    bodyTurn: -0.32,
    headTurn: -0.36 + 0.06 * point,
    headTilt: -3 * proud,
    headNod: -2 * proud + 2 * point,
    stride: broStride(fr),
    reach: point > 0.2 ? 0.85 * point : hand * 0.4,
    reachUp: 0,
    // He faces Biru (bodyTurn < 0). The right hand points, and the target stays close so the elbow bends.
    rS: lerp(8, 28, point),
    rE: lerp(-20, -62, point) + wobble(fr, S1C.from + 110, 60, 3, 8) * point,
    rHand: point > 0.45 ? "point" : "open",
    lS: 8,
    lE: -30,
    lHand: "relaxed",
    lean: 2 + 3 * point,
    eyeY: 0.25 * point,
    brow: 0.3 * proud + 0.2 * point,
    smile: 0.3 + 0.25 * proud,
  };
};
const broActing = withGhibliActing(broBase, { personality: "child", seed: 211, speechRms: broTalk, speechActAmp: 0.7 });
const broBreath = (fr: number) => track(fr, [
  [BRO_WALK.to, 1.9],
  [S1D.from, 1.15, "inOut"],
]);

/* ------------------------------------------------------------------ */
/* Jyethi                                                               */
/* ------------------------------------------------------------------ */

const jyethiBase = (fr: number): Partial<Pose> => {
  const cheek = track(fr, [
    [S1F.from - 4, 0],
    [S1F.from + 10, 1, "inOut"],
    [S1F.from + 92, 1],
    [S1F.from + 108, 0, "inOut"],
  ]);
  const open = track(fr, [
    [S1F.from + 100, 0],
    [S1F.from + 116, 1, "inOut"],
    [S1F.from + 200, 1],
    [S1F.from + 216, 0, "inOut"],
  ]);
  const listen = track(fr, [
    [S1G.from - 10, 0],
    [S1G.from + 20, 1, "inOut"],
  ]);
  return {
    bodyTurn: 0.3,
    headTurn: 0.34 + headShake(fr, S1F.from + 6, 70, 0.2, 3) + headShake(fr, S1F.from + 210, 56, 0.14, 2),
    headTilt: headShakeTilt(fr, S1F.from + 6, 70, 2.5, 3) - 4 * listen,
    brow: 0.55 * Math.max(cheek, open) + 0.25 * listen,
    browTilt: 0.35 * cheek,
    eyeY: 0.1,
    smile: 0.12 + 0.2 * listen,
    mouthHand: -cheek,
    rS: lerp(6, -30, open),
    rE: lerp(-30, -40, open),
    rHand: open > 0.5 ? "open" : "relaxed",
    lean: 2 + 3 * listen,
  };
};
const jyethiActing = withGhibliActing(jyethiBase, { personality: "mother", seed: 77, speechRms: jyethiTalk, speechActAmp: 0.6 });

/* ------------------------------------------------------------------ */
/* Standing Balak (Shots 3-7): the clay ball and his gestures (figure units before the flip) */
/* ------------------------------------------------------------------ */

const ST_BALL: V = { x: 42, y: -292 };
const standingHands = (fr: number): { near: V; far: V; ball: "mid" | "far" } => {
  const a = fr * 0.26;
  const e = S1E.from;
  // the ball's centre: at the chest, held up on "মা, তুমি তো…", back down, out a little toward the doll at the end
  const up = track(fr, [
    [e - 4, 0],
    [e + 14, 1, "inOut"],
    [e + 80, 1],
    [e + 100, 0, "inOut"],
  ]);
  const c: V = { x: ST_BALL.x + 6 * up, y: ST_BALL.y - 46 * up };
  const roll = 1 - up * 0.7;
  const mid = {
    near: { x: c.x - 13 + 3 * Math.cos(a) * roll, y: c.y + 2 + 4 * Math.sin(a) * roll },
    far: { x: c.x + 13, y: c.y - 2 - 2 * Math.sin(a) * roll },
  };
  // "ঘরের পেছনে ফেলে দাও": the near hand flicks back over his shoulder (the far hand keeps the ball at his chest)
  const back = track(fr, [
    [e + 118, 0],
    [e + 132, 1, "inOut"],
    [e + 150, 1],
    [e + 168, 0, "inOut"],
  ]);
  // "ওটা আর ফেলতে হবে না!": an open palm toward the doll on the plate
  const show = track(fr, [
    [e + 352, 0],
    [e + 366, 1, "inOut"],
    [e + 402, 1],
    [e + 424, 0, "inOut"],
  ]);
  const free = Math.max(back, show);
  const farHold: V = { x: c.x + 6, y: c.y + 4 };
  const backAt: V = { x: -24, y: -404 };
  const showAt: V = { x: 150, y: -236 };
  const nearFree = back >= show ? backAt : showAt;
  return {
    near: { x: lerp(mid.near.x, nearFree.x, free), y: lerp(mid.near.y, nearFree.y, free) },
    far: { x: lerp(mid.far.x, farHold.x, free), y: lerp(mid.far.y, farHold.y, free) },
    ball: free > 0.5 ? "far" : "mid",
  };
};

/* ------------------------------------------------------------------ */
/* Set pieces                                                           */
/* ------------------------------------------------------------------ */

const BrassPlate: React.FC<{ f: number; leafOffered: boolean }> = ({ f, leafOffered }) => {
  const { x, y, rx, ry } = PLATE;
  return (
    <g>
      <ellipse cx={x} cy={y + 3} rx={rx + 4} ry={ry + 3} fill="#3a2208" opacity={0.28} />
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#b98a2e" stroke="#4a3014" strokeWidth={1.4} />
      <ellipse cx={x} cy={y - 1} rx={rx * 0.84} ry={ry * 0.7} fill="#e2b75c" />
      <ellipse cx={x - rx * 0.25} cy={y - 2} rx={rx * 0.42} ry={ry * 0.22} fill="#fff0c0" opacity={0.6} />
      {/* bel leaves and white flowers round the rim */}
      {[
        { dx: -0.72, rot: -70 },
        { dx: 0.62, rot: 64 },
      ].map((l, i) => (
        <g key={i} transform={`translate(${x + l.dx * rx} ${y - 1}) rotate(${l.rot}) scale(0.5)`}>
          {[-48, 0, 48].map((a) => (
            <ellipse key={a} cx={0} cy={-9} rx={4} ry={9} fill="#4f7d2c" transform={`rotate(${a})`} />
          ))}
        </g>
      ))}
      {leafOffered && (
        <g transform={`translate(${x - rx * 0.4} ${y - 2}) rotate(-20) scale(0.44)`}>
          {[-48, 0, 48].map((a) => (
            <ellipse key={a} cx={0} cy={-9} rx={4} ry={9} fill="#5a8a30" transform={`rotate(${a})`} />
          ))}
        </g>
      )}
      {[-0.5, 0.46, 0.18].map((dx, i) => (
        <g key={i} transform={`translate(${x + dx * rx} ${y - 2 + (i === 2 ? 2 : 0)})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={0} cy={-2.4} rx={1.5} ry={2.6} fill="#fffaf0" transform={`rotate(${a})`} />
          ))}
          <circle r={1} fill="#f2c040" />
        </g>
      ))}
      {/* the diya at the back right of the plate (only the flame glows; never the clay Shiva or the doll) */}
      <g transform={`translate(${x + rx * 0.58} ${y - 4})`}>
        <path d="M -7 0 Q 0 5 7 0 Q 5 -4 0 -4 Q -5 -4 -7 0 Z" fill="#b8642c" stroke="#5a2a10" strokeWidth={0.8} />
        <ellipse cx={0} cy={-3} rx={5} ry={1.4} fill="#7a3a18" />
        <Flame x={2} y={-3} s={0.42} f={f} seed={41} />
      </g>
      <GhibliSmokeCurls x={x + rx * 0.9} y={y - 8} f={f} scale={0.5} />
    </g>
  );
};

/** Where her near hand lets the bel leaf go (world) and the arc onto the plate. */
const LEAF_FROM: V = { x: CHARU.x + 118, y: CHARU.y - 124 };
const FlyingLeaf: React.FC<{ f: number }> = ({ f }) => {
  if (f < LEAF.toss || f >= LEAF.land) return null;
  const u = (f - LEAF.toss) / (LEAF.land - LEAF.toss);
  const to = { x: PLATE.x - PLATE.rx * 0.4, y: PLATE.y - 2 };
  const x = lerp(LEAF_FROM.x, to.x, u);
  const y = lerp(LEAF_FROM.y, to.y, u) - 40 * Math.sin(Math.PI * u);
  return (
    <g transform={`translate(${x} ${y}) rotate(${-20 - 160 * u}) scale(0.44)`}>
      {[-48, 0, 48].map((a) => (
        <ellipse key={a} cx={0} cy={-9} rx={4} ry={9} fill="#5a8a30" transform={`rotate(${a})`} />
      ))}
    </g>
  );
};

/** Warm morning sunlight blooming into the flashback over P3 (Episode04Ghibli adds the wash across the cut). */
const FlashbackWarmth: React.FC<{ f: number }> = ({ f }) => {
  const k = EASE.inOut(clamp((f - (S1G.to - 6)) / Math.max(1, SCENE_FRAMES - (S1G.to - 6))));
  if (k <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 0.55 * k,
        background: "radial-gradient(ellipse 75% 70% at 62% 38%, rgba(255,236,190,0.95) 0%, rgba(255,214,150,0.55) 45%, rgba(255,200,130,0.15) 100%)",
      }}
    />
  );
};

/**
 * The 3-second proof only: morning sun across the two of them, a warm veil so the ink takes the
 * courtyard's colour, and a little leaf litter over the cut where the figures meet the floor.
 */
const FeelMorning: React.FC<{ f: number }> = ({ f }) => {
  if (f >= FEEL_FRAMES) return null;
  const sway = Math.sin(f * 0.09);
  const blade = (x: number, y: number, h: number, lean: number, key: string) => (
    <path
      key={key}
      d={`M ${x} ${y} q ${lean + sway} ${-h * 0.6} ${lean * 0.4} ${-h}`}
      fill="none"
      stroke="#5c6a38"
      strokeWidth={1.3}
      strokeLinecap="round"
      opacity={0.55}
    />
  );
  return (
    <g pointerEvents="none">
      <GhibliSunRays
        lifeF={f}
        openings={[{ x: 1040, y: 250, w: 180, h: 240, arch: true }]}
        angle={132}
        length={560}
        intensity={0.32}
        motes={5}
        color="#ffe6b0"
      />
      <GhibliDappledLight
        region={{ x: 520, y: 620, w: 620, h: 200 }}
        lifeF={f}
        mode="light"
        intensity={0.28}
        squash={0.42}
        density={0.6}
      />
      <g style={{ mixBlendMode: "soft-light" }} opacity={0.42}>
        <ellipse cx={860} cy={640} rx={520} ry={340} fill="#f0c27a" />
      </g>
      <g>
        {blade(600, 806, 16, -4, "a")}
        {blade(628, 810, 22, 3, "b")}
        {blade(668, 804, 14, -2, "c")}
        {blade(980, 808, 18, 4, "d")}
        {blade(1018, 812, 20, -3, "e")}
        {blade(1052, 806, 13, 2, "f")}
        <ellipse cx={646} cy={808} rx={18} ry={5} fill="#6a4028" opacity={0.35} transform={`rotate(${-18 + sway * 4} 646 808)`} />
        <ellipse cx={1036} cy={810} rx={14} ry={4} fill="#8a5030" opacity={0.3} transform={`rotate(${24 - sway * 3} 1036 810)`} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene01ClayShivaGhibli: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f);
  cam.dof = zoomProportionalDof(cam.zoom);

  /* ---- Balak, seated (to the end of AG2) ---- */
  const seated = f < CU_CHARU;
  const inSwap = f >= SWAP_CUT;
  const bx = seatX(f);
  const kneel = seatKneel(f);
  const seatedBase: SeatedChildProps = {
    x: bx,
    y: BS.y + seatDip(f),
    s: BS.s,
    flip: true,
    design: "plate",
    build: "healthy",
    age: 5,
    f,
    lifeF: f,
    kneel,
    mouth: 0,
    ...(inSwap
      ? {
          pose: "handsTo" as const,
          poseStart: SWAP_CUT - 30,
          handTargets: swapTargets(f, bx),
          handShapes: f < BOTH_ON_CLAY ? { near: "grip" as const, far: "grip" as const } : { near: "cup" as const, far: "cup" as const },
          expression: "playful" as const,
        }
      : {
          pose: "holdInLap" as const,
          holding: "doll" as const,
          watchHeld: track(f, [
            [S1A.from + 150, 0],
            [S1A.from + 166, 0.75, "inOut"],
            [S1A.from + 196, 0.75],
            [S1A.from + 212, 0, "inOut"],
          ]),
          // watching his mother at her puja (wonder); at the end of the line his eyes go to the plate
          face: {
            lookX: track(f, [
              [S1A.from + 240, 0.42],
              [S1A.from + 262, 0.7, "inOut"],
            ]),
            eyesDown: track(f, [
              [PRANAM_AT + 20, 0],
              [PRANAM_AT + 44, 0.35, "inOut"],
            ]),
            smile: 0.45,
          },
          expression: "serene" as const,
        }),
  };
  const anchors = seated ? seatedEp6Anchors(seatedBase) : null;
  // objects in his hands, drawn at the rig's own drawn palms (MOT-07)
  let inHands: React.ReactNode = null;
  let shivaFree = f < FAR_GRIP;
  let dollOnPlate = f >= CLINK;
  if (anchors && inSwap) {
    const nodes: React.ReactNode[] = [];
    if (f < CLINK) {
      // the doll in the near hand (and both hands, in the lap, at the start)
      const p = anchors.nearPalm;
      const dollRot = -6 * track(f, [
        [RISE + 10, 0],
        [FAR_GRIP, 1, "inOut"],
        [CLINK - 6, 0, "inOut"],
      ]);
      nodes.push(<HeldObjectArt key="doll" kind="doll" x={p.x} y={p.y - DOLL_GY * OBJ_S} s={OBJ_S} rot={dollRot} lifeF={f} />);
    }
    if (f >= FAR_GRIP) {
      const squeeze = clamp((f - ROLL_SQUEEZE.from) / (ROLL_SQUEEZE.to - ROLL_SQUEEZE.from));
      const onFar = { x: anchors.farPalm.x, y: anchors.farPalm.y - SHIVA_GY * OBJ_S };
      const between = { x: (anchors.nearPalm.x + anchors.farPalm.x) / 2, y: (anchors.nearPalm.y + anchors.farPalm.y) / 2 };
      const w = clamp((f - (BOTH_ON_CLAY - 4)) / 6);
      const c = { x: lerp(onFar.x, between.x, w), y: lerp(onFar.y, between.y, w) };
      const spin = f > BOTH_ON_CLAY ? (f - BOTH_ON_CLAY) * 9 : 0;
      if (squeeze < 1) nodes.push(<HeldObjectArt key="shiva" kind="clayShiva" x={c.x} y={c.y} s={OBJ_S * (1 - 0.25 * squeeze)} opacity={1 - squeeze} lifeF={f} />);
      if (squeeze > 0) nodes.push(<HeldObjectArt key="lump" kind="clayLump" x={c.x} y={c.y} s={OBJ_S} rot={spin} opacity={squeeze} lifeF={f} />);
    }
    inHands = <>{nodes}</>;
  }
  if (!inSwap) {
    shivaFree = true;
    dollOnPlate = false;
  }
  const seatedProps: SeatedChildProps = { ...seatedBase, propInHands: inHands };
  const seatedGlow = anchors?.glowAnchor;

  /* ---- Balak, standing (walks in with his brother, then stays) ---- */
  const broNow = broSpot(f);
  const walkingIn = f >= BRO_WALK.from && f < BRO_WALK.to;
  const standing = f >= BRO_WALK.from;
  const standX = walkingIn ? broNow.x - 108 : BST.x;
  const standY = BST.y - (walkingIn ? Math.abs(Math.sin((f - BRO_WALK.from) * 0.5)) * 3 : 0);
  const hands = standingHands(f);
  const standingBase: StandingChildProps = {
    x: standX,
    y: standY,
    s: BST.s,
    headScale: BST.head,
    flip: true,
    build: "healthy",
    age: 5,
    f,
    lifeF: f,
    pose: "handInHands",
    poseStart: SHOT3 - 40,
    handTargets: { near: hands.near, far: hands.far },
    palmUp: 0.55,
    mouth: balakMouth(f),
    talk: balakTalk(f),
    expression:
      f >= S1E.from + 352 ? "joyful" : f >= S1E.from - 4 && f < S1E.to ? "playful" : "serene",
    expressionStart: f >= S1E.from + 352 ? S1E.from + 352 : f >= S1E.to ? S1E.to : S1E.from - 4,
    prevExpression: f >= S1E.from + 352 ? "playful" : f >= S1E.to ? "joyful" : "serene",
    face: {
      // looks at his ball while his brother tells on him, up at his mother for the scold and his answer, at the doll
      // on "ওটা আর ফেলতে হবে না!"
      lookX: track(f, [
        [S1C.from + 60, 0.15],
        [S1C.from + 80, 0.45, "inOut"],
        [S1E.from + 340, 0.45],
        [S1E.from + 356, 0.7, "inOut"],
        [S1E.to, 0.7],
        [S1E.to + 16, 0.45, "inOut"],
      ]),
      lookY: track(f, [
        [S1C.from + 60, 0.5],
        [S1C.from + 80, 0.05, "inOut"],
        [S1E.from + 340, 0.05],
        [S1E.from + 356, 0.45, "inOut"],
        [S1E.to, 0.45],
        [S1E.to + 16, 0.05, "inOut"],
      ]),
      smile: 0.5,
    },
  };
  const sj = standing ? standingChildJoints(standingBase) : null;
  const ballAt = sj ? (hands.ball === "far" ? { x: sj.handFar.x, y: sj.handFar.y - 3 } : { x: (sj.handNear.x + sj.handFar.x) / 2, y: (sj.handNear.y + sj.handFar.y) / 2 }) : null;
  const ballSpin = (f - SHOT3) * 6 * (1 - (hands.ball === "far" ? 1 : 0));
  const standingProps: StandingChildProps = {
    ...standingBase,
    layerMid: ballAt ? <HeldObjectArt kind="clayLump" x={ballAt.x} y={ballAt.y} s={OBJ_S} rot={ballSpin} lifeF={f} /> : undefined,
  };

  /* ---- the brother ---- */
  const showBro = f >= BRO_WALK.from;
  const bro = broSpot(f);
  const broReachAt = (fr: number): V => {
    const pointing = track(fr, [
      [S1C.from + 86, 0],
      [S1C.from + 98, 1, "inOut"],
      [S1C.from + 180, 1],
      [S1C.from + 196, 0, "inOut"],
    ]);
    if (pointing > 0.2) {
      const b = broSpot(fr);
      return { x: b.x - 118, y: b.y - 158 };
    }
    const j = standingChildJoints({ ...standingBase, f: fr, lifeF: fr, handTargets: standingHands(fr) });
    return { x: j.shoulderNear.x + 4, y: j.shoulderNear.y + 4 };
  };

  const showJyethi = f >= SHOT3;
  const leafOffered = f >= LEAF.land;
  const bellOnFloor = f >= S1A.from;

  return (
    <GhibliStage cam={cam}>
      <GhibliPreload files={PRELOAD} />
      <GhibliCourtyardBackdrop f={f} mode="morning" sparrowFlyAt={AG1.from + 42} />

      <GhibliLayer depth={1.0}>
        <GhibliCharFilterDefs f={f} />

        {/* the brass taat, the clay Shiva on it until he lifts it, the doll from the clink on */}
        <BrassPlate f={f} leafOffered={leafOffered} />
        {shivaFree && <HeldObjectArt kind="clayShiva" x={SHIVA_ON_PLATE.x} y={SHIVA_ON_PLATE.y} s={OBJ_S} lifeF={f} />}
        {dollOnPlate && (
          <HeldObjectArt
            kind="doll"
            x={DOLL_ON_PLATE.x}
            y={DOLL_ON_PLATE.y}
            s={OBJ_S}
            rot={-3 * (1 - EASE.out(clamp((f - CLINK) / 6)))}
            lifeF={f}
          />
        )}
        <FlyingLeaf f={f} />
        {bellOnFloor && (
          <g transform={`translate(${CHARU.x - 64} ${CHARU.y - 12})`}>
            <BellArt s={0.85} />
          </g>
        )}

        {showJyethi && (
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={JYETHI.x} y={JYETHI.y} rx={44} ry={10} opacity={0.28} />
            <Puppet
              cast={EP04G_CAST.jyethi}
              x={JYETHI.x}
              y={JYETHI.y}
              scale={JYETHI.s}
              f={f}
              lifeF={f}
              light={EP04G_MORNING_LIGHT}
              acting={jyethiActing}
              mouth={jyethiMouth}
              talk={jyethiTalk}
            />
          </g>
        )}

        <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={CHARU.x + 10} y={CHARU.y} rx={f < FEEL_FRAMES ? 78 : 62} ry={f < FEEL_FRAMES ? 14 : 12} opacity={f < FEEL_FRAMES ? 0.42 : 0.3} />
          <Puppet
            cast={EP04G_CAST.charu}
            x={CHARU.x}
            y={CHARU.y}
            scale={CHARU.s}
            f={f}
            lifeF={f}
            light={EP04G_MORNING_LIGHT}
            acting={charuActing}
            mouth={charuMouth}
            talk={charuTalk}
            props={CHARU_PROPS}
            reachAt={() => ({ x: CHARU.x + 108, y: CHARU.y - 148 })}
            breathRate={charuBreath(f)}
            sigh={charuSigh}
          />
        </g>

        {seated && (
          <>
            <GhibliBalakGroundGlow x={bx} y={BS.y + 4} rx={110} ry={20} level={0.42} />
            {seatedGlow && <GhibliBalakAura cx={seatedGlow.cx} cy={seatedGlow.cy} r={seatedGlow.r * 0.62} glow={0.5} f={f} />}
            <g filter="url(#ghibli-char-ink)">
              <ContactShadow x={bx} y={BS.y} rx={f < FEEL_FRAMES ? 58 : 46} ry={f < FEEL_FRAMES ? 11 : 9} opacity={f < FEEL_FRAMES ? 0.4 : 0.28} />
              <SeatedChild {...seatedProps} />
              {kneel < 0.05 && <GhibliBalakLapDetails x={bx} y={BS.y} s={BS.s} flip f={f} />}
            </g>
          </>
        )}

        {standing && sj && (
          <>
            <GhibliBalakGroundGlow x={standX} y={standY + 2} rx={80} ry={16} level={0.4} />
            <GhibliBalakAura cx={sj.glowAnchor.x} cy={sj.glowAnchor.y} r={64} glow={0.5} f={f} />
            <g filter="url(#ghibli-char-ink)">
              <ContactShadow x={standX} y={standY} rx={30} ry={7} opacity={0.3} />
              <StandingChild {...standingProps} />
            </g>
          </>
        )}

        {showBro && (
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={bro.x} y={bro.y} rx={38} ry={9} opacity={0.28} />
            <Puppet
              cast={EP04G_CAST.elderBrother}
              x={bro.x}
              y={bro.y}
              scale={bro.s}
              f={f}
              lifeF={f}
              light={EP04G_MORNING_LIGHT}
              acting={broActing}
              mouth={broMouth}
              talk={broTalk}
              reachAt={broReachAt}
              breathRate={broBreath(f)}
            />
          </g>
        )}
        <GhibliGroundCover x={860} y={808} w={720} lifeF={f} preset="courtyard" />
        <FeelMorning f={f} />
      </GhibliLayer>

      {f >= FEEL_FRAMES && <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} />}
      <FlashbackWarmth f={f} />
    </GhibliStage>
  );
};
