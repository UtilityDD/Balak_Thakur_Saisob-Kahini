/**
 * Studio Ghibli Character Animation & Acting Engine (`src/ghibli_pipeline/core/ghibliActing.ts`).
 *
 * Non-destructive kinematics and animation timing helpers that upgrade smooth vector puppet rigs
 * (`Puppet`, `SeatedChild`, `StandingChild`, `GentleCow`, `Tortoise`) to authentic Studio Ghibli
 * movie animation principles:
 *
 *   1. Stepped Ghibli Cadence (`ghibliClock`):
 *      - Characters animate "on twos" (12 fps) during normal acting/walks and "on threes" (8 fps)
 *        in quiet holds, while automatically switching to "on ones" (24 fps) during rapid impacts
 *        or fast runs—eliminating the weightless 24 fps vector-tween feel while keeping camera pans
 *        at buttery 24 fps.
 *
 *   2. Anticipation, Overshoot & Settle (`ghibliEase`, `withGhibliPhysics`):
 *      - Adds real physical weight: hierarchical lag (torso -> head -> arms), velocity-driven
 *        head/shoulder follow-through, anticipation dip on rapid pose changes, and damped settle.
 *
 *   3. 4-Phase Ghibli Walk Recoil (`withGhibliWalkWeight`):
 *      - Adds the unmistakable Contact -> Down/Recoil -> Passing -> High-Point vertical hip weight
 *        and shoulder counter-sway during walks and runs, with character archetypes ("child",
 *        "mother", "elder", "stomp").
 *
 *   4. Eye-Lead & Turn-Blinks (`withGhibliEyeLead`):
 *      - Eyes look 4-5 frames ahead of head turns, with a natural blink during large head turns.
 */

import { clamp, EASE, noise1 } from "../../cinematic/core/anim";
import { BASE_POSE, type Pose } from "../../cinematic/rig/Puppet";

export type GhibliCadenceMode = "ones" | "twos" | "threes";

/**
 * Quantize an animation clock `f` to authentic Studio Ghibli drawing cadence:
 *  - `"twos"` (12 fps): standard Ghibli character acting, gestures, walks
 *  - `"threes"` (8 fps): quiet breathing holds, subtle idles
 *  - `"ones"` (24 fps): fast impacts, strikes, sudden bursts
 *
 * Optionally accepts `fastWindows` (array of `[startFrame, endFrame]` intervals) where the clock
 * automatically switches to `"ones"` for crisp high-speed action.
 */
export const ghibliClock = (
  f: number,
  mode: GhibliCadenceMode = "twos",
  fastWindows?: ReadonlyArray<readonly [number, number]>,
): number => {
  if (mode === "ones") return f;
  if (fastWindows) {
    for (let i = 0; i < fastWindows.length; i++) {
      const [a, b] = fastWindows[i];
      if (f >= a && f <= b) return f;
    }
  }
  const step = mode === "threes" ? 3 : 2;
  return Math.floor(f / step) * step;
};

/**
 * Classical Studio Ghibli ease with subtle anticipation pull-back at the start and damped overshoot
 * settle at the end (`t` in `0..1`).
 */
export const ghibliEase = (t: number, anticipation = 0.08, overshoot = 0.07): number => {
  const u = clamp(t, 0, 1);
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  // Base smooth S-curve
  const s = EASE.inOut(u);
  // Subtle pull-back in first 22%
  const ant = u < 0.25 ? -anticipation * Math.sin((u / 0.25) * Math.PI) : 0;
  // Subtle damped overshoot settle in last 35%
  const ov = u > 0.62 ? overshoot * Math.sin(((u - 0.62) / 0.38) * Math.PI) * (1 - u) * 2.2 : 0;
  return s + ant + ov;
};

export type GhibliGaitPersonality = "child" | "mother" | "adult" | "stomp";

export interface GhibliActingOptions {
  /** Character personality for walk weight, recoil, and head lag. */
  personality?: GhibliGaitPersonality;
  /** Random seed for organic breath/sway variation. */
  seed?: number;
  /** Drawing cadence ("twos" = 12 fps default, "ones" = 24 fps). */
  cadence?: GhibliCadenceMode;
  /** Frame windows `[start, end]` that automatically run on ones (24 fps) for fast beats. */
  fastWindows?: ReadonlyArray<readonly [number, number]>;
  /** Enable eye-lead (eyes anticipate headTurn by 4 frames + blink on big turns). Default true. */
  eyeLead?: boolean;
  /** Enable hierarchical secondary follow-through (head/arm lag & settle). Default true. */
  followThrough?: boolean;
  /** Ambient wind strength (0..1) gently swaying posture/lean. Default 0.35. */
  wind?: number;
  /** Optional WAV speech RMS envelope callback `(f: number) => 0..1` for syllable-accented upper-body acting. */
  speechRms?: (f: number) => number;
  /** Intensity of speech-driven head nods, brow lifts, and torso emphasis (0..1, default 0.7). */
  speechActAmp?: number;
}

const GAIT_PROFILE: Record<
  GhibliGaitPersonality,
  { recoilAmp: number; leanAmp: number; headLag: number; armLag: number; breathAmp: number }
> = {
  child: { recoilAmp: 4.8, leanAmp: 2.6, headLag: 3.0, armLag: 2.2, breathAmp: 1.0 },
  mother: { recoilAmp: 2.6, leanAmp: 1.5, headLag: 3.4, armLag: 2.6, breathAmp: 0.85 },
  adult: { recoilAmp: 3.6, leanAmp: 2.1, headLag: 3.0, armLag: 2.2, breathAmp: 0.9 },
  stomp: { recoilAmp: 6.4, leanAmp: 3.8, headLag: 2.6, armLag: 1.8, breathAmp: 1.25 },
};

/**
 * Wraps any `Puppet` acting function `(f: number) => Pose` with Studio Ghibli animation craft:
 *  - Stepped-on-twos drawing cadence (auto-switching to ones inside `fastWindows`)
 *  - Hierarchical overlapping action (head trails torso lean/turn by 3 frames; arms settle with subtle inertia)
 *  - 4-phase Contact-Recoil-Passing-HighPoint vertical hip weight on walks/runs
 *  - Eye-lead (eyes dart 4 frames ahead of headTurn + soft transition blink on large turns)
 *  - Organic breathing & gentle wind sway
 */
export const withGhibliActing = (
  base: (f: number) => Partial<Pose>,
  opts: GhibliActingOptions = {},
): ((f: number) => Pose) => {
  const {
    personality = "adult",
    seed = 7,
    cadence = "twos",
    fastWindows,
    eyeLead = true,
    followThrough = true,
    wind = 0.35,
    speechRms,
    speechActAmp = 0.7,
  } = opts;
  const prof = GAIT_PROFILE[personality];
  const evalBase = (t: number): Pose => ({ ...BASE_POSE, ...base(t) });

  return (rawF: number): Pose => {
    const f = ghibliClock(rawF, cadence, fastWindows);
    const cur = evalBase(f);
    const prev2 = evalBase(f - 2);
    const prev4 = evalBase(f - 4);
    const next4 = evalBase(f + 4);

    let bodyY = cur.bodyY;
    let lean = cur.lean;
    let headTurn = cur.headTurn;
    let headTilt = cur.headTilt;
    let headNod = cur.headNod;
    let eyeX = cur.eyeX;
    let lid = cur.lid;
    let brow = cur.brow;
    let rS = cur.rS;
    let rE = cur.rE;
    let lS = cur.lS;
    let lE = cur.lE;

    // 1. Hierarchical follow-through & subtle anticipation/overshoot settle
    if (followThrough) {
      // Head trails bodyTurn & lean by ~3 frames, then settles with tiny overshoot
      const dBodyTurn = cur.bodyTurn - prev4.bodyTurn;
      const dLean = cur.lean - prev4.lean;
      const accelLean = (cur.lean - prev2.lean) - (prev2.lean - prev4.lean);

      headTurn -= clamp(dBodyTurn * 0.22, -0.18, 0.18);
      headNod -= clamp(dLean * 0.28, -4.5, 4.5);
      headTilt += clamp(dBodyTurn * 6.0, -5.0, 5.0);

      // Subtle vertical squash/dip when torso accelerates into a bend or kneel
      const dKneel = cur.kneel - prev2.kneel;
      const dCrouch = cur.crouch - prev2.crouch;
      bodyY += clamp((Math.abs(dKneel) + Math.abs(dCrouch)) * 5.5 + Math.abs(accelLean) * 0.18, 0, 5.5);

      // Arm overlapping inertia: elbow lags shoulder slightly when arms swing freely (not during locked holds)
      if (cur.hold < 0.2 && cur.join < 0.2 && cur.headHands < 0.2) {
        const dRS = cur.rS - prev2.rS;
        const dLS = cur.lS - prev2.lS;
        rE -= clamp(dRS * 0.22, -10, 10);
        lE -= clamp(dLS * 0.22, -10, 10);
        // Tiny overshoot on arm stop
        const prevDRS = prev2.rS - prev4.rS;
        const prevDLS = prev2.lS - prev4.lS;
        if (Math.abs(dRS) < Math.abs(prevDRS) * 0.5) rS += clamp(prevDRS * 0.14, -4, 4);
        if (Math.abs(dLS) < Math.abs(prevDLS) * 0.5) lS += clamp(prevDLS * 0.14, -4, 4);
      }
    }

    // 2. 4-phase Ghibli walk weight (Contact -> Recoil/Down -> Passing -> High-Point)
    const st = cur.stride;
    if (st > 0.04) {
      const ph = f * 0.3 + seed;
      // Recoil happens ~0.45 rad AFTER foot contact (asymmetric weight drop, deeper than a symmetric sine)
      const recoilWave = Math.sin(2 * ph - 0.55);
      const downDip = recoilWave > 0 ? Math.pow(recoilWave, 1.35) * prof.recoilAmp * st : recoilWave * prof.recoilAmp * 0.55 * st;
      bodyY += downDip;
      // Forward pitch increases slightly on push-off, head lags vertical bounce by ~2 frames
      lean += (0.8 + 0.5 * Math.cos(2 * ph - 0.3)) * prof.leanAmp * st;
      headNod += Math.sin(2 * (ph - 0.6)) * 1.9 * st;
    }

    // 3. Eye-lead & turn-blink (eyes anticipate headTurn 4 frames ahead)
    if (eyeLead) {
      const futureHeadDelta = (next4.headTurn + next4.bodyTurn * 0.6) - (cur.headTurn + cur.bodyTurn * 0.6);
      if (Math.abs(futureHeadDelta) > 0.05) {
        eyeX = clamp(eyeX + clamp(futureHeadDelta * 1.4, -0.55, 0.55), -1, 1);
      }
      // Natural half-blink during rapid mid-turn
      const curTurnVel = Math.abs(cur.headTurn - prev2.headTurn) + Math.abs(cur.bodyTurn - prev2.bodyTurn) * 0.7;
      if (curTurnVel > 0.22) {
        lid = Math.max(lid, clamp((curTurnVel - 0.22) * 2.4, 0, 0.72));
      }
    }

    // 4. WAV-envelope-driven upper-body speech acting (syllable nods, brow lifts, shoulder emphasis)
    if (speechRms) {
      const rmsNow = clamp(speechRms(f), 0, 1);
      const rmsPrev = clamp(speechRms(f - 2), 0, 1);
      const onset = Math.max(0, rmsNow - rmsPrev);
      if (rmsNow > 0.08) {
        const k = speechActAmp;
        // Syllable accent nod + slight forward lean on stressed words
        headNod += (rmsNow * 2.2 + onset * 4.5) * k;
        lean += rmsNow * 1.4 * k;
        // Expressive eyebrow emphasis (lifts or knits slightly with voice energy)
        brow = clamp(brow + (onset * 0.28 + rmsNow * 0.12) * k * (personality === "stomp" ? -1 : 1), -1, 1);
        // Subtle gesture emphasis on free arms
        if (cur.hold < 0.2 && cur.join < 0.2 && cur.headHands < 0.2) {
          rS += onset * 5.0 * k;
          lS += onset * 4.0 * k;
        }
      }
    }

    // 5. Subtle Ghibli wind & living breath micro-sway
    const breath = Math.sin(f * 0.052 + seed * 1.3);
    const windSway = wind * (noise1(f * 0.022, seed * 11 + 3) * 0.9 + Math.sin(f * 0.031 + seed) * 0.45);
    lean += windSway * 0.75 + breath * 0.28 * prof.breathAmp;
    headTilt += windSway * 0.85;

    return {
      ...cur,
      bodyY,
      lean,
      headTurn,
      headTilt,
      headNod,
      eyeX,
      lid,
      brow,
      rS,
      rE,
      lS,
      lE,
    };
  };
};
