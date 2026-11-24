import React from "react";
import { clamp, hash, noise1, TAU } from "../core/anim";
import { BN_FONT } from "../fonts";

/**
 * Golden-daytime sets for Episode 1 · Scene 01 (Medinimondal village introduction).
 * Storybook East-Bengal look: big skies, paddy, palms, thatched huts, the mighty Padma,
 * a riverside steamer-station, a bazaar, the tol and the maktab, and the great Baidik Bari.
 */

/* ------------------------------------------------------------------ */
/* Sky                                                                 */
/* ------------------------------------------------------------------ */

export const DaySky: React.FC<{ f: number; sunX?: number; sunY?: number }> = ({ f, sunX = 1480, sunY = 230 }) => (
  <g>
    <defs>
      <linearGradient id="s01-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7fb6d8" />
        <stop offset="55%" stopColor="#cfe0d8" />
        <stop offset="100%" stopColor="#ffe2a8" />
      </linearGradient>
      <radialGradient id="s01-sun">
        <stop offset="0%" stopColor="#fffbe8" />
        <stop offset="25%" stopColor="#fff0b8" stopOpacity={0.9} />
        <stop offset="60%" stopColor="#ffd98a" stopOpacity={0.25} />
        <stop offset="100%" stopColor="#ffd98a" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-1200} y={-900} width={4400} height={1900} fill="url(#s01-sky)" />
    <circle cx={sunX} cy={sunY} r={300} fill="url(#s01-sun)" />
    <circle cx={sunX} cy={sunY} r={52} fill="#fffaf0" />
    {/* clouds drift */}
    {Array.from({ length: 9 }, (_, i) => {
      const cx = ((-600 + i * 420 + f * (0.25 + hash(i) * 0.3)) % 3600) - 600;
      const cy = -120 + hash(i * 3) * 330;
      const s = 0.7 + hash(i * 5) * 0.9;
      return (
        <g key={i} transform={`translate(${cx}, ${cy}) scale(${s})`} opacity={0.85}>
          <ellipse cx={0} cy={0} rx={120} ry={34} fill="#fffaf0" />
          <ellipse cx={-50} cy={-18} rx={60} ry={34} fill="#fffaf0" />
          <ellipse cx={40} cy={-26} rx={72} ry={42} fill="#ffffff" />
          <ellipse cx={0} cy={14} rx={130} ry={16} fill="#e9dccb" opacity={0.6} />
        </g>
      );
    })}
    <Birds f={f} x={600} y={220} n={7} />
  </g>
);

/** A loose flock gliding across, wings flapping out of phase. */
export const Birds: React.FC<{ f: number; x: number; y: number; n?: number; s?: number }> = ({ f, x, y, n = 6, s = 1 }) => (
  <g transform={`translate(${x + f * 1.2}, ${y}) scale(${s})`}>
    {Array.from({ length: n }, (_, i) => {
      const bx = i * 46 + hash(i) * 30;
      const by = Math.abs(i - n / 2) * 18 + Math.sin(f * 0.05 + i) * 6;
      const w = Math.sin(f * 0.45 + i * 1.3) * 7;
      return <path key={i} d={`M ${bx - 13} ${by + w} Q ${bx - 6} ${by - 4} ${bx} ${by} Q ${bx + 6} ${by - 4} ${bx + 13} ${by + w}`} stroke="#3a3440" strokeWidth={2.4} fill="none" strokeLinecap="round" />;
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Village pieces                                                      */
/* ------------------------------------------------------------------ */

export const Palm: React.FC<{ x: number; y: number; s?: number; f: number; col?: string; seed?: number }> = ({ x, y, s = 1, f, col = "#3f6a3a", seed = 0 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M -7 0 Q 6 -160 22 -320 L 31 -318 Q 16 -160 8 0 Z" fill="#7a5a3a" />
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <line key={k} x1={-4 + k * 3} y1={-k * 52} x2={9 + k * 3} y2={-k * 52 - 4} stroke="#5a4028" strokeWidth={2} />
    ))}
    {[-78, -42, -8, 26, 62, 150, 200].map((a, j) => (
      <path
        key={j}
        d="M 26 -318 Q 90 -352 160 -296 Q 92 -330 26 -310 Z"
        fill={j % 2 ? col : "#4f7d44"}
        transform={`rotate(${a + Math.sin(f * 0.04 + j + seed) * 2.5} 26 -318)`}
      />
    ))}
  </g>
);

export const Banana: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <rect x={-6} y={-120} width={12} height={120} fill="#8a9a52" />
    {[-60, -20, 25, 65].map((a, j) => (
      <path key={j} d="M 0 -118 Q 60 -170 110 -120 Q 55 -140 0 -110 Z" fill={j % 2 ? "#6a9a48" : "#7fae52"} transform={`rotate(${a + Math.sin(f * 0.05 + j) * 3} 0 -118)`} />
    ))}
  </g>
);

export const DayHut: React.FC<{ x: number; y: number; s?: number; f: number; smoke?: boolean; seed?: number }> = ({ x, y, s = 1, f, smoke = false, seed = 0 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <rect x={-80} y={-90} width={160} height={90} fill="#c99a62" />
    <rect x={-80} y={-90} width={160} height={90} fill="#8a5a2a" opacity={0.15} />
    <rect x={-22} y={-62} width={40} height={62} fill="#5a3a1e" />
    <rect x={40} y={-60} width={24} height={22} fill="#6a4426" />
    <path d="M -112 -84 Q 0 -190 112 -84 Q 0 -118 -112 -84 Z" fill="#c8a25a" />
    <path d="M -112 -84 Q 0 -190 112 -84" stroke="#a07a3a" strokeWidth={3} fill="none" />
    {Array.from({ length: 9 }, (_, i) => (
      <line key={i} x1={-90 + i * 22} y1={-92} x2={-60 + i * 15} y2={-150 + Math.abs(i - 4) * 9} stroke="#a8823e" strokeWidth={1.4} opacity={0.6} />
    ))}
    <rect x={-90} y={-4} width={180} height={8} rx={3} fill="#a87a4a" />
    {smoke &&
      [0, 1, 2].map((k) => {
        const t = ((f + k * 28 + seed * 13) % 84) / 84;
        return <circle key={k} cx={50 + Math.sin(t * 5 + k) * 12 + t * 20} cy={-150 - t * 160} r={10 + t * 26} fill="#f4efe8" opacity={0.45 * (1 - t)} />;
      })}
  </g>
);

/** Far horizon + paddy + hamlets, golden day. */
export const VillageFields: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <path d="M -900 560 Q -400 520 0 548 T 960 536 T 1920 548 T 2900 540 L 2900 640 L -900 640 Z" fill="#7a9c78" />
    {Array.from({ length: 40 }, (_, i) => {
      const x = -880 + i * 95 + hash(i) * 40;
      const r = 26 + hash(i * 3) * 30;
      return <circle key={i} cx={x} cy={560 - r * 0.4} r={r} fill={i % 3 ? "#6a8e66" : "#5e8460"} />;
    })}
    {/* paddy bands */}
    {Array.from({ length: 7 }, (_, r) => (
      <path
        key={r}
        d={`M -900 ${600 + r * 36} Q 960 ${590 + r * 36 + Math.sin(r) * 10} 2900 ${600 + r * 36} L 2900 ${640 + r * 40} L -900 ${640 + r * 40} Z`}
        fill={r % 2 ? "#a8c45a" : "#c8cf6a"}
      />
    ))}
    {/* wind over the paddy */}
    {Array.from({ length: 30 }, (_, i) => {
      const x = ((i * 137 + f * 3) % 3600) - 900;
      return <path key={i} d={`M ${x} ${640 + (i % 6) * 34} q 30 -6 60 0`} stroke="#e8ec9a" strokeWidth={2} fill="none" opacity={0.5} />;
    })}
    {[-520, -160, 380, 1180, 1620, 2240].map((x, i) => (
      <DayHut key={x} x={x} y={660 + (i % 2) * 10} s={0.55} f={f} smoke={i % 2 === 0} seed={i} />
    ))}
    {[-640, -300, 140, 700, 980, 1420, 1900, 2380].map((x, i) => (
      <Palm key={x} x={x} y={670} s={0.62 + hash(i) * 0.2} f={f} seed={i} />
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* The Padma                                                           */
/* ------------------------------------------------------------------ */

const Boat: React.FC<{ x: number; y: number; s?: number; f: number; sail?: string; seed?: number }> = ({ x, y, s = 1, f, sail = "#b8442a", seed = 0 }) => {
  const bob = Math.sin(f * 0.07 + seed) * 4;
  const roll = Math.sin(f * 0.05 + seed * 2) * 3;
  return (
    <g transform={`translate(${x}, ${y + bob}) rotate(${roll}) scale(${s})`}>
      <path d="M -120 0 Q 0 40 120 0 L 100 -14 Q 0 12 -100 -14 Z" fill="#5a3a22" />
      <path d="M -100 -14 Q 0 8 100 -14" stroke="#8a6040" strokeWidth={3} fill="none" />
      <rect x={-30} y={-46} width={60} height={30} rx={14} fill="#a8803e" />
      <line x1={10} y1={-12} x2={10} y2={-210} stroke="#4a3018" strokeWidth={5} />
      <path d={`M 14 -205 Q ${70 + Math.sin(f * 0.06 + seed) * 6} -130 18 -40 L 14 -40 Z`} fill={sail} />
      <path d={`M 14 -205 Q ${70 + Math.sin(f * 0.06 + seed) * 6} -130 18 -40`} stroke="#5a1e10" strokeWidth={2} fill="none" />
      {[0, 1, 2].map((k) => (
        <line key={k} x1={16} y1={-170 + k * 45} x2={44 + Math.sin(f * 0.06 + seed) * 4} y2={-168 + k * 45} stroke="#7a2a16" strokeWidth={1.5} />
      ))}
    </g>
  );
};

/** Wide, powerful Padma. `rough` 0..1 raises the current, whitecaps and bank erosion (প্রলয়ঙ্করী). */
export const PadmaDay: React.FC<{ f: number; rough?: number; y0?: number }> = ({ f, rough = 0.4, y0 = 600 }) => (
  <g>
    <defs>
      <linearGradient id="s01-river" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9fbfc6" />
        <stop offset="40%" stopColor="#6f9aa6" />
        <stop offset="100%" stopColor="#4a7482" />
      </linearGradient>
    </defs>
    {/* far bank */}
    <path d={`M -900 ${y0 - 10} Q 960 ${y0 - 26} 2900 ${y0 - 8} L 2900 ${y0 + 6} L -900 ${y0 + 6} Z`} fill="#7c9a74" />
    <rect x={-900} y={y0} width={3800} height={700} fill="url(#s01-river)" />
    {/* sun glitter */}
    {Array.from({ length: 40 }, (_, i) => {
      const x = 1300 + (hash(i) - 0.5) * 500;
      const y = y0 + 20 + hash(i * 3) * 200;
      const on = 0.5 + 0.5 * Math.sin(f * 0.3 + i * 2.1);
      return <rect key={i} x={x} y={y} width={18 + hash(i * 5) * 30} height={3} rx={1.5} fill="#fffbe8" opacity={on * 0.7} />;
    })}
    {/* current lines rushing left */}
    {Array.from({ length: 70 }, (_, i) => {
      const row = i % 14;
      const y = y0 + 16 + Math.pow(row / 14, 1.4) * 460;
      const sp = (1.5 + rough * 4) * (0.6 + row / 14);
      const x = 2900 - ((i * 211 + f * sp * 3) % 3800);
      const len = 40 + row * 8;
      return <path key={i} d={`M ${x} ${y} q ${len / 2} ${-4 - rough * 6} ${len} 0`} stroke="#dfeef0" strokeWidth={1.5 + row * 0.25} fill="none" opacity={0.35 + rough * 0.25} />;
    })}
    {/* whitecaps */}
    {Array.from({ length: Math.round(10 + rough * 30) }, (_, i) => {
      const t = ((f * (0.6 + rough) + i * 23) % 60) / 60;
      const x = -800 + hash(i * 7) * 3600 - f * rough * 2;
      const y = y0 + 60 + hash(i * 9) * 420;
      return <ellipse key={i} cx={((x % 3800) + 3800) % 3800 - 900} cy={y} rx={12 + t * 30 * (0.5 + rough)} ry={3 + t * 4} fill="#ffffff" opacity={(1 - t) * 0.6} />;
    })}
  </g>
);

export const Boats: React.FC<{ f: number; y0?: number }> = ({ f, y0 = 600 }) => (
  <g>
    <Boat x={300 - f * 0.8} y={y0 + 60} s={0.55} f={f} sail="#c8603a" seed={1} />
    <Boat x={1300 - f * 1.4} y={y0 + 150} s={0.8} f={f} sail="#a83a2a" seed={2} />
    <Boat x={2100 - f * 0.6} y={y0 + 40} s={0.45} f={f} sail="#e8d8b0" seed={3} />
  </g>
);

/** Near riverbank (eroding edge when rough). */
export const NearBank: React.FC<{ f: number; y?: number; crumble?: number }> = ({ f, y = 920, crumble = 0 }) => (
  <g>
    <path d={`M -900 ${y} Q 0 ${y - 30} 700 ${y - 10} T 2900 ${y - 20} L 2900 1400 L -900 1400 Z`} fill="#b59a6a" />
    <path d={`M -900 ${y} Q 0 ${y - 30} 700 ${y - 10} T 2900 ${y - 20}`} stroke="#8a6e46" strokeWidth={6} fill="none" />
    <path d={`M -900 ${y + 40} Q 400 ${y + 10} 1200 ${y + 30} T 2900 ${y + 26} L 2900 1400 L -900 1400 Z`} fill="#8eaa5a" />
    {/* reeds */}
    {Array.from({ length: 50 }, (_, i) => {
      const x = -880 + i * 78 + hash(i) * 30;
      const h = 40 + hash(i * 3) * 60;
      const sw = Math.sin(f * 0.06 + i) * 6;
      return <path key={i} d={`M ${x} ${y + 34} q ${sw} ${-h / 2} ${sw * 1.6} ${-h}`} stroke="#6a8a3a" strokeWidth={3} fill="none" />;
    })}
    {/* clods breaking off the bank */}
    {crumble > 0 &&
      [0, 1, 2].map((k) => {
        const t = clamp(crumble * 1.4 - k * 0.2);
        return <path key={k} d="M -24 0 L 26 -6 L 18 20 L -20 18 Z" fill="#9a7e52" transform={`translate(${400 + k * 60}, ${y - 4 + t * t * 90}) rotate(${t * 50})`} opacity={1 - t * 0.6} />;
      })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Riverside station, bazaar, tol & maktab                             */
/* ------------------------------------------------------------------ */

const label = (x: number, y: number, text: string, size = 26, col = "#3a1e0a", bg = "#f6e2b0") => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x={-text.length * size * 0.32 - 16} y={-size * 0.95} width={text.length * size * 0.64 + 32} height={size * 1.5} rx={6} fill={bg} stroke="#7a4a1e" strokeWidth={3} />
    <text x={0} y={size * 0.25} textAnchor="middle" fontFamily={BN_FONT} fontWeight={700} fontSize={size} fill={col}>
      {text}
    </text>
  </g>
);

export const Station: React.FC<{ f: number; x?: number; y?: number }> = ({ f, x = 0, y = 0 }) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* platform */}
    <rect x={-60} y={760} width={980} height={40} fill="#b8a58a" />
    <rect x={-60} y={796} width={980} height={14} fill="#8a7658" />
    {/* building */}
    <rect x={120} y={540} width={520} height={220} fill="#d9a06a" />
    <rect x={120} y={540} width={520} height={22} fill="#b97a42" />
    {[170, 290, 410, 530].map((wx) => (
      <g key={wx}>
        <path d={`M ${wx} 700 L ${wx} 620 Q ${wx + 30} 590 ${wx + 60} 620 L ${wx + 60} 700 Z`} fill="#6a3e22" />
        <path d={`M ${wx + 4} 696 L ${wx + 4} 622 Q ${wx + 30} 598 ${wx + 56} 622 L ${wx + 56} 696 Z`} fill="#3a2214" opacity={0.6} />
      </g>
    ))}
    {/* tin roof + canopy over platform */}
    <path d="M 90 548 L 380 440 L 670 548 Z" fill="#9aa4a8" />
    {Array.from({ length: 14 }, (_, i) => (
      <line key={i} x1={100 + i * 41} y1={548 - (i < 7 ? i : 13 - i) * 15} x2={100 + i * 41} y2={548} stroke="#7a8488" strokeWidth={2} />
    ))}
    <path d="M -40 640 L 900 640 L 920 668 L -60 668 Z" fill="#a8b2b4" />
    {[0, 240, 480, 720].map((px) => (
      <rect key={px} x={px - 6} y={668} width={12} height={92} fill="#6a5a48" />
    ))}
    {label(380, 500, "মেদিনীমণ্ডল", 30)}
    {/* signal post */}
    <rect x={860} y={520} width={10} height={240} fill="#5a4a3a" />
    <rect x={840} y={540} width={50} height={14} fill="#c8302a" transform={`rotate(${-20 + Math.sin(f * 0.02) * 2} 865 547)`} />
    {/* rail track */}
    <rect x={-400} y={830} width={1800} height={10} fill="#6a5a4a" />
    {Array.from({ length: 36 }, (_, i) => (
      <rect key={i} x={-400 + i * 50} y={822} width={22} height={26} fill="#7a5e42" />
    ))}
    <rect x={-400} y={826} width={1800} height={4} fill="#9aa0a4" />
    <rect x={-400} y={840} width={1800} height={4} fill="#9aa0a4" />
  </g>
);

/** Paddle steamer at the ghat, smoke rising. */
export const Steamer: React.FC<{ f: number; x: number; y: number; s?: number; arrive?: number }> = ({ f, x, y, s = 1, arrive = 1 }) => (
  <g transform={`translate(${x + (1 - arrive) * 500}, ${y + Math.sin(f * 0.05) * 3}) scale(${s})`}>
    <path d="M -260 0 L 260 0 L 230 50 L -230 50 Z" fill="#2e3a44" />
    <rect x={-220} y={-60} width={420} height={60} fill="#f2eee4" />
    {Array.from({ length: 9 }, (_, i) => (
      <rect key={i} x={-205 + i * 45} y={-46} width={26} height={22} rx={4} fill="#5a7a8a" />
    ))}
    <rect x={-160} y={-110} width={260} height={50} fill="#e8e2d4" />
    <rect x={-10} y={-200} width={34} height={100} fill="#b8402a" />
    <rect x={-10} y={-200} width={34} height={14} fill="#1e1e1e" />
    {[0, 1, 2, 3].map((k) => {
      const t = ((f + k * 18) % 72) / 72;
      return <circle key={k} cx={7 - t * 140 + Math.sin(t * 6 + k) * 10} cy={-210 - t * 150} r={14 + t * 36} fill="#d8d4cc" opacity={0.6 * (1 - t)} />;
    })}
    <circle cx={200} cy={10} r={44} fill="#3a4a54" />
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <line key={k} x1={200} y1={10} x2={200 + Math.cos(k + f * 0.08) * 44} y2={10 + Math.sin(k + f * 0.08) * 44} stroke="#8a9aa4" strokeWidth={3} />
    ))}
  </g>
);

const Stall: React.FC<{ x: number; y: number; f: number; awn: [string, string]; goods: "veg" | "fish" | "pots" | "banana"; seed?: number }> = ({ x, y, f, awn, goods, seed = 0 }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x={-120} y={-170} width={8} height={170} fill="#7a5a32" />
    <rect x={112} y={-170} width={8} height={170} fill="#7a5a32" />
    <path d={`M -140 -170 L 140 -170 L 150 -130 L -150 -130 Z`} fill={awn[0]} />
    {Array.from({ length: 6 }, (_, i) => (
      <path key={i} d={`M ${-140 + i * 56} -170 L ${-112 + i * 56} -170 L ${-110 + i * 58} -130 L ${-140 + i * 58} -130 Z`} fill={awn[1]} />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <path key={`s${i}`} d={`M ${-150 + i * 50} -130 q 25 ${16 + Math.sin(f * 0.08 + i + seed) * 2} 50 0`} fill={i % 2 ? awn[0] : awn[1]} />
    ))}
    <rect x={-130} y={-50} width={260} height={50} fill="#a87a4a" />
    <rect x={-130} y={-50} width={260} height={8} fill="#c89a62" />
    {goods === "veg" &&
      Array.from({ length: 14 }, (_, i) => <circle key={i} cx={-100 + (i % 7) * 32} cy={-58 - Math.floor(i / 7) * 16} r={13} fill={["#d8452a", "#6a9a3a", "#e8a03a", "#8a3a6a"][i % 4]} />)}
    {goods === "fish" &&
      [-80, 0, 80].map((bx) => (
        <g key={bx} transform={`translate(${bx}, -62)`}>
          <ellipse cx={0} cy={0} rx={38} ry={16} fill="#8a6a3a" />
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M ${-26 + k * 16} -8 q 10 -8 20 0 q -10 8 -20 0 Z`} fill="#c8d4dc" />
          ))}
        </g>
      ))}
    {goods === "pots" &&
      [-90, -30, 30, 90].map((px, i) => (
        <g key={px} transform={`translate(${px}, -50)`}>
          <ellipse cx={0} cy={-22} rx={26} ry={24} fill={i % 2 ? "#b8643a" : "#c87a4a"} />
          <rect x={-12} y={-50} width={24} height={8} fill="#a85a32" />
        </g>
      ))}
    {goods === "banana" &&
      [-70, 10, 80].map((bx) => (
        <g key={bx} transform={`translate(${bx}, -128) rotate(${Math.sin(f * 0.07 + bx) * 4})`}>
          <line x1={0} y1={0} x2={0} y2={20} stroke="#5a4a2a" strokeWidth={2} />
          {Array.from({ length: 6 }, (_, k) => (
            <path key={k} d={`M ${-14 + (k % 3) * 12} ${22 + Math.floor(k / 3) * 14} q 4 16 12 18`} stroke="#e8c83a" strokeWidth={7} strokeLinecap="round" fill="none" />
          ))}
        </g>
      ))}
  </g>
);

export const Bazaar: React.FC<{ f: number; x?: number; y?: number }> = ({ f, x = 0, y = 0 }) => (
  <g transform={`translate(${x}, ${y})`}>
    <Stall x={0} y={800} f={f} awn={["#d8452a", "#f2e2b8"]} goods="veg" seed={1} />
    <Stall x={330} y={790} f={f} awn={["#2a6a8a", "#e8e0c8"]} goods="fish" seed={2} />
    <Stall x={660} y={800} f={f} awn={["#e8a03a", "#a8302a"]} goods="pots" seed={3} />
    <Stall x={990} y={790} f={f} awn={["#4a8a4a", "#f2e2b8"]} goods="banana" seed={4} />
    {label(500, 560, "বাজার", 30, "#3a1e0a", "#ffe08a")}
  </g>
);

/** Banyan for the tol (pathshala under the tree). */
export const Banyan: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M -50 0 Q -40 -160 -70 -300 L 70 -300 Q 40 -160 50 0 Z" fill="#7a5a3a" />
    {Array.from({ length: 8 }, (_, i) => (
      <line key={i} x1={-260 + i * 70} y1={-260} x2={-250 + i * 70 + Math.sin(f * 0.03 + i) * 4} y2={-40 - hash(i) * 80} stroke="#8a6a46" strokeWidth={3} />
    ))}
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * TAU;
      return <circle key={i} cx={Math.cos(a) * 220} cy={-360 + Math.sin(a) * 90} r={110 + hash(i) * 40} fill={i % 2 ? "#4f7d44" : "#5f8f50"} />;
    })}
    <circle cx={0} cy={-380} r={170} fill="#5a8a4c" />
    {Array.from({ length: 20 }, (_, i) => (
      <circle key={`l${i}`} cx={(hash(i) - 0.5) * 460} cy={-380 + (hash(i * 3) - 0.5) * 220} r={18} fill="#8ab868" opacity={0.6 + 0.3 * Math.sin(f * 0.05 + i)} />
    ))}
  </g>
);

/** Village maktab: whitewashed hall with arched door and a small green dome. */
export const Maktab: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <rect x={-260} y={-260} width={520} height={260} fill="#f2ead8" />
    <rect x={-260} y={-260} width={520} height={18} fill="#d8ccb0" />
    <path d="M -60 -260 Q 0 -360 60 -260 Z" fill="#4a8a5a" />
    <rect x={-3} y={-380} width={6} height={30} fill="#c9a24a" />
    {[-190, -70, 70, 190].map((ax) => (
      <g key={ax}>
        <path d={`M ${ax - 36} 0 L ${ax - 36} -130 Q ${ax} -190 ${ax + 36} -130 L ${ax + 36} 0 Z`} fill="#4a6a5a" />
        <path d={`M ${ax - 30} 0 L ${ax - 30} -128 Q ${ax} -180 ${ax + 30} -128 L ${ax + 30} 0 Z`} fill="#2a3a32" opacity={0.6} />
      </g>
    ))}
    <rect x={-280} y={0} width={560} height={16} fill="#c8bca0" />
    {label(0, -300, "মক্তব", 30, "#1e3a26", "#e8f2d8")}
  </g>
);

/* ------------------------------------------------------------------ */
/* Storybook map                                                       */
/* ------------------------------------------------------------------ */

/**
 * Parchment map: Padma in the south, station on the bank, then the route
 * north along the canal → bazaar → Kalirkhil → Baidik Bari. `p` 0..1 draws the route.
 */
export const StoryMap: React.FC<{ f: number; p: number; pins: number[] }> = ({ f, p, pins }) => {
  const route = "M 470 840 C 520 760 600 700 640 620 C 690 520 760 470 860 420 C 960 370 1080 330 1180 300 C 1280 270 1360 230 1420 200";
  const L = 1300;
  const pin = (k: number, x: number, y: number, icon: React.ReactNode, text: string) => {
    const t = clamp(pins[k] ?? 0);
    const e = 1 - Math.pow(1 - t, 3);
    if (t <= 0) return null;
    return (
      <g transform={`translate(${x}, ${y}) scale(${0.6 + e * 0.4})`} opacity={e}>
        <circle r={36} fill="#fff4d6" stroke="#7a4a1e" strokeWidth={3} />
        {icon}
        <text y={68} textAnchor="middle" fontFamily={BN_FONT} fontWeight={700} fontSize={30} fill="#4a2410">
          {text}
        </text>
      </g>
    );
  };
  return (
    <g>
      <defs>
        <radialGradient id="s01-parch" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stopColor="#f6e6c2" />
          <stop offset="80%" stopColor="#e6cf9a" />
          <stop offset="100%" stopColor="#b8935a" />
        </radialGradient>
      </defs>
      <rect x={120} y={60} width={1680} height={960} rx={20} fill="url(#s01-parch)" />
      <rect x={140} y={80} width={1640} height={920} rx={14} fill="none" stroke="#8a5a2a" strokeWidth={3} strokeDasharray="14 8" />
      {/* Padma along the south edge */}
      <path d="M 120 900 C 500 860 800 940 1200 900 S 1700 880 1800 910 L 1800 1020 L 120 1020 Z" fill="#8fb4bc" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M ${180 + i * 140 - ((f * 1.5) % 140)} ${950 + (i % 2) * 24} q 30 -10 60 0`} stroke="#e8f2f2" strokeWidth={3} fill="none" />
      ))}
      <text x={1500} y={990} fontFamily={BN_FONT} fontWeight={700} fontSize={40} fill="#2a5a66">
        পদ্মা
      </text>
      {/* canal (khal) running north */}
      <path d="M 520 880 C 560 760 640 700 680 620 C 730 520 800 470 900 430 C 1000 390 1110 350 1220 320" stroke="#8fb4bc" strokeWidth={22} fill="none" strokeLinecap="round" />
      <text x={730} y={600} fontFamily={BN_FONT} fontWeight={600} fontSize={28} fill="#2a5a66" transform="rotate(-38 730 600)">
        খাল
      </text>
      {/* tiny trees and huts scattered */}
      {Array.from({ length: 26 }, (_, i) => (
        <g key={i} transform={`translate(${220 + hash(i) * 1480}, ${150 + hash(i * 3) * 640})`} opacity={0.75}>
          <circle r={12} fill="#7a9a5a" />
          <rect x={-2} y={10} width={4} height={10} fill="#7a5a3a" />
        </g>
      ))}
      {/* compass */}
      <g transform="translate(1660, 220)">
        <circle r={58} fill="#f6e6c2" stroke="#7a4a1e" strokeWidth={3} />
        <path d="M 0 -50 L 12 0 L 0 50 L -12 0 Z" fill="#a83a2a" />
        <path d="M 0 -50 L 12 0 L -12 0 Z" fill="#d8452a" />
        <text y={-64} textAnchor="middle" fontFamily={BN_FONT} fontWeight={700} fontSize={26} fill="#4a2410">
          উত্তর
        </text>
        <text y={90} textAnchor="middle" fontFamily={BN_FONT} fontWeight={700} fontSize={26} fill="#4a2410">
          দক্ষিণ
        </text>
      </g>
      {/* the route, drawn on */}
      <path d={route} stroke="#a83a2a" strokeWidth={7} fill="none" strokeDasharray="18 12" strokeLinecap="round" style={{ strokeDashoffset: 0 }} pathLength={L} opacity={0.9} clipPath="url(#s01-route-clip)" />
      <clipPath id="s01-route-clip">
        <rect x={0} y={880 - p * 740} width={1920} height={1080} />
      </clipPath>
      {/* walking footprint marker at the head of the route */}
      {pin(0, 470, 840, <path d="M -18 10 L -18 -6 L 0 -20 L 18 -6 L 18 10 Z M -26 14 L 26 14" stroke="#4a2410" strokeWidth={4} fill="#d9a06a" />, "স্টেশন")}
      {pin(1, 860, 420, <g>{[-14, 0, 14].map((x) => <path key={x} d={`M ${x - 7} 4 L ${x} -14 L ${x + 7} 4 Z`} fill={x ? "#d8452a" : "#e8a03a"} />)}</g>, "বাজার")}
      {pin(2, 1180, 300, <path d="M -22 10 Q 0 -24 22 10 Z" fill="#9aba6a" />, "কালিরখিল")}
      {pin(3, 1420, 200, <g><rect x={-22} y={-12} width={44} height={24} fill="#c86a3a" /><path d="M -26 -12 L 0 -28 L 26 -12 Z" fill="#8a3a1e" /></g>, "বৈদিক বাড়ী")}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Baidik Bari (day) and the great kitchen                             */
/* ------------------------------------------------------------------ */

export const BaidikBariDay: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {/* compound wall */}
    <rect x={-700} y={700} width={3300} height={90} fill="#c8845a" />
    <rect x={-700} y={700} width={3300} height={12} fill="#e8a878" />
    {/* main two-storey house */}
    <rect x={160} y={300} width={1600} height={440} fill="#d98c5a" />
    <rect x={160} y={300} width={1600} height={440} fill="url(#s01-brick)" opacity={0.35} />
    <defs>
      <pattern id="s01-brick" width={40} height={20} patternUnits="userSpaceOnUse">
        <rect width={40} height={20} fill="#d98c5a" />
        <path d="M 0 0 H 40 M 0 10 H 40 M 10 0 V 10 M 30 10 V 20" stroke="#b86a3a" strokeWidth={1.2} />
      </pattern>
    </defs>
    {/* cornices */}
    <rect x={140} y={286} width={1640} height={22} fill="#f2c89a" />
    <rect x={140} y={510} width={1640} height={16} fill="#f2c89a" />
    {/* terrace railing */}
    {Array.from({ length: 52 }, (_, i) => (
      <rect key={i} x={170 + i * 31} y={244} width={12} height={42} rx={5} fill="#f2c89a" />
    ))}
    <rect x={150} y={236} width={1620} height={12} fill="#f2c89a" />
    {/* upper windows */}
    {Array.from({ length: 11 }, (_, i) => (
      <g key={i} transform={`translate(${250 + i * 142}, 340)`}>
        <path d="M -34 150 L -34 40 Q 0 0 34 40 L 34 150 Z" fill="#3a5a4a" />
        {[-20, -7, 7, 20].map((lx) => (
          <line key={lx} x1={lx} y1={46} x2={lx} y2={148} stroke="#2a3e34" strokeWidth={3} />
        ))}
        <path d="M -40 40 Q 0 -8 40 40" stroke="#f2c89a" strokeWidth={6} fill="none" />
      </g>
    ))}
    {/* ground-floor arcade */}
    {Array.from({ length: 9 }, (_, i) => (
      <g key={i} transform={`translate(${290 + i * 168}, 740)`}>
        <path d="M -56 0 L -56 -120 Q 0 -190 56 -120 L 56 0 Z" fill="#6a3a22" />
        <path d="M -50 0 L -50 -118 Q 0 -180 50 -118 L 50 0 Z" fill="#3a2014" opacity={0.6} />
      </g>
    ))}
    {/* central gate with name */}
    <rect x={850} y={500} width={220} height={240} fill="#c86a3a" />
    <path d="M 870 740 L 870 600 Q 960 520 1050 600 L 1050 740 Z" fill="#4a2a18" />
    <path d="M 840 500 L 960 430 L 1080 500 Z" fill="#a8502a" />
    {label(960, 470, "বৈদিক বাড়ী", 34, "#4a1e0a", "#ffe8b0")}
    <line x1={960} y1={430} x2={960} y2={330} stroke="#7a4a2a" strokeWidth={4} />
    <path d={`M 962 334 Q ${1000 + Math.sin(f * 0.1) * 6} 344 ${1030 + Math.sin(f * 0.12) * 8} 336 L 1028 368 Q 1000 372 962 362 Z`} fill="#d8302a" />
    {/* trees around */}
    {[-300, 1960, 2200].map((x, i) => (
      <Palm key={x} x={x} y={760} s={1.1 + i * 0.1} f={f} seed={i + 4} />
    ))}
    <Banana x={60} y={760} s={1.2} f={f} />
    <Banana x={1860} y={760} s={1.1} f={f} />
  </g>
);

/** Big joint-family kitchen: mud chulhas, two giant pots for the two meals, steam, rice heaps. */
export const GreatKitchen: React.FC<{ f: number; steam?: number }> = ({ f, steam = 1 }) => (
  <g>
    <defs>
      <linearGradient id="s01-kwall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c89060" />
        <stop offset="100%" stopColor="#9a6a42" />
      </linearGradient>
    </defs>
    <rect x={-600} y={-200} width={3100} height={1000} fill="url(#s01-kwall)" />
    {/* sunbeam through a high window */}
    <rect x={1300} y={80} width={160} height={120} fill="#ffe8b8" />
    <path d="M 1300 200 L 1460 200 L 1200 900 L 900 900 Z" fill="#fff0c8" opacity={0.22} />
    {/* thatch beams */}
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={-600 + i * 420} y={-200} width={20} height={260} fill="#6a4426" />
    ))}
    <rect x={-600} y={50} width={3100} height={24} fill="#6a4426" />
    {/* floor */}
    <rect x={-600} y={800} width={3100} height={600} fill="#8a6440" />
    <rect x={-600} y={800} width={3100} height={10} fill="#6a4426" />
  </g>
);

/** A giant handi on a mud chulha with fire and rolling steam. */
export const GiantPot: React.FC<{ x: number; y: number; s?: number; f: number; seed?: number; steam?: number }> = ({ x, y, s = 1, f, seed = 0, steam = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M -170 0 L -150 -110 L 150 -110 L 170 0 Z" fill="#a86a42" />
    <path d="M -60 0 L -60 -70 Q 0 -100 60 -70 L 60 0 Z" fill="#2a1a10" />
    {[0, 1, 2, 3].map((k) => {
      const h = 50 + Math.abs(Math.sin(f * 0.4 + k * 1.7 + seed)) * 30;
      return <path key={k} d={`M ${-40 + k * 26} -6 Q ${-30 + k * 26} ${-h * 0.6} ${-26 + k * 26 + Math.sin(f * 0.3 + k) * 6} ${-h} Q ${-16 + k * 26} ${-h * 0.5} ${-12 + k * 26} -6 Z`} fill={k % 2 ? "#ff9a3c" : "#ffd36a"} />;
    })}
    <ellipse cx={0} cy={-210} rx={190} ry={150} fill="#3a2a22" />
    <ellipse cx={-60} cy={-250} rx={70} ry={50} fill="#5a4a40" opacity={0.6} />
    <ellipse cx={0} cy={-340} rx={130} ry={24} fill="#2a1e18" />
    <ellipse cx={0} cy={-346} rx={118} ry={18} fill="#f8f4ea" />
    {/* bubbling rice */}
    {Array.from({ length: 8 }, (_, k) => (
      <circle key={k} cx={-90 + k * 26} cy={-348 + Math.sin(f * 0.5 + k + seed) * 3} r={6} fill="#ffffff" />
    ))}
    {/* steam */}
    {Array.from({ length: 6 }, (_, k) => {
      const t = ((f * 1.1 + k * 20 + seed * 9) % 120) / 120;
      return <circle key={`st${k}`} cx={-60 + k * 24 + Math.sin(t * 6 + k) * 30} cy={-370 - t * 340} r={24 + t * 60} fill="#ffffff" opacity={0.42 * (1 - t) * steam} />;
    })}
  </g>
);

/** Heaped rice on banana leaves + jute sacks. */
export const RiceHeaps: React.FC<{ x: number; y: number; s?: number; n?: number }> = ({ x, y, s = 1, n = 4 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    {Array.from({ length: n }, (_, i) => (
      <g key={i} transform={`translate(${i * 120}, 0)`}>
        <path d="M -60 0 Q 0 -16 60 0 Q 0 12 -60 0 Z" fill="#4a8a3a" />
        <path d="M -44 -2 Q 0 -70 44 -2 Z" fill="#fbf8f0" />
        <path d="M -30 -10 Q 0 -54 18 -30" stroke="#e8e2d4" strokeWidth={3} fill="none" />
      </g>
    ))}
  </g>
);

export const RiceSack: React.FC<{ x: number; y: number; s?: number; text?: string }> = ({ x, y, s = 1, text }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M -70 0 Q -84 -90 -54 -150 L 54 -150 Q 84 -90 70 0 Z" fill="#c8a86a" />
    <path d="M -54 -150 Q 0 -176 54 -150" stroke="#8a6a3a" strokeWidth={6} fill="none" />
    {Array.from({ length: 6 }, (_, i) => (
      <line key={i} x1={-60} y1={-20 - i * 22} x2={60} y2={-20 - i * 22} stroke="#a88a4a" strokeWidth={1.5} opacity={0.6} />
    ))}
    {text && (
      <text y={-62} textAnchor="middle" fontFamily={BN_FONT} fontWeight={800} fontSize={30} fill="#5a2a10">
        {text}
      </text>
    )}
  </g>
);

/** Small helper so scenes can wobble numbers etc. */
export const wob = (f: number, seed: number, amp = 1) => noise1(f * 0.05, seed) * amp;
