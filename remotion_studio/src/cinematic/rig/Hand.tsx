import React, { useId } from "react";

/**
 * Shared hand (MOT-19). One small 3D hand model, projected flat, used by every character.
 *
 * USAGE
 *   <Hand shape="relaxed" L={37} skin="#d9a07a" shade="#b47853" side={1} />
 *   - Drawn in wrist-local space: wrist at (0,0), fingers point down +y (along the forearm). The caller
 *     translates/rotates it to the end of the forearm.
 *   - `L`     hand scale (the old rig's hand length). Palm is about 0.44 L long and wide, fingers add about
 *             0.38 L, so the whole hand is about 0.82 L from wrist to middle fingertip.
 *   - `side`  +1 = the rig's right arm (drawn at +x, the screen-right arm of a front-facing figure),
 *             -1 = the left arm. The left hand is the exact mirror of the right hand.
 *   - `flex`  0..1+ small living variation of the finger curl (the rig passes a slow noise).
 *   - `palm`  optional palm colour (default: derived from `skin`).
 *   - `baby`  true = infant hand: rounder palm, short chubby tapered fingers, dimpled knuckles, a wrist
 *             crease and a short thick thumb. Same shapes, same thumb rule. For newborns, crawling and
 *             sitting babies, five-year-olds can use it too if they should look young.
 *   - `view`  optional override of the preset's wrist rotation: "palm" (palm to camera), "back"
 *             (back of the hand to camera), "side" (thumb edge to camera), "edge" (little-finger edge
 *             to camera). `turn` (radians) overrides it with any angle (0 palm, PI back, -PI/2 side,
 *             +PI/2 edge; in-between values give three-quarter views).
 *
 * THE THUMB RULE (one rule, no per-pose hacks)
 *   The model is one canonical hand: thumb on +X, palm facing +Z, fingers along +Y. The wrist rotation
 *   `turn` (psi) spins it about the forearm axis and the projection is
 *       screen x = side * (X cos psi + Z sin psi),  screen y = Y,  depth = Z cos psi - X sin psi.
 *   So the left hand is the mirror of the right, and between palm and back views the thumb changes side:
 *   fingers down, side +1: palm view -> thumb at +x (outer side), back view -> thumb at -x (toward the
 *   body); side -1 mirrored. In-plane wrist rotation (done by the caller) never changes which side it is on.
 *   Finger curl is a rotation toward the palm (+Z), so curled fingers foreshorten in palm/back views and
 *   bend in profile in side views; the thumb grows from a fleshy thenar pad low on the palm near the wrist.
 */

export type HandShape = "relaxed" | "open" | "point" | "fist" | "hold" | "pranam" | "abhaya" | "cup";
export type HandView = "palm" | "back" | "side" | "edge";

interface ThumbPose {
  s: number; // spread in the palm plane, away from the index (rad)
  a: number; // palmar abduction: lift toward the palm side (rad)
  f1: number; // bend at the MCP joint, across the palm (rad)
  f2: number; // bend at the IP joint (rad)
}

interface HandPreset {
  curls: [number, number, number, number]; // index..pinky, 0 straight .. 1 fully curled
  mcp?: number; // share of the curl at the knuckle (low = hooked fingers, as around a handle)
  spread: number; // radians between neighbouring fingers
  thumb: ThumbPose;
  turn: number; // wrist rotation psi (see header)
  flexK?: number; // how much the living `flex` noise adds to the curl
}

const PRESETS: Record<HandShape, HandPreset> = {
  // soft natural curl, three-quarter back view, thumb resting beside the index
  relaxed: { curls: [0.2, 0.26, 0.32, 0.4], mcp: 0.7, spread: 0.05, thumb: { s: 0.2, a: 0.38, f1: 0.32, f2: 0.28 }, turn: -2.3 },
  // fingers together, a little curled so the long middle finger does not lead, palm at three-quarter
  open: { curls: [0.1, 0.16, 0.2, 0.24], spread: 0.03, thumb: { s: 0.42, a: 0.2, f1: 0.18, f2: 0.16 }, turn: -0.42, flexK: 0.12 },
  // index only, fully straight; middle, ring and little shut; thumb beside the index, not across it
  point: { curls: [0, 1, 1, 1], spread: 0, thumb: { s: 0.18, a: 0.16, f1: 0.28, f2: 0.32 }, turn: -0.5, flexK: 0 },
  // fingers folded into the palm, thumb wrapped over them
  fist: { curls: [1, 1, 1, 1], spread: 0, thumb: { s: 0.36, a: 0.42, f1: 0.7, f2: 0.9 }, turn: -2.2, flexK: 0 },
  // fingers hooked round a grip (handle / pole), thumb on the other side of it, seen from the thumb side
  hold: { curls: [0.92, 0.94, 0.96, 0.98], mcp: 0.45, spread: 0, thumb: { s: 0.3, a: 0.5, f1: 0.5, f2: 0.55 }, turn: -1.85, flexK: 0.15 },
  // prayer hands: straight fingers together, palm toward the other hand, thumb on the chest side
  pranam: { curls: [0.03, 0.03, 0.03, 0.04], spread: 0, thumb: { s: 0.28, a: 0.25, f1: 0.05, f2: 0.05 }, turn: 2.0, flexK: 0.15 },
  // raised blessing palm to camera: fingers together, thumb relaxed at the side
  abhaya: { curls: [0.02, 0.02, 0.04, 0.07], spread: 0.03, thumb: { s: 0.5, a: 0.35, f1: 0.12, f2: 0.12 }, turn: 0, flexK: 0.25 },
  // fingers softly cupped (under a baby, round a plate), palm to camera
  cup: { curls: [0.4, 0.43, 0.47, 0.52], spread: 0.03, thumb: { s: 0.5, a: 0.5, f1: 0.2, f2: 0.15 }, turn: 0.15 },
};

const VIEW_TURN: Record<HandView, number> = { palm: 0, back: Math.PI, side: -Math.PI / 2, edge: Math.PI / 2 };

/* ------------------------------------------------------------------ */
/* proportions                                                         */
/* ------------------------------------------------------------------ */

interface Dims {
  pl: number; // palm length (wrist to middle knuckle)
  pw: number; // palm width at the knuckles
  ww: number; // wrist half-width
  tw: number; // palm thickness at the wrist
  tk: number; // palm thickness at the knuckles
  kx: number[]; // knuckle x, index..pinky
  ky: number[]; // knuckle y (gentle arc)
  len: number[]; // finger lengths
  phal: [number, number, number]; // phalanx shares
  r0: number; // finger radius at the knuckle
  taper: number; // tip radius / base radius
  cmc: [number, number, number]; // thumb root (thenar) position
  tLen: [number, number, number]; // thumb metacarpal (fleshy base), proximal, distal
  tR: [number, number, number, number]; // thumb radii: root (thenar), MCP, IP, tip
}

const dimsFor = (L: number, baby: boolean): Dims => {
  if (baby) {
    const pl = 0.42 * L;
    const pw = 0.47 * L; // rounder, a little wider than long
    const FL = 0.6 * pl; // short chubby fingers
    return {
      pl,
      pw,
      ww: 0.17 * L,
      tw: 0.27 * L,
      tk: 0.16 * L,
      kx: [0.36, 0.12, -0.12, -0.35].map((k) => k * pw),
      ky: [0.95, 1, 0.96, 0.87].map((k) => k * pl),
      len: [0.9, 1, 0.94, 0.76].map((k) => k * FL),
      phal: [0.45, 0.3, 0.25],
      r0: 0.135 * pw,
      taper: 0.88,
      cmc: [0.24 * pw, 0.16 * pl, 0.06 * L],
      tLen: [0.42 * pl, 0.26 * pl, 0.23 * pl],
      tR: [0.2 * pw, 0.16 * pw, 0.145 * pw, 0.13 * pw],
    };
  }
  const pl = 0.44 * L;
  const pw = 0.42 * L; // palm about as long as wide
  const FL = 0.86 * pl; // middle finger 0.86 of the palm length
  return {
    pl,
    pw,
    ww: 0.15 * L,
    tw: 0.22 * L,
    tk: 0.11 * L,
    kx: [0.375, 0.125, -0.125, -0.37].map((k) => k * pw),
    ky: [0.97, 1, 0.97, 0.89].map((k) => k * pl),
    len: [0.92, 1, 0.95, 0.75].map((k) => k * FL),
    phal: [0.46, 0.29, 0.25],
    r0: 0.112 * pw,
    taper: 0.78,
    cmc: [0.26 * pw, 0.14 * pl, 0.05 * L],
    tLen: [0.48 * pl, 0.33 * pl, 0.28 * pl],
    tR: [0.17 * pw, 0.13 * pw, 0.12 * pw, 0.1 * pw],
  };
};

/* ------------------------------------------------------------------ */
/* small vector / path helpers                                         */
/* ------------------------------------------------------------------ */

type V3 = [number, number, number];
type P2 = { x: number; y: number; d: number };

const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** Rotate unit vector `d` toward `t` by angle `th` (in the plane of the two). */
const bendToward = (d: V3, t: V3, th: number): V3 => {
  const perp = norm(add(t, d, -dot(t, d)));
  return norm(add([d[0] * Math.cos(th), d[1] * Math.cos(th), d[2] * Math.cos(th)], perp, Math.sin(th)));
};

const f2 = (n: number) => n.toFixed(2);

/** Tapered capsule between two circles (union of both circles and their tangent hull). */
const capsule = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const circle = (x: number, y: number, r: number) =>
    `M ${f2(x - r)} ${f2(y)} A ${f2(r)} ${f2(r)} 0 1 0 ${f2(x + r)} ${f2(y)} A ${f2(r)} ${f2(r)} 0 1 0 ${f2(x - r)} ${f2(y)} Z`;
  if (d <= Math.abs(r1 - r2) + 0.01) return r1 >= r2 ? circle(x1, y1, r1) : circle(x2, y2, r2);
  const al = Math.atan2(dy, dx);
  const be = Math.acos((r1 - r2) / d);
  const pt = (x: number, y: number, r: number, a: number) => `${f2(x + r * Math.cos(a))} ${f2(y + r * Math.sin(a))}`;
  const large2 = 2 * be > Math.PI ? 1 : 0;
  const large1 = 2 * Math.PI - 2 * be > Math.PI ? 1 : 0;
  return (
    `M ${pt(x1, y1, r1, al + be)} L ${pt(x2, y2, r2, al + be)} ` +
    `A ${f2(r2)} ${f2(r2)} 0 ${large2} 0 ${pt(x2, y2, r2, al - be)} ` +
    `L ${pt(x1, y1, r1, al - be)} A ${f2(r1)} ${f2(r1)} 0 ${large1} 0 ${pt(x1, y1, r1, al + be)} Z`
  );
};

/** Convex hull (monotone chain). */
const hull = (pts: Array<{ x: number; y: number }>) => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: typeof p = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: typeof p = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};

/** Closed path with rounded corners through the midpoints of a polygon. */
const roundPath = (pts: Array<{ x: number; y: number }>) => {
  const n = pts.length;
  if (n < 3) return "";
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M ${f2(m0.x)} ${f2(m0.y)} `;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q ${f2(pts[i].x)} ${f2(pts[i].y)} ${f2(m.x)} ${f2(m.y)} `;
  }
  return `${d}Z`;
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1, 7), 16);
  const pb = parseInt(b.slice(1, 7), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

/* ------------------------------------------------------------------ */
/* the hand                                                            */
/* ------------------------------------------------------------------ */

interface Seg {
  a: P2;
  b: P2;
  ra: number;
  rb: number;
  fill: string;
}

export const Hand: React.FC<{
  shape: HandShape;
  L: number;
  skin: string;
  shade: string;
  palm?: string;
  side: 1 | -1;
  flex?: number;
  baby?: boolean;
  view?: HandView;
  turn?: number;
}> = ({ shape, L, skin, shade, palm: palmIn, side, flex = 0, baby = false, view, turn }) => {
  const rid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const p = PRESETS[shape];
  const D = dimsFor(L, baby);
  const psi = turn ?? (view ? VIEW_TURN[view] : p.turn);
  const cs = Math.cos(psi);
  const sn = Math.sin(psi);

  // colours from THIS character's skin (no pale "bandage" hands on darker skin).
  // The hand is drawn like the forearm it grows from (Puppet: plain skin fill, a soft low-opacity shade,
  // NO stroke): no dark silhouette outline, no ink. Parts are separated only by a soft, thin, slightly
  // darker skin tone, and the wrist fades into plain skin so the forearm continues without a seam.
  const palmCol = palmIn ?? mixHex(skin, "#ffd9c4", 0.12);
  const nail = mixHex(skin, "#fff0ea", 0.42);
  const crease = mixHex(skin, shade, 0.85); // a darker skin tone, never a brown ink line
  const shadeK = 0.34; // how far a part's shade side goes toward `shade` (the arm's strip is about 0.22)
  const cw = Math.max(0.3, L * 0.012); // crease width between parts

  // projection (see header)
  const P = (v: V3): P2 => ({ x: side * (v[0] * cs + v[2] * sn), y: v[1], d: v[2] * cs - v[0] * sn });
  const view2 = (v: V3) => v[2] * cs - v[0] * sn; // depth of a direction (positive = faces the camera)
  const palmFacing = cs; // the palm normal (+Z) toward the camera
  const palmFill = palmFacing > 0.15 ? palmCol : skin;

  // light: from the thumb side, the wrist side and the palm side of the canonical hand, projected
  const lp = P([0.7, -0.5, 0.5]);
  const lm = Math.hypot(lp.x, lp.y) || 1;
  const lit = { x: lp.x / lm, y: lp.y / lm };

  /* ----- palm block: hull of the palm outline at both faces + the thenar pad ----- */
  const thick = (y: number) => D.tw + (D.tk - D.tw) * Math.min(1, Math.max(0, y / D.pl));
  const outline: Array<[number, number]> = [];
  // ulnar (little-finger) edge from the wrist to the pinky knuckle
  for (let k = 0; k <= 4; k++) {
    const t = k / 4;
    const y = t * D.ky[3];
    const x = -(D.ww + (D.pw * 0.5 - D.ww) * Math.sin((t * Math.PI) / 2) * 1.02);
    outline.push([x, y]);
  }
  // knuckle line
  for (let i = 3; i >= 0; i--) outline.push([D.kx[i] + (i === 3 ? -D.r0 * 0.4 : i === 0 ? D.r0 * 0.4 : 0), D.ky[i] + D.r0 * 0.25]);
  // radial (index) edge up to the web, then the wrist
  outline.push([D.pw * 0.5, D.ky[0] * 0.8]);
  outline.push([D.pw * 0.48, D.pl * 0.55]);
  outline.push([D.ww * 1.05, 0]);
  const palmPts: P2[] = [];
  for (const [x, y] of outline) {
    const t = thick(y) / 2;
    palmPts.push(P([x, y, t]), P([x, y, -t]));
  }
  // thenar pad: a fleshy ellipsoid on the palm side, low near the wrist on the thumb side
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    palmPts.push(P([D.pw * 0.27 + Math.cos(a) * D.pw * 0.17, D.pl * (0.36 + Math.sin(a) * 0.24), thick(D.pl * 0.35) * 0.5 + Math.max(0, Math.sin(a + 0.5)) * D.pw * 0.05]));
  }
  const palmPath = roundPath(hull(palmPts));
  // projected half-width of the wrist (palm block at y = 0) for the seamless wrist bridge
  const wristHalf = D.ww * Math.abs(cs) + (D.tw / 2) * Math.abs(sn);

  /* ----- fingers ----- */
  const fingerSegs: Array<{ segs: Seg[]; depth: number; front: boolean; tip?: { a: P2; b: P2; r: number; show: number } }> = [];
  for (let i = 0; i < 4; i++) {
    const c = Math.min(1, Math.max(0, p.curls[i] + flex * (p.flexK ?? 1) * (0.05 + i * 0.025)));
    const mk = p.mcp ?? 1;
    const th = [c * 1.48 * mk, c * 1.75, c * 1.15]; // knuckle, middle, end joint
    const sa = (1.5 - i) * p.spread;
    let pos: V3 = [D.kx[i], D.ky[i], 0];
    let phi = 0;
    const pts: V3[] = [pos];
    for (let k = 0; k < 3; k++) {
      phi += th[k];
      const dir: V3 = [Math.sin(sa) * Math.cos(phi), Math.cos(sa) * Math.cos(phi), Math.sin(phi)];
      pos = add(pos, dir, D.len[i] * D.phal[k]);
      pts.push(pos);
    }
    const radii = [D.r0, D.r0 * (1 - (1 - D.taper) * 0.45), D.r0 * (1 - (1 - D.taper) * 0.75), D.r0 * D.taper];
    const pp = pts.map(P);
    const segs: Seg[] = [];
    let mean = 0;
    for (let k = 0; k < 3; k++) {
      // which side of this phalanx faces the camera: palmar side -> palm colour
      const ph = th.slice(0, k + 1).reduce((s, v) => s + v, 0);
      const palmar: V3 = [-Math.sin(sa) * Math.sin(ph), -Math.cos(sa) * Math.sin(ph), Math.cos(ph)];
      segs.push({ a: pp[k], b: pp[k + 1], ra: radii[k], rb: radii[k + 1], fill: view2(palmar) > 0.2 ? palmCol : skin });
      mean += (pp[k + 1].d - pp[0].d) / 3;
    }
    // nail on the end phalanx when its back faces the camera
    const phT = th[0] + th[1] + th[2];
    const dorsal: V3 = [Math.sin(sa) * Math.sin(phT), Math.cos(sa) * Math.sin(phT), -Math.cos(phT)];
    const show = view2(dorsal);
    fingerSegs.push({
      segs,
      depth: pp.reduce((s, q) => s + q.d, 0) / pp.length,
      front: mean > D.r0 * 0.6,
      tip: { a: pp[2], b: pp[3], r: radii[3], show },
    });
  }

  /* ----- thumb: thenar (fleshy base) -> proximal -> distal ----- */
  const T = p.thumb;
  const tFlex = flex * (p.flexK ?? 1) * 0.06;
  let td: V3 = norm([Math.sin(T.s) * Math.cos(T.a), Math.cos(T.s) * Math.cos(T.a), Math.sin(T.a)]);
  const across: V3 = norm([-0.95, -0.05, 0.25]); // thumb flexes across the palm (its nail faces sideways)
  const tp: V3[] = [D.cmc];
  let tpos: V3 = D.cmc;
  tpos = add(tpos, td, D.tLen[0]);
  tp.push(tpos);
  td = bendToward(td, across, T.f1 + tFlex);
  tpos = add(tpos, td, D.tLen[1]);
  tp.push(tpos);
  td = bendToward(td, across, T.f2 + tFlex);
  tpos = add(tpos, td, D.tLen[2]);
  tp.push(tpos);
  const tpp = tp.map(P);
  const thumbDepth = (tpp[1].d + tpp[2].d + tpp[3].d) / 3;
  const thumbFront = thumbDepth > 0;
  const tPalmar = norm(add(across, td, -dot(across, td)));
  const tNail = view2([-tPalmar[0], -tPalmar[1], -tPalmar[2]]);
  const thumbSegs: Seg[] = [0, 1, 2].map((k) => ({
    a: tpp[k],
    b: tpp[k + 1],
    ra: D.tR[k],
    rb: D.tR[k + 1],
    fill: k === 0 ? palmFill : view2(tPalmar) > 0.25 ? palmCol : skin,
  }));

  /* ----- drawing ----- */
  const capOf = (s: Seg, grow = 0) => capsule(s.a.x, s.a.y, s.ra + grow, s.b.x, s.b.y, s.rb + grow);
  const silId = `${rid}-sil`; // the hand's own silhouette: separation shading never spills outside it
  const wristGrad = `url(#${rid}-wg)`; // palm colour fading in from plain skin at the wrist
  // a chain: soft separation shading (clipped to the hand, so it only shows where a part lies over another
  // part, never as an outline), shade, then a lit core shifted toward the light (shade on the far side)
  const chain = (segs: Seg[], key: string, edge: boolean, skipEdge0 = false) => (
    <g key={key}>
      {edge && (
        <g clipPath={`url(#${silId})`} opacity={0.42}>
          {segs.map((s, k) => (skipEdge0 && k === 0 ? null : <path key={`e${k}`} d={capOf(s, cw)} fill={crease} />))}
        </g>
      )}
      {segs.map((s, k) =>
        skipEdge0 && k === 0 ? <path key={`s${k}`} d={capOf(s)} fill={wristGrad} /> : <path key={`s${k}`} d={capOf(s)} fill={mixHex(s.fill, shade, shadeK)} />,
      )}
      {segs.map((s, k) => {
        if (skipEdge0 && k === 0) return null; // the thenar pad melts into the palm: no ring, no shade
        const o = 0.22;
        return (
          <path
            key={`c${k}`}
            d={capsule(s.a.x + lit.x * s.ra * o, s.a.y + lit.y * s.ra * o, s.ra * 0.8, s.b.x + lit.x * s.rb * o, s.b.y + lit.y * s.rb * o, s.rb * 0.8)}
            fill={s.fill}
          />
        );
      })}
    </g>
  );
  const nailOf = (t: { a: P2; b: P2; r: number; show: number }, key: string) => {
    if (t.show < 0.35) return null;
    const ax = t.a.x + (t.b.x - t.a.x) * 0.45;
    const ay = t.a.y + (t.b.y - t.a.y) * 0.45;
    return (
      <path
        key={key}
        d={capsule(ax, ay, t.r * 0.45, t.b.x - (t.b.x - t.a.x) * 0.05, t.b.y - (t.b.y - t.a.y) * 0.05, t.r * 0.5)}
        fill={nail}
        opacity={(baby ? 0.35 : 0.6) * Math.min(1, (t.show - 0.35) * 2.5)}
      />
    );
  };

  // palm details
  const backFacing = -cs; // back of the hand toward the camera
  const palmBlock = (
    <g key="palm">
      <defs>
        <clipPath id={`${rid}-pc`}>
          <path d={palmPath} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${rid}-pc)`}>
        <path d={palmPath} fill={mixHex(palmFill, shade, shadeK)} />
        <path d={palmPath} fill={wristGrad} transform={`translate(${f2(lit.x * D.pw * 0.09)}, ${f2(lit.y * D.pw * 0.09)})`} />
        {/* the wrist melts into the forearm: plain skin at the wrist, fading out up the palm */}
        <path d={palmPath} fill={`url(#${rid}-wf)`} />
        {/* palm view: thenar pad and two soft creases (very faint) */}
        {palmFacing > 0.5 && (
          <g fill="none" stroke={crease} strokeWidth={cw} strokeLinecap="round" opacity={0.26 * Math.min(1, (palmFacing - 0.5) * 3)}>
            {(() => {
              const a = P([D.pw * 0.1, D.pl * 0.08, 0]);
              const b = P([-D.pw * 0.02, D.pl * 0.45, 0]);
              const c = P([D.pw * 0.24, D.pl * 0.78, 0]);
              const h1 = P([-D.pw * 0.46, D.pl * 0.66, 0]);
              const h2 = P([D.pw * 0.05, D.pl * 0.64, 0]);
              const h3 = P([D.pw * 0.3, D.pl * 0.78, 0]);
              return (
                <>
                  <path d={`M ${f2(a.x)} ${f2(a.y)} Q ${f2(b.x)} ${f2(b.y)} ${f2(c.x)} ${f2(c.y)}`} />
                  <path d={`M ${f2(h1.x)} ${f2(h1.y)} Q ${f2(h2.x)} ${f2(h2.y)} ${f2(h3.x)} ${f2(h3.y)}`} />
                </>
              );
            })()}
          </g>
        )}
        {/* back view: soft knuckle highlights (adult) or dimples (baby) */}
        {backFacing > 0.45 &&
          D.kx.map((x, i) => {
            const q = P([x, D.ky[i] - D.r0 * 0.6, 0]);
            return baby ? (
              <ellipse key={`k${i}`} cx={q.x} cy={q.y} rx={D.r0 * 0.32} ry={D.r0 * 0.2} fill={crease} opacity={0.24 * Math.min(1, (backFacing - 0.45) * 3)} />
            ) : (
              <ellipse key={`k${i}`} cx={q.x} cy={q.y} rx={D.r0 * 0.55} ry={D.r0 * 0.38} fill="#ffffff" opacity={0.14 * Math.min(1, (backFacing - 0.45) * 3)} />
            );
          })}
        {/* baby wrist crease: a short, very faint fold in the middle of the wrist (never a band across it) */}
        {baby &&
          (() => {
            const a = P([-D.ww * 0.6, D.pl * 0.09, D.tw * 0.5]);
            const b = P([0, D.pl * 0.13, D.tw * 0.5]);
            const c = P([D.ww * 0.6, D.pl * 0.09, D.tw * 0.5]);
            const a2 = P([-D.ww * 0.6, D.pl * 0.09, -D.tw * 0.5]);
            const b2 = P([0, D.pl * 0.13, -D.tw * 0.5]);
            const c2 = P([D.ww * 0.6, D.pl * 0.09, -D.tw * 0.5]);
            return (
              <path
                d={`M ${f2(a.x)} ${f2(a.y)} Q ${f2(b.x)} ${f2(b.y)} ${f2(c.x)} ${f2(c.y)} M ${f2(a2.x)} ${f2(a2.y)} Q ${f2(b2.x)} ${f2(b2.y)} ${f2(c2.x)} ${f2(c2.y)}`}
                fill="none"
                stroke={crease}
                strokeWidth={cw}
                strokeLinecap="round"
                opacity={0.2}
              />
            );
          })()}
      </g>
    </g>
  );

  // No silhouette outline (the forearm has none). Shared defs: the hand's own silhouette (clip for the soft
  // separation shading), the palm-colour gradient that starts as plain skin at the wrist, and the wrist fade.
  const allSegs = [...fingerSegs.flatMap((f) => f.segs), ...thumbSegs];
  const defs = (
    <defs>
      <clipPath id={silId}>
        <path d={palmPath} />
        {allSegs.map((s, k) => (
          <path key={k} d={capOf(s)} />
        ))}
      </clipPath>
      <linearGradient id={`${rid}-wg`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(D.pl * 0.05)} x2="0" y2={f2(D.pl * 0.45)}>
        <stop offset="0" stopColor={skin} />
        <stop offset="1" stopColor={palmFill} />
      </linearGradient>
      <linearGradient id={`${rid}-wf`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(D.pl * 0.04)} x2="0" y2={f2(D.pl * 0.34)}>
        <stop offset="0" stopColor={skin} stopOpacity={1} />
        <stop offset="1" stopColor={skin} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
  // wrist bridge: plain skin, from inside the forearm's end down into the palm, so the forearm's end and the
  // rounded wrist corners of the palm never show a notch or an edge (same colour as the arm: invisible)
  const bridgeTop = Math.min(wristHalf, D.ww) * 0.8;
  const bridgePath = capsule(0, -D.ww * 0.9, bridgeTop, 0, D.pl * 0.18, wristHalf * 0.96);
  const wristBridge = <path d={bridgePath} fill={skin} />;
  // ...and the same shape again over the palm with the wrist fade, so no palm edge or shade sliver shows at
  // the join (plain skin at the wrist, fading out up the palm before the thumb and fingers)
  const wristCover = <path d={bridgePath} fill={`url(#${rid}-wf)`} />;

  // order: parts behind the palm, the palm, parts in front of it; each group back to front
  type Item = { depth: number; front: boolean; node: React.ReactNode };
  const items: Item[] = fingerSegs.map((fs, i) => ({
    depth: fs.depth,
    front: fs.front,
    node: (
      <g key={`f${i}`}>
        {chain(fs.segs, `fc${i}`, true)}
        {fs.tip && nailOf(fs.tip, `n${i}`)}
      </g>
    ),
  }));
  items.push({
    depth: thumbDepth,
    front: thumbFront,
    node: (
      <g key="thumb">
        {chain(thumbSegs, "tc", true, thumbFront)}
        {nailOf({ a: tpp[2], b: tpp[3], r: D.tR[3], show: tNail }, "tn")}
      </g>
    ),
  });
  const behind = items.filter((it) => !it.front).sort((a, b) => a.depth - b.depth);
  const front = items.filter((it) => it.front).sort((a, b) => a.depth - b.depth);

  return (
    <g>
      {defs}
      {wristBridge}
      {behind.map((it) => it.node)}
      {palmBlock}
      {wristCover}
      {front.map((it) => it.node)}
    </g>
  );
};
