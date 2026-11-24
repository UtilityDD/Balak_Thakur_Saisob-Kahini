import React from "react";
import { useCurrentFrame } from "remotion";
import { FACE_ADULT_F, FACE_ADULT_M, FACE_BABY, FACE_CHILD, FaceShape } from "./rig/head3d";
import { Head, HeadLook, HeadState } from "./rig/Head";
import { MOUTH_REST } from "./rig/lipsync";

/**
 * Eye QA: large heads so eye construction can be inspected.
 * Rows: face types. Columns: yaw / gaze / lid states.
 */
const LOOKS: Array<{ shape: FaceShape; look: HeadLook }> = [
  {
    shape: FACE_ADULT_M,
    look: { skin: "#d9a07a", skinLight: "#f0c4a0", skinShade: "#b47853", lips: "#b0605a", hair: "#1d1513", hairLight: "#5a4438", hairStyle: "parted", age: "adult" },
  },
  {
    shape: FACE_ADULT_F,
    look: { skin: "#e4b18c", skinLight: "#f6d2b2", skinShade: "#c48d68", lips: "#bb6a63", hair: "#1b1211", hairLight: "#45342c", hairStyle: "pigtails", age: "adult" },
  },
  {
    shape: FACE_CHILD,
    look: { skin: "#d9a07a", skinLight: "#f0c4a0", skinShade: "#b47853", lips: "#b0605a", hair: "#1a1211", hairLight: "#4a3830", hairStyle: "tousled", age: "child" },
  },
  {
    shape: FACE_BABY,
    look: { skin: "#F0C7A6", skinLight: "#FFE3CC", skinShade: "#D9A383", lips: "#B0605A", hair: "#2a1a12", hairLight: "#5a4030", hairStyle: "baby", age: "baby", divineEyes: true },
  },
];

const COLS: Array<Partial<HeadState> & { label: string }> = [
  { label: "yaw -1.1", yaw: -1.1 },
  { label: "yaw -0.6", yaw: -0.6 },
  { label: "front", yaw: 0 },
  { label: "look L", yaw: 0, eyeX: -1 },
  { label: "look R", yaw: 0, eyeX: 1 },
  { label: "look up", yaw: 0, eyeY: -1 },
  { label: "half lid", yaw: 0, close: 0.5 },
  { label: "squint", yaw: 0.3, squint: 0.5 },
  { label: "gasp", yaw: 0.2, gasp: 1 },
  { label: "yaw 0.6 lookR", yaw: 0.6, eyeX: 0.8 },
];

export const EyeQA: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ width: 1920, height: 1080, background: "#3a2a30" }}>
      <svg width={1920} height={1080}>
        {LOOKS.map((r, ri) =>
          COLS.map((col, ci) => {
            const { label, ...st } = col;
            return (
              <g key={`${ri}-${ci}`} transform={`translate(${100 + ci * 190}, ${150 + ri * 255})`}>
                <Head
                  R={78}
                  shape={r.shape}
                  look={r.look}
                  uid={`e${ri}${ci}`}
                  keySide={-1}
                  rim="#ffcf87"
                  rimStrength={0.4}
                  st={{ yaw: 0, eyeX: 0, eyeY: 0, close: 0, squint: 0, brow: 0, browTilt: 0, mouth: MOUTH_REST, smile: 0.3, gasp: 0, cheeks: 0, flush: 0, tears: 0, sway: 0, f, ...st }}
                />
                {ri === 0 && (
                  <text x={0} y={-120} fill="#fff" fontSize={18} textAnchor="middle" fontFamily="sans-serif">
                    {label}
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
};

/** Magnified eye check: four big heads in tricky states. */
export const EyeZoom: React.FC = () => {
  const f = useCurrentFrame();
  const cases: Array<{ ri: number; st: Partial<HeadState>; x: number; y: number }> = [
    { ri: 0, st: { yaw: 0.55, eyeX: 0.8 }, x: 480, y: 330 },
    { ri: 2, st: { yaw: 0, eyeX: -1, eyeY: -0.6 }, x: 1440, y: 330 },
    { ri: 3, st: { yaw: 0.35, close: 0.45, smile: 0.7, squint: 0.3 }, x: 480, y: 850 },
    { ri: 1, st: { yaw: -0.9, eyeX: -0.5 }, x: 1440, y: 850 },
  ];
  return (
    <div style={{ width: 1920, height: 1080, background: "#3a2a30" }}>
      <svg width={1920} height={1080}>
        {cases.map((c, i) => (
          <g key={i} transform={`translate(${c.x}, ${c.y})`}>
            <Head
              R={250}
              shape={LOOKS[c.ri].shape}
              look={LOOKS[c.ri].look}
              uid={`z${i}`}
              keySide={-1}
              rim="#ffcf87"
              rimStrength={0.4}
              st={{ yaw: 0, eyeX: 0, eyeY: 0, close: 0, squint: 0, brow: 0, browTilt: 0, mouth: MOUTH_REST, smile: 0.3, gasp: 0, cheeks: 0, flush: 0, tears: 0, sway: 0, f, ...c.st }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
