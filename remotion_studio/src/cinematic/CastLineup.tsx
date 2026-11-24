import React from "react";
import { useCurrentFrame } from "remotion";
import { CAST } from "./rig/cast";
import { Pose, Puppet } from "./rig/Puppet";
import { visemeChatter } from "./rig/lipsync";

const POSES: Array<Partial<Pose>> = [
  { bodyTurn: 0.45, headTurn: 0.1, rS: 75, rE: 0, rHand: "point", smile: 0.6 }, // babukaka points
  { bodyTurn: -0.5, headTurn: -0.2, stride: 1, rS: 20, rE: -20, lS: 15, lE: -15 }, // gopal walks
  { bodyTurn: 0.9, headTurn: 0.1, rS: 60, rE: 90, rHand: "open", lS: 60, lE: 90, lHand: "open" }, // rama profile, hands up
  { bodyTurn: -0.3, rS: 10, rE: -150, rHand: "relaxed", smile: -0.5, browTilt: 0.8 }, // madhu
  { bodyTurn: 0.35, rS: 130, rE: 35, lS: 130, lE: 35, rHand: "open", lHand: "open", gasp: 0.6 }, // kedarkaka (seated)
  { bodyTurn: -0.7, headTurn: -0.3, rS: 55, rE: -105, rHand: "fist", lS: 55, lE: -105, lHand: "fist" }, // listenerA hands on hips
  { bodyTurn: 0.25, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", lid: 0.4 }, // listenerB pranam (seated)
  { bodyTurn: 0.6, crouch: 0.5, rS: 70, rE: -20, rHand: "cup" }, // kid crouch
  { bodyTurn: -0.4, crouch: 1, rS: 25, rE: 140, rHand: "abhaya" }, // dhaki kneel + abhaya
  { bodyTurn: 0.8, rS: 5, rE: -72, lS: 5, lE: -72, rHand: "hold", lHand: "hold" }, // duikha
  { bodyTurn: -0.55, crouch: 0.9, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam" }, // woman kneeling pranam
  { bodyTurn: 0.3, stride: 1, rS: 5, rE: -95, lS: 5, lE: -95 }, // woman walking
];

/** Model sheet: every cast member in a different turn / pose (rig QA). */
export const CastLineup: React.FC = () => {
  const f = useCurrentFrame();
  const ids = Object.keys(CAST).slice(0, 12);
  return (
    <div style={{ width: 1920, height: 1080, background: "linear-gradient(#2a1b2e, #120b14)" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <rect x={0} y={760} width={1920} height={320} fill="#24161c" />
        {ids.map((id, i) => {
          const c = CAST[id];
          const row = i < 6 ? 0 : 1;
          const col = row === 0 ? i : i - 6;
          return (
            <Puppet
              key={id}
              cast={c}
              f={f}
              x={170 + col * 315}
              y={row === 0 ? 480 : 1020}
              scale={c.age === "child" ? 1.25 : 1.0}
              seated={id === "kedarkaka" || id === "listenerB"}
              acting={() => ({ smile: 0.45, ...POSES[i % POSES.length] })}
              mouth={(fr) => visemeChatter(fr, i + 1)}
              light={{ keySide: -1, rim: "#ffb85c", rimStrength: 0.6 }}
            />
          );
        })}
      </svg>
    </div>
  );
};

/** Face close-up QA. */
export const CastCloseup: React.FC = () => {
  const f = useCurrentFrame();
  const ids = ["babukaka", "gopal", "charu", "kedarkaka"];
  return (
    <div style={{ width: 1920, height: 1080, background: "#2a1b2e" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {ids.map((id, i) => {
          const c = CAST[id];
          return (
            <Puppet
              key={id}
              cast={c}
              f={f}
              x={250 + i * 480}
              y={c.age === "child" ? 1300 : 1780}
              scale={c.age === "child" ? 3.4 : 3.0}
              acting={() => ({ bodyTurn: [-0.3, 0.3, -0.5, 0.4][i], headTurn: [-0.2, 0.2, -0.1, 0.25][i], smile: [0.5, 0.9, 0.3, 0.6][i], rS: 40, rE: 60, rHand: "open" })}
              mouth={(fr) => visemeChatter(fr, i + 1)}
              light={{ keySide: -1, rim: "#ffb85c", rimStrength: 0.6 }}
            />
          );
        })}
      </svg>
    </div>
  );
};
