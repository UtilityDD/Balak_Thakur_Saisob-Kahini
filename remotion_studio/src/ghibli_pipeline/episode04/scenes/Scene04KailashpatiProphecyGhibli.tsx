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
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { zoomProportionalDof } from "../../core/ghibliMotion";
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
const HARENDRA = { x: 470, y: 776, s: 0.94 };
const JYETHI = { x: 680, y: 790, s: 0.98 };
const CHARU = { x: 820, y: 812, s: 1.0 };
const BALAK = { x: 960, y: 808, s: 0.72 };
const THAKURMA = { x: 1088, y: 794, s: 1.0 };
/** The madur mat under Balak and Thakurma (drawn here at the figures' ground line, not by the backdrop). */
const MAT = { x: 985, y: 850, h: 116 };
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
/** Balak's shoulder (world, the near one, facing Thakurma) for her hand: from the rig's own head point each frame. */
const balakShoulder = (fr: number): V => {
  const a = seatedEp6Anchors(balakProps(fr));
  return { x: a.head.x + 12 * BALAK.s, y: a.head.y + 60 * BALAK.s };
};
const BALAK_HEAD = seatedEp6Anchors(balakProps(GLOW_BEAT)).head;

/* ------------------------------------------------------------------ */
/* The adults                                                           */
/* ------------------------------------------------------------------ */

const harendraBase = (fr: number): Partial<Pose> => {
  // exasperated palms on "ঠাকুর-দেবতা কিচ্ছু মানছে না!", chin up on "হুকুম দিচ্ছি", the warning finger on the order
  const palms = track(fr, [
    [A_GODS - 6, 0],
    [A_GODS + 8, 1, "inOut"],
    [A_ORDER - 16, 1],
    [A_ORDER - 2, 0, "inOut"],
  ]);
  const chin = track(fr, [
    [A_ORDER - 4, 0],
    [A_ORDER + 10, 1, "inOut"],
    [A_WARN + 30, 1],
    [S4A.to + 20, 0.3, "inOut"],
  ]);
  const warn = track(fr, [
    [A_WARN - 2, 0],
    [A_WARN + 14, 1, "inOut"],
    [S4A.to + 8, 1],
    [S4A.to + 30, 0, "inOut"],
  ]);
  // listening to Thakurma: the sternness eases a little, a doubtful glance
  const soften = track(fr, [
    [GLOW_BEAT, 0],
    [GLOW_BEAT + 40, 1, "inOut"],
  ]);
  const near = warn > 0.01 ? warn : 0;
  return {
    bodyTurn: 0.3,
    headTurn: 0.34 + headShake(fr, S4A.from + 4, 58, 0.22, 2.5) + 0.06 * near,
    headTilt: headShakeTilt(fr, S4A.from + 4, 58, 2.5, 2.5) - 3 * chin,
    headNod: -3 * chin + headNods(fr, A_WARN + 34, 2, 14, 3),
    brow: lerp(-0.4, -0.15, soften) + 0.3 * palms,
    browTilt: lerp(-0.75, -0.35, soften) + 0.4 * palms,
    lid: 0.12,
    smile: 0,
    lean: 2 + 3 * near - 2 * chin,
    // the near (left) arm: palms up, then the raised warning index finger with a small firm wag
    lS: lerp(lerp(6, GESTURES.palmsUp.lS!, palms), -40, near),
    lE: lerp(lerp(-10, GESTURES.palmsUp.lE!, palms), -100, near) + wobble(fr, A_WARN + 16, 56, 7, 14) * near,
    lHand: near > 0.4 ? "point" : palms > 0.4 ? "open" : "relaxed",
    rS: lerp(6, GESTURES.palmsUp.rS!, palms),
    rE: lerp(-10, GESTURES.palmsUp.rE!, palms),
    rHand: palms > 0.4 ? "open" : "relaxed",
  };
};
const harendraActing = withGhibliActing(harendraBase, { personality: "stomp", seed: 19, speechRms: harendraTalk, speechActAmp: 0.7 });

const charuBase = (fr: number): Partial<Pose> => {
  const toThakurma = track(fr, [
    [S4B.from - 8, 0],
    [S4B.from + 16, 1, "inOut"],
  ]);
  const moved = track(fr, [
    [GLOW_BEAT + 20, 0],
    [GLOW_BEAT + 70, 1, "inOut"],
  ]);
  return {
    kneel: 1,
    bodyTurn: 0.12,
    headTurn: lerp(-0.42, 0.4, toThakurma),
    headTilt: 2 + 3 * moved,
    // she nods gravely at the order
    headNod: headNods(fr, A_WARN + 30, 2, 16, 4) + 2 * toThakurma,
    eyeY: lerp(0.05, 0.2, toThakurma),
    brow: lerp(0.15, 0.35, moved),
    browTilt: lerp(0.25, 0.45, moved),
    smile: lerp(0.08, 0.5, moved),
    cheeks: 0.3 * moved,
    tears: 0.16 * moved,
    lid: 0.08 * moved,
    rS: 4,
    rE: -40,
    lS: -4,
    lE: -40,
    rHand: "relaxed",
    lHand: "relaxed",
  };
};
const charuActing = withGhibliActing(charuBase, { personality: "mother", seed: 31, wind: 0.28 });

const jyethiBase = (fr: number): Partial<Pose> => {
  const toThakurma = track(fr, [
    [S4B.from - 4, 0],
    [S4B.from + 18, 1, "inOut"],
  ]);
  const surprised = track(fr, [
    [GLOW_BEAT + 6, 0],
    [GLOW_BEAT + 24, 1, "inOut"],
  ]);
  return {
    bodyTurn: 0.26,
    headTurn: lerp(-0.3, 0.42, toThakurma),
    headNod: headNods(fr, A_WARN + 24, 2, 15, 4),
    brow: 0.15 + 0.45 * surprised,
    browTilt: 0.2,
    eyeY: 0.15 * toThakurma,
    smile: 0.12,
    gasp: 0.15 * surprised,
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
  // her near (right) hand goes to Balak's shoulder as she starts, and stays there
  const hand = track(fr, [
    [S4B.from - 6, 0],
    [S4B.from + 12, 1, "inOut"],
  ]);
  const beat = track(fr, [
    [GLOW_BEAT - 6, 0],
    [GLOW_BEAT + 20, 1, "inOut"],
  ]);
  // "দেখিস," : the free hand lifts, palm open, toward the family
  const dekhis = track(fr, [
    [B_DEKHIS - 10, 0],
    [B_DEKHIS + 4, 1, "inOut"],
    [S4B.to + 10, 1],
    [S4B.to + 40, 0.3, "inOut"],
  ]);
  return {
    kneel: 1,
    bodyTurn: -0.34,
    // a knowing glance at Balak during the grumble, warmly to the family as she speaks, to the boy on the beat
    headTurn:
      lerp(track(fr, [
        [A_GODS, -0.32],
        [A_GODS + 20, -0.05, "inOut"],
        [A_ORDER, -0.05],
        [A_ORDER + 20, -0.32, "inOut"],
      ]), -0.5, speak) + 0.2 * beat,
    headTilt: -2 - 3 * speak + 3 * beat,
    headNod: 2 + 3 * beat + headNods(fr, B_DEKHIS - 2, 1, 16, 4),
    eyeY: 0.12 + 0.1 * beat,
    brow: 0.12 + 0.12 * speak,
    smile: lerp(0.38, 0.6, Math.max(speak * 0.6, beat)),
    cheeks: 0.15 + 0.15 * beat,
    lid: 0.1,
    lean: 2 + 3 * hand,
    reach: hand,
    reachUp: 0,
    rHand: "open",
    // the free hand stays in her lap (any gesture toward the family would cross the boy); "দেখিস" is a nod
    lS: -4 + 3 * dekhis,
    lE: -42 + 6 * dekhis,
    lHand: "relaxed",
  };
};
const thakurmaActing = withGhibliActing(thakurmaBase, { personality: "mother", seed: 47, speechRms: thakurmaTalk, speechActAmp: 0.6 });

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

const frameAt = (cx: number, wy: number, sy: number, z: number): Cam => ({ x: cx - 960, y: wy - 540 - (sy - 540) / z, zoom: z, focus: 1 });

const cameraAt = (fr: number): Cam => {
  if (fr < SHOT18) return frameAt(812, CHARU.y, 905, 1.55); // Shot 17 + P7: medium wide group, held
  if (fr < SHOT19) return frameAt(1036, THAKURMA.y + KNEEL_HEAD_DY, 420, 2.6); // Shot 18: Thakurma, hand on Balak
  if (fr < CHARU_EYES) {
    // Shot 19 + P8: close-up on Balak, slow push 1.0 -> 1.28x
    const t = EASE.inOut(clamp((fr - SHOT19) / (CHARU_EYES - SHOT19)));
    return frameAt(BALAK_HEAD.x + 18, BALAK_HEAD.y, 450, lerp(5.2, 6.65, t));
  }
  return frameAt(CHARU.x + 6, CHARU.y + KNEEL_HEAD_DY, 440, 5.0); // last second of P8: Charu's moved eyes
};

/* ------------------------------------------------------------------ */
/* Motes                                                                */
/* ------------------------------------------------------------------ */

const MOTE_SPECS = [
  { dx: -62, startOffsetY: -64, speed: 0.34, swayAmp: 6.5, swayFreq: 0.046, phase: 0.4, r: 3.4, delay: 0 },
  { dx: -32, startOffsetY: -102, speed: 0.41, swayAmp: 5.2, swayFreq: 0.052, phase: 2.1, r: 2.8, delay: 14 },
  { dx: 36, startOffsetY: -82, speed: 0.37, swayAmp: 6.0, swayFreq: 0.043, phase: 3.8, r: 3.6, delay: 8 },
  { dx: 66, startOffsetY: -114, speed: 0.31, swayAmp: 5.6, swayFreq: 0.049, phase: 5.3, r: 3.0, delay: 22 },
] as const;

/** 4 slow-rising soft golden motes around Balak on the beat (BAL-11): soft dots, no rays. */
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
        const cycleRise = (elapsed * m.speed) % 108;
        const cycleEdge = cycleRise < 14 ? cycleRise / 14 : cycleRise > 88 ? (108 - cycleRise) / 20 : 1;
        const mx = cx + m.dx + Math.sin(f * m.swayFreq + m.phase) * m.swayAmp;
        const my = seatY + m.startOffsetY - cycleRise;
        const op = intensity * fadeIn * cycleEdge * (0.82 + 0.18 * Math.sin(f * 0.05 + m.phase * 1.7));
        return (
          <g key={idx} transform={`translate(${mx.toFixed(2)}, ${my.toFixed(2)})`} opacity={op}>
            <circle cx={0} cy={0} r={m.r * 3.2} fill={`url(#${uid}-halo)`} />
            <circle cx={0} cy={0} r={m.r * 0.8} fill="#fffef7" opacity={0.9} />
          </g>
        );
      })}
    </g>
  );
};

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

  return (
    <GhibliStage cam={cam}>
      <GhibliPreload files={PRELOAD} />
      <GhibliCourtyardBackdrop f={f} mode="afternoon" />
      <GhibliLayer depth={0.92} groundLocked parallaxDrift={-0.012}>
        <GhibliCutout file="images/ghibli_ep04/madur_mat_veranda_sketch.png" anchor={GHIBLI_ANCHORS.madur_mat_veranda_sketch} x={MAT.x} y={MAT.y} targetHeight={MAT.h} />
      </GhibliLayer>

      <GhibliLayer depth={1.0}>
        <GhibliCharFilterDefs f={f} rimDir={-1} sunColor="#ffd08a" />

        {/* Harendra Thakur (left): the grumble and the order */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={HARENDRA.x} y={HARENDRA.y} rx={48} ry={11} opacity={0.3} sunDir={-1} castStretch={1.25} />
          <Puppet
            cast={EP04G_CAST.harendra}
            x={HARENDRA.x}
            y={HARENDRA.y}
            scale={HARENDRA.s}
            f={f}
            lifeF={f}
            light={EP04G_AFTERNOON_LIGHT}
            acting={harendraActing}
            mouth={harendraMouth}
            talk={harendraTalk}
            breathRate={track(f, [
              [S4A.from, 1.25],
              [S4A.to + 60, 1, "inOut"],
            ])}
          />
        </g>

        {/* Jyethi (standing behind Charu) */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={JYETHI.x} y={JYETHI.y} rx={42} ry={10} opacity={0.28} sunDir={-1} castStretch={1.2} />
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

        {/* Charu, kneeling on the mat: grave at the order, moved to tears at the prophecy */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={CHARU.x + 8} y={CHARU.y} rx={56} ry={11} opacity={0.3} sunDir={-1} castStretch={1.25} />
          <Puppet
            cast={EP04G_CAST.charu}
            x={CHARU.x}
            y={CHARU.y}
            scale={CHARU.s}
            f={f}
            lifeF={f}
            light={EP04G_AFTERNOON_LIGHT}
            acting={charuActing}
            sigh={(fr) => {
              // a quiet moved breath as the words land
              const t = fr - (GLOW_BEAT + 30);
              if (t <= 0 || t >= 80) return 0;
              return t < 26 ? Math.sin((Math.PI / 2) * (t / 26)) : Math.pow(1 - (t - 26) / 54, 1.4);
            }}
          />
        </g>

        {/* Balak on the mat with his doll, and the episode's one gentle glow beat (BAL-11) */}
        <GhibliBalakGroundGlow x={BALAK.x} y={BALAK.y + 4} rx={lerp(110, 132, g)} ry={lerp(20, 24, g)} level={lerp(0.42, 0.72, g)} />
        <GhibliBalakAura cx={glowAt.cx} cy={glowAt.cy} r={glowAt.r * lerp(0.62, 0.72, g)} glow={lerp(0.5, 0.86, g)} f={f} />
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={BALAK.x} y={BALAK.y} rx={46} ry={9.5} opacity={0.28} sunDir={-1} castStretch={1.2} />
          <SeatedChild {...bp} />
          <GhibliBalakLapDetails x={BALAK.x} y={BALAK.y} s={BALAK.s} f={f} />
        </g>
        <SacredGoldenMotes cx={glowAt.cx} seatY={glowAt.cy + 90} f={f} startFrame={GLOW_BEAT} intensity={g} />

        {/* Thakurma, kneeling at the right: the prophecy, her hand on his shoulder (drawn after him: her hand on top) */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={THAKURMA.x - 8} y={THAKURMA.y} rx={56} ry={11} opacity={0.3} sunDir={-1} castStretch={1.25} />
          <Puppet
            cast={EP04G_CAST.thakurma}
            x={THAKURMA.x}
            y={THAKURMA.y}
            scale={THAKURMA.s}
            f={f}
            lifeF={f}
            light={EP04G_AFTERNOON_LIGHT}
            acting={thakurmaActing}
            mouth={thakurmaMouth}
            talk={thakurmaTalk}
            reachAt={balakShoulder}
          />
        </g>
      </GhibliLayer>

      <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} warmth={lerp(0.34, 0.4, g)} />
    </GhibliStage>
  );
};
