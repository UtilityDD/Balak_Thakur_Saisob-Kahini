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
  // Phase 4 (Items 16 & 23): Painted background blur & aerial-perspective softness on distant planes
  const farDist = Math.max(0, 1 - depth);
  const paintedFilter =
    blur > 0.25
      ? `blur(${blur.toFixed(2)}px)${farDist > 0.2 ? ` saturate(${(1 - farDist * 0.14).toFixed(3)}) contrast(${(1 - farDist * 0.08).toFixed(3)}) brightness(${(1 + farDist * 0.03).toFixed(3)})` : ""}`
      : farDist > 0.35
        ? `saturate(${(1 - farDist * 0.10).toFixed(3)}) contrast(${(1 - farDist * 0.05).toFixed(3)})`
        : undefined;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "50% 50%",
        transform: `scale(${s}) translate(${tx}px, ${ty}px) rotate(${(cam.rot ?? 0) * effDepth}deg)`,
        filter: paintedFilter,
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
 * 2-layer Studio Ghibli ground shadow (Phase 1, Item 4):
 *  1. Wide directional watercolor cast wash stretched away from the scene sun (`sunDir`).
 *  2. Crisp, darker ambient-occlusion contact crease right under soles, knees, or seated lap.
 */
export const ContactShadow: React.FC<{
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  opacity?: number;
  /** Sun horizontal direction (+1 = upper-right sun casting shadow left, -1 = upper-left sun casting right). */
  sunDir?: 1 | -1;
  /** Extra cast shadow stretch multiplier (default 1, use 1.4+ for low dawn/afternoon sun). */
  castStretch?: number;
}> = ({ x, y, rx = 34, ry = 9, opacity = 0.34, sunDir = 1, castStretch = 1 }) => {
  const id = `cs-${useId().replace(/:/g, "")}`;
  const castDx = -sunDir * rx * 0.36 * castStretch;
  const castRx = rx * (1.35 * castStretch);
  const castRy = ry * 1.18;
  return (
    <g opacity={opacity} pointerEvents="none">
      <defs>
        <radialGradient id={`${id}-cast`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3e2920" stopOpacity={0.62} />
          <stop offset="52%" stopColor="#4f3930" stopOpacity={0.32} />
          <stop offset="82%" stopColor="#5a453c" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#5a453c" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-contact`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#24120a" stopOpacity={0.95} />
          <stop offset="58%" stopColor="#321b11" stopOpacity={0.62} />
          <stop offset="100%" stopColor="#321b11" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Layer 1: Wide soft directional watercolor cast shadow */}
      <ellipse
        cx={x + castDx}
        cy={y + 3.5}
        rx={castRx}
        ry={castRy}
        fill={`url(#${id}-cast)`}
        style={{ mixBlendMode: "multiply" }}
      />
      {/* Layer 2: Crisp dark ambient-occlusion contact crease right beneath feet/knees */}
      <ellipse
        cx={x - sunDir * rx * 0.06}
        cy={y + 1.2}
        rx={rx * 0.78}
        ry={Math.max(2.6, ry * 0.52)}
        fill={`url(#${id}-contact)`}
        style={{ mixBlendMode: "multiply" }}
      />
    </g>
  );
};

/**
 * Phase 1 Studio Ghibli Painter's Material & Lighting Filter (`GhibliCharFilterDefs`):
 * Transforms rigged vector characters (`Puppet`, `SeatedChild`, `StandingChild`, `GentleCow`, `Tortoise`)
 * into hand-painted watercolor + sepia-ink film cels:
 *  1. Organic watercolor pigment pooling + wet-edge darkening + fine cold-press paper texture inside fills
 *     (eliminating flat vector fills).
 *  2. Scene-matched directional lighting: warm sunlit rim on the sunward edge (`sunColor`) + cool sky/foliage
 *     bounce light on the shadow edge (`bounceColor`) + optional canopy shade darkening (`shadeFactor`).
 *  3. Interior hand-inked sepia linework (`feConvolveMatrix`) + outer warm-sepia silhouette contour.
 *  4. Subtle 8 fps hand-drawn pencil boil (`feDisplacementMap` stepped on threes).
 *  5. Optional animated dappled canopy sunlight modulation (`dapple={true}`) for grove/tree scenes.
 */
export const GhibliCharFilterDefs: React.FC<{
  /** Optional life frame for 8 fps subtle pencil boil (defaults to Remotion's current frame). */
  f?: number;
  /** Sunward rim-light direction (+1 = upper-right sun, -1 = upper-left sun). */
  rimDir?: 1 | -1;
  /** Warm sunlight rim tint matching scene time of day. */
  sunColor?: string;
  /** Cool bounce light tint on the shadow side (e.g. cool sky blue-grey or sage leaf bounce). */
  bounceColor?: string;
  /** Tree/canopy shade darkening factor (0 = full sun, 0.25 = grove shade). */
  shadeFactor?: number;
  /** Enable subtle dappled canopy sunlight modulation over character fills (grove/tree scenes). */
  dapple?: boolean;
}> = ({
  f,
  rimDir = 1,
  sunColor = "#ffe6a8",
  bounceColor = "#8ea8c4",
  shadeFactor = 0,
  dapple = false,
}) => {
    const curF = useCurrentFrame();
    const frame = f ?? curF;
    // Step boil seed on threes (8 fps at 24 fps) across a gentle 4-drawing cycle so it breathes naturally
    const boilSeed = 11 + (Math.floor(Math.max(0, frame) / 3) % 4) * 7;
    const dappleSeed = 41;
    const dappleFreqX = 0.011 + 0.0005 * Math.sin(frame * 0.025);
    const dappleFreqY = 0.016 + 0.0005 * Math.cos(frame * 0.021);
    const rimDx = rimDir > 0 ? -1.8 : 1.8;
    const bounceDx = rimDir > 0 ? 2.2 : -2.2;
    const shadeGain = 1 - Math.max(0, Math.min(0.6, shadeFactor)) * 0.22;
    const shadeR = (1.015 * shadeGain).toFixed(4);
    const shadeG = (0.992 * (shadeGain + shadeFactor * 0.02)).toFixed(4);
    const shadeB = (0.955 * (shadeGain + shadeFactor * 0.05)).toFixed(4);
    const balakR = (1.02 * (1 - shadeFactor * 0.14)).toFixed(4);
    const balakG = (1.0 * (1 - shadeFactor * 0.12)).toFixed(4);
    const balakB = (0.96 * (1 - shadeFactor * 0.09)).toFixed(4);

    return (
      <defs>
        <filter id="ghibli-char-ink" x="-14%" y="-14%" width="128%" height="128%" colorInterpolationFilters="sRGB">
          {/* 1. Scene-matched color harmony + shade darkening */}
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values={`${shadeR} 0.012 0 0 0.007  0 ${shadeG} 0 0 0.004  0 0 ${shadeB} 0 -0.006  0 0 0 1 0`}
            result="warmed"
          />

          {/* 1b. Pure monochrome warm-ochre watercolor pigment mottling locked inside character alpha (no RGB color noise) */}
          <feTurbulence type="fractalNoise" baseFrequency="0.019 0.024" numOctaves="3" seed="17" result="wcMottle" />
          <feColorMatrix
            in="wcMottle"
            type="matrix"
            values="0.14 0 0 0 0.88  0.13 0 0 0 0.88  0.11 0 0 0 0.87  0 0 0 0 1"
            result="wcMottleTone"
          />
          <feComposite in="wcMottleTone" in2="SourceAlpha" operator="in" result="wcMottleClipped" />
          <feBlend in="warmed" in2="wcMottleClipped" mode="multiply" result="wcMottled" />

          {/* 1c. Subtle watercolor wet-edge pigment pooling along inner contour */}
          <feMorphology in="SourceAlpha" operator="erode" radius="2.0" result="erodedAlpha" />
          <feGaussianBlur in="erodedAlpha" stdDeviation="1.5" result="erodedSoft" />
          <feComposite in="SourceAlpha" in2="erodedSoft" operator="out" result="wetEdgeBand" />
          <feFlood floodColor="#7a563c" floodOpacity="0.18" result="wetEdgePigment" />
          <feComposite in="wetEdgePigment" in2="wetEdgeBand" operator="in" result="wetEdge" />
          <feBlend in="wcMottled" in2="wetEdge" mode="multiply" result="wcPainted" />

          {/* 2. Directional sunward warm rim light */}
          <feOffset in="SourceAlpha" dx={rimDx} dy="1.35" result="alphaShifted" />
          <feComposite in="SourceAlpha" in2="alphaShifted" operator="out" result="rimEdgeRaw" />
          <feGaussianBlur in="rimEdgeRaw" stdDeviation="0.7" result="rimEdgeSoft" />
          <feFlood floodColor={sunColor} floodOpacity="0.54" result="rimColor" />
          <feComposite in="rimColor" in2="rimEdgeSoft" operator="in" result="rimLight" />

          {/* 2b. Opposite shadow-side cool sky/foliage bounce light */}
          <feOffset in="SourceAlpha" dx={bounceDx} dy="-0.9" result="bounceShifted" />
          <feComposite in="SourceAlpha" in2="bounceShifted" operator="out" result="bounceEdgeRaw" />
          <feGaussianBlur in="bounceEdgeRaw" stdDeviation="1.35" result="bounceEdgeSoft" />
          <feFlood floodColor={bounceColor} floodOpacity="0.26" result="bounceColorFlood" />
          <feComposite in="bounceColorFlood" in2="bounceEdgeSoft" operator="in" result="bounceLight" />

          {/* 3. Interior hand-inked sepia linework */}
          <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="luma" />
          <feConvolveMatrix
            in="luma"
            order="3"
            kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
            divisor="1.38"
            bias="0"
            preserveAlpha="true"
            result="edgesRaw"
          />
          <feColorMatrix
            in="edgesRaw"
            type="matrix"
            values="0 0 0 0 0.22  0 0 0 0 0.125  0 0 0 0 0.078  0.54 0.54 0.54 0 -0.14"
            result="interiorEdges"
          />
          <feComposite in="interiorEdges" in2="SourceAlpha" operator="in" result="interiorInkClipped" />
          <feComponentTransfer in="interiorInkClipped" result="interiorInk">
            <feFuncA type="linear" slope="0.14" intercept="0" />
          </feComponentTransfer>

          {/* 4. Outer sepia-charcoal silhouette contour */}
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.72" result="dilated" />
          <feGaussianBlur in="dilated" stdDeviation="0.28" result="softOutline" />
          <feFlood floodColor="#382115" floodOpacity="0.46" result="inkColor" />
          <feComposite in="inkColor" in2="softOutline" operator="in" result="outerInk" />

          {/* 5. Composite outer ink + watercolor-painted fills + cool bounce + interior ink + warm rim */}
          <feMerge result="celPainted">
            <feMergeNode in="outerInk" />
            <feMergeNode in="wcPainted" />
            <feMergeNode in="bounceLight" />
            <feMergeNode in="interiorInk" />
            <feMergeNode in="rimLight" />
          </feMerge>

          {/* 6. Subtle 8 fps hand-drawn pencil/cel line boil */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.028"
            numOctaves="2"
            seed={boilSeed}
            result="boilNoise"
          />
          <feDisplacementMap
            in="celPainted"
            in2="boilNoise"
            scale="0.28"
            xChannelSelector="R"
            yChannelSelector="G"
            result="boiledCel"
          />

          {dapple ? (
            <>
              {/* 7. Animated dappled canopy shadow modulation clipped to character alpha */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency={`${dappleFreqX.toFixed(4)} ${dappleFreqY.toFixed(4)}`}
                numOctaves="2"
                seed={dappleSeed}
                result="dappleField"
              />
              <feColorMatrix
                in="dappleField"
                type="matrix"
                values="0 0 0 0 0.25  0 0 0 0 0.19  0 0 0 0 0.14  0.34 0 0 0 -0.05"
                result="dappleTint"
              />
              <feComposite in="dappleTint" in2="SourceAlpha" operator="in" result="dappleClipped" />
              <feBlend in="boiledCel" in2="dappleClipped" mode="multiply" />
            </>
          ) : (
            <feMerge>
              <feMergeNode in="boiledCel" />
            </feMerge>
          )}
        </filter>

        {/* Dedicated luminous watercolor cel-ink filter tuned specifically for Child Thakur:
          gentle watercolor pigment bloom on skin & cream cotton, warm golden rim, cool sky bounce,
          delicate warm-sepia interior pencil lines, and soft 8fps boil. */}
        <filter id="ghibli-balak-ink" x="-14%" y="-14%" width="128%" height="128%" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values={`${balakR} 0.014 0 0 0.010  0 ${balakG} 0 0 0.005  0 0 ${balakB} 0 -0.005  0 0 0 1 0`}
            result="warmed"
          />

          {/* Delicate monochrome warm-ochre watercolor pigment mottling on skin & cotton chadar */}
          <feTurbulence type="fractalNoise" baseFrequency="0.022 0.026" numOctaves="3" seed="23" result="wcMottle" />
          <feColorMatrix
            in="wcMottle"
            type="matrix"
            values="0.10 0 0 0 0.91  0.095 0 0 0 0.91  0.085 0 0 0 0.90  0 0 0 0 1"
            result="wcMottleTone"
          />
          <feComposite in="wcMottleTone" in2="SourceAlpha" operator="in" result="wcMottleClipped" />
          <feBlend in="warmed" in2="wcMottleClipped" mode="multiply" result="wcMottled" />

          {/* Subtle warm-ochre wet-edge pooling */}
          <feMorphology in="SourceAlpha" operator="erode" radius="1.8" result="erodedAlpha" />
          <feGaussianBlur in="erodedAlpha" stdDeviation="1.4" result="erodedSoft" />
          <feComposite in="SourceAlpha" in2="erodedSoft" operator="out" result="wetEdgeBand" />
          <feFlood floodColor="#8a6548" floodOpacity="0.13" result="wetEdgePigment" />
          <feComposite in="wetEdgePigment" in2="wetEdgeBand" operator="in" result="wetEdge" />
          <feBlend in="wcMottled" in2="wetEdge" mode="multiply" result="wcPainted" />

          {/* Luminous warm-gold sunward rim */}
          <feOffset in="SourceAlpha" dx={rimDx} dy="1.2" result="alphaShifted" />
          <feComposite in="SourceAlpha" in2="alphaShifted" operator="out" result="rimEdgeRaw" />
          <feGaussianBlur in="rimEdgeRaw" stdDeviation="0.75" result="rimEdgeSoft" />
          <feFlood floodColor="#fff1c4" floodOpacity="0.60" result="rimColor" />
          <feComposite in="rimColor" in2="rimEdgeSoft" operator="in" result="rimLight" />

          {/* Soft cool sky/leaf bounce on shadow side */}
          <feOffset in="SourceAlpha" dx={bounceDx} dy="-0.8" result="bounceShifted" />
          <feComposite in="SourceAlpha" in2="bounceShifted" operator="out" result="bounceEdgeRaw" />
          <feGaussianBlur in="bounceEdgeRaw" stdDeviation="1.3" result="bounceEdgeSoft" />
          <feFlood floodColor={bounceColor} floodOpacity="0.20" result="bounceColorFlood" />
          <feComposite in="bounceColorFlood" in2="bounceEdgeSoft" operator="in" result="bounceLight" />

          {/* Very delicate warm-ochre interior pencil crease detection */}
          <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="luma" />
          <feConvolveMatrix
            in="luma"
            order="3"
            kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
            divisor="1.65"
            bias="0"
            preserveAlpha="true"
            result="edgesRaw"
          />
          <feColorMatrix
            in="edgesRaw"
            type="matrix"
            values="0 0 0 0 0.34  0 0 0 0 0.21  0 0 0 0 0.13  0.42 0.42 0.42 0 -0.16"
            result="interiorEdges"
          />
          <feComposite in="interiorEdges" in2="SourceAlpha" operator="in" result="interiorInkClipped" />
          <feComponentTransfer in="interiorInkClipped" result="interiorInk">
            <feFuncA type="linear" slope="0.22" intercept="0" />
          </feComponentTransfer>

          {/* Fine warm-sepia outer silhouette line */}
          <feMorphology in="SourceAlpha" operator="dilate" radius="0.95" result="dilated" />
          <feGaussianBlur in="dilated" stdDeviation="0.3" result="softOutline" />
          <feFlood floodColor="#462a1b" floodOpacity="0.62" result="inkColor" />
          <feComposite in="inkColor" in2="softOutline" operator="in" result="outerInk" />

          <feMerge result="celPainted">
            <feMergeNode in="outerInk" />
            <feMergeNode in="wcPainted" />
            <feMergeNode in="bounceLight" />
            <feMergeNode in="interiorInk" />
            <feMergeNode in="rimLight" />
          </feMerge>

          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.024"
            numOctaves="2"
            seed={boilSeed}
            result="boilNoise"
          />
          <feDisplacementMap
            in="celPainted"
            in2="boilNoise"
            scale="0.52"
            xChannelSelector="R"
            yChannelSelector="G"
            result="boiledCel"
          />

          {dapple ? (
            <>
              <feTurbulence
                type="fractalNoise"
                baseFrequency={`${dappleFreqX.toFixed(4)} ${dappleFreqY.toFixed(4)}`}
                numOctaves="2"
                seed={dappleSeed}
                result="dappleField"
              />
              <feColorMatrix
                in="dappleField"
                type="matrix"
                values="0 0 0 0 0.32  0 0 0 0 0.24  0 0 0 0 0.16  0.22 0 0 0 -0.04"
                result="dappleTint"
              />
              <feComposite in="dappleTint" in2="SourceAlpha" operator="in" result="dappleClipped" />
              <feBlend in="boiledCel" in2="dappleClipped" mode="multiply" />
            </>
          ) : (
            <feMerge>
              <feMergeNode in="boiledCel" />
            </feMerge>
          )}
        </filter>

        {/* Phase 2 (Item 14): Dedicated watercolor + hand-inked filter for live interactive SVG props
          (jaba branch, picked flowers, clay kolsi, pebbles, bamboo trellis, tortoises) so IK hand contact
          stays 100% live while every prop reads as hand-painted watercolor on cold-press paper. */}
        <filter id="ghibli-prop-watercolor" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1.01 0.012 0 0 0.008  0 0.99 0 0 0.004  0 0 0.94 0 -0.006  0 0 0 1 0"
            result="propWarm"
          />
          <feTurbulence type="fractalNoise" baseFrequency="0.032 0.038" numOctaves="3" seed="31" result="propNoise" />
          <feColorMatrix
            in="propNoise"
            type="matrix"
            values="0.18 0 0 0 0.85  0.17 0 0 0 0.85  0.14 0 0 0 0.84  0 0 0 0 1"
            result="propWash"
          />
          <feComposite in="propWash" in2="SourceAlpha" operator="in" result="propWashClip" />
          <feBlend in="propWarm" in2="propWashClip" mode="multiply" result="propMottled" />

          <feMorphology in="SourceAlpha" operator="erode" radius="1.4" result="propErode" />
          <feGaussianBlur in="propErode" stdDeviation="1.1" result="propErodeSoft" />
          <feComposite in="SourceAlpha" in2="propErodeSoft" operator="out" result="propWetBand" />
          <feFlood floodColor="#69462f" floodOpacity="0.22" result="propWetPigment" />
          <feComposite in="propWetPigment" in2="propWetBand" operator="in" result="propWetEdge" />
          <feBlend in="propMottled" in2="propWetEdge" mode="multiply" result="propPainted" />

          <feMorphology in="SourceAlpha" operator="dilate" radius="0.9" result="propDil" />
          <feGaussianBlur in="propDil" stdDeviation="0.28" result="propSoftOut" />
          <feFlood floodColor="#3b2316" floodOpacity="0.68" result="propInkCol" />
          <feComposite in="propInkCol" in2="propSoftOut" operator="in" result="propOutInk" />

          <feMerge result="propMerged">
            <feMergeNode in="propOutInk" />
            <feMergeNode in="propPainted" />
          </feMerge>
          <feTurbulence type="fractalNoise" baseFrequency="0.032" numOctaves="2" seed={boilSeed} result="propBoil" />
          <feDisplacementMap in="propMerged" in2="propBoil" scale="0.65" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    );
  };

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
 * Unified Master Color Grade (Phase 1, Item 15):
 * Renders strictly above BOTH backgrounds and characters so nothing sits "on top" of the painting:
 *  1. Subtle unified color-harmony wash tying cels and plates into one film exposure.
 *  2. Warm sun bloom anchored to scene sun position.
 *  3. Gently stepping 8 fps cold-press watercolor paper tooth.
 *  4. Soft sepia-umber edge vignette.
 */
export const GhibliGrade: React.FC<{
  warmth?: number;
  vignette?: number;
  bloomAt?: [number, number];
  paperOpacity?: number;
}> = ({ warmth = 0.28, vignette = 0.34, bloomAt = [75, 22], paperOpacity = 0.24 }) => {
  const f = useCurrentFrame();
  // Subtle 8 fps micro-shift of cold-press paper grain like photographed cel animation on paper
  const step = Math.floor(Math.max(0, f) / 3) % 4;
  const grainScale = 1.03;
  const grainTx = (step % 2) * -10;
  const grainTy = Math.floor(step / 2) * -8;
  return (
    <>
      {/* Unified subtle warm-ochre film glaze over characters + plates */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(255,238,205,0.06) 0%, rgba(242,216,178,0.03) 55%, rgba(62,42,32,0.05) 100%)",
          mixBlendMode: "soft-light",
          pointerEvents: "none",
        }}
      />
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
            transform: `scale(${grainScale}) translate(${grainTx}px, ${grainTy}px)`,
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
};

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
