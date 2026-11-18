import React from "react";
import { useCurrentFrame } from "remotion";
import { FACE_CHILD, FACE_TODDLER } from "./rig/head3d";
import { Head, HeadLook } from "./rig/Head";
import { MOUTH_REST } from "./rig/lipsync";

/** Before/after QA for the toddler Balak Thakur face: rows = current child vs new toddler face. */
export const ToddlerQA: React.FC = () => {
  const f = useCurrentFrame();
  const look: HeadLook = {
    skin: "#d9a07a",
    skinLight: "#f0c4a0",
    skinShade: "#b47853",
    lips: "#b0605a",
    hair: "#1a1211",
    hairLight: "#4a3830",
    hairStyle: "tousled",
    age: "child",
  };
  const rows = [
    { label: "current child", shape: FACE_CHILD },
    { label: "toddler Balak", shape: FACE_TODDLER },
  ];
  const yaws = [-0.35, 0, 0.35, 0.75];
  return (
    <div style={{ width: 1920, height: 1080, background: "#3a2a30" }}>
      <svg width={1920} height={1080}>
        {rows.map((r, ri) =>
          yaws.map((yaw, ci) => (
            <g key={`${ri}-${ci}`} transform={`translate(${260 + ci * 420}, ${250 + ri * 480})`}>
              <Head
                R={150}
                shape={r.shape}
                look={r.label === "toddler Balak" ? { ...look, divineEyes: true } : look}
                uid={`t${ri}${ci}`}
                keySide={-1}
                rim="#ffcf87"
                rimStrength={0.5}
                st={{ yaw, eyeX: 0, eyeY: 0, close: 0, squint: 0, brow: 0, browTilt: 0, mouth: MOUTH_REST, smile: 0.5, gasp: 0, cheeks: 0, flush: 0, tears: 0, sway: 0, f }}
              />
            </g>
          )),
        )}
      </svg>
    </div>
  );
};
