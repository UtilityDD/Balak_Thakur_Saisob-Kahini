import React from "react";
import { useCurrentFrame } from "remotion";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { clamp, EASE } from "../../cinematic/core/anim";
import { CARD_PALETTE } from "../../episode/SeriesCards";
import { EP03_SCENES } from "../timing";
import { EP03_CUES } from "../subtitles";

/**
 * Episode 3 · next-episode glimpse (TTL-10a, TTL-11), as Episode 2's outro does it.
 *
 * The 98 segment (2695-2863) no longer plays as a full-screen scene. The outro (scene 99) keeps drawing its
 * sunset through the 98 segment, and this glimpse is a layer inside the outro: a calm, divine moment of
 * Episode 4 (a clay Shivalinga by the pond at sunset, a small lamp burning beside it, a coconut offered at its
 * foot) in a feathered, dreamlike oval with no frame, border or backing, melting into the sunset. It fades in
 * on the narration's "আসছে পরের পর্ব" line (outro local 316), drifts and zooms very slightly, and fades out
 * before the outro's own fade to dark at the very end of the episode. The label "পর্ব চার" and the episode name
 * "শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক" (the title in Episode 4's scenes_manifest.json and SRT, and the one the outro
 * narration says) sit on the lower feathered edge in glowing cream-gold Baloo Da 2, with no dark backing.
 */

const OUTRO = EP03_SCENES.find((s) => s.sceneId === "99_closing_sequential_outro");
const NEXT = EP03_SCENES.find((s) => s.sceneId === "98_next_episode");
const OUTRO_START = OUTRO?.startFrame ?? 1992;
/** The outro's whole on-screen length, including the 98 segment it now carries (871 frames). */
export const OUTRO_WITH_GLIMPSE_FRAMES = (NEXT ? NEXT.startFrame + NEXT.durationFrames : OUTRO_START + 871) - OUTRO_START;
const FRAMES = OUTRO_WITH_GLIMPSE_FRAMES;

/** The glimpse opens on the narration's "আসছে পরের পর্ব" line (outro-local frame). */
const NEXT_CUE = EP03_CUES.find((c) => c.text.includes("আসছে পরের পর্ব"));
const PREVIEW_AT = NEXT_CUE ? NEXT_CUE.from - OUTRO_START : 316;
const FADE_IN = 30;
const FADE_OUT = 30;
/** Gone before SeriesOutro's fade to dark, which starts about 50 frames before the end. */
const PREVIEW_END = FRAMES - 52;
const FADE_OUT_AT = PREVIEW_END - FADE_OUT;

/* Vignette geometry, the same as Episode 2's outro: centred under the series title, feathered to nothing. */
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

const EP4_LABEL = "পর্ব চার";
const EP4_NAME = "শিবলিঙ্গ-গোবিন্দ ও নারিকেলোদক";

const HORIZON = 640;

/** Coconut palm: a curved trunk, a crown of swaying fronds and a few coconuts. */
const Palm: React.FC<{ x: number; base: number; top: number; lean: number; s: number; f: number; color: string; seed: number }> = ({
  x,
  base,
  top,
  lean,
  s,
  f,
  color,
  seed,
}) => {
  const cx = x + lean;
  const angles = [-165, -130, -95, -60, -25, 10, 45];
  return (
    <g>
      <path d={`M ${x} ${base} Q ${x - 46 * s} ${(base + top) / 2} ${cx} ${top}`} stroke={color} strokeWidth={20 * s} strokeLinecap="round" fill="none" />
      {angles.map((a, i) => {
        const sway = Math.sin(f * 0.04 + seed + i) * 4;
        const len = (150 + ((i * 37 + seed * 11) % 40)) * s;
        return (
          <g key={i} transform={`translate(${cx} ${top}) rotate(${a + sway})`}>
            <path d={`M 0 0 Q ${len * 0.5} ${-len * 0.42} ${len} ${len * 0.22}`} stroke={color} strokeWidth={12 * s} strokeLinecap="round" fill="none" />
          </g>
        );
      })}
      {[-9, 6, 0].map((dx, i) => (
        <circle key={i} cx={cx + dx * s} cy={top + (14 + (i % 2) * 6) * s} r={11 * s} fill={color} />
      ))}
    </g>
  );
};

/** A small clay Shivalinga on its base, a few flowers on it, backlit by the low sun with a warm rim. */
const ClayShivalinga: React.FC<{ x: number; y: number; f: number }> = ({ x, y, f }) => {
  const glow = 0.5 + 0.08 * Math.sin(f * 0.045);
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={-90} rx={230} ry={170} fill="url(#ep4-halo)" opacity={glow} />
      <ellipse cx={0} cy={8} rx={170} ry={26} fill={CARD_PALETTE.roseDeep} opacity={0.9} />
      {/* base (the yoni platform) with its spout toward the pond */}
      <path d="M -118 -6 Q -122 -40 -84 -46 L 84 -46 Q 122 -40 118 -6 Q 60 10 0 10 Q -60 10 -118 -6 Z" fill="#7A3A2C" />
      <path d="M 118 -26 L 176 -18 Q 184 -10 174 -4 L 112 -6 Z" fill="#7A3A2C" />
      <path d="M -84 -46 L 84 -46 Q 122 -40 118 -6" stroke="#F7CF6E" strokeWidth={3} fill="none" opacity={0.5} />
      {/* the linga: a rounded clay form */}
      <path d="M -50 -46 L -50 -148 Q -50 -206 0 -206 Q 50 -206 50 -148 L 50 -46 Z" fill="#8A4632" />
      <path d="M 50 -148 Q 50 -206 0 -206" stroke="#FFE3A0" strokeWidth={4} fill="none" opacity={0.6} />
      <path d="M 50 -46 L 50 -148" stroke="#F7CF6E" strokeWidth={3} fill="none" opacity={0.4} />
      {/* three soft lines of sandal paste and a few flowers */}
      {[-150, -140, -130].map((yy) => (
        <path key={yy} d={`M -30 ${yy} Q 0 ${yy - 4} 30 ${yy}`} stroke="#FBEFD4" strokeWidth={3} fill="none" opacity={0.55} />
      ))}
      {[
        [-26, -48, "#F2A03E"],
        [-6, -50, "#FBEFD4"],
        [16, -48, "#E0703A"],
        [34, -47, "#F2A03E"],
      ].map(([cx, cy, c], i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r={8} fill={c as string} />
      ))}
    </g>
  );
};

/** A green coconut offered at the foot of the Shivalinga. */
const Coconut: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={4} rx={44} ry={9} fill={CARD_PALETTE.roseDeep} opacity={0.8} />
    <ellipse cx={0} cy={-26} rx={34} ry={30} fill="#5E6A2E" />
    <path d="M 22 -48 Q 36 -30 30 -8" stroke="#F7CF6E" strokeWidth={3} fill="none" opacity={0.45} />
    <ellipse cx={-4} cy={-52} rx={9} ry={5} fill="#7E8A3E" />
  </g>
);

/** A small clay lamp with a calm, gently breathing flame. */
const Diya: React.FC<{ x: number; y: number; f: number }> = ({ x, y, f }) => {
  const flick = 1 + 0.06 * Math.sin(f * 0.21) + 0.04 * Math.sin(f * 0.37 + 1.3);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={-30} r={70} fill="url(#ep4-flame-glow)" opacity={0.75} />
      <path d="M -30 -8 Q 0 10 30 -8 L 22 -18 L -22 -18 Z" fill="#7A3A2C" />
      <path d="M -22 -18 L 22 -18" stroke="#F7CF6E" strokeWidth={2} opacity={0.6} />
      <g transform={`translate(0 -18) scale(1 ${flick.toFixed(3)})`}>
        <path d="M 0 -30 Q 9 -14 0 0 Q -9 -14 0 -30 Z" fill="#FFD27A" />
        <path d="M 0 -18 Q 4 -9 0 -2 Q -4 -9 0 -18 Z" fill="#FFF4D0" />
      </g>
    </g>
  );
};

/** Warm village glimpse: sunset sky, low sun, far ridge, a pond with shimmer, palms and the clay Shivalinga. */
const VillageGlimpse: React.FC<{ f: number; life: number }> = ({ f, life }) => {
  const cam = 1 + 0.04 * life;
  const sunGlow = 0.85 + 0.1 * Math.sin(f * 0.05);
  const ridge = `M -200 ${HORIZON - 30} Q 120 ${HORIZON - 96} 420 ${HORIZON - 40} T 960 ${HORIZON - 52} T 1500 ${HORIZON - 34} T ${W + 200} ${HORIZON - 70} L ${W + 200} ${H + 80} L -200 ${H + 80} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="ep4-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E2448" />
          <stop offset="0.35" stopColor="#B8485E" />
          <stop offset="0.62" stopColor={CARD_PALETTE.saffronDeep} />
          <stop offset="0.84" stopColor={CARD_PALETTE.saffron} />
          <stop offset="1" stopColor="#F7CF6E" />
        </linearGradient>
        <radialGradient id="ep4-glow">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity={0.9} />
          <stop offset="0.3" stopColor="#F7C35A" stopOpacity={0.45} />
          <stop offset="1" stopColor={CARD_PALETTE.saffron} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ep4-halo">
          <stop offset="0" stopColor="#FFF0C4" stopOpacity={0.55} />
          <stop offset="0.5" stopColor="#FFD98A" stopOpacity={0.22} />
          <stop offset="1" stopColor="#F2A03E" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ep4-flame-glow">
          <stop offset="0" stopColor="#FFE7A0" stopOpacity={0.8} />
          <stop offset="1" stopColor="#F2A03E" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ep4-sun">
          <stop offset="0" stopColor="#FFE9A8" />
          <stop offset="1" stopColor="#F5B94E" />
        </radialGradient>
        <linearGradient id="ep4-pond" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5B94E" />
          <stop offset="0.5" stopColor="#B8485E" />
          <stop offset="1" stopColor="#6E2448" />
        </linearGradient>
        <linearGradient id="ep4-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E3556" />
          <stop offset="1" stopColor="#3E1226" />
        </linearGradient>
      </defs>
      <g transform={`translate(${W / 2} ${H / 2}) scale(${cam}) translate(${-W / 2} ${-H / 2})`}>
        <rect x={-200} y={-200} width={W + 400} height={HORIZON + 200} fill="url(#ep4-sky)" />
        <circle cx={1100} cy={560} r={440} fill="url(#ep4-glow)" opacity={sunGlow} />
        <circle cx={1100} cy={560} r={90} fill="url(#ep4-sun)" />
        <path d={ridge} fill={CARD_PALETTE.roseDeep} opacity={0.85} />
        <rect x={-200} y={HORIZON} width={W + 400} height={H + 200 - HORIZON} fill="url(#ep4-ground)" />
        <Palm x={1560} base={760} top={460} lean={-30} s={0.75} f={f} color={CARD_PALETTE.roseDeep} seed={4} />
        <ellipse cx={960} cy={850} rx={500} ry={104} fill="url(#ep4-pond)" opacity={0.92} />
        <ellipse cx={960} cy={850} rx={500} ry={104} fill="none" stroke="#F3D27A" strokeWidth={3} opacity={0.4} />
        {Array.from({ length: 7 }, (_, i) => {
          const w = 340 - i * 34;
          return (
            <rect
              key={i}
              x={1000 - w / 2 + Math.sin(f * 0.03 + i) * 12}
              y={806 + i * 18}
              width={w}
              height={4}
              rx={2}
              fill="#FFE7A0"
              opacity={0.45 + Math.sin(f * 0.05 + i) * 0.22}
            />
          );
        })}
        <ClayShivalinga x={960} y={738} f={f} />
        <Diya x={790} y={738} f={f} />
        <Coconut x={1150} y={740} />
        <Palm x={430} base={900} top={430} lean={40} s={1} f={f} color={CARD_PALETTE.roseInk} seed={1} />
      </g>
    </svg>
  );
};

/** The soft glimpse layer, drawn by the outro scene over its sunset. Reads the outro's local frame. */
export const NextEpisodeGlimpse: React.FC = () => {
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
            <VillageGlimpse f={local} life={life} />
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

/**
 * The 98 segment itself draws nothing: the outro (scene 99) runs on under it with the glimpse above, so the
 * episode's length is unchanged and the next episode is never shown as a full-screen scene.
 */
export const Scene98NextEpisode: React.FC = () => null;
