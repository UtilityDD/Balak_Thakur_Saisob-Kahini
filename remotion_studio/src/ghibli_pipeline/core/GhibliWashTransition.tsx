import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, EASE } from "../../cinematic/core/anim";

/**
 * Phase 5 (Item 20): Hand-Painted Watercolor Wash / Ink-Bleed Scene Transition.
 *
 * Replaces plain digital crossfades between scenes with a slow warm cold-press cream/sepia
 * watercolor pigment wash spreading softly across the paper grain, then lifting into the next scene.
 */
export const GhibliWashTransition: React.FC<{
  /** Total duration of the wash transition in frames (e.g. 26 frames). */
  durationFrames?: number;
  /** Wash paper pigment color (default warm Arches cream "#f2e5cf"). */
  paperColor?: string;
  /** Optional sepia ink edge bleed tint (default "#7a583e"). */
  edgeColor?: string;
}> = ({ durationFrames = 26, paperColor = "#f2e5cf", edgeColor = "#7a583e" }) => {
  const f = useCurrentFrame();
  const id = `gwt-${useId().replace(/:/g, "")}`;
  const mid = durationFrames / 2;
  // Bell curve: 0 -> 1 at midpoint -> 0 at end
  const u = f <= mid ? EASE.inOut(clamp(f / mid)) : EASE.inOut(clamp((durationFrames - f) / mid));
  if (u <= 0.005) return null;

  const rx = 180 + u * 1350;
  const ry = 120 + u * 860;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <filter id={`${id}-bleed`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.016" numOctaves="3" seed="29" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="95" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <radialGradient id={`${id}-wash`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={paperColor} stopOpacity={0.98} />
            <stop offset="72%" stopColor={paperColor} stopOpacity={0.92} />
            <stop offset="88%" stopColor={edgeColor} stopOpacity={0.38} />
            <stop offset="100%" stopColor={edgeColor} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse
          cx={960}
          cy={540}
          rx={rx}
          ry={ry}
          fill={`url(#${id}-wash)`}
          filter={`url(#${id}-bleed)`}
          opacity={clamp(u * 1.15, 0, 1)}
        />
      </svg>
    </AbsoluteFill>
  );
};
