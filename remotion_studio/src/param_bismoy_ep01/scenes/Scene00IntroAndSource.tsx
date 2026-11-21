import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, EASE } from "../../cinematic/core/anim";
import { Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { Motes } from "../../cinematic/divine/Divine";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { Bokeh, Diya, GlowDefs } from "../../cinematic/fx/Fx";
import { AmavasyaSky, FarBank, ForegroundPalms, NearVillage, PadmaNight } from "../../cinematic/sets/Exteriors";
import { CARD_PALETTE } from "../../episode/SeriesCards";

const Word: React.FC<{ f: number; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  f,
  at,
  children,
  style,
}) => {
  const t = clamp((f - at) / 16);
  const e = EASE.out(t);
  return (
    <span
      style={{
        display: "inline-block",
        opacity: e,
        transform: `translateY(${(1 - e) * 24}px) scale(${0.93 + e * 0.07})`,
        filter: `blur(${(1 - e) * 6}px)`,
        marginRight: "0.28em",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/** Series 2 Intro Title Card — night over the Padma with warm diyas and animated Bengali typography. */
export const Scene00Intro: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const fadeOut = interpolate(f, [266, 290], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Stage cam={{ x: f * 0.25, y: 0, zoom: 1 + f * 0.00018 }}>
        <GlowDefs />
        <Layer depth={0.1}>
          <AmavasyaSky f={f} />
        </Layer>
        <Layer depth={0.25}>
          <FarBank f={f} wave={0.4} />
        </Layer>
        <Layer depth={0.42}>
          <PadmaNight f={f} wave={0.4} />
        </Layer>
        <Layer depth={0.68}>
          <NearVillage f={f} wave={0.4} puja={0.5} />
          {[320, 620, 960, 1280, 1580].map((x, i) => (
            <Diya key={x} x={x} y={760 + (i % 2) * 14} f={f} seed={i * 7 + 3} />
          ))}
        </Layer>
        <Layer depth={0.9}>
          <ForegroundPalms f={f} />
          <Motes f={f} x={960} y={540} n={20} spread={680} seed={19} />
          <Bokeh f={f} n={8} seed={4} color={CARD_PALETTE.saffron} />
        </Layer>
        <Grade vignette={0.45} />
      </Stage>

      {/* Series 2 Title Typography */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 120,
          textAlign: "center",
          fontFamily: BN_FONT,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 82,
            fontWeight: 700,
            color: CARD_PALETTE.cream,
            textShadow: "0 4px 24px rgba(15, 6, 20, 0.9), 0 0 40px rgba(242, 160, 62, 0.45)",
            letterSpacing: "0.02em",
          }}
        >
          <Word f={f} at={12}>পরম</Word>
          <Word f={f} at={24}>বিস্ময়</Word>
          <Word f={f} at={38} style={{ color: CARD_PALETTE.goldSoft }}>বালক</Word>
          <Word f={f} at={50} style={{ color: CARD_PALETTE.goldSoft }}>ঠাকুর</Word>
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 34,
            fontWeight: 600,
            color: CARD_PALETTE.goldSoft,
            textShadow: "0 2px 14px rgba(10, 4, 16, 0.9)",
          }}
        >
          <Word f={f} at={115}>সিজন</Word>
          <Word f={f} at={125}>এক</Word>
          <Word f={f} at={135}>•</Word>
          <Word f={f} at={142}>পর্ব</Word>
          <Word f={f} at={152}>এক</Word>
        </div>

        <div
          style={{
            marginTop: 14,
            fontSize: 52,
            fontWeight: 700,
            color: "#ffffff",
            textShadow: "0 3px 18px rgba(10, 4, 16, 0.92)",
          }}
        >
          <Word f={f} at={175}>ভবিষ্যদ্বাণী</Word>
          <Word f={f} at={192}>ও</Word>
          <Word f={f} at={204}>পৈতৃকভিটা</Word>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Series 2 Source Attribution Card — crediting Prof. P. K. Ray (Rayda). */
export const Scene00bSourceCard: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const frames = 144;
  const opacity = Math.min(
    interpolate(f, [0, 22], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(f, [frames - 22, frames], [1, 0], { extrapolateLeft: "clamp" })
  );

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 42%, #3a2716 0%, #1c120a 70%, #0d0805 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          width: 1180,
          padding: "56px 72px",
          borderRadius: 18,
          background: "linear-gradient(180deg, #f7ecd6 0%, #ead8b5 100%)",
          border: "3px solid #c5984a",
          boxShadow: "0 20px 60px rgba(0,0,0,0.65)",
          textAlign: "center",
          fontFamily: BN_FONT,
          color: "#2b1c10",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 600, color: "#8c4a18", letterSpacing: "0.06em" }}>
          তথ্যসূত্র ও কৃতজ্ঞতা স্বীকার
        </div>
        <div style={{ width: 160, height: 2, background: "#c5984a", margin: "18px auto 26px" }} />
        <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.45 }}>
          ‘পরম বিস্ময় বালক ঠাকুর’
        </div>
        <div style={{ fontSize: 30, fontWeight: 500, marginTop: 14, color: "#4a321e" }}>
          অধ্যাপক পি. কে. রায় (রায়দা) রচিত অবিস্মরণীয় গ্রন্থ অবলম্বনে
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 21,
            color: "#6b4f34",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}
        >
          Based on “Param Bismoy Balak Thakur” by Prof. P. K. Ray (Indian School of Mines, Dhanbad)
        </div>
      </div>
    </AbsoluteFill>
  );
};
