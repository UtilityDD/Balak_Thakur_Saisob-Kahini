import React from "react";
import { clamp, EaseName, hash, lerp, makeActing, noise1, track, windowed } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { BabyThakur, DivineDefs } from "../../cinematic/divine/Divine";
import { Bokeh, Diya, Glow, GlowDefs, Smoke } from "../../cinematic/fx/Fx";
import { CAST } from "../../cinematic/rig/cast";
import { bnSyllables, MOUTH_REST, MouthState } from "../../cinematic/rig/lipsync";
import { BASE_POSE, Pose, Puppet, PropRenderer, SceneLight } from "../../cinematic/rig/Puppet";
import { TulsiMancha } from "../../cinematic/sets/Interiors";
import { Khat } from "../../cinematic/sets/S06_Room";
import { AnimalPose, BaghaDog, Fox } from "../rig/Animals";
import { EP02_CUES } from "../subtitles";
import { EP02_SCENES } from "../timing";
import { absToStory, clipSpan, cueLocalStory, pausesFor, StoryPause, storyFrame, storyToReal, useStory } from "../../episode/storyClock";

/**
 * Episode 2 · scene 02_fox_and_bagha_dog. Camera and pauses per the approved plan (STO-16,
 * 03_Episodes/Episode_02_Shashthi_and_GoShaap/01_Script_and_Storyboard/Ep02_Shots_and_Pauses_DRAFT.md, "Scene 02"),
 * camera grammar CAM-13, pauses CAM-14 (2026-11-21 pass).
 *
 * CLOCKS. useStory gives the story clock (held in each pause) and lifeF (the real local frame). This scene acts on
 * one more clock, the ACTING clock `a` = the story clock with only pause P1 held: the approved moments of P2 (Bagha
 * barks once more and turns to the baby; cut to the kitchen, Charu hears, is frightened, the ladle slips) and of P3
 * (Charu's hand to her chest and a sigh of relief; Balak looks up at her, smiles and coos, his glow lifts gently) are
 * acted, so the acting clock runs through them. Every key below is in acting frames. Converters: aOf / lineA (story to
 * acting), storyOfA (acting to story; Charu's lip sync runs on the story clock), aToReal (acting to real, for the
 * animal rigs, which run on lifeF so they stay alive in P1). Rigs get lifeF for breathing, blinks and idle life.
 * All the anchors come from the narration cues (cueLocalStory) and Charu's clip window (clipSpan), so the camera and
 * the beats stay on the words when the timing changes. Acting frames at today's timing are given in brackets.
 *
 * Shots (all straight cuts, no whip-pans, no creeping push; STO-16):
 *  1 [0]    "একদিন মা রান্নাঘরে ব্যস্ত,": medium on Charu stirring at the hearth, held.
 *  2 [95]   "আর ঘর কেটে এক শেয়াল ঢুকে পড়েছে!": cut on the line to the low wide of the baby's room (the hole in the far wall
 *           and the khat in one frame), held while the fox scratches through and creeps in.
 *     P1    (24 f, the acting clock holds) the fox stops mid-room, low, sniffing; Balak turns his head to it, calm.
 *  3 [198]  "ঠিক তখনই বাড়ির বিশ্বস্ত কুকুর বাঘা": same wide, Bagha runs into the held frame from the left; a standoff.
 *  4 [279]  "ছুটে এসে শেয়ালকে তাড়িয়ে দিল!": same wide; he lunges [270], a short tussle (light handheld only here), the fox
 *           flees out through its hole [350].
 *     P2    (48 f) Bagha barks once more at the hole, turns and looks at the baby; cut [370] to the kitchen: Charu's
 *           head lifts, fright, the ladle slips; her breathing quickens.
 *  5 [392]  cut 6 f before "মা ছুটে এসে দেখেন—" [398] to the room seen from the khat toward the doorway: Charu hurries
 *           in through the doorway and across (slowing only in the last steps, stops at the khat [490]); Bagha trots
 *           back to his post left of the khat and sits, panting.
 *  6 [452]  cut on "ছোট্ট শিশুটি" to Balak's close-up, held; his smile widens and his glow lifts on "মিষ্টি হাসছে" [545].
 *     P3    (48 f, close-up held) Charu's hand comes to her chest with a sigh of relief; he looks up at her, smiles and
 *           coos; his glow brightens gently (a key beat).
 *  7 [636]  cut 7 f before "হায় ভগবান!" [643] to the medium two-shot from the khat side (she stands above him, then
 *           kneels on "ও আমার সোনা মানিক" [679]), held.
 *  8 [738]  one slow push in from "তোর মুখে এমন শান্ত হাসি" into the close two-shot of both faces (her hand on his
 *           chest), held through "প্রাণ ফিরে এল!" and the end hold (no ease back).
 *
 * Layout (world px, 1920 wide frame at zoom 1; screen x = (world x - 960 - cam.x) * zoom + 960):
 *  - Baby's room on the LEFT: khat at x 420, diyas on the ledge. Its right wall is the separating wall at x 1480-1560,
 *    with a doorway at x 1500-1550. Kitchen on the RIGHT (hearth pot at x 1770, Charu cooks at x 1930).
 *  - The fox breaks in through a hole it scratches low in the FAR wall of the room at HOLE_X 1270, well away from the
 *    kitchen, and leaves the same way. Charu never sees it; she only hears the fight.
 *
 * Conventions: the animal rigs face right when `flip` is false, left when true. `lean` is body lean in the facing
 * direction (+1 forward, -1 back). White-gold divine light only comes from BabyThakur (restrained, never pulsing);
 * everything else is diya, hearth or lamp light.
 */

/* ------------------------------------------------------------------ */
/* Timing: story, acting and real clocks, anchored on the narration      */
/* ------------------------------------------------------------------ */

const SID = "02_fox_and_bagha_dog";
const SCENE = EP02_SCENES.find((s) => s.sceneId === SID);
/** This scene's absolute start frame in Episode 2. */
const SCENE_START = SCENE?.startFrame ?? 0;
const PAUSES = pausesFor(SID);
/** P1 after "...ঢুকে পড়েছে!", P2 after "...তাড়িয়ে দিল!", P3 after "...মিষ্টি হাসছে!" (EP02_PAUSES; fallbacks = no pause). */
const P1: StoryPause = PAUSES[0] ?? { atStory: 198, frames: 0 };
const P2: StoryPause = PAUSES[1] ?? { atStory: 350, frames: 0 };
const P3: StoryPause = PAUSES[2] ?? { atStory: 540, frames: 0 };
/** The acting clock holds in P1 only; it runs through P2 and P3 (acted moments). */
const ACT_HELD: StoryPause[] = [P1];
const ACT_RUNS: StoryPause[] = [P2, P3];
/** Acting frame of a story frame (a pause's atStory maps to where that pause begins). */
const aOf = (story: number) => storyToReal(story, ACT_RUNS);
/** Acting frame where a line starting at story frame `story` plays (after a pause that sits on that frame). */
const lineA = (story: number) => storyToReal(story + 1, ACT_RUNS) - 1;
/** Story frame of an acting frame (holds during P2 and P3). */
const storyOfA = (a: number) => storyFrame(a, ACT_RUNS);
/** Real local frame of an acting frame (for the animal rigs, which run on lifeF). */
const aToReal = (a: number) => storyToReal(a, ACT_HELD);

const cueFrom = (snippet: string, fallback: number) => cueLocalStory(snippet, SID)?.from ?? fallback;
const cueTo = (snippet: string, fallback: number) => cueLocalStory(snippet, SID)?.to ?? fallback;
/** Narration anchors, acting frames [today]. */
const A_L2 = lineA(cueFrom("আর ঘর কেটে", 95)); // [95] the fox
const A_L3 = lineA(cueFrom("ঠিক তখনই", 198)); // [198] Bagha named
const A_L4 = lineA(cueFrom("দিল!", 279)); // [279] "ছুটে এসে শেয়ালকে তাড়িয়ে দিল!"
const A_L5 = lineA(cueFrom("মা ছুটে এসে", 350)); // [398] Charu came running
const A_L6 = lineA(cueFrom("ছোট্ট শিশুটি", 404)); // [452] Balak
const A_L6B = lineA(cueFrom("মিষ্টি হাসছে", 497)); // [545] sweet smile
/** Charu's clip 02b_Charu.wav (one part; no pause cuts it), story frames, scene-local. */
const CHARU_SPAN = clipSpan("02b_Charu.wav");
const CHARU_LINE_FROM = CHARU_SPAN ? absToStory(CHARU_SPAN.startFrame, SID) : 547;
const CHARU_LINE_TO = CHARU_SPAN ? absToStory(CHARU_SPAN.endFrame, SID) : 799;
const A_C1 = lineA(CHARU_LINE_FROM); // [643] "হায় ভগবান!"
const A_C2 = lineA(cueFrom("ও আমার সোনা", 583)); // [679] kneel
const A_C3 = lineA(cueFrom("তোর মুখে", 642)); // [738] push in, hand on his chest
const A_CEND = lineA(cueTo("প্রাণ ফিরে", 797)); // [893] her line ends
/** Pause starts in acting frames. */
const A_P1 = P1.atStory; // [198] (held)
const A_P2 = aOf(P2.atStory); // [350]
const A_P3 = aOf(P3.atStory); // [588]
/** Content end (24 f after her line, as authored) and the scene's length, in acting frames. */
const CONTENT_END = A_CEND + 24; // [917]
const DUR = Math.max(CONTENT_END, storyFrame(SCENE?.durationFrames ?? CONTENT_END, ACT_HELD)); // [965]
/** Extra frames of quiet breath after the content (0 when the timing has not grown). */
const BREATH = DUR - CONTENT_END;
/** 0..1: how much of the breath behaviour to apply (none without a breath, full from about 40 frames). */
const BREATH_AMT = Math.min(1, BREATH / 40);

/** The fox's entrance follows its line: the authored entrance (hole from 84) moved by FDT. */
const FDT = A_L2 - 75;
/** Bagha's lunge: 9 f before "ছুটে এসে শেয়ালকে তাড়িয়ে দিল!"; the fox is out through the hole 80 f later [350]. */
const T = A_L4 - 9;
/** Frame at which the fox turns to flee (facing right from here on). */
const FOX_FLEE = T + 36;
/** P2: Bagha barks once more (0-9), turns (DOG_TURN) and looks at the baby; cut to the kitchen at KIT_A. */
const DOG_TURN = A_P2 + 9;
const KIT_A = A_P2 + 20; // [370]
/** Cut back to the room 6 f before "মা ছুটে এসে দেখেন—"; Charu starts to hurry here. */
const ROOM_A = A_L5 - 6; // [392]
/** Charu hears the noise: her head lifts from H0 (just after the kitchen cut). */
const H0 = KIT_A + 1;
const HURRY = ROOM_A;
/** Charu stops stirring as her head lifts. */
const STIR_END = H0 + 6;

// Floor line raised so the animals stand clear of the subtitle strip at the bottom.
const GROUND = 900;
const BABY = { x: 420, y: 752 };
const BED_X = BABY.x;
const CHARU_X = 1970;
/** Hearth x in world px (the kitchen group is offset by KITCHEN_DX). */
const HEARTH_X = 1770;
const KITCHEN_DX = 370;
/** Separating wall (left edge and width) and doorway centre, in world px. */
const WALL_LEFT = 1480;
const WALL_W = 80;
const DOOR_X = 1525;
/** Hole the fox scratches low in the far (back) wall of the baby's room: centre x, full width and height, base y. */
const HOLE_X = 1270;
const HOLE_W = 150;
const HOLE_H = 128;
const HOLE_BASE = 902;
/** Clip boundary for the fox while it comes through: parts left of it are through the wall, the rest shows only in the hole. */
const HOLE_EDGE = HOLE_X - 20;
const DIYA_LEDGE_Y = 548;
/** Bagha's scale. */
const ANIMAL_S = 1.15;
/** Fox scale: the fox has a lighter build than Bagha, so it is drawn larger to hold its own in the frame. */
const FOX_S = 1.3;

const DIYAS: { x: number; s: number; seed: number }[] = [
  { x: 110, s: 1.05, seed: 21 },
  { x: 270, s: 1.0, seed: 22 },
  { x: 600, s: 1.05, seed: 23 },
  { x: 790, s: 1.1, seed: 24 },
];

/** Warm diya and hearth light for the cast (never the divine white-gold). */
const LIGHTS: SceneLight[] = [
  { x: 270, y: DIYA_LEDGE_Y, color: "#ffb45a", intensity: 0.5, radius: 560, flicker: 12 },
  { x: 600, y: DIYA_LEDGE_Y, color: "#ffb45a", intensity: 0.6, radius: 600, flicker: 3 },
  { x: 790, y: DIYA_LEDGE_Y, color: "#ffb45a", intensity: 0.55, radius: 560, flicker: 8 },
  { x: HEARTH_X, y: 720, color: "#ff9a3c", intensity: 0.9, radius: 460, flicker: 6 },
];

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: hash(i * 3.1 + 1) * 2300 - 190,
  y: hash(i * 7.7 + 2) * 440,
  r: 0.8 + hash(i * 1.3 + 5) * 1.5,
  seed: i,
}));

const TREES = [-150, 40, 230, 1700, 1870, 2040].map((x, i) => ({ x, r: 120 + hash(i + 4) * 60 }));

const smooth01 = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
/** Eased 0 -> 1 between frames a and b (smoothstep). */
const ramp = (f: number, a: number, b: number) => smooth01((f - a) / (b - a));
/** Sine in-out 0 -> 1 between frames a and b (slow, gentle start and stop). */
const sineRamp = (f: number, a: number, b: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp((f - a) / (b - a)));

/* ------------------------------------------------------------------ */
/* Camera: straight cuts keyed to the narration (CAM-13)                */
/* ------------------------------------------------------------------ */

interface Framing {
  x: number;
  y: number;
  zoom: number;
}
/** A face close-up: world-space face centre, zoom and the screen x where the face lands (default 960). */
interface FaceShot {
  x: number;
  y: number;
  zoom: number;
  sx?: number;
}
const faceFraming = (c: FaceShot): Framing => ({ x: c.x - 960 - ((c.sx ?? 960) - 960) / c.zoom, y: c.y - 540, zoom: c.zoom });

/** Shot 1: medium on Charu at the hearth. The left edge stays at the separating wall, so the room's hole never shows. */
const KITCHEN_MED: Framing = { x: 1250, y: 50, zoom: 1.28 };
/** Shots 2-4: low wide of the baby's room, the hole and the khat in one frame (camera lowered, slight upward tilt). */
const ROOM_LOW: Framing = { x: -400, y: 54, zoom: 1.04 };
const LOW_TILT_DEG = 1.6;
/** P2: Charu's face at the hearth (close). The left edge stays at the separating wall, so the hole never shows. */
const KITCHEN_CU = faceFraming({ x: 1931, y: 559, zoom: 1.9, sx: 900 });
/** Shot 5: the room from the khat toward the doorway (khat on the left, the doorway on the right). */
const DOORWAY: Framing = { x: -20, y: 10, zoom: 1.02 };
/** Shot 6: Balak's close-up on the khat. */
const BALAK_CU = faceFraming({ x: 365, y: 735, zoom: 1.85 });
/** Shot 7: medium two-shot from the khat side, Charu above, Balak below. */
const TWO_SHOT: Framing = { x: -500, y: 110, zoom: 1.3 };
/** Shot 8: close two-shot of both faces (Charu kneeling at about (486, 620), Balak at (372, 738)). */
const FACES_CU: Framing = faceFraming({ x: 432, y: 680, zoom: 1.5 });
/** Shot 8's slow push in: from her "তোর মুখে" cue, about 4.6 s. */
const PUSH_LEN = 110;
/** Light handheld during the tussle only (CAM-03), Stage gimbal amplitude. */
const TUSSLE_SHAKE = 0.42;

interface Shot {
  cam: Cam;
  /** Upward tilt of the framing in degrees (perspective keystone on the stage planes). */
  tilt: number;
}

/** Camera at acting frame a. Every cut sits on its narration cue; one move only (shot 8's push). */
function shotAt(a: number): Shot {
  const cam = (fr: Framing, extra: Partial<Cam> = {}): Cam => ({ x: fr.x, y: fr.y, zoom: fr.zoom, focus: 1, dof: 0.4, ...extra });
  if (a < A_L2) return { cam: cam(KITCHEN_MED), tilt: 0 };
  if (a < KIT_A) return { cam: cam(ROOM_LOW, { shake: TUSSLE_SHAKE * windowed(a, T, T + 46, 10) }), tilt: LOW_TILT_DEG };
  if (a < ROOM_A) return { cam: cam(KITCHEN_CU), tilt: 0 };
  if (a < A_L6) return { cam: cam(DOORWAY), tilt: 0 };
  if (a < A_C1 - 7) return { cam: cam(BALAK_CU), tilt: 0 };
  const w = sineRamp(a, A_C3, A_C3 + PUSH_LEN);
  return {
    cam: cam({ x: lerp(TWO_SHOT.x, FACES_CU.x, w), y: lerp(TWO_SHOT.y, FACES_CU.y, w), zoom: lerp(TWO_SHOT.zoom, FACES_CU.zoom, w) }),
    tilt: 0,
  };
}

/** Hearth flicker, about 0.66..0.98, in step with the flames (same 0.33 rhythm). */
const hearthFlicker = (f: number) => 0.76 + 0.12 * Math.abs(Math.sin(f * 0.33 + 0.4)) + 0.1 * noise1(f * 0.2, 41);

/** Cast lights for frame f: the hearth light flickers harder on Charu's face while she is in the kitchen. */
const lightsAt = (f: number): SceneLight[] =>
  LIGHTS.map((l) => (l.x === HEARTH_X ? { ...l, intensity: l.intensity * hearthFlicker(f) * 1.1 } : l));

/* ------------------------------------------------------------------ */
/* Fox and Bagha tracks (acting frames)                                 */
/* ------------------------------------------------------------------ */

/**
 * Fox: waits behind the far wall (hidden until the hole opens), pushes its nose and head through, squeezes out,
 * creeps toward the khat and stops mid-room on P1, sniffing. Bagha comes; it backs off, stands its ground, is caught
 * in a short tussle and flees back out through the hole, head first, tail last. It faces left until FOX_FLEE.
 */
const FOX_X_KEYS: Array<[number, number, EaseName?]> = [
  [0, 1450, "linear"], // behind the wall: its nose sits just right of the hole's centre
  [102 + FDT, 1450, "linear"], // scratching at the wall from the other side
  [124 + FDT, 1310, "out"], // nose, then the head push through the hole
  [134 + FDT, 1302, "linear"], // head out: a wary sniff
  [150 + FDT, 1170, "inOut"], // squeezes its body out
  [178 + FDT, 920, "inOut"], // creeps low toward the khat and stops mid-room (P1)
  [A_L3 + 18, 925, "linear"], // sniffing
  [A_L3 + 38, 985, "inOut"], // backs off as Bagha runs in
  [T - 16, 1010, "linear"], // stands its ground
  [T, 1010, "linear"],
  [T + 18, 1080, "out"], // dodges back from the lunge
  [T + 32, 1062, "inOut"], // tussle
  [T + 40, 1100, "in"], // breaks away, turning for the hole
  [T + 52, 1200, "inOut"], // scrambles to the hole; the head goes in
  [T + 66, 1330, "in"], // squeezes through, body and then the tail
  [T + 80, 1470, "linear"], // tail last: gone
  [T + 124, 1700, "linear"], // away behind the wall (always hidden by the clip)
];

/*
 * The clash: the fox rears back with its head up and turned away from Bagha (recoil, negative lean), while Bagha's
 * head comes in low at the fox's neck and chest; the two heads stay apart so both silhouettes read.
 */
const FOX_LEAN_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0.5],
  [102 + FDT, 0.6, "inOut"], // low at the hole
  [124 + FDT, 0.5, "inOut"],
  [134 + FDT, 0.4, "inOut"], // lifts its nose to sniff
  [150 + FDT, 0.7, "inOut"], // flattens to squeeze through
  [178 + FDT, 0.55, "inOut"], // creeping low
  [A_L3 + 18, 0.5, "inOut"],
  [A_L3 + 38, 0.15, "inOut"], // backs off
  [T - 16, 0.1, "inOut"],
  [T + 6, -0.35, "out"], // rears back as Bagha lunges
  [T + 18, -0.5, "out"], // recoil, nose high and away
  [T + 34, -0.45, "out"],
  [T + 37, 0.5, "out"], // turns to flee
  [T + 58, 0.6, "out"],
  [T + 70, 0.75, "inOut"], // flattens to squeeze out
  [T + 126, 0.6, "linear"],
];

const FOX_POSE_KEYS: Array<[number, AnimalPose]> = [
  [0, "idle"],
  [104 + FDT, "walk"], // pushes through the hole
  [124 + FDT, "idle"], // sniffs
  [134 + FDT, "walk"], // squeezes out and creeps
  [178 + FDT, "idle"], // stops mid-room (P1), sniffing
  [T + 2, "recoil"], // rears back from the lunge and keeps its head away through the tussle
  [T + 38, "flee"],
];

/**
 * Bagha, a strong village dog: runs in from the left edge on his name, slows into a low, braced stalk (a standoff),
 * lunges, a short tussle, drives the fox to the hole and barks at it; in P2 he barks once more, turns and looks at the
 * baby, then trots back to his post left of the khat and sits there, panting, on guard.
 */
const DOG_X_KEYS: Array<[number, number, EaseName?]> = [
  [0, -600], // off the left edge
  [A_L3 + 2, -600, "linear"],
  [A_L3 + 8, -540, "in"], // bursts in
  [A_L3 + 28, 340, "linear"], // running past the khat
  [A_L3 + 42, 560, "out"], // checks into a stalk, clear of the baby
  [T - 10, 610, "inOut"],
  [T, 640, "linear"], // braced, growling
  [T + 10, 730, "in"], // lunges
  [T + 22, 805, "out"], // contact: nose at the fox's chest, head below and behind the fox's raised head
  [T + 38, 795, "linear"], // tussle, held about 250 px behind the fox so the heads never merge
  [T + 50, 870, "inOut"], // drives the fox right
  [T + 66, 940, "inOut"], // chases it to the hole
  [A_P2 + 8, 935, "linear"], // barks at the hole, once more in P2
  [A_P2 + 24, 930, "linear"], // turned, looking at the baby
  [A_P2 + 36, 840, "in"], // trots back to the khat
  [A_P2 + 76, -60, "inOut"], // his post, left of the khat
  [Math.max(CONTENT_END, DUR), -60, "linear"],
];

const DOG_LEAN_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0],
  [A_L3 + 2, 0.1, "linear"],
  [A_L3 + 24, 0.5, "inOut"],
  [A_L3 + 40, 0.55, "inOut"], // low, braced stalk
  [T, 0.6, "inOut"],
  [T + 10, 0.7, "out"],
  [T + 24, 0.2, "out"],
  [T + 38, 0.45, "inOut"],
  [T + 62, 0.5, "inOut"],
  [T + 74, 0.35, "inOut"], // braced, barking at the hole
  [DOG_TURN, 0.3, "linear"],
  [A_P2 + 28, 0.1, "inOut"],
  [A_P2 + 40, 0.45, "inOut"], // trotting
  [A_P2 + 70, 0.25, "inOut"],
  [A_P2 + 84, 0, "inOut"],
  // breath: Bagha settles down to guard, his head lowering a little while he keeps watch
  ...(BREATH >= 24
    ? ([
        [CONTENT_END + 4, 0, "inOut"],
        [CONTENT_END + Math.min(36, BREATH - 4), 0.3, "inOut"],
      ] as Array<[number, number, EaseName?]>)
    : []),
];

const DOG_POSE_KEYS: Array<[number, AnimalPose]> = [
  [0, "idle"],
  [A_L3 + 2, "run"],
  [A_L3 + 40, "walk"], // the stalk
  [T, "lunge"],
  [T + 20, "bite"], // the snapping jaw reads as barking, at the fox and then at the hole
  [DOG_TURN, "idle"], // turned to the khat, looking at the baby
  [A_P2 + 30, "run"],
  [A_P2 + 80, "sit"], // on guard at his post, panting
];

/*
 * Balak's performance (BabyThakur), acting frames. Awake the whole scene (awake 1, a few natural blinks), calm and
 * curious through the fox and the fight: no fear, a faint, peaceful smile. His eyes (gaze, + looks screen-right) and
 * head (turn, headRoll around the supine -48) follow the fox and Bagha. P1: his head turns to the sniffing fox
 * (overlay in the scene). In his close-up the eyes are soft and forward, the smile widening on "মিষ্টি হাসছে". In P3
 * he looks up to his mother's face, smiles happily, coos, and waves and kicks with joy through her line.
 */
const BABY_GAZE_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0.1],
  [60 + FDT, 0.02, "inOut"], // looks about the room
  [90 + FDT, 0.55, "inOut"], // the scratching at the far wall
  [116 + FDT, 0.62, "inOut"],
  [134 + FDT, 0.6, "inOut"], // the fox's head through the hole
  [178 + FDT, 0.4, "inOut"], // it creeps toward the khat and stops
  [A_L3 + 14, 0.38, "inOut"],
  [A_L3 + 24, -0.4, "out"], // Bagha bursts in from the left
  [A_L3 + 40, 0.2, "inOut"], // ... and runs past him
  [T - 10, 0.35, "inOut"], // the standoff
  [T + 14, 0.45, "inOut"], // the clash
  [T + 36, 0.48, "inOut"],
  [T + 60, 0.7, "inOut"], // the fox scrambles back to the hole
  [A_P2, 0.62, "inOut"], // Bagha barks at the hole
  [DOG_TURN + 4, 0.52, "inOut"], // Bagha turns and looks at him
  [A_P2 + 44, 0.2, "inOut"], // Bagha trots back past him
  [A_P2 + 64, -0.3, "inOut"],
  [A_P2 + 82, -0.4, "inOut"], // Bagha settles at his post
  [A_L6 + 20, -0.05, "inOut"], // close-up: soft, forward, "not afraid at all"
  [A_L6B, 0.0, "inOut"],
  [A_P3 + 12, 0.0, "linear"],
  [A_P3 + 28, 0.6, "inOut"], // P3: finds his mother's face
  [A_C1 + 10, 0.55, "inOut"],
  [A_C3 - 20, 0.5, "inOut"],
  [A_C3 + 40, 0.57, "inOut"],
  [A_CEND - 10, 0.5, "inOut"],
  [CONTENT_END, 0.53, "inOut"],
  [Math.max(CONTENT_END + 1, DUR), 0.5, "inOut"],
];
/** Baby's vertical gaze (world, negative is up): down a touch to the hole and the animals, up to his mother's face. */
const BABY_LOOKY_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0],
  [90 + FDT, 0.12, "inOut"], // the hole is low on the far wall
  [178 + FDT, 0.15, "inOut"],
  [A_L3 + 24, 0.04, "inOut"],
  [T + 36, 0.12, "inOut"],
  [A_P2 + 10, 0.1, "inOut"],
  [A_P2 + 82, 0.08, "inOut"],
  [A_L6 + 20, -0.05, "inOut"],
  [A_P3 + 12, -0.05, "linear"],
  [A_P3 + 28, -0.36, "inOut"], // up at her face
  [CONTENT_END, -0.3, "inOut"],
  [Math.max(CONTENT_END + 1, DUR), -0.3, "inOut"],
];
/** Head turn (BabyThakur turn, + toward screen-right): a little toward the animals, more toward his mother. */
const BABY_TURN_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0.05],
  [92 + FDT, 0.25, "inOut"],
  [178 + FDT, 0.22, "inOut"],
  [A_L3 + 26, -0.15, "inOut"], // Bagha from the left
  [A_L3 + 44, 0.15, "inOut"],
  [T + 36, 0.3, "inOut"],
  [T + 66, 0.36, "inOut"],
  [DOG_TURN + 4, 0.28, "inOut"],
  [A_P2 + 64, -0.08, "inOut"],
  [A_P2 + 82, -0.2, "inOut"],
  [A_L6 + 22, 0.0, "inOut"],
  [A_P3 + 12, 0.0, "linear"],
  [A_P3 + 32, 0.46, "inOut"], // turns toward his mother
  [CONTENT_END, 0.42, "inOut"],
  [Math.max(CONTENT_END + 1, DUR), 0.42, "inOut"],
];
/** Head roll around the supine -48: lifted a little toward the right (the fox, his mother), tipped left for Bagha. */
const BABY_ROLL_KEYS: Array<[number, number, EaseName?]> = [
  [0, -48],
  [92 + FDT, -44, "inOut"],
  [178 + FDT, -45, "inOut"],
  [A_L3 + 26, -51, "inOut"],
  [A_L3 + 44, -46, "inOut"],
  [T + 66, -43, "inOut"],
  [DOG_TURN + 4, -44, "inOut"],
  [A_P2 + 82, -52, "inOut"],
  [A_L6 + 22, -48, "inOut"],
  [A_P3 + 12, -48, "linear"],
  [A_P3 + 34, -40, "inOut"], // lifts his face toward her
  [CONTENT_END, -41, "inOut"],
  [Math.max(CONTENT_END + 1, DUR), -42, "inOut"],
];

/** Smile: calm and faint through the fox (no fear), widening on "মিষ্টি হাসছে", happy as he finds his mother (P3). */
const BABY_SMILE_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0.32],
  [A_L6, 0.36, "inOut"],
  [A_L6B - 7, 0.38, "linear"],
  [A_L6B + 30, 0.65, "inOut"],
  [A_P3 + 14, 0.66, "linear"],
  [A_P3 + 40, 0.95, "inOut"], // a happy smile up at his mother as he finds her face
  [A_C1 + 93, 0.88, "inOut"],
  [A_CEND, 0.88, "linear"], // through her line: loving and playful (with a small live variation in the scene)
  [Math.max(CONTENT_END + 1, DUR), 0.74, "inOut"], // breath: a soft, content smile
];

/** Happy arm waving: a burst as he finds her (P3) and through "হায় ভগবান", then occasional waves, quiet in the breath. */
const BABY_WAVE_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0],
  [A_P3 + 20, 0, "linear"],
  [A_P3 + 42, 0.8, "inOut"],
  [A_C1 + 30, 0.72, "inOut"],
  [A_C1 + 70, 0.3, "inOut"],
  [CONTENT_END, 0.26, "inOut"],
  [Math.max(CONTENT_END + 1, DUR), 0.08, "inOut"],
];
/** Happy leg kicking: with the waving, then occasional kicks, and small kicks now and then in the breath. */
const BABY_KICK_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0],
  [A_P3 + 22, 0, "linear"],
  [A_P3 + 46, 0.75, "inOut"],
  [A_C1 + 34, 0.65, "inOut"],
  [A_C1 + 72, 0.28, "inOut"],
  [CONTENT_END, 0.22, "inOut"],
  [Math.max(CONTENT_END + 1, DUR), 0.12, "inOut"],
];
/** Raised-cosine bump: 1 at frame c, 0 beyond +-w frames. */
const bump = (f: number, c: number, w: number) => {
  const t = (f - c) / w;
  return Math.abs(t) < 1 ? 0.5 + 0.5 * Math.cos(Math.PI * t) : 0;
};
/** Occasional extra waves through her line: [frame, half-width, amount]. */
const WAVE_BUMPS: Array<[number, number, number]> = [
  [A_C1 + 127, 22, 0.45],
  [A_C1 + 183, 24, 0.5],
  [A_C1 + 239, 20, 0.4],
];
/** Occasional kicks through her line and in the breath. */
const KICK_BUMPS: Array<[number, number, number]> = [
  [A_C1 + 155, 20, 0.45],
  [A_C1 + 215, 20, 0.4],
  [CONTENT_END + 16, 14, 0.45],
  [CONTENT_END + 38, 12, 0.38],
];
/** Happy coos (a rounded, smiling "o"): as he finds his mother in P3, and now and then through her line and the breath. */
const COO_BUMPS: Array<[number, number, number]> = [
  [A_P3 + 36, 10, 0.85],
  [A_C1 + 42, 9, 0.55],
  [A_C1 + 121, 10, 0.55],
  [A_C1 + 189, 10, 0.6],
  [A_C1 + 259, 10, 0.5],
  [CONTENT_END + 26, 10, 0.4],
];
/** Natural blinks on top of the rig's own slow ones (each about 7 frames), never on a startle beat. */
const BLINKS = [128 + FDT, T + 64, A_P3 + 6, A_C1 + 153, CONTENT_END + 28];
const bumps = (f: number, list: Array<[number, number, number]>) => list.reduce((s, [c, w, a]) => s + a * bump(f, c, w), 0);

/** Restrained halo: never below 0.5, a calm rise toward her line; key-beat lifts are added in the scene. */
const BABY_AURA_FLOOR = 0.5;
const BABY_AURA_KEYS: Array<[number, number, EaseName?]> = [
  [0, 0.5],
  [A_L6B, 0.5, "linear"],
  [A_P3, 0.55, "inOut"],
  [CONTENT_END, 0.6, "inOut"],
  [Math.max(CONTENT_END + 1, DUR), 0.6, "linear"],
];

/**
 * Charu (acting frames): cooks at the hearth in the kitchen and never sees the fox. In P2, on the kitchen cut, she
 * hears the noise: the stirring stops and her head lifts (H0), she listens, then a frightened reaction as the ladle
 * slips from her hand; her breathing quickens (breathRate). From the room cut (6 f before "মা ছুটে এসে") she hurries
 * through the doorway and across the room, still frightened, slowing only in the last steps to stop at the khat. She
 * looks down at him, breathless; on "মিষ্টি হাসছে" wonder dawns. P3: her hand comes to her chest with a sigh of relief.
 * She kneels on "ও আমার সোনা মানিক" and lays her hand on his chest on "তোর মুখে এমন শান্ত হাসি দেখে আমার".
 * Gestures start about 7 frames before their cue (key = motion start + `in`). The arm joints lag 2 to 4.5 frames
 * behind (JOINT_OFFSET). Positive arm angles swing outward (forward), negative inward. Her ladle is in the LEFT hand.
 * At the khat she faces LEFT (the baby is on her left); hand targets are solved with armReach below.
 */

/* Charu's arm solve (body units, before the 1.12 scale). Puppet.tsx, Charu (height 0.95): upper arm 53.2, elbow to
 * the middle of the palm about 62, torso 102.6, limbW 8.4. Standing hipY -154.4; kneeling at crouch 0.9 the leg
 * solve puts the hips at -97.1. The arm root is at (side * 0.86 * sw * cos(0.95 * bodyTurn), hipY - torso + limbW),
 * and the upper body (arms included) is rotated by `lean` degrees about (0, hipY). */
const ARM_UA = 53.2;
const ARM_FA = 62;
const TORSO_LEN = 102.6;
const LIMB_W = 8.4;
const STAND_HIP_Y = -154.4;
const KNEEL_HIP_Y = -97.1;
/** Kneeling spot: she stops at x 540 and settles a little closer as she kneels, so her hand reaches the baby. */
const STOP_BODY_X = -1430;
const KNEEL_BODY_X = -1465;
const KNEEL_LEAN = -6;

/**
 * Two-link arm solve for a hand target (world px) on Charu. Returns the rig angles for that side, with the elbow
 * bent the natural way for a figure facing left (elbow back and down, never locked straight).
 */
const armReach = (
  side: 1 | -1,
  bodyX: number,
  hipY: number,
  lean: number,
  wx: number,
  wy: number,
): { S: number; E: number } => {
  const tx = (wx - (CHARU_X + bodyX)) / 1.12;
  const ty = (wy - GROUND) / 1.12;
  const cphi = Math.cos(0.95);
  const a = (lean * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  // shoulder after the lean (rotation about the hip)
  const rx = side * 0.86 * 44.65 * cphi;
  const ry = -TORSO_LEN + LIMB_W;
  const sx = rx * ca - ry * sa;
  const sy = hipY + rx * sa + ry * ca;
  // target from the shoulder, in the torso frame (lean undone)
  const dx = tx - sx;
  const dy = ty - sy;
  const vx = dx * ca + dy * sa;
  const vy = -dx * sa + dy * ca;
  const d = Math.min(ARM_UA + ARM_FA - 4, Math.max(Math.abs(ARM_UA - ARM_FA) + 1, Math.hypot(vx, vy)));
  // angles from straight down, positive toward screen left
  const thT = Math.atan2(-vx, vy);
  const al = Math.acos(clamp((ARM_UA * ARM_UA + d * d - ARM_FA * ARM_FA) / (2 * ARM_UA * d), -1, 1));
  const thU = thT - al; // elbow on the right of the line: behind her, as she faces left
  const k = d / Math.max(1e-6, Math.hypot(vx, vy));
  const ex = -ARM_UA * Math.sin(thU);
  const ey = ARM_UA * Math.cos(thU);
  const thF = Math.atan2(-(vx * k - ex), vy * k - ey);
  const u = (thU * 180) / Math.PI;
  let rel = ((thF - thU) * 180) / Math.PI;
  rel = ((((rel + 180) % 360) + 360) % 360) - 180;
  return side > 0 ? { S: -u, E: -rel } : { S: u, E: rel };
};

/** Right hand cupped on her own chest (standing at the khat). */
const CHEST_R = armReach(1, STOP_BODY_X, STAND_HIP_Y, 0, CHARU_X + STOP_BODY_X - 13, GROUND + 222 * -1.12);
/** Right hand coming in over the baby, then resting gently on his chest. */
const REACH_R = armReach(1, KNEEL_BODY_X, KNEEL_HIP_Y, -3, 432, 728);
const REST_R = armReach(1, KNEEL_BODY_X, KNEEL_HIP_Y, KNEEL_LEAN, 416, 744);
const HOLD_R = armReach(1, KNEEL_BODY_X, KNEEL_HIP_Y, KNEEL_LEAN + 0.5, 419, 745);
/** Left hand resting on the edge of the khat's mattress, beside her knee. */
const KHAT_L = armReach(-1, KNEEL_BODY_X, KNEEL_HIP_Y, KNEEL_LEAN, 442, 777);

const charuPose = makeActing<Pose>(BASE_POSE, [
  // at the hearth, from behind: body at the rig's maximum turn to the left, ladle in the left hand reaching the pot
  { f: 0, bodyX: -40, bodyTurn: -1, headTurn: -0.3, headNod: 8, eyeX: -0.5, eyeY: 0.6, smile: 0.2, lean: 0.25, crouch: 0, rS: -8, rE: -30, rHand: "relaxed", rProp: "", lS: 40, lE: 20, lHand: "hold", lProp: "ladle", stride: 0 },
  // bends to tend the fire under the pot, eyes still on the pot
  { f: 40, lean: 0.6, headNod: 16, eyeY: 0.8, in: 22 },
  { f: 64, crouch: 0, lean: 0.25, headNod: 8, eyeY: 0.6, in: 22 },
  // wipes her brow with the end of her sari (right hand)
  { f: 80, rS: -140, rE: -100, rHand: "open", lean: 0.12, headTurn: -0.2, eyeY: -0.1, brow: 0.25, smile: 0.1, ease: "out", in: 14 },
  { f: 100, rS: -8, rE: -30, rHand: "relaxed", lean: 0.25, headTurn: -0.5, eyeY: 0.6, brow: 0, smile: 0.2, in: 16 },
  // lifts the lid of the pot with the right hand and looks in
  { f: 116, rS: -60, rE: 10, rHand: "open", headNod: 16, lean: 0.3, in: 18 },
  { f: 136, rS: -8, rE: -30, rHand: "relaxed", headNod: 8, headTurn: -0.3, lean: 0.25, in: 18 },
  // she never sees the fox; she keeps stirring (off screen) until P2. Hears it on the kitchen cut: the stirring fades
  // out and her head lifts (H0 to H0 + 6), turning a little toward the room on her left, eyes sliding that way.
  { f: H0 + 6, headNod: -2, headTurn: -0.55, eyeX: -0.7, eyeY: -0.1, brow: 0.3, smile: 0, lean: 0.18, ease: "out", in: 6 },
  // listens, still: the head tilts a touch further toward the noise
  { f: H0 + 9, headNod: -3, headTurn: -0.65, eyeX: -0.8, brow: 0.42, browTilt: 0.15, ease: "inOut", in: 3 },
  // frightened: the eyes widen, the mouth opens, the brows lift and draw together, the hand presses to the chest and
  // the ladle slips from the other hand
  { f: H0 + 17, lS: 30, lE: -40, lHand: "open", lProp: "", stride: 0, eyeX: -0.9, eyeY: -0.1, brow: 1.0, browTilt: 0.7, gasp: 0.5, headTurn: -1, headNod: 6, smile: 0, lean: 0.3, rS: 34, rE: 104, rHand: "cup", rProp: "", ease: "out", in: 8 },
  { f: HURRY },
  // she runs ("মা ছুটে এসে"): to the doorway and through it, the hands leaving her chest as she runs
  { f: HURRY + 20, bodyX: -445, stride: 1, lean: 0.4, rS: 6, rE: -8, rHand: "relaxed", lS: 6, lE: -8, lHand: "relaxed", in: 20, ease: "linear" },
  // across the room, the arm coming down as she runs
  { f: HURRY + 68, bodyX: -1180, stride: 1, lean: 0.38, rS: 6, rE: -8, rHand: "relaxed", lS: 6, lE: -8, lHand: "relaxed", in: 48, ease: "linear" },
  // slows only in the last steps and stops at the khat (x 540)
  { f: HURRY + 98, bodyX: STOP_BODY_X, stride: 0, lean: 0.2, headNod: 10, in: 30, ease: "out" },
  // breathless, looking down at him
  { f: HURRY + 130, lean: 0.12, headNod: 12, in: 30 },
  { f: A_L6B + 20, lean: 0.16, headNod: 14, in: 30 },
  // P3: her hand comes to her chest (relief), solved so the elbow stays down and back
  { f: A_P3 + 28, rS: CHEST_R.S, rE: CHEST_R.E, rHand: "cup", headNod: 14, lean: 0.1, in: 16, ease: "inOut" },
  // hold through "হায় ভগবান!", so the kneel below has its own start key
  { f: A_C2 - 7 },
  // kneels on "ও আমার সোনা মানিক," (starts 7 frames before the cue), settling a little closer to the khat; the arms
  // return to rest as she sinks. The kneel holds to the end of the scene.
  { f: A_C2 + 20, bodyX: KNEEL_BODY_X, crouch: 0.9, lean: 0.2, headNod: 10, headTurn: -0.7, eyeX: -0.3, eyeY: 0.5, smile: 0.3, rS: 6, rE: -8, rHand: "relaxed", rProp: "", lS: 6, lE: -8, lHand: "relaxed", lProp: "", in: 27, ease: "inOut" },
  // reaches toward the baby on "তোর মুখে এমন শান্ত হাসি দেখে আমার" (starts 7 frames before the cue): she bows a little,
  // the right hand comes in over his chest, the left goes to the khat's edge
  { f: A_C3 + 7, rS: REACH_R.S, rE: REACH_R.E, rHand: "open", lean: -3, headNod: 16, eyeY: 0.65, in: 14, ease: "inOut" },
  // the right hand settles gently on the baby's chest; the left rests on the edge of the khat
  { f: A_C3 + 29, rS: REST_R.S, rE: REST_R.E, rHand: "relaxed", lS: KHAT_L.S, lE: KHAT_L.E, lHand: "relaxed", lean: KNEEL_LEAN, eyeY: 0.75, headNod: 18, in: 30, ease: "inOut" },
  { f: A_C3 + 53, rS: HOLD_R.S, rE: HOLD_R.E, lean: KNEEL_LEAN + 0.5, headNod: 19, in: 24, ease: "inOut" },
  // Without a breath: back to rest. With a breath after the scene the hands stay where they are (right hand on
  // Balak's chest, left on the khat) and she lingers there to the end.
  ...(BREATH > 0
    ? [
        { f: A_C3 + 129, rS: HOLD_R.S, rE: HOLD_R.E, lean: KNEEL_LEAN + 0.5, headNod: 18, eyeY: 0.7, in: 30, ease: "inOut" as const },
        { f: A_C3 + 148, headNod: 17, in: 40 },
      ]
    : [
        { f: A_C3 + 129, rS: 6, rE: -8, rHand: "relaxed" as const, lS: 6, lE: -8, lHand: "relaxed" as const, lean: 0.2, headNod: 10, eyeY: 0.55, in: 30, ease: "inOut" as const },
        { f: A_C3 + 148, rS: 6, rE: -8, headNod: 8, smile: 0.4, tears: 0.35, in: 40 },
      ]),
]);

/*
 * Charu's face, layered over the body acting (charuAct takes these fields from here; the face values in the keys
 * above are superseded). The rig keeps her body at its maximum turn left (bodyTurn -1, about -0.95 rad of yaw) for
 * the arm solves, so the face yaw is set through headTurn: yaw = -0.95 + 1.15 * headTurn. headTurn 0.15 is a
 * three-quarter view looking left at the pot, 0.4 to 0.5 turns her face well toward the camera.
 * eyeX / eyeY are where she looks in the world (negative x is left, toward the room and the khat; positive y down).
 */
const charuFace = makeActing<Pose>(BASE_POSE, [
  // cooking: busy and calm, a soft contented look, eyes on the pot
  { f: 0, headTurn: 0.17, headTilt: 0, eyeX: -0.6, eyeY: 0.6, brow: 0, browTilt: 0, smile: 0.28, gasp: 0, tears: 0, cheeks: 0.1, flush: 0, lid: 0.08 },
  { f: 40, headTurn: 0.1, eyeY: 0.8, smile: 0.22, in: 22, ease: "inOut" }, // bends to the fire
  { f: 64, headTurn: 0.18, eyeY: 0.6, smile: 0.28, in: 22, ease: "inOut" },
  // wipes her brow: the face turns toward the camera for a moment, a little tired, a small breath of a smile
  { f: 80, headTurn: 0.38, eyeX: -0.25, eyeY: -0.05, brow: 0.22, lid: 0.22, smile: 0.18, in: 14, ease: "inOut" },
  { f: 100, headTurn: 0.16, eyeX: -0.6, eyeY: 0.6, brow: 0, lid: 0.08, smile: 0.32, in: 16, ease: "inOut" },
  // lifts the lid and looks in
  { f: 116, headTurn: 0.12, eyeY: 0.78, brow: 0.12, smile: 0.24, in: 18, ease: "inOut" },
  { f: 136, headTurn: 0.2, eyeY: 0.6, brow: 0, smile: 0.3, in: 18, ease: "inOut" },
  { f: H0 - 3, headTurn: 0.16, smile: 0.28, in: 30, ease: "inOut" },
  // hears it (P2, kitchen cut): alert, the head lifts and turns toward the camera and the room, brows up, eyes wide
  { f: H0 + 6, headTurn: 0.5, eyeX: -0.8, eyeY: -0.1, brow: 0.62, browTilt: 0.05, gasp: 0.18, smile: 0, lid: 0, cheeks: 0, in: 6, ease: "out" },
  // listens
  { f: H0 + 9, headTurn: 0.44, headTilt: 3, eyeX: -0.9, brow: 0.72, browTilt: 0.2, gasp: 0.22, in: 3, ease: "inOut" },
  // frightened: brows lift and draw together, the mouth opens, face still readable
  { f: H0 + 17, headTurn: 0.3, headTilt: 0, eyeX: -0.95, eyeY: -0.05, brow: 0.85, browTilt: 0.85, gasp: 0.62, in: 8, ease: "out" },
  { f: HURRY },
  // runs to the doorway, frightened, looking where she is going
  { f: HURRY + 20, headTurn: 0.12, eyeX: -0.9, eyeY: 0.1, brow: 0.7, browTilt: 0.85, gasp: 0.48, in: 20, ease: "inOut" },
  // across the room, her eyes on the baby, the first tears
  { f: HURRY + 68, headTurn: 0.2, eyeX: -0.75, eyeY: 0.35, brow: 0.62, browTilt: 0.75, gasp: 0.4, tears: 0.1, in: 40, ease: "inOut" },
  // stops at the khat and sees him calm: the fright gives way to disbelief
  { f: HURRY + 110, headTurn: 0.3, eyeX: -0.72, eyeY: 0.55, brow: 0.55, browTilt: 0.55, gasp: 0.3, tears: 0.2, in: 24, ease: "out" },
  { f: HURRY + 140, headTilt: 2, brow: 0.5, browTilt: 0.45, gasp: 0.24, tears: 0.25, in: 28, ease: "inOut" },
  // "মিষ্টি হাসছে": wonder, the face turning toward the camera as she looks down at him
  { f: A_L6B + 20, headTurn: 0.36, headTilt: 0, eyeX: -0.72, eyeY: 0.58, brow: 0.58, browTilt: 0.32, gasp: 0.26, smile: 0.12, tears: 0.28, in: 24, ease: "inOut" },
  // P3: relief (hand to chest, the sigh), a first small smile
  { f: A_P3 + 30, brow: 0.45, browTilt: 0.3, gasp: 0.14, smile: 0.24, tears: 0.36, lid: 0.14, in: 22, ease: "inOut" },
  // "হায় ভগবান!": wonder, a soft gasp, tears welling
  { f: A_C1 + 9, brow: 0.62, browTilt: 0.5, gasp: 0.34, smile: 0.16, tears: 0.38, in: 12, ease: "inOut" },
  // kneels on "ও আমার সোনা মানিক": melting into tender love, soft eyes, a gentle smile, three-quarters to camera
  { f: A_C2 + 20, headTurn: 0.4, headTilt: -3, eyeX: -0.75, eyeY: 0.62, brow: 0.22, browTilt: 0.35, gasp: 0.04, smile: 0.55, tears: 0.4, cheeks: 0.35, flush: 0.2, lid: 0.16, in: 27, ease: "inOut" },
  // her line: a small tearful happiness
  { f: A_C3 + 18, headTilt: -4, smile: 0.62, tears: 0.45, cheeks: 0.45, lid: 0.2, in: 24, ease: "inOut" },
  { f: A_C3 + 78, brow: 0.3, browTilt: 0.32, smile: 0.7, tears: 0.5, in: 40, ease: "inOut" },
  { f: A_C3 + 148, headTurn: 0.38, brow: 0.2, browTilt: 0.28, smile: 0.62, tears: 0.42, lid: 0.2, in: 40, ease: "inOut" },
  // breath: she stays with him, a quiet loving smile
  ...(BREATH > 0 ? [{ f: Math.max(CONTENT_END + 10, DUR - 6), headTilt: -3, smile: 0.6, tears: 0.38, in: 60, ease: "inOut" as const }] : []),
]);
/** The face fields charuFace drives. */
const FACE_KEYS = ["headTurn", "headTilt", "eyeX", "eyeY", "brow", "browTilt", "smile", "gasp", "tears", "cheeks", "flush", "lid"] as const;

/** Breathing rate (MOT-20): quick from her fright through the run and the first sight of him, calm after the sigh. */
const charuBreathRate = (a: number) => 1 + 0.6 * ramp(a, H0 + 9, H0 + 19) * (1 - ramp(a, A_P3 + 26, A_P3 + 72));
/** Sigh of relief in P3, as her hand comes to her chest (Puppet sigh envelope, acting clock). */
const charuSigh = (a: number) => bump(a, A_P3 + 24, 8);

/* ------------------------------------------------------------------ */
/* Charu's lip sync (story clock)                                       */
/* ------------------------------------------------------------------ */

/** Her phrases (subtitle cues with speaker চারুশীলা inside the clip window), in story frames, clamped to the clip. */
const CHARU_PHRASES: { from: number; to: number; text: string }[] = (() => {
  if (!CHARU_SPAN) return [];
  const cues = EP02_CUES.filter(
    (c) => c.speaker === "চারুশীলা" && c.to > CHARU_SPAN.startFrame && c.from < CHARU_SPAN.endFrame,
  ).map((c) => ({
    from: Math.max(CHARU_LINE_FROM, absToStory(c.from, SID)),
    to: Math.min(CHARU_LINE_TO, absToStory(c.to, SID)),
    text: c.text,
  }));
  return cues.length ? cues : [{ from: CHARU_LINE_FROM, to: CHARU_LINE_TO, text: "" }];
})();

/** Mouth shapes per vowel (the same 7-state set as lipsync.ts). */
const CHARU_VISEMES: Record<string, MouthState> = {
  A: { open: 1, width: 1.05, round: 0.1, teeth: 0.6 },
  E: { open: 0.6, width: 1.22, round: 0, teeth: 0.85 },
  I: { open: 0.38, width: 1.26, round: 0, teeth: 0.9 },
  O: { open: 0.82, width: 0.78, round: 0.8, teeth: 0.2 },
  U: { open: 0.42, width: 0.64, round: 0.95, teeth: 0 },
  MBP: { open: 0.12, width: 0.94, round: 0.12, teeth: 0 },
};
/** Ease in / out length (frames) at each phrase edge, and the closed beat left at the end of each phrase. */
const LIP_EASE = 2.5;
const LIP_GAP = 2.5;
/** Phrase gate, 0..1 (story frames): open for speech inside each phrase, eased in and out, closed at the gaps. */
const phraseGate = (fr: number): { w: number; i: number } => {
  if (fr < CHARU_LINE_FROM || fr >= CHARU_LINE_TO) return { w: 0, i: -1 };
  for (let i = 0; i < CHARU_PHRASES.length; i++) {
    const c = CHARU_PHRASES[i];
    if (fr >= c.from && fr < c.to) {
      const end = c.to - LIP_GAP;
      return { w: sineRamp(fr, c.from, c.from + LIP_EASE) * (1 - sineRamp(fr, end - LIP_EASE, end)), i };
    }
  }
  return { w: 0, i: -1 };
};
/**
 * Syllable phase: about 5.5 syllables a second, wandering irregularly between about 4 and 7 Hz. Each whole cycle is
 * one syllable: the mouth opens to the vowel and comes back nearly closed at the trough.
 */
const sylPhase = (fr: number) => (2 * Math.PI * 5.5 * fr) / 24 + 2.0 * noise1(fr * 0.06, 401) + 0.9 * noise1(fr * 0.13, 402);
/**
 * Charu's mouth while 02b_Charu.wav plays (story frames): phrase by phrase from her subtitle cues, the jaw opening and
 * closing at syllable rate with irregular size, each syllable taking its vowel shape from the Bangla text of the
 * phrase (lip consonants close the lips at the onset). Closed (MOUTH_REST) outside the clip.
 */
const charuMouthStory = (fr: number): MouthState => {
  const g = phraseGate(fr);
  if (g.w <= 0.001) return MOUTH_REST;
  const c = CHARU_PHRASES[g.i];
  const ph = sylPhase(fr);
  const k = Math.floor(ph / (2 * Math.PI));
  const frac = ph / (2 * Math.PI) - k;
  // syllable index inside this phrase, mapped onto the text's syllables
  const k0 = Math.floor(sylPhase(c.from) / (2 * Math.PI));
  const k1 = Math.max(k0 + 1, Math.floor(sylPhase(c.to - LIP_GAP) / (2 * Math.PI)));
  const syl = bnSyllables(c.text);
  const at = (kk: number) => {
    if (!syl.length) return { v: ["A", "O", "E", "A", "I", "O"][Math.floor(hash(kk * 3.7 + 9) * 6)], labial: false };
    const idx = Math.min(syl.length - 1, Math.max(0, Math.floor(((kk - k0) * syl.length) / (k1 - k0))));
    return syl[idx];
  };
  const cur = at(k);
  const prev = at(k - 1);
  const sCur = CHARU_VISEMES[cur.v] ?? CHARU_VISEMES.A;
  const sPrev = CHARU_VISEMES[prev.v] ?? CHARU_VISEMES.A;
  // shape cross-blends early in the cycle, while the mouth is still nearly closed
  const t = smooth01(frac / 0.35);
  const shape: MouthState = {
    open: lerp(sPrev.open, sCur.open, t),
    width: lerp(sPrev.width, sCur.width, t),
    round: lerp(sPrev.round, sCur.round, t),
    teeth: lerp(sPrev.teeth, sCur.teeth, t),
  };
  // syllable pulse: 0 at the trough, 1 at the vowel; a lip consonant presses the lips shut at the onset
  let cyc = Math.pow(0.5 - 0.5 * Math.cos(2 * Math.PI * frac), 0.85);
  if (cur.labial) cyc *= smooth01((frac - 0.08) / 0.22);
  // irregular syllable size (stressed and unstressed), never fully still
  const amp = 0.62 + 0.3 * noise1(fr * 0.31, 403) + 0.08 * Math.sin(fr * 0.9 + 1.7);
  const w = g.w;
  return {
    open: clamp(w * cyc * amp * shape.open * 0.9),
    width: lerp(1, shape.width, w * (0.45 + 0.55 * cyc)),
    round: shape.round * w * (0.4 + 0.6 * cyc),
    teeth: shape.teeth * w * cyc * clamp(amp),
  };
};
/** Puppet hooks on the acting clock; the lip sync itself reads the story clock. */
const charuMouth = (a: number): MouthState => charuMouthStory(storyOfA(a));
/** Speech level for the Puppet's head emphasis and pause blinks: phrase gate only (low, so the brows keep her expression). */
const charuTalk = (a: number) => 0.3 * phraseGate(storyOfA(a)).w;
/**
 * 0..1 while she speaks (story frames, eased over the clip edges): the expression's open-mouthed gasp is mostly handed
 * over to the speech mouth, so the lips can close between syllables and phrases. The brows keep the gasp's lift.
 */
const speakWeight = (fr: number) => sineRamp(fr, CHARU_LINE_FROM - 3, CHARU_LINE_FROM + 3) * (1 - sineRamp(fr, CHARU_LINE_TO - 3, CHARU_LINE_TO + 3));

/** Stirring overlay: weight is 1 while she cooks at the pot, fading to 0 by STIR_END when she hears the fight. */
const stirWeight = (fr: number) => clamp(windowed(fr, -40, STIR_END, 10));

/*
 * Left arm reach for the stirring. The rig has an upper arm (UA_LEN) and a forearm; the ladle is rigid with the
 * forearm, its bowl LADLE_REACH from the elbow (forearm-to-hand 47.4, grip 21.8, bowl centre 46.9 in body units).
 * Shoulder in body units (Puppet.tsx, Charu: sw 44.65, hipY -154.4, torsoLen 102.6, limbW 8.4):
 * x = -0.86 * sw * cos(0.95 * bodyTurn), y = -248.7. Body units are scaled by 1.12 (plus the Puppet bounce).
 */
const UA_LEN = 53.2;
const LADLE_REACH = 116.1;
const SHOULDER_HALF_W = 0.86 * 44.65;
const SHOULDER_Y_B = -248.7;
/** Ladle bowl stirs in a flat ellipse inside the pot mouth (world px), centred on the pot. */
const POT_CX = HEARTH_X;
const POT_CY = 680;

/** Two-link solve with the elbow raised; returns rig angles in degrees (S = upper arm, E = forearm relative to it). */
const reachLadle = (sx: number, sy: number, tx: number, ty: number): { S: number; E: number } => {
  const vx = tx - sx;
  const vy = ty - sy;
  const d = Math.min(UA_LEN + LADLE_REACH - 0.5, Math.max(Math.abs(UA_LEN - LADLE_REACH) + 0.5, Math.hypot(vx, vy)));
  const thv = Math.atan2(-vx, vy);
  const al = Math.acos(clamp((UA_LEN * UA_LEN + d * d - LADLE_REACH * LADLE_REACH) / (2 * UA_LEN * d), -1, 1));
  const a1 = thv + al;
  const a2 = thv - al;
  const S = Math.cos(a1) <= Math.cos(a2) ? a1 : a2;
  const ex = sx - UA_LEN * Math.sin(S);
  const ey = sy + UA_LEN * Math.cos(S);
  const F = Math.atan2(-(tx - ex), ty - ey);
  return { S: (S * 180) / Math.PI, E: ((F - S) * 180) / Math.PI };
};

/**
 * Charu's acting (acting clock): keyed pose, then the stirring. While she cooks (stirWeight 1) the ladle arm is
 * solved so the bowl travels a slow, irregular loop inside the pot mouth. The phase always advances, so it never
 * reverses or loops on a fixed period. The solve uses the same bodyX, bodyTurn and bounce as the drawn figure.
 */
const charuAct = (fr: number): Pose => {
  const p = { ...charuPose(fr) };
  const face = charuFace(fr);
  for (const key of FACE_KEYS) p[key] = face[key];
  // Her cheeks are a warm blush here, not a puff: the Head draws cheeks above 0.3 as puffed cheeks pressing the lips
  // into a small closed shape, which overrides the speech mouth. Capped at 0.3 so her lip sync shows (PIT-01).
  p.cheeks = Math.min(face.cheeks, 0.3);
  // While she speaks, most of the gasp's open mouth is left to the lip sync; the brows keep the gasp's lift.
  const handed = face.gasp * 0.7 * speakWeight(storyOfA(fr));
  p.gasp = face.gasp - handed;
  p.brow = face.brow + handed * 0.8;
  const w = stirWeight(fr);
  const bodyX = p.bodyX + noise1(fr * 0.021, 61) * 3.5 + noise1(fr * 0.009, 62) * 2;
  const lean = p.lean + noise1(fr * 0.03, 63) * 0.035;

  const ph = fr * 0.06 + 0.8 * Math.sin(fr * 0.023 + 1.1) + 0.6 * noise1(fr * 0.02, 104);
  const rx = 22 + 3 * noise1(fr * 0.02, 105);
  const ry = 5 + 1.2 * noise1(fr * 0.025, 106);
  const tx = POT_CX + rx * Math.cos(ph);
  const ty = POT_CY + ry * Math.sin(ph);

  const bounce = Math.sin(fr * 0.14 + CAST.charu.seed) * 0.014 + Math.min(0.032, Math.abs(lean) * 0.0028);
  const cphi = Math.cos(clamp(p.bodyTurn, -1, 1) * 0.95);
  const bodyTargetX = (tx - (CHARU_X + bodyX)) / (1.12 * (1 + bounce));
  const bodyTargetY = (ty - GROUND) / (1.12 * (1 - bounce));
  const ik = reachLadle(-SHOULDER_HALF_W * cphi, SHOULDER_Y_B, bodyTargetX, bodyTargetY);
  const wristTwist = 3 * noise1(fr * 0.05, 92);

  // With a breath: her hand on Balak strokes him very gently, an irregular slow rhythm, from the settle on.
  const strokeW = BREATH > 0 ? ramp(fr, A_C3 + 63, A_C3 + 93) : 0;
  const stroke = strokeW * (Math.sin(fr * 0.07 + 1.3 * noise1(fr * 0.02, 108)) * 0.7 + noise1(fr * 0.04, 109) * 0.3);

  return {
    ...p,
    bodyX,
    lean,
    rS: p.rS + 1.6 * stroke,
    rE: p.rE - 2.2 * stroke,
    lS: lerp(p.lS, ik.S, w),
    lE: lerp(p.lE, ik.E + wristTwist, w),
  };
};

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/**
 * Step pose: the latest key at or before frame f holds until the next key. Also returns the pose it replaced and
 * the frame it started, so Animals.tsx can ease the change (keys are spaced at least BLEND frames apart).
 */
function poseState(f: number, keys: Array<[number, AnimalPose]>): { pose: AnimalPose; prevPose?: AnimalPose; poseStart: number } {
  let i = 0;
  for (let k = 0; k < keys.length; k++) if (f >= keys[k][0]) i = k;
  return { pose: keys[i][1], prevPose: i > 0 ? keys[i - 1][1] : undefined, poseStart: keys[i][0] };
}

/** Unsynchronised wander in px: each animal gets its own seed, so nothing moves in lock-step. */
const wander = (f: number, seed: number, amp: number) => noise1(f * 0.05, seed) * amp;

/** Fast jostle while the two bodies grapple, fading in and out over [a, b]. */
const jostle = (f: number, a: number, b: number, seed: number, amp: number) =>
  windowed(f, a, b, 6) * noise1(f * 0.7, seed) * amp;

/* ------------------------------------------------------------------ */
/* Kitchen, separating wall and baby's room props                       */
/* ------------------------------------------------------------------ */

/** Ladle held in the hand; the handle runs along the forearm, the bowl at the end. */
/** Shorter ladle (about 1.2x the forearm): bowl centre at 40 scale units, matching LADLE_REACH. */
const P_LADLE: PropRenderer = ({ scale }) => (
  <g>
    <rect x={-2.5 * scale} y={-4 * scale} width={5 * scale} height={40 * scale} rx={2.5 * scale} fill="#8a5a30" />
    <ellipse cx={0} cy={40 * scale} rx={15 * scale} ry={10 * scale} fill="#c8a04a" />
    <ellipse cx={0} cy={38 * scale} rx={11 * scale} ry={6 * scale} fill="#8a6428" />
  </g>
);

/**
 * Kitchen back wall and the shelf of utensils, drawn in kitchen-local coordinates (the group is offset by
 * KITCHEN_DX). The wall starts at local x 1190, i.e. world x 1560, just past the separating wall.
 */
const KitchenWall: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="s02-kwall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3a2418" />
        <stop offset="100%" stopColor="#1c110b" />
      </linearGradient>
    </defs>
    <rect x={1190} y={-600} width={2800} height={1500} fill="url(#s02-kwall)" />
    <rect x={1190} y={-600} width={12} height={1500} fill="#140b07" />
    <ellipse cx={1400} cy={470} rx={190} ry={120} fill="#0e0704" opacity={0.35} />
    {/* shelf with utensils */}
    <rect x={1230} y={600} width={400} height={12} fill="#6a4426" />
    <rect x={1258} y={612} width={8} height={20} fill="#5a3a22" />
    <rect x={1622} y={612} width={8} height={20} fill="#5a3a22" />
    <path d="M 1262 600 Q 1248 560 1266 548 L 1290 548 Q 1308 560 1294 600 Z" fill="#c8a04a" />
    <ellipse cx={1330} cy={594} rx={26} ry={8} fill="#d8b464" />
    <ellipse cx={1330} cy={588} rx={20} ry={6} fill="#f0d890" />
    <path d="M 1372 600 Q 1362 556 1384 546 Q 1406 556 1396 600 Z" fill="#9a5a34" />
    <path d="M 1418 600 Q 1410 570 1426 562 Q 1442 570 1434 600 Z" fill="#7a4628" />
    <rect x={1466} y={566} width={44} height={34} rx={3} fill="#8a8f9a" />
    <rect x={1462} y={560} width={52} height={8} rx={2} fill="#b6bac4" />
    {/* a ladle hanging from the shelf edge */}
    <rect x={1557} y={612} width={5} height={60} fill="#8a5a30" />
    <ellipse cx={1559} cy={684} rx={14} ry={9} fill="#c8a04a" />
    {/* kitchen cupboard by the right wall */}
    <rect x={1640} y={420} width={160} height={480} fill="#0a0610" />
  </g>
);

/** Solid wall between the baby's room (left) and the kitchen (right), with a doorway below the lintel. */
const SeparatingWall: React.FC = () => (
  <g>
    <rect x={WALL_LEFT} y={-600} width={WALL_W} height={1500} fill="#170d16" />
    {/* doorway opening: dark room beyond */}
    <rect x={DOOR_X - 25} y={470} width={50} height={490} fill="#080409" />
    <rect x={DOOR_X - 29} y={466} width={58} height={8} fill="#4a2a1a" />
  </g>
);

/** Mud hearth with a firebox, flames, a clay pot of rice on top, and smoke rising. Kitchen-local coordinates. */
const KitchenHearth: React.FC<{ f: number }> = ({ f }) => {
  const flameCols = ["#ff9a3c", "#ffb45a", "#ffcf6a", "#ff7a2a", "#ffa84a"];
  return (
    <g>
      <Glow x={1400} y={820} r={330} o={0.45 + 0.18 * hearthFlicker(f)} kind="soft" />
      {/* mud chulha */}
      <path d="M 1290 900 L 1302 772 Q 1400 748 1498 772 L 1510 900 Z" fill="#6e4a32" />
      <path d="M 1302 772 Q 1400 748 1498 772" stroke="#8c6444" strokeWidth={6} fill="none" />
      <path d="M 1350 900 L 1352 848 Q 1400 830 1448 848 L 1450 900 Z" fill="#150b06" />
      {/* flames licking out of the firebox, each on its own rhythm */}
      {[0, 1, 2, 3, 4].map((k) => {
        const x = 1362 + k * 18;
        const h = 34 + 14 * Math.abs(Math.sin(f * 0.33 + k * 1.9)) + 6 * noise1(f * 0.2, 40 + k);
        const sway = Math.sin(f * 0.27 + k * 2.3) * 5;
        return (
          <path
            key={k}
            d={`M ${x - 9} 892 Q ${x - 14} ${892 - h * 0.55} ${x + sway} ${892 - h} Q ${x + 10} ${892 - h * 0.5} ${x + 9} 892 Z`}
            fill={flameCols[k]}
            opacity={0.9}
          />
        );
      })}
      {/* pot mouth: the dark opening the pot sits in on the chulha; the pot body itself is drawn over Charu (PotFront) */}
      <ellipse cx={1400} cy={758} rx={96} ry={10} fill="#150b06" />
      <ellipse cx={1400} cy={670} rx={70} ry={12} fill="#2a180e" />
      <ellipse cx={1400} cy={667} rx={62} ry={8} fill="#fbf6ea" />
      {[0, 1, 2, 3, 4].map((k) => (
        <circle key={k} cx={1372 + k * 14} cy={667 + Math.sin(f * 0.45 + k * 1.3) * 2} r={3.5} fill="#fffdf6" opacity={0.9} />
      ))}
      {/* steam from the pot mouth: six puffs on staggered cycles */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const P = 40;
        const start = Math.floor((f - i * 7) / P) * P + i * 7;
        return <Smoke key={i} x={1366 + i * 13} y={664} f={f} start={start} seed={i + 3} s={1.2} />;
      })}
    </g>
  );
};

/** Clay body of the pot, drawn after Charu so her ladle disappears into the pot below the rim. Kitchen-local. */
const PotFront: React.FC = () => (
  <g>
    <path d="M 1312 752 Q 1300 684 1336 670 L 1464 670 Q 1500 684 1488 752 Q 1400 772 1312 752 Z" fill="#4a2c1c" />
    <path d="M 1336 686 Q 1400 676 1464 686" stroke="#6a4430" strokeWidth={3} fill="none" opacity={0.7} />
    {/* front lip of the chulha mouth, over the base of the pot */}
    <path d="M 1296 766 Q 1400 748 1504 766 L 1504 778 Q 1400 760 1296 778 Z" fill="#6e4a32" />
  </g>
);

/* ------------------------------------------------------------------ */
/* The hole in the far wall                                             */
/* ------------------------------------------------------------------ */

/**
 * How far the hole is open (0..1), authored frames: scratched out in three bursts, 84-90, 94-101 and 106-115.
 * Authored frames = acting frames - FDT (the entrance follows the fox line).
 */
const holeOpenAuth = (f: number) => 0.25 * ramp(f, 84, 90) + 0.35 * ramp(f, 94, 101) + 0.4 * ramp(f, 106, 115);
/** How far the hole is open at acting frame a. */
const holeOpen = (a: number) => holeOpenAuth(a - FDT);

/** Ragged arch for the hole at opening o, grown by pad px (for the rim). Empty while the hole is still shut. */
const holePath = (o: number, pad = 0): string => {
  if (o < 0.02) return "";
  const hw = (HOLE_W / 2) * o + pad;
  const hh = HOLE_H * Math.pow(o, 0.85) + pad;
  const N = 14;
  let d = "";
  for (let i = 0; i <= N; i++) {
    const a = Math.PI * (1 - i / N);
    const j = i > 0 && i < N ? 1 + (hash(i * 5.3 + 1) - 0.5) * 0.2 : 1;
    const x = HOLE_X + Math.cos(a) * hw * j;
    const y = HOLE_BASE - Math.sin(a) * hh * j;
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return `${d}Z`;
};

/** Mud crumbs knocked loose from the rim: each falls to the floor and stays there. */
const crumbBatch = (n: number, start: number, gap: number, seed: number) =>
  Array.from({ length: n }, (_, k) => {
    const i = k + seed;
    return {
      t0: start + k * gap + hash(i * 2.3 + 7) * 3,
      a: Math.PI * (0.12 + 0.76 * hash(i * 4.1 + 3)),
      vx: (hash(i * 3.7 + 1) - 0.5) * 3.2,
      r: 2.2 + hash(i * 6.1 + 2) * 3,
      land: HOLE_BASE + 1 + hash(i * 8.3 + 4) * 8,
      col: i % 2 ? "#5a3a28" : "#7a5238",
    };
  });
/** Crumbs (authored frames) from the scratching (84 on) and a few more as the fox squeezes back out (acting T + 54). */
const CRUMBS = [...crumbBatch(18, 84, 1.9, 0), ...crumbBatch(7, T + 54 - FDT, 3.4, 40)];

/** Hairline cracks in the plaster just before it gives way (82-92). */
const CRACKS = [-2.4, -1.9, -1.2, -0.7].map((a, i) => ({ a, len: 34 + hash(i + 31) * 22 }));

/** The hole at acting frame a (drawn on authored frames f = a - FDT). */
const MudHole: React.FC<{ a: number }> = ({ a }) => {
  const f = a - FDT;
  if (f < 82) return null;
  const o = holeOpenAuth(f);
  const d = holePath(o);
  const crackK = ramp(f, 82, 88) * (1 - ramp(f, 92, 104));
  return (
    <g>
      {crackK > 0.01 &&
        CRACKS.map((c, i) => {
          const cx = HOLE_X;
          const cy = HOLE_BASE - 40;
          const l = c.len * ramp(f, 82 + i, 88 + i);
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${cx + Math.cos(c.a) * l * 0.5 + 4} ${cy + Math.sin(c.a) * l * 0.5} L ${cx + Math.cos(c.a) * l} ${cy + Math.sin(c.a) * l}`}
              stroke="#0e0709"
              strokeWidth={2}
              fill="none"
              opacity={crackK}
            />
          );
        })}
      {/* pile of loose mud at the foot of the hole */}
      {o > 0.02 && (
        <>
          <ellipse cx={HOLE_X - 14} cy={HOLE_BASE + 3} rx={86 * o} ry={7 * o} fill="#3e2619" />
          <ellipse cx={HOLE_X + 30} cy={HOLE_BASE + 4} rx={30 * o} ry={5 * o} fill="#4e321f" />
        </>
      )}
      {/* rim, broken edge, then the dark opening */}
      {d && <path d={holePath(o, 7)} fill="#4a2c22" />}
      {d && <path d={holePath(o, 3)} fill="#26140f" />}
      {d && <path d={d} fill="#050307" />}
      {/* dust puffs on each burst of scratching */}
      {[86, 97, 108].map((t, i) => {
        const age = f - t;
        if (age < 0 || age > 22) return null;
        return (
          <circle
            key={t}
            cx={HOLE_X + (hash(i + 51) - 0.5) * 50 - age * 0.8}
            cy={HOLE_BASE - 16 - age * 0.9}
            r={12 + age * 1.6}
            fill="#8a6a52"
            opacity={0.32 * (1 - age / 22)}
          />
        );
      })}
      {/* falling crumbs */}
      {CRUMBS.map((c, i) => {
        const age = f - c.t0;
        if (age < 0) return null;
        const o0 = Math.max(0.2, holeOpenAuth(c.t0));
        const x0 = HOLE_X + Math.cos(c.a) * (HOLE_W / 2) * o0;
        const y0 = HOLE_BASE - Math.sin(c.a) * HOLE_H * o0;
        const tLand = Math.sqrt(Math.max(0, c.land - y0) / 0.9);
        const y = Math.min(c.land, y0 + 0.9 * age * age);
        const x = x0 + c.vx * Math.min(age, tLand);
        return <circle key={i} cx={x} cy={y} r={c.r} fill={c.col} opacity={age < tLand ? 1 : 0.85} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene02Fox: React.FC = () => {
  // lifeF: real local frame (life: breathing, blinks, flames, motes). a: acting clock (story with only P1 held).
  const { lifeF, pause } = useStory(SID);
  const a = storyFrame(lifeF, ACT_HELD);
  // P1 moment: 0..1 while the story holds after "...ঢুকে পড়েছে!" (the fox sniffs, Balak turns his head to it),
  // easing out over the first frames after the pause.
  const inP1 = pause.inPause && lifeF >= P1.atStory && lifeF < P1.atStory + P1.frames;
  const p1w = lifeF < P1.atStory ? 0 : inP1 ? sineRamp(pause.elapsed, 2, 12) : 1 - sineRamp(a, A_P1, A_P1 + 10);

  // Fox: comes through the hole in the far wall, creeps toward the khat, stops mid-room (P1, sniffing), is caught,
  // flees back out through the hole. Facing left (flip) until it turns to flee. A quick scratching jitter at the wall.
  const foxX =
    track(a, FOX_X_KEYS) +
    wander(lifeF, 5, 3) +
    jostle(a, T + 18, T + 40, 3, 4) +
    windowed(a, 102 + FDT, 136 + FDT, 4) * noise1(lifeF * 0.9, 77) * 5;
  const foxFlip = a < FOX_FLEE;
  // At the wall it is further from the camera: drawn smaller and standing a little higher, growing to full size and
  // down onto the floor line as it comes forward. Animals.tsx: y is the ground line (paw bottoms).
  const foxGrow = sineRamp(a, 148 + FDT, 180 + FDT);
  // Going back out it shrinks back toward the wall the same way.
  const foxDepth = lerp(lerp(0.72, 1, foxGrow), 0.72, sineRamp(a, FOX_FLEE, FOX_FLEE + 22));
  const foxS = FOX_S * foxDepth;
  const foxY = lerp(HOLE_BASE - 10, GROUND, (foxDepth - 0.72) / 0.28);
  // Coming through the wall: the part left of foxEdge is through; the rest shows only inside the hole, in shadow.
  // The edge slides right as the tail follows the body out; no clip once it is fully in the room.
  const holeD = holePath(holeOpen(a));
  // Going back out the edge is fixed: the head vanishes into the hole first, the tail last.
  const foxClipOn = a < 180 + FDT || a >= FOX_FLEE + 1;
  const foxEdge = a < 200 + FDT ? HOLE_EDGE + 420 * ramp(a, 146 + FDT, 176 + FDT) : HOLE_EDGE;
  // P1: it sniffs low, nose to the floor and up again.
  const foxLean = track(a, FOX_LEAN_KEYS) + p1w * (0.12 + 0.1 * Math.sin(lifeF * 0.35));
  const foxState = poseState(a, FOX_POSE_KEYS);

  // Bagha: runs in from the left edge, stalks, lunges, a brief tussle, drives the fox to the hole and barks; in P2 he
  // turns to look at the baby, then trots back to guard the left side of the khat.
  const dogX = track(a, DOG_X_KEYS) + wander(lifeF, 9, 2) + jostle(a, T + 14, T + 42, 7, 5);
  // Faces left from his turn in P2 (to the baby, then trotting back); turns to face the khat again as he sits.
  const dogFlip = a >= DOG_TURN && a < A_P2 + 80;
  // Animals.tsx: y is the ground line (paw bottoms), the same floor line Charu stands on.
  const dogY = GROUND;
  const dogLean = track(a, DOG_LEAN_KEYS);
  const dogState = poseState(a, DOG_POSE_KEYS);

  // Baby: awake, calm and curious through the fox; eyes and head follow the fox and Bagha, then find his mother;
  // faint smile widening, happy when he finds her (P3 on): coos, waves and kicks. The halo stays restrained.
  const withMum = ramp(a, A_P3 + 12, A_P3 + 42);
  const headLive = withMum * (0.07 * noise1(lifeF * 0.045, 301) + 0.04 * Math.sin(lifeF * 0.11 + 0.7));
  const babyGaze = clamp(track(a, BABY_GAZE_KEYS) + 0.05 * noise1(lifeF * 0.06, 303) + 0.14 * p1w, -1, 1);
  // BabyThakur already turns the head a little with the gaze (eyes lead, head follows), so the keyed turn is scaled down.
  const babyTurn = clamp(0.8 * track(a, BABY_TURN_KEYS) + headLive + 0.2 * p1w, -1, 1);
  const babyRoll = track(a, BABY_ROLL_KEYS) + withMum * 2.5 * noise1(lifeF * 0.04, 305) + 2.5 * p1w;
  const babySmile = clamp(track(a, BABY_SMILE_KEYS) + withMum * 0.05 * noise1(lifeF * 0.05, 307));
  const babyCoo = clamp(bumps(a, COO_BUMPS));
  // Eyes open the whole scene; the blinks are short, soft dips.
  const babyAwake = clamp(1 - BLINKS.reduce((m, c) => Math.max(m, bump(a, c, 3.5)), 0) * 0.95);
  const babyCheeks = 0.4 + 0.2 * withMum;
  const babyWave = clamp(track(a, BABY_WAVE_KEYS) + bumps(a, WAVE_BUMPS));
  const babyKick = clamp(track(a, BABY_KICK_KEYS) + bumps(a, KICK_BUMPS));
  const babyJoy = Math.max(babyWave, babyKick);
  const babyLookY = track(a, BABY_LOOKY_KEYS) + 0.04 * p1w;
  // Glow (BAL rules): steady, never pulsing; it brightens gently only on the key beats: "মিষ্টি হাসছে", P3 when he
  // finds his mother, and as she kneels by him. A steady small lift in the end hold.
  const smileGlow = ramp(a, A_L6B, A_L6B + 30) * (1 - 0.5 * ramp(a, A_C1, A_C1 + 40));
  const p3Glow = ramp(a, A_P3 + 16, A_P3 + 44) * (1 - 0.6 * ramp(a, A_C2, A_C2 + 40));
  const kneelGlow = ramp(a, A_C2 - 7, A_C2 + 27);
  const endLift = BREATH > 0 ? BREATH_AMT * ramp(a, CONTENT_END - 12, CONTENT_END + 24) : 0;
  const babyAura =
    Math.max(BABY_AURA_FLOOR, track(a, BABY_AURA_KEYS)) +
    0.1 * kneelGlow +
    0.1 * smileGlow +
    0.1 * p3Glow +
    0.06 * babyJoy +
    0.05 * endLift;

  const shot = shotAt(a);
  // Upward tilt: perspective keystone on the stage planes, scaled up just enough that the top corners stay covered.
  const tiltStyle: React.CSSProperties =
    shot.tilt > 0.01
      ? {
          transform: `perspective(1800px) rotateX(${shot.tilt.toFixed(3)}deg) scale(${(1 + 0.0075 * shot.tilt).toFixed(4)})`,
          transformOrigin: "50% 50%",
        }
      : {};
  // Hearth light on Charu's face while she is in the kitchen; fades as she runs for the doorway.
  const hf = hearthFlicker(lifeF);
  const inKitchen = 1 - ramp(a, HURRY + 8, HURRY + 20);
  const charuHeadX = CHARU_X + charuAct(a).bodyX - 12;

  return (
    <Stage cam={shot.cam} background="#0b0820">
      <div style={{ position: "absolute", inset: 0, ...tiltStyle }}>
      {/* Night sky */}
      <Layer depth={0.1}>
        <defs>
          <linearGradient id="s02-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#05040f" />
            <stop offset="45%" stopColor="#14123a" />
            <stop offset="85%" stopColor="#2a1b3e" />
            <stop offset="100%" stopColor="#3a2236" />
          </linearGradient>
        </defs>
        <rect x={-700} y={-500} width={3300} height={2100} fill="url(#s02-sky)" />
        {STARS.map((s) => (
          <circle key={s.seed} cx={s.x} cy={s.y} r={s.r} fill="#f4eee0" opacity={0.25 + 0.35 * Math.abs(Math.sin(lifeF * 0.04 + s.seed))} />
        ))}
      </Layer>

      {/* Jungle silhouettes around the village */}
      <Layer depth={0.3}>
        {TREES.map((t) => (
          <g key={t.x}>
            <rect x={t.x - 10} y={260} width={20} height={320} fill="#0b0816" />
            <ellipse cx={t.x} cy={250} rx={t.r} ry={t.r * 0.7} fill="#0d0a1c" />
          </g>
        ))}
      </Layer>

      {/* Baby's room back wall, window and diya ledge (left room only) */}
      <Layer depth={0.6}>
        <defs>
          <linearGradient id="s02-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c1b2b" />
            <stop offset="100%" stopColor="#1d1220" />
          </linearGradient>
        </defs>
        <rect x={-500} y={300} width={3000} height={660} fill="url(#s02-wall)" />
        <path d="M -500 300 L 2500 300 L 2500 320 L -500 320 Z" fill="#100a14" />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={-500} x2={2500} y1={360 + i * 60} y2={360 + i * 60} stroke="#0e0912" strokeWidth={2} opacity={0.3} />
        ))}
        <rect x={BABY.x - 52} y={410} width={104} height={96} fill="#120a14" />
        <Glow x={BABY.x} y={458} r={180} o={0.45} kind="warm" />
        <rect x={-500} y={556} width={3000} height={16} fill="#4a2a1a" />
        {DIYAS.map((d) => (
          <g key={d.seed}>
            <Glow x={d.x} y={DIYA_LEDGE_Y} r={110} o={0.5} kind="warm" />
            <Diya x={d.x} y={DIYA_LEDGE_Y} s={d.s} f={lifeF} seed={d.seed} />
          </g>
        ))}
      </Layer>

      {/* Floor, walls, bed and hearth. The animals and Charu are on the same depth-1 plane (so the walls pan with the
          bed) but drawn in their own Layers. */}
      <Layer depth={1}>
        <GlowDefs />
        <DivineDefs />
        <defs>
          <linearGradient id="s02-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2a22" />
            <stop offset="100%" stopColor="#1a1214" />
          </linearGradient>
        </defs>
        <rect x={-700} y={900} width={4700} height={800} fill="url(#s02-floor)" />
        {[260, 520, 800, 1080, 1360, 1640].map((x) => (
          <line key={x} x1={x} x2={x - 60} y1={910} y2={1100} stroke="#120c0c" strokeWidth={2} opacity={0.4} />
        ))}
        <Glow x={BABY.x} y={GROUND - 10} r={220} o={0.55 + 0.1 * kneelGlow + 0.06 * smileGlow + 0.06 * p3Glow + 0.04 * babyJoy + 0.04 * endLift} kind="warm" />

        {/* the hole the fox scratches open low in the far wall */}
        <MudHole a={a} />

        <Khat x={BED_X} />
        <BabyThakur
          f={a}
          lifeF={lifeF}
          x={BABY.x}
          y={BABY.y}
          s={1.15}
          awake={babyAwake}
          aura={babyAura}
          gaze={babyGaze}
          lookY={babyLookY}
          turn={babyTurn}
          headRoll={babyRoll}
          smile={babySmile}
          coo={babyCoo}
          cheeks={babyCheeks}
          wiggle={0.25 + 0.1 * withMum}
          wave={babyWave}
          kick={babyKick}
        />

        <SeparatingWall />
        <g transform={`translate(${KITCHEN_DX} 0)`}>
          <KitchenWall />
          <KitchenHearth f={lifeF} />
        </g>
      </Layer>

      {/* Fox and Bagha: the rigs run on lifeF (alive in P1); positions and poses on the acting clock */}
      <Layer depth={1}>
        <GlowDefs />
        <defs>
          <clipPath id="s02-fox-clip">
            <rect x={-3000} y={-3000} width={3000 + foxEdge} height={6000} />
            {holeD && <path d={holeD} />}
          </clipPath>
          {holeD && (
            <clipPath id="s02-hole-clip">
              <path d={holeD} />
            </clipPath>
          )}
        </defs>
        <g clipPath={foxClipOn ? "url(#s02-fox-clip)" : undefined}>
          <Fox
            x={foxX}
            y={foxY}
            s={foxS}
            flip={foxFlip}
            f={lifeF}
            pose={foxState.pose}
            prevPose={foxState.prevPose}
            poseStart={aToReal(foxState.poseStart)}
            lean={foxLean}
          />
        </g>
        {/* the part of the fox still inside the wall is in shadow */}
        {foxClipOn && holeD && (
          <g clipPath="url(#s02-hole-clip)">
            <rect x={foxEdge} y={600} width={600} height={400} fill="#050307" opacity={0.55} />
          </g>
        )}
        <BaghaDog
          x={dogX}
          y={dogY}
          s={ANIMAL_S}
          flip={dogFlip}
          f={lifeF}
          pose={dogState.pose}
          prevPose={dogState.prevPose}
          poseStart={aToReal(dogState.poseStart)}
          lean={dogLean}
        />
      </Layer>

      {/* Charu: at the hearth in the kitchen until P2, then she runs into the baby's room. Drawn after the fox and the
          hearth, so she overlaps them. */}
      <Layer depth={1}>
        <GlowDefs />
        <Puppet
          cast={CAST.charu}
          f={a}
          lifeF={lifeF}
          x={CHARU_X}
          y={GROUND}
          scale={1.12}
          acting={charuAct}
          mouth={charuMouth}
          talk={charuTalk}
          breathRate={charuBreathRate(a)}
          sigh={charuSigh}
          lights={lightsAt(lifeF)}
          props={{ ladle: P_LADLE }}
          stillness={0.2}
          opacity={1}
        />
        {/* hearth fire flickering on her face (warm, from the hearth side) while she is in the kitchen */}
        {inKitchen > 0.01 && (
          <circle
            cx={charuHeadX}
            cy={572}
            r={92}
            fill="url(#fx-glow-soft)"
            opacity={inKitchen * (0.2 + 0.45 * hf)}
            style={{ mixBlendMode: "screen" }}
          />
        )}
        <g transform={`translate(${KITCHEN_DX} 0)`}>
          <PotFront />
        </g>
      </Layer>

      {/* Tulsi platform in the kitchen by the right wall */}
      <Layer depth={0.85}>
        <TulsiMancha x={2150} y={GROUND} f={lifeF} s={1} />
      </Layer>

      {/* Drifting dust: held back until the opening fade-in is done, then eased in */}
      <Layer depth={1.3} blend="screen" opacity={ramp(lifeF, 22, 50)}>
        <Bokeh f={lifeF} n={16} seed={5} color="#ffc46b" />
      </Layer>
      </div>

      <Grade warmth={0.28} vignette={0.6} tint="#1a1236" tintAmount={0.18} grain={0.05} bloomAt={[48, 58]} />
      {/* opening: no fade from black here; Episode02 cross-dissolves this scene in over the Ujanchar dusk (local 0-43) */}
    </Stage>
  );
};
