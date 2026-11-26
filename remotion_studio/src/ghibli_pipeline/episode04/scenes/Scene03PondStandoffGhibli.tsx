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
import { GhibliCharFilterDefs, GhibliLayer, GhibliPreload, GhibliStage } from "../../GhibliStage";
import { EP04_BALAK_INK, Ep04BalakDivine, Ep04BalakGroundGlow, Ep04BalakInkDefs } from "../Ep04BalakDivine";
import { EP04_BALAK_LOOK } from "../ep04BalakLook";
import { GhibliFootstepDust } from "../../core/GhibliAtmosphere";
import { GhibliGroundCover } from "../../core/GhibliLifeKit";
import { safeBodyTurn, zoomProportionalDof } from "../../core/ghibliMotion";
import { ep04gSpan, ep04gSpeakRms } from "../timing";
import {
  EP04G_CAST,
  EP04G_POND_LIGHT,
  GhibliEp04ForegroundFinish,
  GhibliPondBackdrop,
  GHAT_LAYOUT,
  ghatSpot,
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
// Balak stands right on the bank lip (the water's edge, y ~ 837 here), the pond behind and beside him (Shot 12).
const BAL = { x: 1180, y: 858, s: 0.5, headScale: 1.45 };
const GOB_S = 0.78; // drawing scale of the brass Gobinda in his hands
const GOB_GRIP_Y = 6.9; // grip line below the object's origin (object units)
const GOB_BOTTOM = 32.8; // origin to the base (object units)
const DOLL_S = 1.0; // the wooden doll reads clearly (director audit: was tiny)
const DOLL_GRIP_Y = 2.4;
/** Biru holds the doll lower, round its body (world px below DOLL_GRIP_Y), so his fingers never cover its face. */
const BAL_DOLL_GRIP = 14;

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

/**
 * STAGING (STO-22c, director review 2026-11-24): the brick ghat's right parapet runs diagonally across the bank from
 * (585, 990) to (703, 836), so grass begins at about x = 960 - 0.766 * (y - 500). The family stands IN DEPTH on
 * separate ground lines (feet y 892 to 946), never in one row: Charu (and the silent elder cousin) on the flat ghat
 * landing behind, Sundar downstage on the grass, the runner upstage on Balak's own line by the water (so he reads a
 * head taller than Biru, CHR-09). Every shot is framed so each figure is wholly in frame or wholly out, the soles at
 * or above screen y 810 (caption band, BAL-*).
 */
const MARK = {
  // Sundar DOWNSTAGE on the grass (nearest the camera, the biggest figure), clear of the ghat parapet and of Biru's
  // medium (its left edge ~ 965), never covered by the cousins (speaker medium Shot 13).
  sundar0: { x: 838, y: 978 },
  sundar1: { x: 872, y: 974 },
  // the hand-over mark: up the bank close to Biru's own ground line (his two steps stay level, feet locked)
  sundar2: { x: 986, y: 890 },
  // Charu upstage on the ghat's flat landing (smaller via persp). Taken from the ghat geometry (ghatSpot: step 0 =
  // the landing, at bank level), so she stays on the stones if the ghat is redrawn (it was shortened 2026-11-25)
  charu0: { x: ghatSpot(0.15, 0, 0.8).x, y: ghatSpot(0.15, 0, 0.8).y },
  // then (AG5) down off the landing's front and onto the grass right of the ghat, downstage of its right gate post, so
  // she is wholly inside the Shot 16 two-shot for her sigh (on the landing she was cut by the frame edge by the wall)
  charu1: { x: 700, y: 930 },
  // Elder cousin mid-depth, left of the runner, so the group reads in three depths (Charu / cousins / Sundar)
  cous0: { x: 420, y: 900 },
  cous1: { x: 470, y: 898 },
  cous2: { x: 360, y: 902 },
  // Runner mid-depth (taller read); kept off Sundar's medium; aside upstage for hand-over
  // on the grass right of the ghat, downstage of its right gate post (2026-11-25: the shortened ghat's post stood on
  // his feet at the old marks)
  run0: { x: 700, y: 940 },
  run1: { x: 748, y: 932 },
  run2: { x: 70, y: 942 },
  run3: { x: 1068, y: 880 },
  run4: { x: 1290, y: 852 },
} as const;

/**
 * Ground-plane perspective for the Puppets (the same horizon, y 500, as the ghat's projection): a figure standing
 * further upstage is drawn smaller, so the family reads in depth instead of as cut-outs of one size. 1 at y 930.
 * Biru keeps his designed StandingChild size (BAL rules); the runner's height is set against him on his own line.
 */
const persp = (y: number) => (y - 500) / 430;

/** Is world point (x, y) on the grass (right of the ghat's right parapet)? */
const onGrass = (x: number, y: number) => {
  // ghat edges on the ground are straight lines through the vanishing point (960, 500): x = 960 + k (y - 500)
  const [rw] = GHAT_LAYOUT.rightWallFoot;
  const [ll] = GHAT_LAYOUT.landing;
  const kR = (rw[0] - 960) / (rw[1] - 500);
  const kL = ((ll[0] - 960) / (ll[1] - 500)) * 1.045; // outer face of the left wall
  return x > 960 + kR * (y - 500) + 10 || x < 960 + kL * (y - 500) - 10;
};


/**
 * Soft, grounded contact shadow (outside the ink filter, so it never takes an ink contour): a wide feathered pool cast
 * to the left (sun upper right) and a small occlusion under the feet, multiplied into the ground.
 */
const SoftGroundShadow: React.FC<{ x: number; y: number; rx: number; opacity?: number; id: string }> = ({ x, y, rx, opacity = 1, id }) => (
  <g pointerEvents="none" style={{ mixBlendMode: "multiply" }}>
    <defs>
      <filter id={`${id}-wide`} x="-80%" y="-400%" width="260%" height="900%">
        <feGaussianBlur stdDeviation={rx * 0.28} />
      </filter>
      <filter id={`${id}-near`} x="-70%" y="-350%" width="240%" height="800%">
        <feGaussianBlur stdDeviation={rx * 0.11} />
      </filter>
    </defs>
    <ellipse cx={x - rx * 0.32} cy={y + 4} rx={rx * 1.35} ry={rx * 0.26} fill="#33401c" opacity={0.48 * opacity} filter={`url(#${id}-wide)`} />
    <ellipse cx={x - rx * 0.08} cy={y + 1} rx={rx * 0.72} ry={rx * 0.14} fill="#241d0e" opacity={0.58 * opacity} filter={`url(#${id}-near)`} />
  </g>
);

/**
 * Cover water-plate lily pads that parallax onto the grassy bank (near the water line / mandar).
 * Soft blurred grass washes — never discrete pad ovals — so pads read on water only, not the lawn.
 */
const BankPadCover: React.FC = () => (
  <g pointerEvents="none">
    <defs>
      <filter id="s03-padhide" x="-50%" y="-120%" width="200%" height="340%">
        <feGaussianBlur stdDeviation={16} />
      </filter>
    </defs>
    <ellipse cx={1260} cy={858} rx={360} ry={52} fill="#9fb06a" opacity={0.74} filter="url(#s03-padhide)" />
    <ellipse cx={1180} cy={872} rx={240} ry={38} fill="#90a55d" opacity={0.68} filter="url(#s03-padhide)" />
    <ellipse cx={1380} cy={868} rx={220} ry={36} fill="#849c55" opacity={0.58} filter="url(#s03-padhide)" />
    <ellipse cx={1300} cy={848} rx={180} ry={30} fill="#b3bc80" opacity={0.4} filter="url(#s03-padhide)" />
  </g>
);

/**
 * The rigs draw a faint ambient-occlusion oval under the feet; through the ink filter its low-alpha pixels take the
 * filter's tan mottle and read as a flat grey stand base. This pre-filter drops pixels under about 55% alpha.
 */
const SolidFigureDefs: React.FC<{ id: string }> = ({ id }) => (
  <defs>
    <filter id={id} x="-25%" y="-15%" width="150%" height="130%" colorInterpolationFilters="sRGB">
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0 0 0 0 0 0.45 1 1 1 1" />
      </feComponentTransfer>
    </filter>
  </defs>
);

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
  // the whole line "এটা পুকুরে ছুঁড়ে ফেলে দেব!" (clip 169-228) plays on Balak's medium (Shot 12); the quick cut to
  // the family lands as it ends, and they skid to a halt in that shot (P5)
  const CUT_FAMILY = s3b.to - 2;
  const FREEZE = s3b.to + 2;
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
  // CAST.rama ~10 yrs: a head taller than 5-yr Biru (CHR-09), CHR-08 child head; clearly shorter than the adults.
  const RUN_S = K;
  const runner: CastMember = { ...C.runner, height: 1.72, headScale: EP06_CHILD_HEAD };
  // leg clock: x 3.6 during the zips so his feet stay planted at a cartoon sprint
  const zipRate = 3.6;
  const zipped = (a: number, b: number) => clamp(f - a, 0, b - a) * (zipRate - 1);
  const runnerClock = f + zipped(OUT0, OUT1) + zipped(BACK0, BACK1);
  const rcAt = (fr: number) => fr + clamp(fr - OUT0, 0, OUT1 - OUT0) * (zipRate - 1) + clamp(fr - BACK0, 0, BACK1 - BACK0) * (zipRate - 1);
  // legs (on the runner's clock) — bodyTurn always safeBodyTurn-clamped
  // Enter along the water line, finishing left of Sundar so he is never stacked/covered on the rush-in.
  const rEnter: WalkOpts = { start: 8, dur: 118, fromX: 60, toX: MARK.run0.x, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "run", child: true, startIn: 4, stopIn: 14, bodyTurn: safeBodyTurn(0.32) };
  const rCreep: WalkOpts = { start: 175, dur: 190, fromX: MARK.run0.x, toX: MARK.run1.x, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "hurry", child: true, startIn: 18, stopIn: 4, bodyTurn: safeBodyTurn(0.34) };
  const rBack: WalkOpts = { start: WAVE + 16, dur: 64, fromX: MARK.run1.x, toX: MARK.run2.x, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "run", child: true, startIn: 8, stopIn: 10, bodyTurn: safeBodyTurn(-0.34) };
  const rOut: WalkOpts = { start: rcAt(OUT0), dur: rcAt(OUT1) - rcAt(OUT0) + 6, fromX: MARK.run2.x, toX: -280, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "run", child: true, startIn: 10, stopIn: 2, bodyTurn: safeBodyTurn(-0.34) };
  const rIn: WalkOpts = { start: rcAt(BACK0), dur: rcAt(BACK1) - rcAt(BACK0), fromX: -280, toX: MARK.run3.x, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "run", child: true, startIn: 2, stopIn: 22, bodyTurn: safeBodyTurn(0.34) };
  // at "সুন্দর জ্যেঠাকে দেব!" he steps aside, upstage, behind Biru (out of the hand-over), and turns to watch
  const ASIDE = WALK0 - 4;
  const rStepAside: WalkOpts = { start: ASIDE, dur: 40, fromX: MARK.run3.x, toX: MARK.run4.x, scale: RUN_S, height: runner.height, seed: runner.seed, kind: "hurry", child: true, startIn: 8, stopIn: 10, bodyTurn: safeBodyTurn(0.32) };
  // the freeze: his legs stop mid-stride
  const freezeClock = (clk: number) => (f >= FREEZE && f < UNFREEZE ? rcAt(FREEZE) : clk);
  const runnerLeg = freezeClock(runnerClock);
  let runnerX: number;
  let runnerWalk: Partial<Pose> = {};
  if (f < 175) {
    const w = walker(runnerLeg, rEnter);
    // hold off-left until enter starts so Shot 11 does not park him on Sundar
    runnerX = w.x;
    runnerWalk = w.pose;
  } else if (f < WAVE + 16) {
    const w = walker(runnerLeg, rCreep);
    runnerX = w.x;
    runnerWalk = w.pose;
  } else if (f < OUT0) {
    const w = walker(runnerLeg, rBack);
    runnerX = w.x;
    // scampers back to the landing, then turns round to watch Biru again
    runnerWalk = { ...w.pose, bodyTurn: safeBodyTurn(lerp(-0.34, 0.32, smooth((f - (WAVE + 16 + 62)) / 12))) };
  } else if (f < BACK0) {
    const w = walker(runnerClock, rOut);
    runnerX = w.x;
    runnerWalk = w.pose;
  } else if (f < ASIDE) {
    const w = walker(runnerClock, rIn);
    runnerX = w.x;
    runnerWalk = w.pose;
  } else {
    const w = walker(runnerClock, rStepAside);
    runnerX = w.x;
    runnerWalk = {
      ...w.pose,
      bodyTurn: safeBodyTurn(f < ASIDE + 36 ? 0.32 : lerp(0.32, -0.3, smooth((f - (ASIDE + 36)) / 12))),
    };
  }
  // his ground line: in from the ghat to Biru's line by the water; out along the lower bank and back; aside, upstage
  const runnerY =
    f < OUT0
      ? f < WAVE + 16
        ? lerp(948, MARK.run0.y, smooth((f - 10) / 96))
        : lerp(MARK.run1.y, MARK.run2.y, smooth((f - (WAVE + 16)) / 64))
      : f < BACK0
        ? lerp(MARK.run2.y, 946, smooth((f - OUT0) / 14))
        : f < ASIDE
          ? // back along the front of the ghat (downstage of the posts), then up the bank to Biru once past them
            lerp(946, MARK.run3.y, smooth((runnerX - 690) / (MARK.run3.x - 690)))
          : lerp(MARK.run3.y, MARK.run4.y, smooth((f - ASIDE) / 40));
  const runnerZip = (f >= OUT0 && f < OUT1 + 4) || (f >= BACK0 && f < BACK1 - 4);
  const runnerHasDoll = f >= BACK0 && f < TAKE;
  const runnerRms = (fr: number) => ep04gSpeakRms(SCENE_ID, ["03a_Family_Shout.wav", "03e_Runner_Handover.wav"], fr);

  /* ---------------- the elder cousin (silent) ---------------- */
  // the elder cousin (~9) must read clearly taller than five-year-old Biru (CHR-09); a touch shorter than the runner
  const cous: CastMember = { ...C.elderBrother, height: 1.62 };
  const COUS_S = K;
  const cEnter: WalkOpts = { start: 4, dur: 120, fromX: 20, toX: MARK.cous0.x, scale: COUS_S, height: cous.height, seed: cous.seed, kind: "run", child: true, startIn: 4, stopIn: 14, bodyTurn: safeBodyTurn(0.3) };
  const cCreep: WalkOpts = { start: 182, dur: 184, fromX: MARK.cous0.x, toX: MARK.cous1.x, scale: COUS_S, height: cous.height, seed: cous.seed, kind: "hurry", child: true, startIn: 18, stopIn: 4, bodyTurn: safeBodyTurn(0.32) };
  const cBack: WalkOpts = { start: WAVE + 10, dur: 30, fromX: MARK.cous1.x, toX: MARK.cous2.x, scale: COUS_S, height: cous.height, seed: cous.seed, kind: "hurry", child: true, startIn: 6, stopIn: 8, bodyTurn: safeBodyTurn(0.28) };
  const cousLeg = f >= FREEZE && f < UNFREEZE ? FREEZE : f;
  const cw = f < 182 ? walker(cousLeg, cEnter) : f < WAVE + 10 ? walker(cousLeg, cCreep) : walker(cousLeg, cBack);
  const cousX = cw.x;
  // stay on the ghat landing (upstage of Sundar) — never share his downstage grass line
  // in along the grass in front of the ghat, then diagonally up onto the landing (clear of the left wall and post)
  const enterY = (x: number, x0: number, x1: number, y1: number) => lerp(974, y1, smooth((x - x0) / (x1 - x0)));
  const cousY =
    f < 182
      ? enterY(cousX, 140, MARK.cous0.x, MARK.cous0.y)
      : f < WAVE + 10
        ? lerp(MARK.cous0.y, MARK.cous1.y, smooth((f - 182) / 184))
        : MARK.cous2.y;

  /* ---------------- Sundar ---------------- */
  const sundar = C.sundar;
  const sEnter: WalkOpts = { start: 0, dur: 130, fromX: 150, toX: MARK.sundar0.x, scale: K, height: sundar.height, seed: sundar.seed, kind: "hurry", startIn: 6, stopIn: 16, bodyTurn: safeBodyTurn(0.3) };
  const sStep: WalkOpts = { start: STEP, dur: 44, fromX: MARK.sundar0.x, toX: MARK.sundar1.x, scale: K, height: sundar.height, seed: sundar.seed, startIn: 10, stopIn: 12, bodyTurn: safeBodyTurn(0.32) };
  // he waits at his mark (out of the runner's two-shot) and comes up to Biru as Biru says he will give it to him
  const APPROACH = WALK0 - 10;
  const sApproach: WalkOpts = { start: APPROACH, dur: 50, fromX: MARK.sundar1.x, toX: MARK.sundar2.x, scale: K, height: sundar.height, seed: sundar.seed, kind: "hurry", startIn: 8, stopIn: 14, bodyTurn: safeBodyTurn(0.34) };
  // functions of the scene frame, so the Puppet can sample Sundar's acting at neighbouring frames (eased poses,
  // overlap and eye-lead for adults, MOT-10/11)
  const sundarWalkAt = (s: number) => (s < STEP ? walker(s, sEnter) : s < APPROACH ? walker(s, sStep) : walker(s, sApproach));
  const sw = sundarWalkAt(f);
  const sundarX = sw.x;
  const apT = smooth((f - APPROACH) / 50);
  const sundarY = f < APPROACH ? lerp(MARK.sundar0.y, MARK.sundar1.y, smooth((f - STEP) / 44)) : lerp(MARK.sundar1.y, MARK.sundar2.y, apT);
  const sundarK = K * persp(sundarY);
  const sundarRms = (fr: number) => ep04gSpeakRms(SCENE_ID, ["03c_Sundar_Coax.wav"], fr);

  /* ---------------- Charu ---------------- */
  const charu = C.charu;
  const chEnter: WalkOpts = { start: 10, dur: 140, fromX: -20, toX: MARK.charu0.x, scale: K, height: charu.height, seed: charu.seed, kind: "hurry", startIn: 8, stopIn: 18, bodyTurn: safeBodyTurn(0.28) };
  const chUp: WalkOpts = { start: OUT0 + 20, dur: 80, fromX: MARK.charu0.x, toX: MARK.charu1.x, scale: K, height: charu.height, seed: charu.seed, startIn: 12, stopIn: 18, bodyTurn: safeBodyTurn(0.3) };
  const charuWalkAt = (s: number) => (s < OUT0 + 20 ? walker(s, chEnter) : walker(s, chUp));
  const chw = charuWalkAt(f);
  const charuX = chw.x;
  // down to the front of the landing first, past the right gate post (feet downstage of it), then up onto the grass
  const charuY =
    f < OUT0 + 20
      ? enterY(charuX, 120, MARK.charu0.x, MARK.charu0.y)
      : charuX < 610
        ? lerp(MARK.charu0.y, 944, smooth((charuX - MARK.charu0.x) / (610 - MARK.charu0.x)))
        : lerp(944, MARK.charu1.y, smooth((charuX - 610) / (MARK.charu1.x - 610)));
  const charuK = K * persp(charuY);

  /* ---------------- Balak ---------------- */
  // Shot 14's "এখানে" (here): the far hand pats down at the ground in front of him while the near hand keeps the
  // Gobinda at his chest
  const PAT0 = HERE - 16;
  const standKeys: StandKey[] = [
    { at: -60, pose: "holdOut" },
    // upright standoff (handInHands = upright, both hands on scene targets); reachGrab is a bend pose (hard lean)
    { at: STOP, pose: "handInHands", blend: 16 },
    { at: LOWER, pose: "holdOut", blend: 26 },
    { at: PAT0, pose: "handInHands", blend: 16 },
  ];
  const st = standAt(f, standKeys);

  // Two steps to Sundar ("সুন্দর জ্যেঠাকে দেব!"), feet locked (legDrive, MOT-06): the body travels level along the
  // bank (a pure screen-x move, so the planted feet can be held exactly), near foot, far foot, near foot closes.
  const WALK_D = 156; // figure units (78 world px at s 0.5)
  const walkU = (fr: number) => smooth((fr - WALK0) / (WALK1 - WALK0));
  const STEPS: Array<{ near: boolean; t0: number; t1: number; from: number; to: number }> = [
    { near: true, t0: WALK0 + 1, t1: WALK0 + 10, from: 0, to: 0.55 * WALK_D },
    { near: false, t0: WALK0 + 11, t1: WALK0 + 21, from: 0, to: WALK_D },
    { near: true, t0: WALK0 + 23, t1: WALK0 + 32, from: 0.55 * WALK_D, to: WALK_D },
  ];
  const footAt = (fr: number, near: boolean): { d: number; lift: number; pitch: number } => {
    let d = 0;
    for (const sp of STEPS) {
      if (sp.near !== near) continue;
      if (fr < sp.t0) break;
      if (fr < sp.t1) {
        const u = (fr - sp.t0) / (sp.t1 - sp.t0);
        const e = u * u * (3 - 2 * u);
        const pitch = u < 0.5 ? 0.24 * (1 - u / 0.5) : -0.18 * Math.sin(((u - 0.5) / 0.5) * (Math.PI / 2));
        return { d: lerp(sp.from, sp.to, e), lift: 9 * Math.sin(Math.PI * u), pitch };
      }
      d = sp.to;
    }
    return { d, lift: 0, pitch: 0 };
  };
  const YAW_WALK = 0.85; // his yaw during the walk (0.6 + 0.25 after LOWER)
  const WCA = Math.cos(((55 * Math.PI) / 180) * YAW_WALK);
  const WSA = Math.sin(((55 * Math.PI) / 180) * YAW_WALK);
  const walking = f >= WALK0 && f <= WALK1 + 2;
  const walkD = WALK_D * walkU(f);
  const balX = BAL.x - BAL.s * walkD;
  const balY = BAL.y;
  const loc = (P: V): V => standingLocal(P, balX, balY, BAL.s, true);

  // The playful lean during the threat (Shot 12): back toward the water, with a teasing sway (figure pitch, radians)
  const leanW = smooth((f - (STOP - 6)) / 18) * (1 - smooth((f - LOWER) / 20));
  const threatLean = leanW * (-0.11 - 0.04 * smooth((f - THREAT) / 10) + 0.035 * Math.sin((f - STOP) * 0.11));
  let legDrive: StandingChildProps["legDrive"] = undefined;
  if (walking) {
    const n = footAt(f, true);
    const fs = footAt(f, false);
    const live = 1 - clamp((f - (WALK1 - 3)) / 5);
    const swing = STEPS.find((sp) => f >= sp.t0 && f < sp.t1);
    const su = swing ? (f - swing.t0) / (swing.t1 - swing.t0) : 0;
    const stanceNear = swing ? !swing.near : true;
    const weight = swing ? Math.sin(Math.PI * su) : 0.15;
    legDrive = {
      near: { x: (n.d - walkD) * WCA, z: (n.d - walkD) * WSA, lift: n.lift, pitch: n.pitch },
      far: { x: (fs.d - walkD) * WCA, z: (fs.d - walkD) * WSA, lift: fs.lift, pitch: fs.pitch },
      pelvisDrop: live * (swing ? 1.2 + 1.8 * Math.sin(Math.PI * su) : 0.8),
      lean: 0.06 * live,
      shiftX: live * (stanceNear ? -2 : 2) * weight,
      hipTilt: live * (stanceNear ? 1.4 : -1.4) * weight,
    };
  } else if (leanW > 0.001) {
    legDrive = { lean: threatLean };
  }

  // hand targets in figure units (facing +x before the flip = toward the family)
  // The standoff (Shot 12): the Gobinda held up at arm's length BEHIND him, over the water (screen right, away from
  // the family), the other palm up toward them ("stop"). On the threat it goes further out and a little up, then
  // teeters; idle life (the sway, little pats of the stop hand) keeps the long hold alive (MOT-13).
  const OUT_SIDE: V = { x: -98, y: -402 };
  const OUT_HIGH: V = { x: -116, y: -438 };
  const STOP_PALM: V = { x: 128, y: -368 };
  const thr = smooth((f - THREAT) / 10) * (1 - smooth((f - (s3c.from + 20)) / 40));
  const sideNow: V = {
    x: lerp(OUT_SIDE.x, OUT_HIGH.x, thr) + 4 * Math.sin(f * 0.043) + thr * 3 * Math.sin(f * 0.31),
    y: lerp(OUT_SIDE.y, OUT_HIGH.y, thr) + 5 * Math.sin(f * 0.061 + 1.2) + thr * 2 * Math.sin(f * 0.23),
  };
  // the stop hand: little pats toward the family on "এসো না বলছি!", a second push on "আর এক পা এলেই...", then a
  // resting palm that drifts and sinks as Sundar starts to talk
  const patA = f >= STOP && f < STOP + 40 ? Math.sin(((f - STOP) / 40) * Math.PI * 3) * (1 - (f - STOP) / 40) : 0;
  const patB = f >= THREAT - 60 && f < THREAT - 20 ? Math.sin(((f - (THREAT - 60)) / 40) * Math.PI * 2) * (1 - (f - (THREAT - 60)) / 40) : 0;
  const stopNow: V = {
    x: STOP_PALM.x + 8 * patA + 10 * patB + 3 * Math.sin(f * 0.037 + 0.5),
    y: STOP_PALM.y + 4 * Math.sin(f * 0.052 + 2.1) + 20 * smooth((f - (s3c.from + 30)) / 40),
  };

  // the doll in the runner's hands (world): where he holds it out
  // held out at Biru's chest height, so his far hand comes straight forward to take it
  const dollThrustAt: V = { x: BAL.x - 54, y: BAL.y - 158 };
  // the Gobinda's world grip point while Balak hands it over (Sundar's cupped palms come under its base)
  const giveAt: V = { x: BAL.x - BAL.s * WALK_D - 50, y: BAL.y - 150 };
  const gobBaseDrop = (GOB_BOTTOM - GOB_GRIP_Y) * GOB_S; // grip line to the base, world px

  let handTargets: StandingChildProps["handTargets"] = undefined;
  let heldAt: V | undefined = undefined;
  if (f >= STOP && f < LOWER) {
    handTargets = { near: sideNow, far: stopNow };
  } else if (st.pose === "handInHands") {
    // Shot 14: "এখানে": the far hand pats down twice at the ground in front of him, then rests
    // Shot 15: far hand to the doll (then holds it to his chest), near hand keeps the Gobinda (pulled away)
    // Shot 16: the doll stays tucked under his far arm, against his chest; BOTH hands go to the Gobinda (near hand at
    // its waist, far hand under its base) and put it into Sundar's cupped palms; they let go only once his palms are
    // under it (MOT-07)
    const farRest: V = { x: 34, y: -262 };
    const patY = (fr: number) => {
      const u = (fr - (HERE - 4)) / 30;
      return u <= 0 || u >= 1 ? 0 : 14 * Math.abs(Math.sin(u * Math.PI * 2));
    };
    const farPat: V = { x: 96, y: -232 + 1.6 * patY(f) };
    const tPat = smooth((f - PAT0) / 14) * (1 - smooth((f - (HERE + 30)) / 16));
    const tDoll = smooth((f - (TAKE - 22)) / 20);
    const farDoll = loc({ x: dollThrustAt.x, y: dollThrustAt.y + DOLL_GRIP_Y * DOLL_S + 2 + BAL_DOLL_GRIP });
    const farHug: V = { x: 30, y: -284 };
    const nearGive = loc(giveAt);
    const farGive = loc({ x: giveAt.x + 3, y: giveAt.y + gobBaseDrop + 2 });
    let far: V;
    if (f < TAKE - 22) far = { x: lerp(farRest.x, farPat.x, tPat), y: lerp(farRest.y, farPat.y, tPat) };
    else if (f < TAKE + 6) far = { x: lerp(farRest.x, farDoll.x, tDoll), y: lerp(farRest.y, farDoll.y, tDoll) };
    else if (f < WALK0) far = { x: lerp(farDoll.x, farHug.x, smooth((f - (TAKE + 6)) / 16)), y: lerp(farDoll.y, farHug.y, smooth((f - (TAKE + 6)) / 16)) };
    else if (f < RELEASE) {
      const t = smooth((f - WALK0) / (GIVE - 6 - WALK0));
      far = { x: lerp(farHug.x, farGive.x, t), y: lerp(farHug.y, farGive.y, t) };
    } else far = { x: lerp(farGive.x, farHug.x, smooth((f - RELEASE) / 14)), y: lerp(farGive.y, farHug.y + 8, smooth((f - RELEASE) / 14)) };
    const nearChest: V = { x: 40, y: -300 };
    const nearAway: V = { x: -46, y: -296 };
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
  // Shot 14 face: "দিতে পারি—" a sly sideways look, "যদি তোমরা আমায় কিছু না বলো।" eyes back on them, "এখানে" eyes
  // down to the spot; Shot 15 on the doll as he takes it; Shot 16 up at Sundar
  const lookDown = smooth((f - (HERE - 8)) / 6) * (1 - smooth((f - (HERE + 26)) / 8)) + smooth((f - (TAKE - 18)) / 6) * (1 - smooth((f - (TAKE + 10)) / 8));
  const sly = smooth((f - s3d.from) / 8) * (1 - smooth((f - (s3d.from + 30)) / 10));
  const balakProps: StandingChildProps = {
    x: balX,
    y: balY,
    s: BAL.s,
    headScale: BAL.headScale,
    build: "healthy",
    sturdy: true,
    age: 5,
    flip: true,
    yaw: 0.6 + 0.25 * smooth((f - LOWER) / 22),
    f,
    lifeF: f,
    pose: st.pose,
    poseStart: st.poseStart,
    prevPose: st.prevPose,
    prevPoseStart: st.prevPoseStart,
    blendFrames: st.blendFrames,
    stance: 0.42,
    handTargets,
    heldAt,
    palmUp: f >= PAT0 && f < TAKE - 22 ? 0.05 : 0.3,
    noteAt: { x: 46, y: -300 },
    noteW: (2 * 9.8 * GOB_S) / BAL.s,
    noteAngle: -2,
    expression,
    mouth: balakRms,
    talk: balakRms > 0.06 ? 1 : 0,
    headShake,
    face: { lookX: 0.55 - 0.35 * lookDown + 0.25 * sly, eyesDown: 0.6 * lookDown, smile: 0.35 + 0.25 * sly },
    legDrive,
    ...EP04_BALAK_LOOK,
  };
  const bj = standingChildJoints(balakProps);

  // the Gobinda in Balak's hands: grip line at the near palm, or centred between the pinches (holdOut)
  const gobByNear: V = { x: bj.handNear.x, y: bj.handNear.y - GOB_GRIP_Y * GOB_S };
  const gobByNote: V | null = bj.note ? { x: bj.note.anchor.x, y: bj.note.anchor.y - GOB_GRIP_Y * GOB_S } : null;
  let gobInBalak: V;
  if (st.pose === "holdOut") {
    gobInBalak = st.prevPose === "handInHands" && gobByNote ? { x: lerp(gobByNear.x, gobByNote.x, st.k), y: lerp(gobByNear.y, gobByNote.y, st.k) } : (gobByNote ?? gobByNear);
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
      bodyTurn: safeBodyTurn(runnerWalk.bodyTurn ?? 0.32),
      headHands: 0.62 * frozenUp,
      jab: -0.9 * jab,
      // "এই নে তোর কাঠের পুতুল!": the doll held out in BOTH hands (hold -> holdAt), a panting lean in
      hold: thrust,
      lean: (runnerWalk.lean ?? p.lean) + 6 * thrust + 4 * grab,
      // "দে, এবার গোবিন্দ দে!": one open palm out, asking for the Gobinda
      reach: grab > 0.01 ? grab : 0,
      reachUp: 0.85,
      lHand: thrust > 0.01 || carry ? "relaxed" : p.lHand,
      rHand: grab > 0.01 || thrust > 0.01 ? "open" : p.rHand,
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
    return {
      ...p,
      ...cw.pose,
      bodyTurn: safeBodyTurn(f >= WAVE + 10 ? 0.28 : cw.pose.bodyTurn ?? 0.3),
      throwUp: 0.85 * up,
      headTurn: f >= OUT0 && f < BACK1 ? -0.25 : 0.1,
    } as Pose;
  };

  // Sundar (frame-functional: the Puppet samples it at neighbouring frames for eased poses and overlap)
  const sundarBase = makeActing<Pose>(poseOf({ smile: 0.2 }), [
    MK({ f: 0, brow: 0.5, smile: 0 }),
    // arriving: he takes in the scene, then calms the cousins (palms down) as they start to creep
    MK({ f: 128, in: 12, brow: 0.6, lean: 3, headTilt: -2 }),
    MK({ f: FREEZE, in: 6, brow: 0.85, gasp: 0.2, lean: -3 }),
    MK({ f: WAVE, in: 6, gasp: 0, brow: 0.4, lean: 2 }),
    MK({ f: STEP + 10, in: 16, smile: 0.5, brow: 0.3, lean: 6, headTilt: 5 }),
    MK({ f: PALMS, in: 12, lean: 9, headTilt: 7, smile: 0.55, headNod: 3 }),
    MK({ f: MELA, in: 12, lean: 4, headTilt: 3, headTurn: -0.12 }),
    MK({ f: MELA + 34, in: 10, headTurn: 0.05, lean: 6 }),
    MK({ f: KEMON, in: 8, headTilt: 10, smile: 0.65, headNod: 2 }),
    MK({ f: KEMON + 30, in: 12, headTilt: 4, lean: 3, smile: 0.45, headNod: 0 }),
    MK({ f: NOD, in: 6, headNod: 9, headTurn: 0.15 }),
    MK({ f: NOD + 10, in: 6, headNod: 0, headTurn: 0 }),
    MK({ f: CUPPED, in: 10, lean: 10, smile: 0.5, headTilt: 6, eyeY: 0.5 }),
    MK({ f: CHEST + 20, in: 18, lean: 2, smile: 0.8, headTilt: 9, brow: 0.1, eyeY: 0.3 }),
  ]);
  /** Sundar's gesture weights (scene frame). */
  const sunGest = (s: number) => {
    // calming palms on arrival (03a's "এক্ষুনি আয় বলছি!" and the cousins' creep) and again on "আরে থামো সবাই"
    const calmA = s >= 132 && s < 210 ? smooth((s - 132) / 10) * (1 - smooth((s - 196) / 14)) : 0;
    const calmB = s >= WAVE - 4 && s < STEP ? smooth((s - (WAVE - 4)) / 8) * (1 - smooth((s - (STEP - 12)) / 12)) : 0;
    // "গোবিন্দটা আমায় দিয়ে দাও—": one open palm held out to Biru
    const palm = s >= PALMS - 8 && s < MELA + 6 ? smooth((s - (PALMS - 8)) / 10) * (1 - smooth((s - (MELA - 2)) / 8)) : 0;
    // "তোমায় মেলা থেকে আরও একটা...": a point back over his shoulder, toward the house and the fair road
    const point = s >= MELA - 2 && s < KEMON + 4 ? smooth((s - (MELA - 2)) / 8) * (1 - smooth((s - (MELA + 40)) / 10)) : 0;
    // "...নতুন পুতুল কিনে দেব, কেমন?": the open palm again, coaxing, lowered before the cut to Biru (Shot 14)
    const coax = s >= MELA + 40 && s < KEMON + 34 ? smooth((s - (MELA + 40)) / 10) * (1 - smooth((s - (KEMON + 20)) / 12)) : 0;
    // Shot 16: his two hands come out cupped and WAIT as Biru walks up, then take the Gobinda's weight
    const receive = s >= WALK0 + 10 ? smooth((s - (WALK0 + 10)) / 16) : 0;
    return { calm: Math.max(calmA, calmB), palm: Math.max(palm, coax), point, receive };
  };
  const sundarActing = (s: number): Pose => {
    const p = sundarBase(s);
    const w = sundarWalkAt(s).pose;
    const g = sunGest(s);
    // the calming pat: palm down, a slow up-and-down the rig's easing keeps
    const pat = Math.sin((s - 132) * 0.3);
    return {
      ...p,
      ...w,
      bodyTurn: safeBodyTurn(w.bodyTurn ?? 0.3),
      lean: (w.lean ?? 0) + p.lean,
      reach: g.calm > 0.01 ? g.calm : g.palm > 0.01 ? g.palm : 0,
      reachUp: g.calm > 0.01 ? 0 : 0.95,
      jab: -g.point,
      cupHands: g.receive,
      rHand: "open",
      lHand: g.receive > 0.3 ? "open" : p.lHand,
      rE: (w.rE ?? p.rE) + g.calm * 10 * pat,
    } as Pose;
  };
  const sundarReachAt = (): V => {
    // the calming pat (palm down, at his waist, out toward the cousins)
    if (f < 220 || (f >= WAVE - 4 && f < STEP)) return { x: sundarX + 110, y: sundarY - 200 + 14 * Math.sin((f - 132) * 0.3) };
    // the open palm held out toward Biru, at his chest height
    if (f < WALK0 + 10) return { x: sundarX + 118, y: sundarY - 236 + 3 * Math.sin(f * 0.07) };
    // the waiting cup, low in front of him, then under the Gobinda's base as Balak brings it
    const wait: V = { x: sundarX + 78, y: sundarY - 176 + 2 * Math.sin(f * 0.09) };
    const k = smooth((f - (GIVE - 16)) / 14);
    return { x: lerp(wait.x, cupNow.x, k), y: lerp(wait.y, cupNow.y, k) };
  };

  // Charu
  const charuBase = makeActing<Pose>(poseOf({}), [
    MK({ f: 0, brow: 0.6, browTilt: 0.4 }),
    // hurrying in, she sees him at the water's edge: a hand to her mouth, then lowered a little as she stops
    MK({ f: 50, in: 12, mouthHand: -0.85, brow: 0.8, gasp: 0.15 }),
    MK({ f: 140, in: 14, mouthHand: -0.45, gasp: 0 }),
    MK({ f: 160, in: 10, mouthHand: -0.35 }),
    MK({ f: FREEZE, in: 5, ease: "out", mouthHand: -1, brow: 1, gasp: 0.3, lean: -4 }),
    MK({ f: UNFREEZE + 30, in: 14, mouthHand: -0.4, gasp: 0, brow: 0.6, lean: 0 }),
    MK({ f: TAKE, in: 14, mouthHand: 0, brow: 0.4 }),
    MK({ f: CHEST + 4, in: 16, brow: 0.1, browTilt: 0, smile: 0.6, headTilt: 6 }),
  ]);
  const charuActing = (fr: number): Pose => {
    const w = charuWalkAt(fr).pose;
    return { ...charuBase(fr), ...w, bodyTurn: safeBodyTurn(w.bodyTurn ?? 0.28) } as Pose;
  };
  const charuSigh = (fr: number) => (fr < SIGH ? 0 : fr < SIGH + 18 ? smooth((fr - SIGH) / 18) : 1 - smooth((fr - SIGH - 18) / 28));

  /* ---------------- camera ---------------- */
  // screen = centre + zoom * (world - cam - centre). frame() pins world x `wx` to screen x `sx` and the soles line
  // `soleY` (ground contact + 10: soles read a little below it) to screen y `sy` (at or above 810: caption band).
  const frame = (wx: number, sx: number, soleY: number, sy: number, z: number): Cam => ({
    x: wx - 960 - (sx - 960) / z,
    y: soleY - 540 - (sy - 540) / z,
    zoom: z,
  });
  // Biru's medium shot (Shots 12 and 14) at the water's edge: he stands left of centre facing the family (off left),
  // the Gobinda held out over the water to the right, the mandar trunk framing the right third. The left edge (~965
  // world) stays clear of Sundar (downstage at x <= 872 + his half width), so nobody is cut by the edge.
  const biruMedium = (z: number): Cam => frame(BAL.x, 560, BAL.y + 10, 800, z);
  // the doll insert inside Shot 15 (thrust -> Balak's far hand closes on it)
  const INSERT0 = THRUST - 6;
  const INSERT1 = TAKE + 16;
  let cam: Cam;
  if (f < s3b.from - 6) {
    // Shot 11: wide bank shot, the family rushing in from the ghat, every figure wholly in frame (left edge ~ -100),
    // all soles above the caption (Sundar, the most downstage, pinned at 806)
    cam = frame(1180, lerp(1472, 1440, smooth(f / 150)), MARK.sundar0.y + 10, 806, 1.15);
  } else if (f < CUT_FAMILY) {
    // Shot 12: medium on Balak at the water's edge, a felt push as the threat builds; the whole line plays here
    cam = biruMedium(lerp(2.42, 2.6, smooth((f - s3b.from) / 200)));
  } else if (f < s3c.from - 6) {
    // P5 quick cut: the family skids to a halt IN DEPTH - Sundar downstage, the cousins mid, Charu far on the landing
    cam = frame(575, 960, MARK.sundar0.y + 10, 812, 1.72);
  } else if (f < s3d.from - 6) {
    // Shot 13: Sundar (speaker) big and downstage at the left third, his whole head clear of the top, soles above the
    // caption; he faces Balak, who stays small by the water at the right (the ghat parapet mostly out at the left)
    const push = smooth((f - s3c.from) / 120);
    cam = frame(sundarX, lerp(420, 428, push), sundarY + 10, 806, lerp(1.84, 1.92, push));
  } else if (f < ag5.from - 6) {
    // Shot 14: medium on Balak (cut 6 f before 03d)
    cam = biruMedium(2.5);
  } else if (f < s3e.from - 2) {
    // AG5: wide, the runner's dash to the house and back (he starts from beyond the ghat, at the left of the frame)
    cam = frame(MARK.run2.x, 170, MARK.sundar1.y + 10, 806, 1.2);
  } else if (f >= INSERT0 && f < INSERT1) {
    // Shot 15 insert: the bright wooden doll thrust at Balak, big in frame, his hand closing on it
    cam = frame(dollThrustAt.x + 12, 960, dollThrustAt.y + 6, 540, 4.6);
  } else if (f < WALK0 - 6) {
    // Shot 15: medium three-shot - the panting runner (taller, on Balak's line) thrusting the doll, Balak by the
    // water, Sundar wholly in at the left; heads clear of the top, all soles above the caption
    cam = frame(760, 0, MARK.sundar1.y + 10, 806, 1.6);
  } else {
    // Shot 16 + P6: two-shot Balak and Sundar (Charu watching behind at the left, the runner aside upstage), the
    // blueprint's gentle push 1.0 -> ~1.1x; soles pinned to Sundar's as he comes up the bank
    const t = smooth((f - (WALK0 - 6)) / (sceneEnd - WALK0 + 6));
    cam = frame(1035, 960, sundarY + 10, 806, lerp(1.95, 2.14, t));
  }
  cam.focus = 1;
  cam.dof = zoomProportionalDof(cam.zoom);

  /* ---------------- objects ---------------- */
  const gobinda = (at: V) => <HeldObjectArt kind="gobinda" x={at.x} y={at.y} s={GOB_S} lifeF={f} />;
  const dollInBalak = f >= TAKE;
  // the doll in his far hand; from the walk on it stays tucked under his far arm against his chest (the far forearm
  // drawn over it) while both hands carry the Gobinda
  const dollPark: V = { x: balX - 30 * BAL.s, y: balY - 284 * BAL.s };
  // (back into his far hand once the Gobinda is given and the hand comes home)
  const dollHandK = smooth((f - WALK0) / 6) * (1 - smooth((f - (RELEASE + 10)) / 8));
  const dollAt: V = { x: lerp(bj.handFar.x, dollPark.x, dollHandK), y: lerp(bj.handFar.y, dollPark.y, dollHandK) };
  const balakFarLayer = dollInBalak ? <HeldObjectArt kind="doll" x={dollAt.x} y={dollAt.y - DOLL_GRIP_Y * DOLL_S - 2 - BAL_DOLL_GRIP} s={DOLL_S} rot={-8 * dollHandK} lifeF={f} /> : null;
  const balakMidLayer = !gobWithSundar ? gobinda(gobInBalak) : null;

  const glow = bj.glowAnchor;

  // Every figure: a soft ground shadow (and grass blades over its edge when it stands on the grass), then the figure
  // through the AO-dropping pre-filter and the ink filter. Drawn far to near (ground line y), so depth stays honest.
  const grounded = (key: string, x: number, y: number, rx: number, figure: React.ReactNode, extra?: React.ReactNode, underFigure?: React.ReactNode) => (
    <g key={key}>
      <SoftGroundShadow id={`s03-${key}-sh`} x={x + 4} y={y} rx={rx} />
      {underFigure}
      {/* Balak (key "bal") takes his own fine ink; everyone else the shared character ink */}
      <g filter={key === "bal" ? `url(#${EP04_BALAK_INK})` : "url(#ghibli-char-ink)"}>
        <g filter="url(#s03-solid)">{figure}</g>
        {extra}
      </g>
      {onGrass(x, y) && <GhibliGroundCover x={x + 2} y={y + 5} w={rx * 2.4} lifeF={f + rx} s={1.1} preset="pond" part="front" litter={false} />}
    </g>
  );
  const figures: Array<{ y: number; node: React.ReactNode }> = [
    {
      y: balY,
      node: (
        <g key="balak">
          {/* Balak (at the water's edge) */}
          {/* the restrained resting aura (BAL-05..09): a soft halo behind the head and a warm pool at his feet, laid
              over the contact shadow so the multiply does not swallow it - never the big glow beat */}
          <Ep04BalakDivine cx={glow.x} cy={glow.y} r={64 * bj.headScale} glow={0.78} f={f} />
          {grounded(
            "bal",
            balX,
            balY,
            46,
            <StandingChild {...balakProps} inkZoom={cam.zoom} layerFar={balakFarLayer} layerMid={balakMidLayer} />,
            undefined,
            <Ep04BalakGroundGlow x={balX} y={balY + 3} rx={96} ry={17} level={0.72} />,
          )}
        </g>
      ),
    },
    {
      y: sundarY,
      node: grounded(
        "sun",
        sundarX,
        sundarY,
        58,
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
          acting={(fr) => sundarActing(fr)}
          pointAt={() => ({ x: sundarX - 420, y: sundarY - 360 })}
          reachAt={() => sundarReachAt()}
          sigh={(fr) => (fr < CHEST ? 0 : fr < CHEST + 16 ? smooth((fr - CHEST) / 16) : 1 - smooth((fr - CHEST - 16) / 30))}
        />,
        gobWithSundar ? gobinda({ x: cupNow.x, y: cupNow.y - GOB_BOTTOM * GOB_S }) : null,
      ),
    },
    {
      y: charuY,
      node: grounded(
        "cha",
        charuX,
        charuY,
        54,
        <Puppet
          cast={charu}
          x={charuX}
          y={charuY}
          scale={charuK}
          f={f}
          lifeF={f}
          light={EP04G_POND_LIGHT}
          mouth={() => MOUTH_REST}
          acting={(fr) => charuActing(fr)}
          breathRate={f >= FREEZE && f < LOWER ? 1.5 : 1}
          sigh={charuSigh}
        />,
      ),
    },
    {
      y: cousY,
      node: grounded(
        "cou",
        cousX,
        cousY,
        44,
        <Puppet
          cast={cous}
          x={cousX}
          y={cousY}
          scale={COUS_S * persp(cousY)}
          f={cousLeg}
          lifeF={f}
          light={EP04G_POND_LIGHT}
          mouth={() => MOUTH_REST}
          acting={() => cousActing()}
          breathRate={f >= FREEZE && f < LOWER ? 1.6 : 1.1}
        />,
      ),
    },
    {
      y: runnerY,
      node: (
        <g key="run">
          {grounded(
            "run",
            runnerX,
            runnerY,
            44,
            <Puppet
              cast={runner}
              x={runnerX}
              y={runnerY}
              scale={RUN_S * persp(runnerY)}
              f={runnerLeg}
              lifeF={f}
              light={EP04G_POND_LIGHT}
              mouth={() => mouthFromRms(runnerRms(f), f)}
              talk={() => runnerRms(f)}
              acting={() => runnerActing()}
              pointAt={() => ({ x: BAL.x, y: BAL.y - 160 })}
              reachAt={() => runnerReachAt()}
              holdAt={() => ({ x: dollThrustAt.x, y: dollThrustAt.y + DOLL_GRIP_Y * DOLL_S })}
              breathRate={f >= BACK1 - 4 && f < REFUSE ? 2.3 : f >= FREEZE && f < LOWER ? 1.7 : 1.1}
              anchors={(a) => {
                runnerAnchors.a = a;
              }}
            />,
            <Late
              render={() => {
                const a = runnerAnchors.a;
                if (!a || !runnerHasDoll) return null;
                // the doll in his near (left) hand; held out it sits between both hands (the two wrists)
                const k = smooth((f - (THRUST - 10)) / 12);
                const mx = lerp(a.lWrist.x + 4, (a.lWrist.x + a.rWrist.x) / 2, k);
                const my = lerp(a.lWrist.y + 6, (a.lWrist.y + a.rWrist.y) / 2 + 2, k);
                return <HeldObjectArt kind="doll" x={mx} y={my} s={DOLL_S} lifeF={f} />;
              }}
            />,
          )}
          <GhibliFootstepDust x={runnerX} y={runnerY} activity={runnerZip ? 1 : f < 110 ? 0.6 : 0} dir={f >= OUT0 && f < BACK0 ? -1 : 1} s={1.25} f={f} />
        </g>
      ),
    },
  ];
  figures.sort((a, b) => a.y - b.y);

  return (
    <GhibliStage cam={cam}>
      <GhibliPreload files={PRELOAD} />
      {/* the pad cover sits UNDER the mandar (it used to wash over the trunk's lower half: see-through trunk) */}
      <GhibliPondBackdrop
        f={f}
        lifeF={f}
        // the kingfisher's one dive lands inside the wordless AG5 wide shot (scene 900 = episode 4718), before the cut
        kingfisherDiveAt={900}
        upstageBehindTree={
          <>
            <BankPadCover />
          </>
        }
        dragonfly={false}
      />

      <GhibliLayer depth={1.0}>
        <GhibliCharFilterDefs f={f} />
        {/* Balak's own fine ink (constant screen width at any zoom, no whole-body outline: BAL-26f) */}
        <Ep04BalakInkDefs zoom={cam.zoom} rim={0.5} />
        <SolidFigureDefs id="s03-solid" />
        {figures.map((fg) => fg.node)}
      </GhibliLayer>

      <GhibliEp04ForegroundFinish f={f} zoom={cam.zoom} petals />
    </GhibliStage>
  );
};
