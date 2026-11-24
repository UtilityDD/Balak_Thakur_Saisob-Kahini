import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp, EASE, lerp, makeActing, PoseKey, track } from "../../cinematic/core/anim";
import { Cam, Stage } from "../../cinematic/core/Stage";
import { CAST } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../../cinematic/rig/lipsync";
import {
  aratiCircle,
  BASE_POSE,
  headNods,
  Lighting,
  offerFlick,
  Pose,
  PropRenderer,
  Puppet,
  ringBell,
} from "../../cinematic/rig/Puppet";
import {
  BrassBell,
  BrassLamp,
  Conch,
  DhoopDani,
  GreenCoconut,
  ThakurGhar,
  thakurGharKeepInSet,
  VedicShrineVeranda,
  vedicVerandaKeepInSet,
  VhdDefs,
} from "../../cinematic/sets/VedicHouseDay";
import { clipSpan4, gapsFor4, pausesFor4, storyToReal, useStory4 } from "../../episode/storyClock";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import {
  DRINK_BOWL_AT,
  DRINK_BOWL_T,
  HELD_OBJECT_BOTTOM,
  HeldObjectArt,
  SeatedChild,
  seatedChildHands,
  sighCurve,
} from "../../episode03/rig/SeatedChild";
import { EP04_SCENES } from "../timing";

/**
 * Episode 4, scene 03 (03_coconut_water_abhishek): the coconut water (book chapter 7, "বিগ্রহ অভিষেকের সময় ভোগের
 * নারিকেলোদক পান"). Approved plan STO-19, Ep04_Shots_and_Pauses_DRAFT.md "Scene 03".
 *
 * The family shrine room of the Vedic house on the day of a special abhishek. Thakurma has just gone inside; Balak
 * (about five, forbidden to enter) sits on the veranda by the shrine door, watching the priest (Bhagabati Thakur,
 * cast `bhagabati`, caption পুরোহিত ঠাকুর). The priest calls "ধুপ! ধুপ কই?" and nobody answers. Then, WORDLESS (action
 * gap AG2, keyed to its beats): (a) Balak brings the dhoop and holds it in at the threshold; the priest takes it
 * without looking and nods "hun hun"; (b) Balak asks by gesture to sit inside and the priest nods again; (c) he is
 * inside, seated by the offerings, looking about carefully, and his eyes stop on the big stone bowl of coconut water
 * with the whole fopra; (d) while the priest, eyes closed, offers "এতে গন্ধে পুষ্পে" and rings his bell, Balak lifts
 * the bowl and drinks it all in one draught and sets it back with the fopra in it. P2 holds him content. Then his
 * line, innocent and matter-of-fact, and the priest's face turns from busy to astonished (no shouting, no crowd:
 * STO-19 leaves them out). No glow beat in this scene; nothing on any idol or prop glows (BAL-05).
 *
 * Clocks (src/episode/storyClock.ts, EP04_PAUSES and EP04_GAPS): every key below is a STORY anchor (a voice clip, a
 * pause, an AG2 beat) converted to the real local frame with storyToReal, and the figures run on the real frame.
 * Nothing is keyed inside a pause except what the approved pause table draws there (P1: the priest waits and glances
 * at the empty doorway; P2: Balak settles back, content, the bowl set down; P3: the priest's astonishment), so the
 * story still waits in every pause while breathing, blinks and the lamp flames go on. The drink spans the end of beat
 * d into P2 only with its settle (hands back to the lap), as P2's picture says. The fade-in from the chapter break
 * and the fade-out into the outro are drawn by Episode04.tsx on the Sequence's real frame.
 *
 * Shots (hard cuts, held frames, no moves; CAM-13: a speaker's close-up 6 to 8 frames before the voice):
 *   1 WIDE        AG1 (open, 2.5 s): the veranda and the shrine door; through it the priest at the rite, ringing his
 *                 bell; Thakurma steps out with an empty brass tray and walks off into the house; Balak alone on the
 *                 veranda by the door, watching inside.
 *   2 PRIEST_MED  7 f before "ধুপ!": inside, the priest looks up and calls toward the door, hand out; P1 holds him
 *                 waiting, glancing at the empty doorway.
 *   3 VERANDA_MED AG2 a + b: Balak picks up the dhoop-dani, kneels up at the threshold and holds it in; the priest's
 *                 hand comes back and takes it without his looking; two nods; Balak points inside (asking), a nod.
 *   4 INSIDE_WIDE AG2 c: a time cut across the threshold: Balak seated by the offerings, looking about; his eyes stop
 *                 on the bowl.
 *   5 TWO_DRINK   AG2 d + P2: the priest, eyes closed, offering and ringing; Balak drinks the bowl in one draught and
 *                 sets it back; P2 he sits back, content.
 *   6 BALAK_MCU   7 f before "ঠাকুরমশায়,".
 *   7 TWO_SHOT    on "আপনার ঠাকুর": the priest opens his eyes and turns to him; Balak shows the deities' khat.
 *   8 BOWL_CLOSE  on "ফোপড়াটা": the bowl, empty but for the fopra, his small open hand presenting it.
 *   9 TWO_REACT   P3 (end): the priest looks from the bowl to the boy and back, reddening, mouth falling open, his bell
 *                 hand dropping; Balak smiles innocently. Then the series fade into the outro.
 *
 * Sound events for Episode04.tsx: see S03_SOUND_EVENTS (story frames) at the end of this file.
 */

const SCENE_ID = "03_coconut_water_abhishek";
const SCENE = EP04_SCENES.find((s) => s.sceneId === SCENE_ID) ?? { sceneId: SCENE_ID, startFrame: 2090, durationFrames: 615 };
const DUR = SCENE.durationFrames;
const PAUSES = pausesFor4(SCENE_ID);

/* ------------------------------------------------------------------ */
/* Story anchors -> real local frames                                   */
/* ------------------------------------------------------------------ */

/** Story frame -> real local frame (pauses before it added; story frames include the action gaps). */
const R = (story: number): number => storyToReal(story, PAUSES);
/** Real local window of pause i (sorted by atStory), with fallbacks. */
const pauseReal = (i: number, fbStory: number, fbFrames: number): [number, number] => {
  const p = PAUSES[i];
  const s = R(p ? p.atStory : fbStory);
  return [s, s + (p ? p.frames : fbFrames)];
};
/**
 * Story frame -> real local frame AFTER any pause held at that very story frame (storyToReal gives the pause's start
 * for a frame equal to its atStory; AG2 begins where P1 ends).
 */
const Rafter = (story: number): number => story + PAUSES.filter((p) => p.atStory <= story).reduce((a, p) => a + p.frames, 0);
/** Real local start of an AG2 beat, with a fallback story frame. */
const beatReal = (id: string, fbStory: number): number => {
  for (const g of gapsFor4(SCENE_ID)) {
    const b = g.beats.find((x) => x.id === id);
    if (b) return Rafter(b.fromStory);
  }
  return Rafter(fbStory);
};
/** Real local start of a voice clip. */
const clipLocal = (file: string, fb: number): number => {
  const c = clipSpan4(file);
  return c ? c.startFrame - SCENE.startFrame : fb;
};

const CALL = clipLocal("03a_Bhagabati_Dhoop.wav", 60);
const LINE = clipLocal("03b_Toddler_Coconut.wav", 348);
/** Voice onsets inside the clips (measured from the played 48 kHz files, -45 dB silences; frames at 24 fps). */
const V = {
  dhoop1: CALL + 2, // "ধুপ!"
  dhoop2: CALL + 24, // "ধুপ কই?"
  callEnd: CALL + 42,
  thakur: LINE + 2, // "ঠাকুরমশায়,"
  apnar: LINE + 32, // "আপনার ঠাকুর তো মুখ দিয়ে খায় না—"
  tai: LINE + 89, // "তাই আমি নারকেলের জলটা খেয়ে"
  fopra: LINE + 128, // "ফোপড়াটা"
  or: LINE + 149, // "ওর জন্য রেখে দিয়েছি!"
  lineEnd: LINE + 186,
};
const P1 = pauseReal(0, 109, 24);
const P2 = pauseReal(1, 289, 24);
const P3 = pauseReal(2, 505, 48);
const B = {
  a: beatReal("a_dhoop", 109),
  b: beatReal("b_ask", 181),
  c: beatReal("c_inside", 217),
  d: beatReal("d_drink", 241),
};

/* ------------------------------------------------------------------ */
/* Lip sync (real voice envelopes)                                      */
/* ------------------------------------------------------------------ */

/** Per-frame RMS envelopes (24 fps, 0..1) of public/audio/ep04/03a and 03b. */
const ENV: Record<string, number[]> = {
  "03a_Bhagabati_Dhoop.wav": [0,0,0.23,0.27,0.75,0.83,0.91,0.81,0.48,0.06,0,0.08,0,0,0,0,0,0,0,0,0,0,0,0,0.22,0.44,0.31,0.18,0.33,0.52,1,0.97,0.3,0,0,0.27,0.77,0.57,0.54,0.32,0.2,0.08,0,0,0,0,0,0,0,0],
  "03b_Toddler_Coconut.wav": [0,0,0.07,0.11,0.51,0.59,0.22,0.16,0.53,0.61,0.5,0.5,0.54,0.61,0.36,0.17,0.13,0.65,0.49,0.45,0.26,0,0,0,0,0,0,0,0,0,0,0,0.42,0.67,0.46,0.22,0,0,0.32,0.36,0.43,0.21,0,0.13,0.1,0.43,0.28,0.1,0,0.19,0.48,0.31,0,0.07,0.57,0.42,0.16,0.19,0.86,0.9,0.51,0.28,0.5,0.26,0.96,0.73,0.78,0.27,0.08,0.12,0.23,0.48,0.33,0.25,0.19,0.16,0.16,0.09,0,0,0,0,0,0,0.07,0.06,0,0,0,0.5,0.69,0.78,0.62,0.66,0.46,0.38,0.42,0.34,0.38,0.35,0.42,0.32,0.39,0.4,0.09,0,0.08,0.44,0.3,0.41,0.59,0.45,0.21,0.21,0.23,0.64,0.5,0.47,0.46,0.3,0,0.26,0.46,0.26,0,0.09,0,0.27,0.48,0.54,0.56,0.45,0.35,0.17,0,0,0,0,0,0,0,0,0.09,0,0.54,0.38,0.28,0,0.06,0.46,0.76,0.78,0.58,0,0.59,0.8,0.9,0.94,0.92,0.78,0.68,0.45,0.25,0.82,0.58,0.53,0.76,1,0.54,0.96,0.88,0.61,0.13,0.72,0.81,0.26,0.31,0.3,0.43,0.61,0.17,0.14,0.15,0.29,0.14,0,0,0,0,0,0,0,0,0,0,0],
};
const TEXT: Record<string, string> = {
  "03a_Bhagabati_Dhoop.wav": "ধুপ! ধুপ কই?",
  "03b_Toddler_Coconut.wav": "ঠাকুরমশায়, আপনার ঠাকুর তো মুখ দিয়ে খায় না— তাই আমি নারকেলের জলটা খেয়ে ফোপড়াটা ওর জন্য রেখে দিয়েছি!",
};
const voiceAt = (file: string, local: number) => {
  const span = clipSpan4(file);
  if (!span) return null;
  const abs = SCENE.startFrame + local;
  for (const p of span.parts) {
    if (abs >= p.startFrame && abs < p.startFrame + p.frames) return { env: ENV[file], rel: abs - p.startFrame, text: TEXT[file] };
  }
  return null;
};
/** Phrase-level speech envelope (on while any frame within 6 is voiced), so the rigs do not blink at every syllable gap. */
const talkOf = (file: string, level: number) => (lf: number): number => {
  for (let k = -6; k <= 6; k++) {
    const v = voiceAt(file, lf + k);
    if (v && speechLevel(v.env, v.rel) > 0.06) return level;
  }
  return 0;
};
const priestMouth = (lf: number): MouthState => {
  const v = voiceAt("03a_Bhagabati_Dhoop.wav", lf);
  return v ? visemeFromEnvelope(v.env, v.rel, 23, v.text) : MOUTH_REST;
};
const priestTalk = talkOf("03a_Bhagabati_Dhoop.wav", 0.7);
const balakMouth = (lf: number): number => {
  const v = voiceAt("03b_Toddler_Coconut.wav", lf);
  return v ? clamp(visemeFromEnvelope(v.env, v.rel, 17, v.text).open * 0.9, 0, 0.9) : 0;
};
const balakTalk = talkOf("03b_Toddler_Coconut.wav", 1);

/* ------------------------------------------------------------------ */
/* Layout                                                               */
/* ------------------------------------------------------------------ */

/**
 * Veranda (VedicShrineVeranda, plane 1.0): Balak seated left of the door, the dhoop-dani by the left jamb.
 * BAL-26b: in the plate design at five his head is about 85% of Thakurma's (the adult Puppet beside him in the wide;
 * the delivered classic head was about 99%), so he is drawn at 1.08 (was 1.3) and sits a little nearer the door (and
 * further up the veranda) so he can still hand the dhoop in at chest height without his raised arm crossing his face.
 */
const BV = { x: 720, y: 928, s: 1.08 };
const DHOOP_V = { x: 795, y: 892 };
/** The priest seen through the door (0.9 plane), just inside it, turned three-quarters toward the khat. */
const PV = { x: 1000, y: 822, s: 0.74 };
/** Thakurma steps out of the door and walks off to the right along the veranda. */
const TH_S = 1.18;
const TH_Y = 932;

/** Shrine room (ThakurGhar, plane 1.0): the priest on his asana facing the khat, Balak by the stone bowl, facing him. */
const PG = { x: 850, y: 940, s: 1.22 };
/**
 * BAL-26b: 0.97 (was 1.12) so his plate head is about 85% of the priest's (the delivered classic head was about 97%);
 * a little left so the bowl (which scales with him) keeps its place on the floor.
 */
const BI = { x: 1223, y: 1004, s: 0.97 };
/** Shot framings on him scale with him: the delivered MCU and bowl close-up kept in his own figure units. */
const BI_OLD = { x: 1236, y: 1004, s: 1.12 };
const onBalak = (cx: number, cy: number, z: number) => ({
  cx: BI.x + ((cx - BI_OLD.x) * BI.s) / BI_OLD.s,
  cy: BI.y + ((cy - BI_OLD.y) * BI.s) / BI_OLD.s,
  z: (z * BI_OLD.s) / BI.s,
});
const MCU = onBalak(1280, 770, 2.6);
const BOWL_CLOSE = onBalak(1180, 930, 2.6);
/**
 * The big stone bowl where Balak's drinkBowl takes it from and sets it back (his default reachAt DRINK_BOWL_AT,
 * flipped): the same bowl (the shared stoneBowlArt) on the floor, in his hands and in the close-up.
 */
const BOWL_AT = { x: BI.x - DRINK_BOWL_AT.x * BI.s, y: BI.y + DRINK_BOWL_AT.y * BI.s };
/** Set dressing moved from the set's defaults so nothing stands behind or under Balak (the lamp's flame never sits over his head). */
const COCO_A = { x: 1078, y: 968 };
const COCO_B = { x: 1046, y: 990 };
const LAMP = { x: 1462, y: 848 };
/** BAL-26b: the conch on its stand (set default x 1196) would stand right behind the smaller Balak's head; moved to the back right, between the ghot and the lamp. */
const CONCH = { x: 1425, y: 900 };

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

type SetId = "veranda" | "ghar";
interface Shot {
  from: number;
  set: SetId;
  cx: number;
  cy: number;
  z: number;
}
const SHOTS: Shot[] = [
  { from: -Infinity, set: "veranda", cx: 880, cy: 650, z: 1.2 }, // 1 WIDE (AG1)
  { from: V.dhoop1 - 7, set: "ghar", cx: 860, cy: 760, z: 1.6 }, // 2 PRIEST_MED
  { from: B.a, set: "veranda", cx: 850, cy: 730, z: 1.75 }, // 3 VERANDA_MED (AG2 a, b)
  { from: B.c, set: "ghar", cx: 1060, cy: 610, z: 1.12 }, // 4 INSIDE_WIDE (AG2 c)
  { from: B.d, set: "ghar", cx: 1075, cy: 780, z: 1.72 }, // 5 TWO_DRINK (AG2 d, P2)
  { from: V.thakur - 7, set: "ghar", ...MCU }, // 6 BALAK_MCU
  { from: V.apnar - 2, set: "ghar", cx: 1040, cy: 760, z: 1.55 }, // 7 TWO_SHOT
  { from: V.fopra - 2, set: "ghar", ...BOWL_CLOSE }, // 8 BOWL_CLOSE (the bowl above y 820)
  { from: P3[0], set: "ghar", cx: 1040, cy: 750, z: 1.62 }, // 9 TWO_REACT (P3)
];
const shotAt = (lf: number): Shot => {
  let k = 0;
  for (let i = 0; i < SHOTS.length; i++) if (lf >= SHOTS[i].from) k = i;
  return SHOTS[k];
};
const camOf = (s: Shot): Cam => {
  const c: Cam = { x: s.cx - 960, y: s.cy - 540, zoom: s.z, focus: 1, dof: 0.6, shake: 0 };
  return s.set === "veranda" ? vedicVerandaKeepInSet(c) : thakurGharKeepInSet(c);
};

/* ------------------------------------------------------------------ */
/* Balak (SeatedChild): one timeline across both places                  */
/* ------------------------------------------------------------------ */

/**
 * The drink is the rig's self-timed drinkBowl (DRINK_BOWL_T, 73 rig frames). It is played a little quicker (64 real
 * frames) so the lift, the one long draught and the set-down all fit inside beat d and the bowl is back on the floor
 * before P2; only the hands' return to the lap runs into P2 (P2's picture: he sits back, content). The child's rig
 * clock `cc` is the real local frame with that warp inside the drink, so every pose start is cc(realFrame).
 */
const DRINK_AT = B.d - 9;
const DRINK_REAL = 64;
const DRINK_WARP: Array<[number, number]> = [
  [0, 0],
  [10, DRINK_BOWL_T.grip],
  [20, DRINK_BOWL_T.lift],
  [38, DRINK_BOWL_T.drinkEnd],
  [48, DRINK_BOWL_T.lower],
  [52, DRINK_BOWL_T.release],
  [DRINK_REAL, DRINK_BOWL_T.back],
];
const warp = (t: number): number => {
  for (let i = 0; i < DRINK_WARP.length - 1; i++) {
    const [a0, b0] = DRINK_WARP[i];
    const [a1, b1] = DRINK_WARP[i + 1];
    if (t <= a1) return lerp(b0, b1, clamp((t - a0) / (a1 - a0)));
  }
  return DRINK_BOWL_T.back;
};
const cc = (lf: number): number =>
  lf < DRINK_AT ? lf : lf < DRINK_AT + DRINK_REAL ? DRINK_AT + warp(lf - DRINK_AT) : lf + (DRINK_BOWL_T.back - DRINK_REAL);
/** Real frame at which the bowl is set down (the rig's release). */
const BOWL_DOWN = DRINK_AT + 52;

type ChildProps = React.ComponentProps<typeof SeatedChild>;
type ChildPose = NonNullable<ChildProps["pose"]>;
type Expr = NonNullable<ChildProps["expression"]>;
interface ChildSeg {
  at: number; // real local frame
  pose: ChildPose;
  kneel?: number;
  holding?: ChildProps["holding"];
  reachFor?: ChildProps["reachFor"];
  reachAt?: { x: number; y: number };
  pointAt?: { x: number; y: number };
  expr?: Expr;
  /** A time cut lands on this segment: no blend from the previous one (he is already seated inside). */
  cut?: boolean;
}

/** Dhoop-dani on the veranda floor, as a kneelReach target (its grip centre, figure units). */
const DHOOP_REACH = { x: (DHOOP_V.x - BV.x) / BV.s, y: (DHOOP_V.y - BV.y) / BV.s - HELD_OBJECT_BOTTOM.incense };
/**
 * Where he holds it in at the threshold (figure units): into the door opening, at the priest's hand. Kept at the
 * delivered world point (the priest's hand), whatever his scale.
 */
const OFFER_WORLD = { x: 868, y: 745 };
const OFFER_AT = { x: (OFFER_WORLD.x - BV.x) / BV.s, y: (OFFER_WORLD.y - BV.y) / BV.s };
const PICK = B.a + 8;
const OFFER = PICK + 28;
const HANDOVER = OFFER + 22;
const ASK = B.b + 2;

const CHILD: ChildSeg[] = [
  { at: -1000, pose: "sitCross", expr: "serene" },
  // (a) he picks the dhoop-dani up from beside the door ...
  { at: PICK, pose: "kneelReach", reachFor: "incense", reachAt: DHOOP_REACH, expr: "serene" },
  { at: PICK + 26, pose: "kneelReach", holding: "incense", reachAt: DHOOP_REACH, expr: "serene" },
  // ... and kneels up at the threshold, holding it in with both hands
  { at: OFFER, pose: "offerUp", kneel: 2, holding: "incense", reachAt: OFFER_AT, expr: "serene" },
  // the priest has it: his hands come back to his thighs, still kneeling
  { at: HANDOVER + 4, pose: "sitCross", kneel: 1, expr: "serene" },
  // (b) asking to sit inside: an open palm toward the room, brows up
  { at: ASK, pose: "pointIn", kneel: 1, pointAt: { x: 190, y: -150 }, expr: "playful" },
  { at: B.b + 26, pose: "sitCross", kneel: 1, expr: "joyful" },
  // (c) inside, seated by the offerings (a time cut), looking about
  { at: B.c, pose: "sitCross", kneel: 0, expr: "thoughtful", cut: true },
  // (d) the drink: lift, one long draught, set back with the fopra in it
  { at: DRINK_AT, pose: "drinkBowl", expr: "serene" },
  { at: DRINK_AT + DRINK_REAL, pose: "sitCross", expr: "joyful" },
  // his line: sweet and matter-of-fact
  { at: V.thakur - 4, pose: "sitCross", expr: "serene" },
  { at: V.apnar - 2, pose: "pointIn", pointAt: { x: -150, y: -210 }, expr: "serene" },
  { at: V.tai - 2, pose: "sitCross", expr: "serene" },
  { at: V.fopra - 8, pose: "pointIn", pointAt: { x: DRINK_BOWL_AT.x - 8, y: DRINK_BOWL_AT.y - 26 }, expr: "playful" },
  { at: V.lineEnd - 4, pose: "sitCross", expr: "joyful" },
];

const childAt = (lf: number) => {
  let k = 0;
  for (let i = 0; i < CHILD.length; i++) if (lf >= CHILD[i].at) k = i;
  const cur = CHILD[k];
  const prev = k > 0 ? CHILD[k - 1] : undefined;
  // kneel blends over 14 frames from the previous segment's
  const kPrev = prev?.kneel ?? 0;
  const kCur = cur.kneel ?? 0;
  const kneel = cur.cut ? kCur : lerp(kPrev, kCur, EASE.inOut(clamp((lf - cur.at) / 14)));
  return {
    pose: cur.pose,
    prevPose: prev && !cur.cut && prev.pose !== cur.pose ? prev.pose : undefined,
    poseStart: cc(cur.at),
    prevPoseStart: prev ? cc(prev.at) : undefined,
    kneel,
    holding: cur.holding,
    reachFor: cur.reachFor,
    reachAt: cur.reachAt,
    pointAt: cur.pointAt,
    expression: cur.expr,
    prevExpression: cur.cut ? undefined : prev?.expr,
    expressionStart: cc(cur.at),
  };
};

/** Where he looks (lookX -1..1, eyesDown 0..1), keyed per beat; the rig adds saccades and blinks on lifeF. */
const childFace = (lf: number): NonNullable<ChildProps["face"]> => {
  const inside = lf >= B.c;
  if (!inside) {
    // veranda (facing right, the door to his right): watching inside, a glance at Thakurma as she passes
    const lookX = track(lf, [
      [0, 0.55],
      [14, 0.75],
      [40, 0.9],
      [54, 0.55],
      [B.a, 0.55],
      [PICK - 2, 0.35],
      [OFFER, 0.75],
      [HANDOVER + 6, 0.6],
    ]);
    const eyesDown = track(lf, [
      [B.a, 0],
      [PICK - 2, 0.55],
      [PICK + 20, 0.4],
      [OFFER + 8, 0],
    ]);
    return { lookX, eyesDown, smile: 0.5 };
  }
  // inside (facing left, toward the priest): looking about the room, then the bowl; to the priest for his line
  const lookX = track(lf, [
    [B.c, -0.6],
    [B.c + 8, -0.3],
    [B.c + 14, 0.2],
    [DRINK_AT, 0.2],
    [BOWL_DOWN + 6, 0.2],
    [P2[1], 0.45],
    [V.thakur - 6, 0.8],
    [V.fopra - 10, 0.8],
    [V.fopra - 2, 0.3],
    [V.lineEnd, 0.8],
  ]);
  const eyesDown = track(lf, [
    [B.c, 0],
    [B.c + 10, 0.1],
    [B.c + 16, 0.6],
    [DRINK_AT, 0.5],
    [P2[0], 0.1],
    [V.fopra - 10, 0],
    [V.fopra - 2, 0.55],
    [V.or + 10, 0.2],
    [V.lineEnd, 0],
  ]);
  return { lookX, eyesDown, smile: 0.55 };
};

/** A content breath as he sits back in P2 (MOT-20: a sigh for relief). */
const BALAK_SIGH = sighCurve(cc(P2[0] + 2), 22, 40);

/* ------------------------------------------------------------------ */
/* The priest (Puppet `bhagabati`)                                      */
/* ------------------------------------------------------------------ */

const PRIEST = CAST.bhagabati;
/**
 * Seated cross-legged, turned three-quarters toward the khat (screen right). Near arm l (camera side), far arm r.
 * Real local frames throughout (see the header: each key sits on a story anchor; the pauses get only their planned
 * picture).
 */
const BUSY: Partial<Pose> = {
  bodyTurn: 0.5,
  headTurn: 0.2,
  headNod: 5,
  lid: 0.45,
  eyeX: 0.4,
  eyeY: 0.5,
  smile: 0.2,
  brow: 0,
  rS: 34,
  rE: 46,
  rHand: "relaxed",
  lS: 10,
  lE: 70,
  lHand: "relaxed",
  rProp: "",
  lProp: "",
  flush: 0,
  gasp: 0,
};
const TAKE = HANDOVER - 8;
const PRIEST_KEYS: PoseKey<Pose>[] = [
  // AG1: ringing the bell (near hand) at the rite, eyes on the deities
  { f: 0, ...BUSY, lProp: "bell", lHand: "hold", lS: 20, lE: 80 },
  { f: 50, lS: 20, lE: 80 },
  // the call: he looks up from the rite toward the door, the bell set down, the near hand out to the door
  { f: V.dhoop1 - 6, in: 8, ease: "inOut", lProp: "", lHand: "relaxed", lS: 10, lE: 60, headTurn: -0.35, headNod: 0, lid: 0.1, eyeX: -0.7, eyeY: 0, brow: 0.4 },
  { f: V.dhoop1 + 4, in: 10, lS: 62, lE: 22, lHand: "open", brow: 0.55 },
  { f: V.dhoop2, in: 6, headTurn: -0.45, lS: 72, lE: 16, brow: 0.7, lean: 2 },
  // P1: nobody comes; he waits, the hand slowly lowering, glancing at the empty doorway and back
  { f: P1[0] + 6, in: 10, ease: "inOut", lS: 40, lE: 34, brow: 0.5, lean: 0, eyeX: -0.9 },
  { f: P1[1] - 4, in: 12, ease: "inOut", lS: 4, lE: 62, lHand: "relaxed", headTurn: -0.15, eyeX: -0.3, brow: 0.3 },
  // AG2 a: back at the rite (seen through the door), eyes down; the near hand comes back for the dhoop unseen
  { f: B.a + 6, in: 12, ease: "inOut", ...BUSY },
  { f: TAKE - 10, lS: 10, lE: 70 },
  { f: TAKE, in: 10, ease: "inOut", lS: 74, lE: 6, lHand: "open" },
  { f: HANDOVER, in: 6, ease: "inOut", lHand: "hold", lProp: "dhoop" },
  { f: HANDOVER + 14, in: 14, ease: "inOut", lS: 16, lE: 60 },
  // sets it down at the rite
  { f: HANDOVER + 26, in: 10, ease: "inOut", lS: 30, lE: 40, lHand: "relaxed", lProp: "" },
  { f: HANDOVER + 40, in: 12, ease: "inOut", lS: 10, lE: 70 },
  // AG2 c, d: eyes closed in the offering, "এতে গন্ধে পুষ্পে", the bell in the near hand
  { f: B.c, ...BUSY, lid: 0.85, lProp: "bell", lHand: "hold", lS: 8, lE: 34, headNod: 3, smile: 0.3 },
  // the bell rises and rings through the offering while Balak drinks (RING_D), then rests again
  { f: B.d + 2, in: 8, ease: "inOut", lS: 22, lE: 85 },
  { f: B.d + 40, lS: 22, lE: 85 },
  { f: B.d + 50, in: 10, ease: "inOut", lS: 8, lE: 34 },
  // his line: the eyes open at "ঠাকুরমশায়," and turn to the boy
  { f: V.thakur + 8, in: 10, ease: "inOut", lid: 0.2, brow: 0.2, eyeX: 0.6 },
  { f: V.apnar + 2, in: 14, ease: "inOut", headTurn: 0.45, eyeX: 0.7, eyeY: 0.1, headNod: 0, brow: 0.5, rS: 18, rE: 30 },
  // puzzled at "...খায় না", then following his hand to the bowl at "ফোপড়াটা"
  { f: V.tai, in: 12, ease: "inOut", brow: 0.8, smile: 0.05 },
  { f: V.fopra + 2, in: 10, ease: "inOut", headNod: 7, eyeY: 0.7, eyeX: 0.5, brow: 0.9, gasp: 0.15 },
  { f: V.lineEnd - 6, in: 12, ease: "inOut", headNod: 2, eyeY: 0.1, eyeX: 0.7, gasp: 0.25, flush: 0.2 },
  // P3: from the bowl to the boy and back, reddening, the mouth falling open; the bell hand drops to his lap
  { f: P3[0] + 8, in: 10, ease: "inOut", headNod: 8, eyeY: 0.8, eyeX: 0.5, flush: 0.45, gasp: 0.45, brow: 1 },
  { f: P3[0] + 16, in: 8, ease: "inOut", headNod: 0, eyeY: 0, eyeX: 0.8, flush: 0.7 },
  { f: P3[0] + 24, in: 8, ease: "inOut", lS: 4, lE: 30, gasp: 0.75, flush: 0.85 },
  { f: P3[0] + 40, in: 14, ease: "inOut", headNod: 7, eyeY: 0.7, eyeX: 0.5, flush: 1 },
];
const priestKeyed = makeActing<Pose>(BASE_POSE, PRIEST_KEYS);
const RING_AG1 = { at: 10, dur: 40 };
const RING_D = { at: B.d + 4, dur: 34 };
const priestActing = (lf: number): Pose => {
  const p = priestKeyed(lf);
  // the bell rings (near forearm shakes) in AG1 and through the offering in beat d
  const bell = ringBell(lf, RING_AG1.at, RING_AG1.dur, 6) + ringBell(lf, RING_D.at, RING_D.dur, 6);
  // the far hand offers flowers ("এতে গন্ধে পুষ্পে") at the rite
  const fl1 = offerFlick(lf, 4, 2, 24, 12);
  const fl2 = offerFlick(lf, B.c - 10, 5, 22, 13);
  const arati = aratiCircle(lf, B.a + 18, 40, 6, 40);
  // the two "hun hun" nods after taking the dhoop (a), and the nod to his asking (b)
  const nods = headNods(lf, HANDOVER + 2, 2, 12, 6) + headNods(lf, ASK + 16, 2, 11, 5);
  return {
    ...p,
    lE: p.lE + bell,
    rS: p.rS + fl1.dS + fl2.dS + arati.dS,
    rE: p.rE + fl1.dE + fl2.dE + arati.dE,
    headNod: p.headNod + nods,
  };
};

const BellProp: PropRenderer = ({ scale, worldRot }) => (
  <g transform={`rotate(${-worldRot}) scale(${scale * 0.55}) translate(0, 30)`}>
    <BrassBell x={0} y={0} s={1} />
  </g>
);
const DhoopProp: PropRenderer = ({ scale, worldRot, f }) => (
  <g transform={`rotate(${-worldRot}) scale(${scale * 0.62}) translate(0, 34)`}>
    <DhoopDani x={0} y={0} s={1} f={f} smoke={1} />
  </g>
);
const PRIEST_PROPS: Record<string, PropRenderer> = { bell: BellProp, dhoop: DhoopProp };

/* ------------------------------------------------------------------ */
/* Thakurma (AG1): steps out with an empty brass tray and walks off       */
/* ------------------------------------------------------------------ */

const THAKURMA = CAST.thakurma;
const TH_WALK_V = 12.5; // px per real frame along the veranda
/** She is already over the threshold as the picture fades in and walks on at an old woman's steady pace. */
const thakurmaX = (lf: number): number => 1080 + TH_WALK_V * lf;
const thakurmaActing = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.8, headTurn: 0.25, eyeX: 0.3, eyeY: 0.1, smile: 0.3, stride: 1.75 / (TH_S * THAKURMA.height), lS: 30, lE: -70, lHand: "hold", lProp: "tray", rS: 8, rE: -14 },
]);
const TrayProp: PropRenderer = ({ scale, worldRot }) => (
  <g transform={`rotate(${-worldRot}) scale(${scale})`}>
    <ellipse cx={14} cy={2} rx={30} ry={7} fill="#8a5a1a" />
    <ellipse cx={14} cy={0} rx={30} ry={6.5} fill="#d8a84a" />
    <ellipse cx={14} cy={-0.5} rx={24} ry={4.5} fill="#e8c070" opacity={0.7} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

const VERANDA_LIGHT: Lighting = { keySide: 1, rim: "#ffd79a", rimStrength: 0.35, rimSide: 1, brightness: 1 };
const GHAR_LIGHT: Lighting = { keySide: -1, rim: "#ffcf86", rimStrength: 0.4, rimSide: 1, brightness: 1 };

/**
 * Balak's restrained divine light: a soft warm halo behind his head and a faint ground glow (steady, BAL-05 to 07).
 * The halo sits on the rig's own glow anchor this frame (centred behind the plate head, kneeling or seated).
 */
const BalakLight: React.FC<{ x: number; y: number; s: number; halo: { cx: number; cy: number; r: number }; lf: number }> = ({ x, y, s, halo, lf }) => (
  <g>
    <defs>
      <radialGradient id="s03-ground-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y + 4} rx={120 * s} ry={20 * s} fill="url(#s03-ground-glow)" />
    <BirulGlow cx={halo.cx} cy={halo.cy} r={halo.r} glow={0.62} f={lf} />
  </g>
);

/**
 * BAL-26b (2026-11-22): Balak in the reference-plate design at five (`design="plate"`, `age={5}`, the shared
 * ThakurHeadPlate). Poses, timing, lip sync, blinks and expressions are the delivered ones.
 */
const BALAK_AGE = 5;

const Balak: React.FC<{ lf: number; place: { x: number; y: number; s: number }; flip: boolean; mouth: number }> = ({ lf, place, flip, mouth }) => {
  const st = childAt(lf);
  const props: ChildProps = {
    x: place.x,
    y: place.y,
    s: place.s,
    flip,
    f: cc(lf),
    lifeF: lf,
    pose: st.pose,
    prevPose: st.prevPose,
    poseStart: st.poseStart,
    prevPoseStart: st.prevPoseStart,
    kneel: st.kneel,
    holding: st.holding,
    reachFor: st.reachFor,
    reachAt: st.reachAt,
    pointAt: st.pointAt,
    expression: st.expression,
    prevExpression: st.prevExpression,
    expressionStart: st.expressionStart,
    face: childFace(lf),
    mouth,
    talk: balakTalk(lf),
    sigh: BALAK_SIGH,
    design: "plate",
    age: BALAK_AGE,
  };
  const halo = seatedChildHands(props).glowAnchor;
  return (
    <>
      <BalakLight x={place.x} y={place.y} s={place.s} halo={halo} lf={lf} />
      <SeatedChild {...props} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene03CoconutWaterAbhishek: React.FC = () => {
  const { lifeF } = useStory4(SCENE_ID);
  const lf = lifeF;
  const shot = shotAt(lf);
  const cam = camOf(shot);
  const mouth = balakMouth(lf);

  if (shot.set === "veranda") {
    const dhoopOnFloor = lf < PICK + 26;
    const thX = thakurmaX(lf);
    return (
      <AbsoluteFill style={{ background: "#2a1a10" }}>
        <Stage cam={cam} background="#2a1a10">
          <VedicShrineVeranda
            f={lf}
            time="morning"
            cam={cam}
            dhoop={dhoopOnFloor ? { x: DHOOP_V.x, y: DHOOP_V.y, smoke: 1 } : false}
            insideProps={{ bell: lf >= 56, dhoop: lf >= HANDOVER + 26, ghot: false, coconuts: false, lamp: false }}
            inside={
              <Puppet
                cast={PRIEST}
                f={lf}
                lifeF={lf}
                x={PV.x}
                y={PV.y}
                scale={PV.s}
                seated
                acting={priestActing}
                mouth={priestMouth}
                talk={priestTalk}
                props={PRIEST_PROPS}
                light={GHAR_LIGHT}
              />
            }
            floor={
              <>
                <Balak lf={lf} place={BV} flip={false} mouth={mouth} />
                {lf < 70 && thX < 2300 && (
                  <Puppet cast={THAKURMA} f={lf} lifeF={lf} x={thX} y={TH_Y} scale={TH_S} acting={thakurmaActing} props={{ tray: TrayProp }} light={VERANDA_LIGHT} />
                )}
              </>
            }
          />
        </Stage>
      </AbsoluteFill>
    );
  }

  // the shrine room
  const bowlFill = lf < DRINK_AT ? 1 : 0;
  const drinking = lf >= DRINK_AT && lf < DRINK_AT + DRINK_REAL;
  const balakIn = lf >= B.c;
  return (
    <AbsoluteFill style={{ background: "#2a160c" }}>
      <Stage cam={cam} background="#2a160c">
        <ThakurGhar
          f={lf}
          cam={cam}
          show={{ bowl: false, bell: lf < B.c, dhoop: lf >= B.a, coconuts: false, lamp: false, conch: false }}
          behind={
            <Puppet
              cast={PRIEST}
              f={lf}
              lifeF={lf}
              x={PG.x}
              y={PG.y}
              scale={PG.s}
              seated
              acting={priestActing}
              mouth={priestMouth}
              talk={priestTalk}
              props={PRIEST_PROPS}
              light={GHAR_LIGHT}
            />
          }
          front={
            <>
              <VhdDefs />
              {/* the two cut green coconuts beside the bowl and the tall lamp, moved clear of where Balak sits */}
              <GreenCoconut x={COCO_A.x} y={COCO_A.y} s={0.95} rot={-75} />
              <GreenCoconut x={COCO_B.x} y={COCO_B.y} s={0.95} rot={68} />
              <Conch x={CONCH.x} y={CONCH.y} s={1.15} />
              <BrassLamp x={LAMP.x} y={LAMP.y} s={1} f={lf} kind="pilsuj" seed={5} />
              {balakIn && <Balak lf={lf} place={BI} flip mouth={mouth} />}
              {/* the bowl on the floor in front of his near knee, drawn over him as his rig draws it while he drinks */}
              {!drinking && (
                <HeldObjectArt kind="stoneBowl" x={BOWL_AT.x} y={BOWL_AT.y} s={BI.s} fill={bowlFill} lifeF={lf} flip />
              )}
            </>
          }
        />
      </Stage>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Sound events for Episode04.tsx (scene-local STORY frames)            */
/* ------------------------------------------------------------------ */

/** Real local frame -> story frame (inverse of R; inside a pause it returns the pause's story frame). */
const toStory = (lf: number): number => {
  let s = lf;
  for (const p of PAUSES) {
    const a = R(p.atStory);
    if (lf >= a + p.frames) s -= p.frames;
    else if (lf >= a) return p.atStory;
  }
  return s;
};
/**
 * Where scene 03's sounds belong, in scene-local story frames (the bell ringing, Thakurma's steps, the dhoop handed
 * over, the brass tap of the dhoop-dani set down at the rite, Balak's steps going in, the drink, the bowl set down).
 */
export const S03_SOUND_EVENTS = {
  bellAG1: toStory(RING_AG1.at),
  thakurmaSteps: toStory(4),
  dhoopPick: toStory(PICK + 20),
  dhoopHandover: toStory(HANDOVER),
  brassTap: toStory(HANDOVER + 26),
  balakStepsIn: toStory(B.c - 6),
  bellD: toStory(RING_D.at),
  drinkGulp: toStory(DRINK_AT + 20),
  bowlDown: toStory(BOWL_DOWN),
  bellDrop: toStory(P3[0] + 24),
} as const;
export const S03_DUR = DUR;
