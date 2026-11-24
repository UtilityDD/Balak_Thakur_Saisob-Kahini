import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ThakurRefTraced } from "../ThakurRefTraced";

/**
 * Side-by-Side Comparison QA Sheet:
 *   Top-Left:     Original Reference Plate (`01_Thakur_Age06_Child_Ujanchar.jpg`)
 *   Top-Right:    Precision-Traced Animated SVG Rig (`ThakurRefTraced`)
 *   Bottom-Left:  2x Head Close-Up — Original Reference Plate
 *   Bottom-Right: 2x Head Close-Up — Precision-Traced Animated SVG Rig
 */

export const RefTracedQA: React.FC = () => {
  const f = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#1a1410" }}>
      {/* TOP-LEFT: Original Reference Plate */}
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 8,
          width: 948,
          height: 540,
          borderRadius: 10,
          overflow: "hidden",
          background: "#f4e5c8",
        }}
      >
        <Img
          src={staticFile("images/ref_qa/01_Thakur_Age06_Child_Ujanchar.jpg")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 14,
            padding: "6px 18px",
            borderRadius: 18,
            background: "rgba(38,24,16,0.82)",
            color: "#fff4dd",
            fontSize: 18,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          ORIGINAL REFERENCE PLATE (Plate 01)
        </div>
      </div>

      {/* TOP-RIGHT: Precision-Traced Animated SVG Rig */}
      <div
        style={{
          position: "absolute",
          left: 964,
          top: 8,
          width: 948,
          height: 540,
          borderRadius: 10,
          overflow: "hidden",
          background: "linear-gradient(180deg, #f8f0d8 0%, #f1dfb8 76%, #d9b887 76%, #cfa874 100%)",
        }}
      >
        <svg width={948} height={540} viewBox="0 0 948 540">
          <ThakurRefTraced x={474} y={506} s={0.51} f={f} halo={0.62} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 14,
            padding: "6px 18px",
            borderRadius: 18,
            background: "rgba(28,58,34,0.84)",
            color: "#fff4dd",
            fontSize: 18,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          TRACED ANIMATED SVG RIG (ThakurRefTraced)
        </div>
      </div>

      {/* BOTTOM-LEFT: 2x Head Close-Up Original Reference */}
      <div
        style={{
          position: "absolute",
          left: 8,
          top: 556,
          width: 948,
          height: 516,
          borderRadius: 10,
          overflow: "hidden",
          background: "#f4e5c8",
        }}
      >
        <Img
          src={staticFile("images/ref_qa/01_Thakur_Age06_Child_Ujanchar.jpg")}
          style={{
            position: "absolute",
            left: 474 - 963,
            top: 258 - 275,
            width: 1920,
            height: 1080,
            transform: "scale(1.22)",
            transformOrigin: "963px 275px",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 14,
            padding: "6px 18px",
            borderRadius: 18,
            background: "rgba(38,24,16,0.82)",
            color: "#fff4dd",
            fontSize: 18,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          CLOSE-UP · Original Reference
        </div>
      </div>

      {/* BOTTOM-RIGHT: 2x Head Close-Up Precision-Traced SVG Rig */}
      <div
        style={{
          position: "absolute",
          left: 964,
          top: 556,
          width: 948,
          height: 516,
          borderRadius: 10,
          overflow: "hidden",
          background: "linear-gradient(180deg, #f8f0d8 0%, #f1dfb8 100%)",
        }}
      >
        <svg width={948} height={516} viewBox="0 0 948 516">
          <ThakurRefTraced x={474} y={1143} s={1.22} f={f} halo={0.62} />
        </svg>
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 14,
            padding: "6px 18px",
            borderRadius: 18,
            background: "rgba(28,58,34,0.84)",
            color: "#fff4dd",
            fontSize: 18,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          CLOSE-UP · Traced Animated SVG Rig
        </div>
      </div>
    </AbsoluteFill>
  );
};
