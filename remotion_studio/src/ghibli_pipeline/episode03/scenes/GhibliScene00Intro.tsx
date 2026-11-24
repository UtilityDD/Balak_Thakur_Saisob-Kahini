import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, track } from "../../../cinematic/core/anim";
import { DivineCatchlight, Motes } from "../../../cinematic/divine/Divine";
import { BN_FONT, ensureBanglaFont } from "../../../cinematic/fonts";
import { GhibliGrade, GhibliPreload } from "../../GhibliStage";

/**
 * Episode 3 (Ghibli Sketch Test) · Scene 00 — Title card.
 * Hand-drawn Ghibli watercolor-ink Padma dawn/twilight river backdrop with gentle camera drift,
 * live diya flickers, drifting motes, and exact Episode 3 Bengali typography & reveal timings.
 */

const L1 = 3;
const L2 = 79;
const L3 = 108;

const PRELOAD = [
  "images/ghibli_ep03/card_intro_bg_sketch.png",
  "images/ghibli_ep03/watercolor_paper_grain.png",
] as const;

const Word: React.FC<{ f: number; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, at, children, style }) => {
  const t = clamp((f - at) / 14);
  const e = EASE.out(t);
  return (
    <span
      style={{
        display: "inline-block",
        opacity: e,
        transform: `translateY(${(1 - e) * 26}px) scale(${0.92 + e * 0.08})`,
        filter: `blur(${(1 - e) * 8}px)`,
        marginRight: "0.28em",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const GhibliScene00Intro: React.FC<{ episodeLabel?: string; episodeName?: string }> = ({
  episodeLabel = "পর্ব তিন",
  episodeName = "পাঁচ বছরের মুখে অমূল্য তত্ত্ব",
}) => {
  ensureBanglaFont();
  const f = useCurrentFrame();

  const camScale = track(f, [
    [0, 1.02],
    [176, 1.11, "inOut"],
  ]);
  const camX = track(f, [
    [0, 16],
    [176, -16, "inOut"],
  ]);
  const camY = track(f, [
    [0, 8],
    [176, -6, "inOut"],
  ]);

  const fadeIn = clamp(f / 12);
  const fadeOut = clamp((176 - f) / 14);
  const out = fadeOut;
  const starIn = clamp((f - 40) / 30);
  const titleGlow = 0.5 + 0.5 * Math.sin(f * 0.08);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#140c18", overflow: "hidden", opacity: Math.min(fadeIn, fadeOut) }}>
      <GhibliPreload files={PRELOAD} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 50%",
          transform: `translate(${camX.toFixed(2)}px, ${camY.toFixed(2)}px) scale(${camScale.toFixed(4)})`,
        }}
      >
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
          <image
            href={staticFile("images/ghibli_ep03/card_intro_bg_sketch.png")}
            x={-60}
            y={-34}
            width={2040}
            height={1148}
            preserveAspectRatio="xMidYMid slice"
          />
        </svg>
      </div>

      <GhibliGrade warmth={0.24} vignette={0.42} bloomAt={[50, 46]} paperOpacity={0.22} />

      {/* Title block */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 250,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: BN_FONT,
          opacity: out,
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -150,
            width: 1700,
            height: 740,
            background: "radial-gradient(ellipse at 50% 48%, rgba(16,8,18,0.52) 0%, rgba(16,8,18,0.18) 46%, rgba(16,8,18,0) 68%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", fontSize: 52, fontWeight: 600, color: "#ffe7ae", letterSpacing: 1 }}>
          <Word f={f} at={L1}>ছোটদের</Word>
        </div>
        <div
          style={{
            position: "relative",
            fontSize: 132,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#fff4d6",
            textShadow: `0 0 ${18 + titleGlow * 14}px rgba(255,200,110,0.65), 0 4px 0 #7a3a10, 0 8px 24px rgba(0,0,0,0.6)`,
          }}
        >
          <Word f={f} at={L1 + 8}>বালক</Word>
          <Word f={f} at={L1 + 18}>
            <span style={{ position: "relative" }}>
              ঠাকুরের
              <svg width={80} height={80} viewBox="-40 -40 80 80" style={{ position: "absolute", left: "78%", top: -22, opacity: starIn, overflow: "visible" }}>
                <circle r={34} fill="#fff4d6" opacity={0.25 + 0.1 * Math.sin(f * 0.1)} style={{ filter: "blur(8px)" }} />
                <DivineCatchlight x={0} y={0} r={16 + starIn * 6} f={f} />
              </svg>
            </span>
          </Word>
          <Word f={f} at={L1 + 30}>গল্প</Word>
        </div>
        <svg width={620} height={40} viewBox="-310 -20 620 40" style={{ position: "relative", margin: "6px 0 10px", opacity: clamp((f - 50) / 16) }}>
          <line x1={-300 * clamp((f - 50) / 22)} y1={0} x2={300 * clamp((f - 50) / 22)} y2={0} stroke="#e8b45a" strokeWidth={2} />
          <circle r={7} fill="#ffcf87" />
          <circle cx={-24} r={3.5} fill="#ffcf87" />
          <circle cx={24} r={3.5} fill="#ffcf87" />
        </svg>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 28 }}>
          <Word f={f} at={L2}>
            <span
              style={{
                display: "inline-block",
                fontSize: 46,
                fontWeight: 700,
                color: "#3a1606",
                background: "linear-gradient(180deg, #ffe08a, #e8a43a)",
                borderRadius: 40,
                padding: "2px 30px",
                boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
              }}
            >
              {episodeLabel}
            </span>
          </Word>
        </div>
        <div style={{ position: "relative", marginTop: 14, fontSize: 76, fontWeight: 700, color: "#ffd98a", textShadow: "0 3px 0 #5a2408, 0 6px 22px rgba(0,0,0,0.6)" }}>
          {episodeName.split(" ").map((word, i) => (
            <Word key={i} f={f} at={L3 + i * 7}>{word}</Word>
          ))}
        </div>
      </div>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: out * 0.8, mixBlendMode: "screen", pointerEvents: "none" }}>
        <Motes f={f} x={960} y={560} n={14} spread={700} rise={-260} seed={7} o={0.7} />
      </svg>
    </div>
  );
};
