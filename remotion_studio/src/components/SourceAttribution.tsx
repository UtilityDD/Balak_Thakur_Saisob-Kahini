import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

/**
 * Source attribution "book page": aged parchment with a gold frame. Each reference line has its own place:
 *   1. the eyebrow "তথ্যসূত্র" (source)
 *   2. the book name on its own line
 *   3. the memoir credit on its own line
 *   4. the English reference, in two short lines
 * Motion (frames, 24 fps): card rises (0-24), gold rule draws (12-40), eyebrow fades (18-40),
 * book name wipes on (30-70), memoir credit fades up (64-92), English rises (92-120),
 * a light sweep crosses the page (120-156). Gold motes drift throughout.
 */
const BN_STACK = "'Baloo Da 2', 'Noto Sans Bengali', 'Nirmala UI', sans-serif";
const EN_STACK = "Georgia, 'Times New Roman', serif";
const INK = "#3b2412";
const GOLD = "#c9962b";

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const range = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: ease });

const MOTES = Array.from({ length: 14 }, (_, i) => ({
  x: 8 + ((i * 37) % 84),
  phase: (i * 0.73) % 6.28,
  speed: 0.6 + ((i * 0.31) % 0.7),
  size: 2 + (i % 3),
}));

const BOOK_NAME = "‘শ্রীশ্রীবালক ব্রহ্মচারীর শৈশব কাহিনী’";
const MEMOIR = "জননী শ্রীচারুশীলা দেবী ও ছোট মাসীমা শ্রীসরলা দেবীর স্মৃতিকথা অবলম্বনে";
const EN_LINE_1 = "Based on “Sri Sri Balak Brahmachari’s Childhood Stories”";
const EN_LINE_2 = "accounts of Mother Charushila Devi, Sarala Devi and eyewitnesses";

export const SourceAttribution: React.FC<{ variant?: "intro" | "outro"; center?: boolean }> = ({ variant = "intro", center = false }) => {
  const f = useCurrentFrame();
  const rise = range(f, 0, 24);
  const rule = interpolate(f, [12, 40], [0, 1], { ...clamp, easing: ease });
  const eyebrowOpacity = range(f, 18, 40);
  const nameWipe = interpolate(f, [30, 70], [0, 100], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const memoirOpacity = range(f, 64, 92);
  const memoirRise = (1 - range(f, 64, 92)) * 10;
  const enOpacity = range(f, 92, 120);
  const sweepX = interpolate(f, [120, 156], [-40, 140], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  return (
    <div
      style={{
        position: "absolute",
        ...(center ? { top: 0, bottom: 0, alignItems: "center" } : { bottom: variant === "intro" ? 150 : 160 }),
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: rise,
        transform: `translateY(${(1 - rise) * 24}px)`,
      }}
    >
      {MOTES.map((m, i) => {
        const y = (f * m.speed * 0.9 + m.phase * 40) % 260;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(f * 0.08 + m.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${m.x}%`,
              bottom: 40 + y,
              width: m.size,
              height: m.size,
              borderRadius: "50%",
              background: "#ffe39a",
              boxShadow: "0 0 8px 2px rgba(255,214,120,0.7)",
              opacity: tw * 0.7 * rise,
            }}
          />
        );
      })}

      <div
        style={{
          position: "relative",
          width: 1180,
          padding: "36px 72px 40px",
          borderRadius: 18,
          background: "radial-gradient(ellipse at 30% 20%, #fff8e6 0%, #f3e5bd 55%, #e6cf98 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.45), inset 0 0 60px rgba(120,80,20,0.25)",
          border: `2px solid ${GOLD}`,
          outline: "1px solid rgba(201,150,43,0.55)",
          outlineOffset: 7,
          textAlign: "center",
          color: INK,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${sweepX}%`,
            width: "18%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
            pointerEvents: "none",
          }}
        />

        <div style={{ fontFamily: BN_STACK, fontSize: 26, fontWeight: 700, letterSpacing: "0.12em", color: "#7a4a14", opacity: eyebrowOpacity }}>
          তথ্যসূত্র
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 26px" }}>
          <div style={{ width: 360 * rule, height: 2, background: GOLD, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -4,
                width: 9,
                height: 9,
                transform: "translateX(-50%) rotate(45deg)",
                background: GOLD,
                opacity: rule,
              }}
            />
          </div>
        </div>

        <div
          style={{
            fontFamily: BN_STACK,
            fontSize: 46,
            fontWeight: 700,
            lineHeight: 1.3,
            color: INK,
            clipPath: `inset(0 ${100 - nameWipe}% 0 0)`,
          }}
        >
          {BOOK_NAME}
        </div>

        <div style={{ width: 200, height: 1, background: GOLD, opacity: 0.6, margin: "18px auto 16px" }} />

        <div
          style={{
            fontFamily: BN_STACK,
            fontSize: 30,
            fontWeight: 500,
            lineHeight: 1.5,
            color: "#5a3a18",
            opacity: memoirOpacity,
            transform: `translateY(${memoirRise}px)`,
          }}
        >
          {MEMOIR}
        </div>

        <div
          style={{
            marginTop: 22,
            fontFamily: EN_STACK,
            fontSize: 22,
            fontStyle: "italic",
            lineHeight: 1.5,
            color: "#6a4a22",
            opacity: enOpacity,
          }}
        >
          <div>{EN_LINE_1}</div>
          <div>{EN_LINE_2}</div>
        </div>
      </div>
    </div>
  );
};
