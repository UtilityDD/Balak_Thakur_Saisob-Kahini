import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SeriesOutro, CARD_PALETTE } from "../../episode/SeriesCards";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { clamp, EASE } from "../../cinematic/core/anim";
import { GentleCow, solveGentleCow, type GentleCowProps } from "../../cinematic/animals/GentleCow";
import { SeatedChild, seatedChildHands, type SeatedChildProps } from "../../episode03/rig/SeatedChild";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { EP04_SCENES } from "../timing";
import { EP04_CUES } from "../subtitles";

/**
 * Episode 4 · Scene 99: the closing dawn card (the shared series outro, src/episode/SeriesCards.tsx, TTL-09) with
 * the soft next-episode glimpse (TTL-10a, TTL-11). Episode 4 has no separate 98 segment (TIM-EP04-01): the glimpse
 * is a layer inside the outro, which runs to the episode's last frame (TTL-12: no empty end hold).
 *
 * The glimpse: Episode 5 ("কচ্ছপ খেলা ও গাভী রক্ষা", the title in Episode 5's SRT and in this outro's narration) as
 * one calm painted moment (STO-19 decision 10): six-year-old Balak (Episode 5's age) in the BAL-26 plate design (the
 * SeatedChild rig, design "plate", age 6, BAL-26b), cross-legged, his palm raised to a calm humped Bengal cow
 * (ANI-04; GentleCow, the Episode 2 Ujanchar cow that acts in Episode 5) who lowers her muzzle to it, then his slow
 * strokes, in warm late light on a village meadow. It is Episode 5's final cow moment (scene 02, P3) in miniature:
 * Balak on the left facing right, the cow on his right facing left, the cow about 1.1 times his scale and standing a
 * little behind his ground line, her muzzle at his palm, his hand following it. His restrained halo (BirulGlow at the
 * plate head's glow anchor, steady, soft falloff, BAL-06/07); no glow on the cow. It sits in a feathered, dreamlike oval with no frame, border or backing, melting into the
 * outro background, fades in on the narration's "আসছে পরের পর্ব" line, drifts and zooms very slightly, and fades
 * out before the outro's own fade to dark. The label "পর্ব পাঁচ" and the episode name sit on its lower feathered
 * edge in glowing cream-gold Baloo Da 2 (TTL-01), with no dark backing. Geometry and timing as Episode 3's glimpse.
 */

const OUTRO = EP04_SCENES.find((s) => s.sceneId === "99_closing_sequential_outro");
const OUTRO_START = OUTRO?.startFrame ?? 2068;
/** The outro's whole on-screen length (it is the last scene, so it runs to the episode's end). */
const FRAMES = OUTRO?.durationFrames ?? 643;

/** The glimpse opens on the narration's "আসছে পরের পর্ব" line (outro-local frame). */
const NEXT_CUE = EP04_CUES.find((c) => c.text.includes("আসছে পরের পর্ব"));
const PREVIEW_AT = NEXT_CUE ? NEXT_CUE.from - OUTRO_START : 308;
const FADE_IN = 30;
const FADE_OUT = 30;
/** Gone before SeriesOutro's fade to dark, which starts about 40 frames (scaled) before the end. */
const PREVIEW_END = FRAMES - 52;
const FADE_OUT_AT = PREVIEW_END - FADE_OUT;

/* Vignette geometry, the same as Episodes 2 and 3: centred under the series title, feathered to nothing. */
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
  "radial-gradient(ellipse closest-side at 50% 48%, rgba(255,226,160,0) 30%, rgba(255,206,130,0.16) 52%, rgba(247,170,84,0.42) 76%, rgba(242,150,60,0.7) 100%)";
const DRIFT_X = 14;
const DRIFT_Y = 6;
const ZOOM = 0.035;
const BLUR_IN = 5;

const LABEL_DELAY = 14;
const LABEL_FADE = 26;
const LABEL_TOP = 818;
const labelShadow =
  "0 1px 2px rgba(70,22,10,0.85), 0 0 10px rgba(70,22,10,0.55), 0 0 26px rgba(255,190,110,0.55), 0 0 48px rgba(255,170,90,0.35)";

const EP5_LABEL = "পর্ব পাঁচ";
const EP5_NAME = "কচ্ছপ খেলা ও গাভী রক্ষা";

/* The painted moment (1920 x 1080 units, shown scaled inside the vignette). */
const HORIZON = 600;
const GROUND = 830;
/**
 * Balak (plate design, age 6) and the cow, in Episode 5 scene 02 P3's proportions (Balak s 0.95, cow s 1.05, the cow
 * about 24 units behind his ground line, her ground point 112 x Balak.s + 245 to his right), scaled up for the
 * vignette and the pair centred in its clear middle.
 */
const BALAK = { x: 690, y: GROUND, s: 1.2 };
const COW_S = BALAK.s * (1.05 / 0.95);
/** Where his palm meets her muzzle (figure units, he faces +x): Episode 5's STROKE_PALM. */
const STROKE_PALM = { x: 112, y: -120 };
const PALM_W = { x: BALAK.x + STROKE_PALM.x * BALAK.s, y: BALAK.y + STROKE_PALM.y * BALAK.s };
const COW = { x: PALM_W.x + 245 * (COW_S / 1.05), y: GROUND - 24 * (BALAK.s / 0.95), s: COW_S };

/**
 * The glimpse's little beat on its local clock (0 = the glimpse starts to fade in): his palm is already rising and
 * waits a breath short of her as her muzzle comes down (nuzzle, 24 f), touches at TOUCH, then slow strokes (half the
 * rig's speed: calm). The rig runs on R0 + t (R0 keeps its clock positive), with t the strokeCow clock (STROKE_COW_T:
 * raise 20, touch 32).
 */
const TOUCH = 66;
const NUZZLE_AT = TOUCH - 24;
const R0 = 400;
const strokeT = (lf: number): number => {
  if (lf <= 0) return 8;
  if (lf < 30) return 8 + (12 * lf) / 30;
  if (lf < TOUCH) return 20 + (12 * (lf - 30)) / (TOUCH - 30);
  return 32 + 0.5 * (lf - TOUCH);
};

const cowProps = (lf: number): GentleCowProps => ({
  x: COW.x,
  y: COW.y,
  s: COW.s,
  flip: true,
  f: lf,
  lifeF: lf + 60,
  action: "nuzzle",
  actionStart: NUZZLE_AT,
  prevAction: "idle",
  prevActionStart: NUZZLE_AT - 60,
  turn: -0.06,
  target: PALM_W,
  seed: 7,
});

const balakProps = (lf: number): SeatedChildProps => {
  const cow = solveGentleCow(cowProps(lf));
  const fig = (p: { x: number; y: number }) => ({ x: (p.x - BALAK.x) / BALAK.s, y: (p.y - BALAK.y) / BALAK.s });
  const muzzle = fig(cow.muzzle);
  const fore = fig(cow.forehead);
  // Before her muzzle has come down his palm waits at the meeting point; from then on it follows her muzzle.
  const k = EASE.inOut(clamp((lf - (TOUCH - 18)) / 14));
  return {
    x: BALAK.x,
    y: BALAK.y,
    s: BALAK.s,
    f: R0 + strokeT(lf),
    lifeF: R0 + lf,
    design: "plate",
    age: 6,
    pose: "strokeCow",
    prevPose: "sitCross",
    poseStart: R0,
    strokeAt: { x: STROKE_PALM.x + (muzzle.x - STROKE_PALM.x) * k, y: STROKE_PALM.y + (muzzle.y - STROKE_PALM.y) * k },
    strokeDir: { x: fore.x - muzzle.x, y: fore.y - muzzle.y },
    face: { smile: 0.62 },
  };
};

/** Sky, low warm sun, a soft far tree line and the meadow. */
const Meadow: React.FC<{ f: number }> = ({ f }) => {
  const sunGlow = 0.85 + 0.08 * Math.sin(f * 0.05);
  const trees = `M -200 ${HORIZON + 10} Q -60 ${HORIZON - 70} 120 ${HORIZON - 30} Q 260 ${HORIZON - 96} 440 ${HORIZON - 40} Q 640 ${HORIZON - 80} 820 ${HORIZON - 26} Q 1040 ${HORIZON - 70} 1240 ${HORIZON - 34} Q 1460 ${HORIZON - 92} 1660 ${HORIZON - 30} Q 1860 ${HORIZON - 64} ${W + 200} ${HORIZON - 20} L ${W + 200} ${HORIZON + 60} L -200 ${HORIZON + 60} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="ep5g-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A3456" />
          <stop offset="0.38" stopColor="#C2626A" />
          <stop offset="0.7" stopColor={CARD_PALETTE.saffron} />
          <stop offset="1" stopColor="#F7D58A" />
        </linearGradient>
        <radialGradient id="ep5g-sunglow">
          <stop offset="0" stopColor="#FFEFB8" stopOpacity={0.9} />
          <stop offset="0.35" stopColor="#F7C35A" stopOpacity={0.4} />
          <stop offset="1" stopColor={CARD_PALETTE.saffron} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="ep5g-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C98E56" />
          <stop offset="0.3" stopColor="#8E4E44" />
          <stop offset="0.65" stopColor="#5A2A34" />
          <stop offset="1" stopColor="#2E1220" />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={W + 400} height={HORIZON + 260} fill="url(#ep5g-sky)" />
      <circle cx={1560} cy={520} r={460} fill="url(#ep5g-sunglow)" opacity={sunGlow} />
      <circle cx={1560} cy={520} r={70} fill="#FFE6A6" opacity={0.95} />
      <path d={trees} fill={CARD_PALETTE.roseDeep} opacity={0.7} />
      <rect x={-200} y={HORIZON + 30} width={W + 400} height={H - HORIZON + 200} fill="url(#ep5g-ground)" />
      {/* the low sun lying along the meadow */}
      <ellipse cx={1300} cy={HORIZON + 60} rx={900} ry={40} fill="#FFE3A0" opacity={0.18} />
      {/* soft grass tufts that stir a little */}
      {Array.from({ length: 22 }, (_, i) => {
        const gx = -60 + i * 96 + ((i * 53) % 40);
        const gy = GROUND + 30 + ((i * 37) % 120);
        const sway = Math.sin(f * 0.05 + i * 1.7) * 3;
        return (
          <path
            key={i}
            d={`M ${gx - 12} ${gy} Q ${gx - 8 + sway} ${gy - 26} ${gx - 2 + sway} ${gy - 34} M ${gx} ${gy} Q ${gx + 2 + sway} ${gy - 30} ${gx + 6 + sway} ${gy - 40} M ${gx + 10} ${gy} Q ${gx + 12 + sway} ${gy - 22} ${gx + 18 + sway} ${gy - 28}`}
            stroke="#3E1E22"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />
        );
      })}
    </svg>
  );
};

/** Balak's faint ground glow and his halo, then the child (BAL-05 to BAL-07: his light only, steady). */
const Balak: React.FC<{ f: number }> = ({ f }) => {
  const props = balakProps(f);
  const g = seatedChildHands(props).glowAnchor;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <radialGradient id="ep5g-groundglow">
          <stop offset="0" stopColor="#FFF0C8" stopOpacity={0.35} />
          <stop offset="1" stopColor="#FFF0C8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={BALAK.x} cy={BALAK.y + 4} rx={170} ry={30} fill="url(#ep5g-groundglow)" />
      <BirulGlow cx={g.cx} cy={g.cy} r={g.r} glow={0.75} f={f} />
      <SeatedChild {...props} />
    </svg>
  );
};

/** The painted Episode 5 moment: meadow, the calm cow (a little behind him), Balak beside her. */
const CowGlimpse: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: "absolute", inset: 0 }}>
    <Meadow f={f} />
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <GentleCow {...cowProps(f)} />
    </svg>
    <Balak f={f} />
  </div>
);

/** The soft glimpse layer, drawn over the outro's dawn. Reads the outro's local frame. */
const NextEpisodeGlimpse: React.FC = () => {
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
            <CowGlimpse f={local} />
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
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 2, color: "#FFDB8E", textShadow: labelShadow }}>{EP5_LABEL}</div>
        <div style={{ marginTop: 2, fontSize: 32, fontWeight: 600, letterSpacing: 0.5, color: "#FFF3DC", textShadow: labelShadow, whiteSpace: "nowrap" }}>
          {EP5_NAME}
        </div>
      </div>
    </>
  );
};

export const Scene99ClosingSequentialOutro: React.FC = () => (
  <AbsoluteFill>
    <SeriesOutro closing="ছোটদের বালক ঠাকুরের গল্প" frames={FRAMES} />
    <NextEpisodeGlimpse />
  </AbsoluteFill>
);
