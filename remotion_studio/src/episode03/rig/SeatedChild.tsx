import React, { useId } from "react";
import { Hand, type HandShape } from "../../cinematic/rig/Hand";

/**
 * Episode 3 seated child rig. Balak Thakur at about five, sitting cross-legged on the ground, drawn
 * as borderless vector shapes with soft form shading (light from the upper left).
 *
 * Costume: soft cream cotton, like a young Brahmin boy's but childlike. A knee-length dhoti wraps
 * the hips (rolled waist, a small front tuck and pleats) and drapes over the thighs and the lap,
 * so the bare shins and feet come out from under the hem. An uttariya (chadar) crosses the chest
 * from the near hip, goes over the far shoulder and falls down the back. Every cloth piece is built
 * from the same joints as the body, so it follows the lean in every pose; free edges stir with the
 * breath and with the speed of the hands. Series rule: no sacred thread, no tilak, no jewellery,
 * no bangles, no anklets (he must not read as Krishna).
 *
 * Face: serene, half-lidded kind eyes with clear catchlights, a calm faint smile, round child
 * cheeks with a soft blush, curly dark hair. Blinks are slow and rare, head and gaze drift is small.
 * No divine light is drawn here; the glow is a separate component (BirulGlow) placed by the scene.
 *
 * Coordinates: (x, y) is the centre of the seat on the ground line. The figure is drawn in local
 * units around that point, about 230 px tall at s = 1, facing right unless `flip` is set.
 *
 * Limbs are single silhouettes built from round-ended, tapered capsules (no stamped circles). Bare skin
 * (arms, shins, feet, neck, torso) has no dark outline (MOT-19): its shade side is the same soft tone the
 * shared Hand uses (skinEdge), so the limbs and the hands read as one body.
 * `pose` picks the action; the hands rest on the knees otherwise. Arms are solved with two-bone IK
 * so the elbows bend naturally. Lean, head angle and hand targets are solved per frame.
 *
 * `prevPose` blends every joint from the previous pose over the first 16 frames of `poseStart`.
 * `f` (frame) drives the poses, expressions and gestures. Breathing, blinks, saccades, idle gaze,
 * glances and idle sway run on the life clock `lifeF ?? f` (seeded schedules and noise, so nothing
 * repeats on a loop).
 *
 * Breathing (MOT-20): about 3 s per breath with a noisy phase, a quicker inhale, a passive tailing
 * exhale and a short rest at the bottom, each breath a little deeper or shallower. Only the shoulders
 * (about 1 px on screen) and the chest wall rise, the uttariya rides with them and the head follows by
 * a fraction, 4 frames late; nothing bobs, tilts or scales. While he speaks (`talk`, or an open
 * `mouth`) the breath is shallow with small quick inhales. `sigh` adds a deep, calm breath on a beat.
 * In the sitCross and idle poses the child also shifts weight every 4 to 6 s, glances at the speaker
 * or the tulsi every 4 to 7 s (eyes leading), swings and fidgets his resting hands (see the idle section).
 *
 * Hands (MOT-19): the series' shared Hand (src/cinematic/rig/Hand.tsx), the adult model scaled to a
 * five-year-old and drawn a touch wider and shorter (plumper palm, softer fingers). Each pose names a
 * HandShape and a wrist turn per hand (near hand side +1, far hand side -1), so the thumb is always on
 * the anatomically correct side; the turn blends along the shortest arc between poses and the resting
 * fingers still curl and uncurl through Hand's `flex`. The forearm ends in a wrist sized to the
 * hand's projected wrist in that view, so arm and hand join without a seam.
 *
 * Body detail: a soft crease at each chubby wrist and ankle, separated toes, rounded
 * cloth-covered knees, a hint of the collarbone and the shoulder blade, lit and shaded sides on every
 * limb, and cloth folds that answer the lean, the breath and the raised arms.
 *
 * Movement: the chest and shoulders rise a little with each breath. Every gesture overlaps: the
 * upper arm leads, the forearm trails it by about 3 frames and the fingers by about 6. The eyes lead
 * the head (the head follows the pose about 5 frames late) and look at what he is working on. The
 * uttariya end and hem trail the body slightly.
 *
 * Expression: `expression` (serene, joyful, thoughtful, compassionate, playful) or, when unset, one
 * derived from the pose (lookUp thoughtful; bless, bowHands and palmRaise compassionate; reaction
 * playful; everything else serene). Expressions blend over 18 frames from `prevExpression` (or the
 * previous pose's expression). Small saccades and slow blinks keep the eyes alive. All restrained.
 */

export type SeatedPose =
  | "sitCross"
  | "pour"
  | "pickLeaf"
  | "placeFlowerOnFoot"
  | "bowHands"
  | "lookUp"
  | "idle"
  | "bless"
  | "palmRaise"
  | "reaction";

export interface SeatedChildProps {
  x: number;
  y: number;
  s?: number;
  f: number;
  pose?: SeatedPose;
  /** Pose the child is leaving. When set, joints blend from it over the first 16 frames of `poseStart`. */
  prevPose?: SeatedPose;
  flip?: boolean;
  face?: { lookX?: number; smile?: number; eyesDown?: number };
  /**
   * Frame at which the current pose began. The placeFlowerOnFoot timeline runs on the clock
   * t = f - poseStart. Default 0 (absolute frames).
   */
  poseStart?: number;
  /** Mouth opening, 0 = closed soft smile line, 1 = fully open. Default 0. */
  mouth?: number;
  /** Accepted for API compatibility. The glow is drawn by BirulGlow, not by this rig. */
  glow?: number;
  /** Facial expression. Default: derived from the pose (see POSE_EXPRESSION). */
  expression?: SeatedExpression;
  /** Expression being left; blends into `expression` over 18 frames from `expressionStart`. */
  prevExpression?: SeatedExpression;
  /** Frame at which `expression` began. Default `poseStart`. */
  expressionStart?: number;
  /**
   * Frame at which `prevPose` began. When set, the pose being left is evaluated on its own clock, so
   * the blend starts from exactly the pose shown on the frame before the switch (no jump). Pass it
   * whenever `prevPose` is a timed pose (placeFlowerOnFoot, reaction).
   */
  prevPoseStart?: number;
  /**
   * Red hibiscus flowers resting on his feet in the cross-legged seat: 0 = none, 1 to 3 = that many.
   * A fractional value eases the newest one in (e.g. 1.5 = one flower plus the second half grown in).
   * Slot 1 is the top of the near foot, exactly where placeFlowerOnFoot lays its flower. When this
   * prop is set, placeFlowerOnFoot lays the flower and lets go at t = 24 (it no longer carries it back
   * to the basket) and the hand flower is hidden from then on: raise footFlowers by one at
   * poseStart + 24 so the laid flower stays.
   */
  footFlowers?: number;
  /** Draw the rig's own small basket beside the near foot. Default false: the scene owns the basket. */
  showBasket?: boolean;
  /**
   * Wrist target (figure units, ground at y = 0) where the hand picks the flower in placeFlowerOnFoot.
   * Default { x: 84, y: -26 }, just in front of the near foot. Keep it within reach (about 100 units
   * from the near shoulder).
   */
  basketAt?: { x: number; y: number };
  /**
   * Life clock. Breathing, blinks, saccades, idle eye drift and glances, the idle sway and weight
   * shift, and the idle hand drift run on `lifeF ?? f`; poses, expressions, gestures and everything
   * story-driven keep using `f`. Pass a steadily running frame (e.g. the scene frame) when `f` is
   * warped or phase-shifted, so the breath never speeds up, stops or jumps.
   */
  lifeF?: number;
  /**
   * Speech envelope, 0 = silent, 1 = in a spoken line. While speaking the breath becomes shallow
   * with small quick inhales. Default: derived from `mouth` (any open mouth counts as speech).
   */
  talk?: number;
  /**
   * A visible deep, calm breath at a key beat: the sigh's breath curve at frame f (the same clock as
   * `f`), 0 outside the sigh, rising slowly to 1 at the top of the inhale and falling back over a
   * longer exhale. While it runs it replaces the normal breath, and the shoulders settle as he lets
   * the breath go. `sighCurve(start)` builds a ready-made one.
   */
  sigh?: (f: number) => number;
}

/* ------------------------------------------------------------------ */
/* Breathing (MOT-20)                                                   */
/* ------------------------------------------------------------------ */

/** Mean breath period of a calm five-year-old: about 3 s at 24 fps (2.5 to 3.8 s with the noise). */
const BREATH_P = 72;

/** Deterministic 0..1 hash of an integer (per-cycle variation). */
const hash01 = (n: number, salt: number): number => {
  let h = (Math.imul(n | 0, 2654435761) ^ Math.imul(salt | 0, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const easeSin = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

/**
 * Calm breath at life frame L: 0 = resting at the bottom, about 1 = top of a normal inhale.
 * The phase runs on slow noise (each breath a little longer or shorter), the inhale is the quicker
 * part (about a third of the cycle), the exhale is passive and tails off, and there is a short rest
 * at the bottom. Each cycle has its own depth.
 */
const calmBreath = (L: number): number => {
  const ph =
    L / BREATH_P + 0.15 * Math.sin(L * 0.0109 + 0.6) + 0.11 * Math.sin(L * 0.0067 + 2.3) + 0.03 * Math.sin(L * 0.0231 + 4.1);
  const n = Math.floor(ph);
  const u = ph - n;
  const depth = 0.8 + 0.32 * hash01(n, 11);
  const inF = 0.3 + 0.07 * hash01(n, 23);
  const exEnd = 0.78 + 0.09 * hash01(n, 37);
  let v = 0;
  if (u < inF) v = easeSin(u / inF);
  else if (u < exEnd) v = Math.pow(1 - easeSin((u - inF) / (exEnd - inF)), 1.35);
  return depth * v;
};

/**
 * Speaking breath: shallow, a quick small inhale (about 6 frames) then a long slow outflow while the
 * words come, every 1.5 to 2.3 s, so the chest barely moves while he talks.
 */
const speechBreath = (L: number): number => {
  const ph = L / 44 + 0.18 * Math.sin(L * 0.019 + 1.1) + 0.08 * Math.sin(L * 0.0431 + 0.3);
  const n = Math.floor(ph);
  const u = ph - n;
  const depth = 0.24 + 0.14 * hash01(n, 53);
  const inF = 0.15;
  const v = u < inF ? easeSin(u / inF) : 1 - easeSin((u - inF) / (1 - inF));
  return depth * v;
};

/**
 * A ready-made sigh curve for the `sigh` prop: from `start`, a slow deep inhale over `inhale` frames,
 * a brief hold at the top, then a longer exhale over `exhale` frames that tails off. 0 outside.
 */
export const sighCurve =
  (start: number, inhale = 30, exhale = 56, hold = 5) =>
  (f: number): number => {
    const t = f - start;
    if (t <= 0) return 0;
    if (t < inhale) return easeSin(t / inhale);
    if (t < inhale + hold) return 1;
    const e = (t - inhale - hold) / exhale;
    if (e >= 1) return 0;
    return Math.pow(1 - easeSin(e), 1.25);
  };

/** Breath of the sigh at its top, relative to a normal inhale. */
const SIGH_DEPTH = 2.3;

/**
 * The breath actually shown at life frame L (story frame sf for the sigh): calm breath, shallow speech
 * breath crossfaded by `speak`, and a sigh that takes over while it runs. `settle` (0..1) is the
 * shoulders letting go during the sigh's exhale.
 */
const breathValue = (
  L: number,
  speak: number,
  sigh: ((f: number) => number) | undefined,
  sf: number,
): { b: number; settle: number } => {
  let b = lerpN(calmBreath(L), speechBreath(L), speak);
  let settle = 0;
  if (sigh) {
    // Sigh weight: full from 8 frames before the sigh rises until about 30 frames after it ends.
    let win = 0;
    for (let k = -30; k <= 8; k += 2) win = Math.max(win, clampN(sigh(sf + k), 0, 1));
    const w = easeSin(win / 0.12);
    if (w > 0) {
      const sv = clampN(sigh(sf), 0, 1);
      b = lerpN(b, SIGH_DEPTH * sv, w);
      const falling = clampN((clampN(sigh(sf - 12), 0, 1) - sv) * 4, 0, 1);
      settle = w * easeSin(falling) * (1 - 0.6 * sv);
    }
  }
  return { b, settle };
};

const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

export type SeatedExpression = "serene" | "joyful" | "thoughtful" | "compassionate" | "playful";

/** Expression used when the `expression` prop is not set. */
export const POSE_EXPRESSION: Record<SeatedPose, SeatedExpression> = {
  sitCross: "serene",
  idle: "serene",
  pour: "serene",
  pickLeaf: "serene",
  placeFlowerOnFoot: "serene",
  bless: "compassionate",
  bowHands: "compassionate",
  palmRaise: "compassionate",
  lookUp: "thoughtful",
  reaction: "playful",
};

/** Expression weights; serene is what is left (all zero = serene). */
interface ExprW {
  joy: number;
  thought: number;
  comp: number;
  play: number;
}
const exprVec = (e: SeatedExpression): ExprW => ({
  joy: e === "joyful" ? 1 : 0,
  thought: e === "thoughtful" ? 1 : 0,
  comp: e === "compassionate" ? 1 : 0,
  play: e === "playful" ? 1 : 0,
});

interface V {
  x: number;
  y: number;
}

interface Prop {
  x: number;
  y: number;
  opacity: number;
  /** Held in the near hand: drawn in the fingers of the drawn (lagged) hand instead of at x, y. */
  held?: boolean;
}

/** Options for the pose solver that come from props. */
interface SolveOpts {
  footFlowers?: number;
  basketAt: V;
  /** Life clock offset (lifeF - f): the idle lean drift and the resting hands' drift run on f + lifeOff. */
  lifeOff?: number;
}

interface Solve {
  lean: number;
  headTilt: number;
  eyeUp: number;
  eyeDown: number;
  front: V;
  back: V;
  /** Unit vector from the wrist toward the fingertips. */
  frontDir: V;
  backDir: V;
  /** 0 = fingers pressed together, 1 = fingers apart. */
  spread: number;
  /** Finger curl of the near (front) and far (back) hands: 0 = straight, 1 = loosely closed. Default 0.3. */
  curl?: number;
  curlB?: number;
  /** Shared-Hand shape and wrist turn (radians, see Hand.tsx) of the near and far hands. Default: relaxed. */
  shapeF?: HandShape;
  shapeB?: HandShape;
  turnF?: number;
  turnB?: number;
  /** 0..1: the palms are joined at the chest (pranam). The far forearm and hand then come in front of the chest. */
  joinW?: number;
  /** Point (figure units) the eyes look at, with its weight 0..1 against the default gaze. */
  gazeAt?: V;
  gazeW?: number;
  /** Pot in the near hand; `opacity` (default 1) fades it while the pour pose blends in or out. */
  pot?: { tilt: number; opacity?: number };
  leaf?: Prop;
  flower?: Prop;
}

/* ------------------------------------------------------------------ */
/* Palette                                                              */
/* ------------------------------------------------------------------ */

// Warm, luminous child skin that still separates from the warm wall.
const SKIN = "#c68b5c";
const SKIN_LIT = "#dca474"; // lit side of the round forms (forehead, cheeks, chest)
const SKIN_FAR = "#ab7046";
const SKIN_SHADE = "#83522f";
const SKIN_DEEP = "#5c361e";
const SKIN_UNDER = "#2e1a0d"; // deepest core shade, used for contact shadows
const RIM = "#f8d6a2"; // warm rim light on the shoulders and top of the head
const SOLE_NEAR = "#a46a3f"; // sole of the near foot: a shade darker than the skin
const SOLE_FAR = "#804e2b"; // sole of the far foot
const HAIR = "#1c130e";
const HAIR_HI = "#5a4232";
const HAIR_SHEEN = "#a08068";
// Cream cotton for the dhoti and the uttariya.
const CLOTH_LIT = "#fffaf0";
const CLOTH = "#f6efdf";
const CLOTH_MID = "#e7dcc3";
const CLOTH_FOLD = "#d3c4a4";
const CLOTH_SHADE = "#c4b290";
const CLOTH_INNER = "#a99372"; // the slightly darker inner side of a turned fold
const EYE_WHITE = "#fcf8ee";
const EYE_SHADE = "#d9c7b0"; // soft shadow cast by the upper lid on the eye white
const IRIS = "#2d1a0f";
const IRIS_RING = "#7a4a28"; // warm lower half of the iris, keeps the eyes bright
const PUPIL = "#0d0704";
const LASH = "#23130b";
const BROW = "#3a2417";
const MOUTH = "#8e4636";
const MOUTH_DARK = "#4a2016";
const MOUTH_INNER = "#c86a58";
const LIP = "#d98b74";
const BLUSH = "#ec8c80";
const BRASS = "#c48a2e";
const BRASS_DARK = "#8c5a1b";
const WATER = "#9fd0e4";
const LEAF = "#5f9a46";
const LEAF_DARK = "#3f6e2e";
// Red hibiscus (জবা): broad crimson-red petals, a dark wine centre, a long red staminal column with a yellow tip.
const HIB_LIGHT = "#f0473f"; // lit outer petal
const HIB_RED = "#d81f26";
const HIB_DEEP = "#9c0f1a"; // petal base and veins
const HIB_CORE = "#5e0610"; // dark eye at the centre
const HIB_EDGE = "#7d0c16"; // soft edge line
const HIB_COLUMN = "#c8202c";
const HIB_POLLEN = "#ffd23f";
const BASKET = "#a57240";
const BASKET_DARK = "#6e4a26";
const BASKET_RIM = "#c99a5c";
const HEAD_CLEAR = 48; // props (leaf, pot) are kept at least this far from the head centre

/** Mix two #rrggbb colours: t = 0 gives a, t = 1 gives b. */
const mixHex = (a: string, b: string, t: number): string => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};
/**
 * Shade side of a bare-skin shape (MOT-19): the same soft step the shared Hand uses for its parts
 * (skin a third of the way toward the shade), so arms, legs, feet, neck and torso read as one body with
 * his hands. Never a dark brown outline: under the lit copy it shows only as a gentle form shadow along
 * the side away from the light, and as a faint same-hue edge where skin lies over skin.
 */
const SKIN_EDGE_K = 0.34;
const skinEdge = (base: string, shade: string): string => mixHex(base, shade, SKIN_EDGE_K);

/* ------------------------------------------------------------------ */
/* Geometry (figure units, y down, ground at y = 0)                     */
/* ------------------------------------------------------------------ */

/** Unit vector (x, y) normalised. */
const unit = (x: number, y: number): V => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};

const PIVOT: V = { x: 0, y: -40 }; // hip centre; the upper body rotates about it
const UPPER = 52; // upper arm length (about 1.1 times the forearm)
const FORE = 47; // forearm length
const HEAD_K = 0.97; // head scale: a large, round child's head (about 1:3.8 of the seated figure)
const HEAD_CY = -142; // head centre relative to PIVOT (absolute y about -182), very short neck below it
const SH_FRONT: V = { x: 27, y: -97 }; // shoulder joints relative to PIVOT: narrow, soft child shoulders
const SH_BACK: V = { x: -27, y: -97 };
const DIR_DOWN = unit(0.35, 1);
// Hands resting on the knee tops, used by every pose whose hands are not busy. (Old rest wrists at hip
// height beside the dhoti read as hands on hips, or as a hand hanging in mid-air; they are gone.)
const KNEE_REST_FRONT: V = { x: 54, y: -50 };
const KNEE_REST_BACK: V = { x: -54, y: -50 };
const KNEE_DIR_FRONT = unit(0.9, 0.45); // fingers lie over the knee, pointing forward
const KNEE_DIR_BACK = unit(-0.9, 0.45);
// Hands on the hips for the reaction beat: wrists beside the waist, fingers pointing down.
const HIP_FRONT: V = { x: 40, y: -66 };
const HIP_BACK: V = { x: -40, y: -66 };
const HIP_DIR_FRONT = unit(-0.3, 1);
const HIP_DIR_BACK = unit(0.3, 1);
// Sukhasana. The near leg (knee on the -x side) has its shin on top, running across the lap to the
// +x ankle; the far leg mirrors it. Knees sit about 65 px from the hip centre, at about hip height.
const HIP_NEAR: V = { x: -12, y: -40 };
const HIP_FAR: V = { x: 12, y: -40 };
const KNEE_NEAR: V = { x: -64, y: -30 };
const KNEE_FAR: V = { x: 64, y: -30 };
const ANKLE_NEAR: V = { x: 10, y: -7 }; // ankle of the near leg; its foot lies on the +x side under FOOT_TOP
const ANKLE_FAR: V = { x: -10, y: -7 }; // ankle of the far leg; its foot lies on the -x side
// Leaf pick: the wrist stops here with the fingers pointing down, so the fingertips reach the leaf on
// the ground (LEAF_GROUND). Close enough to the near shoulder that a gentle forward lean reaches it.
const LEAF_WRIST: V = { x: 74, y: -21 };
const LEAF_GROUND: V = { x: 80, y: -5 };
const FOOT_TOP: V = { x: 22, y: -17 }; // centre of the flower when it rests on the top of the near foot
// Flowers resting on the feet (footFlowers): near foot top (where placeFlowerOnFoot lays it), the
// far foot's toes, and the crossing of the ankles. [x, y, rotation deg, scale]
const FOOT_FLOWER_SLOTS: Array<[number, number, number, number]> = [
  [22, -16, -12, 1],
  [-27, -12, 24, 0.94],
  [1, -19, 58, 0.9],
];
// The far hand rests on its knee, or slides onto the lap when the body leans forward.
const BACK_KNEE_HAND: V = { x: -50, y: -53 };
const BACK_LAP_HAND: V = { x: -16, y: -62 };
const BACK_LAP_DIR = unit(0.55, 0.84);
const BASKET_HAND: V = { x: 84, y: -26 }; // default basketAt: flower resting in the basket, and the grip point
const BASKET_RIM_Y = -17;
const POUR_TARGET: V = { x: 120, y: -2 }; // where the water lands (tulsi is drawn by the caller)

// Upper body, relative to PIVOT (unrotated). A soft five-year-old's body: narrow rounded shoulders,
// no chest muscles, a little round tummy and no waist taper.
const TORSO_REL: V[] = [
  { x: -11, y: -107 },
  { x: 11, y: -107 },
  { x: 23, y: -104.5 },
  { x: 30.5, y: -98 },
  { x: 31, y: -87 },
  { x: 27.5, y: -71 },
  { x: 28.5, y: -52 },
  { x: 30, y: -34 },
  { x: 27, y: -18 },
  { x: -27, y: -18 },
  { x: -30, y: -34 },
  { x: -28.5, y: -52 },
  { x: -27.5, y: -71 },
  { x: -31, y: -87 },
  { x: -30.5, y: -98 },
  { x: -23, y: -104.5 },
];

// Light rim along the top of the shoulders, relative to PIVOT.
const SHOULDER_RIM_REL: V[] = [
  { x: -30.5, y: -98 },
  { x: -23, y: -104.5 },
  { x: -11, y: -107 },
  { x: 11, y: -107 },
  { x: 23, y: -104.5 },
  { x: 30.5, y: -98 },
];

/*
 * Uttariya across the chest, relative to PIVOT (it rides on the upper body, so it follows the lean).
 * It starts tucked into the dhoti at the near (+x) hip, crosses the chest and goes over the far (-x)
 * shoulder, capping the top of the far arm. The lower edge is the free hem that stirs.
 */
const UTT_UPPER: V[] = [
  { x: -38.5, y: -89 },
  { x: -36, y: -98 },
  { x: -27, y: -106 },
  { x: -15, y: -109.5 },
  { x: -6, y: -107 },
  { x: 5, y: -96 },
  { x: 17, y: -82 },
  { x: 27, y: -67 },
  { x: 32.5, y: -53 },
  { x: 34, y: -38 },
];
const UTT_LOWER: V[] = [
  { x: 30, y: -27 },
  { x: 17, y: -38 },
  { x: 2, y: -52 },
  { x: -13, y: -66 },
  { x: -26, y: -77 },
  { x: -37, y: -82 },
];
/** Unit normal from the uttariya's lower hem into the cloth (up and toward the near side). */
const UTT_IN = unit(0.62, -0.78);

/* Dhoti hip wrap, relative to PIVOT: rides on the upper body and covers the waist and the hips. */
const HIP_WRAP_REL: V[] = [
  { x: -30, y: -36 },
  { x: -15, y: -37 },
  { x: 3, y: -35.5 },
  { x: 17, y: -37 },
  { x: 31, y: -36 },
  { x: 34, y: -25 },
  { x: 35, y: -15.5 },
  { x: 20, y: -12 },
  { x: 3, y: -11 },
  { x: -14, y: -12 },
  { x: -35, y: -15.5 },
  { x: -34, y: -25 },
];

/* Dhoti lap drape, absolute figure units: over the thighs, sagging between the knees. */
const LAP_PTS: V[] = [
  { x: -34, y: -64 },
  { x: 0, y: -66 },
  { x: 34, y: -64 },
  { x: 42, y: -52 },
  { x: 55, y: -43 },
  { x: 58, y: -32 },
  { x: 50, y: -23.5 },
  { x: 26, y: -20.5 },
  { x: 2, y: -19 },
  { x: -24, y: -20.5 },
  { x: -50, y: -23.5 },
  { x: -58, y: -32 },
  { x: -55, y: -43 },
  { x: -42, y: -52 },
];

/* Hair, head-local units (face circle radius 31 at the origin, features centred near x = +4). */
// Hairline curls framing a high, round child's forehead: [x, y, r].
const FRINGE: Array<[number, number, number]> = [
  [-22.5, -11, 4.6],
  [-17.5, -18.5, 5],
  [-9.5, -23, 5.3],
  [0, -25, 5.5],
  [9.5, -25, 5.4],
  [18, -22, 5],
  [25, -15.5, 4.6],
  [29.5, -8.5, 4],
];
// Curls around the crown and the back of the head: angle (deg, 180 = back, 270 = top), lock radius.
const CROWN: Array<[number, number]> = [
  [148, 7],
  [166, 8],
  [184, 8.4],
  [202, 8],
  [220, 8.6],
  [238, 8.2],
  [256, 8.6],
  [274, 8.2],
  [292, 7.8],
  [310, 7.2],
  [326, 6.4],
];
// Soft curls at the nape, behind the ear on the far side: [x, y, r].
const NAPE: Array<[number, number, number]> = [
  [-36, -6, 7],
  [-34.5, 4, 6.4],
  [-31, 12.5, 5.4],
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const pt = (p: V) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;

/** Non-periodic wobble in about -1..1, same family as the Episode 2 animal rigs. */
const wob = (f: number, seed: number, rate = 1) =>
  0.55 * Math.sin(f * 0.061 * rate + seed) +
  0.3 * Math.sin(f * 0.1543 * rate + seed * 1.31 + 0.7) +
  0.15 * Math.sin(f * 0.0227 * rate + seed * 2.17);

/** Closed Catmull-Rom spline through the points, as an SVG path. */
const smoothClosed = (pts: V[]): string => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d + "Z";
};

/** Open Catmull-Rom spline (end points repeated), as an SVG path. */
const smoothOpen = (pts: V[]): string => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
};

/* Blink schedule: fixed pseudo-random start frames, slow and calm, about every 4.5 to 7 s at 24 fps. */
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

/** 0 = eyes open, 1 = fully closed. */
const blinkAmount = (f: number): number => {
  let lo = 0;
  let hi = BLINKS.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (BLINKS[mid] <= f) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (idx < 0) return 0;
  // Each blink lasts a little differently (13 to 18 frames), so they never feel mechanical.
  const len = BLINK_LEN - 2 + ((idx * 2654435761) >>> 0) % 6;
  const u = (f - BLINKS[idx]) / len;
  if (u < 0 || u >= 1) return 0;
  // Lids lower softly, rest a moment, and rise even more slowly.
  if (u < 0.35) return smooth(u / 0.35);
  if (u < 0.45) return 1;
  return 1 - smooth((u - 0.45) / 0.55);
};

/* ------------------------------------------------------------------ */
/* Idle motion: weight shift, head glances, rest-hand swing and fidgets */
/* ------------------------------------------------------------------ */

// Pure functions of f built from seeded schedules, so nothing repeats on a loop.
// Timings assume 24 fps: 4 s = 96 frames, 7 s = 168 frames.
const IDLE_END = 40000;

const mkRng = (seed: number) => {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** Index of the last event time <= f, or -1. */
const lastAtOrBefore = (ts: number[], f: number): number => {
  let lo = 0;
  let hi = ts.length - 1;
  let idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] <= f) {
      idx = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return idx;
};

/**
 * Stepped random track: at each event the value eases from the previous value to a new one over
 * `ease` frames, then holds. Gaps are random in [gapMin, gapMax]. `ease` must not exceed `gapMin`,
 * so each ease finishes before the next event starts.
 */
interface Track {
  ts: number[];
  vs: number[];
  ease: number;
}
const makeTrack = (
  seed: number,
  gapMin: number,
  gapMax: number,
  ease: number,
  pick: (r: number, i: number) => number,
): Track => {
  const rnd = mkRng(seed);
  const ts = [0];
  const vs = [0];
  let t = 0;
  for (let i = 1; t < IDLE_END; i++) {
    t += gapMin + rnd() * (gapMax - gapMin);
    ts.push(t);
    vs.push(pick(rnd(), i));
  }
  return { ts, vs, ease };
};

const trackAt = (tr: Track, f: number): number => {
  const i = lastAtOrBefore(tr.ts, f);
  if (i < 0) return 0;
  const prev = i > 0 ? tr.vs[i - 1] : 0;
  return lerp(prev, tr.vs[i], smooth((f - tr.ts[i]) / tr.ease));
};

/** Hip weight shift: every 4 to 6 s, alternating sides, value about -1.33..1.33 (times 3 px). */
const WEIGHT_TRACK = makeTrack(101, 96, 144, 36, (r, i) => (i % 2 ? 1 : -1) * (0.67 + 0.66 * r));
/** Rest-hand swing from the shoulder, slow and continuous. */
const SWING_F_TRACK = makeTrack(211, 60, 110, 60, (r) => 2 * r - 1);
const SWING_B_TRACK = makeTrack(313, 60, 110, 60, (r) => 2 * r - 1);
/** Small quick fidgets on the knees (eased over 14 frames, every 1.7 to 3.7 s). */
const FIDGET_F_TRACK = makeTrack(409, 40, 90, 14, (r) => 2 * r - 1);
const FIDGET_B_TRACK = makeTrack(517, 50, 110, 14, (r) => 2 * r - 1);
/** Saccades: tiny quick eye jumps (3 frames) every 0.6 to 2 s, then the eyes hold still. */
const SACC_X_TRACK = makeTrack(619, 14, 48, 3, (r) => 2 * r - 1);
const SACC_Y_TRACK = makeTrack(727, 14, 48, 3, (r) => 2 * r - 1);
/** Finger curl drift of the resting hands: slow, unhurried curl and uncurl. */
const CURL_F_TRACK = makeTrack(839, 50, 120, 40, (r) => r);
const CURL_B_TRACK = makeTrack(941, 60, 130, 40, (r) => r);

/** The eyes move this many frames before the head. */
const EYE_LEAD = 4;
const GLANCE_RISE = 10; // frames for the head to turn out
const GLANCE_FALL = 12; // frames for the head to come back

interface Glance {
  t: number;
  deg: number;
  hold: number;
  toTulsi: boolean;
  side: number;
}
/** Glances start 4 to 7 s apart; the longest lasts 73 frames, so two never overlap. */
const GLANCES: Glance[] = (() => {
  const rnd = mkRng(733);
  const out: Glance[] = [];
  let t = 72;
  while (t < IDLE_END) {
    const toTulsi = rnd() < 0.5;
    out.push({
      t,
      deg: toTulsi ? 6 + 4 * rnd() : 5 + 4 * rnd(),
      hold: 30 + Math.floor(22 * rnd()),
      toTulsi,
      side: rnd() < 0.5 ? -1 : 1,
    });
    t += 96 + rnd() * 72;
  }
  return out;
})();
const GLANCE_TS = GLANCES.map((g) => g.t);

/**
 * Head glance in degrees, positive toward the figure's front (the tulsi side). A tulsi glance
 * always turns +x; a speaker glance turns toward the side of `look` (or a fixed random side when
 * look is 0). Rises, holds, and returns.
 */
const glanceDeg = (f: number, look: number): number => {
  const i = lastAtOrBefore(GLANCE_TS, f);
  if (i < 0) return 0;
  const g = GLANCES[i];
  const u = f - g.t;
  let env = 1;
  if (u < GLANCE_RISE) env = smooth(u / GLANCE_RISE);
  else if (u > GLANCE_RISE + g.hold) env = 1 - smooth((u - GLANCE_RISE - g.hold) / GLANCE_FALL);
  const side = g.toTulsi ? 1 : look !== 0 ? Math.sign(look) : g.side;
  return side * g.deg * env;
};

const SH_ABS_FRONT: V = { x: PIVOT.x + SH_FRONT.x, y: PIVOT.y + SH_FRONT.y };
const SH_ABS_BACK: V = { x: PIVOT.x + SH_BACK.x, y: PIVOT.y + SH_BACK.y };

/**
 * Resting wrist target: swung about the shoulder (up to about 2 degrees, about 2 px at the wrist),
 * plus a fidget nudge of up to 1 px.
 */
const restTarget = (rest: V, shoulder: V, swing: number, fidget: number): V => {
  const a = 0.035 * swing;
  const vx = rest.x - shoulder.x;
  const vy = rest.y - shoulder.y;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  return {
    x: shoulder.x + vx * ca - vy * sa + 0.8 * fidget,
    y: shoulder.y + vx * sa + vy * ca + 0.5 * fidget,
  };
};

/** Finger direction on the knee, tilted by up to about 4 degrees. */
const fidgetDir = (dir: V, fidget: number): V => {
  const a = 0.07 * fidget;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  return unit(dir.x * ca - dir.y * sa, dir.x * sa + dir.y * ca);
};

/* ------------------------------------------------------------------ */
/* Shared Hand (MOT-19): shapes and wrist turns                         */
/* ------------------------------------------------------------------ */

/** Default wrist turn of each Hand preset (mirrors Hand.tsx), used when a pose sets a shape but no turn. */
const SHAPE_TURN: Record<HandShape, number> = {
  relaxed: -2.3,
  open: 0,
  point: -2.0,
  fist: -2.2,
  hold: -1.85,
  pranam: 2.0,
  abhaya: 0,
  cup: 0.15,
};
/** Resting hand over the knee: back of the hand up, seen three-quarter, thumb toward the body and the camera. */
const REST_TURN = -2.35;
/** Finger curl at which each shape is drawn as authored: Solve.curl above or below it becomes Hand's `flex`. */
const SHAPE_CURL: Record<HandShape, [number, number]> = {
  // [curl at flex 0, flex per unit of curl]
  relaxed: [0.3, 13],
  open: [0.07, 6],
  point: [0.3, 0],
  fist: [1, 0],
  hold: [0.62, 4],
  pranam: [0.03, 4],
  abhaya: [0.07, 6],
  cup: [0.45, 6],
};
/** Hand while reaching, gripping and letting go: open with straight fingers, hooked round a held stem, or relaxed. */
const workShape = (curl: number, holding: boolean): HandShape => (holding ? "hold" : curl < 0.17 ? "open" : "relaxed");

/** Wrap an angle to (-PI, PI]. */
const wrapA = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
/** Blend two wrist turns along the shorter arc. */
const lerpA = (a: number, b: number, t: number) => a + wrapA(b - a) * t;

/** Both hands resting: wrists swing and fingers fidget, with the near hand at `frontBase`. */
const restHands = (
  f: number,
  frontBase: V,
): Pick<Solve, "front" | "back" | "frontDir" | "backDir" | "spread" | "curl" | "curlB" | "shapeF" | "shapeB" | "turnF" | "turnB"> => {
  const fF = trackAt(FIDGET_F_TRACK, f);
  const fB = trackAt(FIDGET_B_TRACK, f);
  return {
    front: restTarget(frontBase, SH_ABS_FRONT, trackAt(SWING_F_TRACK, f), fF),
    back: restTarget(KNEE_REST_BACK, SH_ABS_BACK, trackAt(SWING_B_TRACK, f), fB),
    frontDir: fidgetDir(KNEE_DIR_FRONT, fF),
    backDir: fidgetDir(KNEE_DIR_BACK, fB),
    spread: 1 - 0.12 * Math.abs(fF),
    // Relaxed fingers draped over the knee; a fidget briefly opens them.
    curl: clamp(0.24 + 0.26 * trackAt(CURL_F_TRACK, f) - 0.12 * Math.abs(fF), 0.05, 0.6),
    curlB: clamp(0.26 + 0.24 * trackAt(CURL_B_TRACK, f) - 0.1 * Math.abs(fB), 0.05, 0.6),
    shapeF: "relaxed",
    shapeB: "relaxed",
    turnF: REST_TURN + 0.08 * fF,
    turnB: REST_TURN + 0.08 * fB,
  };
};

/**
 * Two-bone IK. `side` picks the elbow bend: +1 bends to the +x side, -1 to the -x side.
 * Upper arm and forearm lengths differ (upper is about 1.1 times the forearm).
 */
const ik = (S: V, T: V, side: number): { E: V; H: V } => {
  let dx = T.x - S.x;
  let dy = T.y - S.y;
  let d = Math.hypot(dx, dy);
  const minD = Math.abs(UPPER - FORE) + 0.5;
  const maxD = UPPER + FORE - 0.5;
  if (d > maxD) {
    dx *= maxD / d;
    dy *= maxD / d;
    d = maxD;
  }
  if (d < minD) {
    const k = d < 0.01 ? 0 : minD / d;
    dx = d < 0.01 ? 0 : dx * k;
    dy = d < 0.01 ? minD : dy * k;
    d = minD;
  }
  const ux = dx / d;
  const uy = dy / d;
  const a = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(UPPER * UPPER - a * a, 0));
  const bx = S.x + ux * a;
  const by = S.y + uy * a;
  const c1 = { x: bx - uy * h, y: by + ux * h };
  const c2 = { x: bx + uy * h, y: by - ux * h };
  const E = side * c1.x >= side * c2.x ? c1 : c2;
  return { E, H: { x: S.x + dx, y: S.y + dy } };
};

/** Pose solver: lean, head angle, eyes and hand targets for each pose at frame f. */
function solve(pose: SeatedPose, f: number, breath: number, poseStart: number, opts: SolveOpts): Solve {
  // Idle drift runs on the life clock. The breath never tilts or bobs the body (MOT-20): it only
  // lifts the chest and shoulders (see mkUp), and hands held at the chest ride up with it.
  const fl = f + (opts.lifeOff ?? 0);
  const jitter = wob(fl, 3.1);
  const idleLean = 3 + 0.8 * jitter;
  const bN = clamp(breath, 0, 2.4);
  // Slow sway of the raised hand, about 6 s per cycle, small amplitude.
  const slowSway = Math.sin(f * 0.0415 + 0.4);
  // The far hand at rest: on its knee when upright, sliding onto the lap as the body leans forward
  // (w = 0..1), with a slow small drift so it never freezes.
  const backRest = (w: number): Pick<Solve, "back" | "backDir" | "shapeB" | "turnB"> => {
    const k = smooth(w);
    const p = lerpV(BACK_KNEE_HAND, BACK_LAP_HAND, k);
    return {
      back: { x: p.x + 0.8 * wob(fl, 21.7, 0.5), y: p.y + 0.5 * wob(fl, 23.1, 0.5) },
      backDir: unit(lerp(KNEE_DIR_BACK.x, BACK_LAP_DIR.x, k), lerp(KNEE_DIR_BACK.y, BACK_LAP_DIR.y, k)),
      shapeB: "relaxed",
      turnB: REST_TURN,
    };
  };

  switch (pose) {
    case "pour": {
      // Pour cycle: the pot tips over the plant, rights itself, tips again.
      const cyc = 0.5 + 0.5 * Math.sin((f * 2 * Math.PI) / 210 + 0.8 + 0.3 * wob(f, 1.2));
      const tilt = 10 + 50 * smooth((cyc - 0.35) / 0.4);
      return {
        lean: 9,
        headTilt: -4 + 2 * wob(f, 6.2),
        eyeUp: 0,
        eyeDown: 0.2,
        front: { x: 88, y: -112 },
        ...backRest(0),
        frontDir: unit(0.6, -0.8),
        spread: 1,
        curl: 0.72, // fingers round the pot's neck
        curlB: 0.32,
        shapeF: "hold", // fingers hooked round the neck, thumb over it, seen from the thumb side
        turnF: SHAPE_TURN.hold,
        gazeAt: POUR_TARGET, // watches the water reach the tulsi
        gazeW: 0.85,
        pot: { tilt },
      };
    }
    case "pickLeaf": {
      // Reach down to the leaf, pick it up, bring it back to the knee. A gentle forward bend (about
      // 24 degrees at most), not a hard sideways lean: the fingertips reach the ground, not the wrist.
      const p = frac((f + 12 * wob(f, 0.4)) / 340);
      const r = smooth(p / 0.3) * (1 - smooth((p - 0.6) / 0.2));
      const front = lerpV(KNEE_REST_FRONT, LEAF_WRIST, r);
      const lean = idleLean + 21 * r;
      const leaf: Prop | undefined =
        p < 0.32
          ? { x: LEAF_GROUND.x, y: LEAF_GROUND.y, opacity: 1 }
          : p < 0.8
            ? { x: front.x, y: front.y, opacity: 1, held: true }
            : undefined;
      // Fingers open on the way down, close on the leaf, and relax once it is back at the knee.
      const holding = smooth((p - 0.27) / 0.06) * (1 - smooth((p - 0.78) / 0.05));
      return {
        lean,
        headTilt: -0.45 * lean + 2 * jitter,
        eyeUp: 0,
        eyeDown: 0.6 * r,
        front,
        ...backRest(0.8 * r),
        frontDir: unit(lerp(KNEE_DIR_FRONT.x, DIR_DOWN.x, r), lerp(KNEE_DIR_FRONT.y, DIR_DOWN.y, r)),
        spread: 1,
        curl: lerp(0.3, 0.06, r * (1 - holding)) + 0.5 * holding,
        curlB: 0.3,
        shapeF: workShape(lerp(0.3, 0.06, r * (1 - holding)) + 0.5 * holding, holding > 0.5),
        turnF: REST_TURN,
        gazeAt: leaf ? { x: leaf.held ? front.x + 6 : leaf.x, y: leaf.held ? front.y + 12 : leaf.y } : front,
        gazeW: 0.35 + 0.6 * r,
        leaf,
      };
    }
    case "placeFlowerOnFoot": {
      // Local clock from the start of this pose (t = 0 at poseStart):
      //   0 to 10    reach into the basket
      //   10 to 14   grip the flower in the basket
      //   14 to 24   carry it to the top of the foot (its foot-flower slot)
      // Without footFlowers (the old beat):
      //   24 to 50   flower rests on the foot top; hand holds it there
      //   50 to 64   hand carries the flower back toward the basket
      //   64 onward  flower dropped in the basket, hand withdraws to the knee
      // With footFlowers (the scene keeps the flowers on the feet):
      //   24 to 30   fingers open and let go; the flower stays on the foot
      //   30 to 44   hand returns to the knee
      const t = f - poseStart;
      const B = opts.basketAt;
      const keep = opts.footFlowers !== undefined;
      // The slot this flower goes to: the next empty one while carrying, the newest one after laying it.
      const nFl = opts.footFlowers ?? 0;
      const slotIdx = clamp(t < 24 ? Math.floor(nFl + 1e-6) : Math.ceil(nFl - 1e-6) - 1, 0, 2);
      const sl = FOOT_FLOWER_SLOTS[slotIdx];
      const place: V = keep ? { x: sl[0], y: sl[1] } : FOOT_TOP;
      // The wrist stays a little above and behind the flower, so the fingers hold it.
      const placeW: V = { x: place.x - 3, y: place.y - 9 };
      const basketW: V = { x: B.x - 3, y: B.y - 8 };
      let front: V;
      if (t < 0) front = KNEE_REST_FRONT;
      else if (t < 10) front = lerpV(KNEE_REST_FRONT, basketW, smooth(t / 10));
      else if (t < 14) front = basketW;
      else if (t < 24) front = lerpV(basketW, placeW, smooth((t - 14) / 10));
      else if (keep) {
        const lift = { x: placeW.x + 2, y: placeW.y - 6 };
        front =
          t < 30
            ? lerpV(placeW, lift, smooth((t - 24) / 6))
            : lerpV(lift, KNEE_REST_FRONT, smooth((t - 30) / 14));
      } else if (t < 50) front = placeW;
      else if (t < 64) front = lerpV(placeW, basketW, smooth((t - 50) / 14));
      else front = lerpV(basketW, KNEE_REST_FRONT, smooth((t - 64) / 8));
      // Lean weight: bent gently over while reaching the basket and the foot, upright otherwise.
      const w = keep
        ? smooth(t / 10) * (1 - smooth((t - 26) / 16))
        : smooth(t / 10) * (1 - smooth((t - 54) / 12));
      const lean = idleLean + 26 * w;
      let flower: Prop | undefined;
      if (keep) {
        // In the basket until gripped, then in the hand; laid on the foot at t = 24, where the
        // footFlowers slot takes over.
        if (t < 24) {
          const inHand = t >= 12;
          flower = inHand
            ? { x: front.x, y: front.y, opacity: 1, held: true }
            : { x: B.x, y: B.y, opacity: smooth((t - 4) / 6) };
        }
      } else {
        const atRest = t < 14 || t >= 64;
        const restOp = t < 14 ? smooth((t - 4) / 6) : 1 - smooth((t - 64) / 5);
        flower =
          t >= 24 && t < 50
            ? { x: FOOT_TOP.x, y: FOOT_TOP.y, opacity: 1 }
            : atRest
              ? { x: B.x, y: B.y, opacity: restOp }
              : { x: front.x, y: front.y, opacity: 1, held: true };
      }
      // Fingers: open while reaching (0-10), close on the stem (10-14), hold until letting go, open,
      // then relax back to rest on the way to the knee.
      const relT = keep ? 24 : 64;
      let curl = 0.3;
      if (t >= 0 && t < 10) curl = lerp(0.3, 0.08, smooth(t / 10));
      else if (t >= 10 && t < 14) curl = lerp(0.08, 0.62, smooth((t - 10) / 4));
      else if (t >= 14 && t < relT) curl = 0.62;
      else if (t >= relT && t < relT + 4) curl = lerp(0.62, 0.1, smooth((t - relT) / 4));
      else if (t >= relT + 4) curl = lerp(0.1, 0.3, smooth((t - relT - 4) / 10));
      const gaze = flower ? (flower.held ? { x: front.x + 4, y: front.y + 9 } : { x: flower.x, y: flower.y }) : place;
      return {
        lean,
        headTilt: -0.4 * lean + 14 * w,
        eyeUp: 0,
        eyeDown: 0.5 * w,
        front,
        ...backRest(0.85 * w),
        frontDir: unit(lerp(KNEE_DIR_FRONT.x, DIR_DOWN.x, w), lerp(KNEE_DIR_FRONT.y, DIR_DOWN.y, w)),
        spread: 1,
        curl,
        curlB: 0.3,
        shapeF: workShape(curl, !!flower?.held && curl > 0.4),
        turnF: REST_TURN,
        gazeAt: gaze, // the eyes stay on the flower
        gazeW: 0.9 * w,
        flower,
      };
    }
    case "bless":
      // Namaste: both palms pressed together at the chest, fingers up, elbows slightly out.
      return {
        lean: 3,
        headTilt: 2 * wob(f, 4.7),
        eyeUp: 0,
        eyeDown: 0.25,
        front: { x: 4.5, y: -113 - 0.6 * bN },
        back: { x: -4.5, y: -113 - 0.6 * bN },
        frontDir: unit(-0.25, -1),
        backDir: unit(0.25, -1),
        spread: 0.3,
        curl: 0.03, // palms and fingers pressed flat together
        curlB: 0.03,
        // Prayer hands: palm to palm, thumbs toward the chest, the little-finger edge and a little of
        // the back of each hand toward the camera.
        shapeF: "pranam",
        shapeB: "pranam",
        turnF: SHAPE_TURN.pranam,
        turnB: SHAPE_TURN.pranam,
        joinW: 1,
      };
    case "bowHands":
      // Same joined palms at the chest, head dips a little.
      return {
        lean: 6,
        headTilt: 8 + 2 * wob(f, 2.2),
        eyeUp: 0,
        eyeDown: 0.45,
        front: { x: 4.5, y: -112 - 0.6 * bN },
        back: { x: -4.5, y: -112 - 0.6 * bN },
        frontDir: unit(-0.25, -1),
        backDir: unit(0.25, -1),
        spread: 0.3,
        curl: 0.03, // palms and fingers pressed flat together
        curlB: 0.03,
        // Prayer hands: palm to palm, thumbs toward the chest, the little-finger edge and a little of
        // the back of each hand toward the camera.
        shapeF: "pranam",
        shapeB: "pranam",
        turnF: SHAPE_TURN.pranam,
        turnB: SHAPE_TURN.pranam,
        joinW: 1,
      };
    case "palmRaise":
      // Blessing, not a wave: near forearm rises from the knee to chest height, palm up and
      // facing out, fingers together. Held steady with a very small slow sway.
      return {
        lean: 2,
        headTilt: 2 * wob(f, 5.2),
        eyeUp: 0,
        eyeDown: 0,
        front: { x: 22 + 1.2 * slowSway, y: -124 - 0.6 * bN },
        ...backRest(0),
        frontDir: unit(0.05, -1),
        spread: 0.25,
        curl: 0.07 + 0.03 * wob(f, 13.4, 0.4), // an open palm, fingers softly together
        curlB: 0.3,
        // Blessing palm to the camera, turned a little toward the girls on his right (thumb toward his
        // midline, as a raised left palm has it).
        shapeF: "abhaya",
        turnF: -0.3,
      };
    case "lookUp":
      // Looking up in thought, head tipped up. Both hands stay on the knees.
      return {
        lean: 1,
        headTilt: -24 + 3 * wob(f, 2.9),
        eyeUp: 1,
        eyeDown: 0,
        ...restHands(fl, KNEE_REST_FRONT),
      };
    case "reaction": {
      // Playful "what?" beat, self-timed from poseStart: both hands go to the hips in 6 frames, hold
      // about 20 frames, and return to the knees over 12 frames. Stays on the knees after that.
      const t = f - poseStart;
      const w = smooth(t / 6) * (1 - smooth((t - 26) / 12));
      const rest = restHands(fl, KNEE_REST_FRONT);
      return {
        lean: 2,
        headTilt: 6 * w,
        eyeUp: 0.5 * w,
        eyeDown: 0,
        front: lerpV(rest.front, HIP_FRONT, w),
        back: lerpV(rest.back, HIP_BACK, w),
        frontDir: unit(lerp(rest.frontDir.x, HIP_DIR_FRONT.x, w), lerp(rest.frontDir.y, HIP_DIR_FRONT.y, w)),
        backDir: unit(lerp(rest.backDir.x, HIP_DIR_BACK.x, w), lerp(rest.backDir.y, HIP_DIR_BACK.y, w)),
        spread: lerp(rest.spread, 0.6, w),
        curl: lerp(rest.curl ?? 0.3, 0.22, w),
        curlB: lerp(rest.curlB ?? 0.3, 0.22, w),
        shapeF: "relaxed",
        shapeB: "relaxed",
        // On the hips the backs of the hands face out, fingers down.
        turnF: lerpA(rest.turnF ?? REST_TURN, -2.7, w),
        turnB: lerpA(rest.turnB ?? REST_TURN, -2.7, w),
      };
    }
    case "idle":
      return {
        lean: 2,
        headTilt: 3 * wob(f, 7.3),
        eyeUp: 0.2 * Math.max(0, wob(f, 9.2)),
        eyeDown: 0,
        ...restHands(fl, { x: KNEE_REST_FRONT.x, y: KNEE_REST_FRONT.y + 2 * wob(f, 8.1) }),
      };
    default:
      // sitCross: upright, hands on knees, a slight forward lean with a slow idle drift.
      return {
        lean: idleLean,
        headTilt: 1.5 * wob(f, 5.9),
        eyeUp: 0,
        eyeDown: 0,
        ...restHands(fl, KNEE_REST_FRONT),
      };
  }
}

const frac = (v: number) => v - Math.floor(v);

/** Blend between two solved poses. e = 0 gives `a`, e = 1 gives `b`. */
const blendSolve = (a: Solve, b: Solve, e: number): Solve => {
  const pickProp = (p?: Prop, q?: Prop): Prop | undefined => {
    if (p && q)
      return {
        x: lerp(p.x, q.x, e),
        y: lerp(p.y, q.y, e),
        opacity: lerp(p.opacity, q.opacity, e),
        held: e < 0.5 ? p.held : q.held,
      };
    if (q) return { ...q, opacity: q.opacity * e };
    if (p) return { ...p, opacity: p.opacity * (1 - e) };
    return undefined;
  };
  const tiltA = a.pot ? a.pot.tilt : 0;
  const tiltB = b.pot ? b.pot.tilt : 0;
  return {
    lean: lerp(a.lean, b.lean, e),
    headTilt: lerp(a.headTilt, b.headTilt, e),
    eyeUp: lerp(a.eyeUp, b.eyeUp, e),
    eyeDown: lerp(a.eyeDown, b.eyeDown, e),
    front: lerpV(a.front, b.front, e),
    back: lerpV(a.back, b.back, e),
    frontDir: unit(lerp(a.frontDir.x, b.frontDir.x, e), lerp(a.frontDir.y, b.frontDir.y, e)),
    backDir: unit(lerp(a.backDir.x, b.backDir.x, e), lerp(a.backDir.y, b.backDir.y, e)),
    spread: lerp(a.spread, b.spread, e),
    curl: lerp(a.curl ?? 0.3, b.curl ?? 0.3, e),
    curlB: lerp(a.curlB ?? 0.3, b.curlB ?? 0.3, e),
    // A hand shape is a replacement drawing: it swaps at the middle of the blend while the wrist turn
    // rotates continuously along the shorter arc.
    shapeF: e < 0.5 ? (a.shapeF ?? "relaxed") : (b.shapeF ?? "relaxed"),
    shapeB: e < 0.5 ? (a.shapeB ?? "relaxed") : (b.shapeB ?? "relaxed"),
    turnF: lerpA(a.turnF ?? REST_TURN, b.turnF ?? REST_TURN, e),
    turnB: lerpA(a.turnB ?? REST_TURN, b.turnB ?? REST_TURN, e),
    joinW: lerp(a.joinW ?? 0, b.joinW ?? 0, e),
    gazeAt: a.gazeAt && b.gazeAt ? lerpV(a.gazeAt, b.gazeAt, e) : (b.gazeAt ?? a.gazeAt),
    gazeW: lerp(a.gazeAt ? (a.gazeW ?? 0) : 0, b.gazeAt ? (b.gazeW ?? 0) : 0, e),
    // The pot fades out over the first half of a blend away from pour (and in over the second half of one into it).
    pot:
      a.pot || b.pot
        ? {
            tilt: lerp(tiltA, tiltB, e),
            opacity: a.pot && b.pot ? 1 : b.pot ? smooth((e - 0.5) / 0.5) : 1 - smooth(e / 0.5),
          }
        : undefined,
    leaf: pickProp(a.leaf, b.leaf),
    flower: pickProp(a.flower, b.flower),
  };
};

/* ------------------------------------------------------------------ */
/* Drawing primitives                                                    */
/* ------------------------------------------------------------------ */

/**
 * One round-ended capsule from A (radius rA) to B (radius rB), as a closed SVG subpath.
 * All capsules use the same winding, so a union of them in one path fills with nonzero rule.
 */
const capD = (A: V, B: V, rA: number, rB: number): string => {
  const len = Math.hypot(B.x - A.x, B.y - A.y) || 1;
  const ux = (B.x - A.x) / len;
  const uy = (B.y - A.y) / len;
  const nx = -uy;
  const ny = ux;
  const p = (c: V, k: number, r: number) => `${(c.x + nx * r * k).toFixed(2)} ${(c.y + ny * r * k).toFixed(2)}`;
  return (
    `M${p(A, 1, rA)} L${p(B, 1, rB)} A${rB.toFixed(2)} ${rB.toFixed(2)} 0 0 0 ${p(B, -1, rB)} ` +
    `L${p(A, -1, rA)} A${rA.toFixed(2)} ${rA.toFixed(2)} 0 0 0 ${p(A, 1, rA)} Z`
  );
};

/**
 * Tapered limb as one path: the polyline is cut into sub-capsules whose radii interpolate along the
 * chain, so knees, elbows and ankles are round and the outline is smooth (no stamped rings).
 */
const chainD = (
  pts: V[],
  radii: number[],
  o: { grow?: number; dx?: number; dy?: number; sub?: number } = {},
): string => {
  const grow = o.grow ?? 0;
  const dx = o.dx ?? 0;
  const dy = o.dy ?? 0;
  const sub = o.sub ?? 6;
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < sub; k++) {
      const t0 = k / sub;
      const t1 = (k + 1) / sub;
      const A = lerpV(pts[i], pts[i + 1], t0);
      const B = lerpV(pts[i], pts[i + 1], t1);
      const rA = radii[i] + (radii[i + 1] - radii[i]) * t0 + grow;
      const rB = radii[i] + (radii[i + 1] - radii[i]) * t1 + grow;
      d += capD(
        { x: A.x + dx, y: A.y + dy },
        { x: B.x + dx, y: B.y + dy },
        Math.max(0.2, rA),
        Math.max(0.2, rB),
      );
    }
  }
  return d;
};

/** A limb: darker base shape, then a lighter copy nudged toward the light, which leaves the shade on the underside. */
const limb = (pts: V[], radii: number[], base: string, shade: string): React.ReactElement => (
  <g>
    <path d={chainD(pts, radii)} fill={shade} />
    <path d={chainD(pts, radii, { grow: -1.1, dx: -0.8, dy: -1 })} fill={base} />
  </g>
);

/** Midpoint of a to b, pushed `amt` units along the normal: upward when `up`, otherwise downward. */
const bulgeMid = (a: V, b: V, amt: number, up: boolean): V => {
  const m = lerpV(a, b, 0.5);
  const n = unit(-(b.y - a.y), b.x - a.x);
  const sign = (up ? -1 : 1) * Math.sign(n.y);
  return { x: m.x + n.x * sign * amt, y: m.y + n.y * sign * amt };
};

/** Per-limb offsets: `grow` changes every radius, `dx` and `dy` shift the whole limb. */
interface LimbOpts {
  grow?: number;
  dx?: number;
  dy?: number;
}

/**
 * Samples a polyline with tapered radii (radii interpolate linearly along each segment) into
 * centres, radii and unit normals, with the offsets applied to the centres and radii.
 */
const sampleLimb = (pts: V[], radii: number[], o: LimbOpts = {}): { c: V[]; r: number[]; n: V[] } => {
  const grow = o.grow ?? 0;
  const dx = o.dx ?? 0;
  const dy = o.dy ?? 0;
  const per = 8;
  const c: V[] = [];
  const r: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < per; k++) {
      const t = k / per;
      c.push(lerpV(pts[i], pts[i + 1], t));
      r.push(lerp(radii[i], radii[i + 1], t));
    }
  }
  c.push(pts[pts.length - 1]);
  r.push(radii[radii.length - 1]);
  const n = c.map((_, j) => {
    const a = c[Math.max(0, j - 1)];
    const b = c[Math.min(c.length - 1, j + 1)];
    const t = unit(b.x - a.x, b.y - a.y);
    return { x: -t.y, y: t.x };
  });
  return {
    c: c.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    r: r.map((v) => Math.max(0.2, v + grow)),
    n,
  };
};

/**
 * One filled outline for a tapered limb: the left side out along the polyline, a round end cap,
 * the right side back, and a round start cap. Both caps are half circles, so this is one subpath.
 */
const limbD = (pts: V[], radii: number[], o: LimbOpts = {}): string => {
  const { c, r, n } = sampleLimb(pts, radii, o);
  const L = c.map((p, j) => ({ x: p.x + n[j].x * r[j], y: p.y + n[j].y * r[j] }));
  const R = c.map((p, j) => ({ x: p.x - n[j].x * r[j], y: p.y - n[j].y * r[j] }));
  const last = c.length - 1;
  let d = `M${pt(L[0])}`;
  for (let j = 1; j <= last; j++) d += ` L${pt(L[j])}`;
  d += ` A${r[last].toFixed(2)} ${r[last].toFixed(2)} 0 0 0 ${pt(R[last])}`;
  for (let j = last - 1; j >= 0; j--) d += ` L${pt(R[j])}`;
  return d + ` A${r[0].toFixed(2)} ${r[0].toFixed(2)} 0 0 0 ${pt(L[0])} Z`;
};

/** The upper side of a tapered limb, as an open curve (used for the lighter top edge). */
const topEdgeD = (pts: V[], radii: number[], o: LimbOpts = {}): string => {
  const { c, r, n } = sampleLimb(pts, radii, o);
  const top = c.map((p, j) => {
    const s = n[j].y <= 0 ? 1 : -1;
    return { x: p.x + s * n[j].x * r[j], y: p.y + s * n[j].y * r[j] };
  });
  return smoothOpen(top);
};

/**
 * Leg part: the shade silhouette first, then a lit copy nudged up and in. The shade is left as a
 * band along the underside, so each limb reads as one shape with its own form shadow.
 */
const legPaint = (pts: V[], radii: number[], base: string, shade: string): React.ReactElement => (
  <g>
    <path d={limbD(pts, radii)} fill={shade} />
    <path d={limbD(pts, radii, { grow: -1.4, dx: -0.6, dy: -1.3 })} fill={base} />
  </g>
);

/** Warm rim along the upper edge of a near-leg part. */
const edgeLine = (pts: V[], radii: number[]): React.ReactElement => (
  <path
    d={topEdgeD(pts, radii, { grow: -1.3 })}
    fill="none"
    stroke={RIM}
    strokeWidth={1.1}
    strokeLinecap="round"
    opacity={0.45}
  />
);

/** The lower side of a tapered limb, as an open curve (used for the core shadow line). */
const bottomEdgeD = (pts: V[], radii: number[], o: LimbOpts = {}): string => {
  const { c, r, n } = sampleLimb(pts, radii, o);
  const bot = c.map((p, j) => {
    const s = n[j].y <= 0 ? -1 : 1;
    return { x: p.x + s * n[j].x * r[j], y: p.y + s * n[j].y * r[j] };
  });
  return smoothOpen(bot);
};

/**
 * Soft, chubby child arm as ONE seamless form: shoulder, a full upper arm, an elbow that bends along
 * a soft curve (never a hinge corner) and a plump forearm narrowing to a soft wrist of radius `wristR`
 * (figure units), which matches the shared Hand's wrist in the current view (see childHand). One shade
 * silhouette and one lit fill, so no outline or colour step shows at the elbow, and no joint pivot is
 * drawn. The light side carries a warm highlight, the shadow side a soft core line, both along one
 * consistent side of the limb. The hand is drawn on top by childHand.
 */
const armPaint = (
  sh: V,
  E: V,
  H: V,
  scale: number,
  base: string,
  shade: string,
  lit: number,
  wristR: number,
  /** Draw only from this centre-line point on (6 = just past the elbow), fills only: the forearm copy. */
  from = 0,
): React.ReactElement => {
  // Centre line: straight upper arm, a quadratic curve through the elbow region, straight forearm.
  const E1 = lerpV(sh, E, 0.78);
  const E2 = lerpV(E, H, 0.24);
  const curve: V[] = [];
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const a = lerpV(E1, E, t);
    const b = lerpV(E, E2, t);
    curve.push(lerpV(a, b, t));
  }
  const pts: V[] = [sh, lerpV(sh, E1, 0.5), E1, ...curve, E2, lerpV(E2, H, 0.5), H];
  // Radii by position along the arm: shoulder 9.6, mid upper arm 8.5, elbow 7.1, forearm 6.5, then the
  // wrist, sized to the hand (about 3.5 to 5).
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = lens[lens.length - 1] || 1;
  const KEYS: Array<[number, number]> = [
    [0, 9.6],
    [0.26, 8.5],
    [0.52, 7.2],
    [0.75, 6.5],
    [1, wristR / scale],
  ];
  const rAt = (u: number): number => {
    for (let k = 1; k < KEYS.length; k++) {
      if (u <= KEYS[k][0]) {
        const [u0, r0] = KEYS[k - 1];
        const [u1, r1] = KEYS[k];
        return lerp(r0, r1, smooth((u - u0) / (u1 - u0)));
      }
    }
    return KEYS[KEYS.length - 1][1];
  };
  const radii = lens.map((l) => rAt(l / total) * scale);
  // One consistent "upper" side for the edge lines: the side whose normal points up for the whole arm.
  const main = unit(H.x - sh.x, H.y - sh.y);
  const mid = lerpV(sh, H, 0.5);
  // Bend angle at the elbow (radians): 0 = straight arm.
  const uaD = unit(E.x - sh.x, E.y - sh.y);
  const faD = unit(H.x - E.x, H.y - E.y);
  const bend = Math.acos(clamp(uaD.x * faD.x + uaD.y * faD.y, -1, 1));
  const nUp = main.x <= 0 ? 1 : -1; // the left normal (-dir.y, dir.x) points up when dir.x <= 0
  // `start`: first sample drawn (the forearm copy draws only its own part of the same lines).
  const edge = (side: number, grow: number, start = 0): string => {
    const { c, r, n } = sampleLimb(pts, radii, { grow });
    // The same side of the chain all the way along, so the line never jumps across a bent elbow.
    const k = nUp * side;
    const out = c.map((p, j) => ({ x: p.x + k * n[j].x * r[j], y: p.y + k * n[j].y * r[j] }));
    // Trim the ends so the lines fade into the shoulder and the wrist instead of capping them.
    const last = out.length - 4;
    // On the inside of a clearly bent elbow the offset line would fold over itself: there it stops
    // before the bend and starts again after it (the crease is left to the shade).
    const jE = Math.round((c.length - 1) * 0.5); // the elbow sample (E is the middle point of pts)
    const inner = (k * n[jE].x * (mid.x - E.x) + k * n[jE].y * (mid.y - E.y)) > 0;
    if (inner && bend > 0.6) {
      const cut = Math.round((c.length - 1) * (0.14 + 0.08 * Math.min(1, bend / 1.6)));
      const b1 = Math.max(4, jE - cut);
      const first = start < b1 - 1 ? smoothOpen(out.slice(Math.max(3, start), b1)) + " " : "";
      return first + smoothOpen(out.slice(Math.max(Math.min(last - 1, jE + cut), start), last));
    }
    return smoothOpen(out.slice(Math.max(3, start), last));
  };
  // MOT-19: no dark outline. The silhouette is the soft shade-side tone the shared Hand uses, the lit
  // copy nudged toward the light leaves it as a gentle form shadow on the far side; the core shade is a
  // broad, faint band (not a line) inside it, and the warm highlight runs along the lit side.
  const edgeCol = skinEdge(base, shade);
  if (from > 0) {
    const fp = pts.slice(from);
    const fr = radii.slice(from);
    return (
      <g>
        <path d={chainD(fp, fr)} fill={edgeCol} />
        <path d={chainD(fp, fr, { grow: -1.1, dx: -0.8, dy: -1 })} fill={base} />
        <path d={edge(1, -2.2, from * 8)} fill="none" stroke={SKIN_LIT} strokeWidth={1.6} strokeLinecap="round" opacity={0.3 * lit} />
        <path d={edge(-1, -2.4, from * 8)} fill="none" stroke={shade} strokeWidth={2.6} strokeLinecap="round" opacity={0.1} />
      </g>
    );
  }
  return (
    <g>
      <path d={chainD(pts, radii)} fill={edgeCol} />
      <path d={chainD(pts, radii, { grow: -1.1, dx: -0.8, dy: -1 })} fill={base} />
      <path d={edge(1, -2.2)} fill="none" stroke={SKIN_LIT} strokeWidth={1.6} strokeLinecap="round" opacity={0.3 * lit} />
      <path d={edge(-1, -2.4)} fill="none" stroke={shade} strokeWidth={2.6} strokeLinecap="round" opacity={0.1} />
    </g>
  );
};

/** Soft highlight on the top of a cloth-covered knee. */
const kneeHi = (k: V, fill: string, opacity: number): React.ReactElement => {
  const side = k.x > 0 ? 1 : -1;
  const cx = k.x - 1.5 * side;
  const cy = k.y - 4.6;
  return (
    <ellipse
      cx={cx.toFixed(2)}
      cy={cy.toFixed(2)}
      rx={4.2}
      ry={2.2}
      fill={fill}
      opacity={opacity}
      transform={`rotate(${(-18 * side).toFixed(1)} ${cx.toFixed(2)} ${cy.toFixed(2)})`}
    />
  );
};

// Thighs are drawn as the cloth over them (the dhoti is roomy, so the tube is wider than the leg).
const THIGH_R = [14, 13.2, 11.6]; // hip, middle, knee
const SHIN_R = [8.4, 7.8, 5.6]; // soft, rounded child shins: knee, calf, ankle
const NEAR_THIGH_PTS: V[] = [HIP_NEAR, bulgeMid(HIP_NEAR, KNEE_NEAR, 2.5, true), KNEE_NEAR];
const FAR_THIGH_PTS: V[] = [HIP_FAR, bulgeMid(HIP_FAR, KNEE_FAR, 2.5, true), KNEE_FAR];
const NEAR_SHIN_PTS: V[] = [KNEE_NEAR, bulgeMid(KNEE_NEAR, ANKLE_NEAR, 1.6, false), ANKLE_NEAR];
const FAR_SHIN_PTS: V[] = [KNEE_FAR, bulgeMid(KNEE_FAR, ANKLE_FAR, 1.6, false), ANKLE_FAR];

/* ------------------------------------------------------------------ */
/* Hands: the shared Hand (MOT-19) fitted to a five-year-old              */
/* ------------------------------------------------------------------ */

/** Hand scale (Hand's `L`): about 21 figure units from the wrist to the middle fingertip. */
const HAND_L = 27;
/** A child's hand: the adult model drawn a little wider and shorter (plumper palm, softer fingers). */
const HAND_SX = 1.12;
const HAND_SY = 0.95;

/**
 * Forearm radius at the wrist for a hand at wrist turn `turn`: the projected half-width of Hand's
 * wrist (half-width 0.15 L, thickness 0.22 L) in that view, plus a soft margin. So the forearm meets
 * the palm at the same width in palm, back and side views and no cuff or step shows.
 */
const wristRadius = (turn: number): number =>
  (0.15 * HAND_L * Math.abs(Math.cos(turn)) + 0.11 * HAND_L * Math.abs(Math.sin(turn))) * HAND_SX + 0.35;

/**
 * The shared Hand at the end of a forearm. `W` is the wrist (the arm's end), `dir` the unit vector
 * toward the fingertips, `side` +1 for the near arm (the screen-right arm of the front-facing child),
 * -1 for the far arm (its mirror). The hand is clipped just past its wrist line so its outline never
 * crosses the forearm, and the last few units of the forearm (`wristR`, same two-tone fill as armPaint)
 * are drawn again over the wrist, fading out along the hand: the palm grows out of the arm, no seam.
 */
const childHand = (
  id: string,
  W: V,
  dir: V,
  shape: HandShape,
  turn: number,
  side: 1 | -1,
  skin: string,
  shade: string,
  curl: number,
  wristR: number,
  /** Elbow point: the wrist blend follows the forearm up to the wrist, then the hand. */
  elbow: V,
): React.ReactElement => {
  const rot = (Math.atan2(-dir.x, dir.y) * 180) / Math.PI;
  const [c0, k] = SHAPE_CURL[shape];
  const flex = clamp((curl - c0) * k, -4, 4);
  // Wrist blend: the forearm's end from 6 units up the arm (along the forearm, so it lies exactly on
  // the arm drawn by armPaint) to 2.5 units into the hand (along the hand).
  const fa = unit(W.x - elbow.x, W.y - elbow.y);
  const A: V = { x: W.x - fa.x * 6, y: W.y - fa.y * 6 };
  const B: V = { x: W.x + dir.x * 2.5, y: W.y + dir.y * 2.5 };
  const stub = [A, W, B];
  const stubR = [wristR + 0.15, wristR, wristR * 0.96];
  return (
    <g>
      <g transform={`translate(${W.x.toFixed(2)} ${W.y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${HAND_SX} ${HAND_SY})`}>
        <defs>
          <clipPath id={id}>
            <rect x={-40} y={0.3} width={80} height={80} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <Hand shape={shape} L={HAND_L} skin={skin} shade={shade} side={side} flex={flex} turn={turn} />
        </g>
      </g>
      <defs>
        <linearGradient id={`${id}-wg`} gradientUnits="userSpaceOnUse" x1={A.x} y1={A.y} x2={B.x} y2={B.y}>
          <stop offset={0} stopColor="#fff" stopOpacity={0} />
          <stop offset={0.3} stopColor="#fff" stopOpacity={1} />
          <stop offset={0.66} stopColor="#fff" stopOpacity={1} />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
          <rect x={-400} y={-400} width={800} height={800} fill={`url(#${id}-wg)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-wm)`}>
        <path d={chainD(stub, stubR, { sub: 2 })} fill={skinEdge(skin, shade)} />
        <path d={chainD(stub, stubR, { grow: -1.1, dx: -0.8, dy: -1, sub: 2 })} fill={skin} />
      </g>
    </g>
  );
};

/**
 * Bare foot lying flat on the ground (sole at y = 0), about 36 px long and 12 px tall. The ankle
 * joint is at `ankle` (u = 0) just above the foot, heel at u = -9, toes running out along `toe`
 * (+1 right, -1 left). Heel, arch on top, a darker sole band, and five toe bumps at the front.
 */
const foot = (ankle: V, toe: number, col: string, shade: string, sole: string): React.ReactElement => {
  // u runs along the foot from the ankle (+u is the toe end); v is absolute height, sole on the ground line.
  const P = (u: number, v: number): V => ({ x: ankle.x + u * toe, y: v });
  const outline = [
    P(-9.2, -2.6), // heel bottom
    P(-9.6, -6.0), // back of heel
    P(-7.4, -9.4),
    P(-3.2, -11.2), // ankle end sits on the arch
    P(0.6, -11.8), // arch, highest point
    P(5, -10.8),
    P(10, -9.2),
    P(15, -7.2),
    P(19.4, -5.2),
    P(22.8, -3.6),
    P(24.6, -1.8), // big toe
    P(23.8, -0.3),
    P(20.5, 0), // ball of the foot on the ground
    P(13, 0),
    P(5, 0),
    P(-2, 0),
    P(-6.5, 0),
    P(-8.6, -0.7),
  ];
  // Sole: a darker band along the bottom edge.
  const soleBand = [
    P(-8.6, -0.6),
    P(-2, 0),
    P(5, 0),
    P(13, 0),
    P(20.5, 0),
    P(23.4, -0.4),
    P(21, -2.0),
    P(13, -2.1),
    P(5, -2.0),
    P(-3, -2.0),
    P(-7.2, -1.9),
  ];
  // Five toes fanning from the big toe (front, low) back and up along the top of the front edge.
  const toes: Array<[number, number, number]> = [
    [23.4, -2.1, 1.45],
    [21.9, -3.9, 1.2],
    [20.2, -5.2, 1.05],
    [18.4, -6.2, 0.95],
    [16.6, -6.9, 0.85],
  ];
  return (
    <g>
      <path d={smoothClosed(outline)} fill={skinEdge(col, shade)} />
      <path d={smoothClosed(outline.map((p) => ({ x: p.x - 0.5 * toe, y: p.y - 0.9 })))} fill={col} />
      <path d={smoothClosed(soleBand)} fill={mixHex(col, sole, 0.7)} />
      {/* Soft light along the top of the foot, and a gentle shadow under the arch */}
      <path d={smoothOpen([P(-6, -9.6), P(0.6, -10.9), P(8, -9.4), P(15, -6.8)])} fill="none" stroke={SKIN_LIT} strokeWidth={1} strokeLinecap="round" opacity={0.32} />
      <path d={smoothOpen([P(-3, -1.6), P(4, -3), P(11, -2.4)])} fill="none" stroke={shade} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
      {/* Chubby ankle: a soft fold where the shin meets the foot, and the round ankle bone */}
      <path d={smoothOpen([P(-6.6, -9.8), P(-3.2, -8.2), P(0.8, -8.7), P(3.6, -10.2)])} fill="none" stroke={shade} strokeWidth={0.7} strokeLinecap="round" opacity={0.5} />
      <circle cx={P(-3.4, -6.4).x.toFixed(2)} cy={(-6.4).toFixed(2)} r={1.5} fill={SKIN_LIT} opacity={0.18} />
      {toes.map(([u, v, r], j) => {
        const c = P(u, v);
        return (
          <g key={j}>
            <circle cx={c.x.toFixed(2)} cy={c.y.toFixed(2)} r={r * 0.95} fill={col} />
            {/* Separation behind each toe, and a faint lit nail */}
            <path
              d={`M${pt(P(u - r * 0.95, v - r * 0.2))} Q${pt(P(u - r * 0.75, v + r * 0.6))} ${pt(P(u - r * 0.2, v + r * 0.95))}`}
              fill="none"
              stroke={shade}
              strokeWidth={0.4}
              strokeLinecap="round"
              opacity={0.55}
            />
            <circle cx={P(u + r * 0.25, v - r * 0.3).x.toFixed(2)} cy={(v - r * 0.3).toFixed(2)} r={r * 0.35} fill={SKIN_LIT} opacity={0.45} />
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Red hibiscus (জবা)                                                    */
/* ------------------------------------------------------------------ */

// One broad petal pointing up (-y) from the centre, about 10.4 long and 10.6 wide, with a soft ruffled
// outer edge (five shallow scallops) and a narrow base.
const HIB_PETAL =
  "M0 0 C-2.6 -1.6 -6 -5.2 -5.3 -8.4 Q-4.6 -10.5 -3 -10.1 Q-2 -11.3 -0.6 -10.6 Q0.6 -11.6 1.7 -10.5 " +
  "Q3.2 -11.2 4.2 -9.8 Q5.8 -9.2 5.3 -7.6 C5.6 -4.8 2.4 -1.5 0 0Z";
// Veins: three soft lines from the base into the petal.
const HIB_VEINS = "M0 -1.2 Q-0.2 -5 -0.5 -8.6 M-0.4 -1.6 Q-2.2 -5 -3.6 -7.6 M0.4 -1.6 Q2.2 -4.8 3.4 -7.4";

/**
 * A red hibiscus seen from above at (x, y): five broad overlapping red petals with ruffled edges,
 * darker toward a wine-dark centre, and the long staminal column with a yellow pollen tip.
 * `gid` is the id of the petal gradient (user-space, centred on the flower). Size about 22 units across
 * at scale 1.
 */
const hibiscus = (
  x: number,
  y: number,
  scale: number,
  rot: number,
  opacity: number,
  gid: string,
  key?: string | number,
): React.ReactElement => (
  <g
    key={key}
    opacity={opacity.toFixed(3)}
    transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(1)}) scale(${scale.toFixed(3)})`}
  >
    {/* soft contact shadow */}
    <ellipse cx={0.8} cy={2.2} rx={9.5} ry={6.5} fill={SKIN_UNDER} opacity={0.16} />
    {[0, 72, 144, 216, 288].map((a, i) => (
      <g key={a} transform={`rotate(${a + (i % 2 ? 3 : -3)})`}>
        <path d={HIB_PETAL} fill={`url(#${gid})`} stroke={HIB_EDGE} strokeWidth={0.32} strokeLinejoin="round" />
        <path d={HIB_VEINS} fill="none" stroke={HIB_DEEP} strokeWidth={0.32} strokeLinecap="round" opacity={0.55} />
      </g>
    ))}
    {/* dark eye at the centre */}
    <circle r={2.6} fill={HIB_DEEP} opacity={0.85} />
    <circle r={1.5} fill={HIB_CORE} />
    {/* staminal column: long, slightly curved, red, with a yellow pollen tip */}
    <path d="M0 0 Q2.6 -5.4 6.6 -10.6" fill="none" stroke={HIB_COLUMN} strokeWidth={0.95} strokeLinecap="round" />
    <path d="M0.3 -0.6 Q2.7 -5.6 6.4 -10.2" fill="none" stroke={HIB_LIGHT} strokeWidth={0.35} strokeLinecap="round" opacity={0.7} />
    {[
      [6.9, -11.1, 0.95],
      [5.9, -10.9, 0.7],
      [7.6, -10.3, 0.7],
      [6.3, -9.7, 0.6],
      [7.4, -11.9, 0.55],
      [5.4, -9.9, 0.45],
    ].map(([px, py, pr], j) => (
      <circle key={j} cx={px} cy={py} r={pr} fill={HIB_POLLEN} />
    ))}
    <circle cx={7.1} cy={-11.4} r={0.35} fill="#fff6c8" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

/** Idle weight: full in sitCross and idle, half while pouring or picking up, none while the hands are busy. */
const CALM: Record<SeatedPose, number> = {
  sitCross: 1,
  idle: 1,
  pour: 0.5,
  pickLeaf: 0.5,
  placeFlowerOnFoot: 0,
  bless: 0,
  bowHands: 0,
  palmRaise: 0,
  lookUp: 0,
  reaction: 0,
};

/** React useId values contain ':' (or other punctuation), which breaks url(#...) references. */
const safeId = (id: string) => "sc3" + id.replace(/[^A-Za-z0-9_-]/g, "");

/** Short curved stroke helper: quadratic from a through control c to b. */
const qd = (a: V, c: V, b: V) => `M${pt(a)} Q${pt(c)} ${pt(b)}`;

/** One curly lock: a round lock with a small ringlet highlight. */
const curl = (cx: number, cy: number, r: number, key: string | number): React.ReactElement => (
  <g key={key}>
    <circle cx={cx.toFixed(2)} cy={cy.toFixed(2)} r={r.toFixed(2)} fill={HAIR} />
    <path
      d={`M${(cx - r * 0.55).toFixed(2)} ${(cy + r * 0.05).toFixed(2)} A${(r * 0.55).toFixed(2)} ${(r * 0.55).toFixed(2)} 0 0 1 ${(cx + r * 0.3).toFixed(2)} ${(cy - r * 0.5).toFixed(2)}`}
      fill="none"
      stroke={HAIR_HI}
      strokeWidth={Math.max(0.8, r * 0.2).toFixed(2)}
      strokeLinecap="round"
      opacity={0.75}
    />
  </g>
);

/**
 * Cloth over a thigh: shade silhouette, lit cloth nudged toward the light, a hem around the knee
 * end (the shin comes out from under it), two soft wrap folds near the knee and a knee highlight.
 */
const thighCloth = (pts: V[], radii: number[], base: string, shade: string, fold: string): React.ReactElement => {
  const hip = pts[0];
  const knee = pts[2];
  const d = unit(knee.x - hip.x, knee.y - hip.y);
  let n: V = { x: -d.y, y: d.x };
  if (n.y > 0) n = { x: -n.x, y: -n.y }; // n points up
  const r = radii[2];
  const at = (t: number, along: number, across: number): V => {
    const c = lerpV(pts[1], knee, t);
    return { x: c.x + d.x * along + n.x * across, y: c.y + d.y * along + n.y * across };
  };
  // Hem: an arc just inside the round knee end.
  const hemA = { x: knee.x + n.x * r * 0.92 + d.x * r * 0.1, y: knee.y + n.y * r * 0.92 + d.y * r * 0.1 };
  const hemC = { x: knee.x + d.x * r * 1.05, y: knee.y + d.y * r * 1.05 };
  const hemB = { x: knee.x - n.x * r * 0.92 + d.x * r * 0.1, y: knee.y - n.y * r * 0.92 + d.y * r * 0.1 };
  return (
    <g>
      {legPaint(pts, radii, base, shade)}
      <path d={topEdgeD(pts, radii, { grow: -1.6 })} fill="none" stroke={CLOTH_LIT} strokeWidth={1.4} strokeLinecap="round" opacity={0.8} />
      <path d={qd(at(0.35, 0, r * 0.85), at(0.35, 4, 0), at(0.35, 1, -r * 0.6))} fill="none" stroke={fold} strokeWidth={1.2} strokeLinecap="round" opacity={0.7} />
      <path d={qd(at(0.7, 0, r * 0.8), at(0.7, 3.5, -r * 0.1), at(0.7, 0.5, -r * 0.7))} fill="none" stroke={fold} strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
      <path d={qd(hemA, hemC, hemB)} fill="none" stroke={shade} strokeWidth={1.1} strokeLinecap="round" opacity={0.55} />
      {/* Round kneecap under the cloth: a soft dome of light and a crescent of shade beneath it */}
      <ellipse cx={(knee.x + n.x * r * 0.25 - d.x * 2).toFixed(2)} cy={(knee.y + n.y * r * 0.25 - d.y * 2).toFixed(2)} rx={r * 0.75} ry={r * 0.6} fill={CLOTH_LIT} opacity={0.22} />
      <path d={qd(at(1, -3, -r * 0.85), at(1, 2.5, -r * 1.05), at(1, r * 0.75, -r * 0.35))} fill="none" stroke={shade} strokeWidth={1.4} strokeLinecap="round" opacity={0.35} />
      {kneeHi(knee, CLOTH_LIT, 0.45)}
    </g>
  );
};

export const SeatedChild: React.FC<SeatedChildProps> = ({
  x,
  y,
  s = 1,
  f,
  pose = "sitCross",
  prevPose,
  flip = false,
  face,
  poseStart = 0,
  mouth = 0,
  expression,
  prevExpression,
  expressionStart,
  prevPoseStart,
  footFlowers,
  showBasket = false,
  basketAt,
  lifeF,
  talk,
  sigh,
}) => {
  // Life clock: breathing, blinks, saccades, idle eye drift, glances and idle sway run on L.
  const lifeOff = lifeF === undefined ? 0 : lifeF - f;
  const L = f + lifeOff;
  const solveOpts: SolveOpts = {
    footFlowers: footFlowers === undefined ? undefined : clamp(footFlowers, 0, FOOT_FLOWER_SLOTS.length),
    basketAt: basketAt ? { x: basketAt.x, y: basketAt.y } : BASKET_HAND,
    lifeOff,
  };
  const uid = safeId(useId());
  const look = clamp(face?.lookX ?? 0, -1, 1);
  const smileBase = clamp(face?.smile ?? 0.5, 0, 1);
  const faceDown = clamp(face?.eyesDown ?? 0, 0, 1);

  // Expression weights, blended over 18 frames from the expression being left.
  const curExpr = expression ?? POSE_EXPRESSION[pose];
  const fromExpr =
    prevExpression ?? (expression === undefined && prevPose ? POSE_EXPRESSION[prevPose] : undefined);
  const eStart = expressionStart ?? poseStart;
  const eu = fromExpr && fromExpr !== curExpr ? smooth((f - eStart) / 18) : 1;
  const ea = exprVec(fromExpr ?? curExpr);
  const eb = exprVec(curExpr);
  const ex: ExprW = {
    joy: lerp(ea.joy, eb.joy, eu),
    thought: lerp(ea.thought, eb.thought, eu),
    comp: lerp(ea.comp, eb.comp, eu),
    play: lerp(ea.play, eb.play, eu),
  };
  // A soft laugh: the mouth opens gently and breathes with an irregular rhythm. Lip-sync (mouth) wins when larger.
  const laugh = ex.joy * (0.3 + 0.07 * wob(f, 12.3, 2.2));
  const mouthOpen = clamp(Math.max(clamp(mouth, 0, 1), laugh), 0, 1);
  const smile = clamp(
    smileBase + 0.45 * ex.joy + 0.22 * ex.comp + 0.28 * ex.play - 0.3 * ex.thought + 0.03 * wob(f, 10.7, 0.3),
    0,
    1.15,
  );

  // Breathing (MOT-20): a child's breath of about 3 s, slightly irregular, quicker in than out with a
  // short rest at the bottom; shallow with small quick inhales while he speaks; an optional sigh.
  // breathAt(ff) takes a story frame; the breath itself runs on the life clock.
  const speak = clamp(talk ?? smooth(clamp(mouth, 0, 1) / 0.3), 0, 1);
  const breathAt = (ff: number) => breathValue(ff + lifeOff, speak, sigh, ff);
  const breathNow = breathAt(f);
  /** Breath amount now: 0 at rest, about 1 at a normal inhale, up to about 2.3 at the top of a sigh. */
  const bN = breathNow.b;

  // Pose, with a 16-frame ease from the previous pose when one is given.
  const solveAt = (ff: number): Solve => {
    const br = breathAt(ff).b;
    const cur = solve(pose, ff, br, poseStart, solveOpts);
    if (prevPose && prevPose !== pose) {
      const u = clamp((ff - poseStart) / 16, 0, 1);
      if (u < 1) {
        // The pose being left runs on its own clock (prevPoseStart), so at u = 0 the blend starts from
        // exactly the pose shown on the frame before the switch and keeps moving as it fades out.
        // Without prevPoseStart a timed placeFlowerOnFoot is taken at its hold point (old behaviour).
        const prevClock =
          prevPoseStart ?? (prevPose === "placeFlowerOnFoot" ? ff - 36 : poseStart);
        const prev = solve(prevPose, ff, br, prevClock, solveOpts);
        return blendSolve(prev, cur, smooth(u));
      }
    }
    return cur;
  };
  const sol = solveAt(f);
  // Overlapping action: the forearm reads the pose 3 frames late, the fingers 6, the head 5;
  // the eyes read it 2 frames early, so they arrive first.
  const before = solveAt(f - 3);
  const fingerLag = solveAt(f - 6);
  const headLag = solveAt(f - 5);
  const eyeLead = solveAt(f + 2);
  // Cloth stir: the free edges move more while the hands or the body are moving.
  const handSpeed =
    (Math.hypot(sol.front.x - before.front.x, sol.front.y - before.front.y) +
      0.6 * Math.hypot(sol.back.x - before.back.x, sol.back.y - before.back.y)) /
    3;
  const stir = clamp(0.22 * handSpeed + 0.1 * (Math.abs(sol.lean - before.lean) / 3), 0, 1.5);
  const flut = (seed: number, amp: number) => amp * ((0.35 + stir) * wob(L, seed, 1.3) + 0.3 * (bN - 0.5));

  // Calm weight eases with the pose blend. The weight shift is up to 4 px at the head and grows with height.
  const blendU = prevPose && prevPose !== pose ? clamp((f - poseStart) / 16, 0, 1) : 1;
  const calm =
    prevPose && prevPose !== pose && blendU < 1 ? lerp(CALM[prevPose], CALM[pose], smooth(blendU)) : CALM[pose];
  // The lap cloth follows the hip shift 6 frames late.
  const shiftLag = 3 * trackAt(WEIGHT_TRACK, L - 6) * calm;

  /*
   * Upper body transform at frame ff: lean about the hips, a small irregular idle sway that grows
   * toward the head (life clock), and the breath. The breath never moves the body as a whole and
   * never scales it: the shoulders rise about 0.8 units (1 px at s = 1.25) on a normal inhale, the
   * chest wall rises about 0.5 and comes forward a touch, and the head follows by about 0.35 units,
   * 4 frames late. In a sigh the shoulders settle a little below rest as he lets the breath go.
   */
  const mkUp = (leanDeg: number, ff: number) => {
    const th = (leanDeg * Math.PI) / 180;
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    const lf = ff + lifeOff;
    const sw = 1.2 * wob(lf, 0.9, 0.7) + 0.45 * wob(lf, 17.3, 0.23);
    const sh = 3 * trackAt(WEIGHT_TRACK, lf) * calm;
    const br = ff === f ? breathNow : breathAt(ff);
    const b = br.b;
    const settle = br.settle;
    const bHead = breathAt(ff - 4).b;
    return (r: V): V => {
      const h = clamp(-r.y / 106, 0, 1);
      // Shoulder caps (both sides, not the neck), the chest wall below them, and the head and neck top.
      const shoulder = clamp(1 - Math.abs(r.y + 100) / 15, 0, 1) * clamp((Math.abs(r.x) - 6) / 14, 0, 1);
      const chest = clamp(1 - Math.abs(r.y + 86) / 22, 0, 1);
      const head = clamp((-r.y - 106) / 22, 0, 1);
      const lift = 0.8 * b * shoulder + 0.5 * b * chest * (1 - shoulder) + 0.35 * bHead * head;
      const sink = 0.45 * settle * Math.max(shoulder, 0.6 * head);
      const rx = r.x + (r.x > 0 ? 0.25 * b * chest : 0);
      const ry = r.y - lift + sink;
      return {
        x: PIVOT.x + rx * cs - ry * sn + (sw + sh) * h,
        y: PIVOT.y + rx * sn + ry * cs,
      };
    };
  };
  const up = mkUp(sol.lean, f);
  const upPrev = mkUp(before.lean, f - 3);
  /** A cloth point that trails the body: pulled back toward where it was 3 frames ago by k. */
  const drag = (r: V, k: number): V => {
    const a = up(r);
    const b = upPrev(r);
    const dx = clamp((b.x - a.x) * k, -4, 4);
    const dy = clamp((b.y - a.y) * k, -4, 4);
    return { x: a.x + dx, y: a.y + dy };
  };

  // Head: a serene stillness. Very small slow drift, softened glances. It follows the pose 5 frames
  // behind the eyes, and tilts gently with the expression (a kind tilt when compassionate).
  const headTurn = 2.6 * wob(L, 2.7, 0.45) + 0.7 * calm * glanceDeg(L, look) + 4.5 * look;
  const headSway = 0.7 * Math.sin(L * 0.029 + 0.6) + 0.45 * wob(L, 8.8, 0.45);
  const headC = up({ x: 0, y: HEAD_CY });
  const exprTilt = 4 * ex.comp + 2.5 * ex.play - 2.5 * ex.thought + 1.2 * ex.joy * wob(f, 15.1, 1.4);
  const headRot = lerp(sol.headTilt, headLag.headTilt, 0.7) + headTurn + headSway + exprTilt;
  const sx = clamp(look * 2.5 + headTurn * 0.15, -3, 3);
  const eyeDown = clamp(faceDown + lerp(sol.eyeDown, eyeLead.eyeDown, 0.6), 0, 1);
  const eyeUp = lerp(sol.eyeUp, eyeLead.eyeUp, 0.6);
  // The eyes start the glance EYE_LEAD frames before the head (they read the glance curve further ahead).
  // The head carries most of a turn toward the speaker; the eyes add only a little, so a resting
  // look never reads as a sideways side-eye.
  const gazeBase = look * 1.2 + 0.2 * wob(L, 6.1, 0.6) + 0.12 * calm * glanceDeg(L + EYE_LEAD, look);
  const gyBase = 0.35 - 1.6 * eyeUp + 1.1 * eyeDown;
  // Looking at what he is working on (water, leaf, flower), in head-local terms.
  const tgtW = eyeLead.gazeAt ? clamp(eyeLead.gazeW ?? 0, 0, 1) : 0;
  let tgx = gazeBase;
  let tgy = gyBase;
  if (eyeLead.gazeAt && tgtW > 0) {
    const ang =
      Math.atan2(eyeLead.gazeAt.y - headC.y, eyeLead.gazeAt.x - headC.x) - (headRot * Math.PI) / 180;
    tgx = 2.3 * Math.cos(ang);
    tgy = 0.35 + 2 * Math.sin(ang);
  }
  // Small saccades on top; the thoughtful gaze settles slightly down (unless the pose looks up).
  const thinkDown = ex.thought * (1 - clamp(eyeUp, 0, 1)) * (1 - tgtW);
  const gazeX = clamp(lerp(gazeBase, tgx, tgtW) - 0.3 * thinkDown + 0.3 * trackAt(SACC_X_TRACK, L), -2.3, 2.3);
  const gazeY = clamp(lerp(gyBase, tgy, tgtW) + 0.9 * thinkDown + 0.22 * trackAt(SACC_Y_TRACK, L), -1.7, 2.6);
  const blink = blinkAmount(L);

  // Arms: shoulders follow the upper body (and lift a little when the hand rises), hands follow the
  // pose targets. The upper arm leads; the forearm angle trails it and the fingers trail further.
  const shoulderAt = (rel: V, tgt: V): V => {
    const p = up(rel);
    // Lifts a little when the hand rises; drops and reaches forward a little when the hand goes far down.
    const down = smooth((tgt.y - p.y - 80) / 25);
    return { x: p.x + 2 * down * clamp((tgt.x - p.x) / 12, -1, 1), y: p.y - 1.8 * smooth((p.y + 30 - tgt.y) / 30) + 3.5 * down };
  };
  const shF = shoulderAt(SH_FRONT, sol.front);
  const shB = shoulderAt(SH_BACK, sol.back);
  const overlapArm = (sh: V, tgt: V, lagTgt: V, side: number): { E: V; H: V } => {
    const now = ik(sh, tgt, side);
    const lag = ik(sh, lagTgt, side);
    const dn = unit(now.H.x - now.E.x, now.H.y - now.E.y);
    const dl = unit(lag.H.x - lag.E.x, lag.H.y - lag.E.y);
    const dd = unit(lerp(dn.x, dl.x, 0.75), lerp(dn.y, dl.y, 0.75));
    if (dd.x === 0 && dd.y === 0) return now;
    return { E: now.E, H: { x: now.E.x + dd.x * FORE, y: now.E.y + dd.y * FORE } };
  };
  const armB = overlapArm(shB, sol.back, before.back, -1);
  const armF = overlapArm(shF, sol.front, before.front, 1);
  const dirLag = (a: V, b: V) => unit(lerp(a.x, b.x, 0.55), lerp(a.y, b.y, 0.55));
  const frontDir = dirLag(sol.frontDir, fingerLag.frontDir);
  const backDir = dirLag(sol.backDir, fingerLag.backDir);
  const curlF = lerp(sol.curl ?? 0.3, fingerLag.curl ?? 0.3, 0.6);
  const curlB = lerp(sol.curlB ?? 0.3, fingerLag.curlB ?? 0.3, 0.6);
  // Shared Hand: the shape follows the lagged fingers (a replacement drawing, swapped once the trailing
  // fingers get there), the wrist turn trails like the finger direction.
  const shapeF: HandShape = (fingerLag.shapeF ?? "relaxed");
  const shapeB: HandShape = (fingerLag.shapeB ?? "relaxed");
  const turnF = lerpA(sol.turnF ?? REST_TURN, fingerLag.turnF ?? REST_TURN, 0.55);
  const turnB = lerpA(sol.turnB ?? REST_TURN, fingerLag.turnB ?? REST_TURN, 0.55);
  // Joined palms: the far forearm and hand are drawn again in front of the chest (fading in with the pose).
  const joinOp = smooth(lerp(sol.joinW ?? 0, fingerLag.joinW ?? 0, 0.5));

  const torso = TORSO_REL.map(up);
  const shoulderRim = SHOULDER_RIM_REL.map(up);
  const neckBase = up({ x: 0, y: -100 });
  const neckTop = up({ x: 0, y: -124 });

  /* ---- Uttariya (chest band and the end falling down the back) ---- */
  const lowerRel = UTT_LOWER.map((p, i) => {
    const w = i === 0 ? 0.3 : 1 - 0.12 * Math.abs(i - 3);
    const k = flut(31 + 1.7 * i, 1.1) * w;
    return { x: p.x + UTT_IN.x * k, y: p.y + UTT_IN.y * k };
  });
  const upperRel = UTT_UPPER.map((p, i) => {
    const k = flut(51 + 1.3 * i, 0.35);
    return { x: p.x - UTT_IN.x * k, y: p.y - UTT_IN.y * k };
  });
  // The free lower hem trails the body slightly; the tucked end (i = 0) stays put.
  const lowerAbs = lowerRel.map((p, i) => drag(p, i === 0 ? 0 : 0.45));
  const bandPts = [...upperRel.map(up), ...lowerAbs];
  const innerFold = [
    ...lowerAbs,
    ...lowerRel
      .map((p, i) => drag({ x: p.x + UTT_IN.x * 3.6, y: p.y + UTT_IN.y * 3.6 }, i === 0 ? 0 : 0.45))
      .reverse(),
  ];
  const bandShadow = [...lowerAbs, ...lowerAbs.map((p) => ({ x: p.x + 1.4, y: p.y + 3.2 })).reverse()];
  const relUp = (pts: V[]) => smoothOpen(pts.map(up));

  // The end over the far shoulder hangs down the back with gravity (straight down, whatever the lean),
  // and trails the body when it moves.
  const tA = up({ x: -21, y: -108 });
  const tB = up({ x: -40.5, y: -92 });
  const tBp = upPrev({ x: -40.5, y: -92 });
  const tv: V = { x: clamp((tBp.x - tB.x) * 1.3, -5, 5), y: clamp((tBp.y - tB.y) * 0.8, -3, 3) };
  const swing = 1.3 * wob(L, 4.4, 0.5) + 0.5 * (bN - 0.5) + 2.4 * stir * wob(L, 9.9, 1.6);
  const TAIL = 80;
  const tail: V[] = [
    tA,
    tB,
    { x: tB.x - 6 + 0.5 * swing + 0.5 * tv.x, y: tB.y + TAIL * 0.45 + 0.5 * tv.y },
    { x: tB.x - 8 + swing + tv.x, y: tB.y + TAIL + tv.y },
    { x: tB.x + 1 + swing + tv.x, y: tB.y + TAIL + 4 + tv.y },
    { x: tB.x + 8 + 0.9 * swing + tv.x, y: tB.y + TAIL + 1 + tv.y },
    { x: tA.x - 3 + 0.6 * swing + 0.5 * tv.x, y: tA.y + TAIL * 0.55 + 0.5 * tv.y },
  ];

  /* ---- Dhoti ---- */
  const lap = LAP_PTS.map((p, i) => (i >= 6 && i <= 10 ? { x: p.x, y: p.y + flut(71 + i, 0.45) } : p));
  const hipWrap = HIP_WRAP_REL.map(up);
  const knot = up({ x: 3, y: -33.5 });

  // Pot and water stream (pour pose).
  // Keep props clear of the head: push a point out to HEAD_CLEAR from the head centre if it is inside.
  const clearOf = (p: V): V => {
    const dx = p.x - headC.x;
    const dy = p.y - headC.y;
    const d = Math.hypot(dx, dy);
    if (d >= HEAD_CLEAR) return p;
    if (d < 1e-3) return { x: headC.x + HEAD_CLEAR, y: p.y };
    return { x: headC.x + (dx / d) * HEAD_CLEAR, y: headC.y + (dy / d) * HEAD_CLEAR };
  };
  const potCenter = clearOf({ x: armF.H.x + 4, y: armF.H.y - 7 });
  // A prop held in the near hand sits in the fingers of the drawn (lagged) hand; one lying on the
  // ground, on the foot or in the basket stays exactly where the pose puts it.
  const inFingers = (k: number): V => ({ x: armF.H.x + frontDir.x * k, y: armF.H.y + frontDir.y * k });
  const leafPos = sol.leaf ? clearOf(sol.leaf.held ? inFingers(12) : { x: sol.leaf.x, y: sol.leaf.y }) : null;
  const flowerPos: V | null = sol.flower
    ? sol.flower.held
      ? inFingers(12.5)
      : { x: sol.flower.x, y: sol.flower.y }
    : null;
  const tilt = sol.pot ? sol.pot.tilt : 0;
  const tr = (tilt * Math.PI) / 180;
  const tip: V = {
    x: potCenter.x + 20 * Math.cos(tr) + 6 * Math.sin(tr),
    y: potCenter.y + 20 * Math.sin(tr) - 6 * Math.cos(tr),
  };
  const potOpacity = sol.pot ? (sol.pot.opacity ?? 1) : 0;
  const streamOpacity = sol.pot ? smooth((tilt - 30) / 15) * potOpacity : 0;

  // Face expression shaping (head-local units).
  // Upper lids: a soft, slight lowering at rest (about 15 to 25 percent of the eye), never a heavy
  // flat lid. Joy narrows the eyes from below (cheeks), the playful eyes open a little wider.
  const lidAdd = 0.05 * ex.joy + 0.04 * ex.comp - 0.06 * ex.play + 0.05 * ex.thought;
  /** Lower lid lift: the cheeks push the lower lids up when he smiles warmly or laughs (both eyes alike). */
  const lowLift = clamp(0.9 * ex.joy + 0.25 * ex.comp + 0.3 * ex.play, 0, 1);

  /*
   * Eye: a soft, level almond opening (a child's round eye, no upswept cat-eye corner), clearly open
   * with the upper lid lowered only slightly, a large warm iris and one clear catchlight. The upper lid
   * is an arched curve whose height sets the opening; the iris is clipped to the opening, so the lid
   * shows the face skin itself. A closed eye is a soft downward curve.
   */
  const EIN = 0.5; // inner corner y
  const EOUT = 0.1; // outer corner y
  const ALMOND = `M-6.4 ${EIN} Q0 -8.9 6.4 ${EOUT} Q0 6.6 -6.4 ${EIN}Z`;
  const eyeAt = (cx: number, cy: number, idx: number, scaleX: number): React.ReactElement => {
    const gx = gazeX;
    const gy = gazeY;
    // Resting lid: about 17 percent of the opening; lowers with a downward look, lifts looking up.
    const rest = clamp(0.2 + 0.18 * eyeDown - 0.2 * eyeUp + lidAdd, 0.04, 0.9);
    const k = Math.max(rest, blink);
    const apex = lerp(-4.7, 3.6, k); // lid height at the middle of the eye
    const c = 2 * apex - (EIN + EOUT) / 2; // quadratic control point for that apex
    const lid = `M-6.4 ${EIN} Q0 ${c.toFixed(2)} 6.4 ${EOUT}`;
    // Lower lid: rises with the cheeks (a warm smile or a laugh crinkles the eyes), the same on both eyes.
    const lift = lowLift;
    const lowC = Math.max(6.6 - 3.4 * lift, c + 0.6);
    const below = `M-6.4 ${EIN} Q0 ${c.toFixed(2)} 6.4 ${EOUT} Q0 ${lowC.toFixed(2)} -6.4 ${EIN}Z`;
    const lowMid = (EIN + EOUT) / 4 + lowC / 2; // y of the lower lid at the middle of the eye
    const hlY = Math.max(gy - 1.2, apex + 1.2);
    const eId = `${uid}-e${idx}`;
    const lId = `${uid}-l${idx}`;
    return (
      <g transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${scaleX} 1)`}>
        <clipPath id={eId}>
          <path d={ALMOND} />
        </clipPath>
        <clipPath id={lId}>
          <path d={below} />
        </clipPath>
        {k < 0.92 && (
          <g clipPath={`url(#${eId})`}>
            <g clipPath={`url(#${lId})`}>
              <path d={ALMOND} fill={EYE_WHITE} />
              <ellipse cx={0} cy={apex.toFixed(2)} rx={7} ry={1.6} fill={EYE_SHADE} opacity={0.45} />
              <circle cx={gx.toFixed(2)} cy={gy.toFixed(2)} r={3.95} fill={IRIS} />
              <circle cx={gx.toFixed(2)} cy={(gy + 1.25).toFixed(2)} r={2.6} fill={IRIS_RING} opacity={0.6} />
              <circle cx={gx.toFixed(2)} cy={gy.toFixed(2)} r={1.7} fill={PUPIL} />
              <circle cx={(gx + 1.2).toFixed(2)} cy={hlY.toFixed(2)} r={1.4} fill="#ffffff" />
            </g>
          </g>
        )}
        {/* Soft upper-lid crease, fading as the lid lowers */}
        <path
          d="M-5 -4.6 Q0.4 -8.6 5.6 -4.8"
          fill="none"
          stroke={SKIN_SHADE}
          strokeWidth={0.8}
          strokeLinecap="round"
          opacity={(0.4 * (1 - k)).toFixed(3)}
        />
        {/* Lash line along the lid edge */}
        <path d={lid} fill="none" stroke={LASH} strokeWidth={k > 0.9 ? 1.4 : 1.25} strokeLinecap="round" />
        {/* Lower lid, rising with the cheek; a soft fullness of the cheek just beneath it */}
        <path
          d={`M-4.4 ${(3.3 - 1.2 * lift).toFixed(2)} Q0.2 ${(lowMid + 2.1 - 0.4 * lift).toFixed(2)} 4.8 ${(3 - 1.1 * lift).toFixed(2)}`}
          fill="none"
          stroke={SKIN_SHADE}
          strokeWidth={0.8}
          strokeLinecap="round"
          opacity={(0.28 + 0.22 * lift).toFixed(3)}
        />
        {lift > 0.02 && (
          <path
            d={`M-3.6 ${(lowMid + 3.4).toFixed(2)} Q0.4 ${(lowMid + 4.8).toFixed(2)} 4.4 ${(lowMid + 3.4).toFixed(2)}`}
            fill="none"
            stroke={SKIN_LIT}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={(0.35 * lift).toFixed(3)}
          />
        )}
        {/* Laugh crinkles at the outer corner: two tiny soft lines, only when joyful */}
        {ex.joy > 0.02 && (
          <path
            d="M7.6 0.6 Q8.9 1.4 9.2 2.8 M7.2 2.4 Q8.2 3.4 8.2 4.6"
            fill="none"
            stroke={SKIN_SHADE}
            strokeWidth={0.6}
            strokeLinecap="round"
            opacity={(0.45 * ex.joy).toFixed(3)}
          />
        )}
      </g>
    );
  };

  const flowerOpacity = sol.flower ? sol.flower.opacity : 0;
  // Flowers on the feet: whole ones for the integer part, the newest grows in with the fraction.
  const nFoot = solveOpts.footFlowers ?? 0;
  const footFlowerEls = FOOT_FLOWER_SLOTS.map(([fx0, fy0, rot, sc], i) => {
    const amt = clamp(nFoot - i, 0, 1);
    if (amt <= 0.001) return null;
    const e = smooth(amt);
    return hibiscus(fx0, fy0 - 2 * (1 - e), sc * (0.7 + 0.3 * e), rot, e, `${uid}-hib`, `ff${i}`);
  });
  const leafOpacity = sol.leaf ? sol.leaf.opacity : 0;

  // Face features (head-local units), centred near x = sx + 4.
  const fx = (v: number) => (sx + v).toFixed(2);
  // Brows: relaxed and symmetric. They lift a little in joy and when playful (bright, open face); the
  // inner ends rise very softly when compassionate (kind, never worried).
  const browLift = 1.4 * eyeUp + 0.8 * ex.joy + 0.2 * ex.thought + 0.7 * ex.play;
  const browLiftN = browLift;
  const browInner = 0.45 * ex.comp;
  // Mouth shape.
  const mW = 1 + 0.12 * ex.joy + 0.05 * ex.comp + 0.08 * ex.play - 0.1 * ex.thought; // pressed lips are a touch narrower
  const mx = (v: number) => fx(6.3 + (v - 6.3) * mW);
  const cornerUp = 0.9 * Math.max(0, smile - 0.5);
  const pressed = 0.6 * ex.thought;
  const cheekUp = 1.6 * ex.joy + 0.6 * ex.comp + 0.6 * ex.play;
  // Body detail anchors.
  const leanW = smooth((sol.lean - 10) / 25); // 0 upright, 1 bent well forward
  const farArmRaise = smooth((shB.y + 40 - sol.back.y) / 30);
  const nearArmRaise = smooth((shF.y + 40 - sol.front.y) / 30);
  const belly = up({ x: -5, y: -60 });
  const chinShade = up({ x: 2, y: -112 });

  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(flip ? -s : s).toFixed(4)} ${s.toFixed(4)})`}>
      {/* Balak glow: drawn by BirulGlow (src/episode03/rig/BirulGlow.tsx), placed by the scene. Nothing is drawn here. */}
      <defs>
        <linearGradient id={`${uid}-torso`} x1="0" y1="0" x2="1" y2="0.25">
          <stop offset="0" stopColor={SKIN_LIT} />
          <stop offset="0.5" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_FAR} />
        </linearGradient>
        <linearGradient id={`${uid}-cloth`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={CLOTH_LIT} />
          <stop offset="0.55" stopColor={CLOTH} />
          <stop offset="1" stopColor={CLOTH_MID} />
        </linearGradient>
        <radialGradient id={`${uid}-face`} gradientUnits="userSpaceOnUse" cx={-7} cy={-9} r={46}>
          <stop offset="0" stopColor={SKIN_LIT} />
          <stop offset="0.55" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_FAR} />
        </radialGradient>
        <radialGradient id={`${uid}-hib`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={11}>
          <stop offset="0" stopColor={HIB_CORE} />
          <stop offset="0.22" stopColor={HIB_DEEP} />
          <stop offset="0.55" stopColor={HIB_RED} />
          <stop offset="1" stopColor={HIB_LIGHT} />
        </radialGradient>
        <radialGradient id={`${uid}-blush`}>
          <stop offset="0" stopColor={BLUSH} stopOpacity={0.5} />
          <stop offset="0.6" stopColor={BLUSH} stopOpacity={0.22} />
          <stop offset="1" stopColor={BLUSH} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Uttariya end falling down the back, behind everything */}
      <path d={smoothClosed(tail)} fill={CLOTH_MID} />
      <path d={smoothClosed(tail.map((p) => ({ x: p.x - 1.2, y: p.y - 0.6 })))} fill={CLOTH} opacity={0.9} />
      <path
        d={smoothOpen([
          lerpV(tA, tB, 0.6),
          { x: tB.x - 2 + 0.7 * swing + 0.5 * tv.x, y: tB.y + TAIL * 0.5 + 0.5 * tv.y },
          { x: tB.x - 1 + swing + tv.x, y: tB.y + TAIL - 2 + tv.y },
        ])}
        fill="none"
        stroke={CLOTH_INNER}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.55}
      />

      {/* Bare shins and feet in depth order: far foot and shin, the near shin's cast shadow, near foot and shin */}
      {foot(ANKLE_FAR, -1, SKIN_FAR, SKIN_DEEP, SOLE_FAR)}
      {legPaint(FAR_SHIN_PTS, SHIN_R, SKIN_FAR, skinEdge(SKIN_FAR, SKIN_DEEP))}
      <path d={limbD(NEAR_SHIN_PTS, SHIN_R, { dx: 2, dy: 3, grow: 0.8 })} fill={SKIN_UNDER} opacity={0.3} />
      {foot(ANKLE_NEAR, 1, SKIN, SKIN_SHADE, SOLE_NEAR)}
      {legPaint(NEAR_SHIN_PTS, SHIN_R, SKIN, skinEdge(SKIN, SKIN_SHADE))}
      {edgeLine(NEAR_SHIN_PTS, SHIN_R)}
      {/* Round calves: a soft light on the lit side of each shin, deeper core shade below */}
      <path d={topEdgeD(FAR_SHIN_PTS, SHIN_R, { grow: -2.6 })} fill="none" stroke={SKIN} strokeWidth={1.6} strokeLinecap="round" opacity={0.28} />
      <path d={topEdgeD(NEAR_SHIN_PTS, SHIN_R, { grow: -2.8 })} fill="none" stroke={SKIN_LIT} strokeWidth={2} strokeLinecap="round" opacity={0.3} />
      <path d={bottomEdgeD(NEAR_SHIN_PTS, SHIN_R, { grow: -2.6 })} fill="none" stroke={SKIN_SHADE} strokeWidth={2.6} strokeLinecap="round" opacity={0.1} />

      {/* Dhoti: soft contact shadow on the shins, then the cloth over each thigh down to the knee */}
      <path d={limbD(FAR_THIGH_PTS, THIGH_R, { dx: 1.5, dy: 3.2, grow: 0.3 })} fill={SKIN_UNDER} opacity={0.24} />
      <path d={limbD(NEAR_THIGH_PTS, THIGH_R, { dx: 1.5, dy: 3.2, grow: 0.3 })} fill={SKIN_UNDER} opacity={0.24} />
      {thighCloth(FAR_THIGH_PTS, THIGH_R, CLOTH_MID, CLOTH_INNER, CLOTH_SHADE)}
      {thighCloth(NEAR_THIGH_PTS, THIGH_R, CLOTH, CLOTH_SHADE, CLOTH_FOLD)}

      {/* Dhoti lap drape: over the thighs, sagging between the knees, front pleats. Follows half the hip shift. */}
      <g transform={`translate(${(shiftLag * 0.5).toFixed(2)} 0)`}>
        <path d={smoothClosed(lap)} fill={CLOTH_SHADE} />
        <path d={smoothClosed(lap.map((p) => ({ x: p.x - 0.5, y: p.y - 0.8 })))} fill={`url(#${uid}-cloth)`} />
        {/* Shade on the side away from the light */}
        <path
          d={smoothClosed([{ x: 16, y: -62 }, lap[2], lap[3], lap[4], lap[5], lap[6], lap[7], { x: 20, y: -30 }])}
          fill={CLOTH_SHADE}
          opacity={0.32}
        />
        {/* Soft shadow under the hip wrap */}
        <ellipse cx={1} cy={-47} rx={31} ry={5} fill={CLOTH_SHADE} opacity={0.45} />
        {/* Tension folds from the hips toward the knees, sag folds between the knees */}
        <path
          d="M-29 -58 Q-43 -49 -55 -40 M29 -58 Q43 -49 55 -40 M-53 -37 Q-30 -26 -5 -29 M53 -37 Q32 -26 15 -29 M-47 -28 Q-26 -22.5 -5 -23.5 M47 -28 Q29 -22.5 16 -23.5"
          fill="none"
          stroke={CLOTH_FOLD}
          strokeWidth={1.25}
          strokeLinecap="round"
          opacity={0.85}
        />
        <path d="M-50 -39 Q-28 -29 -6 -31.5" fill="none" stroke={CLOTH_LIT} strokeWidth={1.1} strokeLinecap="round" opacity={0.85} />
        {/* Front pleats (kochi): a narrow fan falling from the tuck, darker inner folds */}
        <path
          d={smoothClosed([
            { x: -1, y: -56 },
            { x: 11, y: -56 },
            { x: 16, y: -20 + flut(81, 0.4) },
            { x: 7, y: -18 },
            { x: -3, y: -19.5 + flut(83, 0.4) },
          ])}
          fill={CLOTH_MID}
        />
        <path d="M3.5 -55 Q3 -37 2 -19 M7.5 -55 Q9 -37 10.5 -19" fill="none" stroke={CLOTH_INNER} strokeWidth={1.1} strokeLinecap="round" opacity={0.6} />
        <path d="M0 -55 Q-1 -37 -2 -19.5 M5.5 -55 Q6 -37 6.2 -18.5" fill="none" stroke={CLOTH_LIT} strokeWidth={1} strokeLinecap="round" opacity={0.8} />
      </g>

      {/* Red hibiscus flowers resting on his feet (footFlowers); the newest eases in with the fraction */}
      {footFlowerEls}

      {/* The rig's own small basket (off by default: the scene owns the basket) */}
      {showBasket && sol.flower && (
        <g transform={`translate(${(solveOpts.basketAt.x - BASKET_HAND.x).toFixed(2)} ${(solveOpts.basketAt.y - BASKET_HAND.y).toFixed(2)})`}>
          <path d={`M64 ${BASKET_RIM_Y} Q66 -3 76 -2 L92 -2 Q102 -3 104 ${BASKET_RIM_Y} Z`} fill={BASKET} />
          <path d={`M66 -12 L102 -12 M68 -7 L100 -7`} fill="none" stroke={BASKET_DARK} strokeWidth={1.2} />
          <ellipse cx={84} cy={BASKET_RIM_Y} rx={20} ry={4.5} fill={BASKET_RIM} />
        </g>
      )}

      {/* Far arm and hand, behind the torso: soft and rounded, no hard joints */}
      {armPaint(shB, armB.E, armB.H, 0.98, SKIN_FAR, SKIN_DEEP, 0.55, wristRadius(turnB))}
      {childHand(`${uid}-hcB`, armB.H, backDir, shapeB, turnB, -1, SKIN_FAR, SKIN_DEEP, curlB, wristRadius(turnB), armB.E)}

      {/* Neck: short and soft, behind the torso so only its top shows */}
      {limb([neckBase, neckTop], [8.6, 8.2], SKIN, skinEdge(SKIN, SKIN_SHADE))}

      {/* Torso: soft child body, a gentle gradient instead of a hard form split (no dark outline, MOT-19) */}
      <path d={smoothClosed(torso)} fill={skinEdge(SKIN_FAR, SKIN_SHADE)} />
      <path d={smoothClosed(torso.map((p) => ({ x: p.x - 1.6, y: p.y - 1.1 })))} fill={`url(#${uid}-torso)`} />
      <ellipse cx={belly.x.toFixed(2)} cy={belly.y.toFixed(2)} rx={13} ry={10} fill={SKIN_LIT} opacity={0.22} />
      <path d={smoothOpen(shoulderRim)} fill="none" stroke={RIM} strokeWidth={1.2} strokeLinecap="round" opacity={0.45} />
      <path d={smoothOpen([torso[2], torso[3], torso[4]])} fill="none" stroke={RIM} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      {/* Soft chest light, a touch brighter as the chest rises (it does not grow) */}
      <ellipse
        cx={up({ x: 10, y: -86 }).x.toFixed(2)}
        cy={up({ x: 10, y: -86 }).y.toFixed(2)}
        rx={11}
        ry={8}
        fill={SKIN_LIT}
        opacity={(0.16 + 0.03 * Math.min(bN, 1.5)).toFixed(3)}
      />
      {/* A hint of the near collarbone, from the neck to the shoulder, with light along its top */}
      <path d={relUp([{ x: 3, y: -101.5 }, { x: 12, y: -100.4 }, { x: 22, y: -101.2 }])} fill="none" stroke={SKIN_SHADE} strokeWidth={0.9} strokeLinecap="round" opacity={0.32} />
      <path d={relUp([{ x: 4, y: -103 }, { x: 12, y: -102 }, { x: 21, y: -102.6 }])} fill="none" stroke={SKIN_LIT} strokeWidth={0.9} strokeLinecap="round" opacity={0.3} />
      {/* The shoulder blade, a soft curve on the back just below the cloth edge */}
      <path
        d={relUp([{ x: -27.5, y: -80 }, { x: -24, y: -73 }, { x: -25.5, y: -64 }])}
        fill="none"
        stroke={SKIN_DEEP}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={(0.22 + 0.12 * farArmRaise).toFixed(3)}
      />
      {/* Little tummy: a soft fold appears above the waist when he bends forward */}
      <path
        d={relUp([{ x: -24, y: -42 }, { x: -14, y: -40 - 1.5 * leanW }, { x: -2, y: -41 }])}
        fill="none"
        stroke={SKIN_SHADE}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={(0.45 * leanW).toFixed(3)}
      />

      {/* Head's soft shadow at the base of the neck */}
      <ellipse cx={chinShade.x.toFixed(2)} cy={chinShade.y.toFixed(2)} rx={8.5} ry={3.2} fill={SKIN_SHADE} opacity={0.4} />

      {/* Uttariya across the chest and over the far shoulder */}
      <path d={smoothClosed(bandShadow)} fill={SKIN_DEEP} opacity={0.3} />
      <path d={smoothClosed(bandPts)} fill={CLOTH_SHADE} />
      <path d={smoothClosed(bandPts.map((p) => ({ x: p.x - 0.9, y: p.y - 1.1 })))} fill={`url(#${uid}-cloth)`} />
      <path d={smoothClosed(innerFold)} fill={CLOTH_INNER} opacity={0.5} />
      <path
        d={relUp([
          { x: -32, y: -96 },
          { x: -18, y: -97 },
          { x: -2, y: -84 },
          { x: 14, y: -64 },
          { x: 25, y: -44 },
        ])}
        fill="none"
        stroke={CLOTH_FOLD}
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d={relUp([
          { x: -34, y: -88 },
          { x: -20, y: -84 },
          { x: -6, y: -71 },
          { x: 8, y: -54 },
          { x: 18, y: -40 },
        ])}
        fill="none"
        stroke={CLOTH_FOLD}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d={relUp(upperRel.slice(2, 9).map((p) => ({ x: p.x + 1.4, y: p.y + 1.6 })))}
        fill="none"
        stroke={CLOTH_LIT}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.95}
      />
      {/* Fold where the cloth turns over the far shoulder */}
      <path
        d={relUp([
          { x: -35, y: -95 },
          { x: -29, y: -100 },
          { x: -21, y: -103 },
        ])}
        fill="none"
        stroke={CLOTH_SHADE}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.7}
      />
      {/* Folds that answer the body: the cloth bunches at the near hip when he bends forward, and pulls
          over the far shoulder toward the elbow when that arm rises */}
      <path
        d={`${relUp([{ x: 14, y: -50 }, { x: 20, y: -47 }, { x: 26, y: -48 }])} ${relUp([{ x: 9, y: -44 }, { x: 17, y: -40 }, { x: 25, y: -41 }])}`}
        fill="none"
        stroke={CLOTH_FOLD}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={(0.8 * leanW).toFixed(3)}
      />
      <path
        d={`M${pt(up({ x: -30, y: -100 }))} Q${pt(lerpV(up({ x: -34, y: -94 }), armB.E, 0.15))} ${pt(lerpV(up({ x: -36, y: -88 }), armB.E, 0.25))}`}
        fill="none"
        stroke={CLOTH_FOLD}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={(0.25 + 0.5 * farArmRaise).toFixed(3)}
      />
      {/* The near shoulder's skin creases softly toward the armpit when the near arm lifts */}
      <path
        d={`M${pt(up({ x: 24, y: -90 }))} Q${pt(lerpV(up({ x: 27, y: -86 }), armF.E, 0.12))} ${pt(lerpV(up({ x: 28, y: -82 }), armF.E, 0.2))}`}
        fill="none"
        stroke={SKIN_SHADE}
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={(0.35 * nearArmRaise).toFixed(3)}
      />

      {/* Dhoti hip wrap: rolled waist, a small front tuck, folds from the tuck. Rides on the upper body. */}
      <path d={smoothClosed(hipWrap)} fill={`url(#${uid}-cloth)`} />
      <path d={smoothClosed([hipWrap[3], hipWrap[4], hipWrap[5], hipWrap[6], hipWrap[7]])} fill={CLOTH_SHADE} opacity={0.3} />
      <path d={smoothOpen(hipWrap.slice(6, 11))} fill="none" stroke={CLOTH_SHADE} strokeWidth={1.1} strokeLinecap="round" opacity={0.45} />
      <path
        d={relUp([
          { x: 3, y: -31 },
          { x: 0, y: -20 },
          { x: -5, y: -9 },
        ])}
        fill="none"
        stroke={CLOTH_FOLD}
        strokeWidth={1.15}
        strokeLinecap="round"
      />
      <path
        d={relUp([
          { x: 5, y: -31 },
          { x: 10, y: -20 },
          { x: 15, y: -9.5 },
        ])}
        fill="none"
        stroke={CLOTH_FOLD}
        strokeWidth={1.15}
        strokeLinecap="round"
      />
      <path
        d={relUp([
          { x: -27, y: -30 },
          { x: -18, y: -21 },
          { x: -9, y: -10 },
        ])}
        fill="none"
        stroke={CLOTH_FOLD}
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path d={smoothOpen(hipWrap.slice(0, 5).map((p) => ({ x: p.x, y: p.y + 2 })))} fill="none" stroke={CLOTH_MID} strokeWidth={3.2} strokeLinecap="round" />
      <path d={smoothOpen(hipWrap.slice(0, 5).map((p) => ({ x: p.x - 0.3, y: p.y + 0.9 })))} fill="none" stroke={CLOTH_LIT} strokeWidth={1.4} strokeLinecap="round" />
      <ellipse
        cx={knot.x.toFixed(2)}
        cy={knot.y.toFixed(2)}
        rx={4.4}
        ry={3}
        fill={CLOTH_MID}
        transform={`rotate(${sol.lean.toFixed(2)} ${knot.x.toFixed(2)} ${knot.y.toFixed(2)})`}
      />
      <ellipse cx={(knot.x - 0.8).toFixed(2)} cy={(knot.y - 0.8).toFixed(2)} rx={2.4} ry={1.4} fill={CLOTH_LIT} opacity={0.9} />

      {/* Pot and water stream (pour) */}
      {sol.pot && potOpacity > 0.01 && (
        <g opacity={potOpacity.toFixed(3)}>
          <path
            d={`M${pt(tip)} Q${(tip.x + 4).toFixed(2)} ${((tip.y + POUR_TARGET.y) / 2).toFixed(2)} ${pt(POUR_TARGET)}`}
            fill="none"
            stroke={WATER}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray="2.5 4"
            strokeDashoffset={(-f * 1.8).toFixed(2)}
            opacity={(0.9 * streamOpacity).toFixed(3)}
          />
          <g transform={`translate(${potCenter.x.toFixed(2)} ${potCenter.y.toFixed(2)}) rotate(${tilt.toFixed(2)})`}>
            <path d="M9 -3 L19 -8 L21 -4 L10 3 Z" fill={BRASS_DARK} />
            <ellipse rx={13} ry={11} fill={BRASS} />
            <ellipse cy={-10} rx={7} ry={2.4} fill={BRASS_DARK} />
            <ellipse cx={-4} cy={-2} rx={3} ry={5} fill="#e7bb62" opacity={0.6} />
          </g>
        </g>
      )}

      {/* Head: curly hair behind, round child face, ear, hairline, serene features, curls on top. */}
      <g transform={`translate(${headC.x.toFixed(2)} ${headC.y.toFixed(2)}) rotate(${headRot.toFixed(2)}) scale(${HEAD_K})`}>
        {/* Hair mass, fuller toward the back of the head */}
        <circle cx={-3} cy={-6} r={33} fill={HAIR} />
        <ellipse cx={-13} cy={-2} rx={26} ry={30} fill={HAIR} />
        {NAPE.map(([cx, cy, r], i) => curl(cx, cy, r, `n${i}`))}

        {/* Face: shade silhouette, then the lit face with a soft radial falloff; round cheeks */}
        <circle r={31} fill={SKIN_SHADE} />
        <ellipse cx={4.5} cy={9} rx={27} ry={22} fill={SKIN_SHADE} />
        <circle cx={-1.4} cy={-1.3} r={29.6} fill={`url(#${uid}-face)`} />
        <ellipse cx={3.3} cy={7.8} rx={25.8} ry={20.8} fill={`url(#${uid}-face)`} />
        {/* Forehead glow */}
        <ellipse cx={fx(0)} cy={-12} rx={14} ry={7} fill={SKIN_LIT} opacity={0.3} />

        {/* Ear on the far side */}
        <ellipse cx={-26.5} cy={3} rx={5} ry={7} fill={SKIN_FAR} />
        <path d="M-25 -1.5 Q-28.5 2.5 -25.5 7" fill="none" stroke={SKIN_SHADE} strokeWidth={1.2} strokeLinecap="round" />

        {/* Hair cap with a soft shadow on the forehead, then the curly fringe */}
        <path
          d="M-35 9.6 L-24.5 5.6 C-22.5 -4.4 -18.5 -14.4 -9.5 -19.4 C-0.5 -23.9 12 -23.9 20 -19.4 C26 -15.4 29 -9.4 31 -2.4 L35 -6.4 C35 -31 18 -41.5 -4 -41.5 C-27 -41.5 -38 -27 -36.5 -6.4 Z"
          fill={SKIN_SHADE}
          opacity={0.3}
        />
        <path
          d="M-35 8 L-24.5 4 C-22.5 -6 -18.5 -16 -9.5 -21 C-0.5 -25.5 12 -25.5 20 -21 C26 -17 29 -11 31 -4 L35 -8 C35 -31 18 -41.5 -4 -41.5 C-27 -41.5 -38 -27 -36.5 -8 Z"
          fill={HAIR}
        />
        <ellipse cx={-8} cy={-35.5} rx={13} ry={3.4} fill={HAIR_SHEEN} opacity={0.24} transform="rotate(-8 -8 -35.5)" />

        {/* Eyes: far eye a little narrower (three-quarter turn) */}
        {eyeAt(sx - 5.4, 2.4, 0, 0.88)}
        {eyeAt(sx + 13, 2.4, 1, 1)}

        {/* Brows: thin, soft, gently arched; shaped by the expression */}
        <path
          d={`M${fx(-10.2)} ${(-7.6 - 0.3 * browLift).toFixed(2)} Q${fx(-5.4)} ${(-10.6 - browLift).toFixed(2)} ${fx(-0.8)} ${(-8.6 - browInner - 0.5 * browLift).toFixed(2)} M${fx(7.6)} ${(-8.6 - browInner - 0.5 * browLiftN).toFixed(2)} Q${fx(13)} ${(-11 - browLiftN).toFixed(2)} ${fx(18.6)} ${(-7.8 - 0.3 * browLiftN).toFixed(2)}`}
          fill="none"
          stroke={BROW}
          strokeWidth={1.35}
          strokeLinecap="round"
          opacity={0.72}
        />

        {/* Blush on the round cheeks, which lift and catch the light when he smiles */}
        <ellipse cx={fx(-8)} cy={(10.5 - cheekUp).toFixed(2)} rx={6 * (1 + 0.12 * ex.joy)} ry={4.2} fill={`url(#${uid}-blush)`} />
        <ellipse cx={fx(17.5)} cy={(10.5 - cheekUp).toFixed(2)} rx={7 * (1 + 0.12 * ex.joy)} ry={4.6} fill={`url(#${uid}-blush)`} />
        {cheekUp > 0.05 && (
          <ellipse cx={fx(16.5)} cy={(8.6 - cheekUp).toFixed(2)} rx={4.2} ry={2.2} fill={SKIN_LIT} opacity={(0.18 * cheekUp).toFixed(3)} />
        )}

        {/* Small soft nose */}
        <path d={`M${fx(6.4)} 7.6 Q${fx(8.8)} 11 ${fx(5.6)} 12.3`} fill="none" stroke={SKIN_SHADE} strokeWidth={1.25} strokeLinecap="round" opacity={0.7} />
        <circle cx={fx(5.3)} cy={8.8} r={1.1} fill={SKIN_LIT} opacity={0.7} />

        {/* Mouth. Closed: a calm, faint smile with a soft lower lip (pressed and narrower in thought,
            lifted on the near side when playful). Open: rounded, crossfaded by mouthOpen (speech or a soft laugh). */}
        <g opacity={(1 - mouthOpen).toFixed(3)}>
          <path
            d={`M${mx(2)} ${(16.8 - cornerUp).toFixed(2)} Q${mx(6.3)} ${(18.4 + 1.8 * smile - 0.9 * pressed).toFixed(2)} ${mx(10.6)} ${(16.8 - cornerUp).toFixed(2)}`}
            fill="none"
            stroke={MOUTH}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
          {/* Tiny matching upturns at BOTH corners: a symmetric, gentle smile (never a one-sided smirk) */}
          <path
            d={`M${mx(10.5)} ${(16.85 - cornerUp).toFixed(2)} Q${mx(11.3)} ${(16.5 - cornerUp).toFixed(2)} ${mx(11.6)} ${(15.9 - cornerUp).toFixed(2)} M${mx(2.1)} ${(16.85 - cornerUp).toFixed(2)} Q${mx(1.3)} ${(16.5 - cornerUp).toFixed(2)} ${mx(1)} ${(15.9 - cornerUp).toFixed(2)}`}
            fill="none"
            stroke={MOUTH}
            strokeWidth={0.8}
            strokeLinecap="round"
            opacity={clamp(0.45 * smile, 0, 0.6).toFixed(3)}
          />
          <ellipse
            cx={mx(6.3)}
            cy={(20.2 - 0.6 * pressed).toFixed(2)}
            rx={(2.5 * mW * (1 - 0.15 * pressed)).toFixed(2)}
            ry={0.95}
            fill={LIP}
            opacity={(0.45 - 0.1 * pressed).toFixed(3)}
          />
          {pressed > 0.02 && (
            <path d={`M${mx(4.6)} 22.6 Q${mx(6.3)} 23.4 ${mx(8)} 22.6`} fill="none" stroke={SKIN_SHADE} strokeWidth={0.7} strokeLinecap="round" opacity={(0.25 * pressed).toFixed(3)} />
          )}
        </g>
        {mouthOpen > 0.01 && (
          <g opacity={mouthOpen.toFixed(3)}>
            <path
              d={`M${mx(2.4)} ${(16.8 - cornerUp - 0.3 * ex.joy).toFixed(2)} Q${mx(6.2)} ${(16.2 + 0.4 * ex.joy).toFixed(2)} ${mx(10.2)} ${(16.8 - cornerUp - 0.3 * ex.joy).toFixed(2)} Q${mx(9.8)} ${(17.6 + 4 * mouthOpen).toFixed(2)} ${mx(6.2)} ${(18 + 4.6 * mouthOpen).toFixed(2)} Q${mx(2.6)} ${(17.6 + 4 * mouthOpen).toFixed(2)} ${mx(2.4)} ${(16.8 - cornerUp - 0.3 * ex.joy).toFixed(2)} Z`}
              fill={MOUTH_DARK}
            />
            {/* A glimpse of small upper teeth in a soft laugh */}
            {ex.joy > 0.05 && mouthOpen > 0.15 && (
              <path
                d={`M${mx(3.6)} ${(17 - 0.5 * cornerUp).toFixed(2)} Q${mx(6.2)} ${(17.1 + 0.4 * ex.joy).toFixed(2)} ${mx(8.9)} ${(17 - 0.5 * cornerUp).toFixed(2)} Q${mx(6.2)} ${(18.1 + 0.4 * ex.joy).toFixed(2)} ${mx(3.6)} ${(17 - 0.5 * cornerUp).toFixed(2)} Z`}
                fill={EYE_WHITE}
                opacity={(0.6 * ex.joy * smooth((mouthOpen - 0.15) / 0.15)).toFixed(3)}
              />
            )}
            <ellipse cx={mx(6.2)} cy={(17.5 + 3 * mouthOpen).toFixed(2)} rx={2.3 * mW} ry={(0.6 + 1.1 * mouthOpen).toFixed(2)} fill={MOUTH_INNER} />
          </g>
        )}
        {/* Soft chin */}
        <path d={`M${fx(3.6)} 24 Q${fx(6.2)} 25.4 ${fx(8.8)} 24`} fill="none" stroke={SKIN_SHADE} strokeWidth={0.9} strokeLinecap="round" opacity={0.3} />

        {/* Curly fringe along the hairline, then the crown curls on the silhouette */}
        {FRINGE.map(([cx, cy, r], i) => curl(cx, cy, r, `f${i}`))}
        {CROWN.map(([a, r], i) => {
          const rad = (a * Math.PI) / 180;
          return curl(-3 + Math.cos(rad) * 31.5, -6 + Math.sin(rad) * 31.5, r, `c${i}`);
        })}
      </g>

      {/* Pranam: the far forearm and hand in front of the chest and the cloth, so both palms read joined.
          The forearm copy fades in from 14 to 20 units past the elbow (a soft mask, where nothing overlaps
          the arm), so the elbow and upper arm drawn behind show unchanged and no seam shows. */}
      {joinOp > 0.01 && (
        <g opacity={joinOp.toFixed(3)}>
          <defs>
            <linearGradient id={`${uid}-joingrad`} gradientUnits="userSpaceOnUse" x1={14} y1={0} x2={20} y2={0}>
              <stop offset={0} stopColor="#fff" stopOpacity={0} />
              <stop offset={1} stopColor="#fff" stopOpacity={1} />
            </linearGradient>
            <mask id={`${uid}-joinmask`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
              <rect
                x={0}
                y={-60}
                width={200}
                height={120}
                fill={`url(#${uid}-joingrad)`}
                transform={`translate(${armB.E.x.toFixed(2)} ${armB.E.y.toFixed(2)}) rotate(${((Math.atan2(armB.H.y - armB.E.y, armB.H.x - armB.E.x) * 180) / Math.PI).toFixed(2)})`}
              />
            </mask>
          </defs>
          <g mask={`url(#${uid}-joinmask)`}>{armPaint(shB, armB.E, armB.H, 0.98, SKIN_FAR, SKIN_DEEP, 0.55, wristRadius(turnB), 6)}</g>
          {childHand(`${uid}-hcB2`, armB.H, backDir, shapeB, turnB, -1, SKIN_FAR, SKIN_DEEP, curlB, wristRadius(turnB), armB.E)}
        </g>
      )}

      {/* Near arm and hand, in front of the head so the thinking hand reads at the chin */}
      {armPaint(shF, armF.E, armF.H, 1.02, SKIN, SKIN_SHADE, 1, wristRadius(turnF))}
      {childHand(`${uid}-hcF`, armF.H, frontDir, shapeF, turnF, 1, SKIN, SKIN_SHADE, curlF, wristRadius(turnF), armF.E)}

      {/* Leaf (pickLeaf) and flower (placeFlowerOnFoot): drawn after the hand so they read in it */}
      {sol.leaf && leafPos && leafOpacity > 0.01 && (
        <g opacity={leafOpacity} transform={`translate(${leafPos.x.toFixed(2)} ${leafPos.y.toFixed(2)}) rotate(-18)`}>
          <ellipse rx={9} ry={4.2} fill={LEAF} />
          <path d="M-7 0 L6 0" stroke={LEAF_DARK} strokeWidth={0.9} />
        </g>
      )}
      {sol.flower && flowerOpacity > 0.01 &&
        hibiscus(
          (flowerPos ?? sol.flower).x,
          (flowerPos ?? sol.flower).y,
          sol.flower.held ? 0.92 : 1,
          sol.flower.held ? -30 + (Math.atan2(frontDir.y, frontDir.x) * 180) / Math.PI * 0.3 : -12,
          flowerOpacity,
          `${uid}-hib`,
        )}
    </g>
  );
};
