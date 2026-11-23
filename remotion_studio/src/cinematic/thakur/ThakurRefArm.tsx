import React, { useId } from "react";
import {
  CLOTH,
  CLOTH_LIT,
  CLOTH_SHADE,
  INK,
  SKIN,
  SKIN_LIT,
  SKIN_SHADE,
} from "./thakurRefPalette";
import {
  THAKUR_HAND_WRIST_HALF_W,
  ThakurHandType,
  ThakurRefHand,
} from "./ThakurRefHands";

/* ------------------------------------------------------------------ */
/* Small 2D helpers                                                    */
/* ------------------------------------------------------------------ */
type V = [number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1];
const len = (a: V) => Math.hypot(a[0], a[1]);
const norm = (a: V, fb: V = [0, -1]): V => {
  const l = len(a);
  return l < 1e-6 ? fb : [a[0] / l, a[1] / l];
};
/** Left-hand normal of a direction (rotated +90 deg). */
const perp = (a: V): V => [-a[1], a[0]];
const mix = (a: V, b: V, t: number): V => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
const P = (p: V) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const poly = (pts: V[], move = true) =>
  pts.map((p, i) => `${i === 0 && move ? "M" : "L"} ${P(p)}`).join(" ");

/** Cubic Hermite point. */
const hermite = (p0: V, m0: V, p1: V, m1: V, t: number): V => {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return [
    h00 * p0[0] + h10 * m0[0] + h01 * p1[0] + h11 * m1[0],
    h00 * p0[1] + h10 * m0[1] + h01 * p1[1] + h11 * m1[1],
  ];
};

/** Segment intersection (proper), returns point or null. */
const segX = (a: V, b: V, c: V, d: V): V | null => {
  const r = sub(b, a);
  const s = sub(d, c);
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const q = sub(c, a);
  const t = (q[0] * s[1] - q[1] * s[0]) / den;
  const u = (q[0] * r[1] - q[1] * r[0]) / den;
  if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null;
  return add(a, mul(r, t));
};

/** One offset side of the limb: points + their spine sample index; inner-fold loops are cut off. */
interface Side {
  pts: V[];
  idx: number[];
  fold: V | null; // where the inner side folded onto itself (crease point)
}
const cutLoops = (pts: V[], iJoint: number, win: number): Side => {
  const idx = pts.map((_, i) => i);
  let p = pts.slice();
  let ix = idx.slice();
  let fold: V | null = null;
  for (let pass = 0; pass < 3; pass++) {
    let found = false;
    outer: for (let i = 0; i < p.length - 3; i++) {
      if (ix[i] < iJoint - win || ix[i] > iJoint) continue;
      for (let j = p.length - 2; j > i + 1; j--) {
        if (ix[j] > iJoint + win || ix[j] < iJoint - 1) continue;
        const x = segX(p[i], p[i + 1], p[j], p[j + 1]);
        if (x) {
          const mid = Math.round((ix[i + 1] + ix[j]) / 2);
          p = [...p.slice(0, i + 1), x, ...p.slice(j + 1)];
          ix = [...ix.slice(0, i + 1), mid, ...ix.slice(j + 1)];
          fold = x;
          found = true;
          break outer;
        }
      }
    }
    if (!found) break;
  }
  return { pts: p, idx: ix, fold };
};

/**
 * Balak's gesture arm for the traced rig: ONE continuous, soft child's limb.
 *
 * A smooth spine (cubic Hermite through shoulder -> elbow -> wrist, the elbow tangent bisecting the bend, the wrist
 * tangent along the hand's axis) is sampled and offset by a smooth width profile (upper arm 56, elbow 50, forearm
 * swelling just below the elbow, wrist 44, measured from the traced sitCross lap arm). The outer side of a bend is the
 * offset of the curve, so it is a smooth arc; the inner side folds onto itself and the loop is cut, leaving a soft
 * fold with one short crease. Cel shading follows the curve: a SKIN_SHADE band on the side turned away from the light
 * and a SKIN_LIT edge on the lit side, both varying smoothly with the local direction. The ink outline stays OPEN
 * across the wrist (MOT-19).
 *
 * The chadar drapes over the shoulder and most of the upper arm as an opaque sleeve built on the same spine; its loose
 * underside hangs DOWN (gravity) and sways with `clothSway`. Draw order: upper arm, sleeve, forearm, hand, so a
 * forearm folded back over the upper arm (blessing, teaching) is always in front of the cloth.
 */
export const ThakurRefArm: React.FC<{
  shX: number;
  shY: number;
  elX: number;
  elY: number;
  wrX: number;
  wrY: number;
  handRot: number;
  handType: ThakurHandType;
  side: "L" | "R";
  /** Fraction of the upper arm covered by the chadar sleeve (0..1, default 0.8). */
  sleeve?: number;
  /** Sideways sway of the hanging cloth in px (animate with a slow sine of life frames). Default 0. */
  clothSway?: number;
  /** Half-widths of the arm at shoulder / elbow / wrist (px at s = 1). */
  shoulderHalf?: number;
  elbowHalf?: number;
  wristHalf?: number;
}> = ({
  shX,
  shY,
  elX,
  elY,
  wrX,
  wrY,
  handRot,
  handType,
  side,
  sleeve = 0.8,
  clothSway = 0,
  shoulderHalf = 28,
  elbowHalf = 25,
  wristHalf = THAKUR_HAND_WRIST_HALF_W,
}) => {
  const uid = "tra" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const isL = side === "L";
  const m = isL ? 1 : -1; // hand mirror

  const sh: V = [shX, shY];
  const el: V = [elX, elY];

  /* ---- hand frame: wrist-local (x, y) -> world, same transform as the <g> around the hand ---- */
  const rr = (handRot * Math.PI) / 180;
  const cr = Math.cos(rr);
  const sr = Math.sin(rr);
  const hw = (x: number, y: number): V => {
    const xm = x * m;
    return [wrX + xm * cr - y * sr, wrY + xm * sr + y * cr];
  };
  const handDir: V = norm(sub(hw(0, -10), [wrX, wrY])); // toward the fingers
  const wE = hw(0, 10); // the forearm ends just inside the hand's open wrist

  /* ---- spine ---- */
  const Lu = Math.max(len(sub(el, sh)), 1);
  const Lf = Math.max(len(sub(wE, el)), 1);
  const d1 = norm(sub(el, sh));
  const d2 = norm(sub(wE, el));
  const bend = Math.acos(clamp(dot(d1, d2), -1, 1)); // 0 = straight
  const turn = d1[0] * d2[1] - d1[1] * d2[0]; // > 0: forearm turns toward +perp
  let eDir = norm(add(d1, d2), perp(d1));
  if (len(add(d1, d2)) < 0.15) eDir = norm(add(perp(d1), mul(d1, 0.2)), d1);
  const kE = Math.min(Lu, Lf) * (0.55 - 0.25 * smooth(bend / 2.6));
  const m0 = mul(d1, Lu * 0.9);
  const m1 = mul(eDir, kE * 2);
  const m2 = mul(norm(add(d2, handDir), handDir), Lf * 0.8);

  const N1 = 30;
  const N2 = 30;
  const spine: V[] = [];
  const half: number[] = [];
  for (let i = 0; i <= N1; i++) {
    const t = i / N1;
    spine.push(hermite(sh, m0, el, m1, t));
    half.push(
      shoulderHalf + (elbowHalf - shoulderHalf) * smooth((t - 0.3) / 0.7),
    );
  }
  const swellHalf = elbowHalf * 1.03;
  for (let i = 1; i <= N2; i++) {
    const u = i / N2;
    spine.push(hermite(el, m1, wE, m2, u));
    half.push(
      u < 0.28
        ? elbowHalf + (swellHalf - elbowHalf) * smooth(u / 0.28)
        : swellHalf + (wristHalf - swellHalf) * smooth((u - 0.28) / 0.72),
    );
  }
  const NS = spine.length;
  const iEl = N1;
  const tang: V[] = spine.map((_, i) =>
    norm(sub(spine[Math.min(NS - 1, i + 1)], spine[Math.max(0, i - 1)]), d1),
  );
  // At the wrist use the hand axis exactly, so the outline meets the hand's wrist edges.
  tang[NS - 1] = handDir;
  const nrm: V[] = tang.map(perp);

  const rawP: V[] = spine.map((p, i) => add(p, mul(nrm[i], half[i])));
  const rawM: V[] = spine.map((p, i) => add(p, mul(nrm[i], -half[i])));
  const sideP = cutLoops(rawP, N1, 13);
  const sideM = cutLoops(rawM, N1, 13);

  /** Split a side at the elbow: [upper (0..elbow), fore (elbow..wrist)], sharing the elbow point. */
  const split = (s: Side): [V[], V[]] => {
    let k = s.idx.findIndex((ix) => ix >= iEl);
    if (k < 0) k = s.pts.length - 1;
    return [s.pts.slice(0, k + 1), s.pts.slice(k)];
  };
  const [upP, foP] = split(sideP);
  const [upM, foM] = split(sideM);

  // Shoulder cap: a round end behind the shoulder (hidden under the sleeve anyway).
  const capPts: V[] = [];
  for (let k = 1; k < 8; k++) {
    const a = Math.PI * (k / 8);
    capPts.push(
      add(
        sh,
        add(
          mul(nrm[0], shoulderHalf * Math.cos(a)),
          mul(d1, -shoulderHalf * 0.3 * Math.sin(a)),
        ),
      ),
    );
  }
  const upperFill =
    poly(upP) +
    " " +
    poly(upM.slice().reverse(), false) +
    " " +
    poly(capPts.slice().reverse(), false) +
    " Z";
  const upperLine =
    poly(upP.slice().reverse()) +
    " " +
    poly(capPts.slice().reverse(), false) +
    " " +
    poly(upM, false);

  const Wp = foP[foP.length - 1];
  const Wm = foM[foM.length - 1];
  const Wp2 = add(Wp, mul(handDir, 12));
  const Wm2 = add(Wm, mul(handDir, 12));
  // The forearm piece starts one sample before the elbow so the two pieces overlap (no hairline).
  const backOne = (s: Side, fo: V[]) => {
    const k = s.idx.findIndex((ix) => ix >= iEl);
    return k > 0 ? [s.pts[k - 1], ...fo] : fo;
  };
  const foP2 = backOne(sideP, foP);
  const foM2 = backOne(sideM, foM);
  const foreFill =
    poly(foP2) +
    ` L ${P(Wp2)} L ${P(Wm2)} ` +
    poly(foM2.slice().reverse(), false) +
    " Z";
  const foreLineP = poly(turn >= 0 && sideP.fold ? foP.slice(2) : foP);
  const foreLineM = poly(turn < 0 && sideM.fold ? foM.slice(2) : foM);

  /* ---- cel shading bands that follow the curve ---- */
  const LIGHT: V = norm([-0.45, -0.9]);
  const band = (
    from: number,
    to: number,
    sgn: number,
    maxW: number,
    lit: boolean,
  ) => {
    const outerPts: V[] = [];
    const innerPts: V[] = [];
    for (let i = from; i <= to; i++) {
      const n = mul(nrm[i], sgn);
      const f = lit ? dot(n, LIGHT) : -dot(n, LIGHT);
      const w = maxW * clamp(0.25 + f, 0, 1);
      const e = add(spine[i], mul(n, half[i] + 2));
      outerPts.push(e);
      innerPts.push(sub(e, mul(n, w + 2)));
    }
    return poly(outerPts) + " " + poly(innerPts.reverse(), false) + " Z";
  };
  const shadeD = (from: number, to: number) =>
    band(from, to, 1, 17, false) + " " + band(from, to, -1, 17, false);
  const litD = (from: number, to: number) =>
    band(from, to, 1, 7, true) + " " + band(from, to, -1, 7, true);

  /* ---- the crease on the inner side of the bend ---- */
  const innerSide = turn >= 0 ? sideP : sideM;
  const innerSgn = turn >= 0 ? 1 : -1;
  const creaseBase: V =
    innerSide.fold ?? add(spine[iEl], mul(nrm[iEl], innerSgn * half[iEl]));
  const toSpine = norm(sub(spine[iEl], creaseBase), mul(nrm[iEl], -innerSgn));
  const creaseLen = innerSide.fold ? 13 : 4 + 9 * smooth(bend / 1.2);
  const creaseEnd = add(add(creaseBase, mul(toSpine, creaseLen)), mul(eDir, 3));
  const creaseOp = innerSide.fold ? 0.7 : 0.6 * smooth((bend - 0.2) / 0.6);

  /* ---------------------------------------------------------------- */
  /* Chadar sleeve on the same spine                                   */
  /* ---------------------------------------------------------------- */
  const kc = clamp(sleeve, 0.2, 1);
  const iC = Math.max(4, Math.round(N1 * kc)); // cuff sample
  const horiz = Math.abs(d1[0]);
  // "up" side of the upper arm: the normal with negative y; near vertical, the side away from the body.
  const nC = nrm[iC];
  const outward = isL ? -1 : 1;
  const upSgn =
    Math.abs(nC[1]) > 0.25
      ? nC[1] < 0
        ? 1
        : -1
      : nC[0] * outward > 0
        ? 1
        : -1;
  const loose = 8;
  // The loose underside sags in a soft U below the upper arm: straight DOWN for a horizontal arm, bellying out
  // sideways (away from the arm) for a near-vertical one.
  const hang = 14 + 20 * horiz;
  const topPts: V[] = [];
  const botPts: V[] = [];
  for (let i = 0; i <= iC; i++) {
    const t = i / iC;
    const w = half[i] + loose + 15 * t * t; // the loose cloth flares toward the cuff
    topPts.push(
      add(
        spine[i],
        mul(
          nrm[i],
          upSgn *
            (w + 7 * Math.sin(Math.PI * t) + 1.5 * Math.sin(Math.PI * t * 2.6)),
        ),
      ),
    );
    const nDn = mul(nrm[i], -upSgn);
    const dv = norm(
      add(mul([0, 1], 0.35 + 0.65 * horiz), mul(nDn, 0.65 * (1 - horiz))),
      [0, 1],
    );
    const u = Math.sin(Math.PI * clamp(t * 0.92, 0, 1));
    const droop = hang * u;
    const sway = clothSway * u;
    botPts.push(
      add(add(spine[i], mul(nDn, w)), add(mul(dv, droop), [sway, 0])),
    );
  }
  // Rounded shoulder cap behind the shoulder, flowing into the body chadar (no ink on its body side).
  const R0 = half[0] + loose;
  const capBack = sub(sh, mul(d1, R0 * 0.4));
  const capTopC1 = sub(topPts[0], mul(tang[0], R0 * 0.25));
  const capTopC2 = add(capBack, mul(nrm[0], upSgn * R0 * 0.55));
  const capBotC1 = add(capBack, mul(nrm[0], -upSgn * R0 * 0.55));
  const capBotC2 = sub(botPts[0], mul(tang[0], R0 * 0.25));
  // Loose, uneven cuff: the underside of the cloth is longer than the top, so the edge runs on a slant and bows
  // out toward the hand with a small irregular dip.
  const Ct = sub(topPts[iC], mul(tang[iC], 6));
  const CbBase = botPts[iC];
  const Cb = add(CbBase, mul(tang[iC], 12 + 24 * (1 - horiz)));
  const cuffMid = add(add(mix(Ct, Cb, 0.42), mul(tang[iC], 12)), [
    clothSway * 0.4,
    3,
  ]);
  const cuffD =
    `Q ${P(add(mix(Ct, cuffMid, 0.5), mul(tang[iC], 5)))} ${P(cuffMid)} ` +
    `Q ${P(add(mix(cuffMid, Cb, 0.5), add(mul(tang[iC], 7), [0, 4])))} ${P(Cb)}`;
  const iMidB = Math.round(iC * 0.82);
  const sleeveFill =
    `M ${P(capBack)} C ${P(capTopC2)} ${P(capTopC1)} ${P(topPts[0])} ` +
    poly(topPts, false) +
    ` ${cuffD} Q ${P(add(CbBase, mul(tang[iC], 2)))} ${P(botPts[iMidB])} ` +
    poly(botPts.slice(0, iMidB).reverse(), false) +
    ` C ${P(capBotC2)} ${P(capBotC1)} ${P(capBack)} Z`;
  // The outer edge is inked from just past the shoulder cap (it continues the body chadar silhouette).
  const topInk = poly(topPts.slice(Math.round(iC * 0.1)));
  // The body chadar's own gradient (ThakurRefTraced outer drapes: bbox x 686..918 / 1008..1240, y 395..842,
  // vector 0.1,0 -> 0.95,1), reproduced in rig space so the sleeve has the body's tone where they meet.
  const gBx = isL ? 686 : 1008;
  const gx1 = gBx + 0.1 * 232;
  const gx2 = gBx + 0.95 * 232;
  const cuffInk = `M ${P(Ct)} ${cuffD}`;
  const iB0 = Math.round(iC * 0.35);
  const botInk =
    `M ${P(Cb)} Q ${P(add(CbBase, mul(tang[iC], 2)))} ${P(botPts[iMidB])} ` +
    poly(botPts.slice(iB0, iMidB).reverse(), false);
  // Shade: the lower part of the drape, its upper boundary a sagging curve that tapers out at the shoulder.
  const shadeTop: V[] = [];
  for (let i = 0; i <= iC; i++) {
    const t = i / iC;
    const k = smooth(t / 0.3);
    shadeTop.push(
      mix(
        botPts[i],
        add(spine[i], mul(nrm[i], -upSgn * half[i] * 0.15)),
        0.75 * k,
      ),
    );
  }
  const sleeveShade =
    poly(shadeTop) +
    ` L ${P(Cb)} Q ${P(add(CbBase, mul(tang[iC], 2)))} ${P(botPts[iMidB])} ` +
    poly(botPts.slice(0, iMidB).reverse(), false) +
    " Z";
  // Fold lines, like the body chadar's: from high on the sleeve sweeping down into the U-fold.
  const fold = (a: number, b: number, inA: number, sagK: number) => {
    const A = mix(topPts[Math.round(iC * a)], spine[Math.round(iC * a)], inA);
    const B = mix(botPts[Math.round(iC * b)], spine[Math.round(iC * b)], 0.18);
    const C = add(
      mix(A, B, 0.5),
      add(mul(tang[Math.round(iC * b)], 6), [0, sagK * hang * 0.35]),
    );
    return `M ${P(A)} Q ${P(C)} ${P(B)}`;
  };
  const fold1 = fold(0.18, 0.55, 0.45, 1);
  const fold2 = fold(0.5, 0.86, 0.35, 0.8);
  const cuffFoldA = mix(Ct, cuffMid, 0.6);
  const cuffFold = `M ${P(cuffFoldA)} Q ${P(add(sub(cuffFoldA, mul(tang[iC], 10)), [0, 4]))} ${P(sub(add(cuffFoldA, mul(nrm[iC], -upSgn * 8)), mul(tang[iC], 20)))}`;

  const iFore0 = iEl;
  const strokeInk = {
    fill: "none",
    stroke: INK,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-up`}>
          <path d={upperFill} />
        </clipPath>
        <clipPath id={`${uid}-fo`}>
          <path d={foreFill} />
        </clipPath>
        <linearGradient
          id={`${uid}-cloth`}
          gradientUnits="userSpaceOnUse"
          x1={gx1}
          y1={395}
          x2={gx2}
          y2={842}
        >
          <stop offset="0%" stopColor={CLOTH_LIT} />
          <stop offset="55%" stopColor={CLOTH} />
          <stop offset="100%" stopColor="#e6d9c4" />
        </linearGradient>
        <clipPath id={`${uid}-slv`}>
          <path d={sleeveFill} />
        </clipPath>
      </defs>

      {/* ---- upper arm (mostly under the sleeve) ---- */}
      <path d={upperFill} fill={SKIN} />
      <g clipPath={`url(#${uid}-up)`}>
        <path d={shadeD(0, iEl)} fill={SKIN_SHADE} opacity={0.8} />
        <path d={litD(0, iEl)} fill={SKIN_LIT} opacity={0.6} />
      </g>
      <path d={upperLine} {...strokeInk} strokeWidth={3.1} />

      {/* ---- chadar sleeve: an opaque loose drape, toned like the body chadar ---- */}
      <path d={sleeveFill} fill={`url(#${uid}-cloth)`} />
      <g clipPath={`url(#${uid}-slv)`}>
        <path d={sleeveShade} fill={CLOTH_SHADE} opacity={0.62} />
        <path
          d={cuffInk}
          fill="none"
          stroke={CLOTH_SHADE}
          strokeWidth={12}
          strokeLinecap="round"
          opacity={0.75}
        />
      </g>
      <path d={fold1} {...strokeInk} strokeWidth={2.3} opacity={0.85} />
      <path d={fold2} {...strokeInk} strokeWidth={2.2} opacity={0.75} />
      <path d={cuffFold} {...strokeInk} strokeWidth={2.0} opacity={0.6} />
      <path d={topInk} {...strokeInk} strokeWidth={3.3} />
      <path d={cuffInk} {...strokeInk} strokeWidth={3.1} />
      <path d={botInk} {...strokeInk} strokeWidth={3.3} />

      {/* ---- forearm, always in front of the cloth ---- */}
      <path d={foreFill} fill={SKIN} />
      <g clipPath={`url(#${uid}-fo)`}>
        <path
          d={shadeD(Math.max(0, iFore0 - 2), NS - 1)}
          fill={SKIN_SHADE}
          opacity={0.8}
        />
        <path
          d={litD(Math.max(0, iFore0 - 2), NS - 1)}
          fill={SKIN_LIT}
          opacity={0.6}
        />
      </g>
      <path
        d={`M ${P(creaseBase)} L ${P(creaseEnd)}`}
        {...strokeInk}
        strokeWidth={2.0}
        opacity={creaseOp}
      />
      <path d={foreLineP} {...strokeInk} strokeWidth={3.1} />
      <path d={foreLineM} {...strokeInk} strokeWidth={3.1} />

      {/* ---- hand: seamless at the wrist (no dark line across the wrist) ---- */}
      <g
        transform={`translate(${wrX.toFixed(1)} ${wrY.toFixed(1)}) rotate(${handRot.toFixed(1)}) scale(${m} 1)`}
      >
        <ThakurRefHand handType={handType} />
      </g>
    </g>
  );
};
