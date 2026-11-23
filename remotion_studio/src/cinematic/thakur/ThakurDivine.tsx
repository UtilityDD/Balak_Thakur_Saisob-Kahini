import React, { useId } from "react";
import { noise1 } from "../core/anim";
import type { ThakurLight } from "./ThakurLight";

/**
 * Painted Divine Light for Balak (05_Rework, Module 6.10 — painted version of BirulGlow).
 *
 * Strictly obeys BAL-05..BAL-14:
 *  - Soft warm-white painted watercolor halo behind the head that fades smoothly out (NO rings or rays).
 *  - Subtle outer watercolor chiaroscuro surround (`multiply`) so the warm-white glow holds cleanly
 *    even against pale cream paper or sunlit plaster.
 *  - Key-beat curve (`keyBeatRiseHold`): rises gently ONCE and holds — NEVER pulses with breathing.
 *  - Painted warm ground glow & 5 slow rising golden dust motes.
 */

export const keyBeatRiseHold = (f: number, startF: number, riseFrames = 26, base = 0.45, peak = 0.92): number => {
  if (f <= startF) return base;
  const u = Math.min(1, (f - startF) / Math.max(1, riseFrames));
  const ease = u * u * (3 - 2 * u);
  return base + (peak - base) * ease;
};

export const ThakurDivine: React.FC<{
  cx: number;
  cy: number;
  r: number;
  /** Radiance level (0..1). Drive with `keyBeatRiseHold` — never pulse with breathing. */
  level: number;
  f: number;
  light: ThakurLight;
}> = ({ cx, cy, r, level, f, light }) => {
  const id = `td-${useId().replace(/:/g, "")}`;
  if (level <= 0.01) return null;

  return (
    <g pointerEvents="none" opacity={level}>
      <defs>
        {/* Subtle outer chiaroscuro contrast wash so warm-white halo reads clearly on pale paper */}
        <radialGradient id={`${id}-surround`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6b4b32" stopOpacity={0} />
          <stop offset="46%" stopColor="#6b4b32" stopOpacity={0.03} />
          <stop offset="72%" stopColor="#5a3b26" stopOpacity={0.14} />
          <stop offset="88%" stopColor="#5a3b26" stopOpacity={0.06} />
          <stop offset="100%" stopColor="#5a3b26" stopOpacity={0} />
        </radialGradient>

        {/* Restrained warm-ivory painted glow — zero concentric rings */}
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffef8" stopOpacity={0.76} />
          <stop offset="30%" stopColor="#fff5d9" stopOpacity={0.48} />
          <stop offset="62%" stopColor={light.sunColor} stopOpacity={0.18} />
          <stop offset="100%" stopColor={light.sunColor} stopOpacity={0} />
        </radialGradient>

        {/* Soft organic wet-edge brush filter */}
        <filter id={`${id}-brush`} x="-22%" y="-22%" width="144%" height="144%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="17" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={Math.max(7, r * 0.12)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={r * 1.48} fill={`url(#${id}-surround)`} filter={`url(#${id}-brush)`} style={{ mixBlendMode: "multiply" }} />
      <circle cx={cx} cy={cy} r={r * 1.06} fill={`url(#${id}-glow)`} filter={`url(#${id}-brush)`} style={{ mixBlendMode: "screen" }} />

      {/* A few slow, serene golden motes drifting upward */}
      <g style={{ mixBlendMode: "screen" }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const phase = ((f * 0.0065 + i * 0.21) % 1);
          const ang = -Math.PI * 0.85 + i * 0.42;
          const mx = cx + Math.cos(ang) * (r * (0.45 + 0.35 * phase)) + Math.sin(f * 0.025 + i * 2) * 8;
          const my = cy + Math.sin(ang) * (r * 0.5) - phase * r * 0.55 + noise1(f * 0.015, i * 11) * 5;
          const op = Math.sin(phase * Math.PI) * 0.62;
          return <circle key={i} cx={mx} cy={my} r={2.2 + (i % 2) * 0.9} fill="#fff7dc" opacity={op} />;
        })}
      </g>
    </g>
  );
};

export const ThakurGroundGlow: React.FC<{
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  level?: number;
}> = ({ x, y, rx = 148, ry = 26, level = 0.6 }) => {
  const id = `tgg-${useId().replace(/:/g, "")}`;
  if (level <= 0.01) return null;
  return (
    <g opacity={level} pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d8" stopOpacity={0.44} />
          <stop offset="55%" stopColor="#ffe4a8" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#ffe4a8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#${id}-g)`} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};
