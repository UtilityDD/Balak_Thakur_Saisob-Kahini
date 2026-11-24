import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "../audio/Mix";
import { EPISODE_01_SCENES } from "../../data/episode01Data";
import { SceneTiming } from "../../types/studio";
import { clamp, EASE, makeActing, noise1, PoseKey, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { BN_FONT } from "../fonts";
import { GlowDefs } from "../fx/Fx";
import { CAST } from "../rig/cast";
import { idleLife } from "../rig/idle";
import { visemeChatter } from "../rig/lipsync";
import { BASE_POSE, CastMember, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../rig/Puppet";
import { CueSubtitles } from "../Scene02Demo";
import {
  BaidikBariDay,
  Banana,
  Banyan,
  Bazaar,
  Birds,
  Boats,
  DaySky,
  GiantPot,
  GreatKitchen,
  Maktab,
  NearBank,
  PadmaDay,
  Palm,
  RiceHeaps,
  RiceSack,
  Station,
  Steamer,
  StoryMap,
  VillageFields,
} from "../sets/S01_DaySets";

/**
 * Episode 1 · Scene 01 — "Medinimondal".
 * Golden storybook daytime: the village, the mighty Padma to the south, the riverside station,
 * the bazaar, the tol and the maktab, the route north along the canal (as an illustrated map),
 * the great Baidik Bari, its twelve brothers and joint family, and the giant pots of rice
 * cooked twice a day. Every narrated item is shown on screen as it is spoken.
 */

export const SCENE01 = EPISODE_01_SCENES.find((s) => s.sceneId === "01_medinimondal_village")!;

const SHOTS = {
  village: { from: 0, to: 200 }, // অনেকদিন আগে… মেদিনীমণ্ডল নামে এক সুন্দর গ্রাম ছিল
  padma: { from: 194, to: 330 }, // দক্ষিণ দিক দিয়ে … প্রলয়ঙ্করী পদ্মা নদী
  station: { from: 324, to: 456 }, // নদীর তীরে ছিল ছোট্ট এক স্টেশন, কাছেই বাজার
  tol: { from: 450, to: 566 }, // টোল ও মক্তব
  map: { from: 560, to: 804 }, // স্টেশন থেকে সোজা উত্তর দিকে … বৈদিক বাড়ী
  bari: { from: 798, to: 1000 }, // বৈদিক বাড়ী … বারো ভাই … যৌথ পরিবার
  kitchen: { from: 994, to: 1162 }, // দু'বেলা প্রায় দেড়মণ চালের ভাত
};
const DIS = 8;

// narrator phrase timing from the RMS envelope pauses
export const SCENE01_CUES = [
  { from: 0, to: 40, who: "কথক", text: "অনেকদিন আগে," },
  { from: 58, to: 162, who: "কথক", text: "পূর্ববঙ্গের মেদিনীমণ্ডল নামে এক সুন্দর গ্রাম ছিল।" },
  { from: 196, to: 300, who: "কথক", text: "গ্রামের দক্ষিণ দিক দিয়ে বয়ে যেত প্রলয়ঙ্করী পদ্মা নদী।" },
  { from: 326, to: 396, who: "কথক", text: "নদীর তীরে ছিল ছোট্ট এক স্টেশন," },
  { from: 400, to: 444, who: "কথক", text: "কাছেই বাজার," },
  { from: 450, to: 532, who: "কথক", text: "আর ছেলেমেয়েদের পড়ার জন্য টোল ও মক্তব।" },
  { from: 560, to: 665, who: "কথক", text: "স্টেশন থেকে সোজা উত্তর দিকে" },
  { from: 671, to: 780, who: "কথক", text: "খালের পাড় ধরে বাজার আর কালিরখিল পেরোলেই পড়ত বিশাল এক বাড়ি—" },
  { from: 801, to: 842, who: "কথক", text: "বৈদিক বাড়ী।" },
  { from: 844, to: 968, who: "কথক", text: "সেই বাড়িতে থাকতেন বারো ভাই আর তাঁদের বিশাল যৌথ পরিবার।" },
  { from: 994, to: 1154, who: "কথক", text: "পরিবারটি এত বড় ছিল যে, দু’বেলা প্রায় দেড়মণ চালের ভাত রান্না হতো!" },
];

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);
const SUN: SceneLight = { x: 1500, y: -200, color: "#ffe0a0", intensity: 0.8, radius: 2600 };
const DAY_LIGHT = { keySide: 1 as const, rim: "#fff0c8", rimStrength: 0.45 };
const BN_NUM = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const bn = (n: number) => String(n).split("").map((d) => BN_NUM[+d]).join("");

/* ---------------- local cast ---------------- */

const MAULVI: CastMember = {
  ...CAST.listenerA,
  id: "maulvi",
  age: "elder",
  top: "#f4f2ea",
  topLight: "#ffffff",
  topShade: "#d0ccbe",
  sleeve: "full",
  hairStyle: "wrap",
  hair: "#f6f2ea",
  hairLight: "#ffffff",
  lowerColor: "#e8e2d2",
  mustache: "#d9d4cc",
  seed: 77,
};
const mkKid = (i: number): CastMember => ({
  ...CAST.listenerKid,
  id: `mk${i}`,
  hairStyle: "wrap",
  hair: "#f4f0e6",
  hairLight: "#ffffff",
  top: ["#f2efe6", "#dfe8d8", "#e8e2f0"][i % 3],
  topLight: "#ffffff",
  topShade: "#c8c2b2",
  seed: 80 + i,
});
const BRO_TOPS = [
  ["#f4ecdc", "#fffaf0", "#cdbfa6"],
  ["#e8d6b0", "#f6e8c8", "#c2ad84"],
  ["#d8e2ea", "#eef4f8", "#a8b6c2"],
  ["#f2e2c8", "#fff4e0", "#cdb898"],
  ["#e4d8ec", "#f4ecf8", "#b8a8c4"],
  ["#dfe8d0", "#f0f6e4", "#b0bc9a"],
];
const brother = (i: number): CastMember => {
  const t = BRO_TOPS[i % BRO_TOPS.length];
  const elder = i < 2;
  return {
    ...CAST.babukaka,
    id: `bro${i}`,
    age: elder ? "elder" : "adult",
    height: 0.95 + ((i * 7) % 5) * 0.03,
    girth: 0.92 + ((i * 3) % 4) * 0.05,
    hair: elder ? "#d8d2c8" : "#1d1513",
    hairLight: elder ? "#ffffff" : "#5a4438",
    hairStyle: elder ? "balding" : i % 3 === 0 ? "cropped" : "parted",
    top: t[0],
    topLight: t[1],
    topShade: t[2],
    outfit: i % 4 === 3 ? "vest" : "kurta",
    sleeve: i % 2 ? "full" : "rolled",
    mustache: i % 3 === 1 ? undefined : elder ? "#d8d2c8" : "#1d1513",
    glasses: i === 0,
    scarf: i === 0 ? { color: "#efe6d2", shade: "#cbbd9f", trim: "#b48a3c", style: "drape" } : undefined,
    seed: 100 + i,
  };
};
const BROTHERS = Array.from({ length: 12 }, (_, i) => brother(i));

/* ---------------- props ---------------- */

const P_PUTHI: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale}) rotate(80)`}>
    <rect x={-26} y={-6} width={52} height={12} rx={3} fill="#e8d098" />
    <line x1={-22} y1={0} x2={22} y2={0} stroke="#8a6a3a" strokeWidth={1} />
  </g>
);
const P_BASKET: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale})`}>
    <path d="M -26 0 Q 0 30 26 0 Z" fill="#a87a3a" />
    {[-14, 0, 14].map((x) => (
      <circle key={x} cx={x} cy={-4} r={8} fill={x ? "#d8452a" : "#6a9a3a"} />
    ))}
  </g>
);
const P_LADLE: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale})`}>
    <line x1={0} y1={-10} x2={0} y2={120} stroke="#6a4a2a" strokeWidth={6} strokeLinecap="round" />
    <ellipse cx={0} cy={124} rx={16} ry={8} fill="#8a6a42" />
  </g>
);
const PROPS: Record<string, PropRenderer> = { puthi: P_PUTHI, basket: P_BASKET, ladle: P_LADLE };

/** HTML overlay badge (icons + Bangla word), pops in at `at`. */
const Badge: React.FC<{ f: number; at: number; x: number; y: number; children: React.ReactNode; out?: number }> = ({ f, at, x, y, children, out = 9999 }) => {
  const t = clamp((f - at) / 12) * clamp((out - f) / 10);
  const e = EASE.backOut ? EASE.backOut(clamp((f - at) / 14)) : t;
  if (t <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * e})`,
        opacity: t,
        fontFamily: BN_FONT,
        fontWeight: 700,
        color: "#4a1e0a",
        background: "linear-gradient(180deg, #fff4d6, #f2d28a)",
        border: "3px solid #8a5a2a",
        borderRadius: 18,
        padding: "6px 22px",
        fontSize: 40,
        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};

/* ================================================================== */
/* SHOT 1 — "অনেকদিন আগে…" sky tilts down onto Medinimondal            */
/* ================================================================== */

const ShotVillage: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.village.from;
  const cam = {
    x: track(f, [
      [0, -120],
      [200, 60],
    ]),
    y: track(f, [
      [0, -420],
      [20, -410],
      [110, 40, "inOut"],
      [200, 70],
    ]),
    zoom: track(f, [
      [0, 1.0],
      [110, 1.05],
      [200, 1.22],
    ]),
    focus: 1,
    dof: 2.2,
  };
  const farmer = A([
    { f: 0, bodyX: -260, stride: 0.8, bodyTurn: 0.6, headTurn: 0.2, rS: 150, rE: 30, rHand: "hold", rProp: "basket", lS: 10, lE: -20 },
    { f: 200, bodyX: 260, ease: "linear", in: 200 },
  ]);
  const kid = A([
    { f: 0, bodyX: -380, stride: 1, bodyTurn: 0.6, headTurn: 0.4, smile: 0.8, rS: 40, rE: 20, lS: -10, lE: -30 },
    { f: 200, bodyX: 200, ease: "linear", in: 200 },
  ]);
  return (
    <Stage cam={cam} opacity={clamp(f / 12)}>
      <SceneLights.Provider value={[SUN]}>
        <Layer depth={0.05}>
          <DaySky f={f} />
        </Layer>
        <Layer depth={0.4}>
          <VillageFields f={f} />
        </Layer>
        <Layer depth={0.85}>
          {/* village name board by the path */}
          <g transform={`translate(1240, 900) scale(${0.6 + 0.4 * EASE.out(clamp((f - 76) / 18))})`} opacity={clamp((f - 70) / 12)}>
            <rect x={-6} y={-150} width={12} height={150} fill="#6a4a2a" />
            <rect x={-170} y={-210} width={340} height={78} rx={10} fill="#e8c88a" stroke="#6a4a2a" strokeWidth={5} />
            <text x={0} y={-157} textAnchor="middle" fontFamily={BN_FONT} fontWeight={800} fontSize={44} fill="#4a1e0a">
              মেদিনীমণ্ডল
            </text>
          </g>
          <path d="M -400 960 Q 960 900 2400 980 L 2400 1100 L -400 1100 Z" fill="#c8a86a" />
          <path d="M -400 960 Q 960 900 2400 980" stroke="#a8884a" strokeWidth={4} fill="none" />
        </Layer>
        <Layer depth={1}>
          <Puppet cast={CAST.listenerA} f={f} x={760} y={1000} scale={0.95} acting={farmer} props={PROPS} light={DAY_LIGHT} />
          <Puppet cast={CAST.listenerKid} f={f} x={760} y={1010} scale={0.95} acting={kid} light={DAY_LIGHT} />
        </Layer>
        <Layer depth={1.35}>
          <Palm x={-80} y={1180} s={1.6} f={f} seed={9} />
          <Banana x={2000} y={1160} s={2.0} f={f} />
        </Layer>
        <Grade warmth={0.22} vignette={0.45} bloomAt={[76, 22]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 2 — the mighty Padma to the south                             */
/* ================================================================== */

const ShotPadma: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.padma.from;
  const rough = track(f, [
    [194, 0.35],
    [240, 0.45],
    [262, 1, "inOut"],
    [330, 0.9],
  ]);
  const cam = {
    x: track(f, [
      [194, -200],
      [330, 220],
    ]),
    y: track(f, [
      [194, 40],
      [330, 90],
    ]),
    zoom: track(f, [
      [194, 1.05],
      [262, 1.14],
      [330, 1.3],
    ]),
    focus: 1,
    dof: 2,
    shake: Math.max(0, rough - 0.7) * 3,
  };
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.padma.from) / DIS)}>
      <SceneLights.Provider value={[SUN]}>
        <Layer depth={0.05}>
          <DaySky f={f} sunX={900} sunY={260} />
        </Layer>
        <Layer depth={0.3}>
          <PadmaDay f={f} rough={rough} y0={560} />
        </Layer>
        <Layer depth={0.45}>
          <Boats f={f} y0={560} />
          <Birds f={f} x={-200} y={380} n={5} s={1.2} />
        </Layer>
        <Layer depth={1}>
          <NearBank f={f} y={950} crumble={clamp((f - 258) / 40)} />
        </Layer>
        <Layer depth={1.35}>
          <Palm x={1900} y={1220} s={1.7} f={f} seed={3} />
        </Layer>
        <Grade warmth={0.12} vignette={0.5} bloomAt={[48, 22]} />
      </SceneLights.Provider>
      {/* "দক্ষিণ" — direction marker */}
      <Badge f={f} at={212} x={260} y={180} out={300}>
        <svg width={44} height={44} viewBox="-22 -22 44 44">
          <circle r={20} fill="#fff4d6" stroke="#8a5a2a" strokeWidth={2} />
          <path d={`M 0 ${18} L 8 -2 L 0 4 L -8 -2 Z`} fill="#a83a2a" />
        </svg>
        দক্ষিণে পদ্মা
      </Badge>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 3 — riverside station → the bazaar                            */
/* ================================================================== */

const ShotStation: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.station.from;
  const cam = {
    x: track(f, [
      [324, -1180],
      [396, -1060],
      [422, 1060, "inOut"],
      [456, 1120],
    ]),
    y: track(f, [
      [324, 0],
      [456, 20],
    ]),
    zoom: track(f, [
      [324, 1.1],
      [396, 1.18],
      [420, 1.25, "inOut"],
      [456, 1.3],
    ]),
    focus: 1,
    dof: 2.2,
  };
  const porter = A([
    { f: 324, bodyX: 200, stride: 0.7, bodyTurn: -0.6, headTurn: -0.2, rS: 160, rE: 20, rHand: "hold", rProp: "basket", lS: 8, lE: -20 },
    { f: 400, bodyX: -100, ease: "linear", in: 76 },
  ]);
  const buyers = [idleLife(501, { partner: 1, watch: 0.3, chatty: 0.9 }), idleLife(502, { partner: -1, watch: -0.2, chatty: 0.9 }), idleLife(503, { partner: -1, watch: 0.1, chatty: 0.7 })];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.station.from) / DIS)}>
      <SceneLights.Provider value={[SUN]}>
        <Layer depth={0.05}>
          <DaySky f={f} />
        </Layer>
        <Layer depth={0.3}>
          <PadmaDay f={f} rough={0.35} y0={520} />
        </Layer>
        <Layer depth={0.5}>
          <Steamer f={f} x={-120} y={640} s={0.9} arrive={EASE.out(clamp((f - 324) / 60))} />
        </Layer>
        <Layer depth={0.85}>
          <path d="M -1200 800 L 3000 800 L 3000 1300 L -1200 1300 Z" fill="#b59a6a" />
          <g transform="translate(-700, 60)">
            <Station f={f} />
          </g>
          <Puppet cast={CAST.dhaki} f={f} x={300} y={820} scale={0.85} acting={porter} props={PROPS} light={DAY_LIGHT} />
          <Puppet cast={CAST.listenerB} f={f} x={120} y={820} scale={0.85} acting={A([{ f: 324, bodyTurn: 0.3, headTurn: 0.5, eyeX: 0.6, lS: 10, lE: -40, rS: 6, rE: -20 }])} light={DAY_LIGHT} />
          <g transform="translate(1180, -330) scale(1.45)">
            <Bazaar f={f} />
          </g>
          <Puppet cast={CAST.womanB} f={f} x={1420} y={1060} scale={0.95} acting={buyers[0].acting} mouth={buyers[0].mouth} light={DAY_LIGHT} />
          <Puppet cast={CAST.listenerA} f={f} x={1800} y={1060} scale={0.95} acting={buyers[1].acting} mouth={buyers[1].mouth} light={DAY_LIGHT} props={PROPS} />
          <Puppet cast={CAST.listenerKid} f={f} x={2250} y={1070} scale={0.9} acting={buyers[2].acting} mouth={buyers[2].mouth} light={DAY_LIGHT} />
          <Puppet cast={CAST.babukaka} f={f} x={2440} y={1060} scale={0.95} acting={idleLife(504, { partner: -1, chatty: 0.8 }).acting} light={DAY_LIGHT} />
        </Layer>
        <Grade warmth={0.2} vignette={0.48} bloomAt={[30, 20]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 4 — the tol under the banyan, the maktab beside it            */
/* ================================================================== */

const ShotTol: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.tol.from;
  const cam = {
    x: track(f, [
      [450, -1230],
      [497, -1170],
      [512, 900, "inOut"],
      [566, 960],
    ]),
    y: track(f, [
      [450, 400],
      [566, 400],
    ]),
    zoom: track(f, [
      [450, 1.45],
      [495, 1.5],
      [510, 1.42, "inOut"],
      [566, 1.5],
    ]),
    focus: 1,
    dof: 2.2,
  };
  // reciting: gentle rocking nods; mouths chant
  const recite = (seed: number, turn: number) => {
    const base = A([{ f: 450, bodyTurn: turn, headTurn: turn * 0.7, eyeY: 0.5, smile: 0.4, rS: 30, rE: -110, rHand: "hold", rProp: "puthi", lS: 20, lE: -110, lHand: "open" }]);
    return (fr: number) => {
      const b = base(fr);
      return { ...b, headNod: (b.headNod ?? 0) + Math.sin(fr * 0.28 + seed) * 4, lean: (b.lean ?? 0) + Math.sin(fr * 0.14 + seed) * 2 };
    };
  };
  const pandit = A([
    { f: 450, bodyTurn: 0.35, headTurn: 0.4, eyeX: 0.6, lid: 0.3, smile: 0.3, rS: 60, rE: 70, rHand: "point", lS: 15, lE: -100, lHand: "hold", lProp: "puthi" },
    { f: 480, rS: 70, rE: 50, headNod: 4 },
    { f: 510, rS: 55, rE: 80, headNod: 0 },
  ]);
  const maulvi = A([
    { f: 450, bodyTurn: -0.35, headTurn: -0.4, eyeX: -0.6, smile: 0.35, rS: 15, rE: -100, rHand: "hold", rProp: "puthi", lS: 50, lE: 70, lHand: "open" },
    { f: 520, lS: 65, lE: 50, headNod: 4 },
  ]);
  const chant = (seed: number) => (fr: number) => visemeChatter(fr, seed, 0.6);
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.tol.from) / DIS)}>
      <SceneLights.Provider value={[SUN]}>
        <Layer depth={0.05}>
          <DaySky f={f} sunX={1700} />
        </Layer>
        <Layer depth={0.35}>
          <VillageFields f={f} />
        </Layer>
        <Layer depth={0.85}>
          <path d="M -1200 880 L 3000 880 L 3000 1400 L -1200 1400 Z" fill="#c8b07a" />
          <Banyan x={-200} y={900} s={1.05} f={f} />
          <Maktab x={1780} y={880} s={0.95} />
          <text x={-200} y={160} textAnchor="middle" fontFamily={BN_FONT} fontWeight={800} fontSize={44} fill="#4a1e0a" opacity={clamp((f - 470) / 10)}>
            টোল
          </text>
          {/* tol mat */}
          <ellipse cx={-120} cy={1010} rx={420} ry={50} fill="#d8b878" />
          <Puppet cast={CAST.listenerB} f={f} x={-380} y={1000} scale={1.0} seated acting={pandit} props={PROPS} light={DAY_LIGHT} />
          <Puppet cast={CAST.gopal} f={f} x={-120} y={1010} scale={0.95} seated acting={recite(1, -0.45)} mouth={chant(1)} props={PROPS} light={DAY_LIGHT} />
          <Puppet cast={CAST.rama} f={f} x={60} y={1015} scale={0.95} seated acting={recite(2, -0.4)} mouth={chant(2)} props={PROPS} light={DAY_LIGHT} />
          <Puppet cast={CAST.listenerKid} f={f} x={230} y={1010} scale={0.92} seated acting={recite(3, -0.5)} mouth={chant(3)} props={PROPS} light={DAY_LIGHT} />
          {/* maktab mat */}
          <ellipse cx={1720} cy={1010} rx={400} ry={50} fill="#c8d0a8" />
          <Puppet cast={MAULVI} f={f} x={2000} y={1000} scale={1.0} seated acting={maulvi} props={PROPS} light={DAY_LIGHT} />
          {[0, 1, 2].map((i) => (
            <Puppet key={i} cast={mkKid(i)} f={f} x={1500 + i * 165} y={1012} scale={0.92} seated acting={recite(10 + i, 0.45)} mouth={chant(10 + i)} props={PROPS} light={DAY_LIGHT} />
          ))}
        </Layer>
        <Layer depth={1.3}>
          <Banana x={-2050} y={1200} s={2.2} f={f} />
        </Layer>
        <Grade warmth={0.22} vignette={0.5} bloomAt={[80, 18]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 5 — the route, as an illustrated map                          */
/* ================================================================== */

const ShotMap: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.map.from;
  const p = track(f, [
    [590, 0],
    [780, 1, "inOut"],
  ]);
  const pins = [clamp((f - 566) / 14), clamp((f - 712) / 14), clamp((f - 742) / 14), clamp((f - 772) / 14)];
  const cam = {
    x: track(f, [
      [560, -60],
      [640, -280, "inOut"],
      [720, -60, "inOut"],
      [800, 300, "inOut"],
    ]),
    y: track(f, [
      [560, 40],
      [640, 180, "inOut"],
      [720, -60, "inOut"],
      [800, -220, "inOut"],
    ]),
    zoom: track(f, [
      [560, 1.0],
      [640, 1.35, "inOut"],
      [720, 1.3],
      [800, 1.55, "inOut"],
    ]),
    focus: 1,
    dof: 0,
  };
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.map.from) / DIS)} background="#3a2614">
      <Layer depth={1}>
        <rect x={-1200} y={-800} width={4400} height={2700} fill="#4a301a" />
        <StoryMap f={f} p={p} pins={pins} />
      </Layer>
      <Grade warmth={0.3} vignette={0.6} />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 6 — the great Baidik Bari; twelve brothers; the joint family  */
/* ================================================================== */

const ShotBari: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.bari.from;
  const cam = {
    x: track(f, [
      [798, 0],
      [842, 0],
      [843, 0],
      [905, 0],
      [960, 0, "inOut"],
      [1000, 0],
    ]),
    y: track(f, [
      [798, -60],
      [842, -40],
      [843, 230],
      [905, 220],
      [960, 140, "inOut"],
      [1000, 140],
    ]),
    zoom: track(f, [
      [798, 1.0],
      [842, 1.08],
      [843, 1.55],
      [905, 1.5],
      [960, 1.15, "inOut"],
      [1000, 1.12],
    ]),
    focus: 1,
    dof: 2,
  };
  const BRO_AT = (i: number) => 852 + i * 5;
  const broActing = (i: number) => {
    const keys: PoseKey<Pose>[] = [
      { f: 798, bodyTurn: (i - 5.5) * -0.04, smile: 0.5, headTurn: (i - 5.5) * -0.03, rS: 8, rE: -20, lS: 8, lE: -20 },
    ];
    if (i % 3 === 0) keys.push({ f: BRO_AT(i) + 10, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", headNod: 6, in: 10 });
    else if (i % 3 === 1) keys.push({ f: BRO_AT(i) + 10, rS: 40, rE: 30, rHand: "open", headTilt: 4, in: 10 });
    const base = A(keys);
    return (fr: number) => {
      const b = base(fr);
      return { ...b, bodyX: noise1(fr * 0.015, i) * 3, headNod: (b.headNod ?? 0) + noise1(fr * 0.02, i + 30) * 1.5 };
    };
  };
  const pop = (at: number) => EASE.out(clamp((f - at) / 10));
  const fam = [idleLife(611, { partner: 1, chatty: 0.6 }), idleLife(612, { partner: -1, chatty: 0.7 }), idleLife(613, { partner: 1, chatty: 0.5 }), idleLife(614, { partner: -1, chatty: 0.8 })];
  const famIn = EASE.out(clamp((f - 905) / 16));
  const count = Math.max(0, Math.min(12, Math.floor((f - 852) / 5) + 1));
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.bari.from) / DIS)}>
      <SceneLights.Provider value={[SUN]}>
        <Layer depth={0.05}>
          <DaySky f={f} />
        </Layer>
        <Layer depth={0.3}>
          <VillageFields f={f} />
        </Layer>
        <Layer depth={0.7}>
          <BaidikBariDay f={f} />
          <path d="M -900 785 L 2800 785 L 2800 1300 L -900 1300 Z" fill="#d8c09a" />
          <path d="M -900 785 L 2800 785" stroke="#b8a07a" strokeWidth={6} />
        </Layer>
        <Layer depth={1}>
          {/* family at the sides (joins on "বিশাল যৌথ পরিবার") */}
          <g opacity={famIn}>
            <Puppet cast={CAST.manorama} f={f} x={130} y={990} scale={0.82} acting={fam[0].acting} mouth={fam[0].mouth} light={DAY_LIGHT} />
            <Puppet cast={CAST.womanA} f={f} x={260} y={1000} scale={0.8} acting={fam[1].acting} mouth={fam[1].mouth} light={DAY_LIGHT} />
            <Puppet cast={CAST.charu} f={f} x={1660} y={990} scale={0.8} acting={fam[2].acting} mouth={fam[2].mouth} light={DAY_LIGHT} />
            <Puppet cast={CAST.womanB} f={f} x={1790} y={1000} scale={0.8} acting={fam[3].acting} mouth={fam[3].mouth} light={DAY_LIGHT} />
            <Puppet cast={CAST.gopal} f={f} x={360} y={1040} scale={0.72} acting={idleLife(615, { partner: 1, chatty: 0.9 }).acting} light={DAY_LIGHT} />
            <Puppet cast={CAST.madhu} f={f} x={1560} y={1045} scale={0.72} acting={idleLife(616, { partner: -1, chatty: 0.9 }).acting} light={DAY_LIGHT} />
            <Puppet cast={CAST.rama} f={f} x={1460} y={1045} scale={0.72} acting={idleLife(617, { partner: 1, chatty: 0.9 }).acting} light={DAY_LIGHT} />
          </g>
          {/* twelve brothers: back row 6, front row 6 */}
          {BROTHERS.map((b, i) => {
            const row = i < 6 ? 0 : 1;
            const col = i % 6;
            const x = 540 + col * 165 + (row ? 82 : 0);
            const y = row ? 1040 : 950;
            const k = pop(BRO_AT(i));
            if (k <= 0) return null;
            return (
              <g key={b.id} opacity={k} transform={`translate(0, ${(1 - k) * 30})`}>
                <Puppet cast={b} f={f} x={x} y={y} scale={row ? 0.86 : 0.76} acting={broActing(i)} light={DAY_LIGHT} />
              </g>
            );
          })}
        </Layer>
        <Grade warmth={0.22} vignette={0.5} bloomAt={[76, 20]} />
      </SceneLights.Provider>
      {f >= 852 && (
        <Badge f={f} at={852} x={960} y={120} out={1000}>
          <span style={{ fontSize: 56, fontWeight: 800, minWidth: 70, textAlign: "center" }}>{bn(count)}</span> ভাই
        </Badge>
      )}
      <Badge f={f} at={912} x={960} y={220} out={1000}>
        বিশাল যৌথ পরিবার
      </Badge>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 7 — two meals a day, a maund and a half of rice               */
/* ================================================================== */

const ShotKitchen: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.kitchen.from;
  const cam = {
    x: track(f, [
      [994, 0],
      [1060, -40],
      [1162, 30],
    ]),
    y: track(f, [
      [994, 80],
      [1162, 30],
    ]),
    zoom: track(f, [
      [994, 1.25],
      [1060, 1.15, "inOut"],
      [1162, 1.05],
    ]),
    focus: 1,
    dof: 2,
  };
  const stir = (seed: number, side: 1 | -1) => {
    const base = A([{ f: 994, bodyTurn: side * 0.4, headTurn: side * 0.3, eyeY: 0.5, smile: 0.55, rS: 70, rE: 40, rHand: "hold", rProp: "ladle", lS: 30, lE: -60, lHand: "open" }]);
    return (fr: number) => {
      const b = base(fr);
      return { ...b, rS: b.rS + Math.sin(fr * 0.16 + seed) * 10, rE: b.rE + Math.cos(fr * 0.16 + seed) * 14, lean: Math.sin(fr * 0.16 + seed) * 2 };
    };
  };
  const kidAwe = (seed: number) =>
    A([
      { f: 994, bodyTurn: 0, headTurn: 0, eyeY: -0.4, smile: 0.5, rS: 10, rE: -30, lS: 10, lE: -30 },
      { f: 1080 + seed, gasp: 0.5, brow: 0.8, rS: -14, rE: -170, rHand: "open", in: 10 },
      { f: 1120 + seed, gasp: 0, smile: 0.9, brow: 0.5, rS: 10, rE: -30, in: 14 },
    ]);
  const LIGHTS: SceneLight[] = [
    { x: 1300, y: 140, color: "#fff0c8", intensity: 0.7, radius: 1500 },
    { x: 560, y: 820, color: "#ff9a3c", intensity: 0.55, radius: 600, flicker: 3 },
    { x: 1360, y: 820, color: "#ff9a3c", intensity: 0.55, radius: 600, flicker: 6 },
  ];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.kitchen.from) / DIS) * clamp((1162 - f) / 14)}>
      <SceneLights.Provider value={LIGHTS}>
        <Layer depth={0.6}>
          <GreatKitchen f={f} />
        </Layer>
        <Layer depth={0.9}>
          <GiantPot x={560} y={830} s={0.95} f={f} seed={1} />
          <GiantPot x={1360} y={830} s={0.95} f={f} seed={2} />
          <Puppet cast={CAST.womanA} f={f} x={300} y={900} scale={1.05} acting={stir(1, 1)} props={PROPS} />
          <Puppet cast={CAST.manorama} f={f} x={1650} y={900} scale={1.05} flip acting={stir(2, -1)} props={PROPS} />
          <g opacity={EASE.out(clamp((f - 1076) / 14))}>
            <RiceSack x={900} y={900} s={1.0} text="দেড় মণ" />
            <RiceSack x={1040} y={910} s={0.85} />
          </g>
        </Layer>
        <Layer depth={1.2}>
          <RiceHeaps x={140} y={1060} s={1.1} n={3} />
          <RiceHeaps x={1460} y={1060} s={1.1} n={3} />
          <Puppet cast={CAST.madhu} f={f} x={800} y={1050} scale={1.0} acting={kidAwe(0)} />
          <Puppet cast={CAST.gopal} f={f} x={1110} y={1055} scale={1.05} acting={kidAwe(6)} />
        </Layer>
        <Grade warmth={0.35} vignette={0.55} bloomAt={[68, 14]} />
      </SceneLights.Provider>
      {/* দু'বেলা: morning and night pots */}
      <Badge f={f} at={1040} x={560} y={110} out={1160}>
        <svg width={40} height={40} viewBox="-20 -20 40 40">
          <circle r={9} fill="#f2a83a" />
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1={Math.cos((i / 8) * 6.283) * 12} y1={Math.sin((i / 8) * 6.283) * 12} x2={Math.cos((i / 8) * 6.283) * 18} y2={Math.sin((i / 8) * 6.283) * 18} stroke="#f2a83a" strokeWidth={3} />
          ))}
        </svg>
        দুপুর
      </Badge>
      <Badge f={f} at={1050} x={1360} y={110} out={1160}>
        <svg width={40} height={40} viewBox="-20 -20 40 40">
          <path d="M 2 -16 A 16 16 0 1 0 2 16 A 10 16 0 1 1 2 -16 Z" fill="#5a6a9a" />
        </svg>
        রাত
      </Badge>
    </Stage>
  );
};

/* ================================================================== */

export const Scene01Village: React.FC<{ scene: SceneTiming }> = () => {
  const seq = (k: keyof typeof SHOTS, el: React.ReactNode, last = false) => (
    <Sequence from={SHOTS[k].from} durationInFrames={SHOTS[k].to - SHOTS[k].from + (last ? 0 : DIS)} layout="none">
      {el}
    </Sequence>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
      {seq("village", <ShotVillage />)}
      {seq("padma", <ShotPadma />)}
      {seq("station", <ShotStation />)}
      {seq("tol", <ShotTol />)}
      {seq("map", <ShotMap />)}
      {seq("bari", <ShotBari />)}
      {seq("kitchen", <ShotKitchen />, true)}
    </div>
  );
};

/** Sound bed (no voices): river ambience, village music, water on the Padma, the steamer's horn. Scene-local frames. */
export const Scene01SoundBed: React.FC<{ scene: SceneTiming }> = () => (
  <>
    <Audio
      src={staticFile("audio/ambient/padma_river_day.wav")}
      loop
      volume={(fr) => interpolate(fr, [0, 20, 190, 230, 330, 420, 1140, 1162], [0, 0.14, 0.14, 0.3, 0.26, 0.12, 0.1, 0], { extrapolateRight: "clamp" })}
    />
    <Audio src={staticFile("audio/music/Village_Peace_Loop.wav")} loop volume={(fr) => interpolate(fr, [0, 24, 1130, 1162], [0, 0.16, 0.16, 0], { extrapolateRight: "clamp" })} />
    <Sequence from={210} durationInFrames={120} layout="none">
      <Audio src={staticFile("audio/sfx/river_water.wav")} volume={(fr) => interpolate(fr, [0, 20, 90, 120], [0, 0.35, 0.35, 0], { extrapolateRight: "clamp" })} />
    </Sequence>
    <Sequence from={340} durationInFrames={120} layout="none">
      <Audio src={staticFile("audio/sfx/distant_ship_horn.wav")} volume={0.35} />
    </Sequence>
  </>
);

export const Scene01Demo: React.FC = () => {
  const scene = SCENE01;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene01Village scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
        <Scene01SoundBed scene={scene} />
      </DuckProvider>
      <CueSubtitles cues={SCENE01_CUES} />
    </div>
  );
};
