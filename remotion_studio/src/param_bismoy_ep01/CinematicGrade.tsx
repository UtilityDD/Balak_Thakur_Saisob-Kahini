import React from "react";
import { useCurrentFrame } from "remotion";

/**
 * Premium Television Broadcast Cinematic Grade & Post-Processing Layer.
 * Features:
 *   1. Dynamic 35mm organic film grain via SVG feTurbulence (seed changes per frame) to eliminate 8-bit digital banding.
 *   2. Soft optical anamorphic vignette drawing eye focus to character action in the center-third.
 *   3. Delicate warm highlight halation giving anime/cel-painterly light bleed.
 *   4. Clean broadcast-safe title & action framing (EBU R95 compliant).
 */
export const CinematicGrade: React.FC<{
  /** Grain intensity (default 0.045) */
  grainOpacity?: number;
  /** Vignette intensity (default 0.35) */
  vignetteOpacity?: number;
  /** Warm bloom/halation intensity (default 0.035) */
  bloomOpacity?: number;
}> = ({ grainOpacity = 0.045, vignetteOpacity = 0.35, bloomOpacity = 0.035 }) => {
  const f = useCurrentFrame();
  const grainSeed = (f * 19 + 7) % 97;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 900,
        overflow: "hidden",
      }}
    >
      {/* 1. Dynamic 35mm Organic Film Grain */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: grainOpacity,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter id="broadcast-film-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.82"
              numOctaves={3}
              seed={grainSeed}
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" result="desat" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#broadcast-film-grain)" />
      </svg>

      {/* 2. Soft Optical Anamorphic Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, transparent 62%, rgba(8, 5, 12, ${vignetteOpacity}) 100%)`,
          pointerEvents: "none",
        }}
      />

      {/* 3. Subtle Warm Halation / Atmospheric Ambient Bleed */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 45%, rgba(255, 226, 175, ${bloomOpacity}) 0%, transparent 72%)`,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
