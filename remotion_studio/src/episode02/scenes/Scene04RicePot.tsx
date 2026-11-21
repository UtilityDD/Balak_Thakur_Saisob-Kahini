import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { EP02_SCENES } from "../timing";
import { EP02_CUES } from "../subtitles";
import { clipLocalStory, clipSpan, cueLocalStory, pausesFor, storyToReal, useStory } from "../../episode/storyClock";
import { clamp, lerp, makeActing, noise1, PoseKey, TAU, track } from "../../cinematic/core/anim";
import { Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { DivineAura, DivineDefs, Motes } from "../../cinematic/divine/Divine";
import { Bokeh, Diya, Flame, Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { CAST } from "../../cinematic/rig/cast";
import { Hand } from "../../cinematic/rig/Hand";
import { HeadState } from "../../cinematic/rig/Head";
import { smoothPath } from "../../cinematic/rig/head3d";
import { MOUTH_REST, MouthState, visemeChatter } from "../../cinematic/rig/lipsync";
import { BASE_POSE, CastMember, Pose, Puppet, SceneLight, SceneLights } from "../../cinematic/rig/Puppet";
import { Matka } from "../rig/Matka";

/**
 * Episode 2 scene 04_rice_pot_miracle (682 frames of content, starts at absolute 3367). The scene's real
 * length is read from EP02_SCENES; anything past CONTENT_END is the breathing pause after the narration:
 * the family stays gathered around the tipped pot with Balak smiling inside, still patting the rice, the
 * glow settles and the camera drifts gently on before the outgoing transition.
 * Warm amber room, Padma daylight through the window. The big rice pot (matka) hangs from the beam
 * above the toddler. Its rope snaps, it turns over in a slow-motion fall and lands mouth-down over
 * him, covering him; warm light leaks from under the rim. The parents cry out, rush in, grip the
 * pot and tip it onto its side; through its mouth they find him sitting inside, smiling and patting
 * the rice. Babukaka (the father) calls it Narayan's boundless grace with a calm blessing.
 *
 * THREE CLOCKS (CAM-13, CAM-14; 2026-11-21 camera and pause pass, plan "Scene 04" in
 * Ep02_Shots_and_Pauses_DRAFT.md, approved STO-16):
 *   - real  (lifeF, scene-local real frames): breathing, blinks, idle life, the camera shot list (every key read
 *           from the subtitle cues, EP02_CUES), the fades and anything that moves inside a pause.
 *   - story (f from useStory): holds during the three pauses of EP02_PAUSES.
 *   - authored (a = authoredOf(f)): the frames this scene's choreography was written in. A piecewise-linear map
 *           re-times the authored beats onto the story cues (cueLocalStory), so the scream starts on "বাবা-মা"
 *           (after the pause on the covered pot), the grip on "কিন্তু মটকি", the reveal on "শিশুটি", the laugh on
 *           "হাসছে" and the blessing after the relief pause, with no beat cut in two by a pause. Authored frames
 *           0-150 (the hanging pot, the snap, the slow-motion fall, the landing) and 546 on are unchanged.
 *           Scene SFX written in authored frames convert with ricePotStoryFrame().
 * Pauses: P1 (open, 24 f) the chapter-break fade in on the held wide, the toddler patting the rice, the pot turning
 * a little on its rope; P2 (48 f, after "...ওপর!") the covered pot: dust settles, warm light leaks from under the
 * rim, the parents frozen in shock, breathing fast; P3 (48 f, after "...লাগেনি!") the close-up holds: the parents
 * look at each other, then at him, eyes wet, Charu's hand on her chest; he pats the rice and smiles up at them; his
 * glow brightens gently.
 * Authored beats (each starts 6 to 8 frames before its cue):
 *   0    "one day the big rice pot's rope"          beat 1: hanging pot
 *   78   "snapped and fell straight on the child"   beat 2: snap (71), fall, landing (111)
 *   168  "the parents cried out in fear"            beat 3: fear (161), rush to the pot
 *   248  "but when the pot was lifted"              beat 4: grip, strain, tip (241)
 *   311  "the child, through the pot's mouth..."    beat 5: reveal (304), glow swell
 *   494  Babukaka: "Narayan's boundless grace!"     beat 6: blessing (487)
 */

const SCENE_ID = "04_rice_pot_miracle";
const SCENE = EP02_SCENES.find((s) => s.sceneId === SCENE_ID)!;
/** Real length of the scene (frames), pauses included. */
const DUR = SCENE.durationFrames;
const PAUSES = pausesFor(SCENE_ID);
const PAUSE_TOTAL = PAUSES.reduce((s, p) => s + p.frames, 0);
/** Length of the scene in story (= authored, past 546) frames. */
const STORY_DUR = DUR - PAUSE_TOTAL;
/** Last frame of the narrated story (authored); STORY_DUR - CONTENT_END is the breathing hold after it. */
const CONTENT_END = 682;
/** Eased 0 to 1 across the breathing hold (0 throughout the narrated content); authored frames. */
const breathT = (a: number) => (STORY_DUR > CONTENT_END ? clamp((a - CONTENT_END) / (STORY_DUR - CONTENT_END)) : 0);

/** A story frame's real local frame (a pause's own atStory gives where that pause begins). */
const realOfStory = (s: number) => storyToReal(s, PAUSES);
/** A subtitle phrase (scene-local REAL frames), read from EP02_CUES; `at` = where `word` sits inside the phrase. */
const cueReal = (snippet: string, word?: string): { from: number; to: number; at: number } | undefined => {
  const next = EP02_SCENES[EP02_SCENES.indexOf(SCENE) + 1];
  const end = Math.min(SCENE.startFrame + DUR, next ? next.startFrame : Infinity);
  const c = EP02_CUES.find((q) => q.from >= SCENE.startFrame && q.from < end && q.text.includes(snippet));
  if (!c) return undefined;
  const from = c.from - SCENE.startFrame;
  const to = c.to - SCENE.startFrame;
  const k = word && c.text.includes(word) ? c.text.indexOf(word) / c.text.length : 0;
  return { from, to, at: Math.round(from + k * (to - from)) };
};
/** A subtitle phrase in story frames, with the same `at` for a word inside it. */
const cueStory = (snippet: string, word: string | undefined, fallback: number): number => {
  const c = cueLocalStory(snippet, SCENE_ID);
  if (!c) return fallback;
  const r = cueReal(snippet, word);
  const k = r && r.to > r.from ? (r.at - r.from) / (r.to - r.from) : 0;
  return Math.round(c.from + k * (c.to - c.from));
};

/* ---- authored <-> story map (anchors: [authored, story]) ---- */
const P3_STORY = PAUSES.length >= 3 ? PAUSES[2].atStory : 491;
const AUTH_ANCHORS: Array<[number, number]> = (() => {
  const raw: Array<[number, number]> = [
    [0, 0],
    [150, 150],
    // the pause on the covered pot (P2) holds the parents' frozen shock (authored 156, clear of the scream in the
    // Puppet's 9-frame pose filter); the scream gesture (authored 161) starts 4 frames into "বাবা-মা", the voice
    // itself a few frames later
    [156, cueStory("বাবা-মা", undefined, 184)],
    [248, cueStory("কিন্তু মটকি", undefined, 260)],
    [311, cueStory("শিশুটি", undefined, 320)],
    // the laugh ("হাসছে"): the giggle peaks just after the word starts
    [396, cueStory("ঢুকে হাসছে", "হাসছে", 413) - 8],
    [423, cueStory("আঁচড়ও", undefined, 426)],
    // P3 (after "...লাগেনি!") holds the settled relief (authored 485), the blessing (487) starts just after it ends
    [485, P3_STORY],
    [546, 546],
  ];
  // keep the map strictly increasing whatever the cue data says
  for (let i = 1; i < raw.length; i++) raw[i][1] = Math.max(raw[i][1], raw[i - 1][1] + 4);
  return raw;
})();
const mapPiecewise = (v: number, from: 0 | 1) => {
  const to = 1 - from;
  const A = AUTH_ANCHORS;
  if (v <= A[0][from]) return v - A[0][from] + A[0][to];
  for (let i = 0; i < A.length - 1; i++) {
    if (v <= A[i + 1][from]) return lerp(A[i][to], A[i + 1][to], (v - A[i][from]) / (A[i + 1][from] - A[i][from]));
  }
  const L = A[A.length - 1];
  return v - L[from] + L[to];
};
/** Authored (choreography) frame for a story frame. */
const authoredOf = (s: number) => mapPiecewise(s, 1);
/**
 * Story frame (scene-local) of a frame this scene's choreography was authored in. For the scene's SFX cues: an
 * authored cue frame `at` plays at story frame ricePotStoryFrame(at), i.e. real frame storyToReal(that, pauses).
 */
export const ricePotStoryFrame = (authored: number) => mapPiecewise(authored, 0);

/**
 * Last visible local (real) frame + 1: the next scene (the outro) starts on top of this one's last frames, read from
 * EP02_SCENES (never hard-coded), so anything drawn past VIS_END is covered. The closing fade ends here.
 */
const NEXT_SCENE = EP02_SCENES[EP02_SCENES.indexOf(SCENE) + 1];
const VIS_END = Math.max(realOfStory(CONTENT_END) + 15, Math.min(DUR, NEXT_SCENE ? NEXT_SCENE.startFrame - SCENE.startFrame : DUR));
/** Babukaka's line (04b_Babukaka.wav, EP02_CLIP_PARTS via clipLocalStory), in story frames: his lip sync runs on f. */
const BABU_STORY = clipLocalStory("04b_Babukaka.wav", SCENE_ID) ?? { from: 494, to: 662 };
const BABU_FROM = BABU_STORY.from;
const BABU_TO = BABU_STORY.to;
/** Real local frame where Babukaka's line starts (for the cut to his close-up 6 to 8 frames before it). */
const BABU_REAL = (() => {
  const span = clipSpan("04b_Babukaka.wav");
  return span ? span.startFrame - SCENE.startFrame : realOfStory(BABU_FROM);
})();

/* ---------------- layout ---------------- */

/** The pot hangs straight above the toddler and falls straight down onto him. */
const POT_X = 900;
const TODDLER_X = POT_X;
const CHARU_X = 540;
const BABU_X = 1240;
const BABU_SCALE = 1.42;
const CHARU_SCALE = 1.3;
const FLOOR_Y = 1010;
const BEAM_Y = 150;
/** Toddler scale, and his head centre in world px while seated on the floor. */
const TODDLER_SCALE = 0.95;
const TODDLER_HEAD_Y = FLOOR_Y - 118;

/* ---------------- pot geometry (Matka at s = POT_S) ---------------- */

/**
 * Matka at s = 1 is 264 px wide at the belly and 246 px tall. Its `y` is the floor line under it
 * (its lowest point), it turns about its axial centre (122 px above the base), and its children are
 * drawn in world coordinates, clipped to the mouth.
 */
const POT_S = 1;
/** Rope attachment above the floor line of the hanging (upright) pot: the top of the rim. */
const ROPE_TIE = 258 * POT_S;
/** Floor line of the hanging pot (its base). */
const HANG_Y = 600;
/** Mouth centre above the floor line once the pot lies on its side with the mouth to the viewer. */
const MOUTH_UP = 118 * POT_S;

/* ---------------- timeline (local frames) ---------------- */

// beat 2: the rope snaps 7 frames before "snapped" (78); the pot lands at LAND_AT.
const FALL_FROM = 71;
const ROPE_SNAP = 72;
const LAND_AT = 111;
const JOLT_FRAMES = 6;

/**
 * Slow motion on the fall only. The pot runs on its own clock: real speed at the drop's start,
 * easing to SLOW_MO just after the snap, held through the fall, then ramping back to real speed
 * over the last frames so the impact lands with weight. The landing frame stays exactly LAND_AT.
 */
const SLOW_MO = 0.45;
const fallRate = (f: number) =>
  track(f, [
    [FALL_FROM, 1],
    [ROPE_SNAP + 4, SLOW_MO],
    [LAND_AT - 6, SLOW_MO],
    [LAND_AT, 1, "in"],
  ]);
const FALL_SUB = 8;
const FALL_CLOCK: number[] = (() => {
  const out = [0];
  for (let i = 0; i < LAND_AT - FALL_FROM; i++) {
    let acc = 0;
    for (let k = 0; k < FALL_SUB; k++) acc += fallRate(FALL_FROM + i + (k + 0.5) / FALL_SUB) / FALL_SUB;
    out.push(out[i] + acc);
  }
  return out;
})();
const FALL_CLOCK_END = FALL_CLOCK[FALL_CLOCK.length - 1];

/** Fall progress 0 to 1 between FALL_FROM and LAND_AT, read from the slowed pot clock. */
const fallT = (f: number) => {
  const u = f - FALL_FROM;
  if (u <= 0) return 0;
  if (u >= LAND_AT - FALL_FROM) return 1;
  const i = Math.floor(u);
  return lerp(FALL_CLOCK[i], FALL_CLOCK[i + 1], u - i) / FALL_CLOCK_END;
};

/* ---------------- Balak Thakur, the sitting baby (about 1 year) ---------------- */

/*
 * The Puppet rig is an upright child, so the sitting baby is built here from soft SVG shapes (BAL-24):
 * a big round head drawn the newborn's way (SitHead, below), a short round trunk with a full belly, chubby
 * arms and legs with fat creases at the wrists, elbows, knees and ankles, small hands with five pudgy
 * fingers, little toes, soft shading, a golden rim light, a soft shadow where he sits and a cotton cloth
 * round the waist with a knot, a hanging end and folds that trail the hips (BAL-19, BAL-20).
 *
 * Figure units: the seat (where his bottom meets the floor or the rice) is the origin, y up is negative.
 * The head centre is 118 / TODDLER_SCALE units above the seat, so at TODDLER_SCALE it sits exactly on
 * TODDLER_HEAD_Y and at IN_SCALE on IN_HEAD_Y (the face close-ups are framed on those points).
 * Index 0 of every pair is the screen-left side (side -1), index 1 the screen-right side (side +1).
 * Hand directions are side-normalised: 0 points outward, +PI/2 down, -PI/2 up.
 */

const SKIN = "#d9a07a";
const SKIN_L = "#f0c4a0";
const SKIN_S = "#b47853";
const SKIN_D = "#8e5a3c";
const SOLE = "#efc3a6";
const PALM = "#eebc9a";
const CLOTH = "#fbf7ee";
const CLOTH_S = "#d8cdb9";
const RIM = "#ffd98a";
/** Light comes from the upper right (the window and the key side of the room). */
const LD: V2 = [0.51, -0.86];

const B_HEAD_Y = -118 / TODDLER_SCALE;
const B_UA = 32;
const B_FA = 29;

interface HandSt {
  /** Wrist target (figure units). */
  w: V2;
  /** Side-normalised finger direction (0 outward, +PI/2 down, -PI/2 up). */
  dir: number;
  curl: number;
  pinch: number;
  spread: number;
  /** 1 = palm flat and pressed (patting the rice). */
  flat: number;
  /** 1 = palm turned to the viewer (waving, showing the grains). */
  palm: number;
  /** Squash just after a pat lands (0..1). */
  land: number;
}

interface BabyFace {
  eyeX: number;
  eyeY: number;
  close: number;
  squint: number;
  brow: number;
  smile: number;
  gasp: number;
  cheeks: number;
  /** Soft giggle: how far the mouth opens (0..0.45). */
  open: number;
  yaw: number;
}

interface BabyPose {
  f: number;
  /** Upper-body sway about the seat, degrees. */
  sway: number;
  /** Forward lean toward the rice (the shoulders and head come down), units. */
  lean: number;
  /** Wriggle bounce (the body lifts), units. */
  bob: number;
  /** Hip wiggle, units. */
  wig: number;
  /** The hips four frames ago, for the cloth that trails them. */
  wigLag: number;
  bobLag: number;
  breath: number;
  headX: number;
  headY: number;
  headTilt: number;
  l: HandSt;
  r: HandSt;
  /** Foot kick 0..1 for [screen-left, screen-right]. */
  kick: [number, number];
  toeCurl: number;
  face: BabyFace;
}

/** Slow, calm deliberate blinks (BAL-14): the lids close over 8 frames, rest 3, lift over 12. */
const slowBlink = (f: number, starts: number[]) =>
  starts.reduce((m, c) => Math.max(m, clamp((f - c) / 8) * (1 - clamp((f - c - 11) / 12))), 0);

/**
 * A pat: the hand lifts and slaps down flat on each contact frame (the lift peaks a little after the
 * middle, so it comes down quickly), then a short squash as it lands.
 */
const patAt = (f: number, contacts: number[], up = 7) => {
  let lift = 0;
  let land = 0;
  for (const c of contacts) {
    const t = (f - (c - up)) / up;
    if (t > 0 && t < 1) lift = Math.max(lift, Math.sin(Math.PI * Math.pow(t, 0.8)));
    if (f >= c && f < c + 7) land = Math.max(land, Math.exp(-(f - c) / 2));
  }
  return { lift, land };
};

/** Soft, irregular baby timing: a phase that speeds up and slows down (seeded noise). */
const babyPhase = (f: number, rate: number, seed: number) => f * rate + 1.3 * noise1(f * 0.045, seed);

const hand = (w: V2, dir: number, o: Partial<HandSt> = {}): HandSt => ({ w, dir, curl: 0.3, pinch: 0, spread: 0.5, flat: 0, palm: 0, land: 0, ...o });

/** He leans toward the rice whenever a hand reaches low (overlapping action: the body follows the hand). */
const autoLean = (key: number, l: HandSt, r: HandSt) => key + 0.5 * Math.max(0, Math.max(l.w[1], r.w[1]) + 34);

/* ---- on the floor (beats 1 and 2): plays with the spilled rice, then looks up at the pot ---- */

// the two negative contacts play in the opening pause (P1), where the floor baby runs on a pre-roll clock
const FLOOR_PATS_L = [-19, -8, 7, 18, 31, 45, 53];
const FLOOR_DROPS: Array<{ at: number; side: 1 | -1; trickle?: boolean }> = [{ at: 42, side: 1 }];

const floorSway = (f: number) => 1.6 * Math.sin(f * 0.065 + 0.4) + 0.7 * noise1(f * 0.045, 3);

const floorPose = (f: number): BabyPose => {
  // screen-left hand pats the rice heap beside his knee (irregular beats), then rests on his knee
  const pl = patAt(f, FLOOR_PATS_L);
  const patting = 1 - clamp((f - 54) / 8);
  const l = hand(
    [track(f, [[0, -42], [56, -42], [66, -48], [100, -46]]) + 1.2 * noise1(f * 0.07, 11), track(f, [[0, -16], [56, -16], [66, -30], [100, -32]]) - 12 * pl.lift * patting],
    track(f, [[0, 1.3], [56, 1.3], [66, 1.05]]),
    { flat: patting, curl: lerp(0.35, 0.04, patting), spread: lerp(0.45, 0.75, patting), land: pl.land * patting },
  );
  // screen-right hand: reaches into the heap, pinches a few grains, lifts them to look, lets them fall,
  // and later lifts open toward the hanging pot, curious
  const r = hand(
    [
      track(f, [[0, 48], [12, 48], [22, 42], [30, 42], [40, 24], [48, 23], [58, 46], [68, 36], [84, 38], [110, 36]]) + noise1(f * 0.06, 13),
      track(f, [[0, -30], [12, -30], [22, -16], [30, -16], [40, -56], [48, -54], [58, -30], [68, -80], [84, -86], [110, -80]]) + noise1(f * 0.05, 17),
    ],
    track(f, [[0, 1.2], [22, 1.45], [30, 1.4], [40, -1.2], [48, -1.25], [58, 1.15], [68, -1.15], [110, -1.2]]),
    {
      pinch: track(f, [[21, 0], [27, 1], [41, 1], [45, 0, "out"]]),
      curl: track(f, [[0, 0.35], [14, 0.05], [45, 0.05], [56, 0.35], [64, 0.1], [110, 0.15]]),
      spread: track(f, [[0, 0.4], [14, 0.85], [22, 0.8], [30, 0.4], [45, 0.9], [56, 0.4], [64, 1], [110, 0.9]]),
      palm: track(f, [[30, 0], [40, 0.7], [48, 0.7], [58, 0], [68, 0.85]]),
    },
  );
  const eyeX = (fr: number) => track(fr, [[0, -0.35], [12, 0.4], [38, 0.25], [46, 0.1], [52, -0.25], [57, 0], [62, 0.05]]);
  const giggleToes = clamp((f - 42) / 4) * (1 - clamp((f - 54) / 8));
  return {
    f,
    sway: floorSway(f),
    lean: autoLean(track(f, [[0, 0], [58, 0], [68, -3], [110, -3]]), l, r),
    bob: 0,
    wig: 0.6 * noise1(f * 0.05, 5),
    wigLag: 0.6 * noise1((f - 4) * 0.05, 5),
    bobLag: 0,
    breath: Math.sin((f * TAU) / 40),
    headX: 0,
    // he lifts his chin as he looks up at the pot (the eyes go first, 58-60; the head follows, 60-68)
    headY: track(f, [[0, 2], [60, 2], [68, -3], [110, -3]]),
    headTilt: track(f, [[0, 4], [24, -3], [44, 5], [58, 0], [68, 7], [100, 5]]) + 0.6 * floorSway(f - 4),
    l,
    r,
    kick: [0.2 * giggleToes * (0.5 + 0.5 * Math.sin(f * 0.9)), 0.2 * giggleToes * (0.5 + 0.5 * Math.sin(f * 0.8 + 2))],
    toeCurl: 0.5 * giggleToes,
    face: {
      eyeX: eyeX(f),
      eyeY: track(f, [[0, 0.55], [14, 0.6], [34, 0.35], [42, 0.2], [48, 0.5], [56, 0.4], [60, -0.85, "out"], [110, -0.85]]),
      close: 0,
      squint: track(f, [[0, 0.12], [42, 0.28], [56, 0.12], [62, 0], [96, 0.08]]),
      brow: track(f, [[58, 0], [64, 0.35], [84, 0.25], [100, 0.15]]),
      smile: track(f, [[0, 0.45], [42, 0.62], [56, 0.45], [62, 0.25], [80, 0.4], [96, 0.5]]),
      // a small, round "oh" of curiosity as he looks up, settling back to calm
      gasp: track(f, [[58, 0], [64, 0.18], [80, 0.1], [96, 0.04]]),
      cheeks: track(f, [[0, 0.3], [42, 0.45], [56, 0.3]]),
      open: 0,
      // the head turn follows the eyes about five frames later
      yaw: 0.28 * eyeX(f - 5),
    },
  };
};

/* ---- inside the pot (beats 5 and 6, and the breath) ---- */

const POT_PATS_R = [353, 361, 370, 381, 433, 449, 467, 542, CONTENT_END + 21, CONTENT_END + 62];
const POT_DROPS: Array<{ at: number; side: 1 | -1; trickle?: boolean }> = [
  { at: 374, side: -1 },
  { at: 632, side: -1, trickle: true },
];
const POT_BLINKS = [524, 581, 637, CONTENT_END + 38];

/** Happy wriggle strength: on the first sight of his parents and again on the laugh (cue 396). */
const wriggleAt = (f: number) =>
  track(f, [
    [300, 0],
    [316, 0.2],
    [322, 1],
    [344, 0.8],
    [354, 0.3],
    [392, 0.3],
    [398, 1],
    [420, 0.9],
    [436, 0.25],
    [480, 0.1],
    [500, 0],
  ]);
/** Waving both hands, playful (the wave reaches its height a few frames after the wriggle starts). */
const waveAt = (f: number) =>
  track(f, [
    [312, 0],
    [323, 1],
    [340, 1],
    [349, 0],
    [391, 0],
    [400, 1],
    [416, 1],
    [427, 0],
  ]);
/** Soft giggle: a short one when he sees his parents, and on the laugh cue (396). */
const giggleAt = (f: number) =>
  track(f, [
    [318, 0],
    [323, 0.6],
    [335, 0.6],
    [342, 0],
    [393, 0],
    [398, 1],
    [415, 1],
    [424, 0],
  ]);
/** Calm: after the laugh the play settles; through the blessing he is serene and still (BAL-22). */
const calmAt = (f: number) => track(f, [[470, 0], [500, 1]]);

const potSway = (f: number) => (1 - 0.45 * calmAt(f)) * (1.4 * Math.sin(f * 0.06 + 1) + 0.6 * noise1(f * 0.04, 9));
const potWig = (f: number) => wriggleAt(f) * 3 * Math.sin(babyPhase(f, 0.21, 21));
const potBob = (f: number) => wriggleAt(f) * 2.6 * Math.abs(Math.sin(babyPhase(f, 0.38, 23)));

/**
 * The relief pause (P3, after "...লাগেনি!"): the story holds at authored 485 while he keeps playing on the real
 * clock. `e` = real frames into the pause (-1 outside it). He gives the rice two pats with his screen-right hand,
 * smiles up at his mother, blinks slowly, then smiles up at his father; everything blends back to the held story
 * pose by the end of the pause, so the blessing continues from it with no jump.
 */
const P3_PATS = [12, 27];
const potPoseP3 = (base: BabyPose, e: number): BabyPose => {
  if (e < 0) return base;
  const w = ease5(e / 8) * (1 - ease5((e - 39) / 9));
  if (w <= 0) return base;
  const pr = patAt(e, P3_PATS, 8);
  const r: HandSt = {
    ...base.r,
    w: [base.r.w[0], base.r.w[1] - 11 * pr.lift * w],
    flat: lerp(base.r.flat, 1, w),
    curl: lerp(base.r.curl, 0.06, w),
    land: Math.max(base.r.land, pr.land * w),
  };
  const toMum = ease5((e - 4) / 8) * (1 - ease5((e - 22) / 8));
  const toDad = ease5((e - 24) / 8);
  const eyeX = lerp(base.face.eyeX, -0.55 * toMum + 0.5 * toDad, w);
  return {
    ...base,
    r,
    lean: base.lean + 1.2 * pr.lift * w,
    headTilt: base.headTilt + w * (-3 * toMum + 3 * toDad),
    face: {
      ...base.face,
      eyeX,
      eyeY: lerp(base.face.eyeY, -0.5, w),
      close: Math.max(base.face.close, slowBlink(e, [17])),
      smile: Math.min(1, base.face.smile + 0.18 * w),
      squint: base.face.squint + 0.12 * w,
      yaw: lerp(base.face.yaw, 0.28 * eyeX, w),
    },
  };
};

const potPose = (f: number, e = -1): BabyPose => potPoseP3(potPoseBase(f), e);

const potPoseBase = (f: number): BabyPose => {
  const W = wriggleAt(f);
  const V = waveAt(f);
  const calm = calmAt(f);
  // screen-right hand: pats the rice flat beside him; through the blessing it rests on his knee and only
  // now and then gives the rice a slow pat
  const onKnee = track(f, [
    [488, 0],
    [502, 1],
    [528, 1],
    [535, 0],
    [548, 0],
    [562, 1],
    [CONTENT_END + 8, 1],
    [CONTENT_END + 14, 0],
    [CONTENT_END + 27, 0],
    [CONTENT_END + 35, 1],
    [CONTENT_END + 49, 1],
    [CONTENT_END + 55, 0],
    [CONTENT_END + 68, 0],
    [CONTENT_END + 76, 1],
  ]);
  const pr = patAt(f, POT_PATS_R, lerp(7, 10, calm));
  const rBase = hand(
    [lerp(46, 50, onKnee) + noise1(f * 0.06, 31), lerp(-16, -31, onKnee) - lerp(12, 8, calm) * pr.lift],
    lerp(1.3, 1.05, onKnee),
    { flat: 1 - onKnee, curl: lerp(0.04, 0.35, onKnee), spread: lerp(0.75, 0.45, onKnee), land: pr.land * (1 - onKnee) },
  );
  // screen-left hand: rests on the rice, picks up grains (352-360), lifts them to look (360-372), lets
  // them fall (374); later a slow trickle of grains through his fingers during the blessing (600-640)
  const lBase = hand(
    [
      track(f, [[285, -44], [346, -44], [352, -46], [360, -46], [372, -26], [378, -26], [390, -42], [428, -42], [436, -50], [592, -50], [600, -46], [608, -46], [624, -28], [640, -28], [656, -50]]) + noise1(f * 0.05, 33),
      track(f, [[285, -16], [346, -16], [352, -15], [360, -15], [372, -52], [378, -50], [390, -18], [428, -18], [436, -31], [592, -31], [600, -15], [608, -15], [624, -48], [640, -46], [656, -31]]),
    ],
    track(f, [[285, 1.3], [360, 1.4], [372, -1.2], [378, -1.2], [390, 1.3], [436, 1.1], [600, 1.4], [624, -1.1], [642, -1.1], [656, 1.1]]),
    {
      pinch: track(f, [[352, 0], [358, 1], [373, 1], [377, 0], [600, 0], [607, 1], [630, 1], [641, 0, "linear"]]),
      curl: track(f, [[285, 0.3], [346, 0.3], [352, 0.05], [378, 0.05], [390, 0.3], [600, 0.3], [604, 0.05], [642, 0.05], [656, 0.35]]),
      spread: track(f, [[346, 0.5], [352, 0.85], [360, 0.4], [374, 0.9], [390, 0.5], [600, 0.85], [608, 0.4], [636, 0.8], [656, 0.45]]),
      palm: track(f, [[360, 0], [372, 0.6], [378, 0.6], [390, 0], [608, 0], [624, 0.65], [640, 0.6], [656, 0]]),
      flat: track(f, [[346, 0.6], [352, 0], [384, 0], [392, 0.6], [428, 0.6], [436, 0]]),
    },
  );
  // waving: both hands up, elbows bent, the wrists waving loosely (left and right out of step)
  const wave = (side: 1 | -1): HandSt => {
    const ph = babyPhase(f, 0.5, side > 0 ? 41 : 43) + (side > 0 ? 0 : 2.1);
    return hand([side * (42 + 6 * Math.sin(ph)), -89 + 3 * Math.sin(ph * 1.6 + 1)], -1.35 + 0.45 * Math.sin(ph + 0.6), { curl: 0.08, spread: 1, palm: 1 });
  };
  const mix = (a: HandSt, b: HandSt, t: number): HandSt =>
    t <= 0
      ? a
      : {
          w: [lerp(a.w[0], b.w[0], t), lerp(a.w[1], b.w[1], t)],
          dir: lerp(a.dir, b.dir, t),
          curl: lerp(a.curl, b.curl, t),
          pinch: lerp(a.pinch, b.pinch, t),
          spread: lerp(a.spread, b.spread, t),
          flat: lerp(a.flat, b.flat, t),
          palm: lerp(a.palm, b.palm, t),
          land: a.land * (1 - t),
        };
  const r = mix(rBase, wave(1), V);
  const l = mix(lBase, wave(-1), V);
  const g = giggleAt(f);
  const eyeX = (fr: number) =>
    track(fr, [
      [285, 0],
      [304, 0],
      [310, -0.6], // to his mother first...
      [328, -0.55],
      [334, 0.6], // ...then his father
      [350, 0.55],
      [356, 0.1], // down at the rice he pats
      [384, 0.1],
      [388, -0.5],
      [404, -0.4],
      [410, 0.5],
      [426, 0.45],
      [432, -0.45],
      [452, -0.4],
      [460, 0.1],
      [476, 0.2],
      [492, 0.55], // up at his father through the blessing
      [560, 0.55],
      [580, 0.3],
      [600, -0.2], // watching the grains trickle from his fingers
      [636, -0.1],
      [650, 0.5],
      [668, 0.45],
      [CONTENT_END + 4, 0.5],
      [CONTENT_END + 30, -0.45],
      [CONTENT_END + 56, 0.1],
    ]);
  const kickPh = (seed: number, rate: number) => 0.5 + 0.5 * Math.sin(babyPhase(f, rate, seed));
  return {
    f,
    sway: potSway(f),
    lean: autoLean(track(f, [[300, 1], [500, 1], [520, 0]]), l, r),
    bob: potBob(f),
    wig: potWig(f),
    wigLag: potWig(f - 4),
    bobLag: potBob(f - 4),
    breath: Math.sin((f * TAU) / lerp(40, 46, calm)),
    headX: 2 * 0.28 * eyeX(f - 5),
    // the head bobs a little with the giggle, a beat behind the body
    headY: -1.4 * g * Math.abs(Math.sin(f * 0.6)) + 0.5 * potBob(f - 3),
    headTilt:
      track(f, [[304, -2], [318, 5], [334, -4], [356, 3], [388, -4], [400, 7, "backOut"], [412, 3], [432, -4], [476, 2], [500, -3], [560, 1], [620, -2], [CONTENT_END, 1]]) +
      0.6 * potSway(f - 4) +
      1.5 * calm * Math.sin((f / 120) * TAU),
    l,
    r,
    kick: [W * kickPh(51, 0.41), W * kickPh(53, 0.47)],
    toeCurl: 0.6 * W * kickPh(55, 0.3) + 0.25 * g,
    face: {
      eyeX: eyeX(f),
      eyeY: track(f, [[285, -0.6], [304, -0.5], [310, -0.45], [350, -0.4], [356, 0.45], [384, 0.4], [388, -0.45], [426, -0.45], [432, -0.35], [476, -0.3], [492, -0.5], [580, -0.45], [600, 0.35], [636, 0.3], [650, -0.45], [CONTENT_END, -0.4]]),
      // serene: calm lids only slightly lowered and slow deliberate blinks once his father speaks
      close: Math.max(0.12 * calm, slowBlink(f, POT_BLINKS)),
      // joyful eye smile: the lower lids lift into soft crescents
      squint: track(f, [[304, 0.1], [318, 0.4], [350, 0.38], [356, 0.2], [392, 0.3], [398, 0.55], [420, 0.5], [436, 0.3], [480, 0.22], [500, 0.12]]),
      brow: track(f, [[304, 0.1], [318, 0.22], [356, 0.05], [398, 0.2], [420, 0.15], [440, 0.05], [500, 0]]),
      smile: track(f, [[285, 0.35], [304, 0.4], [318, 0.8, "out"], [350, 0.8], [356, 0.65], [388, 0.75], [398, 0.92], [420, 0.9], [436, 0.72], [480, 0.62], [500, 0.45], [CONTENT_END, 0.45], [CONTENT_END + 40, 0.55]]),
      gasp: 0,
      cheeks: track(f, [[304, 0.3], [318, 0.65], [356, 0.5], [398, 0.85], [420, 0.8], [440, 0.55], [500, 0.4]]),
      // a soft giggle: the mouth opens a little in small irregular pulses, never a wide grin
      open: g * (0.12 + 0.24 * Math.max(0, Math.sin(babyPhase(f, 1.15, 61)))),
      yaw: 0.28 * eyeX(f - 5),
    },
  };
};

/* ---- geometry ---- */

interface BabyGeo {
  body: (q: V2) => V2;
  hipsAt: (q: V2) => V2;
  sh: [V2, V2];
  el: [V2, V2];
  wr: [V2, V2];
  hip: [V2, V2];
  knee: [V2, V2];
  ankle: [V2, V2];
  head: V2;
  headTilt: number;
  headScale: number;
}

/** Two-bone arm: the elbow bends out to the side and down; the wrist stops short if the target is out of reach. */
const babyArm = (S: V2, T: V2, side: 1 | -1): { E: V2; W: V2 } => {
  const dx = T[0] - S[0];
  const dy = T[1] - S[1];
  const d = Math.hypot(dx, dy) || 1e-3;
  const dd = clamp(d, Math.abs(B_UA - B_FA) + 4, (B_UA + B_FA) * 0.96);
  const ux = dx / d;
  const uy = dy / d;
  const Wp: V2 = [S[0] + ux * dd, S[1] + uy * dd];
  const a = Math.acos(clamp((B_UA * B_UA + dd * dd - B_FA * B_FA) / (2 * B_UA * dd), -1, 1));
  const base = Math.atan2(uy, ux);
  const e1: V2 = [S[0] + B_UA * Math.cos(base + a), S[1] + B_UA * Math.sin(base + a)];
  const e2: V2 = [S[0] + B_UA * Math.cos(base - a), S[1] + B_UA * Math.sin(base - a)];
  const sc = (e: V2) => side * e[0] + 0.5 * e[1];
  return { E: sc(e1) >= sc(e2) ? e1 : e2, W: Wp };
};

const solveBaby = (p: BabyPose): BabyGeo => {
  const a = (p.sway * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const pivotY = -10;
  // the trunk sways about the seat; the higher a point, the more the lean brings it down (seen from the
  // front a forward lean shortens the trunk); the belly widens and the chest lifts with each breath
  const body = (q: V2): V2 => {
    const k = clamp((-q[1] - 18) / 60);
    const x = q[0] * (1 + 0.018 * p.breath * (1 - k));
    const y = q[1] + p.lean * k - 0.8 * p.breath * k;
    const dy = y - pivotY;
    return [p.wig + x * ca - dy * sa, pivotY - p.bob + x * sa + dy * ca];
  };
  const hipsAt = (q: V2): V2 => [q[0] + p.wig, q[1] - 0.7 * p.bob];
  const sh: [V2, V2] = [body([-27, -78]), body([27, -78])];
  const al = babyArm(sh[0], p.l.w, -1);
  const ar = babyArm(sh[1], p.r.w, 1);
  const kneeOf = (side: 1 | -1, k: number): V2 => [side * 56 + 0.4 * p.wig, -18 - 0.4 * p.bob - 5 * k];
  // the feet stay within about 10 units below the seat, so on the floor they stay clear of the caption band
  const ankleOf = (side: 1 | -1, k: number): V2 => [side * (17 + 2 * k) + 0.2 * p.wig, -4 - 0.2 * p.bob - 8 * k];
  const hb = body([p.headX, B_HEAD_Y + p.headY]);
  return {
    body,
    hipsAt,
    sh,
    el: [al.E, ar.E],
    wr: [al.W, ar.W],
    hip: [body([-19, -18]), body([19, -18])],
    knee: [kneeOf(-1, p.kick[0]), kneeOf(1, p.kick[1])],
    ankle: [ankleOf(-1, p.kick[0]), ankleOf(1, p.kick[1])],
    head: [hb[0], hb[1] + 0.15 * p.lean],
    headTilt: p.headTilt + p.sway,
    headScale: 1 + 0.004 * p.lean,
  };
};

/* ---- drawing helpers ---- */

const fmt2 = (q: V2) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
const add = (q: V2, d: V2, k = 1): V2 => [q[0] + d[0] * k, q[1] + d[1] * k];
const mixV = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** A soft tapered segment: radius ra at a, rb at b, round ends, one closed outline (no seams). */
const Taper: React.FC<{ a: V2; b: V2; ra: number; rb: number; col: string; op?: number; stroke?: string }> = ({ a, b, ra, rb, col, op = 1, stroke }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  if (l <= Math.abs(ra - rb) + 0.01) {
    const big = ra >= rb ? { c: a, r: ra } : { c: b, r: rb };
    return <circle cx={big.c[0]} cy={big.c[1]} r={big.r} fill={col} opacity={op} stroke={stroke ?? col} strokeWidth={stroke ? 0.5 : 0.4} />;
  }
  const ux = dx / l;
  const uy = dy / l;
  const nx = -uy;
  const ny = ux;
  const sn = (ra - rb) / l;
  const cs = Math.sqrt(Math.max(0, 1 - sn * sn));
  const m1: V2 = [nx * cs + ux * sn, ny * cs + uy * sn];
  const m2: V2 = [-nx * cs + ux * sn, -ny * cs + uy * sn];
  const a1 = add(a, m1, ra);
  const b1 = add(b, m1, rb);
  const b2 = add(b, m2, rb);
  const a2 = add(a, m2, ra);
  const d = `M ${fmt2(a1)} L ${fmt2(b1)} A ${rb.toFixed(2)} ${rb.toFixed(2)} 0 ${sn < 0 ? 1 : 0} 0 ${fmt2(b2)} L ${fmt2(a2)} A ${ra.toFixed(2)} ${ra.toFixed(2)} 0 ${sn > 0 ? 1 : 0} 0 ${fmt2(a1)} Z`;
  return <path d={d} fill={col} opacity={op} stroke={stroke ?? col} strokeWidth={stroke ? 0.5 : 0.4} strokeLinejoin="round" />;
};

/**
 * A chubby limb with soft shading: a shade-coloured base, the skin layer a little narrower and shifted
 * toward the light, and a faint highlight along the lit edge, so the limb reads round. ra at a, rm at
 * the middle (the fat bulge), rb at b.
 */
const SoftLimb: React.FC<{ a: V2; b: V2; ra: number; rm: number; rb: number; far?: boolean }> = ({ a, b, ra, rm, rb, far }) => {
  const m = mixV(a, b, 0.45);
  const layer = (k: number, off: number, col: string, op: number) => (
    <g opacity={op}>
      <Taper a={add(a, LD, ra * off)} b={add(m, LD, rm * off)} ra={ra * k} rb={rm * k} col={col} />
      <Taper a={add(m, LD, rm * off)} b={add(b, LD, rb * off)} ra={rm * k} rb={rb * k} col={col} />
    </g>
  );
  return (
    <g>
      {layer(1, 0, SKIN_S, 1)}
      {layer(0.8, 0.18, far ? "#c98e66" : SKIN, 1)}
      {layer(0.36, 0.5, SKIN_L, far ? 0.25 : 0.42)}
    </g>
  );
};

/** A soft fat crease across a limb, at fraction t of a..b, half-width w, bowed by `bow` along the limb. */
const Crease: React.FC<{ a: V2; b: V2; t: number; w: number; bow: number; op?: number; sw?: number }> = ({ a, b, t, w, bow, op = 0.4, sw = 1.1 }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const u: V2 = [dx / l, dy / l];
  const n: V2 = [-u[1], u[0]];
  const c = mixV(a, b, t);
  return <path d={`M ${fmt2(add(c, n, w))} Q ${fmt2(add(c, u, bow))} ${fmt2(add(c, n, -w))}`} stroke={SKIN_D} strokeWidth={sw} fill="none" opacity={op} strokeLinecap="round" />;
};

/**
 * His small hand: the shared Hand (MOT-19, rig/Hand.tsx) in its chubby baby variant, so the thumb always comes
 * from the anatomically correct side (`side` follows the shared rule: +1 = the screen-right arm of this
 * front-facing figure, -1 = the screen-left arm). The rice play maps onto its controls continuously, so the
 * hand never snaps between shapes:
 *   - flat (patting): straight fingers, the back of the hand up toward the viewer (three-quarter back view);
 *   - curl / pinch (picking up grains): the fingers fold in toward the thumb round the grains;
 *   - palm (showing the grains, waving): the wrist turns until the palm faces the viewer;
 *   - land: a small squash along the hand as a pat lands.
 * The hand is drawn in wrist space (fingers along +y) and turned to the finger direction `dir`.
 */
const BABY_HAND_L = 25;
const BabyHand: React.FC<{ w: V2; side: 1 | -1; h: HandSt; lf: number }> = ({ w, side, h, lf }) => {
  const dA = side > 0 ? h.dir : Math.PI - h.dir;
  const deg = (dA * 180) / Math.PI;
  const pinch = clamp(h.pinch);
  const curl = Math.max(h.curl, 0.6 * pinch);
  // a little life in the fingers (life clock), quieter while they hold grains
  const own = 0.7 * noise1(lf * 0.05, side > 0 ? 71 : 73) + 0.3 * noise1(lf * 0.12, side > 0 ? 75 : 77);
  // "relaxed" preset + flex: about -3.8 = flat open fingers, +2.5 = soft resting curl, +10 = folded round grains
  const flex = lerp(-3.8, 2.5, clamp((curl - 0.04) / 0.31)) + 7.5 * pinch - 1.2 * clamp(h.flat) + own * (1 - 0.7 * pinch);
  // wrist turn: three-quarter back view at rest and patting, palm to the viewer when he shows grains or waves
  const turn = lerp(-2.45, -0.2, clamp(h.palm));
  const press = 1 - 0.1 * h.flat - 0.12 * h.land;
  return (
    <g transform={`translate(${w[0].toFixed(2)} ${w[1].toFixed(2)}) rotate(${deg.toFixed(2)}) scale(${(press + 0.16 * h.land).toFixed(3)} ${(1 + 0.1 * h.land).toFixed(3)}) rotate(-90)`}>
      <Hand shape="relaxed" L={BABY_HAND_L} skin={SKIN} shade={SKIN_S} palm={PALM} side={side} flex={flex} baby turn={turn} />
    </g>
  );
};

/**
 * A chubby foot, soles turned toward each other as babies sit: a round heel, a plump instep, a pink sole
 * showing on the inner side, five little toes (the big toe on top) and a fat crease round the ankle.
 */
const BabyFoot: React.FC<{ ankle: V2; side: 1 | -1; d: number; curl: number }> = ({ ankle, side, d, curl }) => {
  const dA = side > 0 ? d : Math.PI - d;
  const u: V2 = [Math.cos(dA), Math.sin(dA)];
  let bn: V2 = [-u[1], u[0]];
  if (bn[1] > 0) bn = [-bn[0], -bn[1]]; // toward the top of the foot: the big toe side
  const deg = (dA * 180) / Math.PI;
  const c = add(ankle, u, 8);
  const toeBase = add(ankle, u, 15.5 - 1.4 * curl);
  const toes = [
    { o: 4.4, r: 3.2, out: 1.8 },
    { o: 1.5, r: 2.5, out: 2.4 },
    { o: -0.9, r: 2.3, out: 2.0 },
    { o: -3.0, r: 2.1, out: 1.3 },
    { o: -4.9, r: 1.8, out: 0.3 },
  ];
  return (
    <g>
      <circle cx={ankle[0] - u[0] * 2} cy={ankle[1] - u[1] * 2} r={6.8} fill={SKIN_S} />
      <ellipse cx={c[0]} cy={c[1]} rx={11.6} ry={7.4} transform={`rotate(${deg} ${c[0]} ${c[1]})`} fill={SKIN_S} />
      <ellipse cx={c[0] + LD[0] * 1.2} cy={c[1] + LD[1] * 1.2} rx={10.4} ry={6.3} transform={`rotate(${deg} ${c[0]} ${c[1]})`} fill={SKIN} />
      {/* the sole, a soft pink, on the side turned toward his middle and the viewer */}
      <ellipse cx={c[0] - bn[0] * 2.6} cy={c[1] - bn[1] * 2.6} rx={8.6} ry={3.2} transform={`rotate(${deg} ${c[0]} ${c[1]})`} fill={SOLE} opacity={0.9} />
      {/* plump top of the foot catching the light */}
      <ellipse cx={c[0] + bn[0] * 2.4 + LD[0]} cy={c[1] + bn[1] * 2.4 + LD[1]} rx={6.4} ry={2.4} transform={`rotate(${deg} ${c[0]} ${c[1]})`} fill={SKIN_L} opacity={0.4} />
      {/* five little toes, the big toe on top */}
      {toes.map((t, i) => {
        const tc = add(add(toeBase, bn, t.o), u, t.out * (1 - 0.5 * curl));
        return <circle key={i} cx={tc[0]} cy={tc[1]} r={t.r} fill={SKIN} stroke={SKIN_S} strokeWidth={0.5} />;
      })}
      {toes.map((t, i) => {
        const tc = add(add(toeBase, bn, t.o), u, t.out * (1 - 0.5 * curl));
        return <circle key={`n${i}`} cx={tc[0] + u[0] * t.r * 0.35 + LD[0] * 0.4} cy={tc[1] + u[1] * t.r * 0.35 + LD[1] * 0.4} r={t.r * 0.4} fill={SKIN_L} opacity={0.45} />;
      })}
    </g>
  );
};

/* ---- his head: drawn the newborn's way (BabyFace in Divine.tsx), so he is the same baby ---- */

/*
 * The shared Head rig gave the sitting baby a different face from the newborn and the crawling Balak (a thin dark
 * cap of hair, small eyes, a flat face). Here the head follows the NEWBORN FACE CONSTRUCTION in Divine.tsx (BabyFace),
 * at about 8 to 10 months, mirrored for this room's key light (the window, screen-right):
 *  - a large round cranium that never changes; only the lower face follows the softened turn
 *    (yv = 0.5 * tanh(yaw / 0.5)); a round, chubby, balanced face, modest smooth cheeks (the far cheek grows by at
 *    most about 0.5), a short soft chin;
 *  - big warm brown eyes, identical frontally (half-width 8.1, iris r 6.3, one round catchlight on the window side);
 *    turned, only the far eye narrows (at most 18 %); calm upper lids rest just on the iris top (oL 0.86..1);
 *  - a small button nose, natural soft lips with a gentle smile (the giggle parts them into a small soft "o");
 *  - no ear frontally; a small soft near-side ear only once the turn shows it, inside the silhouette, no outline;
 *  - one full soft mass of dark baby curls, the curls formed inside it and along its scalloped hairline (nothing
 *    loose outside it); the hairline blends into the skin through a soft shadow (no pale seam, no light stroke);
 *    no line is ever drawn on the cheek.
 * Head units: centre (0, 0), crown y = -44, chin y = 29 (as the newborn), scaled to his figure by SB_S.
 */
const SB_S = 1.1; // head units → figure units (a large round cranium, about a quarter of his sitting height)
const SB_DY = -3;
const SB_HAIR = "#26170F"; // the newborn's hair colours
const SB_HAIR_L = "#5E3D2A";
const SB_KS = 1; // key light on screen-right (the newborn's construction has it on screen-left: mirrored here)
const SB_TURN_MAX = 0.45;

type SP = [number, number];
const s2 = (v: number) => (Math.round(v * 100) / 100).toString();
const sp2 = (q: SP) => `${s2(q[0])} ${s2(q[1])}`;
const sbHash = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return v - Math.floor(v);
};
const sbStep = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};

/** Head outline for the softened turn yv (+ = face to screen-right; far side = +x): the newborn's headPath. */
const sbHeadPath = (yv: number) => {
  const phi = clamp(Math.abs(yv) / SB_TURN_MAX);
  const sg = yv < 0 ? -1 : 1;
  const P = (fx: number, fy: number, tx: number, ty: number) => sp2([lerp(fx, tx, phi) * sg, lerp(fy, ty, phi)]);
  return (
    `M 0 -44 C ${21 * sg} -44 ${35 * sg} -30 ${35.5 * sg} -11 ` +
    `C ${P(36, 0, 36.3, 0)} ${P(37, 9, 37.5, 9.5)} ${P(33, 17, 33.8, 18)} ` +
    `C ${P(28.5, 25, 30.5, 25.6)} ${P(16, 28.5, 22, 29.2)} ${P(6.5, 29, 14.5, 29.3)} ` +
    `C ${P(3, 30, 11, 30.3)} ${P(-3, 30, 4.5, 30.4)} ${P(-6.5, 29, 1, 29.4)} ` +
    `C ${P(-16, 28.5, -11.5, 28.9)} ${P(-28.5, 25, -27, 26.2)} ${P(-33, 17, -32.6, 18.6)} ` +
    `C ${P(-37, 9, -36.4, 8.6)} ${P(-36, 0, -35.9, 0)} ${-35.5 * sg} -11 ` +
    `C ${-35 * sg} -30 ${-21 * sg} -44 0 -44 Z`
  );
};

/* the newborn's hair layout (Divine.tsx HAIR_*), mirrored where it carries the light */
const SB_HAIR_CY = -8;
const SB_HAIR_RX = 37.2;
const SB_HAIR_RY = 38.2;
const SB_HAIR_A0 = Math.PI - 0.17;
const SB_HAIR_A1 = 2 * Math.PI + 0.17;
const SB_HAIR_N = 11;
/** outer silhouette: soft rounded curl clumps just outside the skull (fixed layout) */
const SB_HAIR_OUTER = (() => {
  const at = (a: number, extra: number): SP => [Math.cos(a) * (SB_HAIR_RX + extra), SB_HAIR_CY + Math.sin(a) * (SB_HAIR_RY + extra)];
  let d = `M ${sp2(at(SB_HAIR_A0, 0))}`;
  for (let i = 0; i < SB_HAIR_N; i++) {
    const a = lerp(SB_HAIR_A0, SB_HAIR_A1, (i + 0.5) / SB_HAIR_N);
    const out = 2.1 + sbHash(i * 5.1 + 51) * 1.1;
    d += ` Q ${sp2(at(a, out))} ${sp2(at(lerp(SB_HAIR_A0, SB_HAIR_A1, (i + 1) / SB_HAIR_N), 0.2 * sbHash(i * 2.7 + 52)))}`;
  }
  return { d, left: at(SB_HAIR_A0, 0) };
})();
/** the natural hairline (head-space x before the turn, y), from the right temple across the brow to the left */
const SB_HAIRLINE: SP[] = [
  [34.6, -1.5],
  [31.6, -9],
  [26.4, -15.2],
  [18.8, -19.6],
  [9.6, -21.8],
  [-0.4, -22.4],
  [-10.2, -21.6],
  [-19.4, -19.2],
  [-26.8, -14.8],
  [-31.8, -8.4],
  [-34.6, -1.5],
];
/** rounded curls inside the mass: [x, y, r, start angle] */
const SB_CURLS: Array<[number, number, number, number]> = [
  [-23, -31, 3.7, 0.4],
  [-12.5, -37.5, 3.9, 0.9],
  [0, -40.5, 3.7, 1.5],
  [12, -37.5, 3.8, 2.0],
  [23, -31.5, 3.5, 2.4],
  [-29.5, -21, 3.2, 0.1],
  [-18, -28, 3.3, 0.6],
  [-6, -31.5, 3.1, 1.1],
  [6.5, -31.5, 3.1, 1.7],
  [17.5, -27.5, 3.1, 2.1],
  [28.5, -20, 3.0, 2.6],
  [-33.5, -10, 2.7, -0.3],
  [33, -9.5, 2.6, 2.9],
];
/** soft ringlets at the lower edge of the mass, where it meets the cheeks */
const SB_RINGLETS: Array<[number, number, number]> = [
  [-35.6, -2.2, 3.4],
  [35.4, -2.4, 3.0],
];

/** A calm infant blink every 4 to 5.5 s on the life clock (seeded per figure); the scene's slow blinks add to it. */
const sbBlink = (fr: number, seed: number) => {
  const cl = 7;
  const op = 9;
  let start = 10 + Math.round(sbHash(seed) * 0.5 * 24);
  let d = -1;
  let hold = 0;
  for (let i = 0; i < 2000 && start <= fr; i++) {
    d = fr - start;
    hold = sbHash(seed * 3.3 + i * 1.9 + 0.2) > 0.65 ? 4 : 0;
    start += Math.round((4 + 1.5 * sbHash(seed * 1.7 + i * 3.1 + 0.5)) * 24);
  }
  if (d < 0) return 0;
  if (d < cl) return sbStep(d / cl);
  if (d < cl + hold) return 1;
  if (d < cl + hold + op) return 1 - sbStep((d - cl - hold) / op);
  return 0;
};

const SitHead: React.FC<{ st: HeadState; aura: number; uid: string; seed: number }> = ({ st, aura, uid, seed }) => {
  const fk = `${uid}-${Math.round(st.f * 100)}`; // per-frame clip ids (Chrome caches clip geometry by id in video renders)
  const KS = SB_KS;
  const skin = SKIN;
  const skinLight = SKIN_L;
  const shade = SKIN_S;
  const hair = SB_HAIR;
  const hairLight = SB_HAIR_L;
  const sway = st.sway;

  /* ---- expression, from the head state ---- */
  const sm = clamp(st.smile);
  const co = clamp((st.mouth.open - 0.03) / 0.27); // the giggle: a soft parted "o", never a wide grin
  const ck = clamp(st.cheeks) * 0.6;
  const gy = clamp(st.eyeY, -1, 1);
  // eye smile: the full cheeks push the lower lids up (smile and the joyful squint); closed lids bow into crescents
  const es = clamp((sm - 0.5) / 0.4 + 0.6 * Math.max(0, st.squint - 0.18));
  const cheekLift = sm * 0.8 + es * 1.1 + co * 0.6;
  const close = Math.max(clamp(st.close), sbBlink(Math.floor(st.f), seed));
  // eased opening: a partly lowered lid still reads as open, soft eyes; only blinks bring the lids fully down
  const o = clamp(1 - Math.pow(close, 1.6));
  // calm: upper lids rest just on the iris top; curious: wide and bright
  const bright = clamp(2.4 * st.gasp + 0.3 * Math.max(0, -gy) + 0.6 * Math.max(0, st.brow - 0.1));
  const oL = o * lerp(0.86, 1, bright);
  const browUp = Math.max(0, st.brow - 0.12) * 3;

  // softened turn: the face never turns so far that the far eye crowds the silhouette
  const yv = 0.5 * Math.tanh(st.yaw / 0.5);
  const phi = clamp(Math.abs(yv) / SB_TURN_MAX);
  const hp = sbHeadPath(yv);
  const proj = (x0: number, r: number) => {
    const a = Math.asin(clamp(x0 / r, -1, 1));
    return { x: r * Math.sin(a + yv), k: Math.max(0.2, Math.cos(a + yv)) / Math.max(0.2, Math.cos(a)) };
  };
  const ink = "#3A2117";
  const lipUp = "#D4937A";
  const lipLo = "#DEA085";

  /* ---- eyes: big, warm brown eyes of equal size, one soft catchlight each (the newborn's eyes) ---- */
  const W = 8.1;
  const HU = 7.2;
  const eye = (side: 1 | -1) => {
    const pj = proj(side * 13.4, 31);
    const kE = side * yv > 0 ? 1 - 0.18 * phi : 1;
    const hl = 5.6 * (1 - sm * 0.2 - es * 0.22 * o);
    const arch = es * clamp((1 - o) * 1.4);
    const Ly = lerp(hl * 1.33, -HU * 1.33, oL) - arch * (hl * 1.33 + 3);
    const lowY = lerp(hl * 1.33, Ly + 0.15, arch);
    const P0: SP = [-W, 0.5];
    const P3: SP = [W, 0];
    const K1: SP = [-W * 0.55, Ly];
    const K2: SP = [W * 0.6, Ly];
    const shape = `M ${sp2(P0)} C ${sp2([-W * 0.55, -HU * 1.33])} ${sp2([W * 0.6, -HU * 1.33])} ${sp2(P3)} C ${sp2([W * 0.6, lowY])} ${sp2([-W * 0.6, lowY])} ${sp2(P0)} Z`;
    const shut = clamp((1 - o) * 1.6 - 0.3);
    const lid = `M ${sp2(P0)} C ${sp2(K1)} ${sp2(K2)} ${sp2(P3)}`;
    const lidSkin = `M ${-W - 2} 0.5 L ${-W - 2} ${-HU * 2} L ${W + 2} ${-HU * 2} L ${W + 2} 0 L ${sp2(P3)} C ${sp2(K2)} ${sp2(K1)} ${sp2(P0)} Z`;
    // local x is mirrored for the screen-left eye; the catchlight stays on the window side (screen-right)
    const ix = clamp(st.eyeX, -1, 1) * 2.6 * side;
    const iy = -0.4 + gy * 1.7;
    const IR = 6.3;
    const cid = `${fk}-e${side > 0 ? "r" : "l"}`;
    const bd = `M -5 ${s2(-13.6 - sm * 0.6 - co * 0.7 - browUp)} Q -0.4 ${s2(-15.6 - sm * 0.6 - co * 0.9 - browUp * 1.2)} 5.4 ${s2(-14.2 - sm * 0.4 - co * 0.6 - browUp * 0.9)}`;
    return (
      <g transform={`translate(${s2(pj.x)}, -0.6) scale(${s2(side * kE)}, 1)`}>
        <defs>
          <clipPath id={cid}>
            <path d={shape} />
          </clipPath>
        </defs>
        {/* very soft, short baby brow */}
        <path d={bd} stroke={hair} strokeWidth={2.8} strokeLinecap="round" fill="none" opacity={0.06} />
        <path d={bd} stroke={hair} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.1} />
        {/* gentle lid fold and the soft fullness under the eye */}
        <path d={`M ${s2(-W * 0.6)} ${s2(-HU * 1.05 - 1.6)} Q 0 ${s2(-HU * 1.36 - 1.6)} ${s2(W * 0.9)} ${s2(-HU * 0.65 - 1.3)}`} stroke={shade} strokeWidth={0.7} fill="none" opacity={0.12 + 0.14 * oL} />
        <path d={`M ${s2(-W * 0.6)} ${s2(Math.max(hl, lowY * 0.75) + 1.6)} Q 0 ${s2(Math.max(hl, lowY * 0.75) + 2.7 - es * 1.6)} ${s2(W * 0.7)} ${s2(Math.max(hl, lowY * 0.75) + 1.3 - es * 0.6)}`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.1 + 0.12 * es} />
        <g clipPath={`url(#${cid})`}>
          <path d={shape} fill={`url(#${uid}-scl)`} />
          <circle cx={ix} cy={iy} r={IR} fill={`url(#${uid}-iris)`} />
          <circle cx={ix} cy={iy} r={IR - 0.35} fill="none" stroke="#2A150B" strokeWidth={0.8} opacity={0.6} />
          <ellipse cx={ix} cy={s2(iy + IR * 0.42)} rx={IR * 0.62} ry={IR * 0.3} fill="#C38A57" opacity={0.28} />
          <circle cx={ix} cy={iy} r={2.7} fill="#160B06" />
          <path d={lid} transform="translate(0, 1.1)" stroke="#2A1810" strokeWidth={2.2} fill="none" opacity={0.15} />
          {/* one soft round catchlight on the window side, never a star or sparkle */}
          <circle cx={s2(ix + 2.2 * side * KS)} cy={s2(iy - 2.3)} r={3.1} fill="#FFFFFF" opacity={0.14} />
          <circle cx={s2(ix + 2.2 * side * KS)} cy={s2(iy - 2.3)} r={1.75} fill="#FFFFFF" opacity={0.95} />
          <path d={lidSkin} fill={skin} />
        </g>
        {shut > 0.02 && <ellipse cx={-0.4} cy={s2(Ly * 0.45 - 1.6)} rx={W * 0.72} ry={2.8} fill={skinLight} opacity={0.3 * shut} />}
        <path d={lid} stroke={ink} strokeWidth={lerp(0.9, 1.25, oL)} strokeLinecap="round" fill="none" opacity={0.85} />
        <path d={`M ${sp2(P3)} q 0.7 ${s2(-0.3 + (1 - oL) * 0.6)} 1.2 ${s2(-0.5 + (1 - oL) * 0.9)}`} stroke={ink} strokeWidth={0.6} strokeLinecap="round" fill="none" opacity={0.4} />
        <path d={`M ${s2(-W * 0.55)} ${s2(lowY * 0.72 + 0.6)} Q 0 ${s2(lowY + 0.2)} ${s2(W * 0.7)} ${s2(lowY * 0.6 + 0.3)}`} stroke={shade} strokeWidth={0.55} fill="none" opacity={0.3 * o} />
      </g>
    );
  };

  /* ---- ear: only on the near side, only once the turn shows it; inside the silhouette, never outlined ---- */
  const earVis = sbStep((phi - 0.3) / 0.45);
  const earSide = yv > 0 ? -1 : 1;
  const earRx = 2.2 + 1.0 * earVis;
  const earX = earSide * (35.9 - earRx * 0.85);
  const ear =
    earVis > 0.02 ? (
      <g transform={`translate(${s2(earX)}, 4.2)`} opacity={s2(earVis)}>
        <ellipse cx={s2(-earSide * earRx * 0.9)} cy={0.4} rx={1.8} ry={4.6} fill={`url(#${uid}-sh)`} opacity={0.3} />
        <ellipse cx={0} cy={0} rx={s2(earRx)} ry={4.9} fill={skin} />
        <ellipse cx={s2(earSide * earRx * 0.25)} cy={-0.6} rx={s2(earRx * 0.7)} ry={3.9} fill={skinLight} opacity={0.35} />
        <ellipse cx={s2(-earSide * earRx * 0.12)} cy={0.5} rx={s2(earRx * 0.42)} ry={2.4} fill={`url(#${uid}-ear)`} opacity={0.55} />
      </g>
    ) : null;

  /* ---- hair: one full soft dark mass with a scalloped natural hairline; curls inside and along its edge ---- */
  const hl0 = SB_HAIRLINE.map(([x0, y0]): SP => [proj(x0, 35).x, y0]);
  const toFace = (m: SP, amp: number): SP => {
    const vx = 0 - m[0];
    const vy = 6 - m[1];
    const L = Math.hypot(vx, vy) || 1;
    return [m[0] + (vx / L) * amp, m[1] + (vy / L) * amp];
  };
  const locks = hl0.slice(0, -1).map((p, i) => {
    const q = hl0[i + 1];
    const m: SP = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const amp = 2.5 + sbHash(i * 3.9 + 60) * 0.9 + Math.abs(sway) * 0.05;
    return { q, c: toFace(m, amp) };
  });
  const hairMass = `${SB_HAIR_OUTER.d} L ${sp2(hl0[0])} ` + locks.map((k) => `Q ${sp2(k.c)} ${sp2(k.q)}`).join(" ") + ` L ${sp2(SB_HAIR_OUTER.left)} Z`;
  const curlArc = (cx: number, cy: number, r: number, a0: number, span = 3.0) => {
    const a1 = a0 + span;
    const p0: SP = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r];
    const p1: SP = [cx + Math.cos(a1) * r * 0.86, cy + Math.sin(a1) * r * 0.86];
    return `M ${sp2(p0)} A ${s2(r)} ${s2(r * 0.92)} 0 ${span > Math.PI ? 1 : 0} 1 ${sp2(p1)}`;
  };
  const inner = SB_CURLS.map(([x0, y0, r, a0]) => {
    const pj = proj(x0, 37);
    return { d: curlArc(pj.x, y0, r * Math.max(0.6, Math.min(1, pj.k)), a0 + sway * 0.02), lit: pj.x * KS > -6 };
  });
  const ringX = (x0: number) => (x0 > 30 || x0 < -30 ? x0 : proj(x0, 37).x);

  /* ---- nose & mouth ---- */
  const nj = proj(0, 37);
  const nx = nj.x;
  const mj = proj(0, 33);
  const gap = co * 2.6;
  const mw = (3.6 + sm * 1.5) * (1 - co * 0.1) * mj.k;
  const lift = sm * 1.5 + co * 0.3;
  const mid = 0.5 + sm * 0.5;
  const upperLip = `M ${s2(-mw)} ${s2(-lift)} Q ${s2(-mw * 0.55)} -1.5 -0.9 -1.9 Q 0 -1.25 0.9 -1.9 Q ${s2(mw * 0.55)} -1.5 ${s2(mw)} ${s2(-lift)} Q 0 ${s2(mid)} ${s2(-mw)} ${s2(-lift)} Z`;
  const lowerLip = `M ${s2(-mw)} ${s2(-lift + gap)} Q 0 ${s2(mid + gap)} ${s2(mw)} ${s2(-lift + gap)} Q ${s2(mw * 0.6)} ${s2(3.3 + gap)} 0 ${s2(3.4 + gap)} Q ${s2(-mw * 0.6)} ${s2(3.3 + gap)} ${s2(-mw)} ${s2(-lift + gap)} Z`;

  return (
    <g transform={`translate(0, ${SB_DY}) scale(${SB_S})`}>
      <defs>
        <radialGradient id={`${uid}-skin`} cx={0.5 + 0.08 * KS} cy="0.38" r="0.7">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="36%" stopColor={skin} />
          <stop offset="84%" stopColor={skin} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
        <radialGradient id={`${uid}-iris`} cx="0.5" cy="0.66" r="0.6">
          <stop offset="0%" stopColor="#C2884F" />
          <stop offset="38%" stopColor="#965B31" />
          <stop offset="72%" stopColor="#5E3219" />
          <stop offset="100%" stopColor="#3A1D0E" />
        </radialGradient>
        <linearGradient id={`${uid}-scl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAD3C3" />
          <stop offset="38%" stopColor="#FFFBF6" />
          <stop offset="100%" stopColor="#F7EBE2" />
        </linearGradient>
        {/* hair: dark brown-black, a touch warmer on the lit crown */}
        <radialGradient id={`${uid}-hm`} gradientUnits="userSpaceOnUse" cx={12 * KS} cy="-38" r="48">
          <stop offset="0%" stopColor="#4A2F20" />
          <stop offset="45%" stopColor={hair} />
          <stop offset="100%" stopColor="#170D08" />
        </radialGradient>
        {/* warm golden rim light on the window-side edge of the skin and hair (soft, no hard line) */}
        <radialGradient id={`${uid}-rim`} gradientUnits="userSpaceOnUse" cx={-10 * KS} cy="-6" r="50">
          <stop offset="0%" stopColor={RIM} stopOpacity={0} />
          <stop offset="78%" stopColor={RIM} stopOpacity={0} />
          <stop offset="100%" stopColor="#fff1c4" stopOpacity={0.55} />
        </radialGradient>
        <clipPath id={`${fk}-hmc`}>
          <path d={hairMass} />
        </clipPath>
        <radialGradient id={`${uid}-blush`}>
          <stop offset="0%" stopColor="#F08A80" stopOpacity={0.6} />
          <stop offset="60%" stopColor="#F4A196" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#F4A196" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-hi`}>
          <stop offset="0%" stopColor="#FFF4E8" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#FFF4E8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-sh`}>
          <stop offset="0%" stopColor={shade} stopOpacity={0.6} />
          <stop offset="100%" stopColor={shade} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-mo`}>
          <stop offset="0%" stopColor="#4A1D1C" />
          <stop offset="100%" stopColor="#7A3934" />
        </radialGradient>
        <radialGradient id={`${uid}-ear`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={shade} />
          <stop offset="55%" stopColor={skin} />
          <stop offset="100%" stopColor={skin} />
        </radialGradient>
        <clipPath id={`${fk}-hc`}>
          <path d={hp} />
        </clipPath>
      </defs>

      {/* soft shadow under the chin, on the neck */}
      <ellipse cx={s2(mj.x * 0.6)} cy={30} rx={18} ry={6} fill={`url(#${uid}-sh)`} opacity={0.75} />
      <path d={hp} fill={`url(#${uid}-skin)`} />

      <g clipPath={`url(#${fk}-hc)`}>
        {/* soft forehead highlight (low, near the brows: no pale band along the hairline), fall-off on the shadow
            side, a soft band under the chin */}
        <ellipse cx={s2(proj(5 * KS, 34).x)} cy={-10.5} rx={12} ry={5.5} fill={`url(#${uid}-hi)`} opacity={0.28} />
        <ellipse cx={-34 * KS} cy={4} rx={14} ry={30} fill={`url(#${uid}-sh)`} opacity={0.38} />
        <ellipse cx={s2(mj.x * 0.7)} cy={31} rx={22} ry={7} fill={`url(#${uid}-sh)`} opacity={0.55} />
        {/* full, smooth cheeks: a soft apple highlight and a warm blush (no line on the cheek) */}
        {([-1, 1] as const).map((sd) => {
          const cj = proj(sd * 18, 33);
          return (
            <g key={sd}>
              <ellipse cx={s2(cj.x - sd * 0.5)} cy={s2(8 - cheekLift)} rx={s2((6.5 + es * 0.8) * cj.k)} ry={s2(4.2 + es * 0.5)} fill={`url(#${uid}-hi)`} opacity={sd * KS > 0 ? 0.32 : 0.18} />
              <ellipse cx={s2(cj.x)} cy={s2(11 - cheekLift)} rx={s2(9 * cj.k)} ry={6.4} fill={`url(#${uid}-blush)`} opacity={clamp(0.35 + ck * 0.75 + sm * 0.15 + co * 0.15)} />
            </g>
          );
        })}
        {/* warm golden rim light on the window-side edge of the face */}
        <path d={hp} fill={`url(#${uid}-rim)`} opacity={0.75 * clamp(aura)} />
        {/* the hairline blends into the skin: a soft, graded shadow under the hair edge (no light stroke) */}
        <path d={hairMass} fill="none" stroke={shade} strokeWidth={3.4} strokeLinejoin="round" opacity={0.1} />
        <path d={hairMass} transform="translate(-0.25, 1.6)" fill={shade} opacity={0.08} />
        <path d={hairMass} transform="translate(-0.15, 0.8)" fill={shade} opacity={0.12} />
      </g>
      {ear}

      {/* full soft mass of dark baby curls, formed inside it and along its edge */}
      <g>
        {SB_RINGLETS.map(([x0, y0, r], i) => (
          <circle key={`rg${i}`} cx={s2(ringX(x0))} cy={y0} r={r} fill={hair} />
        ))}
        <path d={hairMass} fill={`url(#${uid}-hm)`} />
        <g clipPath={`url(#${fk}-hmc)`}>
          {/* broad soft sheen on the lit crown */}
          <ellipse cx={s2(proj(14 * KS, 37).x)} cy={-35} rx={13} ry={4.2} fill={hairLight} opacity={0.32} transform={`rotate(${30 * KS}, ${s2(proj(14 * KS, 37).x)}, -35)`} />
          {inner.map(({ d }, i) => (
            <path key={`cs${i}`} d={d} transform="translate(0.6, 0.7)" stroke="#120A06" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.32} />
          ))}
          {inner.map(({ d, lit }, i) => (
            <path key={`ch${i}`} d={d} stroke={hairLight} strokeWidth={1.0} strokeLinecap="round" fill="none" opacity={lit ? 0.42 : 0.24} />
          ))}
          <path d={hairMass} fill={`url(#${uid}-rim)`} opacity={0.6 * clamp(aura)} />
        </g>
        {SB_RINGLETS.map(([x0, y0, r], i) => {
          const cx = ringX(x0);
          return <path key={`rh${i}`} d={curlArc(cx, y0, r * 0.62, 3.4)} stroke={hairLight} strokeWidth={0.8} strokeLinecap="round" fill="none" opacity={cx * KS > -6 ? 0.5 : 0.3} />;
        })}
      </g>

      {eye(-1)}
      {eye(1)}

      {/* small button nose: soft roundness, a soft shadow beneath, a gentle highlight */}
      <ellipse cx={s2(nx - 2.2 * KS)} cy={8.4} rx={2.6} ry={2.8} fill={`url(#${uid}-sh)`} opacity={0.4} />
      <ellipse cx={s2(nx)} cy={10.7} rx={s2(3.8 * nj.k)} ry={1.4} fill={`url(#${uid}-sh)`} opacity={0.75} />
      <ellipse cx={s2(nx)} cy={8.2} rx={s2(3 * nj.k)} ry={2.4} fill={skinLight} opacity={0.3} />
      <ellipse cx={s2(nx - 1.7 * nj.k)} cy={10.1} rx={0.75} ry={0.5} fill="#A8684C" opacity={0.5} />
      <ellipse cx={s2(nx + 1.7 * nj.k)} cy={10.1} rx={0.75} ry={0.5} fill="#A8684C" opacity={0.5} />
      <circle cx={s2(nx + 0.9 * KS)} cy={7.4} r={1} fill="#FFFFFF" opacity={0.3} />
      <path d={`M ${s2(nx - 0.9)} 11.8 Q ${s2(mj.x - 0.7)} 13.6 ${s2(mj.x - 0.9)} 15.2 M ${s2(nx + 0.9)} 11.8 Q ${s2(mj.x + 0.7)} 13.6 ${s2(mj.x + 0.9)} 15.2`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.14} />

      {/* natural soft lips with a gentle smile; the giggle parts them into a small soft "o" */}
      <g transform={`translate(${s2(mj.x)}, 17.2)`}>
        <ellipse cx={0} cy={s2(4.7 + gap)} rx={3.4} ry={1.2} fill={`url(#${uid}-sh)`} opacity={0.45} />
        {co > 0.02 && (
          <g opacity={clamp(co * 4)}>
            <ellipse cx={0} cy={s2(mid * 0.5 + gap * 0.5)} rx={s2(mw * 0.82)} ry={s2(gap * 0.6 + 0.2)} fill={`url(#${uid}-mo)`} />
            <ellipse cx={0} cy={s2(mid * 0.5 + gap * 0.85)} rx={s2(mw * 0.5)} ry={s2(gap * 0.22)} fill="#C46A68" opacity={0.6} />
          </g>
        )}
        <path d={lowerLip} fill={lipLo} opacity={0.8} />
        <path d={upperLip} fill={lipUp} opacity={0.75} />
        <path d={`M ${s2(-mw)} ${s2(-lift)} Q 0 ${s2(mid)} ${s2(mw)} ${s2(-lift)}`} stroke="#A15C48" strokeWidth={0.85} strokeLinecap="round" fill="none" opacity={0.72} />
        <ellipse cx={0.4 * KS} cy={s2(1.9 + gap)} rx={s2(1.4 * mj.k)} ry={0.5} fill={skinLight} opacity={0.3} />
        {sm > 0.05 &&
          ([-1, 1] as const).map((sd) => (
            <path key={sd} d={`M ${s2(sd * (mw + 0.2))} ${s2(-lift - 0.6)} Q ${s2(sd * (mw + 0.9))} ${s2(-lift + 0.1)} ${s2(sd * (mw + 0.4))} ${s2(-lift + 0.8)}`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.35 * sm} />
          ))}
      </g>
    </g>
  );
};

/* ---- the figure ---- */

const SittingBaby: React.FC<{
  pose: (f: number, e?: number) => BabyPose;
  /** Story-side frame of his choreography (authored frames). */
  f: number;
  /** Life clock (real local frames): breathing, eye life, finger life, a blink; runs on through the pauses. */
  lf: number;
  /** Real frames into the relief pause P3 (-1 outside it): the pose's pause overlay. */
  e?: number;
  /** Pat contacts inside P3 (in e frames): a few grains hop where the pat lands. */
  ePats?: number[];
  /** Extra eyelid close 0..1 (a slow blink on the life clock). */
  blink?: number;
  /** Breathing period in real frames. */
  breathPeriod?: number;
  x: number;
  y: number;
  s: number;
  level: number;
  uid: string;
  pats: Array<{ at: number; side: 1 | -1 }>;
  drops: Array<{ at: number; side: 1 | -1; trickle?: boolean }>;
  /** Little mounds of spilled rice beside his knees (on the floor). */
  mounds?: boolean;
}> = ({ pose, f, lf, e = -1, ePats = [], blink = 0, breathPeriod = 40, x, y, s, level, uid, pats, drops, mounds }) => {
  // breathing runs on the life clock, so it goes on while the story holds in a pause
  const p: BabyPose = { ...pose(f, e), breath: Math.sin((lf * TAU) / breathPeriod) };
  const g = solveBaby(p);
  const { body, hipsAt } = g;
  const [shL, shR] = g.sh;
  // trunk outline: a short round trunk, a full belly, soft round shoulders and a short neck base
  const trunk = smoothPath(
    (
      [
        [0, -6],
        [-30, -9],
        [-38, -22],
        [-37.5, -38],
        [-33.5, -55],
        [-29.5, -68],
        [-31, -76],
        [-21, -82.5],
        [-10, -86],
        [10, -86],
        [21, -82.5],
        [31, -76],
        [29.5, -68],
        [33.5, -55],
        [37.5, -38],
        [38, -22],
        [30, -9],
      ] as V2[]
    ).map(body),
    1,
  );
  const tc = body([12, -52]);
  const belly = body([5, -40]);
  const navel = body([1.5, -40]);
  // cloth round the waist: the band moves with the trunk, the lower edge with the hips four frames late
  const lagX = p.wigLag - p.wig;
  const lagY = -0.7 * (p.bobLag - p.bob);
  const low = (q: V2, k = 1): V2 => [hipsAt(q)[0] + lagX * k, hipsAt(q)[1] + lagY * k];
  const clothPts: V2[] = [body([-37.5, -31]), low([-41, -17], 0.6), low([-32, -5]), low([-16, 2]), low([0, 5.5]), low([16, 2]), low([32, -5]), low([41, -17], 0.6), body([37.5, -31]), body([0, -33.5])];
  const knot = body([29, -30]);
  const tailEnd: V2 = [knot[0] + 6 + 2.2 * lagX, knot[1] + 19 + 1.5 * lagY];
  const band = smoothPath([body([-37.5, -31]), body([-18, -33.4]), body([0, -33.6]), body([18, -33.4]), body([37.5, -31])], 1, false);
  const foldA = smoothPath([knot, mixV(knot, clothPts[4], 0.5), clothPts[4]], 1, false);
  const foldB = smoothPath([knot, add(mixV(knot, clothPts[6], 0.55), [0, 2]), clothPts[6]], 1, false);
  const foldC = smoothPath([body([-30, -29]), low([-26, -15], 0.5), clothPts[2]], 1, false);
  const foldD = smoothPath([low([0, -14], 0.4), low([-3, -4], 0.8), clothPts[4]], 1, false);
  const shine = smoothPath([body([-30, -28]), body([-12, -30.5]), body([8, -30.5])], 1, false);
  // belly over the band
  const overhang = `M ${fmt2(body([-29, -35]))} Q ${fmt2(body([0, -26.5]))} ${fmt2(body([29, -35]))} Q ${fmt2(body([0, -40]))} ${fmt2(body([-29, -35]))} Z`;
  const overhangLine = `M ${fmt2(body([-26, -33.5]))} Q ${fmt2(body([0, -26]))} ${fmt2(body([26, -33.5]))}`;
  // golden rim light on the shoulders (BAL-08), brighter on the key side
  const rimL = smoothPath([body([-36, -64]), body([-31.5, -76]), body([-21, -82.8]), body([-10, -86.4])], 1, false);
  const rimR = smoothPath([body([10, -86.4]), body([21, -82.8]), body([31.5, -76]), body([36, -64])], 1, false);
  const neckA = body([0, -82]);
  const neckB: V2 = [g.head[0], g.head[1] + 24];
  // which hand, at a given frame, is where: for grains dropped and pats
  const fingertip = (fr: number, side: 1 | -1, ee = -1): V2 => {
    const pp = pose(fr, ee);
    const gg = solveBaby(pp);
    const h = side > 0 ? pp.r : pp.l;
    const dA = side > 0 ? h.dir : Math.PI - h.dir;
    return add(gg.wr[side > 0 ? 1 : 0], [Math.cos(dA), Math.sin(dA)], 11);
  };
  const handOf = (side: 1 | -1) => (side > 0 ? p.r : p.l);
  const headState: HeadState = {
    yaw: p.face.yaw,
    eyeX: p.face.eyeX,
    eyeY: p.face.eyeY,
    close: Math.max(p.face.close, blink),
    squint: p.face.squint,
    brow: p.face.brow,
    browTilt: 0.1,
    mouth: p.face.open > 0.01 ? { open: p.face.open, width: 1.05, round: 0.15, teeth: 0 } : MOUTH_REST,
    smile: p.face.smile,
    gasp: p.face.gasp,
    cheeks: p.face.cheeks,
    flush: 0.15,
    tears: 0,
    sway: 4 * p.bob + 3 * p.sway,
    f: lf, // eye life on the life clock
  };
  const limbs = (side: 1 | -1) => {
    const i = side > 0 ? 1 : 0;
    return { hip: g.hip[i], knee: g.knee[i], ankle: g.ankle[i], kick: p.kick[i] };
  };
  const leg = (side: 1 | -1) => {
    const { hip, knee, ankle } = limbs(side);
    return (
      <g key={`leg${side}`}>
        <SoftLimb a={hip} b={knee} ra={15} rm={16} rb={11.5} />
        {/* fat roll across the thigh and the fold inside the knee */}
        <Crease a={hip} b={knee} t={0.52} w={12} bow={-3} op={0.3} />
        <Crease a={hip} b={knee} t={0.86} w={8.5} bow={3} op={0.42} sw={1.3} />
      </g>
    );
  };
  const shin = (side: 1 | -1) => {
    const { knee, ankle, kick } = limbs(side);
    return (
      <g key={`shin${side}`}>
        <SoftLimb a={knee} b={ankle} ra={11.5} rm={11} rb={7.2} />
        <Crease a={knee} b={ankle} t={0.16} w={8} bow={-2.4} op={0.38} />
        {/* the ankle: a fat little bracelet of a crease */}
        <Crease a={knee} b={ankle} t={0.86} w={6.4} bow={2} op={0.45} sw={1.2} />
        <BabyFoot ankle={ankle} side={side} d={0.55 - 0.4 * kick} curl={p.toeCurl} />
      </g>
    );
  };
  const arm = (side: 1 | -1) => {
    const i = side > 0 ? 1 : 0;
    const S = g.sh[i];
    const E = g.el[i];
    const Wr = g.wr[i];
    const h = handOf(side);
    // rim light along the outer edge of the upper arm
    const dx = E[0] - S[0];
    const dy = E[1] - S[1];
    const l = Math.hypot(dx, dy) || 1;
    let n: V2 = [-dy / l, dx / l];
    if (n[0] * side < 0) n = [-n[0], -n[1]];
    return (
      <g key={`arm${side}`}>
        <SoftLimb a={S} b={E} ra={11.5} rm={12} rb={8.6} />
        <SoftLimb a={E} b={Wr} ra={8.6} rm={9} rb={6} />
        {/* a fat roll on the upper arm, the crease inside the elbow and its dimple */}
        <Crease a={S} b={E} t={0.4} w={9} bow={-2} op={0.18} />
        <Crease a={S} b={E} t={0.93} w={6} bow={2} op={0.32} />
        <circle cx={E[0] + n[0] * 3} cy={E[1] + n[1] * 3} r={1.05} fill={SKIN_D} opacity={0.38} />
        {/* wrist: two soft fat creases */}
        <Crease a={E} b={Wr} t={0.82} w={6.3} bow={1.6} op={0.5} sw={1.2} />
        <Crease a={E} b={Wr} t={0.64} w={7.4} bow={1.4} op={0.22} />
        <path
          d={`M ${fmt2(add(S, n, 11))} L ${fmt2(add(E, n, 8.2))}`}
          stroke={RIM}
          strokeWidth={2.2}
          opacity={(side > 0 ? 0.45 : 0.25) * (0.6 + 0.4 * level)}
          strokeLinecap="round"
          filter={`url(#${uid}-blur)`}
        />
        <BabyHand w={Wr} side={side} h={h} lf={lf} />
        {/* grains held in the pinch */}
        {h.pinch > 0.6 &&
          (() => {
            const tip = fingertip(f, side);
            return [0, 1, 2].map((k) => (
              <ellipse key={k} cx={tip[0] + (k - 1) * 2.2} cy={tip[1] + 0.8 * (k % 2)} rx={1.9} ry={1.2} fill="#fffaf0" transform={`rotate(${30 * k} ${tip[0] + (k - 1) * 2.2} ${tip[1]})`} />
            ));
          })()}
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${uid}-trunk`} gradientUnits="userSpaceOnUse" cx={tc[0]} cy={tc[1]} r={64}>
          <stop offset="0%" stopColor={SKIN_L} />
          <stop offset="42%" stopColor={SKIN} />
          <stop offset="100%" stopColor={SKIN_S} />
        </radialGradient>
        <radialGradient id={`${uid}-contact`}>
          <stop offset="0%" stopColor="#2a160a" stopOpacity={0.55} />
          <stop offset="60%" stopColor="#2a160a" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#2a160a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}-under`}>
          <stop offset="0%" stopColor="#ffd9a0" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#ffd9a0" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}-cloth`} gradientUnits="userSpaceOnUse" x1={0} y1={-34} x2={0} y2={6}>
          <stop offset="0%" stopColor={CLOTH} />
          <stop offset="50%" stopColor={CLOTH} />
          <stop offset="100%" stopColor="#d6c9ac" />
        </linearGradient>
        <filter id={`${uid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={1.4} />
        </filter>
        <filter id={`${uid}-soft`} x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation={2.6} />
        </filter>
      </defs>

      {/* faint warm glow on the ground under him (BAL-09), and a soft shadow where he sits */}
      <ellipse cx={0} cy={1} rx={96} ry={11} fill={`url(#${uid}-under)`} opacity={0.35 + 0.25 * level} />
      <ellipse cx={p.wig * 0.5} cy={1} rx={64} ry={8.5} fill={`url(#${uid}-contact)`} />
      {[-1, 1].map((sd) => {
        const a = g.ankle[sd > 0 ? 1 : 0];
        return <ellipse key={sd} cx={a[0] + sd * 9} cy={Math.min(a[1] + 9, 6)} rx={14} ry={2.6} fill={`url(#${uid}-contact)`} opacity={0.8} />;
      })}

      {/* the trunk: a round belly, soft shoulders, shaded toward the side away from the light */}
      <path d={trunk} fill={`url(#${uid}-trunk)`} />
      <ellipse cx={belly[0]} cy={belly[1]} rx={22 * (1 + 0.03 * p.breath)} ry={17 * (1 + 0.03 * p.breath)} fill={SKIN_L} opacity={0.3} filter={`url(#${uid}-soft)`} />
      {/* soft shading under the arms and a faint fold under the chest as he leans */}
      <ellipse cx={shL[0] + 5} cy={shL[1] + 16} rx={6} ry={10} fill={SKIN_S} opacity={0.35} filter={`url(#${uid}-soft)`} />
      <ellipse cx={shR[0] - 5} cy={shR[1] + 16} rx={6} ry={10} fill={SKIN_S} opacity={0.25} filter={`url(#${uid}-soft)`} />
      <path d={`M ${fmt2(body([-18, -55]))} Q ${fmt2(body([0, -51]))} ${fmt2(body([18, -55]))}`} stroke={SKIN_D} strokeWidth={1} fill="none" opacity={0.08 + 0.015 * Math.max(0, p.lean)} />
      <path d={`M ${fmt2([navel[0] - 2.6, navel[1]])} q 2.6 2.2 5.2 0`} stroke={SKIN_D} strokeWidth={1.1} fill="none" opacity={0.4} />

      {/* thighs out to the sides, knees bent */}
      {leg(-1)}
      {leg(1)}

      {/* soft cotton cloth round the waist: band, knot, hanging end and folds that trail the hips */}
      <ellipse cx={low([0, 2])[0]} cy={low([0, 2])[1] + 4} rx={30} ry={4} fill="#2a160a" opacity={0.16} filter={`url(#${uid}-soft)`} />
      <path d={smoothPath(clothPts, 1)} fill={`url(#${uid}-cloth)`} stroke="#cbbd9c" strokeWidth={0.8} />
      <path d={foldA} stroke={CLOTH_S} strokeWidth={1.3} fill="none" opacity={0.75} />
      <path d={foldB} stroke={CLOTH_S} strokeWidth={1.2} fill="none" opacity={0.7} />
      <path d={foldC} stroke={CLOTH_S} strokeWidth={1.1} fill="none" opacity={0.6} />
      <path d={foldD} stroke={CLOTH_S} strokeWidth={1} fill="none" opacity={0.5} />
      <path d={shine} stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.6} strokeLinecap="round" />
      <path d={band} stroke={CLOTH_S} strokeWidth={3} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d={band} stroke="#ffffff" strokeWidth={1.1} fill="none" opacity={0.7} strokeLinecap="round" transform="translate(0 -1)" />
      <Taper a={knot} b={tailEnd} ra={3.3} rb={2.5} col={CLOTH} stroke={CLOTH_S} />
      <ellipse cx={knot[0]} cy={knot[1]} rx={4.6} ry={3.6} fill={CLOTH} stroke={CLOTH_S} strokeWidth={0.9} />
      {/* the round belly sits over the band */}
      <path d={overhang} fill={`url(#${uid}-trunk)`} />
      <path d={overhangLine} stroke={SKIN_S} strokeWidth={1.4} fill="none" opacity={0.35} filter={`url(#${uid}-blur)`} />

      {/* shins come forward to the feet, soles turned toward each other */}
      {shin(-1)}
      {shin(1)}

      {/* little mounds of spilled rice against his knees (on the floor only) */}
      {mounds &&
        [-1, 1].map((sd) => (
          <g key={`m${sd}`}>
            <ellipse cx={sd * 46} cy={-9} rx={17} ry={6.5} fill="#e9d6ae" />
            <ellipse cx={sd * 44} cy={-11} rx={11} ry={3.5} fill="#f8eed8" opacity={0.9} />
            {Array.from({ length: 7 }, (_, k) => {
              const gx = sd * 46 + (hashN(k * 3.7 + sd) - 0.5) * 30;
              const gy = -9 + (hashN(k * 5.3 + sd) - 0.5) * 9;
              return <ellipse key={k} cx={gx} cy={gy} rx={2} ry={1.25} fill="#fffaf0" transform={`rotate(${hashN(k * 2.1 + sd) * 180} ${gx} ${gy})`} />;
            })}
          </g>
        ))}

      {/* arms and hands */}
      {arm(-1)}
      {arm(1)}

      {/* a short chubby neck with a fat crease under the chin */}
      <Taper a={neckA} b={neckB} ra={12.5} rb={12} col={SKIN} />
      <ellipse cx={neckB[0]} cy={neckB[1] + 5} rx={15} ry={5.5} fill={SKIN_S} opacity={0.45} filter={`url(#${uid}-blur)`} />

      {/* golden rim light along the shoulders */}
      <path d={rimL} stroke={RIM} strokeWidth={4} fill="none" opacity={0.3 + 0.15 * level} strokeLinecap="round" filter={`url(#${uid}-blur)`} />
      <path d={rimR} stroke={RIM} strokeWidth={4.5} fill="none" opacity={0.45 + 0.2 * level} strokeLinecap="round" filter={`url(#${uid}-blur)`} />
      <path d={rimR} stroke="#fff1c4" strokeWidth={1.2} fill="none" opacity={0.55 + 0.2 * level} strokeLinecap="round" />

      {/* the head: drawn the newborn's way (SitHead), so he is the same baby; serene by default (BAL-22) */}
      <g transform={`translate(${g.head[0]} ${g.head[1]}) rotate(${g.headTilt}) scale(${g.headScale})`}>
        <SitHead st={headState} aura={level} uid={`${uid}-head`} seed={uid.length * 7.31 + uid.charCodeAt(uid.length - 1) * 0.37} />
      </g>

      {/* grains let fall from his fingers: they drop, bounce a touch and lie where they land */}
      {drops
        .filter((d) => f >= d.at)
        .map((d, di) => {
          const tip = fingertip(d.at, d.side);
          const floorY = mounds ? -10 : -12;
          return (
            <g key={`d${di}`}>
              {Array.from({ length: d.trickle ? 8 : 6 }, (_, k) => {
                const t = f - d.at - k * (d.trickle ? 1.4 : 0.6);
                if (t < 0) return null;
                const vx = (hashN(k * 4.1 + di) - 0.5) * 0.6;
                const fall = tip[1] + 0.5 * 0.55 * t * t;
                const land = floorY + (hashN(k * 6.7 + di) - 0.5) * 6;
                const yy = Math.min(fall, land);
                const xx = tip[0] + vx * Math.min(t, 14) + (hashN(k * 2.3 + di) - 0.5) * 3;
                return <ellipse key={k} cx={xx} cy={yy} rx={1.9} ry={1.2} fill="#fffaf0" transform={`rotate(${hashN(k + di * 7) * 180 + t * 9} ${xx} ${yy})`} />;
              })}
            </g>
          );
        })}
      {/* a few grains hop up where a flat hand pats the rice */}
      {pats
        .filter((q) => f >= q.at && f < q.at + 12)
        .map((q, qi) => {
          const tip = fingertip(q.at, q.side);
          const t = f - q.at;
          return (
            <g key={`p${qi}`}>
              {[0, 1, 2].map((k) => {
                const ox = q.side * (4 + 5 * k) - 4;
                const hop = Math.max(0, (1.6 + 0.4 * k) * t - 0.5 * 0.42 * t * t);
                return <ellipse key={k} cx={tip[0] + ox + 0.25 * t * (k - 1)} cy={tip[1] - 3 - hop} rx={1.9} ry={1.2} fill="#fffaf0" />;
              })}
            </g>
          );
        })}
      {/* the same little hop for the pats he gives the rice inside the relief pause (P3, life clock) */}
      {ePats
        .filter((c) => e >= c && e < c + 12)
        .map((c, ci) => {
          const tip = fingertip(f, 1, c);
          const t = e - c;
          return (
            <g key={`ep${ci}`}>
              {[0, 1, 2].map((k) => {
                const ox = 4 + 5 * k - 4;
                const hop = Math.max(0, (1.6 + 0.4 * k) * t - 0.5 * 0.42 * t * t);
                return <ellipse key={k} cx={tip[0] + ox + 0.25 * t * (k - 1)} cy={tip[1] - 3 - hop} rx={1.9} ry={1.2} fill="#fffaf0" />;
              })}
            </g>
          );
        })}
    </g>
  );
};

/* ---------------- acting ---------------- */

const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

/** Mouth movement while a clip plays (no envelope data in the Episode 2 timing, so procedural chatter). Story frames. */
const speakAt = (from: number, to: number, seed: number) => ({
  mouth: (fr: number): MouthState => (fr >= from && fr <= to ? visemeChatter(fr, seed, 0.9) : MOUTH_REST),
  talk: (fr: number): number => (fr >= from && fr <= to ? 0.6 : 0),
});
const babuSpeech = speakAt(BABU_FROM, BABU_TO, 4);

/** Fear face: wide eyes and open mouth (gasp), raised worried brows, no smile. */
const FEAR = { gasp: 1, brow: 0.9, browTilt: 0.5, smile: 0 };
/** Both hands up to the face (cheeks): the "relaxed" hand shape (an open palm on a cheek reads as a wave). */
const HANDS_TO_FACE = { rS: 38, rE: 136, lS: 38, lE: 136, rHand: "relaxed" as const, lHand: "relaxed" as const };
const PRAYER = { rS: 28, rE: 105, lS: 28, lE: 105, rHand: "pranam" as const, lHand: "pranam" as const };

// beat 3: the parents cry out at "the parents cried out" (168): hands to faces from 161, held to
// SCREAM_HOLD (about 20 frames), then they rush to the pot and kneel at its sides.
const SCREAM_AT = 169;
const SCREAM_HOLD = 189;
const RUSH_TO = 229;
const KNEEL_AT = 245;

const babuAct = A([
  { f: 0, bodyTurn: -0.25, headTurn: -0.5, eyeX: -0.6, smile: 0.4, rS: 8, rE: -10, lS: 8, lE: -10, rHand: "relaxed", lHand: "relaxed" },
  { f: 40, headNod: 3, smile: 0.5, in: 18, ease: "inOut" },
  { f: 62, headNod: -2, eyeY: -0.3, in: 14, ease: "inOut" }, // glances up at the pot just before the rope goes
  // startle as the rope snaps (starts 71)
  { f: 79, gasp: 0.6, brow: 0.5, headNod: -6, eyeY: -0.4, smile: 0, rS: 40, rE: 25, lS: 40, lE: 25, rHand: "open", lHand: "open", in: 8, ease: "out" },
  // frozen in shock as the pot lands over the child, leaning toward it
  { f: 104, gasp: 0.4, brow: 0.6, eyeY: 0.3, headNod: 3, lean: -3, rS: 24, rE: -20, lS: 24, lE: -20, in: 18, ease: "inOut" },
  { f: 132, gasp: 0.5, brow: 0.7, browTilt: 0.3, headTurn: -0.6, lean: -5, rS: 30, rE: 10, lS: 30, lE: 10, in: 22, ease: "inOut" },
  { f: 152, gasp: 0.45, headTurn: -0.55, lean: -4, rS: 26, rE: -6, lS: 26, lE: -6, in: 18, ease: "inOut" },
  // beat 3: cries out, hands to his face (starts 161)
  { f: SCREAM_AT, ...FEAR, headNod: -4, lean: -2, ...HANDS_TO_FACE, in: 8, ease: "backOut" },
  { f: SCREAM_HOLD, ...FEAR, headNod: -2, rS: 36, rE: 132, lS: 40, lE: 138, in: 18, ease: "inOut" },
  // rushes in, arms reaching for the pot
  { f: 205, gasp: 0.7, brow: 0.8, bodyTurn: -0.55, headTurn: -0.6, eyeY: 0.3, lean: -8, rS: 34, rE: -30, lS: 40, lE: -24, rHand: "open", lHand: "open", in: 14, ease: "inOut" },
  { f: RUSH_TO, lean: -12, rS: 44, rE: -20, lS: 50, lE: -16, in: 18, ease: "inOut" },
  { f: KNEEL_AT, lean: -16, gasp: 0.6, in: 16, ease: "inOut" },
  // beat 4: grips (241-253), leans back and strains with an effort face (to 266)
  { f: 253, gasp: 0.35, brow: 0.8, browTilt: 0.6, lid: 0.25, lean: -13, in: 8, ease: "inOut" },
  { f: 266, gasp: 0.5, brow: 0.9, lid: 0.35, headNod: -4, lean: 0, in: 13, ease: "inOut" },
  // tips the pot up and over, leaning in after it as his side rises
  { f: 281, gasp: 0.4, brow: 0.8, lid: 0.1, headNod: 2, lean: -12, headTurn: -0.65, eyeY: 0.3, in: 15, ease: "inOut" },
  // hands off the pot (274-286): they come back loose and open
  { f: 292, lid: 0, gasp: 0.6, rS: 30, rE: -26, lS: 34, lE: -20, rHand: "open", lHand: "open", in: 10, ease: "inOut" },
  // beat 5 (cue 311): kneels again and leans in to look through the mouth, still afraid...
  { f: 310, ...FEAR, gasp: 0.85, lean: -15, headTurn: -0.6, eyeX: -0.6, eyeY: 0.35, headNod: 3, in: 14, ease: "inOut" },
  // ...then wonder: brows lift, the mouth softens
  { f: 330, gasp: 0.45, brow: 0.75, browTilt: 0, smile: 0.25, lean: -17, eyeY: 0.3, rS: 34, rE: 24, lS: 38, lE: 30, in: 16, ease: "inOut" },
  // relief: a long breath out, near hand to his chest
  { f: 352, gasp: 0.05, brow: 0.4, smile: 0.75, tears: 0.2, headNod: 5, lean: -12, lS: 12, lE: -118, lHand: "relaxed", rS: 24, rE: -28, in: 18, ease: "inOut" },
  { f: 374, smile: 0.85, headNod: 1, headTilt: -3, rS: 30, rE: 20, rHand: "open", in: 18, ease: "inOut" },
  // laughs with the child (cue 396)
  { f: 398, smile: 1, cheeks: 0.5, brow: 0.3, headNod: -3, lean: -10, lS: 20, lE: -30, rS: 20, rE: -30, lHand: "relaxed", rHand: "relaxed", in: 14, ease: "inOut" },
  // "not a scratch" (cue 423): reaches gently toward the child
  { f: 426, smile: 0.9, cheeks: 0.3, lean: -16, lS: 46, lE: -14, lHand: "open", in: 16, ease: "inOut" },
  { f: 450, smile: 0.9, lean: -12, headTurn: -0.5, lS: 22, lE: -34, lHand: "relaxed", in: 18, ease: "inOut" },
  { f: 472, smile: 0.8, tears: 0.15, headTurn: -0.45, lS: 12, lE: -116, lHand: "relaxed", in: 16, ease: "inOut" },
  // beat 6 (cue 494, Babukaka's line): joined palms to Narayan, eyes lifted...
  { f: 501, ...PRAYER, smile: 0.8, cheeks: 0, tears: 0.1, lean: -6, headTurn: -0.3, eyeX: -0.2, eyeY: -0.5, headNod: -5, in: 14, ease: "inOut" },
  // ...then a calm blessing over the child: near hand raised in abhaya, far hand on his chest
  { f: 530, lS: 42, lE: 70, lHand: "abhaya", rS: 12, rE: -116, rHand: "relaxed", eyeY: 0.2, eyeX: -0.6, headNod: 2, headTurn: -0.5, lean: -9, in: 20, ease: "inOut" },
  { f: 560, lS: 46, lE: 64, headTilt: -3, smile: 0.95, in: 22, ease: "inOut" },
  { f: 590, lS: 40, lE: 72, headTilt: 1, in: 22, ease: "inOut" },
  { f: 616, lS: 22, lE: -30, lHand: "relaxed", rS: 20, rE: -30, rHand: "relaxed", smile: 1, headNod: 0, lean: -6, in: 20, ease: "inOut" },
  { f: 642, headTurn: -0.4, headTilt: -2, eyeX: -0.4, in: 20, ease: "inOut" },
  { f: 668, headTurn: -0.5, headTilt: 1, in: 14, ease: "inOut" },
  // breath: rests kneeling by the pot, smiling down at the child
  { f: CONTENT_END + 14, headTurn: -0.42, headTilt: -2, eyeX: -0.5, headNod: 2, in: 24, ease: "inOut" },
  { f: CONTENT_END + 42, headTurn: -0.5, headTilt: 1.5, headNod: 0, in: 24, ease: "inOut" },
]);

const charuAct = A([
  { f: 0, headTurn: 0.2, eyeX: 0.5, smile: 0.3, rS: 8, rE: -10, lS: 8, lE: -10, rHand: "relaxed", lHand: "relaxed" },
  // watches the child play: near hand drifts up to her waist and back
  { f: 30, smile: 0.45, headTilt: 4, rS: 14, rE: -62, in: 18, ease: "inOut" },
  { f: 54, smile: 0.4, headTilt: 0, rS: 8, rE: -12, in: 18, ease: "inOut" },
  // startle as the rope snaps (starts 71), hands up and open
  { f: 79, gasp: 0.6, brow: 0.6, headTurn: 0.3, eyeY: -0.4, smile: 0, rS: 40, rE: 110, lS: 40, lE: 110, rHand: "open", lHand: "open", in: 8, ease: "out" },
  // hands come down as the pot lands, frozen in shock; small anxious changes so she never freezes
  { f: 104, gasp: 0.4, brow: 0.6, eyeY: 0.3, lean: 3, rS: 22, rE: -30, lS: 22, lE: -30, in: 18, ease: "inOut" },
  { f: 124, gasp: 0.5, brow: 0.7, browTilt: 0.4, headTurn: 0.45, lean: 5, rS: 34, rE: 60, lS: 18, lE: -24, in: 18, ease: "inOut" },
  { f: 144, gasp: 0.55, headTurn: 0.4, rS: 30, rE: 90, lS: 30, lE: 80, in: 18, ease: "inOut" },
  // beat 3: cries out, hands to her face (starts 161), held about 20 frames
  { f: SCREAM_AT, ...FEAR, headTurn: 0.35, ...HANDS_TO_FACE, in: 8, ease: "backOut" },
  { f: SCREAM_HOLD, ...FEAR, headTilt: -4, rS: 42, rE: 132, lS: 36, lE: 140, in: 18, ease: "inOut" },
  // rushes to the pot, arms reaching
  { f: 205, gasp: 0.7, brow: 0.8, bodyTurn: 0.45, headTurn: 0.5, eyeY: 0.3, lean: 8, rS: 40, rE: -24, lS: 30, lE: -30, rHand: "open", lHand: "open", in: 14, ease: "inOut" },
  { f: RUSH_TO, lean: 12, rS: 50, rE: -16, lS: 40, lE: -20, in: 18, ease: "inOut" },
  { f: KNEEL_AT, lean: 15, gasp: 0.6, tears: 0.3, in: 16, ease: "inOut" },
  // beat 4: grips (241-253), leans back and pulls with a frightened effort face (to 266)
  { f: 253, gasp: 0.5, brow: 0.9, browTilt: 0.6, lid: 0.2, lean: 13, in: 8, ease: "inOut" },
  { f: 266, gasp: 0.6, brow: 0.9, lid: 0.3, headNod: -3, lean: 0, in: 13, ease: "inOut" },
  // pulls the pot over toward herself and lets go as it drops onto its side (268-280)
  { f: 278, gasp: 0.6, lid: 0.1, headNod: 2, lean: 9, in: 12, ease: "inOut" },
  { f: 290, gasp: 0.7, lid: 0, lean: 2, rS: 30, rE: 60, lS: 26, lE: 40, rHand: "open", lHand: "open", in: 10, ease: "inOut" },
  // beat 5 (cue 311): leans in to look through the mouth, hands to her mouth in fear...
  { f: 308, ...FEAR, gasp: 0.85, lean: 16, headTurn: 0.55, eyeX: 0.6, eyeY: 0.35, rS: 36, rE: 140, lS: 34, lE: 142, rHand: "relaxed", lHand: "relaxed", in: 14, ease: "inOut" },
  // ...then wonder: the hands lower, brows lift
  { f: 328, gasp: 0.45, brow: 0.7, browTilt: 0, smile: 0.25, lean: 18, rS: 30, rE: 118, lS: 28, lE: 112, in: 16, ease: "inOut" },
  // relief: both hands to her chest, tears
  { f: 348, gasp: 0.05, brow: 0.4, smile: 0.7, tears: 0.4, lean: 14, headTilt: 4, rS: 12, rE: -116, lS: 12, lE: -116, rHand: "relaxed", lHand: "relaxed", in: 18, ease: "inOut" },
  // reaches toward the child
  { f: 370, smile: 0.8, lean: 18, rS: 40, rE: -10, lS: 16, lE: -110, in: 18, ease: "inOut" },
  // laughs with the child (cue 396), palms joined at her chest
  { f: 394, smile: 1, cheeks: 0.5, tears: 0.45, lean: 12, headTilt: 6, rS: 24, rE: 98, lS: 24, lE: 98, rHand: "pranam", lHand: "pranam", in: 16, ease: "inOut" },
  // "not a scratch" (cue 423): wipes a tear with her near hand
  { f: 418, smile: 0.9, cheeks: 0.3, headTilt: 2, rS: 42, rE: 118, rHand: "relaxed", lS: 20, lE: -40, lHand: "relaxed", in: 16, ease: "inOut" },
  { f: 440, tears: 0.3, lean: 14, rS: 20, rE: -40, in: 16, ease: "inOut" },
  // relief settles: her near (left) hand comes to rest on her chest (held through the relief pause P3, authored 485)
  { f: 462, smile: 0.95, cheeks: 0.3, tears: 0.35, headTilt: -4, lS: 12, lE: -116, lHand: "relaxed", rS: 20, rE: -40, rHand: "relaxed", in: 18, ease: "inOut" },
  // beat 6 (Babukaka's line, cue 494): joined palms, starting as the relief pause ends
  { f: 501, ...PRAYER, smile: 0.85, cheeks: 0, tears: 0.2, lean: 8, headTilt: 2, eyeY: -0.3, in: 14, ease: "inOut" },
  { f: 524, eyeY: 0.1, headTilt: 4, in: 18, ease: "inOut" },
  // palms part; a hand reaches to the child, then rests
  { f: 546, rS: 36, rE: -12, rHand: "open", lS: 18, lE: -40, lHand: "relaxed", lean: 14, tears: 0.1, in: 20, ease: "inOut" },
  { f: 570, rS: 30, rE: -20, headTilt: -2, in: 20, ease: "inOut" },
  { f: 594, rS: 12, rE: -116, lS: 12, lE: -116, rHand: "relaxed", lHand: "relaxed", lean: 8, smile: 0.9, in: 20, ease: "inOut" },
  { f: 618, rS: 20, rE: -40, lS: 20, lE: -40, rHand: "relaxed", lHand: "relaxed", headTilt: 3, tears: 0, in: 20, ease: "inOut" },
  { f: 642, headTilt: -2, eyeX: 0.5, rS: 16, rE: -72, in: 20, ease: "inOut" },
  { f: 666, headTilt: 2, rS: 24, rE: -32, lS: 16, lE: -52, in: 18, ease: "inOut" },
  // breath: watches him lovingly, hands resting
  { f: CONTENT_END + 20, headTilt: -1.5, eyeX: 0.6, rS: 18, rE: -44, in: 24, ease: "inOut" },
  { f: CONTENT_END + 48, headTilt: 2.5, eyeX: 0.45, rS: 22, rE: -36, in: 24, ease: "inOut" },
]);

/* ---------------- travel and kneel (body tracks) ---------------- */

/** Where each parent kneels beside the mouth-down pot during the pull. */
const BABU_PULL_X = POT_X + 215;
const CHARU_PULL_X = POT_X - 205;

const babuBodyX = (f: number) =>
  track(f, [
    [SCREAM_HOLD, 0],
    [RUSH_TO, BABU_PULL_X - BABU_X],
    [266, BABU_PULL_X - BABU_X],
    [282, BABU_PULL_X - BABU_X - 22],
  ]);
const charuBodyX = (f: number) =>
  track(f, [
    [SCREAM_HOLD + 4, 0],
    [RUSH_TO, CHARU_PULL_X - CHARU_X],
    [266, CHARU_PULL_X - CHARU_X],
    [280, CHARU_PULL_X - CHARU_X + 14],
  ]);
/** Walking stride while travelling (eases in and out with the move). */
const strideAt = (f: number, from: number, to: number) => 0.9 * clamp((f - from) / 6) * clamp((to - f) / 6);
/** Kneel: drops from standing to one knee once the rush ends. */
const kneelAt = (f: number) =>
  track(f, [
    [RUSH_TO - 4, 0],
    [KNEEL_AT, 1],
  ]);
/** Babukaka rises from the kneel to a squat as he lifts his side of the pot, then kneels again to look in. */
const babuKneelAt = (f: number) =>
  track(f, [
    [RUSH_TO - 4, 0],
    [KNEEL_AT, 1],
    [266, 1],
    [282, 0.6],
    [298, 0.6],
    [318, 1],
  ]);

/* ---------------- arm IK (mirrors the Puppet's body and arm conventions) ---------------- */

type V2 = [number, number];

interface RigBody {
  scale: number;
  seed: number;
  ua: number;
  reach2: number;
  torso: number;
  thigh: number;
  shin: number;
  foot: number;
  sw: number;
  limbW: number;
}

/** Adult body lengths, as bodyFor() in Puppet.tsx builds them. */
const rigOf = (c: CastMember, scale: number): RigBody => {
  const h = c.height;
  const g = c.girth;
  return {
    scale,
    seed: c.seed,
    ua: 56 * h,
    reach2: 52 * h - 2 + 37 * h * 0.62,
    torso: 108 * h,
    thigh: 80 * h,
    shin: 74 * h,
    foot: 31 * h,
    sw: 47 * h * (0.85 + g * 0.15),
    limbW: 8.8 * h * (c.wiry ? 0.82 : 1) * (0.9 + g * 0.1),
  };
};
const BABU_RIG = rigOf(CAST.babukaka, BABU_SCALE);
const CHARU_RIG = rigOf(CAST.charu, CHARU_SCALE);

/** Hip height above the feet for a crouch (0..1, above 0.6 is a kneel), as legGeo in Puppet.tsx. */
const groundOf = (b: RigBody, crouch: number, bodyTurn: number) => {
  const sphi = Math.sin(clamp(bodyTurn, -1, 1) * 0.95);
  const nearSide = sphi > 0.05 ? -1 : 1;
  const leg = (side: 1 | -1) => {
    let th = 0.03;
    let kn = 0.05;
    let ab = 0.04;
    const c = clamp(crouch);
    if (c > 0) {
      const k = clamp(c / 0.6);
      th = lerp(th, 0.85, k);
      kn = lerp(kn, 1.55, k);
      ab = lerp(ab, 0.12, k);
      if (c > 0.6) {
        const k2 = clamp((c - 0.6) / 0.4);
        if (side === nearSide) {
          th = lerp(th, 1.45, k2);
          kn = lerp(kn, 1.5, k2);
        } else {
          th = lerp(th, 0.05, k2);
          kn = lerp(kn, 1.8, k2);
        }
      }
    }
    const kneeY = b.thigh * Math.cos(th) * Math.cos(ab);
    const sole = kneeY + b.shin * Math.cos(th - kn) + b.foot * 0.28;
    return Math.max(sole, kneeY + b.limbW * 1.2);
  };
  return Math.max(leg(-1), leg(1));
};

/**
 * Two-bone IK in the Puppet's arm convention: upper arm direction (side*sin S, cos S), forearm
 * direction (side*sin(S+E), cos(S+E)). Returns S/E in degrees that put the grip point on `grip`.
 * The elbow is chosen lower than the shoulder-to-grip line.
 */
const armIK = (b: RigBody, side: 1 | -1, sh: V2, grip: V2): { S: number; E: number } => {
  const L1 = b.ua;
  const L2 = b.reach2;
  const dx = grip[0] - sh[0];
  const dy = grip[1] - sh[1];
  const D = Math.min(Math.hypot(dx, dy), (L1 + L2) * 0.999);
  const base = Math.atan2(side * dx, dy);
  const beta = Math.acos(clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
  let th1 = base + beta;
  let elbowY = sh[1] + L1 * Math.cos(th1);
  const alt = base - beta;
  const altY = sh[1] + L1 * Math.cos(alt);
  if (altY > elbowY) {
    th1 = alt;
    elbowY = altY;
  }
  const ex = sh[0] + L1 * side * Math.sin(th1);
  const th2 = Math.atan2(side * (grip[0] - ex), grip[1] - elbowY);
  return { S: (th1 * 180) / Math.PI, E: ((th2 - th1) * 180) / Math.PI };
};

/**
 * Blends a keyed pose toward hands placed on world points (rGrip, lGrip) with weight w. Accounts
 * for the puppet's position, scale, squash bounce, crouch and lean (the upper body rotates by
 * `lean` degrees about the hips), so the hands stay on the pot while the body leans and strains.
 */
const withGrip = (b: RigBody, x0: number, y0: number, f: number, key: Pose, w: number, rGrip: V2, lGrip: V2): Pose => {
  if (w <= 0) return key;
  const bounce = Math.sin(f * 0.14 + b.seed) * 0.014 + Math.min(0.032, Math.abs(key.lean) * 0.0028);
  const sx = b.scale * (1 + bounce);
  const sy = b.scale * (1 - bounce);
  const hipY = -groundOf(b, key.crouch, key.bodyTurn);
  const breath = Math.sin((f / 24) * TAU * 0.27 + b.seed);
  const shY = hipY - b.torso + breath * 0.9 + b.limbW;
  const cphi = Math.cos(clamp(key.bodyTurn, -1, 1) * 0.95);
  const a = (-key.lean * Math.PI) / 180;
  const toArm = (p: V2): V2 => {
    const lx = (p[0] - (x0 + key.bodyX)) / sx;
    const ly = (p[1] - (y0 + key.bodyY)) / sy - hipY;
    return [lx * Math.cos(a) - ly * Math.sin(a), lx * Math.sin(a) + ly * Math.cos(a) + hipY];
  };
  const r = armIK(b, 1, [b.sw * 0.86 * cphi, shY], toArm(rGrip));
  const l = armIK(b, -1, [-b.sw * 0.86 * cphi, shY], toArm(lGrip));
  const holding = w > 0.5;
  return {
    ...key,
    rS: lerp(key.rS, r.S, w),
    rE: lerp(key.rE, r.E, w),
    lS: lerp(key.lS, l.S, w),
    lE: lerp(key.lE, l.E, w),
    rHand: holding ? "hold" : key.rHand,
    lHand: holding ? "hold" : key.lHand,
  };
};

/** Small fearful tremble while the parents cry out (fades in with the scream, out with the rush). */
const trembleAt = (f: number, seed: number) =>
  track(f, [
    [SCREAM_AT - 4, 0],
    [SCREAM_AT, 1],
    [SCREAM_HOLD, 1],
    [SCREAM_HOLD + 10, 0],
  ]) * Math.sin(f * 1.9 + seed);

/** Babukaka: keyed acting, plus travel, kneel, tremble and (from beat 4) hands on the pot. */
const babuPose = (f: number): Partial<Pose> => {
  const k = babuAct(f);
  const tr = trembleAt(f, 1);
  const sh = strainAt(f, 1);
  const breathe = Math.sin((f / 24) * TAU * 0.25 + 2);
  const key: Pose = {
    ...k,
    bodyX: k.bodyX + babuBodyX(f) + 1.4 * sh,
    crouch: Math.max(k.crouch, babuKneelAt(f)),
    stride: strideAt(f, SCREAM_HOLD, RUSH_TO),
    lean: k.lean + 1.2 * sh,
    headTilt: k.headTilt + 1.5 * tr + 1.2 * sh + 1.5 * Math.sin((f / 132) * TAU + 0.4),
    rS: k.rS + 2 * tr + 1.5 * breathe,
    lS: k.lS - 2 * tr + 1.5 * breathe,
  };
  return babuGrip(f, key);
};

/**
 * Charu's gestures plus a small idle layer, so she never freezes: a slow weight shift, a head tilt
 * drifting around her pose, and shoulders that rise and fall with the breath.
 */
const charuPose = (f: number): Partial<Pose> => {
  const k = charuAct(f);
  const breathe = Math.sin((f / 24) * TAU * 0.27);
  const tr = trembleAt(f, 2);
  const sh = strainAt(f, 2);
  const key: Pose = {
    ...k,
    bodyX: k.bodyX + charuBodyX(f) + 2.5 * Math.sin((f / 150) * TAU + 0.6) + 1.2 * sh,
    crouch: Math.max(k.crouch, kneelAt(f)),
    stride: strideAt(f, SCREAM_HOLD + 4, RUSH_TO),
    lean: k.lean - 1.2 * sh,
    headTilt: k.headTilt + 2 * Math.sin((f / 118) * TAU + 1.3) + 1.5 * tr + sh,
    rS: k.rS + 1.8 * breathe + 2 * tr,
    lS: k.lS + 1.8 * breathe - 2 * tr,
  };
  return charuGrip(f, key);
};

/* ---------------- pot state ---------------- */

interface PotState {
  x: number;
  y: number;
  rot: number;
  mouthView: number;
  leak: number;
  rice: number;
  dust: number;
}

// beat 4 (cue 248 "but when the pot was lifted"): hands reach the pot from 241, they lean back and
// strain, then tip it: they lift it slowly from 180 to 150 (TIP_FROM-LIFT_TO) with their hands on it,
// let go, and it rolls onto its side (90 at TIP_TO) and its mouth turns to the viewer
// (TURN_FROM-TURN_TO): 40 frames in all, ending as the reveal cue (311) begins.
const GRIP_FROM = 241;
const GRIP_ON = 253;
const STRAIN_TO = 266;
const TIP_FROM = 264;
const LIFT_TO = 281;
const TIP_TO = 291;
const TURN_FROM = 285;
const TURN_TO = 304;
const REVEAL = 304; // beat 5: the child is seen through the mouth (cue 311)
const CHARU_LET_GO = 270; // her side of the pot drops toward her; her hands come off 270-282
const BABU_LET_GO = 276; // his side rises; his hands come off 276-288

/**
 * The pot: hangs from the beam with a slight sway, turns over as it falls in slow motion and lands
 * mouth-down exactly over the toddler with a short heavy bounce, glows from under the rim while he
 * is covered, then is tipped onto its side with the mouth turned to the viewer.
 */
const potAt = (f: number): PotState => {
  const sway = Math.sin(f * 0.09) * 1.6 * (1 - clamp((f - 60) / 12));
  let y: number;
  let rot: number;
  if (f < LAND_AT) {
    const t = fallT(f);
    y = lerp(HANG_Y, FLOOR_Y, t * t);
    // it turns over as it drops: slowly at first, fully mouth-down just before the floor
    rot = f < FALL_FROM ? sway : 180 * clamp(Math.pow(t, 0.8) * 1.04);
  } else {
    const dt = f - LAND_AT;
    y = track(f, [
      [LAND_AT, FLOOR_Y],
      [LAND_AT + 4, FLOOR_Y - 10, "out"],
      [LAND_AT + 8, FLOOR_Y, "in"],
      [LAND_AT + 11, FLOOR_Y - 3, "out"],
      [LAND_AT + 14, FLOOR_Y, "in"],
    ]);
    // landing wobble, then the strain rocks it a little, then the tip from 180 to 90
    const strain = clamp((f - GRIP_ON) / 4) * clamp((TIP_FROM + 6 - f) / 6);
    rot =
      track(f, [
        [TIP_FROM, 180],
        [LIFT_TO, 150, "inOut"],
        [TIP_TO, 90, "in"],
        [TIP_TO + 4, 93, "out"],
        [TIP_TO + 8, 90, "inOut"],
      ]) +
      3 * Math.exp(-dt / 3) * Math.sin(dt * 1.3) -
      1.6 * strain * (0.5 + 0.5 * Math.sin(f * 1.7));
  }
  const mouthView = track(f, [
    [TURN_FROM, 0],
    [TURN_TO, 1, "inOut"],
  ]);
  // (its slow flicker is added by the scene on the life clock, so it keeps breathing in the pause on the covered pot)
  const leak = track(f, [
    [LAND_AT + 2, 0],
    [LAND_AT + 16, 0.85, "out"],
    [TIP_FROM, 0.85],
    [TIP_FROM + 14, 0, "out"],
  ]);
  // dust is the puff's progress: it starts on the landing frame and spreads and fades over 30 frames
  const dust = f < LAND_AT ? 0 : clamp((f - LAND_AT) / 30);
  const rice = track(f, [
    [LAND_AT, 0],
    [LAND_AT + 8, 0.35, "out"],
  ]);
  return { x: POT_X, y, rot, mouthView, leak, rice, dust };
};

/** The baby is visible on the floor only until the pot comes down over him. */
const babyOnFloor = (f: number) => f < LAND_AT;

/* ---------------- pot surface points (for the grips), mirroring Matka's side-view projection ---------------- */

const M_PITCH = 0.19;
const M_HC = 122;
/** Matka's half profile [radius, axial height] at mouthView 0. */
const M_PROFILE: Array<[number, number]> = (() => {
  const cubic = (a: number[], b: number[], c: number[], d: number[], t: number): [number, number] => {
    const u = 1 - t;
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [w[0] * a[0] + w[1] * b[0] + w[2] * c[0] + w[3] * d[0], w[0] * a[1] + w[1] * b[1] + w[2] * c[1] + w[3] * d[1]];
  };
  const pts: Array<[number, number]> = [[58, 0]];
  for (let i = 0; i <= 10; i++) pts.push(cubic([62, 6], [104, 20], [130, 60], [132, 118], i / 10));
  for (let i = 1; i <= 10; i++) pts.push(cubic([132, 118], [134, 170], [104, 206], [56, 226], i / 10));
  pts.push([56, 230]);
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * Math.PI;
    pts.push([63 + 8 * Math.sin(a), 238 - 8 * Math.cos(a)]);
  }
  return pts;
})();
const mRadius = (h: number) => {
  const p = M_PROFILE;
  if (h <= p[0][1]) return p[0][0];
  for (let k = 0; k < p.length - 1; k++) {
    const [r0, h0] = p[k];
    const [r1, h1] = p[k + 1];
    if (h >= h0 && h <= h1) return h1 - h0 < 1e-6 ? r1 : lerp(r0, r1, (h - h0) / (h1 - h0));
  }
  return p[p.length - 1][0];
};
const M_SECTIONS: Array<[number, number]> = [
  ...Array.from({ length: 39 }, (_, i): [number, number] => [mRadius(i * 6), i * 6]),
  [56, 230],
  ...M_PROFILE.filter((q) => q[1] > 230),
];

/**
 * World position of a point on the pot's side-view outline: axial height h (base = 0), on the
 * local side `side` (-1 or 1), for the pot's current rot (mouthView 0). Matches Matka's
 * rotate-about-the-axial-centre and rest-on-the-floor placement.
 */
const potPoint = (p: PotState, h: number, side: 1 | -1, inset = 0): V2 => {
  const rr = (p.rot * Math.PI) / 180;
  const ax = Math.sin(rr);
  const ay = -Math.cos(rr);
  const ay2 = ay * Math.cos(M_PITCH);
  const zs = Math.abs(-ay * Math.sin(M_PITCH));
  const L = Math.max(Math.hypot(ax, ay2), 1e-4);
  const alpha = Math.atan2(ax, -ay2);
  const ca = Math.cos(alpha);
  const sa = Math.sin(alpha);
  let bot = -Infinity;
  for (const [r, hh] of M_SECTIONS) {
    const c = -(hh - M_HC) * L;
    bot = Math.max(bot, c * ca + Math.sqrt(r * r * sa * sa + r * zs * (r * zs) * ca * ca));
  }
  const lx = side * (mRadius(h) - inset);
  const ly = -(h - M_HC) * L;
  const cy = p.y - POT_S * bot;
  return [p.x + POT_S * (lx * ca - ly * sa), cy + POT_S * (lx * sa + ly * ca)];
};

/* ---------------- grips on the pot (beat 4) ---------------- */

/** Grip weight: hands go to the pot from GRIP_FROM, are on it by GRIP_ON, and come off from `letGo`. */
const gripW = (f: number, letGo: number) => clamp((f - GRIP_FROM) / (GRIP_ON - GRIP_FROM)) * (1 - clamp((f - letGo) / 12));

/**
 * Babukaka kneels at the pot's right. While it is mouth-down his near (left) hand holds the lower
 * flank by the rim end and his far (right) hand the upper flank; both follow the pot as he tips it.
 */
const babuGrip = (f: number, key: Pose): Pose => {
  const w = gripW(f, BABU_LET_GO);
  if (w <= 0) return key;
  const p = potAt(f);
  return withGrip(BABU_RIG, BABU_X, 1000, f, key, w, potPoint(p, 72, -1, 4), potPoint(p, 140, -1, 4));
};

/** Charu kneels at the pot's left, her hands on the left flank, mirroring his grip. */
const charuGrip = (f: number, key: Pose): Pose => {
  const w = gripW(f, CHARU_LET_GO);
  if (w <= 0) return key;
  const p = potAt(f);
  return withGrip(CHARU_RIG, CHARU_X, 1000, f, key, w, potPoint(p, 112, 1, 4), potPoint(p, 58, 1, 4));
};

/** Strain: a small fast shake while they pull (GRIP_ON to STRAIN_TO), fading into the tip. */
const strainAt = (f: number, seed: number) =>
  clamp((f - GRIP_ON + 2) / 4) * clamp((STRAIN_TO + 4 - f) / 6) * Math.sin(f * 2.3 + seed);

/* ---------------- camera: the approved shot list, every key read from the narration (CAM-13) ---------------- */

/** Quintic ease in and out (flat at both ends), so each push starts and settles with no jolt. */
const ease5 = (t: number) => {
  const u = clamp(t);
  return u * u * u * (u * (u * 6 - 15) + 10);
};

/**
 * World centre of an adult puppet's head (standing on y = 1000 at x0): the hips sit at the crouch's
 * height, and the head rides up the torso, rotated by `lean` about the hips (as withGrip models it).
 * Head centre above the hips: torso + neck + 0.86 head radius (Puppet's body proportions).
 */
const headOf = (c: CastMember, b: RigBody, x0: number, p: Pose): V2 => {
  const h = c.height;
  const up = (108 * h + 11 * h + 0.86 * 41 * Math.sqrt(h)) * b.scale;
  const hipY = 1000 + p.bodyY - b.scale * groundOf(b, p.crouch, p.bodyTurn);
  const a = (p.lean * Math.PI) / 180;
  return [x0 + p.bodyX + up * Math.sin(a), hipY - up * Math.cos(a)];
};
const babuHead = (f: number): V2 => {
  const k = babuAct(f);
  return headOf(CAST.babukaka, BABU_RIG, BABU_X, { ...k, bodyX: k.bodyX + babuBodyX(f), crouch: Math.max(k.crouch, babuKneelAt(f)) });
};

/** A camera state: centre offset (x, y) and zoom (Stage convention: screen = 960/540 + zoom * (world - 960/540 - x/y)). */
interface Shot {
  x: number;
  y: number;
  zoom: number;
}
/** The camera that puts world point p at screen point s at this zoom. */
const frameAt = (p: V2, zoom: number, s: V2): Shot => ({ x: p[0] - 960 - (s[0] - 960) / zoom, y: p[1] - 540 - (s[1] - 540) / zoom, zoom });
/** An eased move between two framings: the frame centre moves straight, the zoom in log space. */
const blendShot = (a: Shot, b: Shot, t: number): Shot =>
  t <= 0 ? a : t >= 1 ? b : { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)) };

const TODDLER_FACE: V2 = [POT_X, FLOOR_Y - 60 - 118 * (0.78 / 0.95)];

/*
 * The framings. Caption band: the floor line under the pot and the parents' feet (world y 1000-1010) stays at screen
 * y <= about 800 in every wide and medium (screen y = 540 + zoom * (1010 - 540 - y)), the open mouth of the tipped
 * pot (lower lip, world y 990) and every face above y 820 in the close-ups. No framing shows a background edge (the
 * wall spans x -300..2220 from y -40 at depth 0.6, the floor runs to y 1500).
 */
/** Shot 1: the held establishing wide (the room, the toddler on the floor, the pot hanging above him). */
const SH1_WIDE: Shot = { x: -40, y: 200, zoom: 0.95 };
/** Shots 1-2: the medium the push ends on; it holds both the hanging pot and the child, so the fall needs no move. */
const SH1_MED: Shot = { x: -60, y: 244, zoom: 1.1 };
/** Shot 3: medium-wide two-shot of both parents crying out, then rushing to the pot. */
const SH3_TWO: Shot = { x: -70, y: 286, zoom: 1.4 };
/** Shot 4: medium on the pot, both parents kneeling, gripping and tipping it. */
const SH4_MED: Shot = { x: -60, y: 320, zoom: 1.7 };
/** Shots 5-6: close-up of Balak smiling inside the pot's mouth, the parents' heads leaning in above. */
const SH5_CU: Shot = frameAt(TODDLER_FACE, 1.95, [960, 505]);
/** Shot 7: Babukaka, relieved (his head averaged over his line, so the held frame suits the whole blessing). */
const SH7_BABU: Shot = (() => {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let a = 500; a <= 590; a += 6) {
    const h = babuHead(a);
    sx += h[0];
    sy += h[1];
    n++;
  }
  return frameAt([sx / n, sy / n], 1.6, [1090, 410]);
})();
/** Shot 8: the wide on the whole family around the tipped pot, held into the end. */
const SH8_WIDE: Shot = { x: -60, y: 212, zoom: 1.04 };

/* cue anchors, scene-local REAL frames (from EP02_CUES / the clip windows; fallbacks follow the authored beats) */
const C1 = cueReal("একদিন ঘরের", "বিশাল");
/** Shot 1: one slow push in, starting on "বিশাল চালের মটকি", settled before the rope snaps. */
const PUSH1_FROM = C1 ? C1.at : realOfStory(30);
const PUSH1_TO = Math.max(PUSH1_FROM + 24, Math.min(PUSH1_FROM + 44, realOfStory(ricePotStoryFrame(71)) - 3));
/** Shot 3: cut to the two-shot 7 frames before "বাবা-মা তো ভয়ে চিৎকার". */
const CUT3 = (cueReal("বাবা-মা")?.from ?? realOfStory(ricePotStoryFrame(168)) + 1) - 7;
/** Shot 4: cut on "কিন্তু মটকি তুলে দেখা গেল". */
const CUT4 = cueReal("কিন্তু মটকি")?.from ?? realOfStory(ricePotStoryFrame(248));
/** Shot 5: one slow push in to the close-up, starting on "শিশুটি" (about 4 s). */
const PUSH5_FROM = cueReal("শিশুটি")?.from ?? realOfStory(ricePotStoryFrame(311));
const PUSH5_LEN = 96;
/** Shot 6 ("গায়ে একটা আঁচড়ও লাগেনি"): same close-up, held; the extra close-up glow settles from here. */
const CUE6 = cueReal("আঁচড়ও")?.from ?? realOfStory(ricePotStoryFrame(423));
/** Shot 7: cut to Babukaka 7 frames before his line. */
const CUT7 = BABU_REAL - 7;
/** Shot 8: one slow pull back, starting on "আমার খোকা". */
const PULL8_FROM = cueReal("এত বড়", "আমার")?.at ?? BABU_REAL + 97;
const PULL8_LEN = 66;

/** The camera at real local frame R (no shake; the landing jolt is added on the story clock). */
const shotAt = (R: number): Shot => {
  if (R < CUT3) return blendShot(SH1_WIDE, SH1_MED, ease5((R - PUSH1_FROM) / (PUSH1_TO - PUSH1_FROM)));
  if (R < CUT4) return SH3_TWO;
  if (R < CUT7) return blendShot(SH4_MED, SH5_CU, ease5((R - PUSH5_FROM) / PUSH5_LEN));
  return blendShot(SH7_BABU, SH8_WIDE, ease5((R - PULL8_FROM) / PULL8_LEN));
};

/* ---------------- the pauses: what moves while the story holds ---------------- */

const P1 = PAUSES.find((p) => p.atStory === 0);
const P2 = PAUSES.find((p) => p !== P1 && p.atStory < P3_STORY);
const P3 = PAUSES.find((p) => p.atStory === P3_STORY);
/** Real frame where a pause begins, and its length. */
const pauseWin = (p: { atStory: number; frames: number } | undefined) => (p ? { from: realOfStory(p.atStory), frames: p.frames } : undefined);
const P1_WIN = pauseWin(P1);
const P2_WIN = pauseWin(P2);
const P3_WIN = pauseWin(P3);
/** Real frames into a pause (-1 outside it). */
const intoPause = (R: number, w: { from: number; frames: number } | undefined) => (w && R >= w.from && R < w.from + w.frames ? R - w.from : -1);

/**
 * P3: the parents look at each other (heads lift, the gaze goes across the pot), then back down at him, eyes wet
 * with relief; Charu's hand rests on her chest (her authored pose there). Blends out by the end of the pause.
 */
const withP3 = <P extends Partial<Pose>>(k: P, e: number, seed: number): P => {
  if (e < 0) return k;
  const w = ease5(e / 6) * (1 - ease5((e - 39) / 9));
  if (w <= 0) return k;
  const other = ease5((e - 2 - seed) / 9) * (1 - ease5((e - 20 - seed) / 9));
  const him = ease5((e - 23 - seed) / 9);
  const eyeY0 = k.eyeY ?? 0;
  const nod0 = k.headNod ?? 0;
  return {
    ...k,
    eyeY: lerp(eyeY0, lerp(lerp(eyeY0, -0.15, other), 0.45, him), w),
    headNod: nod0 + w * (-5 * other + 2 * him),
    smile: Math.max(k.smile ?? 0, 0.85 * w),
    tears: Math.max(k.tears ?? 0, 0.32 * w),
  };
};

/** Fright quickens the parents' breathing from the snap to the reveal (MOT-20); authored frames. */
const frightAt = (a: number) => track(a, [[72, 0], [88, 1], [336, 1], [372, 0]]);

/**
 * P2: the dust of the landing settles in the warm light round the covered pot (real frames e into the pause):
 * soft specks sink slowly and fade.
 */
const DustSettle: React.FC<{ e: number; frames: number }> = ({ e, frames }) => {
  if (e < 0) return null;
  const fadeIn = ease5(e / 8);
  const fadeOut = 1 - ease5((e - frames + 14) / 14);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: 22 }, (_, i) => {
        const x0 = POT_X + (hashN(i * 3.3 + 1) - 0.5) * 420;
        const y0 = FLOOR_Y - 260 + hashN(i * 7.1 + 2) * 200;
        const fall = (0.35 + 0.4 * hashN(i * 1.7 + 3)) * e;
        const drift = 6 * Math.sin(e * 0.06 + i);
        const r = 1.4 + 2.2 * hashN(i * 5.9 + 4);
        const o = (0.25 + 0.35 * hashN(i * 2.3 + 5)) * fadeIn * fadeOut;
        return <circle key={i} cx={x0 + drift} cy={Math.min(y0 + fall, FLOOR_Y - 4)} r={r} fill="#ffe2b0" opacity={o} />;
      })}
    </g>
  );
};

/* ---------------- sets ---------------- */

const Wall: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="s04-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7a4a2c" />
        <stop offset="100%" stopColor="#3a1e10" />
      </linearGradient>
      <linearGradient id="s04-day" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f6f2dc" />
        <stop offset="100%" stopColor="#a6d0c8" />
      </linearGradient>
    </defs>
    <rect x={-300} y={-40} width={2520} height={820} fill="url(#s04-wall)" />
    {Array.from({ length: 12 }, (_, i) => (
      <ellipse key={i} cx={-200 + hashN(i * 3.1) * 2300} cy={120 + hashN(i * 5.7) * 480} rx={50 + hashN(i * 7.3) * 120} ry={30 + hashN(i * 2.9) * 70} fill="#2a140a" opacity={0.18} />
    ))}
    <path d="M 1420 520 L 1420 300 Q 1540 200 1660 300 L 1660 520 Z" fill="url(#s04-day)" />
    <rect x={1420} y={440} width={240} height={80} fill="#5f9a9c" opacity={0.75} />
    <line x1={1540} y1={210} x2={1540} y2={520} stroke="#5a3a24" strokeWidth={8} />
    <line x1={1420} y1={390} x2={1660} y2={390} stroke="#5a3a24" strokeWidth={8} />
    <path d="M 1412 528 L 1668 528" stroke="#8a5a34" strokeWidth={10} />
    <rect x={110} y={560} width={320} height={200} rx={8} fill="#3e2014" />
    <path d="M 190 760 L 190 650 Q 265 600 340 650 L 340 760 Z" fill="#120603" />
    <Glow x={265} y={700} r={260} o={0.9} kind="warm" />
    <Flame x={230} y={745} s={1.1} f={f} seed={1} />
    <Flame x={272} y={750} s={1.4} f={f} seed={2} />
    <Flame x={316} y={744} s={0.9} f={f} seed={3} />
  </g>
);

/** Deterministic hash noise in [0,1) (local copy so the set does not depend on the pot code). */
const hashN = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

const Beam: React.FC = () => (
  <g>
    <rect x={-300} y={96} width={2520} height={44} fill="#3a2216" />
    <rect x={-300} y={138} width={2520} height={6} fill="#1a0c06" opacity={0.5} />
    <rect x={40} y={140} width={46} height={620} fill="#4a2a18" />
    <rect x={1800} y={140} width={46} height={620} fill="#4a2a18" />
    <circle cx={POT_X} cy={BEAM_Y} r={8} fill="#5a3a24" />
  </g>
);

const Floor: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="s04-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6a4630" />
        <stop offset="100%" stopColor="#2e1a10" />
      </linearGradient>
      <radialGradient id="s04-floorglow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#ffb860" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#ffb860" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="s04-babypool" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#ffcf8a" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#ffcf8a" stopOpacity={0} />
      </radialGradient>
    </defs>
    {/* the floor runs well below the frame, so the lowered framing of the reveal never shows its edge */}
    <rect x={-300} y={760} width={2520} height={740} fill="url(#s04-floor)" />
    {[800, 850, 920, 1010].map((y) => (
      <line key={y} x1={-300} y1={y} x2={2220} y2={y} stroke="#2a1808" strokeWidth={2} opacity={0.5} />
    ))}
    <ellipse cx={960} cy={900} rx={820} ry={170} fill="url(#s04-floorglow)" />
    {/* warm light pooled on the floor where the baby sits */}
    <ellipse cx={TODDLER_X} cy={FLOOR_Y + 6} rx={330} ry={110} fill="url(#s04-babypool)" />
    <Diya x={500} y={1000} s={1.2} f={f} seed={3} />
    <Diya x={1460} y={1010} s={1.1} f={f} seed={8} />
  </g>
);

const LightShaft: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="s04-shaft" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff0c0" stopOpacity={0.45} />
        <stop offset="100%" stopColor="#fff0c0" stopOpacity={0} />
      </linearGradient>
    </defs>
    <path d="M 1420 520 L 1660 520 L 1950 1080 L 1120 1080 Z" fill="url(#s04-shaft)" />
  </g>
);

/* ---------------- the child inside the pot (beat 5) ---------------- */

/** Mouth centre, and the child's seat on the rice inside, once the pot faces the viewer. */
const MOUTH_Y = FLOOR_Y - MOUTH_UP;
const IN_SCALE = 0.78;
const IN_SEAT_Y = FLOOR_Y - 60;
const IN_HEAD_Y = IN_SEAT_Y - 118 * (IN_SCALE / TODDLER_SCALE);

/** Rice grains lining the inside of the pot (fixed positions). */
const BED_GRAINS = Array.from({ length: 22 }, (_, i) => ({
  x: POT_X + (hashN(i * 2.7) - 0.5) * 200,
  y: FLOOR_Y - 70 + hashN(i * 4.3) * 30,
  a: hashN(i * 6.1) * 180,
}));

/**
 * Drawn as Matka's children (world coordinates, clipped to the mouth): a bed of spilled rice along
 * the pot's lower inside, the child's aura, the child seated on the rice, and grains by his hands.
 */
const BabyInPot: React.FC<{ f: number; lf: number; e: number; level: number; swell: number }> = ({ f, lf, e, level, swell }) => (
  <g>
    <Glow x={POT_X} y={IN_HEAD_Y + 10} r={150 + 40 * swell} o={0.5 + 0.4 * swell} kind="warm" />
    <ellipse cx={POT_X} cy={FLOOR_Y - 38} rx={124} ry={36} fill="#e9d6ae" />
    <ellipse cx={POT_X - 10} cy={FLOOR_Y - 48} rx={96} ry={22} fill="#f6ead0" opacity={0.85} />
    {BED_GRAINS.map((g, i) => (
      <ellipse key={`b${i}`} cx={g.x} cy={g.y} rx={3.4} ry={2.1} fill="#fffaf0" opacity={0.9} transform={`rotate(${g.a} ${g.x} ${g.y})`} />
    ))}
    {/* his halo stays the soft L1 glow (rule 1: no rays or rings), however bright the beat */}
    <DivineAura f={lf} x={POT_X} y={IN_HEAD_Y} level={Math.min(1, level)} s={0.85} />
    {/* he sits on the rice: wriggles, waves, kicks, pats and picks up grains, then grows serene */}
    <SittingBaby
      pose={potPose}
      f={f}
      lf={lf}
      e={e}
      ePats={P3_PATS}
      breathPeriod={lerp(40, 46, calmAt(f))}
      x={POT_X}
      y={IN_SEAT_Y}
      s={IN_SCALE}
      level={level + 0.3 * swell}
      uid="s04-babypot"
      pats={POT_PATS_R.map((at) => ({ at, side: 1 as const }))}
      drops={POT_DROPS}
    />
  </g>
);

/* ---------------- scene ---------------- */

export const Scene04RicePot: React.FC = () => {
  // three clocks: R real (life, camera, fades), f story (holds in the pauses), a authored (the choreography)
  const { f: storyF, lifeF: R } = useStory(SCENE_ID);
  const f = authoredOf(storyF);
  const e1 = intoPause(R, P1_WIN);
  const e2 = intoPause(R, P2_WIN);
  const e3 = intoPause(R, P3_WIN);

  // The floor baby and the hanging pot run on a pre-roll clock in the opening pause (P1): he pats the rice and the
  // pot turns a little on its rope while the story waits; it reaches 0 as the narration starts.
  const fb = e1 >= 0 && P1_WIN ? e1 - P1_WIN.frames : f;

  // camera: the approved shot list (shotAt, real frames keyed to the cues), plus the landing jolt on the story clock
  const joltT = f - LAND_AT;
  const jolting = joltT >= 0 && joltT < JOLT_FRAMES;
  const jolt = jolting ? 3 * Math.exp(-joltT / 1.8) * Math.cos(joltT * 2.3) : 0;
  const shot = shotAt(R);
  const cam = { x: shot.x, y: shot.y + jolt, zoom: shot.zoom, focus: 1, dof: 1.4, shake: jolting ? 1.0 : 0 };

  const pot = potAt(fb);
  const hanging = fb < ROPE_SNAP;
  const neckY = pot.y - ROPE_TIE;
  // the light under the rim keeps breathing on the life clock while the story holds (P2)
  const leak = pot.leak * (1 + 0.06 * Math.sin(R * 0.11));

  // divine glow on the toddler only: soft from the start, swelling warmly at the reveal (peak near the laugh) and
  // settling back; it lifts with the push in to his close-up and eases off during "not a scratch"; in the relief
  // pause (P3, a key beat) it brightens gently, then settles under the blessing
  const swell = track(f, [
    [REVEAL, 0],
    [388, 1, "out"],
    [460, 0, "inOut"],
  ]);
  const cuGlow = (R < CUT7 ? ease5((R - PUSH5_FROM) / PUSH5_LEN) : 0) * (1 - ease5((R - CUE6) / 40));
  const p3Glow = P3_WIN ? ease5((R - P3_WIN.from) / 22) * (1 - ease5((R - P3_WIN.from - P3_WIN.frames - 8) / 36)) : 0;
  const swellCU = Math.max(swell, 0.6 * cuGlow, 0.4 * p3Glow);
  // in the breathing hold after the narration the glow settles a little lower
  const bT = breathT(f);
  const settle = 0.5 - 0.5 * Math.cos(Math.PI * bT);
  const level =
    track(f, [
      [0, 0.8],
      [60, 1],
    ]) +
    0.35 * swell +
    0.2 * cuGlow +
    0.2 * p3Glow -
    0.08 * settle;
  const reveal = clamp((pot.mouthView - 0.3) / 0.5);

  // shared room lights (amber only)
  const roomLights: SceneLight[] = [
    { x: 265, y: 700, color: "#ffb04a", intensity: 0.9, radius: 1000, flicker: 5 },
    { x: 1540, y: 330, color: "#ffe2a0", intensity: 0.35, radius: 700 },
    { x: 960, y: 120, color: "#ffb04a", intensity: 0.5, radius: 1100, flicker: 9 },
  ];

  // Opening (chapter break, CAM-10): a slow fade in from black across the opening pause P1 onto the held wide, full
  // picture as the narration starts. Closing: the fade to dark ends where the picture stops being seen (VIS_END:
  // the outro's start, which overlaps this scene's last frames), 14 frames, fully dark on the last visible frame.
  const openLen = Math.max(18, (P1_WIN?.frames ?? 24) + 2);
  const openBlack = 1 - (0.5 - 0.5 * Math.cos(Math.PI * clamp(R / openLen)));
  const fade = clamp((VIS_END - 1 - R) / 14);
  // the reveal shimmer, on the real timeline where the pot's mouth turns to the viewer
  const shimmerAt = Math.max(0, realOfStory(ricePotStoryFrame(TURN_FROM + 15)));

  // the parents: story pose on the authored clock, life on the real clock; fright quickens their breathing, a sigh
  // of relief follows the reveal, and the relief pause (P3) adds the look between them
  const fright = frightAt(f);
  const babuActing = (fr: number) => withP3(babuPose(fr), e3, 0);
  const charuActing = (fr: number) => withP3(charuPose(fr), e3, 2);
  // Babukaka's lip sync runs on the story clock (his clip window from clipLocalStory)
  const babuMouth = (fr: number) => babuSpeech.mouth(ricePotStoryFrame(fr));
  const babuTalk = (fr: number) => babuSpeech.talk(ricePotStoryFrame(fr));

  return (
    <div style={{ position: "absolute", inset: 0, background: "#1c0f08", overflow: "hidden" }}>
      <Stage cam={cam} background="#1c0f08" opacity={fade}>
        <SceneLights.Provider value={roomLights}>
          <Layer depth={0.6}>
            <GlowDefs />
            <Wall f={R} />
          </Layer>
          <Layer depth={0.8}>
            <Beam />
          </Layer>
          <Layer depth={1}>
            <GlowDefs />
            <DivineDefs />
            <Floor f={R} />
            {/* the baby on the floor, under the hanging pot (hidden once the pot covers him) */}
            {babyOnFloor(fb) && (
              <g>
                <DivineAura f={R} x={TODDLER_X} y={TODDLER_HEAD_Y} level={Math.min(1, level)} s={1.1} />
                <SittingBaby
                  pose={floorPose}
                  f={fb}
                  lf={R}
                  blink={slowBlink(R, [9])}
                  x={TODDLER_X}
                  y={FLOOR_Y}
                  s={TODDLER_SCALE}
                  level={level}
                  uid="s04-babyfloor"
                  pats={FLOOR_PATS_L.map((at) => ({ at, side: -1 as const }))}
                  drops={FLOOR_DROPS}
                  mounds
                />
                <Motes f={R} x={TODDLER_X} y={FLOOR_Y - 140} n={10} spread={170} rise={120} seed={31} o={0.7 * level} />
              </g>
            )}
            {hanging && <line x1={POT_X} y1={BEAM_Y} x2={pot.x} y2={neckY - 6} stroke="#c9a06a" strokeWidth={5} strokeLinecap="round" />}
            {/* while he is covered, a soft warm pool of light spreads on the floor around the rim (behind the pot) */}
            {leak > 0.01 && (
              <g style={{ mixBlendMode: "screen" }}>
                <Glow x={POT_X} y={FLOOR_Y - 12} r={300} o={0.5 * leak} kind="warm" />
                <ellipse cx={POT_X} cy={FLOOR_Y + 4} rx={260} ry={46} fill="#ffcf7a" opacity={0.22 * leak} />
              </g>
            )}
            <Matka x={pot.x} y={pot.y} s={POT_S} f={fb} rot={pot.rot} mouthView={pot.mouthView} leak={leak} rice={pot.rice} dust={pot.dust}>
              {f >= TURN_FROM && <BabyInPot f={f} lf={R} e={e3} level={level} swell={swellCU} />}
            </Matka>
            {/* P2: the landing dust settles in the light round the covered pot */}
            <DustSettle e={e2} frames={P2_WIN?.frames ?? 48} />
            {/* warm light spilling out of the mouth, and motes rising from it */}
            {reveal > 0.01 && (
              <g>
                {/* the spill is held back over his face (a soft hole in it), so his features stay clear in the light */}
                <defs>
                  <radialGradient id="s04-spillhole">
                    <stop offset="0%" stopColor="#000" stopOpacity={0.7} />
                    <stop offset="55%" stopColor="#000" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#000" stopOpacity={0} />
                  </radialGradient>
                  <mask id="s04-spillmask" maskUnits="userSpaceOnUse" x={POT_X - 400} y={MOUTH_Y - 400} width={800} height={800}>
                    <rect x={POT_X - 400} y={MOUTH_Y - 400} width={800} height={800} fill="#fff" />
                    <ellipse cx={POT_X} cy={IN_HEAD_Y - 2} rx={62} ry={66} fill="url(#s04-spillhole)" />
                  </mask>
                </defs>
                <g mask="url(#s04-spillmask)">
                  <Glow x={POT_X} y={MOUTH_Y} r={210 + 80 * swellCU} o={(0.25 + 0.45 * swellCU) * reveal} kind="warm" />
                </g>
                <Motes f={R} x={POT_X} y={MOUTH_Y - 20} n={10} spread={130} rise={140} seed={37} o={0.65 * reveal * level} />
              </g>
            )}
            {/* the parents are drawn in front of the pot, so their hands sit on its flanks */}
            <Puppet
              cast={CAST.charu}
              f={f}
              lifeF={R}
              x={CHARU_X}
              y={1000}
              scale={CHARU_SCALE}
              acting={charuActing}
              breathRate={1 + 0.6 * fright}
              sigh={CHARU_SIGH}
              light={{ keySide: 1, rim: "#ffd98a", rimStrength: 0.4 }}
            />
            <Puppet
              cast={CAST.babukaka}
              f={f}
              lifeF={R}
              x={BABU_X}
              y={1000}
              scale={BABU_SCALE}
              acting={babuActing}
              mouth={babuMouth}
              talk={babuTalk}
              breathRate={1 + 0.6 * fright}
              sigh={BABU_SIGH}
              light={{ keySide: 1, rim: "#ffd98a", rimStrength: 0.4 }}
            />
          </Layer>
          <Layer depth={1.1} blend="screen">
            <LightShaft />
          </Layer>
          <Layer depth={1.3} blend="screen">
            <Bokeh f={R} n={14} seed={9} />
          </Layer>
          <Grade warmth={0.55 + 0.12 * swell} vignette={0.6} bloomAt={[48, 52]} flash={0.06 * swell} flashColor="#ffe2a8" />
        </SceneLights.Provider>
      </Stage>
      {/* chapter break: a slow fade in from black across the opening pause */}
      {openBlack > 0.001 && (
        <div style={{ position: "absolute", inset: 0, background: "#000", opacity: openBlack, pointerEvents: "none" }} />
      )}
      <Audio src={staticFile("audio/ambient/padma_river_day.wav")} loop volume={0.12} />
      <Sequence from={shimmerAt} durationInFrames={110} layout="none">
        <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={0.18} />
      </Sequence>
    </div>
  );
};

/** Sighs of relief (story/authored clock) as they see him unhurt: Charu first, then Babukaka. */
const CHARU_SIGH = (fr: number) => track(fr, [[340, 0], [348, 1], [358, 0]]);
const BABU_SIGH = (fr: number) => track(fr, [[344, 0], [352, 1], [362, 0]]);
