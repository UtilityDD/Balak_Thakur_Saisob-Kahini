import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Puppet } from "../../cinematic/rig/Puppet";
import { CAST, EP06_CHILD_SCALE } from "../../cinematic/rig/cast";
import { SeatedChild } from "../../episode03/rig/SeatedChild";
import { BN_FONT } from "../../cinematic/fonts";
import { ThakurHeadPlate, plateFaceState } from "../../cinematic/rig/ThakurHeadPlate";

const PLATE_TURN_MAX = 1.8; // the strip asks up to 1.8 to show the clamp at PLATE_TURN_READ (1.3)
import {
  StandingChild,
  standingChildJoints,
  glanceHideThenFather,
  WIPE_T,
  type GiveKey,
  type StandingChildProps,
  type V,
} from "../../episode05/rig/StandingChild";

/**
 * StandingChild6QA (Episode 6): the new StandingChild poses, all animated over 240 frames.
 * Row 1 (s 1.0): standScolded > hurtBack (the swat at f 30: flinch, quick breathing settling, teary fades in, sniffs),
 *   hurtBack + glanceHideThenFather (eyes lead, the head follows: hiding place, then the father's face; markers),
 *   hurtBack talking with a slow head shake (eyes stay on the father), wipeEye (back of the far hand to the eye, rub,
 *   down, the forgiving smile), holdOut (QA stand-in note in layerMid between the pinches), giveOut (turning between
 *   three marked palms; stand-in twist in layerFar, lozenges).
 * Row 2: teary 0 / 0.5 / 1 on the plate head (expression hurt), the hurt and forgiving expressions, and three figures
 *   at the scale used next to adults (s 0.56, headScale 1.35) beside an adult-height bar.
 */

const Label: React.FC<{ x: number; y: number; text: string; sub?: string; w?: number }> = ({ x, y, text, sub, w = 300 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, textAlign: "center", fontFamily: BN_FONT, color: "#4a3324", lineHeight: 1.1 }}>
    <div style={{ fontSize: 22, fontWeight: 700 }}>{text}</div>
    {sub ? <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.8 }}>{sub}</div> : null}
  </div>
);

const Ground: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <g>
    <line x1={x - w / 2} x2={x + w / 2} y1={y} y2={y} stroke="#9c7b55" strokeWidth={2} opacity={0.35} />
    <ellipse cx={x} cy={y + 3} rx={w * 0.22} ry={7} fill="#6b4a2a" opacity={0.15} />
  </g>
);

const Marker: React.FC<{ p: V; label: string; color?: string }> = ({ p, label, color = "#a0442e" }) => (
  <g>
    <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 3" />
    <circle cx={p.x} cy={p.y} r={2.5} fill={color} />
    <text x={p.x} y={p.y - 14} textAnchor="middle" fontFamily={BN_FONT} fontSize={14} fill={color}>
      {label}
    </text>
  </g>
);

/** QA stand-in for the props agent's note: a pale blue-grey slip between the pinches. */
const NoteStandIn: React.FC<{ anchor: V; angle: number; width: number; s: number }> = ({ anchor, angle, width, s }) => (
  <g transform={`translate(${anchor.x} ${anchor.y}) rotate(${angle})`}>
    <rect x={-width / 2 - 3 * s} y={-13 * s} width={width + 6 * s} height={22 * s} rx={1.5 * s} fill="#c9d3d6" stroke="#8c9ca2" strokeWidth={1} />
    <rect x={-width / 2} y={-10 * s} width={width} height={16 * s} fill="none" stroke="#7d8f96" strokeWidth={0.8} opacity={0.7} />
    <text x={0} y={2.5 * s} textAnchor="middle" fontFamily={BN_FONT} fontSize={11 * s} fill="#4e5f66">
      ১০
    </text>
  </g>
);

/** QA stand-in paper twist (thonga): a cone whose point sits in the fist, mouth up. */
const TwistStandIn: React.FC<{ grip: V; mouth: V; s: number }> = ({ grip, mouth, s }) => {
  const tip = { x: grip.x - (mouth.x - grip.x) * 0.25, y: grip.y - (mouth.y - grip.y) * 0.25 };
  const w = 13 * s;
  return (
    <g>
      <path d={`M${tip.x} ${tip.y} L${mouth.x - w} ${mouth.y} Q${mouth.x} ${mouth.y + 4 * s} ${mouth.x + w} ${mouth.y} Z`} fill="#d9c08e" stroke="#a88c5a" strokeWidth={1} />
      <ellipse cx={mouth.x} cy={mouth.y} rx={w} ry={3.5 * s} fill="#8a6b3e" />
      <circle cx={mouth.x - 4 * s} cy={mouth.y - 1.5 * s} r={2.6 * s} fill="#e05a6a" />
      <circle cx={mouth.x + 3 * s} cy={mouth.y - 2 * s} r={2.6 * s} fill="#f2c23a" />
    </g>
  );
};

const DEBUG = false;
const LOZ = ["#e05a6a", "#f2c23a", "#5aa0e0"];

const mouthAt = (f: number, a: number, b: number) =>
  f >= a && f < b ? Math.max(0, 0.45 * Math.sin(f * 0.8) + 0.3 * Math.sin(f * 2.1 + 1) + 0.12) * (f % 37 < 31 ? 1 : 0) : 0;

/** Head turn strip: the plate head from turn 0 to +-PLATE_TURN_MAX in 8 steps each way (--props='{"sheet":"turn"}'). */
const TurnStrip: React.FC = () => {
  const f = useCurrentFrame();
  const steps = Array.from({ length: 8 }, (_, i) => (i / 7) * PLATE_TURN_MAX);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f4ead8, #e8d9bd)" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {[1, -1].map((sg, r) =>
          steps.map((t, i) => (
            <ThakurHeadPlate key={`${r}-${i}`} x={130 + i * 237} y={300 + r * 470} scale={2.4} age={6} state={plateFaceState({ f, lifeF: f + 50, turn: sg * t, lookX: sg * Math.min(1, t) * 0.6 })} />
          )),
        )}
      </svg>
      {[1, -1].map((sg, r) =>
        steps.map((t, i) => <Label key={`${r}-${i}`} x={130 + i * 237} y={60 + r * 470} text={`turn ${(sg * t).toFixed(2)}`} w={220} />),
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* BAL-26c: classic vs healthy build                                     */
/* ------------------------------------------------------------------ */

/** The poses compared (old | new), at the Episode 6 head scale; animated over the 240 frames. */
const comparePose = (key: string, f: number, x: number, y: number, s: number, hs: number, build: "classic" | "healthy"): { props: StandingChildProps; extra?: (j: ReturnType<typeof standingChildJoints>) => React.ReactNode } => {
  const base = { x, y, s, headScale: hs, f, lifeF: f, build } as StandingChildProps;
  if (key === "standIdle") return { props: { ...base, pose: "standIdle", mouth: mouthAt(f, 150, 220) } };
  if (key === "standQuiet") return { props: { ...base, pose: "standQuiet" } };
  if (key === "hurtBack") {
    const sw = 40;
    return { props: f < sw ? { ...base, pose: "standScolded" } : { ...base, pose: "hurtBack", poseStart: sw, prevPose: "standScolded", blendFrames: 8, teary: 0.5 } };
  }
  if (key === "holdOut") return { props: { ...base, pose: "holdOut", poseStart: -50, gaze: [{ at: { x: 160, y: -560 }, start: -100 }] }, extra: (j) => (j.note ? <NoteStandIn anchor={j.note.anchor} angle={j.note.angle} width={j.note.width} s={s} /> : null) };
  if (key === "giveOut") {
    const gives: GiveKey[] = [
      { at: { x: 92, y: -250 }, start: 10 },
      { at: { x: 66, y: -224 }, start: 90 },
      { at: { x: 108, y: -272 }, start: 170 },
    ];
    return { props: { ...base, pose: "giveOut", poseStart: -50, gives, yaw: 0.8 }, extra: (j) => (j.twist ? <TwistStandIn grip={j.twist.grip} mouth={j.twist.mouth} s={s} /> : null) };
  }
  // wipeEye, looping every 120 frames
  const ws = f < 120 ? 20 : 140;
  return { props: f % 120 < 20 ? { ...base, pose: "hurtBack", poseStart: -300, teary: 0.8 } : { ...base, pose: "wipeEye", poseStart: ws, prevPose: "hurtBack", prevPoseStart: -300, blendFrames: 8, teary: 0.6 } };
};

const COMPARE = ["standIdle", "standQuiet", "hurtBack", "holdOut", "giveOut", "wipeEye"];

const HealthyCompare: React.FC = () => {
  const f = useCurrentFrame();
  const S = 0.8;
  const HS = EP06_CHILD_SCALE.standingBalak.headScale;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f4ead8, #e8d9bd)" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {COMPARE.map((k, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x0 = 150 + col * 640;
          const gy = 500 + row * 520;
          return (["classic", "healthy"] as const).map((b, bi) => {
            const x = x0 + bi * 250;
            const c = comparePose(k, f, x, gy, S, HS, b);
            const j = standingChildJoints(c.props);
            const ex = c.extra ? c.extra(j) : null;
            const layer = k === "holdOut" ? { layerMid: ex } : k === "giveOut" ? { layerFar: ex } : {};
            return (
              <g key={`${k}-${b}`}>
                <Ground x={x + 20} y={gy} w={220} />
                <StandingChild {...c.props} {...layer} />
              </g>
            );
          });
        })}
      </svg>
      {COMPARE.map((k, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x0 = 150 + col * 640;
        return (
          <React.Fragment key={k}>
            <Label x={x0 + 125} y={8 + row * 520} text={k} w={480} />
            <Label x={x0} y={34 + row * 520} text="" sub="old (classic)" w={200} />
            <Label x={x0 + 250} y={34 + row * 520} text="" sub='new build="healthy"' w={200} />
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", right: 16, bottom: 6, fontFamily: BN_FONT, fontSize: 16, color: "#4a3324", opacity: 0.7 }}>BAL-26c/26d StandingChild classic vs healthy (chadar over shoulders and upper arms), s {S}, headScale {HS}, frame {f}</div>
    </AbsoluteFill>
  );
};

const PLATE_IMG = "images/reference/01_Thakur_Age06_Child_Ujanchar.jpg";

/** The healthy build turned (3/4 left, front, 3/4 right) beside plate 01 and seated Balak; then next to an adult and a
 * village boy at EP06_CHILD_SCALE (and the classic build for reference). */
const HealthyTurn: React.FC = () => {
  const f = useCurrentFrame();
  const K = 0.98;
  const B = EP06_CHILD_SCALE.standingBalak;
  const G1 = 520;
  const G2 = 1040;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f4ead8, #e8d9bd)" }}>
      <Img src={staticFile(PLATE_IMG)} style={{ position: "absolute", left: 16, top: 70, width: 560, height: 313, objectFit: "cover", borderRadius: 6 }} />
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {[
          { x: 720, flip: true, yaw: 1 },
          { x: 930, flip: false, yaw: 0 },
          { x: 1140, flip: false, yaw: 1 },
        ].map((v, i) => (
          <g key={i}>
            <Ground x={v.x} y={G1} w={200} />
            <StandingChild x={v.x} y={G1} s={0.9} headScale={B.headScale} f={f} lifeF={f + 37 * i} pose="standIdle" yaw={v.yaw} flip={v.flip} build="healthy" />
          </g>
        ))}
        <Ground x={1520} y={G1} w={300} />
        <SeatedChild x={1520} y={G1} s={(0.9 * EP06_CHILD_SCALE.seatedBalak.s) / B.s} design="plate" age={6} f={f} lifeF={f} pose="sitCross" />
        {/* lineup at true relative scale */}
        <line x1={60} x2={1860} y1={G2} y2={G2} stroke="#9c7b55" strokeWidth={2} opacity={0.35} />
        <Puppet cast={CAST.surendra} f={f} lifeF={f} x={260} y={G2} scale={K} acting={() => ({ bodyTurn: 0.35, smile: 0.4 })} />
        <Puppet cast={CAST.villageBoyC} f={f} lifeF={f} x={560} y={G2} scale={K} acting={() => ({ bodyTurn: 0.35, smile: 0.4 })} />
        <StandingChild x={800} y={G2} s={B.s * K} headScale={B.headScale} f={f} lifeF={f} pose="standIdle" build="healthy" />
        <StandingChild x={1010} y={G2} s={B.s * K} headScale={B.headScale} f={f} lifeF={f + 20} pose="standIdle" />
        <Puppet cast={CAST.villageBoyA} f={f} lifeF={f} x={1250} y={G2} scale={K} acting={() => ({ bodyTurn: 0.35, smile: 0.4 })} />
        <StandingChild x={1480} y={G2} s={B.s * K} headScale={B.headScale} f={f} lifeF={f + 40} pose="holdOut" poseStart={-50} build="healthy" />
        <StandingChild x={1700} y={G2} s={B.s * K} headScale={B.headScale} f={f} lifeF={f + 60} pose="hurtBack" poseStart={-300} build="healthy" />
      </svg>
      <Label x={296} y={20} text="plate 01 (age 6)" w={500} />
      <Label x={930} y={20} text='healthy build: 3/4 left, front, 3/4 right' sub="s 0.9, headScale 1.45" w={700} />
      <Label x={1520} y={20} text="seated Balak (plate, age 6)" sub="same boy" w={400} />
      <Label x={960} y={560} text={`at EP06_CHILD_SCALE (adult K ${K}): Surendra, villageBoyC, Balak healthy, Balak classic, villageBoyA, healthy holdOut, healthy hurtBack`} w={1800} />
    </AbsoluteFill>
  );
};

export const StandingChild6QA: React.FC<{ sheet?: "healthy" | "healthyTurn" | "poses" | "turn" }> = ({ sheet = "healthy" }) =>
  sheet === "turn" ? <TurnStrip /> : sheet === "poses" ? <PosesSheet /> : sheet === "healthyTurn" ? <HealthyTurn /> : <HealthyCompare />;

const PosesSheet: React.FC = () => {
  const f = useCurrentFrame();
  const S1 = 1;
  const G1 = 640;

  // 1: standScolded > hurtBack (the swat at f 30)
  const swatF = 30;
  const p1: StandingChildProps =
    f < swatF
      ? { x: 140, y: G1, s: S1, f, lifeF: f, pose: "standScolded", poseStart: 0 }
      : {
          x: 140,
          y: G1,
          s: S1,
          f,
          lifeF: f,
          pose: "hurtBack",
          poseStart: swatF,
          prevPose: "standScolded",
          blendFrames: 8,
          teary: 0.9 * Math.min(1, Math.max(0, (f - swatF - 4) / 24)),
          sniffAt: [100, 178],
        };
  const t1 = f - swatF;
  const sub1 = f < swatF ? "standScolded (eyes down)" : t1 < 20 ? `hurtBack: flinch t ${t1}` : t1 < 56 ? "hurtBack: quick breath settling" : f >= 100 && f < 115 ? "sniff" : f >= 178 && f < 193 ? "sniff" : "hurtBack, teary";

  // 2: glanceHideThenFather
  const x2 = 440;
  const hideW: V = { x: 300, y: 330 };
  const fatherW: V = { x: 590, y: 70 };
  const loc = (P: V, x: number): V => ({ x: (P.x - x) / S1, y: (P.y - G1) / S1 });
  const gaze2 = glanceHideThenFather({ hideAt: loc(hideW, x2), fatherAt: loc(fatherW, x2), start: 40, gap: 54, back: 96 });
  const p2: StandingChildProps = { x: x2, y: G1, s: S1, f, lifeF: f + 40, pose: "hurtBack", poseStart: -300, gaze: gaze2, teary: 0.5 };
  const sub2 = f < 40 ? "own look" : f < 94 ? "eyes, then head: the hiding place" : f < 190 ? "up to the father's face" : "look handed back";

  // 3: talking in hurtBack with a slow head shake; eyes on the father
  const x3 = 740;
  const fatherW3: V = { x: 880, y: 70 };
  const shake = Math.min(1, Math.max(0, (f - 70) / 10)) * (1 - Math.min(1, Math.max(0, (f - 140) / 10)));
  const p3: StandingChildProps = {
    x: x3,
    y: G1,
    s: S1,
    f,
    lifeF: f + 80,
    pose: "hurtBack",
    poseStart: -300,
    gaze: [{ at: loc(fatherW3, x3), start: -100 }],
    mouth: mouthAt(f, 40, 200),
    headShake: shake,
    teary: 0.4,
  };
  const sub3 = (f >= 40 && f < 200 ? "talking (quiet breath)" : "listening") + (shake > 0.05 ? ", head shake" : "");

  // 4: wipeEye
  const x4 = 1040;
  const wS = 20;
  const p4: StandingChildProps =
    f < wS
      ? { x: x4, y: G1, s: S1, f, lifeF: f + 120, pose: "hurtBack", poseStart: -300, teary: 0.9 }
      : {
          x: x4,
          y: G1,
          s: S1,
          f,
          lifeF: f + 120,
          pose: "wipeEye",
          poseStart: wS,
          prevPose: "hurtBack",
          prevPoseStart: -300,
          blendFrames: 8,
          teary: 0.9 - 0.65 * Math.min(1, Math.max(0, (f - wS - 20) / 40)),
        };
  const t4 = f - wS;
  const sub4 = f < wS ? "hurtBack" : t4 < WIPE_T.up ? "hand up" : t4 < WIPE_T.rubEnd ? "wipe" : t4 < WIPE_T.down ? "hand down" : "forgiving smile";

  // 5: holdOut with a stand-in note between the pinches
  const x5 = 1330;
  const p5base: StandingChildProps = { x: x5, y: G1, s: S1, f, lifeF: f + 160, pose: "holdOut", poseStart: -50, prevPose: "standQuiet", gaze: [{ at: { x: 160, y: -560 }, start: -100 }] };
  const j5 = standingChildJoints(p5base);
  const p5: StandingChildProps = { ...p5base, layerMid: j5.note ? <NoteStandIn anchor={j5.note.anchor} angle={j5.note.angle} width={j5.note.width} s={S1} /> : null };

  // 6: giveOut between three palms
  const x6 = 1640;
  const gives: GiveKey[] = [
    { at: { x: 92, y: -262 }, start: 10 },
    { at: { x: 64, y: -228 }, start: 85 },
    { at: { x: 108, y: -284 }, start: 160 },
  ];
  const p6base: StandingChildProps = { x: x6, y: G1, s: S1, f, lifeF: f + 200, pose: "giveOut", poseStart: -50, gives, yaw: 0.8 };
  const j6 = standingChildJoints(p6base);
  const p6: StandingChildProps = { ...p6base, layerFar: j6.twist ? <TwistStandIn grip={j6.twist.grip} mouth={j6.twist.mouth} s={S1} /> : null };
  const gi = j6.give;
  const sub6 = gi ? `boy ${gi.index + 1}: ${gi.inHand ? "carrying" : gi.released ? "given" : "taking from the twist"}` : "";

  // Row 2
  const G2 = 1050;
  const SA = 0.56;
  const HA = 1.35;
  const small: Array<{ x: number; hs: number; props: Partial<StandingChildProps>; label: string }> = [
    { x: 1180, hs: HA, props: { pose: "hurtBack", poseStart: -300, teary: 0.6, sniffAt: [60, 150] }, label: "hurtBack" },
    { x: 1380, hs: 1.6, props: { pose: "hurtBack", poseStart: -300, teary: 0.6 }, label: "hurtBack" },
    { x: 1590, hs: 1.6, props: f < 30 ? { pose: "hurtBack", poseStart: -300, teary: 0.8 } : { pose: "wipeEye", poseStart: 30, prevPose: "hurtBack", prevPoseStart: -300, blendFrames: 8, teary: 0.6 }, label: "wipeEye" },
    { x: 1800, hs: HA, props: { pose: "holdOut", poseStart: -50 }, label: "holdOut" },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f4ead8, #e8d9bd)" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {[140, 440, 740, 1040, 1330].map((x) => (
          <Ground key={x} x={x + 20} y={G1} w={250} />
        ))}
        <Ground x={x6 + 40} y={G1} w={300} />
        <StandingChild {...p1} />
        <Marker p={hideW} label="hiding place" />
        <Marker p={fatherW} label="father's face" color="#2a4a8a" />
        <StandingChild {...p2} />
        <Marker p={fatherW3} label="father" color="#2a4a8a" />
        <StandingChild {...p3} />
        <StandingChild {...p4} />
        <StandingChild {...p5} />
        {/* giveOut: the three palms (QA stand-ins), lozenges already given */}
        {gives.map((k, i) => {
          const P = { x: x6 + k.at.x * S1, y: G1 + k.at.y * S1 };
          const given = gi && (i < gi.index || (i === gi.index && gi.released));
          return (
            <g key={i}>
              <ellipse cx={P.x + 4} cy={P.y + 4} rx={13} ry={5} fill="#b98a5e" opacity={0.85} />
              <Marker p={P} label={`${i + 1}`} color="#3c6a2a" />
              {given && <circle cx={P.x} cy={P.y - 1} r={3.6} fill={LOZ[i]} />}
            </g>
          );
        })}
        <StandingChild {...p6} />
        {DEBUG && (
          <g>
            <circle cx={j6.pinchNear.x} cy={j6.pinchNear.y} r={3} fill="#0040ff" />
            <circle cx={j6.handNear.x} cy={j6.handNear.y} r={3} fill="#ff0000" />
            <circle cx={j6.shoulderNear.x} cy={j6.shoulderNear.y} r={3} fill="#00a000" />
          </g>
        )}
        {gi && gi.inHand && gi.lozenge && <circle cx={gi.lozenge.x} cy={gi.lozenge.y} r={3.6} fill={LOZ[Math.max(0, gi.index)]} />}

        {/* Row 2: teary on the plate head */}
        {[0, 0.5, 1].map((tr, i) => (
          <ThakurHeadPlate
            key={tr}
            x={120 + i * 200}
            y={905}
            scale={2.2}
            age={6}
            state={plateFaceState({ f, lifeF: f + 31 * i, expression: "hurt", turn: 0.6, lookX: 0.2, lookY: 0.1, tear: tr })}
          />
        ))}
        <ThakurHeadPlate x={740} y={905} scale={2.2} age={6} state={plateFaceState({ f, lifeF: f + 90, expression: "hurt", turn: 0.6, lookX: 0.2 })} />
        <ThakurHeadPlate
          x={940}
          y={905}
          scale={2.2}
          age={6}
          state={plateFaceState({ f, lifeF: f + 140, expression: "forgiving", prevExpression: "hurt", expressionStart: 40, turn: 0.6, lookX: 0.2, tear: 0.3 })}
        />
        {/* adult scale (RIG-EP05-02) */}
        <line x1={1075} x2={1075} y1={G2} y2={G2 - (485 * SA) / 0.7} stroke="#8a6b4a" strokeWidth={6} opacity={0.35} />
        {small.map((m) => {
          const pr = { x: m.x, y: G2, s: SA, headScale: m.hs, f, lifeF: f + m.x, ...m.props } as StandingChildProps;
          const j = standingChildJoints(pr);
          const extra = m.props.pose === "holdOut" && j.note ? <NoteStandIn anchor={j.note.anchor} angle={j.note.angle} width={j.note.width} s={SA} /> : null;
          return (
            <g key={m.x}>
              <Ground x={m.x + 15} y={G2} w={180} />
              <circle cx={j.glowAnchor.x} cy={j.glowAnchor.y} r={60 * j.headScale} fill="none" stroke="#c9a040" strokeWidth={1.5} strokeDasharray="4 6" opacity={0.6} />
              <StandingChild {...pr} layerMid={extra} />
            </g>
          );
        })}
      </svg>
      <Label x={150} y={8} text="scolded > hurtBack" sub={sub1} />
      <Label x={450} y={8} text="glanceHideThenFather" sub={sub2} />
      <Label x={750} y={8} text="talk + headShake" sub={sub3} />
      <Label x={1060} y={8} text="wipeEye" sub={sub4} />
      <Label x={1360} y={8} text="holdOut" sub="note stand-in between the pinches" />
      <Label x={1680} y={8} text="giveOut" sub={sub6} />
      <Label x={320} y={690} text="teary 0 / 0.5 / 1" sub="expression hurt" w={600} />
      <Label x={740} y={690} text="hurt" w={200} />
      <Label x={940} y={690} text="forgiving" sub="from hurt at f 40" w={200} />
      <Label x={1490} y={690} text="next to adults" sub="s 0.56; headScale 1.35 / 1.6 / 1.6 / 1.35 (CHR-08 check); bar = adult height" w={760} />
      <div style={{ position: "absolute", right: 16, bottom: 6, fontFamily: BN_FONT, fontSize: 16, color: "#4a3324", opacity: 0.7 }}>StandingChild6 QA, frame {f}</div>
    </AbsoluteFill>
  );
};
