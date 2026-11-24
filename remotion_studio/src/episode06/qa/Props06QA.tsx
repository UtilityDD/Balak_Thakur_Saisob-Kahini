import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { Hand } from "../../cinematic/rig/Hand";
import { PLATE_COLORS } from "../../cinematic/rig/ThakurHeadPlate";
import { StandingChild, standingChildJoints, type StandingChildProps } from "../../episode05/rig/StandingChild";
import {
  BrassThali,
  CopperCoin,
  CopperCoins,
  FoldedShirt,
  GAMCHHA_HEAPS,
  Gamchha,
  KhadamPair,
  Lozenge,
  LozengeJar,
  Marble,
  MarbleHeap,
  PaperTwist,
  PROP_CM,
  PROP_REF,
  SilverCoin,
  Slate,
  StitchedBall,
  TenRupeeNote,
  Top,
  TwoAnnas,
  gamchhaSpot,
  khadamPairAnchors,
  lozengeJarAnchors,
  paperTwistAnchors,
  stitchedBallAnchors,
  tenRupeeNoteAnchors,
  type GamchhaProps,
  type LozengeColor,
  type Pt,
} from "../props/Ep06Props";

/**
 * Props06QA (Episode 6, 240 f): every prop of src/episode06/props/Ep06Props.tsx large and labelled (rows 1 to 3),
 * animated (the ball bounces and squashes, a marble rolls, the top spins, the gamchha's fringe stirs, the note bends
 * in both holds, the jar's lid lifts and closes, the paper twist fills), then the bottom strip: every prop at scene
 * scale s = 1 next to the standing child at s 0.56 (headScale 1.35), and the held props magnified 3x beside a shared
 * Hand stand-in of the same child's hand (L 28), with the two annas lying on its open palm. Red dots = anchors.
 */

const INK = "#3b2a1a";
const COL_W = 384;
const ROWS = [56, 296, 536];
const ROW_H = 232;

const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const Label: React.FC<{ x: number; y: number; t: string; size?: number; anchor?: "start" | "middle" | "end"; w?: number }> = ({
  x,
  y,
  t,
  size = 17,
  anchor = "start",
  w = 600,
}) => (
  <text x={x} y={y} fontSize={size} fill={INK} fontFamily={BN_FONT} fontWeight={w} textAnchor={anchor}>
    {t}
  </text>
);

const Cell: React.FC<{ col: number; row: number; span?: number; title: string }> = ({ col, row, span = 1, title }) => (
  <g>
    <rect x={col * COL_W + 6} y={ROWS[row]} width={span * COL_W - 12} height={ROW_H - 6} rx={10} fill="#fbf4e4" opacity={0.75} />
    <Label x={col * COL_W + 18} y={ROWS[row] + 22} t={title} />
  </g>
);

const Dot: React.FC<{ p: Pt; r?: number }> = ({ p, r = 3 }) => <circle cx={p.x} cy={p.y} r={r} fill="#e0242c" opacity={0.85} />;

/** The standing child's hand as drawn by the rig (shared Hand, L 50 x s 0.56, HAND_SX/SY), fingers along +y. */
const ChildHand: React.FC<{ x: number; y: number; rot?: number; shape?: "open" | "cup" | "relaxed"; k?: number }> = ({ x, y, rot = 0, shape = "open", k = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${1.06 * k} ${0.97 * k})`}>
    <Hand shape={shape} L={50 * PROP_REF.childS} skin={PLATE_COLORS.skin} shade={PLATE_COLORS.skinShade} side={1} view="palm" />
  </g>
);

export const Props06QA: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const lifeF = f;

  /* row 1 ------------------------------------------------------------ */
  const khadam = { x: 192, y: ROWS[0] + 150, s: 3.4 };
  const kA = khadamPairAnchors(khadam);
  // the bouncing ball
  const bt = (f % 40) / 40;
  const hgt = 70 * 4 * bt * (1 - bt);
  const ballSquash = hgt < 6 ? (1 - hgt / 6) * 0.9 : 0;
  const ball = { x: 1152 + 105, y: ROWS[0] + 210, s: 8, squash: ballSquash, spin: f * 7, air: hgt / (8 * PROP_CM) };
  const bA = stitchedBallAnchors(ball);
  const rollX = (f * 1.4) % 140;
  const rollSpin = ((rollX / (0.8 * PROP_CM * 8)) * 180) / Math.PI;

  /* row 2 ------------------------------------------------------------ */
  const gamRed: GamchhaProps = { x: 1152 + 200, y: ROWS[1] + 140, s: 1.6, check: "red", lifeF, yaw: -3 };
  const gamGreen: GamchhaProps = { x: 1152 + 572, y: ROWS[1] + 140, s: 1.6, check: "green", lifeF, yaw: 4, seed: 3 };
  const hs = GAMCHHA_HEAPS.map((h) => gamchhaSpot(gamRed, h.u, h.v));

  /* row 3 ------------------------------------------------------------ */
  const bend = 0.5 + 0.5 * Math.sin(f * 0.08);
  const hold: "both" | "one" = f < 120 ? "both" : "one";
  const held = hold === "both" ? { x: 565, y: ROWS[2] + 110 } : { x: 460, y: ROWS[2] + 90 };
  const heldProps = { ...held, s: 7, state: "held" as const, bend, hold };
  const nA = tenRupeeNoteAnchors(heldProps);
  const lidOpen = sstep(20, 80, f) * (1 - sstep(160, 220, f));
  const jar = { x: 1152 + 110, y: ROWS[2] + 222, s: 3.3, lidOpen };
  const jA = lozengeJarAnchors(jar);
  const twFill = sstep(10, 200, f);
  const tw = { x: 1536 + 285, y: ROWS[2] + 138, s: 5, fill: twFill, rot: 8 };
  const tA = paperTwistAnchors(tw);

  /* bottom strip ------------------------------------------------------ */
  const STRIP = 776;
  const GROUND = 1048;
  const child: StandingChildProps = { x: 70, y: GROUND, s: PROP_REF.childS, headScale: 1.35, f, lifeF, pose: "standIdle", age: 6 };
  const cj = standingChildJoints(child);
  const gamS: GamchhaProps = { x: 560, y: GROUND - 14, s: 1, check: "red", lifeF };
  const gs = (i: number) => gamchhaSpot(gamS, GAMCHHA_HEAPS[i].u, GAMCHHA_HEAPS[i].v);
  // magnified panel (3x): local scene px inside
  const MX = 1000;
  const MY = 790;
  const MK = 3;
  const mag = (lx: number, ly: number) => ({ x: MX + lx * MK, y: MY + ly * MK });

  return (
    <AbsoluteFill style={{ background: "#f2e6cf" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Label x={18} y={36} t="Props06QA: Episode 6 props (Ep06Props.tsx). Red dots = anchors. Bottom: scene scale s 1 = StandingChild s 0.56" size={22} w={700} />
        <Label x={1902} y={36} t={`f ${f}`} size={18} anchor="end" />

        {/* ---------------- row 1 ---------------- */}
        <Cell col={0} row={0} title="খড়ম KhadamPair (Ep 5 look), s 3.4" />
        <KhadamPair {...khadam} />
        <Dot p={kA.left.peg} />
        <Dot p={kA.right.peg} />
        <Dot p={kA.right.heel} />

        <Cell col={1} row={0} title="BrassThali x2 (empty, seed 0 / 1), s 2.4" />
        <BrassThali x={384 + 100} y={ROWS[0] + 140} s={2.4} seed={0} />
        <BrassThali x={384 + 282} y={ROWS[0] + 150} s={2.4} seed={1} />

        <Cell col={2} row={0} title="Slate: face-on | lying (tilt 0.38, yaw 12)" />
        <Slate x={768 + 92} y={ROWS[0] + 125} s={2.9} seed={0} />
        <Slate x={768 + 280} y={ROWS[0] + 105} s={2.4} tilt={0.38} yaw={12} seed={1} />
        <Slate x={768 + 285} y={ROWS[0] + 180} s={2.4} turnY={0.75} seed={2} />
        <Label x={768 + 330} y={ROWS[0] + 214} t="turnY 0.75" size={13} />

        <Cell col={3} row={0} title="StitchedBall: bounce + squash | squash 0.35" />
        <StitchedBall {...ball} />
        <Dot p={bA.gripL} r={2.5} />
        <Dot p={bA.gripR} r={2.5} />
        <StitchedBall x={1152 + 285} y={ROWS[0] + 210} s={8} squash={0.35} spin={-30} />

        <Cell col={4} row={0} title="Marbles: heap | singles | rolling" />
        <MarbleHeap x={1536 + 100} y={ROWS[0] + 160} s={10} count={8} />
        {[0, 1, 2, 3, 4].map((c) => (
          <Marble key={c} x={1536 + 218 + c * 32} y={ROWS[0] + 110} s={9} color={c} seed={c} />
        ))}
        <Marble x={1536 + 210 + rollX} y={ROWS[0] + 200} s={8} color={3} seed={2} spin={rollSpin} />

        {/* ---------------- row 2 ---------------- */}
        <Cell col={0} row={1} title="লাট্টু Top: wound, spinning | lying, string coiled" />
        <Top x={105} y={ROWS[1] + 200} s={9} spin={f * 40} />
        <Top x={300} y={ROWS[1] + 200} s={9} lying string="coiled" />

        <Cell col={1} row={1} title="CopperCoins (4) | one coin face-on" />
        <CopperCoins x={384 + 120} y={ROWS[1] + 150} s={12} count={4} />
        <CopperCoin x={384 + 292} y={ROWS[1] + 130} s={16} tilt={1} seed={2} />

        <Cell col={2} row={1} title="FoldedShirt (tilt 0.45, yaw -6), s 6" />
        <FoldedShirt x={768 + 192} y={ROWS[1] + 135} s={6} tilt={0.45} yaw={-6} />

        <Cell col={3} row={1} span={2} title="গামছা Gamchha red + small heaps | green (fringe stirs on lifeF), s 1.6" />
        <Gamchha {...gamRed} />
        <MarbleHeap x={hs[0].x} y={hs[0].y} s={1.6} count={6} />
        <Top x={hs[1].x} y={hs[1].y} s={1.6} lying string="coiled" />
        <CopperCoins x={hs[2].x} y={hs[2].y} s={1.6} count={3} />
        <FoldedShirt x={hs[3].x} y={hs[3].y} s={1.6} />
        <StitchedBall x={hs[4].x} y={hs[4].y} s={1.6} squash={0.3} />
        <MarbleHeap x={hs[5].x} y={hs[5].y} s={1.6} count={5} seed={4} />
        <Gamchha {...gamGreen} />

        {/* ---------------- row 3 ---------------- */}
        <Cell col={0} row={2} span={2} title={`TenRupeeNote: flat | folded in four (+ lying) | held, hold "${hold}", bend ${bend.toFixed(2)}`} />
        <TenRupeeNote x={132} y={ROWS[2] + 110} s={7} state="flat" />
        <TenRupeeNote x={330} y={ROWS[2] + 95} s={7} state="folded" rot={-6} />
        <TenRupeeNote x={330} y={ROWS[2] + 185} s={4.5} state="flat" tilt={0.38} yaw={10} />
        <TenRupeeNote {...heldProps} />
        <Dot p={nA.gripL} />
        <Dot p={nA.gripR} />

        <Cell col={2} row={2} title="TwoAnnas: single | pair | stacked; SilverCoin face-on" />
        <TwoAnnas x={768 + 62} y={ROWS[2] + 100} s={12} arrangement="single" />
        <TwoAnnas x={768 + 175} y={ROWS[2] + 100} s={12} arrangement="pair" />
        <TwoAnnas x={768 + 300} y={ROWS[2] + 100} s={12} arrangement="stacked" />
        <SilverCoin x={768 + 120} y={ROWS[2] + 175} s={18} tilt={1} />
        <TwoAnnas x={768 + 270} y={ROWS[2] + 180} s={12} arrangement="palm" />
        <Label x={768 + 270} y={ROWS[2] + 222} t='"palm" (tilt 0.62)' size={13} anchor="middle" />

        <Cell col={3} row={2} title={`LozengeJar: lidOpen ${lidOpen.toFixed(2)} | open, full`} />
        <LozengeJar {...jar} />
        <Dot p={jA.lidKnob} />
        <Dot p={jA.mouth} r={2.5} />
        <LozengeJar x={1152 + 270} y={ROWS[2] + 222} s={3.3} lidOpen={1} fill={1} seed={2} />

        <Cell col={4} row={2} title={`Lozenge x4 | ঠোঙা PaperTwist fill ${twFill.toFixed(2)}`} />
        {(["red", "yellow", "green", "white"] as LozengeColor[]).map((c, i) => (
          <Lozenge key={c} x={1536 + 50 + (i % 2) * 70} y={ROWS[2] + 85 + Math.floor(i / 2) * 70} s={14} color={c} spin={f * 2 + i * 40} />
        ))}
        <PaperTwist {...tw} />
        <Dot p={tA.grip} r={2.5} />
        <Dot p={tA.mouth} r={2.5} />

        {/* ---------------- bottom strip: scene scale ---------------- */}
        <rect x={6} y={STRIP} width={968} height={1074 - STRIP} rx={10} fill="#fbf4e4" opacity={0.75} />
        <rect x={6} y={GROUND - 40} width={968} height={1074 - GROUND + 40} fill="#b99d70" opacity={0.5} />
        <Label x={150} y={STRIP + 24} t="Scene scale: props at s 1 beside StandingChild s 0.56 (headScale 1.35)" />
        <StandingChild {...child} />
        <TenRupeeNote x={cj.handNear.x + 26} y={cj.handNear.y} s={1} state="folded" />
        <Lozenge x={cj.handNear.x + 44} y={cj.handNear.y} s={1} color="red" />
        <PaperTwist x={cj.handNear.x + 60} y={cj.handNear.y} s={1} fill={0.8} />
        <StitchedBall x={cj.handNear.x + 82} y={cj.handNear.y + 8} s={1} shadow={false} />
        <TenRupeeNote x={cj.handNear.x + 120} y={cj.handNear.y - 30} s={1} state="held" bend={0.4} />
        <KhadamPair x={215} y={GROUND + 6} s={1} />
        <BrassThali x={315} y={GROUND - 4} s={1} />
        <Slate x={400} y={GROUND} s={1} tilt={0.38} yaw={8} />
        <Gamchha {...gamS} />
        <MarbleHeap x={gs(0).x} y={gs(0).y} s={1} count={6} />
        <Top x={gs(1).x} y={gs(1).y} s={1} lying string="coiled" />
        <CopperCoins x={gs(2).x} y={gs(2).y} s={1} />
        <FoldedShirt x={gs(4).x} y={gs(4).y} s={1} />
        <LozengeJar x={720} y={GROUND} s={1} />
        <StitchedBall x={770} y={GROUND} s={1} />
        <Top x={800} y={GROUND} s={1} />
        <BrassThali x={870} y={GROUND} s={1} seed={1} />
        <TwoAnnas x={930} y={GROUND} s={1} />

        {/* ---------------- bottom strip: 3x magnified ---------------- */}
        <rect x={986} y={STRIP} width={928} height={1074 - STRIP} rx={10} fill="#fbf4e4" opacity={0.75} />
        <Label x={1000} y={STRIP + 24} t="3x: the child's hand (shared Hand, L 28 = 50 x 0.56) beside the held props at s 1" />
        <g transform={`translate(${MX} ${MY}) scale(${MK})`}>
          <ChildHand x={14} y={14} />
          <StitchedBall x={46} y={62} s={1} />
          <TenRupeeNote x={84} y={36} s={1} state="folded" />
          <TenRupeeNote x={128} y={34} s={1} state="held" bend={0.5} />
          <PaperTwist x={168} y={36} s={1} fill={0.9} />
          <Lozenge x={186} y={28} s={1} color="yellow" />
          <Lozenge x={192} y={34} s={1} color="white" />
          <Marble x={200} y={60} s={1} color={0} />
          <Top x={214} y={62} s={1} />
          <CopperCoin x={234} y={56} s={1} />
          <LozengeJar x={262} y={70} s={1} lidOpen={lidOpen} />
          {/* the two annas lying on the open palm (fingers up) */}
          <ChildHand x={290} y={84} rot={180} shape="cup" />
          <TwoAnnas x={290} y={84 - 0.24 * 28 * 0.97 - 2} s={1} arrangement="palm" />
        </g>
        {[
          { lx: 14, t: "hand" },
          { lx: 46, t: "ball" },
          { lx: 84, t: "note folded" },
          { lx: 128, t: "note held" },
          { lx: 168, t: "twist" },
          { lx: 190, t: "lozenges" },
          { lx: 207, t: "marble, top" },
          { lx: 238, t: "coin" },
          { lx: 262, t: "jar" },
          { lx: 286, t: "2 annas on palm" },
        ].map((l, i) => {
          const p = mag(l.lx, 86);
          return <Label key={l.t} x={p.x} y={p.y + (i % 2 ? 18 : 0)} t={l.t} size={13} anchor="middle" />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
