import React, { useId } from "react";
import { blink, clamp, hash, lerp, noise1, safeId, TAU } from "../core/anim";
import { Hand } from "../rig/Hand";
import { Head } from "../rig/Head";
import { FACE_BABY } from "../rig/head3d";
import { MOUTH_REST } from "../rig/lipsync";

/**
 * Divine visual language toolkit — see 01_Series_Bible/divine_visual_language.md.
 * The white-gold palette below is reserved for Balak Thakur only.
 */
export const DIVINE = {
  core: "#FFF4D6",
  mid: "#FFE7AE",
  falloff: "#FFD98A",
  deep: "#F2B65A",
};

/** Shared gradient defs; place once per <Layer>. */
export const DivineDefs: React.FC = () => (
  <defs>
    <radialGradient id="dv-glow">
      <stop offset="0%" stopColor={DIVINE.core} stopOpacity={0.95} />
      <stop offset="30%" stopColor={DIVINE.mid} stopOpacity={0.5} />
      <stop offset="65%" stopColor={DIVINE.falloff} stopOpacity={0.14} />
      <stop offset="100%" stopColor={DIVINE.falloff} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="dv-soft">
      <stop offset="0%" stopColor={DIVINE.core} stopOpacity={0.5} />
      <stop offset="100%" stopColor={DIVINE.falloff} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="dv-ray" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={DIVINE.core} stopOpacity={0} />
      <stop offset="25%" stopColor={DIVINE.core} stopOpacity={0.55} />
      <stop offset="100%" stopColor={DIVINE.falloff} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="dv-beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={DIVINE.core} stopOpacity={0.6} />
      <stop offset="70%" stopColor={DIVINE.mid} stopOpacity={0.2} />
      <stop offset="100%" stopColor={DIVINE.falloff} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="dv-petal-pink" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor="#F2A9B8" stopOpacity={0.9} />
      <stop offset="55%" stopColor="#FFE9EE" stopOpacity={0.95} />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity={1} />
    </linearGradient>
    <linearGradient id="dv-petal" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stopColor={DIVINE.deep} stopOpacity={0.9} />
      <stop offset="60%" stopColor={DIVINE.mid} stopOpacity={0.95} />
      <stop offset="100%" stopColor="#FFFFFF" stopOpacity={1} />
    </linearGradient>
  </defs>
);

/** Rising golden motes. */
export const Motes: React.FC<{ f: number; x: number; y: number; n: number; spread: number; rise?: number; seed?: number; o?: number }> = ({
  f,
  x,
  y,
  n,
  spread,
  rise = 160,
  seed = 1,
  o = 1,
}) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const life = 90 + hash(i + seed) * 60;
      const t = ((f + hash(i * 3 + seed) * life) % life) / life;
      const px = x + (hash(i * 7 + seed) - 0.5) * spread + noise1(f * 0.02 + i, seed) * 18;
      const py = y - t * rise - hash(i * 5) * 20;
      const a = Math.sin(t * Math.PI) * o;
      const r = 1.6 + hash(i * 11 + seed) * 2.6;
      return (
        <g key={i} opacity={a}>
          <circle cx={px} cy={py} r={r * 3.2} fill="url(#dv-soft)" />
          <circle cx={px} cy={py} r={r} fill={DIVINE.core} />
        </g>
      );
    })}
  </g>
);

/** Aura at intensity `level` 0..3 (continuous, so transitions are smooth). */
export const DivineAura: React.FC<{ f: number; x: number; y: number; level: number; s?: number }> = ({ f, x, y, level, s = 1 }) => {
  if (level <= 0.01) return null;
  const L1 = clamp(level);
  const L2 = clamp(level - 1);
  const L3 = clamp(level - 2);
  const breathe = 1 + Math.sin(f * 0.05) * 0.05;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {/* L1: soft halo + motes */}
      <circle r={(110 + L2 * 80 + L3 * 110) * breathe} fill="url(#dv-glow)" opacity={0.35 * L1 + 0.3 * L2 + 0.15 * L3} />
      <circle r={70 * breathe} fill="none" stroke={DIVINE.mid} strokeWidth={1.4} opacity={0.35 * L1} />
      <Motes f={f} x={0} y={30} n={Math.round(6 + 10 * L2 + 12 * L3)} spread={180 + 120 * L3} rise={140 + 120 * L2} o={L1} seed={3} />
      {/* L2: slow rotating rays */}
      {L2 > 0.01 && (
        <g transform={`rotate(${f * 0.15})`} opacity={L2 * 0.55}>
          {Array.from({ length: 16 }, (_, i) => {
            const len = 230 + (i % 3) * 70 + L3 * 160;
            return (
              <path
                key={i}
                d={`M -6 0 L 6 0 L 2 ${-len} L -2 ${-len} Z`}
                fill="url(#dv-ray)"
                transform={`rotate(${(i / 16) * 360})`}
                opacity={0.5 + 0.5 * Math.abs(Math.sin(f * 0.03 + i))}
              />
            );
          })}
        </g>
      )}
      {/* L3: expanding rings */}
      {L3 > 0.01 &&
        [0, 1, 2].map((k) => {
          const t = ((f * 0.6 + k * 40) % 120) / 120;
          return (
            <circle key={k} r={80 + t * 420} fill="none" stroke={DIVINE.core} strokeWidth={2.4 * (1 - t)} opacity={L3 * (1 - t) * 0.7} />
          );
        })}
    </g>
  );
};

/** God-rays descending from above toward (x, groundY). */
export const SacredLight: React.FC<{ f: number; x: number; groundY: number; intensity: number; width?: number }> = ({
  f,
  x,
  groundY,
  intensity,
  width = 520,
}) => {
  if (intensity <= 0.01) return null;
  return (
    <g opacity={intensity}>
      {Array.from({ length: 7 }, (_, i) => {
        const k = i / 6 - 0.5;
        const sway = Math.sin(f * 0.02 + i) * 14;
        const topX = x + k * width * 1.8 + sway;
        const w = 40 + hash(i) * 70;
        return (
          <path
            key={i}
            d={`M ${topX - w} -400 L ${topX + w} -400 L ${x + k * width * 0.35 + w * 0.5} ${groundY} L ${x + k * width * 0.35 - w * 0.5} ${groundY} Z`}
            fill="url(#dv-beam)"
            opacity={0.35 + 0.25 * Math.abs(Math.sin(f * 0.025 + i * 1.7))}
          />
        );
      })}
      <ellipse cx={x} cy={groundY} rx={width * 0.7} ry={width * 0.12} fill="url(#dv-glow)" opacity={0.7} />
      <Motes f={f} x={x} y={groundY} n={26} spread={width} rise={520} seed={9} o={1} />
    </g>
  );
};

/** Lotus of light on the ground (drawn in perspective). bloom 0 = bud, 1 = open. */
export const LotusOfLight: React.FC<{ f: number; x: number; y: number; bloom: number; s?: number; pink?: boolean }> = ({ f, x, y, bloom, s = 1, pink = false }) => {
  if (bloom <= 0.01) return null;
  const b = clamp(bloom);
  const petalFill = pink ? "url(#dv-petal-pink)" : "url(#dv-petal)";
  const petals = (n: number, len: number, wid: number, spread: number, rot: number, o: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = rot + (i / n) * 360;
      const open = lerp(0.25, 1, b) * spread;
      return (
        <path
          key={i}
          d={`M 0 0 Q ${-wid} ${-len * 0.45} 0 ${-len} Q ${wid} ${-len * 0.45} 0 0 Z`}
          fill={petalFill}
          opacity={o}
          transform={`rotate(${a}) scale(${open}, ${open})`}
        />
      );
    });
  return (
    <g transform={`translate(${x}, ${y}) scale(${s}, ${s * 0.38})`}>
      <circle r={320 * b} fill="url(#dv-glow)" opacity={0.8 * b} />
      <g transform={`rotate(${f * 0.05})`}>{petals(12, 230, 62, 1, 15, 0.55 * b)}</g>
      {petals(8, 170, 58, 1, 0, 0.85 * b)}
      {petals(8, 110, 44, 1, 22.5, 0.95 * b)}
      <circle r={36 * b} fill={DIVINE.core} />
    </g>
  );
};

/**
 * Level-3 time warp: maps real frame → world frame. Between `from` and `to` the
 * world slows to `slow` speed (eased in/out over `ease` frames). Integrated so motion stays continuous.
 */
export function timeWarp(f: number, from: number, to: number, slow = 0.12, ease = 36): number {
  const speed = (t: number) => {
    if (t < from) return 1;
    if (t < from + ease) return lerp(1, slow, (t - from) / ease);
    if (t < to - ease) return slow;
    if (t < to) return lerp(slow, 1, (t - (to - ease)) / ease);
    return 1;
  };
  if (f <= from) return f;
  let w = from;
  for (let t = from; t < f; t++) w += speed(t);
  return w;
}

/* ------------------------------------------------------------------ */
/* Newborn Balak Thakur                                                */
/* ------------------------------------------------------------------ */

/** Signature divine catchlight — a soft 4-point star + faint ring. Only Balak Thakur has this. */
export const DivineCatchlight: React.FC<{ x: number; y: number; r: number; f: number }> = ({ x, y, r, f }) => {
  const tw = 0.85 + 0.15 * Math.sin(f * 0.08);
  return (
    <g transform={`translate(${x}, ${y})`} opacity={tw}>
      <path d={`M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`} fill="#FFFFFF" />
      <circle r={r * 1.5} fill="none" stroke={DIVINE.mid} strokeWidth={r * 0.18} opacity={0.6} />
    </g>
  );
};


export interface BabyMotion {
  /** velocity of the bundle (px/frame, deg/frame) — drives follow-through when he is carried */
  dx: number;
  dy: number;
  drot: number;
}

/**
 * Newborn Balak Thakur lying on his back (চিৎ হয়ে), gently moving hands and legs,
 * a piece of cloth over his belly and lower body. "Divine movement" (bible §2):
 *  - layered, unsynchronised slow motion (breath, limbs, head drift, gaze) — nothing loops in lockstep
 *  - follow-through when carried (head and limbs lag and settle)
 *  - `bless` 0..1: the near hand slowly rises into abhaya mudra with light in the palm
 *  - `float` 0..1: gentle levitation over the lotus; `wiggle` 0..1: how much the limbs move
 * Origin ≈ centre of the body; the head is at the left.
 */
export const BabyThakur: React.FC<{
  f: number;
  x: number;
  y: number;
  s?: number;
  open?: number;
  aura?: number;
  lookX?: number;
  lookY?: number;
  turn?: number;
  smile?: number;
  bless?: number;
  float?: number;
  rot?: number;
  wiggle?: number;
  motion?: BabyMotion;
  /** head roll relative to the body: −48 lying on his back, ≈ −15 when cradled in arms */
  headRoll?: number;
}> = ({ f, x, y, s = 1, open = 0, aura = 1, lookX = 0, lookY = 0, turn = 0, smile = 0.3, bless = 0, float = 0, rot = 0, wiggle = 1, motion, headRoll = -48 }) => {
  const uid = safeId(useId());
  const mv = motion ?? { dx: 0, dy: 0, drot: 0 };
  // skin tones follow the reference portrait: warm, softly lit
  const skin = "#EDBE98";
  const skinLight = "#F8D6B8";
  const shade = "#C98E68";
  const cloth = "#FFFDF7";
  const clothShade = "#E9E0D0";
  const hx = -50;
  const hy = -10;

  // --- layered organic motion ---
  const breath = Math.sin((f / 24) * TAU * 0.3); // babies breathe a little faster
  const flY = float * (-10 + Math.sin(f * 0.045) * 6 + noise1(f * 0.012, 2) * 3);
  const flR = float * (Math.sin(f * 0.031 + 1) * 1.4);
  const bodyRot = rot + flR + clamp(mv.drot * 0.6, -6, 6);
  // supine head roll: crown toward the cushion, face turned up; slow, unsynchronised drift
  const tilt = headRoll + noise1(f * 0.012, 3) * 3 + Math.sin(f * 0.021) * 1 - clamp(mv.drot * 0.9 + mv.dx * 0.12, -9, 9);
  const t = clamp(turn + noise1(f * 0.009, 7) * 0.22, -1, 1);
  const nod = noise1(f * 0.014, 5) * 1.2 + breath * 0.4 - clamp(mv.dy * 0.15, -3, 3);
  const lagX = clamp(-mv.dx * 0.25, -5, 5);
  // gaze is given in WORLD space (lookY < 0 = up the screen); a lying newborn rests looking upward
  const wgx = lookX + noise1(f * 0.013, 11) * 0.22;
  const wgy = lookY - 0.28 + noise1(f * 0.011, 13) * 0.12;
  const th = (-(tilt + bodyRot) * Math.PI) / 180; // world → head-local
  const gx = clamp(wgx * Math.cos(th) - wgy * Math.sin(th), -0.85, 0.85);
  const gy = clamp(wgx * Math.sin(th) + wgy * Math.cos(th), -0.22, 0.6); // never roll the iris under the lid
  const bl = blink(f * 0.35, 97); // slower, calmer blinks
  const sm = clamp(smile + noise1(f * 0.02, 17) * 0.06);
  const close = clamp(1 - open * 0.9 * (1 - bl));
  const w = wiggle;
  const nz = (k: number, sp = 0.03) => noise1(f * sp + k * 7.3, 60 + k); // per-limb slow noise
  const b = clamp(bless);
  const be = b * b * (3 - 2 * b);

  // chubby tapered limb along +y with a soft crease (baby wrist / knee rolls)
  const limb = (len: number, w1: number, w2: number, col: string) => (
    <g>
      <path d={`M ${-w1} 0 Q ${-w1 * 1.15} ${len * 0.5} ${-w2} ${len} A ${w2} ${w2} 0 0 0 ${w2} ${len} Q ${w1 * 1.15} ${len * 0.5} ${w1} 0 A ${w1} ${w1} 0 0 0 ${-w1} 0 Z`} fill={col} />
      <path d={`M ${-w2 * 0.8} ${len * 0.92} Q 0 ${len * 0.98} ${w2 * 0.8} ${len * 0.92}`} stroke={shade} strokeWidth={0.9} fill="none" opacity={0.55} />
    </g>
  );

  // arms: angles in degrees, arm drawn along +y then rotated (positive = clockwise)
  const arm = (near: boolean) => {
    const sh = near ? { x: -20, y: 12 } : { x: -14, y: -12 };
    const a1 = near ? lerp(-96 + nz(1) * 8 * w, -152, be) /* resting arm beside the body */ : -118 + nz(2) * 34 * w;
    const a2 = near ? lerp(-30 + nz(3) * 6 * w, 26, be) : -48 + nz(4) * 36 * w;
    const col = near ? skin : shade;
    return (
      <g transform={`translate(${sh.x + lagX * 0.3}, ${sh.y + breath * 0.6}) rotate(${a1})`}>
        {limb(19, 7.5, 6.2, col)}
        <g transform={`translate(0, 19) rotate(${a2})`}>
          {limb(16, 6.2, 5.2, col)}
          <g transform="translate(0, 15)">
            {near && be > 0.55 && (
              <g opacity={(be - 0.55) / 0.45}>
                <circle cx={0} cy={12} r={26} fill="url(#dv-glow)" />
                <Motes f={f} x={0} y={12} n={6} spread={40} rise={-70} seed={41} />
              </g>
            )}
            <Hand
              shape={near && be > 0.4 ? "abhaya" : "relaxed"}
              L={16}
              skin={col}
              shade={shade}
              side={near ? 1 : -1}
              flex={(1 - be) * (nz(near ? 5 : 6, 0.06) * 0.5 + 0.5)}
            />
          </g>
        </g>
      </g>
    );
  };

  // legs: knees up (newborn posture), kicking slowly
  const leg = (near: boolean) => {
    const hip = near ? { x: 42, y: 10 } : { x: 38, y: -4 };
    const a1 = (near ? -132 : -146) + nz(near ? 7 : 8) * 22 * w;
    const a2 = (near ? 98 : 108) + nz(near ? 9 : 10) * 26 * w;
    const toes = nz(near ? 11 : 12, 0.08) * 14 * w;
    const col = near ? skin : shade;
    return (
      <g transform={`translate(${hip.x}, ${hip.y}) rotate(${a1})`}>
        {limb(28, 11, 8, col)}
        <g transform={`translate(0, 28) rotate(${a2})`}>
          {limb(22, 8, 6, col)}
          {/* little foot with toes */}
          <g transform={`translate(0, 22) rotate(${-70 + toes * 0.3})`}>
            <ellipse cx={0} cy={6} rx={6.2} ry={10} fill={col} />
            {[0, 1, 2, 3, 4].map((k) => (
              <circle key={k} cx={-4.5 + k * 2.3} cy={15.5 - Math.abs(k - 1.2) * 0.9 + (k === 0 ? 0 : Math.sin(f * 0.1 + k) * 0.5)} r={k === 0 ? 2 : 1.5} fill={col} transform={`rotate(${toes * (k / 4)}, 0, 14)`} />
            ))}
          </g>
        </g>
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y + flY}) rotate(${bodyRot}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}-tor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="60%" stopColor={skin} />
          <stop offset="100%" stopColor={shade} />
        </linearGradient>
        <linearGradient id={`${uid}-cl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={clothShade} />
        </linearGradient>
      </defs>
      <DivineAura f={f} x={hx} y={hy} level={aura} s={0.9} />
      {/* lifted by light, not shadow */}
      {float > 0.01 && <ellipse cx={8} cy={40 - flY * 0.3} rx={100} ry={16} fill="url(#dv-glow)" opacity={0.7 * float} />}

      {/* far limbs behind the body */}
      {arm(false)}
      {leg(false)}

      {/* chubby torso, chest rises with breath */}
      <g transform={`translate(0, 28) scale(1, ${1 + breath * 0.035}) translate(0, -28)`}>
        <ellipse cx={8} cy={4} rx={38} ry={24} fill={`url(#${uid}-tor)`} />
        <ellipse cx={-6} cy={-6} rx={18} ry={10} fill={skinLight} opacity={0.5} />
        <path d="M -26 -4 Q -22 6 -26 16" stroke={shade} strokeWidth={1.1} fill="none" opacity={0.5} />
        {/* chubby shoulders + short neck (head rests into them) */}
        <ellipse cx={-22} cy={4} rx={17} ry={21} fill={`url(#${uid}-tor)`} />
        <ellipse cx={-34} cy={2} rx={11} ry={13} fill={skin} />
        <path d="M -38 -8 Q -30 2 -36 14" stroke={shade} strokeWidth={1} fill="none" opacity={0.45} />
      </g>

      {leg(true)}

      {/* a piece of cloth over the belly and lower body */}
      <g transform={`translate(0, ${breath * 0.8})`}>
        <path
          d={`M 10 -17 Q 30 ${-22 + breath} 52 -17 Q 62 -8 ${60 + nz(13) * 1.5} 6 Q 58 20 46 27 Q 28 31 14 27 Q 6 18 7 4 Q 7 -8 10 -17 Z`}
          fill={`url(#${uid}-cl)`}
        />
        {[`M 22 -15 Q 27 4 24 26`, `M 38 -16 Q 42 4 38 28`].map((d, i) => (
          <path key={i} d={d} stroke={clothShade} strokeWidth={1.5} fill="none" opacity={0.8} />
        ))}
        <path d="M 10 -17 Q 30 -22 52 -17 Q 62 -8 60 6" stroke="#efe6d6" strokeWidth={2.2} fill="none" />
      </g>

      {/* soft neck: joins the tilted head to the shoulders, drawn behind the head */}
      <ellipse cx={-31} cy={15} rx={12} ry={11} fill={`url(#${uid}-tor)`} />
      <ellipse cx={-31} cy={9} rx={9} ry={4} fill={shade} opacity={0.3} />
      {/* soft divine radiance behind the head */}
      <circle cx={hx} cy={hy} r={96} fill="url(#dv-glow)" opacity={0.85 * aura} />
      {/* head (baby proportions, innocent face, divine eyes) */}
      <g transform={`translate(${hx + lagX}, ${hy + nod}) rotate(${tilt})`}>
        <Head
          R={34}
          shape={FACE_BABY}
          look={{ skin, skinLight, skinShade: shade, lips: "#C77068", hair: "#1f1510", hairLight: "#4a352a", hairStyle: "baby", age: "baby", divineEyes: false }}
          uid={`${uid}hd`}
          keySide={-1}
          rim={DIVINE.core}
          rimStrength={0.45}
          st={{
            yaw: t * 0.75,
            eyeX: gx,
            eyeY: gy,
            close,
            squint: 0.1 * open, // calm, serene lids
            brow: 0.32,
            browTilt: -0.08,
            mouth: MOUTH_REST,
            smile: sm,
            gasp: 0,
            cheeks: 0.4,
            flush: 0,
            tears: 0,
            sway: noise1(f * 0.04, 31) * 2 - mv.dx * 0.15,
            f,
          }}
        />
      </g>

      {/* near arm in front: waves gently, rises into blessing */}
      {arm(true)}
    </g>
  );
};
