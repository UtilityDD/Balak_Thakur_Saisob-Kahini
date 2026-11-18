import React, { useId } from "react";
import { blink, clamp, flicker, lerp, noise1, safeId, saccade } from "../core/anim";
import { Hand, HandShape } from "./Hand";
import { Head, HeadLook } from "./Head";
import { FACE_ADULT_F, FACE_ADULT_M, FACE_CHILD, FaceShape, headModel, smoothPath } from "./head3d";
import { MOUTH_REST, MouthState } from "./lipsync";

/**
 * Character rig v2.
 *  - Head: true 3D-projected head (head3d.ts / Head.tsx) — 3/4 & profile turns, distinct face shapes.
 *  - Body: torso turns in 3/4 (bodyTurn); far arm / far leg tuck behind the body.
 *  - Legs: hip/knee/ankle posed in 3D (thigh pitch, knee bend, abduction) and projected;
 *    ground contact is solved automatically (walk, crouch, one-knee kneel, cross-legged sit).
 *  - Hands: five fingers with curl, palm/back/side views and gesture presets (Hand.tsx).
 *  - Clothing built over the legs: dhoti wraps each leg + front pleats; saree/frock hulls the legs.
 */

export type { HandShape } from "./Hand";
export type HairStyle = "parted" | "tousled" | "balding" | "cropped" | "veil" | "pigtails" | "wrap";
export type Outfit = "kurta" | "vest" | "bare" | "frock" | "blouse";
export type Lower = "dhoti" | "saree" | "none";

export interface CastMember {
  id: string;
  age: "child" | "adult" | "elder";
  sex?: "m" | "f";
  height: number;
  girth: number;
  skin: string;
  skinLight: string;
  skinShade: string;
  lips: string;
  hair: string;
  hairLight: string;
  hairStyle: HairStyle;
  outfit: Outfit;
  top: string;
  topLight: string;
  topShade: string;
  topTrim?: string;
  sleeve: "full" | "rolled" | "half" | "none";
  lower: Lower;
  lowerColor: string;
  lowerShade: string;
  lowerTrim?: string;
  dhotiLength?: "knee" | "calf";
  scarf?: { color: string; shade: string; trim?: string; style: "drape" | "neck" | "shawl" | "check" };
  mustache?: string;
  glasses?: boolean;
  tilak?: boolean;
  sindoor?: boolean;
  bindi?: boolean;
  paita?: boolean;
  wiry?: boolean;
  ribbon?: string;
  face?: Partial<FaceShape>;
  seed: number;
}

export interface Pose {
  lean: number;
  bodyX: number;
  bodyY: number;
  bodyTurn: number;
  crouch: number;
  headTurn: number;
  headTilt: number;
  headNod: number;
  eyeX: number;
  eyeY: number;
  lid: number;
  brow: number;
  browTilt: number;
  smile: number;
  gasp: number;
  cheeks: number;
  flush: number;
  tears: number;
  rS: number;
  rE: number;
  lS: number;
  lE: number;
  rHand: HandShape;
  lHand: HandShape;
  rProp: string;
  lProp: string;
  stride: number;
  rBack: number;
  lBack: number;
}

export const BASE_POSE: Pose = {
  lean: 0,
  bodyX: 0,
  bodyY: 0,
  bodyTurn: 0,
  crouch: 0,
  headTurn: 0,
  headTilt: 0,
  headNod: 0,
  eyeX: 0,
  eyeY: 0,
  lid: 0,
  brow: 0,
  browTilt: 0,
  smile: 0.35,
  gasp: 0,
  cheeks: 0,
  flush: 0,
  tears: 0,
  rS: 6,
  rE: -8,
  lS: 6,
  lE: -8,
  rHand: "relaxed",
  lHand: "relaxed",
  rProp: "",
  lProp: "",
  stride: 0,
  rBack: 0,
  lBack: 0,
};

export interface PropCtx {
  f: number;
  worldRot: number;
  side: 1 | -1;
  scale: number;
}
export type PropRenderer = (ctx: PropCtx) => React.ReactNode;

/** A light source in the same coordinates as the puppet (diya, sparkler, lantern, divine glow…). */
export interface SceneLight {
  x: number;
  y: number;
  color: string;
  intensity: number; // 0..1+
  radius: number; // falloff distance in px
  flicker?: number; // seed → flame flicker
}

/** Shot-level light sources; every Puppet inside reacts to them. */
export const SceneLights = React.createContext<SceneLight[]>([]);

export interface Lighting {
  keySide: 1 | -1;
  rim?: string;
  rimStrength?: number;
  rimSide?: 1 | -1;
  brightness?: number;
}

/* ------------------------------------------------------------------ */
/* Proportions                                                         */
/* ------------------------------------------------------------------ */

interface Body {
  headR: number;
  thigh: number;
  shin: number;
  foot: number;
  torsoLen: number;
  sw: number;
  hw: number;
  ua: number;
  fa: number;
  limbW: number;
  hand: number;
  neck: number;
  child: boolean;
}

const bodyFor = (c: CastMember): Body => {
  const h = c.height;
  const g = c.girth;
  if (c.age === "child") {
    return {
      headR: 40 * Math.sqrt(h),
      thigh: 47 * h,
      shin: 44 * h,
      foot: 21 * h,
      torsoLen: 66 * h,
      sw: 31 * h * (0.85 + g * 0.15),
      hw: 22 * h * g,
      ua: 36 * h,
      fa: 33 * h,
      limbW: 6.6 * h * (c.wiry ? 0.85 : 1),
      hand: 25 * h,
      neck: 7 * h,
      child: true,
    };
  }
  return {
    headR: 41 * Math.sqrt(h),
    thigh: 80 * h,
    shin: 74 * h,
    foot: 31 * h,
    torsoLen: 108 * h,
    sw: 47 * h * (0.85 + g * 0.15),
    hw: 34 * h * g,
    ua: 56 * h,
    fa: 52 * h,
    limbW: 8.8 * h * (c.wiry ? 0.82 : 1) * (0.9 + g * 0.1),
    hand: 37 * h,
    neck: 11 * h,
    child: false,
  };
};

const isFemale = (c: CastMember) => c.sex === "f" || c.hairStyle === "veil" || c.hairStyle === "pigtails" || c.outfit === "blouse" || c.outfit === "frock";

export const faceFor = (c: CastMember): FaceShape => {
  const base = c.age === "child" ? FACE_CHILD : isFemale(c) ? FACE_ADULT_F : FACE_ADULT_M;
  const elder: Partial<FaceShape> = c.age === "elder" ? { faceLen: base.faceLen * 1.05, cheek: base.cheek - 0.03, nose: base.nose * 1.12 } : {};
  return { ...base, ...elder, ...(c.face ?? {}) };
};

const capsule = (len: number, w1: number, w2: number) =>
  `M ${-w1} 0 Q ${-w1 * 1.06} ${len * 0.5} ${-w2} ${len} A ${w2} ${w2} 0 0 0 ${w2} ${len} Q ${w1 * 1.06} ${len * 0.5} ${w1} 0 A ${w1} ${w1} 0 0 0 ${-w1} 0 Z`;

/**
 * Anatomical limb segment along +y: wTop at the joint, swelling to wMid (muscle belly at
 * `midAt`), tapering to wEnd — e.g. deltoid→biceps→elbow, or forearm swell→wrist.
 */
const seg = (len: number, wTop: number, wMid: number, wEnd: number, midAt = 0.35) => {
  const m = len * midAt;
  return `M ${-wTop} 0 C ${-wTop * 1.06} ${m * 0.5} ${-wMid * 1.04} ${m * 0.8} ${-wMid} ${m} C ${-wMid * 0.98} ${m + (len - m) * 0.45} ${-wEnd * 1.04} ${len * 0.85} ${-wEnd} ${len} A ${wEnd} ${wEnd} 0 0 0 ${wEnd} ${len} C ${wEnd * 1.04} ${len * 0.85} ${wMid * 0.98} ${m + (len - m) * 0.45} ${wMid} ${m} C ${wMid * 1.04} ${m * 0.8} ${wTop * 1.06} ${m * 0.5} ${wTop} 0 A ${wTop} ${wTop} 0 0 0 ${-wTop} 0 Z`;
};

/** Tapered limb between two points. */
const limb = (ax: number, ay: number, bx: number, by: number, w1: number, w2: number) => {
  const len = Math.hypot(bx - ax, by - ay);
  const ang = (Math.atan2(bx - ax, by - ay) * 180) / Math.PI;
  return { d: capsule(len, w1, w2), t: `translate(${ax}, ${ay}) rotate(${-ang})` };
};

type V3 = [number, number, number];
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];

/** Convex hull (monotone chain) of 2D points. */
const hull = (pts: Array<[number, number]>) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: Array<[number, number]> = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};

export function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}

/* ------------------------------------------------------------------ */
/* Puppet                                                              */
/* ------------------------------------------------------------------ */

export interface PuppetProps {
  cast: CastMember;
  f: number;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  acting?: (f: number) => Partial<Pose>;
  mouth?: (f: number) => MouthState;
  talk?: (f: number) => number;
  light?: Lighting;
  lights?: SceneLight[];
  seated?: boolean;
  props?: Record<string, PropRenderer>;
  opacity?: number;
  stillness?: number;
}

export const Puppet: React.FC<PuppetProps> = ({
  cast: c,
  f,
  x,
  y,
  scale = 1,
  flip = false,
  acting,
  mouth,
  talk,
  light = { keySide: -1 },
  seated = false,
  props = {},
  opacity = 1,
  stillness = 0,
  lights: ownLights = [],
}) => {
  const ctxLights = React.useContext(SceneLights);
  const lights = ctxLights.length ? [...ctxLights, ...ownLights] : ownLights;
  const uid = safeId(useId()) + c.id;
  const B = bodyFor(c);
  const female = isFemale(c);
  const at = (fr: number): Pose => ({ ...BASE_POSE, ...(acting ? acting(fr) : {}) });
  const p = at(f);
  const pHead = at(f - 2);
  const pCloth = at(f - 5);
  const pPrev = at(f - 4);

  const keySide = light.keySide;
  // ---- motivated lighting: nearby sources set rim colour/side, brightness and light-wrap ----
  const headWX = x + (acting ? (acting(f).bodyX ?? 0) : 0);
  const headWY = y + (acting ? (acting(f).bodyY ?? 0) : 0) - (c.age === "child" ? 190 : 300) * scale;
  let lightSum = 0;
  let dom: { l: SceneLight; k: number } | null = null;
  for (const l of lights) {
    const d = Math.hypot(l.x - headWX, l.y - headWY);
    const fl = l.flicker !== undefined ? flicker(f, l.flicker) : 1;
    const k = l.intensity * Math.pow(clamp(1 - d / l.radius), 1.5) * fl;
    lightSum += k;
    if (!dom || k > dom.k) dom = { l, k };
  }
  const domSide: 1 | -1 = dom && dom.l.x >= headWX ? 1 : -1;
  const useDom = dom !== null && dom.k > 0.04;
  const rim = useDom ? dom!.l.color : light.rim ?? "#ffcf87";
  const rimStrength = Math.min(0.95, (light.rimStrength ?? 0.55) + lightSum * 0.5);
  const rimSide: 1 | -1 = useDom ? ((flip ? -domSide : domSide) as 1 | -1) : light.rimSide ?? (-keySide as 1 | -1);
  const wrap = clamp(lightSum * 0.55, 0, 0.6);

  const breath = Math.sin((f / 24) * Math.PI * 2 * (0.27 - 0.1 * stillness) + c.seed) * (1 - 0.5 * stillness);
  const level = talk ? talk(f) : 0;
  const emphasis = level * Math.sin(f * 0.55 + c.seed) * 2.2 * (1 - 0.7 * stillness);

  const phi = clamp(p.bodyTurn, -1, 1) * 0.95; // body yaw (rad)
  const cphi = Math.cos(phi);
  const sphi = Math.sin(phi);
  const swingVel = (p.lean - pPrev.lean) * 1.6 + (p.bodyX - pPrev.bodyX) * 0.4;
  const clothSway = Math.sin(f * 0.07 + c.seed) * 2.2 - swingVel * 3;

  /* ---------------- legs in 3D ---------------- */
  const hipX = B.hw * 0.48;
  const phase = f * 0.3 + c.seed;
  const stride = p.stride;
  const crouch = clamp(p.crouch);
  const nearSide: 1 | -1 = sphi > 0.05 ? -1 : 1; // leg nearer the camera
  const legAngles = (side: 1 | -1) => {
    if (seated) return { th: 1.42, ab: 0.95, kn: 2.7 };
    let th = 0.03;
    let kn = 0.05;
    let ab = 0.04;
    if (stride > 0) {
      const ph = phase + (side > 0 ? Math.PI : 0);
      th += Math.sin(ph) * 0.42 * stride;
      kn += (0.12 + Math.max(0, Math.sin(ph + 1.7)) * 0.9) * stride;
    }
    if (crouch > 0) {
      const k = clamp(crouch / 0.6);
      th = lerp(th, 0.85, k);
      kn = lerp(kn, 1.55, k);
      ab = lerp(ab, 0.12, k);
      if (crouch > 0.6) {
        const k2 = clamp((crouch - 0.6) / 0.4);
        if (side === nearSide) {
          th = lerp(th, 1.45, k2);
          kn = lerp(kn, 1.5, k2);
        } else {
          th = lerp(th, 0.05, k2);
          kn = lerp(kn, 1.8, k2);
        }
      }
    }
    return { th, ab, kn };
  };
  const rotY = (v: V3): { x: number; y: number; z: number } => ({ x: v[0] * cphi + v[2] * sphi, y: v[1], z: -v[0] * sphi + v[2] * cphi });
  const legGeo = (side: 1 | -1) => {
    const { th, ab, kn } = legAngles(side);
    const hip: V3 = [side * hipX, 0, 0];
    const tdir: V3 = [Math.sin(ab) * side, Math.cos(th) * Math.cos(ab), Math.sin(th) * Math.cos(ab)];
    const knee = add3(hip, mul3(tdir, B.thigh));
    const sp = th - kn;
    const sdir: V3 = [Math.sin(ab) * side * (seated ? -1.2 : 0.3), Math.cos(sp), Math.sin(sp)];
    const ankle = add3(knee, mul3(sdir, B.shin));
    let fv: V3 = [0, 0, 1];
    if (seated) fv = [-side * 0.9, 0, 0.45];
    else if (sp < -1.0) fv = [0, 0.25, -1];
    const fh = B.foot * 0.28;
    const sole = add3(ankle, [0, fh, 0]);
    const perp: V3 = [fv[2], 0, -fv[0]];
    const heel = add3(sole, mul3(fv, -B.foot * 0.22));
    const toe = add3(sole, mul3(fv, B.foot * 0.82));
    const fw = B.foot * 0.3;
    return {
      side,
      hip: rotY(hip),
      knee: rotY(knee),
      ankle: rotY(ankle),
      heelL: rotY(add3(heel, mul3(perp, -fw * 0.8))),
      heelR: rotY(add3(heel, mul3(perp, fw * 0.8))),
      toeL: rotY(add3(toe, mul3(perp, -fw))),
      toeR: rotY(add3(toe, mul3(perp, fw))),
      toeTip: rotY(add3(toe, mul3(fv, B.foot * 0.12))),
      lowest: Math.max(sole[1], knee[1] + B.limbW * 1.2),
      kneeDown: kn > 1.6 && th < 0.3,
      z: rotY(knee).z + rotY(hip).z,
    };
  };
  const legs = [legGeo(-1), legGeo(1)];
  const ground = Math.max(...legs.map((l) => l.lowest));
  const hipY = -ground; // hips relative to the ground (feet at y = 0)
  const legsSorted = [...legs].sort((a, b) => a.z - b.z); // far first

  const shY = hipY - B.torsoLen + breath * 0.9;
  const kf = Math.sqrt(cphi * cphi + 0.3 * sphi * sphi);
  const swp = B.sw * kf;
  const hwp = B.hw * Math.sqrt(cphi * cphi + 0.45 * sphi * sphi);
  const belly = c.girth > 1.12 ? (c.girth - 1) * B.hw * 0.9 : 0;
  const frontX = B.sw * 0.42 * sphi; // torso front centre line

  /* ---------------- gradients ---------------- */
  const kx1 = keySide < 0 ? "0" : "1";
  const kx2 = keySide < 0 ? "1" : "0";
  const rx1 = rimSide > 0 ? "0" : "1";
  const rx2 = rimSide > 0 ? "1" : "0";

  /* ---------------- legs & lower garment ---------------- */
  const legW1 = B.limbW * 1.45;
  const legW2 = B.limbW * 1.05;
  const drawLeg = (L: ReturnType<typeof legGeo>, far: boolean) => {
    const yy = (v: number) => v + hipY;
    const t1 = limb(L.hip.x, yy(L.hip.y), L.knee.x, yy(L.knee.y), legW1, legW2 * 1.08);
    const t2 = limb(L.knee.x, yy(L.knee.y), L.ankle.x, yy(L.ankle.y), legW2 * 1.05, legW2 * 0.72);
    const footPts: Array<[number, number]> = [
      [L.ankle.x - legW2 * 0.7, yy(L.ankle.y)],
      [L.ankle.x + legW2 * 0.7, yy(L.ankle.y)],
      [L.heelL.x, yy(L.heelL.y)],
      [L.heelR.x, yy(L.heelR.y)],
      [L.toeL.x, yy(L.toeL.y)],
      [L.toeR.x, yy(L.toeR.y)],
      [L.toeTip.x, yy(L.toeTip.y)],
    ];
    const footD = smoothPath(hull(footPts), 1);
    const skin = far ? c.skinShade : c.skin;
    return (
      <g key={`leg${L.side}`}>
        <path d={t1.d} transform={t1.t} fill={skin} />
        <path d={t2.d} transform={t2.t} fill={skin} />
        <ellipse cx={L.knee.x} cy={yy(L.knee.y)} rx={legW2 * 1.05} ry={legW2 * 0.95} fill={skin} />
        <path d={footD} fill={skin} />
        <path
          d={`M ${lerp(L.toeL.x, L.toeTip.x, 0.4)} ${yy(L.toeL.y) - 1} L ${lerp(L.toeR.x, L.toeTip.x, 0.4)} ${yy(L.toeR.y) - 1}`}
          stroke={c.skinShade}
          strokeWidth={1.2}
          opacity={0.6}
        />
      </g>
    );
  };

  const dhoti = () => {
    const yy = (v: number) => v + hipY;
    const hemK = c.dhotiLength === "knee" ? 0.12 : 0.55;
    const panels = legsSorted.map((L) => {
      const hx = lerp(L.knee.x, L.ankle.x, hemK);
      const hy = yy(lerp(L.knee.y, L.ankle.y, hemK));
      const top: [number, number] = [L.hip.x, yy(L.hip.y) - 6];
      const flare = legW2 * (seated ? 2.4 : 2.05);
      const pts: Array<[number, number]> = [
        [top[0] - legW1 * 1.5, top[1]],
        [top[0] + legW1 * 1.5, top[1]],
        [L.knee.x - legW1 * 1.35, yy(L.knee.y)],
        [L.knee.x + legW1 * 1.35, yy(L.knee.y)],
        [hx - flare, hy],
        [hx + flare, hy],
      ];
      const d = smoothPath(hull(pts), 1);
      return (
        <g key={`dh${L.side}`}>
          <path d={d} fill={`url(#${uid}-lowg)`} />
          <path d={d} fill={`url(#${uid}-rim)`} />
          <path d={`M ${hx - flare} ${hy - 2} L ${hx + flare} ${hy - 2}`} stroke={c.lowerTrim ?? c.lowerShade} strokeWidth={c.lowerTrim ? 3 : 1.6} strokeLinecap="round" />
          <path d={`M ${top[0]} ${top[1] + 10} Q ${L.knee.x + clothSway * 0.3} ${yy(L.knee.y) - 10} ${hx + clothSway * 0.4} ${hy - 4}`} stroke={c.lowerShade} strokeWidth={1.6} fill="none" opacity={0.6} />
        </g>
      );
    });
    // waist + crotch bridge
    const waistY = hipY - 8;
    const crotchY = hipY + B.thigh * 0.32;
    const bridge = `M ${-hwp * 1.08} ${waistY} L ${hwp * 1.08} ${waistY} L ${hwp * 0.6} ${crotchY} L ${-hwp * 0.6} ${crotchY} Z`;
    // front pleats (kochi)
    const kx = frontX * 0.7 - B.hw * 0.12;
    const kLen = Math.max(20, Math.min(...legs.map((L) => yy(L.knee.y))) - waistY + 14);
    return (
      <g>
        {panels[0]}
        <path d={bridge} fill={`url(#${uid}-lowg)`} />
        {panels[1]}
        {!seated && (
          <g transform={`translate(${kx}, ${waistY + 4}) rotate(${clothSway * 0.8})`}>
            <path d={`M -8 0 L 8 0 L 14 ${kLen} L -12 ${kLen + 4} Z`} fill={c.lowerColor} />
            {[-6, -1, 4, 9].map((px) => (
              <path key={px} d={`M ${px * 0.5} 4 L ${px} ${kLen}`} stroke={c.lowerShade} strokeWidth={1.3} opacity={0.75} />
            ))}
            {c.lowerTrim && <path d={`M -12 ${kLen + 4} L 14 ${kLen}`} stroke={c.lowerTrim} strokeWidth={3} />}
          </g>
        )}
        <path d={`M ${-hwp * 1.1} ${waistY + 2} Q 0 ${waistY + 8} ${hwp * 1.1} ${waistY + 2}`} stroke={c.lowerShade} strokeWidth={4} fill="none" opacity={0.65} />
      </g>
    );
  };

  const skirt = (to: "ankle" | "knee") => {
    const yy = (v: number) => v + hipY;
    const waistY = c.outfit === "frock" ? shY + B.torsoLen * 0.38 : hipY - 10;
    const pts: Array<[number, number]> = [
      [-hwp * 1.05, waistY],
      [hwp * 1.05, waistY],
    ];
    for (const L of legs) {
      const m = legW1 * 1.5;
      pts.push([L.knee.x - m, yy(L.knee.y)], [L.knee.x + m, yy(L.knee.y)]);
      if (to === "ankle") {
        const fx = (L.toeTip.x + L.heelL.x) / 2;
        pts.push([fx - m * 1.35, yy(L.ankle.y) + 4], [fx + m * 1.35, yy(L.ankle.y) + 4]);
      } else {
        const kx = lerp(L.knee.x, L.ankle.x, 0.12);
        const ky = yy(lerp(L.knee.y, L.ankle.y, 0.12));
        pts.push([kx - m * 1.5 + clothSway * 0.4, ky], [kx + m * 1.5 + clothSway * 0.4, ky]);
      }
    }
    const H = hull(pts);
    const d = smoothPath(H, 1);
    const bottom = H.filter(([, yv]) => yv > Math.max(...H.map((q) => q[1])) - 14).sort((a, b) => a[0] - b[0]);
    const pleatX = frontX * 0.6;
    const hemY = Math.max(...H.map((q) => q[1]));
    return (
      <g>
        <path d={d} fill={`url(#${uid}-lowg)`} />
        <path d={d} fill={`url(#${uid}-rim)`} />
        {to === "ankle" &&
          [-8, -3, 2, 7, 12].map((px) => (
            <path key={px} d={`M ${pleatX + px * 0.6} ${waistY + 10} Q ${pleatX + px + clothSway * 0.5} ${(waistY + hemY) / 2} ${pleatX + px * 1.6 + clothSway} ${hemY - 4}`} stroke={c.lowerShade} strokeWidth={1.3} fill="none" opacity={0.7} />
          ))}
        {bottom.length >= 2 && (c.lowerTrim || c.topTrim) && (
          <path
            d={`M ${bottom[0][0] + 4} ${bottom[0][1] - 4} L ${bottom[bottom.length - 1][0] - 4} ${bottom[bottom.length - 1][1] - 4}`}
            stroke={(c.outfit === "frock" ? c.topTrim : c.lowerTrim) ?? c.lowerShade}
            strokeWidth={c.lower === "saree" ? 7 : 5}
            strokeLinecap="round"
          />
        )}
      </g>
    );
  };

  const lowerBody = () => (
    <g>
      {c.lower === "saree" ? (
        <>
          {legsSorted.map((L) => drawLeg(L, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
          {skirt("ankle")}
        </>
      ) : c.lower === "none" ? (
        <>
          {legsSorted.map((L) => drawLeg(L, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
        </>
      ) : (
        <>
          {legsSorted.map((L) => drawLeg(L, L === legsSorted[0] && Math.abs(sphi) > 0.15))}
          {dhoti()}
        </>
      )}
    </g>
  );

  /* ---------------- torso ---------------- */
  const torso = () => {
    const hemY =
      seated || c.outfit === "frock"
        ? hipY + 4
        : c.outfit === "kurta"
          ? hipY + B.thigh * (B.child ? 0.38 : 0.42)
          : c.outfit === "vest"
            ? hipY - 2
            : hipY + 2;
    const flare = c.outfit === "kurta" ? 1.22 : 1.04;
    const cs = clothSway * 0.5;
    const bF = belly * (0.5 + 0.5 * Math.abs(sphi));
    const bL = sphi < 0 ? bF : belly * 0.4 * cphi;
    const bR = sphi > 0 ? bF : belly * 0.4 * cphi;
    const path = `M ${-B.sw * 0.3 * kf} ${shY - 5}
      Q ${-swp * 0.82} ${shY - 6} ${-swp} ${shY + 7}
      Q ${-swp * 1.04} ${shY + B.torsoLen * 0.25} ${-swp * 0.96 - bL * 0.4} ${shY + B.torsoLen * 0.45}
      Q ${-hwp * 1.12 - bL} ${shY + B.torsoLen * 0.8} ${-hwp * flare + cs} ${hemY}
      Q ${cs * 0.5} ${hemY + 6} ${hwp * flare + cs} ${hemY}
      Q ${hwp * 1.12 + bR} ${shY + B.torsoLen * 0.8} ${swp * 0.96 + bR * 0.4} ${shY + B.torsoLen * 0.45}
      Q ${swp * 1.04} ${shY + B.torsoLen * 0.25} ${swp} ${shY + 7}
      Q ${swp * 0.82} ${shY - 6} ${B.sw * 0.3 * kf} ${shY - 5}
      Q ${frontX * 0.3} ${shY + 3} ${-B.sw * 0.3 * kf} ${shY - 5} Z`;
    const isSkin = c.outfit === "bare";
    const px = frontX;
    return (
      <g>
        {/* tapered neck (narrower under the jaw, wider at the base) with throat shading */}
        <path
          d={`M ${-B.headR * 0.24} ${shY - B.neck - 18} L ${B.headR * 0.24} ${shY - B.neck - 18} Q ${B.headR * 0.26} ${shY - 6} ${B.headR * 0.36} ${shY + 2} L ${-B.headR * 0.36} ${shY + 2} Q ${-B.headR * 0.26} ${shY - 6} ${-B.headR * 0.24} ${shY - B.neck - 18} Z`}
          fill={c.skin}
        />
        <path d={`M ${-B.headR * 0.24} ${shY - B.neck - 18} L ${B.headR * 0.24} ${shY - B.neck - 18} L ${B.headR * 0.22} ${shY - B.neck - 6} Q 0 ${shY - B.neck} ${-B.headR * 0.22} ${shY - B.neck - 6} Z`} fill={c.skinShade} opacity={0.55} />
        {!B.child && <path d={`M ${keySide * -B.headR * 0.12} ${shY - B.neck - 8} Q ${keySide * -B.headR * 0.06} ${shY - 8} ${keySide * B.headR * 0.04} ${shY}`} stroke={c.skinShade} strokeWidth={1.3} fill="none" opacity={0.45} />}
        <path d={path} fill={isSkin ? `url(#${uid}-skin-body)` : `url(#${uid}-topg)`} />
        {isSkin && (
          <g stroke={c.skinShade} fill="none" opacity={0.55} strokeLinecap="round">
            <path d={`M ${px - 3} ${shY + 3} Q ${-swp * 0.35 + px * 0.5} ${shY + 1} ${-swp * 0.8} ${shY + 6}`} strokeWidth={1.4} />
            <path d={`M ${px + 3} ${shY + 3} Q ${swp * 0.35 + px * 0.5} ${shY + 1} ${swp * 0.8} ${shY + 6}`} strokeWidth={1.4} />
          </g>
        )}
        {c.outfit === "kurta" && !seated && (
          <g>
            {/* side slits: the dhoti shows through */}
            {[-1, 1].map((sd) => {
              const sxh = sd * hwp * flare * 0.96 + cs;
              const top = hemY - B.thigh * 0.2;
              return <path key={sd} d={`M ${sxh} ${top} L ${sxh - sd * 4} ${hemY + 1} L ${sxh + sd * 2} ${hemY + 1} Z`} fill={c.lowerColor} stroke={c.topShade} strokeWidth={1} />;
            })}
            {/* tension folds pulled from the armpit when an arm is raised */}
            {[
              { sd: 1, S: p.rS },
              { sd: -1, S: p.lS },
            ].map(({ sd, S }) =>
              S > 45 ? (
                <path
                  key={sd}
                  d={`M ${sd * swp * 0.85} ${shY + 16} Q ${sd * swp * 0.5} ${shY + B.torsoLen * 0.3} ${sd * swp * 0.15 + px * 0.5} ${shY + B.torsoLen * 0.5}`}
                  stroke={c.topShade}
                  strokeWidth={1.8}
                  fill="none"
                  opacity={clamp((S - 45) / 60) * 0.6}
                />
              ) : null,
            )}
          </g>
        )}
        {c.outfit === "vest" && <path d={`M ${-B.sw * 0.28 * kf + px * 0.3} ${shY - 4} L ${px} ${shY + B.torsoLen * 0.55} L ${B.sw * 0.28 * kf + px * 0.3} ${shY - 4} Z`} fill={c.skin} />}
        {isSkin && (
          <g opacity={0.5} stroke={c.skinShade} fill="none">
            <path d={`M ${-swp * 0.55 + px * 0.5} ${shY + B.torsoLen * 0.3} Q ${-swp * 0.25 + px} ${shY + B.torsoLen * 0.38} ${px - 2} ${shY + B.torsoLen * 0.28} M ${swp * 0.55 + px * 0.5} ${shY + B.torsoLen * 0.3} Q ${swp * 0.25 + px} ${shY + B.torsoLen * 0.38} ${px + 2} ${shY + B.torsoLen * 0.28}`} strokeWidth={2} />
            <ellipse cx={px} cy={shY + B.torsoLen * 0.78} rx={1.6} ry={2.4} fill={c.skinShade} />
            {c.wiry &&
              [0.42, 0.5, 0.58].map((k) => (
                <path key={k} d={`M ${-swp * 0.7 + px * 0.3} ${shY + B.torsoLen * k} q ${swp * 0.25} 4 ${swp * 0.42} 0 M ${swp * 0.7 + px * 0.3} ${shY + B.torsoLen * k} q ${-swp * 0.25} 4 ${-swp * 0.42} 0`} strokeWidth={1.2} />
              ))}
          </g>
        )}
        {!isSkin && (
          <g opacity={0.45} fill="none" stroke={c.topShade} strokeLinecap="round">
            <path d={`M ${-swp * 0.9} ${shY + 18} Q ${-swp * 0.4} ${shY + B.torsoLen * 0.5} ${-hwp * 0.7 + cs} ${hemY - 8}`} strokeWidth={2.2} />
            <path d={`M ${swp * 0.9} ${shY + 22} Q ${swp * 0.45} ${shY + B.torsoLen * 0.55} ${hwp * 0.8 + cs} ${hemY - 10}`} strokeWidth={2.2} />
          </g>
        )}
        {c.outfit === "kurta" && (
          <g>
            <path d={`M ${px} ${shY - 2} L ${px} ${shY + B.torsoLen * 0.42}`} stroke={c.topShade} strokeWidth={2} />
            {[0.1, 0.22, 0.34].map((k) => (
              <circle key={k} cx={px + 3.2 * cphi} cy={shY + B.torsoLen * k} r={2.1} fill={c.topTrim ?? "#c9a24a"} />
            ))}
            <path d={`M ${-B.headR * 0.32 * kf + px * 0.4} ${shY - 5} Q ${px} ${shY + 4} ${B.headR * 0.32 * kf + px * 0.4} ${shY - 5}`} stroke={c.topShade} strokeWidth={3} fill="none" />
          </g>
        )}
        {c.outfit === "vest" && [0.18, 0.34, 0.5].map((k) => <circle key={k} cx={px + B.sw * 0.12 * (1 - k * 1.5)} cy={shY + B.torsoLen * k} r={1.8} fill={c.topTrim ?? "#f3d27a"} />)}
        {c.outfit === "blouse" && <path d={`M ${-hwp * 1.05} ${hipY - 12} Q 0 ${hipY - 6} ${hwp * 1.05} ${hipY - 12} L ${hwp * 1.05} ${hipY - 3} Q 0 ${hipY + 3} ${-hwp * 1.05} ${hipY - 3} Z`} fill={c.skin} />}
        <path d={path} fill={`url(#${uid}-rim)`} />
        {c.paita && <path d={`M ${-swp * 0.62} ${shY + 2} Q ${-swp * 0.05 + px} ${shY + B.torsoLen * 0.55} ${hwp * 0.85} ${hipY - 4}`} stroke="#f6efe0" strokeWidth={1.6} fill="none" />}
      </g>
    );
  };

  /* ---------------- scarf / anchal ---------------- */
  const scarf = () => {
    const s = c.scarf;
    if (!s || c.hairStyle === "wrap") return s && c.hairStyle === "wrap" ? scarfDrape(s, true) : null;
    return scarfDrape(s, false);
  };
  const scarfDrape = (s: NonNullable<CastMember["scarf"]>, gamchha: boolean) => {
    const cs = (clothSway + Math.sin(f * 0.11 + c.seed) * 1.5) * 1.2;
    const pc = pCloth.lean - p.lean;
    if (s.style === "neck") {
      return (
        <g>
          <path d={`M ${-swp * 0.55} ${shY - 2} Q ${frontX * 0.3} ${shY + 14} ${swp * 0.55} ${shY - 2} Q 0 ${shY + 4} ${-swp * 0.55} ${shY - 2} Z`} fill={s.color} />
          <path
            d={`M ${swp * 0.42 + frontX * 0.3} ${shY + 2} Q ${swp * 0.5 + cs + frontX * 0.3} ${shY + B.torsoLen * 0.45} ${swp * 0.38 + cs * 1.6 + pc} ${shY + B.torsoLen * 0.8} L ${swp * 0.12 + cs * 1.6 + pc} ${shY + B.torsoLen * 0.78} Q ${swp * 0.25 + cs} ${shY + B.torsoLen * 0.4} ${swp * 0.18} ${shY + 6} Z`}
            fill={s.color}
          />
          <path
            d={`M ${-swp * 0.42 + frontX * 0.3} ${shY + 2} Q ${-swp * 0.52 + cs} ${shY + B.torsoLen * 0.4} ${-swp * 0.45 + cs * 1.4 + pc} ${shY + B.torsoLen * 0.7} L ${-swp * 0.2 + cs * 1.4 + pc} ${shY + B.torsoLen * 0.7} Q ${-swp * 0.28 + cs} ${shY + B.torsoLen * 0.35} ${-swp * 0.18} ${shY + 6} Z`}
            fill={s.shade}
          />
          {s.trim && <path d={`M ${swp * 0.38 + cs * 1.6 + pc} ${shY + B.torsoLen * 0.8} L ${swp * 0.12 + cs * 1.6 + pc} ${shY + B.torsoLen * 0.78}`} stroke={s.trim} strokeWidth={4} />}
        </g>
      );
    }
    if (s.style === "shawl") {
      return (
        <g>
          <path
            d={`M ${-swp * 1.08} ${shY + 4} Q 0 ${shY - 10} ${swp * 1.08} ${shY + 4} L ${swp * 1.12 + cs} ${shY + B.torsoLen * 0.62} Q ${swp * 0.3 + frontX} ${shY + B.torsoLen * 0.5} ${frontX + 2} ${shY + 14} Q ${-swp * 0.3 + frontX} ${shY + B.torsoLen * 0.5} ${-swp * 1.12 + cs} ${shY + B.torsoLen * 0.62} Z`}
            fill={s.color}
          />
          <path d={`M ${frontX + 2} ${shY + 14} Q ${swp * 0.3 + frontX} ${shY + B.torsoLen * 0.5} ${swp * 1.12 + cs} ${shY + B.torsoLen * 0.62}`} stroke={s.trim ?? s.shade} strokeWidth={3.5} fill="none" />
          <path d={`M ${frontX + 2} ${shY + 14} Q ${-swp * 0.3 + frontX} ${shY + B.torsoLen * 0.5} ${-swp * 1.12 + cs} ${shY + B.torsoLen * 0.62}`} stroke={s.trim ?? s.shade} strokeWidth={3.5} fill="none" />
        </g>
      );
    }
    const check = s.style === "check";
    return (
      <g>
        <path
          d={`M ${-swp * 0.95} ${shY + 2} Q ${-swp * 0.4} ${shY - 6} ${-swp * 0.1 + frontX * 0.3} ${shY - 1}
              Q ${swp * 0.25 + frontX * 0.6} ${shY + B.torsoLen * 0.45} ${hwp * 1.05} ${hipY - 2}
              L ${hwp * 0.7} ${hipY + 10} Q ${-swp * 0.2 + frontX * 0.5} ${shY + B.torsoLen * 0.62} ${-swp * 1.02} ${shY + 26} Z`}
          fill={s.color}
        />
        <path
          d={`M ${-swp * 1.0} ${shY + 6} Q ${-swp * 1.2 + cs} ${shY + B.torsoLen * 0.5} ${-swp * 1.1 + cs * 1.8 + pc * 1.5} ${shY + B.torsoLen * 0.95} L ${-swp * 0.82 + cs * 1.8 + pc * 1.5} ${shY + B.torsoLen * 0.95} Q ${-swp * 0.95 + cs} ${shY + B.torsoLen * 0.45} ${-swp * 0.8} ${shY + 18} Z`}
          fill={s.shade}
        />
        {check &&
          [0.2, 0.4, 0.6, 0.8].map((k) => (
            <path key={k} d={`M ${lerp(-swp * 0.4, hwp * 0.9, k) - 10} ${lerp(shY + 2, hipY, k) + 4} l 18 -6`} stroke={s.trim ?? "#ffffff"} strokeWidth={2} opacity={0.7} />
          ))}
        {s.trim && !check && (
          <path d={`M ${-swp * 0.1 + frontX * 0.3} ${shY - 1} Q ${swp * 0.25 + frontX * 0.6} ${shY + B.torsoLen * 0.45} ${hwp * 1.05} ${hipY - 2}`} stroke={s.trim} strokeWidth={4} fill="none" />
        )}
        {gamchha && null}
      </g>
    );
  };

  /* ---------------- arms ---------------- */
  const arm = (side: 1 | -1, S: number, E: number, shape: HandShape, propId: string, back: boolean) => {
    const sx = side * B.sw * 0.86 * cphi;
    const rot1 = -side * S;
    const rot2 = -side * E;
    const sleeveCol = c.outfit === "kurta" || c.outfit === "blouse" || c.outfit === "frock" ? c.top : null;
    const upperSleeve = sleeveCol && c.sleeve !== "none";
    const foreSleeve = sleeveCol && (c.sleeve === "full" || c.sleeve === "rolled");
    const foreSleeveLen = c.sleeve === "full" ? 0.84 : 0.42;
    const upperLen = c.sleeve === "half" ? 0.78 : 1.05;
    const slim = (female ? 0.88 : 1) * (c.wiry ? 0.9 : 1);
    const fitted = c.outfit === "blouse" || c.outfit === "frock"; // blouse sleeves hug the arm
    const L = B.limbW * slim;
    const PropR = propId ? props[propId] : undefined;
    const skin = back ? c.skinShade : c.skin;
    const bend = clamp(Math.abs(E) / 120); // elbow flexion 0..1
    const inner = -Math.sign(rot2 || 1); // side of the arm the elbow folds toward
    const sleeveFill = `url(#${uid}-topg)`;
    // sleeve tube with a flared opening at `len`
    const sleeve = (len: number, wTop: number, wEnd: number) => (
      <g>
        <path d={seg(len, wTop, (wTop + wEnd) / 2 * 1.04, wEnd, 0.4)} fill={sleeveFill} />
        <ellipse cx={0} cy={len} rx={wEnd} ry={wEnd * 0.32} fill={c.topShade} opacity={0.9} />
        <path d={`M ${-wTop * 0.3} ${len * 0.15} Q ${wTop * 0.2} ${len * 0.55} ${-wEnd * 0.2} ${len * 0.92}`} stroke={c.topShade} strokeWidth={1.4} fill="none" opacity={0.5} />
      </g>
    );
    return (
      <g transform={`translate(${sx}, ${shY + B.limbW}) rotate(${rot1})`} style={back ? { filter: "brightness(0.85)" } : undefined}>
        {/* upper arm: deltoid → biceps → elbow */}
        <path d={seg(B.ua, L * 1.25, L * 1.1, L * 0.86, 0.3)} fill={skin} />
        {upperSleeve && sleeve(B.ua * upperLen, L * (fitted ? 1.38 : 1.75), c.sleeve === "half" ? L * (fitted ? 1.22 : 1.6) : L * 1.3)}
        {/* shoulder cap merges the arm into the torso */}
        <circle cx={0} cy={0} r={L * (upperSleeve ? (fitted ? 1.38 : 1.7) : 1.3)} fill={upperSleeve ? sleeveFill : skin} />
        <g transform={`translate(0, ${B.ua}) rotate(${rot2})`}>
          {/* forearm: swell below the elbow → narrow wrist */}
          <path d={seg(B.fa, L * 0.9, L * 1.0, L * 0.6, 0.25)} fill={skin} />
          <path d={seg(B.fa * 0.8, L * 0.35, L * 0.4, L * 0.22, 0.25)} fill={c.skinShade} opacity={0.22} transform={`translate(${side * L * 0.45}, 0)`} />
          {foreSleeve && (
            <g>
              {sleeve(B.fa * foreSleeveLen, L * 1.45, c.sleeve === "full" ? L * 1.0 : L * 1.25)}
              {c.sleeve === "rolled" && (
                <g>
                  <rect x={-L * 1.4} y={B.fa * foreSleeveLen - L * 0.75} width={L * 2.8} height={L * 1.2} rx={L * 0.55} fill={c.topLight} />
                  <path d={`M ${-L * 1.3} ${B.fa * foreSleeveLen - L * 0.15} L ${L * 1.3} ${B.fa * foreSleeveLen - L * 0.15}`} stroke={c.topShade} strokeWidth={1.1} opacity={0.6} />
                </g>
              )}
            </g>
          )}
          {/* elbow joint + creases that bunch as the elbow bends */}
          <circle cx={0} cy={0} r={L * (upperSleeve && c.sleeve !== "half" ? 1.32 : 0.9)} fill={upperSleeve && c.sleeve !== "half" ? sleeveFill : skin} />
          {bend > 0.2 &&
            [0, 1].map((k) => (
              <path
                key={k}
                d={`M ${inner * L * (0.2 + k * 0.35)} ${-L * (0.6 - k * 0.25)} q ${inner * L * 0.5} ${L * 0.25} ${inner * L * 0.9} ${L * 0.05}`}
                stroke={upperSleeve && c.sleeve !== "half" ? c.topShade : c.skinShade}
                strokeWidth={1.2}
                fill="none"
                opacity={0.6 * bend}
              />
            ))}
          <g transform={`translate(0, ${B.fa - 2})`}>
            <Hand shape={shape} L={B.hand} skin={skin} shade={c.skinShade} side={side} flex={noise1(f * 0.04, c.seed + side) * 0.5 + 0.5} />
            {PropR && <g transform={`translate(0, ${B.hand * 0.62})`}>{PropR({ f, worldRot: rot1 + rot2 + p.lean, side, scale: B.hand / 30 })}</g>}
          </g>
        </g>
      </g>
    );
  };

  /* ---------------- head ---------------- */
  const shape = faceFor(c);
  const look: HeadLook = {
    skin: c.skin,
    skinLight: c.skinLight,
    skinShade: c.skinShade,
    lips: c.lips,
    hair: c.hair,
    hairLight: c.hairLight,
    hairStyle: c.hairStyle,
    cloth: c.scarf ? { color: c.scarf.color, shade: c.scarf.shade, trim: c.scarf.trim } : undefined,
    mustache: c.mustache,
    glasses: c.glasses,
    tilak: c.tilak,
    sindoor: c.sindoor,
    bindi: c.bindi,
    ribbon: c.ribbon,
    age: c.age,
  };
  const head = () => {
    const ph = pHead;
    const sac0 = saccade(f, c.seed);
    const bl = blink(f, c.seed);
    // speech-driven face: brows lift on stressed syllables; blink at natural pauses
    const lv = talk ? (talk(f) + talk(f - 1) + talk(f - 2)) / 3 : 0;
    const browSpeech = clamp((lv - 0.32) * 0.9, 0, 0.35);
    let pauseBlink = 0;
    if (talk) {
      for (let k = 0; k < 6; k++) {
        const now = talk(f - k);
        const before = talk(f - k - 1);
        // a pause begins after at least ~8 frames of speech
        if (now < 0.05 && before >= 0.05 && talk(f - k - 8) >= 0.05) {
          pauseBlink = [0.45, 1, 1, 0.65, 0.25, 0][k];
          break;
        }
      }
    }
    const mth = mouth ? mouth(f) : MOUTH_REST;
    const m = headModel(shape);
    const R = B.headR;
    const neckTop = shY - B.neck;
    const cy = neckTop - m.bottom * R * 0.92 + R * 0.06;
    const yaw = clamp(phi + clamp(ph.headTurn, -1, 1) * 1.15, -1.45, 1.45);
    return (
      <g transform={`translate(${sphi * B.sw * 0.12}, ${cy + ph.headNod + Math.abs(emphasis) * 0.6}) rotate(${ph.headTilt + emphasis * 0.5})`}>
        <Head
          R={R}
          shape={shape}
          look={look}
          uid={`${uid}h`}
          keySide={keySide}
          rim={rim}
          rimStrength={rimStrength}
          st={{
            yaw,
            eyeX: clamp((ph.eyeX * 0.9 - yaw) / 0.75 + sac0.x * 0.6 * (1 - stillness), -1, 1),
            eyeY: clamp(ph.eyeY + sac0.y * 0.6 * (1 - stillness), -1, 1),
            close: Math.max(bl, ph.lid, pauseBlink),
            squint: clamp((ph.smile - 0.55) * 1.6, 0, 0.55),
            brow: ph.brow + browSpeech,
            browTilt: ph.browTilt,
            mouth: mth,
            smile: ph.smile,
            gasp: ph.gasp,
            cheeks: ph.cheeks,
            flush: ph.flush,
            tears: ph.tears,
            sway: clothSway,
            f,
          }}
        />
      </g>
    );
  };

  /* ---------------- assembly ---------------- */
  const S = flip ? -scale : scale;
  const brightness = (light.brightness ?? 1) * (lights.length ? 0.9 + Math.min(0.35, lightSum * 0.3) : 1);
  const rFar = p.rBack > 0.5 || (sphi > 0.25 && !female) || sphi > 0.35;
  const lFar = p.lBack > 0.5 || sphi < -0.35;
  const rDraw = arm(1, p.rS, p.rE, p.rHand, p.rProp, rFar);
  const lDraw = arm(-1, p.lS, p.lE, p.lHand, p.lProp, lFar);

  return (
    <g transform={`translate(${x + p.bodyX}, ${y + p.bodyY}) scale(${S}, ${scale})`} opacity={opacity} style={brightness !== 1 ? { filter: `brightness(${brightness})` } : undefined}>
      <defs>
        <linearGradient id={`${uid}-topg`} x1={kx1} y1="0" x2={kx2} y2="0">
          <stop offset="0%" stopColor={c.topLight} />
          <stop offset="45%" stopColor={c.top} />
          <stop offset="100%" stopColor={c.topShade} />
        </linearGradient>
        <linearGradient id={`${uid}-lowg`} x1={kx1} y1="0" x2={kx2} y2="0.4">
          <stop offset="0%" stopColor={lerpColor(c.lowerColor, "#ffffff", 0.25)} />
          <stop offset="45%" stopColor={c.lowerColor} />
          <stop offset="100%" stopColor={c.lowerShade} />
        </linearGradient>
        <linearGradient id={`${uid}-skin-body`} x1={kx1} y1="0" x2={kx2} y2="0">
          <stop offset="0%" stopColor={c.skinLight} />
          <stop offset="50%" stopColor={c.skin} />
          <stop offset="100%" stopColor={c.skinShade} />
        </linearGradient>
        <linearGradient id={`${uid}-rim`} x1={rx1} y1="0" x2={rx2} y2="0">
          <stop offset="0%" stopColor={rim} stopOpacity={0} />
          <stop offset="78%" stopColor={rim} stopOpacity={0} />
          <stop offset="100%" stopColor={rim} stopOpacity={rimStrength} />
        </linearGradient>
        <radialGradient id={`${uid}-ao`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0b0608" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#0b0608" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={2} rx={B.hw * (seated ? 3.4 : 2.4)} ry={B.hw * 0.42} fill={`url(#${uid}-ao)`} />
      {lFar && lDraw}
      {rFar && rDraw}
      {lowerBody()}
      <g transform={`rotate(${p.lean}, 0, ${hipY})`}>
        {c.outfit === "frock" && skirt("knee")}
        {torso()}
        {scarf()}
        {head()}
        {!lFar && lDraw}
        {!rFar && rDraw}
        {wrap > 0.02 && dom && (
          <g style={{ mixBlendMode: "screen" }} opacity={wrap}>
            <defs>
              <radialGradient id={`${uid}-wrap`}>
                <stop offset="0%" stopColor={dom.l.color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={dom.l.color} stopOpacity={0} />
              </radialGradient>
            </defs>
            {/* wrap light kept to the head's edge so it never washes the face features out */}
            <ellipse cx={rimSide * B.headR * 1.15} cy={shY - B.neck - B.headR * 0.9} rx={B.headR * 0.9} ry={B.headR * 1.3} fill={`url(#${uid}-wrap)`} opacity={0.6} />
            <ellipse cx={rimSide * B.sw * 0.7} cy={shY + B.torsoLen * 0.35} rx={B.sw * 1.1} ry={B.torsoLen * 0.6} fill={`url(#${uid}-wrap)`} />
          </g>
        )}
      </g>
    </g>
  );
};
