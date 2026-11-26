import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE } from "../../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../../cinematic/fonts";
import { CARD_PALETTE } from "../../../episode/SeriesCards";
import { ContactShadow, GhibliCharFilterDefs, GhibliCutout, GhibliGrade, GhibliPreload } from "../../GhibliStage";
import { GHIBLI_ANCHORS } from "../../episode05/plateAnchors";
import { ep05rPhraseLocal } from "../subtitles";
import { ep05rScene } from "../timing";
import { FigureDefs, SkelBalakStanding } from "./RewriteKit";

/**
 * Scene 99 `99_closing_sequential_outro` of the Ghibli Episode 5 rewrite (blueprint "Block 99"; TTL-09, TTL-10a).
 * The riverbank at sunset continues under the closing words (stand-in: ghibli_ep05/card_outro_padma_sketch.png until
 * riverbank_jam_back is painted), the series name, then from the narrator's "আসছে পরের পর্ব" the soft BOXLESS glimpse of
 * Episode 6: ghibli_ep05/glimpse_ep06_veranda_sketch.png in a feathered oval (no frame, no box), Balak (BAL-26f) standing by
 * the Ujanchar veranda post and his father's wooden khadam on the step (STO-20 decision 14), and the cream-gold label
 * "পর্ব ছয়" in Baloo Da 2. Every time comes from the generated timing, so it follows the measured outro clip.
 */

const W = 1920;
const H = 1080;
const OUTRO = "99_closing_sequential_outro";
const EP6_LABEL = "পর্ব ছয়";
const EP6_NAME = "জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী";
const PRELOAD = [
  "images/ghibli_ep05/card_outro_padma_sketch.png",
  "images/ghibli_ep05/glimpse_ep06_veranda_sketch.png",
  "images/ghibli_ep05/prop_khadam_sandals.png",
] as const;

const VIG_W = 1270;
const VIG_H = 660;
const VIG_TOP = 250;
const VIG_MASK =
  "radial-gradient(ellipse closest-side at 50% 48%, #000 0%, #000 42%, rgba(0,0,0,0.82) 58%, rgba(0,0,0,0.45) 74%, rgba(0,0,0,0.14) 88%, rgba(0,0,0,0) 100%)";
const labelShadow =
  "0 1px 2px rgba(70,22,10,0.85), 0 0 10px rgba(70,22,10,0.55), 0 0 26px rgba(255,190,110,0.55), 0 0 48px rgba(255,170,90,0.35)";

const Glimpse: React.FC<{ f: number; local: number }> = ({ f, local }) => {
  // the plate's own space (1920 x 1080 view): the veranda post at about x 520, the plinth top at about y 840
  const post = { x: 640, y: 880 };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <GhibliCharFilterDefs f={f} />
      <FigureDefs f={f} zoom={1} />
      <image href={staticFile("images/ghibli_ep05/glimpse_ep06_veranda_sketch.png")} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
      <ContactShadow x={post.x + 330} y={post.y + 70} rx={90} ry={12} opacity={0.3} />
      <GhibliCutout file="images/ghibli_ep05/prop_khadam_sandals.png" anchor={GHIBLI_ANCHORS.prop_khadam_sandals} x={post.x + 330} y={post.y + 72} targetHeight={70} />
      <SkelBalakStanding sceneId={OUTRO} x={post.x + 130} y={post.y} s={0.95} f={local} flip zoom={1} />
    </svg>
  );
};

export const Scene99RewriteOutro: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const frames = ep05rScene(OUTRO).durationFrames;
  const p = clamp(f / frames);
  const cam = 1.07 - 0.06 * EASE.inOut(p);
  const camX = (1 - EASE.inOut(p)) * 32 - 16;
  const fadeOut = clamp((frames - f) / 40);
  const dark = 1 - fadeOut;

  const titleIn = EASE.out(clamp((f - 120) / 50));
  const previewAt = ep05rPhraseLocal(OUTRO, "আসছে পরের পর্ব", Math.round(frames * 0.42));
  const previewEnd = frames - 52;
  const inT = clamp((f - previewAt) / 30);
  const gOpacity = f < previewAt || f >= previewEnd ? 0 : Math.min(EASE.inOut(inT), 1 - EASE.inOut(clamp((f - (previewEnd - 30)) / 30)));
  const life = EASE.inOut(clamp((f - previewAt) / Math.max(1, previewEnd - previewAt)));
  const labelIn = EASE.inOut(clamp((f - previewAt - 14) / 26)) * (gOpacity > 0 ? 1 : 0);

  return (
    <AbsoluteFill style={{ background: CARD_PALETTE.night, overflow: "hidden" }}>
      <GhibliPreload files={PRELOAD} />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <g transform={`translate(${W / 2 + camX} ${H / 2}) scale(${cam}) translate(${-W / 2} ${-H / 2})`}>
          <image href={staticFile("images/ghibli_ep05/card_outro_padma_sketch.png")} x={-80} y={-45} width={W + 160} height={H + 90} preserveAspectRatio="xMidYMid slice" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x={960 - (200 - i * 20) / 2 + Math.sin(f * 0.03 + i) * 10}
              y={676 + i * 22}
              width={200 - i * 20}
              height={4.5}
              rx={2.2}
              fill="#FFE7A0"
              opacity={0.3 + Math.sin(f * 0.05 + i) * 0.14}
            />
          ))}
        </g>
      </svg>
      <GhibliGrade warmth={0.22} vignette={0.36} bloomAt={[50, 48]} paperOpacity={0.2} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", opacity: titleIn * (1 - gOpacity * 0.7) }}>
        <div style={{ fontFamily: BN_FONT, fontSize: 64, fontWeight: 700, color: "#FFF1D6", textShadow: labelShadow }}>ছোটদের বালক ঠাকুরের গল্প</div>
        <div style={{ marginTop: 20, width: 440, height: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${CARD_PALETTE.gold}, transparent)` }} />
      </div>

      {gOpacity > 0 && (
        <>
          <div
            style={{
              position: "absolute",
              left: (W - VIG_W) / 2,
              top: VIG_TOP,
              width: VIG_W,
              height: VIG_H,
              overflow: "hidden",
              opacity: gOpacity,
              WebkitMaskImage: VIG_MASK,
              maskImage: VIG_MASK,
              transform: `translate(${(7 - 14 * life).toFixed(2)}px, ${(3 - 6 * life).toFixed(2)}px) scale(${(1 + 0.035 * life).toFixed(4)})`,
              pointerEvents: "none",
            }}
          >
            <Glimpse f={f} local={f - previewAt} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 806,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily: BN_FONT,
              opacity: Math.min(labelIn, gOpacity),
              pointerEvents: "none",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2.5, color: "#FFD98E", textShadow: labelShadow, marginBottom: 4 }}>— আসছে পরের পর্ব —</div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 2, color: "#FFE8B0", textShadow: labelShadow }}>{EP6_LABEL}</div>
            <div style={{ marginTop: 2, fontSize: 30, fontWeight: 600, color: "#FFF3DC", textShadow: labelShadow, whiteSpace: "nowrap" }}>{EP6_NAME}</div>
          </div>
        </>
      )}

      <div style={{ position: "absolute", inset: 0, background: CARD_PALETTE.night, opacity: dark, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
