import React from "react";
import { Hand, HandShape, HandView } from "./rig/Hand";

/**
 * Hand QA sheet (MOT-19): every HandShape, rig right (side +1) and left (side -1), preset view at three
 * in-plane wrist rotations, forced palm / back / side views, and the baby variant.
 * R = side +1 (the screen-right arm of a front-facing figure); L = side -1, its mirror.
 */
const SHAPES: HandShape[] = ["relaxed", "open", "point", "fist", "hold", "pranam", "abhaya", "cup"];

type Col = { label: string; side: 1 | -1; rot: number; view?: HandView; baby?: boolean };
const COLS: Col[] = [
  { label: "R 0°", side: 1, rot: 0 },
  { label: "R 90°", side: 1, rot: 90 },
  { label: "R 180°", side: 1, rot: 180 },
  { label: "L 0°", side: -1, rot: 0 },
  { label: "L -90°", side: -1, rot: -90 },
  { label: "L 180°", side: -1, rot: 180 },
  { label: "R palm", side: 1, rot: 0, view: "palm" },
  { label: "R back", side: 1, rot: 0, view: "back" },
  { label: "R side", side: 1, rot: 0, view: "side" },
  { label: "L palm", side: -1, rot: 0, view: "palm" },
  { label: "L back", side: -1, rot: 0, view: "back" },
  { label: "L side", side: -1, rot: 0, view: "side" },
  { label: "baby R", side: 1, rot: 0, baby: true },
  { label: "baby L", side: -1, rot: 0, baby: true },
];

const ADULT = { skin: "#d9a07a", shade: "#b47853" };
const BABY = { skin: "#F0C7A6", shade: "#D9A383" };
const LABEL_W = 78;
const COL_W = (1920 - LABEL_W) / COLS.length;
const TOP = 58;
const ROW_H = (1080 - TOP - 34) / SHAPES.length;
const L = 92;

export const HandQA: React.FC = () => (
  <div style={{ width: 1920, height: 1080, background: "#efe4d4", fontFamily: "sans-serif" }}>
    <svg width={1920} height={1080}>
      {/* group headers */}
      {[
        { from: 0, n: 6, t: "adult: preset view, in-plane wrist rotation" },
        { from: 6, n: 6, t: "adult: forced palm / back / side (thumb edge to camera)" },
        { from: 12, n: 2, t: "baby variant" },
      ].map((g) => (
        <g key={g.t}>
          <rect x={LABEL_W + g.from * COL_W + 3} y={6} width={g.n * COL_W - 6} height={20} rx={4} fill="#d8c6ae" />
          <text x={LABEL_W + (g.from + g.n / 2) * COL_W} y={20} fontSize={13} textAnchor="middle" fill="#4a3426">
            {g.t}
          </text>
        </g>
      ))}
      {COLS.map((c, ci) => (
        <text key={c.label} x={LABEL_W + (ci + 0.5) * COL_W} y={46} fontSize={14} textAnchor="middle" fill="#4a3426" fontWeight={600}>
          {c.label}
        </text>
      ))}
      {SHAPES.map((s, ri) => (
        <g key={s}>
          <rect x={0} y={TOP + ri * ROW_H} width={1920} height={ROW_H} fill={ri % 2 ? "#e8dbc8" : "#efe4d4"} />
          <text x={8} y={TOP + (ri + 0.5) * ROW_H + 5} fontSize={15} fill="#4a3426" fontWeight={600}>
            {s}
          </text>
          {COLS.map((c, ci) => {
            const col = c.baby ? BABY : ADULT;
            const cx = LABEL_W + (ci + 0.5) * COL_W;
            const cy = TOP + (ri + 0.5) * ROW_H;
            return (
              <g key={ci} transform={`translate(${cx}, ${cy}) rotate(${c.rot}) translate(0, ${-L * 0.36})`}>
                {/* forearm stub so the wrist direction reads */}
                <path d={`M ${-L * 0.15} ${-L * 0.32} L ${L * 0.15} ${-L * 0.32} L ${L * 0.145} 2 L ${-L * 0.145} 2 Z`} fill={col.skin} opacity={0.55} />
                <Hand shape={s} L={L} skin={col.skin} shade={col.shade} side={c.side} view={c.view} baby={c.baby} />
              </g>
            );
          })}
        </g>
      ))}
      <text x={LABEL_W} y={1068} fontSize={13} fill="#4a3426">
        R = rig right arm (side +1, screen-right arm of a front-facing figure), L = its mirror. Fingers down: palm view puts the thumb on the outer side,
        back view toward the body; in-plane rotation never moves it.
      </text>
    </svg>
  </div>
);
