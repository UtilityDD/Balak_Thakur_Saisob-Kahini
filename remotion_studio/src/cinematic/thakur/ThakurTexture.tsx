import React, { useId } from "react";
import type { ThakurLight } from "./ThakurLight";

/**
 * Lightweight, Fast-Rendering Painted Watercolor Finish & 2-Layer Ground Shadow
 * (05_Rework, Modules 6.7 & 6.9).
 *
 * Key design principles from PLAN.md:
 *  - MOT-19: NO dark outer outline tracing around bare hands! Uses pure soft wet-edge pigment
 *    pooling + scene-matched directional warm rim + cool bounce light + monochrome watercolor mottling,
 *    without a heavy outer morphology stroke that would outline fingers.
 *  - Render-time friendly on 16 GB machines (single clean filter pass, no heavy double-convolution).
 */

export const ThakurPaintedFilterDefs: React.FC<{
  filterId: string;
  light: ThakurLight;
  /** Optional frame for subtle 8 fps hand-drawn cel line boil (zero jitter on close-ups). */
  f?: number;
}> = ({ filterId, light, f = 0 }) => {
  const rimDx = light.sunDir > 0 ? -2.0 : 2.0;
  const bounceDx = light.sunDir > 0 ? 2.4 : -2.4;
  const boilSeed = 11 + (Math.floor(Math.max(0, f) / 3) % 4) * 7;
  const rGain = (1.015 * light.skinWarmth).toFixed(4);
  const gGain = (0.995 * (0.98 + 0.02 * light.skinWarmth)).toFixed(4);
  const bGain = (0.955 * (1.02 - 0.02 * light.skinWarmth)).toFixed(4);

  return (
    <defs>
      <filter id={filterId} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
        {/* 1. Scene-matched warm/cool tone harmony */}
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values={`${rGain} 0.012 0 0 0.008  0 ${gGain} 0 0 0.004  0 0 ${bGain} 0 -0.005  0 0 0 1 0`}
          result="warmed"
        />

        {/* 2. Seeded monochrome watercolor pigment mottling (zero flicker, zero RGB noise) */}
        <feTurbulence type="fractalNoise" baseFrequency="0.021 0.025" numOctaves="3" seed="23" result="wcNoise" />
        <feColorMatrix
          in="wcNoise"
          type="matrix"
          values="0.13 0 0 0 0.89  0.125 0 0 0 0.89  0.115 0 0 0 0.88  0 0 0 0 1"
          result="wcTone"
        />
        <feComposite in="wcTone" in2="SourceAlpha" operator="in" result="wcClip" />
        <feBlend in="warmed" in2="wcClip" mode="multiply" result="mottled" />

        {/* 3. Subtle watercolor wet-edge pigment pooling along inner boundary (NO outer hand outline per MOT-19!) */}
        <feMorphology in="SourceAlpha" operator="erode" radius="2.0" result="eroded" />
        <feGaussianBlur in="eroded" stdDeviation="1.5" result="erodedSoft" />
        <feComposite in="SourceAlpha" in2="erodedSoft" operator="out" result="wetBand" />
        <feFlood floodColor="#856044" floodOpacity="0.15" result="wetCol" />
        <feComposite in="wetCol" in2="wetBand" operator="in" result="wetEdge" />
        <feBlend in="mottled" in2="wetEdge" mode="multiply" result="painted" />

        {/* 4. Scene-matched directional warm sunlit rim */}
        <feOffset in="SourceAlpha" dx={rimDx} dy="1.4" result="rimShift" />
        <feComposite in="SourceAlpha" in2="rimShift" operator="out" result="rimRaw" />
        <feGaussianBlur in="rimRaw" stdDeviation="0.9" result="rimSoft" />
        <feFlood floodColor={light.sunColor} floodOpacity={light.rimStrength} result="rimFlood" />
        <feComposite in="rimFlood" in2="rimSoft" operator="in" result="rimLight" />

        {/* 5. Opposite shadow-side cool sky/foliage bounce light */}
        <feOffset in="SourceAlpha" dx={bounceDx} dy="-0.9" result="bShift" />
        <feComposite in="SourceAlpha" in2="bShift" operator="out" result="bRaw" />
        <feGaussianBlur in="bRaw" stdDeviation="1.6" result="bSoft" />
        <feFlood floodColor={light.bounceColor} floodOpacity={light.bounceStrength} result="bFlood" />
        <feComposite in="bFlood" in2="bSoft" operator="in" result="bounceLight" />

        <feMerge result="litPainted">
          <feMergeNode in="painted" />
          <feMergeNode in="bounceLight" />
          <feMergeNode in="rimLight" />
        </feMerge>

        {/* 6. Subtle 8 fps hand-drawn cel line boil (very fine 0.45px scale so close-up eyes stay crystal clear) */}
        <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" seed={boilSeed} result="boilN" />
        <feDisplacementMap in="litPainted" in2="boilN" scale="0.45" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  );
};

/**
 * 2-Layer Painted Ground Shadow (cast watercolor wash + dark contact crease under soles/knees).
 */
export const ThakurGroundShadow: React.FC<{
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  light: ThakurLight;
  opacity?: number;
}> = ({ x, y, rx = 68, ry = 14, light, opacity = 0.36 }) => {
  const id = `tgs-${useId().replace(/:/g, "")}`;
  const castDx = -light.sunDir * rx * 0.38 * light.shadowStretch;
  return (
    <g opacity={opacity} pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-cast`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={light.shadowColor} stopOpacity={0.62} />
          <stop offset="55%" stopColor={light.shadowColor} stopOpacity={0.28} />
          <stop offset="100%" stopColor={light.shadowColor} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-contact`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#221109" stopOpacity={0.94} />
          <stop offset="60%" stopColor="#321b10" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#321b10" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x + castDx} cy={y + 4} rx={rx * 1.38 * light.shadowStretch} ry={ry * 1.18} fill={`url(#${id}-cast)`} style={{ mixBlendMode: "multiply" }} />
      <ellipse cx={x - light.sunDir * rx * 0.05} cy={y + 1.5} rx={rx * 0.82} ry={Math.max(3, ry * 0.5)} fill={`url(#${id}-contact)`} style={{ mixBlendMode: "multiply" }} />
    </g>
  );
};
