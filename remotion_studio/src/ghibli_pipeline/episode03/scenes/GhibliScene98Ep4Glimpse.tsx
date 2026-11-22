import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE } from "../../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../../cinematic/fonts";
import { EP03_CUES } from "../../../episode03/subtitles";
import { EP03_SCENES } from "../../../episode03/timing";

/**
 * Episode 3 (Ghibli Sketch Test) · next-episode glimpse (TTL-10a, TTL-11).
 * Uses the exact feathered vignette geometry and Bengali Episode 4 labels of Scene98NextEpisode,
 * backed by the hand-sketched Ghibli watercolor clay Shivalinga & coconut pond illustration.
 */

const OUTRO = EP03_SCENES.find((s) => s.sceneId === "99_closing_sequential_outro");
const NEXT = EP03_SCENES.find((s) => s.sceneId === "98_next_episode");
const OUTRO_START = OUTRO?.startFrame ?? 2388;
export const OUTRO_WITH_GLIMPSE_FRAMES = (NEXT ? NEXT.startFrame + NEXT.durationFrames : OUTRO_START + 871) - OUTRO_START;
const FRAMES = OUTRO_WITH_GLIMPSE_FRAMES;

const NEXT_CUE = EP03_CUES.find((c) => c.text.includes("আসছে পরের পর্ব"));
const PREVIEW_AT = NEXT_CUE ? NEXT_CUE.from - OUTRO_START : 316;
const FADE_IN = 30;
const FADE_OUT = 30;
const PREVIEW_END = FRAMES - 52;
const FADE_OUT_AT = PREVIEW_END - FADE_OUT;

const VIG_W = 1270;
const VIG_H = 660;
const VIG_LEFT = (1920 - VIG_W) / 2;
const VIG_TOP = 300;
const W = 1920;
const H = 1080;
const SCALE = Math.max(VIG_W / W, VIG_H / H);
const DX = (VIG_W - W * SCALE) / 2;
const DY = (VIG_H - H * SCALE) / 2;
const VIG_MASK =
  "radial-gradient(ellipse closest-side at 50% 48%, #000 0%, #000 42%, rgba(0,0,0,0.82) 58%, rgba(0,0,0,0.45) 74%, rgba(0,0,0,0.14) 88%, rgba(0,0,0,0) 100%)";
const VIG_WASH =
  "radial-gradient(ellipse closest-side at 50% 48%, rgba(255,226,160,0) 30%, rgba(255,206,130,0.14) 52%, rgba(247,170,84,0.38) 76%, rgba(242,150,60,0.64) 100%)";
const DRIFT_X = 14;
const DRIFT_Y = 6;
const ZOOM = 0.035;
const BLUR_IN = 5;

const LABEL_DELAY = 14;
const LABEL_FADE = 26;
const LABEL_TOP = 832;
const labelShadow =
  "0 2px 6px rgba(32,10,4,0.98), 0 0 16px rgba(42,14,6,0.92), 0 0 32px rgba(255,190,110,0.45)";

const EP4_LABEL = "পর্ব চার";
const EP4_NAME = "শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক";

const GhibliVillageGlimpse: React.FC<{ f: number; life: number }> = ({ f, life }) => {
  const cam = 1 + 0.04 * life;
  const diyaPulse = 0.22 + 0.06 * Math.sin(f * 0.21) + 0.03 * Math.sin(f * 0.37 + 1.1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id="ghibli-ep4-diya-glow">
          <stop offset="0" stopColor="#ffe7a0" stopOpacity={0.85} />
          <stop offset="0.45" stopColor="#f5ad42" stopOpacity={0.3} />
          <stop offset="1" stopColor="#f2a03e" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${cam}) translate(${-W / 2} ${-H / 2})`}>
        <image
          href={staticFile("images/ghibli_ep03/glimpse_ep04_shivalinga_sketch.png")}
          x={0}
          y={0}
          width={W}
          height={H}
          preserveAspectRatio="xMidYMid slice"
        />
        {/* Gentle sunset water shimmer streaks */}
        {Array.from({ length: 6 }, (_, i) => {
          const rw = 260 - i * 28;
          return (
            <rect
              key={i}
              x={980 - rw / 2 + Math.sin(f * 0.03 + i) * 10}
              y={812 + i * 18}
              width={rw}
              height={3.5}
              rx={1.8}
              fill="#ffe7a0"
              opacity={0.28 + Math.sin(f * 0.05 + i) * 0.14}
            />
          );
        })}
        {/* Subtle warm diya flicker breath near the Shivalinga base */}
        <circle cx={785} cy={720} r={90} fill="url(#ghibli-ep4-diya-glow)" opacity={diyaPulse} style={{ mixBlendMode: "screen" }} />
      </g>
    </svg>
  );
};

export const GhibliNextEpisodeGlimpse: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  if (f < PREVIEW_AT || f >= PREVIEW_END) return null;

  const inT = clamp((f - PREVIEW_AT) / FADE_IN);
  const fadeIn = EASE.inOut(inT);
  const fadeOut = 1 - EASE.inOut(clamp((f - FADE_OUT_AT) / FADE_OUT));
  const opacity = Math.min(fadeIn, fadeOut);
  const life = EASE.inOut(clamp((f - PREVIEW_AT) / (PREVIEW_END - PREVIEW_AT)));
  const driftX = DRIFT_X / 2 - DRIFT_X * life;
  const driftY = DRIFT_Y / 2 - DRIFT_Y * life;
  const zoom = 1 + ZOOM * life;
  const blur = BLUR_IN * (1 - EASE.out(inT));
  const labelIn = EASE.inOut(clamp((f - PREVIEW_AT - LABEL_DELAY) / LABEL_FADE));
  const labelOpacity = Math.min(labelIn, fadeOut);
  const local = f - PREVIEW_AT;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: VIG_LEFT,
          top: VIG_TOP,
          width: VIG_W,
          height: VIG_H,
          overflow: "hidden",
          opacity,
          WebkitMaskImage: VIG_MASK,
          maskImage: VIG_MASK,
          transform: `translate(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px)`,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: "50% 50%",
            transform: `scale(${zoom.toFixed(5)})`,
            filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              transformOrigin: "0 0",
              transform: `translate(${DX}px, ${DY}px) scale(${SCALE})`,
            }}
          >
            <GhibliVillageGlimpse f={local} life={life} />
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, background: VIG_WASH }} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: LABEL_TOP,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: BN_FONT,
          opacity: labelOpacity,
          transform: `translateY(${((1 - labelIn) * 8).toFixed(2)}px)`,
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 2, color: "#FFDB8E", textShadow: labelShadow }}>{EP4_LABEL}</div>
        <div
          style={{
            marginTop: 2,
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: 0.5,
            color: "#FFF3DC",
            textShadow: labelShadow,
            whiteSpace: "nowrap",
          }}
        >
          {EP4_NAME}
        </div>
      </div>
    </>
  );
};

export const GhibliScene98NextEpisode: React.FC = () => null;
