import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SeriesOutro } from "../../episode/SeriesCards";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { clamp, EASE } from "../../cinematic/core/anim";
import { Grade, Stage } from "../../cinematic/core/Stage";
import {
  PATHSHALA,
  PATHSHALA_BG,
  PathshalaBackdrop,
  PathshalaFloorLayer,
  PathshalaLightLayer,
  PathshalaSchoolLayer,
  Slate,
  pathshalaGrade,
  pathshalaKeepInSet,
} from "../../cinematic/sets/LababuPathshala";
import { SeatedChild, seatedChildHands, type SeatedChildProps } from "../../episode03/rig/SeatedChild";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { cueLocalStory6 } from "../../episode/storyClock";
import { EP06_SCENES } from "../timing";

/**
 * Episode 6 · Scene 99: the closing dawn card (the shared series outro, src/episode/SeriesCards.tsx, TTL-09) with
 * the soft next-episode glimpse (TTL-10a, TTL-11). As in Episodes 4 and 5 there is no separate 98 segment: the glimpse
 * is a layer inside the outro, which runs to the episode's last frame (TTL-12: no empty end hold). No pauses, no
 * camera changes.
 *
 * The glimpse (plan "Scene 99", decision 17): Episode 7 ("লববাবুর পাঠশালা", the manifest's next_episode_title_bn and
 * this outro's narration) as one calm painted moment from chapter 13's own description, with no new character:
 * Lababu's new four-sloped tin pathshala with its painted bamboo-mat walls (src/cinematic/sets/LababuPathshala.tsx,
 * the Ujanchar world, a mango tree beside it), seen through its wide open doorway: the palm-leaf mats with slates in
 * the front row, the গাছা stumps, the raised bamboo মাচা at the back, the teacher's low desk with the cane resting on
 * it. No Lababu. Six-year-old Balak in the BAL-26 plate design (SeatedChild sitCross, plate, age 6) sits on the front
 * mat with his slate on his lap, eyes on it, in soft morning light falling in through the door; his restrained halo
 * only (BirulGlow, steady, soft falloff, BAL-05 to BAL-07). The same feathered, dreamlike oval as Episodes 3 to 5 with
 * no frame, border or backing, melting into the outro background; it fades in on the narration's "আসছে পরের পর্ব"
 * line (cueLocalStory6), drifts and zooms very slightly, and fades out before the outro's own fade to dark. The label
 * "পর্ব সাত" and the episode name sit on its lower feathered edge in glowing cream-gold Baloo Da 2 (TTL-01), with no
 * dark backing. Geometry and timing as Episode 5's glimpse.
 */

const OUTRO_ID = "99_closing_sequential_outro";
const OUTRO = EP06_SCENES.find((s) => s.sceneId === OUTRO_ID);
/** The outro's whole on-screen length (it is the last scene, so it runs to the episode's end). */
const FRAMES = OUTRO?.durationFrames ?? 596;

/** The glimpse opens on the narration's "আসছে পরের পর্ব" line (outro-local story frame; the outro has no pauses). */
const PREVIEW_AT = cueLocalStory6("আসছে পরের পর্ব", OUTRO_ID)?.from ?? 274;
const FADE_IN = 30;
const FADE_OUT = 30;
/** Gone before SeriesOutro's fade to dark, which starts about 40 frames (scaled) before the end. */
const PREVIEW_END = FRAMES - 52;
const FADE_OUT_AT = PREVIEW_END - FADE_OUT;

/* Vignette geometry, the same as Episodes 2 to 5: centred under the series title, feathered to nothing. */
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

const EP7_LABEL = "পর্ব সাত";
const EP7_NAME = "লববাবুর পাঠশালা";

/* ------------------------------------------------------------------ */
/* The painted moment: the pathshala through its open doorway           */
/* ------------------------------------------------------------------ */

/** The camera: the set's glimpse framing (zoom 1.5 on the doorway), kept inside the set. */
const GLIMPSE_CAM = pathshalaKeepInSet(PATHSHALA.GLIMPSE.cam);

/** Balak on the left front mat (PATHSHALA.inside.balak, interior plane 0.8). */
const BALAK = PATHSHALA.inside.balak;

/**
 * The slate on his lap (figure units from the seat, facing right, ground at y = 0): held in both hands by its two side
 * edges, resting on his crossed legs and tilted up toward him, its chalk letters toward the light. W = the slate's
 * width in figure units (the Slate piece is 64 units wide at s 1).
 */
const SLATE = { x: 24, y: -24, w: 96, rot: -3, lie: 0.5 };
const SLATE_S = SLATE.w / 64;
/** Palm centres on the slate's side edges, a little below its middle (figure units). */
const HOLD = {
  far: { x: SLATE.x - SLATE.w / 2 - 3, y: SLATE.y - 14 },
  near: { x: SLATE.x + SLATE.w / 2 + 3, y: SLATE.y - 16 },
};

/** Balak's pose: sitting cross-legged, the slate in both hands on his lap, eyes down on it (SeatedChild handsTo). */
const balakProps = (f: number): SeatedChildProps => ({
  x: BALAK.x,
  y: BALAK.y,
  s: BALAK.s,
  f: f + 400,
  lifeF: f + 400,
  pose: "handsTo",
  prevPose: "handsTo",
  poseStart: 0,
  handTargets: HOLD,
  handShapes: { near: "grip", far: "grip" },
  expression: "serene",
  face: { lookX: 0.05, eyesDown: 1, smile: 0.5 },
  design: "plate",
  age: 6,
});

/** His faint ground glow, his halo behind the head (steady, BAL-06/07), the child, then the slate in his hands. */
const Balak: React.FC<{ f: number }> = ({ f }) => {
  const p = balakProps(f);
  const g = seatedChildHands(p).glowAnchor;
  const s = BALAK.s;
  return (
    <g>
      <defs>
        <radialGradient id="ep7g-groundglow">
          <stop offset="0" stopColor="#FFF0C8" stopOpacity={0.3} />
          <stop offset="1" stopColor="#FFF0C8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={BALAK.x} cy={BALAK.y + 1} rx={70} ry={8} fill="url(#ep7g-groundglow)" />
      <BirulGlow cx={g.cx} cy={g.cy} r={g.r * 1.05} glow={0.8} f={f} />
      <SeatedChild {...p} />
      <Slate x={BALAK.x + SLATE.x * s} y={BALAK.y + SLATE.y * s} s={SLATE_S * s} rot={SLATE.rot} lie={SLATE.lie} writing="ক খ" />
    </g>
  );
};

/** The painted Episode 7 moment. */
const PathshalaGlimpse: React.FC<{ f: number }> = ({ f }) => (
  <Stage cam={GLIMPSE_CAM} background={PATHSHALA_BG}>
    <PathshalaBackdrop f={f + 200} cam={GLIMPSE_CAM} calm={0.6} />
    <PathshalaSchoolLayer f={f + 200} cam={GLIMPSE_CAM} inside={<Balak f={f} />} />
    <PathshalaFloorLayer f={f + 200} />
    <PathshalaLightLayer f={f + 200} level={0.8} />
    <Grade {...pathshalaGrade()} />
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
            <PathshalaGlimpse f={local} />
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
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 2, color: "#FFDB8E", textShadow: labelShadow }}>{EP7_LABEL}</div>
        <div style={{ marginTop: 2, fontSize: 32, fontWeight: 600, letterSpacing: 0.5, color: "#FFF3DC", textShadow: labelShadow, whiteSpace: "nowrap" }}>
          {EP7_NAME}
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
