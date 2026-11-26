import React, { useId } from "react";

/**
 * BAL-26: Balak's ONE head from Episode 5 on (age about 5 to 12), after the director's reference plates
 * (01_Series_Bible/Thakur_Reference_Plates, plate 01 at age 6 for the child). Every rig that draws Balak in the plate
 * design (SeatedChild design="plate", the standing child rig) draws his head with this file, so he has one face
 * (like BAL-25's one baby face).
 *
 * Look: short straight soft black hair with a side part on his right (the -x side of the head, screen left when he
 * faces the camera) and a neat rounded crown, the fringe swept across to the other temple, a few soft strand lines and
 * a warm sheen toward the light; a child-rounded oval face with visible ears; large dark-brown almond eyes with a firm
 * upper lash line and one catchlight; straight dark brows; a small straight nose; a calm closed-lip half smile; warm
 * medium-brown skin. Borderless shapes, soft shading, light from the upper left (-x, -y). No tilak or marks (BAL-01).
 *
 * USAGE (inside an <svg>)
 *   <ThakurNeckPlate base={...} top={...} />                      // behind the head (and behind the clothes)
 *   <ThakurHeadPlate x={hx} y={hy} rot={deg} scale={k} age={6} state={plateFaceState({ f, lifeF, expression, ... })} />
 *
 * Units: head-local, origin at the centre of the skull, y down. The face is about 59 wide (cheek to cheek; the head is drawn at 0.95 width), the hair
 * top at about PLATE_HAIR_TOP (-52), the chin at plateChinY(age) (37 at age 5). `scale` multiplies all of it (the
 * seated rig uses 0.97 in figure units). `rot` is the in-plane head tilt in degrees about the origin.
 *
 * Turn: PlateFaceState.turn -1..1 is three-quarter. The drawing reads cleanly up to +-PLATE_TURN_READ (1.3, a strong
 * three-quarter); larger values (the state still accepts +-1.8) are drawn at 1.3, because the near-profile extension
 * broke beyond it (2026-11-23). Within +-1 nothing changed; the ear on the turn side now slides under the cheek instead
 * of fading to a half-transparent ghost.
 *
 * State: `PlateFaceState` is the frame's face (turn, gaze, blink and lids, expression weights, brows, mouth). Rigs with
 * their own eye logic (SeatedChild) fill it themselves; others call `plateFaceState(...)`, which derives it from simple
 * inputs (expression name with an 18-frame blend, blinks on the life clock with the series' slow calm schedule,
 * small saccades, lip-sync `mouth`). Run blinks and saccades on the life clock (lifeF), poses on the story clock (f).
 */

/* ------------------------------------------------------------------ */
/* Colours                                                              */
/* ------------------------------------------------------------------ */

/**
 * Plate 01 colours (sampled from the plate: skin lit #d49862, mid #c98d5c, shade #ab764c; hair #382f26 in warm
 * light). Skin, hair, eyes and the white cotton of the dhoti and chadar.
 */
export const PLATE_COLORS = {
  skin: "#c98e5c",
  skinLit: "#dca46c",
  skinFar: "#b07648",
  skinShade: "#87552f",
  skinDeep: "#5e381e",
  skinUnder: "#2e1a0d",
  rim: "#fadcae",
  soleNear: "#a86d41",
  soleFar: "#83502c",
  blush: "#e88a78",
  hair: "#231914",
  hairHi: "#4e3e33",
  hairSheen: "#9c8170",
  eyeWhite: "#fcf8ee",
  eyeShade: "#d9c7b0",
  iris: "#28150b",
  irisRing: "#86532c",
  pupil: "#0d0704",
  lash: "#1d110a",
  brow: "#22160f",
  mouth: "#7b3b2b",
  mouthDark: "#4a2016",
  mouthInner: "#c86a58",
  lip: "#d98b74",
  clothLit: "#faf5ea",
  cloth: "#f2ebdd",
  clothMid: "#e4dccd",
  clothFold: "#cfc6b6",
  clothShade: "#b9b2a6",
  clothInner: "#a0998c",
} as const;
export type PlateColors = { [K in keyof typeof PLATE_COLORS]: string };
/**
 * BAL-26c (2026-11-23), opt-in: the healthy look's palette: a warmer, livelier skin (the same hue family as plate 01,
 * a touch more red-gold) and warm cotton shading in the white folds (cream lights, honey-grey shades instead of cool
 * grey). Used by StandingChild build="healthy"; a seated rig can pass it too so the boy matches.
 */
export const PLATE_COLORS_HEALTHY: PlateColors = {
  ...PLATE_COLORS,
  skin: "#cf955f",
  skinLit: "#e4af78",
  skinFar: "#b97e4c",
  skinShade: "#8c5830",
  blush: "#ef8c76",
  clothLit: "#fffaf1",
  cloth: "#f6efe2",
  clothMid: "#ece2d0",
  clothFold: "#dccab0",
  clothShade: "#c6b193",
  clothInner: "#a99273",
};
/**
 * BAL-26e/f (2026-11-24/25), opt-in with `plateLook="ref2"` (Ghibli Episode 4): the director's new plate
 * (Thakur_Reference_Plates/new_ref_thakur.png): light golden skin (cheek about #f4d1a7) with warm shade, the same dark
 * hair and eyes, white cotton with warm cream shades in the folds. Every rig passes it with the ref2 look.
 */
export const PLATE_COLORS_REF2: PlateColors = {
  ...PLATE_COLORS,
  skin: "#f2cba0",
  skinLit: "#f8d8b2",
  skinFar: "#e2b68a",
  skinShade: "#cc9a72",
  skinDeep: "#8f6848",
  skinUnder: "#6a4c34",
  rim: "#ffe4c6",
  soleNear: "#d8a880",
  soleFar: "#c09068",
  blush: "#f2a494",
  iris: "#2a160e",
  irisRing: "#8a5a32",
  clothLit: "#fffaf1",
  cloth: "#f6efe2",
  clothMid: "#ece2d0",
  clothFold: "#dccab0",
  clothShade: "#c6b193",
  clothInner: "#a99273",
};
/** The opt-in looks of the plate rigs: "ref2" = BAL-26e/f (Ghibli Episode 4). Absent = the delivered look. */
export type PlateLook = "ref2";
/** Warm sepia ink of the ref2 look's fine line work (face, ears, jaw). */
export const PLATE_INK = "#3a2618";
/** ref2 face contour: a lighter, warmer sepia (the plates' fine 1-2 px lines). */
export const PLATE_INK_FACE = "#8a6044";

/* ------------------------------------------------------------------ */
/* Geometry helpers for the rigs                                        */
/* ------------------------------------------------------------------ */

/** Age offset used by the geometry: 0 at age 5, clamped to 4..12. */
export const plateAgeY = (age = 5): number => Math.min(7, Math.max(-1, age - 5));
/**
 * The largest head turn that is drawn (2026-11-23): beyond about 1.3 the near-profile extension broke (the far ear slid
 * onto the cheek, the nose poked past the face outline, the turn-side eye collapsed). Larger requested turns are drawn at
 * this value. Turns within +-1 are unchanged.
 */
export const PLATE_TURN_READ = 1.3;
/** Top of the hair (head-local). */
export const PLATE_HAIR_TOP = -52.5;
/** Chin (head-local y) at an age. */
export const plateChinY = (age = 5): number => 37 + 1.3 * plateAgeY(age);
/** Centre of the closed mouth (head-local) at turn 0 and an age: for cups, bowls and hands at the lips. */
export const plateMouthAt = (age = 5): { x: number; y: number } => ({ x: 3, y: 20.6 + 0.85 * plateAgeY(age) });
/**
 * Episode 6 helper: centre of one eye at a head turn, in the head's units AFTER its 0.95 horizontal squash (multiply by
 * `scale`, then rotate by `rot` about the head centre). side +1 = the eye on the +x side of the head, -1 = the -x side.
 */
export const plateEyeAt = (turnIn: number, age = 5, side: 1 | -1 = 1): { x: number; y: number } => {
  const turn = clamp(turnIn, -PLATE_TURN_READ, PLATE_TURN_READ);
  const tSg = turn < 0 ? -1 : 1;
  const pu = smooth(clamp((Math.abs(turn) - 1) / 0.8, 0, 1));
  const tY = clamp(turn, -1.8, 1.8) * 4.5 + tSg * 14 * pu;
  const m = 3 + tY;
  const ageY = plateAgeY(age);
  const eyeK = 1 - 0.03 * ageY;
  const x = side > 0 ? m + 15.2 * eyeK * (tSg > 0 ? 1 - 0.5 * pu : 1) : m - 15.4 * eyeK * (tSg < 0 ? 1 - 0.5 * pu : 1);
  return { x: 0.95 * x, y: -1 + 0.35 * ageY };
};
/** Neck radii (base, top) in head-local units: a slim child's neck. */
export const PLATE_NECK_R: [number, number] = [11.4, 10.4];

/* ------------------------------------------------------------------ */
/* Face state                                                           */
/* ------------------------------------------------------------------ */

export interface PlateFaceState {
  /**
   * Head turn (yaw): -1..1 is the three-quarter range (+1 turns the face toward +x: the features slide toward +x).
   * Beyond it, up to +-1.8, the head turns on to a near profile: the eye on the turn side foreshortens and hides behind
   * the nose bridge, the nose shows on the silhouette, that side's ear disappears, the other ear moves toward the
   * head's centre, the hair mass follows. Values within -1..1 are unaffected by the extension.
   */
  turn: number;
  /** Iris offset in eye units (about -2.3..2.3 sideways, -1.7..2.6 down). */
  gazeX: number;
  gazeY: number;
  /** 0 open .. 1 closed (a blink, or eyes closed in prayer). */
  blink: number;
  /** Resting upper lid 0..0.9 (0.16 is his calm open eye; more when looking down). */
  lid: number;
  /** Lower-lid lift by the cheeks 0..1 (warm smile, laugh). */
  lowLift: number;
  /** Expression weights 0..1. */
  joy: number;
  comp: number;
  thought: number;
  play: number;
  /** Brow lift (units, about 0..2.5) and the inner ends' soft rise (compassion, 0..0.5). */
  browLift: number;
  browInner: number;
  /** Smile 0..1.15 (0.5 is his calm half smile). */
  smile: number;
  /** Mouth opening 0..1 (lip sync or a soft laugh). */
  mouthOpen: number;
  /** Mouth width factor (about 0.9..1.12). */
  mouthW: number;
  /** Lips pressed in thought 0..0.6. */
  pressed: number;
  /** Cheeks lifting with a smile (units). */
  cheekUp: number;
  /**
   * Episode 6, opt-in (absent = off): teary eyes 0..1. A wet shine along the lower lids, a slightly reddened lower rim, a
   * second glistening catchlight; never a streaming cry or an open-mouth sob. A scene fades it out.
   */
  tear?: number;
  /** Episode 6, opt-in: the inner brow ends drawn toward each other (hurt), 0..1. */
  browDraw?: number;
}

/** "hurt" and "forgiving" are Episode 6 additions (opt-in; the older expressions are unchanged). */
export type PlateExpression = "serene" | "joyful" | "thoughtful" | "compassionate" | "playful" | "surprised" | "hurt" | "forgiving";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const wob = (f: number, seed: number, rate = 1) =>
  0.55 * Math.sin(f * 0.061 * rate + seed) + 0.3 * Math.sin(f * 0.1543 * rate + seed * 1.31 + 0.7) + 0.15 * Math.sin(f * 0.0227 * rate + seed * 2.17);

/* The series' slow calm blink (the same schedule as the seated rig): every 4.5 to 7 s, 15 frames long. */
const BLINK_LEN = 15;
const BLINKS: number[] = (() => {
  const out: number[] = [];
  let seed = 7319;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  let t = 60;
  while (t < 40000) {
    out.push(t);
    t += 110 + rnd() * 58;
  }
  return out;
})();
/** Blink amount at life frame L (0 open, 1 closed): identical to the seated rig's blink. */
export const plateBlink = (L: number): number => {
  let lo = 0;
  let hi = BLINKS.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (BLINKS[mid] <= L) {
      idx = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (idx < 0) return 0;
  // Each blink lasts a little differently (13 to 18 frames); lids lower softly, rest a moment, rise more slowly.
  const len = BLINK_LEN - 2 + ((idx * 2654435761) >>> 0) % 6;
  const u = (L - BLINKS[idx]) / len;
  if (u < 0 || u >= 1) return 0;
  if (u < 0.35) return smooth(u / 0.35);
  if (u < 0.45) return 1;
  return 1 - smooth((u - 0.45) / 0.55);
};

const exprW = (e: PlateExpression) => ({
  joy: e === "joyful" ? 1 : 0,
  thought: e === "thoughtful" ? 1 : 0,
  comp: e === "compassionate" ? 1 : 0,
  play: e === "playful" ? 1 : 0,
  sur: e === "surprised" ? 1 : 0,
  hurt: e === "hurt" ? 1 : 0,
  forg: e === "forgiving" ? 1 : 0,
});

export interface PlateFaceInput {
  /** Story frame (expressions, mouth). */
  f: number;
  /** Life frame (blinks, saccades, drift). Default f. */
  lifeF?: number;
  expression?: PlateExpression;
  prevExpression?: PlateExpression;
  /** Frame the expression change starts (18-frame blend). */
  expressionStart?: number;
  /** Lip sync 0..1. */
  mouth?: number;
  /** Head turn -1..1 (three-quarter), up to +-1.8 (near profile). */
  turn?: number;
  /** Look direction -1..1 (eyes; sideways and down/up). */
  lookX?: number;
  lookY?: number;
  /** Lids lowered (looking down) 0..1, eyes looking up 0..1. */
  eyesDown?: number;
  eyesUp?: number;
  /** Base smile 0..1 (default 0.5, his calm half smile). */
  smile?: number;
  /** Extra closure 0..1 (eyes closed in prayer, a slow blink of surprise). */
  close?: number;
  /** Episode 6, opt-in: teary eyes 0..1 (see PlateFaceState.tear). */
  tear?: number;
}

/** Face state from simple inputs: expression blend, slow blinks and saccades on the life clock, lip sync. */
export const plateFaceState = (p: PlateFaceInput): PlateFaceState => {
  const L = p.lifeF ?? p.f;
  const cur = p.expression ?? "serene";
  const from = p.prevExpression;
  const u = from && from !== cur ? smooth((p.f - (p.expressionStart ?? p.f)) / (from === "surprised" || cur === "surprised" ? 12 : 18)) : 1;
  const a = exprW(from ?? cur);
  const b = exprW(cur);
  const joy = lerp(a.joy, b.joy, u);
  const thought = lerp(a.thought, b.thought, u);
  const comp = lerp(a.comp, b.comp, u);
  const play = lerp(a.play, b.play, u);
  const sur = lerp(a.sur, b.sur, u);
  const eyeDown = clamp(p.eyesDown ?? 0, 0, 1);
  const eyeUp = clamp(p.eyesUp ?? 0, 0, 1);
  const laugh = joy * (0.3 + 0.07 * wob(p.f, 12.3, 2.2));
  const mouthOpen = clamp(Math.max(clamp(p.mouth ?? 0, 0, 1), laugh, 0.4 * sur), 0, 1);
  const smile = clamp((p.smile ?? 0.5) + 0.45 * joy + 0.22 * comp + 0.28 * play - 0.3 * thought - 0.45 * sur + 0.03 * wob(p.f, 10.7, 0.3), 0, 1.15);
  const thinkDown = thought * (1 - eyeUp);
  const lx = clamp(p.lookX ?? 0, -1, 1);
  const ly = clamp(p.lookY ?? 0, -1, 1);
  const st: PlateFaceState = {
    turn: clamp(p.turn ?? 0, -1.8, 1.8),
    gazeX: clamp(lx * 2 + 0.2 * wob(L, 6.1, 0.6) - 0.3 * thinkDown + 0.3 * Math.sin(Math.floor(L / 37) * 12.9898) * 0.8, -2.3, 2.3),
    gazeY: clamp(0.35 + ly * 1.6 - 1.6 * eyeUp + 1.1 * eyeDown + 0.9 * thinkDown + 0.15 * Math.sin(Math.floor(L / 41) * 78.233), -1.7, 2.6),
    blink: Math.max(plateBlink(L), clamp(p.close ?? 0, 0, 1)),
    lid: clamp(0.16 + 0.18 * eyeDown - 0.2 * eyeUp + 0.05 * joy + 0.04 * comp - 0.06 * play + 0.05 * thought - 0.14 * sur, 0.04, 0.9),
    lowLift: clamp((0.9 * joy + 0.25 * comp + 0.3 * play) * (1 - sur), 0, 1),
    joy,
    comp,
    thought,
    play,
    browLift: 1.4 * eyeUp + 0.8 * joy + 0.2 * thought + 0.7 * play + 2.6 * sur,
    browInner: 0.45 * comp,
    smile,
    mouthOpen,
    mouthW: (1 + 0.12 * joy + 0.05 * comp + 0.08 * play - 0.1 * thought) * (1 - 0.4 * sur),
    pressed: 0.6 * thought,
    cheekUp: 1.6 * joy + 0.6 * comp + 0.6 * play,
  };
  // Episode 6 additions, applied only when used (the older expressions give exactly the same state as before).
  const hurt = lerp(a.hurt, b.hurt, u);
  const forg = lerp(a.forg, b.forg, u);
  if (hurt > 0 || forg > 0) {
    // hurt: brows a little raised and drawn together, mouth closed and level, eyes soft (lids a touch heavier)
    // forgiving: a small closed-lip smile with soft eyes (cheeks lift the lower lids a little), never a grin
    st.smile = clamp(st.smile - 0.3 * hurt + 0.24 * forg, 0, lerp(1.15, 0.8, Math.max(hurt, forg)));
    st.lid = clamp(st.lid + 0.07 * hurt + 0.05 * forg, 0.04, 0.9);
    st.lowLift = clamp(st.lowLift + 0.12 * hurt + 0.34 * forg, 0, 1);
    st.browLift += 0.7 * hurt;
    st.browInner += 0.85 * hurt + 0.2 * forg;
    st.browDraw = 0.8 * hurt;
    st.mouthW *= 1 - 0.08 * hurt + 0.04 * forg;
    st.pressed = Math.max(st.pressed, 0.28 * hurt);
    st.cheekUp += 0.7 * forg;
  }
  if (p.tear !== undefined && p.tear > 0) st.tear = clamp(p.tear, 0, 1);
  return st;
};

/* ------------------------------------------------------------------ */
/* Drawing                                                              */
/* ------------------------------------------------------------------ */

interface V {
  x: number;
  y: number;
}
const pt = (p: V) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
const smoothClosed = (pts: V[]): string => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C${pt({ x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 })} ${pt({ x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 })} ${pt(p2)}`;
  }
  return d + "Z";
};
const smoothOpen = (pts: V[]): string => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    d += ` C${pt({ x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 })} ${pt({ x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 })} ${pt(p2)}`;
  }
  return d;
};
/** Points along the closed curve smoothClosed(pts) draws, from knot `a` to knot `b` (fractional; b may pass n). */
const curveSpan = (pts: V[], a: number, b: number, step = 0.125): V[] => {
  const n = pts.length;
  const out: V[] = [];
  for (let u = a; u <= b + 1e-6; u += step) {
    const i = Math.floor(u);
    const t = u - i;
    const p0 = pts[(((i - 1) % n) + n) % n];
    const p1 = pts[((i % n) + n) % n];
    const p2 = pts[(((i + 1) % n) + n) % n];
    const p3 = pts[(((i + 2) % n) + n) % n];
    const t2 = t * t;
    const t3 = t2 * t;
    const f = (a0: number, a1: number, a2: number, a3: number) => 0.5 * (2 * a1 + (-a0 + a2) * t + (2 * a0 - 5 * a1 + 4 * a2 - a3) * t2 + (-a0 + 3 * a1 - 3 * a2 + a3) * t3);
    out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
  }
  return out;
};
const polyD = (pts: V[]): string => pts.map((q, i) => `${i ? "L" : "M"}${pt(q)}`).join(" ");
const mixHex = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};
/** Soft shade-side tone for borderless skin (the same mix the shared Hand and the seated rig use). */
const skinEdge = (base: string, shade: string) => mixHex(base, shade, 0.34);
const safe = (id: string) => "thp" + id.replace(/[^A-Za-z0-9_-]/g, "");

/**
 * Slim neck from `base` to `top` (figure units of the caller), drawn borderless: a shade silhouette and the lit fill
 * nudged toward the light. Draw it before the clothes and the head. `scale` is the head scale (radii PLATE_NECK_R).
 */
export const ThakurNeckPlate: React.FC<{ base: V; top: V; scale?: number; colors?: PlateColors }> = ({ base, top, scale = 1, colors = PLATE_COLORS }) => {
  const r0 = PLATE_NECK_R[0] * scale;
  const r1 = PLATE_NECK_R[1] * scale;
  const dx = top.x - base.x;
  const dy = top.y - base.y;
  const len = Math.hypot(dx, dy) || 1;
  const n = { x: -dy / len, y: dx / len };
  const quad = (g: number, ox: number, oy: number) => {
    const a = { x: base.x + n.x * (r0 + g) + ox, y: base.y + n.y * (r0 + g) + oy };
    const b = { x: top.x + n.x * (r1 + g) + ox, y: top.y + n.y * (r1 + g) + oy };
    const c = { x: top.x - n.x * (r1 + g) + ox, y: top.y - n.y * (r1 + g) + oy };
    const d = { x: base.x - n.x * (r0 + g) + ox, y: base.y - n.y * (r0 + g) + oy };
    return `M${pt(a)} L${pt(b)} L${pt(c)} L${pt(d)} Z`;
  };
  return (
    <g>
      <path d={quad(0, 0, 0)} fill={skinEdge(colors.skin, colors.skinShade)} />
      <path d={quad(-1.1, -0.8, -0.6)} fill={colors.skin} />
      {/* A soft tendon shade on the side away from the light */}
      <path d={`M${pt({ x: lerp(base.x, top.x, 0.15) + 0.45 * r0, y: lerp(base.y, top.y, 0.15) })} L${pt({ x: lerp(base.x, top.x, 0.85) + 0.4 * r1, y: lerp(base.y, top.y, 0.85) })}`} stroke={colors.skinShade} strokeWidth={2.4 * scale} strokeLinecap="round" opacity={0.16} />
    </g>
  );
};

export interface ThakurHeadPlateProps {
  /** Head centre in the caller's units. */
  x: number;
  y: number;
  /** In-plane tilt, degrees. */
  rot?: number;
  /** Head scale (head-local units to the caller's units). */
  scale?: number;
  state: PlateFaceState;
  /** Years, 4 to 12 (default 5): older means a longer face, a slightly narrower jaw, smaller eyes relative to the face. */
  age?: number;
  colors?: PlateColors;
  /**
   * BAL-26c opt-in (absent = unchanged): bright, open eyes with clear catchlights, alert brows and a touch of cheek
   * warmth. The face design and proportions stay BAL-26.
   */
  vivid?: boolean;
  /**
   * BAL-26e/f opt-in (absent = unchanged): "ref2" = the director's new plate, refined for Ghibli Episode 4: light golden
   * skin (PLATE_COLORS_REF2 unless `colors` is given), eyes about 13% smaller than the vivid eyes (still large, dark,
   * almond, one clear catchlight), soft brows, a fine warm sepia ink line round the face, ears and jaw (slightly broken
   * on the lit side), a hint of nose line and nostril shade, a soft cheek blush wash, faint shade under the hair and the
   * jaw, a little more sheen and strand detail in the hair. Geometry, anchors and the face state are unchanged.
   */
  plateLook?: PlateLook;
  /**
   * ref2 only: the camera zoom of the layer the head is drawn in (default 1). The face contour and the nose line are
   * drawn in screen pixels (non-scaling strokes, so the rig and head scale do not thicken them) divided by this, so
   * they stay about 1 px on screen in medium shots and close-ups alike.
   */
  inkZoom?: number;
}

/** Balak's head in the BAL-26 plate design. See the file header. */
export const ThakurHeadPlate: React.FC<ThakurHeadPlateProps> = ({ x, y, rot = 0, scale = 1, state: S, age = 5, colors, vivid = false, plateLook, inkZoom = 1 }) => {
  const uid = safe(useId());
  const R2 = plateLook === "ref2";
  /** ref2: stroke width for `px` screen pixels (non-scaling strokes; the CSS camera zoom is divided out). */
  const inkW = (px: number) => px / Math.max(0.3, inkZoom);
  const C = colors ?? (R2 ? PLATE_COLORS_REF2 : PLATE_COLORS);
  const ageY = plateAgeY(age);
  // Turn: |turn| <= 1 slides the features (three-quarter); beyond 1 (to 1.8, near profile) `pu` goes 0..1: the
  // features slide on toward the silhouette, the eye on that side foreshortens and hides behind the nose bridge, the
  // nose shows on the silhouette, that ear disappears, the other ear moves toward the head's centre, the hair follows.
  // The drawn turn is limited to +-PLATE_TURN_READ, where the face reads cleanly (2026-11-23; see the header).
  const turnD = clamp(S.turn, -PLATE_TURN_READ, PLATE_TURN_READ);
  const tSg = turnD < 0 ? -1 : 1;
  const pu = smooth(clamp((Math.abs(turnD) - 1) / 0.8, 0, 1));
  const tY = turnD * 4.5 + tSg * 14 * pu;
  const m = 3 + tY; // facial midline
  const oX = 0.3 * tY; // outline shift
  const hX = 0.55 * tY; // part and strands shift
  const pOx = tSg * 5 * pu; // extra hair shift in a near profile
  const chinY = plateChinY(age);
  const jaw = 1 - 0.035 * ageY;
  const jc = 1 - 0.02 * ageY; // full child cheeks, a touch less round when older
  const eyeK = 1 - 0.03 * ageY;
  const eyeY = -1 + 0.35 * ageY;
  const browY = eyeY - 12 - (vivid ? 0.7 : 0);
  const noseY = 10.9 + 0.6 * ageY;
  const mouthY = plateMouthAt(age).y;
  const ex = { joy: S.joy, comp: S.comp, thought: S.thought, play: S.play };
  /** Joyful, and playful a little lighter: open bright eyes with a lower-lid crescent, round cheeks, a warm smile. */
  const happy = clamp(S.joy + 0.7 * S.play, 0, 1);
  /** Episode 6 teary eyes (opt-in, 0 = off). */
  const tear = clamp(S.tear ?? 0, 0, 1);
  const sh = (pts: Array<[number, number]>, dx: number): V[] => pts.map(([px, py]) => ({ x: px + dx, y: py }));

  // A child-rounded oval: widest at the cheeks, a soft rounded chin (rounder than the age 12 plate).
  // ref2 (BAL-26f): a slightly narrower oval with a softly pointed chin and a gentle cheek line (drawing only: the
  // chin, mouth and eye anchors are computed separately and do not move)
  const R2_FACE: Array<[number, number]> = [
    [0.98, 0], [0.97, 0], [0.955, 0], [0.935, 0.2], [0.89, 0.6], [0.84, 1.1], [0.78, 1.7], [1, 2.0], [0.78, 1.7], [0.84, 1.1],
    [0.89, 0.6], [0.935, 0.2], [0.955, 0], [0.97, 0], [0.98, 0], [1, 0], [1, 0], [1, 0],
  ];
  const r2Face = (pts: Array<[number, number]>): Array<[number, number]> =>
    R2 ? pts.map(([px, py], i) => [3 + (px - 3) * R2_FACE[i][0], py + R2_FACE[i][1]]) : pts;
  const faceOutline = sh(
    r2Face([
      [-28.4, -22],
      [-30, -9],
      [-31 * jc, 3],
      [-28.6 * jc, 14],
      [-22.4 * jaw, 23.8],
      [-15.8 * jaw, chinY - 5.2],
      [-7.4 * jaw, chinY - 1],
      [3, chinY],
      [13.4 * jaw, chinY - 1],
      [21.8 * jaw, chinY - 5.2],
      [28.4 * jaw, 23.8],
      [34.6 * jc, 14],
      [37 * jc, 3],
      [36, -9],
      [34.4, -22],
      [24, -32],
      [3, -36],
      [-17, -33],
    ]),
    oX,
  );
  // Hair (plate 01): a full rounded mass with volume on top and at the sides, soft over the tops of the ears, a short
  // neat nape; the side part on his right (-x); the fringe sweeps from the part across the forehead, low.
  const hOx = 0.4 * oX + pOx;
  const backHair = sh(
    [
      [-31.6, 1],
      [-35, -6],
      [-37, -14],
      [-37.6, -25],
      [-35.4, -37],
      [-28.6, -47],
      [-16.4, -53.4],
      [-1, -56],
      [15, -54.6],
      [27.6, -48],
      [35.8, -37.6],
      [39.2, -25],
      [38.6, -13],
      [36, -6],
      [33.2, -2.5],
      [20, -12],
      [-20, -12],
    ],
    hOx,
  );
  const capTop: Array<[number, number]> = [
    [-28.8, -4],
    [-32, -8.8],
    [-35.6, -12.4],
    [-36.8, -24],
    [-34.6, -36.4],
    [-28, -46.2],
    [-16.2, -52.6],
    [-1, -55.2],
    [14.6, -53.8],
    [27, -47.2],
    [35, -37],
    [38.2, -24.6],
    [37.4, -13],
    [35, -8.8],
    [31.6, -6.4],
  ];
  const hairline: Array<[number, number]> = [
    [31.2, -11.2],
    [28.4, -16.6],
    [22.4, -21.6],
    [13.6, -25],
    [4.4, -27.2],
    [-4 + 0.4 * hX, -29.2],
    [-9.6 + hX, -31.6],
    [-12.6 + hX, -33.6],
    [-15.2 + hX, -32.6],
    [-20.6, -28.6],
    [-25.6, -21],
    [-27.8, -11.6],
    [-28.4, -6],
  ];
  const capPts = [...sh(capTop, hOx), ...sh(hairline, hOx)];
  const hd = (pts: Array<[number, number]>) => smoothOpen(sh(pts, hOx));

  // Eyes: large, rounded dark-brown almonds, wide open, white showing on both sides of the iris (plate 01); mirrored
  // per side (inner corner toward the nose). Cubic lids: `cU` is the upper lid's control height, `cL` the lower one's.
  // ref2 (BAL-26f): about 13% smaller than the vivid eyes, still large.
  const EW = (R2 ? 8.8 : 9.2) * eyeK;
  const EIN = 0.7 * eyeK;
  const EOUT = -0.3 * eyeK;
  const CU_OPEN = (R2 ? -10.4 : -11.4) * eyeK; // fully open upper lid (apex about 0.75 of it)
  const CL = (R2 ? 6.6 : 7.2) * eyeK;
  const lidD = (cU: number) => `M${-EW} ${EIN} C${(-EW * 0.62).toFixed(2)} ${cU.toFixed(2)} ${(EW * 0.55).toFixed(2)} ${cU.toFixed(2)} ${EW} ${EOUT}`;
  const lowD = (cL: number) => `C${(EW * 0.6).toFixed(2)} ${cL.toFixed(2)} ${(-EW * 0.6).toFixed(2)} ${cL.toFixed(2)} ${-EW} ${EIN}`;
  const almond = `${lidD(CU_OPEN)} ${lowD(CL)}Z`;
  const eye = (cx: number, cy: number, idx: number, scaleX: number, mirror: boolean): React.ReactElement => {
    const sgn = mirror ? -1 : 1;
    const gx = sgn * S.gazeX * 1.15;
    const gy = S.gazeY * 1.1 - 0.1;
    // Calm almond eyes (plate 01): at rest (lid 0.16) the heavy upper lid covers the top fifth or so of the iris,
    // with no white above it; looking down lowers it further; a blink closes it.
    // Joy: a warm eye-smile, the cheeks lift the lower lids and the upper lids soften a little (BAL-22).
    const k = Math.max(clamp(0.29 + 1.1 * (S.lid - 0.16) - 0.13 * happy - (vivid ? 0.09 : 0), 0.06, 1), S.blink);
    const lift = S.lowLift;
    const cLow = CL - 3 * lift;
    const cU = lerp(CU_OPEN, cLow - 0.6, k);
    const apex = 0.75 * cU + 0.125 * (EIN + EOUT);
    const below = `${lidD(cU)} ${lowD(Math.max(cLow, cU + 0.8))}Z`;
    const lowMid = 0.75 * cLow + 0.125 * (EIN + EOUT);
    const irisR = (R2 ? 5.9 : 6.3) * eyeK;
    const hlY = Math.max(gy - 2.6, apex + 1.5);
    const eId = `${uid}-e${idx}`;
    const lId = `${uid}-l${idx}`;
    const oId = `${uid}-o${idx}`;
    return (
      <g transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${(sgn * scaleX).toFixed(3)} 1)`}>
        <clipPath id={eId}>
          <path d={almond} />
        </clipPath>
        <clipPath id={lId}>
          <path d={below} />
        </clipPath>
        <clipPath id={oId}>
          <rect x={EW * 0.05} y={-20} width={EW * 1.2} height={30} />
        </clipPath>
        {k < 0.92 && (
          <g clipPath={`url(#${eId})`}>
            <g clipPath={`url(#${lId})`}>
              <path d={almond} fill={C.eyeWhite} />
              <ellipse cx={0} cy={(apex + 0.6).toFixed(2)} rx={EW} ry={1.5} fill={C.eyeShade} opacity={0.4} />
              <circle cx={gx.toFixed(2)} cy={gy.toFixed(2)} r={irisR.toFixed(2)} fill={C.iris} />
              <circle cx={gx.toFixed(2)} cy={(gy + 1.7).toFixed(2)} r={(irisR * 0.6).toFixed(2)} fill={C.irisRing} opacity={0.32} />
              <circle cx={gx.toFixed(2)} cy={gy.toFixed(2)} r={((R2 ? 2.05 : 2.2) * eyeK).toFixed(2)} fill={C.pupil} />
              <circle cx={(-sgn * 2 + gx).toFixed(2)} cy={hlY.toFixed(2)} r={((R2 ? 1.85 : vivid ? 1.75 : 1.45) * eyeK).toFixed(2)} fill="#ffffff" />
              {(vivid || R2) && <circle cx={(sgn * 1.9 + gx).toFixed(2)} cy={(gy + 2.4).toFixed(2)} r={((R2 ? 0.6 : 0.7) * eyeK).toFixed(2)} fill="#ffffff" opacity={0.7} />}
              {tear > 0.001 && (
                <>
                  {/* Teary (Ep 6): a second small catchlight and the bright water line of tears along the lower lid
                      margin (clipped to the eye, so only a thin meniscus shows) */}
                  <circle cx={(sgn * 1.9 + gx).toFixed(2)} cy={(gy + 2.5).toFixed(2)} r={(0.8 * eyeK).toFixed(2)} fill="#ffffff" opacity={(0.8 * tear).toFixed(3)} />
                  <path d={`M${EW.toFixed(2)} ${EOUT.toFixed(2)} ${lowD(Math.max(cLow, cU + 0.8) - 0.15)}`} fill="none" stroke="#ffffff" strokeWidth={2.2} strokeLinecap="round" opacity={(0.55 * tear).toFixed(3)} />
                </>
              )}
            </g>
          </g>
        )}
        {tear > 0.001 && k < 0.92 && (
          <>
            {/* the lower rim a little reddened, with a fine wet shine along its edge; a tiny pooled glint at the inner
                corner (no drop runs down the cheek) */}
            <path
              d={`M${(-EW * 0.8).toFixed(2)} ${(lowMid * 0.72 + 1.1).toFixed(2)} Q0.2 ${(lowMid + 2.4).toFixed(2)} ${(EW * 0.85).toFixed(2)} ${(lowMid * 0.6 + 0.9).toFixed(2)}`}
              fill="none"
              stroke="#c4614f"
              strokeWidth={1.7}
              strokeLinecap="round"
              opacity={(0.34 * tear).toFixed(3)}
            />
            <path
              d={`M${(-EW * 0.62).toFixed(2)} ${(lowMid * 0.62 + 1.5).toFixed(2)} Q0.2 ${(lowMid + 2.9).toFixed(2)} ${(EW * 0.66).toFixed(2)} ${(lowMid * 0.58 + 1.3).toFixed(2)}`}
              fill="none"
              stroke="#fff4e6"
              strokeWidth={0.7}
              strokeLinecap="round"
              opacity={(0.4 * tear).toFixed(3)}
            />
            <ellipse cx={(-EW * 0.86).toFixed(2)} cy={(EIN + 0.9).toFixed(2)} rx={1.2} ry={0.8} fill="#ffffff" opacity={(0.55 * tear).toFixed(3)} />
          </>
        )}
        {/* Firm upper lash line, a touch heavier on its outer half (no cat-eye flick) */}
        <path d={lidD(cU)} fill="none" stroke={C.lash} strokeWidth={k > 0.9 ? 1.8 : R2 ? 2.3 : 2.7} strokeLinecap="round" />
        {k < 0.9 && <path d={lidD(cU)} clipPath={`url(#${oId})`} fill="none" stroke={C.lash} strokeWidth={R2 ? 3.1 : 3.7} strokeLinecap="round" opacity={(1 - k).toFixed(3)} />}
        {k < 0.9 && <path d={`M${(EW - 0.6).toFixed(2)} ${(EOUT - 0.1).toFixed(2)} Q${(EW + 0.6).toFixed(2)} ${(EOUT - 0.3).toFixed(2)} ${(EW + 1.2).toFixed(2)} ${(EOUT - 0.8).toFixed(2)}`} fill="none" stroke={C.lash} strokeWidth={1.4} strokeLinecap="round" opacity={(1 - k).toFixed(3)} />}
        {/* A very faint lid fold above, fading as the lid lowers */}
        <path d={`M${(-EW * 0.6).toFixed(2)} ${(apex - 2.2).toFixed(2)} Q0.4 ${(apex - 3.6).toFixed(2)} ${(EW * 0.7).toFixed(2)} ${(apex - 2).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={0.7} strokeLinecap="round" opacity={(0.16 * (1 - k)).toFixed(3)} />
        {/* Lower lid: a faint line, rising with the cheek in a smile */}
        <path
          d={`M${(-EW * 0.62).toFixed(2)} ${(lowMid * 0.62 + 0.4).toFixed(2)} Q0.2 ${(lowMid + 1.6).toFixed(2)} ${(EW * 0.7).toFixed(2)} ${(lowMid * 0.58 + 0.2).toFixed(2)}`}
          fill="none"
          stroke={C.skinShade}
          strokeWidth={0.75}
          strokeLinecap="round"
          opacity={(0.3 * (1 - 0.7 * lift)).toFixed(3)}
        />
      </g>
    );
  };

  // Brows: straight, dark and firm, thick at the inner end, tapering outward.
  const brow = (dir: number, k: number): string => {
    const xi = S.browDraw ? m + dir * (5.2 - 1.3 * S.browDraw) * k : m + dir * 5.2 * k;
    const xm = m + dir * 13 * k;
    const xo = m + dir * 21 * k;
    const yi = browY - S.browInner - 0.5 * S.browLift;
    const ym = browY - 0.5 - S.browLift;
    const yo = browY + 0.6 - 0.3 * S.browLift;
    const th = R2 ? 0.8 : 1;
    return smoothClosed([
      { x: xi, y: yi - 1.55 * th },
      { x: xm, y: ym - 1.45 * th },
      { x: xo, y: yo - 0.65 * th },
      { x: xo + dir * 1, y: yo + 0.2 },
      { x: xo, y: yo + 0.7 * th },
      { x: xm, y: ym + 1.05 * th },
      { x: xi, y: yi + 1.5 * th },
    ]);
  };
  const farK = clamp(0.93 - 0.02 * tY, 0.82, 1) * (1 - 0.7 * (turnD < 0 ? pu : 0));
  const nearK = clamp(1 - 0.03 * Math.max(0, tY), 0.85, 1) * (1 - 0.7 * (turnD > 0 ? pu : 0));
  // In a near profile the eye on the turn side slides behind the nose bridge, narrows and fades out.
  const eyeFarX = m - 15.4 * eyeK * (tSg < 0 ? 1 - 0.5 * pu : 1);
  const eyeNearX = m + 15.2 * eyeK * (tSg > 0 ? 1 - 0.5 * pu : 1);
  const hideF = tSg < 0 ? pu : 0;
  const hideN = tSg > 0 ? pu : 0;
  const mW = S.mouthW;
  const mw = 6.2 * mW * (1 - 0.35 * pu);
  const cU = 1.9 * Math.max(0, S.smile - 0.5);
  const open = Math.max(S.mouthOpen, 0.16 * S.play);
  const openShow = smooth(open / 0.12); // the open shape shows fully from a small opening on
  const oW = (4.6 + 0.9 * happy) * mW;
  const pressed = S.pressed;

  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${(0.95 * scale).toFixed(4)} ${scale})`}>
      <defs>
        <radialGradient id={`${uid}-face`} gradientUnits="userSpaceOnUse" cx={-9} cy={-12} r={54}>
          <stop offset="0" stopColor={C.skinLit} />
          <stop offset="0.52" stopColor={C.skin} />
          <stop offset="1" stopColor={C.skinFar} />
        </radialGradient>
        <linearGradient id={`${uid}-hair`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.hairHi} />
          <stop offset="0.42" stopColor={C.hair} />
          <stop offset="1" stopColor={C.hair} />
        </linearGradient>
        <radialGradient id={`${uid}-blush`}>
          <stop offset="0" stopColor={C.blush} stopOpacity={0.5} />
          <stop offset="0.6" stopColor={C.blush} stopOpacity={0.2} />
          <stop offset="1" stopColor={C.blush} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${uid}-fc`}>
          <path d={smoothClosed(faceOutline)} />
        </clipPath>
        <clipPath id={`${uid}-hc`}>
          <path d={smoothClosed(capPts)} />
        </clipPath>
      </defs>
      {/* ref2: a faint soft shade under the jaw, on the neck (the face covers its top) */}
      {R2 && <ellipse cx={(m - 1 + 0.5 * oX).toFixed(2)} cy={(chinY + 0.5).toFixed(2)} rx={17} ry={6.4} fill={C.skinShade} opacity={0.34} />}
      {/* Hair mass behind the head */}
      <path d={smoothClosed(backHair)} fill={C.hair} />

      {/* Ears: both visible, big for a child: the top at brow level, the bottom at the nose tip, a simple inner fold.
          The near one slips behind the cheek as the head turns toward it. */}
      <g transform={`translate(${(0.2 * oX + (tSg > 0 ? 12 * pu : 10 * pu)).toFixed(2)} 0)`}>
        <ellipse cx={-31.6} cy={(eyeY - 0.4).toFixed(2)} rx={6.2} ry={11.4} fill={skinEdge(C.skin, C.skinShade)} />
        <ellipse cx={-32} cy={(eyeY - 1).toFixed(2)} rx={5.2} ry={10.4} fill={C.skin} />
        <path d={`M-29.2 ${(eyeY - 8.6).toFixed(2)} Q-36 ${(eyeY - 1.6).toFixed(2)} -30.4 ${(eyeY + 8.6).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
        <path d={`M-31 ${(eyeY - 3).toFixed(2)} Q-33 ${(eyeY + 0.4).toFixed(2)} -30.8 ${(eyeY + 3.4).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
      </g>
      <g transform={`translate(${(-0.5 * tY + (tSg < 0 ? -19 * pu : -10 * pu)).toFixed(2)} 0)`}>
        <ellipse cx={35.2} cy={(eyeY - 0.2).toFixed(2)} rx={5.4} ry={11} fill={skinEdge(C.skinFar, C.skinShade)} />
        <ellipse cx={35.6} cy={(eyeY - 0.8).toFixed(2)} rx={4.4} ry={10} fill={C.skinFar} />
        <path d={`M33.4 ${(eyeY - 8).toFixed(2)} Q39.4 ${(eyeY - 1).toFixed(2)} 34.4 ${(eyeY + 8.2).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={1.2} strokeLinecap="round" opacity={0.65} />
      </g>

      {/* Face: soft shade silhouette, then the lit face with a radial falloff from the upper left */}
      <path d={smoothClosed(faceOutline)} fill={skinEdge(C.skinFar, C.skinShade)} />
      <path d={smoothClosed(faceOutline.map((q) => ({ x: q.x - 1.1, y: q.y - 0.9 })))} fill={`url(#${uid}-face)`} />
      <g clipPath={`url(#${uid}-fc)`}>
        <ellipse cx={(41 + oX).toFixed(2)} cy={8} rx={13} ry={36} fill={C.skinShade} opacity={0.18} />
        {/* The hair's soft cast shadow on the forehead */}
        <path d={smoothClosed(capPts.map((q) => ({ x: q.x + 1.2, y: q.y + 2.8 })))} fill={C.skinShade} opacity={0.3} />
        <ellipse cx={(m - 4).toFixed(2)} cy={(browY - 4).toFixed(2)} rx={13} ry={4.5} fill={C.skinLit} opacity={0.24} />
        <ellipse cx={(m - 17).toFixed(2)} cy={(eyeY + 11).toFixed(2)} rx={7} ry={5} fill={C.skinLit} opacity={0.2} />
        <path d={smoothOpen(faceOutline.slice(7, 11).map((q) => ({ x: q.x - 1.5, y: q.y - 1.4 })))} fill="none" stroke={C.skinShade} strokeWidth={2.2} strokeLinecap="round" opacity={0.18} />
        {R2 && (
          <>
            {/* ref2: a soft wash of shade under the hairline and along the shadow-side jaw and the chin */}
            <path d={smoothClosed(capPts.map((q) => ({ x: q.x + 0.6, y: q.y + 5.2 })))} fill={C.skinShade} opacity={0.16} />
            <path d={polyD(curveSpan(faceOutline, 8.6, 12.4))} fill="none" stroke={C.skinShade} strokeWidth={6} strokeLinecap="round" opacity={0.16} />
            <path d={polyD(curveSpan(faceOutline, 4.4, 7.6))} fill="none" stroke={C.skinShade} strokeWidth={4} strokeLinecap="round" opacity={0.12} />
          </>
        )}
      </g>
      {R2 && (
        <g fill="none" stroke={PLATE_INK_FACE} strokeLinecap="round" strokeLinejoin="round" opacity={0.56}>
          {/* ref2: ONE continuous, smooth warm-brown line along the jaw and chin, about 1 px on screen at any zoom, tapering
              by width (thinner at the chin, on the lit side and at both ends). The short pieces are opaque inside one
              group with the opacity, so they join seamlessly (no darker dots at the joins, no gaps). The cheeks, ears
              and hair get their one contour from the figure's ink filter (no double line). */}
          {Array.from({ length: 16 }, (_, k) => {
            const a = 4.2 + (6.7 * k) / 16;
            const b = 4.2 + (6.7 * (k + 1)) / 16;
            const um = 0.5 * (a + b);
            const t = (um - 4.2) / 6.7;
            const end = 0.4 + 0.6 * smooth(Math.min(t, 1 - t) / 0.16);
            const prof = um < 5.6 ? 0.9 : um < 6.4 ? lerp(0.9, 0.82, (um - 5.6) / 0.8) : um < 7.8 ? 0.82 : um < 8.6 ? lerp(0.82, 1.15, (um - 7.8) / 0.8) : 1.15;
            return <path key={k} d={polyD(curveSpan(faceOutline, a, b + 0.02, 0.06))} strokeWidth={inkW(prof * end)} vectorEffect="non-scaling-stroke" />;
          })}
        </g>
      )}

      {/* Near profile: the ear away from the turn comes onto the side of the head, toward its centre */}
      {pu > 0.3 && (
        <g opacity={smooth((pu - 0.3) / 0.4).toFixed(3)}>
          {tSg > 0 ? (
            <g transform={`translate(${(0.2 * oX + 18 * pu).toFixed(2)} 0)`}>
              <ellipse cx={-31.6} cy={(eyeY - 0.4).toFixed(2)} rx={6.2} ry={11.4} fill={skinEdge(C.skin, C.skinShade)} />
              <ellipse cx={-32} cy={(eyeY - 1).toFixed(2)} rx={5.2} ry={10.4} fill={C.skin} />
              <path d={`M-29.2 ${(eyeY - 8.6).toFixed(2)} Q-36 ${(eyeY - 1.6).toFixed(2)} -30.4 ${(eyeY + 8.6).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
            </g>
          ) : (
            <g transform={`translate(${(-0.5 * tY - 26 * pu).toFixed(2)} 0)`}>
              <ellipse cx={35.2} cy={(eyeY - 0.2).toFixed(2)} rx={5.4} ry={11} fill={skinEdge(C.skinFar, C.skinShade)} />
              <ellipse cx={35.6} cy={(eyeY - 0.8).toFixed(2)} rx={4.4} ry={10} fill={C.skinFar} />
              <path d={`M33.4 ${(eyeY - 8).toFixed(2)} Q39.4 ${(eyeY - 1).toFixed(2)} 34.4 ${(eyeY + 8.2).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={1.2} strokeLinecap="round" opacity={0.65} />
            </g>
          )}
        </g>
      )}

      {/* Near profile: the nose shows on the silhouette */}
      {pu > 0.01 &&
        (() => {
          const ex0 = (tSg > 0 ? 34.6 * jc : -28.6 * jc) + oX;
          const ny = noseY;
          return (
            <path
              d={`M${(ex0 - tSg * 1.5).toFixed(2)} ${(ny - 10).toFixed(2)} Q${(ex0 + tSg * 1.6 * pu).toFixed(2)} ${(ny - 5).toFixed(2)} ${(ex0 + tSg * 4.4 * pu).toFixed(2)} ${(ny - 0.4).toFixed(2)} Q${(ex0 + tSg * 2.6 * pu).toFixed(2)} ${(ny + 2.2).toFixed(2)} ${(ex0 - tSg * 1.5).toFixed(2)} ${(ny + 2.8).toFixed(2)} Z`}
              fill={tSg > 0 ? C.skinFar : C.skin}
              opacity={smooth(pu / 0.5).toFixed(3)}
            />
          );
        })()}

      {/* Round cheeks lifting in a smile: a soft light on the cheek apples */}
      {happy > 0.02 && (
        <>
          <ellipse cx={(m - 16.5).toFixed(2)} cy={(eyeY + 10 - S.cheekUp).toFixed(2)} rx={6.4} ry={4.2} fill={C.skinLit} opacity={(0.32 * happy).toFixed(3)} />
          <ellipse cx={(m + 16.5).toFixed(2)} cy={(eyeY + 10 - S.cheekUp).toFixed(2)} rx={6} ry={4} fill={C.skinLit} opacity={(0.22 * happy).toFixed(3)} />
        </>
      )}
      {/* Very faint child blush, lifting with a smile */}
      <ellipse cx={(m - 17).toFixed(2)} cy={(eyeY + 11 - S.cheekUp).toFixed(2)} rx={6.2 * (1 + 0.12 * ex.joy)} ry={4} fill={`url(#${uid}-blush)`} opacity={0.35 + 0.3 * happy + (vivid ? 0.2 : 0)} />
      <ellipse cx={(m + 17).toFixed(2)} cy={(eyeY + 11 - S.cheekUp).toFixed(2)} rx={6.4 * (1 + 0.12 * ex.joy)} ry={4.1} fill={`url(#${uid}-blush)`} opacity={0.35 + 0.3 * happy + (vivid ? 0.2 : 0)} />
      {R2 && (
        <>
          {/* ref2: a wider, softer cheek blush wash */}
          <ellipse cx={(m - 18).toFixed(2)} cy={(eyeY + 12.5 - S.cheekUp).toFixed(2)} rx={9.6} ry={6} fill={`url(#${uid}-blush)`} opacity={0.42 + 0.2 * happy} />
          <ellipse cx={(m + 18).toFixed(2)} cy={(eyeY + 12.5 - S.cheekUp).toFixed(2)} rx={9.6} ry={6} fill={`url(#${uid}-blush)`} opacity={0.4 + 0.2 * happy} />
        </>
      )}

      <g opacity={(1 - smooth((hideF - 0.45) / 0.4)).toFixed(3)}>{eye(eyeFarX, eyeY, 0, farK * eyeK, true)}</g>
      <g opacity={(1 - smooth((hideN - 0.45) / 0.4)).toFixed(3)}>{eye(eyeNearX, eyeY, 1, nearK * eyeK, false)}</g>

      <path d={`${brow(-1, farK)} ${brow(1, nearK)}`} fill={R2 ? mixHex(C.brow, C.hairHi, 0.35) : C.brow} opacity={R2 ? 0.78 : 0.93} />

      {/* Small straight nose: a soft bridge line from between the brows down its shadow side, a small tip and nostril
          shadow, a lit tip */}
      <path d={`M${(m + 1.4).toFixed(2)} ${(browY + 2.6).toFixed(2)} Q${(m + 3.3).toFixed(2)} ${(eyeY + 3).toFixed(2)} ${(m + 3.4).toFixed(2)} ${(noseY - 0.8).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={1.05} strokeLinecap="round" opacity={0.34} />
      <path d={`M${(m - 2.4).toFixed(2)} ${(noseY + 0.6).toFixed(2)} Q${(m + 0.3).toFixed(2)} ${(noseY + 2.1).toFixed(2)} ${(m + 3).toFixed(2)} ${(noseY + 0.5).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={1.2} strokeLinecap="round" opacity={0.62} />
      <ellipse cx={(m - 1.5).toFixed(2)} cy={(noseY + 1).toFixed(2)} rx={0.75} ry={0.5} fill={C.skinDeep} opacity={0.45} />
      <ellipse cx={(m + 2.1).toFixed(2)} cy={(noseY + 0.9).toFixed(2)} rx={0.75} ry={0.5} fill={C.skinDeep} opacity={0.45} />
      <ellipse cx={(m + 0.6).toFixed(2)} cy={(noseY + 3).toFixed(2)} rx={2.8} ry={0.8} fill={C.skinShade} opacity={0.15} />
      <circle cx={(m - 0.6).toFixed(2)} cy={(noseY - 1.3).toFixed(2)} r={1.1} fill={C.skinLit} opacity={0.6} />
      {R2 && (
        <>
          {/* ref2: a hint of the nose in ink on its shade side, and a soft nostril shade under the tip */}
          <path d={`M${(m + 3.1).toFixed(2)} ${(noseY - 5.4).toFixed(2)} Q${(m + 3.9).toFixed(2)} ${(noseY - 2).toFixed(2)} ${(m + 3.3).toFixed(2)} ${(noseY + 0.2).toFixed(2)}`} fill="none" stroke={PLATE_INK_FACE} strokeWidth={inkW(0.9)} vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={0.42} />
          <path d={`M${(m - 1.6).toFixed(2)} ${(noseY + 1.5).toFixed(2)} Q${(m + 0.6).toFixed(2)} ${(noseY + 2.5).toFixed(2)} ${(m + 2.6).toFixed(2)} ${(noseY + 1.2).toFixed(2)}`} fill="none" stroke={PLATE_INK_FACE} strokeWidth={inkW(1)} vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={0.48} />
          <ellipse cx={(m + 0.5).toFixed(2)} cy={(noseY + 2.4).toFixed(2)} rx={3.6} ry={1.3} fill={C.skinShade} opacity={0.22} />
        </>
      )}

      {/* Mouth: closed, a calm half smile (pressed in thought); the open shapes crossfade in for speech or a laugh */}
      <g opacity={(1 - openShow).toFixed(3)}>
        <path
          d={`M${(m - mw).toFixed(2)} ${(mouthY - cU).toFixed(2)} Q${m.toFixed(2)} ${(mouthY + 0.8 + 1.5 * S.smile - 0.9 * pressed).toFixed(2)} ${(m + mw).toFixed(2)} ${(mouthY - cU).toFixed(2)}`}
          fill="none"
          stroke={C.mouth}
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        <path
          d={`M${(m + mw - 0.1).toFixed(2)} ${(mouthY - cU).toFixed(2)} Q${(m + mw + 0.8).toFixed(2)} ${(mouthY - cU - 0.3).toFixed(2)} ${(m + mw + 1.1).toFixed(2)} ${(mouthY - cU - 0.9).toFixed(2)} M${(m - mw + 0.1).toFixed(2)} ${(mouthY - cU).toFixed(2)} Q${(m - mw - 0.8).toFixed(2)} ${(mouthY - cU - 0.3).toFixed(2)} ${(m - mw - 1.1).toFixed(2)} ${(mouthY - cU - 0.9).toFixed(2)}`}
          fill="none"
          stroke={C.mouth}
          strokeWidth={0.8}
          strokeLinecap="round"
          opacity={clamp(0.45 * S.smile, 0, 0.6).toFixed(3)}
        />
        <ellipse cx={m.toFixed(2)} cy={(mouthY + 2.1 - 0.5 * pressed).toFixed(2)} rx={(2.9 * mW).toFixed(2)} ry={0.9} fill={C.lip} opacity={(0.22 - 0.08 * pressed).toFixed(3)} />
        <path d={`M${(m - 2.4).toFixed(2)} ${(mouthY + 3.7).toFixed(2)} Q${m.toFixed(2)} ${(mouthY + 4.4).toFixed(2)} ${(m + 2.4).toFixed(2)} ${(mouthY + 3.7).toFixed(2)}`} fill="none" stroke={C.skinShade} strokeWidth={0.95} strokeLinecap="round" opacity={0.45} />
      </g>
      {open > 0.01 && (
        <g opacity={openShow.toFixed(3)}>
          <path
            d={`M${(m - oW).toFixed(2)} ${(mouthY - cU - 1.2 * happy).toFixed(2)} Q${m.toFixed(2)} ${(mouthY - 0.5 + 0.3 * happy).toFixed(2)} ${(m + oW).toFixed(2)} ${(mouthY - cU - 1.2 * happy).toFixed(2)} Q${(m + oW * 0.88).toFixed(2)} ${(mouthY + 0.9 + 4.4 * open).toFixed(2)} ${m.toFixed(2)} ${(mouthY + 1.3 + 5 * open).toFixed(2)} Q${(m - oW * 0.88).toFixed(2)} ${(mouthY + 0.9 + 4.4 * open).toFixed(2)} ${(m - oW).toFixed(2)} ${(mouthY - cU - 1.2 * happy).toFixed(2)} Z`}
            fill={C.mouthDark}
          />
          {ex.joy > 0.05 && open > 0.15 && (
            <path
              d={`M${(m - 3.1).toFixed(2)} ${(mouthY + 0.1 - 0.5 * cU).toFixed(2)} Q${m.toFixed(2)} ${(mouthY + 0.25 + 0.4 * ex.joy).toFixed(2)} ${(m + 3.1).toFixed(2)} ${(mouthY + 0.1 - 0.5 * cU).toFixed(2)} Q${m.toFixed(2)} ${(mouthY + 1.3 + 0.4 * ex.joy).toFixed(2)} ${(m - 3.1).toFixed(2)} ${(mouthY + 0.1 - 0.5 * cU).toFixed(2)} Z`}
              fill={C.eyeWhite}
              opacity={(0.6 * ex.joy * smooth((open - 0.15) / 0.15)).toFixed(3)}
            />
          )}
          <ellipse cx={m.toFixed(2)} cy={(mouthY + 0.8 + 3.3 * open).toFixed(2)} rx={2.6 * mW} ry={(0.6 + 1.2 * open).toFixed(2)} fill={C.mouthInner} />
        </g>
      )}

      {/* Hair cap over the forehead: the side part on the -x side, the fringe swept across to the other temple */}
      <path d={smoothClosed(capPts)} fill={`url(#${uid}-hair)`} />
      <g clipPath={`url(#${uid}-hc)`}>
        {/* Soft warm sheen on the crown toward the light, and a few strand lines following the comb: from the part
            across the top and the fringe toward the other side, and down toward the far ear on the part's other side */}
        <path d={hd([[-33, -20], [-28, -36], [-15, -46.5], [0, -49.5]])} fill="none" stroke={C.hairSheen} strokeWidth={5} strokeLinecap="round" opacity={0.17} />
        <path d={hd([[-30.5, -24], [-24, -38], [-12, -46]])} fill="none" stroke={C.hairSheen} strokeWidth={1} strokeLinecap="round" opacity={0.38} />
        <path d={hd([[-12 + hX, -37], [0, -44.5], [17, -45], [32, -33]])} fill="none" stroke={C.hairHi} strokeWidth={0.85} strokeLinecap="round" opacity={0.6} />
        <path d={hd([[-9 + hX, -34.5], [4, -37], [20, -33], [32, -20]])} fill="none" stroke={C.hairHi} strokeWidth={0.8} strokeLinecap="round" opacity={0.5} />
        <path d={hd([[-6 + hX, -30.6], [8, -30.4], [24, -25]])} fill="none" stroke={C.hairHi} strokeWidth={0.75} strokeLinecap="round" opacity={0.45} />
        <path d={hd([[-16 + hX, -36], [-25, -31], [-31, -18]])} fill="none" stroke={C.hairHi} strokeWidth={0.8} strokeLinecap="round" opacity={0.45} />
        {/* The side part: a fine lighter line from the hairline back over the crown */}
        <path d={hd([[-12.6 + hX, -33.4], [-14.8 + hX, -40.5], [-18 + 0.6 * hX, -48]])} fill="none" stroke={C.hairHi} strokeWidth={0.6} strokeLinecap="round" opacity={0.45} />
        {R2 && (
          <>
            {/* ref2: a soft sheen band across the crown and a few more fine strands following the comb */}
            <path d={hd([[-30, -30], [-20, -42], [-4, -47.5], [14, -46], [26, -40]])} fill="none" stroke={C.hairSheen} strokeWidth={4.2} strokeLinecap="round" opacity={0.14} />
            <path d={hd([[-14 + hX, -41], [2, -48], [20, -46.5], [33, -37]])} fill="none" stroke={C.hairHi} strokeWidth={0.7} strokeLinecap="round" opacity={0.5} />
            <path d={hd([[-7 + hX, -32.6], [8, -33.8], [22, -29.6], [30, -22]])} fill="none" stroke={C.hairHi} strokeWidth={0.65} strokeLinecap="round" opacity={0.42} />
            <path d={hd([[-19 + hX, -40], [-28, -33], [-33, -22]])} fill="none" stroke={C.hairHi} strokeWidth={0.65} strokeLinecap="round" opacity={0.4} />
          </>
        )}
      </g>
      {/* Warm rim light along the top of the hair (upper left) */}
      <path d={hd([[-36.4, -22], [-35, -34.5], [-28.2, -45], [-16, -51.8]])} fill="none" stroke={C.rim} strokeWidth={1.1} strokeLinecap="round" opacity={0.26} />
    </g>
  );
};
