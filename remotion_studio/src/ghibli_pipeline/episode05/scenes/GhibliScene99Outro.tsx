import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE } from "../../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../../cinematic/fonts";
import { CARD_PALETTE } from "../../../episode/SeriesCards";
import { BirulGlow } from "../../../episode03/rig/BirulGlow";
import { StandingChild, standingChildJoints, type StandingChildProps } from "../../../episode05/rig/StandingChild";
import { EP05_CUES } from "../../../episode05/subtitles";
import { EP05_SCENES } from "../../../episode05/timing";
import { ContactShadow, GhibliCharFilterDefs, GhibliCutout, GhibliGrade, GhibliPreload } from "../../GhibliStage";
import { ghibliClock } from "../../core/ghibliActing";
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { GhibliBalakFaceDetail } from "../../core/GhibliFaceDetail";
import { GhibliWindClothTail, GhibliWindHairWisps } from "../../core/GhibliWindFlutter";
import { GHIBLI_ANCHORS } from "../plateAnchors";

/**
 * Episode 5 (Ghibli Watercolor + Sepia-Ink Pipeline) · Scene 99 (`99_closing_sequential_outro`).
 * Hand-drawn Ghibli Padma sunrise outro carrying the feathered Episode 6 glimpse
 * ("পর্ব ছয় — জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী"): 6-year-old `StandingChild` standing quietly by the
 * Ujanchar bamboo veranda post on `glimpse_ep06_veranda_sketch.png`, with his father's Ghibli wooden sandals
 * (`prop_khadam_sandals.png` / খড়ম) resting at the foot of the mud plinth below him.
 */

const W = 1920;
const H = 1080;
const OUTRO_BASE = 704;

const OUTRO = EP05_SCENES.find((s) => s.sceneId === "99_closing_sequential_outro");
const OUTRO_START = OUTRO?.startFrame ?? 2226;
const FRAMES = OUTRO?.durationFrames ?? 623;

const NEXT_CUE = EP05_CUES.find((c) => c.text.includes("আসছে পরের পর্ব"));
const PREVIEW_AT = NEXT_CUE ? NEXT_CUE.from - OUTRO_START : 245;
const FADE_IN = 30;
const FADE_OUT = 30;
const PREVIEW_END = FRAMES - 52;
const FADE_OUT_AT = PREVIEW_END - FADE_OUT;

const VIG_W = 1270;
const VIG_H = 660;
const VIG_LEFT = (1920 - VIG_W) / 2;
const VIG_TOP = 300;
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

const EP6_LABEL = "পর্ব ছয়";
const EP6_NAME = "জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী";

const PRELOAD = [
  "images/ghibli_ep05/card_outro_padma_sketch.png",
  "images/ghibli_ep05/glimpse_ep06_veranda_sketch.png",
  "images/ghibli_ep05/prop_khadam_sandals.png",
  "images/ghibli_ep05/watercolor_paper_grain.png",
] as const;

const STAR = "M 0 -1 L 0.16 -0.16 L 1 0 L 0.16 0.16 L 0 1 L -0.16 0.16 L -1 0 L -0.16 -0.16 Z";
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeOutQuint = (t: number) => 1 - Math.pow(1 - clamp01(t), 5);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
const win = (f: number, a: number, b: number, ease: (t: number) => number = easeOutCubic) => ease((f - a) / (b - a));
const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const SPARKS = Array.from({ length: 22 }, (_, i) => ({
  x0: rnd(i * 3 + 1) * W,
  y0: rnd(i * 3 + 2) * H,
  size: 7 + rnd(i * 3 + 3) * 11,
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

const outroTitleStyle: React.CSSProperties = {
  fontFamily: BN_FONT,
  fontSize: 84,
  fontWeight: 800,
  lineHeight: 1.3,
  color: "#fffaf0",
  textShadow: "0 0 18px rgba(255,190,120,0.9), 0 0 42px rgba(255,190,120,0.9), 0 2px 4px rgba(0,0,0,0.5)",
  letterSpacing: 1,
  whiteSpace: "nowrap",
  textAlign: "center",
};

/**
 * In `glimpse_ep06_veranda_sketch.png` (1920x1080):
 * - The bamboo veranda post sits at x ≈ 430, resting on its raised red-clay plinth block at y ≈ 780..885.
 * - The veranda floor (dawa) top is at y ≈ 782, and the plinth foot meets the swept courtyard earth at y ≈ 888.
 * - The open wooden doorway sits at x ≈ 1100..1490.
 * We place 6-year-old `StandingChild` Balak on the veranda at `(610, 788)` next to the bamboo post,
 * and his father's Ghibli wooden sandals (`prop_khadam_sandals.png`) on the earth at the foot of the plinth at `(720, 916)`.
 */
const BALAK = { x: 615, y: 786, s: 1.12 };
const KHADAM = { x: 735, y: 920, h: 86 };

const balakProps = (f: number): StandingChildProps => ({
  x: BALAK.x,
  y: BALAK.y,
  s: BALAK.s,
  f: f + 400,
  lifeF: f + 400,
  pose: "standQuiet",
  prevPose: "standQuiet",
  poseStart: 0,
  yaw: 0.45,
  expression: "serene",
  face: { lookX: 0.25, eyesDown: 0.25, smile: 0.55 },
  age: 6,
});

const GhibliVerandaGlimpse: React.FC<{ f: number }> = ({ f }) => {
  const cf = ghibliClock(f, "twos");
  const p = balakProps(cf);
  const j = standingChildJoints(p);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <GhibliCharFilterDefs f={f} />
      <defs>
        <radialGradient id="gh-ep6g-groundglow">
          <stop offset="0" stopColor="#FFF0C8" stopOpacity={0.36} />
          <stop offset="1" stopColor="#FFF0C8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <image
        href={staticFile("images/ghibli_ep05/glimpse_ep06_veranda_sketch.png")}
        x={0}
        y={0}
        width={W}
        height={H}
        preserveAspectRatio="xMidYMid slice"
      />
      {/* Father's wooden sandals (খড়ম) at the foot of the mud plinth */}
      <ContactShadow x={KHADAM.x} y={KHADAM.y - 4} rx={58} ry={12} opacity={0.34} />
      <GhibliCutout
        file="images/ghibli_ep05/prop_khadam_sandals.png"
        anchor={GHIBLI_ANCHORS.prop_khadam_sandals}
        x={KHADAM.x}
        y={KHADAM.y}
        targetHeight={KHADAM.h}
      />
      {/* 6-year-old Balak standing quietly on the veranda by the bamboo post */}
      <ContactShadow x={BALAK.x} y={BALAK.y + 2} rx={44 * BALAK.s} ry={10 * BALAK.s} opacity={0.32} />
      <GhibliBalakGroundGlow x={BALAK.x} y={BALAK.y + 4} rx={155} ry={26} level={0.78} />
      <GhibliBalakAura cx={j.head.x} cy={j.head.y} r={150 * BALAK.s} glow={0.76} f={f} />
      <g filter="url(#ghibli-balak-ink)">
        <GhibliWindClothTail
          x={BALAK.x - 16 * BALAK.s}
          y={BALAK.y - 236 * BALAK.s}
          len={64 * BALAK.s}
          width={18 * BALAK.s}
          dir={-1}
          fill="#f4ede0"
          f={f}
          wind={0.58}
          seed={88}
        />
        <StandingChild {...p} />
        <GhibliBalakFaceDetail cx={j.head.x} cy={j.head.y} s={BALAK.s} zoom={1.5} />
        <GhibliWindHairWisps
          x={j.head.x - 20 * BALAK.s}
          y={j.head.y - 16 * BALAK.s}
          s={BALAK.s * 0.9}
          dir={-1}
          f={f}
          wind={0.55}
          seed={93}
        />
      </g>
    </svg>
  );
};

const GhibliEp6GlimpseOverlay: React.FC = () => {
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
            <GhibliVerandaGlimpse f={local} />
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
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 2, color: "#FFDB8E", textShadow: labelShadow }}>{EP6_LABEL}</div>
        <div style={{ marginTop: 2, fontSize: 32, fontWeight: 600, letterSpacing: 0.5, color: "#FFF3DC", textShadow: labelShadow, whiteSpace: "nowrap" }}>
          {EP6_NAME}
        </div>
      </div>
    </>
  );
};

export const GhibliScene99OutroEp05: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const frames = FRAMES;
  const k = frames / OUTRO_BASE;
  const at = (base: number) => base * k;
  const p = clamp01(f / frames);

  const cam = 1.07 - 0.06 * easeInOutSine(p);
  const camX = (1 - easeInOutSine(p)) * 32 - 16;

  const fadeIn = clamp01(f / at(64));
  const fadeOut = clamp01((frames - f) / at(40));
  const dark = 1 - Math.min(fadeIn, fadeOut);

  const lineP = win(f, at(120), at(170), easeOutQuint);
  const ruleP = win(f, at(150), at(200));

  const reflections = Array.from({ length: 9 }, (_, i) => ({ w: 220 - i * 20, y: 676 + i * 22 }));

  return (
    <AbsoluteFill style={{ background: CARD_PALETTE.night, overflow: "hidden" }}>
      <GhibliPreload files={PRELOAD} />

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <radialGradient id="ghibli-ep05-outro-glow">
            <stop offset="0" stopColor={CARD_PALETTE.goldSoft} stopOpacity={1} />
            <stop offset="0.4" stopColor={CARD_PALETTE.gold} stopOpacity={0.45} />
            <stop offset="1" stopColor={CARD_PALETTE.gold} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${W / 2 + camX} ${H / 2}) scale(${cam}) translate(${-W / 2} ${-H / 2})`}>
          <image
            href={staticFile("images/ghibli_ep05/card_outro_padma_sketch.png")}
            x={-80}
            y={-45}
            width={W + 160}
            height={H + 90}
            preserveAspectRatio="xMidYMid slice"
          />
          {reflections.map((r, i) => (
            <rect
              key={i}
              x={960 - r.w / 2 + Math.sin(f * 0.03 + i) * 10}
              y={r.y}
              width={r.w}
              height={4.5}
              rx={2.2}
              fill="#FFE7A0"
              opacity={0.34 + Math.sin(f * 0.05 + i) * 0.16}
            />
          ))}
        </g>
        <g>
          {PETALS.map((pt, i) => {
            const y = ((pt.y0 + f * pt.fall) % (H + 80)) - 40;
            const x = pt.x0 + Math.sin(f * 0.025 + pt.phase) * pt.sway;
            const rot = pt.phase * 57.3 + Math.sin(f * 0.04 + pt.phase) * 25;
            return (
              <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${pt.size.toFixed(2)})`} opacity={0.68}>
                <ellipse rx={9} ry={5} fill={PETAL_TINTS[i % 2]} stroke="#5a3420" strokeWidth={0.6} strokeOpacity={0.45} />
              </g>
            );
          })}
        </g>
        <g>
          {SPARKS.map((s, i) => {
            const y = (((s.y0 - f * s.rise) % H) + H) % H;
            const x = s.x0 + Math.sin(f * 0.02 + s.phase) * 18;
            const kk = 0.5 + 0.5 * Math.sin(f * 0.07 + s.phase * 3);
            return (
              <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(s.size * (0.6 + 0.4 * kk)).toFixed(2)})`} opacity={0.25 + 0.75 * kk}>
                <circle r={2.2} fill="url(#ghibli-ep05-outro-glow)" />
                <path d={STAR} fill={i % 2 ? CARD_PALETTE.goldSoft : CARD_PALETTE.gold} />
              </g>
            );
          })}
        </g>
      </svg>

      <GhibliGrade warmth={0.22} vignette={0.36} bloomAt={[50, 48]} paperOpacity={0.2} />

      <div style={{ position: "absolute", left: 0, right: 0, top: 180, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            ...outroTitleStyle,
            opacity: lineP,
            transform: `translateY(${(1 - lineP) * 22}px) scale(${0.9 + 0.1 * lineP})`,
          }}
        >
          ছোটদের বালক ঠাকুরের গল্প
        </div>
        <div
          style={{
            marginTop: 26,
            width: 440,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${CARD_PALETTE.gold}, transparent)`,
            transform: `scaleX(${clamp01(ruleP)})`,
          }}
        />
      </div>

      <GhibliEp6GlimpseOverlay />

      <div style={{ position: "absolute", inset: 0, background: CARD_PALETTE.night, opacity: dark, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
