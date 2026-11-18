import React from "react";
import { interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio, DuckProvider } from "../audio/Mix";
import { EPISODE_01_SCENES } from "../../data/episode01Data";
import { SceneTiming } from "../../types/studio";
import { clamp, lerp, makeActing, PoseKey, track } from "../core/anim";
import { Grade, Layer, Stage } from "../core/Stage";
import { BabyThakur, DivineAura, DivineDefs, LotusOfLight, SacredLight, timeWarp } from "../divine/Divine";
import { Bokeh, GlowDefs } from "../fx/Fx";
import { CAST } from "../rig/cast";
import { MOUTH_REST, MouthState, speechLevel, visemeFromEnvelope } from "../rig/lipsync";
import { BASE_POSE, Pose, PropRenderer, Puppet, SceneLight, SceneLights } from "../rig/Puppet";
import { CueSubtitles } from "../Scene02Demo";
import { AmavasyaSky } from "../sets/Exteriors";
import { CourtyardBack, CourtyardFloor, TulsiMancha } from "../sets/Interiors";
import { KaliMandap, MandapCrowd } from "../sets/Sacred";

/**
 * Episode 1 · Scene 03 — "The Quiet Arrival".
 * First full use of the divine visual language (01_Series_Bible/divine_visual_language.md):
 * Level 3 theophany for the birth, then the newborn's steady Level 1.
 * The birth is shown only symbolically: light, a lotus, the child appearing serene on white cloth.
 */

export const SCENE03 = EPISODE_01_SCENES.find((s) => s.sceneId === "03_quiet_arrival")!;

const SHOTS = {
  mandap: { from: 0, to: 182 }, // চিনি কোথায়? … সবাই তখন মণ্ডপের কাছে
  charu: { from: 176, to: 398 }, // চারু নিজেই চিনির ডালা হাতে উঠোনে নামলেন
  miracle: { from: 392, to: 690 }, // ঠিক সেই মুহূর্তেই… প্রসবব্যথা ছাড়াই… জন্ম নিল
  closeup: { from: 684, to: 762 }, // এক শান্ত, জ্যোতির্ময় শিশুপুত্র
  manorama: { from: 756, to: 912 }, // মনোরমা দেবী… কোলে তুলে নিলেন
  closing: { from: 906, to: 1006 }, // দিদি… পূজো কি আরম্ভ হয়ে গেছে?
};
const DIS = 8;

// Level-3 window: world slows from "ঠিক সেই মুহূর্তেই" until Manorama arrives
const WARP_FROM = 400;
const WARP_TO = 790;
const BIRTH = 668;

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

export const SCENE03_CUES = [
  { from: 0, to: 56, who: "ভগবতী ঠাকুর", text: "চিনি কোথায়? তাড়াতাড়ি পাঠাও—" },
  { from: 56, to: 110, who: "ভগবতী ঠাকুর", text: "পূজোর সময় বয়ে যাচ্ছে!" },
  { from: 118, to: 178, who: "কথক", text: "সবাই তখন মণ্ডপের কাছে।" },
  { from: 190, to: 250, who: "কথক", text: "পূজোর দেরি হয়ে যাচ্ছে দেখে," },
  { from: 252, to: 380, who: "কথক", text: "বাবুর স্ত্রী চারু নিজেই চিনির ডালা হাতে উঠোনে নামলেন।" },
  { from: 395, to: 522, who: "কথক", text: "আর ঠিক সেই মুহূর্তেই ঘটল এক আশ্চর্য ঘটনা!" },
  { from: 534, to: 605, who: "কথক", text: "কোনো রকম প্রসবব্যথা ছাড়াই," },
  { from: 607, to: 685, who: "কথক", text: "এক মুহূর্তে জন্ম নিল" },
  { from: 689, to: 740, who: "কথক", text: "এক শান্ত, জ্যোতির্ময় শিশুপুত্র!" },
  { from: 758, to: 802, who: "কথক", text: "জ্যাঠাইমা মনোরমা দেবী" },
  { from: 806, to: 906, who: "কথক", text: "তাড়াতাড়ি পূজোর কাজ ফেলে এসে শিশুকে কোলে তুলে নিলেন।" },
  { from: 918, to: 1000, who: "চারু", text: "দিদি… পূজো কি আরম্ভ হয়ে গেছে?" },
];

/* ---------------- helpers ---------------- */

const voice = (scene: SceneTiming, file: string, seed: number) => {
  const clip = scene.clips.find((c) => c.file === file);
  return {
    mouth: (fr: number): MouthState => (clip ? visemeFromEnvelope(clip.rmsEnvelope, fr - clip.offsetFrame, seed, clip.subtitleBn) : MOUTH_REST),
    talk: (fr: number) => (clip ? speechLevel(clip.rmsEnvelope, fr - clip.offsetFrame) : 0),
  };
};

/** Brass platter heaped with sugar (চিনির ডালা). */
const ChiniDala: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={62} ry={15} fill="#8a5a14" />
    <ellipse cx={0} cy={0} rx={60} ry={13} fill="#e0aa3e" />
    <ellipse cx={-18} cy={-3} rx={22} ry={4} fill="#fff0b8" opacity={0.6} />
    <path d="M -38 -2 Q -10 -34 0 -36 Q 12 -34 38 -2 Z" fill="#fbfbf6" />
    {Array.from({ length: 14 }, (_, i) => (
      <circle key={i} cx={-28 + i * 4.2} cy={-6 - Math.sin((i / 13) * Math.PI) * 22} r={1.6} fill="#ffffff" />
    ))}
  </g>
);

const P_BELL: PropRenderer = ({ f, scale }) => (
  <g transform={`scale(${scale}) rotate(${Math.sin(f * 0.9) * 18}, 0, 0)`}>
    <rect x={-3} y={-4} width={6} height={22} fill="#c9932e" />
    <path d="M -16 46 Q -14 20 0 18 Q 14 20 16 46 Z" fill="#e6b84c" />
    <circle cx={0} cy={48} r={4} fill="#a87420" />
  </g>
);

const SacredWash: React.FC<{ amount: number; x?: number; y?: number }> = ({ amount, x = 50, y = 62 }) =>
  amount > 0.01 ? (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at ${x}% ${y}%, rgba(255,244,214,0.55) 0%, rgba(255,231,174,0.18) 35%, rgba(0,0,0,0) 70%)`,
          mixBlendMode: "screen",
          opacity: amount * 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at ${x}% ${y}%, rgba(0,0,0,0) 35%, rgba(10,6,18,0.55) 100%)`,
          opacity: amount,
        }}
      />
    </>
  ) : null;

/** Quiet night courtyard (everyone is at the mandap). `fw` = warped world frame. */
const CourtyardSet: React.FC<{ fw: number; children?: React.ReactNode; mandapGlow?: number }> = ({ fw, children, mandapGlow = 1 }) => (
  <>
    <Layer depth={0.12}>
      <GlowDefs />
      <g transform="translate(0, -560)">
        <AmavasyaSky f={fw} horizonGlow={0} />
      </g>
    </Layer>
    <Layer depth={0.55}>
      <GlowDefs />
      <CourtyardBack f={fw} />
      {/* the mandap is off to the left: its red-gold light spills in */}
      <ellipse cx={-120} cy={560} rx={520} ry={420} fill="#ff6a2a" opacity={0.22 * mandapGlow * (0.85 + 0.15 * Math.abs(Math.sin(fw * 0.21)))} />
    </Layer>
    <Layer depth={0.8}>
      <GlowDefs />
      <TulsiMancha x={1760} y={830} f={fw} s={1.1} />
    </Layer>
    <Layer depth={1}>
      <GlowDefs />
      <DivineDefs />
      <CourtyardFloor f={fw} />
      {children}
    </Layer>
  </>
);

/* ================================================================== */
/* SHOT 1 — Mandap: Bhagabati Thakur calls for the sugar              */
/* ================================================================== */

const ShotMandap: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.mandap.from;
  const v = voice(scene, "03a_Scene3_Call.wav", 97);
  const cam = {
    x: track(f, [
      [0, 230],
      [110, 250],
      [178, 20, "inOut"],
    ]),
    y: track(f, [
      [0, 40],
      [110, 40],
      [178, 0],
    ]),
    zoom: track(f, [
      [0, 1.42],
      [110, 1.46],
      [178, 1.02, "inOut"],
    ]),
    focus: 1,
    dof: 2.4,
  };
  const priest = A([
    { f: 0, bodyTurn: -0.45, headTurn: -0.35, eyeX: -0.9, brow: 0.4, browTilt: 0.3, smile: 0, rS: 70, rE: 75, rHand: "open", lS: 30, lE: -60, lHand: "hold", lProp: "bell" },
    { f: 30, rS: 85, rE: 40, lean: -3 },
    { f: 64, rS: 65, rE: 85, lean: 2, brow: 0.7 },
    { f: 112, rS: 12, rE: -20, rHand: "relaxed", headTurn: 0.1, eyeX: 0, brow: 0.2, lean: 0 },
  ]);
  const SHOT_LIGHTS: SceneLight[] = [{ x: 950, y: 430, color: "#ff8a3c", intensity: 1.2, radius: 1600, flicker: 7 }];
  return (
    <Stage cam={cam} opacity={clamp(f / 10)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <Layer depth={0.8}>
        <GlowDefs />
        <KaliMandap f={f} />
      </Layer>
      <Layer depth={1}>
        <GlowDefs />
        <Puppet
          cast={CAST.bhagabati}
          f={f}
          x={1520}
          y={900}
          scale={1.5}
          acting={priest}
          mouth={v.mouth}
          talk={v.talk}
          light={{ keySide: -1, rim: "#ff9a3c", rimStrength: 0.6 }}
          props={{ bell: P_BELL }}
        />
      </Layer>
      <Layer depth={1.25}>
        <MandapCrowd f={f} n={10} y={1120} s={1.25} />
      </Layer>
      <Grade warmth={0.35} vignette={0.62} bloomAt={[50, 40]} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 2 — Charu steps down into the courtyard with the sugar platter */
/* ================================================================== */

const CHARU_LIGHT = { keySide: 1 as const, rim: "#ffcf87", rimStrength: 0.45 };

const charuWalk = A([
  { f: 176, bodyTurn: -0.3, bodyX: -560, headTurn: -0.4, eyeX: -0.8, smile: 0.2, brow: 0.3, rS: 5, rE: -72, rHand: "hold", lS: 5, lE: -72, lHand: "hold" },
  { f: 240, headTurn: -0.2, eyeX: -0.3, brow: 0.5 },
  { f: 258, stride: 0.8, bodyTurn: 0.65, headTurn: 0, in: 10 },
  { f: 372, bodyX: -140, stride: 0.8, headTurn: 0.15, eyeX: 0.3, ease: "linear", in: 114 },
  { f: 404, bodyX: -140, stride: 0, bodyTurn: 0.25, in: 24, ease: "out" },
]);

const ShotCharu: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.charu.from;
  const p = charuWalk(f);
  const cam = {
    x: track(f, [
      [176, -520],
      [258, -500],
      [372, -150],
      [398, -130],
    ]),
    y: track(f, [
      [176, 20],
      [398, 10],
    ]),
    zoom: track(f, [
      [176, 1.32],
      [398, 1.22],
    ]),
    focus: 1,
    dof: 2.6,
  };
  const cx = 900 + (p.bodyX ?? 0);
  const SHOT_LIGHTS: SceneLight[] = [{ x: -250, y: 600, color: "#ff7a3a", intensity: 0.7, radius: 1800, flicker: 12 }, ...[-160, 80, 330, 1590, 1830, 2080].map((dx, i) => ({ x: dx, y: 790 + (i % 2) * 14, color: "#ffb04a", intensity: 0.45, radius: 650, flicker: 70 + i }))];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.charu.from) / DIS)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <CourtyardSet fw={f}>
        <Puppet cast={CAST.charu} f={f} x={900} y={1010} scale={1.45} acting={charuWalk} light={CHARU_LIGHT} stillness={0.3} />
        <ChiniDala x={cx + 2} y={1010 - 168 * 1.45 + Math.abs(Math.sin(f * 0.32)) * -3 * (p.stride ?? 0)} s={1.25} />
      </CourtyardSet>
      <Layer depth={1.35} blend="screen">
        <Bokeh f={f} n={10} seed={31} size={[16, 40]} />
      </Layer>
      <Grade warmth={0.25} vignette={0.66} bloomAt={[30, 60]} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 3 — The arrival (Level 3): time slows, light descends, lotus  */
/* ================================================================== */

const charuMiracle = A([
  { f: 392, bodyTurn: 0.25, bodyX: -140, headTurn: 0.1, eyeX: 0.3, smile: 0.2, brow: 0.5, rS: 5, rE: -72, rHand: "hold", lS: 5, lE: -72, lHand: "hold" },
  { f: 440, headTilt: -8, eyeY: -0.85, eyeX: 0.2, brow: 1, gasp: 0.35, smile: 0.1, in: 30 },
  { f: 500, headTilt: -4, eyeY: 0.4, eyeX: 0.6, gasp: 0.15, in: 30 },
  // কোনো রকম প্রসবব্যথা ছাড়াই — she kneels, serene, no pain
  { f: 572, crouch: 0.85, rS: -10, rE: -40, lS: -10, lE: -40, rHand: "relaxed", lHand: "relaxed", brow: 0.3, gasp: 0, in: 38 },
  { f: 600, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "open", lHand: "open", lid: 0.45, smile: 0.55, eyeY: 0.7, in: 22 }, // hands joined (pranam)
  { f: 672, lid: 0, brow: 1, gasp: 0.4, smile: 0.4, eyeY: 0.6, eyeX: 0.8, in: 6, ease: "snap" },
  { f: 690, gasp: 0.1, smile: 0.8, brow: 0.6, browTilt: 0.4, tears: 0.5, in: 16 },
]);

const ShotMiracle: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.miracle.from;
  const fw = timeWarp(f, WARP_FROM, WARP_TO);
  const p = charuMiracle(f);
  const rays = track(f, [
    [412, 0],
    [500, 1],
  ]);
  const bloom = track(f, [
    [470, 0],
    [520, 0.3],
    [610, 0.35],
    [662, 1, "out"],
  ]);
  const aura = track(f, [
    [600, 0],
    [660, 2.4],
    [BIRTH, 3],
    [690, 2.8],
  ]);
  const flash = clamp(1 - Math.abs(f - BIRTH) / 12) * 0.5;
  const babyIn = clamp((f - BIRTH + 2) / 10);
  const sacred = track(f, [
    [404, 0],
    [480, 0.8],
    [BIRTH, 1],
  ]);
  const cam = {
    x: track(f, [
      [392, -130],
      [480, -40],
      [600, 0],
      [690, 0],
    ]),
    y: track(f, [
      [392, 10],
      [560, 120],
      [690, 205],
    ]),
    zoom: track(f, [
      [392, 1.22],
      [480, 1.15],
      [610, 1.28],
      [690, 1.42],
    ]),
    focus: 1,
    dof: 3.2,
  };
  const dalaOnGround = clamp((f - 560) / 14);
  const cx = 900 + (p.bodyX ?? 0);
  const handY = 1010 - 168 * 1.45 + (p.crouch ?? 0) * 150 * 0.42 * 1.45;
  const SHOT_LIGHTS: SceneLight[] = [{ x: -250, y: 600, color: "#ff7a3a", intensity: 0.7 * (1 - sacred * 0.6), radius: 1800, flicker: 12 }, { x: 980, y: 940, color: "#FFF4D6", intensity: sacred * 1.4 + flash, radius: 1300 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.miracle.from) / DIS)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <CourtyardSet fw={fw} mandapGlow={1 - sacred * 0.6}>
        <SacredLight f={fw} x={980} groundY={955} intensity={rays} />
        <LotusOfLight f={fw} x={980} y={955} bloom={bloom} s={1.25} />
        <Puppet cast={CAST.charu} f={f} x={900} y={1010} scale={1.45} acting={charuMiracle} light={{ ...CHARU_LIGHT, rimSide: 1, rim: "#FFF4D6", rimStrength: 0.4 + sacred * 0.5 }} stillness={0.6} />
        <ChiniDala x={lerp(cx + 2, cx - 120, dalaOnGround)} y={lerp(handY, 1018, dalaOnGround)} s={1.25} />
        <DivineAura f={fw} x={980} y={940} level={aura} s={1.1} />
        {babyIn > 0 && (
          <g opacity={babyIn}>
            <ellipse cx={985} cy={985} rx={150} ry={26} fill="#FFFDF7" opacity={0.9} />
            <BabyThakur
              f={f}
              x={990}
              y={950 + (1 - babyIn) * 22}
              s={1.25 * (0.88 + 0.12 * babyIn)}
              open={0}
              aura={0}
              smile={0.45}
              float={babyIn}
            />
          </g>
        )}
      </CourtyardSet>
      <Layer depth={1.35} blend="screen">
        <Bokeh f={fw} n={14} seed={33} color="#FFE7AE" size={[14, 36]} rise={0.2} />
      </Layer>
      <Grade warmth={0.25 * (1 - sacred)} vignette={0.6} flash={flash} flashColor="#FFF4D6" bloomAt={[52, 66]} />
      <SacredWash amount={sacred} x={52} y={66} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 4 — Close-up: শান্ত, জ্যোতির্ময় শিশুপুত্র — eyes open         */
/* ================================================================== */

const ShotCloseup: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.closeup.from;
  const fw = timeWarp(f, WARP_FROM, WARP_TO);
  const open = track(f, [
    [694, 0],
    [726, 1, "out"],
  ]);
  const cam = {
    x: 0,
    y: track(f, [
      [684, 10],
      [762, -10],
    ]),
    zoom: track(f, [
      [684, 1.0],
      [762, 1.1],
    ]),
    focus: 1,
    dof: 0,
  };
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.closeup.from) / DIS)} background="#120a10">
      <Layer depth={0.6} extraBlur={14}>
        <GlowDefs />
        <g transform="translate(-960, -700) scale(2)">
          <CourtyardFloor f={fw} />
        </g>
      </Layer>
      <Layer depth={1}>
        <DivineDefs />
        <LotusOfLight f={fw} x={960} y={790} bloom={1} s={2.6} />
        <ellipse cx={960} cy={760} rx={520} ry={70} fill="#FFFDF7" opacity={0.85} />
        <BabyThakur
          f={f}
          x={1000}
          y={600}
          s={4.4}
          open={open}
          aura={track(f, [[684, 2.6], [762, 1.8]])}
          float={1}
          turn={track(f, [[684, 0.25], [724, 0], [762, 0.08]])}
          lookX={track(f, [[700, 0.3], [722, 0], [748, 0], [762, 0.25]])}
          lookY={track(f, [[700, 0.2], [722, -0.1]])}
          smile={track(f, [[684, 0.4], [714, 0.45], [744, 0.88, "out"], [762, 0.8]])}
          bless={track(f, [[702, 0], [730, 1, "out"], [750, 1], [762, 0.55]])}
        />
      </Layer>
      <Layer depth={1.4} blend="screen">
        <Bokeh f={fw} n={12} seed={35} color="#FFE7AE" size={[20, 50]} rise={0.15} />
      </Layer>
      <Grade warmth={0} vignette={0.7} bloomAt={[50, 50]} />
      <SacredWash amount={0.85} x={50} y={52} />
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 5 — Manorama hurries in, sits, and takes him into her lap (কোলে) */
/* ================================================================== */

const MAN_X = 1240;
const LAP_CROUCH = 0.9;
/** where the baby rests in Manorama's lap while she sits */
const LAP = { x: MAN_X - 22, y: 1000 - (200 - LAP_CROUCH * 63) * 1.45 + 30 };
const LIFT = [866, 896] as const;

const manorama = A([
  { f: 756, bodyTurn: -0.65, bodyX: 760, stride: 1, headTurn: -0.1, eyeX: -0.8, brow: 0.8, smile: 0.3, rS: 10, rE: -20, lS: 10, lE: -20 },
  { f: 832, bodyX: 0, stride: 0, ease: "out", in: 76 },
  // she sits down (kneels) beside him, reaches, and gathers him into her lap — she stays seated
  { f: 852, bodyTurn: -0.35, crouch: LAP_CROUCH, rS: 18, rE: -35, lS: 18, lE: -35, rHand: "open", lHand: "open", eyeY: 0.8, brow: 0.6, smile: 0.7, lean: 8, in: 20, ease: "out" },
  { f: LIFT[1], lean: 4, rS: 4, rE: -66, lS: 4, lE: -66, rHand: "cup", lHand: "cup", headTilt: 8, headNod: 6, eyeY: 0.9, lid: 0.25, smile: 0.95, in: 30 },
  { f: 912, lean: 3, headNod: 7 },
]);

const babyPose = (f: number) => {
  const t = clamp((f - LIFT[0]) / (LIFT[1] - LIFT[0]));
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  // a gentle arc: up off the lotus, then down into the lap
  return { x: lerp(990, LAP.x, e), y: lerp(950, LAP.y, e) - Math.sin(e * Math.PI) * 45, rot: lerp(0, -6, e) };
};

const ShotManorama: React.FC = () => {
  const f = useCurrentFrame() + SHOTS.manorama.from;
  const fw = timeWarp(f, WARP_FROM, WARP_TO);
  const b = babyPose(f);
  const bp = babyPose(f - 3);
  const motion = { dx: (b.x - bp.x) / 3, dy: (b.y - bp.y) / 3, drot: (b.rot - bp.rot) / 3 };
  const lifted = clamp((f - LIFT[0]) / (LIFT[1] - LIFT[0]));
  const sacred = track(f, [
    [756, 0.9],
    [800, 0.45],
  ]);
  const cam = {
    x: track(f, [
      [756, 60],
      [840, 120],
      [912, 140],
    ]),
    y: track(f, [
      [756, 200],
      [870, 190],
      [912, 130],
    ]),
    zoom: track(f, [
      [756, 1.3],
      [912, 1.36],
    ]),
    focus: 1,
    dof: 2.8,
  };
  const SHOT_LIGHTS: SceneLight[] = [{ x: -250, y: 600, color: "#ff7a3a", intensity: 0.45, radius: 1800, flicker: 12 }, { x: b.x - 40, y: b.y - 20, color: "#FFF4D6", intensity: 0.9, radius: 950 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.manorama.from) / DIS)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <CourtyardSet fw={fw} mandapGlow={0.6}>
        <SacredLight f={fw} x={980} groundY={955} intensity={track(f, [[756, 0.8], [830, 0.25]])} />
        <LotusOfLight f={fw} x={980} y={955} bloom={track(f, [[756, 1], [860, 0.4]])} s={1.25} />
        <Puppet cast={CAST.charu} f={f} x={760} y={1010} scale={1.45} acting={A([{ f: 756, crouch: 0.85, headTurn: 0.5, eyeX: 0.8, eyeY: 0.4, smile: 0.8, brow: 0.5, browTilt: 0.4, tears: 0.4, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "open", lHand: "open" }, { f: 860, eyeY: -0.3, headTilt: -4 }])} light={CHARU_LIGHT} stillness={0.6} />
        <ChiniDala x={640} y={1018} s={1.25} />
        <Puppet cast={CAST.manorama} f={f} x={MAN_X} y={1000} scale={1.45} acting={manorama} light={{ keySide: -1, rim: "#FFE7AE", rimStrength: 0.55 }} />
        <ellipse cx={985} cy={985} rx={150} ry={26} fill="#FFFDF7" opacity={0.9 * (1 - clamp((f - LIFT[0]) / 20))} />
        <BabyThakur
          f={f}
          x={b.x}
          y={b.y}
          s={1.25}
          open={1}
          aura={track(f, [[756, 1.8], [900, 1]])}
          rot={b.rot}
          motion={motion}
          float={track(f, [[756, 1], [LIFT[0], 1], [LIFT[0] + 8, 0]])}
          bless={track(f, [[756, 0.55], [790, 0]])}
          headRoll={lerp(-48, -26, lifted)}
          lookX={lerp(-0.3, 0.55, lifted)}
          lookY={lerp(0.1, -0.7, lifted)}
          turn={lerp(-0.1, 0.35, lifted)}
          smile={track(f, [[756, 0.75], [LIFT[1], 0.65], [912, 0.85]])}
        />
      </CourtyardSet>
      <Layer depth={1.35} blend="screen">
        <Bokeh f={fw} n={12} seed={37} color="#FFE7AE" size={[14, 36]} />
      </Layer>
      <Grade warmth={0.15} vignette={0.6} bloomAt={[55, 62]} />
      <SacredWash amount={sacred} x={55} y={62} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */
/* SHOT 6 — "দিদি… পূজো কি আরম্ভ হয়ে গেছে?"                            */
/* ================================================================== */

const ShotClosing: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const f = useCurrentFrame() + SHOTS.closing.from;
  const v = voice(scene, "03c_Scene3_Charu.wav", 83);
  const cam = {
    x: track(f, [
      [906, 40],
      [1006, 60],
    ]),
    y: track(f, [
      [906, 120],
      [1006, 110],
    ]),
    zoom: track(f, [
      [906, 1.55],
      [1006, 1.65],
    ]),
    focus: 1,
    dof: 3,
  };
  const man = A([
    { f: 906, bodyTurn: -0.3, crouch: LAP_CROUCH, lean: 3, headNod: 7, headTilt: 8, eyeY: 0.9, eyeX: 0.2, smile: 0.95, lid: 0.25, rS: 4, rE: -66, lS: 4, lE: -66, rHand: "cup", lHand: "cup" },
    { f: 960, headTurn: -0.45, eyeX: -0.8, eyeY: 0.5, headTilt: 3, in: 16 },
  ]);
  const charu = A([
    { f: 906, bodyTurn: 0.35, crouch: 0.85, headTurn: 0.3, eyeX: 0.8, eyeY: -0.5, smile: 0.4, brow: 0.3, browTilt: 0.5, tears: 0.3, rS: -6, rE: -40, lS: -6, lE: -40 },
    { f: 945, headTilt: -5, lid: 0.25 },
  ]);
  const armY = LAP.y;
  const SHOT_LIGHTS: SceneLight[] = [{ x: -250, y: 600, color: "#ff7a3a", intensity: 0.6, radius: 1800, flicker: 12 }, { x: MAN_X - 50, y: armY - 30, color: "#FFF4D6", intensity: 0.6, radius: 800 }];
  return (
    <Stage cam={cam} opacity={clamp((f - SHOTS.closing.from) / DIS) * clamp((1006 - f) / 14)}>
    <SceneLights.Provider value={SHOT_LIGHTS}>
      <CourtyardSet fw={f} mandapGlow={0.9}>
        <Puppet cast={CAST.charu} f={f} x={760} y={1010} scale={1.45} acting={charu} mouth={v.mouth} talk={v.talk} light={CHARU_LIGHT} stillness={0.4} />
        <Puppet cast={CAST.manorama} f={f} x={MAN_X} y={1000} scale={1.45} acting={man} light={{ keySide: -1, rim: "#FFE7AE", rimStrength: 0.5 }} />
        <BabyThakur
          f={f}
          x={LAP.x}
          y={LAP.y + Math.sin(f * 0.08) * 1.5}
          s={1.25}
          open={1}
          aura={1}
          rot={-6}
          headRoll={-26}
          lookX={track(f, [[906, 0.5], [930, -0.7]])}
          lookY={track(f, [[906, -0.6], [930, -0.2]])}
          turn={track(f, [[906, 0.3], [934, -0.35]])}
          smile={track(f, [[906, 0.8], [990, 0.9]])}
          bless={track(f, [[950, 0], [972, 0.35, "out"], [1000, 0.15]])}
        />
      </CourtyardSet>
      <Grade warmth={0.3} vignette={0.62} bloomAt={[55, 55]} />
    </SceneLights.Provider>
    </Stage>
  );
};

/* ================================================================== */

export const Scene03Arrival: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  const seq = (k: keyof typeof SHOTS, el: React.ReactNode, last = false) => (
    <Sequence from={SHOTS[k].from} durationInFrames={SHOTS[k].to - SHOTS[k].from + (last ? 0 : DIS)} layout="none">
      {el}
    </Sequence>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#05040a", overflow: "hidden" }}>
      {seq("mandap", <ShotMandap scene={scene} />)}
      {seq("charu", <ShotCharu />)}
      {seq("miracle", <ShotMiracle />)}
      {seq("closeup", <ShotCloseup />)}
      {seq("manorama", <ShotManorama />)}
      {seq("closing", <ShotClosing scene={scene} />, true)}
    </div>
  );
};

/** Standalone demo: scene + voices + hushed ambience + divine motif. */
/** Scene 03 sound bed (no voices): hushed ambience + night music + divine motif + shimmers. Scene-local frames. */
export const Scene03SoundBed: React.FC<{ scene: SceneTiming }> = ({ scene }) => {
  // Level-3 hush: ambience and night music dip while the divine motif rises
  const hush = (fr: number) => interpolate(fr, [396, 440, 770, 830], [1, 0.15, 0.15, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <Audio src={staticFile(`audio/ambient/${scene.ambientBed}`)} loop volume={(fr) => 0.2 * hush(fr)} />
      <Audio src={staticFile(`audio/music/${scene.musicCue}`)} loop volume={(fr) => 0.14 * hush(fr) * interpolate(fr, [0, 20, 980, 1006], [0, 1, 1, 0], { extrapolateRight: "clamp" })} />
      <Sequence from={404} durationInFrames={602} layout="none">
        <Audio
          src={staticFile("audio/music/Divine_Motif.wav")}
          volume={(fr) => interpolate(fr, [0, 40, 560, 602], [0, 0.42, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      </Sequence>
      {[420, 655].map((at) => (
        <Sequence key={at} from={at} durationInFrames={120} layout="none">
          <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={0.35} />
        </Sequence>
      ))}
    </>
  );
};

/** Standalone demo: scene + voices + sound bed + subtitles. */
export const Scene03Demo: React.FC = () => {
  const scene = SCENE03;
  return (
    <div style={{ position: "relative", width: 1920, height: 1080, background: "#05040a", overflow: "hidden" }}>
      <Scene03Arrival scene={scene} />
      {scene.clips.map((clip) => (
        <Sequence key={clip.file} from={clip.offsetFrame} durationInFrames={clip.frames} layout="none">
          <Audio src={staticFile(`audio/ep01/${clip.file}`)} volume={1} />
        </Sequence>
      ))}
      <DuckProvider scene={scene}>
        <Scene03SoundBed scene={scene} />
      </DuckProvider>
      <CueSubtitles cues={SCENE03_CUES} />
    </div>
  );
};
