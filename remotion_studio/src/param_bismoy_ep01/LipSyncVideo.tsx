import React from "react";
import { Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { S2_EP01_AUDIO, S2_EP01_SCENES } from "./timing";

/**
 * A JoyVASA lip-sync clip, locked to its voice line, with living procedural kinematics.
 *
 * Enhancements for Broadcast TV standard:
 *   1. Organic 0.25 Hz chest/shoulder breathing anchored at the torso (50% 80%).
 *   2. Subtle natural posture sway (prevents frozen-statue look).
 *   3. Frame-accurate time-locking to normalized 48kHz WAV speech duration.
 */
export const LipSyncVideo: React.FC<{
  /** public/ path, e.g. "video/s2_ep01/p3c_charu_03c_24.mp4" */
  src: string;
  /** Voice WAV in S2_EP01_AUDIO that drives this clip. */
  voice: string;
  /** sceneId in S2_EP01_SCENES that this component is rendered in. */
  scene: string;
  style?: React.CSSProperties;
  /** Disable procedural breathing if explicitly needed */
  disableBreathing?: boolean;
}> = ({ src, voice, scene, style, disableBreathing = false }) => {
  const f = useCurrentFrame();
  const line = S2_EP01_AUDIO.find((a) => a.file === voice);
  const sc = S2_EP01_SCENES.find((s) => s.sceneId === scene);
  if (!line || !sc) {
    throw new Error(`LipSyncVideo: unknown voice "${voice}" or scene "${scene}" (check timing.ts)`);
  }
  const start = line.startFrame - sc.startFrame;

  // Living human kinetics: 0.25 Hz organic breathing + subtle weight shift
  const breathY = disableBreathing ? 0 : Math.sin((f / 24) * Math.PI * 0.5) * 2.8;
  const breathScaleY = disableBreathing ? 1 : 1 + Math.sin((f / 24) * Math.PI * 0.5) * 0.007;
  const swayX = disableBreathing ? 0 : Math.sin(f * 0.035) * 2.2;

  const video = (
    <div
      style={{
        width: 1920,
        height: 1080,
        transformOrigin: "50% 80%",
        transform: `translate(${swayX}px, ${breathY}px) scaleY(${breathScaleY})`,
      }}
    >
      <OffthreadVideo
        src={staticFile(src)}
        muted
        style={{
          width: 1920,
          height: 1080,
          objectFit: "cover",
          imageRendering: "auto",
          ...style,
        }}
      />
    </div>
  );

  if (f < start) return <Freeze frame={0}>{video}</Freeze>;
  if (f >= start + line.frames) return <Freeze frame={line.frames - 1}>{video}</Freeze>;
  return (
    <Sequence from={start} durationInFrames={line.frames} layout="none">
      {video}
    </Sequence>
  );
};
