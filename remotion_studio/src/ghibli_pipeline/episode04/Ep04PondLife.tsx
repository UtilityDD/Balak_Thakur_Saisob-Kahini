import React, { useId } from "react";
import { staticFile } from "remotion";
import { clamp, lerp, hash, noise1 } from "../../cinematic/core/anim";
import { GhibliCloudShadows, GHIBLI_INK } from "../core/GhibliLifeKit";

/**
 * Ep04PondLife (`src/ghibli_pipeline/episode04/Ep04PondLife.tsx`): the living pond of Ghibli Episode 4 (Scenes 02 and
 * 03, STO-22b; the director, 2026-11-25: "pond ghat, animate pond water, use ducks and more detail").
 *
 * Everything here is drawn by `GhibliPondBackdrop` (Ep04GhibliShared.tsx), so it appears in every pond shot; the
 * backdrop's `pondLife` prop turns pieces off and `duckPath` / `kingfisherDiveAt` steer them. Scene agents may also
 * use the components directly (and `PondReflection` for characters' reflections).
 *
 * CONVENTIONS
 * - Every component returns SVG for a `<GhibliLayer>`; coordinates are that layer's stage px.
 * - `lifeF`: the real frame (keeps running in a pause). One-off actions (`diveAt`) take the STORY clock `f`.
 * - Ink is warm sepia GHIBLI_INK (#3A2618), broken, about 1 px. Fills are flat watercolour washes with a lighter
 *   and a darker pass; no feTurbulence except `PondReflection` (one small filter per use).
 *
 * WATER BANDS (why the creatures sit in different layers)
 * The pond surface runs from the far bank (layer depth 0.45, shoreline y ~ 548) to the near bank lip (ground-locked,
 * y 836). A thing ON the water at fraction t of that distance lives in a layer of depth 0.45 + 0.55 t at layer y
 * 548 + 288 t; then it stays on the water at every zoom and pan. `pondBand(t)` returns that pair, and POND_BANDS lists
 * the safe y ranges of the two water layers the backdrop uses (one shared life layer keeps the layer count, and the
 * render cost, down; checked for the wide 1.15x, the 1.9x and the 2.5x medium framings of Scenes 02/03):
 *   far  (0.45): the water surface itself, reflections, mist, cat's paws, glints   y 556 .. 940
 *   life (0.72): lilies, fish rings, ducks, dragonflies, floating petals            y 665 .. 745
 *   lip  (ground-locked): edge plants, ghat water, striders, kingfisher           y 800 .. 836
 */

/* ------------------------------------------------------------------------------------------------------------ */
/* Shared helpers                                                                                                 */
/* ------------------------------------------------------------------------------------------------------------ */

export interface PondPt {
  x: number;
  y: number;
}
export interface PondRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const POND_SHORE_Y = 548;
export const POND_LIP_Y = 836;
export const POND_BANDS = {
  far: { depth: 0.45, yMin: 556, yMax: 940 },
  life: { depth: 0.72, yMin: 665, yMax: 745 },
} as const;
/** Layer depth and layer y for a point at fraction t (0 far shore .. 1 near lip) of the pond's depth. */
export const pondBand = (t: number) => ({ depth: 0.45 + 0.55 * clamp(t), y: POND_SHORE_Y + (POND_LIP_Y - POND_SHORE_Y) * clamp(t) });

const n1 = (v: number) => v.toFixed(1);
const n2 = (v: number) => v.toFixed(2);
const sid = (raw: string, p: string) => `${p}-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
const sstep = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
/** 0 before a, eases to 1 over rise, holds, eases back to 0 over fall. */
const env = (t: number, a: number, rise: number, hold: number, fall: number) => {
  if (t < a) return 0;
  if (t < a + rise) return sstep((t - a) / rise);
  if (t < a + rise + hold) return 1;
  return 1 - sstep((t - a - rise - hold) / Math.max(1, fall));
};
/** The latest deterministic event start <= t (one chance per `period`, probability `prob`), or -Infinity. */
const lastEvent = (t: number, period: number, seed: number, prob = 1): { at: number; k: number } => {
  const k0 = Math.floor(t / period);
  for (let k = k0; k >= k0 - 2; k--) {
    if (hash(k * 7.31 + seed * 3.7) > prob) continue;
    const at = k * period + Math.floor(hash(k * 1.97 + seed * 11.3) * period * 0.5);
    if (at <= t) return { at, k };
  }
  return { at: -Infinity, k: 0 };
};
const INK = GHIBLI_INK;

/* ------------------------------------------------------------------------------------------------------------ */
/* PondReflection                                                                                                 */
/* ------------------------------------------------------------------------------------------------------------ */

/**
 * Mirrors its children about a waterline with a slow horizontal ripple distortion, a fade with depth, a water tint,
 * clipped to the water. Put it in the SAME layer (and coordinates) as the thing it reflects, drawn before that thing.
 *
 *   <PondReflection waterY={846} lifeF={lifeF} x0={1080} x1={1300} depth={220}>
 *     <StandingChild {...props} />            // the same JSX the scene draws above the water
 *   </PondReflection>
 *
 * Props:
 * - waterY: the waterline (mirror axis) in layer px. For a figure on the bank, use the bank lip under it (~836-846).
 * - lifeF: real frame; drives the ripple drift.
 * - x0 / x1: horizontal extent of the reflection (default -200 .. 2120). depth: how far below the waterline it shows
 *   before it has faded out (default 240 px). fadeIn: feather at the waterline (default 2). fadeOut: the length of the
 *   fade at the bottom (default 0.8 * depth).
 * - clip: optional SVG path (layer px) of the water's shape; nothing is drawn outside it (e.g. not over the bank).
 * - mirror: false keeps the image upright (used to animate an already painted reflection). Default true.
 * - opacity (0.5), tint ("#3f6f64") and tintAmount (0.35): the water colour mixed in; darken (0.9) dims the source.
 * - ripple: max sideways displacement in px (default 5); wavelength: >1 makes the ripple bands broader (default 1);
 *   speed: drift of the ripple pattern in px per frame (default 0.35); blur: softening (default 0.6); octaves: noise
 *   detail (default 2, 1 is cheaper). seed varies it.
 */
export const PondReflection: React.FC<{
  waterY: number;
  lifeF: number;
  x0?: number;
  x1?: number;
  depth?: number;
  fadeIn?: number;
  fadeOut?: number;
  clip?: string;
  mirror?: boolean;
  opacity?: number;
  tint?: string;
  tintAmount?: number;
  darken?: number;
  ripple?: number;
  wavelength?: number;
  speed?: number;
  blur?: number;
  /** Noise detail (default 2); 1 is cheaper. */
  octaves?: number;
  seed?: number;
  children: React.ReactNode;
}> = ({
  waterY,
  lifeF,
  x0 = -200,
  x1 = 2120,
  depth = 240,
  fadeIn = 2,
  fadeOut,
  clip,
  mirror = true,
  opacity = 0.5,
  tint = "#3f6f64",
  tintAmount = 0.35,
  darken = 0.9,
  ripple = 5,
  wavelength = 1,
  speed = 0.35,
  blur = 0.6,
  octaves = 2,
  seed = 3,
  children,
}) => {
  const id = sid(useId(), "prf");
  const fo = Math.min(depth, fadeOut ?? depth * 0.8);
  const dx = lifeF * speed;
  const dy = lifeF * speed * 0.22;
  const v = parseInt(tint.slice(1), 16);
  const [tr, tg, tb] = [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
  const a = clamp(tintAmount);
  const k = (1 - a) * darken;
  const m = 24; // filter margin
  const W = x1 - x0;
  return (
    <g pointerEvents="none" opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-fade`} gradientUnits="userSpaceOnUse" x1={0} y1={waterY} x2={0} y2={waterY + depth}>
          <stop offset={0} stopColor="#fff" stopOpacity={fadeIn > 0 ? 0 : 1} />
          <stop offset={clamp(fadeIn / depth)} stopColor="#fff" stopOpacity={1} />
          <stop offset={clamp(1 - fo / depth)} stopColor="#fff" stopOpacity={1} />
          <stop offset={clamp(1 - fo / depth + (fo / depth) * 0.55)} stopColor="#fff" stopOpacity={0.3} />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={x0} y={waterY - 2} width={W} height={depth + 4}>
          <rect x={x0} y={waterY - 2} width={W} height={depth + 4} fill={`url(#${id}-fade)`} />
        </mask>
        <clipPath id={`${id}-c`}>{clip ? <path d={clip} /> : <rect x={x0} y={waterY} width={W} height={depth} />}</clipPath>
        {/* the noise is fixed in the middle group's space; the content is shifted the other way, so only the ripple moves */}
        <filter
          id={`${id}-f`}
          filterUnits="userSpaceOnUse"
          x={x0 + dx - m}
          y={waterY + dy - m}
          width={W + 2 * m}
          height={depth + 2 * m}
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency={`${n2(0.0045 / wavelength)} ${n2(0.07 / wavelength)}`} numOctaves={octaves} seed={seed} result="n" />
          <feColorMatrix in="n" type="matrix" values="1 0 0 0 0  0 0.25 0 0 0.375  0 0 1 0 0  0 0 0 0 1" result="nd" />
          <feDisplacementMap in="SourceGraphic" in2="nd" scale={ripple * 2} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feColorMatrix
            in="d"
            type="matrix"
            values={`${n2(k)} 0 0 0 ${n2(a * tr)}  0 ${n2(k)} 0 0 ${n2(a * tg)}  0 0 ${n2(k)} 0 ${n2(a * tb)}  0 0 0 1 0`}
            result="t"
          />
          {blur > 0 ? <feGaussianBlur in="t" stdDeviation={blur} /> : null}
        </filter>
      </defs>
      <g clipPath={`url(#${id}-c)`} mask={`url(#${id}-m)`}>
        <g transform={`translate(${n2(-dx)} ${n2(-dy)})`}>
          <g filter={`url(#${id}-f)`}>
            <g transform={`translate(${n2(dx)} ${n2(dy)})`}>
              <g transform={mirror ? `matrix(1 0 0 -1 0 ${n2(2 * waterY)})` : undefined}>{children}</g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------------------ */
/* PondWaterSurface: the far water plane                                                                          */
/* ------------------------------------------------------------------------------------------------------------ */

export interface PondWaterOptions {
  /** The far bank's painted reflection, rippled (default true). */
  farReflection?: boolean;
  /** Drifting reflections of the bright sky and clouds (default true). */
  skyReflections?: boolean;
  /** Fine moving ripple strokes over the whole surface (default true). */
  ripples?: boolean;
  /** Twinkling light glints (default true). */
  glints?: boolean;
  /** Slow cloud shadows sliding over the water (default true). */
  cloudShadows?: boolean;
  /** A wind gust's darker rippled patch crossing now and then (default true). */
  catsPaws?: boolean;
  /** Morning mist along the far waterline, 0 = none (default 0.55). */
  mist?: number;
}

/**
 * The whole pond surface for the far-bank layer (depth 0.45, drawn right after the far bank image): animates the
 * bank's painted reflection, continues it into open water down past the near bank lip at every zoom, and lays the
 * living surface over it (ripples, glints, sky reflections, cloud shadows, cat's paws, a waterline mist).
 *
 * Props: lifeF; x0/x1 (default -700 .. 2620: the far bank image's span); bottom (default 940); farBank: the far bank
 * image to ripple ({href,x,y,w,h}; default the Episode 4 plate at -640, 320, 3200 x 360); plus PondWaterOptions.
 */
export const PondWaterSurface: React.FC<
  {
    lifeF: number;
    x0?: number;
    x1?: number;
    bottom?: number;
    farBank?: { href: string; x: number; y: number; w: number; h: number };
  } & PondWaterOptions
> = ({
  lifeF,
  x0 = -700,
  x1 = 2620,
  bottom = 940,
  farBank = { href: "images/ghibli_ep04/pond_far_bank_baidik_sketch.png", x: -640, y: 320, w: 3200, h: 360 },
  farReflection = true,
  skyReflections = true,
  ripples = true,
  glints = true,
  cloudShadows = true,
  catsPaws = true,
  mist = 0.55,
}) => {
  const id = sid(useId(), "pws");
  const W = x1 - x0;
  const top = 556;
  const bodyTop = 628; // the painted reflection (and the plate's blank paper below it) ends near 650
  // perspective of surface marks: tiny at the far shore, full size by the near lip (layer y ~ 725 in the wide)
  const persp = (y: number) => clamp(0.18 + ((y - 560) / 165) * 0.82, 0.18, 1.5);
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={`${id}-body`} gradientUnits="userSpaceOnUse" x1={0} y1={bodyTop} x2={0} y2={bottom}>
          <stop offset={0} stopColor="#a8b49a" stopOpacity={0} />
          <stop offset={0.07} stopColor="#a5b7a0" stopOpacity={1} />
          <stop offset={0.2} stopColor="#9ab8a6" />
          <stop offset={0.36} stopColor="#84ad9a" />
          <stop offset={0.58} stopColor="#6d9e8a" />
          <stop offset={1} stopColor="#4f8372" />
        </linearGradient>
        <linearGradient id={`${id}-cool`} gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={660}>
          <stop offset={0} stopColor="#c9dbd0" stopOpacity={0} />
          <stop offset={0.2} stopColor="#a9c6ba" stopOpacity={0.24} />
          <stop offset={1} stopColor="#8fb5a6" stopOpacity={0.34} />
        </linearGradient>
        <radialGradient id={`${id}-sky`}>
          <stop offset="0%" stopColor="#f4f6ea" stopOpacity={0.75} />
          <stop offset="60%" stopColor="#e9f0e4" stopOpacity={0.32} />
          <stop offset="100%" stopColor="#e9f0e4" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-mist`}>
          <stop offset="0%" stopColor="#fbf8ee" stopOpacity={0.9} />
          <stop offset="55%" stopColor="#f6f2e6" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#f6f2e6" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-paw`}>
          <stop offset="0%" stopColor="#3d5f58" stopOpacity={0.55} />
          <stop offset="70%" stopColor="#3d5f58" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#3d5f58" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <rect x={x0} y={top} width={W} height={bottom - top} />
        </clipPath>
      </defs>

      {/* the bank's painted reflection, now rippling slowly */}
      {farReflection && (
        <PondReflection
          waterY={566}
          lifeF={lifeF}
          x0={farBank.x}
          x1={farBank.x + farBank.w}
          depth={88}
          fadeIn={16}
          fadeOut={6}
          mirror={false}
          opacity={1}
          tint="#86a89a"
          tintAmount={0.12}
          darken={1.02}
          ripple={3.4}
          wavelength={0.9}
          speed={0.28}
          blur={0}
          octaves={1}
          seed={9}
        >
          <image href={staticFile(farBank.href)} x={farBank.x} y={farBank.y} width={farBank.w} height={farBank.h} preserveAspectRatio="none" />
        </PondReflection>
      )}
      {/* a cool wash so the warm painted reflection reads as water, then the open water to the near bank */}
      <rect x={x0} y={top} width={W} height={660 - top} fill={`url(#${id}-cool)`} />
      <rect x={x0} y={bodyTop} width={W} height={bottom - bodyTop} fill={`url(#${id}-body)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* the bright sky and its clouds reflected, drifting with the wind */}
        {skyReflections &&
          Array.from({ length: 9 }, (_, i) => {
            const h1 = hash(i * 5.3 + 2);
            const h2 = hash(i * 9.1 + 7);
            const span = W + 800;
            const x = x0 - 400 + ((((h1 * span + lifeF * (0.1 + h2 * 0.07)) % span) + span) % span);
            const y = 642 + h2 * 110;
            const p = persp(y);
            return <ellipse key={i} cx={n1(x)} cy={n1(y)} rx={n1((170 + h1 * 210) * (0.6 + p * 0.5))} ry={n1((5 + h2 * 7) * p)} fill={`url(#${id}-sky)`} />;
          })}
        {cloudShadows && (
          <GhibliCloudShadows
            region={{ x: x0, y: 590, w: W, h: 190 }}
            lifeF={lifeF}
            speed={0.32}
            count={3}
            opacity={0.15}
            squash={0.1}
            size={1.15}
            color="#21403b"
            seed={13}
          />
        )}

        {/* fine ripple strokes: dark troughs and light crests, drifting and breathing */}
        {ripples &&
          Array.from({ length: 30 }, (_, r) => {
            const y = 572 + Math.pow(r / 29, 1.35) * 300;
            const p = persp(y);
            const n = Math.round(lerp(24, 11, clamp((y - 572) / 300)));
            return (
              <g key={r}>
                {Array.from({ length: n }, (_, i) => {
                  const h1 = hash(r * 31.7 + i * 3.9);
                  const h2 = hash(r * 7.3 + i * 11.1 + 5);
                  const len = (8 + h1 * 26) * p;
                  const drift = lifeF * (0.08 + h2 * 0.1) * (0.4 + p);
                  const x = x0 + ((((h1 * 0.6 + i / n) * W + drift) % W) + W) % W;
                  const yy = y + (h2 - 0.5) * 6 * p + Math.sin(lifeF * 0.05 + h1 * 9) * 0.9 * p;
                  const o = 0.5 + 0.5 * Math.sin(lifeF * (0.03 + h2 * 0.04) + h1 * 12);
                  const light = h2 > 0.55;
                  const sag = (light ? -1.2 : 1.2) * p;
                  return (
                    <path
                      key={i}
                      d={`M ${n1(x - len / 2)} ${n1(yy)} Q ${n1(x)} ${n1(yy + sag)} ${n1(x + len / 2)} ${n1(yy)}`}
                      fill="none"
                      stroke={light ? "#eef5ec" : "#456b61"}
                      strokeWidth={n2((light ? 0.9 : 0.8) * Math.max(0.6, p))}
                      strokeLinecap="round"
                      opacity={n2((light ? 0.5 : 0.32) * o * (0.45 + 0.55 * p))}
                    />
                  );
                })}
              </g>
            );
          })}

        {/* a wind gust's cat's-paw: a patch of darker, finer ripples crossing, one every few seconds */}
        {catsPaws &&
          [0, 1].map((j) => {
            const ev = lastEvent(lifeF, 210, 17 + j * 5, 0.85);
            const age = lifeF - ev.at;
            const life = 170;
            if (!(age >= 0 && age < life)) return null;
            const hA = hash(ev.k * 3.3 + j * 17);
            const hB = hash(ev.k * 5.9 + j * 29);
            const cy = 612 + hB * 120;
            const p = persp(cy);
            const cx = x0 + 300 + hA * (W - 600) + age * 2.4 * (0.5 + p * 0.5);
            const a = env(age, 0, 40, 70, 60);
            const rx = (180 + hA * 120) * (0.6 + p * 0.5);
            const ry = (10 + hB * 8) * p;
            return (
              <g key={j} opacity={n2(a)}>
                <ellipse cx={n1(cx)} cy={n1(cy)} rx={n1(rx)} ry={n1(ry)} fill={`url(#${id}-paw)`} />
                {Array.from({ length: 26 }, (_, i) => {
                  const u = hash(ev.k * 1.7 + i * 2.3 + j) * 2 - 1;
                  const w = hash(ev.k * 4.1 + i * 5.7 + j) * 2 - 1;
                  if (u * u + w * w > 1) return null;
                  const x = cx + u * rx * 0.9 + Math.sin(lifeF * 0.3 + i) * 2;
                  const y = cy + w * ry * 0.8;
                  const l = (5 + hash(i * 9.3 + ev.k) * 9) * p;
                  return <path key={i} d={`M ${n1(x - l / 2)} ${n1(y)} L ${n1(x + l / 2)} ${n1(y)}`} stroke={i % 3 === 0 ? "#e6f0e8" : "#30524b"} strokeWidth={n2(0.8 * Math.max(0.7, p))} opacity={i % 3 === 0 ? 0.55 : 0.45} strokeLinecap="round" />;
                })}
              </g>
            );
          })}

        {/* light glints: brief sparkles, thicker in the sun's path on the right */}
        {glints && (
          <g style={{ mixBlendMode: "screen" }}>
            {Array.from({ length: 46 }, (_, i) => {
              const h1 = hash(i * 2.9 + 41);
              const h2 = hash(i * 6.1 + 43);
              const h3 = hash(i * 8.7 + 47);
              const sunPath = i < 26;
              const x = sunPath ? 1050 + h1 * 1300 + Math.sin(lifeF * 0.01 + i) * 10 : x0 + h1 * W;
              const y = 590 + Math.pow(h2, 0.8) * 170;
              const p = persp(y);
              const tw = Math.pow(Math.max(0, Math.sin(lifeF * (0.05 + h3 * 0.06) + h1 * 31)), 10);
              if (tw < 0.03) return null;
              return <ellipse key={i} cx={n1(x)} cy={n1(y)} rx={n1((2.5 + h3 * 4) * p)} ry={n2(0.7 * Math.max(0.7, p))} fill="#fffbe6" opacity={n2(tw * 0.9)} />;
            })}
          </g>
        )}

        {/* thin morning mist on the far waterline */}
        {mist > 0 && (
          <g opacity={mist}>
            {Array.from({ length: 9 }, (_, i) => {
              const h1 = hash(i * 3.7 + 61);
              const h2 = hash(i * 5.1 + 67);
              const span = W + 600;
              const x = x0 - 300 + ((((h1 * span + lifeF * (0.12 + h2 * 0.1)) % span) + span) % span);
              const breathe = 0.75 + 0.25 * Math.sin(lifeF * 0.012 + i * 1.7);
              return <ellipse key={i} cx={n1(x)} cy={n1(566 + h2 * 14)} rx={n1(260 + h1 * 260)} ry={n1(9 + h2 * 9)} fill={`url(#${id}-mist)`} opacity={n2(breathe)} />;
            })}
          </g>
        )}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Lily pads, white lilies and pink lotus                                                                         */
/* ------------------------------------------------------------------------------------------------------------ */

export type PondLilyKind = "pad" | "lily" | "lotus" | "bud" | "leafUp";
export interface PondLily {
  x: number;
  y: number;
  /** Pad radius in px (default 14). */
  r?: number;
  kind?: PondLilyKind;
  seed?: number;
}

/** A cluster of pads and flowers around (cx, cy), spread over w px; `flowers` 0..1 sets how many bloom. */
export const pondLilyCluster = (cx: number, cy: number, w: number, count: number, seed: number, r = 14, flowers = 0.35): PondLily[] =>
  Array.from({ length: count }, (_, i) => {
    const h1 = hash(i * 3.17 + seed);
    const h2 = hash(i * 7.91 + seed * 1.3);
    const h3 = hash(i * 1.37 + seed * 2.9);
    const kind: PondLilyKind = h3 < flowers * 0.45 ? "lily" : h3 < flowers * 0.8 ? "lotus" : h3 < flowers ? "bud" : h3 > 0.93 ? "leafUp" : "pad";
    return { x: cx + (h1 - 0.5) * w, y: cy + (h2 - 0.5) * w * 0.12, r: r * (0.65 + h2 * 0.6), kind, seed: seed * 13 + i };
  }).sort((a, b) => a.y - b.y);

const PAD_FILLS = ["#4f7a43", "#5f8a4c", "#6f9853", "#46703e"];

/** Bobbing lily pads with white water lilies (shapla), pink lotus (padma), buds and raised leaves. */
export const PondLilies: React.FC<{ lilies: PondLily[]; lifeF: number; s?: number }> = ({ lilies, lifeF, s = 1 }) => (
  <g pointerEvents="none">
    {lilies.map((L, i) => {
      const sd = L.seed ?? i;
      const r = (L.r ?? 14) * s;
      const ry = r * 0.3;
      const bob = Math.sin(lifeF * 0.045 + sd * 1.3) * 0.7 * s + noise1(lifeF * 0.02, sd) * 0.5 * s;
      const rot = Math.sin(lifeF * 0.02 + sd) * 3 + (hash(sd * 1.7) - 0.5) * 40;
      const notch = (hash(sd * 2.3) * 2 - 1) * Math.PI;
      const pts: string[] = [];
      for (let k = 0; k <= 18; k++) {
        const a = notch + 0.2 + (k / 18) * (Math.PI * 2 - 0.4);
        pts.push(`${n1(Math.cos(a) * r)} ${n1(Math.sin(a) * ry)}`);
      }
      const padD = `M 0 0 L ${pts.join(" L ")} Z`;
      const fill = PAD_FILLS[Math.floor(hash(sd * 4.1) * PAD_FILLS.length)];
      const kind = L.kind ?? "pad";
      const stemSway = Math.sin(lifeF * 0.035 + sd) * 1.4 * s;
      return (
        <g key={i} transform={`translate(${n1(L.x)} ${n1(L.y + bob)})`}>
          {/* the pad's dark reflection/shadow on the water, then the pad */}
          <ellipse cx={0} cy={n1(ry * 0.4)} rx={n1(r * 1.05)} ry={n1(ry * 1.1)} fill="#2f4f3f" opacity={0.25} />
          {kind !== "leafUp" && (
            <g transform={`rotate(${n2(rot * 0.15)})`}>
              <path d={padD} fill={fill} opacity={0.95} />
              <path d={padD} fill="none" stroke={INK} strokeWidth={0.6} opacity={0.45} strokeDasharray="14 4 22 6" />
              <ellipse cx={n1(-r * 0.25)} cy={n1(-ry * 0.25)} rx={n1(r * 0.45)} ry={n1(ry * 0.35)} fill="#a9c27e" opacity={0.35} />
            </g>
          )}
          {kind === "leafUp" && (
            <g transform={`translate(${n2(stemSway)} 0)`}>
              <path d={`M 0 0 Q ${n1(stemSway * 0.4)} ${n1(-r * 0.6)} ${n1(stemSway)} ${n1(-r * 1.1)}`} stroke="#5d7a3c" strokeWidth={n2(1.2 * s)} fill="none" />
              <path
                d={`M ${n1(stemSway - r * 0.9)} ${n1(-r * 1.25)} Q ${n1(stemSway)} ${n1(-r * 0.75)} ${n1(stemSway + r * 0.9)} ${n1(-r * 1.25)} Q ${n1(stemSway)} ${n1(-r * 1.55)} ${n1(stemSway - r * 0.9)} ${n1(-r * 1.25)} Z`}
                fill="#5f8c4a"
                stroke={INK}
                strokeWidth={0.6}
                strokeOpacity={0.5}
              />
            </g>
          )}
          {kind === "lily" && (
            <g transform={`translate(${n1(r * 0.1)} ${n1(-ry * 0.5)})`}>
              {Array.from({ length: 9 }, (_, k) => {
                const a = (k / 9) * Math.PI * 2 + sd;
                const px = Math.cos(a) * r * 0.32;
                const py = Math.sin(a) * r * 0.12 - r * 0.08;
                return (
                  <ellipse
                    key={k}
                    cx={n1(px)}
                    cy={n1(py)}
                    rx={n1(r * 0.3)}
                    ry={n1(r * 0.1)}
                    fill={Math.sin(a) > 0 ? "#fbf7ec" : "#ece6d6"}
                    stroke={INK}
                    strokeWidth={0.4}
                    strokeOpacity={0.4}
                    transform={`rotate(${n1((a * 180) / Math.PI)} ${n1(px)} ${n1(py)})`}
                  />
                );
              })}
              <ellipse cx={0} cy={n1(-r * 0.14)} rx={n1(r * 0.17)} ry={n1(r * 0.1)} fill="#f1cf5a" />
            </g>
          )}
          {(kind === "lotus" || kind === "bud") && (
            <g>
              <path d={`M 0 ${n1(-ry * 0.2)} Q ${n1(stemSway * 0.5)} ${n1(-r * 0.7)} ${n1(stemSway)} ${n1(-r * 1.25)}`} stroke="#5d7a3c" strokeWidth={n2(1.3 * s)} fill="none" />
              <g transform={`translate(${n1(stemSway)} ${n1(-r * 1.25)})`}>
                {kind === "bud" ? (
                  <path
                    d={`M 0 0 C ${n1(-r * 0.32)} ${n1(-r * 0.2)} ${n1(-r * 0.2)} ${n1(-r * 0.7)} 0 ${n1(-r * 0.85)} C ${n1(r * 0.2)} ${n1(-r * 0.7)} ${n1(r * 0.32)} ${n1(-r * 0.2)} 0 0 Z`}
                    fill="#e48fa2"
                    stroke={INK}
                    strokeWidth={0.5}
                    strokeOpacity={0.5}
                  />
                ) : (
                  <>
                    {[-2, 2, -1, 1, 0].map((k) => {
                      const ang = k * 22;
                      const len = r * (k === 0 ? 0.85 : Math.abs(k) === 1 ? 0.8 : 0.66);
                      return (
                        <path
                          key={k}
                          d={`M 0 0 C ${n1(-r * 0.26)} ${n1(-len * 0.3)} ${n1(-r * 0.18)} ${n1(-len * 0.85)} 0 ${n1(-len)} C ${n1(r * 0.18)} ${n1(-len * 0.85)} ${n1(r * 0.26)} ${n1(-len * 0.3)} 0 0 Z`}
                          fill={Math.abs(k) === 2 ? "#e98ea2" : k === 0 ? "#f7c6d0" : "#f0a9b8"}
                          stroke="#8a3a4a"
                          strokeWidth={0.45}
                          strokeOpacity={0.55}
                          transform={`rotate(${ang})`}
                        />
                      );
                    })}
                    <ellipse cx={0} cy={n1(-r * 0.12)} rx={n1(r * 0.16)} ry={n1(r * 0.08)} fill="#f2cf63" />
                  </>
                )}
              </g>
            </g>
          )}
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------------------------------------------------ */
/* Fish rings                                                                                                     */
/* ------------------------------------------------------------------------------------------------------------ */

/**
 * Rings where a fish touches the surface, at random spots of `region`, on the life clock. `slots` rings can be alive at
 * once (default 3), each slot fires about once per `period` frames (default 120). `s` scales the rings; `squash` is
 * the perspective flattening (default 0.28).
 */
export const PondFishRings: React.FC<{ region: PondRect; lifeF: number; slots?: number; period?: number; s?: number; squash?: number; seed?: number }> = ({
  region,
  lifeF,
  slots = 3,
  period = 120,
  s = 1,
  squash = 0.28,
  seed = 5,
}) => (
  <g pointerEvents="none">
    {Array.from({ length: slots }, (_, i) => {
      const ev = lastEvent(lifeF + i * 37, period, seed + i * 7, 0.75);
      const age = lifeF + i * 37 - ev.at;
      const life = 78;
      if (!(age >= 0 && age < life)) return null;
      const x = region.x + hash(ev.k * 2.7 + i * 13 + seed) * region.w;
      const y = region.y + hash(ev.k * 6.1 + i * 3 + seed) * region.h;
      const ps = s * (0.75 + 0.5 * ((y - region.y) / Math.max(1, region.h)));
      return (
        <g key={i}>
          {[0, 1, 2].map((k) => {
            const t = age - k * 9;
            if (t < 0) return null;
            const r = (3 + t * 0.62) * ps;
            const o = (1 - age / life) * (k === 0 ? 0.75 : 0.5);
            return <ellipse key={k} cx={n1(x)} cy={n1(y)} rx={n1(r)} ry={n1(r * squash)} fill="none" stroke="#eef6ee" strokeWidth={n2(1.1 * ps)} opacity={n2(o)} />;
          })}
          {age < 8 && <ellipse cx={n1(x)} cy={n1(y - 1)} rx={n1(2.4 * ps)} ry={n1(1 * ps)} fill="#2f4b44" opacity={n2(0.5 * (1 - age / 8))} />}
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------------------------------------------------ */
/* Village ducks                                                                                                  */
/* ------------------------------------------------------------------------------------------------------------ */

export interface PondDuckPath {
  from: PondPt;
  to: PondPt;
  /** Frame (life clock) the flock leaves `from` (default 0). */
  start?: number;
  /** Frames to reach `to` (default 1500): about 20 cm/s, an unhurried village-duck glide. */
  frames?: number;
}
export interface PondDuckSpec {
  kind: "white" | "brown";
  /** Offset from the flock's path point (px, in the direction of travel's back for dx > 0). */
  dx: number;
  dy: number;
  /** "feed" dips the head now and then, "preen" turns back to the wing, "glide" only looks about. */
  habit: "glide" | "feed" | "preen";
  seed: number;
}

export const POND_DUCKS_DEFAULT: PondDuckSpec[] = [
  { kind: "white", dx: 0, dy: 0, habit: "glide", seed: 1 },
  { kind: "brown", dx: 62, dy: 11, habit: "feed", seed: 2 },
  { kind: "white", dx: 128, dy: -7, habit: "preen", seed: 3 },
  { kind: "brown", dx: 190, dy: 6, habit: "feed", seed: 4 },
];

type DuckState = { tilt: number; neck: number; headTurn: number; bob: number; paddle: number };

const DUCK_COL = {
  white: { body: "#f7f2e6", shade: "#d8d0bd", wing: "#e8e1d0", head: "#f9f5ea", bill: "#e9933a", refl: "#d9e3da" },
  brown: { body: "#a37a4f", shade: "#7a5636", wing: "#8a6440", head: "#6f4e30", bill: "#b8873e", refl: "#6f7461" },
} as const;

/** One duck in local units (facing +x, waterline y = 0, about 46 px long). `reflect` draws the tinted water image. */
const duckArt = (kind: "white" | "brown", st: DuckState, reflect: boolean) => {
  const C = DUCK_COL[kind];
  const ink = reflect ? undefined : INK;
  const body = "M 18 -1 C 23 -7 19 -14 10 -15 C 2 -16 -8 -15 -14 -13 L -24 -18 C -23 -11 -21 -5 -16 -1 Z";
  const wing = "M 12 -10 C 4 -15 -10 -15 -19 -11 C -11 -6 2 -5 12 -10 Z";
  const head = (
    <g transform={`rotate(${n1(st.neck)} 11 -11)`}>
      <path d="M 8 -10 C 9 -18 13 -23 16 -26 L 21 -24 C 18 -20 15 -15 15 -9 Z" fill={reflect ? C.refl : C.head} />
      <g transform={`rotate(${n1(st.headTurn)} 18 -26)`}>
        <ellipse cx={18} cy={-26} rx={5.6} ry={4.9} fill={reflect ? C.refl : C.head} stroke={ink} strokeWidth={0.7} strokeOpacity={0.6} />
        <path d="M 22.5 -27 C 26 -27.5 29.5 -26.5 30 -25 C 28 -24 25 -23.6 22.4 -24.4 Z" fill={reflect ? C.refl : C.bill} stroke={ink} strokeWidth={0.5} strokeOpacity={0.55} />
        {!reflect && <circle cx={19.6} cy={-27.6} r={0.9} fill="#1b130c" />}
        {!reflect && kind === "white" && <path d="M 15 -29 Q 18 -31.5 21 -29.6" fill="none" stroke="#ffffff" strokeWidth={0.8} opacity={0.8} />}
      </g>
    </g>
  );
  return (
    <g transform={`translate(0 ${n2(st.bob)}) rotate(${n1(st.tilt)} 2 -4)`}>
      {/* paddling feet just under the surface (only the faint water image shows them) */}
      <path d={body} fill={reflect ? C.refl : C.body} stroke={ink} strokeWidth={0.8} strokeOpacity={0.6} strokeDasharray={reflect ? undefined : "26 3 18 4 40 2"} />
      {!reflect && <path d="M 18 -1 C 8 -4 -8 -4 -17 -2 L -16 -1 Z" fill={C.shade} opacity={0.75} />}
      {!reflect && <path d={wing} fill={C.wing} stroke={ink} strokeWidth={0.6} strokeOpacity={0.5} />}
      {!reflect && kind === "brown" && <path d="M -6 -11 L -12 -10 L -10 -8.6 L -4 -9.5 Z" fill="#3d5a8c" opacity={0.85} />}
      {!reflect && kind === "brown" && (
        <g opacity={0.45} fill="none" stroke="#5a3c22" strokeWidth={0.7} strokeLinecap="round">
          <path d="M 6 -12 q 2 1 4 0 M 0 -13 q 2 1 4 0 M -6 -12 q 2 1 4 0 M 10 -7 q 2 1 4 0 M 3 -8 q 2 1 4 0" />
        </g>
      )}
      {head}
    </g>
  );
};

/**
 * A small flock of white and brown village ducks gliding along `path` (life clock), heads bobbing with the paddle
 * stroke, one dipping its head to feed now and then (tail up), one preening, each with a soft V wake, ripple rings
 * and a rippling reflection. Faces left automatically when travelling left. `s` = size (1: a duck ~46 px long, right
 * for the near-water layer). Draw it in the near-water layer, before the characters: ducks never cross a face.
 */
export const PondDucks: React.FC<{ lifeF: number; path: PondDuckPath; ducks?: PondDuckSpec[]; s?: number }> = ({
  lifeF,
  path,
  ducks = POND_DUCKS_DEFAULT,
  s = 1,
}) => {
  const id = sid(useId(), "pdk");
  const start = path.start ?? 0;
  const frames = path.frames ?? 1500;
  const u = clamp((lifeF - start) / frames);
  const dir = path.to.x >= path.from.x ? 1 : -1;
  const speed = Math.hypot(path.to.x - path.from.x, path.to.y - path.from.y) / frames;
  const moving = lifeF > start && lifeF < start + frames;
  const base = { x: lerp(path.from.x, path.to.x, u), y: lerp(path.from.y, path.to.y, u) };
  const items = ducks
    .map((d) => {
      const sd = d.seed;
      const wander = noise1(lifeF * 0.006, sd * 7) * 14;
      const x = base.x - dir * d.dx * s + noise1(lifeF * 0.004, sd * 3) * 8 * s;
      const y = base.y + d.dy * s + wander * 0.25 * s;
      const paddle = Math.sin(lifeF * 0.21 + sd * 2.1);
      let tilt = paddle * 0.9 + noise1(lifeF * 0.03, sd) * 1.2;
      let neck = paddle * 3 + noise1(lifeF * 0.05, sd + 9) * 4;
      let headTurn = noise1(lifeF * 0.04, sd + 21) * 10;
      let dipT = -1;
      if (d.habit === "feed") {
        const ev = lastEvent(lifeF, 150, sd * 11, 0.8);
        const a = env(lifeF - ev.at, 0, 10, 22, 12);
        if (a > 0) {
          dipT = lifeF - ev.at;
          tilt = lerp(tilt, 26, a);
          neck = lerp(neck, 104, a);
        }
      } else if (d.habit === "preen") {
        const ev = lastEvent(lifeF, 170, sd * 13, 0.8);
        const a = env(lifeF - ev.at, 0, 12, 46, 14);
        if (a > 0) {
          neck = lerp(neck, -120, a);
          headTurn = lerp(headTurn, 30 + Math.sin(lifeF * 0.9) * 10, a);
        }
      }
      return { d, x, y, st: { tilt, neck, headTurn, bob: Math.sin(lifeF * 0.11 + sd) * 0.6, paddle } as DuckState, dipT };
    })
    .sort((a, b) => a.y - b.y);
  return (
    <g pointerEvents="none">
      <defs>
        <clipPath id={`${id}-above`}>
          <rect x={-60} y={-60} width={120} height={60.6} />
        </clipPath>
        <clipPath id={`${id}-below`}>
          <rect x={-60} y={0.4} width={120} height={60} />
        </clipPath>
      </defs>
      {items.map(({ d, x, y, st, dipT }, i) => {
        const fx = dir < 0 ? -1 : 1;
        const wakeL = moving ? 70 : 0;
        return (
          <g key={i} transform={`translate(${n1(x)} ${n1(y)}) scale(${n2(s)})`}>
            {/* V wake trailing behind, and small rings at the breast */}
            {moving && (
              <g fill="none" stroke="#eef6ef" strokeLinecap="round">
                {[-1, 1].map((side) =>
                  [0, 1, 2, 3].map((k) => {
                    const ph = ((lifeF * speed * 0.9 + k * 0.25 * 1) % 1 + 1) % 1;
                    const t0 = (k + ph) / 4;
                    const t1 = t0 + 0.14;
                    const p0 = { x: fx * (18 - t0 * wakeL), y: 1 + side * t0 * 9 };
                    const p1 = { x: fx * (18 - t1 * wakeL), y: 1 + side * t1 * 9 };
                    return <path key={`${side}${k}`} d={`M ${n1(p0.x)} ${n1(p0.y)} L ${n1(p1.x)} ${n1(p1.y)}`} strokeWidth={1.1} opacity={n2(0.55 * (1 - t0))} />;
                  }),
                )}
                <ellipse cx={fx * 16} cy={1} rx={6 + 1.5 * st.paddle} ry={1.6} strokeWidth={0.8} opacity={0.5} />
              </g>
            )}
            {/* rings when the head goes under */}
            {dipT >= 0 && dipT < 60 && (
              <g fill="none" stroke="#eef6ef">
                {[0, 1].map((k) => {
                  const t = dipT - 6 - k * 10;
                  if (t < 0) return null;
                  const r = 6 + t * 0.7;
                  return <ellipse key={k} cx={fx * 24} cy={1} rx={n1(r)} ry={n1(r * 0.25)} strokeWidth={0.9} opacity={n2(0.6 * (1 - dipT / 60))} />;
                })}
              </g>
            )}
            {/* the water image: mirrored, tinted, wobbling */}
            <g clipPath={`url(#${id}-below)`} opacity={0.42}>
              <g transform={`scale(${fx} -0.82) skewX(${n2(Math.sin(lifeF * 0.13 + d.seed) * 4)})`}>{duckArt(d.kind, st, true)}</g>
            </g>
            <ellipse cx={0} cy={1} rx={22} ry={2.2} fill="#2f4c45" opacity={0.18} />
            <g clipPath={`url(#${id}-above)`}>
              <g transform={`scale(${fx} 1)`}>{duckArt(d.kind, st, false)}</g>
            </g>
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Dragonflies                                                                                                    */
/* ------------------------------------------------------------------------------------------------------------ */

/**
 * Dragonflies skimming low over the water: hover with a tremble, then a quick dart to a new spot in their zone (every
 * one to three seconds), a faint shadow on the water. Wings are glassy with sepia veins; bodies crimson (marsh
 * glider) or amber. One per zone; `s` = size (1: ~38 px wingspan).
 */
export const PondDragonflies: React.FC<{ zones: PondRect[]; lifeF: number; s?: number }> = ({ zones, lifeF, s = 1 }) => (
  <g pointerEvents="none">
    {zones.map((Z, i) => {
      const per = 56 + i * 13;
      const k = Math.floor((lifeF + i * 29) / per);
      const t = (lifeF + i * 29) - k * per;
      const spot = (kk: number) => ({ x: Z.x + hash(kk * 3.1 + i * 17) * Z.w, y: Z.y + hash(kk * 5.7 + i * 23) * Z.h });
      const a = spot(k - 1);
      const b = spot(k);
      const m = sstep(t / 9);
      const x = lerp(a.x, b.x, m) + noise1(lifeF * 0.25, i * 5) * 2.2 * s;
      const y = lerp(a.y, b.y, m) + noise1(lifeF * 0.27, i * 9) * 1.6 * s - Math.sin(m * Math.PI) * 10 * s;
      const face = b.x >= a.x ? 1 : -1;
      const flap = Math.sin(lifeF * 2.9 + i) > 0;
      const body = i % 2 === 0 ? "#b8322a" : "#c9822e";
      return (
        <g key={i}>
          <ellipse cx={n1(x)} cy={n1(y + 20 * s)} rx={n1(9 * s)} ry={n1(1.4 * s)} fill="#21352f" opacity={0.18} />
          <g transform={`translate(${n1(x)} ${n1(y)}) scale(${n2(face * s)} ${n2(s)})`}>
            {[-1, 1].map((sd) => (
              <g key={sd} opacity={flap ? 0.8 : 0.55}>
                <path
                  d={`M 2 0 C 6 ${sd * (flap ? -7 : -4)} 14 ${sd * (flap ? -9 : -6)} 18 ${sd * (flap ? -8 : -5)} C 13 ${sd * -2} 7 ${sd * -1} 2 0 Z`}
                  fill="#e8f2f2"
                  stroke={INK}
                  strokeWidth={0.4}
                  strokeOpacity={0.5}
                  transform={`scale(1 0.55) rotate(${sd * -80} 2 0)`}
                />
                <path
                  d={`M -1 0 C 3 ${sd * (flap ? -7 : -4)} 11 ${sd * (flap ? -9 : -6)} 15 ${sd * (flap ? -8 : -5)} C 10 ${sd * -2} 4 ${sd * -1} -1 0 Z`}
                  fill="#e8f2f2"
                  stroke={INK}
                  strokeWidth={0.4}
                  strokeOpacity={0.5}
                  transform={`scale(1 0.55) rotate(${sd * -100} -1 0)`}
                />
              </g>
            ))}
            <path d="M 0 0 L -21 0.4" stroke={body} strokeWidth={1.7} strokeLinecap="round" />
            <path d="M -6 0 L -6.5 0 M -10 0 L -10.5 0 M -14 0.1 L -14.5 0.1" stroke="#3a1510" strokeWidth={1.9} opacity={0.5} />
            <ellipse cx={1.5} cy={0} rx={3.4} ry={2.2} fill={body} stroke={INK} strokeWidth={0.4} strokeOpacity={0.6} />
            <circle cx={5} cy={0} r={2.2} fill="#7a2a20" stroke={INK} strokeWidth={0.4} strokeOpacity={0.6} />
          </g>
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------------------------------------------------ */
/* Water striders                                                                                                 */
/* ------------------------------------------------------------------------------------------------------------ */

/**
 * Water striders resting on still water, then skating a few centimetres in a quick glide; tiny dimples under their
 * feet. `region` is where they roam (layer px), `count` (default 2), `s` = size (1: ~22 px leg span).
 */
export const PondWaterStriders: React.FC<{ region: PondRect; lifeF: number; count?: number; s?: number }> = ({ region, lifeF, count = 2, s = 1 }) => (
  <g pointerEvents="none">
    {Array.from({ length: count }, (_, i) => {
      const per = 38 + i * 17;
      const lf = lifeF + i * 23;
      const k = Math.floor(lf / per);
      const t = lf - k * per;
      const at = (kk: number) => ({ x: region.x + hash(kk * 2.3 + i * 31) * region.w, y: region.y + hash(kk * 4.9 + i * 37) * region.h });
      const a = at(k - 1);
      const b = at(k);
      const m = sstep(t / 7);
      const x = lerp(a.x, b.x, m);
      const y = lerp(a.y, b.y, m);
      const ang = (Math.atan2((b.y - a.y) * 3, b.x - a.x) * 180) / Math.PI;
      const legs: Array<[number, number]> = [
        [9, -3],
        [9, 3],
        [-7, -6],
        [-7, 6],
        [-11, -4],
        [-11, 4],
      ];
      return (
        <g key={i} transform={`translate(${n1(x)} ${n1(y)}) scale(${n2(s)} ${n2(s * 0.45)}) rotate(${n1(ang)})`}>
          {legs.map(([lx, ly], j) => (
            <g key={j}>
              <ellipse cx={lx} cy={ly} rx={1.8} ry={1.8} fill="none" stroke="#dfeee6" strokeWidth={0.6} opacity={0.6} />
              <path d={`M 0 0 Q ${n1(lx * 0.5)} ${n1(ly * 0.9 - 2)} ${lx} ${ly}`} fill="none" stroke="#2b2016" strokeWidth={0.55} />
            </g>
          ))}
          <ellipse cx={0} cy={0} rx={4.2} ry={1.3} fill="#33261a" />
          {m > 0 && m < 1 && <path d="M -4 0 L -12 0" stroke="#eef6ee" strokeWidth={0.7} opacity={0.6} />}
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------------------------------------------------ */
/* Kingfisher                                                                                                     */
/* ------------------------------------------------------------------------------------------------------------ */

/** A white-throated kingfisher in local units (facing +x, feet at 0,0; ~30 px long at s = 1). */
const KingfisherArt: React.FC<{ wing: number; diving: boolean; fish: boolean; tail: number; head: number }> = ({ wing, diving, fish, tail, head }) => (
  <g>
    {/* tail */}
    <path d={`M -6 -8 L ${n1(-16)} ${n1(-2 + tail)} L ${n1(-14)} ${n1(1 + tail)} L -4 -5 Z`} fill="#2f7fbf" stroke={INK} strokeWidth={0.5} strokeOpacity={0.6} />
    {/* body: chestnut belly, blue back */}
    <path d="M 8 -16 C 12 -12 10 -4 3 -2 C -3 -1 -7 -4 -8 -8 C -6 -13 1 -17 8 -16 Z" fill="#8a4a24" stroke={INK} strokeWidth={0.6} strokeOpacity={0.65} />
    <path d="M 8 -16 C 2 -15 -4 -12 -8 -8 C -4 -9 0 -11 4 -12 Z" fill="#2f86c9" />
    {/* wing */}
    <path
      d={diving ? "M 4 -12 C -2 -12 -8 -9 -12 -6 C -6 -8 0 -9 4 -10 Z" : `M 4 -12 C -2 ${n1(-14 - wing * 12)} -10 ${n1(-12 - wing * 16)} -14 ${n1(-7 - wing * 14)} C -8 -8 -2 -9 4 -10 Z`}
      fill="#3a9be0"
      stroke={INK}
      strokeWidth={0.5}
      strokeOpacity={0.6}
    />
    {/* head, white bib, red bill */}
    <g transform={`rotate(${n1(head)} 8 -16)`}>
      <path d="M 7 -17 C 7 -23 15 -24 15 -18 C 15 -15 12 -13 9 -13 Z" fill="#7d3f1d" stroke={INK} strokeWidth={0.55} strokeOpacity={0.65} />
      <path d="M 9 -13 C 12 -13 14 -15 15 -17 C 14 -13 12 -11 9 -11.5 Z" fill="#f8f4ea" />
      <path d="M 14.5 -19 L 25 -17 L 14.8 -16 Z" fill="#d6322a" stroke={INK} strokeWidth={0.5} strokeOpacity={0.6} />
      <circle cx={12.4} cy={-19.2} r={0.9} fill="#140d08" />
      {fish && <path d="M 20 -16.5 C 22 -14 25 -14 27 -15.5 L 29 -17 L 28 -14 C 25 -12.5 22 -13.5 20 -16.5 Z" fill="#c9d3d4" stroke={INK} strokeWidth={0.4} strokeOpacity={0.6} />}
    </g>
    <path d="M 1 -2 L 0 1 M 4 -2 L 4 1" stroke="#c9584a" strokeWidth={1} />
  </g>
);

/**
 * A white-throated kingfisher on a perch (a ghat post, a reed, a bamboo stake): bobs, turns its head, flicks its tail;
 * if `diveAt` (story clock `f`) is given it dives once into the water at `target`, a small splash, and flies back up
 * to the perch with a small fish, which it tosses and swallows. Put the dive in a wordless moment.
 */
export const PondKingfisher: React.FC<{ f: number; lifeF: number; perch: PondPt; target: PondPt; diveAt?: number; s?: number }> = ({
  f,
  lifeF,
  perch,
  target,
  diveAt,
  s = 1,
}) => {
  const t = diveAt === undefined ? -1 : f - diveAt;
  const flick = Math.max(0, Math.sin(lifeF * 0.11)) > 0.97 ? -5 : 0;
  const headJerk = Math.floor(lifeF / 37) % 3 === 0 ? -8 : Math.floor(lifeF / 37) % 3 === 1 ? 4 : 0;
  let pos = perch;
  let rot = 0;
  let wing = 0;
  let diving = false;
  let hidden = false;
  let fish = false;
  let splashT = -1;
  if (t >= 0 && t < 150) {
    if (t < 7) {
      rot = -12 * sstep(t / 7); // crouch, eye on the water
    } else if (t < 17) {
      const m = sstep((t - 7) / 10);
      pos = { x: lerp(perch.x, target.x, m), y: lerp(perch.y, target.y, m * m) };
      rot = lerp(-12, 70, m);
      diving = true;
    } else if (t < 27) {
      hidden = true;
      pos = target;
    } else if (t < 45) {
      const m = sstep((t - 27) / 18);
      pos = { x: lerp(target.x, perch.x, m), y: lerp(target.y, perch.y, Math.sqrt(m)) - Math.sin(m * Math.PI) * 14 * s };
      wing = Math.sin(t * 1.6) * 0.5 + 0.5;
      rot = lerp(-30, 0, m);
      fish = true;
    } else {
      fish = t < 112;
      rot = t > 100 && t < 112 ? -25 * Math.sin(((t - 100) / 12) * Math.PI) : 0;
    }
    if (t >= 16) splashT = t - 16;
  }
  return (
    <g pointerEvents="none">
      {splashT >= 0 && splashT < 70 && (
        <g>
          {[0, 1, 2].map((k) => {
            const tt = splashT - k * 8;
            if (tt < 0) return null;
            const r = (3 + tt * 0.7) * s;
            return <ellipse key={k} cx={n1(target.x)} cy={n1(target.y)} rx={n1(r * 1.3)} ry={n1(r * 0.36)} fill="none" stroke="#f6fbf6" strokeWidth={n2(1.8 * s)} opacity={n2(0.95 * (1 - splashT / 70))} />;
          })}
          {splashT < 14 &&
            Array.from({ length: 9 }, (_, k) => {
              const a = -Math.PI * (0.15 + (k / 8) * 0.7);
              const v = (3 + hash(k * 3.3) * 2) * s;
              const x = target.x + Math.cos(a) * v * splashT;
              const y = target.y + Math.sin(a) * v * splashT + 0.35 * splashT * splashT * s;
              return <circle key={k} cx={n1(x)} cy={n1(y)} r={n2(2 * s)} fill="#f8fcf8" opacity={n2(1 - splashT / 14)} />;
            })}
        </g>
      )}
      {!hidden && (
        <g transform={`translate(${n1(pos.x)} ${n1(pos.y + Math.sin(lifeF * 0.08) * 0.4)}) scale(${n2(s)}) rotate(${n1(rot)})`}>
          <KingfisherArt wing={wing} diving={diving} fish={fish} tail={flick} head={t >= 0 && t < 7 ? 10 : headJerk} />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------------------ */
/* Edge plants: water hyacinth (kochuripana), kalmi, reeds                                                        */
/* ------------------------------------------------------------------------------------------------------------ */

export interface PondEdgeClump {
  x: number;
  /** The clump's waterline (its base). */
  y: number;
  kind: "hyacinth" | "kalmi" | "reeds";
  s?: number;
  /** kalmi: the direction its runners trail out over the water (-1 left, 1 right). */
  dir?: number;
  seed?: number;
}

const Hyacinth: React.FC<{ x: number; y: number; s: number; lifeF: number; seed: number }> = ({ x, y, s, lifeF, seed }) => {
  const bob = Math.sin(lifeF * 0.04 + seed) * 0.8 * s;
  const leaves = 11;
  return (
    <g transform={`translate(${n1(x)} ${n1(y + bob)}) scale(${n2(s)})`}>
      <ellipse cx={0} cy={1} rx={34} ry={5} fill="#2c4a3a" opacity={0.3} />
      {/* a floating rosette: glossy rounded leaves on short swollen stalks, back row first, overlapping */}
      {Array.from({ length: leaves }, (_, i) => {
        const h = hash(seed * 3.1 + i * 1.7);
        const back = i % 2 === 0;
        const lx = (i - (leaves - 1) / 2) * 4.6 + (h - 0.5) * 4;
        const lh = (back ? 9 : 4) + h * 5;
        const sway = Math.sin(lifeF * 0.05 + i + seed) * 0.8;
        const lean = (lx / 24) * 6 + sway;
        const fill = ["#4f8a45", "#5f9a4e", "#6ea85a", "#477d3e"][i % 4];
        return { i, back, lx, lh, lean, fill };
      })
        .sort((p, q) => Number(q.back) - Number(p.back))
        .map(({ i, lx, lh, lean, fill }) => (
          <g key={i}>
            <ellipse cx={n1(lx + lean * 0.4)} cy={n1(-lh * 0.4)} rx={2.6} ry={n1(lh * 0.45 + 1.5)} fill="#7fae5a" stroke={INK} strokeWidth={0.35} strokeOpacity={0.35} />
            <ellipse cx={n1(lx + lean)} cy={n1(-lh - 3)} rx={8} ry={5.4} fill={fill} stroke={INK} strokeWidth={0.5} strokeOpacity={0.45} transform={`rotate(${n1(lean * 2.5)} ${n1(lx + lean)} ${n1(-lh - 3)})`} />
            <ellipse cx={n1(lx + lean - 2)} cy={n1(-lh - 4.6)} rx={3.4} ry={1.6} fill="#c3dc98" opacity={0.5} />
          </g>
        ))}
      {hash(seed * 5.3) > 0.3 && (
        <g transform={`translate(${n1((hash(seed) - 0.5) * 16)} 0)`}>
          <path d={`M 0 -12 Q ${n1(Math.sin(lifeF * 0.04 + seed) * 2)} -26 ${n1(Math.sin(lifeF * 0.04 + seed) * 3)} -38`} stroke="#5d8a45" strokeWidth={1.6} fill="none" />
          {Array.from({ length: 6 }, (_, k) => {
            const fy = -30 - k * 3.2;
            const fx = Math.sin(lifeF * 0.04 + seed) * 3 + (k % 2 ? 3 : -3);
            return (
              <g key={k}>
                <ellipse cx={n1(fx)} cy={n1(fy)} rx={3.6} ry={2.3} fill={k % 2 ? "#b79ad6" : "#c7aee2"} stroke="#5a3f7a" strokeWidth={0.35} strokeOpacity={0.6} />
                {k % 2 === 0 && <circle cx={n1(fx)} cy={n1(fy - 0.4)} r={0.8} fill="#f2cf4a" />}
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
};

const Kalmi: React.FC<{ x: number; y: number; s: number; lifeF: number; seed: number; dir: number }> = ({ x, y, s, lifeF, seed, dir }) => (
  <g transform={`translate(${n1(x)} ${n1(y)}) scale(${n2(dir * s)} ${n2(s)})`}>
    {[0, 1, 2].map((r) => {
      const len = 70 + hash(seed + r * 3.3) * 50;
      const dy = -4 - r * 4;
      const wob = Math.sin(lifeF * 0.03 + r + seed) * 2;
      const pts = Array.from({ length: 6 }, (_, k) => {
        const u = k / 5;
        return { x: u * len, y: dy * u + Math.sin(u * 4 + r) * 3 + wob * u };
      });
      const d = `M 0 0 ${pts.map((p) => `L ${n1(p.x)} ${n1(p.y)}`).join(" ")}`;
      return (
        <g key={r}>
          <path d={d} stroke="#6f8f4a" strokeWidth={1.6} fill="none" strokeLinecap="round" />
          {pts.slice(1).map((p, k) => (
            <g key={k} transform={`translate(${n1(p.x)} ${n1(p.y)}) rotate(${k % 2 ? -35 : 25})`}>
              <path d="M 0 0 L 4 -9 L 1.5 -8 L 0 -14 L -1.5 -8 L -4 -9 Z" fill={k % 2 ? "#5f8f45" : "#73a052"} stroke={INK} strokeWidth={0.4} strokeOpacity={0.4} />
            </g>
          ))}
          {r === 1 && (
            <g transform={`translate(${n1(pts[3].x)} ${n1(pts[3].y - 6)})`}>
              <path d="M 0 0 L -4 -8 Q 0 -10 4 -8 Z" fill="#f3e3ee" stroke="#8a5a80" strokeWidth={0.4} />
              <ellipse cx={0} cy={-8.5} rx={5} ry={1.8} fill="#f6e8f1" stroke="#8a5a80" strokeWidth={0.4} />
              <ellipse cx={0} cy={-8.5} rx={1.6} ry={0.8} fill="#9a4f8f" />
            </g>
          )}
        </g>
      );
    })}
  </g>
);

const Reeds: React.FC<{ x: number; y: number; s: number; lifeF: number; seed: number }> = ({ x, y, s, lifeF, seed }) => (
  <g>
    {Array.from({ length: 11 }, (_, i) => {
      const r1 = hash(seed + i * 3.3);
      const r2 = hash(seed * 1.9 + i * 7.1);
      const h = (40 + r1 * 62) * s;
      const bx = x + (i - 5) * 3.2 * s;
      const sway = Math.sin(lifeF * 0.045 + i * 0.8 + seed) * 2.8 * s + (r2 - 0.5) * 26 * s;
      const w = (1.4 + r2 * 1.3) * s;
      const tipX = bx + sway;
      return (
        <g key={i}>
          <path
            d={`M ${n1(bx - w)} ${n1(y)} Q ${n1(bx + sway * 0.3)} ${n1(y - h * 0.55)} ${n1(tipX)} ${n1(y - h)} Q ${n1(bx + sway * 0.3 + w * 0.5)} ${n1(y - h * 0.5)} ${n1(bx + w)} ${n1(y)} Z`}
            fill={["#5d7636", "#7a8f45", "#97a457", "#6c6f3a"][i % 4]}
            opacity={0.92}
          />
          {i % 4 === 1 && (
            <ellipse cx={n1(tipX - sway * 0.1)} cy={n1(y - h * 0.86)} rx={n1(2.3 * s)} ry={n1(7.5 * s)} fill="#7a5532" stroke={INK} strokeWidth={0.6} transform={`rotate(${n1(sway * 0.9)} ${n1(tipX - sway * 0.1)} ${n1(y - h * 0.86)})`} />
          )}
        </g>
      );
    })}
    <ellipse cx={x} cy={y + 1} rx={22 * s} ry={2.4 * s} fill="#2f4c40" opacity={0.25} />
  </g>
);

/** Water hyacinth rafts with lilac spikes, kalmi runners trailing out over the water with pale trumpet flowers, reeds. */
export const PondEdgePlants: React.FC<{ clumps: PondEdgeClump[]; lifeF: number }> = ({ clumps, lifeF }) => (
  <g pointerEvents="none">
    {clumps.map((c, i) => {
      const s = c.s ?? 1;
      const seed = c.seed ?? i * 7 + 3;
      if (c.kind === "hyacinth") return <Hyacinth key={i} x={c.x} y={c.y} s={s} lifeF={lifeF} seed={seed} />;
      if (c.kind === "kalmi") return <Kalmi key={i} x={c.x} y={c.y} s={s} lifeF={lifeF} seed={seed} dir={c.dir ?? 1} />;
      return <Reeds key={i} x={c.x} y={c.y} s={s} lifeF={lifeF} seed={seed} />;
    })}
  </g>
);

/* ------------------------------------------------------------------------------------------------------------ */
/* Bank ground cover, butterflies, floating petals                                                                */
/* ------------------------------------------------------------------------------------------------------------ */

export interface PondCoverPatch {
  /** Centre of the patch's ground line. */
  x: number;
  y: number;
  /** Width of the patch in px. */
  w: number;
  /** Size (1 = the figures' ground line at y ~ 940). */
  s?: number;
  ferns?: number;
  flowers?: number;
  seed?: number;
}

const Fern: React.FC<{ x: number; y: number; s: number; lean: number; lifeF: number; seed: number }> = ({ x, y, s, lean, lifeF, seed }) => {
  const sway = Math.sin(lifeF * 0.04 + seed) * 2 * s;
  const L = (34 + hash(seed) * 22) * s;
  const tip = { x: x + lean * L * 0.6 + sway, y: y - L * 0.85 };
  const ctrl = { x: x + lean * L * 0.15, y: y - L * 0.6 };
  const n = 9;
  const pts = Array.from({ length: n }, (_, k) => {
    const u = (k + 1) / (n + 1);
    const m = 1 - u;
    return {
      x: m * m * x + 2 * m * u * ctrl.x + u * u * tip.x,
      y: m * m * y + 2 * m * u * ctrl.y + u * u * tip.y,
      l: (1 - u * 0.75) * 9 * s,
    };
  });
  const col = hash(seed * 3) > 0.5 ? "#4e7a3a" : "#5f8a42";
  return (
    <g>
      <path d={`M ${n1(x)} ${n1(y)} Q ${n1(ctrl.x)} ${n1(ctrl.y)} ${n1(tip.x)} ${n1(tip.y)}`} stroke="#4a6a30" strokeWidth={n2(1.2 * s)} fill="none" />
      {pts.map((p, k) =>
        [-1, 1].map((sd) => (
          <ellipse
            key={`${k}${sd}`}
            cx={n1(p.x + sd * p.l * 0.55)}
            cy={n1(p.y + p.l * 0.12)}
            rx={n1(p.l * 0.6)}
            ry={n1(p.l * 0.2)}
            fill={col}
            transform={`rotate(${n1(sd * 28 + lean * 20)} ${n1(p.x + sd * p.l * 0.55)} ${n1(p.y + p.l * 0.12)})`}
          />
        )),
      )}
    </g>
  );
};

/**
 * Ground cover for cut-out bases and edges: grass tufts, ferns, small weeds with white/yellow flowers, leaf litter and
 * fallen mandar petals, plus a soft contact shadow, so the bottoms of cut-outs (the banana clump, the mandar trunk, the
 * ghat walls) sit IN the grass. Draw it right after the cut-out, in the same layer.
 */
export const PondBankGroundCover: React.FC<{ patches: PondCoverPatch[]; lifeF: number; shadows?: boolean }> = ({ patches, lifeF, shadows = true }) => (
  <g pointerEvents="none">
    {shadows &&
      patches.map((p, i) => <ellipse key={`sh${i}`} cx={p.x} cy={p.y + 2 * (p.s ?? 1)} rx={p.w * 0.55} ry={7 * (p.s ?? 1)} fill="#26301a" opacity={0.18} />)}
    {patches.map((p, i) => {
      const s = p.s ?? 1;
      const seed = p.seed ?? i * 11 + 5;
      const nT = Math.max(5, Math.round(p.w / (16 * s)));
      return (
        <g key={i}>
          {/* leaf litter and petals on the ground */}
          {Array.from({ length: Math.round(nT * 0.7) }, (_, k) => {
            const h1 = hash(seed + k * 4.3);
            const h2 = hash(seed * 2 + k * 6.7);
            const lx = p.x + (h1 - 0.5) * p.w * 1.1;
            const ly = p.y + (h2 - 0.3) * 8 * s;
            const pet = h2 > 0.55;
            return (
              <ellipse
                key={`l${k}`}
                cx={n1(lx)}
                cy={n1(ly)}
                rx={n1((pet ? 3.6 : 5.5) * s)}
                ry={n1((pet ? 1.6 : 2) * s)}
                fill={pet ? (h1 > 0.5 ? "#c8372d" : "#a92a24") : h1 > 0.6 ? "#9a6a38" : "#7f8a4a"}
                opacity={0.8}
                transform={`rotate(${n1(h1 * 180)} ${n1(lx)} ${n1(ly)})`}
              />
            );
          })}
          {/* ferns */}
          {Array.from({ length: p.ferns ?? 2 }, (_, k) => {
            const h = hash(seed * 3.3 + k * 9.1);
            return <Fern key={`f${k}`} x={p.x + (h - 0.5) * p.w * 0.9} y={p.y + 2 * s} s={s * (0.75 + h * 0.4)} lean={(h - 0.5) * 1.6} lifeF={lifeF} seed={seed + k * 13} />;
          })}
          {/* grass tufts, filled blades */}
          {Array.from({ length: nT }, (_, k) => {
            const h1 = hash(seed * 1.7 + k * 3.9);
            const bx = p.x + ((k + 0.5) / nT - 0.5) * p.w + (h1 - 0.5) * 10 * s;
            const by = p.y + (hash(k * 2.1 + seed) - 0.2) * 6 * s;
            return (
              <g key={`t${k}`}>
                {[0, 1, 2, 3].map((b) => {
                  const r1 = hash(seed + k * 13.1 + b * 5.3);
                  const r2 = hash(seed * 2.1 + k * 5.9 + b * 9.7);
                  const hgt = (10 + r1 * 20) * s;
                  const sway = Math.sin(lifeF * 0.05 + k + b) * 1.4 * s;
                  const lean = (r2 - 0.45) * hgt * 0.7 + sway;
                  const x0 = bx + (b - 1.5) * 2.6 * s;
                  const w = (1.6 + r1 * 1.4) * s;
                  return (
                    <path
                      key={b}
                      d={`M ${n1(x0 - w)} ${n1(by)} Q ${n1(x0 + lean * 0.35)} ${n1(by - hgt * 0.6)} ${n1(x0 + lean)} ${n1(by - hgt)} Q ${n1(x0 + lean * 0.35 + w * 0.6)} ${n1(by - hgt * 0.5)} ${n1(x0 + w)} ${n1(by)} Z`}
                      fill={["#4a6230", "#5f7b3a", "#7b9549", "#9fb062"][(b + k) % 4]}
                      opacity={0.92}
                    />
                  );
                })}
              </g>
            );
          })}
          {/* small weeds in flower */}
          {Array.from({ length: p.flowers ?? 3 }, (_, k) => {
            const h1 = hash(seed * 5.1 + k * 2.9);
            const fx = p.x + (h1 - 0.5) * p.w;
            const fy = p.y - (8 + h1 * 10) * s + Math.sin(lifeF * 0.05 + k) * 0.6 * s;
            const yellow = h1 > 0.5;
            return (
              <g key={`w${k}`}>
                <path d={`M ${n1(fx)} ${n1(p.y + 2 * s)} L ${n1(fx + 1)} ${n1(fy)}`} stroke="#5f7b3a" strokeWidth={n2(0.9 * s)} />
                {[0, 1, 2, 3, 4].map((q) => (
                  <ellipse key={q} cx={n1(fx + 1 + Math.cos(q * 1.257) * 2.2 * s)} cy={n1(fy + Math.sin(q * 1.257) * 1.4 * s)} rx={n1(1.7 * s)} ry={n1(1.1 * s)} fill={yellow ? "#f0c63e" : "#f8f4e8"} />
                ))}
                <circle cx={n1(fx + 1)} cy={n1(fy)} r={n1(0.9 * s)} fill={yellow ? "#b0702a" : "#e2b33a"} />
              </g>
            );
          })}
        </g>
      );
    })}
  </g>
);

/**
 * Butterflies near flowers on the bank: a flutter-and-glide loop around their flower, settling on it now and then with
 * wings slowly opening and closing. Kinds cycle: grass yellow, white, plain tiger. `s` = size (1: ~22 px span).
 */
export const PondButterflies: React.FC<{ flowers: PondPt[]; lifeF: number; s?: number }> = ({ flowers, lifeF, s = 1 }) => {
  const kinds = [
    { wing: "#f2d23e", edge: "#3a2a12" },
    { wing: "#f6f2e4", edge: "#5a4a3a" },
    { wing: "#e7913a", edge: "#2a1a10" },
  ];
  return (
    <g pointerEvents="none">
      {flowers.map((fl, i) => {
        const K = kinds[i % kinds.length];
        const per = 230 + i * 40;
        const t = (lifeF + i * 97) % per;
        const resting = t > per - 80;
        const ang = (lifeF + i * 97) * 0.022 + i;
        const r = 40 * s;
        const fly = { x: fl.x + Math.cos(ang) * r + Math.sin(ang * 2.3) * 12 * s, y: fl.y - 26 * s + Math.sin(ang * 1.7) * 16 * s - Math.abs(Math.sin(lifeF * 0.33 + i)) * 5 * s };
        const settle = resting ? sstep((t - (per - 80)) / 18) * (1 - sstep((t - (per - 14)) / 14)) : 0;
        const x = lerp(fly.x, fl.x, settle);
        const y = lerp(fly.y, fl.y - 2 * s, settle);
        const open = resting ? 0.55 + 0.45 * Math.sin(lifeF * 0.12 + i) : Math.abs(Math.sin(lifeF * 0.85 + i * 2));
        const face = Math.cos(ang) > 0 ? -1 : 1;
        return (
          <g key={i} transform={`translate(${n1(x)} ${n1(y)}) scale(${n2(s * face)} ${n2(s)})`}>
            {[-1, 1].map((sd) => (
              <g key={sd} transform={`scale(${n2(sd * (0.25 + 0.75 * open))} 1)`}>
                <path d="M 0 0 C 3 -9 11 -10 11 -4 C 11 -1 6 1 0 0 Z" fill={K.wing} stroke={K.edge} strokeWidth={0.55} />
                <path d="M 0 0 C 5 1 9 4 7 8 C 4 9 1 5 0 0 Z" fill={K.wing} stroke={K.edge} strokeWidth={0.55} />
                <circle cx={8} cy={-5} r={1} fill={K.edge} opacity={0.6} />
              </g>
            ))}
            <path d="M 0 -3 L 0 5" stroke="#2a1d12" strokeWidth={1.2} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** Fallen mandar petals floating and slowly turning on the water under the tree (`region` in that layer's px). */
export const PondFloatingPetals: React.FC<{ region: PondRect; lifeF: number; count?: number; s?: number; seed?: number }> = ({
  region,
  lifeF,
  count = 9,
  s = 1,
  seed = 7,
}) => (
  <g pointerEvents="none">
    {Array.from({ length: count }, (_, i) => {
      const h1 = hash(i * 3.3 + seed);
      const h2 = hash(i * 5.9 + seed * 2);
      const x = region.x + ((((h1 * region.w + lifeF * (0.04 + h2 * 0.05)) % region.w) + region.w) % region.w);
      const y = region.y + h2 * region.h + Math.sin(lifeF * 0.04 + i) * 0.6;
      const rot = h1 * 360 + lifeF * (h2 - 0.5) * 0.3;
      return (
        <g key={i} transform={`translate(${n1(x)} ${n1(y)}) rotate(${n1(rot)}) scale(1 0.45)`}>
          <ellipse cx={0} cy={2} rx={6.5 * s} ry={3.4 * s} fill="#2f4c45" opacity={0.18} />
          <ellipse cx={0} cy={0} rx={6 * s} ry={3 * s} fill={i % 3 ? "#c8372d" : "#d9584b"} stroke="#5e1b16" strokeWidth={0.4} />
        </g>
      );
    })}
  </g>
);
