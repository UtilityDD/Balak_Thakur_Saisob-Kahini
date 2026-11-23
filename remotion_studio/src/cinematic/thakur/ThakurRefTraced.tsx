import React, { useId } from "react";
import { clamp, noise1 } from "../core/anim";

/**
 * Precision Coordinate-Traced SVG Rig of Balak Thakur (`01_Thakur_Age06_Child_Ujanchar.jpg`)
 * with full Episode 3 seated gesture animation.
 *
 * Standalone module (does not touch any existing library rig or delivered Episode 1-6 file).
 * Built in normalized 1920x1080 reference coordinates centered on (963, 1000) so `x, y`
 * places Balak's seated mat baseline cleanly at any scale `s` (at `s = 0.235`, matches
 * SeatedChild's exact height in Episode 3).
 *
 * Supported Episode 3 seated poses (with smooth 16-frame ease-in-out blending):
 *   - `sitCross`           Exact Reference Plate 01 serene seated posture
 *   - `bowHands`           Divine Namaskar (palms joined at heart height + gentle bow)
 *   - `bless`              Warm Abhaya blessing palm raised
 *   - `palmRaise`          Gentle open-palm speaking/teaching gesture
 *   - `pickLeaf`           Reaching gracefully toward the flower basket
 *   - `placeFlowerOnFoot`  Arcing a shiuli flower onto his own bare right foot
 *   - `pour`               Holding & pouring water from a small copper ghoti
 */

export type RefTracedPose =
  | "sitCross"
  | "bowHands"
  | "bless"
  | "palmRaise"
  | "pickLeaf"
  | "placeFlowerOnFoot"
  | "pour";

export interface ThakurRefTracedProps {
  /** World X of seated center (baseline). */
  x: number;
  /** World Y of seated mat baseline. */
  y: number;
  /** Uniform scale (1.0 = exact 1920x1080 reference plate size; ~0.235 matches SeatedChild s=1). */
  s?: number;
  /** Horizontal flip (default false). */
  flip?: boolean;
  /** Story clock frame (drives timed poses like placeFlowerOnFoot, pour, and pose transitions). */
  f?: number;
  /** Life clock frame (drives breathing, blinks, and gentle micro-motion during pauses). Default `f`. */
  lifeF?: number;
  /** Current Episode 3 seated pose (default "sitCross"). */
  pose?: RefTracedPose;
  /** Previous pose to smoothly blend from over 16 frames. */
  prevPose?: RefTracedPose;
  /** Story frame when `pose` started. */
  poseStart?: number;
  /** Number of shiuli/tulsi flowers resting on Balak's own bare right foot (0..3). */
  footFlowers?: number;
  /** Lip-sync mouth opening (0 = calm closed-lip smile, 1 = open). */
  mouth?: number;
  /** Override blink (0 = open, 1 = closed). If omitted, blinks naturally every ~3.6s. */
  blink?: number;
  /** Gaze X offset (-1..1). */
  gazeX?: number;
  /** Gaze Y offset (-1..1). */
  gazeY?: number;
  /** Head tilt in degrees. */
  headTilt?: number;
  /** Optional face steering (compatible with SeatedChild `face` prop). */
  face?: { lookX?: number; lookY?: number; eyesDown?: number; smile?: number };
  /** Divine halo intensity (0..1, default 0.55; set 0 when scene draws its own aura). */
  halo?: number;
}

const INK = "#281b13";
const SKIN = "#d1935d";
const SKIN_LIT = "#f3cda0";
const SKIN_SHADE = "#ab7348";
const HAIR = "#33251d";
const HAIR_HI = "#6e4e35";
const CLOTH = "#f5ebdb";
const CLOTH_LIT = "#fffaf0";
const CLOTH_SHADE = "#d8cbb6";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIO = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};

function naturalBlink(f: number): number {
  const period = 88;
  const phase = ((f % period) + period) % period;
  if (phase < 78 || phase > 84) return 0;
  const u = (phase - 78) / 6;
  return Math.sin(u * Math.PI);
}

/** Delicate white-and-orange shiuli flower (for held offering & resting on foot). */
const ShiuliFlower: React.FC<{ x: number; y: number; scale?: number; rot?: number }> = ({ x, y, scale = 1, rot = 0 }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${scale.toFixed(2)})`}>
    {/* Tiny green tulsi leaf beside flower */}
    <path d="M -22 4 Q -10 -12 4 0 Q -8 10 -22 4 Z" fill="#4f7a3c" stroke={INK} strokeWidth={1.8} />
    {/* 5 soft white shiuli petals */}
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse
        key={a}
        cx={0}
        cy={-11}
        rx={5.5}
        ry={10}
        fill="#fffaf0"
        stroke={INK}
        strokeWidth={1.6}
        transform={`rotate(${a})`}
      />
    ))}
    {/* Signature bright coral-orange shiuli center */}
    <circle cx={0} cy={0} r={4.8} fill="#e86d2c" stroke={INK} strokeWidth={1.4} />
  </g>
);

/** Small warm Bengali copper ghoti (water vessel) for the `pour` beat. */
const CopperGhoti: React.FC<{ x: number; y: number; pourT: number }> = ({ x, y, pourT }) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(12 + pourT * 26).toFixed(1)})`}>
    {/* Shimmering water stream when pouring */}
    {pourT > 0.15 && (
      <path
        d={`M -34 10 Q -54 58 -48 ${(92 + pourT * 40).toFixed(0)}`}
        fill="none"
        stroke="#d8eef7"
        strokeWidth={5.5}
        strokeLinecap="round"
        opacity={0.78 * pourT}
      />
    )}
    <path
      d="M -26 -24 L 26 -24 L 20 -8 C 36 4 38 34 22 48 C 10 58 -10 58 -22 48 C -38 34 -36 4 -20 -8 Z"
      fill="#c97442"
      stroke={INK}
      strokeWidth={3.0}
      strokeLinejoin="round"
    />
    <ellipse cx={0} cy={-24} rx={24} ry={6} fill="#e09464" stroke={INK} strokeWidth={2.5} />
    <path d="M -18 4 C -16 24 -8 38 4 44" fill="none" stroke="#f5c094" strokeWidth={4.5} strokeLinecap="round" opacity={0.65} />
  </g>
);

/** Articulated arm + cel-shaded hand for non-rest Episode 3 gestures. */
const ArticulatedArm: React.FC<{
  shX: number;
  shY: number;
  elX: number;
  elY: number;
  wrX: number;
  wrY: number;
  handRot: number;
  handType: "open" | "pranam" | "pinch";
  side: "L" | "R";
}> = ({ shX, shY, elX, elY, wrX, wrY, handRot, handType, side }) => {
  const isL = side === "L";
  return (
    <g>
      {/* Forearm tube with crisp dark-brown cel outline + warm fill */}
      <path
        d={`M ${shX.toFixed(1)} ${shY.toFixed(1)} Q ${elX.toFixed(1)} ${elY.toFixed(1)} ${wrX.toFixed(1)} ${wrY.toFixed(1)}`}
        fill="none"
        stroke={INK}
        strokeWidth={44}
        strokeLinecap="round"
      />
      <path
        d={`M ${shX.toFixed(1)} ${shY.toFixed(1)} Q ${elX.toFixed(1)} ${elY.toFixed(1)} ${wrX.toFixed(1)} ${wrY.toFixed(1)}`}
        fill="none"
        stroke={SKIN}
        strokeWidth={37.5}
        strokeLinecap="round"
      />
      {/* Subtle underside cel shading along forearm */}
      <path
        d={`M ${(shX + (isL ? -3 : 3)).toFixed(1)} ${(shY + 6).toFixed(1)} Q ${(elX + (isL ? -3 : 3)).toFixed(1)} ${(elY + 7).toFixed(1)} ${(wrX + (isL ? -2 : 2)).toFixed(1)} ${(wrY + 5).toFixed(1)}`}
        fill="none"
        stroke={SKIN_SHADE}
        strokeWidth={11}
        strokeLinecap="round"
        opacity={0.48}
      />

      {/* Cel-shaded hand — seamless at the wrist (no dark line cutting across the wrist!) */}
      <g transform={`translate(${wrX.toFixed(1)} ${wrY.toFixed(1)}) rotate(${handRot.toFixed(1)}) scale(${isL ? 1 : -1} 1)`}>
        {handType === "pranam" ? (
          /* Joined palm side profile for Namaskar */
          <g>
            <path
              d="M -14 8 C -18 -14 -16 -46 -6 -72 C 0 -84 12 -82 15 -68 C 19 -46 20 -14 14 10 Z"
              fill={SKIN}
            />
            <path
              d="M -14 8 C -18 -14 -16 -46 -6 -72 C 0 -84 12 -82 15 -68 C 19 -46 20 -14 14 10"
              fill="none"
              stroke={INK}
              strokeWidth={3.1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : handType === "pinch" ? (
          /* Graceful flower-holding fingers (open at wrist so forearm joins seamlessly) */
          <g>
            <path
              d="M -17 12 C -24 -12 -22 -38 -12 -58 C -5 -68 6 -66 10 -54 C 16 -46 24 -36 22 -22 C 20 -6 14 8 10 14 Z"
              fill={SKIN}
            />
            <path
              d="M -17 10 C -24 -12 -22 -38 -12 -58 C -5 -68 6 -66 10 -54 C 16 -46 24 -36 22 -22 C 20 -6 14 8 10 12"
              fill="none"
              stroke={INK}
              strokeWidth={3.0}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M -6 -44 Q 4 -34 10 -18" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
            <path d="M 4 -38 Q 12 -28 15 -14" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" />
          </g>
        ) : (
          /* Warm open palm (Abhaya blessing / gentle teaching palm — open at wrist for seamless join) */
          <g>
            <path
              d="M -18 14 C -25 -6 -28 -26 -24 -44 C -22 -52 -14 -52 -13 -44 L -11 -66 C -10 -75 -1 -75 0 -66 L 2 -70 C 4 -79 13 -78 13 -68 L 14 -62 C 16 -70 24 -68 23 -58 L 20 -26 C 28 -26 34 -18 30 -8 C 25 4 18 12 12 16 Z"
              fill={SKIN}
            />
            <path
              d="M -18 10 C -25 -6 -28 -26 -24 -44 C -22 -52 -14 -52 -13 -44 L -11 -66 C -10 -75 -1 -75 0 -66 L 2 -70 C 4 -79 13 -78 13 -68 L 14 -62 C 16 -70 24 -68 23 -58 L 20 -26 C 28 -26 34 -18 30 -8 C 25 4 18 12 12 14"
              fill="none"
              stroke={INK}
              strokeWidth={3.0}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Soft palm crease */}
            <path d="M -10 -16 Q 2 -22 14 -14" fill="none" stroke={SKIN_SHADE} strokeWidth={2.2} strokeLinecap="round" opacity={0.6} />
          </g>
        )}
      </g>
    </g>
  );
};

interface PoseRig {
  leanY: number;
  headTiltAdd: number;
  eyesDownAdd: number;
  /** 0 = exact traced lap hands, 1 = articulated gesture hands */
  useArticulatedL: number;
  useArticulatedR: number;
  // Viewer's left arm (Balak's right hand — primary gesture hand!)
  lEl: [number, number];
  lWr: [number, number];
  lRot: number;
  lType: "open" | "pranam" | "pinch";
  // Viewer's right arm (Balak's left hand)
  rEl: [number, number];
  rWr: [number, number];
  rRot: number;
  rType: "open" | "pranam" | "pinch";
  holdingFlower: number;
  holdingGhoti: number;
  pourT: number;
}

function poseRigFor(pose: RefTracedPose, t: number, mouth: number): PoseRig {
  const rest: PoseRig = {
    leanY: 0,
    headTiltAdd: 0,
    eyesDownAdd: 0,
    useArticulatedL: 0,
    useArticulatedR: 0,
    lEl: [804, 822],
    lWr: [908, 885],
    lRot: 145,
    lType: "open",
    rEl: [1112, 822],
    rWr: [1016, 885],
    rRot: -145,
    rType: "open",
    holdingFlower: 0,
    holdingGhoti: 0,
    pourT: 0,
  };

  if (pose === "sitCross") return rest;

  if (pose === "bowHands") {
    return {
      ...rest,
      leanY: 16,
      headTiltAdd: 3.5,
      eyesDownAdd: 0.35,
      useArticulatedL: 1,
      useArticulatedR: 1,
      lEl: [835, 765],
      lWr: [948, 668],
      lRot: 8,
      lType: "pranam",
      rEl: [1090, 765],
      rWr: [978, 668],
      rRot: -8,
      rType: "pranam",
    };
  }

  if (pose === "bless") {
    return {
      ...rest,
      leanY: -2,
      headTiltAdd: -1.5,
      useArticulatedL: 1,
      useArticulatedR: 0,
      lEl: [800, 755],
      lWr: [832, 608 - mouth * 8],
      lRot: 4,
      lType: "open",
    };
  }

  if (pose === "palmRaise") {
    const speakLift = Math.sin(t * 0.22) * 8 * (0.3 + 0.7 * mouth);
    return {
      ...rest,
      leanY: 2,
      headTiltAdd: -1.0,
      useArticulatedL: 1,
      useArticulatedR: 0,
      lEl: [795, 768],
      lWr: [848, 695 - speakLift],
      lRot: 32,
      lType: "open",
    };
  }

  if (pose === "pickLeaf") {
    // Reach gracefully toward the flower basket beside the Tulsi Mancha (viewer's right)
    const reach = easeIO(t / 18);
    return {
      ...rest,
      leanY: 16 * reach,
      headTiltAdd: -4 * reach,
      eyesDownAdd: 0.55 * reach,
      useArticulatedL: 0,
      useArticulatedR: 1,
      rEl: [1155, 785],
      rWr: [lerp(1080, 1215, reach), lerp(855, 868, reach)],
      rRot: lerp(-120, 135, reach),
      rType: "pinch",
      holdingFlower: reach > 0.55 ? 1 : 0,
    };
  }

  if (pose === "placeFlowerOnFoot") {
    // 3-phase graceful arc from flower basket (viewer's right, beside Tulsi) -> lift -> gently place on bare right foot
    const p1 = easeIO(t / 16);
    const p2 = easeIO((t - 16) / 22);
    const p3 = easeIO((t - 38) / 22);
    const wx = t < 16 ? lerp(1090, 1210, p1) : t < 38 ? lerp(1210, 1130, p2) : lerp(1130, 1095, p3);
    const wy = t < 16 ? lerp(855, 862, p1) : t < 38 ? lerp(862, 815, p2) - Math.sin(p2 * Math.PI) * 26 : lerp(815, 922, p3);
    return {
      ...rest,
      leanY: 20 * easeIO(t / 20),
      headTiltAdd: -4.5 * easeIO(t / 20),
      eyesDownAdd: 0.65,
      useArticulatedL: 0,
      useArticulatedR: 1,
      rEl: [lerp(1148, 1135, p2), lerp(785, 815, p3)],
      rWr: [wx, wy],
      rRot: lerp(128, -145, p2),
      rType: "pinch",
      holdingFlower: t > 14 && t < 58 ? 1 : 0,
    };
  }

  // `pour`: holding warm copper ghoti gently tilted toward the Tulsi / feet (viewer's right)
  const pourT = easeIO((t - 10) / 22);
  return {
    ...rest,
    leanY: 16,
    headTiltAdd: -3.5,
    eyesDownAdd: 0.45,
    useArticulatedL: 0,
    useArticulatedR: 1,
    rEl: [1135, 770],
    rWr: [1090, 762],
    rRot: -55,
    rType: "pinch",
    holdingGhoti: 1,
    pourT,
  };
}

export const ThakurRefTraced: React.FC<ThakurRefTracedProps> = ({
  x,
  y,
  s = 1,
  flip = false,
  f = 0,
  lifeF,
  pose = "sitCross",
  prevPose,
  poseStart = 0,
  footFlowers = 0,
  mouth = 0,
  blink,
  gazeX,
  gazeY,
  headTilt = 0,
  face,
  halo = 0.55,
}) => {
  const uid = "trt" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const lf = lifeF ?? f;

  // Pose transition blending (smooth 16-frame ease-in-out)
  const poseT = Math.max(0, f - poseStart);
  const blend = prevPose && prevPose !== pose ? easeIO(poseT / 16) : 1;
  const curRig = poseRigFor(pose, poseT, mouth);
  const prevRig = prevPose && prevPose !== pose ? poseRigFor(prevPose, 40, mouth) : curRig;

  const leanY = lerp(prevRig.leanY, curRig.leanY, blend);
  const useArtL = lerp(prevRig.useArticulatedL, curRig.useArticulatedL, blend);
  const useArtR = lerp(prevRig.useArticulatedR, curRig.useArticulatedR, blend);
  const lEl: [number, number] = [lerp(prevRig.lEl[0], curRig.lEl[0], blend), lerp(prevRig.lEl[1], curRig.lEl[1], blend)];
  const lWr: [number, number] = [lerp(prevRig.lWr[0], curRig.lWr[0], blend), lerp(prevRig.lWr[1], curRig.lWr[1], blend)];
  const lRot = lerp(prevRig.lRot, curRig.lRot, blend);
  const rEl: [number, number] = [lerp(prevRig.rEl[0], curRig.rEl[0], blend), lerp(prevRig.rEl[1], curRig.rEl[1], blend)];
  const rWr: [number, number] = [lerp(prevRig.rWr[0], curRig.rWr[0], blend), lerp(prevRig.rWr[1], curRig.rWr[1], blend)];
  const rRot = lerp(prevRig.rRot, curRig.rRot, blend);

  // Gentle organic life (24 fps)
  const breath = Math.sin(lf * 0.085) * 2.2 + noise1(lf * 0.04, 11) * 0.7;
  const headBreathY = Math.sin((lf - 4) * 0.085) * 1.4;
  const tilt = headTilt + lerp(prevRig.headTiltAdd, curRig.headTiltAdd, blend) + Math.sin(lf * 0.032) * 0.75 + noise1(lf * 0.025, 29) * 0.5;
  const kBlink = clamp(blink ?? naturalBlink(lf), 0, 1);
  const eyesDown = clamp((face?.eyesDown ?? 0) + lerp(prevRig.eyesDownAdd, curRig.eyesDownAdd, blend), 0, 1);
  const rawGazeX = gazeX ?? (face?.lookX !== undefined ? face.lookX * 0.75 : noise1(lf * 0.04, 53) * 0.35);
  const rawGazeY = gazeY ?? ((face?.lookY ?? 0) * 0.6 + eyesDown * 0.85);
  const gx = clamp(rawGazeX, -1, 1) * 3.2;
  const gy = clamp(rawGazeY, -1, 1) * 2.4;
  const mOpen = clamp(mouth, 0, 1);
  const fl = flip ? -1 : 1;

  // Eye renderer (exact traced soulful open child lids + blink clip + warm iris & dual catchlights)
  const renderEye = (side: "L" | "R") => {
    const isL = side === "L";
    const cx = isL ? 912 : 1015;
    const cy = 278;
    const ox = isL ? 885 : 1042;
    const ix = isL ? 936 : 990;
    const lidRest = eyesDown * 5.5;
    const lidTopY = 249 + lidRest + kBlink * (29 - lidRest);
    const lidBotY = 303 - kBlink * 24;
    const upperD = `M ${ox} 279 Q ${cx} ${lidTopY.toFixed(1)} ${ix} 279`;
    const lowerD = `Q ${cx} ${lidBotY.toFixed(1)} ${ox} 279 Z`;
    const clipId = `${uid}-eye-${side}`;
    const creaseY = 244 + lidRest * 0.6 + kBlink * 18;

    return (
      <g key={side}>
        <defs>
          <clipPath id={clipId}>
            <path d={`${upperD} ${lowerD}`} />
          </clipPath>
        </defs>

        {kBlink < 0.94 && <path d={`${upperD} ${lowerD}`} fill="#fdf8ef" />}

        {kBlink < 0.94 && (
          <g clipPath={`url(#${clipId})`}>
            <path d={`M ${ox} 279 Q ${cx} ${(lidTopY + 7).toFixed(1)} ${ix} 279 L ${ix} 252 L ${ox} 252 Z`} fill="#cfc1ae" opacity={0.42} />
            <circle cx={(cx + gx).toFixed(1)} cy={(cy + gy).toFixed(1)} r={14.0} fill="#261911" />
            <circle cx={(cx + gx).toFixed(1)} cy={(cy + gy).toFixed(1)} r={12.0} fill="#362317" />
            <ellipse cx={(cx + gx).toFixed(1)} cy={(cy + gy + 5.8).toFixed(1)} rx={7.4} ry={3.4} fill="#6b472b" opacity={0.55} />
            <circle cx={(cx + gx).toFixed(1)} cy={(cy + gy).toFixed(1)} r={6.2} fill="#140c08" />
            <circle cx={(cx - 6.0 + gx).toFixed(1)} cy={(cy - 4.8 + gy).toFixed(1)} r={3.5} fill="#fffdf7" />
            <circle cx={(cx + 5.8 + gx).toFixed(1)} cy={(cy + 5.2 + gy).toFixed(1)} r={1.4} fill="#fff4df" opacity={0.72} />
          </g>
        )}

        <path d={upperD} fill="none" stroke={INK} strokeWidth={kBlink > 0.85 ? 3.2 : 4.4} strokeLinecap="round" />
        {kBlink < 0.88 && (
          <path
            d={`M ${ox + (isL ? 3 : -3)} 281 Q ${cx} ${(lidBotY + 1).toFixed(1)} ${ix + (isL ? -3 : 3)} 281`}
            fill="none"
            stroke={INK}
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.78}
          />
        )}
        <path
          d={`M ${ox + (isL ? 1 : -1)} 270 Q ${cx} ${creaseY.toFixed(1)} ${ix + (isL ? -1 : 1)} 270`}
          fill="none"
          stroke={INK}
          strokeWidth={1.9}
          strokeLinecap="round"
          opacity={0.75}
        />
      </g>
    );
  };

  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(s * fl).toFixed(4)} ${s.toFixed(4)}) translate(-963 -1000)`}>
      <defs>
        <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8e0" stopOpacity={0.62 * halo} />
          <stop offset="48%" stopColor="#fce4a8" stopOpacity={0.26 * halo} />
          <stop offset="100%" stopColor="#fce4a8" stopOpacity={0} />
        </radialGradient>

        <linearGradient id={`${uid}-skin`} x1="0" y1="0.1" x2="1" y2="0.85">
          <stop offset="0%" stopColor="#e2aa74" />
          <stop offset="38%" stopColor={SKIN} />
          <stop offset="82%" stopColor="#bf8352" />
          <stop offset="100%" stopColor={SKIN_SHADE} />
        </linearGradient>

        <linearGradient id={`${uid}-cloth`} x1="0.1" y1="0" x2="0.95" y2="1">
          <stop offset="0%" stopColor={CLOTH_LIT} />
          <stop offset="55%" stopColor={CLOTH} />
          <stop offset="100%" stopColor="#e6d9c4" />
        </linearGradient>

        {/* Soft feathered sunlight rim reflection on dark hair (upper-left sun) */}
        <radialGradient id={`${uid}-hair-sun`} cx="16%" cy="22%" r="68%">
          <stop offset="0%" stopColor="#d8a872" stopOpacity={0.78} />
          <stop offset="32%" stopColor="#8c623d" stopOpacity={0.42} />
          <stop offset="62%" stopColor="#4a3324" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#2a1e17" stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}-hair-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>

        <clipPath id={`${uid}-face-clip`}>
          <path d="M 864 240 C 862 288 869 332 885 362 C 905 397 936 417 963 417 C 990 417 1021 397 1041 362 C 1057 332 1064 288 1062 240 C 1060 185 1024 156 963 156 C 902 156 866 185 864 240 Z" />
        </clipPath>

        <clipPath id={`${uid}-hair-clip`}>
          <path d="M 865 278 C 845 245 836 205 846 164 C 862 118 914 94 966 95 C 1008 96 1036 112 1042 132 C 1072 142 1094 176 1091 218 C 1089 248 1077 268 1064 280 L 1063 242 C 1061 206 1045 186 1031 171 L 1035 154 L 1021 167 C 994 166 962 164 932 167 C 896 172 874 198 866 240 Z" />
        </clipPath>
      </defs>

      {halo > 0.01 && <circle cx={963} cy={258} r={215} fill={`url(#${uid}-halo)`} pointerEvents="none" />}

      {/* ================================================================ */}
      {/* 1. SEATED CROSSED LEGS, DHOTI & CONNECTED BARE RIGHT FOOT        */}
      {/* ================================================================ */}
      <g>
        <path
          d="M 650 886 C 618 912 572 938 524 950 C 516 954 522 962 544 964 C 586 968 632 962 666 950 Z"
          fill={CLOTH}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 636 912 C 602 930 572 946 544 956" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.7} />

        <path
          d="M 1278 886 C 1312 912 1368 938 1426 952 C 1435 955 1428 963 1404 965 C 1360 968 1312 962 1268 948 Z"
          fill={CLOTH_SHADE}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 1296 912 C 1330 932 1366 946 1398 955" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.7} />

        {/* Right crossed knee/thigh */}
        <path
          d="M 962 840 C 1040 818 1175 814 1252 848 C 1296 868 1306 916 1280 952 C 1254 988 1192 998 1120 996 L 950 980 Z"
          fill={`url(#${uid}-cloth)`}
          stroke={INK}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path
          d="M 1245 848 C 1290 868 1300 916 1274 950 C 1250 982 1196 994 1140 993 C 1205 974 1248 942 1252 895 Z"
          fill={CLOTH_SHADE}
          opacity={0.72}
        />
        <path d="M 1110 865 C 1168 852 1222 854 1265 876" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
        <path d="M 1116 912 C 1172 916 1226 908 1266 892" fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" opacity={0.8} />

        {/* Bare right foot emerging seamlessly from underneath the crossed left dhoti leg */}
        <path
          d="M 884 1002 C 918 972 958 952 996 949 C 1020 944 1042 949 1068 951 C 1100 950 1126 942 1146 944 C 1160 946 1176 952 1185 959 C 1190 964 1190 976 1183 982 C 1190 986 1190 994 1185 998 C 1188 1003 1186 1009 1180 1011 C 1181 1016 1177 1020 1171 1020 C 1170 1025 1161 1028 1148 1026 C 1118 1022 1068 1017 1012 1008 C 966 1003 920 1002 884 1002 Z"
          fill={SKIN}
          stroke={INK}
          strokeWidth={3.1}
          strokeLinejoin="round"
        />
        <path
          d="M 896 1001 C 930 974 966 955 996 950 C 1016 946 1040 949 1058 952 C 1044 962 1024 968 1002 968 C 990 968 982 978 982 985 C 1030 994 1094 1002 1152 1006 C 1166 1007 1174 1014 1170 1022 C 1162 1027 1146 1026 1122 1022 C 1068 1016 986 1004 896 1001 Z"
          fill={SKIN_SHADE}
          opacity={0.72}
        />
        <path d="M 1038 960 C 1084 952 1130 949 1158 956 C 1140 962 1098 966 1048 968 Z" fill={SKIN_LIT} opacity={0.34} />
        <path
          d="M 1168 962 C 1174 961 1179 965 1179 972 C 1179 978 1174 981 1168 979 C 1165 975 1165 966 1168 962 Z"
          fill={SKIN_LIT}
          stroke={INK}
          strokeWidth={1.8}
          opacity={0.85}
        />
        <path d="M 1151 974 Q 1168 982 1183 982" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M 1155 991 Q 1171 997 1185 997" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M 1157 1004 Q 1171 1009 1181 1009" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        <path d="M 1154 1014 Q 1165 1019 1173 1018" fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" />

        {/* Offered shiuli flowers & tulsi leaf resting on Balak's own bare right foot (Episode 3 climax!) */}
        {footFlowers >= 1 && <ShiuliFlower x={1064} y={945} scale={1.15} rot={-12} />}
        {footFlowers >= 2 && <ShiuliFlower x={1098} y={940} scale={1.10} rot={18} />}
        {footFlowers >= 3 && <ShiuliFlower x={1126} y={947} scale={1.05} rot={-6} />}

        {/* Left crossed knee/thigh (in foreground — overlaps cleanly over the right ankle) */}
        <path
          d="M 962 840 C 880 818 742 814 668 852 C 626 874 618 924 646 962 C 676 1002 746 1012 842 1010 C 886 1009 918 1006 936 994 C 958 976 978 958 994 946 L 982 882 Z"
          fill={`url(#${uid}-cloth)`}
          stroke={INK}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path
          d="M 652 958 C 682 996 748 1008 840 1005 C 882 1004 914 1000 934 990 C 952 976 968 962 982 948 C 928 968 848 986 754 986 C 702 986 668 974 652 958 Z"
          fill={CLOTH_SHADE}
          opacity={0.75}
        />
        <path d="M 796 862 C 742 852 696 858 662 878" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
        <path d="M 812 918 C 756 916 708 906 672 890" fill="none" stroke={INK} strokeWidth={2.1} strokeLinecap="round" opacity={0.8} />
      </g>

      {/* ================================================================ */}
      {/* 2. BREATHING & LEANING UPPER BODY: NECK, CHADAR, SLEEVES & HANDS */}
      {/* ================================================================ */}
      <g transform={`translate(0 ${(leanY - breath).toFixed(2)})`}>
        {/* Neck & upper chest skin */}
        <path
          d="M 914 392 L 906 462 L 892 558 L 1036 558 L 1022 462 L 1014 392 Z"
          fill={SKIN}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 913 402 C 938 424 988 424 1015 402 L 1018 434 C 986 452 940 452 910 434 Z" fill={SKIN_SHADE} opacity={0.72} />
        <path d="M 988 418 L 1016 408 L 1026 492 L 992 492 Z" fill={SKIN_SHADE} opacity={0.48} />
        <path d="M 910 468 Q 928 474 944 472" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.75} />
        <path d="M 982 472 Q 998 474 1014 467" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.75} />
        <path d="M 958 479 Q 964 484 970 479" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" opacity={0.65} />

        {/* Inner white diagonal chest wrap */}
        <path
          d="M 1030 434 C 998 486 942 536 894 562 L 894 826 L 1044 826 L 1048 456 Z"
          fill={CLOTH}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 1032 456 C 1002 518 962 586 922 660 L 922 820 L 1042 820 L 1046 476 Z" fill={CLOTH_SHADE} opacity={0.45} />
        <path d="M 1024 468 C 990 520 950 572 908 614" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.8} />
        <path d="M 1034 510 C 1000 578 964 646 926 704" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.75} />
        <path d="M 926 610 C 920 688 920 752 924 812" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.65} />

        {/* Left outer chadar drape & wide flowing sleeve */}
        <path
          d="M 918 395 C 896 404 868 424 844 446 C 796 462 764 494 748 548 C 724 624 704 696 686 756 C 676 782 686 802 714 812 C 756 824 806 832 856 842 L 896 814 C 912 756 916 682 908 606 C 902 536 902 466 918 395 Z"
          fill={`url(#${uid}-cloth)`}
          stroke={INK}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path
          d="M 886 426 C 864 496 854 584 864 676 C 870 732 878 776 888 814 L 856 840 C 824 832 798 824 776 814 C 814 786 838 746 846 694 C 854 636 852 538 886 426 Z"
          fill={CLOTH_SHADE}
          opacity={0.62}
        />
        <path d="M 884 422 C 866 492 862 586 878 692" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M 792 486 C 794 568 810 656 838 744" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" opacity={0.85} />
        <path d="M 702 742 C 734 736 776 742 818 764" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />

        {/* Right outer chadar drape & wide flowing sleeve */}
        <path
          d="M 1008 395 C 1030 404 1058 424 1082 446 C 1130 462 1162 494 1178 548 C 1202 624 1222 696 1240 756 C 1250 782 1240 802 1212 812 C 1170 824 1120 832 1070 842 L 1030 814 C 1014 756 1010 682 1018 606 C 1024 536 1024 466 1008 395 Z"
          fill={`url(#${uid}-cloth)`}
          stroke={INK}
          strokeWidth={3.4}
          strokeLinejoin="round"
        />
        <path
          d="M 1082 446 C 1130 462 1162 494 1178 548 C 1202 624 1222 696 1240 756 C 1250 782 1240 802 1212 812 C 1170 824 1120 832 1070 842 L 1094 794 C 1152 768 1172 714 1162 630 C 1154 552 1122 486 1082 446 Z"
          fill={CLOTH_SHADE}
          opacity={0.72}
        />
        <path d="M 1042 422 C 1060 492 1064 586 1048 692" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M 1134 486 C 1132 568 1116 656 1088 744" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" opacity={0.85} />
        <path d="M 1224 742 C 1192 736 1150 742 1108 764" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />

        {/* Viewer's LEFT arm (Balak's right arm): exact traced lap hand OR articulated Episode 3 gesture */}
        {useArtL < 0.35 ? (
          <g>
            <path
              d="M 764 824 C 794 804 824 794 844 798 C 864 822 886 846 908 862 C 926 874 942 886 952 904 C 960 918 964 934 960 944 C 956 950 948 950 944 945 C 940 953 930 954 924 947 C 920 955 910 956 904 949 C 898 957 886 955 878 944 C 868 928 858 906 854 884 C 824 862 794 842 764 824 Z"
              fill={SKIN}
              stroke={INK}
              strokeWidth={3.1}
              strokeLinejoin="round"
            />
            <path
              d="M 766 824 C 794 805 824 796 843 799 C 822 808 806 822 800 834 C 822 850 846 866 860 882 L 854 884 C 824 862 794 842 766 824 Z"
              fill={SKIN_SHADE}
              opacity={0.62}
            />
            <path
              d="M 880 944 C 888 954 898 955 904 948 C 910 954 920 953 924 946 C 930 952 940 951 944 944 C 948 949 956 948 959 942 C 948 938 922 938 880 944 Z"
              fill={SKIN_SHADE}
              opacity={0.55}
            />
            <path d="M 932 908 C 942 922 947 934 945 944" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            <path d="M 915 922 C 922 933 926 941 925 947" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M 898 932 C 903 940 906 945 905 949" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
            <path d="M 930 880 C 942 890 952 908 956 926" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.65} />
          </g>
        ) : (
          <g>
            <ArticulatedArm
              shX={786}
              shY={780}
              elX={lEl[0]}
              elY={lEl[1]}
              wrX={lWr[0]}
              wrY={lWr[1]}
              handRot={lRot}
              handType={curRig.lType}
              side="L"
            />
            {curRig.holdingFlower > 0.5 && <ShiuliFlower x={lWr[0] + 10} y={lWr[1] - 10} scale={1.15} rot={-15} />}
            {curRig.holdingGhoti > 0.5 && <CopperGhoti x={lWr[0] - 8} y={lWr[1] - 8} pourT={curRig.pourT} />}
          </g>
        )}

        {/* Viewer's RIGHT arm (Balak's left arm): exact traced lap hand OR articulated Namaskar arm */}
        {useArtR < 0.35 ? (
          <g>
            <path
              d="M 1152 824 C 1122 804 1094 794 1074 798 C 1054 822 1034 846 1012 862 C 994 874 978 886 968 904 C 960 918 958 934 962 944 C 966 950 974 950 979 945 C 983 953 993 954 999 947 C 1003 955 1013 956 1019 949 C 1025 957 1037 955 1045 944 C 1055 928 1064 906 1068 884 C 1098 862 1126 842 1152 824 Z"
              fill={SKIN}
              stroke={INK}
              strokeWidth={3.1}
              strokeLinejoin="round"
            />
            <path
              d="M 1150 824 C 1122 805 1094 796 1076 799 C 1096 808 1110 820 1112 832 C 1090 854 1064 876 1056 894 C 1048 916 1038 936 1024 948 C 1034 954 1042 949 1046 942 C 1056 926 1064 904 1068 884 C 1098 862 1126 842 1150 824 Z"
              fill={SKIN_SHADE}
              opacity={0.65}
            />
            <path d="M 990 908 C 981 922 977 934 979 944" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
            <path d="M 1008 922 C 1001 933 997 941 998 947" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
            <path d="M 1026 932 C 1021 940 1018 945 1019 949" fill="none" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
            <path d="M 992 880 C 980 890 970 908 966 926" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.65} />
          </g>
        ) : (
          <g>
            <ArticulatedArm
              shX={1134}
              shY={780}
              elX={rEl[0]}
              elY={rEl[1]}
              wrX={rWr[0]}
              wrY={rWr[1]}
              handRot={rRot}
              handType={curRig.rType}
              side="R"
            />
            {curRig.holdingFlower > 0.5 && <ShiuliFlower x={rWr[0] - 8} y={rWr[1] - 8} scale={1.15} rot={15} />}
            {curRig.holdingGhoti > 0.5 && <CopperGhoti x={rWr[0] + 6} y={rWr[1] - 8} pourT={curRig.pourT} />}
          </g>
        )}
      </g>

      {/* ================================================================ */}
      {/* 3. PRECISION-TRACED HEAD (EARS, FACE OVAL, HAIR, EYES, SMILE)   */}
      {/* ================================================================ */}
      <g transform={`translate(963 ${(400 + leanY - headBreathY).toFixed(2)}) rotate(${tilt.toFixed(2)}) translate(-963 -400)`}>
        {/* Left Ear */}
        <path
          d="M 868 286 C 858 268 844 268 839 282 C 834 300 842 332 856 346 C 864 354 873 352 878 344 Z"
          fill={SKIN}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 862 292 C 852 282 846 288 847 304 C 848 320 856 334 866 338" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.78} />
        <path d="M 864 304 C 855 306 854 318 864 324" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.68} />

        {/* Right Ear */}
        <path
          d="M 1058 286 C 1068 268 1082 268 1087 282 C 1092 300 1084 332 1070 346 C 1062 354 1053 352 1048 344 Z"
          fill={SKIN_SHADE}
          stroke={INK}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <path d="M 1064 292 C 1074 282 1080 288 1079 304 C 1078 320 1070 334 1060 338" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={0.78} />
        <path d="M 1062 304 C 1071 306 1072 318 1062 324" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.68} />

        {/* Face Oval Base */}
        <path
          d="M 864 240 C 862 288 869 332 885 362 C 905 397 936 417 963 417 C 990 417 1021 397 1041 362 C 1057 332 1064 288 1062 240 C 1060 185 1024 156 963 156 C 902 156 866 185 864 240 Z"
          fill={`url(#${uid}-skin)`}
        />

        {/* 2-Tone Cel Shading inside Face Oval */}
        <g clipPath={`url(#${uid}-face-clip)`}>
          <path d="M 860 220 C 874 252 878 310 894 358 C 908 394 934 412 954 418 L 860 418 Z" fill={SKIN_LIT} opacity={0.52} />
          <path d="M 1026 164 C 1036 226 1042 294 1028 348 C 1014 394 978 412 940 416 L 1068 418 L 1068 164 Z" fill={SKIN_SHADE} opacity={0.58} />
          <ellipse cx={902} cy={322} rx={20} ry={11} fill="#df7b5c" opacity={0.14} />
          <ellipse cx={1024} cy={322} rx={20} ry={11} fill="#df7b5c" opacity={0.12} />
          <path d="M 964 268 C 974 282 978 308 974 326 L 964 326 Z" fill={SKIN_SHADE} opacity={0.44} />
          <ellipse cx={952} cy={314} rx={3.5} ry={7.5} fill={SKIN_LIT} opacity={0.72} />
        </g>

        <path
          d="M 864 240 C 862 288 869 332 885 362 C 905 397 936 417 963 417 C 990 417 1021 397 1041 362 C 1057 332 1064 288 1062 240"
          fill="none"
          stroke={INK}
          strokeWidth={3.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Scalp skin backing behind hair part */}
        <path d="M 1014 148 L 1046 148 L 1044 180 L 1014 180 Z" fill={SKIN} />

        {/* Hair Mass */}
        <path
          d="M 865 278 C 845 245 836 205 846 164 C 862 118 914 94 966 95 C 1008 96 1036 112 1042 132 C 1072 142 1094 176 1091 218 C 1089 248 1077 268 1064 280 L 1063 242 C 1061 206 1045 186 1031 171 L 1035 154 L 1021 167 C 994 166 962 164 932 167 C 896 172 874 198 866 240 Z"
          fill={HAIR}
          stroke={INK}
          strokeWidth={3.3}
          strokeLinejoin="round"
        />
        <g clipPath={`url(#${uid}-hair-clip)`}>
          <path
            d="M 844 246 C 838 192 862 132 924 104 C 966 88 1012 96 1036 118 C 1004 107 958 103 920 119 C 870 142 852 192 854 246 Z"
            fill={`url(#${uid}-hair-sun)`}
            filter={`url(#${uid}-hair-blur)`}
          />
          <path d="M 852 194 C 862 146 898 112 954 102" fill="none" stroke="#e4bc8a" strokeWidth={2.4} strokeLinecap="round" opacity={0.48} filter={`url(#${uid}-hair-blur)`} />
          <path d="M 870 172 Q 906 132 958 124" fill="none" stroke={HAIR_HI} strokeWidth={2.2} strokeLinecap="round" opacity={0.42} />
          <path d="M 862 204 Q 892 158 936 144" fill="none" stroke={HAIR_HI} strokeWidth={1.8} strokeLinecap="round" opacity={0.38} />
          <path d="M 946 146 Q 992 140 1026 148" fill="none" stroke={HAIR_HI} strokeWidth={1.6} strokeLinecap="round" opacity={0.28} />
          <path d="M 1054 156 Q 1076 184 1078 228" fill="none" stroke={HAIR_HI} strokeWidth={1.6} strokeLinecap="round" opacity={0.24} />
        </g>

        {/* Eyebrows */}
        <path d="M 875 258 C 892 243 920 241 941 249 C 943 252 941 256 937 256 C 918 250 894 251 875 258 Z" fill="#3f2b20" stroke={INK} strokeWidth={2.1} strokeLinejoin="round" />
        <path d="M 1052 258 C 1035 243 1007 241 986 249 C 984 252 986 256 990 256 C 1009 250 1033 251 1052 258 Z" fill="#3f2b20" stroke={INK} strokeWidth={2.1} strokeLinejoin="round" />

        {renderEye("L")}
        {renderEye("R")}

        {/* Nose */}
        <path d="M 951 271 Q 954 278 954 285" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.72} />
        <path d="M 951 329 Q 955 326 959 328" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <path d="M 968 328 Q 973 326 977 329" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />

        {/* Mouth: serene closed-lip smile with center-lip dip (or gentle lip-sync) */}
        {mOpen < 0.05 ? (
          <>
            <ellipse cx={963} cy={369.5} rx={13} ry={3.4} fill={SKIN_LIT} opacity={0.32} />
            <path d="M 931 358.5 Q 946 362.2 956 362.5 Q 963 365.4 970 362.5 Q 980 362.2 996 358.5" fill="none" stroke={INK} strokeWidth={3.0} strokeLinecap="round" />
            <ellipse cx={963} cy={378.5} rx={9.5} ry={2.0} fill={SKIN_SHADE} opacity={0.42} />
            <path d="M 953 376.5 Q 963 378.2 973 376.5" fill="none" stroke={INK} strokeWidth={2.0} strokeLinecap="round" opacity={0.76} />
          </>
        ) : (
          <>
            <path
              d={`M 934 360 Q 963 ${(357 - mOpen * 2).toFixed(1)} 992 360 Q 963 ${(364 + mOpen * 13).toFixed(1)} 934 360 Z`}
              fill="#6e3528"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            <path
              d={`M 953 ${(377 + mOpen * 4).toFixed(1)} Q 963 ${(379 + mOpen * 4).toFixed(1)} 973 ${(377 + mOpen * 4).toFixed(1)}`}
              fill="none"
              stroke={INK}
              strokeWidth={1.9}
              strokeLinecap="round"
              opacity={0.7}
            />
          </>
        )}
      </g>
    </g>
  );
};
