import React from "react";

/**
 * Shared animal rigs for Episode 2. Borderless 2D vector shapes in the Episode 1 palette:
 * flat fills with soft tonal shading, no ink outlines.
 *
 * Origin: (0,0) is the ground line. Each animal's paw bottoms sit at y = 0 and the body rises
 * above it. Animals face right unless `flip` is set, and are scaled by `s`.
 *
 * `pose` picks a body state (idle, walk, run, lunge, bite, recoil, tumble, flee, sit).
 * `lean` (-1..1) tilts the body and head forward (+) or back (-).
 * `f` (frame) drives all motion. Each foot follows a ground-contact path: stance drags it back
 * along the ground, swing lifts it and carries it forward. Two-bone IK turns those paths into
 * leg angles, so stance paws stay planted. Timing uses incommensurate sums of sines and slow
 * noise, so nothing repeats on a fixed loop.
 *
 * `prevPose` and `poseStart` ease a pose change. For BLEND frames from poseStart, the body, head and leg
 * angles blend from prevPose to pose. Pose changes in a scene must be at least BLEND frames apart.
 */
export type AnimalPose = "idle" | "walk" | "run" | "lunge" | "bite" | "recoil" | "tumble" | "flee" | "sit";

export interface AnimalProps {
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  f?: number;
  pose?: AnimalPose;
  lean?: number;
  /** The pose this one replaced. With poseStart, the change eases instead of snapping. */
  prevPose?: AnimalPose;
  /** Frame at which `pose` replaced `prevPose`. */
  poseStart?: number;
}

/* ------------------------------------------------------------------ */
/* Shared motion core                                                   */
/* ------------------------------------------------------------------ */

type Quad = [number, number, number, number];
type Pair = [number, number];
/** Per leg, in order near front, far front, near hind, far hind: [x offset from hip, lift]. */
type Feet = [Pair, Pair, Pair, Pair];

/**
 * Per-frame pose solution. Angles in degrees. Conventions (SVG, y down):
 * - feet: per-leg targets before IK. legs: forward swing, positive = foot forward.
 *   knees: positive = lower leg kicks back. Set by IK unless `direct`.
 * - tail: positive = raised. wag: extra tail swing.
 * - hrot / rot: positive = nose or front down (clockwise).
 * - ear: 0 = upright, 1 = flat back. flick and flap: extra ear swing.
 * - mouth, tongue, eye: 0..1 (eye 1 = open).
 * - direct: legs and knees are used as given (tumble), not solved from feet.
 */
interface Rig {
  dx: number;
  dy: number;
  rot: number;
  stretch: number;
  squash: number;
  hdx: number;
  hdy: number;
  hrot: number;
  tail: number;
  wag: number;
  ear: number;
  flap: number;
  flick: number;
  mouth: number;
  tongue: number;
  eye: number;
  feet: Feet;
  direct: boolean;
  legs: Quad;
  knees: Quad;
}

interface Gait {
  walk: number; // cycle speed, radians per frame
  run: number;
  stride: number; // walk half stride, body units
  lift: number; // walk foot clearance at mid swing, units
  duty: number; // walk stance share of the cycle
  runDuty: number;
  bob: number; // body rise and fall per step, units
  walkOffs: Quad; // cycle offset of each leg
  runOffs: Quad;
  idle?: number; // standing weight-shift amplitude (0 or unset = the plain stand)
}

interface Anatomy {
  gait: Gait;
  legs: LegSet;
  ground: number; // body-local y of the paw bottoms
}

/** Leg reach at rest, as a fraction of full length. The slack lets the body bob and strides fit. */
const REST = 0.955;

/** Lateral-sequence walk: near hind, near front, far hind, far front, one quarter cycle apart. */
const LATERAL: Quad = [0.25, 0.75, 0, 0.5];
/** Trot: diagonal pairs in phase, with a small hind lag. */
const TROT: Quad = [0, 0.5, 0.53, 0.03];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fract = (v: number) => v - Math.floor(v);
const deg = (rad: number) => (rad * 180) / Math.PI;

/** Smoothstep ease in and out, input clamped to 0..1. */
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};

/** Non-periodic noise in -1..1: three incommensurate sines per seed. */
const nz = (f: number, seed: number, rate = 1) =>
  0.55 * Math.sin(f * 0.061 * rate + seed) +
  0.3 * Math.sin(f * 0.1543 * rate + seed * 1.31 + 0.7) +
  0.15 * Math.sin(f * 0.0227 * rate + seed * 2.17);

/** Ear angle: base, plus flatten amount (scaled by r.ear), plus flick. */
const earAng = (r: Rig, base: number, flat: number) => base + r.ear * flat + r.flick;

/** Paw bottom below the chain end (the foot centre the IK reaches for). */
const padOf = (c: LegSpec) => (c.claws ? c.footR * 1.4 : c.footR * 0.62);

/** Builds the anatomy for a leg set. The ground line is where the paws rest at full stance. */
const anatomy = (gait: Gait, legs: LegSet): Anatomy => {
  const c = legs[0];
  return { gait, legs, ground: c.y + REST * (c.up + c.low) + padOf(c) };
};

/**
 * Two-bone leg solve. Hip at (c.x, c.y) reaching (tx, ty), in Frame space. The knee bends
 * forward for fore legs (bend +1) and backward for hind legs (bend -1). Returns [swing, knee].
 */
const legIK = (c: LegSpec, tx: number, ty: number): [number, number] => {
  const dx = tx - c.x;
  const dy = ty - c.y;
  const d = clamp(Math.hypot(dx, dy), Math.abs(c.up - c.low) + 0.01, c.up + c.low - 0.01);
  const phi = Math.atan2(dx, dy);
  const cosA = clamp((c.up * c.up + d * d - c.low * c.low) / (2 * c.up * d), -1, 1);
  const a = phi + (c.bend ?? 1) * Math.acos(cosA);
  const kx = c.up * Math.sin(a);
  const ky = c.up * Math.cos(a);
  const b = Math.atan2(d * Math.sin(phi) - kx, d * Math.cos(phi) - ky);
  return [deg(a), deg(a - b)];
};

/**
 * Foot position over one gait cycle, u in 0..1, as [x offset, lift]. Stance drags the foot
 * back along the ground. Swing lifts it and carries it forward with an eased return.
 */
const stepFoot = (u: number, S: number, lift: number, duty: number): Pair => {
  if (u < duty) return [S * (1 - (2 * u) / duty), 0];
  const t = (u - duty) / (1 - duty);
  return [-S + 2 * S * smooth(t), lift * Math.sin(Math.PI * t)];
};

const solve = (pose: AnimalPose, f: number, seed: number, lean: number, an: Anatomy): Rig => {
  const g = an.gait;
  const L = clamp(lean, -1, 1);
  const n = (k: number, rate = 1) => nz(f, seed + k, rate);
  const breathe = 1 + 0.012 * (0.7 * Math.sin(f * 0.26 + seed) + 0.3 * nz(f, seed, 0.4));
  const look = n(4, 0.25);
  // Blink: two incommensurate sines, so closures come at irregular intervals.
  const blinkP = Math.sin(f * 0.0917 + seed) * Math.sin(f * 0.0331 + seed * 3.1);
  const r: Rig = {
    dx: 0,
    dy: 0,
    rot: 0,
    stretch: 1,
    squash: breathe,
    hdx: 0,
    hdy: 0,
    hrot: 5 * look,
    tail: 0,
    // tail wag: amplitude drifts with noise, swing is a sine of f
    wag: (14 + 6 * n(30, 0.6)) * Math.sin(f * 0.42 + seed * 0.9),
    ear: 0,
    flap: 2.5 * n(19, 1.2),
    flick: 22 * Math.pow(Math.max(0, n(9, 2.7)), 6),
    mouth: 0,
    tongue: smooth((n(14, 0.8) - 0.72) / 0.2),
    eye: 1 - 0.88 * smooth((blinkP - 0.94) / 0.05),
    feet: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    direct: false,
    legs: [0, 0, 0, 0],
    knees: [0, 0, 0, 0],
  };

  /** Runs all four feet through one gait cycle. Returns the cycle phase in radians. */
  const cycle = (speed: number, S: number, lift: number, duty: number, offs: Quad) => {
    // irregular stride timing: a slow noise term on the phase
    const ph = f * speed + 0.35 * n(2, 0.5);
    for (let i = 0; i < 4; i++) {
      r.feet[i] = stepFoot(fract(ph / (2 * Math.PI) + offs[i]), S, lift, duty);
    }
    // floppy ears swing with each stride
    r.flap += 9 * Math.sin(2 * ph + 1.1);
    return ph;
  };

  switch (pose) {
    case "walk": {
      const ph = cycle(g.walk, g.stride, g.lift, g.duty, g.walkOffs);
      r.dy = g.bob * (0.5 - 0.5 * Math.cos(2 * ph)) + 0.4 * n(6, 0.7);
      r.rot = 1.2 * Math.sin(2 * ph) + 0.6 * n(7, 0.5);
      r.hdy = -r.dy * 0.35;
      r.hrot += 3.2 * Math.sin(2 * ph + 0.6);
      r.tail = -2 + 4 * n(5, 1.4) + 3 * Math.sin(2 * ph - 1.2);
      r.ear = 0.1;
      r.mouth = 0.04;
      break;
    }
    case "run": {
      const ph = cycle(g.run, g.stride * 1.3, g.lift * 1.5, g.runDuty, g.runOffs);
      r.dy = g.bob * 1.4 * (0.5 - 0.5 * Math.cos(2 * ph)) + 0.4 * n(6, 0.7);
      r.rot = 3 * Math.sin(2 * ph) + 0.6 * n(7, 0.5);
      r.hdy = -r.dy * 0.35;
      r.hrot += 3.2 * Math.sin(2 * ph + 0.6);
      r.tail = -6 + 7 * n(5, 1.4) + 3 * Math.sin(2 * ph - 1.2);
      r.ear = 0.3;
      r.mouth = 0.25 + 0.1 * n(8, 1.1);
      break;
    }
    case "flee": {
      // low and fast: short stances, hips dropped, head and neck stretched forward
      const ph = cycle(g.run * 1.15, g.stride * 1.35, g.lift * 0.8, g.runDuty * 0.85, g.runOffs);
      r.dy = 4 + 1.5 * (0.5 - 0.5 * Math.cos(2 * ph)) + 0.5 * n(6, 0.7);
      r.rot = 7 + 1.4 * Math.sin(2 * ph);
      r.stretch = 1.1;
      r.hdy = 3;
      r.hrot = 14 + 2.5 * Math.sin(2 * ph + 0.6);
      r.ear = 0.85;
      r.tail = -14 + 4 * n(5, 1.4);
      r.mouth = 0.2 + 0.05 * n(8);
      r.wag *= 0.4;
      break;
    }
    case "lunge": {
      // fore paws reach ahead, hind paws push off; head forward and low, ears pinned back
      r.feet = [
        [14 + 2 * n(1, 0.8), 0],
        [12 + 2 * n(3, 0.8), 0],
        [-6 + 2 * n(5, 0.8), 2],
        [-8 + 2 * n(7, 0.8), 2],
      ];
      r.dx = 4;
      r.dy = 1;
      r.rot = 7 + 1.5 * n(10, 0.6);
      r.stretch = 1.12;
      r.hdx = 12;
      r.hdy = 2;
      r.hrot = 16 + 3 * n(11, 0.6);
      r.ear = 0.9;
      r.mouth = 0.8 + 0.1 * n(12, 0.9);
      r.tail = -12 + 4 * n(13, 0.8);
      r.wag *= 0.3;
      break;
    }
    case "bite": {
      // s runs 0 (jaws wide, head drawn back) to 1 (snapped forward, jaws shut on contact)
      const s = smooth((n(12, 1.4) + 0.2) / 0.6);
      r.feet = [
        [6 + 2 * n(1), 0],
        [6 + 2 * n(3), 0],
        [-6, 0],
        [-6, 0],
      ];
      r.dx = 2 + 3 * s;
      r.rot = 4 + 2 * s;
      r.hdx = -2 + 14 * s;
      r.hdy = 1;
      r.hrot = 4 + 12 * s;
      r.mouth = 1 - s;
      r.ear = 0.55;
      r.tail = 16 + 6 * n(15, 0.9);
      r.wag *= 0.3;
      break;
    }
    case "recoil": {
      // body pulled back and nose up; fore paws lifted and tucked under the chest
      r.feet = [
        [-6 + 2 * n(2), 16],
        [-4 + 2 * n(4), 16],
        [-10 + 2 * n(6, 0.8), 0],
        [-12 + 2 * n(8, 0.8), 0],
      ];
      r.rot = -9 + 1.5 * n(1, 0.6);
      r.dx = -7;
      r.dy = 3;
      r.stretch = 0.96;
      r.hdx = -6;
      r.hdy = -2;
      r.hrot = -12 + 2 * n(16);
      r.ear = 0.95;
      r.mouth = 0.12 + 0.05 * n(17);
      r.tail = -28 + 4 * n(18);
      r.wag *= 0.3;
      break;
    }
    case "tumble": {
      // knocked over: body on its side, each leg flailing on its own noise
      const swingLeg = (k: number) => 60 * n(k, 1.8);
      const flexLeg = (k: number) => 20 + 25 * Math.abs(n(k, 1.5));
      r.direct = true;
      r.rot = 88 + 30 * n(20, 0.6);
      r.dy = -4 + 4 * n(21, 0.9);
      r.legs = [swingLeg(22), swingLeg(23), swingLeg(24), swingLeg(25)];
      r.knees = [flexLeg(32), flexLeg(33), flexLeg(34), flexLeg(35)];
      r.hdx = 2;
      r.hrot = 14 + 10 * n(26, 0.9);
      r.ear = 0.5 + 0.3 * n(27, 0.6);
      r.mouth = 0.3 + 0.2 * n(28, 1.2);
      r.tail = -35 + 25 * n(29, 1);
      r.wag *= 0.3;
      break;
    }
    case "sit": {
      // haunches down, hind paws folded forward, fore legs upright. Settle overshoots slightly.
      const settle = n(18, 0.25);
      r.feet = [
        [0, 0],
        [1, 0],
        [22, 0],
        [18, 0],
      ];
      r.rot = -18 + 1.5 * n(19, 0.4);
      r.dy = 16 + 2.2 * settle;
      r.hdy = -3;
      r.hrot = -10 + 2 * look;
      r.ear = 0.05;
      r.tail = -30 + 4 * n(24);
      r.mouth = 0.05;
      r.wag *= 0.2;
      break;
    }
    case "idle":
    default: {
      // Standing: each foot drifts on its own slow noise, and the weight rocks between the legs and
      // the body. The extra terms are zero unless the gait sets `idle`, so other animals stand as before.
      const w = g.idle ?? 0;
      r.feet = [
        [1.2 * n(1, 0.3) + w * 2.2 * n(11, 0.25), 0],
        [1.2 * n(3, 0.3) - w * 2.0 * n(13, 0.25), 0],
        [1.2 * n(5, 0.3) - w * 1.4 * n(15, 0.3), 0],
        [1.2 * n(7, 0.3) + w * 1.6 * n(17, 0.3), 0],
      ];
      r.dy = w * 0.9 * n(21, 0.4);
      r.rot = w * 1.4 * n(22, 0.35);
      r.hrot += w * 3 * n(23, 0.5);
      r.tail = 10 + 9 * n(10, 0.7);
      break;
    }
  }

  // Lean tilts the whole body and pushes the head forward (+) or back (-).
  r.rot += 3 * L;
  r.hrot += 16 * L;
  r.hdx += 5 * L;

  if (!r.direct) {
    // Each foot is placed in world space on the ground line, then mapped back into Frame space
    // (inverse of translate(dx, dy) rotate(rot)) so the tilted body still plants its paws.
    const th = (r.rot * Math.PI) / 180;
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    an.legs.forEach((c, i) => {
      const wx = c.x + r.feet[i][0];
      const wy = an.ground - padOf(c) - r.feet[i][1];
      const qx = wx - r.dx;
      const qy = wy - r.dy;
      const [sw, kn] = legIK(c, qx * cs + qy * sn, -qx * sn + qy * cs);
      r.legs[i] = sw;
      r.knees[i] = kn;
    });
  }
  return r;
};

/** Frames over which a pose change eases in (lunge included, so it stays quick). */
const BLEND = 10;

/** Quintic ease in and out, input clamped to 0..1. Flat at both ends, so the blend meets each pose with no step. */
const ease5 = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * u * (u * (u * 6 - 15) + 10);
};

/** Mixes two solved rigs by t (0 = a, 1 = b): body, head, ear, tail, mouth, eye, and every leg and knee angle. */
const blendRig = (a: Rig, b: Rig, t: number): Rig => {
  const m = (x: number, y: number) => x + (y - x) * t;
  return {
    ...b,
    dx: m(a.dx, b.dx),
    dy: m(a.dy, b.dy),
    rot: m(a.rot, b.rot),
    stretch: m(a.stretch, b.stretch),
    squash: m(a.squash, b.squash),
    hdx: m(a.hdx, b.hdx),
    hdy: m(a.hdy, b.hdy),
    hrot: m(a.hrot, b.hrot),
    tail: m(a.tail, b.tail),
    wag: m(a.wag, b.wag),
    ear: m(a.ear, b.ear),
    flap: m(a.flap, b.flap),
    flick: m(a.flick, b.flick),
    mouth: m(a.mouth, b.mouth),
    tongue: m(a.tongue, b.tongue),
    eye: m(a.eye, b.eye),
    feet: [0, 1, 2, 3].map((i) => [m(a.feet[i][0], b.feet[i][0]), m(a.feet[i][1], b.feet[i][1])]) as Feet,
    legs: [0, 1, 2, 3].map((i) => m(a.legs[i], b.legs[i])) as Quad,
    knees: [0, 1, 2, 3].map((i) => m(a.knees[i], b.knees[i])) as Quad,
  };
};

/**
 * solve(), with the pose change eased. For BLEND frames after poseStart, the rig blends from the solve of
 * prevPose to the solve of pose. Both solves use the same frame, so the motion stays continuous.
 */
const solvePosed = (
  pose: AnimalPose,
  prevPose: AnimalPose | undefined,
  poseStart: number | undefined,
  f: number,
  seed: number,
  lean: number,
  an: Anatomy,
): Rig => {
  const cur = solve(pose, f, seed, lean, an);
  if (prevPose === undefined || poseStart === undefined || prevPose === pose) return cur;
  const t = f - poseStart;
  if (t < 0 || t >= BLEND) return cur;
  return blendRig(solve(prevPose, f, seed, lean, an), cur, ease5(t / BLEND));
};

/** Places an animal at (x, y), scaled by s, mirrored when flip is set. */
const Pose: React.FC<{ x: number; y: number; s?: number; flip?: boolean; children?: React.ReactNode }> = ({
  x,
  y,
  s = 1,
  flip = false,
  children,
}) => <g transform={`translate(${x}, ${y}) scale(${flip ? -s : s}, ${s})`}>{children}</g>;

/** Whole-body posture: translation and rotation shared by every part. */
const Frame: React.FC<{ r: Rig; children?: React.ReactNode }> = ({ r, children }) => (
  <g transform={`translate(${r.dx}, ${r.dy}) rotate(${r.rot})`}>{children}</g>
);

interface LegSpec {
  x: number;
  y: number;
  up: number;
  low: number;
  w: number;
  color: string;
  lower?: string;
  paw: string;
  footR: number;
  far?: boolean;
  claws?: string;
  toes?: boolean;
  bend?: number; // +1 knee forward (fore leg), -1 knee backward (hind leg)
}

type LegSet = [LegSpec, LegSpec, LegSpec, LegSpec];

const INK = "#1d1512";

/** Two-segment leg hinged at the hip (x, y). Paw at the end of the lower segment. */
const Leg: React.FC<{ spec: LegSpec; swing: number; knee: number }> = ({ spec: c, swing, knee }) => {
  const toe = c.footR * 0.35;
  return (
    <g transform={`translate(${c.x}, ${c.y}) rotate(${-swing})`}>
      <rect x={-c.w / 2} y={-2} width={c.w} height={c.up + 4} rx={c.w / 2} fill={c.color} />
      <g transform={`translate(0, ${c.up}) rotate(${knee})`}>
        <rect x={-c.w * 0.42} y={-2} width={c.w * 0.84} height={c.low + 4} rx={c.w * 0.4} fill={c.lower ?? c.color} />
        {c.claws
          ? [-0.45, 0, 0.45].map((o) => {
              const cx = toe + o * c.footR;
              return (
                <path
                  key={o}
                  d={`M ${cx - 1.2} ${c.low + 2} L ${cx + 0.4} ${c.low + c.footR * 1.4} L ${cx + 1.4} ${c.low + 2} Z`}
                  fill={c.claws}
                />
              );
            })
          : null}
        <ellipse cx={toe} cy={c.low} rx={c.footR * 1.2} ry={c.footR * 0.6} fill={c.paw} />
        {c.toes
          ? [-1, 0, 1].map((o) => (
              <circle
                key={o}
                cx={toe + o * c.footR * 0.8}
                cy={c.low + c.footR * 0.2}
                r={c.footR * 0.42}
                fill={c.paw}
                stroke={INK}
                strokeOpacity={0.35}
                strokeWidth={0.6}
              />
            ))
          : null}
      </g>
    </g>
  );
};

/** Draws only the near (far = false) or only the far (far = true) legs of a set, in draw order. */
const Legs: React.FC<{ specs: LegSet; r: Rig; far: boolean }> = ({ specs, r, far }) => (
  <>
    {specs.map((c, i) => (!!c.far === far ? <Leg key={i} spec={c} swing={r.legs[i]} knee={r.knees[i]} /> : null))}
  </>
);

/* ------------------------------------------------------------------ */
/* Path helpers                                                         */
/* ------------------------------------------------------------------ */

/**
 * Tiger band that starts on the top outline of an ellipse (centre cx, radii rx, ry) at
 * horizontal position t (-1..1) and runs inward along the outline normal, so it bends with the body.
 */
const bandOn = (cx: number, rx: number, ry: number, t: number, len: number, w: number) => {
  const x = cx + rx * t;
  const y = -ry * Math.sqrt(Math.max(0, 1 - t * t));
  let nx = (x - cx) / (rx * rx);
  let ny = y / (ry * ry);
  const nl = Math.hypot(nx, ny) || 1;
  nx /= nl;
  ny /= nl;
  const ix = -nx; // inward
  const iy = -ny;
  const px = -iy; // across the band
  const py = ix;
  const ex = x + ix * len;
  const ey = y + iy * len;
  const mx = x + (ix * len) / 2;
  const my = y + (iy * len) / 2;
  const h = w * 0.5;
  return `M ${x + px * w} ${y + py * w} Q ${mx + px * h} ${my + py * h} ${ex} ${ey} Q ${mx - px * h} ${my - py * h} ${x - px * w} ${y - py * w} Z`;
};

/* ------------------------------------------------------------------ */
/* Fox                                                                  */
/* ------------------------------------------------------------------ */

const FOX = "#d4592a";
const FOX_DARK = "#a33f1d";
const CREAM = "#f6ecdc";
const FOX_GAIT: Gait = {
  walk: 0.2,
  run: 0.42,
  stride: 12,
  lift: 6,
  duty: 0.6,
  runDuty: 0.4,
  bob: 2,
  walkOffs: LATERAL,
  runOffs: TROT,
};
/* Red fox "stockings": warm dark brown, not black, so the legs hold against a dark night floor and wall. */
const FOX_STOCK = "#5e3522"; // near lower leg and paw
const FOX_STOCK_FAR = "#4c2b1c"; // far lower leg and paw, a step darker for depth
const FOX_SHIN = "#9a4622"; // warm mid tone where the red upper leg runs into the stocking
const FOX_SHIN_FAR = "#7c3a1d";
const FOX_PAW_TOP = "#8a5636"; // lighter top of the paw
const FOX_PAW_TOP_FAR = "#6e432b";
const FOX_RIM = "#ffb46a"; // lamplight caught on the leg edges
const FOX_SHADOW = "#140c08";
const FOX_LEGS: LegSet = [
  { x: 50, y: 12, up: 34, low: 32, w: 13, color: FOX, lower: FOX_STOCK, paw: FOX_STOCK, footR: 6.2, bend: 1 },
  { x: 36, y: 12, up: 34, low: 32, w: 13, color: FOX_DARK, lower: FOX_STOCK_FAR, paw: FOX_STOCK_FAR, footR: 6.2, far: true, bend: 1 },
  { x: -50, y: 12, up: 34, low: 32, w: 13, color: FOX, lower: FOX_STOCK, paw: FOX_STOCK, footR: 6.2, bend: -1 },
  { x: -30, y: 12, up: 34, low: 32, w: 13, color: FOX_DARK, lower: FOX_STOCK_FAR, paw: FOX_STOCK_FAR, footR: 6.2, far: true, bend: -1 },
];
const FOX_ANAT = anatomy(FOX_GAIT, FOX_LEGS);

/**
 * Fox leg: same hinge geometry as Leg (hip at (x, y), upper segment rotated by -swing, lower by knee), so the
 * IK and every pose are unchanged. The red upper leg darkens through a warm shin tone into a dark brown
 * stocking, so it reads as one limb. A thin warm rim runs down the front edge of both segments and over the
 * paw, with a fainter one on the back edge, and the paw top is lighter. Far legs get less contrast.
 */
const FoxLeg: React.FC<{ spec: LegSpec; swing: number; knee: number }> = ({ spec: c, swing, knee }) => {
  const far = !!c.far;
  const stock = c.lower ?? FOX_STOCK;
  const shin = far ? FOX_SHIN_FAR : FOX_SHIN;
  const pawTop = far ? FOX_PAW_TOP_FAR : FOX_PAW_TOP;
  const rimA = far ? 0.32 : 0.62; // front rim strength
  const rimB = far ? 0.12 : 0.26; // back rim strength
  const toe = c.footR * 0.35;
  const fr = c.footR;
  const uw = c.w; // upper width
  const lw = c.w * 0.84; // lower width
  const rimW = 1.5;
  return (
    <g transform={`translate(${c.x}, ${c.y}) rotate(${-swing})`}>
      {/* red upper leg, shading down into the stocking */}
      <rect x={-uw / 2} y={-2} width={uw} height={c.up + 4} rx={uw / 2} fill={c.color} />
      <rect x={-uw / 2} y={c.up * 0.5} width={uw} height={c.up * 0.5 + 2} rx={uw / 2} fill={shin} opacity={0.55} />
      <rect x={-uw / 2} y={c.up * 0.76} width={uw} height={c.up * 0.24 + 2} rx={uw / 2} fill={stock} opacity={0.75} />
      {/* rim light on the upper leg, strongest toward the knee where the lamp catches it */}
      <rect x={uw / 2 - rimW - 0.6} y={c.up * 0.3} width={rimW} height={c.up * 0.7 + 1} rx={rimW / 2} fill={FOX_RIM} opacity={rimA * 0.7} />
      <g transform={`translate(0, ${c.up}) rotate(${knee})`}>
        {/* dark brown stocking */}
        <rect x={-lw / 2} y={-2} width={lw} height={c.low + 4} rx={c.w * 0.4} fill={stock} />
        {/* soft lighter core so the stocking has form, not a flat silhouette */}
        <rect x={-lw * 0.1} y={1} width={lw * 0.42} height={c.low - 3} rx={lw * 0.2} fill={pawTop} opacity={far ? 0.22 : 0.3} />
        {/* front and back rims */}
        <rect x={lw / 2 - rimW - 0.4} y={-1} width={rimW} height={c.low} rx={rimW / 2} fill={FOX_RIM} opacity={rimA} />
        <rect x={-lw / 2 + 0.4} y={2} width={rimW * 0.8} height={c.low - 4} rx={rimW * 0.4} fill={FOX_RIM} opacity={rimB} />
        {/* paw, its lighter top, and the rim over the toes */}
        <ellipse cx={toe} cy={c.low} rx={fr * 1.2} ry={fr * 0.6} fill={c.paw} />
        <ellipse cx={toe + fr * 0.12} cy={c.low - fr * 0.2} rx={fr * 0.9} ry={fr * 0.3} fill={pawTop} opacity={far ? 0.7 : 0.9} />
        <path
          d={`M ${toe - fr * 0.7} ${c.low - fr * 0.48} Q ${toe + fr * 0.75} ${c.low - fr * 0.78} ${toe + fr * 1.18} ${c.low - fr * 0.05}`}
          fill="none"
          stroke={FOX_RIM}
          strokeWidth={1.2}
          strokeLinecap="round"
          opacity={rimA}
        />
      </g>
    </g>
  );
};

/** Draws only the near (far = false) or only the far (far = true) fox legs, in draw order. */
const FoxLegs: React.FC<{ r: Rig; far: boolean }> = ({ r, far }) => (
  <>
    {FOX_LEGS.map((c, i) => (!!c.far === far ? <FoxLeg key={i} spec={c} swing={r.legs[i]} knee={r.knees[i]} /> : null))}
  </>
);

/** SVG rotate(a) applied to a point. */
const rot2 = (x: number, y: number, a: number): Pair => {
  const t = (a * Math.PI) / 180;
  const cs = Math.cos(t);
  const sn = Math.sin(t);
  return [x * cs - y * sn, x * sn + y * cs];
};

/**
 * Soft contact shadow under each fox paw, on the ground line. The paw centre is found by running the leg's own
 * transforms forward (knee, hip, then the Frame's rotate and translate), so the shadow tracks the paw and fades
 * out as the paw lifts (swing, run, tumble). Two stacked ellipses give a soft edge without a filter id.
 */
const FoxPawShadows: React.FC<{ r: Rig }> = ({ r }) => (
  <>
    {FOX_LEGS.map((c, i) => {
      const fr = c.footR;
      const [kx, ky] = rot2(fr * 0.35, c.low, r.knees[i]);
      const [hx, hy] = rot2(kx, ky + c.up, -r.legs[i]);
      const [wx, wy] = rot2(hx + c.x, hy + c.y, r.rot);
      const px = wx + r.dx;
      const bottom = wy + r.dy + fr * 0.6;
      const h = Math.max(0, FOX_ANAT.ground - bottom);
      const k = 1 - smooth(h / 20);
      if (k <= 0.01) return null;
      const a = (c.far ? 0.26 : 0.36) * k;
      const spread = 1 + 0.5 * (1 - k);
      return (
        <g key={i}>
          <ellipse cx={px + 1} cy={FOX_ANAT.ground - 0.4} rx={fr * 2.1 * spread} ry={fr * 0.55} fill={FOX_SHADOW} opacity={a * 0.5} />
          <ellipse cx={px + 1} cy={FOX_ANAT.ground - 0.4} rx={fr * 1.3 * spread} ry={fr * 0.32} fill={FOX_SHADOW} opacity={a} />
        </g>
      );
    })}
  </>
);

export const Fox: React.FC<AnimalProps> = ({ f = 0, pose = "idle", lean = 0, prevPose, poseStart, ...p }) => {
  const r = solvePosed(pose, prevPose, poseStart, f, 11, lean, FOX_ANAT);
  const jaw = r.mouth;
  return (
    <Pose {...p}>
      <g transform={`translate(0, ${-FOX_ANAT.ground})`}>
        <FoxPawShadows r={r} />
        <Frame r={r}>
          {/* full bushy tail with a cream tip, rooted at the rump */}
          <g transform={`translate(-58, -8) rotate(${-10 + r.tail + 0.5 * r.wag})`}>
            <path
              d="M 0 -12 C -40 -56 -104 -52 -132 -22 C -148 -6 -146 12 -130 20 C -100 34 -44 28 0 14 Z"
              fill={FOX}
            />
            <ellipse cx={-140} cy={0} rx={15} ry={18} fill={CREAM} />
          </g>
          <FoxLegs r={r} far />
          <g transform={`scale(${r.stretch}, ${r.squash})`}>
            <ellipse cx={-4} cy={0} rx={70} ry={38} fill={FOX} />
            <ellipse cx={-10} cy={22} rx={58} ry={12} fill={FOX_DARK} opacity={0.3} />
            {/* cream chest */}
            <path d="M 40 -6 Q 66 0 64 24 Q 50 36 34 26 Z" fill={CREAM} />
          </g>
          <FoxLegs r={r} far={false} />
          {/* neck joins the body to the head */}
          <path d="M 30 -24 L 62 -36 L 82 -8 L 46 14 Z" fill={FOX} />
          <g transform={`translate(${78 + r.hdx}, ${-24 + r.hdy}) rotate(${r.hrot})`}>
            {/* pointed ears, pinned back by ear */}
            <g transform={`translate(-8, -16) rotate(${earAng(r, -16, -66)})`}>
              <path d="M -10 2 L -6 -38 L 10 2 Z" fill={FOX_DARK} />
              <path d="M -4 0 L -4 -26 L 5 0 Z" fill={INK} opacity={0.35} />
            </g>
            <g transform={`translate(8, -18) rotate(${earAng(r, 8, -66)})`}>
              <path d="M -9 2 L -4 -38 L 10 2 Z" fill={FOX} />
              <path d="M -3 0 L -1 -24 L 6 0 Z" fill={CREAM} opacity={0.5} />
            </g>
            <ellipse cx={0} cy={0} rx={24} ry={20} fill={FOX} />
            {/* cream cheek ruff */}
            <path d="M -4 8 Q 10 22 24 12 Q 12 16 -4 8 Z" fill={CREAM} />
            {/* sharp, long snout tapering to a point */}
            <path d="M 4 -10 Q 34 -14 60 0 Q 36 10 10 14 Q 0 8 4 -10 Z" fill={FOX} />
            <path d="M 12 6 Q 36 6 58 0 Q 38 14 12 14 Z" fill={CREAM} />
            {/* open jaw wedge, hidden when shut */}
            <path d={`M 14 12 Q 36 12 56 2 Q 40 ${12 + 12 * jaw} 14 ${12 + 4 * jaw} Z`} fill={INK} opacity={jaw} />
            <circle cx={58} cy={0} r={3.8} fill={INK} />
            <ellipse cx={10} cy={-6} rx={3.4} ry={4 * r.eye} fill={INK} />
            <circle cx={11.2} cy={-7.6} r={1.1} fill="#fff8ec" opacity={r.eye} />
          </g>
        </Frame>
      </g>
    </Pose>
  );
};

/* ------------------------------------------------------------------ */
/* Bagha dog (strong village dog)                                       */
/* ------------------------------------------------------------------ */

const COAT = "#b8793e";
const COAT_DARK = "#7f4f25";
const COAT_LIGHT = "#d7a46c";
const CHEST = "#f0dcb8";
const MUZZLE_LIGHT = "#f3e4c8";
const CREASE = "#5a3618";
const PAW = "#4a2e1b";
const EAR_IN = "#5c3a1e";
const DOG_GAIT: Gait = {
  walk: 0.17,
  run: 0.36,
  stride: 12,
  lift: 6,
  duty: 0.6,
  runDuty: 0.42,
  bob: 2.2,
  walkOffs: LATERAL,
  runOffs: TROT,
  idle: 1,
};
/* Same hip and segment lengths as before, so the walk, run and sit solves keep their ground contact. */
const DOG_LEGS: LegSet = [
  { x: 46, y: 14, up: 32, low: 30, w: 18, color: COAT, lower: COAT, paw: PAW, footR: 7, toes: true, bend: 1 },
  { x: 30, y: 14, up: 32, low: 30, w: 18, color: COAT_DARK, lower: COAT_DARK, paw: PAW, footR: 7, far: true, toes: true, bend: 1 },
  { x: -50, y: 14, up: 32, low: 30, w: 19, color: COAT, lower: COAT, paw: PAW, footR: 7, toes: true, bend: -1 },
  { x: -34, y: 14, up: 32, low: 30, w: 19, color: COAT_DARK, lower: COAT_DARK, paw: PAW, footR: 7, far: true, toes: true, bend: -1 },
];
const DOG_ANAT = anatomy(DOG_GAIT, DOG_LEGS);

/** Smooth closed outline through a ring of points: quadratic curves between the midpoints, each point a control. */
const smoothRing = (pts: Pair[]): string => {
  const n = pts.length;
  const mid = (a: Pair, b: Pair): Pair => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f2 = (p: Pair) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  let d = `M ${f2(mid(pts[n - 1], pts[0]))}`;
  for (let i = 0; i < n; i++) d += ` Q ${f2(pts[i])} ${f2(mid(pts[i], pts[(i + 1) % n]))}`;
  return `${d} Z`;
};

/**
 * Dog leg: one smooth tapered shape from the shoulder or haunch, through the knee or hock, to the paw. The top
 * starts inside the body (so there is no seam where the leg meets it), the back of the joint swells into the elbow
 * or hock point, and the paw sits over the rounded end of the leg, so it is always attached. Same hinge geometry
 * as Leg (hip at (x, y), upper segment rotated by -swing, lower segment by knee relative to it).
 */
const DogLeg: React.FC<{ spec: LegSpec; swing: number; knee: number }> = ({ spec: c, swing, knee }) => {
  const hind = (c.bend ?? 1) < 0;
  const w = c.w;
  const toe = c.footR * 0.35;
  const s = (swing * Math.PI) / 180;
  const b = ((knee - swing) * Math.PI) / 180;
  // upper bone direction and its front normal; lower bone direction and its front normal
  const u: Pair = [Math.sin(s), Math.cos(s)];
  const nu: Pair = [Math.cos(s), -Math.sin(s)];
  const l: Pair = [-Math.sin(b), Math.cos(b)];
  const nl: Pair = [Math.cos(b), Math.sin(b)];
  const kx = c.x + c.up * u[0];
  const ky = c.y + c.up * u[1];
  /** Point in the upper segment's frame (x across, front positive; y along the bone from the hip). */
  const up = (x: number, y: number): Pair => [c.x + x * nu[0] + y * u[0], c.y + x * nu[1] + y * u[1]];
  /** Point in the lower segment's frame (y along the bone from the knee). */
  const lo = (x: number, y: number): Pair => [kx + x * nl[0] + y * l[0], ky + x * nl[1] + y * l[1]];
  // joint normal: the bisector of the two segment normals, widened so the joint keeps its thickness when bent
  let jx = nu[0] + nl[0];
  let jy = nu[1] + nl[1];
  const jl = Math.hypot(jx, jy);
  if (jl < 1e-3) {
    jx = nu[0];
    jy = nu[1];
  } else {
    jx /= jl;
    jy /= jl;
  }
  const miter = 1 / Math.max(0.62, jx * nu[0] + jy * nu[1]);
  const jw = w * 0.38 * Math.min(1.5, miter);
  const bulge = hind ? 1.3 : 1.15; // hock or elbow point at the back of the joint
  // half widths, tapering from the shoulder or haunch to the ankle; hind legs carry a broader thigh at the back
  const topF = w * (hind ? 0.6 : 0.56);
  const topB = w * (hind ? 0.74 : 0.56);
  const midF = w * (hind ? 0.5 : 0.46);
  const midB = w * (hind ? 0.58 : 0.46);
  const ring: Pair[] = [
    up(0, -w * 0.45), // top, tucked into the body
    up(topF, -w * 0.1),
    up(midF, c.up * 0.5),
    [kx + jx * jw, ky + jy * jw],
    lo(w * 0.33, c.low * 0.5),
    lo(w * 0.29, c.low * 0.88),
    lo(toe * 0.5, c.low + w * 0.32), // rounded end, under the paw
    lo(-w * 0.3, c.low * 0.88),
    lo(-w * 0.34, c.low * 0.5),
    [kx - jx * jw * bulge, ky - jy * jw * bulge],
    up(-midB, c.up * 0.5),
    up(-topB, -w * 0.1),
  ];
  const [px, py] = lo(toe, c.low);
  const pawRot = knee - swing;
  return (
    <g>
      <path d={smoothRing(ring)} fill={c.color} />
      {/* soft fold on the inside of the joint */}
      <path
        d={`M ${lo(-w * 0.32, -w * 0.05).join(" ")} Q ${lo(-w * 0.12, w * 0.1).join(" ")} ${lo(w * 0.02, w * 0.05).join(" ")}`}
        stroke={CREASE}
        strokeOpacity={0.22}
        strokeWidth={1.1}
        strokeLinecap="round"
        fill="none"
      />
      {/* paw over the rounded end of the leg, turned with the lower segment */}
      <g transform={`rotate(${pawRot.toFixed(3)}, ${px.toFixed(2)}, ${py.toFixed(2)})`}>
        <ellipse cx={px} cy={py} rx={c.footR * 1.2} ry={c.footR * 0.62} fill={c.paw} />
        {[0.55, 1.05].map((o) => (
          <path
            key={o}
            d={`M ${px + c.footR * o} ${py - 0.5} L ${px + c.footR * o} ${py + c.footR * 0.5}`}
            stroke={INK}
            strokeOpacity={0.5}
            strokeWidth={0.7}
          />
        ))}
      </g>
    </g>
  );
};

/** Draws only the near (far = false) or only the far (far = true) dog legs, in draw order. */
const DogLegs: React.FC<{ r: Rig; far: boolean }> = ({ r, far }) => (
  <>
    {DOG_LEGS.map((c, i) => (!!c.far === far ? <DogLeg key={i} spec={c} swing={r.legs[i]} knee={r.knees[i]} /> : null))}
  </>
);

export const BaghaDog: React.FC<AnimalProps> = ({ f = 0, pose = "idle", lean = 0, prevPose, poseStart, ...p }) => {
  const r = solvePosed(pose, prevPose, poseStart, f, 37, lean, DOG_ANAT);
  const jaw = r.mouth;
  return (
    <Pose {...p}>
      <g transform={`translate(0, ${-DOG_ANAT.ground})`}>
        <Frame r={r}>
          {/* upright tail with a slight curl at the tip, wagging from its root */}
          <g transform={`translate(-58, -20) rotate(${-12 + 0.5 * r.tail + r.wag})`}>
            <path
              d="M 0 6 C -6 -10 -8 -24 -4 -36 C -1 -44 6 -46 8 -40"
              fill="none"
              stroke={COAT}
              strokeWidth={9}
              strokeLinecap="round"
            />
          </g>
          <DogLegs r={r} far />
          <g transform={`scale(${r.stretch}, ${r.squash})`}>
            {/* deep barrel body and chest */}
            <ellipse cx={-6} cy={0} rx={62} ry={34} fill={COAT} />
            <ellipse cx={34} cy={6} rx={30} ry={35} fill={COAT} />
            {/* topline highlight and belly shade give the body its weight */}
            <ellipse cx={-6} cy={-16} rx={40} ry={9} fill={COAT_LIGHT} opacity={0.3} />
            <ellipse cx={-4} cy={20} rx={46} ry={9} fill={COAT_DARK} opacity={0.3} />
            {/* lighter chest */}
            <ellipse cx={42} cy={10} rx={18} ry={22} fill={CHEST} />
          </g>
          <DogLegs r={r} far={false} />
          {/* strong neck */}
          <path d="M 14 -30 Q 44 -46 64 -34 L 78 -12 Q 60 14 26 16 Z" fill={COAT} />
          <g transform={`translate(${76 + r.hdx}, ${-22 + r.hdy}) rotate(${r.hrot})`}>
            {/* upright alert ear on the far side, tipped slightly up; ear and flicks swing it */}
            <g transform={`translate(2, -14) rotate(${earAng(r, -8, -40)})`}>
              <path d="M -9 4 Q -11 -14 -3 -28 Q 3 -33 6 -26 Q 9 -12 8 4 Z" fill={COAT} />
              <path d="M -4 2 Q -5 -10 -1 -20 Q 3 -12 3 2 Z" fill={EAR_IN} opacity={0.7} />
            </g>
            {/* floppy ear hangs from the back of the skull; ear, flick and flap swing it */}
            <g transform={`translate(-12, -10) rotate(${earAng(r, 14, 42) + r.flap})`}>
              <path d="M -4 -2 Q -24 0 -24 18 Q -24 34 -10 34 Q 2 30 4 14 Q 6 2 4 -2 Z" fill={COAT_DARK} />
            </g>
            {/* broad skull */}
            <ellipse cx={0} cy={0} rx={21} ry={20} fill={COAT} />
            <ellipse cx={-2} cy={10} rx={15} ry={8} fill={CHEST} opacity={0.6} />
            {/* defined muzzle with a black nose and a clear mouth line */}
            <path d="M 6 -9 Q 26 -13 44 -7 Q 55 -3 55 4 Q 53 11 40 12 Q 22 14 8 11 Z" fill={MUZZLE_LIGHT} />
            <ellipse cx={53} cy={1} rx={4.2} ry={3.6} fill={INK} />
            <path d="M 10 11 Q 30 15 49 8" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
            {/* open jaw wedge, hidden when shut */}
            <path d={`M 10 11 Q 30 15 49 8 Q 36 ${15 + 12 * jaw} 10 ${11 + 3 * jaw} Z`} fill={INK} opacity={jaw} />
            {/* brow and eye */}
            <path d="M 5 -12 Q 12 -15 19 -11" fill="none" stroke={COAT_DARK} strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />
            <ellipse cx={12} cy={-6} rx={3} ry={3.4 * r.eye} fill={INK} />
            <circle cx={13} cy={-7.2} r={0.9} fill="#fff8ec" opacity={r.eye} />
          </g>
        </Frame>
      </g>
    </Pose>
  );
};

/* ------------------------------------------------------------------ */
/* Go-saap (Bengal monitor, Varanus bengalensis)                        */
/* ------------------------------------------------------------------ */

/*
 * A big Bengal monitor in side view, facing right, origin on the ground line under the trunk. About 624 units
 * from snout to tail tip: a 72-unit narrow head with a hooded eye and a slit nostril, a long thick neck, a heavy
 * trunk, and a long, laterally flattened tail (about 55% of the length) that lies along the sand. Olive-brown
 * skin of small scales with dark crossbands and rows of yellowish spots; the tail is banded to the tip.
 * Sprawling legs: the upper limbs are foreshortened (they reach out sideways), so the elbows and knees bow out
 * beside the body, and the feet have five long toes with dark curved claws.
 *
 * The walk is the lateral sequence of a lizard: the body swings side to side (the head yaws one way while the
 * tail wave runs the other), the legs splay, and the motion can stop and start (pass `step` from the distance
 * travelled, so planted feet never slide). Extra props drive the menace and the settling: `tongue`, `hiss`
 * (throat puffed, mouth open, body raised and inflated), `flat` (belly down on the sand, legs stretched out),
 * `lid` (eyelid closure) and `neck` (head raise).
 */

const SAAP_SKIN = "#6d6742";
const SAAP_SKIN_L = "#a39864";
const SAAP_FLANK = "#4f4a2b";
const SAAP_DARK = "#2c2817";
const SAAP_BELLY = "#c9b986";
const SAAP_SPOT = "#e3c55c";
const SAAP_FAR = "#47422a";
const SAAP_FAR_D = "#36321f";
const SAAP_CLAW = "#241d14";
const SAAP_CLAW_L = "#7d6c50";
const SAAP_TONGUE = "#a5466b";
const SAAP_TONGUE_D = "#6e2a48";
const SAAP_MOUTH = "#8e3f4a";
const SAAP_IRIS = "#b98a2e";

export interface GoSaapProps extends AnimalProps {
  /** Gait phase in cycles. Overrides the pose's own clock, so the legs stop when the body stops. */
  step?: number;
  /** 0..1 walking weight (legs cycling, body swinging). Default: 1 for walk, run and flee, else 0. */
  move?: number;
  /** 0..1 forked tongue out. Default: the rig's own occasional flicks. */
  tongue?: number;
  /** 0..1 eyelid closure (0 wide open, about 0.6 half closed). Default: a slightly hooded eye with blinks. */
  lid?: number;
  /** 0..1 threat display: throat puffed, mouth open, body raised and inflated, neck arched. */
  hiss?: number;
  /** 0..1 lying flat: belly on the sand, front feet forward, hind legs stretched back. */
  flat?: number;
  /** Head raise in degrees (+ lifts the head on the neck). */
  neck?: number;
  /** Head yaw -1..1 (the side-to-side head swing). Default: swings with the gait and drifts slowly at rest. */
  look?: number;
}

const SAAP_GAIT_S = 14; // half stride (units)
const SAAP_DUTY = 0.7;
/** Body travel per gait cycle, in body units: a planted foot slides back 2S over the stance share of the cycle. */
export const GOSAAP_STRIDE = (2 * SAAP_GAIT_S) / SAAP_DUTY;

const SAAP_VENT = -104;
const SAAP_NECK0 = 64;
const SAAP_HEAD_X = 118;
const SAAP_TAIL_LEN = 330;
const SAAP_PIVOT: Pair = [60, -26];

/** Rotates p about c by deg (SVG sense: + is clockwise on screen). */
const saapRot = (p: Pair, c: Pair, deg: number): Pair => {
  const a = (deg * Math.PI) / 180;
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};

/** A tapered capsule from a (radius ra) to b (radius rb), as one closed outline. */
const saapCapsule = (a: Pair, b: Pair, ra: number, rb: number): string => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  const f2 = (p: Pair) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
  if (l <= Math.abs(ra - rb) + 0.01) {
    const c = ra >= rb ? a : b;
    const r = Math.max(ra, rb);
    return `M ${(c[0] - r).toFixed(2)} ${c[1].toFixed(2)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  }
  const ux = dx / l;
  const uy = dy / l;
  const nx = -uy;
  const ny = ux;
  const sn = (ra - rb) / l;
  const cs = Math.sqrt(Math.max(0, 1 - sn * sn));
  const m1: Pair = [nx * cs + ux * sn, ny * cs + uy * sn];
  const m2: Pair = [-nx * cs + ux * sn, -ny * cs + uy * sn];
  const a1: Pair = [a[0] + m1[0] * ra, a[1] + m1[1] * ra];
  const b1: Pair = [b[0] + m1[0] * rb, b[1] + m1[1] * rb];
  const b2: Pair = [b[0] + m2[0] * rb, b[1] + m2[1] * rb];
  const a2: Pair = [a[0] + m2[0] * ra, a[1] + m2[1] * ra];
  return `M ${f2(a1)} L ${f2(b1)} A ${rb.toFixed(2)} ${rb.toFixed(2)} 0 ${sn < 0 ? 1 : 0} 0 ${f2(b2)} L ${f2(a2)} A ${ra.toFixed(2)} ${ra.toFixed(2)} 0 ${sn > 0 ? 1 : 0} 0 ${f2(a1)} Z`;
};

/** Two-bone solve in screen space: the knee bends to the side `bend` (+1 rotates it clockwise from the hip-foot line). */
const saapIK = (hip: Pair, foot: Pair, l1: number, l2: number, bend: number): { knee: Pair; end: Pair } => {
  const dx = foot[0] - hip[0];
  const dy = foot[1] - hip[1];
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const k = base + bend * a;
  return { knee: [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)], end: [hip[0] + d * Math.cos(base), hip[1] + d * Math.sin(base)] };
};

interface SaapLegDef {
  hip: Pair; // body frame (belly baseline at y = 0)
  rest: number; // foot rest x
  flatDx: number; // extra foot reach when lying flat
  l1: number;
  l2: number;
  bend: number;
  r1: number;
  r2: number;
  far: boolean;
  front: boolean;
}

/** Near front, far front, near hind, far hind (the order of LATERAL). */
const SAAP_LEG_DEFS: SaapLegDef[] = [
  { hip: [54, -24], rest: 66, flatDx: 10, l1: 17, l2: 25, bend: 1, r1: 8.5, r2: 6, far: false, front: true },
  { hip: [44, -29], rest: 58, flatDx: 8, l1: 15, l2: 24, bend: 1, r1: 7.5, r2: 5.4, far: true, front: true },
  { hip: [-84, -24], rest: -94, flatDx: -18, l1: 21, l2: 27, bend: -1, r1: 10, r2: 6.4, far: false, front: false },
  { hip: [-94, -29], rest: -106, flatDx: -16, l1: 19, l2: 26, bend: -1, r1: 9, r2: 5.8, far: true, front: false },
];

/** One sprawling leg: a thick foreshortened upper limb, the forearm or shin down to the foot, and five clawed toes. */
const SaapLegShape: React.FC<{ hip: Pair; foot: Pair; lift: number; d: SaapLegDef }> = ({ hip, foot, lift, d }) => {
  const ankle: Pair = [foot[0], foot[1] - 4];
  const { knee, end } = saapIK(hip, ankle, d.l1, d.l2, d.bend);
  const col = d.far ? SAAP_FAR : SAAP_SKIN;
  const shade = d.far ? SAAP_FAR_D : SAAP_FLANK;
  // toes fan forward along the sand; a lifted foot droops its toes
  const droop = 0.5 * clamp(lift / 6, 0, 1);
  const toes = d.front ? [6, 9, 11, 10, 7] : [6, 9, 11, 13, 8];
  const spread = d.front ? 1.6 : 1.9;
  return (
    <g>
      <path d={saapCapsule(hip, knee, d.r1, d.r1 * 0.78)} fill={col} />
      <path d={saapCapsule(knee, end, d.r1 * 0.72, d.r2)} fill={col} />
      {/* scale rings and shade on the underside of the limb */}
      <path d={saapCapsule([knee[0], knee[1] + 1.5], [end[0], end[1] + 1], d.r1 * 0.45, d.r2 * 0.5)} fill={shade} opacity={0.55} />
      {[0.3, 0.55, 0.8].map((t) => {
        const cx = knee[0] + (end[0] - knee[0]) * t;
        const cy = knee[1] + (end[1] - knee[1]) * t;
        return <ellipse key={t} cx={cx} cy={cy} rx={d.r2 * 0.95} ry={1} fill={SAAP_DARK} opacity={0.28} />;
      })}
      <ellipse cx={knee[0]} cy={knee[1]} rx={d.r1 * 0.8} ry={d.r1 * 0.7} fill={col} />
      {/* the foot and five long toes, each ending in a dark curved claw */}
      <ellipse cx={end[0] + 2} cy={end[1] + 1.2} rx={d.r2 * 1.25} ry={d.r2 * 0.8} fill={col} />
      {toes.map((len, i) => {
        // the toes spread sideways on the sand, so in side view the outer ones sit a little higher (further away)
        const o = (i - 2) * 1.6 * spread;
        const bx = end[0] + 2 + o * 0.5;
        const by = end[1] + 1.5;
        const tx = bx + len * (0.95 - 0.07 * Math.abs(i - 2));
        const ty = Math.min(-0.8, foot[1] - 1.6 - (2 - i) * 0.7 + droop * len * 0.5);
        const cl = 4.6;
        return (
          <g key={i}>
            <path d={saapCapsule([bx, by], [tx, ty], 2.3, 1.3)} fill={i % 2 ? col : shade} />
            <path
              d={`M ${(tx - 0.6).toFixed(2)} ${(ty - 1.2).toFixed(2)} Q ${(tx + cl * 0.9).toFixed(2)} ${(ty - 1.6).toFixed(2)} ${(tx + cl).toFixed(2)} ${(ty + 1.8).toFixed(2)} Q ${(tx + cl * 0.45).toFixed(2)} ${(ty + 0.2).toFixed(2)} ${(tx - 0.4).toFixed(2)} ${(ty + 1).toFixed(2)} Z`}
              fill={SAAP_CLAW}
            />
            <path d={`M ${tx.toFixed(2)} ${(ty - 0.9).toFixed(2)} Q ${(tx + cl * 0.7).toFixed(2)} ${(ty - 1.2).toFixed(2)} ${(tx + cl * 0.85).toFixed(2)} ${(ty + 0.8).toFixed(2)}`} stroke={SAAP_CLAW_L} strokeWidth={0.5} fill="none" opacity={0.7} />
          </g>
        );
      })}
    </g>
  );
};

/** Yellowish spot rows and dark speckles on the trunk (fractions along the trunk, fraction down from the back). */
const SAAP_TRUNK_SPOTS: Array<[number, number, number]> = Array.from({ length: 34 }, (_, i) => {
  const h = Math.sin(i * 91.7 + 13.1) * 43758.5453;
  const r = h - Math.floor(h);
  return [0.04 + 0.92 * ((i * 0.618) % 1), 0.12 + 0.5 * r, 1.3 + 1.2 * ((i * 0.37) % 1)];
});

export const GoSaap: React.FC<GoSaapProps> = ({
  f = 0,
  pose = "idle",
  lean = 0,
  prevPose,
  poseStart,
  step,
  move,
  tongue,
  lid,
  hiss,
  flat,
  neck,
  look,
  ...p
}) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // pose defaults, eased over BLEND frames after a pose change
  const poseMove = (q: AnimalPose) => (q === "walk" ? 1 : q === "run" || q === "flee" ? 1.25 : 0);
  const poseHiss = (q: AnimalPose) => (q === "lunge" || q === "bite" ? 0.7 : 0);
  const pb = prevPose !== undefined && poseStart !== undefined && prevPose !== pose ? ease5((f - poseStart) / BLEND) : 1;
  const mixP = (fn: (q: AnimalPose) => number) => (prevPose !== undefined ? fn(prevPose) + (fn(pose) - fn(prevPose)) * pb : fn(pose));
  const m = clamp(move ?? mixP(poseMove), 0, 1.4);
  const H = clamp(hiss ?? mixP(poseHiss), 0, 1);
  const F = clamp(flat ?? (pose === "sit" ? 1 : 0), 0, 1);
  const ph = step ?? f * (pose === "run" || pose === "flee" ? 0.07 : 0.034);
  const seed = 71;
  const n = (k: number, rate = 1) => nz(f, seed + k, rate);

  // body height: a walk carries the belly clear of the sand, rest lowers it, lying flat puts it down
  const breath = 1 + 0.018 * Math.sin((2 * Math.PI * f) / 64 + 1.3);
  const inflate = breath * (1 + 0.14 * H);
  const c = Math.max(0, (1 - F) * (6 + 6 * Math.min(1, m)) + 13 * H);
  const swing = Math.min(1, m) * Math.sin(2 * Math.PI * ph);
  const yaw = clamp(look ?? (0.55 * swing + 0.35 * n(4, 0.35) * (1 - 0.7 * F)), -1, 1);
  const bob = Math.min(1, m) * 1.6 * Math.pow(Math.sin(2 * Math.PI * ph), 2);
  const B = (pt: Pair): Pair => [pt[0], pt[1] - c - bob]; // body frame to ground frame

  // legs: lateral sequence, feet planted through stance, splayed out when flat
  const feet = SAAP_LEG_DEFS.map((d, i) => {
    const u = fract(ph + LATERAL[i]);
    const [sx, lift] = stepFoot(u, SAAP_GAIT_S, 7, SAAP_DUTY);
    const k = Math.min(1, m);
    const x = d.rest + F * d.flatDx + k * sx + (1 - k) * 1.2 * n(i * 3 + 1, 0.3);
    return { foot: [x, -k * lift] as Pair, lift: k * lift };
  });

  // trunk profile in the body frame (belly baseline at 0)
  const topAt = (x: number) => {
    const u = clamp((x - SAAP_VENT) / (SAAP_NECK0 - SAAP_VENT), 0, 1);
    return -(34 + 14 * Math.sin(Math.PI * Math.pow(u, 0.9))) * inflate;
  };
  const botAt = (x: number) => {
    const u = clamp((x - SAAP_VENT) / (SAAP_NECK0 - SAAP_VENT), 0, 1);
    return -10 * (1 - Math.sin(Math.PI * u)) + 2 * (inflate - 1) * 10;
  };
  // neck raise: the threat display arches it, `neck` lifts it, lean lowers it; it bends progressively along the neck
  const theta = (neck ?? 0) + 14 * H + 2.5 * n(6, 0.5) * (1 - F) - 9 * clamp(lean, -1, 1) - 4 * F;
  const neckPt = (x: number, y: number): Pair => {
    const u = clamp((x - SAAP_NECK0) / (SAAP_HEAD_X - SAAP_NECK0), 0, 1);
    return saapRot([x, y], SAAP_PIVOT, -theta * u);
  };
  const gular = (x: number) => (3 + 13 * H) * Math.exp(-Math.pow((x - 100) / 16, 2)); // throat pouch, sagging down

  // tail: down from the vent to the sand and along it, tapering; a wave runs down it with the body swing
  const tailCurl = (1 - F) * (0.25 + 0.75 * H);
  const tail = (t: number) => {
    const half = 12.5 * Math.pow(1 - t, 0.85) + 1.3;
    const x = SAAP_VENT - SAAP_TAIL_LEN * t * (1 - 0.04 * Math.abs(swing) * t);
    const down = c + bob - half; // centre height that rests the tail on the sand
    const wave = (5 * Math.min(1, m) * Math.sin(2 * Math.PI * ph - 3 * t) + 3 * n(30, 0.4)) * t;
    const y = -22 + (down + 22) * smooth(t * 3.2) + wave - tailCurl * 16 * Math.pow(t, 2.4);
    return { x, y, half };
  };

  const TN = 16;
  const top: Pair[] = [];
  const bot: Pair[] = [];
  for (let i = TN; i >= 1; i--) {
    const { x, y, half } = tail(i / TN);
    top.push([x, y - half]);
  }
  for (let x = SAAP_VENT; x <= SAAP_NECK0; x += 21) top.push([x, topAt(x)]);
  for (let x = SAAP_NECK0 + 9; x <= SAAP_HEAD_X; x += 9) {
    const u = (x - SAAP_NECK0) / (SAAP_HEAD_X - SAAP_NECK0);
    top.push(neckPt(x, topAt(SAAP_NECK0) + (-38 - topAt(SAAP_NECK0)) * u));
  }
  for (let x = SAAP_HEAD_X; x > SAAP_NECK0; x -= 9) {
    const u = (x - SAAP_NECK0) / (SAAP_HEAD_X - SAAP_NECK0);
    bot.push(neckPt(x, botAt(SAAP_NECK0) + (-12 - botAt(SAAP_NECK0)) * u + gular(x)));
  }
  for (let x = SAAP_NECK0; x >= SAAP_VENT; x -= 21) bot.push([x, botAt(x)]);
  for (let i = 1; i <= TN; i++) {
    const { x, y, half } = tail(i / TN);
    bot.push([x, y + half]);
  }
  const ring = [...top, ...bot].map(B);
  const bodyD = smoothRing(ring);
  // lower half of the body (back to belly), for the flank shade
  const midTop = top;
  const lowerRing = (() => {
    // pair each top point with the bottom point at about the same x: the outline is ordered so bot is reversed
    const botRev = [...bot].reverse();
    const mids: Pair[] = [];
    const L = Math.min(midTop.length, botRev.length);
    for (let i = 0; i < L; i++) mids.push([(midTop[i][0] + botRev[i][0]) / 2, midTop[i][1] * 0.42 + botRev[i][1] * 0.58]);
    return smoothRing([...mids, ...bot].map(B));
  })();
  const backLine = top.slice(4, top.length - 2).map(B);
  const backD = `M ${backLine.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" L ")}`;

  // crossbands across the back and around the tail, with yellow spots in the bands of the tail
  const bands: string[] = [];
  for (const x of [-78, -46, -14, 18, 48]) {
    const t0 = topAt(x);
    const b0 = botAt(x);
    const a = B([x - 4, t0 - 3]);
    const b2 = B([x + 4, t0 - 3]);
    const d2 = B([x + 1, t0 + (b0 - t0) * 0.62]);
    const e = B([x - 7, t0 + (b0 - t0) * 0.6]);
    bands.push(`M ${a[0]} ${a[1]} L ${b2[0]} ${b2[1]} L ${d2[0]} ${d2[1]} L ${e[0]} ${e[1]} Z`);
  }
  const tailBands: Array<{ d: string; cx: number; cy: number; w: number }> = [];
  for (let k = 0; k < 11; k++) {
    const t = 0.07 + k * 0.085;
    const q0 = tail(t);
    const q1 = tail(t + 0.035);
    const A1 = B([q0.x, q0.y - q0.half - 2]);
    const A2 = B([q1.x, q1.y - q1.half - 2]);
    const A3 = B([q1.x, q1.y + q1.half + 2]);
    const A4 = B([q0.x, q0.y + q0.half + 2]);
    const mid = B([(q0.x + q1.x) / 2, (q0.y + q1.y) / 2 - q0.half * 0.25]);
    tailBands.push({ d: `M ${A1[0]} ${A1[1]} L ${A2[0]} ${A2[1]} L ${A3[0]} ${A3[1]} L ${A4[0]} ${A4[1]} Z`, cx: mid[0], cy: mid[1], w: q0.half });
  }
  const spots = SAAP_TRUNK_SPOTS.map(([u, v, r]) => {
    const x = SAAP_VENT + 8 + u * (SAAP_NECK0 - SAAP_VENT - 10);
    const t0 = topAt(x);
    return { p: B([x, t0 + (botAt(x) - t0) * v]), r };
  });

  // head: on the end of the neck, nose lowered by lean, yawing with the body swing
  const E = B(neckPt(SAAP_HEAD_X, -24));
  const headRot = -theta;
  const yawS = 1 - 0.16 * Math.abs(yaw);
  const blinkP = Math.sin(f * 0.0917 + seed) * Math.sin(f * 0.0331 + seed * 3.1);
  const lidV = clamp(lid ?? 0.14 + 0.86 * smooth((blinkP - 0.94) / 0.05), 0, 1) * (1 - 0.8 * H);
  const tongueV = clamp(tongue ?? smooth((n(14, 0.8) - 0.72) / 0.2), 0, 1);
  const jaw = 3 + 24 * H; // degrees open
  const jawTip = saapRot([71, 1.6], [10, 3], jaw);
  const tl = 36 * tongueV;
  const tAng = 0.1 + 0.12 * Math.sin(f * 1.9) + 0.25 * H;
  const tw = Math.sin(f * 2.7) * 1.4 * tongueV;
  const tipX = 72 + tl * Math.cos(tAng);
  const tipY = 1.5 + tl * Math.sin(tAng) + tw;
  const fork = 9 * tongueV;

  // legs in the ground frame
  const legEls = (far: boolean) =>
    SAAP_LEG_DEFS.map((d, i) =>
      d.far === far ? <SaapLegShape key={i} hip={B(d.hip)} foot={feet[i].foot} lift={feet[i].lift} d={d} /> : null,
    );

  return (
    <Pose {...p}>
      <defs>
        <pattern id={`${uid}-sc`} patternUnits="userSpaceOnUse" width={5} height={8}>
          <ellipse cx={2.5} cy={2} rx={1.7} ry={1.3} fill={SAAP_DARK} opacity={0.4} />
          <ellipse cx={0} cy={6} rx={1.7} ry={1.3} fill={SAAP_DARK} opacity={0.4} />
          <ellipse cx={5} cy={6} rx={1.7} ry={1.3} fill={SAAP_DARK} opacity={0.4} />
          <circle cx={2} cy={1.4} r={0.55} fill={SAAP_SKIN_L} opacity={0.55} />
          <circle cx={4.5} cy={5.4} r={0.55} fill={SAAP_SKIN_L} opacity={0.55} />
        </pattern>
        <clipPath id={`${uid}-clip`}>
          <path d={bodyD} />
        </clipPath>
      </defs>

      {/* soft contact shadow under the trunk and along the tail */}
      <ellipse cx={-20} cy={1} rx={110 + 14 * F} ry={7 + 3 * F} fill="#2a1a0c" opacity={0.3 + 0.12 * F} />
      <ellipse cx={-260} cy={1} rx={170} ry={4} fill="#2a1a0c" opacity={0.18} />

      {legEls(true)}

      {/* body, neck and tail: one outline with flank shade, scales, crossbands and spots */}
      <path d={bodyD} fill={SAAP_SKIN} />
      <g clipPath={`url(#${uid}-clip)`}>
        <path d={lowerRing} fill={SAAP_FLANK} opacity={0.75} />
        <path d={bodyD} fill={`url(#${uid}-sc)`} opacity={0.7} />
        {bands.map((d, i) => (
          <path key={`b${i}`} d={d} fill={SAAP_DARK} opacity={0.5} />
        ))}
        {tailBands.map((b, i) => (
          <path key={`t${i}`} d={b.d} fill={SAAP_DARK} opacity={0.55} />
        ))}
        {tailBands.map((b, i) => (
          <circle key={`ts${i}`} cx={b.cx} cy={b.cy} r={Math.max(0.8, 0.16 * b.w)} fill={SAAP_SPOT} opacity={0.7} />
        ))}
        {spots.map((s, i) => (
          <circle key={`s${i}`} cx={s.p[0]} cy={s.p[1]} r={s.r} fill={i % 5 === 0 ? SAAP_DARK : SAAP_SPOT} opacity={i % 5 === 0 ? 0.5 : 0.78} />
        ))}
        {/* sunlight along the back and the low dorsal keel of the tail */}
        <path d={backD} stroke={SAAP_SKIN_L} strokeWidth={5} fill="none" opacity={0.45} strokeLinejoin="round" />
        {/* pale throat pouch, puffing out in the threat display */}
        {(() => {
          const g = B(neckPt(100, -12 + gular(100) * 0.45));
          return <ellipse cx={g[0]} cy={g[1]} rx={18 + 6 * H} ry={5 + 8 * H} fill={SAAP_BELLY} opacity={0.55 + 0.25 * H} />;
        })()}
      </g>
      <path d={bodyD} fill="none" stroke={SAAP_DARK} strokeWidth={1.1} opacity={0.55} />
      {H > 0.02 &&
        [0, 1, 2].map((k) => {
          const a = B(neckPt(88 + 9 * k, -12 + gular(88 + 9 * k) * 0.9));
          return <path key={`g${k}`} d={`M ${a[0] - 4} ${a[1] - 3} Q ${a[0]} ${a[1] + 2} ${a[0] + 4} ${a[1] - 3}`} stroke={SAAP_FLANK} strokeWidth={0.9} fill="none" opacity={0.6 * H} />;
        })}

      {legEls(false)}

      {/* head: long and narrow, a heavy brow hooding the eye, a slit nostril, the mouth line, the forked tongue */}
      <g transform={`translate(${E[0].toFixed(2)} ${E[1].toFixed(2)}) rotate(${headRot.toFixed(2)}) scale(${yawS.toFixed(3)} 1)`}>
        {tongueV > 0.02 && (
          <g strokeLinecap="round" fill="none">
            <path d={`M 66 2 Q ${(66 + tipX) / 2} ${(2 + tipY) / 2 - tw} ${tipX.toFixed(2)} ${tipY.toFixed(2)}`} stroke={SAAP_TONGUE} strokeWidth={2.3} />
            <path
              d={`M ${tipX.toFixed(2)} ${tipY.toFixed(2)} l ${(fork * Math.cos(tAng - 0.32)).toFixed(2)} ${(fork * Math.sin(tAng - 0.32)).toFixed(2)} M ${tipX.toFixed(2)} ${tipY.toFixed(2)} l ${(fork * Math.cos(tAng + 0.32)).toFixed(2)} ${(fork * Math.sin(tAng + 0.32)).toFixed(2)}`}
              stroke={SAAP_TONGUE_D}
              strokeWidth={1.4}
            />
          </g>
        )}
        {/* mouth interior, seen as the jaw drops */}
        <path d={`M 8 3 L 70 1.4 L ${jawTip[0].toFixed(2)} ${jawTip[1].toFixed(2)} Z`} fill={SAAP_MOUTH} />
        {/* lower jaw, hinged behind the mouth corner */}
        <g transform={`rotate(${jaw.toFixed(2)} 10 3)`}>
          <path d="M 0 3 L 14 3.5 L 52 3 C 62 3 69 2.6 71 1.6 C 69 4.6 60 6.5 48 7.6 C 34 9 18 11 4 12.6 C -1 13 -3 8 0 3 Z" fill={SAAP_SKIN} />
          <path d="M 6 9.5 C 24 8.8 46 6.8 66 3.4 C 52 7 30 10 8 12 Z" fill={SAAP_BELLY} opacity={0.55} />
        </g>
        {/* upper head and snout */}
        <path d="M -2 -14 C 10 -15.6 18 -14.6 24 -13 C 34 -11.6 52 -8.6 64 -5 C 70 -3.4 73.5 -1.4 73 0.6 C 70 2 62 2 52 2.6 L 14 3.6 L -2 4.4 Z" fill={SAAP_SKIN} />
        <path d="M -2 -14 C 10 -15.6 18 -14.6 24 -13 C 34 -11.6 52 -8.6 64 -5 C 70 -3.4 73.5 -1.4 73 0.6 C 70 2 62 2 52 2.6 L 14 3.6 L -2 4.4 Z" fill={`url(#${uid}-sc)`} opacity={0.55} />
        <path d="M 2 -13.4 C 16 -14.8 34 -11.6 62 -5.4" stroke={SAAP_SKIN_L} strokeWidth={2.4} fill="none" opacity={0.5} strokeLinecap="round" />
        {/* dark streak back from the eye, and speckles on the crown */}
        <path d="M 30 -4 C 20 -2.5 8 -2 -2 -1" stroke={SAAP_DARK} strokeWidth={2.2} fill="none" opacity={0.45} strokeLinecap="round" />
        {[
          [8, -10],
          [14, -12],
          [36, -9],
          [44, -7.6],
          [4, -7],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.9} fill={SAAP_DARK} opacity={0.5} />
        ))}
        {/* mouth line and ear opening */}
        <path d="M 14 3.4 L 52 2.6 C 62 2.2 69 1.6 72 0.6" stroke={SAAP_DARK} strokeWidth={1} fill="none" opacity={0.75} />
        <ellipse cx={-1} cy={-2} rx={2.4} ry={3.4} fill={SAAP_DARK} opacity={0.55} />
        {/* slit nostril, nearer the eye than the snout tip */}
        <ellipse cx={46} cy={-4.6} rx={2.4} ry={0.8} transform="rotate(-12 46 -4.6)" fill={SAAP_DARK} />
        {/* the hooded eye: a dark socket, amber iris, round pupil, the upper lid, and the heavy brow over it */}
        <ellipse cx={24} cy={-5.6} rx={5.6} ry={4.4} fill={SAAP_FLANK} />
        <clipPath id={`${uid}-eye`}>
          <circle cx={24} cy={-5.6} r={3.5} />
        </clipPath>
        <g clipPath={`url(#${uid}-eye)`}>
          <circle cx={24} cy={-5.6} r={3.5} fill={SAAP_IRIS} />
          <circle cx={24.4} cy={-5.6} r={1.7} fill="#120c06" />
          <circle cx={25.4} cy={-6.7} r={0.7} fill="#fff6dc" opacity={0.85} />
          <rect x={19} y={-10} width={10} height={0.9 + 7.4 * lidV} fill={SAAP_SKIN} />
          <rect x={19} y={-1.6 - 1.6 * lidV} width={10} height={4} fill={SAAP_SKIN} />
          <path d={`M 20 ${(-9.1 + 7.4 * lidV).toFixed(2)} Q 24 ${(-7.9 + 7.4 * lidV).toFixed(2)} 28 ${(-9.1 + 7.4 * lidV).toFixed(2)}`} stroke={SAAP_DARK} strokeWidth={0.8} fill="none" />
        </g>
        <path d="M 15.5 -10.4 Q 24 -16 33.5 -10 Q 25 -11.4 15.5 -10.4 Z" fill={SAAP_SKIN} />
        <path d="M 17 -9.3 Q 24 -11.6 32 -8.6" stroke={SAAP_DARK} strokeWidth={1.1} fill="none" opacity={0.7} strokeLinecap="round" />
      </g>
    </Pose>
  );
};


/* ------------------------------------------------------------------ */
/* Goat                                                                 */
/* ------------------------------------------------------------------ */

const WHITE = "#f1ebdc";
const WHITE_SHADE = "#d6ccb6";
const BROWN = "#8b5a33";
const BROWN_DARK = "#5e3a20";
const HOOF = "#3b2a20";
const HORN = "#d9c69a";
const HORN_FAR = "#b9a77e";
const EYE_AMBER = "#d9a441";
const GOAT_GAIT: Gait = {
  walk: 0.18,
  run: 0.4,
  stride: 10,
  lift: 5,
  duty: 0.62,
  runDuty: 0.44,
  bob: 1.8,
  walkOffs: LATERAL,
  runOffs: TROT,
};
const GOAT_LEGS: LegSet = [
  { x: 48, y: 14, up: 30, low: 26, w: 9, color: WHITE, paw: HOOF, footR: 5.5, bend: 1 },
  { x: 30, y: 14, up: 30, low: 26, w: 9, color: WHITE_SHADE, paw: HOOF, footR: 5.5, far: true, bend: 1 },
  { x: -52, y: 14, up: 30, low: 26, w: 9, color: WHITE, paw: HOOF, footR: 5.5, bend: -1 },
  { x: -38, y: 14, up: 30, low: 26, w: 9, color: WHITE_SHADE, paw: HOOF, footR: 5.5, far: true, bend: -1 },
];
const GOAT_ANAT = anatomy(GOAT_GAIT, GOAT_LEGS);

export const Goat: React.FC<AnimalProps> = ({ f = 0, pose = "idle", lean = 0, prevPose, poseStart, ...p }) => {
  const r = solvePosed(pose, prevPose, poseStart, f, 53, lean, GOAT_ANAT);
  const jaw = r.mouth;
  return (
    <Pose {...p}>
      <g transform={`translate(0, ${-GOAT_ANAT.ground})`}>
        <Frame r={r}>
          {/* short upturned tail */}
          <g transform={`translate(-66, -12) rotate(${-14 + r.tail})`}>
            <path d="M -5 4 Q -9 -6 -3 -16 Q 2 -8 6 4 Z" fill={WHITE} />
          </g>
          <Legs specs={GOAT_LEGS} r={r} far />
          <g transform={`scale(${r.stretch}, ${r.squash})`}>
            <ellipse cx={0} cy={0} rx={72} ry={40} fill={WHITE} />
            <ellipse cx={-4} cy={22} rx={60} ry={12} fill={WHITE_SHADE} opacity={0.7} />
            <ellipse cx={-36} cy={-14} rx={28} ry={14} fill={BROWN} />
            <ellipse cx={30} cy={-18} rx={16} ry={10} fill={BROWN} opacity={0.9} />
          </g>
          <Legs specs={GOAT_LEGS} r={r} far={false} />
          {/* neck */}
          <path d="M 34 -26 Q 58 -34 74 -56 L 96 -54 Q 84 -20 56 14 Q 38 8 34 -26 Z" fill={WHITE} />
          <g transform={`translate(${88 + r.hdx}, ${-58 + r.hdy}) rotate(${r.hrot})`}>
            {/* horns sweep back from the crown */}
            <path d="M 0 -20 Q -10 -34 -4 -50 Q 4 -36 8 -22 Z" fill={HORN_FAR} />
            <path d="M -6 -16 Q -22 -34 -16 -54 Q -6 -36 4 -20 Z" fill={HORN} />
            {/* floppy ear, pinned back by ear and flicks */}
            <g transform={`translate(-14, -6) rotate(${earAng(r, -24, -20)})`}>
              <path d="M 0 0 Q -30 -10 -38 4 Q -24 14 0 6 Z" fill={BROWN_DARK} />
            </g>
            <path d="M -20 -6 Q -18 -22 2 -22 Q 20 -20 24 -4 Q 30 6 30 14 Q 22 22 12 16 Q -2 18 -12 14 Q -22 6 -20 -6 Z" fill={BROWN} />
            <path d="M 12 0 Q 26 -2 30 12 Q 22 20 14 14 Q 8 8 12 0 Z" fill={WHITE} />
            <path d={`M 14 13 Q 24 12 30 12 Q 22 ${15 + 9 * jaw} 14 13 Z`} fill={INK} opacity={jaw} />
            <path d="M 10 14 Q 16 22 14 34 Q 8 26 4 18 Z" fill={BROWN_DARK} />
            <ellipse cx={-2} cy={-4} rx={3.6} ry={3.6 * r.eye} fill={EYE_AMBER} />
            <ellipse cx={-2} cy={-4} rx={1.5} ry={2.6 * r.eye} fill={INK} />
            <circle cx={28} cy={9} r={2.4} fill={INK} />
          </g>
        </Frame>
      </g>
    </Pose>
  );
};
