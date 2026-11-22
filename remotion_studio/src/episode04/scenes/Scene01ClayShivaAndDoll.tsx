import React from "react";
import { clamp, EASE, lerp, track } from "../../cinematic/core/anim";
import { Cam, Stage } from "../../cinematic/core/Stage";
import { Flame } from "../../cinematic/fx/Fx";
import { CAST } from "../../cinematic/rig/cast";
import { speechLevel, visemeFromEnvelope } from "../../cinematic/rig/lipsync";
import {
  BASE_POSE,
  GESTURES,
  Lighting,
  Pose,
  PropRenderer,
  Puppet,
  SceneLight,
  SceneLights,
  headShake,
  kneelingPranam,
  offerFlick,
  ringBell,
} from "../../cinematic/rig/Puppet";
import { BrassBell, VEDIC_COURTYARD_BG, VedicCourtyardDay, vedicCourtyardKeepInSet } from "../../cinematic/sets/VedicHouseDay";
import { clipLocalStory4, clipSpan4, cueLocalStory4, pausesFor4, storyToReal, useStory4 } from "../../episode/storyClock";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { HELD_OBJECT_BOTTOM, HeldObject, HeldObjectArt, SeatedChild, seatedChildHands } from "../../episode03/rig/SeatedChild";
import { EP04_SCENES } from "../timing";

/**
 * Episode 4, scene 01 (01_clay_shiva_and_doll): the clay Shiva and the wooden doll. Book chapter 6 ("বাড়ীতে মা
 * প্রতিদিন মাটি দিয়ে শিবলিঙ্গ তৈরী করে পুজো করেন… যেমন মা পূজো শেষ করে সাষ্টাঙ্গে প্রণাম করছেন অমনি বালক পুজোর টাট থেকে
 * মাটির শিব তুলে নিয়ে… কাঠের পুতুলটি বসিয়ে রেখেছে। পুতুলটি টাটে রাখতে গিয়ে একটু শব্দ হওয়াতে মা চমকে চেয়ে দেখেন টাটে শিব
 * নেই… শিবটাকে হাতে পাকিয়ে গোল করে ফেলেছে"). Approved plan STO-19,
 * 03_Episodes/Episode_04_Idols_and_Coconut_Water/01_Script_and_Storyboard/Ep04_Shots_and_Pauses_DRAFT.md, "Scene 01".
 *
 * Place: the Vedic house inner courtyard on a clear morning (VedicCourtyardDay, "morning", src/cinematic/sets/
 * VedicHouseDay.tsx), with the near veranda (its red-oxide floor on the 1.0 plane) where Charu does her daily puja.
 * Nobody else is present. Charu (CAST.charu) kneels at the right of a long low wooden pidi, facing left, with her
 * brass taat on it: the clay Shivalinga she made (bel leaf, two white flowers), a diya, bel leaves and flowers.
 * Balak (SeatedChild, about five) sits a little back at the left with his painted fair doll in his lap, watching her.
 *
 * Choreography (book order): she bows down long (Puppet kneelingPranam); he rises onto his knees, shuffles to the
 * pidi with the doll to his chest and stands it on the pidi; lifts the clay Shiva off the plate and sets it aside at
 * the pidi's end ("সরিয়ে"); picks the doll up and sets it on the plate (offerUp): a small tap of wood on brass; she
 * startles and comes up from her bow; he picks the clay Shiva up again and rolls it into a ball between his palms
 * (rollClay), sitting back on his heels, unbothered, while she stares (P2). His line 01b answers her calmly, with a
 * faint smile and bright open eyes; she is startled, then scolds silently (stern brows, a head shake; no slaps, the
 * director left them out), speechless at the end (palm to the forehead). Only Balak's mouth moves.
 *
 * Clocks. `f` (story clock, useStory4) is used for the narration anchors only: every key below is a story frame
 * converted to the real local frame with R() (storyToReal), and the camera, Charu and Balak all run on real frames
 * (lifeF). That keeps the two figures alive inside the pauses (Charu rings her bell in P1 and her hand goes to her
 * mouth in P2; Balak goes on rolling the clay in P2: "the story waits, life goes on") without any key landing
 * inside a pause by accident. Blinks, breathing and idle life run on lifeF in the rigs.
 *
 * Shots (CAM-13; hard cuts and holds only, no moves; keys tied to the narration cues + measured voice onsets):
 *   1 WIDE      from the fade-in, held through "…গড়ে পূজো করতেন।" and P1: the veranda, Charu at her puja, Balak
 *               watching with his doll, the courtyard and the tulsi mancha soft behind.
 *   2 MEDIUM    cut 2 f before "একদিন": the pidi and the plate at the left, Charu bowing down beyond, Balak behind at
 *               the left; on "ছোট্ট বীরু চুপিচুপি" he rises and shuffles to the pidi inside this frame.
 *   4 CLOSE     cut 2 f before "পূজোর থালায়": the pidi and the plate; his hands lift the Shiva, set it aside, set the
 *               doll on the plate (the tap), Charu's bowed head at the right comes up at the tap.
 *   P2 TWO-SHOT cut at the start of P2: Charu upright, staring, hand rising to her mouth; Balak rolling the clay.
 *   6 MCU       cut 7 f before "মা,": Balak on his heels by the pidi, the clay in his hands, looking up at her; the
 *               toss on "পেছনে ফেলে দাও" starts 7 f before the words.
 *   8 TWO-SHOT  cut 2 f before "আমি তো": Charu stern, Balak pointing at the doll on the plate; he beams on "ওটা আর
 *               ফেলতে হবে না!", held into P3 (her palm to her forehead) and the chapter break (Episode04 fades out).
 * Every cam goes through vedicCourtyardKeepInSet (no background edge, CAM-08).
 *
 * Sound is placed by Episode04.tsx; the event frames it needs are exported as SCENE01_EVENTS (story frames).
 */

const SCENE_ID = "01_clay_shiva_and_doll";
const SCENE = EP04_SCENES.find((s) => s.sceneId === SCENE_ID)!;
const PAUSES = pausesFor4(SCENE_ID);

/* ------------------------------------------------------------------ */
/* Narration anchors (story frames)                                     */
/* ------------------------------------------------------------------ */

const cueFrom = (snippet: string, fallback: number): number => cueLocalStory4(snippet, SCENE_ID)?.from ?? fallback;
/** Story frame -> real local frame. */
const R = (story: number): number => storyToReal(story, PAUSES);
const pauseReal = (i: number, fbStory: number, fbFrames: number): [number, number] => {
  const p = PAUSES[i];
  const s = R(p ? p.atStory : fbStory);
  return [s, s + (p ? p.frames : fbFrames)];
};

/**
 * Voice onsets inside the caption phrases (story frames), measured from the clips' silences (plan "Measured
 * silences"): 01a "একদিন" 4.70 s, "ছোট্ট বীরু" 6.97 s, "চুপিচুপি" 8.15 s, "পূজোর থালায়" 8.96 s, "বসিয়ে দিল" 10.78 s;
 * 01b "মা," 0.08 s, "তুমি তো" 1.38 s, "পেছনে ফেলে দাও" about 5.5 s, "আমি তো" 6.97 s, "ওটা আর" 9.56 s, end 10.64 s.
 */
const ONEDIN_CUE = cueFrom("একদিন", 104);
const CHUPI_CUE = cueFrom("চুপিচুপি", 185);
const V = {
  onedin: ONEDIN_CUE + 9,
  chotto: ONEDIN_CUE + 63,
  chupi: CHUPI_CUE + 11,
  pujor: CHUPI_CUE + 30,
  bosiye: cueFrom("সরিয়ে বসিয়ে", 263) - 4,
};
const BALAK_CLIP = clipLocalStory4("01b_Toddler_Thakur_Clay.wav", SCENE_ID) ?? { from: 392, to: 658 };
const B0 = BALAK_CLIP.from;
const VB = {
  ma: B0 + 2,
  tumi: B0 + 33,
  fele: B0 + 132,
  ami: B0 + 168,
  ota: B0 + 230,
  end: B0 + 256,
};

/** The three pauses (real local frames). */
const P1 = pauseReal(0, 104, 24); // after "…গড়ে পূজো করতেন।"
const P2 = pauseReal(1, 380, 48); // after "…কাঠের পুতুল!"

/* ------------------------------------------------------------------ */
/* Layout (world = the 1.0 plane of the courtyard set: the near veranda) */
/* ------------------------------------------------------------------ */

/** Balak's spot by the pidi (ground point, scale) and where he sits at the start (a little back, at the left). */
const BS = 1.2;
const BX = 860;
const BY = 1004;
const B_START = { x: 690, y: 990, s: 1.14 };
/** Figure units (Balak's, at the spot) -> world. */
const W = (ux: number, uy: number) => ({ x: BX + ux * BS, y: BY + uy * BS });

/** The long low wooden pidi (figure units): top at y -30, from x 34 to 128. */
const PIDI = { x0: 34, x1: 120, top: -30 };
/** The brass taat on the pidi: its centre and the surface the objects stand on (figure units). */
const PLATE = { x: 102, r: 24, surf: PIDI.top - 3 };
/** The two places on the pidi left of the plate: where he stands the doll, and where he sets the Shiva aside. */
const SPOT_DOLL = 68;
const SPOT_SHIVA = 46;
/** Object origin (grip centre) standing on the pidi or plate at x (figure units). */
const onSurf = (kind: HeldObject, x: number, surf: number) => ({ x, y: surf - HELD_OBJECT_BOTTOM[kind] });
const AT_PLATE_SHIVA = onSurf("clayShiva", PLATE.x, PLATE.surf);
const AT_PLATE_DOLL = onSurf("doll", PLATE.x, PLATE.surf);
const AT_SPOT_DOLL = onSurf("doll", SPOT_DOLL, PIDI.top);
const AT_SPOT_SHIVA = onSurf("clayShiva", SPOT_SHIVA, PIDI.top);

/** Charu kneels at the right of the pidi, a step nearer the camera, facing left. */
const CHARU = { x: 1355, y: 1062, s: 1.75 };

/* ------------------------------------------------------------------ */
/* Timeline (story frames; converted with R)                            */
/* ------------------------------------------------------------------ */

/** Charu: the bel leaf offering (shot 1), the bell (P1), the pranam (from "একদিন"), the startle at the tap. */
/** The bel leaf (real frames, shot 1 is before P1): at her forehead, held out, tossed onto the plate, landed. */
const LEAF = { head: 30, out: 52, toss: 58, land: 70 };
/** The far arm lifting the little bell to ring it in P1. */
const BELL_ARM = { S: 36, E: 78 };
const PRANAM_AT = V.onedin + 3;
const PRANAM_JOIN = 14;
const PRANAM_DOWN = 30;

/** Balak (story frames). */
const RISE_AT = V.chotto - 4; // "ছোট্ট বীরু": he glances at her bowed back and rises onto his knees
const SHUFFLE = { a: RISE_AT + 10, b: RISE_AT + 32 };
const DOLL_DOWN_AT = SHUFFLE.b; // offerUp: stands the doll on the pidi
const DOLL_DOWN_REL = DOLL_DOWN_AT + 18;
const LIFT_AT = V.pujor - 1; // kneelReach to the clay Shiva on the plate ("পূজোর থালায় মাটির শিব")
const LIFT_GRIP = LIFT_AT + 26;
const ASIDE_REL = LIFT_GRIP + 18; // offerUp: the Shiva set aside at the pidi's end ("সরিয়ে")
const DOLL_UP_AT = ASIDE_REL; // kneelReach to the doll
const DOLL_UP_GRIP = DOLL_UP_AT + 26;
const TAP = DOLL_UP_GRIP + 15; // offerUp onto the plate: wood touches brass ("বসিয়ে দিল")
const DOLL_PLACE_REL = TAP + 3;
const SHIVA_UP_AT = DOLL_PLACE_REL + 12; // kneelReach to the set-aside Shiva
const SHIVA_UP_GRIP = SHIVA_UP_AT + 26;
const ROLL_AT = SHIVA_UP_GRIP; // rollClay: squeezed into a ball over 36 f, sitting back on his heels

/** Charu's head comes up at the tap. */
const STARTLE_AT = TAP + 2;

/** Events Episode04.tsx needs for sound (story frames, scene-local; P2 starts at story 380). */
export const SCENE01_EVENTS = {
  bellRingReal: P1[0] + 3, // REAL local frame: her bell in P1
  leafLand: LEAF.land,
  bowDown: PRANAM_AT + PRANAM_JOIN,
  rise: RISE_AT,
  shuffle: SHUFFLE,
  dollDown: DOLL_DOWN_REL,
  lift: LIFT_GRIP,
  aside: ASIDE_REL,
  tap: TAP,
  charuUp: STARTLE_AT,
  shivaUp: SHIVA_UP_GRIP,
  rollStart: ROLL_AT,
};

/* ------------------------------------------------------------------ */
/* Lip sync (01b envelope, 24 fps RMS of public/audio/ep04/01b_Toddler_Thakur_Clay.wav)                          */
/* ------------------------------------------------------------------ */

const ENV_01B = [
  0.01, 0.01, 0.24, 0.59, 0.49, 0.63, 0.78, 0.98, 0.82, 0.88, 0.82, 0.59, 0.46, 0.38, 0.11, 0.01, 0.04, 0.03, 0.02, 0.01, 0.01, 0.01, 0, 0,
  0, 0, 0, 0, 0.01, 0, 0, 0, 0, 0.5, 0.51, 0.34, 0.39, 0.32, 0.14, 0, 0.99, 1, 1, 0.65, 0.34, 0.01, 0, 0, 0.16, 0.36, 0.26, 0.31, 0.23, 0.49,
  0.53, 0.47, 0.53, 0.54, 0.62, 0.76, 1, 0.89, 0.11, 0.12, 0.16, 0.01, 0.04, 0.12, 0.3, 0.62, 0.43, 0.04, 0.03, 0.76, 0.78, 0.62, 0.38, 0.65,
  0.57, 0.55, 0.55, 0.15, 0.01, 0.39, 0.44, 0.33, 0.05, 0.61, 0.82, 1, 0.55, 0.19, 0.2, 0.18, 0.17, 0.82, 0.68, 0.4, 0.18, 0.07, 0.04, 0.57,
  0.79, 0.56, 0.79, 0.74, 0.33, 0.02, 0.01, 0.02, 0.02, 0.01, 0, 0, 0, 0, 0.1, 1, 1, 0.14, 0.76, 0.9, 0.29, 0.05, 0.7, 0.55, 0.75, 0.42, 0.01,
  0.67, 0.61, 0.1, 0.16, 0.41, 0.29, 0.39, 0.34, 0.15, 0.66, 0.7, 0.48, 0.77, 0.42, 0.45, 0.85, 0.53, 0.22, 0.01, 0.01, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.44, 1, 0.84, 0.55, 0.57, 0.5, 0.34, 0.02, 0.63, 1, 0.54, 0.3, 0.59, 0.53, 0.4, 0.01, 0.06, 0.4, 0.27, 0.01,
  0.33, 0.59, 0.51, 0.37, 0.37, 0.9, 0.37, 0.01, 0.06, 0.51, 0.56, 0.34, 0.49, 0.64, 0.41, 0.35, 0.42, 0.2, 0.53, 0.68, 0.57, 0.23, 0.1, 0.61,
  0.8, 0.41, 0.59, 0.56, 0.37, 0.2, 0.08, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.85, 1, 0.74, 0.02, 0.68, 0.85, 0.79, 0.79, 0.34, 0.03, 0.1, 0.77,
  1, 0.72, 0.32, 0.01, 0.5, 0.74, 0.41, 0.73, 0.66, 0.19, 0.54, 0.38, 0.4, 0.28, 0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
const TEXT_01B = "মা, তুমি তো রোজ ক্ষেতের মাটি দিয়ে শিব গড়ে পুজো করে পেছনে ফেলে দাও! আমি তো আমার পুতুলটা তোমায় দিয়ে গেলাম, ওটা আর ফেলতে হবে না!";
/** The clip's first frame, real local (from the timing data; uncut clip). */
const CLIP_REAL = (clipSpan4("01b_Toddler_Thakur_Clay.wav")?.startFrame ?? SCENE.startFrame + 464) - SCENE.startFrame;
const balakMouth = (lf: number): number => {
  const rel = lf - CLIP_REAL;
  if (rel < 0 || rel >= ENV_01B.length) return 0;
  return clamp(visemeFromEnvelope(ENV_01B, rel, 17, TEXT_01B).open * 0.9, 0, 0.9);
};
/** Phrase-level speech envelope (shallow breathing while he talks; syllable dips do not count as pauses). */
const balakTalk = (lf: number): number => {
  for (let k = -6; k <= 6; k++) {
    const rel = lf + k - CLIP_REAL;
    if (rel >= 0 && rel < ENV_01B.length && speechLevel(ENV_01B, rel) > 0.06) return 1;
  }
  return 0;
};

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

interface Frame {
  cx: number;
  cy: number;
  z: number;
}
const WIDE: Frame = { cx: 1040, cy: 760, z: 1.25 };
const MEDIUM: Frame = { cx: 1040, cy: 880, z: 1.75 };
const CLOSE: Frame = { cx: 1040, cy: 880, z: 2.4 };
const TWO_P2: Frame = { cx: 1070, cy: 860, z: 1.7 };
const MCU: Frame = { cx: 860, cy: 828, z: 2.5 };
const TWO_END: Frame = { cx: 1070, cy: 860, z: 1.7 };

/** Hard cuts (real local frames), each on its narration cue. */
const SHOTS: Array<{ from: number; fr: Frame; name: string }> = [
  { from: -Infinity, fr: WIDE, name: "wide" },
  { from: R(V.onedin) - 2, fr: MEDIUM, name: "medium" },
  { from: R(V.pujor) - 2, fr: CLOSE, name: "close" },
  { from: P2[0], fr: TWO_P2, name: "two-p2" },
  { from: R(VB.ma) - 7, fr: MCU, name: "mcu" },
  { from: R(VB.ami) - 2, fr: TWO_END, name: "two-end" },
];
const shotAt = (lf: number) => {
  let k = 0;
  for (let i = 0; i < SHOTS.length; i++) if (lf >= SHOTS[i].from) k = i;
  return SHOTS[k];
};
const cameraAt = (lf: number): Cam => {
  const fr = shotAt(lf).fr;
  return vedicCourtyardKeepInSet({ x: fr.cx - 960, y: fr.cy - 540, zoom: fr.z, focus: 1, dof: 0.6, shake: 0 }, true);
};

/* ------------------------------------------------------------------ */
/* Balak (SeatedChild on the real clock)                                */
/* ------------------------------------------------------------------ */

type ChildProps = React.ComponentProps<typeof SeatedChild>;
type ChildPose = NonNullable<ChildProps["pose"]>;
type ChildExpr = NonNullable<ChildProps["expression"]>;

interface Beat {
  /** Story frame (converted with R). */
  at: number;
  pose: ChildPose;
  holding?: HeldObject;
  reachFor?: HeldObject;
  reachAt?: { x: number; y: number };
  pointAt?: { x: number; y: number };
  expr?: ChildExpr;
  /** Real-frame override for beats inside a pause. */
  real?: number;
}

const BEATS: Beat[] = [
  { at: -999, pose: "holdInLap", holding: "doll" },
  { at: RISE_AT, pose: "holdToChest", holding: "doll" },
  { at: DOLL_DOWN_AT, pose: "offerUp", holding: "doll", reachAt: AT_SPOT_DOLL },
  { at: LIFT_AT, pose: "kneelReach", reachFor: "clayShiva", reachAt: AT_PLATE_SHIVA },
  { at: LIFT_GRIP, pose: "offerUp", holding: "clayShiva", reachAt: AT_SPOT_SHIVA },
  { at: DOLL_UP_AT, pose: "kneelReach", reachFor: "doll", reachAt: AT_SPOT_DOLL },
  { at: DOLL_UP_GRIP, pose: "offerUp", holding: "doll", reachAt: AT_PLATE_DOLL },
  { at: DOLL_PLACE_REL, pose: "idle", expr: "playful" },
  { at: SHIVA_UP_AT, pose: "kneelReach", reachFor: "clayShiva", reachAt: AT_SPOT_SHIVA },
  { at: SHIVA_UP_GRIP, pose: "rollClay", holding: "clayShiva" },
  // P2: he goes on rolling it in his palms while she stares; then looks up at her, the ball in his hands
  { at: 0, real: P2[1] - 10, pose: "holdInLap", holding: "clayLump" },
  // 01b: "পেছনে ফেলে দাও": the near hand flicks back over his shoulder, 7 f before the words
  { at: VB.fele - 7, pose: "toss", holding: "clayLump", expr: "playful" },
  { at: VB.fele + 24, pose: "holdInLap", holding: "clayLump" },
  // "আমি তো আমার পুতুলটা": an open palm toward the doll on the plate
  { at: VB.ami + 6, pose: "pointIn", holding: "clayLump", pointAt: { x: PLATE.x, y: AT_PLATE_DOLL.y }, expr: "playful" },
  // "ওটা আর ফেলতে হবে না!": hands back to the ball in his lap, beaming up at her
  { at: VB.ota - 4, pose: "holdInLap", holding: "clayLump", expr: "joyful" },
];
const beatReal = (b: Beat) => (b.real !== undefined ? b.real : R(b.at));

/** Where Balak is (ground point, scale) at real frame lf: at the start spot, then knee-shuffling to the pidi. */
const balakPos = (lf: number) => {
  const a = R(SHUFFLE.a);
  const b = R(SHUFFLE.b);
  const u = clamp((lf - a) / (b - a));
  const e = EASE.inOut(u);
  // three small knee steps: the hips dip a touch at each
  const step = u > 0 && u < 1 ? Math.abs(Math.sin(u * Math.PI * 3)) : 0;
  return { x: lerp(B_START.x, BX, e), y: lerp(B_START.y, BY, e) - 2.5 * step, s: lerp(B_START.s, BS, e) };
};

/** Seat: cross-legged, then up on his knees from "ছোট্ট বীরু", back on his heels as he rolls the clay. */
const balakKneel = (lf: number) =>
  track(lf, [
    [R(RISE_AT), 0],
    [R(RISE_AT) + 14, 2, "inOut"],
    [R(ROLL_AT) + 4, 2],
    [R(ROLL_AT) + 22, 1, "inOut"],
  ]);

interface BalakState {
  pose: ChildPose;
  prevPose?: ChildPose;
  poseStart: number;
  prevPoseStart?: number;
  holding?: HeldObject;
  reachFor?: HeldObject;
  reachAt?: { x: number; y: number };
  pointAt?: { x: number; y: number };
  expression: ChildExpr;
  prevExpression?: ChildExpr;
  expressionStart: number;
}

const balakState = (lf: number): BalakState => {
  let i = 0;
  for (let k = 0; k < BEATS.length; k++) if (lf >= beatReal(BEATS[k])) i = k;
  const b = BEATS[i];
  const prev = i > 0 ? BEATS[i - 1] : undefined;
  const start = beatReal(b);
  let holding = b.holding;
  // kneelReach picking up: the object is in his hands from the grip on (the scene hides its copy then)
  if (b.pose === "kneelReach" && b.reachFor && lf >= start + 26) holding = b.reachFor;
  // the roll squeezes the clay Shiva into a ball over 36 frames; then it is the clay lump
  if (b.pose === "rollClay" && lf >= start + 36) holding = "clayLump";
  const exprOf = (x?: Beat) => x?.expr ?? "serene";
  // expressions: the last beat that changed it
  let ei = i;
  while (ei > 0 && exprOf(BEATS[ei - 1]) === exprOf(BEATS[ei])) ei--;
  return {
    pose: b.pose,
    prevPose: prev && prev.pose !== b.pose ? prev.pose : undefined,
    poseStart: start,
    prevPoseStart: prev ? beatReal(prev) : undefined,
    holding,
    reachFor: b.pose === "kneelReach" ? b.reachFor : undefined,
    reachAt: b.reachAt,
    pointAt: b.pointAt,
    expression: exprOf(b),
    prevExpression: ei > 0 ? exprOf(BEATS[ei - 1]) : undefined,
    expressionStart: ei > 0 ? beatReal(BEATS[ei]) : 0,
  };
};

/**
 * Where his eyes go when his hands are not steering them (watchHeld 0): at his mother at her puja (wonder), at her
 * bowed back before he rises, at the plate during the steal (watchHeld 1 there), up at her for his line.
 */
const balakWatch = (lf: number) =>
  track(lf, [
    [R(40), 0],
    [R(52), 0.7, "inOut"], // a look down at his doll in his lap
    [R(76), 0.7],
    [R(88), 0, "inOut"], // and back up at his mother
    [R(RISE_AT) - 12, 0],
    [R(RISE_AT) + 4, 1, "inOut"],
    [P2[0] + 18, 1],
    [P2[1] - 6, 0, "inOut"], // in P2 he looks up at her, the ball still turning
  ]);
const balakFace = (lf: number): NonNullable<ChildProps["face"]> => {
  const look = track(lf, [
    [0, 0.45],
    [R(RISE_AT) - 14, 0.45],
    [R(RISE_AT) - 6, 0.7, "inOut"], // a glance at her bowed back
    [R(RISE_AT) + 6, 0.2, "inOut"],
  ]);
  return { lookX: look, smile: 0.5, eyesDown: 0 };
};

/* ------------------------------------------------------------------ */
/* Charu (Puppet on the real clock)                                     */
/* ------------------------------------------------------------------ */

const CHARU_CAST = CAST.charu;
const SUN: Lighting = { keySide: -1, rim: "#ffd98a", rimStrength: 0.32 };

/** Charu's pose at real frame lf (the Puppet blends every channel over about 9 frames). */
const charuActing = (lf: number): Partial<Pose> => {
  const pStart = R(PRANAM_AT);
  const up = R(STARTLE_AT);
  // the near arm in this facing is the LEFT one (bodyTurn > 0); the far right hand holds the bell until the cut
  const shot2 = R(V.onedin) - 2;
  const base: Partial<Pose> = {
    kneel: 1,
    bodyTurn: 0.85,
    lean: 4,
    headTilt: 4,
    smile: 0.3,
    lid: 0.2,
    eyeY: 0.25,
  };
  if (lf < pStart) {
    // shot 1 (pushpanjali): the bel leaf held at her chest, raised to her forehead with closed eyes, then tossed
    // gently from the outstretched hand onto the plate; her far hand holds the little bell, rung once in P1
    const toHead = track(lf, [
      [LEAF.head - 16, 0],
      [LEAF.head, 1, "inOut"],
      [LEAF.head + 8, 1],
      [LEAF.out - 14, 0, "inOut"],
    ]);
    const out = track(lf, [
      [LEAF.out - 16, 0],
      [LEAF.out, 1, "inOut"],
      [LEAF.toss + 6, 1],
      [LEAF.toss + 30, 0, "inOut"],
    ]);
    // the toss: a small lift and forward flick of the hand as the leaf leaves it
    const flick = track(lf, [
      [LEAF.toss - 6, 0],
      [LEAF.toss - 2, -1, "inOut"],
      [LEAF.toss + 3, 1, "out"],
      [LEAF.toss + 12, 0, "inOut"],
    ]);
    const rest = 1 - Math.max(toHead, out);
    const ring = ringBell(lf, P1[0] + 3, 13, 9);
    const ringLift = track(lf, [
      [P1[0] - 8, 0],
      [P1[0] + 2, 1, "inOut"],
      [P1[1] - 6, 1],
      [P1[1] + 4, 0, "inOut"],
    ]);
    const leafIn = lf < LEAF.toss;
    return {
      ...base,
      lean: 4 + 22 * out + 3 * toHead,
      lS: -38 * rest - 88 * toHead - 76 * out + 6 * flick,
      lE: -105 * rest - 132 * toHead - 10 * out - 14 * flick,
      lHand: leafIn ? "hold" : out > 0.5 ? "open" : "relaxed",
      lProp: leafIn ? "bel" : "",
      rS: lerp(14, BELL_ARM.S, ringLift),
      rE: lerp(-50, BELL_ARM.E, ringLift) + ring,
      rHand: lf < shot2 ? "hold" : "relaxed",
      rProp: lf < shot2 ? "bell" : "",
      headTilt: 6 + 6 * toHead + 3 * out,
      lid: 0.2 + 0.6 * toHead,
      eyeY: 0.25 - 0.1 * toHead,
    };
  }
  const pr = kneelingPranam(lf, { start: pStart, join: PRANAM_JOIN, down: PRANAM_DOWN, hold: Math.max(10, up - (pStart + PRANAM_JOIN + PRANAM_DOWN)), up: 20, release: 14 });
  // the startle: a small jolt as the tap sounds, then the quick rise (pr) and a wide-eyed stare at the plate
  const jolt = track(lf, [
    [up - 1, 0],
    [up + 2, 1, "out"],
    [up + 9, 0, "inOut"],
  ]);
  const startled = track(lf, [
    [up, 0],
    [up + 10, 1, "out"],
    [R(VB.ma) - 4, 1],
    [R(VB.ma) + 14, 0, "inOut"],
  ]);
  // P2: her near hand rises to her mouth; it comes down again as he starts to speak
  const toMouth = track(lf, [
    [P2[0] + 6, 0],
    [P2[0] + 22, 1, "inOut"],
    [R(VB.ma) + 2, 1],
    [R(VB.ma) + 18, 0, "inOut"],
  ]);
  // his line: she scolds without words: stern brows, a slow shake of the head, hands on her knees
  const stern = track(lf, [
    [R(VB.ma) + 4, 0],
    [R(VB.ma) + 22, 1, "inOut"],
    [R(VB.ota), 1],
    [R(VB.ota) + 14, 0.35, "inOut"],
  ]);
  const shake = headShake(lf, R(VB.tumi) + 30, 40, 0.16, 2) + headShake(lf, R(VB.ami) + 20, 36, 0.12, 2);
  // the end: speechless, her palm to her forehead (P3), before the fade
  const palm = track(lf, [
    [R(VB.end) - 2, 0],
    [R(VB.end) + 14, 1, "inOut"],
  ]);
  const handsDown = pr.join !== undefined && pr.join < 0.05;
  const mouthArm = toMouth > 0 ? { lS: lerp(pr.lS ?? 4, GESTURES.handToMouth.rS!, toMouth), lE: lerp(pr.lE ?? -38, GESTURES.handToMouth.rE!, toMouth) } : {};
  // the forearm folds up first and the upper arm follows, so the hand rises close to her body (never a swing out
  // toward the boy that could read as a slap)
  const palmE = track(lf, [
    [R(VB.end) - 8, 0],
    [R(VB.end) + 4, 1, "inOut"],
  ]);
  const palmArm = palm > 0 || palmE > 0 ? { lS: lerp(-6, GESTURES.palmToForehead.rS!, palm), lE: lerp(-40, GESTURES.palmToForehead.rE!, palmE) } : {};
  return {
    ...base,
    ...pr,
    bodyTurn: 0.85,
    bow: Math.max(0, (pr.bow ?? 0) - 0.12 * jolt),
    headTurn: shake,
    headTilt: (pr.headTilt ?? 0) + 3 - 2 * startled,
    eyeY: 0.3 * startled + 0.08 * stern,
    lid: handsDown ? lerp(0.12, 0.02, startled) + 0.08 * stern : pr.lid,
    brow: 0.55 * startled - 0.25 * stern + 0.3 * palm,
    browTilt: -0.55 * stern + 0.3 * palm,
    gasp: 0.28 * startled * (1 - stern),
    smile: lerp(0.25, 0.02, Math.max(startled, stern)),
    cheeks: 0.25 * stern,
    ...(handsDown ? { lHand: toMouth > 0.3 || palm > 0.3 ? "open" : "relaxed" } : {}),
    ...mouthArm,
    ...palmArm,
  };
};

/** A bel leaf held at the stalk (Charu's offering). */
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
/** The small brass puja bell in her hand (handle up). */
const BellProp: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale * 0.6}) translate(0, 44)`}>
    <BrassBell x={0} y={0} />
  </g>
);
const CHARU_PROPS: Record<string, PropRenderer> = { bel: BelLeafProp, bell: BellProp };

/* ------------------------------------------------------------------ */
/* Set pieces: the pidi, the taat and the things on it                  */
/* ------------------------------------------------------------------ */

const Pidi: React.FC = () => {
  const a = W(PIDI.x0, PIDI.top);
  const b = W(PIDI.x1, 0);
  const w = b.x - a.x;
  const h = b.y - a.y;
  return (
    <g>
      <ellipse cx={(a.x + b.x) / 2} cy={b.y + 2} rx={w * 0.56} ry={7} fill="#1a0806" opacity={0.35} />
      {/* legs */}
      {[0.06, 0.88].map((k) => (
        <rect key={k} x={a.x + w * k} y={a.y + 9} width={w * 0.06} height={h - 9} fill="#5a3216" />
      ))}
      {/* the plank: top face and front edge, teak with the grain */}
      <path d={`M ${a.x - 4} ${a.y + 2} L ${b.x + 4} ${a.y + 2} L ${b.x + 1} ${a.y - 5} L ${a.x - 1} ${a.y - 5} Z`} fill="#a8703c" />
      <rect x={a.x - 4} y={a.y + 2} width={w + 8} height={10} fill="#7a4a22" />
      <path d={`M ${a.x} ${a.y + 6} Q ${a.x + w * 0.5} ${a.y + 4} ${b.x} ${a.y + 7}`} stroke="#5a3216" strokeWidth={1} fill="none" opacity={0.6} />
      <rect x={a.x - 4} y={a.y + 2} width={w + 8} height={1.5} fill="#d8a066" opacity={0.7} />
    </g>
  );
};

/** The brass taat with its diya, bel leaves and flowers (the clay Shiva and the doll are drawn separately). */
const Taat: React.FC<{ lf: number; leafOffered: boolean }> = ({ lf, leafOffered }) => {
  const c = W(PLATE.x, PLATE.surf);
  const r = PLATE.r * BS;
  return (
    <g>
      <ellipse cx={c.x} cy={c.y + 2} rx={r + 2} ry={r * 0.22 + 2} fill="#3a1e08" opacity={0.4} />
      <ellipse cx={c.x} cy={c.y} rx={r} ry={r * 0.22} fill="url(#vhd-brass)" />
      <ellipse cx={c.x} cy={c.y - 1} rx={r * 0.86} ry={r * 0.17} fill="#c8902e" />
      <ellipse cx={c.x - r * 0.2} cy={c.y - 2} rx={r * 0.45} ry={r * 0.06} fill="#ffe6a0" opacity={0.55} />
      {/* bel leaves and white flowers round the rim */}
      {[
        { dx: -0.72, rot: -70 },
        { dx: 0.7, rot: 64 },
      ].map((l, i) => (
        <g key={i} transform={`translate(${c.x + l.dx * r} ${c.y - 1}) rotate(${l.rot}) scale(${BS * 0.5})`}>
          {[-48, 0, 48].map((a) => (
            <ellipse key={a} cx={0} cy={-9} rx={4} ry={9} fill="#4f7d2c" transform={`rotate(${a})`} />
          ))}
        </g>
      ))}
      {leafOffered && (
        <g transform={`translate(${c.x - r * 0.42} ${c.y - 1.5}) rotate(-20) scale(${BS * 0.42})`}>
          {[-48, 0, 48].map((a) => (
            <ellipse key={a} cx={0} cy={-9} rx={4} ry={9} fill="#5a8a30" transform={`rotate(${a})`} />
          ))}
        </g>
      )}
      {[-0.5, 0.48, 0.15].map((dx, i) => (
        <g key={i} transform={`translate(${c.x + dx * r} ${c.y - 2 + (i === 2 ? 2 : 0)})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={0} cy={-2.6} rx={1.6} ry={2.8} fill="#fffaf0" transform={`rotate(${a})`} />
          ))}
          <circle r={1.1} fill="#f2c040" />
        </g>
      ))}
      {/* the diya at the back right of the plate (no glow on the clay Shiva or the doll: only the flame) */}
      <g transform={`translate(${c.x + r * 0.55} ${c.y - 3})`}>
        <path d="M -7 0 Q 0 5 7 0 Q 5 -4 0 -4 Q -5 -4 -7 0 Z" fill="#b8642c" />
        <ellipse cx={0} cy={-3} rx={5} ry={1.4} fill="#7a3a18" />
        <Flame x={2} y={-3} s={0.42} f={lf} seed={41} />
      </g>
    </g>
  );
};

/** Where her near hand lets the bel leaf go (world, measured from the stills) and where it lands on the plate. */
const LEAF_FROM = { x: 1120, y: 936 };
const leafTo = () => {
  const c = W(PLATE.x, PLATE.surf);
  return { x: c.x - PLATE.r * BS * 0.42, y: c.y - 1.5 };
};
/** The tossed bel leaf in flight: a soft arc, turning as it goes (drawn only between the toss and the landing). */
const FlyingLeaf: React.FC<{ lf: number }> = ({ lf }) => {
  if (lf < LEAF.toss || lf >= LEAF.land) return null;
  const u = (lf - LEAF.toss) / (LEAF.land - LEAF.toss);
  const to = leafTo();
  const x = lerp(LEAF_FROM.x, to.x, u);
  const y = lerp(LEAF_FROM.y, to.y, u) - 46 * Math.sin(Math.PI * u);
  return (
    <g transform={`translate(${x} ${y}) rotate(${-20 - 160 * u}) scale(${BS * 0.42})`}>
      {[-48, 0, 48].map((a) => (
        <ellipse key={a} cx={0} cy={-9} rx={4} ry={9} fill="#5a8a30" transform={`rotate(${a})`} />
      ))}
    </g>
  );
};

/** A faint warm glow on the floor round Balak (BAL-05: restrained, steady in this scene). */
const GroundGlow: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g>
    <defs>
      <radialGradient id="s401-ground-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x + 10 * s} cy={y + 2} rx={120 * s} ry={22 * s} fill="url(#s401-ground-glow)" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

const GLOW = 0.6; // steady, no key beat in this scene (STO-19 answer 6)

export const Scene01ClayShivaAndDoll: React.FC = () => {
  const { lifeF } = useStory4(SCENE_ID);
  const lf = lifeF;
  const cam = cameraAt(lf);

  const st = balakState(lf);
  const pos = balakPos(lf);
  const kneel = balakKneel(lf);
  const mouth = balakMouth(lf);
  const talk = balakTalk(lf);

  // The objects the scene draws (the rig draws them only while they are in his hands).
  const shivaOnPlate = lf < R(LIFT_GRIP);
  const shivaAside = lf >= R(ASIDE_REL) && lf < R(SHIVA_UP_GRIP);
  const dollOnSpot = lf >= R(DOLL_DOWN_REL) && lf < R(DOLL_UP_GRIP);
  const dollOnPlate = lf >= R(DOLL_PLACE_REL);
  // the doll settles upright on the plate (offerUp holds it tipped -4 degrees)
  const dollRot = -4 * (1 - EASE.out(clamp((lf - R(DOLL_PLACE_REL)) / 5)));
  const leafOffered = lf >= LEAF.land;

  const lights: SceneLight[] = [
    { x: 200, y: -200, color: "#ffe6b0", intensity: 0.35, radius: 1600 },
    { x: W(PLATE.x + PLATE.r * 0.55, PLATE.surf).x, y: W(0, PLATE.surf).y - 10, color: "#ffb04a", intensity: 0.3, radius: 220, flicker: 41 },
  ];

  const objS = pos.s; // the objects use Balak's scale at the pidi (he is there whenever he touches them)
  // BAL-26b (2026-11-22): Balak in the reference-plate design at five (shared ThakurHeadPlate). Poses, timing, lip
  // sync, blinks and expressions are the delivered ones; only the design changes.
  const balakProps: ChildProps = {
    x: pos.x,
    y: pos.y,
    s: objS,
    f: lf,
    lifeF: lf,
    pose: st.pose,
    prevPose: st.prevPose,
    poseStart: st.poseStart,
    prevPoseStart: st.prevPoseStart,
    holding: st.holding,
    reachFor: st.reachFor,
    reachAt: st.reachAt,
    pointAt: st.pointAt,
    kneel,
    watchHeld: balakWatch(lf),
    face: balakFace(lf),
    expression: st.expression,
    prevExpression: st.prevExpression,
    expressionStart: st.expressionStart,
    mouth,
    talk,
    glow: GLOW,
    design: "plate",
    age: 5,
  };
  // The halo is centred behind the plate head, from the rig's own solve this frame (glow anchor).
  const glowAt = seatedChildHands(balakProps).glowAnchor;
  const plate = (o: { x: number; y: number }) => ({ x: BX + o.x * BS, y: BY + o.y * BS });
  const pS = plate(AT_PLATE_SHIVA);
  const pD = plate(AT_PLATE_DOLL);
  const sD = plate(AT_SPOT_DOLL);
  const sS = plate(AT_SPOT_SHIVA);

  // Charu's bell stands on the floor beside her from the cut to shot 2 on.
  const bellDown = lf >= R(V.onedin) - 2;

  const floor = (
    <g>
      <GroundGlow x={pos.x} y={pos.y} s={pos.s} />
      <Pidi />
      <Taat lf={lf} leafOffered={leafOffered} />
      <FlyingLeaf lf={lf} />
      {shivaOnPlate && <HeldObjectArt kind="clayShiva" x={pS.x} y={pS.y} s={BS} />}
      {shivaAside && <HeldObjectArt kind="clayShiva" x={sS.x} y={sS.y} s={BS} />}
      {dollOnSpot && <HeldObjectArt kind="doll" x={sD.x} y={sD.y} s={BS} />}
      {dollOnPlate && <HeldObjectArt kind="doll" x={pD.x} y={pD.y + 0} s={BS} rot={dollRot} />}
      <BirulGlow cx={glowAt.cx} cy={glowAt.cy} r={glowAt.r} glow={GLOW} f={lf} />
      <SeatedChild {...balakProps} />
      {bellDown && <BrassBell x={CHARU.x + 95} y={CHARU.y - 14} s={0.62} />}
      <Puppet
        cast={CHARU_CAST}
        f={lf}
        lifeF={lf}
        x={CHARU.x}
        y={CHARU.y}
        scale={CHARU.s}
        flip
        acting={(fr) => ({ ...BASE_POSE, ...charuActing(fr) })}
        props={CHARU_PROPS}
        light={SUN}
        breathRate={lf >= R(STARTLE_AT) && lf < R(VB.ma) ? 1.5 : 1}
      />
    </g>
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: VEDIC_COURTYARD_BG.morning, overflow: "hidden" }}>
      <Stage cam={cam} background={VEDIC_COURTYARD_BG.morning}>
        <SceneLights.Provider value={lights}>
          <VedicCourtyardDay f={lf} time="morning" cam={cam} nearVeranda tulsi floor={floor} />
        </SceneLights.Provider>
      </Stage>
    </div>
  );
};

