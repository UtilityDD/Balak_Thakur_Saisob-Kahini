import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, lerp, makeActing, noise1, track, type EaseName } from "../../../cinematic/core/anim";
import type { Cam } from "../../../cinematic/core/Stage";
import { tortoiseAt as tortoisePlace, tortoiseBiteKeys, tortoiseGrips, tortoiseHead, type TortoiseProps } from "../../../cinematic/animals/Tortoise";
import { MOUTH_REST } from "../../../cinematic/rig/lipsync";
import { BASE_POSE, GESTURES5, GESTURES6, headShake, jabPulse, shoutMouth, walkPose, walkTravel, type Pose, type PuppetAnchors, type WalkOpts } from "../../../cinematic/rig/Puppet";
import { sighCurve, type SeatedChildProps, type SeatedExpression, type SeatedPose, seatedChildHands } from "../../../episode03/rig/SeatedChild";
import { GhibliCharFilterDefs, GhibliLayer, GhibliStage } from "../../GhibliStage";
import { GhibliFootstepDust } from "../../core/GhibliAtmosphere";
import { GhibliDustPuff } from "../../core/GhibliLifeKit";
import { ghibliStrideOf, ghibliWalkSpot, zoomProportionalDof } from "../../core/ghibliMotion";
import { mouthFromRms } from "../../episode04/Ep04GhibliShared";
import {
  GhibliKachariBackdrop,
  GhibliKachariFloorLayer,
  GhibliKachariForegroundAndGrade,
  KACHARI,
  KACHARI_BG,
  kachariKeepInSet,
} from "../../episode05/GhibliKachariSet";
import { ep05GlowBeat } from "../Ep05BalakDivine";
import { EP05R_CAST, EP05R_GESTURES, EP05R_LIGHT, EP05R_SCALE, Ep05Person, Ep05SeatedBalak, ep05SeatedProps } from "../Ep05RewriteCast";
import { Ep05Tortoise, ep05TortoiseAtJaw, ep05TortoiseJawRest, type Ep05TortoiseProps } from "../Ep05RewriteProps";
import { ep05rPhraseLocal } from "../subtitles";
import { camAt, frameOn, ramp, roleMouth, type Shot, shotAt, span, WarmWash } from "./RewriteKit";

/**
 * Scene 02 `02_tortoise_bite_and_binoy` (blueprint section 5, book chapter আট): the neighbour's corner room, and Binoy's
 * account as a FLASHBACK on the same set in a warmer, lighter grade with a feathered vignette (24 f cross-dissolves in
 * on "গিয়ে দেখি—" and out at the end of AG7: both worlds are drawn during a dissolve).
 *
 * PRESENT: Charu and Surendra hurry in from the fence (right) and find Biru SEATED among the tortoises (STO-20b), T2's
 * jaws on the edge of his hand (Tortoise bite, biteTarget = his little-finger edge every frame, the hand drawn behind
 * it), Biru calm. 02a Surendra's gasp on the run; 02b Charu drops to her knees and reaches; T2 lets go (release) as her
 * hands come (AG5), draws its head back, turns and plods off; his hand rises into her two hands (Puppet hold, holdAt =
 * his palm), palm up on "দেখি", over on "দেখি হাতটা", no mark (02c); P3 she presses it to her cheek and sighs (his hand
 * follows her hold anchor), GLOW BEAT 1 (ep05GlowBeat, restrained). 02d Surendra crouches, puzzled, open palm to Binoy;
 * 02e Binoy, still breathless, points back at the corner room.
 * FLASHBACK: Binoy (jute bag) comes round the corner room and watches; Biru turns T1 over by the tail and the side
 * (tortoiseGrips every frame, legs paddling) and rights it, again in AG6 (its head pokes out); T2 plods in; "লেজ ভেবে" his
 * hand closes on T2's snout, the snap on "খপ"; 02h he lifts the hand with T2 hanging on (Ep05Tortoise hang, hangAt = his
 * hand edge, hand behind), teasing; AG7 Binoy's hands fly to his head (silent shout: the sound pass adds the 01e echo).
 * PRESENT: 02i Binoy scratches his head, sheepish; Surendra laughs and shakes his head; Charu smiles at Biru; P4 T1 pokes
 * its head out toward him.
 *
 * Every time is keyed to the generated spans and caption phrases (timing.ts / subtitles.ts), never raw frames.
 * SET: the existing Ghibli corner view (GhibliKachariBackdrop "corner": corner room, Binoy's house, tipped basket).
 */

const SCENE_ID = "02_tortoise_bite_and_binoy";
const io: EaseName = "inOut";
const C = KACHARI.corner;
const KS = C.adultS; // 1.15
const BAL = C.balak; // (760, 938)
const BS = EP05R_SCALE.seatedBalak.s * KS;
const TS = 1.15;
const L = (p: { x: number; y: number }) => ({ x: (p.x - BAL.x) / BS, y: (p.y - BAL.y) / BS });
/** The jaw marker sits past the fingertips. Pull it back along the finger so the mouth closes on them. */
const jawPast = (edge: { x: number; y: number }, palm: { x: number; y: number }, extra: number) => {
  const dx = edge.x - palm.x;
  const dy = edge.y - palm.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: edge.x + (dx / len) * extra, y: edge.y + (dy / len) * extra };
};
const ease = (t: number) => EASE.inOut(clamp(t));

/* ------------------------------------------------------------------ */
/* Timing (spans and phrases)                                          */
/* ------------------------------------------------------------------ */

const L2A = span(SCENE_ID, "02a_Surendra_Bitten.wav");
const L2B = span(SCENE_ID, "02b_Charu_FreeHand.wav");
const AG5 = span(SCENE_ID, "AG5_already_free");
const L2C = span(SCENE_ID, "02c_Charu_NoMark.wav");
const P3 = span(SCENE_ID, "P3");
const L2D = span(SCENE_ID, "02d_Surendra_AskBinoy.wav");
const L2E = span(SCENE_ID, "02e_Binoy_Account1.wav");
const L2F = span(SCENE_ID, "02f_Binoy_Account2.wav");
const AG6 = span(SCENE_ID, "AG6_the_play");
const L2G = span(SCENE_ID, "02g_Binoy_Account3.wav");
const L2H = span(SCENE_ID, "02h_Balak_Tortoise.wav");
const AG7 = span(SCENE_ID, "AG7_the_shout");
const L2I = span(SCENE_ID, "02i_Binoy_Shouted.wav");
const P4 = span(SCENE_ID, "P4");
const ph = (s: string, fb: number) => ep05rPhraseLocal(SCENE_ID, s, fb);

const DEKHI2 = ph("দেখি হাতটা", L2C.from + 34);
const OMA = ph("ওমা", L2C.from + 68);
const BINOY_CALL = ph("বিনয়, কী", L2D.from + 28);
const KONER = ph("কোণের ঘরের", L2E.from + 80);
const GIYE = ph("গিয়ে দেখি", L2E.to - 36);
const KACHHAP = ph("কচ্ছপগুলো", L2F.from + 44);
const ULTE = ph("উল্টে দিচ্ছে", KACHHAP + 48);
const AVAK = ph("এইটুকু ছেলের", L2F.from + 133);
const CHUP = ph("চুপ করে", L2F.from + 230);
const LEJ = ph("লেজ ধরে", L2G.from + 1);
const ULTE2 = ph("নানাভাবে", LEJ + 90);
const TARPOR = ph("তারপর একবার", L2G.from + 120);
const SHUR = ph("শুঁড়টা", L2G.from + 195);
const AMONI = ph("অমনি", L2G.from + 265);
const KHOP = ph("খপ করে", AMONI + 36);
const MOJA = ph("দাঁড়া", L2H.from + 46);

// present
const CH_WALK = { start: -18, dur: 122, fromX: 1720, toX: 992, y0: 914, y1: 958 };
const SU_WALK = { start: -10, dur: 104, fromX: 1800, toX: 1150, y0: 912, y1: 944 };
const KNEEL_A = CH_WALK.start + CH_WALK.dur; // she drops to her knees here
const REACH_A = L2B.from + 18; // Charu's hands go out
const REL = L2B.to - 6; // T2 opens its jaws (free from about REL + 6)
const RISE = Math.max(AG5.from + 2, REL + 22); // the hand rises only after the jaws have opened
const T2_BACK = REL + 24;
const T2_TURN = { a: T2_BACK + 6, b: T2_BACK + 34 };
const T2_WALK = { a: T2_TURN.b + 4, b: T2_TURN.b + 66 };
const TURN_UP = { a: L2C.from + 4, b: L2C.from + 26 };
const TURN_OVER = { a: DEKHI2 + 4, b: OMA - 2 };
const CHEEK = { a: P3.from + 2, b: P3.from + 22 };
const CHEEK_DOWN = { a: L2D.from + 6, b: L2D.from + 26 };
const LET_GO = L2D.to - 6;
const HOLD_PT = { x: BAL.x + 98, y: BAL.y - 82 };
const CHEEK_K = 0.3;

// flashback
const FB_IN = GIYE;
const FB_OUT = AG7.to;
const R1 = { grip: ULTE - 10, over: [ULTE - 2, ULTE + 22], back: [ULTE + 22, ULTE + 22], let: ULTE + 40 };
const R2 = { grip: CHUP + 8, over: [CHUP + 8, CHUP + 8], let: CHUP + 8 };
const R3 = { grip: AG6.from + 8, back: [AG6.from + 8, AG6.from + 8], let: AG6.from + 8 };
const R4 = { grip: LEJ + 2, over: [ULTE2, ULTE2 + 18], back: [ULTE2 + 18, ULTE2 + 18], let: ULTE2 + 48 };
const SNOUT_A = Math.max(R4.let + 14, TARPOR + 6);
const STRIKE = KHOP - 3;
const HANG = { a: MOJA - 6, b: MOJA + 28 };
const T2_IN = { a: LEJ + 6, b: LEJ + 96 };

/* ------------------------------------------------------------------ */
/* Tortoises                                                           */
/* ------------------------------------------------------------------ */

const T1_POS = { x: BAL.x + 100, y: BAL.y - 17 };
const T2_POS = { x: BAL.x + 120, y: BAL.y + 12 };
const T3_POS = { x: BAL.x - 92, y: BAL.y + 30 };
const T4_POS = { x: BAL.x - 160, y: BAL.y + 8 };

const t1TurnOver = (f: number) =>
  track(f, [
    [R1.over[0], 0],
    [R1.over[1], 1],
    [ULTE2, 1],
    [ULTE2 + 16, 0],
    [ULTE2 + 34, 1],
  ]);

const t1Fb = (f: number): TortoiseProps => ({
  x: T1_POS.x,
  y: T1_POS.y,
  s: TS,
  f,
  lifeF: f,
  variant: 0,
  yaw: 15,
  elev: 22,
  rollDir: 1,
  turnOver: t1TurnOver(f),
  neck: track(f, [
    [R1.over[0], 0.7],
    [R1.over[1], 0.15],
    [R4.grip, 0.55],
  ]),
});

const t1Present = (f: number): TortoiseProps => ({
  x: T1_POS.x,
  y: T1_POS.y,
  s: TS,
  f,
  lifeF: f,
  variant: 0,
  yaw: 162,
  elev: 22,
  neck: track(f, [
    [P4.from + 4, 0.18 + 0.06 * Math.sin(f * 0.02)],
    [P4.from + 30, 0.95],
  ]),
});

const T2_BASE: TortoiseProps = { x: T2_POS.x, y: T2_POS.y, s: TS, lifeF: 0, variant: 1, yaw: 200, elev: 22 };
/** The jaw tip with the head fully out: where his hand edge sits while bitten (and where the hang starts). */
const T2_JAW = ep05TortoiseJawRest(T2_BASE);
/** A hand the seated arm can actually hold, out to the side. The present tortoise is placed so its jaws sit here. */
const BITE_AT = { x: BAL.x + 76, y: BAL.y - 10 };
const T2_BITE_POS = ep05TortoiseAtJaw(BITE_AT, { ...T2_BASE, x: 0, y: 0 });

const walkDist = (f: number, a: number, b: number, speed: number) => {
  let d = 0;
  for (let i = a; i < Math.min(f, b + 10); i++) d += 0.55 * TS * speed * track(i, [[a, 0], [a + 8, 1], [b - 8, 1], [b, 0]]);
  return d;
};
const T2_IN_DIST = walkDist(1e9, T2_IN.a, T2_IN.b, 1.5);
const T2_IN_FROM = (() => {
  const end = tortoisePlace(0, 0, T2_IN_DIST, { ...T2_BASE });
  return { x: T2_POS.x - end.x, y: T2_POS.y - end.y };
})();

/** Present T2: jaws locked on the hand he can actually hold, then lets go, draws its head back, turns and plods off. */
const t2Present = (f: number, edge: { x: number; y: number }): Ep05TortoiseProps => {
  const k = tortoiseBiteKeys(f, -100, REL, T2_BACK);
  const turnAway = 0.5 * ease((f - T2_TURN.a) / (T2_TURN.b - T2_TURN.a));
  const dist = walkDist(f, T2_WALK.a, T2_WALK.b, 1.1);
  const walk = track(f, [[T2_WALK.a, 0], [T2_WALK.a + 8, 1], [T2_WALK.b - 8, 1], [T2_WALK.b, 0]]);
  const biting = f < REL;
  const placed = ep05TortoiseAtJaw(edge, { ...T2_BASE, x: 0, y: 0 });
  const at = dist > 0 ? tortoisePlace(T2_BITE_POS.x, T2_BITE_POS.y, dist, { ...T2_BASE, turnAway: 0.5, turnVia: "toward" }) : T2_BITE_POS;
  return {
    ...T2_BASE,
    x: f < T2_WALK.a ? placed.x : at.x,
    y: f < T2_WALK.a ? placed.y : at.y,
    f,
    lifeF: f + 23,
    bite: biting ? 1 : k.bite,
    release: k.release,
    biteTarget: edge,
    hangAt: biting ? edge : undefined,
    hang: 0,
    neck: biting ? 1 : track(f, [[T2_BACK, 0.25], [T2_BACK + 12, 0.25], [T2_WALK.b, 0.5], [P4.from, 0.45], [P4.to, 0.6]]),
    turnAway,
    turnVia: "toward",
    walk,
    dist,
  };
};

/** Flashback T2: plods in, pulls its head in under the rim, snaps on the hand, then hangs from it. */
const t2Fb = (f: number, edge: { x: number; y: number }, hangK: number): Ep05TortoiseProps => {
  const dist = walkDist(Math.min(f, STRIKE), T2_IN.a, T2_IN.b, 1.5);
  const at = tortoisePlace(T2_IN_FROM.x, T2_IN_FROM.y, dist, { ...T2_BASE });
  const walk = f >= STRIKE ? 0 : track(f, [[T2_IN.a, 0], [T2_IN.a + 8, 1], [T2_IN.b - 8, 1], [T2_IN.b, 0]]);
  const k = tortoiseBiteKeys(f, STRIKE);
  const onHand = f >= STRIKE;
  const placed = ep05TortoiseAtJaw(edge, { ...T2_BASE, x: 0, y: 0 });
  const settle = ease((f - STRIKE) / 8);
  return {
    ...T2_BASE,
    x: onHand ? lerp(at.x, placed.x, settle) : at.x,
    y: onHand ? lerp(at.y, placed.y, settle) : at.y,
    f,
    lifeF: f + 23,
    walk,
    dist,
    neck: track(f, [[T2_IN.b, 0.55], [SNOUT_A + 8, 0.12]]),
    bite: k.bite,
    release: 0,
    biteTarget: edge,
    hangAt: onHand ? edge : undefined,
    hang: onHand ? hangK : 0,
  };
};

const idleTortoise = (pos: { x: number; y: number }, variant: number, yaw: number, f: number, seed: number): TortoiseProps => ({
  x: pos.x,
  y: pos.y,
  s: TS * 0.96,
  f,
  lifeF: f + seed,
  variant,
  yaw,
  elev: 22,
  neck: 0.45 + 0.3 * Math.max(0, Math.sin(f * 0.013 + seed)) - 0.25 * Math.max(0, Math.sin(f * 0.009 + seed * 2)),
});

/* ------------------------------------------------------------------ */
/* Balak                                                               */
/* ------------------------------------------------------------------ */

type Pt = { x: number; y: number };
type BalakIn = Omit<SeatedChildProps, "plateLook">;
const palmOnGrip = (g: { x: number; y: number; out: Pt }) => ({ x: g.x + g.out.x * 6, y: g.y + g.out.y * 6 - 2 });

/** Put the near hand's little-finger edge on `edge` (two passes: the edge-palm offset depends on the hand's pose). */
const lockEdge = (bp: BalakIn, edge: Pt, iters = 2): BalakIn => {
  let palm = { x: edge.x - 4, y: edge.y - 7 };
  let out = bp;
  for (let i = 0; i < iters; i++) {
    out = { ...bp, handTargets: { ...(bp.handTargets ?? {}), near: L(palm) } };
    const h = seatedChildHands(ep05SeatedProps(out));
    palm = { x: edge.x - (h.nearLittleEdge.x - h.nearPalm.x), y: edge.y - (h.nearLittleEdge.y - h.nearPalm.y) };
  }
  return { ...bp, handTargets: { ...(bp.handTargets ?? {}), near: L(palm) } };
};

const baseBalak = (f: number): BalakIn => ({
  x: BAL.x,
  y: BAL.y,
  s: BS,
  f,
  lifeF: f,
  mouth: roleMouth(SCENE_ID, "balak", f),
  talk: roleMouth(SCENE_ID, "balak", f) > 0.06 ? 1 : 0,
});

const exprAt = (f: number, keys: Array<[number, SeatedExpression]>) => {
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (f >= keys[k][0]) i = k;
  return { expression: keys[i][1], prevExpression: keys[Math.max(0, i - 1)][1], expressionStart: Math.max(0, keys[i][0]) };
};

/** The bitten hand: a point the seated arm can hold, with the tortoise's small tugs. */
const presentEdge = (f: number): Pt => {
  const u = Math.min(f, REL) + 100;
  return { x: BITE_AT.x + 1.6 * Math.sin(u * 0.07) + 1.1 * noise1(u * 0.03, 7), y: BITE_AT.y + 0.9 * Math.sin(u * 0.05 + 1) };
};

/** Present Balak. `follow` = Charu's hold anchor this frame (P3 cheek and after) or null. */
const balakPresent = (f: number, follow: Pt | null): { props: BalakIn; edge: Pt } => {
  const engaged = f < LET_GO;
  const ex = exprAt(f, [
    [-999, "serene"],
    [OMA, "joyful"],
    [P3.to + 40, "serene"],
    [L2I.from, "joyful"],
  ]);
  const face = (() => {
    if (f < LET_GO) return { smile: track(f, [[0, 0.3], [OMA - 6, 0.3], [OMA + 10, 0.55]]), lookX: 0.6, eyesDown: 0.3 };
    return {
      lookX: track(f, [[LET_GO, 0.3], [LET_GO + 18, -0.65], [L2I.from + 30, -0.55], [P4.from + 6, -0.5], [P4.from + 24, 0.45]]),
      eyesDown: track(f, [[P4.from + 6, 0.05], [P4.from + 24, 0.5]]),
      smile: track(f, [[LET_GO, 0.4], [L2I.from, 0.4], [L2I.from + 16, 0.6]]),
    };
  })();
  const bp: BalakIn = {
    ...baseBalak(f),
    ...ex,
    face,
    pose: engaged ? "handsTo" : "sitCross",
    poseStart: engaged ? -100 : LET_GO,
    prevPose: engaged ? undefined : "handsTo",
    prevPoseStart: -100,
    handShapes: { near: "open" },
  };
  const edge = presentEdge(f);
  if (f < RISE) {
    return { props: lockEdge({ ...bp, handTargets: {} }, edge), edge };
  }
  // the bitten palm (where the rise starts)
  const startPalm = (() => {
    const p = lockEdge({ ...bp, f: RISE - 1, handTargets: {} }, presentEdge(RISE - 1)).handTargets?.near ?? { x: 0, y: 0 };
    return { x: BAL.x + p.x * BS, y: BAL.y + p.y * BS };
  })();
  const up = ease((f - RISE) / 20);
  let palm = { x: lerp(startPalm.x, HOLD_PT.x, up), y: lerp(startPalm.y, HOLD_PT.y, up) - Math.sin(Math.PI * up) * 14 };
  palm = { x: palm.x + 1.2 * Math.sin(f * 0.031), y: palm.y + 0.8 * Math.sin(f * 0.043 + 1) };
  if (follow && f >= CHEEK.a - 1) palm = follow;
  if (!engaged) palm = HOLD_PT; // frozen target for the blend out of handsTo
  const turnUp = ease((f - TURN_UP.a) / (TURN_UP.b - TURN_UP.a));
  const turnOver = ease((f - TURN_OVER.a) / (TURN_OVER.b - TURN_OVER.a));
  return { props: { ...bp, handTargets: { near: L(palm) }, palmUp: engaged ? turnUp * (1 - turnOver) : 0 }, edge };
};

/** Flashback phases: [start, kind]. "rest" between engagements; the blend out keeps the last targets (frozen). */
type FbKind = "rest" | "roll" | "snout";
const FB_PHASES: Array<[number, FbKind]> = [
  [-999, "rest"],
  [R1.grip, "roll"],
  [R1.let, "rest"],
  [R4.grip, "roll"],
  [R4.let, "rest"],
  [SNOUT_A, "snout"],
];
const phaseIdx = (f: number) => {
  let i = 0;
  for (let k = 0; k < FB_PHASES.length; k++) if (f >= FB_PHASES[k][0]) i = k;
  return i;
};

const rollTargets = (f: number) => {
  const g = tortoiseGrips(t1Fb(f));
  return { near: L(palmOnGrip(g.tail)), far: L(palmOnGrip(g.side)) };
};

const snoutPalm = (f: number): Pt => {
  const h = tortoiseHead(t2Fb(f, { x: 0, y: 0 }, 0));
  return { x: h.beak.x + 2, y: h.beak.y - 9 };
};

/** Flashback Balak: the play, the snap and the hang. Returns the hand edge for the bite / hang. */
const balakFb = (f: number): { props: BalakIn; edge: Pt; hangK: number } => {
  const i = phaseIdx(f);
  const [start, kind] = FB_PHASES[i];
  const [prevStart, prevKind] = FB_PHASES[Math.max(0, i - 1)];
  const ex = exprAt(f, [
    [-999, "serene"],
    [R1.grip - 10, "joyful"],
    [STRIKE + 2, "surprised"],
    [STRIKE + 14, "playful"],
  ]);
  const smile = track(f, [
    [R1.grip - 10, 0.35],
    [R1.over[1], 0.6],
    [AG6.from, 0.7],
    [AG6.to, 0.6],
    [STRIKE, 0.5],
    [STRIKE + 6, 0.2],
    [STRIKE + 24, 0.4],
  ]);
  const bp: BalakIn = {
    ...baseBalak(f),
    ...ex,
    face: { smile, lookX: 0.5, eyesDown: 0.5 },
    pose: kind === "rest" ? "sitCross" : "handsTo",
    poseStart: start,
    prevPose: (prevKind === "rest" ? "sitCross" : "handsTo") as SeatedPose,
    prevPoseStart: prevStart,
    blinkAt: STRIKE + 1,
  };
  if (bp.prevPose === bp.pose || i === 0) bp.prevPose = undefined;
  const edgeNone = { x: 0, y: 0 };
  if (kind === "roll") {
    return { props: { ...bp, handTargets: rollTargets(f), handShapes: { near: "grip", far: "grip" }, handTurns: { near: -1.6, far: -1.6 } }, edge: edgeNone, hangK: 0 };
  }
  if (kind === "rest") {
    // keep the last phase's targets so the blend back to sitCross starts from the frame shown before
    if (i > 0 && prevKind === "roll") {
      return { props: { ...bp, handTargets: rollTargets(start - 1), handShapes: { near: "grip", far: "grip" }, handTurns: { near: -1.6, far: -1.6 } }, edge: edgeNone, hangK: 0 };
    }
    return { props: bp, edge: edgeNone, hangK: 0 };
  }
  // snout: the hand closes on T2's front end ("লেজ ভেবে"), the snap, the pull to the jaw rest, the hang
  if (f < STRIKE) {
    const palm = snoutPalm(f);
    return { props: { ...bp, handTargets: { near: L(palm) }, handShapes: { near: f >= SHUR - 6 ? "grip" : "open" } }, edge: edgeNone, hangK: 0 };
  }
  const probe = (() => {
    const pp = { ...bp, f: STRIKE - 1, handTargets: { near: L(snoutPalm(STRIKE - 1)) }, handShapes: { near: "grip" as const } };
    return seatedChildHands(ep05SeatedProps(pp)).nearLittleEdge;
  })();
  const hk = ease((f - HANG.a) / Math.max(1, HANG.b - HANG.a));
  const lift = { x: probe.x - 8, y: probe.y - 78 };
  let edge = { x: lerp(probe.x, lift.x, hk), y: lerp(probe.y, lift.y, hk) };
  // "দাঁড়া, দেখাচ্ছি মজা!": a small teasing shake of the bitten hand
  const tease = clamp((f - MOJA) / 6) * (1 - clamp((f - L2H.to) / 10));
  edge = { x: edge.x + tease * 4 * Math.sin((f - MOJA) * 0.55), y: edge.y + tease * 2 * Math.sin((f - MOJA) * 1.1) };
  return { props: lockEdge({ ...bp, handShapes: { near: "open" } }, edge), edge, hangK: hk };
};

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

const walkOpts = (w: typeof CH_WALK, height: number, seed: number): WalkOpts => ({
  start: w.start,
  dur: w.dur,
  fromX: w.fromX,
  toX: w.toX,
  scale: KS,
  height,
  seed,
  flip: true,
  startIn: 8,
  stopIn: 14,
  kind: "hurry",
});
const CH_OPTS = walkOpts(CH_WALK, EP05R_CAST.charu.height, EP05R_CAST.charu.seed);
const SU_OPTS = walkOpts(SU_WALK, EP05R_CAST.surendra.height, EP05R_CAST.surendra.seed);
const walkAt = (f: number, w: typeof CH_WALK, o: WalkOpts) => {
  const x = walkTravel(f, o).bodyX;
  const u = clamp((w.fromX - x) / (w.fromX - w.toX));
  return { x, y: lerp(w.y0, w.y1, u), moving: f >= w.start && f <= w.start + w.dur + 2 };
};

const charuKeys = makeActing<Pose>(BASE_POSE, [
  { f: -20, bodyTurn: 0.85, brow: 0.65, browTilt: 0.65, smile: 0, gasp: 0.2, eyeY: 0.25 },
  { f: KNEEL_A + 24, in: 16, ease: io, kneel: 1, lean: 9, bodyTurn: 0.72, eyeY: 0.45 },
  { f: REACH_A, ease: io, hold: 0 },
  { f: L2B.to, in: L2B.to - REACH_A, ease: io, hold: 0.55, lean: 13 },
  { f: RISE + 18, in: RISE + 18 - L2B.to, ease: io, hold: 1, lean: 15, gasp: 0.1 },
  { f: TURN_UP.a, ease: io, holdTurn: 0 },
  { f: TURN_UP.b, in: TURN_UP.b - TURN_UP.a, ease: io, holdTurn: 0.5, brow: 0.45, browTilt: 0.45 },
  { f: TURN_OVER.a, ease: io, holdTurn: 0.5 },
  { f: TURN_OVER.b, in: TURN_OVER.b - TURN_OVER.a, ease: io, holdTurn: 1, brow: 0.3, browTilt: 0.3 },
  { f: OMA + 14, in: 14, ease: io, brow: 0.15, browTilt: 0.15, smile: 0.3, gasp: 0 },
  { f: CHEEK.a, ease: io, cheek: 0, headTilt: 0, lid: 0 },
  { f: CHEEK.b, in: CHEEK.b - CHEEK.a, ease: io, cheek: CHEEK_K, headTilt: 14, lid: 0.35, smile: 0.38, lean: 15, brow: 0.08, browTilt: 0.12 },
  { f: CHEEK_DOWN.a, ease: io, cheek: CHEEK_K, headTilt: 14 },
  { f: CHEEK_DOWN.b, in: CHEEK_DOWN.b - CHEEK_DOWN.a, ease: io, cheek: 0, headTilt: 4, lid: 0.15, lean: 11, smile: 0.3 },
  { f: LET_GO, ease: io, hold: 1 },
  { f: LET_GO + 20, in: 20, ease: io, hold: 0, lean: 6, headTurn: 0.12, smile: 0.25 },
  { f: L2I.from + 8, ease: io, smile: 0.25 },
  { f: L2I.from + 30, in: 22, ease: io, smile: 0.5, lid: 0.3, headTilt: 7, headTurn: -0.05 },
]);
const charuActing = (f: number): Partial<Pose> => ({ ...charuKeys(f), ...(walkAt(f, CH_WALK, CH_OPTS).moving ? walkPose(f, CH_OPTS) : {}) });

const surenKeys = makeActing<Pose>(BASE_POSE, [
  { f: -20, bodyTurn: 0.85, brow: 0.6, browTilt: 0.5, gasp: 0.25, smile: 0 },
  { f: L2A.from + 8, in: 12, ease: io, lean: 11, eyeY: 0.55, gasp: 0.45, brow: 0.85, browTilt: 0.6, smile: 0 },
  { f: SU_WALK.start + SU_WALK.dur + 14, in: 16, ease: io, bodyTurn: 0.72, lean: 6, eyeY: 0.35 },
  { f: AG5.from - 6, in: 14, ease: io, ...GESTURES5.bendToLook, ...GESTURES6.askBend, reachUp: 0.2, smile: 0, brow: 0.6, browTilt: 0.5, bodyTurn: 0.72 },
  { f: RISE + 22, in: 18, ease: io, reach: 0, reachUp: 0, lean: 10, crouch: 0.06, lHand: "relaxed" },
  { f: OMA + 18, in: 18, ease: io, ...GESTURES5.puzzled, lean: 8, brow: 0.35, smile: 0.15 },
  { f: P3.from + 30, in: 22, ease: io, smile: 0.3, browTilt: 0.15, headNod: 3 },
  { f: L2D.from + 10, in: 16, ease: io, ...GESTURES5.puzzled, crouch: 0.22, lean: 9, headTurn: 0.1, brow: 0.45, browTilt: 0.35, smile: 0.12 },
  { f: BINOY_CALL - 4, in: 12, ease: io, ...GESTURES6.palmOut, reachUp: 0.6, crouch: 0.18, headTurn: 0.12 },
  { f: L2D.to + 10, in: 16, ease: io, reach: 0, reachUp: 0, lHand: "relaxed", crouch: 0.1, lean: 5, smile: 0.1 },
  { f: L2I.from + 20, in: 14, ease: io, smile: 0.7, brow: 0.35, browTilt: -0.1, headTilt: -4, lean: 2 },
]);
const surenActing = (f: number): Partial<Pose> => {
  const k = surenKeys(f);
  const w = walkAt(f, SU_WALK, SU_OPTS).moving ? walkPose(f, SU_OPTS) : {};
  return { ...k, ...w, headTurn: (k.headTurn ?? 0) + headShake(f, L2I.from + 26, 40, 0.18) };
};

// Binoy, present: at the corner, hands on his head; steps in at AG5; breathless; tells (points back at the corner room)
const BINOY_P = { x: 470, y: 930 };
const BINOY_STEP = ghibliWalkSpot({ x: BINOY_P.x, y: BINOY_P.y, s: KS }, { x: BINOY_P.x + 56, y: BINOY_P.y + 2, s: KS }, L2B.from + 20, L2B.from + 58, EP05R_CAST.binoy.seed);
const BINOY_STRIDE = ghibliStrideOf(BINOY_STEP, EP05R_CAST.binoy);
const binoyKeysP = makeActing<Pose>(BASE_POSE, [
  { f: -20, bodyTurn: 0.3, ...GESTURES5.handsOnHead, eyeY: 0.3 },
  { f: L2B.from + 10, ease: io, headHands: 1 },
  { f: L2B.from + 28, in: 16, ease: io, headHands: 0, lean: 6, brow: 0.7, browTilt: 0.5, smile: 0, gasp: 0.25 },
  { f: AG5.to, in: 16, ease: io, ...EP05R_GESTURES.binoyBreathless, lean: 3, gasp: 0.25 },
  { f: L2D.from + 30, in: 16, ease: io, eyeY: 0, brow: 0.5, gasp: 0.12, headTilt: 3 },
  { f: L2E.from, in: 12, ease: io, brow: 0.7, browTilt: 0.35, gasp: 0, lean: 4, headNod: 2 },
  { f: KONER - 8, in: 10, ease: io, headTurn: -0.25, eyeX: -0.4 },
  { f: KONER + 50, in: 14, ease: io, headTurn: 0.05, eyeX: 0 },
  { f: L2I.from - 6, ease: io, smile: 0.1 },
  { f: L2I.from + 10, in: 14, ease: io, ...EP05R_GESTURES.binoySheepish, headTurn: 0.05, gasp: 0 },
]);
const binoyActingP = (f: number): Partial<Pose> => {
  const k = binoyKeysP(f);
  const st = BINOY_STRIDE(f);
  return { ...k, stride: st, jab: -jabPulse(f, KONER - 4, 34) };
};

// Binoy, flashback: comes round the corner room (behind it, depth 0.85), stops, watches; the shout in AG7
const FB_BINOY_SPOT = ghibliWalkSpot(
  { x: C.binoyHidden.x + 40, y: C.binoyStop.y, s: C.binoyStop.s ?? 0.75 },
  { x: C.binoyStop.x, y: C.binoyStop.y, s: C.binoyStop.s ?? 0.75 },
  FB_IN + 4,
  FB_IN + 66,
  EP05R_CAST.binoy.seed,
);
const FB_BINOY_STRIDE = ghibliStrideOf(FB_BINOY_SPOT, EP05R_CAST.binoy);
const binoyKeysFb = makeActing<Pose>(BASE_POSE, [
  { f: -20, bodyTurn: 0.34, headTurn: 0.2, smile: 0.2, eyeY: 0.1 },
  { f: FB_IN + 70, in: 12, ease: io, bodyTurn: 0.34, headTurn: 0.22, eyeY: 0.3, brow: 0.5, headTilt: 3 },
  { f: AVAK, in: 16, ease: io, ...GESTURES5.curiousTilt, eyeY: 0.35, lean: 4, smile: 0.25 },
  { f: AG6.from + 20, in: 16, ease: io, smile: 0.45, headTilt: 6 },
  { f: SNOUT_A, in: 16, ease: io, smile: 0.1, brow: 0.6, browTilt: 0.3, lean: 6, headTilt: 2 },
  { f: STRIKE + 4, in: 6, ease: io, brow: 0.9, browTilt: 0.55, gasp: 0.3, lean: -2, smile: 0 },
  { f: AG7.from + 6, in: 6, ease: io, ...GESTURES5.handsOnHead, headTilt: 0 },
]);
const binoyActingFb = (f: number): Partial<Pose> => {
  const k = binoyKeysFb(f);
  const st = FB_BINOY_STRIDE(f);
  const ph2 = f * 0.3 + EP05R_CAST.binoy.seed;
  return { ...k, stride: st, bodyY: k.bodyY - Math.abs(Math.sin(ph2)) * 2.4 * st, rS: k.rS + Math.sin(ph2) * 14 * st, lS: k.lS - Math.sin(ph2) * 14 * st };
};

const MOTHER = C.motherDoor;
const motherKeys = makeActing<Pose>(BASE_POSE, [
  { f: -20, bodyTurn: -0.32, headTurn: -0.18, ...GESTURES5.handAtMouth, mouthHand: -1 },
  { f: RISE + 10, ease: io, mouthHand: -1 },
  { f: RISE + 34, in: 20, ease: io, mouthHand: 0, brow: 0.35, browTilt: 0.35, smile: 0.1 },
  { f: OMA + 30, in: 20, ease: io, brow: 0.1, browTilt: 0.1, smile: 0.35 },
  { f: L2I.from + 24, in: 16, ease: io, smile: 0.5, headTilt: 5 },
]);

/* ------------------------------------------------------------------ */
/* Shots                                                               */
/* ------------------------------------------------------------------ */

const PRESENT_SHOTS: Shot[] = [
  { name: "Shot 8", from: -1e9, view: "corner", cam: { x: 60, y: 80, zoom: 1, focus: 1 }, note: "held wide as they burst in" },
  { name: "Shot 8 · the bite", from: L2A.from - 7, view: "corner", cam: frameOn(BITE_AT.x - 10, BITE_AT.y - 50, 2.45), note: "the jaws on his hand" },
  { name: "Shot 9", from: L2B.from - 6, view: "corner", cam: frameOn(900, 760, 2.4), note: "close as Charu drops to her knees" },
  { name: "AG5", from: AG5.from, view: "corner", cam: frameOn(890, 850, 2.4), note: "the tortoise has already let go" },
  { name: "Shot 10 (insert)", from: L2C.from - 6, view: "corner", cam: frameOn(HOLD_PT.x + 16, HOLD_PT.y + 4, 3.2), note: "macro insert" },
  { name: "Shot 10 · P3", from: OMA - 7, view: "corner", cam: frameOn(880, 720, 2.35), note: "close on Charu: no mark" },
  { name: "Shot 11", from: L2D.from - 6, view: "corner", cam: frameOn(1040, 660, 2.3), note: "close as Surendra turns to Binoy" },
  { name: "Shot 12", from: L2E.from - 6, view: "corner", cam: frameOn(560, 650, 2.6), note: "close on Binoy as he tells it" },
  { name: "Shot 16 · P4", from: FB_OUT - 12, view: "corner", cam: frameOn(560, 660, 2.4), note: "close on Binoy as he finishes" },
];
const FB_SHOTS: Shot[] = [
  { name: "Shot 13 (fb)", from: -1e9, view: "corner", cam: frameOn(640, 760, 1.35), note: "Binoy comes round the corner" },
  { name: "Shot 13 · play (fb)", from: ULTE - 7, view: "corner", cam: frameOn(820, 780, 2.2), note: "closer as he turns the tortoise over" },
  { name: "Shot 13 · Binoy (fb)", from: AVAK - 7, view: "corner", cam: frameOn(470, 640, 2.45), note: "Binoy watches, amazed" },
  { name: "Shot 13 · Balak (fb)", from: CHUP - 7, view: "corner", cam: frameOn(800, 800, 2.2), note: "Balak, still, the tortoise belly-up" },
  { name: "AG6 (fb)", from: AG6.from, view: "corner", cam: frameOn(805, 835, 1.9), push: { to: frameOn(820, 850, 2.6), a: AG6.from, b: AG6.to }, note: "slow push in" },
  { name: "Shot 14 (fb)", from: L2G.from - 7, view: "corner", cam: frameOn(850, 840, 2.45), note: "close, low, on the tail" },
  { name: "Shot 14 · hard cut (fb)", from: AMONI - 7, view: "corner", cam: frameOn(845, 860, 2.8), note: "the jaws" },
  { name: "Shot 15 (fb)", from: L2H.from - 6, view: "corner", cam: frameOn(800, 830, 2.6), note: "close-up Balak, teasing" },
  { name: "AG7 (fb)", from: AG7.from, view: "corner", cam: frameOn(470, 640, 2.0), note: "Binoy's hands fly to his head" },
];

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

const Deferred: React.FC<{ render: () => React.ReactNode }> = ({ render }) => <>{render()}</>;

const camFor = (f: number, shots: Shot[]): Cam => {
  const raw = camAt(f, shotAt(f, shots));
  return kachariKeepInSet("corner", { ...raw, focus: 1, dof: zoomProportionalDof(raw.zoom) });
};

const PresentWorld: React.FC<{ f: number }> = ({ f }) => {
  const cam = camFor(f, PRESENT_SHOTS);
  const light = EP05R_LIGHT.lateMorning;
  const glow = ep05GlowBeat(f, P3.from - 6, 30, Math.max(12, P3.frames - 6), 48);
  const ch = walkAt(f, CH_WALK, CH_OPTS);
  const su = walkAt(f, SU_WALK, SU_OPTS);
  const base = balakPresent(f, null);
  const biteHands = seatedChildHands(ep05SeatedProps(base.props));
  const bittenEdge = f < REL ? jawPast(biteHands.nearLittleEdge, biteHands.nearPalm, -14) : BITE_AT;
  const palm0 = seatedChildHands(ep05SeatedProps(base.props)).nearPalm;
  const holdAt = () => palm0;
  const cheekOn = f >= CHEEK.a - 1 && f < LET_GO;
  const charuAnch: { v: Pt | null } = { v: null };
  const charuProps = {
    cast: EP05R_CAST.charu,
    f,
    lifeF: f,
    x: ch.x,
    y: ch.y,
    scale: KS,
    flip: true,
    sitStyle: (f >= KNEEL_A + 6 ? "kneel" : undefined) as "kneel" | undefined,
    light,
    acting: charuActing,
    holdAt,
    mouth: () => mouthFromRms(roleMouth(SCENE_ID, "charu", f), f),
    talk: () => roleMouth(SCENE_ID, "charu", f),
    breathRate: f < P3.from ? 1.55 : 1,
    sigh: sighCurve(P3.from + 8, 14, 30, 4),
  };
  const t2 = t2Present(f, bittenEdge);
  const binoyX = BINOY_STEP(f).x;
  return (
    <GhibliStage cam={cam} background={KACHARI_BG.corner}>
      <GhibliKachariBackdrop
        view="corner"
        f={f}
        cam={cam}
        veranda={
          <Ep05Person
            cast={EP05R_CAST.binoyMother}
            f={f}
            lifeF={f}
            x={MOTHER.x}
            y={MOTHER.y}
            scale={MOTHER.s ?? 0.46}
            acting={motherKeys}
            light={light}
            shadow={false}
          />
        }
      />
      <GhibliKachariFloorLayer view="corner" f={f} />
      <GhibliLayer depth={1}>
        <GhibliCharFilterDefs f={f} />
        <Ep05Tortoise {...t1Present(f)} />
        <Ep05Person
          cast={EP05R_CAST.binoy}
          f={f}
          lifeF={f}
          x={binoyX}
          y={BINOY_P.y}
          scale={KS}
          light={light}
          acting={binoyActingP}
          pointAt={() => ({ x: 250, y: 720 })}
          mouth={() => mouthFromRms(roleMouth(SCENE_ID, "binoy", f), f)}
          talk={() => roleMouth(SCENE_ID, "binoy", f)}
          breathRate={f < L2D.to ? 1.75 : 1.1}
        />
        {cheekOn && (
          <g style={{ display: "none" }} aria-hidden>
            <Ep05Person {...charuProps} shadow={false} anchors={(a: PuppetAnchors) => (charuAnch.v = a.hold)} />
          </g>
        )}
        <Deferred
          render={() => {
            const r = cheekOn && charuAnch.v ? balakPresent(f, charuAnch.v) : base;
            return <Ep05SeatedBalak {...r.props} glowK={glow} zoom={cam.zoom} />;
          }}
        />
        <Ep05Tortoise {...idleTortoise(T4_POS, 3, 160, f, 41)} />
        <GhibliFootstepDust x={su.x} y={su.y} activity={su.moving ? 0.7 : 0} dir={-1} s={KS} f={f} seed={23} />
        <Ep05Person
          cast={EP05R_CAST.surendra}
          f={f}
          lifeF={f}
          x={su.x}
          y={su.y}
          scale={KS}
          flip
          light={light}
          acting={surenActing}
          reachAt={() => ({ x: lerp(su.x - 60, palm0.x, 0.45), y: palm0.y - 30 })}
          mouth={() => mouthFromRms(roleMouth(SCENE_ID, "surendra", f), f)}
          talk={() => roleMouth(SCENE_ID, "surendra", f)}
          breathRate={f < OMA ? 1.6 : 1}
          sigh={sighCurve(P3.from + 12, 16, 30, 4)}
        />
        <GhibliFootstepDust x={ch.x} y={ch.y} activity={ch.moving ? 0.85 : 0} dir={-1} s={KS} f={f} seed={37} />
        <GhibliDustPuff x={ch.x - 40} y={ch.y + 2} f={f} start={KNEEL_A + 12} s={1.6} />
        <Ep05Person {...charuProps} />
        <Ep05Tortoise {...t2} />
        <Ep05Tortoise {...idleTortoise(T3_POS, 2, 195, f, 77)} />
      </GhibliLayer>
      <GhibliKachariForegroundAndGrade view="corner" f={f} zoom={cam.zoom} showBokeh={cam.zoom < 2.2} />
    </GhibliStage>
  );
};

const FlashbackWorld: React.FC<{ f: number }> = ({ f }) => {
  const cam = camFor(f, FB_SHOTS);
  const light = EP05R_LIGHT.flashback;
  const b = balakFb(f);
  const biteHands = seatedChildHands(ep05SeatedProps(b.props));
  const bittenEdge = f >= STRIKE ? jawPast(biteHands.nearLittleEdge, biteHands.nearPalm, -14) : b.edge;
  const t2 = t2Fb(f, bittenEdge, b.hangK);
  const spot = FB_BINOY_SPOT(f);
  const binoyMouth = (fr: number) => (fr > AG7.from + 4 && fr < AG7.from + 30 ? shoutMouth(fr, AG7.from + 4, 26, 3) : MOUTH_REST);
  return (
    <GhibliStage cam={cam} background={KACHARI_BG.corner}>
      <GhibliKachariBackdrop
        view="corner"
        f={f}
        cam={cam}
        cornerBehind={
          <Ep05Person
            cast={EP05R_CAST.binoy}
            f={f}
            lifeF={f}
            x={spot.x}
            y={spot.y}
            scale={spot.s}
            light={light}
            acting={binoyActingFb}
            mouth={binoyMouth}
            breathRate={f > STRIKE ? 1.6 : 1}
            ink={false}
          />
        }
      />
      <GhibliKachariFloorLayer view="corner" f={f} />
      <GhibliLayer depth={1}>
        <GhibliCharFilterDefs f={f} />
        <Ep05Tortoise {...t1Fb(f)} />
        <Ep05SeatedBalak {...b.props} zoom={cam.zoom} />
        <Ep05Tortoise {...idleTortoise(T4_POS, 3, 160, f, 41)} />
        <Ep05Tortoise {...t2} />
        <Ep05Tortoise {...idleTortoise(T3_POS, 2, 195, f, 77)} />
      </GhibliLayer>
      <GhibliKachariForegroundAndGrade view="corner" f={f} zoom={cam.zoom} showBokeh={cam.zoom < 2.2} />
    </GhibliStage>
  );
};

export const Scene02RewriteTortoiseBinoy: React.FC = () => {
  const f = useCurrentFrame();
  const presentOp = f < FB_IN ? 1 : f < FB_IN + 12 ? 1 - ease((f - FB_IN) / 12) : f < FB_OUT + 16 ? 0 : ease((f - (FB_OUT + 16)) / 12);
  const fbOp = f < FB_IN + 12 ? 0 : f < FB_IN + 28 ? ease((f - (FB_IN + 12)) / 16) : f < FB_OUT - 4 ? 1 : Math.max(0, 1 - ease((f - (FB_OUT - 4)) / 14));
  return (
    <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.corner, overflow: "hidden" }}>
      {presentOp > 0.02 && (
        <div style={{ position: "absolute", inset: 0, opacity: presentOp }}>
          <PresentWorld f={f} />
        </div>
      )}
      {fbOp > 0.02 && (
        <div style={{ position: "absolute", inset: 0, opacity: fbOp }}>
          <FlashbackWorld f={f} />
          <WarmWash amount={0.5} vignette={0.85} color="#ffd59a" />
        </div>
      )}
    </div>
  );
};

/** Story beats for the sound pass (scene-local frames). */
export const S02R_TIMES = {
  t2Release: REL,
  t2TurnAway: T2_TURN.a,
  t2Plod: T2_WALK.a,
  charuKneel: KNEEL_A + 12,
  roll1Over: R1.over[0],
  roll1Back: R1.back[0],
  roll2Over: R2.over[0],
  roll3Back: R3.back[0],
  roll4Over: R4.over[0],
  roll4Back: R4.back[0],
  t2PlodIn: T2_IN.a,
  strike: STRIKE,
  bite: STRIKE + 4,
  hangLift: HANG.a,
  shoutEcho: AG7.from + 4,
  fbIn: FB_IN,
  fbOut: FB_OUT,
  glow1: P3.from - 6,
};
