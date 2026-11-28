import React from "react";
import { staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, lerp, noise1, track } from "../../../cinematic/core/anim";
import type { Cam } from "../../../cinematic/core/Stage";
import { Crow, Hen, Sparrow } from "../../../cinematic/life/VillageLife";
import { MOUTH_REST, type MouthState } from "../../../cinematic/rig/lipsync";
import { headNods, type Pose, throwUpPulse, walkPose, walkTravel, type WalkOpts } from "../../../cinematic/rig/Puppet";
import { seatedChildHands, type SeatedChildProps } from "../../../episode03/rig/SeatedChild";
import type { StandingChildProps } from "../../../episode05/rig/StandingChild";
import { GhibliCutout, GhibliGrade, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { withGhibliActing } from "../../core/ghibliActing";
import { GhibliBirdFlock, GhibliCloudShadows } from "../../core/GhibliLifeKit";
import { zoomProportionalDof } from "../../core/ghibliMotion";
import {
  GhibliKachariBackdrop,
  GhibliKachariFloorLayer,
  GhibliKachariForegroundAndGrade,
  GhibliTippedBasket,
  KACHARI,
  KACHARI_BG,
  kachariKeepInSet,
} from "../../episode05/GhibliKachariSet";
import { mouthFromRms } from "../../episode04/Ep04GhibliShared";
import { EP05R_CAST, EP05R_GESTURES, EP05R_LIGHT, EP05R_SCALE, Ep05Person, Ep05SeatedBalak, Ep05StandingBalak, ep05SeatedProps } from "../Ep05RewriteCast";
import { Ep05MangoLeaf, Ep05PalmFan, Ep05Tortoise, makePalmFanInHand } from "../Ep05RewriteProps";
import { useS01VerandaMarks } from "../layoutMarks";
import { ep05rPhraseLocal } from "../subtitles";
import { ep05rScene } from "../timing";
import { camAt, CuDetailScreen, cuDetailActive, FigureDefs, frameOn, PLATE_RECT, PaintedPlate, plateKeep, ramp, roleMouth, type Shot, shotAt, SkeletonTag, span } from "./RewriteKit";

/**
 * Scene 01 `01_kachari_chat_and_slip` (blueprint section 5; book chapter 8, first lines). Late morning.
 * Beats: AG1 (world open) · 01a · 01b · 01c + P1 · AG2 (the slip) · 01d + P2 · AG3 · 01e (Binoy off-screen) · 01f ·
 * 01g · AG4 (the run). Every key is tied to a generated span or a caption phrase (never a raw frame number).
 *
 * SETS (stand-ins, no new paintings): AG1 on the Ghibli kachari compound (clerk at his desk dipping the pen, the tipped
 * basket and three tortoises small by the corner room, a hen pecking, pigeons lifting off the kachari roof) with the
 * motivated truck right toward the family's house; the cut to the veranda (ep06 `ujanchar_veranda_back`, Episode 4
 * madur) keeps the move going (a short matching drift right that settles). The two veranda posts nearest the family are
 * redrawn from the plate after the figures (POST_OCCLUDERS), so the mat and Balak pass BEHIND them.
 *
 * GEOGRAPHY: the neighbour's house (Binoy, the corner room) is to the LEFT of the family's veranda (AG1 trucks right
 * from it to the family's house). So Balak slips out to the left, Binoy's shout comes from the left, both parents'
 * heads turn left and they run out left (the skeleton ran them right: changed for continuity with AG1 and scene 02).
 *
 * BLOCKING: Charu kneels on the mat (left, turned to her husband) winnowing rice in a kula on her lap (both hands on the
 * rim, little tosses; she rests it to wag a finger at Balak, sets it on the floor at the alarm). Surendra sits
 * cross-legged (right, turned to her) fanning himself with a palm fan (stops dead at the shout; he drops it on the mat as
 * he gets up). Balak sits at Charu's back facing the yard, twirling a mango leaf, restless (watches a sparrow, a hen).
 * AG2: he comes up on his knees, the leaf drops, he stands (kneel-to-stand drive, feet planted), and tiptoes off left
 * (foot-locked legDrive steps up on his toes) with one look back over his shoulder, behind the left post and out of
 * frame, before "কখন যে বীরু টুক করে বেরিয়ে গেছে". The parents chat on (silent walla mouths) and laugh in AG3.
 * 01e: they freeze, heads snap left, the hens scatter, the crow lifts off. 01f: Charu's close-up, she sets the kula
 * down, her eyes find the empty spot and the leaf, hand to her mouth. 01g: Surendra springs up and points next door;
 * Charu rises; AG4 both run out left (walkPose run: planted strides, her sari hem lifts by itself), the camera pans with
 * them.
 *
 * CAMERA (CAM-13): AG1 held wide + truck right; Shot 1 medium wide (match drift), push toward Balak on
 * "আর ছোট্ট বীরু?"; Shot 2 two-shot cut 6 f before 01b, held through 01c, P1, AG2 (deep staging) and 01d with a
 * soft rack (the parents go soft, the empty spot and the leaf stay sharp) on "কখন যে বীরু", through P2; AG3 held wide;
 * Shot 5 cut on the shout to a medium of both; Shot 6 close-up Charu 6 f before 01f; Shot 7 medium Surendra rising; AG4
 * a pan left with the run.
 */

const SCENE_ID = "01_kachari_chat_and_slip";

const PRELOAD = [
  "images/ghibli_ep06/ujanchar_veranda_back.png",
  "images/ghibli_ep04/madur_mat_veranda_sketch.png",
  "images/ghibli_ep05r/cu/s01_shot2_charu.png",
  "images/ghibli_ep05r/cu/s01_shot3_suren.png",
  "images/ghibli_ep05r/cu/s01_shot6_charu_cu.png",
  "images/ghibli_ep05r/cu/s01_shot7_suren.png",
] as const;
const PLATE = "images/ghibli_ep06/ujanchar_veranda_back.png";

/* ------------------------------------------------------------------ */
/* Layout (world px on the plate drawn at PLATE_RECT)                   */
/* ------------------------------------------------------------------ */

const K = 0.78; // adult Puppet scale on the veranda floor
const SEAT_S = EP05R_SCALE.seatedBalak.s * K;
const STAND_S = EP05R_SCALE.standingBalak.s * K;
// Kept-house plate: marks live in public/ep05r_layout/s01_veranda.json (Ep05RLayoutEditor).
// Left post x 312, the next post x 749, the door opens around x 885. Binoy's house is off left.

/** Veranda posts redrawn over the figures (rects on the plate, world px). */
const POST_OCCLUDERS = [
  { x: 298, y: 520, w: 28, h: 380 },
  { x: 736, y: 530, w: 26, h: 370 },
];

/** Exact-match CU plates (bake_ep05r_cu_plates.py) — full-bleed screen swaps for soft zooms. */
const S01_CU_DETAILS: Array<{ match: (name: string) => boolean; href: string; zoom: number }> = [
  { match: (n) => n.startsWith("Shot 2"), href: "images/ghibli_ep05r/cu/s01_shot2_charu.png", zoom: 2.7 },
  { match: (n) => n.startsWith("Shot 3"), href: "images/ghibli_ep05r/cu/s01_shot3_suren.png", zoom: 2.6 },
  { match: (n) => n.startsWith("Shot 6"), href: "images/ghibli_ep05r/cu/s01_shot6_charu_cu.png", zoom: 3.0 },
  { match: (n) => n.startsWith("Shot 7"), href: "images/ghibli_ep05r/cu/s01_shot7_suren.png", zoom: 2.55 },
];

const VERANDA_WIDE: Cam = frameOn(860, 682, 1.0);

/* ------------------------------------------------------------------ */
/* Small helpers                                                        */
/* ------------------------------------------------------------------ */

const smooth = (u: number) => {
  const t = clamp(u);
  return t * t * (3 - 2 * t);
};

/** A kula (bamboo winnowing tray) with rice, seen from the front a little above: (x, y) its centre. */
const Kula: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={44} ry={8} fill="#3a2208" opacity={0.18} />
    <path d="M -46 -2 Q -44 10 0 12 Q 44 10 46 -2 Q 40 -12 0 -13 Q -40 -12 -46 -2 Z" fill="#c9a25c" stroke="#3A2618" strokeWidth={1.1} />
    <path d="M -40 -3 Q 0 -10 40 -3 Q 30 6 0 7 Q -30 6 -40 -3 Z" fill="#e2c07a" />
    {[-30, -18, -6, 6, 18, 30].map((dx) => (
      <path key={dx} d={`M ${dx} -10 Q ${dx * 1.04} 0 ${dx * 0.98} 10`} stroke="#9c7a3c" strokeWidth={0.5} opacity={0.6} fill="none" />
    ))}
    {Array.from({ length: 22 }, (_, i) => (
      <ellipse key={i} cx={-24 + ((i * 37) % 48)} cy={-4 + ((i * 13) % 9)} rx={1.4} ry={0.8} fill="#fbf4e0" opacity={0.95} />
    ))}
    <path d="M -46 -2 Q -40 -12 0 -13 Q 40 -12 46 -2" stroke="#7a5426" strokeWidth={2.2} fill="none" />
  </g>
);

/** Fake chatting mouth (walla: the sound pass lays the murmur), 0 outside the given windows. */
const chatRms = (fr: number, windows: ReadonlyArray<readonly [number, number]>, seed: number): number => {
  for (const [a, b] of windows) {
    if (fr >= a && fr < b) {
      const env = smooth((fr - a) / 4) * smooth((b - fr) / 4);
      return env * (0.16 + 0.18 * Math.abs(Math.sin(fr * 0.66 + seed)) * (0.6 + 0.4 * noise1(fr * 0.1, seed)));
    }
  }
  return 0;
};

/** A silent open-mouthed laugh. */
const laughMouth = (fr: number, k: number): MouthState =>
  k <= 0.01 ? MOUTH_REST : { open: k * (0.26 + 0.12 * Math.abs(Math.sin(fr * 0.85))), width: 1 + 0.22 * k, round: 0.08, teeth: 0.6 * k };

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene01RewriteKachariChat: React.FC = () => {
  const f = useCurrentFrame();
  const marks = useS01VerandaMarks();
  const PORCH = marks.porch;
  const CHARU = marks.charu;
  const SUREN = marks.suren;
  const BALAK = marks.balak;
  const MAT = marks.mat;
  const NEXT_DOOR = marks.nextDoor;
  const PORCH_EXIT = marks.porchExit;
  const PORCH_EDGE = PORCH - 6;
  const LEAF_REST = { x: BALAK.x + 36, y: PORCH + 6 };
  const FAN_REST = { x: SUREN.x + 48, y: PORCH + 8 };
  const dur = ep05rScene(SCENE_ID).durationFrames;
  const ag1 = span(SCENE_ID, "AG1_world_open");
  const l1a = span(SCENE_ID, "01a_Narrator_Kachari.wav");
  const l1b = span(SCENE_ID, "01b_Charu_EyeOnHim.wav");
  const l1c = span(SCENE_ID, "01c_Surendra_Chuckle.wav");
  const p1 = span(SCENE_ID, "P1");
  const ag2 = span(SCENE_ID, "AG2_the_slip");
  const l1d = span(SCENE_ID, "01d_Narrator_Slip.wav");
  const p2 = span(SCENE_ID, "P2");
  const ag3 = span(SCENE_ID, "AG3_time_passes");
  const l1e = span(SCENE_ID, "01e_Binoy_Shout.wav");
  const l1f = span(SCENE_ID, "01f_Charu_Alarm.wav");
  const l1g = span(SCENE_ID, "01g_Surendra_Run.wav");
  const ag4 = span(SCENE_ID, "AG4_the_run");

  // caption phrases (CAM-13 keys and gesture cues)
  const chotto = ep05rPhraseLocal(SCENE_ID, "আর ছোট্ট বীরু", l1a.from + Math.round(l1a.frames * 0.53));
  const surenBabu = ep05rPhraseLocal(SCENE_ID, "বীরুর বাবা সুরেনবাবু", l1a.from + 58);
  const dushtu = ep05rPhraseLocal(SCENE_ID, "সে এখন বেশ", l1a.from + 184);
  const ajkal = ep05rPhraseLocal(SCENE_ID, "আজকাল ওকে", l1b.from);
  const fak = ep05rPhraseLocal(SCENE_ID, "একটু ফাঁক", l1b.from + 116);
  const tuk = ep05rPhraseLocal(SCENE_ID, "টুক করে বেরিয়ে যায়", l1b.from + 190);
  const chokhe = ep05rPhraseLocal(SCENE_ID, "তবে তো ওকে", l1c.from + 62);
  const kokhon = ep05rPhraseLocal(SCENE_ID, "কখন যে বীরু", l1d.from + 108);
  const keu = ep05rPhraseLocal(SCENE_ID, "কেউ টেরই", l1d.from + 198);
  const biru = ep05rPhraseLocal(SCENE_ID, "বীরু... বীরু", l1f.from + 55);
  const cholo = ep05rPhraseLocal(SCENE_ID, "চলো, শিগগির", l1g.from + 26);

  /* ---------------- camera (Y keyed off porch sit marks so CUs track the brick) ---------------- */
  const SHOT2 = l1b.from - 6;
  const SHOT6 = l1f.from - 6;
  const headY = (footY: number, zoom: number) => footY - Math.round(148 / Math.max(1, zoom * 0.55));
  const CHARU_CU: Cam = frameOn(CHARU.x + 18, headY(CHARU.y, 3.0), 3.0);
  const SHOTS: Shot[] = [
    {
      name: "AG1",
      from: 0,
      view: "compound",
      cam: { ...KACHARI.compound.cam, x: -90 },
      push: { to: { ...KACHARI.compound.cam, x: 70 }, a: Math.round(ag1.frames * 0.22), b: ag1.to - 12 },
      note: "held wide, then a slow truck that eases out before the cut",
    },
    {
      name: "Shot 1",
      from: l1a.from,
      view: "veranda",
      cam: { ...VERANDA_WIDE, x: VERANDA_WIDE.x - 22, y: VERANDA_WIDE.y + (PORCH - 858) * 0.35 },
      push: { to: { ...VERANDA_WIDE, y: VERANDA_WIDE.y + (PORCH - 858) * 0.35 }, a: l1a.from, b: l1a.from + 36 },
      note: "medium wide, the truck settles",
    },
    {
      name: "Shot 1 push",
      from: chotto - 4,
      view: "veranda",
      cam: { ...VERANDA_WIDE, y: VERANDA_WIDE.y + (PORCH - 858) * 0.35 },
      push: { to: frameOn(640, headY(PORCH, 1.32), 1.32), a: chotto - 4, b: chotto + 44 },
      note: "push toward Balak on 'আর ছোট্ট বীরু?'",
    },
    { name: "Shot 2 · Charu", from: SHOT2, view: "veranda", cam: frameOn(CHARU.x + 8, headY(CHARU.y, 2.7), 2.7), note: "close on Ma as she starts" },
    { name: "Shot 3 · Surendra", from: l1c.from - 7, view: "veranda", cam: frameOn(SUREN.x, headY(SUREN.y, 2.6), 2.6), note: "close on Baba" },
    { name: "P1", from: p1.from - 4, view: "veranda", cam: frameOn(640, headY(PORCH, 1.75), 1.75), note: "two-shot while they laugh, backs to Biru" },
    { name: "AG2 · the slip", from: ag2.from, view: "veranda", cam: frameOn(BALAK.x, headY(BALAK.y, 1.9), 1.9), note: "on Biru as he rises and slips along the porch" },
    { name: "Shot 4 · P2", from: l1d.from - 6, view: "veranda", cam: frameOn(MAT.x, headY(PORCH, 1.6), 1.6), note: "the empty mat and the leaf" },
    { name: "AG3", from: ag3.from, view: "veranda", cam: { ...VERANDA_WIDE, y: VERANDA_WIDE.y + (PORCH - 858) * 0.35 }, note: "held wide, time passes" },
    { name: "Shot 5", from: l1e.from, view: "veranda", cam: frameOn(640, headY(PORCH, 2.35), 2.35), note: "cut on the shout: heads snap left" },
    { name: "Shot 6", from: SHOT6, view: "veranda", cam: CHARU_CU, note: "close-up Charu" },
    { name: "Shot 7", from: l1g.from - 4, view: "veranda", cam: frameOn(SUREN.x, headY(SUREN.y, 2.55), 2.55), note: "close on Surendra rising" },
    {
      name: "AG4",
      from: ag4.from - 6,
      view: "veranda",
      cam: frameOn(800, headY(PORCH, 1.4), 1.4),
      push: { to: frameOn(470, headY(PORCH, 1.4), 1.4), a: ag4.from - 2, b: dur },
      note: "pan left with the run (stay on porch planks)",
    },
  ];
  const shot = shotAt(f, SHOTS);
  const raw = camAt(f, shot);

  /* ================================================================ */
  /* AG1: the kachari compound                                         */
  /* ================================================================ */
  if (shot.view === "compound") {
    const cam = kachariKeepInSet("compound", { ...raw, focus: 0.65, dof: zoomProportionalDof(raw.zoom) });
    const C = KACHARI.compound;
    // the clerk dips his reed pen and writes (life clock = scene frame)
    const dip = 0.5 - 0.5 * Math.cos((f / 34) * Math.PI * 2);
    const clerk = (
      <Ep05Person
        cast={EP05R_CAST.seniorClerk}
        f={f}
        lifeF={f}
        x={C.clerk.x}
        y={C.clerk.y}
        scale={C.clerk.s ?? 0.26}
        seated
        sitStyle="crossLegged"
        light={EP05R_LIGHT.lateMorning}
        shadow={false}
        acting={() => ({ ...EP05R_GESTURES.seniorClerkWrite, rS: 34 - 10 * dip, rE: 78 + 14 * dip, headNod: 7 + 2 * dip })}
      />
    );
    const yard = null;
    const nearTortoises = (
      <g>
        <GhibliTippedBasket x={1180} y={948} s={0.55} />
        {C.tortoises.slice(0, 3).map((t, i) => (
          <Ep05Tortoise key={i} x={1080 + i * 110} y={930 + (i === 1 ? 14 : 0)} s={0.85} lifeF={f + i * 37} seed={11 + i} view="side" flip={i === 1} neck={0.6 + 0.4 * Math.sin(f * 0.03 + i)} />
        ))}
      </g>
    );
    return (
      <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.compound, overflow: "hidden" }}>
        <GhibliStage cam={cam} background={KACHARI_BG.compound}>
          <GhibliKachariBackdrop view="compound" f={f} cam={cam} veranda={clerk} yard={yard} basket={false} />
          <GhibliLayer depth={0.65}>
            {/* pigeons lift off the kachari roof */}
            <GhibliBirdFlock f={f} start={ag1.from + 14} dur={72} from={{ x: 120, y: 470 }} to={{ x: 760, y: 150 }} count={6} s={0.7} lifeF={f} />
          </GhibliLayer>
          <GhibliKachariFloorLayer view="compound" f={f}>
            {nearTortoises}
            <Hen x={460} y={918} s={0.55} lifeF={f} seed={3} variant={0} autoPeck autoCluck={false} />
            <Hen x={610} y={940} s={0.58} lifeF={f + 40} seed={9} variant={2} flip autoPeck autoCluck={false} />
          </GhibliKachariFloorLayer>
          <GhibliKachariForegroundAndGrade view="compound" f={f} zoom={cam.zoom} />
        </GhibliStage>
        <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} />
      </div>
    );
  }

  /* ================================================================ */
  /* The veranda                                                        */
  /* ================================================================ */
  // the soft rack on "কখন যে বীরু" (Shot 4): the parents go soft, the empty spot and the leaf stay sharp (until AG3's cut)
  const rack = f < ag3.from ? ramp(f, kokhon - 6, kokhon + 12) : 0;
  const cam = plateKeep({ ...raw, focus: 1, dof: 0 }, PLATE_RECT);

  /* ---------------- Balak's timeline ---------------- */
  const KNEEL_UP = { a: ag2.from + 2, b: ag2.from + 16 };
  const LEAF_DROP = { a: ag2.from + 9, b: ag2.from + 18 };
  const SWAP = ag2.from + 16;
  const RISE = { a: SWAP, b: SWAP + 22 };
  const WALK0 = RISE.b + 2;
  const STEP_T = 6;
  const SWING = 4;
  const STRIDE = 128;
  const NSTEP = 16;
  const LOOK_AFTER = 4;
  const LOOK_HOLD = 8;
  const stepT0 = (k: number) => WALK0 + k * STEP_T + (k >= LOOK_AFTER ? LOOK_HOLD : 0);
  const LOOK = { a: stepT0(LOOK_AFTER) - LOOK_HOLD - 2, b: stepT0(LOOK_AFTER) + 2 };
  const walkD = (fr: number): number => {
    let d = 0;
    for (let k = 0; k < NSTEP; k++) {
      const t0 = stepT0(k);
      if (fr < t0) break;
      if (fr < t0 + SWING) return k * STRIDE + smooth((fr - t0) / SWING) * STRIDE;
      d = (k + 1) * STRIDE;
    }
    return d;
  };
  const TIPTOE = 0.2; // heel up on the planted feet
  const footAt = (fr: number, near: boolean): { d: number; lift: number; pitch: number } => {
    let plant = 0;
    for (let k = near ? 0 : 1; k < NSTEP; k += 2) {
      const t0 = stepT0(k);
      if (fr < t0) break;
      const land = (k + 1) * STRIDE;
      if (fr < t0 + SWING) {
        const u = (fr - t0) / SWING;
        const e = smooth(u);
        return { d: lerp(plant, land, e), lift: 7 * Math.sin(Math.PI * u) + 1.5 * (1 - e), pitch: TIPTOE + 0.12 * Math.sin(Math.PI * u) };
      }
      plant = land;
    }
    return { d: plant, lift: 0, pitch: TIPTOE * clamp((fr - (WALK0 - 6)) / 6) };
  };
  const CA = Math.cos((55 * Math.PI) / 180);
  const SA = Math.sin((55 * Math.PI) / 180);
  const balakStandX = (fr: number) => BALAK.x - STAND_S * walkD(fr);
  const seatedPhase = f < SWAP;
  const standingVisible = !seatedPhase && balakStandX(f) > PORCH_EXIT;

  // seated: twirling the leaf (01a), glancing at the sparrow and the hen, restless in 01c / P1
  const leafInHand = f < LEAF_DROP.a;
  const nearLift = track(f, [
    [0, 1],
    [l1c.from + 20, 1],
    [l1c.from + 40, 0.35, "inOut"],
    [l1c.to - 30, 0.35],
    [l1c.to - 10, 1, "inOut"],
    [KNEEL_UP.a, 1],
    [KNEEL_UP.b, 0.15, "inOut"],
  ]);
  const twirl = (f * 0.035) % 1;
  const seatedLook = track(f, [
    [l1a.from, 0.1],
    [chotto - 10, 0.15],
    [chotto + 2, 0.55, "inOut"], // to the sparrow
    [chotto + 60, 0.55],
    [chotto + 76, 0.05, "inOut"], // back to his leaf
    [l1b.from + 30, 0.05],
    [l1b.from + 46, 0.6, "inOut"], // the hen on the edge
    [l1b.to - 30, 0.6],
    [l1b.to - 12, -0.45, "inOut"], // over his shoulder at his parents
    [l1c.from + 30, -0.45],
    [l1c.from + 46, 0.55, "inOut"], // out to the yard
    [p1.from + 6, 0.55],
    [p1.from + 14, -0.5, "inOut"], // they are laughing, backs to him
    [p1.to - 6, -0.5],
    [ag2.from - 2, 0.6, "inOut"], // decided
  ]);
  const seatedProps: SeatedChildProps = ep05SeatedProps({
    x: BALAK.x,
    y: BALAK.y,
    s: SEAT_S,
    f,
    lifeF: f,
    flip: true,
    pose: "handsTo",
    poseStart: 0,
    kneel: 2 * smooth((f - KNEEL_UP.a) / (KNEEL_UP.b - KNEEL_UP.a)),
    handTargets: { near: { x: lerp(56, 46, nearLift), y: lerp(-34, -112, nearLift) + 4 * Math.sin(f * 0.07) } },
    handShapes: { near: leafInHand ? "grip" : "open" },
    handTurns: { near: -1.4 },
    face: {
      lookX: seatedLook,
      smile: track(f, [
        [chotto, 0.3],
        [chotto + 10, 0.55, "inOut"],
        [chotto + 60, 0.4, "inOut"],
        [p1.from + 10, 0.4],
        [p1.to, 0.6, "inOut"],
      ]),
      eyesDown: track(f, [
        [chotto - 10, 0.35],
        [chotto + 2, 0.1, "inOut"],
        [chotto + 60, 0.1],
        [chotto + 76, 0.4, "inOut"],
        [l1b.from + 30, 0.4],
        [l1b.from + 46, 0.2, "inOut"],
      ]),
    },
    expression: f >= p1.from ? "playful" : "serene",
    expressionStart: p1.from,
    prevExpression: "serene",
    mouth: 0,
  });
  const hands = seatedPhase ? seatedChildHands(seatedProps) : null;
  // restless: a small rock on the seat in 01c and P1 (around the seat point)
  const rock = f >= l1c.from && f < ag2.from ? 1.6 * Math.sin((f - l1c.from) * 0.09) * smooth((f - l1c.from) / 20) : 0;

  // the leaf: in his fingers, then it drops to the floor and lies there (it stirs in P2)
  let leaf: React.ReactNode = null;
  {
    const dropFrom = (() => {
      const h = seatedChildHands({ ...seatedProps, f: LEAF_DROP.a, lifeF: LEAF_DROP.a, kneel: 2 * smooth((LEAF_DROP.a - KNEEL_UP.a) / (KNEEL_UP.b - KNEEL_UP.a)) });
      return h.nearPalm;
    })();
    if (leafInHand && hands) {
      leaf = <Ep05MangoLeaf x={hands.nearPalm.x} y={hands.nearPalm.y - 2} s={0.62} rot={-150 + 10 * Math.sin(f * 0.05)} twirl={twirl} />;
    } else {
      const u = clamp((f - LEAF_DROP.a) / (LEAF_DROP.b - LEAF_DROP.a));
      const flutter = (1 - u) * 14 * Math.sin(u * 9);
      const stir = f >= p2.from - 6 ? 6 * Math.sin((f - p2.from) * 0.32) * Math.exp(-Math.max(0, f - p2.from - 18) / 20) : 0;
      leaf = (
        <Ep05MangoLeaf
          x={lerp(dropFrom.x, LEAF_REST.x, u) + flutter * 0.4}
          y={lerp(dropFrom.y, LEAF_REST.y, u * u)}
          s={0.62}
          rot={lerp(-150, -8, u) + flutter + stir}
          twirl={u < 1 ? (u * 1.6) % 1 : 0}
        />
      );
    }
  }

  // standing: kneel-to-stand, then the tiptoe walk-off with a look back
  let standing: StandingChildProps | null = null;
  if (standingVisible) {
    const KNEEL_DROP = 128;
    const rise = EASE.inOut(clamp((f - RISE.a - 2) / (RISE.b - RISE.a - 2)));
    const walking = f >= WALK0 - 6;
    const D = walkD(f);
    let near = { x: 0, z: 0, lift: 0, pitch: 0 };
    let far = { x: 0, z: 0, lift: 0, pitch: 0 };
    let drop = 0;
    let shiftX = 0;
    let hipTilt = 0;
    if (!walking) {
      near = { x: lerp(2, 14, rise), z: lerp(-50, 12, rise), lift: 0, pitch: lerp(0.2, 0.04, rise) };
      far = { x: -2, z: lerp(-48, 0, rise), lift: 0, pitch: lerp(0.2, 0.04, rise) };
      drop = KNEEL_DROP * (1 - rise);
    } else {
      const n = footAt(f, true);
      const fs = footAt(f, false);
      near = { x: (n.d - D) * CA, z: (n.d - D) * SA, lift: n.lift, pitch: n.pitch };
      far = { x: (fs.d - D) * CA, z: (fs.d - D) * SA, lift: fs.lift, pitch: fs.pitch };
      const t = f - WALK0;
      const k = Math.max(0, [...Array(NSTEP).keys()].filter((i) => f >= stepT0(i)).length - 1);
      const loc = f - stepT0(k);
      const swingU = t >= 0 && loc < SWING ? loc / SWING : 1;
      const ramp6 = clamp((f - (WALK0 - 6)) / 6);
      drop = ramp6 * (-3 + (t >= 0 && loc < SWING ? 1.2 * Math.sin(Math.PI * swingU) : 0)); // up on the toes
      const stanceNear = k % 2 === 1;
      const weight = t >= 0 && loc < SWING ? Math.sin(Math.PI * swingU) : 0.15;
      shiftX = ramp6 * (stanceNear ? -2 : 2) * weight;
      hipTilt = ramp6 * (stanceNear ? 1.4 : -1.4) * weight;
    }
    const lookK = track(f, [
      [LOOK.a, 0],
      [LOOK.a + 4, 1, "inOut"],
      [LOOK.b - 4, 1],
      [LOOK.b + 2, 0, "inOut"],
    ]);
    standing = {
      x: balakStandX(f),
      y: BALAK.y,
      s: STAND_S,
      headScale: EP05R_SCALE.standingBalak.headScale,
      f,
      lifeF: f,
      flip: true,
      yaw: 1 - 0.5 * lookK,
      pose: "standIdle",
      expression: "playful",
      mouth: 0,
      face: { smile: 0.55, lookX: lerp(0.15, -0.6, lookK), lookY: lerp(0.12, -0.05, lookK) },
      gaze: [
        { at: { x: -620, y: -220 }, start: LOOK.a },
        { start: LOOK.b - 2 },
      ],
      legDrive: {
        near,
        far,
        pelvisDrop: drop,
        lean: walking ? 0.1 : lerp(0.42, 0.06, rise),
        shiftX,
        hipTilt,
      },
      bodyLean: "auto",
    };
  }

  /* ---------------- Charu ---------------- */
  // the kula on her lap: both hands on the rim with little tosses; rested while she wags a finger; set on the floor at the alarm
  const LAP = { x: CHARU.x + 44, y: CHARU.y - 50 };
  const FLOOR = { x: CHARU.x + 62, y: CHARU.y + 6 };
  const SET_DOWN = { a: l1f.from + 2, b: l1f.from + 22 };
  const toss = (fr: number) => {
    const ph = (fr % 26) / 26;
    return ph < 0.5 ? -7 * Math.sin((ph / 0.5) * Math.PI) : 0;
  };
  const working = (fr: number) =>
    track(fr, [
      [0, 1],
      [ajkal + 2, 1],
      [ajkal + 12, 0, "inOut"],
      [fak - 6, 0],
      [fak + 6, 1, "inOut"],
      [tuk - 4, 1],
      [tuk + 2, 0.4, "inOut"],
      [tuk + 26, 0.4],
      [tuk + 36, 1, "inOut"],
      [p1.from, 1],
      [p1.from + 6, 0.2, "inOut"],
      [p1.to - 4, 0.2],
      [p1.to + 8, 1, "inOut"],
      [l1e.from, 1],
      [l1e.from + 3, 0, "linear"], // freezes
    ]);
  const kulaAt = (fr: number) => {
    const down = smooth((fr - SET_DOWN.a) / (SET_DOWN.b - SET_DOWN.a));
    return { x: lerp(LAP.x, FLOOR.x, down), y: lerp(LAP.y + toss(fr) * working(fr), FLOOR.y, down) };
  };
  const charuHold = (fr: number) =>
    track(fr, [
      [ajkal + 2, 1],
      [ajkal + 12, 0, "inOut"],
      [fak - 6, 0],
      [fak + 4, 1, "inOut"],
      [SET_DOWN.b, 1],
      [SET_DOWN.b + 10, 0, "inOut"],
    ]);
  const charuRise = { a: cholo - 10, b: cholo + 16 };
  // Run only as far as the left porch post — past that the plate is bamboo / jungle, not a path.
  const charuRun: WalkOpts = {
    start: ag4.from - 6,
    dur: 80,
    fromX: 0,
    toX: -(CHARU.x - (PORCH_EXIT - 40)),
    scale: K,
    height: EP05R_CAST.charu.height,
    seed: EP05R_CAST.charu.seed,
    kind: "run",
    bodyTurn: -0.85,
    startIn: 12,
  };
  const charuBase = (fr: number): Partial<Pose> => {
    const toSuren = track(fr, [
      [0, 0.15],
      [surenBabu, 0.15],
      [surenBabu + 14, 0.32, "inOut"],
      [l1e.from + 2, 0.32],
    ]);
    const snap = track(fr, [
      [l1e.from + 2, 0],
      [l1e.from + 7, 1, "out"],
      [l1f.from + 4, 1],
      [l1f.from + 14, 0.2, "inOut"], // "বিনয়ের গলা না?" to her husband
      [biru - 8, 0.2],
      [biru + 4, 0.85, "inOut"], // the empty spot
    ]);
    const spot = track(fr, [
      [biru - 8, 0],
      [biru + 4, 1, "inOut"],
    ]);
    const laugh = track(fr, [
      [p1.from - 4, 0],
      [p1.from + 4, 1, "inOut"],
      [p1.to - 6, 1],
      [p1.to + 6, 0, "inOut"],
      [ag3.from + 6, 0],
      [ag3.from + 14, 0.8, "inOut"],
      [ag3.to - 10, 0.8],
      [ag3.to, 0.2, "inOut"],
      [l1e.from, 0],
    ]);
    const wag = fr >= ajkal + 8 && fr < fak - 4 ? smooth((fr - ajkal - 8) / 8) * smooth((fak - 4 - fr) / 8) : 0;
    const flick = throwUpPulse(fr, tuk - 2, 6) * 0.55;
    const fear = track(fr, [
      [l1e.from + 2, 0],
      [l1e.from + 8, 0.8, "out"],
      [biru, 0.8],
      [biru + 10, 1, "inOut"],
    ]);
    const handMouth = track(fr, [
      [l1f.to - 2, 0],
      [l1f.to + 10, 1, "inOut"],
      [charuRise.a - 2, 1],
      [charuRise.a + 6, 0, "inOut"],
    ]);
    const kneel = 1 - smooth((fr - charuRise.a) / (charuRise.b - charuRise.a));
    const run = fr >= charuRun.start ? walkPose(fr, charuRun) : {};
    const turnLeft = smooth((fr - (charuRise.a + 6)) / 16);
    const speak = roleMouth(SCENE_ID, "charu", fr);
    return {
      kneel,
      bodyTurn: lerp(toSuren, -0.6, turnLeft),
      lean: 2 + 3 * laugh + 10 * smooth((fr - SET_DOWN.a) / 8) * (1 - smooth((fr - SET_DOWN.b) / 10)) + 3 * fear * (1 - turnLeft),
      headTurn: lerp(lerp(0.05 + 0.12 * Math.sin(fr * 0.013), -0.62, snap), 0, turnLeft) - 0.2 * wag,
      headTilt: 3 + 5 * laugh - 4 * wag + 2 * Math.sin(fr * 0.021),
      headNod: -3 * laugh + 3 * spot + headNods(fr, l1c.from + 30, 2, 14, 4) + headNods(fr, chokhe + 10, 2, 14, 4) - 4 * fear * (1 - spot),
      eyeY: 0.35 * spot + 0.25 * working(fr) * (1 - laugh) * (speak > 0.05 ? 0.3 : 1),
      eyeX: -0.3 * spot,
      brow: lerp(0.15 + 0.3 * wag, 0.85, fear),
      browTilt: lerp(0.1, 0.55, fear),
      smile: lerp(0.45 + 0.4 * laugh + 0.15 * wag, 0.02, fear),
      lid: 0.25 * laugh,
      gasp: 0.3 * fear * (speak > 0.05 ? 0.4 : 1),
      bodyY: laugh * 1.4 * Math.abs(Math.sin(fr * 0.5)),
      hold: charuHold(fr) * (1 - handMouth) * kneel,
      jab: -wag * (0.75 + 0.25 * Math.abs(Math.sin(fr * 0.45))),
      throwUp: -flick,
      mouthHand: -handMouth,
      rHand: "relaxed",
      lHand: "relaxed",
      ...run,
    };
  };
  const charuActing = withGhibliActing(charuBase, { personality: "mother", seed: 51, wind: 0.2, fastWindows: [[l1e.from, l1e.from + 20], [charuRise.a, dur]] });
  const charuWalla: Array<[number, number]> = [
    [ag2.from + 4, ag2.from + 38],
    [ag2.from + 74, l1d.from + 40],
    [l1d.from + 86, kokhon - 4],
  ];
  const charuMouth = (fr: number): MouthState => {
    const m = roleMouth(SCENE_ID, "charu", fr);
    if (m > 0.01) return mouthFromRms(m, fr);
    const lk = fr >= p1.from && fr < p1.to + 4 ? smooth((fr - p1.from) / 4) * smooth((p1.to + 4 - fr) / 6) : 0;
    const lk3 = fr >= ag3.from + 8 && fr < ag3.to - 4 ? 0.7 : 0;
    if (lk + lk3 > 0) return laughMouth(fr, Math.max(lk, lk3));
    const w = chatRms(fr, charuWalla, 1.3);
    return w > 0 ? mouthFromRms(w, fr) : MOUTH_REST;
  };
  const charuX = CHARU.x + (f >= charuRun.start ? walkTravel(f, charuRun).bodyX : 0);
  const charuOnPorch = charuX > PORCH_EXIT;

  /* ---------------- Surendra ---------------- */
  const FAN_DROP = l1f.from + 30;
  const surenRise = { a: l1g.from + 2, b: l1g.from + 18 };
  const surenRun: WalkOpts = {
    start: ag4.from - 2,
    dur: 84,
    fromX: 0,
    toX: -(SUREN.x - (PORCH_EXIT - 40)),
    scale: K,
    height: EP05R_CAST.surendra.height,
    seed: EP05R_CAST.surendra.seed,
    kind: "run",
    bodyTurn: -0.85,
    startIn: 10,
  };
  const fanAmp = (fr: number) =>
    track(fr, [
      [0, 1],
      [l1c.from - 4, 1],
      [l1c.from + 6, 0.2, "inOut"],
      [l1c.to, 0.2],
      [p1.to, 1, "inOut"],
      [l1e.from, 1],
      [l1e.from + 3, 0, "linear"],
    ]);
  const surenBase = (fr: number): Partial<Pose> => {
    const toCharu = track(fr, [
      [0, -0.24],
      [l1b.from - 10, -0.24],
      [l1b.from + 4, -0.32, "inOut"],
    ]);
    const atBalak = track(fr, [
      [chotto + 4, 0],
      [chotto + 16, 1, "inOut"],
      [chotto + 56, 1],
      [chotto + 70, 0, "inOut"],
    ]);
    const laugh = track(fr, [
      [l1c.from - 2, 0],
      [l1c.from + 6, 0.9, "inOut"],
      [l1c.from + 40, 0.5, "inOut"],
      [chokhe, 0.2, "inOut"],
      [p1.from - 4, 0.2],
      [p1.from + 4, 1, "inOut"],
      [p1.to - 6, 1],
      [p1.to + 6, 0, "inOut"],
      [ag3.from + 4, 0],
      [ag3.from + 12, 0.9, "inOut"],
      [ag3.to - 10, 0.9],
      [ag3.to, 0.2, "inOut"],
      [l1e.from, 0],
    ]);
    const snap = track(fr, [
      [l1e.from + 3, 0],
      [l1e.from + 8, 1, "out"],
    ]);
    const half = track(fr, [
      [l1e.from + 6, 0],
      [l1e.from + 18, 1, "inOut"],
    ]);
    const tap = fr >= chokhe + 6 && fr < l1c.to - 6 ? smooth((fr - chokhe - 6) / 8) * smooth((l1c.to - 6 - fr) / 10) : 0;
    const fanDown = track(fr, [
      [FAN_DROP - 14, 0],
      [FAN_DROP, 1, "inOut"],
    ]);
    const point = fr >= l1g.from + 2 && fr < cholo + 2 ? smooth((fr - l1g.from - 2) / 6) * smooth((cholo + 2 - fr) / 8) : 0;
    const beckon = fr >= cholo + 2 && fr < ag4.from ? Math.sin((fr - cholo) * 0.42) * smooth((fr - cholo - 2) / 6) : 0;
    const kneel = lerp(1, 0.78, half) * (1 - smooth((fr - surenRise.a) / (surenRise.b - surenRise.a)));
    const run = fr >= surenRun.start ? walkPose(fr, surenRun) : {};
    const speak = roleMouth(SCENE_ID, "surendra", fr);
    return {
      kneel,
      bodyTurn: lerp(toCharu, -0.36, snap),
      lean: -3 * laugh + 9 * half * kneel + 6 * fanDown * (1 - smooth((fr - FAN_DROP) / 10)),
      headTurn: lerp(toCharu * 0.6 + 0.2 * atBalak + 0.04 * Math.sin(fr * 0.017), -0.3, snap),
      headTilt: -4 * laugh + 2 * Math.sin(fr * 0.019),
      headNod: -5 * laugh + headNods(fr, ajkal + 20, 2, 16, 4) + headNods(fr, tuk + 12, 3, 12, 5) + 3 * atBalak,
      eyeX: -0.2 * atBalak,
      brow: lerp(0.1 + 0.15 * tap, 0.9, snap),
      browTilt: lerp(0, 0.4, snap),
      smile: lerp(0.4 + 0.45 * laugh, 0.02, snap),
      lid: 0.25 * laugh,
      gasp: 0.25 * snap * (speak > 0.05 ? 0.4 : 1),
      bodyY: laugh * 1.6 * Math.abs(Math.sin(fr * 0.46)),
      rProp: fr < FAN_DROP ? "palmFan" : "",
      rHand: fr < FAN_DROP ? "hold" : point > 0.3 ? "point" : "relaxed",
      rS: lerp(lerp(14, 4, tap), -2, fanDown) + 6 * beckon,
      rE: lerp(lerp(126, 104, tap), -10, fanDown) - 12 * Math.abs(beckon),
      jab: point,
      lS: 4,
      lE: -30,
      ...run,
    };
  };
  const surenActing = withGhibliActing(surenBase, { personality: "adult", seed: 23, wind: 0.2, fastWindows: [[l1e.from, l1e.from + 20], [surenRise.a, dur]] });
  const surenWalla: Array<[number, number]> = [
    [ag2.from + 40, ag2.from + 72],
    [l1d.from + 42, l1d.from + 84],
    [kokhon - 4, kokhon + 30],
  ];
  const surenMouth = (fr: number): MouthState => {
    const m = roleMouth(SCENE_ID, "surendra", fr);
    if (m > 0.01) return mouthFromRms(m, fr);
    const lk = fr >= p1.from && fr < p1.to + 4 ? smooth((fr - p1.from) / 4) * smooth((p1.to + 4 - fr) / 6) : 0;
    const lk3 = fr >= ag3.from + 6 && fr < ag3.to - 4 ? 0.8 : 0;
    if (lk + lk3 > 0) return laughMouth(fr + 7, Math.max(lk, lk3));
    const w = chatRms(fr, surenWalla, 4.1);
    return w > 0 ? mouthFromRms(w, fr) : MOUTH_REST;
  };
  const surenX = SUREN.x + (f >= surenRun.start ? walkTravel(f, surenRun).bodyX : 0);
  const surenOnPorch = surenX > PORCH_EXIT;
  const fanProps = { palmFan: makePalmFanInHand((fr) => fanAmp(fr) * (16 * Math.sin(fr * 0.42) + 3 * noise1(fr * 0.05, 4))) };

  /* ---------------- figures ---------------- */
  const kula = kulaAt(f);
  const charuEl = (
    <Ep05Person
      cast={EP05R_CAST.charu}
      sitStyle="kneel"
      softSleeves
      x={charuX}
      y={CHARU.y}
      scale={K}
      f={f}
      lifeF={f}
      light={EP05R_LIGHT.lateMorning}
      acting={charuActing}
      mouth={charuMouth}
      talk={(fr) => roleMouth(SCENE_ID, "charu", fr)}
      holdAt={kulaAt}
      pointAt={() => ({ x: BALAK.x, y: BALAK.y - 120 })}
      pointReach={0.62}
      breathRate={f >= l1e.from ? 1.7 : 1}
      shadowRx={70 * K}
    />
  );
  const surenEl = (
    <Ep05Person
      cast={EP05R_CAST.surendra}
      sitStyle="crossLegged"
      x={surenX}
      y={SUREN.y}
      scale={K}
      f={f}
      lifeF={f}
      light={EP05R_LIGHT.lateMorning}
      acting={surenActing}
      mouth={surenMouth}
      talk={(fr) => roleMouth(SCENE_ID, "surendra", fr)}
      props={fanProps}
      pointAt={() => NEXT_DOOR}
      pointReach={0.9}
      breathRate={f >= l1e.from ? 1.6 : 1}
      shadowRx={74 * K}
    />
  );

  // hens: one wanders along the veranda edge in 01b (Balak watches it); one pecks right of Surendra and scatters at the shout
  const henA = (
    <Hen
      x={0}
      y={0}
      s={K * 0.95}
      lifeF={f}
      seed={5}
      variant={1}
      path={[
        { f: l1b.from - 30, x: 1040, y: PORCH_EDGE },
        { f: l1b.from + 70, x: 900, y: PORCH_EDGE },
        { f: l1b.to + 10, x: 860, y: PORCH_EDGE + 2 },
        { f: l1c.to, x: 1100, y: PORCH_EDGE },
      ]}
      peckAt={[l1b.from + 80, l1b.from + 120, l1b.from + 168]}
      autoCluck={false}
    />
  );
  const henB = (
    <Hen
      x={1080}
      y={PORCH_EDGE + 2}
      s={K * 0.95}
      lifeF={f}
      seed={8}
      variant={0}
      flip
      autoPeck
      autoCluck={false}
      scatterAt={l1e.from + 3}
      scatterDir={1}
      scatterDist={260}
    />
  );

  const occluders = (
    <g>
      <defs>
        <clipPath id="ep05r-s01-posts">
          {POST_OCCLUDERS.map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />
          ))}
        </clipPath>
      </defs>
      <image
        href={staticFile(PLATE)}
        x={PLATE_RECT.x}
        y={PLATE_RECT.y}
        width={PLATE_RECT.w}
        height={PLATE_RECT.h}
        preserveAspectRatio="xMidYMid slice"
        clipPath="url(#ep05r-s01-posts)"
      />
    </g>
  );

  const figureBlur = 2.2 * rack;
  const cu = S01_CU_DETAILS.find((d) => d.match(shot.name) && cuDetailActive(cam.zoom, d.zoom));

  return (
    <div style={{ position: "absolute", inset: 0, background: "#e9d6b4", overflow: "hidden" }}>
      <GhibliStage cam={cam} background="#e9d6b4" stable={Boolean(cu)}>
        <GhibliPreload files={PRELOAD} />
        {cu ? <CuDetailScreen href={cu.href} /> : <PaintedPlate href={PLATE} />}
        {/* sky life: a few birds over the bamboo (Shot 1) — skip over CU so soft flock art doesn't muddy the plate */}
        {!cu && (
          <GhibliLayer depth={1}>
            <GhibliBirdFlock f={f} start={l1a.from + 10} dur={170} from={{ x: 1520, y: 150 }} to={{ x: 2250, y: 70 }} count={5} s={0.8} lifeF={f} />
            <GhibliCloudShadows region={{ x: -240, y: PORCH - 40, w: 2400, h: 460 }} lifeF={f} speed={0.9} opacity={f >= ag3.from - 40 && f < l1e.from + 40 ? 0.16 : 0.08} />
          </GhibliLayer>
        )}
        <GhibliLayer depth={1}>
          <FigureDefs f={f} zoom={cam.zoom} />
          <GhibliCutout
            file="images/ghibli_ep04/madur_mat_veranda_sketch.png"
            anchor={{ width: 1529, height: 600, anchorX: 0.5, anchorY: 0.62 }}
            x={MAT.x}
            y={MAT.y}
            targetHeight={MAT.h}
          />
          {f >= FAN_DROP && <Ep05PalmFan x={FAN_REST.x} y={FAN_REST.y} s={0.8 * K} rot={-78} />}
          {!leafInHand && leaf}
          {/* the crow on the eave (caws in AG3, lifts off at the shout) */}
          <Crow x={1180} y={440} s={0.62} lifeF={f} seed={4} cawAt={[ag3.from + 14, ag3.from + 30]} lookAt={[ag3.from + 4, l1d.from + 40]} takeOffAt={l1e.from + 4} takeOffDir={1} />
          {/* a sparrow hops on the veranda edge by Balak (01a) and flies at the hen */}
          <Sparrow
            x={390}
            y={PORCH_EDGE}
            s={K}
            lifeF={f}
            seed={6}
            hopAt={[l1a.from + 30, chotto - 6, chotto + 40, l1a.to - 20]}
            hopLen={[5, 4, -5, 6]}
            peckAt={[l1a.from + 60, chotto + 14, chotto + 70]}
            tiltAt={[chotto + 4]}
            flutterAt={[l1b.from + 36]}
            flutterLen={-120}
            opacity={1 - clamp((f - l1b.from - 36) / 10)}
          />
        </GhibliLayer>
        <GhibliLayer depth={1} extraBlur={0}>
          {/* Balak (behind the parents' line), sharp through the rack */}
          {seatedPhase && (
            <g transform={`rotate(${rock.toFixed(3)} ${BALAK.x} ${BALAK.y})`}>
              <Ep05SeatedBalak {...seatedProps} zoom={cam.zoom} />
              {leafInHand && leaf}
            </g>
          )}
          {standing && <Ep05StandingBalak {...standing} zoom={cam.zoom} />}
        </GhibliLayer>
        <GhibliLayer depth={1} extraBlur={figureBlur}>
          <FigureDefs f={f} zoom={cam.zoom} />
          {henA}
          {surenOnPorch && surenEl}
          {charuOnPorch && <Kula x={kula.x} y={kula.y} s={K} rot={f < SET_DOWN.a ? -6 : -2} />}
          {charuOnPorch && charuEl}
          {henB}
        </GhibliLayer>
        {!cu && <GhibliLayer depth={1}>{occluders}</GhibliLayer>}
        <GhibliGrade warmth={0.14} vignette={0.24} paperOpacity={0.08} />
      </GhibliStage>
      <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} />
    </div>
  );
};

