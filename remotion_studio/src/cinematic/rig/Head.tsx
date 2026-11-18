import React from "react";
import { clamp, lerp } from "../core/anim";
import { extremeX, FaceShape, hairBack, hairFront, hairline, HairSpec, headModel, project, silhouette, smoothPath } from "./head3d";
import { MouthState } from "./lipsync";

export type HairStyleV2 = "parted" | "tousled" | "balding" | "cropped" | "veil" | "pigtails" | "wrap" | "baby";

export interface HeadLook {
  skin: string;
  skinLight: string;
  skinShade: string;
  lips: string;
  hair: string;
  hairLight: string;
  hairStyle: HairStyleV2;
  cloth?: { color: string; shade: string; trim?: string }; // veil / turban cloth
  mustache?: string;
  glasses?: boolean;
  tilak?: boolean;
  sindoor?: boolean;
  bindi?: boolean;
  ribbon?: string;
  age: "baby" | "child" | "adult" | "elder";
  divineEyes?: boolean;
}

export interface HeadState {
  yaw: number; // radians, + = face turns to screen-right
  eyeX: number;
  eyeY: number;
  close: number; // 0 open .. 1 closed (blink / lid)
  squint: number;
  brow: number;
  browTilt: number;
  mouth: MouthState;
  smile: number;
  gasp: number;
  cheeks: number;
  flush: number;
  tears: number;
  sway: number; // hair secondary motion
  f: number;
}

const HAIR: Record<HairStyleV2, HairSpec | null> = {
  parted: { front: -0.58, temple: -0.42, side: 0.1, back: 0.42, thick: 0.1, partAlpha: -0.42 },
  tousled: { front: -0.44, temple: -0.36, side: 0.02, back: 0.4, thick: 0.15, jag: 0.05, jagFreq: 13 },
  cropped: { front: -0.62, temple: -0.5, side: -0.05, back: 0.28, thick: 0.045 },
  pigtails: { front: -0.54, temple: -0.38, side: 0.14, back: 0.52, thick: 0.09, partAlpha: 0 },
  veil: { front: -0.52, temple: -0.36, side: 0.08, back: 0.5, thick: 0.08, partAlpha: 0 },
  wrap: { front: -0.4, temple: -0.4, side: 0.05, back: 0.36, thick: 0.05 },
  balding: null,
  baby: { front: -0.86, temple: -0.74, side: -0.5, back: -0.05, thick: 0.015, jag: 0.025, jagFreq: 9 },
};

const TURBAN: HairSpec = { front: -0.42, temple: -0.44, side: -0.36, back: -0.12, thick: 0.22 };
const hashLike = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const lerpHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

const P = (pts: Array<[number, number]>, R: number) => smoothPath(pts, R);

export const Head: React.FC<{
  R: number;
  shape: FaceShape;
  look: HeadLook;
  st: HeadState;
  uid: string;
  keySide: 1 | -1;
  rim: string;
  rimStrength: number;
}> = ({ R, shape, look, st, uid, keySide, rim, rimStrength }) => {
  const m = headModel(shape);
  const s = shape;
  const yaw = clamp(st.yaw, -1.45, 1.45);
  const pr = (a: number, y: number, shell = 1, extra = 0) => project(m, a, y, yaw, shell, extra);
  const X = (v: number) => v * R;
  const child = look.age === "child" || look.age === "baby";
  const elder = look.age === "elder";

  const face = silhouette(m, yaw);
  const facePath = P(face, R);
  // clip-path ids are unique per frame: Chrome caches clip geometry by id during sequential
  // video renders, which left stale eye/lid shapes on screen (ghost eyes, smeared lashes).
  const fk = `f${Math.round(st.f * 100)}`;

  /* ---------------- eyes ---------------- */
  const ew = s.eyeSize * (1 + st.gasp * 0.08);
  const eh = ew * (0.6 + 0.4 * s.eyeRound) * (1 + st.gasp * 0.22);
  const eye = (side: 1 | -1) => {
    const a = side * s.eyeSep;
    const p = pr(a, s.eyeY, 1, -0.03);
    // far eye disappears behind the nose bridge cleanly (short fade, no ghost)
    const vis = clamp((p.n - 0.36) / 0.1);
    if (vis <= 0.02 || p.z < 0.05) return null;
    const sx = clamp(p.n, 0.36, 1);
    const cid = `${uid}-e${side > 0 ? "r" : "l"}-${fk}`;
    const close = clamp(st.close);
    const W = X(ew);
    const H = X(eh);
    const gy = clamp(st.eyeY, -1, 1);
    const lidOpen = -2 * H * (1 - 0.16 * gy); // lid lifts when looking up, drops when looking down
    const lidCY = lerp(lidOpen, H * 0.95, close);
    const lowCY = lerp(2.05 * H * (1 + 0.06 * Math.max(0, gy)), H * 0.25, st.squint);
    // almond ↔ round outline (outer corner slightly lifted)
    const r = s.eyeRound;
    const outer = side;
    const shapeD = `M ${-W} ${outer < 0 ? -H * 0.1 : H * 0.05}
      C ${-W * lerp(0.6, 0.9, r)} ${-H * lerp(1.2, 1.35, r)} ${W * lerp(0.6, 0.9, r)} ${-H * lerp(1.25, 1.35, r)} ${W} ${outer > 0 ? -H * 0.1 : H * 0.05}
      C ${W * lerp(0.6, 0.9, r)} ${H * lerp(1.05, 1.35, r)} ${-W * lerp(0.6, 0.9, r)} ${H * lerp(1.05, 1.35, r)} ${-W} ${outer < 0 ? -H * 0.1 : H * 0.05} Z`;
    const ir = H * (look.age === "baby" ? 0.93 : child ? 0.86 : 0.8);
    const ix = clamp(st.eyeX, -1, 1) * W * 0.42;
    const iy = gy * H * 0.42;
    return (
      <g key={`${side}-${fk}`} transform={`translate(${X(p.x)}, ${X(p.y)}) scale(${sx}, 1)`} opacity={vis}>
        <defs>
          <clipPath id={cid}>
            <path d={shapeD} />
          </clipPath>
        </defs>
        {!child && <ellipse cx={0} cy={-H * 0.2} rx={W * 1.35} ry={H * 1.5} fill={look.skinShade} opacity={0.13} />}
        <g clipPath={`url(#${cid})`}>
          <path d={shapeD} fill="#FBF6EE" />
          <ellipse cx={0} cy={-H * 0.7} rx={W * 1.1} ry={H * 0.7} fill="#cdbbae" opacity={0.45} />
          <circle cx={ix} cy={iy} r={ir} fill={`url(#${uid}-iris)`} />
          <circle cx={ix} cy={iy} r={ir * 0.48} fill="#0d0706" />
          {look.divineEyes ? (
            <g transform={`translate(${ix + ir * 0.34}, ${iy - ir * 0.36})`}>
              <path
                d={`M 0 ${-ir * 0.42} Q ${ir * 0.08} ${-ir * 0.08} ${ir * 0.42} 0 Q ${ir * 0.08} ${ir * 0.08} 0 ${ir * 0.42} Q ${-ir * 0.08} ${ir * 0.08} ${-ir * 0.42} 0 Q ${-ir * 0.08} ${-ir * 0.08} 0 ${-ir * 0.42} Z`}
                fill="#ffffff"
              />
              <circle r={ir * 0.16} fill="#FFF4D6" opacity={0.9} />
            </g>
          ) : (
            <circle cx={ix + ir * 0.34} cy={iy - ir * 0.38} r={ir * 0.28} fill="#ffffff" />
          )}
          <circle cx={ix - ir * 0.3} cy={iy + ir * 0.35} r={ir * 0.12} fill="#ffffff" opacity={0.75} />
          <path d={`M ${-W - 4} 0 Q 0 ${lidCY} ${W + 4} 0 L ${W + 4} ${-H * 2.6} L ${-W - 4} ${-H * 2.6} Z`} fill={look.skin} />
          <path d={`M ${-W - 4} 0 Q 0 ${lowCY} ${W + 4} 0 L ${W + 4} ${H * 2.6} L ${-W - 4} ${H * 2.6} Z`} fill={look.skin} />
        </g>
        {/* upper lash line follows the lid */}
        <path
          d={`M ${-W * 1.02} ${outer < 0 ? -H * 0.1 : H * 0.05} Q 0 ${lerp(-H * 1.75 * (1 - 0.16 * gy), lidCY * 0.98, close)} ${W * 1.02} ${outer > 0 ? -H * 0.1 : H * 0.05}`}
          stroke="#22140e"
          strokeWidth={Math.max(1.2, W * (look.age === "baby" ? 0.09 : child ? 0.16 : 0.13))}
          fill="none"
          strokeLinecap="round"
        />
        {!(look.age === "baby") && <path d={`M ${outer * W * 0.98} ${-H * 0.05} l ${outer * W * 0.22} ${-H * 0.32}`} stroke="#22140e" strokeWidth={Math.max(1, W * 0.1)} strokeLinecap="round" />}
        {!child && close < 0.5 && (
          <path d={`M ${-W * 0.85} ${-H * 1.35} Q 0 ${-H * 1.95} ${W * 0.9} ${-H * 1.3}`} stroke={look.skinShade} strokeWidth={1.2} fill="none" opacity={0.6} />
        )}
        {elder && (
          <g stroke={look.skinShade} strokeWidth={1.1} fill="none" opacity={0.55}>
            <path d={`M ${-W * 0.7} ${H * 1.35} Q 0 ${H * 1.75} ${W * 0.7} ${H * 1.3}`} />
            {[-0.3, 0, 0.3].map((k) => (
              <path key={k} d={`M ${outer * W * 1.15} ${k * H} l ${outer * W * 0.35} ${k * H * 0.6}`} />
            ))}
          </g>
        )}
        {st.tears > 0.05 && (
          <g opacity={st.tears}>
            <path d={`M ${-W * 0.5} ${H * 0.8} Q ${-W * 0.7} ${H * 2.4} ${-W * 0.45} ${H * 3.4}`} stroke="#bfe6ff" strokeWidth={2.2} fill="none" strokeLinecap="round" />
            <circle cx={-W * 0.45} cy={H * 3.5 + ((st.f * 1.3) % 10)} r={2.2} fill="#d8f1ff" />
          </g>
        )}
      </g>
    );
  };

  /* ---------------- brows ---------------- */
  const browCol = ["veil", "wrap", "balding", "baby"].includes(look.hairStyle) || look.hair.startsWith("#d") || look.hair.startsWith("#e")
    ? look.age === "elder"
      ? "#9c948a"
      : look.age === "baby"
        ? "#6a4a38"
        : "#2a1a14"
    : look.hair;
  const brow = (side: 1 | -1) => {
    const a = side * s.eyeSep * 1.02;
    const y = s.eyeY - (child ? 0.22 : 0.2) - st.brow * 0.06 - st.gasp * 0.05;
    const p = pr(a, y, 1, 0.02);
    const vis = clamp((p.n - 0.34) / 0.1);
    if (vis <= 0.02 || p.z < 0.05) return null;
    const sx = clamp(p.n, 0.36, 1);
    const W = X(ew * 1.15);
    const inner = st.browTilt * X(0.045);
    const thick = X(look.age === "baby" ? 0.02 : child ? 0.036 : 0.044);
    return (
      <path
        key={side}
        transform={`translate(${X(p.x)}, ${X(p.y)}) scale(${sx * -side}, 1)`}
        d={`M ${-W} ${-inner} Q ${-W * 0.1} ${-thick * 1.6 - inner * 0.5} ${W} ${thick * 0.5} Q ${-W * 0.1} ${-inner * 0.5} ${-W} ${-inner + thick} Z`}
        fill={browCol}
        opacity={(look.age === "baby" ? 0.3 : 1) * vis}
      />
    );
  };

  /* ---------------- nose ---------------- */
  const tip = pr(0, m.noseTipY, 1);
  const noseRootY = s.eyeY - 0.02;
  const noseContour: Array<[number, number]> = [];
  if (Math.abs(yaw) > 0.12) {
    for (let i = 0; i <= 8; i++) {
      const y = noseRootY + ((m.noseTipY + 0.03 - noseRootY) * i) / 8;
      // nose ridge as seen from the camera: the extreme x among nose-surface points,
      // kept only when it comes from the nose itself (not the cheek beside it)
      let best = yaw > 0 ? -Infinity : Infinity;
      let bestA = 0;
      for (let a = -0.4; a <= 0.4; a += 0.02) {
        const q = pr(a, y);
        if (yaw > 0 ? q.x > best : q.x < best) {
          best = q.x;
          bestA = a;
        }
      }
      if (Math.abs(bestA) < 0.24 && m.bump(bestA, y) > 0.05) noseContour.push([best, y]);
    }
  }
  const nostril = (side: 1 | -1) => {
    const p = pr(side * 0.075 * s.noseWidth, m.noseTipY + 0.055, 1, 0.04);
    if (p.z < 0.15 || p.n < 0.25) return null;
    if (Math.abs(yaw) > 0.45 && side * yaw > 0) return null; // far nostril hides behind the nose
    return (
      <ellipse
        key={side}
        cx={X(p.x)}
        cy={X(p.y)}
        rx={X(0.03 * s.noseWidth) * clamp(p.n, 0.3, 1)}
        ry={X(0.017)}
        fill={look.skinShade}
        opacity={0.75}
        transform={`rotate(${side * 18}, ${X(p.x)}, ${X(p.y)})`}
      />
    );
  };

  /* ---------------- mouth ---------------- */
  const mw = 0.3 * (child ? 0.85 : 1) * (look.age === "baby" ? 0.6 : 1);
  const mo = st.mouth;
  const open = Math.max(mo.open, st.gasp * 0.9);
  const round = Math.max(mo.round, st.gasp * 0.8);
  const widthK = (st.gasp > 0.1 ? lerp(mo.width, 0.75, st.gasp) : mo.width) * (1 + 0.12 * st.smile) * (1 - 0.32 * round);
  const cL = pr(-mw * widthK, m.mouthY - st.smile * 0.04, 1, 0.02);
  const cR = pr(mw * widthK, m.mouthY - st.smile * 0.04, 1, 0.02);
  const cM = pr(0, m.mouthY, 1, 0.03);
  const xl = X(cL.z > -0.05 ? cL.x : cM.x - 0.02);
  const xr = X(cR.z > -0.05 ? cR.x : cM.x + 0.02);
  const cx = X(cM.x);
  const my = X(m.mouthY);
  const cornerY = my - X(st.smile * 0.045);
  const oh = X(mw * 1.1 * open);
  const midY = my + X(st.smile * 0.06);
  const mid = `${uid}-mouth-${fk}`;
  const lipW = Math.max(1.6, R * 0.05 * (0.55 + 0.45 * Math.cos(yaw)));
  const mouthEl =
    st.cheeks > 0.3 ? (
      <path d={`M ${cx - X(0.07)} ${my} Q ${cx} ${my - X(0.02)} ${cx + X(0.07)} ${my}`} stroke="#5a1f1c" strokeWidth={lipW} fill="none" strokeLinecap="round" />
    ) : oh < 1.4 ? (
      <g>
        <path d={`M ${xl} ${cornerY} Q ${cx} ${midY} ${xr} ${cornerY}`} stroke="#5a1f1c" strokeWidth={lipW} fill="none" strokeLinecap="round" />
        <path
          d={`M ${lerp(xl, cx, 0.45)} ${my + X(0.08)} Q ${cx} ${my + X(0.11 + st.smile * 0.02)} ${lerp(xr, cx, 0.45)} ${my + X(0.08)}`}
          stroke={look.lips}
          strokeWidth={lipW * 0.8}
          fill="none"
          strokeLinecap="round"
          opacity={0.7}
        />
      </g>
    ) : (
      <g key={fk}>
        <defs>
          <clipPath id={mid}>
            <path d={`M ${xl} ${cornerY} C ${lerp(xl, cx, 0.4 + round * 0.25)} ${my - oh * 0.5} ${lerp(xr, cx, 0.4 + round * 0.25)} ${my - oh * 0.5} ${xr} ${cornerY} C ${lerp(xr, cx, 0.3 + round * 0.2)} ${my + oh * 1.05} ${lerp(xl, cx, 0.3 + round * 0.2)} ${my + oh * 1.05} ${xl} ${cornerY} Z`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${mid})`}>
          <rect x={xl - 4} y={my - oh} width={xr - xl + 8} height={oh * 2.6} fill="#3e1013" />
          {mo.teeth > 0.05 && <rect x={xl} y={my - oh * 0.55} width={xr - xl} height={oh * 0.36 * (0.3 + mo.teeth)} fill="#fbf4ea" />}
          <ellipse cx={cx} cy={my + oh * 0.85} rx={(xr - xl) * 0.36} ry={oh * 0.42} fill="#c25a5f" />
        </g>
        <path
          d={`M ${xl} ${cornerY} C ${lerp(xl, cx, 0.4 + round * 0.25)} ${my - oh * 0.5} ${lerp(xr, cx, 0.4 + round * 0.25)} ${my - oh * 0.5} ${xr} ${cornerY} C ${lerp(xr, cx, 0.3 + round * 0.2)} ${my + oh * 1.05} ${lerp(xl, cx, 0.3 + round * 0.2)} ${my + oh * 1.05} ${xl} ${cornerY} Z`}
          fill="none"
          stroke={look.lips}
          strokeWidth={lipW}
        />
      </g>
    );

  /* ---------------- ears ---------------- */
  const ear = (side: 1 | -1) => {
    const a = side * Math.PI * 0.5;
    const p = pr(a, s.earY, 1);
    const nEar = Math.cos(a + yaw);
    if (p.z < -0.45) return null;
    const rx = X((0.06 + 0.1 * Math.max(0, -side * Math.sin(yaw) + 0.05)) * s.earSize);
    const ry = X(0.21 * s.earSize);
    return (
      <g key={side} transform={`translate(${X(p.x)}, ${X(p.y)})`}>
        <ellipse cx={0} cy={0} rx={rx} ry={ry} fill={look.skin} />
        {nEar > -0.2 && <ellipse cx={-side * rx * 0.1} cy={ry * 0.05} rx={rx * 0.5} ry={ry * 0.62} fill={look.skinShade} opacity={0.6} />}
      </g>
    );
  };

  /* ---------------- hair ---------------- */
  const hs = HAIR[look.hairStyle];
  const hairBackPath = hs ? P(hairBack(m, hs, yaw), R) : null;
  const hairFrontPts = hs ? hairFront(m, hs, yaw) : null;
  const balding = look.hairStyle === "balding" ? P(silhouette(m, yaw, 1.035, -0.32, 0.22, 14), R) : null;
  const turbanPts = look.hairStyle === "wrap" ? hairFront(m, TURBAN, yaw) : null;
  const partP = hs?.partAlpha !== undefined ? pr(hs.partAlpha, hs.front - 0.02, 1 + hs.thick) : null;
  const partTop = hs?.partAlpha !== undefined ? pr(hs.partAlpha * 0.6, m.top + 0.25, 1 + hs.thick) : null;
  const crown = pr(0, m.top + 0.25, 1.1);
  /* ---- ghomta: the saree anchal drawn over the head ----
   * Sits back on the head (the sindoor parting shows), frames the face in front of the ears,
   * falls from the head onto the shoulders. The laal-paar border runs only along the face edge. */
  const ghomta = (() => {
    if (look.hairStyle !== "veil") return null;
    const shell = 1.15;
    const yHang = 0.05; // below this the cloth hangs free instead of hugging the jaw
    const yShoulder = 1.6;
    const edgeY = (a: number) => -0.8 + 1.35 * Math.pow(Math.min(1, Math.abs(a) / 1.4), 1.8);
    const edge: Array<[number, number]> = [];
    for (let i = 0; i <= 64; i++) {
      const a = -1.7 + (i / 64) * 3.4;
      const y = edgeY(a);
      const yy = Math.min(y, yHang);
      const p = project(m, a, yy, yaw, shell);
      if (p.z <= 0) continue;
      // below the hang line the edge drops straight down beside the cheek
      edge.push([p.x, y > yHang ? y : yy]);
    }
    if (edge.length < 3) return null;
    const L = edge[0];
    const Rt = edge[edge.length - 1];
    const sideX = (y: number, side: 1 | -1) => {
      const base = extremeX(m, Math.min(y, yHang), yaw, shell, side);
      return y > yHang ? base + side * (y - yHang) * 0.22 : base;
    };
    const contour = (fromY: number, toY: number, side: 1 | -1) => {
      const out: Array<[number, number]> = [];
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const y = fromY + ((toY - fromY) * i) / n;
        out.push([sideX(y, side), y]);
      }
      return out;
    };
    // rounded dome over the crown (no peak): contours start below the top and meet at a soft apex
    const top = m.top + 0.06;
    const apex: [number, number] = [(sideX(top, -1) + sideX(top, 1)) / 2, m.top - 0.15];
    // whole cloth: hood + two side panels to the shoulders, open at the neck (no bib)
    const chinY = m.bottom + 0.08;
    const outline: Array<[number, number]> = [
      apex,
      ...contour(top, yShoulder, -1),
      [L[0] + 0.12, yShoulder],
      [L[0] + 0.16, chinY],
      [Rt[0] - 0.16, chinY],
      [Rt[0] - 0.12, yShoulder],
      ...contour(top, yShoulder, 1).reverse(),
    ];
    // cap in front of the hair: crown down to the visible face edge
    const cap: Array<[number, number]> = [apex, ...contour(top, Math.min(L[1], yShoulder), -1), ...edge, ...contour(top, Math.min(Rt[1], yShoulder), 1).reverse()];
    // border runs down the face edge and continues down the drape on both sides
    const borderPts: Array<[number, number]> = [
      [sideX(yShoulder, -1) + 0.08, yShoulder],
      [L[0] + 0.02, Math.max(L[1], yHang + 0.2)],
      ...edge,
      [Rt[0] - 0.02, Math.max(Rt[1], yHang + 0.2)],
      [sideX(yShoulder, 1) - 0.08, yShoulder],
    ];
    // soft folds that start part-way down the crown (not converging to a point)
    const folds = [-0.75, -0.2, 0.45].map((a) => {
      const p1 = pr(a * 0.8, m.top + 0.38, shell);
      const p2 = pr(a * 1.15, -0.66, shell);
      return p1.z > 0 && p2.z > 0 ? `M ${X(p1.x)} ${X(p1.y)} Q ${X((p1.x + p2.x) / 2 + a * 0.08)} ${X((p1.y + p2.y) / 2)} ${X(p2.x)} ${X(p2.y)}` : null;
    });
    return {
      outline: P(outline, R),
      cap: P(cap, R),
      edge: smoothPath(edge, R, false),
      border: smoothPath(borderPts, R, false),
      folds,
      drapeFolds: [-1, 1].map((side) => {
        const x0 = sideX(0.4, side as 1 | -1) - side * 0.1;
        return `M ${X(x0)} ${X(0.35)} Q ${X(x0 + side * 0.06)} ${X(0.95)} ${X(x0 + side * 0.12)} ${X(yShoulder - 0.05)}`;
      }),
    };
  })();

  /* ---- hair detail: locks along the hairline, sideburns, strands, tufted outline ---- */
  const LOCKY = ["parted", "tousled", "cropped", "pigtails", "veil"].includes(look.hairStyle);
  const hairDetail = (() => {
    if (!hs || !LOCKY) return null;
    const shell = 1 + hs.thick;
    const part = hs.partAlpha ?? 0;
    const lockLen = look.hairStyle === "tousled" ? 0.17 : look.hairStyle === "parted" ? 0.11 : look.hairStyle === "cropped" ? 0.05 : 0.07;
    const pts: Array<{ a: number; x: number; y: number; n: number }> = [];
    for (let a = -1.95; a <= 1.95; a += look.hairStyle === "tousled" ? 0.13 : 0.15) {
      const y = Math.min(hairline(hs, a), m.bottom - 0.15);
      const q = project(m, a, y, yaw, shell);
      if (q.z > 0.02) pts.push({ a, x: q.x, y, n: q.n });
    }
    const locks = pts.map((q, i) => {
      const dir = Math.abs(q.a - part) < 0.06 ? 0 : Math.sign(q.a - part); // flow away from the parting
      const jig = look.hairStyle === "tousled" ? (i % 2 ? 0.05 : -0.03) : 0;
      const len = lockLen * (0.7 + 0.6 * hashLike(i + 3)) * clamp(q.n + 0.3, 0.4, 1);
      const bx = q.x;
      const by = q.y - 0.05;
      const tx = bx + dir * len * 0.85 + jig + st.sway * 0.004;
      const ty = by + len * (look.hairStyle === "tousled" ? 0.9 : 0.75);
      const w = 0.045 * clamp(q.n + 0.4, 0.5, 1);
      return `M ${X(bx - w)} ${X(by)} Q ${X((bx + tx) / 2 - w * 0.4)} ${X((by + ty) / 2 + 0.01)} ${X(tx)} ${X(ty)} Q ${X((bx + tx) / 2 + w * 0.9)} ${X((by + ty) / 2 - 0.01)} ${X(bx + w)} ${X(by)} Z`;
    });
    // tapered sideburns where the cap meets the face edge (removes the helmet corner)
    const burns: string[] = [];
    if (look.hairStyle === "parted" || look.hairStyle === "cropped" || look.hairStyle === "tousled") {
      for (const q of [pts[0], pts[pts.length - 1]]) {
        if (!q || Math.abs(q.a) < 1.0) continue;
        const side = Math.sign(q.a);
        const by = q.y - 0.04;
        burns.push(`M ${X(q.x - side * 0.03)} ${X(by)} Q ${X(q.x + side * 0.015)} ${X(by + 0.11)} ${X(q.x + side * 0.01)} ${X(by + 0.2)} Q ${X(q.x - side * 0.02)} ${X(by + 0.1)} ${X(q.x - side * 0.065)} ${X(by + 0.02)} Z`);
      }
    }
    // strand highlights flowing from the crown / parting to the hairline
    // each strand starts along the parting (not one shared point) and flows out to the hairline
    const strands = pts
      .filter((_, i) => i % 3 === 1)
      .map((q) => {
        const sa = part + (q.a - part) * 0.3;
        const st0 = pr(sa, m.top + 0.32, shell);
        if (st0.z < 0) return null;
        const mx = (st0.x + q.x) / 2 + Math.sign(q.a - part) * 0.05;
        const my = (st0.y + q.y) / 2 - 0.04;
        return `M ${X(st0.x)} ${X(st0.y)} Q ${X(mx)} ${X(my)} ${X(q.x)} ${X(q.y - 0.1)}`;
      })
      .filter((d): d is string => d !== null);
    // tufted outline: small bumps along the top of the hair silhouette
    // tufted outline only for loose hair (tousled / cropped); combed adult hair stays smooth
    const loose = look.hairStyle === "tousled" || look.hairStyle === "cropped";
    const back = loose ? hairBack(m, hs, yaw).filter(([, y]) => y < -0.42) : [];
    const tufts = back.filter((_, i) => i % 3 === 0).map(([x, y]) => ({ x, y }));
    return { locks, burns, strands, tufts };
  })();

  // skin gradient direction: lit side → shade side
  const kx1 = keySide < 0 ? "0" : "1";
  const kx2 = keySide < 0 ? "1" : "0";
  const rx1 = keySide < 0 ? "1" : "0";
  const rx2 = keySide < 0 ? "0" : "1";
  const cloth = look.cloth ?? { color: "#f5efe6", shade: "#d9cfc0" };

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-skin`} x1={kx1} y1="0.2" x2={kx2} y2="0.8">
          <stop offset="0%" stopColor={look.skinLight} />
          <stop offset="50%" stopColor={look.skin} />
          <stop offset="100%" stopColor={look.skinShade} />
        </linearGradient>
        <linearGradient id={`${uid}-hrim`} x1={rx1} y1="0" x2={rx2} y2="0">
          <stop offset="0%" stopColor={rim} stopOpacity={0} />
          <stop offset="80%" stopColor={rim} stopOpacity={0} />
          <stop offset="100%" stopColor={rim} stopOpacity={rimStrength} />
        </linearGradient>
        <radialGradient id={`${uid}-iris`} cx="0.5" cy="0.65" r="0.6">
          <stop offset="0%" stopColor="#8a5a34" />
          <stop offset="60%" stopColor="#4a2a17" />
          <stop offset="100%" stopColor="#1e110a" />
        </radialGradient>
        <linearGradient id={`${uid}-hairg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={look.hairLight} />
          <stop offset="35%" stopColor={look.hair} />
          <stop offset="100%" stopColor={look.hair} />
        </linearGradient>
      </defs>

      {/* ghomta: full cloth silhouette behind the face, falling to the shoulders */}
      {ghomta && (
        <g>
          <defs>
            <linearGradient id={`${uid}-ghd`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cloth.color} />
              <stop offset="100%" stopColor={cloth.shade} />
            </linearGradient>
            <linearGradient id={`${uid}-ghc`} x1={kx1} y1="0" x2={kx2} y2="0.6">
              <stop offset="0%" stopColor={lerpHex(cloth.color, "#ffffff", 0.35)} />
              <stop offset="55%" stopColor={cloth.color} />
              <stop offset="100%" stopColor={cloth.shade} />
            </linearGradient>
          </defs>
          <path d={ghomta.outline} fill={`url(#${uid}-ghd)`} />
          {ghomta.drapeFolds.map((d, i) => (
            <path key={i} d={d} stroke={cloth.shade} strokeWidth={R * 0.035} fill="none" opacity={0.6} strokeLinecap="round" />
          ))}
        </g>
      )}
      {hairBackPath && <path d={hairBackPath} fill={look.hair} opacity={look.hairStyle === "baby" ? 0.55 : 1} />}
      {hairDetail && hairDetail.tufts.map((t, i) => <circle key={`tf${i}`} cx={X(t.x)} cy={X(t.y)} r={X(look.hairStyle === "tousled" ? 0.055 : 0.04)} fill={look.hair} />)}
      {balding && <path d={balding} fill={look.hair} />}
      {look.hairStyle === "pigtails" &&
        [-1, 1].map((side) => {
          const p = pr(side * 1.9, 0.25, 1.05);
          return (
            <g key={side} transform={`translate(${X(p.x)}, ${X(p.y)}) rotate(${side * -10 + st.sway * 2})`}>
              <path d={`M -6 0 Q ${side * 7} ${X(0.5)} ${side * 2} ${X(0.95)} L ${side * 12} ${X(0.95)} Q ${side * 16} ${X(0.45)} 8 0 Z`} fill={look.hair} />
              <circle cx={side * 7} cy={X(0.98)} r={X(0.07)} fill={look.ribbon ?? "#e0405a"} />
            </g>
          );
        })}
      {ear(-1)}
      {ear(1)}

      {/* face */}
      <path d={facePath} fill={`url(#${uid}-skin)`} />
      {/* soft form shading: under-cheekbone & jaw */}
      {[-1, 1].map((side) => {
        const p = pr(side * 0.75, s.eyeY + 0.42, 1);
        if (p.z < 0) return null;
        return <ellipse key={side} cx={X(p.x)} cy={X(p.y)} rx={X(0.2 * clamp(p.n, 0.2, 1))} ry={X(0.24)} fill={look.skinShade} opacity={child ? 0.08 : 0.16} />;
      })}
      <path d={facePath} fill={`url(#${uid}-hrim)`} />
      {st.flush > 0.01 && <path d={facePath} fill="#d63a3a" opacity={st.flush * 0.33} />}
      {/* ink contour: keeps the face shape readable against warm backgrounds and in motion */}
      <path d={facePath} fill="none" stroke={lerpHex(look.skinShade, "#2a140c", 0.5)} strokeWidth={Math.max(1.2, R * 0.024)} opacity={0.6} strokeLinejoin="round" />

      <defs key={`d${fk}`}>
        <clipPath id={`${uid}-faceclip-${fk}`}>
          <path d={facePath} />
        </clipPath>
      </defs>
      <g key={`g${fk}`} clipPath={`url(#${uid}-faceclip-${fk})`}>
      {/* cheeks */}
      {[-1, 1].map((side) => {
        const p = pr(side * 0.6, s.eyeY + 0.3 - st.smile * 0.03, 1);
        if (p.z < 0.1) return null;
        return (
          <ellipse
            key={side}
            cx={X(p.x)}
            cy={X(p.y)}
            rx={X(0.15 * clamp(p.n, 0.3, 1) * (1 + st.cheeks * 0.5))}
            ry={X(0.08 * (1 + st.cheeks * 0.4))}
            fill="#e8705f"
            opacity={(child ? 0.3 : 0.15) + st.smile * 0.08 + st.cheeks * 0.25}
          />
        );
      })}

      {/* age lines */}
      {(elder || look.age === "adult") && (
        <g stroke={look.skinShade} fill="none" strokeLinecap="round" opacity={elder ? 0.6 : 0.3}>
          {[-1, 1].map((side) => {
            const a = pr(side * 0.17, m.noseTipY + 0.02);
            const b = pr(side * 0.36, m.mouthY + 0.08);
            if (a.z < 0.1 || b.z < 0.1) return null;
            return (
              <path
                key={side}
                d={`M ${X(a.x)} ${X(a.y)} Q ${X((a.x + b.x) / 2 + side * 0.06)} ${X((a.y + b.y) / 2)} ${X(b.x)} ${X(b.y)}`}
                strokeWidth={1.4}
              />
            );
          })}
          {elder &&
            [-0.5, -0.42].map((y) => {
              const pts = [-0.45, -0.2, 0, 0.2, 0.45].map((a) => pr(a, y + Math.abs(a) * 0.04)).filter((p) => p.z > 0.1);
              if (pts.length < 3) return null;
              return <polyline key={y} points={pts.map((p) => `${X(p.x)},${X(p.y)}`).join(" ")} strokeWidth={1.2} />;
            })}
        </g>
      )}

      {brow(-1)}
      {brow(1)}
      {eye(-1)}
      {eye(1)}

      {/* nose */}
      {noseContour.length > 2 && (
        <polyline
          points={noseContour.map(([x, y]) => `${X(x)},${X(y)}`).join(" ")}
          stroke={look.skinShade}
          strokeWidth={Math.max(1.5, R * 0.035)}
          fill="none"
          strokeLinecap="round"
          opacity={clamp(Math.abs(yaw) * 2, 0, 0.8)}
        />
      )}

      <ellipse cx={X(tip.x)} cy={X(m.noseTipY + 0.06)} rx={X(0.1 * s.noseWidth)} ry={X(0.035)} fill={look.skinShade} opacity={0.35} />
      <ellipse cx={X(tip.x - keySide * 0.02)} cy={X(m.noseTipY - 0.02)} rx={X(0.04)} ry={X(0.03)} fill="#ffffff" opacity={0.3} />
      {nostril(-1)}
      {nostril(1)}

      {mouthEl}
      {look.mustache && (
        <path
          d={`M ${xl - X(0.06)} ${my - X(0.01)} Q ${lerp(xl, cx, 0.4)} ${my - X(0.12)} ${cx} ${my - X(0.07)} Q ${lerp(xr, cx, 0.4)} ${my - X(0.12)} ${xr + X(0.06)} ${my - X(0.01)} Q ${lerp(xr, cx, 0.5)} ${my - X(0.04)} ${cx} ${my - X(0.03)} Q ${lerp(xl, cx, 0.5)} ${my - X(0.04)} ${xl - X(0.06)} ${my - X(0.01)} Z`}
          fill={look.mustache}
        />
      )}

      </g>

      {/* hair cap in front */}
      {hairFrontPts && look.hairStyle !== "wrap" && (
        <g opacity={look.hairStyle === "baby" ? 0.55 : 1}>
          <path d={P(hairFrontPts, R)} fill={`url(#${uid}-hairg)`} />
          {hairDetail && (
            <>
              {hairDetail.burns.map((d, i) => <path key={`sb${i}`} d={d} fill={look.hair} />)}
              {hairDetail.locks.map((d, i) => <path key={`lk${i}`} d={d} fill={look.hair} />)}
              {hairDetail.strands.map((d, i) => (
                <path key={`st${i}`} d={d} stroke={look.hairLight} strokeWidth={R * 0.02} fill="none" opacity={0.16} strokeLinecap="round" />
              ))}
            </>
          )}
          {crown.z > -0.3 && (
            <path
              d={`M ${X(crown.x - 0.35)} ${X(crown.y + 0.08)} Q ${X(crown.x)} ${X(crown.y - 0.08)} ${X(crown.x + 0.4)} ${X(crown.y + 0.12)}`}
              stroke={look.hairLight}
              strokeWidth={R * 0.07}
              fill="none"
              opacity={0.45}
              strokeLinecap="round"
            />
          )}
          {look.sindoor && partP && partTop && partP.z > 0.25 && (
            <path d={`M ${X(lerp(partP.x, partTop.x, 0.12))} ${X(lerp(partP.y, partTop.y, 0.12))} L ${X(partTop.x)} ${X(partTop.y)}`} stroke={look.sindoor ? "#d0162d" : look.skinShade} strokeWidth={look.sindoor ? R * 0.06 : R * 0.03} strokeLinecap="round" opacity={0.9} />
          )}
        </g>
      )}
      {look.hairStyle === "tousled" && crown.z > -0.4 && (
        <path d={`M ${X(crown.x)} ${X(m.top - 0.1)} q ${X(0.1 + st.sway * 0.05)} ${X(-0.3)} ${X(0.32 + st.sway * 0.08)} ${X(-0.28)}`} stroke={look.hair} strokeWidth={R * 0.09} fill="none" strokeLinecap="round" />
      )}
      {look.hairStyle === "baby" && crown.z > -0.4 && (
        <path d={`M ${X(crown.x - 0.05)} ${X(m.top + 0.02)} q ${X(0.04 + st.sway * 0.04)} ${X(-0.2)} ${X(0.2 + st.sway * 0.05)} ${X(-0.16)} q ${X(0.08)} ${X(0.02)} ${X(0.02)} ${X(0.09)}`} stroke={look.hair} strokeWidth={R * 0.07} fill="none" strokeLinecap="round" />
      )}
      {look.hairStyle === "cropped" && (
        <path d={`M ${X(crown.x)} ${X(m.top - 0.02)} q ${X(0.06 + st.sway * 0.04)} ${X(-0.3)} ${X(0.24 + st.sway * 0.06)} ${X(-0.36)}`} stroke={look.hair} strokeWidth={R * 0.08} fill="none" strokeLinecap="round" />
      )}
      {turbanPts && (
        <g>
          <path d={P(turbanPts, R)} fill={cloth.color} />
          {[-0.5, -0.1, 0.3].map((a) => {
            const p1 = pr(a, -0.75, 1.24);
            const p2 = pr(a + 0.25, -0.45, 1.24);
            if (p1.z < 0 || p2.z < 0) return null;
            return <path key={a} d={`M ${X(p1.x)} ${X(p1.y)} L ${X(p2.x)} ${X(p2.y)}`} stroke={cloth.trim ?? "#f0e2c8"} strokeWidth={R * 0.05} opacity={0.65} />;
          })}
          {(() => {
            const k = pr(0.7, -0.62, 1.26);
            return k.z > -0.2 ? <ellipse cx={X(k.x)} cy={X(k.y)} rx={X(0.2)} ry={X(0.15)} fill={cloth.shade} /> : null;
          })()}
        </g>
      )}
      {ghomta && (
        <g>
          {/* soft contact shadow where the cloth edge lies on hair and cheek */}
          <path d={ghomta.edge} stroke="#2a1410" strokeWidth={R * 0.16} fill="none" opacity={0.22} strokeLinecap="round" />
          <path d={ghomta.cap} fill={`url(#${uid}-ghc)`} />
          {ghomta.folds.map((d, i) => (d ? <path key={i} d={d} stroke={cloth.shade} strokeWidth={R * 0.03} fill="none" opacity={0.55} strokeLinecap="round" /> : null))}
          {/* laal paar: border only along the face edge and down the drape */}
          {cloth.trim && (
            <>
              <path d={ghomta.border} stroke={cloth.trim} strokeWidth={R * 0.1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d={ghomta.border} stroke="#e8b84a" strokeWidth={R * 0.018} fill="none" opacity={0.85} transform={`translate(0, ${-R * 0.035})`} />
            </>
          )}
        </g>
      )}

      {look.glasses &&
        (() => {
          const L = pr(-s.eyeSep, s.eyeY, 1, 0.08);
          const Rr = pr(s.eyeSep, s.eyeY, 1, 0.08);
          const rr = X(s.eyeSize * 1.45);
          return (
            <g stroke="#3b2a1c" strokeWidth={Math.max(2, R * 0.05)} fill="#ffffff" fillOpacity={0.08}>
              {L.z > 0 && <ellipse cx={X(L.x)} cy={X(L.y)} rx={rr * clamp(L.n, 0.15, 1)} ry={rr} />}
              {Rr.z > 0 && <ellipse cx={X(Rr.x)} cy={X(Rr.y)} rx={rr * clamp(Rr.n, 0.15, 1)} ry={rr} />}
              <path d={`M ${X(L.x) + rr * clamp(L.n, 0.15, 1)} ${X(L.y)} Q ${X(tip.x)} ${X(s.eyeY - 0.06)} ${X(Rr.x) - rr * clamp(Rr.n, 0.15, 1)} ${X(Rr.y)}`} fill="none" />
            </g>
          );
        })()}
      {look.tilak &&
        (() => {
          const p = pr(0, s.eyeY - 0.36, 1, 0.03);
          return p.z > 0 ? <path d={`M ${X(p.x) - 3} ${X(p.y) - X(0.12)} L ${X(p.x)} ${X(p.y) + X(0.06)} L ${X(p.x) + 3} ${X(p.y) - X(0.12)} Z`} fill="#e9a23b" /> : null;
        })()}
      {look.bindi &&
        (() => {
          const p = pr(0, s.eyeY - 0.24, 1, 0.03);
          return p.z > 0 ? <ellipse cx={X(p.x)} cy={X(p.y)} rx={X(0.045 * clamp(p.n, 0.3, 1))} ry={X(0.045)} fill="#c3122a" /> : null;
        })()}
    </g>
  );
};
