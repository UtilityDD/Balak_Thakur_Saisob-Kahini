import React from "react";
import { clamp, flicker, hash, noise1 } from "../core/anim";
import { Flame, Glow } from "../fx/Fx";
import { BN_FONT } from "../fonts";

/**
 * Scene 05 set pieces (owned by Scene05Rain): the sutika-ghar (birth room), the madur mat,
 * monsoon rain + lightning for Charu's memory, the kosthi (horoscope) chart, and the
 * shadow-play of Daksha's yajna on the baithak wall.
 */

/* ------------------------------------------------------------------ */
/* Sutika-ghar: mud-plastered room, barred window, niche lamp, shelf    */
/* ------------------------------------------------------------------ */

export const SUTIKA_WINDOW = { x: 300, y: 250, w: 250, h: 270 };

export const SutikaRoom: React.FC<{ f: number; rainInWindow?: number }> = ({ f, rainInWindow = 0 }) => {
  const fl = flicker(f, 6);
  const W = SUTIKA_WINDOW;
  return (
    <g>
      <defs>
        <radialGradient id="s05-wall" cx="0.55" cy="0.42" r="0.85">
          <stop offset="0%" stopColor="#d9b07a" />
          <stop offset="40%" stopColor="#a87648" />
          <stop offset="80%" stopColor="#5a3a24" />
          <stop offset="100%" stopColor="#2a1a10" />
        </radialGradient>
        <linearGradient id="s05-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a4428" />
          <stop offset="100%" stopColor="#2a180e" />
        </linearGradient>
        <linearGradient id="s05-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0e1e" />
          <stop offset="100%" stopColor="#1a1830" />
        </linearGradient>
      </defs>
      <rect x={-400} y={-300} width={2720} height={1110} fill="url(#s05-wall)" />
      <rect x={-400} y={-300} width={2720} height={1110} fill="#ffb060" opacity={(fl - 0.86) * 0.5} />
      {/* lime-wash patches and hairline cracks */}
      {Array.from({ length: 14 }, (_, i) => (
        <ellipse key={i} cx={-200 + hash(i * 3.3) * 2300} cy={60 + hash(i * 5.1) * 560} rx={40 + hash(i * 7.7) * 120} ry={30 + hash(i * 2.2) * 70} fill="#2a160c" opacity={0.03 + hash(i) * 0.03} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <path key={`c${i}`} d={`M ${200 + i * 480 + hash(i) * 120} ${120 + hash(i * 2) * 80} l 10 22 l -7 18 l 12 26`} stroke="#2a160c" strokeWidth={1.4} fill="none" opacity={0.4} />
      ))}
      {/* window with wooden bars: night outside (rain streaks when Charu remembers) */}
      <rect x={W.x - 16} y={W.y - 16} width={W.w + 32} height={W.h + 32} fill="#4a2c18" />
      <rect x={W.x} y={W.y} width={W.w} height={W.h} fill="url(#s05-night)" />
      {rainInWindow > 0.01 && (
        <g opacity={rainInWindow}>
          <clipPath id="s05-win">
            <rect x={W.x} y={W.y} width={W.w} height={W.h} />
          </clipPath>
          <g clipPath="url(#s05-win)">
            {Array.from({ length: 40 }, (_, i) => {
              const x0 = W.x + hash(i * 1.9) * (W.w + 60);
              const y = W.y + ((hash(i * 4.1) * W.h + f * 30) % W.h);
              return <line key={i} x1={x0 - (y - W.y) * 0.25} y1={y} x2={x0 - (y - W.y) * 0.25 + 6} y2={y - 26} stroke="#9fb8d8" strokeWidth={1.4} opacity={0.6} />;
            })}
          </g>
        </g>
      )}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={`b${i}`} x={W.x + 22 + i * 48} y={W.y} width={11} height={W.h} fill="#5a3820" />
      ))}
      <rect x={W.x - 24} y={W.y + W.h + 10} width={W.w + 48} height={18} fill="#6a4228" />
      {/* niche with a diya */}
      <path d="M 1510 470 L 1510 380 Q 1560 330 1610 380 L 1610 470 Z" fill="#3a2214" />
      <Glow x={1560} y={440} r={70} kind="warm" o={0.5 * fl} />
      <Flame x={1560} y={452} s={1.0} f={f} seed={55} />
      <rect x={1540} y={452} width={40} height={8} rx={4} fill="#8a4a24" />
      {/* shelf with brass pots */}
      <rect x={950} y={330} width={330} height={14} fill="#5a3820" />
      {[990, 1060, 1150, 1230].map((x, i) => (
        <g key={x} transform={`translate(${x}, 330)`}>
          <ellipse cx={0} cy={-22 - i * 2} rx={20 + (i % 2) * 6} ry={24 + (i % 2) * 4} fill={i % 2 ? "#c9932e" : "#a87420"} />
          <ellipse cx={-6} cy={-30 - i * 2} rx={6} ry={10} fill="#ffe0a0" opacity={0.4} />
          <rect x={-8} y={-52 - i * 3} width={16} height={8} fill="#8a6018" />
        </g>
      ))}
      {/* hanging cloth / gamchha on a rope */}
      <path d="M 1700 240 Q 1900 270 2120 240" stroke="#4a2c18" strokeWidth={3} fill="none" />
      <path d="M 1760 248 L 1760 380 Q 1800 392 1840 380 L 1846 255 Z" fill="#c23a2a" />
      {[1772, 1790, 1808, 1826].map((x) => (
        <line key={x} x1={x} y1={256} x2={x} y2={382} stroke="#e8d4b8" strokeWidth={2} opacity={0.6} />
      ))}
      {/* floor */}
      <rect x={-400} y={810} width={2720} height={600} fill="url(#s05-floor)" />
      <rect x={-400} y={806} width={2720} height={10} fill="#3a2214" opacity={0.7} />
      {/* alpana by the threshold */}
      <g transform="translate(1700, 1000) scale(1.3, 0.38)" opacity={0.55}>
        <circle r={120} fill="none" stroke="#f6ead2" strokeWidth={6} strokeDasharray="14 10" />
        {Array.from({ length: 8 }, (_, i) => (
          <ellipse key={i} cx={0} cy={-62} rx={18} ry={36} fill="none" stroke="#f6ead2" strokeWidth={5} transform={`rotate(${i * 45})`} />
        ))}
      </g>
    </g>
  );
};

/** Woven madur (mat) seen in perspective. */
export const Madur: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M -360 -60 L 360 -60 L 420 70 L -420 70 Z" fill="#c9a060" />
    {Array.from({ length: 13 }, (_, i) => (
      <line key={i} x1={-360 + i * 60} y1={-60} x2={-420 + i * 70} y2={70} stroke="#a87c40" strokeWidth={3} opacity={0.6} />
    ))}
    {[-30, 10, 45].map((yy) => (
      <line key={yy} x1={-380} y1={yy} x2={380} y2={yy} stroke="#8a2a1c" strokeWidth={5} opacity={0.55} />
    ))}
    <path d="M -360 -60 L 360 -60 L 420 70 L -420 70 Z" fill="none" stroke="#7a5428" strokeWidth={4} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Monsoon rain + lightning                                            */
/* ------------------------------------------------------------------ */

export const Rain: React.FC<{
  f: number;
  n?: number;
  seed?: number;
  wind?: number;
  o?: number;
  len?: number;
  speed?: number;
  area?: [number, number, number, number];
  color?: string;
  width?: number;
}> = ({ f, n = 260, seed = 1, wind = 0.22, o = 1, len = 52, speed = 62, area = [-400, -400, 2720, 1700], color = "#d4e2f2", width = 1.7 }) => {
  const [ax, ay, aw, ah] = area;
  return (
    <g opacity={o}>
      {Array.from({ length: n }, (_, i) => {
        const x0 = ax + hash(i * 1.7 + seed) * aw;
        const sp = speed * (0.8 + hash(i * 5.3 + seed) * 0.45);
        const y = ay + ((hash(i * 3.1 + seed) * ah + f * sp) % ah);
        const x = x0 + (y - ay) * wind;
        const a = 0.25 + hash(i * 9.7 + seed) * 0.35;
        return <line key={i} x1={x} y1={y} x2={x - wind * len} y2={y - len} stroke={color} strokeWidth={width} opacity={a} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Splash rings on wet ground in the band [y0, y1]. */
export const Splashes: React.FC<{ f: number; n?: number; seed?: number; y0?: number; y1?: number; x0?: number; x1?: number; o?: number }> = ({
  f,
  n = 50,
  seed = 3,
  y0 = 820,
  y1 = 1080,
  x0 = -300,
  x1 = 2220,
  o = 1,
}) => (
  <g opacity={o}>
    {Array.from({ length: n }, (_, i) => {
      const period = 10 + Math.floor(hash(i * 2.3 + seed) * 8);
      const k = Math.floor((f + hash(i * 7.1) * period) / period);
      const p = ((f + hash(i * 7.1) * period) % period) / period;
      const x = x0 + hash(i * 3.7 + k * 1.31 + seed) * (x1 - x0);
      const y = y0 + hash(i * 5.9 + k * 2.17 + seed) * (y1 - y0);
      const r = 4 + p * 20 * (0.6 + (y - y0) / (y1 - y0));
      return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.3} fill="none" stroke="#c8d8ec" strokeWidth={1.4} opacity={(1 - p) * 0.55} />;
    })}
  </g>
);

/** 0..1 lightning flash level at frame f (double-strobe after each strike). */
export const lightning = (f: number, strikes: number[]) =>
  strikes.reduce((m, s) => {
    const d = f - s;
    if (d < 0) return m;
    const v = Math.exp(-d / 2.2) + (d >= 4 ? 0.6 * Math.exp(-(d - 4) / 2.5) : 0);
    return Math.max(m, clamp(v));
  }, 0);

/** Forked bolt, visible for a few frames after a strike. */
export const Bolt: React.FC<{ f: number; at: number; x: number; y0?: number; y1?: number; seed?: number }> = ({ f, at, x, y0 = -200, y1 = 420, seed = 1 }) => {
  const d = f - at;
  if (d < 0 || d > 6) return null;
  const segs = 9;
  let px = x;
  let pts = `M ${x} ${y0}`;
  const fork: string[] = [];
  for (let i = 1; i <= segs; i++) {
    px += (hash(i * 3.3 + seed) - 0.5) * 90;
    const py = y0 + ((y1 - y0) * i) / segs;
    pts += ` L ${px} ${py}`;
    if (i === 4 || i === 6) fork.push(`M ${px} ${py} l ${(hash(i + seed) - 0.5) * 160} ${70 + hash(i * 2 + seed) * 60}`);
  }
  const o = d < 2 ? 1 : d < 4 ? 0.5 : 0.8 * (1 - (d - 4) / 2);
  return (
    <g opacity={o} style={{ mixBlendMode: "screen" }}>
      <path d={pts} stroke="#a8c4ff" strokeWidth={14} fill="none" opacity={0.35} strokeLinejoin="round" />
      <path d={pts} stroke="#ffffff" strokeWidth={4} fill="none" strokeLinejoin="round" />
      {fork.map((p, i) => (
        <path key={i} d={p} stroke="#e8f0ff" strokeWidth={2.5} fill="none" />
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Kosthi: North-Indian style horoscope chart on a paper scroll         */
/* ------------------------------------------------------------------ */

// house centres in a 400×400 chart (North-Indian diamond layout), house 1 = top centre
const HOUSES: [number, number][] = [
  [200, 100], [100, 40], [40, 100], [100, 200], [40, 300], [100, 360],
  [200, 300], [300, 360], [360, 300], [300, 200], [360, 100], [300, 40],
];
const PLANETS = [
  { g: "র", house: 1 }, // রবি
  { g: "চ", house: 4 }, // চন্দ্র
  { g: "ম", house: 7 }, // মঙ্গল
  { g: "বু", house: 2 }, // বুধ
  { g: "বৃ", house: 6 }, // বৃহস্পতি
  { g: "শু", house: 12 }, // শুক্র
  { g: "শ", house: 9 }, // শনি
  { g: "রা", house: 3 }, // রাহু
  { g: "কে", house: 8 }, // কেতু
];
const YOGA_HOUSE = 10; // four planets gather in the 10th: pravrajya (sannyas) yoga
const YOGA_SET = [1, 4, 6, 8]; // চ বৃ শু শ  (indices into PLANETS)

export const KosthiChart: React.FC<{ f: number; x: number; y: number; s?: number; reveal: number; yoga: number; pointAt?: number }> = ({ f, x, y, s = 1, reveal, yoga, pointAt = -1 }) => {
  const ink = "#5a2a14";
  const [hx, hy] = HOUSES[YOGA_HOUSE - 1];
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {/* paper with rolled ends */}
      <rect x={-40} y={-30} width={480} height={460} rx={8} fill="#efe0bc" />
      <rect x={-40} y={-30} width={480} height={460} rx={8} fill="#c9a060" opacity={0.18} />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={-20 + hash(i * 3.1) * 440} cy={-10 + hash(i * 5.3) * 420} r={8 + hash(i) * 16} fill="#b08040" opacity={0.08} />
      ))}
      <rect x={-56} y={-40} width={26} height={480} rx={13} fill="#d9c49a" />
      <rect x={430} y={-40} width={26} height={480} rx={13} fill="#d9c49a" />
      {/* chart lines */}
      <g stroke={ink} strokeWidth={3} fill="none">
        <rect x={0} y={0} width={400} height={400} />
        <line x1={0} y1={0} x2={400} y2={400} />
        <line x1={400} y1={0} x2={0} y2={400} />
        <path d="M 200 0 L 400 200 L 200 400 L 0 200 Z" />
      </g>
      {/* house numbers */}
      {HOUSES.map(([cx, cy], i) => (
        <text key={i} x={cx} y={cy + 32} fontSize={14} fill={ink} opacity={0.45} textAnchor="middle" fontFamily={BN_FONT}>
          {"১২৩৪৫৬৭৮৯"[i] ?? ["১০", "১১", "১২"][i - 9]}
        </text>
      ))}
      {/* yoga glow in the 10th house */}
      {yoga > 0.01 && (
        <g opacity={yoga}>
          <path d="M 400 0 L 400 400 L 200 200 Z" fill="#ffb347" opacity={0.25 + 0.1 * Math.sin(f * 0.2)} transform="translate(-0, 0)" />
          <circle cx={hx} cy={hy} r={70 + 6 * Math.sin(f * 0.15)} fill="none" stroke="#e8902a" strokeWidth={4} />
          <circle cx={hx} cy={hy} r={92} fill="none" stroke="#e8902a" strokeWidth={1.5} strokeDasharray="4 10" transform={`rotate(${f * 0.8}, ${hx}, ${hy})`} />
        </g>
      )}
      {/* planets: appear one by one, then four gather into the 10th house */}
      {PLANETS.map((p, i) => {
        const on = clamp(reveal * PLANETS.length - i);
        if (on <= 0) return null;
        const yi = YOGA_SET.indexOf(i);
        const [px, py] = HOUSES[p.house - 1];
        const t = yi >= 0 ? clamp(yoga * 1.4 - yi * 0.12) : 0;
        const e = t * t * (3 - 2 * t);
        const tx = hx - 22 + (yi % 2) * 44;
        const ty = hy - 22 + Math.floor(yi / 2) * 40;
        const gx = px + (tx - px) * e + (yi < 0 ? (i % 2 ? 14 : -14) : 0) * (1 - e);
        const gy = py + (ty - py) * e - 6;
        return (
          <g key={i} opacity={on} transform={`translate(${gx}, ${gy}) scale(${0.6 + on * 0.4})`}>
            {yi >= 0 && e > 0.5 && <circle r={20} fill="#ffb347" opacity={0.35} />}
            <text x={0} y={8} fontSize={26} fontWeight={700} fill={yi >= 0 && e > 0.5 ? "#a8420c" : ink} textAnchor="middle" fontFamily={BN_FONT}>
              {p.g}
            </text>
          </g>
        );
      })}
      {/* the astrologer's finger, tracing houses */}
      {pointAt >= 0 && (
        <g transform={`translate(${HOUSES[Math.floor(pointAt) % 12][0] + 18}, ${HOUSES[Math.floor(pointAt) % 12][1] + 30})`}>
          <path d="M 0 0 q 10 -6 14 6 l 40 70 q -14 14 -30 10 l -30 -70 Z" fill="#d9a07a" />
          <path d="M 2 4 q 6 -4 9 3" stroke="#b47853" strokeWidth={2} fill="none" />
          <rect x={10} y={60} width={60} height={70} rx={20} fill="#efe6d2" transform="rotate(-24, 30, 80)" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Shadow-play on the wall: Daksha's yajna undone by Mahadev            */
/* (respectful: Mahadev only as a tall silhouette with trishul)         */
/* ------------------------------------------------------------------ */

export const DakshaShadow: React.FC<{ f: number; k: number; x?: number; y?: number; s?: number }> = ({ f, k, x = 1450, y = 620, s = 1 }) => {
  if (k <= 0.01) return null;
  const step = clamp((k - 0.35) / 0.4); // Mahadev strides in
  const burst = clamp((k - 0.7) / 0.3); // the yajna fire scatters
  const ink = "#1a0c06";
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={Math.min(1, k * 1.6)}>
      {/* fire-glow cast behind the shadows */}
      <ellipse cx={0} cy={-120} rx={380} ry={280} fill="#ff8a3c" opacity={0.07 + 0.04 * flicker(f, 3)} style={{ mixBlendMode: "screen" }} />
      {/* canopy poles + rope of the yajna-shala */}
      <g fill={ink} opacity={0.86}>
        <rect x={-250} y={-330} width={10} height={330} />
        <rect x={160} y={-330} width={10} height={330} />
        <path d="M -260 -330 Q -45 -290 175 -330 L 175 -320 Q -45 -280 -260 -320 Z" />
        {/* vedi (stepped altar) */}
        <path d="M -140 0 L -140 -40 L -110 -40 L -110 -70 L 30 -70 L 30 -40 L 60 -40 L 60 0 Z" />
        {/* the yajna flames (tilting and scattering on the burst) */}
        {Array.from({ length: 5 }, (_, i) => {
          const fx = -70 + i * 28 + burst * (i - 2) * 60;
          const fy = -70 - burst * (40 + hash(i) * 80);
          const h = 60 + Math.sin(f * 0.4 + i) * 10;
          return <path key={i} d={`M ${fx - 12} ${fy} Q ${fx - 16} ${fy - h * 0.6} ${fx} ${fy - h} Q ${fx + 16} ${fy - h * 0.6} ${fx + 12} ${fy} Z`} transform={`rotate(${burst * (i - 2) * 25}, ${fx}, ${fy})`} />;
        })}
        {/* Daksha, seated by the fire with a ladle (cowers back on the burst) */}
        <g transform={`translate(${-210 - burst * 40}, 0) rotate(${-burst * 18})`}>
          <ellipse cx={0} cy={-30} rx={34} ry={30} />
          <rect x={-22} y={-100} width={44} height={70} rx={18} />
          <circle cx={4} cy={-118} r={20} />
          <path d={`M 14 -86 L 70 ${-110 + burst * 30}`} stroke={ink} strokeWidth={8} />
        </g>
        {/* Mahadev: tall silhouette with jata and trishul, striding in from the right */}
        <g transform={`translate(${360 - step * 170}, 0)`}>
          <path d="M -26 0 L -16 -150 L 16 -150 L 30 0 L 14 0 L 4 -110 L -8 0 Z" />
          <path d="M -40 -150 Q -46 -240 0 -260 Q 46 -240 40 -150 Z" />
          <circle cx={0} cy={-284} r={24} />
          {/* jata (matted locks) piled high, a crescent moon */}
          <path d="M -22 -296 Q -30 -340 0 -350 Q 30 -340 22 -296 Z" />
          <path d="M 10 -352 a 12 12 0 1 0 14 10 a 9 9 0 1 1 -14 -10 Z" />
          {/* arm raising the trishul */}
          <path d={`M 34 -236 L ${70 + burst * 10} ${-300 - burst * 20}`} stroke={ink} strokeWidth={14} strokeLinecap="round" />
          <g transform={`translate(${74 + burst * 10}, ${-300 - burst * 20})`}>
            <rect x={-4} y={-150} width={8} height={300} />
            <path d="M -30 -150 Q -30 -190 -20 -200 Q -18 -170 -6 -160 L -4 -200 L 0 -220 L 4 -200 L 6 -160 Q 18 -170 20 -200 Q 30 -190 30 -150 Z" />
            {/* damaru */}
            <path d="M -16 -110 L 16 -90 L 16 -110 L -16 -90 Z" />
          </g>
        </g>
      </g>
      {/* scattered sparks on the burst */}
      {burst > 0 &&
        Array.from({ length: 16 }, (_, i) => {
          const a = -Math.PI * (0.1 + hash(i * 2.3) * 0.8);
          const r = burst * (80 + hash(i * 4.1) * 220);
          return <circle key={i} cx={-40 + Math.cos(a) * r} cy={-100 + Math.sin(a) * r + burst * burst * 60} r={3 + hash(i) * 3} fill="#ffb04a" opacity={(1 - burst) * 0.9 + 0.1} />;
        })}
      {/* faint drift so the shadow-play feels lamp-cast */}
      <g opacity={0.12 + 0.05 * noise1(f * 0.05, 4)} />
    </g>
  );
};
