import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { SeatedChild, seatedChildHands, type SeatedChildProps } from "../../../episode03/rig/SeatedChild";
import { ThakurDivine, ThakurGroundGlow } from "../ThakurDivine";
import { THAKUR_LIGHTS, type ThakurLightPreset } from "../ThakurLight";
import { ThakurGoldenHourAndSelfShadow, ThakurPaintedClothFolds, ThakurPaintedFaceAndHair } from "../ThakurPaintedOverlay";
import { ThakurGroundShadow, ThakurPaintedFilterDefs } from "../ThakurTexture";

/**
 * 05_Rework Module 8 — 7-Preset Lighting Contact Sheet (`LightQA.tsx`).
 * Displays seated Balak (`look="painted"`) across all 7 scene-light presets
 * (`dawn`, `morning`, `noon`, `afternoonGold`, `dusk`, `diya`, `moonlight`)
 * against matching time-of-day watercolor backdrops so the director can verify
 * rim light, cool bounce, white-cloth warmth, and halo readability in every light.
 */

const PRESET_TILES: Array<{
  key: ThakurLightPreset;
  skyTop: string;
  skyBot: string;
  floor: string;
  aura: number;
}> = [
  { key: "dawn", skyTop: "#a4a7cc", skyBot: "#f7c79a", floor: "#d4b48c", aura: 0.72 },
  { key: "morning", skyTop: "#bcd8eb", skyBot: "#f5e3be", floor: "#dec499", aura: 0.68 },
  { key: "noon", skyTop: "#a6cde6", skyBot: "#f2ebd8", floor: "#e2cca2", aura: 0.62 },
  { key: "afternoonGold", skyTop: "#c9c0b2", skyBot: "#f2c683", floor: "#d4a86e", aura: 0.82 },
  { key: "dusk", skyTop: "#4f567d", skyBot: "#d99268", floor: "#9e7c66", aura: 0.85 },
  { key: "diya", skyTop: "#241922", skyBot: "#573728", floor: "#694732", aura: 0.90 },
  { key: "moonlight", skyTop: "#1a263e", skyBot: "#486085", floor: "#4f5d73", aura: 0.88 },
];

export const LightQA: React.FC = () => {
  const tileW = 480;
  const tileH = 540;
  const f = 88;

  return (
    <AbsoluteFill style={{ background: "#1a1410" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {PRESET_TILES.map((t, idx) => {
          const light = THAKUR_LIGHTS[t.key];
          const col = idx % 4;
          const row = Math.floor(idx / 4);
          const x0 = col * tileW;
          const y0 = row * tileH;
          const cx = x0 + tileW * 0.5;
          const cy = y0 + tileH * 0.84;
          const s = 1.48;
          const fid = `lqa-f-${t.key}`;
          const cid = `lqa-c-${t.key}`;
          const gid = `lqa-g-${t.key}`;
          const props: SeatedChildProps = {
            x: cx,
            y: cy,
            s,
            f,
            lifeF: f,
            design: "plate",
            look: "painted",
            age: 6,
            pose: "bowHands",
            poseStart: 58,
            expression: "serene",
            mouth: 0,
            face: { lookX: 0.25, smile: 0.92 },
          };
          const h = seatedChildHands(props);
          return (
            <g key={t.key}>
              <defs>
                <clipPath id={cid}>
                  <rect x={x0 + 3} y={y0 + 3} width={tileW - 6} height={tileH - 6} rx={10} />
                </clipPath>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.skyTop} />
                  <stop offset="100%" stopColor={t.skyBot} />
                </linearGradient>
              </defs>
              <ThakurPaintedFilterDefs filterId={fid} light={light} f={f} />
              <g clipPath={`url(#${cid})`}>
                <rect x={x0} y={y0} width={tileW} height={tileH * 0.72} fill={`url(#${gid})`} />
                <rect x={x0} y={y0 + tileH * 0.72} width={tileW} height={tileH * 0.30} fill={t.floor} />
                <ThakurGroundShadow x={cx} y={cy + 3} rx={64 * s} ry={12 * s} light={light} opacity={0.36} />
                <ThakurGroundGlow x={cx} y={cy + 6} rx={140 * s} ry={22 * s} level={0.55 * t.aura} />
                <ThakurDivine cx={h.glowAnchor.cx} cy={h.glowAnchor.cy} r={h.glowAnchor.r * 1.1} level={t.aura} f={f} light={light} />
                <g filter={`url(#${fid})`}>
                  <SeatedChild {...props} />
                  <ThakurPaintedClothFolds x={cx} y={cy} s={s} f={f} light={light} />
                  <ThakurGoldenHourAndSelfShadow x={cx} y={cy} s={s} light={light} namaskarShadow={0.85} />
                  <ThakurPaintedFaceAndHair cx={h.glowAnchor.cx} cy={h.glowAnchor.cy} s={s} f={f} light={light} smile={0.66} />
                </g>
                {/* Preset label */}
                <rect x={x0 + 16} y={y0 + 16} width={178} height={34} rx={17} fill="rgba(26,18,14,0.74)" />
                <text x={x0 + 30} y={y0 + 39} fill="#fff4dd" fontSize={18} fontFamily="system-ui, sans-serif" fontWeight={600}>
                  {light.name}
                </text>
              </g>
            </g>
          );
        })}

        {/* 8th summary tile */}
        <g transform={`translate(${3 * tileW + 3}, ${tileH + 3})`}>
          <rect width={tileW - 6} height={tileH - 6} rx={10} fill="#241a14" stroke="#6b5038" strokeWidth={1.5} />
          <text x={32} y={76} fill="#ffdf96" fontSize={26} fontFamily="system-ui, sans-serif" fontWeight={700}>
            ThakurLight QA Sheet
          </text>
          <text x={32} y={118} fill="#eadbc2" fontSize={18} fontFamily="system-ui, sans-serif">
            05_Rework · Painted Look Library
          </text>
          <text x={32} y={170} fill="#d6c5ab" fontSize={16} fontFamily="system-ui, sans-serif">
            • 7 time-of-day scene presets
          </text>
          <text x={32} y={204} fill="#d6c5ab" fontSize={16} fontFamily="system-ui, sans-serif">
            • Blink-locked painted iris &amp; catchlights
          </text>
          <text x={32} y={238} fill="#d6c5ab" fontSize={16} fontFamily="system-ui, sans-serif">
            • Non-sticky gravity-draped shawl
          </text>
          <text x={32} y={272} fill="#d6c5ab" fontSize={16} fontFamily="system-ui, sans-serif">
            • Chiaroscuro halo readable on pale &amp; dark
          </text>
          <text x={32} y={306} fill="#d6c5ab" fontSize={16} fontFamily="system-ui, sans-serif">
            • Zero hand outline (MOT-19)
          </text>
          <text x={32} y={340} fill="#d6c5ab" fontSize={16} fontFamily="system-ui, sans-serif">
            • Default look byte-identical
          </text>
        </g>
      </svg>

      {/* Subtle unified cold-press paper finish across sheet */}
      <Img
        src={staticFile("images/ghibli_ep03/watercolor_paper_grain.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", opacity: 0.16, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};
