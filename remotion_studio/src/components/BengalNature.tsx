import React from "react";
import { useCurrentFrame } from "remotion";
import { LightingMood } from "../types/studio";

const SKY_GRADIENTS: Record<LightingMood, [string, string, string]> = {
  bright_orange_flat: ["#ff7b29", "#ff9e3d", "#ffd26f"],
  golden_daytime: ["#4aa3df", "#9bd6f2", "#ffe8a3"],
  deep_indigo_warm_diyas: ["#0b0d26", "#1a1842", "#3a234e"],
  sacred_midnight_glow: ["#120c2e", "#261650", "#4f2c75"],
  warm_mandap_lamps: ["#221118", "#471e1e", "#7a3b1e"],
  cool_slate_rain: ["#1e2b38", "#35495e", "#566e85"],
  warm_indoor_amber: ["#2b1810", "#59301a", "#8a4d24"],
  soft_golden_dawn: ["#2e2348", "#c25967", "#ffb36b"],
};

export const BengalSky: React.FC<{ mood: LightingMood }> = ({ mood }) => {
  const frame = useCurrentFrame();
  const [top, mid, bot] = SKY_GRADIENTS[mood];
  const isNight =
    mood === "deep_indigo_warm_diyas" ||
    mood === "sacred_midnight_glow" ||
    mood === "warm_mandap_lamps";

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id={`sky-${mood}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={bot} />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill={`url(#sky-${mood})`} />

      {/* Drifting soft Bengal clouds */}
      {!isNight && (
        <g opacity={mood === "cool_slate_rain" ? 0.55 : 0.72}>
          {[0, 1, 2, 3].map((i) => {
            const x = ((i * 540 + frame * (0.4 + i * 0.1)) % 2200) - 200;
            const y = 130 + (i % 2) * 85;
            return (
              <g key={i} transform={`translate(${x}, ${y})`}>
                <ellipse cx="0" cy="0" rx="170" ry="48" fill={mood === "cool_slate_rain" ? "#3b4c5e" : "#fff8eb"} />
                <ellipse cx="95" cy="-16" rx="110" ry="38" fill={mood === "cool_slate_rain" ? "#465a6e" : "#ffffff"} />
                <ellipse cx="-85" cy="8" rx="95" ry="32" fill={mood === "cool_slate_rain" ? "#334252" : "#fff2db"} />
              </g>
            );
          })}
        </g>
      )}

      {/* Twinkling Kartik night stars */}
      {isNight && (
        <g>
          {Array.from({ length: 34 }).map((_, i) => {
            const x = (i * 197 + 80) % 1880;
            const y = (i * 89 + 40) % 420;
            const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.06 + i * 1.3));
            return <circle key={i} cx={x} cy={y} r={1.6 + (i % 3)} fill="#fff6d6" opacity={tw} />;
          })}
        </g>
      )}

      {/* Dawn / Golden Sun */}
      {(mood === "golden_daytime" || mood === "soft_golden_dawn") && (
        <g>
          <circle
            cx={mood === "soft_golden_dawn" ? 960 : 1480}
            cy={mood === "soft_golden_dawn" ? 470 : 210}
            r={mood === "soft_golden_dawn" ? 130 : 95}
            fill="#ffe49e"
            opacity={0.32}
          />
          <circle
            cx={mood === "soft_golden_dawn" ? 960 : 1480}
            cy={mood === "soft_golden_dawn" ? 470 : 210}
            r={mood === "soft_golden_dawn" ? 72 : 55}
            fill="#fff5cc"
          />
        </g>
      )}
    </svg>
  );
};

export const PadmaRiver: React.FC<{
  mood: LightingMood;
  showSteamship?: boolean;
}> = ({ mood, showSteamship = true }) => {
  const frame = useCurrentFrame();
  const isDawn = mood === "soft_golden_dawn";
  const waterBase = isDawn ? "#7a5876" : mood === "golden_daytime" ? "#2e82a8" : "#172542";
  const waveLight = isDawn ? "#ffb978" : mood === "golden_daytime" ? "#7cd1eb" : "#3a537d";

  const shipX = 320 + Math.sin(frame * 0.01) * 35;
  const shipBob = Math.sin(frame * 0.08) * 3.5;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {/* Distant Bengal riverbank & palm horizon */}
      <path
        d="M0 530 Q 450 495 960 520 T 1920 510 L 1920 570 L 0 570 Z"
        fill={isDawn ? "#3c2a42" : "#265239"}
      />
      {/* River surface */}
      <rect x="0" y="555" width="1920" height="320" fill={waterBase} />

      {/* Animated sine ripples */}
      {Array.from({ length: 14 }).map((_, i) => {
        const y = 575 + i * 20;
        const shift = Math.sin(frame * 0.05 + i * 0.9) * 36;
        return (
          <path
            key={i}
            d={`M ${-80 + shift} ${y} Q ${480 + shift} ${y - 6} ${960 + shift} ${y} T ${1980 + shift} ${y}`}
            stroke={waveLight}
            strokeWidth={2 + (i % 3)}
            strokeLinecap="round"
            fill="none"
            opacity={0.35 + (i % 2) * 0.2}
          />
        );
      })}

      {/* Vintage Padma Steamship */}
      {showSteamship && (
        <g transform={`translate(${shipX}, ${540 + shipBob})`}>
          <path d="M 0 38 L 165 38 L 145 62 L 18 62 Z" fill="#3a2b28" />
          <rect x="30" y="14" width="95" height="24" rx="4" fill="#f5eadc" />
          <rect x="65" y="-12" width="14" height="26" fill="#2b2422" />
          <circle cx={72 - (frame % 40) * 0.8} cy={-22 - (frame % 40) * 0.45} r={8 + (frame % 40) * 0.25} fill="#ffffff" opacity={Math.max(0, 0.45 - (frame % 40) * 0.01)} />
        </g>
      )}
    </svg>
  );
};

export const BengalCourtyardAndFlora: React.FC<{
  mood: LightingMood;
  showDiyas?: boolean;
}> = ({ mood, showDiyas = false }) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame * 0.04) * 4.5;
  const isNight =
    mood === "deep_indigo_warm_diyas" ||
    mood === "sacred_midnight_glow" ||
    mood === "warm_mandap_lamps";

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {/* Ground terracotta courtyard */}
      <path
        d="M 0 740 Q 960 700 1920 740 L 1920 1080 L 0 1080 Z"
        fill={isNight ? "#2b1d24" : "#b87a52"}
      />

      {/* Baidik Bari traditional arched veranda */}
      <g transform="translate(1120, 310)">
        <rect x="0" y="90" width="680" height="360" rx="6" fill={isNight ? "#3d2830" : "#d99d73"} />
        <path d="M -30 95 L 340 5 L 710 95 Z" fill={isNight ? "#24171c" : "#87432a"} />
        {[80, 260, 440].map((ax, i) => (
          <path
            key={i}
            d={`M ${ax} 450 L ${ax} 220 Q ${ax + 70} 150 ${ax + 140} 220 L ${ax + 140} 450 Z`}
            fill={isNight ? "#1a1118" : "#5c3324"}
          />
        ))}
      </g>

      {/* Swaying Coconut Palm (Left) */}
      <g transform="translate(180, 770)">
        <path d="M -18 0 Q -8 -240 18 -460 L 34 -456 Q 10 -240 8 0 Z" fill={isNight ? "#1c2420" : "#5e432c"} />
        <g transform={`translate(24, -455) rotate(${sway})`}>
          {[-65, -25, 18, 55, 130, 175].map((ang, i) => (
            <path
              key={i}
              d="M 0 0 Q 95 -45 190 12 Q 95 -10 0 8 Z"
              fill={isNight ? "#153829" : "#2d7a47"}
              transform={`rotate(${ang})`}
            />
          ))}
        </g>
      </g>

      {/* Flickering Clay Diyas */}
      {showDiyas &&
        [340, 560, 820, 1080, 1320, 1580].map((dx, i) => {
          const flk = 1 + Math.sin(frame * 0.35 + i * 2.1) * 0.14;
          return (
            <g key={i} transform={`translate(${dx}, ${805 + (i % 2) * 28})`}>
              <circle cx="0" cy="-14" r={34 * flk} fill="#ffb84d" opacity={0.22} />
              <path d="M -16 0 Q 0 14 16 0 Z" fill="#9c4a26" />
              <ellipse cx="0" cy="-10" rx={5 * flk} ry={11 * flk} fill="#ffe066" />
            </g>
          );
        })}
    </svg>
  );
};

export const WeatherVFX: React.FC<{
  type: "rain" | "sparkles" | "fireflies" | "petals" | "none";
}> = ({ type }) => {
  const frame = useCurrentFrame();
  if (type === "none") return null;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {type === "rain" &&
        Array.from({ length: 65 }).map((_, i) => {
          const x = ((i * 113 + frame * 18) % 2100) - 100;
          const y = ((i * 79 + frame * 42) % 1200) - 100;
          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={x - 16}
              y2={y + 44}
              stroke="#b8d8f0"
              strokeWidth={1.6 + (i % 2)}
              opacity={0.35 + (i % 3) * 0.12}
              strokeLinecap="round"
            />
          );
        })}

      {(type === "sparkles" || type === "fireflies") &&
        Array.from({ length: 28 }).map((_, i) => {
          const x = (i * 137 + Math.sin(frame * 0.04 + i) * 45) % 1920;
          const y = (i * 97 + Math.cos(frame * 0.035 + i) * 35) % 1080;
          const pulse = 0.25 + 0.75 * Math.abs(Math.sin(frame * 0.09 + i * 1.1));
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={type === "sparkles" ? 3 + (i % 4) : 4 + (i % 3)}
              fill={type === "sparkles" ? "#fff2a6" : "#d9ff70"}
              opacity={pulse}
            />
          );
        })}

      {type === "petals" &&
        Array.from({ length: 22 }).map((_, i) => {
          const x = ((i * 173 + frame * 2.5 + Math.sin(frame * 0.05 + i) * 28) % 2000) - 40;
          const y = ((i * 109 + frame * 3.2) % 1140) - 40;
          return (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx={8}
              ry={4}
              fill={i % 2 === 0 ? "#ffffff" : "#ff9b54"}
              opacity={0.85}
              transform={`rotate(${frame * 2 + i * 35} ${x} ${y})`}
            />
          );
        })}
    </svg>
  );
};
