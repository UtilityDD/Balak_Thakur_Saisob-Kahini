import React from "react";
import { clamp, EASE, lerp, makeActing, noise1, PoseKey, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { Tortoise, TortoiseProps, tortoiseBiteKeys, tortoiseGrips, tortoiseHead, tortoiseJawTip } from "../../cinematic/animals/Tortoise";
import { CAST } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState } from "../../cinematic/rig/lipsync";
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
} from "../../cinematic/rig/Puppet";
import {
  KACHARI,
  KACHARI_BG,
  KachariBackdrop,
  KachariFloorLayer,
  KachariForegroundLayer,
  KachariLightLayer,
  kachariGrade,
  kachariKeepInSet,
  type KachariView,
} from "../../cinematic/sets/KrishnanagarKachari";
import { cueLocalStory5, pausesFor5, storyToReal, useStory5 } from "../../episode/storyClock";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { SeatedChild, seatedChildHands, type SeatedChildProps, type SeatedExpression, type SeatedHandPoints, type SeatedPose } from "../../episode03/rig/SeatedChild";
import { EP05_SCENES } from "../timing";
import { EP05_CUES } from "../subtitles";

/**
 * Episode 5, scene 01 (01_tortoise_play): the tortoise. Book chapter 8 ("কচ্ছপের সাথে শিশু ঠাকুরের খেলা", book.xlsx
 * row 14): Binoy, coming home, hears a noise by the corner room and finds Surendra's little boy turning yesterday's
 * tortoises over by tail and side, standing bent over them ("উপুড় হয়ে দাঁড়িয়ে দাঁড়িয়ে"); grabbing the head for the tail,
 * he is bitten; Binoy shouts, everyone runs in, and the tortoise has already let go: no wound, no mark. Approved plan
 * STO-20, 03_Episodes/Episode_05_Tortoise_and_Gentle_Cow/01_Script_and_Storyboard/Ep05_Shots_and_Pauses_DRAFT.md,
 * "Scene 01".
 *
 * Place: the Krishnanagar kachari compound on a clear late morning (src/cinematic/sets/KrishnanagarKachari.tsx):
 * view "compound" for the held establishing wide, view "corner" (the neighbour's courtyard corner) for shots 2 to 6
 * and P3. Balak SITS cross-legged on the ground for the whole scene (STO-20b): SeatedChild design "plate", age 6, its
 * handsTo pose and seatedChildHands() for every contact; the
 * four tortoises are src/cinematic/animals/Tortoise.tsx (variants 0 to 3); Binoy, Charu, Surendra, Binoy's mother
 * (CAST.womanA) and a clerk at the kachari desk (CAST.listenerA) are Puppets.
 *
 * Clocks (as Episode 4's scenes): the narration anchors are story frames (cueLocalStory5) converted to REAL local
 * frames with R() (storyToReal); the camera, every figure and every tortoise run on real frames (lifeF). So a key
 * never lands inside a pause by accident, and the actions the plan puts inside the pauses go on there: Balak rights
 * T1 in P1; in P3 Charu raises his hand to her cheek and sighs, Surendra bends to look, Binoy scratches his head and
 * the glow brightens gently. Blinks, breathing and idle life run on lifeF inside the rigs.
 *
 * Shots (CAM-13: hard cuts on the cue snippets, every shot held, no moves; every cam through kachariKeepInSet):
 *   1 WIDE     (compound) from the fade-in: the kachari veranda with the clerk at the left, the neighbour's house at
 *              the right; by its corner room, small, Balak bent over the four tortoises beside the tipped basket,
 *              turning T1 over and back. Held through "কৃষ্ণনগরের কাছারি বাড়িতে একদিন".
 *   2 MEDIUM   (corner) cut 2 f before "ছোট্ট বীরু": Balak rolls T1 onto its back by tail and side (legs paddling),
 *              T2 plods in toward him, T3 plods, T4 sits by the basket; Binoy comes round the corner room at the left
 *              and stops, curious. Held through P1, in which Balak rights T1 and watches its head poke out.
 *   3 CLOSE    (low, tortoise height) cut at the end of P1, 8 f before "হঠাৎ": his near hand goes to T2's front end
 *              (6 to 8 f before the word; he takes the drawn-in head for the tail), the head shoots out and the jaws
 *              clamp on the side of his hand on the word; a blink of surprise. Held through P2: calm, a little amused.
 *   4 WIDE     (corner) cut 2 f before "সবাই": Binoy, both hands on his head, mouth open in a silent shout; Charu and
 *              Surendra hurry in through the fence gap; Binoy's mother at her door, a hand at her mouth; Balak still
 *              bent, his hand held by the tortoise.
 *   5 TWO-SHOT cut 2 f before "কিন্তু": Charu kneels and reaches for him; T2 opens its jaws as her hands arrive; he
 *              straightens, his hand in her two hands; she turns it palm up on "দাগ নেই", then over: no mark. He looks
 *              up at her with his calm faint smile. Surendra bends to look.
 *   6 CLOSE    (low) cut 2 f before "আর কচ্ছপও": T2, already free, head half in, turns and plods calmly back toward the
 *              others past Balak's bare feet (Balak soft behind it).
 *   P3 GROUP   cut at the start of P3: Charu holds his hand to her cheek and sighs; Surendra bends to look, puzzled;
 *              Binoy scratches his head; Balak looks past them at the tortoises with his serene smile, and his glow
 *              brightens gently (glow beat 1, decision 6). The chapter break that follows is drawn by Episode05.tsx
 *              (this scene fades nothing itself, as Episode 4's scene 01 before its break).
 *
 * Sound: Episode05.tsx places the SFX from S01_EVENTS (REAL scene-local frames: add the scene's startFrame, 639).
 */

const SCENE_ID = "01_tortoise_play";
const SCENE = EP05_SCENES.find((s) => s.sceneId === SCENE_ID) ?? { sceneId: SCENE_ID, component: "", startFrame: 639, durationFrames: 591 };
const DUR = SCENE.durationFrames;
const PAUSES = pausesFor5(SCENE_ID);

/* ------------------------------------------------------------------ */
/* Narration anchors (story frames) -> real local frames                */
/* ------------------------------------------------------------------ */

/** Story frame -> real local frame (the pauses before it added). */
const R = (story: number): number => storyToReal(story, PAUSES);
const cueFrom = (snippet: string, fallback: number): number => cueLocalStory5(snippet, SCENE_ID)?.from ?? fallback;
const pauseReal = (i: number, fbStory: number, fbFrames: number): [number, number] => {
  const p = PAUSES[i];
  const s = R(p ? p.atStory : fbStory);
  return [s, s + (p ? p.frames : fbFrames)];
};

/** The three pauses (real local frames [start, end)). */
const P1 = pauseReal(0, 148, 36); // after "…খেলা করছিল।"
const P2 = pauseReal(1, 236, 24); // after "…কামড়ে ধরল!"
const P3 = pauseReal(2, 482, 48); // after "…হাত ছেড়ে দিয়েছে!" (end)

/**
 * Voice onsets (story frames) from the cues and the measured silences of 01a (plan "Measured silences"): "ছোট্ট বীরু"
 * 3.10 s, "হঠাৎ" 6.49 s, "সবাই" 10.05 s, "কিন্তু" 12.88 s, "দাগ নেই" 15.24 s (57 f after "কিন্তু"), "আর কচ্ছপও" 16.58 s.
 */
const CUE = {
  chotto: cueFrom("ছোট্ট বীরু", 74),
  hothat: cueFrom("হঠাৎ", 155),
  sobai: cueFrom("সবাই", 241),
  kintu: cueFrom("কিন্তু", 309),
  ar: cueFrom("আর কচ্ছপও", 396),
};
/**
 * "খেলা করছিল" (story frame): the slow push into the play starts on it (CAM-13: one move for that sentence). Anchored to
 * the cue of its phrase (cueLocalStory5) plus the voice: "ছোট্ট বীরু" 3.10-3.88 s, then "কচ্ছপদের সাথে খেলা করছিল।"
 * 4.02-5.88 s read evenly, so "খেলা" at about 5.0 s = 46 f after the phrase's start.
 */
const KHELA_STORY = (() => {
  const c = cueLocalStory5("খেলা করছিল", SCENE_ID);
  const row = EP05_CUES.find((q) => q.text.includes("খেলা করছিল"));
  if (!c || !row) return 120;
  return c.from + 46;
})();
/** Real local frames of the voice onsets. */
const V = {
  chotto: R(CUE.chotto),
  khela: R(KHELA_STORY),
  hothat: R(CUE.hothat) + 1,
  sobai: R(CUE.sobai),
  kintu: R(CUE.kintu),
  dag: R(CUE.kintu + 57),
  ar: R(CUE.ar) + 2,
};

/* ------------------------------------------------------------------ */
/* Timeline (real local frames)                                         */
/* ------------------------------------------------------------------ */

/** T1 rolled onto its back and righted: once in the wide (A), once in the medium (B, righted inside P1). */
const ROLL_A = { grip: 10, over: 22, down: 38, back: 46, up: 62, let: 66 };
const ROLL_B = { grip: 90, over: 102, down: 120, back: P1[0] + 4, up: P1[0] + 20, let: P1[0] + 24 };
/** Reach for T2's front end 6 to 8 frames before "হঠাৎ"; the strike lands on the word. */
const REACH_AT = P1[1];
const STRIKE = V.hothat + 3;
const BITE_AT = STRIKE + 4;
/** The joyful play face: from shot 2's cut to shortly before the reach (it eases back over 18 f, done by the reach). */
const PLAY = { a: V.chotto - 2, b: REACH_AT - 18 };
/** Binoy's alarm and silent shout (the quiet of P2, then "সবাই"). */
const SHOUT = P2[1] - 2;
const HANDS_ON_HEAD = SHOUT - 8;
/** Charu and Surendra hurry in through the fence gap from the shout. */
const CHARU_RUN = { start: SHOUT, dur: 76 };
const SUREN_RUN = { start: SHOUT + 6, dur: 96 };
const KNEEL_AT = CHARU_RUN.start + CHARU_RUN.dur - 6;
const HOLD_AT = KNEEL_AT + 12;
/** T2 lets go as her hands arrive; the head goes back to `neck` after. */
const RELEASE = HOLD_AT + 6;
const HEAD_BACK = RELEASE + 20;
/** Balak straightens, his hand in hers. */
const RISE_AT = RELEASE + 7;
const IN_HANDS_AT = RISE_AT + 18;
/** Her hands turn his hand palm up on "দাগ নেই", then over again before the cut to shot 6. */
const TURN_UP = { a: Math.max(V.dag - 14, IN_HANDS_AT + 4), b: V.dag + 2 };
const TURN_OVER = { a: V.dag + 12, b: V.ar - 6 };
/** T2 turns away and plods back to the others (shot 6). */
const T2_TURN = { a: V.ar + 2, b: V.ar + 24 };
/** P3 actions (real frames inside the pause; they advance while the story waits). */
const P3A = P3[0];
const CHEEK = { a: P3A + 2, b: P3A + 22 };
const SIGH_AT = P3A + 14;
/** How far toward her cheek she raises his hand (his arm is short: she leans and bows her head to it). */
const CHEEK_K = 0.3;
const GLOW_UP = { a: P3A + 6, b: P3A + 34 };

/** Sound events for Episode05.tsx: REAL scene-local frames (absolute = SCENE.startFrame + f). */
export interface SceneSoundEvent {
  id: string;
  /** Real scene-local frame (add EP05_SCENES[2].startFrame = 639 for the absolute frame). */
  f: number;
  file: string;
  volume: number;
}
export const S01_EVENTS: SceneSoundEvent[] = [
  { id: "shell_tip_A", f: ROLL_A.over + 6, file: "sfx/ep05/shell_scrape.wav", volume: 0.12 },
  { id: "shell_down_A", f: ROLL_A.up - 2, file: "sfx/ep05/shell_scrape.wav", volume: 0.1 },
  { id: "shell_tip_B", f: ROLL_B.over + 6, file: "sfx/ep05/shell_scrape.wav", volume: 0.18 },
  { id: "shell_land_B", f: ROLL_B.down - 1, file: "sfx/ep02/clay_thud.wav", volume: 0.12 },
  { id: "shell_righted_B", f: ROLL_B.up - 2, file: "sfx/ep05/shell_scrape.wav", volume: 0.2 },
  { id: "bite", f: STRIKE + 3, file: "sfx/ep02/clay_thud.wav", volume: 0.15 },
  { id: "binoy_shout_gasp", f: SHOUT, file: "sfx/ep02/whoosh_soft.wav", volume: 0.15 },
  { id: "charu_steps", f: CHARU_RUN.start + 4, file: "sfx/ep02/footsteps_mud.wav", volume: 0.22 },
  { id: "charu_kneel_rustle", f: KNEEL_AT + 4, file: "sfx/ep02/cloth_rustle.wav", volume: 0.18 },
  { id: "t2_release_scrape", f: T2_TURN.a + 2, file: "sfx/ep05/shell_scrape.wav", volume: 0.12 },
  { id: "charu_cheek_rustle", f: CHEEK.a + 2, file: "sfx/ep02/cloth_rustle.wav", volume: 0.15 },
  { id: "glow_shimmer", f: GLOW_UP.a, file: "sfx/soft_magical_shimmer.wav", volume: 0.15 },
];
/** Other scene-local real frames Episode05.tsx may want (music duck on the bite, return on the unmarked hand). */
export const S01_TIMES = { strike: STRIKE, shout: SHOUT, kneel: KNEEL_AT, release: RELEASE, dag: V.dag, p3: P3A, dur: DUR } as const;

/* ------------------------------------------------------------------ */
/* Layout (corner view, floor plane world px) and the compound mapping   */
/* ------------------------------------------------------------------ */

/** Balak's spot (between his feet) and scale in the corner view. */
const BX = 760;
const BY = 945;
const BS = 0.95;
/** Tortoise scale in the corner (to scale with Balak: the tortoise rig's child is 245 px at s 1, this one 485). */
const TS = 1.3;

/** A placement of the whole little group: the corner (identity) or the compound wide (small, on the 0.65 yard). */
interface Place {
  bx: number;
  by: number;
  k: number;
}
const CORNER_PLACE: Place = { bx: BX, by: BY, k: 1 };
const COMPOUND_PLACE: Place = { bx: KACHARI.compound.balak.x, by: KACHARI.compound.balak.y, k: 0.215 / BS };
const mapP = (pl: Place, p: { x: number; y: number }) => ({ x: pl.bx + (p.x - BX) * pl.k, y: pl.by + (p.y - BY) * pl.k });

/** Charu kneels to his right (nearer the camera), facing left; Surendra stops behind her. */
const CHARU = { x: 952, y: 930, s: 1.1 };
const SUREN = { x: 1095, y: 905, s: 1.08 };
/** The fence gap (0.65 plane) seen from the shot 4 camera, as a floor-plane point (where the runs start). */
const GAP_FLOOR = { x: 1842, y: 884 };
/** Adult Puppet scale from the ground line (floor plane, a simple perspective through y 839). */
const adultScaleAt = (y: number) => clamp(0.0102 * (y - 839), 0.3, 1.4);

/* ------------------------------------------------------------------ */
/* Tortoises: choreography in corner coordinates                        */
/* ------------------------------------------------------------------ */

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
  // T1: rolled and righted by Balak (A, B); plods off behind his legs toward the basket after the bite
  {
    variant: 0,
    x0: 872,
    y0: 926,
    turnAway: (lf) => track(lf, [
      [212, 0],
      [242, 1],
    ]),
    heading: (lf) => 15 - 180 * track(lf, [
      [212, 0],
      [242, 1],
    ]),
    walk: (lf) => track(lf, [
      [236, 0],
      [246, 1],
      [P3A + 4, 1],
      [P3A + 18, 0],
    ]),
    speed: () => 1.25,
  },
  // T2: plods in toward him (shot 2), bites (shot 3), lets go (shot 5), turns and plods back past his feet (shot 6)
  {
    variant: 1,
    x0: 1022,
    y0: 962,
    turnAway: () => 0,
    heading: (lf) => lerp(172, 148, EASE.inOut(clamp((lf - T2_TURN.a) / (T2_TURN.b - T2_TURN.a)))),
    walk: (lf) => track(lf, [
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
  // T3: plods a few steps (shot 2), then on toward the basket
  {
    variant: 2,
    x0: 690,
    y0: 988,
    turnAway: () => 0,
    heading: () => 200,
    walk: (lf) => track(lf, [
      [78, 0],
      [88, 1],
      [134, 1],
      [144, 0],
      [306, 0],
      [316, 1],
      [430, 1],
      [442, 0],
    ]),
    speed: () => 0.95,
  },
  // T4: sits by the basket, head half in, blinking
  { variant: 3, x0: 590, y0: 962, turnAway: () => 0, heading: () => 158, walk: () => 0, speed: () => 0 },
];

/** Per-frame ground positions and travelled distance (integrated so the planted feet never slide). */
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

/** T1's roll (0 upright .. 1 on its back). */
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
/** T1's head: out while it is handled, in when righted, then it pokes out again (P1). */
const t1Neck = (lf: number) =>
  track(lf, [
    [ROLL_B.up - 2, 0.75],
    [ROLL_B.up + 4, 0.08],
    [ROLL_B.up + 8, 0.08],
    [P1[1] - 4, 0.8],
    [230, 0.8],
    [242, 0.55],
  ]);

/** The strike, the hold and the release of T2. */
const t2Bite = (lf: number) => tortoiseBiteKeys(lf, STRIKE, RELEASE, HEAD_BACK);
const t2Neck = (lf: number) =>
  track(lf, [
    [164, 0.8],
    [176, 0.1], // head drawn in as it stops: its front end looks like the tail end
    [HEAD_BACK, 0.1],
    [HEAD_BACK + 14, 0.4],
    [P3A + 20, 0.4],
    [P3A + 40, 0.6],
  ]);

/** Raw tortoise props (corner coordinates, before the placement mapping). */
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
  if (i === 0) {
    // the heading already includes the turn: pass turnAway only for the stepping feet, with yaw at the start heading
    return { ...base, yaw: 15, turnAway: sp.turnAway(lf), turnVia: "away", turnOver: t1TurnOver(lf), rollDir: 1, neck: t1Neck(lf) };
  }
  if (i === 1) return { ...base, neck: t2Neck(lf) };
  if (i === 2) return { ...base, neck: 0.62 + 0.12 * Math.sin(lf * 0.021 + 1.3) };
  return { ...base, neck: 0.42 + 0.06 * Math.sin(lf * 0.017), lid: track(lf, [[300, 0], [304, 0.9], [312, 0.9], [318, 0]]) };
};

/** Placed tortoise props (with T2's bite target from Balak's hand). */
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

/* ------------------------------------------------------------------ */
/* Balak (SeatedChild, plate design, age 6, on the real clock)          */
/* ------------------------------------------------------------------ */

/**
 * STO-20b (director, 2026-11-22): Balak SITS cross-legged on the ground for the whole scene. The hands go to the
 * tortoise grips, to T2's front end, are held by the jaws, then lie in Charu's hands, through the seated rig's
 * `handsTo` pose (handTargets near / far = palm centres, handShapes, handTurns, palmUp); seatedChildHands() gives the
 * drawn palms, the little-finger edge (the bite) and the glow anchor.
 */
const HANDS_POSE: SeatedPose = "handsTo";

type Pt = { x: number; y: number };
interface HandsState {
  /** Engaged (hands on targets) or resting on the knees. */
  engaged: boolean;
  near?: Pt;
  far?: Pt;
  palmUp?: number;
  /** When the current engaged / rest phase began (the rig blends 16 frames from it). */
  start: number;
  prevEngaged: boolean;
  prevStart: number;
}

/** Hand palm centre a little outside a rim grip (the fingers wrap over it). */
const palmOnGrip = (g: { x: number; y: number; out: Pt }, k: number) => ({ x: g.x + g.out.x * 6 * k, y: g.y + g.out.y * 6 * k - 2 * k });

/** The phases: [from, engaged]. */
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

/** Where his near hand lies when Charu holds it (figure units): out in front at about his lap/chest height. */
const HOLD_LOCAL = { x: 104, y: -92 };

/**
 * T2's jaw target: where its own head reaches with the neck stretched out, at its stop in front of his near knee (so
 * the strike is short and the head stays in view), with a small slow tug while it holds on. Per shot elevation.
 */
const t2Jaw = (lf: number, pl: Place, elev: number): Pt => {
  const at = tortoiseAt(1, STRIKE - 1, elev, pl);
  const j0 = tortoiseJawTip({ ...at, neck: 1, bite: 0, release: 0 });
  const u = Math.max(0, lf - BITE_AT);
  const env = clamp(u / 10);
  const tug = { x: 2.2 * Math.sin(u * 0.06) + 1.2 * noise1(u * 0.03, 7), y: 1.2 * Math.sin(u * 0.045 + 1) };
  return { x: j0.x - 6 * pl.k + env * tug.x * pl.k, y: j0.y - 2 * pl.k + env * tug.y * pl.k };
};

/** His hands this frame (world targets). charuHold: her hold point in P3 (the cheek), else his own hold position. */
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
    // the near hand to T2's front end (its drawn-in head, taken for the tail); the far hand back to its knee
    const h = tortoiseHead(tortoiseAt(1, REACH_AT, elev, pl));
    return { ...base, near: { x: h.beak.x - 3 * pl.k, y: h.beak.y - 8 * pl.k } };
  }
  const jaw = t2Jaw(Math.min(lf, RELEASE), pl, elev);
  // the palm near the jaws (balakAt places it exactly from the rig's little-finger edge offset)
  const bitten = { x: jaw.x - 4 * pl.k, y: jaw.y - 7 * pl.k };
  if (lf < RISE_AT) return { ...base, near: bitten };
  // freed: the hand comes up into Charu's hands; in P3 it goes with them to her cheek
  const up = EASE.inOut(clamp((lf - RISE_AT) / 20));
  const target = charuHold ?? holdW;
  const near = { x: lerp(bitten.x, target.x, up), y: lerp(bitten.y, target.y, up) };
  const turnUp = EASE.inOut(clamp((lf - TURN_UP.a) / (TURN_UP.b - TURN_UP.a)));
  const turnOver = EASE.inOut(clamp((lf - TURN_OVER.a) / (TURN_OVER.b - TURN_OVER.a)));
  return { ...base, near, palmUp: turnUp * (1 - turnOver) };
};

/** Where his eyes and smile go (real frames). */
const balakFace = (lf: number): SeatedChildProps["face"] => {
  // warm through the play, brightest as T1's head pokes out after he rights it (P1), then curious before the reach
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
    // P2: a calm, slightly amused regard at the tortoise holding on
    return { smile: track(lf, [[P2[0] - 6, 0.3], [P2[0] + 10, 0.5]]), eyesDown: 0.5, lookX: 0.45 };
  }
  // up at Charu with his calm faint smile; in P3 past them, down at the tortoises settling by the basket
  const past = track(lf, [
    [P3A + 8, 0],
    [P3A + 24, 1],
  ]);
  return { lookX: lerp(0.5, -0.6, past), eyesDown: lerp(0.05, 0.45, past), smile: lerp(0.45, 0.6, past) };
};

/** Expression: serene, joyful through the play, a start of surprise at the bite then calm amusement, serene after. */
const balakExpression = (lf: number): { expression: SeatedExpression; prevExpression: SeatedExpression; expressionStart: number } => {
  const keys: Array<[number, SeatedExpression]> = [
    [-999, "serene"],
    [PLAY.a, "joyful"],
    [PLAY.b, "serene"],
    [BITE_AT, "surprised"], // the bite lands on "হঠাৎ": brows up, a small "o", with the forced blink (blinkAt)
    [BITE_AT + 12, "playful"], // then the calm, slightly amused regard (the unrecorded line) through P2 and shot 4
    [RISE_AT, "serene"],
  ];
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (lf >= keys[k][0]) i = k;
  return { expression: keys[i][1], prevExpression: keys[Math.max(0, i - 1)][1], expressionStart: Math.max(0, keys[i][0]) };
};

/** Balak's props at real frame lf for a placement (and the hands state used). */
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
    // the blink of surprise as the jaws close
    blinkAt: BITE_AT,
  };
  if (hands.engaged) {
    props.handTargets = { near: hands.near ? L(hands.near) : undefined, far: hands.far ? L(hands.far) : undefined };
    if (lf < REACH_AT) {
      // both hands hooked round the shell rim, palms toward the shell, thumbs toward the camera
      props.handShapes = { near: "grip", far: "grip" };
      props.handTurns = { near: -1.6, far: -1.6 };
    } else if (lf < BITE_AT) {
      props.handShapes = { near: lf >= REACH_AT + 12 ? "grip" : "open" };
    } else if (lf < RISE_AT + 4 && hands.near) {
      // bitten: the little-finger edge between the jaws (the palm placed from the rig's own edge offset)
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


/** Balak's glow strength: steady, brightening gently only in P3 (glow beat 1, the unmarked hand). */
const glowAt = (lf: number) => 0.55 + 0.25 * EASE.inOut(clamp((lf - GLOW_UP.a) / (GLOW_UP.b - GLOW_UP.a)));
/* ------------------------------------------------------------------ */
/* People (Puppets on the real clock)                                   */
/* ------------------------------------------------------------------ */

const io = "inOut" as const;
const SUN: Lighting = { keySide: -1, rim: "#ffd98a", rimStrength: 0.3 };

/** Binoy: round the corner room (0.85 plane, cornerBehind slot), watches, the alarm, puzzled in P3. */
const BINOY_WALK: WalkOpts = {
  start: V.chotto + 8,
  dur: 62,
  fromX: KACHARI.corner.binoyHidden.x + 40,
  toX: KACHARI.corner.binoyStop.x,
  scale: KACHARI.corner.binoyStop.s ?? 0.75,
  height: CAST.binoy.height,
  seed: CAST.binoy.seed,
  kind: "hurry",
  bodyTurn: 0.6,
  stopIn: 12,
};
const binoyKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.6, smile: 0.3, eyeY: 0.1 },
  { f: BINOY_WALK.start + BINOY_WALK.dur + 2, in: 10, ease: io, bodyTurn: 0.55, eyeY: 0.3, headTilt: 3 },
  { f: P1[0] + 4, in: 16, ease: io, ...GESTURES5.curiousTilt, bodyTurn: 0.55, eyeY: 0.35 },
  { f: HANDS_ON_HEAD + 8, in: 8, ease: io, ...GESTURES5.handsOnHead, headTilt: 0, headTurn: 0, eyeY: 0.3 },
  { f: SHOUT + 50, ease: io, headHands: 1 },
  { f: SHOUT + 66, in: 16, ease: io, headHands: 0, brow: 0.45, browTilt: 0.4, smile: 0.05, lean: 2, eyeY: 0.35 },
  { f: P3A + 2, ease: io, scratch: 0 },
  { f: P3A + 14, in: 12, ease: io, ...GESTURES5.scratchHead, scratch: -1, eyeY: 0.3 },
]);
const binoyActing = (lf: number): Pose => ({ ...binoyKeys(lf), ...(lf >= BINOY_WALK.start && lf <= BINOY_WALK.start + BINOY_WALK.dur + 2 ? walkPose(lf, BINOY_WALK) : {}) });
const binoyX = (lf: number) => (lf < BINOY_WALK.start ? BINOY_WALK.fromX : walkTravel(lf, BINOY_WALK).bodyX);
const binoyMouth = (lf: number): MouthState => (lf > SHOUT && lf < SHOUT + 46 ? shoutMouth(lf, SHOUT, 46, 3) : MOUTH_REST);

/** A run from the fence gap to a stop, with the perspective scale growing as they come toward the camera. */
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

/** Charu: hurries in, kneels, takes his hand in both hands, turns it palm up and over, to her cheek and a sigh (P3). */
const charuKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.85, brow: 0.6, browTilt: 0.6, smile: 0, gasp: 0.18, eyeY: 0.2 },
  { f: KNEEL_AT + 22, in: 22, ease: io, kneel: 1, lean: 8, gasp: 0.05, eyeY: 0.4 },
  // T2 lets go; as he straightens his hand comes up within her reach and her two hands take it (from here on they
  // follow it every frame: holdAt is his drawn hand)
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
  const run = runPath(lf, CHARU_RUN, CHARU, CAST.charu.seed, CAST.charu.height, "hurry");
  const k = charuKeys(lf);
  return { ...run, acting: { ...k, ...run.pose } as Pose };
};
const charuSigh = (lf: number) => (lf > SIGH_AT && lf < SIGH_AT + 16 ? 1 : 0);

/** Surendra: hurries in behind her, bends to look, puzzled; bends to look again in P3. */
const surenKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.75, brow: 0.45, browTilt: 0.35, smile: 0.08 },
  { f: SUREN_RUN.start + SUREN_RUN.dur + 14, in: 20, ease: io, ...GESTURES5.bendToLook, bodyTurn: 0.75 },
  { f: TURN_OVER.a + 4, ease: io, lean: 16 },
  { f: TURN_OVER.a + 22, in: 18, ease: io, ...GESTURES5.puzzled, lean: 3, crouch: 0, headNod: 0, eyeY: 0.2, rS: 10, rE: -60 },
  { f: P3A + 4, ease: io, lean: 3 },
  { f: P3A + 26, in: 22, ease: io, ...GESTURES5.bendToLook, ...GESTURES5.puzzled, lean: 13, crouch: 0.06, headNod: 4, eyeY: 0.45 },
]);
const surenState = (lf: number) => {
  const run = runPath(lf, SUREN_RUN, SUREN, CAST.surendra.seed, CAST.surendra.height, "hurry");
  return { ...run, acting: { ...surenKeys(lf), ...run.pose } as Pose };
};

/** Binoy's mother comes to her doorway at the shout and stays there, fingertips at her mouth (calm, background). */
const MOTHER = KACHARI.corner.motherDoor;
const motherKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: -0.5, brow: 0.3, smile: 0.1 },
  { f: SHOUT + 40, in: 16, ease: io, ...GESTURES5.handAtMouth, mouthHand: 1, bodyTurn: -0.5 },
]);
const motherStep = (lf: number) => track(lf, [
  [SHOUT + 4, 0],
  [SHOUT + 30, 1],
]);

/** The clerk at the kachari desk (compound wide): seated, bent over his ledger, writing. */
const CLERK = KACHARI.compound.clerk;
const clerkActing = (lf: number): Pose => ({
  ...BASE_POSE,
  bodyTurn: 0.35,
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

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */

interface Shot {
  from: number;
  view: KachariView;
  cam: Cam;
  /** Tortoise camera elevation in this shot (degrees). */
  elev: number;
  name: string;
  /** Extra blur on Balak and Charu (the soft background in shot 6). */
  balakBlur?: number;
  /** No near grass and bokeh (the low close shots: nothing soft over the hands and the tortoise). */
  noGrass?: boolean;
  /** A slow eased push from `cam` to `to` over real frames [a, b], then held. */
  push?: { a: number; b: number; to: Cam };
}
/** A cam that puts floor point (wx, wy) at screen (sx, sy) at zoom z. */
const frameOn = (wx: number, wy: number, sx: number, sy: number, z: number): Cam => ({
  x: wx - 960 - (sx - 960) / z,
  y: wy - 540 - (sy - 540) / z,
  zoom: z,
});

const SHOTS: Shot[] = [
  { from: -Infinity, view: "compound", cam: { ...KACHARI.compound.cam }, elev: 24, name: "1 wide (compound)" },
  // shot 2: the medium, then (director, 2026-11-22) a slow push into the play on "খেলা করছিল", settled at the start of
  // P1 on his smiling face, his hands and T1; held through P1
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

/* ------------------------------------------------------------------ */
/* Small pieces                                                         */
/* ------------------------------------------------------------------ */

/** A faint warm glow on the earth round Balak (restrained, steady; a touch more with the P3 beat). */
const GroundGlow: React.FC<{ x: number; y: number; s: number; glow: number }> = ({ x, y, s, glow }) => (
  <g>
    <defs>
      <radialGradient id="s501-ground-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.4 * glow} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x + 30 * s} cy={y + 3 * s} rx={190 * s} ry={30 * s} fill="url(#s501-ground-glow)" />
  </g>
);

/** Renders its content when React reaches it (after earlier siblings, so their `anchors` callbacks have run). */
const Deferred: React.FC<{ render: () => React.ReactNode }> = ({ render }) => <>{render()}</>;

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene01TortoisePlay: React.FC = () => {
  const { lifeF } = useStory5(SCENE_ID);
  const lf = lifeF;
  const shot = shotAt(lf);
  const view = shot.view;
  const rawCam = (() => {
    if (!shot.push) return shot.cam;
    const u = EASE.inOut(clamp((lf - shot.push.a) / Math.max(1, shot.push.b - shot.push.a)));
    const a = shot.cam;
    const b = shot.push.to;
    const z = a.zoom * Math.pow(b.zoom / a.zoom, u);
    // keep the framing's centre moving in step with the zoom (screen-space interpolation of the target point)
    const k = (1 / a.zoom - 1 / z) / Math.max(1e-6, 1 / a.zoom - 1 / b.zoom);
    return { x: lerp(a.x, b.x, u === 0 ? 0 : k), y: lerp(a.y, b.y, u === 0 ? 0 : k), zoom: z };
  })();
  const cam = kachariKeepInSet(view, { ...rawCam, focus: 1, dof: 0, shake: 0 });
  const pl = view === "compound" ? COMPOUND_PLACE : CORNER_PLACE;
  const elev = shot.elev;

  /* ---- Charu first (her hold point for his hand in P3) ---- */
  const ch = charuState(lf);
  const charuVisible = view === "corner" && ch.visible;
  const charuHoldAt = { v: null as { x: number; y: number } | null };

  /* ---- Balak ---- */
  // his hand for her hands: from his own hands state (without her cheek); in P3 her cheek moves the hold point
  const balakBase = balakAt(lf, pl, elev, null);
  const cheekOn = lf >= CHEEK.a - 1;
  // her hands cup his near palm as the rig draws it (seatedChildHands), every frame
  const holdBase = balakBase.pts.nearPalm;
  const charuHoldTarget = () => holdBase;
  let charuPre: React.ReactNode = null;
  if (charuVisible && cheekOn) {
    // a hidden copy of Charu reports where her hands (at her cheek) hold his hand this frame
    charuPre = (
      <Puppet
        cast={CAST.charu}
        f={lf}
        lifeF={lf}
        x={ch.x}
        y={ch.y}
        scale={ch.sc}
        flip
        acting={(fr) => charuState(fr).acting}
        light={SUN}
        holdAt={charuHoldTarget}
        opacity={0}
        anchors={(a: PuppetAnchors) => {
          charuHoldAt.v = a.hold;
        }}
      />
    );
  }

  // T2's jaw (bite target) and Balak's final props
  const biteTarget = t2Jaw(lf, pl, elev);
  const tProps = [0, 1, 2, 3].map((i) => tortoiseAt(i, lf, elev, pl, i === 1 ? biteTarget : undefined));

  const glow = glowAt(lf);
  const balakS = BS * pl.k;

  const renderBalak = (holdPt: { x: number; y: number } | null) => {
    const r = cheekOn && holdPt ? balakAt(lf, pl, elev, holdPt) : balakBase;
    const g = r.pts.glowAnchor;
    return (
      <g>
        <BirulGlow cx={g.cx} cy={g.cy} r={g.r} glow={glow} f={lf} />
        <SeatedChild {...r.props} />
      </g>
    );
  };

  /* ---- people ---- */
  const su = surenState(lf);
  const mStep = motherStep(lf);
  const showMother = view === "corner" && lf >= SHOUT;

  const binoy = (
    <Puppet
      cast={CAST.binoy}
      f={lf}
      lifeF={lf}
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
      f={lf}
      lifeF={lf}
      x={MOTHER.x - 34 * (1 - mStep)}
      y={MOTHER.y}
      scale={MOTHER.s ?? 0.46}
      acting={motherKeys}
      light={SUN}
      opacity={clamp(mStep * 1.6)}
    />
  ) : null;

  const clerk = (
    <Puppet cast={CAST.listenerA} f={lf} lifeF={lf} x={CLERK.x} y={CLERK.y} scale={CLERK.s ?? 0.26} seated acting={clerkActing} light={SUN} />
  );

  const surendra =
    view === "corner" && su.visible ? (
      <Puppet cast={CAST.surendra} f={lf} lifeF={lf} x={su.x} y={su.y} scale={su.sc} flip acting={(fr) => surenState(fr).acting} light={SUN} breathRate={lf > SUREN_RUN.start && lf < SUREN_RUN.start + SUREN_RUN.dur + 60 ? 1.6 : 1} />
    ) : null;

  const charuVisual = charuVisible ? (
    <Puppet
      cast={CAST.charu}
      f={lf}
      lifeF={lf}
      x={ch.x}
      y={ch.y}
      scale={ch.sc}
      flip
      acting={(fr) => charuState(fr).acting}
      light={SUN}
      holdAt={charuHoldTarget}
      sigh={charuSigh}
      breathRate={lf > CHARU_RUN.start && lf < RISE_AT + 40 ? 1.55 : 1}
    />
  ) : null;

  const lights: SceneLight[] = [{ x: -400, y: -300, color: "#ffe6b0", intensity: 0.35, radius: 1800 }];

  /* ---- assembly ---- */
  const T = (i: number) => <Tortoise key={`t${i}`} {...tProps[i]} />;

  if (view === "compound") {
    const yard = (
      <g>
        <GroundGlow x={pl.bx} y={pl.by} s={balakS} glow={glow} />
        {T(0)}
        {T(2)}
        {T(3)}
        {renderBalak(null)}
        {T(1)}
      </g>
    );
    return (
      <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.compound, overflow: "hidden" }}>
        <Stage cam={cam} background={KACHARI_BG.compound}>
          <SceneLights.Provider value={lights}>
            <KachariBackdrop view="compound" f={lf} cam={cam} veranda={clerk} yard={yard} />
            <KachariFloorLayer view="compound" f={lf} />
            <KachariLightLayer view="compound" f={lf} />
            <KachariForegroundLayer view="compound" f={lf} />
            <Grade {...kachariGrade("compound")} />
          </SceneLights.Provider>
        </Stage>
      </div>
    );
  }

  // corner view: far tortoises and Surendra on the floor, Balak in his own layer (soft in shot 6), then Charu and T2
  const farFloor = (
    <g>
      <GroundGlow x={pl.bx} y={pl.by} s={balakS} glow={glow} />
      {T(0)}
      {T(3)}
      {T(2)}
      {surendra}
    </g>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.corner, overflow: "hidden" }}>
      <Stage cam={cam} background={KACHARI_BG.corner}>
        <SceneLights.Provider value={lights}>
          <KachariBackdrop view="corner" f={lf} cam={cam} veranda={mother} cornerBehind={binoy} />
          <KachariFloorLayer view="corner" f={lf}>
            {farFloor}
          </KachariFloorLayer>
          <Layer depth={1} extraBlur={shot.balakBlur ?? 0}>
            {charuPre}
            <Deferred render={() => renderBalak(charuHoldAt.v)} />
            {shot.balakBlur ? charuVisual : null}
          </Layer>
          <Layer depth={1}>
            {shot.balakBlur ? null : charuVisual}
            {T(1)}
          </Layer>
          <KachariLightLayer view="corner" f={lf} />
          <KachariForegroundLayer view="corner" f={lf} grass={!shot.noGrass} bokeh={!shot.noGrass} />
          <Grade {...kachariGrade("corner")} />
        </SceneLights.Provider>
      </Stage>
    </div>
  );
};
