import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, lerp, makeActing, noise1, PoseKey } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { BabyThakur, DivineDefs } from "../../cinematic/divine/Divine";
import { CAST } from "../../cinematic/rig/cast";
import { Hand } from "../../cinematic/rig/Hand";
import { BASE_POSE, Lighting, Pose, PropRenderer, Puppet, puppetBreath } from "../../cinematic/rig/Puppet";
import { Rain } from "../../cinematic/sets/S05_Sets";
import { BullockCart, SEAT_Y, STEP_LEN, WHEEL_R } from "../rig/BullockCart";
import { EP02_SCENES } from "../timing";
import { SURENDRA, THAKURMA } from "./Scene01eFather";

/**
 * Episode 2 · scene 02a0_journey_to_ujanchar: the family's bullock-cart journey from the Vedic house to
 * Ujanchar. A music-led montage with no narration (STO-15, STO-16; plan "NEW 02a0_journey_to_ujanchar" in
 * Ep02_Shots_and_Pauses_DRAFT.md). Its length is read from EP02_SCENES (fallback 264 frames = 11.0 s) and the six
 * shots are laid out in proportion to it (2.0 : 1.5 : 2.0 : 2.5 : 1.5 : 1.5 s). At 264 frames:
 *
 *  J1   0- 47  Wide: a village road through green paddy; the cart, small, crosses left to right; the drizzle
 *              thins and stops; puddles on the road; egrets in the paddy, one lifts off. Rainy grey.
 *              (Its first ~40 frames sit under the cross-dissolve from 01e.)
 *  J2  48- 83  Close-up: the turning rear wheel through the mud, drops flicking off the rim, ripples behind it.
 *              Grey, brightening.
 *  J3  84-131  Medium: the near bullock's head nodding with each step, its neck bells swinging; the clouds part
 *              and the first sun breaks through.
 *  J4 132-191  Medium close-up: Balak in Charu's lap on the cart, gazing up at the sky as birds cross, his soft
 *              restrained glow; Charu looks down at him and smiles. ONE slow push in (the emotional beat).
 *              Golden afternoon.
 *  J5 192-227  Wide: the riverside track, country boats on the water (no ferry). Late gold.
 *  J6 228-263  Wide, a little high: the cart rounds a bend and the forest-ringed Ujanchar village comes into
 *              view in the distance (no name board); dusk gold matching 02a's wide. (Its last ~40 frames sit
 *              under the cross-dissolve into Ujanchar; frames past the end keep drawing J6.)
 *
 * Camera (CAM-13): every shot holds, except the single slow push in J4; hard cuts between shots. The cart moves
 * left to right in every wide. Shots that ride with the cart (J2, J3, J4) hold the camera on the cart while the
 * ground and the land slide past. Every plane is drawn wider than the frame, so no background edge shows. Faces
 * and key action stay above y = 820.
 *
 * The cart and its motion come from the bullock cart rig (wheels and hooves driven by distance, so nothing
 * slides). The riders are the walk's own figures (Thakurma, Charu, Surendra). Balak (BabyThakur) lies in
 * Charu's cradle hold: only she holds him, and her arms are solved onto him every frame from his pose (the
 * same cradle hold as Scene01eFather), so both her hands touch him and he never floats. The divine light is
 * his alone and restrained (BabyThakur's soft halo behind the head, a faint warm glow on her lap, a few motes).
 */

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

const DUR = EP02_SCENES.find((s) => s.sceneId === "02a0_journey_to_ujanchar")?.durationFrames ?? 264;
/** Planned shot lengths (s), J1 to J6; the real shots are laid out in proportion to DUR. */
const SHOT_S = [2.0, 1.5, 2.0, 2.5, 1.5, 1.5];
const SHOT_SUM = SHOT_S.reduce((a, b) => a + b, 0);
/** Shot boundaries (frames): shot i runs from CUT[i] to CUT[i + 1] - 1. */
const CUT: number[] = SHOT_S.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1] + s], [0]).map((t) => Math.round((t / SHOT_SUM) * DUR));
const shotOf = (f: number) => {
  for (let i = 0; i < 6; i++) if (f < CUT[i + 1]) return i;
  return 5;
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const PLANE_L = -480;
const PLANE_R = 2400;
const f1 = (n: number) => n.toFixed(1);
/** Deterministic pseudo-random in [0, 1). */
const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
/** Linear mix of two #rrggbb colours. */
const mix = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const tt = clamp(t);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + ((((pb >> sh) & 255) - ((pa >> sh) & 255)) * tt));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
};
/** Wrap x into [lo, lo + span). */
const wrap = (x: number, lo: number, span: number) => ((((x - lo) % span) + span) % span) + lo;

/** A soft line of rounded tree crowns across the whole plane, closed down to `bottom`. */
const scallop = (seed: number, top: number, amp: number, bw: number, bottom: number) => {
  let x = PLANE_L - 40;
  let y = top + rnd(seed) * amp;
  let d = `M ${x} ${bottom} L ${x} ${f1(y)}`;
  let i = 0;
  while (x < PLANE_R + 40) {
    const w = bw * (0.6 + rnd(seed + i * 3.7) * 0.8);
    const ny = top + rnd(seed + i * 5.3 + 1) * amp;
    const h = bw * 0.35 * (0.6 + rnd(seed + i * 2.9 + 2) * 0.8);
    d += ` Q ${f1(x + w / 2)} ${f1(Math.min(y, ny) - h)} ${f1(x + w)} ${f1(ny)}`;
    x += w;
    y = ny;
    i++;
  }
  return `${d} L ${f1(x)} ${bottom} Z`;
};

/** A distant palm silhouette: (x, foot y, height). */
const FarPalm: React.FC<{ x: number; y: number; h: number; c: string; sway?: number }> = ({ x, y, h, c, sway = 0 }) => {
  const tx = x + h * 0.08 + sway;
  const ty = y - h;
  return (
    <g stroke={c} fill="none" strokeLinecap="round">
      <path d={`M ${x} ${y} Q ${f1(x + h * 0.02)} ${f1(y - h * 0.5)} ${f1(tx)} ${f1(ty)}`} strokeWidth={Math.max(2, h * 0.045)} />
      {[-165, -130, -95, -60, -20].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const len = h * 0.34;
        return (
          <path
            key={deg}
            d={`M ${f1(tx)} ${f1(ty)} Q ${f1(tx + Math.cos(a) * len * 0.5)} ${f1(ty + Math.sin(a) * len * 0.5 - 3)} ${f1(tx + Math.cos(a) * len)} ${f1(ty + Math.sin(a) * len + len * 0.5)}`}
            strokeWidth={Math.max(2.4, h * 0.05)}
          />
        );
      })}
    </g>
  );
};

/** A broadleaf tree: trunk and a crown of overlapping rounds, with a lit edge toward `lit` (-1 left, 1 right). */
const Tree: React.FC<{ x: number; y: number; r: number; c: string; rim?: string; lit?: number; trunk?: string }> = ({ x, y, r, c, rim, lit = 1, trunk = "#2e2418" }) => {
  const blobs: Array<[number, number, number]> = [
    [0, -1.1, 0.8],
    [-0.62, -0.9, 0.58],
    [0.62, -0.92, 0.6],
    [-0.3, -1.5, 0.55],
    [0.34, -1.46, 0.56],
  ];
  return (
    <g>
      <path d={`M ${x - r * 0.08} ${y} L ${x - r * 0.05} ${y - r * 0.9} L ${x + r * 0.05} ${y - r * 0.9} L ${x + r * 0.09} ${y} Z`} fill={trunk} />
      {rim && (
        <g fill={rim} transform={`translate(${lit * r * 0.06}, ${-r * 0.05})`}>
          {blobs.map(([bx, by, br], i) => (
            <circle key={i} cx={x + bx * r} cy={y + by * r} r={br * r} />
          ))}
        </g>
      )}
      <g fill={c}>
        {blobs.map(([bx, by, br], i) => (
          <circle key={i} cx={x + bx * r} cy={y + by * r} r={br * r} />
        ))}
      </g>
    </g>
  );
};

/** Mud hut with a thatched roof; (x, y) is the centre of the floor line. */
const Hut: React.FC<{ x: number; y: number; w: number; h: number; wall?: string; roof?: string }> = ({ x, y, w, h, wall = "#c49a72", roof = "#b98a3e" }) => {
  const wallTop = y - h * 0.5;
  const ridgeY = y - h * 1.12;
  return (
    <g>
      <rect x={x - w / 2} y={wallTop} width={w} height={h * 0.5} fill={wall} />
      <rect x={x + w * 0.12} y={wallTop} width={w * 0.38} height={h * 0.5} fill={mix(wall, "#3a2a20", 0.25)} />
      <rect x={x - w * 0.08} y={y - h * 0.22} width={w * 0.16} height={h * 0.22} fill="#2b1d14" />
      <path
        d={`M ${x - w * 0.68} ${wallTop + h * 0.04} L ${x} ${ridgeY} L ${x + w * 0.68} ${wallTop + h * 0.04} Q ${x} ${wallTop - h * 0.05} ${x - w * 0.68} ${wallTop + h * 0.04} Z`}
        fill={roof}
      />
    </g>
  );
};

/** A country boat (nouka) with a bamboo hood and a boatman at the pole; `sail` adds a small square sail. */
const Nouka: React.FC<{ x: number; y: number; s: number; f: number; ph: number; sail?: boolean; tone?: number }> = ({ x, y, s, f, ph, sail = false, tone = 0 }) => {
  const bob = Math.sin(f * 0.06 + ph) * 1.6;
  const rock = Math.sin(f * 0.05 + ph * 1.3) * 1.2;
  const pole = Math.sin(f * 0.04 + ph) * 6;
  const dk = (c: string) => mix(c, "#2a1e22", tone);
  return (
    <g transform={`translate(${f1(x)} ${f1(y + bob)}) scale(${s}) rotate(${f1(rock)})`}>
      <path d="M -110 30 Q 0 46 116 26" stroke="#2a2a3a" strokeWidth={8} opacity={0.2} fill="none" />
      {sail && (
        <g>
          <line x1={-6} y1={2} x2={-10} y2={-150} stroke={dk("#3a2a1c")} strokeWidth={4} />
          <path d={`M -8 -146 Q 34 -120 40 -40 L -8 -30 Z`} fill={dk("#d9c49a")} />
          <path d="M -8 -146 Q 34 -120 40 -40" stroke={dk("#a8946a")} strokeWidth={2} fill="none" />
        </g>
      )}
      <path d="M -120 -4 Q -60 26 0 26 Q 60 26 124 -10 Q 60 6 0 6 Q -60 6 -120 -4 Z" fill={dk("#3e2a1a")} />
      <path d="M -40 5 Q -36 -40 10 -42 Q 52 -40 56 5 Z" fill={dk("#9a7444")} />
      <path d="M -40 5 Q -36 -40 10 -42" stroke="#e2b46a" strokeWidth={3} fill="none" opacity={0.6} />
      <line x1={98 + pole * 0.3} y1={-4} x2={70 + pole} y2={-78} stroke={dk("#3a2a1c")} strokeWidth={3} />
      <circle cx={86} cy={-54} r={7} fill={dk("#2a1e16")} />
      <path d="M 79 -47 L 92 -47 L 94 -8 L 77 -8 Z" fill={dk("#2a1e16")} />
    </g>
  );
};

/** A small bird in flight (a soft V that flaps). */
const Bird: React.FC<{ x: number; y: number; s: number; f: number; ph: number; c?: string; op?: number }> = ({ x, y, s, f, ph, c = "#3a2a3a", op = 0.85 }) => {
  const tip = 6 * Math.sin(f * 0.55 + ph);
  return (
    <path
      transform={`translate(${f1(x)}, ${f1(y)}) scale(${s.toFixed(2)})`}
      d={`M -14 ${tip.toFixed(2)} Q -7 -5 0 0 Q 7 -5 14 ${tip.toFixed(2)}`}
      stroke={c}
      strokeWidth={2.6}
      fill="none"
      strokeLinecap="round"
      opacity={op}
    />
  );
};

/** A standing egret in the paddy, facing `dir`; it dips its head to feed now and then. */
const Egret: React.FC<{ x: number; y: number; s: number; f: number; ph: number; dir?: 1 | -1; shade?: string }> = ({ x, y, s, f, ph, dir = 1, shade = "#d7dcdc" }) => {
  const cyc = ((f + ph * 40) % 70) / 70;
  const dip = cyc > 0.7 ? Math.sin(((cyc - 0.7) / 0.3) * Math.PI) : 0;
  const hx = 10 + dip * 8;
  const hy = -38 + dip * 26;
  return (
    <g transform={`translate(${f1(x)}, ${f1(y)}) scale(${dir * s}, ${s})`}>
      <ellipse cx={0} cy={2} rx={14} ry={3} fill="#2a3a2a" opacity={0.2} />
      <line x1={-2} y1={-6} x2={-3} y2={2} stroke="#2a2a22" strokeWidth={1.6} />
      <line x1={3} y1={-6} x2={4} y2={2} stroke="#2a2a22" strokeWidth={1.6} />
      <ellipse cx={0} cy={-14} rx={13} ry={8} transform="rotate(-18 0 -14)" fill="#fbfbf6" />
      <path d={`M -10 -10 Q -18 -6 -20 -2`} stroke={shade} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={`M 8 -18 Q ${4 + dip * 6} -28 ${hx - 2} ${hy + 6} Q ${hx - 4} ${hy + 2} ${hx} ${hy}`} stroke="#fbfbf6" strokeWidth={4} fill="none" strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={3.6} fill="#fbfbf6" />
      <line x1={hx + 2} y1={hy} x2={hx + 13} y2={hy + 2 + dip * 4} stroke="#e8b830" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
};

/** An egret in flight: white body, two wings beating slowly, legs trailing. */
const FlyingEgret: React.FC<{ x: number; y: number; s: number; f: number; ph: number }> = ({ x, y, s, f, ph }) => {
  const w = Math.sin(f * 0.42 + ph);
  return (
    <g transform={`translate(${f1(x)}, ${f1(y)}) scale(${s})`}>
      <path d={`M -4 -2 Q -14 ${-14 - 12 * w} -30 ${-6 - 18 * w}`} stroke="#f6f6f0" strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={14} ry={5} fill="#fbfbf6" />
      <path d={`M 12 -2 Q 18 -6 22 -4`} stroke="#fbfbf6" strokeWidth={3} fill="none" />
      <line x1={22} y1={-4} x2={31} y2={-3} stroke="#e8b830" strokeWidth={1.8} />
      <line x1={-12} y1={1} x2={-26} y2={4} stroke="#2a2a22" strokeWidth={1.4} />
      <path d={`M 2 -2 Q -6 ${-16 - 14 * w} -22 ${-10 - 22 * w}`} stroke="#ffffff" strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Charu's cradle hold: her arms are solved onto the newborn every frame */
/* ------------------------------------------------------------------ */

/*
 * A mirror of Puppet's own seated body for Charu (the same mirror Scene01eFather uses, brought up to date
 * with the rig's MOT-20 breathing), so the newborn and her hands are placed in the same space Puppet draws
 * in. Every Charu Puppet here runs at stillness 1 (no idle layer, no anticipation, no arm lag), which keeps
 * the mirror exact, and her body channels are constant within a shot.
 */
const R2D = 180 / Math.PI;
const D2R = Math.PI / 180;
type Pt = { x: number; y: number };
const CH = CAST.charu.height;
const CG = CAST.charu.girth;
const CB = {
  thigh: 80 * CH,
  shin: 74 * CH,
  foot: 31 * CH,
  torsoLen: 108 * CH,
  sw: 47 * CH * (0.85 + 0.15 * CG),
  ua: 56 * CH,
  fa: 52 * CH,
  limbW: 8.8 * CH * (0.9 + 0.1 * CG),
  hand: 37 * CH,
};
/** Elbow to the middle of the hand: the point of the hand that is placed on the newborn. */
const CHARU_GRIP_D = CB.fa - 2 + 0.5 * CB.hand;
const CHARU_SEED = CAST.charu.seed;
/** Charu's reference scale for the newborn's size (one baby-frame unit is 1 / CHARU_REF of her rig units). */
const CHARU_REF = 1.35;

const solveArm2 = (side: 1 | -1, ua: number, len: number, vx: number, vy: number, pref: 1 | -1 | 0) => {
  const mx = side * vx;
  const d = clamp(Math.hypot(mx, vy), Math.abs(ua - len) + 1e-3, ua + len - 1e-3);
  const A = Math.acos(clamp((ua * ua + d * d - len * len) / (2 * ua * d), -1, 1));
  const aT = Math.atan2(mx, vy);
  const au = pref === 0 ? (Math.cos(aT - A) >= Math.cos(aT + A) ? aT - A : aT + A) : aT + pref * A;
  const af = Math.atan2(mx - ua * Math.sin(au), vy - ua * Math.cos(au));
  return { S: au * R2D, E: (af - au) * R2D };
};
const armPoint = (side: 1 | -1, ua: number, S: number, E: number, d: number): Pt => ({
  x: side * (ua * Math.sin(S * D2R) + d * Math.sin((S + E) * D2R)),
  y: ua * Math.cos(S * D2R) + d * Math.cos((S + E) * D2R),
});

/** Seated hips above the feet line (Puppet's seated leg solve: both legs alike). */
const SEATED_HIP = (() => {
  const th = 1.42;
  const ab = 0.95;
  const kn = 2.7;
  const knee = Math.cos(th) * Math.cos(ab) * CB.thigh;
  const ankle = knee + Math.cos(th - kn) * CB.shin;
  return -Math.max(ankle + 0.28 * CB.foot, knee + CB.limbW * 1.2);
})();

type Place = { x: number; y: number; s: number };

/** Charu's seated body at life-clock time t for pose p (body channels only), as Puppet draws it. */
const charuRig = (t: number, p: Pose, place: Place) => {
  const phi = clamp(p.bodyTurn, -1, 1) * 0.95;
  const cphi = Math.cos(phi);
  const sphi = Math.sin(phi);
  const hipY = SEATED_HIP;
  const br = puppetBreath({ t, f: t, seed: CHARU_SEED, child: false, stillness: 1 });
  const rootY = hipY - CB.torsoLen - br.chest + CB.limbW;
  const b = Math.min(0.032, Math.abs(p.lean) * 0.0028);
  const c = Math.cos(p.lean * D2R);
  const s = Math.sin(p.lean * D2R);
  const rot = (q: Pt, dir: 1 | -1): Pt => {
    const dy = q.y - hipY;
    return { x: q.x * c - dir * dy * s, y: hipY + dir * q.x * s + dy * c };
  };
  return {
    lean: p.lean,
    far: (side: 1 | -1) => (side > 0 ? p.rBack > 0.5 || sphi > 0.35 : p.lBack > 0.5 || sphi < -0.35),
    root: (side: 1 | -1): Pt => ({ x: side * CB.sw * 0.86 * cphi, y: rootY }),
    toWorld: (q: Pt, far = false): Pt => {
      const r = far ? q : rot(q, 1);
      return { x: place.x + p.bodyX + r.x * place.s * (1 + b), y: place.y + p.bodyY + r.y * place.s * (1 - b) };
    },
    toUpper: (w: Pt, far = false): Pt => {
      const l = { x: (w.x - place.x - p.bodyX) / (place.s * (1 + b)), y: (w.y - place.y - p.bodyY) / (place.s * (1 - b)) };
      return far ? l : rot(l, -1);
    },
  };
};
type CharuRig = ReturnType<typeof charuRig>;

/** The newborn's frame (Swaddled's outer units), mirrored by m, rotated by rot (deg), scaled by k. */
type BabyPose = { x: number; y: number; rot: number; m: 1 | -1; k: number };
const babyPoint = (bp: BabyPose, q: Pt): Pt => {
  const c = Math.cos(bp.rot * D2R);
  const s = Math.sin(bp.rot * D2R);
  const qx = bp.m * q.x * bp.k;
  const qy = q.y * bp.k;
  return { x: bp.x + qx * c - qy * s, y: bp.y + qx * s + qy * c };
};

/*
 * The cradle hold (as Scene01eFather): she faces `fwd`; the near upper arm hangs almost straight and its
 * forearm runs across her front under his bottom and thighs (HOLD_NEAR); the far hand is on his upper back
 * below the head (HOLD_FAR). He is placed from the near forearm, then both arms are solved onto him.
 */
const HOLD_TILT = 20;
const NEAR_HANG = 3;
const HOLD_NEAR: Pt = { x: 36, y: 18 };
const HOLD_FAR: Pt = { x: -12, y: 4 };

const cradlePose = (rig: CharuRig, fwd: 1 | -1, place: Place): BabyPose => {
  const near = -fwd as 1 | -1;
  const m = fwd;
  const tilt = HOLD_TILT * fwd;
  const sh = rig.root(near);
  const el = { x: sh.x + near * CB.ua * Math.sin(NEAR_HANG * D2R), y: sh.y + CB.ua * Math.cos(NEAR_HANG * D2R) };
  const grip = { x: el.x + fwd * CHARU_GRIP_D, y: el.y };
  const q = { x: (m * HOLD_NEAR.x) / CHARU_REF, y: HOLD_NEAR.y / CHARU_REF };
  const c = Math.cos(tilt * D2R);
  const s = Math.sin(tilt * D2R);
  const origin = { x: grip.x - (q.x * c - q.y * s), y: grip.y - (q.x * s + q.y * c) };
  const w = rig.toWorld(origin);
  return { x: w.x, y: w.y, rot: tilt + rig.lean, m, k: place.s / CHARU_REF };
};

const armOnto = (rig: CharuRig, side: 1 | -1, t: Pt) => {
  const far = rig.far(side);
  const l = rig.toUpper(t, far);
  const r = rig.root(side);
  return solveArm2(side, CB.ua, CHARU_GRIP_D, l.x - r.x, l.y - r.y, 1);
};

const cradleArms = (rig: CharuRig, fwd: 1 | -1, bp: BabyPose): Partial<Pose> => {
  const near = -fwd as 1 | -1;
  const a = armOnto(rig, near, babyPoint(bp, HOLD_NEAR));
  const b = armOnto(rig, -near as 1 | -1, babyPoint(bp, HOLD_FAR));
  const R = near > 0 ? a : b;
  const L = near > 0 ? b : a;
  return { rS: R.S, rE: R.E, lS: L.S, lE: L.E, rHand: "cup", lHand: "cup", rProp: "", lProp: "" };
};

/** Puppet's adult pose blend (raised cosine over 9 frames) on the channels the cradle needs. */
const BLEND_W = Array.from({ length: 9 }, (_, i) => 0.5 + 0.5 * Math.cos((Math.PI * (i - 4)) / 5));
const BLEND_KEYS = ["lean", "bodyX", "bodyY", "bodyTurn", "rS", "rE", "lS", "lE"] as const;
const blendPose = (act: (fr: number) => Partial<Pose>, f: number): Pose => {
  const ps = BLEND_W.map((_, i) => ({ ...BASE_POSE, ...act(f + i - 4) }));
  const out: Pose = { ...ps[4] };
  for (const k of BLEND_KEYS) {
    let s = 0;
    let w = 0;
    ps.forEach((q, i) => {
      s += q[k] * BLEND_W[i];
      w += BLEND_W[i];
    });
    out[k] = s / w;
  }
  return out;
};

/**
 * Her near forearm and both hands drawn in front of the newborn (as Scene01eFather's CradleFront): a second
 * copy of Charu, clipped to the outline of her near forearm, then both cupped hands with the rig's own Hand.
 */
const CradleFront: React.FC<{ id: string; life: number; rig: CharuRig; p: Pose; place: Place; fwd: 1 | -1; children: React.ReactNode }> = ({
  id,
  life,
  rig,
  p,
  place,
  fwd,
  children,
}) => {
  const near = -fwd as 1 | -1;
  const farSide = -near as 1 | -1;
  const L = CB.limbW * 0.88;
  const arm = (side: 1 | -1) => {
    const S = side > 0 ? p.rS : p.lS;
    const E = side > 0 ? p.rE : p.lE;
    const r = rig.root(side);
    const el = armPoint(side, CB.ua, S, 0, 0);
    return { S, E, r, el, ux: side * Math.sin((S + E) * D2R), uy: Math.cos((S + E) * D2R), far: rig.far(side) };
  };
  const a = arm(near);
  const prof: Array<[number, number]> = [
    [0, 0.9],
    [0.12, 0.97],
    [0.25, 1],
    [0.5, 0.88],
    [0.75, 0.73],
    [1, 0.6],
  ].map(([t, w]) => [CB.fa * t, L * w - 0.3]);
  const at = (d: number, h: number) => rig.toWorld({ x: a.r.x + a.el.x + a.ux * d + a.uy * h, y: a.r.y + a.el.y + a.uy * d - a.ux * h }, a.far);
  const forearm = [...prof.map(([d, h]) => at(d, h)), ...[...prof].reverse().map(([d, h]) => at(d, -h))]
    .map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`)
    .join(" ");
  const hand = (side: 1 | -1) => {
    const q = arm(side);
    const wrist = rig.toWorld({ x: q.r.x + q.el.x + q.ux * (CB.fa - 2), y: q.r.y + q.el.y + q.uy * (CB.fa - 2) }, q.far);
    const rot = -side * (q.S + q.E) + (q.far ? 0 : rig.lean);
    return (
      <g
        transform={`translate(${wrist.x}, ${wrist.y}) scale(${place.s}) rotate(${rot})`}
        style={{ filter: `brightness(${q.far ? 0.85 : 1}) drop-shadow(0 0 1.4px rgba(59,36,28,0.52))` }}
      >
        <Hand
          shape="cup"
          L={CB.hand}
          skin={q.far ? CAST.charu.skinShade : CAST.charu.skin}
          shade={CAST.charu.skinShade}
          side={side}
          flex={noise1(life * 0.04, CHARU_SEED + side) * 0.5 + 0.5}
        />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <polygon points={forearm} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
      {hand(farSide)}
      {hand(near)}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Balak and Charu                                                     */
/* ------------------------------------------------------------------ */

/** `headRoll` (default -15, the cradled rest) rolls his head back to look up; `turn` turns it toward the look. */
type BabyLook = { gaze: number; lookY: number; smile: number; aura: number; headRoll?: number; turn?: number };
/** The pose channels Charu's `look` may set: head and face only. */
const FACE_KEYS: Array<keyof Pose> = ["headTurn", "headTilt", "headNod", "eyeX", "eyeY", "lid", "brow", "browTilt", "smile", "cheeks", "flush", "tears", "gasp"];

/**
 * Balak Thakur, newborn, in the white swaddle in Charu's arms (as Scene01eFather and Scene02aUjanchar).
 * BabyThakur carries his own restrained divine light: the soft halo behind the head, the gold rim on his hair
 * and a few slow motes. Baby frame at scale 0.7; the caller places it in her cradle.
 */
const Swaddled: React.FC<{ f: number; life: number; look: BabyLook }> = ({ f, life, look }) => (
  <g transform="scale(0.7)">
    <BabyThakur
      f={f}
      lifeF={life}
      x={0}
      y={0}
      open={1}
      aura={look.aura}
      gaze={look.gaze}
      lookY={look.lookY}
      turn={look.turn ?? 0.15}
      smile={look.smile}
      headRoll={look.headRoll ?? -15}
      rot={-4}
      wiggle={0.25}
      motion={{ dx: 0, dy: 0, drot: 0 }}
    />
    <path
      d="M -18 -30 Q 22 -42 60 -30 Q 84 -10 80 22 Q 62 42 30 38 Q 2 36 -18 30 Q -24 0 -18 -30 Z"
      fill="#fffdf7"
      stroke="#e6dccb"
      strokeWidth={1.4}
    />
    <path d="M -10 -14 Q 20 -6 46 -14" stroke="#e6dccb" strokeWidth={1.4} fill="none" opacity={0.8} />
  </g>
);

/**
 * Charu seated (facing right, the cart's direction) with Balak in her cradle hold. `body` holds the body
 * channels (constant within a shot), `look` the head and face, keyed on the story clock.
 */
const CharuWithBaby: React.FC<{
  id: string;
  f: number;
  life: number;
  place: Place;
  body: Partial<Pose>;
  look: (fr: number) => Partial<Pose>;
  baby: BabyLook;
  light: Lighting;
  lapGlow?: number;
  /** Extra strength of his soft warm-white halo behind the head (0 = BabyThakur's own only). Steady, never pulsing. */
  halo?: number;
}> = ({ id, f, life, place, body, look, baby, light, lapGlow = 0.5, halo = 0 }) => {
  const bodyPose: Pose = { ...BASE_POSE, ...body };
  const act = (fr: number): Partial<Pose> => {
    const rig = charuRig(life + (fr - f), bodyPose, place);
    // only the head and face come from `look` (a keyed pose carries every channel; the body must stay as the
    // cradle mirror has it, or her hands would not land on him)
    const l = look(fr);
    const face: Partial<Pose> = {};
    for (const k of FACE_KEYS) if (l[k] !== undefined) (face as Record<string, unknown>)[k] = l[k];
    return { ...bodyPose, ...face, ...cradleArms(rig, 1, cradlePose(rig, 1, place)) };
  };
  const drawn = blendPose(act, f);
  const rig = charuRig(life, drawn, place);
  const nb = cradlePose(charuRig(life, bodyPose, place), 1, place);
  // a faint warm glow on her lap under him (his light only, restrained)
  const lap = babyPoint(nb, { x: 10, y: 34 });
  const charu = <Puppet cast={CAST.charu} f={f} lifeF={life} x={place.x} y={place.y} scale={place.s} acting={act} light={light} seated stillness={1} />;
  return (
    <g>
      {charu}
      <ellipse cx={lap.x} cy={lap.y} rx={70 * nb.k} ry={22 * nb.k} fill="url(#dv-soft)" opacity={0.55 * lapGlow} />
      {halo > 0.01 && (
        <g>
          {/* his halo: a soft warm-white radial behind the head that fades to nothing (BAL-06/07) */}
          <circle cx={babyPoint(nb, { x: -35, y: -9 }).x} cy={babyPoint(nb, { x: -35, y: -9 }).y} r={120 * nb.k} fill="url(#dv-glow)" opacity={Math.min(1, 1.0 * halo)} />
          <circle cx={babyPoint(nb, { x: -35, y: -9 }).x} cy={babyPoint(nb, { x: -35, y: -9 }).y} r={66 * nb.k} fill="url(#dv-halo)" opacity={Math.min(1, 1.0 * halo)} />
        </g>
      )}
      <g transform={`translate(${nb.x}, ${nb.y}) rotate(${nb.rot}) scale(${nb.m * nb.k}, ${nb.k})`}>
        <Swaddled f={f} life={life} look={baby} />
      </g>
      <CradleFront id={id} life={life} rig={rig} p={drawn} place={place} fwd={1}>
        {charu}
      </CradleFront>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The cart with the family                                            */
/* ------------------------------------------------------------------ */

/** Cart pace: cart-local units per frame (a calm bullock walk). Wheels and hooves follow the distance. */
const V = 9;
const drive = (f: number) => {
  const d = V * f;
  return { roll: d / WHEEL_R, step: (d / STEP_LEN) * 2 * Math.PI };
};

/** Seats along the deck (cart-local x) and figure scales, as in Scene02aUjanchar. */
const SEAT_DX = { thakurma: -105, charu: 0, father: 105 };
const RIDER_S = { father: 1, charu: 1.35 / 1.4, thakurma: 1.25 / 1.4 };
/** Charu's body on the cart: turned to the road ahead (right), sitting upright. */
const CHARU_BODY: Partial<Pose> = { bodyTurn: 0.7, lean: 0 };
/** Her head bent toward the child in the wides. */
const CHARU_LOOK_DOWN: Partial<Pose> = { headTurn: 0.1, headTilt: 4, headNod: 8, eyeX: 0.3, eyeY: 0.8, smile: 0.5, brow: 0.3 };

/* The father's umbrella (J1, the drizzle): the same two-bone grip as Scene01eFather / Scene02aUjanchar. */
const UPPER_ARM = 56;
const ELBOW_TO_GRIP = 50 + 0.62 * 37;
const UMB_TILT = 10.5;
const solveRightArm = (dx: number, dy: number) => {
  const d = Math.hypot(dx, dy);
  const toGrip = Math.atan2(dx, dy);
  const cosA = clamp((UPPER_ARM * UPPER_ARM + d * d - ELBOW_TO_GRIP * ELBOW_TO_GRIP) / (2 * UPPER_ARM * d), -1, 1);
  const S = toGrip - Math.acos(cosA);
  const ex = UPPER_ARM * Math.sin(S);
  const ey = UPPER_ARM * Math.cos(S);
  const forearm = Math.atan2(dx - ex, dy - ey);
  const E = Math.atan2(Math.sin(forearm - S), Math.cos(forearm - S));
  return { S: (S * 180) / Math.PI, E: (E * 180) / Math.PI };
};
const UMB_ARM = solveRightArm(26, -27);
const P_UMBRELLA: PropRenderer = ({ f, worldRot, scale }) => {
  const tilt = UMB_TILT + 2.4 * noise1(f * 0.04, 3) + 1.0 * noise1(f * 0.13, 8);
  return (
    <g transform={`scale(${scale})`}>
      <g transform={`rotate(${-(worldRot + tilt)})`}>
        <line x1={0} y1={14} x2={0} y2={-150} stroke="#3a2412" strokeWidth={6} strokeLinecap="round" />
        <path d="M -165 -118 Q -150 -228 0 -236 Q 150 -228 165 -118 Q 82 -100 0 -116 Q -82 -100 -165 -118 Z" fill="#5a3e28" />
        <path d="M 0 -236 Q 40 -228 80 -150 Q 30 -158 0 -170 Z" fill="#7a5638" opacity={0.7} />
      </g>
      <path d="M -10 -6 Q 0 -10 10 -6 Q 12 3 8 9 Q 0 12 -8 9 Q -12 3 -10 -6 Z" fill={SURENDRA.skin} stroke={SURENDRA.skinShade} strokeWidth={1} opacity={0.95} />
    </g>
  );
};
/** Thakurma's cloth bag in her left hand. */
const P_BAG: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale * 0.85}) rotate(10)`}>
    <path d="M -34 -6 Q -40 40 0 46 Q 40 40 34 -6 Q 20 -20 0 -18 Q -20 -20 -34 -6 Z" fill="#8a6a3a" />
    <path d="M -34 -6 Q 0 6 34 -6" stroke="#5a4226" strokeWidth={3} fill="none" opacity={0.6} />
    <path d="M -6 -18 Q 0 -34 8 -20" stroke="#5a4226" strokeWidth={4} fill="none" />
  </g>
);

const FATHER_UMB: Partial<Pose> = { bodyTurn: 0.7, headTurn: 0.2, eyeX: 0.3, smile: 0.5, brow: 0.5, rS: UMB_ARM.S, rE: UMB_ARM.E, rHand: "hold", rProp: "umbrella", lE: -16 };
const FATHER_REST: Partial<Pose> = { bodyTurn: 0.7, headTurn: 0.25, eyeX: 0.4, smile: 0.55, brow: 0.5, rS: 8, rE: -22, lS: 6, lE: -18 };
const THAKURMA_SEAT: Partial<Pose> = { bodyTurn: 0.7, headTurn: 0.3, eyeX: 0.4, smile: 0.4, brow: 0.3, lS: 14, lE: -26, lHand: "hold", lProp: "bag", rS: 6, rE: -10, rHand: "relaxed" };

const FamilyCart: React.FC<{
  id: string;
  f: number;
  life: number;
  x: number;
  y: number;
  k: number;
  rot?: number;
  close?: boolean;
  road?: number;
  bells?: number;
  dust?: number;
  umbrella?: boolean;
  light: Lighting;
  baby: BabyLook;
  /** Draw only the cart and the family (the rig's bullocks clipped away), for shots that draw their own pair. */
  cartOnly?: boolean;
}> = ({ id, f, life, x, y, k, rot = 0, close = true, road = 0.6, bells = 3, dust = 0, umbrella = false, light, baby, cartOnly = false }) => {
  const { roll, step } = drive(f);
  return (
    <g transform={`translate(${f1(x)}, ${f1(y)}) rotate(${rot.toFixed(2)}) scale(${k})`}>
      {cartOnly && (
        <defs>
          <clipPath id={`${id}-cartonly`}>
            <rect x={-900} y={-1200} width={1106} height={1400} />
          </clipPath>
        </defs>
      )}
      <g clipPath={cartOnly ? `url(#${id}-cartonly)` : undefined}>
      <BullockCart
        roll={roll}
        step={step}
        walk={1}
        dust={dust}
        f={f}
        road={road}
        bells={bells}
        close={close}
        ridersOverCanopy
        riders={
          <>
            <Puppet
              cast={THAKURMA}
              f={f}
              lifeF={life}
              x={SEAT_DX.thakurma}
              y={SEAT_Y}
              scale={RIDER_S.thakurma}
              acting={() => THAKURMA_SEAT}
              light={light}
              props={{ bag: P_BAG }}
              seated
              stillness={0.3}
            />
            <CharuWithBaby
              id={`${id}-cradle`}
              f={f}
              life={life}
              place={{ x: SEAT_DX.charu, y: SEAT_Y, s: RIDER_S.charu }}
              body={CHARU_BODY}
              look={() => CHARU_LOOK_DOWN}
              baby={baby}
              light={light}
            />
            <Puppet
              cast={SURENDRA}
              f={f}
              lifeF={life}
              x={SEAT_DX.father}
              y={SEAT_Y}
              scale={RIDER_S.father}
              acting={() => (umbrella ? FATHER_UMB : FATHER_REST)}
              light={light}
              props={{ umbrella: P_UMBRELLA }}
              seated
              stillness={0.3}
            />
          </>
        }
      />
      </g>
      {cartOnly && <ZebuPair f={f} />}
    </g>
  );
};

/* ================================================================== */
/* J1: wide, the village road through the paddy, drizzle stopping      */
/* ================================================================== */

const J1_HZ = 470;
/** Road centre line (the cart's road line) at x: a raised earthen road rising gently to the right. */
const j1Road = (x: number) => 770 - (x - 960) * 0.03;
const J1_K = 0.36;
const J1_X0 = 520;

const J1_DIKES = Array.from({ length: 9 }, (_, i) => J1_HZ + 12 + Math.pow(i + 1, 1.75) * 9);
const J1_NEAR_DIKES = [880, 960, 1050];
const J1_POOLS = Array.from({ length: 14 }, (_, i) => ({
  x: -300 + rnd(i * 3 + 11) * 2500,
  y: J1_HZ + 30 + rnd(i * 7 + 5) * 230,
  w: 80 + rnd(i * 5 + 1) * 220,
}));
const J1_PUDDLES = [
  { x: 260, w: 70 },
  { x: 640, w: 46 },
  { x: 1010, w: 84 },
  { x: 1380, w: 56 },
  { x: 1720, w: 72 },
];
const J1_EGRETS = [
  { x: 330, y: 610, s: 0.8, ph: 0.2, dir: 1 as const },
  { x: 470, y: 690, s: 0.95, ph: 1.4, dir: -1 as const },
  { x: 1240, y: 600, s: 0.7, ph: 2.1, dir: 1 as const },
  { x: 1590, y: 680, s: 1.0, ph: 0.7, dir: -1 as const },
  { x: 1460, y: 930, s: 1.5, ph: 1.9, dir: 1 as const },
  { x: 380, y: 980, s: 1.6, ph: 2.8, dir: -1 as const },
];

const J1Defs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <linearGradient id="j1-sky" x1="0" y1="-200" x2="0" y2={J1_HZ} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#6e7984" />
        <stop offset="55%" stopColor="#9aa5ab" />
        <stop offset="100%" stopColor="#c3cbc9" />
      </linearGradient>
      <linearGradient id="j1-paddy" x1="0" y1={J1_HZ} x2="0" y2="1100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8a9a7c" />
        <stop offset="30%" stopColor="#6c8656" />
        <stop offset="100%" stopColor="#43603a" />
      </linearGradient>
      <radialGradient id="j1-break" cx="1520" cy="160" r="520" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#eef0ea" stopOpacity={0.75} />
        <stop offset="100%" stopColor="#eef0ea" stopOpacity={0} />
      </radialGradient>
      <filter id="j1-soft" x="-30%" y="-60%" width="160%" height="220%">
        <feGaussianBlur stdDeviation={18} />
      </filter>
    </defs>
  </svg>
);

const J1Sky: React.FC<{ f: number; u: number }> = ({ f, u }) => (
  <g>
    <rect x={PLANE_L} y={-300} width={PLANE_R - PLANE_L} height={J1_HZ + 340} fill="url(#j1-sky)" />
    {/* the clearing: a paler patch of sky opening to the right as the drizzle stops */}
    <rect x={PLANE_L} y={-300} width={PLANE_R - PLANE_L} height={J1_HZ + 340} fill="url(#j1-break)" opacity={0.3 + 0.5 * u} />
    <g filter="url(#j1-soft)">
      {[
        [200, 60, 420, 70, "#5f6a74"],
        [760, 20, 520, 80, "#66717b"],
        [1300, 110, 380, 60, "#6c7780"],
        [1900, 40, 460, 74, "#5c6670"],
        [480, 220, 360, 46, "#7b858c"],
        [1120, 260, 420, 40, "#838c92"],
      ].map(([cx, cy, rx, ry, c], i) => (
        <ellipse key={i} cx={(cx as number) + f * 0.25 * (i % 2 ? 1 : 0.6)} cy={cy as number} rx={rx as number} ry={ry as number} fill={c as string} opacity={0.8 - 0.25 * u} />
      ))}
    </g>
  </g>
);

const J1Land: React.FC<{ f: number; rain: number }> = ({ f, rain }) => (
  <g>
    {/* distant tree lines and palms, hazed by the rain */}
    <path d={scallop(17, J1_HZ - 46, 22, 64, J1_HZ + 20)} fill="#8a9a90" />
    {[160, 520, 880, 1330, 1720, 2050].map((x, i) => (
      <FarPalm key={i} x={x} y={J1_HZ - 18} h={70 + (i % 3) * 14} c="#7c8e82" sway={Math.sin(f * 0.04 + i) * 1.5} />
    ))}
    <path d={scallop(41, J1_HZ - 22, 18, 52, J1_HZ + 20)} fill="#6d8470" />
    {/* the paddy: flooded fields between low dikes, reflecting the grey sky */}
    <rect x={PLANE_L} y={J1_HZ} width={PLANE_R - PLANE_L} height={1300 - J1_HZ} fill="url(#j1-paddy)" />
    {J1_POOLS.map((p, i) => (
      <ellipse key={i} cx={p.x} cy={p.y} rx={p.w} ry={p.w * 0.06 + 2} fill="#c6cfcf" opacity={0.32} />
    ))}
    {J1_DIKES.map((y, i) => (
      <g key={i}>
        <path d={`M ${PLANE_L} ${f1(y)} Q 960 ${f1(y - 6 - i)} ${PLANE_R} ${f1(y + 4)}`} stroke="#a4b47a" strokeWidth={1.4 + i * 0.5} fill="none" opacity={0.55} />
        <path
          d={`M ${PLANE_L} ${f1(y + 4 + i * 0.6)} Q 960 ${f1(y - 2)} ${PLANE_R} ${f1(y + 8 + i)}`}
          stroke="#55803c"
          strokeWidth={2 + i * 0.9}
          strokeDasharray={`${2 + i * 0.6} ${3 + i * 0.8}`}
          fill="none"
          opacity={0.55}
        />
      </g>
    ))}
    {/* the near paddy, below the road */}
    {J1_NEAR_DIKES.map((y, i) => (
      <path key={i} d={`M ${PLANE_L} ${y} Q 900 ${y - 14} ${PLANE_R} ${y + 6}`} stroke="#9fb070" strokeWidth={6 + i * 3} fill="none" opacity={0.5} />
    ))}
    {Array.from({ length: 70 }, (_, i) => {
      const x = PLANE_L + 40 + rnd(i * 13 + 7) * (PLANE_R - PLANE_L - 80);
      const y = 840 + rnd(i * 17 + 3) * 220;
      const h = 10 + (y - 840) * 0.08;
      return <path key={i} d={`M ${f1(x)} ${f1(y)} l -3 ${f1(-h)} M ${f1(x)} ${f1(y)} l 0 ${f1(-h * 1.1)} M ${f1(x)} ${f1(y)} l 3 ${f1(-h)}`} stroke="#3f6a2c" strokeWidth={2} opacity={0.6} />;
    })}
    {/* a mango tree and a banana clump by the road, a lone palm beyond */}
    <Tree x={130} y={j1Road(130) - 30} r={120} c="#3d5a3c" rim="#7a8e78" lit={1} />
    <FarPalm x={1810} y={j1Road(1810) - 22} h={300} c="#34483a" sway={Math.sin(f * 0.035) * 3} />
    {/* egrets feeding in the paddy (one lifts off and flies away later) */}
    {J1_EGRETS.map((e, i) => (
      <Egret key={i} x={e.x} y={e.y} s={e.s} f={f} ph={e.ph} dir={e.dir} />
    ))}
    {/* the raised earthen road: its far edge, the wet surface, the near slope */}
    <path d={`M ${PLANE_L} ${f1(j1Road(PLANE_L) - 22)} L ${PLANE_R} ${f1(j1Road(PLANE_R) - 22)} L ${PLANE_R} ${f1(j1Road(PLANE_R) + 14)} L ${PLANE_L} ${f1(j1Road(PLANE_L) + 14)} Z`} fill="#8a7458" />
    <path d={`M ${PLANE_L} ${f1(j1Road(PLANE_L) + 14)} L ${PLANE_R} ${f1(j1Road(PLANE_R) + 14)} L ${PLANE_R} ${f1(j1Road(PLANE_R) + 42)} L ${PLANE_L} ${f1(j1Road(PLANE_L) + 42)} Z`} fill="#5b6a3a" />
    <path d={`M ${PLANE_L} ${f1(j1Road(PLANE_L) - 22)} L ${PLANE_R} ${f1(j1Road(PLANE_R) - 22)}`} stroke="#6f7f48" strokeWidth={5} />
    {J1_PUDDLES.map((p, i) => (
      <g key={i}>
        <ellipse cx={p.x} cy={j1Road(p.x) - 4} rx={p.w} ry={6} fill="#c8d0d2" opacity={0.75} />
        <ellipse cx={p.x - p.w * 0.2} cy={j1Road(p.x) - 5} rx={p.w * 0.5} ry={2} fill="#e8eced" opacity={0.6} />
        {/* raindrop rings on the puddle while the drizzle lasts */}
        {rain > 0.02 &&
          [0, 1].map((k) => {
            const per = 12 + k * 5;
            const ph = ((f + i * 7 + k * 5) % per) / per;
            return (
              <ellipse
                key={k}
                cx={p.x + (rnd(i * 5 + k + Math.floor((f + i * 7 + k * 5) / per)) - 0.5) * p.w}
                cy={j1Road(p.x) - 4}
                rx={2 + ph * 12}
                ry={(2 + ph * 12) * 0.28}
                fill="none"
                stroke="#eef2f3"
                strokeWidth={1}
                opacity={rain * (1 - ph) * 0.9}
              />
            );
          })}
      </g>
    ))}
  </g>
);

/** Near verge at the bottom of the wide: grass tufts, out of focus. */
const J1Verge: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {Array.from({ length: 40 }, (_, i) => {
      const x = -300 + i * 66 + rnd(i * 3 + 401) * 30;
      const h = 50 + rnd(i * 7 + 403) * 70;
      const sw = Math.sin(f * 0.05 + i) * 3;
      return (
        <g key={i} stroke={["#2f4a2a", "#3c5a32", "#4a6a38"][i % 3]} strokeWidth={6} strokeLinecap="round" fill="none">
          {[-12, 0, 12].map((dx, kk) => (
            <path key={kk} d={`M ${x + dx} 1100 Q ${x + dx + sw} ${1100 - h * 0.6} ${x + dx * 1.6 + sw * 2} ${1100 - h * (0.8 + 0.12 * kk)}`} />
          ))}
        </g>
      );
    })}
  </g>
);

const ShotJ1: React.FC<{ f: number; t: number; len: number }> = ({ f, t, len }) => {
  const u = t / len;
  // the drizzle thins and stops by about four fifths of the shot
  const rain = 1 - smooth((u - 0.15) / 0.65);
  const cartX = J1_X0 + J1_K * V * t;
  // one egret lifts off from the paddy and flies away to the right
  const fly = clamp((t - len * 0.45) / (len * 0.55));
  return (
    <Stage cam={{ x: 0, y: 0, zoom: 1, focus: 1, dof: 0.6 }} background="#9aa5ab">
      <J1Defs />
      <Layer depth={0.2}>
        <J1Sky f={f} u={u} />
      </Layer>
      <Layer depth={1}>
        <DivineDefs />
        <J1Land f={f} rain={rain} />
        {fly > 0 && <FlyingEgret x={1240 + 380 * fly} y={590 - 150 * fly - 40 * Math.sin(fly * 3)} s={0.9 + 0.3 * fly} f={f} ph={0.4} />}
        <FamilyCart
          id="j1"
          f={f}
          life={f}
          x={cartX}
          y={j1Road(cartX)}
          k={J1_K}
          road={0.8}
          umbrella
          light={{ keySide: -1, rim: "#d6dde4", rimStrength: 0.25 }}
          baby={{ gaze: 0.2, lookY: -0.4, smile: 0.45, aura: 0.8 }}
        />
      </Layer>
      <Layer depth={1.3} extraBlur={4}>
        <J1Verge f={f} />
      </Layer>
      <Layer depth={1.15}>
        <Rain f={f} n={170} seed={5} wind={0.12} o={0.55 * rain} len={34} speed={46} color="#e2e9ee" width={1.4} />
      </Layer>
      <Grade warmth={0.03} vignette={0.52} tint="#4f5d70" tintAmount={0.32 - 0.1 * u} grain={0.05} />
    </Stage>
  );
};

/* ================================================================== */
/* J2: close-up, the turning wheel through the mud                     */
/* ================================================================== */

const J2_K = 4.2;
/** The rear wheel's hub on screen; the cart-local origin (road line, cart centre) follows from it. */
const J2_HUB = { x: 880, y: 450 };
const J2_X0 = J2_HUB.x + 120 * J2_K;
const J2_Y0 = J2_HUB.y + WHEEL_R * J2_K;
const WOOD = "#7a4e2a";
const WOOD_LIGHT = "#8a6a3a";
const WOOD_DARK = "#4a2c14";
/** Ground speed on screen (px per frame) at the wheel's depth. */
const J2_GS = V * J2_K;

const J2_STONES = Array.from({ length: 40 }, (_, i) => ({
  x: rnd(i * 3 + 21) * 2600,
  y: J2_Y0 - 6 + rnd(i * 5 + 23) * 230,
  r: 4 + rnd(i * 7 + 29) * 10,
  light: rnd(i * 11 + 31) > 0.55,
}));
const J2_PUDDLES = Array.from({ length: 5 }, (_, i) => ({ x: i * 560 + rnd(i + 51) * 200, w: 160 + rnd(i + 53) * 140, y: J2_Y0 + 10 + rnd(i + 57) * 60 }));
const J2_MUD = Array.from({ length: 11 }, (_, i) => ({ a: (i / 11) * 360 + rnd(i + 71) * 20, r: 3 + rnd(i + 73) * 4 }));

/** The road surface and the field beyond, scrolling past at the wheel's pace (far parts slower). */
const J2Ground: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const off = J2_GS * t;
  const SPAN = 2600;
  return (
    <g>
      {/* the road's far half, the far verge and its grass */}
      <rect x={PLANE_L} y={600} width={PLANE_R - PLANE_L} height={700} fill="#6c5a44" />
      <rect x={PLANE_L} y={600} width={PLANE_R - PLANE_L} height={50} fill="#5a6a3a" />
      {Array.from({ length: 60 }, (_, i) => {
        const x = wrap(i * 46 - off * 0.62, -200, SPAN);
        const h = 26 + rnd(i * 3 + 5) * 30;
        return <path key={i} d={`M ${f1(x)} 650 l -6 ${f1(-h)} M ${f1(x)} 650 l 2 ${f1(-h * 1.15)} M ${f1(x)} 650 l 8 ${f1(-h * 0.9)}`} stroke="#45602f" strokeWidth={4} strokeLinecap="round" />;
      })}
      {/* ruts and the wet sheen of the road */}
      <rect x={PLANE_L} y={J2_Y0 - 40} width={PLANE_R - PLANE_L} height={60} fill="#5a4632" />
      <rect x={PLANE_L} y={J2_Y0 - 14} width={PLANE_R - PLANE_L} height={10} fill="#a7a59a" opacity={0.35} />
      {[700, 760, J2_Y0 + 70, J2_Y0 + 150].map((y, i) => (
        <rect key={i} x={PLANE_L} y={y} width={PLANE_R - PLANE_L} height={6 + i * 3} fill="#4e3c2a" opacity={0.5} />
      ))}
      {J2_PUDDLES.map((p, i) => {
        const x = wrap(p.x - off, -400, SPAN);
        return (
          <g key={i}>
            <ellipse cx={x} cy={p.y} rx={p.w} ry={18} fill="#9aa4a6" opacity={0.7} />
            <ellipse cx={x - p.w * 0.25} cy={p.y - 4} rx={p.w * 0.45} ry={5} fill="#d4dadb" opacity={0.6} />
          </g>
        );
      })}
      {J2_STONES.map((s, i) => {
        const x = wrap(s.x - off, -200, SPAN);
        return <ellipse key={i} cx={x} cy={s.y} rx={s.r} ry={s.r * 0.5} fill={s.light ? "#b4a184" : "#3e2f22"} opacity={0.8} />;
      })}
      {/* far stones and clods on the road's far half move a little slower */}
      {J2_STONES.slice(0, 24).map((s, i) => {
        const x = wrap(s.x * 0.9 + 300 - off * 0.8, -200, SPAN);
        return <ellipse key={`far${i}`} cx={x} cy={668 + (s.y - J2_Y0) * 0.35} rx={s.r * 0.6} ry={s.r * 0.28} fill={s.light ? "#a8977a" : "#46362a"} opacity={0.7} />;
      })}
    </g>
  );
};

/** The paddy and trees beyond the road, slower still, softened by depth of field. */
const J2Far: React.FC<{ f: number; t: number; u: number }> = ({ f, t, u }) => {
  const off = J2_GS * t * 0.18;
  return (
    <g>
      <rect x={PLANE_L} y={-300} width={PLANE_R - PLANE_L} height={800} fill={mix("#9aa6ac", "#b9c6cc", u)} />
      <rect x={PLANE_L} y={360} width={PLANE_R - PLANE_L} height={300} fill={mix("#7f9a62", "#86a566", u)} />
      <g transform={`translate(${f1(-wrap(off, 0, 600))}, 0)`}>
        <path d={scallop(63, 300, 40, 90, 420)} fill={mix("#5f7a5c", "#5e8058", u)} />
        {[100, 700, 1300, 1900, 2500].map((x, i) => (
          <FarPalm key={i} x={x} y={330} h={190} c={mix("#4a6248", "#47643f", u)} />
        ))}
      </g>
    </g>
  );
};

/**
 * The close-up of the cart's rear wheel (cart-local units, drawn as the rig draws its foreground wheel): a dark
 * felloe with a lit edge, eight spokes with lit sides, rim lugs and a hub; the planked body above it with the deck
 * and the underframe. Drawn here so the close-up holds one wheel (the rig's two wheels sit only 40 units apart).
 * The wheel turns by the distance travelled, and the body rides over the ruts once per spoke, as in the rig.
 */
const CartSideClose: React.FC<{ f: number }> = ({ f }) => {
  const { roll } = drive(f);
  const rut = Math.pow(0.5 - 0.5 * Math.cos(roll * 8 + 0.7 - 1.9), 10);
  const lift = -0.7 * 3.4 * rut;
  const R = WHEEL_R;
  const sw = (ph: number, a: number) => Math.sin(f * 0.18 + ph) * a;
  return (
    <g transform={`translate(0, ${lift.toFixed(3)})`}>
      <g transform={`translate(-120, ${-R})`}>
        <circle r={R - 6} fill="none" stroke="#2a1a0e" strokeWidth={14} />
        <path d="M -88.3 -32.1 A 94 94 0 0 1 -47 -81.4" stroke={WOOD_LIGHT} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.75} />
        <circle r={R - 13} fill="none" stroke="#5a3a1e" strokeWidth={1.2} opacity={0.6} />
        <g transform={`rotate(${(roll * 180) / Math.PI})`}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            const ex = Math.cos(a) * (R - 10);
            const ey = Math.sin(a) * (R - 10);
            const nx = -Math.sin(a) * 1.8;
            const ny = Math.cos(a) * 1.8;
            return (
              <g key={i}>
                <line x1={0} y1={0} x2={ex} y2={ey} stroke={WOOD_DARK} strokeWidth={6} strokeLinecap="round" />
                <line x1={nx} y1={ny} x2={ex + nx} y2={ey + ny} stroke={WOOD_LIGHT} strokeWidth={2} strokeLinecap="round" />
                <circle cx={ex} cy={ey} r={3.5} fill="#2a1a0e" />
              </g>
            );
          })}
          <circle r={14} fill={WOOD_DARK} />
          <circle r={6} fill="#a88a5a" opacity={0.85} />
        </g>
      </g>
      {/* the body: side boards with grain, top rail, deck, underframe and the axle block */}
      <rect x={-190} y={-180} width={420} height={30} fill={WOOD} />
      <rect x={-196} y={-188} width={432} height={9} rx={3} fill={WOOD_LIGHT} />
      <rect x={-190} y={-150} width={420} height={24} fill={WOOD_LIGHT} />
      <path d="M -190 -140 H 230 M -190 -131 H 230" stroke={WOOD_DARK} strokeWidth={1.6} opacity={0.6} />
      <rect x={-180} y={-126} width={410} height={10} fill={WOOD_DARK} />
      <rect x={-190} y={-124} width={420} height={4} fill="#000" opacity={0.22} />
      {[-168, -120, -70, -20, 30, 80, 130].map((x) => (
        <path key={x} d={`M ${x} -176 q 10 7 0 14`} stroke={WOOD_DARK} strokeWidth={1.2} fill="none" opacity={0.5} />
      ))}
      {[-150, -100, -50, 0, 50, 100, 150].map((x) => (
        <line key={`p${x}`} x1={x} y1={-150} x2={x + 6} y2={-126} stroke={WOOD_DARK} strokeWidth={1.4} opacity={0.6} />
      ))}
      <circle cx={-170} cy={-165} r={2} fill="#2a1a0e" />
      <rect x={-136} y={-118} width={32} height={14} rx={3} fill="#3a2010" />
      {/* the end of Charu's sari hanging over the side board, stirring with the ride */}
      <path d={`M -10 -188 Q ${f1(-14 + sw(0, 3))} -170 ${f1(-8 + sw(0.6, 5))} -150 L ${f1(22 + sw(0.9, 5))} -152 Q ${f1(20 + sw(0.3, 3))} -172 26 -188 Z`} fill="#fcf8f2" />
      <path d={`M ${f1(-8 + sw(0.6, 5))} -150 L ${f1(22 + sw(0.9, 5))} -152`} stroke="#b8292f" strokeWidth={3} />
    </g>
  );
};

/** Mud on the rim and the drops it throws off as the wheel comes up out of the mud (cart-local units). */
const J2Drops: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const { roll } = drive(f);
  const hub = { x: -120, y: -WHEEL_R };
  const R = WHEEL_R - 6;
  const omega = V / WHEEL_R;
  const items: React.ReactNode[] = [];
  // mud clumps stuck to the rim, turning with it (hidden where the cart body covers the wheel)
  J2_MUD.forEach((m, i) => {
    const a = (m.a * Math.PI) / 180 + roll;
    const x = hub.x + Math.cos(a) * R;
    const y = hub.y + Math.sin(a) * R;
    if (y > -192 && y < -114) return;
    items.push(<ellipse key={`m${i}`} cx={x} cy={y} rx={m.r} ry={m.r * 0.7} transform={`rotate(${f1((a * 180) / Math.PI)} ${f1(x)} ${f1(y)})`} fill="#3a2a1a" opacity={0.85} />);
  });
  // drops: thrown off the rim as it lifts out of the mud at the back of the wheel, then falling
  const RATE = 1.4;
  const LIFE = 16;
  for (let n = Math.floor((t - LIFE) / RATE); n <= Math.floor(t / RATE); n++) {
    const born = n * RATE;
    const age = t - born;
    if (age < 0 || age > LIFE || n < -20) continue;
    const ang = ((128 + rnd(n * 3.1 + 7) * 70) * Math.PI) / 180;
    const sp = omega * R * (0.25 + rnd(n * 5.7 + 3) * 0.25);
    const x0 = hub.x + Math.cos(ang) * R;
    const y0 = hub.y + Math.sin(ang) * R;
    const vx = -Math.sin(ang) * sp - 0.6;
    const vy = Math.cos(ang) * sp;
    const g = 0.42;
    const x = x0 + vx * age;
    const y = y0 + vy * age + 0.5 * g * age * age;
    if (y > -2) continue;
    const dvy = vy + g * age;
    const dir = (Math.atan2(dvy, vx) * 180) / Math.PI;
    const r = 1.5 + rnd(n * 2.3 + 1) * 1.9;
    const op = (1 - age / LIFE) * 0.95;
    items.push(
      <g key={`d${n}`} transform={`translate(${f1(x)}, ${f1(y)}) rotate(${f1(dir)})`} opacity={op}>
        <ellipse cx={-r * 1.4} cy={0} rx={r * 2.4} ry={r * 0.55} fill="#c6cdd0" opacity={0.45} />
        <ellipse cx={0} cy={0} rx={r * 1.25} ry={r} fill={n % 3 === 0 ? "#6e5a44" : "#b9c2c4"} />
        <circle cx={r * 0.3} cy={-r * 0.35} r={r * 0.35} fill="#f4f7f8" opacity={0.8} />
      </g>,
    );
  }
  // ripples left behind where the wheel presses through the wet rut
  for (let n = Math.floor((t - 24) / 6); n <= Math.floor(t / 6); n++) {
    const age = t - n * 6;
    if (age < 0 || age > 24) continue;
    const x = hub.x - (V * age) - 6;
    items.push(<ellipse key={`r${n}`} cx={x} cy={-1} rx={4 + age * 1.1} ry={(4 + age * 1.1) * 0.22} fill="none" stroke="#d8dfe0" strokeWidth={0.8} opacity={(1 - age / 24) * 0.8} />);
  }
  return <g>{items}</g>;
};

const ShotJ2: React.FC<{ f: number; t: number; len: number }> = ({ f, t, len }) => {
  const u = t / len;
  const off = J2_GS * t;
  return (
    <Stage cam={{ x: 0, y: 0, zoom: 1, focus: 1, dof: 1.6 }} background="#9aa6ac">
      <Layer depth={0.3} extraBlur={2}>
        <J2Far f={f} t={t} u={u} />
      </Layer>
      <Layer depth={1}>
        <DivineDefs />
        <J2Ground f={f} t={t} />
        <g transform={`translate(${J2_X0}, ${J2_Y0}) scale(${J2_K})`}>
          <ellipse cx={-120} cy={-1} rx={70} ry={5} fill="#000" opacity={0.25} />
          <CartSideClose f={f} />
          <J2Drops f={f} t={t} />
        </g>
      </Layer>
      {/* near grass at the road's edge sweeping past, out of focus */}
      <Layer depth={1.25} extraBlur={6}>
        {Array.from({ length: 26 }, (_, i) => {
          const x = wrap(i * 120 - off * 1.35, -300, 3120);
          const h = 120 + rnd(i * 7 + 3) * 120;
          return (
            <g key={i} stroke={["#2f4a2a", "#3c5a32"][i % 2]} strokeWidth={12} strokeLinecap="round" fill="none">
              <path d={`M ${f1(x)} 1140 Q ${f1(x - 10)} ${f1(1140 - h * 0.6)} ${f1(x - 26)} ${f1(1140 - h)}`} />
              <path d={`M ${f1(x + 18)} 1140 Q ${f1(x + 24)} ${f1(1140 - h * 0.5)} ${f1(x + 40)} ${f1(1140 - h * 0.85)}`} />
            </g>
          );
        })}
      </Layer>
      <Grade warmth={0.06 + 0.06 * u} vignette={0.5} tint="#5a6a7c" tintAmount={0.18 - 0.1 * u} grain={0.05} />
    </Stage>
  );
};

/* ================================================================== */
/* J3: medium, the bullock's head nodding, the bells; the clouds break */
/* ================================================================== */

/**
 * J3 is a medium-wide side view riding alongside the cart: the whole bullock pair walking, the front of the cart
 * and the family behind them, the road sliding past. The bullocks here are drawn in this file (ZebuPair) with a
 * broad bovine head, short curved horns and a hump; the cart rig is clipped to the cart itself.
 */
const J3_K = 1.05;
const J3_X0 = 560;
const J3_Y0 = 815;
const J3_SUN = { x: 1560, y: 170 };

const J3Defs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <radialGradient id="j3-sun" cx={J3_SUN.x} cy={J3_SUN.y} r="760" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff6d8" stopOpacity={1} />
        <stop offset="12%" stopColor="#ffe6a8" stopOpacity={0.7} />
        <stop offset="45%" stopColor="#f6d08a" stopOpacity={0.22} />
        <stop offset="100%" stopColor="#f6d08a" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="j3-ray" x1="0" y1={J3_SUN.y} x2="0" y2={J3_SUN.y + 900} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff0c0" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#fff0c0" stopOpacity={0} />
      </linearGradient>
      <filter id="j3-cloud" x="-30%" y="-60%" width="160%" height="220%">
        <feGaussianBlur stdDeviation={14} />
      </filter>
      <filter id="j3-rayblur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={10} />
      </filter>
    </defs>
  </svg>
);

/** Cloud banks that drift apart to let the sun through: (cx, cy, rx, ry, side the bank drifts to). */
const J3_CLOUDS: Array<[number, number, number, number, number]> = [
  [1380, 140, 300, 90, -1],
  [1760, 190, 320, 100, 1],
  [1560, 300, 380, 70, 1],
  [900, 120, 420, 110, -1],
  [400, 230, 460, 100, -1],
  [1200, 380, 360, 60, -1],
  [2100, 330, 300, 80, 1],
];

const J3Sky: React.FC<{ f: number; u: number }> = ({ f, u }) => {
  const open = smooth((u - 0.1) / 0.75);
  const sky = mix("#9ba7ae", "#8db6d8", open);
  const low = mix("#c2cacb", "#e6e2c8", open);
  return (
    <g>
      <defs>
        <linearGradient id="j3-skyg" x1="0" y1="-300" x2="0" y2="760" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={sky} />
          <stop offset="100%" stopColor={low} />
        </linearGradient>
      </defs>
      <rect x={PLANE_L} y={-300} width={PLANE_R - PLANE_L} height={1100} fill="url(#j3-skyg)" />
      <rect x={PLANE_L} y={-300} width={PLANE_R - PLANE_L} height={1100} fill="url(#j3-sun)" opacity={0.15 + 0.85 * open} />
      <circle cx={J3_SUN.x} cy={J3_SUN.y} r={58} fill="#fff8e2" opacity={smooth((open - 0.35) / 0.5)} />
      <g filter="url(#j3-cloud)">
        {J3_CLOUDS.map(([cx, cy, rx, ry, side], i) => {
          const dx = side * open * (180 + i * 30) + f * 0.2;
          const lit = mix("#7d8790", "#f4ecd8", open * (i < 3 ? 1 : 0.7));
          return (
            <g key={i}>
              <ellipse cx={cx + dx} cy={cy} rx={rx} ry={ry} fill={mix("#6f7a84", "#c9ccd0", open)} opacity={0.9} />
              <ellipse cx={cx + dx - side * rx * 0.25} cy={cy - ry * 0.35} rx={rx * 0.7} ry={ry * 0.5} fill={lit} opacity={0.75} />
            </g>
          );
        })}
      </g>
      {/* soft shafts of the first sun through the gap */}
      <g filter="url(#j3-rayblur)" opacity={open * 0.8} style={{ mixBlendMode: "screen" }}>
        {[-40, -22, -6, 10, 28].map((a, i) => {
          const L = 1100;
          const w = 3.5 + (i % 2) * 2;
          const a0 = ((a - w) * Math.PI) / 180;
          const a1 = ((a + w) * Math.PI) / 180;
          return (
            <path
              key={i}
              d={`M ${J3_SUN.x} ${J3_SUN.y} L ${f1(J3_SUN.x + Math.sin(a0) * L)} ${f1(J3_SUN.y + Math.cos(a0) * L)} L ${f1(J3_SUN.x + Math.sin(a1) * L)} ${f1(J3_SUN.y + Math.cos(a1) * L)} Z`}
              fill="url(#j3-ray)"
              opacity={0.4 + 0.1 * Math.sin(f * 0.05 + i)}
            />
          );
        })}
      </g>
    </g>
  );
};

/* ---------------- the zebu bullock pair (J3) ---------------- */

/** A tapered limb segment with rounded ends (as the cart rig's). */
const taperPath = (x1: number, y1: number, w1: number, x2: number, y2: number, w2: number) => {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const a = (v: number) => v.toFixed(2);
  const r1 = w1 / 2;
  const r2 = w2 / 2;
  return (
    `M ${a(x1 + nx * r1)} ${a(y1 + ny * r1)} L ${a(x2 + nx * r2)} ${a(y2 + ny * r2)} ` +
    `A ${a(r2)} ${a(r2)} 0 0 0 ${a(x2 - nx * r2)} ${a(y2 - ny * r2)} ` +
    `L ${a(x1 - nx * r1)} ${a(y1 - ny * r1)} A ${a(r1)} ${a(r1)} 0 0 0 ${a(x1 + nx * r1)} ${a(y1 + ny * r1)} Z`
  );
};
const Z_LEG = 120;
const Z_STANCE = 0.62;
const Z_HOOF_H = 13;

/**
 * One jointed leg (the cart rig's gait, so the hoof stays planted): hip at (hx, hy), road at hy + Z_LEG. In the
 * stance the hoof slides back under the body by exactly the distance the cart covers, then lifts, folds and
 * swings forward. Forelegs bend at the knee, hind legs at the hock.
 */
const ZebuLeg: React.FC<{ hx: number; hy: number; phase: number; hind: boolean; w: number; c: string; shade: string }> = ({ hx, hy, phase, hind, w, c, shade }) => {
  const p = (((phase / (2 * Math.PI)) % 1) + 1) % 1;
  const reach = (STEP_LEN * Z_STANCE) / 2;
  let hoofX: number;
  let lift = 0;
  let swing = 0;
  if (p < Z_STANCE) {
    hoofX = reach * (1 - (2 * p) / Z_STANCE);
  } else {
    const s = (p - Z_STANCE) / (1 - Z_STANCE);
    hoofX = -reach + 2 * reach * (0.5 - 0.5 * Math.cos(Math.PI * s));
    swing = Math.sin(Math.PI * s);
    lift = (hind ? 20 : 26) * swing;
  }
  const upper = hind ? 58 : 56;
  const lower = 62;
  const tx = hoofX + (hind ? -4 : 4);
  const ty = Z_LEG - Z_HOOF_H - lift;
  const d = Math.min(upper + lower - 0.5, Math.max(Math.abs(upper - lower) + 1, Math.hypot(tx, ty)));
  const base = Math.atan2(ty, tx);
  const bend = Math.acos(clamp((upper * upper + d * d - lower * lower) / (2 * upper * d), -1, 1));
  const ja = hind ? base + bend : base - bend;
  const jx = Math.cos(ja) * upper;
  const jy = Math.sin(ja) * upper;
  const k = d / (Math.hypot(tx, ty) || 1);
  const fx = tx * k;
  const fy = ty * k;
  const ux = -Math.cos(ja) * 30;
  const uy = -Math.sin(ja) * 30;
  const lowerDeg = (Math.atan2(fx - jx, fy - jy) * 180) / Math.PI;
  const hoofRot = swing * ((hind ? 22 : 34) - 0.5 * lowerDeg);
  return (
    <g transform={`translate(${hx}, ${hy})`}>
      <path d={taperPath(ux, uy, w * (hind ? 2.4 : 2.0), jx, jy, w * 0.9)} fill={c} />
      <path d={taperPath(jx, jy, w * 0.8, fx, fy, w * 0.52)} fill={c} />
      <ellipse cx={jx} cy={jy} rx={w * 0.52} ry={w * 0.58} fill={c} />
      <path d={`M ${f1(jx - w * 0.4)} ${f1(jy + w * 0.2)} Q ${f1(jx)} ${f1(jy + w * 0.6)} ${f1(jx + w * 0.4)} ${f1(jy + w * 0.2)}`} stroke={shade} strokeWidth={1.6} fill="none" opacity={0.5} />
      <circle cx={fx} cy={fy} r={w * 0.32} fill={c} />
      <g transform={`translate(${f1(fx)}, ${f1(fy)}) rotate(${f1(hoofRot)})`}>
        <path d={`M ${-w * 0.3} 0 L ${w * 0.3} 0 L ${w * 0.44} ${Z_HOOF_H} L ${-w * 0.34} ${Z_HOOF_H} Z`} fill="#2e2620" />
        <line x1={w * 0.05} y1={Z_HOOF_H * 0.35} x2={w * 0.08} y2={Z_HOOF_H} stroke="#6b5a4a" strokeWidth={1.2} />
      </g>
    </g>
  );
};

/** A small brass bell on a red cord; `ang` is its swing (deg), the clapper lagging a little. */
const ZBell: React.FC<{ x: number; y: number; ang: number; s?: number }> = ({ x, y, ang, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${f1(ang)}) scale(${s})`}>
    <line x1={0} y1={0} x2={0} y2={8} stroke="#7a2a22" strokeWidth={2.2} strokeLinecap="round" />
    <g transform={`rotate(${f1(-ang * 0.35)}, 0, 10)`}>
      <circle cx={0} cy={23} r={2.6} fill="#4a3214" />
    </g>
    <path d="M -8 21 Q -8.6 8.5 0 7.5 Q 8.6 8.5 8 21 Z" fill="#d9a441" />
    <rect x={-9} y={19.5} width={18} height={3.4} rx={1.7} fill="#a87a28" />
    <path d="M -4.4 18 Q -4.6 11.4 0 10.4" stroke="#f6dc94" strokeWidth={1.5} fill="none" opacity={0.85} strokeLinecap="round" />
  </g>
);

/**
 * A zebu bullock facing right, side view (bullock-local units: road y = 0, the same frame as the cart rig's
 * bullocks): a deep barrel body, a fleshy hump over the withers, loose dewlap folds under the throat, a long
 * head sloping down to a broad pale muzzle with nostrils, drooping ears, short horns curving up and back,
 * a tail with a dark switch, and four jointed legs in a four-beat walk (hooves planted, driven by distance).
 * The head and neck nod with each forefoot plant and the neck bell swings behind the nod.
 */
const Zebu: React.FC<{ x: number; y: number; s: number; step: number; c: string; shade: string; far: string; bell?: boolean }> = ({ x, y, s, step, c, shade, far, bell = false }) => {
  const legPhase = (off: number) => step + off * 2 * Math.PI;
  const bob = (-2.2 * (1 - Math.cos(2 * step))) / 2;
  const tail = 9 * Math.sin(step);
  const nod = 4.5 * Math.sin(2 * step - 0.6);
  const bellAng = -nod + 18 * Math.sin(2 * step - 1.7);
  const muzzle = mix(c, "#efe4cc", 0.65);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ZebuLeg hx={-100} hy={-120} phase={legPhase(0)} hind w={20} c={far} shade={shade} />
      <ZebuLeg hx={92} hy={-120} phase={legPhase(0.75)} hind={false} w={20} c={far} shade={shade} />
      <g transform={`rotate(${f1(tail)}, -150, -206)`}>
        <path d="M -150 -206 Q -178 -160 -172 -98" stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d="M -176 -112 q -8 14 -2 30 q 8 6 12 -4 q 0 -16 -6 -28 Z" fill="#2e2620" />
      </g>
      <g transform={`translate(0, ${f1(bob)})`}>
        {/* barrel, belly shade and the rump */}
        <path d="M -158 -196 Q -160 -228 -120 -232 L 40 -228 Q 110 -224 128 -186 Q 140 -140 100 -118 Q 0 -100 -120 -118 Q -168 -136 -158 -196 Z" fill={c} />
        <path d="M -130 -124 Q 0 -104 96 -124 Q 60 -112 0 -110 Q -70 -110 -130 -124 Z" fill={shade} opacity={0.45} />
        <path d="M -150 -200 Q -120 -238 -80 -226" stroke={mix(c, "#ffffff", 0.25)} strokeWidth={4} fill="none" opacity={0.5} />
        {/* the hump over the withers */}
        <path d="M 18 -226 Q 34 -280 80 -274 Q 108 -268 108 -232 Z" fill={c} />
        <path d="M 30 -252 Q 54 -278 86 -268" stroke={mix(c, "#ffffff", 0.3)} strokeWidth={3} fill="none" opacity={0.5} />
        {/* neck, dewlap and head nod together about the withers */}
        <g transform={`rotate(${f1(nod)}, 96, -214)`}>
          <path d="M 70 -236 Q 130 -262 176 -262 L 196 -226 Q 160 -196 128 -150 L 90 -150 Z" fill={c} />
          {/* dewlap: loose folds of skin from the throat to the chest */}
          <path d="M 110 -170 Q 128 -126 150 -150 Q 166 -176 184 -214 Q 166 -196 150 -176 Q 132 -158 110 -170 Z" fill={c} />
          <path d="M 126 -150 Q 144 -146 156 -164" stroke={shade} strokeWidth={1.6} fill="none" opacity={0.55} />
          <path d="M 140 -168 Q 156 -170 168 -190" stroke={shade} strokeWidth={1.4} fill="none" opacity={0.5} />
          {/* yoke pad on the neck in front of the hump */}
          <rect x={104} y={-262} width={38} height={12} rx={5} fill={WOOD_DARK} transform="rotate(-16 123 -256)" />
          {/* far horn and far ear */}
          <path d="M 184 -270 Q 178 -294 194 -304" stroke={mix("#cfc3a6", "#3a3028", 0.25)} strokeWidth={8} fill="none" strokeLinecap="round" />
          <ellipse cx={170} cy={-262} rx={22} ry={8} transform="rotate(28 170 -262)" fill={shade} />
          {/* the long head, sloping down to the broad muzzle */}
          <path d="M 168 -276 Q 194 -290 214 -276 L 246 -236 Q 258 -218 250 -204 Q 236 -194 218 -200 L 180 -226 Q 160 -244 168 -276 Z" fill={c} />
          <path d="M 178 -270 Q 198 -280 212 -270 L 232 -246" stroke={mix(c, "#ffffff", 0.3)} strokeWidth={3} fill="none" opacity={0.5} />
          <ellipse cx={238} cy={-212} rx={20} ry={15} transform="rotate(30 238 -212)" fill={muzzle} />
          <ellipse cx={246} cy={-216} rx={3.4} ry={2.2} transform="rotate(30 246 -216)" fill="#3a2a22" />
          <path d="M 226 -201 Q 236 -198 244 -202" stroke="#5a4636" strokeWidth={1.6} fill="none" />
          {/* eye with a soft lid, near ear drooping, short horn curving up and back */}
          <ellipse cx={196} cy={-262} rx={4.6} ry={4} fill="#1d1512" />
          <circle cx={197.4} cy={-263.4} r={1.3} fill="#fff8ec" />
          <path d="M 190 -265 Q 196 -269 203 -265" stroke={shade} strokeWidth={1.6} fill="none" />
          <ellipse cx={176} cy={-256} rx={24} ry={9} transform="rotate(30 176 -256)" fill={mix(c, "#3a3028", 0.25)} />
          <path d="M 180 -276 Q 172 -300 188 -312" stroke="#efe6cf" strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M 180 -276 Q 174 -296 186 -308" stroke="#b9ad92" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
          {bell && (
            <g>
              <path d="M 150 -248 Q 166 -220 186 -214" stroke="#a8322a" strokeWidth={5} fill="none" strokeLinecap="round" />
              <ZBell x={172} y={-218} ang={bellAng} s={1.2} />
            </g>
          )}
        </g>
      </g>
      <ZebuLeg hx={-86} hy={-120} phase={legPhase(0.5)} hind w={22} c={c} shade={shade} />
      <ZebuLeg hx={78} hy={-120} phase={legPhase(0.25)} hind={false} w={22} c={c} shade={shade} />
    </g>
  );
};

/** The pair in harness (cart-local units), as the cart rig places its bullocks; the pole runs to the yoke. */
const ZebuPair: React.FC<{ f: number }> = ({ f }) => {
  const { step } = drive(f);
  return (
    <g>
      <Zebu x={440} y={-2} s={0.96} step={step + 0.6} c="#857664" shade="#5a4c3c" far="#5a4c3c" />
      <path d="M 186 -146 L 520 -214" stroke={WOOD_DARK} strokeWidth={9} strokeLinecap="round" />
      <Zebu x={420} y={0} s={1} step={step} c="#a89884" shade="#6e604e" far="#6e604e" bell />
    </g>
  );
};

const J3Land: React.FC<{ f: number; t: number; u: number }> = ({ f, t, u }) => {
  const open = smooth((u - 0.1) / 0.75);
  const off = V * J3_K * t * 0.3;
  return (
    <g>
      <rect x={PLANE_L} y={640} width={PLANE_R - PLANE_L} height={700} fill={mix("#748a5e", "#86a35a", open)} />
      <g transform={`translate(${f1(-wrap(off, 0, 520))}, 0)`}>
        <path d={scallop(83, 560, 36, 100, 660)} fill={mix("#566c50", "#4f7446", open)} />
        {[60, 580, 1100, 1620, 2140].map((x, i) => (
          <FarPalm key={i} x={x} y={600} h={200} c={mix("#4a5e46", "#3f5e37", open)} />
        ))}
      </g>
    </g>
  );
};

/** The road the cart rides on, sliding past at the cart's pace (with a near verge below it). */
const J3Road: React.FC<{ t: number }> = ({ t }) => {
  const off = V * J3_K * t;
  return (
    <g>
      <rect x={PLANE_L} y={J3_Y0 - 34} width={PLANE_R - PLANE_L} height={70} fill="#9a7c58" />
      <rect x={PLANE_L} y={J3_Y0 - 36} width={PLANE_R - PLANE_L} height={4} fill="#c4a476" opacity={0.8} />
      <rect x={PLANE_L} y={J3_Y0 + 8} width={PLANE_R - PLANE_L} height={5} fill="#7a5e40" opacity={0.6} />
      {J2_STONES.map((s, i) => (
        <ellipse key={i} cx={wrap(s.x - off, -200, 2600)} cy={J3_Y0 - 24 + ((s.y - J2_Y0) / 230) * 54} rx={s.r * 0.4} ry={s.r * 0.18} fill={s.light ? "#c8b08a" : "#5a4430"} opacity={0.8} />
      ))}
      {J2_PUDDLES.map((p, i) => (
        <ellipse key={`p${i}`} cx={wrap(p.x * 1.3 - off, -400, 3000)} cy={J3_Y0 - 6 + i * 4} rx={p.w * 0.35} ry={5} fill="#b8c2c4" opacity={0.65} />
      ))}
      <rect x={PLANE_L} y={J3_Y0 + 36} width={PLANE_R - PLANE_L} height={400} fill="#5f7a42" />
    </g>
  );
};

const ShotJ3: React.FC<{ f: number; t: number; len: number }> = ({ f, t, len }) => {
  const u = t / len;
  const open = smooth((u - 0.1) / 0.75);
  return (
    <Stage cam={{ x: 0, y: 0, zoom: 1, focus: 1, dof: 1.4 }} background="#9ba7ae">
      <J3Defs />
      <Layer depth={0.15}>
        <J3Sky f={f} u={u} />
      </Layer>
      <Layer depth={0.4} extraBlur={2}>
        <J3Land f={f} t={t} u={u} />
      </Layer>
      <Layer depth={1}>
        <DivineDefs />
        <J3Road t={t} />
        <FamilyCart
          id="j3"
          f={f}
          life={f}
          x={J3_X0}
          y={J3_Y0}
          k={J3_K}
          road={0.5}
          bells={3}
          cartOnly
          light={{ keySide: 1, rim: "#ffe0a0", rimStrength: 0.3 + 0.3 * open }}
          baby={{ gaze: 0.2, lookY: -0.4, smile: 0.45, aura: 0.8 }}
        />
      </Layer>
      {/* the first sun warming the bullock from behind (a soft screen wash from the sun's side) */}
      <Layer depth={1} blend="screen" opacity={open * 0.55}>
        <rect x={PLANE_L} y={-300} width={PLANE_R - PLANE_L} height={1700} fill="url(#j3-sun)" opacity={0.5} />
      </Layer>
      <Grade warmth={0.08 + 0.22 * open} vignette={0.5} tint="#5a6a7c" tintAmount={0.12 * (1 - open)} grain={0.05} bloomAt={[80, 18]} />
    </Stage>
  );
};

/* ================================================================== */
/* J4: medium close-up, Balak in Charu's lap gazing at the sky         */
/* ================================================================== */

/** Charu's figure scale in this shot and her place (feet line) on screen. */
const J4_S = 3.0;
const J4_PLACE: Place = { x: 900, y: 860, s: J4_S };
/** The cart's own scale here (Charu rides at RIDER_S.charu of it): deck and rail are drawn to it. */
const J4_K = J4_S / RIDER_S.charu;
const J4_DECK = J4_PLACE.y - (SEAT_Y - -150) * J4_K;
/** Charu's body in the close-up: turned a little more toward us than on the wides. */
const J4_BODY: Partial<Pose> = { bodyTurn: 0.8, lean: 0 };

const J4Defs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <linearGradient id="j4-sky" x1="0" y1="-300" x2="0" y2="760" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7fa8d2" />
        <stop offset="55%" stopColor="#c6d6dc" />
        <stop offset="100%" stopColor="#f6dfab" />
      </linearGradient>
      <radialGradient id="j4-sun" cx="1900" cy="120" r="1100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff2c8" stopOpacity={0.95} />
        <stop offset="25%" stopColor="#ffd98e" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#ffd98e" stopOpacity={0} />
      </radialGradient>
      <filter id="j4-cloud" x="-30%" y="-60%" width="160%" height="220%">
        <feGaussianBlur stdDeviation={10} />
      </filter>
    </defs>
  </svg>
);

const J4Sky: React.FC<{ f: number; t: number }> = ({ f, t }) => (
  <g>
    <rect x={PLANE_L} y={-400} width={PLANE_R - PLANE_L} height={1300} fill="url(#j4-sky)" />
    <rect x={PLANE_L} y={-400} width={PLANE_R - PLANE_L} height={1300} fill="url(#j4-sun)" />
    <g filter="url(#j4-cloud)">
      {[
        [300, 120, 260, 44],
        [820, 60, 320, 50],
        [1500, 210, 280, 40],
        [1180, 340, 220, 30],
        [-60, 300, 240, 36],
      ].map(([cx, cy, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={cx - t * 0.6} cy={cy} rx={rx} ry={ry} fill="#fbf4e2" opacity={0.85} />
          <ellipse cx={cx - t * 0.6 + rx * 0.2} cy={cy + ry * 0.4} rx={rx * 0.8} ry={ry * 0.5} fill="#f2cf94" opacity={0.6} />
        </g>
      ))}
    </g>
  </g>
);

/** The golden land sliding past behind the cart: paddy, a tree line, palms. */
const J4Land: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const off = V * J4_K * t * 0.12;
  return (
    <g>
      <rect x={PLANE_L} y={640} width={PLANE_R - PLANE_L} height={700} fill="#9aaa5a" />
      <g transform={`translate(${f1(-wrap(off, 0, 640))}, 0)`}>
        <path d={scallop(97, 560, 36, 120, 660)} fill="#5f7a42" />
        {[40, 680, 1320, 1960, 2600].map((x, i) => (
          <FarPalm key={i} x={x} y={600} h={260} c="#4b6436" />
        ))}
      </g>
      <rect x={PLANE_L} y={650} width={PLANE_R - PLANE_L} height={20} fill="#c8b870" opacity={0.6} />
    </g>
  );
};

/** Birds crossing the sky above her, left to right, high: the flight his gaze follows. */
const J4_BIRDS = Array.from({ length: 5 }, (_, i) => ({ dx: i * 70 + rnd(i + 301) * 50, dy: rnd(i + 303) * 60 + (i % 2) * 30, s: 1.4 + rnd(i + 307) * 0.5, ph: rnd(i + 311) * 6 }));

/** The cart around her: the canopy's bamboo hoop and cloth at the back, the side rail and the deck. */
const J4Cart: React.FC<{ t: number }> = ({ t }) => {
  const K = J4_K;
  const jolt = 0;
  const hoopX = J4_PLACE.x - 175 * K;
  return (
    <g transform={`translate(0, ${jolt})`}>
      {/* canopy cloth hanging at the back of the cart (left), on its bamboo hoop */}
      <path
        d={`M ${hoopX - 160} ${J4_DECK} L ${hoopX - 160} ${J4_DECK - 760} Q ${hoopX + 60} ${J4_DECK - 860} ${hoopX + 130} ${J4_DECK - 720} Q ${hoopX + 60} ${J4_DECK - 360} ${hoopX + 40} ${J4_DECK} Z`}
        fill="#c9b48a"
        opacity={0.95}
      />
      <path d={`M ${hoopX + 120} ${J4_DECK - 700} Q ${hoopX + 50} ${J4_DECK - 360} ${hoopX + 34} ${J4_DECK}`} stroke="#8a6a3a" strokeWidth={18} fill="none" strokeLinecap="round" />
      <path d={`M ${hoopX + 110} ${J4_DECK - 690} Q ${hoopX + 42} ${J4_DECK - 360} ${hoopX + 28} ${J4_DECK}`} stroke="#b8945a" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
      {[0.2, 0.42, 0.64].map((k, i) => (
        <path key={i} d={`M ${hoopX - 150} ${J4_DECK - 760 * k} Q ${hoopX - 40} ${J4_DECK - 770 * k - 30} ${hoopX + 70 - 30 * k} ${J4_DECK - 740 * k}`} stroke="#a8946a" strokeWidth={3} fill="none" opacity={0.5} />
      ))}
      {/* the side boards and top rail behind her, the deck she sits on */}
      <rect x={PLANE_L} y={J4_DECK - 30 * K} width={PLANE_R - PLANE_L} height={30 * K} fill="#7a4e2a" />
      <rect x={PLANE_L} y={J4_DECK - 38 * K} width={PLANE_R - PLANE_L} height={9 * K} rx={3 * K} fill="#8a6a3a" />
      {[-0.5, -0.2, 0.15, 0.45, 0.8].map((k, i) => (
        <path key={i} d={`M ${J4_PLACE.x + k * 1400} ${J4_DECK - 26 * K} q ${10 * K} ${7 * K} 0 ${14 * K}`} stroke="#4a2c14" strokeWidth={1.2 * K} fill="none" opacity={0.5} />
      ))}
      <rect x={PLANE_L} y={J4_DECK} width={PLANE_R - PLANE_L} height={24 * K} fill="#8a6a3a" />
      <rect x={PLANE_L} y={J4_DECK + 24 * K} width={PLANE_R - PLANE_L} height={600} fill="#4a2c14" />
    </g>
  );
};

/** Charu's head and face in the close-up: she watches the road, then looks down at him and smiles. */
const j4LookKeys = (len: number): PoseKey<Pose>[] => [
  { f: 0, headTurn: 0.1, headTilt: 0, headNod: 0, eyeX: 0.7, eyeY: -0.1, smile: 0.35, brow: 0.35 },
  { f: Math.round(len * 0.22), headTurn: 0.1, headTilt: 1, eyeX: 0.6, eyeY: -0.25, smile: 0.38, in: 10 },
  // she turns her head down to him (starts about 0.3 into the shot)
  { f: Math.round(len * 0.42), headTurn: -0.15, headTilt: 7, headNod: 10, eyeX: -0.3, eyeY: 0.85, smile: 0.55, brow: 0.4, in: 14, ease: "inOut" },
  // and smiles
  { f: Math.round(len * 0.62), smile: 0.78, brow: 0.5, browTilt: 0.15, in: 10, ease: "inOut" },
  { f: len, headTilt: 7, headNod: 10, smile: 0.8, in: 20, ease: "inOut" },
];

const ShotJ4: React.FC<{ f: number; t: number; len: number }> = ({ f, t, len }) => {
  const u = t / len;
  const look = makeActing<Pose>(BASE_POSE, j4LookKeys(len));
  // the push in: one slow move, from just after the cut to just before the next one
  const push = smooth((t - 4) / (len - 10));
  const zoom = 1 + 0.12 * push;
  // keep the space between her face and his face where it is on screen while the camera closes in
  const P = { x: J4_PLACE.x - 40, y: J4_PLACE.y - 120 * J4_S };
  const cam: Cam = { x: P.x - 960 - (P.x - 960) / zoom, y: P.y - 540 - (P.y - 540) / zoom, zoom, focus: 1, dof: 1.4 };
  // birds cross from 0.15 to 0.85 of the shot; his gaze follows them up and across
  const bt = clamp((u - 0.12) / 0.75);
  const birdX = lerp(-150, 2150, bt);
  const gaze = lerp(-0.1, 0.6, smooth((u - 0.15) / 0.65));
  // his light brightens a touch as his mother smiles down at him (a gentle key beat, BAL-11)
  const aura = 0.82 + 0.12 * smooth((u - 0.55) / 0.3);
  return (
    <Stage cam={cam} background="#c6d6dc">
      <J4Defs />
      <Layer depth={0.2}>
        <J4Sky f={f} t={t} />
        {J4_BIRDS.map((b, i) => (
          <Bird key={i} x={birdX - b.dx} y={170 + b.dy - bt * 40} s={b.s} f={f} ph={b.ph} c="#3a3040" op={0.85 * smooth(bt / 0.08) * (1 - smooth((bt - 0.92) / 0.08))} />
        ))}
      </Layer>
      <Layer depth={0.35} extraBlur={3}>
        <J4Land f={f} t={t} />
      </Layer>
      <Layer depth={1}>
        <DivineDefs />
        <J4Cart t={t} />
        <CharuWithBaby
          id="j4-cradle"
          f={f}
          life={f}
          place={J4_PLACE}
          body={J4_BODY}
          look={look}
          baby={{ gaze, lookY: -1, smile: 0.32 + 0.12 * smooth((u - 0.6) / 0.3), aura, headRoll: lerp(-40, -58, smooth((u - 0.1) / 0.6)), turn: 0.3 }}
          light={{ keySide: 1, rim: "#ffc878", rimStrength: 0.6 }}
          lapGlow={0.7}
          halo={aura}
        />
      </Layer>
      <Grade warmth={0.32} vignette={0.5} grain={0.05} bloomAt={[78, 20]} />
    </Stage>
  );
};

/* ================================================================== */
/* J5: wide, the riverside track, country boats on the water           */
/* ================================================================== */

const J5_HZ = 480;
const J5_SUN = { x: 1470, y: 300 };
const j5Track = (x: number) => 800 - (x - 960) * 0.02;
const J5_K = 0.4;
const J5_X0 = 640;

const J5Defs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <linearGradient id="j5-sky" x1="0" y1="-200" x2="0" y2={J5_HZ} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8fa9c6" />
        <stop offset="55%" stopColor="#e2cfa8" />
        <stop offset="100%" stopColor="#f6d898" />
      </linearGradient>
      <radialGradient id="j5-sun" cx={J5_SUN.x} cy={J5_SUN.y} r="620" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff0c4" stopOpacity={0.95} />
        <stop offset="18%" stopColor="#ffd68a" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#ffd68a" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="j5-water" x1="0" y1={J5_HZ} x2="0" y2="740" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f2d49c" />
        <stop offset="45%" stopColor="#b9a68e" />
        <stop offset="100%" stopColor="#6e7c80" />
      </linearGradient>
      <linearGradient id="j5-bank" x1="0" y1="700" x2="0" y2="1100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8f9a52" />
        <stop offset="100%" stopColor="#4c6030" />
      </linearGradient>
      <filter id="j5-soft" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation={6} />
      </filter>
    </defs>
  </svg>
);

const J5Sky: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={PLANE_L} y={-300} width={PLANE_R - PLANE_L} height={J5_HZ + 320} fill="url(#j5-sky)" />
    <rect x={PLANE_L} y={-300} width={PLANE_R - PLANE_L} height={J5_HZ + 320} fill="url(#j5-sun)" />
    <g filter="url(#j5-soft)">
      {[
        [300, 150, 260, 14],
        [760, 230, 200, 10],
        [1200, 120, 300, 16],
        [1800, 210, 240, 12],
      ].map(([cx, cy, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={cx + f * 0.1} cy={cy - ry * 0.4} rx={rx} ry={ry} fill="#b6a6b0" opacity={0.35} />
          <ellipse cx={cx + f * 0.1 + 10} cy={cy + ry * 0.4} rx={rx * 0.9} ry={ry * 0.8} fill="#ffdca0" opacity={0.6} />
        </g>
      ))}
    </g>
    <circle cx={J5_SUN.x} cy={J5_SUN.y} r={44} fill="#fff6dc" opacity={0.9} />
  </g>
);

const J5_BOATS = [
  { x: 360, y: 640, s: 0.62, ph: 0.3, sail: false, v: 0.5 },
  { x: 1180, y: 560, s: 0.4, ph: 1.7, sail: true, v: 0.25 },
  { x: 1620, y: 680, s: 0.72, ph: 2.6, sail: false, v: -0.3 },
  { x: 820, y: 530, s: 0.28, ph: 3.3, sail: true, v: 0.15 },
];

const J5Land: React.FC<{ f: number; t: number }> = ({ f, t }) => (
  <g>
    {/* the far bank: a tree line with palms, a few huts */}
    <path d={scallop(131, J5_HZ - 54, 26, 70, J5_HZ + 8)} fill="#7f8f78" />
    {[120, 430, 760, 1080, 1720, 2030].map((x, i) => (
      <FarPalm key={i} x={x} y={J5_HZ - 22} h={80 + (i % 3) * 18} c="#6c7c62" />
    ))}
    <path d={scallop(151, J5_HZ - 26, 18, 56, J5_HZ + 8)} fill="#5f7454" />
    {[560, 610, 1900].map((x, i) => (
      <Hut key={i} x={x} y={J5_HZ + 4} w={34} h={30} wall="#c8a07a" roof="#b08440" />
    ))}
    {/* the river, the sky in the water, sun glitter under the sun */}
    <rect x={PLANE_L} y={J5_HZ} width={PLANE_R - PLANE_L} height={260} fill="url(#j5-water)" />
    <rect x={PLANE_L} y={J5_HZ} width={PLANE_R - PLANE_L} height={10} fill="#3e5040" opacity={0.35} />
    {Array.from({ length: 18 }, (_, i) => {
      const y = J5_HZ + 8 + i * i * 0.7 + i * 6;
      const half = 30 + i * 9;
      const cx = J5_SUN.x + Math.sin(f * 0.07 + i * 2.1) * (8 + i);
      return <line key={i} x1={cx - half} y1={y} x2={cx + half} y2={y} stroke="#fff2c8" strokeWidth={1.4 + i * 0.15} strokeLinecap="round" opacity={(0.7 - i * 0.03) * (0.75 + 0.25 * Math.sin(f * 0.11 + i))} />;
    })}
    {Array.from({ length: 22 }, (_, i) => {
      const y = J5_HZ + 20 + rnd(i + 71) * 220;
      const x = rnd(i + 73) * 2200 - 100 + Math.sin(f * 0.03 + i) * 10;
      const w = 40 + rnd(i + 79) * 120;
      return <line key={`r${i}`} x1={x - w} y1={y} x2={x + w} y2={y} stroke="#f0e2c6" strokeWidth={1.6} opacity={0.25} strokeLinecap="round" />;
    })}
    {J5_BOATS.map((b, i) => (
      <Nouka key={i} x={b.x + b.v * t} y={b.y} s={b.s} f={f} ph={b.ph} sail={b.sail} />
    ))}
    {/* the near bank: reeds at the water's edge, the grassy bank and the sandy track */}
    <path d={`M ${PLANE_L} 722 Q 600 706 1100 716 T ${PLANE_R} 712 L ${PLANE_R} 1300 L ${PLANE_L} 1300 Z`} fill="url(#j5-bank)" />
    {Array.from({ length: 80 }, (_, i) => {
      const x = PLANE_L + i * 36 + rnd(i * 3 + 91) * 20;
      const h = 30 + rnd(i * 5 + 93) * 50;
      const sw = Math.sin(f * 0.06 + i * 0.7) * 3;
      return <path key={i} d={`M ${f1(x)} 726 q ${f1(sw)} ${f1(-h * 0.6)} ${f1(sw * 2 + 4)} ${f1(-h)}`} stroke={i % 3 ? "#6e7c3a" : "#8a9446"} strokeWidth={3} fill="none" strokeLinecap="round" />;
    })}
    <path d={`M ${PLANE_L} ${f1(j5Track(PLANE_L) - 20)} L ${PLANE_R} ${f1(j5Track(PLANE_R) - 20)} L ${PLANE_R} ${f1(j5Track(PLANE_R) + 18)} L ${PLANE_L} ${f1(j5Track(PLANE_L) + 18)} Z`} fill="#cfae78" />
    <path d={`M ${PLANE_L} ${f1(j5Track(PLANE_L) - 20)} L ${PLANE_R} ${f1(j5Track(PLANE_R) - 20)}`} stroke="#e8cc98" strokeWidth={3} opacity={0.8} />
    <path d={`M ${PLANE_L} ${f1(j5Track(PLANE_L) + 2)} L ${PLANE_R} ${f1(j5Track(PLANE_R) + 2)}`} stroke="#a4845a" strokeWidth={4} opacity={0.5} />
    {/* a big tree at the left framing the view, lit gold on its sun side */}
    <Tree x={120} y={j5Track(120) - 8} r={190} c="#3a5232" rim="#e2b466" lit={1} />
  </g>
);

const ShotJ5: React.FC<{ f: number; t: number; len: number }> = ({ f, t }) => {
  const cartX = J5_X0 + J5_K * V * t;
  return (
    <Stage cam={{ x: 0, y: 0, zoom: 1, focus: 1, dof: 0.6 }} background="#e2cfa8">
      <J5Defs />
      <Layer depth={0.2}>
        <J5Sky f={f} />
      </Layer>
      <Layer depth={1}>
        <DivineDefs />
        <J5Land f={f} t={t} />
        <FamilyCart
          id="j5"
          f={f}
          life={f}
          x={cartX}
          y={j5Track(cartX)}
          k={J5_K}
          road={0.6}
          dust={0.4}
          light={{ keySide: 1, rim: "#ffc070", rimStrength: 0.6 }}
          baby={{ gaze: 0.3, lookY: -0.5, smile: 0.5, aura: 0.85 }}
        />
      </Layer>
      <Layer depth={1.3} extraBlur={4}>
        <J1Verge f={f} />
      </Layer>
      <Grade warmth={0.38} vignette={0.5} grain={0.05} bloomAt={[76, 28]} />
    </Stage>
  );
};

/* ================================================================== */
/* J6: wide, a little high: the bend, and Ujanchar in the distance     */
/* ================================================================== */

const J6_HZ = 455;
/** The low dusk sun, setting toward the far forest beyond the village (the palette of 02a's wide). */
const J6_SUN = { x: 1180, y: 380 };
/** The road: in from the lower left, round the bend and away toward the village (quadratic). */
const J6_P0 = { x: -260, y: 960 };
const J6_C = { x: 980, y: 900 };
const J6_P2 = { x: 1200, y: 534 };
const j6Pt = (s: number) => {
  const v = 1 - s;
  return { x: v * v * J6_P0.x + 2 * v * s * J6_C.x + s * s * J6_P2.x, y: v * v * J6_P0.y + 2 * v * s * J6_C.y + s * s * J6_P2.y };
};
const J6_ROAD = Array.from({ length: 41 }, (_, i) => j6Pt(i / 40));
/** Road half-width at parameter s (narrower as it goes away). */
const j6HW = (s: number) => 70 - 52 * s;
const J6_ROAD_D = (() => {
  const side = (sd: number) =>
    J6_ROAD.map((p, i) => {
      const s = i / 40;
      const q = j6Pt(Math.min(1, s + 0.01));
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      const hw = j6HW(s) * sd;
      return `${f1(p.x - Math.sin(ang) * hw)} ${f1(p.y + Math.cos(ang) * hw * 0.55)}`;
    });
  const a = side(1);
  const b = side(-1).reverse();
  return `M ${a.join(" L ")} L ${b.join(" L ")} Z`;
})();

const J6Defs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <linearGradient id="j6-sky" x1="0" y1="-320" x2="0" y2={J6_HZ + 20} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2f3f6e" />
        <stop offset="26%" stopColor="#5e6a9a" />
        <stop offset="50%" stopColor="#c99a8e" />
        <stop offset="68%" stopColor="#f0b872" />
        <stop offset="84%" stopColor="#f8d48a" />
        <stop offset="100%" stopColor="#fbe6b0" />
      </linearGradient>
      <radialGradient id="j6-sun" cx={J6_SUN.x} cy={J6_SUN.y} r="720" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff0c0" stopOpacity={0.9} />
        <stop offset="12%" stopColor="#ffd98a" stopOpacity={0.7} />
        <stop offset="40%" stopColor="#f3ad62" stopOpacity={0.28} />
        <stop offset="100%" stopColor="#f3ad62" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="j6-ground" x1="0" y1={J6_HZ} x2="0" y2="1100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8a8c4c" />
        <stop offset="25%" stopColor="#7f8a46" />
        <stop offset="60%" stopColor="#56703a" />
        <stop offset="100%" stopColor="#2f4826" />
      </linearGradient>
      <linearGradient id="j6-mist" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbe6c4" stopOpacity={0} />
        <stop offset="50%" stopColor="#fbe6c4" stopOpacity={0.6} />
        <stop offset="100%" stopColor="#fbe6c4" stopOpacity={0} />
      </linearGradient>
      <filter id="j6-soft" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation={4} />
      </filter>
      <filter id="j6-smoke" x="-100%" y="-50%" width="300%" height="200%">
        <feGaussianBlur stdDeviation={5} />
      </filter>
    </defs>
  </svg>
);

const J6Sky: React.FC = () => (
  <g>
    <rect x={PLANE_L} y={-320} width={PLANE_R - PLANE_L} height={J6_HZ + 360} fill="url(#j6-sky)" />
    <rect x={PLANE_L} y={-320} width={PLANE_R - PLANE_L} height={J6_HZ + 360} fill="url(#j6-sun)" />
    <g filter="url(#j6-soft)">
      {[
        [380, 200, 280, 13],
        [700, 262, 190, 9],
        [1500, 170, 320, 15],
        [1760, 240, 210, 10],
        [220, 300, 160, 8],
      ].map(([cx, cy, rx, ry], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy - ry * 0.5} rx={rx} ry={ry} fill="#a88aa4" opacity={0.35} />
          <ellipse cx={cx + 10} cy={cy + ry * 0.4} rx={rx * 0.92} ry={ry * 0.8} fill="#ffd29a" opacity={0.6} />
        </g>
      ))}
    </g>
    <circle cx={J6_SUN.x} cy={J6_SUN.y} r={90} fill="#ffe7a8" opacity={0.45} filter="url(#j6-soft)" />
    <circle cx={J6_SUN.x} cy={J6_SUN.y} r={36} fill="#fff4d2" />
  </g>
);

/** Huts of the distant village among its trees: (x, y, w). */
const J6_HUTS: Array<[number, number, number]> = [
  [1070, 524, 44],
  [1128, 534, 52],
  [1190, 520, 38],
  [1262, 536, 54],
  [1336, 526, 44],
  [1404, 536, 48],
  [1458, 524, 38],
];

const J6Land: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {/* the far forest ring, palest at the back, mist lying between the lines */}
    <path d={scallop(211, J6_HZ - 58, 22, 64, J6_HZ + 30)} fill="#a6b8bb" />
    <rect x={PLANE_L} y={J6_HZ - 30} width={PLANE_R - PLANE_L} height={40} fill="url(#j6-mist)" />
    <path d={scallop(233, J6_HZ - 34, 22, 56, J6_HZ + 30)} fill="#83a09b" />
    {[200, 620, 980, 1560, 1840].map((x, i) => (
      <FarPalm key={i} x={x} y={J6_HZ - 22} h={56 + (i % 3) * 12} c="#7d9894" />
    ))}
    <path d={scallop(257, J6_HZ - 12, 20, 48, J6_HZ + 30)} fill="#62847a" />
    <rect x={PLANE_L} y={J6_HZ} width={PLANE_R - PLANE_L} height={1300 - J6_HZ} fill="url(#j6-ground)" />
    {/* the river glinting away to the left in the distance, under the far forest */}
    <path d={`M ${PLANE_L} ${J6_HZ + 4} Q 300 ${J6_HZ + 1} 820 ${J6_HZ + 7} Q 400 ${J6_HZ + 15} ${PLANE_L} ${J6_HZ + 20} Z`} fill="#f8dca4" opacity={0.8} />
    {/* the fields: golden green, with paddy dikes across */}
    {Array.from({ length: 8 }, (_, i) => {
      const y = J6_HZ + 70 + Math.pow(i + 1, 1.6) * 16;
      return <path key={i} d={`M ${PLANE_L} ${f1(y)} Q 960 ${f1(y - 10 - i * 2)} ${PLANE_R} ${f1(y + 6)}`} stroke="#b4b06a" strokeWidth={2 + i * 0.8} fill="none" opacity={0.4} />;
    })}
    {/* the road round the bend, running on into the village (its far end goes in under the village trees) */}
    <path d={J6_ROAD_D} fill="#c9a673" />
    <path d={J6_ROAD_D} fill="none" stroke="#e8cc98" strokeWidth={2} opacity={0.6} />
    {/* Ujanchar: the village ringed by its jungle, in the distance (no name board) */}
    <g>
      {/* the jungle ring behind and around the huts */}
      {Array.from({ length: 22 }, (_, i) => {
        const x = 930 + i * 30 + rnd(i + 401) * 14;
        const y = 506 + rnd(i + 403) * 14;
        const r = 18 + rnd(i + 407) * 14;
        return <Tree key={i} x={x} y={y} r={r} c={i % 2 ? "#3c5a3a" : "#456442"} rim="#e8b868" lit={1} trunk="#3a2a1c" />;
      })}
      {J6_HUTS.map(([x, y, w], i) => (
        <Hut key={i} x={x} y={y} w={w} h={w * 0.8} wall="#d0a27a" roof="#c08a44" />
      ))}
      {/* the small temple spire */}
      <path d="M 1272 512 L 1300 512 L 1292 470 L 1286 452 L 1280 470 Z" fill="#c8945a" />
      {[1000, 1150, 1360, 1520].map((x, i) => (
        <FarPalm key={i} x={x} y={526} h={74 + (i % 2) * 20} c="#2f4a30" sway={Math.sin(f * 0.04 + i) * 1.2} />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const x = 900 + i * 52 + rnd(i + 431) * 20;
        const y = 534 + rnd(i + 433) * 10;
        // the near row stays low and keeps out of the huts' fronts, so the village reads
        if (x > 1040 && x < 1470) return null;
        return <Tree key={`n${i}`} x={x} y={y} r={14 + rnd(i + 437) * 10} c="#34503a" rim="#e0ac5c" trunk="#2a2018" />;
      })}
      {/* evening smoke rising from the huts */}
      <g filter="url(#j6-smoke)">
        {[1110, 1240, 1380].map((x, i) => (
          <path
            key={i}
            d={`M ${x} 500 q ${f1(8 + Math.sin(f * 0.05 + i) * 4)} -30 ${f1(-4 + Math.sin(f * 0.04 + i) * 6)} -60 q -10 -30 ${f1(6 + Math.sin(f * 0.03 + i) * 8)} -60`}
            stroke="#e8dccc"
            strokeWidth={8}
            fill="none"
            opacity={0.35}
          />
        ))}
      </g>
    </g>
    {/* trees at the bend, lit gold on the sun side */}
    <Tree x={1640} y={820} r={150} c="#33502f" rim="#e8b45e" lit={-1} />
    <Tree x={260} y={700} r={90} c="#3a5634" rim="#e8b45e" lit={1} />
    <FarPalm x={1760} y={760} h={360} c="#2c4228" sway={Math.sin(f * 0.035) * 3} />
  </g>
);

/** Birds flying home toward the far forest. */
const J6_BIRDS = Array.from({ length: 6 }, (_, i) => ({ x0: 200 + i * 80 + rnd(i + 501) * 100, y0: 150 + rnd(i + 503) * 110, s: 1 + rnd(i + 507) * 0.4, ph: rnd(i + 509) * 6 }));

const ShotJ6: React.FC<{ f: number; t: number; len: number }> = ({ f, t, len }) => {
  // the cart rounds the bend: along the road from s0, slowing a little as it turns away toward the village
  const s = 0.36 + 0.0028 * t;
  const p = j6Pt(Math.min(0.62, s));
  const q = j6Pt(Math.min(0.63, s + 0.01));
  const slope = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
  const k = 0.36 - 0.12 * (Math.min(0.62, s) - 0.36);
  // the light deepens toward the dusk of 02a's wide over the shot
  const dusk = clamp(t / Math.max(1, len));
  return (
    <Stage cam={{ x: 0, y: 0, zoom: 1, focus: 1, dof: 0.6 }} background="#c99a8e">
      <J6Defs />
      <Layer depth={0.2}>
        <J6Sky />
        {J6_BIRDS.map((b, i) => (
          <Bird key={i} x={b.x0 + t * 3.2} y={b.y0 + t * 1.2} s={b.s} f={f} ph={b.ph} c="#3a2a3a" op={0.8} />
        ))}
      </Layer>
      <Layer depth={1}>
        <DivineDefs />
        <J6Land f={f} />
        <FamilyCart
          id="j6"
          f={f}
          life={f}
          x={p.x}
          y={p.y + 8}
          k={k}
          rot={clamp(slope * 0.25, -6, 6)}
          road={0.5}
          dust={0.35}
          light={{ keySide: 1, rim: "#ffb860", rimStrength: 0.65 }}
          baby={{ gaze: 0.4, lookY: -0.3, smile: 0.5, aura: 0.85 }}
        />
      </Layer>
      <Grade warmth={0.36 + 0.06 * dusk} vignette={0.52} grain={0.05} bloomAt={[61, 35]} tint="#7a4a5a" tintAmount={0.06 * dusk} />
    </Stage>
  );
};

/* ================================================================== */
/* The scene                                                           */
/* ================================================================== */

export const Scene02a0Journey: React.FC = () => {
  const f = useCurrentFrame();
  const i = shotOf(f);
  const t = f - CUT[i];
  const len = CUT[i + 1] - CUT[i];
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#1a1820" }}>
      {i === 0 && <ShotJ1 f={f} t={t} len={len} />}
      {i === 1 && <ShotJ2 f={f} t={t} len={len} />}
      {i === 2 && <ShotJ3 f={f} t={t} len={len} />}
      {i === 3 && <ShotJ4 f={f} t={t} len={len} />}
      {i === 4 && <ShotJ5 f={f} t={t} len={len} />}
      {i === 5 && <ShotJ6 f={f} t={t} len={len} />}
    </div>
  );
};

export default Scene02a0Journey;
