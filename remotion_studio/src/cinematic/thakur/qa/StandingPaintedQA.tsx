import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { StandingChild, standingChildJoints, type StandingChildProps } from "../../../episode05/rig/StandingChild";
import { ThakurDivine, ThakurGroundGlow } from "../ThakurDivine";
import { THAKUR_LIGHTS } from "../ThakurLight";
import { ThakurPaintedFaceAndHair } from "../ThakurPaintedOverlay";
import { ThakurGroundShadow, ThakurPaintedFilterDefs } from "../ThakurTexture";

/**
 * 05_Rework — Standing Balak Turnaround & Detail-at-Size QA Sheet (`StandingPaintedQA.tsx`).
 *
 * Top row (4 panels):
 *   1. BEFORE (Current Default Look, 3/4 Right)
 *   2. AFTER  (Painted Look, Front — yaw 0)
 *   3. AFTER  (Painted Look, 3/4 Right — yaw 0.85)
 *   4. AFTER  (Painted Look, 3/4 Left — flip, yaw 0.85)
 *
 * Bottom row (3 panels — Detail-at-Size check per PLAN.md Section 8):
 *   1. Wide Shot   (s = 0.46) — silhouette & noise check at distance
 *   2. Medium Shot (s = 1.08) — unified hands, cloth warmth & soft folds
 *   3. Close-Up    (s = 2.25) — painted iris, catchlights, closed-lip smile & hair wisps
 */

const light = THAKUR_LIGHTS.morning;

const PaintedStandingPanel: React.FC<{
  id: string;
  x0: number;
  y0: number;
  w: number;
  h: number;
  label: string;
  badgeBg?: string;
  painted: boolean;
  childProps: StandingChildProps;
  showShadow?: boolean;
}> = ({ id, x0, y0, w, h, label, badgeBg = "rgba(28,20,14,0.78)", painted, childProps, showShadow = true }) => {
  const j = standingChildJoints(childProps);
  const fid = `sqa-f-${id}`;
  const cid = `sqa-c-${id}`;
  const gid = `sqa-g-${id}`;
  const s = childProps.s ?? 1;
  const horizonY = y0 + h * 0.78;

  return (
    <g>
      <defs>
        <clipPath id={cid}>
          <rect x={x0 + 3} y={y0 + 3} width={w - 6} height={h - 6} rx={10} />
        </clipPath>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b9d6ea" />
          <stop offset="65%" stopColor="#f2e0be" />
          <stop offset="100%" stopColor="#e8cda0" />
        </linearGradient>
      </defs>
      {painted && <ThakurPaintedFilterDefs filterId={fid} light={light} f={childProps.f} />}

      <g clipPath={`url(#${cid})`}>
        {/* Soft Sharad morning watercolor backdrop */}
        <rect x={x0} y={y0} width={w} height={h * 0.80} fill={`url(#${gid})`} />
        <rect x={x0} y={horizonY} width={w} height={h * 0.24} fill="#d7be94" />
        {/* Soft distant foliage wash */}
        <ellipse cx={x0 + w * 0.18} cy={horizonY - 12} rx={w * 0.28} ry={46} fill="#7e9b74" opacity={0.32} />
        <ellipse cx={x0 + w * 0.84} cy={horizonY - 8} rx={w * 0.30} ry={52} fill="#6d8d67" opacity={0.28} />

        {/* Ground shadow + gentle warmth + divine halo (painted only) */}
        {showShadow && (
          <ThakurGroundShadow
            x={childProps.x}
            y={childProps.y + 2}
            rx={48 * s}
            ry={10 * s}
            light={light}
            opacity={painted ? 0.34 : 0.24}
          />
        )}
        {painted && showShadow && (
          <ThakurGroundGlow x={childProps.x} y={childProps.y + 4} rx={115 * s} ry={18 * s} level={0.45} />
        )}
        {painted && (
          <ThakurDivine
            cx={j.glowAnchor.x}
            cy={j.glowAnchor.y}
            r={66 * j.headScale}
            level={0.90}
            f={childProps.f}
            light={light}
          />
        )}

        {/* Character */}
        <g filter={painted ? `url(#${fid})` : undefined}>
          <StandingChild {...childProps} />
          {painted && (
            <ThakurPaintedFaceAndHair
              cx={j.head.x}
              cy={j.head.y}
              s={j.headScale}
              flip={childProps.flip}
              f={childProps.f}
              light={light}
              smile={0.65}
            />
          )}
        </g>

        {/* Panel label pill */}
        <rect x={x0 + 16} y={y0 + 14} width={Math.max(190, label.length * 10.2 + 28)} height={34} rx={17} fill={badgeBg} />
        <text x={x0 + 30} y={y0 + 37} fill="#fff4dd" fontSize={17} fontFamily="system-ui, sans-serif" fontWeight={600}>
          {label}
        </text>
      </g>
    </g>
  );
};

export const StandingPaintedQA: React.FC = () => {
  const f = 72;
  const topH = 560;
  const botY = 560;
  const botH = 520;
  const topW = 480;
  const botW = 640;

  const baseFace = { lookX: 0.12, smile: 0.90 };

  return (
    <AbsoluteFill style={{ background: "#1a1410" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* TOP ROW: Before vs After Turnaround */}
        <PaintedStandingPanel
          id="before"
          x0={0}
          y0={0}
          w={topW}
          h={topH}
          label="BEFORE · Default (3/4)"
          badgeBg="rgba(82,46,34,0.82)"
          painted={false}
          childProps={{
            x: topW * 0.5,
            y: 520,
            s: 0.88,
            f,
            lifeF: f,
            look: "default",
            pose: "standIdle",
            yaw: 0.85,
            expression: "serene",
            mouth: 0,
            face: baseFace,
          }}
        />
        <PaintedStandingPanel
          id="front"
          x0={topW}
          y0={0}
          w={topW}
          h={topH}
          label="AFTER · Painted Front"
          painted
          childProps={{
            x: topW + topW * 0.5,
            y: 520,
            s: 0.88,
            f,
            lifeF: f,
            look: "painted",
            pose: "standSerene",
            yaw: 0,
            expression: "serene",
            mouth: 0,
            face: { lookX: 0, smile: 0.92 },
          }}
        />
        <PaintedStandingPanel
          id="right"
          x0={topW * 2}
          y0={0}
          w={topW}
          h={topH}
          label="AFTER · Painted 3/4 Right"
          painted
          childProps={{
            x: topW * 2 + topW * 0.5,
            y: 520,
            s: 0.88,
            f,
            lifeF: f,
            look: "painted",
            pose: "standSerene",
            yaw: 0.65,
            expression: "serene",
            mouth: 0,
            face: baseFace,
          }}
        />
        <PaintedStandingPanel
          id="left"
          x0={topW * 3}
          y0={0}
          w={topW}
          h={topH}
          label="AFTER · Painted 3/4 Left"
          painted
          childProps={{
            x: topW * 3 + topW * 0.5,
            y: 520,
            s: 0.88,
            f,
            lifeF: f,
            look: "painted",
            pose: "standSerene",
            yaw: 0.65,
            flip: true,
            expression: "serene",
            mouth: 0,
            face: baseFace,
          }}
        />

        {/* BOTTOM ROW: Detail-at-Size (Wide / Medium / Close-Up) */}
        <PaintedStandingPanel
          id="wide"
          x0={0}
          y0={botY}
          w={botW}
          h={botH}
          label="DETAIL-AT-SIZE · Wide Shot (0.46x)"
          painted
          childProps={{
            x: botW * 0.5,
            y: 1005,
            s: 0.46,
            f,
            lifeF: f,
            look: "painted",
            pose: "standSerene",
            yaw: 0.65,
            expression: "serene",
            mouth: 0,
            face: baseFace,
          }}
        />
        <PaintedStandingPanel
          id="medium"
          x0={botW}
          y0={botY}
          w={botW}
          h={botH}
          label="DETAIL-AT-SIZE · Medium Shot (1.08x)"
          painted
          showShadow={false}
          childProps={{
            x: botW + botW * 0.5,
            y: 1170,
            s: 1.08,
            f,
            lifeF: f,
            look: "painted",
            pose: "standSerene",
            yaw: 0.55,
            expression: "serene",
            mouth: 0,
            face: baseFace,
          }}
        />
        <PaintedStandingPanel
          id="closeup"
          x0={botW * 2}
          y0={botY}
          w={botW}
          h={botH}
          label="DETAIL-AT-SIZE · Close-Up (2.25x)"
          painted
          showShadow={false}
          childProps={{
            x: botW * 2 + botW * 0.49,
            y: 1715,
            s: 2.25,
            f,
            lifeF: f,
            look: "painted",
            pose: "standSerene",
            yaw: 0.45,
            expression: "serene",
            mouth: 0,
            face: { lookX: 0.06, smile: 0.92 },
          }}
        />
      </svg>

      {/* Subtle unified cold-press paper finish */}
      <Img
        src={staticFile("images/ghibli_ep03/watercolor_paper_grain.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", opacity: 0.14, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};
