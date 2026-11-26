import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { StandingChild, standingChildJoints, type StandingChildProps, type StandingPose } from "../../episode05/rig/StandingChild";
import { SeatedChild, seatedChildHands, type SeatedChildProps, type SeatedPose } from "../../episode03/rig/SeatedChild";
import { BN_FONT } from "../../cinematic/fonts";

/**
 * BalakRef2PoseQA (480 frames): the test bed for Balak's new look (plateLook="ref2", BAL-26e/f) in motion. Standing (left)
 * and seated (right), each at a medium scale and in a close-up panel, cycle through the common gestures, one every
 * 36 frames with a 12-frame eased change: rest; holding a prop at the chest; offering with both hands; one arm raised
 * high; pointing; open palm "stop"; hand on the knee; reaching down to the floor and back; walking a few steps;
 * turning; folded hands; hand to the chest; a shrug. Look at consecutive frames (cloth lag, elbows, shoulders, contact).
 * Round 4: standing with bodyLean="auto" (the upper body leans into reaches), seated with offerTuck=1 (foreshortened
 * offering forearms).
 */

type V = { x: number; y: number };
type Seg = {
  label: string;
  st: { pose?: StandingPose; near?: V; far?: V; walk?: boolean; yaw?: number; namaskar?: boolean };
  se: { pose?: SeatedPose; near?: V; far?: V; holding?: SeatedChildProps["holding"]; reachAt?: V; lookX?: number };
};

const SEG = 36;
const EASE = 12;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

const LOOK = { plateLook: "ref2" as const };

/* Rest hands of each rig (palm centres, figure units), so every change is a smooth target blend. */
const ST_BASE: StandingChildProps = { x: 0, y: 0, s: 1, f: 0, lifeF: 0, build: "healthy", age: 5, ...LOOK, bodyLean: "auto" };
const stRest = (() => {
  const j = standingChildJoints({ ...ST_BASE, pose: "standIdle" });
  return { near: j.handNear, far: j.handFar };
})();
const SE_BASE: SeatedChildProps = { x: 0, y: 0, s: 1, f: 0, lifeF: 0, design: "plate", age: 5, ...LOOK, offerTuck: 1 };
const seRest = (() => {
  const h = seatedChildHands({ ...SE_BASE, pose: "sitCross" });
  return { near: h.nearPalm, far: h.farPalm };
})();

const SEGS: Seg[] = [
  { label: "rest", st: {}, se: { pose: "sitCross" } },
  { label: "both hands: prop at the chest", st: { near: { x: 24, y: -300 }, far: { x: 40, y: -306 } }, se: { pose: "holdToChest", holding: "gobinda" } },
  { label: "offering out with both hands", st: { near: { x: 96, y: -296 }, far: { x: 88, y: -308 } }, se: { pose: "offerUp", holding: "gobinda", reachAt: { x: 82, y: -120 } } },
  { label: "one arm raised high", st: { near: { x: 46, y: -505 } }, se: { near: { x: 34, y: -232 } } },
  { label: "pointing", st: { near: { x: 158, y: -366 } }, se: { near: { x: 112, y: -128 } } },
  { label: "open palm: stop", st: { near: { x: 98, y: -386 } }, se: { near: { x: 78, y: -150 } } },
  { label: "hand on the knee / thigh", st: { near: { x: 18, y: -212 } }, se: { near: { x: 56, y: -50 } } },
  { label: "reaching down to the floor and back", st: { pose: "standBend" }, se: { pose: "kneelReach", reachAt: { x: 92, y: -44 } } },
  { label: "walking a few steps", st: { walk: true }, se: { pose: "sitCross", lookX: 0.4 } },
  { label: "turning the head and body", st: { yaw: 0.15 }, se: { pose: "sitCross", lookX: -0.8 } },
  { label: "folded hands (namaskar)", st: { near: { x: 34, y: -318 }, far: { x: 34, y: -320 }, namaskar: true }, se: { pose: "bowHands" } },
  { label: "hand to the chest", st: { near: { x: 14, y: -318 } }, se: { near: { x: 16, y: -112 } } },
  { label: "a shrug, palms up", st: { near: { x: 64, y: -262 }, far: { x: -6, y: -262 } }, se: { near: { x: 64, y: -84 }, far: { x: -26, y: -84 } } },
];
const TOTAL = SEGS.length * SEG;

const segAt = (f: number) => {
  const ff = clamp(f, 0, TOTAL - 1);
  const i = Math.floor(ff / SEG);
  return { i, t: ff - i * SEG, start: i * SEG };
};

const standingProps = (f: number): StandingChildProps & { label: string } => {
  const { i, t, start } = segAt(f);
  const cur = SEGS[i].st;
  const prev = SEGS[Math.max(0, i - 1)].st;
  const u = i === 0 ? 1 : smooth(t / EASE);
  const tgt = (s: Seg["st"]) => (s.pose === "standBend" ? null : { near: s.near ?? stRest.near, far: s.far ?? stRest.far });
  const a = tgt(prev);
  const b = tgt(cur);
  const handTargets = b && a ? { near: lerpV(a.near, b.near, u), far: lerpV(a.far, b.far, u) } : b ?? undefined;
  // hands placed by targets use handInHands (both palms to their targets); rest is standIdle; the reach down is the
  // bend pose, eased in and out within its segment
  const kind = (s: Seg["st"]): StandingPose => (s.pose === "standBend" ? "standBend" : s.near || s.far ? "handInHands" : "standIdle");
  const pose: StandingPose = cur.pose === "standBend" ? (t < SEG - EASE ? "standBend" : "standIdle") : kind(cur);
  const prevKind = i > 0 ? (prev.pose === "standBend" ? "standIdle" : kind(prev)) : pose;
  const prevPose: StandingPose | undefined =
    cur.pose === "standBend" ? (t < SEG - EASE ? prevKind : "standBend") : prevKind !== pose ? prevKind : undefined;
  const poseStart = cur.pose === "standBend" ? (t < SEG - EASE ? start : start + SEG - EASE) : start;
  const yaw = lerp(prev.yaw ?? 1, cur.yaw ?? 1, u) * (cur.yaw !== undefined ? 1 : 1);
  const walkW = cur.walk ? smooth(t / 6) * (1 - smooth((t - SEG + 6) / 6)) : 0;
  const ph = (t / 18) * 2 * Math.PI;
  const legDrive = walkW > 0
    ? {
        near: { z: 20 * Math.sin(ph) * walkW, lift: 7 * Math.max(0, Math.cos(ph)) * walkW },
        far: { z: -20 * Math.sin(ph) * walkW, lift: 7 * Math.max(0, -Math.cos(ph)) * walkW },
        pelvisDrop: 3 * Math.abs(Math.sin(ph)) * walkW,
      }
    : undefined;
  return {
    ...ST_BASE,
    label: SEGS[i].label,
    f,
    lifeF: f,
    pose,
    prevPose,
    poseStart,
    yaw,
    handTargets: pose === "handInHands" ? handTargets : undefined,
    handDirs: cur.namaskar ? { near: lerpV({ x: 0.92, y: 0.4 }, { x: 0.12, y: -1 }, u), far: lerpV({ x: 0.6, y: 0.8 }, { x: 0.12, y: -1 }, u) } : undefined,
    palmUp: cur.namaskar ? 0 : 0.35,
    legDrive,
    face: { lookX: cur.near ? 0.3 : 0, smile: 0.55 },
  };
};

const seatedProps = (f: number): SeatedChildProps => {
  const { i, t, start } = segAt(f);
  const cur = SEGS[i].se;
  const prev = SEGS[Math.max(0, i - 1)].se;
  const hands = (s: Seg["se"]) => (s.near || s.far ? { near: s.near ?? seRest.near, far: s.far ?? seRest.far } : null);
  const a = hands(prev);
  const b = hands(cur);
  const u = i === 0 ? 1 : smooth(t / EASE);
  const pose: SeatedPose = cur.pose ?? "handsTo";
  const prevPoseRaw: SeatedPose = prev.pose ?? "handsTo";
  let handTargets: SeatedChildProps["handTargets"];
  if (pose === "handsTo") handTargets = a ? { near: lerpV(a.near, b!.near, u), far: lerpV(a.far, b!.far, u) } : b ?? undefined;
  // kneelReach goes out and comes back within its segment
  const back = pose === "kneelReach" && t >= SEG - EASE;
  return {
    ...SE_BASE,
    f,
    lifeF: f,
    pose: back ? "sitCross" : pose,
    prevPose: back ? "kneelReach" : i > 0 && prevPoseRaw !== pose ? prevPoseRaw : undefined,
    poseStart: back ? start + SEG - EASE : start,
    prevPoseStart: back ? start : i > 0 ? start - SEG : undefined,
    kneel: pose === "kneelReach" && !back ? 1.5 : back ? 1.5 * (1 - smooth((t - (SEG - EASE)) / EASE)) : 0,
    holding: cur.holding,
    reachAt: cur.reachAt,
    prevReachAt: prev.reachAt,
    prevHolding: prev.holding ?? null,
    handTargets,
    handShapes: handTargets ? { near: "open", far: "open" } : undefined,
    face: { lookX: lerp(prev.lookX ?? 0, cur.lookX ?? 0, u), smile: 0.55 },
  };
};

const Panel: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; title: string }> = ({ x, y, w, h, children, title }) => {
  const id = `bqa-${x}-${y}`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={w} height={h} rx={10} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={10} fill="#f6ecd9" stroke="#c9b48e" strokeWidth={1.5} />
      <g clipPath={`url(#${id})`}>{children}</g>
      <text x={x + 12} y={y + 26} fontFamily={BN_FONT} fontSize={18} fill="#7a5a3a">
        {title}
      </text>
    </g>
  );
};

export const BalakRef2PoseQA: React.FC = () => {
  const f = useCurrentFrame();
  const sp = standingProps(f);
  const { label, ...stProps } = sp;
  const se = seatedProps(f);
  const walkX = (() => {
    const { i, t } = segAt(f);
    return SEGS[i].st.walk ? 1.1 * smooth(t / SEG) * 60 : 0;
  })();
  return (
    <AbsoluteFill style={{ background: "#efe3cc" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Panel x={20} y={70} w={420} h={990} title="standing, medium">
          <ellipse cx={210 + walkX * 0.85} cy={986} rx={70} ry={10} fill="#3a2414" opacity={0.18} />
          <StandingChild {...stProps} x={190 + walkX * 0.85} y={985} s={0.85} headScale={1.45} />
        </Panel>
        <Panel x={460} y={70} w={520} h={990} title="standing, close-up">
          <StandingChild {...stProps} x={650 + walkX * 2} y={1290} s={2.0} headScale={1.45} />
        </Panel>
        <Panel x={1000} y={70} w={420} h={990} title="seated, medium">
          <ellipse cx={1210} cy={862} rx={150} ry={14} fill="#3a2414" opacity={0.18} />
          <SeatedChild {...se} x={1190} y={860} s={1.55} />
        </Panel>
        <Panel x={1440} y={70} w={460} h={990} title="seated, close-up">
          <SeatedChild {...se} x={1640} y={1150} s={3.4} />
        </Panel>
        <text x={24} y={46} fontFamily={BN_FONT} fontSize={30} fill="#5a3e26">
          {`BalakRef2PoseQA  ·  ${label}  ·  frame ${f}`}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
