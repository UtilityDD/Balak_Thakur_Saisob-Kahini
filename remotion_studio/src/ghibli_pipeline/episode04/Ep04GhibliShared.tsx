import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp, hash, noise1 } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { CAST } from "../../cinematic/rig/cast";
import { MOUTH_REST, type MouthState } from "../../cinematic/rig/lipsync";
import { type CastMember, type Lighting, type Pose, BASE_POSE } from "../../cinematic/rig/Puppet";
import {
  GhibliAtmosphericHaze,
  GhibliCharFilterDefs,
  GhibliCutout,
  GhibliForegroundBokeh,
  GhibliGrade,
  GhibliLayer,
  GhibliPreload,
  GhibliStage,
} from "../GhibliStage";
import { GHIBLI_ANCHORS } from "./plateAnchors";
import { GentleCow, solveGentleCow, type GentleCowProps } from "../../cinematic/animals/GentleCow";
import { SeatedChild, seatedChildHands, type SeatedChildProps } from "../../episode03/rig/SeatedChild";
import { GhibliBirdFlock, GhibliWaterLight } from "../core/GhibliLifeKit";
import {
  POND_BANDS,
  PondBankGroundCover,
  PondButterflies,
  PondDragonflies,
  PondDucks,
  PondEdgePlants,
  PondFishRings,
  PondFloatingPetals,
  PondKingfisher,
  PondLilies,
  PondWaterStriders,
  PondWaterSurface,
  pondLilyCluster,
  type PondCoverPatch,
  type PondDuckPath,
  type PondEdgeClump,
  type PondWaterOptions,
} from "./Ep04PondLife";
import { Ep04BalakDivine, Ep04BalakInkDefs } from "./Ep04BalakDivine";
import { EP04_BALAK_LOOK } from "./ep04BalakLook";

/** Episode 4 Ghibli cast (reusing shared CAST + servant Mangla variant). */
export const EP04G_CAST: Record<string, CastMember> = {
  charu: CAST.charu,
  elderBrother: CAST.elderBrother,
  jyethi: CAST.jyethi,
  sundar: CAST.sundar,
  harendra: CAST.harendra,
  thakurma: CAST.thakurma,
  bhagabati: CAST.bhagabati,
  runner: CAST.rama,
  mangla: {
    ...CAST.haricharan,
    id: "mangla",
    height: 1.0,
    girth: 0.92,
    seed: 417,
  },
};

export const EP04G_MORNING_LIGHT: Lighting = {
  keySide: 1,
  rim: "#ffe0a3",
  rimStrength: 0.45,
  rimSide: 1,
  brightness: 1.02,
};

export const EP04G_AFTERNOON_LIGHT: Lighting = {
  keySide: -1,
  rim: "#ffc470",
  rimStrength: 0.58,
  rimSide: -1,
  brightness: 1.0,
};

export const EP04G_POND_LIGHT: Lighting = {
  keySide: 1,
  rim: "#ffe7b0",
  rimStrength: 0.5,
  rimSide: 1,
  brightness: 1.03,
};

export const EP04G_SHRINE_LIGHT: Lighting = {
  keySide: -1,
  rim: "#ffae47",
  rimStrength: 0.65,
  rimSide: -1,
  brightness: 0.98,
};

/** Helper to turn a 0..1 RMS level into a Puppet MouthState. */
export const mouthFromRms = (rms: number, f: number): MouthState => {
  if (rms < 0.06) return MOUTH_REST;
  const open = clamp(rms * 0.92, 0.08, 0.95);
  const width = clamp(0.9 + 0.28 * Math.sin(f * 0.72), 0.68, 1.25);
  const round = clamp(0.25 + 0.35 * Math.cos(f * 0.55), 0.05, 0.8);
  return { open, width, round, teeth: open > 0.45 ? 0.65 : 0.2 };
};

export const poseOf = (overrides: Partial<Pose>): Pose => ({
  ...BASE_POSE,
  ...overrides,
});

/** Diagonal volumetric sunbeam or flickering oil-lamp light cone (`depth=0.68`). */
export const GhibliVolumetricBeam: React.FC<{
  f: number;
  color?: string;
  opacity?: number;
  fromRight?: boolean;
  flicker?: boolean;
}> = ({ f, color = "#fff1c4", opacity = 0.18, fromRight = true, flicker = false }) => {
  const pulse = flicker
    ? 0.85 + 0.15 * Math.sin(f * 0.31) + 0.08 * noise1(f * 0.25, 19)
    : 0.92 + 0.08 * Math.sin(f * 0.04);
  const o = opacity * pulse;
  const pts = fromRight
    ? "1560,-60 1980,-60 1240,1140 640,1140"
    : "-80,-60 440,-60 1220,1140 620,1140";
  return (
    <g pointerEvents="none" opacity={o}>
      <defs>
        <linearGradient id={`beam-${fromRight ? "r" : "l"}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.95} />
          <stop offset="70%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={pts} fill={`url(#beam-${fromRight ? "r" : "l"})`} />
    </g>
  );
};

/** Animated sepia-cream incense smoke curls (`lifeF`-driven). */
export const GhibliSmokeCurls: React.FC<{ x: number; y: number; f: number; scale?: number }> = ({
  x,
  y,
  f,
  scale = 1,
}) => {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} pointerEvents="none">
      {[0, 1, 2].map((i) => {
        const phase = (f * 0.025 + i * 0.33) % 1;
        const cy = -phase * 150;
        const cx = Math.sin(phase * 6.2 + i * 2) * (10 + phase * 18);
        const op = Math.sin(phase * Math.PI) * 0.42;
        return (
          <path
            key={i}
            d={`M ${(cx - 6).toFixed(1)} ${(cy + 24).toFixed(1)} Q ${(cx + 12).toFixed(1)} ${(cy + 8).toFixed(1)} ${cx.toFixed(1)} ${(cy - 18).toFixed(1)}`}
            fill="none"
            stroke="#f5efe2"
            strokeWidth={3.2 + phase * 4}
            strokeLinecap="round"
            opacity={op}
          />
        );
      })}
    </g>
  );
};

/** Small hopping courtyard sparrow (living Ghibli micro-life). */
export const GhibliSparrow: React.FC<{ x: number; y: number; f: number; flyAt?: number }> = ({
  x,
  y,
  f,
  flyAt = 9999,
}) => {
  const flying = f >= flyAt;
  const ft = Math.max(0, f - flyAt);
  const hop = !flying ? Math.abs(Math.sin(f * 0.22)) * (Math.sin(f * 0.05) > 0.3 ? 6 : 0) : 0;
  const px = flying ? x + ft * 14 : x + Math.sin(f * 0.03) * 14;
  const py = flying ? y - ft * 8 - Math.sin(ft * 0.6) * 8 : y - hop;
  const wing = flying ? Math.sin(ft * 1.4) * 14 : 0;
  if (flying && ft > 65) return null;
  return (
    <g transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)})`} pointerEvents="none">
      <ellipse cx={0} cy={-4} rx={11} ry={7} fill="#8a684b" stroke="#3a2618" strokeWidth={1.2} />
      <circle cx={9} cy={-9} r={5.5} fill="#6f5038" stroke="#3a2618" strokeWidth={1.1} />
      <polygon points="14,-9 20,-7 14,-6" fill="#d99a3e" />
      <path d={`M -4 -6 Q -12 ${-14 - wing} -20 ${-8 - wing}`} fill="none" stroke="#4f3825" strokeWidth={3} strokeLinecap="round" />
      <circle cx={10.5} cy={-10} r={1.2} fill="#18120c" />
    </g>
  );
};

/** Falling crimson mandar petals & pond ripples across depth planes. */
export const GhibliMandarPetals: React.FC<{ f: number; count?: number; seed?: number; withRipples?: boolean }> = ({
  f,
  count = 12,
  seed = 41,
  withRipples = false,
}) => {
  return (
    <g pointerEvents="none">
      {Array.from({ length: count }, (_, i) => {
        const h1 = hash(i * 11 + seed);
        const h2 = hash(i * 23 + seed);
        const cycle = (f * (0.0045 + h1 * 0.004) + h2) % 1;
        const px = 200 + h1 * 1550 + Math.sin(cycle * 9 + i) * 38;
        const py = -30 + cycle * 960;
        const rot = cycle * 320 + i * 45;
        const op = cycle < 0.08 ? cycle / 0.08 : cycle > 0.9 ? (1 - cycle) / 0.1 : 0.85;
        return (
          <g key={i} transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})`} opacity={op}>
            <ellipse cx={0} cy={0} rx={7} ry={3.4} fill="#c8372d" stroke="#5e1b16" strokeWidth={0.8} />
          </g>
        );
      })}
      {withRipples &&
        [0, 1, 2].map((i) => {
          const p = ((f * 0.014) + i * 0.33) % 1;
          const cx = 360 + i * 290;
          const cy = 790 + (i % 2) * 35;
          return (
            <ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={10 + p * 68}
              ry={3 + p * 18}
              fill="none"
              stroke="#eef7f2"
              strokeWidth={1.6}
              opacity={(1 - p) * 0.45}
            />
          );
        })}
    </g>
  );
};

/** Skimming blue-teal dragonfly over the pond (`depth=0.78`). */
export const GhibliDragonfly: React.FC<{ f: number }> = ({ f }) => {
  const t = f * 0.032;
  const x = 620 + Math.sin(t) * 280 + Math.cos(t * 1.7) * 60;
  const y = 710 + Math.sin(t * 2.3) * 28;
  const flutter = Math.sin(f * 2.2) * 5;
  return (
    <g transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`} pointerEvents="none" opacity={0.85}>
      <line x1={-14} y1={0} x2={12} y2={0} stroke="#2e6b78" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={2} cy={-5 - flutter * 0.4} rx={10} ry={2.6} fill="#dff4f8" opacity={0.75} />
      <ellipse cx={2} cy={5 + flutter * 0.4} rx={10} ry={2.6} fill="#dff4f8" opacity={0.75} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Courtyard (Vedic house, GHB-PLATE-01): back plate, pillars, lamps   */
/* The back plate is drawn 1:1 in plate pixels at (-1560, -60), so     */
/* stage = plate - (1560, 60). Layout: courtyard_back_ep04_layout.json */
/* ------------------------------------------------------------------ */

const COURTYARD_BACK = { x: -1560, y: -60, w: 5040, h: 1320 } as const;
const courtyardPlateFilter = (mode: "morning" | "afternoon") =>
  mode === "afternoon" ? "sepia(0.18) saturate(1.12) brightness(0.95)" : undefined;

/** Pillar centres (plate px) from courtyard_back_ep04_layout.json; the cut-out strips are +-47 px wide. */
const COURTYARD_PILLAR_CENTRES = [
  19, 273, 532, 792, 1012, 1266, 1525, 1785, 2005, 2259, 2518, 2778, 2998, 3252, 3511, 3771, 3991, 4245, 4504, 4764, 4984,
] as const;
const PILLAR_STRIP_HALF = 47;

/**
 * Clay diyas painted in the veranda wall niches (plate px, measured on the plate; the bay pattern repeats every
 * 993 px). `y` is the wick (top of the bowl); the upper niche lamps are small, the lower shelf lamps a little taller.
 */
const COURTYARD_LAMPS: ReadonlyArray<{ x: number; y: number; h: number; seed: number }> = (() => {
  const upper = [1327, 1360, 1576, 1654, 1732, 1955, 1987, 2082, 2113];
  const lower = [1325, 1577, 1732, 1990, 2080];
  const out: Array<{ x: number; y: number; h: number; seed: number }> = [];
  for (let k = -1; k <= 3; k++) {
    upper.forEach((x, i) => out.push({ x: x + k * 993, y: 529, h: 10, seed: k * 31 + i * 7 + 3 }));
    lower.forEach((x, i) => out.push({ x: x + k * 993, y: 575, h: 13, seed: k * 31 + i * 11 + 101 }));
  }
  return out.filter((l) => l.x > 4 && l.x < COURTYARD_BACK.w - 4);
})();

const lampUnderPillar = (x: number) => COURTYARD_PILLAR_CENTRES.some((c) => Math.abs(x - c) <= PILLAR_STRIP_HALF);

/** One ordinary diya flame: small, warm, flickering on the life clock; its glow stays within the bowl's width. */
const DiyaFlame: React.FC<{ x: number; y: number; h: number; t: number; seed: number; bright: number }> = ({
  x,
  y,
  h,
  t,
  seed,
  bright,
}) => {
  const n1 = noise1(t * 0.33 + seed * 0.17, seed);
  const n2 = noise1(t * 0.81 + seed * 0.29, seed + 7);
  const hh = h * (0.93 + 0.1 * n1 + 0.05 * n2);
  const sway = (0.7 * n2 + 0.35 * n1) * (h / 11);
  const w = h * 0.24;
  const outer = `M ${(x - w).toFixed(2)} ${y.toFixed(2)} Q ${(x - w * 1.15).toFixed(2)} ${(y - hh * 0.45).toFixed(2)} ${(x + sway).toFixed(2)} ${(y - hh).toFixed(2)} Q ${(x + w * 1.15).toFixed(2)} ${(y - hh * 0.45).toFixed(2)} ${(x + w).toFixed(2)} ${y.toFixed(2)} Q ${x.toFixed(2)} ${(y + w * 0.8).toFixed(2)} ${(x - w).toFixed(2)} ${y.toFixed(2)} Z`;
  const ih = hh * 0.55;
  const iw = w * 0.55;
  const inner = `M ${(x - iw).toFixed(2)} ${(y - 0.4).toFixed(2)} Q ${(x - iw).toFixed(2)} ${(y - ih * 0.45).toFixed(2)} ${(x + sway * 0.5).toFixed(2)} ${(y - ih).toFixed(2)} Q ${(x + iw).toFixed(2)} ${(y - ih * 0.45).toFixed(2)} ${(x + iw).toFixed(2)} ${(y - 0.4).toFixed(2)} Z`;
  const flick = clamp(0.88 + 0.12 * n2, 0, 1);
  return (
    <g pointerEvents="none">
      <circle cx={x + sway * 0.3} cy={y - hh * 0.42} r={h * 0.62} fill="url(#ep4cy-diya-glow)" opacity={0.5 * bright * flick} />
      <path d={outer} fill="#f59a2e" opacity={0.92 * flick} />
      <path d={inner} fill="#fff1bd" opacity={Math.min(1, 0.95 * bright)} />
    </g>
  );
};

/** Diya flames for the courtyard lamps (stage coordinates of the depth-0.58 back-plate layer). */
const CourtyardLampFlames: React.FC<{ t: number; mode: "morning" | "afternoon"; underPillarsOnly?: boolean }> = ({
  t,
  mode,
  underPillarsOnly = false,
}) => {
  const bright = mode === "afternoon" ? 1.15 : 1;
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id="ep4cy-diya-glow">
          <stop offset="0%" stopColor="#ffd77a" stopOpacity={0.85} />
          <stop offset="55%" stopColor="#ffb54d" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#ffb54d" stopOpacity={0} />
        </radialGradient>
      </defs>
      {COURTYARD_LAMPS.filter((l) => (underPillarsOnly ? lampUnderPillar(l.x) : true)).map((l) => (
        <DiyaFlame
          key={`${l.x}-${l.y}`}
          x={l.x + COURTYARD_BACK.x}
          y={l.y + COURTYARD_BACK.y}
          h={l.h}
          t={t}
          seed={l.seed}
          bright={bright}
        />
      ))}
    </g>
  );
};

/**
 * The veranda pillars cut out of the back plate (`courtyard_pillars_ep04.png`): same size, placement, depth,
 * parallax and grade as the back plate, so they register exactly over it.
 *
 * To put characters INSIDE the veranda (between the back wall and the pillars), prefer the backdrop's slot:
 *   <GhibliCourtyardBackdrop f={f} mode="morning" insideVeranda={<Puppet ... y={655} s={0.5} />} />
 * It draws back plate -> your node -> pillars in the right order, before the haze, tulsi and floor planes.
 * The slot's children live in the depth-0.58 layer's stage coordinates (stage = plate px - (1560, 60)):
 * the veranda floor runs from about y = 630 (foot of the back wall) to y = 664 (pillar bases, plate row 724);
 * scale figures to about 0.45-0.55 of their courtyard size.
 * Standalone use: draw your own `<GhibliLayer depth={0.58}>` with the figures right after the backdrop, then
 * `<GhibliCourtyardPillars mode="morning" />`. The pillars then sit above the backdrop's haze, tulsi and floor,
 * so keep the inside figures clear of the tulsi; `bare` returns the SVG without its own layer.
 */
export const GhibliCourtyardPillars: React.FC<{
  mode: "morning" | "afternoon";
  lampFlames?: boolean;
  lifeF?: number;
  /** Return bare SVG (no GhibliLayer) for use inside an existing depth-0.58 layer. */
  bare?: boolean;
}> = ({ mode, lampFlames = true, lifeF, bare = false }) => {
  const frame = useCurrentFrame();
  const t = lifeF ?? frame;
  const content = (
    <>
      <image
        href={staticFile("images/ghibli_ep04/courtyard_pillars_ep04.png")}
        x={COURTYARD_BACK.x}
        y={COURTYARD_BACK.y}
        width={COURTYARD_BACK.w}
        height={COURTYARD_BACK.h}
        style={{ filter: courtyardPlateFilter(mode) }}
      />
      {/* the pillar strips include a little of the niche wall: keep those lamps burning too */}
      {lampFlames && <CourtyardLampFlames t={t} mode={mode} underPillarsOnly />}
    </>
  );
  return bare ? content : <GhibliLayer depth={0.58}>{content}</GhibliLayer>;
};

/** Floor plate top (stage y): its faded top rows are trimmed so the back plate's plinth reads as the veranda edge. */
const COURTYARD_FLOOR_TOP = 734;

/** Reusable 10-Plane Courtyard Backdrop (Morning for Sc01, Afternoon for Sc04). */
export const GhibliCourtyardBackdrop: React.FC<{
  f: number;
  mode: "morning" | "afternoon";
  showMadur?: boolean;
  sparrowFlyAt?: number;
  /** Ordinary diya flames in the veranda wall niches (default true). */
  lampFlames?: boolean;
  /** Life clock for the flames (defaults to the real frame). */
  lifeF?: number;
  /** Figures standing inside the veranda: drawn between the back wall and the pillars (depth-0.58 stage coords). */
  insideVeranda?: React.ReactNode;
}> = ({ f, mode, showMadur = false, sparrowFlyAt = 70, lampFlames = true, lifeF, insideVeranda }) => {
  const frame = useCurrentFrame();
  const t = lifeF ?? frame;
  const sky = mode === "morning" ? "images/ghibli_ep04/sky_ep04_morning_courtyard.png" : "images/ghibli_ep04/sky_ep04_afternoon_gold.png";
  return (
    <>
      <GhibliLayer depth={0.08} parallaxDrift={0.004}>
        <image href={staticFile(sky)} x={-320} y={-200} width={2560} height={1440} preserveAspectRatio="xMidYMid slice" />
      </GhibliLayer>
      <GhibliLayer depth={0.26} extraBlur={1.1}>
        <image href={staticFile("images/ghibli_ep04/far_trees_ep04_sketch.png")} x={-640} y={120} width={3200} height={360} />
      </GhibliLayer>
      <GhibliLayer depth={0.58}>
        <image
          href={staticFile("images/ghibli_ep04/courtyard_back_ep04_morning.png")}
          x={COURTYARD_BACK.x}
          y={COURTYARD_BACK.y}
          width={COURTYARD_BACK.w}
          height={COURTYARD_BACK.h}
          style={{ filter: courtyardPlateFilter(mode) }}
        />
        {lampFlames && <CourtyardLampFlames t={t} mode={mode} />}
        {insideVeranda && (
          <>
            {insideVeranda}
            <GhibliCourtyardPillars mode={mode} lampFlames={lampFlames} lifeF={t} bare />
          </>
        )}
      </GhibliLayer>
      <GhibliLayer depth={0.68}>
        <GhibliVolumetricBeam
          f={f}
          color={mode === "morning" ? "#fff2c8" : "#ffcf82"}
          opacity={mode === "morning" ? 0.16 : 0.22}
          fromRight={mode === "morning"}
        />
        <GhibliAtmosphericHaze f={f} />
      </GhibliLayer>
      <GhibliLayer depth={0.78} groundLocked parallaxDrift={-0.025}>
        <GhibliCutout
          file="images/ghibli_ep04/tulsi_mancha_ep04_sketch.png"
          anchor={GHIBLI_ANCHORS.tulsi_mancha_ep04_sketch}
          x={1540}
          y={885}
          targetHeight={390}
        />
        {mode === "morning" && <GhibliSparrow x={1520} y={565} f={f} flyAt={sparrowFlyAt} />}
      </GhibliLayer>
      <GhibliLayer depth={0.92} groundLocked parallaxDrift={-0.012}>
        <defs>
          <linearGradient id="ep4cy-floor-fade" gradientUnits="userSpaceOnUse" x1={0} y1={COURTYARD_FLOOR_TOP} x2={0} y2={COURTYARD_FLOOR_TOP + 5}>
            <stop offset="0%" stopColor="#fff" stopOpacity={0} />
            <stop offset="100%" stopColor="#fff" stopOpacity={1} />
          </linearGradient>
          <mask id="ep4cy-floor-mask" maskUnits="userSpaceOnUse" x={-1800} y={COURTYARD_FLOOR_TOP - 4} width={5600} height={1200}>
            <rect x={-1800} y={COURTYARD_FLOOR_TOP} width={5600} height={1200} fill="url(#ep4cy-floor-fade)" />
          </mask>
          <filter id="ep4cy-soft3" x="-2%" y="-200%" width="104%" height="500%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
        </defs>
        <g mask="url(#ep4cy-floor-mask)">
          <image href={staticFile("images/ghibli_ep04/courtyard_floor_ep04_sketch.png")} x={-1760} y={660} width={5440} height={1200} />
        </g>
        {/* the plinth's shade on the courtyard floor and a broken ink line: the veranda's front edge */}
        <rect x={-1800} y={COURTYARD_FLOOR_TOP + 1} width={5600} height={9} fill="#6b2f1e" opacity={0.26} filter="url(#ep4cy-soft3)" />
        <path
          d={`M -1800 ${COURTYARD_FLOOR_TOP + 1} L 3800 ${COURTYARD_FLOOR_TOP + 1}`}
          stroke="#4a2c1c"
          strokeWidth={1.3}
          opacity={0.5}
          strokeDasharray="120 9 64 6 180 12 40 7"
        />
        {showMadur && (
          <GhibliCutout
            file="images/ghibli_ep04/madur_mat_veranda_sketch.png"
            anchor={GHIBLI_ANCHORS.madur_mat_veranda_sketch}
            x={960}
            y={975}
            targetHeight={170}
          />
        )}
      </GhibliLayer>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Hand-painted grassy pond bank (Scenes 02 & 03)                      */
/* World coordinates of the ground-locked plane: feet stand at         */
/* y = 935-940, the water's edge runs at about y = 836.                */
/* ------------------------------------------------------------------ */

const BANK_X0 = -560;
const BANK_X1 = 2560;
const BANK_BOTTOM = 1340;

/** Height of the bank's water edge at world x (gently wandering, never a ruler line). */
const bankEdgeY = (x: number) =>
  836 + 7 * Math.sin(x * 0.0041 + 1.3) + 3.2 * Math.sin(x * 0.0127 + 0.4) + 1.4 * Math.sin(x * 0.043 + 2.1);

/** Perspective scale of ground detail: tiny at the water's edge, full size at the frame bottom. */
const bankPersp = (y: number) => clamp(0.16 + ((y - 836) / 244) * 0.84, 0.14, 1.7);

const BANK_EDGE_PTS: Array<[number, number]> = (() => {
  const pts: Array<[number, number]> = [];
  for (let x = BANK_X0; x <= BANK_X1; x += 20) pts.push([x, bankEdgeY(x)]);
  return pts;
})();

const bankEdgeD = (dy: number) =>
  BANK_EDGE_PTS.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${(y + dy).toFixed(1)}`).join(" ");

const BANK_SHAPE_D = `${bankEdgeD(0)} L ${BANK_X1} ${BANK_BOTTOM} L ${BANK_X0} ${BANK_BOTTOM} Z`;

/** Trodden earth path from the ghat steps to the mandar tree (where the cast stands and sits). */
const troddenCenterY = (x: number) => 946 + 10 * Math.sin(x * 0.0047 + 0.6);
const inTrodden = (x: number, y: number) => {
  if (x < 120 || x > 1560) return false;
  const edgeFade = Math.min(1, (x - 120) / 160, (1560 - x) / 160);
  return Math.abs(y - troddenCenterY(x)) < 30 * edgeFade + 6;
};

const GRASS_FILLS = ["#4a6230", "#5f7b3a", "#7b9549", "#9fb062", "#bdbd78"] as const;

type BladeSet = { fills: string[]; ink: [string, string] };

/** Builds watercolour grass blades (filled, tapered) grouped by colour, plus sparse sepia-ink accents. */
const buildGrass = (
  count: number,
  seed: number,
  place: (h1: number, h2: number) => [number, number] | null,
  heightMul = 1,
): BladeSet => {
  const fills: string[][] = GRASS_FILLS.map(() => []);
  const inkFar: string[] = [];
  const inkNear: string[] = [];
  for (let i = 0; i < count; i++) {
    const h1 = hash(i * 7.13 + seed);
    const h2 = hash(i * 3.71 + seed * 1.7 + 11);
    const h3 = hash(i * 1.97 + seed * 0.37 + 29);
    const pos = place(h1, h2);
    if (!pos) continue;
    const [x, y] = pos;
    if (inTrodden(x, y) && h3 < 0.82) continue;
    const p = bankPersp(y);
    const n = 3 + Math.floor(h3 * 4);
    // far grass is hazier and lighter; near grass carries the darks
    const depthT = clamp((y - 836) / 300, 0, 1);
    for (let b = 0; b < n; b++) {
      const r1 = hash(i * 13.1 + b * 5.3 + seed);
      const r2 = hash(i * 5.9 + b * 9.7 + seed * 2.1);
      const r3 = hash(i * 2.3 + b * 17.9 + seed * 0.7);
      const bx = x + (b - (n - 1) / 2) * 3.4 * p + (r1 - 0.5) * 5 * p;
      const h = (12 + r2 * 20) * p * 1.5 * heightMul;
      const lean = (r3 - 0.42) * h * 0.75;
      const w = (1.8 + r1 * 1.9) * p;
      const d = `M ${(bx - w).toFixed(1)} ${y.toFixed(1)} Q ${(bx + lean * 0.35).toFixed(1)} ${(y - h * 0.6).toFixed(1)} ${(bx + lean).toFixed(1)} ${(y - h).toFixed(1)} Q ${(bx + lean * 0.35 + w * 0.6).toFixed(1)} ${(y - h * 0.5).toFixed(1)} ${(bx + w).toFixed(1)} ${y.toFixed(1)} Z`;
      const pick = clamp(Math.floor((r2 * 0.75 + (1 - depthT) * 0.45) * 5 - 0.3), 0, 4);
      fills[pick].push(d);
      if (r1 > 0.86) {
        const ink = `M ${bx.toFixed(1)} ${y.toFixed(1)} Q ${(bx + lean * 0.35).toFixed(1)} ${(y - h * 0.6).toFixed(1)} ${(bx + lean).toFixed(1)} ${(y - h).toFixed(1)}`;
        (y > 960 ? inkNear : inkFar).push(ink);
      }
    }
  }
  return { fills: fills.map((a) => a.join(" ")), ink: [inkFar.join(" "), inkNear.join(" ")] };
};

const BANK_GRASS = buildGrass(2600, 3, (h1, h2) => {
  const x = BANK_X0 + 40 + h1 * (BANK_X1 - BANK_X0 - 80);
  const y = 840 + Math.pow(h2, 1.45) * 430;
  const edge = bankEdgeY(x);
  return [x, Math.max(y, edge + 5)];
});

/** Fine grass fringe breaking the line where the bank meets the water. */
const EDGE_FRINGE = buildGrass(
  520,
  91,
  (h1, h2) => {
    const x = BANK_X0 + 30 + h1 * (BANK_X1 - BANK_X0 - 60);
    return [x, bankEdgeY(x) + 2 + h2 * 9];
  },
  1.7,
);

/** Small tufts that overlap the bases of the steps, the mandar trunk and the banana clump. */
const BASE_TUFTS = buildGrass(
  110,
  57,
  (h1, h2) => {
    // the ghat's own edges are tufted in GhibliPondGhat (same layer as the bricks); here: the trunk and the banana
    const u = (h1 % 0.5) / 0.5;
    if (h1 < 0.5) return [1270 + u * 190, 943 + h2 * 13];
    return [1580 + u * 420, 938 + h2 * 12];
  },
  0.9,
);

/** Fallen crimson mandar petals lying on the bank (thickest under the tree). */
const GROUND_PETALS = Array.from({ length: 96 }, (_, i) => {
  const h1 = hash(i * 4.31 + 101);
  const h2 = hash(i * 8.17 + 202);
  const h3 = hash(i * 2.93 + 303);
  const under = i < 62;
  const x = under ? 1360 + (h1 + hash(i * 1.7 + 5) - 1) * 620 : -300 + h1 * 2600;
  const yMin = bankEdgeY(x) + 10;
  const y = under ? 872 + Math.pow(h2, 1.2) * 130 : yMin + Math.pow(h2, 1.3) * 300;
  const p = bankPersp(y);
  const col = h3 < 0.5 ? "#c8372d" : h3 < 0.75 ? "#a92a24" : h3 < 0.9 ? "#d9584b" : "#b46a5c";
  return { x, y: Math.max(y, yMin), rx: (4.2 + h3 * 3.6) * p * 1.25, ry: (1.9 + h1 * 1.5) * p * 1.25, rot: h2 * 360, col };
});

/** One reed tuft at the water's edge with a gentle sway on the life clock. */
const PondReedTuft: React.FC<{ x: number; s: number; f: number; seed: number }> = ({ x, s, f, seed }) => {
  const y = bankEdgeY(x) + 4;
  const n = 9;
  return (
    <g pointerEvents="none">
      {Array.from({ length: n }, (_, i) => {
        const r1 = hash(seed + i * 3.3);
        const r2 = hash(seed * 1.9 + i * 7.1);
        const h = (46 + r1 * 58) * s;
        const bx = x + (i - (n - 1) / 2) * 3.6 * s;
        const sway = Math.sin(f * 0.045 + i * 0.8 + seed) * 2.6 * s + (r2 - 0.5) * 30 * s;
        const w = (1.6 + r2 * 1.4) * s;
        const tipX = bx + sway;
        const fill = ["#5d7636", "#7a8f45", "#97a457", "#6c6f3a"][i % 4];
        return (
          <g key={i}>
            <path
              d={`M ${(bx - w).toFixed(1)} ${y} Q ${(bx + sway * 0.3).toFixed(1)} ${(y - h * 0.55).toFixed(1)} ${tipX.toFixed(1)} ${(y - h).toFixed(1)} Q ${(bx + sway * 0.3 + w * 0.5).toFixed(1)} ${(y - h * 0.5).toFixed(1)} ${(bx + w).toFixed(1)} ${y} Z`}
              fill={fill}
              opacity={0.92}
            />
            {r1 > 0.55 && (
              <path
                d={`M ${bx.toFixed(1)} ${y} Q ${(bx + sway * 0.3).toFixed(1)} ${(y - h * 0.55).toFixed(1)} ${tipX.toFixed(1)} ${(y - h).toFixed(1)}`}
                fill="none"
                stroke="#4a3422"
                strokeWidth={0.8}
                opacity={0.45}
              />
            )}
            {i % 4 === 1 && (
              <ellipse
                cx={tipX - sway * 0.12}
                cy={y - h * 0.86}
                rx={2.4 * s}
                ry={8 * s}
                fill="#7a5532"
                stroke="#3e2a1a"
                strokeWidth={0.7}
                transform={`rotate(${(sway * 0.9).toFixed(1)} ${(tipX - sway * 0.12).toFixed(1)} ${(y - h * 0.86).toFixed(1)})`}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

/** The painted bank itself: watercolour washes, earth, grass, petals, reeds and paper tooth. */
const GhibliPondBank: React.FC<{ f: number }> = ({ f }) => {
  const fx = { filterUnits: "userSpaceOnUse" as const, x: -460, y: 790, width: 2920, height: 560, colorInterpolationFilters: "sRGB" as const };
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id="ep4pb-base" gradientUnits="userSpaceOnUse" x1={0} y1={826} x2={0} y2={1120}>
          <stop offset="0%" stopColor="#c9c99c" />
          <stop offset="12%" stopColor="#b3bc80" />
          <stop offset="40%" stopColor="#9fb06a" />
          <stop offset="75%" stopColor="#90a55d" />
          <stop offset="100%" stopColor="#849c55" />
        </linearGradient>
        <linearGradient id="ep4pb-near" gradientUnits="userSpaceOnUse" x1={0} y1={980} x2={0} y2={1180}>
          <stop offset="0%" stopColor="#3f4a26" stopOpacity={0} />
          <stop offset="100%" stopColor="#3f4a26" stopOpacity={0.12} />
        </linearGradient>
        <filter id="ep4pb-earth" {...fx}>
          <feTurbulence type="fractalNoise" baseFrequency="0.0052 0.02" numOctaves={3} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.78  0 0 0 0 0.63  0 0 0 0 0.40  6.0 0 0 0 -3.0" />
        </filter>
        <filter id="ep4pb-dark" {...fx}>
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.032" numOctaves={3} seed={5} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.42  0 0 0 0 0.19  0 5.0 0 0 -2.55" />
        </filter>
        <filter id="ep4pb-light" {...fx}>
          <feTurbulence type="fractalNoise" baseFrequency="0.0065 0.024" numOctaves={2} seed={23} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.90  0 0 0 0 0.88  0 0 0 0 0.60  0 0 5.0 0 -2.5" />
        </filter>
        <filter id="ep4pb-soft2" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
        <filter id="ep4pb-soft8" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
        <filter id="ep4pb-soft20" x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation={20} />
        </filter>
        <mask id="ep4pb-mask" maskUnits="userSpaceOnUse" x={BANK_X0 - 40} y={780} width={BANK_X1 - BANK_X0 + 80} height={600}>
          <path d={BANK_SHAPE_D} fill="#fff" filter="url(#ep4pb-soft2)" />
        </mask>
      </defs>

      {/* the bank's green reflection in the shallows, then a glint of water light at the lip */}
      <path d={bankEdgeD(-7)} fill="none" stroke="#7f915a" strokeWidth={12} opacity={0.3} filter="url(#ep4pb-soft2)" />
      <path
        d={bankEdgeD(-2)}
        fill="none"
        stroke="#eef4e6"
        strokeWidth={2.2}
        opacity={0.38 + 0.12 * Math.sin(f * 0.06)}
        transform={`translate(0 ${(Math.sin(f * 0.07) * 0.8).toFixed(2)})`}
        filter="url(#ep4pb-soft2)"
      />
      {/* small wavelets lapping at the lip, each rising and fading */}
      {Array.from({ length: 34 }, (_, i) => {
        const x = BANK_X0 + 60 + ((i * 89.7) % (BANK_X1 - BANK_X0 - 120));
        const ph = (((f * 0.012 + hash(i * 3.7)) % 1) + 1) % 1;
        const y = bankEdgeY(x) - 3 - ph * 7;
        const l = 10 + hash(i * 1.3) * 16;
        return (
          <path
            key={`lap${i}`}
            d={`M ${(x - l / 2).toFixed(1)} ${y.toFixed(1)} Q ${x.toFixed(1)} ${(y - 1.2).toFixed(1)} ${(x + l / 2).toFixed(1)} ${y.toFixed(1)}`}
            fill="none"
            stroke="#f2f8f0"
            strokeWidth={1}
            opacity={(Math.sin(ph * Math.PI) * 0.55).toFixed(2)}
            strokeLinecap="round"
          />
        );
      })}

      <g mask="url(#ep4pb-mask)">
        <path d={BANK_SHAPE_D} fill="url(#ep4pb-base)" />
        {/* watercolour mottling: ochre earth showing through, darker grass pools, sunlit wash */}
        <rect x={-460} y={790} width={2920} height={560} filter="url(#ep4pb-earth)" opacity={0.7} />
        <rect x={-460} y={790} width={2920} height={560} filter="url(#ep4pb-dark)" opacity={0.38} />
        <rect x={-460} y={790} width={2920} height={560} filter="url(#ep4pb-light)" opacity={0.42} />

        {/* wet mud rim and damp earth strip along the water's edge */}
        <path d={bankEdgeD(10)} fill="none" stroke="#a88d5c" strokeWidth={12} opacity={0.42} filter="url(#ep4pb-soft2)" />
        <path d={bankEdgeD(4)} fill="none" stroke="#5c4a2f" strokeWidth={5} opacity={0.5} filter="url(#ep4pb-soft2)" />

        {/* trodden earth path from the ghat to the tree */}
        <g filter="url(#ep4pb-soft8)">
          {Array.from({ length: 22 }, (_, i) => {
            const x = 150 + i * 64 + (hash(i * 3.1 + 7) - 0.5) * 30;
            const fade = Math.min(1, (x - 120) / 220, (1560 - x) / 220);
            return (
              <ellipse
                key={i}
                cx={x}
                cy={troddenCenterY(x) +(hash(i * 5.3) - 0.5) * 8}
                rx={70 + hash(i * 2.7) * 40}
                ry={(20 + hash(i * 6.1) * 10) * Math.max(0.4, fade)}
                fill={i % 3 === 0 ? "#d2b47c" : i % 3 === 1 ? "#c4a06a" : "#dcc08c"}
                opacity={0.85 * Math.max(0.15, fade)}
              />
            );
          })}
          <ellipse cx={1230} cy={944} rx={150} ry={26} fill="#a98a58" opacity={0.45} />
        </g>

        {/* dappled shade of the mandar canopy, darker towards the trunk */}
        <ellipse cx={1330} cy={918} rx={540} ry={78} fill="#33421f" opacity={0.26} filter="url(#ep4pb-soft20)" />
        <ellipse cx={1365} cy={940} rx={250} ry={36} fill="#2c3a1b" opacity={0.3} filter="url(#ep4pb-soft8)" />
        {/* soft sun patches (key light from the right) */}
        <g filter="url(#ep4pb-soft20)">
          <ellipse cx={1980} cy={1010} rx={260} ry={46} fill="#f2e7a8" opacity={0.26} />
          <ellipse cx={420} cy={1060} rx={320} ry={52} fill="#efe2a2" opacity={0.2} />
          <ellipse cx={-180} cy={900} rx={220} ry={30} fill="#efe2a2" opacity={0.22} />
        </g>

        {/* grass, far to near */}
        {BANK_GRASS.fills.map((d, i) => (
          <path key={i} d={d} fill={GRASS_FILLS[i]} opacity={0.88} />
        ))}
        <path d={BANK_GRASS.ink[0]} fill="none" stroke="#4d3724" strokeWidth={0.7} opacity={0.42} />
        <path d={BANK_GRASS.ink[1]} fill="none" stroke="#4d3724" strokeWidth={1.1} opacity={0.42} />

        {/* fallen mandar petals */}
        {GROUND_PETALS.map((pt, i) => (
          <ellipse
            key={i}
            cx={pt.x}
            cy={pt.y}
            rx={pt.rx}
            ry={pt.ry}
            fill={pt.col}
            stroke="#5e1b16"
            strokeWidth={0.5}
            opacity={0.88}
            transform={`rotate(${pt.rot.toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`}
          />
        ))}

        {/* near-ground depth and paper tooth */}
        <rect x={BANK_X0} y={980} width={BANK_X1 - BANK_X0} height={BANK_BOTTOM - 980} fill="url(#ep4pb-near)" />
        <image
          href={staticFile("images/ghibli_ep04/watercolor_paper_grain.png")}
          x={-700}
          y={790}
          width={1920}
          height={1080}
          preserveAspectRatio="none"
          opacity={0.5}
          style={{ mixBlendMode: "multiply" }}
        />
        <image
          href={staticFile("images/ghibli_ep04/watercolor_paper_grain.png")}
          x={1220}
          y={790}
          width={1920}
          height={1080}
          preserveAspectRatio="none"
          opacity={0.5}
          style={{ mixBlendMode: "multiply" }}
        />
      </g>

      {/* broken sepia ink contour of the bank lip */}
      <path
        d={bankEdgeD(1)}
        fill="none"
        stroke="#4a3422"
        strokeWidth={1.1}
        opacity={0.4}
        strokeDasharray="70 16 34 10 96 22 18 12"
      />

      {/* grass fringe overlapping the water line */}
      {EDGE_FRINGE.fills.map((d, i) => (
        <path key={i} d={d} fill={GRASS_FILLS[i]} opacity={0.85} />
      ))}

      {/* reed tufts at the water's edge */}
      <PondReedTuft x={-90} s={0.62} f={f} seed={3} />
      <PondReedTuft x={772} s={0.5} f={f} seed={17} />
      <PondReedTuft x={1046} s={0.46} f={f} seed={29} />
      <PondReedTuft x={2210} s={0.6} f={f} seed={41} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The bathing ghat: a short flight of old brick steps going DOWN from */
/* the bank into the pond (redesigned 2026-11-25, the director: "pond  */
/* ghat"). A small perspective model (metres) projected onto the       */
/* ground-locked plane: eye 5.5 m above the bank, horizon y = 500,     */
/* vanishing x = 960. Bank level h = 0; the top step (the landing) is  */
/* flush with the grass on the figures' ground line (y 892-964); five  */
/* treads drop 0.22 m each towards the water (h = -0.75), the lowest   */
/* two under water. Low side walls (lime-plaster tops) end in square   */
/* posts with plaster caps a little way out in the pond.               */
/* ------------------------------------------------------------------ */

const GH_F = 553;
const GH_E = 5.5;
/** Project a ghat point (X across, h height above the bank, z depth) to stage coordinates. */
export const ghatProject = (X: number, h: number, z: number): [number, number] => [960 + (GH_F * X) / z, 500 + (GH_F * (GH_E - h)) / z];

const GH_XL = -9.87; // inner face of the left wall
const GH_XR = -4.71; // inner face of the right wall
const GH_WALL = 0.42; // side-wall thickness
const GH_WALL_H = 0.2; // side-wall top above the bank (low)
const GH_POST_H = 0.62; // water-end posts' top above the bank
const GH_GATE_H = 0.5; // landward posts' top
const GH_WATER = -0.75;
const GH_Z0 = 6.55; // near edge of the landing (flush with the grass, y ~ 964)
const GH_Z1 = 7.75; // landing's far edge: first step down (y ~ 892)
const GH_TREAD = 0.48;
const GH_RISER = 0.22;
const GH_STEPS = 5;
const GH_ZLAST = GH_Z1 + GH_TREAD * GH_STEPS; // far edge of the last (drowned) tread
const GH_WALL_Z0 = 7.15; // the side walls start beside the landing
const GH_ZEND = GH_ZLAST + 0.45; // far faces of the water-end posts
const GH_LIP_Z = (GH_F * GH_E) / 336; // the bank lip (y 836) at bank level
const GH_ZWL = GH_Z1 + GH_TREAD * 3; // the waterline: riser between tread 3 (dry) and tread 4 (drowned)
const GH_ZLW = (GH_F * (GH_E - GH_WATER)) / 336; // the water surface seen right at the bank lip

/** Surfaces of the ghat floor: index 0 = landing (bank level), 1..5 = treads going down (4 and 5 under water). */
const GH_TREADS = Array.from({ length: GH_STEPS + 1 }, (_, i) => ({
  i,
  h: -GH_RISER * i,
  z0: i === 0 ? GH_Z0 : GH_Z1 + GH_TREAD * (i - 1),
  z1: i === 0 ? GH_Z1 : GH_Z1 + GH_TREAD * i,
}));

/**
 * Ghat layout for scenes (e.g. walking down the steps):
 * `ghatSpot(u, step, along)` gives the stage foot point and a scale factor relative to a figure standing at y = 935
 * on the bank; u = 0 at the left wall's inner face, 1 at the right wall's; step 0 = the landing (bank level, y 892-964),
 * 1..5 = treads going down (4 and 5 are under water); along = 0 near edge .. 1 far edge of that step.
 */
export const ghatSpot = (u: number, step: number, along = 0.5) => {
  const t = GH_TREADS[clamp(Math.round(step), 0, GH_STEPS)];
  const z = t.z0 + (t.z1 - t.z0) * along;
  const [x, y] = ghatProject(GH_XL + (GH_XR - GH_XL) * clamp(u, 0, 1), t.h, z);
  return { x, y, scale: 6.99 / z, underwater: t.h < GH_WATER };
};

/** Key stage points of the ghat for staging (all world/stage px of the ground-locked plane). */
export const GHAT_LAYOUT = {
  steps: GH_STEPS,
  /** First tread under water. */
  firstDrownedStep: 4,
  /** The landing quad (bank level): near-left, near-right, far-right, far-left. */
  landing: [ghatProject(GH_XL, 0, GH_Z0), ghatProject(GH_XR, 0, GH_Z0), ghatProject(GH_XR, 0, GH_Z1), ghatProject(GH_XL, 0, GH_Z1)],
  /** The right wall's outer foot on the grass, near end -> bank lip (grass is right of this line). */
  rightWallFoot: [ghatProject(GH_XR + GH_WALL, 0, GH_WALL_Z0), ghatProject(GH_XR + GH_WALL, 0, GH_LIP_Z)],
  /** The left wall's outer top edge, near end -> water-end post. */
  leftWallEdge: [ghatProject(GH_XL - GH_WALL, GH_WALL_H, GH_WALL_Z0), ghatProject(GH_XL - GH_WALL, GH_WALL_H, GH_ZEND)],
} as const;

const ptsD = (pts: Array<[number, number]>) =>
  `${pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} Z`;
const segD = (a: [number, number], b: [number, number]) => `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
const quadAt = (xa: number, xb: number, h: number, za: number, zb: number) =>
  ptsD([ghatProject(xa, h, za), ghatProject(xb, h, za), ghatProject(xb, h, zb), ghatProject(xa, h, zb)]);

/** Brick courses for a horizontal tread: a joint parallel to the step edge + staggered cross joints, slightly wavy. */
const treadBrickD = (h: number, z0: number, z1: number, rows: number, seed: number) => {
  const out: string[] = [];
  for (let r = 1; r < rows; r++) {
    const z = z0 + ((z1 - z0) * r) / rows;
    out.push(segD(ghatProject(GH_XL + 0.05, h, z), ghatProject(GH_XR - 0.05, h, z + (hash(seed + r) - 0.5) * 0.03)));
  }
  const brick = 0.36;
  for (let r = 0; r < rows; r++) {
    const za = z0 + ((z1 - z0) * r) / rows + 0.02;
    const zb = z0 + ((z1 - z0) * (r + 1)) / rows - 0.02;
    const off = (r % 2) * brick * 0.5 + hash(seed + r) * 0.05;
    for (let X = GH_XL + off + brick; X < GH_XR - 0.08; X += brick) {
      if (hash(seed * 3 + X * 7 + r) < 0.22) continue; // worn joints vanish
      out.push(segD(ghatProject(X, h, za), ghatProject(X + 0.01, h, zb)));
    }
  }
  return out.join(" ");
};

/** Per-brick watercolour mottling on a tread (a few lighter / darker bricks). */
const treadMottle = (h: number, z0: number, z1: number, rows: number, seed: number) => {
  const cells: Array<{ d: string; dark: boolean; o: number }> = [];
  const brick = 0.36;
  for (let r = 0; r < rows; r++) {
    const za = z0 + ((z1 - z0) * r) / rows;
    const zb = z0 + ((z1 - z0) * (r + 1)) / rows;
    const off = (r % 2) * brick * 0.5;
    let k = 0;
    for (let X = GH_XL + off; X < GH_XR - 0.05; X += brick, k++) {
      const hv = hash(seed * 3.1 + r * 17.3 + k * 1.37);
      if (hv > 0.64 || hv < 0.17) {
        cells.push({ d: quadAt(Math.max(GH_XL, X), Math.min(GH_XR, X + brick), h, za, zb), dark: hv < 0.17, o: 0.12 + hash(seed + k * 7.7 + r) * 0.16 });
      }
    }
  }
  return cells;
};

/** An irregular patch (chipped plaster, moss, a wet stain) on a horizontal surface, in ghat metres. */
const patchD = (cx: number, cz: number, rx: number, rz: number, h: number, seed: number, n = 10) => {
  const pts: Array<[number, number]> = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const j = 0.62 + hash(seed * 1.3 + k * 2.7) * 0.55;
    pts.push(ghatProject(cx + Math.cos(a) * rx * j, h, cz + Math.sin(a) * rz * j));
  }
  return ptsD(pts);
};

/** Bottom of the left wall's inner face: the stair profile, or the water surface over the drowned treads. */
const ghatInnerProfile = (): Array<[number, number]> => {
  const pts: Array<[number, number]> = [];
  const push = (h: number, z: number) => pts.push(ghatProject(GH_XL, Math.max(h, GH_WATER), z));
  GH_TREADS.forEach((t) => {
    const za = Math.max(t.z0, GH_WALL_Z0);
    if (t.z1 <= GH_WALL_Z0) return;
    push(t.h, za);
    push(t.h, t.z1);
  });
  push(GH_WATER, GH_ZEND);
  return pts;
};

const GH_BRICK = "#c47d5c";
const GH_BRICK_FACE = "#ad6849";
const GH_PLASTER = "#e7d8bb";
const GH_INK = "#3A2618";

/** Grass along the landing's near edge and the walls' feet, drawn over the brick edges (same layer as the ghat). */
const GHAT_TUFTS = buildGrass(
  190,
  73,
  (h1, h2) => {
    const zone = h1 < 0.4 ? 0 : h1 < 0.72 ? 1 : 2;
    const u = (h1 % 0.32) / 0.32;
    if (zone === 0) {
      // the landing's near edge, where the grass meets the bricks
      const [x, y] = ghatProject(GH_XL - GH_WALL - 0.2 + u * (GH_XR - GH_XL + 2 * GH_WALL + 0.4), 0, GH_Z0 - 0.02 - h2 * 0.08);
      return [x, y];
    }
    if (zone === 1) {
      // the right wall's outer foot (grass side), bank level
      const [x, y] = ghatProject(GH_XR + GH_WALL + 0.03 + h2 * 0.12, 0, GH_WALL_Z0 + u * (GH_LIP_Z - GH_WALL_Z0 - 0.15));
      return [x, y];
    }
    // the left wall's outer top edge (the grass meets it here)
    const [x, y] = ghatProject(GH_XL - GH_WALL - 0.04 - h2 * 0.1, 0, GH_WALL_Z0 + u * (GH_LIP_Z - GH_WALL_Z0 - 0.1));
    return [x, y];
  },
  0.85,
);

/**
 * The redesigned bathing ghat (worn old brick steps into the water, lime plaster, moss, a drowned tread or two seen
 * through the water, lapping at the waterline). `lifeF` defaults to `f`. `dressing` (default true) leaves a brass lota
 * on the first step and a folded gamchha on the left wall.
 */
export const GhibliPondGhat: React.FC<{ f: number; lifeF?: number; dressing?: boolean }> = ({ f, lifeF, dressing = true }) => {
  const lf = lifeF ?? f;
  const P = ghatProject;
  const lw = GH_XL - GH_WALL;
  const rw = GH_XR + GH_WALL;
  const treads = [...GH_TREADS].reverse();
  const profile = ghatInnerProfile();
  const innerFace = ptsD([P(GH_XL, GH_WALL_H, GH_WALL_Z0), P(GH_XL, GH_WALL_H, GH_ZEND), ...[...profile].reverse()]);
  // right wall outer face (camera side): above the grass to the bank lip, then down to the water out in the pond
  const outerFace = ptsD([
    P(rw, GH_WALL_H, GH_WALL_Z0),
    P(rw, GH_WALL_H, GH_ZEND),
    P(rw, GH_WATER, GH_ZEND),
    P(rw, GH_WATER, GH_ZLW),
    P(rw, 0, GH_LIP_Z),
    P(rw, 0, GH_WALL_Z0),
  ]);
  const wallTopL = quadAt(lw, GH_XL, GH_WALL_H, GH_WALL_Z0, GH_ZEND);
  const wallTopR = quadAt(GH_XR, rw, GH_WALL_H, GH_WALL_Z0, GH_ZEND);
  const endL = ptsD([P(lw, GH_WALL_H, GH_WALL_Z0), P(GH_XL, GH_WALL_H, GH_WALL_Z0), P(GH_XL, 0, GH_WALL_Z0), P(lw, 0, GH_WALL_Z0)]);
  const endR = ptsD([P(GH_XR, GH_WALL_H, GH_WALL_Z0), P(rw, GH_WALL_H, GH_WALL_Z0), P(rw, 0, GH_WALL_Z0), P(GH_XR, 0, GH_WALL_Z0)]);

  /** A square post with a lime-plaster cap: near face, +X side face, cap. `bottomH` is where its near face shows from. */
  const post = (x0: number, x1: number, za: number, zb: number, top: number, bottomH: (z: number) => number, k: number) => {
    const cap = 0.07;
    const o = 0.05;
    const nearFace = ptsD([P(x0, top, za), P(x1, top, za), P(x1, bottomH(za), za), P(x0, bottomH(za), za)]);
    const side = ptsD([P(x1, top, za), P(x1, top, zb), P(x1, bottomH(zb), zb), P(x1, bottomH(za), za)]);
    const wet = bottomH(za) < 0;
    return (
      <g key={k}>
        <path d={side} fill="#9a5a3f" />
        <path d={nearFace} fill={GH_BRICK} />
        {/* brick courses and a chipped plaster coat */}
        {Array.from({ length: Math.floor((top - bottomH(za)) / 0.12) }, (_, c) => {
          const h = top - cap - (c + 1) * 0.12;
          return <path key={c} d={segD(P(x0, h, za), P(x1, h, za))} stroke="#ecd9bf" strokeWidth={0.7} opacity={0.45} />;
        })}
        <path d={ptsD([P(x0, top - cap, za), P(x1, top - cap, za), P(x1, top - 0.22 - hash(k) * 0.1, za), P((x0 + x1) / 2, top - 0.3, za), P(x0, top - 0.18, za)])} fill={GH_PLASTER} opacity={0.75} />
        {wet && (
          <path d={ptsD([P(x0, GH_WATER + 0.3, za), P(x1, GH_WATER + 0.26, za), P(x1, GH_WATER, za), P(x0, GH_WATER, za)])} fill="#3f3f2c" opacity={0.45} />
        )}
        {wet && <path d={ptsD([P(x0, GH_WATER + 0.12, za), P(x1, GH_WATER + 0.16, za), P(x1, GH_WATER, za), P(x0, GH_WATER, za)])} fill="#6f8a44" opacity={0.6} />}
        <path d={nearFace} fill="none" stroke={GH_INK} strokeWidth={0.9} opacity={0.6} strokeDasharray="30 4 18 3 50 5" />
        <path d={side} fill="none" stroke={GH_INK} strokeWidth={0.8} opacity={0.45} strokeDasharray="22 5 40 4" />
        {/* the cap: a slab a touch wider than the post */}
        <path d={quadAt(x0 - o, x1 + o, top, za - o, zb + o)} fill="#efe3c9" stroke={GH_INK} strokeWidth={0.8} strokeOpacity={0.55} />
        <path d={ptsD([P(x0 - o, top, za - o), P(x1 + o, top, za - o), P(x1 + o, top - cap, za - o), P(x0 - o, top - cap, za - o)])} fill="#d9c9aa" stroke={GH_INK} strokeWidth={0.7} strokeOpacity={0.5} />
        <path d={patchD((x0 + x1) / 2 + 0.06, (za + zb) / 2, 0.12, 0.1, top, k * 5 + 1, 7)} fill="#c98a68" opacity={0.55} />
      </g>
    );
  };

  // water inside the ghat over the drowned treads, fading out where it meets the open pond
  const zFar = GH_ZEND + 0.55;
  const waterD = quadAt(GH_XL, GH_XR, GH_WATER, GH_ZWL, zFar);
  const waterBottom = P(GH_XL, GH_WATER, GH_ZWL)[1];
  const waterTop = P(GH_XL, GH_WATER, zFar)[1];
  const wl = GH_ZWL + 0.025 * Math.sin(lf * 0.07) + 0.012 * Math.sin(lf * 0.19 + 1);
  const silhouette = [
    innerFace,
    outerFace,
    wallTopL,
    wallTopR,
    endL,
    endR,
    ...GH_TREADS.map((t) => quadAt(GH_XL, GH_XR, t.h, t.z0, t.z1)),
  ].join(" ");
  const cutClip = ptsD([
    [-1200, 1300],
    [-1200, 560],
    P(rw, GH_WATER, zFar + 4),
    P(rw, GH_WATER, GH_ZLW),
    P(rw, 0, GH_LIP_Z),
    P(rw, 0, GH_Z0 - 0.6),
    [P(rw, 0, GH_Z0 - 0.6)[0], 1300],
  ]);
  const lota = ghatSpot(0.1, 1, 0.45);
  const gam = P(lw + 0.2, GH_WALL_H, 8.35);
  const gamS = 6.99 / 8.35;

  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id="ep4gh-water" gradientUnits="userSpaceOnUse" x1={0} y1={waterBottom} x2={0} y2={waterTop}>
          <stop offset="0%" stopColor="#5e8f7b" stopOpacity={0.42} />
          <stop offset="30%" stopColor="#5f927e" stopOpacity={0.72} />
          <stop offset="62%" stopColor="#6a9c88" stopOpacity={0.92} />
          <stop offset="100%" stopColor="#77a592" stopOpacity={0} />
        </linearGradient>
        <filter id="ep4gh-soft" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
        <filter id="ep4gh-mottle" filterUnits="userSpaceOnUse" x={40} y={760} width={760} height={230} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.035" numOctaves={3} seed={17} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.40  0 0 0 0 0.24  0 0 0 0 0.16  4.2 0 0 0 -1.9" />
        </filter>
        <clipPath id="ep4gh-clip">
          <path d={silhouette} />
        </clipPath>
        <clipPath id="ep4gh-wclip">
          <path d={waterD} />
        </clipPath>
        {/* the deep treads near the right wall hide behind the wall and the earth it holds back: nothing of the cut
            may show right of the wall's outer foot */}
        <clipPath id="ep4gh-cut">
          <path d={cutClip} />
        </clipPath>
      </defs>

      <g clipPath="url(#ep4gh-cut)">
      {/* treads, from the drowned ones up to the landing at bank level */}
      {treads.map((t) => {
        const wet = clamp(t.i / 3, 0, 1);
        const sub = t.h < GH_WATER;
        const d = quadAt(GH_XL, GH_XR, t.h, t.z0, t.z1);
        const rows = t.i === 0 ? 3 : 1;
        return (
          <g key={t.i}>
            <path d={d} fill={sub ? "#7d6a4e" : GH_BRICK} />
            <path d={d} fill="#4c3628" opacity={sub ? 0.25 : 0.03 + wet * 0.36} />
            {/* the drop: the shaded first strip seen over the step above */}
            {t.i > 0 &&
              (() => {
                const zv = (t.z0 * (GH_E - t.h)) / (GH_E - (t.h + GH_RISER));
                return (
                  <>
                    <path d={quadAt(GH_XL, GH_XR, t.h, zv, zv + 0.2)} fill="#2a180c" opacity={sub ? 0.22 : 0.4} filter="url(#ep4gh-soft)" />
                    <path d={quadAt(GH_XL, GH_XR, t.h, zv, zv + 0.06)} fill="#2a180c" opacity={sub ? 0.25 : 0.55} />
                  </>
                );
              })()}
            {treadMottle(t.h, t.z0, t.z1, rows, 13 + t.i * 7).map((c, k) => (
              <path key={k} d={c.d} fill={c.dark ? "#83492f" : "#e2aa86"} opacity={c.o * (sub ? 0.4 : 0.85)} />
            ))}
            <path d={treadBrickD(t.h, t.z0, t.z1, rows, 5 + t.i)} fill="none" stroke="#efe0c8" strokeWidth={0.8} opacity={sub ? 0.2 : 0.5} />
            <path d={treadBrickD(t.h, t.z0, t.z1, rows, 5 + t.i)} fill="none" stroke={GH_INK} strokeWidth={0.5} opacity={0.2} />
            {/* chipped lime plaster left on the dry steps, more on the landing */}
            {!sub &&
              Array.from({ length: t.i === 0 ? 5 : 2 }, (_, k) => {
                const hx = hash(t.i * 17 + k * 5.3);
                const hz = hash(t.i * 29 + k * 3.1);
                // remnants of the old lime coat cling along the step edge and the wall corners
                const atEdge = k % 2 === 0;
                const cx = atEdge ? GH_XL + 0.5 + hx * (GH_XR - GH_XL - 1) : hx > 0.5 ? GH_XR - 0.18 : GH_XL + 0.18;
                const cz = atEdge ? t.z1 - 0.07 : t.z0 + 0.15 + hz * (t.z1 - t.z0 - 0.3);
                const pd = patchD(cx, cz, atEdge ? 0.2 + hx * 0.25 : 0.12, atEdge ? 0.045 : 0.1 + hz * 0.1, t.h, t.i * 7 + k);
                return (
                  <g key={k}>
                    <path d={pd} fill="#dccab0" opacity={0.6 - wet * 0.25} />
                    <path d={pd} fill="none" stroke={GH_INK} strokeWidth={0.5} opacity={0.35} strokeDasharray="8 5 14 4" />
                  </g>
                );
              })}
            {/* the step's worn, rounded nosing: a soft lit band, then a broken ink edge */}
            {t.i < GH_STEPS && (
              <>
                <path d={quadAt(GH_XL, GH_XR, t.h, t.z1 - 0.09, t.z1)} fill="#f4dcbc" opacity={sub ? 0.2 : 0.55} />
                <path d={segD(P(GH_XL, t.h, t.z1 - 0.035), P(GH_XR, t.h, t.z1 - 0.035))} stroke="#f8e6cc" strokeWidth={1.6} opacity={sub ? 0.25 : 0.7} strokeDasharray="60 9 26 6 90 12 40 7" />
                <path d={segD(P(GH_XL, t.h, t.z1), P(GH_XR, t.h, t.z1))} stroke={GH_INK} strokeWidth={1.3} opacity={sub ? 0.22 : 0.62} strokeDasharray="80 7 34 5 120 9 22 6" />
              </>
            )}
            {/* the right wall's shade along each tread (sun from the right) */}
            <path d={quadAt(GH_XR - 0.6, GH_XR, t.h, t.z0, t.z1)} fill="#3f2a1e" opacity={0.2} filter="url(#ep4gh-soft)" />
            {/* the wet sheen on the last dry step */}
            {t.i === 3 &&
              [0.3, 0.55, 0.75].map((zz, k) => (
                <path
                  key={k}
                  d={segD(P(GH_XL + 0.5 + k * 0.9, t.h, t.z0 + zz * GH_TREAD), P(GH_XL + 1.4 + k * 1.1, t.h, t.z0 + zz * GH_TREAD))}
                  stroke="#f4efe2"
                  strokeWidth={1.1}
                  opacity={0.35 + 0.15 * Math.sin(lf * 0.05 + k * 2)}
                  strokeLinecap="round"
                />
              ))}
          </g>
        );
      })}

      {/* moss and damp darkening near the water (one soft pass) */}
      <g filter="url(#ep4gh-soft)">
        {GH_TREADS.slice(2, 4).map((t) => {
          const s = 6.99 / t.z0;
          const [x0, y0] = P(GH_XL + 0.25, t.h, t.z0 + 0.25);
          const [x1, y1] = P(GH_XR - 0.5, t.h, t.z1 - 0.12);
          return (
            <g key={t.i}>
              <ellipse cx={x0} cy={y0} rx={24 * s} ry={4 * s} fill="#6c8640" opacity={0.42 + t.i * 0.08} />
              <ellipse cx={x1} cy={y1} rx={18 * s} ry={3 * s} fill="#647c3c" opacity={0.3 + t.i * 0.08} />
            </g>
          );
        })}
        <path d={quadAt(GH_XL, GH_XR, GH_TREADS[3].h, GH_ZWL - 0.18, GH_ZWL)} fill="#3e3424" opacity={0.35} />
      </g>

      {/* the pond inside the ghat: the drowned treads seen through it, light rippling over them, a lapping waterline */}
      <path d={waterD} fill="url(#ep4gh-water)" />
      <GhibliWaterLight
        region={{ x: P(GH_XL, GH_WATER, GH_ZWL)[0], y: waterTop, w: P(GH_XR, GH_WATER, GH_ZWL)[0] - P(GH_XL, GH_WATER, GH_ZWL)[0], h: waterBottom - waterTop }}
        shape={waterD}
        lifeF={lf}
        intensity={0.32}
        scale={0.55}
        fade="top"
        speed={0.7}
        seed={4}
      />
      <g clipPath="url(#ep4gh-wclip)">
        {[0, 1, 2, 3].map((i) => {
          const p = (((lf * 0.009 + i * 0.25) % 1) + 1) % 1;
          const z = GH_ZWL + 0.06 + p * 1.5;
          const xa = GH_XL + 0.3 + hash(i * 3.7) * 1.4;
          return (
            <path
              key={i}
              d={`M ${P(xa, GH_WATER, z)[0].toFixed(1)} ${P(xa, GH_WATER, z)[1].toFixed(1)} Q ${P(xa + 1.2, GH_WATER, z + 0.06)[0].toFixed(1)} ${P(xa + 1.2, GH_WATER, z + 0.06)[1].toFixed(1)} ${P(xa + 2.6, GH_WATER, z)[0].toFixed(1)} ${P(xa + 2.6, GH_WATER, z)[1].toFixed(1)}`}
              fill="none"
              stroke="#eef6f0"
              strokeWidth={1.1}
              opacity={(1 - p) * 0.5}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <path d={segD(P(GH_XL, GH_WATER, wl), P(GH_XR, GH_WATER, wl))} stroke="#eef5ee" strokeWidth={2.4} opacity={0.6} filter="url(#ep4gh-soft)" />
      <path
        d={Array.from({ length: 13 }, (_, k) => {
          const X = GH_XL + (k / 12) * (GH_XR - GH_XL);
          const [x, y] = P(X, GH_WATER, wl + 0.02 + 0.015 * Math.sin(k * 1.9 + lf * 0.12));
          return `${k ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join(" ")}
        fill="none"
        stroke="#ffffff"
        strokeWidth={1}
        opacity={0.55}
        strokeDasharray="12 6 20 5"
      />
      </g>

      {/* left wall: inner face (lit, taller as the steps drop), courses, damp band, moss and water light by the water */}
      <path d={innerFace} fill={GH_BRICK_FACE} />
      {Array.from({ length: 6 }, (_, k) => {
        const h = GH_WALL_H - (k + 1) * 0.13;
        return <path key={k} d={segD(P(GH_XL, h, GH_WALL_Z0 + 0.05), P(GH_XL, h, GH_ZEND))} stroke="#ecdcc3" strokeWidth={0.7} opacity={0.42} strokeDasharray="40 6 70 9" />;
      })}
      <path d={ptsD([P(GH_XL, GH_WATER + 0.32, 8.7), P(GH_XL, GH_WATER + 0.32, GH_ZEND), P(GH_XL, GH_WATER, GH_ZEND), P(GH_XL, GH_WATER, 8.7)])} fill="#3a3626" opacity={0.42} filter="url(#ep4gh-soft)" />
      <path d={ptsD([P(GH_XL, GH_WATER + 0.16, 8.95), P(GH_XL, GH_WATER + 0.2, GH_ZEND - 0.2), P(GH_XL, GH_WATER, GH_ZEND - 0.2), P(GH_XL, GH_WATER, 8.95)])} fill="#6b8742" opacity={0.6} filter="url(#ep4gh-soft)" />
      <GhibliWaterLight
        region={{ x: P(GH_XL, 0, 8.7)[0], y: P(GH_XL, 0.1, 8.7)[1], w: P(GH_XL, 0, GH_ZEND)[0] - P(GH_XL, 0, 8.7)[0], h: P(GH_XL, GH_WATER, 8.7)[1] - P(GH_XL, 0.1, 8.7)[1] }}
        shape={innerFace}
        lifeF={lf}
        intensity={0.3}
        scale={0.45}
        speed={0.8}
        seed={7}
      />
      <path d={innerFace} fill="none" stroke={GH_INK} strokeWidth={1} opacity={0.5} strokeDasharray="50 5 30 4 90 7" />
      <path d={profile.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} fill="none" stroke="#2e1c12" strokeWidth={1.5} opacity={0.5} />

      {/* right wall: outer face (camera side), damp and mossy where it stands in the pond */}
      <path d={outerFace} fill={GH_BRICK_FACE} />
      {[0.08, 0.16].map((dh, k) => (
        <path key={k} d={segD(P(rw, GH_WALL_H - dh, GH_WALL_Z0), P(rw, GH_WALL_H - dh, GH_ZEND))} stroke="#ecdcc3" strokeWidth={0.7} opacity={0.42} strokeDasharray="36 6 60 8" />
      ))}
      <path d={ptsD([P(rw, -0.3, GH_ZLW), P(rw, -0.3, GH_ZEND), P(rw, GH_WATER, GH_ZEND), P(rw, GH_WATER, GH_ZLW)])} fill="#463c2c" opacity={0.45} filter="url(#ep4gh-soft)" />
      <path d={ptsD([P(rw, GH_WATER + 0.12, GH_ZLW), P(rw, GH_WATER + 0.12, GH_ZEND), P(rw, GH_WATER, GH_ZEND), P(rw, GH_WATER, GH_ZLW)])} fill="#6b8742" opacity={0.55} />
      <path d={segD(P(rw, GH_WATER, GH_ZLW), P(rw, GH_WATER, GH_ZEND))} stroke="#e9f2ea" strokeWidth={1.5} opacity={0.45 + 0.15 * Math.sin(lf * 0.08)} />
      <path d={outerFace} fill="none" stroke={GH_INK} strokeWidth={1} opacity={0.5} strokeDasharray="44 5 26 4 70 6" />

      {/* wall tops: lime plaster, chipped to the brick in places; their near end faces */}
      <path d={wallTopL} fill={GH_PLASTER} />
      <path d={wallTopR} fill="#ede0c4" />
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const left = k % 2 === 0;
        const z = GH_WALL_Z0 + 0.4 + hash(k * 7.3) * (GH_ZEND - GH_WALL_Z0 - 0.9);
        const cx = left ? (lw + GH_XL) / 2 : (GH_XR + rw) / 2;
        return <path key={k} d={patchD(cx + (hash(k) - 0.5) * 0.1, z, 0.12 + hash(k * 2) * 0.06, 0.16 + hash(k * 3) * 0.2, GH_WALL_H, k * 3 + 2, 8)} fill="#c58566" opacity={0.75} />;
      })}
      <path d={wallTopL} fill="none" stroke={GH_INK} strokeWidth={0.9} opacity={0.5} strokeDasharray="40 6 22 4 60 5" />
      <path d={wallTopR} fill="none" stroke={GH_INK} strokeWidth={0.9} opacity={0.5} strokeDasharray="36 5 28 6 50 4" />
      <path d={endL} fill={GH_BRICK} stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.55} />
      <path d={endR} fill={GH_BRICK} stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.55} />

      {/* square posts: low ones at the landing, taller ones out in the water */}
      {post(lw - 0.03, GH_XL + 0.03, GH_WALL_Z0, GH_WALL_Z0 + 0.42, GH_GATE_H, () => 0, 1)}
      {post(GH_XR - 0.03, rw + 0.03, GH_WALL_Z0, GH_WALL_Z0 + 0.42, GH_GATE_H, () => 0, 2)}
      {post(lw - 0.04, GH_XL + 0.04, GH_ZLAST - 0.05, GH_ZEND, GH_POST_H, () => GH_WATER, 3)}
      {post(GH_XR - 0.04, rw + 0.04, GH_ZLAST - 0.05, GH_ZEND, GH_POST_H, (z) => Math.max(GH_WATER, GH_E - (336 * z) / GH_F), 4)}
      {/* the water lapping round the water-end posts */}
      {[lw - 0.04, GH_XR - 0.04].map((x0, k) => {
        const a = P(x0 - 0.1, GH_WATER, GH_ZLAST - 0.08);
        const b = P(x0 + GH_WALL + 0.18, GH_WATER, GH_ZLAST - 0.08);
        const bob = Math.sin(lf * 0.09 + k * 2) * 0.8;
        return <path key={k} d={`M ${a[0].toFixed(1)} ${(a[1] + bob).toFixed(1)} Q ${((a[0] + b[0]) / 2).toFixed(1)} ${(a[1] + 3 + bob).toFixed(1)} ${b[0].toFixed(1)} ${(b[1] + bob).toFixed(1)}`} fill="none" stroke="#f0f7f0" strokeWidth={1.4} opacity={0.6} />;
      })}

      {/* left on the steps: a brass lota on the first step, a folded red-check gamchha on the left wall */}
      {dressing && (
        <g>
          <g transform={`translate(${lota.x.toFixed(1)} ${lota.y.toFixed(1)}) scale(${(lota.scale * 0.95).toFixed(3)})`}>
            <ellipse cx={2} cy={1} rx={15} ry={3.4} fill="#3a2414" opacity={0.3} />
            <path d="M -11 -12 C -14 -4 -9 1 0 1 C 9 1 14 -4 11 -12 C 9 -18 5 -20 4 -22 L -4 -22 C -5 -20 -9 -18 -11 -12 Z" fill="#c8963a" stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.7} />
            <path d="M -5 -22 C -7 -25 -7 -27 -8 -28 L 8 -28 C 7 -27 7 -25 5 -22 Z" fill="#b68330" stroke={GH_INK} strokeWidth={0.8} strokeOpacity={0.7} />
            <ellipse cx={0} cy={-28} rx={8} ry={1.8} fill="#e2b75a" stroke={GH_INK} strokeWidth={0.7} strokeOpacity={0.6} />
            <path d="M 4 -16 C 7 -14 8 -9 6 -5" fill="none" stroke="#f6dd8e" strokeWidth={2.2} opacity={0.8} strokeLinecap="round" />
            <path d="M -9 -8 C -8 -4 -4 -1 1 -1" fill="none" stroke="#7a5320" strokeWidth={1.6} opacity={0.5} />
          </g>
          <g transform={`translate(${gam[0].toFixed(1)} ${gam[1].toFixed(1)}) scale(${gamS.toFixed(3)})`}>
            <path d="M -16 -3 L 14 -5 L 18 2 L -12 4 Z" fill="#c9443a" stroke={GH_INK} strokeWidth={0.8} strokeOpacity={0.6} />
            <path d="M -16 -3 L -12 4 L -12 7 L -16 0 Z" fill="#9e3029" />
            <path d="M -10 -3.4 L -6 3.4 M -2 -4 L 2 3 M 6 -4.4 L 10 2.6 M -14 0 L 16 -1.6" stroke="#f3ebdc" strokeWidth={1} opacity={0.85} />
          </g>
        </g>
      )}

      {/* where the landing meets the grass, mottling and paper tooth over the bricks */}
      <path d={segD(P(GH_XL - GH_WALL, 0, GH_Z0), P(GH_XR + GH_WALL, 0, GH_Z0))} stroke="#3d3020" strokeWidth={3} opacity={0.3} filter="url(#ep4gh-soft)" />
      <rect x={40} y={760} width={760} height={230} clipPath="url(#ep4gh-clip)" filter="url(#ep4gh-mottle)" opacity={0.34} />
      <image
        href={staticFile("images/ghibli_ep04/watercolor_paper_grain.png")}
        x={-200}
        y={700}
        width={1920}
        height={1080}
        preserveAspectRatio="none"
        opacity={0.7}
        clipPath="url(#ep4gh-clip)"
        style={{ mixBlendMode: "multiply" }}
      />
      {/* grass over the brick edges */}
      {GHAT_TUFTS.fills.map((d, i) => (
        <path key={i} d={d} fill={GRASS_FILLS[i]} opacity={0.9} />
      ))}
      <path d={GHAT_TUFTS.ink[0]} fill="none" stroke="#4d3724" strokeWidth={0.8} opacity={0.4} />
      <path d={GHAT_TUFTS.ink[1]} fill="none" stroke="#4d3724" strokeWidth={1} opacity={0.4} />
    </g>
  );
};

/** Contact shading where the mandar trunk and the banana clump meet the bank. */
const GhibliPondBaseShadows: React.FC = () => (
  <g pointerEvents="none">
    <defs>
      <filter id="ep4pb-cs6" x="-30%" y="-120%" width="160%" height="340%">
        <feGaussianBlur stdDeviation={6} />
      </filter>
      <filter id="ep4pb-cs14" x="-30%" y="-120%" width="160%" height="340%">
        <feGaussianBlur stdDeviation={14} />
      </filter>
    </defs>
    <ellipse cx={1360} cy={944} rx={200} ry={26} fill="#222b15" opacity={0.36} filter="url(#ep4pb-cs14)" />
    <ellipse cx={1350} cy={945} rx={82} ry={10} fill="#1a2010" opacity={0.5} filter="url(#ep4pb-cs6)" />
    <ellipse cx={1790} cy={942} rx={240} ry={24} fill="#222b15" opacity={0.32} filter="url(#ep4pb-cs14)" />
    <ellipse cx={1790} cy={942} rx={110} ry={9} fill="#1a2010" opacity={0.36} filter="url(#ep4pb-cs6)" />
  </g>
);

/** Grass tufts and petals overlapping the bases of the set pieces (drawn over them). */
const GhibliPondBaseTufts: React.FC = () => (
  <g pointerEvents="none">
    {BASE_TUFTS.fills.map((d, i) => (
      <path key={i} d={d} fill={GRASS_FILLS[i]} opacity={0.9} />
    ))}
    <path d={BASE_TUFTS.ink[0]} fill="none" stroke="#4d3724" strokeWidth={0.8} opacity={0.4} />
  </g>
);

/** Which parts of the living pond the backdrop draws (every one defaults to on). */
export interface GhibliPondLifeOptions extends PondWaterOptions {
  /** The animated water surface (false falls back to the old static emerald plate). */
  water?: boolean;
  lilies?: boolean;
  fishRings?: boolean;
  ducks?: boolean;
  /** The new skimming dragonflies (the old single teal one is the `dragonfly` prop). */
  dragonflies?: boolean;
  striders?: boolean;
  kingfisher?: boolean;
  edgePlants?: boolean;
  groundCover?: boolean;
  butterflies?: boolean;
  floatingPetals?: boolean;
  /** The brass lota and folded gamchha left on the ghat. */
  ghatDressing?: boolean;
}

/**
 * The ducks' default crossing (life-layer px, depth 0.72): right to left across the open water, ~1 min. It starts left of
 * the banana clump so the tight Scene 02 two-shots (camera on the banana, faces just above the waterline) stay clear.
 */
export const EP04_POND_DUCK_PATH: PondDuckPath = { from: { x: 1380, y: 728 }, to: { x: 240, y: 738 }, start: 0, frames: 1500 };

/** Lily clusters in the life layer (depth 0.72): small far ones on y ~ 672, bigger near ones on y ~ 738. */
const POND_LILIES = [
  ...pondLilyCluster(-150, 672, 280, 8, 3, 10, 0.4),
  ...pondLilyCluster(420, 670, 200, 5, 11, 9.5, 0.3),
  ...pondLilyCluster(1530, 676, 240, 8, 19, 10, 0.45),
  ...pondLilyCluster(2060, 670, 300, 8, 27, 10, 0.35),
  ...pondLilyCluster(170, 736, 220, 5, 31, 14, 0.4),
  ...pondLilyCluster(1600, 740, 240, 6, 37, 14, 0.5),
].sort((a, b) => a.y - b.y);

const POND_EDGE_CLUMPS: PondEdgeClump[] = [
  { x: -330, y: bankEdgeY(-330) - 2, kind: "hyacinth", s: 0.72, seed: 3 },
  { x: -180, y: bankEdgeY(-180) - 1, kind: "hyacinth", s: 0.55, seed: 9 },
  { x: -40, y: bankEdgeY(-40) + 6, kind: "kalmi", s: 0.7, dir: 1, seed: 5 },
  { x: 905, y: bankEdgeY(905) - 1, kind: "hyacinth", s: 0.5, seed: 15 },
  { x: 1600, y: bankEdgeY(1600) - 2, kind: "hyacinth", s: 0.6, seed: 21 },
  { x: 1680, y: bankEdgeY(1680) - 1, kind: "hyacinth", s: 0.48, seed: 27 },
  { x: 1990, y: bankEdgeY(1990) + 6, kind: "kalmi", s: 0.7, dir: -1, seed: 31 },
  { x: 2160, y: bankEdgeY(2160) - 2, kind: "hyacinth", s: 0.7, seed: 35 },
  { x: 2330, y: bankEdgeY(2330) - 1, kind: "hyacinth", s: 0.6, seed: 41 },
];

const POND_COVER: PondCoverPatch[] = [
  { x: 1800, y: 944, w: 330, s: 1, ferns: 3, flowers: 4, seed: 7 },
  { x: 1365, y: 948, w: 180, s: 1, ferns: 1, flowers: 2, seed: 13 },
  { x: 1560, y: 938, w: 120, s: 0.9, ferns: 1, flowers: 3, seed: 19 },
  { x: 2120, y: 950, w: 200, s: 1, ferns: 2, flowers: 3, seed: 23 },
];

/** Reusable daytime pond backdrop (Scenes 02 & 03) with the living pond, the ghat and an upstage occlusion slot. */
export const GhibliPondBackdrop: React.FC<{
  f: number;
  upstageBehindTree?: React.ReactNode;
  /** The old skimming dragonfly (default on). At medium zooms it reads as a stray teal dash; Scenes 02/03 turn it off. */
  dragonfly?: boolean;
  /** Real (life) frame for the pond's motion; defaults to `f`. */
  lifeF?: number;
  /** Turn parts of the living pond off (all on by default), e.g. `pondLife={{ ducks: false, mist: 0 }}`. */
  pondLife?: GhibliPondLifeOptions;
  /** Move the ducks: life-layer px (depth 0.72, keep y 715-742), life-clock start and length. */
  duckPath?: PondDuckPath;
  /** Story frame at which the kingfisher on the right ghat post dives once (put it in a wordless moment). */
  kingfisherDiveAt?: number;
}> = ({ f, upstageBehindTree, dragonfly = true, lifeF, pondLife = {}, duckPath = EP04_POND_DUCK_PATH, kingfisherDiveAt }) => {
  const lf = lifeF ?? f;
  const on = (k: keyof GhibliPondLifeOptions) => pondLife[k] !== false;
  const water = on("water");
  const kfPerch = ghatProject(GH_XR + GH_WALL / 2, GH_POST_H, GH_ZLAST + 0.2);
  const kfTarget = ghatProject(-6.3, GH_WATER, GH_ZEND + 0.35);
  const sA = ghatProject(GH_XL + 0.7, GH_WATER, 9.32);
  const sB = ghatProject(GH_XR - 0.9, GH_WATER, 9.9);
  return (
    <>
      <GhibliLayer depth={0.08} parallaxDrift={0.004}>
        <image href={staticFile("images/ghibli_ep04/sky_ep04_pond_day.png")} x={-320} y={-240} width={2560} height={1440} preserveAspectRatio="xMidYMin slice" />
      </GhibliLayer>
      <GhibliLayer depth={0.45} extraBlur={0.8}>
        <image href={staticFile("images/ghibli_ep04/pond_far_bank_baidik_sketch.png")} x={-640} y={320} width={3200} height={360} />
      </GhibliLayer>
      {water && (
        <GhibliLayer depth={0.45} extraBlur={0.2}>
          <PondWaterSurface
            lifeF={lf}
            farReflection={pondLife.farReflection}
            skyReflections={pondLife.skyReflections}
            ripples={pondLife.ripples}
            glints={pondLife.glints}
            cloudShadows={pondLife.cloudShadows}
            catsPaws={pondLife.catsPaws}
            mist={pondLife.mist}
          />
        </GhibliLayer>
      )}
      <GhibliLayer depth={0.58}>
        {!water && <image href={staticFile("images/ghibli_ep04/pond_water_emerald_sketch.png")} x={-1760} y={560} width={5440} height={1200} />}
        <GhibliMandarPetals f={f} count={8} seed={71} withRipples={!water} />
      </GhibliLayer>
      <GhibliLayer depth={0.68}>
        <GhibliVolumetricBeam f={f} color="#fff7d6" opacity={0.14} fromRight />
        <GhibliAtmosphericHaze f={f} />
      </GhibliLayer>
      {water && (
        <GhibliLayer depth={POND_BANDS.life.depth}>
          {on("lilies") && <PondLilies lilies={POND_LILIES} lifeF={lf} s={1} />}
          {on("floatingPetals") && <PondFloatingPetals region={{ x: 1180, y: 726, w: 380, h: 16 }} lifeF={lf} s={0.85} />}
          {on("fishRings") && <PondFishRings region={{ x: 300, y: 668, w: 1500, h: 66 }} lifeF={lf} slots={4} s={0.85} seed={5} />}
          {on("ducks") && <PondDucks lifeF={lf} path={duckPath} s={0.85} />}
          {on("dragonflies") && (
            <PondDragonflies
              zones={[
                { x: 820, y: 684, w: 420, h: 30 },
                { x: 1450, y: 680, w: 380, h: 30 },
              ]}
              lifeF={lf}
              s={0.8}
            />
          )}
        </GhibliLayer>
      )}
      {/* painted grassy bank, locked to the cast's ground plane (feet at y = 935-940) */}
      <GhibliLayer depth={0.92} groundLocked>
        <GhibliPondBank f={lf} />
        {on("edgePlants") && <PondEdgePlants clumps={POND_EDGE_CLUMPS} lifeF={lf} />}
        {/* the brick ghat steps down from the bank into the water */}
        <GhibliPondGhat f={f} lifeF={lf} dressing={on("ghatDressing")} />
        {on("striders") && <PondWaterStriders region={{ x: sA[0], y: sB[1], w: sB[0] - sA[0], h: sA[1] - sB[1] }} lifeF={lf} s={0.8} />}
        {on("kingfisher") && <PondKingfisher f={f} lifeF={lf} perch={{ x: kfPerch[0], y: kfPerch[1] }} target={{ x: kfTarget[0], y: kfTarget[1] }} diveAt={kingfisherDiveAt} s={0.72} />}
      </GhibliLayer>
      <GhibliLayer depth={0.78} groundLocked parallaxDrift={-0.028}>
        <GhibliPondBaseShadows />
        <GhibliCutout
          file="images/ghibli_ep04/banana_clump_pond_sketch.png"
          anchor={GHIBLI_ANCHORS.banana_clump_pond_sketch}
          x={1780}
          y={940}
          targetHeight={520}
        />
        {upstageBehindTree}
        <GhibliCutout
          file="images/ghibli_ep04/tree_mandar_bloom_sketch.png"
          anchor={GHIBLI_ANCHORS.tree_mandar_bloom_sketch}
          x={1360}
          y={945}
          targetHeight={760}
        />
        <GhibliPondBaseTufts />
        {on("groundCover") && <PondBankGroundCover patches={POND_COVER} lifeF={lf} />}
        {on("butterflies") && (
          <PondButterflies
            flowers={[
              { x: 1545, y: 930 },
              { x: 2070, y: 940 },
              { x: 1985, y: 936 },
            ]}
            lifeF={lf}
            s={0.9}
          />
        )}
        {dragonfly && <GhibliDragonfly f={f} />}
      </GhibliLayer>
    </>
  );
};

/** Reusable 10-Plane Purnima Evening Shrine Room Backdrop (Scenes 05 & 06). */
export const GhibliShrineBackdrop: React.FC<{ f: number }> = ({ f }) => {
  return (
    <>
      <GhibliLayer depth={0.08}>
        <image href={staticFile("images/ghibli_ep04/sky_ep04_purnima_dusk.png")} x={-320} y={-140} width={2560} height={1440} />
      </GhibliLayer>
      <GhibliLayer depth={0.58}>
        <image href={staticFile("images/ghibli_ep04/thakur_ghar_interior_sketch.png")} x={-160} y={-90} width={2240} height={1260} />
      </GhibliLayer>
      <GhibliLayer depth={0.68}>
        <GhibliVolumetricBeam f={f} color="#ffc974" opacity={0.22} fromRight={false} flicker />
        <GhibliSmokeCurls x={1110} y={840} f={f} scale={1.1} />
      </GhibliLayer>
      <GhibliLayer depth={0.78} groundLocked parallaxDrift={-0.02}>
        <GhibliCutout
          file="images/ghibli_ep04/deity_khat_shrine_sketch.png"
          anchor={GHIBLI_ANCHORS.deity_khat_shrine_sketch}
          x={1080}
          y={940}
          targetHeight={450}
        />
      </GhibliLayer>
    </>
  );
};

/**
 * Shrine arch frame placement (as GhibliCutout computes it) and a clean outline in plate pixels
 * (1362 x 1440) that trims the torn-paper fringes outside the pillars, capitals and arch.
 */
const ARCH_H = 1150;
const ARCH_K = ARCH_H / GHIBLI_ANCHORS.shrine_arch_frame_sketch.height;
const ARCH_W = GHIBLI_ANCHORS.shrine_arch_frame_sketch.width * ARCH_K;
const ARCH_DX = 960 - ARCH_W * GHIBLI_ANCHORS.shrine_arch_frame_sketch.anchorX;
const ARCH_DY = 1095 - ARCH_H * GHIBLI_ANCHORS.shrine_arch_frame_sketch.anchorY;
const ARCH_CLEAN_D =
  "M 134 1440 L 134 606 L 46 598 L 46 506 L 88 506 A 584 478 0 0 1 1256 506 L 1318 506 L 1318 598 L 1220 606 L 1220 1440 Z";

/** Foreground bokeh + watercolor paper tooth finish (`depth=1.30`). */
export const GhibliEp04ForegroundFinish: React.FC<{
  f: number;
  zoom: number;
  shrineArch?: boolean;
  petals?: boolean;
  warmth?: number;
  /** The foreground branch bokeh (default true); a scene may drop it in close shots. */
  bokeh?: boolean;
}> = ({ f, zoom, shrineArch = false, petals = false, warmth = 0.24, bokeh = true }) => (
  <>
    {shrineArch && (
      <GhibliLayer depth={1.14} extraBlur={1.1} opacity={clamp(1.25 - (zoom - 1) * 0.55, 0.15, 0.92)}>
        <defs>
          <filter id="ep4-arch-feather" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={3} />
          </filter>
          <mask id="ep4-arch-clean" maskUnits="userSpaceOnUse" x={ARCH_DX - 60} y={ARCH_DY - 60} width={ARCH_W + 120} height={ARCH_H + 120}>
            <path
              d={ARCH_CLEAN_D}
              transform={`translate(${ARCH_DX.toFixed(2)} ${ARCH_DY.toFixed(2)}) scale(${ARCH_K.toFixed(5)})`}
              fill="#fff"
              filter="url(#ep4-arch-feather)"
            />
          </mask>
        </defs>
        <g mask="url(#ep4-arch-clean)">
          <GhibliCutout
            file="images/ghibli_ep04/shrine_arch_frame_sketch.png"
            anchor={GHIBLI_ANCHORS.shrine_arch_frame_sketch}
            x={960}
            y={1095}
            targetHeight={ARCH_H}
          />
        </g>
      </GhibliLayer>
    )}
    <GhibliLayer depth={1.3} extraBlur={3.6} parallaxDrift={0.045}>
      {bokeh && <GhibliForegroundBokeh f={f} zoom={zoom} />}
      {petals && <GhibliMandarPetals f={f} count={6} seed={99} />}
    </GhibliLayer>
    <GhibliGrade paperOpacity={0.16} vignette={0.26} warmth={warmth} />
  </>
);

/** Chapter Break (CAM-10: fade to black, quiet hold, fade in). */
export const GhibliChapterBreak: React.FC = () => {
  return <AbsoluteFill style={{ background: "#120d08" }} />;
};

/** Episode 4 title: this courtyard, series name small, one episode title. */
export const GhibliScene00IntroEp04: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const fade = Math.min(clamp(f / 16), clamp((200 - f) / 18));
  // The same multiplane courtyard the episode opens in (STO-22c), so the floor plate covers the back plate's base
  // (no stretched edge pixels anywhere): a slow push in over the title.
  const z = 1.04 + clamp(f / 190) * 0.08;
  const cam = { x: 0, y: 734 - 540 - (712 - 540) / z, zoom: z, focus: 1 };
  return (
    <AbsoluteFill style={{ background: "#1c120c", opacity: fade, overflow: "hidden" }}>
      <GhibliPreload
        files={[
          "images/ghibli_ep04/sky_ep04_morning_courtyard.png",
          "images/ghibli_ep04/far_trees_ep04_sketch.png",
          "images/ghibli_ep04/courtyard_back_ep04_morning.png",
          "images/ghibli_ep04/courtyard_floor_ep04_sketch.png",
          "images/ghibli_ep04/tulsi_mancha_ep04_sketch.png",
        ]}
      />
      <GhibliStage cam={cam}>
        <GhibliCourtyardBackdrop f={f} mode="morning" sparrowFlyAt={150} />
      </GhibliStage>
      {/* a soft umber-saffron wash behind the title so it reads on the pale plaster */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 70,
          width: 1500,
          height: 470,
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(46,22,8,0.62) 0%, rgba(70,34,10,0.42) 48%, rgba(120,62,16,0.12) 78%, rgba(120,62,16,0) 100%)",
          opacity: clamp((f - 4) / 18),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 128,
          textAlign: "center",
          fontFamily: BN_FONT,
          color: "#fff6e4",
          textShadow: "0 2px 4px rgba(30,12,4,0.85), 0 4px 22px rgba(30,12,4,0.75)",
        }}
      >
        <div style={{ fontSize: 50, fontWeight: 600, letterSpacing: 1, opacity: clamp((f - 8) / 16) }}>ছোটদের বালক ঠাকুরের গল্প</div>
        <div style={{ fontSize: 40, fontWeight: 600, marginTop: 14, color: "#ffd27a", opacity: clamp((f - 28) / 16) }}>পর্ব চার</div>
        <div style={{ fontSize: 88, fontWeight: 700, marginTop: 18, lineHeight: 1.25, opacity: clamp((f - 46) / 18) }}>
          শিবলিঙ্গ, গোবিন্দ ও নারিকেলোদক
        </div>
      </div>
      <GhibliGrade warmth={0.2} vignette={0.28} paperOpacity={0.12} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Outro (Block 99): the Padma at sunset, a slow drift, birds, the boat  */
/* rocking, and the soft boxless Episode 5 glimpse                      */
/* ------------------------------------------------------------------ */

const OUTRO_FRAMES = 638;
/** The glimpse comes in with the narration's "আসছে পরের পর্ব…" (its caption starts at outro-local 430). */
const GLIMPSE_AT = 412;
const GLIMPSE_IN = 30;
const GLIMPSE_END = 618;
const GLIMPSE_OUT = 30;

/* The vignette: centred under the series title, feathered to nothing (no frame, border or box). */
const VIG_W = 1270;
const VIG_H = 660;
const VIG_LEFT = (1920 - VIG_W) / 2;
const VIG_TOP = 270;
const VIG_SCALE = Math.max(VIG_W / 1920, VIG_H / 1080);
const VIG_DX = (VIG_W - 1920 * VIG_SCALE) / 2;
const VIG_DY = (VIG_H - 1080 * VIG_SCALE) / 2;
const VIG_MASK =
  "radial-gradient(ellipse closest-side at 50% 50%, #000 0%, #000 40%, rgba(0,0,0,0.8) 56%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.12) 86%, rgba(0,0,0,0) 100%)";

/*
 * The glimpse moment (1920 x 1080 units, shown scaled inside the vignette): the painted Episode 5 banana grove with
 * six-year-old Balak (plate design, BAL-26b) seated, his palm raised to the calm white cow who lowers her muzzle to it,
 * then his slow strokes (the last cow moment of Episode 5 in miniature; the geometry of the Episode 4 outro glimpse).
 * The rig cow stands over the painted one, so only one cow is ever seen.
 */
const GL_GROUND = 830;
const GL_BALAK = { x: 690, y: GL_GROUND, s: 1.2 };
const GL_COW_S = GL_BALAK.s * (1.05 / 0.95);
const GL_STROKE_PALM = { x: 112, y: -120 };
const GL_PALM_W = { x: GL_BALAK.x + GL_STROKE_PALM.x * GL_BALAK.s, y: GL_BALAK.y + GL_STROKE_PALM.y * GL_BALAK.s };
const GL_COW = { x: GL_PALM_W.x + 245 * (GL_COW_S / 1.05), y: GL_GROUND - 24 * (GL_BALAK.s / 0.95), s: GL_COW_S };
/** The painted grove placed so its cow (hooves at image 1700, 1225) stands under the rig cow. */
const GL_IMG_K = 0.74;
const GL_IMG = { x: GL_COW.x + 10 - 1700 * GL_IMG_K, y: GL_COW.y + 4 - 1225 * GL_IMG_K, w: 2560 * GL_IMG_K, h: 1440 * GL_IMG_K };

const GL_TOUCH = 66;
const GL_NUZZLE_AT = GL_TOUCH - 24;
const GL_R0 = 400;
const glStrokeT = (lf: number): number => {
  if (lf <= 0) return 8;
  if (lf < 30) return 8 + (12 * lf) / 30;
  if (lf < GL_TOUCH) return 20 + (12 * (lf - 30)) / (GL_TOUCH - 30);
  return 32 + 0.5 * (lf - GL_TOUCH);
};
const glCowProps = (lf: number): GentleCowProps => ({
  x: GL_COW.x,
  y: GL_COW.y,
  s: GL_COW.s,
  flip: true,
  f: lf,
  lifeF: lf + 60,
  action: "nuzzle",
  actionStart: GL_NUZZLE_AT,
  prevAction: "idle",
  prevActionStart: GL_NUZZLE_AT - 60,
  turn: -0.06,
  target: GL_PALM_W,
  seed: 7,
});
const glBalakProps = (lf: number): SeatedChildProps => {
  const cow = solveGentleCow(glCowProps(lf));
  const fig = (p: { x: number; y: number }) => ({ x: (p.x - GL_BALAK.x) / GL_BALAK.s, y: (p.y - GL_BALAK.y) / GL_BALAK.s });
  const muzzle = fig(cow.muzzle);
  const fore = fig(cow.forehead);
  const k = clamp((lf - (GL_TOUCH - 18)) / 14);
  const kk = k * k * (3 - 2 * k);
  return {
    x: GL_BALAK.x,
    y: GL_BALAK.y,
    s: GL_BALAK.s,
    f: GL_R0 + glStrokeT(lf),
    lifeF: GL_R0 + lf,
    design: "plate",
    age: 6,
    pose: "strokeCow",
    prevPose: "sitCross",
    poseStart: GL_R0,
    strokeAt: { x: GL_STROKE_PALM.x + (muzzle.x - GL_STROKE_PALM.x) * kk, y: GL_STROKE_PALM.y + (muzzle.y - GL_STROKE_PALM.y) * kk },
    strokeDir: { x: fore.x - muzzle.x, y: fore.y - muzzle.y },
    face: { smile: 0.62 },
  };
};

const Ep05GroveGlimpse: React.FC<{ lf: number }> = ({ lf }) => {
  const bp = glBalakProps(lf);
  const g = seatedChildHands({ ...bp, ...EP04_BALAK_LOOK }).glowAnchor;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <image href={staticFile("images/ghibli_ep04/glimpse_ep05_cow_grove_sketch.png")} x={GL_IMG.x} y={GL_IMG.y} width={GL_IMG.w} height={GL_IMG.h} />
      {/* warm late light over the grove, so the figures sit in the painting */}
      <rect x={0} y={0} width={1920} height={1080} fill="#ffd9a0" opacity={0.12} />
      <GhibliCharFilterDefs f={lf} dapple shadeFactor={0.12} bounceColor="#7c9c78" sunColor="#ffe7aa" />
      {/* Balak's own ink (fine contour at any scale; the glimpse is drawn at about VIG_SCALE of full size) */}
      <Ep04BalakInkDefs zoom={VIG_SCALE} rim={0.5} />
      <ellipse cx={GL_COW.x} cy={GL_COW.y + 6} rx={250} ry={26} fill="#5a4426" opacity={0.28} />
      <g filter="url(#ghibli-char-ink)">
        <GentleCow {...glCowProps(lf)} />
      </g>
      <ellipse cx={GL_BALAK.x} cy={GL_BALAK.y + 4} rx={150} ry={26} fill="#fff0c8" opacity={0.22} />
      <Ep04BalakDivine cx={g.cx} cy={g.cy} r={g.r} glow={0.6} f={lf} />
      <g filter="url(#ep04-balak-ink)">
        <SeatedChild {...bp} {...EP04_BALAK_LOOK} inkZoom={VIG_SCALE} />
      </g>
    </svg>
  );
};

/** The boat in the plate (fractions of the drawn plate before its drift), rocked gently on the water. */
const BOAT_MASK = "radial-gradient(ellipse 13% 8% at 71% 88%, #000 55%, transparent 100%)";

/** Episode 4 Ghibli Outro with soft feathered Episode 5 cow-grove glimpse (`TTL-10a`). */
export const GhibliScene99OutroEp04: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const glimpseOp = Math.min(clamp((f - GLIMPSE_AT) / GLIMPSE_IN), clamp((GLIMPSE_END - f) / GLIMPSE_OUT));
  const gOp = glimpseOp * glimpseOp * (3 - 2 * glimpseOp);
  const titleOp = clamp(f / 26, 0, 1);
  // a slow drift across the river (one gentle move for the whole outro, CAM-01)
  const u = clamp(f / OUTRO_FRAMES);
  const d = u * u * (3 - 2 * u);
  const plateXf = `translate(${(178 - 26 * d).toFixed(2)}px, ${(-70 - 10 * d).toFixed(2)}px) scale(${(1.195 + 0.04 * d).toFixed(4)})`;
  const bob = 1.6 * Math.sin(f * 0.085) + 0.6 * Math.sin(f * 0.21 + 1.3);
  const rock = 0.35 * Math.sin(f * 0.07 + 0.6);
  const lf = f - GLIMPSE_AT;
  const gDrift = clamp((f - GLIMPSE_AT) / (GLIMPSE_END - GLIMPSE_AT));
  return (
    <AbsoluteFill style={{ background: "#1e1610", overflow: "hidden" }}>
      <GhibliPreload files={["images/ghibli_ep04/card_outro_padma_sketch.png", "images/ghibli_ep04/glimpse_ep05_cow_grove_sketch.png"]} />
      <div style={{ position: "absolute", inset: 0, transform: plateXf }}>
        <img
          src={staticFile("images/ghibli_ep04/card_outro_padma_sketch.png")}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* the boat rides the swell: a feathered copy of its patch of the plate, bobbing a pixel or two */}
        <img
          src={staticFile("images/ghibli_ep04/card_outro_padma_sketch.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transformOrigin: "71% 88%",
            transform: `translateY(${bob.toFixed(2)}px) rotate(${rock.toFixed(3)}deg)`,
            WebkitMaskImage: BOAT_MASK,
            maskImage: BOAT_MASK,
          }}
        />
      </div>
      {/* a few birds crossing the evening sky (STO-22b) */}
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <GhibliBirdFlock f={f} start={30} dur={330} from={{ x: 1990, y: 250 }} to={{ x: -90, y: 175 }} count={6} formation="v" s={1.05} />
        <GhibliBirdFlock f={f} start={190} dur={230} from={{ x: -70, y: 215 }} to={{ x: 1250, y: 120 }} count={3} formation="loose" s={0.8} />
      </svg>
      {gOp > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: VIG_LEFT,
            top: VIG_TOP,
            width: VIG_W,
            height: VIG_H,
            overflow: "hidden",
            opacity: gOp,
            WebkitMaskImage: VIG_MASK,
            maskImage: VIG_MASK,
            transform: `translate(${(6 - 12 * gDrift).toFixed(2)}px, ${(3 - 6 * gDrift).toFixed(2)}px)`,
            filter: `blur(${(4 * (1 - gOp)).toFixed(2)}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: VIG_DX,
              top: VIG_DY,
              width: 1920,
              height: 1080,
              transformOrigin: "0 0",
              transform: `scale(${(VIG_SCALE * (1 + 0.03 * gDrift)).toFixed(5)})`,
            }}
          >
            <Ep05GroveGlimpse lf={lf} />
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: BN_FONT,
          opacity: titleOp,
          color: "#fff4dc",
          textShadow: "0 2px 4px rgba(32,16,6,0.8), 0 4px 20px rgba(32,16,6,0.75)",
        }}
      >
        <div style={{ fontSize: 46, fontWeight: 600, color: "#ffd98c" }}>ছোটদের বালক ঠাকুরের গল্প</div>
        {/* the teaser line is the caption itself (one line on screen at a time, TTL-14): no second in-picture line */}
      </div>
      <GhibliGrade paperOpacity={0.14} vignette={0.28} />
    </AbsoluteFill>
  );
};
