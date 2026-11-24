import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { Hand } from "../../cinematic/rig/Hand";
import {
  Tortoise,
  TortoiseProps,
  tortoiseAt,
  tortoiseBiteKeys,
  tortoiseGrips,
  tortoiseHead,
  tortoiseJawTip,
} from "../../cinematic/animals/Tortoise";

/**
 * TortoiseQA (Episode 5, 240 f): the tortoise rig in src/cinematic/animals/Tortoise.tsx.
 *  Row 1: the four variants plodding (side, three-quarter, both facings), feet planted from `dist`.
 *  Row 2: turned over by two grips and righted (grip points marked) | bite, hold and release on a placeholder child hand,
 *         then turn away and plod off | neck in / half / out and the scale reference against the child rig.
 *  Row 3: big head close-up (eye, lid, beak, jaw) | the turned-over plastron with paddling legs.
 */

const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** ground distance walked by frame f at `speed` px/f while the walk ramp is up (dist is the integral, so feet hold). */
const walked = (f: number, speed: number, w: (i: number) => number) => {
  let d = 0;
  for (let i = 0; i < f; i++) d += speed * w(i);
  return d;
};

const INK = "#3b2a1a";
const Label: React.FC<{ x: number; y: number; t: string; size?: number; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  t,
  size = 19,
  anchor = "start",
}) => (
  <text x={x} y={y} fontSize={size} fill={INK} fontFamily={BN_FONT} fontWeight={600} textAnchor={anchor}>
    {t}
  </text>
);

const Ground: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <rect x={x} y={y} width={w} height={h} fill="#b99d70" opacity={0.55} />
);

const CHILD = { skin: "#b97a52", shade: "#8d5536" };

export const TortoiseQA: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const lifeF = f;

  /* ---------------- row 1: four plodders ---------------- */
  const walkW = (i: number) => sstep(4, 14, i) * (1 - sstep(222, 234, i));
  const plod: { v: number; view: "side" | "threeQuarter"; flip: boolean; px: number; gy: number; label: string }[] = [
    { v: 0, view: "side", flip: false, px: 0, gy: 300, label: "T1 variant 0: side, facing right" },
    { v: 1, view: "threeQuarter", flip: false, px: 480, gy: 250, label: "T2 variant 1: three-quarter, right" },
    { v: 2, view: "side", flip: true, px: 960, gy: 300, label: "T3 variant 2: side, flipped" },
    { v: 3, view: "threeQuarter", flip: true, px: 1440, gy: 250, label: "T4 variant 3: three-quarter, flipped" },
  ];
  const S1 = 2.2;
  const speed1 = 0.55 * S1;

  /* ---------------- row 2a: turn over and right ---------------- */
  const turnOver = sstep(30, 70, f) * (1 - sstep(150, 190, f));
  const neckB = f < 24 ? 0.6 : f < 190 ? 0.6 - 0.5 * sstep(24, 32, f) : 0.1 + 0.6 * sstep(205, 232, f);
  const tB: TortoiseProps = { x: 320, y: 600, s: 3, lifeF, view: "threeQuarter", elev: 30, variant: 0, turnOver, neck: neckB };
  const gB = tortoiseGrips(tB);
  const handsOn = f >= 26 && f <= 194;
  const stateB =
    f < 30 ? "upright" : f < 70 ? "rolling over (hands on two grips)" : f < 150 ? "on its back: paddling, head stretching" : f < 190 ? "righted by the hands" : "head in, then pokes out";

  /* ---------------- row 2b: bite, hold, release, turn away ---------------- */
  const S2 = 3.2;
  const baseC = { x: 830, y: 640, s: S2, lifeF, view: "side" as const, elev: 10, variant: 1 };
  const neckC = f < 182 ? 0.35 : 0.35;
  const target = (() => {
    const j = tortoiseJawTip({ ...baseC, neck: 1 });
    return { x: j.x + 10, y: j.y - 10 };
  })();
  const { bite, release } = tortoiseBiteKeys(f, 52, 160, 184);
  const turnAway = sstep(194, 222, f);
  const walkC = (i: number) => sstep(214, 222, i);
  const distC = walked(f, 0.55 * S2, walkC);
  const tC: TortoiseProps = { ...baseC, neck: neckC, bite, release, biteTarget: target, turnAway, walk: walkC(f), dist: distC };
  const posC = tortoiseAt(baseC.x, baseC.y, distC, tC);
  const tC2 = { ...tC, x: posC.x, y: posC.y };
  const jawC = tortoiseJawTip(tC2);
  // placeholder hand: the child's left hand, back up, fingers down-left; its little-finger edge at the jaws
  const HL = 100;
  const rot = 20;
  const edgeLocal = { x: -0.24 * HL, y: 0.32 * HL };
  const rr = (rot * Math.PI) / 180;
  const edgeRot = { x: edgeLocal.x * Math.cos(rr) - edgeLocal.y * Math.sin(rr), y: edgeLocal.x * Math.sin(rr) + edgeLocal.y * Math.cos(rr) };
  const handAt = (() => {
    // the hand follows the jaws while held; reaches in before and lifts away after
    const reach = sstep(18, 48, f);
    const away = sstep(176, 204, f);
    const held = f >= 52 && f < 176;
    const anchor = held ? jawC : target;
    return {
      x: anchor.x - edgeRot.x + (1 - reach) * 60 + away * 50,
      y: anchor.y - edgeRot.y - (1 - reach) * 190 - away * 170,
    };
  })();
  const fingerDir = { x: -Math.sin(rr), y: Math.cos(rr) };
  const stateC =
    f < 52 ? "hand reaches to its front end" : f < 56 ? "STRIKE (4 f)" : f < 160 ? "holds: neck stretched, still, eye on the child" : f < 184 ? "release: jaws open, head draws back" : f < 214 ? "turns away" : "plods off";

  /* ---------------- row 2c: neck states and scale ---------------- */
  const neckStates = [0, 0.5, 1];

  /* ---------------- row 3a: head close-up ---------------- */
  const neckE = 1 - 0.65 * sstep(60, 80, f) * (1 - sstep(100, 125, f));
  const baseE: TortoiseProps = { x: -40, y: 1104, s: 16, lifeF, view: "side", elev: 12, variant: 0, neck: neckE };
  const lidE = sstep(140, 146, f) * (1 - sstep(150, 158, f));
  const openE = 0.5 * sstep(175, 190, f) * (1 - sstep(205, 222, f));
  const jawE = tortoiseJawTip(baseE);
  const tE: TortoiseProps = { ...baseE, lid: lidE, bite: openE, biteTarget: jawE };

  /* ---------------- row 3b: plastron ---------------- */
  const tF: TortoiseProps = { x: 1450, y: 985, s: 4.2, lifeF, view: "threeQuarter", elev: 42, variant: 2, turnOver: 1, neck: 1 };

  const headInfo = tortoiseHead(tC2);

  return (
    <AbsoluteFill style={{ backgroundColor: "#d6c19a" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {/* panel grid */}
        {[480, 960, 1440].map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={360} stroke="#a28a63" strokeWidth={2} />
        ))}
        <line x1={0} y1={360} x2={1920} y2={360} stroke="#a28a63" strokeWidth={2} />
        <line x1={0} y1={720} x2={1920} y2={720} stroke="#a28a63" strokeWidth={2} />
        <line x1={640} y1={360} x2={640} y2={720} stroke="#a28a63" strokeWidth={2} />
        <line x1={1280} y1={360} x2={1280} y2={720} stroke="#a28a63" strokeWidth={2} />
        <line x1={960} y1={720} x2={960} y2={1080} stroke="#a28a63" strokeWidth={2} />

        {/* row 1 */}
        {plod.map((t) => {
          const startX = t.flip ? t.px + 380 : t.px + 100;
          const dist = walked(f, speed1, walkW);
          const props: TortoiseProps = { x: 0, y: 0, s: S1, lifeF, view: t.view, flip: t.flip, variant: t.v, walk: walkW(f), dist, neck: 0.85 + 0.15 * Math.sin(f * 0.02 + t.v) };
          const at = tortoiseAt(startX, t.gy, dist, props);
          return (
            <g key={t.v}>
              <defs>
                <clipPath id={`qa-row1-${t.v}`}>
                  <rect x={t.px} y={0} width={480} height={360} />
                </clipPath>
              </defs>
              <g clipPath={`url(#qa-row1-${t.v})`}>
                <Ground x={t.px} y={t.gy - 30} w={480} h={360 - t.gy + 30} />
                <Tortoise {...props} x={at.x} y={at.y} />
              </g>
              <Label x={t.px + 14} y={28} t={t.label} />
              <Label x={t.px + 14} y={52} t={`walk ${walkW(f).toFixed(2)}  dist ${dist.toFixed(0)} px`} size={15} />
            </g>
          );
        })}

        {/* row 2a: turn over */}
        <Ground x={0} y={560} w={640} h={160} />
        <Tortoise {...tB} />
        {handsOn &&
          (["tail", "side"] as const).map((k) => (
            <g key={k}>
              <circle cx={gB[k].x} cy={gB[k].y} r={9} fill={gB[k].inFront ? CHILD.skin : "none"} stroke={CHILD.shade} strokeWidth={2.5} opacity={0.9} />
              <line x1={gB[k].x} y1={gB[k].y} x2={gB[k].x + gB[k].out.x * 26} y2={gB[k].y + gB[k].out.y * 26} stroke={CHILD.shade} strokeWidth={2} />
              <text x={gB[k].x + 12} y={gB[k].y - 10} fontSize={14} fontFamily={BN_FONT} fill={INK}>
                {k === "tail" ? "grip: tail" : "grip: side"}
              </text>
            </g>
          ))}
        <Label x={14} y={388} t="Turned over by two grips, righted" />
        <Label x={14} y={410} t={`turnOver ${turnOver.toFixed(2)}: ${stateB}`} size={15} />
        <Label x={14} y={430} t="filled dot = grip faces camera (hand in front), ring = behind" size={13} />

        {/* row 2b: bite */}
        <defs>
          <clipPath id="qa-bite">
            <rect x={640} y={360} width={640} height={360} />
          </clipPath>
        </defs>
        <g clipPath="url(#qa-bite)">
          <Ground x={640} y={600} w={640} h={120} />
          {/* the bitten hand is drawn BEHIND the tortoise */}
          <path
            d={`M ${handAt.x} ${handAt.y} L ${handAt.x - fingerDir.x * 260} ${handAt.y - fingerDir.y * 260}`}
            stroke={CHILD.skin}
            strokeWidth={0.42 * HL}
            strokeLinecap="round"
          />
          <g transform={`translate(${handAt.x} ${handAt.y}) rotate(${rot})`}>
            <Hand shape="relaxed" L={HL} skin={CHILD.skin} shade={CHILD.shade} side={-1} view="back" />
          </g>
          <Tortoise {...tC2} />
          <circle cx={target.x} cy={target.y} r={3} fill="none" stroke="#b03020" strokeWidth={1.5} opacity={f < 52 ? 0.9 : 0.35} />
        </g>
        <Label x={654} y={388} t="Bite, hold, release, turn away (placeholder hand)" />
        <Label x={654} y={410} t={`bite ${bite.toFixed(2)}  release ${release.toFixed(2)}  turnAway ${turnAway.toFixed(2)}: ${stateC}`} size={15} />
        <Label x={654} y={430} t={`jaw ${jawC.x.toFixed(0)},${jawC.y.toFixed(0)}  target ${target.x.toFixed(0)},${target.y.toFixed(0)}  reach ${headInfo.reachPx.toFixed(0)} px`} size={13} />

        {/* row 2c: neck states and scale */}
        <Ground x={1280} y={470} w={640} h={250} />
        {neckStates.map((n, i) => (
          <g key={n}>
            <Tortoise x={1355 + i * 148} y={500} s={1.8} lifeF={lifeF + i * 37} view="side" variant={i + 1} neck={n} />
            <Label x={1355 + i * 148} y={545} t={`neck ${n}`} size={15} anchor="middle" />
          </g>
        ))}
        <Label x={1294} y={388} t="Neck in / half / out (side, s 1.8)" />
        {/* scale reference: the standing child rig is about 245 px tall at s = 1 (114 cm) */}
        <g opacity={0.5}>
          <circle cx={1830} cy={480} r={22} fill="#6b4a33" />
          <path d="M 1806 505 Q 1830 495 1854 505 L 1860 610 L 1846 700 L 1834 700 L 1830 625 L 1826 700 L 1814 700 L 1800 610 Z" fill="#efe6d4" />
        </g>
        <Tortoise x={1752} y={698} s={1} lifeF={lifeF} view="side" variant={0} neck={0.8} />
        <line x1={1885} y1={457} x2={1885} y2={700} stroke={INK} strokeWidth={1.5} />
        <Label x={1294} y={600} t="Scale at s = 1: child rig ~245 px (114 cm)," size={14} />
        <Label x={1294} y={620} t="tortoise 60 px (28 cm); variants 26-30 cm" size={14} />

        {/* row 3a: head close-up */}
        <defs>
          <clipPath id="qa-head">
            <rect x={0} y={720} width={960} height={360} />
          </clipPath>
        </defs>
        <g clipPath="url(#qa-head)">
          <Tortoise {...tE} />
        </g>
        <Label x={14} y={750} t="Head close-up (s 16): eye with lid, beak, yellow spots, jaw" />
        <Label x={14} y={772} t={`neck ${neckE.toFixed(2)}  lid ${Math.max(lidE, 0).toFixed(2)}  jaw open ${(openE * 2).toFixed(2)}`} size={15} />

        {/* row 3b: plastron */}
        <defs>
          <clipPath id="qa-plastron">
            <rect x={960} y={720} width={960} height={360} />
          </clipPath>
        </defs>
        <g clipPath="url(#qa-plastron)">
          <Ground x={960} y={940} w={960} h={140} />
          <Tortoise {...tF} />
        </g>
        <Label x={974} y={750} t="On its back (s 4.2, camera 42 deg): plastron, paddling legs, head stretching to right itself" />
      </svg>
    </AbsoluteFill>
  );
};
