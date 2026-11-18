import React from "react";
import { useCurrentFrame } from "remotion";
import { fbm1D, noise1D } from "../lib/motion";
import { rgba, useMood } from "../lib/mood";

/** React's useId contains ':' which breaks SVG url(#id) references. */
export const useSvgId = (prefix: string): string => `${prefix}-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

/** Soft radial light source (diya halo, lamp pool, divine aura). Use inside an <svg>. */
export const RadialGlow: React.FC<{
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity?: number;
  rx?: number;
  ry?: number;
  core?: number;
}> = ({ cx, cy, r, color, opacity = 1, rx, ry, core = 0.15 }) => {
  const id = useSvgId("glow");
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset={`${core * 100}%`} stopColor={color} stopOpacity={0.75} />
          <stop offset="45%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx ?? r} ry={ry ?? r} fill={`url(#${id})`} />
    </g>
  );
};

/** Volumetric light shafts that slowly breathe and shimmer. Place on its own plane with screen blending. */
export const GodRays: React.FC<{ x: number; y: number; color: string; strength: number; count?: number }> = ({
  x,
  y,
  color,
  strength,
  count = 11,
}) => {
  const frame = useCurrentFrame();
  const id = useSvgId("rays");
  const sweep = fbm1D(frame / 160, 5) * 4;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ filter: "blur(14px)" }}>
      <defs>
        <radialGradient id={id} cx={x} cy={y} r={1500} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity={0.95} />
          <stop offset="35%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g opacity={strength}>
        {Array.from({ length: count }).map((_, i) => {
          const baseAng = 30 + (i / (count - 1)) * 120 + sweep;
          const width = 2.2 + noise1D(i * 3.1, 4) * 4.5;
          const a0 = ((baseAng - width / 2) * Math.PI) / 180;
          const a1 = ((baseAng + width / 2) * Math.PI) / 180;
          const len = 1700;
          const shimmer = 0.35 + 0.65 * noise1D(frame / 55 + i * 1.7, 9);
          return (
            <path
              key={i}
              d={`M ${x} ${y} L ${x + Math.cos(a0) * len} ${y + Math.sin(a0) * len} L ${x + Math.cos(a1) * len} ${y + Math.sin(a1) * len} Z`}
              fill={`url(#${id})`}
              opacity={shimmer}
            />
          );
        })}
      </g>
    </svg>
  );
};

/** Aerial perspective: a horizon haze band plus slow drifting mist banks. */
export const AtmosphereHaze: React.FC<{ horizonY?: number; strength?: number }> = ({ horizonY = 560, strength }) => {
  const frame = useCurrentFrame();
  const mood = useMood();
  const id = useSvgId("haze");
  const s = strength ?? mood.fogStrength;
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mood.fog} stopOpacity={0} />
          <stop offset={`${((horizonY - 160) / 1080) * 100}%`} stopColor={mood.fog} stopOpacity={0.15} />
          <stop offset={`${(horizonY / 1080) * 100}%`} stopColor={mood.fog} stopOpacity={0.75} />
          <stop offset={`${((horizonY + 140) / 1080) * 100}%`} stopColor={mood.fog} stopOpacity={0.12} />
          <stop offset="100%" stopColor={mood.fog} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g opacity={s}>
        <rect width="1920" height="1080" fill={`url(#${id})`} />
        <g style={{ filter: "blur(30px)" }}>
          {[0, 1, 2, 3].map((i) => {
            const x = ((i * 620 + frame * (0.35 + i * 0.12)) % 2600) - 340;
            return (
              <ellipse
                key={i}
                cx={x}
                cy={horizonY + 10 + (i % 2) * 40}
                rx={380}
                ry={46}
                fill={mood.fog}
                opacity={0.55 + 0.3 * noise1D(frame / 90 + i, 2)}
              />
            );
          })}
        </g>
      </g>
    </svg>
  );
};

/**
 * Screen-space finishing pass: colour grade, light bloom, vignette, film grain.
 * Wrap the camera with this so the grade applies to every plane at once.
 */
export const CinematicFrame: React.FC<{ children: React.ReactNode; letterbox?: number }> = ({ children, letterbox = 0 }) => {
  const frame = useCurrentFrame();
  const mood = useMood();
  const grainId = useSvgId("grain");
  const bloomBreath = 0.85 + 0.15 * noise1D(frame / 70, 3);
  const keyX = mood.keyDir > 0 ? "78%" : "22%";

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, filter: `saturate(${mood.saturate}) contrast(${mood.contrast})` }}>
        {children}
      </div>

      {/* Split-tone grade: tinted lifted blacks + warm/cool highlight wash */}
      <div style={{ position: "absolute", inset: 0, background: mood.gradeShadows, mixBlendMode: "lighten", opacity: 0.55 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: mood.gradeHighlights,
          mixBlendMode: "soft-light",
          opacity: mood.gradeStrength,
        }}
      />

      {/* Key-light bloom / light leak */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          mixBlendMode: "screen",
          opacity: (mood.isNight ? 0.22 : 0.3) * bloomBreath,
          background: `radial-gradient(ellipse 70% 60% at ${keyX} 30%, ${rgba(mood.key, 0.55)} 0%, ${rgba(mood.key, 0.12)} 45%, transparent 75%)`,
        }}
      />

      {/* Lens vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 78% 72% at 50% 48%, transparent 52%, rgba(6, 4, 14, ${mood.vignette}) 100%)`,
        }}
      />

      {/* Organic film grain, re-seeded every frame */}
      <svg width="1920" height="1080" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: mood.grain * 2.4 }}>
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves={2} seed={frame % 113} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1920" height="1080" filter={`url(#${grainId})`} />
      </svg>

      {letterbox > 0 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: letterbox, background: "#050308" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: letterbox, background: "#050308" }} />
        </>
      )}
    </div>
  );
};
