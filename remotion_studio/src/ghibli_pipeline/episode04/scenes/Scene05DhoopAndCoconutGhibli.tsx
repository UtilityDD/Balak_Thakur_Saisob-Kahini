import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, lerp } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { Puppet, type PropRenderer } from "../../../cinematic/rig/Puppet";
import {
  DRINK_BOWL_AT,
  DRINK_BOWL_T,
  HELD_OBJECT_BOTTOM,
  HeldObject,
  HeldObjectArt,
  KNEEL_REACH_T,
  SeatedChild,
  type SeatedChildProps,
  seatedChildHands,
  SeatedExpression,
  SeatedPose,
  sighCurve,
} from "../../../episode03/rig/SeatedChild";
import { ContactShadow, GhibliCharFilterDefs, GhibliCutout, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { balakLivingBodyTransform, GhibliBalakLapDetails } from "../../core/ghibliBalak";
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { ghibliStrideOf, ghibliWalkSpot, safeBodyTurn, zoomProportionalDof } from "../../core/ghibliMotion";
import { GHIBLI_ANCHORS } from "../plateAnchors";
import { ep04gSpan, ep04gSpeakRms } from "../timing";
import {
  EP04G_CAST,
  EP04G_SHRINE_LIGHT,
  GhibliEp04ForegroundFinish,
  GhibliShrineBackdrop,
  GhibliSmokeCurls,
  mouthFromRms,
  poseOf,
} from "../Ep04GhibliShared";

/* ------------------------------------------------------------------------------------------------ */
/* Shrine staging shared by Scenes 05 and 06 (one owner: these two files)                            */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Shrine-room blocking (world units of the depth-1 layer). The priest kneels at the right end of the khat, in front
 * of it and clear of the doorway arch; Balak sits on the veranda in front of the arch (outside the threshold), and
 * inside on the floor before the khat after he is allowed in. The stone bowl stands at DRINK_BOWL_AT in front of his
 * seat, the dhoop-dani where he set it down beside the priest.
 */
export const SHRINE = {
  priestX: 1210,
  priestY: 930,
  priestS: 0.94,
  /** Veranda (outside the doorway, in front of the arch plane). */
  verandaX: 600,
  verandaY: 1000,
  verandaS: 1.0,
  /** Inside: kneeling spot beside the priest where he sets the dhoop-dani down. */
  setX: 1010,
  /** Inside: his seat on the floor before the deity khat. */
  seatX: 860,
  floorY: 940,
  balakS: 0.94,
} as const;
/** kneelReach target for the dhoop-dani on the floor (figure units). */
export const DHOOP_REACH = { x: 92, y: -HELD_OBJECT_BOTTOM.incense } as const;
export const DHOOP_SET = {
  x: SHRINE.setX + DHOOP_REACH.x * SHRINE.balakS,
  y: SHRINE.floorY + DHOOP_REACH.y * SHRINE.balakS,
} as const;
/** Stone bowl origin where drinkBowl finds it (DRINK_BOWL_AT from his seat). */
export const BOWL_AT = {
  x: SHRINE.seatX + DRINK_BOWL_AT.x * SHRINE.balakS,
  y: SHRINE.floorY + DRINK_BOWL_AT.y * SHRINE.balakS,
} as const;

/* Doorway arch (the shared plate), drawn here so its curtain never hides the priest. */
const ARCH_H = 1150;
const ARCH_K = ARCH_H / GHIBLI_ANCHORS.shrine_arch_frame_sketch.height;
const ARCH_W = GHIBLI_ANCHORS.shrine_arch_frame_sketch.width * ARCH_K;
const ARCH_DX = 960 - ARCH_W * GHIBLI_ANCHORS.shrine_arch_frame_sketch.anchorX;
const ARCH_DY = 1095 - ARCH_H * GHIBLI_ANCHORS.shrine_arch_frame_sketch.anchorY;
/** Clean outline of the arch plate (plate pixels), trimming the torn-paper fringes (as the shared finish does). */
const ARCH_CLEAN_D =
  "M 134 1440 L 134 606 L 46 598 L 46 506 L 88 506 A 584 478 0 0 1 1256 506 L 1318 506 L 1318 598 L 1220 606 L 1220 1440 Z";
/** The hanging curtain inside the opening (plate pixels): cut out of the frame so the doorway is open. */
const CURTAIN_D =
  "M 697 224 L 823 238 L 897 258 L 921 268 L 993 308 L 1040 348 L 1073 388 L 1097 428 L 1116 468 L 1128 508 L 1135 550 L 1135 1288 L 697 1288 Z";
/** Inner edge of the right pillar (plate px): the curtain is gathered back against it. */
const CURTAIN_PIN_X = 1131;

/**
 * The shrine doorway arch at depth 1.14 with its curtain drawn back: the frame (pillars, arch, sill) stays, the curtain
 * that hung across the opening is gathered as a narrow drape against the right pillar, so nobody inside is hidden.
 * `opacity` is per shot: the scenes show it only on the veranda / doorway shots and hide it on interior shots.
 */
export const ShrineArchFrame: React.FC<{ id: string; opacity: number; f: number }> = ({ id, opacity, f }) => {
  if (opacity <= 0.01) return null;
  const xf = `translate(${ARCH_DX.toFixed(2)} ${ARCH_DY.toFixed(2)}) scale(${ARCH_K.toFixed(5)})`;
  const pinX = ARCH_DX + CURTAIN_PIN_X * ARCH_K;
  const sway = 0.6 * Math.sin(f * 0.045) + 0.35 * Math.sin(f * 0.11 + 1.3);
  const arch = (
    <GhibliCutout
      file="images/ghibli_ep04/shrine_arch_frame_sketch.png"
      anchor={GHIBLI_ANCHORS.shrine_arch_frame_sketch}
      x={960}
      y={1095}
      targetHeight={ARCH_H}
    />
  );
  return (
    <GhibliLayer depth={1.14} extraBlur={1.1} opacity={opacity}>
      <defs>
        <filter id={`${id}-feather`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
        <mask id={`${id}-frame`} maskUnits="userSpaceOnUse" x={ARCH_DX - 60} y={ARCH_DY - 60} width={ARCH_W + 120} height={ARCH_H + 120}>
          <path d={ARCH_CLEAN_D} transform={xf} fill="#fff" filter={`url(#${id}-feather)`} />
          <path d={CURTAIN_D} transform={xf} fill="#000" />
        </mask>
        <clipPath id={`${id}-curtain`} clipPathUnits="userSpaceOnUse">
          <path d={CURTAIN_D} transform={xf} />
        </clipPath>
      </defs>
      <g mask={`url(#${id}-frame)`}>{arch}</g>
      {/* the curtain, gathered back against the right pillar (a quarter of its width), stirring a little */}
      <g clipPath={`url(#${id}-curtain)`}>
        <g transform={`translate(${pinX.toFixed(2)} 0) skewX(${sway.toFixed(3)}) scale(0.24 1) translate(${(-pinX).toFixed(2)} 0)`}>
          <g clipPath={`url(#${id}-curtain)`}>{arch}</g>
        </g>
      </g>
    </GhibliLayer>
  );
};

/** A small brass puja hand-bell (handle up), drawn in hand space. */
export const BellProp: PropRenderer = ({ scale }) => (
  <g transform={`scale(${(scale * 0.55).toFixed(3)}) translate(0, 30)`}>
    <rect x={-2.6} y={-34} width={5.2} height={18} rx={2} fill="#b58a2e" />
    <circle cx={0} cy={-36} r={3.6} fill="#c99a38" />
    <path d="M -14 0 Q -13 -18 0 -20 Q 13 -18 14 0 Z" fill="#c4932f" />
    <path d="M -9 -4 Q -8 -15 -1 -17" fill="none" stroke="#f3d58a" strokeWidth={2} strokeLinecap="round" opacity={0.8} />
    <ellipse cx={0} cy={0} rx={14} ry={3} fill="#8a5a14" />
    <circle cx={0} cy={3.5} r={2.6} fill="#6b4210" />
  </g>
);

/** A marigold held for the offering, drawn in hand space. */
const FlowerProp: PropRenderer = ({ scale }) => (
  <g transform={`scale(${(scale * 0.6).toFixed(3)}) translate(0, -10)`}>
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <ellipse key={a} cx={0} cy={-5} rx={3.6} ry={6} fill="#f09a1e" transform={`rotate(${a})`} />
    ))}
    <circle cx={0} cy={0} r={4.2} fill="#e07b12" />
  </g>
);
export const PRIEST_PROPS: Record<string, PropRenderer> = { bell: BellProp, flower: FlowerProp };

/** Bell ring: a quick wrist shake (degrees) over `dur` frames from `start`. */
export const bellShake = (f: number, start: number, dur = 16, amp = 7): number => {
  const t = f - start;
  if (t < 0 || t > dur) return 0;
  return amp * Math.sin(t * 1.9) * Math.sin((Math.PI * t) / dur);
};

/** Smooth 0..1 ramp from a to b. */
export const ramp = (f: number, a: number, b: number): number => EASE.inOut(clamp((f - a) / Math.max(1, b - a), 0, 1));

/** A fast natural blink pulse (0..1) centred on `at`. */
export const blinkAt = (f: number, at: number, half = 3): number => {
  const d = Math.abs(f - at);
  return d >= half ? 0 : 0.5 + 0.5 * Math.cos((d / half) * Math.PI);
};

/* ------------------------------------------------------------------------------------------------ */
/* Scene 05                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

const SCENE_ID = "05_dhoop_and_coconut_water";

const PRELOAD = [
  "images/ghibli_ep04/sky_ep04_purnima_dusk.png",
  "images/ghibli_ep04/thakur_ghar_interior_sketch.png",
  "images/ghibli_ep04/deity_khat_shrine_sketch.png",
  "images/ghibli_ep04/shrine_arch_frame_sketch.png",
  "images/ghibli_ep04/watercolor_paper_grain.png",
] as const;

/** Veranda dhoop-dani: where Thakurma sets it, just outside the doorway, within Balak's reach. */
const DHOOP_V = { x: SHRINE.verandaX + 88 * SHRINE.verandaS, y: SHRINE.verandaY - HELD_OBJECT_BOTTOM.incense * SHRINE.verandaS };

/** Scene 05 story beats (local frames; line windows from timing.ts: 05a 60-339, 05b 351-454, P9 454-478, 05c 478-550,
 * 05d 558-614, 05e 638-728, 05f 736-809, AG7 821-941). */
export const S05 = {
  thkSettle: 26, // Thakurma's dhoop-dani touches the veranda floor
  thkLetGo: 32,
  thkRiseEnd: 58,
  thkWalkFrom: 64,
  thkWalkTo: 248,
  glanceSill: 140, // "ঠাকুরঘরে ঢোকা বারণ—": he looks down at the threshold
  sigh: 156,
  reach: 474, // kneelReach to the dhoop-dani's handle (grip at +26)
  lift: 560, // "হুঁ হুঁ, দে—": lifts it
  walkFrom: 564,
  walkTo: 614,
  set: 606, // kneelReach set-down beside the priest; contact / release at set + 26
  point: 648, // "...ঘরে বসব?": points to the floor
  backFrom: 754, // "হুঁ হুঁ, বোস…": shuffles back to the seat before the khat
  backTo: 790,
  sitEnd: 804,
  eyeBowl: 806,
  widen: 838,
  drink: 848, // drinkBowl poseStart: the bowl reaches his lips at +25 (873, the music's gulp crest)
  wipe: 921, // back of the hand across the mouth
  wipeEnd: 940,
} as const;
export const S05_DHOOP_CONTACT = S05.set + KNEEL_REACH_T.grip;
export const S05_BOWL_DOWN = S05.drink + DRINK_BOWL_T.lower;

export const Scene05DhoopAndCoconutGhibli: React.FC = () => {
  const f = useCurrentFrame();

  const s5a = ep04gSpan(SCENE_ID, "05a_Narrator_Abhishek.wav");
  const s5b = ep04gSpan(SCENE_ID, "05b_Bhagabati_Dhoop.wav");
  const s5c = ep04gSpan(SCENE_ID, "05c_Balak_AskDhoop.wav");
  const s5d = ep04gSpan(SCENE_ID, "05d_Bhagabati_Huhu1.wav");
  const s5e = ep04gSpan(SCENE_ID, "05e_Balak_AskSit.wav");
  const s5f = ep04gSpan(SCENE_ID, "05f_Bhagabati_Huhu2.wav");
  const ag7 = ep04gSpan(SCENE_ID, "AG7_drink_heist");
  const p9 = { from: s5b.to, to: s5c.from };

  /* ---------------- Camera (cuts on lines, one move per sentence, faces above y = 820) ---------------- */
  const cutB = s5b.from - 6; // Shot 21: medium interior on the priest (holds through P9)
  const cutC = s5c.from - 6; // Shot 22: medium close on Balak at the doorway
  const cutD = s5d.from - 6; // Shot 23: interior, Balak carries the dhoop-dani in
  const cutE = s5f.from - 6; // Shot 24: two-shot, he sits before the khat
  const cutInsert = s5f.to + 3; // AG7 insert: the brimming stone bowl
  const cutHeist = S05.widen - 2; // AG7: medium close on Balak, slow push
  let cam: Cam;
  let archOp = 0;
  if (f < cutB) {
    // AG6 + Shot 20: wide through the arch, then a gentle push to Balak on "ঠাকুরঘরে ঢোকা বারণ—"
    const drift = ramp(f, 0, s5a.from + 70);
    const push = ramp(f, S05.glanceSill - 4, S05.glanceSill + 50);
    cam = {
      x: lerp(lerp(-40, -26, drift), -190, push),
      y: lerp(100, 124, push),
      zoom: lerp(1.04, 1.28, push),
      focus: 1.0,
    };
    archOp = 0.92;
  } else if (f < cutC) {
    // Shot 21 + P9: the priest calls for dhoop; nobody comes
    const t = ramp(f, cutB, s5b.to);
    cam = { x: lerp(228, 236, t), y: 146, zoom: lerp(1.66, 1.7, t), focus: 1.0 };
  } else if (f < cutD) {
    // Shot 22: Balak at the doorframe, hand on the dhoop-dani's handle
    const t = ramp(f, cutC, s5c.to);
    cam = { x: lerp(-236, -228, t), y: 172, zoom: lerp(1.48, 1.52, t), focus: 1.0 };
    archOp = 0.92;
  } else if (f < cutE) {
    // Shot 23: interior; he hurries the dhoop-dani in and sets it beside the priest; the camera eases with him
    const t = ramp(f, S05.walkFrom, S05.walkTo + 20);
    cam = { x: lerp(96, 150, t), y: lerp(112, 120, t), zoom: lerp(1.26, 1.3, t), focus: 1.0 };
  } else if (f < cutInsert) {
    // Shot 24: two-shot, Balak goes back and sits down before the khat
    const t = ramp(f, cutE, s5f.to);
    cam = { x: lerp(78, 70, t), y: 122, zoom: lerp(1.34, 1.36, t), focus: 1.0 };
  } else if (f < cutHeist) {
    // AG7 insert: the brimming stone bowl gleaming in the lamplight (his eyes on it at the top of frame)
    const t = ramp(f, cutInsert, cutHeist);
    cam = { x: lerp(-52, -48, t), y: lerp(162, 166, t), zoom: lerp(1.96, 2.02, t), focus: 1.0 };
  } else {
    // AG7: medium close on Balak and the bowl, slow push (1.0 -> 1.14) through the heist
    const t = ramp(f, cutHeist, ag7.to);
    cam = { x: lerp(-82, -76, t), y: lerp(138, 150, t), zoom: lerp(1.58, 1.78, t), focus: 1.0 };
  }
  cam.dof = zoomProportionalDof(cam.zoom);

  /* ---------------- Thakurma: sets the dhoop-dani down outside the doorway, gets up, walks off ---------------- */
  const thkSpotFn = ghibliWalkSpot(
    { x: 760, y: 990, s: 0.98 },
    { x: -140, y: 990, s: 0.98 },
    S05.thkWalkFrom,
    S05.thkWalkTo,
    EP04G_CAST.thakurma.seed,
  );
  const thkSpot = thkSpotFn(f);
  const thkStrideFn = ghibliStrideOf(thkSpotFn, EP04G_CAST.thakurma);
  // the dhoop-dani in her hand settles onto the floor over the first frames (her hand on its handle)
  const dhoopVY = DHOOP_V.y - 22 * (1 - EASE.out(clamp((f - 8) / (S05.thkSettle - 8), 0, 1)));
  const thakurmaActing = (fr: number) => {
    const down = 1 - ramp(fr, S05.thkLetGo, S05.thkRiseEnd);
    const hold = 1 - ramp(fr, S05.thkLetGo - 2, S05.thkLetGo + 8);
    return poseOf({
      kneel: down,
      lean: 14 * down,
      bow: 0.42 * down,
      bodyTurn: safeBodyTurn(-0.32),
      headTurn: lerp(-0.3, -0.42, 1 - down),
      headNod: 10 * down,
      eyeY: 0.4 * down,
      stride: thkStrideFn(fr),
      smile: 0.45,
      reach: hold,
      rHand: "hold",
      rS: lerp(-14, 30, down),
      rE: lerp(-24, -20, down),
      lS: 10,
      lE: -18,
    });
  };
  const thkVisible = f < S05.thkWalkTo + 4 && f < cutB;

  /* ---------------- Priest (Bhagabati Thakur) ---------------- */
  const priestLines = ["05b_Bhagabati_Dhoop.wav", "05d_Bhagabati_Huhu1.wav", "05f_Bhagabati_Huhu2.wav"] as const;
  const priestRms = (fr: number) => ep04gSpeakRms(SCENE_ID, priestLines, fr);
  const priestMouth = (fr: number) => mouthFromRms(priestRms(fr), fr);
  const priestTalk = (fr: number) => clamp(priestRms(fr) * 1.2, 0, 1);
  const turnAway = (fr: number) => ramp(fr, cutInsert - 4, cutInsert + 12); // AG7: his back half-turned to Balak
  const ringAt = ag7.from + 18; // the bell (Episode04Ghibli plays temple_bell_drop here)
  const priestActing = (fr: number) => {
    const in5b = fr >= s5b.from - 4 && fr < s5b.to;
    const inP9 = fr >= p9.from && fr < p9.to + 4;
    const lookRight = in5b && fr < s5b.from + 18; // "ধূপ!" over his shoulder
    const lookDoor = (in5b && fr >= s5b.from + 18) || inP9; // "আরে, ধূপ কই? কেউ কি নেই নাকি?" / P9
    const wave1 = fr >= s5d.from - 2 && fr < s5d.to + 6;
    const wave2 = fr >= s5f.from - 2 && fr < s5f.from + 34;
    const chant = fr >= s5f.from + 34 && fr < cutInsert;
    const away = turnAway(fr);
    const ring = bellShake(fr, ringAt, 18, 8) + bellShake(fr, ringAt + 30, 16, 6);
    const dismiss = Math.sin(fr * 0.44) * 16;
    const offer = Math.sin(fr * 0.085);
    const blink = Math.max(blinkAt(fr, p9.from + 9), blinkAt(fr, s5b.from + 60));
    const eyeDart = inP9 ? 0.25 * Math.sin((fr - p9.from) * 0.35) : 0;
    const base = poseOf({
      kneel: 1,
      lean: chant ? 4 + 1.4 * Math.sin(fr * 0.07) : lookDoor ? 3 : 2,
      bodyTurn: safeBodyTurn(lerp(lookRight ? 0.12 : lookDoor ? -0.32 : -0.24, 0.3, away)),
      headTurn: lerp(lookRight ? 0.46 : lookDoor ? -0.56 : wave1 || wave2 || chant ? -0.06 : -0.16, 0.42, away),
      headNod: lookRight ? 6 : lookDoor ? 2 : chant ? -5 + 2.2 * Math.sin(fr * 0.11) : lerp(-4, -7, away),
      eyeX: eyeDart,
      eyeY: in5b || inP9 ? 0.06 : -0.2,
      lid: Math.max(blink, away > 0.5 ? 0.72 : chant ? 0.56 : wave1 || wave2 ? 0.46 : 0.16),
      brow: in5b || inP9 ? -0.32 : 0.05,
      browTilt: inP9 ? 0.2 : 0,
      smile: in5b || inP9 ? 0.02 : 0.25,
      join: chant ? ramp(fr, s5f.from + 34, s5f.from + 52) * 0.92 : 0,
      rS: lookDoor ? -54 - priestRms(fr) * 12 : lookRight ? -34 : -46 + 9 * offer,
      rE: lookDoor ? -52 : -68 + 7 * Math.cos(fr * 0.085),
      rHand: chant ? "pranam" : "hold",
      rProp: fr < cutC ? "flower" : "",
      lS: wave1 || wave2 ? -48 + dismiss : lookDoor ? -30 : -30,
      lE: wave1 || wave2 ? -62 + dismiss * 0.6 : -54,
      lHand: chant ? "pranam" : wave1 || wave2 || lookDoor ? "open" : "relaxed",
    });
    if (away <= 0.001) return base;
    // AG7: turned to the khat, the bell raised in the near (left) hand and rung
    return {
      ...base,
      join: base.join * (1 - away),
      lS: lerp(base.lS, 58 + ring, away),
      lE: lerp(base.lE, -96 + ring * 0.6, away),
      lHand: away > 0.4 ? "hold" : base.lHand,
      lProp: away > 0.4 ? "bell" : "",
      rS: lerp(base.rS, -20, away),
      rE: lerp(base.rE, -70, away),
      rHand: away > 0.4 ? "pranam" : base.rHand,
    };
  };

  /* ---------------- Balak ---------------- */
  const balakRms = ep04gSpeakRms(SCENE_ID, ["05c_Balak_AskDhoop.wav", "05e_Balak_AskSit.wav"], f);

  // Where he is: veranda (in front of the arch) -> knee-walk in across the threshold -> beside the priest -> his seat.
  const walkU = ramp(f, S05.walkFrom, S05.walkTo);
  const backU = ramp(f, S05.backFrom, S05.backTo);
  const inside = f >= S05.walkFrom;
  let bx: number = SHRINE.verandaX;
  let by: number = SHRINE.verandaY;
  let bs: number = SHRINE.verandaS;
  if (f >= S05.walkFrom) {
    bx = lerp(SHRINE.verandaX, SHRINE.setX, walkU);
    by = lerp(SHRINE.verandaY, SHRINE.floorY, EASE.inOut(clamp(walkU * 1.15, 0, 1)));
    bs = lerp(SHRINE.verandaS, SHRINE.balakS, walkU);
    const bob = f < S05.walkTo ? -3 * Math.abs(Math.sin((f - S05.walkFrom) * 0.42)) * Math.sin(walkU * Math.PI) : 0;
    by += bob;
  }
  if (f >= S05.backFrom) {
    bx = lerp(SHRINE.setX, SHRINE.seatX, backU);
    by = SHRINE.floorY + (f < S05.backTo ? -2.2 * Math.abs(Math.sin((f - S05.backFrom) * 0.4)) * Math.sin(backU * Math.PI) : 0);
    bs = SHRINE.balakS;
  }

  let pose: SeatedPose = "sitCross";
  let prevPose: SeatedPose | undefined;
  let poseStart = 0;
  let prevPoseStart: number | undefined;
  let holding: HeldObject | undefined;
  let reachFor: HeldObject | undefined;
  let reachAt: { x: number; y: number } | undefined;
  let pointAt: { x: number; y: number } | undefined;
  let handTargets: SeatedChildProps["handTargets"];
  let kneel = 0;
  let expr: SeatedExpression = "serene";
  let prevExpr: SeatedExpression | undefined;
  let exprStart: number | undefined;
  let face: SeatedChildProps["face"] = { lookX: 0.32, smile: 0.5 };
  let sigh: ((fr: number) => number) | undefined;

  if (f < S05.reach) {
    // AG6 / Shot 20 / Shot 21 / P9: obediently outside, watching the puja
    pose = "sitCross";
    const watchThk = f < S05.thkRiseEnd;
    const atSill = f >= S05.glanceSill && f < S05.glanceSill + 46;
    face = watchThk
      ? { lookX: 0.22, eyesDown: 0.45, smile: 0.55 }
      : atSill
        ? { lookX: 0.4, eyesDown: 0.62, smile: 0.3 }
        : f >= s5b.from && f < p9.to
          ? { lookX: 0.42, smile: 0.5 }
          : { lookX: 0.36, smile: 0.52 };
    expr = atSill ? "thoughtful" : f >= s5b.from + 50 ? "playful" : "serene";
    sigh = sighCurve(S05.sigh, 12, 26, 2);
  } else if (f < S05.lift) {
    // Shot 22: kneels up, both hands on the dhoop-dani's handle, asks politely (does not lift it yet)
    pose = "kneelReach";
    prevPose = "sitCross";
    poseStart = S05.reach;
    reachAt = { x: (DHOOP_V.x - SHRINE.verandaX) / SHRINE.verandaS, y: (DHOOP_V.y - SHRINE.verandaY) / SHRINE.verandaS };
    if (f >= S05.reach + KNEEL_REACH_T.grip) holding = "incense";
    else reachFor = "incense";
    kneel = 1.5;
    expr = "playful";
    face = { lookX: 0.42, smile: 0.66 };
  } else if (f < S05.set) {
    // "হুঁ হুঁ, দে—": lifts it and knee-walks it in, quickly ("তাড়াতাড়ি দে")
    pose = "offerUp";
    prevPose = "kneelReach";
    prevPoseStart = S05.reach;
    poseStart = S05.lift;
    holding = "incense";
    reachAt = { x: 66, y: -100 };
    kneel = 1.5;
    expr = "serene";
  } else if (f < S05.point) {
    // sets it down right beside the priest
    pose = "kneelReach";
    prevPose = "offerUp";
    prevPoseStart = S05.lift;
    poseStart = S05.set;
    reachAt = DHOOP_REACH;
    if (f < S05_DHOOP_CONTACT) holding = "incense";
    kneel = 1.5;
    expr = "serene";
  } else if (f < S05.backFrom) {
    // "ঠাকুরমশায়, আমি একটু ঘরে বসব?": up on his knees beside the priest, a small open hand to the floor
    pose = "pointIn";
    prevPose = "kneelReach";
    prevPoseStart = S05.set;
    poseStart = S05.point;
    pointAt = { x: 64, y: -18 };
    kneel = 1.5;
    expr = "playful";
    face = { lookX: 0.4, smile: 0.62 };
  } else if (f < S05.drink) {
    // "হুঁ হুঁ, বোস…": shuffles back to the khat and sits down cross-legged; then the brimming bowl catches his eye
    pose = "sitCross";
    prevPose = "pointIn";
    prevPoseStart = S05.point;
    poseStart = S05.backFrom;
    kneel = 1.5 * (1 - ramp(f, S05.backTo - 4, S05.sitEnd));
    const eyeing = f >= S05.eyeBowl;
    expr = f >= S05.widen ? "surprised" : eyeing ? "playful" : "serene";
    prevExpr = f >= S05.widen ? "playful" : undefined;
    exprStart = f >= S05.widen ? S05.widen : undefined;
    face = eyeing ? { lookX: 0.5, eyesDown: 0.62, smile: f >= S05.widen ? 0.5 : 0.7 } : { lookX: 0.28, smile: 0.58 };
  } else if (f < S05.wipe) {
    // AG7: lifts the heavy stone bowl in both hands and drinks every drop; sets it back with the fopra in it
    pose = "drinkBowl";
    prevPose = "sitCross";
    poseStart = S05.drink;
    expr = "playful";
    prevExpr = "surprised";
    exprStart = S05.drink;
  } else {
    // wipes his mouth with the back of his hand, then sits back content
    const mouth = { x: 15, y: -151 };
    const u = ramp(f, S05.wipe + 10, S05.wipe + 17);
    pose = f < S05.wipeEnd ? "handsTo" : "sitCross";
    prevPose = f < S05.wipeEnd ? "drinkBowl" : "handsTo";
    prevPoseStart = f < S05.wipeEnd ? S05.drink : S05.wipe;
    poseStart = f < S05.wipeEnd ? S05.wipe : S05.wipeEnd;
    handTargets = { near: { x: mouth.x + lerp(14, -2, u), y: mouth.y + lerp(10, 2, u) } };
    expr = "joyful";
    prevExpr = "playful";
    exprStart = S05.wipe;
    face = { lookX: 0.3, smile: 0.92 };
    sigh = sighCurve(S05.wipeEnd - 4, 10, 20, 2);
  }

  // Outer living sway only while nothing he touches rests on the floor (contact stays exact, MOT-07)
  const livingW = f < S05.reach - 12 ? 1 : f < S05.reach ? 1 - ramp(f, S05.reach - 12, S05.reach) : f >= S05.sitEnd && f < S05.drink - 12 ? ramp(f, S05.sitEnd, S05.sitEnd + 12) * (1 - ramp(f, S05.drink - 24, S05.drink - 12)) : 0;
  const living = (() => {
    if (livingW <= 0.001) return undefined;
    const raw = balakLivingBodyTransform({ x: bx, y: by, f, facing: 1, speechRms: balakRms });
    if (livingW >= 0.999) return raw;
    const m = raw.match(/rotate\(([-\d.]+)\)\s*scale\(([-\d.]+),\s*([-\d.]+)\)/);
    if (!m) return raw;
    const rot = parseFloat(m[1]) * livingW;
    const sx = 1 + (parseFloat(m[2]) - 1) * livingW;
    const sy = 1 + (parseFloat(m[3]) - 1) * livingW;
    return `translate(${bx.toFixed(2)}, ${by.toFixed(2)}) rotate(${rot.toFixed(3)}) scale(${sx.toFixed(4)}, ${sy.toFixed(4)}) translate(${(-bx).toFixed(2)}, ${(-by).toFixed(2)})`;
  })();

  const balakProps: SeatedChildProps = {
    x: bx,
    y: by,
    s: bs,
    design: "plate",
    age: 5,
    f,
    lifeF: f,
    pose,
    prevPose,
    poseStart,
    prevPoseStart,
    kneel,
    holding,
    reachFor,
    reachAt,
    pointAt,
    handTargets,
    handShapes: handTargets ? { near: "open" } : undefined,
    handTurns: handTargets ? { near: Math.PI } : undefined,
    watchHeld: pose === "offerUp" ? 0.5 : undefined,
    face,
    expression: expr,
    prevExpression: prevExpr,
    expressionStart: exprStart,
    sigh,
    mouth: balakRms,
    talk: balakRms > 0.08 ? 1 : 0,
  };
  const glowAnchor = seatedChildHands(balakProps).glowAnchor;

  // Dhoop-dani: Thakurma's hand -> veranda floor -> Balak's hands (rig) -> the floor beside the priest
  const dhoopOnVeranda = f < S05.reach + KNEEL_REACH_T.grip;
  const dhoopBesidePriest = f >= S05_DHOOP_CONTACT;
  const bowlFull = f < S05.drink;
  const bowlEmpty = f >= S05.drink + DRINK_BOWL_T.release;

  // Lamp-light glint dancing on the brimming coconut water (the insert), not divine light
  const glint = bowlFull ? 0.5 + 0.5 * Math.sin(f * 0.21) * Math.sin(f * 0.07 + 1) : 0;

  const balakNode = (
    <>
      <GhibliBalakGroundGlow x={bx} y={by + 5} level={0.45} />
      <g transform={living}>
        <GhibliBalakAura cx={glowAnchor.cx} cy={glowAnchor.cy} r={78 * (bs / 0.94)} glow={0.55} f={f} />
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={bx} y={by} rx={42 * (bs / 0.94)} ry={9} opacity={0.28} sunDir={-1} />
          <SeatedChild {...balakProps} />
          {kneel < 0.35 && pose !== "drinkBowl" && <GhibliBalakLapDetails x={bx} y={by} s={bs} f={f} />}
        </g>
      </g>
    </>
  );

  return (
    <GhibliStage cam={cam} background="#241710">
      <GhibliPreload files={PRELOAD} />
      <GhibliShrineBackdrop f={f} />

      {/* Inside the shrine room (behind the doorway arch) */}
      <GhibliLayer depth={1.0}>
        <GhibliCharFilterDefs f={f} rimDir={-1} sunColor="#ffd088" bounceColor="#7c6e8c" />

        {/* Stone bowl with the coconut water and the whole fopra, before the khat */}
        <ContactShadow x={BOWL_AT.x} y={SHRINE.floorY} rx={36} ry={8.5} opacity={0.32} sunDir={-1} />
        {bowlFull && (
          <g>
            <HeldObjectArt kind="stoneBowl" x={BOWL_AT.x} y={BOWL_AT.y} s={SHRINE.balakS} fill={1} />
            <ellipse cx={BOWL_AT.x - 6} cy={BOWL_AT.y - 12} rx={9 + 3 * glint} ry={2.2} fill="#fff8e0" opacity={0.25 + 0.4 * glint} />
          </g>
        )}
        {bowlEmpty && <HeldObjectArt kind="stoneBowl" x={BOWL_AT.x} y={BOWL_AT.y} s={SHRINE.balakS} fill={0} />}

        {/* Bhagabati Thakur kneeling at the right end of the khat, clear of the doorway */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={SHRINE.priestX} y={SHRINE.priestY} rx={50} ry={12} opacity={0.34} sunDir={-1} />
          <Puppet
            cast={EP04G_CAST.bhagabati}
            x={SHRINE.priestX}
            y={SHRINE.priestY}
            scale={SHRINE.priestS}
            f={f}
            lifeF={f}
            light={EP04G_SHRINE_LIGHT}
            mouth={priestMouth}
            talk={priestTalk}
            acting={priestActing}
            props={PRIEST_PROPS}
          />
        </g>

        {/* Dhoop-dani set down beside the priest */}
        {dhoopBesidePriest && (
          <g>
            <ContactShadow x={DHOOP_SET.x} y={SHRINE.floorY} rx={17} ry={4.5} opacity={0.3} sunDir={-1} />
            <HeldObjectArt kind="incense" x={DHOOP_SET.x} y={DHOOP_SET.y} s={SHRINE.balakS} lifeF={f} />
            <GhibliSmokeCurls x={DHOOP_SET.x} y={DHOOP_SET.y - 10} f={f} scale={0.6} />
          </g>
        )}

        {/* Inside, Balak is part of the room */}
        {inside && balakNode}
      </GhibliLayer>

      {/* The doorway arch, curtain drawn back (veranda shots only) */}
      <ShrineArchFrame id="s05arch" opacity={archOp} f={f} />

      {/* The veranda, outside the threshold (in front of the arch) */}
      <GhibliLayer depth={1.0}>
        {dhoopOnVeranda && (
          <g>
            <ContactShadow x={DHOOP_V.x} y={SHRINE.verandaY} rx={17 * (dhoopVY >= DHOOP_V.y - 0.5 ? 1 : 0.7)} ry={4.5} opacity={0.28} sunDir={-1} />
            <HeldObjectArt kind="incense" x={DHOOP_V.x} y={dhoopVY} s={SHRINE.verandaS} lifeF={f} />
            <GhibliSmokeCurls x={DHOOP_V.x} y={dhoopVY - 10} f={f} scale={0.6} />
          </g>
        )}
        {thkVisible && (
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={thkSpot.x} y={990} rx={42} ry={10} opacity={0.28} sunDir={-1} />
            <Puppet
              cast={EP04G_CAST.thakurma}
              x={thkSpot.x}
              y={990}
              scale={thkSpot.s}
              f={f}
              lifeF={f}
              light={EP04G_SHRINE_LIGHT}
              acting={thakurmaActing}
              reachAt={() => ({ x: DHOOP_V.x + 2, y: dhoopVY - 9 })}
            />
          </g>
        )}
        {!inside && balakNode}
      </GhibliLayer>

      <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} warmth={0.3} />
    </GhibliStage>
  );
};
