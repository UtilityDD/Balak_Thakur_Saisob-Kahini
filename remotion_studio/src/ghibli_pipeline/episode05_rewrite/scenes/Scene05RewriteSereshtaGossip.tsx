import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp, hash, lerp, noise1 } from "../../../cinematic/core/anim";
import type { Cam } from "../../../cinematic/core/Stage";
import {
  bambooThump,
  gestureEnv,
  headNods,
  headShake,
  headShakeTilt,
  jabPulse,
  type Pose,
  throwUpPulse,
  turnBody,
  walkPose,
  walkTravel,
} from "../../../cinematic/rig/Puppet";
import { mouthFromRms } from "../../episode04/Ep04GhibliShared";
import { GhibliBirdFlock, GhibliGroundCover } from "../../core/GhibliLifeKit";
import { GhibliCharFilterDefs, GhibliCutout, GhibliGrade, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { GHIBLI_ANCHORS } from "../../episode05/plateAnchors";
import { EP05R_CAST, EP05R_GESTURES, EP05R_LIGHT, Ep05Haricharan, Ep05Person, Ep05SeatedBalak } from "../Ep05RewriteCast";
import {
  Ep05ClerkDesk,
  Ep05Inkpot,
  Ep05Ledger,
  ep05InkpotMouth,
  ep05LedgerPenPoint,
  Ep05ReedPen,
  EP05_HAND_PROPS,
  makePalmFanInHand,
} from "../Ep05RewriteProps";
import type { PropRenderer } from "../../../cinematic/rig/Puppet";
import { ep05rCueLocal, ep05rPhraseLocal } from "../subtitles";
import { ep05rScene } from "../timing";
import { camAt, frameOn, PaintedPlate, PLATE_RECT, plateKeep, ramp, roleMouth, type Shot, shotAt, span, WarmWash } from "./RewriteKit";

/**
 * Scene 05 `05_sereshta_gossip` (blueprint section 5): the kachari's front veranda office, later afternoon, then the
 * wordless riverbank afterglow. Beats: AG13 (world open) · 05a · 05b · 05c + P10 · 05d · 05e + P11 · AG14 (a 40 f
 * dissolve inside this scene to the riverbank at sunset, held, then one slow push).
 *
 * SETS (stand-ins, no new paintings yet): the veranda interior plate kachari_veranda_inside_sketch is not painted, so the
 * veranda is the kachari front cutout (ghibli_ep05/kachari_front_sketch.png) drawn large (its plinth is the office floor),
 * the clerk's desk cutout with an open Ep05Ledger and an Ep05Inkpot laid over its painted closed books. The riverbank
 * (riverbank_jam_back, tree_jamun_sketch) is the Padma outro card with a painted-earth near bank cut in an organic shape,
 * and the mango cutout darkened against the sunset as the stand-in jam tree. `Ep05RiverbankSunset` is exported so the
 * outro (Scene99RewriteOutro) continues the very same picture.
 *
 * BLOCKING: the junior clerk (মুহুরিবাবু) cross-legged on the floor left of centre, turned right, fanning with the
 * talpakha in his near (left) hand; the senior clerk (বড়বাবু) cross-legged at the right behind the desk, turned left,
 * writing with the reed pen (nib on the ledger line, dips in the inkpot) in his near (right) hand. Haricharan stomps in
 * from the left along the veranda with the bamboo carried, stops between and behind them, plants and thumps the pole and
 * reports (05a), then listens with both hands on the pole. Surendra is not present (Q15). Each figure has its own
 * groundLocked layer (all sharp: the blueprint's rack focuses are clean cuts, since a blurred figure reads as a smudge).
 * CAMERA: AG13 held wide · Shot 34 medium-wide three-shot (cut on the line) · Shot 35 MCU senior, cut 7 f before the
 * line · Shot 36 medium on the junior (the two others in the frame for P10's stares), cut 7 f before · Shot 37 medium
 * three-shot (cut on the line), Shot 38 + P11 hold it · AG14.
 * Every key comes from the generated spans and caption cues (never raw frames of the episode).
 */

const SCENE_ID = "05_sereshta_gossip";
const FRONT = { x: 960, y: 1185, h: 1500 }; // kachari front cutout: its plinth (the veranda floor) lands at about y 940
const FLOOR_Y = 958;
const KV = 0.92; // the clerks' Puppet scale
const KH = 1.0; // Haricharan (standing a little further back)
const SENIOR = { x: 1322, y: FLOOR_Y };
const JUNIOR = { x: 700, y: FLOOR_Y + 2 };
const HARI = { fromX: -150, x: 1010, y: 940 };
const DESK = { x: 1262, y: 966, h: 120 };
const LED = { x: DESK.x - 14, y: 909, s: 1 };
const INK = { x: DESK.x + 47, y: 871, s: 0.95 };
const D_HARI = 0.92;
const D_SENIOR = 0.96;
const D_JUNIOR = 1.0;
const LIGHT = EP05R_LIGHT.lateAfternoon;

const PRELOAD = [
  "images/ghibli_ep05/kachari_front_sketch.png",
  "images/ghibli_ep05/prop_clerk_desk.png",
  "images/ghibli_ep05/sky_grove_afternoon.png",
  "images/ghibli_ep05/card_outro_padma_sketch.png",
  "images/ghibli_ep05/grove_floor_sketch.png",
  "images/ghibli_ep05/tree_jamun_sketch.png",
] as const;

/* =============================================================================================================== */
/* The riverbank at sunset (AG14, continued by the outro)                                                          */
/* =============================================================================================================== */

/** Balak's seat on the riverbank (under the stand-in jam tree, small in the frame, face well above the captions). */
export const EP05R_RIVER_SEAT = { x: 1585, y: 914, s: 0.6 };
/**
 * AG14's framings. The composition dissolves the outro's FROZEN first frame over AG14's last 40 frames, so AG14 must be
 * still by then: it holds the wide, drifts in a touch (START -> END) before the outro dissolve, and the outro starts on
 * exactly END and makes the slow push in on Balak under the closing words (the blueprint's "one slow push").
 */
export const EP05R_RIVER_CAM_START: Cam = { ...frameOn(1120, 560, 1.0), focus: 1, dof: 0 };
export const EP05R_RIVER_CAM_END: Cam = { ...frameOn(1160, 578, 1.045), focus: 1, dof: 0 };

// the far edge of the near bank (the waterline), x -> y
const BANK_EDGE: Array<[number, number]> = [
  [-320, 846],
  [120, 866],
  [520, 880],
  [900, 884],
  [1180, 872],
  [1480, 862],
  [1800, 876],
  [2280, 906],
];
const bankEdgeY = (x: number) => {
  for (let i = 1; i < BANK_EDGE.length; i++) {
    const [x0, y0] = BANK_EDGE[i - 1];
    const [x1, y1] = BANK_EDGE[i];
    if (x <= x1) return lerp(y0, y1, clamp((x - x0) / (x1 - x0)));
  }
  return BANK_EDGE[BANK_EDGE.length - 1][1];
};
const BANK_PATH = (() => {
  let d = `M -340 1320 L ${BANK_EDGE[0][0]} ${BANK_EDGE[0][1]}`;
  for (let i = 1; i < BANK_EDGE.length; i++) {
    const [x0, y0] = BANK_EDGE[i - 1];
    const [x1, y1] = BANK_EDGE[i];
    d += ` Q ${x0 + (x1 - x0) * 0.5} ${(y0 + y1) / 2 + (i % 2 ? -7 : 6)} ${x1} ${y1}`;
  }
  return `${d} L 2300 1320 Z`;
})();

/** A small far boat with a standing boatman poling, crossing slowly (ink silhouette, no glow). */
const FarBoat: React.FC<{ x: number; y: number; s: number; t: number }> = ({ x, y, s, t }) => {
  const pole = Math.sin(t * 0.045) * 6;
  return (
    <g transform={`translate(${x.toFixed(1)} ${(y + Math.sin(t * 0.08) * 0.8).toFixed(1)}) scale(${s})`} opacity={0.82}>
      <path d="M -34 0 Q 0 9 34 0 L 30 -4 Q 0 2 -30 -4 Z" fill="#4a3046" stroke="#2c1a24" strokeWidth={1} />
      <path d="M -10 -4 Q -4 -12 4 -12 Q 10 -12 12 -4 Z" fill="#5e3e50" stroke="#2c1a24" strokeWidth={0.8} />
      <g transform={`translate(22 -4)`}>
        <path d="M 0 0 L -1 -16 M -1 -16 L -3 -26" stroke="#2c1a24" strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={-3} cy={-29} r={3} fill="#2c1a24" />
        <path d={`M -3 -21 L ${10 + pole} 12`} stroke="#2c1a24" strokeWidth={1.1} />
      </g>
      <path d="M -40 3 Q 0 7 40 3" stroke="#ffe2b0" strokeWidth={1} opacity={0.5} fill="none" />
    </g>
  );
};

/** Sun glitter on the water under the low sun (flickering short strokes, ordinary light). */
const SunGlitter: React.FC<{ t: number; x: number; y0: number; y1: number; dusk: number }> = ({ t, x, y0, y1, dusk }) => (
  <g style={{ mixBlendMode: "screen" }}>
    {Array.from({ length: 16 }, (_, i) => {
      const u = i / 15;
      const y = lerp(y0, y1, u);
      const w = lerp(40, 190, u) * (0.75 + 0.5 * hash(i * 3.1));
      const dx = noise1(t * 0.03 + i * 1.7, 5) * 22 * (0.4 + u);
      const op = (0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.11 + i * 2.3))) * (1 - 0.55 * dusk);
      return <rect key={i} x={x - w / 2 + dx} y={y} width={w} height={2.4 + u * 2.6} rx={1.6} fill="#fff0c2" opacity={op} />;
    })}
  </g>
);

/**
 * The riverbank at sunset (stand-in for riverbank_jam_back + tree_jamun_sketch), drawn inside a <GhibliStage>.
 * `t` = frames since AG14 began (the outro passes 96 + its own frame, so everything flows on across the cut);
 * `dusk` 0..1 deepens the light; Balak's face is driven by `smile` / `lookX`.
 */
export const Ep05RiverbankSunset: React.FC<{ t: number; zoom: number; dusk?: number; smile?: number; lookX?: number; eyesDown?: number }> = ({
  t,
  zoom,
  dusk = 0,
  smile = 0.2,
  lookX = 0.35,
  eyesDown = 0.25,
}) => {
  const seat = EP05R_RIVER_SEAT;
  const boatX = 260 + t * 0.55;
  return (
    <>
      <PaintedPlate href="images/ghibli_ep05/card_outro_padma_sketch.png" />
      <GhibliLayer depth={1}>
        <defs>
          <clipPath id="e5r-bank">
            <path d={BANK_PATH} />
          </clipPath>
          <linearGradient id="e5r-bank-dusk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2a774" stopOpacity={0.55} />
            <stop offset="35%" stopColor="#8a5068" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#3c2236" stopOpacity={0.8} />
          </linearGradient>
          <filter id="e5r-tree-dusk" x="-5%" y="-5%" width="110%" height="110%">
            <feColorMatrix type="matrix" values="0.24 0.05 0.03 0 0.08  0.04 0.17 0.04 0 0.045  0.06 0.06 0.21 0 0.085  0 0 0 1 0" />
          </filter>
        </defs>
        {/* far life: the boat crossing, the sun glitter, birds flying home */}
        <FarBoat x={boatX} y={706} s={0.7} t={t} />
        <SunGlitter t={t} x={1560} y0={640} y1={830} dusk={dusk} />
        <GhibliBirdFlock f={t} lifeF={t} start={0} dur={300} from={{ x: 2050, y: 250 }} to={{ x: 250, y: 120 }} count={7} formation="v" s={0.8} loop />
        <GhibliBirdFlock f={t} lifeF={t} start={140} dur={340} from={{ x: 2100, y: 360 }} to={{ x: 500, y: 230 }} count={4} formation="loose" s={0.6} loop />
        {/* the near bank: painted earth in an organic cut, washed with the sunset */}
        <g clipPath="url(#e5r-bank)">
          <image href={staticFile("images/ghibli_ep05/grove_floor_sketch.png")} x={-340} y={820} width={2640} height={500} preserveAspectRatio="none" />
          <rect x={-340} y={820} width={2640} height={500} fill="url(#e5r-bank-dusk)" />
          <rect x={-340} y={820} width={2640} height={500} fill="#2a1626" opacity={0.18 + 0.22 * dusk} />
        </g>
        <path d={BANK_PATH.split(" L 2300 1320 Z")[0].replace("M -340 1320 L", "M")} stroke="#ffd9a6" strokeWidth={2} fill="none" opacity={0.45} />
        <path d={BANK_PATH.split(" L 2300 1320 Z")[0].replace("M -340 1320 L", "M")} stroke="#3A2618" strokeWidth={1.2} fill="none" opacity={0.55} />
        {/* the stand-in jam tree, backlit by the sunset */}
        <g filter="url(#e5r-tree-dusk)">
          <GhibliCutout file="images/ghibli_ep05/tree_jamun_sketch.png" anchor={{ width: 934, height: 883, anchorX: 0.5, anchorY: 0.98 }} x={1830} y={bankEdgeY(1830) + 18} targetHeight={1060} />
        </g>
        <GhibliGroundCover x={1830} y={bankEdgeY(1830) + 18} w={240} s={0.9} lifeF={t} preset="grove" litter />
      </GhibliLayer>
      <GhibliLayer depth={1}>
        <GhibliCharFilterDefs f={t} />
        <Ep05SeatedBalak
          x={seat.x}
          y={seat.y}
          s={seat.s}
          f={t}
          lifeF={t}
          pose="sitCross"
          expression="serene"
          face={{ lookX, smile, eyesDown }}
          mouth={0}
          talk={0}
          glowK={0}
          zoom={zoom}
        />
        <GhibliGroundCover x={seat.x - 20} y={seat.y + 8} w={170} s={0.7} lifeF={t + 40} preset="grove" litter part="front" />
      </GhibliLayer>
    </>
  );
};

/** The riverbank as a full frame (AG14 and its dissolve). */
const RiverFrame: React.FC<{ t: number; cam: Cam; opacity?: number }> = ({ t, cam, opacity = 1 }) => (
  <AbsoluteFill style={{ background: "#3a2436", overflow: "hidden", opacity }}>
    <GhibliStage cam={cam} background="#3a2436">
      <Ep05RiverbankSunset t={t} zoom={cam.zoom} />
      <GhibliGrade warmth={0.3} vignette={0.38} bloomAt={[78, 46]} paperOpacity={0.2} />
    </GhibliStage>
  </AbsoluteFill>
);

/* =============================================================================================================== */
/* The veranda office                                                                                              */
/* =============================================================================================================== */

/** Lerp every numeric field of two partial poses (string fields come from b once k > 0.5). */
const mixPose = (a: Partial<Pose>, b: Partial<Pose>, k: number): Partial<Pose> => {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  keys.forEach((key) => {
    const va = (a as Record<string, unknown>)[key];
    const vb = (b as Record<string, unknown>)[key];
    if (typeof va === "number" || typeof vb === "number") out[key] = lerp((va as number) ?? 0, (vb as number) ?? 0, k);
    else out[key] = k > 0.5 ? (vb ?? va) : (va ?? vb);
  });
  return out as Partial<Pose>;
};

/**
 * The senior clerk's reed pen held at a FIXED WORLD ANGLE (nib down and toward the page, like the palm fan stays upright),
 * whatever the forearm does, so the nib really meets the ledger line; PEN_A degrees from pointing straight down
 * (+ = the nib toward -x, the desk side). seniorGripFor(nib) is the matching hand target (the prop origin).
 */
const PEN_A = 38;
const PEN_NIB = 18; // hand-frame px from the prop origin to the nib (Ep05ReedPen at y 18)
const seniorPen: PropRenderer = ({ worldRot, scale }) => (
  <g transform={`scale(${scale}) rotate(${(-worldRot + PEN_A).toFixed(2)})`}>
    <Ep05ReedPen x={0} y={PEN_NIB} len={50} rot={0} />
  </g>
);
const seniorGripFor = (nib: { x: number; y: number }, s: number) => {
  const r = (PEN_A * Math.PI) / 180;
  return { x: nib.x + PEN_NIB * s * Math.sin(r), y: nib.y - PEN_NIB * s * Math.cos(r) };
};

const mouthOf = (role: string) => (fr: number) => mouthFromRms(roleMouth(SCENE_ID, role, fr), fr);
const talkOf = (role: string) => (fr: number) => roleMouth(SCENE_ID, role, fr);

export const Scene05RewriteSereshtaGossip: React.FC = () => {
  const f = useCurrentFrame();
  const dur = ep05rScene(SCENE_ID).durationFrames;
  const l5a = span(SCENE_ID, "05a_Haricharan_Report.wav");
  const l5b = span(SCENE_ID, "05b_ClerkA_SawEat.wav");
  const l5c = span(SCENE_ID, "05c_ClerkB_FedIt.wav");
  const p10 = span(SCENE_ID, "P10");
  const l5d = span(SCENE_ID, "05d_ClerkA_Verdict.wav");
  const l5e = span(SCENE_ID, "05e_Haricharan_Agree.wav");
  const p11 = span(SCENE_ID, "P11");
  const ag14 = span(SCENE_ID, "AG14_afterglow");

  // caption cues (scene-local) for gestures; fallbacks keep the scene alive if a line text changes
  const cue = (snip: string, fb: { from: number; to: number }) => ep05rCueLocal(SCENE_ID, snip) ?? fb;
  const cA2 = cue("ঠিক জানে", { from: l5a.from + 29, to: l5a.from + 101 });
  const cA3 = cue("কিছুতেই বলবে না", { from: cA2.to, to: cA2.to + 32 });
  const cA4 = cue("উল্টে বলে", { from: cA3.to, to: l5a.to });
  const mockAt = ep05rPhraseLocal(SCENE_ID, "'ও কি", cA4.from + 30);
  const cB2 = cue("মনে হয়", { from: l5b.from + 30, to: l5b.to });
  const khaiyeAt = ep05rPhraseLocal(SCENE_ID, "খাইয়ে", l5c.from + 95);
  const cD2 = cue("বিষয়বুদ্ধি", { from: l5d.from + 76, to: l5d.from + 159 });
  const cD3 = cue("অদ্ভুত পদার্থ", { from: cD2.to, to: l5d.to });
  const adbhutAt = ep05rPhraseLocal(SCENE_ID, "অদ্ভুত", cD3.from + 6);
  const ekdomAt = ep05rPhraseLocal(SCENE_ID, "একদম", l5e.from + 30);

  /* ---------------- shots ---------------- */
  const SHOTS: Shot[] = [
    { name: "AG13", from: 0, view: "veranda", cam: frameOn(990, 640, 1.06), note: "held wide in depth; Haricharan stomps in" },
    { name: "Shot 34", from: l5a.from, view: "veranda", cam: frameOn(HARI.x, 680, 2.35), note: "close on Haricharan as he reports" },
    { name: "Shot 35", from: l5b.from - 7, view: "veranda", cam: frameOn(SENIOR.x, 700, 2.55), note: "close on the senior clerk" },
    { name: "Shot 36 · P10", from: l5c.from - 7, view: "veranda", cam: frameOn(JUNIOR.x, 700, 2.55), note: "close on the junior clerk; P10 the others stare" },
    { name: "Shot 37", from: l5d.from, view: "veranda", cam: frameOn(SENIOR.x - 20, 710, 2.4), note: "close on the senior clerk's verdict" },
    { name: "Shot 38", from: l5e.from - 7, view: "veranda", cam: frameOn(HARI.x, 680, 2.4), note: "close on Haricharan as he agrees" },
    { name: "Shot 38 · P11", from: p11.from, view: "veranda", cam: frameOn(1010, 740, 1.45), note: "three-shot as all three nod" },
    {
      name: "AG14",
      from: ag14.from,
      view: "river",
      cam: EP05R_RIVER_CAM_START,
      push: { to: EP05R_RIVER_CAM_END, a: ag14.from + 16, b: dur - 40 },
      note: "40 f dissolve to the riverbank at sunset, then one slow push",
    },
  ];
  const DISSOLVE = 40;
  const inDissolve = f >= ag14.from && f < ag14.from + DISSOLVE;
  const vShot = inDissolve ? SHOTS[SHOTS.length - 2] : shotAt(f, SHOTS);
  const cam: Cam = plateKeep({ ...camAt(f, vShot), focus: 1, dof: 0 }, PLATE_RECT);
  // No rack focus: a blurred character reads as a smudge (main-session note 2026-11-28), so every figure stays sharp
  // and Shots 35 / 36 are clean cuts (dof 0).
  const riverT = f - ag14.from;
  if (f >= ag14.from + DISSOLVE) {
    const rc = plateKeep(camAt(f, SHOTS[SHOTS.length - 1]), PLATE_RECT);
    return <RiverFrame t={riverT} cam={{ ...rc, focus: 1, dof: 0 }} />;
  }

  /* ---------------- the senior clerk: pen, ledger, inkpot ---------------- */
  const LINE_F = 74;
  const writeNib = (fr: number) => {
    const li = Math.floor(fr / LINE_F);
    const u = (fr - li * LINE_F) / LINE_F;
    const line = 1 + (li % 4);
    const writing = u < 0.84;
    const k = writing ? u / 0.84 : 1 - (u - 0.84) / 0.16; // the hand runs back to the line start, lifted
    const p = ep05LedgerPenPoint(LED.x, LED.y, LED.s, k, writing ? line : line + (u - 0.84) / 0.16);
    const stroke = writing ? Math.sin(fr * 1.7) * 0.9 + Math.sin(fr * 0.63) * 0.6 : -4;
    return { x: p.x + (writing ? Math.sin(fr * 2.3) * 0.6 : 0), y: p.y + stroke - (writing ? 0 : 3) };
  };
  const inkMouth = ep05InkpotMouth(INK.x, INK.y, INK.s);
  const dipW = (fr: number, a: number) => {
    const u = fr - a;
    if (u <= 0 || u >= 24) return { w: 0, dunk: 0 };
    return { w: ramp(u, 0, 8) * (1 - ramp(u, 15, 24)), dunk: u > 8 && u < 15 ? Math.sin(((u - 8) / 7) * Math.PI) * 3 : 0 };
  };
  const stopAt = l5b.from - 6; // the pen stops mid-stroke
  const glanceA = l5a.from + 4; // a fussy glance up as Haricharan barges in, then back to the ledger
  const resumeAt = l5d.to + 26; // back to writing after the dip
  // the writing clock: it holds while he glances up (the hand rests on the page)
  const GL = 34;
  const writeClock = (fr: number) => (fr < glanceA ? fr : fr < glanceA + GL ? glanceA : fr - GL);
  const heldNib = writeNib(writeClock(stopAt));
  const nibAt = (fr: number) => {
    let base: { x: number; y: number };
    if (fr < stopAt) {
      const w = writeNib(writeClock(fr));
      base = { x: w.x, y: w.y - 4 * gestureEnv(fr, glanceA, GL, 8) };
    } else if (fr < resumeAt) {
      const lift = ramp(fr, stopAt, stopAt + 16) * (1 - ramp(fr, l5d.from + 4, l5d.from + 20));
      base = { x: heldNib.x - 6 * lift, y: heldNib.y - 14 * lift };
      // two taps of the pen on the page on "অদ্ভুত পদার্থ"
      const tap = (a: number) => Math.sin(Math.PI * clamp((fr - a) / 7)) * 9;
      base.y -= tap(adbhutAt) + tap(adbhutAt + 10);
    } else base = writeNib(writeClock(stopAt) + fr - resumeAt);
    const d = [dipW(fr, 24), dipW(fr, 196), dipW(fr, l5d.to + 2)].reduce((m, x) => (x.w > m.w ? x : m), { w: 0, dunk: 0 });
    return { x: lerp(base.x, inkMouth.x, d.w), y: lerp(base.y, inkMouth.y - 1 + d.dunk, d.w) };
  };
  const writingK = (fr: number) => clamp(1 - ramp(fr, stopAt, stopAt + 12) + ramp(fr, l5d.to, l5d.to + 18));
  const seniorActing = (fr: number): Partial<Pose> => {
    const stare = ramp(fr, p10.from, p10.from + 22) * (1 - ramp(fr, l5d.from, l5d.from + 14));
    const verdict = ramp(fr, l5d.from - 4, l5d.from + 10) * (1 - ramp(fr, l5d.to + 4, l5d.to + 18));
    const peer = mixPose(EP05R_GESTURES.seniorClerkPeer, EP05R_GESTURES.seniorClerkShake, verdict);
    const base = mixPose(peer, EP05R_GESTURES.seniorClerkWrite, writingK(fr));
    const glance = gestureEnv(fr, glanceA, 34, 8);
    const tapLook = gestureEnv(fr, adbhutAt - 6, 26, 6);
    return {
      ...base,
      bodyTurn: -0.32 - 0.16 * stare,
      headNod: (base.headNod ?? 0) - 5 * glance + headNods(fr, l5b.from + 2, 1, 16, 4) + 3 * tapLook + headNods(fr, p11.from + 1, 2, 11, 5),
      eyeY: (base.eyeY ?? 0) - 0.9 * glance + 0.6 * tapLook,
      brow: (base.brow ?? 0) + 0.3 * glance + 0.35 * stare,
      headTurn: -0.06 - 0.34 * stare + headShake(fr, cD2.from - 2, cD2.to - cD2.from + 6, 0.22),
      headTilt: headShakeTilt(fr, cD2.from - 2, cD2.to - cD2.from + 6) + 3 * stare,
      lean: (base.lean ?? 0) - 3 * stare,
      reach: 1,
      reachUp: 0,
      rProp: "reedPen",
      rHand: "hold",
    };
  };

  /* ---------------- the junior clerk ---------------- */
  const leanK = (fr: number) => ramp(fr, l5c.from - 8, l5c.from + 10) * (1 - ramp(fr, l5d.from + 6, l5d.from + 30));
  const fanFlutter = (fr: number) => {
    const k = leanK(fr);
    const lazy = 16 * Math.sin(fr * 0.42) + 3 * noise1(fr * 0.05, 4);
    return lerp(lazy * (fr > l5d.from ? 0.7 : 1), 8, k);
  };
  const juniorProps = { ...EP05_HAND_PROPS, palmFan: makePalmFanInHand(fanFlutter) };
  const juniorActing = (fr: number): Partial<Pose> => {
    const k = leanK(fr);
    const base = mixPose(EP05R_GESTURES.juniorClerkFan, EP05R_GESTURES.juniorClerkLeanIn, k);
    const inLine = fr >= l5c.from && fr < l5c.to ? 1 : 0;
    const inP10 = fr >= p10.from && fr < p10.to ? 1 : 0;
    const grin = 0.25 * gestureEnv(fr, mockAt, 70, 10) + 0.25 * gestureEnv(fr, adbhutAt - 4, 60, 10);
    const chuckle = gestureEnv(fr, adbhutAt + 2, 40, 6) * Math.abs(Math.sin((fr - adbhutAt) * 0.55));
    const wiggle = inLine * 0.15 * Math.sin(fr * 0.5);
    return {
      ...base,
      bodyTurn: 0.26,
      smile: (base.smile ?? 0) + grin + 0.15 * inP10,
      brow: (base.brow ?? 0) + wiggle + 0.25 * gestureEnv(fr, l5b.from, 40, 8),
      headTilt: 5 * k + 3 * Math.sin(fr * 0.07) * k,
      headNod: headNods(fr, khaiyeAt - 2, 1, 14, 5) + headNods(fr, cD2.from + 20, 2, 12, 4) + headNods(fr, p11.from, 2, 11, 6),
      eyeX: inP10 * 0.35 * Math.sin((fr - p10.from) * 0.16),
      headTurn: 0.06 + 0.08 * gestureEnv(fr, l5b.from, 120, 12),
      bodyY: -1.6 * chuckle,
    };
  };

  /* ---------------- Haricharan ---------------- */
  const hc = EP05R_CAST.haricharan;
  const walkO = { start: 0, dur: 70, fromX: HARI.fromX, toX: HARI.x, scale: KH, height: hc.height, seed: hc.seed, kind: "stomp" as const, carrySide: 1 as const, bodyTurn: 0.85, stopIn: 12 };
  const hariX = walkTravel(f, walkO).bodyX;
  const thump1 = l5a.from + 18;
  const thump2 = ekdomAt - 13;
  const twoHand = (fr: number) => clamp(ramp(fr, l5b.from + 2, l5b.from + 16) - ramp(fr, thump2 - 10, thump2 - 2) + ramp(fr, thump2 + 26, thump2 + 40));
  const hariActing = (fr: number): Partial<Pose> => {
    const walk = walkPose(fr, walkO);
    const plant = ramp(fr, 66, 80);
    const pole = mixPose(EP05R_GESTURES.haricharanPoleCarried, EP05R_GESTURES.haricharanPoleUpright, plant);
    const th = bambooThump(fr, thump1);
    const th2 = bambooThump(fr, thump2);
    const turn = fr < 70 ? 0.85 : turnBody(fr, 70, 16, 0.85, 0.3);
    const stare = ramp(fr, p10.from + 4, p10.from + 26) * (1 - ramp(fr, l5d.from + 2, l5d.from + 18));
    const toJunior = ramp(fr, l5c.from + 4, l5c.from + 18) * (1 - ramp(fr, l5d.from + 2, l5d.from + 18));
    // the near (left) arm: "listen!", the jabs at the clerks, the flung-up hand, the mock-innocent hand on the chest
    const listen = gestureEnv(fr, l5a.from + 6, 24, 7);
    const jab = jabPulse(fr, cA2.from + 12, 14, 2, 10);
    const thr = throwUpPulse(fr, cA3.from + 2, 10);
    const mock = gestureEnv(fr, mockAt - 5, Math.max(20, cA4.to - mockAt + 12), 8);
    const reachK = Math.max(listen, mock);
    const angry = 1 - mock;
    return {
      ...walk,
      ...pole,
      bodyTurn: lerp(lerp(turn, 0.08, toJunior), -0.38, stare),
      lean: (fr < 70 ? walk.lean ?? 0 : 0) + th.dLean + th2.dLean - 2 * stare,
      bodyY: (fr < 70 ? walk.bodyY ?? 0 : 0) + th.dY + th2.dY,
      rS: (pole.rS ?? 0) + th.dS + th2.dS,
      poleLift: th.poleLift + th2.poleLift,
      brow: lerp(-0.2, 0.6, mock) * (1 - stare) + 0.45 * stare + 0.4 * ramp(fr, l5e.from - 4, l5e.from + 8),
      browTilt: lerp(-0.85, 0.35, mock) * (1 - stare) * (fr < l5b.from ? 1 : 0.5),
      smile: 0.45 * mock + 0.32 * ramp(fr, l5e.from - 4, l5e.from + 8) * (1 - ramp(fr, p11.to - 4, p11.to)),
      lid: 0.12 * angry + 0.28 * mock,
      eyeY: -0.35 * mock,
      headTilt: 10 * mock + 2.5 * Math.sin(fr * 0.18) * mock + headShakeTilt(fr, cA3.from, 32, 2),
      headTurn: headShake(fr, cA3.from, 32, 0.2) - 0.32 * toJunior - 0.2 * stare + 0.04 * Math.sin(fr * 0.05),
      headNod:
        (fr < 70 ? walk.headNod ?? 0 : 0) +
        headNods(fr, l5b.to - 12, 1, 14, 4) +
        headNods(fr, cD2.from + 14, 2, 12, 5) +
        headNods(fr, l5e.from + 2, 2, 10, 9) +
        headNods(fr, p11.from, 2, 11, 6),
      reach: -reachK,
      reachUp: lerp(1, 0.2, mock / Math.max(1e-3, reachK)),
      lHand: mock > 0.3 ? "relaxed" : "open",
      jab: -jab * (1 - reachK),
      throwUp: -thr,
    };
  };
  const hariReachAt = (fr: number) => {
    const mock = gestureEnv(fr, mockAt - 5, Math.max(20, cA4.to - mockAt + 12), 8);
    const x = walkTravel(fr, walkO).bodyX;
    return mock > 0.01 ? { x: x + 10 * KH, y: HARI.y - 248 * KH } : { x: x + 92 * KH, y: HARI.y - 232 * KH };
  };

  /* ---------------- shot-level life ---------------- */
  const pageLift = 0.55 * ramp(f, p10.from + 6, p10.from + 14) * (1 - ramp(f, p10.to - 6, p10.to + 6)) * (0.8 + 0.2 * Math.sin(f * 0.4));
  const veranda = (
    <AbsoluteFill style={{ background: "#e8d2a6", overflow: "hidden" }}>
      <GhibliStage cam={cam} background="#e8d2a6">
        <GhibliPreload files={PRELOAD} />
        <PaintedPlate href="images/ghibli_ep05/sky_grove_afternoon.png" />
        <GhibliLayer depth={1}>
          <GhibliCutout file="images/ghibli_ep05/kachari_front_sketch.png" anchor={GHIBLI_ANCHORS.kachari_front_sketch} x={FRONT.x} y={FRONT.y} targetHeight={FRONT.h} />
          {/* the late sun slanting in from the right across the floor and the back wall */}
          <defs>
            <linearGradient id="e5r-sun-slant" x1="1" y1="0" x2="0" y2="0.35">
              <stop offset="0%" stopColor="#ffcf86" stopOpacity={0.5} />
              <stop offset="55%" stopColor="#ffc070" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#ffc070" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d="M 2000 300 L 1460 300 L 820 960 L 2000 960 Z" fill="url(#e5r-sun-slant)" style={{ mixBlendMode: "soft-light" }} />
          {Array.from({ length: 14 }, (_, i) => {
            const t = f * 0.35 + i * 37;
            const x = 1200 + ((i * 113 + t * 0.6) % 700) - (t % 300) * 0.2;
            const y = 420 + ((i * 71 + t * 0.4) % 460);
            return <circle key={i} cx={x} cy={y} r={1.3 + (i % 3) * 0.5} fill="#fff1c8" opacity={0.25 + 0.2 * Math.sin(f * 0.07 + i)} />;
          })}
        </GhibliLayer>
        <GhibliLayer depth={D_HARI} groundLocked>
          <GhibliCharFilterDefs f={f} />
          <Ep05Haricharan
            f={f}
            lifeF={f}
            x={hariX}
            y={HARI.y}
            scale={KH}
            light={LIGHT}
            acting={hariActing}
            mouth={mouthOf("haricharan")}
            talk={talkOf("haricharan")}
            twoHand={twoHand}
            reachAt={hariReachAt}
            reachExact
            pointAt={(fr) => ({ x: walkTravel(fr, walkO).bodyX - 320, y: HARI.y - 300 })}
            pointReach={0.82}
            breathRate={f < l5b.from ? 1.5 : 1.15}
          />
        </GhibliLayer>
        <GhibliLayer depth={D_SENIOR} groundLocked>
          <GhibliCharFilterDefs f={f} />
          <Ep05ClerkDesk x={DESK.x} y={DESK.y} h={DESK.h} />
          <Ep05Ledger x={LED.x} y={LED.y} s={LED.s} open={1} pageLift={pageLift} />
          <Ep05Inkpot x={INK.x} y={INK.y} s={INK.s} />
          <Ep05Person
            cast={EP05R_CAST.seniorClerk}
            f={f}
            lifeF={f}
            x={SENIOR.x}
            y={SENIOR.y}
            scale={KV}
            seated
            sitStyle="crossLegged"
            light={LIGHT}
            acting={seniorActing}
            mouth={mouthOf("clerkSenior")}
            talk={talkOf("clerkSenior")}
            reachAt={(fr) => seniorGripFor(nibAt(fr), KV)}
            props={{ ...EP05_HAND_PROPS, reedPen: seniorPen }}
            reachExact
            breathRate={0.9}
          />
        </GhibliLayer>
        <GhibliLayer depth={D_JUNIOR} groundLocked>
          <GhibliCharFilterDefs f={f} />
          <Ep05Person
            cast={EP05R_CAST.juniorClerk}
            f={f}
            lifeF={f}
            x={JUNIOR.x}
            y={JUNIOR.y}
            scale={KV}
            seated
            sitStyle="crossLegged"
            light={LIGHT}
            acting={juniorActing}
            mouth={mouthOf("clerkJunior")}
            talk={talkOf("clerkJunior")}
            props={juniorProps}
            breathRate={f >= l5c.from && f < p10.to ? 1.25 : 1}
          />
        </GhibliLayer>
        <GhibliGrade warmth={0.32} vignette={0.32} paperOpacity={0.2} />
      </GhibliStage>
      <WarmWash amount={0.1} />
    </AbsoluteFill>
  );

  if (!inDissolve) return veranda;
  const k = ramp(f, ag14.from, ag14.from + DISSOLVE);
  return (
    <AbsoluteFill>
      {veranda}
      <RiverFrame t={riverT} cam={EP05R_RIVER_CAM_START} opacity={k} />
    </AbsoluteFill>
  );
};
