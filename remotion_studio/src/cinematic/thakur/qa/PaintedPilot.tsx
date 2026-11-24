import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, hash, noise1 } from "../../core/anim";
import { BirulGlow } from "../../../episode03/rig/BirulGlow";
import { SeatedChild, seatedChildHands, type SeatedChildProps } from "../../../episode03/rig/SeatedChild";
import { pilotTwoGesturesAt, thakurLivingTransform } from "../ThakurActing";
import { keyBeatRiseHold, ThakurDivine, ThakurGroundGlow } from "../ThakurDivine";
import { THAKUR_LIGHTS } from "../ThakurLight";
import { ThakurGoldenHourAndSelfShadow, ThakurPaintedClothFolds, ThakurPaintedFaceAndHair } from "../ThakurPaintedOverlay";
import { ThakurGroundShadow, ThakurPaintedFilterDefs } from "../ThakurTexture";

/**
 * 05_Rework Side-by-Side 2-Gesture Pilot Comparison (`PaintedPilot.tsx`, Module 9).
 *
 * 10 seconds (240 frames @ 24 fps, 1920x1080):
 *   LEFT  = BEFORE (Current Look: unmodified SeatedChild design="plate" + BirulGlow)
 *   RIGHT = AFTER  (Painted Look Library: src/cinematic/thakur/* with ThakurLight.afternoonGold,
 *                   painted face/hair/cloth, wind-reactive wisps & trailing chadar, chiaroscuro-backed
 *                   painted divine aura rising once on Namaskar, zero hand outline per MOT-19,
 *                   2-layer ground shadow, eye-lead anticipation, curved hand arcs & living breathing)
 *
 * Showcases two complete gestures:
 *   1. Frames 0..124   — Eye-Lead Look Up & Serene Namaskar (Devotion + Divine Aura Rise)
 *   2. Frames 124..240 — Compassionate Open-Palm Offering / Blessing Reach & Graceful Settle
 */

export const PAINTED_PILOT_FRAMES = 240;

const LIGHT = THAKUR_LIGHTS.afternoonGold;
const BAL_Y = 875;
const BAL_S = 2.05;
const LEFT_X = 465;
const RIGHT_X = 1425;

const BackdropHalf: React.FC<{ clipId: string; x0: number; paintedPolish?: boolean; f: number }> = ({ clipId, x0, paintedPolish = false, f }) => {
  const leafSway = Math.sin(f * 0.045) * 4.5 + noise1(f * 0.025, 19) * 2.5;
  return (
    <g clipPath={`url(#${clipId})`}>
      {/* Warm afternoon-gold Ujanchar courtyard backdrop */}
      <rect x={x0} y={0} width={960} height={1080} fill="#e8cfa8" />
      {/* Cinema optical DOF blur + aerial perspective on the painted RIGHT half so Balak pops forward */}
      <g filter={paintedPolish ? "url(#pilot-bg-dof)" : undefined} opacity={paintedPolish ? 0.86 : 0.78}>
        <image
          href={staticFile("images/ghibli_ep05/mud_house_main_sketch.png")}
          x={x0 - 110}
          y={90}
          width={1220}
          height={760}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
      {/* Seamless earth floor (offset crop on right half to remove center mirror seam) */}
      <image
        href={staticFile("images/ghibli_ep05/yard_earth_floor_sketch.png")}
        x={paintedPolish ? x0 - 290 : x0 - 80}
        y={735}
        width={paintedPolish ? 1420 : 1120}
        height={410}
        preserveAspectRatio="none"
      />
      {/* Delicate hand-painted courtyard grass tufts & fallen petals on the painted RIGHT half */}
      {paintedPolish && (
        <g pointerEvents="none" opacity={0.72}>
          {[
            { gx: x0 + 145, gy: 882, sc: 1.0 },
            { gx: x0 + 210, gy: 918, sc: 0.82 },
            { gx: x0 + 755, gy: 874, sc: 0.95 },
            { gx: x0 + 825, gy: 912, sc: 1.1 },
          ].map((t, i) => (
            <g key={i} transform={`translate(${t.gx}, ${t.gy}) scale(${t.sc}) rotate(${(leafSway * 0.35 * (i % 2 ? 1 : -1)).toFixed(1)})`}>
              <path d="M 0 0 Q -5 -12 -11 -18 M 0 0 Q 1 -15 3 -22 M 0 0 Q 7 -11 12 -16" fill="none" stroke="#5d6e3b" strokeWidth={2.0} strokeLinecap="round" />
            </g>
          ))}
          {[
            { px: x0 + 310, py: 902 },
            { px: x0 + 625, py: 896 },
            { px: x0 + 545, py: 932 },
          ].map((p, i) => (
            <ellipse key={i} cx={p.px} cy={p.py} rx={5.5} ry={2.4} fill="#fff5df" stroke="#d48332" strokeWidth={0.7} opacity={0.8} transform={`rotate(${i * 35} ${p.px} ${p.py})`} />
          ))}
        </g>
      )}
      {/* Soft afternoon-gold depth veil separating character from mud wall */}
      <rect
        x={x0}
        y={0}
        width={960}
        height={1080}
        fill={paintedPolish ? "url(#pilot-gold-veil)" : "rgba(255,232,190,0.16)"}
        style={{ mixBlendMode: "screen" }}
      />
    </g>
  );
};

export const PaintedPilot: React.FC = () => {
  const f = useCurrentFrame();

  const beforeBeat = pilotTwoGesturesAt(f, "before");
  const afterBeat = pilotTwoGesturesAt(f, "after");

  const beforeProps: SeatedChildProps = {
    x: LEFT_X,
    y: BAL_Y,
    s: BAL_S,
    f,
    lifeF: f,
    design: "plate",
    age: 6,
    ...beforeBeat.poseProps,
  };

  const afterProps: SeatedChildProps = {
    x: RIGHT_X,
    y: BAL_Y,
    s: BAL_S,
    f,
    lifeF: f,
    design: "plate",
    age: 6,
    ...afterBeat.poseProps,
  };

  const beforeHands = seatedChildHands(beforeProps);
  const afterHands = seatedChildHands(afterProps);

  // Divine aura rises ONCE on Namaskar (frame 64) and holds serenely — never pulses with breathing (BAL-06)
  const auraLevel = keyBeatRiseHold(f, 64, 28, 0.44, 0.92);

  const living = thakurLivingTransform({
    x: RIGHT_X,
    y: BAL_Y,
    f,
    facing: 1,
    leanBoost: afterBeat.leanBoost,
    seed: 19,
  });

  // Subtle 8 fps cold-press paper shift for the painted right half
  const pStep = Math.floor(f / 3) % 4;
  const grainTx = (pStep % 2) * -8;
  const grainTy = Math.floor(pStep / 2) * -6;

  return (
    <AbsoluteFill style={{ background: "#1b1410", overflow: "hidden" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="clip-left">
            <rect x={0} y={0} width={960} height={1080} />
          </clipPath>
          <clipPath id="clip-right">
            <rect x={960} y={0} width={960} height={1080} />
          </clipPath>
          <linearGradient id="pilot-gold-veil" x1="0.9" y1="0" x2="0.1" y2="1">
            <stop offset="0%" stopColor="#ffe7b5" stopOpacity={0.28} />
            <stop offset="55%" stopColor="#ffd796" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#f5c984" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="pilot-sun-shaft" x1="0.8" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#ffefc4" stopOpacity={0.44} />
            <stop offset="60%" stopColor="#ffe2a6" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#ffe2a6" stopOpacity={0} />
          </linearGradient>
          <filter id="pilot-bg-dof" x="-6%" y="-6%" width="112%" height="112%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
          <filter id="pilot-fg-bokeh" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="3.6" />
          </filter>
        </defs>

        <ThakurPaintedFilterDefs filterId="thakur-painted-pilot" light={LIGHT} f={f} />

        {/* ==================== LEFT HALF: BEFORE (Current Vector Look) ==================== */}
        <BackdropHalf clipId="clip-left" x0={0} f={f} />
        <g clipPath="url(#clip-left)">
          <BirulGlow
            cx={beforeHands.glowAnchor.cx}
            cy={beforeHands.glowAnchor.cy}
            r={beforeHands.glowAnchor.r}
            glow={auraLevel}
            f={f}
          />
          <SeatedChild {...beforeProps} />
        </g>

        {/* ==================== RIGHT HALF: AFTER (Painted Look Library) ==================== */}
        <BackdropHalf clipId="clip-right" x0={960} paintedPolish f={f} />
        <g clipPath="url(#clip-right)">
          {/* 2-layer directional cast + dark contact shadow */}
          <ThakurGroundShadow x={RIGHT_X} y={BAL_Y + 4} rx={68 * BAL_S} ry={13 * BAL_S} light={LIGHT} opacity={0.36} />
          {/* Painted ground radiance */}
          <ThakurGroundGlow x={RIGHT_X} y={BAL_Y + 8} rx={155 * BAL_S} ry={24 * BAL_S} level={0.45 + 0.45 * auraLevel} />
          {/* Painted warm-white chiaroscuro-backed divine halo rising once on Namaskar */}
          <ThakurDivine
            cx={afterHands.glowAnchor.cx}
            cy={afterHands.glowAnchor.cy}
            r={afterHands.glowAnchor.r * 1.12}
            level={auraLevel}
            f={f}
            light={LIGHT}
          />

          {/* Exact perfected SeatedChild anatomy with opt-in look="painted" (non-sticky rounded-hem shawl + warm/cool cloth folds)
              + watercolor finish (8fps fine boil, zero hand outline) + warm/cool golden-hour split & self-shadowing + painted face/eyes/hair */}
          <g filter="url(#thakur-painted-pilot)" transform={living.transform}>
            <SeatedChild {...afterProps} look="painted" />
            <ThakurPaintedClothFolds x={RIGHT_X} y={BAL_Y} s={BAL_S} f={f} light={LIGHT} />
            <ThakurGoldenHourAndSelfShadow
              x={RIGHT_X}
              y={BAL_Y}
              s={BAL_S}
              light={LIGHT}
              namaskarShadow={f >= 60 && f <= 130 ? EASE.inOut(clamp(Math.min((f - 60) / 14, (130 - f) / 12))) : 0}
            />
            <ThakurPaintedFaceAndHair
              cx={afterHands.glowAnchor.cx}
              cy={afterHands.glowAnchor.cy}
              s={BAL_S}
              f={f}
              light={LIGHT}
              smile={afterBeat.smileWarmth}
            />
          </g>

          {/* Soft foreground afternoon sun shafts falling OVER Balak + drifting golden pollen motes + wind-blown autumn leaf */}
          <g opacity={0.26} style={{ mixBlendMode: "screen" }} pointerEvents="none">
            <polygon points="1540,-40 1760,-40 1380,1120 1160,1120" fill="url(#pilot-sun-shaft)" />
            <polygon points="1780,-40 1940,-40 1620,1120 1460,1120" fill="url(#pilot-sun-shaft)" opacity={0.7} />
          </g>
          <g style={{ mixBlendMode: "screen" }} pointerEvents="none">
            {Array.from({ length: 14 }, (_, i) => {
              const mx = 1000 + ((hash(i * 4.3 + 7) * 900 + f * (0.4 + hash(i) * 0.35)) % 900);
              const my = 180 + hash(i * 7.1 + 3) * 680 + Math.sin(f * 0.035 + i * 1.8) * 18;
              const pulse = 0.28 + 0.52 * Math.pow(0.5 + 0.5 * Math.sin(f * 0.05 + i * 2.1), 2);
              return <circle key={i} cx={mx} cy={my} r={1.8 + (i % 3) * 0.8} fill="#fff5d4" opacity={pulse} />;
            })}
          </g>
          {/* Single slow breeze-blown autumn leaf drifting across the right sunlit courtyard */}
          {(() => {
            const lx = 1940 - f * 4.2;
            const ly = 320 + f * 1.45 + Math.sin(f * 0.09) * 28;
            const rot = -25 + Math.sin(f * 0.12) * 32;
            return (
              <g transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) rotate(${rot.toFixed(1)})`} opacity={0.82} pointerEvents="none">
                <path d="M -12 0 Q 0 -7 13 0 Q 0 7 -12 0 Z" fill="#c9843b" stroke="#5a361a" strokeWidth={0.9} />
                <line x1={-11} y1={0} x2={11} y2={0} stroke="#6e421e" strokeWidth={0.7} />
              </g>
            );
          })()}
          {/* Out-of-focus swaying foreground mango-leaf silhouette at top-right corner for cinema depth */}
          <g
            transform={`translate(1930, -25) rotate(${(Math.sin(f * 0.032) * 3.5).toFixed(2)})`}
            filter="url(#pilot-fg-bokeh)"
            opacity={0.62}
            pointerEvents="none"
          >
            <path d="M 10 10 Q -85 45 -195 95" stroke="#3b2618" strokeWidth={10} fill="none" strokeLinecap="round" />
            <ellipse cx={-68} cy={55} rx={36} ry={13} fill="#466e32" transform="rotate(-24 -68 55)" />
            <ellipse cx={-124} cy={78} rx={34} ry={12} fill="#3d632b" transform="rotate(18 -124 78)" />
            <ellipse cx={-172} cy={96} rx={28} ry={10} fill="#507a39" transform="rotate(-12 -172 96)" />
          </g>
        </g>

        {/* Clean center split divider */}
        <line x1={960} y1={0} x2={960} y2={1080} stroke="#fff4dc" strokeWidth={3} opacity={0.85} />
      </svg>

      {/* Unified cold-press watercolor paper tooth over RIGHT (Painted) half only */}
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 0,
          width: 960,
          height: 1080,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <Img
          src={staticFile("images/ghibli_ep03/watercolor_paper_grain.png")}
          style={{
            width: "104%",
            height: "104%",
            objectFit: "cover",
            transform: `translate(${grainTx}px, ${grainTy}px)`,
            mixBlendMode: "multiply",
            opacity: 0.22,
          }}
        />
      </div>

      {/* Minimal top comparison badges */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 36,
          padding: "10px 22px",
          borderRadius: 999,
          background: "rgba(38, 25, 18, 0.78)",
          border: "1px solid rgba(255, 232, 190, 0.35)",
          color: "#f7ead5",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        BEFORE · Current Vector Look
      </div>
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 36,
          padding: "10px 22px",
          borderRadius: 999,
          background: "rgba(88, 52, 24, 0.86)",
          border: "1px solid rgba(255, 224, 150, 0.65)",
          color: "#fff5dc",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        AFTER · Painted Look Library (05_Rework)
      </div>

      {/* Bottom centered live gesture beat caption */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 28px",
          borderRadius: 999,
          background: "rgba(32, 20, 14, 0.82)",
          border: "1px solid rgba(255, 226, 165, 0.45)",
          color: "#fff4dd",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: 22,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {afterBeat.label}
      </div>
    </AbsoluteFill>
  );
};
