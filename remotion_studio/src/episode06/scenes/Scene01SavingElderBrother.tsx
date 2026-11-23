import React, { useId } from "react";
import { clamp, EASE, lerp, makeActing, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { CAST, EP06_CHILD_SCALE } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeChatter, visemeFromEnvelope } from "../../cinematic/rig/lipsync";
import {
  BASE_POSE,
  GESTURES6,
  headShake,
  khadamLengthPx,
  Lighting,
  lookAround,
  pleadBob,
  Pose,
  Puppet,
  scoldPulse,
  shoutMouth,
  STAMP,
  stampPulse,
  SWAT,
  swatPulse,
  throwUpPulse,
  walkPlantFrames,
  walkPose,
  walkTravel,
  WalkOpts,
} from "../../cinematic/rig/Puppet";
import { UJANCHAR, UJANCHAR_BG, UjancharBackdrop, UjancharLightLayer, ujancharGrade, ujancharKeepInSet } from "../../cinematic/sets/UjancharHouse";
import { clipSpan6, cueLocalStory6, gapsFor6, pausesFor6, storyToReal, useStory6 } from "../../episode/storyClock";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import {
  glanceHideThenFather,
  StandingChild,
  standingChildJoints,
  standingLocal,
  type GazeKey,
  type StandingChildProps,
  type StandingExpression,
  type StandingPose,
} from "../../episode05/rig/StandingChild";
import { BrassThali, KhadamPair, PROP_REF, Slate } from "../props/Ep06Props";
import { EP06_SCENES } from "../timing";
import { Crow, HenFamily, Sparrow } from "../../cinematic/life/VillageLife";
import { UjancharVillageField, VILLAGE, VILLAGE_BG, VILLAGE_CAMS, villageGrade, villageKeepInSet, villageScaleAt } from "../../cinematic/sets/UjancharVillageField";
import { SeatedChild, seatedChildHands, type SeatedChildProps } from "../../episode03/rig/SeatedChild";
import type { PropRenderer } from "../../cinematic/rig/Puppet";

/**
 * Episode 6, scene 01 (01_saving_elder_brother): the elder brother saved. Book chapter দশ "পিতার নিগ্রহ থেকে জ্যেষ্ঠ
 * ভ্রাতাকে উদ্ধার" (book.xlsx row 16). Approved plan STO-21,
 * 03_Episodes/Episode_06_Rescuing_Brother_and_Playmates/01_Script_and_Storyboard/Ep06_Shots_and_Pauses_DRAFT.md,
 * "Scene 01" (shot list, pauses, action gaps), "Balak in Episode 6", "Characters", "Props", "Sets", "Light".
 *
 * PLACE: the family's Ujanchar house (src/cinematic/sets/UjancharHouse.tsx, never redrawn), time "dawn" read as warm
 * afternoon gold (the light of Episode 5's outro glimpse of this veranda), plus a low gold wash from the right. The set's
 * backdrop is drawn as is (sky, jungle, trees, the hut, fence and lemon tree on the 0.65 plane, CAM-11 calm grade); ALL
 * the people and the khadam stand on the 0.65 plane in their own unfiltered Layer (as the Episode 5 glimpse), on the
 * yard's beaten earth in front of the hut, with a ground perspective scale K(y) (the adult Puppet scale at ground y:
 * 0.46 at the plinth's foot, as Episode 2's Charu at the door). The courtyard floor plane (depth 1) is not drawn: with
 * it the plinth's foot sits exactly on its back edge and the father could not step down from the veranda into his
 * khadam in view. The cameras keep the yard's earth (to y 1100) under the frame (keep()).
 *  - The two empty brass thalis and two slates lie on the veranda edge (the set's `veranda` slot, Ep06Props).
 *  - The khadam pair (Ep06Props KhadamPair) rests at the plinth's foot below the door until the father steps into it;
 *    from the first step he wears them (Puppet footwear "khadam", the same size: khadamLengthPx).
 *  - The hiding place: round the hut's FAR (right) corner. The elder, once behind it, is drawn clipped to everything
 *    right of the wall's end (x 1166) and of the plinth's end (x 1190), so the hut hides him and he can peek out.
 *  - There is no gap in the set's fence: the two classmates loiter in front of the fence by the bushes and scatter off to
 *    the right along it; the father leaves to the LEFT, along the front of the hut, toward the kachari (so the elder can
 *    edge out at the right while his back is turned).
 *
 * PEOPLE: Balak is StandingChild (BAL-26 plate, age 6) at CHR-08's scale (EP06_CHILD_SCALE.standingBalak: s = 0.52 K,
 * headScale 1.42), facing +x (yaw 1); the elder brother CAST.elderBrother, the father CAST.surendra (footwear khadam),
 * classmates CAST.villageBoyA / villageBoyB (headScale 0.8, cast.ts). Directions are given by bodyTurn's sign (no flip):
 * near arm -1 when facing +x, +1 when facing -x. Only Balak's mouth is synced (his 01b voice envelope); the elder's
 * scolding, the father's asking and the elder's laugh are mouth shapes without sync.
 *
 * CLOCKS (as Episode 5's scenes): every key is a narration cue (cueLocalStory6), a pause (pausesFor6) or a gap beat
 * (gapsFor6: a_father_leaves, b_brother_comes_out) in STORY frames, converted to REAL local frames with R()
 * (storyToReal); choreography and camera then run on the real frame, so a key never lands inside a pause by accident and
 * the actions the plan puts inside the pauses go on there (P1: a sniff, the hand to the eye, the clacks coming nearer;
 * P2: the elder's plea; P3: the smile and the glow). Every rig gets lifeF for breathing, blinks and idle life (PIT-03).
 *
 * SHOTS (CAM-13: hard cuts on the named lines, one push only, in shot 4):
 *   1  WIDE     from the fade-in: the courtyard, the elder scolding with a jabbing finger, Balak silent, eyes down
 *               (standScolded); the father dim in the open door; the classmates at the fence. One swat on "মেরে": the
 *               palm lands on Balak's back (swatPulse, S01_TIMES.swat), Balak flinches into hurtBack. The father steps
 *               out and, 10 f before "লুকিয়ে", down into his first khadam (khadam_step_1): the elder freezes.
 *   2  MEDIUM   cut 2 f before "লুকিয়ে": the father's second foot steps into its khadam (clack); the elder darts round the
 *               far corner; the classmates scatter. Held into P1.
 *   P1 BALAK    cut 8 f into P1: Balak alone, bent, a hand at his back; a sniff and the back of his other hand to his eye;
 *               the father's clacks start off screen.
 *   3  WIDE 2   cut 2 f before "বাবা এসে": the father strides in (clack, clack), stops (S01_TIMES.fatherStops), looks
 *               left and right, turns and bends toward Balak with a hand held out, asking (mouth only).
 *   P2 INSERT   cut at P2: the elder peeking round the corner, finger to his lips, then palms joined, pleading.
 *   4  MEDIUM   cut 2 f before "কিন্তু": Balak bent, teary; his eyes go once to the corner, then up to his father
 *               (glanceHideThenFather); the father's legs at the frame's right. One slow push from "ছোট্ট ঠাকুর" to a
 *               medium close-up, settled ~38 f before his line.
 *   5  MCU      (held) Balak: "যাও বাবা, আমি বলব না—বললে তো তুমি দাদাকে মারবে!" (lip sync, a small head shake on
 *               "আমি বলব না", eyes steady on his father).
 *   AG TWO-SHOT cut 6 f before AG1: the father throws up a hand, shakes his head and walks off left (clacks, no drum);
 *               AG2: the elder edges out from the corner, stands before Balak sheepish and softened, grins and runs
 *               off laughing; Balak wipes his eye.
 *   P3 MCU      cut at P3: Balak watches his brother go, the small forgiving smile; the glow brightens gently (key beat
 *               1, the only beat in this scene). The chapter break fade is drawn by Episode06.tsx.
 *
 * Sound: Episode06.tsx places the SFX from S01_EVENTS (REAL scene-local frames: add the scene's startFrame, 629).
 */

const SCENE_ID = "01_saving_elder_brother";
const SCENE = EP06_SCENES.find((s) => s.sceneId === SCENE_ID) ?? { sceneId: SCENE_ID, component: "", startFrame: 629, durationFrames: 762 };
const START = SCENE.startFrame;
const DUR = SCENE.durationFrames;
const PAUSES = pausesFor6(SCENE_ID);

/* ------------------------------------------------------------------ */
/* Narration anchors (story frames) -> real local frames                */
/* ------------------------------------------------------------------ */

const R = (story: number): number => storyToReal(story, PAUSES);
const cueFrom = (snippet: string, fallback: number): number => cueLocalStory6(snippet, SCENE_ID)?.from ?? fallback;
const pauseReal = (i: number, fbStory: number, fbFrames: number): [number, number] => {
  const p = PAUSES[i];
  const s = R(p ? p.atStory : fbStory);
  return [s, s + (p ? p.frames : fbFrames)];
};
const P1 = pauseReal(0, 252, 36); // after "…শব্দ শুনে।"
const P2 = pauseReal(1, 359, 48); // after "…বড় ছেলে কোথায়—" (C1 inside it)
const P3 = pauseReal(2, 737, 72); // end (after AG1 + AG2): G1, the afterglow

const GAPS = gapsFor6(SCENE_ID);
const beatReal = (id: string, fbStory: number) => {
  for (const g of GAPS) {
    const b = g.beats.find((q) => q.id === id);
    if (b) return R(b.fromStory);
  }
  return R(fbStory);
};
/** W1 (open action gap before the first line): (a) the lane walk, (b) the courtyard and the empty plates. */
const W1A = beatReal("a_lane_walk", 0);
const W1B = beatReal("b_courtyard_plates", 42);
/** AG1 (the father leaves) and AG2 (the brother comes out): real local frames. */
const GA = beatReal("a_father_leaves", 569);
const GB = beatReal("b_brother_comes_out", 617);

/** Voice onsets (real local frames) from the cue snippets. */
const V = {
  ekdin: R(cueFrom("একদিন বড় ভাই", 8)),
  lukiye: R(cueFrom("লুকিয়ে পড়ল", 107)),
  baba: R(cueFrom("বাবা এসে", 192)),
  kintu: R(cueFrom("কিন্তু পিঠের", 298)),
  chotto: R(cueFrom("ছোট্ট ঠাকুর", 348)),
  jao: R(cueFrom("যাও বাবা", 433)),
  ami: R(cueFrom("আমি বলব না", 462)),
  bolle: R(cueFrom("বললে তো", 498)),
};

/* ------------------------------------------------------------------ */
/* Balak's voice (01b): per-frame RMS envelope (24 fps) for the lip sync */
/* ------------------------------------------------------------------ */

const BALAK_FILE = "01b_Young_Thakur_Forgive.wav";
/** Per-frame RMS envelope of public/audio/ep06/01b_Young_Thakur_Forgive.wav (24 fps, 0..1; measured 2026-11-23). */
const BALAK_ENV: number[] = [
  0, 0, 0, 0, 0, 0.05, 0.46, 0.58, 0.54, 0.49, 0.21, 0.59, 0.51, 0.51, 0.57, 0.92, 0.71, 0.84, 1, 0.76, 0.36, 0.46, 0.62, 0.39, 0.06, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0.35, 0.39, 0.42, 0.8, 0.68, 0.48, 0.5, 0.44, 0.46, 1, 1, 1, 0.95, 0.75, 0.42, 0.51, 1, 1, 0.79, 0.67, 0.6, 0.46, 0.38, 0.13, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0.59, 0.25, 0.41, 0.65, 0.59, 0.41, 0.43, 0.3, 0.32, 0.33, 0, 0.14, 0.8, 0, 0.37, 0.76, 0.6, 0.83, 0.68, 0.28, 0.48, 0.46, 0.62, 0.37, 0.49,
  0.45, 0.06, 0.13, 0.62, 0.53, 0.56, 0.66, 0.65, 0.47, 0.41, 0.53, 0.63, 0.27, 0.34, 0.13, 1, 1, 0.64, 0.65, 0.48, 0.29, 0.16, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0,
];
const BALAK_TEXT = "যাও বাবা, আমি বলব না—বললে তো তুমি দাদাকে মারবে!";
const BALAK_SPAN = clipSpan6(BALAK_FILE);
const BALAK_VOICE_START = BALAK_SPAN ? BALAK_SPAN.startFrame - START : 487;
/** The last voiced frame of 01b (real local). */
const BALAK_VOICE_END = BALAK_VOICE_START + (() => {
  let k = BALAK_ENV.length - 1;
  while (k > 0 && BALAK_ENV[k] === 0) k--;
  return k + 1;
})();
const balakVoice = (lf: number) => {
  const rel = lf - BALAK_VOICE_START;
  return rel >= 0 && rel < BALAK_ENV.length ? rel : -1;
};
const balakMouth = (lf: number): number => {
  const rel = balakVoice(lf);
  return rel < 0 ? 0 : clamp(visemeFromEnvelope(BALAK_ENV, rel, 17, BALAK_TEXT).open * 0.9, 0, 0.9);
};
/** Phrase-level speech envelope (quieter breathing while he speaks, MOT-20). */
const balakTalk = (lf: number): number => {
  for (let k = -6; k <= 6; k++) {
    const rel = balakVoice(lf + k);
    if (rel >= 0 && speechLevel(BALAK_ENV, rel) > 0.06) return 1;
  }
  return 0;
};

/* ------------------------------------------------------------------ */
/* Timeline (real local frames, all derived from the anchors above)     */
/* ------------------------------------------------------------------ */

/** The swat lands on "মেরে" (the last word of the first sentence; 01a speech run 81 to 93, the word from about 84). */
const MERE = V.lukiye - 23;
const SWAT_HIT = MERE + 1;
const SWAT_START = SWAT_HIT - SWAT.hit;
/**
 * K1 (sound before source): the father's first step into the khadam is HEARD just after the cut to shot 2 (he is out of
 * its frame; the crow lifts off cawing, the hens scatter, the elder freezes); the second clack is SEEN in the
 * ground-level close of the wooden soles (the elder's point of view), then back to the medium as he darts.
 */
const CLACK1 = V.lukiye + 4;
const CLACK2 = CLACK1 + 18;
const K1_CU = { a: CLACK1 + 10, b: CLACK2 + 10 };
const STAMP1 = CLACK1 - STAMP.hit;
const STAMP2 = CLACK2 - STAMP.hit;
/** He comes out of the door's shadow to the veranda edge after the scolding grows loud. */
const STEP_OUT = { a: SWAT_START - 30, b: SWAT_START - 6 };
/** Shot 2 cut, the elder's dart round the corner and his slip behind it. */
const CUT2 = V.lukiye - 2;
const DART = K1_CU.b + 2;
const DART_DUR = 36;
const SLIP = { a: DART + DART_DUR, b: DART + DART_DUR + 12 };
/** W1 b: the elder crouches by the plates, taps one, looks to the kitchen; on the line he gets up and stomps over. */
const PLATE_TAPS = [W1B + 9, W1B + 15];
const KITCHEN_LOOK = W1B + 19;
const ELDER_RISE = V.ekdin - 2;
/** W1 a: the elder's slate knocks his leg at the ends of its swing (a soft wooden tap). */
const SLATE_TAPS = [W1A + 12, W1A + 30];
/** The classmates start at the first clack and scatter. */
const STARTLE = CLACK1 + 2;
const RUN_A = CLACK1 + 9;
const RUN_B = CLACK1 + 14;
/** P1: cut to Balak alone, a sniff, the back of his hand to his eye. */
const P1_CUT = P1[0] + 8;
const SNIFF1 = P1[0] + 4;
const WIPE1 = P1[0] + 12;
const WIPE1_END = WIPE1 + 48;
/** The father strides in (his clacks start at the end of P1, off screen), stops, searches, turns and asks. */
const WALK_IN: WalkOpts = {
  start: P1[1] - 8,
  dur: 64,
  fromX: 760,
  toX: 1086,
  scale: 0.6,
  height: CAST.surendra.height,
  seed: CAST.surendra.seed,
  startIn: 10,
  stopIn: 10,
};
const STOP_AT = WALK_IN.start + WALK_IN.dur;
const LOOK = { a: STOP_AT + 2, dur: 34 };
const TURN = { a: LOOK.a + LOOK.dur - 4, b: LOOK.a + LOOK.dur + 10 };
const ASK = { a: TURN.a + 4, b: TURN.b + 8 };
/** The father's asking mouth ("বড় ছেলে কোথায়", quoted by the narrator: shapes only). */
const ASK_MOUTH = { a: TURN.a - 2, b: P2[0] - 2 };
/**
 * C1 (inside P2): Balak's choice as a point-of-view sequence, three cuts of about 0.6 s: (1) the brother at the corner,
 * finger at his lips, then palms joined; (2) the father's stern face, slightly from below; (3) back on Balak: the slow
 * push in that carries on through "কিন্তু … বাঁচিয়ে দিলেন!" to the close two-shot (the sentence's one move), settled
 * well before his line.
 */
const C1 = { brother: P2[0], father: P2[0] + 18, push: P2[0] + 34 };
const PEEK = P2[0] - 8;
const PLEAD = P2[0] + 13;
const PEEK_END = C1.push + 4;
const SHOT4 = C1.push;
const SNIFF2 = C1.push + 8;
const GLANCE = C1.brother - 10;
const GLANCE_GAP = C1.father - 4 - (C1.brother - 10);
const PUSH = { a: C1.push, b: V.chotto + 44 };
/** AG1: exasperation, then the walk off to the left (the clacks of his leaving). */
const CUT_AG = GA - 6;
const THROW = GA + 1;
const SHAKE = { a: GA + 4, dur: 28 };
const WALK_OFF: WalkOpts = {
  start: GA + 22,
  dur: 84,
  fromX: 1086,
  toX: 560,
  scale: 0.62,
  height: CAST.surendra.height,
  seed: CAST.surendra.seed,
  startIn: 12,
  stopIn: 8,
};
/** AG2: the elder edges out, stands before Balak sheepish, softens, grins and runs off laughing. */
const PEEK2 = GA + 20;
const SIDLE = { a: GA + 30, b: GA + 40 };
const WALK_OUT: WalkOpts = {
  start: GA + 40,
  dur: 22,
  fromX: 1196,
  toX: 1062,
  scale: 0.6,
  height: CAST.elderBrother.height,
  seed: CAST.elderBrother.seed,
  child: true,
  startIn: 6,
  stopIn: 8,
};
const SHEEP = WALK_OUT.start + WALK_OUT.dur;
const GRIN = SHEEP + 12;
const RUN_OFF: WalkOpts = {
  start: GRIN + 5,
  dur: 40,
  fromX: 1062,
  toX: 1600,
  scale: 0.64,
  height: CAST.elderBrother.height,
  seed: CAST.elderBrother.seed,
  child: true,
  kind: "run",
  startIn: 8,
  stopIn: 6,
};
const LAUGH = { a: GRIN + 2, dur: 48 };
/** A1: as he runs off he glances back once at Balak, a moment's softness, then the grin again (before P3). */
const A1 = { a: RUN_OFF.start + 5, b: Math.min(RUN_OFF.start + 15, P3[0] - 1) };
/** Balak: the second wipe (AG2), the forgiving smile and the glow beat (P3). */
const WIPE2 = GB + 8;
const FORGIVE = P3[0] - 2;
/**
 * G1 (P3, the afterglow): cut to Balak sitting on the veranda edge by the plates, a hand still at his back (he settles
 * as the shot opens); a sparrow hops close and pecks a grain by the plates; he watches it, the forgiving smile comes, the
 * light warms toward evening, the glow beat (key beat 1), a slow drift in. Episode06.tsx fades P3's last 18 f.
 */
const G1 = {
  settle: { a: P3[0], b: P3[0] + 14 },
  hops: [P3[0] + 6, P3[0] + 13, P3[0] + 20],
  tilt: P3[0] + 26,
  peck: P3[0] + 32,
  chirps: [P3[0] + 4, P3[0] + 24, P3[0] + 44],
  smile: P3[0] + 30,
  drift: { a: P3[0], b: P3[1] },
};
const GLOW_UP = { a: P3[0] + 30, b: P3[0] + 52 };

/* ------------------------------------------------------------------ */
/* Layout: everyone on the 0.65 plane (UjancharHouse world px)           */
/* ------------------------------------------------------------------ */

const HUT = UJANCHAR.HUT;
const DOOR = UJANCHAR.DOOR;
/** Adult Puppet scale at ground y on the 0.65 plane (0.46 at the plinth's foot, a gentle perspective: horizon y 520). */
const K = (y: number) => (0.46 * (y - 520)) / (HUT.bottom + 10 - 520);
/** The father on the veranda (the hut's depth). */
const K_VERANDA = 0.45;

/** Balak's spot (between his feet), facing +x. */
const BALAK = { x: 980, y: 968 };
const BALAK_K = K(BALAK.y);
const BALAK_S = EP06_CHILD_SCALE.standingBalak.s * BALAK_K;
const BALAK_HS = EP06_CHILD_SCALE.standingBalak.headScale;
/** Body yaw (0 front .. 1 three-quarter): 0.5 keeps the plate head in its good three-quarter range in the close-ups. */
const BALAK_YAW = 0.5;
/** The elder starts behind Balak's back (to his left), facing +x. */
const ELDER0 = { x: 928, y: 958 };
/** The hiding place behind the hut's far corner (feet just behind the plinth line). */
const HIDE = { x: 1140, y: 840 };
const PEEK_X = 1172;
/** The wall's end and the plinth's end (0.65 plane). */
const WALL_END = HUT.x1 - 26;
const PLINTH_END = HUT.x1;
/** The khadam resting at the plinth's foot below the door; the father's spot after stepping into them. */
const KHADAM = { x: 760, y: HUT.bottom + 14 };
const FATHER_DOOR = { x: DOOR.x - 4, y: HUT.top };
const FATHER_EDGE = { x: 776, y: HUT.top + 3 };
/** W1 b: the elder crouched at the plinth's foot by the second plate. */
const ELDER_CROUCH = { x: 1086, y: HUT.bottom + 22 };
/** The veranda props (my layer, so they stay sharp in the close shots): thalis and slates on the veranda edge. */
const THALI_A = { x: 1030, y: HUT.top + 7 };
const THALI_B = { x: 1072, y: HUT.top + 5 };
/** G1: Balak sitting on the veranda edge left of the plates; the sparrow's start and the grain by the plates. */
const SEAT = { x: 940, y: HUT.top + 4 };
const SPARROW0 = { x: 1134, y: HUT.top + 9 };
const GRAIN_X = 1104;
/** The hens pecking in the courtyard by the fence, and the crow on the fence's top rail. */
const HENS = { x: 1215, y: 905 };
const CROW = { x: 1288, y: 736 };
const FATHER_STOP = { x: 1086, y: 960 };
const FATHER_OFF = { x: 560, y: 900 };
/** The classmates in front of the fence. */
const BOY_A = { x: 1332, y: 874 };
const BOY_B = { x: 1390, y: 870 };

/* ------------------------------------------------------------------ */
/* Camera (framings on the 0.65 plane)                                  */
/* ------------------------------------------------------------------ */

interface Framing {
  /** 0.65-plane world point put at screen (sx, sy) at 0.65-plane scale s (the camera zoom is s ^ (1 / 0.65)). */
  wx: number;
  wy: number;
  sx: number;
  sy: number;
  s: number;
}
const D = UJANCHAR.PLANES.yard;
const camOf = (k: Framing): Cam => ({
  x: (k.wx - 960 - (k.sx - 960) / k.s) / D,
  y: (k.wy - 540 - (k.sy - 540) / k.s) / D,
  zoom: Math.pow(k.s, 1 / D),
});
/** ujancharKeepInSet, plus the yard's beaten earth (to y 1100) always under the bottom of the frame. */
const keep = (c: Cam): Cam => {
  const k = ujancharKeepInSet(c);
  const s = Math.pow(k.zoom, D);
  const yMax = (1084 - 540 - 540 / s) / D;
  return { ...k, y: Math.min(k.y, yMax) };
};
const mixFraming = (a: Framing, b: Framing, u: number): Framing => {
  // log-scale mix (an even push); the target point glides in screen space with the zoom
  const s = a.s * Math.pow(b.s / a.s, u);
  const k = u <= 0 ? 0 : u >= 1 ? 1 : (1 / a.s - 1 / s) / Math.max(1e-6, 1 / a.s - 1 / b.s);
  return { wx: lerp(a.wx, b.wx, k), wy: lerp(a.wy, b.wy, k), sx: lerp(a.sx, b.sx, k), sy: lerp(a.sy, b.sy, k), s };
};

/** Balak's face (world, bent in hurtBack) for the close framings. */
const FACE = { x: 995, y: 832 };
const F_WIDE: Framing = { wx: 1000, wy: 788, sx: 960, sy: 540, s: 2.0 };
const F_MED: Framing = { wx: 1130, wy: 848, sx: 960, sy: 540, s: 3.0 };
/** K1: ground level on the khadam at the plinth's foot (the elder's point of view): the father's feet and shins. */
const F_K1: Framing = { wx: 766, wy: 840, sx: 960, sy: 600, s: 7.5 };
/** C1 (2): the father's face from slightly below, Balak's head a soft hint at the lower left. */
const F_C1F: Framing = { wx: 1050, wy: 768, sx: 1100, sy: 460, s: 7.2 };
/** G1: Balak on the veranda edge, the plates and the sparrow beside him; a slow drift in. */
const F_G1A: Framing = { wx: 1015, wy: 772, sx: 960, sy: 600, s: 6.0 };
const F_G1B: Framing = { wx: 1005, wy: 770, sx: 940, sy: 600, s: 7.0 };
const F_P1: Framing = { wx: FACE.x, wy: FACE.y, sx: 660, sy: 430, s: 5 };
const F_TWO: Framing = { wx: 980, wy: 830, sx: 960, sy: 540, s: 2.6 };
const F_PEEK: Framing = { wx: 1182, wy: 728, sx: 1150, sy: 470, s: 6.5 };
const F_B4: Framing = { wx: 1040, wy: 868, sx: 960, sy: 540, s: 3.6 };
/** Shot 5: a close two-shot, Balak's face lower left, the father's whole head inside the top of the frame. */
const F_B5: Framing = { wx: 1030, wy: 828, sx: 960, sy: 540, s: 6.2 };
const F_AG: Framing = { wx: 1000, wy: 839, sx: 960, sy: 540, s: 2.8 };

interface Shot {
  from: number;
  name: string;
  fr: Framing;
  push?: { a: number; b: number; to: Framing };
}
const SHOTS: Shot[] = [
  { from: -Infinity, name: "1 wide", fr: F_WIDE },
  { from: CUT2, name: "2 medium", fr: F_MED },
  { from: K1_CU.a, name: "K1 khadam", fr: F_K1 },
  { from: K1_CU.b, name: "2 medium (dart)", fr: F_MED },
  { from: P1_CUT, name: "P1 Balak", fr: F_P1 },
  { from: V.baba - 2, name: "3 wide two-shot", fr: F_TWO },
  { from: C1.brother, name: "P2 insert", fr: F_PEEK },
  { from: C1.father, name: "C1 father", fr: F_C1F },
  { from: SHOT4, name: "4 medium + push, 5 MCU", fr: F_B4, push: { a: PUSH.a, b: PUSH.b, to: F_B5 } },
  { from: CUT_AG, name: "AG two-shot", fr: F_AG },
  { from: P3[0], name: "G1 veranda", fr: F_G1A, push: { a: G1.drift.a, b: G1.drift.b, to: F_G1B } },
];
const shotAt = (lf: number): Shot => {
  let k = 0;
  for (let i = 0; i < SHOTS.length; i++) if (lf >= SHOTS[i].from) k = i;
  return SHOTS[k];
};
const framingAt = (lf: number): Framing => {
  const sh = shotAt(lf);
  if (!sh.push) return sh.fr;
  return mixFraming(sh.fr, sh.push.to, EASE.inOut(clamp((lf - sh.push.a) / (sh.push.b - sh.push.a))));
};

/* ------------------------------------------------------------------ */
/* The father (Surendra): door, step down into the khadam, search, ask, leave */
/* ------------------------------------------------------------------ */

const io = "inOut" as const;
type Place = { x: number; y: number; k: number };

const fatherPlace = (lf: number): Place => {
  if (lf < STEP_OUT.a) return { ...FATHER_DOOR, k: K_VERANDA };
  if (lf < STAMP1 + 3) {
    const u = EASE.inOut(clamp((lf - STEP_OUT.a) / (STEP_OUT.b - STEP_OUT.a)));
    return { x: lerp(FATHER_DOOR.x, FATHER_EDGE.x, u), y: lerp(FATHER_DOOR.y, FATHER_EDGE.y, u), k: K_VERANDA };
  }
  if (lf < WALK_IN.start) {
    // the step down off the plinth with the first foot (the body drops with it onto the earth at the clack)
    const u = EASE.inOut(clamp((lf - (STAMP1 + 3)) / (CLACK1 - (STAMP1 + 3))));
    const y = lerp(FATHER_EDGE.y, KHADAM.y, u);
    return { x: lerp(FATHER_EDGE.x, KHADAM.x, u), y, k: lerp(K_VERANDA, K(KHADAM.y), u) };
  }
  if (lf < WALK_OFF.start) {
    const x = walkTravel(lf, WALK_IN).bodyX;
    const u = clamp((x - WALK_IN.fromX) / (WALK_IN.toX - WALK_IN.fromX));
    const y = lerp(KHADAM.y, FATHER_STOP.y, u);
    return { x, y, k: K(y) };
  }
  const x = walkTravel(lf, WALK_OFF).bodyX;
  const u = clamp((WALK_OFF.fromX - x) / (WALK_OFF.fromX - WALK_OFF.toX));
  const y = lerp(FATHER_STOP.y, FATHER_OFF.y, u);
  return { x, y, k: K(y) };
};

/** Facing -x (toward Balak) the father's near arm is this sign (checked on stills), its open hand and the eyes' x. */
const FATHER_NEAR = -1;
const FATHER_NEAR_OPEN = { lHand: "open" } as Partial<Pose>;
const FATHER_EYE_X = -0.6;
const fatherKeys = makeActing<Pose>(BASE_POSE, [
  // in the doorway's shadow: he has heard the quarrel and looks out toward it
  { f: 0, bodyTurn: 0.45, smile: 0.12, brow: 0.15, browTilt: -0.15, eyeY: 0.1, headTurn: 0.1 },
  { f: STEP_OUT.b, in: STEP_OUT.b - STEP_OUT.a, ease: io, bodyTurn: 0.7, ...GESTURES6.searchLook, eyeY: 0.3, headTurn: 0.15 },
  // he looks down for his khadam and steps into them (the stamps add the knee and the drop)
  { f: STAMP1 + 2, in: 8, ease: io, headNod: 6, eyeY: 0.6 },
  { f: CLACK2 + 6, in: 10, ease: io, headNod: 0, eyeY: 0.25 },
  // the stride in: searching face
  { f: WALK_IN.start + 6, in: 10, ease: io, ...GESTURES6.searchLook, eyeY: 0.2 },
  // stopped: he turns to the boy and bends, a hand held out palm up, asking (mirrored askBend: he faces -x)
  { f: TURN.a, ease: io, bodyTurn: 0.85 },
  { f: TURN.b, in: TURN.b - TURN.a, ease: io, bodyTurn: -0.65 },
  { f: ASK.a, ease: io, lean: 0, crouch: 0, reach: 0, reachUp: 0, headNod: 0, eyeY: 0.2 },
  { f: ASK.b, in: ASK.b - ASK.a, ease: io, lean: -12, crouch: 0.08, headNod: 3, reach: FATHER_NEAR, reachUp: 1, ...FATHER_NEAR_OPEN, brow: 0.3, browTilt: -0.25, smile: 0.08, eyeX: FATHER_EYE_X, eyeY: 0.45 },
  // waiting for the answer: he eases a little, then leans in again as the boy looks up at him
  { f: GLANCE - 6, in: 20, ease: io, lean: -8, reach: 0.65 * FATHER_NEAR, crouch: 0.05, eyeY: 0.4 },
  { f: GLANCE + GLANCE_GAP + 6, in: 16, ease: io, lean: -13, reach: 0.85 * FATHER_NEAR, crouch: 0.09, eyeY: 0.5, brow: 0.35 },
  // the answer: brows go up (the unspoken "বোকাটা…"), then exasperation
  { f: V.bolle + 10, in: 14, ease: io, brow: 0.5, browTilt: 0.2, eyeY: 0.45 },
  { f: GA - 1, in: 12, ease: io, lean: -2, crouch: 0, reach: 0, reachUp: 0, rHand: "relaxed", lHand: "relaxed", headNod: 0, ...GESTURES6.exasperated, headTilt: 4, eyeY: 0.1 },
  // walking off: a last exasperated look straight ahead
  { f: WALK_OFF.start + 10, in: 12, ease: io, brow: 0.25, browTilt: 0.1, smile: 0.06, headTilt: 0, eyeX: -0.3, eyeY: 0.1 },
]);
const fatherActing = (lf: number): Pose => {
  const k = fatherKeys(lf);
  const p: Pose = { ...k };
  // the two steps down into the khadam (right foot first, then the left)
  const s1 = stampPulse(lf, STAMP1);
  const s2 = stampPulse(lf, STAMP2);
  if (s1.stamp > 0) p.stamp = s1.stamp;
  if (s2.stamp > 0) p.stamp = -s2.stamp;
  p.bodyY = (p.bodyY ?? 0) + s1.dY + s2.dY;
  // searching look, left and right (eyes lead)
  const la = lookAround(lf, LOOK.a, LOOK.dur, 0.45, -1);
  p.headTurn += la.headTurn;
  p.eyeX += la.eyeX;
  // exasperation: the near hand (right, he faces -x) flung up, a head shake
  const tu = throwUpPulse(lf, THROW, 10);
  if (tu > 0) p.throwUp = FATHER_NEAR * tu;
  p.headTurn += headShake(lf, SHAKE.a, SHAKE.dur, 0.24, 2.5);
  // the walks
  if (lf >= WALK_IN.start && lf <= WALK_IN.start + WALK_IN.dur + 2) Object.assign(p, walkPose(lf, WALK_IN));
  if (lf >= WALK_OFF.start && lf <= WALK_OFF.start + WALK_OFF.dur + 2) Object.assign(p, walkPose(lf, WALK_OFF));
  return p;
};
const fatherMouth = (lf: number): MouthState => (lf > ASK_MOUTH.a && lf < ASK_MOUTH.b ? visemeChatter(lf, 23, 0.75) : MOUTH_REST);
/** Brightness: in the door's shadow, then out in the afternoon light. */
const fatherBright = (lf: number) => track(lf, [
  [STEP_OUT.a, 0.5],
  [STEP_OUT.b, 1],
]);
/** He wears the khadam from his first step into them (footwear), the resting pair is drawn until then. */
const wearsKhadam = (lf: number) => lf >= CLACK1 - 1;

/* ------------------------------------------------------------------ */
/* The elder brother                                                    */
/* ------------------------------------------------------------------ */

const DART_OPTS: WalkOpts = {
  start: DART,
  dur: DART_DUR,
  fromX: ELDER0.x,
  toX: 1206,
  scale: 0.58,
  height: CAST.elderBrother.height,
  seed: CAST.elderBrother.seed,
  child: true,
  kind: "run",
  startIn: 5,
  stopIn: 6,
};
const DART_END = { x: 1206, y: 852 };
/** On the line he gets up from the plates and stomps over behind Balak. */
const STOMP: WalkOpts = {
  start: ELDER_RISE + 6,
  dur: 24,
  fromX: ELDER_CROUCH.x,
  toX: ELDER0.x,
  scale: 0.6,
  height: CAST.elderBrother.height,
  seed: CAST.elderBrother.seed,
  child: true,
  kind: "stomp",
  startIn: 6,
  stopIn: 6,
};
const STOMP_END = STOMP.start + STOMP.dur;
/** The tap point on the second plate's rim (the hand dips onto it at each tap). */
const plateTapAt = (lf: number) => {
  let dip = 0;
  for (const t of PLATE_TAPS) dip = Math.max(dip, track(lf, [[t - 3, 0], [t, 1], [t + 3, 0]]));
  return { x: THALI_B.x - 10, y: THALI_B.y - 9 + 7 * dip };
};

/** Where the elder is, his scale and whether the hut's corner hides him (clip). */
const elderPlace = (lf: number): Place & { clip: boolean } => {
  if (lf < STOMP.start) return { ...ELDER_CROUCH, k: K(ELDER_CROUCH.y), clip: false };
  if (lf < DART) {
    const x = walkTravel(lf, STOMP).bodyX;
    const u = clamp((ELDER_CROUCH.x - x) / (ELDER_CROUCH.x - ELDER0.x));
    const y = lerp(ELDER_CROUCH.y, ELDER0.y, u);
    return { x, y, k: K(y), clip: false };
  }
  if (lf < SLIP.a) {
    const x = walkTravel(lf, DART_OPTS).bodyX;
    const u = clamp((x - ELDER0.x) / (DART_END.x - ELDER0.x));
    const y = lerp(ELDER0.y, DART_END.y, Math.pow(u, 1.3));
    return { x, y, k: K(y), clip: false };
  }
  if (lf < SIDLE.a) {
    // round the corner and behind the wall; in P2 (and as the father leaves) he leans out at PEEK_X
    const u = EASE.inOut(clamp((lf - SLIP.a) / (SLIP.b - SLIP.a)));
    const peek = track(lf, [
      [PEEK - 8, 0],
      [PEEK, 1],
      [PEEK_END, 1],
      [PEEK_END + 10, 0],
      [PEEK2 - 6, 0],
      [PEEK2 + 2, 1],
    ]);
    const x = lerp(DART_END.x, HIDE.x, u) + (PEEK_X - HIDE.x) * peek;
    const y = lerp(DART_END.y, HIDE.y, u);
    return { x, y, k: K(y), clip: true };
  }
  if (lf < WALK_OUT.start) {
    // edging out round the corner, still half behind it
    const u = EASE.inOut(clamp((lf - SIDLE.a) / (SIDLE.b - SIDLE.a)));
    const y = lerp(HIDE.y, 862, u);
    return { x: lerp(PEEK_X, WALK_OUT.fromX, u), y, k: K(y), clip: lf < SIDLE.b - 3 };
  }
  if (lf < RUN_OFF.start) {
    const x = walkTravel(lf, WALK_OUT).bodyX;
    const u = clamp((WALK_OUT.fromX - x) / (WALK_OUT.fromX - WALK_OUT.toX));
    const y = lerp(862, 962, u);
    return { x, y, k: K(y), clip: false };
  }
  const x = walkTravel(lf, RUN_OFF).bodyX;
  const u = clamp((x - RUN_OFF.fromX) / (RUN_OFF.toX - RUN_OFF.fromX));
  const y = lerp(962, 920, u);
  return { x, y, k: K(y), clip: false };
};

const RESET_ARMS = { rS: 6, rE: -8, lS: 6, lE: -8, rHand: "relaxed", lHand: "relaxed" } as Partial<Pose>;
const elderKeys = makeActing<Pose>(BASE_POSE, [
  // W1 b: crouched by the empty plates, a hand reaching to tap one, then a look toward the kitchen (impatient)
  { f: 0, bodyTurn: 0.55, crouch: 0.8, lean: 6, brow: 0.2, browTilt: -0.3, smile: 0.05, eyeY: 0.45 },
  { f: PLATE_TAPS[0] - 3, in: 8, ease: io, reach: -1, reachUp: 0, lHand: "relaxed" },
  { f: KITCHEN_LOOK + 4, in: 7, ease: io, headTurn: -0.55, eyeX: -0.7, brow: 0.1, browTilt: -0.65, eyeY: 0.05, smile: 0 },
  // on the line: up, and the stomp over behind Balak
  { f: STOMP.start + 2, in: 8, ease: io, crouch: 0, reach: 0, lean: 0, headTurn: 0, eyeX: 0, bodyTurn: -0.8 },
  // scolding Balak's back: knitted brows, chin up, leaning in (the jab is added below)
  { f: STOMP_END + 6, in: 8, ease: io, bodyTurn: 0.75, ...GESTURES6.scold },
  { f: SWAT_START - 2, in: 8, ease: io, lean: 6, brow: -0.25, browTilt: -0.9 },
  // a beat of satisfaction after the swat, then the clack: he freezes, eyes wide
  { f: SWAT_HIT + 6, in: 6, ease: io, lean: 2, smile: 0.15, browTilt: -0.5 },
  { f: CLACK1 + 6, in: 6, ease: io, ...GESTURES6.frightFreeze },
  // the dart: arms free for the run, still a little hunched
  { f: DART + 4, in: 5, ease: io, ...RESET_ARMS, hunch: 0.35, gasp: 0.12, brow: 0.8, browTilt: 0.5, lean: 0 },
  // behind the wall: turned back toward the gap, pressed in, catching his breath
  { f: SLIP.a + 2, in: 8, ease: io, bodyTurn: 0.15, hunch: 0.45 },
  { f: SLIP.b + 8, in: 10, ease: io, bodyTurn: 0.55, hunch: 0.3, gasp: 0.08, brow: 0.75, browTilt: 0.55 },
  // P2: peeking out, finger to his lips, then palms joined, pleading
  { f: PEEK, in: 8, ease: io, ...GESTURES6.peekShush, hunch: 0, bodyTurn: 0.5, headTurn: 0, lean: 7, eyeX: -0.7 },
  { f: PLEAD, in: 7, ease: io, shush: 0, ...GESTURES6.plead, lean: 9, bodyTurn: 0.45, headTurn: -0.4, eyeX: -0.6 },
  { f: PEEK_END + 10, in: 10, ease: io, join: 0, ...RESET_ARMS, lean: 0, headTilt: 0, headTurn: 0, eyeX: 0, brow: 0.6, browTilt: 0.5, smile: 0 },
  // watching the father go, then edging out
  { f: PEEK2 + 2, in: 8, ease: io, lean: 9, bodyTurn: 0.3, headTurn: -0.5, eyeX: -0.6, brow: 0.45, browTilt: 0.4, hunch: 0.2 },
  { f: SIDLE.b, in: 10, ease: io, lean: 0, bodyTurn: -0.5, headTurn: 0, eyeX: -0.3, hunch: 0.1 },
  // before Balak: sheepish, softened, then the grin
  { f: SHEEP + 4, in: 8, ease: io, ...GESTURES6.sheepish, bodyTurn: -0.55, hunch: 0 },
  { f: SHEEP + 10, in: 6, ease: io, brow: 0.45, browTilt: 0.55, smile: 0.32 },
  { f: GRIN + 3, in: 5, ease: io, behind: 0, ...RESET_ARMS, ...GESTURES6.grin, headNod: 0, eyeY: 0 },
  { f: RUN_OFF.start + 4, in: 6, ease: io, bodyTurn: 0.85 },
]);
const elderActing = (lf: number): Pose => {
  const p: Pose = { ...elderKeys(lf) };
  // the scolding finger (near arm), then the one swat (near arm)
  const jab = scoldPulse(lf, STOMP_END - 2, SWAT_START - 6 - (STOMP_END - 2), 11);
  if (jab > 0) p.jab = -jab;
  const sw = swatPulse(lf, SWAT_START);
  if (sw.swat > 0) {
    p.swat = -sw.swat;
    p.swatHit = sw.swatHit;
    p.lean += sw.dLean;
  }
  if (lf >= PLEAD && lf < PEEK_END + 6) {
    const b = pleadBob(lf, PLEAD, PEEK_END + 6 - PLEAD);
    p.headNod += b.headNod;
    p.lean += b.lean;
  }
  if (lf >= STOMP.start && lf <= STOMP_END + 2) Object.assign(p, walkPose(lf, { ...STOMP, bodyTurn: -0.8 }));
  if (lf >= DART && lf <= DART + DART_DUR + 2) Object.assign(p, walkPose(lf, DART_OPTS));
  // A1: one glance back at Balak as he runs off, a moment's softness, then the grin again
  const g = track(lf, [[A1.a, 0], [A1.a + 3, 1], [A1.b - 3, 1], [A1.b, 0]]);
  if (g > 0) {
    p.headTurn = lerp(p.headTurn, -0.95, g);
    p.eyeX = lerp(p.eyeX, -0.8, g);
    p.smile = lerp(p.smile, 0.35, g);
    p.brow = lerp(p.brow, 0.45, g);
    p.browTilt = lerp(p.browTilt, 0.5, g);
  }
  if (lf >= WALK_OUT.start && lf <= WALK_OUT.start + WALK_OUT.dur + 2) Object.assign(p, walkPose(lf, { ...WALK_OUT, bodyTurn: -0.55 }));
  if (lf >= RUN_OFF.start && lf <= RUN_OFF.start + RUN_OFF.dur + 2) Object.assign(p, walkPose(lf, RUN_OFF));
  return p;
};
const elderMouth = (lf: number): MouthState => {
  if (lf > ELDER_RISE && lf < SWAT_START) return visemeChatter(lf, 7, 0.9);
  if (lf > LAUGH.a && lf < LAUGH.a + LAUGH.dur) {
    const m = shoutMouth(lf, LAUGH.a, LAUGH.dur, 5);
    // a laugh: open, wide, bubbling
    return { ...m, open: m.open * (0.55 + 0.25 * Math.abs(Math.sin(lf * 0.9))), width: m.width + 0.15 };
  }
  return MOUTH_REST;
};
/** MOT-20: blustery while scolding, quick in fright, settling in hiding, calm after. */
const elderBreath = (lf: number) => track(lf, [
  [0, 1.2],
  [CLACK1, 1.2],
  [CLACK1 + 4, 2.2],
  [SLIP.b + 30, 2.0],
  [P2[1] + 20, 1.6],
  [GB, 1.3],
  [SHEEP + 10, 1.05],
]);

/* ------------------------------------------------------------------ */
/* The classmates at the fence                                          */
/* ------------------------------------------------------------------ */

const boyRun = (x0: number, start: number, seed: number): WalkOpts => ({
  start,
  dur: 32,
  fromX: x0,
  toX: x0 + 520,
  scale: 0.5,
  height: CAST.villageBoyA.height,
  seed,
  child: true,
  kind: "run",
  startIn: 6,
  stopIn: 4,
});
const RUN_OPTS_A = boyRun(BOY_A.x, RUN_A, CAST.villageBoyA.seed);
const RUN_OPTS_B = boyRun(BOY_B.x, RUN_B, CAST.villageBoyB.seed);
const boyKeys = (turn: number, startle: number) =>
  makeActing<Pose>(BASE_POSE, [
    { f: 0, bodyTurn: turn, headTilt: 6, brow: 0.35, eyeY: 0.15, smile: 0.3 },
    { f: SWAT_HIT + 6, in: 6, ease: io, gasp: 0.15, brow: 0.6, smile: 0.1 },
    { f: startle + 4, in: 4, ease: io, hunch: 0.5, gasp: 0.3, brow: 0.9, browTilt: 0.5, smile: 0 },
    { f: startle + 14, in: 6, ease: io, hunch: 0.15 },
  ]);
const BOY_A_KEYS = boyKeys(-0.45, STARTLE);
const BOY_B_KEYS = boyKeys(-0.35, STARTLE + 3);
const boyActing = (keys: (f: number) => Pose, run: WalkOpts) => (lf: number): Pose =>
  lf >= run.start && lf <= run.start + run.dur + 2 ? { ...keys(lf), ...walkPose(lf, run) } : keys(lf);
const boyX = (x0: number, run: WalkOpts, lf: number) => (lf < run.start ? x0 : walkTravel(lf, run).bodyX);

/* ------------------------------------------------------------------ */
/* Balak (StandingChild, plate design, age 6)                           */
/* ------------------------------------------------------------------ */

/** Pose timeline: [from, pose, blend frames]. */
const POSES: Array<[number, StandingPose, number]> = [
  [-999, "standQuiet", 18],
  [V.ekdin, "standScolded", 16],
  [SWAT_HIT, "hurtBack", 8],
  [WIPE1, "wipeEye", 8],
  [WIPE1_END, "hurtBack", 12],
  [WIPE2, "wipeEye", 8],
];
/** Expression timeline: quiet while scolded, hurt after the swat, the forgiving smile in P3 (never a grin). */
const EXPR: Array<[number, StandingExpression]> = [
  [-999, "thoughtful"],
  [SWAT_HIT, "hurt"],
  [FORGIVE, "forgiving"],
];
const idxAt = (starts: number[], lf: number) => {
  let i = 0;
  for (let k = 0; k < starts.length; k++) if (lf >= starts[k]) i = k;
  return i;
};

/** World point -> Balak's figure units. */
const BL = (P: { x: number; y: number }) => standingLocal(P, BALAK.x, BALAK.y, BALAK_S, false);
/** Heads (world, approximate) for his gaze targets. */
const fatherHeadAt = (lf: number) => {
  const p = fatherPlace(lf);
  const bent = lf >= ASK.a && lf < GA ? 1 : 0;
  return { x: p.x - 14 * bent * p.k, y: p.y - (0.9 - 0.06 * bent) * 377 * p.k };
};
const elderHeadAt = (lf: number) => {
  const p = elderPlace(lf);
  return { x: p.x, y: p.y - 0.86 * 325 * p.k };
};
/** A gaze point toward the running brother, kept within a comfortable head turn (the eyes carry the rest). */
const towardElder = (lf: number) => {
  const e = elderHeadAt(lf);
  const h = { x: BALAK.x + 20, y: BALAK.y - 150 };
  const dx = e.x - h.x;
  const k = Math.min(1, 110 / Math.max(1, Math.abs(dx)));
  return { x: h.x + dx * k, y: h.y + (e.y - h.y) * k };
};
const CORNER_EYE = { x: PEEK_X + 26, y: HIDE.y - 0.8 * 325 * K(HIDE.y) };

/**
 * Gaze target in figure units, its direction from his head kept within |ux| <= GAZE_UX (a target further to the side is
 * swung up toward it at the same distance). The rig turns the plate head by 1.35 yaw + 0.22 lookX + the gaze turn
 * (0.9 (ux - 0.55)); with BALAK_YAW and this cap the head stays inside the plate's three-quarter range (|turn| <= about
 * 1, ThakurHeadPlate) and the eyes carry the rest of the look.
 */
const GAZE_UX = 0.72;
const GAZE_FROM = { x: BALAK.x + 12, y: BALAK.y - 140 };
const GZ = (P: { x: number; y: number }) => {
  const dx = P.x - GAZE_FROM.x;
  const dy = P.y - GAZE_FROM.y;
  const l = Math.hypot(dx, dy) || 1;
  let ux = dx / l;
  let uy = dy / l;
  if (Math.abs(ux) > GAZE_UX) {
    ux = Math.sign(ux) * GAZE_UX;
    uy = (uy > 0.2 ? 1 : -1) * Math.sqrt(1 - GAZE_UX * GAZE_UX);
  }
  return BL({ x: GAZE_FROM.x + ux * l, y: GAZE_FROM.y + uy * l });
};
/** Gaze keys (eyes lead, the head follows; MOT-13). */
const GAZE: GazeKey[] = [
  // the father's stride in: his eyes go to him and follow; up to his face as he asks
  { at: GZ(fatherHeadAt(WALK_IN.start + 30)), start: WALK_IN.start + 22 },
  { at: GZ(fatherHeadAt(STOP_AT)), start: STOP_AT - 8 },
  { at: GZ(fatherHeadAt(ASK.b)), start: ASK.a + 6 },
  // shot 4: once to the hiding place, then up to his father, and steady there through the line
  ...glanceHideThenFather({ hideAt: GZ(CORNER_EYE), fatherAt: GZ(fatherHeadAt(GLANCE + GLANCE_GAP)), start: GLANCE, gap: GLANCE_GAP }),
  // AG1: down as his father turns away
  { at: undefined, start: GA + 20 },
  // AG2: his brother coming out, standing before him, running off
  { at: GZ(elderHeadAt(SIDLE.b)), start: SIDLE.a + 4 },
  { at: GZ(elderHeadAt(WALK_OUT.start + 12)), start: WALK_OUT.start + 8 },
  { at: GZ(elderHeadAt(SHEEP + 4)), start: SHEEP },
  { at: GZ(towardElder(RUN_OFF.start + 12)), start: RUN_OFF.start + 6 },
  { at: GZ(towardElder(RUN_OFF.start + 30)), start: RUN_OFF.start + 20 },
];

const balakProps = (lf: number): StandingChildProps => {
  const i = idxAt(POSES.map((q) => q[0]), lf);
  const [start, pose, blend] = POSES[i];
  const prev = i > 0 ? POSES[i - 1] : null;
  const e = idxAt(EXPR.map((q) => q[0]), lf);
  const p: StandingChildProps = {
    x: BALAK.x,
    y: BALAK.y,
    s: BALAK_S,
    headScale: BALAK_HS,
    f: lf,
    lifeF: lf,
    age: 6,
    yaw: BALAK_YAW,
    build: "healthy",
    pose,
    poseStart: Math.max(-999, start),
    prevPose: prev ? prev[1] : undefined,
    prevPoseStart: prev ? Math.max(-999, prev[0]) : undefined,
    blendFrames: blend,
    flinch: start === SWAT_HIT ? 1 : 0,
    hurtBreath: lf < SWAT_HIT ? 0 : track(lf, [
      [SWAT_HIT, 1],
      [SWAT_HIT + 60, 0.7],
      [P1[1], 0.55],
      [V.kintu, 0.35],
      [V.jao, 0.08],
      [V.jao + 30, 0],
    ]),
    expression: EXPR[e][1],
    prevExpression: e > 0 ? EXPR[e - 1][1] : undefined,
    expressionStart: Math.max(0, EXPR[e][0]),
    teary: track(lf, [
      [SWAT_HIT + 2, 0],
      [SWAT_HIT + 26, 0.85],
      [V.baba, 0.75],
      [V.chotto, 0.55],
      [V.jao, 0.35],
      [WIPE2 + 20, 0.3],
      [WIPE2 + 40, 0.12],
    ]),
    sniffAt: [SNIFF1, SNIFF2],
    gaze: GAZE,
    mouth: balakMouth(lf),
    talk: balakTalk(lf),
    headShake: track(lf, [
      [V.ami - 3, 0],
      [V.ami + 3, 1],
      [V.ami + 22, 1],
      [V.ami + 30, 0],
    ]),
  };
  return p;
};

/** The swat's target: the middle of his upper back (world), every frame from the rig (contact, MOT-07). */
const balakBackAt = (lf: number) => {
  const j = standingChildJoints(balakProps(lf));
  const sh = { x: (j.shoulderNear.x + j.shoulderFar.x) / 2, y: (j.shoulderNear.y + j.shoulderFar.y) / 2 };
  return { x: lerp(sh.x, j.pelvis.x, 0.3) - 9 * BALAK_S, y: lerp(sh.y, j.pelvis.y, 0.3) };
};
const balakHeadAt = (lf: number) => {
  const h = standingChildJoints(balakProps(lf)).head;
  return { x: h.x - 4, y: h.y - 34 };
};
const balakChestAt = (lf: number) => {
  const c = standingChildJoints(balakProps(lf)).chest;
  return { x: c.x + 40 * BALAK_S, y: c.y - 10 * BALAK_S };
};

/** Balak's glow: steady, brightening gently only in P3 (key beat 1, forgiveness); never pulsing with breath. */
const beatAt = (lf: number) => EASE.inOut(clamp((lf - GLOW_UP.a) / (GLOW_UP.b - GLOW_UP.a)));
const glowAt = (lf: number) => 0.6 + 0.4 * beatAt(lf);

/* ------------------------------------------------------------------ */
/* Sound events for Episode06.tsx (REAL scene-local frames)              */
/* ------------------------------------------------------------------ */

export interface SceneSoundEvent {
  id: string;
  /** Real scene-local frame (add EP06_SCENES[2].startFrame = 629 for the absolute frame). */
  f: number;
  file: string;
  volume: number;
  /** Khadam steps: which foot lands (1 = right, -1 = left), on what, and in which walk. */
  foot?: 1 | -1;
  surface?: "earth" | "veranda floor";
  phase?: "step down" | "search" | "leave";
  /** A loop run over this many frames from f (the hens' clucking under W1 to the scatter). */
  loopFrames?: number;
}

const KHADAM_FILES = ["sfx/ep06/khadam_step_1.wav", "sfx/ep06/khadam_step_2.wav", "sfx/ep06/khadam_step_3.wav"];
const khadamSteps = (() => {
  const out: Array<{ f: number; foot: 1 | -1; phase: "step down" | "search" | "leave" }> = [
    { f: CLACK1, foot: 1, phase: "step down" },
    { f: CLACK2, foot: -1, phase: "step down" },
  ];
  for (const p of walkPlantFrames(WALK_IN)) out.push({ f: p.f, foot: p.side, phase: "search" });
  for (const p of walkPlantFrames(WALK_OFF)) if (p.f < DUR) out.push({ f: p.f, foot: p.side, phase: "leave" });
  return out.sort((a, b) => a.f - b.f);
})();
/** The father's last search step (he stops to look left and right): the end of the drum strokes (cue sheet M4). */
const FATHER_STOPS = (() => {
  const s = khadamSteps.filter((k) => k.phase !== "leave");
  return s.length ? s[s.length - 1].f : STOP_AT;
})();
const elderRunSteps = walkPlantFrames(RUN_OFF).filter((p) => p.f < DUR);

export const S01_EVENTS: SceneSoundEvent[] = [
  { id: "swat", f: SWAT_HIT, file: "sfx/ep02/clay_thud.wav", volume: 0.18 },
  ...khadamSteps.map((k, i) => ({
    id: `khadam_step_${i + 1}`,
    f: k.f,
    file: KHADAM_FILES[i % KHADAM_FILES.length],
    // off screen in P1 (nearer), in view in shots 2 and 3, fading as he leaves
    volume: k.phase === "leave" ? clamp(0.36 - 0.004 * (k.f - WALK_OFF.start), 0.15, 0.36) : k.f < P1[1] && k.f >= P1[0] ? 0.25 : 0.38,
    foot: k.foot,
    surface: "earth" as const,
    phase: k.phase,
  })),
  { id: "classmates_scatter", f: RUN_A + 2, file: "sfx/ep02/footsteps_mud.wav", volume: 0.15 },
  { id: "elder_dart", f: DART + 2, file: "sfx/ep02/footsteps_mud.wav", volume: 0.2 },
  { id: "child_sniff_1", f: SNIFF1, file: "sfx/ep06/child_sniff_1.wav", volume: 0.25 },
  { id: "child_sniff_2", f: SNIFF2, file: "sfx/ep06/child_sniff_1.wav", volume: 0.2 },
  { id: "elder_plead_rustle", f: PLEAD + 2, file: "sfx/ep02/cloth_rustle.wav", volume: 0.15 },
  { id: "elder_comes_out_rustle", f: SIDLE.a + 2, file: "sfx/ep02/cloth_rustle.wav", volume: 0.15 },
  { id: "elder_sheepish_rustle", f: SHEEP + 2, file: "sfx/ep02/cloth_rustle.wav", volume: 0.15 },
  ...(elderRunSteps.length ? [{ id: "elder_run_off", f: elderRunSteps[0].f, file: "sfx/ep02/footsteps_mud.wav", volume: 0.2 }] : []),
  { id: "glow_shimmer", f: GLOW_UP.a, file: "sfx/soft_magical_shimmer.wav", volume: 0.12 },
  // STO-22a re-cut: W1, K1, G1 life sounds (the sound agent maps the files)
  ...SLATE_TAPS.map((t, i) => ({ id: `slate_tap_${i + 1}`, f: t, file: "sfx/ep06/slate_tap.wav", volume: 0.15 })),
  { id: "slates_down", f: W1B + 2, file: "sfx/ep06/slate_tap.wav", volume: 0.15 },
  ...PLATE_TAPS.map((t, i) => ({ id: `plate_clink_${i + 1}`, f: t, file: "sfx/ep06/plate_clink.wav", volume: 0.2 })),
  { id: "hens_cluck_loop", f: W1A, file: "sfx/ep06/hens_cluck_loop.wav", volume: 0.15, loopFrames: CLACK1 + 3 - W1A },
  { id: "hens_scatter", f: CLACK1 + 3, file: "sfx/ep06/hens_scatter.wav", volume: 0.3 },
  { id: "crow_caw_1", f: CLACK1 + 4, file: "sfx/ep06/crow_caw.wav", volume: 0.3 },
  { id: "crow_takeoff", f: CLACK1 + 5, file: "sfx/ep06/crow_takeoff.wav", volume: 0.25 },
  { id: "crow_caw_2", f: CLACK1 + 13, file: "sfx/ep06/crow_caw.wav", volume: 0.22 },
  ...G1.chirps.map((t, i) => ({ id: `sparrow_chirp_${i + 1}`, f: t, file: "sfx/ep06/sparrow_chirp.wav", volume: 0.18 })),
];
/** Other scene-local real frames Episode06.tsx may want (cue sheet anchors S01.swat, S01.fatherStops, ...). */
export const S01_TIMES = {
  swat: SWAT_HIT,
  clack1: CLACK1,
  fatherStops: FATHER_STOPS,
  elderPeek: PEEK,
  elderPlead: PLEAD,
  lineStart: BALAK_VOICE_START,
  lineEnd: BALAK_VOICE_END,
  fatherLeaves: WALK_OFF.start,
  elderOut: SIDLE.a,
  elderRunOff: RUN_OFF.start,
  glow: GLOW_UP.a,
  glow1: GLOW_UP.a,
  w1a: W1A,
  w1b: W1B,
  plateTaps: PLATE_TAPS,
  slateTaps: SLATE_TAPS,
  hensClucks: [W1A, CLACK1 + 3] as const,
  hensScatter: CLACK1 + 3,
  crowCaw: CLACK1 + 4,
  crowTakeoff: CLACK1 + 5,
  k1Close: K1_CU.a,
  clack2: CLACK2,
  c1_brother: C1.brother,
  c1_father: C1.father,
  c1_push: C1.push,
  a1Glance: A1.a,
  g1: P3[0],
  sparrowChirps: G1.chirps,
  sparrowPeck: G1.peck,
  p1: P1[0],
  p2: P2[0],
  p3: P3[0],
  gapA: GA,
  gapB: GB,
  dur: DUR,
} as const;

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

const SUN: Lighting = { keySide: 1, rim: "#ffcf8a", rimStrength: 0.38, rimSide: 1 };

/** A soft contact shadow on the earth (StandingChild draws none). */
const Shadow: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <ellipse cx={x} cy={y + 1} rx={w} ry={w * 0.16} fill="#2a1a0c" opacity={0.28} />
);

/** A faint warm glow on the earth round Balak (restrained, steady; a touch more with the P3 beat). */
const GroundGlow: React.FC<{ id: string; x: number; y: number; s: number; glow: number }> = ({ id, x, y, s, glow }) => (
  <g>
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.36 * glow} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x + 10 * s} cy={y + 2} rx={150 * s} ry={24 * s} fill={`url(#${id})`} />
  </g>
);

/**
 * The P3 beat's extra light: a soft warm-white bloom behind the head (BAL-06, BAL-11), one smooth radial falloff with no
 * edge or ring, rising once over the beat (k 0..1) and then steady; nothing pulses.
 */
const BeatHalo: React.FC<{ id: string; x: number; y: number; r: number; k: number }> = ({ id, x, y, r, k }) =>
  k <= 0.001 ? null : (
    <g opacity={k}>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffaee" stopOpacity={0.85} />
          <stop offset="30%" stopColor="#fff4d8" stopOpacity={0.55} />
          <stop offset="62%" stopColor="#ffe9bc" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#ffe6b4" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </g>
  );

/** A school slate carried in a Puppet's hand, hanging from its top edge (the elder swinging it home, W1 a). */
const slateProp: PropRenderer = ({ worldRot, scale }) => {
  const u = 1.9 * scale; // figure units per cm (Puppet props: hand = 30 units, about 16 cm)
  return (
    <g transform={`rotate(${-worldRot})`}>
      <Slate x={0} y={9 * u} s={u / 2} turnY={0.55} seed={1} />
    </g>
  );
};
const ELDER_PROPS = { slate: slateProp };

/** Kitchen smoke rising from behind the hut's roof (the food is still cooking: the cause of the quarrel). Life clock. */
const KitchenSmoke: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 7 }, (_, k) => {
      const t = ((f + k * 19) % 133) / 133;
      const x = 1262 + 30 * t + 10 * Math.sin(t * 5 + k) + 70 * t * t;
      const y = 640 - 250 * t;
      return <circle key={k} cx={x} cy={y} r={14 + 46 * t} fill="#f2ece4" opacity={0.36 * Math.sin(Math.PI * Math.min(1, t * 1.15))} />;
    })}
  </g>
);

/** W1 a: the village lane at afternoon, the boys walking home with their slates, a hen and chicks crossing ahead. */
const LANE = VILLAGE.lane;
const LANE_ADULT = 1.15;
const laneK = (y: number) => LANE_ADULT * villageScaleAt(y);
const LANE_ELDER: WalkOpts = {
  start: W1A - 16,
  dur: (W1B - W1A) + 30,
  fromX: LANE.w1Elder[0].x - 70,
  toX: LANE.w1Elder[0].x + 280,
  scale: laneK(LANE.w1Elder[0].y),
  height: CAST.elderBrother.height,
  seed: CAST.elderBrother.seed,
  child: true,
  startIn: 1,
  stopIn: 1,
};
const LANE_BALAK = { x0: LANE.w1Balak[0].x - 60, x1: LANE.w1Balak[0].x + 230, y: LANE.w1Balak[0].y };
/** The track's zoom and the floor y at the bottom edge of the frame (the boys' shins: their feet stay out of frame). */
const LANE_ZOOM = 1.6;
const LANE_BOTTOM_Y = 946;
const laneCam = (lf: number): Cam => {
  const a = VILLAGE_CAMS.lane.laneTrackStart;
  const b = VILLAGE_CAMS.lane.laneTrackEnd;
  const u = 0.62 * EASE.inOut(clamp((lf - W1A + 6) / (W1B - W1A + 6)));
  const y = LANE_BOTTOM_Y - 540 - 540 / LANE_ZOOM;
  return villageKeepInSet("lane", { x: lerp(a.x, b.x, u) + 60, y, zoom: LANE_ZOOM, focus: 1, dof: 0, shake: 0 });
};
const LaneShot: React.FC<{ lf: number }> = ({ lf }) => {
  const cam = laneCam(lf);
  const ex = walkTravel(lf, LANE_ELDER).bodyX;
  const elderActingLane = (fr: number): Pose => {
    const w = walkPose(fr, LANE_ELDER);
    // the slate swings in the near hand, a little wider than the walk's own arm swing; a bored, hungry look ahead
    return { ...BASE_POSE, ...w, lProp: "slate", lHand: "hold", lS: (w.lS ?? 6) * 1.6, smile: 0.15, brow: 0.1, browTilt: -0.3, eyeY: 0.1 };
  };
  const bu = clamp((lf - W1A + 16) / (W1B - W1A + 30));
  const bx = lerp(LANE_BALAK.x0, LANE_BALAK.x1, bu);
  const bk = laneK(LANE_BALAK.y);
  const bob = 2.2 * Math.abs(Math.sin((lf + 3) * 0.3));
  const bs = EP06_CHILD_SCALE.standingBalak.s * bk;
  const lb: StandingChildProps = {
    x: bx,
    y: LANE_BALAK.y - bob,
    s: bs,
    headScale: EP06_CHILD_SCALE.standingBalak.headScale,
    build: "healthy",
    f: lf,
    lifeF: lf,
    age: 6,
    yaw: BALAK_YAW,
    pose: "holdOut",
    poseStart: -200,
    noteAt: { x: 46, y: -300 },
    noteW: 64,
    noteAngle: 0,
    expression: "serene",
    gaze: [{ at: { x: 150, y: -520 }, start: -100 }],
  };
  const lj = standingChildJoints(lb);
  const laneSlate = lj.note ? <Slate x={lj.note.anchor.x} y={lj.note.anchor.y + 6 * bs} s={(bs / PROP_REF.childS) * 1.15} rot={lj.note.angle} seed={2} /> : null;
  const hy = (lf: number) => lerp(LANE.pathLine.top + 2, LANE.pathLine.top + 24, clamp((lf - W1A + 20) / 80));
  const henPath = [
    { f: W1A - 20, x: LANE.w1Elder[0].x + 560, y: LANE.pathLine.top + 2 },
    { f: W1A + 60, x: LANE.w1Elder[0].x + 470, y: LANE.pathLine.top + 24, ease: "linear" as const },
  ];
  const items: Array<{ y: number; node: React.ReactNode }> = [
    {
      y: LANE_BALAK.y,
      node: (
        <g key="b">
          <BirulGlow cx={lj.glowAnchor.x} cy={lj.glowAnchor.y} r={155 * lj.headScale} glow={0.55} f={lf} />
          <StandingChild {...lb} layerMid={laneSlate} />
        </g>
      ),
    },
    {
      y: LANE.w1Elder[0].y,
      node: <Puppet key="e" cast={CAST.elderBrother} f={lf} lifeF={lf} x={ex} y={LANE.w1Elder[0].y} scale={laneK(LANE.w1Elder[0].y)} acting={elderActingLane} props={ELDER_PROPS} light={SUN} />,
    },
    {
      y: hy(lf),
      node: <HenFamily key="h" x={henPath[0].x} y={henPath[0].y} s={laneK(hy(lf))} lifeF={lf} seed={3} path={henPath} chicks={5} />,
    },
  ];
  items.sort((a, b) => a.y - b.y);
  return (
    <Stage cam={cam} background={VILLAGE_BG.afternoon}>
      <UjancharVillageField view="lane" time="afternoon" f={lf} cam={cam} floor={<>{items.map((it, i) => <React.Fragment key={i}>{it.node}</React.Fragment>)}</>} grade={false} />
      <Grade {...villageGrade("afternoon")} />
    </Stage>
  );
};

/** G1: Balak sitting on the veranda edge, a hand still at the small of his back, watching the sparrow, smiling. */
const SEAT_S = EP06_CHILD_SCALE.seatedBalak.s * 0.46;
const seatedProps = (lf: number): SeatedChildProps => {
  const settle = 1 - EASE.out(clamp((lf - G1.settle.a) / (G1.settle.b - G1.settle.a)));
  const smile = track(lf, [[G1.smile - 2, 0.1], [G1.smile + 14, 0.5]]);
  return {
    x: SEAT.x,
    y: SEAT.y - 7 * settle,
    s: SEAT_S,
    f: lf,
    lifeF: lf,
    design: "plate",
    age: 6,
    build: "healthy",
    pose: "handsTo",
    poseStart: -100,
    handTargets: { near: { x: -26, y: -42 } },
    handShapes: { near: "open" },
    face: { lookX: track(lf, [[G1.settle.a, 0.3], [G1.hops[0] + 6, 0.95]]), eyesDown: 0.55, smile },
    expression: lf >= G1.smile ? "compassionate" : "serene",
    prevExpression: "serene",
    expressionStart: G1.smile,
    sigh: (fr: number) => track(fr, [[G1.settle.b, 0], [G1.settle.b + 10, 1], [G1.settle.b + 30, 0]]),
  };
};

/** Props on the veranda edge (drawn in the people layer so they stay sharp in the close shots): two empty thalis, two slates. */
const PROP_S = (EP06_CHILD_SCALE.standingBalak.s * 0.46) / PROP_REF.childS;
const VerandaProps: React.FC = () => (
  <g>
    <Slate x={984} y={HUT.top + 5} s={PROP_S} tilt={0.38} yaw={-14} seed={1} />
    <BrassThali x={1026} y={HUT.top + 7} s={PROP_S} seed={0} />
    <BrassThali x={1068} y={HUT.top + 5} s={PROP_S} seed={1} />
    <Slate x={892} y={HUT.top + 6} s={PROP_S} tilt={0.38} yaw={10} seed={2} />
  </g>
);

/** G1: the light warming toward evening over the afterglow (a soft amber wash from the right, k 0..1). */
const EveningWarmth: React.FC<{ k: number }> = ({ k }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse 85% 100% at 95% 30%, rgba(255,170,80,0.34) 0%, rgba(255,140,70,0.12) 55%, rgba(0,0,0,0) 90%)",
      mixBlendMode: "screen",
      opacity: k,
    }}
  />
);

/** A low afternoon-gold wash from the right over the set and the people (as the Episode 5 glimpse). */
const LowGold: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse 75% 95% at 100% 38%, rgba(255,186,96,0.26) 0%, rgba(255,160,80,0.08) 50%, rgba(0,0,0,0) 85%)",
      mixBlendMode: "screen",
    }}
  />
);

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene01SavingElderBrother: React.FC = () => {
  const { lifeF } = useStory6(SCENE_ID);
  const lf = lifeF;
  const uid = "s601" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const cam = keep({ ...camOf(framingAt(lf)), focus: D, dof: 0, shake: 0 });
  if (lf < W1B) {
    // W1 a: the lane
    return (
      <div style={{ position: "absolute", inset: 0, background: VILLAGE_BG.afternoon, overflow: "hidden" }}>
        <LaneShot lf={lf} />
      </div>
    );
  }
  const inG1 = shotAt(lf).name === "G1 veranda";

  /* ---- Balak ---- */
  const bp = balakProps(lf);
  const bj = standingChildJoints(bp);
  const glow = glowAt(lf);
  const sp = seatedProps(lf);
  const sh = seatedChildHands(sp);
  const seatedNode = (
    <g key="seated">
      <BeatHalo id={`${uid}-beat2`} x={sh.glowAnchor.cx} y={sh.glowAnchor.cy} r={sh.glowAnchor.r * 1.15} k={beatAt(lf)} />
      <BirulGlow cx={sh.glowAnchor.cx} cy={sh.glowAnchor.cy} r={sh.glowAnchor.r} glow={glow} f={lf} />
      <SeatedChild {...sp} />
    </g>
  );
  const sparrowNode = (
    <Sparrow
      key="sparrow"
      x={SPARROW0.x}
      y={SPARROW0.y}
      s={0.46}
      flip
      lifeF={lf}
      seed={4}
      hopAt={G1.hops}
      hopLen={7}
      tiltAt={[G1.tilt]}
      peckAt={[G1.peck, G1.peck + 14]}
      grain={{ x: GRAIN_X }}
      eatAt={G1.peck}
      auto={false}
    />
  );
  const balakNode = inG1 ? seatedNode : (
    <g key="balak">
      <Shadow x={BALAK.x + 6 * BALAK_S} y={BALAK.y} w={70 * BALAK_S} />
      <GroundGlow id={`${uid}-gg`} x={BALAK.x} y={BALAK.y} s={BALAK_S} glow={glow} />
      <BeatHalo id={`${uid}-beat`} x={bj.glowAnchor.x} y={bj.glowAnchor.y} r={165 * bj.headScale} k={beatAt(lf)} />
      <BirulGlow cx={bj.glowAnchor.x} cy={bj.glowAnchor.y} r={155 * bj.headScale} glow={glow} f={lf} />
      <StandingChild {...bp} />
    </g>
  );

  /* ---- the father (soft in his own layer in the P2 insert: the elder behind him is the subject) ---- */
  const inInsert = shotAt(lf).name === "P2 insert";
  const fp = fatherPlace(lf);
  const fatherNode = (
    <Puppet
      key="father"
      cast={CAST.surendra}
      f={lf}
      lifeF={lf}
      x={fp.x}
      y={fp.y}
      scale={fp.k}
      acting={fatherActing}
      mouth={fatherMouth}
      light={{ ...SUN, brightness: fatherBright(lf) }}
      footwear={wearsKhadam(lf) ? "khadam" : undefined}
      reachAt={balakChestAt}
      breathRate={lf > GA && lf < GA + 40 ? 1.3 : 1}
    />
  );
  const khadamS = khadamLengthPx(CAST.surendra, K(KHADAM.y)) / 52;
  const restingKhadam = wearsKhadam(lf) ? null : <KhadamPair key="khadam" x={KHADAM.x} y={KHADAM.y + 2} s={khadamS} />;

  /* ---- the elder ---- */
  const ep = elderPlace(lf);
  const elderPuppet = (
    <Puppet
      cast={CAST.elderBrother}
      f={lf}
      lifeF={lf}
      x={ep.x}
      y={ep.y}
      scale={ep.k}
      acting={elderActing}
      mouth={elderMouth}
      light={SUN}
      pointAt={balakHeadAt}
      swatAt={balakBackAt}
      breathRate={elderBreath(lf)}
    />
  );
  const showElder = lf < RUN_OFF.start + RUN_OFF.dur;
  // behind the corner he is a little further than the courtyard: drawn first, a touch soft, clipped by the hut
  const elderNode = !showElder || ep.clip ? null : <g key="elder">{elderPuppet}</g>;
  const hiddenElder = showElder && ep.clip ? <g clipPath={`url(#${uid}-corner)`}>{elderPuppet}</g> : null;

  /* ---- the classmates ---- */
  const showBoys = lf < RUN_B + 34;
  const boyA = (
    <Puppet key="boyA" cast={CAST.villageBoyA} f={lf} lifeF={lf + 31} x={boyX(BOY_A.x, RUN_OPTS_A, lf)} y={BOY_A.y} scale={K(BOY_A.y)} acting={boyActing(BOY_A_KEYS, RUN_OPTS_A)} light={SUN} breathRate={lf > STARTLE ? 1.8 : 1} />
  );
  const boyB = (
    <Puppet key="boyB" cast={CAST.villageBoyB} f={lf} lifeF={lf + 57} x={boyX(BOY_B.x, RUN_OPTS_B, lf)} y={BOY_B.y} scale={K(BOY_B.y)} acting={boyActing(BOY_B_KEYS, RUN_OPTS_B)} light={SUN} breathRate={lf > STARTLE ? 1.8 : 1} />
  );

  /* ---- village life: the hens by the fence and the crow on its rail (they scatter / lift off at the first clack) ---- */
  const hens = lf < CLACK1 + 70 ? (
    <HenFamily key="hens" x={HENS.x} y={HENS.y} s={K(HENS.y)} flip lifeF={lf} seed={7} chicks={4} scatterAt={CLACK1 + 3} scatterDir={1} scatterDy={-6} />
  ) : null;
  const crow = lf < CLACK1 + 60 ? (
    <Crow key="crow" x={CROW.x} y={CROW.y} s={0.46} flip lifeF={lf} seed={2} cawAt={[CLACK1 + 2, CLACK1 + 11]} takeOffAt={CLACK1 + 5} takeOffDir={1} />
  ) : null;

  /* ---- depth order: far (small y) first ---- */
  const items: Array<{ y: number; node: React.ReactNode }> = [
    { y: CROW.y, node: inG1 ? null : crow },
    { y: HUT.top, node: <VerandaProps key="vprops" /> },
    { y: HUT.top + 9, node: inG1 ? sparrowNode : null },
    { y: KHADAM.y - 1, node: restingKhadam },
    { y: HENS.y, node: inG1 ? null : hens },
    { y: fp.y, node: inInsert || inG1 ? null : fatherNode },
    { y: ep.y, node: inG1 ? null : elderNode },
    { y: inG1 ? SEAT.y + 1 : BALAK.y, node: balakNode },
  ];
  if (showBoys && !inG1) {
    items.push({ y: BOY_A.y, node: boyA });
    items.push({ y: BOY_B.y, node: boyB });
  }
  items.sort((a, b) => a.y - b.y);

  /** Everything right of the wall's end and the plinth's end (and all below the plinth's foot): the corner hides the rest. */
  const cornerClip = `M ${WALL_END} -3000 L 6000 -3000 L 6000 4000 L -3000 4000 L -3000 ${HUT.bottom} L ${PLINTH_END} ${HUT.bottom} L ${PLINTH_END} ${HUT.top} L ${WALL_END} ${HUT.top} Z`;

  return (
    <div style={{ position: "absolute", inset: 0, background: UJANCHAR_BG.dawn, overflow: "hidden" }}>
      <Stage cam={cam} background={UJANCHAR_BG.dawn}>
        <UjancharBackdrop f={lf} time="dawn" cam={cam} />
        <Layer depth={D} extraBlur={4}>
          <KitchenSmoke f={lf} />
        </Layer>
        <Layer depth={D} extraBlur={0.9 / Math.pow(cam.zoom, D)}>
          <defs>
            <clipPath id={`${uid}-corner`} clipPathUnits="userSpaceOnUse">
              <path d={cornerClip} />
            </clipPath>
          </defs>
          {hiddenElder}
        </Layer>
        <Layer depth={D}>
          {items.map((it, i) => (
            <React.Fragment key={i}>{it.node}</React.Fragment>
          ))}
        </Layer>
        {inInsert && (
          <Layer depth={D} extraBlur={0.75}>
            {fatherNode}
          </Layer>
        )}
        <UjancharLightLayer f={lf} time="dawn" level={0.5} />
        <LowGold />
        {inG1 && <EveningWarmth k={EASE.inOut(clamp((lf - P3[0]) / (P3[1] - P3[0])))} />}
        <Grade {...ujancharGrade("dawn")} />
      </Stage>
    </div>
  );
};
