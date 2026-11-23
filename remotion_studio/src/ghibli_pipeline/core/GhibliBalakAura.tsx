import React, { useId } from "react";
import { noise1 } from "../../cinematic/core/anim";

/**
 * Phase 2 (Items 21 & 22): Painted Studio Ghibli Divine Radiance for Child Thakur (`BAL-06`).
 *
 * Replaces sterile digital radial halos with:
 *  1. Subtle outer watercolor chiaroscuro surround (`multiply` warm-umber/ochre wash) so the
 *     warm-white radiance holds clearly even against pale cream walls or bright sky — zero concentric rings.
 *  2. Soft brush-edged warm-ivory watercolor glow (`feTurbulence` + `feDisplacementMap`) that gently
 *     breathes with Balak's serene presence.
 *  3. `GhibliBalakGroundGlow`: organic brush-edged warm sunlit ground wash integrated into the earth plane.
 */
export const GhibliBalakAura: React.FC<{
  cx: number;
  cy: number;
  r: number;
  glow?: number;
  f: number;
}> = ({ cx, cy, r, glow = 0.72, f }) => {
  const id = `gba-${useId().replace(/:/g, "")}`;
  if (glow <= 0.01) return null;
  const breath = 1 + 0.045 * Math.sin(f * 0.048) + 0.02 * noise1(f * 0.02, 13);
  const rad = r * breath;

  return (
    <g pointerEvents="none" opacity={glow}>
      <defs>
        {/* Subtle outer chiaroscuro darkening wash so warm-white light holds on pale watercolor paper */}
        <radialGradient id={`${id}-surround`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6b4b32" stopOpacity={0} />
          <stop offset="48%" stopColor="#6b4b32" stopOpacity={0.04} />
          <stop offset="72%" stopColor="#5c3e28" stopOpacity={0.13} />
          <stop offset="88%" stopColor="#5c3e28" stopOpacity={0.07} />
          <stop offset="100%" stopColor="#5c3e28" stopOpacity={0} />
        </radialGradient>

        {/* Soft hand-painted warm-ivory radiance (restrained, no rings) */}
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffdf4" stopOpacity={0.68} />
          <stop offset="32%" stopColor="#fff4d6" stopOpacity={0.44} />
          <stop offset="62%" stopColor="#ffe5ad" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#ffe5ad" stopOpacity={0} />
        </radialGradient>

        {/* Organic wet-on-wet watercolor brush edge */}
        <filter id={`${id}-brush`} x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="3" seed="19" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.max(8, r * 0.14)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* Painted surrounding chiaroscuro contrast (lets white glow read on pale paper) */}
      <circle
        cx={cx}
        cy={cy}
        r={rad * 1.48}
        fill={`url(#${id}-surround)`}
        filter={`url(#${id}-brush)`}
        style={{ mixBlendMode: "multiply" }}
      />

      {/* Soft warm-white painted radiance */}
      <circle
        cx={cx}
        cy={cy}
        r={rad * 1.08}
        fill={`url(#${id}-glow)`}
        filter={`url(#${id}-brush)`}
        style={{ mixBlendMode: "screen" }}
      />
    </g>
  );
};

/**
 * Painted warm ground radiance integrated into the earth/courtyard wash under Child Thakur.
 */
export const GhibliBalakGroundGlow: React.FC<{
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  level?: number;
}> = ({ x, y, rx = 148, ry = 26, level = 0.7 }) => {
  const id = `gbgg-${useId().replace(/:/g, "")}`;
  if (level <= 0.01) return null;
  return (
    <g opacity={level} pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff5d4" stopOpacity={0.44} />
          <stop offset="52%" stopColor="#ffe3a6" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#ffe3a6" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-b`} x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.024 0.045" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        fill={`url(#${id}-g)`}
        filter={`url(#${id}-b)`}
        style={{ mixBlendMode: "screen" }}
      />
    </g>
  );
};
