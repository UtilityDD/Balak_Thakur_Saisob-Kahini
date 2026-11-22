import React from "react";
import { staticFile } from "remotion";
import { clamp, hash, makeActing, noise1, PoseKey, track } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { Flame, Glow, GlowDefs } from "../../../cinematic/fx/Fx";
import { MouthState } from "../../../cinematic/rig/lipsync";
import { BASE_POSE, CastMember, Lighting, Pose, PropRenderer, Puppet } from "../../../cinematic/rig/Puppet";
import { Birds } from "../../../cinematic/sets/S01_DaySets";
import {
  S01_LATA,
  S01_MINA,
  S01_REKHA,
  S01_SARALA,
  S01_TUNI,
  VEDIC_COURTYARD,
} from "../../../episode03/scenes/Scene01SharadFlowerGathering";
import { EP03_SCENES } from "../../../episode03/timing";
import { cueLocalStory3, pausesFor3, storyToReal, useStory3 } from "../../../episode/storyClock";
import {
  ContactShadow,
  GhibliAtmosphericHaze,
  GhibliCharFilterDefs,
  GhibliCourtyardShadows,
  GhibliCutout,
  GhibliFallenShiuli,
  GhibliFlowerKind,
  GhibliForegroundBokeh,
  GhibliGrade,
  GhibliInkBloom,
  GhibliJabaBlossom,
  GhibliJhumkoBell,
  GhibliLayer,
  GhibliPreload,
  GhibliSketchedLeaf,
  GhibliStage,
} from "../../GhibliStage";
import { GHIBLI_ANCHORS } from "../plateAnchors";

/**
 * Episode 3 (Ghibli Sketch Test) · Scene 01 "Sharad dawn flower gathering".
 * Preserves 100% of the character rigs, poses, two-bone arm IK, camera choreography, story clock,
 * and flower pickups from Scene01SharadFlowerGathering.tsx while replacing the pure-SVG sets with
 * hand-drawn Ghibli watercolor + sepia-ink sketch layers.
 */

const S01 = "01_sharad_flower_gathering";
const SCENE = EP03_SCENES.find((s) => s.sceneId === S01)!;
const DUR = SCENE.durationFrames;
const PZ = pausesFor3(S01);

const PRELOAD = [
  "images/ghibli_ep03/sky_sharad_dawn.png",
  "images/ghibli_ep03/far_trees_sketch.png",
  "images/ghibli_ep03/courtyard_back_sketch.png",
  "images/ghibli_ep03/courtyard_floor_sketch.png",
  "images/ghibli_ep03/tree_shiuli_sketch.png",
  "images/ghibli_ep03/tree_jhumko_sketch.png",
  "images/ghibli_ep03/tree_jaba_sketch.png",
  "images/ghibli_ep03/tulsi_mancha_sketch.png",
  "images/ghibli_ep03/prop_ground_saji_a.png",
  "images/ghibli_ep03/prop_ground_saji_b.png",
  "images/ghibli_ep03/watercolor_paper_grain.png",
] as const;

const lineReal = (snippet: string, fallback: number) => {
  const c = cueLocalStory3(snippet, S01);
  return c ? storyToReal(c.from + 1, PZ) - 1 : fallback;
};
const VOICE_LAG = { l1: 7, l2: 11, l3: 17, l4: 9 };
const pauseWin = (i: number, fbStart: number, fbLen: number) => {
  const p = PZ[i];
  const start = p ? storyToReal(p.atStory, PZ) : fbStart;
  return { start, end: start + (p ? p.frames : fbLen) };
};

const T = {
  l1: lineReal("শরতের", 0) + VOICE_LAG.l1,
  l2: lineReal("শিউলি", 91) + VOICE_LAG.l2,
  l3: lineReal("বাড়ির মেয়েরা", 247) + VOICE_LAG.l3,
  l4: lineReal("জবা আর", 335) + VOICE_LAG.l4,
  p1: pauseWin(0, 55, 36),
  p2: pauseWin(1, 223, 24),
  p3: pauseWin(2, 423, 36),
};

type Pt = { x: number; y: number };
const mod = (a: number, m: number) => ((a % m) + m) % m;
const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);
const DEG = Math.PI / 180;

const alive = (act: (f: number) => Pose, seed: number): ((f: number) => Pose) => {
  return (f: number) => {
    const p = act(f);
    const n = (k: number, s: number) => noise1(f * k, seed * 7 + s);
    // Gentle organic chest breathing + weight shift carrier
    const breath = Math.sin(f * 0.055 + seed * 1.7);
    return {
      ...p,
      bodyX: p.bodyX + n(0.023, 1) * 1.25 + Math.sin(f * 0.028 + seed) * 0.65,
      bodyY: p.bodyY + breath * 0.85,
      lean: p.lean + n(0.017, 2) * 0.75 + breath * 0.35,
      headTurn: p.headTurn + n(0.011, 3) * 0.045,
      headTilt: p.headTilt + n(0.013, 4) * 1.15,
      headNod: p.headNod + breath * 0.65,
      rS: p.rS + n(0.031, 5) * 0.9,
      lS: p.lS + n(0.029, 6) * 0.9,
    };
  };
};

const LIGHT: Lighting = { keySide: 1, rim: "#ffc786", rimStrength: 0.42 };

const SPOTS: Array<[number, number]> = [
  [-16, -12],
  [-4, -18],
  [10, -14],
  [20, -7],
  [-22, -5],
  [2, -7],
  [14, -2],
  [-9, -3],
  [-1, -24],
  [-12, -20],
  [8, -22],
];
const MIX_JABA: GhibliFlowerKind[] = ["jaba", "jaba", "shiuli"];
const MIX_JHUMKO: GhibliFlowerKind[] = ["jhumko", "jhumko", "jaba"];
const MIX_MIXED: GhibliFlowerKind[] = ["jaba", "jhumko", "shiuli"];

const SajiBody: React.FC<{ level: number; mix: GhibliFlowerKind[] }> = ({ level, mix }) => {
  const n = Math.round(clamp(level) * SPOTS.length);
  return (
    <>
      <path d="M -24 17 Q 0 -17 24 17" stroke="#5a3a1e" strokeWidth={3} fill="none" />
      <path d="M -26 19 Q -28 43 0 46 Q 28 43 26 19 Z" fill="#b8844a" stroke="#4a2e18" strokeWidth={1.1} />
      {[27, 34, 41].map((y) => (
        <path key={y} d={`M ${-25 + (y - 19) * 0.05} ${y} Q 0 ${y + 6} ${25 - (y - 19) * 0.05} ${y}`} stroke="#684321" strokeWidth={1.2} fill="none" opacity={0.65} />
      ))}
      <ellipse cx={0} cy={19} rx={26} ry={5.5} fill="#d6a867" stroke="#5a3a1e" strokeWidth={1.1} />
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = SPOTS[i];
        return <GhibliInkBloom key={i} x={x} y={19 + y * 0.6} r={6.5} kind={mix[i % mix.length]} rot={i * 23} />;
      })}
    </>
  );
};

const basketProp =
  (fill: (f: number) => number, mix: GhibliFlowerKind[]): PropRenderer =>
  ({ f, scale, worldRot }) => (
    <g transform={`rotate(${-worldRot}) scale(${scale * 0.9})`}>
      <SajiBody level={fill(f)} mix={mix} />
    </g>
  );

const Sprig: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale * 0.9}) translate(0, -18)`}>
    <path d="M 0 0 Q 6 -18 12 -34" stroke="#8c481c" strokeWidth={2} fill="none" strokeLinecap="round" />
    <GhibliInkBloom x={12} y={-34} r={7} kind="shiuli" />
    <GhibliInkBloom x={-2} y={-22} r={5.5} kind="shiuli" rot={30} />
    <GhibliInkBloom x={24} y={-22} r={5.5} kind="shiuli" rot={-20} />
  </g>
);

const heldFlower =
  (kind: GhibliFlowerKind): PropRenderer =>
  ({ scale }) => (
    <g transform={`scale(${scale * 0.9})`}>
      {kind === "jhumko" ? <GhibliJhumkoBell x={0} y={-2} s={1.05} rot={10} /> : <GhibliInkBloom x={0} y={6} r={kind === "jaba" ? 10 : 7.5} kind={kind} rot={20} />}
    </g>
  );

const LooseHair: React.FC<{ cast: CastMember; acting: (f: number) => Pose; f: number; lifeF: number; x: number; y: number; scale: number }> = ({
  cast,
  acting,
  f,
  lifeF,
  x,
  y,
  scale,
}) => {
  const p = acting(f);
  const h = cast.height;
  const R = 41 * Math.sqrt(h);
  const hipY = -162.7 * h;
  const shY = hipY - 108 * h;
  const headY = shY - 11 * h - R * 0.86;
  const back = -Math.sign(p.bodyTurn || 0.001) * clamp(Math.abs(p.bodyTurn) / 0.5) * R * 0.32;
  const sw = 47 * h;
  const endY = shY + 108 * h * 0.62;
  const sway = 3 * noise1(lifeF * 0.03, cast.seed) + 2 * Math.sin(lifeF * 0.05 + cast.seed);
  const xb = back;
  const d = `M ${xb - R * 0.98} ${headY - R * 0.2}
    Q ${xb - R * 1.08} ${headY + R * 0.9} ${xb - sw * 0.78} ${shY + 10}
    Q ${xb - sw * 0.84 + sway * 0.5} ${shY + (endY - shY) * 0.55} ${xb - sw * 0.6 + sway} ${endY}
    Q ${xb + sway} ${endY + 12} ${xb + sw * 0.6 + sway} ${endY - 4}
    Q ${xb + sw * 0.82 + sway * 0.5} ${shY + (endY - shY) * 0.5} ${xb + sw * 0.76} ${shY + 8}
    Q ${xb + R * 1.08} ${headY + R * 0.9} ${xb + R * 0.98} ${headY - R * 0.2}
    Q ${xb} ${headY - R * 1.25} ${xb - R * 0.98} ${headY - R * 0.2} Z`;
  return (
    <g transform={`translate(${x + p.bodyX}, ${y + p.bodyY}) scale(${scale}) rotate(${p.lean}, 0, ${hipY})`}>
      <path d={d} fill={cast.hair} />
      {[-0.5, -0.15, 0.2, 0.5].map((k, i) => (
        <path
          key={i}
          d={`M ${xb + k * R * 1.4} ${headY + R * 0.4} Q ${xb + k * sw * 1.3 + sway * 0.3} ${shY + 20} ${xb + k * sw * 1.05 + sway * 0.8} ${endY - 6}`}
          stroke={cast.hairLight}
          strokeWidth={1.6}
          fill="none"
          opacity={0.55}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

const FIG_SCALE = 1.18;
const BACK_SCALE = 1.14;
const BEHIND_TREE_SCALE = 0.96;
const SHIULI_TREE = VEDIC_COURTYARD.shiuli;
const POS = {
  sarala: { x: 1230, y: 934 },
  lata: { x: 1562, y: 930 },
  mina: { x: 1350, y: 982 },
  tuni: { x: 470, y: 978 },
  rekha: { x: 800, y: 980 },
  champa: { x: 646, y: 842 },
};

/** Champa: a young girl of the house gathering blossoms on the far side behind the Jhumko/Shiuli trees for deep multiplane staging. */
const S01_CHAMPA: CastMember = {
  id: "champa",
  age: "adult",
  sex: "f",
  height: 0.91,
  girth: 0.92,
  skin: "#cfa078",
  skinLight: "#eac09a",
  skinShade: "#a67550",
  lips: "#a45850",
  hair: "#1e1513",
  hairLight: "#4c382f",
  hairStyle: "parted",
  outfit: "blouse",
  top: "#c87d28",
  topLight: "#e29b46",
  topShade: "#945714",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#f3e8d2",
  lowerShade: "#cfc2a8",
  lowerTrim: "#c87d28",
  scarf: { color: "#f3e8d2", shade: "#cfc2a8", trim: "#c87d28", style: "drape" },
  seed: 509,
};

const armIK = (c: CastMember, p: Pose, x: number, y: number, scale: number, side: 1 | -1, target: Pt): { S: number; E: number } => {
  const h = c.height;
  const g = c.girth;
  const sw = 47 * h * (0.85 + 0.15 * g);
  const limbW = 8.8 * h * (0.9 + 0.1 * g);
  const a = 56 * h * scale;
  const b = (52 * h + 0.45 * 37 * h) * scale;
  const hipY = -162.7 * h;
  const phi = clamp(p.bodyTurn, -1, 1) * 0.95;
  const lx = side * sw * 0.86 * Math.cos(phi);
  const ly = hipY - 108 * h + limbW - hipY;
  const cl = Math.cos(p.lean * DEG);
  const sl = Math.sin(p.lean * DEG);
  const shX = x + p.bodyX + (lx * cl - ly * sl) * scale;
  const shY = y + p.bodyY + (lx * sl + ly * cl + hipY) * scale;
  const dx = target.x - shX;
  const dy = target.y - shY;
  const ux = dx * cl + dy * sl;
  const uy = -dx * sl + dy * cl;
  const d = clamp(Math.hypot(ux, uy), Math.abs(a - b) + 1, a + b - 0.5);
  const ang = (vx: number, vy: number) => {
    let t = Math.atan2(side * vx, vy) / DEG;
    if (t < -90) t += 360;
    return t;
  };
  const phiT = ang(ux, uy);
  const alpha = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)) / DEG;
  const S = phiT - alpha;
  const ex = side * a * Math.sin(S * DEG);
  const ey = a * Math.cos(S * DEG);
  let E = ang(ux - ex, uy - ey) - S;
  while (E > 180) E -= 360;
  while (E < -180) E += 360;
  return { S, E };
};

const BRANCH_BASE: Pt[] = [
  { x: 1100, y: 455 },
  { x: 1186, y: 534 },
  { x: 1274, y: 542 },
  { x: 1522, y: 566 },
  { x: 1604, y: 580 },
  { x: 1702, y: 618 },
];
const BRANCH_GIVE = [0, 0.35, 0.6, 0.75, 0.6, 1];

const MINA_FLOWERS: Pt[] = [
  { x: 1384, y: 582 },
  { x: 1412, y: 576 },
  { x: 1436, y: 594 },
  { x: 1460, y: 588 },
];
const MINA_STEP_X = [-12, 4, 22, 40];

const REKHA_BELLS: Pt[] = [
  { x: 646, y: 668 },
  { x: 672, y: 656 },
  { x: 688, y: 682 },
  { x: 706, y: 664 },
];
const REKHA_STEP_X = [-16, -2, 12, 26];

const pickCycles = (
  start: number,
  count: number,
  period: number,
  hand: "r" | "l",
  reach: (k: number) => Partial<Pose>,
  drop: Partial<Pose>,
  rest: Partial<Pose>,
  flower: string,
) => {
  const keys: PoseKey<Pose>[] = [];
  const grabs: number[] = [];
  const releases: number[] = [];
  const P = hand === "r" ? "rProp" : "lProp";
  const H = hand === "r" ? "rHand" : "lHand";
  const BE = hand === "r" ? "lE" : "rE"; // opposite hand holds the saji basket
  for (let k = 0; k < count; k++) {
    const t0 = start + k * period;
    const r = reach(k);
    const rx = r.bodyX ?? 0;
    // Step into position & anticipation dip before reaching up
    keys.push({ f: t0 + 8, in: 10, ease: "inOut", bodyX: rx, crouch: 0.045, bodyY: 1.6, headNod: (r.headNod ?? 0) + 1.5 } as PoseKey<Pose>);
    // Stretch & rise onto toes as fingers reach the blossom
    keys.push({ f: t0 + 16, in: 8, ease: "inOut", ...r, bodyX: rx, crouch: -0.035, bodyY: -2.2, [H]: "cup", [P]: "" } as PoseKey<Pose>);
    // Pluck recoil
    keys.push({ f: t0 + 22, in: 6, ease: "out", ...r, bodyX: rx, crouch: -0.015, bodyY: -1.0, headNod: (r.headNod ?? 0) + 2.6, [H]: "hold", [P]: flower } as PoseKey<Pose>);
    // Lower into basket with gentle knee settle & basket-arm absorb dip
    keys.push({ f: t0 + 38, in: 16, ease: "inOut", ...drop, bodyX: rx, crouch: 0.04, bodyY: 1.6, [BE]: -79, headNod: drop.headNod ?? 0, [H]: "hold", [P]: flower } as PoseKey<Pose>);
    // Release into saji & basket-arm spring back
    keys.push({ f: t0 + 44, in: 6, ease: "out", bodyX: rx, crouch: 0.01, bodyY: 0.4, [BE]: -75, [H]: "open", [P]: "" } as PoseKey<Pose>);
    grabs.push(t0 + 20);
    releases.push(t0 + 42);
    if (k === count - 1) keys.push({ f: t0 + 60, in: 16, ease: "inOut", ...rest, bodyX: rx, crouch: 0, bodyY: 0, [BE]: -75, [H]: "relaxed", [P]: "" } as PoseKey<Pose>);
  }
  return { keys, grabs, releases };
};

const fillFrom = (base: number, releases: number[]) => (f: number) =>
  base + releases.reduce((acc, r) => acc + clamp((f - r) / 4) / SPOTS.length, 0);

const reachTo = (c: CastMember, pos: Pt, scale: number, side: 1 | -1, base: Partial<Pose>, target: Pt): Partial<Pose> => {
  const p = { ...BASE_POSE, ...base } as Pose;
  const { S, E } = armIK(c, p, pos.x, pos.y, scale, side, target);
  return side === 1 ? { ...base, rS: S, rE: E } : { ...base, lS: S, lE: E };
};

/**
 * Zero-slip step helper: converts horizontal bodyX travel into exact ground-locked foot stride
 * (`stride = |dx/df| / (0.3 * 0.42 * thigh * scale)`) plus a 2-step-per-cycle vertical hip cadence
 * and swinging-arm counter-balance so characters never slide or skate when stepping.
 */
const withFootLockedSteps = (base: (f: number) => Pose, c: CastMember, scale: number): ((f: number) => Pose) => {
  const stepDenom = Math.max(1.2, 0.3 * 0.42 * (c.age === "child" ? 47 : 80) * c.height * scale);
  return (f: number): Pose => {
    const p = base(f);
    const p0 = base(f - 1);
    const p1 = base(f + 1);
    const vx = (p1.bodyX - p0.bodyX) * 0.5;
    const speed = Math.abs(vx);
    const stride = clamp(speed / stepDenom, 0, 0.95);
    const ph = f * 0.3 + c.seed;
    // Vertical walk cadence bob (2 steps per 2*pi leg cycle) so each foot plant carries weight
    const walkBob = stride > 0.03 ? -Math.abs(Math.sin(ph)) * 2.2 * stride : 0;
    const walkLean = clamp(vx * 0.45, -2.2, 2.2);
    return {
      ...p,
      stride,
      bodyY: p.bodyY + walkBob,
      lean: p.lean + walkLean,
    };
  };
};

const MINA_REST: Partial<Pose> = { rS: 8, rE: -14, lean: 0, headNod: 0, headTurn: 0.1, eyeY: 0 };
const MINA_REACH_BASE: Partial<Pose> = { bodyTurn: 0.3, lean: 2, headNod: -7, headTurn: 0.35, eyeY: -0.6, eyeX: 0.3 };
const MINA_DROP: Partial<Pose> = { rS: 28, rE: -78, lean: 2, headNod: 9, headTurn: 0.1, eyeY: 0.4, eyeX: 0 };
const minaReach = (i: number) =>
  reachTo(S01_MINA, POS.mina, FIG_SCALE, 1, { ...MINA_REACH_BASE, bodyX: MINA_STEP_X[i] }, MINA_FLOWERS[i]);
const minaPicks1 = pickCycles(30, 2, 62, "r", (k) => minaReach(k), MINA_DROP, MINA_REST, "jaba");
const minaPicks2 = pickCycles(T.l3 + 20, 1, 60, "r", () => minaReach(2), MINA_DROP, MINA_REST, "jaba");
const minaPicks3 = pickCycles(T.l4 - 8, 1, 60, "r", () => minaReach(3), MINA_DROP, MINA_REST, "jaba");
const MINA_GRABS = [...minaPicks1.grabs, ...minaPicks2.grabs, ...minaPicks3.grabs];
const MINA_ACT = withFootLockedSteps(
  alive(
    A([
      { f: 0, bodyX: MINA_STEP_X[0], bodyTurn: 0.3, headTurn: 0.25, smile: 0.3, lS: 18, lE: -75, lHand: "hold", lProp: "basket", rS: 8, rE: -14, rHand: "relaxed" },
      ...minaPicks1.keys,
      ...minaPicks2.keys,
      ...minaPicks3.keys,
      { f: T.l4 + 70, in: 16, ease: "inOut", bodyX: 28, headNod: 7, eyeY: 0.5, smile: 0.5 },
      { f: T.p3.start + 4, in: 20, ease: "inOut", bodyX: 20, headTurn: -0.5, eyeX: -0.5, eyeY: 0, headNod: 0, smile: 0.7, headTilt: -3 },
      { f: T.p3.start + 26, in: 14, ease: "inOut", headNod: 4 },
      { f: T.p3.end + 6, in: 16, ease: "inOut", headNod: 0, smile: 0.6 },
    ]),
    2,
  ),
  S01_MINA,
  FIG_SCALE,
);
const fillMina = fillFrom(0.4, [...minaPicks1.releases, ...minaPicks2.releases, ...minaPicks3.releases]);

const REKHA_REST: Partial<Pose> = { lS: 8, lE: -14, lean: 0, headNod: 0, eyeY: 0 };
const REKHA_REACH_BASE: Partial<Pose> = { bodyTurn: -0.35, lean: -3, headNod: -5, headTurn: -0.35, eyeY: -0.4 };
const REKHA_DROP: Partial<Pose> = { lS: -7, lE: -49, lean: -2, headNod: 9, headTurn: -0.15, eyeY: 0.4 };
const rekhaReach = (i: number) =>
  reachTo(S01_REKHA, POS.rekha, FIG_SCALE, -1, { ...REKHA_REACH_BASE, bodyX: REKHA_STEP_X[i] }, REKHA_BELLS[i]);
const rekhaPicks1 = pickCycles(18, 2, 58, "l", (k) => rekhaReach(k), REKHA_DROP, REKHA_REST, "jhumko");
const rekhaPicks2 = pickCycles(T.l3 + 4, 1, 58, "l", () => rekhaReach(2), REKHA_DROP, REKHA_REST, "jhumko");
const rekhaPicks3 = pickCycles(T.l4 + 6, 1, 56, "l", () => rekhaReach(3), REKHA_DROP, REKHA_REST, "jhumko");
const REKHA_GRABS = [...rekhaPicks1.grabs, ...rekhaPicks2.grabs, ...rekhaPicks3.grabs];
const REKHA_ACT = withFootLockedSteps(
  alive(
    A([
      { f: 0, bodyX: REKHA_STEP_X[0], bodyTurn: -0.35, headTurn: -0.3, smile: 0.35, rS: 18, rE: -75, rHand: "hold", rProp: "basket", lS: 8, lE: -14, lHand: "relaxed" },
      ...rekhaPicks1.keys,
      ...rekhaPicks2.keys,
      ...rekhaPicks3.keys,
      { f: T.l4 + 74, in: 14, ease: "inOut", bodyX: 18, headNod: 6, eyeY: 0.4, smile: 0.5 },
      { f: T.p3.start + 10, in: 20, ease: "inOut", bodyX: 28, bodyTurn: -0.1, headTurn: 0.45, eyeX: 0.5, eyeY: 0, headNod: 0, smile: 0.75, headTilt: 3 },
      { f: T.p3.start + 30, in: 14, ease: "inOut", headNod: 3 },
      { f: T.p3.end + 6, in: 16, ease: "inOut", headNod: 0, smile: 0.6 },
    ]),
    4,
  ),
  S01_REKHA,
  FIG_SCALE,
);
const fillRekha = fillFrom(0.45, [...rekhaPicks1.releases, ...rekhaPicks2.releases, ...rekhaPicks3.releases]);

const branchAt = (f: number): Pt[] => {
  let dip = 0;
  for (const g of MINA_GRABS) {
    const t = f - g;
    if (t >= 0 && t < 70) dip += 6 * Math.exp(-t / 13) * Math.sin(t * 0.42 + 0.35);
  }
  const breeze = 2.2 * noise1(f * 0.018, 77) + 1.2 * noise1(f * 0.041, 78);
  return BRANCH_BASE.map((p, i) => ({ x: p.x + BRANCH_GIVE[i] * breeze * 0.4, y: p.y + BRANCH_GIVE[i] * (dip + breeze) }));
};

const holder = (c: CastMember, pos: Pt, scale: number, base: (f: number) => Pose, grips: [number, number]) => (f: number): Pose => {
  const p0 = base(f);
  const br = branchAt(f);
  // Subtle sympathetic torso/knee absorption when Mina plucks a flower from the held branch
  const dipY = br[grips[1]].y - BRANCH_BASE[grips[1]].y;
  const p: Pose = {
    ...p0,
    bodyY: p0.bodyY + dipY * 0.28,
    crouch: clamp(p0.crouch + Math.max(0, dipY) * 0.012, -0.05, 0.25),
    headNod: p0.headNod + dipY * 0.45,
  };
  const L = armIK(c, p, pos.x, pos.y, scale, -1, br[grips[0]]);
  const R = armIK(c, p, pos.x, pos.y, scale, 1, br[grips[1]]);
  return { ...p, lS: L.S, lE: L.E, rS: R.S, rE: R.E, lHand: "hold", rHand: "hold" };
};

const SARALA_ACT = holder(
  S01_SARALA,
  POS.sarala,
  BACK_SCALE,
  withFootLockedSteps(
    alive(
      A([
        { f: 0, bodyX: -6, bodyTurn: 0.15, headTurn: 0.25, headNod: -4, eyeY: -0.3, eyeX: 0.3, smile: 0.45 },
        { f: 60, in: 34, ease: "inOut", bodyX: 4, headTurn: 0.35, headTilt: 3, eyeY: -0.1 },
        { f: T.p1.end, in: 28, ease: "inOut", bodyX: -3, headTurn: 0.2, headTilt: -2, headNod: -6, eyeY: -0.5 },
        { f: T.p2.start - 14, in: 20, ease: "inOut", bodyX: -10, headTurn: -0.45, eyeX: -0.5, eyeY: 0.1, headNod: 0, smile: 0.55, headTilt: -3 },
        { f: T.p2.end + 4, in: 22, ease: "inOut", bodyX: 2, headTurn: 0.3, eyeX: 0.3, eyeY: -0.3, smile: 0.45, headTilt: 0, headNod: -4 },
        { f: T.l4 + 10, in: 28, ease: "inOut", bodyX: 10, headTurn: 0.4, headTilt: 4 },
        { f: T.p3.start, in: 24, ease: "inOut", bodyX: 6, headTurn: 0.45, eyeX: 0.4, eyeY: 0.2, headNod: 3, smile: 0.6 },
      ]),
      1,
    ),
    S01_SARALA,
    BACK_SCALE,
  ),
  [1, 2],
);

const LATA_ACT = holder(
  S01_LATA,
  POS.lata,
  BACK_SCALE,
  withFootLockedSteps(
    alive(
      A([
        { f: 0, bodyX: 6, bodyTurn: -0.2, headTurn: -0.3, headNod: -3, eyeY: -0.2, eyeX: -0.4, smile: 0.5 },
        { f: 80, in: 32, ease: "inOut", bodyX: -5, headTurn: -0.2, headTilt: -3, eyeY: -0.4 },
        { f: T.l2 + 70, in: 32, ease: "inOut", bodyX: 4, headTurn: -0.4, headTilt: 2, eyeY: 0, smile: 0.55 },
        { f: T.l3 + 30, in: 28, ease: "inOut", bodyX: -8, headTurn: -0.28, headNod: -5, eyeY: -0.4 },
        { f: T.p3.start + 6, in: 24, ease: "inOut", bodyX: -4, headTurn: -0.45, headNod: 2, eyeY: 0.3, smile: 0.65 },
      ]),
      5,
    ),
    S01_LATA,
    BACK_SCALE,
  ),
  [3, 4],
);

const hum =
  (seed: number) =>
  (f: number): MouthState => {
    const phrase = clamp((noise1(f / 64, seed) + 0.15) * 3);
    const syl = 0.5 + 0.5 * Math.sin(f * 0.19 + seed + 1.4 * noise1(f / 27, seed + 1));
    const round = 0.55 + 0.35 * noise1(f / 41, seed + 2);
    return { open: phrase * (0.06 + 0.16 * syl), width: 1 - 0.25 * round, round: round * phrase, teeth: 0 };
  };
const MOUTH_SARALA = hum(13);
const MOUTH_LATA = hum(29);

const TUNI_ACT = withFootLockedSteps(
  alive(
    A([
      { f: 0, bodyX: -18, bodyTurn: 0.25, headTurn: 0.1, headTilt: -6, eyeY: -0.5, smile: 0.5, rS: 6, rE: -10, rHand: "relaxed", lS: 10, lE: -16, lHand: "relaxed" },
      { f: T.p1.start - 6, in: 24, ease: "inOut", bodyX: -6, headTilt: -10, eyeY: -0.8, headTurn: 0.2, lS: 34, lE: -40, lHand: "open", smile: 0.6 },
      { f: T.p1.end - 6, in: 22, ease: "inOut", bodyX: 0, headTilt: 2, eyeY: 0.4, lS: 22, lE: -30 },
      { f: T.l2 + 18, in: 24, ease: "inOut", bodyX: 0, crouch: 0.82, lean: 9, headTilt: 6, eyeY: 0.6, rS: -4, rE: -2, rHand: "cup", lS: 10, lE: -16, lHand: "relaxed" },
      { f: T.l2 + 34, in: 14, ease: "inOut", rS: -6, rE: 0, rHand: "hold", rProp: "sprig" },
      { f: T.l2 + 50, in: 14, ease: "inOut", crouch: 0.78, lean: 7, headTilt: 4 },
      { f: T.l2 + 84, in: 32, ease: "inOut", crouch: 0, lean: 0, rS: 96, rE: -100, rHand: "hold", rProp: "sprig", headTilt: 8, eyeY: -0.2, smile: 0.85 },
      { f: T.p2.start - 8, in: 22, ease: "inOut", rS: 122, rE: -128, headTilt: 4, lid: 0.85, smile: 0.95, headNod: -3 },
      { f: T.p2.end + 6, in: 16, ease: "inOut", lid: 0, headNod: 0, smile: 0.9 },
      { f: T.l3 + 20, in: 28, ease: "inOut", bodyX: 16, bodyTurn: 0.34, headTurn: 0.42, rS: 70, rE: -95, headTilt: 0, smile: 0.7 },
      { f: T.l4, in: 30, ease: "inOut", bodyX: 22, headTilt: -3, smile: 0.6 },
    ]),
    3,
  ),
  S01_TUNI,
  FIG_SCALE,
);

const PROPS_MINA: Record<string, PropRenderer> = { basket: basketProp(fillMina, MIX_JABA), jaba: heldFlower("jaba") };
const PROPS_TUNI: Record<string, PropRenderer> = { sprig: Sprig };
const PROPS_REKHA: Record<string, PropRenderer> = { basket: basketProp(fillRekha, MIX_JHUMKO), jhumko: heldFlower("jhumko") };

/* ---------------- Upstage girl (Champa) moving & picking behind the Jhumko tree ---------------- */

const CHAMPA_BELLS: Pt[] = [
  { x: 632, y: 586 },
  { x: 668, y: 576 },
  { x: 644, y: 592 },
];
const CHAMPA_STEP_X = [0, 32, 10];
const CHAMPA_REST: Partial<Pose> = { rS: 10, rE: -16, lean: 0, headNod: 0, eyeY: 0 };
const CHAMPA_REACH_BASE: Partial<Pose> = { bodyTurn: 0.26, lean: 2.5, headNod: -6, headTurn: 0.28, eyeY: -0.45 };
const CHAMPA_DROP: Partial<Pose> = { rS: 24, rE: -74, lean: 2, headNod: 7, headTurn: 0.14, eyeY: 0.35 };
const champaReach = (i: number) =>
  reachTo(
    S01_CHAMPA,
    POS.champa,
    BEHIND_TREE_SCALE,
    1,
    { ...CHAMPA_REACH_BASE, bodyX: CHAMPA_STEP_X[i % CHAMPA_STEP_X.length] },
    CHAMPA_BELLS[i % CHAMPA_BELLS.length],
  );
const champaPicks1 = pickCycles(44, 1, 68, "r", () => champaReach(0), CHAMPA_DROP, CHAMPA_REST, "jhumko");
const champaPicks2 = pickCycles(192, 1, 68, "r", () => champaReach(1), CHAMPA_DROP, CHAMPA_REST, "jhumko");
const champaPicks3 = pickCycles(T.l4 - 4, 1, 68, "r", () => champaReach(2), CHAMPA_DROP, CHAMPA_REST, "jhumko");
const CHAMPA_GRABS = [...champaPicks1.grabs, ...champaPicks2.grabs, ...champaPicks3.grabs];
const fillChampa = fillFrom(0.35, [...champaPicks1.releases, ...champaPicks2.releases, ...champaPicks3.releases]);
const PROPS_CHAMPA: Record<string, PropRenderer> = { basket: basketProp(fillChampa, MIX_MIXED), jhumko: heldFlower("jhumko") };

const CHAMPA_ACT = withFootLockedSteps(
  alive(
    A([
      { f: 0, bodyX: 0, bodyTurn: 0.26, headTurn: 0.24, smile: 0.4, lS: 18, lE: -75, lHand: "hold", lProp: "basket", rS: 10, rE: -16, rHand: "relaxed" },
      ...champaPicks1.keys,
      // At f=124..168 she takes 2 natural steps behind the Jhumko trunk to the right side of the canopy
      { f: 124, in: 12, ease: "inOut", bodyX: 0, bodyTurn: 0.32, headTurn: 0.35 },
      { f: 168, in: 44, ease: "inOut", bodyX: 32, bodyTurn: 0.24, headTurn: 0.22 },
      ...champaPicks2.keys,
      // At f=272..312 she takes 2 steps back left behind the trunk
      { f: 272, in: 12, ease: "inOut", bodyX: 32, bodyTurn: -0.22, headTurn: -0.28 },
      { f: 312, in: 40, ease: "inOut", bodyX: 10, bodyTurn: 0.26, headTurn: 0.25 },
      ...champaPicks3.keys,
      { f: T.p3.start + 6, in: 22, ease: "inOut", bodyX: 14, headTurn: 0.36, smile: 0.65, headTilt: 3 },
    ]),
    7,
  ),
  S01_CHAMPA,
  BEHIND_TREE_SCALE,
);

/* ---------------- Ghibli ink-styled live branch & pickable bells ---------------- */

const spline = (pts: Pt[], per = 10): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push({ x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const nearestOn = (line: Pt[], x: number): Pt => line.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best), line[0]);

const GhibliJabaBranch: React.FC<{ f: number }> = ({ f }) => {
  const line = spline(branchAt(f));
  const n = line.length;
  return (
    <g>
      {/* Sepia ink outline + dual-tone bark stroke */}
      {line.slice(1).map((p, i) => (
        <line key={`wi${i}`} x1={line[i].x} y1={line[i].y} x2={p.x} y2={p.y} stroke="#362013" strokeWidth={13.5 - (6.8 * i) / n} strokeLinecap="round" opacity={0.85} />
      ))}
      {line.slice(1).map((p, i) => (
        <line key={`w${i}`} x1={line[i].x} y1={line[i].y} x2={p.x} y2={p.y} stroke="#785337" strokeWidth={10.5 - (5.8 * i) / n} strokeLinecap="round" />
      ))}
      {line.slice(1).map((p, i) => (
        <line key={`wh${i}`} x1={line[i].x} y1={line[i].y - 1.4} x2={p.x} y2={p.y - 1.4} stroke="#9e7450" strokeWidth={3.2 - (1.8 * i) / n} strokeLinecap="round" opacity={0.55} />
      ))}
      {line.map((p, i) => {
        if (i < 4) return null;
        const side = i % 2 ? 1 : -1;
        const len = 15 + hash(i * 3.3) * 8;
        const rot = side * (36 + hash(i * 1.7) * 28) + 84 * (side > 0 ? 1 : 0);
        return (
          <GhibliSketchedLeaf
            key={`lf${i}`}
            x={p.x + side * 4}
            y={p.y + side * 9}
            len={len}
            rot={rot * 0.32}
            variant={i}
          />
        );
      })}
      {[0.07, 0.13, 0.9, 0.97].map((u, i) => {
        const p = line[Math.round(u * (n - 1))];
        return <GhibliJabaBlossom key={`b${i}`} x={p.x + 4} y={p.y + 12} r={12} rot={i * 61 + 15} />;
      })}
      {MINA_FLOWERS.map((fl, i) => {
        if (f >= MINA_GRABS[i]) return null;
        const p = nearestOn(line, fl.x);
        const dy = p.y - BRANCH_BASE[3].y;
        return (
          <g key={`m${i}`}>
            <path d={`M ${p.x} ${p.y} Q ${fl.x - 4} ${(p.y + fl.y + dy) / 2} ${fl.x} ${fl.y + dy * 0.7 - 8}`} stroke="#3d5e31" strokeWidth={2.2} fill="none" />
            <GhibliJabaBlossom x={fl.x} y={fl.y + dy * 0.7} r={11} rot={i * 77 + 30} />
          </g>
        );
      })}
    </g>
  );
};

const FallingShiuli: React.FC<{ f: number; x: number; y0: number; y1: number }> = ({ f, x, y0, y1 }) => (
  <>
    {Array.from({ length: 12 }, (_, i) => {
      const span = y1 - y0;
      const vy = 0.9 + hash(i * 7.3 + 3) * 0.8;
      const ph = hash(i * 8.2 + 7) * 6.28;
      const yy = mod(hash(i * 5.7 + 2) * span + vy * f, span);
      const xx = x + (hash(i * 3.1 + 1) - 0.5) * 360 + yy * (0.25 + hash(i * 2.9 + 4) * 0.3) + Math.sin(f * (0.04 + hash(i) * 0.03) + ph) * 18;
      const fade = clamp(yy / 40) * clamp((span - yy) / 40);
      return (
        <g key={i} opacity={fade}>
          <GhibliInkBloom x={xx} y={y0 + yy} r={5.5} kind="shiuli" rot={f * (1.5 + hash(i * 9.9 + 8) * 2.5) + ph * 57} />
        </g>
      );
    })}
  </>
);

const Dew: React.FC<{ f: number; spots: Array<[number, number, number]> }> = ({ f, spots }) => (
  <g style={{ mixBlendMode: "screen" }}>
    {spots.map(([x, y, s], i) => {
      const tw = Math.max(0, Math.sin(f * (0.05 + hash(i * 1.7) * 0.05) + i * 2.1));
      return <circle key={i} cx={x} cy={y} r={2.2 * s + 1.6 * tw} fill="#fff6dc" opacity={0.25 + 0.6 * tw * tw} />;
    })}
  </g>
);
const DEW_SPOTS: Array<[number, number, number]> = Array.from({ length: 28 }, (_, i) => {
  const which = i % 3;
  const base = which === 0 ? { x: 1100, y: 400, rx: 170, ry: 130 } : which === 1 ? { x: 740, y: 450, rx: 150, ry: 120 } : { x: 320, y: 390, rx: 160, ry: 110 };
  const a = hash(i * 4.1 + 9) * Math.PI * 2;
  const r = Math.sqrt(hash(i * 2.3 + 5));
  return [base.x + Math.cos(a) * base.rx * r, base.y + Math.sin(a) * base.ry * r, 0.8 + hash(i) * 0.6];
});

const NearPetals: React.FC<{ f: number }> = ({ f }) => (
  <>
    {Array.from({ length: 10 }, (_, i) => {
      const x0 = hash(i * 3.1 + 11) * 2600 - 300;
      const y0 = hash(i * 5.7 + 12) * 900;
      const vy = 0.7 + hash(i * 7.3 + 13) * 0.7;
      const drift = 0.5 + hash(i * 2.9 + 14) * 1.1;
      const y = mod(y0 + vy * f, 900) + 60;
      const x = mod(x0 + drift * f, 2600) - 300 + Math.sin(f * 0.05 + i) * 26;
      return <GhibliInkBloom key={i} x={x} y={y} r={7} kind={i % 4 === 0 ? "jaba" : "shiuli"} rot={f * 2 + i * 40} />;
    })}
  </>
);

const Mist: React.FC<{ f: number; y: number; h: number; n: number; seed: number; opacity: number; x0?: number; w?: number }> = ({
  f,
  y,
  h,
  n,
  seed,
  opacity,
  x0 = -600,
  w = 3200,
}) => (
  <g opacity={opacity}>
    <defs>
      <radialGradient id={`g-s01v-mist-${seed}`}>
        <stop offset="0%" stopColor="#fff4e2" stopOpacity={0.9} />
        <stop offset="60%" stopColor="#ffeed6" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#ffeed6" stopOpacity={0} />
      </radialGradient>
    </defs>
    {Array.from({ length: n }, (_, i) => {
      const x = x0 + mod(hash(seed * 9 + i * 3.3) * w + f * (0.25 + hash(seed + i) * 0.35), w);
      const yy = y + (hash(seed * 5 + i * 1.7) - 0.5) * h;
      const rx = 260 + hash(seed * 3 + i) * 240;
      return <ellipse key={i} cx={x} cy={yy} rx={rx} ry={h * 0.5 + 20} fill={`url(#g-s01v-mist-${seed})`} />;
    })}
  </g>
);

const SunShafts: React.FC<{ f: number; level: number }> = ({ f, level }) => (
  <g style={{ mixBlendMode: "screen" }}>
    <defs>
      <linearGradient id="g-s01v-shaft" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff0c4" stopOpacity={0.42} />
        <stop offset="100%" stopColor="#ffd890" stopOpacity={0} />
      </linearGradient>
    </defs>
    {[0, 1, 2, 3].map((i) => {
      const x = 1500 + i * 260;
      const w = 70 + hash(i * 3.1) * 70;
      const o = level * (0.14 + 0.04 * noise1(f * 0.01, i + 40));
      return <path key={i} d={`M ${x} -200 L ${x + w} -200 L ${x - 900 + w * 2} 1000 L ${x - 900} 1000 Z`} fill="url(#g-s01v-shaft)" opacity={o} />;
    })}
  </g>
);

const vedicKeepInSet = (c: Cam): Cam => {
  const z = Math.max(1, c.zoom);
  let cx = c.x + 960;
  const h1 = 960 / z;
  cx = clamp(cx, -400 + h1, 2320 - h1);
  const h2 = 960 / Math.pow(z, 0.55);
  cx = clamp(cx, (-300 + h2 - 960) / 0.55 + 960, (2220 - h2 - 960) / 0.55 + 960);
  return { ...c, x: cx - 960, y: Math.min(c.y, 844 - 540 / z) };
};

type Shot = { cx: number; cy: number; z: number };
const SHOTS: Record<"wide" | "tuni" | "row" | "hands", Shot> = {
  wide: { cx: 960, cy: 560, z: 1.0 },
  tuni: { cx: 600, cy: 640, z: 1.12 },
  row: { cx: 1010, cy: 630, z: 1.2 },
  hands: { cx: 1070, cy: 690, z: 1.5 },
};
const PUSH2 = 84;
const PUSH4 = 56;
const CUT3 = T.l3 - 2;

const sstep = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const blend = (a: Shot, b: Shot, t: number): Shot => {
  const k = sstep(t);
  return { cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, z: a.z * Math.pow(b.z / a.z, k) };
};
const shotAt = (f: number): Shot => (f < CUT3 ? blend(SHOTS.wide, SHOTS.tuni, (f - T.l2) / PUSH2) : blend(SHOTS.row, SHOTS.hands, (f - T.l4) / PUSH4));
const camAt = (f: number): Cam => {
  const s = shotAt(f);
  // Zoom-proportional depth of field: deep focus on wide, soft multiplane separation as camera pushes in
  const dof = 0.35 + Math.max(0, s.z - 1) * 1.45;
  return vedicKeepInSet({ x: s.cx - 960, y: s.cy - 540, zoom: s.z, focus: 1, dof, shake: 0 });
};

export const GhibliScene01DawnGarden: React.FC = () => {
  const { lifeF } = useStory3(S01);
  const f = lifeF;
  const cam = camAt(f);
  const sunLift = track(f, [
    [0, 0.9],
    [DUR, 1.08, "inOut"],
  ]);
  const { tulsi, jhumko, jaba } = VEDIC_COURTYARD;

  const shiuliSway = 0.55 * Math.sin(lifeF * 0.026 + 1) + 0.4 * noise1(lifeF * 0.016, 5);
  const jhumkoSway = 0.28 * noise1(lifeF * 0.015, 63);
  const jabaSway = 0.22 * noise1(lifeF * 0.014, 61);

  return (
    <div style={{ position: "absolute", inset: 0, background: "#ead2b6", overflow: "hidden" }}>
      <GhibliPreload files={PRELOAD} />
      <GhibliStage cam={cam} background="#ead2b6" opacity={Math.min(1, lifeF / 14)}>
        <GhibliLayer depth={0.12}>
          <image href={staticFile("images/ghibli_ep03/sky_sharad_dawn.png")} x={-1000} y={-600} width={3920} height={2205} preserveAspectRatio="xMidYMid slice" />
        </GhibliLayer>
        <GhibliLayer depth={0.3}>
          <g transform={`translate(${5 * (lifeF - T.p1.start)}, 0)`} opacity={0.85}>
            <Birds f={lifeF} x={60} y={70} n={5} s={0.8} />
          </g>
        </GhibliLayer>
        <GhibliLayer depth={0.38}>
          <image href={staticFile("images/ghibli_ep03/far_trees_sketch.png")} x={-600} y={-10} width={3200} height={360} preserveAspectRatio="none" />
        </GhibliLayer>
        <GhibliLayer depth={0.55}>
          <GlowDefs />
          {/* Warm floor-matched earth apron under plinth */}
          <rect x={-600} y={770} width={3200} height={900} fill="#b89878" />
          <image href={staticFile("images/ghibli_ep03/courtyard_back_sketch.png")} x={-300} y={140} width={2520} height={660} preserveAspectRatio="none" />
          <rect x={-600} y={150} width={3200} height={700} fill="#ffd9a0" opacity={0.12 * sunLift} style={{ mixBlendMode: "screen" }} />
          <Mist f={lifeF} y={700} h={120} n={7} seed={3} opacity={0.36} />
          <Mist f={lifeF} y={240} h={80} n={5} seed={4} opacity={0.22} />
        </GhibliLayer>
        <GhibliLayer depth={0.68}>
          <GhibliAtmosphericHaze f={lifeF} intensity={0.95} seed={31} />
        </GhibliLayer>
        <GhibliLayer depth={0.8}>
          <SunShafts f={lifeF} level={sunLift} />
        </GhibliLayer>
        <GhibliLayer depth={1}>
          <GlowDefs />
          <GhibliCharFilterDefs />
          <image href={staticFile("images/ghibli_ep03/courtyard_floor_sketch.png")} x={-400} y={784} width={2720} height={600} preserveAspectRatio="none" />
          <GhibliCourtyardShadows f={lifeF} shiuli={SHIULI_TREE} jhumko={jhumko} jaba={jaba} tulsi={tulsi} />
          <rect x={-600} y={784} width={3200} height={700} fill="#ffcf96" opacity={0.1 * sunLift} style={{ mixBlendMode: "screen" }} />
          <Mist f={lifeF * 0.8} y={800} h={60} n={6} seed={7} opacity={0.22} />

          {/* Fallen shiuli carpet */}
          <GhibliFallenShiuli x={SHIULI_TREE.x + 40} y={SHIULI_TREE.y - 12} />
        </GhibliLayer>

        {/* Mid-ground tree plane (ground-locked to flagstones with subtle canopy parallax & DOF softening) */}
        <GhibliLayer depth={0.82} groundLocked parallaxDrift={-0.025}>
          <GhibliCharFilterDefs />
          {/* Upstage girl (Champa) rendered BEFORE the Jhumko tree so the trunk & lower branches naturally occlude her as she moves behind it */}
          <ContactShadow x={POS.champa.x + CHAMPA_ACT(f).bodyX} y={POS.champa.y} rx={28} ry={7} opacity={0.26} />
          <g filter="url(#ghibli-char-ink)">
            <LooseHair cast={S01_CHAMPA} acting={CHAMPA_ACT} f={f} lifeF={lifeF} x={POS.champa.x} y={POS.champa.y} scale={BEHIND_TREE_SCALE} />
            <Puppet cast={S01_CHAMPA} f={f} lifeF={lifeF} x={POS.champa.x} y={POS.champa.y} scale={BEHIND_TREE_SCALE} acting={CHAMPA_ACT} light={LIGHT} props={PROPS_CHAMPA} />
          </g>

          {/* Sketched Shiuli tree */}
          <g transform={`rotate(${shiuliSway} ${SHIULI_TREE.x} ${SHIULI_TREE.y})`}>
            <GhibliCutout file="images/ghibli_ep03/tree_shiuli_sketch.png" anchor={GHIBLI_ANCHORS.tree_shiuli_sketch} x={SHIULI_TREE.x} y={SHIULI_TREE.y} targetHeight={620} />
          </g>

          {/* Sketched Jhumko tree + live pickable bells (occludes Champa standing behind its trunk) */}
          <g transform={`rotate(${jhumkoSway} ${jhumko.x} ${jhumko.y})`}>
            <GhibliCutout file="images/ghibli_ep03/tree_jhumko_sketch.png" anchor={GHIBLI_ANCHORS.tree_jhumko_sketch} x={jhumko.x} y={jhumko.y} targetHeight={600} />
            {CHAMPA_BELLS.map((b, i) => {
              if (f >= CHAMPA_GRABS[i]) return null;
              const top = { x: b.x + 8, y: jhumko.crown.y + 115 };
              return (
                <g key={`cb${i}`}>
                  <path d={`M ${top.x} ${top.y} Q ${b.x + 4} ${(top.y + b.y) / 2} ${b.x} ${b.y - 6}`} stroke="#3f6b35" strokeWidth={1.4} fill="none" />
                  <GhibliJhumkoBell x={b.x} y={b.y - 8} s={0.92} rot={-6} />
                </g>
              );
            })}
            {REKHA_BELLS.map((b, i) => {
              if (f >= REKHA_GRABS[i]) return null;
              const top = { x: b.x + 10, y: jhumko.crown.y + 150 };
              return (
                <g key={`r${i}`}>
                  <path d={`M ${top.x} ${top.y} Q ${b.x + 6} ${(top.y + b.y) / 2} ${b.x} ${b.y - 6}`} stroke="#3f6b35" strokeWidth={1.6} fill="none" />
                  <GhibliJhumkoBell x={b.x} y={b.y - 8} s={1.05} rot={8} />
                </g>
              );
            })}
          </g>

          {/* Sketched Jaba tree */}
          <g transform={`rotate(${jabaSway} ${jaba.x} ${jaba.y})`}>
            <GhibliCutout file="images/ghibli_ep03/tree_jaba_sketch.png" anchor={GHIBLI_ANCHORS.tree_jaba_sketch} x={jaba.x} y={jaba.y} targetHeight={650} />
          </g>
        </GhibliLayer>

        {/* Upstage Tulsi Mancha & branch-holders plane */}
        <GhibliLayer depth={0.93} groundLocked parallaxDrift={-0.01}>
          <GlowDefs />
          <GhibliCharFilterDefs />
          {/* Sketched Tulsi Mancha + live flickering diya flame inside niche */}
          <ContactShadow x={tulsi.x} y={tulsi.y + 4} rx={115 * tulsi.s} ry={18 * tulsi.s} opacity={0.28} />
          <GhibliCutout
            file="images/ghibli_ep03/tulsi_mancha_sketch.png"
            anchor={GHIBLI_ANCHORS.tulsi_mancha_sketch}
            x={tulsi.x}
            y={tulsi.y}
            targetHeight={355 * tulsi.s}
          />
          <Glow x={tulsi.x} y={tulsi.y - 102 * tulsi.s} r={62 * tulsi.s} kind="warm" o={0.55} />
          <Flame x={tulsi.x} y={tulsi.y - 94 * tulsi.s} s={1.0 * tulsi.s} f={lifeF} seed={99} />

          {/* Filled sajis at the foot of the Tulsi Mancha */}
          {VEDIC_COURTYARD.sajisAtTulsi.map((x, i) => {
            const sy = tulsi.y + 16 + (i % 2) * 6;
            const file = i % 2 === 0 ? "images/ghibli_ep03/prop_ground_saji_a.png" : "images/ghibli_ep03/prop_ground_saji_b.png";
            const anc = i % 2 === 0 ? GHIBLI_ANCHORS.prop_ground_saji_a : GHIBLI_ANCHORS.prop_ground_saji_b;
            return (
              <React.Fragment key={x}>
                <ContactShadow x={x} y={sy} rx={28} ry={6} opacity={0.3} />
                <GhibliCutout file={file} anchor={anc} x={x} y={sy} targetHeight={68} />
              </React.Fragment>
            );
          })}

          <Dew f={lifeF} spots={DEW_SPOTS} />
          <FallingShiuli f={lifeF} x={SHIULI_TREE.x} y0={SHIULI_TREE.y - 520} y1={SHIULI_TREE.y + 90} />

          {/* Live IK-locked jaba branch first, so Sarala's and Lata's hands grip over it */}
          <GhibliJabaBranch f={lifeF} />

          <ContactShadow x={POS.sarala.x + SARALA_ACT(f).bodyX} y={POS.sarala.y} rx={36} ry={9} />
          <g filter="url(#ghibli-char-ink)">
            <LooseHair cast={S01_SARALA} acting={SARALA_ACT} f={f} lifeF={lifeF} x={POS.sarala.x} y={POS.sarala.y} scale={BACK_SCALE} />
            <Puppet cast={S01_SARALA} f={f} lifeF={lifeF} x={POS.sarala.x} y={POS.sarala.y} scale={BACK_SCALE} acting={SARALA_ACT} mouth={MOUTH_SARALA} light={LIGHT} />
          </g>

          <ContactShadow x={POS.lata.x + LATA_ACT(f).bodyX} y={POS.lata.y} rx={34} ry={9} />
          <g filter="url(#ghibli-char-ink)">
            <LooseHair cast={S01_LATA} acting={LATA_ACT} f={f} lifeF={lifeF} x={POS.lata.x} y={POS.lata.y} scale={BACK_SCALE} />
            <Puppet cast={S01_LATA} f={f} lifeF={lifeF} x={POS.lata.x} y={POS.lata.y} scale={BACK_SCALE} acting={LATA_ACT} mouth={MOUTH_LATA} light={LIGHT} />
          </g>

          {/* Holders' waiting sajis */}
          <ContactShadow x={POS.sarala.x - 70} y={POS.sarala.y + 14} rx={26} ry={6} opacity={0.28} />
          <GhibliCutout file="images/ghibli_ep03/prop_ground_saji_b.png" anchor={GHIBLI_ANCHORS.prop_ground_saji_b} x={POS.sarala.x - 70} y={POS.sarala.y + 14} targetHeight={62} />
          <ContactShadow x={POS.lata.x - 66} y={POS.lata.y + 16} rx={26} ry={6} opacity={0.28} />
          <GhibliCutout file="images/ghibli_ep03/prop_ground_saji_a.png" anchor={GHIBLI_ANCHORS.prop_ground_saji_a} x={POS.lata.x - 66} y={POS.lata.y + 16} targetHeight={62} />
        </GhibliLayer>

        {/* Principal foreground flower-gatherers plane (pin-sharp at focus=1.0) */}
        <GhibliLayer depth={1}>
          <GhibliCharFilterDefs />
          <ContactShadow x={POS.tuni.x + TUNI_ACT(f).bodyX} y={POS.tuni.y} rx={28} ry={8} />
          <g filter="url(#ghibli-char-ink)">
            <Puppet cast={S01_TUNI} f={f} lifeF={lifeF} x={POS.tuni.x} y={POS.tuni.y} scale={FIG_SCALE} acting={TUNI_ACT} light={LIGHT} props={PROPS_TUNI} />
          </g>

          <ContactShadow x={POS.rekha.x + REKHA_ACT(f).bodyX} y={POS.rekha.y} rx={36} ry={9} />
          <g filter="url(#ghibli-char-ink)">
            <LooseHair cast={S01_REKHA} acting={REKHA_ACT} f={f} lifeF={lifeF} x={POS.rekha.x} y={POS.rekha.y} scale={FIG_SCALE} />
            <Puppet cast={S01_REKHA} f={f} lifeF={lifeF} x={POS.rekha.x} y={POS.rekha.y} scale={FIG_SCALE} acting={REKHA_ACT} light={LIGHT} props={PROPS_REKHA} />
          </g>

          <ContactShadow x={POS.mina.x + MINA_ACT(f).bodyX} y={POS.mina.y} rx={36} ry={9} />
          <g filter="url(#ghibli-char-ink)">
            <LooseHair cast={S01_MINA} acting={MINA_ACT} f={f} lifeF={lifeF} x={POS.mina.x} y={POS.mina.y} scale={FIG_SCALE} />
            <Puppet cast={S01_MINA} f={f} lifeF={lifeF} x={POS.mina.x} y={POS.mina.y} scale={FIG_SCALE} acting={MINA_ACT} light={LIGHT} props={PROPS_MINA} />
          </g>
        </GhibliLayer>
        <GhibliLayer depth={1.06}>
          <Mist f={lifeF} y={1010} h={70} n={6} seed={9} opacity={0.18} />
        </GhibliLayer>
        <GhibliLayer depth={1.15}>
          <NearPetals f={lifeF} />
        </GhibliLayer>
        <GhibliLayer depth={1.22} extraBlur={3.2}>
          <GhibliForegroundBokeh f={lifeF} zoom={cam.zoom} />
        </GhibliLayer>
        <GhibliGrade warmth={0.26} vignette={0.32} bloomAt={[82, 18]} paperOpacity={0.24} />
      </GhibliStage>
    </div>
  );
};
