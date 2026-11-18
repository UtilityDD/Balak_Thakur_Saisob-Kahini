import React from "react";
import { useCurrentFrame } from "remotion";
import { CAST } from "./rig/cast";
import { Puppet } from "./rig/Puppet";

/** Ghomta QA: veiled characters at several turns, close enough to judge the cloth. */
export const GhomtaQA: React.FC = () => {
  const f = useCurrentFrame();
  const cases = [
    { id: "charu", turn: -0.6, head: -0.3 },
    { id: "charu", turn: 0, head: 0 },
    { id: "manorama", turn: 0.45, head: 0.3 },
    { id: "womanB", turn: -0.25, head: 0.4 },
  ];
  return (
    <div style={{ width: 1920, height: 1080, background: "#3a2a30" }}>
      <svg width={1920} height={1080}>
        {cases.map((c, i) => (
          <Puppet
            key={i}
            cast={CAST[c.id]}
            f={f}
            x={260 + i * 470}
            y={1560}
            scale={2.6}
            acting={() => ({ bodyTurn: c.turn, headTurn: c.head, smile: 0.5 })}
            light={{ keySide: -1, rim: "#ffcf87", rimStrength: 0.45 }}
          />
        ))}
      </svg>
    </div>
  );
};
