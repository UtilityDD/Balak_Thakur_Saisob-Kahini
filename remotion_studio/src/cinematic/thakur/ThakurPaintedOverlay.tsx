import React, { useId } from "react";
import { clamp, noise1 } from "../core/anim";
import type { ThakurLight } from "./ThakurLight";

/**
 * Hand-Painted Head, Face, Eyes, Hair & Cloth Detail Layers (05_Rework, Modules 6.1, 6.2, 6.4, 6.5).
 *
 * Anchored cleanly to `SeatedChild`'s live head & lap coordinates so every painted highlight,
 * cheek blush, eye catchlight/wet-lid reflection, hair sheen + breeze wisp, and warm/cool white-cloth
 * drapery fold moves seamlessly with Balak's breathing, lean, and gestures.
 */

export const ThakurPaintedFaceAndHair: React.FC<{
  cx: number;
  cy: number;
  s: number;
  flip?: boolean;
  f: number;
  light: ThakurLight;
  /** Smile warmth (0..1) gently lifts cheek blush. */
  smile?: number;
}> = ({ cx, cy, s, flip = false, f, light, smile = 0.5 }) => {
  const id = `tpfh-${useId().replace(/:/g, "")}`;
  const dir = flip ? -1 : 1;
  const sunSide = light.sunDir * dir; // +1 if sun is on local +x, -1 if local -x
  const wispWave = Math.sin(f * 0.14) * 3.8 * light.wind + noise1(f * 0.08, 37) * 2.2 * light.wind;
  const wispWave2 = Math.cos(f * 0.17 + 1.1) * 3.2 * light.wind;
  const blushY = 12 - smile * 1.8;

  return (
    <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${(dir * s).toFixed(3)}, ${s.toFixed(3)})`} pointerEvents="none">
      <defs>
        {/* Delicate warm watercolor cheek blush */}
        <radialGradient id={`${id}-blush`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d96a50" stopOpacity={0.26} />
          <stop offset="56%" stopColor="#e28268" stopOpacity={0.11} />
          <stop offset="100%" stopColor="#e28268" stopOpacity={0} />
        </radialGradient>
        {/* Soft forehead & nose-bridge sunlit glow */}
        <radialGradient id={`${id}-sunskin`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#fff4da" stopOpacity={0.34} />
          <stop offset="65%" stopColor={light.sunColor} stopOpacity={0.12} />
          <stop offset="100%" stopColor={light.sunColor} stopOpacity={0} />
        </radialGradient>
        {/* Soft shadow-side cheek modeling */}
        <radialGradient id={`${id}-shadeskin`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6b3e24" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#6b3e24" stopOpacity={0} />
        </radialGradient>
        {/* Soft warm hair sheen band */}
        <linearGradient id={`${id}-hairsheen`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#9e826e" stopOpacity={0} />
          <stop offset="42%" stopColor="#b5947a" stopOpacity={0.44} />
          <stop offset="72%" stopColor={light.sunColor} stopOpacity={0.32} />
          <stop offset="100%" stopColor="#9e826e" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* 6.1 Painted skin: sunlit forehead/cheek plane & opposite shadow modeling */}
      <ellipse cx={sunSide * 6} cy={-12} rx={18} ry={11} fill={`url(#${id}-sunskin)`} style={{ mixBlendMode: "screen" }} />
      <ellipse cx={-sunSide * 17} cy={6} rx={12} ry={18} fill={`url(#${id}-shadeskin)`} style={{ mixBlendMode: "multiply" }} />

      {/* Warm watercolor cheek blush washes */}
      <ellipse cx={-12} cy={blushY} rx={10.5} ry={6.8} fill={`url(#${id}-blush)`} style={{ mixBlendMode: "multiply" }} />
      <ellipse cx={16} cy={blushY - 0.5} rx={9.8} ry={6.2} fill={`url(#${id}-blush)`} style={{ mixBlendMode: "multiply" }} />

      {/* 6.4 Hair sheen band & layered painted hair clump strokes tucked cleanly inside the crown */}
      <path
        d="M -22 -30 Q -2 -45 20 -31 Q 4 -37 -22 -30 Z"
        fill={`url(#${id}-hairsheen)`}
        style={{ mixBlendMode: "screen" }}
      />
      <path d="M -20 -32 Q -4 -46 15 -36" fill="none" stroke="#5e402c" strokeWidth={1.3} strokeLinecap="round" opacity={0.45} />
      <path d="M -14 -37 Q 4 -48 21 -33" fill="none" stroke="#75523b" strokeWidth={1.0} strokeLinecap="round" opacity={0.38} />

      {/* 6.4 Subtle wind-reactive hair wisps hugging the shadow-side crown silhouette */}
      <path
        d={`M -25 -23 Q ${(-30 - wispWave * 0.35).toFixed(1)} ${(-25 + wispWave * 0.18).toFixed(1)} ${(-33.5 - wispWave * 0.55).toFixed(1)} ${(-21 + wispWave * 0.32).toFixed(1)}`}
        fill="none"
        stroke="#2b1e17"
        strokeWidth={0.95}
        strokeLinecap="round"
        opacity={0.48}
      />
      <path
        d={`M -22 -32 Q ${(-27.5 - wispWave2 * 0.35).toFixed(1)} ${(-36 + wispWave2 * 0.18).toFixed(1)} ${(-31 - wispWave2 * 0.5).toFixed(1)} ${(-33 + wispWave2 * 0.25).toFixed(1)}`}
        fill="none"
        stroke="#3c2a20"
        strokeWidth={0.8}
        strokeLinecap="round"
        opacity={0.38}
      />
    </g>
  );
};

/**
 * 6.5 Painted White-Cloth Drapery Folds (warm cream-gold lit ridges + cool blue-slate shadow washes
 * + grey-blue varied cloth ink per Module 6.7).
 */
export const ThakurPaintedClothFolds: React.FC<{
  x: number;
  y: number;
  s: number;
  flip?: boolean;
  f: number;
  light: ThakurLight;
}> = ({ x, y, s, flip = false, f, light }) => {
  const id = `tpcf-${useId().replace(/:/g, "")}`;
  const dir = flip ? -1 : 1;
  const b = Math.sin(f * 0.082 + 17) * 1.1;

  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${(dir * s).toFixed(3)}, ${s.toFixed(3)})`} pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-cool`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={light.clothCoolShade} stopOpacity={0.34} />
          <stop offset="65%" stopColor={light.clothCoolShade} stopOpacity={0.14} />
          <stop offset="100%" stopColor={light.clothCoolShade} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-warm`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={light.clothWarmLit} stopOpacity={0.46} />
          <stop offset="100%" stopColor={light.clothWarmLit} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Cool blue-slate shadow wash in lower seated dhoti lap folds */}
      <ellipse cx={-2} cy={-11 + b * 0.2} rx={48} ry={10} fill={`url(#${id}-cool)`} style={{ mixBlendMode: "multiply" }} />
      {/* Warm sunlit highlight catch across upper knee cotton */}
      <ellipse cx={6} cy={-27 + b * 0.3} rx={36} ry={7.5} fill={`url(#${id}-warm)`} style={{ mixBlendMode: "screen" }} />

      {/* Tapered grey-blue & warm-sepia hand-drawn cotton fold lines (Module 6.7) */}
      <path
        d={`M -38 ${(-22 + b * 0.3).toFixed(1)} Q -6 ${(-14 + b * 0.4).toFixed(1)} 32 ${(-24 + b * 0.2).toFixed(1)}`}
        fill="none"
        stroke="#78849c"
        strokeWidth={1.15}
        strokeLinecap="round"
        opacity={0.44}
      />
      <path
        d={`M -26 ${(-11 + b * 0.2).toFixed(1)} Q 5 ${(-5 + b * 0.3).toFixed(1)} 36 ${(-13 + b * 0.2).toFixed(1)}`}
        fill="none"
        stroke="#6c7890"
        strokeWidth={1.0}
        strokeLinecap="round"
        opacity={0.40}
      />
      <path
        d={`M -30 ${(-27 + b * 0.3).toFixed(1)} Q -2 ${(-32 + b * 0.35).toFixed(1)} 25 ${(-26 + b * 0.25).toFixed(1)}`}
        fill="none"
        stroke={light.clothWarmLit}
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.55}
      />
    </g>
  );
};

/**
 * 6.5 Softly draped, breeze-reactive trailing chadar hem drawn BEHIND Balak's far shoulder,
 * flowing organically downward toward his seated hip with gentle wind sway & follow-through settle.
 */
export const ThakurTrailingChadar: React.FC<{
  x: number;
  y: number;
  s: number;
  flip?: boolean;
  f: number;
  light: ThakurLight;
  /** Extra swing from torso motion velocity (follow-through settle). */
  settleVel?: number;
}> = ({ x, y, s, flip = false, f, light, settleVel = 0 }) => {
  const dir = flip ? 1 : -1;
  const w = light.wind;
  const sway1 = Math.sin(f * 0.10 + 0.4) * 5.5 * w + noise1(f * 0.055, 19) * 3 * w - settleVel * 9;
  const sway2 = Math.sin(f * 0.10 - 0.9) * 9.5 * w + noise1(f * 0.055, 29) * 4.5 * w - settleVel * 14;
  const dxMid = dir * (16 * s) + dir * sway1 * s * 0.45;
  const dxEnd = dir * (28 * s) + dir * sway2 * s * 0.65;
  const dyEnd = 74 * s;

  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`} pointerEvents="none">
      {/* Softly curving organic cotton drape flowing down off the shoulder */}
      <path
        d={`M 0 0 C ${dxMid.toFixed(1)} ${(22 * s).toFixed(1)}, ${(dxEnd * 0.85).toFixed(1)} ${(50 * s).toFixed(1)}, ${dxEnd.toFixed(1)} ${dyEnd.toFixed(1)} Q ${(dxEnd * 0.55).toFixed(1)} ${(dyEnd + 7 * s).toFixed(1)} ${(dir * 4 * s).toFixed(1)} ${(dyEnd - 4 * s).toFixed(1)} C ${(dir * 6 * s).toFixed(1)} ${(46 * s).toFixed(1)}, ${(dir * 8 * s).toFixed(1)} ${(22 * s).toFixed(1)}, ${(dir * -4 * s).toFixed(1)} ${(6 * s).toFixed(1)} Z`}
        fill="#f0e8d8"
        stroke="#848fa4"
        strokeWidth={0.9 * s}
        strokeOpacity={0.38}
        strokeLinejoin="round"
      />
      {/* Cool shadow crease tucked inside the draped fold */}
      <path
        d={`M ${(dir * 2 * s).toFixed(1)} ${(16 * s).toFixed(1)} Q ${(dxMid * 0.72).toFixed(1)} ${(42 * s).toFixed(1)} ${(dxEnd * 0.68).toFixed(1)} ${(dyEnd - 3 * s).toFixed(1)}`}
        fill="none"
        stroke={light.clothCoolShade}
        strokeWidth={2.0 * s}
        strokeLinecap="round"
        opacity={0.30}
      />
      {/* Warm sunlit rim along outer draped curve */}
      <path
        d={`M 0 ${(2 * s).toFixed(1)} C ${dxMid.toFixed(1)} ${(22 * s).toFixed(1)}, ${(dxEnd * 0.85).toFixed(1)} ${(50 * s).toFixed(1)}, ${dxEnd.toFixed(1)} ${(dyEnd - 2 * s).toFixed(1)}`}
        fill="none"
        stroke={light.clothWarmLit}
        strokeWidth={1.6 * s}
        strokeLinecap="round"
        opacity={0.62}
      />
    </g>
  );
};

/**
 * Upgrades 2 & 3 — Golden-Hour Warm-Key / Cool-Fill Lighting Split & Body Self-Shadowing:
 *  - Kisses the sunward side (+x) of Balak's torso/knees with warm afternoon apricot-gold light.
 *  - Drops the shadow side (-x) into a luminous cool sky-lavender wash.
 *  - Adds soft arm-on-chest cast shadow during Namaskar so palms & forearms sit in real 3D space.
 */
export const ThakurGoldenHourAndSelfShadow: React.FC<{
  x: number;
  y: number;
  s: number;
  light: ThakurLight;
  /** 0..1 intensity of Namaskar arm-on-chest cast shadow. */
  namaskarShadow?: number;
}> = ({ x, y, s, light, namaskarShadow = 0 }) => {
  const id = `tghs-${useId().replace(/:/g, "")}`;
  const sun = light.sunDir;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${s.toFixed(3)})`} pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-warmKey`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={light.sunColor} stopOpacity={0.34} />
          <stop offset="65%" stopColor={light.sunColor} stopOpacity={0.12} />
          <stop offset="100%" stopColor={light.sunColor} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-coolFill`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={light.clothCoolShade} stopOpacity={0.14} />
          <stop offset="68%" stopColor={light.clothCoolShade} stopOpacity={0.05} />
          <stop offset="100%" stopColor={light.clothCoolShade} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-armCast`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6c5854" stopOpacity={0.30} />
          <stop offset="60%" stopColor="#7a6864" stopOpacity={0.14} />
          <stop offset="100%" stopColor="#7a6864" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Warm golden-apricot key light kissing sunward shoulder, chest & knee */}
      <ellipse cx={sun * 26} cy={-74} rx={36} ry={58} fill={`url(#${id}-warmKey)`} style={{ mixBlendMode: "screen" }} />
      {/* Cool sky-lavender fill shadow across shadow-side shoulder, ribs & knee */}
      <ellipse cx={-sun * 30} cy={-66} rx={38} ry={62} fill={`url(#${id}-coolFill)`} style={{ mixBlendMode: "multiply" }} />

      {/* Soft self-cast shadow of Namaskar palms & forearms onto the white chest chadar */}
      {namaskarShadow > 0.02 && (
        <ellipse
          cx={-sun * 8}
          cy={-78}
          rx={24}
          ry={19}
          fill={`url(#${id}-armCast)`}
          opacity={namaskarShadow}
          style={{ mixBlendMode: "multiply" }}
        />
      )}
    </g>
  );
};
