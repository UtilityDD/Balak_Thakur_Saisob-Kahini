import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, track } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { CARD_PALETTE } from "../../episode/SeriesCards";

/**
 * Series 2 Episode 1 Closing Dawn Card + Next Episode Teaser ("পর্ব দুই: মহা আবির্ভাব").
 * Upgraded with the Studio Ghibli painted golden sunrise lotus pond (`plate_99_sunrise_lotus.jpg`) + 2.5D parallax.
 */
export const Scene99Outro: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const total = 784;
  const fadeIn = interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(f, [total - 40, total], [1, 0], { extrapolateLeft: "clamp" });
  const teaserIn = EASE.out(clamp((f - 280) / 36));

  const camScale = track(f, [[0, 1.03], [total, 1.14]]);
  const camX = track(f, [[0, -24], [total, 24]]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a0d18",
        opacity: Math.min(fadeIn, fadeOut),
        overflow: "hidden",
      }}
    >
      {/* Painted Studio Ghibli Golden Sunrise Lotus Pond with slow push-in */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${camX}px, 0px) scale(${camScale})`,
          transformOrigin: "50% 55%",
        }}
      >
        <Img
          src={staticFile("images/s2_ep01/4k/plate_99_sunrise_lotus.jpg")}
          style={{ width: 1920, height: 1080, objectFit: "cover" }}
        />
      </div>

      {/* Warm readable gradient wash behind typography */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(28,10,20,0.62) 0%, rgba(42,16,24,0.28) 48%, rgba(24,10,16,0.58) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Series Title & Next Episode Teaser */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 130,
          fontFamily: BN_FONT,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 66,
            fontWeight: 700,
            color: CARD_PALETTE.cream,
            textShadow: "0 4px 22px rgba(28, 8, 18, 0.88)",
          }}
        >
          পরম বিস্ময় বালক ঠাকুর
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 27,
            color: CARD_PALETTE.goldSoft,
            textShadow: "0 2px 12px rgba(28, 8, 18, 0.85)",
          }}
        >
          অধ্যাপক পি. কে. রায় (রায়দা) রচিত অবিস্মরণীয় গ্রন্থ অবলম্বনে
        </div>

        <div
          style={{
            marginTop: 140,
            padding: "28px 56px",
            borderRadius: 18,
            background: "rgba(32, 10, 20, 0.68)",
            border: "1.5px solid rgba(243, 210, 122, 0.62)",
            backdropFilter: "blur(8px)",
            opacity: teaserIn,
            transform: `translateY(${(1 - teaserIn) * 20}px)`,
            boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ fontSize: 26, color: CARD_PALETTE.goldSoft, fontWeight: 600 }}>
            আসছে পরের পর্ব • সিজন এক, পর্ব দুই
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 50,
              fontWeight: 700,
              color: "#ffffff",
              textShadow: "0 2px 14px rgba(0, 0, 0, 0.7)",
            }}
          >
            মহা আবির্ভাব
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
