import React from "react";
import { clamp, flicker, hash, noise1, TAU } from "../core/anim";

/* ------------------------------------------------------------------ */
/* Glow + flame                                                        */
/* ------------------------------------------------------------------ */

export const GlowDefs: React.FC = () => (
  <defs>
    <radialGradient id="fx-glow-warm">
      <stop offset="0%" stopColor="#fff3c4" stopOpacity={0.95} />
      <stop offset="22%" stopColor="#ffc35a" stopOpacity={0.55} />
      <stop offset="60%" stopColor="#ff8a2a" stopOpacity={0.14} />
      <stop offset="100%" stopColor="#ff6a10" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="fx-glow-soft">
      <stop offset="0%" stopColor="#ffd890" stopOpacity={0.45} />
      <stop offset="100%" stopColor="#ff9a40" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="fx-glow-white">
      <stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
      <stop offset="35%" stopColor="#fff6d0" stopOpacity={0.5} />
      <stop offset="100%" stopColor="#ffd070" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="fx-flame" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor="#ff7a1a" />
      <stop offset="45%" stopColor="#ffc53d" />
      <stop offset="100%" stopColor="#fff8d8" />
    </linearGradient>
    <radialGradient id="fx-smoke">
      <stop offset="0%" stopColor="#d8d0e0" stopOpacity={0.35} />
      <stop offset="100%" stopColor="#d8d0e0" stopOpacity={0} />
    </radialGradient>
  </defs>
);

export const Glow: React.FC<{ x: number; y: number; r: number; o?: number; kind?: "warm" | "soft" | "white" }> = ({
  x,
  y,
  r,
  o = 1,
  kind = "warm",
}) => <circle cx={x} cy={y} r={r} fill={`url(#fx-glow-${kind})`} opacity={o} />;

/** Teardrop flame with flicker; `life` 0..1 shrinks it (guttering). */
export const Flame: React.FC<{ x: number; y: number; s?: number; f: number; seed?: number; life?: number; glow?: boolean }> = ({
  x,
  y,
  s = 1,
  f,
  seed = 0,
  life = 1,
  glow = true,
}) => {
  if (life <= 0.01) return null;
  const k = flicker(f, seed) * life;
  const lean = noise1(f * 0.25, seed) * 3 * s;
  const h = 16 * s * k;
  const w = 5.5 * s * (0.8 + 0.2 * life);
  return (
    <g transform={`translate(${x}, ${y})`}>
      {glow && <circle cx={0} cy={-h * 0.4} r={46 * s * k} fill="url(#fx-glow-warm)" opacity={0.55 * life} />}
      <path d={`M ${-w} 0 Q ${-w} ${-h * 0.5} ${lean} ${-h} Q ${w} ${-h * 0.5} ${w} 0 Q 0 ${w * 0.8} ${-w} 0 Z`} fill="url(#fx-flame)" />
      <ellipse cx={lean * 0.3} cy={-h * 0.25} rx={w * 0.4} ry={h * 0.22} fill="#ffffff" opacity={0.85} />
    </g>
  );
};

/** Clay diya with flame. */
export const Diya: React.FC<{ x: number; y: number; s?: number; f: number; seed?: number; life?: number; glow?: boolean }> = ({
  x,
  y,
  s = 1,
  f,
  seed = 0,
  life = 1,
  glow = true,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    {glow && life > 0 && <ellipse cx={0} cy={4} rx={60 * life} ry={16 * life} fill="url(#fx-glow-soft)" />}
    <path d="M -15 -2 Q -14 9 0 10 Q 14 9 15 -2 Q 8 2 0 2 Q -8 2 -15 -2 Z" fill="#a4522a" />
    <path d="M -15 -2 Q 0 -6 15 -2 Q 8 2 0 2 Q -8 2 -15 -2 Z" fill="#6a2f16" />
    <path d="M 13 -3 Q 18 -7 17 -2 Z" fill="#a4522a" />
    <Flame x={14} y={-4} s={0.9} f={f} seed={seed} life={life} glow={false} />
  </g>
);

/** Wispy rising smoke ribbon (e.g. after a diya gutters out). */
export const Smoke: React.FC<{ x: number; y: number; f: number; start: number; seed?: number; s?: number }> = ({
  x,
  y,
  f,
  start,
  seed = 0,
  s = 1,
}) => {
  const age = f - start;
  if (age < 0 || age > 90) return null;
  const o = clamp(age / 8) * clamp((90 - age) / 40);
  const pts = Array.from({ length: 7 }, (_, i) => {
    const k = i / 6;
    const yy = -k * (30 + age * 1.3) * s;
    const xx = noise1(k * 3 + age * 0.05, seed) * 14 * s * k + Math.sin(k * 5 + age * 0.08) * 5 * s * k;
    return `${xx.toFixed(1)},${yy.toFixed(1)}`;
  });
  return (
    <polyline
      transform={`translate(${x}, ${y})`}
      points={pts.join(" ")}
      fill="none"
      stroke="#cfc6d8"
      strokeWidth={3 * s}
      strokeLinecap="round"
      opacity={0.35 * o}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Spark emitter (sparklers, charkhi, tubri, choke-spray)              */
/* ------------------------------------------------------------------ */

export interface EmitterCfg {
  rate: number; // particles per frame
  life: number; // frames
  speed: [number, number];
  angle: [number, number]; // radians, 0 = +x, -PI/2 = up
  gravity: number;
  drag?: number;
  colors?: string[];
  width?: number;
  streak?: number;
}

export const Sparks: React.FC<{
  f: number;
  start?: number;
  end?: number;
  cfg: EmitterCfg;
  seed?: number;
  gravityRot?: number; // deg: counter-rotate gravity when emitter is inside a rotated group
  spin?: number; // rad/frame emitter rotation (charkhi)
  scale?: number;
}> = ({ f, start = -1e9, end = 1e9, cfg, seed = 1, gravityRot = 0, spin = 0, scale = 1 }) => {
  const out: React.ReactNode[] = [];
  const gr = (-gravityRot * Math.PI) / 180;
  const gx = Math.sin(-gr) * cfg.gravity;
  const gy = Math.cos(gr) * cfg.gravity;
  const drag = cfg.drag ?? 0.94;
  const cols = cfg.colors ?? ["#ffffff", "#fff3a8", "#ffcf4a", "#ff9a2a"];
  const firstBirth = Math.max(start, Math.floor(f - cfg.life));
  for (let b = Math.floor(firstBirth); b <= Math.min(f, end); b++) {
    const n = Math.floor(cfg.rate + hash(b * 1.7 + seed) * (cfg.rate % 1 === 0 ? 0.999 : 1));
    for (let i = 0; i < n; i++) {
      const id = b * 31 + i * 7 + seed * 101;
      const age = f - b;
      if (age < 0 || age > cfg.life) continue;
      const ang = cfg.angle[0] + (cfg.angle[1] - cfg.angle[0]) * hash(id) + spin * b;
      const sp = (cfg.speed[0] + (cfg.speed[1] - cfg.speed[0]) * hash(id + 3)) * scale;
      const lifeK = 1 - age / cfg.life;
      // integrate with drag analytically
      const decay = (1 - Math.pow(drag, age)) / (1 - drag);
      const decayPrev = (1 - Math.pow(drag, Math.max(0, age - (cfg.streak ?? 1.5)))) / (1 - drag);
      const px = Math.cos(ang) * sp * decay + 0.5 * gx * age * age * scale;
      const py = Math.sin(ang) * sp * decay + 0.5 * gy * age * age * scale;
      const ap = Math.max(0, age - (cfg.streak ?? 1.5));
      const qx = Math.cos(ang) * sp * decayPrev + 0.5 * gx * ap * ap * scale;
      const qy = Math.sin(ang) * sp * decayPrev + 0.5 * gy * ap * ap * scale;
      const col = cols[Math.min(cols.length - 1, Math.floor((1 - lifeK) * cols.length))];
      out.push(
        <line
          key={id}
          x1={qx}
          y1={qy}
          x2={px}
          y2={py}
          stroke={col}
          strokeWidth={(cfg.width ?? 2) * scale * (0.5 + lifeK * 0.7)}
          strokeLinecap="round"
          opacity={clamp(lifeK * 1.4) * (hash(id + age) > 0.12 ? 1 : 0.3)}
        />,
      );
    }
  }
  return <g>{out}</g>;
};

/** Lit sparkler (phuljhuri) held in a hand; place inside the hand's prop slot. */
export const Sparkler: React.FC<{ f: number; worldRot: number; lit?: boolean; seed?: number; len?: number; s?: number }> = ({
  f,
  worldRot,
  lit = true,
  seed = 1,
  len = 62,
  s = 1,
}) => {
  const L = len * s;
  return (
    <g>
      <line x1={0} y1={0} x2={0} y2={L} stroke="#5d5a58" strokeWidth={2.2 * s} />
      <line x1={0} y1={L * 0.35} x2={0} y2={L} stroke="#3a2e2a" strokeWidth={3.6 * s} strokeLinecap="round" />
      {lit && (
        <g transform={`translate(0, ${L})`}>
          <circle r={34 * s * flicker(f, seed)} fill="url(#fx-glow-white)" opacity={0.85} />
          <Sparks
            f={f}
            seed={seed}
            gravityRot={worldRot}
            scale={s}
            cfg={{ rate: 9, life: 9, speed: [3, 7.5], angle: [0, TAU], gravity: 0.35, drag: 0.82, width: 1.6, streak: 1.2 }}
          />
          <circle r={3.2 * s} fill="#ffffff" />
        </g>
      )}
    </g>
  );
};

/** Bundle of paper crackers/rockets tied with string (Madhu's bajī). */
export const CrackerBundle: React.FC<{ s?: number; up?: boolean }> = ({ s = 1, up = false }) => (
  <g transform={`scale(${s}) rotate(${up ? 180 : 0})`}>
    {[-9, -3, 3, 9].map((x, i) => (
      <g key={x} transform={`rotate(${(i - 1.5) * 7})`}>
        <rect x={x - 3.4} y={-4} width={6.8} height={40} rx={1.5} fill={["#d8342c", "#2f7fc0", "#e8b31e", "#3a9b52"][i]} />
        <rect x={x - 3.4} y={8} width={6.8} height={6} fill="#fff4dc" opacity={0.85} />
        <path d={`M ${x} 36 l 0 8`} stroke="#3a2a20" strokeWidth={1.4} />
        <path d={`M ${x - 3.4} -4 L ${x} -12 L ${x + 3.4} -4 Z`} fill="#fbe9c6" />
      </g>
    ))}
    <rect x={-13} y={18} width={26} height={4} rx={2} fill="#8a5a30" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Fireworks                                                           */
/* ------------------------------------------------------------------ */

export interface Burst {
  f: number;
  x: number;
  y: number;
  r?: number;
  colors?: string[];
  n?: number;
  fromY?: number;
  kind?: "peony" | "willow" | "ring";
}

const PALETTES = [
  ["#ffffff", "#fff2a0", "#ffc23a", "#ff7a1a"],
  ["#ffffff", "#ffd1e8", "#ff5fa2", "#c2185b"],
  ["#ffffff", "#c9f4ff", "#5fd3ff", "#1e7bd8"],
  ["#ffffff", "#e3ffc9", "#8fe36a", "#2e9a3c"],
  ["#ffffff", "#f1d8ff", "#b77bff", "#6a2fd0"],
];

export const Fireworks: React.FC<{ f: number; bursts: Burst[]; scale?: number }> = ({ f, bursts, scale = 1 }) => {
  const nodes: React.ReactNode[] = [];
  bursts.forEach((b, bi) => {
    const rise = 24;
    const fromY = b.fromY ?? b.y + 420;
    const tRise = f - (b.f - rise);
    if (tRise >= 0 && tRise < rise) {
      const k = tRise / rise;
      const e = 1 - Math.pow(1 - k, 2);
      const yy = fromY + (b.y - fromY) * e;
      const xx = b.x + Math.sin(k * 6 + bi) * 4;
      nodes.push(
        <g key={`r${bi}`}>
          <line x1={xx} y1={yy + 26 * scale} x2={xx} y2={yy} stroke="#ffd790" strokeWidth={2.4 * scale} strokeLinecap="round" opacity={0.8} />
          <circle cx={xx} cy={yy} r={3 * scale} fill="#fff8de" />
        </g>,
      );
    }
    const age = f - b.f;
    const life = b.kind === "willow" ? 70 : 52;
    if (age < 0 || age > life) return;
    const cols = b.colors ?? PALETTES[bi % PALETTES.length];
    const n = b.n ?? 44;
    const R = (b.r ?? 150) * scale;
    const lifeK = 1 - age / life;
    // flash
    if (age < 6) nodes.push(<circle key={`fl${bi}`} cx={b.x} cy={b.y} r={R * 0.9 * (1 - age / 6)} fill="url(#fx-glow-white)" opacity={0.9} />);
    nodes.push(<circle key={`gl${bi}`} cx={b.x} cy={b.y} r={R * 1.6} fill="url(#fx-glow-soft)" opacity={0.6 * lifeK} />);
    for (let i = 0; i < n; i++) {
      const id = bi * 977 + i;
      const ang = (i / n) * TAU + hash(id) * 0.25;
      const ring = b.kind === "ring" ? 1 : 0.65 + hash(id + 5) * 0.35;
      const dist = (t: number) => R * ring * (1 - Math.exp(-t / 9));
      const g = (b.kind === "willow" ? 0.06 : 0.035) * scale;
      const pos = (t: number) => [b.x + Math.cos(ang) * dist(t), b.y + Math.sin(ang) * dist(t) * 0.92 + g * t * t];
      const [px, py] = pos(age);
      const [qx, qy] = pos(Math.max(0, age - (b.kind === "willow" ? 9 : 4)));
      const col = cols[Math.min(cols.length - 1, Math.floor((1 - lifeK) * cols.length * 1.1))];
      const tw = age > life * 0.6 ? (hash(id + age) > 0.5 ? 1 : 0.2) : 1;
      nodes.push(
        <line
          key={`p${id}`}
          x1={qx}
          y1={qy}
          x2={px}
          y2={py}
          stroke={col}
          strokeWidth={2.6 * scale * (0.4 + lifeK)}
          strokeLinecap="round"
          opacity={clamp(lifeK * 1.6) * tw}
        />,
      );
    }
  });
  return <g>{nodes}</g>;
};

/* ------------------------------------------------------------------ */
/* Atmosphere                                                          */
/* ------------------------------------------------------------------ */

/** Floating bokeh / embers for foreground depth. */
export const Bokeh: React.FC<{ f: number; n?: number; seed?: number; color?: string; area?: [number, number, number, number]; size?: [number, number]; rise?: number }> = ({
  f,
  n = 18,
  seed = 1,
  color = "#ffc46b",
  area = [-200, -100, 2120, 1180],
  size = [8, 26],
  rise = 0.4,
}) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const w = area[2] - area[0];
      const h = area[3] - area[1];
      const x = area[0] + ((hash(i + seed) * w + noise1(f * 0.01, i + seed) * 60) % w);
      const y = area[1] + (((hash(i * 3 + seed) * h - f * rise * (0.5 + hash(i + 9))) % h) + h) % h;
      const r = size[0] + hash(i * 7 + seed) * (size[1] - size[0]);
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(f * 0.04 + i));
      return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={0.32 * tw} />;
    })}
  </g>
);

/** Marigold (gãda) garland swag between two points. */
export const Garland: React.FC<{ x1: number; y1: number; x2: number; y2: number; sag?: number; s?: number; f?: number; seed?: number }> = ({
  x1,
  y1,
  x2,
  y2,
  sag = 60,
  s = 1,
  f = 0,
  seed = 0,
}) => {
  const n = Math.max(6, Math.floor(Math.hypot(x2 - x1, y2 - y1) / (9 * s)));
  const sway = Math.sin(f * 0.05 + seed) * sag * 0.06;
  return (
    <g>
      {Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        const x = x1 + (x2 - x1) * t + sway * Math.sin(t * Math.PI);
        const y = y1 + (y2 - y1) * t + sag * 4 * t * (1 - t);
        const c = i % 7 === 3 ? "#e23b2e" : i % 2 ? "#ff9d1c" : "#ffb62e";
        return <circle key={i} cx={x} cy={y} r={5.4 * s} fill={c} stroke="#c66a0a" strokeWidth={0.8 * s} />;
      })}
    </g>
  );
};
