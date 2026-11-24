import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BN_FONT } from "../../cinematic/fonts";
import { CAST } from "../../cinematic/rig/cast";
import { Puppet, walkTravel, type WalkOpts } from "../../cinematic/rig/Puppet";
import { StandingChild } from "../../episode05/rig/StandingChild";
import {
  Crow,
  Goat,
  HenFamily,
  KOLSHI_CARRY_POSE,
  KOLSHI_PUPPET_PROPS,
  Kite,
  Kolshi,
  Sparrow,
  VILLAGE_LIFE_PX_PER_CM,
  kolshiWalkPose,
  sparrowBeakTip,
  type SparrowProps,
} from "../../cinematic/life/VillageLife";

/**
 * VillageLifeQA (Episode 6 re-cut, 240 frames): the village life pieces of src/cinematic/life/VillageLife.tsx.
 *  Row 1 (large):  hen + 5 chicks walking (10-120), pecking, scattering at 160 | crow on a fence: caws at 40 and 95,
 *                  glances, takes off at 170 (a caw in flight at 178) | sparrow: hops at 20 and 34, pecks the grain
 *                  (52, 60: eaten), a head tilt at 80, a hop back at 120, pecks, a flutter at 185.
 *  Row 2 (large):  goat tethered to a peg: chewing, ear flicks, bleats at 70 and 175, a graze dip 118-160 | kite: sway,
 *                  drift, tugs at 30, 95, 150, 205 | kolshi on the ground and a CAST adult (womanB) walking through with
 *                  it on her hip (20-115), then standing with it.
 *  Row 3 (scene scale, K = 0.8): StandingChild (s 0.51 K, head 1.45) beside the hen family, the crow on a fence rail at
 *                  1 m, the sparrow, the goat, the kolshi, womanB holding the kolshi, and a kite at sky scale (s 0.4).
 *  The labels are QA only.
 */

const W = 1920;
const H = 1080;
const K = 0.8; // scene-scale row: the adult Puppet scale at that depth

const Label: React.FC<{ x: number; y: number; text: string; sub?: string }> = ({ x, y, text, sub }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: BN_FONT, color: "#4a3324", lineHeight: 1.1 }}>
    <div style={{ fontSize: 24, fontWeight: 700 }}>{text}</div>
    {sub ? <div style={{ fontSize: 15, fontWeight: 500, opacity: 0.8 }}>{sub}</div> : null}
  </div>
);

type Box = { x: number; y: number; w: number; h: number };
const PANELS: Record<string, Box & { fill: string }> = {
  hen: { x: 8, y: 8, w: 744, h: 384, fill: "#efe2c6" },
  crow: { x: 760, y: 8, w: 480, h: 384, fill: "#e9e4d2" },
  sparrow: { x: 1248, y: 8, w: 664, h: 384, fill: "#efe2c6" },
  goat: { x: 8, y: 400, w: 600, h: 336, fill: "#e6e2c4" },
  kite: { x: 616, y: 400, w: 560, h: 336, fill: "url(#vlqa-sky)" },
  kolshi: { x: 1184, y: 400, w: 728, h: 336, fill: "#efe2c6" },
  scale: { x: 8, y: 744, w: 1904, h: 328, fill: "#f3ead6" },
};

const Ground: React.FC<{ b: Box; y: number }> = ({ b, y }) => (
  <g>
    <rect x={b.x} y={y} width={b.w} height={b.y + b.h - y} fill="#b99b6c" opacity={0.28} />
    <line x1={b.x} x2={b.x + b.w} y1={y} y2={y} stroke="#8a6a44" strokeWidth={1.5} opacity={0.4} />
  </g>
);

/** A bamboo fence post with a rail whose top edge is at railY (the crow's perch line). */
const Fence: React.FC<{ x0: number; x1: number; railY: number; groundY: number; s: number }> = ({ x0, x1, railY, groundY, s }) => {
  const k = VILLAGE_LIFE_PX_PER_CM * s;
  const posts = [x0 + 6 * k, x1 - 6 * k];
  return (
    <g>
      {posts.map((px, i) => (
        <g key={i}>
          <rect x={px - 2.6 * k} y={railY - 12 * k} width={5.2 * k} height={groundY - railY + 12 * k} fill="#a08454" />
          <rect x={px - 2.6 * k} y={railY - 12 * k} width={1.6 * k} height={groundY - railY + 12 * k} fill="#c8ad78" opacity={0.6} />
        </g>
      ))}
      <rect x={x0} y={railY} width={x1 - x0} height={3.6 * k} rx={1.8 * k} fill="#9a7c4c" />
      <rect x={x0} y={railY} width={x1 - x0} height={1.1 * k} rx={0.6 * k} fill="#d2b880" opacity={0.7} />
      <rect x={x0} y={railY + 30 * k} width={x1 - x0} height={3.2 * k} rx={1.6 * k} fill="#8e7046" />
    </g>
  );
};

export const VillageLifeQA: React.FC = () => {
  const f = useCurrentFrame();

  // row 1: hen family
  const HEN_Y = 362;
  const henPath = [
    { f: 10, x: 110, y: HEN_Y },
    { f: 120, x: 470, y: HEN_Y, ease: "inOut" as const },
  ];

  // row 1: crow on the fence
  const CROW_RAIL = 300;

  // row 1: sparrow (the grain lies where the first peck lands)
  const SP_Y = 356;
  const sparrowP: SparrowProps = {
    x: 1360,
    y: SP_Y,
    s: 6,
    lifeF: f,
    seed: 4,
    hopAt: [20, 34, 120],
    hopLen: [6, 6, -8],
    peckAt: [52, 60, 140, 147],
    tiltAt: [80],
    flutterAt: [185],
    eatAt: 60,
  };
  const grainX = sparrowBeakTip({ ...sparrowP, lifeF: 54 }).x;

  // row 2: goat
  const GOAT_Y = 702;
  const graze = (() => {
    const a = Math.min(1, Math.max(0, (f - 118) / 14));
    const b = Math.min(1, Math.max(0, (f - 146) / 14));
    const e = (t: number) => t * t * (3 - 2 * t);
    return e(a) * (1 - e(b));
  })();

  // row 2: woman with the kolshi walking through
  const WOMAN = CAST.womanB;
  const WS = 0.72;
  const WALK: WalkOpts = { start: 20, dur: 95, fromX: 0, toX: 470, scale: WS, height: WOMAN.height, seed: WOMAN.seed };
  const wx = 1330 + walkTravel(f, WALK).bodyX;

  // row 3: scene scale
  const LINE = 1058;
  const ks = VILLAGE_LIFE_PX_PER_CM * K;

  return (
    <AbsoluteFill style={{ background: "#d9ccb0" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="vlqa-sky" x1={0} y1={0} x2={0} y2={1}>
            <stop offset={0} stopColor="#9cc4e4" />
            <stop offset={1} stopColor="#e8eef0" />
          </linearGradient>
          {Object.entries(PANELS).map(([k, b]) => (
            <clipPath key={k} id={`vlqa-${k}`}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} />
            </clipPath>
          ))}
        </defs>
        {Object.entries(PANELS).map(([k, b]) => (
          <rect key={k} x={b.x} y={b.y} width={b.w} height={b.h} rx={10} fill={b.fill} />
        ))}

        {/* ---------------- row 1 ---------------- */}
        <g clipPath="url(#vlqa-hen)">
          <Ground b={PANELS.hen} y={HEN_Y} />
          <HenFamily x={110} y={HEN_Y} s={2} lifeF={f} seed={3} path={henPath} chicks={5} scatterAt={160} scatterDir={1} />
        </g>
        <g clipPath="url(#vlqa-crow)">
          <Ground b={PANELS.crow} y={362} />
          <Fence x0={770} x1={1230} railY={CROW_RAIL} groundY={362} s={1.4} />
          <Crow x={900} y={CROW_RAIL} s={2.6} lifeF={f} seed={9} cawAt={[40, 95, 178]} takeOffAt={170} takeOffDir={1} />
        </g>
        <g clipPath="url(#vlqa-sparrow)">
          <Ground b={PANELS.sparrow} y={SP_Y} />
          <Sparrow {...sparrowP} grain={{ x: grainX }} />
        </g>

        {/* ---------------- row 2 ---------------- */}
        <g clipPath="url(#vlqa-goat)">
          <Ground b={PANELS.goat} y={GOAT_Y - 20} />
          <Goat x={250} y={GOAT_Y} s={1.5} lifeF={f} seed={17} bleatAt={[70, 175]} graze={graze} peg={{ x: 520, y: GOAT_Y + 18 }} />
        </g>
        <g clipPath="url(#vlqa-kite)">
          <Kite x={900} y={565} s={1.5} lifeF={f} seed={31} tugAt={[30, 95, 150, 205]} autoTug={false} stringTo={{ x: 700, y: 1300 }} />
        </g>
        <g clipPath="url(#vlqa-kolshi)">
          <Ground b={PANELS.kolshi} y={716} />
          <Kolshi x={1262} y={716} s={2.4} />
          <Puppet cast={WOMAN} f={f} lifeF={f} x={wx} y={716} scale={WS} props={KOLSHI_PUPPET_PROPS} acting={(fr) => kolshiWalkPose(fr, WALK)} />
        </g>

        {/* ---------------- row 3: scene scale beside the standing child ---------------- */}
        <g clipPath="url(#vlqa-scale)">
          <Ground b={PANELS.scale} y={LINE} />
          <StandingChild x={90} y={LINE} s={0.51 * K} headScale={1.45} f={f} lifeF={f} pose="standQuiet" />
          <HenFamily x={300} y={LINE} s={K} lifeF={f} seed={11} variant={1} chicks={4} />
          <Fence x0={470} x1={680} railY={LINE - 100 * ks} groundY={LINE} s={K} />
          <Crow x={590} y={LINE - 100 * ks} s={K} lifeF={f} seed={5} cawAt={[60, 150]} />
          <StandingChild x={780} y={LINE} s={0.51 * K} headScale={1.45} f={f} lifeF={f + 40} pose="standQuiet" flip />
          <Sparrow x={850} y={LINE} s={K} lifeF={f} seed={8} />
          <Goat x={1020} y={LINE} s={K} lifeF={f} seed={23} bleatAt={[120]} peg={{ x: 1130, y: LINE + 4 }} />
          <StandingChild x={1240} y={LINE} s={0.51 * K} headScale={1.45} f={f} lifeF={f + 80} pose="standQuiet" />
          <Kolshi x={1320} y={LINE} s={K} />
          <Puppet cast={WOMAN} f={f} lifeF={f} x={1470} y={LINE} scale={K} props={KOLSHI_PUPPET_PROPS} acting={() => ({ bodyTurn: 0.85, ...KOLSHI_CARRY_POSE })} />
          <Kite x={1760} y={880} s={0.4} lifeF={f} seed={12} stringTo={{ x: 1640, y: 1200 }} />
        </g>
      </svg>

      <Label x={24} y={16} text="Hen + chicks (মুরগি, ছানা)  s 2" sub="walk 10-120 (head bob), pecks, clucks; scatterAt 160 (flap and run)" />
      <Label x={776} y={16} text="Crow (কাক)  s 2.6" sub="caws 40, 95; glances; takeOffAt 170, caw in flight 178" />
      <Label x={1264} y={16} text="Sparrow (চড়ুই)  s 6" sub="hops 20, 34; pecks the grain 52, 60; tilt 80; hop back 120; flutter 185" />
      <Label x={24} y={408} text="Goat (ছাগল), tethered  s 1.5" sub="chewing, ear flicks; bleats 70, 175; graze 118-160" />
      <Label x={632} y={408} text="Kite (ঘুড়ি)  s 1.5" sub="sway, drift; tugs 30, 95, 150, 205; string out of frame" />
      <Label x={1200} y={408} text="Kolshi (কলসি)  s 2.4 + womanB carrying" sub="kolshiWalkPose 20-115, then standing (KOLSHI_CARRY_POSE)" />
      <Label x={24} y={752} text={`Scene scale, K ${K}: StandingChild s ${(0.51 * K).toFixed(3)} (head 1.45); animals s = K; fence rail 1 m; kite s 0.4`} />
      <div style={{ position: "absolute", right: 22, top: 752, fontFamily: BN_FONT, fontSize: 22, fontWeight: 700, color: "#4a3324" }}>f {f}</div>
    </AbsoluteFill>
  );
};
