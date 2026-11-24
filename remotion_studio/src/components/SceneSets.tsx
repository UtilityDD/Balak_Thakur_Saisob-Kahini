import React from "react";
import { useCurrentFrame } from "remotion";
import { RadialGlow } from "./Cinematic";

/** Scene 04: Traditional Bengali Kali Puja Mandap with hanging brass bell & dhak drummer that freezes on beat. */
export const KaliMandapSet: React.FC<{ frozen?: boolean }> = ({ frozen = false }) => {
  const rawFrame = useCurrentFrame();
  const f = frozen ? 78 : rawFrame;
  const drumSwing = frozen ? -28 : Math.sin(f * 0.42) * 26;
  const lampFlicker = 1 + Math.sin(rawFrame * 0.28) * 0.08;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {/* Mandap draped crimson pillars */}
      {[260, 1540].map((px, i) => (
        <g key={i} transform={`translate(${px}, 140)`}>
          <rect x="0" y="0" width="90" height="720" rx="8" fill="#5e2124" />
          <path d="M -12 0 L 102 0 L 92 46 L -2 46 Z" fill="#b8843b" />
          {/* Marigold garland wrap */}
          {Array.from({ length: 7 }).map((_, g) => (
            <ellipse key={g} cx="45" cy={90 + g * 88} rx="52" ry="14" fill={g % 2 === 0 ? "#ff9e2c" : "#ffd147"} opacity={0.85} />
          ))}
        </g>
      ))}
      {/* Overhead mandap festoon & hanging brass ghanta */}
      <path d="M 260 165 Q 960 250 1630 165" stroke="#ff9e2c" strokeWidth="18" fill="none" strokeDasharray="20 10" strokeLinecap="round" />
      <g transform="translate(650, 210)">
        <line x1="0" y1="0" x2="0" y2="95" stroke="#c9963b" strokeWidth="4" />
        <path d="M -28 95 L 28 95 L 40 148 L -40 148 Z" fill="#e6b84c" />
        <circle cx="0" cy="154" r="9" fill="#a87924" />
      </g>
      {/* Warm hanging oil lamp */}
      <g transform="translate(1280, 210)">
        <line x1="0" y1="0" x2="0" y2="110" stroke="#8a5a2b" strokeWidth="3" />
        <RadialGlow cx={0} cy={125} r={115 * lampFlicker} color="#ffbe55" opacity={0.42} />
        <path d="M -24 125 Q 0 145 24 125 Z" fill="#a65224" />
        <ellipse cx="0" cy={112} rx={6 * lampFlicker} ry={14 * lampFlicker} fill="#fff099" />
      </g>
      {/* Traditional Dhak Drummer silhouette (right side) who pauses drumsticks mid-air when frozen */}
      <g transform="translate(1310, 680)">
        <ellipse cx="0" cy="182" rx="68" ry="13" fill="#180a10" opacity={0.35} />
        <path d="M -38 35 Q -42 110 -46 178 L 46 178 Q 42 110 38 35 Z" fill="#e6dccd" />
        <circle cx="0" cy="-16" r="28" fill="#c98b63" />
        {/* Feathered Dhak drum */}
        <ellipse cx="-32" cy="86" rx="46" ry="26" fill="#7d3b22" transform="rotate(-12 -32 86)" />
        <ellipse cx="-72" cy="94" rx="12" ry="24" fill="#f5e6cc" transform="rotate(-12 -72 94)" />
        {/* Drumsticks — freeze mid-air on uludhwani */}
        <g transform={`translate(-10, 56) rotate(${drumSwing})`}>
          <line x1="0" y1="0" x2="-66" y2="-32" stroke="#d9b27c" strokeWidth="5" strokeLinecap="round" />
        </g>
        <g transform={`translate(22, 62) rotate(${-drumSwing * 0.85})`}>
          <line x1="0" y1="0" x2="-58" y2="-40" stroke="#d9b27c" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

/** Scenes 05 & 06: Cozy 1920s Bengali lamp-lit indoor room with arched doorway & kantha chowki. */
export const IndoorRoomSet: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const frame = useCurrentFrame();
  const flk = 1 + Math.sin(frame * 0.25) * 0.07;

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" opacity={opacity}>
      {/* Warm ochre-terracotta interior wall */}
      <rect x="0" y="0" width="1920" height="820" fill="#4f2a1d" />
      <rect x="0" y="790" width="1920" height="290" fill="#381d15" />
      {/* Wooden roof beams */}
      {[120, 480, 840, 1200, 1560].map((bx, i) => (
        <rect key={i} x={bx} y="0" width="38" height="150" fill="#2c1610" opacity={0.6} />
      ))}
      {/* Arched doorway on left (where Pagol appears in Scene 5) */}
      <path d="M 470 810 L 470 360 Q 620 230 770 360 L 770 810 Z" fill="#182236" />
      <path d="M 462 810 L 462 355 Q 620 218 778 355 L 778 810" stroke="#7d472e" strokeWidth="16" fill="none" />
      {/* Hanging brass oil lamp */}
      <g transform="translate(1060, 180)">
        <line x1="0" y1="-180" x2="0" y2="20" stroke="#8a5a2b" strokeWidth="3" />
        <RadialGlow cx={0} cy={35} r={220 * flk} color="#ffb957" opacity={0.34} />
        <path d="M -22 30 Q 0 50 22 30 Z" fill="#b86b28" />
        <ellipse cx="0" cy="18" rx={6 * flk} ry={13 * flk} fill="#fff2a6" />
      </g>
      {/* Low wooden chowki with kantha quilt */}
      <g transform="translate(780, 795)">
        <rect x="0" y="0" width="340" height="44" rx="8" fill="#703b22" />
        <rect x="14" y="-12" width="312" height="22" rx="10" fill="#e6cfa8" />
        <path d="M 24 -4 Q 170 6 316 -4" stroke="#b83b3b" strokeWidth="3" fill="none" strokeDasharray="8 6" />
      </g>
    </svg>
  );
};

/** Scene 07: Dawn courtyard steps scattered with marigold and red hibiscus petals. */
export const DawnFlowersSet: React.FC = () => {
  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080">
      {Array.from({ length: 28 }).map((_, i) => {
        const fx = 360 + ((i * 193) % 1200);
        const fy = 820 + ((i * 71) % 170);
        const isHibiscus = i % 3 === 0;
        return (
          <g key={i} transform={`translate(${fx}, ${fy}) rotate(${i * 37})`}>
            <ellipse cx="0" cy="0" rx={isHibiscus ? 11 : 9} ry={isHibiscus ? 7 : 6} fill={isHibiscus ? "#d93644" : "#ffa826"} opacity={0.9} />
            <circle cx="0" cy="0" r="2.5" fill="#fff3b0" />
          </g>
        );
      })}
    </svg>
  );
};
