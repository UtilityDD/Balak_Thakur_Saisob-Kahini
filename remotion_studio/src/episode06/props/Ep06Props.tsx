import React, { useId } from "react";
import { BN_FONT } from "../../cinematic/fonts";
import { clamp, EASE, hash } from "../../cinematic/core/anim";

/**
 * Episode 6 props (plan "Props", STO-21): painted SVG props in the Ujanchar style (flat borderless fills, soft form
 * shading, light from the upper left, a soft brown contact shadow). No glow on any prop (BAL-05).
 *
 * SCALE: every prop is drawn in CENTIMETRES and placed with `s`. At s = 1 one centimetre is PROP_CM (2.0) world px,
 * matched to the hand of the standing child (src/episode05/rig/StandingChild.tsx) at its scene scale s = 0.56
 * (RIG-EP05-02): the rig's hand is about 22 px from wrist to fingertip and its palm about 13 px wide, a six-year-old's
 * 11 to 12 cm and 6 cm. So with Balak at s = 0.56 the props take s = 1; with Balak at another scale S, use s = S / 0.56.
 * PROP_SIZE gives each prop's natural size in px at s = 1.
 *
 * COMMON PROPS: x, y = the prop's anchor in world px (stated per prop: the ground contact for things that rest, the
 * grip for things held); s = scale; rot = screen rotation in degrees about (x, y). Flat things that lie on the ground
 * also take `tilt` (the ground plane's vertical foreshortening: 1 = seen face-on, GROUND_TILT 0.38 = lying on the
 * ground as the Ujanchar camera sees it) and `yaw` (rotation within the ground plane, degrees).
 * No prop runs its own clock; anything that moves takes a value (spin, squash, bend, lidOpen, fill) from the scene.
 * Only the gamchha takes an optional `lifeF` (its fringe stirs in the breeze, PIT-03).
 *
 * ANCHORS: each prop has a `<name>Anchors(props)` (or spot) helper returning WORLD points (after x, y, s, rot, tilt,
 * yaw), so a rig's hand targets can follow the prop every frame (MOT-07).
 *
 *  KhadamOne / KhadamPair   the father's wooden khadam, the exact look of Episode 5's glimpse (Scene99, KhadamOne):
 *                           x, y = the pair's centre on the ground. Episode 5's glimpse pair = s 0.575 here.
 *  BrassThali               an empty brass plate lying on the floor; x, y = its centre on the floor; `seed` varies
 *                           the dent and shine so two plates differ.
 *  Slate                    a school slate in a wooden frame with a few chalk marks; x, y = its centre; tilt / yaw to
 *                           lie on the ground, `turnY` 0..1 to turn it edge-on (carried under an arm).
 *  StitchedBall             a worn cloth-and-rubber ball with a crude zigzag seam of thick thread; x, y = the ground
 *                           contact (bottom of the ball); `squash` 0..1 (0.3 to 0.4 = the soft, slightly squashed
 *                           ball; 1 = the hardest squash of a bounce), `spin` degrees (rolling), `air` cm above
 *                           the ground (bounce, toss: the shadow stays down and fades).
 *  Marble / MarbleHeap      glass marbles with coloured swirls; x, y = ground contact (single) / heap centre.
 *  Top                      the wooden লাট্টু with a nail tip and painted bands; x, y = the ground contact; `lying`,
 *                           `string` "wound" | "coiled" | "none", `spin` degrees (the painted stripes turn).
 *  CopperCoin / CopperCoins small worn copper coins (no real design); x, y = centre on the ground / of the group.
 *  FoldedShirt              a folded cotton shirt lying on the ground; x, y = its centre.
 *  Gamchha                  a checked gamchha spread on the ground (red or green check), x, y = its centre;
 *                           gamchhaSpot(props, u, v) maps cloth coordinates 0..1 to world, GAMCHHA_HEAPS suggests
 *                           spots for the small heaps.
 *  TenRupeeNote             a generic large old note (pale blue-grey, printed border, medallion, "১০" in Baloo Da 2;
 *                           no real currency design, no portrait, no real text). state "flat" | "folded" (in four,
 *                           what changes hands) | "held" (bend 0..1, hold "both" = held by both ends and sagging,
 *                           "one" = held at the left end and drooping). x, y = centre (flat, folded), and for held
 *                           the midpoint between the two grips (both) or the left grip (one).
 *  SilverCoin / TwoAnnas    two small silver coins: arrangement "single" | "pair" | "stacked" | "palm" (lying on an
 *                           open palm: just the coins, the palm is the rig's; x, y = the palm centre).
 *  LozengeJar               a glass jar with a turned wooden lid, full of round marble-lozenges; x, y = the base
 *                           contact; `lidOpen` 0..1 (lifted by its knob and swung back), `fill` 0..1.
 *  Lozenge                  one round lozenge, x, y = its centre (it is mostly held); color red | yellow | green | white.
 *  PaperTwist               a ঠোঙা (a cone of old newsprint-like paper, no legible text) with lozenges peeping out;
 *                           x, y = the grip (where the hand holds the cone); `fill` 0..1.
 */

/* ------------------------------------------------------------------ */
/* Scale, shared helpers                                                */
/* ------------------------------------------------------------------ */

/** World px per centimetre at s = 1 (matched to StandingChild's hand at s 0.56). */
export const PROP_CM = 2.0;
/** The child scale the props are matched to at s = 1, and that child's hand in world px. */
export const PROP_REF = { childS: 0.56, handLength: 22, palmWidth: 13 };
/** The ground plane's vertical foreshortening as the Ujanchar camera sees it (1 = face-on). */
export const GROUND_TILT = 0.38;

export interface Pt {
  x: number;
  y: number;
}

const SHADOW = "#2a1a0c";
const n2 = (v: number) => v.toFixed(2);
const n3 = (v: number) => v.toFixed(3);
const rad = (d: number) => (d * Math.PI) / 180;
const useUid = () => useId().replace(/[^a-zA-Z0-9_-]/g, "");

/** The placing transform: translate to (x, y), rotate `rot` degrees, scale to centimetres. */
const tf = (x: number, y: number, s: number, rot = 0) => `translate(${n2(x)} ${n2(y)}) rotate(${n2(rot)}) scale(${n3(s * PROP_CM)})`;
/** A local (cm) point to world px, matching tf(). */
const place = (p: Pt, x: number, y: number, s: number, rot = 0): Pt => {
  const k = s * PROP_CM;
  const c = Math.cos(rad(rot));
  const sn = Math.sin(rad(rot));
  return { x: x + k * (p.x * c - p.y * sn), y: y + k * (p.x * sn + p.y * c) };
};
/** A point in a flat plane (u across, v down/depth, cm) after its yaw and tilt (as `scale(1 tilt) rotate(yaw)`). */
const plane = (u: number, v: number, yaw: number, tilt: number, sx = 1): Pt => {
  const c = Math.cos(rad(yaw));
  const sn = Math.sin(rad(yaw));
  return { x: (u * c - v * sn) * sx, y: (u * sn + v * c) * tilt };
};
const planeTf = (yaw: number, tilt: number, sx = 1) => `scale(${n3(sx)} ${n3(tilt)}) rotate(${n2(yaw)})`;
/** Visible edge (extrusion) of a slab of thickness th seen at `tilt`. */
const edgeDrop = (th: number, tilt: number) => th * Math.sqrt(Math.max(0, 1 - tilt * tilt));

/** Points along an ellipse arc (degrees, screen convention: 0 = +x, 90 = down). */
const arc = (rx: number, ry: number, a0: number, a1: number, cx = 0, cy = 0, steps = 14) => {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / steps);
    d += `${i ? "L" : "M"} ${n2(cx + rx * Math.cos(a))} ${n2(cy + ry * Math.sin(a))} `;
  }
  return d;
};

/** Shared soft sphere shading (lit upper left, darker lower right), objectBoundingBox. */
const SphereShade: React.FC<{ id: string; dark?: number; light?: number }> = ({ id, dark = 0.42, light = 0.45 }) => (
  <radialGradient id={id} cx="0.36" cy="0.32" r="0.75">
    <stop offset="0" stopColor="#ffffff" stopOpacity={light} />
    <stop offset="0.38" stopColor="#ffffff" stopOpacity={0} />
    <stop offset="0.72" stopColor="#1e140c" stopOpacity={dark * 0.35} />
    <stop offset="1" stopColor="#1e140c" stopOpacity={dark} />
  </radialGradient>
);

/** Natural sizes in world px at s = 1 (width x height as drawn, default views). */
export const PROP_SIZE = {
  khadamPair: { w: 92, h: 30 },
  khadamLength: 52,
  thali: { w: 60, h: 60 * GROUND_TILT + 3 },
  slate: { w: 52, h: 38 },
  ball: { d: 14.4 },
  marble: { d: 3.2 },
  top: { w: 10, h: 12.6 },
  copperCoin: { d: 5 },
  shirt: { w: 48, h: 36 },
  gamchha: { w: 220, h: 120 },
  note: { w: 30, h: 17 },
  noteFolded: { w: 15, h: 8.5 },
  silverCoin: { d: 3.8 },
  jar: { w: 26, h: 47 },
  lozenge: { d: 3 },
  paperTwist: { w: 15, h: 30 },
};

/* ------------------------------------------------------------------ */
/* Khadam (খড়ম): the exact look of Episode 5's glimpse                 */
/* ------------------------------------------------------------------ */

/** Khadam drawing units are centimetres: the sole is 26 cm long (Episode 5's KhadamOne, unchanged). */
const KH = { L: 26, W: 9, T: 3 };

export interface KhadamOneProps {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  /** 0 or 1: the two soles' slightly different wood tone and grain (as Episode 5). */
  seed?: number;
}

/**
 * One wooden khadam: a flat wooden sole seen three-quarter on, with the toe peg (বোল) and its round knob. x, y = the
 * sole's centre on the ground, heel at -x (before rot), toe at +x. Copied from Episode 5's KhadamOne (Scene99) with
 * s re-based to PROP_CM.
 */
export const KhadamOne: React.FC<KhadamOneProps> = ({ x, y, s = 1, rot = 0, seed = 0 }) => {
  const { L, W: Wd, T } = KH;
  const top = `M ${-L / 2} ${-Wd / 2 + 1} Q ${-L / 2 - 2} 0 ${-L / 2} ${Wd / 2 - 1} L ${L / 2 - 3} ${Wd / 2} Q ${L / 2 + 2} 0 ${L / 2 - 3} ${-Wd / 2} Z`;
  const side = `M ${-L / 2} ${Wd / 2 - 1} L ${L / 2 - 3} ${Wd / 2} L ${L / 2 - 3} ${Wd / 2 + T} L ${-L / 2} ${Wd / 2 - 1 + T} Z`;
  const peg = { x: L / 2 - 8, y: 0 };
  return (
    <g transform={`translate(${n2(x)} ${n2(y)}) scale(${n3(s * PROP_CM)}) rotate(${n2(rot)})`}>
      <ellipse cx={1} cy={Wd / 2 + T + 1} rx={L / 2 + 2} ry={2.6} fill="#3a2414" opacity={0.35} />
      <path d={side} fill="#5a3a1e" />
      <path d={top} fill={seed ? "#9a6a3c" : "#94643a"} />
      <path d={`M ${-L / 2 + 3} -1 Q 0 ${-2 + seed} ${L / 2 - 6} -0.5`} stroke="#7a5230" strokeWidth={0.6} fill="none" opacity={0.6} />
      <ellipse cx={-L / 2 + 6} cy={0.5} rx={4} ry={2.2} fill="#7e5430" opacity={0.45} />
      <path d={top} fill="none" stroke="#c89a62" strokeWidth={0.5} opacity={0.35} />
      <rect x={peg.x - 0.9} y={peg.y - 6} width={1.8} height={6} fill="#6a4426" />
      <circle cx={peg.x} cy={peg.y - 7} r={2.2} fill="#8a5a32" />
      <circle cx={peg.x + 0.7} cy={peg.y - 7.7} r={0.9} fill="#e0b274" opacity={0.7} />
    </g>
  );
};

export interface KhadamPairProps {
  x: number;
  y: number;
  s?: number;
  rot?: number;
}

/** The pair's layout, as Episode 5 (offsets in cm): the far sole a little left and higher, toes toward the yard. */
const KHADAM_PAIR = [
  { dx: -9, dy: -1 / 1.15, rot: -8, seed: 0 },
  { dx: 9, dy: 3 / 1.15, rot: -3, seed: 1 },
];

/** The pair set down side by side (Episode 5's Khadam). x, y = the pair's centre on the ground. */
export const KhadamPair: React.FC<KhadamPairProps> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`rotate(${n2(rot)} ${n2(x)} ${n2(y)})`}>
    {KHADAM_PAIR.map((k) => (
      <KhadamOne key={k.seed} x={x + k.dx * s * PROP_CM} y={y + k.dy * s * PROP_CM} s={s} rot={k.rot} seed={k.seed} />
    ))}
  </g>
);

/** World points of one khadam: centre, heel, toe and the peg's knob (where the big toe and second toe grip). */
export const khadamOneAnchors = ({ x, y, s = 1, rot = 0 }: KhadamOneProps) => {
  const p = (lx: number, ly: number) => place({ x: lx, y: ly }, x, y, s, rot);
  return { centre: p(0, 0), heel: p(-KH.L / 2 + 3, 0), toe: p(KH.L / 2 - 3, 0), peg: p(KH.L / 2 - 8, -7) };
};

/** World anchors of the pair: centre, and each sole's khadamOneAnchors (left = the far one, right = the near one). */
export const khadamPairAnchors = ({ x, y, s = 1, rot = 0 }: KhadamPairProps) => {
  const one = (i: number) => {
    const k = KHADAM_PAIR[i];
    const c = place({ x: k.dx, y: k.dy }, x, y, s, rot);
    return khadamOneAnchors({ x: c.x, y: c.y, s, rot: rot + k.rot });
  };
  return { centre: { x, y }, left: one(0), right: one(1) };
};

/* ------------------------------------------------------------------ */
/* Brass thali                                                          */
/* ------------------------------------------------------------------ */

const THALI = { r: 15, ri: 12.6, depth: 1.6 };

export interface BrassThaliProps {
  x: number;
  y: number;
  s?: number;
  tilt?: number;
  seed?: number;
}

/** An empty brass plate (30 cm) lying on the floor. x, y = its centre on the floor. */
export const BrassThali: React.FC<BrassThaliProps> = ({ x, y, s = 1, tilt = GROUND_TILT, seed = 0 }) => {
  const id = useUid();
  const { r, ri } = THALI;
  const ry = r * tilt;
  const riy = ri * tilt;
  const d = edgeDrop(THALI.depth, tilt) + 0.25;
  const well = 0.8 * (1 - tilt) + 0.25; // the far inner wall shows as a dark crescent
  const hx = -3 + 2 * hash(seed + 3);
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <radialGradient id={`${id}b`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f2cd72" />
          <stop offset="0.45" stopColor="#c99640" />
          <stop offset="1" stopColor="#8e6020" />
        </radialGradient>
        <linearGradient id={`${id}w`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#a07024" />
          <stop offset="0.35" stopColor="#c08a34" />
          <stop offset="1" stopColor="#6e4a14" />
        </linearGradient>
      </defs>
      <ellipse cx={1.2} cy={d + 0.5} rx={r + 1.4} ry={ry + 1.1} fill={SHADOW} opacity={0.28} />
      {/* the plate's outer wall below the rim */}
      <path d={`M ${-r} 0 A ${r} ${n2(ry)} 0 0 0 ${r} 0 L ${r} ${n2(d)} A ${r} ${n2(ry)} 0 0 1 ${-r} ${n2(d)} Z`} fill={`url(#${id}w)`} />
      <ellipse rx={r} ry={ry} fill={`url(#${id}b)`} />
      {/* the well: far inner wall dark, the basin lit */}
      <ellipse rx={ri} ry={riy} fill="#8a5e1e" />
      <ellipse cy={well} rx={ri - 0.2} ry={riy - 0.15} fill={`url(#${id}b)`} />
      <ellipse cy={well} rx={ri * 0.68} ry={riy * 0.68} fill="none" stroke="#f0c878" strokeWidth={0.16} opacity={0.3} />
      <ellipse cy={well} rx={ri * 0.36} ry={riy * 0.36} fill="none" stroke="#7a5218" strokeWidth={0.14} opacity={0.22} />
      {/* the rim catches the light on the upper left, dimmer on the near right */}
      <path d={arc((r + ri) / 2, ((r + ri) / 2) * tilt, 195, 285)} stroke="#fde6a2" strokeWidth={0.7} fill="none" opacity={0.7} strokeLinecap="round" />
      <path d={arc((r + ri) / 2, ((r + ri) / 2) * tilt, 20, 80)} stroke="#e6b45a" strokeWidth={0.5} fill="none" opacity={0.4} strokeLinecap="round" />
      <ellipse cx={hx} cy={well - riy * 0.25} rx={4.2} ry={Math.max(0.5, 3 * tilt)} fill="#fff1c4" opacity={0.33} transform={`rotate(-10 ${n2(hx)} ${n2(well)})`} />
      {/* a small old dent */}
      <path d={arc(ri * 0.55, ri * 0.55 * tilt, 40 + 90 * hash(seed + 9), 75 + 90 * hash(seed + 9), 1, well, 6)} stroke="#6e4a14" strokeWidth={0.35} fill="none" opacity={0.3} strokeLinecap="round" />
    </g>
  );
};

/** World anchors: centre, rim points (left, right, near, far) where hands take the plate. */
export const brassThaliAnchors = ({ x, y, s = 1, tilt = GROUND_TILT }: BrassThaliProps) => {
  const p = (lx: number, ly: number) => place({ x: lx, y: ly }, x, y, s);
  const r = THALI.r;
  return { centre: p(0, 0), rimLeft: p(-r, 0), rimRight: p(r, 0), rimNear: p(0, r * tilt), rimFar: p(0, -r * tilt), radiusPx: r * s * PROP_CM };
};

/* ------------------------------------------------------------------ */
/* Slate                                                                */
/* ------------------------------------------------------------------ */

const SLATE = { w: 26, h: 19, frame: 1.8, th: 1.1 };

export interface SlateProps {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  tilt?: number;
  yaw?: number;
  /** 0 face-on .. 1 edge-on (turned about its vertical axis; carried under an arm). */
  turnY?: number;
  /** Chalk-mark variant (0, 1, 2 ...). */
  seed?: number;
}

const slateSx = (turnY: number) => Math.max(0.06, Math.cos((clamp(turnY) * Math.PI) / 2));

/** A school slate in a wooden frame with a few chalk marks. x, y = its centre. */
export const Slate: React.FC<SlateProps> = ({ x, y, s = 1, rot = 0, tilt = 1, yaw = 0, turnY = 0, seed = 0 }) => {
  const id = useUid();
  const { w, h, frame: fw, th } = SLATE;
  const sx = slateSx(turnY);
  const ex = th * Math.sin((clamp(turnY) * Math.PI) / 2);
  const ey = edgeDrop(th, tilt);
  const pt = planeTf(yaw, tilt, sx);
  const frameRect = <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.9} />;
  const iw = w - 2 * fw;
  const ih = h - 2 * fw;
  // chalk marks: practice loops, a few strokes, a ring and tallies (no real letters)
  const loops = (y0: number, x0: number, n: number, k: number) => {
    let d = `M ${x0} ${y0}`;
    for (let i = 0; i < n; i++) {
      const cx = x0 + 1.4 * i + 0.7;
      d += ` C ${n2(cx - 0.2)} ${n2(y0 - 1.3 - 0.3 * hash(k + i))} ${n2(cx + 0.9)} ${n2(y0 - 1.1)} ${n2(cx + 0.7)} ${n2(y0 + 0.1)}`;
    }
    return d;
  };
  const v = seed % 3;
  return (
    <g transform={tf(x, y, s, rot)}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c99556" />
          <stop offset="0.5" stopColor="#a8743e" />
          <stop offset="1" stopColor="#82552a" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#434c4f" />
          <stop offset="1" stopColor="#2a3032" />
        </linearGradient>
      </defs>
      {tilt < 0.98 && (
        <g transform={`translate(1.4 ${n2(ey + 1)})`} opacity={0.25}>
          <g transform={pt} fill={SHADOW}>
            {frameRect}
          </g>
        </g>
      )}
      {/* the frame's edge (thickness) */}
      <g transform={`translate(${n2(ex)} ${n2(ey)})`}>
        <g transform={pt} fill="#6a4320">
          {frameRect}
        </g>
      </g>
      <g transform={pt}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.9} fill={`url(#${id}f)`} />
        {/* frame grain and the corner mitres */}
        <g stroke="#6e4520" strokeWidth={0.12} opacity={0.4} fill="none">
          <path d={`M ${-w / 2 + 2} ${-h / 2 + 0.6} L ${w / 2 - 3} ${-h / 2 + 0.7} M ${-w / 2 + 4} ${h / 2 - 0.7} L ${w / 2 - 2} ${h / 2 - 0.6}`} />
          <path d={`M ${-w / 2 + 0.6} ${-h / 2 + 3} L ${-w / 2 + 0.7} ${h / 2 - 3} M ${w / 2 - 0.7} ${-h / 2 + 2} L ${w / 2 - 0.6} ${h / 2 - 4}`} />
          {[
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ].map(([a, b]) => (
            <line key={`${a}${b}`} x1={(a * w) / 2} y1={(b * h) / 2} x2={a * (w / 2 - fw)} y2={b * (h / 2 - fw)} />
          ))}
        </g>
        <rect x={-iw / 2} y={-ih / 2} width={iw} height={ih} fill={`url(#${id}s)`} />
        {/* the inner bevel: lit wood edge top-left, shadow on the slate */}
        <path d={`M ${-iw / 2} ${ih / 2} L ${-iw / 2} ${-ih / 2} L ${iw / 2} ${-ih / 2}`} stroke="#1c2022" strokeWidth={0.35} fill="none" opacity={0.55} />
        <path d={`M ${-w / 2 + 0.3} ${h / 2 - 0.5} L ${-w / 2 + 0.3} ${-h / 2 + 0.3} L ${w / 2 - 0.5} ${-h / 2 + 0.3}`} stroke="#e6b878" strokeWidth={0.22} fill="none" opacity={0.55} />
        {/* an old wiped smudge and the chalk */}
        <ellipse cx={-2 + 3 * hash(seed + 1)} cy={1} rx={7} ry={3} fill="#d8d6cc" opacity={0.07} />
        <g stroke="#efebe0" strokeWidth={0.3} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.78}>
          <path d={loops(-3.4 + 0.4 * v, -9.2, 6 - v, seed * 7)} />
          {v !== 1 && <path d={loops(0.6, -9.2, 4, seed * 7 + 20)} />}
          <path d={`M -9 ${3.4 + 0.3 * v} L ${-3 + v} ${3.6 + 0.3 * v}`} opacity={0.7} />
          <circle cx={6.2 - v} cy={-2.6 + v} r={1.6} opacity={0.8} />
          {Array.from({ length: 3 + v }, (_, i) => (
            <line key={i} x1={4.6 + 0.8 * i} y1={2.4} x2={4.4 + 0.8 * i} y2={5} />
          ))}
        </g>
        <path d={`M ${-iw / 2 + 1} ${-ih / 2 + 1} L ${-iw / 2 + 4} ${-ih / 2 + 1}`} stroke="#ffffff" strokeWidth={0.5} opacity={0.08} />
      </g>
    </g>
  );
};

/** World anchors of the slate: centre, edge middles (top = the grip of a hand carrying it), corners. */
export const slateAnchors = ({ x, y, s = 1, rot = 0, tilt = 1, yaw = 0, turnY = 0 }: SlateProps) => {
  const sx = slateSx(turnY);
  const p = (u: number, v: number) => place(plane(u, v, yaw, tilt, sx), x, y, s, rot);
  const { w, h } = SLATE;
  return {
    centre: p(0, 0),
    top: p(0, -h / 2),
    bottom: p(0, h / 2),
    left: p(-w / 2, 0),
    right: p(w / 2, 0),
    corners: [p(-w / 2, -h / 2), p(w / 2, -h / 2), p(w / 2, h / 2), p(-w / 2, h / 2)],
  };
};

/* ------------------------------------------------------------------ */
/* Stitched ball                                                        */
/* ------------------------------------------------------------------ */

const BALL_R = 3.6;

export interface StitchedBallProps {
  x: number;
  y: number;
  s?: number;
  /** 0 round .. 1 the hardest squash of a bounce; 0.3 to 0.4 = the soft, slightly squashed old ball at rest. */
  squash?: number;
  /** Rolling, degrees (the seam turns with it). */
  spin?: number;
  /** Shadow on the ground (off when held). Default true. */
  shadow?: boolean;
  /** Height above the ground in cm (a bounce or a toss): the ball rises, its shadow stays on the ground and fades. */
  air?: number;
}

/** A point on the seam's S-curve (t 0..1). */
const seamAt = (t: number, R: number): Pt => {
  const p0 = { x: -1.2 * R, y: -0.15 * R };
  const p1 = { x: -0.3 * R, y: -1.15 * R };
  const p2 = { x: 0.3 * R, y: 1.15 * R };
  const p3 = { x: 1.2 * R, y: 0.15 * R };
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

/** A worn cloth-and-rubber ball with a crude zigzag seam of thick thread. x, y = ground contact (bottom). */
export const StitchedBall: React.FC<StitchedBallProps> = ({ x, y, s = 1, squash = 0, spin = 0, shadow = true, air = 0 }) => {
  const id = useUid();
  const R = BALL_R;
  const q = clamp(squash);
  const seam = Array.from({ length: 25 }, (_, i) => seamAt(i / 24, R));
  const seamD = seam.map((p, i) => `${i ? "L" : "M"} ${n2(p.x)} ${n2(p.y)}`).join(" ");
  // crude zigzag stitches across the seam, uneven
  let zig = "";
  for (let i = 0; i < 17; i++) {
    const t = 0.06 + (0.88 * i) / 16;
    const a = seamAt(t, R);
    const b = seamAt(t + 0.01, R);
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const amp = (0.5 + 0.25 * hash(i + 3)) * (i % 2 ? 1 : -1);
    zig += `${i ? "L" : "M"} ${n2(a.x + nx * amp)} ${n2(a.y + ny * amp)} `;
  }
  const patchA = `${seamD} L ${1.4 * R} ${-1.4 * R} L ${-1.4 * R} ${-1.4 * R} Z`;
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <clipPath id={`${id}c`}>
          <circle cx={0} cy={0} r={R} />
        </clipPath>
        <SphereShade id={`${id}g`} dark={0.5} light={0.3} />
      </defs>
      {shadow && (
        <ellipse cx={0.6 + 0.08 * air} cy={0.15} rx={(R * (1 + 0.25 * q)) / (1 + 0.04 * air)} ry={0.9 / (1 + 0.04 * air)} fill={SHADOW} opacity={0.32 / (1 + 0.08 * air)} />
      )}
      <g transform={`translate(0 ${n2(-Math.max(0, air))}) scale(${n3(1 + 0.17 * q)} ${n3(1 - 0.26 * q)}) translate(0 ${-R})`}>
        <g clipPath={`url(#${id}c)`}>
          <circle r={R} fill="#b48a4c" />
          <g transform={`rotate(${n2(spin)})`}>
            <path d={patchA} fill="#a5503a" />
            {/* worn spots: the rubber shows through, a frayed patch */}
            <ellipse cx={1.6} cy={1.7} rx={1.1} ry={0.7} fill="#4f4640" transform="rotate(25 1.6 1.7)" />
            <g stroke="#d8c09a" strokeWidth={0.12} opacity={0.6}>
              <line x1={0.6} y1={1.3} x2={0.3} y2={1.0} />
              <line x1={2.6} y1={2.2} x2={2.9} y2={2.5} />
              <line x1={1.1} y1={2.4} x2={0.9} y2={2.8} />
            </g>
            <ellipse cx={-1.8} cy={-1.2} rx={0.9} ry={0.5} fill="#8a3f2c" opacity={0.6} />
            <path d={seamD} stroke="#5e2e1e" strokeWidth={0.32} fill="none" opacity={0.6} />
            {/* the thick thread: its shadow, then the thread */}
            <path d={zig} transform="translate(0.12 0.16)" stroke="#3a2a1e" strokeWidth={0.5} fill="none" opacity={0.45} strokeLinejoin="round" />
            <path d={zig} stroke="#efe3c4" strokeWidth={0.44} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <circle r={R} fill={`url(#${id}g)`} />
        </g>
        {/* fuzz on the worn silhouette */}
        <g stroke="#c9a77a" strokeWidth={0.12} opacity={0.4}>
          <line x1={-R * 0.72} y1={-R * 0.72} x2={-R * 0.8} y2={-R * 0.8} />
          <line x1={R * 0.95} y1={-R * 0.2} x2={R * 1.06} y2={-R * 0.22} />
          <line x1={-R * 0.98} y1={R * 0.1} x2={-R * 1.08} y2={R * 0.12} />
        </g>
      </g>
    </g>
  );
};

/** World anchors of the ball: centre, top, bottom, the two side grips (both hands), radius in px. */
export const stitchedBallAnchors = ({ x, y, s = 1, squash = 0, air = 0 }: StitchedBallProps) => {
  const q = clamp(squash);
  const sx = 1 + 0.17 * q;
  const sy = 1 - 0.26 * q;
  const p = (lx: number, ly: number) => place({ x: lx * sx, y: ly * sy - Math.max(0, air) }, x, y, s);
  const R = BALL_R;
  return { centre: p(0, -R), top: p(0, -2 * R), bottom: p(0, 0), gripL: p(-R, -R), gripR: p(R, -R), radiusPx: R * s * PROP_CM };
};

/* ------------------------------------------------------------------ */
/* Marbles                                                              */
/* ------------------------------------------------------------------ */

const MARBLE_R = 0.8;
const MARBLE_COLS = [
  { glass: "#cfe6ee", swirl: "#2f6fd0" },
  { glass: "#d6eed4", swirl: "#2e9a4a" },
  { glass: "#f3e2c4", swirl: "#d8781e" },
  { glass: "#f2d8d6", swirl: "#c8303a" },
  { glass: "#e6eef2", swirl: "#e8b628" },
];

const MarbleDot: React.FC<{ cx: number; cy: number; c: number; seed: number; spin: number; shade: string; shadow?: boolean }> = ({
  cx,
  cy,
  c,
  seed,
  spin,
  shade,
  shadow = true,
}) => {
  const r = MARBLE_R;
  const col = MARBLE_COLS[((c % MARBLE_COLS.length) + MARBLE_COLS.length) % MARBLE_COLS.length];
  const a = seed * 57 + spin;
  return (
    <g transform={`translate(${n2(cx)} ${n2(cy)})`}>
      {shadow && (
        <>
          <ellipse cx={r * 0.35} cy={0.05} rx={r * 1.05} ry={r * 0.3} fill={SHADOW} opacity={0.3} />
          <ellipse cx={r * 0.75} cy={0.08} rx={r * 0.45} ry={r * 0.13} fill={col.swirl} opacity={0.28} />
        </>
      )}
      <g transform={`translate(0 ${-r})`}>
        <circle r={r} fill={col.glass} opacity={0.92} />
        <g transform={`rotate(${n2(a)})`}>
          <path d={`M ${-0.72 * r} ${0.22 * r} Q 0 ${-0.95 * r} ${0.72 * r} ${-0.12 * r} Q 0 ${-0.25 * r} ${-0.72 * r} ${0.22 * r} Z`} fill={col.swirl} opacity={0.9} />
          <path d={`M ${-0.6 * r} ${-0.3 * r} Q ${0.1 * r} ${0.7 * r} ${0.62 * r} ${0.35 * r}`} stroke={col.swirl} strokeWidth={r * 0.16} fill="none" opacity={0.65} />
        </g>
        <circle r={r} fill={`url(#${shade})`} />
        <circle cx={-0.36 * r} cy={-0.38 * r} r={r * 0.2} fill="#ffffff" opacity={0.92} />
        <circle cx={0.42 * r} cy={0.4 * r} r={r * 0.1} fill="#ffffff" opacity={0.35} />
      </g>
    </g>
  );
};

export interface MarbleProps {
  x: number;
  y: number;
  s?: number;
  /** Colour 0..4: blue, green, amber, red, yellow swirl. */
  color?: number;
  seed?: number;
  /** Rolling, degrees. */
  spin?: number;
  shadow?: boolean;
}

/** One glass marble with a coloured swirl. x, y = ground contact. */
export const Marble: React.FC<MarbleProps> = ({ x, y, s = 1, color = 0, seed = 0, spin = 0, shadow = true }) => {
  const id = useUid();
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <SphereShade id={`${id}g`} dark={0.38} light={0.2} />
      </defs>
      <MarbleDot cx={0} cy={0} c={color} seed={seed} spin={spin} shade={`${id}g`} shadow={shadow} />
    </g>
  );
};

export interface MarbleHeapProps {
  x: number;
  y: number;
  s?: number;
  count?: number;
  seed?: number;
  tilt?: number;
}

/** The heap's marble positions in cm (ground contact of each, already in screen order, back to front). */
const heapLocal = (count: number, seed: number, tilt: number) => {
  const pts: { x: number; y: number; c: number; sd: number }[] = [];
  const base = Math.min(count, Math.max(3, Math.ceil(count * 0.7)));
  for (let i = 0; i < base; i++) {
    const a = i * 2.4 + hash(seed + i) * 0.8;
    const rr = 0.9 * Math.sqrt(i + 0.3) * (i ? 1 : 0.4);
    const g = plane(rr * Math.cos(a), rr * Math.sin(a), 0, tilt);
    pts.push({ x: g.x, y: g.y, c: Math.floor(hash(seed * 3 + i) * 5), sd: i + seed });
  }
  for (let i = base; i < count; i++) {
    const k = i - base;
    pts.push({ x: -0.6 + 1.2 * k + 0.3 * hash(seed + i), y: -1.15 - 0.2 * k, c: Math.floor(hash(seed * 5 + i) * 5), sd: i + seed });
  }
  const top = pts.slice(base);
  return [...pts.slice(0, base).sort((a, b) => a.y - b.y), ...top];
};

/** A little heap of marbles. x, y = the heap's centre on the ground. */
export const MarbleHeap: React.FC<MarbleHeapProps> = ({ x, y, s = 1, count = 7, seed = 0, tilt = GROUND_TILT }) => {
  const id = useUid();
  const pts = heapLocal(count, seed, tilt);
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <SphereShade id={`${id}g`} dark={0.38} light={0.2} />
      </defs>
      <ellipse cx={0.4} cy={0.2} rx={2.6} ry={2.6 * tilt + 0.3} fill={SHADOW} opacity={0.2} />
      {pts.map((p, i) => (
        <MarbleDot key={i} cx={p.x} cy={p.y} c={p.c} seed={p.sd} spin={0} shade={`${id}g`} shadow={p.y > -0.5} />
      ))}
    </g>
  );
};

/** World ground-contact points of each marble in the heap (back to front; the last ones sit on top). */
export const marbleHeapPoints = ({ x, y, s = 1, count = 7, seed = 0, tilt = GROUND_TILT }: MarbleHeapProps): Pt[] =>
  heapLocal(count, seed, tilt).map((p) => place(p, x, y, s));

/* ------------------------------------------------------------------ */
/* Top (লাট্টু)                                                         */
/* ------------------------------------------------------------------ */

/** Half-width of the top's body at height h (cm above the nail tip). */
const topHalf = (h: number) => {
  const tab: [number, number][] = [
    [1, 0.4],
    [2, 1.2],
    [3.2, 2.15],
    [4.2, 2.5],
    [5.0, 2.2],
    [5.6, 1.0],
  ];
  if (h <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (h <= tab[i][0]) {
      const t = (h - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]);
      return tab[i - 1][1] + (tab[i][1] - tab[i - 1][1]) * t;
    }
  }
  return tab[tab.length - 1][1];
};

const TOP_BODY = "M -0.4 -1 C -1.4 -1.8 -2.5 -3.0 -2.5 -4.2 C -2.5 -5.0 -1.8 -5.6 -0.6 -5.7 L 0.6 -5.7 C 1.8 -5.6 2.5 -5.0 2.5 -4.2 C 2.5 -3.0 1.4 -1.8 0.4 -1 Z";
/** Lying on its side: resting on the widest rim and the nail tip. */
const TOP_LYING = "translate(0 -2.5) rotate(-59) translate(0 4.2)";

export interface TopProps {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  lying?: boolean;
  /** "wound" round the body, "coiled" loose on the ground beside it, or "none". Default "wound". */
  string?: "wound" | "coiled" | "none";
  /** Spin phase in degrees (the painted stripes turn). */
  spin?: number;
}

/** The coiled string's points (cm, ground, beside the top). */
const coilPath = (ox: number) => {
  let d = "";
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI * 3.6;
    const r = 2.0 - 0.32 * t + 0.15 * Math.sin(3 * t);
    d += `${i ? "L" : "M"} ${n2(ox + r * Math.cos(t))} ${n2(-0.2 + r * 0.36 * Math.sin(t))} `;
  }
  return d + `Q ${ox + 2} 0.6 ${ox + 3.6} 0.3`;
};

/** The wooden লাট্টু with its iron nail tip, painted bands and its string. x, y = ground contact. */
export const Top: React.FC<TopProps> = ({ x, y, s = 1, rot = 0, lying = false, string = "wound", spin = 0 }) => {
  const id = useUid();
  const wound = string === "wound";
  const bands = [
    { y: -4.25, h: 0.65, c: "#c23a2a" },
    { y: -3.25, h: 0.32, c: "#3f8a3a" },
    { y: -5.0, h: 0.3, c: "#e8b830" },
  ];
  const stripes = Array.from({ length: 6 }, (_, k) => {
    const a = rad(spin + k * 60);
    return { x: 2.4 * Math.sin(a), vis: Math.cos(a) };
  }).filter((p) => p.vis > 0.05);
  const windings = Array.from({ length: 6 }, (_, i) => -1.6 - i * 0.34);
  const body = (
    <g>
      {/* the iron nail */}
      <path d="M -0.2 -1.15 L 0.2 -1.15 L 0.07 -0.15 L 0 0 L -0.07 -0.15 Z" fill="#5c6064" />
      <line x1={-0.08} y1={-1.1} x2={-0.03} y2={-0.2} stroke="#c8ccd0" strokeWidth={0.07} opacity={0.7} />
      <path d={TOP_BODY} fill={`url(#${id}w)`} />
      <g clipPath={`url(#${id}c)`}>
        {bands.map((b) => (
          <path
            key={b.y}
            d={`M -2.6 ${b.y} Q 0 ${b.y + 0.5} 2.6 ${b.y} L 2.6 ${b.y + b.h} Q 0 ${b.y + b.h + 0.5} -2.6 ${b.y + b.h} Z`}
            fill={b.c}
            opacity={0.88}
          />
        ))}
        {stripes.map((p, i) => (
          <path
            key={i}
            d={`M ${n2(p.x * 0.4)} -5.65 Q ${n2(p.x * 1.05)} -4.4 ${n2(p.x * 0.3)} -1.4`}
            stroke="#5a3418"
            strokeWidth={0.18}
            fill="none"
            opacity={0.4 * p.vis}
          />
        ))}
        {wound &&
          windings.map((wy, i) => {
            const hw = topHalf(-wy) + 0.1;
            return (
              <g key={i}>
                <path d={`M ${n2(-hw)} ${n2(wy + 0.1)} Q 0 ${n2(wy + 0.55)} ${n2(hw)} ${n2(wy + 0.1)}`} stroke="#6e5c40" strokeWidth={0.3} fill="none" opacity={0.5} transform="translate(0.06 0.1)" />
                <path d={`M ${n2(-hw)} ${n2(wy)} Q 0 ${n2(wy + 0.45)} ${n2(hw)} ${n2(wy)}`} stroke="#eadfc4" strokeWidth={0.26} fill="none" />
              </g>
            );
          })}
        <path d={TOP_BODY} fill={`url(#${id}h)`} />
      </g>
      {/* the knob */}
      <rect x={-0.45} y={-6.35} width={0.9} height={0.75} fill="#7a4e28" />
      <ellipse cx={0} cy={-6.4} rx={0.62} ry={0.36} fill="#a8743e" />
      <ellipse cx={-0.18} cy={-6.45} rx={0.22} ry={0.12} fill="#e8c088" opacity={0.6} />
      {/* the wound string's loose tail */}
      {wound && <path d="M 2.3 -3.0 C 3.4 -2.6 3.6 -1.2 4.6 -0.5 C 5.2 -0.1 5.8 -0.2 6.2 -0.3" stroke="#eadfc4" strokeWidth={0.24} fill="none" strokeLinecap="round" />}
      {wound && <circle cx={6.3} cy={-0.3} r={0.32} fill="#d9cba8" />}
    </g>
  );
  return (
    <g transform={tf(x, y, s, rot)}>
      <defs>
        <linearGradient id={`${id}w`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#dcab6a" />
          <stop offset="0.45" stopColor="#b47c40" />
          <stop offset="1" stopColor="#784a20" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="0.32" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff2d8" stopOpacity={0.35} />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#2a160a" stopOpacity={0.35} />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <path d={TOP_BODY} />
        </clipPath>
      </defs>
      <ellipse cx={lying ? 1.2 : 0.4} cy={0.1} rx={lying ? 3.6 : 1.6} ry={0.55} fill={SHADOW} opacity={0.3} />
      {string === "coiled" && (
        <g>
          <path d={coilPath(lying ? -3.6 : 3.8)} stroke="#6e5c40" strokeWidth={0.3} fill="none" opacity={0.45} transform="translate(0.05 0.1)" />
          <path d={coilPath(lying ? -3.6 : 3.8)} stroke="#eadfc4" strokeWidth={0.24} fill="none" strokeLinecap="round" />
        </g>
      )}
      {lying ? <g transform={TOP_LYING}>{body}</g> : body}
    </g>
  );
};

/** World anchors of the top: tip, knob, body centre (the grip) and, when wound, the string's end. */
export const topAnchors = ({ x, y, s = 1, rot = 0, lying = false }: TopProps) => {
  const lyingPt = (p: Pt): Pt => {
    // TOP_LYING: translate(0 -2.5) rotate(-59) translate(0 4.2)
    const a = rad(-59);
    const q = { x: p.x, y: p.y + 4.2 };
    return { x: q.x * Math.cos(a) - q.y * Math.sin(a), y: q.x * Math.sin(a) + q.y * Math.cos(a) - 2.5 };
  };
  const p = (lx: number, ly: number) => place(lying ? lyingPt({ x: lx, y: ly }) : { x: lx, y: ly }, x, y, s, rot);
  return { tip: p(0, 0), knob: p(0, -6.4), centre: p(0, -4), stringEnd: p(6.3, -0.3) };
};

/* ------------------------------------------------------------------ */
/* Coins                                                                */
/* ------------------------------------------------------------------ */

const COPPER_R = 1.25;
const SILVER_R = 0.95;

const CoinDisc: React.FC<{
  cx: number;
  cy: number;
  r: number;
  tilt: number;
  th: number;
  metal: "copper" | "silver";
  seed: number;
  grad: string;
  shadow?: number;
  shadowCol?: string;
}> = ({ cx, cy, r, tilt, th, metal, seed, grad, shadow = 0.28, shadowCol = SHADOW }) => {
  const ry = r * tilt;
  const e = edgeDrop(th, tilt);
  const cu = metal === "copper";
  return (
    <g transform={`translate(${n2(cx)} ${n2(cy)})`}>
      {shadow > 0 && <ellipse cx={0.25 * r} cy={e + 0.1 * r} rx={r * 1.08} ry={ry + 0.12} fill={shadowCol} opacity={shadow} />}
      {e > 0.01 && <path d={`M ${-r} 0 A ${r} ${n2(ry)} 0 0 0 ${r} 0 L ${r} ${n2(e)} A ${r} ${n2(ry)} 0 0 1 ${-r} ${n2(e)} Z`} fill={cu ? "#5e2c14" : "#6e7276"} />}
      <ellipse rx={r} ry={ry} fill={`url(#${grad})`} />
      <ellipse rx={r * 0.84} ry={ry * 0.84} fill="none" stroke={cu ? "#e4a676" : "#ffffff"} strokeWidth={r * 0.07} opacity={cu ? 0.35 : 0.4} />
      {cu ? (
        <g>
          <ellipse rx={r * 0.44} ry={ry * 0.44} fill="none" stroke="#7a3a18" strokeWidth={r * 0.07} opacity={0.4} />
          <ellipse cx={r * (0.3 - 0.6 * hash(seed))} cy={ry * 0.3} rx={r * 0.12} ry={ry * 0.1} fill="#5e8a6a" opacity={0.28} />
        </g>
      ) : (
        <g fill="#7d8286" opacity={0.45}>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <circle key={i} cx={r * 0.7 * Math.cos(a)} cy={ry * 0.7 * Math.sin(a)} r={r * 0.045} />;
          })}
          <ellipse rx={r * 0.22} ry={ry * 0.22} />
        </g>
      )}
      <path d={arc(r * 0.92, ry * 0.92, 200, 270, 0, 0, 8)} stroke="#ffffff" strokeWidth={r * 0.1} fill="none" opacity={cu ? 0.3 : 0.6} strokeLinecap="round" />
    </g>
  );
};

const CoinGrads: React.FC<{ id: string }> = ({ id }) => (
  <>
    <radialGradient id={`${id}cu`} cx="0.36" cy="0.3" r="0.8">
      <stop offset="0" stopColor="#da9058" />
      <stop offset="0.5" stopColor="#aa5c2c" />
      <stop offset="1" stopColor="#6e3416" />
    </radialGradient>
    <radialGradient id={`${id}ag`} cx="0.36" cy="0.3" r="0.8">
      <stop offset="0" stopColor="#f4f4f0" />
      <stop offset="0.5" stopColor="#bfc2c3" />
      <stop offset="1" stopColor="#80848a" />
    </radialGradient>
  </>
);

export interface CopperCoinProps {
  x: number;
  y: number;
  s?: number;
  tilt?: number;
  seed?: number;
}

/** One small worn copper coin (2.5 cm, no real design). x, y = its centre (on the ground at the default tilt). */
export const CopperCoin: React.FC<CopperCoinProps> = ({ x, y, s = 1, tilt = GROUND_TILT, seed = 0 }) => {
  const id = useUid();
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <CoinGrads id={id} />
      </defs>
      <CoinDisc cx={0} cy={0} r={COPPER_R} tilt={tilt} th={0.18} metal="copper" seed={seed} grad={`${id}cu`} />
    </g>
  );
};

export interface CopperCoinsProps {
  x: number;
  y: number;
  s?: number;
  count?: number;
  tilt?: number;
  seed?: number;
}

const COPPER_SPOTS = [
  { u: 0, v: 0 },
  { u: 2.5, v: 0.9 },
  { u: -2.2, v: 1.5 },
  { u: 1.1, v: -1.7 },
  { u: -0.8, v: 2.8 },
  { u: 3.3, v: -1.2 },
];
const copperLocal = (count: number, tilt: number, seed: number) =>
  COPPER_SPOTS.slice(0, Math.max(1, Math.min(COPPER_SPOTS.length, count)))
    .map((p, i) => {
      const g = plane(p.u + 0.4 * (hash(seed + i) - 0.5), p.v + 0.4 * (hash(seed + i + 9) - 0.5), 0, tilt);
      return { x: g.x, y: g.y, sd: seed + i };
    })
    .sort((a, b) => a.y - b.y);

/** A few small copper coins lying together. x, y = the group's centre on the ground. */
export const CopperCoins: React.FC<CopperCoinsProps> = ({ x, y, s = 1, count = 3, tilt = GROUND_TILT, seed = 0 }) => {
  const id = useUid();
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <CoinGrads id={id} />
      </defs>
      {copperLocal(count, tilt, seed).map((p) => (
        <CoinDisc key={p.sd} cx={p.x} cy={p.y} r={COPPER_R} tilt={tilt} th={0.18} metal="copper" seed={p.sd} grad={`${id}cu`} />
      ))}
    </g>
  );
};

/** World centres of the coins in the group (back to front). */
export const copperCoinSpots = ({ x, y, s = 1, count = 3, tilt = GROUND_TILT, seed = 0 }: CopperCoinsProps): Pt[] =>
  copperLocal(count, tilt, seed).map((p) => place(p, x, y, s));

export interface SilverCoinProps {
  x: number;
  y: number;
  s?: number;
  tilt?: number;
  seed?: number;
}

/** One small silver coin (1.9 cm, beaded rim, no real design). x, y = its centre. */
export const SilverCoin: React.FC<SilverCoinProps> = ({ x, y, s = 1, tilt = GROUND_TILT, seed = 0 }) => {
  const id = useUid();
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <CoinGrads id={id} />
      </defs>
      <CoinDisc cx={0} cy={0} r={SILVER_R} tilt={tilt} th={0.14} metal="silver" seed={seed} grad={`${id}ag`} />
    </g>
  );
};

export type TwoAnnasArrangement = "single" | "pair" | "stacked" | "palm";

export interface TwoAnnasProps {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  arrangement?: TwoAnnasArrangement;
  /** Default: GROUND_TILT on the ground, 0.62 on a palm (the palm tilted up toward the camera). */
  tilt?: number;
}

const annasLocal = (arr: TwoAnnasArrangement, tilt: number): Pt[] => {
  const e = edgeDrop(0.14, tilt) + 0.02;
  if (arr === "single") return [{ x: 0, y: 0 }];
  if (arr === "stacked") return [{ x: 0, y: 0 }, { x: 0.22, y: -e - 0.05 }];
  if (arr === "palm") return [plane(-0.6, 0.15, 0, tilt), { ...plane(0.55, -0.25, 0, tilt), y: plane(0.55, -0.25, 0, tilt).y - 0.08 }];
  return [plane(-1.15, 0.25, 0, tilt), plane(1.1, -0.35, 0, tilt)].sort((a, b) => a.y - b.y);
};

/** The two annas: two small silver coins, single, side by side, stacked, or lying on an open palm. */
export const TwoAnnas: React.FC<TwoAnnasProps> = ({ x, y, s = 1, rot = 0, arrangement = "pair", tilt }) => {
  const id = useUid();
  const t = tilt ?? (arrangement === "palm" ? 0.62 : GROUND_TILT);
  const pts = annasLocal(arrangement, t);
  const palm = arrangement === "palm";
  return (
    <g transform={tf(x, y, s, rot)}>
      <defs>
        <CoinGrads id={id} />
      </defs>
      {pts.map((p, i) => (
        <CoinDisc
          key={i}
          cx={p.x}
          cy={p.y}
          r={SILVER_R}
          tilt={t}
          th={0.14}
          metal="silver"
          seed={i}
          grad={`${id}ag`}
          shadow={palm ? 0.3 : arrangement === "stacked" && i === 1 ? 0.18 : 0.28}
          shadowCol={palm ? "#5e381e" : SHADOW}
        />
      ))}
    </g>
  );
};

/** World centres of the coins (back to front; for "stacked" the second is the top coin). */
export const twoAnnasSpots = ({ x, y, s = 1, rot = 0, arrangement = "pair", tilt }: TwoAnnasProps): Pt[] =>
  annasLocal(arrangement, tilt ?? (arrangement === "palm" ? 0.62 : GROUND_TILT)).map((p) => place(p, x, y, s, rot));

/* ------------------------------------------------------------------ */
/* Folded shirt                                                         */
/* ------------------------------------------------------------------ */

const SHIRT = { w: 24, d: 18, th: 2.2 };

export interface FoldedShirtProps {
  x: number;
  y: number;
  s?: number;
  tilt?: number;
  yaw?: number;
  /** Cloth colour (default homespun off-white) and its faint stripe (null = plain). */
  color?: string;
  stripe?: string | null;
}

/** A folded cotton shirt lying on the ground (collar, placket with buttons, a pocket). x, y = its centre. */
export const FoldedShirt: React.FC<FoldedShirtProps> = ({ x, y, s = 1, tilt = GROUND_TILT, yaw = 0, color = "#ebe5d6", stripe = "#8fa6bf" }) => {
  const id = useUid();
  const { w, d, th } = SHIRT;
  const pt = planeTf(yaw, tilt);
  const e = edgeDrop(th, tilt);
  const shape = `M ${-w / 2 + 1.2} ${-d / 2} L ${w / 2 - 1.2} ${-d / 2} Q ${w / 2} ${-d / 2} ${w / 2} ${-d / 2 + 1.4} L ${w / 2 - 0.2} ${d / 2 - 1} Q ${w / 2 - 0.3} ${d / 2} ${w / 2 - 1.5} ${d / 2} L ${-w / 2 + 1.5} ${d / 2} Q ${-w / 2 + 0.2} ${d / 2} ${-w / 2 + 0.2} ${d / 2 - 1} L ${-w / 2} ${-d / 2 + 1.4} Q ${-w / 2} ${-d / 2} ${-w / 2 + 1.2} ${-d / 2} Z`;
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={shape} />
        </clipPath>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#3a2a1a" stopOpacity={0.18} />
        </linearGradient>
      </defs>
      <g transform={`translate(1.2 ${n2(e + 0.8)})`} opacity={0.24}>
        <g transform={pt}>
          <path d={shape} fill={SHADOW} />
        </g>
      </g>
      {/* the folded layers seen at the near edge */}
      {[1, 0.66, 0.33].map((k, i) => (
        <g key={k} transform={`translate(0 ${n2(e * k)})`}>
          <g transform={pt}>
            <path d={shape} fill={i === 0 ? "#a59e8e" : i === 1 ? "#c9c2b2" : "#bdb6a6"} />
          </g>
        </g>
      ))}
      <g transform={pt}>
        <path d={shape} fill={color} />
        <g clipPath={`url(#${id}c)`}>
          {stripe &&
            Array.from({ length: 17 }, (_, i) => <rect key={i} x={-w / 2 + 0.5 + i * 1.5} y={-d / 2} width={0.22} height={d} fill={stripe} opacity={0.32} />)}
          {/* the sleeves folded behind: soft diagonal folds at both sides */}
          <path d={`M ${-w / 2} ${-d / 2 + 3} L ${-w / 2 + 4.5} ${d / 2}`} stroke="#8a8272" strokeWidth={0.7} opacity={0.22} />
          <path d={`M ${w / 2} ${-d / 2 + 3} L ${w / 2 - 4.5} ${d / 2}`} stroke="#8a8272" strokeWidth={0.7} opacity={0.22} />
          <path d={`M ${-w / 2 + 0.6} ${-d / 2 + 3.6} L ${-w / 2 + 5} ${d / 2}`} stroke="#ffffff" strokeWidth={0.4} opacity={0.3} />
          {/* a soft fold across */}
          <path d={`M ${-w / 2} ${d / 2 - 4} Q 0 ${d / 2 - 3.2} ${w / 2} ${d / 2 - 4.2}`} stroke="#8a8272" strokeWidth={0.6} fill="none" opacity={0.18} />
          {/* breast pocket */}
          <path d="M -8.4 -4.6 L -4.6 -4.6 L -4.7 -1 Q -6.5 -0.4 -8.3 -1 Z" fill="none" stroke="#7d7566" strokeWidth={0.18} opacity={0.45} />
          {/* placket and buttons */}
          <path d={`M -0.5 -4.6 L -0.5 ${d / 2} M 0.5 -4.6 L 0.5 ${d / 2}`} stroke="#7d7566" strokeWidth={0.14} opacity={0.4} />
          {[-2.6, 1.4, 5.4].map((by) => (
            <g key={by}>
              <circle cx={0} cy={by} r={0.45} fill="#d4ccba" />
              <circle cx={-0.1} cy={by - 0.1} r={0.14} fill="#7d7566" opacity={0.6} />
            </g>
          ))}
          <path d={shape} fill={`url(#${id}l)`} />
        </g>
        {/* the collar: band behind, two points in front */}
        <path d="M -3.8 -9.6 Q 0 -10.4 3.8 -9.6 L 3.6 -8.2 Q 0 -8.8 -3.6 -8.2 Z" fill="#d9d2c2" />
        <path d="M -3.7 -8.6 L -0.2 -4.6 L -0.4 -8.4 Z" fill={color} />
        <path d="M 3.7 -8.6 L 0.2 -4.6 L 0.4 -8.4 Z" fill="#e2dccd" />
        <path d="M -3.7 -8.6 L -0.2 -4.6 M 3.7 -8.6 L 0.2 -4.6" stroke="#8a8272" strokeWidth={0.16} opacity={0.45} />
      </g>
    </g>
  );
};

/** World anchors: centre, the near edge's middle and the far edge's middle (hands lift it there). */
export const foldedShirtAnchors = ({ x, y, s = 1, tilt = GROUND_TILT, yaw = 0 }: FoldedShirtProps) => {
  const p = (u: number, v: number) => place(plane(u, v, yaw, tilt), x, y, s);
  return { centre: p(0, 0), near: p(0, SHIRT.d / 2), far: p(0, -SHIRT.d / 2), left: p(-SHIRT.w / 2, 0), right: p(SHIRT.w / 2, 0) };
};

/* ------------------------------------------------------------------ */
/* Gamchha spread on the ground                                         */
/* ------------------------------------------------------------------ */

const GAM = { w: 110, d: 60 };
/** Suggested heap spots (u along the cloth, v across, 0..1), five boys' things in a loose row and a second row. */
export const GAMCHHA_HEAPS: { u: number; v: number }[] = [
  { u: 0.2, v: 0.36 },
  { u: 0.42, v: 0.3 },
  { u: 0.66, v: 0.34 },
  { u: 0.3, v: 0.7 },
  { u: 0.58, v: 0.72 },
  { u: 0.82, v: 0.66 },
];

export interface GamchhaProps {
  x: number;
  y: number;
  s?: number;
  tilt?: number;
  yaw?: number;
  check?: "red" | "green";
  /** Real frame: the end fringes stir a little (optional; still without it). */
  lifeF?: number;
  seed?: number;
}

/** A checked cotton gamchha spread flat on the ground, with fringed ends. x, y = its centre. */
export const Gamchha: React.FC<GamchhaProps> = ({ x, y, s = 1, tilt = GROUND_TILT, yaw = 0, check = "red", lifeF, seed = 0 }) => {
  const id = useUid();
  const { w, d } = GAM;
  const col = check === "red" ? "#c63a30" : "#2f8a4e";
  const colDeep = check === "red" ? "#9a2620" : "#1f6a3a";
  const pt = planeTf(yaw, tilt);
  // the cloth's outline: soft wavy edges
  const edge: Pt[] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) edge.push({ x: -w / 2 + (w * i) / N, y: -d / 2 + 0.6 * Math.sin(i * 1.7 + seed) });
  for (let i = 1; i <= 8; i++) edge.push({ x: w / 2 + 0.5 * Math.sin(i * 2.1 + seed), y: -d / 2 + (d * i) / 8 });
  for (let i = N - 1; i >= 0; i--) edge.push({ x: -w / 2 + (w * i) / N, y: d / 2 + 0.7 * Math.sin(i * 1.3 + seed + 2) });
  for (let i = 7; i >= 1; i--) edge.push({ x: -w / 2 + 0.5 * Math.sin(i * 1.9 + seed + 1), y: -d / 2 + (d * i) / 8 });
  const shape = edge.map((p, i) => `${i ? "L" : "M"} ${n2(p.x)} ${n2(p.y)}`).join(" ") + " Z";
  const period = 10;
  const bandsU = Array.from({ length: Math.ceil(w / period) + 1 }, (_, i) => -w / 2 + 2 + i * period);
  const bandsV = Array.from({ length: Math.ceil(d / period) + 1 }, (_, i) => -d / 2 + 2 + i * period);
  const sway = (i: number) => (lifeF === undefined ? 0 : 0.45 * Math.sin(lifeF * 0.09 + i * 0.7) + 0.25 * Math.sin(lifeF * 0.031 + i * 1.9));
  const fringe = (side: -1 | 1) =>
    Array.from({ length: Math.floor(d / 1.2) }, (_, i) => {
      const v = -d / 2 + 0.6 + i * 1.2;
      const x0 = side * (w / 2 - 0.2);
      return <line key={`${side}${i}`} x1={x0} y1={v} x2={x0 + side * (2.4 + 0.5 * hash(i + seed))} y2={v + sway(i) + 0.3 * side} />;
    });
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={shape} />
        </clipPath>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff8e8" stopOpacity={0.22} />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#3a2414" stopOpacity={0.14} />
        </linearGradient>
      </defs>
      {/* contact shadow and the cloth's thin edge */}
      <g transform={`translate(1 ${n2(0.6 + edgeDrop(0.3, tilt))})`} opacity={0.2}>
        <g transform={pt}>
          <path d={shape} fill={SHADOW} />
        </g>
      </g>
      <g transform={pt}>
        <g stroke="#e9dfcc" strokeWidth={0.32} strokeLinecap="round">
          {fringe(-1)}
          {fringe(1)}
        </g>
        <g stroke={col} strokeWidth={0.32} strokeLinecap="round" opacity={0.5}>
          {fringe(-1).filter((_, i) => i % 3 === 0)}
          {fringe(1).filter((_, i) => i % 3 === 1)}
        </g>
        <path d={shape} fill="#f3ece0" />
        <g clipPath={`url(#${id}c)`}>
          {/* the check: wide bands and pairs of thin lines both ways; crossings darken */}
          {bandsU.map((u) => (
            <g key={`u${u}`} fill={col}>
              <rect x={u} y={-d} width={2.6} height={2 * d} opacity={0.62} />
              <rect x={u + 5} y={-d} width={0.5} height={2 * d} opacity={0.5} />
              <rect x={u + 6.2} y={-d} width={0.5} height={2 * d} opacity={0.5} />
            </g>
          ))}
          {bandsV.map((v) => (
            <g key={`v${v}`} fill={col}>
              <rect x={-w} y={v} width={2 * w} height={2.6} opacity={0.62} />
              <rect x={-w} y={v + 5} width={2 * w} height={0.5} opacity={0.5} />
              <rect x={-w} y={v + 6.2} width={2 * w} height={0.5} opacity={0.5} />
            </g>
          ))}
          {/* the woven end borders */}
          {[-1, 1].map((sd) => (
            <g key={sd} fill={colDeep}>
              <rect x={sd < 0 ? -w / 2 : w / 2 - 5.5} y={-d} width={5.5} height={2 * d} opacity={0.75} />
              <rect x={sd < 0 ? -w / 2 + 6.4 : w / 2 - 7.2} y={-d} width={0.8} height={2 * d} opacity={0.6} />
            </g>
          ))}
          {/* soft wrinkles */}
          <ellipse cx={-18} cy={6} rx={22} ry={1.6} fill="#3a2414" opacity={0.07} transform="rotate(-8 -18 6)" />
          <ellipse cx={-17} cy={4} rx={20} ry={1.0} fill="#ffffff" opacity={0.12} transform="rotate(-8 -17 4)" />
          <ellipse cx={24} cy={-10} rx={16} ry={1.3} fill="#3a2414" opacity={0.06} transform="rotate(12 24 -10)" />
          <ellipse cx={30} cy={14} rx={14} ry={1.2} fill="#3a2414" opacity={0.06} transform="rotate(-20 30 14)" />
          <path d={shape} fill={`url(#${id}l)`} />
        </g>
      </g>
    </g>
  );
};

/** World point on the gamchha: u along it (0 left end .. 1 right end), v across (0 far .. 1 near edge). */
export const gamchhaSpot = ({ x, y, s = 1, tilt = GROUND_TILT, yaw = 0 }: GamchhaProps, u: number, v: number): Pt =>
  place(plane((u - 0.5) * GAM.w, (v - 0.5) * GAM.d, yaw, tilt), x, y, s);

/** World corners and centre of the gamchha. */
export const gamchhaAnchors = (props: GamchhaProps) => ({
  centre: gamchhaSpot(props, 0.5, 0.5),
  corners: [gamchhaSpot(props, 0, 0), gamchhaSpot(props, 1, 0), gamchhaSpot(props, 1, 1), gamchhaSpot(props, 0, 1)],
  heaps: GAMCHHA_HEAPS.map((h) => gamchhaSpot(props, h.u, h.v)),
});

/* ------------------------------------------------------------------ */
/* The ten-rupee note                                                   */
/* ------------------------------------------------------------------ */

const NOTE = { w: 15, h: 8.5 };
const NOTE_INK = "#5e7888";
const NOTE_DEEP = "#3a5464";

/** The note's face, centred at 0 (cm). Generic: border, rosettes, medallion, "১০"; no portrait, no real text. */
const NoteFace: React.FC<{ id: string }> = ({ id }) => {
  const { w, h } = NOTE;
  // guilloche along the border band: two interlaced waves round the note
  const wave = (phase: number) => {
    const m = 0.62;
    const pts: string[] = [];
    const per = 2 * (w - 2 * m) + 2 * (h - 2 * m);
    const steps = 220;
    for (let i = 0; i <= steps; i++) {
      let t = (i / steps) * per;
      let px: number;
      let py: number;
      const W2 = w - 2 * m;
      const H2 = h - 2 * m;
      if (t < W2) {
        px = -w / 2 + m + t;
        py = -h / 2 + m;
      } else if ((t -= W2) < H2) {
        px = w / 2 - m;
        py = -h / 2 + m + t;
      } else if ((t -= H2) < W2) {
        px = w / 2 - m - t;
        py = h / 2 - m;
      } else {
        t -= W2;
        px = -w / 2 + m;
        py = h / 2 - m - t;
      }
      const k = 0.16 * Math.sin((i / steps) * per * 5.2 + phase);
      // push inward/outward from the centre line of the band
      const ox = Math.abs(px) >= w / 2 - m - 0.001 ? Math.sign(px) * k : 0;
      const oy = Math.abs(py) >= h / 2 - m - 0.001 ? Math.sign(py) * k : 0;
      pts.push(`${i ? "L" : "M"} ${n2(px + ox)} ${n2(py + oy)}`);
    }
    return pts.join(" ");
  };
  const rose = () => {
    const pts: string[] = [];
    for (let i = 0; i <= 240; i++) {
      const a = (i / 240) * Math.PI * 2;
      const r = 1.55 + 0.42 * Math.cos(9 * a);
      pts.push(`${i ? "L" : "M"} ${n2(3.7 + r * Math.cos(a))} ${n2(r * Math.sin(a))}`);
    }
    return pts.join(" ") + " Z";
  };
  const dashes = (y0: number, x0: number, x1: number, seed: number) => {
    const out: React.ReactNode[] = [];
    let xx = x0;
    let i = 0;
    while (xx < x1) {
      const len = 0.25 + 0.9 * hash(seed + i);
      if (xx + len > x1) break;
      out.push(<rect key={`${seed}-${i}`} x={xx} y={y0} width={len} height={0.16} rx={0.05} />);
      xx += len + 0.18 + (hash(seed + i + 50) > 0.8 ? 0.35 : 0);
      i++;
    }
    return out;
  };
  const corner = (cx: number, cy: number) => (
    <g key={`${cx}${cy}`}>
      <circle cx={cx} cy={cy} r={0.74} fill="#b6c7cf" />
      <circle cx={cx} cy={cy} r={0.74} fill="none" stroke={NOTE_INK} strokeWidth={0.05} />
      <text x={cx} y={cy + 0.27} fontSize={0.78} fontFamily={BN_FONT} fontWeight={700} fill={NOTE_DEEP} textAnchor="middle">
        ১০
      </text>
    </g>
  );
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.15} fill="#c9d6dc" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.15} fill={`url(#${id}p)`} />
      {/* border band */}
      <rect x={-w / 2 + 0.3} y={-h / 2 + 0.3} width={w - 0.6} height={h - 0.6} fill="none" stroke={NOTE_INK} strokeWidth={0.07} opacity={0.8} />
      <rect x={-w / 2 + 0.95} y={-h / 2 + 0.95} width={w - 1.9} height={h - 1.9} fill="none" stroke={NOTE_INK} strokeWidth={0.05} opacity={0.7} />
      <path d={wave(0)} stroke={NOTE_INK} strokeWidth={0.045} fill="none" opacity={0.75} />
      <path d={wave(Math.PI)} stroke={NOTE_INK} strokeWidth={0.045} fill="none" opacity={0.55} />
      {/* the numeral's cartouche and the big "১০" (embossed) */}
      <rect x={-6.1} y={-2.2} width={5.2} height={3.9} rx={0.9} fill="#b5c6ce" opacity={0.8} />
      <rect x={-6.1} y={-2.2} width={5.2} height={3.9} rx={0.9} fill="none" stroke={NOTE_INK} strokeWidth={0.06} opacity={0.7} />
      <text x={-3.46} y={1.12} fontSize={3.1} fontFamily={BN_FONT} fontWeight={800} fill="#eef3f4" opacity={0.55} textAnchor="middle">
        ১০
      </text>
      <text x={-3.5} y={1.05} fontSize={3.1} fontFamily={BN_FONT} fontWeight={800} fill={NOTE_DEEP} textAnchor="middle">
        ১০
      </text>
      {/* the medallion (an engraved rosette where a real note has a portrait) */}
      <circle cx={3.7} cy={0} r={2.4} fill="#d4e0e5" />
      <circle cx={3.7} cy={0} r={2.4} fill="none" stroke={NOTE_INK} strokeWidth={0.06} />
      <circle cx={3.7} cy={0} r={2.2} fill="none" stroke={NOTE_INK} strokeWidth={0.04} opacity={0.6} />
      <path d={rose()} fill="none" stroke={NOTE_INK} strokeWidth={0.045} opacity={0.8} />
      <circle cx={3.7} cy={0} r={0.85} fill="#c3d2d9" />
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx={3.7} cy={-0.5} rx={0.16} ry={0.36} fill={NOTE_INK} opacity={0.6} transform={`rotate(${i * 45} 3.7 0)`} />
      ))}
      {/* illegible engraved "lines" (no real text) */}
      <g fill={NOTE_INK} opacity={0.5}>
        {dashes(2.25, -6.0, -1.0, 11)}
        {dashes(2.75, -5.4, -1.6, 37)}
        {dashes(-3.05, -1.8, 1.4, 71)}
      </g>
      {corner(-w / 2 + 1.75, -h / 2 + 1.7)}
      {corner(w / 2 - 1.75, h / 2 - 1.7)}
      {corner(-w / 2 + 1.75, h / 2 - 1.7)}
      {/* age: old fold creases and a faint stain */}
      <path d={`M 0 ${-h / 2} L 0.05 ${h / 2}`} stroke="#8ea3ad" strokeWidth={0.07} opacity={0.35} />
      <path d={`M 0.09 ${-h / 2} L 0.14 ${h / 2}`} stroke="#ffffff" strokeWidth={0.06} opacity={0.3} />
      <path d={`M ${-w / 2} 0.05 L ${w / 2} 0`} stroke="#8ea3ad" strokeWidth={0.06} opacity={0.3} />
      <ellipse cx={-5.8} cy={-2.6} rx={1.3} ry={0.8} fill="#b8a774" opacity={0.12} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.15} fill="none" stroke="#a4b5bd" strokeWidth={0.1} opacity={0.6} />
    </g>
  );
};

const NoteDefs: React.FC<{ id: string }> = ({ id }) => (
  <radialGradient id={`${id}p`} cx="0.45" cy="0.45" r="0.7">
    <stop offset="0" stopColor="#e6eef0" stopOpacity={0.55} />
    <stop offset="0.7" stopColor="#e6eef0" stopOpacity={0} />
    <stop offset="1" stopColor="#c8b98e" stopOpacity={0.22} />
  </radialGradient>
);

export type NoteState = "flat" | "folded" | "held";

export interface TenRupeeNoteProps {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  state?: NoteState;
  /** held: 0 flat .. 1 well bent. */
  bend?: number;
  /** held: "both" = by both short ends (sags in the middle), "one" = by the left end (droops). */
  hold?: "both" | "one";
  /** flat / folded: lying on the ground (GROUND_TILT) or face-on (1, default). */
  tilt?: number;
  yaw?: number;
}

const STRIPS = 14;

/** The held note as a chain of strips: each strip's start point and angle (cm, centred per hold mode). */
const noteChain = (bend: number, hold: "both" | "one") => {
  const { w } = NOTE;
  const dw = w / STRIPS;
  const b = clamp(bend);
  const ang = (u: number) => (hold === "both" ? b * 0.5 * (1 - 2 * u) : b * 0.95 * Math.pow(u, 1.3));
  const pts: { x: number; y: number; a: number }[] = [];
  let X = 0;
  let Y = 0;
  for (let i = 0; i <= STRIPS; i++) {
    const a = ang((i + 0.5) / STRIPS);
    pts.push({ x: X, y: Y, a });
    X += dw * Math.cos(a);
    Y += dw * Math.sin(a);
  }
  // pts[STRIPS] is the right end; shift: both = grips' midpoint at 0, one = left grip at 0
  const end = pts[STRIPS];
  const ox = hold === "both" ? -end.x / 2 : 0;
  const oy = hold === "both" ? -end.y / 2 : 0;
  return pts.map((p) => ({ x: p.x + ox, y: p.y + oy, a: p.a }));
};

/** The generic large old ten-rupee note: flat, folded in four, or held and bending. */
export const TenRupeeNote: React.FC<TenRupeeNoteProps> = ({ x, y, s = 1, rot = 0, state = "flat", bend = 0.4, hold = "both", tilt = 1, yaw = 0 }) => {
  const id = useUid();
  const { w, h } = NOTE;
  if (state === "folded") {
    // the top-right quarter shows: folds on its left and bottom edges, the four open layers at top and right
    const qw = w / 2;
    const qh = h / 2;
    const e = edgeDrop(0.12, tilt);
    return (
      <g transform={tf(x, y, s, rot)}>
        <defs>
          <NoteDefs id={id} />
          <clipPath id={`${id}q`}>
            <rect x={0} y={-qh} width={qw} height={qh} />
          </clipPath>
        </defs>
        {tilt < 0.98 && (
          <g transform={`translate(0.5 ${n2(e + 0.4)})`} opacity={0.22}>
            <g transform={planeTf(yaw, tilt)}>
              <rect x={-qw / 2} y={-qh / 2} width={qw} height={qh} fill={SHADOW} />
            </g>
          </g>
        )}
        <g transform={planeTf(yaw, tilt)}>
          {/* the layers underneath peek out at the open edges */}
          {[3, 2, 1].map((k) => (
            <rect key={k} x={-qw / 2 + 0.05 * k} y={-qh / 2 - 0.06 * k} width={qw} height={qh} rx={0.08} fill={k % 2 ? "#b4c3ca" : "#c2cfd5"} />
          ))}
          <g transform={`translate(${-qw / 2} ${qh / 2})`}>
            <g clipPath={`url(#${id}q)`}>
              <NoteFace id={id} />
            </g>
          </g>
          {/* the fold edges: rounded, a little shadowed */}
          <rect x={-qw / 2} y={qh / 2 - 0.45} width={qw} height={0.45} fill="#5e7888" opacity={0.14} />
          <rect x={-qw / 2} y={-qh / 2} width={0.4} height={qh} fill="#5e7888" opacity={0.12} />
          <line x1={-qw / 2 + 0.06} y1={-qh / 2} x2={-qw / 2 + 0.06} y2={qh / 2} stroke="#eef3f4" strokeWidth={0.08} opacity={0.6} />
          {/* the paper's spring: the open corner lifts a little */}
          <path d={`M ${qw / 2 - 1.3} ${-qh / 2} L ${qw / 2} ${-qh / 2} L ${qw / 2} ${-qh / 2 + 1.0} Z`} fill="#e6eef0" opacity={0.35} />
        </g>
      </g>
    );
  }
  if (state === "held") {
    const chain = noteChain(bend, hold);
    const dw = w / STRIPS;
    const x0 = -w / 2;
    return (
      <g transform={tf(x, y, s, rot)}>
        <defs>
          <NoteDefs id={id} />
          {Array.from({ length: STRIPS }, (_, i) => (
            <clipPath key={i} id={`${id}s${i}`}>
              <rect x={x0 + i * dw - 0.03} y={-h / 2 - 0.1} width={dw + 0.06} height={h + 0.2} />
            </clipPath>
          ))}
        </defs>
        {Array.from({ length: STRIPS }, (_, i) => {
          const p = chain[i];
          const c = Math.cos(p.a);
          const sn = Math.sin(p.a);
          const lx = x0 + i * dw;
          // local (lx, 0) -> (p.x, p.y): the strip follows the curve, its vertical edges stay vertical (a shear), so
          // neighbouring strips meet exactly (light from the upper left)
          const m = `matrix(${n3(c)} ${n3(sn)} 0 1 ${n3(p.x - c * lx)} ${n3(p.y - sn * lx)})`;
          const shade = p.a > 0 ? Math.min(0.28, p.a * 0.3) : 0;
          const lit = p.a < 0 ? Math.min(0.2, -p.a * 0.25) : 0;
          return (
            <g key={i} transform={m} clipPath={`url(#${id}s${i})`}>
              <NoteFace id={id} />
              {shade > 0 && <rect x={lx - 0.05} y={-h / 2} width={dw + 0.1} height={h} fill="#22343e" opacity={shade} />}
              {lit > 0 && <rect x={lx - 0.05} y={-h / 2} width={dw + 0.1} height={h} fill="#ffffff" opacity={lit} />}
            </g>
          );
        })}
      </g>
    );
  }
  const e = edgeDrop(0.04, tilt);
  return (
    <g transform={tf(x, y, s, rot)}>
      <defs>
        <NoteDefs id={id} />
      </defs>
      {tilt < 0.98 && (
        <g transform={`translate(0.7 ${n2(e + 0.4)})`} opacity={0.2}>
          <g transform={planeTf(yaw, tilt)}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={SHADOW} />
          </g>
        </g>
      )}
      <g transform={planeTf(yaw, tilt)}>
        <NoteFace id={id} />
      </g>
    </g>
  );
};

/**
 * World anchors of the note. flat / folded: centre and corners; gripL / gripR = the short edges' middles (folded:
 * the pinch point at the folded corner as gripL, the open corner as gripR). held: gripL / gripR = where the fingers
 * hold the two short ends (after the bend), centre = the middle of the note.
 */
export const tenRupeeNoteAnchors = ({ x, y, s = 1, rot = 0, state = "flat", bend = 0.4, hold = "both", tilt = 1, yaw = 0 }: TenRupeeNoteProps) => {
  const P = (p: Pt) => place(p, x, y, s, rot);
  if (state === "held") {
    const ch = noteChain(bend, hold);
    const mid = ch[Math.floor(STRIPS / 2)];
    return { centre: P(mid), gripL: P(ch[0]), gripR: P(ch[STRIPS]), corners: [] as Pt[] };
  }
  const hw = state === "folded" ? NOTE.w / 4 : NOTE.w / 2;
  const hh = state === "folded" ? NOTE.h / 4 : NOTE.h / 2;
  const q = (u: number, v: number) => P(plane(u, v, yaw, tilt));
  return {
    centre: q(0, 0),
    gripL: state === "folded" ? q(-hw + 0.8, hh - 0.8) : q(-hw, 0),
    gripR: state === "folded" ? q(hw - 0.8, -hh + 0.8) : q(hw, 0),
    corners: [q(-hw, -hh), q(hw, -hh), q(hw, hh), q(-hw, hh)],
  };
};

/* ------------------------------------------------------------------ */
/* Lozenges, the jar and the paper twist                                */
/* ------------------------------------------------------------------ */

export type LozengeColor = "red" | "yellow" | "green" | "white";
const LOZ_R = 0.75;
const LOZ_COLS: Record<LozengeColor, { base: string; swirl: string; swirl2?: string }> = {
  red: { base: "#d8343c", swirl: "#ffd8d0" },
  yellow: { base: "#f2c230", swirl: "#fff4c8" },
  green: { base: "#4fa64a", swirl: "#e0f4d0" },
  white: { base: "#f4efe6", swirl: "#d8343c", swirl2: "#4fa64a" },
};
const LOZ_ORDER: LozengeColor[] = ["red", "yellow", "green", "white"];
const lozColorAt = (k: number): LozengeColor => LOZ_ORDER[Math.floor(hash(k) * 4) % 4];

/** One lozenge drawn at (cx, cy), radius LOZ_R, using a shared sphere-shade gradient id. */
const LozDot: React.FC<{ cx: number; cy: number; color: LozengeColor; spin: number; shade: string; r?: number }> = ({ cx, cy, color, spin, shade, r = LOZ_R }) => {
  const c = LOZ_COLS[color];
  return (
    <g transform={`translate(${n2(cx)} ${n2(cy)})`}>
      <circle r={r} fill={c.base} />
      <g transform={`rotate(${n2(spin)})`} fill="none" strokeLinecap="round">
        <path d={`M ${-0.75 * r} ${-0.2 * r} Q 0 ${-0.75 * r} ${0.7 * r} ${-0.05 * r}`} stroke={c.swirl} strokeWidth={r * 0.2} opacity={0.75} />
        <path d={`M ${-0.65 * r} ${0.35 * r} Q ${0.05 * r} ${-0.05 * r} ${0.6 * r} ${0.5 * r}`} stroke={c.swirl2 ?? c.swirl} strokeWidth={r * 0.16} opacity={0.65} />
      </g>
      <circle r={r} fill={`url(#${shade})`} />
      <ellipse cx={-0.33 * r} cy={-0.38 * r} rx={0.22 * r} ry={0.15 * r} fill="#ffffff" opacity={0.85} transform={`rotate(-30 ${n2(-0.33 * r)} ${n2(-0.38 * r)})`} />
    </g>
  );
};

export interface LozengeProps {
  x: number;
  y: number;
  s?: number;
  color?: LozengeColor;
  spin?: number;
}

/** One round marble-lozenge. x, y = its centre. */
export const Lozenge: React.FC<LozengeProps> = ({ x, y, s = 1, color = "red", spin = 0 }) => {
  const id = useUid();
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <SphereShade id={`${id}g`} dark={0.4} light={0.3} />
      </defs>
      <LozDot cx={0} cy={0} color={color} spin={spin} shade={`${id}g`} />
    </g>
  );
};

/* The jar (cm, base contact at 0, 0). */
const JAR = { rb: 6.4, ryb: 1.6, shoulder: -14.5, neck: 4.8, neckY: -17.2, lip: 5.3, rimY: -19.2, rimRy: 1.3, lidH: 2.6 };
const JAR_SHAPE = `M -6.4 0 A 6.4 1.6 0 0 0 6.4 0 L 6.4 -14.5 Q 6.4 -16.6 4.8 -17.2 L 4.8 -18.4 L 5.3 -18.6 L 5.3 -19.2 L -5.3 -19.2 L -5.3 -18.6 L -4.8 -18.4 L -4.8 -17.2 Q -6.4 -16.6 -6.4 -14.5 Z`;
const JAR_INNER = `M -5.95 -0.6 A 5.95 1.3 0 0 0 5.95 -0.6 L 5.95 -14.4 Q 5.95 -16.2 4.4 -16.9 L 4.4 -19.4 L -4.4 -19.4 L -4.4 -16.9 Q -5.95 -16.2 -5.95 -14.4 Z`;
const LID_C = { x: 0, y: -20.5 };

const lidPose = (lidOpen: number) => {
  const o = EASE.inOut(clamp(lidOpen));
  return { dx: 4.2 * o, dy: -5.6 * o, ang: 20 * o, o };
};

/** The jar's lozenges (cm): rows from the bottom up to the fill level, back to front. */
const jarLozenges = (fill: number, seed: number) => {
  const out: { x: number; y: number; c: LozengeColor; sp: number }[] = [];
  const top = -1.2 - clamp(fill) * 15.6;
  let row = 0;
  for (let yy = -1.3; yy > top; yy -= 1.25, row++) {
    const half = yy < -14.6 ? 4.6 - (yy + 14.6) * -0.9 : 5.4;
    for (let xx = -half + (row % 2 ? 0.75 : 0.1); xx <= half; xx += 1.45) {
      const k = seed * 101 + row * 13 + Math.round(xx * 7);
      const jy = yy + 0.25 * (hash(k + 5) - 0.5);
      if (jy < top - 0.4 * hash(k + 7)) continue;
      out.push({ x: xx + 0.25 * (hash(k + 3) - 0.5), y: jy, c: lozColorAt(k), sp: hash(k + 1) * 360 });
    }
  }
  return out;
};

export interface LozengeJarProps {
  x: number;
  y: number;
  s?: number;
  /** 0 closed .. 1 the lid lifted by its knob and swung back to the right. */
  lidOpen?: number;
  /** 0 empty .. 1 full. Default 0.85. */
  fill?: number;
  seed?: number;
}

/** A glass jar with a turned wooden lid, full of round marble-lozenges. x, y = the base contact (bottom centre). */
export const LozengeJar: React.FC<LozengeJarProps> = ({ x, y, s = 1, lidOpen = 0, fill = 0.85, seed = 0 }) => {
  const id = useUid();
  const L = lidPose(lidOpen);
  const loz = jarLozenges(fill, seed);
  const topLevel = -1.2 - clamp(fill) * 15.6;
  return (
    <g transform={tf(x, y, s)}>
      <defs>
        <SphereShade id={`${id}g`} dark={0.42} light={0.28} />
        <clipPath id={`${id}i`}>
          <path d={JAR_INNER} />
        </clipPath>
        <clipPath id={`${id}j`}>
          <path d={JAR_SHAPE} />
        </clipPath>
        <clipPath id={`${id}m`}>
          <ellipse cx={0} cy={JAR.rimY} rx={4.6} ry={1.05} />
        </clipPath>
        <linearGradient id={`${id}w`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#b07c44" />
          <stop offset="0.4" stopColor="#8e5e30" />
          <stop offset="1" stopColor="#5e3c1c" />
        </linearGradient>
        <linearGradient id={`${id}t`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#a8cfc4" stopOpacity={0.5} />
          <stop offset="0.12" stopColor="#d7ece6" stopOpacity={0.12} />
          <stop offset="0.85" stopColor="#d7ece6" stopOpacity={0.1} />
          <stop offset="1" stopColor="#7fa89c" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <ellipse cx={0.9} cy={0.4} rx={7.6} ry={2.0} fill={SHADOW} opacity={0.3} />
      {/* the glass's back wall, faintly */}
      <path d={JAR_SHAPE} fill="#dff0ea" opacity={0.28} />
      {/* contents behind the glass */}
      <g clipPath={`url(#${id}i)`}>
        {loz.map((p, i) => (
          <LozDot key={i} cx={p.x} cy={p.y} color={p.c} spin={p.sp} shade={`${id}g`} />
        ))}
      </g>
      {/* the glass: tint and thickness at the sides, a thick base, highlights */}
      <path d={JAR_SHAPE} fill={`url(#${id}t)`} />
      <g clipPath={`url(#${id}j)`}>
        <ellipse cx={0} cy={-0.4} rx={6.2} ry={1.5} fill="#a9cfc5" opacity={0.35} />
        <path d="M -4.9 -2.2 L -4.9 -13.6" stroke="#ffffff" strokeWidth={0.75} opacity={0.5} strokeLinecap="round" />
        <path d="M -3.9 -3 L -3.9 -9" stroke="#ffffff" strokeWidth={0.25} opacity={0.35} strokeLinecap="round" />
        <path d="M 5.3 -3 L 5.3 -12.5" stroke="#ffffff" strokeWidth={0.3} opacity={0.3} strokeLinecap="round" />
        <path d="M -5.6 -15.2 Q -5.2 -16.6 -3.9 -17.1" stroke="#ffffff" strokeWidth={0.45} fill="none" opacity={0.45} strokeLinecap="round" />
      </g>
      {/* the rim lip */}
      <rect x={-5.3} y={-19.2} width={10.6} height={0.7} fill="#cfe6df" opacity={0.5} />
      {/* the open mouth (hidden under the closed lid): dark inside, the top lozenges when full */}
      <ellipse cx={0} cy={JAR.rimY} rx={5.3} ry={JAR.rimRy} fill="#cfe6df" opacity={0.7} />
      <ellipse cx={0} cy={JAR.rimY} rx={4.6} ry={1.05} fill="#3a4844" opacity={0.55} />
      {topLevel < -16.6 && (
        <g clipPath={`url(#${id}m)`}>
          {[-3.4, -1.9, -0.5, 1.0, 2.4, 3.6].map((lx, i) => (
            <LozDot key={i} cx={lx} cy={JAR.rimY + 0.5 + 0.25 * (i % 2)} color={lozColorAt(seed * 7 + i)} spin={i * 50} shade={`${id}g`} />
          ))}
        </g>
      )}
      {/* the lid: a turned wooden cap with a knob, lifted by lidOpen */}
      <g transform={`translate(${n2(L.dx)} ${n2(L.dy)}) rotate(${n2(L.ang)} ${LID_C.x} ${LID_C.y})`}>
        {L.o > 0.02 && <ellipse cx={0} cy={-18.9} rx={5.7} ry={1.4} fill="#4a2e14" />}
        <path d="M -5.7 -21.6 L -5.7 -19.2 A 5.7 1.4 0 0 0 5.7 -19.2 L 5.7 -21.6 Z" fill={`url(#${id}w)`} />
        <path d="M -5.7 -20.4 A 5.7 1.4 0 0 0 5.7 -20.4" stroke="#5a3a1a" strokeWidth={0.12} fill="none" opacity={0.5} />
        <ellipse cx={0} cy={-21.6} rx={5.7} ry={1.4} fill="#a8743e" />
        <ellipse cx={0} cy={-21.6} rx={4.2} ry={1.0} fill="none" stroke="#7a4e28" strokeWidth={0.12} opacity={0.5} />
        <path d={arc(5.0, 1.2, 195, 260, 0, -21.6, 8)} stroke="#e2b47a" strokeWidth={0.3} fill="none" opacity={0.6} strokeLinecap="round" />
        <rect x={-0.5} y={-22.7} width={1.0} height={1.1} fill="#7a4e28" />
        <ellipse cx={0} cy={-23.2} rx={1.2} ry={0.85} fill="#94623a" />
        <ellipse cx={-0.35} cy={-23.45} rx={0.45} ry={0.28} fill="#e2b47a" opacity={0.6} />
      </g>
    </g>
  );
};

/**
 * World anchors of the jar: base, mouth (centre of the opening), lidKnob (follows lidOpen: the fingers hold it
 * there), lidCentre, gripL / gripR (the body's sides at mid-height, for two hands), top (the lid's top when closed).
 */
export const lozengeJarAnchors = ({ x, y, s = 1, lidOpen = 0 }: LozengeJarProps) => {
  const L = lidPose(lidOpen);
  const a = rad(L.ang);
  const lidPt = (p: Pt): Pt => {
    const dx = p.x - LID_C.x;
    const dy = p.y - LID_C.y;
    return { x: LID_C.x + dx * Math.cos(a) - dy * Math.sin(a) + L.dx, y: LID_C.y + dx * Math.sin(a) + dy * Math.cos(a) + L.dy };
  };
  const P = (p: Pt) => place(p, x, y, s);
  return {
    base: P({ x: 0, y: 0 }),
    mouth: P({ x: 0, y: JAR.rimY }),
    lidKnob: P(lidPt({ x: 0, y: -23.2 })),
    lidCentre: P(lidPt(LID_C)),
    gripL: P({ x: -JAR.rb, y: -8 }),
    gripR: P({ x: JAR.rb, y: -8 }),
    top: P({ x: 0, y: -24 }),
  };
};

export interface PaperTwistProps {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  /** 0 empty .. 1 brimming (lozenges peep out above the rim). */
  fill?: number;
  seed?: number;
}

const TW = { mouthY: -6.5, rx: 3.8, ry: 1.25, tip: { x: 0.35, y: 8.2 } };

/** The jagged front rim of the twist (from right to left through the front). */
const twistRim = (seed: number) => {
  let d = "";
  for (let i = 0; i <= 14; i++) {
    const a = rad((i / 14) * 180);
    const j = 0.18 * (hash(seed + i) - 0.5);
    d += ` L ${n2(TW.rx * Math.cos(a))} ${n2(TW.mouthY + TW.ry * Math.sin(a) + j)}`;
  }
  return d;
};

/** A ঠোঙা: a cone of old newsprint-like paper (no legible text) with lozenges peeping out. x, y = the grip. */
export const PaperTwist: React.FC<PaperTwistProps> = ({ x, y, s = 1, rot = 0, fill = 0.7, seed = 0 }) => {
  const id = useUid();
  const f = clamp(fill);
  // the body: tip -> the jagged front rim from the left side through the front to the right side -> tip
  const front = twistRim(seed);
  const cone = `M ${TW.tip.x} ${TW.tip.y}${front} Z`;
  const rimLine = "M" + front.replace(/^ L/, "");
  // lozenges at the mouth: count and rise with fill
  const nLoz = Math.round(f * 7);
  const spots = [
    { x: -1.6, y: 0.1 },
    { x: 0.2, y: -0.25 },
    { x: 1.9, y: 0.05 },
    { x: -0.7, y: 0.55 },
    { x: 1.1, y: 0.6 },
    { x: -2.5, y: 0.6 },
    { x: 0.4, y: -0.95 },
  ];
  const rise = -0.9 + 1.6 * f;
  return (
    <g transform={tf(x, y, s, rot)}>
      <defs>
        <SphereShade id={`${id}g`} dark={0.4} light={0.3} />
        <clipPath id={`${id}c`}>
          <path d={cone} />
        </clipPath>
        <linearGradient id={`${id}p`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#f1e8cf" />
          <stop offset="0.55" stopColor="#ded2b2" />
          <stop offset="1" stopColor="#bfb08a" />
        </linearGradient>
      </defs>
      {/* the inside of the cone and its back rim */}
      <ellipse cx={0} cy={TW.mouthY} rx={TW.rx} ry={TW.ry} fill="#d6cbaa" />
      <ellipse cx={0} cy={TW.mouthY + 0.15} rx={TW.rx - 0.3} ry={TW.ry - 0.2} fill="#5e5238" opacity={0.85} />
      {spots.slice(0, nLoz).map((p, i) => (
        <LozDot key={i} cx={p.x} cy={TW.mouthY + p.y - rise} color={lozColorAt(seed * 11 + i + 3)} spin={i * 67} shade={`${id}g`} />
      ))}
      {/* the paper cone */}
      <path d={cone} fill={`url(#${id}p)`} />
      <g clipPath={`url(#${id}c)`}>
        {/* newsprint: rows of tiny grey marks, no legible text, and a column rule */}
        <g fill="#6e6656" opacity={0.32}>
          {Array.from({ length: 15 }, (_, r) => {
            const yy = -5.6 + r * 0.78;
            const marks: React.ReactNode[] = [];
            let xx = -4 + 0.6 * hash(seed + r);
            let k = 0;
            while (xx < 4) {
              const len = 0.2 + 0.7 * hash(seed * 3 + r * 17 + k);
              marks.push(<rect key={k} x={xx} y={yy} width={len} height={0.14} />);
              xx += len + 0.16 + (hash(r * 5 + k) > 0.85 ? 0.4 : 0);
              k++;
            }
            return <g key={r}>{marks}</g>;
          })}
        </g>
        <line x1={0.9} y1={-6} x2={0.6} y2={8} stroke="#6e6656" strokeWidth={0.08} opacity={0.3} />
        <rect x={-1.6} y={-2.3} width={2.2} height={1.4} fill="#6e6656" opacity={0.1} />
        {/* the overlapping spiral edge of the wrapped paper */}
        <path d={`M 3.4 ${TW.mouthY + 0.6} Q 1.6 -1 -0.2 5.6`} stroke="#a89a74" strokeWidth={0.16} fill="none" opacity={0.75} />
        <path d={`M 3.4 ${TW.mouthY + 0.6} Q 1.6 -1 -0.2 5.6 L 1.2 ${TW.mouthY + 2} Z`} fill="#ffffff" opacity={0.1} />
        {/* the twisted tip */}
        <path d="M -0.4 6.6 L 0.9 7.2 M -0.2 7.3 L 0.8 7.7" stroke="#9a8c66" strokeWidth={0.1} opacity={0.6} />
      </g>
      {/* the rolled front rim */}
      <path d={rimLine} stroke="#f6efdb" strokeWidth={0.28} fill="none" opacity={0.75} strokeLinejoin="round" />
    </g>
  );
};

/** World anchors of the twist: grip (x, y), tip, mouth centre and the rim's two sides. */
export const paperTwistAnchors = ({ x, y, s = 1, rot = 0 }: PaperTwistProps) => {
  const P = (lx: number, ly: number) => place({ x: lx, y: ly }, x, y, s, rot);
  return { grip: P(0, 0), tip: P(TW.tip.x, TW.tip.y), mouth: P(0, TW.mouthY), mouthL: P(-TW.rx, TW.mouthY), mouthR: P(TW.rx, TW.mouthY) };
};
