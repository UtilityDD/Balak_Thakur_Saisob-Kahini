import React, { useId } from "react";
import { clamp, hash, lerp, safeId } from "../../cinematic/core/anim";

/**
 * Clay rice pot (matka / মটকি) for Episode 2, matching the earthen jar in Scene04RicePot: the same
 * terracotta gradient (#d6905a / #a85c2e / #5a2a12), lime-washed bands, side lugs, crack and size.
 *
 * Size at s = 1: 264 px wide at the belly (296 px including the side lugs) and 246 px tall from the
 * base to the top of the rolled rim. The mouth is 108 px across inside in side view and opens to
 * 196 px (about 74 percent of the belly) at mouthView = 1, so it can frame a seated baby.
 *
 * The pot is drawn as a surface of revolution under a slight downward camera pitch, so every state
 * between upright, mouth-down, lying on its side and mouth-to-viewer is one continuous projection.
 * It is rotated about its axial centre, then lifted so its lowest point always sits on the floor
 * line y, with its axial centre at world x.
 *
 * `children` are drawn in WORLD coordinates (the same space as x and y), clipped to the inner mouth
 * ellipse and layered behind the rim lip, so a Puppet placed at world coordinates sits inside.
 * `dust` is the puff's progress: 0 = none, rising toward 1 the cloud spreads, rises and fades out.
 * `leak` and `rice` are amounts.
 */
export interface MatkaProps {
  x: number; // world x of the pot's centre
  y: number; // world y of the floor line under the pot (where it rests)
  s?: number; // scale, default 1
  f: number; // frame, for small motion (dust, light flicker)
  rot?: number; // degrees, side view: 0 = upright mouth up, 180 = mouth-down on the floor (covering), 90 = lying on its side with the mouth to the right
  mouthView?: number; // 0..1: 0 = plain side view; 1 = lying on its side with the round mouth turned toward the viewer
  leak?: number; // 0..1: warm golden light leaking out from under the rim when it is mouth-down
  rice?: number; // 0..1: rice grains spilled around the rim
  dust?: number; // 0..1: a puff of dust at the landing, which spreads and fades as it rises
  children?: React.ReactNode; // content seen inside the mouth when mouthView > 0 (the baby)
}

const DEG = Math.PI / 180;
/** Camera looks slightly down, so an upright pot shows the top of its mouth (as the original jar does). */
const PITCH = 0.19;
/** Axial heights (pot-local units, base = 0). */
const H = 246;
const HC = 122;
const NECK_H = 230;
/** Inner mouth radius in side view and when the mouth faces the viewer. */
const RI0 = 54;
const RI1 = 98;

type RH = [number, number]; // [radius, axial height]
type Sec = { h: number; r: number };

const smooth = (t: number) => {
  const k = clamp(t);
  return k * k * (3 - 2 * k);
};

const cubic = (a: RH, b: RH, c: RH, d: RH, t: number): RH => {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return [w0 * a[0] + w1 * b[0] + w2 * c[0] + w3 * d[0], w0 * a[1] + w1 * b[1] + w2 * c[1] + w3 * d[1]];
};

/** Half profile of the pot (radius by height), from the base up through belly, shoulder, short neck and rolled rim. */
const buildProfile = (m: number) => {
  const ri = lerp(RI0, RI1, m);
  const d = ri - RI0;
  const pts: RH[] = [[58, 0]];
  for (let i = 0; i <= 10; i++) pts.push(cubic([62, 6], [104, 20], [130, 60], [132, 118], i / 10));
  for (let i = 1; i <= 10; i++) pts.push(cubic([132, 118], [134, 170], [Math.min(104 + d * 0.7, 131), 206], [56 + d, 226], i / 10));
  pts.push([ri + 2, NECK_H]);
  // thick rolled rim: a half-round bead of radius 8 standing on the neck
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * Math.PI;
    pts.push([ri + 9 + 8 * Math.sin(a), 238 - 8 * Math.cos(a)]);
  }
  return { ri, pts };
};

const rAt = (pts: RH[], h: number) => {
  if (h <= pts[0][1]) return pts[0][0];
  for (let k = 0; k < pts.length - 1; k++) {
    const [r0, h0] = pts[k];
    const [r1, h1] = pts[k + 1];
    if (h >= h0 && h <= h1) return h1 - h0 < 1e-6 ? r1 : lerp(r0, r1, (h - h0) / (h1 - h0));
  }
  return pts[pts.length - 1][0];
};

export const Matka: React.FC<MatkaProps> = ({ x, y, s = 1, f, rot = 0, mouthView = 0, leak = 0, rice = 0, dust = 0, children }) => {
  const uid = safeId(useId());
  const id = (k: string) => `mk${uid}${k}`;

  const m = smooth(mouthView);
  const { ri, pts } = buildProfile(m);

  /* ---- projection: pot axis in 3D, then a slight camera pitch ---- */
  const th = m * (Math.PI / 2);
  const rr = rot * DEG;
  const ax = Math.sin(rr) * Math.cos(th);
  const ay = -Math.cos(rr) * Math.cos(th);
  const az = Math.sin(th);
  const ay2 = ay * Math.cos(PITCH) + az * Math.sin(PITCH);
  /** > 0: the mouth end is nearer the viewer; < 0: the base end is nearer. */
  const Z = -ay * Math.sin(PITCH) + az * Math.cos(PITCH);
  let L = Math.hypot(ax, ay2);
  const alpha = L < 1e-4 ? Math.PI : Math.atan2(ax, -ay2);
  L = Math.max(L, 1e-4);
  const zs = Math.abs(Z);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);
  const aDeg = alpha / DEG;
  /** Local y (pot frame, axis pointing to -y) of the cross-section at axial height h. */
  const yl = (h: number) => -(h - HC) * L;

  const bodySecs: Sec[] = [];
  for (let h = 0; h < NECK_H; h += 6) bodySecs.push({ h, r: rAt(pts, h) });
  bodySecs.push({ h: NECK_H, r: pts.find((p) => p[1] === NECK_H)![0] });
  const rimSecs: Sec[] = pts.filter((p) => p[1] > NECK_H).map(([r, h]) => ({ h, r }));
  rimSecs.unshift({ h: NECK_H, r: ri + 2 });

  /* ---- rest on the floor: the lowest projected point touches y ---- */
  let bot = -Infinity;
  let xl = Infinity;
  let xr = -Infinity;
  const ext = [...bodySecs, ...rimSecs].map(({ h, r }) => {
    const c = yl(h);
    const wx = -c * sa;
    const wy = c * ca;
    const ry = r * zs;
    const hy = Math.sqrt(r * r * sa * sa + ry * ry * ca * ca);
    const hx = Math.sqrt(r * r * ca * ca + ry * ry * sa * sa);
    bot = Math.max(bot, wy + hy);
    xl = Math.min(xl, wx - hx);
    xr = Math.max(xr, wx + hx);
    return { wx, wy, hx, hy };
  });
  let cl = Infinity;
  let cr = -Infinity;
  for (const e of ext) {
    if (e.wy + e.hy > bot - 10) {
      cl = Math.min(cl, e.wx - e.hx);
      cr = Math.max(cr, e.wx + e.hx);
    }
  }
  const cx = x;
  const cy = y - s * bot;
  const T = `translate(${cx} ${cy}) scale(${s}) rotate(${aDeg})`;
  const footX = cx + (s * (xl + xr)) / 2;
  const footHalf = (s * (xr - xl)) / 2;
  const contactX = cx + (s * (cl + cr)) / 2;
  const contactHalf = Math.max((s * (cr - cl)) / 2, 30 * s);

  const flick = 0.88 + 0.07 * Math.sin(f * 0.83) + 0.05 * Math.sin(f * 2.17 + 1.3);
  const sideFade = clamp((L - 0.4) / 0.4); // surface markings fade as the body foreshortens
  const nearMouth = Z > 0.002;
  const nearBase = Z < -0.002;

  /* ---- shapes in pot-local space ---- */
  const bodyPts = pts.filter((p) => p[1] <= NECK_H);
  const pathOf = (list: RH[]) => {
    const right = list.map(([r, h]) => `${r.toFixed(2)} ${yl(h).toFixed(2)}`);
    const left = [...list].reverse().map(([r, h]) => `${(-r).toFixed(2)} ${yl(h).toFixed(2)}`);
    return `M ${right.join(" L ")} L ${left.join(" L ")} Z`;
  };
  const bodyPath = pathOf(bodyPts);
  const rimPath = pathOf(pts.filter((p) => p[1] >= NECK_H));
  const sweepNear = Z >= 0 ? 0 : 1;
  const band = (h: number) => {
    const r = rAt(pts, h);
    const c = yl(h);
    return `M ${-r} ${c} A ${r} ${Math.max(r * zs, 0.01)} 0 0 ${sweepNear} ${r} ${c}`;
  };
  const mouthY = yl(H);
  const rimTop = ri + 9;
  const hlX = -84 * clamp(ca * 3, -1, 1);
  const hlO = 0.3 + 0.7 * Math.abs(ca);

  // handles (lugs) from the original jar, re-projected along the axis
  const lug = (sgn: number) =>
    `M ${sgn * 126} ${yl(182)} Q ${sgn * 150} ${yl(176)} ${sgn * 148} ${yl(156)} Q ${sgn * 146} ${yl(142)} ${sgn * 124} ${yl(144)}`;

  const childFade = smooth((mouthView - 0.3) / 0.5);
  const glow = m * flick;
  const riceInMouth = 1 - smooth(mouthView / 0.3);

  /* ---- spilled rice ---- */
  const riceN = 36;
  const riceShown = clamp(rice) * riceN;
  const grains = Array.from({ length: riceN }, (_, i) => {
    if (i >= riceShown) return null;
    const o = clamp(riceShown - i) * 0.92;
    const side = hash(i * 1.31) < 0.5 ? -1 : 1;
    const spread = Math.max(contactHalf, footHalf * 0.6);
    const dist = spread * (0.9 + hash(i * 2.7) * 0.5) + hash(i * 5.3) * 46 * s;
    const gx = contactX + side * dist;
    const dy = (hash(i * 3.9) - 0.3) * 24 * s;
    return { gx, gy: y + dy, o, a: hash(i * 7.1) * 180, back: dy < 0, i };
  }).filter((g): g is NonNullable<typeof g> => g !== null);
  const grain = (g: (typeof grains)[number]) => (
    <ellipse key={`r${g.i}`} cx={g.gx} cy={g.gy} rx={4 * s} ry={2.4 * s} fill="#f6ead0" opacity={g.o} transform={`rotate(${g.a} ${g.gx} ${g.gy})`} />
  );

  /* ---- dust puff ---- */
  const dk = clamp(dust);
  const dustOn = dk > 0 && dk < 1;
  const grow = 1 - Math.pow(1 - dk, 3);
  const dustFade = clamp(dk / 0.1) * Math.pow(1 - dk, 1.4);

  /* ---- leak glow ---- */
  const lk = clamp(leak) * flick;

  return (
    <g>
      <defs>
        <linearGradient id={id("clay")} gradientUnits="userSpaceOnUse" x1={-132} y1={0} x2={132} y2={0} gradientTransform={`rotate(${-aDeg})`}>
          <stop offset="0%" stopColor="#d6905a" />
          <stop offset="45%" stopColor="#a85c2e" />
          <stop offset="100%" stopColor="#5a2a12" />
        </linearGradient>
        <linearGradient id={id("rim")} gradientUnits="userSpaceOnUse" x1={-rimTop - 8} y1={0} x2={rimTop + 8} y2={0} gradientTransform={`rotate(${-aDeg})`}>
          <stop offset="0%" stopColor="#c27a46" />
          <stop offset="45%" stopColor="#9c5a2e" />
          <stop offset="100%" stopColor="#4e240e" />
        </linearGradient>
        <radialGradient id={id("sheen")} gradientUnits="userSpaceOnUse" cx={-62} cy={-72} r={190} gradientTransform={`rotate(${-aDeg})`}>
          <stop offset="0%" stopColor="#ffdcae" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#ffdcae" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id("inside")} cx="0.5" cy="0.58" r="0.6">
          <stop offset="0%" stopColor="#ffd27e" stopOpacity={0.95 * glow} />
          <stop offset="55%" stopColor="#b8621f" stopOpacity={0.55 * glow} />
          <stop offset="100%" stopColor="#1a0a04" stopOpacity={0} />
        </radialGradient>
        <linearGradient
          id={id("rimHi")}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={mouthY - rimTop}
          x2={0}
          y2={mouthY + rimTop}
          gradientTransform={`rotate(${-aDeg} 0 ${mouthY})`}
        >
          <stop offset="0%" stopColor="#ffe2a8" stopOpacity={0.95} />
          <stop offset="45%" stopColor="#ffe2a8" stopOpacity={0} />
          <stop offset="100%" stopColor="#ffe2a8" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={id("shadow")}>
          <stop offset="0%" stopColor="#000" stopOpacity={0.38} />
          <stop offset="70%" stopColor="#000" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id("leak")}>
          <stop offset="0%" stopColor="#fff0c0" stopOpacity={0.9} />
          <stop offset="35%" stopColor="#ffd27a" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#ffb040" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={id("spill")}>
          <stop offset="0%" stopColor="#ffcf7a" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#ffcf7a" stopOpacity={0} />
        </radialGradient>
        <clipPath id={id("body")} clipPathUnits="userSpaceOnUse">
          <path d={bodyPath} />
          {bodySecs.map((c, i) => (
            <ellipse key={i} cx={0} cy={yl(c.h)} rx={c.r} ry={Math.max(c.r * zs, 0.01)} />
          ))}
        </clipPath>
        <clipPath id={id("mouth")} clipPathUnits="userSpaceOnUse">
          <ellipse transform={T} cx={0} cy={mouthY} rx={ri * 0.97} ry={Math.max(ri * zs * 0.97, 0.01)} />
        </clipPath>
      </defs>

      {/* golden light leaking along the floor from under the rim (behind the pot; the pot hides the part under it) */}
      {lk > 0.001 && (
        <g style={{ mixBlendMode: "screen" }}>
          <ellipse cx={contactX} cy={y} rx={contactHalf * (1.5 + 1.4 * clamp(leak)) + 40 * s} ry={s * (22 + 26 * clamp(leak))} fill={`url(#${id("leak")})`} opacity={lk} />
          <ellipse cx={contactX} cy={y + 4 * s} rx={contactHalf * (2.4 + 1.6 * clamp(leak))} ry={s * (34 + 30 * clamp(leak))} fill={`url(#${id("leak")})`} opacity={lk * 0.35} />
        </g>
      )}

      {/* soft floor shadow */}
      <ellipse cx={footX} cy={y + 2 * s} rx={footHalf * 1.04} ry={s * (18 + 6 * zs)} fill={`url(#${id("shadow")})`} opacity={1 - 0.4 * clamp(leak)} />

      {grains.filter((g) => g.back).map(grain)}

      {/* ---- the pot ---- */}
      <g transform={T}>
        {/* side lugs, behind the body */}
        <path d={lug(-1)} stroke="#8a4a24" strokeWidth={9} fill="none" strokeLinecap="round" />
        <path d={lug(1)} stroke="#8a4a24" strokeWidth={9} fill="none" strokeLinecap="round" />

        {/* rim behind the body when the base end is nearer */}
        {!nearMouth && <RimShapes path={rimPath} secs={rimSecs} yl={yl} zs={zs} fill={`url(#${id("rim")})`} />}

        <g clipPath={`url(#${id("body")})`}>
          <rect x={-200} y={-200} width={400} height={400} fill={`url(#${id("clay")})`} />
          {/* lime-washed bands and a dotted band */}
          <path d={band(148)} stroke="#e8b47a" strokeWidth={4} fill="none" opacity={0.45} />
          <path d={band(102)} stroke="#e8b47a" strokeWidth={4} fill="none" opacity={0.45} />
          <path d={band(60)} stroke="#f2c894" strokeWidth={4} fill="none" strokeDasharray="6 8" opacity={0.4} />
          {/* light and shade */}
          <rect x={-200} y={-200} width={400} height={400} fill={`url(#${id("sheen")})`} />
          <ellipse cx={hlX} cy={yl(132)} rx={13} ry={Math.max(52 * L, 8)} fill="#ffd9a8" opacity={0.32 * hlO * (0.35 + 0.65 * sideFade)} />
          <ellipse cx={-hlX * 1.19} cy={yl(110)} rx={26} ry={Math.max(86 * L, 12)} fill="#3a1606" opacity={0.35 * hlO * (0.35 + 0.65 * sideFade)} />
          <path
            d={`M 40 ${yl(180)} L 32 ${yl(164)} L 41 ${yl(152)} L 36 ${yl(136)}`}
            stroke="#2a1006"
            strokeWidth={2}
            fill="none"
            opacity={0.6 * sideFade}
          />
          {/* dark foot where the base meets the floor */}
          {!nearBase && <ellipse cx={0} cy={yl(4)} rx={60} ry={Math.max(60 * zs, 4)} fill="#4a220e" opacity={0.85 * sideFade} />}
        </g>

        {/* the base disc, seen when the pot is upturned */}
        {nearBase && (
          <g>
            <ellipse cx={0} cy={yl(0)} rx={58} ry={Math.max(58 * zs, 0.01)} fill="#5a2a12" />
            <ellipse cx={0} cy={yl(0)} rx={46} ry={Math.max(46 * zs, 0.01)} fill="#7a3e1c" opacity={0.8} />
            <ellipse cx={-14} cy={yl(0) - 2 * zs} rx={20} ry={Math.max(14 * zs, 0.01)} fill="#d6905a" opacity={0.25} />
          </g>
        )}

        {nearMouth && (
          <g>
            <RimShapes path={rimPath} secs={rimSecs} yl={yl} zs={zs} fill={`url(#${id("rim")})`} />
            {/* top face of the rolled rim */}
            <ellipse cx={0} cy={mouthY} rx={rimTop + 4} ry={Math.max((rimTop + 4) * zs, 0.01)} fill="#8a4a26" />
            {/* the mouth: dark inside, warmed by the light from within */}
            <ellipse cx={0} cy={mouthY} rx={ri} ry={Math.max(ri * zs, 0.01)} fill="#2a140a" />
            <ellipse cx={0} cy={mouthY + ri * zs * 0.08} rx={ri * 0.9} ry={Math.max(ri * zs * 0.82, 0.01)} fill="#140804" opacity={0.6 * m} />
            {glow > 0.001 && <ellipse cx={0} cy={mouthY} rx={ri} ry={Math.max(ri * zs, 0.01)} fill={`url(#${id("inside")})`} />}
            {/* rice heaped in the mouth while the pot is upright */}
            {riceInMouth > 0.001 &&
              Array.from({ length: 9 }, (_, i) => (
                <ellipse
                  key={i}
                  cx={(hash(i * 2.3) - 0.5) * ri * 1.5}
                  cy={mouthY + (hash(i * 4.7) - 0.5) * ri * zs * 1.1}
                  rx={4}
                  ry={2.4}
                  fill="#fff6e0"
                  opacity={0.9 * riceInMouth}
                />
              ))}
          </g>
        )}
      </g>

      {/* what is inside (the baby), in world coordinates, clipped to the inner mouth */}
      {nearMouth && children != null && childFade > 0.001 && (
        <g clipPath={`url(#${id("mouth")})`} opacity={childFade}>
          {children}
        </g>
      )}

      {/* rim lip over the contents: inner shadow edge and the lit top edge */}
      {nearMouth && (
        <g transform={T}>
          <ellipse cx={0} cy={mouthY} rx={ri} ry={Math.max(ri * zs, 0.01)} fill="none" stroke="#1a0a04" strokeWidth={5} opacity={0.55} />
          <ellipse
            cx={0}
            cy={mouthY}
            rx={rimTop}
            ry={Math.max(rimTop * zs, 0.01)}
            fill="none"
            stroke={`url(#${id("rimHi")})`}
            strokeWidth={4 + 2 * m}
            opacity={0.35 + 0.6 * m}
          />
          {m > 0.01 && (
            <ellipse
              cx={0}
              cy={mouthY}
              rx={rimTop * 1.35}
              ry={Math.max(rimTop * zs * 1.35, 0.01)}
              fill={`url(#${id("spill")})`}
              opacity={0.45 * glow}
              style={{ mixBlendMode: "screen" }}
            />
          )}
        </g>
      )}

      {/* bright sliver of light escaping at the rim's contact line */}
      {lk > 0.001 && (
        <g style={{ mixBlendMode: "screen" }}>
          <ellipse cx={contactX} cy={y - 2 * s} rx={contactHalf * 0.98} ry={4.5 * s} fill="#fff0c0" opacity={0.8 * lk} />
          <ellipse cx={contactX} cy={y + 6 * s} rx={contactHalf * 1.25} ry={9 * s} fill="#ffd27a" opacity={0.35 * lk} />
        </g>
      )}

      {grains.filter((g) => !g.back).map(grain)}

      {/* dust: spreads outward, rises and fades */}
      {dustOn && (
        <g>
          {Array.from({ length: 8 }, (_, i) => {
            const side = (i / 7 - 0.5) * 2;
            const px = contactX + side * (contactHalf * 0.7 + 150 * s * grow) + Math.sin(f * 0.15 + i) * 3 * s;
            const py = y - s * (10 + (22 + hash(i * 3.3) * 46) * grow);
            const r = s * (26 + 72 * grow + hash(i * 1.9) * 18);
            return <ellipse key={`d${i}`} cx={px} cy={py} rx={r} ry={r * 0.55} fill="#f0dcbc" opacity={0.26 * dustFade} />;
          })}
          {Array.from({ length: 16 }, (_, i) => {
            const dir = hash(i * 5.1) < 0.5 ? -1 : 1;
            const px = contactX + dir * (contactHalf * 0.8 + (40 + hash(i * 2.2) * 150) * s * grow);
            const py = y - s * (4 + (20 + hash(i * 7.7) * 90) * grow);
            return <circle key={`p${i}`} cx={px} cy={py} r={s * (1.6 + hash(i * 3.7) * 1.6)} fill="#fbf2dc" opacity={0.7 * dustFade} />;
          })}
        </g>
      )}
    </g>
  );
};

/** The rolled rim band: its profile outline plus its cross-section ellipses, so it reads in any tilt. */
const RimShapes: React.FC<{ path: string; secs: Sec[]; yl: (h: number) => number; zs: number; fill: string }> = ({ path, secs, yl, zs, fill }) => (
  <g fill={fill}>
    <path d={path} />
    {secs.map((c, i) => (
      <ellipse key={i} cx={0} cy={yl(c.h)} rx={c.r} ry={Math.max(c.r * zs, 0.01)} />
    ))}
  </g>
);
