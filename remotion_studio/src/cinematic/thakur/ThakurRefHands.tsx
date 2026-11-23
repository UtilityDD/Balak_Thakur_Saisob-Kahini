import React from "react";
import { INK, SKIN, SKIN_LIT, SKIN_SHADE } from "./thakurRefPalette";

/**
 * Balak's gesture hands for the traced rig (ThakurRefTraced), drawn in WRIST-LOCAL space: the wrist joint at (0, 0),
 * fingers pointing up (-y). The caller places and rotates it and mirrors the left hand (scale(-1, 1)).
 *
 * TRUE SIZE (Round 2, measured from the approved traced lap hand of `sitCross`, rig units at s = 1):
 *   105 from the wrist to the middle fingertip, 62 across the knuckles, wrist 44 wide (half-width 22),
 *   finger widths index / middle / ring / little = 17 / 18 / 16 / 13 tapering to rounded tips,
 *   thumb 18 wide, its free length about 60 % of the index.
 *
 * Every finger is a 3-segment chain (the thumb 2) with a per-gesture pose (spread, bend at each joint, foreshortening),
 * so each hand type is its own natural hand: "relaxed", "open" (abhaya), "teach", "pranam", "pinch", "grip".
 *
 * Unmirrored, the hand is Balak's RIGHT hand (viewer's left arm). Where the palm faces the viewer ("relaxed", "open",
 * "teach", "pinch") the thumb sits on +x, toward his body's midline; in "grip" the back of the hand faces the viewer
 * and the thumb sits on -x. Mirrored by the caller, the left hand gets the correct side too.
 *
 * Every hand is OPEN at the wrist: the fill runs a little past the wrist (to y = +10) and the ink outline stops at both
 * sides, so the forearm joins it with no dark line across the wrist (MOT-19).
 */
export type ThakurHandType = "relaxed" | "open" | "teach" | "pranam" | "pinch" | "grip";

/** Half the wrist width where the hand starts (wrist is 44 wide): the arm's wrist should match it. */
export const THAKUR_HAND_WRIST_HALF_W = 22;
/** Wrist to middle fingertip, straight hand. */
export const THAKUR_HAND_LENGTH = 105;

type V = [number, number];

/* ------------------------------------------------------------------------------------------------------------------ */
/* Finger chain geometry                                                                                               */
/* ------------------------------------------------------------------------------------------------------------------ */

/** Finger pose: spread (deg from straight up, + toward +x), bends at the two finger joints (deg, + toward +x),
 *  foreshortening per segment (1 = full length, smaller = curling toward / away from the viewer). */
interface FingerPose {
  spread: number;
  bend: [number, number];
  fore: [number, number, number];
  /** Joint index (1 or 2) after which the rest of the finger is drawn as a separate piece in front (a folded finger). */
  foldAt?: number;
  /** Draw only this many segments (the rest is hidden behind an object, e.g. the ghoti neck). */
  segs?: number;
}
interface ThumbPose {
  dir: number;
  bend: number;
  fore: [number, number];
}

const SEG_SPLIT = [0.46, 0.3, 0.24];
// index, middle, ring, little (palm view: index on +x)
const F_BASE: V[] = [
  [22, -47],
  [5, -50],
  [-11.5, -47.5],
  [-24, -41],
];
const F_LEN = [49, 55, 48, 38];
const F_W = [17, 18, 16, 13];
const THUMB_BASE: V = [25, -22];
const THUMB_LEN: [number, number] = [19, 15.5];
const THUMB_W = 18;

const rad = (d: number) => (d * Math.PI) / 180;

/** Spine joints of a finger chain. */
function chain(base: V, len: number[], dirs: number[]): V[] {
  const pts: V[] = [base];
  let p = base;
  for (let i = 0; i < len.length; i++) {
    const a = rad(dirs[i]);
    p = [p[0] + Math.sin(a) * len[i], p[1] - Math.cos(a) * len[i]];
    pts.push(p);
  }
  return pts;
}

/** Catmull-Rom sampled smooth spine through the joints. */
function smooth(pts: V[], n = 7): V[] {
  const out: V[] = [];
  const P = (i: number): V => {
    if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
    if (i >= pts.length) {
      const a = pts[pts.length - 1];
      const b = pts[pts.length - 2];
      return [2 * a[0] - b[0], 2 * a[1] - b[1]];
    }
    return pts[i];
  };
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

const fmt = (p: V) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

/**
 * A tapered tube along `spine` with a rounded end. Returns the closed fill path and the ink path (open at the base).
 * `w0`/`w1` are the widths at the base and at the tip.
 */
function tube(spine: V[], w0: number, w1: number): { fill: string; ink: string; tipDir: V } {
  const n = spine.length;
  let total = 0;
  const acc = [0];
  for (let i = 1; i < n; i++) {
    total += Math.hypot(spine[i][0] - spine[i - 1][0], spine[i][1] - spine[i - 1][1]);
    acc.push(total);
  }
  const L: V[] = [];
  const R: V[] = [];
  let tx = 0, ty = -1;
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)], b = spine[Math.min(n - 1, i + 1)];
    const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    tx = (b[0] - a[0]) / dl;
    ty = (b[1] - a[1]) / dl;
    const u = total ? acc[i] / total : 0;
    // soft, slightly fuller pad in the middle of each finger, then the taper
    const w = (w0 + (w1 - w0) * u * u) * (1 + 0.03 * Math.sin(u * Math.PI)) * 0.5;
    L.push([spine[i][0] + ty * w, spine[i][1] - tx * w]);
    R.push([spine[i][0] - ty * w, spine[i][1] + tx * w]);
  }
  const r = w1 * 0.5 * 1.33;
  const le = L[n - 1], re = R[n - 1];
  const tip = `C ${fmt([le[0] + tx * r, le[1] + ty * r])} ${fmt([re[0] + tx * r, re[1] + ty * r])} ${fmt(re)}`;
  const left = L.map((p, i) => (i === 0 ? `M ${fmt(p)}` : `L ${fmt(p)}`)).join(" ");
  const right = R.slice(0, n - 1)
    .reverse()
    .map((p) => `L ${fmt(p)}`)
    .join(" ");
  const ink = `${left} ${tip} ${right}`;
  return { fill: `${ink} Z`, ink, tipDir: [tx, ty] };
}

interface Piece {
  fill: string;
  ink: string;
  spine: V[];
  joints: V[];
  w0: number;
  w1: number;
  tipDir: V;
  isTip: boolean;
  front: boolean;
}

/** Build the drawable pieces of one finger (one piece, or two when folded). */
function fingerPieces(i: number, pose: FingerPose): Piece[] {
  const len = SEG_SPLIT.map((s, k) => s * F_LEN[i] * pose.fore[k]);
  const dirs = [pose.spread, pose.spread + pose.bend[0], pose.spread + pose.bend[0] + pose.bend[1]];
  const segs = pose.segs ?? 3;
  const joints = chain(F_BASE[i], len.slice(0, segs), dirs.slice(0, segs));
  const W = F_W[i];
  const wAt = (k: number) => W * (1 - 0.2 * (k / 3));
  const make = (from: number, to: number, front: boolean): Piece => {
    const js = joints.slice(from, to + 1);
    // a folded piece starts a little back inside the knuckle so the two pieces overlap
    const spine = smooth(js);
    const t = tube(spine, wAt(from), wAt(to) * (to === 3 ? 0.92 : 1));
    return { ...t, spine, joints: js, w0: wAt(from), w1: wAt(to), isTip: to === 3, front };
  };
  if (pose.foldAt && pose.foldAt < segs) {
    return [make(0, pose.foldAt, false), make(pose.foldAt, segs, true)];
  }
  return [make(0, segs, false)];
}

function thumbPiece(pose: ThumbPose): Piece {
  const len = [THUMB_LEN[0] * pose.fore[0], THUMB_LEN[1] * pose.fore[1]];
  const joints = chain(THUMB_BASE, len, [pose.dir, pose.dir + pose.bend]);
  const spine = smooth(joints);
  const t = tube(spine, THUMB_W, THUMB_W * 0.78);
  return { ...t, spine, joints, w0: THUMB_W, w1: THUMB_W * 0.78, isTip: true, front: true };
}

const tipOf = (p: Piece): V => {
  const e = p.spine[p.spine.length - 1];
  return [e[0] + p.tipDir[0] * p.w1 * 0.42, e[1] + p.tipDir[1] * p.w1 * 0.42];
};

/* ------------------------------------------------------------------------------------------------------------------ */
/* Hand poses                                                                                                          */
/* ------------------------------------------------------------------------------------------------------------------ */

interface HandPose {
  fingers: [FingerPose, FingerPose, FingerPose, FingerPose];
  thumb: ThumbPose;
  /** Back of the hand toward the viewer (nails visible, no palm creases); drawn mirrored so the thumb is on -x. */
  back?: boolean;
}

const POSES: Record<Exclude<ThakurHandType, "pranam">, HandPose> = {
  // soft, natural rest: fingers loosely curled toward the viewer
  relaxed: {
    fingers: [
      { spread: 6, bend: [-4, -6], fore: [0.92, 0.74, 0.68] },
      { spread: 0, bend: [-3, -6], fore: [0.9, 0.7, 0.64] },
      { spread: -6, bend: [2, 0], fore: [0.88, 0.68, 0.62] },
      { spread: -13, bend: [5, 4], fore: [0.86, 0.66, 0.6] },
    ],
    thumb: { dir: 34, bend: -12, fore: [0.92, 0.86] },
  },
  // abhaya: fingers upright and together, the tips a touch bent back, thumb relaxed
  open: {
    fingers: [
      { spread: 4, bend: [-2, -3], fore: [1, 1, 0.97] },
      { spread: 0.5, bend: [-1, -2], fore: [1, 1, 0.97] },
      { spread: -3.5, bend: [1, 1], fore: [1, 1, 0.97] },
      { spread: -8, bend: [2, 3], fore: [1, 1, 0.97] },
    ],
    thumb: { dir: 30, bend: -12, fore: [0.95, 0.92] },
  },
  // teaching palm: loose, slightly spread, a soft curl
  teach: {
    fingers: [
      { spread: 11, bend: [-5, -7], fore: [0.97, 0.88, 0.8] },
      { spread: 2, bend: [-3, -5], fore: [0.97, 0.86, 0.78] },
      { spread: -8, bend: [2, 1], fore: [0.95, 0.84, 0.76] },
      { spread: -19, bend: [6, 6], fore: [0.92, 0.8, 0.72] },
    ],
    thumb: { dir: 50, bend: -10, fore: [0.95, 0.9] },
  },
  // thumb and index meet at the tips; the other fingers softly curled into the palm
  pinch: {
    fingers: [
      { spread: 16, bend: [52, 58], fore: [0.98, 0.9, 0.82] },
      { spread: 4, bend: [150, 22], fore: [0.72, 0.8, 0.62], foldAt: 1 },
      { spread: -6, bend: [154, 18], fore: [0.68, 0.76, 0.58], foldAt: 1 },
      { spread: -14, bend: [158, 14], fore: [0.64, 0.72, 0.54], foldAt: 1 },
    ],
    thumb: { dir: 22, bend: 16, fore: [1.05, 1.02] },
  },
  // back of the hand toward the viewer, fingers hooked over the vessel neck (their tips go behind it)
  grip: {
    back: true,
    fingers: [
      { spread: 8, bend: [0, 0], fore: [0.58, 1, 1], segs: 1 },
      { spread: 2, bend: [0, 0], fore: [0.6, 1, 1], segs: 1 },
      { spread: -5, bend: [0, 0], fore: [0.58, 1, 1], segs: 1 },
      { spread: -12, bend: [0, 0], fore: [0.56, 1, 1], segs: 1 },
    ],
    thumb: { dir: 6, bend: 22, fore: [1.0, 0.95] },
  },
};

/* ------------------------------------------------------------------------------------------------------------------ */
/* Anchors for the caller                                                                                              */
/* ------------------------------------------------------------------------------------------------------------------ */

const pinchIndex = fingerPieces(0, POSES.pinch.fingers[0]);
const pinchThumb = thumbPiece(POSES.pinch.thumb);
const pinchMid: V = (() => {
  const a = tipOf(pinchIndex[pinchIndex.length - 1]);
  const b = tipOf(pinchThumb);
  return [Math.round(((a[0] + b[0]) / 2) * 10) / 10, Math.round(((a[1] + b[1]) / 2) * 10) / 10];
})();

/** Wrist-local point (unmirrored hand) where thumb and index meet in "pinch": place the flower stem here. */
export const THAKUR_HAND_PINCH_POINT: [number, number] = pinchMid;

/**
 * Wrist-local geometry of the vessel neck held by "grip" (unmirrored hand): the neck's axis runs along local x through
 * `center`; `diameter` is the neck's width across (local y). The back of the hand lies across the neck's front and the
 * fingers hook over its far edge, so the caller draws the vessel BEFORE the arm / hand.
 */
export const THAKUR_HAND_GRIP_NECK = { center: [0, -46] as [number, number], diameter: 52 };

/* ------------------------------------------------------------------------------------------------------------------ */
/* Drawing                                                                                                             */
/* ------------------------------------------------------------------------------------------------------------------ */

const InkPath: React.FC<{ d: string; w?: number; o?: number; c?: string }> = ({ d, w = 3.0, o = 1, c = INK }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
);

/** Point at fraction `u` along a sampled spine, plus its unit normal. */
function along(spine: V[], u: number): { p: V; n: V } {
  const i = Math.min(spine.length - 2, Math.max(0, Math.floor(u * (spine.length - 1))));
  const a = spine[i], b = spine[i + 1];
  const f = u * (spine.length - 1) - i;
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], n: [(b[1] - a[1]) / d, -(b[0] - a[0]) / d] };
}

const FingerShape: React.FC<{ piece: Piece; back: boolean; joint?: boolean }> = ({ piece, back }) => {
  const { spine, w0, w1 } = piece;
  // knuckle creases at the inner joints (palm side: short soft lines; back: little wrinkle arcs)
  const creases: React.ReactNode[] = [];
  piece.joints.slice(1, piece.isTip ? -1 : undefined).forEach((j, k) => {
    // find nearest spine sample to the joint
    let best = 0, bd = 1e9;
    spine.forEach((s, i) => {
      const d = Math.hypot(s[0] - j[0], s[1] - j[1]);
      if (d < bd) { bd = d; best = i; }
    });
    const { n } = along(spine, best / (spine.length - 1));
    const hw = (w0 + w1) * 0.12;
    const a: V = [j[0] + n[0] * hw, j[1] + n[1] * hw];
    const b: V = [j[0] - n[0] * hw, j[1] - n[1] * hw];
    creases.push(
      <path
        key={k}
        d={`M ${fmt(a)} Q ${fmt([j[0] + (j[0] - spine[Math.max(0, best - 1)][0]) * 0.3, j[1] + (j[1] - spine[Math.max(0, best - 1)][1]) * 0.3])} ${fmt(b)}`}
        fill="none"
        stroke={SKIN_SHADE}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.7}
      />,
    );
  });
  // lit stripe along one side of the finger (the light comes from the upper left of the frame)
  const lit = spine
    .slice(1, -1)
    .map((s, i, arr) => {
      const { n } = along(spine, (i + 1) / (spine.length - 1));
      const u = (i + 1) / (spine.length - 1);
      const w = (w0 + (w1 - w0) * u * u) * 0.24;
      const p: V = [s[0] + n[0] * w, s[1] + n[1] * w];
      return `${i === 0 ? "M" : "L"} ${fmt(p)}`;
    })
    .join(" ");
  let nail: React.ReactNode = null;
  if (piece.isTip && back) {
    const e = spine[spine.length - 1];
    const prev = spine[spine.length - 3] ?? spine[0];
    const d = Math.hypot(e[0] - prev[0], e[1] - prev[1]) || 1;
    const t: V = [(e[0] - prev[0]) / d, (e[1] - prev[1]) / d];
    const c: V = [e[0] - t[0] * w1 * 0.12, e[1] - t[1] * w1 * 0.12];
    const ang = (Math.atan2(t[1], t[0]) * 180) / Math.PI;
    nail = (
      <ellipse
        cx={c[0]}
        cy={c[1]}
        rx={w1 * 0.36}
        ry={w1 * 0.26}
        transform={`rotate(${ang.toFixed(1)} ${c[0].toFixed(2)} ${c[1].toFixed(2)})`}
        fill={SKIN_LIT}
        stroke={SKIN_SHADE}
        strokeWidth={1.2}
        opacity={0.9}
      />
    );
  }
  return (
    <g>
      <path d={piece.fill} fill={SKIN} />
      <path d={lit} fill="none" stroke={SKIN_LIT} strokeWidth={Math.max(2.2, w1 * 0.16)} strokeLinecap="round" opacity={0.4} />
      {creases}
      {nail}
      <InkPath d={piece.ink} w={2.8} />
    </g>
  );
};

/* Palm: wrist 44 wide, widening to 62 across the knuckles, thenar mound on +x. Top edge hidden under the fingers. */
const PALM_FILL =
  "M -22 10 C -23.6 -4 -27.6 -20 -30 -32 C -31 -38 -31 -42 -30 -45 " +
  "C -24 -52 -14 -56 -4 -57 C 8 -58 20 -56 29 -51 C 31 -49 31.6 -45 31.2 -40 " +
  "C 33.6 -34 35 -24 33 -14 C 30.6 -4 25.6 4 22 10 Z";
// ink only along the two sides (little-finger edge, thumb side), open at the wrist and under the fingers
const PALM_INK_L = "M -22 10 C -23.6 -4 -27.6 -20 -30 -32 C -30.6 -35.6 -30.8 -38.6 -30.6 -41";
const PALM_INK_R = "M 31 -38 C 33.6 -32 35 -24 33 -14 C 30.6 -4 25.6 4 22 10";

const Palm: React.FC<{ back: boolean }> = ({ back }) => (
  <g>
    <path d={PALM_FILL} fill={SKIN} />
    {back ? (
      <>
        {/* back of the hand: lit top plane, soft tendon hints, shade along the little-finger edge */}
        <path d="M -24 -44 C -12 -52 10 -54 28 -47 C 22 -36 8 -30 -6 -31 C -16 -32 -22 -36 -24 -44 Z" fill={SKIN_LIT} opacity={0.5} />
        <path d="M -30 -32 C -27.6 -20 -23.6 -4 -22 10 L -15 10 C -17 -4 -20 -18 -22.6 -32 Z" fill={SKIN_SHADE} opacity={0.42} />
        <InkPath d="M -6 -16 C -7 -26 -8 -34 -10 -42" w={1.4} o={0.6} c={SKIN_SHADE} />
        <InkPath d="M 6 -16 C 6 -26 6 -36 6 -44" w={1.4} o={0.6} c={SKIN_SHADE} />
      </>
    ) : (
      <>
        {/* cup of the palm in shade, lit pad under the fingers and lit thumb mound */}
        <path d="M -18 -38 C -10 -45 8 -46 18 -38 C 21 -27 15 -14 3 -11 C -10 -11 -20 -22 -18 -38 Z" fill={SKIN_SHADE} opacity={0.36} />
        <path d="M -30 -32 C -27.6 -20 -23.6 -4 -22 10 L -16 10 C -18 -4 -21 -18 -23.4 -32 Z" fill={SKIN_SHADE} opacity={0.4} />
        <path d="M -27 -46 C -14 -54 10 -56 28 -49 C 14 -47 -10 -46 -27 -46 Z" fill={SKIN_LIT} opacity={0.6} />
        <path d="M 24 -34 C 31 -32 33 -20 29 -6 C 24 -12 21 -24 24 -34 Z" fill={SKIN_LIT} opacity={0.7} />
        {/* palm creases */}
        <InkPath d="M -29 -40 Q -12 -40 10 -45" w={1.6} o={0.8} c={SKIN_SHADE} />
        <InkPath d="M 21 -38 Q 12 -24 14 -4" w={1.6} o={0.8} c={SKIN_SHADE} />
      </>
    )}
    <InkPath d={PALM_INK_L} />
    <InkPath d={PALM_INK_R} />
  </g>
);

const ChainHand: React.FC<{ pose: HandPose }> = ({ pose }) => {
  const back = !!pose.back;
  const pieces = pose.fingers.map((f, i) => fingerPieces(i, f));
  // draw order: little finger first (behind), index last; folded pieces in front of the palm
  const order = [3, 2, 1, 0];
  const behind = order.map((i) => pieces[i].filter((p) => !p.front)).flat();
  const front = order.map((i) => pieces[i].filter((p) => p.front)).flat();
  const thumb = thumbPiece(pose.thumb);
  const body = (
    <g>
      {behind.map((p, k) => (
        <FingerShape key={`b${k}`} piece={p} back={back} />
      ))}
      <Palm back={back} />
      {front.map((p, k) => (
        <FingerShape key={`f${k}`} piece={p} back={back} />
      ))}
      {back ? (
        <>
          {/* bent knuckles on the back of the hand */}
          {pieces.map((ps, i) => {
            const j = ps[0].joints[1];
            return <ellipse key={i} cx={j[0]} cy={j[1] + 2} rx={F_W[i] * 0.28} ry={2.4} fill={SKIN_LIT} opacity={0.7} />;
          })}
        </>
      ) : null}
      <FingerShape piece={thumb} back={back || pose === POSES.pinch} />
    </g>
  );
  return back ? <g transform="scale(-1 1)">{body}</g> : body;
};

/* ------------------------------------------------------------------------------------------------------------------ */
/* PRANAM: one hand of a namaskar pair seen edge-on from the little-finger side, fingers flat and together.            */
/* The palm plane is the line x = +22 (THAKUR_HAND_PRANAM_PALM_X): two hands with wrists 44 apart (rotation 0, the    */
/* right one mirrored) meet palm to palm; rotate both by +-a and they still meet if the wrists are 44 * cos(a) apart   */
/* along the line perpendicular to the palms.                                                                          */
/* ------------------------------------------------------------------------------------------------------------------ */
export const THAKUR_HAND_PRANAM_PALM_X = 22;

const PRANAM_OUTLINE =
  // back of the hand up from the wrist, the knuckle bump, the back of the fingers
  "M -22 10 C -24 -8 -21 -30 -14 -48 C -12.6 -52 -11 -55 -9.6 -57.6 " +
  "C -6.6 -66 -3.4 -76 -0.6 -86 C 1.6 -93 4 -99 7.2 -102.6 " +
  // rounded fingertip pressed to the partner's
  "C 11.6 -107.4 19.6 -106.4 21.4 -99.6 " +
  // the palm plane down to the wrist
  "C 22 -96 22 -90 22 -84 L 22 10";

const PranamHand: React.FC = () => (
  <g>
    <path d={PRANAM_OUTLINE + " Z"} fill={SKIN} />
    {/* palm side in soft shade (the hollow between the palms), lit back of the hand */}
    <path d="M 21.4 -99.6 C 22 -96 22 -90 22 -84 L 22 10 L 14 10 C 13.4 -14 13 -40 13.6 -62 C 14.4 -80 17 -93 21.4 -99.6 Z" fill={SKIN_SHADE} opacity={0.42} />
    <path
      d="M -22 10 C -24 -8 -21 -30 -14 -48 C -12.6 -52 -11 -55 -9.6 -57.6 C -6.6 -66 -3.4 -76 -0.6 -86 C 1.6 -93 4 -99 7.2 -102.6 C 4.6 -94 1.4 -82 -1.6 -70 C -5 -58 -10 -44 -13.6 -28 C -15 -16 -15.6 -2 -15.4 10 Z"
      fill={SKIN_LIT}
      opacity={0.55}
    />
    {/* the little finger along the others, its tip, and the ring finger's edge above it */}
    <InkPath d="M -12.4 -50 C -8.8 -60 -5.8 -70 -3 -79.6" w={2.2} o={0.9} />
    <InkPath d="M -3 -79.6 C -1.4 -83.4 2 -84 3.4 -80.6" w={2} o={0.85} />
    <InkPath d="M 1.6 -90.4 C 3.6 -94 7 -94.4 8.2 -91" w={1.6} o={0.7} />
    {/* knuckle creases on the back of the fingers */}
    <InkPath d="M -15.6 -52.4 Q -12.6 -50.6 -10.4 -53.4" w={1.5} o={0.75} c={SKIN_SHADE} />
    <InkPath d="M -8.6 -70 Q -5.8 -68.4 -3.8 -71" w={1.5} o={0.75} c={SKIN_SHADE} />
    <InkPath d="M -2 -88.4 Q 0.4 -87 2.2 -89.4" w={1.4} o={0.7} c={SKIN_SHADE} />
    {/* thumb up the palm edge, its tip and nail */}
    <InkPath d="M 8 0 C 8.6 -16 10 -34 12 -50" w={2.2} o={0.88} />
    <InkPath d="M 12 -50 C 13 -55.6 17.6 -57 20.6 -53" w={2} o={0.88} />
    <path d="M 14.2 -49.4 C 14.8 -52.4 17.8 -53 19 -50.6 C 18.6 -48.4 15.4 -47.6 14.2 -49.4 Z" fill={SKIN_LIT} stroke={SKIN_SHADE} strokeWidth={1.1} opacity={0.9} />
    <InkPath d={PRANAM_OUTLINE} />
  </g>
);

export const ThakurRefHand: React.FC<{ handType: ThakurHandType }> = ({ handType }) =>
  handType === "pranam" ? <PranamHand /> : <ChainHand pose={POSES[handType] ?? POSES.open} />;
