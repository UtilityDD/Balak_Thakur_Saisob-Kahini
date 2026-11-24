import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp, hash, noise1 } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { CAST } from "../../cinematic/rig/cast";
import { MOUTH_REST, type MouthState } from "../../cinematic/rig/lipsync";
import { type CastMember, type Lighting, type Pose, BASE_POSE } from "../../cinematic/rig/Puppet";
import {
  GhibliAtmosphericHaze,
  GhibliCutout,
  GhibliForegroundBokeh,
  GhibliGrade,
  GhibliLayer,
  GhibliPreload,
  GhibliStage,
} from "../GhibliStage";
import { GHIBLI_ANCHORS } from "./plateAnchors";

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
  150,
  57,
  (h1, h2) => {
    const zone = h1 < 0.36 ? 0 : h1 < 0.7 ? 1 : 2;
    const u = (h1 % 0.34) / 0.34;
    // zone 0: along the ghat's near (landing) edge, where the grass meets the bricks
    if (zone === 0) return [40 + u * 560, 991 + h2 * 9];
    if (zone === 1) return [1270 + u * 190, 943 + h2 * 13];
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
      <path d={bankEdgeD(-2)} fill="none" stroke="#eef4e6" strokeWidth={2.2} opacity={0.45} filter="url(#ep4pb-soft2)" />

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
/* Brick bathing ghat descending from the bank into the pond           */
/* A small perspective model (metres) projected onto the ground-locked */
/* plane: eye 5.5 m above the bank, horizon y = 500, vanishing x = 960.*/
/* Bank level h = 0 (the landing, where feet stand at y = 935), water  */
/* surface h = -0.75; treads step DOWN and AWAY towards the water.     */
/* ------------------------------------------------------------------ */

const GH_F = 553;
const GH_E = 5.5;
/** Project a ghat point (X across, h height above the bank, z depth) to stage coordinates. */
export const ghatProject = (X: number, h: number, z: number): [number, number] => [960 + (GH_F * X) / z, 500 + (GH_F * (GH_E - h)) / z];

const GH_XL = -9.87; // inner face of the left parapet
const GH_XR = -4.71; // inner face of the right parapet
const GH_WALL = 0.5; // parapet thickness
const GH_WALL_H = 0.35; // parapet top above the bank
const GH_WATER = -0.75;
const GH_Z0 = 6.2; // near edge of the landing (flush with the grass)
const GH_Z1 = 7.3; // landing's far edge: first step down
const GH_TREAD = 0.75;
const GH_RISER = 0.2;
const GH_STEPS = 6;
const GH_ZEND = GH_Z1 + GH_TREAD * GH_STEPS + 0.2; // parapets run a little past the last tread

/** Surfaces of the ghat floor: index 0 = landing (bank level), 1..6 = treads going down. */
const GH_TREADS = Array.from({ length: GH_STEPS + 1 }, (_, i) => ({
  i,
  h: -GH_RISER * i,
  z0: i === 0 ? GH_Z0 : GH_Z1 + GH_TREAD * (i - 1),
  z1: i === 0 ? GH_Z1 : GH_Z1 + GH_TREAD * i,
}));

/**
 * Ghat layout for scenes (e.g. Scene 03 Shot 11, walking down the steps):
 * `ghatSpot(u, step)` gives the stage foot point and a scale factor relative to a figure standing at y = 935
 * on the landing; u = 0 at the left parapet, 1 at the right; step 0 = landing, 1..6 = treads (4+ are under water).
 */
export const ghatSpot = (u: number, step: number, along = 0.5) => {
  const t = GH_TREADS[clamp(Math.round(step), 0, GH_STEPS)];
  const z = t.z0 + (t.z1 - t.z0) * along;
  const [x, y] = ghatProject(GH_XL + (GH_XR - GH_XL) * clamp(u, 0, 1), t.h, z);
  return { x, y, scale: 6.99 / z, underwater: t.h < GH_WATER };
};

const ptsD = (pts: Array<[number, number]>) =>
  `${pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} Z`;
const segD = (a: [number, number], b: [number, number]) => `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;

/** Brick courses for a horizontal tread: joints parallel to the step edge + staggered cross joints. */
const treadBrickD = (h: number, z0: number, z1: number, rows: number, seed: number) => {
  const out: string[] = [];
  for (let r = 1; r < rows; r++) {
    const z = z0 + ((z1 - z0) * r) / rows;
    out.push(segD(ghatProject(GH_XL, h, z), ghatProject(GH_XR, h, z)));
  }
  const brick = 0.32;
  for (let r = 0; r < rows; r++) {
    const za = z0 + ((z1 - z0) * r) / rows;
    const zb = z0 + ((z1 - z0) * (r + 1)) / rows;
    const off = (r % 2) * brick * 0.5 + hash(seed + r) * 0.05;
    for (let X = GH_XL + off + brick; X < GH_XR - 0.05; X += brick) {
      out.push(segD(ghatProject(X, h, za), ghatProject(X, h, zb)));
    }
  }
  return out.join(" ");
};

/** Per-brick watercolour mottling on a tread (a few lighter / darker bricks). */
const treadMottle = (h: number, z0: number, z1: number, rows: number, seed: number) => {
  const cells: Array<{ d: string; dark: boolean; o: number }> = [];
  const brick = 0.32;
  for (let r = 0; r < rows; r++) {
    const za = z0 + ((z1 - z0) * r) / rows;
    const zb = z0 + ((z1 - z0) * (r + 1)) / rows;
    const off = (r % 2) * brick * 0.5;
    let k = 0;
    for (let X = GH_XL + off; X < GH_XR - 0.05; X += brick, k++) {
      const hv = hash(seed * 3.1 + r * 17.3 + k * 1.37);
      if (hv > 0.62 || hv < 0.16) {
        const X2 = Math.min(GH_XR, X + brick);
        const Xa = Math.max(GH_XL, X);
        cells.push({
          d: ptsD([ghatProject(Xa, h, za), ghatProject(X2, h, za), ghatProject(X2, h, zb), ghatProject(Xa, h, zb)]),
          dark: hv < 0.16,
          o: 0.12 + hash(seed + k * 7.7 + r) * 0.16,
        });
      }
    }
  }
  return cells;
};

/** Bottom of the left parapet's inner face (stair profile, or the water surface over submerged treads). */
const ghatInnerProfile = (): Array<[number, number]> => {
  const pts: Array<[number, number]> = [];
  const push = (h: number, z: number) => pts.push(ghatProject(GH_XL, Math.max(h, GH_WATER), z));
  GH_TREADS.forEach((t) => {
    push(t.h, t.z0);
    push(t.h, t.z1);
  });
  push(GH_TREADS[GH_STEPS].h, GH_ZEND);
  return pts;
};

const GH_BRICK = "#c98161";
const GH_BRICK_FACE = "#b06a4c";
const GH_INK = "#4a3020";

export const GhibliPondGhat: React.FC<{ f: number }> = ({ f }) => {
  const P = ghatProject;
  const lipY = 836; // the bank's water edge: parts of the right parapet below bank level hide behind it
  const lw = GH_XL - GH_WALL;
  const rw = GH_XR + GH_WALL;
  // treads, far (under water) to near (landing)
  const treads = [...GH_TREADS].reverse();
  // left parapet inner face
  const innerFace = ptsD([P(GH_XL, GH_WALL_H, GH_Z0), P(GH_XL, GH_WALL_H, GH_ZEND), ...ghatInnerProfile().reverse()]);
  // right parapet outer face (faces the camera side): above the bank all along, below it only beyond the lip
  const zLipWater = 10.3;
  const outerFace = ptsD([
    P(rw, GH_WALL_H, GH_Z0),
    P(rw, GH_WALL_H, GH_ZEND),
    P(rw, GH_WATER, GH_ZEND),
    P(rw, GH_WATER, zLipWater),
    [P(rw, 0, 9.05)[0], lipY],
    P(rw, 0, 9.05),
    P(rw, 0, GH_Z0),
  ]);
  const wallTopL = ptsD([P(lw, GH_WALL_H, GH_Z0), P(GH_XL, GH_WALL_H, GH_Z0), P(GH_XL, GH_WALL_H, GH_ZEND), P(lw, GH_WALL_H, GH_ZEND)]);
  const wallTopR = ptsD([P(GH_XR, GH_WALL_H, GH_Z0), P(rw, GH_WALL_H, GH_Z0), P(rw, GH_WALL_H, GH_ZEND), P(GH_XR, GH_WALL_H, GH_ZEND)]);
  const endL = ptsD([P(lw, GH_WALL_H, GH_Z0), P(GH_XL, GH_WALL_H, GH_Z0), P(GH_XL, 0, GH_Z0), P(lw, 0, GH_Z0)]);
  const endR = ptsD([P(GH_XR, GH_WALL_H, GH_Z0), P(rw, GH_WALL_H, GH_Z0), P(rw, 0, GH_Z0), P(GH_XR, 0, GH_Z0)]);
  // square posts capping the parapets at the water end
  const post = (x0: number, x1: number, sideFace: boolean) => {
    const za = GH_ZEND - 0.45;
    const zb = GH_ZEND;
    const top = GH_WALL_H + 0.6;
    return (
      <g>
        {sideFace && (
          <path d={ptsD([P(x1, top, za), P(x1, top, zb), P(x1, GH_WALL_H, zb), P(x1, GH_WALL_H, za)])} fill={GH_BRICK_FACE} stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.5} />
        )}
        <path d={ptsD([P(x0, top, za), P(x1, top, za), P(x1, top, zb), P(x0, top, zb)])} fill="#ead9bd" stroke={GH_INK} strokeWidth={0.8} strokeOpacity={0.45} />
        <path d={ptsD([P(x0, top, za), P(x1, top, za), P(x1, GH_WALL_H, za), P(x0, GH_WALL_H, za)])} fill={GH_BRICK} stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.55} />
        <path d={segD(P(x0, top - 0.12, za), P(x1, top - 0.12, za))} stroke="#f1e4cb" strokeWidth={1.2} opacity={0.7} />
      </g>
    );
  };
  // water inside the ghat (between the parapets), from the waterline on step 4 out to the parapet ends
  const zWl = GH_Z1 + GH_TREAD * 3; // riser between tread 3 (dry) and tread 4 (under water)
  const waterD = ptsD([P(GH_XL, GH_WATER, zWl), P(GH_XR, GH_WATER, zWl), P(GH_XR, GH_WATER, GH_ZEND + 0.6), P(GH_XL, GH_WATER, GH_ZEND + 0.6)]);
  const waterTop = P(GH_XL, GH_WATER, GH_ZEND + 0.6)[1];
  const waterBottom = P(GH_XL, GH_TREADS[3].h, zWl)[1];
  // whole-ghat silhouette for the paper grain
  const silhouette = [innerFace, outerFace, wallTopL, wallTopR, endL, endR, ...GH_TREADS.map((t) => ptsD([P(GH_XL, t.h, t.z0), P(GH_XR, t.h, t.z0), P(GH_XR, t.h, t.z1), P(GH_XL, t.h, t.z1)]))].join(" ");
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id="ep4gh-water" gradientUnits="userSpaceOnUse" x1={0} y1={waterBottom} x2={0} y2={waterTop}>
          <stop offset="0%" stopColor="#4f7d70" stopOpacity={0.92} />
          <stop offset="55%" stopColor="#7fa596" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#a9c4b4" stopOpacity={0} />
        </linearGradient>
        <filter id="ep4gh-soft" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation={2.5} />
        </filter>
        <filter id="ep4gh-soft6" x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <filter id="ep4gh-mottle" filterUnits="userSpaceOnUse" x={-200} y={700} width={1200} height={340} colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={3} seed={17} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.25  0 0 0 0 0.17  4.2 0 0 0 -1.9" />
        </filter>
        <clipPath id="ep4gh-clip">
          <path d={silhouette} />
        </clipPath>
      </defs>

      {/* treads from the drowned far steps up to the landing at bank level */}
      {treads.map((t) => {
        const wet = clamp(t.i / 3, 0, 1); // 0 dry landing .. 1 wet bottom dry step
        const sub = t.h < GH_WATER;
        const d = ptsD([P(GH_XL, t.h, t.z0), P(GH_XR, t.h, t.z0), P(GH_XR, t.h, t.z1), P(GH_XL, t.h, t.z1)]);
        const rows = t.i === 0 ? 4 : 2;
        return (
          <g key={t.i} opacity={sub ? Math.max(0.25, 0.8 - (t.i - 4) * 0.28) : 1}>
            <path d={d} fill={sub ? "#6f6250" : GH_BRICK} />
            {/* damp darkening towards the water */}
            <path d={d} fill="#5b4334" opacity={0.04 + wet * 0.4} />
            {/* the shaded strip just beyond the step above (the drop), hiding the riser */}
            {t.i > 0 && (() => {
              // first depth of this tread visible over the edge of the step above
              const zv = (t.z0 * (GH_E - t.h)) / (GH_E - (t.h + GH_RISER));
              return (
                <path
                  d={ptsD([P(GH_XL, t.h, zv), P(GH_XR, t.h, zv), P(GH_XR, t.h, zv + 0.2), P(GH_XL, t.h, zv + 0.2)])}
                  fill="#3a2418"
                  opacity={0.5}
                  filter="url(#ep4gh-soft)"
                />
              );
            })()}
            {treadMottle(t.h, t.z0, t.z1, rows, 13 + t.i * 7).map((c, k) => (
              <path key={k} d={c.d} fill={c.dark ? "#8a5038" : "#e3ad8a"} opacity={c.o * 0.8} />
            ))}
            <path d={treadBrickD(t.h, t.z0, t.z1, rows, 5 + t.i)} fill="none" stroke="#efe0c8" strokeWidth={0.9} opacity={0.55} />
            <path d={treadBrickD(t.h, t.z0, t.z1, rows, 5 + t.i)} fill="none" stroke={GH_INK} strokeWidth={0.5} opacity={0.22} />
            {/* the step edge (nosing) where the next tread drops away: sunlit lip under a sepia ink line */}
            {t.i < GH_STEPS && (
              <>
                <path d={segD(P(GH_XL, t.h, t.z1 - 0.06), P(GH_XR, t.h, t.z1 - 0.06))} stroke="#f6e2c4" strokeWidth={2} opacity={0.8} />
                <path d={segD(P(GH_XL, t.h, t.z1), P(GH_XR, t.h, t.z1))} stroke={GH_INK} strokeWidth={1.1} opacity={0.6} strokeDasharray="90 6 40 5 130 8" />
              </>
            )}
            {/* the right parapet's shade across the near end of each tread (sun from the right) */}
            <path
              d={ptsD([P(GH_XR - 0.7, t.h, t.z0), P(GH_XR, t.h, t.z0), P(GH_XR, t.h, t.z1), P(GH_XR - 0.7, t.h, t.z1)])}
              fill="#3f2a1e"
              opacity={0.22}
              filter="url(#ep4gh-soft)"
            />
          </g>
        );
      })}

      {/* the pond water filling the bottom of the ghat, a soft waterline on tread 4 and slow ripples */}
      <path d={waterD} fill="url(#ep4gh-water)" />
      <path d={segD(P(GH_XL, GH_TREADS[3].h, zWl), P(GH_XR, GH_TREADS[3].h, zWl))} stroke="#e9f2ea" strokeWidth={2} opacity={0.5 + 0.12 * Math.sin(f * 0.07)} filter="url(#ep4gh-soft)" />
      {[0, 1, 2].map((i) => {
        const p = ((f * 0.011 + i * 0.37) % 1 + 1) % 1;
        const z = zWl + 0.35 + p * 1.6;
        const a = P(GH_XL + 0.6 + i * 1.3, GH_WATER, z);
        const b = P(GH_XL + 2.2 + i * 1.3, GH_WATER, z);
        return <path key={i} d={segD(a, b)} stroke="#eef6f0" strokeWidth={1.3} opacity={(1 - p) * 0.45} strokeLinecap="round" />;
      })}

      {/* left parapet: inner face (lit, growing taller as the steps drop), damp band and moss by the water */}
      <path d={innerFace} fill={GH_BRICK_FACE} />
      {Array.from({ length: 4 }, (_, k) => {
        const h = GH_WALL_H - (k + 1) * 0.22;
        return <path key={k} d={segD(P(GH_XL, h, GH_Z0), P(GH_XL, h, GH_ZEND))} stroke="#ecdcc3" strokeWidth={0.8} opacity={0.5} />;
      })}
      <path d={ptsD([P(GH_XL, GH_WATER + 0.28, 9.4), P(GH_XL, GH_WATER + 0.28, GH_ZEND), P(GH_XL, GH_WATER, GH_ZEND), P(GH_XL, GH_WATER, 9.4)])} fill="#3d3a2a" opacity={0.42} filter="url(#ep4gh-soft)" />
      <path d={ptsD([P(GH_XL, GH_WATER + 0.18, 9.8), P(GH_XL, GH_WATER + 0.18, GH_ZEND - 0.3), P(GH_XL, GH_WATER, GH_ZEND - 0.3), P(GH_XL, GH_WATER, 9.8)])} fill="#6f8442" opacity={0.55} filter="url(#ep4gh-soft)" />
      <path d={innerFace} fill="none" stroke={GH_INK} strokeWidth={1} opacity={0.5} />
      <path
        d={ghatInnerProfile().map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")}
        fill="none"
        stroke="#2e1c12"
        strokeWidth={1.8}
        opacity={0.6}
      />

      {/* right parapet: outer face (camera side), damp and mossy where it stands in the pond */}
      <path d={outerFace} fill={GH_BRICK_FACE} />
      {Array.from({ length: 3 }, (_, k) => {
        const h = GH_WALL_H - (k + 1) * 0.12;
        return <path key={k} d={segD(P(rw, h, GH_Z0), P(rw, h, GH_ZEND))} stroke="#ecdcc3" strokeWidth={0.7} opacity={0.45} />;
      })}
      <path d={ptsD([P(rw, -0.35, zLipWater), P(rw, -0.35, GH_ZEND), P(rw, GH_WATER, GH_ZEND), P(rw, GH_WATER, zLipWater)])} fill="#4a4030" opacity={0.45} filter="url(#ep4gh-soft)" />
      <path d={segD(P(rw, GH_WATER, zLipWater), P(rw, GH_WATER, GH_ZEND))} stroke="#e9f2ea" strokeWidth={1.6} opacity={0.5} />
      <path d={outerFace} fill="none" stroke={GH_INK} strokeWidth={1} opacity={0.5} />

      {/* parapet tops with chipped lime plaster, and their near end faces at the grass */}
      <path d={wallTopL} fill="#e8d6b8" stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.5} />
      <path d={wallTopR} fill="#efdfc3" stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.5} />
      <path d={endL} fill={GH_BRICK} stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.55} />
      <path d={endR} fill={GH_BRICK} stroke={GH_INK} strokeWidth={0.9} strokeOpacity={0.55} />
      {post(lw, GH_XL, true)}
      {post(GH_XR, rw, true)}

      {/* moss creeping along the tread corners and the parapet foot */}
      <g filter="url(#ep4gh-soft)">
        {GH_TREADS.slice(1, 4).map((t) => {
          const [x0, y0] = P(GH_XL + 0.25, t.h, t.z0 + 0.3);
          const [x1, y1] = P(GH_XR - 0.4, t.h, t.z0 + 0.25);
          const s = 6.99 / t.z0;
          return (
            <g key={t.i}>
              <ellipse cx={x0} cy={y0} rx={22 * s} ry={4 * s} fill="#748a45" opacity={0.45 + t.i * 0.08} />
              <ellipse cx={x1} cy={y1} rx={16 * s} ry={3 * s} fill="#6c8040" opacity={0.35 + t.i * 0.08} />
            </g>
          );
        })}
      </g>

      {/* contact of the landing with the grass, and paper tooth over the bricks */}
      <path d={segD(P(lw, 0, GH_Z0), P(rw, 0, GH_Z0))} stroke="#3d3020" strokeWidth={3} opacity={0.35} filter="url(#ep4gh-soft)" />
      <rect x={-200} y={700} width={1200} height={340} clipPath="url(#ep4gh-clip)" filter="url(#ep4gh-mottle)" opacity={0.36} />
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

/** Reusable 10-Plane Daytime Pond Backdrop (Scenes 02 & 03) with upstage occlusion slot! */
export const GhibliPondBackdrop: React.FC<{
  f: number;
  upstageBehindTree?: React.ReactNode;
}> = ({ f, upstageBehindTree }) => {
  return (
    <>
      <GhibliLayer depth={0.08} parallaxDrift={0.004}>
        <image href={staticFile("images/ghibli_ep04/sky_ep04_pond_day.png")} x={-320} y={-240} width={2560} height={1440} preserveAspectRatio="xMidYMin slice" />
      </GhibliLayer>
      <GhibliLayer depth={0.45} extraBlur={0.8}>
        <image href={staticFile("images/ghibli_ep04/pond_far_bank_baidik_sketch.png")} x={-640} y={320} width={3200} height={360} />
      </GhibliLayer>
      <GhibliLayer depth={0.58}>
        <image href={staticFile("images/ghibli_ep04/pond_water_emerald_sketch.png")} x={-1760} y={560} width={5440} height={1200} />
        <GhibliMandarPetals f={f} count={8} seed={71} withRipples />
      </GhibliLayer>
      <GhibliLayer depth={0.68}>
        <GhibliVolumetricBeam f={f} color="#fff7d6" opacity={0.14} fromRight />
        <GhibliAtmosphericHaze f={f} />
      </GhibliLayer>
      {/* painted grassy bank, locked to the cast's ground plane (feet at y = 935-940) */}
      <GhibliLayer depth={0.92} groundLocked>
        <GhibliPondBank f={f} />
        {/* the brick ghat descends from the bank into the water (replaces brick_ghat_steps_sketch.png) */}
        <GhibliPondGhat f={f} />
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
        <GhibliDragonfly f={f} />
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
}> = ({ f, zoom, shrineArch = false, petals = false, warmth = 0.24 }) => (
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
      <GhibliForegroundBokeh f={f} zoom={zoom} />
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

/** Episode 4 Ghibli Outro with soft feathered Episode 5 cow-grove glimpse (`TTL-10a`). */
export const GhibliScene99OutroEp04: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const glimpseOp = clamp((f - 290) / 36, 0, 1) * clamp((610 - f) / 30, 0, 1);
  const titleOp = clamp(f / 26, 0, 1);
  return (
    <AbsoluteFill style={{ background: "#1e1610", overflow: "hidden" }}>
      <GhibliPreload files={["images/ghibli_ep04/card_outro_padma_sketch.png", "images/ghibli_ep04/glimpse_ep05_cow_grove_sketch.png"]} />
      <img
        src={staticFile("images/ghibli_ep04/card_outro_padma_sketch.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // nudged right and down so the boat's prow sits clear of the caption line
          transform: `translate(178px, -70px) scale(${(1.195 - clamp(f / 640, 0, 1) * 0.01).toFixed(4)})`,
        }}
      />
      {glimpseOp > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "43%",
            transform: "translate(-50%, -50%)",
            width: 780,
            height: 440,
            opacity: glimpseOp,
            WebkitMaskImage: "radial-gradient(ellipse 68% 64% at 50% 50%, #000 54%, transparent 98%)",
            maskImage: "radial-gradient(ellipse 68% 64% at 50% 50%, #000 54%, transparent 98%)",
          }}
        >
          <img
            src={staticFile("images/ghibli_ep04/glimpse_ep05_cow_grove_sketch.png")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
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
        {/* the in-picture line gives way to the caption of the same words (one line on screen, TTL-14) */}
        {glimpseOp > 0.05 && f < 430 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 860,
              fontSize: 36,
              fontWeight: 600,
              opacity: glimpseOp * clamp((428 - f) / 10, 0, 1),
              color: "#fff7e4",
              textShadow: "0 2px 12px rgba(20,10,4,0.55)",
            }}
          >
            আসছে পরের পর্ব: কচ্ছপ খেলা ও গাভী রক্ষা
          </div>
        )}
      </div>
      <GhibliGrade paperOpacity={0.14} vignette={0.28} />
    </AbsoluteFill>
  );
};
