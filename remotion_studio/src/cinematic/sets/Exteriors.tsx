import React from "react";
import { clamp, flicker, hash, noise1 } from "../core/anim";
import { Diya, Flame, Garland, Glow, Smoke } from "../fx/Fx";

/* ------------------------------------------------------------------ */
/* Sky: Kartik Amavasya — NO moon. Milky Way + stars.                  */
/* ------------------------------------------------------------------ */

export const AmavasyaSky: React.FC<{ f: number; dark?: number; horizonGlow?: number }> = ({ f, dark = 0, horizonGlow = 1 }) => (
  <g>
    <defs>
      <linearGradient id="sky-amavasya" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#020309" />
        <stop offset="40%" stopColor="#090a22" />
        <stop offset="72%" stopColor="#1b1436" />
        <stop offset="100%" stopColor="#3d2033" />
      </linearGradient>
      <radialGradient id="milkyway" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#b9b2e6" stopOpacity={0.32} />
        <stop offset="45%" stopColor="#7d74b8" stopOpacity={0.12} />
        <stop offset="100%" stopColor="#3a3170" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="horizon-glow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff9a4a" stopOpacity={0} />
        <stop offset="100%" stopColor="#ff9a4a" stopOpacity={0.28} />
      </linearGradient>
    </defs>
    <rect x={-500} y={-1000} width={2920} height={2300} fill="url(#sky-amavasya)" />
    <g transform="translate(960, 40) rotate(-24)">
      <ellipse cx={0} cy={0} rx={1600} ry={330} fill="url(#milkyway)" />
      <ellipse cx={-260} cy={40} rx={1000} ry={190} fill="url(#milkyway)" />
      <ellipse cx={380} cy={-30} rx={700} ry={150} fill="url(#milkyway)" />
      {Array.from({ length: 260 }, (_, i) => {
        const x = (hash(i * 1.3) - 0.5) * 2800;
        const y = (hash(i * 2.9) - 0.5) * 2 * 150 * Math.pow(hash(i * 5.1), 1.6);
        return <circle key={i} cx={x} cy={y} r={0.5 + hash(i * 7) * 0.9} fill="#e6e2ff" opacity={0.25 + hash(i * 11) * 0.45} />;
      })}
    </g>
    {Array.from({ length: 170 }, (_, i) => {
      const x = -400 + hash(i + 0.5) * 2720;
      const y = -950 + hash(i * 3.3) * 1550;
      const r = 0.6 + Math.pow(hash(i * 9.1), 3) * 2.4;
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(f * (0.03 + hash(i) * 0.05) + i));
      return (
        <g key={i} opacity={tw}>
          <circle cx={x} cy={y} r={r} fill={hash(i * 4) > 0.8 ? "#ffe9c8" : "#eef0ff"} />
          {r > 2.2 && (
            <path d={`M ${x - 8} ${y} L ${x + 8} ${y} M ${x} ${y - 8} L ${x} ${y + 8}`} stroke="#ffffff" strokeWidth={0.8} opacity={0.6} />
          )}
        </g>
      );
    })}
    {/* shooting star */}
    {f > 18 && f < 36 && (
      <line
        x1={300 + (f - 18) * 38}
        y1={-260 + (f - 18) * 14}
        x2={300 + (f - 18) * 38 - 140}
        y2={-260 + (f - 18) * 14 - 52}
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={clamp((36 - f) / 10)}
      />
    )}
    <rect x={-500} y={250} width={2920} height={300} fill="url(#horizon-glow)" opacity={horizonGlow} />
    {dark > 0 && <rect x={-500} y={-1000} width={2920} height={2300} fill="#020208" opacity={dark} />}
  </g>
);

/* ------------------------------------------------------------------ */
/* Far bank: distant villages lighting up across the land              */
/* ------------------------------------------------------------------ */

const treeline = (y: number, seed: number, amp: number) => {
  let d = `M -600 ${y + 80}`;
  for (let x = -600; x <= 2520; x += 40) {
    const k = hash(Math.floor(x / 40) + seed);
    const bump = k > 0.85 ? amp * 1.8 : k > 0.6 ? amp * 1.1 : amp * 0.6;
    d += ` Q ${x + 20} ${y - bump} ${x + 40} ${y - amp * 0.3 * hash(x + seed)}`;
  }
  return d + ` L 2520 ${y + 80} Z`;
};

export const FarBank: React.FC<{ f: number; wave: number }> = ({ f, wave }) => (
  <g>
    <path d={treeline(500, 3, 26)} fill="#0b0a1a" />
    {/* bamboo clumps & palms */}
    {[-300, 120, 520, 980, 1420, 1880, 2250].map((x, i) => (
      <g key={x} transform={`translate(${x}, 492) scale(${0.5 + hash(i) * 0.3})`}>
        <path d="M 0 0 Q 4 -60 10 -120 L 13 -119 Q 8 -60 4 0 Z" fill="#0b0a1a" />
        {[-60, -25, 15, 50, 160].map((a, j) => (
          <path key={j} d="M 11 -118 Q 40 -132 70 -110 Q 40 -122 11 -114 Z" fill="#0b0a1a" transform={`rotate(${a} 11 -118)`} />
        ))}
      </g>
    ))}
    <path d={treeline(512, 9, 10)} fill="#0e0c1e" />
    {Array.from({ length: 120 }, (_, i) => {
      const x = -500 + hash(i * 1.7) * 2900;
      const y = 488 + hash(i * 4.1) * 30;
      const th = hash(i * 8.3);
      const on = clamp((wave - th * 0.95) * 8);
      if (on <= 0) return null;
      const fl = flicker(f, i);
      return (
        <g key={i} opacity={on}>
          <circle cx={x} cy={y} r={9 * fl} fill="url(#fx-glow-soft)" />
          <circle cx={x} cy={y} r={1.4 + hash(i) * 0.9} fill="#ffd27a" />
        </g>
      );
    })}
    {/* distant akash-pradip lanterns on tall bamboo */}
    {[60, 760, 1330, 2010].map((x, i) => {
      const on = clamp((wave - 0.15 - i * 0.18) * 6);
      return (
        <g key={x} opacity={0.6 + on * 0.4}>
          <line x1={x} y1={505} x2={x} y2={400} stroke="#0b0a1a" strokeWidth={2} />
          {on > 0 && <Glow x={x} y={398} r={18} o={on} kind="soft" />}
          <rect x={x - 3} y={394} width={6} height={8} fill={on > 0 ? "#ffd27a" : "#1b1630"} />
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Padma at night with reflections                                     */
/* ------------------------------------------------------------------ */

export const PadmaNight: React.FC<{ f: number; wave: number }> = ({ f, wave }) => (
  <g>
    <defs>
      <linearGradient id="padma-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1534" />
        <stop offset="100%" stopColor="#080a1c" />
      </linearGradient>
    </defs>
    <rect x={-600} y={518} width={3120} height={300} fill="url(#padma-night)" />
    {Array.from({ length: 50 }, (_, i) => {
      const x = -500 + hash(i * 1.7) * 2900;
      const th = hash(i * 8.3);
      const on = clamp((wave - th * 0.95) * 8);
      if (on <= 0 || i % 2) return null;
      return (
        <g key={i} opacity={on * 0.75}>
          {[0, 1, 2, 3, 4].map((k) => (
            <rect
              key={k}
              x={x - 6 + Math.sin(f * 0.12 + k + i) * 4}
              y={526 + k * 9}
              width={12 - k * 1.6}
              height={2.2}
              rx={1}
              fill="#ffc96a"
              opacity={0.8 - k * 0.14}
            />
          ))}
        </g>
      );
    })}
    {Array.from({ length: 16 }, (_, i) => {
      const y = 540 + i * 15;
      const s = Math.sin(f * 0.04 + i) * 40;
      return (
        <path
          key={i}
          d={`M ${-400 + s} ${y} Q 400 ${y - 4} 960 ${y} T ${2320 + s} ${y}`}
          stroke="#3e3a6e"
          strokeWidth={1.2}
          opacity={0.35}
          fill="none"
        />
      );
    })}
    {/* nouka with lantern drifting */}
    <g transform={`translate(${520 + f * 0.35}, ${600 + Math.sin(f * 0.08) * 2.5})`}>
      <path d="M -70 0 Q 0 22 70 0 Q 50 20 -50 20 Z" fill="#0d0a14" />
      <path d="M -28 0 Q 0 -26 28 0 Z" fill="#141022" />
      <line x1={46} y1={0} x2={46} y2={-36} stroke="#0d0a14" strokeWidth={2} />
      <Glow x={46} y={-38} r={26} kind="soft" />
      <rect x={42} y={-44} width={8} height={10} rx={2} fill="#ffcc66" />
      <rect x={38} y={12} width={16} height={60} fill="#ffb84d" opacity={0.18} />
    </g>
  </g>
);

/* ------------------------------------------------------------------ */
/* Near village + Baidik Bari with Kali-puja mandap                     */
/* ------------------------------------------------------------------ */

const Hut: React.FC<{ x: number; y: number; s: number; f: number; lit: number; seed: number }> = ({ x, y, s, f, lit, seed }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    {/* mud wall */}
    <rect x={-110} y={-110} width={220} height={110} fill="#2a1a1c" />
    <rect x={-110} y={-110} width={220} height={110} fill="#ff9a40" opacity={0.06 * lit} />
    {/* glowing doorway */}
    <rect x={-22} y={-78} width={44} height={78} rx={3} fill={lit > 0 ? "#ffb052" : "#120c10"} opacity={0.35 + lit * 0.6} />
    {lit > 0 && <Glow x={0} y={-30} r={90} o={lit * 0.5} kind="soft" />}
    {/* do-chala thatched roof */}
    <path d="M -150 -100 Q -70 -205 0 -210 Q 70 -205 150 -100 Q 0 -122 -150 -100 Z" fill="#1d1418" />
    <path d="M -150 -100 Q 0 -122 150 -100" stroke="#3a2a26" strokeWidth={4} fill="none" />
    {Array.from({ length: 9 }, (_, i) => (
      <path key={i} d={`M ${-130 + i * 32} -104 L ${-110 + i * 28} -180`} stroke="#2b1f22" strokeWidth={2} opacity={0.7} />
    ))}
    {/* plinth diyas */}
    {[-95, -60, 60, 95].map((dx, i) => (
      <Diya key={dx} x={dx} y={-2} s={0.75} f={f} seed={seed + i} life={clamp((lit - i * 0.12) * 3)} glow />
    ))}
  </g>
);

export const NearVillage: React.FC<{ f: number; wave: number; puja: number }> = ({ f, wave, puja }) => {
  const dhakPulse = 0.75 + 0.25 * Math.pow(Math.abs(Math.sin(f * 0.42)), 6);
  return (
    <g>
      <defs>
        <linearGradient id="near-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1220" />
          <stop offset="100%" stopColor="#0a070c" />
        </linearGradient>
        <radialGradient id="mandap-aura" cx="0.5" cy="0.6" r="0.5">
          <stop offset="0%" stopColor="#ffdf9a" stopOpacity={0.9} />
          <stop offset="35%" stopColor="#ff7a2a" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#a01818" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d="M -600 700 Q 300 676 960 690 T 2520 684 L 2520 1300 L -600 1300 Z" fill="url(#near-ground)" />
      {/* banana & palms behind huts */}
      {[-240, 260, 760].map((x, i) => (
        <g key={x} transform={`translate(${x}, 690) scale(${0.9 + i * 0.1})`}>
          <path d="M -6 0 Q 0 -150 10 -300 L 18 -298 Q 10 -150 8 0 Z" fill="#0f0b12" />
          {[-70, -35, 5, 40, 150].map((a, j) => (
            <path
              key={j}
              d="M 14 -296 Q 70 -326 130 -280 Q 70 -306 14 -290 Z"
              fill="#0f0b12"
              transform={`rotate(${a + Math.sin(f * 0.04 + j) * 2} 14 -296)`}
            />
          ))}
        </g>
      ))}
      <Hut x={-120} y={735} s={1.0} f={f} lit={clamp((wave - 0.15) * 3)} seed={10} />
      <Hut x={310} y={712} s={0.82} f={f} lit={clamp((wave - 0.32) * 3)} seed={20} />
      <Hut x={700} y={724} s={0.92} f={f} lit={clamp((wave - 0.5) * 3)} seed={30} />

      {/* near-bank kash grass silhouettes */}
      {Array.from({ length: 40 }, (_, i) => {
        const x = -500 + i * 75 + hash(i) * 30;
        return (
          <path
            key={i}
            d={`M ${x} 700 Q ${x + 6 + Math.sin(f * 0.05 + i) * 6} 660 ${x + 14 + Math.sin(f * 0.05 + i) * 10} 628`}
            stroke="#120c14"
            strokeWidth={3}
            fill="none"
          />
        );
      })}
      {/* pukur (pond) in front of Baidik Bari — reflects the lit house */}
      <g transform="translate(1310, 760)">
        <ellipse cx={0} cy={60} rx={640} ry={70} fill="#0b0a1a" />
        <g opacity={0.5}>
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={-360 + i * 170 + Math.sin(f * 0.1 + i) * 4} y={22} width={110} height={70} rx={10} fill="#ffa64a" opacity={0.35 + puja * 0.2} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={-430 + i * 78 + Math.sin(f * 0.12 + i) * 6} y={100 + (i % 3) * 6} width={30} height={3} fill="#ffd27a" opacity={0.6} />
          ))}
        </g>
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M ${-560 + i * 10} ${40 + i * 10} Q 0 ${34 + i * 10 + Math.sin(f * 0.06 + i) * 3} ${560 - i * 10} ${40 + i * 10}`} stroke="#2a2550" strokeWidth={1.4} fill="none" opacity={0.6} />
        ))}
      </g>
      {/* villagers walking toward the puja with diyas */}
      {[0, 1, 2, 3].map((k) => {
        const wx = -200 + ((f * (1.1 + k * 0.15) + k * 260) % 1300);
        const bob = Math.abs(Math.sin(f * 0.25 + k)) * 3;
        return (
          <g key={k} transform={`translate(${wx}, ${890 - bob}) scale(${0.9 + (k % 2) * 0.15})`}>
            <circle cx={0} cy={-120} r={14} fill="#0a070c" />
            <path d="M -18 -104 Q 0 -112 18 -104 L 24 0 L -24 0 Z" fill="#0a070c" />
            <Diya x={20} y={-70} s={0.7} f={f} seed={k * 9} />
          </g>
        );
      })}
      {/* ---- Baidik Bari ---- */}
      <g transform="translate(1310, 720)">
        {/* Kali-puja mandap glow rising out of the inner courtyard, above the roofline */}
        <ellipse cx={60} cy={-420} rx={460 + puja * 120} ry={230 + puja * 60} fill="url(#mandap-aura)" opacity={(0.3 + puja * 0.7) * dhakPulse} />
        {/* mandap do-chala roof peeking over the front block */}
        <g transform="translate(70, -346)">
          <path d="M -210 0 Q -120 -120 0 -132 Q 120 -120 210 0 Z" fill="#3a1418" />
          <path d="M -210 0 Q -120 -120 0 -132 Q 120 -120 210 0" stroke="#ffb04a" strokeWidth={3} fill="none" opacity={0.5 + puja * 0.5} />
          {Array.from({ length: 9 }, (_, i) => (
            <Flame key={i} x={-180 + i * 45} y={-Math.sin((i / 8) * Math.PI) * 112 - 4} s={0.75} f={f} seed={70 + i} glow={i % 2 === 0} />
          ))}
          <path d="M 0 -132 L 0 -170" stroke="#c9932e" strokeWidth={4} />
          <circle cx={0} cy={-174} r={7} fill="#e8b84a" />
        </g>
        {/* rooftop stair-room (chilekotha) */}
        <rect x={-380} y={-430} width={150} height={90} fill="#24141b" />
        <rect x={-392} y={-440} width={174} height={14} fill="#3a2430" />
        <rect x={-330} y={-410} width={40} height={60} rx={4} fill="#ffb256" opacity={0.6} />
        {/* main two-storey block */}
        <defs>
          <linearGradient id="bari-facade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b1a22" />
            <stop offset="70%" stopColor="#3a2228" />
            <stop offset="100%" stopColor="#5a3020" />
          </linearGradient>
        </defs>
        <rect x={-430} y={-330} width={860} height={330} fill="url(#bari-facade)" />
        <rect x={-440} y={-182} width={880} height={12} fill="#4a2c34" />
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={-425 + i * 170} y={-170} width={16} height={170} fill="#43272f" />
        ))}
        <rect x={-450} y={-346} width={900} height={22} fill="#3a2430" />
        {/* parapet with lamps */}
        {Array.from({ length: 23 }, (_, i) => (
          <Flame key={i} x={-430 + i * 39} y={-348} s={0.7} f={f} seed={i * 3} glow={i % 3 === 0} />
        ))}
        {/* upper windows */}
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <path d={`M ${-370 + i * 120} -200 L ${-370 + i * 120} -270 Q ${-340 + i * 120} -300 ${-310 + i * 120} -270 L ${-310 + i * 120} -200 Z`} fill="#ffb256" opacity={0.55 + 0.1 * Math.sin(f * 0.1 + i)} />
            {[0, 1, 2].map((b) => (
              <line key={b} x1={-358 + i * 120 + b * 16} y1={-270} x2={-358 + i * 120 + b * 16} y2={-200} stroke="#2b1a22" strokeWidth={3} />
            ))}
          </g>
        ))}
        {/* ground floor arches */}
        {Array.from({ length: 5 }, (_, i) => (
          <path
            key={i}
            d={`M ${-360 + i * 170} 0 L ${-360 + i * 170} -110 Q ${-305 + i * 170} -170 ${-250 + i * 170} -110 L ${-250 + i * 170} 0 Z`}
            fill="#ffa64a"
            opacity={0.6 + puja * 0.25}
          />
        ))}
        <Garland x1={-430} y1={-180} x2={0} y2={-180} sag={40} s={1.1} f={f} />
        <Garland x1={0} y1={-180} x2={430} y2={-180} sag={40} s={1.1} f={f} seed={2} />
        {/* puja pennant */}
        <line x1={0} y1={-346} x2={0} y2={-470} stroke="#2b1a22" strokeWidth={4} />
        <path d={`M 0 -470 Q 40 ${-462 + Math.sin(f * 0.2) * 6} 70 -452 Q 40 -446 0 -440 Z`} fill="#c8102e" />
      </g>
    </g>
  );
};

/** Foreground silhouettes for depth (blurred by DOF). */
export const ForegroundPalms: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <path d="M -140 1300 Q -110 700 -30 -200 L 40 -190 Q -40 700 -40 1300 Z" fill="#050307" />
    <g transform={`translate(10, -180) rotate(${Math.sin(f * 0.03) * 2})`}>
      {[10, 40, 75, 110].map((a, j) => (
        <path key={j} d="M 0 0 Q 160 -40 330 60 Q 160 0 0 18 Z" fill="#050307" transform={`rotate(${a})`} />
      ))}
    </g>
    {Array.from({ length: 30 }, (_, i) => {
      const x = -300 + i * 90 + hash(i * 3) * 40;
      const sw = Math.sin(f * 0.05 + i) * 12;
      return (
        <path
          key={i}
          d={`M ${x} 1180 Q ${x + 10 + sw * 0.5} 1080 ${x + 30 + sw} ${980 + hash(i) * 40}`}
          stroke="#060408"
          strokeWidth={7}
          fill="none"
          strokeLinecap="round"
        />
      );
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Lane wall: outside lamps guttering out → Baidik Bari gate ablaze    */
/* ------------------------------------------------------------------ */

export const LANE_DIYAS = Array.from({ length: 11 }, (_, i) => ({
  x: 150 + i * 150,
  dieAt: 284 + i * 7 + Math.round(hash(i * 5) * 6),
}));

export const LaneBackdrop: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <path d={treeline(560, 21, 70)} fill="#07060e" />
    {Array.from({ length: 8 }, (_, i) => (
      <path
        key={i}
        d={`M ${-200 + i * 380} 560 L ${-130 + i * 380} 470 L ${-40 + i * 380} 470 L ${30 + i * 380} 560 Z`}
        fill="#0b0912"
      />
    ))}
    {Array.from({ length: 14 }, (_, i) => {
      const life = clamp((300 + i * 4 - f) / 30);
      return life > 0 ? <circle key={i} cx={-100 + i * 190} cy={540 - (i % 3) * 18} r={2} fill="#ffcf7a" opacity={life * 0.8} /> : null;
    })}
  </g>
);

export const LaneWall: React.FC<{ f: number; joy: number }> = ({ f, joy }) => {
  const catEyes = f > 330 && f < 420 && (f - 330) % 70 > 3;
  return (
    <g>
      <defs>
        <linearGradient id="lane-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b2a2c" />
          <stop offset="100%" stopColor="#1b1216" />
        </linearGradient>
        <linearGradient id="lane-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24181a" />
          <stop offset="100%" stopColor="#0d080a" />
        </linearGradient>
        <radialGradient id="gate-spill" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffd486" stopOpacity={0.85} />
          <stop offset="45%" stopColor="#ff9a3c" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#ff7a20" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="gate-inside" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffcf7a" />
          <stop offset="100%" stopColor="#ff8c32" />
        </linearGradient>
      </defs>
      {/* lane ground */}
      <rect x={-600} y={860} width={3800} height={500} fill="url(#lane-ground)" />
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M -600 ${930 + k * 50} Q 1000 ${915 + k * 52} 3200 ${940 + k * 46}`} stroke="#2e2022" strokeWidth={3} fill="none" opacity={0.6} />
      ))}
      {/* long boundary wall */}
      <rect x={-600} y={600} width={2620} height={262} fill="url(#lane-wall)" />
      <rect x={-610} y={586} width={2640} height={20} rx={3} fill="#4a3536" />
      {Array.from({ length: 34 }, (_, i) => (
        <rect
          key={i}
          x={-560 + i * 76 + (i % 2) * 20}
          y={640 + (i % 4) * 52}
          width={46}
          height={14}
          rx={2}
          fill="#2a1c1e"
          opacity={0.6}
        />
      ))}
      {/* plaster patches, cracks, moss */}
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={`pl${i}`}
          d={`M ${-500 + i * 210} ${650 + (i % 3) * 40} q 40 -18 90 4 q 30 30 -10 60 q -60 14 -84 -20 Z`}
          fill="#4a3536"
          opacity={0.45}
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={`cr${i}`}
          d={`M ${-420 + i * 260} 606 l 8 30 l -10 22 l 12 34 l -6 28`}
          stroke="#140c0e"
          strokeWidth={2}
          fill="none"
          opacity={0.7}
        />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <ellipse key={`ms${i}`} cx={-560 + i * 88} cy={856} rx={40} ry={8} fill="#1d2a1a" opacity={0.6} />
      ))}
      {/* wall niche with its own dying lamp */}
      <path d="M 860 760 L 860 700 Q 900 660 940 700 L 940 760 Z" fill="#120b0d" />
      <Diya x={900} y={756} s={0.9} f={f} seed={77} life={clamp((350 - f) / 16)} />
      <Smoke x={914} y={750} f={f} start={350} seed={7} s={0.7} />
      {/* banyan overhanging the wall, aerial roots */}
      <g transform="translate(-120, 600)">
        {[
          [-200, -400, 220, 110],
          [60, -440, 240, 120],
          [330, -410, 230, 105],
          [580, -350, 200, 90],
          [-60, -330, 260, 80],
          [260, -320, 260, 70],
          [720, -290, 120, 60],
        ].map(([cx, cy, rx, ry], i) => (
          <ellipse key={`c${i}`} cx={cx} cy={cy + Math.sin(f * 0.02 + i) * 2} rx={rx} ry={ry} fill="#06050b" />
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <ellipse key={`lf${i}`} cx={-260 + i * 48} cy={-282 + (i % 3) * 10} rx={26} ry={14} fill="#06050b" />
        ))}
        {Array.from({ length: 14 }, (_, i) => (
          <path
            key={i}
            d={`M ${-200 + i * 70} -300 Q ${-196 + i * 70 + Math.sin(f * 0.03 + i) * 4} ${-150 - (i % 4) * 20} ${-190 + i * 70 + Math.sin(f * 0.03 + i) * 8} ${-40 - (i % 5) * 34}`}
            stroke="#07060c"
            strokeWidth={3}
            fill="none"
          />
        ))}
      </g>
      {/* sleeping cat on wall */}
      <g transform="translate(1210, 586)">
        <ellipse cx={0} cy={-14} rx={34} ry={16} fill="#0f0a0c" />
        <circle cx={-30} cy={-22} r={13} fill="#0f0a0c" />
        <path d="M -40 -32 L -38 -44 L -31 -34 Z M -26 -34 L -20 -45 L -18 -32 Z" fill="#0f0a0c" />
        <path d={`M 30 -8 Q 58 ${-10 + Math.sin(f * 0.15) * 8} 52 -30`} stroke="#0f0a0c" strokeWidth={6} fill="none" strokeLinecap="round" />
        {catEyes && (
          <g>
            <ellipse cx={-35} cy={-23} rx={2.6} ry={1.8} fill="#d8f25a" />
            <ellipse cx={-26} cy={-23} rx={2.6} ry={1.8} fill="#d8f25a" />
          </g>
        )}
      </g>
      {/* diyas on the wall — guttering one by one */}
      {LANE_DIYAS.map((d, i) => {
        const life = clamp((d.dieAt - f) / 14);
        const gutter = life < 1 && life > 0 ? 0.55 + 0.45 * Math.abs(Math.sin(f * 1.7 + i)) : 1;
        return (
          <g key={i}>
            <Diya x={d.x} y={584} s={1.5} f={f} seed={i * 7} life={life * gutter} />
            <Smoke x={d.x + 16} y={576} f={f} start={d.dieAt} seed={i} />
          </g>
        );
      })}

      {/* ---- Baidik Bari gate (revealed by the pan) ---- */}
      <g transform="translate(2420, 860)">
        <ellipse cx={0} cy={60} rx={700 + joy * 200} ry={160} fill="url(#gate-spill)" opacity={0.4 + joy * 0.6} />
        <rect x={-420} y={-360} width={840} height={360} fill="#3b2628" />
        {/* bright courtyard visible through arch */}
        <path d="M -170 0 L -170 -200 Q 0 -330 170 -200 L 170 0 Z" fill="url(#gate-inside)" opacity={0.75 + joy * 0.25} />
        {/* silhouettes passing inside */}
        {[0, 1, 2].map((k) => {
          const px = ((f * (1.4 + k * 0.5) + k * 140) % 420) - 210;
          return (
            <g key={k} transform={`translate(${px}, 0)`} opacity={0.75}>
              <circle cx={0} cy={-118 + k * 14} r={k === 1 ? 12 : 16} fill="#3a1c14" />
              <path d={`M -16 ${-100 + k * 14} Q 0 ${-110 + k * 14} 16 ${-100 + k * 14} L 20 0 L -20 0 Z`} fill="#3a1c14" />
            </g>
          );
        })}
        {/* sparkler sparks behind the arch */}
        {joy > 0.2 &&
          [-90, 60].map((sx, k) => (
            <g key={k} opacity={joy}>
              <Glow x={sx} y={-120} r={46} kind="white" o={0.6} />
              {Array.from({ length: 10 }, (_, j) => {
                const a = hash(j + k * 10 + Math.floor(f / 2)) * Math.PI * 2;
                const r = 8 + hash(j * 3 + f) * 28;
                return <line key={j} x1={sx} y1={-120} x2={sx + Math.cos(a) * r} y2={-120 + Math.sin(a) * r} stroke="#fff3a0" strokeWidth={1.6} />;
              })}
            </g>
          ))}
        {/* pillars, arch frame */}
        <path d="M -200 0 L -200 -205 Q 0 -360 200 -205 L 200 0 L 170 0 L 170 -200 Q 0 -330 -170 -200 L -170 0 Z" fill="#5a3a34" />
        <rect x={-250} y={-380} width={500} height={34} fill="#5a3a34" />
        {[-1, 1].map((s) => (
          <g key={s}>
            <rect x={s * 230 - 26} y={-380} width={52} height={380} fill="#4a302c" />
            <Flame x={s * 230} y={-392} s={1.6} f={f} seed={s + 4} />
            {/* banana plant + mangal ghot */}
            <g transform={`translate(${s * 320}, 0)`}>
              <path d="M -8 0 L -6 -180 L 6 -180 L 8 0 Z" fill="#2a4a2c" />
              {[-1, 1].map((q) => (
                <path key={q} d={`M 0 -170 Q ${q * 70} -240 ${q * 110} -200 Q ${q * 60} -210 0 -150 Z`} fill="#3a6b3a" transform={`rotate(${Math.sin(f * 0.05) * 3})`} />
              ))}
              <ellipse cx={0} cy={-10} rx={34} ry={30} fill="#b5652e" />
              <rect x={-12} y={-46} width={24} height={14} fill="#b5652e" />
              {[-1, 0, 1].map((q) => (
                <path key={q} d={`M 0 -46 Q ${q * 16} -70 ${q * 26} -58`} stroke="#3f7a32" strokeWidth={6} fill="none" strokeLinecap="round" />
              ))}
            </g>
          </g>
        ))}
        <Garland x1={-200} y1={-250} x2={200} y2={-250} sag={50} s={1.4} f={f} />
        <Garland x1={-250} y1={-350} x2={250} y2={-350} sag={30} s={1.2} f={f} seed={3} />
        {/* alpona on threshold */}
        <g transform="translate(0, 40) scale(1, 0.3)" opacity={0.7}>
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} cx={0} cy={-60} rx={18} ry={44} fill="none" stroke="#fff4dd" strokeWidth={5} transform={`rotate(${i * 36})`} />
          ))}
          <circle r={130} fill="none" stroke="#fff4dd" strokeWidth={5} strokeDasharray="14 10" />
        </g>
        {[-150, -90, 90, 150].map((dx, i) => (
          <Diya key={dx} x={dx} y={10} s={1.2} f={f} seed={50 + i} />
        ))}
      </g>
      {/* wall continues right of the gate */}
      <rect x={2840} y={600} width={600} height={262} fill="url(#lane-wall)" />
      {[2900, 3050, 3200].map((x, i) => (
        <Diya key={x} x={x} y={584} s={1.15} f={f} seed={90 + i} />
      ))}
      {/* bamboo pole foreground-ish */}
      <rect x={1890} y={300} width={16} height={600} fill="#1a1210" />
      <rect x={1890} y={420} width={16} height={5} fill="#2c201c" />
      <rect x={1890} y={560} width={16} height={5} fill="#2c201c" />
      {/* breathing variation for the darkness: noise on wall */}
      <rect x={-600} y={600} width={2620} height={262} fill="#000" opacity={0.08 + noise1(f * 0.02, 2) * 0.03} />
    </g>
  );
};
