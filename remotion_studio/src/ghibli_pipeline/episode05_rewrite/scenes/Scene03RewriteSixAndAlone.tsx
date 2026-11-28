import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, lerp, noise1, track } from "../../../cinematic/core/anim";
import type { Cam } from "../../../cinematic/core/Stage";
import { GESTURES6, type Pose, headShake, throwUpPulse, walkPose, walkTravel, type WalkOpts } from "../../../cinematic/rig/Puppet";
import { Hen, kolshiWalkPose, makeKolshiProp } from "../../../cinematic/life/VillageLife";
import { sighCurve } from "../../../episode03/rig/SeatedChild";
import type { StandingChildProps } from "../../../episode05/rig/StandingChild";
import { GhibliAtmosphericHaze, GhibliCharFilterDefs, GhibliCutout, GhibliGrade, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { GhibliBirdFlock, GhibliCloudShadows, GhibliDappledLight, GhibliGroundCover } from "../../core/GhibliLifeKit";
import { zoomProportionalDof } from "../../core/ghibliMotion";
import { PondKingfisher } from "../../episode04/Ep04PondLife";
import { mouthFromRms } from "../../episode04/Ep04GhibliShared";
import {
  GhibliKachariBackdrop,
  GhibliKachariFloorLayer,
  GhibliKachariForegroundAndGrade,
  KACHARI,
  KACHARI_BG,
  kachariKeepInSet,
} from "../../episode05/GhibliKachariSet";
import { EP05R_CAST, EP05R_LIGHT, EP05R_SCALE, Ep05Person, Ep05SeatedBalak, Ep05StandingBalak } from "../Ep05RewriteCast";
import { Ep05MangoLeaf } from "../Ep05RewriteProps";
import { ep05rPhraseLocal } from "../subtitles";
import { camAt, frameOn, PaintedPlate, PLATE_RECT, plateKeep, ramp, roleMouth, type Shot, shotAt, SkeletonTag, span, WarmWash } from "./RewriteKit";

/**
 * Scene 03 `03_six_and_alone` (blueprint section 5; chapter নয়, opening): Ujanchar, the family yard in afternoon light,
 * the lane, and the three quiet places. Mostly mood: held wides, one slow drift per shot, the life layer carries it.
 *
 * BEATS (all keyed to generated spans / caption phrases, never raw frames):
 *   AG8   held wide of the yard: Charu carries a kolshi along the veranda into the house, a hen pecks, washing on the
 *         line stirs, birds cross the sky; Balak (six) sits on the veranda edge gazing up at the sky (pose lookUp).
 *   17    03a: hold, then ONE slow push to a medium on Balak on "চুপচাপ ভাব" (everyone moves, he is still).
 *   18    03b: medium Surendra in the yard (cut 6 f before): beckons palm up ("এই বীরু!"), fists to hips ("কাজের কথায়
 *         মন নেই"), the near hand flung up and a head shake ("খালি খেয়াল আর দুষ্টুমি!"). NO hitting (Q9).
 *   18 r  reaction medium on Balak on "খালি খেয়াল": eyes turn to his father, then lower; a small breath.
 *   18 b  wide again at the end of the line: Balak already standing (the rise is elided by the cut: the seated and the
 *         standing rigs are different), head low; he turns away and walks off along the veranda (foot-locked steps);
 *         Surendra shakes his head and turns away. 03c's first phrase plays over it.
 *   19    "কখনো কখনো মারও জুটত": wide of the lane, Balak small, walking alone left to right (foot-locked, slow), his
 *         long afternoon shadow ahead of him, a leaf tumbling across; the camera drifts with him.
 *   20abc 03d: three calm pictures with 30 f cross-dissolves centred on each place word: (a) the banana grove behind
 *         the kachari, (b) the field's end under a big tree, (c) the jam tree by the river; Balak small, seated
 *         cross-legged, hands in his lap, still; one slow drift each. Life: leaves / butterflies / sun shafts (a), a kite
 *         bird circling, cloud shadows, grass (b), a sail far off, water glints, the kingfisher's dive in P5, fallen
 *         jamun by his knee (c).
 *   21    03e + P6: medium Charu kneeling on the veranda over a brass thali of rice (cut 6 f before): she stops, glances
 *         toward the grove (screen right), a relieved half-sigh and a half smile, then back to sifting the rice; P6 holds.
 *         (The blueprint's 30 f dissolve to the grove at the scene end belongs in Episode05Rewrite.tsx DISSOLVE_INTO.)
 *
 * STAND-INS (no new paintings yet): yard = ghibli_ep06/ujanchar_veranda_back; lane = ghibli_ep06/village_lane_back;
 * (a) the Ghibli kachari grove set; (b) ghibli_ep06/village_field_edge_back + the ep06 banyan cut-out standing in for the
 * debdaru; (c) ghibli_ep05/card_outro_padma_sketch re-graded from sunset to afternoon (colour matrix) + grove floor strip
 * + the ep05 mango cut-out standing in for the jam tree.
 * CLOCKS: no pause falls inside a voice clip here (P5 and P6 follow their lines), so the story clock is the local frame
 * and life runs on the same frame.
 */

const SCENE_ID = "03_six_and_alone";
const LIGHT = EP05R_LIGHT.afternoon;

/* ---------------- yard layout (world px of the veranda plate, PLATE_RECT) ---------------- */
const K_VER = 0.78; // adult scale on the veranda plinth
const K_YARD = 0.9; // adult scale in the near yard
const STEP = { x: 1200, y: 798 }; // Balak seated on the porch lip, right of the door
const STAND = { x: 1200, y: 798 }; // he stands on the same planks
const SUREN = { x: 700, y: 1000 }; // Surendra in the grass yard, calling across it
const CHARU_VER = { x: 1100, y: 786 }; // Charu kneeling on the porch, clear of the doorway
const THALI = { x: 1168, y: 800 };
const DOOR_X = 900;
const BALAK_SEAT_S = EP05R_SCALE.seatedBalak.s * K_VER;
const BALAK_STAND_S = EP05R_SCALE.standingBalak.s * K_VER;

/* ---------------- lane ---------------- */
// on the open lane floor right of the gate (the gate leaf and the near fence cover x < 1170 down to y 1125)
const K_LANE = 0.7;
const LANE = { x0: 1560, y: 1040 };
const GROVE_SEAT = { x: 1240, y: 914, s: EP05R_SCALE.seatedBalak.s * 0.85 };

/* ---------------- quiet places ---------------- */
const DEBDARU = { width: 321, height: 1014, anchorX: 0.5, anchorY: 0.99 };
const JAMUN = { width: 934, height: 883, anchorX: 0.5, anchorY: 0.98 };
const FIELD_TREE = { x: 1360, y: 900, h: 980 };
const FIELD_SEAT = { x: 1236, y: 842, s: EP05R_SCALE.seatedBalak.s * 0.52 };
const RIVER_TREE = { x: 1610, y: 912, h: 860 };
const RIVER_SEAT = { x: 1400, y: 912, s: EP05R_SCALE.seatedBalak.s * 0.8 };
const KF_PERCH = { x: 560, y: 792 };
const KF_TARGET = { x: 470, y: 838 };

const PRELOAD = [
  "images/ghibli_ep06/ujanchar_veranda_back.png",
  "images/ghibli_ep06/village_lane_back.png",
  "images/ghibli_ep06/village_field_edge_back.png",
  "images/ghibli_ep05/tree_debdaru_sketch.png",
  "images/ghibli_ep05/tree_jamun_sketch.png",
  "images/ghibli_ep06/prop_brass_thali.png",
  "images/ghibli_ep05/card_outro_padma_sketch.png",
  "images/ghibli_ep05/grove_floor_sketch.png",
] as const;

const smooth = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};

/* ================================================================================================================ */
/* Foot-locked child walk (StandingChild legDrive), as Ghibli Episode 4 scene 01's walk-in                           */
/* ================================================================================================================ */

interface ChildWalk {
  start: number;
  steps: number;
  stepF: number;
  /** body advance per step, figure units */
  stepLen: number;
  swing: number;
  lift: number;
}
const YAW_CA = Math.cos((55 * Math.PI) / 180);
const YAW_SA = Math.sin((55 * Math.PI) / 180);

/** Body travel (figure units) since the walk's start: trapezoid speed (one step to speed up, one to slow down). */
const walkD = (w: ChildWalk, fr: number): number => {
  const T = w.steps * w.stepF;
  const a = w.stepF;
  const b = w.stepF;
  const D = w.steps * w.stepLen;
  const vmax = D / (T - (a + b) / 2);
  const u = clamp(fr - w.start, 0, T);
  if (u < a) return (vmax * u * u) / (2 * a);
  if (u < T - b) return vmax * (a / 2 + (u - a));
  const r = T - u;
  return D - (vmax * r * r) / (2 * b);
};
const walkLand = (w: ChildWalk, k: number): number => {
  const D = w.steps * w.stepLen;
  return k >= w.steps - 2 ? D : Math.min(D, walkD(w, w.start + (k + 1.5) * w.stepF));
};
const walkFoot = (w: ChildWalk, fr: number, near: boolean): { d: number; lift: number; pitch: number } => {
  let plant = 0;
  for (let k = near ? 0 : 1; k < w.steps; k += 2) {
    const t0 = w.start + k * w.stepF;
    if (fr < t0) break;
    const land = walkLand(w, k);
    if (fr < t0 + w.swing) {
      const u = (fr - t0) / w.swing;
      const e = u * u * (3 - 2 * u);
      const pitch = u < 0.5 ? 0.24 * (1 - u / 0.5) : -0.18 * Math.sin(((u - 0.5) / 0.5) * (Math.PI / 2));
      return { d: lerp(plant, land, e), lift: 3 * (1 - e) + w.lift * Math.sin(Math.PI * u), pitch };
    }
    plant = land;
  }
  return { d: plant, lift: 0, pitch: 0 };
};
const walkDrive = (w: ChildWalk, fr: number): StandingChildProps["legDrive"] => {
  if (fr < w.start) return undefined;
  const D = walkD(w, fr);
  const n = walkFoot(w, fr, true);
  const fs = walkFoot(w, fr, false);
  const t = fr - w.start;
  const loc = t % w.stepF;
  const swingU = loc < w.swing ? loc / w.swing : 1;
  const live = 1 - clamp((fr - (w.start + w.steps * w.stepF - 4)) / 6);
  const stanceNear = Math.floor(t / w.stepF) % 2 === 1;
  const weight = loc < w.swing ? Math.sin(Math.PI * swingU) : 0.15;
  return {
    near: { x: (n.d - D) * YAW_CA, z: (n.d - D) * YAW_SA, lift: n.lift, pitch: n.pitch },
    far: { x: (fs.d - D) * YAW_CA, z: (fs.d - D) * YAW_SA, lift: fs.lift, pitch: fs.pitch },
    pelvisDrop: live * (loc < w.swing ? 1.2 + 1.8 * Math.sin(Math.PI * swingU) : 0.8),
    lean: 0.05 * live,
    shiftX: live * (stanceNear ? -2.2 : 2.2) * weight,
    hipTilt: live * (stanceNear ? 1.5 : -1.5) * weight,
  };
};

/* ================================================================================================================ */
/* Small life pieces drawn here (no shared file edited)                                                              */
/* ================================================================================================================ */

/** Washing on a line between the veranda's end post and off frame right: a gamchha and a dhoti that stir. */
const WashingLine: React.FC<{ lf: number }> = ({ lf }) => {
  const a = { x: 1020, y: 530 };
  const b = { x: 1320, y: 522 };
  const sag = 34;
  const yAt = (x: number) => {
    const u = (x - a.x) / (b.x - a.x);
    return lerp(a.y, b.y, u) + sag * 4 * u * (1 - u);
  };
  const cloth = (x: number, w: number, h: number, fill: string, stripe: string | null, seed: number) => {
    const y = yAt(x + w / 2);
    const sway = 5 * noise1(lf * 0.03, seed) + 2.5 * Math.sin(lf * 0.07 + seed);
    const lift = 3 * Math.max(0, noise1(lf * 0.025, seed + 3));
    const d = `M ${x} ${y} L ${x + w} ${y + 1} L ${x + w + sway} ${y + h - lift} Q ${x + w / 2 + sway * 0.8} ${y + h + 6 - lift} ${x + sway * 0.9} ${y + h - 2 - lift} Z`;
    return (
      <g key={seed}>
        <path d={d} fill={fill} stroke="#3A2618" strokeWidth={1.1} strokeOpacity={0.7} strokeLinejoin="round" opacity={0.92} />
        <path d={`M ${x + w * 0.62} ${y + 3} Q ${x + w * 0.66 + sway * 0.5} ${y + h * 0.5} ${x + w * 0.6 + sway * 0.8} ${y + h - 4 - lift} L ${x + w + sway - 2} ${y + h - 3 - lift} L ${x + w - 1} ${y + 2} Z`} fill="#a88452" opacity={0.18} />
        <path d={`M ${x + w * 0.3} ${y + 4} Q ${x + w * 0.28 + sway * 0.4} ${y + h * 0.55} ${x + w * 0.33 + sway * 0.8} ${y + h - 6 - lift}`} stroke="#8a6a44" strokeWidth={1} opacity={0.35} fill="none" />
        {stripe && (
          <path
            d={`M ${x + 2} ${y + h * 0.3} L ${x + w + sway * 0.4} ${y + h * 0.3 + 1} M ${x + 2} ${y + h * 0.62} L ${x + w + sway * 0.7} ${y + h * 0.62 + 1}`}
            stroke={stripe}
            strokeWidth={5}
            opacity={0.75}
          />
        )}
      </g>
    );
  };
  return (
    <g>
      <path d={`M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + sag * 2} ${b.x} ${b.y}`} stroke="#4a3624" strokeWidth={1.4} fill="none" opacity={0.8} />
      {cloth(1640, 58, 92, "#f3ead7", "#b8392e", 11)}
      {cloth(1730, 120, 150, "#faf5ea", null, 23)}
      {cloth(1880, 44, 70, "#e9dcc0", null, 37)}
    </g>
  );
};

/** A black kite (চিল) circling high on still wings: slow ellipse, banking with the turn. */
const ChilBird: React.FC<{ lf: number; cx: number; cy: number; rx: number; ry: number; s?: number; period?: number; phase?: number }> = ({
  lf,
  cx,
  cy,
  rx,
  ry,
  s = 1,
  period = 320,
  phase = 0,
}) => {
  const a = (lf / period) * Math.PI * 2 + phase;
  const x = cx + rx * Math.cos(a);
  const y = cy + ry * Math.sin(a);
  const dir = -Math.sin(a) >= 0 ? 1 : -1;
  const bank = 10 * Math.cos(a);
  const flap = Math.sin(lf * 0.5) * Math.max(0, Math.sin(a * 2.3)) * 3;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${bank.toFixed(1)}) scale(${(s * dir).toFixed(3)} ${s})`} opacity={0.82}>
      <path
        d={`M -26 ${2 - flap} Q -14 ${-5 - flap} -3 -1 Q 0 -2.5 3 -1 Q 14 ${-5 - flap} 26 ${2 - flap} Q 14 ${-1 - flap * 0.5} 3 2 L 1 9 L 3 12 L 0 11 L -3 12 L -1 9 L -3 2 Q -14 ${-1 - flap * 0.5} -26 ${2 - flap} Z`}
        fill="#4a3022"
        stroke="#2a1a10"
        strokeWidth={0.6}
      />
    </g>
  );
};

/** A country boat with a patched sail, far off on the river, drifting. */
const SailBoat: React.FC<{ x: number; y: number; s?: number; lf: number }> = ({ x, y, s = 1, lf }) => {
  const bob = Math.sin(lf * 0.08) * 0.8;
  return (
    <g transform={`translate(${x.toFixed(1)} ${(y + bob).toFixed(2)}) scale(${s})`}>
      <path d="M -30 0 Q 0 9 30 0 L 25 -4 L -25 -4 Z" fill="#4c3626" stroke="#2a1a10" strokeWidth={0.8} />
      <path d="M -2 -4 L -2 -46" stroke="#3a2618" strokeWidth={1.4} />
      <path d="M -1 -44 Q 18 -30 20 -6 L -1 -6 Z" fill="#efe1c2" stroke="#3a2618" strokeWidth={0.9} />
      <path d="M 4 -32 L 14 -30 M 3 -20 L 18 -18" stroke="#c8a77a" strokeWidth={0.8} opacity={0.8} />
      <path d="M -34 2 Q 0 7 34 2" stroke="#fff6e0" strokeWidth={1} opacity={0.5} fill="none" />
    </g>
  );
};

/** Short drifting sun glints on the water (cheap strokes, life clock). */
const RiverGlints: React.FC<{ lf: number; x0: number; x1: number; y0: number; y1: number; n?: number }> = ({ lf, x0, x1, y0, y1, n = 26 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const h1 = (Math.sin(i * 91.7) + 1) / 2;
      const h2 = (Math.sin(i * 37.3 + 2) + 1) / 2;
      const y = lerp(y0, y1, h2 * h2);
      const persp = lerp(0.5, 1.4, (y - y0) / Math.max(1, y1 - y0));
      const x = x0 + ((h1 * (x1 - x0) + lf * 0.25 * persp) % (x1 - x0));
      const tw = Math.max(0, Math.sin(lf * 0.09 + i * 1.7));
      return <path key={i} d={`M ${x.toFixed(1)} ${y.toFixed(1)} l ${(14 * persp).toFixed(1)} 0`} stroke="#fff4d6" strokeWidth={1.6 * persp} strokeLinecap="round" opacity={0.55 * tw} />;
    })}
  </g>
);

/** A few fallen jamun (dark purple berries) on the bank. */
const FallenJamun: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[
      [0, 0, -10],
      [13, 3, 20],
      [-9, 5, 60],
      [24, -1, -30],
    ].map(([dx, dy, r], i) => (
      <g key={i} transform={`translate(${dx} ${dy}) rotate(${r})`}>
        <ellipse rx={4.6} ry={3.4} fill="#3b1f3e" stroke="#1f1020" strokeWidth={0.6} />
        <ellipse cx={-1.4} cy={-1.1} rx={1.3} ry={0.8} fill="#a07aa8" opacity={0.7} />
      </g>
    ))}
  </g>
);

/** Balak's long late-afternoon shadow on the ground, falling ahead of him (sun from the upper left). */
const LongShadow: React.FC<{ x: number; y: number; h: number; step: number }> = ({ x, y, h, step }) => (
  <g opacity={0.2}>
    <path
      d={`M ${x - 10} ${y} Q ${x + h * 0.9} ${y + 4 + step} ${x + h * 1.9} ${y + 10} Q ${x + h * 2.05} ${y + 16} ${x + h * 1.85} ${y + 19} Q ${x + h * 0.9} ${y + 16} ${x + 6} ${y + 6} Z`}
      fill="#3b2a1c"
    />
  </g>
);

/* ================================================================================================================ */
/* Scene                                                                                                             */
/* ================================================================================================================ */

type View = "yard" | "path" | "grove" | "field" | "river";
interface Shot3 extends Shot {
  view: View;
  /** cross-dissolve from the previous shot over this many frames (centred on nothing: starts at `from`) */
  dissolve?: number;
}

export const Scene03RewriteSixAndAlone: React.FC = () => {
  const f = useCurrentFrame();
  const lf = f;
  const ag8 = span(SCENE_ID, "AG8_world_open");
  const l3a = span(SCENE_ID, "03a_Narrator_Six.wav");
  const l3b = span(SCENE_ID, "03b_Surendra_Scold.wav");
  const l3c = span(SCENE_ID, "03c_Narrator_Alone.wav");
  const l3d = span(SCENE_ID, "03d_Narrator_Places.wav");
  const p5 = span(SCENE_ID, "P5");
  const l3e = span(SCENE_ID, "03e_Charu_Relief.wav");

  // narration cues (CAM-13): camera keys and cuts ride the phrases
  const chupchap = ep05rPhraseLocal(SCENE_ID, "চুপচাপ ভাব", l3a.from + Math.round(l3a.frames * 0.6));
  const kajer = ep05rPhraseLocal(SCENE_ID, "কাজের কথায়", l3b.from + Math.round(l3b.frames * 0.23));
  const khali = ep05rPhraseLocal(SCENE_ID, "খালি খেয়াল", l3b.from + Math.round(l3b.frames * 0.6));
  const maro = ep05rPhraseLocal(SCENE_ID, "কখনো কখনো মারও", l3c.from + 58);
  const arEka = ep05rPhraseLocal(SCENE_ID, "আরও চুপচাপ", l3c.from + 140);
  const ekaBose = ep05rPhraseLocal(SCENE_ID, "একা, চুপটি", l3d.to - 90);
  const kola = ep05rPhraseLocal(SCENE_ID, "কলাবাগিচায়", l3d.from + 70);
  const debdaru = ep05rPhraseLocal(SCENE_ID, "দেবদারু", l3d.from + Math.round(l3d.frames * 0.4));
  const jam = ep05rPhraseLocal(SCENE_ID, "জামগাছতলায়", l3d.from + Math.round(l3d.frames * 0.68));
  const notun = ep05rPhraseLocal(SCENE_ID, "নতুন কোনো", l3e.from + 70);
  const rokkhe = ep05rPhraseLocal(SCENE_ID, "তাতেই রক্ষে", l3e.to - 40);
  const DIS = 30;

  // Balak's yard exit and lane walk
  const standCut = l3b.to - 4;
  const turnA = standCut + 16;
  const exitWalk: ChildWalk = { start: turnA + 16, steps: 14, stepF: 12, stepLen: 74, swing: 7, lift: 8 };
  const laneWalk: ChildWalk = { start: maro - 6, steps: 40, stepF: 13, stepLen: 80, swing: 8, lift: 9 };

  const SHOTS: Shot3[] = [
    { name: "AG8", from: ag8.from, view: "yard", cam: frameOn(960, 600, 1.0), note: "held wide, the yard in afternoon light" },
    {
      name: "Shot 17",
      from: l3a.from,
      view: "yard",
      cam: frameOn(960, 600, 1.0),
      push: { to: frameOn(STEP.x - 30, 700, 2.15), a: chupchap - 8, b: chupchap + 70 },
      note: "one slow push to Balak on 'চুপচাপ ভাব'",
    },
    { name: "Shot 18", from: l3b.from - 6, view: "yard", cam: frameOn(SUREN.x + 80, 720, 2.6), note: "close on Surendra calling across the yard" },
    { name: "Shot 18 · reaction", from: khali - 2, view: "yard", cam: frameOn(STEP.x - 10, 728, 2.3), note: "Balak's eyes lower" },
    { name: "Shot 18 · he goes", from: standCut, view: "yard", cam: frameOn(980, 620, 1.08), note: "he turns and walks off along the veranda" },
    { name: "Shot 18 · the scolding", from: Math.max(l3c.from - 7, standCut + 12), view: "yard", cam: frameOn(STEP.x - 20, 700, 2.35), note: "close on Biru as the scolding is named" },
    {
      name: "Shot 19",
      from: maro - 8,
      view: "path",
      cam: frameOn(1560, 760, 1.15),
      push: { to: frameOn(1620, 770, 1.22), a: maro - 8, b: kola + 10 },
      note: "wide of the lane, Balak small, walking alone",
    },
    { name: "Shot 19 · alone", from: arEka - 7, view: "path", cam: frameOn(1680, 800, 1.7), note: "closer as the line says he grew quieter" },
    {
      name: "Shot 20a",
      from: kola - DIS / 2,
      view: "grove",
      dissolve: DIS,
      cam: { ...KACHARI.grove.cam, x: 120, y: 20, zoom: 1.0 },
      push: { to: { ...KACHARI.grove.cam, x: 170, y: 30, zoom: 1.06 }, a: kola - DIS / 2, b: debdaru + DIS },
      note: "(a) the banana grove",
    },
    {
      name: "Shot 20b",
      from: debdaru - DIS / 2,
      view: "field",
      dissolve: DIS,
      cam: frameOn(1130, 640, 1.1),
      push: { to: frameOn(1170, 646, 1.16), a: debdaru - DIS / 2, b: jam + DIS },
      note: "(b) the field's end under the big tree",
    },
    {
      name: "Shot 20c · P5",
      from: jam - DIS / 2,
      view: "river",
      dissolve: DIS,
      cam: frameOn(1000, 640, 1.06),
      push: { to: frameOn(RIVER_SEAT.x - 30, 760, 1.75), a: Math.max(ekaBose - 8, jam + 12), b: p5.to },
      note: "(c) the jam tree by the river; P5 holds",
    },
    { name: "Shot 21 · P6", from: l3e.from - 6, view: "yard", cam: frameOn(CHARU_VER.x + 20, 680, 2.6), note: "close on Charu over the thali" },
  ];

  /* ---------------------------------------------------------------- characters ---------------------------------------------------------------- */

  // Charu along the veranda with the kolshi, into the house (AG8 / 03a)
  const charuWalk: WalkOpts = {
    start: 6,
    dur: Math.max(120, Math.round(l3a.from + l3a.frames * 0.42) - 6),
    fromX: 1280,
    toX: DOOR_X,
    scale: K_VER,
    height: EP05R_CAST.charu.height,
    seed: EP05R_CAST.charu.seed,
    flip: false,
    stopIn: 14,
  };
  const charuInDoor = charuWalk.start + charuWalk.dur;
  const charuWalkOpacity = 1 - smooth((f - (charuInDoor - 10)) / 14);

  // Surendra comes into the yard from the left near the end of 03a (unseen in the push), then calls (03b)
  const surWalk: WalkOpts = {
    start: l3a.to - 92,
    dur: 86,
    fromX: SUREN.x - 640,
    toX: SUREN.x,
    scale: K_YARD,
    height: EP05R_CAST.surendra.height,
    seed: EP05R_CAST.surendra.seed,
    stopIn: 12,
  };
  const surSigh = sighCurve(l3b.to + 30, 24, 48, 4);
  const surActing = (fr: number): Partial<Pose> => {
    if (fr < surWalk.start + surWalk.dur) return walkPose(fr, surWalk);
    const scoldW = smooth((fr - (l3b.from - 8)) / 10) * (1 - smooth((fr - (l3b.to + 30)) / 20));
    // "এই বীরু!": near (left, -1) arm out, palm up, beckoning (the fingers curl twice)
    const beckon = smooth((fr - (l3b.from - 8)) / 11) * (1 - smooth((fr - (kajer - 6)) / 10));
    const curl = beckon * Math.max(0, Math.sin((fr - l3b.from) * 0.42));
    // "কাজের কথায় মন নেই—": fists to the hips
    const hips = smooth((fr - (kajer - 4)) / 9) * (1 - smooth((fr - (khali + 2)) / 8)) + 0.75 * smooth((fr - (l3b.to + 6)) / 14);
    // "খালি খেয়াল আর দুষ্টুমি!": the near hand flung up, then a slow head shake
    const thr = throwUpPulse(fr, khali + 2, 12);
    const shake = headShake(fr, khali + 24, 40, 0.22) + headShake(fr, l3b.to + 30, 50, 0.16);
    // he turns away after Balak goes (18b)
    const away = smooth((fr - (exitWalk.start + 20)) / 16);
    const p: Partial<Pose> = {
      bodyTurn: lerp(0.7, 0.2, away),
      ...(scoldW > 0.01 ? GESTURES6.scold : {}),
      lean: lerp(0, 5 + 2 * hips + 2 * beckon, scoldW) - 2 * away,
      headTurn: shake + 0.04 * Math.sin(fr * 0.031),
      headNod: lerp(0, -2, scoldW) + 3 * away,
      reach: -beckon,
      reachUp: 1 - 0.35 * curl,
      lHand: beckon > 0.3 ? (curl > 0.5 ? "relaxed" : "open") : thr > 0.2 ? "open" : "relaxed",
      hips: clamp(hips) * (1 - thr),
      throwUp: -thr,
      brow: scoldW > 0.01 ? -0.15 + 0.5 * thr : 0.1,
      smile: 0,
    };
    return p;
  };
  const surReach = (fr: number) => ({ x: SUREN.x + 66, y: SUREN.y - 252 - 7 * Math.max(0, Math.sin((fr - l3b.from) * 0.42)) });

  // Charu kneeling at the thali (03e + P6)
  const working = 1 - smooth((f - (l3e.from - 2)) / 10) * (1 - smooth((f - (notun - 8)) / 14));
  const charuSigh = sighCurve(l3e.from + 2, 22, 52, 4);
  const charuActing = (fr: number): Partial<Pose> => {
    const lk = smooth((fr - (l3e.from - 2)) / 10) * (1 - smooth((fr - (notun - 8)) / 14));
    return {
      kneel: 1,
      bodyTurn: 0.3,
      lean: 9 - 5 * lk,
      headNod: 6 - 7 * lk,
      headTurn: 0.06 + 0.26 * lk + headShake(fr, rokkhe, 30, 0.1),
      eyeX: 0.55 * lk,
      eyeY: 0.45 * (1 - lk),
      cupHands: 1 - 0.25 * lk,
      smile: 0.08 + 0.3 * smooth((fr - (l3e.from + 20)) / 20),
      brow: 0.25,
      browTilt: 0.35 * lk,
    };
  };
  const sift = (fr: number) => {
    const lk = smooth((fr - (l3e.from - 2)) / 10) * (1 - smooth((fr - (notun - 8)) / 14));
    return { x: THALI.x - 2 + 5 * Math.sin(fr * 0.32) * (1 - lk), y: THALI.y - 14 + 2.5 * Math.abs(Math.sin(fr * 0.32)) * (1 - lk) - 6 * lk };
  };

  /* ---------------------------------------------------------------- views ---------------------------------------------------------------- */

  const drawYard = (fr: number, cam: Cam) => {
    const balakSeated = fr < standCut;
    const lookUpPose = fr < l3b.from - 2;
    const toFather = smooth((fr - (l3b.from + 2)) / 10);
    const eyesDown = 0.8 * smooth((fr - (khali + 6)) / 22);
    const sm = 0.12 * (1 - smooth((fr - l3b.from) / 10));
    // the standing exit: face his father (flipped), turn front, then away to the right and walk
    const turnU = smooth((fr - turnA) / 14);
    const standFlip = turnU < 0.5;
    const yaw = standFlip ? lerp(0.75, 0, turnU * 2) : lerp(0, 1, (turnU - 0.5) * 2);
    const exitX = STAND.x + BALAK_STAND_S * walkD(exitWalk, fr);
    const charuMouth = roleMouth(SCENE_ID, "charu", fr);
    const surMouth = roleMouth(SCENE_ID, "surendra", fr);
    const surX = fr < surWalk.start + surWalk.dur ? walkTravel(fr, surWalk).bodyX : SUREN.x;
    const showCharuWalk = fr < charuInDoor + 6;
    const showCharuThali = fr >= l3e.from - 6;
    return (
      <>
        <PaintedPlate href="images/ghibli_ep06/ujanchar_veranda_back.png" />
        <GhibliLayer depth={1}>
          <GhibliCharFilterDefs f={fr} />
          <GhibliCloudShadows region={{ x: -240, y: 880, w: 2400, h: 340 }} lifeF={lf} speed={0.35} count={2} opacity={0.1} />
          <WashingLine lf={lf} />
          {/* Charu on the veranda with the kolshi, going in at the door */}
          {showCharuWalk && (
            <Ep05Person
              cast={EP05R_CAST.charu}
              f={fr}
              lifeF={lf}
              x={walkTravel(fr, charuWalk).bodyX}
              y={CHARU_VER.y}
              scale={K_VER}
              light={LIGHT}
              opacity={charuWalkOpacity}
              shadow={charuWalkOpacity > 0.5}
              props={{ kolshi: makeKolshiProp({ facing: -1 }) }}
              acting={(q) => ({ ...kolshiWalkPose(q, charuWalk), smile: 0.1 })}
              mouth={() => mouthFromRms(charuMouth, fr)}
            />
          )}
          {/* Charu kneeling at the thali (03e) */}
          {showCharuThali && (
            <>
              <Ep05Person
                cast={EP05R_CAST.charu}
                f={fr}
                lifeF={lf}
                x={CHARU_VER.x}
                y={CHARU_VER.y}
                scale={K_VER}
                light={LIGHT}
                sitStyle="kneel"
                acting={charuActing}
                reachAt={sift}
                sigh={charuSigh}
                mouth={() => mouthFromRms(charuMouth, fr)}
                talk={() => charuMouth}
              />
              {/* the thali lying on the floor in front of her knees (the top-down plate squashed into perspective) */}
              <ellipse cx={THALI.x + 2} cy={THALI.y + 3} rx={40} ry={9} fill="#3b2a1c" opacity={0.22} />
              <image href={staticFile("images/ghibli_ep06/prop_brass_thali.png")} x={THALI.x - 37} y={THALI.y - 13} width={74} height={26} preserveAspectRatio="none" />
              {/* rice grains hopping in the thali while she sifts */}
              {Array.from({ length: 14 }, (_, i) => {
                const gx = THALI.x - 20 + ((i * 37) % 40);
                const hop = working * Math.max(0, Math.sin(fr * 0.32 + i * 0.9)) * 3;
                return <ellipse key={i} cx={gx} cy={THALI.y - 4 - ((i * 13) % 6) - hop} rx={1.3} ry={0.8} fill="#fbf6e6" stroke="#8a7a5a" strokeWidth={0.3} />;
              })}
            </>
          )}
          {/* Balak */}
          {balakSeated ? (
            <Ep05SeatedBalak
              x={STEP.x}
              y={STEP.y}
              s={BALAK_SEAT_S}
              f={fr}
              lifeF={lf}
              flip
              pose={lookUpPose ? "lookUp" : "sitCross"}
              prevPose={lookUpPose ? undefined : "lookUp"}
              poseStart={lookUpPose ? 0 : l3b.from - 2}
              expression={fr < l3b.from ? "serene" : "thoughtful"}
              expressionStart={l3b.from}
              face={{ lookX: 0.35 * toFather * (1 - eyesDown), smile: sm, eyesDown }}
              sigh={sighCurve(khali + 26, 26, 46, 3)}
              zoom={cam.zoom}
            />
          ) : (
            fr < maro && (
              <Ep05StandingBalak
                x={exitX}
                y={STAND.y}
                s={BALAK_STAND_S}
                f={fr}
                lifeF={lf}
                flip={standFlip}
                yaw={yaw}
                pose="standScolded"
                expression="thoughtful"
                face={{ eyesDown: 0.6, smile: 0 }}
                legDrive={walkDrive(exitWalk, fr)}
                zoom={cam.zoom}
              />
            )
          )}
          {/* Surendra in the yard */}
          {fr >= surWalk.start && fr < maro && (
            <Ep05Person
              cast={EP05R_CAST.surendra}
              f={fr}
              lifeF={lf}
              x={surX}
              y={SUREN.y}
              scale={K_YARD}
              light={LIGHT}
              acting={surActing}
              reachAt={surReach}
              sigh={surSigh}
              mouth={() => mouthFromRms(surMouth, fr)}
              talk={() => surMouth}
            />
          )}
          {/* a hen pecking her way across the near yard (out of Charu's medium) */}
          {fr < l3e.from - 6 && <Hen
            x={1460}
            y={1000}
            s={K_YARD}
            lifeF={lf}
            variant={0}
            seed={5}
            path={[
              { f: 0, x: 1560, y: 1004 },
              { f: 150, x: 1420, y: 996 },
              { f: 420, x: 1300, y: 1008 },
              { f: 900, x: 1180, y: 1000 },
              { f: 1600, x: 1080, y: 1010 },
            ]}
          />}
          <GhibliGroundCover x={1540} y={846} w={140} lifeF={lf} s={0.8} preset="courtyard" part="all" />
          <GhibliGroundCover x={120} y={900} w={260} lifeF={lf} s={1} preset="garden" part="all" />
        </GhibliLayer>
        <GhibliLayer depth={1}>
          <GhibliBirdFlock f={fr} start={ag8.from + 4} dur={190} from={{ x: 2050, y: 150 }} to={{ x: 700, y: 70 }} count={5} s={0.55} lifeF={lf} />
          <GhibliAtmosphericHaze f={lf} intensity={0.55} seed={71} />
        </GhibliLayer>
        <GhibliGrade warmth={0.32} vignette={0.32} paperOpacity={0.2} bloomAt={[22, 14]} />
      </>
    );
  };

  const drawPath = (fr: number, cam: Cam) => {
    const D = walkD(laneWalk, fr);
    const s = EP05R_SCALE.standingBalak.s * K_LANE;
    const x = LANE.x0 + s * D;
    const h = 265 * K_LANE;
    const stepPh = Math.sin(((fr - laneWalk.start) / laneWalk.stepF) * Math.PI);
    // the leaf: blown across the lane on a gust, tumbling, settling
    const leafU = clamp((fr - (maro + 20)) / 120);
    const leafX = lerp(-120, 1500, EASE.out(leafU));
    const leafY = 1004 + 30 * leafU - 26 * Math.abs(Math.sin(leafU * 9)) * (1 - leafU);
    return (
      <>
        <PaintedPlate href="images/ghibli_ep06/village_lane_back.png" />
        <GhibliLayer depth={1}>
          <GhibliCharFilterDefs f={fr} />
          <GhibliCloudShadows region={{ x: -240, y: 840, w: 2400, h: 380 }} lifeF={lf} speed={0.4} count={2} opacity={0.12} />
          <LongShadow x={x} y={LANE.y} h={h} step={2 * stepPh} />
          <Ep05StandingBalak
            x={x}
            y={LANE.y}
            s={s}
            f={fr}
            lifeF={lf}
            pose="standQuiet"
            expression="thoughtful"
            face={{ eyesDown: 0.45, smile: 0.04 }}
            legDrive={walkDrive(laneWalk, fr)}
            zoom={cam.zoom}
          />
          {leafU > 0 && leafU < 1 && <Ep05MangoLeaf x={leafX} y={leafY} s={0.9} rot={leafU * 900} twirl={leafU * 5} />}
          <GhibliGroundCover x={1250} y={1060} w={260} lifeF={lf} s={1.1} preset="garden" part="all" />
          <GhibliGroundCover x={1960} y={1004} w={220} lifeF={lf} s={1} preset="garden" part="all" />
        </GhibliLayer>
        <GhibliLayer depth={1}>
          <GhibliAtmosphericHaze f={lf} intensity={0.7} seed={73} />
        </GhibliLayer>
        <GhibliGrade warmth={0.34} vignette={0.36} paperOpacity={0.2} bloomAt={[18, 12]} />
      </>
    );
  };

  const drawGrove = (fr: number, rawCam: Cam) => {
    const cam = kachariKeepInSet("grove", { ...rawCam, focus: 1, dof: zoomProportionalDof(rawCam.zoom) });
    const B = GROVE_SEAT;
    return (
      <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.grove, overflow: "hidden" }}>
        <GhibliStage cam={cam} background={KACHARI_BG.grove}>
          <GhibliKachariBackdrop view="grove" f={lf} cam={cam} doorOpen={0} />
          <GhibliKachariFloorLayer view="grove" f={lf} />
          <GhibliLayer depth={1}>
            <GhibliCharFilterDefs f={fr} dapple />
            <GhibliDappledLight region={{ x: B.x - 260, y: B.y - 40, w: 520, h: 90 }} lifeF={lf} intensity={0.4} squash={0.4} />
            <Ep05SeatedBalak
              x={B.x}
              y={B.y}
              s={B.s}
              f={fr}
              lifeF={lf}
              flip
              pose="sitCross"
              expression="serene"
              face={{ eyesDown: 0.35, smile: 0.1 }}
              zoom={cam.zoom}
            />
            <GhibliGroundCover x={B.x} y={B.y + 4} w={300} lifeF={lf} s={1} preset="grove" part="front" />
          </GhibliLayer>
          <GhibliKachariForegroundAndGrade view="grove" f={lf} zoom={cam.zoom} />
        </GhibliStage>
      </div>
    );
  };

  const drawField = (fr: number, cam: Cam) => (
    <>
      <PaintedPlate href="images/ghibli_ep06/village_field_edge_back.png" />
      <GhibliLayer depth={1}>
        <ChilBird lf={lf} cx={760} cy={250} rx={170} ry={46} s={0.75} />
        <GhibliCloudShadows region={{ x: -240, y: 700, w: 2400, h: 520 }} lifeF={lf} speed={0.55} count={3} opacity={0.14} />
      </GhibliLayer>
      <GhibliLayer depth={1}>
        <GhibliCharFilterDefs f={fr} dapple />
        <GhibliCutout file="images/ghibli_ep05/tree_debdaru_sketch.png" anchor={DEBDARU} x={FIELD_TREE.x} y={FIELD_TREE.y} targetHeight={FIELD_TREE.h} />
        <GhibliDappledLight region={{ x: FIELD_TREE.x - 330, y: FIELD_TREE.y - 26, w: 640, h: 70 }} lifeF={lf} intensity={0.45} squash={0.35} />
        <GhibliGroundCover x={FIELD_TREE.x + 30} y={FIELD_TREE.y + 2} w={420} lifeF={lf} s={0.7} preset="garden" part="back" />
        <Ep05SeatedBalak x={FIELD_SEAT.x} y={FIELD_SEAT.y} s={FIELD_SEAT.s} f={fr} lifeF={lf} flip pose="sitCross" expression="serene" face={{ eyesDown: 0.25, smile: 0.08 }} zoom={cam.zoom} />
        <GhibliGroundCover x={FIELD_SEAT.x} y={FIELD_SEAT.y + 4} w={180} lifeF={lf} s={0.6} preset="garden" part="front" />
        {/* the field's grass in the near ground, waving */}
        <GhibliGroundCover x={300} y={1010} w={700} lifeF={lf} s={1.5} preset="garden" litter={false} />
        <GhibliGroundCover x={1560} y={1040} w={800} lifeF={lf} s={1.6} preset="garden" litter={false} />
      </GhibliLayer>
      <GhibliLayer depth={1}>
        <GhibliAtmosphericHaze f={lf} intensity={0.75} seed={79} />
      </GhibliLayer>
      <GhibliGrade warmth={0.3} vignette={0.34} paperOpacity={0.2} bloomAt={[20, 14]} />
    </>
  );

  const drawRiver = (fr: number, cam: Cam) => (
    <>
      {/* the Padma card re-graded from sunset to afternoon gold: magenta pulled toward amber, a little desaturated */}
      <GhibliLayer depth={1}>
        <defs>
          <filter id="s03-afternoon" colorInterpolationFilters="sRGB">
            <feColorMatrix type="hueRotate" values="10" />
            <feColorMatrix type="saturate" values="0.55" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.0" intercept="0.03" />
              <feFuncG type="linear" slope="1.0" intercept="0.02" />
              <feFuncB type="linear" slope="0.94" intercept="0.0" />
            </feComponentTransfer>
          </filter>
          <linearGradient id="s03-bank-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0} />
            <stop offset="0.16" stopColor="#fff" stopOpacity={1} />
            <stop offset="1" stopColor="#fff" stopOpacity={1} />
          </linearGradient>
          <mask id="s03-bank-mask" maskContentUnits="userSpaceOnUse">
            <rect x={-240} y={826} width={2400} height={440} fill="url(#s03-bank-fade)" />
          </mask>
        </defs>
        <image
          href={staticFile("images/ghibli_ep05/card_outro_padma_sketch.png")}
          x={PLATE_RECT.x}
          y={PLATE_RECT.y}
          width={PLATE_RECT.w}
          height={PLATE_RECT.h}
          preserveAspectRatio="xMidYMid slice"
          filter="url(#s03-afternoon)"
        />
        <RiverGlints lf={lf} x0={-100} x1={2000} y0={640} y1={840} />
        <SailBoat x={760 - lf * 0.12} y={668} s={0.62} lf={lf} />
        <ChilBird lf={lf} cx={540} cy={200} rx={120} ry={30} s={0.5} period={380} phase={1.4} />
      </GhibliLayer>
      <GhibliLayer depth={1}>
        <GhibliCharFilterDefs f={fr} dapple />
        {/* the near bank, feathered into the water (no hard seam), a damp edge and reeds along it */}
        <path d="M -240 842 Q 400 836 960 846 T 2160 840 L 2160 862 L -240 862 Z" fill="#8a7650" opacity={0.28} />
        <image href={staticFile("images/ghibli_ep05/grove_floor_sketch.png")} x={-240} y={826} width={2400} height={440} preserveAspectRatio="none" mask="url(#s03-bank-mask)" />
        {/* the kingfisher's stake at the water's edge */}
        <path d={`M ${KF_PERCH.x + 2} ${KF_PERCH.y + 2} L ${KF_PERCH.x + 6} ${KF_PERCH.y + 92}`} stroke="#5a4028" strokeWidth={4} strokeLinecap="round" />
        <PondKingfisher f={fr} lifeF={lf} perch={KF_PERCH} target={KF_TARGET} diveAt={p5.from + 2} s={0.9} />
        <GhibliCutout file="images/ghibli_ep05/tree_jamun_sketch.png" anchor={JAMUN} x={RIVER_TREE.x} y={RIVER_TREE.y} targetHeight={RIVER_TREE.h} />
        <GhibliDappledLight region={{ x: RIVER_SEAT.x - 260, y: RIVER_SEAT.y - 30, w: 620, h: 80 }} lifeF={lf} intensity={0.5} squash={0.38} />
        <FallenJamun x={RIVER_SEAT.x - 92} y={RIVER_SEAT.y + 10} />
        <FallenJamun x={RIVER_SEAT.x + 120} y={RIVER_SEAT.y + 18} s={0.9} />
        <Ep05SeatedBalak x={RIVER_SEAT.x} y={RIVER_SEAT.y} s={RIVER_SEAT.s} f={fr} lifeF={lf} flip pose="sitCross" expression="serene" face={{ eyesDown: 0.15, smile: 0.12 }} zoom={cam.zoom} />
        <GhibliGroundCover x={RIVER_SEAT.x + 40} y={RIVER_SEAT.y + 6} w={360} lifeF={lf} s={0.9} preset="pond" part="front" />
        <GhibliGroundCover x={200} y={852} w={760} lifeF={lf} s={0.9} preset="pond" litter={false} />
        <GhibliGroundCover x={980} y={856} w={420} lifeF={lf} s={0.8} preset="pond" litter={false} />
        <GhibliGroundCover x={1900} y={852} w={420} lifeF={lf} s={0.9} preset="pond" litter={false} />
      </GhibliLayer>
      <GhibliLayer depth={1}>
        <GhibliAtmosphericHaze f={lf} intensity={0.6} seed={83} />
      </GhibliLayer>
      <GhibliGrade warmth={0.36} vignette={0.36} paperOpacity={0.2} bloomAt={[30, 30]} />
    </>
  );

  const drawShot = (shot: Shot3, fr: number) => {
    const raw = camAt(fr, shot);
    if (shot.view === "grove") return drawGrove(fr, raw);
    const cam = plateKeep({ ...raw, focus: 1, dof: 0 }, PLATE_RECT);
    const body =
      shot.view === "yard" ? drawYard(fr, cam) : shot.view === "path" ? drawPath(fr, cam) : shot.view === "field" ? drawField(fr, cam) : drawRiver(fr, cam);
    return (
      <AbsoluteFill style={{ background: "#e6cfa4", overflow: "hidden" }}>
        <GhibliStage cam={cam} background="#e6cfa4">
          <GhibliPreload files={PRELOAD} />
          {body}
        </GhibliStage>
        {(shot.view === "yard" || shot.view === "path") && <WarmWash amount={0.08} />}
      </AbsoluteFill>
    );
  };

  const shot = shotAt(f, SHOTS) as Shot3;
  const idx = SHOTS.indexOf(shot);
  const prev = idx > 0 ? SHOTS[idx - 1] : null;
  const dis = shot.dissolve ?? 0;
  const mix = dis > 0 && prev ? ramp(f, shot.from, shot.from + dis) : 1;

  return (
    <AbsoluteFill style={{ background: "#e6cfa4", overflow: "hidden" }}>
      {mix < 1 && prev && <AbsoluteFill>{drawShot(prev, f)}</AbsoluteFill>}
      <AbsoluteFill style={{ opacity: mix }}>{drawShot(shot, f)}</AbsoluteFill>
      <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} />
    </AbsoluteFill>
  );
};
