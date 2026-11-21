import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
// Side-effect import: loads the bundled Baloo Da 2 face before any frame is drawn.
import { BN_FONT } from "../cinematic/fonts";

/**
 * Narration subtitles, copied from Episode 1's staged-scene style (CueSubtitles in cinematic/Scene02Demo.tsx):
 * a soft dark band along the bottom, cream text at 44 px with a soft shadow, a short slide-up,
 * and no chip for the narrator. Character lines get Episode 1's gold chip above the text.
 */
export interface SubtitleCue {
  from: number;
  to: number;
  text: string;
  speaker?: string;
}

const NARRATOR = "কথক";

export const SeriesSubtitles: React.FC<{ cues: SubtitleCue[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  const c = cues.find((q) => f >= q.from && f < q.to);
  if (!c) return null;
  const o = interpolate(f, [c.from, c.from + 5, c.to - 5, c.to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(f, [c.from, c.from + 7], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const showChip = !!c.speaker && c.speaker !== NARRATOR;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 250,
          background: "linear-gradient(to top, rgba(8,4,10,0.72) 0%, rgba(8,4,10,0.45) 45%, rgba(8,4,10,0) 100%)",
          opacity: o,
          zIndex: 49,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          bottom: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: o,
          transform: `translateY(${y}px)`,
          fontFamily: BN_FONT,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        {showChip && (
          <div
            style={{
              marginBottom: 2,
              padding: "4px 22px 0px",
              borderRadius: 999,
              background: "linear-gradient(180deg, #ffd977, #ffae3d)",
              color: "#3a1a04",
              fontSize: 26,
              lineHeight: 1.45,
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            {c.speaker}
          </div>
        )}
        <div
          style={{
            color: showChip ? "#ffffff" : "#fff6e4",
            fontSize: showChip ? 48 : 44,
            lineHeight: 1.55,
            textAlign: "center",
            fontWeight: showChip ? 600 : 500,
            letterSpacing: 0.2,
            textShadow: "0 2px 2px rgba(0,0,0,0.85), 0 0 14px rgba(0,0,0,0.6)",
            maxWidth: 1500,
            textWrap: "balance",
          }}
        >
          {c.text}
        </div>
      </div>
    </>
  );
};
