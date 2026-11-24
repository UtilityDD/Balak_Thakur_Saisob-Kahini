import React from "react";
import { useCurrentFrame } from "remotion";
import { CameraKeyframe } from "../types/studio";
import { EASE, clamp, fbm1D, lerp } from "../lib/motion";

interface CameraState {
  camX: number;
  camY: number;
  zoom: number;
  focusDepth: number;
  dof: number;
}

const CameraContext = React.createContext<CameraState>({ camX: 0, camY: 0, zoom: 1, focusDepth: 1, dof: 1 });

export interface CameraOffset {
  x: number;
  y: number;
  /** Multiplicative zoom on top of the keyframed zoom. */
  zoom: number;
}

/** Sample keyframes with per-segment easing; zoom interpolates in log space so push-ins feel linear to the eye. */
const sampleKeys = (keys: CameraKeyframe[], f: number, defaultFocus: number) => {
  if (keys.length === 0) return { x: 0, y: 0, zoom: 1, rot: 0, focusDepth: defaultFocus };
  const first = keys[0];
  if (keys.length === 1 || f <= first.frame) {
    return { x: first.x, y: first.y, zoom: first.zoom, rot: first.rotateDeg ?? 0, focusDepth: first.focusDepth ?? defaultFocus };
  }
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f < b.frame) {
      const t = EASE[b.ease ?? "inOutSine"](clamp((f - a.frame) / Math.max(1, b.frame - a.frame), 0, 1));
      return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)),
        rot: lerp(a.rotateDeg ?? 0, b.rotateDeg ?? 0, t),
        focusDepth: lerp(a.focusDepth ?? defaultFocus, b.focusDepth ?? defaultFocus, t),
      };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last.x, y: last.y, zoom: last.zoom, rot: last.rotateDeg ?? 0, focusDepth: last.focusDepth ?? defaultFocus };
};

/**
 * Virtual multiplane camera.
 * - Keyframed dolly / pan / push-in with per-segment easing
 * - Organic handheld drift from layered noise (not a repeating sine)
 * - Additive `offset` for speaker-aware reframing
 * - Depth of field: planes away from `focusDepth` blur, more so when zoomed in
 */
export const Camera25D: React.FC<{
  keyframes: CameraKeyframe[];
  /** Scene-local frame override (used when a scene is pre-rolled for a transition). */
  frame?: number;
  offset?: CameraOffset;
  handheld?: number;
  /** @deprecated use `handheld`; kept for older scenes. */
  breathingAmplitude?: number;
  focusDepth?: number;
  dof?: number;
  children: React.ReactNode;
}> = ({ keyframes, frame: frameProp, offset, handheld, breathingAmplitude, focusDepth = 1, dof = 1, children }) => {
  const current = useCurrentFrame();
  const frame = frameProp ?? current;
  const amount = handheld ?? (breathingAmplitude !== undefined ? breathingAmplitude / 2.5 : 1);
  const base = sampleKeys(keyframes, frame, focusDepth);

  const shakeX = fbm1D(frame / 46, 11) * 7 * amount;
  const shakeY = fbm1D(frame / 52, 23) * 4.5 * amount;
  const roll = base.rot + fbm1D(frame / 70, 37) * 0.22 * amount;

  const zoom = base.zoom * (offset?.zoom ?? 1);
  const value: CameraState = {
    camX: base.x + (offset?.x ?? 0) + shakeX,
    camY: base.y + (offset?.y ?? 0) + shakeY,
    zoom,
    focusDepth: base.focusDepth,
    dof,
  };

  return (
    <CameraContext.Provider value={value}>
      <div style={{ position: "relative", width: 1920, height: 1080, overflow: "hidden", backgroundColor: "#0a0818" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 50%",
            // Roll needs a touch of extra scale so corners never show.
            transform: `rotate(${roll}deg) scale(${1 + Math.abs(roll) * 0.012})`,
          }}
        >
          {children}
        </div>
      </div>
    </CameraContext.Provider>
  );
};

/**
 * ParallaxPlane: one 2.5D depth plane.
 * parallaxFactor: 0.15 (sky) -> 0.35 (far river) -> 0.65 (midground) -> 1.0 (stage) -> 1.35 (foreground VFX)
 */
export const ParallaxPlane: React.FC<{
  parallaxFactor: number;
  zIndex: number;
  overscanScale?: number;
  /** Full-bleed planes grow their overscan so camera moves never expose an edge. */
  fullBleed?: boolean;
  /** Disable depth-of-field blur on this plane (e.g. title text). */
  sharp?: boolean;
  blendMode?: React.CSSProperties["mixBlendMode"];
  opacity?: number;
  children: React.ReactNode;
}> = ({ parallaxFactor, zIndex, overscanScale = 1.14, fullBleed = true, sharp = false, blendMode, opacity, children }) => {
  const { camX, camY, zoom, focusDepth, dof } = React.useContext(CameraContext);
  const zScale = 1 + (zoom - 1) * (0.35 + 0.65 * parallaxFactor);
  const tx = -camX * parallaxFactor * zScale;
  const ty = -camY * parallaxFactor * zScale;

  const overscan = fullBleed
    ? Math.max(overscanScale, (1 + Math.abs(tx) / 960 + 0.012) / zScale, (1 + Math.abs(ty) / 540 + 0.012) / zScale)
    : overscanScale;

  const blurPx = sharp ? 0 : Math.min(6, dof * Math.abs(parallaxFactor - focusDepth) * (1.5 + (zoom - 1) * 11));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        pointerEvents: "none",
        transformOrigin: "50% 50%",
        transform: `translate3d(${tx}px, ${ty}px, 0) scale(${overscan * zScale})`,
        filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(2)}px)` : undefined,
        mixBlendMode: blendMode,
        opacity,
      }}
    >
      {children}
    </div>
  );
};
