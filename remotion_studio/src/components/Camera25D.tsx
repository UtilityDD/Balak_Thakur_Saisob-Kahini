import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { CameraKeyframe } from "../types/studio";

interface CameraContextValue {
  camX: number;
  camY: number;
  zoom: number;
  rotateDeg: number;
}

const CameraContext = React.createContext<CameraContextValue>({
  camX: 0,
  camY: 0,
  zoom: 1,
  rotateDeg: 0,
});

export const Camera25D: React.FC<{
  keyframes: CameraKeyframe[];
  breathingAmplitude?: number;
  children: React.ReactNode;
}> = ({ keyframes, breathingAmplitude = 2.5, children }) => {
  const frame = useCurrentFrame();

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

  // Subtle organic camera float
  const breathY = Math.sin(frame * 0.045) * breathingAmplitude;
  const breathX = Math.cos(frame * 0.032) * (breathingAmplitude * 0.6);

  return (
    <CameraContext.Provider
      value={{
        camX: camX + breathX,
        camY: camY + breathY,
        zoom,
        rotateDeg,
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
        }}
      >
        {children}
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
  children: React.ReactNode;
}> = ({ parallaxFactor, zIndex, overscanScale = 1.14, children }) => {
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
      }}
    >
      {children}
    </div>
  );
};
