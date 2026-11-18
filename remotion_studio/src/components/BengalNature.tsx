import React from "react";
import { useCurrentFrame } from "remotion";
import { LightingMood } from "../types/studio";
import { fbm1D, noise1D, rand } from "../lib/motion";
import { MOOD_LIGHT, mix } from "../lib/mood";
import { RadialGlow, useSvgId } from "./Cinematic";

const SKY_GRADIENTS: Record<LightingMood, [string, string, string]> = {
  bright_orange_flat: ["#ff7b29", "#ff9e3d", "#ffd26f"],
  golden_daytime: ["#3d93d2", "#9bd6f2", "#ffe8a3"],
  deep_indigo_warm_diyas: ["#070920", "#171640", "#3a234e"],
  sacred_midnight_glow: ["#0d0826", "#24154c", "#4f2c75"],
  warm_mandap_lamps: ["#1a0c12", "#401a1c", "#7a3b1e"],
  cool_slate_rain: ["#1a2633", "#33465a", "#5b7187"],
  warm_indoor_amber: ["#2b1810", "#59301a", "#a05a2a"],
  soft_golden_dawn: ["#2a2148", "#b85466", "#ffb36b"],
};

const NIGHT_MOODS: LightingMood[] = ["deep_indigo_warm_diyas", "sacred_midnight_glow", "warm_mandap_lamps"];

/* ------------------------------------------------------------------ */
/* Sky                                                                 */
/* ------------------------------------------------------------------ */

const Cloud: React.FC<{ x: number; y: number; s: number; light: string; shade: string; id: string }> = ({ x, y, s, light, shade, id }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx="0" cy="14" rx="190" ry="40" fill={shade} />
    <ellipse cx="-80" cy="0" rx="100" ry="44" fill={`url(#${id})`} />
    <ellipse cx="30" cy="-22" rx="120" ry="60" fill={`url(#${id})`} />
    <ellipse cx="120" cy="2" rx="90" ry="40" fill={`url(#${id})`} />
  </g>
);

export const BengalSky: React.FC<{ mood: LightingMood }> = ({ mood }) => {
  const frame = useCurrentFrame();
  const [top, mid, bot] = SKY_GRADIENTS[mood];
  const light = MOOD_LIGHT[mood];
  const isNight = NIGHT_MOODS.includes(mood);
  const skyId = useSvgId("sky");
  const cloudId = useSvgId("cloud");
  const isRain = mood === "cool_slate_rain";
  const cloudLight = isRain ? "#55687c" : mood === "soft_golden_dawn" ? "#ffd2b0" : mood === "warm_indoor_amber" ? "#ffcf9a" : "#ffffff";
  const cloudShade = isRain ? "#2c3a4a" : mood === "soft_golden_dawn" ? "#b0607a" : mix(cloudLight, mid, 0.45);

  // Rain storms get an occasional distant lightning flicker.
  const lightning = isRain ? Math.max(0, (noise1D(frame / 9, 77) - 0.86) * 7) : 0;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={bot} />
        </linearGradient>
        <linearGradient id={cloudId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cloudLight} />
          <stop offset="100%" stopColor={cloudShade} />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill={`url(#${skyId})`} />
      {lightning > 0 && <rect width="1920" height="1080" fill="#dfe9ff" opacity={Math.min(0.45, lightning)} />}

      {/* Sun / dawn disc with layered corona */}
      {(mood === "golden_daytime" || mood === "soft_golden_dawn" || mood === "warm_indoor_amber") && (() => {
        const cx = mood === "soft_golden_dawn" ? 960 : mood === "warm_indoor_amber" ? 1460 : 1480;
        const cy = mood === "soft_golden_dawn" ? 470 : mood === "warm_indoor_amber" ? 300 : 210;
        const r = mood === "soft_golden_dawn" ? 76 : 56;
        return (
          <g>
            <RadialGlow cx={cx} cy={cy} r={r * 6} color={light.key} opacity={0.55} />
            <RadialGlow cx={cx} cy={cy} r={r * 2.4} color="#fff6d8" opacity={0.7} />
            <circle cx={cx} cy={cy} r={r} fill="#fff8e0" />
          </g>
        );
      })()}

      {/* Night: moon with halo + twinkling stars + rare shooting star */}
      {isNight && (
        <g>
          {Array.from({ length: 90 }).map((_, i) => {
            const x = rand(i * 2.1) * 1920;
            const y = Math.pow(rand(i * 3.7 + 1), 1.6) * 520;
            const tw = 0.25 + 0.75 * noise1D(frame / (14 + (i % 7) * 3) + i * 4.2, 6);
            const r = 0.8 + rand(i * 5.3) * 2.2;
            return <circle key={i} cx={x} cy={y} r={r} fill="#fff6d6" opacity={tw * (0.45 + 0.55 * (1 - y / 520))} />;
          })}
          <RadialGlow cx={1560} cy={170} r={260} color="#cfd8ff" opacity={0.35} />
          {mood === "sacred_midnight_glow" ? (
            <circle cx={1560} cy={170} r={44} fill="#f6f1de" />
          ) : (
            <>
              <mask id={`${skyId}-moon`}>
                <rect width="1920" height="1080" fill="#ffffff" />
                <circle cx={1578} cy={160} r={40} fill="#000000" />
              </mask>
              <circle cx={1560} cy={170} r={44} fill="#f6f1de" mask={`url(#${skyId}-moon)`} />
            </>
          )}
          {(() => {
            const cycle = frame % 260;
            if (cycle > 26) return null;
            const t = cycle / 26;
            const sx = 300 + t * 520;
            const sy = 90 + t * 160;
            return (
              <line x1={sx} y1={sy} x2={sx - 90} y2={sy - 28} stroke="#fffbe8" strokeWidth={2.4} strokeLinecap="round" opacity={Math.sin(t * Math.PI) * 0.9} />
            );
          })()}
        </g>
      )}

      {/* Layered parallax clouds (far = small & slow) */}
      {!isNight && (
        <g opacity={isRain ? 0.95 : 0.85}>
          {Array.from({ length: isRain ? 9 : 6 }).map((_, i) => {
            const depth = 0.45 + (i % 3) * 0.3;
            const x = ((i * 470 + frame * 0.3 * depth) % 2500) - 300;
            const y = 90 + (i % 3) * 70 + (isRain ? -20 : 0);
            return <Cloud key={i} x={x} y={y} s={depth} light={cloudLight} shade={cloudShade} id={cloudId} />;
          })}
        </g>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Padma river                                                         */
/* ------------------------------------------------------------------ */

export const PadmaRiver: React.FC<{ mood: LightingMood; showSteamship?: boolean }> = ({ mood, showSteamship = true }) => {
  const frame = useCurrentFrame();
  const light = MOOD_LIGHT[mood];
  const isDawn = mood === "soft_golden_dawn";
  const waterTop = isDawn ? "#a0607a" : mood === "golden_daytime" ? "#5aa6c6" : "#22345a";
  const waterBot = isDawn ? "#4a3150" : mood === "golden_daytime" ? "#1f6688" : "#111b33";
  const waveLight = isDawn ? "#ffc48a" : mood === "golden_daytime" ? "#c8f0ff" : "#4a6290";
  const sunX = isDawn ? 960 : 1480;
  const id = useSvgId("water");

  const shipX = 320 + frame * 0.18 + fbm1D(frame / 120, 4) * 12;
  const shipBob = Math.sin(frame * 0.08) * 3 + fbm1D(frame / 30, 8) * 1.5;
  const shipRoll = Math.sin(frame * 0.06) * 0.8;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={waterTop} />
          <stop offset="100%" stopColor={waterBot} />
        </linearGradient>
      </defs>
      {/* Far bank with tree-line silhouette */}
      <path
        d={`M0 540 ${Array.from({ length: 33 })
          .map((_, i) => `L ${i * 60} ${522 - rand(i * 1.3) * 26 - (i % 4 === 0 ? 18 : 0)}`)
          .join(" ")} L 1920 540 L 1920 570 L 0 570 Z`}
        fill={isDawn ? "#3c2a42" : mood === "golden_daytime" ? "#3b6b4e" : "#1a2a2a"}
      />
      <rect x="0" y="555" width="1920" height="340" fill={`url(#${id})`} />

      {/* Sun reflection column on the water */}
      {(isDawn || mood === "golden_daytime") && (
        <g style={{ mixBlendMode: "screen" }}>
          {Array.from({ length: 16 }).map((_, i) => {
            const y = 566 + i * 18;
            const w = 30 + i * 9 + noise1D(frame / 8 + i * 2, 1) * 40;
            return <ellipse key={i} cx={sunX + fbm1D(frame / 20 + i, 2) * 14} cy={y} rx={w} ry={2.4} fill={light.key} opacity={0.55 - i * 0.025} />;
          })}
        </g>
      )}

      {/* Layered ripples: far ones finer & slower */}
      {Array.from({ length: 16 }).map((_, i) => {
        const y = 572 + i * 19 + i * i * 0.4;
        const depth = 0.4 + i / 16;
        const shift = Math.sin(frame * 0.04 * depth + i * 0.9) * 36 * depth;
        return (
          <path
            key={i}
            d={`M ${-80 + shift} ${y} Q ${480 + shift} ${y - 5 * depth} ${960 + shift} ${y} T ${1980 + shift} ${y}`}
            stroke={waveLight}
            strokeWidth={0.8 + depth * 2.2}
            strokeLinecap="round"
            fill="none"
            opacity={0.12 + depth * 0.22}
          />
        );
      })}

      {/* Specular glints */}
      {Array.from({ length: 26 }).map((_, i) => {
        const g = noise1D(frame / 6 + i * 13.1, 5);
        if (g < 0.72) return null;
        return <circle key={i} cx={rand(i * 9.1) * 1920} cy={580 + rand(i * 4.4) * 280} r={1.5 + (g - 0.72) * 9} fill="#ffffff" opacity={(g - 0.72) * 3} />;
      })}

      {/* Vintage Padma steamship with wake and smoke trail */}
      {showSteamship && (
        <g transform={`translate(${shipX}, ${540 + shipBob}) rotate(${shipRoll} 80 50)`}>
          <ellipse cx="80" cy="66" rx="110" ry="5" fill={waveLight} opacity={0.35} />
          <path d="M 0 38 L 165 38 L 145 62 L 18 62 Z" fill="#3a2b28" />
          <rect x="30" y="14" width="95" height="24" rx="4" fill="#f5eadc" />
          {[42, 62, 82, 102].map((wx) => (
            <rect key={wx} x={wx} y="20" width="9" height="8" rx="2" fill={NIGHT_MOODS.includes(mood) ? "#ffcf70" : "#6b8796"} />
          ))}
          <rect x="65" y="-12" width="14" height="26" fill="#2b2422" />
          <rect x="65" y="-12" width="14" height="5" fill="#a83a2a" />
          {Array.from({ length: 6 }).map((_, i) => {
            const age = ((frame + i * 14) % 84) / 84;
            return (
              <circle
                key={i}
                cx={72 - age * 120 + fbm1D(frame / 20 + i, 3) * 6}
                cy={-20 - age * 70}
                r={6 + age * 22}
                fill="#e8e4df"
                opacity={(1 - age) * 0.42}
              />
            );
          })}
        </g>
      )}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Courtyard, Baidik Bari veranda, flora, diyas                        */
/* ------------------------------------------------------------------ */

interface CourtyardPalette {
  ground: string;
  groundFar: string;
  wall: string;
  wallShade: string;
  roof: string;
  arch: string;
  trunk: string;
  frond: string;
  frondShade: string;
  windowGlow: string | null;
  wet: boolean;
}

const courtyardPalette = (mood: LightingMood): CourtyardPalette => {
  switch (mood) {
    case "deep_indigo_warm_diyas":
    case "sacred_midnight_glow":
    case "warm_mandap_lamps":
      return {
        ground: "#2b1d24", groundFar: "#3a2832", wall: "#4a3038", wallShade: "#2e1c24", roof: "#24171c", arch: "#160d14",
        trunk: "#1c1814", frond: "#173a2b", frondShade: "#0e241b", windowGlow: mood === "warm_mandap_lamps" ? "#ff9e3d" : "#ffb85c", wet: false,
      };
    case "cool_slate_rain":
      return {
        ground: "#4e4643", groundFar: "#5f5752", wall: "#8a7a70", wallShade: "#5d5048", roof: "#4b2d24", arch: "#2a201c",
        trunk: "#3a2c22", frond: "#2b5a42", frondShade: "#1b3b2c", windowGlow: "#ffc77a", wet: true,
      };
    case "warm_indoor_amber":
      return {
        ground: "#8a5236", groundFar: "#9c6040", wall: "#c98a5e", wallShade: "#8f5a3a", roof: "#6a2f1c", arch: "#3a1c12",
        trunk: "#4a3222", frond: "#4a6a3a", frondShade: "#2e4426", windowGlow: "#ffc06a", wet: false,
      };
    case "soft_golden_dawn":
      return {
        ground: "#a86a5a", groundFar: "#b87a68", wall: "#d0927c", wallShade: "#9a6458", roof: "#6a3428", arch: "#3e2028",
        trunk: "#4a3226", frond: "#3a6a4a", frondShade: "#244432", windowGlow: null, wet: false,
      };
    default:
      return {
        ground: "#b87a52", groundFar: "#c88a60", wall: "#dba077", wallShade: "#b07650", roof: "#87432a", arch: "#5c3324",
        trunk: "#5e432c", frond: "#2d7a47", frondShade: "#1d5530", windowGlow: null, wet: false,
      };
  }
};

/** Fronds bend with gusting wind; each frond lags its neighbour for overlapping action. */
const Palm: React.FC<{ x: number; y: number; h: number; pal: CourtyardPalette; seed: number; storm?: boolean }> = ({ x, y, h, pal, seed, storm }) => {
  const frame = useCurrentFrame();
  const gustAmp = storm ? 9 : 4.5;
  const trunkBend = fbm1D(frame / 70, seed) * (storm ? 3 : 1.5);
  return (
    <g transform={`translate(${x}, ${y}) rotate(${trunkBend})`}>
      <path d={`M -18 0 Q -8 ${-h * 0.52} 18 ${-h} L 34 ${-h + 4} Q 10 ${-h * 0.52} 8 0 Z`} fill={pal.trunk} />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M ${-14 + i * 0.6} ${-i * (h / 10)} q 14 -4 26 0`} stroke={mix(pal.trunk, "#000000", 0.25)} strokeWidth={2} fill="none" opacity={0.5} />
      ))}
      <g transform={`translate(26, ${-h + 4})`}>
        {[-160, -120, -75, -30, 15, 55, 100, 140].map((ang, i) => {
          const sway = fbm1D(frame / 38 - i * 0.12, seed + i) * gustAmp + Math.sin(frame * 0.05 - i * 0.4) * 2;
          const len = 170 + (i % 3) * 25;
          return (
            <g key={i} transform={`rotate(${ang + sway})`}>
              <path d={`M 0 0 Q ${len * 0.5} -46 ${len} ${10 + sway} Q ${len * 0.5} -6 0 8 Z`} fill={i % 2 ? pal.frond : pal.frondShade} />
              <path d={`M 4 3 Q ${len * 0.5} -22 ${len - 6} ${10 + sway}`} stroke={mix(pal.frond, "#ffffff", 0.15)} strokeWidth={1.4} fill="none" opacity={0.5} />
            </g>
          );
        })}
        <circle cx="0" cy="6" r="10" fill={mix(pal.trunk, "#8a6a3a", 0.4)} />
        <circle cx="-10" cy="10" r="8" fill={mix(pal.trunk, "#8a6a3a", 0.3)} />
      </g>
    </g>
  );
};

/** Banana plant with broad leaves that flutter. */
const BananaPlant: React.FC<{ x: number; y: number; pal: CourtyardPalette; seed: number }> = ({ x, y, pal, seed }) => {
  const frame = useCurrentFrame();
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path d="M -10 0 L -6 -150 L 6 -150 L 10 0 Z" fill={mix(pal.frond, pal.trunk, 0.4)} />
      {[-62, -24, 18, 58].map((ang, i) => {
        const flutter = fbm1D(frame / 26 + i * 0.7, seed + i) * 7;
        return (
          <path
            key={i}
            transform={`translate(0, -140) rotate(${ang + flutter})`}
            d="M 0 0 Q 40 -70 18 -180 Q -30 -90 0 0 Z"
            fill={i % 2 ? pal.frond : pal.frondShade}
          />
        );
      })}
    </g>
  );
};

/** Clay diya: noise-driven flame, layered halo, and a warm light pool on the ground. */
export const Diya: React.FC<{ x: number; y: number; seed: number; scale?: number }> = ({ x, y, seed, scale = 1 }) => {
  const frame = useCurrentFrame();
  const flick = 0.82 + 0.3 * noise1D(frame / 3 + seed * 5, seed);
  const lean = fbm1D(frame / 9, seed + 2) * 3.5;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <RadialGlow cx={0} cy={6} rx={120 * flick} ry={30 * flick} r={120} color="#ffae4a" opacity={0.45} />
      <RadialGlow cx={0} cy={-16} r={70 * flick} color="#ffb84d" opacity={0.5} />
      <path d="M -18 0 Q 0 16 18 0 Q 10 -4 0 -4 Q -10 -4 -18 0 Z" fill="#9c4a26" />
      <path d="M -18 0 Q 0 6 18 0" stroke="#c46a3a" strokeWidth={2} fill="none" />
      <g transform={`rotate(${lean} 0 -4)`}>
        <path d={`M 0 ${-4} C 7 ${-10} 5 ${-20 * flick} 0 ${-30 * flick} C -5 ${-20 * flick} -7 -10 0 -4 Z`} fill="#ffcf4d" />
        <path d={`M 0 -5 C 3 -9 2.4 ${-14 * flick} 0 ${-19 * flick} C -2.4 ${-14 * flick} -3 -9 0 -5 Z`} fill="#fff8de" />
      </g>
    </g>
  );
};

export const BengalCourtyardAndFlora: React.FC<{ mood: LightingMood; showDiyas?: boolean }> = ({ mood, showDiyas = false }) => {
  const frame = useCurrentFrame();
  const pal = courtyardPalette(mood);
  const light = MOOD_LIGHT[mood];
  const groundId = useSvgId("ground");
  const wallId = useSvgId("wall");
  const archGlowId = useSvgId("archglow");
  const storm = mood === "cool_slate_rain";

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pal.groundFar} />
          <stop offset="100%" stopColor={mix(pal.ground, "#000000", 0.25)} />
        </linearGradient>
        <linearGradient id={wallId} x1={light.keyDir > 0 ? "1" : "0"} y1="0" x2={light.keyDir > 0 ? "0" : "1"} y2="0.4">
          <stop offset="0%" stopColor={mix(pal.wall, light.key, light.isNight ? 0.08 : 0.18)} />
          <stop offset="100%" stopColor={pal.wallShade} />
        </linearGradient>
        <radialGradient id={archGlowId} cx="0.5" cy="0.75" r="0.8">
          <stop offset="0%" stopColor={pal.windowGlow ?? pal.arch} />
          <stop offset="100%" stopColor={pal.arch} />
        </radialGradient>
      </defs>

      {/* Ground */}
      <path d="M 0 740 Q 960 700 1920 740 L 1920 1080 L 0 1080 Z" fill={`url(#${groundId})`} />
      {/* Brick-edge path detail */}
      {Array.from({ length: 24 }).map((_, i) => (
        <rect key={i} x={i * 84 - 10} y={742 - Math.sin((i / 23) * Math.PI) * 26} width={70} height={6} rx={2} fill={mix(pal.ground, "#000000", 0.18)} opacity={0.6} />
      ))}

      {/* Baidik Bari veranda */}
      <g transform="translate(1120, 310)">
        <ellipse cx="340" cy="452" rx="420" ry="22" fill="#000000" opacity={0.18} />
        <rect x="0" y="90" width="680" height="360" rx="6" fill={`url(#${wallId})`} />
        {/* Plinth & cornice */}
        <rect x="-8" y="430" width="696" height="22" rx="3" fill={pal.wallShade} />
        <rect x="-6" y="92" width="692" height="14" fill={mix(pal.wallShade, "#000000", 0.15)} />
        <path d="M -30 95 L 340 5 L 710 95 Z" fill={pal.roof} />
        <path d="M -30 95 L 340 5 L 340 20 L -10 100 Z" fill={mix(pal.roof, "#000000", 0.25)} />
        {[80, 260, 440].map((ax, i) => {
          const flick = pal.windowGlow ? 0.85 + 0.15 * noise1D(frame / 5 + i * 3, 21) : 1;
          return (
            <g key={i}>
              <path d={`M ${ax} 450 L ${ax} 220 Q ${ax + 70} 150 ${ax + 140} 220 L ${ax + 140} 450 Z`} fill={pal.windowGlow ? `url(#${archGlowId})` : pal.arch} opacity={flick} />
              {/* Pillar relief */}
              <rect x={ax - 14} y={210} width={12} height={240} fill={mix(pal.wall, "#ffffff", 0.08)} opacity={0.5} />
            </g>
          );
        })}
        {pal.windowGlow && <RadialGlow cx={340} cy={420} rx={420} ry={90} r={420} color={pal.windowGlow} opacity={0.25} />}
      </g>

      {/* Tulsi mancha (sacred basil platform) */}
      <g transform="translate(470, 760)">
        <rect x="-34" y="-62" width="68" height="62" rx="4" fill={mix(pal.wall, pal.ground, 0.3)} />
        <rect x="-40" y="-70" width="80" height="12" rx="3" fill={pal.wallShade} />
        {Array.from({ length: 7 }).map((_, i) => (
          <ellipse key={i} cx={-18 + i * 6} cy={-84 - (i % 3) * 10} rx={8} ry={14} fill={pal.frond} transform={`rotate(${-30 + i * 10 + fbm1D(frame / 30 + i, 31) * 6} ${-18 + i * 6} -76)`} />
        ))}
      </g>

      <BananaPlant x={1880} y={770} pal={pal} seed={41} />
      <Palm x={180} y={770} h={460} pal={pal} seed={3} storm={storm} />
      <Palm x={60} y={800} h={360} pal={pal} seed={9} storm={storm} />

      {/* Wet ground: puddle reflections + raindrop rings */}
      {pal.wet && (
        <g>
          {[
            [700, 900, 210],
            [1300, 960, 260],
            [380, 1010, 160],
          ].map(([cx, cy, rx], i) => (
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.12} fill="#9fb6c9" opacity={0.28} />
              {Array.from({ length: 5 }).map((_, k) => {
                const age = ((frame + k * 9 + i * 5) % 40) / 40;
                const rx2 = (rand(k * 3 + i) - 0.5) * rx * 1.4;
                return <ellipse key={k} cx={cx + rx2} cy={cy} rx={4 + age * 26} ry={1 + age * 4} fill="none" stroke="#dbe9f4" strokeWidth={1.4} opacity={(1 - age) * 0.6} />;
              })}
            </g>
          ))}
        </g>
      )}

      {showDiyas && [340, 560, 820, 1080, 1320, 1580].map((dx, i) => <Diya key={i} x={dx} y={805 + (i % 2) * 28} seed={i + 1} />)}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/* Weather & particle VFX                                              */
/* ------------------------------------------------------------------ */

export const WeatherVFX: React.FC<{ type: "rain" | "sparkles" | "fireflies" | "petals" | "none" }> = ({ type }) => {
  const frame = useCurrentFrame();
  if (type === "none") return null;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {/* Three-depth rain: far = thin & slow, near = long, fast, soft */}
      {type === "rain" &&
        [
          { n: 90, speed: 30, len: 26, w: 1, op: 0.22, wind: -8 },
          { n: 60, speed: 44, len: 44, w: 1.8, op: 0.34, wind: -14 },
          { n: 22, speed: 64, len: 90, w: 3.2, op: 0.22, wind: -22 },
        ].map((L, li) =>
          Array.from({ length: L.n }).map((_, i) => {
            const x = ((rand(i * 7.7 + li) * 2200 + frame * -L.wind * 0.5) % 2200) - 140;
            const y = ((rand(i * 3.3 + li * 9) * 1300 + frame * L.speed) % 1300) - 120;
            return (
              <line key={`${li}-${i}`} x1={x} y1={y} x2={x + L.wind} y2={y + L.len} stroke="#c8def0" strokeWidth={L.w} opacity={L.op} strokeLinecap="round" />
            );
          })
        )}
      {type === "rain" &&
        Array.from({ length: 26 }).map((_, i) => {
          const age = ((frame + i * 5) % 14) / 14;
          const x = rand(i * 2.7 + Math.floor((frame + i * 5) / 14)) * 1920;
          const y = 820 + rand(i * 5.1) * 240;
          return <path key={`s${i}`} d={`M ${x - 8 * age} ${y} Q ${x} ${y - 14 * (1 - age)} ${x + 8 * age} ${y}`} stroke="#e2eef8" strokeWidth={1.5} fill="none" opacity={(1 - age) * 0.7} />;
        })}

      {/* Sparkles: four-point twinkling stars with soft halos */}
      {type === "sparkles" &&
        Array.from({ length: 30 }).map((_, i) => {
          const x = rand(i * 4.1) * 1920 + fbm1D(frame / 90 + i, 12) * 60;
          const y = ((rand(i * 2.9) * 1180 - frame * (0.3 + rand(i) * 0.5)) % 1180 + 1180) % 1180 - 50;
          const tw = Math.max(0, noise1D(frame / 10 + i * 3.3, 13) * 1.6 - 0.45);
          const s = (3 + rand(i * 6.6) * 5) * tw;
          return (
            <g key={i} transform={`translate(${x}, ${y}) rotate(${frame * 1.5 + i * 20})`} opacity={Math.min(1, tw)}>
              <circle r={s * 3.2} fill="#fff2a6" opacity={0.18} />
              <path d={`M 0 ${-s * 2.6} L ${s * 0.4} 0 L 0 ${s * 2.6} L ${-s * 0.4} 0 Z M ${-s * 2.6} 0 L 0 ${s * 0.4} L ${s * 2.6} 0 L 0 ${-s * 0.4} Z`} fill="#fffbe0" />
            </g>
          );
        })}

      {/* Fireflies wander on noise paths with pulsing bioluminescent glow */}
      {type === "fireflies" &&
        Array.from({ length: 30 }).map((_, i) => {
          const x = rand(i * 4.3) * 1920 + fbm1D(frame / 70 + i * 3, 14) * 140;
          const y = 300 + rand(i * 8.1) * 640 + fbm1D(frame / 60 + i * 5, 15) * 90;
          const pulse = Math.max(0, Math.sin(frame * 0.09 + i * 1.7)) ** 2;
          return (
            <g key={i} opacity={0.15 + 0.85 * pulse}>
              <circle cx={x} cy={y} r={16} fill="#d9ff70" opacity={0.16} />
              <circle cx={x} cy={y} r={7} fill="#e8ff9a" opacity={0.4} />
              <circle cx={x} cy={y} r={2.6} fill="#fbffe0" />
            </g>
          );
        })}

      {/* Petals tumble in 3D (scaleX flip) and flutter on gusts */}
      {type === "petals" &&
        Array.from({ length: 26 }).map((_, i) => {
          const gust = fbm1D(frame / 80, 16) * 2;
          const x = ((rand(i * 3.1) * 2100 + frame * (2.2 + gust) + fbm1D(frame / 30 + i, 17) * 40) % 2100) - 90;
          const y = ((rand(i * 6.2) * 1180 + frame * (2.2 + rand(i) * 1.6)) % 1180) - 50;
          const flip = Math.cos(frame * 0.12 + i);
          const near = i % 4 === 0;
          return (
            <g key={i} transform={`translate(${x}, ${y}) rotate(${frame * 2 + i * 35}) scale(${flip * (near ? 1.8 : 1)}, ${near ? 1.8 : 1})`} opacity={near ? 0.7 : 0.9}>
              <path d="M 0 -6 Q 9 0 0 6 Q -9 0 0 -6 Z" fill={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ff9b54" : "#ffd166"} />
            </g>
          );
        })}
    </svg>
  );
};
