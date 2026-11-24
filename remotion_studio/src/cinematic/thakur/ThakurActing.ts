import { clamp, EASE, lerp, noise1 } from "../core/anim";
import type { SeatedChildProps } from "../../episode03/rig/SeatedChild";

/**
 * Shared Acting & Gesture Library for Balak (05_Rework, Modules 6.11 & 7).
 *
 * Implements:
 *  - Smooth 24 fps chest-expansion breathing + calm sigh settle (`MOT-20`)
 *  - Eye-lead anticipation: eyes move 5–6 frames BEFORE head turns (`MOT-13`)
 *  - Overlapping torso-to-head-to-cloth follow-through & settle
 *  - Curved parabolic hand arcs (`arcLerp`) instead of rigid straight-line tweens
 *  - Unified `balakGesture(...)` call for the two pilot gestures:
 *      1. `namaskar`: quiet seated breath -> eye-lead look up -> slow blink & tender smile ->
 *                     graceful curved rise into Namaskar (`bowHands`) -> calm settle.
 *      2. `offerBless`: smooth unfold -> earnest forward lean -> curved open-palm compassionate
 *                     offering (`pointIn` / blessing palm) -> gentle wrist settle -> calm rest.
 */

export interface GesturePt {
  x: number;
  y: number;
}

export const arcLerp = (a: GesturePt, b: GesturePt, t: number, liftY = 26, curveX = 0): GesturePt => {
  const u = EASE.inOut(clamp(t, 0, 1));
  const bell = Math.sin(u * Math.PI);
  return {
    x: lerp(a.x, b.x, u) + curveX * bell,
    y: lerp(a.y, b.y, u) - liftY * bell,
  };
};

/**
 * Living 24 fps body transform anchored at Balak's ground seat `(x, y)` (volume-preserving chest
 * breathing, gentle curiosity micro-sway, and earnest forward lean during expressive gestures).
 */
export const thakurLivingTransform = (opts: {
  x: number;
  y: number;
  f: number;
  facing?: 1 | -1;
  leanBoost?: number;
  seed?: number;
}): { transform: string; leanVel: number } => {
  const { x, y, f, facing = 1, leanBoost = 0, seed = 17 } = opts;
  const breath = 0.5 + 0.5 * Math.sin(f * 0.082 + seed + 0.3 * Math.sin(f * 0.025 + seed));
  const scaleY = 1 + breath * 0.012;
  const scaleX = 1 - breath * 0.004;

  const evalRot = (t: number, lb: number) =>
    noise1(t * 0.021, seed * 3) * 1.1 + Math.sin(t * 0.038 + seed) * 0.45 + facing * lb * 2.4;

  const rot = evalRot(f, leanBoost);
  const prevRot = evalRot(f - 2, leanBoost);
  const leanVel = clamp((rot - prevRot) * 0.5, -1, 1);

  return {
    transform: `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rot.toFixed(3)}) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)}) translate(${(-x).toFixed(2)}, ${(-y).toFixed(2)})`,
    leanVel,
  };
};

export interface PilotGestureBeat {
  /** Props fed directly into `SeatedChild`. */
  poseProps: Partial<SeatedChildProps>;
  /** Extra earnest forward lean (0..1) for `thakurLivingTransform`. */
  leanBoost: number;
  /** Smile warmth (0..1) for cheek blush lift. */
  smileWarmth: number;
  /** Current gesture caption label for the pilot HUD. */
  label: string;
}

const OFFER_START = { x: 68, y: -56 };
const OFFER_PEAK = { x: 136, y: -98 };
const OFFER_HOLD = { x: 130, y: -94 };
const OFFER_LAP = { x: 64, y: -44 };

/**
 * 10-second (240 frames @ 24 fps) 2-Gesture Pilot Choreography:
 *  - Frames 0..124   (Gesture 1: Eye-Lead Look Up & Serene Namaskar)
 *      0..24:   Calm seated breath looking slightly down/across (`sitCross`)
 *      24..34:  EYES LEAD FIRST (`lookX` & `eyesDown` lift 6 frames before head rises!)
 *      34..56:  Gentle head lift (`lookUp`) + tender serene eye-smile
 *      56..118: Graceful curved rise into Namaskar (`bowHands`, compassionate expression), holds calmly
 *  - Frames 124..240 (Gesture 2: Compassionate Offering / Blessing Reach & Settle)
 *      124..140: Smooth settle back through `lookUp` with eye-lead toward recipient
 *      140..208: Curved parabolic open-palm offering (`pointIn` with `arcLerp` rise + gentle settle)
 *      208..240: Graceful return to serene cross-legged rest (`sitCross`)
 */
export const pilotTwoGesturesAt = (f: number, mode: "before" | "after"): PilotGestureBeat => {
  // Gesture 1: Eye-Lead Look Up & Closed-Lip Happy Namaskar (frames 0..124)
  if (f < 34) {
    // In "after" mode, eyes lead 10 frames before the head turns up (MOT-13); "before" waits statically
    const eyeLead = mode === "after" ? EASE.inOut(clamp((f - 22) / 12)) : 0;
    return {
      poseProps: {
        pose: "sitCross",
        poseStart: 0,
        expression: "serene",
        mouth: 0,
        face: {
          lookX: lerp(0.15, 0.42, eyeLead),
          eyesDown: lerp(0.24, 0, eyeLead),
          smile: lerp(0.76, 0.88, eyeLead),
        },
      },
      leanBoost: 0,
      smileWarmth: lerp(0.76, 0.88, eyeLead),
      label: "Gesture 1 · Calm Breath & Eye-Lead Look Up",
    };
  }
  if (f < 58) {
    const u = EASE.inOut(clamp((f - 34) / 20));
    // Micro-anticipation inhale right before hands rise into Namaskar (frames 52..58)
    const antic = mode === "after" ? Math.sin(clamp((f - 52) / 6) * Math.PI) * 0.16 : 0;
    return {
      poseProps: {
        pose: "lookUp",
        prevPose: "sitCross",
        poseStart: 34,
        expression: "serene",
        mouth: 0,
        face: { lookX: 0.35, smile: lerp(0.84, 0.94, u) },
      },
      leanBoost: mode === "after" ? 0.22 * u - antic : 0,
      smileWarmth: lerp(0.84, 0.94, u),
      label: "Gesture 1 · Eye-Lead Look Up & Happy Smile",
    };
  }
  if (f < 124) {
    const u = EASE.inOut(clamp((f - 58) / 20));
    // Soft shoulder sigh-settle once palms meet at his heart (frames 78..94)
    const sighSettle = mode === "after" ? EASE.inOut(clamp((f - 78) / 16)) * 0.14 : 0;
    return {
      poseProps: {
        pose: "bowHands",
        prevPose: "lookUp",
        poseStart: 58,
        expression: "serene",
        mouth: 0,
        face: { lookX: 0.25, smile: 0.92 },
      },
      leanBoost: mode === "after" ? lerp(0.22, 0.60, u) - sighSettle : 0,
      smileWarmth: 0.92,
      label: "Gesture 1 · Happy Namaskar (Devotion, Sigh Settle & Aura Rise)",
    };
  }

  // Gesture 2: Happy Closed-Lip Open-Palm Offering / Blessing Reach & Settle (frames 124..240)
  if (f < 142) {
    const eyeLead2 = mode === "after" ? EASE.inOut(clamp((f - 130) / 10)) : 0;
    return {
      poseProps: {
        pose: "lookUp",
        prevPose: "bowHands",
        poseStart: 124,
        expression: "serene",
        mouth: 0,
        face: { lookX: lerp(0.25, 0.55, eyeLead2), smile: 0.90 },
      },
      leanBoost: mode === "after" ? lerp(0.58, 0.18, clamp((f - 124) / 16)) : 0,
      smileWarmth: 0.90,
      label: "Gesture 2 · Unfold & Eye-Lead Toward Recipient",
    };
  }
  if (f < 200) {
    const riseT = clamp((f - 142) / 26);
    const holdT = clamp((f - 168) / 20);
    const floatY = Math.sin(f * 0.11) * 1.6 * EASE.inOut(holdT);
    // Clean, relaxed forward offering reach; let SeatedChild's native sitCross transition handle the return cleanly
    const handPt =
      mode === "after"
        ? f < 168
          ? arcLerp(OFFER_START, OFFER_PEAK, riseT, 12, 4)
          : { x: lerp(OFFER_PEAK.x, OFFER_HOLD.x, EASE.inOut(holdT)), y: lerp(OFFER_PEAK.y, OFFER_HOLD.y, EASE.inOut(holdT)) + floatY }
        : { x: lerp(OFFER_START.x, OFFER_HOLD.x, riseT), y: lerp(OFFER_START.y, OFFER_HOLD.y, riseT) };
    return {
      poseProps: {
        pose: "pointIn",
        prevPose: "lookUp",
        poseStart: 142,
        pointAt: handPt,
        expression: "serene",
        mouth: 0,
        face: { lookX: 0.45, smile: 0.92 },
      },
      leanBoost: mode === "after" ? lerp(0.16, 0.48, EASE.inOut(riseT)) : 0,
      smileWarmth: 0.92,
      label: "Gesture 2 · Natural Open-Palm Offering",
    };
  }

  const backT = EASE.inOut(clamp((f - 200) / 24));
  return {
    poseProps: {
      pose: "sitCross",
      prevPose: "pointIn",
      poseStart: 200,
      pointAt: OFFER_HOLD,
      expression: "serene",
      mouth: 0,
      face: { lookX: lerp(0.45, 0.18, backT), smile: 0.88 },
    },
    leanBoost: mode === "after" ? lerp(0.48, 0, backT) : 0,
    smileWarmth: 0.88,
    label: "Gesture 2 · Calm Breath & Happy Settle",
  };
};
