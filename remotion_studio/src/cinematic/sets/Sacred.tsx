import React from "react";
import { flicker, hash, noise1 } from "../core/anim";
import { Diya, Flame, Garland, Glow } from "../fx/Fx";

/**
 * Kali-puja mandap. Per the series bible the Goddess is never drawn as a figure:
 * her presence is a radiant red-gold light behind the altar, framed by hibiscus (জবা) garlands.
 */
export const KaliMandap: React.FC<{ f: number; presence?: number }> = ({ f, presence = 1 }) => {
  const pulse = 0.85 + 0.15 * Math.pow(Math.abs(Math.sin(f * 0.21)), 4);
  return (
    <g>
      <defs>
        <radialGradient id="mandap-bg" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0%" stopColor="#5a1a14" />
          <stop offset="60%" stopColor="#2a0c0c" />
          <stop offset="100%" stopColor="#120507" />
        </radialGradient>
        <radialGradient id="presence" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff0c8" stopOpacity={0.95} />
          <stop offset="30%" stopColor="#ff9a3c" stopOpacity={0.6} />
          <stop offset="70%" stopColor="#c0181a" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#7a0a10" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-400} y={-300} width={2720} height={1700} fill="url(#mandap-bg)" />
      {/* chala roof edge + festoons */}
      <path d="M -300 120 Q 960 -60 2220 120 L 2220 60 Q 960 -120 -300 60 Z" fill="#3a1214" />
      {Array.from({ length: 14 }, (_, i) => (
        <path key={i} d={`M ${-200 + i * 170} 110 q 85 ${70 + Math.sin(f * 0.04 + i) * 5} 170 0 Z`} fill={i % 2 ? "#c8202a" : "#e0a83a"} opacity={0.9} />
      ))}
      <Garland x1={-200} y1={190} x2={960} y2={190} sag={60} s={1.5} f={f} />
      <Garland x1={960} y1={190} x2={2120} y2={190} sag={60} s={1.5} f={f} seed={2} />
      {/* altar platform */}
      <rect x={520} y={640} width={880} height={120} fill="#4a1a12" />
      <rect x={500} y={620} width={920} height={26} rx={6} fill="#7a3a1c" />
      {/* the Presence: radiant light, never a figure */}
      <ellipse cx={960} cy={420} rx={300 * pulse} ry={330 * pulse} fill="url(#presence)" opacity={presence} />
      <Glow x={960} y={420} r={160} kind="white" o={0.35 * presence} />
      {/* arch frame with hibiscus garlands */}
      <path d="M 640 640 L 640 330 Q 960 80 1280 330 L 1280 640 L 1240 640 L 1240 340 Q 960 130 680 340 L 680 640 Z" fill="#8a4a1c" />
      {Array.from({ length: 26 }, (_, i) => {
        const t = i / 25;
        const a = Math.PI * (1 - t);
        const x = 960 + Math.cos(a) * 300;
        const y = 360 - Math.sin(a) * 240 + (t < 0.08 || t > 0.92 ? 120 : 0);
        return <circle key={i} cx={x} cy={y} r={11} fill={i % 3 === 1 ? "#ffb02e" : "#d0121e"} stroke="#7a0a10" strokeWidth={1.4} />;
      })}
      {/* puja items on the platform */}
      {[700, 820, 1100, 1220].map((x, i) => (
        <Diya key={x} x={x} y={612} s={1.4} f={f} seed={i + 30} />
      ))}
      <g transform="translate(960, 612)">
        {/* conch (shankha) on its stand */}
        <ellipse cx={0} cy={0} rx={34} ry={8} fill="#c9932e" />
        <path d="M -30 -10 Q -10 -46 26 -26 Q 40 -16 24 -8 Q 0 -2 -30 -10 Z" fill="#fbf4e6" />
        <path d="M -16 -16 Q 0 -30 18 -22" stroke="#e0cfae" strokeWidth={2} fill="none" />
      </g>
      {/* panchapradip lamps either side */}
      {[560, 1360].map((x, k) => (
        <g key={x} transform={`translate(${x}, 760)`}>
          <rect x={-6} y={-220} width={12} height={220} fill="#c9932e" />
          <ellipse cx={0} cy={0} rx={46} ry={10} fill="#c9932e" />
          {[-40, -20, 0, 20, 40].map((dx, i) => (
            <Flame key={dx} x={dx} y={-220 - Math.abs(dx) * 0.3} s={1.3} f={f} seed={k * 10 + i} />
          ))}
        </g>
      ))}
      {/* dhak on the side */}
      <g transform={`translate(260, 720) rotate(-16)`} opacity={0.95}>
        <ellipse cx={-110} cy={0} rx={34} ry={80} fill="#efe4cc" />
        <path d="M -110 -80 Q 0 -100 110 -80 L 110 80 Q 0 100 -110 80 Z" fill="#8a2a1a" />
        <ellipse cx={110} cy={0} rx={34} ry={80} fill="#f4ead6" />
        {Array.from({ length: 11 }, (_, i) => (
          <path key={i} d="M 0 -92 Q 18 -170 4 -240" stroke="#fbf8f0" strokeWidth={8} strokeLinecap="round" fill="none" transform={`rotate(${-50 + i * 10 + Math.sin(f * 0.07 + i) * 3})`} />
        ))}
      </g>
      {/* incense smoke */}
      {[0, 1, 2].map((k) => {
        const t = ((f + k * 30) % 90) / 90;
        return <circle key={k} cx={1060 + Math.sin(t * 6 + k) * 16} cy={590 - t * 260} r={10 + t * 30} fill="#e8dff5" opacity={0.12 * (1 - t)} />;
      })}
      {/* floor */}
      <rect x={-400} y={760} width={2720} height={600} fill="#2a110c" />
      <rect x={-400} y={760} width={2720} height={600} fill="#ff9a3c" opacity={0.06 * flicker(f, 4)} />
    </g>
  );
};

/** Devotees gathered at the mandap, seen from behind (silhouettes with warm rim). */
export const MandapCrowd: React.FC<{ f: number; n?: number; y?: number; s?: number }> = ({ f, n = 9, y = 900, s = 1 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const x = 180 + i * (1560 / (n - 1)) + (hash(i) - 0.5) * 60;
      const sc = s * (0.9 + hash(i * 3) * 0.25);
      // background life: weight shifts, heads turning to neighbours / the altar, nods, folded-hand bows
      const sway = Math.sin(f * 0.05 + i) * 2 + noise1(f * 0.012, i + 40) * 5;
      const veil = i % 3 === 0;
      const turn = noise1(f * 0.015, i + 60) * 14 + (hash(Math.floor((f + i * 37) / 70) + i) > 0.7 ? (i % 2 ? 10 : -10) : 0);
      const nod = Math.max(0, noise1(f * 0.04, i + 80)) * 8;
      const bow = hash(Math.floor((f + i * 53) / 110) + i * 3) > 0.82 ? Math.sin((((f + i * 53) % 110) / 110) * Math.PI) * 10 : 0;
      return (
        <g key={i} transform={`translate(${x + sway}, ${y + (i % 2) * 30}) scale(${sc})`}>
          <g transform={`rotate(${bow * 0.6}, 0, 0)`}>
            <path d="M -60 0 Q -64 -150 -46 -200 Q 0 -230 46 -200 Q 64 -150 60 0 Z" fill={veil ? "#3a1a1c" : "#22100e"} />
            <g transform={`translate(${turn}, ${nod + bow}) rotate(${turn * 0.4}, 0, -238)`}>
              <ellipse cx={0} cy={-238} rx={34} ry={38} fill={veil ? "#4a1e20" : "#140906"} />
              <path d="M -30 -268 Q 0 -282 30 -268" stroke="#ffb860" strokeWidth={3} fill="none" opacity={0.55} />
              {Math.abs(turn) > 8 && <path d={`M ${turn > 0 ? 26 : -26} -250 q ${turn > 0 ? 8 : -8} 10 0 22`} stroke="#ff9a3c" strokeWidth={3} fill="none" opacity={0.6} />}
            </g>
            <path d="M -46 -200 Q 0 -230 46 -200" stroke="#ff9a3c" strokeWidth={3} fill="none" opacity={0.6} />
          </g>
        </g>
      );
    })}
  </g>
);
