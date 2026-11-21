import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "../audio/Mix";
import { EPISODE_01_SCENES } from "../../data/episode01Data";
import { SceneTiming } from "../../types/studio";
import { clamp, hash, makeActing, noise1, PoseKey, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { Bokeh, Glow, GlowDefs } from "../fx/Fx";
import { CAST } from "../rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../rig/lipsync";
import { BASE_POSE, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../rig/Puppet";
import { CueSubtitles } from "../Scene02Demo";
import { AmavasyaSky } from "../sets/Exteriors";
import { CourtyardBack, CourtyardFloor, Dhak, TulsiMancha } from "../sets/Interiors";
import { KaliMandap, MandapCrowd } from "../sets/Sacred";

/**
 * Episode 1 · Scene 04 — "Seven Waves of Ulu".
 * The priest calls for jokar to begin the puja; instead seven waves of ulu-dhwani rise from the
 * andarmahal (a child is born). By family custom the birth brings ashauch, so the puja cannot go on:
 * the bell falls, the dhak stops, the bansi stops — and the whole festival freezes.
 */

export const SCENE04 = EPISODE_01_SCENES.find((s) => s.sceneId === "04_seven_uludhwani")!;

const SHOTS = {
  priest: { from: 0, to: 170 }, // জোকার দাও! … ঠিক যখন পুরোহিত মশাই পূজো শুরু করবেন
  andar: { from: 164, to: 305 }, // অমনি অন্দরবাড়ি থেকে … সাত ঝাঁক উলুধ্বনি!
  realise: { from: 299, to: 495 }, // পুরনো পারিবারিক রীতি … পূজো করা যায় না
  freeze: { from: 489, to: 678 }, // ঢাক থেমে গেল, বাঁশি থেমে গেল — থমকে দাঁড়াল
};
const DIS = 8;

const ULU_FROM = 182; // first wave
const ULU_GAP = 15; // seven waves
const BELL_DROP = 462; // "…পূজো করা যায় না"
const DHAK_STOP = 503; // "এক মুহূর্তে ঢাক থেমে গেল"
const BANSI_STOP = 548; // "বাঁশি থেমে গেল"
const FREEZE = 584; // "সারা বাড়ির উৎসব যেন হঠাৎ থমকে দাঁড়াল"

export const SCENE04_CUES = [
  { from: 0, to: 70, who: "ভগবতী ঠাকুর", text: "জোকার দাও! জোকার!" },
  { from: 79, to: 164, who: "কথক", text: "ঠিক যখন পুরোহিত মশাই পূজো শুরু করবেন," },
  { from: 171, to: 282, who: "কথক", text: "অমনি অন্দরবাড়ি থেকে ভেসে এল পরপর সাত ঝাঁক উলুধ্বনি!" },
  { from: 310, to: 392, who: "কথক", text: "পুরনো পারিবারিক রীতি অনুযায়ী," },
  { from: 392, to: 476, who: "কথক", text: "বাড়িতে নতুন শিশু জন্মালে অশৌচের কারণে আর নিয়মিত পূজো করা যায় না।" },
  { from: 499, to: 536, who: "কথক", text: "এক মুহূর্তে ঢাক থেমে গেল," },
  { from: 544, to: 568, who: "কথক", text: "বাঁশি থেমে গেল—" },
  { from: 578, to: 670, who: "কথক", text: "সারা বাড়ির উৎসব যেন হঠাৎ থমকে দাঁড়াল!" },
];

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

const voice = (scene: SceneTiming, file: string, seed: number) => {
  const clip = scene.clips.find((c) => c.file === file);
  return {
    mouth: (fr: number): MouthState => (clip ? visemeFromEnvelope(clip.rmsEnvelope, fr - clip.offsetFrame, seed, clip.subtitleBn) : MOUTH_REST),
    talk: (fr: number) => (clip ? speechLevel(clip.rmsEnvelope, fr - clip.offsetFrame) : 0),
  };
};

/** World clock that stops dead at the freeze (camera keeps moving). */
const world = (f: number) => (f < FREEZE ? f : FREEZE + (1 - Math.exp(-(f - FREEZE) / 4)) * 3);

/* ---------------- props ---------------- */

/** Brass ghanta; swings while ringing (`ring` 0..1). */
const bellProp = (ring: (f: number) => number): PropRenderer => ({ f, scale }) => (
  <g transform={`scale(${scale}) rotate(${Math.sin(f * 0.95) * 22 * ring(f)}, 0, 0)`}>
    <rect x={-3} y={-6} width={6} height={22} fill="#c9932e" />
    <circle cx={0} cy={-8} r={5} fill="#e6b84c" />
    <path d="M -17 46 Q -15 19 0 17 Q 15 19 17 46 Z" fill="#e6b84c" />
    <path d="M -10 42 Q -9 24 -2 21" stroke="#fff0b8" strokeWidth={2.5} fill="none" opacity={0.7} />
    <circle cx={0} cy={48} r={4} fill="#a87420" />
  </g>
);
const P_STICK: PropRenderer = ({ scale }) => (
  <g>
    <line x1={0} y1={-6} x2={0} y2={62 * scale} stroke="#8a5a2a" strokeWidth={4 * scale} strokeLinecap="round" />
    <circle cx={0} cy={62 * scale} r={3 * scale} fill="#6a3a1a" />
  </g>
);
/** Bamboo bansi, held across the face. */
const P_BANSI: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale}) rotate(175)`}>
    <rect x={-8} y={-4} width={150} height={8} rx={4} fill="#d8b46a" />
    {[30, 52, 70, 88, 106, 124].map((x) => (
      <circle key={x} cx={x} cy={0} r={2} fill="#5a3a14" />
    ))}
    <rect x={-8} y={-4} width={10} height={8} fill="#a8282a" />
    <rect x={134} y={-4} width={8} height={8} fill="#a8282a" />
  </g>
);

/* ---------------- ulu ---------------- */

/** Ulu-dhwani: hand cupped at the mouth, tongue trill → fast small mouth flutter. */
const uluMouth = (start: number, end: number, seed: number) => (fr: number): MouthState => {
  if (fr < start || fr > end) return MOUTH_REST;
  const trill = 0.5 + 0.5 * Math.sin(fr * 2.4 + seed);
  return { open: 0.28 + trill * 0.2, width: 0.82, round: 0.65, teeth: 0.1 };
};

/** Seven waves of sound rolling out of the andarmahal. */
const UluWaves: React.FC<{ f: number; x: number; y: number; s?: number; o?: number }> = ({ f, x, y, s = 1, o = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`} style={{ mixBlendMode: "screen" }}>
    {Array.from({ length: 7 }, (_, k) => {
      const t = (f - (ULU_FROM + k * ULU_GAP)) / 46;
      if (t < 0 || t > 1) return null;
      const r = 150 + t * 620;
      const a = (1 - t) * (1 - t) * o * 0.4;
      return (
        <g key={k} opacity={a}>
          <ellipse cx={0} cy={0} rx={r} ry={r * 0.55} fill="none" stroke="#ffe3a0" strokeWidth={3 * (1 - t) + 1} />
        </g>
      );
    })}
  </g>
);

/** Small gold pips counting the seven waves. */
const WaveCount: React.FC<{ f: number; x: number; y: number; o?: number }> = ({ f, x, y, o = 1 }) => (
  <g transform={`translate(${x}, ${y})`} opacity={o}>
    {Array.from({ length: 7 }, (_, k) => {
      const on = clamp((f - (ULU_FROM + k * ULU_GAP)) / 5);
      return (
        <g key={k} transform={`translate(${(k - 3) * 30}, 0) scale(${0.6 + on * 0.4 + Math.max(0, 1 - Math.abs(f - (ULU_FROM + k * ULU_GAP) - 4) / 6) * 0.5})`}>
          <circle r={9} fill="#ffe3a0" opacity={0.15 + on * 0.85} />
          <circle r={4} fill="#fffaf0" opacity={on} />
        </g>
      );
    })}
  </g>
);

/* ================================================================== */
/* SHOT 1 — the priest calls for jokar and raises the bell            */
/* ================================================================== */

const ShotPriest: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.priest.from;
  const v = voice(scene, "04a_Scene4_Bhagabati.wav", 41);
  const cam = {
    x: track(f, [
      [0, 330],
      [70, 320],
      [170, 120, "inOut"],
    ]),
    y: track(f, [
      [0, 10],
      [70, 20],
      [170, 60],
    ]),
    zoom: track(f, [
      [0, 1.75],
      [70, 1.7],
      [170, 1.22, "inOut"],
    ]),
    focus: 1,
    dof: 2.4,
  };
  const priest = A([
    { f: 0, bodyTurn: 0.35, headTurn: 0.45, eyeX: 0.9, brow: 0.5, smile: 0.1, rS: 100, rE: 30, rHand: "open", lS: 25, lE: -70, lHand: "hold", lProp: "bell", lean: -2 },
    { f: 22, rS: 120, rE: 10, headNod: -3 },
    { f: 40, rS: 95, rE: 40, lean: 1 },
    { f: 58, rS: 125, rE: 5, brow: 0.7, headNod: -4 },
    { f: 84, bodyTurn: -0.2, headTurn: -0.2, eyeX: -0.4, brow: 0.2, rS: 20, rE: -60, rHand: "pranam", lS: 70, lE: 30, smile: 0.25, in: 16 },
    { f: 130, lS: 85, lE: 25, headNod: 3, lid: 0.35, in: 20 },
  ]);
  const ring = (fr: number) => clamp((fr - 100) / 10);
  const dhaki = A([{ f: 0, bodyTurn: 0.4, headNod: 6, headTilt: 8, lid: 0.7, smile: 0.35, rS: 10, rE: -50, rHand: "hold", rProp: "stick", lS: 12, lE: -45, lHand: "hold", lProp: "stick" }]);
  const dhakiBeat = (fr: number) => {
    const b = dhaki(fr);
    return { ...b, rE: b.rE + Math.sin(fr * 0.95) * 18, lE: b.lE + Math.sin(fr * 0.95 + 2.2) * 14, headNod: b.headNod + Math.abs(Math.sin(fr * 0.48)) * 4 };
  };
  const SHOT_LIGHTS: SceneLight[] = [{ x: 950, y: 430, color: "#ff8a3c", intensity: 1.2, radius: 1700, flicker: 7 }];
  return (
    <Stage cam={cam} opacity={clamp(f / 10)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.8}>
          <GlowDefs />
          <KaliMandap f={f} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <Dhak x={260} y={830} f={f} s={1.0} tilt={-16} />
          <Puppet cast={CAST.dhaki} f={f} x={520} y={950} scale={1.4} seated acting={dhakiBeat} props={{ stick: P_STICK }} light={{ keySide: 1 }} />
          <Puppet
            cast={CAST.bhagabati}
            f={f}
            x={1300}
            y={920}
            scale={1.5}
            acting={priest}
            mouth={v.mouth}
            talk={v.talk}
            light={{ keySide: -1, rim: "#ff9a3c", rimStrength: 0.6 }}
            props={{ bell: bellProp(ring) }}
          />
        </Layer>
        <Layer depth={1.25}>
          <MandapCrowd f={f} n={10} y={1140} s={1.25} />
        </Layer>
        <Layer depth={1.25} blend="screen">
          <Bokeh f={f} n={14} seed={41} />
        </Layer>
        <Grade warmth={0.38} vignette={0.6} bloomAt={[52, 40]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 2 — andarmahal: seven waves of ulu                            */
/* ================================================================== */

const ShotAndar: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.andar.from;
  const cam = {
    x: track(f, [
      [164, -40],
      [305, 40],
    ]),
    y: track(f, [
      [164, -20],
      [305, 0],
    ]),
    zoom: track(f, [
      [164, 1.08],
      [240, 1.16],
      [305, 1.2],
    ]),
    focus: 1,
    dof: 2.2,
  };
  const uluEnd = ULU_FROM + 7 * ULU_GAP + 10;
  const uluPose = (seed: number, turn: number, side: "r" | "l"): PoseKey<Pose>[] => {
    const hand = side === "r" ? { rS: -14, rE: -170, rHand: "open" as const } : { lS: -14, lE: -170, lHand: "open" as const };
    const rest = side === "r" ? { rS: 6, rE: -20, rHand: "relaxed" as const } : { lS: 6, lE: -20, lHand: "relaxed" as const };
    return [
      { f: 164, bodyTurn: turn, headTurn: turn * 0.6, smile: 0.7, brow: 0.5, ...rest },
      { f: ULU_FROM - 8 + seed, headTilt: -6, headNod: -3, lid: 0.25, ...hand, in: 9, ease: "out" },
      { f: uluEnd + seed, headTilt: 0, headNod: 0, lid: 0, smile: 0.9, brow: 0.7, ...rest, in: 14 },
    ];
  };
  const manorama = A(uluPose(0, 0.25, "r"));
  const wA = A(uluPose(3, -0.3, "l"));
  const wB = A(uluPose(6, 0.4, "r"));
  const sway = (base: (fr: number) => Partial<Pose>, k: number) => (fr: number) => {
    const b = base(fr);
    const on = fr > ULU_FROM && fr < uluEnd ? 1 : 0;
    return { ...b, bodyX: (b.bodyX ?? 0) + noise1(fr * 0.02, k) * 4, headNod: (b.headNod ?? 0) + on * Math.sin(fr * 0.5 + k) * 1.5 };
  };
  const doorGlow = 0.75 + 0.25 * Math.sin(f * 0.05);
  const SHOT_LIGHTS: SceneLight[] = [
    { x: 980, y: 560, color: "#FFF4D6", intensity: 0.85, radius: 900 },
    { x: 1700, y: 820, color: "#ffb04a", intensity: 0.4, radius: 700, flicker: 5 },
  ];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.andar.from) / DIS)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.12}>
          <GlowDefs />
          <g transform="translate(0, -560)">
            <AmavasyaSky f={f} horizonGlow={0} />
          </g>
        </Layer>
        <Layer depth={0.55}>
          <GlowDefs />
          <CourtyardBack f={f} />
          {/* the birth room: a still, white-gold glow in one doorway */}
          <g style={{ mixBlendMode: "screen" }}>
            <ellipse cx={1000} cy={600} rx={150 * doorGlow} ry={200 * doorGlow} fill="#fff4d6" opacity={0.4} />
            <Glow x={1000} y={600} r={110} kind="white" o={0.55} />
          </g>
        </Layer>
        <Layer depth={0.8}>
          <GlowDefs />
          <TulsiMancha x={1760} y={830} f={f} s={1.1} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <CourtyardFloor f={f} />
          <Puppet cast={CAST.womanA} f={f} x={560} y={950} scale={1.4} acting={sway(wA, 1)} mouth={uluMouth(ULU_FROM - 2, uluEnd, 1)} />
          <Puppet cast={CAST.manorama} f={f} x={820} y={980} scale={1.5} acting={sway(manorama, 2)} mouth={uluMouth(ULU_FROM, uluEnd + 2, 2)} />
          <Puppet cast={CAST.womanB} f={f} x={1260} y={960} scale={1.42} acting={sway(wB, 3)} mouth={uluMouth(ULU_FROM + 4, uluEnd + 4, 3)} />
        </Layer>
        <Layer depth={1.05} blend="screen">
          <UluWaves f={f} x={820} y={560} s={1} />
        </Layer>
        <Layer depth={1.3} blend="screen">
          <Bokeh f={f} n={12} seed={44} />
        </Layer>
        <Grade warmth={0.32} vignette={0.6} bloomAt={[52, 52]} />
      </SceneLights.Provider>
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, display: "flex", justifyContent: "center" }}>
        <svg width={260} height={40} viewBox="-130 -20 260 40">
          <WaveCount f={f} x={0} y={0} o={clamp((f - ULU_FROM + 6) / 8) * clamp((300 - f) / 12)} />
        </svg>
      </div>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 3 — the mandap hears it: the bell slows… and falls            */
/* ================================================================== */

const ShotRealise: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.realise.from;
  const cam = {
    x: track(f, [
      [299, 120],
      [380, 220, "inOut"],
      [440, 300],
      [BELL_DROP - 4, 310],
      [BELL_DROP + 12, 260, "inOut"],
      [495, 250],
    ]),
    y: track(f, [
      [299, 50],
      [380, 20],
      [BELL_DROP - 4, 0],
      [BELL_DROP + 12, 150, "inOut"],
      [495, 160],
    ]),
    zoom: track(f, [
      [299, 1.22],
      [380, 1.5, "inOut"],
      [440, 1.72],
      [BELL_DROP - 4, 1.76],
      [BELL_DROP + 12, 1.42, "inOut"],
      [495, 1.46],
    ]),
    focus: 1,
    dof: 2.6,
  };
  // the far waves still arriving from the house (screen-left)
  const priest = A([
    { f: 299, bodyTurn: -0.2, headTurn: -0.2, eyeX: -0.4, lid: 0.35, smile: 0.25, rS: 20, rE: -60, rHand: "pranam", lS: 85, lE: 25, lHand: "hold", lProp: "bell", headNod: 3 },
    { f: 318, lid: 0, headTurn: -0.75, eyeX: -1, brow: 0.6, smile: 0, lS: 70, lE: 20, in: 12, ease: "out" },
    { f: 360, headTurn: -0.85, brow: 0.9, browTilt: 0.4, gasp: 0.3, rS: 15, rE: -40, rHand: "relaxed", in: 14 },
    { f: 400, headTurn: -0.3, eyeX: -0.2, eyeY: 0.4, brow: 0.5, browTilt: 0.8, gasp: 0, headNod: 5, lS: 40, lE: 0, in: 24 },
    { f: BELL_DROP - 6, headNod: 9, lid: 0.45, lS: 28, lE: -10, in: 30 },
    { f: BELL_DROP, lProp: "", lHand: "open", lS: 18, lE: -25, in: 3, ease: "snap" },
    { f: BELL_DROP + 24, headNod: 12, lid: 0.6, brow: 0.3, browTilt: 1, lS: 8, lE: -15, lHand: "relaxed", in: 20 },
  ]);
  const ring = (fr: number) => clamp((330 - fr) / 40);
  // the falling bell: drop, bounce, settle on the platform
  const t = f - BELL_DROP;
  const handX = 1345;
  const handY = 700;
  const groundY = 905;
  const fallY = t < 0 ? 0 : t < 10 ? 0.5 * 5.2 * t * t : Math.min(groundY - handY, 260) - Math.abs(Math.sin(((t - 10) / 8) * Math.PI)) * 22 * Math.exp(-(t - 10) / 8);
  const bellY = Math.min(handY + fallY, groundY);
  const bellRot = t < 0 ? 0 : Math.min(85, t * 7) + Math.sin(t * 0.8) * 10 * Math.exp(-t / 10);
  const SHOT_LIGHTS: SceneLight[] = [{ x: 950, y: 430, color: "#ff8a3c", intensity: 1.1, radius: 1700, flicker: 7 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.realise.from) / DIS)}>
      <SceneLights.Provider value={SHOT_LIGHTS}>
        <Layer depth={0.8}>
          <GlowDefs />
          <KaliMandap f={f} />
        </Layer>
        <Layer depth={0.9} blend="screen">
          <UluWaves f={f - 120} x={-200} y={520} s={0.7} o={0.55} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <Puppet
            cast={CAST.bhagabati}
            f={f}
            x={1300}
            y={920}
            scale={1.5}
            acting={priest}
            light={{ keySide: -1, rim: "#ff9a3c", rimStrength: 0.6 }}
            props={{ bell: bellProp(ring) }}
          />
          {t >= 0 && (
            <g transform={`translate(${handX}, ${bellY}) rotate(${bellRot}) scale(1.5)`}>
              <rect x={-3} y={-6} width={6} height={22} fill="#c9932e" />
              <circle cx={0} cy={-8} r={5} fill="#e6b84c" />
              <path d="M -17 46 Q -15 19 0 17 Q 15 19 17 46 Z" fill="#e6b84c" />
              <circle cx={0} cy={48} r={4} fill="#a87420" />
            </g>
          )}
        </Layer>
        <Layer depth={1.25}>
          {/* the crowd turns toward the house */}
          <g>
            <MandapCrowd f={f < 330 ? f : 330 + (f - 330) * 0.35} n={10} y={1250} s={1.25} />
          </g>
        </Layer>
        <Grade warmth={0.3} vignette={0.66} bloomAt={[48, 40]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 4 — the dhak stops, the bansi stops… everything stands still   */
/* ================================================================== */

const ShotFreeze: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.freeze.from;
  const fw = world(f);
  const freezeK = clamp((f - FREEZE) / 30);
  const cam = {
    x: track(f, [
      [489, -330],
      [530, -320],
      [540, 380, "inOut"],
      [574, 390],
      [584, 40, "inOut"],
      [678, 30],
    ]),
    y: track(f, [
      [489, 80],
      [530, 80],
      [540, 20],
      [574, 20],
      [584, 30],
      [678, 30],
    ]),
    zoom: track(f, [
      [489, 1.75],
      [530, 1.8],
      [540, 1.75],
      [574, 1.8],
      [584, 1.0, "inOut"],
      [678, 1.12],
    ]),
    focus: 1,
    dof: 2.2,
  };
  const dhaki = A([
    { f: 489, bodyTurn: 0.4, headNod: 6, headTilt: 8, lid: 0.7, smile: 0.35, rS: 10, rE: -50, rHand: "hold", rProp: "stick", lS: 12, lE: -45, lHand: "hold", lProp: "stick" },
    { f: DHAK_STOP, lid: 0, smile: 0, brow: 0.8, headNod: -2, headTilt: 0, headTurn: 0.6, eyeX: 1, rS: 55, rE: 70, lS: 20, lE: -20, in: 4, ease: "snap" },
    { f: DHAK_STOP + 30, brow: 0.6, browTilt: 0.6, gasp: 0.25, in: 20 },
  ]);
  const dhakiBeat = (fr: number) => {
    const b = dhaki(fr);
    const k = clamp((DHAK_STOP - fr) / 3);
    return { ...b, rE: b.rE + Math.sin(fr * 0.95) * 18 * k, lE: b.lE + Math.sin(fr * 0.95 + 2.2) * 14 * k, headNod: b.headNod + Math.abs(Math.sin(fr * 0.48)) * 4 * k };
  };
  const bansi = A([
    { f: 489, bodyTurn: -0.2, headTurn: -0.15, headTilt: 8, lid: 0.6, lS: -10, lE: -165, lHand: "hold", lProp: "bansi", rS: 70, rE: 90, rHand: "hold", lean: -2 },
    { f: BANSI_STOP, lid: 0, headTilt: 0, headTurn: -0.7, eyeX: -1, brow: 0.8, lS: -6, lE: -120, rS: 40, rE: 40, rHand: "open", in: 6, ease: "out" },
    { f: BANSI_STOP + 26, lS: 6, lE: -60, rS: 14, rE: -10, rHand: "relaxed", gasp: 0.2, browTilt: 0.5, in: 18 },
  ]);
  const bansiPlay = (fr: number) => {
    const b = bansi(fr);
    const k = clamp((BANSI_STOP - fr) / 3);
    return { ...b, headNod: b.headNod + Math.sin(fr * 0.18) * 3 * k, lean: b.lean + Math.sin(fr * 0.09) * 2 * k };
  };
  const priest = A([{ f: 489, bodyTurn: -0.3, headTurn: -0.5, eyeX: -0.6, headNod: 10, lid: 0.55, brow: 0.3, browTilt: 1, rS: 10, rE: -15, lS: 8, lE: -15, rHand: "relaxed", lHand: "relaxed" }]);
  const SHOT_LIGHTS: SceneLight[] = [{ x: 950, y: 430, color: "#ff8a3c", intensity: 1.1 * (1 - freezeK * 0.4), radius: 1700, flicker: 7 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.freeze.from) / DIS) * clamp((678 - f) / 14)}>
      <div style={{ position: "absolute", inset: 0, filter: `saturate(${1 - freezeK * 0.65}) brightness(${1 - freezeK * 0.12})` }}>
        <SceneLights.Provider value={SHOT_LIGHTS}>
          <Layer depth={0.8}>
            <GlowDefs />
            <KaliMandap f={fw} />
          </Layer>
          <Layer depth={1}>
            <GlowDefs />
            <Dhak x={-80} y={840} f={fw} s={1.0} tilt={-16} />
            <Puppet cast={CAST.dhaki} f={fw} x={180} y={960} scale={1.4} seated acting={dhakiBeat} props={{ stick: P_STICK }} />
            <Puppet cast={CAST.bhagabati} f={fw} x={1080} y={920} scale={1.42} acting={priest} light={{ keySide: -1, rim: "#ff9a3c", rimStrength: 0.6 }} />
            <g transform={`translate(1000, 905) rotate(85) scale(1.4)`}>
              <path d="M -17 46 Q -15 19 0 17 Q 15 19 17 46 Z" fill="#e6b84c" />
              <rect x={-3} y={-6} width={6} height={22} fill="#c9932e" />
            </g>
            <Puppet cast={CAST.listenerA} f={fw} x={1780} y={960} scale={1.45} acting={bansiPlay} props={{ bansi: P_BANSI }} />
          </Layer>
          <Layer depth={1.25}>
            <MandapCrowd f={Math.min(fw, 560)} n={10} y={1150} s={1.25} />
          </Layer>
          <Grade warmth={0.3 - freezeK * 0.2} vignette={0.62 + freezeK * 0.15} bloomAt={[50, 40]} />
        </SceneLights.Provider>
      </div>
    </Stage>
  );
};

/* ================================================================== */

export const Scene04Ulu: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const seq = (k: keyof typeof SHOTS, el: React.ReactNode, last = false) => (
    <Sequence from={SHOTS[k].from} durationInFrames={SHOTS[k].to - SHOTS[k].from + (last ? 0 : DIS)} layout="none">
      {el}
    </Sequence>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
      {seq("priest", <ShotPriest scene={scene} />)}
      {seq("andar", <ShotAndar />)}
      {seq("realise", <ShotRealise />)}
      {seq("freeze", <ShotFreeze />, true)}
    </div>
  );
};

/** Scene 04 sound bed (no voices): festival music cut dead by the freeze; ulu; the bell's fall. */
export const Scene04SoundBed: React.FC = () => {
  const fest = (fr: number) =>
    interpolate(fr, [0, 12, 160, 190, 300, DHAK_STOP, DHAK_STOP + 4, BANSI_STOP, BANSI_STOP + 4], [0, 0.32, 0.32, 0.12, 0.2, 0.2, 0.08, 0.08, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  return (
    <>
      <Audio src={staticFile("audio/music/Festival_Folk_Loop.wav")} loop volume={fest} />
      <Sequence from={ULU_FROM - 6} durationInFrames={150} layout="none">
        <Audio src={staticFile("audio/sfx/uludhwani.wav")} volume={(fr) => interpolate(fr, [0, 6, 120, 150], [0, 0.75, 0.6, 0], { extrapolateRight: "clamp" })} />
      </Sequence>
      <Sequence from={300} durationInFrames={110} layout="none">
        <Audio src={staticFile("audio/sfx/uludhwani.wav")} volume={(fr) => interpolate(fr, [0, 10, 80, 110], [0, 0.22, 0.15, 0], { extrapolateRight: "clamp" })} />
      </Sequence>
      <Sequence from={BELL_DROP + 9} durationInFrames={120} layout="none">
        <Audio src={staticFile("audio/sfx/temple_bell_drop.wav")} volume={0.7} />
      </Sequence>
    </>
  );
};

/** Standalone demo: scene + voices + sound bed + subtitles. */
export const Scene04Demo: React.FC = () => {
  const scene = SCENE04;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene04Ulu scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
        <Scene04SoundBed />
      </DuckProvider>
      <CueSubtitles cues={SCENE04_CUES} />
    </div>
  );
};
