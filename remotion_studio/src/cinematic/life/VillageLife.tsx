import React, { useId } from "react";
import { blink, clamp, hash, lerp, noise1, safeId } from "../core/anim";
import { walkPose, type Pose, type PropRenderer, type WalkOpts } from "../rig/Puppet";

/**
 * VILLAGE LIFE (Episode 6 immersive re-cut, STO-22a, plan "Village life"): small reusable everyday-life pieces for the
 * Ujanchar lane, courtyard and field. Painted like the Ujanchar cow (UjancharHouse.tsx) and the Episode 5 tortoise:
 * borderless shapes, soft form gradients with the light from the upper left, a soft contact shadow on the ground, no
 * outlines, NO glow (BAL-05). Realistic and readable (ANI-01).
 *
 *   Hen, Chick, HenFamily   W1 (a hen and chicks cross the lane), K1 (the hens scatter at the khadam's clack)
 *   Crow                    K1 (perched on the fence, caws, lifts off cawing)
 *   Sparrow                 G1 (hops close and pecks at a grain by the plates)
 *   Goat                    W2 (tethered by a rope to a peg at the field's edge, chewing, a bleat)
 *   Kite                    W2 (a paper ghuri tugging high over the mango trees, its string trailing out of frame)
 *   Kolshi (+ helpers)      W2 (a woman passing with a brass water pot on her hip: CAST adult Puppet + kolshiProp)
 *   (The dog in D1 is sound only.)
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SCALE AND PLACEMENT (every piece)
 * ---------------------------------------------------------------------------------------------------------------
 *   Everything is modelled in centimetres. At s = 1 one cm is VILLAGE_LIFE_PX_PER_CM = 2.3 px, which is the scale of an
 *   adult Puppet at scale K = 1 (Surendra about 375 px for about 160 cm) and of Episode 6's standing Balak at
 *   StandingChild s = 0.51 (EP06_CHILD_SCALE): give an animal the SAME s as the adult Puppet scale K at its depth and it is
 *   to scale with the cast. Sizes at s = 1: hen 90 px tall, chick 20 px, crow (perched) 55 px tall / 92 px long, sparrow
 *   34 px long, goat 165 px to the horn tips (shoulder 115 px), kolshi 80 px tall, kite 125 px tall (kites use their own
 *   s: high in the sky about 0.3 to 0.6). VILLAGE_LIFE_SIZES has them all (cm) with anchor notes.
 *   x, y   the ground point under the animal's feet (world px; for the crow the perch point under its feet, for the kite
 *          the kite's centre, for the kolshi the middle of its base).
 *   flip   faces screen left (all face screen right by default). Path-driven pieces turn to their travel direction.
 *
 * CLOCKS (PIT-03): every piece runs on `lifeF` (the real frame) so it keeps living in a pause, and ALL action timing props
 *   (scatterAt, takeOffAt, cawAt, peckAt, hopAt, bleatAt, tugAt, path keys ...) are frames on that SAME real clock, so an
 *   animal never freezes mid-flight in a pause. To key an action to a narration cue or a pause beat, pass the cue's REAL
 *   frame (story and real frames agree until the scene's first pause; after a pause add its frames).
 *   Without explicit keys the animals keep a gentle deterministic idle (auto pecks, glances, chewing, kite tugs) seeded
 *   by `seed`; scenes can switch the autos off (autoPeck, autoLook, autoTug ... = false) to own every beat.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * HEN (মুরগি) and CHICKS
 * ---------------------------------------------------------------------------------------------------------------
 * <Hen x y s flip lifeF seed variant path peckAt cluckAt autoPeck autoCluck scatterAt scatterDir scatterDist scatterDy />
 *   A desi village hen (variant 0 rust-brown, 1 black with copper hackles, 2 pale buff), side profile, about 40 cm.
 *   path       LifePathKey[] { f, x, y?, ease? }: where she walks on lifeF (world ground points). While moving she walks
 *              (legs driven by the distance: planted feet do not slide) with the hen's head bob (the head holds still in
 *              the air, then thrusts forward each step). A calm walk is about 1.6 cm/f: 3.7 px/f at s = 1.
 *   peckAt     lifeF frames of a peck (head down to the ground, about 12 f). autoPeck (default true) pecks now and then
 *              while she stands.  cluckAt: a cluck (head up, the beak opening twice, hackles puffed, about 20 f);
 *              autoCluck (default true) adds an occasional one.
 *   scatterAt  the startle: she jumps, both wings flap and she runs off fast (about 13 cm/f) toward scatterDir (+1 right /
 *              -1 left, default the way she faces; she turns at once if it is the other way), drifting scatterDy px down
 *              (+) or up (-) the screen per 100 px run. scatterDist (px, optional) makes her stop there and settle (behind
 *              a bush, a fence); without it she keeps running out of frame.
 *   solveHen(props) -> { x, y, facing, walk, run, head, beak, ... } (world points, for contact and cutting).
 * <Chick ... />  one chick (variant 0 yellow, 1 brown striped, 2 dark), explicit state props (walk, gait, peck, cheep,
 *              flap) or its own idle.
 * <HenFamily {...HenProps} chicks={5} spread? />  a hen with 4-6 chicks that follow her path a few frames behind her,
 *              wander and peck around her, and scatter with her (each a few frames later, running after her).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * CROW (কাক)
 * ---------------------------------------------------------------------------------------------------------------
 * <Crow x y s flip lifeF seed cawAt lookAt autoLook takeOffAt takeOffDir />
 *   An Indian house crow (grey nape and breast, glossy black body), perched with its feet on (x, y): put (x, y) on the
 *   fence rail's top edge. Idle: jerky small head moves, a tail bob, glances (lookAt / autoLook: the head snaps round to
 *   look back for about 30 f). cawAt: each a caw (the head thrusts forward and down, the beak opens wide, the tail flicks
 *   up; CROW_CAW_LEN = 12 f; sync the caw SFX to cawAt + 2).
 *   takeOffAt: a 4-frame crouch, then the leap; the wings beat (about 3.4 a second) and it climbs away toward takeOffDir
 *   (+1 / -1, default the way it faces), out of a 1920 frame within about 45 f at s = 1. A caw keyed at takeOffAt + 6
 *   is a caw in flight ("lifts off cawing"). solveCrow(props) -> { x, y, flying, gone, beak, ... }.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SPARROW (চড়ুই)
 * ---------------------------------------------------------------------------------------------------------------
 * <Sparrow x y s flip lifeF seed hopAt hopLen peckAt tiltAt flutterAt auto grain />
 *   A male house sparrow (grey crown, chestnut nape, black bib), 15 cm. hopAt: two-footed hops (5 f each, hopLen cm,
 *   default 6; negative hops backwards) that move it from x; peckAt: quick pecks to the ground in front (about 7 f);
 *   tiltAt: a curious head tilt (about 18 f); flutterAt: a short flutter (wings a blur, up about 6 cm and down, 12 f).
 *   auto (default true while no keys are given) keeps a little idle of pecks, tilts and back-and-forth hops.
 *   grain: draws a rice grain where the beak lands (true, or { x } world px); sparrowBeakTip(props) gives the point.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * GOAT (ছাগল)
 * ---------------------------------------------------------------------------------------------------------------
 * <Goat x y s flip lifeF seed coat peg ropeLen bleatAt graze chew />
 *   A Black Bengal goat (coat "black" default, "brown", "white"), standing side on, chewing the cud (jaw on lifeF), ear
 *   flicks and quick tail wags. bleatAt: the head lifts, the mouth opens with the bleat's tremble (GOAT_BLEAT_LEN = 34 f;
 *   sync the bleat SFX to bleatAt + 5). graze 0..1 lowers the head to the grass (ease it). peg: world point of the
 *   tether peg (default in front of her on the ground; false = no rope); ropeLen px (default 1.3 x the distance): a jute
 *   rope from her collar to the peg, sagging to the ground. solveGoat(props) -> { collar, peg, mouth, ... }.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * KITE (ঘুড়ি)
 * ---------------------------------------------------------------------------------------------------------------
 * <Kite x y s lifeF seed wind tugAt autoTug stringTo colors streamer />
 *   A Bengali paper ghuri: a diamond on a bamboo spine and bow (seen through the paper against the sky), two-colour
 *   halves with a crown patch, a small triangular paper tail (lej) and a short paper streamer (streamer = false: lej
 *   only). It sways and drifts in the wind (wind 0..1, default 0.6) and tugs (tugAt, autoTug default true): a dip
 *   toward the flyer with a nose pitch, then it climbs back, the string tightening. stringTo: world point the string
 *   runs to (default far below and to the left, out of frame); it sags in a long curve.
 *   kiteBridle(props) -> world point where the string meets the kite.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * KOLSHI (কলসি), brass water pot
 * ---------------------------------------------------------------------------------------------------------------
 * <Kolshi x y s flip rot shadow wet />  34 cm tall, 34 cm across the belly; (x, y) the middle of its base on the ground.
 *   rot: degrees about the base (a pot set down tilted, or one held). KOLSHI_ANCHORS (cm, pot local) for hands.
 * Carried on a woman's hip by a CAST adult Puppet: the Puppet has no hip-carry channel, so the pot rides the near
 * (left) hand as a Puppet prop: the forearm lies across the pot's shoulder and the hand rests on its mouth, the belly
 * at her hip.
 *   <Puppet cast={CAST.womanB} ... props={KOLSHI_PUPPET_PROPS} acting={(f) => ({ ...kolshiWalkPose(f, walkOpts) })} />
 *   kolshiWalkPose(f, WalkOpts)  walkPose with the left arm carrying (lProp "kolshi", lHand "hold", the arm bent round
 *                                the pot; it swings only a little). Standing: KOLSHI_CARRY_POSE (or kolshiCarryPose(-1)
 *                                for a figure turned to screen left in figure space, i.e. bodyTurn < 0).
 *   kolshiProp / makeKolshiProp({ facing }) the prop renderer (facing -1 when bodyTurn < 0); the pot is drawn upright
 *                                whatever the arm does.
 */

/* ================================================================== */
/* shared                                                              */
/* ================================================================== */

/** px per cm at s = 1 (= the adult Puppet at scale 1, Episode 6 standing Balak at StandingChild s 0.51). */
export const VILLAGE_LIFE_PX_PER_CM = 2.3;
const PX = VILLAGE_LIFE_PX_PER_CM;

/** Real sizes (cm) and anchors of every piece. Multiply by VILLAGE_LIFE_PX_PER_CM * s for px. */
export const VILLAGE_LIFE_SIZES = {
  hen: { height: 39, length: 40, anchor: "ground point under the feet" },
  chick: { height: 8.5, length: 9, anchor: "ground point under the feet" },
  crow: { height: 24, length: 40, wingspan: 76, anchor: "perch point under the feet (fence rail top)" },
  sparrow: { height: 9, length: 15, anchor: "ground point under the feet" },
  goat: { height: 72, shoulder: 50, length: 82, anchor: "ground point under the middle of the barrel" },
  kite: { height: 54, width: 46, anchor: "the kite's centre (where spine and bow cross); string from kiteBridle()" },
  kolshi: { height: 35, width: 34, anchor: "middle of the base" },
} as const;

type Pt = { x: number; y: number };
export type LifePoint = Pt;

const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const inOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const frac = (v: number) => v - Math.floor(v);

/** 0 before a; rises over `rise`, holds `hold`, falls over `fall`. */
const env = (t: number, a: number, rise: number, hold: number, fall: number) => {
  if (t < a) return 0;
  if (t < a + rise) return sstep(0, 1, (t - a) / rise);
  if (t < a + rise + hold) return 1;
  return 1 - sstep(0, 1, (t - a - rise - hold) / Math.max(1, fall));
};
/** The latest key <= t (or -Infinity). */
const lastAt = (t: number, list?: number[]) => {
  let best = -Infinity;
  for (const a of list ?? []) if (a <= t && a > best) best = a;
  return best;
};
/** Deterministic idle events: one per `period` bucket (with probability `prob`); the latest start <= t, or -Infinity. */
const bucketEvent = (t: number, period: number, seed: number, prob = 1) => {
  const k0 = Math.floor(t / period);
  for (let k = k0; k >= k0 - 1; k--) {
    if (hash(k * 7.31 + seed * 3.7) > prob) continue;
    const at = k * period + Math.floor(hash(k * 1.97 + seed * 11.3) * period * 0.55);
    if (at <= t) return at;
  }
  return -Infinity;
};
/** Small jerky moves (birds): a new random offset every `period` frames, snapped to over 2.5 frames. */
const jerk = (t: number, seed: number, period: number, amp: number) => {
  const k = Math.floor(t / period);
  const v = (i: number) => (hash(i * 3.71 + seed * 9.1) - 0.5) * 2 * amp;
  return lerp(v(k - 1), v(k), sstep(0, 2.5, t - k * period));
};
const rotPt = (p: Pt, a: number, o: Pt): Pt => {
  const r = (a * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: o.x + (p.x - o.x) * c - (p.y - o.y) * s, y: o.y + (p.x - o.x) * s + (p.y - o.y) * c };
};
const SHADOW = "#2a1a0c";

/* ---------------- paths on the life clock ---------------- */

export interface LifePathKey {
  /** lifeF frame this position is reached. */
  f: number;
  /** World ground point (px). y inherits the previous key's when absent. */
  x: number;
  y?: number;
  /** Ease of the segment ARRIVING at this key (default "inOut"). */
  ease?: "inOut" | "linear" | "in" | "out";
}
const PATH_EASE = {
  inOut,
  linear: (t: number) => t,
  in: (t: number) => t * t,
  out: (t: number) => 1 - (1 - t) * (1 - t),
};

/** Position on a life path at t, the ground distance travelled so far (px) and the travel direction (+1 / -1). */
export const lifePathAt = (path: LifePathKey[], t: number) => {
  if (!path.length) return { x: 0, y: 0, dist: 0, dirX: 1 };
  let yp = path[0].y ?? 0;
  const ys = path.map((k) => (yp = k.y ?? yp));
  let firstDir = 0;
  for (let i = 0; i < path.length - 1 && !firstDir; i++) firstDir = Math.sign(path[i + 1].x - path[i].x);
  if (t <= path[0].f) return { x: path[0].x, y: ys[0], dist: 0, dirX: firstDir || 1 };
  let dist = 0;
  let dirX = firstDir || 1;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const len = Math.hypot(b.x - a.x, ys[i + 1] - ys[i]);
    const sd = Math.sign(b.x - a.x);
    if (t <= b.f) {
      const u = PATH_EASE[b.ease ?? "inOut"](clamp((t - a.f) / Math.max(1, b.f - a.f)));
      return { x: lerp(a.x, b.x, u), y: lerp(ys[i], ys[i + 1], u), dist: dist + len * u, dirX: sd || dirX };
    }
    dist += len;
    if (sd) dirX = sd;
  }
  const n = path.length - 1;
  return { x: path[n].x, y: ys[n], dist, dirX };
};

/* ---------------- a bird's wing seen from the side (flapping) ---------------- */

/**
 * A spread wing seen from the side while it beats: the wing's planform (chord along the body, span up) squashed by
 * k = the projection of the span on the screen (+1 straight up, 0 edge on, -1 straight down). Origin = the shoulder.
 */
const SideWing: React.FC<{ chord: number; span: number; k: number; fill: string; light: string; tip: string; opacity?: number }> = ({
  chord,
  span,
  k,
  fill,
  light,
  tip,
  opacity = 1,
}) => {
  const sy = span * (Math.abs(k) < 0.06 ? 0.06 * Math.sign(k || 1) : k);
  return (
    <g transform={`scale(${chord}, ${sy})`} opacity={opacity}>
      <path
        d="M 0.5 0.05 C 0.62 -0.3 0.5 -0.7 0.14 -1 L 0.03 -0.92 L -0.05 -1.0 L -0.12 -0.9 L -0.22 -0.96 L -0.25 -0.83 L -0.36 -0.86 L -0.35 -0.7 L -0.45 -0.7 C -0.46 -0.45 -0.48 -0.2 -0.55 0.05 Z"
        fill={fill}
      />
      <path d="M 0.46 0 C 0.52 -0.25 0.42 -0.48 0.22 -0.6 C 0.02 -0.5 -0.22 -0.32 -0.42 0 Z" fill={light} opacity={0.75} />
      <path d="M 0.14 -1 L 0.03 -0.92 L -0.05 -1.0 L -0.12 -0.9 L -0.22 -0.96 L -0.25 -0.83 L -0.36 -0.86 L -0.35 -0.7 L -0.45 -0.7 C -0.3 -0.72 -0.05 -0.78 0.2 -0.86 Z" fill={tip} opacity={0.85} />
    </g>
  );
};

/** A bird's leg: hip -> hock (bending back) -> foot, with three front toes and a back toe; toes curl when lifted. */
const BirdLeg: React.FC<{ hip: Pt; foot: Pt; lift: number; col: string; w: number; toe: number; hockBack?: number }> = ({
  hip,
  foot,
  lift,
  col,
  w,
  toe,
  hockBack = 1.2,
}) => {
  const hock = { x: lerp(hip.x, foot.x, 0.45) - hockBack, y: lerp(hip.y, foot.y, 0.5) };
  const curl = clamp(lift / (toe * 0.8));
  const tl = toe * (1 - 0.35 * curl);
  const dy = curl * toe * 0.55;
  return (
    <g stroke={col} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={`M ${hip.x} ${hip.y} L ${hock.x} ${hock.y} L ${foot.x} ${foot.y}`} strokeWidth={w} />
      <path d={`M ${foot.x} ${foot.y} l ${tl} ${dy * 0.6}`} strokeWidth={w * 0.62} />
      <path d={`M ${foot.x} ${foot.y} l ${tl * 0.78} ${dy + w * 0.25}`} strokeWidth={w * 0.55} opacity={0.85} />
      <path d={`M ${foot.x} ${foot.y} l ${-tl * 0.42} ${dy * 0.3}`} strokeWidth={w * 0.5} />
    </g>
  );
};

/** Walking legs from a gait phase (strides): foot x offset and lift for a leg with phase offset `off`. */
const gaitFoot = (gp: number, off: number, strideCm: number, liftCm: number, duty = 0.62) => {
  const ph = frac(gp + off);
  const sst = duty * strideCm;
  if (ph < duty) return { fx: sst / 2 - (ph / duty) * sst, lift: 0 };
  const q = (ph - duty) / (1 - duty);
  return { fx: -sst / 2 + inOut(q) * sst, lift: Math.sin(Math.PI * q) * liftCm };
};

/* ================================================================== */
/* HEN                                                                 */
/* ================================================================== */

interface HenColors {
  body: string;
  light: string;
  dark: string;
  hackle: string;
  hackleLight: string;
  wing: string;
  wingLight: string;
  wingTip: string;
  tail: string;
  tailSheen: string;
}
export const HEN_VARIANTS: HenColors[] = [
  { body: "#a1602f", light: "#d6a062", dark: "#5c3319", hackle: "#d49a48", hackleLight: "#f0cb7e", wing: "#7e4521", wingLight: "#a8673a", wingTip: "#3e2412", tail: "#2a2219", tailSheen: "#46523a" },
  { body: "#2e2824", light: "#5e5044", dark: "#15110f", hackle: "#b8702e", hackleLight: "#dca050", wing: "#241e1a", wingLight: "#40362e", wingTip: "#100c0a", tail: "#151311", tailSheen: "#2c3e34" },
  { body: "#dccaa2", light: "#f6ecd2", dark: "#a88e64", hackle: "#e6bd6e", hackleLight: "#f8e2aa", wing: "#c8ad80", wingLight: "#e2cda4", wingTip: "#857048", tail: "#3a3028", tailSheen: "#4c4c3a" },
];

export interface HenProps {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  lifeF: number;
  seed?: number;
  /** 0 rust-brown, 1 black with copper hackles, 2 pale buff. */
  variant?: number;
  path?: LifePathKey[];
  peckAt?: number[];
  cluckAt?: number[];
  autoPeck?: boolean;
  autoCluck?: boolean;
  scatterAt?: number;
  scatterDir?: 1 | -1;
  scatterDist?: number;
  scatterDy?: number;
  opacity?: number;
}

/** Scatter run distance (cm) at t frames after the startle (accelerates to vmax), optionally easing to a stop at D cm. */
const runDist = (t: number, vmax: number, D?: number) => {
  const u = Math.max(0, t - 2);
  let d = u < 6 ? (vmax * u * u) / 12 : vmax * (u - 3);
  if (D !== undefined && D > 0) {
    const a = 0.65 * D;
    if (d > a) d = a + (D - a) * (1 - Math.exp(-(d - a) / (D - a)));
  }
  return d;
};

export interface HenSolve {
  x: number;
  y: number;
  facing: 1 | -1;
  k: number;
  walk: number;
  run: number;
  gp: number;
  pitch: number;
  head: Pt;
  headRot: number;
  beakOpen: number;
  flap: number;
  flapK: number;
  lift: number;
  puff: number;
  tail: number;
  scatterT: number;
  /** World points. */
  headW: Pt;
  beakW: Pt;
}

export function solveHen(p: HenProps): HenSolve {
  const t = p.lifeF;
  const seed = p.seed ?? 3;
  const s = p.s ?? 1;
  const k = PX * s;
  // where she is (path or fixed), and how fast she walks
  let x = p.x;
  let y = p.y;
  let facing: 1 | -1 = p.flip ? -1 : 1;
  let distCm = 0;
  let walk = 0;
  if (p.path && p.path.length) {
    const a = lifePathAt(p.path, t);
    const b = lifePathAt(p.path, t - 1);
    x = a.x;
    y = a.y;
    distCm = a.dist / k;
    const v = Math.hypot(a.x - b.x, a.y - b.y) / k; // cm per frame
    walk = sstep(0.15, 0.9, v);
    if (p.flip === undefined) facing = a.dirX >= 0 ? 1 : -1;
  }
  // scatter
  const st = p.scatterAt !== undefined ? t - p.scatterAt : -1;
  let run = 0;
  let flap = 0;
  let lift = 0;
  let scatterT = -1;
  if (st >= 0) {
    scatterT = st;
    const dir: 1 | -1 = p.scatterDir ?? facing;
    if (st >= 1) facing = dir;
    const Dcm = p.scatterDist !== undefined ? p.scatterDist / k : undefined;
    const d = runDist(st, 9, Dcm);
    x += dir * d * k;
    y += ((p.scatterDy ?? 0) / 100) * d * k;
    distCm += d;
    const settle = Dcm !== undefined ? sstep(0.9, 0.995, d / Dcm) : 0;
    run = sstep(0, 5, st) * (1 - settle);
    walk = Math.max(walk, run);
    flap = env(st, 0, 1.5, 12, 8) * (1 - settle);
    // the startle jump, then flutter hops while the wings beat
    lift = 6 * Math.sin(Math.PI * clamp(st / 7)) + 2.2 * flap * Math.abs(Math.sin(st * 0.75));
  }
  const gp = distCm / (run > 0.3 ? 30 : 19); // strides (one stride = two steps)
  const idle = 1 - walk;
  // pecks and clucks
  const autoP = p.autoPeck ?? true;
  const pk = Math.max(lastAt(t, p.peckAt), autoP ? bucketEvent(t, 46, seed + 1, 0.8) : -Infinity);
  const pkT = t - pk;
  const peck = (Math.max(env(pkT, 0, 4, 2, 6), autoP && hash(pk * 0.37 + seed) > 0.55 ? env(pkT, 12, 3, 1, 6) : 0)) * idle * (st >= 0 ? 0 : 1);
  const autoC = p.autoCluck ?? true;
  const ck = Math.max(lastAt(t, p.cluckAt), autoC ? bucketEvent(t, 150, seed + 5, 0.55) : -Infinity);
  const ckT = t - ck;
  const cluck = env(ckT, 0, 4, 12, 6) * (st >= 0 ? 0 : 1) * (1 - peck);
  const beakCluck = ckT >= 0 && ckT < 20 ? Math.max(0, Math.sin((ckT - 2) * 0.62)) * (ckT > 2 ? 1 : 0) : 0;
  // head: base, bob, idle jerks, peck, cluck, running (stretched forward)
  const stepPh = frac(gp * 2);
  const A = 4.2 * walk * (1 - run);
  const bob = stepPh < 0.72 ? A * (0.5 - stepPh / 0.72) : A * (-0.5 + inOut((stepPh - 0.72) / 0.28));
  const jx = jerk(t, seed, 11, 0.9) * idle;
  const jy = jerk(t, seed + 3, 13, 0.7) * idle;
  let hx = 13.5 + bob + jx;
  let hy = -36 + jy + 1.2 * walk * Math.abs(Math.sin(stepPh * Math.PI));
  hx = lerp(hx, 18.5, peck);
  hy = lerp(hy, -3.6, peck);
  hx = lerp(hx, 12.4, cluck);
  hy = lerp(hy, -38.5, cluck);
  hx = lerp(hx, 17, run);
  hy = lerp(hy, -33, run);
  if (st >= 0 && st < 5) hy -= 3 * Math.sin(Math.PI * (st / 5)); // startled head up
  const headRot = 52 * peck - 10 * cluck + 6 * run + jerk(t, seed + 7, 17, 5) * idle;
  const pitch = 16 * peck + 10 * run - 3 * cluck + 1.5 * Math.sin(stepPh * Math.PI * 2) * walk;
  const flapK = flap > 0 ? Math.cos(st * ((2 * Math.PI) / 4.2)) : 1;
  const tail = 3 * Math.sin(t * 0.07 + seed) * idle - 12 * cluck * Math.max(0, Math.sin(ckT * 0.5)) - 14 * run;
  const toW = (q: Pt): Pt => ({ x: x + facing * k * q.x, y: y + k * (q.y - lift) });
  return {
    x,
    y,
    facing,
    k,
    walk,
    run,
    gp,
    pitch,
    head: { x: hx, y: hy },
    headRot,
    beakOpen: Math.max(beakCluck * 0.9, run * 0.5 * Math.max(0, Math.sin(t * 0.9))),
    flap,
    flapK,
    lift,
    puff: cluck,
    tail,
    scatterT,
    headW: toW({ x: hx, y: hy }),
    beakW: toW(rotPt({ x: hx + 5.8, y: hy + 0.2 }, headRot, { x: hx, y: hy })),
  };
}

const HEN_BODY = "M 8 -28.5 C 3 -31.5 -8 -31.5 -13 -28.5 C -17.5 -25 -17 -17.5 -12 -13.5 C -7 -10 3 -10 8 -12.8 C 13 -15.5 15 -21.5 12.4 -25.8 C 11.2 -27.4 9.8 -28.4 8 -28.5 Z";
const HEN_WING = "M 7.5 -24.5 C 2 -26.5 -6 -25.6 -12.5 -21.2 C -9 -18 -3 -16.4 4 -17.2 C 7.6 -18.4 8.6 -21.4 7.5 -24.5 Z";

export const Hen: React.FC<HenProps> = (p) => {
  const raw = useId();
  const id = safeId(raw);
  const S = solveHen(p);
  const C = HEN_VARIANTS[(((p.variant ?? 0) % 3) + 3) % 3];
  const pivot = { x: 0, y: -18 };
  const neckRoot = rotPt({ x: 8, y: -26 }, S.pitch, pivot);
  const shoulder = rotPt({ x: 4, y: -25 }, S.pitch, pivot);
  const H = S.head;
  const ctrl = { x: lerp(neckRoot.x, H.x, 0.5) + 1.5, y: lerp(neckRoot.y, H.y, 0.5) + 0.5 };
  const neckW = 6.4 + 1.6 * S.puff;
  const legs = [
    { off: 0, near: false, hipX: -1.2 },
    { off: 0.5, near: true, hipX: 1.2 },
  ].map((L) => {
    const g = gaitFoot(S.gp, L.off, S.run > 0.3 ? 22 : 16, S.run > 0.3 ? 5 : 3.2);
    const m = S.walk;
    const fx = L.hipX + g.fx * m;
    const lift = g.lift * m + (S.lift > 1 ? Math.min(S.lift * 0.4, 3) : 0);
    return { ...L, foot: { x: fx + 1, y: -lift }, lift };
  });
  const shadowK = clamp(1 - S.lift / 30);
  const wingOpen = clamp(S.flap * 3);
  return (
    <g opacity={p.opacity ?? 1}>
      <ellipse cx={S.x} cy={S.y + 1} rx={15 * S.k * shadowK} ry={2.4 * S.k * shadowK} fill={SHADOW} opacity={0.28 * shadowK} />
      <g transform={`translate(${S.x}, ${S.y - S.lift * S.k}) scale(${S.facing * S.k}, ${S.k})`}>
        <defs>
          <linearGradient id={`${id}-b`} x1={0} y1={-31} x2={0} y2={-11} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor={C.light} />
            <stop offset={0.45} stopColor={C.body} />
            <stop offset={1} stopColor={C.dark} />
          </linearGradient>
          <clipPath id={`${id}-c`}>
            <path d={HEN_BODY} />
          </clipPath>
        </defs>
        {/* far leg, far wing */}
        {legs
          .filter((L) => !L.near)
          .map((L) => (
            <BirdLeg key="far" hip={{ x: L.hipX, y: -12.5 }} foot={L.foot} lift={L.lift} col="#b8913a" w={1.5} toe={3.2} />
          ))}
        {wingOpen > 0.01 && (
          <g transform={`translate(${shoulder.x - 1}, ${shoulder.y - 0.6}) rotate(${S.pitch - 18})`}>
            <SideWing chord={15} span={21} k={S.flapK} fill={C.dark} light={C.wing} tip={C.wingTip} opacity={wingOpen} />
          </g>
        )}
        <g transform={`rotate(${S.pitch} ${pivot.x} ${pivot.y})`}>
          {/* tail */}
          <g transform={`rotate(${S.tail} -12 -26)`}>
            <path d="M -10.5 -27 C -13 -33.5 -15.6 -38.5 -19.2 -42 C -21.6 -36.5 -21.6 -31 -19.4 -26.6 C -18 -23.6 -15 -22 -12.6 -22 Z" fill={C.tail} />
            <path d="M -12 -27.5 C -14.4 -32.5 -16.4 -36 -18.6 -38.6 C -19.6 -34.6 -19.2 -30.6 -17.6 -27.4 Z" fill={C.tailSheen} opacity={0.7} />
            <path d="M -13.4 -25 C -17 -27.6 -20 -31 -22 -35 C -22.6 -30.6 -21.4 -26.4 -18.4 -23.4 Z" fill={C.tail} opacity={0.9} />
          </g>
          <path d={HEN_BODY} fill={`url(#${id}-b)`} />
          <g clipPath={`url(#${id}-c)`}>
            <ellipse cx={-2} cy={-11} rx={16} ry={4.2} fill={C.dark} opacity={0.4} />
            <ellipse cx={-1} cy={-29.6} rx={10} ry={2.2} fill="#fff4dc" opacity={0.16} />
            <ellipse cx={11} cy={-21} rx={3.4} ry={6} fill={C.light} opacity={0.35} />
          </g>
          {/* the folded wing (fades out while the wings beat) */}
          <g opacity={1 - wingOpen}>
            <path d={HEN_WING} fill={C.wing} />
            <path d="M 6 -23.6 C 1.6 -24.8 -4 -24 -8.6 -21.4 C -4 -21 1 -21.2 5.4 -21.8 Z" fill={C.wingLight} opacity={0.6} />
            <path d="M -4 -18.2 C -7.4 -18.6 -10.4 -19.6 -12.5 -21.2 C -10.4 -20.8 -7 -20.2 -3.6 -19.8 Z" fill={C.wingTip} opacity={0.8} />
            <path d="M 0 -17.4 C -3 -17.6 -6.6 -18.4 -9.4 -19.6" stroke={C.wingTip} strokeWidth={0.45} fill="none" opacity={0.6} />
          </g>
        </g>
        {legs
          .filter((L) => L.near)
          .map((L) => (
            <BirdLeg key="near" hip={{ x: L.hipX, y: -12.5 }} foot={L.foot} lift={L.lift} col="#d8b04a" w={1.6} toe={3.4} />
          ))}
        {wingOpen > 0.01 && (
          <g transform={`translate(${shoulder.x}, ${shoulder.y}) rotate(${S.pitch - 18})`}>
            <SideWing chord={16} span={22} k={S.flapK} fill={C.wing} light={C.wingLight} tip={C.wingTip} opacity={wingOpen} />
          </g>
        )}
        {/* neck: hackle feathers flowing from the head over the shoulders and breast */}
        {(() => {
          const wB = neckW * 0.95; // half width at the base
          const b1 = { x: neckRoot.x - wB * 1.05, y: neckRoot.y - 0.6 }; // back of the neck base (over the shoulders)
          const b2 = { x: neckRoot.x + wB * 0.75, y: neckRoot.y + wB * 0.85 }; // front (breast)
          const h1 = { x: H.x - 2.5, y: H.y - 0.8 };
          const h2 = { x: H.x + 0.6, y: H.y + 2.8 };
          const c1 = { x: ctrl.x - 3.2, y: ctrl.y - 1.2 };
          const c2 = { x: ctrl.x + 2.4, y: ctrl.y + 2.4 };
          const fringe = [0.15, 0.38, 0.6, 0.82].map((u) => {
            const px = lerp(b1.x, b2.x, u);
            const py = lerp(b1.y, b2.y, u) + 0.6;
            return `M ${px - 1.4} ${py - 1.2} L ${px - 0.4} ${py + 2.6} L ${px + 1.2} ${py - 0.8} Z`;
          });
          return (
            <g>
              <path d={fringe.join(" ")} fill={C.hackle} />
              <path d={`M ${b1.x} ${b1.y} Q ${c1.x} ${c1.y} ${h1.x} ${h1.y} L ${h2.x} ${h2.y} Q ${c2.x} ${c2.y} ${b2.x} ${b2.y} Z`} fill={C.hackle} />
              <path d={`M ${b1.x + 1} ${b1.y - 0.2} Q ${c1.x + 0.8} ${c1.y - 0.2} ${h1.x + 0.6} ${h1.y + 0.4}`} stroke={C.hackleLight} strokeWidth={neckW * 0.32} strokeLinecap="round" fill="none" opacity={0.6} />
              <path d={`M ${b2.x - 1} ${b2.y - 0.4} Q ${c2.x - 1} ${c2.y - 0.6} ${h2.x - 0.4} ${h2.y - 0.4}`} stroke={C.dark} strokeWidth={neckW * 0.18} strokeLinecap="round" fill="none" opacity={0.25} />
            </g>
          );
        })()}
        {/* head */}
        <g transform={`translate(${H.x}, ${H.y}) rotate(${S.headRot})`}>
          <path d="M -2.6 -2.4 C -2.8 -4.6 -1.8 -5.4 -1.1 -4.1 C -0.7 -5.8 0.6 -5.9 0.9 -4.2 C 1.4 -5.6 2.7 -5.2 2.7 -3.8 C 3.4 -4.4 4.2 -3.6 3.5 -2.2 Z" fill="#c8352c" />
          <circle cx={0} cy={0} r={3.3} fill={C.hackle} />
          <ellipse cx={1.4} cy={-0.5} rx={1.9} ry={1.6} fill="#c84a38" opacity={0.85} />
          <path d="M 2.7 -1.1 L 6.1 0.1 L 2.8 0.6 Z" fill="#d9b25c" />
          <g transform={`rotate(${S.beakOpen * 24} 2.8 0.6)`}>
            <path d="M 2.8 0.5 L 5.4 0.5 L 2.9 1.4 Z" fill="#b8913c" />
          </g>
          <path d="M 2.4 1.1 C 3.3 1.9 3.3 3.9 2.3 4.4 C 1.4 3.7 1.4 2 2.4 1.1 Z" fill="#b82c26" />
          <circle cx={1.5} cy={-0.8} r={0.82} fill="#c8742a" />
          <circle cx={1.6} cy={-0.8} r={0.5} fill="#1a0e06" />
          <circle cx={1.75} cy={-1.0} r={0.17} fill="#ffffff" opacity={0.85} />
        </g>
      </g>
    </g>
  );
};

/* ================================================================== */
/* CHICK                                                               */
/* ================================================================== */

const CHICK_VARIANTS = [
  { body: "#e9c96c", light: "#f8e7a8", dark: "#b8913e", stripe: "" },
  { body: "#9a7546", light: "#c8a26c", dark: "#5e4426", stripe: "#4a3420" },
  { body: "#3c322b", light: "#6a5a4c", dark: "#1c1612", stripe: "" },
];

export interface ChickProps {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  lifeF: number;
  seed?: number;
  variant?: number;
  /** 0..1 moving amount; gait = strides travelled (drives the legs). Absent: standing with its own idle. */
  walk?: number;
  gait?: number;
  /** 0..1 head down to the ground. Absent: its own auto pecks. */
  peck?: number;
  /** 0..1 beak open (a cheep). Absent: its own cheeps. */
  cheep?: number;
  /** 0..1 the wing stubs beating (scatter). */
  flap?: number;
  opacity?: number;
}

export const Chick: React.FC<ChickProps> = (p) => {
  const t = p.lifeF;
  const seed = p.seed ?? 5;
  const k = PX * (p.s ?? 1);
  const C = CHICK_VARIANTS[(((p.variant ?? 0) % 3) + 3) % 3];
  const walk = p.walk ?? 0;
  const gp = p.gait ?? 0;
  const pkAt = bucketEvent(t, 23, seed, 0.75);
  const peck = p.peck ?? env(t - pkAt, 0, 2, 2, 3) * (1 - walk);
  const chAt = bucketEvent(t, 31, seed + 2, 0.6);
  const cheep = p.cheep ?? (t - chAt >= 0 && t - chAt < 8 ? Math.max(0, Math.sin((t - chAt) * 0.9)) : 0);
  const flap = p.flap ?? 0;
  const bounce = walk * Math.abs(Math.sin(gp * Math.PI * 2)) * 0.8;
  const hx = lerp(3.4 + jerk(t, seed, 9, 0.4) * (1 - walk), 4.6, peck);
  const hy = lerp(-6.6 + jerk(t, seed + 1, 8, 0.3), -2.4, peck);
  const pitch = 14 * peck + 8 * walk;
  const facing = p.flip ? -1 : 1;
  const legs = [0, 0.5].map((off, i) => {
    const g = gaitFoot(gp, off, 6, 1.4);
    return { near: i === 1, foot: { x: (i ? 0.5 : -0.5) + g.fx * walk, y: -g.lift * walk }, lift: g.lift * walk };
  });
  const wingA = flap > 0 ? -35 * flap * (0.5 + 0.5 * Math.sin(t * 2.4 + seed)) : 0;
  return (
    <g opacity={p.opacity ?? 1}>
      <ellipse cx={p.x} cy={p.y + 0.5} rx={4.4 * k} ry={0.9 * k} fill={SHADOW} opacity={0.24} />
      <g transform={`translate(${p.x}, ${p.y - bounce * k}) scale(${facing * k}, ${k})`}>
        {legs
          .filter((L) => !L.near)
          .map((L) => (
            <BirdLeg key="f" hip={{ x: -0.3, y: -2.2 }} foot={L.foot} lift={L.lift} col="#d09a5a" w={0.55} toe={1.2} hockBack={0.4} />
          ))}
        <g transform={`rotate(${pitch} 0 -4)`}>
          <ellipse cx={-0.4} cy={-4.2} rx={4} ry={3.1} fill={C.body} />
          <ellipse cx={-0.2} cy={-5.4} rx={3} ry={1.6} fill={C.light} opacity={0.6} />
          <ellipse cx={-0.8} cy={-2.2} rx={3.4} ry={1.1} fill={C.dark} opacity={0.4} />
          {C.stripe && <path d="M -4 -5 C -2 -6.6 1 -6.8 3 -6" stroke={C.stripe} strokeWidth={0.7} fill="none" opacity={0.8} />}
          {/* fluff at the rear */}
          <path d="M -4.2 -4.6 L -5.4 -5.2 L -4.6 -4 L -5.6 -3.6 L -4.2 -3.2 Z" fill={C.body} />
          <g transform={`rotate(${wingA} 0.6 -4.8)`}>
            <path d="M 0.8 -5.2 C -0.6 -5.6 -2.4 -5 -3 -3.6 C -1.6 -3.2 0 -3.4 1 -4.2 Z" fill={C.dark} opacity={0.75} />
          </g>
        </g>
        {/* a short fluffy neck keeps the head on the body when it dips to peck */}
        <path d={`M 1.4 -5 L ${hx - 0.4} ${hy + 0.2}`} stroke={C.body} strokeWidth={3} strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={2.2} fill={C.body} />
        <circle cx={hx - 0.4} cy={hy - 0.7} r={1.3} fill={C.light} opacity={0.55} />
        {C.stripe && <path d={`M ${hx - 1.8} ${hy - 1} C ${hx - 0.6} ${hy - 2} ${hx + 0.6} ${hy - 2} ${hx + 1.4} ${hy - 1.4}`} stroke={C.stripe} strokeWidth={0.5} fill="none" />}
        <g transform={`rotate(${32 * peck} ${hx} ${hy})`}>
          <path d={`M ${hx + 1.8} ${hy - 0.3} L ${hx + 3.3} ${hy + 0.2} L ${hx + 1.9} ${hy + 0.5} Z`} fill="#e0a848" />
          <path d={`M ${hx + 1.9} ${hy + 0.5} L ${hx + 3} ${hy + 0.5 + cheep * 0.6} L ${hx + 1.9} ${hy + 0.9} Z`} fill="#c88a38" opacity={cheep > 0.05 ? 1 : 0} />
          <circle cx={hx + 0.9} cy={hy - 0.5} r={0.42} fill="#140c06" />
        </g>
        {legs
          .filter((L) => L.near)
          .map((L) => (
            <BirdLeg key="n" hip={{ x: 0.3, y: -2.2 }} foot={L.foot} lift={L.lift} col="#e0aa66" w={0.6} toe={1.3} hockBack={0.4} />
          ))}
      </g>
    </g>
  );
};

/* ================================================================== */
/* HEN FAMILY                                                          */
/* ================================================================== */

export interface HenFamilyProps extends HenProps {
  /** Number of chicks, 4 to 6 (default 5). */
  chicks?: number;
  /** How far the chicks spread around her, cm (default 26). */
  spread?: number;
}

/** Where chick i is (world px), its facing, moving amount and gait, from the hen's own solve at lagged frames. */
export function solveHenFamily(p: HenFamilyProps) {
  const n = clamp(Math.round(p.chicks ?? 5), 4, 6);
  const s = p.s ?? 1;
  const k = PX * s;
  const spread = p.spread ?? 26;
  const seed = p.seed ?? 3;
  const hen = solveHen(p);
  const chicks = [];
  for (let i = 0; i < n; i++) {
    const cs = seed * 13 + i * 7;
    const lag = 3 + Math.round(hash(cs) * 10);
    const ox = (-0.8 + 1.6 * hash(cs + 1)) * spread;
    const oy = (-0.25 + 0.6 * hash(cs + 2)) * spread * 0.45; // depth offset (px / k): ahead of or behind her
    const pos = (tt: number) => {
      // the hen's place at the lagged frame, without her scatter (the chick has its own)
      const H = solveHen({ ...p, lifeF: tt, scatterAt: undefined });
      const wx = ox + noise1(tt * 0.018, cs + 3) * 7;
      const wy = oy + noise1(tt * 0.015, cs + 4) * 2.5;
      return { x: H.x + wx * k, y: H.y + wy * k, facing: H.facing };
    };
    const t = p.lifeF;
    let a = pos(t - lag);
    const b = pos(t - lag - 1);
    let vx = (a.x - b.x) / k;
    let vy = (a.y - b.y) / k;
    let flap = 0;
    let cheep: number | undefined;
    // the scatter: each chick a few frames after her, running after her
    if (p.scatterAt !== undefined && t >= p.scatterAt + 1) {
      const delay = 1 + Math.round(hash(cs + 5) * 4);
      const st = t - p.scatterAt - delay;
      if (st >= 0) {
        const dir: 1 | -1 = p.scatterDir ?? hen.facing;
        const vmax = 5.5 + hash(cs + 6) * 3;
        const D = p.scatterDist !== undefined ? (p.scatterDist / k) * (0.55 + 0.35 * hash(cs + 7)) : undefined;
        const d = runDist(st, vmax, D);
        const d1 = runDist(st - 1, vmax, D);
        const fan = (hash(cs + 8) - 0.5) * 0.5 + (p.scatterDy ?? 0) / 100;
        a = { x: pos(p.scatterAt).x + dir * d * k, y: pos(p.scatterAt).y + fan * d * k, facing: dir };
        vx = (dir * (d - d1));
        vy = fan * (d - d1);
        flap = sstep(0, 3, st) * (1 - sstep(10, 30, st));
        cheep = Math.max(0, Math.sin(st * 1.1 + i)) * (D !== undefined ? 1 - sstep(D * 0.8, D, d) : 1);
      }
    }
    const v = Math.hypot(vx, vy);
    const walk = sstep(0.1, 0.6, v);
    const facing: 1 | -1 = vx + 0.08 * a.facing >= 0 ? 1 : -1;
    // gait from the travelled distance along x (facing-signed so it never runs backwards)
    const gait = (a.x / k) * facing / 5.5 + hash(cs + 9);
    chicks.push({ x: a.x, y: a.y, facing, walk, gait, flap, cheep, seed: cs, variant: i % 3 === 2 ? 2 : i % 2 });
  }
  return { hen, chicks };
}

export const HenFamily: React.FC<HenFamilyProps> = (p) => {
  const { hen, chicks } = solveHenFamily(p);
  const s = p.s ?? 1;
  const draw = (c: (typeof chicks)[number], i: number) => (
    <Chick
      key={i}
      x={c.x}
      y={c.y}
      s={s}
      flip={c.facing < 0}
      lifeF={p.lifeF}
      seed={c.seed}
      variant={c.variant}
      walk={c.walk}
      gait={c.gait}
      flap={c.flap}
      cheep={c.cheep}
    />
  );
  const sorted = chicks.map((c, i) => ({ c, i })).sort((a, b) => a.c.y - b.c.y);
  return (
    <g opacity={p.opacity ?? 1}>
      {sorted.filter(({ c }) => c.y <= hen.y).map(({ c, i }) => draw(c, i))}
      <Hen {...p} />
      {sorted.filter(({ c }) => c.y > hen.y).map(({ c, i }) => draw(c, i))}
    </g>
  );
};

/* ================================================================== */
/* CROW                                                                */
/* ================================================================== */

export const CROW_CAW_LEN = 12;

export interface CrowProps {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  lifeF: number;
  seed?: number;
  cawAt?: number[];
  lookAt?: number[];
  autoLook?: boolean;
  takeOffAt?: number;
  takeOffDir?: 1 | -1;
  opacity?: number;
}

export function solveCrow(p: CrowProps) {
  const t = p.lifeF;
  const seed = p.seed ?? 9;
  const k = PX * (p.s ?? 1);
  let facing: 1 | -1 = p.flip ? -1 : 1;
  const to = p.takeOffAt;
  const tt = to !== undefined ? t - to : -1;
  const crouch = tt >= 0 ? sstep(0, 4, tt) * (1 - sstep(4, 6, tt)) : 0;
  const u = tt - 4; // flight frames
  const flying = u >= 0;
  let dx = 0;
  let dy = 0;
  let pitch = -32;
  let wingK = 1;
  let wingOpen = 0;
  let legTuck = 0;
  if (flying) {
    const dir: 1 | -1 = p.takeOffDir ?? facing;
    facing = dir;
    dx = dir * (4.5 * u + 0.32 * u * u);
    dy = -(2.2 * u + 7 * (1 - Math.exp(-u / 3)));
    pitch = lerp(-32, -10, sstep(0, 7, u));
    wingOpen = sstep(0, 1.5, u);
    wingK = -Math.cos(u * ((2 * Math.PI) / 7)); // starts with the wings up, first downstroke
    wingK = 0.1 + 0.8 * wingK;
    legTuck = sstep(3, 9, u);
  }
  // caw
  const cw = lastAt(t, p.cawAt);
  const cT = t - cw;
  const caw = env(cT, 0, 3, 5, 4);
  const beak = cT >= 0 && cT < CROW_CAW_LEN ? Math.sin(Math.PI * clamp((cT - 1) / (CROW_CAW_LEN - 3))) : 0;
  // glances: the head snaps round to look back, holds, snaps back
  const lk = Math.max(lastAt(t, p.lookAt), (p.autoLook ?? true) && !flying ? bucketEvent(t, 84, seed, 0.7) : -Infinity);
  const lT = t - lk;
  const look = flying ? 0 : env(lT, 0, 3, 26, 3);
  const hx = 7.2 + jerk(t, seed, 10, 0.5) * (1 - caw) + 2 * caw;
  const hy = -21 + jerk(t, seed + 2, 12, 0.4) * (1 - caw) + 2.6 * caw + 2.2 * crouch;
  const headRot = 18 * caw + jerk(t, seed + 4, 15, 6) * (1 - caw) * (1 - look) + (flying ? 22 : 0);
  const tailRot = -14 * caw - 10 * crouch + 3 * Math.sin(t * 0.09 + seed) * (flying ? 0 : 1) + (flying ? -8 : 0);
  const bodyY = 1.6 * crouch;
  const toW = (q: Pt): Pt => ({ x: p.x + facing * k * (q.x + dx), y: p.y + k * (q.y + dy + bodyY) });
  const pitchF = pitch + 10 * caw - 6 * crouch;
  const Hr = rotPt({ x: hx, y: hy }, pitchF + 32, { x: 0, y: -11 });
  return {
    k,
    facing,
    flying,
    dx,
    dy,
    pitch: pitchF,
    wingK,
    wingOpen,
    legTuck,
    caw,
    beak,
    look,
    head: { x: hx, y: hy },
    headRot,
    tailRot,
    bodyY,
    crouch,
    /** True once it has left a 1920 x 1080 frame by a margin (world px; the scene may stop drawing it). */
    gone: flying && (Math.abs(dx * k) > 2400 || -dy * k > 1300),
    x: p.x + facing * dx * k,
    y: p.y + dy * k,
    beakW: toW({ x: Hr.x + 8, y: Hr.y + 1 }),
  };
}

export const Crow: React.FC<CrowProps> = (p) => {
  const raw = useId();
  const id = safeId(raw);
  const S = solveCrow(p);
  if (S.gone) return null;
  const pivot = { x: 0, y: -11 };
  const shoulder = rotPt({ x: 2.5, y: -15 }, S.pitch + 32, pivot);
  const H = rotPt(S.head, S.pitch + 32, pivot);
  const BLACK = "#1b191d";
  const SHEEN = "#3d3f52";
  const GREY = "#77716c";
  const GREY_L = "#9a938c";
  const lookSX = 1 - 2 * S.look; // the head swivels through edge-on to look back
  return (
    <g opacity={p.opacity ?? 1}>
      {!S.flying && <ellipse cx={p.x} cy={p.y + 1.5} rx={6 * S.k} ry={1.1 * S.k} fill={SHADOW} opacity={0.18} />}
      <g transform={`translate(${p.x + S.facing * S.dx * S.k}, ${p.y + S.dy * S.k}) scale(${S.facing * S.k}, ${S.k})`}>
        <defs>
          <linearGradient id={`${id}-b`} x1={0} y1={-22} x2={0} y2={-2} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor={SHEEN} />
            <stop offset={0.5} stopColor={BLACK} />
            <stop offset={1} stopColor="#0c0b0d" />
          </linearGradient>
        </defs>
        {/* legs (perched: gripping the rail; flying: dangling, then tucked) */}
        {!S.flying ? (
          <g stroke="#141214" strokeLinecap="round" fill="none">
            <path d="M -0.6 -6 L -0.2 -0.4" strokeWidth={1.1} />
            <path d="M 1.2 -6 L 1.6 -0.4" strokeWidth={1.2} />
            <path d="M -1.4 0 L 3.8 0" strokeWidth={0.9} />
            <path d="M -2.6 0.1 L -0.6 -0.2" strokeWidth={0.8} />
          </g>
        ) : (
          <g transform={`rotate(${S.pitch + 32} 0 -11)`} opacity={1 - S.legTuck}>
            <path d="M 0 -6 L -2.4 -1.6 M 1.4 -6 L -1 -1.4" stroke="#141214" strokeWidth={1} strokeLinecap="round" />
          </g>
        )}
        <g transform={`translate(0, ${S.bodyY})`}>
        {S.flying && (
          <g transform={`translate(${shoulder.x - 1.2}, ${shoulder.y - 0.8}) rotate(${S.pitch - 16})`}>
            <SideWing chord={15} span={34} k={S.wingK} fill="#0e0d10" light="#222128" tip="#08070a" opacity={S.wingOpen} />
          </g>
        )}
        <g transform={`rotate(${S.pitch + 32} ${pivot.x} ${pivot.y})`}>
          {/* tail */}
          <g transform={`rotate(${S.tailRot} -6 -7)`}>
            <path d="M -5 -9.5 L -18.5 1.5 C -18 3.2 -16.6 4.2 -15.2 4.2 L -3.6 -5.2 Z" fill="#141216" />
            <path d="M -6.6 -7.6 L -16.6 1.2 L -15.4 2.4 Z" fill={SHEEN} opacity={0.5} />
          </g>
          {/* body */}
          <ellipse cx={-0.6} cy={-11.4} rx={11} ry={6.6} transform="rotate(-36 -0.6 -11.4)" fill={`url(#${id}-b)`} />
          {/* grey collar: nape, neck and breast */}
          <path d="M 3 -19.6 C 0 -18.6 -3 -16 -4.4 -13.4 C -1.6 -12.4 2.4 -11 5.2 -9.2 C 7.6 -10.4 9.2 -14 8.8 -17.6 C 7.4 -19.2 5.2 -20 3 -19.6 Z" fill={GREY} />
          <path d="M 4 -18.8 C 1.6 -18 -0.6 -16.4 -2 -14.6 C -0.2 -14.6 2.4 -15.4 4.6 -16.8 Z" fill={GREY_L} opacity={0.6} />
          {/* folded wing */}
          {!S.flying || S.wingOpen < 1 ? (
            <g opacity={1 - S.wingOpen}>
              <path d="M 4.6 -16.4 C -1 -16.2 -7 -12.6 -12.6 -2.6 C -8.4 -4.6 -2.6 -7.6 3.4 -10.6 C 5 -12 5.4 -14.4 4.6 -16.4 Z" fill="#121014" />
              <path d="M 3.6 -15.4 C -0.6 -15 -4.6 -12.6 -7.6 -9 C -3.6 -10.4 0.2 -12 3.4 -13.4 Z" fill={SHEEN} opacity={0.45} />
            </g>
          ) : null}
        </g>
        {S.flying && (
          <g transform={`translate(${shoulder.x}, ${shoulder.y}) rotate(${S.pitch - 16})`}>
            <SideWing chord={16} span={36} k={S.wingK} fill="#17151a" light="#2e2d38" tip="#0a090c" opacity={S.wingOpen} />
          </g>
        )}
        {/* head: black face and crown, grey nape; it swivels (scaleX through 0) to look back */}
        <g transform={`translate(${H.x}, ${H.y}) rotate(${S.headRot}) scale(${lookSX}, 1)`}>
          <circle cx={-0.6} cy={0.6} r={4.1} fill={GREY} />
          <path d="M -1.4 -3.6 C 1.4 -4.8 4.2 -3.6 4.6 -0.8 C 4.8 1.2 4 3 2.6 4.4 C 1 3 0.2 0.8 -0.4 -1 C -0.8 -2 -1.2 -2.8 -1.4 -3.6 Z" fill={BLACK} />
          <path d="M -1.6 -3.4 C 0 -4.4 2.4 -4.6 3.6 -3.6 C 2 -3.4 0.2 -3 -1.6 -3.4 Z" fill={SHEEN} opacity={0.6} />
          {/* beak (upper; the lower opens for a caw) */}
          <path d="M 3.6 -2 C 6.6 -2.2 9.2 -1.2 10.4 0.2 C 8 0.5 5.6 0.6 3.8 0.6 Z" fill="#111013" />
          <g transform={`rotate(${S.beak * 30} 3.8 0.6)`}>
            <path d="M 3.8 0.4 C 6 0.6 8.4 0.6 9.8 0.4 C 8 1.6 5.6 2.2 3.8 2 Z" fill="#1c1a1e" />
          </g>
          <path d="M 4 -1.6 C 6.4 -1.6 8.4 -0.9 9.6 -0.1" stroke="#4a4a56" strokeWidth={0.3} fill="none" opacity={0.6} />
          <circle cx={2} cy={-1.2} r={0.75} fill="#2a1a12" />
          <circle cx={2.2} cy={-1.4} r={0.22} fill="#ffffff" opacity={0.8} />
        </g>
        </g>
      </g>
    </g>
  );
};

/* ================================================================== */
/* SPARROW                                                             */
/* ================================================================== */

export interface SparrowProps {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  lifeF: number;
  seed?: number;
  hopAt?: number[];
  /** cm per hop (default 6; negative = backwards). A number[] gives each hop its own length. */
  hopLen?: number | number[];
  peckAt?: number[];
  tiltAt?: number[];
  flutterAt?: number[];
  /** cm the flutter moves it forward (default 0). */
  flutterLen?: number;
  auto?: boolean;
  /** A rice grain where the beak lands (true) or at a given world x on the ground. Hidden after a peck takes it if eatAt. */
  grain?: boolean | { x: number };
  /** lifeF frame the grain is eaten (it disappears at the peck's bottom). */
  eatAt?: number;
  opacity?: number;
}

const HOP_LEN_F = 5;

export function solveSparrow(p: SparrowProps) {
  const t = p.lifeF;
  const seed = p.seed ?? 21;
  const k = PX * (p.s ?? 1);
  const keyed = !!(p.hopAt?.length || p.peckAt?.length || p.tiltAt?.length || p.flutterAt?.length);
  const auto = p.auto ?? !keyed;
  // hops
  const hops: { at: number; len: number }[] = (p.hopAt ?? []).map((at, i) => ({
    at,
    len: Array.isArray(p.hopLen) ? (p.hopLen[i] ?? 6) : (p.hopLen ?? 6),
  }));
  if (auto) {
    // little back-and-forth hops (one per 70-frame bucket: even buckets forward, odd ones back) so it stays near x;
    // the buckets before the last two are long finished and cancel in pairs
    const P = 70;
    const k0 = Math.floor(t / P);
    const done = Math.max(0, k0 - 1);
    if (done % 2 === 1) hops.push({ at: -1e6, len: 5 });
    for (let kk = Math.max(0, k0 - 1); kk <= k0; kk++) hops.push({ at: kk * P + 30 + Math.floor(hash(kk + seed) * 20), len: kk % 2 === 0 ? 5 : -5 });
  }
  let dx = 0;
  let hopY = 0;
  let hopping = 0;
  for (const h of hops) {
    const u = (t - h.at) / HOP_LEN_F;
    if (u >= 1) dx += h.len;
    else if (u > 0) {
      dx += h.len * inOut(u);
      hopY = Math.max(hopY, 2.6 * Math.sin(Math.PI * u));
      hopping = 1;
    }
  }
  // flutter
  const fl = lastAt(t, p.flutterAt);
  const fT = t - fl;
  let flutter = 0;
  if (fT >= 0 && fT < 12) {
    flutter = Math.sin(Math.PI * (fT / 12));
    hopY = Math.max(hopY, 6 * flutter);
  }
  for (const a of p.flutterAt ?? []) dx += (p.flutterLen ?? 0) * sstep(a, a + 12, t);
  // pecks
  const pkA = Math.max(lastAt(t, p.peckAt), auto ? bucketEvent(t, 29, seed + 1, 0.8) : -Infinity);
  const pT = t - pkA;
  const peck = hopping || flutter > 0 ? 0 : env(pT, 0, 2, 1, 4);
  // tilt
  const tlA = Math.max(lastAt(t, p.tiltAt), auto ? bucketEvent(t, 97, seed + 3, 0.7) : -Infinity);
  const tilt = env(t - tlA, 0, 3, 11, 4) * (hash(tlA + seed) > 0.5 ? 1 : -0.8);
  const facing: 1 | -1 = p.flip ? -1 : 1;
  const x = p.x + facing * dx * k;
  const hx = lerp(3.8 + jerk(t, seed, 7, 0.35), 5.1, peck);
  const hy = lerp(-7 + jerk(t, seed + 1, 9, 0.3), -3.5, peck);
  const beakTip = { x: x + facing * k * lerp(7.6, 7.2, peck), y: p.y + k * lerp(-6.8, -0.3, peck) - hopY * k };
  return {
    k,
    facing,
    x,
    y: p.y,
    dx,
    hopY,
    hopping,
    flutter,
    flutterT: fT,
    peck,
    peckT: pT,
    tilt,
    head: { x: hx, y: hy },
    pitch: 16 * peck - 6 * hopping,
    tail: -10 * hopping + 2 * peck + 4 * Math.sin(t * 0.13 + seed) - 14 * flutter,
    beakTip,
  };
}

/** World point of the beak tip (at a peck's bottom: the grain). */
export const sparrowBeakTip = (p: SparrowProps) => solveSparrow(p).beakTip;

export const Sparrow: React.FC<SparrowProps> = (p) => {
  const raw = useId();
  const id = safeId(raw);
  const S = solveSparrow(p);
  const H = S.head;
  const pivot = { x: 0, y: -4.5 };
  const wingA = S.flutter > 0 ? Math.sin(S.flutterT * 2.6) : 1;
  const grainX = p.grain ? (typeof p.grain === "object" ? p.grain.x : S.x + S.facing * 7.4 * S.k) : 0;
  const eaten = p.eatAt !== undefined && p.lifeF >= p.eatAt + 2;
  return (
    <g opacity={p.opacity ?? 1}>
      {p.grain && !eaten && <ellipse cx={grainX} cy={p.y - 0.25 * S.k} rx={0.55 * S.k} ry={0.24 * S.k} fill="#f4ecd6" stroke="none" />}
      <ellipse cx={S.x} cy={p.y + 0.3} rx={4.6 * S.k * (1 - S.hopY / 14)} ry={0.8 * S.k} fill={SHADOW} opacity={0.22 * (1 - S.hopY / 10)} />
      <g transform={`translate(${S.x}, ${p.y - S.hopY * S.k}) scale(${S.facing * S.k}, ${S.k})`}>
        <defs>
          <linearGradient id={`${id}-b`} x1={0} y1={-8} x2={0} y2={-1.4} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor="#a87648" />
            <stop offset={0.55} stopColor="#c9b8a0" />
            <stop offset={1} stopColor="#b3a896" />
          </linearGradient>
        </defs>
        {/* legs */}
        <g stroke="#b08a74" strokeLinecap="round" fill="none">
          <path d={`M -0.5 -2 L -0.7 ${S.hopY > 0.5 ? -0.6 : 0}`} strokeWidth={0.42} />
          <path d={`M 0.5 -2 L 0.4 ${S.hopY > 0.5 ? -0.6 : 0}`} strokeWidth={0.45} />
          <path d={`M -0.7 0 l 1.4 0 M 0.4 0 l 1.3 0`} strokeWidth={0.3} opacity={S.hopY > 0.5 ? 0 : 1} />
        </g>
        {S.flutter > 0 && (
          <g transform={`translate(1.2, -5.8) rotate(${S.pitch - 24})`}>
            <SideWing chord={5.4} span={10} k={wingA * 0.9} fill="#5a3e26" light="#8e6a44" tip="#2e2016" opacity={0.85} />
          </g>
        )}
        <g transform={`rotate(${S.pitch} ${pivot.x} ${pivot.y})`}>
          <g transform={`rotate(${S.tail} -4.4 -4.6)`}>
            <path d="M -4.2 -5.3 L -9.8 -6.8 C -10.2 -6.2 -10.2 -5.4 -9.8 -4.9 L -4.2 -3.6 Z" fill="#5e4430" />
          </g>
          <ellipse cx={-0.6} cy={-4.4} rx={5.2} ry={3.2} transform="rotate(-12 -0.6 -4.4)" fill={`url(#${id}-b)`} />
          {/* back streaks */}
          <path d="M 1.6 -7 C -0.6 -7.4 -3 -6.8 -4.6 -5.6" stroke="#3c2a1a" strokeWidth={0.5} fill="none" opacity={0.7} />
          {/* wing: brown, dark-centred feathers, white bar */}
          <g opacity={S.flutter > 0 ? 0.25 : 1}>
            <path d="M 2.4 -6.2 C -0.2 -7 -4 -6.2 -6.6 -4.6 C -4 -3.4 -0.6 -3.2 2 -4 C 2.8 -4.6 2.9 -5.4 2.4 -6.2 Z" fill="#8a5c34" />
            <path d="M 1.2 -5.6 C -1 -5.8 -3.4 -5.2 -5.4 -4.4" stroke="#2e1e12" strokeWidth={0.55} fill="none" opacity={0.8} />
            <path d="M 1.8 -4.7 C 0 -4.9 -1.6 -4.6 -2.8 -4.1" stroke="#f2ece0" strokeWidth={0.38} fill="none" />
          </g>
        </g>
        {/* head: grey crown, chestnut nape, pale cheek, black bib */}
        <g transform={`translate(${H.x}, ${H.y}) rotate(${55 * S.peck + S.tilt * 24})`}>
          <path d="M -2.4 0.4 C -2.6 2 -1.6 3.4 0 4.2 L 1.6 2 Z" fill="#8a5432" />
          <circle cx={0} cy={0} r={2.4} fill="#9a6a44" />
          <path d="M -2 -1.2 C -1 -2.5 1.2 -2.6 2.3 -1.2 C 0.8 -1.4 -0.6 -1.2 -2 -1.2 Z" fill="#8e8a86" />
          <ellipse cx={0.4} cy={0.6} rx={1.5} ry={1.1} fill="#ebe5d8" />
          <path d="M 1.4 1.2 C 1.6 2.6 1 3.8 0 4.4 C 1.4 4.6 2.4 3.4 2.4 1.6 Z" fill="#1e1a18" />
          <path d="M 1.8 -0.7 L 3.8 0.15 L 1.9 0.8 Z" fill="#2e2622" />
          <circle cx={0.9} cy={-0.5} r={0.5} fill="#140c08" />
          <circle cx={1.05} cy={-0.65} r={0.15} fill="#ffffff" opacity={0.85} />
        </g>
      </g>
    </g>
  );
};

/* ================================================================== */
/* GOAT                                                                */
/* ================================================================== */

export const GOAT_BLEAT_LEN = 34;

const GOAT_COATS = {
  black: { body: "#2b2522", light: "#6a5a4e", dark: "#100d0c", horn: "#7a6e5e", inner: "#8a5a50", eye: "#c9963a" },
  brown: { body: "#7a5232", light: "#b0845a", dark: "#3e2814", horn: "#9a8a72", inner: "#b07a68", eye: "#c9963a" },
  white: { body: "#e4ddcf", light: "#fbf6ea", dark: "#a89c86", horn: "#b8a888", inner: "#d8a8a0", eye: "#c9963a" },
};

export interface GoatProps {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  lifeF: number;
  seed?: number;
  coat?: keyof typeof GOAT_COATS;
  /** World point of the tether peg (default on the ground in front of her); false = no rope. */
  peg?: Pt | false;
  ropeLen?: number;
  bleatAt?: number[];
  graze?: number;
  chew?: boolean;
  opacity?: number;
}

export function solveGoat(p: GoatProps) {
  const t = p.lifeF;
  const seed = p.seed ?? 17;
  const k = PX * (p.s ?? 1);
  const facing: 1 | -1 = p.flip ? -1 : 1;
  const bl = lastAt(t, p.bleatAt);
  const bT = t - bl;
  const bleat = env(bT, 0, 6, GOAT_BLEAT_LEN - 16, 10);
  const mouthBleat = bT >= 3 && bT < GOAT_BLEAT_LEN - 6 ? sstep(3, 7, bT) * (1 - sstep(GOAT_BLEAT_LEN - 12, GOAT_BLEAT_LEN - 6, bT)) * (0.8 + 0.2 * Math.sin(bT * 2.3)) : 0;
  const graze = clamp(p.graze ?? 0) * (1 - bleat);
  const chewOn = (p.chew ?? true) && mouthBleat < 0.05;
  const chew = chewOn ? Math.max(0, Math.sin(t * 0.48 + noise1(t * 0.05, seed) * 1.2)) : 0;
  const neckRot = 85 * graze - 6 * bleat + 2.5 * noise1(t * 0.012, seed + 1);
  const headRot = -30 * bleat + 4 * noise1(t * 0.02, seed + 2) * (1 - bleat) - 10 * graze;
  // grazing, the neck also reaches forward and down from the shoulders so the muzzle meets the grass
  const neckShift = { x: 4 * graze, y: 8 * graze };
  const ef = bucketEvent(t, 44, seed + 3, 0.75);
  const earFlick = env(t - ef, 0, 2, 1, 4);
  const tw = bucketEvent(t, 66, seed + 5, 0.6);
  const tailWag = t - tw >= 0 && t - tw < 14 ? Math.sin((t - tw) * 1.9) * (1 - (t - tw) / 14) : 0;
  const breath = 0.5 + 0.5 * Math.sin(t * 0.12 + seed);
  const neckBase = { x: 16, y: -44 };
  const sh = (q: Pt): Pt => ({ x: q.x + neckShift.x, y: q.y + neckShift.y });
  const poll = sh(rotPt({ x: 31, y: -64 }, neckRot, neckBase));
  const collarL = sh(rotPt({ x: 24.5, y: -50 }, neckRot, neckBase));
  const mouthL = sh(rotPt(rotPt({ x: 45, y: -50 }, headRot, { x: 31, y: -64 }), neckRot, neckBase));
  const toW = (q: Pt): Pt => ({ x: p.x + facing * k * q.x, y: p.y + k * q.y });
  const collar = toW(collarL);
  const peg = p.peg === false ? null : p.peg ?? { x: p.x + facing * 78 * k, y: p.y + 7 * k };
  return {
    k,
    facing,
    bleat,
    mouthBleat,
    graze,
    chew,
    neckRot,
    headRot,
    earFlick,
    tailWag,
    breath,
    neckBase,
    neckShift,
    poll,
    collar,
    peg,
    /** World point of the mouth (grass in a graze). */
    mouth: toW(mouthL),
  };
}

export const Goat: React.FC<GoatProps> = (p) => {
  const raw = useId();
  const id = safeId(raw);
  const S = solveGoat(p);
  const C = GOAT_COATS[p.coat ?? "black"];
  const legCol = C.body;
  const farCol = C.dark;
  const leg = (x: number, hind: boolean, col: string, w: number) =>
    hind ? (
      <g key={`${x}`}>
        <path d={`M ${x + 3} -34 C ${x + 5} -26 ${x + 1} -18 ${x - 2.4} -14.5 L ${x - 0.4} -1.5 L ${x - 2.4} -1.5 L ${x - 4.6} -14 C ${x - 4} -20 ${x - 4.6} -27 ${x - 5} -33 Z`} fill={col} />
        <path d={`M ${x - 2.6} -2.6 L ${x + 0.2} -2.6 L ${x + 0.6} 0 L ${x - 3} 0 Z`} fill="#141110" />
      </g>
    ) : (
      <g key={`${x}`}>
        <path d={`M ${x - w} -32 C ${x - w} -24 ${x - w * 0.6} -18 ${x - w * 0.55} -15 L ${x - w * 0.5} -1.5 L ${x + w * 0.5} -1.5 L ${x + w * 0.55} -15 C ${x + w * 0.7} -19 ${x + w} -25 ${x + w} -32 Z`} fill={col} />
        <ellipse cx={x} cy={-15} rx={w * 0.7} ry={1.4} fill={col} />
        <path d={`M ${x - 1.6} -2.6 L ${x + 1.4} -2.6 L ${x + 2} 0 L ${x - 1.6} 0 Z`} fill="#141110" />
      </g>
    );
  // rope from the collar to the peg, sagging, never below the ground
  let rope: React.ReactNode = null;
  if (S.peg) {
    const a = S.collar;
    const b = S.peg;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const L = p.ropeLen ?? d * 1.3;
    const sag = Math.sqrt(Math.max(0, L * L - d * d)) * 0.75;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const ground = Math.max(b.y, p.y) + 2;
    const cy = Math.min(mid.y + sag, 2 * ground - mid.y);
    const pegH = 9 * S.k;
    rope = (
      <g>
        <path d={`M ${b.x - 1.4 * S.k} ${b.y - pegH} L ${b.x + 1.4 * S.k} ${b.y - pegH} L ${b.x + 1 * S.k} ${b.y + 1} L ${b.x - 1 * S.k} ${b.y + 1} Z`} fill="#6a4a2a" />
        <ellipse cx={b.x} cy={b.y - pegH} rx={1.5 * S.k} ry={0.5 * S.k} fill="#8a6a44" />
        <ellipse cx={b.x} cy={b.y + 1} rx={3 * S.k} ry={0.8 * S.k} fill={SHADOW} opacity={0.25} />
        <path d={`M ${a.x} ${a.y} Q ${mid.x} ${cy} ${b.x} ${b.y - pegH * 0.8}`} stroke="#a88a56" strokeWidth={Math.max(1.2, 0.7 * S.k)} fill="none" strokeLinecap="round" />
        <path d={`M ${a.x} ${a.y} Q ${mid.x} ${cy} ${b.x} ${b.y - pegH * 0.8}`} stroke="#d6bc84" strokeWidth={Math.max(0.5, 0.25 * S.k)} fill="none" strokeLinecap="round" opacity={0.6} transform={`translate(0, ${-0.2 * S.k})`} />
      </g>
    );
  }
  const jaw = 3.5 * S.chew + 24 * S.mouthBleat;
  return (
    <g opacity={p.opacity ?? 1}>
      <ellipse cx={p.x + S.facing * 2 * S.k} cy={p.y + 1} rx={40 * S.k} ry={4 * S.k} fill={SHADOW} opacity={0.3} />
      {S.peg && S.peg.y <= p.y && rope}
      <g transform={`translate(${p.x}, ${p.y}) scale(${S.facing * S.k}, ${S.k})`}>
        <defs>
          <linearGradient id={`${id}-b`} x1={0} y1={-54} x2={0} y2={-24} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor={C.light} />
            <stop offset={0.4} stopColor={C.body} />
            <stop offset={1} stopColor={C.dark} />
          </linearGradient>
          <clipPath id={`${id}-c`}>
            <path d="M 22 -46 C 18 -52.5 0 -53 -18 -52 C -28 -51.6 -33.5 -46 -33.5 -40 C -33.5 -32 -29 -26.5 -22 -25.5 C -8 -23.6 8 -24.4 16 -26.5 C 24 -29.5 26.5 -40 22 -46 Z" />
          </clipPath>
        </defs>
        {/* far legs */}
        {leg(11, false, farCol, 2.6)}
        {leg(-19.5, true, farCol, 2.6)}
        {/* tail */}
        <g transform={`rotate(${-18 * S.tailWag} -31 -48)`}>
          <path d="M -31.5 -47.5 C -35.5 -53 -36.5 -57.5 -34.6 -60 C -32.6 -57 -30.6 -53 -29.4 -49 Z" fill={C.body} />
          <path d="M -33.6 -56 C -34.6 -57.6 -34.6 -59 -34.2 -59.6 C -33.4 -58.4 -32.8 -57.2 -32.6 -56.2 Z" fill={C.light} opacity={0.5} />
        </g>
        {/* body (breathing) */}
        <g transform={`translate(0, ${-0.6 * S.breath})`}>
          <path d="M 22 -46 C 18 -52.5 0 -53 -18 -52 C -28 -51.6 -33.5 -46 -33.5 -40 C -33.5 -32 -29 -26.5 -22 -25.5 C -8 -23.6 8 -24.4 16 -26.5 C 24 -29.5 26.5 -40 22 -46 Z" fill={`url(#${id}-b)`} />
          <g clipPath={`url(#${id}-c)`}>
            <ellipse cx={-24} cy={-38} rx={9} ry={12} fill={C.dark} opacity={0.35} />
            <ellipse cx={-4} cy={-51.5} rx={22} ry={2.2} fill="#fff4dc" opacity={0.14} />
            <ellipse cx={0} cy={-25} rx={26} ry={3.6} fill={C.dark} opacity={0.4} />
            <path d="M 12 -44 C 14 -38 13 -32 10 -27" stroke={C.dark} strokeWidth={1} fill="none" opacity={0.4} />
          </g>
        </g>
        {/* near legs */}
        {leg(17, false, legCol, 2.9)}
        {leg(-24, true, legCol, 3)}
        {/* neck + head (graze lowers it about the neck base; the bleat lifts the head about the poll) */}
        <g transform={`translate(${S.neckShift.x}, ${S.neckShift.y}) rotate(${S.neckRot} ${S.neckBase.x} ${S.neckBase.y})`}>
          <path d="M 10 -48.5 C 16 -57 22 -63 27 -68 L 36 -61 C 32 -52 28 -42 24.5 -31 C 20 -30 15 -33 12 -38 Z" fill={`url(#${id}-b)`} />
          {/* collar: a twist of jute where the rope ties */}
          <path d="M 21.5 -57 C 24 -53.6 27 -50.4 31 -49.6" stroke="#a88a56" strokeWidth={1.3} fill="none" strokeLinecap="round" />
          <circle cx={24.5} cy={-50} r={1.2} fill="#c4a46a" />
          <g transform={`rotate(${S.headRot} 31 -64)`}>
            {/* far ear (mostly hidden behind the head) */}
            <path d="M 29 -65.6 C 26.4 -67 23.6 -67.2 21.6 -66.2 C 24 -65 26.6 -64.4 29 -64.2 Z" fill={C.dark} />
            {/* horns, back-curving */}
            <path d="M 30.6 -69.6 C 29.4 -74 26.6 -76.8 22.6 -77.4 C 24.6 -75.4 25.8 -72.6 26 -68.6 Z" fill={C.horn} opacity={0.75} />
            <path d="M 29.6 -69.2 C 28.6 -73.8 25.4 -77 21 -77.2 C 23 -75.2 24.2 -72 24.6 -68 Z" fill={C.horn} />
            <path d="M 28.4 -70.2 C 27.4 -73.4 25.2 -75.4 22.4 -76.2" stroke="#ffffff" strokeWidth={0.5} fill="none" opacity={0.25} />
            {/* head */}
            <path d="M 25.6 -68.6 C 29.6 -72.6 36 -71.6 39 -67.4 C 42 -63.2 45.6 -57.6 46.8 -53.6 C 47.4 -50.6 45 -49 42 -50 C 37.6 -51.6 31 -56.6 27.6 -61 C 25.6 -63.6 24.8 -66.6 25.6 -68.6 Z" fill={`url(#${id}-b)`} />
            <path d="M 31 -70 C 35 -70.2 37.8 -68 39.4 -65" stroke={C.light} strokeWidth={1.4} fill="none" opacity={0.45} strokeLinecap="round" />
            {S.mouthBleat > 0.05 && (
              <path d={`M 38.6 -54.4 L 45.6 -50.6 L ${45 - 3.4 * S.mouthBleat} ${-49.4 + 4.6 * S.mouthBleat} Z`} fill="#4a2420" opacity={Math.min(1, S.mouthBleat * 2)} />
            )}
            {/* lower jaw (chewing, bleating) */}
            <g transform={`rotate(${jaw} 39 -55)`}>
              <path d="M 38 -55 C 40.6 -52.6 43 -50.6 45.2 -50 C 44.6 -48.4 42.4 -47.8 40.4 -48.6 C 38.8 -49.6 37.6 -52 38 -55 Z" fill={C.body} />
              {/* beard */}
              <path d="M 40.6 -48.8 C 40.6 -45 39.6 -42 38.4 -40.2 C 37.8 -43.4 38 -46.6 38.8 -49 Z" fill={C.dark} />
            </g>
            <ellipse cx={45.6} cy={-53.4} rx={0.8} ry={0.5} fill="#0c0908" />
            {/* eye: amber with the goat's horizontal pupil */}
            <ellipse cx={34.4} cy={-64.2} rx={1.6} ry={1.3} fill={C.eye} />
            <rect x={33.2} y={-64.6} width={2.4} height={0.8} rx={0.4} fill="#120c08" />
            <circle cx={34.9} cy={-64.8} r={0.3} fill="#ffffff" opacity={0.8} />
            <path d="M 32.6 -65.6 C 33.6 -66.4 35.2 -66.4 36.2 -65.6" stroke={C.dark} strokeWidth={0.5} fill="none" opacity={blink(p.lifeF, (p.seed ?? 17) + 1) > 0.5 ? 0 : 0.6} />
            {blink(p.lifeF, (p.seed ?? 17) + 1) > 0.5 && <ellipse cx={34.4} cy={-64.2} rx={1.75} ry={1.45} fill={C.body} />}
            {/* near ear: hangs out sideways, flicks */}
            <g transform={`rotate(${-22 * S.earFlick + 4 * Math.sin(p.lifeF * 0.05)} 29.6 -63.6)`}>
              <path d="M 30 -64.4 C 25.6 -64 20.4 -61.6 16.8 -58.4 C 21.4 -57.6 26.6 -59.6 30.4 -61.6 Z" fill={C.body} />
              <path d="M 28.6 -63 C 25 -62.2 21.4 -60.6 19 -58.8 C 22.4 -59 26 -60.4 28.8 -61.8 Z" fill={C.inner} opacity={0.6} />
            </g>
          </g>
        </g>
      </g>
      {S.peg && S.peg.y > p.y && rope}
    </g>
  );
};

/* ================================================================== */
/* KITE                                                                */
/* ================================================================== */

export interface KiteProps {
  x: number;
  y: number;
  s?: number;
  lifeF: number;
  seed?: number;
  wind?: number;
  tugAt?: number[];
  autoTug?: boolean;
  stringTo?: Pt;
  /** [left half, right half, crown patch and tail]. */
  colors?: [string, string, string];
  streamer?: boolean;
  stringColor?: string;
  opacity?: number;
}

export function solveKite(p: KiteProps) {
  const t = p.lifeF;
  const seed = p.seed ?? 31;
  const k = PX * (p.s ?? 1);
  const w = p.wind ?? 0.6;
  const to = p.stringTo ?? { x: p.x - 420, y: p.y + 1500 };
  const tg = Math.max(lastAt(t, p.tugAt), (p.autoTug ?? true) ? bucketEvent(t, 58, seed, 0.85) : -Infinity);
  const tT = t - tg;
  const dip = tT >= 0 && tT < 24 ? (tT < 5 ? sstep(0, 5, tT) : 1 - sstep(5, 24, tT)) : 0;
  const nose = tT >= 0 && tT < 18 ? Math.sin(Math.PI * clamp(tT / 18)) : 0;
  // drift in the wind (cm), the dip pulls it toward the flyer
  const dxC = w * (24 * noise1(t * 0.011, seed + 1) + 9 * Math.sin(t * 0.047 + seed));
  const dyC = w * (12 * noise1(t * 0.016, seed + 2) + 4 * Math.sin(t * 0.083 + seed));
  const toward = { x: to.x - p.x, y: to.y - p.y };
  const tl = Math.hypot(toward.x, toward.y) || 1;
  const cx = p.x + dxC * k + (toward.x / tl) * 16 * k * dip;
  const cy = p.y + dyC * k + (toward.y / tl) * 16 * k * dip;
  const rot = w * (8 * Math.sin(t * 0.061 + seed) + 6 * noise1(t * 0.03, seed + 3)) + 13 * nose - 6;
  const bridle = rotPt({ x: cx, y: cy + 3 * k }, rot, { x: cx, y: cy });
  return { k, w, cx, cy, rot, dip, nose, bridle, to };
}

/** World point where the string meets the kite (the bridle). */
export const kiteBridle = (p: KiteProps) => solveKite(p).bridle;

export const Kite: React.FC<KiteProps> = (p) => {
  const raw = useId();
  const id = safeId(raw);
  const S = solveKite(p);
  const [cA, cB, cC] = p.colors ?? ["#cf3a2e", "#f0c23c", "#245a9e"];
  const t = p.lifeF;
  const seed = p.seed ?? 31;
  // string: a long sagging curve to the flyer (it tightens in a tug)
  const a = S.bridle;
  const b = S.to;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const nrm = { x: (b.y - a.y) / len, y: -(b.x - a.x) / len }; // left normal
  const sagDir = nrm.y > 0 ? nrm : { x: -nrm.x, y: -nrm.y }; // the side that hangs down
  const sag = len * (0.09 - 0.05 * S.dip);
  const ctrl = { x: (a.x + b.x) / 2 + sagDir.x * sag, y: (a.y + b.y) / 2 + sagDir.y * sag };
  // tail streamer in world coords from the lej, trailing downwind with a travelling wave
  const tailBase = rotPt({ x: S.cx, y: S.cy + 33 * S.k }, S.rot, { x: S.cx, y: S.cy });
  const ang = ((90 - 28 * S.w) * Math.PI) / 180;
  const dir = { x: Math.cos(ang), y: Math.sin(ang) };
  const per = { x: -dir.y, y: dir.x };
  const pts: Pt[] = [];
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const d = (i / N) * 46 * S.k;
    const wv = Math.sin(t * 0.32 - i * 0.75 + seed) * (1.2 + i * 0.55) * S.k * (0.5 + S.w);
    pts.push({ x: tailBase.x + dir.x * d + per.x * wv, y: tailBase.y + dir.y * d + per.y * wv });
  }
  const tailD = "M " + pts.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" L ");
  const lejRot = 8 * Math.sin(t * 0.21 + seed);
  return (
    <g opacity={p.opacity ?? 1}>
      <path d={`M ${a.x} ${a.y} Q ${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`} stroke={p.stringColor ?? "#5e5040"} strokeWidth={1.15} fill="none" opacity={0.55} />
      {(p.streamer ?? true) && (
        <g>
          <path d={tailD} stroke={cC} strokeWidth={Math.max(1.2, 1.3 * S.k)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={tailD} stroke="#ffffff" strokeWidth={Math.max(0.4, 0.4 * S.k)} fill="none" opacity={0.3} />
        </g>
      )}
      <g transform={`translate(${S.cx}, ${S.cy}) rotate(${S.rot}) scale(${S.k})`}>
        <defs>
          <linearGradient id={`${id}-sun`} x1={-22} y1={-21} x2={22} y2={26} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor="#fffbea" stopOpacity={0.45} />
            <stop offset={0.5} stopColor="#fffbea" stopOpacity={0} />
            <stop offset={1} stopColor="#1a1008" stopOpacity={0.22} />
          </linearGradient>
        </defs>
        {/* lej: the small triangular paper tail */}
        <g transform={`rotate(${lejRot} 0 25)`}>
          <path d="M 0 24.5 L -6.4 33.5 L 6.4 33.5 Z" fill={cC} />
          <path d="M 0 24.5 L -6.4 33.5 L 0 33.5 Z" fill="#ffffff" opacity={0.12} />
        </g>
        {/* the paper: two halves, a crown patch, sunlit through */}
        <path d="M 0 -21 L -22.5 -4.5 L 0 25 Z" fill={cA} />
        <path d="M 0 -21 L 22.5 -4.5 L 0 25 Z" fill={cB} />
        <path d="M 0 -21 L -8.2 -15 L 0 -10.4 L 8.2 -15 Z" fill={cC} />
        <path d="M 0 -21 L -22.5 -4.5 L 0 25 L 22.5 -4.5 Z" fill={`url(#${id}-sun)`} />
        {/* bamboo spine and bow, seen through the paper */}
        <path d="M 0 -21 L 0 25" stroke="#6e5230" strokeWidth={0.9} opacity={0.55} />
        <path d="M -22.5 -4.5 Q 0 -17 22.5 -4.5" stroke="#6e5230" strokeWidth={0.8} fill="none" opacity={0.5} />
        {/* the paper billows a little between the sticks */}
        <path d="M -12 2 Q -7 8 -3 14" stroke="#000000" strokeWidth={0.5} fill="none" opacity={0.08} />
        <path d="M 12 2 Q 7 8 3 14" stroke="#000000" strokeWidth={0.5} fill="none" opacity={0.08} />
      </g>
    </g>
  );
};

/* ================================================================== */
/* KOLSHI                                                              */
/* ================================================================== */

/** Pot-local anchors (cm; origin = middle of the base, y up negative). */
export const KOLSHI_ANCHORS = {
  height: 35,
  /** centre of the mouth (the rim's top). */
  mouth: { x: 0, y: -35 },
  /** the neck (a hand round it). */
  neck: { x: 6.2, y: -30 },
  /** the widest point of the belly on each side (where it rests on a hip). */
  bellyNear: { x: -17, y: -14 },
  bellyFar: { x: 17, y: -14 },
  /** centre of the belly. */
  belly: { x: 0, y: -14 },
};

const KOLSHI_D =
  "M 0 0 C 5 0 9 -0.6 12 -2.6 C 16 -5.4 17.2 -10 17 -14 C 16.8 -19 13.6 -23.6 9 -26.4 C 7.4 -27.4 6.4 -28.2 6.2 -29.6 L 6.2 -31.2 C 6.4 -32.4 8 -33 9.2 -33.6 C 9.7 -34 9.5 -34.8 8.6 -35 L -8.6 -35 C -9.5 -34.8 -9.7 -34 -9.2 -33.6 C -8 -33 -6.4 -32.4 -6.2 -31.2 L -6.2 -29.6 C -6.4 -28.2 -7.4 -27.4 -9 -26.4 C -13.6 -23.6 -16.8 -19 -17 -14 C -17.2 -10 -16 -5.4 -12 -2.6 C -9 -0.6 -5 0 0 0 Z";

/** The pot drawn in pot-local cm (origin the middle of the base). */
const KolshiArt: React.FC<{ wet?: boolean; mirror?: boolean }> = ({ wet = false, mirror = false }) => {
  const raw = useId();
  const id = safeId(raw);
  // the light is from the upper left of the SCREEN: a mirrored pot keeps its highlight on the left
  const g = mirror ? -1 : 1;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-br`} x1={-17 * g} y1={0} x2={17 * g} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor="#a8741f" />
          <stop offset={0.16} stopColor="#f7d784" />
          <stop offset={0.32} stopColor="#e3b14c" />
          <stop offset={0.68} stopColor="#a87420" />
          <stop offset={1} stopColor="#5a3a0e" />
        </linearGradient>
        <linearGradient id={`${id}-v`} x1={0} y1={-35} x2={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor="#fff2c0" stopOpacity={0.18} />
          <stop offset={0.45} stopColor="#000000" stopOpacity={0} />
          <stop offset={1} stopColor="#2a1804" stopOpacity={0.45} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={KOLSHI_D} />
        </clipPath>
      </defs>
      <path d={KOLSHI_D} fill={`url(#${id}-br)`} />
      <path d={KOLSHI_D} fill={`url(#${id}-v)`} />
      <g clipPath={`url(#${id}-c)`}>
        {/* engraved bands round the shoulder and a shadow line under the belly */}
        <path d="M -14.8 -21.6 Q 0 -18.8 14.8 -21.6" stroke="#6a440e" strokeWidth={0.45} fill="none" opacity={0.65} />
        <path d="M -15.6 -20 Q 0 -17.2 15.6 -20" stroke="#6a440e" strokeWidth={0.35} fill="none" opacity={0.5} />
        <path d="M -16.6 -9 Q 0 -5.6 16.6 -9" stroke="#fff0b8" strokeWidth={0.4} fill="none" opacity={0.25} />
        {/* specular streaks toward the light */}
        <ellipse cx={-8.4 * g} cy={-15} rx={2.4} ry={7.6} fill="#fffbe8" opacity={0.42} transform={`rotate(${-8 * g} ${-8.4 * g} -15)`} />
        <ellipse cx={-4.2 * g} cy={-31} rx={0.9} ry={1.6} fill="#fffbe8" opacity={0.45} />
        <ellipse cx={11.5 * g} cy={-8} rx={2.6} ry={5} fill="#ffcf70" opacity={0.18} />
      </g>
      {/* the mouth */}
      <ellipse cx={0} cy={-35} rx={8.6} ry={1.9} fill="#c8962e" />
      <ellipse cx={0} cy={-35} rx={7} ry={1.35} fill="#3a2406" />
      <ellipse cx={-2 * g} cy={-35.6} rx={4} ry={0.35} fill="#fff2c0" opacity={0.4} />
      {wet && (
        <g fill="#ffffff" opacity={0.55}>
          <ellipse cx={-5} cy={-24} rx={0.5} ry={0.9} />
          <ellipse cx={3} cy={-12} rx={0.45} ry={0.8} />
          <ellipse cx={9} cy={-20} rx={0.4} ry={0.7} />
        </g>
      )}
    </g>
  );
};

export interface KolshiProps {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  /** Degrees about the base point. */
  rot?: number;
  shadow?: boolean;
  wet?: boolean;
  opacity?: number;
}

export const Kolshi: React.FC<KolshiProps> = ({ x, y, s = 1, flip = false, rot = 0, shadow = true, wet = false, opacity = 1 }) => {
  const k = PX * s;
  return (
    <g opacity={opacity}>
      {shadow && <ellipse cx={x + 2 * k} cy={y + 0.5} rx={15 * k} ry={2.6 * k} fill={SHADOW} opacity={0.3} />}
      <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${flip ? -k : k}, ${k})`}>
        <KolshiArt wet={wet} mirror={flip} />
      </g>
    </g>
  );
};

/**
 * Carrying the kolshi on the hip with a CAST adult Puppet (a woman passing with water, W2).
 * The pot is a Puppet prop in the near (left) hand: the arm hangs a little back and the forearm comes forward across
 * the pot's shoulder, the hand resting on its mouth; the belly sits at her near hip. Puppet props are drawn after the
 * hand, so the pot's rim lies just under the fingers.
 */
/** Figure units per cm for a Puppet prop (PropCtx.scale = B.hand / 30; an adult's hand is about 16 cm). */
const PROP_UNITS_PER_CM = 1.9;
/** Pot placement in the prop frame (cm, upright): its mouth centre relative to the hand (behind it, a little below). */
export const KOLSHI_CARRY_OFFSET = { back: 7, down: 2.5 };

export const makeKolshiProp = (o: { facing?: 1 | -1; back?: number; down?: number; wet?: boolean } = {}): PropRenderer => {
  const facing = o.facing ?? 1;
  const back = o.back ?? KOLSHI_CARRY_OFFSET.back;
  const down = o.down ?? KOLSHI_CARRY_OFFSET.down;
  const PropKolshi: PropRenderer = ({ worldRot, scale }) => {
    const u = PROP_UNITS_PER_CM * scale;
    return (
      <g transform={`rotate(${-worldRot}) translate(${-facing * back * u}, ${(down + 35) * u}) scale(${u})`}>
        <KolshiArt wet={o.wet} />
      </g>
    );
  };
  return PropKolshi;
};

/** The prop renderer for a figure turned to screen right in figure space (bodyTurn > 0). */
export const kolshiProp: PropRenderer = makeKolshiProp();
/** Pass as Puppet `props` (bodyTurn > 0). For bodyTurn < 0: { kolshi: makeKolshiProp({ facing: -1 }) }. */
export const KOLSHI_PUPPET_PROPS: Record<string, PropRenderer> = { kolshi: kolshiProp };

/** Left-arm angles for the hip carry (figure turned to +x). */
export const KOLSHI_ARM = { lS: 10, lE: -96 };

/** Standing / still pose channels for the carry (facing = the sign of the figure's bodyTurn). */
export const kolshiCarryPose = (facing: 1 | -1 = 1): Partial<Pose> => ({
  lProp: "kolshi",
  lHand: "hold",
  lS: KOLSHI_ARM.lS * facing,
  lE: KOLSHI_ARM.lE * facing,
});
export const KOLSHI_CARRY_POSE: Partial<Pose> = kolshiCarryPose(1);

/**
 * walkPose with the kolshi on the near (left) hip: the carrying arm barely swings (it rides the step a little), the
 * free arm swings as usual. Move the Puppet by walkTravel(f, o).bodyX as walkPose says.
 */
export const kolshiWalkPose = (f: number, o: WalkOpts): Partial<Pose> => {
  const w = walkPose(f, { ...o, carrySide: -1 });
  const facing: 1 | -1 = (w.bodyTurn ?? 1) >= 0 ? 1 : -1;
  const sway = (w.bodyY ?? 0) * 0.6;
  return { ...w, lProp: "kolshi", lHand: "hold", lS: KOLSHI_ARM.lS * facing + sway * facing, lE: KOLSHI_ARM.lE * facing };
};
