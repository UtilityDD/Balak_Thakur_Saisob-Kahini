import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { BN_FONT } from "../../cinematic/fonts";
import {
  StandingChild,
  standingChildJoints,
  turnTortoiseRim,
  BEND_AT,
  REACH_T,
  type StandingChildProps,
  type StandingPose,
  type StandingExpression,
} from "../rig/StandingChild";

/**
 * StandingChildQA (Episode 5): the standing child rig in the BAL-26 design.
 * sheet "poses" (default): every pose large and labelled, animated over the 240 frames with the blends:
 *   standIdle (talking from frame 140), standQuiet, handInHands (palm turned up and back), the rise cycle
 *   (standBend > rise > standIdle > standBend), bitten (blink of surprise, then calm), standBend, turnTortoise (the demo
 *   roll; the grey shell is a QA stand-in drawn from the hand targets) and reachGrab > bitten.
 * sheet "turnaround": plate 01 beside the rig, and standIdle at three-quarter left, front and three-quarter right.
 *   Render it with --props='{"sheet":"turnaround"}' (or the StandingChildTurnQA export).
 */
export interface StandingChildQAProps {
  sheet?: "poses" | "turnaround";
  /** Optional head scale for every figure (StandingChild `headScale`), e.g. --props='{"headScale":1.35}'. */
  headScale?: number;
}

const PLATE = "images/reference/01_Thakur_Age06_Child_Ujanchar.jpg";

const Label: React.FC<{ x: number; y: number; text: string; sub?: string; w?: number }> = ({ x, y, text, sub, w = 380 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, textAlign: "center", fontFamily: BN_FONT, color: "#4a3324", lineHeight: 1.1 }}>
    <div style={{ fontSize: 26, fontWeight: 700 }}>{text}</div>
    {sub ? <div style={{ fontSize: 17, fontWeight: 500, opacity: 0.8 }}>{sub}</div> : null}
  </div>
);

const Ground: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <g>
    <line x1={x - w / 2} x2={x + w / 2} y1={y} y2={y} stroke="#9c7b55" strokeWidth={2} opacity={0.35} />
    <ellipse cx={x} cy={y + 3} rx={w * 0.22} ry={8} fill="#6b4a2a" opacity={0.16} />
  </g>
);

/** QA stand-in shell (not the tortoise rig): a grey-brown dome between the two hand targets, rolled by phi. */
const Shell: React.FC<{ c: { x: number; y: number }; phi: number; s: number }> = ({ c, phi, s }) => {
  const k = Math.cos(phi);
  return (
    <g transform={`translate(${c.x} ${c.y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={30} ry={Math.max(4, 14 * Math.abs(k))} fill={k > 0 ? "#6f6a4c" : "#c9b98a"} />
      <ellipse cx={-4} cy={-3 * Math.sign(k)} rx={20} ry={Math.max(2, 7 * Math.abs(k))} fill={k > 0 ? "#8a845e" : "#ddd0a4"} opacity={0.8} />
    </g>
  );
};

const S = 1.2;

const PosesSheet: React.FC<{ headScale?: number }> = ({ headScale }) => {
  const f = useCurrentFrame();
  const talk = f >= 140 && f < 210 ? Math.max(0, 0.5 * Math.sin(f * 0.8) + 0.3 * Math.sin(f * 2.1 + 1) + 0.12) : 0;

  // rise cycle: bend 0-40, rise 40-80, idle 80-150, bend 150-240 (blend 24)
  const riseCycle = (): Partial<StandingChildProps> => {
    if (f < 40) return { pose: "standBend", poseStart: 0 };
    if (f < 80) return { pose: "rise", poseStart: 40, prevPose: "standBend" };
    if (f < 150) return { pose: "standIdle", poseStart: 80, prevPose: "rise", blendFrames: 8 };
    return { pose: "standBend", poseStart: 150, prevPose: "standIdle", blendFrames: 26 };
  };
  // reach > bite cycle: bend 0-20, reachGrab 20-60, bitten 60-200 (the head tugs), bend 200-240
  const biteAt = (t: number) => ({ x: 128 + 6 * Math.sin(t * 0.09) + (t > 60 ? 4 : 0), y: -30 - 3 * Math.sin(t * 0.13) });
  const reachCycle = (): Partial<StandingChildProps> => {
    if (f < 20) return { pose: "standBend", poseStart: 0 };
    if (f < 60) return { pose: "reachGrab", poseStart: 20, prevPose: "standBend" };
    if (f < 200) return { pose: "bitten", poseStart: 60, prevPose: "reachGrab", prevPoseStart: 20, blendFrames: 6, biteAt: biteAt(f) };
    return { pose: "standBend", poseStart: 200, prevPose: "bitten", blendFrames: 20 };
  };
  const bittenStart = f < 120 ? 0 : 120;
  const roll = turnTortoiseRim(f, BEND_AT);
  const palmUp = 0.5 - 0.5 * Math.cos((f * 2 * Math.PI) / 96);

  const panels: Array<{ x: number; y: number; label: string; sub: string; props: Partial<StandingChildProps>; extra?: React.ReactNode }> = [
    { x: 150, y: 640, label: "standIdle", sub: talk > 0 ? "talking (shallow breath)" : "weight shifts, glances", props: { pose: "standIdle", mouth: talk } },
    { x: 400, y: 640, label: "standQuiet", sub: "Ep 6 glimpse", props: { pose: "standQuiet" } },
    {
      x: 660,
      y: 640,
      label: "handInHands",
      sub: `palmUp ${palmUp.toFixed(2)}`,
      props: { pose: "handInHands", palmUp, expression: "compassionate" },
    },
    { x: 1010, y: 640, label: "rise cycle", sub: riseCycle().pose as string, props: riseCycle() },
    {
      x: 1520,
      y: 640,
      label: "bitten",
      sub: "surprised-calm; dots: bite edge, far hand, far knee",
      props: { pose: "bitten", poseStart: bittenStart, biteAt: biteAt(f) },
    },
    { x: 260, y: 1040, label: "standBend", sub: "feet planted, hands at tortoise height", props: { pose: "standBend" } },
    { x: 860, y: 1040, label: "turnTortoise", sub: "demo roll (stand-in shell)", props: { pose: "turnTortoise", poseStart: 0 } },
    { x: 1460, y: 1040, label: "reachGrab > bitten", sub: (reachCycle().pose as string) ?? "", props: reachCycle() },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f4ead8, #e8d9bd)" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {panels.map((p, i) => {
          const props: StandingChildProps = { x: p.x, y: p.y, s: S, f, lifeF: f, ...p.props, ...(headScale !== undefined ? { headScale } : {}) } as StandingChildProps;
          const pose = (p.props.pose ?? "standIdle") as StandingPose;
          let extra: React.ReactNode = null;
          if (pose === "turnTortoise") {
            const c = { x: p.x + S * (roll.near.x + roll.far.x) * 0.5, y: p.y + S * (BEND_AT.y - roll.lift + 6) };
            extra = <Shell c={c} phi={roll.phi} s={S} />;
          }
          if (pose === "bitten" || pose === "reachGrab") {
            const j = standingChildJoints(props);
            extra = (
              <g>
                <circle cx={j.edgeNear.x} cy={j.edgeNear.y} r={5} fill="#3c5a2a" opacity={0.55} />
                <circle cx={j.handFar.x} cy={j.handFar.y} r={4} fill="#2a4a8a" opacity={0.6} />
                <circle cx={j.kneeFar.x} cy={j.kneeFar.y} r={4} fill="#8a2a2a" opacity={0.6} />
              </g>
            );
          }
          if (pose === "handInHands") {
            const j = standingChildJoints(props);
            extra = <circle cx={j.handNear.x} cy={j.handNear.y} r={30} fill="none" stroke="#b04a3a" strokeWidth={2} strokeDasharray="5 5" opacity={0.5} />;
          }
          if (headScale !== undefined && pose === "standIdle") {
            const j = standingChildJoints(props);
            extra = <circle cx={j.glowAnchor.x} cy={j.glowAnchor.y} r={60 * j.headScale} fill="none" stroke="#c9a040" strokeWidth={2} strokeDasharray="4 6" opacity={0.7} />;
          }
          return (
            <g key={i}>
              <Ground x={p.x + (pose === "standIdle" || pose === "standQuiet" || pose === "handInHands" ? 0 : 60)} y={p.y} w={pose === "standIdle" || pose === "standQuiet" ? 220 : 420} />
              <StandingChild {...props} />
              {extra}
            </g>
          );
        })}
      </svg>
      {panels.map((p, i) => (
        <Label key={i} x={p.x + (i >= 3 ? 60 : 0)} y={i < 5 ? 8 : 668} text={p.label} sub={p.sub} />
      ))}
      <div style={{ position: "absolute", right: 16, bottom: 10, fontFamily: BN_FONT, fontSize: 18, color: "#4a3324", opacity: 0.7 }}>
        StandingChild QA, frame {f} (reach {REACH_T.reach} f, grip {REACH_T.grip} f)
      </div>
    </AbsoluteFill>
  );
};

const TurnSheet: React.FC = () => {
  const f = useCurrentFrame();
  const exprs: StandingExpression[] = ["serene", "joyful", "thoughtful", "compassionate", "surprised-calm"];
  const expr = exprs[Math.floor(f / 48) % exprs.length];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f4ead8, #e8d9bd)" }}>
      <Img src={staticFile(PLATE)} style={{ position: "absolute", left: 20, top: 150, width: 700, height: 391, objectFit: "cover", borderRadius: 6 }} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Ground x={860} y={1000} w={240} />
        <StandingChild x={860} y={1000} s={1.9} f={f} lifeF={f} pose="standIdle" yaw={0} expression={expr} />
        {[
          { x: 1180, flip: true, yaw: 1 },
          { x: 1460, flip: false, yaw: 0 },
          { x: 1740, flip: false, yaw: 1 },
        ].map((v, i) => (
          <g key={i}>
            <Ground x={v.x} y={760} w={220} />
            <StandingChild x={v.x} y={760} s={1.25} f={f} lifeF={f + 37 * i} pose="standIdle" yaw={v.yaw} flip={v.flip} />
          </g>
        ))}
      </svg>
      <Label x={370} y={90} text="plate 01 (age 6)" />
      <Label x={860} y={60} text="rig beside the plate" sub={`expression: ${expr}`} />
      <Label x={1180} y={60} text="3/4 left" sub="flip" w={260} />
      <Label x={1460} y={60} text="front" sub="yaw 0" w={260} />
      <Label x={1740} y={60} text="3/4 right" sub="yaw 1" w={260} />
    </AbsoluteFill>
  );
};

export const StandingChildQA: React.FC<StandingChildQAProps> = ({ sheet = "poses", headScale }) =>
  sheet === "turnaround" ? <TurnSheet /> : <PosesSheet headScale={headScale} />;

/** The turnaround sheet as its own component (for a separate registration if wanted). */
export const StandingChildTurnQA: React.FC = () => <TurnSheet />;
