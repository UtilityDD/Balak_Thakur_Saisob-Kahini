import React from "react";
import { clamp, flicker, hash, noise1 } from "../core/anim";
import { Diya, Flame, Glow } from "../fx/Fx";

/**
 * Scene 06 sets — the sutika ghar (birth room) of the Baidik house at night:
 * lime-washed wall with red-oxide dado, a barred window looking out to the mandap,
 * a kulungi (wall niche) with a lamp, the door to the dalan, a low wooden khat with kantha bedding.
 * World coordinates: wall plane at depth ≈0.6, floor/khat at depth 1.
 */

/** Back wall + window (with the mandap glow outside) + door + niche + wall clock. */
export const RoomWall: React.FC<{ f: number; mandap?: number; clockSpin?: number; doorLight?: number }> = ({ f, mandap = 0.4, clockSpin = 0, doorLight = 0 }) => (
  <g>
    <defs>
      <linearGradient id="s06-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5e3a26" />
        <stop offset="45%" stopColor="#a8754e" />
        <stop offset="100%" stopColor="#8a5a3a" />
      </linearGradient>
      <radialGradient id="s06-lampwash" cx="0.55" cy="0.35" r="0.6">
        <stop offset="0%" stopColor="#ffd9a0" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#ffd9a0" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="s06-stain">
        <stop offset="0%" stopColor="#3a2014" stopOpacity={0.16} />
        <stop offset="100%" stopColor="#3a2014" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="s06-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0b0a1c" />
        <stop offset="100%" stopColor="#241428" />
      </linearGradient>
      <radialGradient id="s06-mandap" cx="0.5" cy="0.75" r="0.7">
        <stop offset="0%" stopColor="#ffb25a" stopOpacity={1} />
        <stop offset="45%" stopColor="#d0402a" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#d0402a" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="s06-door" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stopColor="#ffcf8a" stopOpacity={0.85} />
        <stop offset="100%" stopColor="#ff9a4a" stopOpacity={0} />
      </linearGradient>
    </defs>
    {/* wall */}
    <rect x={-500} y={-300} width={2920} height={1100} fill="url(#s06-wall)" />
    <rect x={-500} y={-300} width={2920} height={1100} fill="url(#s06-lampwash)" />
    {/* ceiling beams (kori-borga) */}
    <rect x={-500} y={-300} width={2920} height={130} fill="#2e1a10" />
    {Array.from({ length: 30 }, (_, i) => (
      <rect key={i} x={-480 + i * 100} y={-170} width={26} height={34} fill="#3a2214" />
    ))}
    <rect x={-500} y={-140} width={2920} height={16} fill="#4a2c1a" />
    {/* lime plaster weathering */}
    {Array.from({ length: 12 }, (_, i) => (
      <ellipse key={i} cx={-300 + hash(i * 3.3) * 2500} cy={20 + hash(i * 5.1) * 520} rx={60 + hash(i * 7.7) * 120} ry={40 + hash(i * 2.2) * 80} fill="url(#s06-stain)" />
    ))}
    {Array.from({ length: 6 }, (_, i) => {
      const cx = -200 + hash(i * 41) * 2200;
      const cy = 40 + hash(i * 43) * 400;
      return <path key={`c${i}`} d={`M ${cx} ${cy} l 9 16 l -5 12 l 11 18`} stroke="#3a2014" strokeWidth={1.3} fill="none" opacity={0.45} />;
    })}
    {/* red-oxide dado */}
    <rect x={-500} y={600} width={2920} height={200} fill="#6e2e1e" />
    <rect x={-500} y={596} width={2920} height={8} fill="#9a4a30" />
    <rect x={-500} y={604} width={2920} height={4} fill="#3e160c" opacity={0.6} />

    {/* door to the dalan (left) with warm spill */}
    <g>
      <path d="M -330 800 L -330 260 Q -190 150 -50 260 L -50 800 Z" fill="#1c0e08" />
      <path d="M -330 800 L -330 260 Q -190 150 -50 260 L -50 800 Z" fill="url(#s06-door)" opacity={0.35 + doorLight * 0.65} />
      <path d="M -344 800 L -344 256 Q -190 132 -36 256 L -36 800" stroke="#4a2a16" strokeWidth={16} fill="none" />
      {/* half-drawn cloth curtain */}
      <path d={`M -330 262 Q -300 ${520 + Math.sin(f * 0.04) * 6} -250 800 L -330 800 Z`} fill="#8a3a2a" opacity={0.85} />
      <path d="M -318 300 Q -296 520 -262 790" stroke="#5a2014" strokeWidth={2} fill="none" opacity={0.6} />
    </g>

    {/* barred window to the courtyard / mandap */}
    <g transform="translate(300, 230)">
      <rect x={-150} y={-10} width={300} height={290} fill="url(#s06-night)" />
      <ellipse cx={-30} cy={260} rx={260} ry={170} fill="url(#s06-mandap)" opacity={mandap * (0.85 + 0.15 * flicker(f, 3))} />
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={-110 + i * 50} cy={60 + (i % 2) * 12} r={1.6} fill="#fff4dd" opacity={0.6} />
      ))}
      {[-100, -50, 0, 50, 100].map((x) => (
        <rect key={x} x={x - 4} y={-10} width={8} height={290} fill="#1a0f0a" />
      ))}
      <rect x={-166} y={-26} width={332} height={18} fill="#4a2a16" />
      <rect x={-166} y={278} width={332} height={22} fill="#4a2a16" />
      <rect x={-166} y={-26} width={18} height={326} fill="#4a2a16" />
      <rect x={148} y={-26} width={18} height={326} fill="#4a2a16" />
      {/* shutters folded open */}
      <path d="M -166 -26 L -230 -6 L -230 300 L -166 300 Z" fill="#5a341c" />
      <path d="M 166 -26 L 230 -6 L 230 300 L 166 300 Z" fill="#5a341c" />
    </g>

    {/* wall clock (দেওয়াল ঘড়ি) */}
    <g transform="translate(830, 150)">
      <rect x={-46} y={-60} width={92} height={150} rx={10} fill="#4a2a16" />
      <circle cx={0} cy={-8} r={36} fill="#f2e6cc" />
      <circle cx={0} cy={-8} r={36} fill="none" stroke="#c9932e" strokeWidth={3} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={-1.2} y={-41} width={2.4} height={6} fill="#3a2414" transform={`rotate(${i * 30}, 0, -8)`} />
      ))}
      <line x1={0} y1={-8} x2={0} y2={-28} stroke="#2a1a10" strokeWidth={3} strokeLinecap="round" transform={`rotate(${120 + clockSpin * 30}, 0, -8)`} />
      <line x1={0} y1={-8} x2={0} y2={-38} stroke="#2a1a10" strokeWidth={2} strokeLinecap="round" transform={`rotate(${clockSpin * 360}, 0, -8)`} />
      <circle cx={0} cy={-8} r={3} fill="#c9932e" />
      <line x1={0} y1={30} x2={Math.sin(f * 0.26) * 14} y2={70} stroke="#c9932e" strokeWidth={2} />
      <circle cx={Math.sin(f * 0.26) * 14} cy={72} r={6} fill="#c9932e" />
    </g>

    {/* kulungi niche with lamp and brass lota */}
    <g transform="translate(1520, 420)">
      <path d="M -70 120 L -70 0 Q 0 -70 70 0 L 70 120 Z" fill="#3a1e10" />
      <path d="M -70 120 L -70 0 Q 0 -70 70 0 L 70 120 Z" fill="#ffb860" opacity={0.18 * flicker(f, 11)} />
      <rect x={-80} y={118} width={160} height={10} fill="#5a341c" />
      <Diya x={-20} y={112} s={1.1} f={f} seed={61} />
      <path d="M 22 112 Q 18 84 30 78 Q 42 84 38 112 Z" fill="#c9932e" />
      <ellipse cx={30} cy={78} rx={9} ry={3} fill="#e6b84c" />
    </g>
    <Glow x={1500} y={520} r={150} kind="warm" o={0.35 * flicker(f, 11)} />
  </g>
);

/** Red-oxide floor with a reed mat. */
export const RoomFloor: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="s06-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6a2a1c" />
        <stop offset="100%" stopColor="#2a0e08" />
      </linearGradient>
    </defs>
    <rect x={-600} y={790} width={3120} height={700} fill="url(#s06-floor)" />
    <rect x={-600} y={790} width={3120} height={14} fill="#1a0806" opacity={0.5} />
    {/* polished sheen */}
    <ellipse cx={1000} cy={900} rx={900} ry={60} fill="#ffb070" opacity={0.08} />
    {/* madur (reed mat) */}
    <g transform="translate(330, 1010)">
      <path d="M -260 -40 L 260 -40 L 300 60 L -300 60 Z" fill="#c9a060" />
      {Array.from({ length: 18 }, (_, i) => (
        <line key={i} x1={-260 + i * 30} y1={-40} x2={-300 + i * 35} y2={60} stroke="#a07a40" strokeWidth={2} opacity={0.7} />
      ))}
      <path d="M -260 -40 L 260 -40 L 300 60 L -300 60 Z" fill="none" stroke="#7a2a1a" strokeWidth={6} />
    </g>
  </g>
);

/** Low wooden khat with kantha bedding and a baby pillow. Mattress top at y ≈ 800. */
export const Khat: React.FC<{ x?: number }> = ({ x = 960 }) => (
  <g transform={`translate(${x}, 0)`}>
    {/* legs + frame */}
    {[-360, 350].map((dx) => (
      <rect key={dx} x={dx - 14} y={830} width={28} height={110} fill="#3a2010" />
    ))}
    <rect x={-380} y={818} width={760} height={34} fill="#5a3218" />
    <rect x={-380} y={818} width={760} height={6} fill="#7a4a26" />
    {/* kantha mattress */}
    <path d="M -372 822 Q -380 790 -350 786 L 352 786 Q 378 790 372 822 Z" fill="#f6eedd" />
    <path d="M -372 822 L 372 822 L 366 834 L -366 834 Z" fill="#e0d2b6" />
    {/* kantha running-stitch motifs */}
    {Array.from({ length: 12 }, (_, i) => (
      <path key={i} d={`M ${-320 + i * 56} 818 q 12 -10 24 0`} stroke={i % 2 ? "#b8202c" : "#2a6a8a"} strokeWidth={1.6} strokeDasharray="3 3" fill="none" opacity={0.7} />
    ))}
    <path d="M -350 796 L 350 796" stroke="#b8202c" strokeWidth={1.4} strokeDasharray="4 4" opacity={0.5} />
    {/* baby pillow */}
    <ellipse cx={-110} cy={788} rx={62} ry={16} fill="#fffaf0" />
    <path d="M -160 788 Q -110 778 -60 788" stroke="#e6d8be" strokeWidth={2} fill="none" />
  </g>
);

/** Eleven soft amber memory-lights (Thakurma's eleven children), appearing one by one. */
export const ElevenLights: React.FC<{ f: number; start: number; gap: number; x: number; y: number; r: number; o?: number }> = ({ f, start, gap, x, y, r, o = 1 }) => (
  <g style={{ mixBlendMode: "screen" }} opacity={o}>
    {Array.from({ length: 11 }, (_, k) => {
      const a = Math.PI * (1.08 + (k / 10) * 0.84);
      const on = clamp((f - (start + k * gap)) / 8);
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r * 0.62 + noise1(f * 0.02, k) * 6;
      return (
        <g key={k} opacity={on}>
          <circle cx={px} cy={py} r={26} fill="#ffcf87" opacity={0.18} />
          <circle cx={px} cy={py} r={11} fill="#ffe2a8" opacity={0.6} />
          <circle cx={px} cy={py} r={4.5} fill="#fffaf0" />
        </g>
      );
    })}
  </g>
);

/** Flower petals (জবা red, গাঁদা marigold) drifting toward the mandap. */
export const Petals: React.FC<{ f: number; start: number; n?: number; dir?: 1 | -1; o?: number }> = ({ f, start, n = 26, dir = -1, o = 1 }) => (
  <g opacity={o}>
    {Array.from({ length: n }, (_, i) => {
      const t = (f - start - i * 3) / 120;
      if (t < 0 || t > 1) return null;
      const x0 = dir < 0 ? 2100 + hash(i * 3) * 300 : -200 - hash(i * 3) * 300;
      const x = x0 + dir * t * (2200 + hash(i * 5) * 400);
      const y = 40 + hash(i * 7) * 380 + Math.sin(t * 6 + i) * 40 + t * 80;
      const red = i % 3 !== 0;
      return (
        <g key={i} transform={`translate(${x}, ${y}) rotate(${t * 360 * (hash(i) > 0.5 ? 1 : -1) + i * 20})`} opacity={Math.min(1, t * 6, (1 - t) * 6)}>
          <ellipse cx={0} cy={0} rx={red ? 13 : 9} ry={red ? 7 : 9} fill={red ? "#c8142a" : "#ffa21a"} />
          <ellipse cx={-3} cy={-2} rx={red ? 5 : 3} ry={2} fill="#ffffff" opacity={0.3} />
        </g>
      );
    })}
  </g>
);

/** Puja arrangements at the mandap: naivedya thalis, flower baskets, conch, incense. */
export const Offerings: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {/* naivedya thalis */}
    {[
      { x: 640, k: 0 },
      { x: 960, k: 1 },
      { x: 1280, k: 2 },
    ].map(({ x, k }) => (
      <g key={x} transform={`translate(${x}, 900)`}>
        <ellipse cx={0} cy={8} rx={120} ry={22} fill="#8a5a14" />
        <ellipse cx={0} cy={0} rx={116} ry={20} fill="#e0aa3e" />
        <ellipse cx={-30} cy={-4} rx={40} ry={6} fill="#fff0b8" opacity={0.5} />
        {k === 0 &&
          // sandesh + narkel naru
          Array.from({ length: 9 }, (_, i) => <ellipse key={i} cx={-70 + (i % 5) * 34} cy={-10 - Math.floor(i / 5) * 14} rx={14} ry={9} fill={i % 2 ? "#fbf3dc" : "#f0dcae"} stroke="#d9c49a" strokeWidth={1} />)}
        {k === 1 && (
          // bananas + fruit
          <g>
            <path d="M -80 -8 Q -40 -50 10 -30 Q -30 -30 -70 0 Z" fill="#f2c335" />
            <path d="M -70 -4 Q -20 -44 30 -22 Q -10 -22 -60 4 Z" fill="#e8b42a" />
            <circle cx={50} cy={-16} r={18} fill="#c8302a" />
            <circle cx={80} cy={-12} r={15} fill="#e07a20" />
            <circle cx={30} cy={-8} r={13} fill="#7aa83a" />
          </g>
        )}
        {k === 2 &&
          // heap of rice + sweets (bhog)
          <g>
            <path d="M -70 -2 Q -30 -60 0 -62 Q 30 -60 70 -2 Z" fill="#fbf8ee" />
            <circle cx={0} cy={-62} r={10} fill="#f4c542" />
          </g>}
      </g>
    ))}
    {/* flower baskets */}
    {[{ x: 420 }, { x: 1500 }].map(({ x }, b) => (
      <g key={x} transform={`translate(${x}, 960)`}>
        <path d="M -80 0 L 80 0 L 60 60 L -60 60 Z" fill="#a07a3a" />
        {Array.from({ length: 4 }, (_, r) => (
          <line key={r} x1={-76 + r * 4} y1={14 + r * 12} x2={76 - r * 4} y2={14 + r * 12} stroke="#7a5a28" strokeWidth={2} />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <circle
            key={i}
            cx={-62 + (i % 7) * 20 + (Math.floor(i / 7) ? 10 : 0)}
            cy={-8 - Math.floor(i / 7) * 16 + Math.sin(f * 0.03 + i) * 0.6}
            r={12}
            fill={(i + b) % 3 === 0 ? "#ffa21a" : "#c8142a"}
            stroke={(i + b) % 3 === 0 ? "#d07a10" : "#7a0a18"}
            strokeWidth={1.4}
          />
        ))}
      </g>
    ))}
    {/* incense */}
    <g transform="translate(1120, 900)">
      <rect x={-2} y={-90} width={3} height={90} fill="#5a2a14" />
      <circle cx={0} cy={-90} r={2.5} fill="#ff6a2a" opacity={flicker(f, 2)} />
      {[0, 1, 2].map((k) => {
        const t = ((f + k * 26) % 78) / 78;
        return <circle key={k} cx={Math.sin(t * 7 + k) * 12} cy={-96 - t * 200} r={6 + t * 22} fill="#ece4f6" opacity={0.16 * (1 - t)} />;
      })}
    </g>
    <Flame x={780} y={880} s={1} f={f} seed={4} />
  </g>
);
