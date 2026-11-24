import React from "react";
import { useCurrentFrame } from "remotion";
import { noise1 } from "./anim";

/**
 * Multiplane camera.
 *  - x/y: camera position in "stage" pixels (depth 1 plane moves 1:1)
 *  - zoom: dolly; each plane scales by zoom^depth so far planes barely grow
 *  - focus: depth in focus; other planes get blurred proportional to |depth - focus| (DOF)
 *  - shake: handheld amplitude in px
 */
export interface Cam {
  x: number;
  y: number;
  zoom: number;
  rot?: number;
  focus?: number;
  dof?: number;
  shake?: number;
}

const CamCtx = React.createContext<Cam>({ x: 0, y: 0, zoom: 1 });

export const Stage: React.FC<{
  cam: Cam;
  background?: string;
  children: React.ReactNode;
  opacity?: number;
}> = ({ cam, background = "#05040a", children, opacity = 1 }) => {
  const f = useCurrentFrame();
  const sh = cam.shake ?? 0;
  const gimbalX = (noise1(f * 0.08, 3) + 0.4 * noise1(f * 0.21, 13)) * sh * 1.1 + noise1(f * 0.045, 9) * 2.2;
  const gimbalY = (noise1(f * 0.075, 7) + 0.4 * noise1(f * 0.19, 17)) * sh * 0.95 + noise1(f * 0.038, 5) * 1.6;
  const roll = (cam.rot ?? 0) + noise1(f * 0.035, 29) * 0.18;
  const c: Cam = {
    ...cam,
    x: cam.x + gimbalX,
    y: cam.y + gimbalY,
    rot: 0,
  };
  return (
    <CamCtx.Provider value={c}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          background,
          opacity,
          // Clean luminous anime TV color lift (Doraemon/Shin-Ei vibrant warm clarity)
          filter: "brightness(1.10) saturate(1.18) contrast(1.04)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 50%",
            transform: `rotate(${roll.toFixed(3)}deg) scale(${(1 + Math.abs(roll) * 0.012).toFixed(4)})`,
          }}
        >
          {children}
        </div>
      </div>
    </CamCtx.Provider>
  );
};

export const Layer: React.FC<{
  depth: number;
  children: React.ReactNode;
  blend?: React.CSSProperties["mixBlendMode"];
  extraBlur?: number;
  opacity?: number;
}> = ({ depth, children, blend, extraBlur = 0, opacity = 1 }) => {
  const cam = React.useContext(CamCtx);
  const s = Math.pow(cam.zoom, depth);
  const focus = cam.focus ?? 1;
  const blur = Math.min(14, Math.abs(depth - focus) * (cam.dof ?? 0) + extraBlur);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "50% 50%",
        transform: `scale(${s}) translate(${-cam.x * depth}px, ${-cam.y * depth}px) rotate(${(cam.rot ?? 0) * depth}deg)`,
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
        mixBlendMode: blend,
        opacity,
      }}
    >
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ overflow: "visible", position: "absolute", inset: 0 }}>
        {children}
      </svg>
    </div>
  );
};

/** Final look: warm bloom wash, vignette, grain, optional flash. */
export const Grade: React.FC<{
  warmth?: number;
  vignette?: number;
  flash?: number;
  flashColor?: string;
  tint?: string;
  tintAmount?: number;
  grain?: number;
  bloomAt?: [number, number];
}> = ({
  warmth = 0.3,
  vignette = 0.55,
  flash = 0,
  flashColor = "#ffe2a8",
  tint,
  tintAmount = 0,
  grain = 0.06,
  bloomAt = [50, 55],
}) => {
  const f = useCurrentFrame();
  return (
    <>
      {warmth > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at ${bloomAt[0]}% ${bloomAt[1]}%, rgba(255,190,110,0.35) 0%, rgba(255,140,60,0.10) 45%, rgba(0,0,0,0) 75%)`,
            mixBlendMode: "screen",
            opacity: warmth,
          }}
        />
      )}
      {tint && tintAmount > 0 && (
        <div style={{ position: "absolute", inset: 0, background: tint, mixBlendMode: "multiply", opacity: tintAmount }} />
      )}
      {flash > 0.001 && (
        <div style={{ position: "absolute", inset: 0, background: flashColor, mixBlendMode: "screen", opacity: flash }} />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 52%, rgba(6,3,10,${vignette}) 100%)`,
        }}
      />
      {grain > 0 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: grain, mixBlendMode: "overlay" }}>
          <filter id={`grain-${f % 6}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 6} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="1920" height="1080" filter={`url(#grain-${f % 6})`} />
        </svg>
      )}
    </>
  );
};
