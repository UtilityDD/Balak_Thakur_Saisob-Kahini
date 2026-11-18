/**
 * Head v2 geometry: the head is modelled as stacked elliptical cross-sections with
 * separate front/back depth plus facial protrusions (brow ridge, nose, lips, chin).
 * It is rotated by `yaw` and projected orthographically, so 3/4 and profile views
 * produce true silhouettes (nose and chin in profile, far eye hidden, ears swapping).
 *
 * Units: normalised so the head "radius" R = 1. y is down; y = 0 ≈ eye/ear level.
 */

export interface FaceShape {
  crown: number; // cranium width
  forehead: number;
  cheek: number; // cheekbone width
  jaw: number; // jaw-angle width
  chin: number; // chin width
  faceLen: number; // vertical scale of the lower face
  depthFront: number;
  depthBack: number;
  nose: number; // protrusion scale
  noseLen: number;
  noseWidth: number;
  lips: number;
  chinBump: number;
  eyeY: number;
  eyeSep: number; // radians from front centre
  eyeSize: number;
  eyeRound: number; // 0 almond .. 1 round
  earY: number;
  earSize: number;
  cheekPuff: number; // baby/child fullness
  chinRound?: number; // 0 = squarer lower jaw (adult default), 1 = fully rounded child chin
}

export const FACE_ADULT_M: FaceShape = {
  crown: 0.88,
  forehead: 0.84,
  cheek: 0.83,
  jaw: 0.74,
  chin: 0.3,
  faceLen: 1.14,
  depthFront: 0.8,
  depthBack: 1.08,
  nose: 1,
  noseLen: 1,
  noseWidth: 1,
  lips: 1,
  chinBump: 1,
  eyeY: -0.1,
  eyeSep: 0.44,
  eyeSize: 0.17,
  eyeRound: 0.25,
  earY: 0.02,
  earSize: 1,
  cheekPuff: 0,
};

export const FACE_ADULT_F: FaceShape = {
  ...FACE_ADULT_M,
  jaw: 0.62,
  chin: 0.26,
  faceLen: 1.04,
  nose: 0.78,
  noseWidth: 0.85,
  lips: 1.15,
  eyeSize: 0.19,
  eyeRound: 0.3,
};

/** Child: big rounded cranium, soft full cheeks, short lower face, small rounded chin (no jaw angle). */
export const FACE_CHILD: FaceShape = {
  ...FACE_ADULT_M,
  // cross-section widths follow a circle below the eyes → a soft round face with a gently
  // rounded chin (no flat bottom, no side bulges), lower face a little shorter than an adult's
  crown: 1.0,
  forehead: 0.97,
  cheek: 0.87,
  jaw: 0.7,
  chin: 0.45,
  faceLen: 0.86,
  nose: 0.42,
  noseLen: 0.66,
  noseWidth: 0.85,
  lips: 0.82,
  chinBump: 0.4,
  eyeY: 0.04,
  eyeSize: 0.235,
  eyeRound: 0.82,
  earY: 0.1,
  cheekPuff: 0.06,
};

/** Toddler Balak Thakur (ages 3-5): luminous calm eyes, fuller cheeks, small nose, rounded chin. */
export const FACE_TODDLER: FaceShape = {
  ...FACE_CHILD,
  crown: 1.0,
  forehead: 0.97,
  cheek: 0.9,
  jaw: 0.8,
  chin: 0.62,
  faceLen: 0.8,
  nose: 0.36,
  noseLen: 0.62,
  lips: 0.9,
  chinBump: 0.3,
  chinRound: 1,
  eyeY: 0.05,
  eyeSize: 0.25,
  eyeRound: 0.9,
  cheekPuff: 0.18,
};

export const FACE_BABY: FaceShape = {
  ...FACE_CHILD,
  crown: 1.02,
  forehead: 1.02,
  cheek: 0.96,
  jaw: 0.9,
  chin: 0.5,
  chinRound: 1,
  faceLen: 0.7,
  depthBack: 1.12,
  nose: 0.22,
  noseLen: 0.42,
  noseWidth: 0.85,
  lips: 0.65,
  chinBump: 0.3,
  eyeY: 0.17,
  eyeSep: 0.45,
  eyeSize: 0.3,
  eyeRound: 1,
  earY: 0.16,
  earSize: 0.8,
  cheekPuff: 0.22,
}

/* ---------------- profiles ---------------- */

const smoothInterp = (ys: number[], vs: number[], y: number) => {
  if (y <= ys[0]) return vs[0];
  for (let i = 0; i < ys.length - 1; i++) {
    if (y <= ys[i + 1]) {
      const t = (y - ys[i]) / (ys[i + 1] - ys[i]);
      const u = t * t * (3 - 2 * t);
      return vs[i] + (vs[i + 1] - vs[i]) * u;
    }
  }
  return vs[vs.length - 1];
};

export interface HeadModel {
  s: FaceShape;
  top: number;
  bottom: number;
  width: (y: number) => number;
  front: (y: number) => number;
  back: (y: number) => number;
  bump: (alpha: number, y: number) => number;
  mouthY: number;
  noseTipY: number;
}

const cache = new Map<string, HeadModel>();

export function headModel(s: FaceShape): HeadModel {
  const key = JSON.stringify(s);
  const hit = cache.get(key);
  if (hit) return hit;
  const L = (y: number) => (y < 0.05 ? y : 0.05 + (y - 0.05) * s.faceLen);
  const ys = [-1.12 - s.cheekPuff * 0.9, -1.04, -0.9, -0.72, -0.45, -0.2, 0.05, 0.3, 0.55, 0.72, 0.88, 0.98].map(L);
  const puff = s.cheekPuff;
  const r = s.chinRound ?? 0;
  const chinW = (s.jaw * 0.45 + s.chin * 0.55) * (1 - r) + (s.jaw * 0.2 + s.chin * 0.8) * r;
  const wv = [
    0,
    0.42,
    0.7,
    s.crown,
    s.forehead,
    (s.forehead + s.cheek) / 2,
    s.cheek + puff * 0.4,
    s.cheek * 0.6 + s.jaw * 0.4 + puff,
    s.jaw + puff * 0.8,
    chinW + puff * 0.3,
    s.chin,
    0.02,
  ];
  // rounded chin: the lower face follows an ellipse from the jaw down to the chin tip,
  // instead of a straight blend that stays flat and then cuts off (the boxy base)
  if (r > 0) {
    const c = ys[8];
    const b = ys[11] - ys[8];
    const ell = (y: number, a: number) => a * Math.sqrt(Math.max(0, 1 - ((y - c) / b) ** 2));
    wv[9] = wv[9] * (1 - r) + ell(ys[9], wv[8]) * r;
    // taper the chin toward the tip: a round chin, not a flat base that cuts off
    wv[10] = wv[10] * (1 - r) + ell(ys[10], wv[8]) * 0.62 * r;
  }
  const fv = [0, 0.4, 0.6, 0.76, s.depthFront + 0.06, s.depthFront + 0.04, s.depthFront, s.depthFront + 0.02 + puff * 0.3, s.depthFront, s.depthFront * 0.86, s.depthFront * 0.68, 0.05];
  const bv = [0, 0.48, 0.8, s.depthBack * 0.95, s.depthBack, s.depthBack, s.depthBack * 0.94, 0.84, 0.64, 0.5, 0.36, 0.05];
  const noseRoot = s.eyeY - 0.04;
  const noseTipY = s.eyeY + 0.36 * s.faceLen * s.noseLen;
  const mouthY = noseTipY + 0.22 * s.faceLen;
  const chinY = ys[10] - 0.08;
  const g = (a: number, sd: number) => Math.exp(-(a * a) / (2 * sd * sd));
  const bump = (alpha: number, y: number) => {
    let b = 0;
    // brow ridge
    b += 0.035 * g(y - (s.eyeY - 0.18), 0.05) * g(alpha, 0.7);
    // nose: bridge → tip, falls away under the tip
    if (y > noseRoot && y < noseTipY + 0.08) {
      const t = y <= noseTipY ? (y - noseRoot) / (noseTipY - noseRoot) : 1 - (y - noseTipY) / 0.08;
      const prof = y <= noseTipY ? 0.05 + 0.27 * Math.pow(t, 1.4) : 0.32 * Math.max(0, t);
      b += prof * s.nose * g(alpha, 0.16 * s.noseWidth + 0.08 * (y - noseRoot));
    }
    // lips
    b += 0.07 * s.lips * g(y - mouthY, 0.06) * g(alpha, 0.33);
    // chin
    b += 0.07 * s.chinBump * g(y - chinY, 0.07) * g(alpha, 0.4);
    return b;
  };
  // above the forehead the skull is a dome: circular profile instead of stepped controls
  const yF = ys[4];
  const rad = yF - ys[0];
  const dome = (y: number) => Math.sqrt(Math.max(0, 1 - ((y - yF) / rad) ** 2));
  const m: HeadModel = {
    s,
    top: ys[0],
    bottom: ys[11],
    width: (y) => (y < yF ? Math.max(s.crown, s.forehead) * dome(y) : smoothInterp(ys, wv, y)),
    front: (y) => (y < yF ? (s.depthFront + 0.06) * dome(y) : smoothInterp(ys, fv, y)),
    back: (y) => (y < yF ? s.depthBack * dome(y) : smoothInterp(ys, bv, y)),
    bump,
    mouthY,
    noseTipY,
  };
  cache.set(key, m);
  return m;
}

/* ---------------- projection ---------------- */

export interface Proj {
  x: number;
  y: number;
  z: number; // toward camera (>0 = facing camera side)
  n: number; // foreshortening factor 0..1 for surface-mounted features
}

/** Project a surface point at azimuth `alpha` (0 = front, + = character's left/screen right) and height y. */
export function project(m: HeadModel, alpha: number, y: number, yaw: number, shell = 1, extra = 0): Proj {
  const a = m.width(y) * shell;
  const ca = Math.cos(alpha);
  const d = ca >= 0 ? m.front(y) * shell + m.bump(alpha, y) + extra : m.back(y) * shell;
  const x = a * Math.sin(alpha);
  const z = d * ca;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  return { x: x * cy + z * sy, y, z: -x * sy + z * cy, n: Math.cos(alpha + yaw) };
}

// finer azimuth sampling: the coarse 73-step ring made the face contour wobble and jump
const ALPHAS = Array.from({ length: 241 }, (_, i) => -Math.PI + (i / 240) * Math.PI * 2);

/** Projected silhouette (closed polygon) of the head at `yaw`, optional shell inflation. */
export function silhouette(m: HeadModel, yaw: number, shell = 1, yFrom = m.top, yTo = m.bottom, steps = 56): Array<[number, number]> {
  const left: Array<[number, number]> = [];
  const right: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const y = yFrom + ((yTo - yFrom) * i) / steps;
    let mn = Infinity;
    let mx = -Infinity;
    for (const a of ALPHAS) {
      const p = project(m, a, y, yaw, shell);
      if (p.x < mn) mn = p.x;
      if (p.x > mx) mx = p.x;
    }
    left.push([mn, y]);
    right.push([mx, y]);
  }
  return [...right, ...left.reverse()];
}

/** Extreme projected x of the (shell-inflated) head at height y: side −1 = leftmost, +1 = rightmost. */
export function extremeX(m: HeadModel, y: number, yaw: number, shell: number, side: 1 | -1): number {
  let best = side > 0 ? -Infinity : Infinity;
  for (const a of ALPHAS) {
    const p = project(m, a, y, yaw, shell);
    if (side > 0 ? p.x > best : p.x < best) best = p.x;
  }
  return best;
}

/** Hairline spec: y of the hair edge as a function of azimuth. */
export interface HairSpec {
  front: number; // at alpha 0
  temple: number; // at |alpha| 0.9
  side: number; // at |alpha| PI/2 (sideburn)
  back: number; // at |alpha| PI (nape)
  thick: number;
  jag?: number; // jagged fringe amplitude
  jagFreq?: number;
  partAlpha?: number; // optional parting: dips the hairline there
}

export function hairline(h: HairSpec, alpha: number): number {
  const a = Math.abs(alpha);
  let y: number;
  if (a < 0.9) y = h.front + (h.temple - h.front) * (a / 0.9);
  else if (a < Math.PI / 2) y = h.temple + (h.side - h.temple) * ((a - 0.9) / (Math.PI / 2 - 0.9));
  else y = h.side + (h.back - h.side) * ((a - Math.PI / 2) / (Math.PI / 2));
  if (h.jag) y += h.jag * Math.sin(alpha * (h.jagFreq ?? 11)) * (a < 1.6 ? 1 : 0.4);
  if (h.partAlpha !== undefined) y -= 0.06 * Math.exp(-((alpha - h.partAlpha) ** 2) / 0.01);
  return y;
}

/** Hair mass behind the face (full hair silhouette). */
export function hairBack(m: HeadModel, h: HairSpec, yaw: number): Array<[number, number]> {
  const yMax = Math.max(h.back, h.side, h.front);
  // start at the skull top, not above it: above the dome the width is 0, so the outline
  // collapsed into a thin spike ("antenna") on loose hair styles
  return silhouette(m, yaw, 1 + h.thick, m.top + 0.02, Math.min(yMax, m.bottom), 30);
}

/**
 * Hair cap in front of the face: silhouette contour from the crown down to the
 * visible hairline on each side, closed along the visible (camera-facing) hairline.
 */
export function hairFront(m: HeadModel, h: HairSpec, yaw: number): Array<[number, number]> | null {
  const shell = 1 + h.thick;
  const yLim = m.bottom - 0.12;
  const vis: Proj[] = [];
  for (let i = 0; i <= 120; i++) {
    const a = -Math.PI + (i / 120) * Math.PI * 2;
    const y = Math.min(hairline(h, a), yLim);
    const p = project(m, a, y, yaw, shell);
    if (p.z > 0) vis.push({ ...p, y });
  }
  if (vis.length < 3) return null;
  // vis is already ordered by azimuth (screen-left → screen-right across the face)
  const L = vis[0];
  const R = vis[vis.length - 1];
  // contour points (silhouette) from crown down to each side's hairline height
  const sil = (fromY: number, toY: number, side: 1 | -1) => {
    const out: Array<[number, number]> = [];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const y = fromY + ((toY - fromY) * i) / steps;
      let best = side > 0 ? -Infinity : Infinity;
      for (const a of ALPHAS) {
        const p = project(m, a, y, yaw, shell);
        if (side > 0 ? p.x > best : p.x < best) best = p.x;
      }
      out.push([best, y]);
    }
    return out;
  };
  const top = m.top - h.thick * 0.6;
  const leftC = sil(top, L.y, -1);
  const rightC = sil(top, R.y, 1).reverse();
  return [...leftC, ...vis.map((p) => [p.x, p.y] as [number, number]), ...rightC];
}

/** Catmull-Rom smoothed closed path. */
export function smoothPath(pts: Array<[number, number]>, R: number, close = true): string {
  if (pts.length < 2) return "";
  const P = pts.map(([x, y]) => [x * R, y * R]);
  const n = P.length;
  let d = `M ${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  const at = (i: number) => (close ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return close ? d + " Z" : d;
}
