import React, { useId } from "react";
import { blink, clamp, hash, lerp, noise1 } from "../core/anim";

/**
 * THE TORTOISE (কচ্ছপ): Episode 5, scene 01 (STO-20, plan "Animals"). A Bengal freshwater pond turtle, realistic and
 * readable (ANI-01), borderless form shading with the light from the upper left, NO glow (BAL-05).
 *
 * It is a small projected 3D model: an ellipsoid-dome carapace tiled with real scutes (5 vertebrals, 4 pairs of
 * costals, 25 marginals; growth rings, soft yellow flecks), a flat pale-yellow plastron with dark blotches, the bridge
 * between them, four short clawed webbed legs, a head on a retractable neck and a short pointed tail. Every view, the
 * turn on the spot, the roll onto its back and the paddling legs come out of the same model, so contact points
 * (jaws, rim grips, planted feet) are exact in every frame.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SCALE (to the six-year-old Balak)
 * ---------------------------------------------------------------------------------------------------------------
 *   The standing child rig is about 230-260 px tall at its s = 1 for a child of about 114 cm: 2.15 px per cm
 *   (TORTOISE_PX_PER_CM). The model's carapace is 100 units long; at s = 1 one unit is 0.6 px
 *   (TORTOISE_PX_PER_UNIT), so variant 0 is 60 px long = 28 cm. Variants scale 0.93 to 1.07 (26 to 30 cm).
 *   Use the SAME s as the standing child rig in a shot and the two are to scale. tortoiseLengthPx(s, variant).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * <Tortoise ... />   draws inside any <svg> / <Layer>, in world px. Everything is a prop the scene keys per frame.
 * ---------------------------------------------------------------------------------------------------------------
 *   x, y       ground point under the shell centre at rest (world px). The shell sits on / the feet stand on this
 *              ground line. (A roll moves the body sideways about its rim pivot, see turnOver.)
 *   s          scale, 1 = to scale with the standing child rig at s = 1 (default 1).
 *   f          story clock (accepted for the shared rig API; all actions come from the props below, keyed on f).
 *   lifeF      real frame: blinks, breathing (throat pulse and foreleg pump), head sway, tail flicks, the paddling
 *              legs and the righting stretch. Keeps moving in a pause (PIT-03).
 *   view       "side" (profile, camera 14 deg above) | "threeQuarter" (turned 35 deg toward the camera, camera
 *              26 deg above). Default "side".
 *   flip       face screen-left instead of screen-right.
 *   yaw        optional override of the heading in degrees (0 = facing screen right, 90 = facing the camera,
 *              180 = facing left, -90 = facing away). flip mirrors it (180 - yaw).
 *   elev       optional camera elevation in degrees (default 14 side / 26 threeQuarter). A standing-height medium
 *              shot looking down at the ground can use 30-40 to read the plastron when it is turned over.
 *   variant    0..3: four slightly different animals (size, shell tone, fleck density, ring contrast, dome height,
 *              pattern). seed (optional) replaces the variant's pattern / rhythm seed for more individuals.
 *
 *   ACTIONS
 *   walk       0..1 gait amount: 0 settled (plastron 2 u off the ground, legs half tucked), 1 walking (shell lifted
 *              5.5 u, diagonal-pair walk, the shell rocks and bobs slightly). Ease it 0 -> 1 over about 6-10 f
 *              before dist starts moving and back after it stops.
 *   dist       ground distance travelled, in world px (monotonic). It drives the leg cycle so the planted feet
 *              do not slide; the scene moves x, y by the same distance: use tortoiseAt(x0, y0, dist, props) or
 *              tortoiseAdvance(props, dist). A slow plod is about 6 cm/s: 0.55 px/f at s = 1 (0.55 * s px/f).
 *   neck       0..1 head in (0, only the snout shows and the eye half closes) / half (0.5) / out (1). Sways on lifeF.
 *   lid        0..1 extra eyelid closure (a slow blink the scene keys); ordinary blinks run on lifeF.
 *   turnOver   0..1 roll onto its back: roll angle = 180 deg * turnOver (the scene does the easing). The shell
 *              pivots on its rim on the ground (it is never lifted off unless `lift`), the legs flail while it
 *              rolls, and at 1 it lies plastron up with the legs paddling in the air and the head stretching out and
 *              down to right itself. Key it back 1 -> 0 to right it. The hands FOLLOW the shell: put the child's
 *              hands on tortoiseGrips(props) every frame (one at the tail end, one at the lifting side rim).
 *   rollDir    +1 (default): rolls toward the camera: the hands lift the FAR rim (a child standing behind the
 *              tortoise), the carapace faces the camera half way, then it lands plastron up.
 *              -1: rolls away: the hands lift the NEAR rim, the plastron faces the camera half way (most readable
 *              when the child is on the camera side).
 *   lift       world px the hands raise the whole tortoise off the ground (default 0); feet dangle when lifted.
 *   paddle     optional 0..1 override of the leg paddling amount (default: from turnOver and lift).
 *   bite       0..1 the strike: the head shoots out to biteTarget (key it 0 -> 1 over 3-4 f, then hold 1). The jaws
 *              open on the way and clamp at 1 with the hand edge between them; the head is still (no sway), the
 *              neck stretched, the eye on the child (pupil turned up and forward). tortoiseBiteKeys() helps.
 *   biteTarget world point for the jaws: the outer edge of the child's hand just below the little finger. Keep it
 *              within tortoiseHead(props).reachPx of the neck base. DRAW THE BITTEN HAND BEHIND THE TORTOISE (render
 *              the hand first): its edge disappears into the mouth.
 *   release    0..1 (with bite still 1): the jaws open (0 -> 0.55), the head draws back a quarter of the way toward
 *              the shell and the mouth closes (-> 1). The hand is free from release 0.3. Afterwards key bite 1 -> 0
 *              (over 8-12 f) to hand the head back to `neck`, then turnAway.
 *   turnAway   0..1 turn on the spot by 180 deg (the scene eases it); the feet step while it turns. Then plod off
 *              with walk/dist (dist continues from where it was; its direction is the new heading).
 *   turnVia    "away" (default: the head swings away from the camera, the shell turns its back) | "toward".
 *
 * ---------------------------------------------------------------------------------------------------------------
 * CONTACT HELPERS (MOT-07): pure functions of the same props, so a hand and the tortoise agree in every frame.
 * ---------------------------------------------------------------------------------------------------------------
 *   tortoiseJawTip(props)  -> {x, y}   the point between the jaws (where the hand edge sits). Equals biteTarget
 *                                     while bite = 1 and release = 0; follows the head during the release.
 *   tortoiseHead(props)    -> { jaw, beak, eye, back, neckBase, angle, reachPx, inFront }
 *   tortoiseGrips(props)   -> { tail, side, sideNear, front }: each { x, y, inFront, out: {x, y} }: world points on
 *                             the shell rim (tail = the rear rim by the tail, side = the rim that lifts in the roll,
 *                             sideNear = the pivot rim, front = the front rim above the head). inFront says whether
 *                             that point faces the camera (draw the hand in front of the tortoise) or is behind it.
 *                             out is the outward rim direction on screen (to orient the hand: fingers wrap over it).
 *   tortoiseAdvance(props, dist) -> {dx, dy}   screen offset for a ground distance along the current heading.
 *   tortoiseAt(x0, y0, dist, props) -> {x, y}  start point + tortoiseAdvance.
 *   tortoiseBiteKeys(f, at, releaseAt?, backAt?) -> { bite, release }: a 4-frame strike at `at`, hold, a 18-frame
 *                             release at `releaseAt`, and the head handed back to `neck` over 10 f from `backAt`.
 *   solveTortoise(props)   the full geometry (advanced).
 *
 * No blood, no wound, no glow, ever.
 */

export type TortoiseView = "side" | "threeQuarter";

export interface TortoiseProps {
  x: number;
  y: number;
  s?: number;
  f?: number;
  lifeF: number;
  view?: TortoiseView;
  flip?: boolean;
  yaw?: number;
  elev?: number;
  variant?: number;
  seed?: number;
  walk?: number;
  dist?: number;
  neck?: number;
  lid?: number;
  turnOver?: number;
  rollDir?: 1 | -1;
  lift?: number;
  paddle?: number;
  bite?: number;
  biteTarget?: Pt;
  release?: number;
  turnAway?: number;
  turnVia?: "away" | "toward";
  opacity?: number;
}

export interface Pt {
  x: number;
  y: number;
}

export interface TortoiseVariant {
  size: number;
  shell: string;
  skin: string;
  fleck: number;
  ring: number;
  dome: number;
  seed: number;
}

export const TORTOISE_VARIANTS: TortoiseVariant[] = [
  { size: 1.0, shell: "#4a4027", skin: "#6c6b4f", fleck: 1.0, ring: 1.0, dome: 1.0, seed: 11 },
  { size: 0.93, shell: "#3d3b27", skin: "#646a4f", fleck: 1.35, ring: 0.8, dome: 0.94, seed: 23 },
  { size: 1.07, shell: "#55462b", skin: "#716a50", fleck: 0.75, ring: 1.25, dome: 1.05, seed: 37 },
  { size: 0.96, shell: "#47412e", skin: "#686850", fleck: 0.55, ring: 1.1, dome: 0.98, seed: 53 },
];

/** px per model unit at s = 1 (the carapace is 100 units long). */
export const TORTOISE_PX_PER_UNIT = 0.6;
/** the standing child rig's px per cm at s = 1 (about 245 px for a 114 cm six-year-old). */
export const TORTOISE_PX_PER_CM = 2.15;
export const tortoiseLengthPx = (s = 1, variant = 0) =>
  100 * TORTOISE_PX_PER_UNIT * s * TORTOISE_VARIANTS[((variant % 4) + 4) % 4].size;

/* ------------------------------------------------------------------ */
/* small math                                                          */
/* ------------------------------------------------------------------ */

type V3 = [number, number, number];
type M3 = [number, number, number, number, number, number, number, number, number];
type D2 = [number, number];

const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mv = (m: M3, v: V3): V3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
const mtv = (m: M3, v: V3): V3 => [
  m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
  m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
  m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
];
const mm = (a: M3, b: M3): M3 => {
  const r = [0, 0, 0, 0, 0, 0, 0, 0, 0] as M3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
};
/** body frame: x forward (head), y = the animal's left, z up. World: X screen right, Y toward the camera, Z up. */
const rotX = (a: number): M3 => [1, 0, 0, 0, Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a)];
/** nose-up pitch */
const rotY = (a: number): M3 => [Math.cos(a), 0, -Math.sin(a), 0, 1, 0, Math.sin(a), 0, Math.cos(a)];
const rotZ = (a: number): M3 => [Math.cos(a), -Math.sin(a), 0, Math.sin(a), Math.cos(a), 0, 0, 0, 1];

const hexRgb = (h: string): V3 => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const k = clamp(t);
  const c = (i: number) => Math.round(lerp(A[i], B[i], k));
  return `rgb(${c(0)},${c(1)},${c(2)})`;
};
const toHex = (rgb: string) => {
  if (rgb.startsWith("#")) return rgb;
  const m = rgb.match(/\d+/g) ?? ["0", "0", "0"];
  return "#" + m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, "0")).join("");
};

const hull = (pts: Pt[]): Pt[] => {
  const p = pts.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (p.length < 3) return p;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const polyD = (pts: Pt[]) =>
  pts.length ? "M" + pts.map((q) => `${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join(" L") + " Z" : "";

/* ------------------------------------------------------------------ */
/* the shell model (units)                                             */
/* ------------------------------------------------------------------ */

const SA = 50; // carapace half length
const SB = 36; // carapace half width
const ZR = 7; // carapace rim height above the plastron (the bridge)
const PA = 44; // plastron half length
const PB = 27; // plastron half width
const RIN = 0.9; // marginal ring inner radius (disk coords)
const STRIDE = 26; // ground travel per gait cycle (units)
const DUTY = 0.72; // share of the cycle a foot is planted (slow diagonal-pair walk)
const HEAD_K = 1.12; // head drawing scale (head ~ 19 u long)
const JAW: D2 = [15.6, 1.95]; // between the jaws, head-local

interface Fleck {
  p: D2;
  r: number;
  a: number;
}
interface Scute {
  pts: D2[];
  c: D2;
  kind: "v" | "c" | "m";
  tone: number;
  flecks: Fleck[];
}
interface PlateScute {
  pts: D2[];
  blot: D2[];
  tone: number;
}
interface ShellPattern {
  scutes: Scute[];
  plate: PlateScute[];
  plateOutline: D2[];
}

const PATTERNS = new Map<string, ShellPattern>();

const segPts = (p: D2, q: D2, n: number): D2[] => {
  const out: D2[] = [];
  for (let i = 0; i < n; i++) out.push([lerp(p[0], q[0], i / n), lerp(p[1], q[1], i / n)]);
  return out;
};
const arcPts = (r: number | ((t: number, k: number) => number), t0: number, t1: number, n: number): D2[] => {
  const out: D2[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const t = lerp(t0, t1, k);
    const rr = typeof r === "number" ? r : r(t, k);
    out.push([rr * Math.cos(t), rr * Math.sin(t)]);
  }
  return out;
};
const plateHW = (x: number) => PB * Math.sqrt(Math.max(0, 1 - (x / PA) ** 2)) * (x > 0 ? 1 - 0.2 * (x / PA) ** 2 : 1);

function buildPattern(seed: number, fleckK: number): ShellPattern {
  const key = `${seed}:${fleckK}`;
  const hit = PATTERNS.get(key);
  if (hit) return hit;
  const rnd = (i: number) => hash(seed * 13.37 + i * 7.11);
  let ri = 0;
  const R = () => rnd(ri++);

  const scutes: Scute[] = [];
  const centroid = (pts: D2[]): D2 => {
    let x = 0;
    let y = 0;
    for (const q of pts) {
      x += q[0];
      y += q[1];
    }
    return [x / pts.length, y / pts.length];
  };
  const flecksFor = (pts: D2[], c: D2, n: number, rBase: number): Fleck[] => {
    const out: Fleck[] = [];
    for (let i = 0; i < n; i++) {
      const v = pts[Math.floor(R() * pts.length) % pts.length];
      const t = 0.15 + R() * 0.7;
      const j = (R() - 0.5) * 0.04;
      out.push({ p: [lerp(c[0], v[0], t) + j, lerp(c[1], v[1], t) - j], r: rBase * (0.55 + R() * 0.8), a: 0.35 + R() * 0.45 });
    }
    return out;
  };
  const push = (pts: D2[], kind: Scute["kind"], nF: number, rF: number) => {
    const c = centroid(pts);
    scutes.push({ pts, c, kind, tone: (R() - 0.5) * 0.16, flecks: flecksFor(pts, c, Math.round(nF * fleckK), rF) });
  };

  // vertebrals (hexagonal, along the midline) and the lateral zigzag they share with the costals
  const w = 0.25 + (R() - 0.5) * 0.03;
  const endX = Math.sqrt(RIN * RIN - (0.8 * w) ** 2);
  const VX = [-endX, -0.5 + (R() - 0.5) * 0.04, -0.17 + (R() - 0.5) * 0.04, 0.16 + (R() - 0.5) * 0.04, 0.49, endX];
  const P = (i: number, s: number): D2 => [VX[i], s * 0.8 * w];
  const M = (i: number, s: number): D2 => [(VX[i] + VX[i + 1]) / 2, s * 1.12 * w];
  const dRear = Math.atan2(0.8 * w, -endX); // ~ pi - delta
  const dFront = Math.atan2(0.8 * w, endX); // small
  for (let i = 0; i < 5; i++) {
    const pts: D2[] = [];
    pts.push(...segPts(P(i, -1), M(i, -1), 5), ...segPts(M(i, -1), P(i + 1, -1), 5));
    if (i === 4) pts.push(...arcPts(RIN, -dFront, dFront, 6));
    else pts.push(...segPts(P(i + 1, -1), P(i + 1, 1), 5));
    pts.push(...segPts(P(i + 1, 1), M(i, 1), 5), ...segPts(M(i, 1), P(i, 1), 5));
    if (i === 0) pts.push(...arcPts(RIN, dRear, 2 * Math.PI - dRear, 6));
    else pts.push(...segPts(P(i, 1), P(i, -1), 5));
    push(pts, "v", 5, 0.8);
  }
  // costals: 4 per side between the zigzag and the marginal ring
  for (const s of [1, -1]) {
    const L: D2[] = [P(0, s), M(0, s), P(1, s), M(1, s), P(2, s), M(2, s), P(3, s), M(3, s), P(4, s), M(4, s), P(5, s)];
    const splits = [
      [0, 3],
      [3, 5],
      [5, 7],
      [7, 10],
    ];
    const ringOf = (q: D2, idx: number): D2 => {
      if (idx === 0 || idx === 10) return q;
      const x = clamp(q[0] * 1.1, -RIN * 0.97, RIN * 0.97);
      return [x, s * Math.sqrt(RIN * RIN - x * x)];
    };
    for (const [a, b] of splits) {
      const pts: D2[] = [];
      for (let k = a; k < b; k++) pts.push(...segPts(L[k], L[k + 1], 5));
      const eEnd = ringOf(L[b], b);
      const eStart = ringOf(L[a], a);
      if (b !== 10) pts.push(...segPts(L[b], eEnd, 6));
      else pts.push(L[b]);
      const t0 = Math.atan2(eEnd[1], eEnd[0]);
      const t1 = Math.atan2(eStart[1], eStart[0]);
      pts.push(...arcPts(RIN, t0, t1, 16));
      if (a !== 0) pts.push(...segPts(eStart, L[a], 6));
      push(pts, "c", 7, 0.85);
    }
  }
  // marginals: 25 around the rim, a seam at the rear midline, the nuchal centred at the front; the rear ones serrated
  const N = 25;
  for (let k = 0; k < N; k++) {
    const t0 = Math.PI + (k * 2 * Math.PI) / N;
    const t1 = Math.PI + ((k + 1) * 2 * Math.PI) / N;
    const rear = (t: number) => clamp(1 - Math.abs(Math.atan2(Math.sin(t - Math.PI), Math.cos(t - Math.PI))) / 1.25);
    const outer = (t: number, kk: number) => 1.015 - 0.035 * rear(t) * (1 - Math.sin(kk * Math.PI));
    const pts: D2[] = [...arcPts(RIN, t0, t1, 6), ...arcPts((t, kk) => outer(t, 1 - kk), t1, t0, 8)];
    push(pts, "m", 2, 0.65);
  }

  // plastron (body x, y in units, z = 0): outline with the narrower front lobe and the rear (anal) notch
  const plateOutline: D2[] = [];
  for (let i = 0; i <= 32; i++) {
    const x = PA - (i / 32) * (2 * PA - 1);
    plateOutline.push([x, plateHW(x)]);
  }
  plateOutline.push([-PA + 4, 0]);
  for (let i = 32; i >= 0; i--) {
    const x = PA - (i / 32) * (2 * PA - 1);
    plateOutline.push([x, -plateHW(x)]);
  }
  const seams = [PA, 34, 23, 7, -13, -29, -PA + 1];
  const plate: PlateScute[] = [];
  for (let i = 0; i < 6; i++) {
    for (const s of [1, -1]) {
      const x0 = seams[i];
      const x1 = seams[i + 1];
      const pts: D2[] = [[x0, 0]];
      for (let k = 0; k <= 4; k++) {
        const x = lerp(x0, x1, k / 4);
        pts.push([x, s * plateHW(x)]);
      }
      pts.push([i === 5 ? -PA + 4 : x1, 0]);
      const cx = lerp(x0, x1, 0.45 + (R() - 0.5) * 0.2);
      const cy = s * plateHW(cx) * (0.42 + (R() - 0.5) * 0.12);
      const rx = Math.abs(x0 - x1) * (0.26 + R() * 0.12);
      const ry = plateHW(cx) * (0.22 + R() * 0.1);
      const blot: D2[] = [];
      for (let k = 0; k < 11; k++) {
        const t = (k / 11) * Math.PI * 2;
        const jr = 0.72 + R() * 0.45;
        blot.push([cx + Math.cos(t) * rx * jr, cy + Math.sin(t) * ry * jr]);
      }
      plate.push({ pts, blot, tone: (R() - 0.5) * 0.1 });
    }
  }

  const pat = { scutes, plate, plateOutline };
  PATTERNS.set(key, pat);
  return pat;
}

/* ------------------------------------------------------------------ */
/* legs                                                                */
/* ------------------------------------------------------------------ */

interface LegDef {
  id: string;
  front: boolean;
  side: 1 | -1;
  root: V3;
  tuck: D2;
  stand: D2;
  phase: number;
  air: number;
}
const LEGS: LegDef[] = [
  { id: "FL", front: true, side: 1, root: [29, 21, 4], tuck: [34, 29], stand: [38, 34], phase: 0, air: 0 },
  { id: "FR", front: true, side: -1, root: [29, -21, 4], tuck: [34, -29], stand: [38, -34], phase: 0.5, air: 0.5 },
  { id: "HL", front: false, side: 1, root: [-29, 19, 4], tuck: [-32, 27], stand: [-35, 31], phase: 0.5, air: 0.5 },
  { id: "HR", front: false, side: -1, root: [-29, -19, 4], tuck: [-32, -27], stand: [-35, -31], phase: 0, air: 0 },
];

/* ------------------------------------------------------------------ */
/* the solver                                                          */
/* ------------------------------------------------------------------ */

interface ShPoly {
  d: string;
  fill: string;
  depth: number;
  rings?: string[];
  ringFill?: string;
  seam: boolean;
  seamCol?: string;
  vis?: number;
  lit?: number;
  flecks?: { x: number; y: number; r: number; a: number }[];
}
interface LegGeom {
  id: string;
  front: boolean;
  inFront: boolean;
  root: Pt;
  knee: Pt;
  foot: Pt;
  footD: string;
  claws: { a: Pt; b: Pt }[];
  scales: Pt[];
}
export interface TortoiseGeom {
  sc: number;
  variant: TortoiseVariant;
  seed: number;
  shadow: { m: [number, number, number, number, number, number]; o: number };
  hull: Pt[];
  hullBox: { x0: number; y0: number; x1: number; y1: number };
  polys: ShPoly[];
  highlight: Pt | null;
  legs: LegGeom[];
  head: {
    mat: [number, number, number, number, number, number];
    back: Pt;
    neckBase: Pt;
    neckCtrl: Pt;
    jaw: Pt;
    beak: Pt;
    eye: Pt;
    angle: number;
    jawDeg: number;
    lidClose: number;
    look: D2;
    throat: number;
    inFront: boolean;
    neckOut: number;
    reachPx: number;
  };
  tail: { inFront: boolean; base1: Pt; base2: Pt; tip: Pt; ctrl: Pt };
  grips: Record<"tail" | "side" | "sideNear" | "front", Grip>;
  skin: { base: string; dark: string; light: string; far: string };
}
export interface Grip {
  x: number;
  y: number;
  inFront: boolean;
  out: Pt;
}

const LIGHT: V3 = norm([-0.55, 0.45, 0.75]);

const resolveYaw = (p: TortoiseProps) => {
  let y0 = p.yaw ?? (p.view === "threeQuarter" ? 35 : 0);
  if (p.flip) y0 = 180 - y0;
  const awaySign = Math.cos((y0 * Math.PI) / 180) >= 0 ? -1 : 1;
  const d = (p.turnVia ?? "away") === "away" ? awaySign : -awaySign;
  return ((y0 + d * 180 * clamp(p.turnAway ?? 0)) * Math.PI) / 180;
};
const resolveElev = (p: TortoiseProps) => ((p.elev ?? (p.view === "threeQuarter" ? 26 : 14)) * Math.PI) / 180;
const resolveScale = (p: TortoiseProps) =>
  TORTOISE_PX_PER_UNIT * (p.s ?? 1) * TORTOISE_VARIANTS[(((p.variant ?? 0) % 4) + 4) % 4].size;

export const tortoiseAdvance = (p: TortoiseProps, dist: number): { dx: number; dy: number } => {
  const yaw = resolveYaw(p);
  const e = resolveElev(p);
  return { dx: Math.cos(yaw) * dist, dy: Math.sin(yaw) * Math.sin(e) * dist };
};
export const tortoiseAt = (x0: number, y0: number, dist: number, p: Omit<TortoiseProps, "x" | "y" | "lifeF"> & { lifeF?: number }) => {
  const a = tortoiseAdvance({ ...p, x: 0, y: 0, lifeF: 0 }, dist);
  return { x: x0 + a.dx, y: y0 + a.dy };
};

/** A 4-frame strike at `at`, hold, an 18-frame release at `releaseAt`, the head handed back over 10 f from `backAt`. */
export const tortoiseBiteKeys = (f: number, at: number, releaseAt = Infinity, backAt = Infinity) => {
  const strike = clamp((f - at) / 4);
  const bite = (1 - Math.pow(1 - strike, 2)) * (1 - inOut(clamp((f - backAt) / 10)));
  const release = inOut(clamp((f - releaseAt) / 18));
  return { bite, release };
};

export function solveTortoise(p: TortoiseProps): TortoiseGeom {
  const vi = (((p.variant ?? 0) % 4) + 4) % 4;
  const V = TORTOISE_VARIANTS[vi];
  const seed = p.seed ?? V.seed;
  const sc = resolveScale(p);
  const SC = 28 * V.dome; // dome height
  const lifeF = p.lifeF;
  const walk = clamp(p.walk ?? 0);
  const neck = clamp(p.neck ?? 0.7);
  const tOver = clamp(p.turnOver ?? 0);
  const rollDir = p.rollDir ?? 1;
  const liftU = (p.lift ?? 0) / sc;
  const bite = clamp(p.bite ?? 0);
  const release = clamp(p.release ?? 0);
  const hold = bite * (1 - sstep(0, 0.5, release));
  const turnAway = clamp(p.turnAway ?? 0);
  const yaw = resolveYaw(p);
  const e = resolveElev(p);
  const ce = Math.cos(e);
  const se = Math.sin(e);
  const V_CAM: V3 = [0, ce, se];
  const pat = buildPattern(seed, V.fleck);

  // gait
  const gp = ((p.dist ?? 0) / sc + turnAway * 40) / STRIDE;
  const rock = walk * Math.sin(2 * Math.PI * gp);
  const rock2 = walk * Math.sin(4 * Math.PI * gp);
  const rate = 0.085 + hash(seed * 1.7) * 0.03;
  const breath = Math.sin(lifeF * rate + noise1(lifeF * 0.01, seed + 2) * 2.5);

  // roll about the body x axis, pivoting on a rim
  const nearSide = Math.cos(yaw) >= 0 ? 1 : -1; // the body side (y sign) facing the camera
  const phi = -nearSide * rollDir * Math.PI * tOver + 0.03 * rock * (1 - tOver);
  const theta = 0.018 * rock2 * (1 - tOver);
  const Rz = rotZ(yaw);
  const R = mm(Rz, mm(rotY(theta), rotX(phi)));

  // shell sample points (body), for the silhouette and the ground contact
  const domeAt = (X: number, Y: number): V3 => [SA * X, SB * Y, ZR + SC * Math.sqrt(Math.max(0, 1 - X * X - Y * Y))];
  const RIM_N = 64; // silhouette samples per ring (smooth at close-up scale)
  const domeN = (X: number, Y: number): V3 => norm([X / SA, Y / SB, Math.sqrt(Math.max(0, 1 - X * X - Y * Y)) / SC]);
  const samples: V3[] = [];
  for (const r of [1, 0.97, 0.93, 0.86, 0.75, 0.6, 0.4, 0.2]) {
    for (let i = 0; i < RIM_N; i++) {
      const t = (i / RIM_N) * Math.PI * 2;
      samples.push(domeAt(r * Math.cos(t), r * Math.sin(t)));
    }
  }
  samples.push(domeAt(0, 0));
  for (const q of pat.plateOutline) samples.push([q[0], q[1], 0]);
  let minZ = Infinity;
  for (const q of samples) minZ = Math.min(minZ, mv(R, q)[2]);
  const hStand = lerp(2, 5.5, walk);
  const upright = 1 - sstep(0, 0.22, tOver);
  const Zoff = Math.max(hStand * upright, -minZ) + liftU + 0.5 * Math.abs(rock2) * (1 - tOver);

  // keep the pivot rim where it was (no slide), then roll a little further onto the dome
  const pivSide = rollDir > 0 ? nearSide : -nearSide;
  const piv: V3 = [0, pivSide * SB, ZR];
  const phiC = Math.sign(phi) * Math.min(Math.abs(phi), Math.PI / 2);
  const p0 = mv(Rz, piv);
  const p1 = mv(mm(Rz, rotX(phiC)), piv);
  const beyond = clamp((Math.abs(phi) - Math.PI / 2) / (Math.PI / 2)) * 16;
  const hl = Math.hypot(p0[0], p0[1]) || 1;
  const O: V3 = [p0[0] - p1[0] + (beyond * p0[0]) / hl, p0[1] - p1[1] + (beyond * p0[1]) / hl, Zoff];

  const W = (v: V3): V3 => add(mv(R, v), O);
  const P2 = (w: V3): Pt => ({ x: p.x + sc * w[0], y: p.y + sc * (-w[2] * ce + w[1] * se) });
  const depth = (w: V3) => w[1] * ce + w[2] * se;
  const proj = (v: V3) => P2(W(v));
  const centerD = depth(W([0, 0, ZR]));

  // colours
  const shellDark = mix(V.shell, "#120e08", 0.6);
  const shellLight = mix(V.shell, "#b0a070", 0.4);
  const shade = (n: V3, tone: number) => {
    const l = 0.22 + 0.78 * Math.max(0, dot(n, LIGHT));
    return mix(toHex(shellDark), toHex(shellLight), clamp(l + tone));
  };

  // contact shadow: the footprint ellipse on the ground under the body
  const sh = clamp(1 - liftU / 60);
  const sx = SA * 1.08;
  const sy = SB * 1.1 * (1 - 0.15 * Math.abs(Math.sin(phi)));
  const gc = { x: p.x + sc * O[0], y: p.y + sc * O[1] * se };
  const cy = Math.cos(yaw);
  const sy_ = Math.sin(yaw);
  const shadowM: [number, number, number, number, number, number] = [
    sc * cy * sx,
    sc * se * sy_ * sx,
    sc * -sy_ * sy,
    sc * se * cy * sy,
    gc.x,
    gc.y,
  ];

  // silhouette
  const hullPts = hull(samples.map(proj));
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const q of hullPts) {
    x0 = Math.min(x0, q.x);
    y0 = Math.min(y0, q.y);
    x1 = Math.max(x1, q.x);
    y1 = Math.max(y1, q.y);
  }

  const polys: ShPoly[] = [];
  // bridge (between the carapace rim and the plastron edge)
  const NB = 64;
  for (let i = 0; i < NB; i++) {
    const t0 = (i / NB) * Math.PI * 2;
    const t1 = ((i + 1) / NB) * Math.PI * 2;
    const a0: V3 = [SA * Math.cos(t0), SB * Math.sin(t0), ZR];
    const a1: V3 = [SA * Math.cos(t1), SB * Math.sin(t1), ZR];
    const b0: V3 = [PA * 0.98 * Math.cos(t0), PB * Math.sin(t0), 0];
    const b1: V3 = [PA * 0.98 * Math.cos(t1), PB * Math.sin(t1), 0];
    const tm = (t0 + t1) / 2;
    const nb = norm(mv(R, [Math.cos(tm) * 0.8, Math.sin(tm), -0.9]));
    if (dot(nb, V_CAM) < -0.1) continue;
    const ws = [a0, a1, b1, b0].map(W);
    const l = 0.2 + 0.55 * Math.max(0, dot(nb, LIGHT));
    polys.push({
      d: polyD(ws.map(P2)),
      fill: mix(toHex(mix(V.shell, "#7d6f3c", 0.45)), "#0e0b06", 0.6 - l * 0.6),
      depth: ws.reduce((s, w) => s + depth(w), 0) / 4 - 0.5,
      seam: false,
    });
  }
  // plastron
  const nPlate = mv(R, [0, 0, -1]);
  const plateVis = dot(nPlate, V_CAM);
  if (plateVis > -0.05) {
    const lp = 0.35 + 0.65 * Math.max(0, dot(nPlate, LIGHT));
    const plateBase = "#dccb8a";
    const pd = depth(W([0, 0, 0]));
    polys.push({
      d: polyD(pat.plateOutline.map((q) => proj([q[0], q[1], 0]))),
      fill: mix("#5e5432", plateBase, lp),
      depth: pd - 0.2,
      seam: false,
    });
    for (const ps of pat.plate) {
      polys.push({
        d: polyD(ps.pts.map((q) => proj([q[0], q[1], 0]))),
        fill: mix("#5e5432", plateBase, clamp(lp + ps.tone)),
        depth: pd - 0.1,
        seam: true,
        seamCol: mix("#4a4026", "#8a7a4a", lp),
        vis: plateVis,
        lit: lp,
      });
      polys.push({
        d: polyD(ps.blot.map((q) => proj([q[0], q[1], 0]))),
        fill: mix("#1c160c", "#4a3e26", lp * 0.6),
        depth: pd,
        seam: false,
      });
    }
  }
  // carapace scutes (painter's order, back-facing ones culled)
  for (const s of pat.scutes) {
    const nW = mv(R, domeN(s.c[0], s.c[1]));
    const vis = dot(nW, V_CAM);
    if (vis < -0.12) continue;
    const ws = s.pts.map((q) => W(domeAt(q[0], q[1])));
    const toneK = s.kind === "m" ? 0.05 : 0;
    const fill = shade(nW, s.tone + toneK);
    const ringScale = [0.68, 0.4];
    const rings = ringScale.map((k) =>
      polyD(s.pts.map((q) => proj(domeAt(s.c[0] + (q[0] - s.c[0]) * k, s.c[1] + (q[1] - s.c[1]) * k)))),
    );
    polys.push({
      d: polyD(ws.map(P2)),
      fill,
      depth: depth(W(domeAt(s.c[0], s.c[1]))),
      rings,
      ringFill: mix(toHex(fill), toHex(shellLight), 0.12 * V.ring),
      seam: true,
      vis,
      lit: Math.max(0, dot(nW, LIGHT)),
      flecks:
        vis > 0.05
          ? s.flecks.map((fl) => {
              const q = proj(domeAt(fl.p[0], fl.p[1]));
              return { x: q.x, y: q.y, r: fl.r * sc * (0.55 + 0.45 * clamp(vis)), a: fl.a * clamp(vis * 2) };
            })
          : undefined,
    });
  }
  polys.sort((a, b) => a.depth - b.depth);

  // specular-ish soft highlight on the dome, toward the light
  const H = norm(add(LIGHT, V_CAM));
  const Hb = mtv(R, H);
  let highlight: Pt | null = null;
  if (Hb[2] > 0.15) {
    const lam = 1 / Math.sqrt(SA * SA * Hb[0] * Hb[0] + SB * SB * Hb[1] * Hb[1] + SC * SC * Hb[2] * Hb[2]);
    highlight = proj([lam * SA * SA * Hb[0], lam * SB * SB * Hb[1], ZR + lam * SC * SC * Hb[2]]);
  }

  // legs
  const skinBase = V.skin;
  const skinDark = mix(V.skin, "#16140c", 0.5);
  const skinLight = mix(V.skin, "#c9c49a", 0.4);
  const skinFar = mix(V.skin, "#16140c", 0.32);
  const airPaddle = p.paddle ?? clamp(sstep(0.35, 0.75, tOver) + 0.7 * Math.sin(Math.PI * tOver) + sstep(4, 20, liftU) * 0.6);
  const ground = clamp(1 - sstep(0.04, 0.3, tOver) - sstep(2, 10, liftU));
  const legs: LegGeom[] = LEGS.map((L) => {
    const ph = (((gp + L.phase) % 1) + 1) % 1;
    const sst = DUTY * STRIDE;
    let fx: number;
    let lift = 0;
    if (ph < DUTY) fx = sst / 2 - (ph / DUTY) * sst;
    else {
      const q = (ph - DUTY) / (1 - DUTY);
      fx = -sst / 2 + inOut(q) * sst;
      lift = Math.sin(Math.PI * q) * 3.5;
    }
    const restX = lerp(L.tuck[0], L.stand[0], walk) + (L.front ? 0.5 * breath : 0);
    const restY = lerp(L.tuck[1], L.stand[1], walk);
    const root: V3 = [L.root[0] + (L.front ? 0.6 * breath : 0), L.root[1], L.root[2]];
    // planted feet track the travelled distance exactly (they never slide, whatever `walk` is)
    const footUp: V3 = [restX + fx, restY, -hStand];
    const wUp = W(footUp);
    wUp[2] = lift * walk;
    const ph2 = lifeF * (0.3 + hash(seed + 3) * 0.06) + L.air * Math.PI * 2 + noise1(lifeF * 0.02, seed + L.phase * 9) * 0.8;
    // in the air the legs reach out past the rim and away from the plastron, paddling in slow ellipses
    const footAir: V3 = [
      L.root[0] + (L.front ? 12 : -10) + Math.cos(ph2) * 7 * airPaddle,
      L.side * (Math.abs(L.root[1]) + 19 + Math.sin(ph2 * 0.5) * 3 * airPaddle),
      -11 + Math.sin(ph2) * 5 * airPaddle,
    ];
    const wFoot = lerp3(W(footAir), wUp, ground);
    const wRoot = W(root);
    const kneeOff = mv(R, [0, L.side * 6.5, 3.2]);
    const wKnee = add(lerp3(wRoot, wFoot, 0.5), kneeOff);
    // foot outline on its own plane
    const dirB: V3 = L.front ? norm([0.55, L.side * 0.83, 0]) : norm([-0.42, L.side * 0.9, 0]);
    let df = mv(R, dirB);
    let ds = mv(R, [-dirB[1], dirB[0], 0]);
    const flat = (v: V3): V3 => norm([v[0], v[1], v[2] * (1 - ground)]);
    df = flat(df);
    ds = flat(ds);
    const fp = (a: number, b: number) => P2(add(wFoot, add(mul(df, a), mul(ds, b))));
    const toes = L.front ? 5 : 4;
    const outline: Pt[] = [fp(-2.8, 0), fp(-2, -3), fp(0.6, -3.4)];
    const claws: { a: Pt; b: Pt }[] = [];
    for (let i = 0; i < toes; i++) {
      const b = lerp(-2.6, 2.6, i / (toes - 1));
      const len = 3.4 + (1 - Math.abs(b) / 2.6) * 0.8;
      outline.push(fp(len, b));
      if (i < toes - 1) outline.push(fp(len - 1.2, b + 2.6 / (toes - 1)));
      claws.push({ a: fp(len - 0.3, b), b: fp(len + 2.2, b * 1.08) });
    }
    outline.push(fp(0.6, 3.4), fp(-2, 3));
    const scales = [0.35, 0.55, 0.75].map((t) => P2(lerp3(wKnee, wFoot, t)));
    return {
      id: L.id,
      front: L.front,
      inFront: depth(wRoot) > centerD,
      root: P2(wRoot),
      knee: P2(wKnee),
      foot: P2(wFoot),
      footD: polyD(outline),
      claws,
      scales,
    };
  });

  // head and neck
  const turned = sstep(0.55, 0.92, tOver);
  const swayK = (1 - hold) * (0.3 + 0.7 * neck);
  const sw = (noise1(lifeF * 0.018, seed) * 0.16 + walk * Math.sin(2 * Math.PI * gp) * 0.07) * swayK;
  const hp = (-0.06 + 0.2 * neck + noise1(lifeF * 0.013, seed + 4) * 0.05 * (1 - hold)) * (1 - turned);
  let dirW = mv(R, [Math.cos(hp) * Math.cos(sw), Math.cos(hp) * Math.sin(sw), Math.sin(hp)]);
  const fwdW = mv(R, [1, 0, 0]);
  const fwdH = norm([fwdW[0], fwdW[1], 0]);
  const latH: V3 = [-fwdH[1], fwdH[0], 0];
  const dirRight = norm(
    add(add(fwdH, [0, 0, -0.5 + 0.22 * Math.sin(lifeF * 0.12 + seed)]), mul(latH, 0.3 * Math.sin(lifeF * 0.07 + seed))),
  );
  dirW = norm(lerp3(dirW, dirRight, turned));
  const nEff = lerp(neck, 0.92 + 0.08 * Math.sin(lifeF * 0.15 + seed), turned);
  const NBw = W([40, 0, 12]);
  const neckLen = -4 + 26 * nEff;
  const backW = add(NBw, mul(dirW, neckLen));
  const B0 = P2(backW);
  const T0 = P2(add(backW, mul(dirW, 17 * HEAD_K)));
  const N2 = P2(NBw);
  let dx = T0.x - B0.x;
  let dy = T0.y - B0.y;
  let len = Math.hypot(dx, dy);
  const fullLen = 17 * HEAD_K * sc;
  if (len < 1e-3) {
    dx = Math.cos(yaw);
    dy = 0;
    len = 1;
  }
  const k0 = Math.max(len / fullLen, 0.5);
  let ux = dx / len;
  let uy = dy / len;
  const headMat = (uxx: number, uyy: number, k: number) => {
    const ks = k * sc * HEAD_K;
    const ss = sc * HEAD_K;
    if (uxx >= 0) return { a: uxx * ks, b: uyy * ks, c: -uyy * ss, d: uxx * ss };
    // mirrored: keep the head upright when it points screen-left
    return { a: uxx * ks, b: uyy * ks, c: uyy * ss, d: -uxx * ss };
  };
  const apply = (m: { a: number; b: number; c: number; d: number }, o: Pt, q: D2): Pt => ({
    x: o.x + m.a * q[0] + m.c * q[1],
    y: o.y + m.b * q[0] + m.d * q[1],
  });
  let m = headMat(ux, uy, k0);
  let back = B0;
  const jaw0 = apply(m, back, JAW);
  if (bite > 0 && p.biteTarget) {
    const T = p.biteTarget;
    const relBack = sstep(0.3, 1, release);
    const Tb = { x: lerp(T.x, T.x + (N2.x - T.x) * 0.25, relBack), y: lerp(T.y, T.y + (N2.y - T.y) * 0.25, relBack) };
    const J = { x: lerp(jaw0.x, Tb.x, bite), y: lerp(jaw0.y, Tb.y, bite) };
    let bx = J.x - N2.x;
    let by = J.y - N2.y;
    const bl = Math.hypot(bx, by) || 1;
    bx /= bl;
    by /= bl;
    ux = lerp(ux, bx, bite * 0.8);
    uy = lerp(uy, by, bite * 0.8);
    const ul = Math.hypot(ux, uy) || 1;
    ux /= ul;
    uy /= ul;
    m = headMat(ux, uy, lerp(k0, Math.max(k0, 0.9), bite));
    const jl = apply(m, { x: 0, y: 0 }, JAW);
    back = { x: J.x - jl.x, y: J.y - jl.y };
  }
  const jaw = apply(m, back, JAW);
  const beak = apply(m, back, [17.1, 0.6]);
  const eye = apply(m, back, [11.2, -1.7]);
  const openStrike = bite < 1 ? Math.sin(Math.PI * bite) : 0;
  const openRel = release < 0.55 ? Math.sin((Math.PI * release) / 0.55) : 0;
  const clampOpen = sstep(0.85, 1, bite) * (1 - sstep(0.05, 0.35, release)) * (1 - sstep(0.6, 1, release));
  const jawDeg = Math.max(30 * openStrike, 30 * openRel, 20 * clampOpen);
  const dd = dirW[1] * ce + dirW[2] * se;
  const angle = (Math.atan2(uy, ux) * 180) / Math.PI;
  const neckCtrl = {
    x: N2.x + (back.x - N2.x) * 0.55 - uy * 0 + (fwdW[0] * sc * 3) * (1 - bite),
    y: N2.y + (back.y - N2.y) * 0.55 - sc * 2.2 * nEff * (1 - bite) * (1 - turned),
  };
  const lidClose = Math.max(blink(lifeF, seed), p.lid ?? 0, (1 - sstep(0.05, 0.3, neck)) * 0.55 * (1 - turned));

  // tail
  const tsw = noise1(lifeF * 0.03, seed + 8) * 3 + walk * Math.sin(2 * Math.PI * gp + 1) * 2.5;
  const tb1 = proj([-46, 2.6, 7]);
  const tb2 = proj([-46, -2.6, 7]);
  const ttip = proj([-58, tsw, 3.5]);
  const tctrl = proj([-53, tsw * 0.5, 6]);
  const rearD = -(fwdW[1] * ce + fwdW[2] * se);

  // rim grips
  const grip = (bp: V3, outB: V3): Grip => {
    const w = W(bp);
    const n = mv(R, outB);
    const q = P2(w);
    const o2 = { x: n[0], y: -n[2] * ce + n[1] * se };
    const ol = Math.hypot(o2.x, o2.y) || 1;
    return { x: q.x, y: q.y, inFront: dot(n, V_CAM) > 0 || depth(w) > centerD + 4, out: { x: o2.x / ol, y: o2.y / ol } };
  };
  const liftSide = rollDir > 0 ? -nearSide : nearSide;
  const grips = {
    tail: grip([-SA * 0.97, 0, ZR + 2.5], [-1, 0, 0.25]),
    side: grip([4, liftSide * SB * 0.99, ZR + 2], [0, liftSide, 0.2]),
    sideNear: grip([4, -liftSide * SB * 0.99, ZR + 2], [0, -liftSide, 0.2]),
    front: grip([SA * 0.97, 0, ZR + 4], [1, 0, 0.3]),
  };

  return {
    sc,
    variant: V,
    seed,
    shadow: { m: shadowM, o: sh },
    hull: hullPts,
    hullBox: { x0, y0, x1, y1 },
    polys,
    highlight,
    legs,
    head: {
      mat: [m.a, m.b, m.c, m.d, back.x, back.y],
      back,
      neckBase: N2,
      neckCtrl,
      jaw,
      beak,
      eye,
      angle,
      jawDeg,
      lidClose,
      look: [0.28 * hold, -0.32 * hold],
      throat: 1 + 0.07 * breath * (1 - hold * 0.6),
      inFront: dd > 0.62 && nEff > 0.25,
      neckOut: nEff,
      reachPx: (22 + 17 * HEAD_K) * sc,
    },
    tail: { inFront: rearD > 0.6, base1: tb1, base2: tb2, tip: ttip, ctrl: tctrl },
    grips,
    skin: { base: skinBase, dark: skinDark, light: skinLight, far: skinFar },
  };
}

export const tortoiseJawTip = (p: TortoiseProps): Pt => solveTortoise(p).head.jaw;
export const tortoiseHead = (p: TortoiseProps) => {
  const h = solveTortoise(p).head;
  return { jaw: h.jaw, beak: h.beak, eye: h.eye, back: h.back, neckBase: h.neckBase, angle: h.angle, reachPx: h.reachPx, inFront: h.inFront };
};
export const tortoiseGrips = (p: TortoiseProps) => solveTortoise(p).grips;

/* ------------------------------------------------------------------ */
/* drawing                                                             */
/* ------------------------------------------------------------------ */

const HEAD_D =
  "M -1.2 -4.3 C 2 -5.6 7 -5.7 10.5 -4.5 C 13.6 -3.5 15.9 -1.9 16.9 -0.2 C 17.4 0.5 17.3 1.3 16.7 1.95 C 16.2 2.35 15.6 2.05 15.1 1.75 L 9.2 1.55 C 8.7 3.3 6.4 4.6 2.6 4.8 C 0.4 4.9 -1.6 4.5 -2.6 3.4 C -3.4 1.4 -3.3 -2.6 -1.2 -4.3 Z";
const LOWER_JAW_D = "M 8.4 1.5 L 15.0 1.8 C 15.7 2.0 15.6 2.8 14.8 3.2 C 13.2 4.0 10.6 4.4 8.0 4.2 C 7.0 3.6 7.4 2.2 8.4 1.5 Z";
const THROAT_D = "M -2 2.7 C 2 2.9 5.5 2.5 8.4 2.6 C 7.8 3.9 5.8 4.7 2.6 4.85 C 0.4 4.95 -1.4 4.5 -2.3 3.6 Z";
const BEAK_D = "M 14.6 -1.5 C 16 -0.9 17 0 17.15 0.6 C 17.3 1.3 16.7 2.25 15.7 2.05 L 15.1 1.75 L 14.2 1.6 C 14.6 0.6 14.7 -0.4 14.6 -1.5 Z";
const HEAD_SPOTS: [number, number, number, number][] = [
  [3.0, -2.7, 0.95, 0.62],
  [5.7, -1.0, 0.8, 0.55],
  [2.2, 0.5, 0.75, 0.5],
  [7.2, -3.5, 0.62, 0.42],
  [8.3, 0.35, 0.55, 0.4],
  [13.3, -0.5, 0.45, 0.34],
  [0.4, -1.6, 0.6, 0.45],
  [5.0, 1.6, 0.5, 0.36],
];

const Head: React.FC<{ g: TortoiseGeom; id: string }> = ({ g, id }) => {
  const h = g.head;
  const sk = g.skin;
  const [a, b, c, d, e, f] = h.mat;
  const hinge: D2 = [8.6, 1.6];
  const lid = clamp(h.lidClose);
  const ex = 11.2;
  const ey = -1.7;
  const er = 1.3;
  return (
    <g transform={`matrix(${a} ${b} ${c} ${d} ${e} ${f})`}>
      <defs>
        <linearGradient id={`${id}-hg`} x1={0} y1={-5.7} x2={0} y2={5} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={toHex(sk.light)} />
          <stop offset={0.45} stopColor={sk.base} />
          <stop offset={1} stopColor={toHex(sk.dark)} />
        </linearGradient>
        <clipPath id={`${id}-eye`}>
          <circle cx={ex} cy={ey} r={er} />
        </clipPath>
        <clipPath id={`${id}-hc`}>
          <path d={HEAD_D} />
        </clipPath>
      </defs>
      {/* the lower jaw on its hinge (the throat is part of the head, below) */}
      <path d={`M ${hinge[0]} ${hinge[1]} L 15.3 1.8 L ${rotPt([15.0, 1.8], hinge, h.jawDeg)} Z`} fill="#3e3734" />
      <g transform={`rotate(${h.jawDeg} ${hinge[0]} ${hinge[1]})`}>
        <path d={LOWER_JAW_D} fill={mix(sk.base, "#bdb27a", 0.28)} />
      </g>
      <path d={HEAD_D} fill={`url(#${id}-hg)`} />
      <g clipPath={`url(#${id}-hc)`}>
        <g transform={`translate(0 2.7) scale(1 ${h.throat}) translate(0 -2.7)`}>
          <path d={THROAT_D} fill={mix(sk.base, "#c2b67e", 0.3)} opacity={0.85} />
        </g>
        <path d={BEAK_D} fill="#3f3d2e" opacity={0.5} />
        <path d="M 9.3 1.5 L 15.1 1.72 C 15.6 2.0 16.2 2.3 16.7 1.95" stroke="#2a281c" strokeWidth={0.4} fill="none" opacity={0.75} />
        {HEAD_SPOTS.map(([x, y, rx, ry], i) => (
          <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill="#d6c05a" opacity={0.75} transform={`rotate(${-12 + i * 9} ${x} ${y})`} />
        ))}
        <ellipse cx={6} cy={-4.4} rx={6} ry={1.4} fill="#fff6d0" opacity={0.12} />
        <ellipse cx={ex - 0.2} cy={ey - 0.1} rx={2.1} ry={1.85} fill={toHex(sk.dark)} opacity={0.35} />
      </g>
      {/* eye: dark iris with a thin olive-gold ring, round pupil, one catchlight, and the skin lid that blinks */}
      <circle cx={ex} cy={ey} r={er} fill="#6a5a2c" />
      <circle cx={ex + h.look[0] * 0.5} cy={ey + h.look[1] * 0.5} r={er * 0.8} fill="#1f1a10" />
      <circle cx={ex + h.look[0]} cy={ey + h.look[1]} r={er * 0.5} fill="#050403" />
      <circle cx={ex - 0.42} cy={ey - 0.45} r={0.32} fill="#fff8ea" opacity={0.85} />
      <g clipPath={`url(#${id}-eye)`}>
        <rect x={ex - er - 0.2} y={ey - er - 0.3} width={2 * er + 0.4} height={0.3 + 2 * er * lid} fill={sk.base} />
        <rect x={ex - er - 0.2} y={ey + er - 2 * er * lid * 0.25} width={2 * er + 0.4} height={2 * er * lid * 0.25 + 0.2} fill={sk.base} />
      </g>
      <path d={`M ${ex - 1.6} ${ey - 1.5} Q ${ex} ${ey - 2.4} ${ex + 1.7} ${ey - 1.4}`} stroke={toHex(sk.dark)} strokeWidth={0.4} fill="none" opacity={0.45} />
      <circle cx={16.35} cy={-0.45} r={0.28} fill="#1c1a12" />
    </g>
  );
};

const rotPt = (q: D2, o: D2, deg: number) => {
  const r = (deg * Math.PI) / 180;
  const x = o[0] + (q[0] - o[0]) * Math.cos(r) - (q[1] - o[1]) * Math.sin(r);
  const y = o[1] + (q[0] - o[0]) * Math.sin(r) + (q[1] - o[1]) * Math.cos(r);
  return `${x} ${y}`;
};

const Neck: React.FC<{ g: TortoiseGeom }> = ({ g }) => {
  const h = g.head;
  const sc = g.sc;
  const d = `M ${h.neckBase.x} ${h.neckBase.y} Q ${h.neckCtrl.x} ${h.neckCtrl.y} ${h.back.x} ${h.back.y}`;
  const wN = 8.6 * sc * HEAD_K;
  const qp = (t: number): Pt => ({
    x: (1 - t) * (1 - t) * h.neckBase.x + 2 * (1 - t) * t * h.neckCtrl.x + t * t * h.back.x,
    y: (1 - t) * (1 - t) * h.neckBase.y + 2 * (1 - t) * t * h.neckCtrl.y + t * t * h.back.y,
  });
  const folds = [0.3, 0.5].map((t) => {
    const a = qp(t - 0.02);
    const b = qp(t + 0.02);
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    // the normal that points up on screen (folds sit on the top and side of the neck only)
    let nx = -ty / tl;
    let ny = tx / tl;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const c = qp(t);
    const r = wN * 0.44;
    return `M ${c.x + nx * r * 0.05} ${c.y + ny * r * 0.05} Q ${c.x + nx * r * 0.6 - (tx / tl) * r * 0.35} ${c.y + ny * r * 0.6 - (ty / tl) * r * 0.35} ${c.x + nx * r} ${c.y + ny * r}`;
  });
  const spots = [0.62, 0.8].map((t) => qp(t));
  return (
    <g>
      <path d={d} stroke={g.skin.base} strokeWidth={wN} strokeLinecap="round" fill="none" />
      <path d={d} stroke={mix(g.skin.base, "#c4b67c", 0.22)} strokeWidth={wN * 0.4} strokeLinecap="round" fill="none" transform={`translate(0 ${wN * 0.26})`} opacity={0.8} />
      <path d={d} stroke={toHex(g.skin.light)} strokeWidth={wN * 0.26} strokeLinecap="round" fill="none" transform={`translate(${-wN * 0.06} ${-wN * 0.24})`} opacity={0.3} />
      {folds.map((fd, i) => (
        <path key={i} d={fd} stroke={toHex(g.skin.dark)} strokeWidth={sc * 0.5} strokeLinecap="round" fill="none" opacity={0.18 + 0.2 * (1 - h.neckOut)} />
      ))}
      {spots.map((q, i) => (
        <ellipse key={i} cx={q.x} cy={q.y - wN * 0.12} rx={wN * 0.09} ry={wN * 0.065} fill="#d6c05a" opacity={0.6} />
      ))}
    </g>
  );
};

const Leg: React.FC<{ g: TortoiseGeom; L: LegGeom }> = ({ g, L }) => {
  const sc = g.sc;
  const col = L.inFront ? g.skin.base : toHex(g.skin.far);
  const wU = (L.front ? 7.6 : 8.6) * sc;
  const wL = (L.front ? 6.0 : 6.6) * sc;
  const up = `M ${L.root.x} ${L.root.y} L ${L.knee.x} ${L.knee.y}`;
  const lo = `M ${L.knee.x} ${L.knee.y} L ${L.foot.x} ${L.foot.y}`;
  return (
    <g>
      <path d={up} stroke={col} strokeWidth={wU} strokeLinecap="round" fill="none" />
      <path d={L.footD} fill={mix(toHex(col), "#16140c", 0.12)} />
      <path d={lo} stroke={col} strokeWidth={wL} strokeLinecap="round" fill="none" />
      <path d={lo} stroke={toHex(g.skin.light)} strokeWidth={wL * 0.35} strokeLinecap="round" fill="none" opacity={L.inFront ? 0.3 : 0.12} transform={`translate(${-wL * 0.12} ${-wL * 0.18})`} />
      {L.front &&
        L.scales.map((q, i) => <ellipse key={i} cx={q.x - wL * 0.1} cy={q.y - wL * 0.1} rx={wL * 0.22} ry={wL * 0.14} fill="#cfc28a" opacity={L.inFront ? 0.35 : 0.15} />)}
      {L.claws.map((c, i) => (
        <path
          key={i}
          d={`M ${c.a.x} ${c.a.y} L ${c.b.x} ${c.b.y}`}
          stroke={L.inFront ? "#3a3326" : "#2a251b"}
          strokeWidth={Math.max(0.35, sc * 0.9)}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </g>
  );
};

const Tail: React.FC<{ g: TortoiseGeom }> = ({ g }) => {
  const t = g.tail;
  return (
    <path
      d={`M ${t.base1.x} ${t.base1.y} Q ${t.ctrl.x} ${t.ctrl.y} ${t.tip.x} ${t.tip.y} Q ${t.ctrl.x} ${t.ctrl.y + g.sc} ${t.base2.x} ${t.base2.y} Z`}
      fill={toHex(g.skin.far)}
      stroke={toHex(g.skin.far)}
      strokeWidth={g.sc * 1.6}
      strokeLinejoin="round"
    />
  );
};

/** closed Catmull-Rom spline through the silhouette points: a smooth dome and rim at any scale */
const smoothD = (raw: Pt[]) => {
  // drop near-duplicate points (they make the spline loop at sharp rim corners)
  const pts: Pt[] = [];
  for (const q of raw) {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(q.x - last.x, q.y - last.y) > 0.6) pts.push(q);
  }
  while (pts.length > 3 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) <= 0.6) pts.pop();
  const n = pts.length;
  if (n < 3) return polyD(pts);
  const q = (i: number) => pts[((i % n) + n) % n];
  // handles capped at a third of their own segment, so the curve never overshoots a corner
  const handle = (ax: number, ay: number, segLen: number) => {
    const l = Math.hypot(ax, ay);
    const k = l > segLen / 3 && l > 0 ? segLen / 3 / l : 1;
    return { x: ax * k, y: ay * k };
  };
  let d = `M ${q(0).x.toFixed(2)} ${q(0).y.toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = q(i - 1);
    const p1 = q(i);
    const p2 = q(i + 1);
    const p3 = q(i + 2);
    const seg = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const h1 = handle((p2.x - p0.x) / 6, (p2.y - p0.y) / 6, seg);
    const h2 = handle((p3.x - p1.x) / 6, (p3.y - p1.y) / 6, seg);
    d += ` C ${(p1.x + h1.x).toFixed(2)} ${(p1.y + h1.y).toFixed(2)} ${(p2.x - h2.x).toFixed(2)} ${(p2.y - h2.y).toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d + " Z";
};

const Shell: React.FC<{ g: TortoiseGeom; id: string }> = ({ g, id }) => {
  const sc = g.sc;
  const hd = smoothD(g.hull);
  const bx = g.hullBox;
  // seams are grooves, not outlines: narrow, warm dark olive, a faint lit lip on the upper side, fading toward the light
  const grooveCol = mix(g.variant.shell, "#1c1508", 0.42);
  const lipCol = mix(g.variant.shell, "#c8b888", 0.35);
  const wSeam = Math.max(0.28, 0.3 * sc);
  const lipOff = Math.max(0.25, 0.28 * sc);
  const seamPolys = g.polys.filter((q) => q.seam && (q.vis ?? 1) > 0.02);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-hull`}>
          <path d={hd} />
        </clipPath>
        <linearGradient id={`${id}-form`} gradientUnits="userSpaceOnUse" x1={bx.x0} y1={bx.y0} x2={bx.x1} y2={bx.y1}>
          <stop offset={0} stopColor="#fff3cf" stopOpacity={0.1} />
          <stop offset={0.45} stopColor="#000" stopOpacity={0} />
          <stop offset={1} stopColor="#000" stopOpacity={0.3} />
        </linearGradient>
        <radialGradient id={`${id}-spec`}>
          <stop offset={0} stopColor="#fff6d8" stopOpacity={0.22} />
          <stop offset={1} stopColor="#fff6d8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={hd} fill={mix(g.variant.shell, "#0b0905", 0.32)} />
      <g clipPath={`url(#${id}-hull)`}>
        {g.polys.map((q, i) => (
          <g key={i}>
            <path d={q.d} fill={q.fill} stroke={q.fill} strokeWidth={0.35 * sc} strokeLinejoin="round" />
            {q.rings && (
              <>
                <path d={q.rings[0]} fill="none" stroke={grooveCol} strokeWidth={Math.max(0.18, 0.2 * sc)} opacity={0.3 * g.variant.ring * (1 - 0.4 * (q.lit ?? 0))} />
                <path d={q.rings[1]} fill={q.ringFill} stroke={grooveCol} strokeWidth={Math.max(0.18, 0.18 * sc)} strokeOpacity={0.25 * g.variant.ring * (1 - 0.4 * (q.lit ?? 0))} />
              </>
            )}
            {q.flecks?.map((fl, j) => <circle key={j} cx={fl.x} cy={fl.y} r={fl.r} fill="#cdb75c" opacity={fl.a} />)}
          </g>
        ))}
        {/* seam pass: the lit lip just above the groove, then the groove itself */}
        {seamPolys.map((q, i) => (
          <path
            key={`l${i}`}
            d={q.d}
            fill="none"
            stroke={q.seamCol ? mix(toHex(q.seamCol), "#fff4d6", 0.5) : lipCol}
            strokeWidth={wSeam * 0.8}
            strokeLinejoin="round"
            transform={`translate(${-lipOff * 0.45} ${-lipOff})`}
            opacity={0.22 * clamp(q.vis ?? 1, 0, 1)}
          />
        ))}
        {seamPolys.map((q, i) => (
          <path
            key={`s${i}`}
            d={q.d}
            fill="none"
            stroke={q.seamCol ?? grooveCol}
            strokeWidth={wSeam}
            strokeLinejoin="round"
            opacity={(0.72 - 0.32 * (q.lit ?? 0)) * clamp(0.4 + (q.vis ?? 1), 0, 1)}
          />
        ))}
        <rect x={bx.x0 - 2} y={bx.y0 - 2} width={bx.x1 - bx.x0 + 4} height={bx.y1 - bx.y0 + 4} fill={`url(#${id}-form)`} />
        {g.highlight && <circle cx={g.highlight.x} cy={g.highlight.y} r={24 * sc} fill={`url(#${id}-spec)`} />}
      </g>
    </g>
  );
};

export const Tortoise: React.FC<TortoiseProps> = (props) => {
  const id = "tt" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const g = solveTortoise(props);
  const back = g.legs.filter((l) => !l.inFront);
  const front = g.legs.filter((l) => l.inFront);
  const headEl = (
    <g>
      <Neck g={g} />
      <Head g={g} id={id} />
    </g>
  );
  return (
    <g opacity={props.opacity ?? 1}>
      <defs>
        <radialGradient id={`${id}-sh`}>
          <stop offset={0} stopColor="#22180c" stopOpacity={0.42} />
          <stop offset={0.6} stopColor="#22180c" stopOpacity={0.22} />
          <stop offset={1} stopColor="#22180c" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={1} fill={`url(#${id}-sh)`} transform={`matrix(${g.shadow.m.join(" ")})`} opacity={g.shadow.o} />
      {back.map((l) => (
        <Leg key={l.id} g={g} L={l} />
      ))}
      {!g.tail.inFront && <Tail g={g} />}
      {!g.head.inFront && headEl}
      <Shell g={g} id={id} />
      {front.map((l) => (
        <Leg key={l.id} g={g} L={l} />
      ))}
      {g.tail.inFront && <Tail g={g} />}
      {g.head.inFront && headEl}
    </g>
  );
};
