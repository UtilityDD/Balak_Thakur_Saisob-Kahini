import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraKeyframe } from "../types/studio";

interface CameraContextValue {
  camX: number;
  camY: number;
  zoom: number;
  rotateDeg: number;
  effectiveFrame: number;
}

const CameraContext = React.createContext<CameraContextValue>({
  camX: 0,
  camY: 0,
  zoom: 1,
  rotateDeg: 0,
  effectiveFrame: 0,
});

export const useCameraContext = () => React.useContext(CameraContext);

export const Camera25D: React.FC<{
  keyframes: CameraKeyframe[];
  breathingAmplitude?: number;
  freezeAtFrame?: number;
  vignetteIntensity?: number;
  flashbackAmount?: number;
  warmthOverlay?: number;
  children: React.ReactNode;
}> = ({
  keyframes,
  breathingAmplitude = 2.5,
  freezeAtFrame,
  vignetteIntensity = 0.32,
  flashbackAmount = 0,
  warmthOverlay = 0,
  children,
}) => {
  const rawFrame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Smoothly decelerate into freezeAtFrame if specified
  const frame =
    freezeAtFrame !== undefined && rawFrame > freezeAtFrame
      ? freezeAtFrame
      : rawFrame;

  const frames = keyframes.map((k) => k.frame);
  const camX =
    keyframes.length > 1
      ? interpolate(frame, frames, keyframes.map((k) => k.x), {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.sin),
        })
      : keyframes[0]?.x ?? 0;

  const camY =
    keyframes.length > 1
      ? interpolate(frame, frames, keyframes.map((k) => k.y), {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.sin),
        })
      : keyframes[0]?.y ?? 0;

  const zoom =
    keyframes.length > 1
      ? interpolate(frame, frames, keyframes.map((k) => k.zoom), {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        })
      : keyframes[0]?.zoom ?? 1;

  const rotateDeg =
    keyframes.length > 1
      ? interpolate(frame, frames, keyframes.map((k) => k.rotateDeg ?? 0), {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.sin),
        })
      : keyframes[0]?.rotateDeg ?? 0;

  // Subtle organic camera float (decays smoothly before freezeAtFrame)
  const breathDecay =
    freezeAtFrame !== undefined
      ? interpolate(rawFrame, [Math.max(0, freezeAtFrame - 16), freezeAtFrame], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const breathY = Math.sin(frame * 0.045) * breathingAmplitude * breathDecay;
  const breathX = Math.cos(frame * 0.032) * (breathingAmplitude * 0.6) * breathDecay;

  // Gentle scene fade-in / fade-out
  const fadeIn = interpolate(rawFrame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    rawFrame,
    [Math.max(0, durationInFrames - 14), durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const sceneOpacity = Math.min(fadeIn, fadeOut);

  return (
    <CameraContext.Provider
      value={{
        camX: camX + breathX,
        camY: camY + breathY,
        zoom,
        rotateDeg,
        effectiveFrame: frame,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 1920,
          height: 1080,
          overflow: "hidden",
          perspective: 1200,
          backgroundColor: "#0a0818",
          opacity: sceneOpacity,
          filter:
            flashbackAmount > 0
              ? `saturate(${1 - flashbackAmount * 0.28}) contrast(${1 + flashbackAmount * 0.06})`
              : undefined,
        }}
      >
        {children}

        {/* Warm golden-hour / diya atmospheric wash */}
        {warmthOverlay > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 18,
              background:
                "radial-gradient(circle at 50% 45%, rgba(255, 200, 110, 0.24) 0%, rgba(255, 140, 50, 0.08) 55%, rgba(20, 10, 28, 0.0) 100%)",
              opacity: warmthOverlay,
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* Dreamy flashback rim vignette */}
        {flashbackAmount > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 19,
              boxShadow: `inset 0 0 ${140 * flashbackAmount}px ${48 * flashbackAmount}px rgba(18, 28, 48, ${0.78 * flashbackAmount})`,
              background: `radial-gradient(circle at 50% 50%, transparent 56%, rgba(160, 195, 235, ${0.18 * flashbackAmount}) 100%)`,
            }}
          />
        )}

        {/* Cinematic soft vignette */}
        {vignetteIntensity > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 20,
              background: `radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 58%, rgba(8, 6, 18, ${vignetteIntensity}) 100%)`,
            }}
          />
        )}
      </div>
    </CameraContext.Provider>
  );
};

/**
 * ParallaxPlane: renders a 2.5D depth plane.
 * parallaxFactor: 0.15 (sky) -> 0.35 (far river) -> 0.65 (midground) -> 1.0 (stage) -> 1.35 (foreground VFX)
 */
export const ParallaxPlane: React.FC<{
  parallaxFactor: number;
  zIndex: number;
  overscanScale?: number;
  blurPx?: number;
  children: React.ReactNode;
}> = ({ parallaxFactor, zIndex, overscanScale = 1.14, blurPx = 0, children }) => {
  const { camX, camY, zoom, rotateDeg } = React.useContext(CameraContext);
  const tx = -camX * parallaxFactor;
  const ty = -camY * parallaxFactor;
  const zScale = 1 + (zoom - 1) * (0.35 + 0.65 * parallaxFactor);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        pointerEvents: "none",
        transformOrigin: "50% 50%",
        transform: `translate3d(${tx}px, ${ty}px, 0) scale(${overscanScale * zScale}) rotate(${rotateDeg * 0.35}deg)`,
        filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};
