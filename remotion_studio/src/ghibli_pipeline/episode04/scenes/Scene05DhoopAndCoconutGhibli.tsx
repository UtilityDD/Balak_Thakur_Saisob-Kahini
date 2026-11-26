import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, lerp } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { Puppet, type PropRenderer, type PuppetAnchors } from "../../../cinematic/rig/Puppet";
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
import { Ep04BalakDivine, Ep04BalakGroundGlow, Ep04BalakInkDefs } from "../Ep04BalakDivine";
import { EP04_BALAK_LOOK } from "../ep04BalakLook";
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
  priestX: 1240,
  /** Same ground line as the floor props and Balak: the room floor in front of the khat. */
  priestY: 982,
  priestS: 1.06,
  /** Where his knee-walk in starts (the doorway sill, in the interior shots' world). */
  verandaX: 600,
  verandaY: 1045,
  verandaS: 0.8,
  /** Inside: kneeling spot beside the priest where he sets the dhoop-dani down (it lands just left of his lap). */
  setX: 920,
  /**
   * Inside: his seat on the floor at the left front corner of the khat, clear of the brass lota painted on the khat
   * plate (world x ~820-880), with the stone bowl just in front of that lota.
   */
  seatX: 760,
  /**
   * The room floor (world y) where Balak, the bowl and the dhoop-dani sit: a little in front of the brass lota and bell
   * painted at the foot of the khat (their bases measure 978-1021 depending on the shot, since the room plate sits at
   * depth 0.58), so he always reads on the floor in front of them. The old 940 sat above the wall base (floating).
   */
  floorY: 1012,
  balakS: 0.8,
} as const;
/**
 * Outside the threshold (veranda shots of Scene 05 only, AG6 / Shot 20 / Shot 22): he sits on the veranda floor in
 * front of the shrine's outer wall, just left of the doorway ("বারান্দায় বসে"), looking in. Left of the opening so
 * the left pillar reads between him and the lamplit room; the veranda is drawn in front of the arch.
 */
export const VERANDA_OUT = { x: 428, y: 1128, s: 0.86 } as const;
/** kneelReach target for the dhoop-dani on the floor (figure units). */
/** (y +30 units: set down on the floor just in front of the khat's stepped base, not on its step) */
export const DHOOP_REACH = { x: 92, y: -HELD_OBJECT_BOTTOM.incense + 30 } as const;
/**
 * Where the set-down dhoop-dani rests (world): exactly where the rig's hands put the held cup (measured on the hand-off
 * frames: the kneeling hands stop a little short of `reachAt`, so the cup is drawn about 11 px left of and 15 px above
 * reachAt). Pass 2: before, the cup jumped ~25 screen px down and right at the hand-off.
 */
export const DHOOP_SET = {
  x: SHRINE.setX + DHOOP_REACH.x * SHRINE.balakS - 11.5,
  y: SHRINE.floorY + DHOOP_REACH.y * SHRINE.balakS - 14.8,
} as const;
/** drinkBowl reach target (figure units): a little further out than the rig default so his crossed knee never
 * hides the brimming bowl in the insert. */
export const BOWL_REACH = { x: DRINK_BOWL_AT.x + 22, y: DRINK_BOWL_AT.y } as const;
/** Stone bowl origin where drinkBowl finds it (BOWL_REACH from his seat). */
export const BOWL_AT = {
  x: SHRINE.seatX + BOWL_REACH.x * SHRINE.balakS,
  y: SHRINE.floorY + BOWL_REACH.y * SHRINE.balakS,
} as const;
/** The wide grey stone bowl on the floor is drawn larger than the rig's held bowl (STO-22c: the coconut shown large);
 * the rig's own size takes over at the heist cut. */
export const BOWL_FLOOR_S = SHRINE.balakS;
/** One bowl, one place, one size: exactly where the drinkBowl pose picks it up and sets it back (no jumps). */
export const BOWL_FLOOR = { x: BOWL_AT.x, y: BOWL_AT.y } as const;

/** Where the priest's two offered marigolds land, on the floor before the khat (Scene 05 tosses them; Scene 06 keeps them). */
export const OFFERED_FLOWERS = [
  { x: 1090, y: SHRINE.floorY - 3 },
  { x: 1118, y: SHRINE.floorY + 2 },
] as const;

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
          <stop offset="0" stopColor="#8e5440" />
          <stop offset="0.5" stopColor="#744233" />
          <stop offset="1" stopColor="#5a3428" />
        </linearGradient>
        <radialGradient id={`${id}-spill`} cx="50%" cy="0%" r="100%">
          <stop offset="0" stopColor="#ffc27a" stopOpacity={0.68} />
          <stop offset="0.6" stopColor="#ffae5c" stopOpacity={0.24} />
          <stop offset="1" stopColor="#ffae5c" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-wallspill`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffc27a" stopOpacity={0.5} />
          <stop offset="0.55" stopColor="#ffae5c" stopOpacity={0.16} />
          <stop offset="1" stopColor="#ffae5c" stopOpacity={0} />
        </radialGradient>
        {/* full-moon night outside: the veranda cools to blue-grey away from the lamplit doorway */}
        <radialGradient
          id={`${id}-moon`}
          gradientUnits="userSpaceOnUse"
          cx={ARCH_DX + 683 * ARCH_K}
          cy={ARCH_DY + 1100 * ARCH_K}
          r={1500}
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.4" stopColor="#d4dbeb" stopOpacity={0.4} />
          <stop offset="1" stopColor="#97a3c6" stopOpacity={0.62} />
        </radialGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dfe9ff" stopOpacity={0.4} />
          <stop offset="1" stopColor="#dfe9ff" stopOpacity={0.05} />
        </linearGradient>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
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
        {/* lamplight from the doorway warming the wall beside it (fades to nothing at its edge) */}
        <ellipse cx={ARCH_DX + 683 * ARCH_K} cy={ARCH_DY + 1000 * ARCH_K} rx={760} ry={520} fill={`url(#${id}-wallspill)`} opacity={0.78 * flick} style={{ mixBlendMode: "screen" }} />
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
      {/* moonlight from the open courtyard (camera left): a pale slanting pool on the veranda floor, broken by the
          shadow of a veranda pillar, and the cool night over everything away from the doorway */}
      <g filter={`url(#${id}-soft)`} style={{ mixBlendMode: "screen" }}>
        <path
          d={`M -520 ${ARCH_DY + SILL_PY * ARCH_K} L 330 ${ARCH_DY + SILL_PY * ARCH_K} L 560 1420 L -360 1420 Z`}
          fill={`url(#${id}-beam)`}
        />
      </g>
      <g filter={`url(#${id}-soft)`} opacity={0.35}>
        <path d={`M -40 ${ARCH_DY + SILL_PY * ARCH_K} L 60 ${ARCH_DY + SILL_PY * ARCH_K} L 210 1420 L 80 1420 Z`} fill="#2a2f45" />
      </g>
      <rect x={-2400} y={-2000} width={6400} height={3600} fill={`url(#${id}-moon)`} style={{ mixBlendMode: "multiply" }} />
    </GhibliLayer>
  );
};

/**
 * What makes the veranda read as a veranda (Scene 05 doorway shots): the underside of the veranda roof (a dark beam
 * with rafter ends) across the top of the wide, and the nearest veranda pillar in soft focus at the left edge: a
 * lime-plastered pillar with a moulded capital and plinth, cool and moonlit on its courtyard side, warmed on the side
 * that faces the lamplit doorway (Pass 2: it read as a dark unexplained post).
 */
export const VerandaForeground: React.FC<{ id: string }> = ({ id }) => (
  <>
    <GhibliLayer depth={1.04}>
      <defs>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f1712" />
          <stop offset="1" stopColor="#3a2b22" />
        </linearGradient>
      </defs>
      <rect x={-2400} y={-1400} width={6400} height={1960} fill={`url(#${id}-beam)`} />
      <rect x={-2400} y={556} width={6400} height={6} fill="#6b7896" opacity={0.55} />
      {Array.from({ length: 34 }, (_, i) => (
        <rect key={i} x={-2400 + i * 190} y={556} width={46} height={30} rx={3} fill="#2c211a" />
      ))}
    </GhibliLayer>
    <GhibliLayer depth={1.12} extraBlur={2.2}>
      <defs>
        {/* lime plaster: cool moonlit edge on the courtyard side (left), warm lamplit face toward the doorway (right) */}
        <linearGradient id={`${id}-pillar`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa6c2" />
          <stop offset="0.16" stopColor="#c9c6c4" />
          <stop offset="0.5" stopColor="#d6c6aa" />
          <stop offset="0.82" stopColor="#e9c48c" />
          <stop offset="1" stopColor="#c99a62" />
        </linearGradient>
        <linearGradient id={`${id}-pillarV`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1d16" stopOpacity={0.45} />
          <stop offset="0.3" stopColor="#2a1d16" stopOpacity={0} />
          <stop offset="0.85" stopColor="#2a1d16" stopOpacity={0} />
          <stop offset="1" stopColor="#2a1d16" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <g>
        {/* shaft */}
        <rect x={56} y={-1400} width={124} height={2620} fill={`url(#${id}-pillar)`} />
        <rect x={56} y={-1400} width={124} height={2620} fill={`url(#${id}-pillarV)`} />
        {/* moulded capital under the veranda beam */}
        <rect x={36} y={548} width={164} height={22} rx={4} fill={`url(#${id}-pillar)`} />
        <rect x={44} y={570} width={148} height={12} rx={3} fill={`url(#${id}-pillar)`} />
        <rect x={36} y={568} width={164} height={3} fill="#5a4636" opacity={0.35} />
        {/* plinth on the veranda floor */}
        <rect x={30} y={1180} width={176} height={20} rx={3} fill={`url(#${id}-pillar)`} />
        <rect x={20} y={1198} width={196} height={340} fill={`url(#${id}-pillar)`} />
        <rect x={20} y={1198} width={196} height={4} fill="#5a4636" opacity={0.3} />
        {/* a few soft sepia plaster marks */}
        <g fill="none" stroke="#7d6a55" strokeWidth={1.6} strokeLinecap="round" opacity={0.4}>
          <path d="M 96 760 q 8 30 -2 60 q -6 22 4 44" />
          <path d="M 142 980 q -6 26 4 50" />
        </g>
      </g>
    </GhibliLayer>
  </>
);

/** Cool moonlight on the people on the veranda (soft-light from the courtyard side), the warm lamp stays inside. */
export const VerandaMoonOnPeople: React.FC<{ id: string }> = ({ id }) => (
  <GhibliLayer depth={1.0} blend="soft-light">
    <defs>
      <linearGradient id={`${id}-cool`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={ARCH_DX + 200 * ARCH_K} y2={0}>
        <stop offset="0" stopColor="#6f82b6" stopOpacity={0.5} />
        <stop offset="1" stopColor="#5f74ad" stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={-2400} y={-1400} width={6400} height={3200} fill={`url(#${id}-cool)`} />
  </GhibliLayer>
);

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
/** Gobinda sits on the khat; y tracks the khat ground lock (khat plate anchored at 940, +55 from the old 885 plate). */
export const GOBINDA_AT = { x: 1031, y: 697 } as const;
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
/** A small copper kushi (puja spoon) for pouring water, drawn in hand space (handle in the fist, bowl past the fingers). */
const KushiProp: PropRenderer = ({ scale }) => (
  <g transform={`scale(${(scale * 0.62).toFixed(3)})`}>
    <rect x={-2} y={-14} width={4} height={30} rx={2} fill="#a8603a" />
    <path d="M -9 16 Q -9 30 0 31 Q 9 30 9 16 Z" fill="#b86a3c" />
    <ellipse cx={0} cy={16} rx={9} ry={2.6} fill="#d98c58" />
    <path d="M -5 19 Q -5 25 -1 27" fill="none" stroke="#f2c08e" strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
  </g>
);
export const PRIEST_PROPS: Record<string, PropRenderer> = { bell: BellProp, flower: FlowerProp, kushi: KushiProp };

/** Piecewise eased keys for an arm (or any channel set): values hold before the first and after the last key. */
export const keyed = (fr: number, keys: ReadonlyArray<{ f: number; v: ReadonlyArray<number> }>): number[] => {
  if (fr <= keys[0].f) return [...keys[0].v];
  for (let i = 1; i < keys.length; i++) {
    if (fr <= keys[i].f) {
      const a = keys[i - 1];
      const b = keys[i];
      const t = EASE.inOut(clamp((fr - a.f) / Math.max(1, b.f - a.f), 0, 1));
      return a.v.map((x, k) => lerp(x, b.v[k], t));
    }
  }
  return [...keys[keys.length - 1].v];
};

/** A thin run of water drops from the kushi's lip to the floor (lamplit), with a tiny splash ring where it lands. */
const PourDrops: React.FC<{ f: number; x: number; y: number; floorY: number }> = ({ f, x, y, floorY }) => {
  const h = Math.max(10, floorY - y);
  return (
    <g>
      {Array.from({ length: 6 }, (_, i) => {
        const u = ((f * 0.21 + i / 6) % 1 + 1) % 1;
        return <ellipse key={i} cx={x + 1.5 * u} cy={y + h * u * u} rx={1.3} ry={2.4 + 2 * u} fill="#e8f2ff" opacity={0.75} />;
      })}
      <path d={`M ${x} ${y} Q ${x + 1} ${y + h * 0.5} ${x + 1.5} ${y + h}`} fill="none" stroke="#dfeeff" strokeWidth={1.1} opacity={0.35} />
      <ellipse cx={x + 1.5} cy={floorY} rx={6 + 2 * Math.sin(f * 0.7)} ry={1.6} fill="none" stroke="#f4f8ff" strokeWidth={0.9} opacity={0.55} />
    </g>
  );
};

/** A marigold tossed in offering: flies on a small arc from the hand to the floor before the khat, then lies there. */
export const OfferedFlower: React.FC<{ f: number; start: number; from: { x: number; y: number }; to: { x: number; y: number }; dur?: number }> = ({
  f,
  start,
  from,
  to,
  dur = 16,
}) => {
  if (f < start) return null;
  const t = clamp((f - start) / dur, 0, 1);
  const x = lerp(from.x, to.x, t);
  const y = lerp(from.y, to.y, t * t) - 34 * Math.sin(Math.PI * t);
  const rot = t < 1 ? 260 * t : 30;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(1)})`}>
      {t >= 1 && <ellipse cx={0} cy={4} rx={7} ry={2} fill="#2a160c" opacity={0.3} />}
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={0} cy={-3.2} rx={2.4} ry={3.8} fill="#f09a1e" transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={0} r={2.7} fill="#e07b12" />
    </g>
  );
};

/**
 * Bhagabati Thakur with his white mustache readable (the face table gives him a thin brow-coloured one that vanished
 * on screen): a string colour makes the rig draw it at full weight in white. Same face otherwise.
 */
const PRIEST_LOOK = (EP04G_CAST.bhagabati as typeof EP04G_CAST.bhagabati & { look?: Record<string, unknown> }).look ?? {};
export const PRIEST_CAST = { ...EP04G_CAST.bhagabati, look: { ...PRIEST_LOOK, mustache: "#f8f6f1" } } as typeof EP04G_CAST.bhagabati;

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
 * 05d 558-614, 05e 638-728, 05f 736-809, AG7 821-941). Pass 2 (gestures): folded hands to ask, the pick-up in the
 * doorway shot on "হুঁ হুঁ, দে—" and the cut on the lift, two-hand carry, folded hands again for 05e. */
export const S05 = {
  thkSettle: 26, // Thakurma's dhoop-dani touches the veranda floor
  thkLetGo: 32,
  thkRiseEnd: 58,
  thkStay: 46, // rising, she holds a gentle palm out over him: "stay here" (to 76)
  thkWalkFrom: 74,
  thkWalkTo: 248,
  glanceSill: 140, // "ঠাকুরঘরে ঢোকা বারণ—": he looks down at the threshold
  sigh: 156,
  fold: 470, // rises onto his knees and folds his hands to ask ("ঠাকুরমশায়, আমি ধূপ দেব?" 478-550)
  reach: 558, // "হুঁ হুঁ, দে—": both hands to the dhoop-dani (kneelReach, grip at +26)
  lift: 586, // lifts it in both hands and carries it in, carefully ("তাড়াতাড়ি দে।")
  walkFrom: 590,
  walkTo: 626,
  set: 618, // kneelReach set-down beside the priest; contact / release at set + 26 (644)
  fold2: 646, // "ঠাকুরমশায়, …" (05e 638-728): folded hands again, up on his knees
  point: 684, // "...ঘরে বসব?": a small open hand to the floor
  backFrom: 754, // "হুঁ হুঁ, বোস…": shuffles back to the seat before the khat
  backTo: 790,
  sitEnd: 804,
  eyeBowl: 806,
  widen: 838,
  drink: 848, // drinkBowl poseStart: the bowl reaches his lips at +25 (873, the music's gulp crest)
  wipe: 921, // back of the hand across the mouth
  wipeEnd: 940,
} as const;
/** The dhoop-dani touches the floor beside the priest (sound cue: brass tap). */
export const S05_DHOOP_CONTACT = S05.set + KNEEL_REACH_T.grip;
/** His hands let go of it (still round it until the folded hands for 05e): from here the scene draws it on the floor. */
export const S05_DHOOP_RELEASE = S05_DHOOP_CONTACT;
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
  const cutD = S05.lift + 2; // Shot 23: interior, cut on the lift: Balak carries the dhoop-dani in
  const cutE = s5e.from - 6; // Shot 24a: medium on Balak (05e), up on his knees beside the priest, pointing to the floor
  const cutF = s5f.from - 4; // Shot 24b: two-shot (05f), the priest waves him in; he shuffles back and sits before the khat
  const gobFrom = p9.from - 4; // P9 insert: Gobinda on the khat, no dhoop burning before Him (nobody comes)
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
  } else if (f < gobFrom) {
    // Shot 21: the priest calls for dhoop
    const t = ramp(f, cutB, s5b.to);
    cam = frameAt(lerp(1214, 1222, t), SHRINE.priestY, 790, lerp(1.66, 1.7, t));
  } else if (f < cutC) {
    // P9 insert: brass Gobinda on the khat, large, the lamp flames beside Him, no dhoop smoke before Him
    const t = ramp(f, gobFrom, cutC);
    cam = frameAt(GOBINDA_AT.x - 115, GOBINDA_AT.y - 40, 470, lerp(3.8, 3.92, t));
  } else if (f < cutD) {
    // Shot 22: medium on Balak at the doorway, outside, hands on the dhoop-dani's handle as he asks; the doorframe
    // between him and the lamplit room
    const t = ramp(f, cutC, s5c.to);
    cam = frameAt(lerp(520, 526, t), VERANDA_OUT.y, 770, lerp(2.8, 2.88, t));
    archOp = 1;
  } else if (f < cutE) {
    // Shot 23: interior; he hurries the dhoop-dani in and sets it beside the priest; the camera eases with him
    const t = ramp(f, S05.walkFrom, S05.walkTo + 20);
    cam = frameAt(lerp(930, 1040, t), SHRINE.floorY, 790, lerp(1.5, 1.56, t));
  } else if (f < cutF) {
    // Shot 24a: medium on Balak, up on his knees beside the priest's lap, a small open hand to the floor
    const t = ramp(f, cutE, cutF);
    cam = frameAt(lerp(952, 948, t), SHRINE.floorY, 760, lerp(3.0, 3.08, t));
  } else if (f < cutInsert) {
    // Shot 24b: two-shot; the priest waves him in, he shuffles back to the front corner of the khat and sits
    const t = ramp(f, cutF, s5f.to);
    cam = frameAt(lerp(1010, 990, t), SHRINE.floorY, 790, lerp(1.78, 1.8, t));
  } else if (f < cutHeist) {
    // AG7 insert: the brimming stone bowl gleaming in the lamplight (his eyes on it at the top of frame)
    const t = ramp(f, cutInsert, cutHeist);
    cam = frameAt(lerp(806, 808, t), SHRINE.floorY, 700, lerp(3.3, 3.36, t));
  } else {
    // AG7: medium close on Balak lifting the wide stone bowl to his lips in both hands, slow push (1.0 -> 1.1)
    const t = ramp(f, cutHeist, ag7.to);
    cam = frameAt(lerp(790, 792, t), SHRINE.floorY, 760, lerp(2.9, 3.2, t));
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
  const dhoopVYAt = (fr: number) => DHOOP_V.y - 22 * (1 - EASE.out(clamp((fr - 8) / (S05.thkSettle - 8), 0, 1)));
  const dhoopVY = dhoopVYAt(f);
  const thakurmaActing = (fr: number) => {
    const down = 1 - ramp(fr, S05.thkLetGo, S05.thkRiseEnd);
    const hold = 1 - ramp(fr, S05.thkLetGo - 2, S05.thkLetGo + 8);
    // "stay here, don't go in": as she straightens she looks down at him with a smile, a small nod, and holds a
    // gentle palm out over his head (palm down), then turns away to walk off
    const stay = ramp(fr, S05.thkStay, S05.thkStay + 10) * (1 - ramp(fr, S05.thkStay + 24, S05.thkStay + 34));
    const nod = 5 * Math.sin(clamp((fr - (S05.thkStay + 8)) / 14, 0, 1) * Math.PI);
    return poseOf({
      kneel: down,
      lean: 14 * down + 4 * stay,
      bow: 0.42 * down,
      bodyTurn: safeBodyTurn(-0.32),
      headTurn: lerp(-0.3, -0.42, 1 - down),
      headNod: 10 * down + 6 * stay + nod,
      eyeY: 0.4 * down + 0.45 * stay,
      stride: thkStrideFn(fr),
      smile: 0.45 + 0.25 * stay,
      reach: Math.max(hold, 0.85 * stay),
      reachUp: 0,
      rHand: stay > 0.3 ? "open" : "hold",
      rS: lerp(-14, 30, down),
      rE: lerp(-24, -20, down),
      lS: 10,
      lE: -18,
    });
  };
  /** Her right hand: on the dhoop-dani's handle, then held out over Balak's head ("stay"). */
  const thkReachAt = (fr: number) =>
    fr < S05.thkLetGo + 8 ? { x: DHOOP_V.x + 2, y: dhoopVYAt(fr) - 9 } : { x: VERANDA_OUT.x + 40, y: VERANDA_OUT.y - 205 * VERANDA_OUT.s };
  const thkVisible = f < S05.thkWalkTo + 4 && f < cutB;

  /* ---------------- Priest (Bhagabati Thakur) ---------------- */
  const priestLines = ["05b_Bhagabati_Dhoop.wav", "05d_Bhagabati_Huhu1.wav", "05f_Bhagabati_Huhu2.wav"] as const;
  const priestRms = (fr: number) => ep04gSpeakRms(SCENE_ID, priestLines, fr);
  const priestMouth = (fr: number) => mouthFromRms(priestRms(fr), fr);
  const priestTalk = (fr: number) => clamp(priestRms(fr) * 1.2, 0, 1);
  const turnAway = (fr: number) => ramp(fr, cutInsert - 4, cutInsert + 12); // AG7: his back half-turned to Balak
  const ringAt = ag7.from + 18; // the bell (Episode04Ghibli plays temple_bell_drop here)
  /**
   * Busy puja hands (Pass 2). The near (right) hand works through the evening abhishek while the narrator speaks and
   * between his lines: the bell (rung on the two AG6 bell sounds, s05Open + 14 and + 36), a marigold raised to the
   * forehead and tossed to the khat, water poured from the copper kushi, a fresh flower. During Balak's asking he keeps
   * offering the flower in small circles; on "এতে গন্ধে পুষ্পে…" the flower goes to his forehead and is tossed. Keys:
   * [rS, rE] of the near arm (bodyTurn about -0.25: negative rS is forward, toward the khat).
   */
  const R_REST = [-46, -68];
  const R_LAP = [-16, -42];
  const R_BELL = [-60, -76];
  const R_HEAD = [-100, -128];
  const R_TOSS = [-86, -24];
  const R_POUR = [-54, -34];
  const PJ = {
    bellDown: 50, // the bell goes down by his knee
    flower1: 62, // picks a marigold
    head1: 92, // to the forehead
    toss1: 116, // offered: released at the top of the throw
    flower2: 146, // a fresh flower, held through his call for dhoop and "হুঁ হুঁ, দে—"
    flowerDown: 604, // "তাড়াতাড়ি দে।": the flower down, the kushi up
    kushi: 612,
    pourFrom: 626, // pouring water while Balak asks to sit (05e)
    pourTo: 722,
    kushiDown: 732,
    flower3: 740,
    head2: s5f.from + 40, // "এতে গন্ধে পুষ্পে…": to the forehead
    toss2: s5f.from + 62, // and tossed
  } as const;
  const pujaKeys = [
    { f: 0, v: R_BELL },
    { f: 42, v: R_BELL },
    { f: PJ.bellDown, v: R_LAP },
    { f: PJ.flower1 + 4, v: R_LAP },
    { f: PJ.flower1 + 16, v: R_REST },
    { f: PJ.head1, v: R_HEAD },
    { f: PJ.head1 + 12, v: R_HEAD },
    { f: PJ.toss1, v: R_TOSS },
    { f: PJ.toss1 + 10, v: R_TOSS },
    { f: PJ.flower2 - 4, v: R_LAP },
    { f: PJ.flower2 + 4, v: R_LAP },
    { f: PJ.flower2 + 20, v: R_REST },
  ] as const;
  const offerKeys = [
    { f: PJ.flowerDown - 10, v: R_REST },
    { f: PJ.flowerDown, v: R_LAP },
    { f: PJ.kushi + 2, v: R_LAP },
    { f: PJ.pourFrom, v: R_POUR },
    { f: PJ.pourTo, v: R_POUR },
    { f: PJ.kushiDown, v: R_LAP },
    { f: PJ.flower3 + 2, v: R_LAP },
    { f: PJ.flower3 + 16, v: R_REST },
    { f: PJ.head2 - 12, v: R_REST },
    { f: PJ.head2, v: R_HEAD },
    { f: PJ.head2 + 8, v: R_HEAD },
    { f: PJ.toss2, v: R_TOSS },
    { f: PJ.toss2 + 10, v: R_TOSS },
    { f: PJ.toss2 + 22, v: R_REST },
  ] as const;
  const rPropAt = (fr: number): string => {
    if (fr < PJ.bellDown + 3) return "bell";
    if (fr < PJ.flower1) return "";
    if (fr < PJ.toss1) return "flower";
    if (fr < PJ.flower2) return "";
    if (fr < PJ.flowerDown) return "flower";
    if (fr < PJ.kushi) return "";
    if (fr < PJ.kushiDown) return "kushi";
    if (fr < PJ.flower3) return "";
    if (fr < PJ.toss2) return "flower";
    return "";
  };
  const pujaR = (fr: number): { rS: number; rE: number } => {
    const k = fr < s5b.from - 4 ? keyed(fr, pujaKeys) : fr < PJ.flowerDown - 10 ? R_REST : keyed(fr, offerKeys);
    let rS = k[0];
    let rE = k[1];
    // the bell rung on the AG6 bell sounds; small tips of the kushi while the water runs
    const ringR = bellShake(fr, 14, 18, 7) + bellShake(fr, 36, 16, 6);
    rS += ringR;
    rE += 1.6 * ringR;
    if (fr >= PJ.pourFrom && fr < PJ.pourTo) rE += 5 * Math.sin((fr - PJ.pourFrom) * 0.16) * ramp(fr, PJ.pourFrom, PJ.pourFrom + 8);
    return { rS, rE };
  };
  /** Pouring: water runs from the kushi while it is tipped (drops drawn from the live wrist). */
  const pouring = (fr: number) => fr >= PJ.pourFrom + 6 && fr < PJ.pourTo - 4;
  const priestActing = (fr: number) => {
    const in5b = fr >= s5b.from - 4 && fr < s5b.to;
    const inP9 = fr >= p9.from && fr < p9.to + 4;
    const lookRight = in5b && fr < s5b.from + 18; // "ধূপ!" over his shoulder
    const lookDoor = (in5b && fr >= s5b.from + 18) || inP9; // "আরে, ধূপ কই? কেউ কি নেই নাকি?" / P9
    const wave1 = fr >= s5d.from - 2 && fr < s5d.to + 6;
    const wave2 = fr >= s5f.from - 2 && fr < s5f.from + 34;
    const away = turnAway(fr);
    const ring = bellShake(fr, ringAt, 18, 8) + bellShake(fr, ringAt + 30, 16, 6);
    // the absent-minded wave of the far hand: a loose flick on each "হুঁ"
    const dismiss = Math.sin(fr * 0.44) * 16 * (0.6 + 0.4 * priestTalk(fr));
    const blink = Math.max(blinkAt(fr, p9.from + 9), blinkAt(fr, s5b.from + 60), blinkAt(fr, 128), blinkAt(fr, 300));
    const eyeDart = inP9 ? 0.25 * Math.sin((fr - p9.from) * 0.35) : 0;
    const breath = 0.35 * Math.sin(fr * 0.06);
    const pujaPhase = fr < s5b.from - 4;
    const atHead = pujaPhase
      ? ramp(fr, PJ.head1 - 10, PJ.head1) * (1 - ramp(fr, PJ.head1 + 12, PJ.toss1))
      : ramp(fr, PJ.head2 - 10, PJ.head2) * (1 - ramp(fr, PJ.head2 + 8, PJ.toss2));
    const tossing = pujaPhase
      ? ramp(fr, PJ.head1 + 12, PJ.toss1) * (1 - ramp(fr, PJ.toss1 + 10, PJ.kushi - 4))
      : ramp(fr, PJ.head2 + 8, PJ.toss2) * (1 - ramp(fr, PJ.toss2 + 10, PJ.toss2 + 22));
    const pour = ramp(fr, PJ.pourFrom - 8, PJ.pourFrom) * (1 - ramp(fr, PJ.pourTo, PJ.kushiDown));
    // in his lines and while listening, the flower hand keeps a slow small offering circle (busy, absorbed)
    const circle = !pujaPhase && !lookDoor && !lookRight && (fr < PJ.flowerDown - 10 || (fr >= PJ.flower3 + 16 && fr < PJ.head2 - 12)) ? 1 : 0;
    const R = pujaR(fr);
    const rCircleS = circle * 6 * Math.sin(fr * 0.12);
    const rCircleE = circle * 6 * Math.cos(fr * 0.12);
    // "কেউ কি নেই নাকি?": the flower hand gives impatient flicks on the stressed words
    const flick = lookDoor && in5b ? 8 * priestRms(fr) * Math.sin(fr * 0.6) : 0;
    const chantLean = 2.4 + 0.9 * Math.sin(fr * 0.07);
    const lean =
      lookDoor || lookRight
        ? breath
        : pujaPhase
          ? chantLean + 4 * tossing + 3 * pour - 2 * atHead
          : wave1 || wave2
            ? 1 + breath + 3 * tossing
            : chantLean + 3 * tossing + 3 * pour;
    const base = poseOf({
      kneel: 0,
      lean,
      bodyTurn: safeBodyTurn(lerp(lookRight ? 0.12 : lookDoor ? -0.32 : -0.24, 0.3, away)),
      headTurn: lerp(lookRight ? 0.46 : lookDoor ? -0.56 : pour > 0.5 ? -0.3 : wave1 || wave2 ? -0.06 : -0.16, 0.42, away),
      headNod: lookRight
        ? 6
        : lookDoor
          ? 2
          : 7 * atHead + 4 * pour + (pujaPhase ? -3 + 2.2 * Math.sin(fr * 0.11) : 0) + lerp(0, -4, away),
      eyeX: eyeDart,
      eyeY: in5b || inP9 ? 0.06 : pour > 0.5 ? 0.45 : -0.2,
      lid: Math.max(blink, away > 0.5 ? 0.72 : atHead > 0.5 ? 0.85 : pujaPhase ? 0.5 : wave1 || wave2 ? 0.46 : 0.3),
      brow: in5b || inP9 ? -0.32 : 0.05,
      browTilt: inP9 ? 0.2 : 0,
      smile: in5b || inP9 ? 0.02 : 0.25,
      rS: lookDoor ? -54 - priestRms(fr) * 12 + flick : lookRight ? -34 : R.rS + rCircleS,
      rE: lookDoor ? -52 + flick * 0.6 : lookRight ? -60 : R.rE + rCircleE,
      rHand: "hold",
      rProp: lookDoor || lookRight ? "flower" : rPropAt(fr),
      // far hand: rests on the knee through the puja, opens "where?" toward the door, waves on each "হুঁ হুঁ"
      lS: wave1 || wave2 ? -48 + dismiss : lookDoor ? -30 - 6 * priestRms(fr) : 6 + 4 * atHead,
      lE: wave1 || wave2 ? -62 + dismiss * 0.6 : lookDoor ? -54 : -10,
      lHand: wave1 || wave2 || lookDoor ? "open" : "relaxed",
    });
    if (away <= 0.001) return base;
    // AG7: turned to the khat, the bell raised in the near (left) hand and rung; the right hand joined in pranam
    return {
      ...base,
      lS: lerp(base.lS, 58 + ring, away),
      lE: lerp(base.lE, -96 + ring * 0.6, away),
      lHand: away > 0.4 ? "hold" : base.lHand,
      lProp: away > 0.4 ? "bell" : "",
      rS: lerp(base.rS, -20, away),
      rE: lerp(base.rE, -70, away),
      rHand: away > 0.4 ? "pranam" : base.rHand,
      rProp: away > 0.4 ? "" : base.rProp,
    };
  };
  // the priest's live wrists (filled by his Puppet each frame; the kushi water is drawn from the near wrist)
  const priestAnchors: { a?: PuppetAnchors } = {};
  // the two offered flowers: from the hand at the top of the throw to the floor before the khat
  const TOSS_FROM = { x: SHRINE.priestX - 118, y: SHRINE.priestY - 196 };

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

  let blinkAtF: number | undefined;
  // the pose being left is solved with ITS OWN target and held object (rig: prevReachAt / prevHolding / prevReachFor)
  let prevReachAt: { x: number; y: number } | undefined;
  let prevHolding: HeldObject | undefined;
  let prevReachFor: HeldObject | undefined;
  const DHOOP_V_REACH = { x: (DHOOP_V.x - VERANDA_OUT.x) / VERANDA_OUT.s, y: (DHOOP_V.y - VERANDA_OUT.y) / VERANDA_OUT.s };
  const CARRY_AT = { x: 62, y: -98 };
  if (f < S05.fold) {
    // AG6 / Shot 20 / Shot 21 / P9: obediently outside, watching the puja
    pose = "sitCross";
    const watchThk = f < S05.thkRiseEnd + 10;
    const atSill = f >= S05.glanceSill && f < S05.glanceSill + 46;
    face = watchThk
      ? { lookX: 0.22, eyesDown: 0.45, smile: 0.6 }
      : atSill
        ? { lookX: 0.4, eyesDown: 0.62, smile: 0.3 }
        : f >= s5b.from && f < p9.to
          ? { lookX: 0.42, smile: 0.5 }
          : { lookX: 0.36, smile: 0.52 };
    expr = atSill ? "thoughtful" : f >= s5b.from + 50 ? "playful" : "serene";
    sigh = sighCurve(S05.sigh, 12, 26, 2);
    // "ধূপ!": the call makes him look up quickly
    if (f >= s5b.from) blinkAtF = s5b.from + 3;
  } else if (f < S05.reach) {
    // Shot 22: up on his knees at the threshold, hands folded politely: "ঠাকুরমশায়, আমি ধূপ দেব?"
    pose = "bowHands";
    prevPose = "sitCross";
    poseStart = S05.fold;
    kneel = 1.5 * ramp(f, S05.fold, S05.fold + 16);
    expr = "playful";
    prevExpr = "serene";
    exprStart = S05.fold;
    face = { lookX: 0.42, smile: 0.62 };
  } else if (f < S05.lift) {
    // "হুঁ হুঁ, দে—": both hands to the dhoop-dani, round its cup and handle
    pose = "kneelReach";
    prevPose = "bowHands";
    prevPoseStart = S05.fold;
    poseStart = S05.reach;
    reachAt = DHOOP_V_REACH;
    if (f >= S05.reach + KNEEL_REACH_T.grip) holding = "incense";
    else reachFor = "incense";
    kneel = 1.5;
    expr = "joyful";
    prevExpr = "playful";
    exprStart = S05.reach;
    face = { lookX: 0.36, smile: 0.72 };
  } else if (f < S05.set) {
    // "তাড়াতাড়ি দে।": lifts it in both hands and knee-walks it in, carefully, his eyes on the smoking cup
    pose = "offerUp";
    prevPose = "kneelReach";
    prevPoseStart = S05.reach;
    poseStart = S05.lift;
    holding = "incense";
    reachAt = CARRY_AT;
    prevReachAt = DHOOP_V_REACH;
    prevHolding = "incense";
    kneel = 1.5;
    expr = "serene";
    prevExpr = "joyful";
    exprStart = S05.lift;
  } else if (f < S05.fold2) {
    // sets it down right beside the priest
    pose = "kneelReach";
    prevPose = "offerUp";
    prevPoseStart = S05.lift;
    poseStart = S05.set;
    reachAt = DHOOP_REACH;
    prevReachAt = CARRY_AT;
    prevHolding = "incense";
    // in his hands until it touches the floor; then his hands stay round it (reachFor keeps the grip pose, no jump)
    if (f < S05_DHOOP_CONTACT) holding = "incense";
    else reachFor = "incense";
    kneel = 1.5;
    expr = "serene";
  } else if (f < S05.point) {
    // "ঠাকুরমশায়, …": up on his knees beside the priest, hands folded again
    pose = "bowHands";
    prevPose = "kneelReach";
    prevPoseStart = S05.set;
    poseStart = S05.fold2;
    prevReachAt = DHOOP_REACH;
    prevReachFor = "incense"; // the blend starts from the hands round the dhoop-dani
    kneel = 1.5;
    expr = "playful";
    prevExpr = "serene";
    exprStart = S05.fold2;
    face = { lookX: 0.4, smile: 0.62 };
  } else if (f < S05.backFrom) {
    // "…আমি একটু ঘরে বসব?": a small open hand to the floor before the khat
    pose = "pointIn";
    prevPose = "bowHands";
    prevPoseStart = S05.fold2;
    poseStart = S05.point;
    pointAt = { x: 92, y: -36 };
    kneel = 1.5;
    expr = "playful";
    // eyes to the floor he means, then back up to the priest for the answer
    face = f < S05.point + 22 ? { lookX: 0.3, eyesDown: 0.55, smile: 0.62 } : { lookX: 0.4, smile: 0.66 };
  } else if (f < S05.drink) {
    // "হুঁ হুঁ, বোস…": shuffles back to the khat and sits down cross-legged; then the brimming bowl catches his eye
    pose = "sitCross";
    prevPose = "pointIn";
    prevPoseStart = S05.point;
    poseStart = S05.backFrom;
    kneel = 1.5 * (1 - ramp(f, S05.backTo - 4, S05.sitEnd));
    const eyeing = f >= S05.eyeBowl;
    expr = f >= S05.widen ? "surprised" : eyeing ? "playful" : "joyful";
    prevExpr = f >= S05.widen ? "playful" : undefined;
    exprStart = f >= S05.widen ? S05.widen : undefined;
    face = eyeing ? { lookX: 0.5, eyesDown: 0.62, smile: f >= S05.widen ? 0.5 : 0.7 } : { lookX: 0.28, smile: 0.66 };
    if (f >= S05.widen) blinkAtF = S05.widen + 2;
  } else if (f < S05.wipe) {
    // AG7: lifts the heavy stone bowl in both hands and drinks every drop; sets it back with the fopra in it
    pose = "drinkBowl";
    prevPose = "sitCross";
    poseStart = S05.drink;
    reachAt = BOWL_REACH;
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
  const livingW = f < S05.fold ? 1 : f < S05.fold + 12 ? 1 - ramp(f, S05.fold, S05.fold + 12) : f >= S05.sitEnd && f < S05.drink - 12 ? ramp(f, S05.sitEnd, S05.sitEnd + 12) * (1 - ramp(f, S05.drink - 24, S05.drink - 12)) : 0;
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
    watchHeld: pose === "offerUp" ? 0.75 : undefined,
    blinkAt: blinkAtF,
    prevReachAt,
    prevHolding,
    prevReachFor,
    face,
    expression: expr,
    prevExpression: prevExpr,
    expressionStart: exprStart,
    sigh,
    mouth: balakRms,
    talk: balakRms > 0.08 ? 1 : 0,
    ...EP04_BALAK_LOOK,
  };
  const glowAnchor = seatedChildHands(balakProps).glowAnchor;

  // Dhoop-dani: Thakurma's hand -> veranda floor -> Balak's hands (rig) -> the floor beside the priest
  const dhoopOnVeranda = f < S05.reach + KNEEL_REACH_T.grip;
  const dhoopBesidePriest = f >= S05_DHOOP_RELEASE;
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
      <Ep04BalakGroundGlow x={bx} y={plantY + 5} rx={120 * (bs / 0.94)} ry={22 * (bs / 0.94)} level={onVeranda ? 0.3 : 0.42} />
      <g transform={living}>
        {/* the steady resting halo behind his head (BAL-06/11): restrained, below Scene 04's glow beat */}
        <Ep04BalakDivine cx={glowAnchor.cx} cy={glowAnchor.cy} r={glowAnchor.r * 0.5} glow={onVeranda ? 0.36 : 0.5} f={f} />
        <g filter="url(#ep04-balak-ink)">
          <ContactShadow x={bx} y={plantY} rx={52 * (bs / 0.94)} ry={10 * (bs / 0.94)} opacity={0.3} sunDir={-1} />
          <SeatedChild {...balakProps} inkZoom={cam.zoom} />
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
        {/* BAL-26f: Balak's own fine ink line (no thick whole-body outline from the shared char-ink filter) */}
        <Ep04BalakInkDefs zoom={cam.zoom} rim={0.5} f={f} />

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
        <ContactShadow x={1080} y={SHRINE.priestY} rx={120} ry={18} opacity={0.42} sunDir={-1} />

        {/* Bhagabati Thakur seated at the right end of the khat, clear of the doorway */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={SHRINE.priestX} y={SHRINE.priestY} rx={92} ry={18} opacity={0.48} sunDir={-1} />
          <Puppet
            cast={PRIEST_CAST}
            sitStyle="crossLegged"
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
            anchors={(an) => {
              priestAnchors.a = an;
            }}
          />
          {/* water running from the tipped kushi (from his live near wrist) onto the floor before him */}
          {pouring(f) && priestAnchors.a && <PourDrops f={f} x={priestAnchors.a.rWrist.x - 30} y={priestAnchors.a.rWrist.y + 14} floorY={SHRINE.priestY - 2} />}
        </g>
        {/* the marigolds he offers: tossed from the hand, they land on the floor before the khat and stay there */}
        <OfferedFlower f={f} start={PJ.toss1} from={TOSS_FROM} to={OFFERED_FLOWERS[0]} />
        <OfferedFlower f={f} start={PJ.toss2} from={TOSS_FROM} to={OFFERED_FLOWERS[1]} />

        {/* Dhoop-dani set down beside the priest */}
        {dhoopBesidePriest && (
          <g>
            <ContactShadow x={DHOOP_SET.x} y={DHOOP_SET.y + HELD_OBJECT_BOTTOM.incense * SHRINE.balakS} rx={17} ry={4.5} opacity={0.34} sunDir={-1} />
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
              reachAt={thkReachAt}
            />
          </g>
        )}
        {!inside && balakNode}
      </GhibliLayer>
      {archOp > 0 && <VerandaMoonOnPeople id="s05moon" />}
      {archOp > 0 && <VerandaForeground id="s05fg" />}

      <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} warmth={0.3} />
    </GhibliStage>
  );
};
