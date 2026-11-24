import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
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
/**
 * Scales (CHR-09, BAL-26b): the plate Balak's head is about 1.086 x his rig scale against a Puppet head at scale 1
 * (measured in Scene 04), so balakS / priestS = 0.76 puts his head at about 82% of the priest's.
 */
export const SHRINE = {
  priestX: 1210,
  /** Same ground line as floor props / Balak so the purohit does not hover above the ashon. */
  priestY: 940,
  priestS: 1.06,
  /** Where his knee-walk in starts (the doorway sill, in the interior shots' world). */
  verandaX: 600,
  verandaY: 1000,
  verandaS: 0.8,
  /** Inside: kneeling spot beside the priest where he sets the dhoop-dani down. */
  setX: 1010,
  /** Inside: his seat on the floor before the deity khat. */
  seatX: 860,
  floorY: 940,
  balakS: 0.8,
} as const;
/**
 * Outside the threshold (veranda shots of Scene 05 only, AG6 / Shot 20 / Shot 22): he sits on the veranda floor in
 * front of the shrine's outer wall, just left of the doorway ("বারান্দায় বসে"), looking in. Left of the opening so
 * the left pillar reads between him and the lamplit room; the veranda is drawn in front of the arch.
 */
export const VERANDA_OUT = { x: 428, y: 1128, s: 0.86 } as const;
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
/** The wide grey stone bowl on the floor is drawn larger than the rig's held bowl (STO-22c: the coconut shown large);
 * the rig's own size takes over at the heist cut. */
export const BOWL_FLOOR_S = 1.4;
export const BOWL_FLOOR = {
  x: BOWL_AT.x + 30,
  y: SHRINE.floorY - HELD_OBJECT_BOTTOM.stoneBowl * BOWL_FLOOR_S,
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
export const ShrineArchFrame: React.FC<{ id: string; opacity: number; f: number; depth?: number }> = ({ id, opacity, f, depth = 1.14 }) => {
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
    <GhibliLayer depth={depth} extraBlur={depth > 1.05 ? 1.1 : 0} opacity={opacity}>
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

/** The doorway opening in arch-plate pixels, generous (the frame plate is drawn over its edges). */
const OPENING_D = "M 178 1336 L 178 560 A 505 400 0 0 1 1188 560 L 1188 1336 Z";
const SILL_PY = 1336;

/**
 * The shrine's outer wall and the veranda floor in front of it (Scene 05 veranda shots, depth 1 with the arch): only
 * the doorway shows the lamplit room, so Balak, sitting on the veranda floor in front of the wall, reads clearly as
 * outside the threshold. Lime plaster cooled by the full moon, a red-oxide dado and floor, and the warm lamplight
 * spilling out through the doorway onto the veranda floor.
 */
export const VerandaExterior: React.FC<{ id: string; f: number }> = ({ id, f }) => {
  const xf = `translate(${ARCH_DX.toFixed(2)} ${ARCH_DY.toFixed(2)}) scale(${ARCH_K.toFixed(5)})`;
  const flick = 0.92 + 0.05 * Math.sin(f * 0.31) + 0.03 * Math.sin(f * 0.83 + 1.1);
  return (
    <GhibliLayer depth={1.0}>
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4b9a3" />
          <stop offset="0.55" stopColor="#d8cab0" />
          <stop offset="1" stopColor="#c9b698" />
        </linearGradient>
        <radialGradient id={`${id}-stain`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#8f7b60" stopOpacity={0.28} />
          <stop offset="1" stopColor="#8f7b60" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-reveal`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2a22" stopOpacity={0} />
          <stop offset="1" stopColor="#3a2a22" stopOpacity={0.32} />
        </linearGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a4636" />
          <stop offset="0.5" stopColor="#5e3529" />
          <stop offset="1" stopColor="#3f251e" />
        </linearGradient>
        <radialGradient id={`${id}-spill`} cx="50%" cy="0%" r="100%">
          <stop offset="0" stopColor="#ffc27a" stopOpacity={0.55} />
          <stop offset="0.6" stopColor="#ffae5c" stopOpacity={0.18} />
          <stop offset="1" stopColor="#ffae5c" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-moon`} cx="20%" cy="10%" r="90%">
          <stop offset="0" stopColor="#dfe6f2" stopOpacity={0.22} />
          <stop offset="1" stopColor="#6a7896" stopOpacity={0.18} />
        </radialGradient>
        <clipPath id={`${id}-wallclip`} clipPathUnits="userSpaceOnUse">
          <path d={`M -4000 -4000 L 6000 -4000 L 6000 ${SILL_PY} L -4000 ${SILL_PY} Z ${OPENING_D}`} transform={xf} clipRule="evenodd" />
        </clipPath>
      </defs>
      {/* the outer wall with the doorway cut out */}
      <g clipPath={`url(#${id}-wallclip)`}>
        <rect x={-2400} y={-2000} width={6400} height={3200} fill={`url(#${id}-wall)`} />
        {/* red-oxide dado along the bottom of the wall */}
        <rect x={-2400} y={ARCH_DY + 1150 * ARCH_K} width={6400} height={(SILL_PY - 1150) * ARCH_K + 2} fill="#8a4c3c" opacity={0.92} />
        <rect x={-2400} y={ARCH_DY + 1146 * ARCH_K} width={6400} height={5} fill="#6b3a2e" opacity={0.7} />
        <image
          href={staticFile("images/ghibli_ep04/watercolor_paper_grain.png")}
          x={-2400}
          y={-2000}
          width={6400}
          height={3200}
          preserveAspectRatio="none"
          opacity={0.4}
          style={{ mixBlendMode: "multiply" }}
        />
        {/* damp stains, and the shadow of the deep doorway reveal beside the left pillar */}
        <ellipse cx={180} cy={520} rx={260} ry={340} fill={`url(#${id}-stain)`} />
        <ellipse cx={1620} cy={420} rx={300} ry={300} fill={`url(#${id}-stain)`} />
        <ellipse cx={-120} cy={900} rx={300} ry={160} fill={`url(#${id}-stain)`} />
        <rect x={ARCH_DX + 40 * ARCH_K} y={-400} width={140 * ARCH_K} height={1600} fill={`url(#${id}-reveal)`} />
        {/* a few soft plaster cracks in sepia ink */}
        <g fill="none" stroke="#7d6a55" strokeWidth={1.4} strokeLinecap="round" opacity={0.45}>
          <path d="M 150 360 q 14 40 -4 80 q -12 30 6 62 q 10 22 -2 48" />
          <path d="M 300 620 q 20 22 12 54 q -6 24 10 40" />
          <path d="M 1520 300 q -16 36 2 70 q 14 28 -6 58" />
        </g>
        <rect x={-2400} y={-2000} width={6400} height={3200} fill={`url(#${id}-moon)`} style={{ mixBlendMode: "multiply" }} />
        {/* lamplight from the doorway warming the wall beside it */}
        <ellipse cx={ARCH_DX + 683 * ARCH_K} cy={ARCH_DY + 1000 * ARCH_K} rx={760} ry={520} fill={`url(#${id}-spill)`} opacity={0.6 * flick} style={{ mixBlendMode: "screen" }} />
      </g>
      {/* the veranda floor in front of the wall */}
      <rect x={-2400} y={ARCH_DY + (SILL_PY - 6) * ARCH_K} width={6400} height={1600} fill={`url(#${id}-floor)`} />
      <rect x={-2400} y={ARCH_DY + (SILL_PY - 6) * ARCH_K} width={6400} height={10} fill="#2a1712" opacity={0.35} />
      <image
        href={staticFile("images/ghibli_ep04/watercolor_paper_grain.png")}
        x={-2400}
        y={ARCH_DY + (SILL_PY - 6) * ARCH_K}
        width={6400}
        height={1600}
        preserveAspectRatio="none"
        opacity={0.35}
        style={{ mixBlendMode: "multiply" }}
      />
      {/* warm lamplight from the shrine spilling out over the threshold onto the veranda floor */}
      <path
        d={`M ${ARCH_DX + 300 * ARCH_K} ${ARCH_DY + SILL_PY * ARCH_K} L ${ARCH_DX + 1080 * ARCH_K} ${ARCH_DY + SILL_PY * ARCH_K} L ${ARCH_DX + 1480 * ARCH_K} ${ARCH_DY + SILL_PY * ARCH_K + 260} L ${ARCH_DX + 60 * ARCH_K} ${ARCH_DY + SILL_PY * ARCH_K + 260} Z`}
        fill={`url(#${id}-spill)`}
        opacity={flick}
        style={{ mixBlendMode: "screen" }}
      />
    </GhibliLayer>
  );
};

/**
 * Oil-lamp light on the people in the shrine (STO-22c): a flickering warm soft-light pool from the brass lamps at the
 * right and the khat, so the priest and Balak take the lamplight. Ambient light for everyone, not the divine glow.
 */
export const ShrineLampLight: React.FC<{ id: string; f: number; strength?: number }> = ({ id, f, strength = 1 }) => {
  const flick = 0.9 + 0.06 * Math.sin(f * 0.29) + 0.04 * Math.sin(f * 0.77 + 0.6);
  return (
    <GhibliLayer depth={1.0} blend="soft-light" opacity={strength * flick}>
      <defs>
        <radialGradient id={`${id}-lamp`} gradientUnits="userSpaceOnUse" cx={1380} cy={720} r={760}>
          <stop offset="0" stopColor="#ffb24f" stopOpacity={0.9} />
          <stop offset="0.45" stopColor="#ff9f45" stopOpacity={0.55} />
          <stop offset="1" stopColor="#3c2a3a" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      <rect x={-1600} y={-1200} width={5200} height={3600} fill={`url(#${id}-lamp)`} />
    </GhibliLayer>
  );
};

/**
 * The brass Gobinda on the khat, shown large (STO-22c), over the small idol painted on the khat plate. Same layer
 * placement as the khat plate in GhibliShrineBackdrop (depth 0.78, ground-locked, drift -0.02). No light of its own.
 */
/** Gobinda sits on the khat; y tracks the khat ground lock (floorY 940, +55 from the old 885 plate). */
export const ShrineGobinda: React.FC = () => (
  <GhibliLayer depth={0.78} groundLocked parallaxDrift={-0.02}>
    <ellipse cx={1031} cy={697} rx={34} ry={6} fill="#2a160c" opacity={0.38} />
    <HeldObjectArt kind="gobinda" x={1031} y={697 - HELD_OBJECT_BOTTOM.gobinda * 1.7} s={1.7} />
  </GhibliLayer>
);

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
const DHOOP_V = { x: VERANDA_OUT.x + 88 * VERANDA_OUT.s, y: VERANDA_OUT.y - HELD_OBJECT_BOTTOM.incense * VERANDA_OUT.s };

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

/**
 * Planted knee-walk / shuffle for SeatedChild: advances along a path in discrete steps with a
 * hold (plant) after each move so the root never ice-skates. `stepPhase` is 0 while planted and
 * peaks at 1 mid-move (for a small vertical bob / lean).
 */
const kneeStepTravel = (
  fr: number,
  a: number,
  b: number,
  from: { x: number; y: number; s: number },
  to: { x: number; y: number; s: number },
  steps: number,
): { x: number; y: number; s: number; stepPhase: number } => {
  const dur = Math.max(1, b - a);
  const t = clamp((fr - a) / dur, 0, 1);
  if (t <= 0) return { x: from.x, y: from.y, s: from.s, stepPhase: 0 };
  if (t >= 1) return { x: to.x, y: to.y, s: to.s, stepPhase: 0 };
  const n = Math.max(2, Math.floor(steps));
  const u = t * n;
  const i = Math.min(n - 1, Math.floor(u));
  const local = u - i;
  const moveFrac = 0.56;
  const fromT = i / n;
  const toT = (i + 1) / n;
  if (local < moveFrac) {
    const m = EASE.inOut(local / moveFrac);
    return {
      x: lerp(from.x, to.x, lerp(fromT, toT, m)),
      y: lerp(from.y, to.y, lerp(fromT, toT, m)),
      s: lerp(from.s, to.s, lerp(fromT, toT, m)),
      stepPhase: Math.sin(m * Math.PI),
    };
  }
  return {
    x: lerp(from.x, to.x, toT),
    y: lerp(from.y, to.y, toT),
    s: lerp(from.s, to.s, toT),
    stepPhase: 0,
  };
};

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
  const cutE = s5e.from - 6; // Shot 24: two-shot (05e + 05f), he asks, points to the floor, and sits before the khat
  const cutInsert = s5f.to + 3; // AG7 insert: the brimming stone bowl
  const cutHeist = S05.widen - 2; // AG7: medium close on Balak, slow push
  // frameAt: world point (cx, wy) lands at screen (960, sy) at zoom z (depth-1 world). Floors and laps go to screen
  // y <= 810, clear of the caption band.
  const frameAt = (cx: number, wy: number, sy: number, z: number): Cam => ({ x: cx - 960, y: wy - 540 - (sy - 540) / z, zoom: z, focus: 1.0 });
  let cam: Cam;
  let archOp = 0;
  if (f < cutB) {
    // AG6 + Shot 20: the veranda outside the shrine doorway; a gentle push to Balak on "ঠাকুরঘরে ঢোকা বারণ—", ending
    // on a medium shot of him sitting outside the threshold, the left pillar and lamplit room beyond the doorway
    const drift = ramp(f, 0, s5a.from + 70);
    const push = ramp(f, S05.glanceSill - 4, S05.glanceSill + 50);
    cam = frameAt(lerp(lerp(820, 760, drift), 560, push), VERANDA_OUT.y, lerp(800, 785, push), lerp(1.28, 1.88, push));
    archOp = 1;
  } else if (f < cutC) {
    // Shot 21 + P9: the priest calls for dhoop; nobody comes
    const t = ramp(f, cutB, s5b.to);
    cam = frameAt(lerp(1188, 1196, t), SHRINE.priestY, 800, lerp(1.66, 1.7, t));
  } else if (f < cutD) {
    // Shot 22: Balak at the doorframe, outside, hand on the dhoop-dani's handle; pillar between him and the room
    const t = ramp(f, cutC, s5c.to);
    cam = frameAt(lerp(560, 568, t), VERANDA_OUT.y, 800, lerp(1.92, 1.98, t));
    archOp = 1;
  } else if (f < cutE) {
    // Shot 23: interior; he hurries the dhoop-dani in and sets it beside the priest; the camera eases with him
    const t = ramp(f, S05.walkFrom, S05.walkTo + 20);
    cam = frameAt(lerp(1056, 1110, t), SHRINE.floorY, 800, lerp(1.4, 1.46, t));
  } else if (f < cutInsert) {
    // Shot 24: medium two-shot (cut before "ঠাকুরমশায়, আমি একটু ঘরে বসব?"): Balak up on his knees beside the
    // priest, pointing to the floor; then he goes back and sits down before the khat
    const t = ramp(f, cutE, s5f.to);
    cam = frameAt(lerp(1080, 1060, t), SHRINE.floorY, 800, lerp(1.9, 1.94, t));
  } else if (f < cutHeist) {
    // AG7 insert: the brimming stone bowl gleaming in the lamplight (his eyes on it at the top of frame)
    const t = ramp(f, cutInsert, cutHeist);
    cam = frameAt(790, SHRINE.floorY, 780, lerp(2.6, 2.66, t));
  } else {
    // AG7: medium close on Balak and the bowl, slow push (1.0 -> 1.14) through the heist
    const t = ramp(f, cutHeist, ag7.to);
    cam = frameAt(lerp(900, 906, t), SHRINE.floorY, 800, lerp(1.9, 2.16, t));
  }
  cam.dof = zoomProportionalDof(cam.zoom);

  /* ---------------- Thakurma: sets the dhoop-dani down outside the doorway, gets up, walks off ---------------- */
  const thkSpotFn = ghibliWalkSpot(
    { x: VERANDA_OUT.x + 150, y: VERANDA_OUT.y - 8, s: 1.04 },
    { x: -320, y: VERANDA_OUT.y - 8, s: 1.04 },
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
    const breath = 0.35 * Math.sin(fr * 0.06);
    // Upright floor sit; lean only when offering / chanting (door look is head+eyes, not a body hunch).
    const lean =
      chant || (fr < cutC && !lookDoor && !lookRight && !wave1 && !wave2)
        ? 2.4 + 0.9 * Math.sin(fr * 0.07) + (chant ? 0.6 : 0)
        : breath;
    const base = poseOf({
      kneel: 0,
      lean,
      bodyTurn: safeBodyTurn(lerp(lookRight ? 0.12 : lookDoor ? -0.32 : -0.24, 0.3, away)),
      headTurn: lerp(lookRight ? 0.46 : lookDoor ? -0.56 : wave1 || wave2 || chant ? -0.06 : -0.16, 0.42, away),
      headNod: lookRight ? 6 : lookDoor ? 2 : chant ? -5 + 2.2 * Math.sin(fr * 0.11) : lerp(-2, -4, away),
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

  // Where he is: veranda -> planted knee-walk to the priest -> planted shuffle back to his seat.
  // Continuous lerps ice-skated; kneeStepTravel advances only during each step's move and holds on plant.
  const walkU = ramp(f, S05.walkFrom, S05.walkTo);
  const inside = f >= S05.walkFrom;
  // the veranda shots (before the interior cut, Shot 23) draw him at VERANDA_OUT; the interior walk starts at the sill
  const onVeranda = f < cutD;
  let bx: number = onVeranda ? VERANDA_OUT.x : SHRINE.verandaX;
  let by: number = onVeranda ? VERANDA_OUT.y : SHRINE.verandaY;
  let bs: number = onVeranda ? VERANDA_OUT.s : SHRINE.verandaS;
  /** Floor plant Y for the contact shadow (body may bob up during a knee-step). */
  let plantY = by;
  if (f >= S05.walkFrom && f < S05.backFrom) {
    const trip = kneeStepTravel(
      f,
      S05.walkFrom,
      S05.walkTo,
      { x: SHRINE.verandaX, y: SHRINE.verandaY, s: SHRINE.verandaS },
      { x: SHRINE.setX, y: SHRINE.floorY, s: SHRINE.balakS },
      5,
    );
    bx = trip.x;
    plantY = trip.y;
    bs = trip.s;
    by = trip.y - 5.5 * trip.stepPhase;
  }
  if (f >= S05.backFrom) {
    const trip = kneeStepTravel(
      f,
      S05.backFrom,
      S05.backTo,
      { x: SHRINE.setX, y: SHRINE.floorY, s: SHRINE.balakS },
      { x: SHRINE.seatX, y: SHRINE.floorY, s: SHRINE.balakS },
      3,
    );
    bx = trip.x;
    plantY = trip.y;
    bs = trip.s;
    by = trip.y - 3.2 * trip.stepPhase;
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
    reachAt = { x: (DHOOP_V.x - VERANDA_OUT.x) / VERANDA_OUT.s, y: (DHOOP_V.y - VERANDA_OUT.y) / VERANDA_OUT.s };
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
  const bowlBig = f < cutHeist;
  const bowlX = bowlBig ? BOWL_FLOOR.x : BOWL_AT.x;
  const bowlY = bowlBig ? BOWL_FLOOR.y : BOWL_AT.y;
  const bowlS = bowlBig ? BOWL_FLOOR_S : SHRINE.balakS;

  // Lamp-light glint dancing on the brimming coconut water (the insert), not divine light
  const glint = bowlFull ? 0.5 + 0.5 * Math.sin(f * 0.21) * Math.sin(f * 0.07 + 1) : 0;

  const balakNode = (
    <>
      <GhibliBalakGroundGlow x={bx} y={plantY + 5} level={0.45} />
      <g transform={living}>
        <GhibliBalakAura cx={glowAnchor.cx} cy={glowAnchor.cy} r={78 * (bs / 0.94)} glow={0.55} f={f} />
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={bx} y={plantY} rx={52 * (bs / 0.94)} ry={10 * (bs / 0.94)} opacity={0.3} sunDir={-1} />
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
      <ShrineGobinda />

      {/* Inside the shrine room (behind the doorway arch) */}
      <GhibliLayer depth={1.0}>
        <GhibliCharFilterDefs f={f} rimDir={-1} sunColor="#ffd088" bounceColor="#7c6e8c" />

        {/* Stone bowl with the coconut water and the whole fopra, before the khat */}
        {/* (large on the floor until the heist cut; from that cut the rig's own size, so the pick-up matches) */}
        <ContactShadow x={bowlX} y={SHRINE.floorY} rx={36 * (bowlS / 0.94)} ry={8.5} opacity={0.32} sunDir={-1} />
        {bowlFull && (
          <g>
            <HeldObjectArt kind="stoneBowl" x={bowlX} y={bowlY} s={bowlS} fill={1} />
            <ellipse cx={bowlX - 6} cy={bowlY - 12} rx={9 + 3 * glint} ry={2.2} fill="#fff8e0" opacity={0.25 + 0.4 * glint} />
          </g>
        )}
        {bowlEmpty && <HeldObjectArt kind="stoneBowl" x={BOWL_AT.x} y={BOWL_AT.y} s={SHRINE.balakS} fill={0} />}

        {/* Thakurer ashon / khat base on the shared floor line */}
        <ContactShadow x={1080} y={SHRINE.floorY} rx={120} ry={18} opacity={0.42} sunDir={-1} />

        {/* Bhagabati Thakur seated at the right end of the khat, clear of the doorway */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={SHRINE.priestX} y={SHRINE.floorY} rx={92} ry={18} opacity={0.48} sunDir={-1} />
          <Puppet
            cast={EP04G_CAST.bhagabati}
            x={SHRINE.priestX}
            y={SHRINE.priestY}
            scale={SHRINE.priestS}
            f={f}
            lifeF={f}
            light={EP04G_SHRINE_LIGHT}
            seated
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

      {/* The lamplight on the people inside */}
      <ShrineLampLight id="s05lamp" f={f} strength={archOp > 0 ? 0.7 : 1} />

      {/* Veranda shots: the outer wall and the veranda floor, then the doorway arch (curtain drawn back) in the same plane */}
      {archOp > 0 && <VerandaExterior id="s05ext" f={f} />}
      <ShrineArchFrame id="s05arch" opacity={archOp} f={f} depth={1.0} />

      {/* The veranda, outside the threshold (in front of the arch) */}
      <GhibliLayer depth={1.0}>
        {dhoopOnVeranda && (
          <g>
            <ContactShadow x={DHOOP_V.x} y={VERANDA_OUT.y} rx={17 * (dhoopVY >= DHOOP_V.y - 0.5 ? 1 : 0.7)} ry={4.5} opacity={0.28} sunDir={-1} />
            <HeldObjectArt kind="incense" x={DHOOP_V.x} y={dhoopVY} s={VERANDA_OUT.s} lifeF={f} />
            <GhibliSmokeCurls x={DHOOP_V.x} y={dhoopVY - 10} f={f} scale={0.6} />
          </g>
        )}
        {thkVisible && (
          <g filter="url(#ghibli-char-ink)">
            <ContactShadow x={thkSpot.x} y={thkSpot.y} rx={42} ry={10} opacity={0.28} sunDir={-1} />
            <Puppet
              cast={EP04G_CAST.thakurma}
              x={thkSpot.x}
              y={thkSpot.y}
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
