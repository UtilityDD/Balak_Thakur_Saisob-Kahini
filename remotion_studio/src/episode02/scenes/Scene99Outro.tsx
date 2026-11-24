import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { BN_FONT } from "../../cinematic/fonts";
import { clamp, EASE, hash } from "../../cinematic/core/anim";
import { CARD_PALETTE, SeriesOutro } from "../../episode/SeriesCards";
import { Scene02FlowersOnOwnFeet } from "../../episode03/scenes/Scene02FlowersOnOwnFeet";
import { EP02_SCENES } from "../timing";

/**
 * Episode 2 · Scene 99 — closing dawn card (766 frames, read from EP02_SCENES at runtime) with the next-episode glimpse
 * as a soft, dreamlike vignette (no frame, border or shadow).
 * The sunset, series title and narration captions are the shared SeriesOutro, unchanged. Over the sunset,
 * from local frame 344 (the "আসছে পরের পর্ব" line of the narration), Episode 3's tulsi scene (from its local frame 240,
 * Balak's namaste) slowly melts in centred under the series title: about 66% of the frame wide, masked by a feathered
 * ellipse so every edge dissolves into the sky, with the sunset's warm light washing over its rim. It fades in over
 * 30 frames (with a brief soft-focus that clears), drifts gently and zooms very slightly while on screen, and fades out
 * by frame 716, before the sunset starts to fade to dark at frame 725.
 * Its title "পর্ব তিন" and the episode name sit on the lower feathered edge in cream-gold Baloo Da 2 with a soft glow,
 * fading in a moment after the glimpse.
 *
 * Camera (sunset artwork only; title, fade and glimpse do not follow it): a slow eased 60 px pan across the
 * whole outro, a 1.00 -> 1.04 push-in while the glimpse is on screen, shimmer on the sun's reflection,
 * and soft light motes plus a few birds crossing the sky in the first half.
 */

const SCENE = EP02_SCENES.find((s) => s.sceneId === "99_closing_sequential_outro");
/** Length of the outro as authored; the preview's fade-out is measured back from the real end. */
const CONTENT_END = 766;
/** The scene's real length (SeriesOutro's fade to dark, the pan and the ambient layer all run on it). */
const FRAMES = SCENE?.durationFrames ?? CONTENT_END;

const PREVIEW_AT = 344; // preview starts on Balak's namaste (narration cue), and the glimpse runs from its own frame 0
const FADE_IN = 30;
const FADE_OUT_AT = FRAMES - (CONTENT_END - 690); // 690 at 766 frames: always 76 frames before the end
const FADE_OUT = 26;
const PREVIEW_END = FADE_OUT_AT + FADE_OUT; // 716 at 766 frames, before the sunset's fade to dark (about 722)

/*
 * The vignette: a 1270 x 660 area (about 66% of the frame width) centred under the series title (which ends
 * near y 330). It has no edges of its own: an elliptical mask feathers it to transparent long before its box,
 * so the visible picture is a soft oval that dissolves into the sky and river.
 */
const VIG_W = 1270;
const VIG_H = 660;
const VIG_LEFT = (1920 - VIG_W) / 2; // 325
const VIG_TOP = 300;
const SRC_W = 1920;
const SRC_H = 1080;
/** Cover-fit the 1920 x 1080 glimpse into the vignette, centred. */
const SCALE = Math.max(VIG_W / SRC_W, VIG_H / SRC_H);
const DX = (VIG_W - SRC_W * SCALE) / 2;
const DY = (VIG_H - SRC_H * SCALE) / 2;

/** Feathered oval: solid in the middle, melting to nothing well inside the vignette's box. */
const VIG_MASK =
  "radial-gradient(ellipse closest-side at 50% 48%, #000 0%, #000 42%, rgba(0,0,0,0.82) 58%, rgba(0,0,0,0.45) 74%, rgba(0,0,0,0.14) 88%, rgba(0,0,0,0) 100%)";
/** The sunset's warm light washing over the glimpse's rim (clear in the centre, saffron-gold at the edges). */
const VIG_WASH =
  "radial-gradient(ellipse closest-side at 50% 48%, rgba(255,226,160,0) 30%, rgba(255,206,130,0.16) 52%, rgba(247,170,84,0.42) 76%, rgba(242,150,60,0.7) 100%)";

const DRIFT_X = 14; // px, right -> left across the glimpse's life
const DRIFT_Y = 6; // px, a slight rise
const ZOOM = 0.035; // 1.00 -> 1.035
const BLUR_IN = 5; // px of soft focus at the first frame, clearing as it fades in

const LABEL_DELAY = 14; // frames after the glimpse begins
const LABEL_FADE = 26;
const LABEL_TOP = 818; // on the lower feathered edge, clear of the narration captions

const labelShadow =
  "0 1px 2px rgba(70,22,10,0.85), 0 0 10px rgba(70,22,10,0.55), 0 0 26px rgba(255,190,110,0.55), 0 0 48px rgba(255,170,90,0.35)";

const PreviewLayer: React.FC = () => {
  const f = useCurrentFrame();
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

  if (f < PREVIEW_AT || f >= PREVIEW_END) return null;

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
              width: SRC_W,
              height: SRC_H,
              transformOrigin: "0 0",
              transform: `translate(${DX}px, ${DY}px) scale(${SCALE})`,
            }}
          >
            <Sequence from={PREVIEW_AT} durationInFrames={PREVIEW_END - PREVIEW_AT} layout="none">
              {/* The glimpse plays Episode 3 scene 02 from its local 100 (absolute 1102): Balak watering the tulsi,
                  gathering the hibiscus, laying them on his own feet and his pranam (1288-1328), ending on him
                  seated serenely with the flowers at his feet (372 frames, to about 1474). It starts after the
                  opening wide shot and must end before the girls' wide shot (about 1500); re-check this window
                  whenever Episode 3's staging changes. */}
              <Sequence from={-100} layout="none">
                <Scene02FlowersOnOwnFeet />
              </Sequence>
            </Sequence>
          </div>
        </div>
        {/* Warm sunset light over the rim, so the glimpse belongs to the evening around it. */}
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
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: 2,
            color: "#FFDB8E",
            textShadow: labelShadow,
          }}
        >
          পর্ব তিন
        </div>
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
          পাঁচ বছরের মুখে অমূল্য তত্ত্ব
        </div>
      </div>
    </>
  );
};

/*
 * Gentle camera on the sunset only. The camera transform is applied to the SeriesOutro artwork <svg>
 * through a CSS custom property, so the series title, its rule and the shared fade to dark are untouched,
 * and the next-episode glimpse (a later sibling) keeps its own gentle drift.
 *   - pan: +30 px -> -30 px across the whole outro (60 px travel, eased in-out)
 *   - push-in: 1.00 -> 1.04 while the preview is on screen (344 -> 716), then holds
 *   - base scale 1.034 keeps the panned artwork covering the frame: (1.034 - 1) * 960 = 32.6 px > 30 px
 */
const W = 1920;
const H = 1080;
const HORIZON = 648;
const PAN = 30;
const BASE_SCALE = 1.034;
const PUSH = 0.04;
const CAM_CLASS = "ep02-outro-cam";

/** Mirrors SeriesOutro's own timing so the overlay sits on the same fade and the same internal dolly. */
const OUTRO_BASE = 704;
const K = FRAMES / OUTRO_BASE;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;

const outerCamera = (f: number) => {
  const panX = PAN - 2 * PAN * EASE.inOut(clamp(f / FRAMES));
  const push = 1 + PUSH * EASE.inOut(clamp((f - PREVIEW_AT) / (PREVIEW_END - PREVIEW_AT)));
  return { panX, scale: BASE_SCALE * push };
};

const BIRDS_FROM = 36;
const BIRDS_TO = 340;
const BIRDS = [
  { dx: 0, dy: 0, s: 18, ph: 0.0 },
  { dx: 62, dy: -24, s: 15, ph: 1.7 },
  { dx: 98, dy: 20, s: 14, ph: 3.1 },
  { dx: 156, dy: -6, s: 12, ph: 4.4 },
];

const MOTES = Array.from({ length: 18 }, (_, i) => ({
  x0: 80 + hash(i * 5 + 1) * (W - 160),
  y0: 140 + hash(i * 5 + 2) * 740,
  r: 2.5 + hash(i * 5 + 3) * 4,
  rise: 0.05 + hash(i * 5 + 4) * 0.1,
  ph: hash(i * 5 + 5) * Math.PI * 2,
  depth: 0.2 + hash(i * 5 + 6) * 0.5,
}));
const MOTES_OUT_FROM = 300;
const MOTES_OUT_LEN = 100;

const GLINTS = Array.from({ length: 24 }, (_, i) => ({
  y: HORIZON + 14 + hash(i * 7 + 11) * 280,
  u: hash(i * 7 + 12) * 2 - 1,
  len: 10 + hash(i * 7 + 13) * 26,
  rate: 0.06 + hash(i * 7 + 14) * 0.08,
  ph: hash(i * 7 + 15) * Math.PI * 2,
}));

/** Sun shimmer, light motes and birds, drawn on the same camera as the sunset artwork. */
const AmbientLayer: React.FC = () => {
  const f = useCurrentFrame();
  const p = clamp(f / FRAMES);
  // SeriesOutro's internal dolly and parallax, so the shimmer lies on its sun reflection.
  const innerCam = 1.06 - 0.06 * easeInOutSine(p);
  const camX = (1 - easeInOutSine(p)) * 36 - 18;
  const visible = Math.min(clamp(f / (64 * K)), clamp((FRAMES - f) / (40 * K)));
  const sunLift = easeInOutSine(p);

  const motesEnv = 1 - EASE.inOut(clamp((f - MOTES_OUT_FROM) / MOTES_OUT_LEN));
  const birdsT = (f - BIRDS_FROM) / (BIRDS_TO - BIRDS_FROM);
  const birdsEnv = Math.min(clamp(birdsT / 0.08), clamp((1 - birdsT) / 0.08));

  return (
    <svg
      className={CAM_CLASS}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: visible }}
    >
      <defs>
        <radialGradient id="ep02oc-mote">
          <stop offset="0" stopColor="#FFF1C8" stopOpacity={0.95} />
          <stop offset="0.35" stopColor="#FFD98A" stopOpacity={0.4} />
          <stop offset="1" stopColor="#F2A03E" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ep02oc-pool">
          <stop offset="0" stopColor="#FFF0B8" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFE7A0" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Shimmer on the water, on SeriesOutro's own camera and river parallax. */}
      <g transform={`translate(${W / 2} ${H / 2}) scale(${innerCam}) translate(${-W / 2} ${-H / 2})`}>
        <g transform={`translate(${camX * 0.5} 0)`}>
          <ellipse
            cx={W / 2}
            cy={HORIZON + 120}
            rx={150 + 20 * Math.sin(f * 0.021)}
            ry={118}
            fill="url(#ep02oc-pool)"
            opacity={0.35 + 0.25 * sunLift + 0.06 * Math.sin(f * 0.043)}
          />
          {GLINTS.map((g, i) => {
            const half = 36 + (g.y - HORIZON) * 0.42;
            const x = W / 2 + g.u * half + Math.sin(f * 0.018 + g.ph) * 14;
            const tw = Math.pow(0.5 + 0.5 * Math.sin(f * g.rate + g.ph), 3);
            const len = g.len * (0.7 + 0.3 * tw);
            return (
              <rect
                key={i}
                x={x - len / 2}
                y={g.y}
                width={len}
                height={2.6}
                rx={1.3}
                fill="#FFF6D2"
                opacity={0.12 + 0.68 * tw}
              />
            );
          })}
        </g>
      </g>

      {/* Birds crossing the sky right to left in the first half, gone before the preview opens. */}
      {birdsEnv > 0 && (
        <g opacity={0.72 * birdsEnv}>
          {BIRDS.map((b, i) => {
            const t = clamp(birdsT);
            const x = W + 140 - (W + 460) * t + b.dx + Math.sin(f * 0.03 + b.ph) * 4;
            const y = 420 - 40 * t + b.dy + Math.sin(f * 0.05 + b.ph) * 5;
            const flap = 0.3 + 0.7 * Math.sin(f * 0.3 + b.ph);
            const ty = -b.s * 0.42 * flap;
            const d = `M ${-b.s} ${ty.toFixed(2)} Q ${(-b.s * 0.5).toFixed(2)} ${(-b.s * 0.2).toFixed(2)} 0 ${(b.s * 0.08).toFixed(2)} Q ${(b.s * 0.5).toFixed(2)} ${(-b.s * 0.2).toFixed(2)} ${b.s} ${ty.toFixed(2)}`;
            return (
              <path
                key={i}
                transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
                d={d}
                fill="none"
                stroke={CARD_PALETTE.roseInk}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </g>
      )}

      {/* Soft light motes drifting upward through the first half. */}
      {motesEnv > 0 && (
        <g opacity={motesEnv}>
          {MOTES.map((m, i) => {
            const x = m.x0 + Math.sin(f * 0.009 + m.ph) * 34 + f * 0.04 * m.depth;
            const y = m.y0 - f * m.rise + Math.sin(f * 0.013 + m.ph * 2) * 10;
            const tw = 0.5 + 0.5 * Math.sin(f * 0.045 + m.ph * 3);
            return (
              <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} opacity={0.25 + 0.5 * tw}>
                <circle r={m.r * 4.5} fill="url(#ep02oc-mote)" />
                <circle r={m.r * 0.6} fill="#FFF6DC" opacity={0.8} />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

export const Scene99Outro: React.FC = () => {
  const f = useCurrentFrame();
  const { panX, scale } = outerCamera(f);
  const camStyle = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    zIndex: 0,
    ["--ep02-cam" as string]: `translateX(${panX.toFixed(2)}px) scale(${scale.toFixed(5)})`,
  } as React.CSSProperties;

  return (
    <AbsoluteFill>
      <style>{`.${CAM_CLASS}-root > div > svg, .${CAM_CLASS}-root svg.${CAM_CLASS} { transform: var(--ep02-cam); transform-origin: 50% 50%; }`}</style>
      <div className={`${CAM_CLASS}-root`} style={camStyle}>
        <SeriesOutro closing="ছোটদের বালক ঠাকুরের গল্প" frames={FRAMES} />
        <AmbientLayer />
      </div>
      <PreviewLayer />
    </AbsoluteFill>
  );
};
