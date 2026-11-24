import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, track } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { UjancharCowLayer } from "../../cinematic/sets/UjancharHouse";
import {
  COW_LEGS,
  CowAction,
  CowPathKey,
  GentleCow,
  GentleCowProps,
  cowGaitHistory,
  solveGentleCow,
} from "../../cinematic/animals/GentleCow";

/**
 * CowQA: Episode 5's gentle cow (src/cinematic/animals/GentleCow.tsx), 240 frames.
 *  Row 1: walk cycle (4-beat lateral) | trot cycle (diagonal pairs), camera following, ground ticks every 40 px so a
 *         planted hoof can be seen not to slide; dots under the hooves (filled = planted); footfall diagrams of the last
 *         60 frames (rows NH NF FH FF) | the Episode 2 Ujanchar cow layer (top) beside this rig at rest (bottom).
 *  Row 2: graze and tear at a placeholder trellis (tugs at 80, 120, 160; cucumber from 172) | alarm at 40, then trot
 *         off turning to three-quarter away | hidden idle behind placeholder banana trunks | walk in and muzzle lowered
 *         to a placeholder palm (nuzzle at 64: slow blink at 82, breath out at 96), exported points marked.
 */

const BG = "#d8ccb2";
const PANEL = "#e6dcc6";
const GROUND = "#b9a582";
const INK = "#3b2c20";

const Label: React.FC<{ x: number; y: number; t: string; size?: number; col?: string }> = ({ x, y, t, size = 22, col = INK }) => (
  <text x={x} y={y} fontFamily={BN_FONT} fontSize={size} fontWeight={600} fill={col}>
    {t}
  </text>
);

const Panel: React.FC<{ id: string; x: number; y: number; w: number; h: number; ground: number; title: string; children: React.ReactNode }> = ({
  id,
  x,
  y,
  w,
  h,
  ground,
  title,
  children,
}) => (
  <g>
    <defs>
      <clipPath id={`cowqa-${id}`}>
        <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={10} />
      </clipPath>
    </defs>
    <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={10} fill={PANEL} />
    <g clipPath={`url(#cowqa-${id})`}>
      <rect x={x} y={ground} width={w} height={y + h - ground} fill={GROUND} />
      {children}
    </g>
    <Label x={x + 18} y={y + 34} t={title} />
  </g>
);

/** Hoof contact dots (filled = planted) for a solve. */
const HoofDots: React.FC<{ p: GentleCowProps }> = ({ p }) => {
  const s = solveGentleCow(p);
  const cols = ["#2f6fb0", "#c0392b", "#7fb2e0", "#f0a090"];
  return (
    <g>
      {s.hooves.map((h, i) => (
        <circle
          key={i}
          cx={h.x}
          cy={h.y + 8}
          r={5}
          fill={s.contacts[i] ? cols[i] : "none"}
          stroke={cols[i]}
          strokeWidth={2}
        />
      ))}
    </g>
  );
};

const Footfalls: React.FC<{ x: number; y: number; path: CowPathKey[]; s: number; f: number }> = ({ x, y, path, s, f }) => {
  const rows = cowGaitHistory(path, s, f, 60);
  const cols = ["#2f6fb0", "#c0392b", "#7fb2e0", "#f0a090"];
  const names = ["NH", "NF", "FH", "FF"];
  return (
    <g>
      {COW_LEGS.map((_, li) => (
        <g key={li}>
          <text x={x} y={y + li * 15 + 11} fontFamily={BN_FONT} fontSize={12} fill={INK}>
            {names[li]}
          </text>
          {rows.map((r, k) => (
            <rect key={k} x={x + 28 + k * 9} y={y + li * 15} width={8} height={12} fill={r.contacts[li] ? cols[li] : "#00000012"} />
          ))}
        </g>
      ))}
    </g>
  );
};

/** A follow-cam locomotion panel. */
const GaitPanel: React.FC<{ id: string; x: number; title: string; speed: number; f: number }> = ({ id, x, title, speed, f }) => {
  const s = 0.78;
  const ground = 330;
  const path: CowPathKey[] = [
    { f: -60, x: 0, y: ground, s },
    { f: 240, x: speed * s * 300, y: ground, s, ease: "linear" },
  ];
  const p: GentleCowProps = { f, lifeF: f, s, path, action: speed > 9 ? "trot" : "walk", gait: "auto" };
  const sol = solveGentleCow(p);
  const camX = x + 330 - sol.x;
  const ticks: number[] = [];
  const t0 = Math.floor((sol.x - 400) / 40) * 40;
  for (let t = t0; t < sol.x + 400; t += 40) ticks.push(t);
  return (
    <Panel id={id} x={x} y={0} w={720} h={440} ground={ground} title={title}>
      <g transform={`translate(${camX.toFixed(2)} 0)`}>
        {ticks.map((t) => (
          <rect key={t} x={t - 1} y={ground} width={2} height={t % 200 === 0 ? 14 : 8} fill={INK} opacity={0.5} />
        ))}
        <GentleCow {...p} />
        <HoofDots p={p} />
      </g>
      <Footfalls x={x + 40} y={360} path={path} s={s} f={f} />
      <Label x={x + 600} y={420} size={14} t={`${(sol.speed * s).toFixed(1)} px/f  gait ${sol.gait.toFixed(2)}`} />
    </Panel>
  );
};

export const CowQA: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const R2 = 440;
  const G2 = 1000;
  const S2 = 0.6;

  // graze and tear
  const gx = 0;
  const grazeTarget = { x: gx + 182 + 150, y: G2 - 62 };
  const tugs = [80, 120, 160];
  const grazeAct: CowAction = f < 24 ? "idle" : "graze";
  const grazeP: GentleCowProps = {
    x: gx + 182,
    y: G2,
    s: S2,
    f,
    lifeF: f,
    action: grazeAct,
    actionStart: f < 24 ? 0 : 24,
    prevAction: f < 24 ? undefined : "idle",
    target: grazeTarget,
    tugs,
    cucumber: clamp((f - 172) / 4),
  };
  const grazeSol = solveGentleCow(grazeP);
  const vineAnchor = { x: gx + 420, y: G2 - 86 };
  const holding = f >= 40 && f < 172;

  // alarm, turn, trot off
  const ax = 480;
  const alarmAct: CowAction = f < 40 ? "idle" : f < 80 ? "alarm" : "trot";
  const alarmP: GentleCowProps = {
    s: S2,
    f,
    lifeF: f,
    action: alarmAct,
    actionStart: f < 40 ? 0 : f < 80 ? 40 : 80,
    prevAction: f < 40 ? undefined : f < 80 ? "idle" : "alarm",
    prevActionStart: f < 80 ? 0 : 40,
    path: [
      { f: 80, x: ax + 130, y: G2, s: S2 },
      { f: 210, x: ax + 400, y: G2 - 90, s: 0.45, ease: "in" },
    ],
    turn: track(f, [
      [80, 0],
      [130, 1, "inOut"],
    ]),
  };
  const alarmSol = solveGentleCow(alarmP);

  // hidden idle
  const hx = 960;
  const hiddenP: GentleCowProps = { x: hx + 240, y: G2, s: S2, f, lifeF: f, action: "hidden", actionStart: 0, seed: 11 };

  // come to Balak: walk in, lower the muzzle to the palm
  const nx = 1440;
  const palm = { x: nx + 175, y: G2 - 62 };
  const nAct: CowAction = f < 64 ? "walk" : "nuzzle";
  const nuzzleP: GentleCowProps = {
    s: S2,
    flip: true,
    f,
    lifeF: f,
    action: nAct,
    actionStart: f < 64 ? -20 : 64,
    prevAction: f < 64 ? undefined : "walk",
    path: [
      { f: 0, x: nx + 560, y: G2, s: S2 },
      { f: 62, x: nx + 330, y: G2, s: S2, ease: "out" },
    ],
    target: palm,
  };
  const nSol = solveGentleCow(nuzzleP);

  const mark = (p: { x: number; y: number }, col: string, key: string) => (
    <g key={key}>
      <circle cx={p.x} cy={p.y} r={4} fill="none" stroke={col} strokeWidth={2} />
      <line x1={p.x - 8} y1={p.y} x2={p.x + 8} y2={p.y} stroke={col} strokeWidth={1} />
      <line x1={p.x} y1={p.y - 8} x2={p.x} y2={p.y + 8} stroke={col} strokeWidth={1} />
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <GaitPanel id="walk" x={0} title="Walk: four-beat lateral (5 u/f)" speed={5} f={f} />
        <GaitPanel id="trot" x={720} title="Trot: diagonal pairs (13 u/f)" speed={13} f={f} />
        <Panel id="cmp" x={1440} y={0} w={480} h={440} ground={400} title="Episode 2 cow (top) / GentleCow (bottom)">
          <rect x={1440} y={190} width={480} height={4} fill={GROUND} />
          <GentleCow x={1680} y={400} s={0.5} f={f} lifeF={f} action="idle" chew={false} />
        </Panel>

        <Panel id="graze" x={gx} y={R2} w={480} h={640} ground={G2} title="Graze and tear (tugs 80/120/160)">
          {/* placeholder trellis: two bamboo posts and a waist-high rail */}
          <rect x={gx + 330} y={G2 - 100} width={7} height={100} fill="#8f7a4a" />
          <rect x={gx + 446} y={G2 - 100} width={7} height={100} fill="#8f7a4a" />
          <rect x={gx + 320} y={G2 - 104} width={150} height={6} fill="#a38c55" />
          <path d={`M ${gx + 330} ${G2 - 100} q 40 -18 70 -6 q 30 10 70 -4`} stroke="#4f7a2c" strokeWidth={5} fill="none" />
          {holding && (
            <path
              d={`M ${vineAnchor.x} ${vineAnchor.y} Q ${(vineAnchor.x + grazeSol.mouth.x) / 2} ${Math.max(vineAnchor.y, grazeSol.mouth.y) + 14} ${grazeSol.mouth.x} ${grazeSol.mouth.y}`}
              stroke="#4f7a2c"
              strokeWidth={4}
              fill="none"
            />
          )}
          <GentleCow {...grazeP} />
          {mark(grazeTarget, "#c0392b", "gt")}
          <Label x={gx + 18} y={R2 + 60} size={16} t={`action ${grazeAct}  tug ${grazeSol.tug.toFixed(2)}  reach err ${grazeSol.reachError.toFixed(1)}`} />
        </Panel>

        <Panel id="alarm" x={ax} y={R2} w={480} h={640} ground={G2} title="Alarm (40), turn and trot off (80)">
          <GentleCow {...alarmP} />
          <HoofDots p={alarmP} />
          <Label x={ax + 18} y={R2 + 60} size={16} t={`action ${alarmAct}  gait ${alarmSol.gait.toFixed(2)}  ${(alarmSol.speed * alarmSol.s).toFixed(1)} px/f`} />
        </Panel>

        <Panel id="hidden" x={hx} y={R2} w={480} h={640} ground={G2} title="Hidden idle: ear and tail between trunks">
          <GentleCow {...hiddenP} />
          {/* placeholder banana trunks */}
          <rect x={hx + 176} y={R2 + 120} width={126} height={G2 - R2 - 110} fill="#7e8a4c" />
          <rect x={hx + 196} y={R2 + 120} width={30} height={G2 - R2 - 110} fill="#9aa865" opacity={0.6} />
          <rect x={hx + 346} y={R2 + 120} width={92} height={G2 - R2 - 110} fill="#748143" />
          <rect x={hx + 360} y={R2 + 120} width={22} height={G2 - R2 - 110} fill="#96a462" opacity={0.6} />
        </Panel>

        <Panel id="nuzzle" x={nx} y={R2} w={480} h={640} ground={G2} title="Come to Balak: muzzle to palm (64)">
          {/* placeholder seated child and raised palm */}
          <ellipse cx={nx + 110} cy={G2 - 8} rx={60} ry={16} fill="#9c8f80" />
          <rect x={nx + 88} y={G2 - 110} width={44} height={100} rx={20} fill="#9c8f80" />
          <circle cx={nx + 110} cy={G2 - 136} r={26} fill="#9c8f80" />
          <path d={`M ${nx + 128} ${G2 - 86} L ${palm.x - 6} ${palm.y + 6}`} stroke="#9c8f80" strokeWidth={12} strokeLinecap="round" />
          <ellipse cx={palm.x} cy={palm.y} rx={9} ry={6} fill="#d9a684" />
          <GentleCow {...nuzzleP} />
          {mark(nSol.muzzle, "#c0392b", "mz")}
          {mark(nSol.forehead, "#2f6fb0", "fh")}
          {mark(nSol.neck, "#2e8b57", "nk")}
          <Label x={nx + 18} y={R2 + 60} size={16} t={`action ${nAct}  reach err ${nSol.reachError.toFixed(1)}  (red muzzle, blue forehead, green neck)`} />
        </Panel>
      </svg>
      {/* the Episode 2 cow itself (UjancharCowLayer, idle), above the rig in the comparison panel */}
      <UjancharCowLayer f={f} calm={0} cow={{ x: 1680, y: 190, s: 0.5, flip: false }} />
    </AbsoluteFill>
  );
};
