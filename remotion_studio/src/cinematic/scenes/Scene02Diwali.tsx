import React from "react";
import { Sequence, useCurrentFrame } from "remotion";
import { SceneTiming } from "../../types/studio";
import { clamp, makeActing, PoseKey, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { Bokeh, CrackerBundle, Diya, Fireworks, GlowDefs, Sparkler, Sparks } from "../fx/Fx";
import { CAST } from "../rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeChatter, visemeFromEnvelope } from "../rig/lipsync";
import { BASE_POSE, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../rig/Puppet";
import { idleLife } from "../rig/idle";

// background life: each woman has her own rhythm of watching, chatting, laughing
const WA = idleLife(301, { partner: 1, watch: 0.45, chatty: 0.8, base: { bodyTurn: 0.3, rS: 15, rE: -100 } });
const WB = idleLife(302, { partner: -1, watch: 0.35, chatty: 0.6, base: { bodyTurn: -0.15, lS: 15, lE: -95 } });
const WC = idleLife(303, { partner: 1, watch: -0.45, chatty: 0.6, base: { bodyTurn: -0.2, rS: 15, rE: -100 } });
const WD = idleLife(304, { partner: -1, watch: -0.5, chatty: 0.8, base: { bodyTurn: -0.45, lS: 15, lE: -100 } });
import {
  AmavasyaSky,
  FarBank,
  ForegroundPalms,
  LaneBackdrop,
  LaneWall,
  NearVillage,
  PadmaNight,
} from "../sets/Exteriors";
import {
  BaithakWall,
  Bolster,
  Charkhi,
  CourtyardBack,
  CourtyardFloor,
  Dhak,
  Hookah,
  HurricaneLantern,
  KansorMuri,
  MandapNook,
  Takhat,
  TulsiMancha,
  Tubri,
} from "../sets/Interiors";

/**
 * Scene 02 — "Diwali night at Baidik Bari" re-staged as a 6-shot cinematic sequence.
 * Every narrated / spoken beat has an on-screen visual, timed to the measured
 * word boundaries of 02a/02b/02c (see SHOT comments; frames are scene-local).
 */

export const SHOTS = {
  panorama: { from: 0, to: 216 }, // আজ কার্তিক মাসের অমাবস্যা — সারা দেশে দীপাবলি — বৈদিক বাড়িতে কালীপূজো
  lane: { from: 210, to: 458 }, // প্রদীপগুলো নিভু নিভু — কিন্তু বৈদিক বাড়িতে আনন্দের শেষ নেই
  baithak: { from: 452, to: 580 }, // বৈঠকখানায় কেদারকাকার মজার গল্প শুনে সবাই অবাক
  dhaki: { from: 574, to: 773 }, // ঢাকীর ছেলে দুইখা কাঁসরের উল্টো পিঠে গুড়-মুড়ি… বিষম খেয়ে একাকার
  courtyard: { from: 767, to: 924 }, // ভেতর-বাড়িতে বাবুকাকাকে ঘিরে বাজি পোড়ানো আর মিষ্টি খুনসুটি
  quarrel: { from: 918, to: 1267 }, // Gopal / Rama / Babukaka dialogue
};
const DISSOLVE = 8;

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

/* ---------------- voice helpers ---------------- */

const clipOf = (scene: SceneTiming, file: string) => scene.clips.find((c) => c.file === file);

const voice = (scene: SceneTiming, file: string, seed: number, ranges?: Array<[number, number]>) => {
  const clip = clipOf(scene, file);
  const inRange = (rel: number) => !ranges || ranges.some(([a, b]) => rel >= a && rel < b);
  return {
    mouth: (fr: number): MouthState => {
      if (!clip) return MOUTH_REST;
      const rel = fr - clip.offsetFrame;
      return inRange(rel) ? visemeFromEnvelope(clip.rmsEnvelope, rel, seed, clip.subtitleBn) : MOUTH_REST;
    },
    talk: (fr: number) => {
      if (!clip) return 0;
      const rel = fr - clip.offsetFrame;
      return inRange(rel) ? speechLevel(clip.rmsEnvelope, rel) : 0;
    },
  };
};

const chatter = (seed: number, from: number, to: number, k = 1) => (fr: number) =>
  fr >= from && fr < to ? visemeChatter(fr, seed, k) : MOUTH_REST;

/* ---------------- props ---------------- */

const P_SPARKLER: PropRenderer = ({ f, worldRot, scale }) => <Sparkler f={f} worldRot={worldRot} s={scale} />;
const P_SPARKLER_B: PropRenderer = ({ f, worldRot, scale }) => <Sparkler f={f} worldRot={worldRot} s={scale} seed={7} />;
const P_SPARK_BUNDLE: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale})`}>
    {[-6, -2, 2, 6].map((x, i) => (
      <line key={x} x1={x * 0.4} y1={-6} x2={x} y2={58} stroke={i % 2 ? "#6a6662" : "#4e4a47"} strokeWidth={2.4} />
    ))}
    <rect x={-7} y={6} width={14} height={6} rx={2} fill="#d8342c" />
  </g>
);
const P_BUNDLE: PropRenderer = ({ scale }) => <CrackerBundle s={scale * 0.9} />;
const P_STICK: PropRenderer = ({ scale }) => (
  <line x1={0} y1={-6} x2={0} y2={60 * scale} stroke="#8a5a2a" strokeWidth={4 * scale} strokeLinecap="round" />
);
const P_MURI: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale})`}>
    {Array.from({ length: 9 }, (_, i) => (
      <ellipse key={i} cx={((i % 3) - 1) * 6} cy={-4 + Math.floor(i / 3) * 4} rx={4} ry={2.6} fill="#fff4dc" />
    ))}
  </g>
);
const PROPS: Record<string, PropRenderer> = {
  sparkler: P_SPARKLER,
  sparkler2: P_SPARKLER_B,
  sparkBundle: P_SPARK_BUNDLE,
  bundle: P_BUNDLE,
  stick: P_STICK,
  muri: P_MURI,
};

/* ================================================================== */
/* SHOT 1 — Amavasya sky tilts down to a land of lamps, push to Baidik */
/* ================================================================== */

const ShotPanorama: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.panorama.from;
  const wave = track(f, [
    [62, 0.04],
    [146, 1, "inOut"],
  ]);
  const puja = track(f, [
    [150, 0],
    [196, 1],
  ]);
  const cam = {
    x: track(f, [
      [0, -40],
      [80, 0],
      [150, 110],
      [216, 300],
    ]),
    y: track(f, [
      [0, -560],
      [16, -556],
      [86, 0],
      [216, 28],
    ]),
    zoom: track(f, [
      [0, 1.0],
      [86, 1.0],
      [150, 1.16],
      [216, 1.62],
    ]),
    focus: 0.7,
    dof: 3.5,
  };
  const bursts = [
    { f: 86, x: 260, y: 330, r: 55 },
    { f: 98, x: 1560, y: 300, r: 70 },
    { f: 110, x: 820, y: 280, r: 50 },
    { f: 122, x: 1820, y: 360, r: 48 },
    { f: 132, x: 470, y: 250, r: 80, kind: "willow" as const },
    { f: 158, x: 1160, y: 230, r: 90 },
    { f: 174, x: 1420, y: 170, r: 120, kind: "ring" as const },
    { f: 190, x: 1250, y: 120, r: 170 },
  ];
  const flash = bursts.reduce((m, b) => Math.max(m, clamp(1 - (f - b.f) / 10) * (f >= b.f ? 0.12 * ((b.r ?? 100) / 100) : 0)), 0);
  return (
    <Stage cam={cam} opacity={clamp(f / 10)}>
      <Layer depth={0.04}>
        <GlowDefs />
        <AmavasyaSky f={f} horizonGlow={0.4 + wave * 0.8} />
      </Layer>
      <Layer depth={0.14}>
        <GlowDefs />
        <Fireworks f={f} bursts={bursts} scale={0.9} />
      </Layer>
      <Layer depth={0.3}>
        <GlowDefs />
        <FarBank f={f} wave={wave} />
      </Layer>
      <Layer depth={0.45}>
        <GlowDefs />
        <PadmaNight f={f} wave={wave} />
      </Layer>
      <Layer depth={0.7}>
        <GlowDefs />
        <NearVillage f={f} wave={wave} puja={puja} />
      </Layer>
      <Layer depth={1.3}>
        <ForegroundPalms f={f} />
      </Layer>
      <Grade warmth={0.15 + puja * 0.25} vignette={0.62} flash={flash} flashColor="#ffd6f0" bloomAt={[62, 58]} />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 2 — Outside lamps gutter out… pan to the blazing gate          */
/* ================================================================== */

const ShotLane: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.lane.from;
  const joy = track(f, [
    [362, 0],
    [418, 1, "out"],
  ]);
  const cam = {
    x: track(f, [
      [210, -90],
      [360, 90],
      [418, 1490, "inOut"],
      [458, 1530],
    ]),
    y: track(f, [
      [210, 30],
      [360, 40],
      [418, -10],
      [458, -30],
    ]),
    zoom: track(f, [
      [210, 1.32],
      [360, 1.45],
      [418, 1.0],
      [458, 1.07],
    ]),
    focus: 1,
    dof: 2.5,
  };
  const bursts = [
    { f: 424, x: 2420, y: 220, r: 210, fromY: 760 },
    { f: 436, x: 2160, y: 300, r: 140, fromY: 760, kind: "willow" as const },
    { f: 446, x: 2700, y: 180, r: 170, fromY: 760, kind: "ring" as const },
  ];
  const flash = bursts.reduce((m, b) => Math.max(m, f >= b.f ? clamp(1 - (f - b.f) / 12) * 0.22 : 0), 0);
  const dark = track(f, [
    [222, 0],
    [356, 0.5],
    [400, 0.3],
  ]);
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.lane.from) / DISSOLVE)}>
      <Layer depth={0.08}>
        <GlowDefs />
        <AmavasyaSky f={f} dark={dark} horizonGlow={0.3} />
      </Layer>
      <Layer depth={0.4}>
        <LaneBackdrop f={f} />
      </Layer>
      <Layer depth={1}>
        <GlowDefs />
        <LaneWall f={f} joy={joy} />
        <Fireworks f={f} bursts={bursts} />
      </Layer>
      <Layer depth={1.35} blend="screen">
        <Bokeh f={f} n={14} seed={4} area={[1600, 0, 3200, 1080]} size={[14, 40]} />
      </Layer>
      <Grade
        warmth={0.05 + joy * 0.45}
        vignette={0.72 - joy * 0.12}
        flash={flash}
        tint="#1a2050"
        tintAmount={dark * 0.55}
        bloomAt={[50, 62]}
      />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 3 — Baithakkhana: Kedarkaka's tiger tale, everyone gasps       */
/* ================================================================== */

const ShotBaithak: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.baithak.from;
  const GASP = 548;
  const tiger = track(f, [
    [496, 0],
    [532, 1, "out"],
  ]);
  const jaw = track(f, [
    [528, 0],
    [542, 1, "backOut"],
    [578, 0.7],
  ]);
  const cam = {
    x: track(f, [
      [452, -50],
      [580, 30],
    ]),
    y: track(f, [
      [452, 10],
      [580, -10],
    ]),
    zoom: track(f, [
      [452, 1.0],
      [544, 1.08],
      [552, 1.16, "snap"],
      [580, 1.19],
    ]),
    focus: 1,
    dof: 2.2,
    shake: track(f, [
      [546, 0],
      [549, 4],
      [566, 0],
    ]),
  };
  const kedar = A([
    { f: 452, bodyTurn: 0.35, lean: 4, headTurn: 0.25, eyeX: 0.6, smile: 0.6, rS: 35, rE: -70, rHand: "open", lS: 20, lE: -50, lHand: "open" },
    { f: 470, rS: 70, rE: -90, headTilt: -5, brow: 0.5 },
    { f: 488, rS: 30, rE: -50, lS: 65, lE: -80, headTilt: 3, brow: 0.2 },
    { f: 508, rS: 135, rE: 35, lS: 135, lE: 35, lean: -7, brow: 1, smile: 0.2, headTurn: 0.2, in: 14 },
    { f: 532, rS: 100, rE: 25, lS: 100, lE: 25, lean: 11, brow: -0.7, browTilt: -0.6, gasp: 0.9, smile: 0, ease: "backOut", in: 6 },
    { f: 552, rS: 100, rE: 25, lS: 100, lE: 25 },
    { f: 566, rS: 30, rE: -75, lS: 25, lE: -55, lean: 0, brow: 0.4, browTilt: 0, gasp: 0, smile: 1, lid: 0.35, headTilt: 6 },
  ]);
  const listenerA = A([
    { f: 452, bodyTurn: -0.4, lean: -4, headTurn: -0.3, eyeX: -0.8, smile: 0.35, rS: -8, rE: -30, lS: 6, lE: -20 },
    { f: 520, lean: -9, smile: 0.1, brow: 0.3 },
    { f: GASP, lean: -8, gasp: 1, brow: 1, browTilt: 0.4, smile: 0, rS: 65, rE: 85, rHand: "open", lS: 65, lE: 85, lHand: "open", ease: "snap", in: 5 },
  ]);
  const listenerB = A([
    { f: 452, bodyTurn: -0.45, headTurn: -0.35, eyeX: -0.9, smile: 0.5, rS: 5, rE: -30, lS: 5, lE: -30 },
    { f: GASP + 2, gasp: 0.8, brow: 1, smile: 0, rS: 20, rE: -158, rHand: "open", lean: 6, ease: "snap" },
  ]);
  const kid = A([
    { f: 452, bodyTurn: -0.2, headTurn: -0.35, eyeX: -0.9, eyeY: -0.3, smile: 0.6, rS: 5, rE: -10, lS: 5, lE: -10 },
    { f: 520, lean: -3, brow: 0.4 },
    { f: GASP - 1, gasp: 1, brow: 1, bodyY: -14, rS: 8, rE: -168, rHand: "open", lS: 8, lE: -168, lHand: "open", smile: 0, ease: "snap" },
    { f: GASP + 8, bodyY: 0 },
  ]);
  const windowFlash = Math.max(clamp(1 - Math.abs(f - 470) / 8), clamp(1 - Math.abs(f - 515) / 8));
  const light = { keySide: -1 as const, rim: "#ffd9a0", rimStrength: 0.35 };
  const SHOT_LIGHTS: SceneLight[] = [{ x: 260, y: 240, color: "#ffcf87", intensity: 1.1, radius: 1800, flicker: 5 }, { x: 330, y: 660, color: "#ff9a3c", intensity: 0.35, radius: 520, flicker: 9 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.baithak.from) / DISSOLVE)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <Layer depth={0.85}>
        <GlowDefs />
        <BaithakWall f={f} tiger={tiger} jaw={jaw} flash={windowFlash} />
      </Layer>
      <Layer depth={1}>
        <GlowDefs />
        <Bolster x={420} y={790} s={0.9} />
        <Takhat />
        <Hookah x={330} y={830} f={f} s={1.05} />
        <Puppet cast={CAST.kedarkaka} f={f} x={640} y={842} scale={1.6} seated acting={kedar} mouth={(fr) => (fr >= 532 && fr < 556 ? MOUTH_REST : visemeChatter(fr, 5, 1.1))} light={light} />
        <Puppet cast={CAST.listenerA} f={f} x={1260} y={842} scale={1.45} seated acting={listenerA} light={light} />
        <Puppet cast={CAST.listenerB} f={f} x={1580} y={842} scale={1.4} seated acting={listenerB} light={light} />
        <Puppet cast={CAST.listenerKid} f={f} x={1010} y={1010} scale={1.45} acting={kid} light={{ ...light, brightness: 0.92 }} />
      </Layer>
      <Layer depth={1.28}>
        <GlowDefs />
        <HurricaneLantern x={250} y={160} f={f} s={1.2} />
      </Layer>
      <Grade warmth={0.4} vignette={0.66} bloomAt={[22, 25]} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 4 — Dhaki's son Duikha: gur-muri on an upturned kansor… chokes */
/* ================================================================== */

const ShotDhaki: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.dhaki.from;
  const CHOKE = 734;
  const coughs = [742, 752, 762];
  const coughK = coughs.reduce((m, c) => Math.max(m, f >= c ? clamp(1 - (f - c) / 7) : 0), 0);
  const cam = {
    x: track(f, [
      [574, -170],
      [620, -150],
      [664, 170, "inOut"],
      [698, 250],
      [734, 268],
      [773, 120],
    ]),
    y: track(f, [
      [574, 0],
      [664, 40],
      [698, 125],
      [734, 130],
      [773, 70],
    ]),
    zoom: track(f, [
      [574, 1.05],
      [620, 1.08],
      [664, 1.18],
      [698, 1.48],
      [734, 1.56],
      [773, 1.28],
    ]),
    focus: 1,
    dof: 2.4,
    shake: coughK * 6,
  };
  const dhaki = A([
    { f: 574, bodyTurn: 0.3, headNod: 7, headTilt: 9, lid: 0.85, smile: 0.25, rS: 8, rE: -50, rHand: "hold", rProp: "stick", lS: 10, lE: -45, lHand: "hold", lProp: "stick", lean: -3 },
    { f: 700, headNod: 9, headTilt: 12 },
    { f: CHOKE + 6, headNod: 0, headTilt: 0, lid: 0, brow: 1, gasp: 0.4, smile: 0, headTurn: 0.65, eyeX: 0.9, lean: 6, ease: "snap", in: 5 },
    { f: 750, rS: 82, rE: -10, rHand: "open", rProp: "", gasp: 0, brow: 0.6, browTilt: 0.7, lean: 12 },
  ]);
  const dhakiPat = (fr: number) => {
    const base = dhaki(fr);
    return fr > 750 ? { ...base, rE: base.rE + Math.sin(fr * 0.9) * 16 } : base;
  };
  const duikhaBase = A([
    { f: 574, bodyTurn: -0.2, smile: 0.75, eyeY: 0.85, eyeX: 0.1, headNod: 4, rS: -18, rE: -35, rHand: "relaxed", lS: -12, lE: -30 },
    { f: 640, headTurn: 0.1, rS: -10, rE: -55 },
    { f: 668, rS: 10, rE: -40, rHand: "fist", rProp: "muri" },
    { f: 690, rS: 28, rE: -150, lid: 0.6, smile: 1, eyeY: 0.2, ease: "backOut", in: 14 },
    { f: 700, cheeks: 1, rProp: "", rS: 12, rE: -40, rHand: "relaxed", lid: 0.4 },
    { f: 726, cheeks: 1, lid: 0.1, eyeY: 0 },
    { f: CHOKE, cheeks: 0, gasp: 1, brow: 1, browTilt: 1, flush: 0.85, lid: 0, smile: -0.6, lS: 35, lE: -150, lHand: "open", ease: "snap" },
    { f: 760, tears: 0.9, gasp: 0.4, lid: 0.5 },
  ]);
  const duikha = (fr: number) => {
    const b = duikhaBase(fr);
    const cough = coughs.reduce((m, c) => Math.max(m, fr >= c ? clamp(1 - (fr - c) / 6) : 0), 0);
    const chew = fr > 700 && fr < CHOKE ? Math.sin(fr * 0.7) * 3 : 0;
    return { ...b, headNod: (b.headNod ?? 0) + chew - cough * 10, lean: cough * 9, gasp: Math.max(b.gasp ?? 0, cough) };
  };
  const munch = (fr: number): MouthState => {
    if (fr > 620 && fr < 668) return visemeChatter(fr, 9, 0.7);
    if (fr > 704 && fr < CHOKE) return { open: 0, width: 0.6, round: 0.4, teeth: 0 };
    return MOUTH_REST;
  };
  const eaten = track(f, [
    [622, 0],
    [700, 0.55],
  ]);
  const spill = track(f, [
    [740, 0],
    [770, 1, "out"],
  ]);
  const light = { keySide: 1 as const, rim: "#ffb070", rimStrength: 0.5 };
  // mouth position of Duikha in stage coords (seated child, scale 1.95 at 1080,930)
  const mouthX = 1080 + 4;
  const mouthY = 930 - 64 * 1.95;
  const SHOT_LIGHTS: SceneLight[] = [{ x: 1310, y: 470, color: "#ffc46b", intensity: 1.0, radius: 1400, flicker: 20 }, { x: 1700, y: 1040, color: "#ff9a3c", intensity: 0.6, radius: 900, flicker: 3 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.dhaki.from) / DISSOLVE)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <Layer depth={0.75}>
        <GlowDefs />
        <MandapNook f={f} />
      </Layer>
      <Layer depth={1}>
        <GlowDefs />
        <Dhak x={150} y={690} f={f} s={1.05} tilt={-14} />
        <Dhak x={360} y={760} f={f} s={1.15} tilt={-22} />
        <Puppet cast={CAST.dhaki} f={f} x={700} y={905} scale={1.55} seated acting={dhakiPat} light={light} props={PROPS} />
        <Puppet cast={CAST.duikha} f={f} x={1080} y={930} scale={1.95} seated acting={duikha} mouth={munch} light={light} props={PROPS} />
        <KansorMuri x={1080} y={935} s={1.05} eaten={eaten} spill={spill} />
        {/* the choke: muri sprays out on each cough */}
        {coughs.map((c, i) => (
          <g key={c} transform={`translate(${mouthX}, ${mouthY})`}>
            <Sparks
              f={f}
              start={c}
              end={c + 3}
              seed={30 + i}
              cfg={{ rate: 16, life: 28, speed: [7, 15], angle: [-0.45, Math.PI + 0.45], gravity: 0.7, drag: 0.9, colors: ["#fff8e6", "#f6ead0", "#ecd8ae"], width: 5, streak: 0.6 }}
            />
          </g>
        ))}
      </Layer>
      <Layer depth={1.3}>
        <GlowDefs />
        <Diya x={1700} y={1060} s={3.2} f={f} seed={3} />
      </Layer>
      <Layer depth={1.3} blend="screen">
        <Bokeh f={f} n={10} seed={8} size={[18, 46]} />
      </Layer>
      <Grade warmth={0.35} vignette={0.6} tint="#ff4030" tintAmount={0} bloomAt={[60, 55]} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 5 — Inner courtyard: fireworks around Babukaka, sweet teasing  */
/* ================================================================== */

const CourtyardSky: React.FC<{ f: number; bursts: Parameters<typeof Fireworks>[0]["bursts"] }> = ({ f, bursts }) => (
  <>
    <GlowDefs />
    <g transform="translate(0, -560)">
      <AmavasyaSky f={f} horizonGlow={0} />
    </g>
    <Fireworks f={f} bursts={bursts} />
  </>
);

const ShotCourtyard: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.courtyard.from;
  const SNATCH = 886;
  const cam = {
    x: track(f, [
      [767, -10],
      [924, 50],
    ]),
    y: track(f, [
      [767, -330],
      [842, 0, "inOut"],
      [924, 14],
    ]),
    zoom: track(f, [
      [767, 1.0],
      [842, 1.02],
      [924, 1.14],
    ]),
    focus: 1,
    dof: 2.2,
  };
  const bursts = [
    { f: 790, x: 600, y: -40, r: 150 },
    { f: 812, x: 1400, y: -80, r: 170, kind: "willow" as const },
    { f: 846, x: 960, y: -20, r: 140, kind: "ring" as const },
    { f: 880, x: 1700, y: 0, r: 130 },
  ];
  const babu = A([
    { f: 767, bodyTurn: 0.15, smile: 0.9, headTurn: 0.2, rS: 120, rE: 40, rHand: "hold", rProp: "sparkler", lS: 12, lE: -30, eyeX: 0.4, eyeY: -0.4 },
    { f: 812, headTurn: -0.35, eyeX: -0.7, eyeY: 0.2, lS: 40, lE: -60, lHand: "open" },
    { f: 860, headTurn: 0.45, eyeX: 0.8, lid: 0.3, smile: 1 },
    { f: SNATCH + 4, brow: 0.6, lid: 0 },
  ]);
  const gopal = A([
    { f: 767, bodyTurn: 0.3, smile: 1, headTurn: 0.2, rS: 130, rE: 30, rHand: "hold", rProp: "sparkler2", lS: 10, lE: -20, eyeY: -0.6 },
    { f: 830, headTurn: -0.2, lS: 30, lE: -40, lid: 0.3 },
    { f: 870, headTurn: 0.5, eyeX: 0.8, lid: 0, brow: 0.5 },
    { f: SNATCH + 6, brow: -0.2, smile: 0.2, browTilt: -0.3 },
  ]);
  const madhu = A([
    { f: 767, bodyTurn: -0.15, smile: 1, headTurn: -0.2, lS: 35, lE: -70, lHand: "hold", lProp: "bundle", rS: 20, rE: -40, eyeY: -0.5, lid: 0.25 },
    { f: SNATCH - 6, lS: 40, lE: -40 },
    { f: SNATCH, lProp: "", lHand: "open", lS: 70, lE: -20, smile: -0.7, browTilt: 1, brow: 0.4, headTurn: 0.6, eyeX: 0.9, lid: 0, ease: "snap" },
    { f: 912, tears: 0.6, lS: 15, lE: -150 },
  ]);
  const rama = A([
    { f: 767, bodyTurn: -0.35, smile: 1, headTurn: -0.2, lS: 15, lE: -20, rS: 15, rE: -20, eyeY: -0.6, lid: 0.3 },
    { f: 852, headTurn: -0.6, eyeX: -0.9, lid: 0, smile: 0.8, brow: 0.6 },
    { f: SNATCH - 8, lean: -10, lS: 85, lE: -10, lHand: "open" },
    { f: SNATCH, lHand: "hold", lProp: "bundle", ease: "snap" },
    { f: SNATCH + 12, lean: 2, lS: 0, lE: -120, smile: 0.9, lid: 0.4, headTurn: -0.2 },
  ]);
  const light = { keySide: 1 as const, rim: "#ffe6a8", rimStrength: 0.5 };
  const laugh = (seed: number) => chatter(seed, 767, 924, 0.6);
  const SHOT_LIGHTS: SceneLight[] = [...[-160, 80, 330, 1590, 1830, 2080].map((dx, i) => ({ x: dx, y: 790 + (i % 2) * 14, color: "#ffb04a", intensity: 0.45, radius: 650, flicker: 70 + i })), { x: 1690, y: 900, color: "#fff2c0", intensity: f >= 806 ? 1.0 : 0, radius: 950, flicker: 2 }, { x: 300, y: 980, color: "#ffe08a", intensity: f >= 790 ? 0.8 : 0, radius: 800, flicker: 6 }, { x: 980, y: 440, color: "#fff4c8", intensity: 0.9, radius: 750, flicker: 4 }, { x: 700, y: 650, color: "#fff4c8", intensity: 0.8, radius: 650, flicker: 8 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.courtyard.from) / DISSOLVE)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <Layer depth={0.12}>
        <CourtyardSky f={f} bursts={bursts} />
      </Layer>
      <Layer depth={0.55}>
        <GlowDefs />
        <CourtyardBack f={f} />
        <Puppet cast={CAST.womanA} f={f} x={420} y={760} scale={0.95} acting={WA.acting} mouth={WA.mouth} light={light} />
        <Puppet cast={CAST.womanB} f={f} x={560} y={760} scale={0.92} acting={WB.acting} mouth={WB.mouth} light={light} />
      </Layer>
      <Layer depth={0.8}>
        <GlowDefs />
        <TulsiMancha x={1760} y={830} f={f} s={1.1} />
      </Layer>
      <Layer depth={1}>
        <GlowDefs />
        <CourtyardFloor f={f} />
        <Charkhi x={300} y={1020} f={f} start={790} s={1.2} />
        <Tubri x={1690} y={1010} f={f} start={806} s={1.3} />
        <Puppet cast={CAST.gopal} f={f} x={640} y={1010} scale={1.5} acting={gopal} mouth={laugh(11)} light={light} props={PROPS} />
        <Puppet cast={CAST.babukaka} f={f} x={900} y={1000} scale={1.42} acting={babu} mouth={laugh(4)} light={light} props={PROPS} />
        <Puppet cast={CAST.madhu} f={f} x={1150} y={1015} scale={1.5} acting={madhu} light={light} props={PROPS} />
        <Puppet cast={CAST.rama} f={f} x={1390} y={1012} scale={1.5} acting={rama} mouth={laugh(17)} light={light} props={PROPS} />
      </Layer>
      <Layer depth={1.35}>
        <GlowDefs />
        <Diya x={140} y={1110} s={3.4} f={f} seed={5} />
      </Layer>
      <Layer depth={1.35} blend="screen">
        <Bokeh f={f} n={16} seed={12} size={[16, 44]} />
      </Layer>
      <Grade warmth={0.4} vignette={0.58} bloomAt={[50, 70]} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 6 — The quarrel and Babukaka's peace-making                    */
/* ================================================================== */

const ShotQuarrel: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.quarrel.from;
  // measured from 02b (offset 928): Gopal 0–80, Rama 80–122, Gopal 122–158
  const gopalV = voice(scene, "02b_Scene2_Kids.wav", 11, [
    [0, 80],
    [122, 158],
  ]);
  const ramaV = voice(scene, "02b_Scene2_Kids.wav", 17, [[80, 122]]);
  const babuV = voice(scene, "02c_Scene2_Babukaka.wav", 4);
  const LIT = 1222;

  // Coverage: establishing two-shot → hard cuts between close-ups (shot / reverse-shot),
  // Babukaka's medium close-up as he steps in, then the wide for the sharing and the fireworks.
  // Two keys one frame apart make a clean cut.
  const cam = {
    x: track(f, [
      [918, 70],
      [958, 75],
      [959, -170], // CU Gopal: "এই রমা, তুই মধুর বাজি নিচ্ছিস কেন রে?"
      [1010, -160],
      [1011, 310], // reverse CU Rama: "কোথায় নিচ্ছি!"
      [1052, 300],
      [1053, 60], // tight two-shot: "মিথ্যে বলিস না!"
      [1094, 50],
      [1095, -400], // MCU Babukaka steps in: "আরে, ঝগড়া কোরো না।"
      [1156, -390],
      [1157, -110], // wide: the sharing
      [1196, -60],
      [1216, -60],
      [1267, -20],
    ]),
    y: track(f, [
      [918, 60],
      [958, 62],
      [959, 150],
      [1052, 150],
      [1053, 110],
      [1094, 110],
      [1095, 20],
      [1156, 25],
      [1157, 30],
      [1216, 40],
      [1267, -90],
    ]),
    zoom: track(f, [
      [918, 1.46],
      [958, 1.52],
      [959, 2.3],
      [1010, 2.42],
      [1011, 2.3],
      [1052, 2.4],
      [1053, 1.85],
      [1094, 1.92],
      [1095, 2.0],
      [1156, 2.1],
      [1157, 1.2],
      [1196, 1.3],
      [1216, 1.3],
      [1267, 1.1],
    ]),
    focus: 1,
    dof: 2.8,
  };
  const bursts = [
    { f: 1228, x: 820, y: -60, r: 190 },
    { f: 1236, x: 1300, y: -120, r: 210, kind: "willow" as const },
    { f: 1246, x: 520, y: -140, r: 170, kind: "ring" as const },
    { f: 1254, x: 1560, y: -20, r: 160 },
  ];

  const gopal = A([
    { f: 918, headTurn: 0.55, bodyTurn: 0.4, eyeX: 0.8, smile: 0, brow: -0.2, rS: 15, rE: -15, lS: 8, lE: -15 },
    { f: 930, rS: 78, rE: 0, rHand: "point", brow: -0.6, browTilt: -0.45, smile: -0.35, lean: 4, ease: "backOut" },
    { f: 1000, rS: 18, rE: -15, rHand: "relaxed", lean: 0, brow: -0.3 },
    { f: 1058, rS: 55, rE: -105, rHand: "fist", lS: 55, lE: -105, lHand: "fist", lean: 7, brow: -0.85, browTilt: -0.6, smile: -0.5, ease: "backOut" },
    { f: 1086, rS: 12, rE: -15, rHand: "relaxed", lS: 10, lE: -15, lHand: "relaxed", lean: 0, headTurn: -0.55, bodyTurn: -0.2, eyeX: -0.9, brow: 0.5, browTilt: 0, smile: 0 },
    { f: 1130, brow: 0.2, smile: -0.1, headNod: 3 },
    { f: 1168, brow: 0.8, smile: 1, headNod: 0 },
    { f: 1192, rS: 55, rE: -60, rHand: "hold", rProp: "sparkBundle" },
    { f: LIT, rS: 120, rE: 40, rProp: "sparkler", lid: 0.35, headTurn: 0.1, eyeX: 0, eyeY: -0.6 },
  ]);
  const gopalLive = (fr: number) => {
    const b = gopal(fr);
    const jump = fr > LIT ? -Math.abs(Math.sin(fr * 0.32)) * 9 : 0;
    return { ...b, bodyY: jump };
  };
  const rama = A([
    { f: 918, headTurn: -0.5, bodyTurn: -0.4, eyeX: -0.7, smile: 0.5, lS: -12, lE: -125, lHand: "hold", lProp: "bundle", rS: 10, rE: -20 },
    { f: 1004, lBack: 1, lS: -22, lE: -8, brow: 0.75, smile: 0.4, rS: 45, rE: -70, rHand: "open", ease: "snap" },
    { f: 1050, lean: -5, eyeX: 0.4, smile: 0.1, rS: 12, rE: -20, rHand: "relaxed", brow: 0.3, browTilt: 0.4 },
    { f: 1088, headTurn: -0.8, eyeX: -0.9, lean: 0 },
    { f: 1150, headNod: 6, smile: -0.1, brow: 0.3, browTilt: 0.7 },
    { f: 1176, lBack: 0, lS: 60, lE: -30, headNod: 0, smile: 0.6, browTilt: 0, headTurn: -0.7 },
    { f: 1200, lProp: "", lHand: "open" },
    { f: 1206, lS: 55, lE: -55, lHand: "hold", lProp: "sparkBundle", smile: 1 },
    { f: LIT + 2, lS: 120, lE: 40, lProp: "sparkler2", lid: 0.35, headTurn: -0.1, eyeX: 0, eyeY: -0.6 },
  ]);
  const ramaLive = (fr: number) => {
    const b = rama(fr);
    const shake = fr > 1008 && fr < 1042 ? Math.sin(fr * 0.75) * 0.32 : 0;
    const jump = fr > LIT ? -Math.abs(Math.sin(fr * 0.3 + 1)) * 8 : 0;
    return { ...b, headTurn: b.headTurn + shake, bodyY: jump };
  };
  const madhu = A([
    { f: 918, bodyTurn: 0.15, smile: -0.7, browTilt: 1, brow: 0.3, tears: 0.6, headTurn: 0.4, eyeX: 0.8, lS: 14, lE: -152, lHand: "relaxed", rS: 10, rE: -20 },
    { f: 1000, lS: 10, lE: -25 },
    { f: 1060, lS: 14, lE: -152 },
    { f: 1088, lS: 10, lE: -25, headTurn: -0.4, eyeX: -0.8 },
    { f: 1176, rS: 55, rE: -25, rHand: "open", headTurn: 0.5, eyeX: 0.8, brow: 0.6 },
    { f: 1200, rHand: "hold", rProp: "bundle", rS: 15, rE: -110, smile: 1, tears: 0, browTilt: 0, lid: 0.25, ease: "backOut" },
    { f: LIT + 4, lS: 110, lE: 45, lHand: "hold", lProp: "sparkler", eyeY: -0.6, headTurn: 0 },
  ]);
  const babuWalk = A([
    { f: 918, bodyTurn: 0.6, bodyX: -420, stride: 1, headTurn: 0.1, eyeX: 0.8, smile: 0.4, rS: 10, rE: -10, lS: 10, lE: -10 },
    { f: 1072, bodyX: -420, stride: 1 },
    { f: 1100, bodyX: 0, stride: 0.2, ease: "out", in: 28 },
    { f: 1106, bodyTurn: 0.35, stride: 0, rS: 60, rE: 90, rHand: "open", lS: 60, lE: 90, lHand: "open", brow: 0.6, smile: 0.35, ease: "backOut", in: 8 },
    { f: 1130, rS: 30, rE: 135, rHand: "point", lS: 10, lE: -15, lHand: "relaxed", brow: 0.2, browTilt: 0.35, smile: 0.5 },
    { f: 1158, rS: 12, rE: -10, rHand: "relaxed" },
    { f: 1168, crouch: 0.55, rS: 72, rE: -18, rHand: "hold", rProp: "sparkBundle", lS: -35, lE: -70, lHand: "hold", lProp: "sparkBundle", headTurn: 0.4, smile: 0.9, brow: 0.4, browTilt: 0, headNod: 4 },
    { f: 1192, rProp: "", rHand: "open" },
    { f: 1206, lProp: "", lHand: "open" },
    { f: 1220, crouch: 0, rS: 115, rE: 30, lS: 115, lE: 30, smile: 1, lid: 0.3, headTilt: 4, headNod: 0, ease: "backOut" },
    { f: 1240, rS: 120, rE: 40, rHand: "hold", rProp: "sparkler" },
  ]);
  const babuLive = (fr: number) => {
    const b = babuWalk(fr);
    const wag = fr > 1128 && fr < 1156 ? Math.sin(fr * 0.7) * 14 : 0;
    const shake = fr > 1128 && fr < 1156 ? Math.sin(fr * 0.45) * 0.12 : 0;
    return { ...b, rE: b.rE + wag, headTurn: b.headTurn + shake };
  };
  const light = { keySide: 1 as const, rim: "#ffe6a8", rimStrength: 0.5 };
  const sparkle = clamp((f - LIT) / 10);
  const SHOT_LIGHTS: SceneLight[] = [...[-160, 80, 330, 1590, 1830, 2080].map((dx, i) => ({ x: dx, y: 790 + (i % 2) * 14, color: "#ffb04a", intensity: 0.45, radius: 650, flicker: 70 + i })), ...(f >= LIT ? [{ x: 850, y: 600, color: "#fff4c8", intensity: clamp((f - LIT) / 8), radius: 700, flicker: 4 }, { x: 1210, y: 600, color: "#fff4c8", intensity: clamp((f - LIT) / 8), radius: 700, flicker: 7 }, { x: 990, y: 720, color: "#fff4c8", intensity: clamp((f - LIT) / 8) * 0.8, radius: 600, flicker: 11 }] : [])];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.quarrel.from) / DISSOLVE) * clamp((1267 - f) / 12)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <Layer depth={0.12}>
        <CourtyardSky f={f} bursts={bursts} />
      </Layer>
      <Layer depth={0.55}>
        <GlowDefs />
        <CourtyardBack f={f} />
        <Puppet cast={CAST.womanA} f={f} x={1500} y={760} scale={0.95} acting={WC.acting} mouth={WC.mouth} light={light} />
        <Puppet cast={CAST.womanB} f={f} x={1640} y={760} scale={0.92} acting={WD.acting} mouth={WD.mouth} light={light} />
      </Layer>
      <Layer depth={0.8}>
        <GlowDefs />
        <TulsiMancha x={1880} y={830} f={f} s={1.1} />
      </Layer>
      <Layer depth={1}>
        <GlowDefs />
        <CourtyardFloor f={f} />
        <Puppet cast={CAST.madhu} f={f} x={1030} y={990} scale={1.42} acting={madhu} light={light} props={PROPS} />
        <Puppet cast={CAST.gopal} f={f} x={790} y={1010} scale={1.55} acting={gopalLive} mouth={gopalV.mouth} talk={gopalV.talk} light={light} props={PROPS} />
        <Puppet cast={CAST.rama} f={f} x={1270} y={1012} scale={1.55} acting={ramaLive} mouth={ramaV.mouth} talk={ramaV.talk} light={light} props={PROPS} />
        <Puppet cast={CAST.babukaka} f={f} x={560} y={1000} scale={1.45} acting={babuLive} mouth={babuV.mouth} talk={babuV.talk} light={light} props={PROPS} />
      </Layer>
      <Layer depth={1.35}>
        <GlowDefs />
        <Diya x={1820} y={1100} s={3.2} f={f} seed={6} />
      </Layer>
      <Layer depth={1.35} blend="screen">
        <Bokeh f={f} n={16} seed={21} size={[16, 46]} />
      </Layer>
      <Grade warmth={0.35 + sparkle * 0.2} vignette={0.6} bloomAt={[48, 62]} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */

export const Scene02Diwali: React.FC<{ scene: SceneTiming }> = ({ scene }) => (
  <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
    <Sequence from={SHOTS.panorama.from} durationInFrames={SHOTS.panorama.to - SHOTS.panorama.from + DISSOLVE} layout="none">
      <ShotPanorama />
    </Sequence>
    <Sequence from={SHOTS.lane.from} durationInFrames={SHOTS.lane.to - SHOTS.lane.from + DISSOLVE} layout="none">
      <ShotLane />
    </Sequence>
    <Sequence from={SHOTS.baithak.from} durationInFrames={SHOTS.baithak.to - SHOTS.baithak.from + DISSOLVE} layout="none">
      <ShotBaithak />
    </Sequence>
    <Sequence from={SHOTS.dhaki.from} durationInFrames={SHOTS.dhaki.to - SHOTS.dhaki.from + DISSOLVE} layout="none">
      <ShotDhaki />
    </Sequence>
    <Sequence from={SHOTS.courtyard.from} durationInFrames={SHOTS.courtyard.to - SHOTS.courtyard.from + DISSOLVE} layout="none">
      <ShotCourtyard />
    </Sequence>
    <Sequence from={SHOTS.quarrel.from} durationInFrames={SHOTS.quarrel.to - SHOTS.quarrel.from} layout="none">
      <ShotQuarrel scene={scene} />
    </Sequence>
  </div>
);
