import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { SourceAttribution } from "../components/SourceAttribution";

/**
 * Source attribution card shown after each episode's title line.
 * Uses the same book-page design as Episode 1's reference page (SourceAttribution).
 * bn and en are kept in the props for the callers; the page text lives in SourceAttribution.
 */
export interface SourceCardProps {
  bn: string;
  en: string;
  frames: number; // total on-screen frames (the card fades out over the last 24)
}

export const SourceCard: React.FC<SourceCardProps> = ({ frames }) => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, 24], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [frames - 24, frames], [1, 0], { extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 40%, #3a2716 0%, #1c120a 70%, #0d0805 100%)",
        opacity,
      }}
    >
      <SourceAttribution variant="outro" center />
    </div>
  );
};
