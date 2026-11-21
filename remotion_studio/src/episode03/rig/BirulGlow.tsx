import React from "react";

/**
 * Episode 3 divine halo for the Birul character. Pure inline SVG: a soft radial falloff (no rings),
 * a faint warm light on top of the head, and six slow drifting motes.
 *
 * Coordinates: (cx, cy) is the centre of the head, in the same space as the figure group this
 * component sits inside. `r` is the outer glow radius. `glow` (0 to 1) scales everything; 0 draws
 * nothing. `f` (frame) drives the motes only, so the halo itself is static apart from its strength.
 */

export interface BirulGlowProps {
  cx: number;
  cy: number;
  /** Outer glow radius in figure units. Default 150. */
  r?: number;
  /** Overall strength, 0 to 1. 0 returns null. */
  glow: number;
  /** Frame, used for the drifting motes. */
  f: number;
}

interface Mote {
  /** Starting angle in radians. */
  base: number;
  /** Angular speed in radians per frame. Slow, and different per mote so the loop never repeats. */
  speed: number;
  /** Orbit radius as a fraction of r. */
  orbit: number;
  /** Radius breathing amplitude in px. */
  breathe: number;
  breathFreq: number;
  breathPhase: number;
  /** Wobble so the path is not a perfect circle. */
  wobbleFreq: number;
  wobblePhase: number;
  /** Mote size in px, 2 to 2.5. */
  size: number;
  pulseFreq: number;
  pulsePhase: number;
}

const MOTES: readonly Mote[] = [
  { base: 0.2, speed: 0.0031, orbit: 0.62, breathe: 6, breathFreq: 0.0177, breathPhase: 0.4, wobbleFreq: 0.0121, wobblePhase: 1.3, size: 2.0, pulseFreq: 0.0213, pulsePhase: 0.0 },
  { base: 1.3, speed: 0.0043, orbit: 0.78, breathe: 6, breathFreq: 0.0139, breathPhase: 2.1, wobbleFreq: 0.0097, wobblePhase: 0.2, size: 2.5, pulseFreq: 0.0189, pulsePhase: 1.7 },
  { base: 2.4, speed: -0.0026, orbit: 0.55, breathe: 6, breathFreq: 0.0219, breathPhase: 3.6, wobbleFreq: 0.0143, wobblePhase: 2.8, size: 2.2, pulseFreq: 0.0161, pulsePhase: 3.0 },
  { base: 3.3, speed: 0.0037, orbit: 0.7, breathe: 6, breathFreq: 0.0151, breathPhase: 5.0, wobbleFreq: 0.0166, wobblePhase: 4.1, size: 2.0, pulseFreq: 0.0237, pulsePhase: 4.4 },
  { base: 4.4, speed: 0.0024, orbit: 0.84, breathe: 6, breathFreq: 0.0192, breathPhase: 0.9, wobbleFreq: 0.0108, wobblePhase: 5.5, size: 2.4, pulseFreq: 0.0148, pulsePhase: 2.5 },
  { base: 5.5, speed: -0.0039, orbit: 0.6, breathe: 6, breathFreq: 0.0163, breathPhase: 4.2, wobbleFreq: 0.0154, wobblePhase: 3.3, size: 2.25, pulseFreq: 0.0199, pulsePhase: 5.6 },
];

export function BirulGlow({ cx, cy, r = 150, glow, f }: BirulGlowProps) {
  const strength = Math.min(1, Math.max(0, glow));
  if (!(strength > 0)) return null;

  const warmR = r * 0.6;
  const topLightRx = r * 0.175; // full width about r * 0.35
  const topLightRy = r * 0.1;
  const topLightCy = cy - r * 0.42;

  return (
    <g aria-hidden="true" opacity={strength}>
      <defs>
        <radialGradient id="birul-glow-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6df" stopOpacity={0.55} />
          <stop offset="45%" stopColor="#fff6df" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#fff6df" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="birul-glow-warm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity={0.25} />
          <stop offset="70%" stopColor="#ffd98a" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#ffd98a" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Soft outer falloff and warm inner body. Both fade to zero at their rims. */}
      <circle cx={cx} cy={cy} r={r} fill="url(#birul-glow-core)" />
      <circle cx={cx} cy={cy} r={warmR} fill="url(#birul-glow-warm)" />

      {/* Faint light sitting on the top of the head. */}
      <ellipse
        cx={cx}
        cy={topLightCy}
        rx={topLightRx}
        ry={topLightRy}
        fill="url(#birul-glow-core)"
        opacity={0.4}
      />

      {/* Six slow drifting motes with a gentle opacity pulse. */}
      {MOTES.map((m, i) => {
        const angle =
          m.base + f * m.speed + 0.12 * Math.sin(f * m.wobbleFreq + m.wobblePhase);
        const dist =
          r * m.orbit + m.breathe * Math.sin(f * m.breathFreq + m.breathPhase);
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist * 0.85;
        const pulse = 0.5 + 0.5 * Math.sin(f * m.pulseFreq + m.pulsePhase);
        const opacity = 0.3 + 0.5 * pulse;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={m.size}
            fill="#fff8df"
            opacity={opacity}
          />
        );
      })}
    </g>
  );
}
