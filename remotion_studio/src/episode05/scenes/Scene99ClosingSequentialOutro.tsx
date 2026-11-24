import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SeriesOutro } from "../../episode/SeriesCards";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { clamp, EASE } from "../../cinematic/core/anim";
import { Grade, Layer, Stage, type Cam } from "../../cinematic/core/Stage";
import { UJANCHAR, UJANCHAR_BG, UjancharBackdrop, UjancharLightLayer, ujancharGrade, ujancharKeepInSet } from "../../cinematic/sets/UjancharHouse";
import { StandingChild, standingChildJoints, type StandingChildProps } from "../rig/StandingChild";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { EP05_SCENES } from "../timing";
import { EP05_CUES } from "../subtitles";

/**
 * Episode 5 · Scene 99: the closing dawn card (the shared series outro, src/episode/SeriesCards.tsx, TTL-09) with
 * the soft next-episode glimpse (TTL-10a, TTL-11). As in Episode 4 there is no separate 98 segment: the glimpse is a
 * layer inside the outro, which runs to the episode's last frame (TTL-12: no empty end hold).
 *
 * The glimpse (plan "Scene 99", decision 14): Episode 6 ("জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী", the manifest's
 * next_episode_title_bn and this outro's narration) as one calm painted moment: six-year-old Balak in the BAL-26 plate
 * design (StandingChild, pose standQuiet) standing quietly on the veranda of the family's Ujanchar house by a bamboo
 * veranda post, in warm low gold light (the shared UjancharHouse set, "dawn" light read as evening gold); on the
 * ground at the foot of the plinth below him rests a pair of wooden khadam, his father's sandals (chapter 10's
 * "বাবার 'খড়মের' শব্দ"). His restrained halo only (BirulGlow, steady, soft falloff, BAL-05 to BAL-07); no glow on
 * anything else. It sits in the same feathered, dreamlike oval as Episodes 3 and 4 with no frame, border or backing,
 * melting into the outro background, fades in on the narration's "আসছে পরের পর্ব" line, drifts and zooms very
 * slightly, and fades out before the outro's own fade to dark. The label "পর্ব ছয়" and the episode name sit on its
 * lower feathered edge in glowing cream-gold Baloo Da 2 (TTL-01), with no dark backing. Geometry and timing as
 * Episode 4's glimpse.
 */

const OUTRO = EP05_SCENES.find((s) => s.sceneId === "99_closing_sequential_outro");
const OUTRO_START = OUTRO?.startFrame ?? 2226;
/** The outro's whole on-screen length (it is the last scene, so it runs to the episode's end). */
const FRAMES = OUTRO?.durationFrames ?? 623;

/** The glimpse opens on the narration's "আসছে পরের পর্ব" line (outro-local frame). */
const NEXT_CUE = EP05_CUES.find((c) => c.text.includes("আসছে পরের পর্ব"));
const PREVIEW_AT = NEXT_CUE ? NEXT_CUE.from - OUTRO_START : 245;
const FADE_IN = 30;
const FADE_OUT = 30;
/** Gone before SeriesOutro's fade to dark, which starts about 40 frames (scaled) before the end. */
const PREVIEW_END = FRAMES - 52;
const FADE_OUT_AT = PREVIEW_END - FADE_OUT;

/* Vignette geometry, the same as Episodes 2 to 4: centred under the series title, feathered to nothing. */
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

const EP6_LABEL = "পর্ব ছয়";
const EP6_NAME = "জ্যেষ্ঠ ভ্রাতাকে উদ্ধার ও খেলার সাথী";

/* ------------------------------------------------------------------ */
/* The painted moment: the Ujanchar veranda in low gold light            */
/* ------------------------------------------------------------------ */

/**
 * Everything below is on the hut's 0.65 plane (UjancharHouse: veranda floor HUT.top 806, plinth foot HUT.bottom 852,
 * posts at DOOR.x - 120 = 740 and others, door at DOOR.x 860). Balak stands on the veranda just right of the post at
 * 740, between it and the open door; the khadam rest on the earth at the plinth's foot below him.
 */
const HUT = UJANCHAR.HUT;
const POST_X = UJANCHAR.DOOR.x - 120;
const BALAK = { x: POST_X + 36, y: HUT.top + 2, s: 0.28 };
const KHADAM = { x: POST_X + 56, y: HUT.bottom + 8, s: 1.15 };

/**
 * The camera: a close view of that corner of the veranda (kept inside the set by ujancharKeepInSet; no floor plane is
 * drawn, so a zoom past the set's usual 3 shows no edge). FOCUS is the 0.65-plane point at the frame centre, low
 * enough that the khadam sit above the label on the vignette's lower edge.
 */
const FOCUS = { x: POST_X + 56, y: 765 };
const CAM_ZOOM = 4;
const GLIMPSE_CAM: Cam = ujancharKeepInSet({
  x: (FOCUS.x - 960) / UJANCHAR.PLANES.yard,
  y: (FOCUS.y - 540) / UJANCHAR.PLANES.yard,
  zoom: CAM_ZOOM,
});

/** One wooden khadam (খড়ম): a flat wooden sole seen three-quarter on, with the toe peg and its round knob. */
const KhadamOne: React.FC<{ x: number; y: number; s: number; rot: number; seed: number }> = ({ x, y, s, rot, seed }) => {
  const L = 26;
  const Wd = 9;
  const T = 3;
  // the sole outline, a rounded wooden plank in perspective (heel at -L/2, toe at +L/2)
  const top = `M ${-L / 2} ${-Wd / 2 + 1} Q ${-L / 2 - 2} 0 ${-L / 2} ${Wd / 2 - 1} L ${L / 2 - 3} ${Wd / 2} Q ${L / 2 + 2} 0 ${L / 2 - 3} ${-Wd / 2} Z`;
  const side = `M ${-L / 2} ${Wd / 2 - 1} L ${L / 2 - 3} ${Wd / 2} L ${L / 2 - 3} ${Wd / 2 + T} L ${-L / 2} ${Wd / 2 - 1 + T} Z`;
  const peg = { x: L / 2 - 8, y: 0 };
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <ellipse cx={1} cy={Wd / 2 + T + 1} rx={L / 2 + 2} ry={2.6} fill="#3a2414" opacity={0.35} />
      <path d={side} fill="#5a3a1e" />
      <path d={top} fill={seed ? "#9a6a3c" : "#94643a"} />
      {/* the wood's grain and the worn heel */}
      <path d={`M ${-L / 2 + 3} -1 Q 0 ${-2 + seed} ${L / 2 - 6} -0.5`} stroke="#7a5230" strokeWidth={0.6} fill="none" opacity={0.6} />
      <ellipse cx={-L / 2 + 6} cy={0.5} rx={4} ry={2.2} fill="#7e5430" opacity={0.45} />
      <path d={top} fill="none" stroke="#c89a62" strokeWidth={0.5} opacity={0.35} />
      {/* the toe peg (বোল) with its round knob, caught by the low light */}
      <rect x={peg.x - 0.9} y={peg.y - 6} width={1.8} height={6} fill="#6a4426" />
      <circle cx={peg.x} cy={peg.y - 7} r={2.2} fill="#8a5a32" />
      <circle cx={peg.x + 0.7} cy={peg.y - 7.7} r={0.9} fill="#e0b274" opacity={0.7} />
    </g>
  );
};

/** The pair, set down side by side, toes toward the yard. */
const Khadam: React.FC = () => (
  <g>
    <KhadamOne x={KHADAM.x - 9 * KHADAM.s} y={KHADAM.y - 1} s={KHADAM.s} rot={-8} seed={0} />
    <KhadamOne x={KHADAM.x + 9 * KHADAM.s} y={KHADAM.y + 3} s={KHADAM.s} rot={-3} seed={1} />
  </g>
);

/** Balak's pose: standing quietly, hands loosely together, eyes a little low (StandingChild standQuiet). */
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

/** His faint ground glow, his halo behind the head (steady, BAL-06/07), then the child. */
const Balak: React.FC<{ f: number }> = ({ f }) => {
  const p = balakProps(f);
  const j = standingChildJoints(p);
  return (
    <g>
      <defs>
        <radialGradient id="ep6g-groundglow">
          <stop offset="0" stopColor="#FFF0C8" stopOpacity={0.32} />
          <stop offset="1" stopColor="#FFF0C8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={BALAK.x} cy={BALAK.y + 1} rx={44} ry={7} fill="url(#ep6g-groundglow)" />
      <BirulGlow cx={j.head.x} cy={j.head.y} r={150 * BALAK.s} glow={0.8} f={f} />
      <StandingChild {...p} />
    </g>
  );
};

/** A low evening-gold light from the right, across the veranda (screen), over the set and the child. */
const LowGold: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background: "radial-gradient(ellipse 70% 90% at 100% 40%, rgba(255,186,96,0.3) 0%, rgba(255,160,80,0.1) 50%, rgba(0,0,0,0) 85%)",
      mixBlendMode: "screen",
    }}
  />
);

/** The painted Episode 6 moment: the Ujanchar veranda corner, Balak by the post, the khadam below. */
const VerandaGlimpse: React.FC<{ f: number }> = ({ f }) => (
  <Stage cam={GLIMPSE_CAM} background={UJANCHAR_BG.dawn}>
    <UjancharBackdrop f={f + 200} time="dawn" cam={GLIMPSE_CAM} calm={0.6} fenceJaba={false} />
    <Layer depth={UJANCHAR.PLANES.yard}>
      <Khadam />
      <Balak f={f} />
    </Layer>
    <UjancharLightLayer f={f + 200} time="dawn" level={0.4} />
    <LowGold />
    <Grade {...ujancharGrade("dawn")} />
  </Stage>
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
            <VerandaGlimpse f={local} />
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

export const Scene99ClosingSequentialOutro: React.FC = () => (
  <AbsoluteFill>
    <SeriesOutro closing="ছোটদের বালক ঠাকুরের গল্প" frames={FRAMES} />
    <NextEpisodeGlimpse />
  </AbsoluteFill>
);
