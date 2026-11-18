import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "../audio/Mix";
import { EPISODE_01_SCENES } from "../../data/episode01Data";
import { SceneTiming } from "../../types/studio";
import { clamp, makeActing, noise1, PoseKey, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { BabyThakur, DivineDefs, Motes } from "../divine/Divine";
import { Bokeh, Glow, GlowDefs } from "../fx/Fx";
import { CAST } from "../rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../rig/lipsync";
import { BASE_POSE, CastMember, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../rig/Puppet";
import { CueSubtitles } from "../Scene02Demo";
import { AmavasyaSky, LaneBackdrop, LaneWall } from "../sets/Exteriors";
import { BaithakWall, Bolster, CourtyardBack, CourtyardFloor, HurricaneLantern, Takhat } from "../sets/Interiors";
import { Bolt, DakshaShadow, KosthiChart, lightning, Madur, Rain, Splashes, SutikaRoom } from "../sets/S05_Sets";

/**
 * Episode 1 · Scene 05 — "Rain Memory and the Mystic".
 *  1. Sutika-ghar: Manorama consoles the tearful Charu beside the newborn (Level 1, steady).
 *  2. Charu remembers — rain gathers in the window.
 *  3. FLASHBACK (cool slate monsoon, Manasa-puja evening): the Pagol in the storm — "ভয় নেই… আসছে!"
 *  4. Baithak: Sundar Thakur — Daksha's yajna as shadow-play, the kosthi chart, the sannyas-yoga.
 *     "এ যে জন্মসন্ন্যাসী!" → the newborn, Level 1–2 hint.
 *  5. Night lane: the Pagol returns, dancing — "এসেছেরে, এসেছে! … পরে বুঝবে!"
 */

export const SCENE05 = EPISODE_01_SCENES.find((s) => s.sceneId === "05_rain_flashback_and_mystic")!;

const SHOTS = {
  room: { from: 0, to: 299 }, // Manorama consoles Charu
  charu: { from: 293, to: 566 }, // Charu: "জানো দিদি…" → the memory
  flash: { from: 560, to: 716 }, // flashback: Pagol in the storm
  sundar: { from: 710, to: 1175 }, // Sundar Thakur (with inserts)
  chart1: { from: 903, to: 980 }, // insert: "দেখি তো গ্রহ কী বলে…"
  chart2: { from: 1052, to: 1118 }, // insert: "এত বড় সন্ন্যাসযোগ…"
  baby: { from: 1112, to: 1175 }, // insert: "এ যে জন্মসন্ন্যাসী!"
  lane: { from: 1169, to: 1342 }, // Pagol returns
};
const DIS = 6;
const STRIKES = [566, 604, 650, 694];

export const SCENE05_CUES = [
  { from: 0, to: 62, who: "মনোরমা দেবী", text: "চারু, তোর চোখে জল কেন রে?" },
  { from: 70, to: 124, who: "মনোরমা দেবী", text: "তোর তো কোনো কষ্টই হয়নি!" },
  { from: 132, to: 194, who: "মনোরমা দেবী", text: "যা হয়েছে, ভালোর জন্যই হয়েছে।" },
  { from: 200, to: 291, who: "মনোরমা দেবী", text: "ভগবান যা করেন, মঙ্গলের জন্যই করেন।" },
  { from: 299, to: 444, who: "চারু", text: "জানো দিদি, আমার মন বলছিল এবার আমার সন্তান অন্যরকম হবে।" },
  { from: 472, to: 562, who: "চারু", text: "সেই মনসাপূজোর ঝড়-বৃষ্টির সন্ধ্যার কথা মনে আছে?" },
  { from: 569, to: 630, who: "পাগল", text: "ভয় নেই, ভয় নেই—" },
  { from: 633, to: 668, who: "পাগল", text: "আসছে, আসছে!" },
  { from: 668, to: 712, who: "পাগল", text: "এলে আবার আসবো!" },
  { from: 720, to: 811, who: "সুন্দর ঠাকুর", text: "দক্ষ রাজার যজ্ঞ নষ্ট করেছিলেন মহাদেব…" },
  { from: 820, to: 896, who: "সুন্দর ঠাকুর", text: "আর এ শিশুও আমাদের পূজোর মাঝখানে এল!" },
  { from: 917, to: 978, who: "সুন্দর ঠাকুর", text: "দেখি তো গ্রহ কী বলে…" },
  { from: 978, to: 1050, who: "সুন্দর ঠাকুর", text: "আরে! এ কী দেখছি!" },
  { from: 1062, to: 1110, who: "সুন্দর ঠাকুর", text: "এত বড় সন্ন্যাসযোগ…" },
  { from: 1118, to: 1170, who: "সুন্দর ঠাকুর", text: "এ যে জন্মসন্ন্যাসী!" },
  { from: 1182, to: 1242, who: "পাগল", text: "হ্যাঁ, হ্যাঁ… এসেছেরে, এসেছে!" },
  { from: 1270, to: 1334, who: "পাগল", text: "পরে বুঝবে… পরে বুঝবে!" },
];

/* ---------------- cast (scene-local) ---------------- */

const skinDeep = { skin: "#b97a52", skinLight: "#d89a70", skinShade: "#8d5536", lips: "#94493f" };
const skinWarm = { skin: "#d9a07a", skinLight: "#f0c4a0", skinShade: "#b47853", lips: "#b0605a" };

/** The wandering mystic (পাগল): wiry, wild hair, ochre rags, bamboo staff. */
const PAGOL: CastMember = {
  id: "pagol",
  age: "adult",
  height: 1.0,
  girth: 0.86,
  ...skinDeep,
  hair: "#2a2420",
  hairLight: "#6a5a50",
  hairStyle: "tousled",
  outfit: "bare",
  top: "#b97a52",
  topLight: "#d89a70",
  topShade: "#8d5536",
  sleeve: "none",
  lower: "dhoti",
  lowerColor: "#c98a3a",
  lowerShade: "#9a6424",
  lowerTrim: "#7a3a14",
  dhotiLength: "knee",
  scarf: { color: "#b8702a", shade: "#8a4e1a", trim: "#5a2a10", style: "drape" },
  mustache: "#3a302a",
  wiry: true,
  face: { faceLen: 1.22, jaw: 0.7 },
  seed: 131,
};

/** Sundar Thakur — family elder and jyotishi: spectacles, white kurta, brown shawl. */
const SUNDAR: CastMember = {
  id: "sundar",
  age: "elder",
  height: 1.0,
  girth: 1.0,
  ...skinWarm,
  hair: "#d6cfc4",
  hairLight: "#ffffff",
  hairStyle: "balding",
  outfit: "kurta",
  top: "#f2ead8",
  topLight: "#fffaf0",
  topShade: "#cbbda2",
  topTrim: "#b08a3a",
  sleeve: "full",
  lower: "dhoti",
  lowerColor: "#faf5eb",
  lowerShade: "#d8cdb9",
  lowerTrim: "#8a2a1a",
  dhotiLength: "calf",
  scarf: { color: "#7a5236", shade: "#5a3a24", trim: "#c9a04a", style: "shawl" },
  mustache: "#d6cfc4",
  glasses: true,
  tilak: true,
  seed: 151,
};

/* ---------------- helpers ---------------- */

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

const voice = (scene: SceneTiming, file: string, seed: number) => {
  const clip = scene.clips.find((c) => c.file === file);
  return {
    mouth: (fr: number): MouthState => (clip ? visemeFromEnvelope(clip.rmsEnvelope, fr - clip.offsetFrame, seed, clip.subtitleBn) : MOUTH_REST),
    talk: (fr: number) => (clip ? speechLevel(clip.rmsEnvelope, fr - clip.offsetFrame) : 0),
  };
};

const P_STAFF: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale})`}>
    <line x1={0} y1={-120} x2={0} y2={150} stroke="#8a6a3a" strokeWidth={7} strokeLinecap="round" />
    {[-90, -40, 20, 80].map((y) => (
      <line key={y} x1={-4} y1={y} x2={4} y2={y} stroke="#5a4020" strokeWidth={3} />
    ))}
  </g>
);
const P_SCROLL: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale}) rotate(90)`}>
    <rect x={-10} y={-8} width={50} height={16} rx={8} fill="#e8d4a8" />
    <rect x={-12} y={-9} width={6} height={18} rx={3} fill="#a8282a" />
  </g>
);
const P_THALA: PropRenderer = ({ f, scale }) => (
  <g transform={`scale(${scale})`}>
    <ellipse cx={0} cy={6} rx={34} ry={8} fill="#a87420" />
    <ellipse cx={0} cy={2} rx={32} ry={7} fill="#e0aa3e" />
    <circle cx={-12} cy={-2} r={5} fill="#d0121e" />
    <circle cx={10} cy={-3} r={5} fill="#ffb02e" />
    <ellipse cx={0} cy={-2} rx={6} ry={3} fill="#8a4a24" />
    <path d={`M -3 -4 Q 0 ${-16 - Math.sin(f * 0.5) * 2} 3 -4 Z`} fill="#ffd27a" />
  </g>
);

/** Cut camera: a list of [from, x, y, zoom, pushZoom?] segments; each holds and pushes slightly, with hard cuts between. */
type Cut = [number, number, number, number, number?, number?, number?];
const cutCam = (f: number, cuts: Cut[], end: number) => {
  let i = cuts.length - 1;
  while (i > 0 && f < cuts[i][0]) i--;
  const [from, x, y, z, z2 = z, x2 = x, y2 = y] = cuts[i];
  const to = i + 1 < cuts.length ? cuts[i + 1][0] : end;
  const t = clamp((f - from) / Math.max(1, to - from));
  const e = t * t * (3 - 2 * t);
  return { x: x + (x2 - x) * e, y: y + (y2 - y) * e, zoom: z + (z2 - z) * e };
};

/* ================================================================== */
/* The sutika-ghar (shared by shots 1, 2 and the baby insert)          */
/* ================================================================== */

const CHARU_X = 640;
const CHARU_Y = 900;
const BABY = { x: 980, y: 860 };
const MAN_X = 1340;
const MAN_Y = 950;

const RoomSet: React.FC<{ f: number; rainInWindow?: number; children?: React.ReactNode; baby?: React.ReactNode; fore?: React.ReactNode }> = ({ f, rainInWindow = 0, children, baby, fore }) => (
  <>
    <Layer depth={0.9}>
      <GlowDefs />
      <SutikaRoom f={f} rainInWindow={rainInWindow} />
    </Layer>
    <Layer depth={1}>
      <GlowDefs />
      <DivineDefs />
      <Madur x={960} y={905} s={1.05} />
      {baby}
      {children}
    </Layer>
    {fore}
  </>
);

const ROOM_LIGHTS = (f: number): SceneLight[] => [
  { x: 1560, y: 450, color: "#ffb04a", intensity: 0.8, radius: 1300, flicker: 6 },
  { x: BABY.x - 40, y: BABY.y - 20, color: "#FFF4D6", intensity: 0.35 + 0.05 * Math.sin(f * 0.05), radius: 650 },
];

const Baby: React.FC<{ f: number; aura?: number; bless?: number; lookX?: number; lookY?: number; s?: number; x?: number; y?: number }> = ({ f, aura = 1, bless = 0, lookX = 0.1, lookY = 0, s = 1.2, x = BABY.x, y = BABY.y }) => (
  <BabyThakur f={f} x={x} y={y} s={s} open={1} aura={aura} smile={0.5} bless={bless} lookX={lookX} lookY={lookY} turn={0.15} headRoll={-48} wiggle={0.8} />
);

/* ================================================================== */
/* SHOT 1 — Manorama consoles Charu                                    */
/* ================================================================== */

const ShotRoom: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.room.from;
  const vm = voice(scene, "05a_Manorama.wav", 61);
  const c = cutCam(
    f,
    [
      [0, 20, 60, 1.12, 1.16], // two-shot
      [68, -320, 110, 2.15, 2.25], // CU Charu, tearful
      [128, 380, -20, 1.95, 2.05], // MCU Manorama
      [206, 20, 300, 2.4, 2.75], // insert: the newborn — "ভগবান যা করেন…"
    ],
    299,
  );
  const cam = { ...c, focus: 1, dof: 2.2 };
  const charu = A([
    { f: 0, bodyTurn: 0.3, headTurn: 0.35, eyeX: 0.6, eyeY: 0.6, headNod: 6, tears: 1, brow: 0.5, browTilt: 0.8, smile: 0.1, lid: 0.25, rS: -4, rE: -35, lS: -4, lE: -35, rHand: "relaxed", lHand: "relaxed" },
    { f: 40, headTurn: 0.55, eyeX: 0.9, eyeY: -0.2, headNod: 0, lid: 0, in: 14 }, // looks up at didi
    { f: 96, headNod: 4, eyeY: 0.3, lS: -10, lE: -150, lHand: "open", in: 12 }, // wipes a tear
    { f: 130, lS: -4, lE: -35, lHand: "relaxed", smile: 0.25, browTilt: 0.5, in: 14 },
    { f: 210, headTurn: 0.4, eyeX: 0.6, eyeY: 0.7, headNod: 6, smile: 0.4, lid: 0.2, in: 20 }, // looks down at the baby
  ]);
  const man = A([
    { f: 0, bodyTurn: -0.5, headTurn: -0.45, eyeX: -0.8, eyeY: 0.5, headNod: 6, brow: 0.6, browTilt: 0.6, smile: 0.2, rS: 8, rE: -15, rHand: "relaxed", lS: 8, lE: -20 },
    { f: 30, lS: 20, lE: 30, lHand: "open", headTilt: -6, in: 12 },
    { f: 74, lS: 26, lE: 50, lHand: "open", brow: 0.9, headNod: 2, in: 10 }, // "কোনো কষ্টই হয়নি!"
    { f: 132, rS: -6, rE: -150, rHand: "open", lS: 8, lE: -20, lHand: "relaxed", smile: 0.5, brow: 0.4, browTilt: 0.2, in: 14 }, // hand to heart
    { f: 202, headTurn: -0.2, eyeY: -0.5, eyeX: -0.2, rS: 70, rE: 40, rHand: "open", in: 18 }, // gestures upward: Bhagavan
    { f: 250, headTurn: -0.5, eyeX: -0.6, eyeY: 0.7, rS: 18, rE: -40, smile: 0.6, in: 20 }, // back to the child
  ]);
  return (
    <Stage cam={cam} opacity={clamp(f / 10)}>
      <SceneLights.Provider value={ROOM_LIGHTS(f)}>
        <RoomSet f={f} baby={<Baby f={f} aura={1} bless={track(f, [[226, 0], [262, 0.45, "out"], [299, 0.3]])} lookY={track(f, [[206, 0.1], [250, -0.3]])} />}>
          <Puppet cast={CAST.charu} f={f} x={CHARU_X} y={CHARU_Y} scale={1.5} seated acting={charu} light={{ keySide: 1 }} />
          <Puppet cast={CAST.manorama} f={f} x={MAN_X} y={MAN_Y} scale={1.55} acting={man} mouth={vm.mouth} talk={vm.talk} light={{ keySide: -1 }} />
        </RoomSet>
        <Layer depth={1.25} blend="screen">
          <Bokeh f={f} n={8} seed={51} />
        </Layer>
        <Grade warmth={0.4} vignette={0.62} bloomAt={[52, 60]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 2 — Charu: "জানো দিদি…" — the memory gathers                   */
/* ================================================================== */

const ShotCharu: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.charu.from;
  const vc = voice(scene, "05b_Charu.wav", 23);
  const c = cutCam(
    f,
    [
      [293, -300, 110, 2.1, 2.25], // CU Charu (Manorama soft at frame edge)
      [400, 380, -10, 1.95, 2.0], // reaction: Manorama listens, smiles
      [446, -330, 90, 2.3, 2.95, -380, 60], // slow push: Charu's eyes drift to the window
    ],
    566,
  );
  const cam = { ...c, focus: 1, dof: 2.4 };
  const charu = A([
    { f: 293, bodyTurn: 0.3, headTurn: 0.55, eyeX: 0.9, eyeY: -0.1, tears: 0.6, brow: 0.4, browTilt: 0.4, smile: 0.35, rS: -4, rE: -35, lS: -4, lE: -35 },
    { f: 330, lS: -8, lE: -150, lHand: "open", smile: 0.5, browTilt: 0.2, in: 14 }, // hand on heart: "আমার মন বলছিল"
    { f: 400, headTurn: 0.45, eyeY: 0.6, eyeX: 0.6, headNod: 5, in: 14 }, // looks at the child
    { f: 446, lS: -4, lE: -35, lHand: "relaxed", bodyTurn: -0.15, headTurn: -0.4, headTilt: -5, eyeX: -1, eyeY: -0.45, smile: 0.15, lid: 0.15, brow: 0.6, in: 26 }, // drifts to the window
    { f: 520, lid: 0.3, eyeY: -0.5, in: 30 },
  ]);
  const man = A([
    { f: 293, bodyTurn: -0.5, headTurn: -0.45, eyeX: -0.8, eyeY: 0.5, headNod: 6, smile: 0.55, rS: 18, rE: -40, lS: 8, lE: -20 },
    { f: 410, headTilt: -8, headNod: 8, smile: 0.7, brow: 0.5, in: 16 },
    { f: 470, headTilt: 0, brow: 0.8, browTilt: 0.5, smile: 0.2, in: 18 }, // "মনে আছে?" — she remembers too
  ]);
  const rainIn = clamp((f - 470) / 60);
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.charu.from) / DIS)}>
      <SceneLights.Provider value={ROOM_LIGHTS(f)}>
        <RoomSet f={f} rainInWindow={rainIn} baby={<Baby f={f} />}>
          <Puppet cast={CAST.charu} f={f} x={CHARU_X} y={CHARU_Y} scale={1.5} seated acting={charu} mouth={vc.mouth} talk={vc.talk} light={{ keySide: 1 }} />
          <Puppet cast={CAST.manorama} f={f} x={MAN_X} y={MAN_Y} scale={1.55} acting={man} light={{ keySide: -1 }} />
        </RoomSet>
        {/* the memory: cool light creeps in from the window */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 22% 35%, rgba(120,150,200,0.35) 0%, rgba(0,0,0,0) 55%)", mixBlendMode: "screen", opacity: rainIn }} />
        <Grade warmth={0.4 - rainIn * 0.25} vignette={0.62 + rainIn * 0.1} bloomAt={[30, 40]} flash={lightning(f, [548]) * 0.35} flashColor="#cfe0ff" />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 3 — FLASHBACK: Manasa-puja evening, the Pagol in the storm      */
/* ================================================================== */

const ShotFlash: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.flash.from;
  const vp = voice(scene, "05c_Pagol_Flashback.wav", 77);
  const fl = lightning(f, STRIKES);
  const c = cutCam(
    f,
    [
      [560, 120, 40, 1.05, 1.12], // wide: the storm, the Pagol at the gate
      [630, 140, -60, 2.0, 2.15], // CU Pagol pointing: "আসছে, আসছে!"
      [668, -120, 40, 1.25, 1.15, -60, 50], // reverse wide over Charu: he turns and goes into the rain
    ],
    716,
  );
  const cam = { ...c, focus: 1, dof: 2.0, shake: fl * 4 };
  const pagolWalk = (fr: number) => clamp((fr - 684) / 40);
  const pagol = A([
    { f: 560, bodyTurn: -0.25, stride: 0.6, headTurn: -0.3, eyeX: -0.8, brow: 1, browTilt: -0.3, gasp: 0.2, smile: 0.2, lS: 150, lE: 10, lHand: "open", rS: 25, rE: -20, rHand: "hold", rProp: "staff", headTilt: 8 },
    { f: 580, stride: 0, lS: 160, lE: 20, headTilt: -6, in: 10 },
    { f: 600, lS: 140, lE: -10, headTilt: 8, in: 10 },
    { f: 630, bodyTurn: -0.45, headTurn: -0.5, lS: 95, lE: 0, lHand: "point", brow: 0.8, smile: 0.2, lid: 0, in: 6, ease: "snap" }, // points at Charu
    { f: 650, lS: 100, lE: 10, headNod: 6, in: 8 },
    { f: 670, bodyTurn: 0.6, headTurn: 0.4, eyeX: 0.4, lS: 160, lE: 30, lHand: "open", smile: 0.7, in: 12 },
    { f: 690, stride: 0.8, bodyTurn: 0.75, headTurn: -0.4, eyeX: -0.8, lS: 130, lE: 20, in: 12 }, // looks back once, laughing
  ]);
  const pagolLive = (fr: number) => {
    const b = pagol(fr);
    return { ...b, bodyX: (b.bodyX ?? 0) + pagolWalk(fr) * 520, lean: (b.lean ?? 0) + Math.sin(fr * 0.3) * 3 };
  };
  const charu = A([
    { f: 560, bodyTurn: 0.45, headTurn: 0.35, eyeX: 0.7, brow: 0.9, browTilt: 0.9, gasp: 0.4, smile: 0, rS: 8, rE: -95, rHand: "hold", rProp: "thala", lS: -10, lE: -150, lHand: "open" },
    { f: 612, gasp: 0.2, lean: -4, headNod: -3, in: 6, ease: "snap" }, // flinches at the thunder
    { f: 640, brow: 0.6, browTilt: 0.4, gasp: 0, eyeX: 0.9, headNod: 2, lean: 0, in: 14 }, // listens: "আসছে…"
    { f: 690, brow: 0.5, browTilt: 0.1, smile: 0.2, headTurn: 0.5, in: 20 },
  ]);
  const SHOT_LIGHTS: SceneLight[] = [
    { x: 300, y: 560, color: "#ffb04a", intensity: 0.5, radius: 700, flicker: 3 }, // Charu's thala lamp
    { x: 980, y: -200, color: "#cfe0ff", intensity: fl * 0.7, radius: 2400 },
  ];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.flash.from) / 10)}>
      <div style={{ position: "absolute", inset: 0, filter: `saturate(0.42) brightness(${0.82 + fl * 0.22}) contrast(1.06)` }}>
        <SceneLights.Provider value={SHOT_LIGHTS}>
          <Layer depth={0.12}>
            <rect x={-400} y={-400} width={2720} height={1200} fill="#1a2232" />
            <g transform="translate(0, -560)" opacity={0.5}>
              <AmavasyaSky f={f} dark={0.6} horizonGlow={0} />
            </g>
            {STRIKES.map((s, i) => (
              <Bolt key={s} f={f} at={s} x={300 + i * 420} seed={i + 4} />
            ))}
          </Layer>
          <Layer depth={0.55}>
            <GlowDefs />
            <CourtyardBack f={f} />
          </Layer>
          <Layer depth={0.6} blend="screen">
            <Rain f={f} n={180} seed={2} o={0.5} len={38} width={1.2} />
          </Layer>
          <Layer depth={1}>
            <GlowDefs />
            <CourtyardFloor f={f} />
            {/* puddles reflecting the sky */}
            {[400, 1100, 1600].map((x, i) => (
              <ellipse key={x} cx={x} cy={950 + i * 30} rx={180} ry={26} fill="#8aa4c8" opacity={0.18 + fl * 0.3} />
            ))}
            <Splashes f={f} n={60} seed={5} />
            <Puppet cast={CAST.charu} f={f} x={300} y={830} scale={1.35} acting={charu} light={{ keySide: 1, rim: "#9fb8e0", rimStrength: 0.5 }} props={{ thala: P_THALA }} />
            <Puppet cast={PAGOL} f={f} x={1180} y={960} scale={1.6} acting={pagolLive} mouth={vp.mouth} talk={vp.talk} light={{ keySide: -1, rim: "#b8d0ff", rimStrength: 0.8 }} props={{ staff: P_STAFF }} />
          </Layer>
          <Layer depth={1.3} blend="screen">
            <Rain f={f} n={140} seed={9} o={0.85} len={80} width={2.6} speed={84} />
          </Layer>
          <Grade warmth={0} vignette={0.75} tint="#5a7aa8" tintAmount={0.45} flash={fl * 0.28} flashColor="#dfe8ff" grain={0.1} />
        </SceneLights.Provider>
      </div>
      {/* memory frame: soft dark edges + a faint watery border */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 220px 80px rgba(8,12,24,0.85)" }} />
      {/* entry / exit flashes */}
      <div style={{ position: "absolute", inset: 0, background: "#e8f0ff", opacity: Math.max(clamp(1 - (f - 560) / 12), clamp((f - 704) / 12)) * 0.85 }} />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 4 — Baithak: Sundar Thakur and the kosthi                      */
/* ================================================================== */

const SUN_X = 860;
const SUN_Y = 842;

const ShotSundar: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.sundar.from;
  const vs = voice(scene, "05d_Sundar.wav", 13);
  const c = cutCam(
    f,
    [
      [710, 280, 10, 1.1, 1.18], // wide: Sundar, the shadow-play rises on the wall
      [815, -60, 70, 1.9, 2.0], // MCU Sundar: "আর এ শিশুও…" gesturing to the inner room
      [860, 620, 80, 1.9, 1.95], // reaction: Babu listens
      [895, -60, 70, 1.9, 1.95], // back to Sundar, unrolls the chart
      [975, -100, 20, 2.5, 2.7], // CU: "আরে! এ কী দেখছি!"
      [1110, -100, 20, 2.7, 2.75],
    ],
    1175,
  );
  const cam = { ...c, focus: 1, dof: 2.2 };
  const shadow = track(f, [
    [722, 0],
    [800, 1, "inOut"],
    [818, 1],
    [832, 0],
  ]);
  const sundar = A([
    { f: 710, bodyTurn: 0.25, headTurn: 0.3, eyeX: 0.5, brow: 0.5, browTilt: 0.2, smile: 0, rS: 30, rE: 20, rHand: "open", lS: 10, lE: -60, lHand: "hold", lProp: "scroll", lid: 0.2 },
    { f: 745, rS: 80, rE: 30, headTilt: -5, brow: 0.8, in: 14 }, // the story of Mahadev
    { f: 790, rS: 120, rE: 10, rHand: "point", eyeY: -0.5, eyeX: 0.2, in: 14 }, // points up at the wall
    { f: 822, bodyTurn: -0.35, headTurn: -0.5, eyeX: -0.9, eyeY: 0, rS: 60, rE: 30, rHand: "open", brow: 0.6, browTilt: 0.4, in: 12 }, // toward the inner room
    { f: 900, bodyTurn: 0.1, headTurn: 0.05, eyeX: 0, eyeY: 0.7, headNod: 10, rS: 10, rE: -95, rHand: "hold", lS: 10, lE: -95, lHand: "hold", lProp: "", lid: 0.25, brow: 0.3, in: 14 }, // reads the chart
    { f: 978, headNod: -4, eyeY: 0.1, lid: 0, brow: 1, browTilt: -0.2, gasp: 0.5, lean: -6, in: 5, ease: "snap" }, // "আরে!"
    { f: 1010, headNod: 2, gasp: 0.2, rS: 40, rE: 10, rHand: "open", in: 12 },
    { f: 1062, headTurn: -0.3, eyeX: -0.7, eyeY: 0, gasp: 0, brow: 0.8, browTilt: 0.6, lean: 0, rS: 10, rE: -95, rHand: "hold", in: 16 },
    { f: 1118, headTurn: -0.45, headNod: 6, lid: 0.3, brow: 0.6, browTilt: 0.9, smile: 0.25, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "open", lHand: "open", in: 18 }, // pranam: জন্মসন্ন্যাসী
  ]);
  const babu = A([
    { f: 710, bodyTurn: -0.45, headTurn: -0.4, eyeX: -0.8, brow: 0.4, smile: 0.2, rS: -4, rE: -35, lS: -4, lE: -35 },
    { f: 830, headTurn: -0.7, eyeX: -1, brow: 0.7, browTilt: 0.5, smile: 0, in: 14 },
    { f: 870, headTurn: -0.45, eyeX: -0.7, headNod: 5, in: 14 },
    { f: 985, brow: 1, gasp: 0.3, lean: -4, in: 6 },
    { f: 1070, gasp: 0, brow: 0.7, browTilt: 0.8, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "open", lHand: "open", in: 20 },
  ]);
  const SHOT_LIGHTS: SceneLight[] = [
    { x: 260, y: 240, color: "#ffcf87", intensity: 1.0, radius: 1800, flicker: 5 },
    { x: 1450, y: 500, color: "#ff8a3c", intensity: shadow * 0.6, radius: 900, flicker: 3 },
    { x: -150, y: 600, color: "#FFF4D6", intensity: clamp((f - 822) / 20) * clamp((905 - f) / 20) * 0.6, radius: 900 },
  ];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.sundar.from) / 10)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.85}>
          <GlowDefs />
          <BaithakWall f={f} tiger={0} jaw={0} flash={0} />
          <DakshaShadow f={f} k={shadow} x={1460} y={700} s={1.05} />
          {/* doorway to the inner rooms: the newborn's quiet white-gold light */}
          <rect x={-120} y={260} width={200} height={560} fill="#2a1a10" />
          <rect x={-110} y={270} width={180} height={540} fill="#FFF4D6" opacity={0.18 + 0.05 * Math.sin(f * 0.05)} style={{ mixBlendMode: "screen" }} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <Bolster x={420} y={790} s={0.9} />
          <Takhat />
          <Puppet cast={SUNDAR} f={f} x={SUN_X} y={SUN_Y} scale={1.6} seated acting={sundar} mouth={vs.mouth} talk={vs.talk} light={{ keySide: -1 }} props={{ scroll: P_SCROLL }} />
          {/* the chart open on the takhat while he reads */}
          {f >= 896 && <g transform={`translate(${SUN_X - 70}, 880) scale(0.42, 0.18)`} opacity={clamp((f - 896) / 8)}>
            <rect x={0} y={0} width={400} height={400} fill="#efe0bc" />
            <path d="M 0 0 L 400 400 M 400 0 L 0 400 M 200 0 L 400 200 L 200 400 L 0 200 Z" stroke="#5a2a14" strokeWidth={6} fill="none" />
          </g>}
          <Puppet cast={CAST.babukaka} f={f} x={1500} y={SUN_Y} scale={1.5} seated acting={babu} light={{ keySide: -1 }} />
        </Layer>
        <Layer depth={1.28}>
          <GlowDefs />
          <HurricaneLantern x={250} y={160} f={f} s={1.2} />
        </Layer>
        <Grade warmth={0.38} vignette={0.66} bloomAt={[22, 25]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/** Insert: the kosthi in close-up. `phase` 1 = planets appear, 2 = the sannyas-yoga gathers. */
const ShotChart: React.FC<{ phase: 1 | 2; from: number }> = ({ phase, from }) => {
  const f = useCurrentFrame() + from;
  const reveal = phase === 1 ? clamp((f - 912) / 60) : 1;
  const yoga = phase === 2 ? clamp((f - 1060) / 44) : 0;
  const pointAt = phase === 1 ? Math.min(11, Math.max(0, (f - 912) / 6)) : -1;
  const cam = { x: 0, y: 0, zoom: phase === 1 ? 1 + (f - from) * 0.0012 : 1.04 + (f - from) * 0.0018, focus: 1, dof: 0 };
  return (
    <Stage cam={cam} opacity={clamp((f - from) / 4)} background="#1c110b">
      <Layer depth={1}>
        <GlowDefs />
        <rect x={-300} y={-200} width={2520} height={1500} fill="#3a2414" />
        <Glow x={500} y={260} r={500} kind="warm" o={0.4} />
        <KosthiChart f={f} x={760} y={240} s={1.4} reveal={reveal} yoga={yoga} pointAt={pointAt} />
        {phase === 2 && <Motes f={f} x={1240} y={520} n={10} spread={160} rise={-120} seed={7} o={yoga * 0.7} />}
      </Layer>
      <Grade warmth={0.45} vignette={0.7} bloomAt={[60, 45]} />
    </Stage>
  );
};

/** Insert: "এ যে জন্মসন্ন্যাসী!" — the newborn, centred, Level 1–2 hint, slow push. */
const ShotBabyInsert: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.baby.from;
  const cam = { x: 20, y: 300, zoom: 2.5 + (f - SHOTS.baby.from) * 0.006, focus: 1, dof: 2.4 };
  const aura = track(f, [
    [1112, 1],
    [1140, 1.6, "out"],
    [1175, 1.4],
  ]);
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.baby.from) / DIS)}>
      <SceneLights.Provider value={ROOM_LIGHTS(f)}>
        <RoomSet f={f} baby={<Baby f={f} aura={aura} lookY={-0.3} bless={track(f, [[1118, 0], [1160, 0.6, "out"]])} />} />
        <Layer depth={1.05} blend="screen">
          <Motes f={f} x={BABY.x - 60} y={BABY.y - 40} n={8} spread={140} rise={-90} seed={21} o={0.8} />
        </Layer>
        <Grade warmth={0.35} vignette={0.66} bloomAt={[50, 50]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 5 — the Pagol returns down the night lane                       */
/* ================================================================== */

const ShotLane: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.lane.from;
  const vp = voice(scene, "05e_Pagol_Return.wav", 79);
  const c = cutCam(
    f,
    [
      [1169, 0, 40, 1.15, 1.25], // wide: dancing in the lane
      [1262, 140, -30, 2.05, 2.2], // CU: turns to us, taps his temple — "পরে বুঝবে…"
      [1306, 60, 20, 1.3, 1.2], // he dances off into the dark
    ],
    1342,
  );
  const cam = { ...c, focus: 1, dof: 2.2 };
  const dance = (fr: number) => Math.sin(fr * 0.32);
  const pagol = A([
    { f: 1169, bodyTurn: 0.2, headTurn: 0.2, smile: 0.9, brow: 0.8, lid: 0.3, rS: 150, rE: 30, rHand: "open", lS: 140, lE: 30, lHand: "hold", lProp: "staff", headTilt: 10 },
    { f: 1262, bodyTurn: 0, headTurn: 0, eyeX: 0, eyeY: 0, smile: 0.6, lid: 0, brow: 0.6, browTilt: -0.3, rS: 120, rE: 120, rHand: "point", lS: 20, lE: -30, headTilt: -6, in: 10 }, // finger to temple
    { f: 1290, headNod: 6, headTilt: 8, smile: 0.9, in: 8 },
    { f: 1306, bodyTurn: 0.7, headTurn: -0.3, rS: 150, rE: 30, rHand: "open", lS: 140, lE: 30, stride: 0.8, in: 10 },
  ]);
  const pagolLive = (fr: number) => {
    const b = pagol(fr);
    const k = fr < 1262 || fr > 1306 ? 1 : 0.2;
    const exit = clamp((fr - 1306) / 36);
    return {
      ...b,
      bodyX: (b.bodyX ?? 0) + Math.sin(fr * 0.08) * 40 * k + exit * 700,
      bodyY: (b.bodyY ?? 0) - Math.abs(dance(fr)) * 14 * k,
      lean: (b.lean ?? 0) + dance(fr) * 8 * k,
      rS: (b.rS ?? 0) + dance(fr) * 14 * k,
      lS: (b.lS ?? 0) - dance(fr) * 14 * k,
      headTilt: (b.headTilt ?? 0) + dance(fr + 3) * 6 * k,
    };
  };
  const fade = clamp((1342 - f) / 18);
  const SHOT_LIGHTS: SceneLight[] = [{ x: 1500, y: 420, color: "#ffb04a", intensity: 0.7, radius: 1200, flicker: 9 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.lane.from) / DIS) * fade}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.12}>
          <GlowDefs />
          <AmavasyaSky f={f} />
        </Layer>
        <Layer depth={0.4}>
          <LaneBackdrop f={f} />
        </Layer>
        <Layer depth={0.75}>
          <GlowDefs />
          <LaneWall f={f} joy={0.2} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <rect x={-400} y={940} width={2720} height={400} fill="#120c0a" opacity={0.6} />
          <Puppet cast={PAGOL} f={f} x={960} y={990} scale={1.6} acting={pagolLive} mouth={vp.mouth} talk={vp.talk} light={{ keySide: 1, rim: "#ffcf87", rimStrength: 0.6 }} props={{ staff: P_STAFF }} />
        </Layer>
        <Layer depth={1.3} blend="screen">
          <Bokeh f={f} n={10} seed={57} />
        </Layer>
        <Grade warmth={0.25} vignette={0.7} bloomAt={[75, 40]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */

export const Scene05Rain: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const seq = (k: keyof typeof SHOTS, el: React.ReactNode, tail = DIS) => (
    <Sequence from={SHOTS[k].from} durationInFrames={SHOTS[k].to - SHOTS[k].from + tail} layout="none">
      {el}
    </Sequence>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
      {seq("room", <ShotRoom scene={scene} />)}
      {seq("charu", <ShotCharu scene={scene} />)}
      {seq("flash", <ShotFlash scene={scene} />)}
      {seq("sundar", <ShotSundar scene={scene} />)}
      {seq("chart1", <ShotChart phase={1} from={SHOTS.chart1.from} />, 0)}
      {seq("chart2", <ShotChart phase={2} from={SHOTS.chart2.from} />, 0)}
      {seq("baby", <ShotBabyInsert />)}
      {seq("lane", <ShotLane scene={scene} />, 0)}
    </div>
  );
};

/** Scene 05 sound bed (no voices): night ambience; the memory's monsoon; the motif for "জন্মসন্ন্যাসী". */
export const Scene05SoundBed: React.FC<{ scene: SceneTiming }> = () => {
  const rain = (fr: number) => interpolate(fr, [470, 560, 575, 700, 716, 740], [0, 0.12, 0.6, 0.6, 0.2, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const present = (fr: number) => interpolate(fr, [0, 20, 540, 575, 712, 750, 1320, 1342], [0, 1, 1, 0.1, 0.1, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Audio src={staticFile("audio/ambient/bengal_night_crickets.wav")} loop volume={(fr) => 0.16 * present(fr)} />
      <Audio src={staticFile("audio/music/Sacred_Night_Ambient.wav")} loop volume={(fr) => 0.12 * present(fr)} />
      <Audio src={staticFile("audio/ambient/monsoon_rain_courtyard.wav")} loop volume={rain} />
      <Sequence from={560} durationInFrames={160} layout="none">
        <Audio src={staticFile("audio/sfx/monsoon_rain.wav")} volume={(fr) => interpolate(fr, [0, 10, 140, 160], [0, 0.45, 0.45, 0], { extrapolateRight: "clamp" })} />
      </Sequence>
      <Sequence from={1118} durationInFrames={224} layout="none">
        <Audio src={staticFile("audio/music/Divine_Motif.wav")} volume={(fr) => interpolate(fr, [0, 20, 150, 224], [0, 0.32, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </Sequence>
      <Sequence from={1060} durationInFrames={100} layout="none">
        <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={0.25} />
      </Sequence>
    </>
  );
};

/** Standalone demo: scene + voices + sound bed + subtitles. */
export const Scene05Demo: React.FC = () => {
  const scene = SCENE05;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene05Rain scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
        <Scene05SoundBed scene={scene} />
      </DuckProvider>
      <CueSubtitles cues={SCENE05_CUES} />
    </div>
  );
};
