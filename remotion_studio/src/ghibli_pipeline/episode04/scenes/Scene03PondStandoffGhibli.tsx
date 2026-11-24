import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, lerp, makeActing, type PoseKey } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { MOUTH_REST } from "../../../cinematic/rig/lipsync";
import { type CastMember, type Pose, type PuppetAnchors, Puppet, walkPose, walkTravel, type WalkOpts } from "../../../cinematic/rig/Puppet";
import { EP06_CHILD_HEAD } from "../../../cinematic/rig/cast";
import { HeldObjectArt } from "../../../episode03/rig/SeatedChild";
import {
  type StandingChildProps,
  type StandingPose,
  StandingChild,
  standingChildJoints,
  standingLocal,
} from "../../../episode05/rig/StandingChild";
import { ContactShadow, GhibliCharFilterDefs, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { GhibliFootstepDust } from "../../core/GhibliAtmosphere";
import { zoomProportionalDof } from "../../core/ghibliMotion";
import { ep04gSpan, ep04gSpeakRms } from "../timing";
import {
  EP04G_CAST,
  EP04G_POND_LIGHT,
  GhibliEp04ForegroundFinish,
  GhibliPondBackdrop,
  mouthFromRms,
  poseOf,
} from "../Ep04GhibliShared";

/**
 * Scene 03 (03_pond_standoff_and_rescue): the pond-bank standoff. Blueprint shots 11-16, AG5, P5, P6.
 *
 * LAYOUT (world px; the water's edge is at about y 836, feet on the trodden bank at y 900-965): Balak stands near the
 * water's edge at BAL (StandingChild, plate age 5, healthy build, facing left toward the family) left of the mandar trunk
 * (x 1300-1470). The family comes along the bank from the ghat (left): Sundar jyetha, Charu, the runner cousin (CAST.rama,
 * the voice of 03a and 03e) and the elder cousin (CAST.elderBrother, silent). Directions of the Puppets come from
 * bodyTurn's sign (+ faces right).
 *
 * STORY: the family rushes in (Shot 11); the cousins creep closer while Balak holds them off, the Gobinda held out to the
 * side over the water, his other palm up ("stop"); on "...ছুঁড়ে ফেলে দেব!" they freeze mid-stride (their leg clock stops,
 * hands up), held through P5; Sundar waves them back and coaxes (Shot 13, two gentle steps); Balak lowers the Gobinda to
 * his chest (Shot 14); AG5: the runner zips off to the house and back with the wooden doll (a comic sprint: his leg clock
 * runs faster so the feet stay planted); Shot 15: Balak takes the doll in his far hand and pulls the Gobinda away from
 * the runner's grab; Shot 16: he walks two steps to Sundar and puts the Gobinda into his two cupped hands (contact every
 * frame: Balak's hand on it until Sundar's palms are under it), Sundar draws it to his chest, Charu sighs (P6).
 *
 * OBJECTS (MOT-07): the Gobinda is drawn from Balak's hands every frame (layerMid: his near hand lies over it), then from
 * Sundar's cupped palms (Puppet reachAt = its base). The doll is drawn from the runner's wrist (anchors), then from
 * Balak's far palm (layerFar). Nothing floats.
 *
 * CLOCKS: P5 and P6 sit between voice clips, so the story clock is the local frame; life on the same frame.
 */

const SCENE_ID = "03_pond_standoff_and_rescue";

const PRELOAD = [
  "images/ghibli_ep04/sky_ep04_pond_day.png",
  "images/ghibli_ep04/pond_far_bank_baidik_sketch.png",
  "images/ghibli_ep04/pond_water_emerald_sketch.png",
  "images/ghibli_ep04/brick_ghat_steps_sketch.png",
  "images/ghibli_ep04/tree_mandar_bloom_sketch.png",
  "images/ghibli_ep04/banana_clump_pond_sketch.png",
  "images/ghibli_ep04/watercolor_paper_grain.png",
] as const;

type V = { x: number; y: number };

const K = 0.94; // adult Puppet scale on the front bank
const BAL = { x: 1180, y: 900, s: 0.5, headScale: 1.45 };
const GOB_S = 0.78; // drawing scale of the brass Gobinda in his hands
const GOB_GRIP_Y = 6.9; // grip line below the object's origin (object units)
const GOB_BOTTOM = 32.8; // origin to the base (object units)
const DOLL_S = 0.72;
const DOLL_GRIP_Y = 2.4;

const smooth = (t: number) => EASE.inOut(clamp(t));
const C: Record<string, CastMember> = EP04G_CAST;

/** Reads anchor points written by a Puppet rendered earlier in the same tree. */
const Late: React.FC<{ render: () => React.ReactNode }> = ({ render }) => <>{render()}</>;

interface StandKey {
  at: number;
  pose: StandingPose;
  blend?: number;
}
const standAt = (f: number, keys: StandKey[]) => {
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (keys[k].at <= f) i = k;
  const cur = keys[i];
  const prev = i > 0 ? keys[i - 1] : undefined;
  const blend = cur.blend ?? 18;
  return { pose: cur.pose, poseStart: cur.at, prevPose: prev?.pose, prevPoseStart: prev?.at, blendFrames: blend, k: smooth((f - cur.at) / blend) };
};

/** A walk (or run) on its own leg clock: travel and walkPose both run on `clock`, so the feet stay planted. */
const walker = (clock: number, o: WalkOpts) => ({ x: walkTravel(clock, o).bodyX, pose: walkPose(clock, o) });

export const Scene03PondStandoffGhibli: React.FC = () => {
  const f = useCurrentFrame();

  const s3a = ep04gSpan(SCENE_ID, "03a_Family_Shout.wav");
  const s3b = ep04gSpan(SCENE_ID, "03b_Balak_Standoff.wav");
  const s3c = ep04gSpan(SCENE_ID, "03c_Sundar_Coax.wav");
  const s3d = ep04gSpan(SCENE_ID, "03d_Balak_Negotiate.wav");
  const ag5 = ep04gSpan(SCENE_ID, "AG5_runner_sprint");
  const s3e = ep04gSpan(SCENE_ID, "03e_Runner_Handover.wav");
  const s3f = ep04gSpan(SCENE_ID, "03f_Balak_ToSundar.wav");
  const sceneEnd = s3f.to + 48;

  /* ---------------- story beats ---------------- */
  // 03b (clip silences 16-25, 37-48, 63-75, 82-89, 108-118, 127-132, 159-169)
  const NO = s3b.from; // "না, যাব না— তোমরা বকবে!"
  const STOP = s3b.from + 52; // "এই, এসো না বলছি!" : palm up, the Gobinda out to the side
  const THREAT = s3b.from + 160; // "...পুকুরে ছুঁড়ে ফেলে দেব!" : held further out over the water
  const CUT_FAMILY = s3b.from + 164;
  const FREEZE = s3b.from + 172;
  // 03c (silences 55-73, 86-96, 129-141, 169-178)
  const WAVE = s3c.from; // "আরে থামো সবাই, যেও না!" : waves the cousins back
  const UNFREEZE = s3c.from + 12;
  const STEP = s3c.from + 74; // "শোনো বীরু..." : two gentle steps forward
  const PALMS = s3c.from + 112; // "গোবিন্দটা আমায় দিয়ে দাও—"
  const MELA = s3c.from + 162; // "তোমায় মেলা থেকে... কেমন?"
  const KEMON = s3c.from + 236;
  // 03d
  const LOWER = s3d.from - 2; // lowers the Gobinda to his chest
  const HERE = s3d.from + 140; // "...এখানে এনে দাও!"
  // AG5
  const NOD = s3d.to - 10; // Sundar nods to the runner
  const OUT0 = ag5.from + 4; // the runner zips off
  const OUT1 = OUT0 + 20;
  const BACK0 = OUT1 + 8;
  const BACK1 = BACK0 + 34;
  // 03e (silences 25-38, 59-74, 85-96)
  const THRUST = s3e.from + 30; // "এই নে তোর কাঠের পুতুল!" : thrusts the doll at him
  const TAKE = s3e.from + 56; // Balak's far hand closes on the doll
  const GRAB = s3e.from + 80; // "দে, এবার গোবিন্দ দে!" : the runner reaches for the Gobinda
  const PULL = s3e.from + 82; // Balak pulls it away
  // 03f (silences 42-50, 81-100)
  const REFUSE = s3f.from; // "না, তোমাকে দেব না—"
  const WALK0 = s3f.from + 46; // "সুন্দর জ্যেঠাকে দেব!" : two steps to Sundar
  const WALK1 = WALK0 + 34;
  const GIVE = s3f.from + 96; // "এই নাও জ্যেঠা।" : the Gobinda into Sundar's hands
  const CUPPED = GIVE + 14; // Sundar's palms under it
  const RELEASE = CUPPED + 6;
  const CHEST = RELEASE + 6; // Sundar draws it to his chest
  const SIGH = s3f.to + 6; // P6: Charu's sigh of relief

  /* ---------------- the runner (CAST.rama, voice of 03a / 03e) ---------------- */
  // CAST.rama five years on: a cousin of about ten, a head taller than five-year-old Biru (director, 2026-11-24),
  // with the CHR-08 child head proportion; same face, hair and colours as Episode 1's Rama.
  const RUN_S = K;
  const runner: CastMember = { ...C.runner, height: 1.5, headScale: EP06_CHILD_HEAD };
  const RUN_Y = 950;
  // leg clock: x 3.6 during the zips so his feet stay planted at a cartoon sprint
  const zipRate = 3.6;
  const zipped = (a: number, b: number) => clamp(f - a, 0, b - a) * (zipRate - 1);
  const runnerClock = f + zipped(OUT0, OUT1) + zipped(BACK0, BACK1);
  const rcAt = (fr: number) => fr + clamp(fr - OUT0, 0, OUT1 - OUT0) * (zipRate - 1) + clamp(fr - BACK0, 0, BACK1 - BACK0) * (zipRate - 1);
  // legs (on the runner's clock)
  const rEnter: WalkOpts = { start: -6, dur: 112, fromX: -180, toX: 740, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "run", child: true, startIn: 4, stopIn: 14 };
  const rCreep: WalkOpts = { start: 175, dur: 190, fromX: 740, toX: 880, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "hurry", child: true, startIn: 18, stopIn: 4, bodyTurn: 0.75 };
  const rBack: WalkOpts = { start: WAVE + 16, dur: 30, fromX: 880, toX: 828, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "hurry", child: true, startIn: 6, stopIn: 8, bodyTurn: 0.6 };
  const rOut: WalkOpts = { start: rcAt(OUT0), dur: rcAt(OUT1) - rcAt(OUT0) + 6, fromX: 828, toX: 40, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "run", child: true, startIn: 10, stopIn: 2, bodyTurn: -0.85 };
  const rIn: WalkOpts = { start: rcAt(BACK0), dur: rcAt(BACK1) - rcAt(BACK0), fromX: -120, toX: 1072, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "run", child: true, startIn: 2, stopIn: 22, bodyTurn: 0.85 };
  const rStepAside: WalkOpts = { start: REFUSE + 14, dur: 34, fromX: 1072, toX: 930, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "hurry", child: true, startIn: 8, stopIn: 10, bodyTurn: -0.7 };
  // the freeze: his legs stop mid-stride
  const freezeClock = (clk: number) => (f >= FREEZE && f < UNFREEZE ? rcAt(FREEZE) : clk);
  const runnerLeg = freezeClock(runnerClock);
  let runnerX: number;
  let runnerWalk: Partial<Pose> = {};
  if (f < 175) {
    const w = walker(runnerLeg, rEnter);
    runnerX = w.x;
    runnerWalk = w.pose;
  } else if (f < WAVE + 16) {
    const w = walker(runnerLeg, rCreep);
    runnerX = w.x;
    runnerWalk = w.pose;
  } else if (f < OUT0) {
    const w = walker(runnerLeg, rBack);
    runnerX = w.x;
    runnerWalk = { ...w.pose, bodyTurn: 0.6 }; // backing off, still facing Balak
  } else if (f < BACK0) {
    const w = walker(runnerClock, rOut);
    runnerX = w.x;
    runnerWalk = w.pose;
  } else if (f < REFUSE + 14) {
    const w = walker(runnerClock, rIn);
    runnerX = w.x;
    runnerWalk = w.pose;
  } else {
    const w = walker(runnerClock, rStepAside);
    runnerX = w.x;
    runnerWalk = { ...w.pose, bodyTurn: f < REFUSE + 48 ? -0.6 : lerp(-0.6, 0.45, smooth((f - (REFUSE + 48)) / 10)) };
  }
  const runnerY = f >= REFUSE + 14 ? lerp(RUN_Y, 966, smooth((f - (REFUSE + 14)) / 34)) : RUN_Y;
  const runnerZip = (f >= OUT0 && f < OUT1 + 4) || (f >= BACK0 && f < BACK1 - 4);
  const runnerHasDoll = f >= BACK0 && f < TAKE;
  const runnerRms = (fr: number) => ep04gSpeakRms(SCENE_ID, ["03a_Family_Shout.wav", "03e_Runner_Handover.wav"], fr);

  /* ---------------- the elder cousin (silent) ---------------- */
  const cous = C.elderBrother;
  const COUS_S = K;
  const cEnter: WalkOpts = { start: 4, dur: 120, fromX: -320, toX: 650, scale: COUS_S, height: cous.height, seed: cous.seed, kind: "run", child: true, startIn: 4, stopIn: 14 };
  const cCreep: WalkOpts = { start: 182, dur: 184, fromX: 650, toX: 772, scale: COUS_S, height: cous.height, seed: cous.seed, kind: "hurry", child: true, startIn: 18, stopIn: 4, bodyTurn: 0.75 };
  const cBack: WalkOpts = { start: WAVE + 10, dur: 30, fromX: 772, toX: 720, scale: COUS_S, height: cous.height, seed: cous.seed, kind: "hurry", child: true, startIn: 6, stopIn: 8, bodyTurn: 0.6 };
  const cousLeg = f >= FREEZE && f < UNFREEZE ? FREEZE : f;
  const cw = f < 182 ? walker(cousLeg, cEnter) : f < WAVE + 10 ? walker(cousLeg, cCreep) : walker(cousLeg, cBack);
  const cousX = cw.x;
  const cousY = 942;

  /* ---------------- Sundar ---------------- */
  const sundar = C.sundar;
  const sEnter: WalkOpts = { start: 0, dur: 130, fromX: -240, toX: 600, scale: K, height: sundar.height, seed: sundar.seed, kind: "hurry", startIn: 6, stopIn: 16 };
  const sStep: WalkOpts = { start: STEP, dur: 44, fromX: 600, toX: 700, scale: K, height: sundar.height, seed: sundar.seed, startIn: 10, stopIn: 12, bodyTurn: 0.7 };
  const sApproach: WalkOpts = { start: OUT0 + 6, dur: 96, fromX: 700, toX: 985, scale: K, height: sundar.height, seed: sundar.seed, startIn: 12, stopIn: 18, bodyTurn: 0.75 };
  const sw = f < STEP ? walker(f, sEnter) : f < OUT0 + 6 ? walker(f, sStep) : walker(f, sApproach);
  const sundarX = sw.x;
  const sundarY = lerp(935, 898, smooth((f - (OUT0 + 6)) / 96));
  const sundarK = K * lerp(1, 0.97, smooth((f - (OUT0 + 6)) / 96));
  const sundarRms = (fr: number) => ep04gSpeakRms(SCENE_ID, ["03c_Sundar_Coax.wav"], fr);

  /* ---------------- Charu ---------------- */
  const charu = C.charu;
  const chEnter: WalkOpts = { start: 10, dur: 140, fromX: -360, toX: 450, scale: K, height: charu.height, seed: charu.seed, kind: "hurry", startIn: 8, stopIn: 18 };
  const chUp: WalkOpts = { start: OUT0 + 20, dur: 80, fromX: 450, toX: 640, scale: K, height: charu.height, seed: charu.seed, startIn: 12, stopIn: 18, bodyTurn: 0.7 };
  const chw = f < OUT0 + 20 ? walker(f, chEnter) : walker(f, chUp);
  const charuX = chw.x;
  const charuY = lerp(935, 912, smooth((f - (OUT0 + 20)) / 80));

  /* ---------------- Balak ---------------- */
  const standKeys: StandKey[] = [
    { at: -60, pose: "holdOut" },
    { at: STOP, pose: "reachGrab", blend: 16 },
    { at: LOWER, pose: "holdOut", blend: 26 },
    { at: TAKE - 22, pose: "handInHands", blend: 18 },
  ];
  const st = standAt(f, standKeys);
  // walking two steps (diagonally toward the camera a touch) to Sundar
  const walkT = smooth((f - WALK0) / (WALK1 - WALK0));
  const stepPh = clamp((f - WALK0) / (WALK1 - WALK0)) * 2; // two steps
  const balX = BAL.x - 72 * walkT;
  const balY = BAL.y + 6 * walkT - (f > WALK0 && f < WALK1 ? 3.2 * Math.abs(Math.sin(Math.PI * stepPh)) : 0);
  const loc = (P: V): V => standingLocal(P, balX, balY, BAL.s, true);

  // hand targets in figure units (facing +x before the flip = toward the family)
  const OUT_SIDE: V = { x: -78, y: -318 };
  const OUT_HIGH: V = { x: -96, y: -352 };
  const STOP_PALM: V = { x: 96, y: -318 };
  const sideNow: V =
    f < THREAT
      ? OUT_SIDE
      : { x: lerp(OUT_SIDE.x, OUT_HIGH.x, smooth((f - THREAT) / 10)), y: lerp(OUT_SIDE.y, OUT_HIGH.y, smooth((f - THREAT) / 10)) + 2 * Math.sin(f * 0.2) };

  // the doll in the runner's hand (world): where he thrusts it
  const dollThrustAt: V = { x: BAL.x - 54, y: BAL.y - 142 };
  // the Gobinda's world grip point while Balak hands it over, and Sundar's cupped palms
  const giveAt: V = { x: balX - 50, y: balY - 150 };

  let handTargets: StandingChildProps["handTargets"] = undefined;
  let reachAt: V | undefined = undefined;
  let heldAt: V | undefined = undefined;
  if (st.pose === "reachGrab" && f < TAKE - 22) {
    handTargets = { near: sideNow, far: STOP_PALM };
  } else if (st.pose === "handInHands") {
    // Shot 15/16: far hand to the doll (then holds it to his chest), near hand keeps the Gobinda (pulled away, then given)
    const tDoll = smooth((f - (TAKE - 22)) / 20);
    const farDoll = loc({ x: dollThrustAt.x, y: dollThrustAt.y + DOLL_GRIP_Y * DOLL_S });
    const farHug: V = { x: 30, y: -284 };
    const far: V = f < TAKE + 6 ? { x: lerp(40, farDoll.x, tDoll), y: lerp(-300, farDoll.y, tDoll) } : { x: lerp(farDoll.x, farHug.x, smooth((f - (TAKE + 6)) / 16)), y: lerp(farDoll.y, farHug.y, smooth((f - (TAKE + 6)) / 16)) };
    const nearChest: V = { x: 40, y: -300 };
    const nearAway: V = { x: -46, y: -296 };
    const nearGive = loc(giveAt);
    const nearRest: V = { x: 10, y: -236 };
    let near: V;
    if (f < PULL) near = nearChest;
    else if (f < WALK0) near = { x: lerp(nearChest.x, nearAway.x, smooth((f - PULL) / 8)), y: lerp(nearChest.y, nearAway.y, smooth((f - PULL) / 8)) };
    else if (f < RELEASE) near = { x: lerp(nearAway.x, nearGive.x, smooth((f - WALK0) / (GIVE - WALK0))), y: lerp(nearAway.y, nearGive.y, smooth((f - WALK0) / (GIVE - WALK0))) };
    else near = { x: lerp(nearGive.x, nearRest.x, smooth((f - RELEASE) / 14)), y: lerp(nearGive.y, nearRest.y, smooth((f - RELEASE) / 14)) };
    handTargets = { near, far };
    heldAt = near;
  }
  const balakRms = ep04gSpeakRms(SCENE_ID, ["03b_Balak_Standoff.wav", "03d_Balak_Negotiate.wav", "03f_Balak_ToSundar.wav"], f);
  const headShake =
    f >= NO + 8 && f < NO + 40 ? Math.sin(clamp((f - (NO + 8)) / 32) * Math.PI) * 0.9 : f >= REFUSE + 2 && f < REFUSE + 34 ? Math.sin(clamp((f - (REFUSE + 2)) / 32) * Math.PI) * 0.9 : 0;
  const expression: StandingChildProps["expression"] =
    f < LOWER ? "playful" : f < TAKE ? "thoughtful" : f < WALK0 ? "playful" : "joyful";
  const balakProps: StandingChildProps = {
    x: balX,
    y: balY,
    s: BAL.s,
    headScale: BAL.headScale,
    build: "healthy",
    age: 5,
    flip: true,
    yaw: 0.85,
    f,
    lifeF: f,
    pose: st.pose,
    poseStart: st.poseStart,
    prevPose: st.prevPose,
    prevPoseStart: st.prevPoseStart,
    blendFrames: st.blendFrames,
    stance: 0.42,
    handTargets,
    reachAt,
    heldAt,
    palmUp: 0.3,
    noteAt: { x: 46, y: -300 },
    noteW: 2 * 9.8 * GOB_S / BAL.s,
    noteAngle: -2,
    expression,
    mouth: balakRms,
    talk: balakRms > 0.06 ? 1 : 0,
    headShake,
    face: { lookX: f >= HERE && f < HERE + 24 ? 0.2 : 0.55, eyesDown: f >= HERE && f < HERE + 24 ? 0.6 : 0 },
  };
  const bj = standingChildJoints(balakProps);

  // the Gobinda in Balak's hands: grip line at the near palm, or centred between the pinches (holdOut)
  const gobByNear: V = { x: bj.handNear.x, y: bj.handNear.y - GOB_GRIP_Y * GOB_S };
  const gobByNote: V | null = bj.note ? { x: bj.note.anchor.x, y: bj.note.anchor.y - GOB_GRIP_Y * GOB_S } : null;
  let gobInBalak: V;
  if (st.pose === "holdOut") {
    gobInBalak = st.prevPose === "reachGrab" && gobByNote ? { x: lerp(gobByNear.x, gobByNote.x, st.k), y: lerp(gobByNear.y, gobByNote.y, st.k) } : (gobByNote ?? gobByNear);
  } else {
    gobInBalak = st.prevPose === "holdOut" && gobByNote && st.k < 1 ? { x: lerp(gobByNote.x, gobByNear.x, st.k), y: lerp(gobByNote.y, gobByNear.y, st.k) } : gobByNear;
  }
  const gobWithSundar = f >= RELEASE;

  // Sundar's cupped hands: under the Gobinda's base while he receives it, then drawn to his chest
  const gobBaseInBalak: V = { x: gobInBalak.x, y: gobInBalak.y + GOB_BOTTOM * GOB_S };
  const sundarChest: V = { x: sundarX + 36, y: sundarY - 188 };
  const cupT = smooth((f - CHEST) / 20);
  const cupAt: V = f < CHEST ? gobBaseInBalak : { x: lerp(gobBaseInBalak.x, sundarChest.x, cupT), y: lerp(gobBaseInBalak.y, sundarChest.y, cupT) };
  // freeze the hand-over point once Balak lets go (his hand moves off it)
  const cupHold = { x: giveAt.x, y: giveAt.y - GOB_GRIP_Y * GOB_S + GOB_BOTTOM * GOB_S };
  const cupNow: V = f < RELEASE ? cupAt : f < CHEST ? cupHold : { x: lerp(cupHold.x, sundarChest.x, cupT), y: lerp(cupHold.y, sundarChest.y, cupT) };

  /* ---------------- Puppet acting ---------------- */
  const MK = (k: PoseKey<Pose>): PoseKey<Pose> => k;
  const handsUp = (a: number) => smooth((f - a) / 6);

  // runner
  const runnerAnchors: { a?: PuppetAnchors } = {};
  const runnerBase = makeActing<Pose>(poseOf({ brow: 0.2 }), [
    MK({ f: 0, brow: 0.3, smile: 0 }),
    MK({ f: s3a.from + 4, in: 6, brow: 0.6, browTilt: -0.4 }),
    MK({ f: 175, in: 12, brow: 0.2, browTilt: 0, smile: 0.15, crouch: 0.12 }),
    MK({ f: FREEZE, in: 6, ease: "out", brow: 1, crouch: 0.05, gasp: 0.45, smile: 0 }),
    MK({ f: UNFREEZE + 10, in: 10, brow: 0.35, gasp: 0, crouch: 0 }),
    MK({ f: s3e.from + 10, in: 8, brow: 0.45, smile: 0.2 }),
    MK({ f: REFUSE + 10, in: 10, brow: -0.3, browTilt: 0.5, smile: 0 }),
  ]);
  const runnerActing = (): Pose => {
    const p = runnerBase(f);
    const frozenUp = f >= FREEZE - 2 && f < UNFREEZE + 14 ? handsUp(FREEZE - 2) * (1 - smooth((f - UNFREEZE) / 14)) : 0;
    const jab = f >= s3a.from && f < s3a.from + 34 ? Math.sin(clamp((f - s3a.from) / 34) * Math.PI) : 0;
    const thrust = f >= THRUST - 10 && f < TAKE + 10 ? smooth((f - (THRUST - 10)) / 12) * (1 - smooth((f - TAKE) / 10)) : 0;
    const grab = f >= GRAB - 6 && f < REFUSE + 14 ? smooth((f - (GRAB - 6)) / 10) * (1 - smooth((f - (PULL + 24)) / 16)) : 0;
    const carry = runnerHasDoll && f < THRUST - 10 ? 1 : 0;
    const out: Pose = {
      ...p,
      ...runnerWalk,
      bodyTurn: runnerWalk.bodyTurn ?? 0.7,
      headHands: 0.62 * frozenUp,
      jab: -0.9 * jab,
      reach: thrust > 0.01 ? -thrust : grab > 0.01 ? grab : 0,
      reachUp: thrust > 0.01 ? 0.6 : 0.3,
      lHand: thrust > 0.01 || carry ? "relaxed" : p.lHand,
      rHand: grab > 0.01 ? "open" : p.rHand,
    } as Pose;
    // the doll arm a little forward while he runs back with it
    if (carry) out.lE = (out.lE ?? 0) - 25;
    return out;
  };
  const runnerReachAt = (): V => (f < GRAB - 6 ? { x: dollThrustAt.x, y: dollThrustAt.y + 4 } : { x: gobInBalak.x - 8, y: gobInBalak.y + 6 });

  // elder cousin
  const cousBase = makeActing<Pose>(poseOf({ brow: 0.2 }), [
    MK({ f: 0, brow: 0.3 }),
    MK({ f: 175, in: 12, brow: 0.2, smile: 0.2, crouch: 0.1 }),
    MK({ f: FREEZE, in: 6, ease: "out", brow: 1, gasp: 0.4, smile: 0, crouch: 0.04 }),
    MK({ f: UNFREEZE + 12, in: 10, brow: 0.4, gasp: 0, crouch: 0 }),
    MK({ f: REFUSE + 6, in: 10, smile: 0.3, brow: 0.2 }),
  ]);
  const cousActing = (): Pose => {
    const p = cousBase(f);
    const up = f >= FREEZE - 2 && f < UNFREEZE + 16 ? handsUp(FREEZE) * (1 - smooth((f - (UNFREEZE + 2)) / 14)) : 0;
    return { ...p, ...cw.pose, bodyTurn: f >= WAVE + 10 ? 0.6 : cw.pose.bodyTurn ?? 0.7, throwUp: 0.85 * up, headTurn: f >= OUT0 && f < BACK1 ? -0.25 : 0.1 } as Pose;
  };

  // Sundar
  const sundarBase = makeActing<Pose>(poseOf({ smile: 0.2 }), [
    MK({ f: 0, brow: 0.5, smile: 0 }),
    MK({ f: FREEZE, in: 6, brow: 0.85, gasp: 0.2 }),
    MK({ f: WAVE, in: 6, gasp: 0, brow: 0.4 }),
    MK({ f: STEP + 10, in: 16, smile: 0.5, brow: 0.3, lean: 6, headTilt: 5 }),
    MK({ f: PALMS, in: 12, lean: 8, headTilt: 7, smile: 0.55 }),
    MK({ f: MELA, in: 12, lean: 6, headTilt: 3 }),
    MK({ f: KEMON, in: 8, headTilt: 10, smile: 0.65 }),
    MK({ f: KEMON + 30, in: 12, headTilt: 4, lean: 3, smile: 0.45 }),
    MK({ f: NOD, in: 6, headNod: 9, headTurn: 0.15 }),
    MK({ f: NOD + 10, in: 6, headNod: 0, headTurn: 0 }),
    MK({ f: CUPPED, in: 10, lean: 10, smile: 0.5, headTilt: 6 }),
    MK({ f: CHEST + 20, in: 18, lean: 2, smile: 0.8, headTilt: 9, brow: 0.1 }),
  ]);
  const sundarActing = (): Pose => {
    const p = sundarBase(f);
    // waving the cousins back: palm-down pats, then the open hands
    const waveW = f >= WAVE - 4 && f < STEP ? smooth((f - (WAVE - 4)) / 6) * (1 - smooth((f - (STEP - 12)) / 12)) : 0;
    const pat = Math.sin((f - WAVE) * 0.55);
    const palmsW = f >= PALMS - 6 && f < MELA + 4 ? smooth((f - (PALMS - 6)) / 10) * (1 - smooth((f - MELA) / 10)) : 0;
    const coaxW = f >= MELA && f < NOD ? smooth((f - MELA) / 10) * (1 - smooth((f - (NOD - 12)) / 12)) : 0;
    const receiveW = f >= GIVE - 4 ? smooth((f - (GIVE - 4)) / 16) : 0;
    const cup = Math.max(palmsW, receiveW);
    return {
      ...p,
      ...sw.pose,
      bodyTurn: sw.pose.bodyTurn ?? 0.6,
      reach: waveW > 0.01 ? waveW : coaxW > 0.01 ? coaxW : 0,
      reachUp: waveW > 0.01 ? 0 : 0.85,
      cupHands: cup,
      rHand: "open",
      lHand: cup > 0.3 ? "open" : p.lHand,
      bodyY: (sw.pose.bodyY ?? 0) + (waveW > 0 ? 0 : 0),
      // the pat: a little up and down of the waving hand
      rE: (sw.pose.rE ?? p.rE) + waveW * 14 * pat,
    } as Pose;
  };
  const sundarReachAt = (): V => {
    if (f < STEP) return { x: sundarX + 120, y: 935 - 250 + 18 * Math.sin((f - WAVE) * 0.55) };
    if (f < GIVE - 6) return { x: sundarX + 95, y: sundarY - 240 };
    return cupNow;
  };

  // Charu
  const charuBase = makeActing<Pose>(poseOf({}), [
    MK({ f: 0, brow: 0.6, browTilt: 0.4 }),
    MK({ f: 160, in: 10, mouthHand: -0.35 }),
    MK({ f: FREEZE, in: 5, ease: "out", mouthHand: -1, brow: 1, gasp: 0.3, lean: -4 }),
    MK({ f: UNFREEZE + 30, in: 14, mouthHand: -0.4, gasp: 0, brow: 0.6, lean: 0 }),
    MK({ f: TAKE, in: 14, mouthHand: 0, brow: 0.4 }),
    MK({ f: CHEST + 4, in: 16, brow: 0.1, browTilt: 0, smile: 0.6, headTilt: 6 }),
  ]);
  const charuActing = (): Pose => ({ ...charuBase(f), ...chw.pose, bodyTurn: chw.pose.bodyTurn ?? 0.55 } as Pose);
  const charuSigh = (fr: number) => (fr < SIGH ? 0 : fr < SIGH + 18 ? smooth((fr - SIGH) / 18) : 1 - smooth((fr - SIGH - 18) / 28));

  /* ---------------- camera ---------------- */
  let cam: Cam = { x: 0, y: 0, zoom: 1 };
  if (f < s3b.from - 6) {
    // Shot 11: wide bank shot, the family rushing in
    cam = { x: lerp(-260, -190, smooth(f / 150)), y: 58, zoom: 1.15 };
  } else if (f < CUT_FAMILY) {
    // Shot 12: medium on Balak at the water's edge
    cam = { x: 300, y: 112, zoom: 1.9 };
  } else if (f < s3c.from - 6) {
    // quick cut: the family freezing mid-stride, held through P5
    cam = { x: -250, y: 72, zoom: 1.45 };
  } else if (f < s3d.from - 6) {
    // Shot 13: medium close on Sundar (follows his two steps)
    const t = smooth((f - STEP) / 44);
    cam = { x: lerp(-330, -250, t), y: 92, zoom: 1.75 };
  } else if (f < ag5.from - 6) {
    // Shot 14: medium close on Balak
    cam = { x: 260, y: 126, zoom: 2.0 };
  } else if (f < s3e.from - 2) {
    // AG5: wide, the runner's dash to the house and back
    cam = { x: -60, y: 62, zoom: 1.35 };
  } else if (f < s3f.from - 6) {
    // Shot 15: medium two-shot, runner and Balak
    cam = { x: 165, y: 82, zoom: 1.72 };
  } else {
    // Shot 16 + P6: two-shot Balak and Sundar, a slow gentle push (feet below frame while he walks)
    const t = smooth((f - (s3f.from - 6)) / (sceneEnd - s3f.from + 6));
    cam = { x: lerp(110, 120, t), y: lerp(82, 92, t), zoom: lerp(1.6, 1.79, t) };
  }
  cam.focus = 1;
  cam.dof = zoomProportionalDof(cam.zoom);

  /* ---------------- objects ---------------- */
  const gobinda = (at: V) => <HeldObjectArt kind="gobinda" x={at.x} y={at.y} s={GOB_S} lifeF={f} />;
  const dollInBalak = f >= TAKE;
  const balakFarLayer = dollInBalak ? <HeldObjectArt kind="doll" x={bj.handFar.x} y={bj.handFar.y - DOLL_GRIP_Y * DOLL_S} s={DOLL_S} lifeF={f} /> : null;
  const balakMidLayer = !gobWithSundar ? gobinda(gobInBalak) : null;

  const glow = bj.glowAnchor;

  return (
    <GhibliStage cam={cam}>
      <GhibliPreload files={PRELOAD} />
      <GhibliPondBackdrop f={f} />

      <GhibliLayer depth={1.0}>
        <GhibliCharFilterDefs f={f} />

        {/* Balak (upstage, at the water's edge) */}
        <GhibliBalakGroundGlow x={balX} y={balY + 4} level={0.42} />
        <GhibliBalakAura cx={glow.x} cy={glow.y} r={58 * bj.headScale} glow={0.55} f={f} />
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={balX} y={balY} rx={36} ry={8} opacity={0.3} />
          <StandingChild {...balakProps} layerFar={balakFarLayer} layerMid={balakMidLayer} />
        </g>

        {/* Sundar (upstage too once he comes up to Balak) */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={sundarX} y={sundarY} rx={46} ry={10} opacity={0.3} />
          <Puppet
            cast={sundar}
            x={sundarX}
            y={sundarY}
            scale={sundarK}
            f={f}
            lifeF={f}
            light={EP04G_POND_LIGHT}
            mouth={() => mouthFromRms(sundarRms(f), f)}
            talk={() => sundarRms(f)}
            acting={() => sundarActing()}
            reachAt={() => sundarReachAt()}
            sigh={(fr) => (fr < CHEST ? 0 : fr < CHEST + 16 ? smooth((fr - CHEST) / 16) : 1 - smooth((fr - CHEST - 16) / 30))}
          />
          {gobWithSundar && gobinda({ x: cupNow.x, y: cupNow.y - GOB_BOTTOM * GOB_S })}
        </g>

        {/* Charu */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={charuX} y={charuY} rx={44} ry={10} opacity={0.28} />
          <Puppet
            cast={charu}
            x={charuX}
            y={charuY}
            scale={K}
            f={f}
            lifeF={f}
            light={EP04G_POND_LIGHT}
            mouth={() => MOUTH_REST}
            acting={() => charuActing()}
            breathRate={f >= FREEZE && f < LOWER ? 1.5 : 1}
            sigh={charuSigh}
          />
        </g>

        {/* the elder cousin */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={cousX} y={cousY} rx={34} ry={8} opacity={0.28} />
          <Puppet
            cast={cous}
            x={cousX}
            y={cousY}
            scale={COUS_S}
            f={cousLeg}
            lifeF={f}
            light={EP04G_POND_LIGHT}
            mouth={() => MOUTH_REST}
            acting={() => cousActing()}
            breathRate={f >= FREEZE && f < LOWER ? 1.6 : 1.1}
          />
        </g>

        {/* the runner cousin (downstage) */}
        <g filter="url(#ghibli-char-ink)">
          <ContactShadow x={runnerX} y={runnerY} rx={34} ry={8} opacity={0.28} />
          <Puppet
            cast={runner}
            x={runnerX}
            y={runnerY}
            scale={RUN_S}
            f={runnerLeg}
            lifeF={f}
            light={EP04G_POND_LIGHT}
            mouth={() => mouthFromRms(runnerRms(f), f)}
            talk={() => runnerRms(f)}
            acting={() => runnerActing()}
            pointAt={() => ({ x: BAL.x, y: BAL.y - 160 })}
            reachAt={() => runnerReachAt()}
            breathRate={f >= BACK1 - 4 && f < REFUSE ? 2.3 : f >= FREEZE && f < LOWER ? 1.7 : 1.1}
            anchors={(a) => {
              runnerAnchors.a = a;
            }}
          />
          <Late
            render={() => {
              const a = runnerAnchors.a;
              if (!a || !runnerHasDoll) return null;
              // the doll in his near (left) hand; at the thrust the hand is at reachAt
              return <HeldObjectArt kind="doll" x={a.lWrist.x + 4} y={a.lWrist.y + 6} s={DOLL_S} lifeF={f} />;
            }}
          />
          <GhibliFootstepDust x={runnerX} y={runnerY} activity={runnerZip ? 1 : f < 110 ? 0.6 : 0} dir={f >= OUT0 && f < BACK0 ? -1 : 1} s={1.25} f={f} />
        </g>
      </GhibliLayer>

      <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} petals />
    </GhibliStage>
  );
};
