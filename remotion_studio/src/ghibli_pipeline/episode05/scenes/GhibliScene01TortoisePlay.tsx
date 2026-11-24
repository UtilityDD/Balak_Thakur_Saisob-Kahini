import React from "react";
import { staticFile } from "remotion";
import { clamp, EASE, lerp, makeActing, noise1, track } from "../../../cinematic/core/anim";
import { Cam } from "../../../cinematic/core/Stage";
import { Tortoise, TortoiseProps, tortoiseBiteKeys, tortoiseGrips, tortoiseHead, tortoiseJawTip } from "../../../cinematic/animals/Tortoise";
import { CAST } from "../../../cinematic/rig/cast";
import { MOUTH_REST, MouthState } from "../../../cinematic/rig/lipsync";
import {
  BASE_POSE,
  GESTURES5,
  Lighting,
  Pose,
  Puppet,
  PuppetAnchors,
  SceneLight,
  SceneLights,
  shoutMouth,
  walkPose,
  walkTravel,
  WalkOpts,
} from "../../../cinematic/rig/Puppet";
import { cueLocalStory5, pausesFor5, storyToReal, useStory5 } from "../../../episode/storyClock";
import { BirulGlow } from "../../../episode03/rig/BirulGlow";
import { SeatedChild, seatedChildHands, type SeatedChildProps, type SeatedExpression, type SeatedHandPoints, type SeatedPose } from "../../../episode03/rig/SeatedChild";
import { EP05_SCENES } from "../../../episode05/timing";
import { EP05_CUES } from "../../../episode05/subtitles";
import { ContactShadow, GhibliCharFilterDefs, GhibliLayer, GhibliStage } from "../../GhibliStage";
import { ghibliClock, withGhibliActing } from "../../core/ghibliActing";
import { arcLerp, balakLivingBodyTransform, GhibliBalakLapDetails } from "../../core/ghibliBalak";
import { GhibliFootstepDust } from "../../core/GhibliAtmosphere";
import { GhibliBalakAura, GhibliBalakGroundGlow } from "../../core/GhibliBalakAura";
import { GhibliBalakFaceDetail } from "../../core/GhibliFaceDetail";
import { GhibliWindClothTail } from "../../core/GhibliWindFlutter";
import { ghibliStrideOf, ghibliWalkSpot, safeBodyTurn, zoomProportionalDof } from "../../core/ghibliMotion";
import {
  GhibliKachariBackdrop,
  GhibliKachariFloorLayer,
  GhibliKachariForegroundAndGrade,
  KACHARI,
  KACHARI_BG,
  kachariKeepInSet,
  type KachariView,
} from "../GhibliKachariSet";

/**
 * Episode 5 (Ghibli Watercolor + Sepia-Ink Pipeline) · Scene 01 (`01_tortoise_play`).
 * Preserves 100% of Episode 5 Scene 01's approved timing, pauses, voice sync, tortoise IK, and shots,
 * while staging the Krishnanagar Kachari compound & corner in hand-drawn Ghibli watercolor plates,
 * zoom-proportional multiplane DOF, `#ghibli-char-ink` contour harmony, and zero-slip foot-locked walks.
 */

const SCENE_ID = "01_tortoise_play";
const SCENE = EP05_SCENES.find((s) => s.sceneId === SCENE_ID) ?? { sceneId: SCENE_ID, component: "", startFrame: 639, durationFrames: 591 };
const DUR = SCENE.durationFrames;
const PAUSES = pausesFor5(SCENE_ID);

const R = (story: number): number => storyToReal(story, PAUSES);
const cueFrom = (snippet: string, fallback: number): number => cueLocalStory5(snippet, SCENE_ID)?.from ?? fallback;
const pauseReal = (i: number, fbStory: number, fbFrames: number): [number, number] => {
  const p = PAUSES[i];
  const s = R(p ? p.atStory : fbStory);
  return [s, s + (p ? p.frames : fbFrames)];
};

const P1 = pauseReal(0, 148, 36);
const P2 = pauseReal(1, 236, 24);
const P3 = pauseReal(2, 482, 48);

const CUE = {
  chotto: cueFrom("ছোট্ট বীরু", 74),
  hothat: cueFrom("হঠাৎ", 155),
  sobai: cueFrom("সবাই", 241),
  kintu: cueFrom("কিন্তু", 309),
  ar: cueFrom("আর কচ্ছপও", 396),
};
const KHELA_STORY = (() => {
  const c = cueLocalStory5("খেলা করছিল", SCENE_ID);
  const row = EP05_CUES.find((q) => q.text.includes("খেলা করছিল"));
  if (!c || !row) return 120;
  return c.from + 46;
})();
const V = {
  chotto: R(CUE.chotto),
  khela: R(KHELA_STORY),
  hothat: R(CUE.hothat) + 1,
  sobai: R(CUE.sobai),
  kintu: R(CUE.kintu),
  dag: R(CUE.kintu + 57),
  ar: R(CUE.ar) + 2,
};

const ROLL_A = { grip: 10, over: 22, down: 38, back: 46, up: 62, let: 66 };
const ROLL_B = { grip: 90, over: 102, down: 120, back: P1[0] + 4, up: P1[0] + 20, let: P1[0] + 24 };
const REACH_AT = P1[1];
const STRIKE = V.hothat + 3;
const BITE_AT = STRIKE + 4;
const PLAY = { a: V.chotto - 2, b: REACH_AT - 18 };
const SHOUT = P2[1] - 2;
const HANDS_ON_HEAD = SHOUT - 8;
const CHARU_RUN = { start: SHOUT, dur: 76 };
const SUREN_RUN = { start: SHOUT + 6, dur: 96 };
const KNEEL_AT = CHARU_RUN.start + CHARU_RUN.dur - 6;
const HOLD_AT = KNEEL_AT + 12;
const RELEASE = HOLD_AT + 6;
const HEAD_BACK = RELEASE + 20;
const RISE_AT = RELEASE + 7;
const IN_HANDS_AT = RISE_AT + 18;
const TURN_UP = { a: Math.max(V.dag - 14, IN_HANDS_AT + 4), b: V.dag + 2 };
const TURN_OVER = { a: V.dag + 12, b: V.ar - 6 };
const T2_TURN = { a: V.ar + 2, b: V.ar + 24 };
const P3A = P3[0];
const CHEEK = { a: P3A + 2, b: P3A + 22 };
const SIGH_AT = P3A + 14;
const CHEEK_K = 0.3;
const GLOW_UP = { a: P3A + 6, b: P3A + 34 };

const BX = 760;
const BY = 945;
const BS = 0.95;
const TS = 1.3;

interface Place {
  bx: number;
  by: number;
  k: number;
}
const CORNER_PLACE: Place = { bx: BX, by: BY, k: 1 };
const COMPOUND_PLACE: Place = { bx: KACHARI.compound.balak.x, by: KACHARI.compound.balak.y, k: 0.215 / BS };
const mapP = (pl: Place, p: { x: number; y: number }) => ({ x: pl.bx + (p.x - BX) * pl.k, y: pl.by + (p.y - BY) * pl.k });

const CHARU = { x: 952, y: 930, s: 1.1 };
const SUREN = { x: 1095, y: 905, s: 1.08 };
const GAP_FLOOR = { x: 1842, y: 884 };
const adultScaleAt = (y: number) => clamp(0.0102 * (y - 839), 0.3, 1.4);

const PATH_ELEV = (24 * Math.PI) / 180;
interface TSpec {
  variant: number;
  x0: number;
  y0: number;
  heading: (lf: number) => number;
  walk: (lf: number) => number;
  speed: (lf: number) => number;
  turnAway: (lf: number) => number;
}
const T_SPECS: TSpec[] = [
  {
    variant: 0,
    x0: 872,
    y0: 926,
    turnAway: (lf) => track(lf, [[212, 0], [242, 1]]),
    heading: (lf) => 15 - 180 * track(lf, [[212, 0], [242, 1]]),
    walk: (lf) => track(lf, [[236, 0], [246, 1], [P3A + 4, 1], [P3A + 18, 0]]),
    speed: () => 1.25,
  },
  {
    variant: 1,
    x0: 1022,
    y0: 962,
    turnAway: () => 0,
    heading: (lf) => lerp(172, 148, EASE.inOut(clamp((lf - T2_TURN.a) / (T2_TURN.b - T2_TURN.a)))),
    walk: (lf) =>
      track(lf, [
        [52, 0],
        [62, 1],
        [160, 1],
        [172, 0],
        [T2_TURN.a - 2, 0],
        [T2_TURN.a + 6, 0.75],
        [T2_TURN.b, 0.75],
        [T2_TURN.b + 8, 1],
        [P3A + 10, 1],
        [P3A + 24, 0],
      ]),
    speed: (lf) => (lf < 200 ? 2.0 : lf < T2_TURN.b ? 0.4 : 1.6),
  },
  {
    variant: 2,
    x0: 690,
    y0: 988,
    turnAway: () => 0,
    heading: () => 200,
    walk: (lf) => track(lf, [[78, 0], [88, 1], [134, 1], [144, 0], [306, 0], [316, 1], [430, 1], [442, 0]]),
    speed: () => 0.95,
  },
  { variant: 3, x0: 590, y0: 962, turnAway: () => 0, heading: () => 158, walk: () => 0, speed: () => 0 },
];

const T_TRACKS = T_SPECS.map((sp) => {
  const n = DUR + 2;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const ds = new Float64Array(n);
  let x = sp.x0;
  let y = sp.y0;
  let d = 0;
  for (let i = 0; i < n; i++) {
    xs[i] = x;
    ys[i] = y;
    ds[i] = d;
    const v = 0.55 * TS * sp.speed(i) * sp.walk(i);
    const h = (sp.heading(i) * Math.PI) / 180;
    x += Math.cos(h) * v;
    y += Math.sin(h) * Math.sin(PATH_ELEV) * v;
    d += v;
  }
  return { xs, ys, ds };
});
const at = (arr: Float64Array, lf: number) => arr[clamp(Math.round(lf), 0, arr.length - 1)];

const t1TurnOver = (lf: number) =>
  track(lf, [
    [ROLL_A.over, 0],
    [ROLL_A.down, 1],
    [ROLL_A.back, 1],
    [ROLL_A.up, 0],
    [ROLL_B.over, 0],
    [ROLL_B.down, 1],
    [ROLL_B.back, 1],
    [ROLL_B.up, 0],
  ]);
const t1Neck = (lf: number) =>
  track(lf, [
    [ROLL_B.up - 2, 0.75],
    [ROLL_B.up + 4, 0.08],
    [ROLL_B.up + 8, 0.08],
    [P1[1] - 4, 0.8],
    [230, 0.8],
    [242, 0.55],
  ]);
const t2Bite = (lf: number) => tortoiseBiteKeys(lf, STRIKE, RELEASE, HEAD_BACK);
const t2Neck = (lf: number) =>
  track(lf, [
    [164, 0.8],
    [176, 0.1],
    [HEAD_BACK, 0.1],
    [HEAD_BACK + 14, 0.4],
    [P3A + 20, 0.4],
    [P3A + 40, 0.6],
  ]);

const tortoiseRaw = (i: number, lf: number, elev: number): TortoiseProps => {
  const sp = T_SPECS[i];
  const tr = T_TRACKS[i];
  const base: TortoiseProps = {
    x: at(tr.xs, lf),
    y: at(tr.ys, lf),
    s: TS,
    f: lf,
    lifeF: lf + 23 * i,
    variant: sp.variant,
    yaw: sp.heading(lf) + 180 * sp.turnAway(lf) * (i === 0 ? 1 : 0),
    elev,
    walk: sp.walk(lf),
    dist: at(tr.ds, lf),
  };
  if (i === 0) return { ...base, yaw: 15, turnAway: sp.turnAway(lf), turnVia: "away", turnOver: t1TurnOver(lf), rollDir: 1, neck: t1Neck(lf) };
  if (i === 1) return { ...base, neck: t2Neck(lf) };
  if (i === 2) return { ...base, neck: 0.62 + 0.12 * Math.sin(lf * 0.021 + 1.3) };
  return { ...base, neck: 0.42 + 0.06 * Math.sin(lf * 0.017), lid: track(lf, [[300, 0], [304, 0.9], [312, 0.9], [318, 0]]) };
};

const tortoiseAt = (i: number, lf: number, elev: number, pl: Place, biteTarget?: { x: number; y: number }): TortoiseProps => {
  const r = tortoiseRaw(i, lf, elev);
  const p = mapP(pl, r);
  const out: TortoiseProps = { ...r, x: p.x, y: p.y, s: (r.s ?? 1) * pl.k, dist: (r.dist ?? 0) * pl.k };
  if (i === 1) {
    const b = t2Bite(lf);
    out.bite = b.bite;
    out.release = b.release;
    if (biteTarget) out.biteTarget = biteTarget;
  }
  return out;
};

const HANDS_POSE: SeatedPose = "handsTo";
type Pt = { x: number; y: number };
interface HandsState {
  engaged: boolean;
  near?: Pt;
  far?: Pt;
  palmUp?: number;
  start: number;
  prevEngaged: boolean;
  prevStart: number;
}
const palmOnGrip = (g: { x: number; y: number; out: Pt }, k: number) => ({ x: g.x + g.out.x * 6 * k, y: g.y + g.out.y * 6 * k - 2 * k });
const PHASES: Array<[number, boolean]> = [
  [-999, false],
  [ROLL_A.grip, true],
  [ROLL_A.let, false],
  [ROLL_B.grip, true],
  [ROLL_B.let, false],
  [REACH_AT, true],
];
const phaseAt = (lf: number) => {
  let i = 0;
  for (let k = 0; k < PHASES.length; k++) if (lf >= PHASES[k][0]) i = k;
  return i;
};
const HOLD_LOCAL = { x: 104, y: -92 };

const t2Jaw = (lf: number, pl: Place, elev: number): Pt => {
  const atP = tortoiseAt(1, STRIKE - 1, elev, pl);
  const j0 = tortoiseJawTip({ ...atP, neck: 1, bite: 0, release: 0 });
  const u = Math.max(0, lf - BITE_AT);
  const env = clamp(u / 10);
  const tug = { x: 2.2 * Math.sin(u * 0.06) + 1.2 * noise1(u * 0.03, 7), y: 1.2 * Math.sin(u * 0.045 + 1) };
  return { x: j0.x - 6 * pl.k + env * tug.x * pl.k, y: j0.y - 2 * pl.k + env * tug.y * pl.k };
};

const balakHands = (lf: number, pl: Place, elev: number, charuHold: Pt | null): HandsState => {
  const i = phaseAt(lf);
  const [start, engaged] = PHASES[i];
  const [prevStart, prevEngaged] = i > 0 ? PHASES[i - 1] : PHASES[0];
  const base = { engaged, start, prevEngaged, prevStart };
  if (!engaged) return base;
  const W = (p: Pt) => mapP(pl, p);
  const holdW = W({ x: BX + HOLD_LOCAL.x * BS, y: BY + HOLD_LOCAL.y * BS });
  if (lf < REACH_AT) {
    const g = tortoiseGrips(tortoiseAt(0, lf, elev, pl));
    return { ...base, near: palmOnGrip(g.tail, pl.k), far: palmOnGrip(g.side, pl.k) };
  }
  if (lf < BITE_AT) {
    const h = tortoiseHead(tortoiseAt(1, REACH_AT, elev, pl));
    return { ...base, near: { x: h.beak.x - 3 * pl.k, y: h.beak.y - 8 * pl.k } };
  }
  const jaw = t2Jaw(Math.min(lf, RELEASE), pl, elev);
  const bitten = { x: jaw.x - 4 * pl.k, y: jaw.y - 7 * pl.k };
  if (lf < RISE_AT) return { ...base, near: bitten };
  // Graceful curved parabolic wrist arc as Balak lifts his hand into Charu's hands
  const up = clamp((lf - RISE_AT) / 20);
  const target = charuHold ?? holdW;
  const near = arcLerp(bitten, target, up, 22 * pl.k, 8 * pl.k);
  const turnUp = EASE.inOut(clamp((lf - TURN_UP.a) / (TURN_UP.b - TURN_UP.a)));
  const turnOver = EASE.inOut(clamp((lf - TURN_OVER.a) / (TURN_OVER.b - TURN_OVER.a)));
  return { ...base, near, palmUp: turnUp * (1 - turnOver) };
};

const balakFace = (lf: number): SeatedChildProps["face"] => {
  if (lf < BITE_AT) {
    const smile = track(lf, [
      [PLAY.a, 0.4],
      [PLAY.a + 14, 0.6],
      [ROLL_B.up, 0.6],
      [ROLL_B.up + 10, 0.78],
      [PLAY.b, 0.78],
      [PLAY.b + 12, 0.4],
    ]);
    return { smile, eyesDown: 0.55, lookX: 0.4 };
  }
  if (lf < RISE_AT) {
    return { smile: track(lf, [[P2[0] - 6, 0.3], [P2[0] + 10, 0.5]]), eyesDown: 0.5, lookX: 0.45 };
  }
  const past = track(lf, [[P3A + 8, 0], [P3A + 24, 1]]);
  return { lookX: lerp(0.5, -0.6, past), eyesDown: lerp(0.05, 0.45, past), smile: lerp(0.45, 0.6, past) };
};

const balakExpression = (lf: number): { expression: SeatedExpression; prevExpression: SeatedExpression; expressionStart: number } => {
  const keys: Array<[number, SeatedExpression]> = [
    [-999, "serene"],
    [PLAY.a, "joyful"],
    [PLAY.b, "serene"],
    [BITE_AT, "surprised"],
    [BITE_AT + 12, "playful"],
    [RISE_AT, "serene"],
  ];
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (lf >= keys[k][0]) i = k;
  return { expression: keys[i][1], prevExpression: keys[Math.max(0, i - 1)][1], expressionStart: Math.max(0, keys[i][0]) };
};

const balakAt = (lf: number, pl: Place, elev: number, charuHold: Pt | null): { props: SeatedChildProps; hands: HandsState; pts: SeatedHandPoints } => {
  const s = BS * pl.k;
  const x = pl.bx;
  const y = pl.by;
  const L = (p: Pt) => ({ x: (p.x - x) / s, y: (p.y - y) / s });
  const hands = balakHands(lf, pl, elev, charuHold);
  const ex = balakExpression(lf);
  const pose: SeatedPose = hands.engaged ? HANDS_POSE : "sitCross";
  const prevPose: SeatedPose = hands.prevEngaged ? HANDS_POSE : "sitCross";
  const props: SeatedChildProps = {
    x,
    y,
    s,
    f: lf,
    lifeF: lf,
    design: "plate",
    age: 6,
    pose,
    poseStart: hands.start,
    prevPose: prevPose !== pose ? prevPose : undefined,
    prevPoseStart: hands.prevStart,
    face: balakFace(lf),
    ...ex,
    blinkAt: BITE_AT,
  };
  if (hands.engaged) {
    props.handTargets = { near: hands.near ? L(hands.near) : undefined, far: hands.far ? L(hands.far) : undefined };
    if (lf < REACH_AT) {
      props.handShapes = { near: "grip", far: "grip" };
      props.handTurns = { near: -1.6, far: -1.6 };
    } else if (lf < BITE_AT) {
      props.handShapes = { near: lf >= REACH_AT + 12 ? "grip" : "open" };
    } else if (lf < RISE_AT + 4 && hands.near) {
      props.handShapes = { near: "open" };
      const probe = seatedChildHands(props);
      const jaw = t2Jaw(Math.min(lf, RELEASE), pl, elev);
      const off = { x: probe.nearLittleEdge.x - probe.nearPalm.x, y: probe.nearLittleEdge.y - probe.nearPalm.y };
      props.handTargets = { near: L({ x: jaw.x - off.x, y: jaw.y - off.y }) };
    } else {
      props.handShapes = { near: "open" };
    }
    if (hands.palmUp !== undefined) props.palmUp = hands.palmUp;
  }
  return { props, hands, pts: seatedChildHands(props) };
};

const glowAt = (lf: number) => 0.55 + 0.25 * EASE.inOut(clamp((lf - GLOW_UP.a) / (GLOW_UP.b - GLOW_UP.a)));

const io = "inOut" as const;
const SUN: Lighting = { keySide: -1, rim: "#ffd98a", rimStrength: 0.3 };

/** Binoy: foot-locked walk around the corner room using `ghibliWalkSpot` + `ghibliStrideOf`. */
const BINOY_SPOT = ghibliWalkSpot(
  { x: KACHARI.corner.binoyHidden.x + 40, y: KACHARI.corner.binoyStop.y, s: KACHARI.corner.binoyStop.s ?? 0.75 },
  { x: KACHARI.corner.binoyStop.x, y: KACHARI.corner.binoyStop.y, s: KACHARI.corner.binoyStop.s ?? 0.75 },
  V.chotto + 8,
  V.chotto + 70,
  CAST.binoy.seed,
);
const BINOY_STRIDE = ghibliStrideOf(BINOY_SPOT, CAST.binoy);
const binoyKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: safeBodyTurn(0.36), headTurn: 0.24, smile: 0.3, eyeY: 0.1 },
  { f: V.chotto + 72, in: 10, ease: io, bodyTurn: safeBodyTurn(0.35), headTurn: 0.22, eyeY: 0.3, headTilt: 3 },
  { f: P1[0] + 4, in: 16, ease: io, ...GESTURES5.curiousTilt, bodyTurn: safeBodyTurn(0.35), headTurn: 0.25, eyeY: 0.35 },
  { f: HANDS_ON_HEAD + 8, in: 8, ease: io, ...GESTURES5.handsOnHead, headTilt: 0, headTurn: 0, eyeY: 0.3 },
  { f: SHOUT + 50, ease: io, headHands: 1 },
  { f: SHOUT + 66, in: 16, ease: io, headHands: 0, brow: 0.45, browTilt: 0.4, smile: 0.05, lean: 2, eyeY: 0.35 },
  { f: P3A + 2, ease: io, scratch: 0 },
  { f: P3A + 14, in: 12, ease: io, ...GESTURES5.scratchHead, scratch: -1, eyeY: 0.3 },
]);
/** Fast-action windows that stay on ones (24 fps); all other character motion steps on twos (12 fps). */
const S01_FAST_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [STRIKE - 2, BITE_AT + 8], // Tortoise strike lunge & bite snap
  [SHOUT - 4, SHOUT + 14], // Binoy's sudden alarm
];

const binoyActingBase = (lf: number): Pose => {
  const k = binoyKeys(lf);
  const st = BINOY_STRIDE(lf);
  const ph = lf * 0.3 + CAST.binoy.seed;
  return {
    ...k,
    stride: st,
    bodyY: k.bodyY - Math.abs(Math.sin(ph)) * 2.4 * st,
    rS: k.rS + Math.sin(ph) * 14 * st,
    lS: k.lS - Math.sin(ph) * 14 * st,
  };
};
const binoyActing = withGhibliActing(binoyActingBase, {
  personality: "child",
  seed: CAST.binoy.seed,
  cadence: "twos",
  fastWindows: S01_FAST_WINDOWS,
});
const binoyX = (lf: number) => BINOY_SPOT(ghibliClock(lf, "twos", S01_FAST_WINDOWS)).x;
const binoyMouth = (lf: number): MouthState => (lf > SHOUT && lf < SHOUT + 46 ? shoutMouth(lf, SHOUT, 46, 3) : MOUTH_REST);

const runPath = (lf: number, run: { start: number; dur: number }, to: { x: number; y: number; s: number }, seed: number, height: number, kind: WalkOpts["kind"]) => {
  const opts: WalkOpts = {
    start: run.start,
    dur: run.dur,
    fromX: GAP_FLOOR.x,
    toX: to.x,
    scale: 0.85,
    height,
    seed,
    kind,
    flip: true,
    startIn: 8,
    stopIn: 12,
  };
  const x = lf < run.start ? GAP_FLOOR.x : walkTravel(lf, opts).bodyX;
  const u = clamp((GAP_FLOOR.x - x) / (GAP_FLOOR.x - to.x));
  const y = lerp(GAP_FLOOR.y, to.y, Math.pow(u, 0.8));
  const sc = lerp(adultScaleAt(GAP_FLOOR.y), to.s, Math.pow(u, 0.8));
  const moving = lf >= run.start && lf <= run.start + run.dur + 2;
  return { x, y, sc, pose: moving ? walkPose(lf, { ...opts, scale: sc }) : {}, visible: lf >= run.start - 2 };
};

const charuKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.85, brow: 0.6, browTilt: 0.6, smile: 0, gasp: 0.18, eyeY: 0.2 },
  { f: KNEEL_AT + 22, in: 22, ease: io, kneel: 1, lean: 8, gasp: 0.05, eyeY: 0.4 },
  { f: RISE_AT + 6, ease: io, hold: 0, lean: 12 },
  { f: RISE_AT + 22, in: 16, ease: io, hold: 1, holdTurn: 0, bodyTurn: 0.72 },
  { f: RISE_AT + 20, in: 18, ease: io, lean: 9, eyeY: 0.3 },
  { f: TURN_UP.a, ease: io, holdTurn: 0 },
  { f: TURN_UP.b, in: TURN_UP.b - TURN_UP.a, ease: io, holdTurn: 0.5, brow: 0.35, browTilt: 0.35 },
  { f: TURN_OVER.a, ease: io, holdTurn: 0.5 },
  { f: TURN_OVER.b, in: TURN_OVER.b - TURN_OVER.a, ease: io, holdTurn: 1, brow: 0.15, browTilt: 0.2, smile: 0.2, gasp: 0 },
  { f: CHEEK.a, ease: io, cheek: 0 },
  { f: CHEEK.b, in: CHEEK.b - CHEEK.a, ease: io, cheek: CHEEK_K, headTilt: 14, lid: 0.35, smile: 0.35, lean: 14, brow: 0.1, browTilt: 0.15 },
]);
const charuState = (lf: number) => {
  const cf = ghibliClock(lf, "twos", S01_FAST_WINDOWS);
  const run = runPath(cf, CHARU_RUN, CHARU, CAST.charu.seed, CAST.charu.height, "hurry");
  const k = charuKeys(cf);
  return { ...run, acting: { ...k, ...run.pose } as Pose };
};
const charuActing = withGhibliActing((fr) => charuState(fr).acting, {
  personality: "mother",
  seed: CAST.charu.seed,
  cadence: "twos",
  fastWindows: S01_FAST_WINDOWS,
});
const charuSigh = (lf: number) => (lf > SIGH_AT && lf < SIGH_AT + 16 ? 1 : 0);

const surenKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.75, brow: 0.45, browTilt: 0.35, smile: 0.08 },
  { f: SUREN_RUN.start + SUREN_RUN.dur + 14, in: 20, ease: io, ...GESTURES5.bendToLook, bodyTurn: 0.75 },
  { f: TURN_OVER.a + 4, ease: io, lean: 16 },
  { f: TURN_OVER.a + 22, in: 18, ease: io, ...GESTURES5.puzzled, lean: 3, crouch: 0, headNod: 0, eyeY: 0.2, rS: 10, rE: -60 },
  { f: P3A + 4, ease: io, lean: 3 },
  { f: P3A + 26, in: 22, ease: io, ...GESTURES5.bendToLook, ...GESTURES5.puzzled, lean: 13, crouch: 0.06, headNod: 4, eyeY: 0.45 },
]);
const surenState = (lf: number) => {
  const sf = ghibliClock(lf, "twos", S01_FAST_WINDOWS);
  const run = runPath(sf, SUREN_RUN, SUREN, CAST.surendra.seed, CAST.surendra.height, "hurry");
  return { ...run, acting: { ...surenKeys(sf), ...run.pose } as Pose };
};
const surenActing = withGhibliActing((fr) => surenState(fr).acting, {
  personality: "adult",
  seed: CAST.surendra.seed,
  cadence: "twos",
  fastWindows: S01_FAST_WINDOWS,
});

const MOTHER = KACHARI.corner.motherDoor;
const motherKeysBase = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: safeBodyTurn(-0.34), headTurn: -0.18, brow: 0.3, smile: 0.1 },
  { f: SHOUT + 40, in: 16, ease: io, ...GESTURES5.handAtMouth, mouthHand: 1, bodyTurn: safeBodyTurn(-0.34), headTurn: -0.18 },
]);
const motherKeys = withGhibliActing(motherKeysBase, {
  personality: "mother",
  seed: CAST.womanA.seed,
  cadence: "twos",
  fastWindows: S01_FAST_WINDOWS,
});
const motherStep = (lf: number) => track(lf, [[SHOUT + 4, 0], [SHOUT + 30, 1]]);

const CLERK = KACHARI.compound.clerk;
const clerkActing = (lf: number): Pose => ({
  ...BASE_POSE,
  bodyTurn: 0.34,
  lean: 14,
  headNod: 5,
  eyeY: 0.6,
  lid: 0.3,
  smile: 0.15,
  rS: 34 + 3 * Math.sin(lf * 0.3),
  rE: 70 + 4 * Math.sin(lf * 0.3 + 1),
  lS: 22,
  lE: 60,
});

interface Shot {
  from: number;
  view: KachariView;
  cam: Cam;
  elev: number;
  name: string;
  balakBlur?: number;
  noGrass?: boolean;
  push?: { a: number; b: number; to: Cam };
}
const frameOn = (wx: number, wy: number, sx: number, sy: number, z: number): Cam => ({
  x: wx - 960 - (sx - 960) / z,
  y: wy - 540 - (sy - 540) / z,
  zoom: z,
});

const SHOTS: Shot[] = [
  { from: -Infinity, view: "compound", cam: { ...KACHARI.compound.cam }, elev: 24, name: "1 wide (compound)" },
  {
    from: V.chotto - 2,
    view: "corner",
    cam: frameOn(860, 955, 1000, 800, 1.9),
    elev: 26,
    name: "2 medium + push",
    noGrass: true,
    push: { a: V.khela, b: P1[0] + 12, to: frameOn(842, 930, 990, 760, 3.4) },
  },
  { from: P1[1], view: "corner", cam: frameOn(850, 955, 1060, 770, 3.0), elev: 12, name: "3 close low", noGrass: true },
  { from: V.sobai - 2, view: "corner", cam: frameOn(960, 975, 960, 830, 1.05), elev: 22, name: "4 wide corner" },
  { from: V.kintu - 2, view: "corner", cam: frameOn(880, 962, 940, 812, 1.6), elev: 18, name: "5 two-shot" },
  { from: V.ar - 2, view: "corner", cam: frameOn(850, 978, 1010, 800, 4.2), elev: 10, name: "6 close low", balakBlur: 3.5, noGrass: true },
  { from: P3A, view: "corner", cam: frameOn(860, 962, 960, 818, 1.45), elev: 22, name: "P3 group" },
];
const shotAt = (lf: number): Shot => {
  let k = 0;
  for (let i = 0; i < SHOTS.length; i++) if (lf >= SHOTS[i].from) k = i;
  return SHOTS[k];
};

const GroundGlow: React.FC<{ x: number; y: number; s: number; glow: number }> = ({ x, y, s, glow }) => (
  <g>
    <defs>
      <radialGradient id="gh501-ground-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.4 * glow} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x + 30 * s} cy={y + 3 * s} rx={190 * s} ry={30 * s} fill="url(#gh501-ground-glow)" />
  </g>
);

const Deferred: React.FC<{ render: () => React.ReactNode }> = ({ render }) => <>{render()}</>;

export const GhibliScene01TortoisePlay: React.FC = () => {
  const { lifeF } = useStory5(SCENE_ID);
  const lf = lifeF;
  // Characters animate on twos (12 fps) for authentic Ghibli weight, auto-switching to ones on fast strikes/shouts
  const cf = ghibliClock(lf, "twos", S01_FAST_WINDOWS);
  const shot = shotAt(lf);
  const view = shot.view;
  const rawCam = (() => {
    if (!shot.push) return shot.cam;
    const u = EASE.inOut(clamp((lf - shot.push.a) / Math.max(1, shot.push.b - shot.push.a)));
    const a = shot.cam;
    const b = shot.push.to;
    const z = a.zoom * Math.pow(b.zoom / a.zoom, u);
    const k = (1 / a.zoom - 1 / z) / Math.max(1e-6, 1 / a.zoom - 1 / b.zoom);
    return { x: lerp(a.x, b.x, u === 0 ? 0 : k), y: lerp(a.y, b.y, u === 0 ? 0 : k), zoom: z };
  })();
  const dof = zoomProportionalDof(rawCam.zoom, 0.28, 0.5, 1.75);
  const cam = kachariKeepInSet(view, { ...rawCam, focus: view === "compound" ? 0.65 : 1, dof, shake: 0 });
  const pl = view === "compound" ? COMPOUND_PLACE : CORNER_PLACE;
  const elev = shot.elev;

  const ch = charuState(lf);
  const charuVisible = view === "corner" && ch.visible;
  const charuHoldAt = { v: null as { x: number; y: number } | null };

  // Run Balak's delicate hand & facial acting on smooth 24 fps (`lf`) so his gestures feel fluid and serene
  const balakBase = balakAt(lf, pl, elev, null);
  const cheekOn = lf >= CHEEK.a - 1;
  const holdBase = balakBase.pts.nearPalm;
  const charuHoldTarget = () => holdBase;
  let charuPre: React.ReactNode = null;
  if (charuVisible && cheekOn) {
    charuPre = (
      <Puppet
        cast={CAST.charu}
        f={cf}
        lifeF={cf}
        x={ch.x}
        y={ch.y}
        scale={ch.sc}
        flip
        acting={charuActing}
        light={SUN}
        holdAt={charuHoldTarget}
        opacity={0}
        anchors={(a: PuppetAnchors) => {
          charuHoldAt.v = a.hold;
        }}
      />
    );
  }

  const biteTarget = t2Jaw(lf, pl, elev);
  const tProps = [0, 1, 2, 3].map((i) => tortoiseAt(i, lf, elev, pl, i === 1 ? biteTarget : undefined));

  const glow = glowAt(lf);
  const balakS = BS * pl.k;

  const renderBalak = (holdPt: { x: number; y: number } | null) => {
    const r = cheekOn && holdPt ? balakAt(lf, pl, elev, holdPt) : balakBase;
    const g = r.pts.glowAnchor;
    const bodyXform = balakLivingBodyTransform({
      x: pl.bx,
      y: pl.by,
      f: lf,
      facing: 1,
      tenderness: lf >= P3A ? 0.65 : 0,
      seed: 19,
    });
    const bw = 460 * balakS;
    const bh = 455 * balakS;
    return (
      <g>
        <ContactShadow x={pl.bx} y={pl.by + 2} rx={115 * balakS} ry={22 * balakS} opacity={0.36} castStretch={1.15} />
        <GhibliBalakAura cx={g.cx} cy={g.cy} r={g.r * 1.15} glow={glow} f={lf} />
        <g filter="url(#ghibli-balak-ink)" transform={bodyXform}>
          <image
            href={staticFile("visuals/ep05/ep05_prop_balak_thakur_joyful.png")}
            x={pl.bx - bw / 2}
            y={pl.by - bh}
            width={bw}
            height={bh}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      </g>
    );
  };

  const su = surenState(lf);
  const mStep = motherStep(cf);
  const showMother = view === "corner" && lf >= SHOUT;

  const binoy = (
    <Puppet
      cast={CAST.binoy}
      f={cf}
      lifeF={cf}
      x={binoyX(lf)}
      y={KACHARI.corner.binoyStop.y}
      scale={KACHARI.corner.binoyStop.s ?? 0.75}
      acting={binoyActing}
      mouth={binoyMouth}
      light={SUN}
      breathRate={lf > HANDS_ON_HEAD && lf < SHOUT + 90 ? 1.6 : 1}
    />
  );

  const mother = showMother ? (
    <Puppet
      cast={CAST.womanA}
      f={cf}
      lifeF={cf}
      x={MOTHER.x - 34 * (1 - mStep)}
      y={MOTHER.y}
      scale={MOTHER.s ?? 0.46}
      acting={motherKeys}
      light={SUN}
      opacity={clamp(mStep * 1.6)}
    />
  ) : null;

  const clerk = (
    <Puppet cast={CAST.listenerA} f={cf} lifeF={cf} x={CLERK.x} y={CLERK.y} scale={CLERK.s ?? 0.26} seated acting={clerkActing} light={SUN} />
  );

  const surendra =
    view === "corner" && su.visible ? (
      <g>
        <ContactShadow x={su.x} y={su.y} rx={34 * su.sc} ry={9 * su.sc} opacity={0.32} castStretch={1.15} />
        <Puppet
          cast={CAST.surendra}
          f={cf}
          lifeF={cf}
          x={su.x}
          y={su.y}
          scale={su.sc}
          flip
          acting={surenActing}
          light={SUN}
          breathRate={lf > SUREN_RUN.start && lf < SUREN_RUN.start + SUREN_RUN.dur + 60 ? 1.6 : 1}
        />
      </g>
    ) : null;

  const charuVisual = charuVisible ? (
    <g>
      <ContactShadow x={ch.x} y={ch.y} rx={32 * ch.sc} ry={8 * ch.sc} opacity={0.34} castStretch={1.15} />
      <GhibliFootstepDust
        x={ch.x}
        y={ch.y}
        activity={lf >= CHARU_RUN.start && lf <= KNEEL_AT ? 0.85 : 0}
        dir={-1}
        s={ch.sc}
        f={lf}
        seed={37}
      />
      <Puppet
        cast={CAST.charu}
        f={cf}
        lifeF={cf}
        x={ch.x}
        y={ch.y}
        scale={ch.sc}
        flip
        acting={charuActing}
        light={SUN}
        holdAt={charuHoldTarget}
        sigh={charuSigh}
        breathRate={lf > CHARU_RUN.start && lf < RISE_AT + 40 ? 1.55 : 1}
      />
      {/* Trailing red-bordered saree anchal fluttering behind Charu as she hurries in */}
      {lf < KNEEL_AT + 16 && (
        <GhibliWindClothTail
          x={ch.x + 14 * ch.sc}
          y={ch.y - 165 * ch.sc}
          len={66 * ch.sc}
          width={24 * ch.sc}
          dir={1}
          fill="#f7f1e6"
          trim="#a62c28"
          f={lf}
          wind={0.95}
          seed={63}
        />
      )}
    </g>
  ) : null;

  const lights: SceneLight[] = [{ x: -400, y: -300, color: "#ffe6b0", intensity: 0.35, radius: 1800 }];

  const crawlOffset = Math.min(80, Math.max(0, (lf - 60) * 0.28)) + Math.sin(lf * 0.15) * 3;
  const clusterX = pl.bx + 260 * balakS - crawlOffset;
  const clusterY = pl.by + 6;
  const clusterS = balakS * 1.05;
  const crawlRot = Math.sin(lf * 0.2) * 1.5;
  const tortoisesCluster = (
    <g transform={`rotate(${crawlRot} ${clusterX} ${clusterY})`}>
      <ContactShadow x={clusterX} y={clusterY + 2} rx={210 * clusterS} ry={25 * clusterS} opacity={0.35} />
      <g filter="url(#ghibli-char-ink)">
        <image
          href={staticFile("visuals/ep05/ep05_prop_tortoises_cluster.png")}
          x={clusterX - 280 * clusterS}
          y={clusterY - 195 * clusterS}
          width={560 * clusterS}
          height={195 * clusterS}
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </g>
  );

  if (view === "compound") {
    const yard = (
      <g>
        <GhibliBalakGroundGlow x={pl.bx} y={pl.by + 4} rx={155 * balakS} ry={28 * balakS} level={0.45 + 0.55 * glow} />
        {renderBalak(null)}
        {tortoisesCluster}
      </g>
    );
    return (
      <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.compound, overflow: "hidden" }}>
        <GhibliStage cam={cam} background={KACHARI_BG.compound}>
          <SceneLights.Provider value={lights}>
            <GhibliKachariBackdrop view="compound" f={lf} cam={cam} veranda={undefined} yard={yard} />
            <GhibliKachariFloorLayer view="compound" f={lf} />
            <GhibliKachariForegroundAndGrade view="compound" f={lf} zoom={cam.zoom} showBokeh />
          </SceneLights.Provider>
        </GhibliStage>
      </div>
    );
  }

  const farFloor = (
    <g>
      <GhibliBalakGroundGlow x={pl.bx} y={pl.by + 4} rx={155 * balakS} ry={28 * balakS} level={0.45 + 0.55 * glow} />
      {tortoisesCluster}
      {surendra}
    </g>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.corner, overflow: "hidden" }}>
      <GhibliStage cam={cam} background={KACHARI_BG.corner}>
        <SceneLights.Provider value={lights}>
          <GhibliKachariBackdrop view="corner" f={lf} cam={cam} veranda={mother} cornerBehind={showMother ? binoy : undefined} />
          <GhibliKachariFloorLayer view="corner" f={lf}>
            {farFloor}
          </GhibliKachariFloorLayer>
          <GhibliLayer depth={1} extraBlur={shot.balakBlur ?? 0}>
            <GhibliCharFilterDefs f={lf} />
            {charuPre}
            <Deferred render={() => renderBalak(charuHoldAt.v)} />
            {shot.balakBlur ? <g filter="url(#ghibli-char-ink)">{charuVisual}</g> : null}
          </GhibliLayer>
          <GhibliLayer depth={1}>
            <GhibliCharFilterDefs />
            <g filter="url(#ghibli-char-ink)">
              {shot.balakBlur ? null : charuVisual}
            </g>
          </GhibliLayer>
          <GhibliKachariForegroundAndGrade view="corner" f={lf} zoom={cam.zoom} showBokeh={!shot.noGrass} />
        </SceneLights.Provider>
      </GhibliStage>
    </div>
  );
};
