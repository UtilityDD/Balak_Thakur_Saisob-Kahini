import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";

export interface EyeCoordinates {
  /** Left eye [x, y] in 1920x1080 canvas coords */
  left: [number, number];
  /** Right eye [x, y] in 1920x1080 canvas coords */
  right: [number, number];
  /** Width/radius of eyelid arc (default: 18px) */
  rx?: number;
  /** Eyelid arc curve depth (default: 5px) */
  ry?: number;
  /** Tone / shadow color (default: "#3a2216") */
  color?: string;
  /** Cadence in frames (default: 76 = 3.17s @ 24fps) */
  interval?: number;
}

/**
 * Living kinematic character plate for broadcast-level 2D anime acting.
 *
 * Implements organic chest/shoulder breathing kinematics, subtle lateral sway,
 * anchor-grounded weight shifting, and natural periodic anatomical eye-blinking
 * so character keyframe poses feel physically alive rather than frozen cutouts.
 */
export const KineticPlate: React.FC<{
  /** public/ path to the image, e.g. "images/s2_ep01/plate_3b_pagol_arms_raised.jpg" */
  src: string;
  style?: React.CSSProperties;
  /** Breathing cycle speed in Hz (default: 0.25 Hz = ~4-second human breath cycle) */
  breathSpeed?: number;
  /** Vertical breath amplitude in pixels (default: 3.2px) */
  breathAmp?: number;
  /** Lateral weight shift sway amplitude in pixels (default: 2.2px) */
  swayAmp?: number;
  /** Torso anchor point (default: "50% 80%") */
  transformOrigin?: string;
  /** Optional eye coordinates for organic procedural eyelid blinking */
  eyes?: EyeCoordinates;
}> = ({
  src,
  style,
  breathSpeed = 0.25,
  breathAmp = 3.2,
  swayAmp = 2.2,
  transformOrigin = "50% 80%",
  eyes,
}) => {
  const f = useCurrentFrame();

  // Natural asynchronous harmonic oscillation
  const breathY = Math.sin((f / 24) * Math.PI * breathSpeed * 2) * breathAmp;
  const breathScaleY = 1 + Math.sin((f / 24) * Math.PI * breathSpeed * 2) * 0.007;
  const swayX = Math.sin(f * 0.038) * swayAmp;
  const swayRot = Math.sin(f * 0.027) * 0.15; // Subtle 0.15 deg micro-tilt

  // Procedural anatomical eye blinking (3.17s cadence, 160ms eyelid envelope)
  const interval = eyes?.interval ?? 76;
  const cycle = (f + 23) % interval;
  const isBlink = Boolean(eyes && cycle >= interval - 4 && cycle < interval);
  const blinkStep = isBlink ? cycle - (interval - 4) : 0;
  const blinkOpacity = isBlink ? (blinkStep === 1 || blinkStep === 2 ? 0.95 : 0.65) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        transformOrigin,
        transform: `translate(${swayX}px, ${breathY}px) scaleY(${breathScaleY}) rotate(${swayRot}deg)`,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          width: 1920,
          height: 1080,
          objectFit: "cover",
          imageRendering: "auto",
          ...style,
        }}
      />
      {eyes && isBlink && (
        <svg
          width={1920}
          height={1080}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: blinkOpacity,
          }}
        >
          <defs>
            <filter id="kinetic-eyelid-blur">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>
          {[eyes.left, eyes.right].map(([ex, ey], idx) => {
            const rx = eyes.rx ?? 18;
            const ry = eyes.ry ?? 5;
            const col = eyes.color ?? "#3a2216";
            return (
              <path
                key={`blink-${idx}`}
                d={`M ${ex - rx} ${ey} Q ${ex} ${ey + ry} ${ex + rx} ${ey} Q ${ex} ${ey + ry * 0.4} ${ex - rx} ${ey}`}
                fill={col}
                stroke={col}
                strokeWidth={1.5}
                filter="url(#kinetic-eyelid-blur)"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};
