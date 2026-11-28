import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, lerp } from "../../../cinematic/core/anim";
import type { Cam } from "../../../cinematic/core/Stage";
import { BN_FONT, ensureBanglaFont } from "../../../cinematic/fonts";
import { CARD_PALETTE } from "../../../episode/SeriesCards";
import { ContactShadow, GhibliCharFilterDefs, GhibliCutout, GhibliGrade, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { GHIBLI_ANCHORS } from "../../episode05/plateAnchors";
import { EP05R_SCALE, Ep05StandingBalak } from "../Ep05RewriteCast";
import { ep05rPhraseLocal } from "../subtitles";
import { ep05rScene, ep05rSpan } from "../timing";
import { frameOn, plateKeep, PLATE_RECT } from "./RewriteKit";
import { EP05R_RIVER_CAM_END, Ep05RiverbankSunset } from "./Scene05RewriteSereshtaGossip";

/**
 * Scene 99 `99_closing_sequential_outro` of the Ghibli Episode 5 rewrite (blueprint "Block 99"; TTL-09, TTL-10a).
 * The riverbank at sunset of AG14 CONTINUES under the closing words (the same `Ep05RiverbankSunset` picture and
 * camera, so the 40 f dissolve from scene 05 is seamless): the camera makes the slow push in on Balak under the tree
 * (birds flying home, the boat crossing, the sun glitter), the light deepens to dusk, and on "দুটোকেই বাঁচিয়েছিল" Balak's face warms into a small
 * smile (no glow beat: his halo stays at rest). On "ছোটদের বালক ঠাকুরের গল্প" the series name rises; from the narrator's
 * "আসছে পরের পর্ব" the soft BOXLESS glimpse of Episode 6 fades up in a feathered oval (no frame, no box):
 * ghibli_ep05/glimpse_ep06_veranda_sketch.png, Balak (BAL-26f) standing by the Ujanchar veranda post and his father's
 * wooden khadam on the step (STO-20 decision 14), with the cream-gold teaser label "পর্ব ছয়" and the episode name in
 * Baloo Da 2 (kept above the caption band). The glimpse fades out, then the whole frame fades gently to night.
 * Every time comes from the generated timing and caption cues, so it follows the measured outro clip.
 */

const W = 1920;
const H = 1080;
const OUTRO = "99_closing_sequential_outro";
const EP6_LABEL = "পর্ব ছয়";
const EP6_NAME = "জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী";
const PRELOAD = [
  "images/ghibli_ep05/card_outro_padma_sketch.png",
  "images/ghibli_ep05/grove_floor_sketch.png",
  "images/ghibli_ep05/tree_mango_sketch.png",
  "images/ghibli_ep05/glimpse_ep06_veranda_sketch.png",
  "images/ghibli_ep05/prop_khadam_sandals.png",
] as const;
/** frames of AG14 before the outro (the riverbank's own clock runs on across the cut) */
const AG14_FRAMES = ep05rSpan("05_sereshta_gossip", "AG14_afterglow").frames;
/** the slow push's end: Balak small but nearer, under the tree, the river light beside him */
const CAM_IN: Cam = { ...frameOn(1300, 760, 1.16), focus: 1, dof: 0 }; // the seat stays above the caption band

const VIG_W = 1270;
const VIG_H = 620;
const VIG_TOP = 120;
const VIG_MASK =
  "radial-gradient(ellipse closest-side at 50% 48%, #000 0%, #000 42%, rgba(0,0,0,0.82) 58%, rgba(0,0,0,0.45) 74%, rgba(0,0,0,0.14) 88%, rgba(0,0,0,0) 100%)";
const labelShadow =
  "0 1px 2px rgba(70,22,10,0.85), 0 0 10px rgba(70,22,10,0.55), 0 0 26px rgba(255,190,110,0.55), 0 0 48px rgba(255,170,90,0.35)";

const Glimpse: React.FC<{ local: number }> = ({ local }) => {
  // the plate's own space (1920 x 1080 view): the veranda post at about x 520, the plinth top at about y 840
  const post = { x: 640, y: 880 };
  const lf = Math.max(0, local);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <GhibliCharFilterDefs f={lf} />
      <image href={staticFile("images/ghibli_ep05/glimpse_ep06_veranda_sketch.png")} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" />
      <ContactShadow x={post.x + 330} y={post.y + 70} rx={90} ry={12} opacity={0.3} />
      <GhibliCutout file="images/ghibli_ep05/prop_khadam_sandals.png" anchor={GHIBLI_ANCHORS.prop_khadam_sandals} x={post.x + 330} y={post.y + 72} targetHeight={70} />
      <Ep05StandingBalak
        x={post.x + 130}
        y={post.y}
        s={EP05R_SCALE.standingBalak.s * 1.25}
        f={lf}
        lifeF={lf}
        flip
        pose="standQuiet"
        mouth={0}
        talk={0}
        glowK={0}
        zoom={1}
      />
    </svg>
  );
};

export const Scene99RewriteOutro: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const frames = ep05rScene(OUTRO).durationFrames;
  const fadeOut = clamp((frames - f) / 40);
  const dark = 1 - EASE.inOut(fadeOut);

  // cue keys (scene-local), each with a proportional fallback
  const savedAt = ep05rPhraseLocal(OUTRO, "দুটোকেই", Math.round(frames * 0.15));
  const seriesAt = ep05rPhraseLocal(OUTRO, "ছোটদের বালক ঠাকুরের গল্প", Math.round(frames * 0.4));
  const previewAt = ep05rPhraseLocal(OUTRO, "আসছে পরের পর্ব", Math.round(frames * 0.48));
  const previewEnd = frames - 52;

  // one camera move under the closing: the slow push in on Balak from AG14's framing (starts on the first line)
  const push = EASE.inOut(clamp((f - 14) / Math.max(1, seriesAt - 14)));
  const z = EP05R_RIVER_CAM_END.zoom * Math.pow(CAM_IN.zoom / EP05R_RIVER_CAM_END.zoom, push);
  const cam = plateKeep(
    { x: lerp(EP05R_RIVER_CAM_END.x, CAM_IN.x, push), y: lerp(EP05R_RIVER_CAM_END.y, CAM_IN.y, push), zoom: z, focus: 1, dof: 0 },
    PLATE_RECT,
  );
  const dusk = EASE.inOut(clamp(f / frames));
  const smile = lerp(0.2, 0.42, EASE.inOut(clamp((f - savedAt) / 30)));

  const titleIn = EASE.out(clamp((f - seriesAt + 6) / 40));
  const inT = clamp((f - previewAt) / 30);
  const gOpacity = f < previewAt || f >= previewEnd ? 0 : Math.min(EASE.inOut(inT), 1 - EASE.inOut(clamp((f - (previewEnd - 30)) / 30)));
  const life = EASE.inOut(clamp((f - previewAt) / Math.max(1, previewEnd - previewAt)));
  const labelIn = EASE.inOut(clamp((f - previewAt - 14) / 26)) * (gOpacity > 0 ? 1 : 0);

  return (
    <AbsoluteFill style={{ background: CARD_PALETTE.night, overflow: "hidden" }}>
      <GhibliPreload files={PRELOAD} />
      {/* the riverbank recedes under the glimpse, so the seated child is not a second Balak */}
      <div style={{ position: "absolute", inset: 0, opacity: gOpacity <= 0 ? 1 : Math.max(0, 1 - gOpacity * 8) }}>
        <GhibliStage cam={cam} background="#3a2436">
          <Ep05RiverbankSunset t={AG14_FRAMES + f} zoom={cam.zoom} dusk={dusk} smile={smile} />
          <GhibliGrade warmth={0.3} vignette={0.38 + 0.12 * dusk} bloomAt={[78, 46]} paperOpacity={0.2} />
        </GhibliStage>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(60,26,60,0.0) 0%, rgba(40,18,40,0.55) 100%)", opacity: 0.5 * dusk, pointerEvents: "none" }} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 150,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: titleIn * (1 - gOpacity),
          transform: `translateY(${(1 - titleIn) * 14}px)`,
        }}
      >
        <div style={{ fontFamily: BN_FONT, fontSize: 64, fontWeight: 700, color: "#FFF1D6", textShadow: labelShadow }}>ছোটদের বালক ঠাকুরের গল্প</div>
        <div style={{ marginTop: 20, width: 440, height: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${CARD_PALETTE.gold}, transparent)` }} />
      </div>

      {gOpacity > 0 && (
        <>
          {/* the sunset recedes under the glimpse so it reads (a soft vignette, no box) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 60% 62% at 50% 44%, rgba(30,14,28,0.62) 0%, rgba(30,14,28,0.5) 55%, rgba(30,14,28,0.22) 100%)",
              opacity: gOpacity,
              pointerEvents: "none",
            }}
          />
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
            <Glimpse local={f - previewAt} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: VIG_TOP + VIG_H - 46,
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
