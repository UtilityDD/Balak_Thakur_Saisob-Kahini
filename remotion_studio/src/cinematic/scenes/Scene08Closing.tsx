import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "../audio/Mix";
import { EPISODE_01_SCENES } from "../../data/episode01Data";
import { SceneTiming } from "../../types/studio";
import { clamp, hash, lerp, makeActing, noise1, PoseKey, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { BabyThakur, DIVINE, DivineDefs, LotusOfLight, Motes, SacredLight } from "../divine/Divine";
import { Bokeh, Diya, Flame, Glow, GlowDefs } from "../fx/Fx";
import { BN_FONT } from "../fonts";
import { CAST } from "../rig/cast";
import { BASE_POSE, Pose, Puppet, SceneLight, SceneLights } from "../rig/Puppet";
import { CueSubtitles } from "../Scene02Demo";
import { AmavasyaSky, FarBank, ForegroundPalms, NearVillage, PadmaNight } from "../sets/Exteriors";
import { CourtyardBack, CourtyardFloor, TulsiMancha } from "../sets/Interiors";
import { KaliMandap } from "../sets/Sacred";

/**
 * Episode 1 · Scene 08 — Closing moral and outro.
 * A reflective montage that calls back to the night: the diya-lit village on Amavasya, the serene
 * newborn on his lotus of light (his name revealed gently, Level 2), the lesson — not fear or
 * pomp but a single steady flame of love — the household's tenderness, kindness to every creature,
 * a calm sleeping child; then dawn over the Padma and the next-episode card.
 */

export const SCENE08 = EPISODE_01_SCENES.find((s) => s.sceneId === "08_closing_moral_outro")!;

const SHOTS = {
  village: { from: 0, to: 236 }, // আর এইভাবেই, এক কালীপূজার রাতে মেদিনীমণ্ডল গ্রামে
  newborn: { from: 230, to: 416 }, // জন্ম নিয়েছিলেন সেই শান্ত শিশু — শ্রীশ্রীঠাকুর বালক ব্রহ্মচারী
  lesson: { from: 410, to: 690 }, // শিক্ষা … ভয় বা আড়ম্বরে নয়
  love: { from: 684, to: 776 }, // সরল ভালোবাসায়
  kindness: { from: 770, to: 842 }, // সব জীবের প্রতি মমতায়
  calm: { from: 836, to: 918 }, // আর শান্ত সুন্দর মনে
  dawn: { from: 912, to: 1006 }, // ছোটদের বালক ঠাকুরের গল্প
  teaser: { from: 1000, to: 1380 }, // আসছে পরের পর্ব: রহস্যময় শৈশব ও গো-সাপ!
};
const DIS = 10;

const NAME_AT = 300; // "যাঁকে সারা পৃথিবী একদিন চিনবে শ্রীশ্রীঠাকুর বালক ব্রহ্মচারী নামে"
const POMP_FADE = [560, 660] as const; // "ভয় বা আড়ম্বরে নয়" → only one flame remains

export const SCENE08_CUES = [
  { from: 2, to: 90, who: "কথক", text: "আর এইভাবেই, এক কালীপূজার রাতে" },
  { from: 102, to: 213, who: "কথক", text: "মেদিনীমণ্ডল গ্রামে জন্ম নিয়েছিলেন সেই শান্ত শিশু—" },
  { from: 229, to: 379, who: "কথক", text: "যাঁকে সারা পৃথিবী একদিন চিনবে শ্রীশ্রীঠাকুর বালক ব্রহ্মচারী নামে।" },
  { from: 410, to: 507, who: "কথক", text: "তাঁর জন্মের রাতটিই আমাদের সুন্দর একটি শিক্ষা দিয়ে গেল—" },
  { from: 526, to: 676, who: "কথক", text: "সত্যিকারের আনন্দ বা ধর্ম কোনো ভয় বা আড়ম্বরে নয়;" },
  { from: 694, to: 762, who: "কথক", text: "তা লুকিয়ে আছে সরল ভালোবাসায়," },
  { from: 773, to: 836, who: "কথক", text: "সব জীবের প্রতি মমতায়," },
  { from: 836, to: 898, who: "কথক", text: "আর শান্ত সুন্দর মনে।" },
  { from: 924, to: 999, who: "কথক", text: "ছোটদের বালক ঠাকুরের গল্প—" },
  { from: 999, to: 1135, who: "কথক", text: "আসছে পরের পর্ব: রহস্যময় শৈশব ও গো-সাপ!" },
  { from: 1135, to: 1240, who: "কথক", text: "কীভাবে ছোট্ট শিশু ঠাকুর উজানচর কৃষ্ণনগরে" },
  { from: 1240, to: 1344, who: "কথক", text: "ভয়ংকর গো-সাপের সাথে খেলা করেছিলেন, দেখুন পরের পর্বে!" },
];

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

/* ---------------- local props / creatures ---------------- */

/** Small kid goat (ছাগলছানা) — stands, nibbles, nuzzles toward the child. `nuzzle` 0..1. */
const KidGoat: React.FC<{ f: number; x: number; y: number; s?: number; nuzzle?: number }> = ({ f, x, y, s = 1, nuzzle = 0 }) => {
  const breath = Math.sin(f * 0.16) * 0.8;
  const head = -18 + nuzzle * 26 + noise1(f * 0.05, 3) * 6;
  const tail = Math.sin(f * 0.7) * 14;
  const ear = Math.sin(f * 0.11) * 8;
  const leg = (lx: number, k: number) => <rect key={k} x={lx} y={-6} width={7} height={46 + (k % 2) * 2} rx={3} fill="#efe6d8" />;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx={0} cy={44} rx={62} ry={9} fill="#000" opacity={0.18} />
      {[-34, -18, 20, 34].map((lx, k) => leg(lx, k))}
      <g transform={`translate(0, ${breath})`}>
        <ellipse cx={0} cy={-14} rx={48} ry={28} fill="#f6efe3" />
        <ellipse cx={-6} cy={-28} rx={30} ry={10} fill="#ffffff" opacity={0.7} />
        <ellipse cx={14} cy={-10} rx={16} ry={11} fill="#c8a07a" opacity={0.55} />
        <g transform={`translate(44, -24) rotate(${tail})`}>
          <ellipse cx={8} cy={-6} rx={9} ry={5} fill="#f6efe3" />
        </g>
        <g transform={`translate(-40, -30) rotate(${head})`}>
          <rect x={-9} y={-8} width={18} height={22} rx={9} fill="#f6efe3" />
          <g transform="translate(-6, -12)">
            <ellipse cx={-14} cy={0} rx={20} ry={14} fill="#f6efe3" />
            <ellipse cx={-30} cy={4} rx={8} ry={7} fill="#f1d8cc" />
            <circle cx={-32} cy={2} r={1.6} fill="#5a3a30" />
            <circle cx={-14} cy={-4} r={3.4} fill="#2a1a14" />
            <circle cx={-15} cy={-5} r={1.1} fill="#fff" />
            <g transform={`rotate(${-20 + ear}, -2, -6)`}>
              <ellipse cx={8} cy={-4} rx={13} ry={5} fill="#e6d4c0" />
            </g>
            <path d="M -8 -12 q -2 -10 4 -14" stroke="#cdb89a" strokeWidth={3} fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </g>
  );
};

/** Little sparrow (চড়ুই) hopping and pecking. */
const Sparrow: React.FC<{ f: number; x: number; y: number; s?: number; seed?: number; flip?: boolean }> = ({ f, x, y, s = 1, seed = 1, flip }) => {
  const cyc = (f + seed * 23) % 46;
  const hop = cyc < 8 ? -Math.sin((cyc / 8) * Math.PI) * 14 : 0;
  const peck = cyc > 20 && cyc < 30 ? Math.sin(((cyc - 20) / 10) * Math.PI) * 30 : 0;
  const dx = Math.floor((f + seed * 23) / 46) % 2 === 0 ? 0 : 10;
  return (
    <g transform={`translate(${x + dx}, ${y + hop}) scale(${flip ? -s : s}, ${s})`}>
      <ellipse cx={0} cy={0} rx={16} ry={11} fill="#8a6142" />
      <path d="M 8 -4 Q 18 -2 22 6 Q 10 6 6 2 Z" fill="#5a3a24" />
      <g transform={`rotate(${peck}, -10, -4)`}>
        <circle cx={-12} cy={-8} r={8} fill="#9a7050" />
        <circle cx={-14} cy={-10} r={1.6} fill="#1a1008" />
        <path d="M -20 -8 L -26 -6 L -20 -5 Z" fill="#d8a040" />
      </g>
      <path d="M -6 2 Q 2 10 10 2" fill="#efe2cc" />
      <line x1={-3} y1={10} x2={-4} y2={16} stroke="#6a4a2a" strokeWidth={1.4} />
      <line x1={3} y1={10} x2={4} y2={16} stroke="#6a4a2a" strokeWidth={1.4} />
    </g>
  );
};

/** Dawn over the Padma: pink-gold sky, rising sun, far bank, river shimmer, boats. */
const DawnLand: React.FC<{ f: number; rise: number }> = ({ f, rise }) => {
  const sunY = lerp(760, 560, rise);
  return (
    <g>
      <defs>
        <linearGradient id="s08-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={rise > 0.5 ? "#6a7fb8" : "#3a3e78"} />
          <stop offset="45%" stopColor="#e89aa0" />
          <stop offset="75%" stopColor="#ffcf8a" />
          <stop offset="100%" stopColor="#fff0c8" />
        </linearGradient>
        <radialGradient id="s08-sun">
          <stop offset="0%" stopColor="#fffbe8" />
          <stop offset="40%" stopColor="#ffe08a" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#ffb860" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="s08-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6c08a" />
          <stop offset="100%" stopColor="#6a6a8a" />
        </linearGradient>
      </defs>
      <rect x={-600} y={-600} width={3120} height={1400} fill="url(#s08-sky)" />
      <circle cx={1180} cy={sunY} r={340} fill="url(#s08-sun)" />
      <circle cx={1180} cy={sunY} r={64} fill="#fff6d8" />
      {/* soft clouds */}
      {[0, 1, 2, 3].map((k) => (
        <ellipse key={k} cx={((200 + k * 520 + f * (0.25 + k * 0.05)) % 2600) - 300} cy={250 + k * 60} rx={220 - k * 20} ry={26} fill="#ffe2d0" opacity={0.45} />
      ))}
      {/* birds crossing */}
      {Array.from({ length: 6 }, (_, k) => {
        const bx = ((f * 2.2 + k * 70) % 2400) - 300;
        const by = 300 - k * 12 + Math.sin(f * 0.05 + k) * 6;
        const w = Math.sin(f * 0.5 + k) * 6;
        return <path key={k} d={`M ${bx - 12} ${by} q 6 ${-6 - w} 12 0 q 6 ${-6 - w} 12 0`} stroke="#3a2a3a" strokeWidth={2.2} fill="none" />;
      })}
      {/* far bank with village trees */}
      <path d="M -600 720 Q 0 690 600 712 Q 1200 690 1800 716 L 2520 706 L 2520 760 L -600 760 Z" fill="#5a4a5a" />
      {Array.from({ length: 22 }, (_, k) => (
        <ellipse key={k} cx={-500 + k * 140 + hash(k) * 60} cy={700} rx={60 + hash(k * 3) * 40} ry={30 + hash(k * 5) * 26} fill="#4a3c4c" />
      ))}
      {/* river */}
      <rect x={-600} y={756} width={3120} height={500} fill="url(#s08-river)" />
      {Array.from({ length: 26 }, (_, k) => {
        const yy = 780 + k * 14;
        const ww = 40 + hash(k) * 180;
        const xx = 1180 + Math.sin(f * 0.04 + k) * 30 + (hash(k * 3) - 0.5) * (80 + k * 22);
        return <rect key={k} x={xx - ww / 2} y={yy} width={ww} height={3} rx={1.5} fill="#fff4d0" opacity={0.65 - k * 0.02} />;
      })}
      {/* a sail boat drifting */}
      <g transform={`translate(${300 + f * 0.6}, 800)`}>
        <path d="M -70 0 Q 0 22 70 0 L 56 -8 L -56 -8 Z" fill="#3a2a2a" />
        <path d="M 0 -8 L 0 -120 L 56 -20 Z" fill="#f2e2c8" opacity={0.9} />
      </g>
    </g>
  );
};

/** Morning riverbank grass with a toddler's silhouette and a curious গো-সাপ — the next-episode teaser. */
const TeaserBank: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const lizX = lerp(1560, 1260, clamp(t / 0.45));
  const tongue = Math.sin(f * 0.9) > 0.6 ? 1 : 0;
  const tail = Math.sin(f * 0.12) * 10;
  const reach = clamp((t - 0.35) / 0.3);
  return (
    <g>
      {/* bank */}
      <path d="M -600 900 Q 400 860 960 880 Q 1500 900 2520 870 L 2520 1300 L -600 1300 Z" fill="#3a3a26" />
      {Array.from({ length: 70 }, (_, k) => {
        const gx = -500 + k * 42 + hash(k) * 20;
        const h = 40 + hash(k * 7) * 60;
        const sw = Math.sin(f * 0.05 + k * 0.6) * 8;
        return <path key={k} d={`M ${gx} 920 Q ${gx + sw * 0.5} ${920 - h * 0.6} ${gx + sw} ${920 - h}`} stroke="#4a5030" strokeWidth={5} fill="none" strokeLinecap="round" />;
      })}
      {/* toddler silhouette, sitting, reaching out */}
      <g transform="translate(860, 880)">
        <ellipse cx={20} cy={4} rx={90} ry={10} fill="#000" opacity={0.25} />
        {/* folded legs, feet forward */}
        <ellipse cx={34} cy={-14} rx={52} ry={17} fill="#2a2420" />
        <ellipse cx={86} cy={-10} rx={14} ry={9} fill="#2a2420" />
        {/* round tummy + back, leaning forward with curiosity */}
        <g transform={`rotate(${lerp(0, 10, reach)}, 0, -10)`}>
          <path d="M -30 -10 Q -40 -70 -12 -96 Q 18 -110 34 -80 Q 46 -46 30 -10 Z" fill="#2a2420" />
          {/* head with a little top-knot */}
          <g transform={`translate(4, -128) rotate(${Math.sin(f * 0.05) * 4 + reach * 8})`}>
            <circle cx={0} cy={0} r={34} fill="#2a2420" />
            <circle cx={-8} cy={-36} r={10} fill="#2a2420" />
            <ellipse cx={30} cy={6} rx={6} ry={8} fill="#2a2420" />
            {/* a faint divine rim of morning light */}
            <path d="M -30 -16 A 34 34 0 0 1 22 -26" stroke={DIVINE.mid} strokeWidth={3.5} fill="none" opacity={0.85} />
          </g>
          {/* near arm reaching out to the গো-সাপ */}
          <g transform={`translate(22, -80) rotate(${lerp(-30, -88, reach)})`}>
            <rect x={-8} y={0} width={16} height={58} rx={8} fill="#2a2420" />
            <circle cx={0} cy={60} r={10} fill="#2a2420" />
          </g>
        </g>
      </g>
      {/* গো-সাপ (monitor lizard) */}
      <g transform={`translate(${lizX}, 900) scale(1.25)`}>
        <ellipse cx={30} cy={10} rx={140} ry={10} fill="#000" opacity={0.22} />
        <path d={`M 120 0 Q 220 ${-10 + tail} 320 ${10 + tail * 1.5}`} stroke="#2e2a20" strokeWidth={16} fill="none" strokeLinecap="round" />
        <ellipse cx={40} cy={-16} rx={96} ry={26} fill="#2e2a20" />
        <path d="M -40 -20 Q -80 -40 -110 -24 Q -84 -6 -40 -8 Z" fill="#2e2a20" />
        <circle cx={-82} cy={-26} r={3} fill="#e8d080" />
        {tongue > 0 && <path d="M -110 -22 L -138 -26 M -130 -25 L -142 -32 M -130 -25 L -142 -18" stroke="#c84a4a" strokeWidth={2.4} />}
        {[-20, 20, 70, 110].map((lx, k) => (
          <path key={k} d={`M ${lx} -2 q ${k % 2 ? 8 : -8} 14 ${k % 2 ? 20 : -6} 16`} stroke="#2e2a20" strokeWidth={10} fill="none" strokeLinecap="round" />
        ))}
        {/* pattern */}
        {[0, 1, 2, 3, 4].map((k) => (
          <circle key={k} cx={-10 + k * 26} cy={-22} r={4} fill="#6a6040" opacity={0.6} />
        ))}
      </g>
    </g>
  );
};

/** Gold, softly glowing Bengali title text. */
const Title: React.FC<{ text: string; o: number; size: number; top: number; color?: string; glow?: string; weight?: number; rise?: number }> = ({
  text,
  o,
  size,
  top,
  color = "#FFF4D6",
  glow = "rgba(255, 210, 120, 0.85)",
  weight = 700,
  rise = 0,
}) =>
  o > 0.01 ? (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top,
        textAlign: "center",
        fontFamily: BN_FONT,
        fontWeight: weight,
        fontSize: size,
        color,
        opacity: o,
        transform: `translateY(${(1 - o) * 14 + rise}px)`,
        textShadow: `0 0 18px ${glow}, 0 0 42px ${glow}, 0 2px 4px rgba(0,0,0,0.5)`,
        letterSpacing: 1,
      }}
    >
      {text}
    </div>
  ) : null;

const fadeWin = (f: number, a: number, b: number, c: number, d: number) =>
  interpolate(f, [a, b, c, d], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/* ================================================================== */
/* SHOT 1 — the diya-lit village on Amavasya night                    */
/* ================================================================== */

const ShotVillage: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.village.from;
  const cam = {
    x: track(f, [
      [0, -120],
      [236, 260, "inOut"],
    ]),
    y: track(f, [
      [0, -200],
      [100, -20, "inOut"],
      [236, 30],
    ]),
    zoom: track(f, [
      [0, 1.0],
      [100, 1.06],
      [236, 1.5, "inOut"],
    ]),
    focus: 0.7,
    dof: 3,
  };
  return (
    <Stage cam={cam} opacity={clamp(f / 18)}>
      <Layer depth={0.04}>
        <GlowDefs />
        <AmavasyaSky f={f} horizonGlow={1.1} />
      </Layer>
      <Layer depth={0.3}>
        <GlowDefs />
        <FarBank f={f} wave={1} />
      </Layer>
      <Layer depth={0.45}>
        <GlowDefs />
        <PadmaNight f={f} wave={1} />
      </Layer>
      <Layer depth={0.7}>
        <GlowDefs />
        <NearVillage f={f} wave={1} puja={1} />
        {/* the mandap's still radiance over Baidik Bari */}
        <g style={{ mixBlendMode: "screen" }}>
          <Glow x={1240} y={560} r={200} kind="warm" o={0.45 + 0.1 * Math.sin(f * 0.05)} />
        </g>
      </Layer>
      <Layer depth={1.3}>
        <ForegroundPalms f={f} />
      </Layer>
      <Layer depth={1.3} blend="screen">
        <Bokeh f={f} n={14} seed={81} rise={0.2} />
      </Layer>
      <Grade warmth={0.3} vignette={0.62} bloomAt={[62, 56]} />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 2 — the serene newborn; his name revealed gently (Level 2)    */
/* ================================================================== */

const ShotNewborn: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.newborn.from;
  const cam = {
    x: track(f, [
      [230, -30],
      [416, 20],
    ]),
    y: track(f, [
      [230, 70],
      [416, -40],
    ]),
    zoom: track(f, [
      [230, 1.25],
      [416, 1.05, "inOut"],
    ]),
    focus: 1,
    dof: 0,
  };
  const name = fadeWin(f, NAME_AT, NAME_AT + 24, 404, 420);
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.newborn.from) / DIS)} background="#120a10">
      <Layer depth={0.6} extraBlur={14}>
        <GlowDefs />
        <g transform="translate(-960, -700) scale(2)">
          <CourtyardFloor f={f} />
        </g>
      </Layer>
      <Layer depth={1}>
        <DivineDefs />
        <SacredLight f={f} x={960} groundY={800} intensity={0.55 + name * 0.25} />
        <LotusOfLight f={f} x={960} y={800} bloom={1} s={2.4} />
        <ellipse cx={960} cy={772} rx={480} ry={64} fill="#FFFDF7" opacity={0.85} />
        <BabyThakur
          f={f}
          x={990}
          y={620}
          s={3.6}
          open={1}
          aura={1.6 + name * 0.6}
          float={0.8}
          headRoll={-48}
          turn={track(f, [[230, 0.1], [330, 0.2], [416, 0.05]])}
          lookX={track(f, [[230, 0.1], [300, -0.1], [380, 0.15]])}
          lookY={track(f, [[230, 0], [300, -0.25], [416, -0.1]])}
          smile={track(f, [[230, 0.6], [NAME_AT + 10, 0.85, "out"], [416, 0.75]])}
          bless={track(f, [[260, 0], [NAME_AT + 20, 0.9, "out"], [400, 0.7]])}
          wiggle={0.7}
        />
        <Motes f={f} x={990} y={560} n={18} spread={420} rise={-120} seed={83} o={0.8} />
      </Layer>
      <Layer depth={1.4} blend="screen">
        <Bokeh f={f} n={12} seed={85} color="#FFE7AE" size={[20, 50]} rise={0.15} />
      </Layer>
      <Grade warmth={0.05} vignette={0.7} bloomAt={[50, 52]} />
      <Title text="শ্রীশ্রীঠাকুর বালক ব্রহ্মচারী" o={name} size={78} top={120} />
      <Title text="✦" o={name * 0.8} size={28} top={84} color={DIVINE.mid} />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 3 — the lesson: not fear, not pomp — one steady flame          */
/* ================================================================== */

const ShotLesson: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.lesson.from;
  const pomp = 1 - clamp((f - POMP_FADE[0]) / (POMP_FADE[1] - POMP_FADE[0]));
  const cam = {
    x: track(f, [
      [410, 0],
      [520, 40],
      [POMP_FADE[0], 40],
      [690, 0, "inOut"],
    ]),
    y: track(f, [
      [410, -20],
      [POMP_FADE[0], 20],
      [690, 300, "inOut"],
    ]),
    zoom: track(f, [
      [410, 1.02],
      [POMP_FADE[0], 1.12],
      [690, 1.9, "inOut"],
    ]),
    focus: 1.15,
    dof: 2.4,
  };
  const SHOT_LIGHTS: SceneLight[] = [{ x: 960, y: 900, color: "#ffb04a", intensity: 0.8, radius: 900, flicker: 3 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.lesson.from) / DIS)} background="#0a0606">
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.8} opacity={0.25 + pomp * 0.75}>
          <GlowDefs />
          <KaliMandap f={f} presence={0.55 + 0.45 * pomp} />
        </Layer>
        {/* the fallen bell, resting among hibiscus — a callback to the night */}
        <Layer depth={1} opacity={0.3 + pomp * 0.7}>
          <g transform="translate(700, 905) rotate(80) scale(1.4)">
            <path d="M -17 46 Q -15 19 0 17 Q 15 19 17 46 Z" fill="#e6b84c" />
            <rect x={-3} y={-6} width={6} height={22} fill="#c9932e" />
          </g>
          {[600, 640, 760, 790].map((x, i) => (
            <g key={x} transform={`translate(${x}, ${925 + (i % 2) * 8})`}>
              {[0, 1, 2, 3, 4].map((k) => (
                <ellipse key={k} cx={0} cy={-7} rx={5} ry={9} fill="#d0121e" transform={`rotate(${k * 72})`} />
              ))}
              <circle r={3} fill="#ffcf40" />
            </g>
          ))}
        </Layer>
        <Layer depth={1.15}>
          <GlowDefs />
          <rect x={-400} y={940} width={2720} height={400} fill="#1a0e0a" />
          {/* the one flame that remains */}
          <Diya x={960} y={960} s={2.2} f={f} seed={88} />
          <g style={{ mixBlendMode: "screen" }}>
            <Glow x={960} y={920} r={110 + (1 - pomp) * 90} kind="warm" o={0.5 + (1 - pomp) * 0.35} />
          </g>
        </Layer>
        <Grade warmth={0.35} vignette={0.62 + (1 - pomp) * 0.2} bloomAt={[50, 80]} />
      </SceneLights.Provider>
      {/* darkness closes around the single flame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 72%, rgba(0,0,0,0) 12%, rgba(6,3,2,0.9) 55%)",
          opacity: (1 - pomp) * 0.85,
        }}
      />
    </Stage>
  );
};

/* ================================================================== */
/* SHOTS 4–6 — love · kindness · a calm mind (the courtyard)          */
/* ================================================================== */

const CourtyardDawnSet: React.FC<{ f: number; dawn: number; children?: React.ReactNode }> = ({ f, dawn, children }) => (
  <>
    <Layer depth={0.12}>
      <GlowDefs />
      <g transform="translate(0, -560)">
        <AmavasyaSky f={f} horizonGlow={0.3 + dawn * 0.9} />
      </g>
      <rect x={-600} y={-400} width={3120} height={900} fill="#e8a080" opacity={dawn * 0.35} />
    </Layer>
    <Layer depth={0.55}>
      <GlowDefs />
      <CourtyardBack f={f} />
    </Layer>
    <Layer depth={0.8}>
      <GlowDefs />
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

const ShotLove: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.love.from;
  const MAN_X = 1080;
  const armY = 1000 - 200 * 1.45;
  const manorama = A([
    { f: 684, bodyTurn: -0.25, headTurn: -0.3, headTilt: 10, headNod: 14, eyeY: 1, eyeX: -0.6, lid: 0.4, smile: 0.9, rS: 5, rE: -95, lS: 5, lE: -95, rHand: "relaxed", lHand: "relaxed" },
    { f: 740, headTilt: 13, headNod: 16, lid: 0.45, in: 40 },
  ]);
  const rock = Math.sin(f * 0.07) * 4;
  const charu = A([{ f: 684, bodyTurn: 0.35, headTurn: 0.6, eyeX: 1, eyeY: 0.7, headNod: 8, smile: 0.85, brow: 0.3, browTilt: 0.3, rS: -6, rE: -140, lS: -6, lE: -140, rHand: "open", lHand: "open", headTilt: -5 }]);
  const cam = {
    x: track(f, [
      [684, 80],
      [776, 60],
    ]),
    y: track(f, [
      [684, 130],
      [776, 110],
    ]),
    zoom: track(f, [
      [684, 1.55],
      [776, 1.68],
    ]),
    focus: 1,
    dof: 2.6,
  };
  const SHOT_LIGHTS: SceneLight[] = [
    { x: MAN_X - 30, y: armY - 20, color: DIVINE.core, intensity: 0.8, radius: 800 },
    { x: 1700, y: 800, color: "#ffb04a", intensity: 0.4, radius: 700, flicker: 5 },
  ];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.love.from) / DIS)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <CourtyardDawnSet f={f} dawn={0}>
          <Puppet cast={CAST.charu} f={f} x={760} y={1000} scale={1.45} acting={charu} stillness={0.5} light={{ keySide: 1, rim: DIVINE.mid, rimStrength: 0.5 }} />
          <Puppet cast={CAST.manorama} f={f} x={MAN_X} y={1000} scale={1.45} acting={(fr) => ({ ...manorama(fr), lean: rock * 0.4 })} stillness={0.4} light={{ keySide: -1, rim: DIVINE.mid, rimStrength: 0.55 }} />
          <BabyThakur
            f={f}
            x={MAN_X - 10 + rock}
            y={armY - 14}
            s={1.25}
            open={1}
            aura={1}
            rot={-10 + rock * 0.5}
            headRoll={-16}
            lookX={track(f, [[684, 0.4], [730, -0.6]])}
            lookY={track(f, [[684, -0.6], [730, -0.3]])}
            turn={track(f, [[684, 0.3], [730, -0.25]])}
            smile={0.85}
            wiggle={0.6}
          />
        </CourtyardDawnSet>
        <Layer depth={1.35} blend="screen">
          <Bokeh f={f} n={10} seed={91} color="#FFE7AE" rise={0.15} />
        </Layer>
        <Grade warmth={0.3} vignette={0.6} bloomAt={[56, 50]} />
      </SceneLights.Provider>
    </Stage>
  );
};

const ShotKindness: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.kindness.from;
  const nuzzle = track(f, [
    [770, 0],
    [800, 1, "inOut"],
    [842, 0.8],
  ]);
  const cam = {
    x: track(f, [
      [770, 120],
      [842, 160],
    ]),
    y: track(f, [
      [770, 260],
      [842, 250],
    ]),
    zoom: track(f, [
      [770, 1.9],
      [842, 2.0],
    ]),
    focus: 1,
    dof: 2.4,
  };
  const SHOT_LIGHTS: SceneLight[] = [{ x: 1000, y: 900, color: DIVINE.core, intensity: 0.8, radius: 700 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.kindness.from) / DIS)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <CourtyardDawnSet f={f} dawn={0.15}>
          <ellipse cx={1000} cy={950} rx={170} ry={28} fill="#FFFDF7" opacity={0.92} />
          <BabyThakur
            f={f}
            x={1000}
            y={905}
            s={1.3}
            open={1}
            aura={1.2}
            headRoll={-48}
            lookX={track(f, [[770, 0.9], [810, 0.7]])}
            lookY={track(f, [[770, -0.1], [810, 0.1]])}
            turn={track(f, [[770, 0.2], [810, 0.4]])}
            smile={track(f, [[770, 0.6], [805, 0.95, "out"]])}
            bless={track(f, [[780, 0], [812, 0.65, "out"]])}
          />
          <KidGoat f={f} x={lerp(1290, 1220, nuzzle)} y={912} s={0.95} nuzzle={nuzzle} />
          <Sparrow f={f} x={820} y={958} s={1.1} seed={1} />
          <Sparrow f={f} x={760} y={970} s={0.95} seed={4} flip />
          <Motes f={f} x={1060} y={860} n={8} spread={180} rise={-60} seed={93} o={0.7} />
        </CourtyardDawnSet>
        <Grade warmth={0.28} vignette={0.6} bloomAt={[52, 70]} />
      </SceneLights.Provider>
    </Stage>
  );
};

const ShotCalm: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.calm.from;
  const sleep = track(f, [
    [836, 1],
    [866, 0, "inOut"],
  ]);
  const cam = {
    x: track(f, [
      [836, 40],
      [918, 40],
    ]),
    y: track(f, [
      [836, 300],
      [918, 320],
    ]),
    zoom: track(f, [
      [836, 2.2],
      [918, 2.55],
    ]),
    focus: 1,
    dof: 2,
  };
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.calm.from) / DIS) * clamp((918 - f) / 10)}>
      <CourtyardDawnSet f={f} dawn={0.35}>
        <ellipse cx={1000} cy={950} rx={170} ry={28} fill="#FFFDF7" opacity={0.92} />
        <BabyThakur f={f} x={1000} y={905} s={1.3} open={sleep} aura={1.1} headRoll={-50} lookY={-0.1} smile={0.7} wiggle={0.2 + sleep * 0.4} />
        <Motes f={f} x={990} y={860} n={10} spread={160} rise={-50} seed={95} o={0.8} />
      </CourtyardDawnSet>
      <Grade warmth={0.24} vignette={0.66} bloomAt={[50, 70]} />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 7 — dawn over the Padma: series title                         */
/* ================================================================== */

const ShotDawn: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.dawn.from;
  const rise = clamp((f - 912) / 94);
  const cam = {
    x: 0,
    y: track(f, [
      [912, 60],
      [1006, 0],
    ]),
    zoom: track(f, [
      [912, 1.08],
      [1006, 1.0],
    ]),
    focus: 0.6,
    dof: 2.5,
  };
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.dawn.from) / 14)}>
      <Layer depth={0.3}>
        <DawnLand f={f} rise={rise} />
      </Layer>
      <Grade warmth={0.25} vignette={0.5} bloomAt={[61, 58]} />
      <Title text="ছোটদের বালক ঠাকুরের গল্প" o={fadeWin(f, 924, 944, 994, 1006)} size={84} top={180} color="#fffaf0" glow="rgba(255, 190, 120, 0.9)" weight={800} />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 8 — next-episode card: রহস্যময় শৈশব ও গো-সাপ                  */
/* ================================================================== */

const ShotTeaser: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.teaser.from;
  const t = clamp((f - 1000) / 380);
  const cam = {
    x: track(f, [
      [1000, -60],
      [1380, 60],
    ]),
    y: track(f, [
      [1000, 40],
      [1380, 90],
    ]),
    zoom: track(f, [
      [1000, 1.0],
      [1240, 1.12],
      [1380, 1.2],
    ]),
    focus: 1,
    dof: 2,
  };
  const end = clamp((1380 - f) / 30);
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.teaser.from) / DIS) * end}>
      <Layer depth={0.3}>
        <DawnLand f={f} rise={1} />
      </Layer>
      <Layer depth={1}>
        <TeaserBank f={f} t={t} />
      </Layer>
      <Layer depth={1.25} blend="screen">
        <Bokeh f={f} n={10} seed={97} color="#fff0c8" rise={0.2} />
      </Layer>
      <Grade warmth={0.3} vignette={0.55} bloomAt={[61, 40]} />
      <Title text="আসছে পরের পর্ব" o={fadeWin(f, 1004, 1024, 1360, 1380)} size={44} top={74} color="#FFE7AE" weight={600} />
      <Title text="রহস্যময় শৈশব ও গো-সাপ" o={fadeWin(f, 1030, 1056, 1360, 1380)} size={92} top={124} color="#fffaf0" glow="rgba(255, 180, 90, 0.9)" weight={800} />
      <Title text="উজানচর কৃষ্ণনগর" o={fadeWin(f, 1140, 1164, 1360, 1380)} size={36} top={250} color="#fff4d6" weight={500} />
      <Title text="দেখুন পরের পর্বে!" o={fadeWin(f, 1290, 1312, 1366, 1380)} size={56} top={330} color="#FFE7AE" weight={700} />
    </Stage>
  );
};

/* ================================================================== */

export const Scene08Closing: React.FC<{ scene: SceneTiming }> = () => {
  const seq = (k: keyof typeof SHOTS, el: React.ReactNode, last = false) => (
    <Sequence from={SHOTS[k].from} durationInFrames={SHOTS[k].to - SHOTS[k].from + (last ? 0 : DIS)} layout="none">
      {el}
    </Sequence>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
      {seq("village", <ShotVillage />)}
      {seq("newborn", <ShotNewborn />)}
      {seq("lesson", <ShotLesson />)}
      {seq("love", <ShotLove />)}
      {seq("kindness", <ShotKindness />)}
      {seq("calm", <ShotCalm />)}
      {seq("dawn", <ShotDawn />)}
      {seq("teaser", <ShotTeaser />, true)}
    </div>
  );
};

/** Sound bed (no voices). Scene-local frames. */
export const Scene08SoundBed: React.FC<{ scene: SceneTiming }> = () => (
  <>
    {/* night: soft sacred ambience under the village and the newborn */}
    <Audio
      src={staticFile("audio/music/Sacred_Night_Ambient.wav")}
      loop
      volume={(fr) => interpolate(fr, [0, 24, 400, 470], [0, 0.16, 0.16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
    />
    <Audio
      src={staticFile("audio/ambient/bengal_night_crickets.wav")}
      loop
      volume={(fr) => interpolate(fr, [0, 20, 860, 930], [0, 0.12, 0.1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
    />
    {/* the divine motif under the name reveal and the lesson */}
    <Sequence from={250} durationInFrames={680} layout="none">
      <Audio src={staticFile("audio/music/Divine_Motif.wav")} loop volume={(fr) => interpolate(fr, [0, 40, 600, 680], [0, 0.32, 0.26, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </Sequence>
    <Sequence from={NAME_AT} durationInFrames={120} layout="none">
      <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={0.32} />
    </Sequence>
    <Sequence from={790} durationInFrames={90} layout="none">
      <Audio src={staticFile("audio/sfx/goat_bleat_happy.wav")} volume={0.25} />
    </Sequence>
    {/* dawn: birds + the theme on bansi carries the outro */}
    <Sequence from={880} durationInFrames={500} layout="none">
      <Audio src={staticFile("audio/ambient/dawn_birds_temple.wav")} loop volume={(fr) => interpolate(fr, [0, 40, 440, 500], [0, 0.2, 0.18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </Sequence>
    <Sequence from={900} durationInFrames={480} layout="none">
      <Audio src={staticFile("audio/music/Theme_Intro_Bansuri.wav")} loop volume={(fr) => interpolate(fr, [0, 30, 420, 480], [0, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </Sequence>
  </>
);

/** Standalone demo: scene + voices + sound bed + subtitles. */
export const Scene08Demo: React.FC = () => {
  const scene = SCENE08;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene08Closing scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
        <Scene08SoundBed scene={scene} />
      </DuckProvider>
      <CueSubtitles cues={SCENE08_CUES} />
    </div>
  );
};
