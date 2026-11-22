import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SourceAttribution } from "../../../components/SourceAttribution";
import { GhibliGrade, GhibliPreload } from "../../GhibliStage";

const PRELOAD = [
  "images/ghibli_ep03/card_source_bg_sketch.png",
  "images/ghibli_ep03/watercolor_paper_grain.png",
] as const;

/**
 * Episode 3 (Ghibli Sketch Test) · Scene 00b — Source attribution card over a hand-sketched
 * Ghibli botanical desk watercolor illustration, preserving exact fade-in / fade-out overlap timing.
 */
export const GhibliScene00bSource: React.FC<{ frames: number }> = ({ frames }) => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, 24], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [frames - 24, frames], [1, 0], { extrapolateLeft: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);
  const zoom = 1 + 0.035 * Math.min(1, Math.max(0, f / Math.max(1, frames)));

  return (
    <div style={{ position: "absolute", inset: 0, background: "#1c120a", overflow: "hidden", opacity }}>
      <GhibliPreload files={PRELOAD} />
      <Img
        src={staticFile("images/ghibli_ep03/card_source_bg_sketch.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transformOrigin: "50% 50%",
          transform: `scale(${zoom.toFixed(4)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, rgba(28,16,8,0.22) 0%, rgba(18,10,6,0.52) 100%)",
          pointerEvents: "none",
        }}
      />
      <SourceAttribution variant="outro" center />
      <GhibliGrade warmth={0.18} vignette={0.38} bloomAt={[50, 35]} paperOpacity={0.2} />
    </div>
  );
};
