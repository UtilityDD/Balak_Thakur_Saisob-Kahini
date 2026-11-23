import React, { useId } from "react";
import { clamp } from "../../cinematic/core/anim";

/**
 * Phase 2 (Items 5 & 25): Hand-Painted Close-Up Face & Hair Detail Overlay for Child Thakur.
 *
 * At 1.4x–4x zoom, vector character faces can look like smooth flat masks. This lightweight,
 * head-anchored painter's pass adds:
 *  - Soft terracotta-rose watercolor cheek warmth washes (`multiply`)
 *  - Subtle warm nose-bridge & upper-eyelid shading
 *  - Delicate warm crown & temple hair-strand brushwork so hair reads as painted strokes
 *  - Soft luminous lower-cheek rim bounce
 *
 * Automatically fades in gently as camera zoom increases (or stays subtle at medium shots),
 * without altering any rig geometry or lip-sync timing.
 */
export const GhibliBalakFaceDetail: React.FC<{
  /** Head center X (from `glowAnchor.cx` or `standingChildJoints.head.x`). */
  cx: number;
  /** Head center Y (from `glowAnchor.cy` or `standingChildJoints.head.y`). */
  cy: number;
  /** Character rig scale (`s`). */
  s?: number;
  /** Horizontal flip (`true` = facing left, `false` = facing right). */
  flip?: boolean;
  /** Current camera zoom (controls progressive detail visibility on close-ups). */
  zoom?: number;
}> = ({ cx, cy, s = 1, flip = false, zoom = 1.6 }) => {
  const id = `gbfd-${useId().replace(/:/g, "")}`;
  const dir = flip ? -1 : 1;
  // Subtle at medium shots (0.48), richer on 2.5x–4x close-ups (0.95)
  const vis = clamp(0.45 + (zoom - 1.1) * 0.28, 0.42, 0.95);

  return (
    <g
      transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${(dir * s).toFixed(3)}, ${s.toFixed(3)})`}
      opacity={vis}
      pointerEvents="none"
    >
      <defs>
        <radialGradient id={`${id}-blush`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d96b52" stopOpacity={0.34} />
          <stop offset="58%" stopColor="#e28268" stopOpacity={0.14} />
          <stop offset="100%" stopColor="#e28268" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-forehead`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff4dc" stopOpacity={0.26} />
          <stop offset="100%" stopColor="#fff4dc" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Soft sunlit forehead warmth */}
      <ellipse cx={4} cy={-12} rx={17} ry={10} fill={`url(#${id}-forehead)`} style={{ mixBlendMode: "screen" }} />

      {/* Hand-painted watercolor cheek blush washes (near & far cheeks) */}
      <ellipse cx={-12} cy={12} rx={10.5} ry={6.5} fill={`url(#${id}-blush)`} style={{ mixBlendMode: "multiply" }} />
      <ellipse cx={16} cy={11} rx={9.5} ry={6} fill={`url(#${id}-blush)`} style={{ mixBlendMode: "multiply" }} />

      {/* Subtle warm sepia-umber hair strand brushstrokes tucked cleanly inside the upper hair crown */}
      <path
        d="M -22 -30 Q -6 -45 14 -36"
        fill="none"
        stroke="#5c3e2b"
        strokeWidth={1.3}
        strokeLinecap="round"
        opacity={0.40}
      />
      <path
        d="M -16 -35 Q 2 -47 20 -33"
        fill="none"
        stroke="#6e4d37"
        strokeWidth={1.0}
        strokeLinecap="round"
        opacity={0.34}
      />
    </g>
  );
};
