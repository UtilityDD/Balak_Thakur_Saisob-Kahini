import React, { useId } from "react";
import { clamp, lerp, noise1 } from "../../cinematic/core/anim";
import { GentleCow, solveGentleCow, type GentleCowProps } from "../../cinematic/animals/GentleCow";
import { Tortoise, tortoiseHead, tortoiseLengthPx, type Pt, type TortoiseProps } from "../../cinematic/animals/Tortoise";
import { CucumberTrellis, trellisPoint } from "../../cinematic/sets/KrishnanagarKachari";
import type { PropRenderer } from "../../cinematic/rig/Puppet";
import { PebblesArt } from "../../episode03/rig/SeatedChild";
import { ContactShadow, GhibliCutout } from "../GhibliStage";
import { GHIBLI_ANCHORS as EP05_ANCHORS } from "../episode05/plateAnchors";
import { GHIBLI_ANCHORS as EP04_ANCHORS } from "../episode04/plateAnchors";
import { GhibliTippedBasket } from "../episode05/GhibliKachariSet";

/**
 * EPISODE 5 REWRITE: INTERACTIVE PROPS (blueprint 3.4). Contact-friendly SVG in the Ghibli sepia-ink style
 * (stroke #3A2618, warm washes), every hand point given by a pure helper so a hand and the prop agree every frame
 * (MOT-01..07). Draw them inside a <GhibliLayer>; wrappers marked [ink] use the layer's filters, so put
 * <GhibliCharFilterDefs /> once in that layer (it defines #ghibli-char-ink and #ghibli-prop-watercolor).
 * The life clock (lifeF) drives idle life (paddling, chewing, leaf stir); actions are keyed on the story clock.
 * Nothing here glows (BAL-05: the light is Balak's alone).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * API
 * ---------------------------------------------------------------------------------------------------------------
 *  <Ep05Tortoise {...TortoiseProps} hangAt? hang? hangPitch? drop? ink? shadow? />                       [ink]
 *      The shared Tortoise rig (cinematic/animals/Tortoise.tsx: see its header for every state) plus:
 *        turned over / paddling: turnOver 0..1 (+ paddle), righting: key turnOver back to 0; hands on tortoiseGrips().
 *        biting on the ground: bite 0..1 + biteTarget (the hand edge below the little finger), release 0..1.
 *        top view: view "side" + elev about 76 (EP05_TORTOISE_TOP); side view: default elev 14.
 *        HANGING FROM A HAND (new): give hangAt = the child's hand edge (world) and key hang 0 -> 1 as the hand lifts:
 *          the head is out at full reach with the jaws closed on hangAt, the body pitches head-up about the jaws
 *          (up to hangPitch, default 62 deg, never below its own ground line y), swings a little on lifeF and the legs
 *          paddle. At hang 0 the jaws sit at hangAt with the shell level: start the hang with the hand AT
 *          ep05TortoiseJawRest(props) (or place the tortoise with ep05TortoiseAtJaw(hand, props)).
 *          LET GO: key release 0 -> 1 (jaws open), then drop 0 -> 1 over about 8-10 f: it falls from the hang back
 *          to its ground point (x, y), levelling, with a small bounce at the end. Draw the hand BEHIND it.
 *      ep05TortoiseJawRest(p) -> Pt   the jaw tip with the head fully out (the hang's contact point).
 *      ep05TortoiseAtJaw(hand, p) -> {x, y}   the ground point that puts that jaw tip on the hand.
 *      ep05TortoiseHangJaw(p) -> Pt   where the jaws are this frame in hang/drop mode (= hangAt until release).
 *  <Ep05BambooPole x1 y1 x2 y2 w? />                     a loose bamboo lathi (lying, leaning, carried by hand).
 *      ep05PolePoint(a, b, k) -> Pt   a point k (0 foot .. 1 top) along it (a second hand, the thump dust).
 *      Haricharan's own pole is the Puppet rProp "bamboo" (see Ep05Haricharan in Ep05RewriteCast.tsx: two-hand hold).
 *  <Ep05CucumberVine x y s f torn extraDropped? />       the cucumber machan (KrishnanagarKachari CucumberTrellis)
 *      in the prop watercolour: torn 0 whole (yellow flowers, young cucumbers hanging from the front bar) .. 1 torn
 *      (vine dragged down, root out, three bitten cucumbers on the earth); values between animate the pull (key it on
 *      the story clock, e.g. with cowTug). extraDropped (default 1) adds two more whole cucumbers fallen by the legs
 *      once torn > 0.75.                                                                                        [ink]
 *      ep05VineAnchors(x, y, s, torn) -> { root, rootHole, tip, mid, frontBar, fallen[] }: the cow's mouth goes to tip
 *      (graze target), Balak's or Haricharan's pointing hand to frontBar / rootHole, the insert camera to rootHole.
 *  <Ep05Cucumber x y s? rot? bite? />                     one young cucumber (bite 0 whole, 1 one bite, 2 two bites).
 *  <Ep05Cow {...GentleCowProps} shadow? ink? />           the series' Episode 2/5 cow (cinematic/animals/GentleCow:
 *      idle cud-chewing, walk, trot, graze + tugs + cucumber, hidden, nuzzle to a raised palm). solveGentleCow(props)
 *      gives muzzle / forehead / neck / hooves for contact.                                                  [ink]
 *  <Ep05Ledger x y s? open? pageLift? cloth? />           the red cloth-bound khata on a desk, seen from above-front.
 *      open 0 closed .. 1 open flat; pageLift 0..1 the right top page lifting in the breeze (life clock).
 *      ep05LedgerPenPoint(x, y, s, k, line?) -> Pt   a point on a writing line of the right page (the pen nib).
 *  <Ep05LedgerStack x y s? count? />                      stacked closed ledgers.
 *  <Ep05Inkpot x y s? pen? />                             squat brass inkpot (pen: a reed pen standing in it).
 *      ep05InkpotMouth(x, y, s) -> Pt   the ink surface (where a nib dips).
 *  <Ep05ReedPen x y len? rot? />                          a loose reed pen (nib at x, y; rot deg from pointing down).
 *  <Ep05PalmFan x y s? rot? />                            the talpakha (handle end at x, y; rot deg from upright).
 *  Hand-held renderers for Puppet `props` (rProp / lProp name): EP05_HAND_PROPS.reedPen, .palmFan,
 *      makePalmFanInHand(flutter) (the fan's own flutter angle per frame), makeReedPenInHand(angle).
 *      ep05PenGripFor(nib, scale, facing?) -> Pt   the reachAt for a writing hand (Pose.reach, reachExact) so the nib
 *      lands on a ledger line.
 *  <Ep05Mat x y w? d? tone? />                            a small woven madur, (x, y) = front edge centre on the floor.
 *  <Ep05MatCutout x y h? />                               the painted Episode 4 madur plate (madur_mat_veranda_sketch).
 *  <Ep05MangoLeaf x y s? rot? twirl? />                   the leaf Balak twirls (twirl in turns, about its stem).
 *  <Ep05ClerkDesk x y h? />                               the painted clerk's desk plate (prop_clerk_desk).
 *  Re-exported for one import: GhibliTippedBasket (the tortoises' tipped jhanka), PebblesArt (Balak's pebble row).
 */

export { GhibliTippedBasket, PebblesArt, solveGentleCow };

export const EP05_INK = "#3A2618";
const INK_W = 1.6;
const uid = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, "");
const ease = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};

/* =============================================================================================================== */
/* Tortoise                                                                                                        */
/* =============================================================================================================== */

/** A top-down-ish view for the insert at the basket (camera high above the ground). */
export const EP05_TORTOISE_TOP = { view: "side", elev: 76 } as const;

export interface Ep05TortoiseProps extends TortoiseProps {
  /** wrap in #ghibli-char-ink (default true) */
  ink?: boolean;
  /** contact shadow on its ground line (default true) */
  shadow?: boolean;
  /** world point of the child's hand edge the tortoise hangs from (enables hang / drop mode) */
  hangAt?: Pt;
  /** 0..1 hanging from hangAt by the jaws */
  hang?: number;
  /** maximum pitch while hanging, degrees (default 62) */
  hangPitch?: number;
  /** 0..1 after the release: falls from the hang back to its ground point */
  drop?: number;
}

const facingOf = (p: TortoiseProps): 1 | -1 => {
  let yaw = p.yaw ?? (p.view === "threeQuarter" ? 35 : 0);
  if (p.flip) yaw = 180 - yaw;
  return Math.cos((yaw * Math.PI) / 180) >= 0 ? 1 : -1;
};

/** The jaw tip with the head fully out and the shell level (the hang's contact point). */
export const ep05TortoiseJawRest = (p: TortoiseProps): Pt => tortoiseHead({ ...p, bite: 0, release: 0, neck: 1, turnOver: 0 }).jaw;

/** The ground point that puts ep05TortoiseJawRest on `hand`. */
export const ep05TortoiseAtJaw = (hand: Pt, p: Omit<TortoiseProps, "x" | "y"> & { x?: number; y?: number }): { x: number; y: number } => {
  const probe = { ...p, x: 0, y: 0 } as TortoiseProps;
  const j = ep05TortoiseJawRest(probe);
  return { x: hand.x - j.x, y: hand.y - j.y };
};

interface HangSolve {
  dx: number;
  dy: number;
  rot: number;
  pivot: Pt;
  jaw: Pt;
  height: number;
}

const solveHang = (p: Ep05TortoiseProps): HangSolve | null => {
  if (!p.hangAt) return null;
  const hk = clamp(p.hang ?? 0);
  const dk = clamp(p.drop ?? 0);
  if (hk <= 1e-4 && dk <= 1e-4) return null;
  const dir = facingOf(p);
  const jn = ep05TortoiseJawRest(p);
  const s = p.s ?? 1;
  // the body behind the jaws (neck + shell): it may not swing below its own ground line
  const bodyLen = tortoiseLengthPx(s, p.variant ?? 0) * 1.45;
  const room = clamp((p.y - p.hangAt.y) / bodyLen, 0, 1);
  const maxPitch = (Math.asin(room) * 180) / Math.PI;
  const lf = p.lifeF;
  const swing = (4.5 * Math.sin(lf * 0.11) + 1.6 * Math.sin(lf * 0.29 + 1.3)) * hk;
  const pitch = Math.min((p.hangPitch ?? 62) * hk, maxPitch);
  const rotHang = -dir * pitch + swing * (room > 0.2 ? 1 : 0.2);
  // the fall: gravity (accelerating), levelling, one small bounce
  const fall = dk * dk;
  const bounce = Math.sin(Math.PI * clamp((dk - 0.78) / 0.22)) * 5 * s;
  const tx = (p.hangAt.x - jn.x) * (1 - fall);
  const ty = (p.hangAt.y - jn.y) * (1 - fall) - bounce;
  const rot = rotHang * (1 - ease(dk * 1.15));
  return { dx: tx, dy: ty, rot, pivot: jn, jaw: { x: jn.x + tx, y: jn.y + ty }, height: Math.max(0, jn.y - (jn.y + ty)) };
};

/** Where the jaws are this frame in hang / drop mode (= hangAt while it hangs); null when not hanging. */
export const ep05TortoiseHangJaw = (p: Ep05TortoiseProps): Pt | null => solveHang(p)?.jaw ?? null;

export const Ep05Tortoise: React.FC<Ep05TortoiseProps> = (props) => {
  const { ink = true, shadow = true, hangAt, hang, hangPitch, drop, ...tp } = props;
  const hs = solveHang(props);
  const s = tp.s ?? 1;
  const len = tortoiseLengthPx(s, tp.variant ?? 0);
  if (!hs) {
    return (
      <g filter={ink ? "url(#ghibli-char-ink)" : undefined}>
        {shadow && <ContactShadow x={tp.x} y={tp.y + 1} rx={len * 0.55} ry={len * 0.11} opacity={0.3} />}
        <Tortoise {...tp} />
      </g>
    );
  }
  const hk = clamp(hang ?? 0) * (1 - clamp(drop ?? 0));
  const air = clamp(hs.height / (len * 1.2));
  const tortoiseEl = (
    <Tortoise
      {...tp}
      bite={tp.release && tp.release > 0.3 ? tp.bite ?? 1 : 1}
      biteTarget={hs.pivot}
      neck={1}
      paddle={Math.max(tp.paddle ?? 0, hk)}
    />
  );
  return (
    <g filter={ink ? "url(#ghibli-char-ink)" : undefined}>
      {shadow && <ContactShadow x={tp.x + hs.dx * 0.25} y={tp.y + 1} rx={len * lerp(0.55, 0.3, air)} ry={len * 0.1} opacity={lerp(0.3, 0.12, air)} />}
      <g transform={`translate(${hs.dx.toFixed(2)}, ${hs.dy.toFixed(2)}) rotate(${hs.rot.toFixed(2)}, ${hs.pivot.x.toFixed(2)}, ${hs.pivot.y.toFixed(2)})`}>{tortoiseEl}</g>
    </g>
  );
};

/* =============================================================================================================== */
/* Bamboo pole                                                                                                     */
/* =============================================================================================================== */

/** A point k (0 = foot, 1 = top) along a pole from a to b. */
export const ep05PolePoint = (a: Pt, b: Pt, k: number): Pt => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });

/** A loose bamboo lathi: (x1, y1) the thicker foot, (x2, y2) the top. w = foot width (default 9). */
export const Ep05BambooPole: React.FC<{ x1: number; y1: number; x2: number; y2: number; w?: number; shadow?: boolean }> = ({ x1, y1, x2, y2, w = 9, shadow = false }) => {
  const L = Math.hypot(x2 - x1, y2 - y1);
  const rot = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90;
  const w0 = w / 2;
  const w1 = w0 * 0.8;
  const body = `M ${-w0} 0 L ${-w1} ${-L} Q 0 ${-L - w1 * 0.5} ${w1} ${-L} L ${w0} 0 Q 0 ${w0 * 0.45} ${-w0} 0 Z`;
  const nodes = [0.08, 0.24, 0.4, 0.56, 0.72, 0.88];
  return (
    <g>
      {shadow && <ContactShadow x={(x1 + x2) / 2} y={Math.max(y1, y2) + 2} rx={Math.abs(x2 - x1) * 0.5 + 10} ry={5} opacity={0.22} />}
      <g transform={`translate(${x1.toFixed(2)}, ${y1.toFixed(2)}) rotate(${rot.toFixed(2)})`}>
        <path d={body} fill="#9a8f4c" stroke={EP05_INK} strokeWidth={INK_W * 0.8} strokeLinejoin="round" />
        <path d={`M ${-w0 * 0.5} -2 L ${-w1 * 0.5} ${-L + 2}`} stroke="#d2c886" strokeWidth={w1 * 0.5} strokeLinecap="round" opacity={0.7} />
        <path d={`M ${w0 * 0.55} -2 L ${w1 * 0.55} ${-L + 2}`} stroke="#615a2a" strokeWidth={w1 * 0.5} strokeLinecap="round" opacity={0.6} />
        {nodes.map((k) => {
          const wk = lerp(w0, w1, k) * 1.12;
          const yk = -L * k;
          return <path key={k} d={`M ${-wk} ${yk} Q 0 ${yk + wk * 0.45} ${wk} ${yk}`} stroke={EP05_INK} strokeWidth={1.2} fill="none" opacity={0.85} />;
        })}
      </g>
    </g>
  );
};

/* =============================================================================================================== */
/* Cucumbers and the vine                                                                                          */
/* =============================================================================================================== */

/** One young cucumber, about 46 x 13 at s 1, pointing along rot (deg, 0 = to the right). bite 0 / 1 / 2 bites. */
export const Ep05Cucumber: React.FC<{ x: number; y: number; s?: number; rot?: number; bite?: number }> = ({ x, y, s = 1, rot = 0, bite = 0 }) => {
  const id = `e5cu-${uid(useId())}`;
  const L = 23;
  const H = 6.5;
  const bitten = bite >= 1;
  const twice = bite >= 2;
  const right = bitten ? L - 5 : L;
  const bodyD = `M ${-L} 0 Q ${-L} ${-H} ${-L * 0.4} ${-H * 1.05} L ${right * 0.5} ${-H} Q ${right} ${-H * 0.9} ${right} 0 Q ${right} ${H * 0.9} ${right * 0.5} ${H} L ${-L * 0.4} ${H * 1.05} Q ${-L} ${H} ${-L} 0 Z`;
  return (
    <g transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${s})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fbf63" />
          <stop offset="55%" stopColor="#6f9a3c" />
          <stop offset="100%" stopColor="#4f7a2b" />
        </linearGradient>
      </defs>
      <path d={bodyD} fill={`url(#${id})`} stroke={EP05_INK} strokeWidth={INK_W * 0.7} strokeLinejoin="round" />
      {[-0.55, -0.15, 0.25].map((k) => (
        <path key={k} d={`M ${L * k - 6} ${-H * 0.35} L ${L * k + 6} ${-H * 0.38}`} stroke="#d8e6a8" strokeWidth={1.1} opacity={0.65} strokeLinecap="round" />
      ))}
      {[-15, -7, 2, 10].map((px, i) => (
        <circle key={px} cx={px} cy={i % 2 ? 2.4 : -1.2} r={0.7} fill={EP05_INK} opacity={0.45} />
      ))}
      {/* the withered flower at the tip */}
      <path d={`M ${-L} 0 l -4 -2.5 l 1 2.5 l -1 2.5 Z`} fill="#d9b23e" stroke={EP05_INK} strokeWidth={0.7} opacity={0.9} />
      {bitten && (
        <g>
          <path d={`M ${right} ${-H * 0.9} Q ${right - 4} ${-H * 0.3} ${right - 1} 0 Q ${right - 4.5} ${H * 0.4} ${right} ${H * 0.9}`} fill="#eef0c4" stroke={EP05_INK} strokeWidth={0.8} />
          <circle cx={right - 1.6} cy={-1.5} r={0.6} fill="#c9cf86" />
          <circle cx={right - 1.4} cy={1.8} r={0.6} fill="#c9cf86" />
        </g>
      )}
      {twice && <path d={`M ${-2} ${H * 1.02} Q 2 ${H * 0.2} 7 ${H * 0.98}`} fill="#eef0c4" stroke={EP05_INK} strokeWidth={0.8} />}
    </g>
  );
};

/** Hand and mouth points of the vine at a tear state (see the header). */
export const ep05VineAnchors = (x: number, y: number, s: number, torn: number) => {
  const at = { x, y, s };
  const rootOut = ease((torn - 0.5) / 0.3);
  return {
    /** the root at the foot of the front-left leg (comes up out of the earth when torn) */
    root: trellisPoint(torn, 0, at),
    /** the hole the root leaves (the insert's subject) */
    rootHole: { x: x - 250 * s, y: y + 6 },
    /** the far right tip of the main stem: the cow's graze target and where she pulls */
    tip: trellisPoint(torn, 1, at),
    /** the middle of the stem (a pointing hand) */
    mid: trellisPoint(torn, 0.6, at),
    /** the platform's front bar, middle (the young cucumbers hang from it) */
    frontBar: { x, y: y - 170 * s },
    /** the two extra fallen cucumbers (extraDropped) */
    fallen: [
      { x: x - 120 * s, y: y + 10 * s, rot: -14 },
      { x: x + 40 * s, y: y + 14 * s, rot: 22 },
    ],
    rootOut,
  };
};

export const Ep05CucumberVine: React.FC<{ x: number; y: number; s?: number; f: number; torn?: number; extraDropped?: number; ink?: boolean }> = ({
  x,
  y,
  s = 1,
  f,
  torn = 0,
  extraDropped = 1,
  ink = true,
}) => {
  const a = ep05VineAnchors(x, y, s, torn);
  const fall = (i: number) => ease((torn - 0.75 - i * 0.08) / 0.12) * extraDropped;
  return (
    <g filter={ink ? "url(#ghibli-prop-watercolor)" : undefined}>
      <ContactShadow x={x} y={y + 2} rx={300 * s} ry={16 * s} opacity={0.22} />
      <CucumberTrellis x={x} y={y} s={s} f={f} torn={torn} />
      {a.fallen.map((c, i) => {
        const k = fall(i);
        if (k <= 0.01) return null;
        const yy = lerp(y - 150 * s, c.y, k * k);
        return <Ep05Cucumber key={i} x={c.x} y={yy} s={s * 1.15} rot={lerp(80, c.rot, k)} />;
      })}
    </g>
  );
};

/* =============================================================================================================== */
/* The cow                                                                                                         */
/* =============================================================================================================== */

export const Ep05Cow: React.FC<GentleCowProps & { shadow?: boolean; ink?: boolean }> = ({ shadow = true, ink = true, ...cp }) => {
  const sol = solveGentleCow(cp);
  return (
    <g filter={ink ? "url(#ghibli-char-ink)" : undefined}>
      {shadow && <ContactShadow x={sol.x} y={sol.y + 2} rx={175 * sol.s} ry={16 * sol.s} opacity={0.3} />}
      <GentleCow {...cp} />
    </g>
  );
};

/* =============================================================================================================== */
/* Clerk props: ledger, inkpot, reed pen, palm-leaf fan                                                            */
/* =============================================================================================================== */

/** Book-plane point (u -1..1 across both pages, v 0 front .. 1 back) to local px (seen from above-front). */
const LEDGER = { W: 62, D: 40, skew: 7 };
const ledgerP = (u: number, v: number, lift = 0) => ({ x: u * LEDGER.W + v * LEDGER.skew, y: -v * LEDGER.D - lift });

/** A point on writing line `line` (0..5) of the right page, k 0..1 along it (local px offset added to x, y, scaled). */
export const ep05LedgerPenPoint = (x: number, y: number, s: number, k: number, line = 2): Pt => {
  const v = 0.18 + line * 0.13;
  const p = ledgerP(lerp(0.14, 0.9, clamp(k)), v);
  return { x: x + p.x * s, y: y + p.y * s };
};

export const Ep05Ledger: React.FC<{ x: number; y: number; s?: number; open?: number; pageLift?: number; cloth?: string }> = ({
  x,
  y,
  s = 1,
  open = 1,
  pageLift = 0,
  cloth = "#a8342a",
}) => {
  const id = `e5lg-${uid(useId())}`;
  const o = clamp(open);
  const pt = (u: number, v: number, lift = 0) => {
    const q = ledgerP(u, v, lift);
    return `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  };
  // closed: the right half (cover and pages) folded over onto the left
  const coverU = lerp(0, 1, o);
  const pageD = (u0: number, u1: number, sag: number) =>
    `M ${pt(u0, 0)} Q ${pt((u0 + u1) / 2, -0.02, sag)} ${pt(u1, 0)} L ${pt(u1, 1)} Q ${pt((u0 + u1) / 2, 0.98, sag)} ${pt(u0, 1)} Z`;
  const lines = [0, 1, 2, 3, 4, 5];
  const scrib = (u0: number, u1: number, v: number, seed: number) => {
    let d = `M ${pt(u0, v)}`;
    const n = 9;
    for (let i = 1; i <= n; i++) {
      const u = lerp(u0, u1, i / n);
      const jy = 0.012 * Math.sin(i * 2.3 + seed) + (i % 3 === 0 ? -0.01 : 0.006);
      d += ` L ${pt(u, v + jy)}`;
    }
    return d;
  };
  const lift = clamp(pageLift);
  return (
    <g transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${s})`}>
      <defs>
        <linearGradient id={`${id}-pg`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#efe2c2" />
          <stop offset="85%" stopColor="#f6ecd4" />
          <stop offset="100%" stopColor="#d9c7a0" />
        </linearGradient>
      </defs>
      <ellipse cx={4} cy={3} rx={LEDGER.W * 1.08} ry={7} fill="#3e2920" opacity={0.18} />
      {/* the cloth cover under the pages (a rim shows round them) */}
      <path d={`M ${pt(-1.06, -0.05)} L ${pt(coverU * 1.06, -0.05)} L ${pt(coverU * 1.06, 1.05)} L ${pt(-1.06, 1.05)} Z`} fill={cloth} stroke={EP05_INK} strokeWidth={INK_W * 0.8} strokeLinejoin="round" />
      {o > 0.15 && (
        <g opacity={ease((o - 0.15) / 0.3)}>
          <path d={pageD(-1, 0, 2.5)} fill={`url(#${id}-pg)`} stroke={EP05_INK} strokeWidth={INK_W * 0.6} />
          <path d={pageD(0, coverU, 2.5)} fill={`url(#${id}-pg)`} stroke={EP05_INK} strokeWidth={INK_W * 0.6} />
          {/* page edges (thickness) at the front */}
          <path d={`M ${pt(-1, 0)} L ${pt(-1, 0, -2.2)} M ${pt(coverU, 0)} L ${pt(coverU, 0, -2.2)}`} stroke={EP05_INK} strokeWidth={0.7} opacity={0.6} />
          {lines.map((i) => (
            <g key={i} opacity={0.62}>
              <path d={scrib(-0.9, -0.14, 0.18 + i * 0.13, i)} stroke="#4a3426" strokeWidth={0.75} fill="none" />
              {o > 0.9 && i < 5 && <path d={scrib(0.14, 0.88 - (i === 4 ? 0.4 : 0), 0.18 + i * 0.13, i + 9)} stroke="#4a3426" strokeWidth={0.75} fill="none" />}
            </g>
          ))}
          {/* red margin rules (khata style) */}
          <path d={`M ${pt(-0.78, 0.04)} L ${pt(-0.78, 0.96)} M ${pt(0.26, 0.04)} L ${pt(0.26, 0.96)}`} stroke="#b4473a" strokeWidth={0.7} opacity={0.6} />
          {/* the spine fold */}
          <path d={`M ${pt(0, 0)} L ${pt(0, 1)}`} stroke={EP05_INK} strokeWidth={0.9} opacity={0.55} />
          {/* the lifting top page (right): its outer edge rises and swings toward the spine */}
          {lift > 0.01 && (
            <path
              d={`M ${pt(0, 0)} Q ${pt(0.5 * Math.cos(lift * 1.1), 0, 26 * lift)} ${pt(Math.cos(lift * 1.25), 0.02, 34 * lift)} L ${pt(Math.cos(lift * 1.25), 0.98, 34 * lift)} Q ${pt(0.5 * Math.cos(lift * 1.1), 1, 26 * lift)} ${pt(0, 1)} Z`}
              fill="#fbf3de"
              stroke={EP05_INK}
              strokeWidth={INK_W * 0.6}
              opacity={0.97}
            />
          )}
        </g>
      )}
      {o <= 0.15 && (
        <g>
          <path d={`M ${pt(-0.9, 0.12)} L ${pt(-0.05, 0.12)} M ${pt(-0.9, 0.88)} L ${pt(-0.05, 0.88)}`} stroke="#e7c873" strokeWidth={1.1} opacity={0.6} />
          <path d={`M ${pt(-1.06, -0.05)} L ${pt(-1.06, -0.05, -5)} L ${pt(coverU * 1.06, -0.05, -5)} L ${pt(coverU * 1.06, -0.05)}`} fill="#efe2c2" stroke={EP05_INK} strokeWidth={0.7} />
        </g>
      )}
    </g>
  );
};

/** Closed ledgers stacked (spines toward the camera). count default 3; (x, y) the bottom front centre. */
export const Ep05LedgerStack: React.FC<{ x: number; y: number; s?: number; count?: number }> = ({ x, y, s = 1, count = 3 }) => {
  const cols = ["#a8342a", "#8e2a22", "#b44a2c", "#7a2a24"];
  return (
    <g transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${s})`}>
      <ellipse cx={3} cy={2} rx={46} ry={5} fill="#3e2920" opacity={0.2} />
      {Array.from({ length: count }, (_, i) => {
        const yy = -i * 11;
        const dx = (i % 2 ? 3 : -2) + i * 0.5;
        const c = cols[i % cols.length];
        return (
          <g key={i} transform={`translate(${dx}, ${yy})`}>
            {/* top face */}
            <path d={`M -40 -10 L 36 -10 L 44 -20 L -32 -20 Z`} fill={c} stroke={EP05_INK} strokeWidth={1.1} strokeLinejoin="round" />
            {/* page block (front) */}
            <path d="M -40 -10 L 36 -10 L 36 0 L -40 0 Z" fill="#efe2c2" stroke={EP05_INK} strokeWidth={1.1} />
            <path d="M -38 -6.5 L 34 -6.5 M -38 -3.2 L 34 -3.2" stroke="#b9a37a" strokeWidth={0.6} />
            {/* cloth spine wrap at the left end */}
            <path d="M -40 -10 L -30 -10 L -30 0 L -40 0 Z" fill={c} stroke={EP05_INK} strokeWidth={1} />
            <path d="M 36 -10 L 44 -20 L 44 -10 L 36 0 Z" fill="#d9c7a0" stroke={EP05_INK} strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
};

/** The ink surface of the inkpot (where a nib dips). */
export const ep05InkpotMouth = (x: number, y: number, s = 1): Pt => ({ x, y: y - 17 * s });

/** Squat brass inkpot, (x, y) its base centre; about 30 wide, 20 tall at s 1. pen: a reed pen standing in it. */
export const Ep05Inkpot: React.FC<{ x: number; y: number; s?: number; pen?: boolean }> = ({ x, y, s = 1, pen = false }) => {
  const id = `e5ip-${uid(useId())}`;
  return (
    <g transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${s})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a5f22" />
          <stop offset="35%" stopColor="#e8c06a" />
          <stop offset="60%" stopColor="#c99a3e" />
          <stop offset="100%" stopColor="#6e4a18" />
        </linearGradient>
      </defs>
      <ellipse cx={2} cy={1} rx={18} ry={3.5} fill="#3e2920" opacity={0.25} />
      {pen && <Ep05ReedPen x={-2} y={-11} len={52} rot={14} />}
      <path d="M -15 0 Q -17 -10 -9 -15 L 9 -15 Q 17 -10 15 0 Q 0 3.5 -15 0 Z" fill={`url(#${id})`} stroke={EP05_INK} strokeWidth={INK_W * 0.8} strokeLinejoin="round" />
      <ellipse cx={0} cy={-15.5} rx={9.5} ry={2.6} fill="#c99a3e" stroke={EP05_INK} strokeWidth={1} />
      <ellipse cx={0} cy={-16.6} rx={6.2} ry={1.7} fill="#1c1410" />
      <path d="M -11 -8 Q 0 -6 11 -8" stroke="#f3dc98" strokeWidth={1.2} fill="none" opacity={0.6} />
    </g>
  );
};

/** A loose reed pen (কলম): the nib at (x, y); rot degrees from pointing straight down (0) clockwise. */
export const Ep05ReedPen: React.FC<{ x: number; y: number; len?: number; rot?: number }> = ({ x, y, len = 46, rot = 0 }) => {
  if (len < 1) return null;
  return (
    <g transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rot.toFixed(2)})`}>
      {/* the stalk runs up (-y) from the nib */}
      <path d={`M -1.6 -6 L -1.9 ${-len} Q 0 ${-len - 1.5} 1.9 ${-len} L 1.6 -6 Z`} fill="#c9a666" stroke={EP05_INK} strokeWidth={0.9} />
      <path d={`M -0.4 -8 L -0.5 ${-len + 2}`} stroke="#ead29a" strokeWidth={0.8} opacity={0.8} />
      {[0.35, 0.7].map((k) => (
        <path key={k} d={`M -2 ${-len * k} L 2 ${-len * k}`} stroke={EP05_INK} strokeWidth={0.8} opacity={0.7} />
      ))}
      {/* the cut nib, inked */}
      <path d="M -1.6 -6 L 0 0.5 L 1.6 -6 Z" fill="#2a1d14" stroke={EP05_INK} strokeWidth={0.6} />
    </g>
  );
};

/** The palm-leaf hand fan (তালপাখা): the handle end at (x, y); rot degrees from upright (fan up). About 70 tall at s 1. */
export const Ep05PalmFan: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => {
  const id = `e5pf-${uid(useId())}`;
  const ribs = [-62, -44, -26, -9, 9, 26, 44, 62];
  return (
    <g transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${s})`}>
      <defs>
        <radialGradient id={id} cx="50%" cy="85%" r="80%">
          <stop offset="0%" stopColor="#e4c98a" />
          <stop offset="70%" stopColor="#d2b06a" />
          <stop offset="100%" stopColor="#b08c48" />
        </radialGradient>
      </defs>
      {/* handle (the leaf stalk) */}
      <path d="M -2.2 0 L -2.6 -26 L 2.6 -26 L 2.2 0 Z" fill="#a5844a" stroke={EP05_INK} strokeWidth={0.9} />
      {/* the round leaf blade */}
      <path d="M 0 -26 Q -27 -22 -30 -48 Q -28 -74 0 -76 Q 28 -74 30 -48 Q 27 -22 0 -26 Z" fill={`url(#${id})`} stroke={EP05_INK} strokeWidth={INK_W * 0.8} strokeLinejoin="round" />
      {ribs.map((a) => {
        const r = (a * Math.PI) / 180;
        return <path key={a} d={`M 0 -27 L ${(Math.sin(r) * 27).toFixed(1)} ${(-50 - Math.cos(r) * 24).toFixed(1)}`} stroke="#8a6a34" strokeWidth={0.7} opacity={0.75} />;
      })}
      {/* bound rim */}
      <path d="M -27 -36 Q -31 -60 -14 -72 M 27 -36 Q 31 -60 14 -72" stroke="#7a2e22" strokeWidth={1.6} fill="none" opacity={0.75} />
    </g>
  );
};

/**
 * A reed pen held in the Puppet's fingers (Puppet props, rProp / lProp "reedPen"). The hand frame runs down the fingers
 * (+y); `angle` (deg) turns the pen in that frame (default: nib forward and down across the fingers, as in writing).
 */
export const makeReedPenInHand =
  (angle = 0): PropRenderer =>
  ({ side, scale }) => (
    <g transform={`scale(${scale}) rotate(${(-side * (38 + angle)).toFixed(1)})`}>
      <Ep05ReedPen x={0} y={18} len={52} rot={0} />
    </g>
  );

/**
 * The palm fan in the Puppet's fist (rProp / lProp "palmFan"): the blade stays near upright in the world (it follows
 * the fist, not the forearm) and flutters by `flutter(f)` degrees (default a lazy fanning on f; pass () => 0 to stop it
 * mid-air, as on 05c).
 */
export const makePalmFanInHand =
  (flutter: (f: number) => number = (f) => 16 * Math.sin(f * 0.42) + 3 * noise1(f * 0.05, 4)): PropRenderer =>
  ({ f, worldRot, side, scale }) => (
    <g transform={`scale(${scale}) rotate(${(-worldRot + side * 8 + flutter(f)).toFixed(2)})`}>
      <Ep05PalmFan x={0} y={14} s={1.05} rot={0} />
    </g>
  );

/**
 * Where to send the writing hand (Pose.reach + PuppetProps.reachAt, reachExact) so the held reed pen's nib lands on
 * `nib` (e.g. ep05LedgerPenPoint): the grip sits a little above and behind the nib. `scale` = the Puppet's scale.
 */
export const ep05PenGripFor = (nib: Pt, scale: number, facing: 1 | -1 = 1): Pt => ({ x: nib.x - facing * 6 * scale, y: nib.y - 24 * scale });

/** Ready-made hand props (pass as the Puppet's `props`). */
export const EP05_HAND_PROPS: Record<string, PropRenderer> = {
  reedPen: makeReedPenInHand(0),
  palmFan: makePalmFanInHand(),
};

/* =============================================================================================================== */
/* Mat, leaf, painted cutouts                                                                                      */
/* =============================================================================================================== */

/** A small woven madur on the floor, seen from eye level: (x, y) the front edge centre, w wide, d deep (on screen). */
export const Ep05Mat: React.FC<{ x: number; y: number; w?: number; d?: number; tone?: "straw" | "green" }> = ({ x, y, w = 260, d = 46, tone = "straw" }) => {
  const id = `e5mt-${uid(useId())}`;
  const back = w * 0.86;
  const base = tone === "straw" ? ["#e3c98c", "#cfae68"] : ["#c9cf8e", "#a7b066"];
  const stripe = tone === "straw" ? "#a63a2c" : "#3f6a4a";
  const P = (u: number, v: number) => ({ x: x + u * lerp(w, back, v) * 0.5, y: y - v * d });
  const p = (u: number, v: number) => {
    const q = P(u, v);
    return `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  };
  const rows = 12;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={base[0]} />
          <stop offset="100%" stopColor={base[1]} />
        </linearGradient>
      </defs>
      <ContactShadow x={x} y={y + 1} rx={w * 0.5} ry={6} opacity={0.18} />
      <path d={`M ${p(-1, 0)} L ${p(1, 0)} L ${p(1, 1)} L ${p(-1, 1)} Z`} fill={`url(#${id})`} stroke={EP05_INK} strokeWidth={INK_W * 0.8} strokeLinejoin="round" />
      {Array.from({ length: rows - 1 }, (_, i) => {
        const v = (i + 1) / rows;
        return <path key={i} d={`M ${p(-0.98, v)} L ${p(0.98, v)}`} stroke="#9c7c40" strokeWidth={0.6} opacity={0.55} />;
      })}
      {Array.from({ length: 24 }, (_, i) => {
        const u = -0.95 + (1.9 * i) / 23;
        return <path key={`c${i}`} d={`M ${p(u, 0.02)} L ${p(u, 0.98)}`} stroke="#b89654" strokeWidth={0.45} opacity={0.4} />;
      })}
      {/* the woven border stripes at both ends */}
      {[-0.86, 0.86].map((u) => (
        <path key={u} d={`M ${p(u - 0.035, 0.02)} L ${p(u - 0.035, 0.98)} L ${p(u + 0.035, 0.98)} L ${p(u + 0.035, 0.02)} Z`} fill={stripe} opacity={0.7} />
      ))}
      <path d={`M ${p(-1, 0)} L ${p(1, 0)}`} stroke="#8a6a30" strokeWidth={1.4} opacity={0.6} />
    </g>
  );
};

/** The painted Episode 4 madur (madur_mat_veranda_sketch), its base at (x, y), h tall on screen. */
export const Ep05MatCutout: React.FC<{ x: number; y: number; h?: number; opacity?: number }> = ({ x, y, h = 120, opacity = 1 }) => (
  <GhibliCutout file="images/ghibli_ep04/madur_mat_veranda_sketch.png" anchor={EP04_ANCHORS.madur_mat_veranda_sketch} x={x} y={y} targetHeight={h} opacity={opacity} />
);

/** The painted clerk's desk (prop_clerk_desk), its base at (x, y), h tall on screen (default 170). */
export const Ep05ClerkDesk: React.FC<{ x: number; y: number; h?: number }> = ({ x, y, h = 170 }) => (
  <g>
    <ContactShadow x={x} y={y + 2} rx={h * 0.75} ry={10} opacity={0.26} />
    <GhibliCutout file="images/ghibli_ep05/prop_clerk_desk.png" anchor={EP05_ANCHORS.prop_clerk_desk} x={x} y={y} targetHeight={h} />
  </g>
);

/** The mango leaf Balak twirls: (x, y) the stem end, about 34 long at s 1; twirl = turns about the stem (life clock). */
export const Ep05MangoLeaf: React.FC<{ x: number; y: number; s?: number; rot?: number; twirl?: number }> = ({ x, y, s = 1, rot = -30, twirl = 0 }) => {
  const id = `e5ml-${uid(useId())}`;
  const sx = Math.cos(twirl * Math.PI * 2);
  const back = sx < 0;
  return (
    <g transform={`translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${s})`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={back ? "#7d9a4a" : "#4e7a34"} />
          <stop offset="100%" stopColor={back ? "#9db86a" : "#6f9a45"} />
        </linearGradient>
      </defs>
      <path d="M 0 0 L 6 0" stroke="#6a5a2a" strokeWidth={1.4} strokeLinecap="round" />
      <g transform={`scale(1, ${Math.max(0.08, Math.abs(sx)).toFixed(3)})`}>
        <path d="M 6 0 Q 18 -9 36 -1 Q 20 8 6 0 Z" fill={`url(#${id})`} stroke={EP05_INK} strokeWidth={0.9} strokeLinejoin="round" />
        <path d="M 6 0 Q 20 -1 35 -1" stroke={back ? "#cfe0a0" : "#a8c477"} strokeWidth={0.7} fill="none" />
      </g>
    </g>
  );
};
