import React from "react";
import { interpolate } from "remotion";
import { CharacterId } from "../types/studio";
import { BN_FONT } from "../cinematic/fonts";

const SPEAKER_LABELS_BN: Record<CharacterId, string> = {
  narrator: "কথক",
  gopal: "গোপাল ও রমা",
  rama: "রমা",
  babukaka: "বাবুকাকা",
  charu: "চারু",
  manorama_devi: "মনোরমা দেবী",
  bhagabati_thakur: "ভগবতী ঠাকুর",
  sundar_thakur: "সুন্দর ঠাকুর",
  pagol_mystic: "পাগল",
  grumpy_relative: "আত্মীয়",
  thakurma: "ঠাকুরমা",
  baby_thakur: "বালক ঠাকুর",
  little_goat: "ছোট্ট ছাগশিশু",
};

interface SubtitleChunk {
  text: string;
  startRel: number;
  endRel: number;
  speakerLabel: string;
}

/**
 * Splits a long Bengali paragraph into natural 1-2 line chunks and distributes
 * them proportionally across the clip's frame duration.
 */
function buildSubtitleChunks(
  subtitleBn: string,
  totalFrames: number,
  speaker: CharacterId,
  clipFile: string
): SubtitleChunk[] {
  // Special handling for the 2-speaker kids clip (02b_Scene2_Kids.wav)
  if (clipFile === "02b_Scene2_Kids.wav") {
    const parts = subtitleBn.split("?").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const splitFrame = Math.round(totalFrames * 0.52);
      return [
        {
          text: `${parts[0]}?`,
          startRel: 0,
          endRel: splitFrame,
          speakerLabel: "গোপাল",
        },
        {
          text: parts.slice(1).join(" "),
          startRel: splitFrame,
          endRel: totalFrames,
          speakerLabel: "রমা",
        },
      ];
    }
  }

  // Split by sentence/clause delimiters while keeping punctuation attached
  const rawParts = subtitleBn
    .split(/(?<=[।?!—])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Merge very short adjacent fragments (< 24 chars) so subtitles don't flash too fast
  const merged: string[] = [];
  for (const part of rawParts) {
    if (merged.length > 0 && merged[merged.length - 1].length < 24 && (merged[merged.length - 1].length + part.length) < 88) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${part}`;
    } else {
      merged.push(part);
    }
  }

  const chunks = merged.length > 0 ? merged : [subtitleBn];
  const totalChars = chunks.reduce((sum, c) => sum + Math.max(1, c.length), 0);
  const label = SPEAKER_LABELS_BN[speaker] ?? "কথক";

  let cursor = 0;
  return chunks.map((text, idx) => {
    const share = Math.max(1, text.length) / totalChars;
    const dur = idx === chunks.length - 1 ? totalFrames - cursor : Math.max(24, Math.round(totalFrames * share));
    const startRel = cursor;
    const endRel = Math.min(totalFrames, cursor + dur);
    cursor = endRel;
    return { text, startRel, endRel, speakerLabel: label };
  });
}

export const CinematicSubtitles: React.FC<{
  subtitleBn: string;
  speaker: CharacterId;
  clipFile: string;
  relFrame: number;
  clipFrames: number;
}> = ({ subtitleBn, speaker, clipFile, relFrame, clipFrames }) => {
  const chunks = React.useMemo(
    () => buildSubtitleChunks(subtitleBn, clipFrames, speaker, clipFile),
    [subtitleBn, clipFrames, speaker, clipFile]
  );

  const active = chunks.find((c) => relFrame >= c.startRel && relFrame < c.endRel);
  if (!active) return null;

  const localInChunk = relFrame - active.startRel;
  const chunkLen = Math.max(1, active.endRel - active.startRel);
  const opacity = interpolate(
    localInChunk,
    [0, 6, Math.max(7, chunkLen - 6), chunkLen],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 38,
        left: 140,
        right: 140,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 50,
        opacity,
      }}
    >
      <div
        style={{
          marginBottom: 6,
          padding: "3px 16px",
          borderRadius: 999,
          backgroundColor: "rgba(255, 209, 102, 0.92)",
          color: "#1a1024",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: BN_FONT,
          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        {active.speakerLabel}
      </div>
      <div
        style={{
          maxWidth: 1320,
          backgroundColor: "rgba(10, 8, 24, 0.78)",
          border: "1px solid rgba(255, 224, 150, 0.28)",
          color: "#fff8e8",
          padding: "13px 30px",
          borderRadius: 14,
          fontSize: 30,
          lineHeight: 1.45,
          fontFamily: BN_FONT,
          textAlign: "center",
          boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
          backdropFilter: "blur(6px)",
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
