import React, { useId } from "react";
import { noise1 } from "../core/anim";
import type { ThakurLight } from "./ThakurLight";

/**
 * 05_Rework Module 6.5 — Real Draped Painted Bengali Cotton Dhoti & Chadar (`ThakurCloth.tsx`).
 *
 * Fixes the "sticky sleeve" problem completely:
 *  - The uttariya/chadar is draped organically over the far shoulder (-x), sweeping in soft
 *    S-curves diagonally across the chest to the near hip (+x), with a free trailing hem behind
 *    the shoulder.
 *  - When the near arm raises (Namaskar or Open-Palm Offering), the bare arm moves FREELY out
 *    from the cloth; the shoulder drape only shifts softly with 3-frame delayed follow-through,
 *    NEVER turning into a stiff white sleeve glued to the arm.
 *  - Painted with multi-stop warm cream-gold lit gradients & cool lavender-slate shadow troughs,
 *    plus tapered broken hand-drawn fold lines (grey-blue in shadows, warm ochre in sun).
 */

export interface ClothAnchorPts {
  /** Hip/pelvis center in figure-local units (ground y=0). */
  hip: { x: number; y: number };
  /** Neck base / collarbone center. */
  neck: { x: number; y: number };
  /** Far (left) shoulder. */
  shL: { x: number; y: number };
  /** Near (right) shoulder. */
  shR: { x: number; y: number };
  /** Chest center. */
  chest: { x: number; y: number };
  /** Near arm elevation (0 = resting on lap, 1 = raised forward/up) — drives natural cloth shift, NOT sleeve stretch. */
  armLift: number;
  /** Delayed follow-through velocity (-1..1) from torso/arm motion for cloth sway & settle. */
  followVel: number;
  /** Breath expansion (0..1). */
  breath: number;
}

/**
 * Lower cross-legged dhoti (layered watercolor cotton drapes over thighs, knees, and central pleat).
 */
export const ThakurPaintedDhoti: React.FC<{
  a: ClothAnchorPts;
  f: number;
  light: ThakurLight;
}> = ({ a, f, light }) => {
  const id = `tpd-${useId().replace(/:/g, "")}`;
  const b = a.breath * 1.1;
  const sway = a.followVel * 2.2 + Math.sin(f * 0.06) * 0.8 * light.wind;

  return (
    <g>
      <defs>
        {/* Warm sunlit upper-right cotton -> cool lavender-slate lower-left shadow */}
        <linearGradient id={`${id}-main`} x1="0.82" y1="0.08" x2="0.18" y2="0.95">
          <stop offset="0%" stopColor={light.clothWarmLit} />
          <stop offset="44%" stopColor="#f3ead9" />
          <stop offset="76%" stopColor="#dcd6cc" />
          <stop offset="100%" stopColor={light.clothCoolShade} />
        </linearGradient>
        <linearGradient id={`${id}-kneeL`} x1="0.7" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#f4ecdc" />
          <stop offset="58%" stopColor="#d9d4cb" />
          <stop offset="100%" stopColor={light.clothCoolShade} />
        </linearGradient>
        <linearGradient id={`${id}-lapShadow`} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={light.clothCoolShade} stopOpacity={0.05} />
          <stop offset="65%" stopColor={light.clothCoolShade} stopOpacity={0.34} />
          <stop offset="100%" stopColor="#6c768e" stopOpacity={0.44} />
        </linearGradient>
        <radialGradient id={`${id}-warmCatch`} cx="55%" cy="35%" r="55%">
          <stop offset="0%" stopColor={light.clothWarmLit} stopOpacity={0.75} />
          <stop offset="100%" stopColor={light.clothWarmLit} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Far knee & thigh cotton drape (left side, cooler shadow plane) */}
      <path
        d={`M ${a.hip.x - 10} ${a.hip.y - 8}
            C ${a.hip.x - 42} ${a.hip.y - 6}, ${a.hip.x - 74} ${a.hip.y + 8}, ${a.hip.x - 68} ${a.hip.y + 26}
            C ${a.hip.x - 62} ${a.hip.y + 42}, ${a.hip.x - 22} ${a.hip.y + 44}, ${a.hip.x + 8} ${a.hip.y + 36}
            Z`}
        fill={`url(#${id}-kneeL)`}
      />

      {/* Near knee & lap cotton drape (right side, catching warm afternoon sun) */}
      <path
        d={`M ${a.hip.x - 28} ${a.hip.y - 12}
            C ${a.hip.x + 6} ${a.hip.y - 16}, ${a.hip.x + 56} ${a.hip.y - 2}, ${a.hip.x + 66} ${a.hip.y + 18}
            C ${a.hip.x + 74} ${a.hip.y + 34}, ${a.hip.x + 34} ${a.hip.y + 44}, ${a.hip.x - 16} ${a.hip.y + 42}
            C ${a.hip.x - 52} ${a.hip.y + 40}, ${a.hip.x - 68} ${a.hip.y + 28}, ${a.hip.x - 62} ${a.hip.y + 12}
            Z`}
        fill={`url(#${id}-main)`}
      />

      {/* Soft painted cool shadow trough tucked along the lower lap fold */}
      <path
        d={`M ${a.hip.x - 58} ${a.hip.y + 24}
            Q ${a.hip.x - 4} ${a.hip.y + 42} ${a.hip.x + 58} ${a.hip.y + 22}
            Q ${a.hip.x + 12} ${a.hip.y + 31} ${a.hip.x - 58} ${a.hip.y + 24} Z`}
        fill={`url(#${id}-lapShadow)`}
        style={{ mixBlendMode: "multiply" }}
      />

      {/* Sunlit cream-gold highlight catch over the upper right thigh */}
      <ellipse
        cx={a.hip.x + 22}
        cy={a.hip.y + 6 - b * 0.4}
        rx={32}
        ry={11}
        fill={`url(#${id}-warmCatch)`}
        style={{ mixBlendMode: "screen" }}
      />

      {/* Soft rolled waist tuck & organic curved tension folds (tapered, broken hand-drawn lines) */}
      <path
        d={`M ${a.hip.x - 26} ${a.hip.y - 10} Q ${a.hip.x + 2} ${a.hip.y - 2} ${a.hip.x + 28} ${a.hip.y - 9}`}
        fill="none"
        stroke="#8d8376"
        strokeWidth={1.35}
        strokeLinecap="round"
        opacity={0.48}
      />
      {/* Natural diagonal dhoti lap creases that breathe & shift subtly */}
      <path
        d={`M ${a.hip.x - 44} ${a.hip.y + 12} Q ${a.hip.x - 8 + sway} ${a.hip.y + 23 + b * 0.4} ${a.hip.x + 42} ${a.hip.y + 10}`}
        fill="none"
        stroke="#768199"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.46}
      />
      <path
        d={`M ${a.hip.x - 32} ${a.hip.y + 26} Q ${a.hip.x + 6 + sway * 0.7} ${a.hip.y + 34} ${a.hip.x + 48} ${a.hip.y + 22}`}
        fill="none"
        stroke="#6c7790"
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.42}
      />
      {/* Central dhoti pleat tucked softly down the front */}
      <path
        d={`M ${a.hip.x - 4} ${a.hip.y - 6} Q ${a.hip.x + 3 + sway * 0.5} ${a.hip.y + 14} ${a.hip.x - 2} ${a.hip.y + 32}`}
        fill="none"
        stroke="#7d869c"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.38}
      />
      {/* Subtle outer contour only on the shadow side (tapered, broken — never a closed vector box) */}
      <path
        d={`M ${a.hip.x - 66} ${a.hip.y + 22} C ${a.hip.x - 58} ${a.hip.y + 38}, ${a.hip.x - 16} ${a.hip.y + 44}, ${a.hip.x + 30} ${a.hip.y + 39}`}
        fill="none"
        stroke="#6c768c"
        strokeWidth={1.35}
        strokeLinecap="round"
        opacity={0.45}
      />
    </g>
  );
};

/**
 * Free-flowing trailing chadar tail drawn BEHIND the body/far shoulder.
 * Sways gracefully with breeze & trails torso lean with real inertia.
 */
export const ThakurChadarBackTail: React.FC<{
  a: ClothAnchorPts;
  f: number;
  light: ThakurLight;
}> = ({ a, f, light }) => {
  const id = `tcbt-${useId().replace(/:/g, "")}`;
  const w = light.wind;
  const wave1 = Math.sin(f * 0.095 + 0.3) * 6.5 * w + noise1(f * 0.05, 19) * 3.5 * w - a.followVel * 11;
  const wave2 = Math.sin(f * 0.095 - 1.1) * 11.5 * w + noise1(f * 0.05, 31) * 5.5 * w - a.followVel * 18;

  const sx = a.shL.x - 2;
  const sy = a.shL.y + 2;
  const mx = sx - 16 - wave1 * 0.45;
  const my = sy + 36;
  const ex = sx - 28 - wave2 * 0.65;
  const ey = sy + 78;

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-tail`} x1="0.8" y1="0" x2="0.1" y2="1">
          <stop offset="0%" stopColor="#efe6d4" />
          <stop offset="60%" stopColor="#d8d3c9" />
          <stop offset="100%" stopColor={light.clothCoolShade} />
        </linearGradient>
      </defs>
      <path
        d={`M ${sx + 4} ${sy}
            C ${mx} ${my - 8}, ${ex + 4} ${ey - 22}, ${ex} ${ey}
            Q ${(ex + sx) * 0.52} ${ey + 6} ${sx + 8} ${ey - 8}
            C ${sx + 10} ${my + 8}, ${sx + 14} ${sy + 14}, ${sx + 4} ${sy} Z`}
        fill={`url(#${id}-tail)`}
      />
      <path
        d={`M ${sx} ${sy + 14} Q ${mx + 5} ${my + 6} ${ex + 10} ${ey - 3}`}
        fill="none"
        stroke={light.clothCoolShade}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.42}
      />
      <path
        d={`M ${sx + 2} ${sy + 2} C ${mx} ${my - 8}, ${ex + 4} ${ey - 22}, ${ex} ${ey - 2}`}
        fill="none"
        stroke={light.clothWarmLit}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.62}
      />
    </g>
  );
};

/**
 * Draped Bengali Cotton Uttariya / Chadar across the chest (Module 6.5):
 * Sweeps naturally over the far shoulder (-x), diagonally across the chest with soft organic S-folds,
 * and rests lightly at the near hip (+x). The near shoulder & arm remain COMPLETELY FREE to move!
 */
export const ThakurPaintedChadarFront: React.FC<{
  a: ClothAnchorPts;
  f: number;
  light: ThakurLight;
}> = ({ a, f, light }) => {
  const id = `tpcf-${useId().replace(/:/g, "")}`;
  const b = a.breath * 1.4;
  const flutter = Math.sin(f * 0.11 + 0.8) * 1.8 * light.wind - a.followVel * 2.8;
  // Subtle natural collarbone tension when arm lifts — zero sleeve stretching!
  const liftShift = a.armLift * 2.5;

  const shLx = a.shL.x - 6;
  const shLy = a.shL.y - 5 - b * 0.4;
  const neckX = a.neck.x + 5;
  const neckY = a.neck.y + 4 - b * 0.4;
  const hipRx = a.hip.x + 28 + flutter * 0.4;
  const hipRy = a.hip.y - 4 + liftShift * 0.3;
  const hipLx = a.hip.x - 28 + flutter * 0.6;
  const hipLy = a.hip.y - 2;

  return (
    <g>
      <defs>
        {/* Warm sunlit right chest drape -> cool shadow fold on left shoulder/waist */}
        <linearGradient id={`${id}-drape`} x1="0.88" y1="0.1" x2="0.12" y2="0.92">
          <stop offset="0%" stopColor={light.clothWarmLit} />
          <stop offset="46%" stopColor="#f4ecdc" />
          <stop offset="78%" stopColor="#ded8ce" />
          <stop offset="100%" stopColor={light.clothCoolShade} />
        </linearGradient>
        <linearGradient id={`${id}-innerShadow`} x1="0" y1="0" x2="1" y2="0.8">
          <stop offset="0%" stopColor={light.clothCoolShade} stopOpacity={0.34} />
          <stop offset="55%" stopColor={light.clothCoolShade} stopOpacity={0.12} />
          <stop offset="100%" stopColor={light.clothCoolShade} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Soft cast shadow of the chadar onto the bare right chest/collarbone */}
      <path
        d={`M ${neckX + 2} ${neckY + 2} Q ${a.chest.x + 12} ${a.chest.y + 6} ${hipRx + 3} ${hipRy + 2} L ${hipRx - 4} ${hipRy + 5} Q ${a.chest.x + 4} ${a.chest.y + 10} ${neckX - 3} ${neckY + 5} Z`}
        fill="#6e4326"
        opacity={0.22}
        style={{ mixBlendMode: "multiply" }}
      />

      {/* Main continuous diagonal cotton chadar drape (far shoulder -> chest -> near hip) */}
      <path
        d={`M ${shLx} ${shLy + 8}
            C ${shLx + 4} ${shLy - 4}, ${neckX - 10} ${neckY - 6}, ${neckX} ${neckY}
            C ${a.chest.x + 8} ${a.chest.y - 4 - liftShift * 0.4}, ${hipRx - 2} ${a.chest.y + 18}, ${hipRx} ${hipRy}
            Q ${a.hip.x + 2} ${a.hip.y + 6} ${hipLx} ${hipLy}
            C ${shLx - 6 + flutter * 0.3} ${a.chest.y + 14}, ${shLx - 4} ${shLy + 22}, ${shLx} ${shLy + 8} Z`}
        fill={`url(#${id}-drape)`}
      />

      {/* Cool watercolor shadow pool tucked under the far shoulder & chest fold */}
      <path
        d={`M ${shLx} ${shLy + 12}
            C ${shLx + 10} ${a.chest.y + 2}, ${a.hip.x - 10} ${a.hip.y - 12}, ${hipLx + 6} ${hipLy - 2}
            L ${hipLx} ${hipLy}
            C ${shLx - 5} ${a.chest.y + 12}, ${shLx - 4} ${shLy + 22}, ${shLx} ${shLy + 12} Z`}
        fill={`url(#${id}-innerShadow)`}
        style={{ mixBlendMode: "multiply" }}
      />

      {/* Diagonal living S-curve cloth folds flowing naturally from far shoulder to near hip */}
      <path
        d={`M ${shLx + 8} ${shLy + 4} C ${a.chest.x - 6} ${a.chest.y - 2 - b * 0.5}, ${a.chest.x + 8} ${a.chest.y + 14}, ${hipRx - 8} ${hipRy - 2}`}
        fill="none"
        stroke="#79849b"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.46}
      />
      <path
        d={`M ${shLx + 2} ${shLy + 16} C ${a.chest.x - 10} ${a.chest.y + 10}, ${a.chest.x} ${a.chest.y + 24}, ${a.hip.x + 8 + flutter * 0.4} ${a.hip.y - 2}`}
        fill="none"
        stroke="#6f7a92"
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.40}
      />
      {/* Warm sunlit ridge along the upper diagonal chadar edge */}
      <path
        d={`M ${neckX - 2} ${neckY + 1} C ${a.chest.x + 7} ${a.chest.y - 4}, ${hipRx - 3} ${a.chest.y + 17}, ${hipRx - 1} ${hipRy - 1}`}
        fill="none"
        stroke={light.clothWarmLit}
        strokeWidth={2.0}
        strokeLinecap="round"
        opacity={0.72}
      />
      {/* Subtle broken cool-grey edge on the shadow side of the shoulder */}
      <path
        d={`M ${shLx - 1} ${shLy + 6} C ${shLx - 5} ${a.chest.y + 2}, ${shLx - 4} ${a.chest.y + 22}, ${hipLx} ${hipLy - 2}`}
        fill="none"
        stroke="#737e96"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.44}
      />
    </g>
  );
};
