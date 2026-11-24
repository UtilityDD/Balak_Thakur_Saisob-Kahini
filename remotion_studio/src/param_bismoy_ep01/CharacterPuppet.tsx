import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";

export type PuppetGesture = "idle" | "pranam" | "pointing" | "arms_raised" | "disbelief" | "listening";

export interface CharacterPuppetProps {
  /** Character ID or sprite path relative to public/ e.g. "characters/jogesh/jogesh_ots.png" */
  sprite: string;
  x?: number;
  y?: number;
  scale?: number;
  flipX?: boolean;
  gesture?: PuppetGesture;
  /** Whether the character is actively speaking */
  isSpeaking?: boolean;
  /** Audio energy 0..1 for driving procedural speech mouth visemes */
  rms?: number;
  /** Transform origin for anchoring body e.g. "50% 85%" */
  transformOrigin?: string;
  style?: React.CSSProperties;
}

/**
 * Broadcast 2.5D Television Character Puppet Rig.
 *
 * Implements:
 * 1. 100% Visual Consistency using transparent master RGBA character sprites.
 * 2. Natural periodic eye blinking (3.2s cadence, 160ms eyelid curve).
 * 3. 0.25 Hz organic chest/shoulder breathing kinematics + balance sway.
 * 4. Articulated gestural dynamics (pranam, pointing, arms raised, disbelief, listening).
 * 5. Audio-driven mouth viseme activity when speaking.
 */
export const CharacterPuppet: React.FC<CharacterPuppetProps> = ({
  sprite,
  x = 0,
  y = 0,
  scale = 1.0,
  flipX = false,
  gesture = "idle",
  isSpeaking = false,
  rms = 0,
  transformOrigin = "50% 85%",
  style,
}) => {
  const f = useCurrentFrame();

  // 1. Natural periodic eye blinking: 3.2s interval (76 frames @ 24fps), 4-frame blink (160ms)
  const blinkCycle = (f + 17) % 76;
  const isBlinking = blinkCycle >= 72 && blinkCycle <= 75;
  const blinkAlpha = isBlinking ? 0.95 : 0;

  // 2. Living organic kinetics: 0.25 Hz breathing anchored at torso base
  const breathY = Math.sin((f / 24) * Math.PI * 0.5) * 3.2;
  const breathScaleY = 1 + Math.sin((f / 24) * Math.PI * 0.5) * 0.008;
  const swayX = Math.sin(f * 0.034) * 2.2;
  const headTilt = isSpeaking
    ? Math.sin(f * 0.28) * 1.4 + rms * 2.2
    : Math.sin(f * 0.04) * 0.8;

  // 3. Gesture-specific rotational dynamics
  let gestureOffsetRot = 0;
  let gestureOffsetX = 0;
  let gestureOffsetY = 0;
  if (gesture === "pranam") {
    // Reverent forward bow pulse
    gestureOffsetRot = Math.sin(f * 0.05) * 0.8;
    gestureOffsetY = 2 + Math.sin(f * 0.08) * 1.5;
  } else if (gesture === "pointing") {
    // Tense dramatic forward lean
    gestureOffsetRot = -1.2 + Math.sin(f * 0.07) * 0.6;
    gestureOffsetX = Math.sin(f * 0.05) * 1.5;
  } else if (gesture === "arms_raised") {
    // Upward ecstatic sway
    gestureOffsetRot = Math.sin(f * 0.06) * 1.5;
    gestureOffsetY = -3 + Math.sin(f * 0.09) * 2.0;
  } else if (gesture === "disbelief") {
    // Shocked recoil
    gestureOffsetRot = 1.0 + Math.sin(f * 0.08) * 1.0;
    gestureOffsetX = -2 + Math.sin(f * 0.06) * 1.2;
  }

  // 4. Procedural mouth speaking viseme (if speaking and not using video)
  const mouthOpen = isSpeaking ? (rms > 0.05 ? rms * 8 : Math.abs(Math.sin(f * 0.65)) * 6) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 1920,
        height: 1080,
        transformOrigin,
        transform: `scale(${flipX ? -scale : scale}, ${scale}) translate(${swayX + gestureOffsetX}px, ${breathY + gestureOffsetY}px) rotate(${headTilt + gestureOffsetRot}deg)`,
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* Plane 4: Master Painted Transparent RGBA Character Sprite */}
      <Img
        src={staticFile(sprite)}
        style={{
          width: 1920,
          height: 1080,
          objectFit: "cover",
          imageRendering: "auto",
        }}
      />

      {/* Procedural Natural Eyelid Blink Overlay (Soft anatomical eyelid shadow curve) */}
      {isBlinking && (
        <svg
          width={1920}
          height={1080}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: blinkAlpha,
          }}
        >
          {/* Subtle natural skin-tone soft eyelid fold that blinks down over eye coordinates */}
          <defs>
            <filter id="eyelid-soft-shadow">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </defs>
          <path
            d="M 945 318 Q 965 328 985 318 Q 965 323 945 318 Z"
            fill="#804a32"
            filter="url(#eyelid-soft-shadow)"
          />
          <path
            d="M 1005 318 Q 1025 328 1045 318 Q 1025 323 1005 318 Z"
            fill="#804a32"
            filter="url(#eyelid-soft-shadow)"
          />
        </svg>
      )}

      {/* Procedural Mouth Viseme when speaking without video */}
      {isSpeaking && mouthOpen > 1.2 && (
        <svg
          width={1920}
          height={1080}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          <ellipse
            cx={995}
            cy={395}
            rx={6.5 + mouthOpen * 0.4}
            ry={2.5 + mouthOpen * 0.8}
            fill="#521d1e"
            opacity={0.85}
          />
        </svg>
      )}
    </div>
  );
};
