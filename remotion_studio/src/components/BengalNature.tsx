import React from "react";
import { useCurrentFrame } from "remotion";
import { LightingMood } from "../types/studio";

const SKY_GRADIENTS: Record<LightingMood, [string, string, string]> = {
  bright_orange_flat: ["#ff6b1a", "#ff9e3d", "#ffe08a"],
  golden_daytime: ["#348ac7", "#87ceeb", "#ffe9a8"],
  deep_indigo_warm_diyas: ["#07091e", "#17153b", "#3c214a"],
  sacred_midnight_glow: ["#0e0826", "#23144a", "#522b7a"],
  warm_mandap_lamps: ["#1c0c14", "#451a1d", "#873e1c"],
  cool_slate_rain: ["#16222e", "#2d4054", "#4f677d"],
  warm_indoor_amber: ["#24120b", "#542a15", "#945225"],
  soft_golden_dawn: ["#281d45", "#c95b63", "#ffc073"],
};

export const BengalSky: React.FC<{ mood: LightingMood; freezeAtFrame?: number }> = ({
  mood,
  freezeAtFrame,
}) => {
  const rawFrame = useCurrentFrame();
  const frame = freezeAtFrame !== undefined && rawFrame > freezeAtFrame ? freezeAtFrame : rawFrame;
  const [top, mid, bot] = SKY_GRADIENTS[mood];
  const isNight =
    mood === "deep_indigo_warm_diyas" ||
    mood === "sacred_midnight_glow" ||
    mood === "warm_mandap_lamps";

  const sunX = mood === "soft_golden_dawn" ? 960 : 1480;
  const sunY = mood === "soft_golden_dawn" ? 455 : 210;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id={`sky-${mood}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={bot} />
        </linearGradient>
        <radialGradient id={`sun-halo-${mood}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#ffd27d" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ff9b42" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5f0ff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#8f7cc4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill={`url(#sky-${mood})`} />

      {/* Volumetric Sun / Dawn Rays */}
      {(mood === "golden_daytime" || mood === "soft_golden_dawn") && (
        <g>
          <circle
            cx={sunX}
            cy={sunY}
            r={mood === "soft_golden_dawn" ? 310 : 230}
            fill={`url(#sun-halo-${mood})`}
          />
          {Array.from({ length: 7 }).map((_, i) => {
            const ang = -42 + i * 14 + Math.sin(frame * 0.015 + i) * 1.5;
            return (
              <polygon
                key={i}
                points={`${sunX},${sunY} ${sunX - 45},${sunY + 620} ${sunX + 45},${sunY + 620}`}
                fill="#fff2be"
                opacity={0.045}
                transform={`rotate(${ang} ${sunX} ${sunY})`}
              />
            );
          })}
          <circle
            cx={sunX}
            cy={sunY}
            r={mood === "soft_golden_dawn" ? 72 : 52}
            fill="#fff7d6"
          />
        </g>
      )}

      {/* Drifting soft painterly Bengal clouds */}
      {!isNight && (
        <g opacity={mood === "cool_slate_rain" ? 0.65 : 0.78}>
          {[0, 1, 2, 3, 4].map((i) => {
            const x = ((i * 460 + frame * (0.35 + i * 0.08)) % 2300) - 220;
            const y = 110 + (i % 3) * 72;
            const cMain =
              mood === "cool_slate_rain"
                ? "#344454"
                : mood === "soft_golden_dawn"
                ? "#ffd4b8"
                : "#fff9ed";
            const cRim =
              mood === "cool_slate_rain"
                ? "#4a5f73"
                : mood === "soft_golden_dawn"
                ? "#fff0db"
                : "#ffffff";
            return (
              <g key={i} transform={`translate(${x}, ${y}) scale(${0.85 + (i % 2) * 0.28})`}>
                <ellipse cx="0" cy="10" rx="185" ry="44" fill={cMain} opacity={0.85} />
                <ellipse cx="95" cy="-14" rx="115" ry="38" fill={cRim} />
                <ellipse cx="-85" cy="4" rx="100" ry="32" fill={cMain} />
                <ellipse cx="10" cy="-22" rx="90" ry="34" fill={cRim} opacity={0.9} />
              </g>
            );
          })}
        </g>
      )}

      {/* Twinkling Kartik night stars — Kali Puja falls on Amavasya (new moon), so no moon is drawn */}
      {isNight && (
        <g>
          {Array.from({ length: 48 }).map((_, i) => {
            const x = (i * 197 + 65) % 1890;
            const y = (i * 89 + 30) % 440;
            const tw = 0.28 + 0.72 * Math.abs(Math.sin(frame * 0.055 + i * 1.3));
            const r = 1.4 + (i % 3) * 0.9;
            return (
              <g key={i} opacity={tw}>
                <circle cx={x} cy={y} r={r} fill="#fff7db" />
                {i % 7 === 0 && (
                  <path
                    d={`M ${x - 7} ${y} L ${x + 7} ${y} M ${x} ${y - 7} L ${x} ${y + 7}`}
                    stroke="#fff7db"
                    strokeWidth="1"
                    opacity={0.7}
                  />
                )}
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

export const PadmaRiver: React.FC<{
  mood: LightingMood;
  showSteamship?: boolean;
  showBoats?: boolean;
}> = ({ mood, showSteamship = true, showBoats = true }) => {
  const frame = useCurrentFrame();
  const isDawn = mood === "soft_golden_dawn";
  const waterTop = isDawn ? "#694c70" : mood === "golden_daytime" ? "#267499" : "#131f3b";
  const waterBot = isDawn ? "#b86b77" : mood === "golden_daytime" ? "#3b98bd" : "#1c2e52";
  const waveLight = isDawn ? "#ffc98c" : mood === "golden_daytime" ? "#9be3f5" : "#445f8c";

  const shipX = 280 + Math.sin(frame * 0.008) * 42;
  const shipBob = Math.sin(frame * 0.075) * 3.2;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id={`river-${mood}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={waterTop} />
          <stop offset="100%" stopColor={waterBot} />
        </linearGradient>
      </defs>

      {/* Distant Bengal riverbank, palm silhouettes & kaash grass horizon */}
      <path
        d="M0 532 Q 450 498 960 520 T 1920 512 L 1920 568 L 0 568 Z"
        fill={isDawn ? "#3b2640" : "#224a34"}
      />
      {[140, 310, 490, 740, 1180, 1460, 1740].map((px, idx) => (
        <g key={idx} transform={`translate(${px}, ${516 + (idx % 2) * 6}) scale(0.55)`} opacity={0.75}>
          <path d="M -3 0 Q 2 -45 6 -88 L 11 -87 Q 8 -45 4 0 Z" fill={isDawn ? "#2d1d33" : "#1a3827"} />
          {[-50, -10, 30, 140, 180].map((a, j) => (
            <path
              key={j}
              d="M 8 -86 Q 28 -96 46 -80 Q 28 -86 8 -82 Z"
              fill={isDawn ? "#2d1d33" : "#1a3827"}
              transform={`rotate(${a} 8 -86)`}
            />
          ))}
        </g>
      ))}

      {/* River surface */}
      <rect x="0" y="555" width="1920" height="330" fill={`url(#river-${mood})`} />

      {/* Sun/Dawn shimmer reflection path on water */}
      {(isDawn || mood === "golden_daytime") && (
        <g opacity={0.34}>
          {Array.from({ length: 10 }).map((_, i) => {
            const ry = 568 + i * 24;
            const rw = 65 + i * 16 + Math.sin(frame * 0.08 + i) * 14;
            const rx = (isDawn ? 960 : 1480) + Math.sin(frame * 0.05 + i * 1.4) * 12;
            return (
              <ellipse
                key={i}
                cx={rx}
                cy={ry}
                rx={rw}
                ry={4.5}
                fill={isDawn ? "#ffd494" : "#fff4bd"}
              />
            );
          })}
        </g>
      )}

      {/* Animated multi-frequency sine ripples */}
      {Array.from({ length: 14 }).map((_, i) => {
        const y = 576 + i * 20;
        const shift = Math.sin(frame * 0.045 + i * 0.9) * 38;
        return (
          <path
            key={i}
            d={`M ${-90 + shift} ${y} Q ${480 + shift} ${y - 6} ${960 + shift} ${y} T ${1990 + shift} ${y}`}
            stroke={waveLight}
            strokeWidth={1.8 + (i % 3) * 0.7}
            strokeLinecap="round"
            fill="none"
            opacity={0.28 + (i % 2) * 0.16}
          />
        );
      })}

      {/* Vintage 1920s Padma Steamship */}
      {showSteamship && (
        <g transform={`translate(${shipX}, ${536 + shipBob})`}>
          <path d="M 0 40 L 185 40 L 162 66 L 20 66 Z" fill="#3a2824" />
          <path d="M 10 46 L 174 46" stroke="#c97a49" strokeWidth="3" />
          <rect x="34" y="14" width="106" height="26" rx="4" fill="#f7ecdc" />
          {[46, 66, 86, 106, 122].map((wx, wi) => (
            <rect key={wi} x={wx} y="21" width="10" height="10" rx="2" fill="#ffd98c" opacity={0.85} />
          ))}
          <rect x="74" y="-14" width="15" height="28" fill="#2b211f" />
          <rect x="72" y="-14" width="19" height="5" fill="#a83228" />
          {[0, 1, 2].map((si) => {
            const age = (frame + si * 16) % 48;
            return (
              <circle
                key={si}
                cx={80 - age * 0.9}
                cy={-22 - age * 0.55}
                r={7 + age * 0.28}
                fill="#fffaf0"
                opacity={Math.max(0, 0.42 - age * 0.0088)}
              />
            );
          })}
        </g>
      )}

      {/* Traditional Bengali Country Nouka Boat */}
      {showBoats && (
        <g transform={`translate(${1460 - ((frame * 0.45) % 520)}, ${648 + Math.sin(frame * 0.09) * 3})`}>
          <path d="M -55 8 Q 0 28 55 8 Q 36 30 -36 30 Z" fill="#4f3222" />
          <path d="M -22 10 Q 0 -10 22 10 Z" fill="#d9b07e" />
          <circle cx="32" cy="-2" r="5" fill="#c78a64" />
          <path d="M 27 3 L 37 3 L 39 14 L 25 14 Z" fill="#f5efe6" />
        </g>
      )}
    </svg>
  );
};

export const BengalCourtyardAndFlora: React.FC<{
  mood: LightingMood;
  showDiyas?: boolean;
  showMandap?: boolean;
  showAlpona?: boolean;
  freezeAtFrame?: number;
}> = ({
  mood,
  showDiyas = false,
  showMandap = false,
  showAlpona = true,
  freezeAtFrame,
}) => {
  const rawFrame = useCurrentFrame();
  const frame = freezeAtFrame !== undefined && rawFrame > freezeAtFrame ? freezeAtFrame : rawFrame;
  const sway = Math.sin(frame * 0.04) * 4.8;
  const isNight =
    mood === "deep_indigo_warm_diyas" ||
    mood === "sacred_midnight_glow" ||
    mood === "warm_mandap_lamps" ||
    mood === "warm_indoor_amber";

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <radialGradient id="diya-pool" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc857" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff8c24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="courtyard-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isNight ? "#2e1c26" : "#c7865a"} />
          <stop offset="100%" stopColor={isNight ? "#1a1017" : "#9e623c"} />
        </linearGradient>
      </defs>

      {/* Ground terracotta courtyard */}
      <path d="M 0 740 Q 960 698 1920 740 L 1920 1080 L 0 1080 Z" fill="url(#courtyard-grad)" />

      {/* Traditional Bengali Alpona Lotus Motif on Courtyard Floor */}
      {showAlpona && (
        <g transform="translate(920, 885) scale(1.25, 0.36)" opacity={isNight ? 0.34 : 0.52}>
          <circle cx="0" cy="0" r="145" fill="none" stroke="#fff7e6" strokeWidth="4" strokeDasharray="12 10" />
          <circle cx="0" cy="0" r="105" fill="none" stroke="#fff7e6" strokeWidth="3" />
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse
              key={i}
              cx="0"
              cy="-68"
              rx="16"
              ry="34"
              fill="none"
              stroke="#fff7e6"
              strokeWidth="3"
              transform={`rotate(${i * 30})`}
            />
          ))}
          <circle cx="0" cy="0" r="24" fill="#fff7e6" opacity={0.5} />
        </g>
      )}

      {/* Baidik Bari traditional arched veranda */}
      <g transform="translate(1100, 295)">
        {/* Main terracotta brick wall */}
        <rect x="0" y="95" width="710" height="375" rx="6" fill={isNight ? "#3b242d" : "#d99b70"} />
        {/* Roof cornice & sloped Bengal chala */}
        <path d="M -36 100 L 355 0 L 746 100 Z" fill={isDawnOrNight(mood) ? "#26151c" : "#8a4229"} />
        <rect x="-12" y="92" width="734" height="16" rx="4" fill={isNight ? "#52323d" : "#bd7850"} />
        {/* Three graceful cusped arches */}
        {[85, 275, 465].map((ax, i) => (
          <g key={i}>
            <path
              d={`M ${ax} 470 L ${ax} 220 Q ${ax + 72} 145 ${ax + 144} 220 L ${ax + 144} 470 Z`}
              fill={isNight ? "#1c1018" : "#5c3324"}
            />
            {/* Warm glowing inner room lantern light */}
            {isNight && (
              <path
                d={`M ${ax + 16} 470 L ${ax + 16} 232 Q ${ax + 72} 170 ${ax + 128} 232 L ${ax + 128} 470 Z`}
                fill="#ffae42"
                opacity={i === 1 ? 0.24 : 0.14}
              />
            )}
          </g>
        ))}
        {/* Mango leaf toran garlands on arches */}
        {[85, 275, 465].map((ax, i) => (
          <path
            key={i}
            d={`M ${ax} 220 Q ${ax + 72} 252 ${ax + 144} 220`}
            stroke="#2f753d"
            strokeWidth="6"
            fill="none"
          />
        ))}
      </g>

      {/* Kali Puja Mandap (when showMandap is true) */}
      {showMandap && (
        <g transform="translate(460, 285)">
          <rect x="0" y="80" width="520" height="385" rx="8" fill="#2e171f" />
          <path d="M -25 85 L 260 -15 L 545 85 Z" fill="#5e2124" />
          {/* Banana tree pillars */}
          <rect x="28" y="85" width="24" height="380" fill="#2b6e3c" />
          <rect x="468" y="85" width="24" height="380" fill="#2b6e3c" />
          {/* Sacred warm mandap altar glow */}
          <ellipse cx="260" cy="310" rx="180" ry="150" fill="url(#diya-pool)" opacity={0.65} />
          {/* Hanging brass pradip lamps */}
          {[140, 260, 380].map((lx, i) => (
            <g key={i} transform={`translate(${lx}, 110)`}>
              <line x1="0" y1="-25" x2="0" y2="25" stroke="#c99e44" strokeWidth="3" />
              <path d="M -14 25 L 14 25 L 8 36 L -8 36 Z" fill="#e6b84c" />
              <ellipse
                cx="0"
                cy="18"
                rx={5 + Math.sin(frame * 0.3 + i) * 0.8}
                ry={10 + Math.sin(frame * 0.3 + i) * 1.5}
                fill="#ffe57f"
              />
            </g>
          ))}
        </g>
      )}

      {/* Lush Banana Grove (Right Edge) */}
      <g transform={`translate(1790, 745) rotate(${sway * 0.55})`}>
        {[-35, -10, 20].map((ang, i) => (
          <path
            key={i}
            d="M 0 0 Q -40 -160 -130 -240 Q -40 -195 14 -60 Z"
            fill={isNight ? "#163826" : "#32854b"}
            transform={`rotate(${ang})`}
          />
        ))}
      </g>

      {/* Swaying Coconut Palm (Left) */}
      <g transform="translate(170, 770)">
        <path
          d="M -18 0 Q -8 -245 18 -465 L 35 -460 Q 10 -245 8 0 Z"
          fill={isNight ? "#1c2420" : "#5e432c"}
        />
        <g transform={`translate(24, -460) rotate(${sway})`}>
          {[-65, -25, 18, 55, 130, 175].map((ang, i) => (
            <path
              key={i}
              d="M 0 0 Q 95 -48 195 14 Q 95 -10 0 8 Z"
              fill={isNight ? "#153829" : "#2d7a47"}
              transform={`rotate(${ang})`}
            />
          ))}
        </g>
      </g>

      {/* Flickering Clay Diyas with warm ground glow */}
      {showDiyas &&
        [300, 520, 760, 1020, 1280, 1540, 1720].map((dx, i) => {
          const flk = 1 + Math.sin(frame * 0.35 + i * 2.1) * 0.14;
          const dy = 800 + (i % 2) * 32;
          return (
            <g key={i} transform={`translate(${dx}, ${dy})`}>
              <ellipse cx="0" cy="4" rx={48 * flk} ry={18 * flk} fill="url(#diya-pool)" />
              <circle cx="0" cy="-14" r={30 * flk} fill="#ffb84d" opacity={0.22} />
              <path d="M -16 0 Q 0 14 16 0 Z" fill="#9c4a26" />
              <ellipse cx="0" cy="-11" rx={5 * flk} ry={11 * flk} fill="#ffe066" />
              <ellipse cx="0" cy="-9" rx={2.5} ry={5} fill="#ffffff" />
            </g>
          );
        })}
    </svg>
  );
};

function isDawnOrNight(mood: LightingMood): boolean {
  return (
    mood === "deep_indigo_warm_diyas" ||
    mood === "sacred_midnight_glow" ||
    mood === "warm_mandap_lamps" ||
    mood === "warm_indoor_amber" ||
    mood === "soft_golden_dawn"
  );
}

export const WeatherVFX: React.FC<{
  type: "rain" | "sparkles" | "fireflies" | "petals" | "incense" | "none";
  freezeAtFrame?: number;
}> = ({ type, freezeAtFrame }) => {
  const rawFrame = useCurrentFrame();
  const frame = freezeAtFrame !== undefined && rawFrame > freezeAtFrame ? freezeAtFrame : rawFrame;
  if (type === "none") return null;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {type === "rain" && (
        <g>
          {/* 3-layer diagonal monsoon rain */}
          {Array.from({ length: 85 }).map((_, i) => {
            const layer = i % 3;
            const speed = 28 + layer * 14;
            const x = ((i * 113 + frame * (14 + layer * 4)) % 2100) - 100;
            const y = ((i * 79 + frame * speed) % 1200) - 100;
            return (
              <line
                key={i}
                x1={x}
                y1={y}
                x2={x - 14 - layer * 4}
                y2={y + 38 + layer * 14}
                stroke="#c2e0f5"
                strokeWidth={1.2 + layer * 0.8}
                opacity={0.22 + layer * 0.14}
                strokeLinecap="round"
              />
            );
          })}
          {/* Ground rain splashes */}
          {Array.from({ length: 14 }).map((_, i) => {
            const age = (frame + i * 7) % 16;
            const sx = 180 + ((i * 137) % 1560);
            const sy = 790 + ((i * 53) % 210);
            return (
              <ellipse
                key={i}
                cx={sx}
                cy={sy}
                rx={4 + age * 1.4}
                ry={1.5 + age * 0.45}
                fill="none"
                stroke="#cfe8fa"
                strokeWidth="1.4"
                opacity={Math.max(0, 0.48 - age * 0.03)}
              />
            );
          })}
        </g>
      )}

      {(type === "sparkles" || type === "fireflies") &&
        Array.from({ length: 34 }).map((_, i) => {
          const x = (i * 137 + Math.sin(frame * 0.038 + i) * 48) % 1920;
          const y = (i * 97 + Math.cos(frame * 0.032 + i) * 36) % 1080;
          const pulse = 0.2 + 0.8 * Math.abs(Math.sin(frame * 0.085 + i * 1.1));
          const r = type === "sparkles" ? 2.8 + (i % 4) : 3.5 + (i % 3);
          return (
            <g key={i} opacity={pulse}>
              <circle
                cx={x}
                cy={y}
                r={r * 2.8}
                fill={type === "sparkles" ? "#ffe985" : "#d9ff70"}
                opacity={0.22}
              />
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={type === "sparkles" ? "#fff9d6" : "#eeff99"}
              />
            </g>
          );
        })}

      {type === "petals" &&
        Array.from({ length: 26 }).map((_, i) => {
          const x = ((i * 173 + frame * 2.4 + Math.sin(frame * 0.05 + i) * 32) % 2000) - 40;
          const y = ((i * 109 + frame * 3.0) % 1140) - 40;
          const isHibiscus = i % 3 === 0;
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx={isHibiscus ? 10 : 7}
              ry={isHibiscus ? 5 : 3.5}
              fill={isHibiscus ? "#e63946" : i % 2 === 0 ? "#fff9eb" : "#ff9b54"}
              opacity={0.85}
              transform={`rotate(${frame * 2.2 + i * 35} ${x} ${y})`}
            />
          );
        })}

      {type === "incense" &&
        [0, 1, 2].map((i) => {
          const base = 620 + i * 180;
          const drift = Math.sin(frame * 0.04 + i * 2) * 26;
          return (
            <path
              key={i}
              d={`M ${base} 740 Q ${base + drift} 580 ${base - drift} 420 T ${base + drift * 0.6} 180`}
              stroke="#e8dff5"
              strokeWidth={10 + i * 3}
              strokeLinecap="round"
              fill="none"
              opacity={0.14}
            />
          );
        })}
    </svg>
  );
};
