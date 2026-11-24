import React from "react";
import { clamp, EASE, lerp, noise1 } from "../../cinematic/core/anim";

/**
 * Child Thakur (Balak) Expressive Ghibli Gesture & Detail Engine (`src/ghibli_pipeline/core/ghibliBalak.ts`).
 *
 * Designed specifically for Balak Thakur (`SeatedChild` and `StandingChild`) in Ghibli-pipeline episodes:
 *  1. `arcLerp(a, b, t, liftY)`: graceful curved parabolic hand/wrist arcs instead of stiff straight lines.
 *  2. `balakLivingBodyTransform(...)`: smooth 24 fps spine breath, subtle earnest forward lean during
 *     spoken lines (driven by WAV RMS envelope), gentle curious micro-sway during pauses, and calm sigh settle.
 *  3. `GhibliBalakClothDetails`: delicate hand-penciled cotton drape folds across Balak's lap/dhoti &
 *     chadar edge that shift organically with his breath and lean, plus soft warm cheek/ear light warmth.
 */

export interface BalakPt {
  x: number;
  y: number;
}

/**
 * Interpolates between two hand targets `a` and `b` along a natural curved arc (lifting upward by `liftY`
 * at mid-flight with gentle horizontal follow-through) instead of a straight mechanical line.
 */
export const arcLerp = (a: BalakPt, b: BalakPt, t: number, liftY = 26, curveX = 0): BalakPt => {
  const u = EASE.inOut(clamp(t, 0, 1));
  const bell = Math.sin(u * Math.PI);
  return {
    x: lerp(a.x, b.x, u) + curveX * bell,
    y: lerp(a.y, b.y, u) - liftY * bell,
  };
};

/**
 * Computes a smooth, living SVG transform string anchored at Balak's ground seat `(x, y)` that adds:
 *  - Organic slow chest-expansion breathing (`scaleY` 1.000..1.012, `scaleX` 1.000..0.996 to preserve volume)
 *  - Subtle earnest forward spine tilt during spoken phrases driven by `speechRms` (`0..1`)
 *  - Gentle curious micro-sway during quiet pauses so he never looks frozen like a statue
 */
export const balakLivingBodyTransform = (opts: {
  x: number;
  y: number;
  f: number;
  /** Direction he faces (+1 = facing right, -1 = facing left). */
  facing?: 1 | -1;
  /** Speech RMS energy (0..1) from WAV envelope for earnest upper-body phrasing. */
  speechRms?: number;
  /** Optional extra lean boost during emotional moments (e.g. cow nuzzle or tender smile). */
  tenderness?: number;
  seed?: number;
}): string => {
  const { x, y, f, facing = 1, speechRms = 0, tenderness = 0, seed = 17 } = opts;
  // Irregular calm child breath (~3.2s cycle)
  const breath = 0.5 + 0.5 * Math.sin(f * 0.082 + seed + 0.35 * Math.sin(f * 0.023 + seed));
  const scaleY = 1 + breath * 0.011 + speechRms * 0.008;
  const scaleX = 1 - breath * 0.004;

  // Gentle organic torso sway + earnest forward tilt when speaking or stroking the cow
  const swayDeg = noise1(f * 0.021, seed * 3) * 1.15 + Math.sin(f * 0.038 + seed) * 0.45;
  const speechLeanDeg = facing * (speechRms * 2.1 + tenderness * 1.6);
  const rot = swayDeg + speechLeanDeg;

  return `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rot.toFixed(3)}) scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)}) translate(${(-x).toFixed(2)}, ${(-y).toFixed(2)})`;
};

/**
 * Painted white-cloth drapery folds (Phase 1, Item 6) over Balak's seated dhoti lap:
 * replaces flat grey vector strokes with warm cream-ochre sunlit highlights on upper folds
 * and cool lavender-slate watercolor shadow washes tucked in the lower seated creases.
 */
export const GhibliBalakLapDetails: React.FC<{
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  f: number;
}> = ({ x, y, s = 1, flip = false, f }) => {
  const dir = flip ? -1 : 1;
  const b = Math.sin(f * 0.082 + 17) * 1.1;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${(dir * s).toFixed(3)}, ${s.toFixed(3)})`} pointerEvents="none">
      {/* Soft feathered cool lavender-slate watercolor shadow wash tucked along the lower seated dhoti fold */}
      <defs>
        <radialGradient id="gh-balak-lap-cool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8592ac" stopOpacity={0.26} />
          <stop offset="68%" stopColor="#8e9ab2" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#8e9ab2" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={0}
        cy={-11 + b * 0.25}
        rx={42}
        ry={8.5}
        fill="url(#gh-balak-lap-cool)"
        style={{ mixBlendMode: "multiply" }}
      />
      {/* Warm cream-gold sunlight catch across upper knee cotton drape */}
      <path
        d={`M -30 ${(-26 + b * 0.3).toFixed(1)} Q -2 ${(-31 + b * 0.35).toFixed(1)} 24 ${(-25 + b * 0.25).toFixed(1)}`}
        fill="none"
        stroke="#fff6dd"
        strokeWidth={3.2}
        strokeLinecap="round"
        opacity={0.42}
      />
      {/* Dual-tone hand-penciled cotton fold creases (warm sepia upper crease + cool slate shadow crease) */}
      <path
        d={`M -34 ${(-22 + b * 0.3).toFixed(1)} Q -6 ${(-15 + b * 0.4).toFixed(1)} 28 ${(-24 + b * 0.2).toFixed(1)}`}
        fill="none"
        stroke="#8d725b"
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.38}
      />
      <path
        d={`M -24 ${(-12 + b * 0.2).toFixed(1)} Q 4 ${(-7 + b * 0.3).toFixed(1)} 34 ${(-14 + b * 0.2).toFixed(1)}`}
        fill="none"
        stroke="#78849a"
        strokeWidth={1.0}
        strokeLinecap="round"
        opacity={0.36}
      />
    </g>
  );
};
