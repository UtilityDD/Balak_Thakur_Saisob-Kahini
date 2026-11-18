import React from "react";
import { useCurrentFrame } from "remotion";
import { FACE_ADULT_F, FACE_ADULT_M, FACE_BABY, FACE_CHILD } from "./rig/head3d";
import { Head, HeadLook } from "./rig/Head";
import { MOUTH_REST } from "./rig/lipsync";

/** Turnaround QA: rows = face types, columns = yaw. */
export const HeadQA: React.FC = () => {
  const f = useCurrentFrame();
  const rows: Array<{ shape: typeof FACE_ADULT_M; look: HeadLook }> = [
    {
      shape: FACE_ADULT_M,
      look: { skin: "#d9a07a", skinLight: "#f0c4a0", skinShade: "#b47853", lips: "#b0605a", hair: "#1d1513", hairLight: "#5a4438", hairStyle: "parted", mustache: "#1d1513", age: "adult" },
    },
    {
      shape: FACE_ADULT_F,
      look: { skin: "#e4b18c", skinLight: "#f6d2b2", skinShade: "#c48d68", lips: "#bb6a63", hair: "#1b1211", hairLight: "#45342c", hairStyle: "veil", cloth: { color: "#fcf8f2", shade: "#e3d9ca", trim: "#b8292f" }, sindoor: true, bindi: true, age: "adult" },
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
  const yaws = [-1.25, -0.7, -0.3, 0, 0.35, 0.75, 1.25];
  return (
    <div style={{ width: 1920, height: 1080, background: "#3a2a30" }}>
      <svg width={1920} height={1080}>
        {rows.map((r, ri) =>
          yaws.map((yaw, ci) => (
            <g key={`${ri}-${ci}`} transform={`translate(${150 + ci * 270}, ${150 + ri * 260})`}>
              <Head
                R={88}
                shape={r.shape}
                look={r.look}
                uid={`q${ri}${ci}`}
                keySide={-1}
                rim="#ffcf87"
                rimStrength={0.5}
                st={{ yaw, eyeX: 0, eyeY: 0, close: 0, squint: 0, brow: 0, browTilt: 0, mouth: MOUTH_REST, smile: 0.4, gasp: 0, cheeks: 0, flush: 0, tears: 0, sway: 0, f }}
              />
            </g>
          )),
        )}
      </svg>
    </div>
  );
};
