import React from "react";
import { clamp, lerp, noise1 } from "../core/anim";
import { extremeX, FaceShape, hairBack, hairFront, hairline, HairSpec, headModel, project, silhouette, smoothPath } from "./head3d";
import { MouthState } from "./lipsync";

export type HairStyleV2 = "parted" | "tousled" | "balding" | "cropped" | "veil" | "pigtails" | "wrap" | "baby";

export interface HeadLook {
  /** True when the caller already drives blinks (Puppet does), so the head does not add a second blink. */
  noBlink?: boolean;
  skin: string;
  skinLight: string;
  skinShade: string;
  lips: string;
  hair: string;
  hairLight: string;
  hairStyle: HairStyleV2;
  cloth?: { color: string; shade: string; trim?: string }; // veil / turban cloth
  /**
   * Mustache. A number 0..1 is its weight (a thin, neat mustache; colour follows the brows).
   * A colour string (older cast sheets) draws it at full weight in that colour. Default none.
   */
  mustache?: string | number;
  glasses?: boolean;
  tilak?: boolean;
  sindoor?: boolean;
  bindi?: boolean;
  ribbon?: string;
  age: "baby" | "child" | "adult" | "elder";
  divineEyes?: boolean;
  /** Upper lash weight 0..1 (women ~1, men ~0.25). Default: women 0.85, men 0.3, children 0.45, baby 0.3. */
  lashes?: number;
  /** Soft kohl line along the upper and lower lid 0..1. Default: adult women 0.35, otherwise 0. */
  kajal?: number;
  /** Brow thickness 0.6..1.6. Default 1. */
  browWeight?: number;
  /** Lip colour. Default: the `lips` colour. */
  lipTint?: string;
  /** Crow's feet, smile lines and a soft forehead line 0..1. Default: elder 0.6, otherwise 0. */
  ageLines?: number;
  /** Grey and white strands in the hair (also greys brows and mustache) 0..1. Default 0. */
  hairGrey?: number;
}

export interface HeadState {
  yaw: number; // radians, + = face turns to screen-right
  eyeX: number;
  eyeY: number;
  close: number; // 0 open .. 1 closed (blink / lid)
  squint: number;
  brow: number;
  browTilt: number;
  mouth: MouthState;
  smile: number;
  gasp: number;
  cheeks: number;
  flush: number;
  tears: number;
  sway: number; // hair secondary motion
  f: number;
}

const HAIR: Record<HairStyleV2, HairSpec | null> = {
  parted: { front: -0.58, temple: -0.42, side: 0.1, back: 0.42, thick: 0.1, partAlpha: -0.42 },
  tousled: { front: -0.44, temple: -0.36, side: 0.02, back: 0.4, thick: 0.15, jag: 0.05, jagFreq: 13 },
  cropped: { front: -0.62, temple: -0.5, side: -0.05, back: 0.28, thick: 0.045 },
  pigtails: { front: -0.54, temple: -0.38, side: 0.14, back: 0.52, thick: 0.09, partAlpha: 0 },
  veil: { front: -0.52, temple: -0.36, side: 0.08, back: 0.5, thick: 0.08, partAlpha: 0 },
  wrap: { front: -0.4, temple: -0.4, side: 0.05, back: 0.36, thick: 0.05 },
  balding: null,
  baby: { front: -0.86, temple: -0.74, side: -0.5, back: -0.05, thick: 0.015, jag: 0.025, jagFreq: 9 },
};

// soft, short, curly baby hair: a natural infant hairline, volume over the crown and the back of the head,
// reaching the temples and round behind the ears (the toddler a little fuller)
const INFANT_CURLS: HairSpec = { front: -0.48, temple: -0.36, side: 0.04, back: 0.44, thick: 0.12, jag: 0.03, jagFreq: 15 };
const TODDLER_CURLS: HairSpec = { front: -0.45, temple: -0.34, side: 0.06, back: 0.46, thick: 0.15, jag: 0.035, jagFreq: 14 };
const TURBAN: HairSpec = { front: -0.42, temple: -0.44, side: -0.36, back: -0.12, thick: 0.22 };
const hashLike = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const toRgb = (c: string): [number, number, number] | null => {
  const m6 = /^#([0-9a-f]{6})$/i.exec(c.trim());
  if (m6) {
    const v = parseInt(m6[1], 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  const m3 = /^#([0-9a-f]{3})$/i.exec(c.trim());
  if (m3) {
    const h = m3[1];
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  return null;
};
/** Mix two hex colours (#rgb or #rrggbb); any other colour string falls back to the nearer end. */
const lerpHex = (a: string, b: string, t: number) => {
  const pa = toRgb(a);
  const pb = toRgb(b);
  if (!pa || !pb) return t < 0.5 ? a : b;
  const k = clamp(t);
  const ch = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * k);
  return `#${((1 << 24) | (ch(0) << 16) | (ch(1) << 8) | ch(2)).toString(16).slice(1)}`;
};

/* ---- small cubic Bezier helpers for lids, lash lines and lips ---- */
type Pt = [number, number];
type Cub = [Pt, Pt, Pt, Pt];
const pt = (p: Pt) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
const bez = (c: Cub, t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
};
const bezTan = (c: Cub, t: number): Pt => {
  const u = 1 - t;
  const k0 = 3 * u * u;
  const k1 = 6 * u * t;
  const k2 = 3 * t * t;
  return [
    k0 * (c[1][0] - c[0][0]) + k1 * (c[2][0] - c[1][0]) + k2 * (c[3][0] - c[2][0]),
    k0 * (c[1][1] - c[0][1]) + k1 * (c[2][1] - c[1][1]) + k2 * (c[3][1] - c[2][1]),
  ];
};
/** The part of a cubic between t0 and t1 (de Casteljau). */
const subCub = (c: Cub, t0: number, t1: number): Cub => {
  const split = (q: Cub, t: number): [Cub, Cub] => {
    const l = (p: Pt, r: Pt): Pt => [p[0] + (r[0] - p[0]) * t, p[1] + (r[1] - p[1]) * t];
    const p01 = l(q[0], q[1]);
    const p12 = l(q[1], q[2]);
    const p23 = l(q[2], q[3]);
    const p012 = l(p01, p12);
    const p123 = l(p12, p23);
    const m = l(p012, p123);
    return [
      [q[0], p01, p012, m],
      [m, p123, p23, q[3]],
    ];
  };
  const right = t0 > 0 ? split(c, t0)[1] : c;
  if (t1 >= 1) return right;
  return split(right, (t1 - t0) / (1 - t0))[0];
};
const cubD = (c: Cub) => `M ${pt(c[0])} C ${pt(c[1])} ${pt(c[2])} ${pt(c[3])}`;
const offY = (c: Cub, dy: number): Cub => c.map(([x, y]) => [x, y + dy] as Pt) as Cub;

const P = (pts: Array<[number, number]>, R: number) => smoothPath(pts, R);

/* ---- eye life: blink cadence, saccades, drift (all seeded, no fixed loops) ---- */
const FPS = 24; // every composition in this project renders at 24 fps
const seedOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 9973) / 97.3 + 1;
};
const smooth01 = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
/**
 * Blink: 5 frames closing, 6 frames opening, starts 3 to 4 s apart (seeded), never in the first 10 frames.
 * `slow` (infant / toddler Balak Thakur): a calm, unhurried blink, 7 frames closing and 9 opening, 4 to 5.5 s apart;
 * about one blink in three rests closed for 4 frames, a peaceful, knowing lid-close.
 */
const blinkAt = (fr: number, seed: number, slow = false) => {
  const cl = slow ? 7 : 5;
  const op = slow ? 9 : 6;
  let start = 10 + Math.round(hashLike(seed) * 0.5 * FPS);
  let d = -1;
  let hold = 0;
  for (let i = 0; i < 2000 && start <= fr; i++) {
    d = fr - start;
    hold = slow && hashLike(seed * 3.3 + i * 1.9 + 0.2) > 0.65 ? 4 : 0;
    start += Math.round(((slow ? 4 : 3) + (slow ? 1.5 : 1) * hashLike(seed * 1.7 + i * 3.1 + 0.5)) * FPS);
  }
  if (d < 0) return 0;
  if (d < cl) return smooth01(d / cl);
  if (d < cl + hold) return 1;
  if (d < cl + hold + op) return 1 - smooth01((d - cl - hold) / op);
  return 0;
};
/** Saccade: a 2 to 4 frame glance of 1 to 2 px, every 1.2 to 3 s (seeded). Returns iris offset in px. */
const saccadeAt = (fr: number, seed: number) => {
  let start = Math.round(hashLike(seed * 2.3 + 0.7) * 2 * FPS);
  let idx = -1;
  for (let i = 0; i < 2000 && start <= fr; i++) {
    idx = i;
    start += Math.round((1.2 + 1.8 * hashLike(seed * 5.9 + i * 1.3 + 2)) * FPS);
  }
  if (idx < 0) return { x: 0, y: 0 };
  const dur = 2 + Math.floor(hashLike(seed * 4.1 + idx * 2.7) * 3); // 2..4 frames
  const lastStart = start - Math.round((1.2 + 1.8 * hashLike(seed * 5.9 + idx * 1.3 + 2)) * FPS);
  if (fr - lastStart >= dur) return { x: 0, y: 0 };
  // 1 to 2 px, direction seeded
  const ax = (hashLike(seed * 6.7 + idx) < 0.5 ? -1 : 1) * (1 + hashLike(seed * 9.1 + idx));
  const ay = (hashLike(seed * 8.3 + idx) < 0.5 ? -1 : 1) * (0.5 + 0.5 * hashLike(seed * 10.7 + idx));
  return { x: ax, y: ay };
};

export const Head: React.FC<{
  R: number;
  shape: FaceShape;
  look: HeadLook;
  st: HeadState;
  uid: string;
  keySide: 1 | -1;
  rim: string;
  rimStrength: number;
}> = ({ R, shape, look, st, uid, keySide, rim, rimStrength }) => {
  const child = look.age === "child" || look.age === "baby";
  const elder = look.age === "elder";
  // the little ones: the crawling infant (age "baby" / FACE_BABY) and the 1-year-old (FACE_TODDLER)
  const little = look.age === "baby" || (child && shape.cheekPuff >= 0.15);
  const toddler = little && look.age !== "baby";
  // any child look or child face shape takes child defaults for the optional look fields
  const kid = child || shape.eyeRound >= 0.75;

  /* ---- child expression (kid faces only; on adult faces every one of these stays 0) ---- */
  const kOpen = Math.max(st.mouth.open, st.gasp * 0.9);
  // a true eye smile: lower lids lift, cheeks push up and round, the eyes crinkle softly
  const eyeSmile = kid ? smooth01((st.smile - 0.35) / 0.6) : 0;
  // a soft giggle: the mouth opens while he smiles, a little tongue tip shows
  const giggle = kid ? clamp(kOpen / 0.25) * clamp((st.smile - 0.45) / 0.35) * (1 - clamp(st.gasp * 2)) : 0;
  // a round "O" of wonder (gasp) with lifted brows
  const wonder = kid ? clamp(st.gasp * 1.4) : 0;
  // babbling: small, rounder open-close shapes when the mouth moves without a giggle
  const babble = little ? clamp(kOpen / 0.2) * (1 - giggle) * (1 - wonder) : 0;
  // a small content pout at rest (mouth closed, no broad smile); the chin tucks a little
  const pout = kid ? clamp((0.6 - st.smile) / 0.45) * (1 - clamp(kOpen * 5)) * (1 - wonder) * (little ? 1 : 0.5) : 0;
  // calm: the brows soften when nothing stirs
  const calm = kid ? clamp(1 - Math.abs(st.brow) * 2.5 - st.gasp * 2.5) * clamp(1 - Math.abs(st.browTilt) * 2.5) : 0;
  // the cheeks round out with the smile (quantised so the cached head models stay few)
  const cheekRound = kid ? Math.round(clamp(eyeSmile * 0.8 + clamp(st.cheeks) * 0.35) * 20) / 20 : 0;
  const s: FaceShape = cheekRound > 0 ? { ...shape, cheekSmile: cheekRound } : shape;
  const m = headModel(s);
  const yaw = clamp(st.yaw, -1.45, 1.45);
  const pr = (a: number, y: number, shell = 1, extra = 0) => project(m, a, y, yaw, shell, extra);
  const X = (v: number) => v * R;

  // newborn: egg-shaped face outline that narrows to a rounded chin (the generic silhouette ends flat)
  const eggFace = (): Array<[number, number]> => {
    const top = -1.02;
    const bottom = 0.98;
    const cyC = (top + bottom) / 2;
    const B = (bottom - top) / 2;
    const A = 0.93; // width that the hair cap is built to fit
    const right: Array<[number, number]> = [];
    for (let k = 0; k <= 40; k++) {
      const v = -1 + (2 * k) / 40; // -1 top .. +1 chin
      const base = Math.sqrt(Math.max(0, 1 - v * v));
      const taper = v < 0 ? 1 : 1 - 0.3 * v;
      right.push([A * base * taper, cyC + B * v]);
    }
    const left = right.slice(1, -1).reverse().map(([x, y]) => [-x, y] as [number, number]);
    return [...right, ...left];
  };
  // one face model for every part (outline, hair cap, ears, eyes), so the head stays consistent
  const face = silhouette(m, yaw);
  void eggFace;
  const facePath = P(face, R);
  // clip-path ids are unique per frame: Chrome caches clip geometry by id during sequential
  // video renders, which left stale eye/lid shapes on screen (ghost eyes, smeared lashes).
  const fk = `f${Math.round(st.f * 100)}`;
  // eye life: blink adds to the caller's lid value (max, so a caller blink is never reduced);
  // saccade + drift move only the iris, never the lids, head pose or mouth
  const eSeed = seedOf(uid);
  const fr = Math.floor(st.f);
  const blinkV = look.noBlink ? 0 : blinkAt(fr, eSeed, little);
  const sac0 = saccadeAt(fr, eSeed);
  const sac = little ? { x: sac0.x * 0.6, y: sac0.y * 0.6 } : sac0; // a calm, steady gaze
  const gazeCalm = 1 - 0.6 * clamp(Math.abs(st.eyeX));
  // the little ones' gaze rests steadily on its target: a slower, smaller drift
  const drift = little ? 0.65 : 1;
  const iriX = clamp((sac.x * gazeCalm) + noise1(st.f * 0.015 * drift, eSeed) * 1.2 * drift, -2.5, 2.5);
  const iriY = clamp((sac.y * gazeCalm) + noise1(st.f * 0.011 * drift, eSeed + 5) * 0.6 * drift, -1.5, 1.5);

  /* ---- look parameters (all optional; defaults keep older callers looking right) ---- */
  const baby = look.age === "baby";
  const fem = !!(look.sindoor || look.bindi || look.hairStyle === "veil" || look.hairStyle === "pigtails");
  const lashes = clamp(look.lashes ?? (kid ? 0.5 : fem ? 0.85 : 0.3));
  const kajal = clamp(look.kajal ?? (fem && !kid ? 0.35 : 0));
  const browW = clamp(look.browWeight ?? (kid ? 0.7 : 1), 0.6, 1.6);
  const lipTint = look.lipTint ?? (kid ? lerpHex(look.lips, "#e98f95", 0.5) : look.lips); // soft pink for children
  const ageL = clamp(look.ageLines ?? (elder && !kid ? 0.6 : 0));
  const hg = clamp(look.hairGrey ?? 0);
  const mustW = typeof look.mustache === "number" ? clamp(look.mustache) : look.mustache && !kid ? 1 : 0;
  // little ones keep a faint, peaceful smile at rest; their laugh opens softly, never a wide grin
  const smileM = little ? st.smile + 0.18 * (1 - clamp(st.smile)) : st.smile;
  // fine details (single lashes, brow hairs, lip highlight) fade out on small, distant heads
  const det = clamp((R - 16) / 34);
  const kS = keySide; // the lit side of the face on screen
  const lashCol = "#1b100b";
  const creaseCol = lerpHex(look.skinShade, "#3a2116", 0.3);
  const hairC = lerpHex(look.hair, "#bcb7af", hg * 0.3);
  const hairLightC = lerpHex(look.hairLight, "#efebe5", hg * 0.5);

  /* ---------------- eyes ---------------- */
  const ew = s.eyeSize * (1 + st.gasp * 0.08);
  const eh = ew * (0.6 + 0.4 * s.eyeRound) * (1 + st.gasp * 0.22);
  const eye = (side: 1 | -1) => {
    const a = side * s.eyeSep;
    const p = pr(a, s.eyeY, 1, -0.03);
    // visibility follows depth only (true occlusion): both eyes stay equally solid while they face
    // the camera side, and the eye fades out only at the edge where it rolls behind the head
    const vis = clamp(p.z / 0.12);
    if (vis <= 0.02) return null;
    const sx = clamp(p.n, 0.36, 1);
    const cid = `${uid}-e${side > 0 ? "r" : "l"}-${fk}`;
    const close = Math.max(clamp(st.close), blinkV);
    const W = X(ew);
    const H = X(eh);
    const gy = clamp(st.eyeY, -1, 1);
    const r = s.eyeRound;
    // local frame: u runs from the inner corner (-W, toward the nose) to the outer corner (+W)
    const Q = (u: number, y: number): Pt => [side * u, y];
    // almond (adult) ↔ round (child) opening: the upper lid peaks a little toward the nose,
    // the lower lid dips a little toward the outer corner, the outer corner sits slightly higher
    const I = Q(-W, H * lerp(0.1, 0.03, r));
    const O = Q(W, -H * lerp(0.13, 0.03, r));
    const U1 = Q(-W * lerp(0.55, 0.75, r), -H * lerp(1.4, 1.33, r));
    const U2 = Q(W * lerp(0.5, 0.75, r), -H * lerp(1.22, 1.33, r));
    const L1 = Q(W * lerp(0.5, 0.75, r), H * lerp(0.98, 1.3, r));
    const L2 = Q(-W * lerp(0.6, 0.75, r), H * lerp(1.04, 1.3, r));
    const shapeD = `M ${pt(I)} C ${pt(U1)} ${pt(U2)} ${pt(O)} C ${pt(L1)} ${pt(L2)} ${pt(I)} Z`;
    // lower lid: rises with squint
    // children: the eye smile lifts the lower lid into a soft happy crescent
    const sq = kid ? clamp(clamp(st.squint) * 0.8 + eyeSmile * 0.3, 0, 0.66) : clamp(st.squint) * 0.8;
    const lowC: Cub = [O, [L1[0], lerp(L1[1], -H * 0.2, sq)], [L2[0], lerp(L2[1], -H * 0.15, sq)], I];
    // upper lid: rests a touch over the iris on adults, follows the gaze, closes onto the lower lid
    // serene, half-relaxed lids on the little ones; adults rest a touch over the iris
    const rest = little ? 0.2 : child ? 0 : 0.07;
    // children: the upper lid settles a little in the eye smile and lifts a little more in wonder
    const lt = clamp(Math.max(close, rest) + 0.14 * gy - 0.12 * st.gasp + 0.07 * eyeSmile - 0.05 * wonder, 0, 1);
    const lidC: Cub = [I, [lerp(U1[0], lowC[2][0], lt), lerp(U1[1], lowC[2][1] * 1.04, lt)], [lerp(U2[0], lowC[1][0], lt), lerp(U2[1], lowC[1][1] * 1.04, lt)], O];
    const lidD = `${cubD(lidC)} L ${pt(Q(W + 4, -H * 3))} L ${pt(Q(-W - 4, -H * 3))} Z`;
    const lowD = `${cubD(lowC)} L ${pt(Q(-W - 4, H * 3))} L ${pt(Q(W + 4, H * 3))} Z`;
    const ir = H * (baby ? 0.88 : child ? 0.86 : 0.8);
    const ix = clamp(st.eyeX, -1, 1) * W * 0.42 + iriX;
    const iy = gy * H * 0.42 + iriY;
    const tg = st.tears > 0 ? clamp(st.tears * 2.5) : 0; // wet glisten
    // closed lids turn the single lashes downward
    const shut = smooth01((lt - 0.55) / 0.45);
    // upper lid crease, eased down as the lid closes
    const cDrop = H * 0.35 * close;
    const cH = child ? 0.9 : 1;
    const crease: Cub = [Q(-W * 0.72, -H * 0.5 * cH + cDrop), Q(-W * 0.3, -H * 1.68 * cH + cDrop), Q(W * 0.5, -H * 1.6 * cH + cDrop), Q(W * 1.02, -H * 0.42 * cH + cDrop)];
    const lidToneD = `M ${pt(I)} C ${pt(U1)} ${pt(U2)} ${pt(O)} L ${pt(crease[3])} C ${pt(crease[2])} ${pt(crease[1])} ${pt(crease[0])} Z`;
    // lash line: thin at the inner corner, fuller toward the outer corner
    const lw = Math.max(1.1, W * (little ? 0.06 + 0.04 * lashes : 0.08 + 0.09 * lashes));
    const flickTs = lashes > 0.12 && det > 0.05 ? [0.5, 0.63, 0.75, 0.86, 0.95, 1].slice(lashes > 0.6 ? 0 : 3) : [];
    const flicks = flickTs.map((t) => {
      const P0 = bez(lidC, t);
      const T0 = bezTan(lidC, t);
      const tl = Math.hypot(T0[0], T0[1]) || 1;
      let nx = T0[1] / tl;
      let ny = -T0[0] / tl;
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      let dx = lerp(nx, side * 0.35, shut) + side * 0.45 * t;
      let dy = lerp(ny, 0.9, shut);
      const dl = Math.hypot(dx, dy) || 1;
      dx /= dl;
      dy /= dl;
      // little ones: short, delicate lashes
      const len = H * (0.2 + 0.36 * lashes) * (0.55 + 0.45 * t) * (1 - 0.3 * shut) * (little ? 0.55 : 1);
      return `M ${pt(P0)} Q ${pt([P0[0] + dx * len * 0.5, P0[1] + dy * len * 0.5 + len * 0.08])} ${pt([P0[0] + dx * len + side * len * 0.18, P0[1] + dy * len])}`;
    });
    const scleraTop = H * 0.85;
    return (
      <g key={`${side}-${fk}`} transform={`translate(${X(p.x)}, ${X(p.y)}) scale(${sx}, 1)`} opacity={vis}>
        <defs>
          <clipPath id={cid}>
            <path d={shapeD} />
          </clipPath>
        </defs>
        {/* soft socket shade above the eye (adults), lid tone between crease and lash line */}
        {!child && <ellipse cx={0} cy={-H * 0.5} rx={W * 1.5} ry={H * 1.55} fill={`url(#${uid}-sh)`} opacity={0.4} />}
        {!baby && <path d={lidToneD} fill={look.skinShade} opacity={child ? 0.08 : 0.2} />}
        <g clipPath={`url(#${cid})`}>
          <path d={shapeD} fill={`url(#${uid}-scl)`} />
          {!baby && <ellipse cx={I[0] + side * W * 0.1} cy={I[1] - H * 0.06} rx={W * 0.1} ry={H * 0.24} fill="#e0978a" opacity={0.5} />}
          <circle cx={ix} cy={iy} r={ir} fill={`url(#${uid}-iris${look.divineEyes ? "d" : ""})`} />
          <circle cx={ix} cy={iy} r={ir * 0.95} fill="none" stroke="#120a06" strokeWidth={Math.max(0.6, ir * 0.1)} opacity={0.75} />
          <circle cx={ix} cy={iy} r={ir * (kid ? 0.45 + 0.04 * wonder : 0.42)} fill="#0b0605" />
          {/* children: warm light gathers softly in the lower iris (a living reflection, not a glow) */}
          {kid && <ellipse cx={ix - kS * ir * 0.12} cy={iy + ir * 0.5} rx={ir * 0.62} ry={ir * 0.36} fill={`url(#${uid}-iwarm)`} opacity={0.75 + 0.2 * eyeSmile} />}
          {/* the upper lid casts a soft shadow over the top of the eyeball and iris */}
          <ellipse cx={0} cy={-scleraTop} rx={W * 1.2} ry={H * 0.62} fill="#4a2c20" opacity={0.26} />
          {/* catchlights: one soft window light on the lit side, a small bounce opposite */}
          <ellipse cx={ix + kS * ir * 0.36} cy={iy - ir * 0.38} rx={ir * (child ? 0.25 : 0.21)} ry={ir * (child ? 0.22 : 0.18)} fill="#ffffff" opacity={0.95} />
          {(!little || tg > 0) && <circle cx={ix - kS * ir * 0.32} cy={iy + ir * 0.38} r={ir * 0.09} fill="#ffffff" opacity={Math.min(0.9, 0.5 + tg * 0.3)} />}
          <path d={lidD} fill={look.skin} />
          <path d={lowD} fill={look.skin} />
        </g>
        {/* soft lower lid */}
        <path d={cubD(subCub(offY(lowC, H * 0.12), 0, 0.92))} stroke={creaseCol} strokeWidth={Math.max(0.7, W * 0.04)} fill="none" strokeLinecap="round" opacity={(child ? 0.18 : 0.3) + (little ? 0.25 * clamp(st.squint) : 0)} />
        {/* children's eye smile: the lifted cheek makes a soft rounded fold under the eye, catches light,
            and one faint crinkle forms at the outer corner */}
        {kid && eyeSmile > 0.05 && (
          <g strokeLinecap="round">
            <ellipse cx={side * W * 0.08} cy={H * 1.45} rx={W * 0.78} ry={H * 0.32} fill={look.skinLight} opacity={0.2 * eyeSmile} />
            <path d={cubD(subCub(offY(lowC, H * 0.55), 0.14, 0.86))} stroke={creaseCol} strokeWidth={Math.max(0.6, W * 0.035)} fill="none" opacity={0.16 * eyeSmile} />
            {det > 0.1 && (
              <path d={`M ${pt(Q(W * 1.06, H * 0.05))} q ${side * W * 0.14} ${H * 0.08} ${side * W * 0.22} ${H * 0.3}`} stroke={creaseCol} strokeWidth={Math.max(0.5, W * 0.03)} fill="none" opacity={0.14 * eyeSmile * det} />
            )}
          </g>
        )}
        {kajal > 0.02 && (
          <>
            <path d={cubD(subCub(lowC, 0, 0.85))} stroke="#24140e" strokeWidth={Math.max(0.8, W * (0.035 + 0.035 * kajal))} fill="none" strokeLinecap="round" opacity={0.75 * kajal} />
            <path d={cubD(lidC)} stroke={lashCol} strokeWidth={lw * (1.6 + kajal)} fill="none" strokeLinecap="round" opacity={0.22 * kajal} />
            <path d={`M ${pt(O)} q ${side * W * 0.16} ${-H * 0.04} ${side * W * 0.32} ${-H * 0.2}`} stroke={lashCol} strokeWidth={lw * 0.55} fill="none" strokeLinecap="round" opacity={0.85 * kajal * (1 - shut)} />
          </>
        )}
        {/* upper lash line follows the lid */}
        <path d={cubD(lidC)} stroke={lashCol} strokeWidth={lw * 0.6} fill="none" strokeLinecap="round" />
        <path d={cubD(subCub(lidC, 0.3, 1))} stroke={lashCol} strokeWidth={lw} fill="none" strokeLinecap="round" />
        {flicks.map((d, i) => (
          <path key={`lf${i}`} d={d} stroke={lashCol} strokeWidth={Math.max(0.6, lw * 0.42)} fill="none" strokeLinecap="round" opacity={clamp(0.4 + lashes) * det} />
        ))}
        {/* upper lid crease */}
        <path d={cubD(crease)} stroke={creaseCol} strokeWidth={Math.max(0.7, W * 0.045)} fill="none" strokeLinecap="round" opacity={(baby ? 0.12 : child ? 0.22 : 0.5) * (1 - 0.5 * close)} />
        {/* crow's feet and a soft under-eye line (ageLines) */}
        {ageL > 0.02 && !child && (
          <g stroke={creaseCol} strokeWidth={Math.max(0.7, W * 0.04)} fill="none" strokeLinecap="round" opacity={ageL * 0.5 * (0.75 + 0.25 * clamp(st.smile))}>
            {[-0.32, 0.02, 0.36].map((k) => (
              <path key={k} d={`M ${pt(Q(W * 1.12, k * H))} Q ${pt(Q(W * 1.32, k * H * 1.25 - H * 0.04))} ${pt(Q(W * 1.55, k * H * 1.9))}`} />
            ))}
            {ageL > 0.2 && <path d={`M ${pt(Q(-W * 0.55, H * 1.25))} Q ${pt(Q(W * 0.1, H * 1.6))} ${pt(Q(W * 0.75, H * 1.15))}`} opacity={0.65} />}
          </g>
        )}
        {/* tears: only when tears > 0. A light wet glisten first; a bead from 0.15; a running tear from 0.3 */}
        {st.tears > 0 &&
          (() => {
            const bead = bez(lowC, 0.7);
            const tb = clamp((st.tears - 0.15) / 0.2);
            const tw = clamp((st.tears - 0.3) / 0.4);
            const endY = bead[1] + H * (1.5 + 2 * tw);
            return (
              <g>
                <path d={cubD(subCub(lowC, 0.05, 0.95))} stroke="#eef9ff" strokeWidth={Math.max(0.9, W * 0.06)} fill="none" strokeLinecap="round" opacity={0.75 * tg} />
                {tb > 0 && <ellipse cx={bead[0]} cy={bead[1] + W * 0.06} rx={W * 0.08} ry={W * 0.1} fill="#d9f0ff" opacity={0.9 * tb} />}
                {tw > 0 && (
                  <>
                    <path d={`M ${pt(bead)} Q ${pt([bead[0] - side * W * 0.15, bead[1] + H * 1.2])} ${pt([bead[0] - side * W * 0.05, endY])}`} stroke="#cfeaff" strokeWidth={Math.max(1.2, W * 0.07)} fill="none" strokeLinecap="round" opacity={0.6 * tw} />
                    <circle cx={bead[0] - side * W * 0.05} cy={endY + ((st.f * 1.3) % (H * 1.2))} r={Math.max(1.4, W * 0.08)} fill="#d8f1ff" opacity={0.8 * tw} />
                  </>
                )}
              </g>
            );
          })()}
      </g>
    );
  };

  /* ---------------- brows ---------------- */
  const browBase = ["veil", "wrap", "balding", "baby"].includes(look.hairStyle) || look.hair.startsWith("#d") || look.hair.startsWith("#e")
    ? look.age === "elder"
      ? "#9c948a"
      : look.age === "baby"
        ? "#6a4a38"
        : "#2a1a14"
    : look.hair;
  const browCol = lerpHex(browBase, "#cfcac2", hg * 0.6);
  const tP = Math.max(0, st.browTilt); // + : inner ends lift and draw together (worry, sorrow, fear)
  const tN = Math.max(0, -st.browTilt); // - : inner ends pull down and together (anger, concentration)
  const brow = (side: 1 | -1) => {
    const a = side * s.eyeSep * 1.02;
    // children: soft brows lift a little more in wonder and with feeling, settle lower and softer in calm,
    // and drift very slightly (they never sit frozen)
    const kidLift = kid ? Math.max(0, st.brow) * 0.012 + wonder * 0.02 + eyeSmile * 0.006 - calm * 0.01 + noise1(st.f * 0.018, eSeed + 9) * 0.004 : 0;
    const y = s.eyeY - (child ? 0.22 : 0.2) - st.brow * 0.06 - st.gasp * 0.05 - kidLift;
    const p = pr(a, y, 1, 0.02);
    const vis = clamp((p.n - 0.34) / 0.1);
    if (vis <= 0.02 || p.z < 0.05) return null;
    const sx = clamp(p.n, 0.36, 1);
    const W = X(ew * 1.22);
    const T = X((baby ? 0.03 : toddler ? 0.04 : child ? 0.044 : 0.054) * browW);
    // arch rises in surprise, flattens when the brows knit
    const archKid = kid ? 0.25 * wonder + 0.15 * Math.max(0, st.brow) - 0.18 * calm : 0;
    const arch = X(child ? 0.035 : 0.05) * (1 + 0.5 * Math.max(0, st.brow) + 0.4 * st.gasp - 0.35 * tN - 0.25 * tP + archKid);
    // inner end (+ tilt lifts it); a child's inner ends also rise a touch in wonder
    const yi = -st.browTilt * X(0.05) - (kid ? wonder * X(0.008) : 0);
    const tail = st.browTilt * X(0.012) - tN * X(0.01);
    const uIn = -W - W * (0.1 * tP + 0.12 * tN);
    const B = (u: number, yy: number) => `${(side * u).toFixed(2)} ${yy.toFixed(2)}`;
    const d = `M ${B(uIn, yi + T * 0.45)}
      C ${B(uIn - T * 0.25, yi + T * 0.1)} ${B(uIn - T * 0.1, yi - T * 0.55)} ${B(uIn + T * 0.35, yi - T * 0.6)}
      C ${B(-W * 0.35, yi * 0.7 - T * 0.75 - arch * 0.7)} ${B(W * 0.15, -T * 0.55 - arch * 1.05 + yi * 0.25)} ${B(W * 0.5, -T * 0.3 - arch)}
      Q ${B(W * 0.85, -arch * 0.75 + tail)} ${B(W * 1.04, -arch * 0.15 + T * 0.12 + tail)}
      Q ${B(W * 0.8, -arch * 0.62 + T * 0.22 + tail)} ${B(W * 0.48, -arch * 0.85 + T * 0.3)}
      C ${B(W * 0.1, -arch * 0.85 + T * 0.55 + yi * 0.25)} ${B(-W * 0.4, yi * 0.7 + T * 0.6 - arch * 0.45)} ${B(uIn, yi + T * 0.45)} Z`;
    // a few fine hairs feather the inner end on close-ups
    const hairs = det > 0.2 && !little ? [0, 1, 2, 3] : [];
    return (
      <g key={side} transform={`translate(${X(p.x)}, ${X(p.y)}) scale(${sx}, 1)`} opacity={(baby ? 0.32 : toddler ? 0.55 : 1) * vis}>
        <path d={d} fill={browCol} opacity={0.94} />
        {hairs.map((k) => {
          const u0 = uIn + T * 0.25 + k * W * 0.1;
          const y0 = yi * (1 - k * 0.18) + T * 0.35 - k * arch * 0.12;
          return (
            <path
              key={k}
              d={`M ${B(u0, y0)} Q ${B(u0 + W * 0.02, y0 - T * 0.5)} ${B(u0 + W * 0.09, y0 - T * 0.95)}`}
              stroke={browCol}
              strokeWidth={Math.max(0.5, T * 0.16)}
              fill="none"
              strokeLinecap="round"
              opacity={0.55 * det}
            />
          );
        })}
      </g>
    );
  };

  /* ---------------- nose ---------------- */
  const tip = pr(0, m.noseTipY, 1);
  const noseRootY = s.eyeY - 0.02;
  const noseContour: Array<[number, number]> = [];
  if (Math.abs(yaw) > 0.12) {
    for (let i = 0; i <= 8; i++) {
      const y = noseRootY + ((m.noseTipY + 0.03 - noseRootY) * i) / 8;
      // nose ridge as seen from the camera: the extreme x among nose-surface points,
      // kept only when it comes from the nose itself (not the cheek beside it)
      let best = yaw > 0 ? -Infinity : Infinity;
      let bestA = 0;
      for (let a = -0.4; a <= 0.4; a += 0.02) {
        const q = pr(a, y);
        if (yaw > 0 ? q.x > best : q.x < best) {
          best = q.x;
          bestA = a;
        }
      }
      if (Math.abs(bestA) < 0.24 && m.bump(bestA, y) > 0.05) noseContour.push([best, y]);
    }
  }
  const nK = baby ? 0.6 : toddler ? 0.68 : child ? 0.75 : 1; // small, button nose for children
  const nw = s.noseWidth * nK;
  const noseDark = lerpHex(look.skinShade, "#3a1a12", 0.35);
  const noseOp = baby ? 0.45 : child ? 0.65 : 1;
  // soft bridge shadow on the side away from the light
  const bridge = (() => {
    if (baby) return null;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= 6; i++) {
      const y = noseRootY + 0.06 + ((m.noseTipY - 0.05 - noseRootY - 0.06) * i) / 6;
      const q = pr(-kS * 0.07 * nw, y, 1, 0.005);
      if (q.z > 0.1) pts.push([q.x, y]);
    }
    return pts.length > 2 ? smoothPath(pts, R, false) : null;
  })();
  const bridgeHi = (() => {
    if (child) return null;
    const a0 = pr(kS * 0.02, noseRootY + 0.12, 1, 0.01);
    const a1 = pr(kS * 0.02, m.noseTipY - 0.06, 1, 0.01);
    return a0.z > 0.1 && a1.z > 0.1 ? `M ${X(a0.x)} ${X(a0.y)} L ${X(a1.x)} ${X(a1.y)}` : null;
  })();
  const alar = (side: 1 | -1) => {
    if (baby) return null; // the infant's button nose has no drawn wings
    if (Math.abs(yaw) > 0.45 && side * yaw > 0) return null; // far wing hides behind the nose
    const a0 = pr(side * 0.045 * nw, m.noseTipY - 0.035 * nK, 1, 0.01);
    const a1 = pr(side * 0.1 * nw, m.noseTipY + 0.02 * nK, 1, 0.01);
    const a2 = pr(side * 0.05 * nw, m.noseTipY + 0.055 * nK, 1, 0.01);
    if (a1.z < 0.12 || a1.n < 0.2) return null;
    return (
      <path
        key={`al${side}`}
        d={`M ${X(a0.x)} ${X(a0.y)} Q ${X(a1.x + (a1.x - a0.x) * 0.25)} ${X(a1.y)} ${X(a2.x)} ${X(a2.y)}`}
        stroke={noseDark}
        strokeWidth={Math.max(0.7, R * 0.016)}
        fill="none"
        strokeLinecap="round"
        opacity={0.45 * noseOp}
      />
    );
  };
  const nostril = (side: 1 | -1) => {
    const p = pr(side * 0.06 * nw, m.noseTipY + 0.05 * nK, 1, 0.04);
    if (p.z < 0.15 || p.n < 0.25) return null;
    if (Math.abs(yaw) > 0.45 && side * yaw > 0) return null; // far nostril hides behind the nose
    return (
      <ellipse
        key={side}
        cx={X(p.x)}
        cy={X(p.y)}
        rx={X(0.024 * nw) * clamp(p.n, 0.3, 1)}
        ry={X(0.012 * nK)}
        fill={noseDark}
        opacity={0.55 * noseOp}
        transform={`rotate(${side * 18}, ${X(p.x)}, ${X(p.y)})`}
      />
    );
  };
  const under = pr(0, m.noseTipY + 0.06 * nK, 1, 0.02);
  const colL = pr(-0.035 * nw, m.noseTipY + 0.05 * nK, 1, 0.03);
  const colR = pr(0.035 * nw, m.noseTipY + 0.05 * nK, 1, 0.03);

  /* ---------------- mouth ---------------- */
  const mw = 0.3 * (child ? 0.85 : 1) * (baby ? 0.6 : 1);
  const mo = st.mouth;
  const open = Math.max(mo.open, st.gasp * 0.9);
  // a baby's babble rounds the small open-close shapes
  const round = Math.max(mo.round, st.gasp * 0.8, 0.35 * babble);
  const widthK0 = (st.gasp > 0.1 ? lerp(mo.width, 0.75, st.gasp) : mo.width) * (1 + 0.12 * smileM) * (1 - 0.32 * round) * (little ? 1 - 0.2 * clamp(open) : 1);
  // children: the pout draws the lips in a little, and the smile never widens into a cartoon grin
  const widthK = kid ? Math.min(widthK0 * (1 - 0.12 * pout), little ? 1.1 : 1.18) : widthK0;
  const cL = pr(-mw * widthK, m.mouthY - smileM * 0.04, 1, 0.02);
  const cR = pr(mw * widthK, m.mouthY - smileM * 0.04, 1, 0.02);
  const cM = pr(0, m.mouthY, 1, 0.03);
  const xl = X(cL.z > -0.05 ? cL.x : cM.x - 0.02);
  const xr = X(cR.z > -0.05 ? cR.x : cM.x + 0.02);
  const cx = X(cM.x);
  const my = X(m.mouthY);
  // newborn smile is wider and lifts more (his blush setting must not flatten the mouth)
  const sK = baby ? 1.35 : toddler ? 1.15 : 1; // gentle closed smile
  const cornerY = my - X(smileM * 0.045 * sK);
  const oh = X(mw * 1.1 * open * (little ? 0.78 : 1)); // little ones' mouths open softly
  const midY = my + X(smileM * 0.06 * sK);
  const mid = `${uid}-mouth-${fk}`;
  const lipW = Math.max(1.6, R * 0.05 * (0.55 + 0.45 * Math.cos(yaw)));
  const ul = X(0.036 * s.lips); // upper lip height
  const ll = X(0.052 * s.lips); // lower lip height (fuller)
  const lipOp = look.lipTint ? 0.92 : fem ? 0.85 : child ? 0.62 : 0.5;
  const lipUpper = lerpHex(lipTint, "#5a1f1c", 0.18);
  const lipLine = lerpHex(lipTint, "#3a0f10", 0.6);
  const det2 = clamp((R - 14) / 30);
  /** Closed lips: a cupid's-bow upper lip, a fuller lower lip with a soft highlight, a fine parting line. */
  const lipsClosed = (x0: number, x1: number, xc: number, cy: number, my2: number, k = 1, lowK = 1) => {
    const xQ = (t: number) => (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * xc + t * t * x1;
    const yL = (t: number) => (1 - t) * (1 - t) * cy + 2 * t * (1 - t) * my2 + t * t * cy;
    const u = ul * k;
    const l = ll * k * lowK; // lowK > 1: a fuller, slightly pushed-out lower lip (a child's pout)
    const upper = `M ${x0} ${cy} C ${xQ(0.14)} ${yL(0.14) - u * 0.45} ${xQ(0.26)} ${yL(0.26) - u * 1.02} ${xQ(0.37)} ${yL(0.37) - u}
      Q ${xQ(0.5)} ${yL(0.5) - u * 0.55} ${xQ(0.63)} ${yL(0.63) - u}
      C ${xQ(0.74)} ${yL(0.74) - u * 1.02} ${xQ(0.86)} ${yL(0.86) - u * 0.45} ${x1} ${cy}
      Q ${xc} ${my2} ${x0} ${cy} Z`;
    const lower = `M ${x0} ${cy} Q ${xc} ${my2} ${x1} ${cy}
      C ${xQ(0.85)} ${yL(0.85) + l * 0.8} ${xQ(0.66)} ${yL(0.5) + l * 1.08} ${xQ(0.5)} ${yL(0.5) + l}
      C ${xQ(0.34)} ${yL(0.5) + l * 1.08} ${xQ(0.15)} ${yL(0.15) + l * 0.8} ${x0} ${cy} Z`;
    const span = Math.abs(x1 - x0);
    return (
      <g>
        <ellipse cx={xQ(0.5)} cy={yL(0.5) + l + X(0.03)} rx={span * 0.28} ry={X(0.022)} fill={look.skinShade} opacity={0.28} />
        <path d={lower} fill={lipTint} opacity={lipOp} />
        <path d={upper} fill={lipUpper} opacity={lipOp} />
        <ellipse cx={xQ(0.5) + kS * X(0.015)} cy={yL(0.5) + l * 0.45} rx={span * 0.12} ry={l * 0.2} fill="#fff3ea" opacity={0.35 * det2 * (lipOp + 0.1)} />
        <path d={`M ${x0} ${cy} Q ${xc} ${my2} ${x1} ${cy}`} stroke={lipLine} strokeWidth={Math.max(1.1, lipW * 0.45)} fill="none" strokeLinecap="round" />
      </g>
    );
  };
  // open-mouth outline. Children: a round "O" of wonder keeps its control points at the corners (a true
  // rounded opening, not a pointed lens); adults keep the original shape exactly
  const oR = kid ? Math.max(wonder, clamp((round - 0.45) / 0.45)) : 0;
  const halfW = Math.abs(xr - xl) / 2;
  const fxT = lerp(0.4 + round * 0.25, 0.04, oR);
  const fxB = lerp(0.3 + round * 0.2, 0.04, oR);
  const topY = oR > 0 ? lerp(my - oh * 0.5, cornerY - Math.min(oh, halfW) * 1.2, oR) : my - oh * 0.5;
  const botY = oR > 0 ? lerp(my + oh * 1.05, cornerY + Math.min(oh * 1.3, halfW * 1.45), oR) : my + oh * 1.05;
  const topD = `M ${xl} ${cornerY} C ${lerp(xl, cx, fxT)} ${topY} ${lerp(xr, cx, fxT)} ${topY} ${xr} ${cornerY}`;
  const botD = `M ${xr} ${cornerY} C ${lerp(xr, cx, fxB)} ${botY} ${lerp(xl, cx, fxB)} ${botY} ${xl} ${cornerY}`;
  const mouthShape = `M ${xl} ${cornerY} C ${lerp(xl, cx, fxT)} ${topY} ${lerp(xr, cx, fxT)} ${topY} ${xr} ${cornerY} C ${lerp(xr, cx, fxB)} ${botY} ${lerp(xl, cx, fxB)} ${botY} ${xl} ${cornerY} Z`;
  // puffed cheeks press the lips small; a smiling child keeps the smile instead
  // Speech always wins: a speaking mouth (open above a small threshold) is never pressed small by a cheek blush,
  // so a character with warm cheeks still lip-syncs (this hid Charu's lip sync in the Episode 2 fox scene).
  const puffed = st.cheeks > 0.3 && !baby && !(kid && st.smile > 0.3) && st.mouth.open < 0.06;
  const mouthEl =
    puffed ? (
      lipsClosed(cx - X(0.065), cx + X(0.065), cx, my, my - X(0.006), 0.85)
    ) : oh < 1.4 ? (
      <g>
        {/* children at rest: a small rosebud pout, the lower lip a little fuller */}
        {kid ? lipsClosed(xl, xr, cx, cornerY, midY, 1 + 0.06 * pout, 1 + 0.22 * pout) : lipsClosed(xl, xr, cx, cornerY, midY)}
        {/* corners lift into a soft smile tuck (adults; children get dimples instead) */}
        {st.smile > 0.15 && !kid && det2 > 0.1 &&
          ([-1, 1] as const).map((dir) => {
            const x0 = dir < 0 ? xl : xr;
            return (
              <path
                key={`ct${dir}`}
                d={`M ${x0 + dir * X(0.006)} ${cornerY + X(0.004)} q ${dir * X(0.018)} ${-X(0.006)} ${dir * X(0.026)} ${-X(0.026)}`}
                stroke={creaseCol}
                strokeWidth={Math.max(0.7, R * 0.012)}
                fill="none"
                strokeLinecap="round"
                opacity={0.4 * clamp(st.smile) * det2}
              />
            );
          })}
      </g>
    ) : (
      <g key={fk}>
        <defs>
          <clipPath id={mid}>
            <path d={mouthShape} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${mid})`}>
          {/* children: a softer, warmer mouth interior; the little ones show no teeth */}
          {kid ? (
            <rect x={xl - 4} y={Math.min(my, cornerY) - oh * 1.6} width={xr - xl + 8} height={oh * 4.2 + Math.abs(my - cornerY)} fill="#5c1a20" />
          ) : (
            <rect x={xl - 4} y={my - oh} width={xr - xl + 8} height={oh * 2.6} fill="#3e1013" />
          )}
          {mo.teeth > 0.05 && !little && <rect x={xl} y={my - oh * 0.55} width={xr - xl} height={oh * 0.36 * (0.3 + mo.teeth)} fill="#fbf4ea" />}
          {/* tongue; in a child's giggle the tip rises a little behind the lower lip */}
          <ellipse cx={cx} cy={my + oh * (kid ? lerp(0.85, 0.55, giggle) : 0.85)} rx={(xr - xl) * (kid ? lerp(0.36, 0.3, giggle) : 0.36)} ry={oh * (kid ? lerp(0.42, 0.5, giggle) : 0.42)} fill={kid ? "#d0686e" : "#c25a5f"} />
          {kid && giggle > 0.05 && <ellipse cx={cx + kS * (xr - xl) * 0.04} cy={my + oh * 0.4} rx={(xr - xl) * 0.1} ry={oh * 0.13} fill="#f3a7a6" opacity={0.55 * giggle} />}
        </g>
        <path d={botD} fill="none" stroke={lipTint} strokeWidth={Math.max(lipW * 0.9, ll * 1.05)} strokeLinecap="round" opacity={Math.max(0.75, lipOp)} />
        <path d={topD} fill="none" stroke={lipUpper} strokeWidth={Math.max(lipW * 0.7, ul * 0.95)} strokeLinecap="round" opacity={Math.max(0.75, lipOp)} />
        <ellipse cx={cx + kS * X(0.012)} cy={my + oh * 0.79 + ll * 0.25} rx={(xr - xl) * 0.11} ry={ll * 0.16} fill="#fff3ea" opacity={0.3 * det2} />
        <path d={mouthShape} fill="none" stroke={lipLine} strokeWidth={Math.max(0.8, lipW * 0.25)} opacity={0.6} />
      </g>
    );
  // children: tiny soft dimples just outside the mouth corners as the smile warms (closed or giggling)
  const dimple = kid && !puffed ? clamp((st.smile - 0.5) / 0.35) * clamp(det2 * 1.5) : 0;
  const dimpleEl =
    dimple > 0.03
      ? ([-1, 1] as const).map((dir) => {
          const c = dir < 0 ? cL : cR;
          if (c.z < 0.05 || c.n < 0.3) return null;
          const x0 = (dir < 0 ? xl : xr) + dir * X(0.03);
          const y0 = cornerY + X(0.014);
          return (
            <g key={`dp${dir}`}>
              <ellipse cx={x0} cy={y0} rx={Math.max(0.5, X(0.012))} ry={Math.max(0.7, X(0.018))} fill={look.skinShade} opacity={0.42 * dimple} transform={`rotate(${-dir * 22}, ${x0}, ${y0})`} />
              <ellipse cx={x0 + dir * X(0.014)} cy={y0 - X(0.014)} rx={X(0.018)} ry={X(0.011)} fill={look.skinLight} opacity={0.3 * dimple} />
            </g>
          );
        })
      : null;
  // thin, neat mustache sitting on the upper lip line; it follows the corners
  const mustacheEl =
    mustW > 0.02 && cM.z > 0
      ? (() => {
          const col = typeof look.mustache === "string" ? lerpHex(look.mustache, "#d8d3cb", hg * 0.5) : browCol;
          const yb = my - X(0.04 * s.lips) - oh * 0.3;
          const th = X(0.022 + 0.04 * mustW);
          const gap = X(0.012);
          const half = (dir: 1 | -1) => {
            const xe = (dir < 0 ? xl : xr) + dir * X(0.035);
            const ye = cornerY - X(0.004) - oh * 0.15;
            const x0 = cx + dir * gap;
            return `M ${x0} ${yb} L ${x0} ${yb - th} Q ${lerp(x0, xe, 0.55)} ${yb - th * 1.05} ${xe} ${ye} Q ${lerp(x0, xe, 0.5)} ${yb + th * 0.15} ${x0} ${yb} Z`;
          };
          return (
            <g fill={col} opacity={0.95}>
              <path d={half(-1)} />
              <path d={half(1)} />
            </g>
          );
        })()
      : null;

  /* ---------------- ears ---------------- */
  const ear = (side: 1 | -1) => {
    const a = side * Math.PI * 0.5;
    const p = pr(a, s.earY, 1);
    const nEar = Math.cos(a + yaw);
    if (p.z < -0.45) return null;
    const rx = X((0.06 + 0.1 * Math.max(0, -side * Math.sin(yaw) + 0.05)) * s.earSize);
    const ry = X(0.21 * s.earSize);
    return (
      <g key={side} transform={`translate(${X(p.x)}, ${X(p.y)})`}>
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={look.skin} />
        {nEar > -0.2 && <ellipse cx={-side * rx * 0.1} cy={ry * 0.05} rx={rx * 0.5} ry={ry * 0.62} fill={look.skinShade} opacity={0.6} />}
      </g>
    );
  };

  /* ---------------- hair ---------------- */
  // little ones with loose hair get fine curls: a thin cap with a soft high hairline on the infant,
  // a little more curly volume on the toddler
  const hs = little && look.hairStyle === "tousled" ? (baby ? INFANT_CURLS : TODDLER_CURLS) : HAIR[look.hairStyle];
  // newborn: thinner back-hair shell so its outline doesn't poke out past the temples
  const hairBackPath = hs ? P(hairBack(m, hs, yaw), R) : null;
  const hairFrontPts = hs ? hairFront(m, hs, yaw) : null;
  const balding = look.hairStyle === "balding" ? P(silhouette(m, yaw, 1.035, -0.32, 0.22, 14), R) : null;
  const turbanPts = look.hairStyle === "wrap" ? hairFront(m, TURBAN, yaw) : null;
  const partP = hs?.partAlpha !== undefined ? pr(hs.partAlpha, hs.front - 0.02, 1 + hs.thick) : null;
  const partTop = hs?.partAlpha !== undefined ? pr(hs.partAlpha * 0.6, m.top + 0.25, 1 + hs.thick) : null;
  const crown = pr(0, m.top + 0.25, 1.1);
  /* ---- ghomta: the saree anchal drawn over the head ----
   * Sits back on the head (the sindoor parting shows), frames the face in front of the ears,
   * falls from the head onto the shoulders. The laal-paar border runs only along the face edge. */
  const ghomta = (() => {
    if (look.hairStyle !== "veil") return null;
    const shell = 1.15;
    const yHang = 0.05; // below this the cloth hangs free instead of hugging the jaw
    const yShoulder = 1.6;
    const edgeY = (a: number) => -0.8 + 1.35 * Math.pow(Math.min(1, Math.abs(a) / 1.4), 1.8);
    const edge: Array<[number, number]> = [];
    for (let i = 0; i <= 64; i++) {
      const a = -1.7 + (i / 64) * 3.4;
      const y = edgeY(a);
      const yy = Math.min(y, yHang);
      const p = project(m, a, yy, yaw, shell);
      if (p.z <= 0) continue;
      // below the hang line the edge drops straight down beside the cheek
      edge.push([p.x, y > yHang ? y : yy]);
    }
    if (edge.length < 3) return null;
    const L = edge[0];
    const Rt = edge[edge.length - 1];
    const sideX = (y: number, side: 1 | -1) => {
      const base = extremeX(m, Math.min(y, yHang), yaw, shell, side);
      return y > yHang ? base + side * (y - yHang) * 0.22 : base;
    };
    const contour = (fromY: number, toY: number, side: 1 | -1) => {
      const out: Array<[number, number]> = [];
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const y = fromY + ((toY - fromY) * i) / n;
        out.push([sideX(y, side), y]);
      }
      return out;
    };
    // rounded dome over the crown (no peak): contours start below the top and meet at a soft apex
    const top = m.top + 0.06;
    const apex: [number, number] = [(sideX(top, -1) + sideX(top, 1)) / 2, m.top - 0.15];
    // whole cloth: hood + two side panels to the shoulders, open at the neck (no bib)
    const chinY = m.bottom + 0.08;
    const outline: Array<[number, number]> = [
      apex,
      ...contour(top, yShoulder, -1),
      [L[0] + 0.12, yShoulder],
      [L[0] + 0.16, chinY],
      [Rt[0] - 0.16, chinY],
      [Rt[0] - 0.12, yShoulder],
      ...contour(top, yShoulder, 1).reverse(),
    ];
    // cap in front of the hair: crown down to the visible face edge
    const cap: Array<[number, number]> = [apex, ...contour(top, Math.min(L[1], yShoulder), -1), ...edge, ...contour(top, Math.min(Rt[1], yShoulder), 1).reverse()];
    // border runs down the face edge and continues down the drape on both sides
    const borderPts: Array<[number, number]> = [
      [sideX(yShoulder, -1) + 0.08, yShoulder],
      [L[0] + 0.02, Math.max(L[1], yHang + 0.2)],
      ...edge,
      [Rt[0] - 0.02, Math.max(Rt[1], yHang + 0.2)],
      [sideX(yShoulder, 1) - 0.08, yShoulder],
    ];
    // soft folds that start part-way down the crown (not converging to a point)
    const folds = [-0.75, -0.2, 0.45].map((a) => {
      const p1 = pr(a * 0.8, m.top + 0.38, shell);
      const p2 = pr(a * 1.15, -0.66, shell);
      return p1.z > 0 && p2.z > 0 ? `M ${X(p1.x)} ${X(p1.y)} Q ${X((p1.x + p2.x) / 2 + a * 0.08)} ${X((p1.y + p2.y) / 2)} ${X(p2.x)} ${X(p2.y)}` : null;
    });
    return {
      outline: P(outline, R),
      cap: P(cap, R),
      edge: smoothPath(edge, R, false),
      border: smoothPath(borderPts, R, false),
      folds,
      drapeFolds: [-1, 1].map((side) => {
        const x0 = sideX(0.4, side as 1 | -1) - side * 0.1;
        return `M ${X(x0)} ${X(0.35)} Q ${X(x0 + side * 0.06)} ${X(0.95)} ${X(x0 + side * 0.12)} ${X(yShoulder - 0.05)}`;
      }),
    };
  })();

  /* ---- hair detail: locks along the hairline, sideburns, strands, tufted outline ---- */
  const LOCKY = ["parted", "tousled", "cropped", "pigtails", "veil"].includes(look.hairStyle);
  const hairDetail = (() => {
    if (!hs || !LOCKY) return null;
    const shell = 1 + hs.thick;
    const part = hs.partAlpha ?? 0;
    const lockLen = look.hairStyle === "tousled" ? 0.17 : look.hairStyle === "parted" ? 0.11 : look.hairStyle === "cropped" ? 0.05 : 0.07;
    const pts: Array<{ a: number; x: number; y: number; n: number }> = [];
    for (let a = -1.95; a <= 1.95; a += look.hairStyle === "tousled" ? 0.13 : 0.15) {
      const y = Math.min(hairline(hs, a), m.bottom - 0.15);
      const q = project(m, a, y, yaw, shell);
      if (q.z > 0.02) pts.push({ a, x: q.x, y, n: q.n });
    }
    // newborn: no hair locks (they draw as thin spikes at the temples); curls come from the outline
    const locks = look.age === "baby" || little ? [] : pts.map((q, i) => {
      const dir = Math.abs(q.a - part) < 0.06 ? 0 : Math.sign(q.a - part); // flow away from the parting
      const jig = look.hairStyle === "tousled" ? (i % 2 ? 0.05 : -0.03) : 0;
      const len = lockLen * (0.7 + 0.6 * hashLike(i + 3)) * clamp(q.n + 0.3, 0.4, 1);
      const bx = q.x;
      const by = q.y - 0.05;
      const tx = bx + dir * len * 0.85 + jig + st.sway * 0.004;
      const ty = by + len * (look.hairStyle === "tousled" ? 0.9 : 0.75);
      const w = 0.045 * clamp(q.n + 0.4, 0.5, 1);
      return `M ${X(bx - w)} ${X(by)} Q ${X((bx + tx) / 2 - w * 0.4)} ${X((by + ty) / 2 + 0.01)} ${X(tx)} ${X(ty)} Q ${X((bx + tx) / 2 + w * 0.9)} ${X((by + ty) / 2 - 0.01)} ${X(bx + w)} ${X(by)} Z`;
    });
    // tapered sideburns where the cap meets the face edge (removes the helmet corner)
    const burns: string[] = [];
    if ((look.hairStyle === "parted" || look.hairStyle === "cropped" || look.hairStyle === "tousled") && look.age !== "baby") {
      for (const q of [pts[0], pts[pts.length - 1]]) {
        if (!q || Math.abs(q.a) < 1.0) continue;
        const side = Math.sign(q.a);
        const by = q.y - 0.04;
        burns.push(`M ${X(q.x - side * 0.03)} ${X(by)} Q ${X(q.x + side * 0.015)} ${X(by + 0.11)} ${X(q.x + side * 0.01)} ${X(by + 0.2)} Q ${X(q.x - side * 0.02)} ${X(by + 0.1)} ${X(q.x - side * 0.065)} ${X(by + 0.02)} Z`);
      }
    }
    // strand highlights flowing from the crown / parting to the hairline
    // each strand starts along the parting (not one shared point) and flows out to the hairline
    const strandAt = (q: { a: number; x: number; y: number }, i: number, spread: number, startY: number) => {
      const sa = part + (q.a - part) * spread;
      const st0 = pr(sa, m.top + startY, shell);
      if (st0.z < 0) return null;
      const bend = Math.sign(q.a - part) * (0.03 + 0.04 * hashLike(i + 5));
      const mx = (st0.x + q.x) / 2 + bend;
      const my2 = (st0.y + q.y) / 2 - 0.04;
      return `M ${X(st0.x)} ${X(st0.y)} Q ${X(mx)} ${X(my2)} ${X(q.x + bend * 0.3)} ${X(q.y - 0.08)}`;
    };
    const strands = pts
      .filter((_, i) => i % 3 === 1)
      .map((q, i) => strandAt(q, i, 0.3, 0.32))
      .filter((d): d is string => d !== null);
    // darker strands between the highlights give the hair texture and volume
    const darkStrands = look.age === "baby" ? [] : pts
      .filter((_, i) => i % 3 === 2)
      .map((q, i) => strandAt(q, i + 17, 0.42, 0.36))
      .filter((d): d is string => d !== null);
    // grey and white strands (hairGrey), a little denser at the temples
    const grey = hg > 0.02
      ? pts
          .filter((q, i) => i % 2 === 0 || Math.abs(q.a) > 0.8)
          .map((q, i) => {
            const d = strandAt(q, i + 31, 0.18 + 0.3 * hashLike(i + 7), 0.28 + 0.1 * hashLike(i + 11));
            return d ? { d, white: hashLike(i + 13) > 0.5, k: (Math.abs(q.a) > 0.8 ? 1 : 0.7) * (0.55 + 0.45 * hashLike(i + 19)) } : null;
          })
          .filter((g): g is { d: string; white: boolean; k: number } => g !== null)
      : [];
    // a few fine strands escape across the hairline (softens the edge so it is not a helmet)
    const wisps = look.age === "baby" && !little
      ? []
      : pts
          .filter((q) => Math.abs(q.a) < 1.25 && q.n > 0.3)
          .filter((_, i) => i % 2 === 0)
          .slice(0, 8)
          .map((q, i) => {
            const dir = Math.sign(q.a - part) || (i % 2 ? 1 : -1);
            const len = 0.05 + 0.04 * hashLike(i + 21);
            return `M ${X(q.x)} ${X(q.y - 0.05)} q ${X(dir * len * 0.4)} ${X(len * 0.6)} ${X(dir * len * 0.9 + st.sway * 0.003)} ${X(len)}`;
          });
    // tufted outline: small bumps along the top of the hair silhouette
    // tufted outline only for loose hair (tousled / cropped); combed adult hair stays smooth
    const loose = look.hairStyle === "tousled" || look.hairStyle === "cropped";
    // little ones: curls run all round the hair outline, down past the temples and ears
    const back = loose ? hairBack(m, hs, yaw).filter(([, y]) => y < (little ? hs.side + 0.02 : -0.42)) : [];
    const tufts = back.filter((_, i) => i % (little ? 2 : 3) === 0).map(([x, y]) => ({ x, y }));
    // little ones: soft curl hooks along the hairline and small curl marks over the cap
    const curlHooks: string[] = [];
    const curlTex: string[] = [];
    if (little) {
      const cr = baby ? 0.03 : 0.04;
      pts
        .filter((q) => q.n > 0.15)
        .forEach((q, i) => {
          const dir = i % 2 ? 1 : -1;
          const bx = q.x + st.sway * 0.002;
          const by = q.y - 0.02;
          curlHooks.push(`M ${X(bx - dir * cr)} ${X(by - cr * 0.6)} q ${X(dir * cr * 1.6)} ${X(-cr * 0.4)} ${X(dir * cr * 1.4)} ${X(cr * 0.9)} q ${X(-dir * cr * 0.3)} ${X(cr * 0.7)} ${X(-dir * cr * 0.9)} ${X(cr * 0.3)}`);
        });
      for (let a = -1.2; a <= 1.21; a += 0.3) {
        for (let k = 0; k < 3; k++) {
          const yTop = m.top + 0.22 + k * 0.17;
          const aa = a + (k % 2) * 0.15;
          if (yTop > hairline(hs, aa) - 0.08) continue;
          const q = project(m, aa, yTop, yaw, shell);
          if (q.z < 0.05) continue;
          const dir = (k + Math.round(a * 10)) % 2 ? 1 : -1;
          curlTex.push(`M ${X(q.x - dir * cr)} ${X(q.y)} q ${X(dir * cr)} ${X(-cr * 1.2)} ${X(dir * cr * 1.8)} ${X(-cr * 0.1)}`);
        }
      }
    }
    return { locks, burns, strands, darkStrands, grey, wisps, tufts, curlHooks, curlTex };
  })();
  // grey strands over the side fringe of a balding head
  const baldGrey = (() => {
    if (look.hairStyle !== "balding" || hg <= 0.02) return [];
    const out: Array<{ d: string; white: boolean }> = [];
    for (const side of [-1, 1]) {
      for (let k = 0; k < 6; k++) {
        const a = side * (1.25 + k * 0.22);
        const y = -0.24 + (k % 3) * 0.13;
        const p1 = project(m, a, y, yaw, 1.03);
        const p2 = project(m, a + side * 0.3, y + 0.05, yaw, 1.03);
        if (p1.z < -0.3 || p2.z < -0.3) continue;
        out.push({ d: `M ${X(p1.x)} ${X(p1.y)} Q ${X((p1.x + p2.x) / 2)} ${X((p1.y + p2.y) / 2 - 0.02)} ${X(p2.x)} ${X(p2.y)}`, white: k % 2 === 0 });
      }
    }
    return out;
  })();

  // skin gradient direction: lit side → shade side
  const kx1 = keySide < 0 ? "0" : "1";
  const kx2 = keySide < 0 ? "1" : "0";
  const rx1 = keySide < 0 ? "1" : "0";
  const rx2 = keySide < 0 ? "0" : "1";
  const cloth = look.cloth ?? { color: "#f5efe6", shade: "#d9cfc0" };

  // skin form lighting anchors (all projected, so they turn with the head)
  const shadeEdgeX = extremeX(m, 0.15, yaw, 1, (-kS) as 1 | -1);
  const fhi = pr(kS * 0.15, s.eyeY - 0.42, 1);
  const chinHi = pr(kS * 0.03, m.bottom - 0.14, 1, 0.02);
  const philtrum = pr(0, (m.noseTipY + m.mouthY) / 2 + 0.01, 1, 0.02);

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-skin`} x1={kx1} y1="0.2" x2={kx2} y2="0.8">
          <stop offset="0%" stopColor={look.skinLight} />
          <stop offset="50%" stopColor={look.skin} />
          <stop offset="100%" stopColor={look.skinShade} />
        </linearGradient>
        <linearGradient id={`${uid}-hrim`} x1={rx1} y1="0" x2={rx2} y2="0">
          <stop offset="0%" stopColor={rim} stopOpacity={0} />
          <stop offset="80%" stopColor={rim} stopOpacity={0} />
          <stop offset="100%" stopColor={rim} stopOpacity={rimStrength} />
        </linearGradient>
        {/* iris: warm light ring round the pupil, darker toward a defined limbal rim */}
        <radialGradient id={`${uid}-iris`} cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.6">
          <stop offset="0%" stopColor="#9a6a3e" />
          <stop offset="45%" stopColor="#6e4325" />
          <stop offset="80%" stopColor="#3e2414" />
          <stop offset="92%" stopColor="#24150c" />
          <stop offset="100%" stopColor="#140b06" />
        </radialGradient>
        <radialGradient id={`${uid}-irisd`} cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.62">
          <stop offset="0%" stopColor="#c08a4a" />
          <stop offset="45%" stopColor="#7d4e28" />
          <stop offset="82%" stopColor="#40250f" />
          <stop offset="100%" stopColor="#170c05" />
        </radialGradient>
        {kid && (
          <radialGradient id={`${uid}-iwarm`}>
            <stop offset="0%" stopColor="#f0b673" stopOpacity={0.5} />
            <stop offset="60%" stopColor="#d99a5a" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#d99a5a" stopOpacity={0} />
          </radialGradient>
        )}
        <radialGradient id={`${uid}-scl`} cx="0.5" cy="0.55" r="0.6">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="70%" stopColor="#F6EEE4" />
          <stop offset="100%" stopColor="#DCCABD" />
        </radialGradient>
        {/* soft form lighting: highlight, shadow, blush */}
        <radialGradient id={`${uid}-hi`}>
          <stop offset="0%" stopColor="#FFF8EC" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#FFF8EC" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-sh`}>
          <stop offset="0%" stopColor={look.skinShade} stopOpacity={0.55} />
          <stop offset="100%" stopColor={look.skinShade} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-blush`}>
          <stop offset="0%" stopColor="#f0806e" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#f0806e" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}-hairg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hairLightC} />
          <stop offset="35%" stopColor={hairC} />
          <stop offset="100%" stopColor={hairC} />
        </linearGradient>
        {/* hair volume: the side away from the light falls into shade */}
        <linearGradient id={`${uid}-hsh`} x1={kx1} y1="0" x2={kx2} y2="0">
          <stop offset="0%" stopColor="#000000" stopOpacity={0} />
          <stop offset="55%" stopColor="#000000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.3} />
        </linearGradient>
      </defs>

      {/* ghomta: full cloth silhouette behind the face, falling to the shoulders */}
      {ghomta && (
        <g>
          <defs>
            <linearGradient id={`${uid}-ghd`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cloth.color} />
              <stop offset="100%" stopColor={cloth.shade} />
            </linearGradient>
            <linearGradient id={`${uid}-ghc`} x1={kx1} y1="0" x2={kx2} y2="0.6">
              <stop offset="0%" stopColor={lerpHex(cloth.color, "#ffffff", 0.35)} />
              <stop offset="55%" stopColor={cloth.color} />
              <stop offset="100%" stopColor={cloth.shade} />
            </linearGradient>
          </defs>
          <path d={ghomta.outline} fill={`url(#${uid}-ghd)`} />
          {ghomta.drapeFolds.map((d, i) => (
            <path key={i} d={d} stroke={cloth.shade} strokeWidth={R * 0.035} fill="none" opacity={0.6} strokeLinecap="round" />
          ))}
        </g>
      )}
      {hairBackPath && (
        <g opacity={look.hairStyle === "baby" ? 0.55 : 1}>
          <path d={hairBackPath} fill={hairC} />
          <path d={hairBackPath} fill={`url(#${uid}-hsh)`} />
        </g>
      )}
      {hairDetail &&
        (look.age !== "baby" || little) &&
        hairDetail.tufts.map((t, i) => {
          // little ones' curls bounce slightly with the head motion (sway), more toward the tips
          const bx = little ? st.sway * 0.006 * (0.6 + 0.4 * hashLike(i + 41)) : 0;
          const by = little ? Math.abs(st.sway) * 0.004 * hashLike(i + 43) : 0;
          return <circle key={`tf${i}`} cx={X(t.x + bx)} cy={X(t.y + by)} r={X(little ? (baby ? 0.04 : 0.046) * (0.85 + 0.3 * hashLike(i + 47)) : look.hairStyle === "tousled" ? 0.03 : 0.04)} fill={hairC} />;
        })}
      {balding && <path d={balding} fill={hairC} />}
      {baldGrey.map((g, i) => (
        <path key={`bg${i}`} d={g.d} stroke={g.white ? "#eeeae4" : "#b9b3a9"} strokeWidth={Math.max(0.6, R * 0.011)} fill="none" strokeLinecap="round" opacity={0.4 + 0.5 * hg} />
      ))}
      {look.hairStyle === "pigtails" &&
        [-1, 1].map((side) => {
          const p = pr(side * 1.9, 0.25, 1.05);
          return (
            <g key={side} transform={`translate(${X(p.x)}, ${X(p.y)}) rotate(${side * -10 + st.sway * 2})`}>
              <path d={`M -6 0 Q ${side * 7} ${X(0.5)} ${side * 2} ${X(0.95)} L ${side * 12} ${X(0.95)} Q ${side * 16} ${X(0.45)} 8 0 Z`} fill={hairC} />
              <path d={`M ${side * 2} ${X(0.12)} Q ${side * 8} ${X(0.5)} ${side * 6} ${X(0.85)}`} stroke={hairLightC} strokeWidth={Math.max(0.8, R * 0.02)} fill="none" opacity={0.35} strokeLinecap="round" />
              <circle cx={side * 7} cy={X(0.98)} r={X(0.07)} fill={look.ribbon ?? "#e0405a"} />
            </g>
          );
        })}
      {ear(-1)}
      {ear(1)}

      {/* face */}
      <path d={facePath} fill={`url(#${uid}-skin)`} />
      <path d={facePath} fill={`url(#${uid}-hrim)`} />
      {st.flush > 0.01 && <path d={facePath} fill="#d63a3a" opacity={st.flush * 0.33} />}
      {/* soft edge: a faint skin-shade rim instead of a hard outline, so the head is not cut out from the body */}
      <path d={facePath} fill="none" stroke={look.skinShade} strokeWidth={Math.max(1.2, R * 0.03)} opacity={0.2} strokeLinejoin="round" />

      <defs key={`d${fk}`}>
        <clipPath id={`${uid}-faceclip-${fk}`}>
          <path d={facePath} />
        </clipPath>
      </defs>
      <g key={`g${fk}`} clipPath={`url(#${uid}-faceclip-${fk})`}>
      {/* form shading: the side of the face away from the light, and a gentle shadow under the jaw */}
      <ellipse cx={X(shadeEdgeX)} cy={X(0.2)} rx={X(0.42)} ry={X(1.0)} fill={`url(#${uid}-sh)`} opacity={child ? 0.45 : 0.7} />
      <ellipse cx={X(cM.x)} cy={X(m.bottom + 0.02)} rx={X(0.75)} ry={X(0.24)} fill={`url(#${uid}-sh)`} opacity={baby ? 0.35 : 0.5} />
      {/* newborn volume: forehead light and jaw shadow */}
      {baby && (
        <g>
          <circle cx={X(-0.3)} cy={X(-0.5)} r={X(0.5)} fill={`url(#${uid}-hi)`} />
          <circle cx={X(0.25)} cy={X(0.85)} r={X(0.7)} fill={`url(#${uid}-sh)`} />
          <circle cx={X(0.9)} cy={X(0.1)} r={X(0.45)} fill={`url(#${uid}-sh)`} />
          {/* luminous skin: warm light from within across the face */}
          <circle cx={X(-0.1)} cy={X(-0.15)} r={X(0.95)} fill={`url(#${uid}-hi)`} opacity={0.18} />
        </g>
      )}
      {/* highlights: forehead, cheekbones, chin */}
      {!baby && fhi.z > 0 && <ellipse cx={X(fhi.x)} cy={X(fhi.y)} rx={X(0.34 * clamp(fhi.n, 0.4, 1))} ry={X(0.22)} fill={`url(#${uid}-hi)`} opacity={0.38} />}
      {[-1, 1].map((side) => {
        // children: the light on the cheek apples rises and rounds as the smile pushes the cheeks up
        const p = pr(side * 0.55, s.eyeY + 0.2 - 0.04 * eyeSmile, 1);
        if (p.z < 0.1) return null;
        return <ellipse key={`cb${side}`} cx={X(p.x)} cy={X(p.y)} rx={X(0.17 * clamp(p.n, 0.3, 1) * (1 + 0.25 * eyeSmile))} ry={X(0.09 * (1 + 0.25 * eyeSmile))} fill={`url(#${uid}-hi)`} opacity={(side === kS ? 0.38 : 0.16) + 0.1 * eyeSmile} />;
      })}
      {!child && chinHi.z > 0.1 && <ellipse cx={X(chinHi.x)} cy={X(chinHi.y)} rx={X(0.09)} ry={X(0.05)} fill={`url(#${uid}-hi)`} opacity={0.25} />}
      {/* cheeks: warm blush, grows with cheeks and smile */}
      {[-1, 1].map((side) => {
        const p = pr(side * 0.58, s.eyeY + 0.3 - st.smile * 0.03 - 0.03 * eyeSmile, 1);
        if (p.z < 0.1) return null;
        return (
          <ellipse
            key={side}
            cx={X(p.x)}
            cy={X(p.y)}
            rx={X(0.18 * clamp(p.n, 0.3, 1) * (1 + st.cheeks * 0.45) * (baby ? 1.3 : 1) * (1 + 0.12 * eyeSmile))}
            ry={X(0.1 * (1 + st.cheeks * 0.35) * (baby ? 1.5 : 1))}
            fill={`url(#${uid}-blush)`}
            opacity={clamp(((child ? 0.45 : 0.3) + st.smile * 0.12 + st.cheeks * 0.35) * (baby ? 1.4 : 1))}
          />
        );
      })}

      {/* smile lines and forehead line (ageLines); smile lines also show faintly on a broad adult smile */}
      {!child &&
        (() => {
          const smileOp = clamp(ageL * 0.55 + Math.max(0, st.smile - 0.3) * 0.25);
          const browUp = Math.max(0, st.brow) * 0.15;
          const fhOp = clamp(ageL * 0.45 + browUp * (elder ? 1 : 0.6));
          return (
            <g stroke={creaseCol} fill="none" strokeLinecap="round">
              {smileOp > 0.02 &&
                [-1, 1].map((side) => {
                  const a = pr(side * 0.2, m.noseTipY + 0.04);
                  const b = pr(side * (0.34 + Math.max(0, st.smile) * 0.03), m.mouthY + 0.07);
                  if (a.z < 0.1 || b.z < 0.1) return null;
                  return (
                    <path
                      key={side}
                      d={`M ${X(a.x)} ${X(a.y)} Q ${X((a.x + b.x) / 2 + side * 0.06)} ${X((a.y + b.y) / 2)} ${X(b.x)} ${X(b.y)}`}
                      strokeWidth={Math.max(0.8, R * 0.016)}
                      opacity={smileOp}
                    />
                  );
                })}
              {fhOp > 0.02 &&
                [s.eyeY - 0.38, s.eyeY - 0.46].slice(0, ageL > 0.45 ? 2 : 1).map((y, j) => {
                  const pts = [-0.38, -0.18, 0, 0.18, 0.38].map((a) => pr(a, y - st.brow * 0.03 + Math.abs(a) * 0.05)).filter((p) => p.z > 0.1);
                  if (pts.length < 3) return null;
                  return <path key={y} d={smoothPath(pts.map((p) => [p.x, p.y] as [number, number]), R, false)} strokeWidth={Math.max(0.7, R * 0.013)} opacity={fhOp * (j ? 0.7 : 1)} />;
                })}
              {/* worry lines between lifted inner brows; a frown crease when they knit down */}
              {tN > 0.15 &&
                [-1, 1].map((side) => {
                  const p1 = pr(side * 0.045, s.eyeY - 0.17);
                  const p2 = pr(side * 0.06, s.eyeY - 0.3);
                  return p1.z > 0.1 ? <path key={`fr${side}`} d={`M ${X(p1.x)} ${X(p1.y)} L ${X(p2.x)} ${X(p2.y)}`} strokeWidth={Math.max(0.7, R * 0.014)} opacity={0.35 * tN} /> : null;
                })}
              {tP > 0.3 &&
                (() => {
                  const y = s.eyeY - 0.34 - st.brow * 0.06;
                  const a0 = pr(-0.13, y + 0.015);
                  const a1 = pr(0, y - 0.01);
                  const a2 = pr(0.13, y + 0.015);
                  return a1.z > 0.1 ? <path d={`M ${X(a0.x)} ${X(a0.y)} Q ${X(a1.x)} ${X(a1.y - 0.02)} ${X(a2.x)} ${X(a2.y)}`} strokeWidth={Math.max(0.7, R * 0.013)} opacity={0.3 * clamp((tP - 0.3) / 0.7)} /> : null;
                })()}
            </g>
          );
        })()}

      {brow(-1)}
      {brow(1)}
      {eye(-1)}
      {eye(1)}

      {/* nose: soft bridge shadow, small tip with a highlight, a hint of wings and nostrils */}
      {bridge && <path d={bridge} stroke={look.skinShade} strokeWidth={X(0.045 * nK)} fill="none" strokeLinecap="round" opacity={child ? 0.1 : 0.22} />}
      {bridgeHi && <path d={bridgeHi} stroke={look.skinLight} strokeWidth={X(0.026)} fill="none" strokeLinecap="round" opacity={0.35} />}
      {noseContour.length > 2 && (
        <polyline
          points={noseContour.map(([x, y]) => `${X(x)},${X(y)}`).join(" ")}
          stroke={look.skinShade}
          strokeWidth={Math.max(1.2, R * 0.03 * nK)}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={clamp(Math.abs(yaw) * 2, 0, 0.6) * noseOp}
        />
      )}
      <ellipse cx={X(under.x)} cy={X(under.y)} rx={X(0.08 * nw)} ry={X(0.03 * nK)} fill={`url(#${uid}-sh)`} opacity={0.9} />
      {colL.z > 0.1 && colR.z > 0.1 && (
        <path d={`M ${X(colL.x)} ${X(colL.y)} Q ${X(under.x)} ${X(under.y + 0.012 * nK)} ${X(colR.x)} ${X(colR.y)}`} stroke={noseDark} strokeWidth={Math.max(0.6, R * 0.013)} fill="none" strokeLinecap="round" opacity={0.3 * noseOp} />
      )}
      {alar(-1)}
      {alar(1)}
      {nostril(-1)}
      {nostril(1)}
      <ellipse cx={X(tip.x + kS * 0.015)} cy={X(m.noseTipY - 0.015)} rx={X(0.032 * nK + 0.008)} ry={X(0.024 * nK + 0.006)} fill="#ffffff" opacity={baby ? 0.5 : 0.35} />
      {!child && philtrum.z > 0.1 && <ellipse cx={X(philtrum.x)} cy={X(philtrum.y)} rx={X(0.026)} ry={X(0.045)} fill={look.skinShade} opacity={0.12} />}

      {mouthEl}
      {dimpleEl}
      {/* children's pout: the chin tucks a little (a soft fold under the lower lip, the chin pad catches light) */}
      {kid && pout > 0.05 && cM.z > 0.1 && (
        <g>
          <ellipse cx={cx} cy={my + ll * 1.25 + X(0.045)} rx={X(0.07)} ry={X(0.018)} fill={look.skinShade} opacity={0.16 * pout} />
          {chinHi.z > 0.1 && <ellipse cx={X(chinHi.x)} cy={X(chinHi.y - 0.025 * pout)} rx={X(0.085)} ry={X(0.045)} fill={`url(#${uid}-hi)`} opacity={0.22 * pout} />}
        </g>
      )}
      {mustacheEl}

      </g>

      {/* hair cap in front */}
      {hairFrontPts && look.hairStyle !== "wrap" && (
        <g opacity={look.hairStyle === "baby" ? 0.55 : 1}>
          <path d={P(hairFrontPts, R)} fill={`url(#${uid}-hairg)`} />
          <path d={P(hairFrontPts, R)} fill={`url(#${uid}-hsh)`} />
          {/* soft hairline: a feathered edge instead of a hard helmet line */}
          {look.hairStyle !== "baby" && <path d={P(hairFrontPts, R)} fill="none" stroke={hairC} strokeWidth={Math.max(1, R * 0.03)} opacity={0.3} strokeLinejoin="round" />}
          {hairDetail && (
            <>
              {hairDetail.burns.map((d, i) => <path key={`sb${i}`} d={d} fill={hairC} />)}
              {hairDetail.locks.map((d, i) => <path key={`lk${i}`} d={d} fill={hairC} />)}
              {hairDetail.wisps.map((d, i) => (
                <path key={`wp${i}`} d={d} stroke={hairC} strokeWidth={Math.max(0.5, R * 0.009)} fill="none" opacity={0.6 * det} strokeLinecap="round" />
              ))}
              {hairDetail.darkStrands.map((d, i) => (
                <path key={`ds${i}`} d={d} stroke={lerpHex(hairC, "#000000", 0.35)} strokeWidth={Math.max(0.6, R * 0.012)} fill="none" opacity={0.3} strokeLinecap="round" />
              ))}
              {hairDetail.strands.map((d, i) => (
                <path key={`st${i}`} d={d} stroke={hairLightC} strokeWidth={R * 0.02} fill="none" opacity={0.26} strokeLinecap="round" />
              ))}
              {hairDetail.curlTex.map((d, i) => (
                <path key={`ct${i}`} d={d} stroke={hairLightC} strokeWidth={Math.max(0.6, R * 0.012)} fill="none" opacity={0.35} strokeLinecap="round" />
              ))}
              {hairDetail.curlHooks.map((d, i) => (
                <path key={`ch${i}`} d={d} stroke={hairC} strokeWidth={Math.max(0.7, R * (baby ? 0.014 : 0.02))} fill="none" opacity={0.85} strokeLinecap="round" />
              ))}
              {hairDetail.grey.map((g, i) => (
                <path key={`gr${i}`} d={g.d} stroke={g.white ? "#f0ece6" : "#bab4aa"} strokeWidth={Math.max(0.6, R * 0.011)} fill="none" opacity={clamp((0.35 + 0.6 * hg) * g.k)} strokeLinecap="round" />
              ))}
            </>
          )}
          {crown.z > -0.3 && (
            <>
              <path
                d={`M ${X(crown.x - 0.4)} ${X(crown.y + 0.1)} Q ${X(crown.x)} ${X(crown.y - 0.1)} ${X(crown.x + 0.45)} ${X(crown.y + 0.14)}`}
                stroke={hairLightC}
                strokeWidth={R * 0.16}
                fill="none"
                opacity={0.14}
                strokeLinecap="round"
              />
              <path
                d={`M ${X(crown.x - 0.35)} ${X(crown.y + 0.08)} Q ${X(crown.x)} ${X(crown.y - 0.08)} ${X(crown.x + 0.4)} ${X(crown.y + 0.12)}`}
                stroke={hairLightC}
                strokeWidth={R * (look.hairStyle === "baby" ? 0.1 : 0.07)}
                fill="none"
                opacity={look.hairStyle === "baby" ? 0.75 : little ? 0.38 : 0.45}
                strokeLinecap="round"
              />
            </>
          )}
          {look.sindoor && partP && partTop && partP.z > 0.25 && (
            <path d={`M ${X(lerp(partP.x, partTop.x, 0.12))} ${X(lerp(partP.y, partTop.y, 0.12))} L ${X(partTop.x)} ${X(partTop.y)}`} stroke={look.sindoor ? "#d0162d" : look.skinShade} strokeWidth={look.sindoor ? R * 0.06 : R * 0.03} strokeLinecap="round" opacity={0.9} />
          )}
        </g>
      )}
      {look.hairStyle === "tousled" && crown.z > -0.4 && (
        // short wisp that sits inside the hair mass; a long upright stroke read as an antenna
        little ? (
          // a single soft curl on the crown
          <path d={`M ${X(crown.x - 0.03)} ${X(m.top + 0.1)} q ${X(0.03 + st.sway * 0.02)} ${X(-0.08)} ${X(0.08)} ${X(-0.04)} q ${X(0.03)} ${X(0.04)} ${X(-0.01)} ${X(0.05)}`} stroke={hairC} strokeWidth={R * (baby ? 0.03 : 0.04)} fill="none" strokeLinecap="round" />
        ) : (
          <path d={`M ${X(crown.x - 0.02)} ${X(m.top + 0.06)} q ${X(0.05 + st.sway * 0.03)} ${X(-0.1)} ${X(0.12 + st.sway * 0.04)} ${X(-0.07)}`} stroke={hairC} strokeWidth={R * 0.07} fill="none" strokeLinecap="round" />
        )
      )}
      {turbanPts && (
        <g>
          <path d={P(turbanPts, R)} fill={cloth.color} />
          {[-0.5, -0.1, 0.3].map((a) => {
            const p1 = pr(a, -0.75, 1.24);
            const p2 = pr(a + 0.25, -0.45, 1.24);
            if (p1.z < 0 || p2.z < 0) return null;
            return <path key={a} d={`M ${X(p1.x)} ${X(p1.y)} L ${X(p2.x)} ${X(p2.y)}`} stroke={cloth.trim ?? "#f0e2c8"} strokeWidth={R * 0.05} opacity={0.65} />;
          })}
          {(() => {
            const k = pr(0.7, -0.62, 1.26);
            return k.z > -0.2 ? <ellipse cx={X(k.x)} cy={X(k.y)} rx={X(0.2)} ry={X(0.15)} fill={cloth.shade} /> : null;
          })()}
        </g>
      )}
      {ghomta && (
        <g>
          {/* soft contact shadow where the cloth edge lies on hair and cheek */}
          <path d={ghomta.edge} stroke="#2a1410" strokeWidth={R * 0.16} fill="none" opacity={0.22} strokeLinecap="round" />
          <path d={ghomta.cap} fill={`url(#${uid}-ghc)`} />
          {ghomta.folds.map((d, i) => (d ? <path key={i} d={d} stroke={cloth.shade} strokeWidth={R * 0.03} fill="none" opacity={0.55} strokeLinecap="round" /> : null))}
          {/* laal paar: border only along the face edge and down the drape */}
          {cloth.trim && (
            <>
              <path d={ghomta.border} stroke={cloth.trim} strokeWidth={R * 0.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d={ghomta.border} stroke="#e8b84a" strokeWidth={R * 0.018} fill="none" opacity={0.85} transform={`translate(0, ${-R * 0.035})`} />
            </>
          )}
        </g>
      )}

      {look.glasses &&
        (() => {
          const L = pr(-s.eyeSep, s.eyeY, 1, 0.08);
          const Rr = pr(s.eyeSep, s.eyeY, 1, 0.08);
          const rr = X(s.eyeSize * 1.45);
          return (
            <g stroke="#3b2a1c" strokeWidth={Math.max(2, R * 0.05)} fill="#ffffff" fillOpacity={0.08}>
              {L.z > 0 && <ellipse cx={X(L.x)} cy={X(L.y)} rx={rr * clamp(L.n, 0.15, 1)} ry={rr} />}
              {Rr.z > 0 && <ellipse cx={X(Rr.x)} cy={X(Rr.y)} rx={rr * clamp(Rr.n, 0.15, 1)} ry={rr} />}
              <path d={`M ${X(L.x) + rr * clamp(L.n, 0.15, 1)} ${X(L.y)} Q ${X(tip.x)} ${X(s.eyeY - 0.06)} ${X(Rr.x) - rr * clamp(Rr.n, 0.15, 1)} ${X(Rr.y)}`} fill="none" />
            </g>
          );
        })()}
      {look.tilak && !little &&
        (() => {
          const p = pr(0, s.eyeY - 0.36, 1, 0.03);
          return p.z > 0 ? <path d={`M ${X(p.x) - 3} ${X(p.y) - X(0.12)} L ${X(p.x)} ${X(p.y) + X(0.06)} L ${X(p.x) + 3} ${X(p.y) - X(0.12)} Z`} fill="#e9a23b" /> : null;
        })()}
      {look.bindi && !little &&
        (() => {
          const p = pr(0, s.eyeY - 0.24, 1, 0.03);
          return p.z > 0 ? <ellipse cx={X(p.x)} cy={X(p.y)} rx={X(0.045 * clamp(p.n, 0.3, 1))} ry={X(0.045)} fill="#c3122a" /> : null;
        })()}
    </g>
  );
};
