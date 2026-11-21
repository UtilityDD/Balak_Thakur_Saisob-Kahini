import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, EASE } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { CARD_PALETTE } from "../../episode/SeriesCards";

/** Series 2 Episode 1 Closing Dawn Card + Next Episode Teaser ("পর্ব দুই: মহা আবির্ভাব"). */
export const Scene99Outro: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const total = 950;
  const fadeIn = interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [total - 40, total], [1, 0], { extrapolateLeft: "clamp" });
  const teaserIn = EASE.out(clamp((f - 340) / 36));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #2a1428 0%, #7d3648 36%, #db7b42 70%, #f5be6b 100%)",
        opacity: Math.min(fadeIn, fadeOut),
        overflow: "hidden",
      }}
    >
      {/* Rising Sun & Padma Horizon */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="s2-outro-sun" cx="50%" cy="62%" r="40%">
            <stop offset="0%" stopColor="#fff6d6" stopOpacity={0.95} />
            <stop offset="45%" stopColor="#f7b963" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#f2964b" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={960} cy={650 - f * 0.04} r={420} fill="url(#s2-outro-sun)" />
        <circle cx={960} cy={650 - f * 0.04} r={74} fill="#fff3cc" opacity={0.92} />
        <rect x={0} y={660} width={1920} height={420} fill="#4a1e2e" opacity={0.62} />
        {/* Shimmering Padma reflection */}
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse
            key={i}
            cx={960 + Math.sin(f * 0.06 + i * 1.4) * (18 + i * 3)}
            cy={690 + i * 26}
            rx={110 - i * 5}
            ry={4.5}
            fill="#ffd996"
            opacity={0.45 - i * 0.025}
          />
        ))}
      </svg>

      {/* Series Title & Next Episode Teaser */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 140,
          fontFamily: BN_FONT,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: CARD_PALETTE.cream,
            textShadow: "0 4px 20px rgba(38, 12, 24, 0.78)",
          }}
        >
          পরম বিস্ময় বালক ঠাকুর
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 26,
            color: CARD_PALETTE.goldSoft,
            textShadow: "0 2px 10px rgba(38, 12, 24, 0.75)",
          }}
        >
          অধ্যাপক পি. কে. রায় (রায়দা) রচিত অবিস্মরণীয় গ্রন্থ অবলম্বনে
        </div>

        <div
          style={{
            marginTop: 150,
            padding: "28px 54px",
            borderRadius: 18,
            background: "rgba(38, 12, 24, 0.56)",
            border: "1.5px solid rgba(243, 210, 122, 0.55)",
            backdropFilter: "blur(6px)",
            opacity: teaserIn,
            transform: `translateY(${(1 - teaserIn) * 20}px)`,
          }}
        >
          <div style={{ fontSize: 26, color: CARD_PALETTE.goldSoft, fontWeight: 600 }}>
            আসছে পরের পর্ব • সিজন এক, পর্ব দুই
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 48,
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 2px 14px rgba(0, 0, 0, 0.6)",
            }}
          >
            মহা আবির্ভাব
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
