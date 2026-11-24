import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { BN_FONT, ensureBanglaFont } from "../../../cinematic/fonts";
import { CARD_PALETTE } from "../../../episode/SeriesCards";
import { GhibliGrade, GhibliPreload } from "../../GhibliStage";
import { GhibliNextEpisodeGlimpse, OUTRO_WITH_GLIMPSE_FRAMES } from "./GhibliScene98Ep4Glimpse";

const W = 1920;
const H = 1080;
const OUTRO_BASE = 704;

const PRELOAD = [
  "images/ghibli_ep03/card_outro_padma_sketch.png",
  "images/ghibli_ep03/glimpse_ep04_shivalinga_sketch.png",
  "images/ghibli_ep03/watercolor_paper_grain.png",
] as const;

const STAR = "M 0 -1 L 0.16 -0.16 L 1 0 L 0.16 0.16 L 0 1 L -0.16 0.16 L -1 0 L -0.16 -0.16 Z";
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeOutQuint = (t: number) => 1 - Math.pow(1 - clamp01(t), 5);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
const win = (f: number, a: number, b: number, ease: (t: number) => number = easeOutCubic) => ease((f - a) / (b - a));
const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const SPARKS = Array.from({ length: 22 }, (_, i) => ({
  x0: rnd(i * 3 + 1) * W,
  y0: rnd(i * 3 + 2) * H,
  size: 7 + rnd(i * 3 + 3) * 11,
  phase: rnd(i * 3 + 4) * Math.PI * 2,
  rise: 0.1 + rnd(i * 3 + 5) * 0.16,
}));

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  x0: rnd(i * 4 + 201) * W,
  y0: rnd(i * 4 + 202) * (H + 80),
  fall: 0.35 + rnd(i * 4 + 203) * 0.35,
  sway: 14 + rnd(i * 4 + 204) * 26,
  phase: rnd(i * 4 + 205) * Math.PI * 2,
  size: 0.8 + rnd(i * 4 + 206) * 0.6,
}));

const PETAL_TINTS = ["#FFD9A0", "#F3A6A0"];

const outroTitleStyle: React.CSSProperties = {
  fontFamily: BN_FONT,
  fontSize: 84,
  fontWeight: 800,
  lineHeight: 1.3,
  color: "#fffaf0",
  textShadow: "0 0 18px rgba(255,190,120,0.9), 0 0 42px rgba(255,190,120,0.9), 0 2px 4px rgba(0,0,0,0.5)",
  letterSpacing: 1,
  whiteSpace: "nowrap",
  textAlign: "center",
};

/**
 * Episode 3 (Ghibli Sketch Test) · Scene 99 — closing sunrise over the Padma river in hand-drawn
 * Ghibli watercolor-ink style, carrying the feathered Episode 4 Shivalinga glimpse on top.
 */
export const GhibliScene99Outro: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const frames = OUTRO_WITH_GLIMPSE_FRAMES;
  const k = frames / OUTRO_BASE;
  const at = (base: number) => base * k;
  const p = clamp01(f / frames);

  const cam = 1.07 - 0.06 * easeInOutSine(p);
  const camX = (1 - easeInOutSine(p)) * 32 - 16;

  const fadeIn = clamp01(f / at(64));
  const fadeOut = clamp01((frames - f) / at(40));
  const dark = 1 - Math.min(fadeIn, fadeOut);

  const lineP = win(f, at(120), at(170), easeOutQuint);
  const ruleP = win(f, at(150), at(200));

  const reflections = Array.from({ length: 9 }, (_, i) => ({ w: 220 - i * 20, y: 676 + i * 22 }));

  return (
    <AbsoluteFill style={{ background: CARD_PALETTE.night, overflow: "hidden" }}>
      <GhibliPreload files={PRELOAD} />

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <radialGradient id="ghibli-outro-glow">
            <stop offset="0" stopColor={CARD_PALETTE.goldSoft} stopOpacity={1} />
            <stop offset="0.4" stopColor={CARD_PALETTE.gold} stopOpacity={0.45} />
            <stop offset="1" stopColor={CARD_PALETTE.gold} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${W / 2 + camX} ${H / 2}) scale(${cam}) translate(${-W / 2} ${-H / 2})`}>
          <image
            href={staticFile("images/ghibli_ep03/card_outro_padma_sketch.png")}
            x={-80}
            y={-45}
            width={W + 160}
            height={H + 90}
            preserveAspectRatio="xMidYMid slice"
          />
          {reflections.map((r, i) => (
            <rect
              key={i}
              x={960 - r.w / 2 + Math.sin(f * 0.03 + i) * 10}
              y={r.y}
              width={r.w}
              height={4.5}
              rx={2.2}
              fill="#FFE7A0"
              opacity={0.34 + Math.sin(f * 0.05 + i) * 0.16}
            />
          ))}
        </g>
        {/* Drifting petals */}
        <g>
          {PETALS.map((pt, i) => {
            const y = ((pt.y0 + f * pt.fall) % (H + 80)) - 40;
            const x = pt.x0 + Math.sin(f * 0.025 + pt.phase) * pt.sway;
            const rot = pt.phase * 57.3 + Math.sin(f * 0.04 + pt.phase) * 25;
            return (
              <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${pt.size.toFixed(2)})`} opacity={0.68}>
                <ellipse rx={9} ry={5} fill={PETAL_TINTS[i % 2]} stroke="#5a3420" strokeWidth={0.6} strokeOpacity={0.45} />
              </g>
            );
          })}
        </g>
        {/* Sparkles */}
        <g>
          {SPARKS.map((s, i) => {
            const y = (((s.y0 - f * s.rise) % H) + H) % H;
            const x = s.x0 + Math.sin(f * 0.02 + s.phase) * 18;
            const kk = 0.5 + 0.5 * Math.sin(f * 0.07 + s.phase * 3);
            return (
              <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s.size * (0.6 + 0.4 * kk)).toFixed(2)})`} opacity={0.25 + 0.75 * kk}>
                <circle r={2.2} fill="url(#ghibli-outro-glow)" />
                <path d={STAR} fill={i % 2 ? CARD_PALETTE.goldSoft : CARD_PALETTE.gold} />
              </g>
            );
          })}
        </g>
      </svg>

      <GhibliGrade warmth={0.22} vignette={0.36} bloomAt={[50, 48]} paperOpacity={0.2} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            ...outroTitleStyle,
            opacity: lineP,
            transform: `translateY(${(1 - lineP) * 22}px) scale(${0.9 + 0.1 * lineP})`,
          }}
        >
          ছোটদের বালক ঠাকুরের গল্প
        </div>
        <div
          style={{
            marginTop: 26,
            width: 440,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${CARD_PALETTE.gold}, transparent)`,
            transform: `scaleX(${clamp01(ruleP)})`,
          }}
        />
      </div>

      <GhibliNextEpisodeGlimpse />

      <div style={{ position: "absolute", inset: 0, background: CARD_PALETTE.night, opacity: dark, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
