import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ensureBanglaFont } from "../cinematic/fonts";

/**
 * Shared series cards for the Balak Thakur children's series: the opening title card and the
 * closing dawn card. Every episode uses these, so intros and outros match in palette, motion and
 * typography. No deity, no human figure, and no white-gold divine backdrop.
 *
 * Timing is written for a reference length and scaled to the length each scene passes in.
 * All motion is eased and has no overshoot.
 */

const W = 1920;
const H = 1080;
const INTRO_BASE = 193;
const OUTRO_BASE = 704;
const HORIZON = 648;

/** One palette for every series card. */
export const CARD_PALETTE = {
  gold: "#E2B13C",
  goldSoft: "#F3D27A",
  /** Text cream. Not #FFF4D6, which production rule 3 reserves for Balak Thakur. */
  cream: "#FBEFD4",
  saffron: "#F2A03E",
  saffronDeep: "#E0703A",
  rose: "#C4526A",
  roseDeep: "#8E3556",
  roseInk: "#3E1226",
  night: "#1E0A14",
} as const;

import { BN_FONT as CARD_FONT } from "../cinematic/fonts";
const STAR = "M 0 -1 L 0.16 -0.16 L 1 0 L 0.16 0.16 L 0 1 L -0.16 0.16 L -1 0 L -0.16 -0.16 Z";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeOutQuint = (t: number) => 1 - Math.pow(1 - clamp01(t), 5);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;

/** Eased progress of frame f through the window [a, b]. */
const win = (f: number, a: number, b: number, ease: (t: number) => number = easeOutCubic) =>
  ease((f - a) / (b - a));

/** Deterministic pseudo-random value in [0, 1). */
const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Soft rolling ridge from a base line down to the bottom of the frame. */
const ridge = (base: number, amp: number, seed: number): string => {
  const n = 8;
  const step = (W + 400) / n;
  let d = `M -200 ${base}`;
  for (let i = 0; i < n; i++) {
    const x0 = -200 + i * step;
    const cy = base - amp * (0.35 + 0.65 * rnd(seed + i));
    const y1 = base - amp * 0.3 * rnd(seed + i + 50);
    d += ` Q ${(x0 + step / 2).toFixed(1)} ${cy.toFixed(1)} ${(x0 + step).toFixed(1)} ${y1.toFixed(1)}`;
  }
  return `${d} L ${W + 200} ${H + 80} L -200 ${H + 80} Z`;
};

const INTRO_FAR = ridge(700, 90, 11);
const INTRO_MID = ridge(800, 70, 31);
const INTRO_NEAR = ridge(930, 60, 51);
const OUTRO_FAR = ridge(HORIZON - 4, 46, 71);
const OUTRO_NEAR = ridge(1012, 38, 91);

const SPARKS = Array.from({ length: 24 }, (_, i) => ({
  x0: rnd(i * 3 + 1) * W,
  y0: rnd(i * 3 + 2) * H,
  size: 7 + rnd(i * 3 + 3) * 12,
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

/** Gradients shared by every card's artwork. Identical in each card, so duplicate ids are harmless. */
const SharedDefs: React.FC = () => (
  <radialGradient id="sc-glow">
    <stop offset="0" stopColor={CARD_PALETTE.goldSoft} stopOpacity={1} />
    <stop offset="0.4" stopColor={CARD_PALETTE.gold} stopOpacity={0.45} />
    <stop offset="1" stopColor={CARD_PALETTE.gold} stopOpacity={0} />
  </radialGradient>
);

/** Golden four-point sparkles that drift slowly upward and twinkle. */
const Sparkles: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {SPARKS.map((s, i) => {
      const y = (((s.y0 - f * s.rise) % H) + H) % H;
      const x = s.x0 + Math.sin(f * 0.02 + s.phase) * 18;
      const k = 0.5 + 0.5 * Math.sin(f * 0.07 + s.phase * 3);
      return (
        <g
          key={i}
          transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s.size * (0.6 + 0.4 * k)).toFixed(2)})`}
          opacity={0.25 + 0.75 * k}
        >
          <circle r={2.2} fill="url(#sc-glow)" />
          <path d={STAR} fill={i % 2 ? CARD_PALETTE.goldSoft : CARD_PALETTE.gold} />
        </g>
      );
    })}
  </g>
);

/** Small petals that drift down with a gentle sway. */
const Petals: React.FC<{ f: number }> = ({ f }) => {
  const cycle = H + 80;
  return (
    <g>
      {PETALS.map((p, i) => {
        const y = ((p.y0 + f * p.fall) % cycle) - 40;
        const x = p.x0 + Math.sin(f * 0.025 + p.phase) * p.sway;
        const rot = p.phase * 57.3 + Math.sin(f * 0.04 + p.phase) * 25;
        return (
          <g
            key={i}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${p.size.toFixed(2)})`}
            opacity={0.7}
          >
            <ellipse rx={9} ry={5} fill={PETAL_TINTS[i % 2]} />
          </g>
        );
      })}
    </g>
  );
};

const svgFill: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%" };
const cameraTransform = (cam: number) =>
  `translate(${W / 2} ${H / 2}) scale(${cam}) translate(${-W / 2} ${-H / 2})`;

/*
 * Typography matches Episode 1: the title card (Scene00Intro) and the closing card (Scene08Closing).
 * Intro: eyebrow 52/600 pale gold, title 132/800 cream with a pulsing gold glow and dark 3D shadow,
 * subtitle 76/700 gold with a dark 3D shadow. Outro: the dawn title 84/800 with the warm glow.
 */
const INTRO_BLOCK_TOP = 250;

const introEyebrowStyle: React.CSSProperties = {
  fontFamily: CARD_FONT,
  fontSize: 52,
  fontWeight: 600,
  lineHeight: 1.4,
  color: "#ffe7ae",
  letterSpacing: 1,
  whiteSpace: "nowrap",
  textAlign: "center",
};

const introTitleStyle = (glowPulse: number): React.CSSProperties => ({
  fontFamily: CARD_FONT,
  fontSize: 132,
  fontWeight: 800,
  lineHeight: 1.15,
  color: "#fff4d6",
  textShadow: `0 0 ${18 + glowPulse * 14}px rgba(255,200,110,0.65), 0 4px 0 #7a3a10, 0 8px 24px rgba(0,0,0,0.6)`,
  whiteSpace: "nowrap",
  textAlign: "center",
});

const introSubtitleStyle: React.CSSProperties = {
  fontFamily: CARD_FONT,
  fontSize: 76,
  fontWeight: 700,
  lineHeight: 1.4,
  color: "#ffd98a",
  textShadow: "0 3px 0 #5a2408, 0 6px 22px rgba(0,0,0,0.6)",
  whiteSpace: "nowrap",
  textAlign: "center",
};

const outroTitleStyle: React.CSSProperties = {
  fontFamily: CARD_FONT,
  fontSize: 84,
  fontWeight: 800,
  lineHeight: 1.3,
  color: "#fffaf0",
  textShadow: "0 0 18px rgba(255,190,120,0.9), 0 0 42px rgba(255,190,120,0.9), 0 2px 4px rgba(0,0,0,0.5)",
  letterSpacing: 1,
  whiteSpace: "nowrap",
  textAlign: "center",
};

const Rule: React.FC<{ progress: number; marginTop: number }> = ({ progress, marginTop }) => (
  <div
    style={{
      marginTop,
      width: 440,
      height: 3,
      borderRadius: 2,
      background: `linear-gradient(90deg, transparent, ${CARD_PALETTE.gold}, transparent)`,
      transform: `scaleX(${clamp01(progress)})`,
    }}
  />
);

/** Intro artwork: saffron-to-rose sky, a soft sun halo, three ridge depth layers. */
const IntroArt: React.FC<{ f: number; cam: number }> = ({ f, cam }) => {
  const drift = Math.sin(f * 0.01) * 16;
  const breathe = 0.42 + 0.08 * Math.sin(f * 0.03);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={svgFill}>
      <defs>
        <linearGradient id="sc-intro-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B8485E" />
          <stop offset="0.4" stopColor={CARD_PALETTE.saffronDeep} />
          <stop offset="0.78" stopColor={CARD_PALETTE.saffron} />
          <stop offset="1" stopColor={CARD_PALETTE.gold} />
        </linearGradient>
        <radialGradient id="sc-intro-halo">
          <stop offset="0" stopColor={CARD_PALETTE.goldSoft} stopOpacity={0.95} />
          <stop offset="0.4" stopColor={CARD_PALETTE.gold} stopOpacity={0.35} />
          <stop offset="1" stopColor={CARD_PALETTE.gold} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="sc-intro-plate">
          <stop offset="0" stopColor={CARD_PALETTE.roseInk} stopOpacity={0.55} />
          <stop offset="0.65" stopColor={CARD_PALETTE.roseInk} stopOpacity={0.25} />
          <stop offset="1" stopColor={CARD_PALETTE.roseInk} stopOpacity={0} />
        </radialGradient>
        <SharedDefs />
      </defs>
      <g transform={cameraTransform(cam)}>
        <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="url(#sc-intro-sky)" />
        <circle cx={960} cy={470} r={560} fill="url(#sc-intro-halo)" opacity={breathe} />
        <g transform={`translate(${drift * 0.3} 0)`}>
          <path d={INTRO_FAR} fill={CARD_PALETTE.rose} opacity={0.5} />
        </g>
        <g transform={`translate(${drift * 0.6} 0)`}>
          <path d={INTRO_MID} fill={CARD_PALETTE.roseDeep} opacity={0.7} />
        </g>
        <g transform={`translate(${drift} 0)`}>
          <path d={INTRO_NEAR} fill={CARD_PALETTE.roseInk} />
        </g>
      </g>
      <ellipse cx={960} cy={470} rx={900} ry={380} fill="url(#sc-intro-plate)" />
      <Petals f={f} />
      <Sparkles f={f} />
    </svg>
  );
};

/** Outro artwork: a soft dawn over the river, the sun rising, and a dolly pull-out. */
const OutroArt: React.FC<{ f: number; cam: number; camX: number; sunY: number }> = ({ f, cam, camX, sunY }) => {
  const reflections = Array.from({ length: 9 }, (_, i) => ({ w: 220 - i * 20, y: 672 + i * 22 }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={svgFill}>
      <defs>
        <linearGradient id="sc-outro-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E2448" />
          <stop offset="0.35" stopColor="#B8485E" />
          <stop offset="0.62" stopColor={CARD_PALETTE.saffronDeep} />
          <stop offset="0.84" stopColor={CARD_PALETTE.saffron} />
          <stop offset="1" stopColor="#F7CF6E" />
        </linearGradient>
        <linearGradient id="sc-outro-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7CF6E" />
          <stop offset="0.45" stopColor={CARD_PALETTE.gold} />
          <stop offset="1" stopColor="#9A6A24" />
        </linearGradient>
        <radialGradient id="sc-outro-glow">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity={0.9} />
          <stop offset="0.3" stopColor="#F7C35A" stopOpacity={0.45} />
          <stop offset="1" stopColor={CARD_PALETTE.saffron} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="sc-outro-sun">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="1" stopColor="#F5B94E" />
        </radialGradient>
        <SharedDefs />
      </defs>
      <g transform={cameraTransform(cam)}>
        <rect x={-200} y={-200} width={W + 400} height={HORIZON + 200} fill="url(#sc-outro-sky)" />
        <g transform={`translate(${camX * 0.1} 0)`}>
          <circle cx={960} cy={sunY} r={560} fill="url(#sc-outro-glow)" />
        </g>
        <g transform={`translate(${camX * 0.25} 0)`}>
          <circle cx={960} cy={sunY} r={104} fill="url(#sc-outro-sun)" />
        </g>
        <g transform={`translate(${camX * 0.3} 0)`}>
          <path d={OUTRO_FAR} fill={CARD_PALETTE.roseDeep} opacity={0.85} />
        </g>
        <g transform={`translate(${camX * 0.5} 0)`}>
          <rect x={-200} y={HORIZON} width={W + 400} height={H + 200 - HORIZON} fill="url(#sc-outro-river)" />
          {reflections.map((r, i) => (
            <rect
              key={i}
              x={960 - r.w / 2 + Math.sin(f * 0.03 + i) * 10}
              y={r.y}
              width={r.w}
              height={5}
              rx={2.5}
              fill="#FFE7A0"
              opacity={0.55 + Math.sin(f * 0.05 + i) * 0.2}
            />
          ))}
        </g>
        <g transform={`translate(${camX * 1.1} 0)`}>
          <path d={OUTRO_NEAR} fill={CARD_PALETTE.roseInk} />
        </g>
      </g>
      <Petals f={f} />
      <Sparkles f={f} />
    </svg>
  );
};

/**
 * Opening title card: eyebrow, bounce-in title, gold rule and subtitle over a saffron-to-rose
 * sky. The camera pushes in slowly from 1.00 to 1.03 and the card fades out at the end.
 */
export const SeriesIntro: React.FC<{ eyebrow: string; title: string; subtitle: string; frames?: number }> = ({
  eyebrow,
  title,
  subtitle,
  frames = INTRO_BASE,
}) => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const k = frames / INTRO_BASE;
  const at = (base: number) => base * k;

  const cam = 1 + 0.03 * easeInOutSine(f / frames);
  const fadeIn = clamp01(f / at(14));
  const fadeOut = clamp01((frames - f) / at(32));
  const dark = 1 - Math.min(fadeIn, fadeOut);

  const eyebrowP = win(f, at(16), at(42));
  const titleP = win(f, at(28), at(68), easeOutQuint);
  const ruleP = win(f, at(8), at(50));
  const subtitleP = win(f, at(60), at(92));
  const titlePulse = 0.5 + 0.5 * Math.sin(f * 0.08);

  return (
    <AbsoluteFill style={{ background: "#B8485E", overflow: "hidden" }}>
      <IntroArt f={f} cam={cam} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: INTRO_BLOCK_TOP,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ ...introEyebrowStyle, opacity: eyebrowP, transform: `translateY(${(1 - eyebrowP) * 12}px)` }}>
          {eyebrow}
        </div>
        <div
          style={{
            ...introTitleStyle(titlePulse),
            opacity: titleP,
            transform: `translateY(${(1 - titleP) * 22}px) scale(${0.9 + 0.1 * titleP})`,
          }}
        >
          {title}
        </div>
        <Rule progress={ruleP} marginTop={6} />
        <div
          style={{ ...introSubtitleStyle, marginTop: 14, opacity: subtitleP, transform: `translateY(${(1 - subtitleP) * 10}px)` }}
        >
          {subtitle}
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, background: CARD_PALETTE.night, opacity: dark, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/**
 * Closing dawn card: the sun rises over the river while the camera pulls out. The closing line
 * uses the same title treatment, rule and palette as SeriesIntro. Fades in from dark and out to dark.
 */
export const SeriesOutro: React.FC<{ closing: string; frames?: number }> = ({ closing, frames = OUTRO_BASE }) => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const k = frames / OUTRO_BASE;
  const at = (base: number) => base * k;
  const p = clamp01(f / frames);

  const cam = 1.06 - 0.06 * easeInOutSine(p);
  const camX = (1 - easeInOutSine(p)) * 36 - 18;
  const sunY = 700 - 180 * easeInOutSine(p);

  const fadeIn = clamp01(f / at(64));
  const fadeOut = clamp01((frames - f) / at(40));
  const dark = 1 - Math.min(fadeIn, fadeOut);

  const lineP = win(f, at(120), at(170), easeOutQuint);
  const ruleP = win(f, at(150), at(200));

  return (
    <AbsoluteFill style={{ background: CARD_PALETTE.night, overflow: "hidden" }}>
      <OutroArt f={f} cam={cam} camX={camX} sunY={sunY} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            ...outroTitleStyle,
            opacity: lineP,
            transform: `translateY(${(1 - lineP) * 22}px) scale(${0.9 + 0.1 * lineP})`,
          }}
        >
          {closing}
        </div>
        <Rule progress={ruleP} marginTop={26} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: CARD_PALETTE.night, opacity: dark, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
