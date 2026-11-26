import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, lerp, track } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { MOUTH_REST, visemeFromEnvelope, type MouthState } from "../../../cinematic/rig/lipsync";
import { GESTURES, headNods, headShake, headShakeTilt, Puppet, wobble, type Pose } from "../../../cinematic/rig/Puppet";
import { SeatedChild, seatedEp6Anchors, type SeatedChildProps } from "../../../episode03/rig/SeatedChild";
import { ContactShadow, GhibliCharFilterDefs, GhibliCutout, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { GHIBLI_ANCHORS } from "../plateAnchors";
import { withGhibliActing } from "../../core/ghibliActing";
import { GhibliBalakLapDetails } from "../../core/ghibliBalak";
import { Ep04BalakDivine, Ep04BalakGroundGlow, Ep04BalakInkDefs } from "../Ep04BalakDivine";
import { EP04_BALAK_LOOK } from "../ep04BalakLook";
import { safeBodyTurn, zoomProportionalDof } from "../../core/ghibliMotion";
import { EP04G_RMS, EP04G_SCENES, ep04gSpan } from "../timing";
import {
  EP04G_AFTERNOON_LIGHT,
  EP04G_CAST,
  GhibliCourtyardBackdrop,
  GhibliEp04ForegroundFinish,
} from "../Ep04GhibliShared";

/**
 * Episode 4 Ghibli, Scene 04 (`04_kalapahar_to_kailashpati`): the prophecy, the episode's only glow beat. Blueprint
 * "Scene 04", Shots 17-19 with P7 and P8.
 *
 * Blocking (afternoon courtyard, the family on the madur mat; adult Puppets at K = 1, seated Balak 0.72 K, CHR-08):
 *   Harendra stands at the left, Jyethi stands behind Charu, Charu kneels, Balak sits on the mat hugging his doll
 *   near Thakurma's knees, Thakurma kneels at the right facing them.
 *   Shot 17 medium wide group (04a + P7): Harendra shakes his head, throws his palms up ("ঠাকুর-দেবতা কিচ্ছু মানছে
 *           না!") and points a warning finger on "…ঠাকুরঘরে ঢুকতে দেওয়া না হয়!"; Charu and Jyethi nod gravely;
 *           Thakurma smiles knowingly. Held.
 *   Shot 18 medium close on Thakurma (cut 6 f before 04b): she turns warmly to the family and lays a loving hand on
 *           Balak's shoulder (Pose.reach solved every frame onto his shoulder, MOT-07).
 *   Shot 19 close-up on Balak, cut on "এই কালাপাহাড়ই" (04b + 107, measured from the clip's silences), a slow push
 *           1.0 -> 1.28x held through P8: he lifts his calm eyes to her with a serene half-smile and a slow blink.
 *           THE GLOW BEAT (BAL-06, BAL-11): his soft warm-white halo and ground glow brighten gently, 4 slow motes
 *           rise; no rings, no rays, nothing on the doll. In the last second of P8: cut to Charu's moved, glistening
 *           eyes (CAM-12).
 * Sound (Episode04Ghibli): its soft_magical_shimmer should land on SC04_GLOW_BEAT_LOCAL (exported below).
 */

const SCENE_ID = "04_kalapahar_to_kailashpati";
const SCENE_FRAMES = EP04G_SCENES.find((s) => s.sceneId === SCENE_ID)?.durationFrames ?? 579;

const PRELOAD = [
  "images/ghibli_ep04/sky_ep04_afternoon_gold.png",
  "images/ghibli_ep04/far_trees_ep04_sketch.png",
  "images/ghibli_ep04/courtyard_back_ep04_morning.png",
  "images/ghibli_ep04/courtyard_floor_ep04_sketch.png",
  "images/ghibli_ep04/tulsi_mancha_ep04_sketch.png",
  "images/ghibli_ep04/madur_mat_veranda_sketch.png",
  "images/ghibli_ep04/watercolor_paper_grain.png",
] as const;

/* ------------------------------------------------------------------ */
/* Timing                                                               */
/* ------------------------------------------------------------------ */

const S4A = ep04gSpan(SCENE_ID, "04a_Harendra_Grumble.wav");
const S4B = ep04gSpan(SCENE_ID, "04b_Thakurma_Prophecy.wav");
/**
 * Phrase onsets inside the clips (frames from the clip start, from the RMS silences): 04a "ঠাকুর-দেবতা" 81, "হুকুম
 * দিচ্ছি" 153, "ওকে যেন…ঢুকতে দেওয়া না হয়!" 182 (the warning on "ঠাকুরঘরে" about 215); 04b "দেখিস," 82, "এই
 * কালাপাহাড়ই…" 107.
 */
const A_GODS = S4A.from + 81;
const A_ORDER = S4A.from + 153;
const A_WARN = S4A.from + 182;
const B_DEKHIS = S4B.from + 82;
/** The key beat: "এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!" */
const GLOW_BEAT = S4B.from + 107;
/** Scene-local frame of the glow beat (for the shimmer in Episode04Ghibli). */
export const SC04_GLOW_BEAT_LOCAL = GLOW_BEAT;

const SHOT18 = S4B.from - 6;
const SHOT19 = GLOW_BEAT;
const CHARU_EYES = SCENE_FRAMES - 24;

/* ------------------------------------------------------------------ */
/* Lip sync: own clip only                                              */
/* ------------------------------------------------------------------ */

const TEXT: Record<string, string> = {
  "04a_Harendra_Grumble.wav":
    "কী যে কালাপাহাড় এল আমাদের ঘরে! ঠাকুর-দেবতা কিচ্ছু মানছে না! হুকুম দিচ্ছি—ওকে যেন আর কোনোদিন ঠাকুরঘরে ঢুকতে দেওয়া না হয়!",
  "04b_Thakurma_Prophecy.wav": "তোরা ওকে যতই কালাপাহাড় বলিস—দেখিস, এই কালাপাহাড়ই একদিন কৈলাসপতি হয়ে উঠবে!",
};
const clipMouth = (file: string, seed: number) => (fr: number): MouthState => {
  const w = ep04gSpan(SCENE_ID, file);
  if (fr < w.from || fr >= w.to) return MOUTH_REST;
  return visemeFromEnvelope(EP04G_RMS[file] as number[] | undefined, fr - w.from, seed, TEXT[file]);
};
const clipTalk = (file: string) => (fr: number): number => {
  const w = ep04gSpan(SCENE_ID, file);
  const env = EP04G_RMS[file];
  if (!env || fr < w.from - 6 || fr >= w.to + 6) return 0;
  for (let k = -6; k <= 6; k++) {
    const i = fr + k - w.from;
    if (i >= 0 && i < env.length && env[i] > 0.06) return 1;
  }
  return 0;
};
const harendraMouth = clipMouth("04a_Harendra_Grumble.wav", 7);
const harendraTalk = clipTalk("04a_Harendra_Grumble.wav");
const thakurmaMouth = clipMouth("04b_Thakurma_Prophecy.wav", 13);
const thakurmaTalk = clipTalk("04b_Thakurma_Prophecy.wav");

/* ------------------------------------------------------------------ */
/* Layout                                                               */
/* ------------------------------------------------------------------ */

type V = { x: number; y: number };
/** Ground line just in front of the veranda plinth (floor top at stage y 734): the arcade reads behind the group. */
/**
 * STO-22c: the family stands in depth, not in a row. Harendra stands back by the plinth, Jyethi in the middle ground
 * behind Charu, Thakurma kneels on the mat a little behind the boy, and Charu and Balak are nearest the camera. Scale
 * follows depth (about 1.0 at y 840, 0.9 at y 750).
 */
const HARENDRA = { x: 520, y: 744, s: 0.88 };
const JYETHI = { x: 690, y: 768, s: 0.92 };
const CHARU = { x: 800, y: 846, s: 1.02 };
/** BAL-26b: 0.755 puts his head at about 82% of Charu's (measured on the 5250 still at the same depth; 0.72 gave ~78%). */
const BALAK = { x: 972, y: 850, s: 0.755 };
/** Thakurma kneels just behind the boy and to his right (her near hand reaches his shoulder without strain). */
const THAKURMA = { x: 1068, y: 810, s: 0.97 };
/** The madur mat under Balak and Thakurma (drawn here at the figures' ground line, not by the backdrop). */
const MAT = { x: 1014, y: 874, h: 126 };
/** Head centres when kneeling upright (measured on the stills). */
const KNEEL_HEAD_DY = -170;

/* ------------------------------------------------------------------ */
/* Balak                                                                */
/* ------------------------------------------------------------------ */

/** He lifts his eyes to Thakurma on the beat. */
const lookUp = (fr: number) =>
  track(fr, [
    [GLOW_BEAT - 4, 0],
    [GLOW_BEAT + 18, 1, "inOut"],
  ]);
/** The glow: steady 0 before the beat, rising gently to 1 over 2 s, held through P8. */
const glowK = (fr: number) => EASE.inOut(clamp((fr - GLOW_BEAT) / 48));

const balakProps = (fr: number): SeatedChildProps => {
  const up = lookUp(fr);
  return {
    x: BALAK.x,
    y: BALAK.y,
    s: BALAK.s,
    design: "plate",
    build: "healthy",
    age: 5,
    ...EP04_BALAK_LOOK,
    f: fr,
    lifeF: fr,
    pose: "holdToChest",
    holding: "doll",
    // quiet with his doll while his uncle grumbles; a glance at Thakurma when she speaks; up to her on the beat
    watchHeld: track(fr, [
      [S4A.from + 40, 0.65],
      [S4A.from + 60, 0.15, "inOut"],
      [S4A.from + 120, 0.15],
      [S4A.from + 140, 0.65, "inOut"],
      [S4B.from - 2, 0.65],
      [S4B.from + 14, 0.25, "inOut"],
      [GLOW_BEAT - 4, 0.25],
      [GLOW_BEAT + 14, 0, "inOut"],
    ]),
    face: {
      lookX: lerp(
        track(fr, [
          [S4A.from + 40, 0.2],
          [S4A.from + 60, -0.35, "inOut"],
          [S4A.from + 120, -0.35],
          [S4A.from + 140, 0.2, "inOut"],
          [S4B.from - 2, 0.2],
          [S4B.from + 14, 0.5, "inOut"],
        ]),
        0.95,
        up,
      ),
      smile: lerp(0.4, 0.62, glowK(fr)),
      eyesDown: lerp(0.25, 0, up),
    },
    expression: "serene",
    // the slow blink of BAL-14, after his eyes reach her
    blinkAt: GLOW_BEAT + 40,
    mouth: 0,
  };
};
/** Balak's near shoulder (world, facing Thakurma) for her hand: from the rig's own head point each frame. */
const balakShoulder = (fr: number): V => {
  const a = seatedEp6Anchors(balakProps(fr));
  // the top of the shoulder NEAREST her (his right on screen), toward his back: her arm comes from behind and beside
  // him and the hand rests on that shoulder (it used to land near his neck, so the arm crossed in front of his chest)
  return { x: a.head.x + 38 * BALAK.s, y: a.head.y + 40 * BALAK.s };
};
const BALAK_HEAD = seatedEp6Anchors(balakProps(GLOW_BEAT)).head;

/* ------------------------------------------------------------------ */
/* The adults                                                           */
/* ------------------------------------------------------------------ */

/**
 * Gesture pass (2026-11-25): every gesture is keyed to the words (phrase onsets from the clip's silences: 04a "কী যে
 * কালাপাহাড়…" 5, "ঠাকুর-দেবতা…" 82, "হুকুম দিচ্ছি" 154, "ওকে যেন…" 183, "ঠাকুরঘরে…না হয়!" 198; 04b "দেখিস," 83,
 * "এই কালাপাহাড়ই…" 108), eased in and out, the arms overlapping (one lands while the other is still settling), and
 * nobody holds a pose for more than about 20 frames outside P7/P8 without breath, a nod or a glance.
 */
const harendraBase = (fr: number): Partial<Pose> => {
  // "কী যে কালাপাহাড় এল আমাদের ঘরে!": the near palm goes to his forehead (exasperation), then down; with the head
  // shake. (A flung-up hand read as a stiff straight arm at this distance.)
  const fling = track(fr, [
    [S4A.from + 10, 0],
    [S4A.from + 24, 1, "inOut"],
    [S4A.from + 48, 1],
    [S4A.from + 66, 0, "inOut"],
  ]);
  // "ঠাকুর-দেবতা কিচ্ছু মানছে না!": both palms turned up at the waist ("what is to be done?"), the far hand a beat
  // later than the near one (overlap), a small shake of the palms on "কিচ্ছু"
  const palmsN = track(fr, [
    [A_GODS - 8, 0],
    [A_GODS + 6, 1, "inOut"],
    [A_ORDER - 30, 1],
    [A_ORDER - 12, 0, "inOut"],
  ]);
  const palmsF = track(fr, [
    [A_GODS - 4, 0],
    [A_GODS + 12, 1, "inOut"],
    [A_ORDER - 26, 1],
    [A_ORDER - 8, 0, "inOut"],
  ]);
  const palmShake = wobble(fr, A_GODS + 14, 40, 7, 13);
  const chin = track(fr, [
    [A_ORDER - 4, 0],
    [A_ORDER + 10, 1, "inOut"],
    [A_WARN + 30, 1],
    [S4A.to + 20, 0.3, "inOut"],
  ]);
  // the raised warning index finger (MOT-21) from "হুকুম দিচ্ছি" through the order, with a small beat on each
  // stressed word ("ঠাকুরঘরে", "না হয়!"), then lowered
  const warn = track(fr, [
    [A_ORDER - 10, 0],
    [A_ORDER + 6, 1, "inOut"],
    [S4A.to - 4, 1],
    [S4A.to + 14, 0, "inOut"],
  ]);
  const beats =
    Math.max(0, wobble(fr, S4A.from + 196, 22, 1, 11, 4)) + Math.max(0, wobble(fr, S4A.from + 236, 22, 1, 11, 4));
  // after the order: his hands clasp behind his back, the stern elder listening (never frozen: the head and breath
  // go on, and he glances doubtfully at Thakurma as she speaks)
  const behind = track(fr, [
    [S4A.to + 10, 0],
    [S4A.to + 34, 1, "inOut"],
  ]);
  const soften = track(fr, [
    [GLOW_BEAT, 0],
    [GLOW_BEAT + 40, 1, "inOut"],
  ]);
  const toThakurma = track(fr, [
    [S4B.from + 4, 0],
    [S4B.from + 22, 1, "inOut"],
  ]);
  const near = warn;
  const palms = Math.max(palmsN, palmsF);
  return {
    bodyTurn: safeBodyTurn(0.3),
    headTurn:
      0.34 +
      headShake(fr, S4A.from + 4, 58, 0.22, 2.5) +
      headShake(fr, A_GODS + 2, 44, 0.12, 2) +
      0.06 * near +
      0.12 * toThakurma +
      headShake(fr, GLOW_BEAT + 20, 40, 0.06, 1.5),
    headTilt: headShakeTilt(fr, S4A.from + 4, 58, 2.5, 2.5) - 3 * chin + 2 * soften,
    headNod: -3 * chin + headNods(fr, A_WARN + 34, 2, 14, 3) + 2.5 * beats,
    brow: lerp(-0.4, -0.15, soften) + 0.3 * palms + 0.25 * fling,
    browTilt: lerp(-0.75, -0.35, soften) + 0.4 * palms,
    lid: 0.12,
    smile: 0,
    lean: 2 + 3 * near - 2 * chin + 1.5 * beats - 1.5 * behind,
    // camera-near (left) arm: flung up, palms up, then the raised warning index finger (jab toward HARENDRA_WARN_AT)
    jab: -(near * (0.9 + 0.1 * beats)),
    lS: lerp(lerp(4, GESTURES.palmsUp.lS!, palmsN * (1 - near)), GESTURES.palmToForehead.rS!, fling) + palmShake * palmsN * 0.4,
    lE: lerp(lerp(-22, GESTURES.palmsUp.lE!, palmsN * (1 - near)), GESTURES.palmToForehead.rE!, fling) + palmShake * palmsN,
    lHand: near > 0.35 ? "point" : palmsN > 0.3 || fling > 0.2 ? "open" : "relaxed",
    // the far hand: palms up with the near one, otherwise easy at his side
    rS: lerp(4, GESTURES.palmsUp.rS!, palmsF) + palmShake * palmsF * 0.4,
    rE: lerp(-26, GESTURES.palmsUp.rE!, palmsF) + palmShake * palmsF,
    rHand: palmsF > 0.3 ? "open" : "relaxed",
    behind,
  };
};
/** Where his raised warning finger points: up and forward above his head (a warning, not a jab at anyone). */
const HARENDRA_WARN_AT: V = { x: HARENDRA.x + 200, y: HARENDRA.y - 400 * HARENDRA.s };
const harendraActing = withGhibliActing(harendraBase, { personality: "stomp", seed: 19, speechRms: harendraTalk, speechActAmp: 0.7 });

const charuBase = (fr: number): Partial<Pose> => {
  // she glances at her boy when Harendra calls him a "কালাপাহাড়", eyes down (worried) at the order
  const toBoy = track(fr, [
    [S4A.from + 20, 0],
    [S4A.from + 34, 1, "inOut"],
    [S4A.from + 70, 1],
    [S4A.from + 86, 0, "inOut"],
  ]);
  const worry = track(fr, [
    [A_ORDER, 0],
    [A_ORDER + 20, 1, "inOut"],
    [S4B.from, 1],
    [S4B.from + 20, 0, "inOut"],
  ]);
  const toThakurma = track(fr, [
    [S4B.from - 8, 0],
    [S4B.from + 16, 1, "inOut"],
  ]);
  const moved = track(fr, [
    [GLOW_BEAT + 20, 0],
    [GLOW_BEAT + 70, 1, "inOut"],
  ]);
  // moved by the prophecy, she slowly joins her palms at her chest (a wordless pranam to what she hears)
  const join = track(fr, [
    [GLOW_BEAT + 24, 0],
    [GLOW_BEAT + 64, 1, "inOut"],
  ]);
  // her hands in the lap shift a little as she listens (no frozen hands)
  const settle = wobble(fr, S4A.from + 40, 200, 3, 70, 20);
  return {
    kneel: 1,
    lean: 0.8 + 1.2 * worry + 1.5 * join,
    bodyTurn: safeBodyTurn(0.12),
    headTurn: lerp(-0.42 + 0.3 * toBoy, 0.4, toThakurma),
    headTilt: 2 + 3 * moved + 2 * worry,
    // she nods gravely at the order
    headNod: headNods(fr, A_WARN + 30, 2, 16, 4) + 2 * toThakurma + 3 * worry,
    eyeY: lerp(0.05 + 0.25 * worry, 0.2, toThakurma),
    eyeX: 0.15 * toBoy,
    brow: lerp(0.15 + 0.2 * worry, 0.35, moved),
    browTilt: lerp(0.25 + 0.3 * worry, 0.45, moved),
    smile: lerp(0.08 - 0.06 * worry, 0.5, moved),
    cheeks: 0.3 * moved,
    tears: 0.16 * moved,
    lid: 0.08 * moved + 0.12 * worry,
    join,
    rS: 4 + settle * 0.3,
    rE: -40 + settle,
    lS: -4,
    lE: -40 - settle * 0.6,
    rHand: join > 0.3 ? "pranam" : "relaxed",
    lHand: join > 0.3 ? "pranam" : "relaxed",
  };
};
const charuActing = withGhibliActing(charuBase, { personality: "mother", seed: 31, wind: 0.28 });

const jyethiBase = (fr: number): Partial<Pose> => {
  // scandalised agreement with Harendra: a hand to her cheek on "ঠাকুর-দেবতা কিচ্ছু মানছে না!", a glance at
  // Charu, grave nods at the order
  const cheek = track(fr, [
    [A_GODS - 2, 0],
    [A_GODS + 14, 1, "inOut"],
    [A_ORDER + 4, 1],
    [A_ORDER + 22, 0, "inOut"],
  ]);
  const toCharu = track(fr, [
    [A_ORDER + 10, 0],
    [A_ORDER + 24, 1, "inOut"],
    [A_WARN + 20, 1],
    [A_WARN + 36, 0, "inOut"],
  ]);
  const toThakurma = track(fr, [
    [S4B.from - 4, 0],
    [S4B.from + 18, 1, "inOut"],
  ]);
  // the prophecy surprises her: fingertips to her lips, brows up
  const surprised = track(fr, [
    [GLOW_BEAT + 6, 0],
    [GLOW_BEAT + 24, 1, "inOut"],
  ]);
  const lips = track(fr, [
    [GLOW_BEAT + 10, 0],
    [GLOW_BEAT + 28, 0.8, "inOut"],
  ]);
  return {
    bodyTurn: safeBodyTurn(0.26),
    headTurn: lerp(-0.3 + 0.35 * toCharu, 0.42, toThakurma) + headShake(fr, A_GODS + 4, 40, 0.1, 2),
    headTilt: 3 * cheek,
    headNod: headNods(fr, A_WARN + 24, 2, 15, 4),
    brow: 0.15 + 0.3 * cheek + 0.45 * surprised,
    browTilt: 0.2 + 0.3 * cheek,
    eyeY: 0.15 * toThakurma + 0.15 * toCharu,
    smile: 0.12 - 0.08 * cheek,
    gasp: 0.15 * surprised,
    mouthHand: -Math.max(cheek, lips),
    rS: 4,
    rE: -48,
    lS: -4,
    lE: -48,
  };
};
const jyethiActing = withGhibliActing(jyethiBase, { personality: "mother", seed: 77 });

const thakurmaBase = (fr: number): Partial<Pose> => {
  const speak = track(fr, [
    [S4B.from - 10, 0],
    [S4B.from + 12, 1, "inOut"],
  ]);
  // her near (right) hand goes to Balak's shoulder as she starts, and stays there (it rests on him from behind)
  const hand = track(fr, [
    [S4B.from - 8, 0],
    [S4B.from + 14, 1, "inOut"],
  ]);
  const beat = track(fr, [
    [GLOW_BEAT - 6, 0],
    [GLOW_BEAT + 20, 1, "inOut"],
  ]);
  return {
    kneel: 1,
    bodyTurn: safeBodyTurn(-0.34),
    // a knowing glance at Balak during the grumble (and a small amused shake of the head at the order), warmly to the
    // family as she speaks, to the boy on the beat
    headTurn:
      lerp(
        track(fr, [
          [A_GODS, -0.32],
          [A_GODS + 20, -0.05, "inOut"],
          [A_ORDER, -0.05],
          [A_ORDER + 20, -0.32, "inOut"],
        ]),
        -0.5,
        speak,
      ) +
      0.2 * beat +
      headShake(fr, A_WARN + 40, 36, 0.06, 1.5),
    headTilt: -2 - 3 * speak + 3 * beat,
    headNod: 2 + 3 * beat + headNods(fr, B_DEKHIS - 2, 1, 16, 4),
    eyeY: 0.12 + 0.1 * beat,
    brow: 0.12 + 0.12 * speak,
    smile: lerp(0.38, 0.6, Math.max(speak * 0.6, beat)),
    cheeks: 0.15 + 0.15 * beat,
    lid: 0.1,
    // a small lean toward him: her shoulder stays above his, so the arm comes DOWN onto his shoulder from behind
    // (a deep lean dropped her shoulder to his chest height and the arm read as a bar across him)
    lean: 0.6 + 2.5 * hand,
    reach: hand,
    reachUp: 0,
    rHand: hand > 0.4 ? "open" : "relaxed",
    // before the reach the near hand rests on her near thigh (it no longer hangs straight down)
    rS: 10,
    rE: -24,
    // the far hand rests on her own far thigh, in her lap: it never crosses her body (it used to lie across her waist)
    lS: 10,
    lE: -16,
    lHand: "relaxed",
  };
};
const thakurmaActing = withGhibliActing(thakurmaBase, { personality: "mother", seed: 47, speechRms: thakurmaTalk, speechActAmp: 0.6 });

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

const frameAt = (cx: number, wy: number, sy: number, z: number): Cam => ({ x: cx - 960, y: wy - 540 - (sy - 540) / z, zoom: z, focus: 1 });

/** Shot 19 close-up zoom (start; the push ends 1.28x this). */
const CU_ZOOM = 6.6;
/** Shot 19 opening zoom (medium close: both faces). */
const CU_START_ZOOM = 4.1;

const cameraAt = (fr: number): Cam => {
  // Shot 17 + P7: medium wide group in depth, held; the nearest knees sit at screen y ~800, above the caption band
  if (fr < SHOT18) return frameAt(820, BALAK.y, 810, 1.72);
  // Shot 18: medium on Thakurma with her hand on the boy; the laps stay above the caption band
  // (framed lower and a touch wider so Jyethi, standing behind Charu, keeps her whole head in frame; every face
  // stays above the caption band; Harendra stays out at the left)
  if (fr < SHOT19) return frameAt(THAKURMA.x - 58, THAKURMA.y + KNEEL_HEAD_DY * THAKURMA.s, 430, 2.3);
  if (fr < CHARU_EYES) {
    // Shot 19 + P8: close-up on Balak (head and chest, his grandmother's hand on his shoulder), slow push 1.0 -> 1.28x
    // It opens as a medium close two-shot (Thakurma's face in frame while she still speaks) and pushes slowly in to
    // the close-up on the boy's glowing face for P8.
    const t = EASE.inOut(clamp((fr - SHOT19) / (CHARU_EYES - SHOT19)));
    return frameAt(lerp(1012, BALAK_HEAD.x + 22, t), BALAK_HEAD.y, lerp(540, 290, t), lerp(CU_START_ZOOM, CU_ZOOM * 1.2, t));
  }
  // last second of P8: Charu's moved eyes, on the left third, the glowing boy beside her; the left frame edge stays
  // right of Jyethi (standing behind her) so nobody is cut at the chest
  return frameAt(CHARU.x + 140, CHARU.y + KNEEL_HEAD_DY * CHARU.s, 440, 4.7);
};

/* ------------------------------------------------------------------ */
/* Motes                                                                */
/* ------------------------------------------------------------------ */

/**
 * Four slow motes in the close-up, all on HIM: they rise from his shoulders past his cheeks and fade before the top of
 * the frame (world units; at the close-up zoom 1 unit is about 9 screen px). They stay beside his head, off the face, and none drifts toward Thakurma.
 */
const MOTE_SPECS = [
  { dx: -42, startOffsetY: 40, speed: 0.16, swayAmp: 1.6, swayFreq: 0.046, phase: 0.4, r: 1.15, delay: 0 },
  { dx: -32, startOffsetY: 22, speed: 0.19, swayAmp: 1.3, swayFreq: 0.052, phase: 2.1, r: 0.95, delay: 16 },
  { dx: 32, startOffsetY: 34, speed: 0.17, swayAmp: 1.5, swayFreq: 0.043, phase: 3.8, r: 1.2, delay: 8 },
  { dx: 38, startOffsetY: 16, speed: 0.15, swayAmp: 1.2, swayFreq: 0.049, phase: 5.3, r: 1.0, delay: 26 },
] as const;
const MOTE_RISE = 64;

/** 4 slow-rising soft golden motes around Balak on the beat (BAL-11): soft dots, no rays. `seatY` = his head centre. */
const SacredGoldenMotes: React.FC<{ cx: number; seatY: number; f: number; startFrame: number; intensity: number }> = ({
  cx,
  seatY,
  f,
  startFrame,
  intensity,
}) => {
  const uid = `sgm-${useId().replace(/:/g, "")}`;
  if (intensity <= 0.01 || f < startFrame) return null;
  return (
    <g pointerEvents="none" style={{ mixBlendMode: "screen" }}>
      <defs>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffef5" stopOpacity={0.9} />
          <stop offset="35%" stopColor="#ffe79e" stopOpacity={0.55} />
          <stop offset="72%" stopColor="#ffca5c" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#ffca5c" stopOpacity={0} />
        </radialGradient>
      </defs>
      {MOTE_SPECS.map((m, idx) => {
        const elapsed = Math.max(0, f - (startFrame + m.delay));
        const fadeIn = EASE.inOut(clamp(elapsed / 28, 0, 1));
        if (fadeIn <= 0.01) return null;
        const cycleRise = (elapsed * m.speed) % MOTE_RISE;
        const cycleEdge = cycleRise < 8 ? cycleRise / 8 : cycleRise > MOTE_RISE - 14 ? (MOTE_RISE - cycleRise) / 14 : 1;
        const mx = cx + m.dx + Math.sin(f * m.swayFreq + m.phase) * m.swayAmp;
        const my = seatY + m.startOffsetY - cycleRise;
        const op = intensity * fadeIn * cycleEdge * (0.82 + 0.18 * Math.sin(f * 0.05 + m.phase * 1.7));
        return (
          <g key={idx} transform={`translate(${mx.toFixed(2)}, ${my.toFixed(2)})`} opacity={op}>
            <circle cx={0} cy={0} r={m.r * 4.2} fill={`url(#${uid}-halo)`} />
            <circle cx={0} cy={0} r={m.r * 1.0} fill="#fffef7" opacity={0.95} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * THE GLOW BEAT halo (BAL-06/07/11): a soft warm-white to golden radial glow behind his head, about twice the head's
 * size, fading to nothing at its edge (no rings, no rays). Normal blend so it holds against the pale courtyard wall;
 * `k` 0..1 is the beat's rise.
 */
const BeatHalo: React.FC<{ cx: number; cy: number; r: number; k: number; f: number }> = ({ cx, cy, r, k }) => {
  if (k <= 0.01) return null;
  return (
    <g pointerEvents="none" opacity={k}>
      <defs>
        <radialGradient id="ep04g-s04-beat-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffaea" stopOpacity={0.95} />
          <stop offset="40%" stopColor="#fff0c2" stopOpacity={0.82} />
          <stop offset="62%" stopColor="#ffdc8a" stopOpacity={0.5} />
          <stop offset="82%" stopColor="#ffc965" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#ffc965" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="url(#ep04g-s04-beat-halo)" />
    </g>
  );
};

/**
 * The low amber afternoon sun from the left (STO-22c: people take the light of the place): a warm soft-light pass that
 * is strongest on the sunlit (left, upper) side of the group and cools a little toward the shade side, so the figures
 * are modelled rather than flat. Natural light over everyone and the ground; it is not the divine glow.
 */
const AmberAfternoonLight: React.FC = () => (
  <GhibliLayer depth={1.0} blend="soft-light">
    <defs>
      <linearGradient id="ep04g-s04-amber" gradientUnits="userSpaceOnUse" x1={420} y1={360} x2={1360} y2={980}>
        <stop offset="0%" stopColor="#ffb257" stopOpacity={0.72} />
        <stop offset="55%" stopColor="#ffc27a" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#5d4a78" stopOpacity={0.3} />
      </linearGradient>
    </defs>
    <rect x={-1600} y={-1200} width={5200} height={3600} fill="url(#ep04g-s04-amber)" />
  </GhibliLayer>
);

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene04KailashpatiProphecyGhibli: React.FC = () => {
  const f = useCurrentFrame();
  const cam = cameraAt(f);
  cam.dof = zoomProportionalDof(cam.zoom, 0.28, 0.42, 1.55);

  const bp = balakProps(f);
  const anchors = seatedEp6Anchors(bp);
  const g = glowK(f);
  const glowAt = anchors.glowAnchor;
  const shoulder = balakShoulder(f);
  // Shot 19: in the close-up her body is soft (rack focus on the boy); only her hand on his shoulder stays sharp
  const inCloseUp = f >= SHOT19 && f < CHARU_EYES;
  /** The rack focus onto the boy: 0 while her face is in the two-shot and she speaks; it eases to 1 over a second as
   * her line ends and the push closes in on him (P8). */
  const thkSoft = inCloseUp ? EASE.inOut(clamp((f - (S4B.to - 12)) / 24)) : 0;
  const thkX = THAKURMA.x;
  const thakurmaEl = (
    <Puppet
      cast={EP04G_CAST.thakurma}
      sitStyle="kneel"
      softSleeves
      x={thkX}
      y={THAKURMA.y}
      scale={THAKURMA.s}
      f={f}
      lifeF={f}
      light={EP04G_AFTERNOON_LIGHT}
      seated
      acting={thakurmaActing}
      mouth={thakurmaMouth}
      talk={thakurmaTalk}
      reachAt={balakShoulder}
    />
  );

  return (
    <GhibliStage cam={cam}>
      <GhibliPreload files={PRELOAD} />
      <GhibliCourtyardBackdrop f={f} mode="afternoon" lampFlames={false} />
      <GhibliLayer depth={0.92} groundLocked parallaxDrift={-0.012}>
        <GhibliCutout file="images/ghibli_ep04/madur_mat_veranda_sketch.png" anchor={GHIBLI_ANCHORS.madur_mat_veranda_sketch} x={MAT.x} y={MAT.y} targetHeight={MAT.h} />
      </GhibliLayer>

      {/* close-up: no full Thakurma body (ghost arms read as floating shadows); her hand is clipped sharp on him */}
      <GhibliLayer depth={1.0}>
        <GhibliCharFilterDefs f={f} rimDir={-1} sunColor="#ffd08a" />
        {/* Balak's own fine ink line (zoom-independent); its warm rim rises a little with the glow beat */}
        <Ep04BalakInkDefs zoom={cam.zoom} rim={lerp(0.5, 0.8, g)} />

        {/* Harendra Thakur (left, furthest back): the grumble and the order */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={HARENDRA.x} y={HARENDRA.y} rx={58} ry={12} opacity={0.28} sunDir={-1} castStretch={1.2} />
          <Puppet
            cast={EP04G_CAST.harendra}
            x={HARENDRA.x}
            y={HARENDRA.y}
            scale={HARENDRA.s}
            f={f}
            lifeF={f}
            light={EP04G_AFTERNOON_LIGHT}
            acting={harendraActing}
            pointAt={() => HARENDRA_WARN_AT}
            mouth={harendraMouth}
            talk={harendraTalk}
            breathRate={track(f, [
              [S4A.from, 1.25],
              [S4A.to + 60, 1, "inOut"],
            ])}
          />
        </g>

        {/* Jyethi (middle ground, standing behind Charu) */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={JYETHI.x} y={JYETHI.y} rx={40} ry={9.5} opacity={0.26} sunDir={-1} castStretch={1.15} />
          <Puppet
            cast={EP04G_CAST.jyethi}
            x={JYETHI.x}
            y={JYETHI.y}
            scale={JYETHI.s}
            f={f}
            lifeF={f}
            light={EP04G_AFTERNOON_LIGHT}
            acting={jyethiActing}
          />
        </g>

        {/* Charu, kneeling nearest the camera: grave at the order, moved to tears at the prophecy */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={CHARU.x + 6} y={CHARU.y} rx={86} ry={15} opacity={0.3} sunDir={-1} castStretch={1.2} />
          <Puppet
            cast={EP04G_CAST.charu}
            sitStyle="kneel"
            softSleeves
            x={CHARU.x}
            y={CHARU.y}
            scale={CHARU.s}
            f={f}
            lifeF={f}
            light={EP04G_AFTERNOON_LIGHT}
            seated
            acting={charuActing}
            sigh={(fr) => {
              // a quiet moved breath as the words land
              const t = fr - (GLOW_BEAT + 30);
              if (t <= 0 || t >= 80) return 0;
              return t < 26 ? Math.sin((Math.PI / 2) * (t / 26)) : Math.pow(1 - (t - 26) / 54, 1.4);
            }}
          />
        </g>

        {/* Thakurma, kneeling just behind him at the right: the prophecy (drawn before him: she is further back) */}
        {/* In the close-up the focus racks onto the boy: her body goes soft (so no hard rig edge or the band of her
            waist reads as a line across her lap), while her hand on his shoulder stays sharp (below). */}
        <defs>
          <filter id="ep04g-s04-thk-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={Math.max(0.001, 1.6 * thkSoft)} />
          </filter>
        </defs>
        <g filter={thkSoft > 0.01 ? "url(#ep04g-s04-thk-soft)" : undefined}>
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={thkX - 6} y={THAKURMA.y} rx={84} ry={15} opacity={0.3} sunDir={-1} castStretch={1.2} />
            {thakurmaEl}
          </g>
        </g>

        {/* Balak on the mat with his doll, and the episode's one gentle glow beat (BAL-11 / BAL-05: 0.55 → ~0.95) */}
        <Ep04BalakGroundGlow x={BALAK.x} y={BALAK.y + 4} rx={lerp(110, 132, g)} ry={lerp(20, 24, g)} level={lerp(0.38, 0.68, g)} />
        {/* his restrained halo behind the head: head-sized, so it reads in the close-up (BAL-06); it brightens on the beat */}
        <Ep04BalakDivine cx={glowAt.cx} cy={glowAt.cy} r={glowAt.r * lerp(0.56, 0.62, g)} glow={lerp(0.55, 0.95, g)} f={f} />
        {/* the beat (BAL-26f): only the halo behind his head brightens gently over 2 s, then holds; no whole-body
            rim or outline */}
        <BeatHalo cx={glowAt.cx} cy={glowAt.cy - 4 * BALAK.s} r={glowAt.r * 0.62} k={g} f={f} />
        <g filter="url(#ep04-balak-ink)">
          <ContactShadow x={BALAK.x} y={BALAK.y} rx={48} ry={10} opacity={0.28} sunDir={-1} castStretch={1.15} />
          <SeatedChild {...bp} inkZoom={cam.zoom} />
          <GhibliBalakLapDetails x={BALAK.x} y={BALAK.y} s={BALAK.s} f={f} />
        </g>
        {/* her hand on his shoulder (always): same Thakurma again, shown only round her palm and wrist through a
            feathered mask (a hard clip edge used to cut across her forearm in the close-up), so the hand rests ON him
            while her forearm passes behind his shoulder */}
        <defs>
          <filter id="ep04g-s04-thk-feather" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={5} />
          </filter>
          <mask id="ep04g-s04-thk-hand" maskUnits="userSpaceOnUse" x={shoulder.x - 90} y={shoulder.y - 80} width={200} height={170}>
            {/* a solid core over the whole hand (it must read opaque, ON his shoulder), feathered only toward her wrist */}
            <ellipse cx={shoulder.x + 4} cy={shoulder.y + 2} rx={26} ry={17} fill="#fff" filter="url(#ep04g-s04-thk-feather)" />
            <ellipse cx={shoulder.x - 6} cy={shoulder.y + 2} rx={19} ry={14} fill="#fff" />
          </mask>
        </defs>
        <g mask="url(#ep04g-s04-thk-hand)">
          <g filter="url(#ghibli-char-ink)">{thakurmaEl}</g>
        </g>
        {/* the 4 slow motes rise on him only, in the close-up (not in the cut to Charu) */}
        <SacredGoldenMotes cx={glowAt.cx} seatY={glowAt.cy} f={f} startFrame={GLOW_BEAT} intensity={inCloseUp ? g : 0} />

      </GhibliLayer>

      <AmberAfternoonLight />
      <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} warmth={lerp(0.34, 0.4, g)} />
    </GhibliStage>
  );
};
