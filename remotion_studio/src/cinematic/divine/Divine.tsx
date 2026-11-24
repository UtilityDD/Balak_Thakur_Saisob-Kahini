import React, { useId } from "react";
import { blink, clamp, hash, lerp, noise1, safeId, TAU } from "../core/anim";
import { Hand } from "../rig/Hand";

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
    {/* soft warm halo: no hard edge, used for every Balak / Charu halo */}
    <radialGradient id="dv-halo">
      <stop offset="0%" stopColor={DIVINE.core} stopOpacity={0.9} />
      <stop offset="40%" stopColor={DIVINE.core} stopOpacity={0.4} />
      <stop offset="75%" stopColor={DIVINE.mid} stopOpacity={0.12} />
      <stop offset="100%" stopColor={DIVINE.mid} stopOpacity={0} />
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
  // MOT-20 / BAL-11: the halo never breathes or pulses. Its size is steady; only a very slow, irregular shimmer
  // well under 1 % (two incommensurate slow noises, ±0.4 % at most) keeps the light alive. Brightening comes
  // only from `level` (key beats).
  const shimmer = 1 + 0.0025 * noise1(f * 0.0061, 211) + 0.0015 * noise1(f * 0.0137, 212);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {/* L1: soft halo + motes (steady) */}
      <circle r={(110 + L2 * 80 + L3 * 110) * shimmer} fill="url(#dv-glow)" opacity={0.35 * L1 + 0.3 * L2 + 0.15 * L3} />
      <circle r={70 * shimmer} fill="url(#dv-halo)" opacity={0.3 * L1} />
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
      {/* L3: expanding soft light (no hard rings) */}
      {L3 > 0.01 &&
        [0, 1, 2].map((k) => {
          const t = ((f * 0.6 + k * 40) % 120) / 120;
          return <circle key={k} r={80 + t * 420} fill="url(#dv-halo)" opacity={L3 * (1 - t) * 0.25} />;
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

/** Signature divine catchlight — a soft 4-point star inside a soft warm glow. Only Balak Thakur has this. */
export const DivineCatchlight: React.FC<{ x: number; y: number; r: number; f: number }> = ({ x, y, r, f }) => {
  const uid = safeId(useId());
  const tw = 0.85 + 0.15 * Math.sin(f * 0.08);
  return (
    <g transform={`translate(${x}, ${y})`} opacity={tw}>
      <defs>
        <radialGradient id={`${uid}-halo`}>
          <stop offset="0%" stopColor={DIVINE.core} stopOpacity={0.9} />
          <stop offset="40%" stopColor={DIVINE.core} stopOpacity={0.4} />
          <stop offset="75%" stopColor={DIVINE.mid} stopOpacity={0.12} />
          <stop offset="100%" stopColor={DIVINE.mid} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={r * 1.5} fill={`url(#${uid}-halo)`} opacity={0.5} />
      <path d={`M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`} fill="#FFFFFF" />
    </g>
  );
};


/* ---------------- newborn face (drawn here, independent of the shared Head rig) ---------------- */

type Pt = [number, number];
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const fp = (q: Pt) => `${n2(q[0])} ${n2(q[1])}`;
const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};

/*
 * NEWBORN FACE CONSTRUCTION (the reference for every Balak baby head: BabyHeadGS, the sitting baby, the hands
 * miracle). Head space: centre (0, 0), head about 71 wide, crown y = -44, chin y = 29; key light from screen-left.
 *  - Turn: the scene's yaw is softened to `yv = 0.5 * tanh(yaw / 0.5)` (never past about 26 degrees), and every
 *    feature sits on a sphere turned by yv (eyes r 31 at x ±13.4, nose r 37, mouth r 33, hairline r 35).
 *  - Silhouette (`headPath`): the cranium never changes; only the lower face follows the turn. The chin and the
 *    bottom curve slide toward the turn (about half the mouth's shift), the FAR cheek grows by at most about 0.5
 *    past its frontal line (a gentle round, never a lump), the NEAR jaw becomes a longer, flatter curve.
 *  - Eyes: identical in a frontal view (8.1 half-width, iris r 6.3, one round catchlight upper-left). Turned, only
 *    the far eye narrows, by at most 18 %; the near eye never grows. Calm upper lids rest just on the iris top
 *    (`oL` 0.86..1 of open); lids close fully only for blinks, sleep, a yawn or the happy squeeze.
 *  - Ears: none in a frontal view (hidden under the hair). A small soft ear appears only on the NEAR side once
 *    the turn shows it, inside the silhouette under the hair edge, at eye-to-nose height (y about 4), drawn as a
 *    soft shaded shape with no outline. No crease or line is ever drawn on the cheek.
 *  - Hairline: the dark mass ends in rounded lock tips; it blends into the skin through a soft shadow on the
 *    forehead (no light stroke or highlight along the edge; the forehead highlight sits low, near the brows).
 */
/** Round, chubby newborn head: gentle domed forehead, full low cheeks, a small soft chin. Centre ≈ (0, 0). */
const HEAD_TURN_MAX = 0.45;
/** head outline for the softened turn `yv` (radians, + = face turned to screen-right; far side = +x) */
const headPath = (yv: number) => {
  const phi = clamp(Math.abs(yv) / HEAD_TURN_MAX);
  const sg = yv < 0 ? -1 : 1;
  // [frontal, fully turned right]; mirrored for a left turn
  const P = (fx: number, fy: number, tx: number, ty: number) => fp([lerp(fx, tx, phi) * sg, lerp(fy, ty, phi)]);
  return (
    `M 0 -44 C ${21 * sg} -44 ${35 * sg} -30 ${35.5 * sg} -11 ` +
    // far cheek: a modest, smooth round (at most ~0.5 past the frontal line), into a jaw that leads to the chin
    `C ${P(36, 0, 36.3, 0)} ${P(37, 9, 37.5, 9.5)} ${P(33, 17, 33.8, 18)} ` +
    `C ${P(28.5, 25, 30.5, 25.6)} ${P(16, 28.5, 22, 29.2)} ${P(6.5, 29, 14.5, 29.3)} ` +
    // the small soft chin slides toward the turn
    `C ${P(3, 30, 11, 30.3)} ${P(-3, 30, 4.5, 30.4)} ${P(-6.5, 29, 1, 29.4)} ` +
    // near side: a longer, flatter jaw line
    `C ${P(-16, 28.5, -11.5, 28.9)} ${P(-28.5, 25, -27, 26.2)} ${P(-33, 17, -32.6, 18.6)} ` +
    `C ${P(-37, 9, -36.4, 8.6)} ${P(-36, 0, -35.9, 0)} ${-35.5 * sg} -11 ` +
    `C ${-35 * sg} -30 ${-21 * sg} -44 0 -44 Z`
  );
};

/*
 * Newborn hair (Episode 1 look, BAL-04): a full, soft mass of dark brown-black baby hair covering the crown,
 * with a natural, softly scalloped hairline. The curls are formed INSIDE the mass and along its edge (rounded
 * lock tips at the hairline, curl highlights in a slightly lighter brown, a few soft ringlets at the edge);
 * nothing is drawn as loose strokes outside the head.
 */
const HAIR_CY = -8;
const HAIR_RX = 37.2;
const HAIR_RY = 38.2;
const HAIR_A0 = Math.PI - 0.17;
const HAIR_A1 = 2 * Math.PI + 0.17;
const HAIR_N = 11;
/** outer silhouette: soft rounded curl clumps just outside the skull (fixed layout) */
const HAIR_OUTER = (() => {
  const at = (a: number, extra: number): Pt => [Math.cos(a) * (HAIR_RX + extra), HAIR_CY + Math.sin(a) * (HAIR_RY + extra)];
  let d = `M ${fp(at(HAIR_A0, 0))}`;
  for (let i = 0; i < HAIR_N; i++) {
    const a = lerp(HAIR_A0, HAIR_A1, (i + 0.5) / HAIR_N);
    const out = 2.1 + hash(i * 5.1 + 51) * 1.1;
    d += ` Q ${fp(at(a, out))} ${fp(at(lerp(HAIR_A0, HAIR_A1, (i + 1) / HAIR_N), 0.2 * hash(i * 2.7 + 52)))}`;
  }
  return { d, left: at(HAIR_A0, 0), right: at(HAIR_A1, 0) };
})();
/** the natural hairline (head-space x before the turn, y), from the right temple across the brow to the left */
const HAIRLINE: Pt[] = [
  [34.6, -1.5],
  [31.6, -9],
  [26.4, -15.2],
  [18.8, -19.6],
  [9.6, -21.8],
  [-0.4, -22.4],
  [-10.2, -21.6],
  [-19.4, -19.2],
  [-26.8, -14.8],
  [-31.8, -8.4],
  [-34.6, -1.5],
];
/** rounded curl highlights inside the mass: [x, y, r, start angle] */
const HAIR_CURLS: [number, number, number, number][] = [
  [-23, -31, 3.7, 0.4],
  [-12.5, -37.5, 3.9, 0.9],
  [0, -40.5, 3.7, 1.5],
  [12, -37.5, 3.8, 2.0],
  [23, -31.5, 3.5, 2.4],
  [-29.5, -21, 3.2, 0.1],
  [-18, -28, 3.3, 0.6],
  [-6, -31.5, 3.1, 1.1],
  [6.5, -31.5, 3.1, 1.7],
  [17.5, -27.5, 3.1, 2.1],
  [28.5, -20, 3.0, 2.6],
  [-33.5, -10, 2.7, -0.3],
  [33, -9.5, 2.6, 2.9],
];

/** Slow, peaceful blink (0 open .. 1 closed), smoothly interpolated: a long, soft lid fall every ~8–12 s. */
const softBlink = (f: number, seed: number) => {
  const u = f * 0.3;
  const i = Math.floor(u);
  return lerp(blink(i, seed), blink(i + 1, seed), u - i);
};

interface BabyFaceProps {
  uid: string;
  f: number;
  /** radians, + = face turns to screen-right */
  yaw: number;
  /** gaze in head space, −1..1 */
  gx: number;
  gy: number;
  /** 0 open .. 1 closed */
  close: number;
  /** 0..1 how bright and wide-awake the open eyes are (0 = the calm, slightly lowered default lids) */
  bright: number;
  smile: number;
  cheeks: number;
  yawn: number;
  /** 0..1 a soft happy coo: the mouth opens a little into a rounded, smiling "o" (never a wide grin) */
  coo: number;
  aura: number;
  sway: number;
  skin: string;
  skinLight: string;
  shade: string;
  hair: string;
  hairLight: string;
}

/**
 * Newborn Balak Thakur's face: serene and natural (no anime stars), soft warm skin shading,
 * large dark eyes with a gentle catchlight under calm lids, a tiny button nose, rosebud lips with a faint
 * peaceful smile and fine curly wisps of hair. No tilak, no ornaments. Key light from screen-left.
 */
const BabyFace: React.FC<BabyFaceProps> = ({ uid, f, yaw, gx, gy, close, bright, smile, cheeks, yawn, coo, aura, sway, skin, skinLight, shade, hair, hairLight }) => {
  const sm = clamp(smile);
  const yw = clamp(yawn);
  const ck = clamp(cheeks);
  const co = clamp(coo) * (1 - yw);
  // eye smile: as the smile grows, the full cheeks push the lower lids up; closed lids bow into soft happy crescents
  const es = clamp((sm - 0.5) / 0.4) * (1 - yw);
  const cheekLift = sm * 0.8 + es * 1.1 + co * 0.9;
  // softened turn: the face never turns so far that the far eye crowds the silhouette (see FACE CONSTRUCTION)
  const yv = 0.5 * Math.tanh(yaw / 0.5);
  const phi = clamp(Math.abs(yv) / HEAD_TURN_MAX);
  const hp = headPath(yv);
  // surface feature at head-space x0 on a sphere of radius r, turned by yv → screen x and horizontal foreshortening
  const proj = (x0: number, r: number) => {
    const a = Math.asin(clamp(x0 / r, -1, 1));
    return { x: r * Math.sin(a + yv), k: Math.max(0.2, Math.cos(a + yv)) / Math.max(0.2, Math.cos(a)) };
  };
  const ink = "#3A2117";
  // natural soft baby lips: close to the skin tone with a slightly deeper warm tint (no pink lipstick look)
  const lipUp = "#D4937A";
  const lipLo = "#DEA085";
  // eased opening: a partly lowered `close` (0.1 .. 0.3) still reads as open, soft eyes; only blinks, sleep,
  // a yawn or a deliberate closed-eye moment bring the lids fully down
  const o = clamp(1 - Math.pow(clamp(close), 1.6));
  // calm: upper lids lowered only slightly, resting on the top of the iris (serene, never heavy or sleepy);
  // awake and delighted: wide, bright eyes
  const oL = o * lerp(0.86, 1, clamp(bright));

  /* ---- eyes: large, warm, expressive brown eyes (Episode 1 look) with one soft catchlight (BAL-21) ---- */
  const W = 8.1;
  const HU = 7.2;
  const eye = (side: 1 | -1) => {
    const pj = proj(side * 13.4, 31);
    // same size frontally; turned, only the far eye narrows (by at most 18 %), the near eye never grows
    const kE = side * yv > 0 ? 1 - 0.18 * phi : 1;
    const hl =5.6 * (1 - sm * 0.2 - yw * 0.2 - es * 0.22 * o); // full cheeks lift the lower lid as he smiles
    // happy crescent: only when the lids are mostly down (asleep or squeezed in delight)
    const arch = es * clamp((1 - o) * 1.4);
    const Ly = lerp(hl * 1.33, -HU * 1.33, oL) - arch * (hl * 1.33 + 3);
    // the lower lid follows a bowed lid up, so no white shows under a closed happy eye
    const lowY = lerp(hl * 1.33, Ly + 0.15, arch);
    const P0: Pt = [-W, 0.5]; // inner corner (toward the nose), a touch lower
    const P3: Pt = [W, 0];
    const K1: Pt = [-W * 0.55, Ly];
    const K2: Pt = [W * 0.6, Ly];
    const shape = `M ${fp(P0)} C ${fp([-W * 0.55, -HU * 1.33])} ${fp([W * 0.6, -HU * 1.33])} ${fp(P3)} C ${fp([W * 0.6, lowY])} ${fp([-W * 0.6, lowY])} ${fp(P0)} Z`;
    const shut = clamp((1 - o) * 1.6 - 0.3); // 0 awake .. 1 lids fully, softly down
    const lid = `M ${fp(P0)} C ${fp(K1)} ${fp(K2)} ${fp(P3)}`;
    const lidSkin = `M ${-W - 2} 0.5 L ${-W - 2} ${-HU * 2} L ${W + 2} ${-HU * 2} L ${W + 2} 0 L ${fp(P3)} C ${fp(K2)} ${fp(K1)} ${fp(P0)} Z`;
    // local x is mirrored for the screen-left eye; keep light (catchlight) on the world's upper-left
    const ix = gx * 2.6 * side;
    const iy = -0.4 + gy * 1.7;
    const IR = 6.3; // big iris: it nearly fills the open eye, as in Episode 1
    const cid = `${uid}-e${side > 0 ? "r" : "l"}`;
    return (
      <g transform={`translate(${n2(pj.x)}, -0.6) scale(${n2(side * kE)}, 1)`}>
        <defs>
          <clipPath id={cid}>
            <path d={shape} />
          </clipPath>
        </defs>
        {/* very soft, short newborn brow */}
        {(() => {
          const bd = `M -5 ${n2(-13.6 - sm * 0.6 - co * 0.7 - yw * 2)} Q -0.4 ${n2(-15.6 - sm * 0.6 - co * 0.9 - yw * 2.4)} 5.4 ${n2(-14.2 - sm * 0.4 - co * 0.6 - yw * 1.6)}`;
          return (
            <>
              {/* a warm, barely-there newborn brow (warm shade, so it never reads as a grey or pale line) */}
              <path d={bd} stroke={shade} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.2} />
              <path d={bd} stroke={hair} strokeWidth={1.0} strokeLinecap="round" fill="none" opacity={0.05} />
            </>
          );
        })()}
        {/* gentle lid fold and the soft fullness under the eye */}
        <path d={`M ${n2(-W * 0.6)} ${n2(-HU * 1.05 - 1.6)} Q 0 ${n2(-HU * 1.36 - 1.6)} ${n2(W * 0.9)} ${n2(-HU * 0.65 - 1.3)}`} stroke={shade} strokeWidth={0.7} fill="none" opacity={0.05 + 0.21 * oL} />
        {/* under-eye fullness: rises and curves up as the cheeks lift into an eye smile */}
        <path d={`M ${n2(-W * 0.6)} ${n2(Math.max(hl, lowY * 0.75) + 1.6)} Q 0 ${n2(Math.max(hl, lowY * 0.75) + 2.7 - es * 1.6)} ${n2(W * 0.7)} ${n2(Math.max(hl, lowY * 0.75) + 1.3 - es * 0.6)}`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.1 + 0.12 * es} />
        <g clipPath={`url(#${cid})`}>
          <path d={shape} fill={`url(#${uid}-scl)`} />
          {/* warm brown iris with depth: lighter below, a soft darker limbal ring, a calm round pupil */}
          <circle cx={ix} cy={iy} r={IR} fill={`url(#${uid}-iris)`} />
          <circle cx={ix} cy={iy} r={IR - 0.35} fill="none" stroke="#2A150B" strokeWidth={0.8} opacity={0.6} />
          <ellipse cx={ix} cy={n2(iy + IR * 0.42)} rx={IR * 0.62} ry={IR * 0.3} fill="#C38A57" opacity={0.28} />
          <circle cx={ix} cy={iy} r={2.7} fill="#160B06" />
          {/* soft shadow the upper lid casts on the eyeball */}
          <path d={lid} transform="translate(0, 1.1)" stroke="#2A1810" strokeWidth={2.2} fill="none" opacity={0.15} />
          {/* one soft round catchlight, never a star or sparkle */}
          <circle cx={n2(ix - 2.2 * side)} cy={n2(iy - 2.3)} r={3.1} fill="#FFFFFF" opacity={0.14} />
          <circle cx={n2(ix - 2.2 * side)} cy={n2(iy - 2.3)} r={1.75} fill="#FFFFFF" opacity={0.95} />
          <path d={lidSkin} fill={skin} />
        </g>
        {/* the round, softly lit closed eyelid (sleep and the happy squeeze) */}
        {shut > 0.02 && <ellipse cx={-0.4} cy={n2(Ly * 0.45 - 1.6)} rx={W * 0.72} ry={2.8} fill={skinLight} opacity={0.3 * shut} />}
        {/* soft upper lid line (when closed: a soft downward curve); at most a faint lash line, no heavy lashes */}
        <path d={lid} stroke={ink} strokeWidth={lerp(0.9, 1.25, oL)} strokeLinecap="round" fill="none" opacity={0.85} />
        <path d={`M ${fp(P3)} q 0.7 ${n2(-0.3 + (1 - oL) * 0.6)} 1.2 ${n2(-0.5 + (1 - oL) * 0.9)}`} stroke={ink} strokeWidth={0.6} strokeLinecap="round" fill="none" opacity={0.4} />
        {/* faint lower lid line */}
        <path d={`M ${n2(-W * 0.55)} ${n2(lowY * 0.72 + 0.6)} Q 0 ${n2(lowY + 0.2)} ${n2(W * 0.7)} ${n2(lowY * 0.6 + 0.3)}`} stroke={shade} strokeWidth={0.55} fill="none" opacity={0.3 * o} />
      </g>
    );
  };

  /* ---- ear: only on the NEAR side, only once the turn shows it; small and soft, inside the silhouette under
     the hair edge at eye-to-nose height; shaded, never outlined (no stray line on the cheek) ---- */
  const earVis = sstep((phi - 0.3) / 0.45);
  const earSide = yv > 0 ? -1 : 1;
  const earRx = 2.2 + 1.0 * earVis;
  // its outer rim stays just inside the silhouette (never a bump on the outline), its top under the hair edge
  const earX = earSide * (35.5 - earRx - 0.35);
  const ear =
    earVis > 0.02 ? (
      <g transform={`translate(${n2(earX)}, 4.2)`} opacity={n2(earVis)}>
        {/* soft shading where the ear meets the cheek (a fill, never a line) */}
        <ellipse cx={n2(-earSide * earRx * 0.9)} cy={0.4} rx={1.8} ry={4.6} fill={`url(#${uid}-sh)`} opacity={0.3} />
        <ellipse cx={0} cy={0} rx={n2(earRx)} ry={4.9} fill={skin} />
        {/* the lit outer rim and a faint shaded inner bowl */}
        <ellipse cx={n2(earSide * earRx * 0.25)} cy={-0.6} rx={n2(earRx * 0.7)} ry={3.9} fill={skinLight} opacity={0.22} />
        <ellipse cx={n2(-earSide * earRx * 0.12)} cy={0.5} rx={n2(earRx * 0.42)} ry={2.4} fill={`url(#${uid}-ear)`} opacity={0.55} />
      </g>
    ) : null;

  /* ---- hair: one full, soft dark mass with a scalloped natural hairline; curls inside and along its edge ---- */
  const hl0 = HAIRLINE.map(([x0, y0]): Pt => [proj(x0, 35).x, y0]);
  const toFace = (m: Pt, amp: number): Pt => {
    const vx = 0 - m[0];
    const vy = 6 - m[1];
    const L = Math.hypot(vx, vy) || 1;
    return [m[0] + (vx / L) * amp, m[1] + (vy / L) * amp];
  };
  // each hairline segment bulges toward the face as a rounded lock tip (soft curls along the edge)
  const locks = hl0.slice(0, -1).map((p, i) => {
    const q = hl0[i + 1];
    const m: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const amp = 2.5 + hash(i * 3.9 + 60) * 0.9 + Math.abs(sway) * 0.05;
    return { p, q, c: toFace(m, amp), m, amp };
  });
  const hairMass =
    `${HAIR_OUTER.d} L ${fp(hl0[0])} ` +
    locks.map((k) => `Q ${fp(k.c)} ${fp(k.q)}`).join(" ") +
    ` L ${fp(HAIR_OUTER.left)} Z`;
  const curlArc = (cx: number, cy: number, r: number, a0: number, span = 3.0) => {
    const a1 = a0 + span;
    const p0: Pt = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r];
    const p1: Pt = [cx + Math.cos(a1) * r * 0.86, cy + Math.sin(a1) * r * 0.86];
    return `M ${fp(p0)} A ${n2(r)} ${n2(r * 0.92)} 0 ${span > Math.PI ? 1 : 0} 1 ${fp(p1)}`;
  };
  const inner = HAIR_CURLS.map(([x0, y0, r, a0]) => {
    const pj = proj(x0, 37);
    return { d: curlArc(pj.x, y0, r * Math.max(0.6, Math.min(1, pj.k)), a0 + sway * 0.02), lit: pj.x < 6 };
  });
  // a few soft ringlets at the lower edge of the mass (behind the ears) and two little tufts at the crown
  const ringlets: [number, number, number][] = [
    [-35.6, -2.2, 3.4],
    [35.4, -2.4, 3.0],
  ];

  /* ---- nose & mouth ---- */
  const nj = proj(0, 37);
  const nx = nj.x;
  const mj = proj(0, 33);
  const gap = yw * 5.2 + co * 2.6; // a soft yawn opens the mouth into a little "o"; a coo parts it gently
  const mw = (3.6 + sm * 1.5) * (1 - yw * 0.3 - co * 0.1) * mj.k;
  const lift = sm * 1.5 * (1 - yw) + co * 0.3;
  const mid = 0.5 + sm * 0.5;
  const upperLip = `M ${n2(-mw)} ${n2(-lift)} Q ${n2(-mw * 0.55)} -1.5 -0.9 -1.9 Q 0 -1.25 0.9 -1.9 Q ${n2(mw * 0.55)} -1.5 ${n2(mw)} ${n2(-lift)} Q 0 ${n2(mid)} ${n2(-mw)} ${n2(-lift)} Z`;
  const lowerLip = `M ${n2(-mw)} ${n2(-lift + gap)} Q 0 ${n2(mid + gap)} ${n2(mw)} ${n2(-lift + gap)} Q ${n2(mw * 0.6)} ${n2(3.3 + gap)} 0 ${n2(3.4 + gap)} Q ${n2(-mw * 0.6)} ${n2(3.3 + gap)} ${n2(-mw)} ${n2(-lift + gap)} Z`;

  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-skin`} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="36%" stopColor={skin} />
          <stop offset="84%" stopColor={skin} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
        <radialGradient id={`${uid}-iris`} cx="0.5" cy="0.66" r="0.6">
          <stop offset="0%" stopColor="#C2884F" />
          <stop offset="38%" stopColor="#965B31" />
          <stop offset="72%" stopColor="#5E3219" />
          <stop offset="100%" stopColor="#3A1D0E" />
        </radialGradient>
        <linearGradient id={`${uid}-scl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAD3C3" />
          <stop offset="38%" stopColor="#FFFBF6" />
          <stop offset="100%" stopColor="#F7EBE2" />
        </linearGradient>
        {/* hair: dark brown-black, a touch warmer on the lit crown */}
        <radialGradient id={`${uid}-hm`} gradientUnits="userSpaceOnUse" cx="-12" cy="-38" r="48">
          <stop offset="0%" stopColor="#4A2F20" />
          <stop offset="45%" stopColor={hair} />
          <stop offset="100%" stopColor="#170D08" />
        </radialGradient>
        {/* warm golden rim light on the key-side edge of the skin and hair (soft, no hard line) */}
        <radialGradient id={`${uid}-rim`} gradientUnits="userSpaceOnUse" cx="10" cy="-6" r="50">
          <stop offset="0%" stopColor={DIVINE.mid} stopOpacity={0} />
          <stop offset="78%" stopColor={DIVINE.mid} stopOpacity={0} />
          <stop offset="100%" stopColor={DIVINE.falloff} stopOpacity={0.55} />
        </radialGradient>
        <clipPath id={`${uid}-hmc`}>
          <path d={hairMass} />
        </clipPath>
        <radialGradient id={`${uid}-blush`}>
          <stop offset="0%" stopColor="#F08A80" stopOpacity={0.6} />
          <stop offset="60%" stopColor="#F4A196" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#F4A196" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-hi`}>
          <stop offset="0%" stopColor="#FFF4E8" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#FFF4E8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-sh`}>
          <stop offset="0%" stopColor={shade} stopOpacity={0.6} />
          <stop offset="100%" stopColor={shade} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-mo`}>
          <stop offset="0%" stopColor="#4A1D1C" />
          <stop offset="100%" stopColor="#7A3934" />
        </radialGradient>
        <linearGradient id={`${uid}-hw`} gradientUnits="userSpaceOnUse" x1="0" y1="-44" x2="0" y2="-14">
          <stop offset="0%" stopColor={hair} stopOpacity={0.8} />
          <stop offset="45%" stopColor={hair} stopOpacity={0.55} />
          <stop offset="80%" stopColor={hair} stopOpacity={0.12} />
          <stop offset="100%" stopColor={hair} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}-hc`}>
          <path d={hp} />
        </clipPath>
        {/* soft newborn ear: a warm, slightly deeper centre fading to the skin at its edge (no outline) */}
        <radialGradient id={`${uid}-ear`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={shade} />
          <stop offset="55%" stopColor={skin} />
          <stop offset="100%" stopColor={skin} />
        </radialGradient>
      </defs>

      {/* soft shadow under the chin, on the neck */}
      <ellipse cx={n2(mj.x * 0.6)} cy={30} rx={18} ry={6} fill={`url(#${uid}-sh)`} opacity={0.75} />
      <path d={hp} fill={`url(#${uid}-skin)`} />

      <g clipPath={`url(#${uid}-hc)`}>
        {/* subtle highlight on the gentle forehead, soft fall-off on the shadow side, a soft band under the chin */}
        {/* (the forehead highlight sits low, near the brows, so no pale band runs along the hairline) */}
        <ellipse cx={n2(proj(-5, 34).x)} cy={-10.5} rx={12} ry={5.5} fill={`url(#${uid}-hi)`} opacity={0.28} />
        <ellipse cx={34} cy={4} rx={14} ry={30} fill={`url(#${uid}-sh)`} opacity={0.38} />
        <ellipse cx={n2(mj.x * 0.7)} cy={31} rx={22} ry={7} fill={`url(#${uid}-sh)`} opacity={0.55} />
        {/* full cheeks: a soft apple highlight and a warm blush */}
        {([-1, 1] as const).map((sd) => {
          const cj = proj(sd * 18, 33);
          return (
            <g key={sd}>
              <ellipse cx={n2(cj.x - sd * 0.5)} cy={n2(8 - cheekLift)} rx={n2((6.5 + es * 0.8) * cj.k)} ry={n2(4.2 + es * 0.5)} fill={`url(#${uid}-hi)`} opacity={sd < 0 ? 0.32 : 0.18} />
              <ellipse cx={n2(cj.x)} cy={n2(11 - cheekLift)} rx={n2(9 * cj.k)} ry={6.4} fill={`url(#${uid}-blush)`} opacity={clamp(0.35 + ck * 0.75 + sm * 0.15 + co * 0.15 + yw * 0.15)} />
            </g>
          );
        })}
        {/* warm golden rim light on the key-side edge of the face */}
        <path d={hp} fill={`url(#${uid}-rim)`} opacity={0.75 * clamp(aura)} />
        {/* the hairline blends into the skin: a soft, graded shadow under the hair edge (no light stroke) */}
        <path d={hairMass} fill="none" stroke={shade} strokeWidth={3.4} strokeLinejoin="round" opacity={0.1} />
        <path d={hairMass} transform="translate(0.25, 1.6)" fill={shade} opacity={0.08} />
        <path d={hairMass} transform="translate(0.15, 0.8)" fill={shade} opacity={0.12} />
      </g>
      {/* the near-side ear (only when the turn shows it), tucked under the hair edge */}
      {ear}

      {/* full soft mass of dark baby hair, curls formed inside it and along its edge */}
      <g>
        {ringlets.map(([x0, y0, r], i) => (
          <circle key={`rg${i}`} cx={n2(x0 > 30 || x0 < -30 ? x0 : proj(x0, 37).x)} cy={y0} r={r} fill={hair} />
        ))}
        <path d={hairMass} fill={`url(#${uid}-hm)`} />
        <g clipPath={`url(#${uid}-hmc)`}>
          {/* broad soft sheen on the lit crown */}
          <ellipse cx={n2(proj(-14, 37).x)} cy={-35} rx={13} ry={4.2} fill={hairLight} opacity={0.32} transform={`rotate(-30, ${n2(proj(-14, 37).x)}, -35)`} />
          {/* rounded curls: a soft shadow arc under a lighter-brown highlight arc */}
          {inner.map(({ d }, i) => (
            <path key={`cs${i}`} d={d} transform="translate(0.6, 0.7)" stroke="#120A06" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.32} />
          ))}
          {inner.map(({ d, lit }, i) => (
            <path key={`ch${i}`} d={d} stroke={hairLight} strokeWidth={1.0} strokeLinecap="round" fill="none" opacity={lit ? 0.42 : 0.24} />
          ))}
          {/* warm golden rim light on the hair (soft, follows the key-side edge) */}
          <path d={hairMass} fill={`url(#${uid}-rim)`} opacity={0.6 * clamp(aura)} />
        </g>
        {/* soft curl highlights in the edge ringlets */}
        {ringlets.map(([x0, y0, r], i) => {
          const cx = x0 > 30 || x0 < -30 ? x0 : proj(x0, 37).x;
          return <path key={`rh${i}`} d={curlArc(cx, y0, r * 0.62, 3.4)} stroke={hairLight} strokeWidth={0.8} strokeLinecap="round" fill="none" opacity={cx < 6 ? 0.5 : 0.3} />;
        })}
      </g>

      {eye(-1)}
      {eye(1)}

      {/* tiny button nose: soft roundness, a soft shadow beneath, a gentle highlight */}
      <ellipse cx={n2(nx + 2.2)} cy={8.4} rx={2.6} ry={2.8} fill={`url(#${uid}-sh)`} opacity={0.4} />
      <ellipse cx={n2(nx)} cy={10.7} rx={n2(3.8 * nj.k)} ry={1.4} fill={`url(#${uid}-sh)`} opacity={0.75} />
      <ellipse cx={n2(nx)} cy={8.2} rx={n2(3 * nj.k)} ry={2.4} fill={skinLight} opacity={0.3} />
      <ellipse cx={n2(nx - 1.7 * nj.k)} cy={10.1} rx={0.75} ry={0.5} fill="#A8684C" opacity={0.5} />
      <ellipse cx={n2(nx + 1.7 * nj.k)} cy={10.1} rx={0.75} ry={0.5} fill="#A8684C" opacity={0.5} />
      <circle cx={n2(nx - 0.9)} cy={7.4} r={1} fill="#FFFFFF" opacity={0.3} />
      {/* soft philtrum */}
      <path d={`M ${n2(nx - 0.9)} 11.8 Q ${n2(mj.x - 0.7)} 13.6 ${n2(mj.x - 0.9)} 15.2 M ${n2(nx + 0.9)} 11.8 Q ${n2(mj.x + 0.7)} 13.6 ${n2(mj.x + 0.9)} 15.2`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.14} />

      {/* small rosebud lips with a faint, peaceful smile */}
      <g transform={`translate(${n2(mj.x)}, 17.2)`}>
        <ellipse cx={0} cy={n2(4.7 + gap)} rx={3.4} ry={1.2} fill={`url(#${uid}-sh)`} opacity={0.45} />
        {yw + co > 0.02 && (
          <g opacity={clamp((yw + co) * 4)}>
            <ellipse cx={0} cy={n2(mid * 0.5 + gap * 0.5)} rx={n2(mw * 0.82)} ry={n2(gap * 0.6 + 0.2)} fill={`url(#${uid}-mo)`} />
            <ellipse cx={0} cy={n2(mid * 0.5 + gap * 0.85)} rx={n2(mw * 0.5)} ry={n2(gap * 0.22)} fill="#C46A68" opacity={0.6} />
          </g>
        )}
        <path d={lowerLip} fill={lipLo} opacity={0.8} />
        <path d={upperLip} fill={lipUp} opacity={0.75} />
        <path d={`M ${n2(-mw)} ${n2(-lift)} Q 0 ${n2(mid)} ${n2(mw)} ${n2(-lift)}`} stroke="#A15C48" strokeWidth={0.85} strokeLinecap="round" fill="none" opacity={0.72 * (1 - yw * 0.8)} />
        <ellipse cx={-0.4} cy={n2(1.9 + gap)} rx={n2(1.4 * mj.k)} ry={0.5} fill={skinLight} opacity={0.3} />
        {/* the smile reaches the soft corners */}
        {sm > 0.05 &&
          ([-1, 1] as const).map((sd) => (
            <path key={sd} d={`M ${n2(sd * (mw + 0.2))} ${n2(-lift - 0.6)} Q ${n2(sd * (mw + 0.9))} ${n2(-lift + 0.1)} ${n2(sd * (mw + 0.4))} ${n2(-lift + 0.8)}`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.35 * sm} />
          ))}
      </g>

    </g>
  );
};

export interface BabyMotion {
  /** velocity of the bundle (px/frame, deg/frame) — drives follow-through when he is carried */
  dx: number;
  dy: number;
  drot: number;
}

const sstep = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};

/** Rounded, tapered capsule along +y (w1 at the base, w2 at the end). */
const capsule = (len: number, w1: number, w2: number) =>
  `M ${n2(-w1)} 0 C ${n2(-w1 * 1.05)} ${n2(len * 0.5)} ${n2(-w2 * 1.05)} ${n2(len * 0.85)} ${n2(-w2)} ${n2(len)} A ${n2(w2)} ${n2(w2)} 0 0 0 ${n2(w2)} ${n2(len)} C ${n2(w2 * 1.05)} ${n2(len * 0.85)} ${n2(w1 * 1.05)} ${n2(len * 0.5)} ${n2(w1)} 0 Z`;

/**
 * One continuous, chubby two-segment limb (upper arm + forearm, or thigh + shin) as a single outline, so the
 * elbow / knee never shows a seam: segment 1 runs from (0, 0) along +y for `L1`; segment 2 turns by `a2Deg`
 * (SVG rotate sense) and runs for `L2`. Widths w0 (root), w1 (joint), w2 (end) are half-widths. The outer side of
 * the bend is rounded, the inner side folds into a soft crease. `side(s, q)` gives a stroke path along side s
 * (+1 = +x of segment 1) at fraction q of the width, continuous through the joint (for shading).
 */
const softLimb = (L1: number, L2: number, a2Deg: number, w0: number, w1: number, w2: number, bulge = 1.14) => {
  const r = (a2Deg * Math.PI) / 180;
  const d2: Pt = [-Math.sin(r), Math.cos(r)];
  const P1: Pt = [0, L1];
  const P2: Pt = [d2[0] * L2, L1 + d2[1] * L2];
  const n1: Pt = [1, 0];
  const n2v: Pt = [d2[1], -d2[0]];
  const nbx = n1[0] + n2v[0];
  const nby = n1[1] + n2v[1];
  const nbl = Math.hypot(nbx, nby) || 1;
  const nb: Pt = [nbx / nbl, nby / nbl];
  const cosH = Math.max(0.2, nbl / 2);
  const innerSide = d2[0] * n1[0] + d2[1] * n1[1] > 0 ? 1 : -1;
  const add = (p: Pt, v: Pt, k: number): Pt => [p[0] + v[0] * k, p[1] + v[1] * k];
  const m01: Pt = [0, L1 / 2];
  const m12: Pt = [(P1[0] + P2[0]) / 2, (P1[1] + P2[1]) / 2];
  const pts = (s: number, q: number, bl: number) => {
    const S = add([0, 0], n1, s * w0 * q);
    const c1 = add(m01, n1, s * ((w0 + w1) / 2) * q * bl);
    const A = add(P1, n1, s * w1 * q);
    const B = add(P1, n2v, s * w1 * q);
    const c2 = add(m12, n2v, s * ((w1 + w2) / 2) * q * bl);
    const E = add(P2, n2v, s * w2 * q);
    const inner = s === innerSide;
    const J = add(P1, nb, s * w1 * q * Math.min(1 / cosH, inner ? 1.35 : 2.2));
    return { S, c1, A, B, c2, E, J, inner };
  };
  const fwd = (s: number, q: number, bl: number) => {
    const p = pts(s, q, bl);
    return p.inner ? `Q ${fp(p.c1)} ${fp(p.J)} Q ${fp(p.c2)} ${fp(p.E)}` : `Q ${fp(p.c1)} ${fp(p.A)} Q ${fp(p.J)} ${fp(p.B)} Q ${fp(p.c2)} ${fp(p.E)}`;
  };
  const back = (s: number) => {
    const p = pts(s, 1, bulge);
    return p.inner ? `Q ${fp(p.c2)} ${fp(p.J)} Q ${fp(p.c1)} ${fp(p.S)}` : `Q ${fp(p.c2)} ${fp(p.B)} Q ${fp(p.J)} ${fp(p.A)} Q ${fp(p.c1)} ${fp(p.S)}`;
  };
  const pP = pts(1, 1, bulge);
  const pM = pts(-1, 1, bulge);
  const k = 1.33;
  const outline =
    `M ${fp(pP.S)} ${fwd(1, 1, bulge)} ` +
    `C ${fp(add(pP.E, d2, w2 * k))} ${fp(add(pM.E, d2, w2 * k))} ${fp(pM.E)} ` +
    `${back(-1)} ` +
    `C ${fp(add(pM.S, [0, -1], w0 * k))} ${fp(add(pP.S, [0, -1], w0 * k))} ${fp(pP.S)} Z`;
  const side = (s: number, q: number) => `M ${fp(pts(s, q, 1.06).S)} ${fwd(s, q, 1.06)}`;
  // the soft fold on the inner side of the bend (only when it bends enough to fold)
  const bend = Math.abs(Math.sin(r / 2));
  const Ji = pts(innerSide, 1, bulge).J;
  const fold = `M ${fp(add(Ji, [P1[0] - Ji[0], P1[1] - Ji[1]], -0.05))} Q ${fp(add(P1, nb, innerSide * w1 * 0.55))} ${fp(add(P1, nb, innerSide * w1 * 0.2))}`;
  return { outline, side, fold, bend, P1, P2, d2, innerSide };
};

/* ---------------- newborn hand and foot ---------------- */

interface BabyPartProps {
  f: number;
  seed: number;
  skin: string;
  light: string;
  shade: string;
  crease: string;
}

/**
 * A newborn's hand in wrist space: wrist at (0, 0), the hand along +y. It is the shared hand drawing (MOT-19,
 * `rig/Hand.tsx`) in its chubby baby variant, so the thumb always comes from the anatomically correct side:
 * `side` follows the shared rule (+1 = the hand whose thumb is at +x in palm view with the fingers down, i.e. an
 * anatomical LEFT hand; -1 = a RIGHT hand). Lying on his back with the head to the left, his near arm is his
 * right arm (side -1) and the far arm his left (side +1).
 * `open` 0 = the loose newborn fist (fingers folded, thumb over them) .. 1 = open (a soft, slightly cupped
 * baby hand). It drives the shared hand's finger curl continuously through its `flex` (the little finger closes
 * first, each finger keeps its own small life), so the hand never snaps between shapes.
 * `turn` is the wrist rotation (shared rule: 0 palm to camera, -PI/2 thumb edge, about -2.2 three-quarter back).
 * The wrist flows into the forearm with no seam: a soft bridge in the forearm's own skin sits under the hand and
 * the hand's top (its wrist edge and outline) fades in over the first few px, like the seamless limbs.
 */
const BabyHand: React.FC<{ uid: string; L: number; open: number; turn: number; side: 1 | -1; f: number; seed: number; skin: string; shade: string; wristW: number }> = ({
  uid,
  L,
  open,
  turn,
  side,
  f,
  seed,
  skin,
  shade,
  wristW,
}) => {
  const o = clamp(open);
  // "relaxed" preset + flex: flex -3.8 = gently open (thumb not over-extended) .. 14 = folded into a loose
  // newborn fist with the thumb resting over the folded fingers (never sticking up)
  const own = 0.7 * noise1(f * 0.05, seed) + 0.35 * noise1(f * 0.11, seed + 3);
  const flex = lerp(14, -3.8, o) + own * (1 - 0.5 * o);
  // the hand's projected width just past the wrist (baby proportions from Hand.tsx), for the bridge
  const cs = Math.cos(turn);
  const sn = Math.sin(turn);
  const yb = 0.24 * L; // bridge end, well inside the opaque part of the hand
  const xs: number[] = [];
  for (const X of [-0.225 * L, 0.22 * L]) for (const Z of [-0.1 * L, 0.12 * L]) xs.push(side * (X * cs + Z * sn));
  const xl = Math.min(...xs) * 0.9;
  const xr = Math.max(...xs) * 0.9;
  const mid = `${uid}-hm`;
  return (
    <g>
      <defs>
        <linearGradient id={`${mid}g`} gradientUnits="userSpaceOnUse" x1={0} y1={n2(0.03 * L)} x2={0} y2={n2(0.2 * L)}>
          <stop offset="0%" stopColor="#fff" stopOpacity={0} />
          <stop offset="100%" stopColor="#fff" stopOpacity={1} />
        </linearGradient>
        {/* the bridge itself fades in past the wrist, so the forearm's own rounded end and shading run on into it */}
        <linearGradient id={`${mid}b`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={n2(0.13 * L)}>
          <stop offset="0%" stopColor={skin} stopOpacity={0} />
          <stop offset="100%" stopColor={skin} stopOpacity={1} />
        </linearGradient>
        <mask id={mid} maskUnits="userSpaceOnUse" x={-2 * L} y={-2 * L} width={4 * L} height={4 * L}>
          <rect x={-2 * L} y={-2 * L} width={4 * L} height={4 * L} fill={`url(#${mid}g)`} />
        </mask>
      </defs>
      {/* the wrist bridge: from the forearm's width into the hand's width, in the forearm's own skin */}
      <path
        d={`M ${n2(-wristW)} 0 C ${n2(-wristW)} ${n2(yb * 0.5)} ${n2(xl)} ${n2(yb * 0.6)} ${n2(xl)} ${n2(yb)} L ${n2(xr)} ${n2(yb)} C ${n2(xr)} ${n2(yb * 0.6)} ${n2(wristW)} ${n2(yb * 0.5)} ${n2(wristW)} 0 Z`}
        fill={`url(#${mid}b)`}
      />
      <g mask={`url(#${mid})`}>
        <Hand shape="relaxed" L={L} skin={skin} shade={shade} side={side} flex={flex} baby turn={turn} />
      </g>
    </g>
  );
};

/**
 * A newborn's foot in ankle space: ankle at (0, 0), the foot along +y, the sole on the −x side, a round heel,
 * a chubby sole pad and five little toes (the big toe largest). `fan` spreads the toes (newborn toes fan when
 * stretched), `curl` grips them toward the sole.
 */
const BabyFoot: React.FC<BabyPartProps & { fan: number; curl: number; lit: boolean }> = ({ fan, curl, lit, f, seed, skin, light, shade, crease }) => {
  const fn = clamp(fan);
  const cu = clamp(curl);
  const toeR = [2.1, 1.65, 1.5, 1.35, 1.15];
  return (
    <g>
      <path
        d="M 4.6 -1.5 C 6.6 3 7 8.5 6.4 12.4 C 5.8 15.4 3.2 17 0 16.8 C -3.4 16.6 -6 15 -6.4 11.6 C -6.8 8 -6.3 5 -7.3 2.6 C -7.9 0.3 -6.5 -2.4 -4 -2.6 C -1.5 -2.8 2.5 -2.6 4.6 -1.5 Z"
        fill={skin}
      />
      {/* lit top of the foot, soft sole pad in shade, a round heel */}
      {lit && <path d="M 3.6 0 C 5.2 4 5.6 8 5 11.6" stroke={light} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.45} />}
      <path d="M -5.6 3 C -5.2 7 -5.4 10.5 -4.8 13.4" stroke={shade} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.4} />
      <ellipse cx={-4.6} cy={1} rx={2.6} ry={2.4} fill={light} opacity={lit ? 0.3 : 0.15} />
      {/* faint sole creases and the soft crease where the foot meets the ankle */}
      <path d="M -5.9 7.2 Q -4.4 8.4 -5.3 10.2" stroke={crease} strokeWidth={0.55} fill="none" opacity={0.4} />
      <path d="M 4 0.2 Q 1.2 1.8 -2.2 1" stroke={crease} strokeWidth={0.6} fill="none" opacity={0.4} />
      {toeR.map((r0, j) => {
        const r = r0 * (1 - 0.18 * cu);
        const px = lerp(4.4, -4.3, j / 4) - cu * 1.1;
        const py = 15.4 - Math.abs(j - 1.6) * 0.55 - cu * 1;
        const wig = 0.35 * noise1(f * 0.06 + j * 1.3, seed + j);
        const rot = (j - 2) * fn * 7 - (j === 0 ? fn * 5 : 0) + wig * 6;
        return (
          <g key={j} transform={`rotate(${n2(rot)}, 0, 11)`}>
            <circle cx={n2(px + 0.3)} cy={n2(py + 0.35)} r={n2(r)} fill={shade} opacity={0.55} />
            <circle cx={n2(px)} cy={n2(py)} r={n2(r)} fill={skin} />
            {j === 0 && <ellipse cx={n2(px + 0.5)} cy={n2(py + 0.5)} rx={0.8} ry={0.6} fill={light} opacity={0.5} />}
          </g>
        );
      })}
    </g>
  );
};

/**
 * Newborn Balak Thakur lying on his back (চিৎ হয়ে), gently moving hands and legs,
 * a soft cotton wrap over his belly and lower body. "Divine movement" (bible §2):
 *  - layered, unsynchronised slow motion (belly breathing, limbs, head drift, gaze) — nothing loops in lockstep
 *  - follow-through when carried (head, hands, feet and the wrap's loose corner lag and settle)
 *  - at rest: small random stretches of the fingers and toes, a faint wriggle of the hips, newborn sleep smiles
 *  - `bless` 0..1: the near hand slowly rises into abhaya mudra with light in the palm
 *  - `float` 0..1: gentle levitation over the lotus; `wiggle` 0..1: how much the limbs move
 *  - `wave` 0..1: happy, irregular arm waving in small arcs, the little fists opening and closing
 *  - `kick` 0..1: happy, alternating leg kicks with bent knees; together with `wave` the body wriggles with joy
 *  - delight (smile high): eye smile, cheeks lift, the mouth opens in a soft coo (pulsed, stronger with wave / kick)
 * Origin ≈ centre of the body; the head is at the left (head centre at (−50, −10) in the body frame).
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
  /** 0..1 fullness of the warm cheek blush (default 0.4) */
  cheeks?: number;
  /** 0..1 a soft newborn yawn and stretch: eyes close, mouth opens into a little "o", arms lift, fingers and toes splay */
  yawn?: number;
  /** 0..1 happy arm waving: soft, irregular baby flaps of both arms, the little hands opening and closing */
  wave?: number;
  /** 0..1 happy leg kicking: soft, irregular alternating kicks, the knees drawing up and pushing out */
  kick?: number;
  /** 0..1 extra soft happy coo (added to the automatic coo that comes with a big smile) */
  coo?: number;
  /**
   * 0 = eyes softly closed, sleeping .. 1 = eyes fully open, bright and expressive (natural slow blinks when awake).
   * When given, it replaces `open`; when omitted, `open` is used as before.
   */
  awake?: number;
  /**
   * −1..1 horizontal eye direction (world space, + = screen-right). The eyes lead; the head follows a little
   * (added to `turn` and `headRoll`). When omitted, `lookX` sets the eyes as before.
   */
  gaze?: number;
  /**
   * Optional "life clock": the frame that drives his involuntary life (breathing, blinks, eye saccades, idle limb
   * drift, finger and toe stretches, wriggles). Story-driven props (wave, kick, smile, awake, gaze, coo, turn,
   * bless, aura, float) keep using `f`. Pass a continuous clock here when `f` is warped or held, so he keeps
   * breathing naturally. When omitted, `f` is used.
   */
  lifeF?: number;
}> = ({
  f,
  lifeF,
  x,
  y,
  s = 1,
  open = 0,
  aura = 1,
  lookX = 0,
  lookY = 0,
  turn = 0,
  smile = 0.3,
  bless = 0,
  float = 0,
  rot = 0,
  wiggle = 1,
  motion,
  headRoll = -48,
  cheeks = 0.4,
  yawn = 0,
  wave = 0,
  kick = 0,
  coo: cooIn = 0,
  awake,
  gaze,
}) => {
  const uid = safeId(useId());
  const mv = motion ?? { dx: 0, dy: 0, drot: 0 };
  // skin tones follow the reference portrait: warm, softly lit
  // (slightly warmer and less washed-out, consistent with the approved Episode 1 newborn)
  const skin = "#ECB68C";
  const skinLight = "#F6CFAA";
  const shade = "#C7845D";
  const deep = "#A86A47";
  const crease = "#AE6C48";
  const creaseFar = "#8E5A3B";
  const cloth = "#FFFDF7";
  const clothShade = "#E9E0D0";
  const clothDeep = "#D6C8B0";
  const hx = -50;
  const hy = -10;

  // --- layered organic motion ---
  // L = the life clock (breathing, blinks, saccades, idle drift, wriggles); f stays the story clock.
  const L = lifeF ?? f;
  const flY = float * (-10 + Math.sin(f * 0.045) * 6 + noise1(f * 0.012, 2) * 3);
  const flR = float * (Math.sin(f * 0.031 + 1) * 1.4);
  // joy: waving and kicking make the little body wriggle (irregular, never in lockstep with the limbs)
  const wv = clamp(wave);
  const kk = clamp(kick);
  const joy = Math.max(wv, kk);
  const wrigAt = (g: number) => joy * (noise1(g * 0.11, 71) * 1.6 + Math.sin(g * 0.19 + noise1(g * 0.03, 72) * 2) * 0.9);
  const wrig = wrigAt(L);
  const bodyRot = rot + flR + wrig + clamp(mv.drot * 0.6, -6, 6);
  const w = wiggle;
  const wr = Math.min(1, w);
  // a faint wriggle of the hips at rest, livelier with joy (inside the body frame: the head never moves)
  const hipDx = noise1(L * 0.02, 130) * 0.6 * wr + joy * noise1(L * 0.09, 131) * 1.2;
  // the wrap's loose corner swings a few frames behind his wriggles and the carry
  const clothLag = clamp((wrigAt(L - 4) - wrig) * 1.4 - mv.drot * 0.8 - mv.dx * 0.12, -9, 9);

  // --- head: supine roll, crown toward the cushion; slow, unsynchronised drift; eyes lead, head follows ---
  const yw = clamp(yawn);
  const eyeX = gaze ?? lookX;
  const gz = gaze ?? 0;
  const tilt =
    headRoll - yw * 4 + gz * 3 + noise1(L * 0.012, 3) * 3 + Math.sin(L * 0.021) * 1 - clamp(mv.drot * 0.9 + mv.dx * 0.12, -9, 9);
  // the head turns a little toward what he looks at (his mother, a sound), more when he is delighted
  const t = clamp(turn + noise1(L * 0.009, 7) * 0.22 + clamp(eyeX, -1, 1) * (0.1 + 0.15 * joy) + gz * 0.12, -1, 1);
  const lagX = clamp(-mv.dx * 0.25, -5, 5);
  // gaze is given in WORLD space (lookY < 0 = up the screen); a lying newborn rests looking upward
  const wgx = eyeX + noise1(L * 0.013, 11) * 0.22 * (gaze === undefined ? 1 : 0.5);
  const wgy = lookY - 0.28 + noise1(L * 0.011, 13) * 0.12;
  const th = (-(tilt + bodyRot) * Math.PI) / 180; // world → head-local
  const gx = clamp(wgx * Math.cos(th) - wgy * Math.sin(th), -0.85, 0.85);
  const gy = clamp(wgx * Math.sin(th) + wgy * Math.cos(th), -0.22, 0.6); // never roll the iris under the lid
  const bl = softBlink(L, 97); // slow, peaceful blinks
  const op = awake === undefined ? open : clamp(awake);
  // `open` (Episode 1 scenes) gives calm, softly lowered lids; `awake` opens them wide and bright
  const bright = awake === undefined ? clamp(op) * 0.45 : clamp(awake);
  const close = Math.max(clamp(1 - op * (1 - bl)), yw * 0.92);
  // newborn sleep smiles: rare, brief, faint flickers while the lids are down
  const asleep = clamp((close - 0.7) / 0.3) * (1 - yw);
  const sleepSmile = asleep * sstep((noise1(L * 0.016, 23) - 0.35) / 0.45) * 0.22 * (1 - clamp(smile));
  const sm = clamp(smile + noise1(L * 0.02, 17) * 0.05 + sleepSmile);
  // delight: a soft coo comes and goes in little bursts with a big smile, more when he waves and kicks
  const smJoy = clamp((sm - 0.6) / 0.3) * (0.25 + 0.75 * joy);
  const cooAuto = (g: number) => smJoy * sstep((noise1(g * 0.035, 29) + 0.15) / 0.6);
  const coo = clamp(cooAuto(f) + clamp(cooIn));

  // --- newborn breathing (MOT-20, BAL-24) ---
  // A newborn breathes faster than an adult (about 1.2 to 1.8 s a breath), from the belly, a little irregular.
  // Two tempos are cross-faded by his state (no integration needed, so a change of state never jumps the phase):
  // asleep: slow and even (~1.7 s); calm and awake: ~1.5 s; waving / kicking / cooing: quicker (~1.25 s).
  // The phase drifts on a slow noise (irregular rhythm; quieter asleep), inhale is a little quicker than exhale,
  // and each breath's depth varies a touch. `breath` is 0 (breathed out, at rest) .. ~1.15 (a fuller breath).
  const sleepy = clamp(1 - op) * (1 - yw);
  const excite = clamp(0.3 * clamp(op) + 0.75 * joy + 0.4 * clamp(cooIn));
  const irregular = 1 - 0.6 * sleepy;
  const phJit = 0.9 * irregular * noise1(L * 0.02, 140) + 0.35 * irregular * noise1(L * 0.047, 142);
  const osc = (hz: number) => {
    const ph = (L / 24) * TAU * hz + phJit;
    return Math.sin(ph + 0.3 * Math.sin(ph)); // inhale quicker, exhale slower
  };
  const v = (1 - excite) * osc(0.6) + excite * osc(0.82);
  const depth = 0.88 + 0.22 * irregular * noise1(L * 0.011, 141);
  // a coo is voiced on the breath out (the belly empties a little), then a small quick catch of breath after it
  const hitch = clamp((cooAuto(f - 5) - cooAuto(f)) * 2.5);
  const breath = Math.max(0, depth * (0.5 + 0.5 * v) * (1 - 0.5 * coo) + 0.4 * sstep(hitch));
  const BELLY = 0.021; // belly rise, fraction of its height (about 2 %)
  const CHEST = 0.006; // the chest barely
  // the head follows the chest only a hair; nothing bobs
  const nod = noise1(L * 0.014, 5) * 1.2 - breath * 0.15 + joy * noise1(L * 0.12, 6) * 0.8 - clamp(mv.dy * 0.15, -3, 3);
  const nz = (k: number, sp = 0.03, g = L) => noise1(g * sp + k * 7.3, 60 + k); // per-limb slow noise (life clock)
  const b = clamp(bless);
  const be = b * b * (3 - 2 * b);

  // --- arms: each arm on its own drifting rhythm; sampled twice for follow-through of the hand ---
  const armPose = (near: boolean, g: number, gl: number) => {
    // g = story clock (waving), gl = life clock (idle drift and finger stretches)
    const k = near ? 1 : 2;
    const wA = wv * (1 - be);
    // waving: small soft arcs with pauses; the elbow follows the shoulder a beat later
    const ph = g * (0.2 + 0.035 * k) + 2.3 * noise1(g * 0.022, 90 + k) + k * 1.9;
    const env = sstep(0.45 + 0.8 * noise1(g * 0.04 + k * 3.1, 80 + k));
    const lift = 0.5 + 0.5 * noise1(g * 0.05, near ? 74 : 75);
    const a1 =
      (near ? lerp(-96 + nz(1, 0.03, gl) * 8 * w - yw * 28, -152, be) /* resting arm beside the body */ : -118 + nz(2, 0.03, gl) * 34 * w - yw * 34) -
      wA * (lift * 18 + 10 * env) -
      wA * env * Math.sin(ph) * 16;
    const a2 = (near ? lerp(-30 + nz(3, 0.03, gl) * 6 * w, 26, be) : -48 + nz(4, 0.03, gl) * 36 * w) + wA * env * Math.sin(ph - 0.9) * 26;
    // the little fist opens on the upswing and closes again; at rest an occasional slow stretch of the fingers
    const rest = sstep((noise1(gl * 0.021 + k * 5, 120 + k) - 0.3) / 0.45) * (0.35 + 0.65 * wr);
    const opn = clamp(0.12 + rest * 0.6 + wA * env * (0.5 + 0.5 * Math.sin(ph + 0.5)) * 0.85 + yw * 0.7);
    // wrist turn (shared hand rule): at rest the loose fist shows its back three-quarter with the thumb edge;
    // in the wave the forearm turns the open palm up a little (on its own slow rhythm, not with every flap);
    // a yawn stretch turns it a touch; the blessing turns the near palm fully to the camera (abhaya)
    const sup = clamp(wA * (0.78 + 0.22 * noise1(g * 0.03 + k * 2.2, 210 + k)) * (0.45 + 0.55 * opn));
    const turn = lerp(-2.2 + 0.16 * nz(5 + k, 0.025, gl) + yw * 0.7 + sup * 2.0, 0, near ? be : 0);
    return { a1, a2, open: lerp(opn, 1, be), turn };
  };

  // one seamless, chubby limb (upper + lower segment in a single outline): light on the +x side (toward the key
  // light in these poses), shadow on the -x side, continuous through the joint; soft baby-fat creases are drawn
  // as faint partial lines, never as gaps or seams between pieces
  const limb = (L1: number, L2: number, a2: number, w0: number, w1: number, w2: number, near: boolean, rolls: number[] = []) => {
    const col = near ? skin : shade;
    const cr = near ? crease : creaseFar;
    const lb = softLimb(L1, L2, a2, w0, w1, w2);
    const wm = Math.min(w1, w2);
    const n2s: Pt = [lb.d2[1], -lb.d2[0]];
    // a soft crease part-way across segment 2 near its end (wrist / ankle), from the shadow side
    const at2 = (t: number, q: number): Pt => {
      const wq = lerp(w1, w2, t);
      return [lb.P1[0] + lb.d2[0] * L2 * t + n2s[0] * wq * q, lb.P1[1] + lb.d2[1] * L2 * t + n2s[1] * wq * q];
    };
    const endCrease = `M ${fp(at2(0.86, -0.92))} Q ${fp(at2(0.9, -0.2))} ${fp(at2(0.87, 0.45))}`;
    return (
      <g>
        <path d={lb.outline} fill={col} />
        <path d={lb.side(1, 0.5)} stroke={near ? skinLight : skin} strokeWidth={n2(wm * 0.6)} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={near ? 0.3 : 0.14} />
        <path d={lb.side(-1, 0.72)} stroke={near ? shade : deep} strokeWidth={n2(wm * 0.5)} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.22} />
        {rolls.map((r, i) => {
          const wq = lerp(w0, w1, r);
          const yy = L1 * r;
          return <path key={i} d={`M ${n2(-wq * 0.95)} ${n2(yy)} Q ${n2(-wq * 0.3)} ${n2(yy + wq * 0.28)} ${n2(wq * 0.35)} ${n2(yy - wq * 0.02)}`} stroke={cr} strokeWidth={0.55} strokeLinecap="round" fill="none" opacity={0.2} />;
        })}
        {lb.bend > 0.25 && <path d={lb.fold} stroke={cr} strokeWidth={0.7} strokeLinecap="round" fill="none" opacity={0.4 * clamp((lb.bend - 0.25) * 3)} />}
        <path d={endCrease} stroke={cr} strokeWidth={0.6} strokeLinecap="round" fill="none" opacity={0.32} />
      </g>
    );
  };

  // arms: angles in degrees, arm drawn along +y then rotated (positive = clockwise)
  const arm = (near: boolean) => {
    const sh = near ? { x: -20, y: 12 } : { x: -14, y: -12 };
    const p = armPose(near, f, L);
    const pp = armPose(near, f - 3, L - 3);
    // the hand trails the forearm a little and settles (overlapping action)
    const wrist = clamp(-(p.a1 + p.a2 - pp.a1 - pp.a2) * 0.7 - clamp(mv.drot * 1.2, -8, 8), -25, 25) * (1 - be);
    const col = near ? skin : shade;
    return (
      <g transform={`translate(${sh.x + lagX * 0.3}, ${n2(sh.y - breath * 0.3)}) rotate(${n2(p.a1)})`}>
        {limb(19, 15, p.a2, 7.4, 6.0, 4.3, near)}
        <g transform={`translate(0, 19) rotate(${n2(p.a2)})`}>
          <g transform={`translate(0, 15) rotate(${n2(wrist)})`}>
            {near && be > 0.55 && (
              <g opacity={(be - 0.55) / 0.45}>
                <circle cx={0} cy={12} r={26} fill="url(#dv-glow)" />
                <Motes f={f} x={0} y={12} n={6} spread={40} rise={-70} seed={41} />
              </g>
            )}
            <BabyHand
              uid={`${uid}${near ? "n" : "f"}`}
              L={18.5}
              open={p.open}
              turn={p.turn}
              side={near ? -1 : 1}
              f={L}
              seed={near ? 150 : 160}
              skin={col}
              shade={near ? shade : deep}
              wristW={4.3}
            />
          </g>
        </g>
      </g>
    );
  };

  // legs: knees up (newborn posture); kicks alternate between the legs, with bent knees, on a drifting rhythm
  const legPose = (near: boolean, g: number, gl: number) => {
    // g = story clock (kicking), gl = life clock (idle drift)
    const ph = g * 0.23 + 2.6 * noise1(g * 0.02, 95) + (near ? 0 : Math.PI + 0.5 * noise1(g * 0.03, 96));
    const env = sstep(0.4 + 0.85 * noise1(g * 0.035 + (near ? 0 : 0.7), 97));
    const kA = kk * env;
    const hipS = Math.sin(ph); // + draws the knee up, − pushes the leg out
    const kneeS = Math.sin(ph - 0.75); // the knee follows the hip a beat later
    const a1 = (near ? -132 : -146) + nz(near ? 7 : 8, 0.03, gl) * 22 * w + kk * 6 - kA * (6 + hipS * 16);
    const a2 = (near ? 98 : 108) + nz(near ? 9 : 10, 0.03, gl) * 26 * w - yw * 22 + kk * 4 + kA * kneeS * 26; // legs stretch a little in a yawn
    return { a1, a2, kA, ph };
  };

  const leg = (near: boolean) => {
    const hip = near ? { x: 42, y: 10 } : { x: 38, y: -4 };
    const p = legPose(near, f, L);
    const pp = legPose(near, f - 3, L - 3);
    const k = near ? 1 : 2;
    const toesN = nz(near ? 11 : 12, 0.08) * 14 * w;
    // the foot trails the shin, flexes at the ankle in a kick; at rest an occasional slow toe stretch or curl
    const follow = clamp(-(p.a1 + p.a2 - pp.a1 - pp.a2) * 0.6, -18, 18);
    const ankle = -70 + toesN * 0.3 + follow + p.kA * Math.sin(p.ph - 1.4) * 12;
    const stretch = sstep((noise1(L * 0.019 + k * 4, 170 + k) - 0.3) / 0.45) * (0.4 + 0.6 * wr);
    const grip = sstep((-noise1(L * 0.017 + k * 2, 180 + k) - 0.45) / 0.4) * 0.7 * (1 - stretch);
    const fan = clamp(stretch * 0.8 + p.kA * (0.5 + 0.5 * Math.sin(p.ph + 1.2)) * 0.7 + yw * 0.8);
    const col = near ? skin : shade;
    return (
      <g transform={`translate(${n2(hip.x + hipDx)}, ${hip.y}) rotate(${n2(p.a1)})`}>
        {limb(28, 21, p.a2, 11, 8.2, 5.6, near, [0.36, 0.6])}
        <g transform={`translate(0, 28) rotate(${n2(p.a2)})`}>
          <g transform={`translate(0, 21) rotate(${n2(ankle)})`}>
            <BabyFoot
              fan={fan}
              curl={grip}
              lit={near}
              f={L}
              seed={near ? 190 : 200}
              skin={col}
              light={near ? skinLight : skin}
              shade={near ? shade : deep}
              crease={near ? crease : creaseFar}
            />
          </g>
        </g>
      </g>
    );
  };

  const nzc = nz(13);
  return (
    <g transform={`translate(${x}, ${y + flY}) rotate(${bodyRot}) scale(${s})`}>
      <defs>
        <linearGradient id={`${uid}-tor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="60%" stopColor={skin} />
          <stop offset="100%" stopColor={shade} />
        </linearGradient>
        <radialGradient id={`${uid}-bel`} cx="0.38" cy="0.3" r="0.72">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="55%" stopColor={skin} />
          <stop offset="88%" stopColor={skin} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
        <linearGradient id={`${uid}-cl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor={cloth} />
          <stop offset="100%" stopColor={clothShade} />
        </linearGradient>
      </defs>
      <DivineAura f={f} x={hx} y={hy} level={aura} s={0.9} />
      {/* lifted by light, not shadow */}
      {float > 0.01 && <ellipse cx={8} cy={40 - flY * 0.3} rx={100} ry={16} fill="url(#dv-glow)" opacity={0.7 * float} />}

      {/* far limbs behind the body */}
      {arm(false)}
      {leg(false)}

      {/* chubby torso: the round belly rises with each breath (about 2 %), the chest barely */}
      <g transform={`translate(0, 28) scale(1, ${(1 + breath * CHEST).toFixed(4)}) translate(0, -28)`}>
        <ellipse cx={8} cy={4} rx={38} ry={24} fill={`url(#${uid}-tor)`} />
        <g transform={`translate(0, 26) scale(1, ${(1 + breath * BELLY).toFixed(4)}) translate(0, -26)`}>
          <ellipse cx={11} cy={-1} rx={25} ry={22} fill={`url(#${uid}-bel)`} />
          <ellipse cx={4} cy={-12} rx={11} ry={5} fill={skinLight} opacity={0.45} transform="rotate(-8, 4, -12)" />
          {/* soft line where the round belly meets the little ribcage */}
          <path d="M -9 -17 Q -6.5 -11 -8.5 -5" stroke={shade} strokeWidth={0.8} fill="none" opacity={0.22} />
        </g>
        <ellipse cx={-6} cy={-6} rx={18} ry={10} fill={skinLight} opacity={0.35} />
        <path d="M -26 -4 Q -22 6 -26 16" stroke={shade} strokeWidth={1.1} fill="none" opacity={0.5} />
        {/* chubby shoulders + short neck (head rests into them) */}
        <ellipse cx={-22} cy={4} rx={17} ry={21} fill={`url(#${uid}-tor)`} />
        <ellipse cx={-34} cy={2} rx={11} ry={13} fill={skin} />
        <path d="M -38 -8 Q -30 2 -36 14" stroke={shade} strokeWidth={1} fill="none" opacity={0.45} />
        {/* warm golden rim light along the shoulder and upper body */}
        <path d="M -41 -6 C -38 -12 -31 -15 -22 -16.6 C -12 -18.4 -2 -21.6 10 -22.6" stroke={DIVINE.mid} strokeWidth={1.3} strokeLinecap="round" fill="none" opacity={0.4 * clamp(aura)} />
      </g>

      {leg(true)}

      {/* soft cotton wrap over the lower belly and hips: a folded-over hem, folds from the tuck, a loose corner */}
      {/* the wrap rides up with the belly (it rises toward −y as he breathes in) */}
      <g transform={`translate(${n2(hipDx * 0.7)}, ${n2(-breath * 0.75)})`}>
        <g transform={`rotate(${n2(clothLag)}, 44, 24)`}>
          <path d={`M 39 22 Q 50 29 ${n2(54 + nz(14, 0.02) * 1.2)} 40 Q 48 42.5 41 38.5 Q 36.5 30 39 22 Z`} fill={clothShade} />
          <path d="M 41.5 25 Q 46.5 32 48.5 39.5" stroke={clothDeep} strokeWidth={0.9} fill="none" opacity={0.8} />
        </g>
        <path
          d={`M 13 -21 Q 33 ${n2(-29 - breath * 0.7)} 53 -18 Q 63 -9 ${n2(61 + nzc * 1.5)} 6 Q 59 20 47 27 Q 29 31 15 27 Q 8 18 9 4 Q 9 -10 13 -21 Z`}
          fill={`url(#${uid}-cl)`}
        />
        {/* underside in soft shadow */}
        <path d="M 15 27 Q 8 18 9 4 Q 12 16 22 23.5 Q 36 28.5 49 25.5 Q 30 31 15 27 Z" fill={clothShade} opacity={0.75} />
        {/* folds radiating from the tuck: a shadow line with a lit ridge beside it */}
        {[
          [`M 23 -19 Q 28 2 24 25`, 1.6],
          [`M 34 -21 Q 39 0 35 27`, 1.8],
          [`M 44 -18.5 Q 50 -2 47 21`, 1.4],
          [`M 16 -14 Q 20.5 -4 17.5 9`, 1.1],
          [`M 53 -12 Q 58 -1 56 11`, 1.1],
        ].map(([d, sw], i) => (
          <g key={i}>
            <path d={d as string} stroke={clothDeep} strokeWidth={sw as number} strokeLinecap="round" fill="none" opacity={0.6} />
            <path d={d as string} transform="translate(-1.3, 0)" stroke="#FFFFFF" strokeWidth={(sw as number) * 0.7} strokeLinecap="round" fill="none" opacity={0.85} />
          </g>
        ))}
        {/* folded-over top hem */}
        <path d={`M 13 -21 Q 33 ${n2(-29 - breath * 0.7)} 53 -18 L 55.5 -13.5 Q 33 ${n2(-24 - breath * 0.7)} 13.5 -16.5 Z`} fill="#FFFFFF" opacity={0.95} />
        <path d={`M 13.5 -16.5 Q 33 ${n2(-24 - breath * 0.7)} 55.5 -13.5`} stroke={clothShade} strokeWidth={1.2} fill="none" />
        <path d={`M 53 -18 Q 63 -9 ${n2(61 + nzc * 1.5)} 6`} stroke="#efe6d6" strokeWidth={2.2} fill="none" />
      </g>

      {/* soft neck: joins the tilted head to the shoulders, drawn behind the head */}
      <ellipse cx={-31} cy={15} rx={12} ry={11} fill={`url(#${uid}-tor)`} />
      <ellipse cx={-31} cy={9} rx={9} ry={4} fill={shade} opacity={0.3} />
      {/* soft divine radiance behind the head */}
      <circle cx={hx} cy={hy} r={96} fill="url(#dv-glow)" opacity={0.85 * aura} />
      {/* head: round newborn face, serene natural eyes, soft curly wisps */}
      <g transform={`translate(${hx + lagX}, ${hy + nod}) rotate(${tilt})`}>
        <BabyFace
          uid={`${uid}fc`}
          f={L}
          yaw={t * 0.75}
          gx={gx}
          gy={gy}
          close={close}
          bright={bright}
          smile={sm}
          cheeks={cheeks}
          yawn={yw}
          coo={coo}
          aura={aura}
          sway={noise1(L * 0.04, 31) * 2 - mv.dx * 0.15}
          skin={skin}
          skinLight={skinLight}
          shade={shade}
          hair="#26170F"
          hairLight="#5E3D2A"
        />
      </g>

      {/* near arm in front: waves gently, rises into blessing */}
      {arm(true)}
    </g>
  );
};
