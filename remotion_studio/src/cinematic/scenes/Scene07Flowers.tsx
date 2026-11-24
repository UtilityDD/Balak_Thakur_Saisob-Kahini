import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "../audio/Mix";
import { EPISODE_01_SCENES } from "../../data/episode01Data";
import { SceneTiming } from "../../types/studio";
import { clamp, hash, lerp, makeActing, noise1, PoseKey, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { BabyThakur, DivineDefs, Motes } from "../divine/Divine";
import { Bokeh, Garland, Glow, GlowDefs } from "../fx/Fx";
import { CAST } from "../rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../rig/lipsync";
import { BASE_POSE, CastMember, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../rig/Puppet";
import { CueSubtitles } from "../Scene02Demo";
import { CourtyardBack, CourtyardFloor, TulsiMancha } from "../sets/Interiors";
import { KaliMandap } from "../sets/Sacred";

/**
 * Episode 1 · Scene 07 — "Flowers and the Little Goat".
 * Dawn after the night of the birth. The puja goes on with only flowers, bhog and love; no sacrifice.
 * The cloud of worry lifts, a peaceful breeze moves through the house, and the happiest of all is the
 * little goat that was spared — who comes to give the calm newborn his own blessing.
 * The Goddess appears only as radiant presence (series bible).
 */

export const SCENE07 = EPISODE_01_SCENES.find((s) => s.sceneId === "07_flowers_and_little_goat")!;

const SHOTS = {
  offer: { from: 0, to: 172 }, // মা, এবার আমরা শুধু ফুল আর ভালোবাসা দিয়েই তোমার পূজো করলাম।
  bhog: { from: 166, to: 368 }, // ভাইয়েরা যখন… মায়ের পায়ে ফুল ও ভোগ নিবেদন করলেন
  peace: { from: 362, to: 470 }, // দুশ্চিন্তার মেঘ কেটে গিয়ে… শান্তির বাতাস
  question: { from: 464, to: 598 }, // সবচেয়ে বেশি খুশি কে হয়েছিল জানো?
  goat: { from: 592, to: 830 }, // সেই বেঁচে যাওয়া ছোট্ট ছাগশিশুটি! … এই শান্ত শিশুটিকে
};
const DIS = 8;

export const SCENE07_CUES = [
  { from: 0, to: 70, who: "সুন্দর ঠাকুর", text: "মা, এবার আমরা শুধু ফুল আর" },
  { from: 78, to: 162, who: "সুন্দর ঠাকুর", text: "ভালোবাসা দিয়েই তোমার পূজো করলাম।" },
  { from: 169, to: 280, who: "কথক", text: "ভাইয়েরা যখন ভালোবাসা দিয়ে মায়ের পায়ে ফুল ও ভোগ নিবেদন করলেন," },
  { from: 296, to: 363, who: "কথক", text: "তখন সমস্ত দুশ্চিন্তার মেঘ কেটে গিয়ে" },
  { from: 375, to: 450, who: "কথক", text: "সবার মনে বয়ে গেল শান্তির বাতাস।" },
  { from: 473, to: 585, who: "কথক", text: "আর সারা বাড়ির মধ্যে সবচেয়ে বেশি খুশি কে হয়েছিল জানো?" },
  { from: 601, to: 665, who: "কথক", text: "সেই বেঁচে যাওয়া ছোট্ট ছাগশিশুটি!" },
  { from: 686, to: 751, who: "কথক", text: "যেন সবচেয়ে বড় ভালোবাসা আর আশীর্বাদ সেই দিয়েছিল" },
  { from: 758, to: 822, who: "কথক", text: "এই শান্ত শিশুটিকে।" },
];

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

const voice = (scene: SceneTiming, file: string, seed: number) => {
  const clip = scene.clips.find((c) => c.file === file);
  return {
    mouth: (fr: number): MouthState => (clip ? visemeFromEnvelope(clip.rmsEnvelope, fr - clip.offsetFrame, seed, clip.subtitleBn) : MOUTH_REST),
    talk: (fr: number) => (clip ? speechLevel(clip.rmsEnvelope, fr - clip.offsetFrame) : 0),
  };
};

/* ---------------- cast (local) ---------------- */

/** Sundar Thakur — scholarly astrologer, late 40s: dhoti, ochre shawl, tilak. */
const SUNDAR: CastMember = {
  id: "sundar",
  age: "adult",
  height: 1.0,
  girth: 1.06,
  skin: "#d39a72",
  skinLight: "#eebf9a",
  skinShade: "#ad724e",
  lips: "#a85c55",
  hair: "#2a1d18",
  hairLight: "#6a5244",
  hairStyle: "parted",
  outfit: "kurta",
  top: "#f6efe0",
  topLight: "#fffaf0",
  topShade: "#d3c6ad",
  topTrim: "#b8862e",
  sleeve: "full",
  lower: "dhoti",
  lowerColor: "#fbf6ea",
  lowerShade: "#d8cdb9",
  lowerTrim: "#b8862e",
  dhotiLength: "calf",
  scarf: { color: "#c9822e", shade: "#9a5e1c", trim: "#f2d27a", style: "shawl" },
  mustache: "#2a1d18",
  tilak: true,
  seed: 107,
};

/* ---------------- props ---------------- */

const Hibiscus: React.FC<{ x: number; y: number; r: number; rot?: number; o?: number }> = ({ x, y, r, rot = 0, o = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot})`} opacity={o}>
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx={0} cy={-r * 0.55} rx={r * 0.42} ry={r * 0.6} fill="#d0121e" transform={`rotate(${a})`} />
    ))}
    <circle r={r * 0.22} fill="#7a0a10" />
    <line x1={0} y1={0} x2={r * 0.2} y2={-r * 0.9} stroke="#f6c34a" strokeWidth={r * 0.08} />
  </g>
);
const Marigold: React.FC<{ x: number; y: number; r: number; o?: number }> = ({ x, y, r, o = 1 }) => (
  <g transform={`translate(${x}, ${y})`} opacity={o}>
    <circle r={r} fill="#f08a12" />
    <circle r={r * 0.72} fill="#f9a826" />
    <circle r={r * 0.4} fill="#ffc94a" />
  </g>
);

/** A handful of flowers held in cupped hands. */
const P_FLOWERS = (left: (f: number) => number): PropRenderer => ({ f, scale }) =>
  left(f) > 0.02 ? (
    <g transform={`scale(${scale}) translate(0, 10)`} opacity={clamp(left(f) * 1.5)}>
      <Hibiscus x={-6} y={-2} r={11} rot={20} />
      <Marigold x={8} y={-6} r={7} />
      <Marigold x={2} y={6} r={6} />
      <Hibiscus x={10} y={8} r={8} rot={-30} />
    </g>
  ) : null;

/** Brass thala of bhog: sandesh, naru, banana on a leaf. */
const Thala: React.FC<{ x?: number; y?: number; s?: number; steam?: number; f?: number }> = ({ x = 0, y = 0, s = 1, steam = 0, f = 0 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={46} ry={11} fill="#8a5a14" />
    <ellipse cx={0} cy={0} rx={44} ry={10} fill="#e0aa3e" />
    <path d="M -32 -2 Q 0 -14 32 -2 Q 0 6 -32 -2 Z" fill="#3f8a3a" />
    {[-20, -6, 8].map((cx, i) => (
      <ellipse key={i} cx={cx} cy={-6} rx={7} ry={4.5} fill="#fbf4e2" stroke="#e6d6b4" strokeWidth={0.8} />
    ))}
    {[18, 26].map((cx) => (
      <circle key={cx} cx={cx} cy={-7} r={5} fill="#f2b02e" />
    ))}
    <path d="M -28 -9 Q -14 -20 2 -12" stroke="#f3d24a" strokeWidth={5} strokeLinecap="round" fill="none" />
    {steam > 0 &&
      [0, 1].map((k) => {
        const t = ((f + k * 22) % 44) / 44;
        return <path key={k} d={`M ${-6 + k * 12} -14 q 6 ${-10 - t * 10} 0 ${-22 - t * 20}`} stroke="#fff6e6" strokeWidth={2} fill="none" opacity={steam * 0.35 * (1 - t)} />;
      })}
  </g>
);
const P_THALA: PropRenderer = ({ scale }) => <Thala s={scale * 0.9} y={-4} />;

/* ---------------- the little goat ---------------- */

/**
 * Chhagol-chhana: white kid with a brown patch, marigold garland and a red tilak (spared, beloved).
 * hop 0..1 = vertical bound; rear 0..1 = up on hind legs to nuzzle; bleat 0..1 = mouth open.
 * Faces right by default; `flip` faces left.
 */
const LittleGoat: React.FC<{ f: number; x: number; y: number; s?: number; flip?: boolean; hop?: number; rear?: number; bleat?: number; walk?: number; look?: number }> = ({
  f,
  x,
  y,
  s = 1,
  flip = false,
  hop = 0,
  rear = 0,
  bleat = 0,
  walk = 0,
  look = 0,
}) => {
  const tail = Math.sin(f * 0.9) * 22 + Math.sin(f * 2.1) * 8;
  const earFlick = Math.max(0, Math.sin(f * 0.13 + 1.3)) > 0.97 ? 1 : 0;
  const ear = 10 + Math.sin(f * 0.07) * 4 + earFlick * 18;
  const breathe = Math.sin(f * 0.26) * 1.2;
  const gait = walk * Math.sin(f * 0.55);
  const bodyRot = -rear * 32;
  const headRot = -12 + look * 18 + rear * 10 + Math.sin(f * 0.05) * 4;
  const leg = (lx: number, phase: number, back: boolean) => {
    const sw = gait * 18 * (phase ? 1 : -1) + (hop > 0.2 ? (back ? 14 : -18) : 0);
    return (
      <g transform={`translate(${lx}, 14) rotate(${sw})`}>
        <path d={`M -4 0 L -3 34 L 3 34 L 4 0 Z`} fill={back ? "#e6ddd0" : "#fbf8f2"} />
        <rect x={-4} y={32} width={8} height={7} rx={2} fill="#4a3a30" />
      </g>
    );
  };
  return (
    <g transform={`translate(${x}, ${y - hop * 46}) scale(${flip ? -s : s}, ${s})`}>
      <ellipse cx={0} cy={56 + hop * 46} rx={44 * (1 - hop * 0.35)} ry={7} fill="#000" opacity={0.18 * (1 - hop * 0.5)} />
      <g transform={`translate(-30, 18) rotate(${bodyRot}) translate(30, -18)`}>
        {/* far legs */}
        {leg(-22, 0, true)}
        {leg(22, 1, true)}
        {/* tail */}
        <path d={`M -34 -2 q -10 -12 -6 -24`} stroke="#fbf8f2" strokeWidth={7} strokeLinecap="round" fill="none" transform={`rotate(${tail}, -34, -2)`} />
        {/* body */}
        <ellipse cx={0} cy={breathe * 0.3} rx={40} ry={24 + breathe * 0.4} fill="#fbf8f2" />
        <ellipse cx={-10} cy={-4} rx={18} ry={12} fill="#a8683a" opacity={0.9} />
        <ellipse cx={4} cy={10} rx={30} ry={10} fill="#e6ddd0" opacity={0.7} />
        {/* near legs */}
        {leg(-26, 1, false)}
        {leg(26, 0, false)}
        {/* neck + head */}
        <g transform={`translate(30, -12) rotate(${headRot})`}>
          <path d="M -8 10 Q -2 -16 10 -24 L 22 -16 Q 12 0 10 14 Z" fill="#fbf8f2" />
          {/* marigold garland */}
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx={-6 + i * 3} cy={4 + Math.sin((i / 6) * Math.PI) * 7} r={3.4} fill={i % 2 ? "#f9a826" : "#f08a12"} />
          ))}
          <g transform="translate(14, -28)">
            {/* far ear */}
            <ellipse cx={-6} cy={0} rx={5} ry={12} fill="#d9cfc2" transform={`rotate(${ear + 40}, -6, -6)`} />
            <ellipse cx={4} cy={0} rx={15} ry={12} fill="#fbf8f2" />
            {/* snout */}
            <ellipse cx={16} cy={5} rx={9} ry={7} fill="#f3ebe0" />
            <ellipse cx={22} cy={3} rx={2} ry={1.4} fill="#6a4a40" />
            <path d={`M 15 ${9 + bleat * 1} q 5 ${2 + bleat * 6} 9 0`} stroke="#6a4a40" strokeWidth={1.4} fill={bleat > 0.2 ? "#8a3a3a" : "none"} />
            {/* horn buds + tilak */}
            <path d="M -2 -10 q 2 -6 5 -4" stroke="#c8b8a0" strokeWidth={3} strokeLinecap="round" fill="none" />
            <circle cx={6} cy={-7} r={2.6} fill="#d0121e" />
            {/* eye: big, soft, happy */}
            <ellipse cx={6} cy={-1} rx={3.6} ry={blinkGoat(f) ? 0.6 : 4.2} fill="#2a1a12" />
            {!blinkGoat(f) && <circle cx={7.2} cy={-2.4} r={1.3} fill="#fff" />}
            {/* near ear */}
            <ellipse cx={-4} cy={2} rx={6} ry={14} fill="#f1e8db" stroke="#e0d2c0" strokeWidth={1} transform={`rotate(${ear}, -4, -8)`} />
          </g>
        </g>
      </g>
    </g>
  );
};
const blinkGoat = (f: number) => (f + 11) % 97 < 3;

/* ---------------- petals ---------------- */

/** Flowers released from a point arcing down to a target (offering), and a gentle drift after. */
const PetalShower: React.FC<{ f: number; start: number; from: [number, number]; to: [number, number]; n?: number; seed?: number }> = ({ f, start, from, to, n = 14, seed = 1 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const d = 26 + hash(i * 3.1 + seed) * 14;
      const t0 = start + hash(i * 1.7 + seed) * 10;
      const t = clamp((f - t0) / d);
      if (f < t0) return null;
      const tx = to[0] + (hash(i * 5.3 + seed) - 0.5) * 120;
      const ty = to[1] + (hash(i * 7.1 + seed) - 0.5) * 16;
      const px = lerp(from[0], tx, t) + Math.sin(t * 6 + i) * 8 * (1 - t);
      const py = lerp(from[1], ty, t) - Math.sin(t * Math.PI) * (40 + hash(i) * 40);
      const rot = (f - t0) * (6 + hash(i * 2) * 8) * (1 - t * 0.8);
      return i % 3 === 0 ? <Marigold key={i} x={px} y={py} r={5} /> : <Hibiscus key={i} x={px} y={py} r={7} rot={rot} />;
    })}
  </g>
);

/** Breeze-borne petals drifting across frame. */
const BreezePetals: React.FC<{ f: number; n?: number; seed?: number; strength?: number }> = ({ f, n = 22, seed = 3, strength = 1 }) => (
  <g opacity={strength}>
    {Array.from({ length: n }, (_, i) => {
      const sp = 2.6 + hash(i * 1.3 + seed) * 3;
      const x = ((hash(i * 4.1 + seed) * 2400 + f * sp * 3) % 2600) - 300;
      const y = 120 + hash(i * 2.7 + seed) * 760 + Math.sin(f * 0.04 + i) * 40;
      return i % 3 === 0 ? <Marigold key={i} x={x} y={y} r={4} o={0.85} /> : <Hibiscus key={i} x={x} y={y} r={5.5} rot={f * 4 + i * 40} o={0.85} />;
    })}
  </g>
);

/** Heap of flowers at the Mother's feet, growing as offerings land. */
const FlowerHeap: React.FC<{ x: number; y: number; grow: number }> = ({ x, y, grow }) => (
  <g transform={`translate(${x}, ${y})`}>
    {Array.from({ length: 34 }, (_, i) => {
      const k = i / 34;
      if (k > grow) return null;
      const a = hash(i * 3.3) * Math.PI;
      const r = 20 + hash(i * 1.9) * 110 * (0.4 + grow * 0.6);
      const fx = Math.cos(a) * r;
      const fy = -Math.sin(a) * r * 0.18 - (1 - r / 140) * 14 * grow;
      return i % 3 === 0 ? <Marigold key={i} x={fx} y={fy} r={7} /> : <Hibiscus key={i} x={fx} y={fy} r={9} rot={i * 37} />;
    })}
  </g>
);

/* ---------------- dawn sky (local) ---------------- */

const DawnSky: React.FC<{ f: number; part: number; sun: number }> = ({ f, part, sun }) => (
  <g>
    <defs>
      <linearGradient id="s07-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={lerpCol("#2a2440", "#5a86b8", sun)} />
        <stop offset="55%" stopColor={lerpCol("#6a4a5a", "#f6c98a", sun)} />
        <stop offset="100%" stopColor={lerpCol("#a8684a", "#ffe6b0", sun)} />
      </linearGradient>
      <radialGradient id="s07-sun">
        <stop offset="0%" stopColor="#fff6d8" stopOpacity={0.95} />
        <stop offset="40%" stopColor="#ffd890" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#ffd890" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-600} y={-400} width={3120} height={1500} fill="url(#s07-sky)" />
    <circle cx={960} cy={560} r={420 * (0.6 + sun * 0.5)} fill="url(#s07-sun)" opacity={sun} />
    {/* rays */}
    <g style={{ mixBlendMode: "screen" }} opacity={sun * 0.5}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = -Math.PI + (i / 11) * Math.PI;
        return <path key={i} d={`M 960 560 L ${960 + Math.cos(a - 0.04) * 1800} ${560 + Math.sin(a - 0.04) * 1800} L ${960 + Math.cos(a + 0.04) * 1800} ${560 + Math.sin(a + 0.04) * 1800} Z`} fill="#fff1c8" opacity={0.18 + 0.1 * Math.sin(f * 0.05 + i)} />;
      })}
    </g>
    {/* the clouds of worry parting */}
    {Array.from({ length: 10 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const bx = 960 + side * (80 + hash(i * 2.1) * 260) + side * part * 1200 + Math.sin(f * 0.01 + i) * 10;
      const by = 150 + hash(i * 3.7) * 360;
      const sc = 0.8 + hash(i * 5.1) * 0.7;
      const col = lerpCol("#3a3040", "#f2d8c0", sun * 0.85);
      return (
        <g key={i} transform={`translate(${bx}, ${by}) scale(${sc})`} opacity={0.92 - part * 0.3}>
          <ellipse cx={0} cy={0} rx={170} ry={52} fill={col} />
          <ellipse cx={-70} cy={-24} rx={80} ry={50} fill={col} />
          <ellipse cx={50} cy={-34} rx={100} ry={64} fill={col} />
          <ellipse cx={0} cy={10} rx={160} ry={30} fill="#000" opacity={0.08} />
        </g>
      );
    })}
  </g>
);
const lerpCol = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(t)))).join(",")})`;
};

/** Courtyard set at dawn. */
const DawnCourtyard: React.FC<{ f: number; children?: React.ReactNode; goatBehindTulsi?: React.ReactNode }> = ({ f, children, goatBehindTulsi }) => (
  <>
    <Layer depth={0.12}>
      <g transform="translate(0, -420)">
        <DawnSky f={f} part={1} sun={1} />
      </g>
    </Layer>
    <Layer depth={0.55}>
      <GlowDefs />
      <CourtyardBack f={f} />
      {/* dawn wash over the night set */}
      <rect x={-400} y={150} width={2720} height={700} fill="#ffd9a0" opacity={0.18} style={{ mixBlendMode: "screen" }} />
    </Layer>
    <Layer depth={0.8}>
      <GlowDefs />
      {goatBehindTulsi}
      <TulsiMancha x={1700} y={830} f={f} s={1.1} />
    </Layer>
    <Layer depth={1}>
      <GlowDefs />
      <DivineDefs />
      <CourtyardFloor f={f} />
      {children}
    </Layer>
  </>
);

/* ================================================================== */
/* SHOT 1 — Sundar Thakur offers flowers                               */
/* ================================================================== */

const ShotOffer: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.offer.from;
  const v = voice(scene, "07a_Sundar.wav", 71);
  const RELEASE = 96;
  const cam = {
    x: track(f, [
      [0, 260],
      [100, 200, "inOut"],
      [172, 120],
    ]),
    y: track(f, [
      [0, 150],
      [172, 110],
    ]),
    zoom: track(f, [
      [0, 1.7],
      [100, 1.55, "inOut"],
      [172, 1.45],
    ]),
    focus: 1,
    dof: 2.4,
  };
  const sundar = A([
    { f: 0, bodyTurn: -0.45, headTurn: -0.35, eyeX: -0.6, eyeY: -0.3, lid: 0.35, smile: 0.4, headNod: 4, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam" },
    { f: 30, lid: 0.15, headNod: 0, eyeY: -0.5 },
    { f: 70, rS: 18, rE: -80, lS: 14, lE: -85, rHand: "cup", lHand: "cup", rProp: "flowers", lid: 0, smile: 0.6, lean: 8, in: 20 },
    { f: RELEASE, rS: 30, rE: -40, lS: 24, lE: -50, rHand: "open", lHand: "open", lean: 12, in: 8, ease: "out" },
    { f: 130, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", lean: 2, headNod: 7, lid: 0.55, smile: 0.7, in: 24 },
  ]);
  const left = (fr: number) => (fr < RELEASE ? 1 : 0);
  const glow = 1 + clamp((f - RELEASE - 10) / 40) * 0.25;
  const SHOT_LIGHTS: SceneLight[] = [
    { x: 950, y: 430, color: "#ffb060", intensity: 1.0 * glow, radius: 1600, flicker: 7 },
    { x: 2100, y: 200, color: "#ffd9a0", intensity: 0.5, radius: 2000 },
  ];
  return (
    <Stage cam={cam} opacity={clamp(f / 10)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.8}>
          <GlowDefs />
          <KaliMandap f={f} presence={glow} />
          <FlowerHeap x={960} y={624} grow={0.25 + clamp((f - RELEASE - 18) / 30) * 0.12} />
          <Thala x={1120} y={616} s={1.1} steam={1} f={f} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <Puppet
            cast={SUNDAR}
            f={f}
            x={1300}
            y={960}
            scale={1.5}
            seated
            acting={sundar}
            mouth={v.mouth}
            talk={v.talk}
            light={{ keySide: -1, rim: "#ffb060", rimStrength: 0.55 }}
            props={{ flowers: P_FLOWERS(left) }}
          />
          <PetalShower f={f} start={RELEASE} from={[1120, 700]} to={[985, 760]} n={16} seed={7} />
        </Layer>
        <Layer depth={1.3} blend="screen">
          <Bokeh f={f} n={12} seed={71} color="#ffd9a0" />
        </Layer>
        <Grade warmth={0.4} vignette={0.58} bloomAt={[42, 38]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 2 — the brothers lay flowers and bhog at the Mother's feet    */
/* ================================================================== */

const ShotBhog: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.bhog.from;
  const PLACE = 262;
  const cam = {
    x: track(f, [
      [166, 60],
      [368, 0],
    ]),
    y: track(f, [
      [166, 60],
      [368, 30],
    ]),
    zoom: track(f, [
      [166, 1.08],
      [300, 1.18],
      [368, 1.24],
    ]),
    focus: 1,
    dof: 2.2,
  };
  const babu = A([
    { f: 166, bodyTurn: 0.35, headTurn: 0.25, eyeX: 0.4, eyeY: -0.2, smile: 0.55, rS: 22, rE: -105, lS: 22, lE: -105, rHand: "hold", lHand: "hold", rProp: "thala", stride: 0.6, bodyX: -260 },
    { f: 230, bodyX: -40, stride: 0.6, ease: "linear", in: 64 },
    { f: 244, stride: 0, crouch: 0.55, lean: 10, eyeY: 0.6, in: 12 },
    { f: PLACE, rS: 45, rE: -40, lS: 45, lE: -40, rHand: "open", lHand: "open", rProp: "", in: 14 },
    { f: 300, crouch: 0.2, lean: 2, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", headNod: 6, lid: 0.5, smile: 0.7, eyeY: -0.3, in: 22 },
  ]);
  const kedar = A([
    { f: 166, bodyTurn: 0.4, headTurn: 0.3, smile: 0.5, rS: 30, rE: 35, rHand: "cup", rProp: "flowers", lS: 8, lE: -20, lHand: "relaxed" },
    { f: 200, rS: 60, rE: 25, rHand: "open", lean: 6, in: 10, ease: "out" },
    { f: 240, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", headNod: 5, lid: 0.5, smile: 0.65, in: 26 },
  ]);
  const sundar = A([{ f: 166, bodyTurn: -0.4, headTurn: -0.3, lid: 0.5, smile: 0.7, headNod: 6, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam" }]);
  const kedarLeft = (fr: number) => (fr < 200 ? 1 : 0);
  const grow = 0.37 + clamp((f - 205) / 40) * 0.25 + clamp((f - 300) / 50) * 0.38;
  const glow = 1.25 + clamp((f - PLACE) / 60) * 0.35;
  const SHOT_LIGHTS: SceneLight[] = [
    { x: 950, y: 430, color: "#ffb060", intensity: 1.0 * glow, radius: 1700, flicker: 7 },
    { x: 2100, y: 200, color: "#ffd9a0", intensity: 0.5, radius: 2200 },
  ];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.bhog.from) / DIS)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.8}>
          <GlowDefs />
          <KaliMandap f={f} presence={glow} />
          <FlowerHeap x={960} y={624} grow={grow} />
          <Thala x={1120} y={616} s={1.1} steam={1} f={f} />
          {f >= PLACE && <Thala x={820} y={616} s={1.15} steam={1} f={f} />}
          {f >= PLACE && <Glow x={960} y={560} r={180} kind="white" o={0.25 * clamp((f - PLACE) / 40)} />}
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <Puppet cast={CAST.kedarkaka} f={f} x={520} y={990} scale={1.4} acting={kedar} light={{ keySide: 1 }} props={{ flowers: P_FLOWERS(kedarLeft) }} />
          <PetalShower f={f} start={200} from={[640, 720]} to={[900, 760]} n={14} seed={11} />
          <Puppet cast={CAST.babukaka} f={f} x={980} y={1000} scale={1.45} acting={babu} light={{ keySide: 1 }} props={{ thala: P_THALA }} />
          <Puppet cast={SUNDAR} f={f} x={1450} y={990} scale={1.45} seated acting={sundar} light={{ keySide: -1, rim: "#ffb060", rimStrength: 0.55 }} />
          <PetalShower f={f} start={300} from={[1350, 650]} to={[1020, 760]} n={12} seed={19} />
        </Layer>
        <Layer depth={1.3} blend="screen">
          <Bokeh f={f} n={14} seed={72} color="#ffd9a0" />
        </Layer>
        <Grade warmth={0.4} vignette={0.56} bloomAt={[50, 40]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 3 — the clouds of worry part; a peaceful breeze               */
/* ================================================================== */

const ShotPeace: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.peace.from;
  const part = clamp((f - 372) / 70);
  const pe = part * part * (3 - 2 * part);
  const sun = 0.15 + pe * 0.85;
  const breeze = clamp((f - 400) / 20);
  const cam = {
    x: track(f, [
      [362, 0],
      [470, 0],
    ]),
    y: track(f, [
      [362, -380],
      [400, -380],
      [446, 60, "inOut"],
      [470, 70],
    ]),
    zoom: track(f, [
      [362, 1.12],
      [470, 1.05],
    ]),
    focus: 1,
    dof: 1.8,
  };
  const relief = (seed: number, turn: number): PoseKey<Pose>[] => [
    { f: 362, bodyTurn: turn, headTurn: turn * 0.5, smile: 0.35, brow: 0.2, browTilt: 0.4, rS: 6, rE: -20, lS: 6, lE: -20 },
    { f: 410 + seed, headTilt: -6, eyeY: -0.6, lid: 0.45, smile: 0.8, browTilt: 0, brow: 0.3, headNod: -4, in: 22 },
  ];
  const wA = A(relief(0, 0.3));
  const man = A(relief(6, -0.1));
  const wB = A(relief(12, -0.35));
  const sway = (base: (fr: number) => Partial<Pose>, k: number) => (fr: number) => {
    const b = base(fr);
    return { ...b, headTilt: (b.headTilt ?? 0) + Math.sin(fr * 0.06 + k) * 2 * breeze, lean: (b.lean ?? 0) + Math.sin(fr * 0.05 + k) * 1.5 * breeze };
  };
  const SHOT_LIGHTS: SceneLight[] = [{ x: 960, y: 200, color: "#ffe6b0", intensity: 0.4 + sun * 0.7, radius: 1800 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.peace.from) / DIS)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.12}>
          <g transform="translate(0, -420)">
            <DawnSky f={f} part={pe} sun={sun} />
          </g>
        </Layer>
        <Layer depth={0.55}>
          <GlowDefs />
          <CourtyardBack f={f} />
          <rect x={-400} y={150} width={2720} height={700} fill="#ffd9a0" opacity={0.2 * sun} style={{ mixBlendMode: "screen" }} />
          <Garland x1={-300} y1={300} x2={2220} y2={300} sag={60 + Math.sin(f * 0.1) * 10 * breeze} s={1.2} f={f * (1 + breeze)} seed={5} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <CourtyardFloor f={f} />
          <Puppet cast={CAST.womanA} f={f} x={620} y={990} scale={1.42} acting={sway(wA, 1)} />
          <Puppet cast={CAST.manorama} f={f} x={960} y={1000} scale={1.48} acting={sway(man, 2)} />
          <Puppet cast={CAST.womanB} f={f} x={1300} y={990} scale={1.42} acting={sway(wB, 3)} />
        </Layer>
        <Layer depth={1.15}>
          <BreezePetals f={f - 400} n={26} seed={5} strength={breeze} />
        </Layer>
        <Grade warmth={0.35 + sun * 0.1} vignette={0.5} bloomAt={[50, 30]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 4 — "who was the happiest of all — do you know?"              */
/* ================================================================== */

const ShotQuestion: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.question.from;
  const cam = {
    x: track(f, [
      [464, -380],
      [540, 120, "inOut"],
      [575, 560, "inOut"],
      [598, 600],
    ]),
    y: track(f, [
      [464, 90],
      [598, 140],
    ]),
    zoom: track(f, [
      [464, 1.45],
      [540, 1.4],
      [575, 1.75, "inOut"],
      [598, 1.8],
    ]),
    focus: 1,
    dof: 2.4,
  };
  const kid = (seed: number, turn: number): PoseKey<Pose>[] => [
    { f: 464, bodyTurn: turn, headTurn: turn, smile: 0.7, rS: 6, rE: -20, lS: 6, lE: -20 },
    { f: 500 + seed, headTilt: 8 * Math.sign(turn || 1), eyeX: 0.5, brow: 0.6, smile: 0.85, in: 12 },
    { f: 545 + seed, headTurn: 0.6, eyeX: 0.9, brow: 0.7, headTilt: 0, in: 14 },
  ];
  const peek = clamp((f - 556) / 14);
  const SHOT_LIGHTS: SceneLight[] = [{ x: 2100, y: 200, color: "#ffd9a0", intensity: 0.7, radius: 2400 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.question.from) / DIS)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <DawnCourtyard
          f={f}
          goatBehindTulsi={
            <g opacity={peek}>
              <LittleGoat f={f} x={1560 - 40 * peek} y={760 + (1 - peek) * 20} s={1.2} flip look={0.5} />
            </g>
          }
        >
          <Puppet cast={CAST.babukaka} f={f} x={330} y={1000} scale={1.45} acting={A(kid(0, 0.3))} />
          {/* "সবচেয়ে বেশি খুশি কে হয়েছিল জানো?" (473-585): Gopal raises a hand to ask; starts 8f before the line, back to rest 20f after it ends */}
          <Puppet
            cast={CAST.gopal}
            f={f}
            x={640}
            y={1010}
            scale={1.5}
            acting={A([...kid(4, 0.2), { f: 475, rS: 66, rE: 80, rHand: "open", headTilt: 6, in: 10 }, { f: 605, rS: 6, rE: -20, rHand: "relaxed", headTilt: 0, in: 14 }])}
          />
          <Puppet cast={CAST.madhu} f={f} x={860} y={1000} scale={1.4} acting={A(kid(8, 0.1))} />
          <Puppet cast={CAST.rama} f={f} x={1080} y={1010} scale={1.5} acting={A(kid(12, 0.3))} />
        </DawnCourtyard>
        <Layer depth={1.3} blend="screen">
          <Bokeh f={f} n={10} seed={74} color="#ffe6b0" />
        </Layer>
        <Grade warmth={0.42} vignette={0.52} bloomAt={[70, 30]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 5 — the spared little goat blesses the calm newborn           */
/* ================================================================== */

const MAN_X = 1080;

const ShotGoat: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.goat.from;
  // the goat bounds in from behind the tulsi, then comes to the baby
  const gx = track(f, [
    [592, 1640],
    [620, 1560],
    [672, 1230, "out"],
    [830, 1230],
  ]);
  const moving = f < 672 ? 1 : 0;
  const hop = moving ? Math.abs(Math.sin((f - 592) * 0.32)) * (f < 640 ? 1 : 0.6) : 0;
  const rear = track(f, [
    [690, 0],
    [712, 1, "inOut"],
    [760, 1],
    [782, 0.4, "inOut"],
  ]);
  const bleat = (f > 604 && f < 618) || (f > 724 && f < 736) ? 0.8 : 0;
  const cam = {
    x: track(f, [
      [592, 520],
      [672, 260, "inOut"],
      [756, 160, "inOut"],
      [830, 150],
    ]),
    y: track(f, [
      [592, 150],
      [672, 120],
      [756, 150, "inOut"],
      [830, 140],
    ]),
    zoom: track(f, [
      [592, 1.5],
      [672, 1.35, "inOut"],
      [756, 1.72, "inOut"],
      [830, 1.85],
    ]),
    focus: 1,
    dof: 2.6,
  };
  const man = A([
    { f: 592, bodyTurn: 0.2, headTilt: 6, eyeY: 0.8, eyeX: 0.2, smile: 0.85, lid: 0.15, rS: 5, rE: -95, lS: 5, lE: -95 },
    { f: 612, headTurn: 0.45, eyeX: 0.9, eyeY: 0.4, brow: 0.5, smile: 1, in: 10 },
    { f: 700, headTurn: 0.2, eyeX: 0.4, eyeY: 0.9, headTilt: 9, lid: 0.25, in: 18 },
  ]);
  const wA = A([
    { f: 592, bodyTurn: 0.4, headTurn: 0.5, eyeX: 0.8, smile: 0.7, rS: 6, rE: -20, lS: 6, lE: -20 },
    { f: 640, rS: -14, rE: -170, rHand: "open", smile: 1, lid: 0.35, headTilt: -6, in: 12 },
    { f: 700, rS: 6, rE: -20, rHand: "relaxed", in: 18 },
  ]);
  const armY = 1000 - 200 * 1.45;
  const babyX = MAN_X - 10;
  const babyY = armY - 14;
  const bless = track(f, [
    [712, 0],
    [752, 0.6, "out"],
    [800, 0.45],
  ]);
  const love = clamp((f - 700) / 30) * clamp((830 - f) / 20);
  const SHOT_LIGHTS: SceneLight[] = [
    { x: 2100, y: 200, color: "#ffd9a0", intensity: 0.7, radius: 2400 },
    { x: babyX, y: babyY, color: "#FFF4D6", intensity: 0.5 + love * 0.4, radius: 700 },
  ];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.goat.from) / DIS) * clamp((830 - f) / 14)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <DawnCourtyard f={f}>
          <Puppet cast={CAST.womanA} f={f} x={640} y={990} scale={1.4} acting={wA} />
          <Puppet cast={CAST.manorama} f={f} x={MAN_X} y={1000} scale={1.45} acting={man} light={{ keySide: 1, rim: "#FFE7AE", rimStrength: 0.5 }} />
          <BabyThakur
            f={f}
            x={babyX}
            y={babyY}
            s={1.25}
            open={1}
            aura={1}
            rot={-10}
            headRoll={-16}
            smile={track(f, [[592, 0.45], [720, 0.85]])}
            lookX={track(f, [[592, 0.3], [640, 0.9], [700, 0.7]])}
            lookY={track(f, [[592, -0.2], [700, 0.35]])}
            turn={track(f, [[592, 0.1], [650, 0.4]])}
            bless={bless}
            wiggle={1 + love * 0.4}
          />
          <LittleGoat f={f} x={gx} y={930} s={1.5} flip hop={hop} walk={moving} rear={rear} bleat={bleat} look={rear * 0.8} />
          {/* love → blessing: soft gold rising between goat and child */}
          {love > 0.01 && (
            <g style={{ mixBlendMode: "screen" }}>
              <Motes f={f} x={(gx + babyX) / 2 + 40} y={babyY + 40} n={14} spread={140} rise={-90} seed={77} o={love} />
              <Glow x={(gx + babyX) / 2 + 30} y={babyY + 20} r={120} kind="white" o={0.22 * love} />
            </g>
          )}
        </DawnCourtyard>
        <Layer depth={1.3} blend="screen">
          <Bokeh f={f} n={12} seed={75} color="#FFE7AE" size={[14, 36]} />
        </Layer>
        <Layer depth={1.15}>
          <BreezePetals f={f} n={14} seed={9} strength={0.7} />
        </Layer>
        <Grade warmth={0.42} vignette={0.56} bloomAt={[48, 46]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */

export const Scene07Flowers: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const seq = (k: keyof typeof SHOTS, el: React.ReactNode, last = false) => (
    <Sequence from={SHOTS[k].from} durationInFrames={SHOTS[k].to - SHOTS[k].from + (last ? 0 : DIS)} layout="none">
      {el}
    </Sequence>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
      {seq("offer", <ShotOffer scene={scene} />)}
      {seq("bhog", <ShotBhog />)}
      {seq("peace", <ShotPeace />)}
      {seq("question", <ShotQuestion />)}
      {seq("goat", <ShotGoat />, true)}
    </div>
  );
};

/** Sound bed (no voices): dawn birds, village peace music, chimes on the offerings, the goat's happy bleats. Scene-local frames. */
export const Scene07SoundBed: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const end = (fr: number) => interpolate(fr, [0, 20, 800, 830], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Audio src={staticFile(`audio/ambient/${scene.ambientBed}`)} loop volume={(fr) => 0.18 * end(fr)} />
      <Audio src={staticFile(`audio/music/${scene.musicCue}`)} loop volume={(fr) => 0.13 * end(fr)} />
      {[96, 200, 300].map((at) => (
        <Sequence key={at} from={at} durationInFrames={60} layout="none">
          <Audio src={staticFile("audio/sfx/chime_pop.wav")} volume={0.25} />
        </Sequence>
      ))}
      <Sequence from={380} durationInFrames={120} layout="none">
        <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={0.2} />
      </Sequence>
      {[604, 724].map((at) => (
        <Sequence key={at} from={at} durationInFrames={60} layout="none">
          <Audio src={staticFile("audio/sfx/goat_bleat_happy.wav")} volume={0.55} />
        </Sequence>
      ))}
      <Sequence from={712} durationInFrames={118} layout="none">
        <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={0.3} />
      </Sequence>
    </>
  );
};

export const Scene07Demo: React.FC = () => {
  const scene = SCENE07;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene07Flowers scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
        <Scene07SoundBed scene={scene} />
      </DuckProvider>
      <CueSubtitles cues={SCENE07_CUES} />
    </div>
  );
};
