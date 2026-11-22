import React from "react";
import { clamp, EASE, lerp, makeActing, noise1, PoseKey, track } from "../../cinematic/core/anim";
import { Cam, Stage } from "../../cinematic/core/Stage";
import { CAST, CastEntry } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../../cinematic/rig/lipsync";
import { BASE_POSE, beckon, headNods, headShake, headShakeTilt, Lighting, Pose, PropRenderer, Puppet } from "../../cinematic/rig/Puppet";
import {
  POND,
  pondBankY,
  VEDIC_COURTYARD_BG,
  VedicCourtyardDay,
  vedicCourtyardKeepInSet,
  VedicPondDay,
  vedicPondKeepInSet,
} from "../../cinematic/sets/VedicHouseDay";
import { clipLocalStory4, clipSpan4, pausesFor4, storyToReal, useStory4 } from "../../episode/storyClock";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { HELD_OBJECT_BOTTOM, HeldObjectArt, KNEEL_REACH_T, SeatedChild, seatedChildHands } from "../../episode03/rig/SeatedChild";
import { EP04_SCENES } from "../timing";

/**
 * Episode 4, scene 02 (02_gobinda_pond_and_thakurma): the brass Gobinda at the pond, and Thakurma's words.
 * Approved plan STO-19: 03_Episodes/Episode_04_Idols_and_Coconut_Water/01_Script_and_Storyboard/
 * Ep04_Shots_and_Pauses_DRAFT.md, "Scene 02". Book chapter 6 (book.xlsx row 12).
 *
 * 02A (narration 02a, a flashback: Charu tells the jyethi, STO-19): the Vedic house pond by day (VedicPondDay).
 * Balak sits under the mandar tree with the brass Gobinda he took from the deities' khat; Sundar jyetha kneels
 * a few steps away and coaxes him with gestures only (his mouth stays closed under the narration); Charu and a
 * relative wait on the ghat steps; a cousin runs up along the near bank from the ghat side with Balak's painted wooden doll and gives it to
 * Sundar, who holds it out and sets it down by the child; only then does Balak hold the Gobinda out to Sundar's two
 * hands, and he picks up his doll and hugs it. A light warm, soft-edged flashback look sits over 02A.
 * 02B (Thakurma 02b): the inner courtyard in afternoon light (VedicCourtyardDay "afternoon"), the family talk
 * afterwards. Harendra Thakur stands shaking his head, palms up (silent, his "কালাপাহাড়" is not recorded); the
 * jyethi and Charu sit on the near veranda; Thakurma, on a low pidi nearest the courtyard, raises a hand to quiet
 * them and speaks (lip-synced from the voice envelope); on "এই কালাপাহাড়ই" she turns to Balak, who sits by the
 * tulsi mancha with his doll; on her prophecy (P3) his glow brightens gently once (the episode's only glow beat).
 *
 * Shots (CAM-13; hard cuts on the voice, one move at most per line):
 *   1 wide        open pause and "আরেকদিন তো…": the pond, the ghat, the house across the water, Balak under the
 *                 mandar tree (right third) with the Gobinda; held (the fade-in from black is Episode04's, on the
 *                 real clock, during the open pause: a mandar blossom drops onto the water)
 *   2 medium wide cut on "সুন্দর জ্যেঠা": Sundar crouched coaxing, Charu and a relative on the ghat steps, Balak
 *                 holding the Gobinda to his chest; the cousin runs in along the near bank at its end
 *   3 two-shot    cut on "তাঁর কাঠের পুতুল": Sundar left, Balak right; the doll from the cousin to Sundar to the
 *                 grass by the child; held through "তবেই গোবিন্দ উদ্ধার করলেন" (the hand-back) into P2
 *   P2            (a) the pond holds: Sundar draws the Gobinda to his chest and bows his head, Balak hugs his
 *                 doll; (b) a 36-frame cross-dissolve to the courtyard wide (Harendra shaking his head)
 *   4 Thakurma    cut 7 frames before her voice: her medium close-up, hand raised to quiet them
 *   5 over-shoulder cut on "এই কালাপাহাড়ই": past Thakurma's soft shoulder to Balak by the tulsi, held through P3
 * Pauses (CAM-14, STO-19): P1 open (1 s), P2 after "…উদ্ধার করলেন।" (3 s), P3 end (2 s).
 *
 * Clocks: `f` story (holds in pauses); `lifeF` real (breathing, blinks, glow motes, water, leaves). 02A's figures run
 * on the pond clock `pc` = f, which keeps running through P2 only (the pond is never seen again after P2's
 * dissolve, so its settle and the hug play there without a jump). 02B's figures and cuts run on the real frame,
 * keyed from the story cues with storyToReal (02B has no pause until its end).
 */

const SCENE_ID = "02_gobinda_pond_and_thakurma";
const SCENE = EP04_SCENES.find((s) => s.sceneId === SCENE_ID);
const SCENE_START = SCENE?.startFrame ?? 1424;
const DUR = SCENE?.durationFrames ?? 642;
const PAUSES = pausesFor4(SCENE_ID);
const real = (story: number) => storyToReal(story, PAUSES);

/* ---------------- narration anchors ---------------- */

/** Clip starts on the story clock; offsets inside the clips are the measured voice onsets (silencedetect, envelope). */
const A0 = clipLocalStory4("02a_Narrator_Pond.wav", SCENE_ID)?.from ?? 0;
const B0 = clipLocalStory4("02b_Thakurma_Blessing.wav", SCENE_ID)?.from ?? 271;
const K = {
  /** "সুন্দর জ্যেঠা" (the voice after the 3.16-3.31 s silence) */
  sundar: A0 + 79,
  /** "তাঁর কাঠের পুতুল" (after the 6.65-6.79 s silence) */
  doll: A0 + 163,
  /** "তবেই গোবিন্দ উদ্ধার করলেন" (after 8.47-8.67 s) */
  tobei: A0 + 208,
  /** Thakurma's first word ("তোরা") */
  thakurma: B0 + 2,
  /** "দেখিস," */
  dekhis: B0 + 86,
  /** "এই কালাপাহাড়ই…" (the strong onset at 4.6 s; the caption phrase starts 8 frames earlier) */
  ei: B0 + 110,
};

const pReal = (i: number, fb: [number, number]): [number, number] => {
  const p = PAUSES[i];
  if (!p) return fb;
  const s = real(p.atStory);
  return [s, s + p.frames];
};
const P2 = pReal(1, [282, 354]);
const P3 = pReal(2, [593, 641]);
/** P2 (b): the slow cross-dissolve to the courtyard fills the second half of the pause (Episode04 crossfades the beds here). */
const DISSOLVE = 36;
const DIS_A = P2[1] - DISSOLVE;

/* ---------------- 02A: the pond ---------------- */

const SP = POND.SPOTS;
/**
 * BAL-26b (2026-11-22): in the plate design his head was about 62% of Sundar's (adult Puppet, scale 2) at the spot's
 * s 1.3; at 1.65 it is about 80% (a five-year-old beside an adult). He moves right so that the world points where his
 * hands meet Sundar's (the hand-back) and where the doll stands on the grass stay the delivered ones (OFFER_FIG,
 * DOLL_FIG_X below are re-derived from the old s 1.3 figure points: offer (76, -74), doll x 94, at x 1430).
 */
const BALAK_A_OLD = { x: SP.balak.x, y: SP.balak.y, s: SP.balak.s };
const BALAK_A_S = 1.65;
const BALAK_A = { x: BALAK_A_OLD.x - 76 * BALAK_A_OLD.s + 76 * BALAK_A_S, y: SP.balak.y, s: BALAK_A_S };
const ADULT_S = 2;
const SUNDAR_AT = { x: SP.sundar.x + 10, y: pondBankY(SP.sundar.x + 10) + 22 };
const CHARU_A = { x: 220, y: 862, s: 1.32 };
const KIN_A = { x: 60, y: 802, s: 1.26 };

/** The cousin who runs to fetch the doll (Episode 1's Vedic house boy, a few years older). */
const RUNNER: CastEntry = { ...CAST.gopal, id: "gopal", height: 1.2, seed: 211 };
const RUNNER_S = 1.8;

/** The hand-back beats (story frames on the pond clock). */
const T = {
  arrive: K.doll - 30, // the cousin enters along the near bank
  handTo: K.doll + 6, // the doll passes from the cousin's hand to Sundar's
  holdOut: K.doll + 14, // Sundar holds it out to the child
  setDown: K.doll + 36, // he stands it on the grass in front of him and lets go
  offer: K.tobei - 8, // Balak holds the Gobinda out (8 frames before "তবেই")
  give: K.tobei + 10, // into Sundar's two hands
};
const REACH_AT = T.give + 2;
const GRIP_DOLL = REACH_AT + KNEEL_REACH_T.grip;
const HUG_AT = GRIP_DOLL + 2;

/** Where Balak holds the Gobinda out (figure units, before the flip) and where the doll stands on the grass. */
const OFFER_FIG = { x: 76, y: (-74 * BALAK_A_OLD.s) / BALAK_A.s };
const DOLL_FIG_X = (BALAK_A.x - (BALAK_A_OLD.x - 94 * BALAK_A_OLD.s)) / BALAK_A.s;
const DOLL_FIG = { x: DOLL_FIG_X, y: -HELD_OBJECT_BOTTOM.doll };
const figToWorld = (p: { x: number; y: number }) => ({ x: BALAK_A.x - p.x * BALAK_A.s, y: BALAK_A.y + p.y * BALAK_A.s });
const DOLL_GROUND = figToWorld(DOLL_FIG);

type ChildProps = React.ComponentProps<typeof SeatedChild>;
/** Sundar's arm where he stands the doll on the grass, and his cupped hands where Balak's offer meets them. */
const SETDOWN_ARM = { lS: -14, lE: -2, lean: 24 };
const RECEIVE = { lS: -26, lE: -50, rS: 26, rE: 50, lean: 10 };

/** Balak at the pond on the pond clock: the pose, the object in his hands and where he looks. */
const balakA = (pc: number): Partial<ChildProps> => {
  if (pc < K.sundar - 1) return { pose: "holdInLap", holding: "gobinda", poseStart: -400 };
  if (pc < T.offer) {
    // considering: the Gobinda close, glancing up at Sundar while he coaxes, then at the doll he holds out
    const look = track(pc, [
      [K.sundar + 10, 1],
      [K.sundar + 24, 0.35],
      [K.sundar + 62, 0.35],
      [K.sundar + 74, 0.9],
      [T.holdOut - 4, 0.9],
      [T.holdOut + 6, 0.25],
    ]);
    return {
      pose: "holdToChest",
      holding: "gobinda",
      poseStart: K.sundar - 1,
      watchHeld: look,
      face: { lookX: 0.35, smile: lerp(0.5, 0.62, clamp((pc - T.holdOut) / 20)) },
    };
  }
  if (pc < T.give) {
    return { pose: "offerUp", prevPose: "holdToChest", prevPoseStart: K.sundar - 1, poseStart: T.offer, holding: "gobinda", reachAt: OFFER_FIG, face: { lookX: 0.3, smile: 0.6 } };
  }
  if (pc < REACH_AT) return { pose: "offerUp", prevPose: "holdToChest", prevPoseStart: K.sundar - 1, poseStart: T.offer, reachAt: OFFER_FIG, face: { lookX: 0.3, smile: 0.6 } };
  if (pc < HUG_AT) {
    return {
      pose: "kneelReach",
      prevPose: "offerUp",
      prevPoseStart: T.offer,
      poseStart: REACH_AT,
      reachFor: "doll",
      reachAt: DOLL_FIG,
      holding: pc >= GRIP_DOLL ? "doll" : undefined,
      face: { smile: 0.62 },
    };
  }
  return { pose: "holdToChest", prevPose: "kneelReach", prevPoseStart: REACH_AT, poseStart: HUG_AT, holding: "doll", expression: "playful", face: { smile: 0.7 } };
};

/* Adult figures: keyed poses on their clock with a little weight shift (noise) on top. */
const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);
const sway = (base: (fr: number) => Pose, seed: number, amp = 1) => (fr: number): Pose => {
  const k = base(fr);
  return { ...k, bodyX: k.bodyX + noise1(fr * 0.011, seed) * 2 * amp, lean: k.lean + noise1(fr * 0.017, seed + 2) * 0.8 * amp };
};

/** Objects in an adult's hand (Puppet props): drawn upright at the palm, the same art and size as in Balak's hands. */
const heldProp = (kind: "doll" | "gobinda", puppetS: number, dx = 0, dy = 0): PropRenderer => ({ worldRot }) => (
  <g transform={`rotate(${-worldRot})`}>
    <HeldObjectArt kind={kind} x={dx} y={dy} s={BALAK_A.s / puppetS} />
  </g>
);
const PROPS_SUNDAR: Record<string, PropRenderer> = { doll: heldProp("doll", ADULT_S), gobinda: heldProp("gobinda", ADULT_S, 0, -22) };
const PROPS_RUNNER: Record<string, PropRenderer> = { doll: heldProp("doll", RUNNER_S) };

/**
 * Sundar, kneeling (back on his heels, so his hand reaches the grass) facing the child (his near arm is the LEFT one at bodyTurn > 0). Coaxing gestures
 * only, a soft closed smile. Story keys on the pond clock.
 */
const SUNDAR_KEYS: PoseKey<Pose>[] = [
  { f: -999, kneel: 1, bodyTurn: 0.82, lean: 5, headTurn: 0.1, eyeX: 0.3, smile: 0.5, lS: -6, lE: -24, rS: 6, rE: -20 },
  // "সুন্দর জ্যেঠা তখন মিষ্টি কথায় বুঝিয়ে": the open hand out to the child (gesture 6 frames before the words)
  { f: K.sundar + 10, in: 16, ease: "inOut", lS: -18, lE: -52, lHand: "open", lean: 8, headTilt: 4, smile: 0.62 },
  { f: K.sundar + 58, in: 14, ease: "inOut", lS: -14, lE: -46, headTilt: -2 },
  // the cousin comes up behind him: Sundar looks back and reaches back with his near hand for the doll
  { f: T.handTo - 4, in: 16, ease: "inOut", headTurn: -0.45, eyeX: -0.6, lS: 34, lE: -10, lHand: "open", lean: 2, bodyTurn: 0.7 },
  { f: T.handTo, in: 1, lProp: "doll", lHand: "hold" },
  // holds it out to the child
  { f: T.holdOut + 10, in: 16, ease: "inOut", headTurn: 0.1, eyeX: 0.3, lS: -30, lE: -40, lean: 9, smile: 0.68, bodyTurn: 0.82 },
  // and stands it on the grass in front of him, then lets go
  { f: T.setDown - 1, in: 16, ease: "inOut", lS: SETDOWN_ARM.lS, lE: SETDOWN_ARM.lE, lean: SETDOWN_ARM.lean },
  { f: T.setDown, in: 1, lProp: "", lHand: "open" },
  // both hands out, cupped, for the Gobinda
  { f: T.give - 2, in: 16, ease: "inOut", lS: RECEIVE.lS, lE: RECEIVE.lE, rS: RECEIVE.rS, rE: RECEIVE.rE, lHand: "cup", rHand: "cup", lean: RECEIVE.lean },
  { f: T.give, in: 1, lProp: "gobinda", lHand: "hold", rHand: "hold" },
  // draws it to his chest with both hands, sitting back
  { f: T.give + 22, in: 20, ease: "inOut", join: 1, lean: 3, smile: 0.6 },
];
const SUNDAR_ACT = sway(A(SUNDAR_KEYS), 3, 0.6);
/** P2 (a): eyes close with a small bow of the head over the Gobinda (pond clock inside the pause). */
const sundarAct = (pc: number): Pose => {
  const k = SUNDAR_ACT(pc);
  const bowK = track(pc, [
    [T.give + 30, 0],
    [T.give + 46, 1, "inOut"],
    [T.give + 72, 1],
    [T.give + 90, 0.4, "inOut"],
  ]);
  return { ...k, headNod: k.headNod + 7 * bowK, lid: Math.max(k.lid, 0.85 * bowK), lean: k.lean + 4 * bowK };
};

/**
 * The cousin's run: from the ghat side along the near bank (the way to the house), up the slope behind Sundar; he
 * gives the doll into Sundar's hand reaching back, and runs back the way he came.
 */
const runnerPlace = (pc: number) => ({
  x: track(pc, [
    [T.arrive, 420, "linear"],
    [T.handTo - 6, 950, "out"],
    [T.handTo + 10, 950],
    [T.handTo + 40, 380, "in"],
  ]),
  y: track(pc, [
    [T.arrive, 1062],
    [T.handTo - 6, 1054, "out"],
  ]),
});
/** He faces right (near arm the LEFT one, forward = negative lS); after the hand-over he turns and runs back. */
const RUNNER_KEYS: PoseKey<Pose>[] = [
  { f: -999, bodyTurn: 0.75, stride: 1, lean: 9, lS: -30, lE: -50, lHand: "hold", lProp: "doll", rS: 20, rE: 40, smile: 0.5 },
  { f: T.handTo - 6, in: 8, ease: "out", stride: 0, lean: 4, lS: -42, lE: -20 },
  { f: T.handTo - 1, in: 5, lS: -36, lE: -4 },
  { f: T.handTo, in: 1, lProp: "", lHand: "open" },
  { f: T.handTo + 8, in: 8, ease: "inOut", lS: 6, lE: -10, lHand: "relaxed", lean: 0 },
  { f: T.handTo + 12, in: 6, stride: 1, bodyTurn: -0.75, lean: 6 },
  { f: T.handTo + 40, in: 4, stride: 0 },
];
const RUNNER_ACT = A(RUNNER_KEYS);

/** Charu on the ghat steps: hands joined at her chest, anxious; in P2 a visible sigh of relief. */
const CHARU_A_ACT = sway(A([{ f: -999, bodyTurn: 0.55, join: 0.8, rHand: "pranam", lHand: "pranam", brow: 0.5, browTilt: 0.4, smile: 0.15, eyeX: 0.5, headTilt: 3 }]), 5, 0.8);
const KIN_A_ACT = sway(A([{ f: -999, bodyTurn: 0.5, rS: 4, rE: -30, lS: 4, lE: -30, smile: 0.3, eyeX: 0.5 }]), 9, 0.8);
const charuSigh = (pc: number) => {
  const t = pc - (T.give + 28);
  if (t <= 0) return 0;
  if (t < 26) return EASE.inOut(t / 26);
  return Math.max(0, 1 - (t - 26) / 50);
};

/* ---------------- 02B: the courtyard, the family talk ---------------- */

/** Real local frames of the 02B beats. */
const R = {
  thakurma: real(K.thakurma),
  dekhis: real(K.dekhis),
  ei: real(K.ei),
};
const THAKURMA_AT = { x: 1140, y: 1000 };
const HARENDRA_AT = { x: 590, y: 1018 };
const JYETHI_AT = { x: 270, y: 1032 };
const CHARU_B = { x: 862, y: 1030 };
/** BAL-26b: s 1.4 (was 1.1, the same 1.27x as at the pond for the plate head), a little left to keep clear of the mancha. */
const BALAK_B = { x: 1615, y: 862, s: 1.4 };

/** Thakurma's voice: per-frame RMS (24 fps, 0..1) of public/audio/ep04/02b_Thakurma_Blessing.wav. */
const THAKURMA_ENV = [
  0, 0, 0.26, 0.33, 0.43, 0.43, 0.54, 0.66, 0.35, 0.28, 0.2, 0.04, 0, 0.15, 0.85, 1, 0.55, 0.01, 0.12, 0.36, 0.51, 0.22, 0.26, 0.21, 0.02, 0.01, 0.52, 0.86, 1,
  1, 1, 0.93, 0.38, 0.01, 0.02, 0.29, 0.51, 0.32, 0.27, 0.35, 0.43, 0.64, 0.78, 0.06, 0, 0.74, 0.56, 0.26, 0.23, 0.42, 0.82, 0.66, 0.77, 0.2, 0.17, 0.09, 0.33,
  0.5, 0.27, 0.32, 0.63, 0.66, 0.58, 0.38, 0.17, 0.37, 0.52, 0.61, 0.8, 0.34, 0.2, 0.19, 0.08, 0.01, 0.03, 0.03, 0.03, 0.04, 0.04, 0.04, 0.04, 0.03, 0.01, 0.01,
  0.03, 0.07, 0.14, 0.68, 0.79, 0.57, 0.24, 0.01, 0.08, 0.15, 0.1, 0.17, 0.15, 0.14, 0.13, 0.18, 0.22, 0.17, 0.05, 0.01, 0.01, 0.04, 0.06, 0.09, 0.12, 0.15,
  0.05, 0, 0.15, 1, 0.72, 0.54, 0.16, 0, 0, 0.03, 0.27, 0.23, 0.28, 0.71, 0.55, 0.37, 0.71, 0.76, 1, 0.68, 0.01, 0.22, 0.88, 0.54, 0.46, 0.4, 0.28, 0.47, 0.77,
  0.71, 0.45, 0.43, 0.03, 1, 1, 0.58, 0.57, 0.71, 0.57, 0.65, 0.11, 0.17, 0.06, 0, 0.08, 0.39, 0.98, 1, 1, 0.97, 0.19, 0, 0, 0, 0.35, 0.08, 0.28, 0.61, 0.76,
  0.86, 0.97, 1, 0.86, 1, 0.64, 0.45, 0.24, 0.35, 0.4, 0.25, 0.01, 0.04, 0.11, 0.47, 0.06, 0, 0.47, 0.49, 0.27, 0.21, 0.13, 0.43, 0.3, 0.18, 0.3, 0.29, 0.21,
  0.26, 0.2, 0.4, 0.08, 0.06, 0.36, 0.31, 0.29, 0.19, 0.14, 0.07, 0.02, 0.01, 0, 0, 0, 0.05, 0.04, 0,
];
const THAKURMA_TEXT = "তোরা ওকে যতই কালাপাহাড় বলিস— দেখিস, এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!";
const THAKURMA_CLIP = clipSpan4("02b_Thakurma_Blessing.wav");
const thakurmaRel = (fr: number): number => (THAKURMA_CLIP ? SCENE_START + fr - THAKURMA_CLIP.startFrame : -1);
/** Her mouth at real local frame fr (only she speaks in 02B). */
const thakurmaMouth = (fr: number): MouthState => {
  const rel = thakurmaRel(fr);
  if (rel < 0 || rel >= THAKURMA_ENV.length) return MOUTH_REST;
  const m = visemeFromEnvelope(THAKURMA_ENV, rel, 31, THAKURMA_TEXT);
  // an old woman's soft, unhurried speech: a little less jaw than the young voices
  return { ...m, open: m.open * 0.82 };
};
/** Phrase-level speech envelope for her breathing and blinks (on while any frame within 6 is voiced). */
const thakurmaTalk = (fr: number): number => {
  for (let k = -6; k <= 6; k++) {
    const rel = thakurmaRel(fr + k);
    if (rel >= 0 && rel < THAKURMA_ENV.length && speechLevel(THAKURMA_ENV, rel) > 0.06) return 0.6;
  }
  return 0;
};

/**
 * Thakurma on her low pidi at the courtyard end of the group, turned to the family (left, near arm the RIGHT one at
 * bodyTurn < 0): calm, listening; she raises her hand to quiet them (gesture 8 frames before "তোরা"), lowers it on
 * "দেখিস," and on "এই কালাপাহাড়ই" turns on her seat toward Balak with an open palm toward him. Her face stays
 * calm, prophetic and tender (cheeks at most 0.3). Real-frame keys.
 */
const THAKURMA_KEYS: PoseKey<Pose>[] = [
  { f: -999, bodyTurn: -0.42, headTurn: -0.22, eyeX: -0.6, lid: 0.22, smile: 0.32, cheeks: 0.12, brow: 0.15, rS: 6, rE: -46, lS: 6, lE: -46 },
  { f: R.thakurma - 8, in: 14, ease: "inOut", rS: 4, rE: -112, rHand: "abhaya", headTilt: -3, lid: 0.18, brow: 0.25 },
  { f: R.thakurma + 40, in: 12, ease: "inOut", headTilt: 2, smile: 0.36 },
  { f: R.dekhis - 6, in: 16, ease: "inOut", rS: 6, rE: -46, rHand: "relaxed", lean: 3, brow: 0.35 },
  // "এই কালাপাহাড়ই": turns toward the child, her open palm toward him
  { f: R.ei - 2, in: 16, ease: "inOut", bodyTurn: 0.55, headTurn: 0.12, eyeX: 0.35, lean: 4, lS: -34, lE: -22, lHand: "open", smile: 0.42, cheeks: 0.2, lid: 0.28 },
  { f: R.ei + 60, in: 20, ease: "inOut", lS: -6, lE: -40, lHand: "relaxed", smile: 0.5, cheeks: 0.25 },
];
const THAKURMA_ACT = sway(A(THAKURMA_KEYS), 13, 0.5);
const thakurmaAct = (fr: number): Pose => {
  const k = THAKURMA_ACT(fr);
  // P3: one slow nod as Balak looks up
  return { ...k, headNod: k.headNod + headNods(fr, P3[0] + 10, 1, 26, 5) };
};

/** Harendra Thakur, standing, palms up, shaking his head through the dissolve; he stops when she raises her hand. */
const HARENDRA_KEYS: PoseKey<Pose>[] = [
  { f: -999, bodyTurn: 0.4, rS: 8, rE: 58, lS: -4, lE: -58, rHand: "open", lHand: "open", brow: -0.3, browTilt: -0.3, smile: 0.05, eyeX: 0.3 },
  { f: R.thakurma - 2, in: 14, ease: "inOut", rS: 6, rE: -12, lS: 6, lE: -12, rHand: "relaxed", lHand: "relaxed", brow: 0, headTurn: 0.12 },
  { f: R.ei + 12, in: 16, ease: "inOut", headTurn: 0.22, eyeX: 0.6, brow: 0.2 },
];
const HARENDRA_ACT = sway(A(HARENDRA_KEYS), 17, 0.8);
const harendraAct = (fr: number): Pose => {
  const k = HARENDRA_ACT(fr);
  return { ...k, headTurn: k.headTurn + headShake(fr, DIS_A - 6, 56, 0.22), headTilt: k.headTilt + headShakeTilt(fr, DIS_A - 6, 56, 2.2) };
};
const JYETHI_ACT = sway(A([{ f: -999, bodyTurn: 0.45, rS: 6, rE: -40, lS: 6, lE: -40, smile: 0.25, eyeX: 0.4 }, { f: R.ei + 16, in: 18, ease: "inOut", headTurn: 0.2, eyeX: 0.7, smile: 0.35 }]), 21, 0.6);
const CHARU_B_ACT = sway(A([{ f: -999, bodyTurn: 0.4, rS: 6, rE: -40, lS: 6, lE: -40, smile: 0.3, eyeX: 0.5 }, { f: R.ei + 8, in: 18, ease: "inOut", headTurn: 0.25, eyeX: 0.8, smile: 0.42 }]), 23, 0.6);

/* ---------------- Balak's divine light (BAL-05 to BAL-07, BAL-11) ---------------- */

const GLOW_BASE = 0.72;
/** The episode's one glow beat: Thakurma's prophecy (P3). It rises gently and stays up into the chapter break. */
const glowBeat = (lf: number) => track(lf, [[P3[0] - 4, 0], [P3[0] + 20, 1, "inOut"]]);

const GroundGlow: React.FC<{ x: number; y: number; w: number; level: number; id: string }> = ({ x, y, w, level, id }) => (
  <g opacity={level}>
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y} rx={w} ry={w * 0.17} fill={`url(#${id})`} />
  </g>
);

/* ---------------- camera ---------------- */

interface Frame {
  cx: number;
  cy: number;
  z: number;
}
const PW: Frame = { cx: 900, cy: 560, z: 1.0 };
const PMED: Frame = { cx: 790, cy: 650, z: 1.22 };
const PTWO: Frame = { cx: 1320, cy: 712, z: 1.3 };
const YWIDE: Frame = { cx: 1000, cy: 620, z: 1.0 };
const YMCU: Frame = { cx: 1215, cy: 690, z: 2.4 };
const YOTS: Frame = { cx: 1584, cy: 780, z: 1.8 };

const pondCam = (f: number): Cam => {
  const fr = f < K.sundar - 1 ? PW : f < K.doll - 1 ? PMED : PTWO;
  return vedicPondKeepInSet({ x: fr.cx - 960, y: fr.cy - 540, zoom: fr.z, focus: 1, dof: 0, shake: 0 });
};
const yardCam = (lf: number): Cam => {
  if (lf < R.thakurma - 7) return vedicCourtyardKeepInSet({ x: YWIDE.cx - 960, y: YWIDE.cy - 540, zoom: YWIDE.z, focus: 1, dof: 0, shake: 0 }, true);
  if (lf < R.ei - 2) return vedicCourtyardKeepInSet({ x: YMCU.cx - 960, y: YMCU.cy - 540, zoom: YMCU.z, focus: 1, dof: 0.6, shake: 0 }, true);
  // over her shoulder: focus on the courtyard plane (Balak), her near-plane shoulder soft
  return vedicCourtyardKeepInSet({ x: YOTS.cx - 960, y: YOTS.cy - 540, zoom: YOTS.z, focus: 0.8, dof: 14, shake: 0 }, true);
};

/* ---------------- lighting ---------------- */

const POND_SUN: Lighting = { keySide: 1, rim: "#fff0c8", rimStrength: 0.3 };
const YARD_SUN: Lighting = { keySide: -1, rim: "#ffcf8a", rimStrength: 0.42 };

/** A low wooden pidi (Thakurma's seat). */
const Pidi: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx={0} cy={22} rx={130} ry={14} fill="#2a1408" opacity={0.25} />
    <rect x={-118} y={0} width={236} height={14} rx={3} fill="#8a5428" />
    <rect x={-118} y={0} width={236} height={3} fill="#b07a44" />
    <rect x={-104} y={14} width={16} height={10} fill="#5a3216" />
    <rect x={88} y={14} width={16} height={10} fill="#5a3216" />
  </g>
);

/* ---------------- scene ---------------- */

export const Scene02GobindaPondAndThakurma: React.FC = () => {
  const { f, lifeF, pause } = useStory4(SCENE_ID);
  // the pond clock: the story clock, which keeps running through P2 only (see the header)
  const pc = f + (pause.inPause && pause.index === 1 ? pause.elapsed : 0);
  const showPond = lifeF < P2[1];
  const showYard = lifeF >= DIS_A;
  const yardOp = EASE.inOut(clamp((lifeF - DIS_A) / DISSOLVE));

  const beat = glowBeat(lifeF);
  const glow = GLOW_BASE + (1 - GLOW_BASE) * beat;

  /* 02A */
  const camP = pondCam(pc);
  const rigA = balakA(pc);
  const peopleIn = pc >= K.sundar - 1; // Sundar, Charu and the relative from shot 2 (a time cut)
  const runnerIn = pc >= T.arrive;
  const rp = runnerPlace(pc);
  const dollOnGrass = pc >= T.setDown && pc < GRIP_DOLL;

  /* 02B */
  const camY = yardCam(lifeF);
  const lookUp = track(lifeF, [[P3[0] + 2, 0], [P3[0] + 18, 1, "inOut"]]);

  // BAL-26b (2026-11-22): Balak in the reference-plate design at five (shared ThakurHeadPlate). Poses, timing, blinks
  // and expressions are the delivered ones; the halo is centred behind the plate head from the rig's own solve.
  const balakAProps: ChildProps = { x: BALAK_A.x, y: BALAK_A.y, s: BALAK_A.s, f: pc, lifeF, flip: true, ...rigA, design: "plate", age: 5 };
  const glowA = seatedChildHands(balakAProps).glowAnchor;
  const balakBProps: ChildProps = {
    x: BALAK_B.x,
    y: BALAK_B.y,
    s: BALAK_B.s,
    f: lifeF,
    lifeF,
    flip: true,
    pose: "holdInLap",
    holding: "doll",
    poseStart: -400,
    watchHeld: 1 - lookUp,
    face: { lookX: 0.4 * lookUp, eyesDown: 0, smile: 0.55 + 0.1 * lookUp },
    design: "plate",
    age: 5,
  };
  const glowB = seatedChildHands(balakBProps).glowAnchor;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      {showPond && (
        <div style={{ position: "absolute", inset: 0, filter: "sepia(0.1) saturate(0.95)" }}>
          <Stage cam={camP} background="#cfe0d8">
            <VedicPondDay
              f={lifeF}
              flowerDrop={6}
              cam={camP}
              bank={
                <>
                  {peopleIn && (
                    <>
                      <Puppet cast={CAST.womanB} f={pc} lifeF={lifeF} x={KIN_A.x} y={KIN_A.y} scale={KIN_A.s} acting={KIN_A_ACT} light={POND_SUN} stillness={0.3} />
                      <Puppet cast={CAST.charu} f={pc} lifeF={lifeF} x={CHARU_A.x} y={CHARU_A.y} scale={CHARU_A.s} acting={CHARU_A_ACT} light={POND_SUN} sigh={charuSigh} stillness={0.2} />
                    </>
                  )}
                  {peopleIn && <Puppet cast={CAST.sundar} f={pc} lifeF={lifeF} x={SUNDAR_AT.x} y={SUNDAR_AT.y} scale={ADULT_S} acting={sundarAct} props={PROPS_SUNDAR} light={POND_SUN} />}
                  {runnerIn && pc < T.handTo + 44 && <Puppet cast={RUNNER} f={pc} lifeF={lifeF} x={rp.x} y={rp.y} scale={RUNNER_S} acting={RUNNER_ACT} props={PROPS_RUNNER} light={POND_SUN} />}
                  {dollOnGrass && <HeldObjectArt kind="doll" x={DOLL_GROUND.x} y={DOLL_GROUND.y} s={BALAK_A.s} />}
                  <GroundGlow id="s02-pond-gg" x={BALAK_A.x} y={BALAK_A.y + 4} w={108 * BALAK_A.s} level={0.5} />
                  <BirulGlow cx={glowA.cx} cy={glowA.cy} r={150 * BALAK_A.s} glow={GLOW_BASE} f={lifeF} />
                  <SeatedChild {...balakAProps} />
                </>
              }
            />
          </Stage>
          {/* the flashback's soft warm edge (Charu's telling), restrained */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 50% 48%, rgba(255,240,214,0) 58%, rgba(255,236,204,0.22) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
      {showYard && (
        <div style={{ position: "absolute", inset: 0, opacity: yardOp }}>
          <Stage cam={camY} background={VEDIC_COURTYARD_BG.afternoon}>
            <VedicCourtyardDay
              f={lifeF}
              time="afternoon"
              cam={camY}
              nearVeranda
              yard={
                <>
                  <GroundGlow id="s02-yard-gg" x={BALAK_B.x} y={BALAK_B.y + 3} w={109 * BALAK_B.s} level={0.5 + 0.5 * beat} />
                  <BirulGlow cx={glowB.cx} cy={glowB.cy} r={150 * BALAK_B.s * (1 + 0.15 * beat)} glow={glow} f={lifeF} />
                  <SeatedChild {...balakBProps} />
                </>
              }
              floor={
                <>
                  <Puppet cast={CAST.jyethi} f={lifeF} lifeF={lifeF} x={JYETHI_AT.x} y={JYETHI_AT.y} scale={ADULT_S} acting={JYETHI_ACT} light={YARD_SUN} seated stillness={0.3} />
                  <Puppet cast={CAST.harendra} f={lifeF} lifeF={lifeF} x={HARENDRA_AT.x} y={HARENDRA_AT.y} scale={ADULT_S} acting={harendraAct} light={YARD_SUN} />
                  <Puppet cast={CAST.charu} f={lifeF} lifeF={lifeF} x={CHARU_B.x} y={CHARU_B.y} scale={ADULT_S} acting={CHARU_B_ACT} light={YARD_SUN} seated stillness={0.3} />
                  <Pidi x={THAKURMA_AT.x} y={THAKURMA_AT.y} />
                  <Puppet
                    cast={CAST.thakurma}
                    f={lifeF}
                    lifeF={lifeF}
                    x={THAKURMA_AT.x}
                    y={THAKURMA_AT.y}
                    scale={ADULT_S}
                    acting={thakurmaAct}
                    mouth={thakurmaMouth}
                    talk={thakurmaTalk}
                    light={YARD_SUN}
                    seated
                    stillness={0.2}
                  />
                </>
              }
            />
          </Stage>
        </div>
      )}
    </div>
  );
};

/** Story frames of this scene's sound events, for Episode04.tsx (pond clock = story clock; P2 beats are pause-relative). */
export const S02_EVENTS = {
  runnerSteps: { from: T.arrive, to: T.handTo - 8 },
  dollToSundar: T.handTo,
  dollOnGrass: T.setDown,
  handBack: T.give,
  dollPicked: GRIP_DOLL,
  thakurmaLine: K.thakurma,
  /** the glow beat starts with P3 (real local frame P3[0]) */
  glowBeatReal: P3[0],
  durationFrames: DUR,
};
