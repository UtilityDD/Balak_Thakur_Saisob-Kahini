import React from "react";
import { hash } from "../../cinematic/core/anim";

/**
 * Bullock cart (gaorur gari) for Episode 2, drawn in cart-local units. These are the same units as
 * the Puppet figures, so a cart scaled to a rider's scale sits at the right size.
 *
 * Frame: the road is y = 0, the cart's centre is x = 0, and the cart faces right, so the bullock
 * pair stands at +x, harnessed to the shaft. The deck top is DECK_Y. A seated Puppet has its origin
 * at SEAT_Y, which puts its hips on the deck.
 *
 * Motion is driven by distance travelled, so the feet stay planted: `step` is the bullock gait phase
 * (radians), `roll` the wheel angle (radians), and `walk` (0 to 1) the stride amount. Passing
 * step = distance / (scale * STEP_LEN) * 2 pi and roll = distance / (scale * WHEEL_R) keeps every hoof
 * and rim on the ground. `dust` (0 to 1) puffs dust at the wheels, and `f` (the frame) drives it.
 *
 * `close` draws the foreground version: a broad-headed zebu with horns, hump, dewlap and jointed, tapering legs,
 * spoked wheels with shaded rims and hubs, a planked wooden body with grain, and a canopy that lets
 * the riders show through. The riders are passed in as Puppet figures, drawn over the canopy with
 * `ridersOverCanopy`. The default (close = false) is unchanged, for the distant shots.
 */

export const DECK_Y = -150;
/** A seated Puppet's origin (its feet line) sits this far above the road, so its hips land on the deck. */
export const SEAT_Y = -113;
export const WHEEL_R = 100;
const LEG_LEN = 120;
const LEG_A = 0.3;
/** Distance (cart-local units) covered by one full bullock gait cycle: each leg's stance covers half of it. */
export const STEP_LEN = 4 * LEG_LEN * LEG_A;

const WOOD = "#7a4e2a";
const WOOD_LIGHT = "#8a6a3a";
const WOOD_DARK = "#4a2c14";
const CLOTH = "#c9b48a";
const DUST = "#d8c7a2";
const HOOF = "#2e2620";
const INK = "#1d1512";
const HORN = "#efe6cf";
const GOLD = "#d9a441";
const UMBRELLA = "#c8553a";

/** Colours of the close-up bullocks: the near one is lighter, the far one sits in shadow. */
const NEAR_BULLOCK = { c: "#8c7a62", shade: "#5e4c38", far: "#6e604c" };
const FAR_BULLOCK = { c: "#6e604c", shade: "#4a3c2e", far: "#4a3c2e" };

const Leg: React.FC<{ hx: number; hy: number; ang: number; w: number; color: string }> = ({ hx, hy, ang, w, color }) => (
  <g transform={`translate(${hx}, ${hy}) rotate(${ang})`}>
    <rect x={-w / 2} y={-4} width={w} height={LEG_LEN + 4} rx={w / 2} fill={color} />
    <rect x={-w / 2 - 1} y={LEG_LEN - 8} width={w + 2} height={8} rx={2} fill={HOOF} />
  </g>
);

/** A tapered limb segment from (x1, y1), width w1, to (x2, y2), width w2, with rounded ends. */
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

/** Share of the gait cycle a hoof spends on the ground (a walk keeps each hoof down well over half the time). */
const STANCE = 0.62;
/** Height of the fetlock above the road when the hoof is planted. */
const HOOF_H = 13;

/**
 * A close-up jointed leg for the foreground bullocks. The hip (or shoulder) is at (hx, hy) and the road
 * at hy + LEG_LEN. The leg is two bones solved to the hoof: a broad shoulder or haunch that tapers to the
 * joint, then a slim cannon down to a knobbed fetlock and the hoof. Forelegs bend at the knee (it points
 * forward), hind legs at the hock (it points back).
 *
 * Gait: over one cycle the hoof is planted for STANCE of it, sliding back under the body by exactly the
 * distance the cart covers (so it stays still on the road), then lifts, folds and swings forward.
 * `phase` is the cycle position in radians; `walk` (0 to 1) scales the stride, so the legs settle square
 * when the cart stops.
 */
const LegJointed: React.FC<{
  hx: number;
  hy: number;
  phase: number;
  walk: number;
  hind: boolean;
  w: number;
  color: string;
  shade: string;
}> = ({ hx, hy, phase, walk, hind, w, color, shade }) => {
  const p = (((phase / (2 * Math.PI)) % 1) + 1) % 1;
  const reach = (STEP_LEN * STANCE) / 2;
  let hoofX: number;
  let lift = 0;
  let swingK = 0;
  if (p < STANCE) {
    hoofX = reach * (1 - (2 * p) / STANCE);
  } else {
    const s = (p - STANCE) / (1 - STANCE);
    hoofX = -reach + 2 * reach * (0.5 - 0.5 * Math.cos(Math.PI * s));
    swingK = Math.sin(Math.PI * s);
    lift = (hind ? 20 : 26) * swingK;
  }
  hoofX *= walk;
  lift *= walk;
  swingK *= walk;
  // Two-bone solve from the hip to the fetlock.
  const upper = hind ? 58 : 56;
  const lower = 62;
  const tx = hoofX + (hind ? -4 : 4);
  const ty = LEG_LEN - HOOF_H - lift;
  const d = Math.min(upper + lower - 0.5, Math.max(Math.abs(upper - lower) + 1, Math.hypot(tx, ty)));
  const base = Math.atan2(ty, tx);
  const bend = Math.acos(Math.min(1, Math.max(-1, (upper * upper + d * d - lower * lower) / (2 * upper * d))));
  const ja = hind ? base + bend : base - bend;
  const jx = Math.cos(ja) * upper;
  const jy = Math.sin(ja) * upper;
  const k = d / (Math.hypot(tx, ty) || 1);
  const fx = tx * k;
  const fy = ty * k;
  // The top of the leg starts inside the body, broad at the shoulder or haunch.
  const ux = -Math.cos(ja) * 30;
  const uy = -Math.sin(ja) * 30;
  const topW = w * (hind ? 2.3 : 2.0);
  const jointW = w * (hind ? 0.9 : 0.82);
  const fetW = w * 0.5;
  // Lower leg direction (degrees from straight down), and the hoof folding back in the swing.
  const lowerDeg = (Math.atan2(fx - jx, fy - jy) * 180) / Math.PI;
  const hoofRot = swingK * ((hind ? 22 : 34) - 0.5 * lowerDeg);
  // Perpendicular offset toward the back of the cannon, for the tendon shading.
  const ll = Math.hypot(fx - jx, fy - jy) || 1;
  const bx = ((fy - jy) / ll) * w * 0.16;
  const by = (-(fx - jx) / ll) * w * 0.16;
  return (
    <g transform={`translate(${hx}, ${hy})`}>
      {/* shoulder or haunch tapering to the forearm or gaskin */}
      <path d={taperPath(ux, uy, topW, jx, jy, jointW)} fill={color} />
      <path d={taperPath(ux * 0.4, uy * 0.4 + 6, topW * 0.35, jx, jy, jointW * 0.3)} fill={shade} opacity={0.28} />
      {/* cannon, slimmer than the bone above */}
      <path d={taperPath(jx, jy, jointW * 0.86, fx, fy, fetW)} fill={color} />
      <path d={`M ${(jx + bx).toFixed(2)} ${(jy + by).toFixed(2)} L ${(fx + bx).toFixed(2)} ${(fy + by).toFixed(2)}`} stroke={shade} strokeWidth={w * 0.2} strokeLinecap="round" opacity={0.45} />
      {/* knee or hock: a bony knob with a shaded underside */}
      <ellipse cx={jx} cy={jy} rx={jointW * 0.6} ry={jointW * 0.66} fill={color} />
      <path
        d={`M ${(jx - jointW * 0.5).toFixed(2)} ${(jy + jointW * 0.2).toFixed(2)} Q ${jx.toFixed(2)} ${(jy + jointW * 0.75).toFixed(2)} ${(jx + jointW * 0.5).toFixed(2)} ${(jy + jointW * 0.2).toFixed(2)}`}
        stroke={shade}
        strokeWidth={2}
        fill="none"
        opacity={0.55}
      />
      {/* fetlock, dewclaw and the cloven hoof */}
      <circle cx={fx} cy={fy} r={fetW * 0.62} fill={color} />
      <g transform={`translate(${fx.toFixed(2)}, ${fy.toFixed(2)}) rotate(${hoofRot.toFixed(2)})`}>
        <circle cx={hind ? -fetW * 0.55 : -fetW * 0.5} cy={-1} r={2.4} fill={HOOF} />
        <path d={`M ${-fetW * 0.55} 0 L ${fetW * 0.55} 0 L ${fetW * 0.8} ${HOOF_H} L ${-fetW * 0.62} ${HOOF_H} Z`} fill={HOOF} />
        <line x1={fetW * 0.1} y1={HOOF_H * 0.35} x2={fetW * 0.14} y2={HOOF_H} stroke="#6b5a4a" strokeWidth={1.2} opacity={0.8} />
        <line x1={-fetW * 0.5} y1={1.5} x2={fetW * 0.3} y2={1.5} stroke="#6b5a4a" strokeWidth={1.4} opacity={0.6} />
      </g>
    </g>
  );
};

/**
 * A zebu bullock facing right: hump, dewlap, yoke pad, horns, and a tail that swishes. Legs swing
 * about the hip in a four-beat walk (near hind, near fore, far hind, far fore, a quarter cycle apart),
 * so each hoof stays on the ground line while the cart moves.
 */
const Bullock: React.FC<{ x: number; y: number; s: number; step: number; walk: number; c: string; shade: string; far: string }> = ({
  x,
  y,
  s,
  step,
  walk,
  c,
  shade,
  far,
}) => {
  const swing = (off: number) => -walk * LEG_A * Math.sin(step + off * 2 * Math.PI) * (180 / Math.PI);
  const bob = (walk * -2.2 * (1 - Math.cos(2 * step))) / 2;
  const tail = walk * 8 * Math.sin(step);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <Leg hx={-104} hy={-120} ang={swing(0)} w={22} color={far} />
      <Leg hx={96} hy={-120} ang={swing(0.5)} w={22} color={far} />
      <g transform={`rotate(${tail}, -150, -196)`}>
        <path d="M -150 -196 Q -178 -150 -170 -92" stroke={shade} strokeWidth={6} fill="none" strokeLinecap="round" />
        <ellipse cx={-170} cy={-84} rx={9} ry={15} fill={shade} />
      </g>
      <g transform={`translate(0, ${bob})`}>
        <ellipse cx={-10} cy={-174} rx={150} ry={64} fill={c} />
        <ellipse cx={-14} cy={-140} rx={128} ry={18} fill={shade} opacity={0.35} />
        <ellipse cx={-14} cy={-236} rx={46} ry={26} fill={c} />
        <path d="M 92 -206 Q 118 -232 124 -262 L 160 -266 Q 150 -214 110 -150 Z" fill={c} />
        <path d="M 122 -226 Q 100 -200 96 -176 Q 124 -186 134 -214 Z" fill={shade} opacity={0.5} />
        <path d="M 118 -254 Q 92 -270 86 -248 Q 106 -240 124 -244 Z" fill={shade} />
        <path d="M 138 -276 Q 136 -304 156 -312" stroke="#efe6cf" strokeWidth={7} fill="none" strokeLinecap="round" />
        <ellipse cx={152} cy={-252} rx={42} ry={30} fill={c} />
        <ellipse cx={188} cy={-244} rx={20} ry={15} fill="#e8dfc9" />
        <circle cx={200} cy={-246} r={2.4} fill={INK} />
        <circle cx={158} cy={-262} r={4} fill={INK} />
        <circle cx={159.2} cy={-263.4} r={1.2} fill="#fff8ec" />
        <rect x={96} y={-234} width={36} height={10} rx={4} fill={WOOD_DARK} transform="rotate(-12 114 -229)" />
      </g>
      <Leg hx={-88} hy={-120} ang={swing(0.25)} w={24} color={shade} />
      <Leg hx={80} hy={-120} ang={swing(0.75)} w={24} color={shade} />
    </g>
  );
};

/**
 * A small brass neck bell on a cord, hanging from (x, y). `ang` is its swing in degrees (0 hangs straight
 * down); the clapper lags the shell a little.
 */
const NeckBell: React.FC<{ x: number; y: number; ang: number; size?: number }> = ({ x, y, ang, size = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${ang}) scale(${size})`}>
    <line x1={0} y1={0} x2={0} y2={8} stroke="#5a3a1a" strokeWidth={2} strokeLinecap="round" />
    <circle cx={0} cy={7.5} r={2.2} fill="#8a6424" />
    <g transform={`rotate(${-ang * 0.35}, 0, 10)`}>
      <circle cx={0} cy={23} r={2.4} fill="#4a3214" />
    </g>
    <path d="M -7.5 21 Q -8 9 0 8 Q 8 9 7.5 21 Z" fill={GOLD} />
    <rect x={-8.5} y={19.5} width={17} height={3.2} rx={1.6} fill="#a87a28" />
    <path d="M -4.2 18 Q -4.4 11.6 0 10.6" stroke="#f6dc94" strokeWidth={1.5} fill="none" opacity={0.85} strokeLinecap="round" />
  </g>
);

/** Hang points of the neck bells on the close bullock's collar (bullock-local units), throat side first. */
const BELL_HANG: Array<[number, number]> = [
  [150, -222],
  [140, -234],
  [158, -210],
];

/**
 * A close-framed zebu bullock facing right, drawn large for the foreground cart. It has a broad head
 * with a pale muzzle and two horns, a fleshy hump over the withers, a dewlap of loose skin folds under
 * the throat, a swishing tail and four jointed legs (LegJointed: tapering from shoulder and haunch, with
 * knees, hocks and fetlocks) in a four-beat walk with planted hooves, so the cart's distance drives it.
 *
 * The head and neck nod about the withers with each forefoot plant (twice a gait cycle), and `bells`
 * brass bells on a red collar swing a little behind the nod, settling as the walk stops.
 */
const CloseBullock: React.FC<{
  x: number;
  y: number;
  s: number;
  step: number;
  walk: number;
  c: string;
  shade: string;
  far: string;
  bells?: number;
}> = ({ x, y, s, step, walk, c, shade, far, bells = 0 }) => {
  // Four-beat lateral walk: far hind, far fore, near hind, near fore touch down a quarter cycle apart.
  const legPhase = (off: number) => step + off * 2 * Math.PI;
  const bob = (walk * -2.2 * (1 - Math.cos(2 * step))) / 2;
  const tail = walk * 9 * Math.sin(step);
  // Head nod: the head dips as each foreleg plants (twice per gait cycle), pivoting at the withers.
  const nod = walk * 4.2 * Math.sin(2 * step - 0.6);
  // Bells hang plumb (counter the nod), then swing behind the nod's rhythm.
  const bellSwing = (i: number) => -nod + walk * (16 + 4 * i) * Math.sin(2 * step - 1.7 - i * 0.55);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <LegJointed hx={-104} hy={-120} phase={legPhase(0)} walk={walk} hind w={22} color={far} shade={shade} />
      <LegJointed hx={96} hy={-120} phase={legPhase(0.75)} walk={walk} hind={false} w={22} color={far} shade={shade} />
      <g transform={`rotate(${tail}, -152, -200)`}>
        <path d="M -152 -200 Q -184 -150 -176 -96" stroke={shade} strokeWidth={7} fill="none" strokeLinecap="round" />
        <ellipse cx={-176} cy={-86} rx={11} ry={18} fill={shade} />
        <path d="M -178 -104 q -6 6 -2 14" stroke="#2e2620" strokeWidth={2} fill="none" opacity={0.5} />
      </g>
      <g transform={`translate(0, ${bob})`}>
        {/* barrel body, with a fleshy hump over the withers and a shaded belly */}
        <ellipse cx={-6} cy={-170} rx={150} ry={60} fill={c} />
        <ellipse cx={-4} cy={-112} rx={132} ry={16} fill={shade} opacity={0.35} />
        <ellipse cx={58} cy={-248} rx={54} ry={34} fill={c} />
        <ellipse cx={52} cy={-258} rx={30} ry={16} fill={shade} opacity={0.25} />
        <path d="M 14 -232 Q 58 -262 100 -236" stroke={shade} strokeWidth={2} fill="none" opacity={0.35} />
        <g transform={`rotate(${nod}, 92, -214)`}>
        {/* neck, dewlap and the wooden yoke */}
        <path d="M 70 -196 Q 124 -222 150 -270" stroke={c} strokeWidth={62} strokeLinecap="round" fill="none" />
        <path d="M 118 -206 Q 140 -190 150 -160" stroke={shade} strokeWidth={22} strokeLinecap="round" fill="none" opacity={0.45} />
        <path d="M 112 -204 Q 128 -178 122 -150 Q 114 -166 104 -180 Z" fill={shade} opacity={0.6} />
        <path d="M 132 -196 Q 150 -170 146 -144 Q 138 -160 128 -170 Z" fill={shade} opacity={0.5} />
        <path d="M 122 -190 Q 134 -176 132 -160" stroke="#2e2620" strokeWidth={1.4} fill="none" opacity={0.45} />
        <rect x={112} y={-244} width={40} height={11} rx={5} fill={WOOD_DARK} transform="rotate(-14 132 -238)" />
        {/* far horn and far ear, behind the head */}
        <path d="M 150 -300 Q 136 -342 160 -364" stroke="#cfc3a6" strokeWidth={10} fill="none" strokeLinecap="round" />
        <ellipse cx={130} cy={-300} rx={28} ry={12} transform="rotate(-24 130 -300)" fill={shade} />
        {/* broad head */}
        <ellipse cx={180} cy={-284} rx={52} ry={40} fill={c} />
        <ellipse cx={170} cy={-306} rx={30} ry={8} fill={shade} opacity={0.3} />
        {/* near ear, near horn, pale muzzle, nostril and eye */}
        <ellipse cx={156} cy={-300} rx={30} ry={13} transform="rotate(-18 156 -300)" fill={shade} />
        <path d="M 176 -316 Q 170 -356 196 -370" stroke={HORN} strokeWidth={11} fill="none" strokeLinecap="round" />
        <ellipse cx={212} cy={-262} rx={28} ry={26} fill="#dcd0b6" />
        <circle cx={224} cy={-266} r={3} fill={shade} />
        <ellipse cx={220} cy={-252} rx={5} ry={2.4} fill={shade} opacity={0.5} />
        <circle cx={194} cy={-292} r={4.5} fill={INK} />
        <circle cx={195.4} cy={-293.4} r={1.4} fill="#fff8ec" />
        {/* red neck collar with a few brass bells at the throat */}
        {bells > 0 && (
          <g>
            <path d="M 108 -264 Q 132 -238 160 -206" stroke="#a8322a" strokeWidth={6} fill="none" strokeLinecap="round" />
            <path d="M 108 -266 Q 132 -240 160 -208" stroke="#d65a44" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.7} />
            {BELL_HANG.slice(0, bells).map(([bx, by], i) => (
              <NeckBell key={i} x={bx} y={by} ang={bellSwing(i)} size={i === 0 ? 1.1 : 0.9} />
            ))}
          </g>
        )}
        </g>
      </g>
      <LegJointed hx={-88} hy={-120} phase={legPhase(0.5)} walk={walk} hind w={24} color={c} shade={shade} />
      <LegJointed hx={80} hy={-120} phase={legPhase(0.25)} walk={walk} hind={false} w={24} color={c} shade={shade} />
    </g>
  );
};

/** Spoked wheel with a rim lug, so the roll reads as the wheel turns. Hub at (cx, -WHEEL_R), touching the road. */
const Wheel: React.FC<{ cx: number; roll: number }> = ({ cx, roll }) => (
  <g transform={`translate(${cx}, ${-WHEEL_R})`}>
    <circle r={WHEEL_R - 6} fill="none" stroke={WOOD_DARK} strokeWidth={12} />
    <g transform={`rotate(${(roll * 180) / Math.PI})`}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={0} y1={0} x2={Math.cos(a) * (WHEEL_R - 10)} y2={Math.sin(a) * (WHEEL_R - 10)} stroke={WOOD} strokeWidth={5} strokeLinecap="round" />;
      })}
      <circle cx={WHEEL_R - 6} cy={0} r={5} fill="#2a1a0e" />
      <circle cx={-(WHEEL_R - 6)} cy={0} r={5} fill="#2a1a0e" />
      <circle r={13} fill="#3a2010" />
    </g>
  </g>
);

/**
 * The foreground wheel: a dark felloe with a lit upper-left edge, eight spokes each with a lit side
 * (so they turn in the light), rim lugs and a nail-head hub. Hub at (cx, -WHEEL_R), touching the road.
 */
const WheelClose: React.FC<{ cx: number; roll: number }> = ({ cx, roll }) => (
  <g transform={`translate(${cx}, ${-WHEEL_R})`}>
    <circle r={WHEEL_R - 6} fill="none" stroke="#2a1a0e" strokeWidth={14} />
    <path d="M -88.3 -32.1 A 94 94 0 0 1 -47 -81.4" stroke={WOOD_LIGHT} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.75} />
    <g transform={`rotate(${(roll * 180) / Math.PI})`}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        const ex = Math.cos(a) * (WHEEL_R - 10);
        const ey = Math.sin(a) * (WHEEL_R - 10);
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
);

/** Dust puffs that rise and drift back behind a wheel. `amount` 0 to 1 scales them; they are absent at 0. */
const Dust: React.FC<{ f: number; x: number; amount: number; seed: number }> = ({ f, x, amount, seed }) => {
  if (amount < 0.01) return null;
  const T = 26;
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const a = ((((f + i * (T / 3) + seed * 7) % T) + T) % T) / T;
        const px = x - 24 - 64 * a;
        const py = -2 - 28 * a;
        const r = 6 + 18 * a + 3 * hash(i + seed);
        return <circle key={i} cx={px} cy={py} r={r} fill={DUST} opacity={amount * 0.5 * Math.sin(Math.PI * a)} />;
      })}
    </g>
  );
};

export interface BullockCartProps {
  /** Wheel angle in radians (distance / WHEEL_R). */
  roll: number;
  /** Bullock gait phase in radians (distance / STEP_LEN * 2 pi). */
  step: number;
  /** Stride amount: 0 standing, 1 walking. */
  walk: number;
  /** Dust at the wheels: 0 none, 1 full. */
  dust: number;
  /** Frame number, which drives the dust. */
  f: number;
  /** Riders on the deck, in cart-local units (drawn under the canopy unless ridersOverCanopy is set). */
  riders?: React.ReactNode;
  /** Draw the riders over the canopy cloth, so they read in a shot where the canopy would hide them. */
  ridersOverCanopy?: boolean;
  /** Foreground version: close-up bullocks, shaded spoked wheels, a planked body and a canopy the riders show through. */
  close?: boolean;
  /**
   * Road roughness, 0 (smooth or at rest) to 1: each wheel rides over a small rut once per spoke of turn,
   * lifting it a few units, and the body, canopy and riders ride up and pitch with the two wheels.
   */
  road?: number;
  /** Brass bells on the close bullocks' necks (0 to 3 each); they swing with the walk. */
  bells?: number;
}

/** Peak lift of a wheel over a rut, in cart-local units. */
const RUT_LIFT = 3.4;
/** A narrow lift pulse once per spoke (8 per turn), so the jolts keep the wheels' rhythm. */
const rut = (roll: number, phase: number) => Math.pow(0.5 - 0.5 * Math.cos(roll * 8 + phase), 10);

/** The cart: a wooden body, two spoked wheels, a shaft, a low canopy and a bullock pair in front. */
export const BullockCart: React.FC<BullockCartProps> = ({
  roll,
  step,
  walk,
  dust,
  f,
  riders,
  ridersOverCanopy = false,
  close = false,
  road = 0,
  bells = 0,
}) => {
  // The two wheels meet their ruts a little apart, so the body both rises and rocks.
  const liftFront = -road * RUT_LIFT * rut(roll, 0.7);
  const liftBack = -road * RUT_LIFT * rut(roll, 0.7 - 1.9);
  const bodyLift = (liftFront + liftBack) / 2;
  const pitch = (Math.atan2(liftFront - liftBack, 240) * 180) / Math.PI;
  return (
  <g>
    <ellipse cx={0} cy={-1} rx={236} ry={9} fill="#000" opacity={0.22} />
    {/* the bullock pair, harnessed to the shaft: the far one first, a little behind */}
    {close ? (
      <CloseBullock
        x={440}
        y={-2}
        s={0.96}
        step={step + 0.6}
        walk={walk}
        c={FAR_BULLOCK.c}
        shade={FAR_BULLOCK.shade}
        far={FAR_BULLOCK.far}
        bells={Math.min(2, bells)}
      />
    ) : (
      <Bullock x={446} y={-2} s={0.94} step={step + 0.6} walk={walk} c="#a09684" shade="#645a4c" far="#4d4638" />
    )}
    <path d="M 186 -146 L 470 -152" stroke={WOOD_DARK} strokeWidth={9} strokeLinecap="round" />
    <path d="M 468 -152 L 486 -204" stroke={WOOD_DARK} strokeWidth={8} strokeLinecap="round" />
    {close ? (
      <CloseBullock x={420} y={0} s={1} step={step} walk={walk} c={NEAR_BULLOCK.c} shade={NEAR_BULLOCK.shade} far={NEAR_BULLOCK.far} bells={bells} />
    ) : (
      <Bullock x={420} y={0} s={1} step={step} walk={walk} c="#b8ae9c" shade="#7a7060" far="#5f574a" />
    )}
    {/* two spoked wheels: the rim tops show above the deck, the hubs below it; each lifts over its own rut */}
    <g transform={`translate(0, ${liftBack.toFixed(3)})`}>
      {close ? <WheelClose cx={-120} roll={roll} /> : <Wheel cx={-120} roll={roll} />}
    </g>
    <g transform={`translate(0, ${liftFront.toFixed(3)})`}>
      {close ? <WheelClose cx={120} roll={roll} /> : <Wheel cx={120} roll={roll} />}
    </g>
    {/* the body, canopy and riders ride on the axle: they rise and rock with the wheels */}
    <g transform={`translate(0, ${bodyLift.toFixed(3)}) rotate(${pitch.toFixed(3)})`}>
    {/* wooden body: side boards, top rail, deck planks and underframe */}
    <rect x={-190} y={-180} width={380} height={30} fill={WOOD} />
    <rect x={-196} y={-188} width={392} height={9} rx={3} fill={WOOD_LIGHT} />
    <rect x={-190} y={DECK_Y} width={380} height={24} fill={WOOD_LIGHT} />
    <path d="M -190 -140 H 190 M -190 -131 H 190" stroke={WOOD_DARK} strokeWidth={1.6} opacity={0.6} />
    <rect x={-180} y={-126} width={360} height={10} fill={WOOD_DARK} />
    {close && (
      <g>
        {/* side-board grain, deck plank joints, nail heads and the shadow under the deck */}
        <g fill="none" stroke={WOOD_DARK} strokeLinecap="round">
          {[-168, -120, -70, -20, 30, 80, 130, 168].map((x) => (
            <path key={`g${x}`} d={`M ${x} -176 q 10 7 0 14`} strokeWidth={1.2} opacity={0.5} />
          ))}
          {[-150, -100, -50, 0, 50, 100, 150].map((x) => (
            <line key={`p${x}`} x1={x} y1={DECK_Y} x2={x + 6} y2={DECK_Y + 24} strokeWidth={1.4} opacity={0.6} />
          ))}
        </g>
        {[-170, 170].map((x) => (
          <circle key={`n${x}`} cx={x} cy={-165} r={2} fill="#2a1a0e" />
        ))}
        <rect x={-190} y={-124} width={380} height={4} fill="#000" opacity={0.22} />
      </g>
    )}
    {!ridersOverCanopy && riders}
    {/* low canopy on a bamboo hoop, cloth drawn as a soft arch (translucent in the close version) */}
    <path d="M -186 -150 Q -190 -330 0 -344 Q 190 -330 186 -150 Q 0 -134 -186 -150 Z" fill={CLOTH} opacity={close ? 0.62 : 0.92} />
    <path d="M -172 -150 Q -180 -300 -40 -340 Q 0 -346 40 -340 Q 180 -300 172 -150" stroke={WOOD_LIGHT} strokeWidth={6} fill="none" strokeLinecap="round" />
    {ridersOverCanopy && riders}
    </g>
    <Dust f={f} x={-120} amount={dust} seed={1} />
    <Dust f={f} x={120} amount={dust} seed={4} />
  </g>
  );
};

/** A seated rider in one flat colour, for the distant shot. `x` is the seat along the deck. */
export const SilhouetteRider: React.FC<{ x: number; baby?: boolean; umbrella?: boolean; fill?: string }> = ({
  x,
  baby = false,
  umbrella = false,
  fill = "#2a2034",
}) => (
  <g>
    <rect x={x - 4} y={DECK_Y - 12} width={70} height={14} rx={7} fill={fill} />
    <path d={`M ${x - 24} ${DECK_Y} Q ${x - 28} -222 ${x} -232 Q ${x + 26} -222 ${x + 22} ${DECK_Y} Z`} fill={fill} />
    <circle cx={x} cy={-252} r={19} fill={fill} />
    {baby && <circle cx={x + 16} cy={-198} r={12} fill="#fff7e6" />}
    {umbrella && (
      <g>
        <line x1={x - 8} y1={-236} x2={x - 8} y2={-332} stroke={fill} strokeWidth={5} strokeLinecap="round" />
        <ellipse cx={x - 8} cy={-336} rx={58} ry={14} fill={fill} />
      </g>
    )}
  </g>
);

/**
 * A seated figure for the close cart: a torso in `cloth`, arms on the knees, a head with a hair cap or a
 * veil, and an optional baby held at the lap or a parasol. `x` is the seat along the deck, and the hips
 * sit on DECK_Y. Kept for reference; the Episode 2 cart now seats the walk's Puppet characters instead.
 */
export const CartRider: React.FC<{ x: number; cloth: string; veil?: boolean; baby?: boolean; umbrella?: boolean }> = ({
  x,
  cloth,
  veil = false,
  baby = false,
  umbrella = false,
}) => (
  <g>
    <path d={`M ${x - 17} -208 Q ${x - 36} -186 ${x - 30} -158`} stroke={cloth} strokeWidth={12} fill="none" strokeLinecap="round" />
    <path d={`M ${x + 17} -208 Q ${x + 36} -186 ${x + 30} -158`} stroke={cloth} strokeWidth={12} fill="none" strokeLinecap="round" />
    <path d={`M ${x - 26} ${DECK_Y} Q ${x - 32} -190 ${x - 22} -212 Q ${x} -222 ${x + 22} -212 Q ${x + 32} -190 ${x + 26} ${DECK_Y} Z`} fill={cloth} />
    <rect x={x - 6} y={-226} width={12} height={14} fill="#8a5a36" />
    <circle cx={x} cy={-242} r={18} fill="#8a5a36" />
    {veil ? (
      <path
        d={`M ${x - 24} -224 Q ${x - 30} -266 ${x} -268 Q ${x + 30} -266 ${x + 24} -224 Q ${x + 16} -236 ${x} -238 Q ${x - 16} -236 ${x - 24} -224 Z`}
        fill={cloth}
        stroke={GOLD}
        strokeWidth={3}
      />
    ) : (
      <path d={`M ${x - 18} -240 Q ${x - 19} -262 ${x} -262 Q ${x + 19} -262 ${x + 18} -240 Q ${x + 8} -250 ${x - 18} -240 Z`} fill={INK} />
    )}
    <circle cx={x + 7} cy={-231} r={2.2} fill={INK} />
    {baby && (
      <g>
        <circle cx={x + 14} cy={-186} r={14} fill="#fff7e6" />
        <circle cx={x + 14} cy={-200} r={8} fill="#8a5a36" />
      </g>
    )}
    {umbrella && (
      <g>
        <line x1={x + 12} y1={-222} x2={x + 12} y2={-332} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <ellipse cx={x + 12} cy={-338} rx={62} ry={14} fill={UMBRELLA} />
      </g>
    )}
  </g>
);
