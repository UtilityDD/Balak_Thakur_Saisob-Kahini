import React, { useId } from "react";
import { clamp, hash, noise1 } from "../../cinematic/core/anim";

/**
 * Phase 4 (Items 13, 18, 19, 26, 27): Living Studio Ghibli Atmosphere, Light Shafts,
 * Footstep Dust, and Village Micro-Ambience (`src/ghibli_pipeline/core/GhibliAtmosphere.tsx`).
 */

/**
 * Foreground sunlit shafts angled from the upper-right sun that fall OVER both trees and characters
 * (`screen` blend, gently drifting with canopy wind sway).
 */
export const GhibliSunShafts: React.FC<{
  f: number;
  /** Overall opacity (0..1, default 0.24 for morning, 0.32 for grove/dawn). */
  intensity?: number;
  /** Warm tint color (default "#fff0c4"; use "#ffd494" for Sharad dawn). */
  color?: string;
  /** Number of diagonal shafts (default 4). */
  count?: number;
}> = ({ f, intensity = 0.24, color = "#fff0c4", count = 4 }) => {
  const id = `gss-${useId().replace(/:/g, "")}`;
  if (intensity <= 0.01) return null;
  return (
    <g pointerEvents="none" opacity={intensity} style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${id}-beam`} x1="0.8" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <stop offset="55%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {Array.from({ length: count }, (_, i) => {
        const baseX = 320 + i * 420;
        const sway = Math.sin(f * 0.016 + i * 1.7) * 28 + noise1(f * 0.011, 20 + i * 5) * 16;
        const pulse = 0.72 + 0.28 * Math.sin(f * 0.022 + i * 2.3);
        const w = 135 + (i % 2) * 55;
        return (
          <polygon
            key={i}
            points={`${baseX + sway},-80 ${baseX + w + sway},-80 ${baseX - 360 + w + sway * 1.2},1160 ${baseX - 360 + sway * 1.2},1160`}
            fill={`url(#${id}-beam)`}
            opacity={pulse}
          />
        );
      })}
    </g>
  );
};

/**
 * Hand-painted `on-twos` ochre watercolor dust puffs rising behind running/stomping footsteps
 * on village earth (Binoy running, Haricharan stomping, Charu hurrying, cow trotting).
 */
export const GhibliFootstepDust: React.FC<{
  /** World foot contact X. */
  x: number;
  /** World foot contact Y. */
  y: number;
  /** Motion speed (0 = standing still, 1 = brisk run/stomp). */
  activity: number;
  /** Movement direction (+1 moving right -> dust trails left, -1 moving left -> dust trails right). */
  dir?: 1 | -1;
  /** Scale multiplier matching character scale. */
  s?: number;
  f: number;
  seed?: number;
}> = ({ x, y, activity, dir = 1, s = 1, f, seed = 11 }) => {
  if (activity <= 0.05) return null;
  // Quantize to 12 fps (on twos) for authentic hand-animated Ghibli dust puffs
  const cf = Math.floor(f / 2) * 2;
  const puffs = [0, 1, 2, 3];
  return (
    <g pointerEvents="none" opacity={clamp(activity, 0, 1) * 0.62}>
      {puffs.map((i) => {
        const phase = ((cf * 0.085 + i * 0.27 + seed * 0.13) % 1);
        const px = x - dir * (10 + phase * 54) * s;
        const py = y - (4 + Math.sin(phase * Math.PI) * 16 + phase * 10) * s;
        const rx = (8 + phase * 18) * s;
        const ry = (5 + phase * 10) * s;
        const op = Math.sin(phase * Math.PI) * (1 - phase * 0.45);
        return (
          <ellipse
            key={i}
            cx={px}
            cy={py}
            rx={rx}
            ry={ry}
            fill="#d9bc8c"
            stroke="#8a6a44"
            strokeWidth={0.7 * s}
            strokeOpacity={0.35 * op}
            opacity={op}
          />
        );
      })}
    </g>
  );
};

/**
 * Subtle living village micro-ambience (Item 27):
 *  - `"grove"`: 2 drifting golden-cream butterflies fluttering lazily between banana clumps (12 fps wings).
 *  - `"dawn"`: distant tiny Sharad birds gliding across the dawn horizon + faint rising tulsi incense wisps.
 */
export const GhibliVillageAmbience: React.FC<{
  mode: "grove" | "dawn";
  f: number;
  /** Optional tulsi/diya origin for rising incense wisps in `"dawn"` mode. */
  incenseAt?: { x: number; y: number };
}> = ({ mode, f, incenseAt }) => {
  const cf = Math.floor(f / 2) * 2;

  if (mode === "grove") {
    return (
      <g pointerEvents="none">
        {[0, 1].map((i) => {
          const t = cf * 0.018 + i * 3.1;
          const bx = 420 + i * 940 + Math.sin(t * 0.7) * 260 + noise1(t * 0.4, 17 + i) * 90;
          const by = 430 + i * 110 + Math.cos(t * 1.1) * 65 + Math.sin(t * 2.4) * 18;
          const flap = 0.25 + 0.75 * Math.abs(Math.sin(cf * 0.38 + i * 2.1));
          const rot = Math.cos(t * 0.7) > 0 ? 12 : -12;
          return (
            <g key={i} transform={`translate(${bx.toFixed(1)}, ${by.toFixed(1)}) rotate(${rot})`} opacity={0.76}>
              <ellipse cx={-4} cy={-2} rx={6.5 * flap} ry={4.2} fill="#fff3c2" stroke="#5a3b22" strokeWidth={0.7} />
              <ellipse cx={4} cy={-2} rx={6.5 * flap} ry={4.2} fill="#ffe699" stroke="#5a3b22" strokeWidth={0.7} />
              <line x1={0} y1={-4} x2={0} y2={4} stroke="#422918" strokeWidth={1.1} strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <g pointerEvents="none">
      {/* Distant Sharad dawn birds gliding across the high sky */}
      {[0, 1, 2].map((i) => {
        const bx = ((160 + i * 140 + cf * (0.55 + i * 0.08)) % 2100) - 90;
        const by = 145 + i * 24 + Math.sin(cf * 0.04 + i * 1.9) * 10;
        const wing = Math.sin(cf * 0.22 + i * 1.3) * 5;
        return (
          <path
            key={i}
            d={`M ${bx - 9} ${by + wing} Q ${bx - 4} ${by - 4} ${bx} ${by} Q ${bx + 4} ${by - 4} ${bx + 9} ${by + wing}`}
            fill="none"
            stroke="#5a4236"
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.48}
          />
        );
      })}
      {/* Faint rising tulsi incense smoke wisp */}
      {incenseAt && (
        <g opacity={0.34}>
          {[0, 1].map((i) => {
            const sway = Math.sin(f * 0.032 + i * 2.1) * 14;
            const sway2 = Math.cos(f * 0.025 + i * 1.4) * 20;
            return (
              <path
                key={i}
                d={`M ${incenseAt.x + i * 4} ${incenseAt.y} Q ${incenseAt.x + sway} ${incenseAt.y - 46} ${incenseAt.x + sway2} ${incenseAt.y - 105}`}
                fill="none"
                stroke="#f5efe6"
                strokeWidth={2.4 - i * 0.6}
                strokeLinecap="round"
                opacity={0.55 - i * 0.15}
              />
            );
          })}
        </g>
      )}
    </g>
  );
};
