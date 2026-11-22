import React, { useId } from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { hash, noise1 } from "../cinematic/core/anim";
import type { Cam } from "../cinematic/core/Stage";
import type { CutoutAnchor } from "./episode03/plateAnchors";

const CamCtx = React.createContext<Cam>({ x: 0, y: 0, zoom: 1 });

/**
 * Multiplane camera stage tuned for hand-drawn Ghibli watercolor + sepia-ink sketches.
 * Mirrors Stage.tsx parallax math without the high-saturation TV filter.
 */
export const GhibliStage: React.FC<{
  cam: Cam;
  background?: string;
  children: React.ReactNode;
  opacity?: number;
}> = ({ cam, background = "#ead8be", children, opacity = 1 }) => {
  const f = useCurrentFrame();
  const sh = cam.shake ?? 0;
  const gimbalX = (noise1(f * 0.08, 3) + 0.4 * noise1(f * 0.21, 13)) * sh * 1.1 + noise1(f * 0.045, 9) * 1.6;
  const gimbalY = (noise1(f * 0.075, 7) + 0.4 * noise1(f * 0.19, 17)) * sh * 0.95 + noise1(f * 0.038, 5) * 1.2;
  const roll = (cam.rot ?? 0) + noise1(f * 0.035, 29) * 0.14;
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
          filter: "brightness(1.02) saturate(1.03) contrast(1.02)",
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

export const GhibliLayer: React.FC<{
  depth: number;
  children: React.ReactNode;
  blend?: React.CSSProperties["mixBlendMode"];
  extraBlur?: number;
  opacity?: number;
  /**
   * When true, anchors the layer's world coordinates at depth=1 (so ground contact points on the
   * depth=1 floor never slide or float during camera zooms/pans), while applying true multiplane
   * depth-of-field blur and subtle aerial perspective for this depth plane.
   */
  groundLocked?: boolean;
  /** Optional subtle parallax drift multiplier relative to the camera center (e.g. 0.04 for canopy/midground). */
  parallaxDrift?: number;
}> = ({ depth, children, blend, extraBlur = 0, opacity = 1, groundLocked = false, parallaxDrift = 0 }) => {
  const cam = React.useContext(CamCtx);
  const effDepth = groundLocked ? 1 : depth;
  const s = Math.pow(cam.zoom, effDepth);
  const focus = cam.focus ?? 1;
  const blur = Math.min(14, Math.abs(depth - focus) * (cam.dof ?? 0) + extraBlur);
  const tx = -cam.x * (effDepth + parallaxDrift);
  const ty = -cam.y * (effDepth + parallaxDrift * 0.45);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "50% 50%",
        transform: `scale(${s}) translate(${tx}px, ${ty}px) rotate(${(cam.rot ?? 0) * effDepth}deg)`,
        filter: blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : undefined,
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

/**
 * Forces Remotion's delayRender() to wait until every SVG <image> plate has loaded & decoded,
 * preventing blank frames during chunked headless renders.
 */
export const GhibliPreload: React.FC<{ files: readonly string[] }> = ({ files }) => (
  <div style={{ position: "absolute", left: -16, top: -16, width: 8, height: 8, overflow: "hidden", opacity: 0.01, pointerEvents: "none" }}>
    {files.map((file) => (
      <Img key={file} src={staticFile(file)} style={{ width: 2, height: 2 }} />
    ))}
  </div>
);

/** Places an anchor-measured Ghibli PNG cutout at world/stage (x, y) with target rendered height. */
export const GhibliCutout: React.FC<{
  file: string;
  anchor: CutoutAnchor;
  x: number;
  y: number;
  targetHeight: number;
  opacity?: number;
}> = ({ file, anchor, x, y, targetHeight, opacity = 1 }) => {
  const w = targetHeight * (anchor.width / anchor.height);
  const dx = x - w * anchor.anchorX;
  const dy = y - targetHeight * anchor.anchorY;
  return (
    <image
      href={staticFile(file)}
      x={dx}
      y={dy}
      width={w}
      height={targetHeight}
      preserveAspectRatio="none"
      opacity={opacity}
    />
  );
};

/**
 * Soft warm sepia-umber ground contact shadow under a character or prop, angled gently away from upper-right sun.
 */
export const ContactShadow: React.FC<{
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  opacity?: number;
}> = ({ x, y, rx = 34, ry = 9, opacity = 0.32 }) => {
  const id = `cs-${useId().replace(/:/g, "")}`;
  return (
    <g opacity={opacity} transform={`translate(${x - rx * 0.14}, ${y + 2})`}>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3a2216" stopOpacity={0.9} />
          <stop offset="55%" stopColor="#4a2e1f" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#4a2e1f" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={`url(#${id})`} />
    </g>
  );
};

/**
 * Non-destructive SVG filter wrapper for rigged characters (`Puppet` and `SeatedChild`).
 * Adds a delicate warm sepia-charcoal hand-drawn ink silhouette line (#3d2417) and subtle
 * organic watercolor pigment warmth without modifying a single rig file or joint.
 */
export const GhibliCharFilterDefs: React.FC = () => (
  <defs>
    <filter id="ghibli-char-ink" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
      {/* Warm watercolor paper-tint harmony on character fills */}
      <feColorMatrix
        in="SourceGraphic"
        type="matrix"
        values="1.01 0.01 0 0 0.008  0 0.995 0 0 0.004  0 0 0.965 0 -0.006  0 0 0 1 0"
        result="warmed"
      />
      {/* Delicate 1.05px sepia-charcoal ink contour around character silhouette */}
      <feMorphology in="SourceAlpha" operator="dilate" radius="1.05" result="dilated" />
      <feGaussianBlur in="dilated" stdDeviation="0.35" result="softOutline" />
      <feFlood floodColor="#3b2316" floodOpacity="0.62" result="inkColor" />
      <feComposite in="inkColor" in2="softOutline" operator="in" result="outerInk" />
      <feMerge>
        <feMergeNode in="outerInk" />
        <feMergeNode in="warmed" />
      </feMerge>
    </filter>
  </defs>
);

/**
 * Soft horizon transition band at y=784 where the courtyard floor meets the veranda steps,
 * plus dappled warm-umber tree-canopy shadows cast toward the lower-left by the upper-right morning sun.
 */
export const GhibliCourtyardShadows: React.FC<{
  f: number;
  shiuli: { x: number; y: number };
  jhumko: { x: number; y: number };
  jaba: { x: number; y: number };
  tulsi: { x: number; y: number; s: number };
}> = ({ f, shiuli, jhumko, jaba, tulsi }) => {
  const swayX = 4 * Math.sin(f * 0.022 + 0.7) + 2.5 * noise1(f * 0.015, 31);
  return (
    <g>
      <defs>
        <linearGradient id="ghibli-step-seam-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5e3d28" stopOpacity={0} />
          <stop offset="38%" stopColor="#4f3220" stopOpacity={0.22} />
          <stop offset="68%" stopColor="#6b4730" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#6b4730" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="ghibli-dapple-umbra" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#42291a" stopOpacity={0.22} />
          <stop offset="58%" stopColor="#523422" stopOpacity={0.13} />
          <stop offset="100%" stopColor="#523422" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ghibli-dapple-leaf" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3c2417" stopOpacity={0.16} />
          <stop offset="70%" stopColor="#4d3020" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#4d3020" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Soft sandstone plinth shadow across the y=784 floor seam */}
      <rect x={-450} y={772} width={2820} height={32} fill="url(#ghibli-step-seam-shadow)" />

      {/* Dappled tree-canopy ground shadows angled slightly left from upper-right sunlight */}
      {[
        { x: shiuli.x - 36, y: shiuli.y + 18, rx: 185, ry: 34, seed: 11 },
        { x: jhumko.x - 42, y: jhumko.y + 16, rx: 195, ry: 36, seed: 23 },
        { x: jaba.x - 46, y: jaba.y + 18, rx: 215, ry: 38, seed: 37 },
      ].map((t, idx) => (
        <g key={idx} transform={`translate(${t.x + swayX * (0.8 + idx * 0.15)}, ${t.y})`}>
          <ellipse cx={0} cy={0} rx={t.rx} ry={t.ry} fill="url(#ghibli-dapple-umbra)" />
          {[-0.55, -0.22, 0.16, 0.48].map((u, k) => (
            <ellipse
              key={k}
              cx={u * t.rx + Math.sin(f * 0.03 + t.seed + k) * 3.5}
              cy={((k % 2) - 0.4) * t.ry * 0.55}
              rx={t.rx * 0.34}
              ry={t.ry * 0.48}
              fill="url(#ghibli-dapple-leaf)"
            />
          ))}
        </g>
      ))}

      {/* Directional morning shadow cast to the left of the Tulsi Mancha */}
      <ellipse
        cx={tulsi.x - 82 * tulsi.s}
        cy={tulsi.y + 10 * tulsi.s}
        rx={135 * tulsi.s}
        ry={22 * tulsi.s}
        fill="url(#ghibli-dapple-umbra)"
      />
    </g>
  );
};

/**
 * Warm Sharad morning aerial-perspective veil + floating golden dust-motes placed between
 * the background architecture (0.55), midground trees (0.78), and foreground actors (1.0).
 * Separates dark hair from dark veranda doorways and gives genuine studio atmospheric depth.
 */
export const GhibliAtmosphericHaze: React.FC<{
  f: number;
  intensity?: number;
  seed?: number;
}> = ({ f, intensity = 1, seed = 41 }) => {
  const id = `gah-${useId().replace(/:/g, "")}`;
  return (
    <g opacity={intensity}>
      <defs>
        <linearGradient id={`${id}-veil`} x1="0.85" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#fff3d1" stopOpacity={0.22} />
          <stop offset="48%" stopColor="#ffe7bc" stopOpacity={0.13} />
          <stop offset="82%" stopColor="#f7d8a8" stopOpacity={0.07} />
          <stop offset="100%" stopColor="#f7d8a8" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-sun-pool`} cx="78%" cy="32%" r="60%">
          <stop offset="0%" stopColor="#fff4cf" stopOpacity={0.24} />
          <stop offset="55%" stopColor="#ffe1a4" stopOpacity={0.09} />
          <stop offset="100%" stopColor="#ffe1a4" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-700} y={100} width={3400} height={820} fill={`url(#${id}-veil)`} style={{ mixBlendMode: "screen" }} />
      <rect x={-700} y={80} width={3400} height={860} fill={`url(#${id}-sun-pool)`} style={{ mixBlendMode: "screen" }} />
      {/* Drifting sunlit pollen / dust motes in the courtyard air */}
      <g style={{ mixBlendMode: "screen" }}>
        {Array.from({ length: 24 }, (_, i) => {
          const xBase = -250 + hash(seed + i * 3.7) * 2450;
          const yBase = 240 + hash(seed + i * 5.3) * 620;
          const vx = 0.16 + hash(seed + i * 1.9) * 0.22;
          const vy = -0.08 - hash(seed + i * 2.7) * 0.12;
          const x = ((xBase + f * vx + 300) % 2500) - 300 + Math.sin(f * 0.03 + i) * 14;
          const y = ((yBase + f * vy - 200 + 660) % 660) + 200 + Math.cos(f * 0.025 + i * 1.4) * 9;
          const r = 1.6 + hash(seed + i * 7.1) * 2.4;
          const pulse = 0.25 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(f * (0.04 + hash(i) * 0.03) + i * 1.9), 2);
          return <circle key={i} cx={x} cy={y} r={r} fill="#fff6db" opacity={pulse} />;
        })}
      </g>
    </g>
  );
};

/**
 * Out-of-focus foreground Ghibli foliage & blossom bokeh passing near the top-left and top-right
 * camera edges at depth > 1.18. Automatically fades back during tight 3x-4x close-ups so faces stay clear.
 */
export const GhibliForegroundBokeh: React.FC<{
  f: number;
  zoom?: number;
}> = ({ f, zoom = 1 }) => {
  // Subtle in wide/medium shots, gently recedes on extreme close-ups so it never crowds faces
  const zoomFade = Math.max(0.18, Math.min(1, 1.45 - (zoom - 1) * 0.35));
  const swayL = 3.2 * Math.sin(f * 0.024 + 0.4) + 1.8 * noise1(f * 0.016, 81);
  const swayR = 2.8 * Math.sin(f * 0.021 + 2.1) + 1.6 * noise1(f * 0.015, 89);
  return (
    <g opacity={0.78 * zoomFade}>
      {/* Upper-left foreground Shiuli branch silhouette in soft bokeh */}
      <g transform={`translate(-90, -45) rotate(${swayL * 0.45})`}>
        <path d="M -40 10 Q 95 45 220 92" stroke="#3c2618" strokeWidth={11} fill="none" strokeLinecap="round" opacity={0.65} />
        {[
          { x: 42, y: 36, len: 34, rot: 28 },
          { x: 96, y: 58, len: 38, rot: -22 },
          { x: 148, y: 72, len: 32, rot: 34 },
          { x: 196, y: 92, len: 30, rot: 12 },
          { x: 75, y: 24, len: 28, rot: -38 },
        ].map((lf, i) => (
          <GhibliSketchedLeaf key={`fl${i}`} x={lf.x} y={lf.y} len={lf.len} rot={lf.rot} variant={i} />
        ))}
        <GhibliInkBloom x={128} y={64} r={12} kind="shiuli" rot={18} />
        <GhibliInkBloom x={182} y={86} r={10.5} kind="shiuli" rot={-24} />
      </g>

      {/* Upper-right foreground sunlit Jaba leaves & blossom in soft bokeh */}
      <g transform={`translate(2010, -35) rotate(${swayR * 0.4}) scale(-1, 1)`}>
        <path d="M -30 8 Q 85 40 195 82" stroke="#422a1b" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.6} />
        {[
          { x: 46, y: 34, len: 34, rot: 24 },
          { x: 104, y: 54, len: 36, rot: -18 },
          { x: 158, y: 74, len: 32, rot: 30 },
        ].map((lf, i) => (
          <GhibliSketchedLeaf key={`fr${i}`} x={lf.x} y={lf.y} len={lf.len} rot={lf.rot} variant={i + 2} />
        ))}
        <GhibliJabaBlossom x={138} y={68} r={14} rot={25} />
      </g>
    </g>
  );
};

/**
 * Hand-sketched Ghibli hibiscus leaf with serrated silhouette, dual-tone watercolor fill,
 * sepia ink outline, and central midrib vein (used by the interactive overhead Jaba branch).
 */
export const GhibliSketchedLeaf: React.FC<{
  x: number;
  y: number;
  len?: number;
  rot?: number;
  variant?: number;
}> = ({ x, y, len = 18, rot = 0, variant = 0 }) => {
  const s = len / 18;
  const fillMain = variant % 3 === 0 ? "#4a7c3c" : variant % 3 === 1 ? "#3e6e33" : "#568944";
  const fillTip = variant % 2 === 0 ? "#6a9e52" : "#5c8f47";
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
      <path
        d="M -16 0 Q -11 -6.2 -5 -5.4 L -3 -6.8 Q 2 -5.5 7 -4.8 L 9 -5.8 Q 14 -3.2 18 0 Q 14 3.4 9 5.6 L 7 4.6 Q 2 5.6 -3 6.6 L -5 5.2 Q -11 6.0 -16 0 Z"
        fill={fillMain}
        stroke="#362216"
        strokeWidth={1.05}
        strokeLinejoin="round"
        strokeOpacity={0.82}
      />
      <path d="M -6 -3.8 Q 5 -4.4 16 0 Q 6 1.8 -6 0.6 Z" fill={fillTip} opacity={0.48} />
      <path d="M -15 0 Q 0 -0.4 16 0" stroke="#2a4820" strokeWidth={0.95} fill="none" opacity={0.75} strokeLinecap="round" />
      <path d="M -5 -0.2 L -1 -3.4 M 2 -0.2 L 6 -3.1 M -2 0.2 L 2 3.2" stroke="#2d4c22" strokeWidth={0.65} fill="none" opacity={0.55} strokeLinecap="round" />
    </g>
  );
};

/**
 * Final watercolor paper-tooth glaze, warm sun bloom, and soft edge vignette unifying
 * the hand-drawn Ghibli sketch backgrounds and vector character rigs.
 */
export const GhibliGrade: React.FC<{
  warmth?: number;
  vignette?: number;
  bloomAt?: [number, number];
  paperOpacity?: number;
}> = ({ warmth = 0.28, vignette = 0.34, bloomAt = [75, 22], paperOpacity = 0.24 }) => (
  <>
    {warmth > 0 && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at ${bloomAt[0]}% ${bloomAt[1]}%, rgba(255,214,148,0.34) 0%, rgba(255,172,96,0.09) 46%, rgba(0,0,0,0) 76%)`,
          mixBlendMode: "screen",
          opacity: warmth,
          pointerEvents: "none",
        }}
      />
    )}
    {paperOpacity > 0 && (
      <Img
        src={staticFile("images/ghibli_ep03/watercolor_paper_grain.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          mixBlendMode: "multiply",
          opacity: paperOpacity,
          pointerEvents: "none",
        }}
      />
    )}
    {vignette > 0 && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 56%, rgba(28,16,12,${vignette}) 100%)`,
          pointerEvents: "none",
        }}
      />
    )}
  </>
);

/* ------------------------------------------------------------------ */
/* Sepia-ink-styled interactive blossoms & fallen shiuli carpet        */
/* ------------------------------------------------------------------ */

export type GhibliFlowerKind = "jaba" | "shiuli" | "jhumko";

const INK_STROKE = "#422a1d";

export const GhibliInkBloom: React.FC<{ x: number; y: number; r: number; kind: GhibliFlowerKind; rot?: number }> = ({
  x,
  y,
  r,
  kind,
  rot = 0,
}) => {
  const petal = kind === "jaba" ? "#d62d36" : kind === "shiuli" ? "#fcf6eb" : "#f29d35";
  const core = kind === "jaba" ? "#6b1218" : kind === "shiuli" ? "#e68524" : "#a85214";
  const n = kind === "jhumko" ? 6 : 5;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
      {Array.from({ length: n }, (_, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={-r * 0.52}
          rx={r * (kind === "shiuli" ? 0.3 : 0.42)}
          ry={r * (kind === "shiuli" ? 0.56 : 0.6)}
          fill={petal}
          stroke={INK_STROKE}
          strokeWidth={Math.max(0.7, r * 0.08)}
          strokeOpacity={0.72}
          transform={`rotate(${(i * 360) / n})`}
        />
      ))}
      <circle r={r * 0.22} fill={core} stroke={INK_STROKE} strokeWidth={0.6} strokeOpacity={0.65} />
    </g>
  );
};

export const GhibliJabaBlossom: React.FC<{ x: number; y: number; r: number; rot?: number }> = ({ x, y, r, rot = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
    <GhibliInkBloom x={0} y={0} r={r} kind="jaba" />
    <circle r={r * 0.58} fill="#a81822" opacity={0.3} />
    <path d={`M 0 0 L ${r * 0.95} ${r * 0.55}`} stroke="#f0be4a" strokeWidth={Math.max(1.2, r * 0.1)} strokeLinecap="round" />
    <circle cx={r * 0.98} cy={r * 0.57} r={r * 0.14} fill="#ffd554" stroke={INK_STROKE} strokeWidth={0.6} />
  </g>
);

export const GhibliJhumkoBell: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    <path
      d="M -9 2 Q 0 -6 9 2 Q 12 13 6 18 L 3 14 L 0 19 L -3 14 L -6 18 Q -12 13 -9 2 Z"
      fill="#e55a2c"
      stroke={INK_STROKE}
      strokeWidth={1.1}
      strokeLinejoin="round"
    />
    <path d="M -5 3 Q 0 -1 5 3 Q 6 9 0 12 Q -6 9 -5 3 Z" fill="#f7a048" opacity={0.8} />
    <path d="M 0 12 L 1 28" stroke="#edc04c" strokeWidth={1.4} />
    <circle cx={1} cy={29} r={2.2} fill="#ffd24a" stroke={INK_STROKE} strokeWidth={0.6} />
  </g>
);

/** Crisp hand-inked watercolor carpet of fallen shiuli flowers on the flagstones. */
export const GhibliFallenShiuli: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    {Array.from({ length: 68 }, (_, i) => {
      const a = hash(i * 3.9 + 2) * Math.PI * 2;
      const r = Math.sqrt(hash(i * 5.3 + 1));
      const fx = x + Math.cos(a) * 245 * r;
      const fy = y + 40 + Math.sin(a) * 46 * r + 12;
      return (
        <g key={i}>
          <ellipse cx={fx - 1} cy={fy + 2.5} rx={5.5} ry={2.2} fill="#3a2216" opacity={0.22} />
          <GhibliInkBloom x={fx} y={fy} r={5.2} kind="shiuli" rot={i * 37} />
        </g>
      );
    })}
  </g>
);
