import React from "react";
import { clamp, lerp, noise1 } from "../../cinematic/core/anim";
import { Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { Bokeh } from "../../cinematic/fx/Fx";
import { DIVINE, DivineAura, DivineDefs } from "../../cinematic/divine/Divine";
import { Banana, DaySky, Palm } from "../../cinematic/sets/S01_DaySets";
import { BASE_POSE, Pose, Puppet } from "../../cinematic/rig/Puppet";
import { CAST } from "../../cinematic/rig/cast";
import { HeadLook, HeadState } from "../../cinematic/rig/Head";
import { MouthState } from "../../cinematic/rig/lipsync";
import { Hand as SharedHand } from "../../cinematic/rig/Hand";
import { AnimalProps, GOSAAP_STRIDE, GoSaap } from "../rig/Animals";
import { EP02_SCENES } from "../timing";
import { cueLocalStory, pausesFor, PauseState, storyFrame, storyToReal, useStory } from "../../episode/storyClock";

/**
 * Episode 2 scene 03_lemon_tree_goshaap (local frames, 24 fps, 596 frames of content; the real length is read from
 * EP02_SCENES at runtime). Past the last line ("not scared at all", ends local 572) comes the breathing pause: Balak rests
 * on all fours among the calm go-saaps under the lemon tree, slowly petting the nearest one, while Charu still watches
 * from the door; slow tongue flicks, leaves drifting down, his glow pulsing softly and the camera easing back to a
 * medium-wide with Charu at the door. At CU_CUT (596) the picture cuts to Charu and pushes in slowly to a tight close-up
 * of her eyes and face, then holds (frightened and amazed, eyes wet; a slow breath of relief, a soft smile through the
 * tears and a slow blink; see CharuCloseUp). The chapter-break fade to black is measured from the real end read from
 * EP02_SCENES (VIS_END), so it still closes the scene.
 * Subject focus: the background planes are calmed (less saturation and contrast, warmer, softer, blur growing with
 * distance, a soft vignette centred on the subjects), the light veils thin out over the subjects, and a warm key, a
 * brighter pool of light on the sand and a rim on the go-saaps put the eye on the child and the go-saaps first.
 * Warm morning in the corner of the family's village courtyard in Ujanchar (see the set section): a mud-walled hut with
 * a thatched roof and a low veranda, a bamboo fence with jungle beyond, the lemon tree in the corner. Balak Thakur, an
 * infant of about 8 to 10 months, starts at the edge of the veranda, crawls down its low step and across the courtyard
 * on hands and knees in three-quarter view (a diagonal cross gait: each hand moves with the
 * opposite knee; the trunk rolls, the bottom wiggles, knees slide, palms slap down flat, with an uneven
 * rhythm and small pauses to look around), looks back over his shoulder, kneels up and strokes the head of the
 * nearest of three big go-saaps that close in on him (from in front, from the side and from behind). They loom and
 * hiss; he laughs and pets them; they settle flat on the sand to be petted. A Bengal cow idles in the background.
 * Charu watches from the door, frightened and amazed, hand over her mouth. Each reaction is timed to its narration cue
 * (subtitles.ts). Divine light (Level 1 hint) is on Balak only.
 *
 * The Puppet rig is upright, so the crawling figure is built here from simple SVG limbs.
 * The face uses the shared Head component. Figure units are local; the figure is drawn at FIG_S.
 */

/*
 * CAMERA AND PAUSES (2026-11-21, CAM-13, CAM-14, STO-16; plan "Scene 03" in Ep02_Shots_and_Pauses_DRAFT.md):
 * Two clocks (src/episode/storyClock.ts): `f` is the STORY clock (authored frames; it holds during the three pauses) and
 * drives every story action; `lifeF` is the real local frame and drives life (blinks, breathing, sway, tongue flicks,
 * leaves, light, motes) so nothing freezes inside a pause. The camera runs on real frames, keyed to the narration cues:
 *   1. "শিশু তখন হামাগুড়ি..." : low medium at his eye level, following his crawl at an even pace; it stops when he stops.
 *   P1 (36 f): he stops on the sand, sits back on his heels, looks around and back at the veranda.
 *   2. "বাড়ির উঠোনের কোণে..." : cut to a held wide of the courtyard corner (lemon tree, the go-saaps, the fence, Charu at
 *      the door, he small at the left).
 *   P2 (36 f): held wide; a go-saap's slow tongue flick, he looks at them; focus racks to Charu at the door and back.
 *   3. "ছোট্ট ঠাকুর..." : hold while he crawls to them; on "তাদের গায়ে হাত বুলিয়ে" one slow push in to the two-shot.
 *   P3 (48 f): hold the two-shot; a slow stroke, go-saap A closes its eyes and settles flat; his glow brightens gently.
 *   4. "আর আশ্চর্যের কথা—" : hold.
 *   5. "গো-সাপগুলোও চুপচাপ..." : one slow pull back to a medium wide (all the go-saaps calm, Charu far behind); hold,
 *      then the cut to Charu's close-up (CAM-12).
 * The old low "tension" angle, the hiss jolt, the orbit and the layered pushes are gone (director, STO-16: the narration
 * says the go-saaps were calm).
 */
const SCENE_ID = "03_lemon_tree_goshaap";
const SCENE = EP02_SCENES.find((s) => s.sceneId === SCENE_ID);
/** This scene's pauses (story clock holds), sorted: P1 after "...শিখেছে", P2 after "...গো-সাপ", P3 after "...খেলতেন". */
const PAUSES = pausesFor(SCENE_ID);
/** Real local frame where a story frame plays (a pause's own atStory maps to the start of that pause). */
const realOf = (story: number) => storyToReal(story, PAUSES);
/** Real local frame where pause i begins, and its length (0 if the timing has no such pause). */
const pauseStartReal = (i: number) => (PAUSES[i] ? realOf(PAUSES[i].atStory) : -1e6);
const pauseLen = (i: number) => PAUSES[i]?.frames ?? 0;
/** Real local frame where a narration phrase starts (after any pause that sits right at its start). */
const cueStartReal = (snippet: string, fallbackStory: number) => {
  const s = cueLocalStory(snippet, SCENE_ID)?.from ?? fallbackStory;
  const atPause = PAUSES.find((p) => p.atStory === s);
  return realOf(s) + (atPause ? atPause.frames : 0);
};
/** Last frame of the narrated content (the length before the breathing pause was added). */
const CONTENT_END = 596;
/** The scene's real length at runtime (CONTENT_END plus the breathing pause). */
const DUR = Math.max(CONTENT_END, SCENE?.durationFrames ?? CONTENT_END);
/** The resting pet of the breathing pause eases in once the last line and the glee pats are done. */
const REST_FROM = CONTENT_END - 18;
const REST_IN = 26;

const GROUND = 900;
const FIG_S = 1.5;
const CYCLE = 60; // local units the body advances per crawl cycle (short stride: each limb sweeps only about +/-22 units)
const NCYC = 16; // crawl cycles over the whole crawl (CYCLE * NCYC is unchanged, so the crawl covers the same distance)
const X0 = -60; // world x of the body anchor at frame 0
const CRAWL_END = 344; // crawl stops at the end of the "went over" cue (324) plus 20 frames
const CRAWL_BUMP = 0.9; // speed profile: 0 = constant speed, 1 = full ease in and out (hesitant start, slow stop)
const HEAD_R = 33;
// Three big go-saaps (Bengal monitors), each two to three times his length (see the go-saap section below). The
// nearest, A, ends facing left toward him with its head at his hand, below his chin: it can meet his hand or come
// near his chest, never his face. The stroke runs over the top of its head (strokeA to strokeB), inside the reach
// of his near arm while he leans in on all fours.
const COW = { x: 1900, y: 815, s: 0.95 };
const LEMON = { x: 1480, y: 850, s: 1.1 };

const SKIN = "#d9a07a";
const SKIN_L = "#f0c4a0";
const SKIN_S = "#b47853";
const SKIN_D = "#8e5a3c";
const DHOTI = "#fbf8f0";
const DHOTI_S = "#d8d0be";
/** Far-side limbs: a shade darker than the near side, but not as dark as the shadow tone. */
const SKIN_FAR = "#c68b63";
const SKIN_FAR_S = "#a36a47";
/** Warm golden rim light from the sun ahead of him (upper right). */
const RIM = "#ffd98a";
const RIM_HOT = "#fff1c4";

/**
 * Three-quarter view: the far side of the body sits slightly up and back on screen (it is further from
 * the camera, on a ground plane seen from a little above). The shoulders are wider than the hips, so the
 * far shoulder and far hand are offset more than the far hip and far knee.
 */
const FAR_SH: V2 = [-5, -9];
const FAR_HIP: V2 = [-4, -6];

// An 8 to 10 month old infant: a big round head (about a quarter of body length), a short round trunk,
// and short, very chubby limbs. The face uses the baby face model with soft, bright divine eyes.
const LOOK: HeadLook = {
  skin: SKIN,
  skinLight: SKIN_L,
  skinShade: SKIN_S,
  lips: "#c06a62",
  hair: "#1e1411",
  hairLight: "#4a3830",
  // soft curly baby hair, child-weight lashes and brows, a soft pink lip tint, no kajal
  // "tousled" on a baby face draws the full soft infant curls (INFANT_CURLS in Head.tsx); "baby" drew a faint cap.
  hairStyle: "tousled",
  age: "baby",
  divineEyes: true,
  lashes: 0.5,
  browWeight: 0.7,
  lipTint: "#d88a8a",
  kajal: 0,
};

/** Slow, calm blinks: the lids close over 4 frames, rest closed for 2, and lift over 7, every 3 to 4.5 seconds (real frames: they go on in the pauses). */
const BABY_BLINKS: number[] = (() => {
  const out: number[] = [];
  let t = 30;
  let i = 0;
  while (t < DUR + 240) {
    out.push(Math.round(t));
    const h = Math.sin((i++ * 5.1 + 2) * 127.1 + 311.7) * 43758.5453;
    t += 72 + 36 * (h - Math.floor(h));
  }
  return out;
})();
const babyBlink = (f: number) => BABY_BLINKS.reduce((m, c) => Math.max(m, ramp(f, c, c + 4) * (1 - ramp(f, c + 6, c + 13))), 0);

/* ------------------------------------------------------------------ */
/* Timing helpers                                                      */
/* ------------------------------------------------------------------ */

const sstep = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const ramp = (f: number, a: number, b: number) => (b <= a ? (f >= b ? 1 : 0) : sstep((f - a) / (b - a)));
/** Breathing-pause rest: 0 through the narration, easing to 1 as he settles in to pet the nearest go-saap. */
const restAt = (f: number) => ramp(f, REST_FROM, REST_FROM + REST_IN);
/** He looks back over his shoulder at the basking go-saaps (158 to 178) and turns ahead again before P2 (230 to 249). */
const lookBackAt = (f: number) => ramp(f, 158, 178) - ramp(f, 230, 249);

/* ------------------------------------------------------------------ */
/* Life inside the pauses                                              */
/* ------------------------------------------------------------------ */

/**
 * What goes on while the story clock holds. t = the real local frame (life clock); pz = the pause state; e = frames into
 * the current pause; w = a soft envelope per pause (0 outside, eased in over 8 frames and out over the last 9);
 * a3 = go-saap A's settle in P3 (0 before, it sinks flat during P3, 1 after); strokeX = the extra stroke phase (cycles)
 * of his slow stroke in P3 (constant after it, so the stroke picks up exactly where the pause left it).
 */
interface Life {
  t: number;
  pz: PauseState;
  e: number;
  w: [number, number, number];
  a3: number;
  strokeX: number;
}
const lifeAt = (t: number, pz: PauseState): Life => {
  const w: [number, number, number] = [0, 0, 0];
  if (pz.inPause && pz.index >= 0 && pz.index < 3) w[pz.index] = ramp(pz.elapsed, 0, 8) * (1 - ramp(pz.elapsed, pz.frames - 9, pz.frames - 1));
  const n3 = pauseLen(2);
  const e3 = clamp(t - pauseStartReal(2), 0, n3);
  return {
    t,
    pz,
    e: pz.inPause ? pz.elapsed : 0,
    w,
    a3: n3 > 0 ? ramp(e3, 6, n3 - 10) : 0,
    strokeX: e3 / 62,
  };
};

/**
 * His moments in P1 and P2 (weights 0..1, all flat at both ends of the pause, so the crawl resumes exactly as it held):
 * P1: he sits back on his heels (sit), lifts his hands off the sand onto his thighs (hands), looks around and up (up),
 * then back over his shoulder at the veranda (back). P2: he lifts his head and looks at A ahead (ahead), then round at
 * C behind him (behind). Eye weights run 3 frames ahead of the head (the eyes lead).
 */
const pauseLooks = (lx: Life, lead = 0) => {
  const e = lx.e + lead;
  const p1 = lx.pz.inPause && lx.pz.index === 0;
  const p2 = lx.pz.inPause && lx.pz.index === 1;
  return {
    sit: p1 ? ramp(lx.e, 0, 10) * (1 - ramp(lx.e, 25, 35)) : 0,
    hands: p1 ? ramp(lx.e, 4, 12) * (1 - ramp(lx.e, 22, 31)) : 0,
    up: p1 ? ramp(e, 6, 12) * (1 - ramp(e, 15, 20)) : 0,
    back: p1 ? ramp(e, 15, 22) * (1 - ramp(e, 27, 33)) : 0,
    ahead: p2 ? ramp(e, 2, 9) * (1 - ramp(e, 16, 21)) : 0,
    behind: p2 ? ramp(e, 17, 24) * (1 - ramp(e, 28, 34)) : 0,
    lift: p2 ? ramp(lx.e, 0, 8) * (1 - ramp(lx.e, 27, 35)) : 0,
  };
};

/* ------------------------------------------------------------------ */
/* Crawl kinematics                                                    */
/* ------------------------------------------------------------------ */

/**
 * A limb in the crawl cycle. Stance (q < 0.75) keeps the contact fixed in the world while the
 * body moves over it. Swing (q >= 0.75) carries the limb forward and lifts it.
 * `rel` is the contact position relative to the body anchor, in local units.
 */
interface Step {
  rel: number;
  lift: number; // 0..1 swing height (shape depends on the limb)
  q: number; // phase within the cycle
  t: number; // 0..1 progress through the swing (0 in stance)
  n: number; // cycle index (seeds per-stride variation)
  land: number; // 1 just after touchdown, fading over a few frames (palm slap squash)
}
/** Seeded hash 0..1, for per-stride variation. */
const hash01 = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/**
 * Hand step: the palm stays planted through stance, then lifts, reaches forward, and slaps down flat. The
 * forward reach finishes before the drop (progress complete at 80% of the swing), and the lift peaks late
 * (t^1.6), so the hand comes down quickly and flat instead of gliding in.
 */
const stepAt = (phi: number, off: number, R: number): Step => {
  const x = phi + off;
  const n = Math.floor(x);
  const q = x - n;
  const land = q < 0.07 ? 1 - q / 0.07 : 0;
  if (q < 0.75) return { rel: R - CYCLE * q, lift: 0, q, t: 0, n, land };
  const t = (q - 0.75) / 0.25;
  return { rel: lerp(R - CYCLE * 0.75, R, sstep(Math.min(1, t / 0.8))), lift: Math.sin(Math.PI * Math.pow(t, 1.6)), q, t, n, land: 0 };
};
/** Knee step: the knee slides forward along the ground (no step), with only a whisper of lift. */
const kneeStepAt = (phi: number, off: number, R: number): Step => {
  const s = stepAt(phi, off, R);
  return { ...s, rel: s.t > 0 ? lerp(R - CYCLE * 0.75, R, sstep(s.t)) : s.rel, lift: Math.sin(Math.PI * s.t) };
};

/** Upper arm and forearm lengths of an infant (local units): short, but a little longer than the shoulder height, so the elbow stays soft. */
const ARM_UP = 38;
const ARM_FORE = 34;
/** Shin length, knee to ankle (local units). */
const SHIN = 38;

/**
 * Two-bone arm: shoulder (ax, ay) to the wrist target, with the elbow bending back toward the knees.
 * A target out of reach is pulled in, so the arm never snaps straight.
 */
const ik2 = (ax: number, ay: number, tx: number, ty: number, l1: number, l2: number) => {
  let dx = tx - ax;
  let dy = ty - ay;
  let d = Math.hypot(dx, dy) || 1;
  const maxD = l1 + l2 - 3;
  if (d > maxD) {
    dx *= maxD / d;
    dy *= maxD / d;
    d = maxD;
  }
  const a = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const ang = a + Math.acos(cosA);
  return {
    elbow: [ax + l1 * Math.cos(ang), ay + l1 * Math.sin(ang)] as [number, number],
    wrist: [ax + dx, ay + dy] as [number, number],
  };
};

const mix2 = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

interface Rig {
  f: number;
  Xw: number; // world x of the body anchor
  Hx: number;
  Hy: number;
  Sx: number;
  Sy: number;
  kneeN: [number, number];
  footN: [number, number];
  kneeF: [number, number];
  footF: [number, number];
  elbowN: [number, number];
  wristN: [number, number];
  elbowF: [number, number];
  wristF: [number, number];
  ox: number; // head origin (local)
  oy: number;
  headTilt: number;
  yaw: number;
  eyeX: number;
  smile: number;
  mouth: MouthState;
  close: number;
  brow: number;
  cheeks: number;
  sway: number;
  clothLag: number; // hip sway from 4 frames earlier, normalised to -1..1; drives the loincloth's soft movement
  kneel: number; // 0 on all fours .. 1 kneeling up
  shN: V2; // near shoulder joint (with trunk roll)
  shF: V2; // far shoulder joint (three-quarter offset + roll)
  hipN: V2;
  hipF: V2;
  landN: number; // palm slap squash, near hand
  landF: number;
  wiggle: number; // bottom wiggle, -1..1
  groundF: number; // far-side ground line (local y)
  laugh: number; // 0..1 delight (eyes crinkle, mouth opens, glow brightens)
  pulse: number; // 0..1 the "ha-ha" rhythm of the laugh
  flatN: number; // 0..1 near palm laid flat on the go-saap's back
  // face, driven through the shared Head rig
  gasp: number; // 0..1 wonder: eyes a touch wider, the soft "O"
  squint: number; // lower-lid lift: an eye smile when he is delighted, soft lids when tender
  eyeY: number; // + looks down
  // overlapping action of the hands and fingers
  swingN: number; // 0..1 swing progress of the near hand (0 while planted): the wrist trails, the hand droops
  swingF: number;
  curlN: number; // 0..1 finger curl (lifted hands curl, planted hands spread)
  curlF: number;
  settleN: number; // damped finger settle just after the palm lands (-1..1)
  settleF: number;
  bellySway: number; // belly swing, a few frames behind the hips (-1..1)
  bellyJig: number; // belly bounce with each stride (-1..1)
}

/* ------------------------------------------------------------------ */
/* Play: delight, pats and kicks (all after the crawl has stopped at 344, so the gait is untouched) */
/* ------------------------------------------------------------------ */

/**
 * Delight: a warm laugh while stroking (346 to 424), a soft one as the go-saaps settle under his hand (452 to 514),
 * and the full giggle at "not scared at all" (520 to 596), which quiets to a soft contented chuckle in the breathing pause.
 */
const laughAt = (f: number) =>
  0.7 * ramp(f, 346, 366) * (1 - ramp(f, 404, 424)) +
  0.45 * ramp(f, 452, 470) * (1 - ramp(f, 496, 514)) +
  ramp(f, 520, 538) * (1 - 0.5 * ramp(f, 578, 596)) * (1 - 0.6 * restAt(f));
/** The "ha-ha" rhythm: an uneven pulse in little bursts. */
const laughPulse = (f: number) => clamp((0.5 + 0.5 * Math.sin(f * 0.85 + 0.8 * Math.sin(f * 0.07))) * (0.65 + 0.35 * Math.sin(f * 0.12 + 1)));

/** Pats with a flat hand: [from, to, period, height]. Pats on its neck while stroking, then glee pats on the sand by its nose. */
const PATS: Array<[number, number, number, number]> = [
  [372, 402, 11, 7],
  [454, 504, 16, 5],
  [528, 576, 12, 10],
];
/** Hand lift (local units) and palm slap squash for the pats: the hand rises slowly and comes down quickly and flat. */
const patAt = (f: number) => {
  let lift = 0;
  let land = 0;
  for (const [a, b, p, h] of PATS) {
    const w = ramp(f, a - 4, a + 2) * (1 - ramp(f, b - 4, b + 2));
    if (w <= 0) continue;
    const u = ((((f - a) % p) + p) % p) / p;
    lift += w * h * Math.sin(Math.PI * Math.pow(u, 1.6));
    if (f - a > p * 0.6 && u < 0.18) land += w * (1 - u / 0.18);
  }
  return { lift, land };
};

/** Little kicks of his feet behind him (on all fours only): [from, to]. Each foot swings up and back down, the two alternating. */
const KICKS: Array<[number, number]> = [
  [362, 402],
  [530, 592],
];
const kickAt = (f: number, off: number) =>
  KICKS.reduce((a, [s, e]) => a + ramp(f, s, s + 8) * (1 - ramp(f, e - 8, e)) * 0.9 * Math.pow(Math.max(0, Math.sin((2 * Math.PI * (f - s - off)) / 24)), 2), 0);
/** The shin swung up about the knee by angle a (radians); at a = 0 this is the resting foot from kneeAt. */
const kickFoot = (k: [number, number], a: number): [number, number] => [k[0] - SHIN * Math.cos(a), k[1] + 2.5 - SHIN * Math.sin(a)];

/** Thigh length (local units). Reach is found from the vertical hip-to-knee drop, so a planted knee never clamps. */
const THIGH = 60;
const KNEE_Y = -9; // knee centre when planted: the r = 9 chubby knee rests on the ground line

/**
 * Knee and shin. A planted knee sits exactly under its contact point (no sliding). The knee slides
 * forward along the ground in swing; the shin lies flat on the ground with the top of the foot down,
 * and on some strides the foot lifts off the ground as the knee comes through.
 * `gy` is the ground line for this side (the far side sits a little higher on screen).
 */
const kneeAt = (st: Step, hx: number, hy: number, gy = 0, dx = 0): { k: [number, number]; foot: [number, number] } => {
  const kneeY = KNEE_Y + gy;
  const drop = hy - kneeY;
  const reach = Math.sqrt(Math.max(0, THIGH * THIGH - drop * drop));
  const kx = hx + clamp(st.rel + dx - hx, -reach, reach);
  const ky = kneeY - 1.2 * st.lift;
  // per-stride variation: on some strides the foot swings up off the ground, on others it drags
  const amp = hash01(st.n * 3.7 + dx) < 0.4 ? 0.62 : 0.14;
  const a = amp * Math.sin(Math.PI * Math.min(1, st.t * 1.15));
  return { k: [kx, ky], foot: [kx - SHIN * Math.cos(a), ky + 2.5 - SHIN * Math.sin(a)] };
};

/**
 * Slow spots in the crawl (centre frame, half-width in frames): short pauses where he gathers himself. The first and the
 * last sit on the story pauses P1 (story 70) and P2 (story 252): he slows to a stop there with every hand and knee planted
 * (the phase at both frames falls where no limb is in its swing), so the held story frame never leaves a limb in the air.
 */
const CRAWL_PAUSES: Array<[number, number]> = [
  [70, 10],
  [186, 11],
  [250, 9],
];

/**
 * Crawl speed at frame t (cycles per frame, before normalising): a short hesitant start (so he is down the veranda step
 * and on the sand by P1), building to the middle, the slow stop at the end, the slow spots and an irregular cadence.
 * The second half is the original profile (1 - 0.9 cos), so the approach to the go-saaps and the stop are unchanged.
 */
const crawlSpeed = (t: number) => {
  const start = 0.2 + 0.8 * sstep(t / 32);
  const base = t < CRAWL_END / 2 ? start * lerp(1, 1.9, sstep((t - CRAWL_END / 4) / (CRAWL_END / 4))) : 1 - CRAWL_BUMP * Math.cos((2 * Math.PI * t) / CRAWL_END);
  let p = 1;
  for (const [c, w] of CRAWL_PAUSES) p -= 0.85 * (0.5 + 0.5 * Math.cos(Math.PI * clamp((t - c) / w, -1, 1)));
  const irregular = 1 + 0.18 * noise1(t * 0.035, 21);
  return base * Math.max(0.08, p) * irregular;
};

/** Cumulative crawl phase per frame, normalised so the crawl covers exactly NCYC cycles by CRAWL_END (same stop point as before). */
const CRAWL_CUM: number[] = (() => {
  const out = [0];
  for (let t = 0; t < CRAWL_END; t++) out.push(out[t] + crawlSpeed(t));
  const total = out[CRAWL_END];
  return out.map((v) => (NCYC * v) / total);
})();

const crawlPhi = (f: number) => CRAWL_CUM[Math.round(clamp(f, 0, CRAWL_END))];
/** Crawl weight, zero once he has stopped (324 to 344). */
const crawlWeight = (f: number) => 1 - sstep((f - 324) / 20);
/** Hip sway at frame f (radians). Used on its own so the loincloth can run a few frames behind it. */
// Peaks as the near knee slides forward (near knee swing centre at phase 0.335): the bottom wiggles toward the far side.
const hipSwayAt = (f: number) => crawlWeight(f) * 0.16 * Math.cos(2 * Math.PI * (crawlPhi(f) - 0.335));

/** A short "look around" on the mid-crawl slow spot (the looks in P1 and P2 are pause moments, see pauseLooks). */
const LOOK_AROUND: Array<[number, number]> = [[186, 14]];
const lookAroundAt = (f: number) => LOOK_AROUND.reduce((a, [c, w]) => a + ramp(f, c - w, c - w * 0.3) * (1 - ramp(f, c + w * 0.3, c + w)), 0);

/* ------------------------------------------------------------------ */
/* Curiosity and expression (face only; the gait and the beats are untouched) */
/* ------------------------------------------------------------------ */

/**
 * Little curious glances: [centre, half-width, yaw offset, eyeY offset (+ down), head tilt (deg)]. The eyes go first
 * and the head follows a few frames later (gazeAt is read with a lag for the head).
 */
const GLANCES: Array<[number, number, number, number, number]> = [
  [40, 14, -0.3, 0.2, 4], // down at the edge of the veranda as he sets off
  [128, 15, 0.12, -0.45, -6], // up at the lemon leaves
  [286, 13, -0.6, 0, 4], // back at C's hiss, giggling
  [478, 16, -0.55, -0.2, 5], // a glance back toward Charu at the door, then home to his go-saap
  [CONTENT_END + 52, 18, -0.15, -0.5, -5], // up at a drifting leaf in the breath
];
/** Where he wants to look (yaw, eyeY, head tilt) at frame f, before the head's lag. */
const gazeAt = (f: number) => {
  const sWPlay = ramp(f, 317, 333) * (1 - ramp(f, 506, 526));
  const sW = Math.max(sWPlay, 0.9 * restAt(f));
  const lookA = lookBackAt(f);
  const lookB = ramp(f, 522, 542) - ramp(f, 572, 592);
  const around = clamp(lookAroundAt(f)) * (1 - clamp(lookA + lookB));
  let yaw = 0.85 + 0.1 * noise1(f * 0.02, 3);
  yaw = lerp(yaw, 0.3, around);
  yaw = lerp(yaw, -1.1, lookA);
  yaw = lerp(yaw, -1.0, lookB);
  yaw = lerp(yaw, 1.05, sW);
  // looking ahead; up a little in the look-arounds; down at the go-saap's head under his hand while he pets it
  let eyeY = lerp(-0.05, -0.25, around);
  eyeY = lerp(eyeY, 0.28, sW * (1 - clamp(lookB)));
  let tilt = 0;
  for (const [c, w, dy, de, dt] of GLANCES) {
    const k = ramp(f, c - w, c - w * 0.35) * (1 - ramp(f, c + w * 0.35, c + w));
    yaw += k * dy;
    eyeY += k * de;
    tilt += k * dt;
  }
  return { yaw, eyeY, tilt };
};

/** The pause looks laid over the gaze (see pauseLooks): around and up, back at the veranda, at A ahead, at C behind. */
const withPauseGaze = (g: { yaw: number; eyeY: number; tilt: number }, pl: ReturnType<typeof pauseLooks>) => {
  let yaw = lerp(g.yaw, 0.3, pl.up);
  yaw = lerp(yaw, -1.1, pl.back);
  yaw = lerp(yaw, 1.0, pl.ahead);
  yaw = lerp(yaw, -0.95, pl.behind);
  let eyeY = lerp(g.eyeY, -0.35, pl.up);
  eyeY = lerp(eyeY, -0.1, pl.back);
  eyeY = lerp(eyeY, 0.12, pl.ahead);
  eyeY = lerp(eyeY, 0.05, pl.behind);
  return { yaw, eyeY, tilt: g.tilt - 5 * pl.up + 4 * pl.back + 3 * pl.ahead };
};

/** Wonder: the first sight of the go-saaps basking (cue 165) and, smaller, A getting up and turning toward him (236 to 270). */
const wonderAt = (f: number) => ramp(f, 158, 170) * (1 - ramp(f, 198, 216)) + 0.55 * ramp(f, 236, 246) * (1 - ramp(f, 258, 272));
/**
 * A soft giggle on the face only (the glow keeps following laughAt): at C's hiss behind him, and as he reaches A,
 * running into the warm laugh of the stroke.
 */
const chuckleAt = (f: number) => 0.75 * ramp(f, 272, 282) * (1 - ramp(f, 298, 314)) + 0.6 * ramp(f, 316, 328) * (1 - ramp(f, 346, 362));
/** Little babbles ("ba-ba", "da"): [start, syllables], each syllable 7 frames, the lips parting softly. */
const BABBLES: Array<[number, number]> = [
  [44, 3],
  [124, 2],
  [222, 2],
  [430, 3],
  [CONTENT_END + 30, 2],
];
const babbleAt = (f: number) => {
  let open = 0;
  let round = 0;
  for (const [s, n] of BABBLES) {
    const t = f - s;
    if (t < 0 || t >= n * 7) continue;
    const syl = Math.floor(t / 7);
    const env = Math.sin((Math.PI * (t - syl * 7)) / 7);
    open = Math.max(open, env * (0.13 + 0.05 * hash01(s + syl)));
    round = Math.max(round, env * (syl % 2 ? 0.45 : 0.2));
  }
  return { open, round };
};
/** Shoulder lead: the shoulder lifts and reaches just before and early in its hand's swing (overlapping action). */
const shoulderLead = (s: Step) => Math.max(0, Math.sin(Math.PI * clamp((s.q - 0.64) / 0.28)));
/** The wrist trails the shoulder early in the swing and catches up before the palm lands (zero while planted). */
const wristTrail = (s: Step) => (s.t > 0 ? -5 * Math.sin(Math.PI * s.t) * Math.pow(1 - s.t, 1.3) : 0);
/** Fingers curl as the hand lifts and open again before it lands. */
const swingCurl = (s: Step) => (s.t > 0 ? 0.8 * Math.sin(Math.PI * Math.pow(s.t, 0.75)) : 0);
/** Fingers settle after the palm lands: a small overshoot of the spread, then a soft damped return. */
const fingerSettle = (s: Step) => (s.t === 0 && s.q < 0.3 ? Math.exp(-s.q / 0.09) * Math.cos((s.q / 0.3) * 2.2 * Math.PI) : 0);

const boyRig = (f: number, lx: Life): Rig => {
  const mv = crawlWeight(f);
  const phi = crawlPhi(f);
  const Xw = X0 + FIG_S * CYCLE * phi;
  const sway = hipSwayAt(f);
  // pause moments (P1: sits back, hands to his thighs, looks around and back; P2: lifts his head and looks at them;
  // P3: a slow stroke, the pats and kicks rest, the laugh quiets to tenderness)
  const pl = pauseLooks(lx);
  const plE = pauseLooks(lx, 3);
  const w3 = lx.w[2];
  // Stroke reaction (cue 324 to 403): starts 7 frames before the cue. He keeps stroking the go-saap's head while it
  // lies quietly and is petted (cue 446 to 529), and lets go just before "not scared at all".
  const kRaw = sstep((f - 317) / 22) * (1 - sstep((f - 397) / 26)); // kneel-up amount
  const sWPlay = ramp(f, 317, 333) * (1 - ramp(f, 506, 526)); // stroke weight (the narrated petting)
  // breathing pause: he rests on all fours and strokes the nearest go-saap's head again, slowly
  const rest = restAt(f);
  const sW = Math.max(sWPlay, 0.9 * rest); // stroke weight
  const lowW = ramp(f, 335, 359) * (1 - ramp(f, 506, 526)); // drops to all fours to reach its head
  const k = kRaw * (1 - lowW);
  // Delight: his shoulders hop up on each "ha" of the laugh (the crawl has stopped by then). In P3 it quiets.
  const laugh = laughAt(f) * (1 - 0.75 * w3);
  const pulse = laughPulse(lx.t);
  const bounce = laugh * 2.4 * pulse;
  const pat0 = patAt(f);
  const pat = { lift: pat0.lift * (1 - w3), land: pat0.land * (1 - w3) };

  // Diagonal cross gait: the near (right) hand moves with the far (left) knee, the far hand with the near
  // knee. Each knee follows its hand by a small, unequal lag, so the pair never moves in lockstep. (The lag is
  // fixed: a lag that changed per stride would jump the planted knee, which must never slide.)
  const lagA = 0.05;
  const lagB = 0.08;
  const rhS = stepAt(phi, 0, 44.5);
  const lkS = kneeStepAt(phi, lagA, 0.5);
  const lhS = stepAt(phi, 0.5, 44.5);
  const rkS = kneeStepAt(phi, 0.5 + lagB, 0.5);

  // Weight shift: a baby's body is never rigid. The trunk rolls toward the hand still planted when the other
  // hand lifts (the near and far shoulders change height), the bottom wiggles side to side as each knee slides
  // forward, the trunk rocks forward over the hands before each reach, and the body rises and settles per stride.
  const handUp = rhS.lift + lhS.lift;
  const kneeUp = rkS.lift + lkS.lift;
  const rock = mv * 2.2 * Math.sin(2 * Math.PI * phi * 2 + 1.1);
  const settle = mv * 1.3 * Math.pow(Math.sin(2 * Math.PI * phi), 2);
  const roll = mv * Math.cos(2 * Math.PI * (phi - 0.875)); // +1 while the near hand is up (weight on the far hand)
  const wiggle = clamp(sway / 0.16, -1, 1);

  // Posture of an infant on all fours: hips over the knees, shoulders over the hands, the back gently rounded,
  // shoulders a touch higher than the hips (the arms are nearly straight), and the head lifted to look ahead.
  // Kneeling up raises the shoulders well above the hips. While stroking he leans in toward the go-saap.
  const lean = sW * (1 - k);
  // P1: he sits back on his heels (the hips drop back toward his feet, the trunk comes up); P2: he lifts his chest a little
  const sit = pl.sit;
  const Hx = lerp(-24, -14, k) + 0.5 * rock + 9 * sway + 6 * lean - 12 * sit;
  const Hy = -57 - 4 * k - settle + mv * 1.2 * kneeUp - 0.5 * bounce + 21 * sit;
  const Sx = lerp(22, -8, k) + rock + 20 * lean - 26 * sit - 2 * pl.lift;
  const Sy = -64 - 50 * k - settle + mv * 1.6 * handUp + 5 * lean - bounce - 16 * sit - 2.5 * pl.lift;
  const groundF = FAR_SH[1] + 1;

  // Gentle stroke: the hand slides along the go-saap's back ridge from neck toward shoulders and back.
  // (the narrated stroke runs on a 34-frame cycle; the resting stroke in the breath is slower, 46 frames, and
  // starts after the narrated one has fully let go, so the switch is never seen)
  // (in P3 the stroke goes on, slower, on the life clock: strokeX)
  const strokeT =
    f < REST_FROM
      ? 0.5 + 0.5 * Math.sin(2 * Math.PI * ((f - 317) / 34 + lx.strokeX))
      : 0.5 - 0.5 * Math.cos((2 * Math.PI * (f - REST_FROM)) / 46);
  // Overlapping action: each shoulder lifts and reaches a little ahead of its hand's swing (the forearm and hand follow).
  const crawlArms = mv * (1 - k) * (1 - sW);
  const leadN = crawlArms * shoulderLead(rhS);
  const leadF = mv * (1 - k) * shoulderLead(lhS);
  // The other hand balances while he pets: weight settles onto the far hand as the stroking hand reaches forward.
  const balance = lean * (0.55 + 0.45 * strokeT);

  const hipN: V2 = [Hx, Hy - 1.8 * wiggle];
  const hipF: V2 = [Hx + FAR_HIP[0], Hy + FAR_HIP[1] + 1.8 * wiggle];
  const shN: V2 = [Sx + 2.4 * leadN, Sy - 2.4 * roll - 1.7 * leadN];
  const shF: V2 = [Sx + FAR_SH[0] + 2.2 * leadF, Sy + FAR_SH[1] + 2.4 * roll - 1.5 * leadF + 1.4 * balance];

  const kN = kneeAt(rkS, hipN[0], hipN[1]);
  const kF = kneeAt(lkS, hipF[0], hipF[1], FAR_HIP[1], FAR_HIP[0]);
  // little kicks of the feet behind him while he plays (zero during the crawl and while kneeling up)
  const kickN = kickAt(f, 0) * (1 - k) * (1 - mv) * (1 - w3);
  const kickF = 0.85 * kickAt(f, 12) * (1 - k) * (1 - mv) * (1 - w3);
  const footN = kickN > 0.001 ? kickFoot(kN.k, kickN) : kN.foot;
  const footF = kickF > 0.001 ? kickFoot(kF.k, kickF) : kF.foot;

  // Hand targets, in local units. Each one is blended in by its own weight. Palms rest just above the ground
  // line; a lifted hand rises up to 9 units and comes back down flat.
  // (the wrist trails early in each swing and catches up before the palm lands; planted hands are untouched)
  const contactN: [number, number] = [rhS.rel + mv * wristTrail(rhS), -5.5 - 9 * rhS.lift];
  const contactF: [number, number] = [lhS.rel + FAR_SH[0] + mv * wristTrail(lhS), -5.5 + groundF - 9 * lhS.lift];
  const chestN: [number, number] = [Sx + 14, Sy + 30];
  const chestF: [number, number] = [Sx + 18, Sy + 30];
  const strokeN: [number, number] = [
    lerp((strokeA(f, lx).x - Xw) / FIG_S, (strokeB(f, lx).x - Xw) / FIG_S, strokeT),
    lerp((strokeA(f, lx).y - GROUND) / FIG_S, (strokeB(f, lx).y - GROUND) / FIG_S, strokeT),
  ];

  let handN = mix2(contactN, chestN, k);
  handN = mix2(handN, strokeN, sW);
  // pats: the flat hand lifts and comes back down (on its neck while stroking, on the sand during the giggle)
  handN = [handN[0], handN[1] - pat.lift];
  let handF = mix2(contactF, chestF, k);
  // P1: as he sits back, each hand lifts off the sand in a small arc and comes to rest on the top of its thigh (contact
  // all the way: planted on the sand, then on the thigh), and goes back down to exactly the same spot before he leans
  // forward again
  if (pl.hands > 0) {
    const kneeNow = kneeAt(rkS, hipN[0], hipN[1]).k;
    const kneeNowF = kneeAt(lkS, hipF[0], hipF[1], FAR_HIP[1], FAR_HIP[0]).k;
    const thighN: [number, number] = [lerp(hipN[0], kneeNow[0], 0.55) + 4, lerp(hipN[1], kneeNow[1], 0.55) - 10];
    const thighF: [number, number] = [lerp(hipF[0], kneeNowF[0], 0.55) + 4, lerp(hipF[1], kneeNowF[1], 0.55) - 10];
    const arc = 7 * Math.sin(Math.PI * pl.hands);
    handN = mix2(handN, thighN, pl.hands);
    handN = [handN[0], handN[1] - arc];
    handF = mix2(handF, thighF, pl.hands);
    handF = [handF[0], handF[1] - arc];
  }

  // The elbows bend softly and point back toward the knees: never locked straight.
  const armN = ik2(shN[0], shN[1], handN[0], handN[1], ARM_UP, ARM_FORE);
  const armF = ik2(shF[0], shF[1], handF[0], handF[1], ARM_UP, ARM_FORE);

  // Head: looks back over the shoulder at the go-saaps (cue 165-241: 158 to 261), giggles at
  // "not scared at all" (cue 529-572: 522 to 592), and turns to the go-saap while stroking it.
  // In the two crawl pauses he lifts his head and glances around (toward the camera, then up).
  const lookA = lookBackAt(f);
  const lookB = ramp(f, 522, 542) - ramp(f, 572, 592);
  const around = clamp(lookAroundAt(f)) * (1 - clamp(lookA + lookB));

  // Expression: wonder at the first sight of the go-saaps (a soft "O", brows up), delight as he reaches them (an eye
  // smile, a soft giggle lifting the cheeks), calm tenderness while he pets (soft lids, a faint smile), and a little
  // babble now and then. Always gentle: the smile is capped well short of a grin.
  const wonder = wonderAt(f) * (1 - 0.6 * Math.max(pl.ahead, pl.behind));
  const chuckle = chuckleAt(f);
  const bab = babbleAt(f);
  const tender = clamp(sW) * (1 - clamp(1.4 * laugh)) * (1 - chuckle);
  const giggle = clamp((0.7 * lookA + lookB) * (1 - wonder) + sWPlay * 0.5 + 0.3 * rest, 0, 1);

  // Curiosity: the eyes lead and the head follows a few frames behind; the head turns slightly with each stride,
  // toward the hand that is reaching.
  const g0 = withPauseGaze(gazeAt(f), plE);
  const gH1 = withPauseGaze(gazeAt(f - 4), pl);
  const gH2 = withPauseGaze(gazeAt(f - 8), pl);
  const headYaw = 0.5 * (gH1.yaw + gH2.yaw);
  const yaw = headYaw + mv * 0.07 * Math.sin(2 * Math.PI * phi + 0.5);
  const eyeLead = clamp(g0.yaw - headYaw, -0.6, 0.6);
  // The head is held up to look ahead, as a crawling baby does: the chin up, the head sitting just above
  // and ahead of the shoulders on a short baby neck. It bobs with each stride, and breathes softly when he is still.
  const headBob = mv * 2.2 * Math.sin(2 * Math.PI * phi * 2 + 0.8) + (1 - mv) * 0.6 * Math.sin(lx.t * 0.05);
  // sitting back, the head rides over the shoulders as in the kneel
  const kH = Math.max(k, 0.8 * sit);
  const ox = lerp(Sx + 21, Sx + 8, kH);
  const oy = lerp(Sy - 33, Sy - 36, kH) + headBob + 2.5 * sW - 3 * around - 1.5 * wonder - 3 * pl.up - 2.5 * pl.lift;
  // a soft, gentle laugh: the lips part a little on each "ha", never a wide open grin
  const laughOpen = 0.04 + 0.18 * giggle * (0.75 + 0.25 * Math.sin(f * 0.9)) + 0.12 * laugh * pulse + 0.12 * chuckle * pulse;
  const mouthOpen = lerp(laughOpen, 0.3, wonder) + bab.open * (1 - wonder);
  const mouthRound = clamp(lerp(0.1, 0.8, wonder) + bab.round * (1 - wonder));
  // a peaceful, knowing calm at rest; a warmer (still gentle) smile at the giggles; fainter and softer while petting
  const smile = clamp(lerp(0.55 + 0.18 * giggle + 0.05 * sW + 0.08 * laugh + 0.1 * chuckle - 0.1 * tender - 0.05 * bab.open, 0.24, wonder), 0, 0.8);
  const squint = clamp(
    0.14 + (smile - 0.55) * 0.8 + 0.24 * laugh * (0.75 + 0.25 * pulse) + 0.22 * chuckle * (0.8 + 0.2 * pulse) + 0.1 * tender - 0.18 * wonder,
    0.02,
    0.55,
  );

  return {
    f: lx.t,
    Xw,
    Hx,
    Hy,
    Sx,
    Sy,
    kneeN: kN.k,
    footN,
    kneeF: kF.k,
    footF,
    elbowN: armN.elbow,
    wristN: armN.wrist,
    elbowF: armF.elbow,
    wristF: armF.wrist,
    ox,
    oy,
    headTilt:
      lerp(-11, 0, kH) * (1 - 0.6 * sW) +
      2 * Math.sin(lx.t * 0.031) -
      4 * around +
      mv * 1.2 * Math.sin(2 * Math.PI * phi * 2 + 0.2) +
      2.5 * laugh * (pulse - 0.5) +
      0.5 * (gH1.tilt + gH2.tilt) -
      3 * wonder +
      3 * tender,
    yaw,
    eyeX: clamp(lerp(lerp(0.35, -0.1, around), -0.3, clamp(lookA + lookB + plE.back + plE.behind)) + 0.8 * eyeLead, -1, 1),
    smile: clamp(smile + 0.06 * (pl.ahead + pl.behind) + 0.04 * w3, 0, 0.8),
    mouth: { open: mouthOpen, width: lerp(0.95, 0.72, wonder) - 0.1 * bab.round, round: mouthRound, teeth: 0 },
    // slow, natural blinks; soft, slightly lowered lids while he pets
    close: Math.max(babyBlink(lx.t), 0.12 * tender + 0.05 * rest + 0.1 * w3),
    brow: 0.12 + 0.1 * laugh + 0.5 * wonder + 0.08 * chuckle - 0.04 * tender,
    cheeks: clamp(0.38 + 0.28 * giggle + 0.15 * laugh + 0.22 * chuckle + 0.06 * tender),
    gasp: 0.32 * wonder,
    squint,
    eyeY: g0.eyeY,
    swingN: crawlArms * rhS.t,
    swingF: mv * (1 - k) * lhS.t,
    curlN: clamp(crawlArms * swingCurl(rhS) + 0.5 * k * (1 - sW) + 0.45 * clamp(pat.lift / 7) + 0.4 * pl.hands),
    curlF: clamp(mv * (1 - k) * swingCurl(lhS) + 0.5 * k + 0.4 * pl.hands),
    settleN: crawlArms * fingerSettle(rhS),
    settleF: mv * (1 - k) * fingerSettle(lhS),
    bellySway: clamp(hipSwayAt(f - 3) / 0.16, -1, 1),
    bellyJig: clamp(mv * Math.sin(2 * Math.PI * phi * 2 - 0.6) + 0.8 * laugh * (pulse - 0.5), -1, 1),
    sway: Math.sin(lx.t * 0.07) * 1.2,
    clothLag: clamp(hipSwayAt(f - 4) / 0.16, -1, 1),
    kneel: Math.max(k, 0.8 * sit),
    shN,
    shF,
    hipN,
    hipF,
    landN: rhS.land * mv + pat.land,
    landF: lhS.land * mv + 0.3 * balance,
    wiggle,
    groundF,
    laugh,
    pulse,
    flatN: sW,
  };
};

/* ------------------------------------------------------------------ */
/* Balak, crawling and kneeling                                        */
/* ------------------------------------------------------------------ */

type V2 = [number, number];
const fmt = (p: V2) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

/** Closed smooth outline through the points (Catmull-Rom turned into cubic Bezier segments). */
const smoothClosed = (p: V2[]) => {
  const n = p.length;
  let d = `M ${fmt(p[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1: V2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: V2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return `${d} Z`;
};

/** Open smooth line through the points (for creases, folds and highlights). */
const smoothOpen = (p: V2[]) => {
  const n = p.length;
  let d = `M ${fmt(p[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(n - 1, i + 2)];
    const c1: V2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: V2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return d;
};

/**
 * A soft, tapered limb segment: radius ra at a, rb at b, with round ends (a chubby baby limb, not a stick).
 * Drawn as one closed capsule outline (the two outer tangent lines joined by the end arcs), so there is no
 * seam where a body polygon would meet its end circles. A thin stroke in the same colour closes any
 * anti-aliasing gap where two segments overlap.
 */
const Taper: React.FC<{ a: V2; b: V2; ra: number; rb: number; col: string }> = ({ a, b, ra, rb, col }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  if (l <= Math.abs(ra - rb) + 0.01) {
    // one end swallows the other: the segment is just the larger circle
    const big = ra >= rb ? { c: a, r: ra } : { c: b, r: rb };
    return <circle cx={big.c[0]} cy={big.c[1]} r={big.r} fill={col} stroke={col} strokeWidth={0.6} />;
  }
  const ux = dx / l;
  const uy = dy / l;
  const nx = -uy;
  const ny = ux;
  // outer tangents: the tangent normal leans toward the narrow end by asin((ra - rb) / l)
  const sn = (ra - rb) / l;
  const cs = Math.sqrt(Math.max(0, 1 - sn * sn));
  const m1: V2 = [nx * cs + ux * sn, ny * cs + uy * sn];
  const m2: V2 = [-nx * cs + ux * sn, -ny * cs + uy * sn];
  const a1: V2 = [a[0] + m1[0] * ra, a[1] + m1[1] * ra];
  const b1: V2 = [b[0] + m1[0] * rb, b[1] + m1[1] * rb];
  const b2: V2 = [b[0] + m2[0] * rb, b[1] + m2[1] * rb];
  const a2: V2 = [a[0] + m2[0] * ra, a[1] + m2[1] * ra];
  // the arc round b spans pi - 2 asin(sn) (less than half a turn when b is the narrow end); round a the rest
  const largeB = sn < 0 ? 1 : 0;
  const largeA = sn > 0 ? 1 : 0;
  const d = `M ${fmt(a1)} L ${fmt(b1)} A ${rb.toFixed(2)} ${rb.toFixed(2)} 0 ${largeB} 0 ${fmt(b2)} L ${fmt(a2)} A ${ra.toFixed(2)} ${ra.toFixed(2)} 0 ${largeA} 0 ${fmt(a1)} Z`;
  return <path d={d} fill={col} stroke={col} strokeWidth={0.6} strokeLinejoin="round" />;
};

/** Size of his hands (the shared hand's L): about 15 units wrist to fingertip, 10 across the palm. */
const BABY_HAND_L = 22;
/** How far a hand's wrist sits back inside the end of the forearm (local units), so the palm overlaps the wrist roll. */
const HAND_TUCK = 3;
/**
 * His hand: the shared hand (src/cinematic/rig/Hand.tsx, MOT-19) in its baby variant, palm down. (x, y) is the wrist,
 * dir the direction the fingers point. Seen from his right side and a little above, the near (right) hand shows its back
 * with the thumb on the far side (up on screen) and the far (left) hand shows its back with the thumb toward us (down on
 * screen): side -1 for the near hand, +1 for the far hand, in the shared hand's back view. curl (0 open .. 1 softly curled)
 * and settle (a small damped spread after a palm lands) drive the shared hand's finger flex.
 */
const Hand: React.FC<{ x: number; y: number; dir: number; side: 1 | -1; col: string; shade: string; curl?: number; settle?: number }> = ({
  x,
  y,
  dir,
  side,
  col,
  shade,
  curl = 0,
  settle = 0,
}) => {
  const deg = (dir * 180) / Math.PI - 90; // the shared hand's fingers point down its +y
  const flex = Math.max(0, 9 * clamp(curl) - 2.5 * settle);
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(2)}) translate(0 ${-HAND_TUCK})`}>
      <SharedHand shape="open" L={BABY_HAND_L} skin={col} shade={shade} side={side} baby flex={flex} view="back" />
    </g>
  );
};

/** Unit direction toward the sun in figure space (ahead, +x, and up): limbs are lit on this side, shaded on the other. */
const SUN: V2 = [1 / Math.hypot(1, 0.6), -0.6 / Math.hypot(1, 0.6)];

/**
 * One continuous, chubby two-segment limb (upper arm + forearm, or thigh + shin) from the IK joints a (root), j (elbow /
 * knee) and b (wrist / ankle), as a single closed soft outline, so the joint never shows a seam (the same approach as
 * the newborn's softLimb in Divine.tsx, here in figure space). Radii: ra at the root, rm1 mid upper segment (baby fat),
 * rj at the joint, rm2 mid lower segment, rb at the end. The outer side of the bend stays round; the inner side folds
 * into a soft crease. `edge` is the same outline as an open line without the root cap (for the inner light and shade,
 * so no shading arc is drawn where the limb meets the trunk).
 */
interface LimbGeo {
  outline: string;
  edge: string;
  j: V2;
  nb: V2;
  inner: 1 | -1;
  rj: number;
  d1: V2;
  d2: V2;
  n1: V2;
  n2: V2;
  L1: number;
  L2: number;
  /** Point at fraction t along segment 1 (seg 1) or segment 2 (seg 2), offset q (in radii) toward side +n. */
  at: (seg: 1 | 2, t: number, q: number) => V2;
}
const limbGeo = (a: V2, j: V2, b: V2, ra: number, rm1: number, rj: number, rm2: number, rb: number): LimbGeo => {
  const L1 = Math.hypot(j[0] - a[0], j[1] - a[1]) || 1;
  const L2 = Math.hypot(b[0] - j[0], b[1] - j[1]) || 1;
  const d1: V2 = [(j[0] - a[0]) / L1, (j[1] - a[1]) / L1];
  const d2: V2 = [(b[0] - j[0]) / L2, (b[1] - j[1]) / L2];
  const n1: V2 = [-d1[1], d1[0]];
  const n2: V2 = [-d2[1], d2[0]];
  const sx = n1[0] + n2[0];
  const sy = n1[1] + n2[1];
  const sl = Math.hypot(sx, sy);
  const nb: V2 = sl > 1e-3 ? [sx / sl, sy / sl] : [-d1[0], -d1[1]];
  const cosH = Math.max(0.3, sl / 2);
  const inner: 1 | -1 = d2[0] * n1[0] + d2[1] * n1[1] > 0 ? 1 : -1;
  const mv = (p: V2, v: V2, k: number): V2 => [p[0] + v[0] * k, p[1] + v[1] * k];
  // radius profile along each segment: root -> mid bulge -> joint, joint -> mid -> end
  const rad1 = (t: number) => (t < 0.5 ? lerp(ra, rm1, sstep(t / 0.5)) : lerp(rm1, rj, sstep((t - 0.5) / 0.5)));
  const rad2 = (t: number) => (t < 0.5 ? lerp(rj, rm2, sstep(t / 0.5)) : lerp(rm2, rb, sstep((t - 0.5) / 0.5)));
  const at = (seg: 1 | 2, t: number, q: number): V2 =>
    seg === 1 ? mv(mv(a, d1, L1 * t), n1, q * rad1(t)) : mv(mv(j, d2, L2 * t), n2, q * rad2(t));
  const side = (s: number): V2[] => {
    const pts: V2[] = [at(1, 0, s), at(1, 0.3, s), at(1, 0.55, s)];
    if (s === inner) {
      // the inner side of the bend folds in: one soft point on the bisector (a rounded miter)
      pts.push(mv(j, nb, s * rj * Math.min(1 / cosH, 1.22)));
    } else {
      // the outer side stays round over the elbow / knee
      const e1 = 1 - Math.min(0.22, (rj * 0.6) / L1);
      const e2 = Math.min(0.22, (rj * 0.6) / L2);
      pts.push(at(1, e1, s), mv(j, nb, s * rj * 1.03), at(2, e2, s));
    }
    pts.push(at(2, 0.45, s), at(2, 0.75, s), at(2, 1, s));
    return pts;
  };
  const endCap = [0.25, 0.5, 0.75].map((q): V2 => {
    const th = Math.PI * q;
    return [b[0] + rb * (n2[0] * Math.cos(th) + d2[0] * Math.sin(th)), b[1] + rb * (n2[1] * Math.cos(th) + d2[1] * Math.sin(th))];
  });
  const rootCap = [0.25, 0.5, 0.75].map((q): V2 => {
    const th = Math.PI * q;
    return [a[0] + ra * (-n1[0] * Math.cos(th) - d1[0] * Math.sin(th)), a[1] + ra * (-n1[1] * Math.cos(th) - d1[1] * Math.sin(th))];
  });
  const sp = side(1);
  const sm = side(-1).reverse();
  const outline = smoothClosed([...sp, ...endCap, ...sm, ...rootCap]);
  const edge = smoothOpen([...sp.slice(1), ...endCap, ...sm.slice(0, -1)]);
  return { outline, edge, j, nb, inner, rj, d1, d2, n1, n2, L1, L2, at };
};

/**
 * Draws a limb from limbGeo: one fill, then (clipped to the outline, so nothing pokes out) a soft blurred shade band on
 * the side away from the sun and a soft light band on the sun side, both continuous through the joint. Creases and
 * dimples go in as children, clipped too.
 */
const SoftLimb: React.FC<{
  id: string;
  g: LimbGeo;
  rm: number;
  col: string;
  shade: string;
  light: string;
  shadeOp?: number;
  lightOp?: number;
  children?: React.ReactNode;
}> = ({ id, g, rm, col, shade, light, shadeOp = 0.42, lightOp = 0.4, children }) => {
  const k = rm * 0.34;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={g.outline} />
        </clipPath>
      </defs>
      <path d={g.outline} fill={col} />
      <g clipPath={`url(#${id})`}>
        <path
          d={g.edge}
          transform={`translate(${(SUN[0] * k).toFixed(2)} ${(SUN[1] * k).toFixed(2)})`}
          stroke={shade}
          strokeWidth={k * 2.3}
          fill="none"
          opacity={shadeOp}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#s03-limb-soft)"
        />
        <path
          d={g.edge}
          transform={`translate(${(-SUN[0] * k * 0.8).toFixed(2)} ${(-SUN[1] * k * 0.8).toFixed(2)})`}
          stroke={light}
          strokeWidth={k * 1.5}
          fill="none"
          opacity={lightOp}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#s03-limb-soft)"
        />
        {children}
      </g>
    </g>
  );
};

/**
 * A soft partial crease across a limb (a faint curved line, never a gap): at fraction t of segment seg, starting at
 * the limb edge on side s and running in to `reach` (in radii, e.g. -0.2 = just past the middle), bowed by `bow`
 * along the bone.
 */
const softCrease = (g: LimbGeo, seg: 1 | 2, t: number, s: number, reach: number, bow: number) => {
  const p1 = g.at(seg, t, s * 0.98);
  const p2 = g.at(seg, t, s * reach);
  const m = g.at(seg, t, s * (0.98 + reach) * 0.5);
  const d = seg === 1 ? g.d1 : g.d2;
  return `M ${fmt(p1)} Q ${fmt([m[0] + d[0] * bow, m[1] + d[1] * bow])} ${fmt(p2)}`;
};
/** The side (+1 / -1 of segment seg's normal) that faces away from the sun. */
const shadowSide = (g: LimbGeo, seg: 1 | 2): 1 | -1 => {
  const n = seg === 1 ? g.n1 : g.n2;
  return n[0] * SUN[0] + n[1] * SUN[1] > 0 ? -1 : 1;
};
/**
 * The soft fold on the inner side of a bent joint j: a short curved line from the inner edge (from, in joint radii)
 * in toward the bone (to), bowing gently along the upper segment so it reads as a fat fold, not a cut.
 */
const foldAt = (g: LimbGeo, j: V2, from: number, to: number) => {
  const k = g.inner * g.rj;
  const p1: V2 = [j[0] + g.nb[0] * k * from, j[1] + g.nb[1] * k * from];
  const p2: V2 = [j[0] + g.nb[0] * k * to, j[1] + g.nb[1] * k * to];
  const m: V2 = [j[0] + g.nb[0] * k * (from + to) * 0.5 - g.d1[0] * g.rj * 0.22, j[1] + g.nb[1] * k * (from + to) * 0.5 - g.d1[1] * g.rj * 0.22];
  return `M ${fmt(p1)} Q ${fmt(m)} ${fmt(p2)}`;
};

/** A plain round-capped segment, used by the cow's legs. */
const Bone: React.FC<{ a: [number, number]; b: [number, number]; w: number; col: string; op?: number }> = ({ a, b, w, col, op = 1 }) => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={w} strokeLinecap="round" opacity={op} />
);

const SOLE = "#ebbba1";

/**
 * A crawling baby's leg: a fat thigh down to the knee, the shin lying back along the ground, and the foot
 * resting on its top with the sole turned up and the toes at the far end. `ankle` is the end of the shin.
 */
/**
 * A fat crease across a limb: a short curved line at fraction t of the segment a..b, spanning the limb width
 * w on each side, bowed toward `bow` (positive = toward the segment's left normal).
 */
const Crease: React.FC<{ a: V2; b: V2; t: number; w: number; bow: number; col: string; op?: number; sw?: number }> = ({ a, b, t, w, bow, col, op = 0.4, sw = 1.1 }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  const nx = -uy;
  const ny = ux;
  const c: V2 = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const p1: V2 = [c[0] + nx * w, c[1] + ny * w];
  const p2: V2 = [c[0] - nx * w, c[1] - ny * w];
  const q: V2 = [c[0] + ux * bow, c[1] + uy * bow];
  return <path d={`M ${fmt(p1)} Q ${fmt(q)} ${fmt(p2)}`} stroke={col} strokeWidth={sw} fill="none" opacity={op} strokeLinecap="round" />;
};

/**
 * A crawling infant's leg: a short, very fat thigh down to the knee, the chubby shin lying back along the
 * ground, and the foot resting on its top with the sole turned up and the toes curled down at the far end.
 * Fat creases ring the thigh, the back of the knee and the ankle. `ankle` is the end of the shin.
 */
const Leg: React.FC<{ id: string; hip: V2; knee: V2; ankle: V2; col: string; shade: string; light?: string }> = ({ id, hip, knee, ankle, col, shade, light = SKIN_L }) => {
  const dir = Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]);
  let px = -Math.sin(dir);
  let py = Math.cos(dir);
  if (py > 0) {
    px = -px;
    py = -py;
  } // (px, py) is the side of the foot that faces up: the sole
  const cx = Math.cos(dir);
  const cy = Math.sin(dir);
  const deg = (dir * 180) / Math.PI;
  const fc: V2 = [ankle[0] + cx * 9, ankle[1] + cy * 9 + 0.5];
  const sole: V2 = [fc[0] + px * 2, fc[1] + py * 2];
  const toeBase: V2 = [ankle[0] + cx * 18.5, ankle[1] + cy * 18.5];
  const heel: V2 = [ankle[0] + cx * 2.5 + px * 3.2, ankle[1] + cy * 2.5 + py * 3.2];
  const ball: V2 = [ankle[0] + cx * 14.5 + px * 2.4, ankle[1] + cy * 14.5 + py * 2.4];
  // five little toes across the end of the foot, the big toe on the upturned sole side, each with a soft pad
  const TOES: Array<[number, number]> = [
    [3.9, 2.9],
    [1.6, 2.35],
    [-0.4, 2.2],
    [-2.3, 2.0],
    [-4.0, 1.75],
  ];
  // the whole leg, thigh to ankle, is one soft outline (no seam at the knee)
  const g = limbGeo(hip, knee, ankle, 15, 15.5, 10, 9.6, 6.2);
  const s1 = shadowSide(g, 1);
  const s2 = shadowSide(g, 2);
  // the round knee: on the outer side of the bend
  const kneeCap: V2 = [knee[0] - g.nb[0] * g.inner * g.rj * 0.4, knee[1] - g.nb[1] * g.inner * g.rj * 0.4];
  const kneeFold = foldAt(g, knee, 1.05, 0.4);
  return (
    <g>
      <SoftLimb id={id} g={g} rm={11} col={col} shade={shade} light={light}>
        {/* a faint fat roll on the thigh, from its shaded side only */}
        <path d={softCrease(g, 1, 0.45, s1, 0.1, -2)} stroke={shade} strokeWidth={0.9} fill="none" opacity={0.2} strokeLinecap="round" />
        {/* the soft fold behind the knee, on the inner side of the bend */}
        <path d={kneeFold} stroke={shade} strokeWidth={0.9} fill="none" opacity={0.26} strokeLinecap="round" />
        {/* the round knee: a soft light over the kneecap and a tiny dimple */}
        <ellipse cx={kneeCap[0]} cy={kneeCap[1] - 1.5} rx={5.5} ry={3.4} fill={light} opacity={0.18} filter="url(#s03-limb-soft)" />
        <circle cx={kneeCap[0] + 0.8} cy={kneeCap[1]} r={0.8} fill={shade} opacity={0.28} />
        {/* the ankle: one faint fat-bracelet crease, part-way round from the shaded side */}
        <path d={softCrease(g, 2, 0.84, s2, 0, 1.4)} stroke={shade} strokeWidth={0.8} fill="none" opacity={0.22} strokeLinecap="round" />
      </SoftLimb>
      {/* the foot, lying on its top, the sole turned up (same skin, no outline, so it flows from the ankle) */}
      <ellipse cx={fc[0]} cy={fc[1]} rx={12} ry={6} transform={`rotate(${deg} ${fc[0]} ${fc[1]})`} fill={col} />
      <ellipse cx={fc[0] - px * 2.2} cy={fc[1] - py * 2.2} rx={10} ry={2.6} transform={`rotate(${deg} ${fc[0]} ${fc[1]})`} fill={shade} opacity={0.3} filter="url(#s03-limb-soft)" />
      <ellipse cx={sole[0]} cy={sole[1]} rx={9.4} ry={3.2} transform={`rotate(${deg} ${sole[0]} ${sole[1]})`} fill={SOLE} opacity={0.9} />
      {/* plump heel and ball pads on the sole, with a soft crease across the arch */}
      <ellipse cx={heel[0]} cy={heel[1]} rx={3.6} ry={2.4} transform={`rotate(${deg} ${heel[0]} ${heel[1]})`} fill="#f6d2bb" opacity={0.6} filter="url(#s03-limb-soft)" />
      <ellipse cx={ball[0]} cy={ball[1]} rx={3.4} ry={2.2} transform={`rotate(${deg} ${ball[0]} ${ball[1]})`} fill="#f6d2bb" opacity={0.55} filter="url(#s03-limb-soft)" />
      <path
        d={`M ${fmt([sole[0] + px * 2.2 + cx * 1, sole[1] + py * 2.2 + cy * 1])} Q ${fmt([sole[0] + cx * 2.4, sole[1] + cy * 2.4])} ${fmt([sole[0] - px * 1.6 + cx * 0.6, sole[1] - py * 1.6 + cy * 0.6])}`}
        stroke={shade}
        strokeWidth={0.6}
        fill="none"
        opacity={0.35}
      />
      {/* five little toes, curled under toward the ground, with soft pads on the sole side */}
      {TOES.map(([o, rad], i) => {
        const tx = toeBase[0] + px * o - py * 0.6 + cx * (i === 0 ? 0.8 : -0.15 * i);
        const ty = toeBase[1] + py * o + 1.4 + cy * (i === 0 ? 0.8 : -0.15 * i);
        return (
          <g key={i}>
            <circle cx={tx} cy={ty} r={rad} fill={col} />
            <circle cx={tx + px * rad * 0.35} cy={ty + py * rad * 0.35} r={rad * 0.55} fill={SOLE} opacity={0.75} />
            <circle cx={tx - px * rad * 0.4 + 0.3} cy={ty - py * rad * 0.4 + 0.4} r={rad * 0.45} fill={shade} opacity={0.18} />
          </g>
        );
      })}
      <path d={`M ${fmt([toeBase[0] - cx * 2 + px * 4, toeBase[1] - cy * 2 + py * 4])} L ${fmt([toeBase[0] - cx * 2 - px * 4, toeBase[1] - cy * 2 - py * 4])}`} stroke={shade} strokeWidth={0.8} opacity={0.35} />
    </g>
  );
};

/**
 * A crawling infant's arm: a short, chubby upper arm and forearm with the elbow softly bent (an elbow dimple),
 * a deep fat crease at the wrist, and a small pudgy hand that slaps down flat.
 */
const Arm: React.FC<{
  id: string;
  sh: V2;
  el: V2;
  wr: V2;
  col: string;
  shade: string;
  light?: string;
  land?: number;
  gy?: number;
  flat?: number;
  swing?: number;
  curl?: number;
  settle?: number;
  side: 1 | -1;
}> = ({ id, sh, el, wr, col, shade, light = SKIN_L, land = 0, gy = 0, flat = 0, swing = 0, curl = 0, settle = 0, side }) => {
  // A wrist on the ground lays the palm flat with the fingers fanned forward along the ground, and the palm
  // is pressed a little (squashed about the wrist), more so just after it slaps down. Lifted hands relax the fan.
  // gy is this side's ground line (the far side sits higher on screen). `flat` lays the palm flat and fanned
  // off the ground too (on the go-saap's back while he strokes and pats it); 0 leaves the hand as it was.
  // Overlapping action: in the swing the hand trails the forearm, drooping at the wrist with the fingers curled,
  // then opens out flat just before it lands; after landing the fingers settle (a small damped spread).
  const onGround = clamp(1 - (-(wr[1] - gy) - 6) / 10);
  const fa = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  const flatK = flat * (1 - onGround);
  const droop = 0.55 * Math.sin(Math.PI * clamp(swing)) * (1 - 0.6 * clamp(swing));
  const dir = lerp(lerp(fa + droop * (Math.cos(fa) >= 0 ? 1 : -1), 0.05, onGround), 0.14, flatK);
  // a palm lying flat (on the sand or on the go-saap) is seen from a little above: foreshortened across its width
  const press = (1 - 0.14 * onGround - 0.12 * land) * (1 - 0.3 * Math.max(onGround, flatK));
  // the whole arm, shoulder to wrist, is one soft outline (no seam at the elbow)
  const g = limbGeo(sh, el, wr, 11, 11.2, 8.4, 8.6, 5.6);
  const s1 = shadowSide(g, 1);
  const ii = g.inner;
  const elbowFold = foldAt(g, el, 1.05, 0.45);
  const dimple: V2 = [el[0] - g.nb[0] * ii * g.rj * 0.5, el[1] - g.nb[1] * ii * g.rj * 0.5];
  // a fold only shows when the elbow is bent enough to fold
  const bend = Math.abs(g.d1[0] * g.n2[0] + g.d1[1] * g.n2[1]);
  return (
    <g>
      <SoftLimb id={id} g={g} rm={8.6} col={col} shade={shade} light={light}>
        {/* a faint fat roll on the upper arm, from its shaded side only */}
        <path d={softCrease(g, 1, 0.45, s1, 0.15, -1.4)} stroke={shade} strokeWidth={0.8} fill="none" opacity={0.16} strokeLinecap="round" />
        {/* the soft fold inside the elbow and a little dimple on its outer side */}
        <path d={elbowFold} stroke={shade} strokeWidth={0.9} fill="none" opacity={0.26 * clamp(0.3 + bend * 1.5)} strokeLinecap="round" />
        <circle cx={dimple[0]} cy={dimple[1]} r={0.8} fill={shade} opacity={0.26} />
        {/* the wrist: one faint fat-bracelet crease from the palm side, part-way round */}
        <path d={softCrease(g, 2, 0.84, ii, 0.05, 1.2)} stroke={shade} strokeWidth={0.8} fill="none" opacity={0.22} strokeLinecap="round" />
      </SoftLimb>
      <g transform={`translate(${wr[0]}, ${wr[1]}) scale(${1 + 0.06 * land}, ${press}) translate(${-wr[0]}, ${-wr[1]})`}>
        <Hand x={wr[0]} y={wr[1]} dir={dir} side={side} col={col} shade={shade} curl={curl * (1 - 0.8 * onGround) * (1 - flatK)} settle={settle} />
      </g>
    </g>
  );
};

/**
 * Torso frame along the spine. s runs from the hip joint toward the shoulder joint; d runs across the body
 * (positive = belly side). When he crawls the belly side faces the ground; when he kneels up it faces forward.
 */
interface TorsoFrame {
  L: number;
  P: (s: number, d: number) => V2;
}
const torsoFrame = (r: Rig): TorsoFrame => {
  const L = Math.hypot(r.Sx - r.Hx, r.Sy - r.Hy) || 1;
  const ux = (r.Sx - r.Hx) / L;
  const uy = (r.Sy - r.Hy) / L;
  const nx = -uy;
  const ny = ux;
  return { L, P: (s, d) => [r.Hx + ux * s + nx * d, r.Hy + uy * s + ny * d] };
};

/** Bottom wiggle: the rear of the trunk lifts a little on one side and drops on the other (screen y offset). */
const wig = (r: Rig, p: V2, amt: number): V2 => [p[0], p[1] - 2.2 * r.wiggle * amt];

/**
 * An infant's trunk, not a tube: short and round. A rounded bottom behind the hips, a gently rounded back
 * (no adult dip), the shoulders, a full chest, and a soft round belly that hangs low toward the ground and
 * moves with breathing. The bottom wiggles with each knee.
 */
const torsoOutline = (r: Rig, T: TorsoFrame) => {
  const { L, P } = T;
  // a round infant belly that breathes, swings a few frames behind the hips and bounces softly with each stride
  const belly = (1 - 0.3 * r.kneel) * (1 + 0.035 * Math.sin(r.f * 0.21)) * (1 + 0.03 * r.bellyJig);
  const bs = 1.8 * r.bellySway * (1 - r.kneel);
  return smoothClosed([
    wig(r, P(-25, 2), 1),
    wig(r, P(-21, -13), 1),
    wig(r, P(-9, -22), 0.6),
    P(L * 0.3, -24),
    P(L * 0.68, -23.5),
    P(L * 0.98, -21),
    P(L + 11, -14),
    P(L + 16, -2),
    P(L + 12, 11),
    P(L * 0.78 + 0.5 * bs, 22 * belly + 1),
    P(L * 0.48 + bs, 29.5 * belly),
    P(L * 0.16 + 0.6 * bs, 25.5 * belly),
    wig(r, P(-11, 16), 0.8),
  ]);
};

/**
 * Langot: a soft cotton cloth wrapped loosely around the bottom and tied at the hip. It sits off the skin,
 * the lower edge and the leg opening hang under their own weight and swing a few frames behind the hips,
 * the waist is a rolled band with a small knot and a loose end, and folds run from the knot.
 */
const Langot: React.FC<{ r: Rig; T: TorsoFrame }> = ({ r, T }) => {
  const { L, P } = T;
  const tdx = r.kneeN[0] - r.hipN[0];
  const tdy = r.kneeN[1] - r.hipN[1];
  const tl = Math.hypot(tdx, tdy) || 1;
  let mx = -tdy / tl;
  let my = tdx / tl;
  if (mx > 0) {
    mx = -mx;
    my = -my;
  } // m points to the back of the thigh, toward the bottom
  const cuff: V2 = [r.hipN[0] + tdx * 0.3, r.hipN[1] + tdy * 0.3];
  const lag = r.clothLag;
  const hang = (p: V2, amt: number): V2 => [p[0] + lag * 2.4 * amt, p[1] + 3.2 * amt];
  // the cloth sits just off the round infant bottom, and wiggles with it
  const pts: V2[] = [
    P(L * 0.33, -26),
    P(L * 0.08, -25.8),
    wig(r, P(-11, -24.6), 0.6),
    wig(r, P(-23.5, -15.5), 1),
    hang(wig(r, P(-28, 2), 1), 0.4),
    hang(wig(r, P(-14, 19.5), 0.8), 0.9),
    hang([cuff[0] + mx * 18, cuff[1] + my * 18], 1),
    hang([cuff[0] - mx * 17, cuff[1] - my * 17], 0.8),
    P(L * 0.37, 29.5),
    P(L * 0.36, 2),
  ];
  const ys = pts.map((p) => p[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const knot = P(L * 0.36, 6);
  const tailEnd: V2 = [knot[0] + lag * 4 + 2, knot[1] + 15];
  const band = smoothOpen([P(L * 0.37, 29), P(L * 0.36, 2), P(L * 0.33, -25.4)]);
  const foldA = smoothOpen([knot, P(L * 0.12, -6), wig(r, P(-13, -11), 0.6)]);
  const foldB = smoothOpen([knot, [lerp(knot[0], cuff[0] + mx * 7, 0.55), lerp(knot[1], cuff[1] + my * 7, 0.55) + 2], hang([cuff[0] + mx * 11, cuff[1] + my * 11], 0.8)]);
  const foldC = smoothOpen([hang(wig(r, P(-21, 9), 1), 0.6), hang([lerp(P(-14, 19.5)[0], cuff[0], 0.5), lerp(P(-14, 19.5)[1], cuff[1], 0.5)], 0.9)]);
  const shine = smoothOpen([wig(r, P(-17, -18), 1), wig(r, P(-5, -25), 0.5), P(L * 0.2, -25.8)]);
  return (
    <g>
      <defs>
        <linearGradient id="s03-langot-g" gradientUnits="userSpaceOnUse" x1={0} y1={minY} x2={0} y2={maxY}>
          <stop offset={0} stopColor={DHOTI} />
          <stop offset={0.45} stopColor={DHOTI} />
          <stop offset={1} stopColor="#d3c6a8" />
        </linearGradient>
        <filter id="s03-langot-soft" x="-40%" y="-60%" width="180%" height="220%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
      </defs>
      {/* soft contact shadow where the leg opening meets the thigh */}
      <ellipse cx={cuff[0]} cy={cuff[1] + 5} rx={15} ry={3.4} fill="#2a1d14" opacity={0.2} filter="url(#s03-langot-soft)" />
      <path d={smoothClosed(pts)} fill="url(#s03-langot-g)" stroke="#cbbd9c" strokeWidth={0.8} />
      {/* folds running from the knot, with a light edge beside each crease */}
      <path d={foldA} stroke={DHOTI_S} strokeWidth={1.3} fill="none" opacity={0.75} />
      <path d={foldB} stroke={DHOTI_S} strokeWidth={1.2} fill="none" opacity={0.7} />
      <path d={foldC} stroke={DHOTI_S} strokeWidth={1.1} fill="none" opacity={0.6} />
      <path d={shine} stroke="#ffffff" strokeWidth={2.2} fill="none" opacity={0.7} strokeLinecap="round" />
      {/* rolled waistband */}
      <path d={band} stroke={DHOTI_S} strokeWidth={3} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d={band} stroke="#ffffff" strokeWidth={1.2} fill="none" opacity={0.7} strokeLinecap="round" transform="translate(-1 -1)" />
      {/* knot and its loose end, hanging under its own weight */}
      <Taper a={knot} b={tailEnd} ra={3.2} rb={2.4} col={DHOTI} />
      <path d={`M ${fmt([knot[0] + 1.5, knot[1] + 2])} L ${fmt([tailEnd[0] + 1, tailEnd[1] - 1])}`} stroke={DHOTI_S} strokeWidth={0.9} opacity={0.6} />
      <ellipse cx={knot[0]} cy={knot[1]} rx={4.6} ry={3.6} fill={DHOTI} stroke={DHOTI_S} strokeWidth={0.9} />
    </g>
  );
};

/** A soft light (or shade) line along one edge of a limb segment: the edge that faces +x and up (toward the sun). */
const sunEdge = (a: V2, b: V2, ra: number, rb: number): string => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  let nx = -dy / l;
  let ny = dx / l;
  if (nx - 0.6 * ny < 0) {
    nx = -nx;
    ny = -ny;
  } // pick the side facing the sun (ahead and above)
  return `M ${fmt([a[0] + nx * ra * 0.92, a[1] + ny * ra * 0.92])} L ${fmt([b[0] + nx * rb * 0.92, b[1] + ny * rb * 0.92])}`;
};

/**
 * A few slow motes of warm light rising around him (local units, moving with him). Each one drifts up over
 * about 7 to 9 seconds, sways a little, and fades in and out, so there are never more than a handful visible.
 */
const BalakMotes: React.FC<{ f: number; cx: number; level: number }> = ({ f, cx, level }) => (
  <g>
    {Array.from({ length: 6 }, (_, i) => {
      const period = 170 + 23 * i;
      const ph = (((f + i * 61) % period) + period) % period / period;
      const x = cx + lerp(-80, 95, hash01(i * 2.3 + 0.7)) + 7 * Math.sin(f * 0.021 + i * 1.9);
      const y = lerp(-6, -165, ph);
      const o = level * 0.6 * Math.pow(Math.sin(Math.PI * ph), 1.5);
      const rr = 1.1 + 0.9 * hash01(i * 5.1 + 3);
      return (
        <g key={i} opacity={o}>
          <circle cx={x} cy={y} r={rr * 3.2} fill={DIVINE.mid} opacity={0.22} />
          <circle cx={x} cy={y} r={rr} fill={DIVINE.core} />
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Baby Balak's head, drawn the restored newborn's way                 */
/* ------------------------------------------------------------------ */

/*
 * The shared 3D Head rig closed this face to a small pointed chin in three-quarter view (its lower face narrows to
 * a point on the head's axis, and the jaw shrinks with the yaw) and gave him a smooth hair helmet with a scalloped
 * edge, so he read as an older child. Here the head is drawn as the restored newborn's is (BabyFace in Divine.tsx),
 * so he is the same baby, a few months older: a big round cranium that a turn does not change, a full round lower
 * face whose far cheek bulges past the jaw line as he turns, a short soft chin and small jaw, features that slide
 * round the sphere with the turn, big warm brown eyes with one catchlight, a button nose, soft natural lips, and one
 * full soft mass of dark baby curls with the curls formed inside it and along its edge (nothing loose outside it).
 * Units: the newborn's head units (skull radius about 36.5), scaled to the old head's size.
 */
const GH_S = 0.95; // head units → figure units (about the old head's height)
const GH_DY = -2;
const GH_CY = -7; // skull sphere centre (head units)
const GH_R = 36.5; // skull sphere radius
const GH_TURN = 0.85; // share of the rig's yaw used for the drawn turn: a full three-quarter face, never a thin profile
const GH_YMAX = 0.5; // the drawn turn eases into this (soft cap, as the reference newborn face): both eyes always show
const GH_TURN_MAX = 0.45; // turn at which the lower-face silhouette, far-eye narrowing and near ear are complete
const GH_HAIR = "#26170F"; // the newborn's hair colours
const GH_HAIR_L = "#5E3D2A";
const GH_KS = 1; // the sun (key light) is on screen-right
const GH_RO = 38.4; // hair mass outer radius (just outside the skull), centre GH_OCY
const GH_OCY = -7.5;

type P2 = [number, number];
const g2 = (v: number) => (Math.round(v * 100) / 100).toString();
const gp = (q: P2) => `${g2(q[0])} ${g2(q[1])}`;

/**
 * Head outline for the softened turn ye (radians, + = face to screen-right; far side = +x). Same construction as
 * the reference newborn face (Divine.tsx `headPath`): the cranium never changes; only the lower face follows the
 * turn. The chin slides toward the turn (about half the mouth's shift), the FAR cheek grows by at most about 0.5-1
 * past its frontal line (a gentle round, never a lump), and the NEAR jaw becomes a longer, flatter curve.
 */
const ghOutline = (ye: number) => {
  const phi = clamp(Math.abs(ye) / GH_TURN_MAX);
  const sg = ye < 0 ? -1 : 1;
  // [frontal, fully turned right]; mirrored for a left turn
  const P = (fx: number, fy: number, tx: number, ty: number) => gp([lerp(fx, tx, phi) * sg, lerp(fy, ty, phi)]);
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

/** Natural infant hairline round the head: [azimuth (0 = front), y]. Over the ear, behind it, down to the nape. */
const GH_HL: Array<[number, number]> = [
  [0, -22.4],
  [0.45, -21.2],
  [0.9, -16.6],
  [1.2, -10.5],
  [1.36, -5.2],
  [1.62, -6.8],
  [1.85, -0.5],
  [2.2, 8.5],
  [2.7, 13.5],
  [Math.PI, 15],
];
const ghHairY = (a: number) => {
  const x = Math.min(Math.abs(a), Math.PI);
  for (let i = 0; i < GH_HL.length - 1; i++) {
    const [a0, y0] = GH_HL[i];
    const [a1, y1] = GH_HL[i + 1];
    if (x <= a1) return lerp(y0, y1, (x - a0) / (a1 - a0));
  }
  return GH_HL[GH_HL.length - 1][1];
};
/** A point on the skull sphere at azimuth a and height y, turned by ye: screen x and facing (cos). */
const ghSph = (a: number, y: number, ye: number, shell = 0) => {
  const rr = Math.sqrt(Math.max(0, (GH_R + shell) ** 2 - (y - GH_CY) ** 2));
  return { x: rr * Math.sin(a + ye), c: Math.cos(a + ye) };
};
/** Rounded curls inside the hair mass: [azimuth, y, r, start angle]. The back ones show as he turns. */
const GH_CURLS: Array<[number, number, number, number]> = [
  [0, -40.5, 3.7, 1.5],
  [-0.66, -38, 3.9, 0.9],
  [0.66, -38, 3.8, 2.0],
  [-0.3, -32, 3.1, 1.1],
  [0.3, -32, 3.1, 1.7],
  [-1.05, -32.5, 3.6, 0.4],
  [1.05, -32.5, 3.5, 2.4],
  [-0.8, -27.5, 3.3, 0.6],
  [0.8, -27.5, 3.1, 2.1],
  [-1.5, -24, 3.2, 0.1],
  [1.5, -24, 3.0, 2.6],
  [-1.7, -32, 3.4, 0.3],
  [1.7, -32, 3.4, 2.5],
  [-2.25, -28, 3.4, 0.2],
  [2.25, -28, 3.4, 2.7],
  [-2.85, -30, 3.3, 0.5],
  [2.85, -30, 3.3, 2.4],
  [-1.95, -19, 3.2, 0],
  [1.95, -19, 3.2, 2.8],
  [-2.55, -16, 3.3, -0.2],
  [2.55, -16, 3.3, 3.0],
  [Math.PI, -19, 3.4, 1.4],
  [-1.7, -12, 2.8, -0.3],
  [1.7, -12, 2.7, 2.9],
  [-2.2, -6, 3.0, -0.2],
  [2.2, -6, 3.0, 2.9],
  [-2.75, 0, 3.1, -0.1],
  [2.75, 0, 3.1, 3.0],
  [Math.PI, -5, 3.2, 1.3],
  [-2.95, 8, 2.9, 0.2],
  [2.95, 8, 2.9, 2.8],
];
/** The old head's calm infant blink (same cadence and seed, so the soft closed-eye moments stay where they were). */
const ghSeed = (() => {
  const s = "balak-head";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 9973) / 97.3 + 1;
})();
const ghBlink = (fr: number) => {
  const cl = 7;
  const op = 9;
  let start = 10 + Math.round(hash01(ghSeed) * 0.5 * 24);
  let d = -1;
  let hold = 0;
  for (let i = 0; i < 2000 && start <= fr; i++) {
    d = fr - start;
    hold = hash01(ghSeed * 3.3 + i * 1.9 + 0.2) > 0.65 ? 4 : 0;
    start += Math.round((4 + 1.5 * hash01(ghSeed * 1.7 + i * 3.1 + 0.5)) * 24);
  }
  if (d < 0) return 0;
  if (d < cl) return sstep(d / cl);
  if (d < cl + hold) return 1;
  if (d < cl + hold + op) return 1 - sstep((d - cl - hold) / op);
  return 0;
};

const BabyHeadGS: React.FC<{ st: HeadState; aura: number; uid: string }> = ({ st, aura, uid }) => {
  // softened turn (as the reference newborn face): never so far that the far eye crowds the silhouette
  const ye = GH_YMAX * Math.tanh((clamp(st.yaw, -1.45, 1.45) * GH_TURN) / GH_YMAX);
  const phi = clamp(Math.abs(ye) / GH_TURN_MAX);
  const fk = `${uid}-${Math.round(st.f * 100)}`; // per-frame clip ids (Chrome caches clip geometry by id in video renders)
  const KS = GH_KS;
  const skin = LOOK.skin;
  const skinLight = LOOK.skinLight;
  const shade = LOOK.skinShade;
  const hair = GH_HAIR;
  const hairLight = GH_HAIR_L;
  const sway = st.sway;

  /* ---- expression, from the rig's head state ---- */
  const sm = clamp(st.smile);
  const co = clamp((st.mouth.open - 0.03) / 0.27); // a soft parted "o": wonder, giggles, babble
  const ck = clamp(st.cheeks) * 0.6;
  const gy = clamp(st.eyeY, -1, 1);
  // eye smile: the full cheeks push the lower lids up; closed lids bow into soft happy crescents
  const es = clamp((sm - 0.5) / 0.4 + 0.6 * Math.max(0, st.squint - 0.18));
  const cheekLift = sm * 0.8 + es * 1.1 + co * 0.6;
  const close = Math.max(clamp(st.close), ghBlink(Math.floor(st.f)));
  const bright = clamp(0.3 + 2.4 * st.gasp + 0.3 * Math.max(0, -gy));
  // eased opening: a partly lowered `close` still reads as open, soft eyes; only blinks and his deliberate
  // closed-eye contentment bring the lids fully down
  const o = clamp(1 - Math.pow(close, 1.6));
  // calm: upper lids lowered only slightly, resting on the top of the iris (never heavy); wonder: wide; the lids
  // follow a downward gaze a little
  const oL = o * lerp(0.86, 1, bright) * (1 - 0.1 * Math.max(0, gy));
  const browUp = Math.min(1.4, Math.max(0, st.brow - 0.12) * 3);

  // a surface feature at head-space x0 on a sphere of radius r, turned → screen x, foreshortening, facing
  const proj = (x0: number, r: number) => {
    const a = Math.asin(clamp(x0 / r, -1, 1));
    return { x: r * Math.sin(a + ye), k: Math.max(0.2, Math.cos(a + ye)) / Math.max(0.2, Math.cos(a)), c: Math.cos(a + ye) };
  };
  const outline = ghOutline(ye);
  const ink = "#3A2117";
  const lipUp = "#D4937A";
  const lipLo = "#DEA085";

  /* ---- eyes: large, warm brown eyes with one soft catchlight (the newborn's eyes) ---- */
  const W = 8.1;
  const HU = 7.2;
  const eye = (side: 1 | -1) => {
    // the eyes sit on the turned sphere; same size frontally; turned, only the far eye narrows (by at most 18 %),
    // the near eye never grows (never squeezed thin, never hidden)
    const pj = { x: proj(side * 13.4, 31).x, k: side * ye > 0 ? 1 - 0.18 * phi : 1 };
    const hl = 5.6 * (1 - sm * 0.2 - es * 0.22 * o);
    const arch = es * clamp((1 - o) * 1.4);
    const Ly = lerp(hl * 1.33, -HU * 1.33, oL) - arch * (hl * 1.33 + 3);
    const lowY = lerp(hl * 1.33, Ly + 0.15, arch);
    const P0: P2 = [-W, 0.5];
    const P3: P2 = [W, 0];
    const K1: P2 = [-W * 0.55, Ly];
    const K2: P2 = [W * 0.6, Ly];
    const shape = `M ${gp(P0)} C ${gp([-W * 0.55, -HU * 1.33])} ${gp([W * 0.6, -HU * 1.33])} ${gp(P3)} C ${gp([W * 0.6, lowY])} ${gp([-W * 0.55, lowY])} ${gp(P0)} Z`;
    const shut = clamp((1 - o) * 1.6 - 0.3);
    const lid = `M ${gp(P0)} C ${gp(K1)} ${gp(K2)} ${gp(P3)}`;
    const lidSkin = `M ${-W - 2} 0.5 L ${-W - 2} ${-HU * 2} L ${W + 2} ${-HU * 2} L ${W + 2} 0 L ${gp(P3)} C ${gp(K2)} ${gp(K1)} ${gp(P0)} Z`;
    const ix = clamp(st.eyeX, -1, 1) * 2.6 * side;
    const iy = -0.4 + gy * 1.7;
    const IR = 6.3;
    const cid = `${fk}-e${side > 0 ? "r" : "l"}`;
    return (
      <g transform={`translate(${g2(pj.x)}, -0.6) scale(${g2(side * pj.k)}, 1)`}>
        <defs>
          <clipPath id={cid}>
            <path d={shape} />
          </clipPath>
        </defs>
        {/* very soft, short baby brow, kept well below the hairline so it never reads as a seam */}
        <path
          d={`M -5 ${g2(-13.2 - sm * 0.4 - co * 0.5 - browUp)} Q -0.4 ${g2(-15 - sm * 0.4 - co * 0.6 - browUp * 1.15)} 5.4 ${g2(-13.8 - sm * 0.3 - co * 0.4 - browUp * 0.9)}`}
          stroke={hair}
          strokeWidth={1.7}
          strokeLinecap="round"
          fill="none"
          opacity={0.12}
        />
        <path d={`M ${g2(-W * 0.6)} ${g2(-HU * 1.05 - 1.6)} Q 0 ${g2(-HU * 1.36 - 1.6)} ${g2(W * 0.9)} ${g2(-HU * 0.65 - 1.3)}`} stroke={shade} strokeWidth={0.7} fill="none" opacity={0.12 + 0.14 * oL} />
        <path d={`M ${g2(-W * 0.6)} ${g2(Math.max(hl, lowY * 0.75) + 1.6)} Q 0 ${g2(Math.max(hl, lowY * 0.75) + 2.7 - es * 1.6)} ${g2(W * 0.7)} ${g2(Math.max(hl, lowY * 0.75) + 1.3 - es * 0.6)}`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.1 + 0.12 * es} />
        <g clipPath={`url(#${cid})`}>
          <path d={shape} fill={`url(#${uid}-scl)`} />
          <circle cx={ix} cy={iy} r={IR} fill={`url(#${uid}-iris)`} />
          <circle cx={ix} cy={iy} r={IR - 0.35} fill="none" stroke="#2A150B" strokeWidth={0.8} opacity={0.6} />
          <ellipse cx={ix} cy={g2(iy + IR * 0.42)} rx={IR * 0.62} ry={IR * 0.3} fill="#C38A57" opacity={0.28} />
          <circle cx={ix} cy={iy} r={2.7} fill="#160B06" />
          <path d={lid} transform="translate(0, 1.3)" stroke="#2A1810" strokeWidth={2.6} fill="none" opacity={0.2} />
          {/* one soft round catchlight on the sun side, never a star or sparkle */}
          <circle cx={g2(ix + 2.2 * side * KS)} cy={g2(iy - 2.3)} r={3.1} fill="#FFFFFF" opacity={0.14} />
          <circle cx={g2(ix + 2.2 * side * KS)} cy={g2(iy - 2.3)} r={1.75} fill="#FFFFFF" opacity={0.95} />
          <path d={lidSkin} fill={skin} />
        </g>
        {shut > 0.02 && <ellipse cx={-0.4} cy={g2(Ly * 0.45 - 1.6)} rx={W * 0.72} ry={2.8} fill={skinLight} opacity={0.3 * shut} />}
        <path d={lid} stroke={ink} strokeWidth={lerp(0.9, 1.25, oL)} strokeLinecap="round" fill="none" opacity={0.85} />
        <path d={`M ${gp(P3)} q 0.7 ${g2(-0.3 + (1 - oL) * 0.6)} 1.2 ${g2(-0.5 + (1 - oL) * 0.9)}`} stroke={ink} strokeWidth={0.6} strokeLinecap="round" fill="none" opacity={0.4} />
        <path d={`M ${g2(-W * 0.55)} ${g2(lowY * 0.72 + 0.6)} Q 0 ${g2(lowY + 0.2)} ${g2(W * 0.7)} ${g2(lowY * 0.6 + 0.3)}`} stroke={shade} strokeWidth={0.55} fill="none" opacity={0.3 * o} />
      </g>
    );
  };

  /* ---- ear (as the reference newborn face): only on the NEAR side, only once the turn shows it; small and soft,
     inside the silhouette under the hair edge at eye-to-nose height; shaded, never outlined (no stray line on the
     cheek). None in a frontal view. ---- */
  const earVis = sstep((phi - 0.3) / 0.45);
  const earSide = ye > 0 ? -1 : 1;
  const earRx = 2.2 + 1.0 * earVis;
  // its outer rim just meets the silhouette (a tiny soft bump at most), its top tucked under the hair edge
  const earX = earSide * (35.9 - earRx * 0.85);
  const ear =
    earVis > 0.02 ? (
      <g transform={`translate(${g2(earX)}, 4.2)`} opacity={g2(earVis)}>
        {/* soft shading where the ear meets the cheek (a fill, never a line) */}
        <ellipse cx={g2(-earSide * earRx * 0.9)} cy={0.4} rx={1.8} ry={4.6} fill={`url(#${uid}-sh)`} opacity={0.3} />
        <ellipse cx={0} cy={0} rx={g2(earRx)} ry={4.9} fill={skin} />
        {/* the lit outer rim and a faint shaded inner bowl */}
        <ellipse cx={g2(earSide * earRx * 0.25)} cy={-0.6} rx={g2(earRx * 0.7)} ry={3.9} fill={skinLight} opacity={0.35} />
        <ellipse cx={g2(-earSide * earRx * 0.12)} cy={0.5} rx={g2(earRx * 0.42)} ry={2.4} fill={`url(#${uid}-ear)`} opacity={0.55} />
      </g>
    ) : null;

  /* ---- hair: one full soft dark mass over the crown; curls inside it and along its natural hairline ---- */
  const aR = Math.min(Math.PI, Math.PI / 2 - ye);
  const aL = Math.max(-Math.PI, -Math.PI / 2 - ye);
  // hairline nodes on a fixed grid round the head (so the lock tips stay on his head as he turns), plus the two
  // points where the hairline meets the outline
  const STEP = Math.PI / 11;
  const azs: number[] = [aR];
  for (let k = Math.ceil(aR / STEP) - 1; k * STEP > aL; k--) if (k * STEP < aR - 0.04 && k * STEP > aL + 0.04) azs.push(k * STEP);
  azs.push(aL);
  const hl0: P2[] = azs.map((a) => [ghSph(a, ghHairY(a), ye, 0.4).x, ghHairY(a)]);
  const locks = hl0.slice(0, -1).map((p, i) => {
    const q = hl0[i + 1];
    const m: P2 = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const L = Math.hypot(dx, dy) || 1;
    // the normal pointing away from the hair (down / toward the face)
    let nx = -dy / L;
    let ny = dx / L;
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const full = clamp(L / 9);
    const amp = (1.8 + hash01(Math.round((azs[i] + azs[i + 1]) * 40) * 0.37 + 60) * 2.2 + Math.abs(sway) * 0.05) * full;
    return { p, q, m, nx, ny, amp, c: [m[0] + nx * amp, m[1] + ny * amp] as P2 };
  });
  const yRe = hl0[0][1];
  const yLe = hl0[hl0.length - 1][1];
  const thL = Math.PI - Math.asin(clamp((yLe - GH_OCY) / GH_RO, -1, 1));
  const thR = 2 * Math.PI + Math.asin(clamp((yRe - GH_OCY) / GH_RO, -1, 1));
  const op = (th: number, extra: number): P2 => [Math.cos(th) * (GH_RO + extra), GH_OCY + Math.sin(th) * (GH_RO + extra)];
  // outer silhouette: soft rounded curl clumps just outside the skull, on a fixed grid of angles
  const TS = 0.27;
  const ths: number[] = [thL];
  for (let k = Math.floor(thL / TS) + 1; k * TS < thR; k++) if (k * TS > thL + 0.05 && k * TS < thR - 0.05) ths.push(k * TS);
  ths.push(thR);
  let outer = `M ${gp(op(thL, 0))}`;
  for (let i = 0; i < ths.length - 1; i++) {
    const t0 = ths[i];
    const t1 = ths[i + 1];
    const out = (1.6 + hash01(Math.round(t0 * 100) * 0.51 + 51) * 2.0) * clamp((t1 - t0) / TS);
    outer += ` Q ${gp(op((t0 + t1) / 2, out * 1.25))} ${gp(op(t1, 0.2 * hash01(Math.round(t1 * 100) * 0.27 + 52)))}`;
  }
  const hairMass = `${outer} L ${gp(hl0[0])} ` + locks.map((k) => `Q ${gp(k.c)} ${gp(k.q)}`).join(" ") + ` L ${gp(op(thL, 0))} Z`;
  // a lighter curl highlight just inside each lock tip
  const lockHi = locks
    .filter((k) => k.amp > 1.2)
    .map((k) => {
      const ins = (pt: P2, d: number): P2 => [pt[0] + k.nx * d, pt[1] + k.ny * d];
      const a = ins(k.m, k.amp * 0.5 - 1.1);
      const p = ins([lerp(k.p[0], k.m[0], 0.35), lerp(k.p[1], k.m[1], 0.35)], -1.2);
      const q = ins([lerp(k.q[0], k.m[0], 0.35), lerp(k.q[1], k.m[1], 0.35)], -1.2);
      return { d: `M ${gp(p)} Q ${gp(a)} ${gp(q)}`, lit: k.m[0] * KS > -6 };
    });
  const curlArc = (cx: number, cy: number, r: number, rx: number, a0: number, span = 3.0) => {
    const a1 = a0 + span;
    const p0: P2 = [cx + Math.cos(a0) * r * rx, cy + Math.sin(a0) * r];
    const p1: P2 = [cx + Math.cos(a1) * r * 0.86 * rx, cy + Math.sin(a1) * r * 0.86];
    return `M ${gp(p0)} A ${g2(r * rx)} ${g2(r * 0.92)} 0 ${span > Math.PI ? 1 : 0} 1 ${gp(p1)}`;
  };
  const inner = GH_CURLS.flatMap(([a, y, r, a0]) => {
    const pj = ghSph(a, y, ye, -0.5);
    if (pj.c < 0.12) return [];
    return [{ d: curlArc(pj.x, y, r, Math.max(0.55, Math.min(1, pj.c * 1.25)), a0 + sway * 0.02), lit: pj.x * KS > -6 }];
  });

  /* ---- nose & mouth ---- */
  const nj = proj(0, 37);
  const nx = nj.x;
  const mj = proj(0, 33);
  const gap = co * 2.8;
  const mw = (3.6 + sm * 1.8) * (1 - co * 0.12) * (0.75 + 0.3 * st.mouth.width) * Math.sqrt(mj.k);
  const lift = sm * 1.9 + co * 0.3;
  const mid = 0.5 + sm * 0.5;
  const upperLip = `M ${g2(-mw)} ${g2(-lift)} Q ${g2(-mw * 0.55)} -1.5 -0.9 -1.9 Q 0 -1.25 0.9 -1.9 Q ${g2(mw * 0.55)} -1.5 ${g2(mw)} ${g2(-lift)} Q 0 ${g2(mid)} ${g2(-mw)} ${g2(-lift)} Z`;
  const lowerLip = `M ${g2(-mw)} ${g2(-lift + gap)} Q 0 ${g2(mid + gap)} ${g2(mw)} ${g2(-lift + gap)} Q ${g2(mw * 0.55)} ${g2(2.7 + gap)} 0 ${g2(2.8 + gap)} Q ${g2(-mw * 0.55)} ${g2(2.7 + gap)} ${g2(-mw)} ${g2(-lift + gap)} Z`;

  return (
    <g transform={`translate(0, ${GH_DY}) scale(${GH_S})`}>
      <defs>
        <radialGradient id={`${uid}-skin`} cx={0.5 + 0.08 * KS} cy="0.38" r="0.7">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="36%" stopColor={skin} />
          <stop offset="84%" stopColor={skin} />
          <stop offset="100%" stopColor={shade} />
        </radialGradient>
        <radialGradient id={`${uid}-iris`} cx="0.5" cy="0.66" r="0.6">
          <stop offset="0%" stopColor="#B37B4A" />
          <stop offset="38%" stopColor="#8E5630" />
          <stop offset="72%" stopColor="#5E3219" />
          <stop offset="100%" stopColor="#3A1D0E" />
        </radialGradient>
        <linearGradient id={`${uid}-scl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAD3C3" />
          <stop offset="38%" stopColor="#FFFBF6" />
          <stop offset="100%" stopColor="#F7EBE2" />
        </linearGradient>
        <radialGradient id={`${uid}-hm`} gradientUnits="userSpaceOnUse" cx={12 * KS} cy="-38" r="48">
          <stop offset="0%" stopColor="#4A2F20" />
          <stop offset="45%" stopColor={hair} />
          <stop offset="100%" stopColor="#170D08" />
        </radialGradient>
        {/* warm golden rim light on the sun-side edge of the skin and hair (soft, no hard line) */}
        <radialGradient id={`${uid}-rim`} gradientUnits="userSpaceOnUse" cx={-10 * KS} cy="-6" r="50">
          <stop offset="0%" stopColor={RIM} stopOpacity={0} />
          <stop offset="76%" stopColor={RIM} stopOpacity={0} />
          <stop offset="100%" stopColor={RIM_HOT} stopOpacity={0.6} />
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
        <clipPath id={`${fk}-hc`}>
          <path d={outline} />
        </clipPath>
        {/* soft baby ear: a warm, slightly deeper centre fading to the skin at its edge (no outline) */}
        <radialGradient id={`${uid}-ear`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={shade} />
          <stop offset="55%" stopColor={skin} />
          <stop offset="100%" stopColor={skin} />
        </radialGradient>
      </defs>

      {/* soft shadow under the chin, on the neck */}
      <ellipse cx={g2(mj.x * 0.6)} cy={30} rx={18} ry={6} fill={`url(#${uid}-sh)`} opacity={0.75} />
      <path d={outline} fill={`url(#${uid}-skin)`} />

      <g clipPath={`url(#${fk}-hc)`}>
        {/* soft highlight low on the forehead, near the brows (no pale band along the hairline); fall-off on the shadow side; a soft band under the chin */}
        <ellipse cx={g2(proj(5 * KS, 34).x)} cy={-11} rx={11} ry={5} fill={`url(#${uid}-hi)`} opacity={0.3} />
        <ellipse cx={-34 * KS} cy={4} rx={14} ry={30} fill={`url(#${uid}-sh)`} opacity={0.38} />
        <ellipse cx={g2(mj.x * 0.7)} cy={31} rx={22} ry={7} fill={`url(#${uid}-sh)`} opacity={0.5} />
        {/* full cheeks: a soft apple highlight and a warm blush */}
        {([-1, 1] as const).map((sd) => {
          const cj = proj(sd * 18, 33);
          if (cj.c < 0.05) return null;
          return (
            <g key={sd}>
              <ellipse cx={g2(cj.x - sd * 0.5)} cy={g2(8 - cheekLift)} rx={g2((6.5 + es * 0.8) * cj.k)} ry={g2(4.2 + es * 0.5)} fill={`url(#${uid}-hi)`} opacity={sd * KS > 0 ? 0.32 : 0.18} />
              <ellipse cx={g2(cj.x)} cy={g2(11 - cheekLift)} rx={g2(9 * Math.max(0.45, cj.k))} ry={6.4} fill={`url(#${uid}-blush)`} opacity={clamp(0.35 + ck * 0.75 + sm * 0.15 + co * 0.1)} />
            </g>
          );
        })}
        <path d={outline} fill={`url(#${uid}-rim)`} opacity={0.45 + 0.4 * clamp(aura)} />
        {/* the hairline blends into the skin: a soft, graded shadow under the hair edge (no light stroke, no seam) */}
        <path d={hairMass} fill="none" stroke={shade} strokeWidth={3.4} strokeLinejoin="round" opacity={0.1} />
        <path d={hairMass} transform="translate(0.25, 1.6)" fill={shade} opacity={0.08} />
        <path d={hairMass} transform="translate(0.15, 0.8)" fill={shade} opacity={0.12} />
      </g>
      {/* the near-side ear (only when the turn shows it), tucked under the hair edge */}
      {ear}

      {/* full soft mass of dark baby hair, the curls formed inside it and along its edge */}
      <g>
        <path d={hairMass} fill={`url(#${uid}-hm)`} />
        <g clipPath={`url(#${fk}-hmc)`}>
          <ellipse cx={14 * KS} cy={-35} rx={13} ry={4.2} fill={hairLight} opacity={0.32} transform={`rotate(${30 * KS}, ${14 * KS}, -35)`} />
          {inner.map(({ d }, i) => (
            <path key={`cs${i}`} d={d} transform="translate(0.6, 0.7)" stroke="#120A06" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.32} />
          ))}
          {inner.map(({ d, lit }, i) => (
            <path key={`ch${i}`} d={d} stroke={hairLight} strokeWidth={1.0} strokeLinecap="round" fill="none" opacity={lit ? 0.42 : 0.24} />
          ))}
          {lockHi.map(({ d, lit }, i) => (
            <path key={`lh${i}`} d={d} stroke={hairLight} strokeWidth={1.1} strokeLinecap="round" fill="none" opacity={lit ? 0.4 : 0.24} />
          ))}
          <path d={hairMass} fill={`url(#${uid}-rim)`} opacity={0.4 + 0.3 * clamp(aura)} />
        </g>
      </g>

      {eye(-1)}
      {eye(1)}

      {/* tiny button nose: soft roundness, a soft shadow beneath, a gentle highlight */}
      <ellipse cx={g2(nx - 2.2 * KS)} cy={8.4} rx={2.6} ry={2.8} fill={`url(#${uid}-sh)`} opacity={0.4} />
      <ellipse cx={g2(nx)} cy={10.7} rx={g2(3.8 * nj.k)} ry={1.4} fill={`url(#${uid}-sh)`} opacity={0.75} />
      <ellipse cx={g2(nx)} cy={8.2} rx={g2(3 * nj.k)} ry={2.4} fill={skinLight} opacity={0.3} />
      <ellipse cx={g2(nx - 1.7 * nj.k)} cy={10.1} rx={0.75} ry={0.5} fill="#A8684C" opacity={0.5} />
      <ellipse cx={g2(nx + 1.7 * nj.k)} cy={10.1} rx={0.75} ry={0.5} fill="#A8684C" opacity={0.5} />
      <circle cx={g2(nx + 0.9 * KS)} cy={7.4} r={1} fill="#FFFFFF" opacity={0.3} />
      <path d={`M ${g2(nx - 0.9)} 11.8 Q ${g2(mj.x - 0.7)} 13.6 ${g2(mj.x - 0.9)} 15.2 M ${g2(nx + 0.9)} 11.8 Q ${g2(mj.x + 0.7)} 13.6 ${g2(mj.x + 0.9)} 15.2`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.14} />

      {/* small soft natural lips with a faint, peaceful smile */}
      <g transform={`translate(${g2(mj.x)}, 17.2)`}>
        <ellipse cx={0} cy={g2(4.7 + gap)} rx={3.4} ry={1.2} fill={`url(#${uid}-sh)`} opacity={0.45} />
        {co > 0.02 && (
          <g opacity={clamp(co * 4)}>
            <ellipse cx={0} cy={g2(mid * 0.5 + gap * 0.5)} rx={g2(mw * 0.82)} ry={g2(gap * 0.6 + 0.2)} fill={`url(#${uid}-mo)`} />
            <ellipse cx={0} cy={g2(mid * 0.5 + gap * 0.85)} rx={g2(mw * 0.5)} ry={g2(gap * 0.22)} fill="#C46A68" opacity={0.6} />
          </g>
        )}
        <path d={lowerLip} fill={lipLo} opacity={0.6} />
        <path d={upperLip} fill={lipUp} opacity={0.6} />
        <path d={`M ${g2(-mw)} ${g2(-lift)} Q 0 ${g2(mid)} ${g2(mw)} ${g2(-lift)}`} stroke="#A15C48" strokeWidth={0.85} strokeLinecap="round" fill="none" opacity={0.72} />
        <ellipse cx={0.4 * KS} cy={g2(1.9 + gap)} rx={g2(1.4 * mj.k)} ry={0.5} fill={skinLight} opacity={0.3} />
        {sm > 0.05 &&
          ([-1, 1] as const).map((sd) => (
            <path key={sd} d={`M ${g2(sd * (mw + 0.2))} ${g2(-lift - 0.6)} Q ${g2(sd * (mw + 0.9))} ${g2(-lift + 0.1)} ${g2(sd * (mw + 0.4))} ${g2(-lift + 0.8)}`} stroke={shade} strokeWidth={0.6} fill="none" opacity={0.35 * sm} />
          ))}
      </g>
    </g>
  );
};

const BoyFigure: React.FC<{ r: Rig; aura: number }> = ({ r, aura }) => {
  const T = torsoFrame(r);
  const { L, P } = T;
  const gA = P(L * 0.5, -24);
  const gB = P(L * 0.5, 29);
  // soft skin light along the top of the back, and the rounded spine and shoulder blades of a baby's back
  const backLight = smoothOpen([wig(r, P(-14, -18), 0.6), P(L * 0.2, -21.5), P(L * 0.55, -21.8), P(L * 0.9, -19.5), P(L + 8, -14)]);
  const spine = smoothOpen([P(L * 0.38, -18.5), P(L * 0.65, -19.2), P(L * 0.92, -17.5)]);
  const blade = P(L * 0.82, -14);
  const bs = 1.8 * r.bellySway * (1 - r.kneel);
  const navel = P(L * 0.46 + bs, 24.5 + 0.6 * r.bellyJig);
  const bellyBounce = P(L * 0.45 + bs, 23);
  // the belly's soft roundness: a light on its sun side, a shaded underside, and the little fold under the chest
  const bellyLight = P(L * 0.6 + bs, 15);
  const bellyShade = P(L * 0.42 + bs, 25.5);
  const chestFold = smoothOpen([P(L * 0.84, 15), P(L * 0.78 + 0.5 * bs, 19), P(L * 0.7 + 0.5 * bs, 21.5)]);
  const hipFold = smoothOpen([P(L * 0.12 + 0.6 * bs, 21), P(L * 0.2 + 0.6 * bs, 25)]);
  // golden rim light from the sun ahead: along the top of the bottom (cloth), the back and over the shoulders
  const rimPts: V2[] = [
    wig(r, P(-23, -15), 1),
    wig(r, P(-11, -24.6), 0.6),
    P(L * 0.08, -25.2),
    P(L * 0.33, -24.8),
    P(L * 0.68, -23),
    P(L * 0.98, -20.4),
    P(L + 10.5, -13.6),
  ];
  const rim = smoothOpen(rimPts);
  const rimA = rimPts[0];
  const rimB = rimPts[rimPts.length - 1];
  const cxBody = (r.Hx + r.Sx) / 2;
  const breathe = 1 + 0.04 * Math.sin(r.f * 0.05);
  // planted-contact weights, for the little contact shadows under hands and knees
  const handDownN = clamp(1 - (-r.wristN[1] - 6) / 8);
  const handDownF = clamp(1 - (-(r.wristF[1] - r.groundF) - 6) / 8);
  // planted weight: the shadow darkens and tightens as the palm presses down
  const pressN = clamp(handDownN * (0.8 + 0.4 * r.landN));
  const pressF = clamp(handDownF * (0.8 + 0.4 * r.landF));
  const headState: HeadState = {
    yaw: r.yaw,
    eyeX: r.eyeX,
    eyeY: r.eyeY, // chin up, eyes ahead; down at the go-saap while he pets it; up in the curious glances
    close: r.close,
    // soft, serene eyes; an eye smile as he giggles; soft lids while he pets; a little wider in wonder
    squint: r.squint,
    brow: r.brow,
    browTilt: 0.1,
    mouth: r.mouth,
    smile: r.smile,
    gasp: r.gasp,
    cheeks: r.cheeks,
    flush: 0,
    tears: 0,
    sway: r.sway,
    f: r.f,
  };
  // Soft warm sheen on the top of the hair (no hard rim line, so nothing reads as a ring halo). It sits just
  // inside the hair outline, is heavily blurred and faint, and fades out at both ends. It stays on the sun
  // side: the arc is counter-rotated against the head tilt.
  // (centred on the drawn hair mass of BabyHeadGS, just inside its outline)
  const R = (GH_RO - 4.5) * GH_S;
  const sCy = GH_OCY * GH_S + GH_DY;
  const ga1 = ((-122 - r.headTilt) * Math.PI) / 180;
  const ga2 = ((-28 - r.headTilt) * Math.PI) / 180;
  const sheenA: V2 = [R * Math.cos(ga1), sCy + R * Math.sin(ga1)];
  const sheenB: V2 = [R * Math.cos(ga2), sCy + R * Math.sin(ga2)];
  const hairSheen = `M ${fmt(sheenA)} A ${R} ${R} 0 0 1 ${fmt(sheenB)}`;
  return (
    <g transform={`translate(${r.Xw}, ${GROUND}) scale(${FIG_S})`}>
      <defs>
        <linearGradient id="s03-torso-g" gradientUnits="userSpaceOnUse" x1={gA[0]} y1={gA[1]} x2={gB[0]} y2={gB[1]}>
          <stop offset={0} stopColor={SKIN_L} />
          <stop offset={0.35} stopColor={SKIN} />
          <stop offset={1} stopColor={SKIN_S} />
        </linearGradient>
        <linearGradient id="s03-rim-g" gradientUnits="userSpaceOnUse" x1={rimA[0]} y1={rimA[1]} x2={rimB[0]} y2={rimB[1]}>
          <stop offset={0} stopColor={RIM} stopOpacity={0.35} />
          <stop offset={0.6} stopColor={RIM} stopOpacity={0.85} />
          <stop offset={1} stopColor={RIM_HOT} stopOpacity={1} />
        </linearGradient>
        <radialGradient id="s03-sand-glow">
          <stop offset={0} stopColor={DIVINE.mid} stopOpacity={0.55} />
          <stop offset={0.5} stopColor={DIVINE.falloff} stopOpacity={0.22} />
          <stop offset={1} stopColor={DIVINE.falloff} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="s03-contact-g">
          <stop offset={0} stopColor="#3a2414" stopOpacity={0.5} />
          <stop offset={1} stopColor="#3a2414" stopOpacity={0} />
        </radialGradient>
        <filter id="s03-rim-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
        <filter id="s03-limb-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={1.3} />
        </filter>
      </defs>

      {/* faint warm glow reflected on the sand around him, breathing slowly */}
      <ellipse cx={cxBody + 6} cy={-2} rx={118 * breathe} ry={17 * breathe} fill="url(#s03-sand-glow)" opacity={0.55 + 0.45 * aura} />
      {/* soft contact shadow under the body and belly, and small ones under planted hands, knees and feet */}
      <ellipse cx={cxBody} cy={0} rx={66} ry={6.5} fill="url(#s03-contact-g)" opacity={0.75} />
      {/* each a wide soft falloff with a tighter, darker core right under the contact */}
      <ellipse cx={r.kneeN[0]} cy={0} rx={13} ry={3} fill="url(#s03-contact-g)" />
      <ellipse cx={r.kneeN[0] + 1} cy={0} rx={6.5} ry={1.5} fill="url(#s03-contact-g)" opacity={0.8 * clamp(1 - (r.kneeN[1] - KNEE_Y) / -4)} />
      <ellipse cx={r.footN[0] - 8} cy={0} rx={15} ry={2.6} fill="url(#s03-contact-g)" opacity={0.7} />
      <ellipse cx={r.wristN[0] + 3} cy={0} rx={10 + 1.5 * (1 - handDownN)} ry={2.4} fill="url(#s03-contact-g)" opacity={0.25 + 0.75 * handDownN} />
      <ellipse cx={r.wristN[0] + 4} cy={0} rx={5.5} ry={1.3} fill="url(#s03-contact-g)" opacity={0.85 * pressN} />

      {/* far side (three-quarter view): leg and arm a little up and back, behind the trunk, a shade darker */}
      <ellipse cx={r.kneeF[0]} cy={r.groundF} rx={11} ry={2.6} fill="url(#s03-contact-g)" opacity={0.8} />
      <ellipse cx={r.kneeF[0] + 1} cy={r.groundF} rx={5.5} ry={1.3} fill="url(#s03-contact-g)" opacity={0.6} />
      <ellipse cx={r.footF[0] - 8} cy={r.groundF} rx={13} ry={2.3} fill="url(#s03-contact-g)" opacity={0.5} />
      <ellipse cx={r.wristF[0] + 3} cy={r.groundF} rx={9} ry={2.2} fill="url(#s03-contact-g)" opacity={0.2 + 0.6 * handDownF} />
      <ellipse cx={r.wristF[0] + 4} cy={r.groundF} rx={5} ry={1.2} fill="url(#s03-contact-g)" opacity={0.7 * pressF} />
      <Leg id="s03-leg-far" hip={r.hipF} knee={r.kneeF} ankle={r.footF} col={SKIN_FAR} shade={SKIN_FAR_S} light={SKIN} />
      <Arm
        id="s03-arm-far"
        side={1}
        sh={r.shF}
        el={r.elbowF}
        wr={r.wristF}
        col={SKIN_FAR}
        shade={SKIN_FAR_S}
        light={SKIN}
        land={r.landF}
        gy={r.groundF}
        swing={r.swingF}
        curl={r.curlF}
        settle={r.settleF}
      />
      {/* the far shoulder rounds up behind the back line, rising and falling as the trunk rolls */}
      <ellipse cx={r.shF[0] + 2} cy={r.shF[1] - 2} rx={14} ry={12} fill={SKIN_FAR} />
      <path d={sunEdge([r.shF[0] - 6, r.shF[1] - 10], [r.shF[0] + 10, r.shF[1] - 8], 2, 2)} stroke={RIM} strokeWidth={1.4} opacity={0.4} filter="url(#s03-rim-blur)" />

      {/* the trunk: short and round, a rounded bottom, a gently rounded back, and a round belly hanging low */}
      <path d={torsoOutline(r, T)} fill="url(#s03-torso-g)" />
      <path d={backLight} stroke={SKIN_L} strokeWidth={3} fill="none" opacity={0.5} strokeLinecap="round" />
      <path d={spine} stroke={SKIN_S} strokeWidth={1.2} fill="none" opacity={0.25} strokeLinecap="round" />
      <ellipse cx={blade[0]} cy={blade[1]} rx={9} ry={5} fill={SKIN_L} opacity={0.18} />
      {/* warm light bounced up from the sunlit sand onto the underside of the belly */}
      <ellipse cx={bellyShade[0]} cy={bellyShade[1]} rx={22} ry={4.5} fill={SKIN_S} opacity={0.3} filter="url(#s03-limb-soft)" />
      <ellipse cx={bellyBounce[0]} cy={bellyBounce[1]} rx={20} ry={5} fill="#ffcf8a" opacity={0.2} filter="url(#s03-rim-blur)" />
      <ellipse cx={bellyLight[0]} cy={bellyLight[1]} rx={13} ry={6} fill={SKIN_L} opacity={0.22} filter="url(#s03-limb-soft)" />
      <path d={chestFold} stroke={SKIN_S} strokeWidth={1} fill="none" opacity={0.28} strokeLinecap="round" />
      <path d={hipFold} stroke={SKIN_S} strokeWidth={1} fill="none" opacity={0.22} strokeLinecap="round" />
      <path d={`M ${fmt([navel[0] - 2.5, navel[1]])} q 2.5 2 5 0`} stroke={SKIN_D} strokeWidth={1} fill="none" opacity={0.3} />
      <circle cx={navel[0]} cy={navel[1] + 0.6} r={0.8} fill={SKIN_D} opacity={0.22} />

      {/* near leg, then the loincloth over the bottom and the top of the thigh */}
      <Leg id="s03-leg-near" hip={r.hipN} knee={r.kneeN} ankle={r.footN} col={SKIN} shade={SKIN_S} />
      <Langot r={r} T={T} />

      {/* golden rim light along the back and shoulders (a soft bloom under a fine bright edge) */}
      <path d={rim} stroke="url(#s03-rim-g)" strokeWidth={5.5} fill="none" opacity={0.42 + 0.2 * aura} strokeLinecap="round" filter="url(#s03-rim-blur)" />
      <path d={rim} stroke="url(#s03-rim-g)" strokeWidth={1.5} fill="none" opacity={0.7 + 0.2 * aura} strokeLinecap="round" />

      {/* near arm (the patting and stroking arm), with sunlight catching its front edge */}
      <Arm
        id="s03-arm-near"
        side={-1}
        sh={r.shN}
        el={r.elbowN}
        wr={r.wristN}
        col={SKIN}
        shade={SKIN_S}
        land={r.landN}
        flat={r.flatN}
        swing={r.swingN}
        curl={r.curlN}
        settle={r.settleN}
      />
      <path d={sunEdge(r.shN, r.elbowN, 11, 8.4)} stroke={RIM} strokeWidth={2.2} opacity={0.45} strokeLinecap="round" filter="url(#s03-rim-blur)" />

      {/* a short, chubby baby neck (mostly hidden), with a fat crease under the chin */}
      <Taper a={[r.Sx + 6, r.Sy - 6]} b={[r.ox - 4, r.oy + 18]} ra={12.5} rb={11} col={SKIN} />
      <Crease a={[r.Sx + 6, r.Sy - 6]} b={[r.ox - 4, r.oy + 18]} t={0.7} w={9} bow={-2} col={SKIN_S} op={0.35} />
      {/* the plump fat roll at the back of the neck, under the curls */}
      <Crease a={[r.Sx + 6, r.Sy - 6]} b={[r.ox - 4, r.oy + 18]} t={0.45} w={11} bow={1.6} col={SKIN_S} op={0.2} />

      {/* the head: a big round infant head held up, chin lifted, a serene smile and bright divine catchlights */}
      <g transform={`translate(${r.ox}, ${r.oy}) rotate(${r.headTilt})`}>
        <defs>
          <linearGradient id="s03-sheen-g" gradientUnits="userSpaceOnUse" x1={sheenA[0]} y1={sheenA[1]} x2={sheenB[0]} y2={sheenB[1]}>
            <stop offset={0} stopColor={RIM} stopOpacity={0} />
            <stop offset={0.55} stopColor={RIM_HOT} stopOpacity={1} />
            <stop offset={1} stopColor={RIM} stopOpacity={0} />
          </linearGradient>
          <filter id="s03-sheen-blur" filterUnits="userSpaceOnUse" x={-2 * HEAD_R} y={-2 * HEAD_R} width={4 * HEAD_R} height={4 * HEAD_R}>
            <feGaussianBlur stdDeviation={3.6} />
          </filter>
        </defs>
        <BabyHeadGS st={headState} aura={aura} uid="balak-head" />
        {/* soft warm glow along the top of the hair, on the sun side: blurred, faint, fading at both ends */}
        <path d={hairSheen} stroke="url(#s03-sheen-g)" strokeWidth={9} fill="none" opacity={0.22 + 0.1 * aura} strokeLinecap="round" filter="url(#s03-sheen-blur)" />
      </g>

      {/* a few slow motes of warm light rising around him */}
      <BalakMotes f={r.f} cx={cxBody} level={aura} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Go-saaps: three big Bengal monitors. Tension, the petting, then they settle */
/* ------------------------------------------------------------------ */

/*
 * Beats (local frames, narration cues from subtitles.ts):
 * - 165 to 241, "big go-saaps came to bask": A basks ahead under the lemon tree, C basks on the sand he crawls
 *   past (its tail in the bushes), B is in the bushes by the fence. Low framing, edges darkening, a slow push-in. Quick double tongue flicks every
 *   one to one and a half seconds, heads swaying.
 * - 241 to 324, "the little Thakur crawled over": they get up and close in with the stop-start, side-swinging
 *   monitor walk. A from in front, B from the side (out of the back of the yard), C from behind him. C stops just
 *   behind his feet and hisses (268 to 300): throat puffed, mouth open, body raised. He laughs and crawls on.
 * - 324 to 403, "and petted them": he strokes and pats A's head and neck, his glow brightening.
 * - 404 to 529, "and amazingly, the go-saaps lay quietly and were petted": each slows, sinks flat on the sand,
 *   half-closes its eyes and flicks its tongue slowly; he keeps stroking A's head. The frame warms back up.
 */

/** Stop-start travel: bursts of [from, to, distance]. Returns the distance covered and how much it is walking. */
type Burst = [number, number, number];
const travel = (f: number, bursts: Burst[]) => {
  let d = 0;
  let mv = 0;
  for (const [a, b, dist] of bursts) {
    const u = clamp((f - a) / (b - a));
    d += dist * sstep(u);
    if (u > 0 && u < 1) mv = Math.max(mv, Math.pow(Math.sin(Math.PI * u), 0.5));
  }
  return { d, mv };
};

/** Tongue: quick double flicks (two out-and-in flicks in 13 frames) at each start in `quick`; slow single ones in `slow`. */
const flickAt = (f: number, quick: number[], slow: number[]) => {
  let v = 0;
  for (const c of quick) {
    const t = f - c;
    if (t >= 0 && t < 13) v = Math.max(v, Math.pow(Math.sin((Math.PI * (t % 6.5)) / 6.5), 0.6));
  }
  for (const c of slow) {
    const t = f - c;
    if (t >= 0 && t < 26) v = Math.max(v, 0.75 * Math.pow(Math.sin((Math.PI * t) / 26), 1.4));
  }
  return v;
};
/** Flick starts every 22 to 38 frames between a and b (seeded, so each go-saap has its own rhythm). */
const flickTimes = (a: number, b: number, seed: number) => {
  const out: number[] = [];
  let t = a;
  let i = 0;
  while (t < b) {
    out.push(Math.round(t));
    t += 22 + 16 * hash01(seed * 7.3 + i++);
  }
  return out;
};

/** Slow, heavy blinks: closes over 5 frames, lifts over 8. */
const lidBlink = (f: number, at: number[]) => at.reduce((m, c) => Math.max(m, ramp(f, c, c + 5) * (1 - ramp(f, c + 7, c + 15))), 0);

interface SaapState {
  x: number;
  y: number;
  s: number;
  flip: boolean;
  step: number;
  move: number;
  tongue: number;
  lid: number;
  hiss: number;
  flat: number;
  neck: number;
  look: number;
  f: number;
}

/**
 * Settling per go-saap ("lay quietly and were petted"): A first, under his hand, in P3 (lx.a3: it closes its eyes and
 * sinks flat while he strokes it), then B and C on "গো-সাপগুলোও চুপচাপ শুয়ে" (story cue, about 438).
 */
const CUE_ALL_CALM = cueLocalStory("গো-সাপগুলোও", SCENE_ID)?.from ?? 438;
const settleA = (f: number, lx: Life) => Math.max(ramp(f, 404, 466), lx.a3);
const settleB = (f: number) => ramp(f, CUE_ALL_CALM - 4, CUE_ALL_CALM + 56);
const settleC = (f: number) => ramp(f, CUE_ALL_CALM + 6, CUE_ALL_CALM + 66);
/** A's eyes close while he strokes it in P3 (they open again halfway, settled and content, as the pause ends). */
const aEyesClosed = (lx: Life) =>
  lx.pz.inPause && lx.pz.index === 2 ? ramp(lx.e, 12, 22) * (1 - 0.6 * ramp(lx.e, lx.pz.frames - 12, lx.pz.frames - 2)) : 0;

/** Story-timed events played on the life clock: tongue flicks and blinks keep going (and finish) inside a pause. */
const toReal = (story: number[]) => story.map(realOf);
const lifeFlick = (t: number, quickR: number[], slowR: number[]) => flickAt(t, quickR, slowR);

/**
 * Tension weight for the frame: the go-saaps rise and close in from the basking line until they settle. Kept faint
 * (director, STO-16: the narration says the go-saaps were calm), so it is only a slight cooling of the frame edges.
 */
const tensionAt = (f: number) => 0.35 * ramp(f, 158, 226) * (1 - ramp(f, 398, 468));
/** The frame warms back up as they lie quietly. */
const warmAt = (f: number) => ramp(f, 404, 486);

/** Shared state: head sway while paused, the gait's head swing, eyelids, and the settle. t = life clock; blinks in story frames. */
const saapCommon = (t: number, seed: number, mv: number, step: number, alert: number, settle: number, blinks: number[]) => {
  const sway = 0.65 * Math.sin(t * 0.105 + seed) + 0.25 * noise1(t * 0.05, seed);
  const look = clamp((0.55 * mv * Math.sin(2 * Math.PI * step) + (1 - mv) * alert * sway) * (1 - 0.85 * settle), -1, 1);
  const lidBase = lerp(lerp(0.3, 0.04, alert), 0.62, settle);
  return { look, lid: Math.max(lidBase, lidBlink(t, toReal(blinks))) };
};

/**
 * A, "from in front": basks ahead of him under the lemon tree, gets up as he comes (232 to 248) and closes in on him
 * in three stop-start rushes, ending with its head at his hand (head rear at x 1524, snout at 1456, below his chin).
 */
const A_X0 = 1800;
const A_BURSTS: Burst[] = [
  [256, 278, -72], // starts after P2 (story 252), on "ছোট্ট ঠাকুর হামাগুড়ি দিয়ে গিয়ে"
  [282, 300, -52],
  [308, 328, -40],
];
const A_S = 0.95;
const A_Y = 900;
const A_QUICK_R = toReal(flickTimes(170, 404, 3));
// slow flicks; plus one in the held wide of P2 ("a go-saap's slow tongue flick") and one late in P3
const A_SLOW_R = toReal([436, 474, 512, 552, CONTENT_END - 4, CONTENT_END + 36, CONTENT_END + 76]).concat([
  pauseStartReal(1) + 7,
  pauseStartReal(2) + pauseLen(2) - 18,
]);
const saapA = (f: number, lx: Life): SaapState => {
  const { d, mv } = travel(f, A_BURSTS);
  const step = -d / (A_S * GOSAAP_STRIDE);
  const settle = settleA(f, lx);
  const alert = ramp(f, 226, 246) * (1 - settle);
  const c = saapCommon(lx.t, 1.3, mv, step, alert, settle, [190, 262, 360, 448, 500, CONTENT_END + 18, CONTENT_END + 58]);
  // nuzzle up into his hand with each stroke while he pets it; lifts its head a little toward him as he giggles
  const nuzzle = 2.2 * ramp(f, 336, 356) * (1 - ramp(f, 500, 520)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * ((f - 317) / 34 + lx.strokeX) - 0.9));
  const giggle = 3.5 * ramp(f, 528, 548) * (1 - ramp(f, 578, 596));
  // breathing pause: it leans softly up into his slow resting strokes
  const restNuzzle = 1.6 * restAt(f) * (0.6 + 0.4 * Math.sin((2 * Math.PI * (f - REST_FROM)) / 46 - 1.2));
  return {
    x: A_X0 + d,
    y: A_Y,
    s: A_S,
    flip: true,
    step,
    move: mv,
    tongue: lifeFlick(lx.t, A_QUICK_R, A_SLOW_R),
    lid: Math.max(c.lid, 0.95 * aEyesClosed(lx)),
    hiss: 0,
    flat: 0.7 * (1 - ramp(f, 232, 248)) + settle,
    neck: alert * (4 + 3 * (1 - mv) * Math.sin(lx.t * 0.07 + 1)) * (1 - ramp(f, 330, 350)) + nuzzle + giggle + restNuzzle - 2 * settle,
    look: c.look,
    f: lx.t,
  };
};

/**
 * B, "from the side": out of the bushes at the jungle edge by the fence, on the right, coming forward on a diagonal in
 * two rushes, to lie just behind A's tail with its head raised, watching him.
 */
const B_BURSTS: Burst[] = [
  [198, 252, 204],
  [278, 336, 204],
];
const B_QUICK_R = toReal(flickTimes(214, 410, 11));
const B_SLOW_R = toReal([450, 496, 544, CONTENT_END - 12, CONTENT_END + 26, CONTENT_END + 66]);
const saapB = (f: number, lx: Life): SaapState => {
  const { d, mv } = travel(f, B_BURSTS);
  const k = d / 408;
  const s = lerp(0.78, 0.8, k);
  const step = d / (s * GOSAAP_STRIDE);
  const settle = settleB(f);
  const alert = ramp(f, 188, 204) * (1 - settle);
  const c = saapCommon(lx.t, 4.1, mv, step, alert, settle, [244, 318, 392, 470, 530, CONTENT_END + 4, CONTENT_END + 46]);
  return {
    x: 2300 - d,
    y: lerp(878, 882, k),
    s,
    flip: true,
    step,
    move: mv,
    tongue: lifeFlick(lx.t, B_QUICK_R, B_SLOW_R),
    lid: c.lid,
    hiss: 0,
    flat: 0.6 * (1 - ramp(f, 186, 200)) + settle,
    // head held high over A's back (looming), lowered as it settles
    neck: alert * (7 + 3 * (1 - mv) * Math.sin(lx.t * 0.06 + 2)) - 3 * settle,
    look: c.look,
    f: lx.t + 211,
  };
};

/**
 * C, "from behind him": basks on the sand he crawls past (he goes by in front of its head, 200 to 225), then gets up
 * and follows him, stops just behind his feet and hisses at his back (268 to 300); he laughs and crawls on. It
 * follows again and lies down behind him.
 */
const C_X0 = 900;
const C_BURSTS: Burst[] = [
  [228, 250, 74], // done before P2 (story 252), so it is not held mid-step
  [304, 338, 80],
];
const C_S = 0.9;
const C_Y = 890;
const C_QUICK_R = toReal(flickTimes(166, 266, 7).concat(flickTimes(302, 414, 19)));
const C_SLOW_R = toReal([442, 488, 534, CONTENT_END - 20, CONTENT_END + 14, CONTENT_END + 52]);
/** C's hiss: the throat puffs and pulses, the mouth gapes, the body rises and swells. */
const hissC = (f: number) => ramp(f, 266, 274) * (1 - ramp(f, 292, 304)) * (0.88 + 0.12 * Math.sin(f * 0.9));
const saapC = (f: number, lx: Life): SaapState => {
  const { d, mv } = travel(f, C_BURSTS);
  const step = d / (C_S * GOSAAP_STRIDE);
  const settle = settleC(f);
  const alert = ramp(f, 196, 214) * (1 - settle);
  const c = saapCommon(lx.t, 7.7, mv, step, alert, settle, [214, 330, 420, 478, 540, CONTENT_END + 30, CONTENT_END + 70]);
  const hiss = hissC(f);
  return {
    x: C_X0 + d,
    y: C_Y,
    s: C_S,
    flip: false,
    step,
    move: mv,
    // the tongue stays out through the hiss, quivering
    tongue: Math.max(lifeFlick(lx.t, C_QUICK_R, C_SLOW_R), hiss * (0.75 + 0.25 * Math.sin(f * 1.7))),
    lid: c.lid * (1 - hiss),
    hiss,
    flat: 0.7 * (1 - ramp(f, 214, 228)) + settle,
    neck: alert * (3 + 2 * (1 - mv) * Math.sin(lx.t * 0.08)) - 2 * settle,
    look: c.look * (1 - hiss),
    f: lx.t + 97,
  };
};

/** Where his hand strokes A (head top over the eye, to the back of the head), lowered as A sinks flat. */
const strokeA = (f: number, lx: Life) => ({ x: 1502, y: 855 + 7 * settleA(f, lx) });
const strokeB = (f: number, lx: Life) => ({ x: 1524, y: 853 + 7 * settleA(f, lx) });

const Saap: React.FC<{ st: SaapState }> = ({ st }) => (
  <GoSaap
    x={st.x}
    y={st.y}
    s={st.s}
    flip={st.flip}
    f={st.f}
    step={st.step}
    move={st.move}
    tongue={st.tongue}
    lid={st.lid}
    hiss={st.hiss}
    flat={st.flat}
    neck={st.neck}
    look={st.look}
  />
);

/* ------------------------------------------------------------------ */
/* Village courtyard set (Ujanchar): the hut, its veranda, the fence and the jungle */
/* ------------------------------------------------------------------ */

/*
 * The corner of the family's courtyard (উঠোন) in Ujanchar, warm morning sun. Planes, back to front:
 * - 0.15 sky; 0.35 the dense jungle that surrounds the village; 0.5 coconut palms and banana trees behind the fence;
 * - 0.65 the back of the courtyard: on the left the mud-walled hut with its curved thatched roof and its low veranda
 *   (dawa) on a mud plinth, clay pots and a broom by the wall, Charu at the door; on the right the bamboo fence with
 *   bushes along its foot, and the lemon tree in the corner;
 * - 1 the beaten-earth courtyard floor, the near end of the veranda plinth he crawls down from, and the bushes at the
 *   jungle edge the go-saaps come out of.
 */

/** The hut on the 0.65 plane: plinth, wall, door and roof lines (plane px). */
const HUT = { x0: -440, x1: 1190, top: 806, bottom: 852, eave: 618, ridge: 436 };
const DOOR = { x: 860, w: 86, top: 630 };

/** The near end of the veranda plinth on the floor plane: its top edge at x 40, the low mud step down to the floor by x 112. */
const PLINTH = { edge: 40, foot: 112, h: 40 };
const plinthH = (x: number) => PLINTH.h * (1 - sstep((x - PLINTH.edge) / (PLINTH.foot - PLINTH.edge)));
/**
 * His lift and tilt on the plinth and the step: the body rides at the mean height under his knees and hands and tips
 * forward on the slope (the crawl itself is unchanged). Returns the vertical offset, the tilt in degrees and its pivot x.
 */
const liftAt = (Xw: number) => {
  const xb = Xw - 40;
  const xf = Xw + 66;
  const hb = plinthH(xb);
  const hf = plinthH(xf);
  return { dy: -(hb + hf) / 2, rot: (Math.atan2(hb - hf, xf - xb) * 180) / Math.PI, px: Xw + 13 };
};
/** A world point on his figure, carried by the plinth lift and tilt. */
const liftPt = (Xw: number, x: number, y: number): V2 => {
  const l = liftAt(Xw);
  const a = (l.rot * Math.PI) / 180;
  const dx = x - l.px;
  const dy = y - GROUND;
  return [l.px + dx * Math.cos(a) - dy * Math.sin(a), GROUND + dx * Math.sin(a) + dy * Math.cos(a) + l.dy];
};

const hashS = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/** Dense jungle on the 0.35 plane: layered canopy masses in deep greens, a few palm crowns, a soft haze of distance. */
const JUNGLE: Array<[number, number, number, number]> = Array.from({ length: 70 }, (_, i) => [
  -950 + i * 57 + 30 * hashS(i),
  470 + 120 * hashS(i + 40),
  70 + 70 * hashS(i + 80),
  Math.floor(3 * hashS(i + 120)),
]);
const JUNGLE_COL = ["#2c5428", "#36632f", "#24481f"];
const Jungle: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-950} y={560} width={3950} height={760} fill="#264a22" />
    {[-700, -250, 380, 980, 1620, 2240, 2780].map((x, i) => (
      <Palm key={`jp${i}`} x={x} y={640} s={0.85 + 0.2 * hashS(i + 7)} f={f} seed={i + 11} col="#2f5a2c" />
    ))}
    {JUNGLE.map(([x, y, r, k], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r={r} fill={JUNGLE_COL[k]} />
        <circle cx={x + r * 0.25} cy={y - r * 0.35} r={r * 0.5} fill="#5d8a45" opacity={0.25} />
      </g>
    ))}
    {/* distance haze, lit by the morning sun */}
    <rect x={-950} y={380} width={3950} height={940} fill="#d9e6c2" opacity={0.16} />
  </g>
);

/** Coconut palms and banana trees behind the fence and the hut (0.5 plane). */
const BackTrees: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[
      [-300, 1.05, 2],
      [520, 1.15, 5],
      [1320, 1.25, 8],
      [1820, 1.1, 4],
      [2420, 1.2, 9],
    ].map(([x, s, sd]) => (
      <Palm key={`p${x}`} x={x} y={860} s={s} f={f} seed={sd} />
    ))}
    {[
      [140, 1.5],
      [1060, 1.7],
      [1640, 1.55],
      [2120, 1.75],
      [2700, 1.6],
    ].map(([x, s]) => (
      <Banana key={`b${x}`} x={x} y={866} s={s} f={f} />
    ))}
  </g>
);

/** A round leafy bush: a clump of overlapping greens with a sunlit top. Base at (x, y). */
const Bush: React.FC<{ x: number; y: number; w: number; f: number; seed: number }> = ({ x, y, w, f, seed }) => {
  const n = Math.max(4, Math.round(w / 34));
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={w * 0.55} ry={8} fill="#1d1408" opacity={0.25} />
      {Array.from({ length: n }, (_, i) => {
        const u = n === 1 ? 0.5 : i / (n - 1);
        const r = 26 + 20 * hashS(seed + i) + 18 * Math.sin(Math.PI * u);
        const cx = x - w / 2 + w * u + 4 * Math.sin(f * 0.03 + seed + i);
        const cy = y - r * 0.7;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={i % 2 ? "#3f7232" : "#33602b"} />
            <circle cx={cx + r * 0.2} cy={cy - r * 0.35} r={r * 0.55} fill="#7aa64a" opacity={0.35} />
          </g>
        );
      })}
    </g>
  );
};

/** The bamboo fence along the back of the courtyard, with bushes at its foot (0.65 plane). */
const Fence: React.FC<{ f: number }> = ({ f }) => {
  const x0 = HUT.x1 - 20;
  const x1 = 2960;
  const posts: number[] = [];
  for (let x = x0; x <= x1; x += 58) posts.push(x);
  return (
    <g>
      {/* woven split-bamboo panels: a lattice the jungle shows through */}
      <g stroke="#b39556" strokeWidth={2.6} opacity={0.9}>
        {Array.from({ length: Math.ceil((x1 - x0) / 22) + 8 }, (_, i) => {
          const x = x0 - 120 + i * 22;
          return (
            <g key={i}>
              <line x1={x} y1={860} x2={x + 110} y2={726} />
              <line x1={x + 110} y1={860} x2={x} y2={726} stroke="#9c7f45" />
            </g>
          );
        })}
      </g>
      <rect x={x0} y={736} width={x1 - x0} height={7} fill="#a8894c" />
      <rect x={x0} y={800} width={x1 - x0} height={7} fill="#a8894c" />
      {posts.map((x, i) => {
        const h = 150 + 14 * hashS(i + 3);
        return (
          <g key={x}>
            <rect x={x - 5} y={862 - h} width={10} height={h} rx={4} fill="#9c7a44" />
            {[0.3, 0.62].map((k) => (
              <rect key={k} x={x - 6} y={862 - h * k} width={12} height={3} fill="#6f5530" />
            ))}
            <rect x={x - 2} y={862 - h} width={3} height={h} fill="#d8bd7c" opacity={0.4} />
          </g>
        );
      })}
      {[1290, 1700, 2010, 2380, 2760].map((x, i) => (
        <Bush key={x} x={x} y={872} w={170 + 60 * hashS(i + 5)} f={f} seed={i * 3 + 1} />
      ))}
    </g>
  );
};

/** A clay water pot (kolshi). Base at (x, y). */
const Kolshi: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={18} ry={3.5} fill="#2a1a0c" opacity={0.3} />
    <path d="M -9 -38 C -9 -32 -20 -30 -20 -16 C -20 -4 -10 0 0 0 C 10 0 20 -4 20 -16 C 20 -30 9 -32 9 -38 Z" fill="#b25a2e" />
    <ellipse cx={0} cy={-39} rx={11} ry={3.4} fill="#8e4220" />
    <path d="M -14 -24 C -10 -28 -4 -29 2 -28" stroke="#e08a52" strokeWidth={3} fill="none" opacity={0.6} strokeLinecap="round" />
    <path d="M -18 -15 C -8 -11 8 -11 18 -15" stroke="#7a3818" strokeWidth={1.4} fill="none" opacity={0.6} />
  </g>
);

/** A grass broom (jhata) leaning on the wall. Foot at (x, y). */
const Broom: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <line x1={x + 22} y1={y - 120} x2={x + 6} y2={y - 34} stroke="#7a5a32" strokeWidth={4} strokeLinecap="round" />
    {Array.from({ length: 9 }, (_, i) => (
      <line key={i} x1={x + 6} y1={y - 36} x2={x - 10 + i * 3.4} y2={y} stroke={i % 2 ? "#c9a85e" : "#a8874a"} strokeWidth={1.6} />
    ))}
    <rect x={x + 1} y={y - 40} width={10} height={5} rx={2} fill="#6a4a28" transform={`rotate(-10 ${x + 6} ${y - 38})`} />
  </g>
);

/** The mud-walled hut with its curved (do-chala) thatched roof, veranda posts, door, window, pots and broom. */
const Hut: React.FC<{ f: number; children?: React.ReactNode }> = ({ f, children }) => {
  const { x0, x1, top, bottom, eave, ridge } = HUT;
  const mid = (x0 + x1) / 2;
  const posts = [x0 + 50, x0 + 420, x0 + 820, DOOR.x - 120, x1 - 46];
  return (
    <g>
      {/* mud wall, set back under the roof, with a darker skirting where it meets the veranda floor */}
      <rect x={x0 + 26} y={eave - 20} width={x1 - x0 - 52} height={top - eave + 20} fill="#b8875a" />
      <rect x={x0 + 26} y={top - 40} width={x1 - x0 - 52} height={40} fill="#9e6e44" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M ${x0 + 60 + i * 130} ${680 + 40 * hashS(i)} q 40 -6 80 2`} stroke="#a2744a" strokeWidth={2} fill="none" opacity={0.5} />
      ))}
      {/* small window with bamboo bars */}
      <rect x={x0 + 560} y={672} width={70} height={58} fill="#2c1c10" />
      {[0, 1, 2, 3].map((k) => (
        <rect key={k} x={x0 + 568 + k * 16} y={672} width={5} height={58} fill="#9c7a44" />
      ))}
      <rect x={x0 + 554} y={666} width={82} height={7} fill="#6b4528" />
      {/* the doorway: dark inside, a wooden frame, one door leaf standing open */}
      <rect x={DOOR.x - DOOR.w / 2} y={DOOR.top} width={DOOR.w} height={top - DOOR.top} fill="#24160c" />
      <rect x={DOOR.x - DOOR.w / 2} y={top - 50} width={DOOR.w} height={50} fill="#3a2414" opacity={0.6} />
      <path d={`M ${DOOR.x - DOOR.w / 2} ${DOOR.top} L ${DOOR.x - DOOR.w / 2 - 26} ${DOOR.top + 10} L ${DOOR.x - DOOR.w / 2 - 26} ${top - 4} L ${DOOR.x - DOOR.w / 2} ${top} Z`} fill="#7a5232" />
      <rect x={DOOR.x - DOOR.w / 2 - 7} y={DOOR.top - 8} width={DOOR.w + 14} height={9} fill="#6b4528" />
      <rect x={DOOR.x - DOOR.w / 2 - 7} y={DOOR.top} width={7} height={top - DOOR.top} fill="#6b4528" />
      <rect x={DOOR.x + DOOR.w / 2} y={DOOR.top} width={7} height={top - DOOR.top} fill="#6b4528" />
      {/* the shade of the deep eaves on the wall */}
      <rect x={x0 + 26} y={eave - 20} width={x1 - x0 - 52} height={60} fill="#2a1608" opacity={0.28} />
      {/* clay pots and the broom by the wall */}
      <Kolshi x={x0 + 300} y={top} />
      <Kolshi x={x0 + 336} y={top} s={0.85} />
      <Kolshi x={DOOR.x + 96} y={top} s={0.9} />
      <Broom x={DOOR.x - 190} y={top} />
      {/* the veranda floor and the front of its mud plinth */}
      <rect x={x0} y={top - 6} width={x1 - x0} height={8} fill="#c9a06c" />
      <rect x={x0} y={top + 2} width={x1 - x0} height={bottom - top - 2} fill="#a8794a" />
      <rect x={x0} y={top + 2} width={x1 - x0} height={4} fill="#d4ad78" opacity={0.6} />
      <rect x={x0} y={bottom - 8} width={x1 - x0} height={8} fill="#7e5632" opacity={0.6} />
      {/* whoever stands on the veranda (Charu at the door) */}
      {children}
      {/* bamboo posts holding up the eaves */}
      {posts.map((x) => (
        <g key={x}>
          <rect x={x - 5} y={eave - 6} width={10} height={top - eave + 6} fill="#9c7a44" />
          <rect x={x - 2} y={eave - 6} width={3} height={top - eave + 6} fill="#d8bd7c" opacity={0.4} />
          {[0.35, 0.7].map((k) => (
            <rect key={k} x={x - 6} y={eave + (top - eave) * k} width={12} height={3} fill="#6f5530" />
          ))}
        </g>
      ))}
      {/* the curved thatched roof: sagging ridge and eaves, thick straw edge, strands catching the sun */}
      <path
        d={`M ${x0 - 60} ${eave + 26} Q ${mid} ${eave - 30} ${x1 + 60} ${eave + 26} L ${x1 - 40} ${ridge + 16} Q ${mid} ${ridge - 34} ${x0 + 40} ${ridge + 16} Z`}
        fill="#c9a35a"
      />
      <path d={`M ${x0 + 40} ${ridge + 16} Q ${mid} ${ridge - 34} ${x1 - 40} ${ridge + 16}`} stroke="#e4c47c" strokeWidth={8} fill="none" opacity={0.6} />
      {Array.from({ length: 46 }, (_, i) => {
        const u = i / 45;
        const xb = x0 - 50 + (x1 - x0 + 100) * u;
        const yb = eave + 22 - 56 * Math.sin(Math.PI * u) * 0.5;
        return <line key={i} x1={xb} y1={yb} x2={xb + (u - 0.5) * 40} y2={yb - 110 - 30 * hashS(i)} stroke="#a8823e" strokeWidth={1.6} opacity={0.55} />;
      })}
      <path d={`M ${x0 - 60} ${eave + 26} Q ${mid} ${eave - 30} ${x1 + 60} ${eave + 26} L ${x1 + 56} ${eave + 40} Q ${mid} ${eave - 16} ${x0 - 56} ${eave + 40} Z`} fill="#8e6a32" />
      {/* a wisp of cooking smoke from behind the roof */}
      {[0, 1, 2].map((k) => {
        const t = ((f + k * 30) % 90) / 90;
        return <circle key={k} cx={x0 + 260 + Math.sin(t * 5 + k) * 14 + t * 30} cy={ridge - 10 - t * 170} r={12 + t * 28} fill="#f4efe8" opacity={0.35 * (1 - t)} />;
      })}
    </g>
  );
};

/** The near end of the veranda plinth on the floor plane, where he starts: mud top, low sloped step, two pots. */
const NearPlinth: React.FC = () => {
  const { edge, foot, h } = PLINTH;
  const top = GROUND - h;
  return (
    <g>
      {/* the top of the veranda floor, receding toward the hut */}
      <path d={`M -900 ${top - 14} L ${edge - 10} ${top - 14} C ${edge + 2} ${top - 14} ${edge + 8} ${top - 6} ${edge} ${top} L -900 ${top} Z`} fill="#c9a06c" />
      {/* the front of the plinth and the low step sloping down to the floor */}
      <path d={`M -900 ${top} L ${edge} ${top} C ${edge + 30} ${top} ${foot - 30} ${GROUND} ${foot + 6} ${GROUND + 3} L -900 ${GROUND + 3} Z`} fill="#a8794a" />
      <path d={`M -900 ${top + 1} L ${edge} ${top + 1} C ${edge + 30} ${top + 1} ${foot - 30} ${GROUND + 1} ${foot + 6} ${GROUND + 3}`} stroke="#d9b37c" strokeWidth={3} fill="none" opacity={0.7} />
      <rect x={-900} y={GROUND - 8} width={900 + edge - 30} height={10} fill="#7e5632" opacity={0.5} />
      <Kolshi x={-420} y={top - 6} s={1.15} />
      <Kolshi x={-372} y={top - 4} s={0.95} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Charu at the door: frightened and amazed, still                       */
/* ------------------------------------------------------------------ */

/** Charu on the veranda at the door (0.65 plane), small in the distance. */
const CHARU = { x: DOOR.x, y: HUT.top, s: 0.46 };
/** Charu's rig dimensions (as in Scene02Fox): hip height standing, torso, upper arm, forearm, limb width, shoulder width. */
const CH_HIP_Y = -154.4;
const CH_TORSO = 102.6;
const CH_UA = 53.2;
const CH_FA = 62;
const CH_LIMB = 8.4;
const CH_SW = 44.65;
/** Two-link arm solve for a wrist target in her own rig units (x from her centre, y up from her feet negative). */
const charuArm = (side: 1 | -1, turn: number, tx: number, ty: number): { S: number; E: number } => {
  const cphi = Math.cos(turn * 0.95);
  const sx = side * 0.86 * CH_SW * cphi;
  const sy = CH_HIP_Y - CH_TORSO + CH_LIMB;
  const vx = tx - sx;
  const vy = ty - sy;
  const d = Math.min(CH_UA + CH_FA - 4, Math.max(Math.abs(CH_UA - CH_FA) + 1, Math.hypot(vx, vy)));
  const thT = Math.atan2(-vx, vy);
  const al = Math.acos(clamp((CH_UA * CH_UA + d * d - CH_FA * CH_FA) / (2 * CH_UA * d), -1, 1));
  const thU = side > 0 ? thT - al : thT + al; // elbows out to the sides, down
  const k = d / Math.max(1e-6, Math.hypot(vx, vy));
  const ex = -CH_UA * Math.sin(thU);
  const ey = CH_UA * Math.cos(thU);
  const thF = Math.atan2(-(vx * k - ex), vy * k - ey);
  const u = (thU * 180) / Math.PI;
  let rel = ((thF - thU) * 180) / Math.PI;
  rel = ((((rel + 180) % 360) + 360) % 360) - 180;
  return side > 0 ? { S: -u, E: -rel } : { S: u, E: rel };
};
const CH_TURN = 0.35; // turned a little toward the courtyard (screen right)
const CH_MOUTH = charuArm(1, CH_TURN, 8, -252); // right hand over her mouth
const CH_CHEST = charuArm(-1, CH_TURN, 4, -206); // left hand pressed to her chest

/** Fear: her hands fly up as the go-saaps rise and close in (196 to 212); amazement as they lie quiet under his hand. */
const charuFear = (f: number) => ramp(f, 196, 212);
const charuAmaze = (f: number) => ramp(f, 446, 486);
/** A small step forward after the hiss (286 to 298), and she stops herself, easing back a little. */
const charuStep = (f: number) => ramp(f, 286, 298) - 0.4 * ramp(f, 302, 322);

const charuActing = (f: number): Partial<Pose> => {
  const fear = charuFear(f);
  const amaze = charuAmaze(f);
  const tremble = fear * (1 - 0.6 * amaze) * (0.6 * Math.sin(f * 2.1) + 0.4 * Math.sin(f * 3.3 + 1));
  const step = charuStep(f);
  const lerpA = (rest: number, to: number) => lerp(rest, to, fear);
  // breathing pause: still watching him from the door, a slow small tilt of the head and a softening smile
  const rest = restAt(f);
  const watch = rest * Math.sin((f - REST_FROM) * 0.06);
  const pose = charuWideActing(f, fear, amaze, tremble, step, lerpA, rest, watch);
  // just before the cut to her close-up her face is already in its opening state (frightened, amazed, eyes wet), so
  // the cut matches
  const toCU = ramp(f, CU_CUT - 12, CU_CUT);
  if (toCU <= 0) return pose;
  const cu = charuCloseActing(f);
  const keys = ["headTurn", "headTilt", "headNod", "eyeY", "lid", "brow", "browTilt", "smile", "gasp", "tears", "cheeks", "flush"] as const;
  const out: Partial<Pose> = { ...pose };
  for (const k of keys) out[k] = lerp((pose[k] as number | undefined) ?? BASE_POSE[k], cu[k] as number, toCU);
  return out;
};

const charuWideActing = (
  f: number,
  fear: number,
  amaze: number,
  tremble: number,
  step: number,
  lerpA: (rest: number, to: number) => number,
  rest: number,
  watch: number,
): Partial<Pose> => {
  return {
    bodyX: 16 * step + 0.8 * tremble,
    bodyTurn: CH_TURN,
    stride: 0.5 * Math.sin(Math.PI * clamp((f - 286) / 14)) * (f > 286 && f < 300 ? 1 : 0),
    lean: 2 * step + 0.4 * tremble,
    headTurn: 0.45,
    headTilt: 2 * fear + 2.2 * watch,
    headNod: -3 * fear + 2 * (1 - fear) + 1.2 * rest,
    // watching him: soft and smiling at first, then wide-eyed, brows up; amazement at the end
    eyeX: 0.6,
    eyeY: 0.35,
    lid: lerp(0.1, -0.25, fear),
    brow: lerp(0.1, 0.75, fear),
    browTilt: lerp(0, 0.35, fear * (1 - amaze)),
    smile: lerp(0.45, 0.02, fear) + 0.18 * amaze + 0.1 * rest,
    gasp: fear * (0.6 - 0.25 * amaze) * (1 - 0.4 * rest),
    rS: lerpA(BASE_POSE.rS, CH_MOUTH.S),
    rE: lerpA(BASE_POSE.rE, CH_MOUTH.E),
    lS: lerpA(BASE_POSE.lS, CH_CHEST.S),
    lE: lerpA(BASE_POSE.lE, CH_CHEST.E),
    rHand: fear > 0.5 ? "open" : "relaxed",
    lHand: fear > 0.5 ? "open" : "relaxed",
  };
};

/**
 * Focus rack to Charu at the door, once, inside P2 (the held wide after "...বড় বড় গো-সাপ।"): the focus slides to her
 * plane (hand over her mouth), holds, and comes back to him before the next line. Not a camera move (CAM-13).
 */
const rackAt = (lx: Life) => (lx.pz.inPause && lx.pz.index === 1 ? ramp(lx.e, 3, 11) * (1 - ramp(lx.e, 23, 32)) : 0);

/* ------------------------------------------------------------------ */
/* Lemon tree                                                          */
/* ------------------------------------------------------------------ */

/** Lemon tree with a sway and yellow fruit. Base at (x, y). */
const LemonTree: React.FC<{ f: number; x: number; y: number; s?: number }> = ({ f, x, y, s = 1 }) => {
  const sway = Math.sin(f * 0.035) * 1.6;
  const canopy: Array<[number, number, number, string]> = [
    [-120, -330, 120, "#2e5c2c"],
    [110, -340, 130, "#346a31"],
    [0, -430, 150, "#3b7a37"],
    [-60, -250, 110, "#2a5428"],
    [90, -240, 105, "#2f5f2d"],
  ];
  const lemons: Array<[number, number]> = [
    [-150, -300],
    [-90, -220],
    [-30, -400],
    [40, -300],
    [120, -250],
    [160, -360],
    [-120, -410],
    [60, -440],
    [-20, -260],
    [100, -410],
    [-180, -330],
    [150, -420],
  ];
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={260} ry={22} fill="#000" opacity={0.25} />
      <path d="M -26 0 Q -18 -150 -10 -260 L 14 -260 Q 22 -150 30 0 Z" fill="#5a3f28" />
      <path d="M -6 -210 Q 40 -270 80 -300" stroke="#5a3f28" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d="M -10 -200 Q -60 -250 -100 -280" stroke="#5a3f28" strokeWidth={12} fill="none" strokeLinecap="round" />
      <g transform={`rotate(${sway} 0 -260)`}>
        {canopy.map(([cx, cy, r, col], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={col} />
        ))}
        {canopy.map(([cx, cy, r], i) => (
          <circle key={`h${i}`} cx={cx + r * 0.25} cy={cy - r * 0.3} r={r * 0.55} fill="#7aa64a" opacity={0.28} />
        ))}
        {lemons.map(([lx, ly], i) => (
          <g key={`l${i}`}>
            <circle cx={lx} cy={ly} r={9} fill="#f2d24a" />
            <circle cx={lx - 3} cy={ly - 3} r={3} fill="#fff6c0" opacity={0.8} />
          </g>
        ))}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Camera (CAM-13): held shots, one motivated move at most per line, keyed to the narration cues   */
/* ------------------------------------------------------------------ */

interface CamOut {
  x: number;
  y: number;
  zoom: number;
  dof: number;
}

/** Quintic ease in and out (flat at both ends), so each camera move starts and settles with no jolt. */
const ease5 = (t: number) => {
  const u = clamp(t);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const segE = (f: number, a: number, b: number) => ease5((f - a) / (b - a));

/**
 * A framing: the world point P (on the focus plane) sits at screen point S, at zoom exp(lz). Framings are mixed
 * in log zoom, so a push or pull keeps an even pace, and the point of interest glides across the screen.
 */
interface Framing {
  px: number;
  py: number;
  lz: number;
  sx: number;
  sy: number;
  dof: number;
}
const frameCam = (k: Framing): CamOut => {
  const z = Math.exp(k.lz);
  return { x: k.px - 960 - (k.sx - 960) / z, y: k.py - 540 - (k.sy - 540) / z, zoom: z, dof: k.dof };
};
const mixF = (a: Framing, b: Framing, t: number): Framing => ({
  px: lerp(a.px, b.px, t),
  py: lerp(a.py, b.py, t),
  lz: lerp(a.lz, b.lz, t),
  sx: lerp(a.sx, b.sx, t),
  sy: lerp(a.sy, b.sy, t),
  dof: lerp(a.dof, b.dof, t),
});

/** The cut to the close-up of Charu at the door (story frame): the breath after the narrated content. */
const CU_CUT = CONTENT_END;

/* Narration anchors, in REAL local frames (the camera runs on the real clock, so it can hold through the pauses). */
/** Line 2 starts (after P1): the cut to the held wide. */
const R_LINE2 = cueStartReal("বাড়ির উঠোনের", 70);
/** "তাদের গায়ে হাত বুলিয়ে": the one slow push in to the two-shot. */
const R_STROKE = cueStartReal("তাদের গায়ে", 325);
const PUSH_LEN = 54;
/** "গো-সাপগুলোও চুপচাপ শুয়ে": the one slow pull back to the medium wide. */
const R_ALL = cueStartReal("গো-সাপগুলোও", 438);
const PULL_LEN = 66;

/** World x of the body anchor, exactly as boyRig computes it (read only: the crawl timing is untouched). */
const xwAt = (f: number) => X0 + FIG_S * CYCLE * crawlPhi(f);

/**
 * Shot 1's follow target, per REAL frame: the body anchor (read at the story frame, so it stops in P1) through two
 * cascaded smoothing passes (about 10 frames of lag). The camera pans with him at an even pace, eases to a stop when he
 * stops on the sand, and holds there through P1.
 */
const XW_FOLLOW: number[] = (() => {
  const a = 0.2;
  let s1 = xwAt(0);
  let s2 = s1;
  const out: number[] = [];
  for (let t = 0; t <= R_LINE2 + 1; t++) {
    s1 += (xwAt(storyFrame(t, PAUSES)) - s1) * a;
    s2 += (s1 - s2) * a;
    out.push(s2);
  }
  return out;
})();
const xwFollow = (rf: number) => XW_FOLLOW[Math.round(clamp(rf, 0, XW_FOLLOW.length - 1))];

/**
 * Shot 1: low medium at his eye level (zoom 1.6, his head about the frame's middle, the sand line near y 790), panning
 * with him at a fixed height and zoom. He sits about 40 percent across and leads the frame.
 */
const followCam = (rf: number): CamOut => ({ x: xwFollow(rf) - 875, y: 205, zoom: 1.6, dof: 0.8 });

/** Midway between his face and the go-saap's head once he leans in to stroke it (world px). */
const PAIR = { x: 1488, y: 802 };
/**
 * Shots 2 and 3: the held wide of the courtyard corner (camera x 60, y 110, zoom 1): he small at the left on the sand
 * below the veranda, Charu at the door, the go-saaps basking, the lemon tree and the fence on the right, every head well
 * above the captions band. Written as a framing on PAIR so the push can glide from it.
 */
const F_WIDE: Framing = { px: PAIR.x, py: PAIR.y, lz: 0, sx: 960 + (PAIR.x - 960 - 60), sy: 540 + (PAIR.y - 540 - 110), dof: 0 };
/** Close two-shot of his face and the go-saap's head. Shallow focus: they are sharp, everything else soft. */
const F_TWO: Framing = { px: PAIR.x, py: PAIR.y, lz: Math.log(2.7), sx: 960, sy: 560, dof: 7 };
/**
 * Shot 5: the medium wide after the pull back: he and the calm go-saaps on the right, Charu far behind at the door on the
 * left, so the later cut to her face is motivated.
 */
const F_YARD: Framing = { px: 1250, py: 740, lz: Math.log(1.4), sx: 1040, sy: 640, dof: 1.5 };

/** Shifts a plane's contents for the lateral orbit. */
const Orb: React.FC<{ d: number; o: number; children: React.ReactNode }> = ({ d, o, children }) => (
  <g transform={`translate(${(o * (1 - d)).toFixed(2)} 0)`}>{children}</g>
);

/* Set extents (stage px), so the camera never shows past the edge of a plane. */
const SET_X: Array<[number, number, number]> = [
  [1, -900, 2900], // courtyard floor
  [0.65, -900, 2900], // wall and back edge of the yard
  [0.35, -900, 2900], // Padma
  [0.15, -1200, 3200], // sky
];
const FLOOR_TOP = 880; // highest point of the floor's back edge (depth 1)
const FLOOR_BOTTOM = 1300;
const YARD_EDGE = 870; // bottom of the yard's back edge (depth 0.65): the floor must overlap it, or the river shows through
const EDGE = 16;

/** Soft max / min: rounded corners, so a move that meets a limit eases into it instead of stopping dead. */
const smax = (a: number, b: number, k: number) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
const smin = (a: number, b: number, k: number) => 0.5 * (a + b - Math.sqrt((a - b) * (a - b) + k * k));

/** Keeps every plane's edge out of frame, including each plane's orbit shift `orb * (1 - d)`. */
const keepInSet = (c: CamOut, orb = 0): CamOut => {
  const z = Math.max(1, c.zoom);
  let lo = -Infinity;
  let hi = Infinity;
  for (const [d, x0, x1] of SET_X) {
    const s = Math.pow(z, d);
    const off = orb * (1 - d);
    lo = Math.max(lo, (x0 + EDGE - 960 + 960 / s + off) / d);
    hi = Math.min(hi, (x1 - EDGE - 960 - 960 / s + off) / d);
  }
  const w = Math.pow(z, 0.65);
  const yLo = (z * (FLOOR_TOP - 540) - w * (YARD_EDGE - 540) + 6) / (z - 0.65 * w);
  const yHi = FLOOR_BOTTOM - EDGE - 540 - 540 / z;
  return { ...c, x: smin(smax(c.x, lo, 24), hi, 24), y: smin(smax(c.y, yLo, 24), yHi, 24) };
};

/** The camera at a real local frame: shot 1 follows, then one held wide, one push in, one pull back. */
const camAt = (rf: number): CamOut => {
  if (rf < R_LINE2) return keepInSet(followCam(rf));
  let k = mixF(F_WIDE, F_TWO, segE(rf, R_STROKE, R_STROKE + PUSH_LEN));
  k = mixF(k, F_YARD, segE(rf, R_ALL, R_ALL + PULL_LEN));
  return keepInSet(frameCam(k));
};

/* ------------------------------------------------------------------ */
/* Sun shafts through the lemon tree, and the light they carry          */
/* ------------------------------------------------------------------ */

/** [x where the shaft leaves the canopy, width there, drift phase, strength] */
const SHAFTS: Array<[number, number, number, number]> = [
  [1290, 46, 0.0, 0.7],
  [1385, 70, 1.7, 1.0],
  [1470, 38, 3.1, 0.8],
  [1560, 82, 4.4, 0.95],
  [1665, 52, 5.6, 0.75],
];
const SHAFT_TOP = 380;
const SHAFT_BOTTOM = 990;

/**
 * Shaft geometry in the shaft plane (depth 0.95). The tops follow the canopy (depth 0.65) and the feet the
 * floor (depth 1) through the lateral orbit, so the light stays pinned to the leaves and the sand as the
 * camera arcs.
 */
const shaftGeom = (f: number, orb: number) =>
  SHAFTS.map(([x, w, ph, k], i) => {
    const xt = x + 22 * Math.sin(f * 0.012 + ph) + 8 * noise1(f * 0.01, 40 + i);
    const xb = LEMON.x + (xt - LEMON.x) * 1.9 - 60;
    return { xt: xt + 0.3 * orb, xb: xb - 0.05 * orb, w, wb: w * 2.2, a: k * (0.75 + 0.25 * noise1(f * 0.025, 60 + i)) };
  });

/** How much shaft light falls on the point (x, y) in the shaft plane, 0..1. */
const shaftLight = (sh: ReturnType<typeof shaftGeom>, x: number, y: number) => {
  const v = clamp((y - SHAFT_TOP) / (SHAFT_BOTTOM - SHAFT_TOP));
  let L = 0;
  for (const s of sh) {
    const cx = lerp(s.xt, s.xb, v);
    const hw = lerp(s.w, s.wb, v) * 0.5;
    L += s.a * Math.exp(-Math.pow((x - cx) / hw, 2));
  }
  return clamp(L);
};

/**
 * Soft warm light shafts falling through the canopy (the sun sits behind the tree). Each one drifts
 * slowly sideways with the leaves and breathes in strength. The tops fade out inside the canopy, and the
 * feet land as faint pools of light on the sand. `glow` warms them up during the play.
 */
const SunShafts: React.FC<{ f: number; orb: number; glow: number }> = ({ f, orb, glow }) => {
  const top = SHAFT_TOP;
  const bottom = SHAFT_BOTTOM;
  const shafts = shaftGeom(f, orb);
  return (
    <g opacity={0.32 + 0.14 * glow}>
      <defs>
        <linearGradient id="s03-shaft-g" gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={bottom}>
          <stop offset={0} stopColor="#fff1c8" stopOpacity={0} />
          <stop offset={0.28} stopColor="#ffe7a6" stopOpacity={0.85} />
          <stop offset={0.72} stopColor="#ffd88a" stopOpacity={0.45} />
          <stop offset={1} stopColor="#ffd07a" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="s03-pool-g">
          <stop offset={0} stopColor="#ffe3a0" stopOpacity={0.8} />
          <stop offset={1} stopColor="#ffe3a0" stopOpacity={0} />
        </radialGradient>
        <filter id="s03-shaft-blur" x="-50%" y="-10%" width="200%" height="120%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      <g filter="url(#s03-shaft-blur)">
        {shafts.map((s, i) => (
          <polygon
            key={i}
            points={`${s.xt - s.w / 2},${top} ${s.xt + s.w / 2},${top} ${s.xb + s.wb / 2},${bottom} ${s.xb - s.wb / 2},${bottom}`}
            fill="url(#s03-shaft-g)"
            opacity={s.a}
          />
        ))}
      </g>
      {shafts.map((s, i) => (
        <ellipse key={`p${i}`} cx={lerp(s.xt, s.xb, 0.9)} cy={935} rx={s.wb * 0.75} ry={16} fill="url(#s03-pool-g)" opacity={0.6 * s.a} />
      ))}
    </g>
  );
};

/**
 * Dust and pollen drifting under the tree (shaft plane, screen blend). Each mote is faint in shade and
 * flares warm as it drifts through a shaft. Dust hangs and rises slowly in the warm air; pollen sinks with a
 * lazy sway. Each one fades in and out over its own long cycle, so nothing pops.
 */
const LightDust: React.FC<{ f: number; orb: number; level: number }> = ({ f, orb, level }) => {
  const sh = shaftGeom(f, orb);
  return (
    <g>
      {Array.from({ length: 46 }, (_, i) => {
        const pollen = i % 4 === 0;
        const period = pollen ? 260 + 50 * hash01(i * 1.7) : 200 + 90 * hash01(i * 2.9);
        const ph = ((((f + hash01(i * 4.1) * period) % period) + period) % period) / period;
        const x0 = lerp(1120, 1900, hash01(i * 7.3 + 1));
        const yb = lerp(520, 940, hash01(i * 3.3 + 2));
        const x = x0 + 30 * Math.sin(f * 0.013 + i * 2.1) + 12 * noise1(f * 0.02, 100 + i) + (pollen ? 50 : 16) * ph;
        const y = pollen ? yb - 110 + 220 * ph + 8 * Math.sin(f * 0.05 + i) : yb + 20 - 60 * ph + 6 * noise1(f * 0.015, 200 + i);
        const lit = 0.12 + 0.88 * shaftLight(sh, x, y);
        const fade = Math.pow(Math.sin(Math.PI * ph), 1.2);
        const r = (pollen ? 1.8 + 0.8 * hash01(i * 5.5) : 0.9 + 0.7 * hash01(i * 6.6)) * (1 + 0.25 * Math.sin(f * 0.3 + i));
        const o = level * fade * lit;
        if (o < 0.02) return null;
        return (
          <g key={i} opacity={o}>
            <circle cx={x} cy={y} r={r * 3.4} fill={pollen ? "#ffd970" : "#fff0c4"} opacity={0.25} />
            <circle cx={x} cy={y} r={r} fill={pollen ? "#ffe58a" : "#fff8e2"} />
          </g>
        );
      })}
    </g>
  );
};

/** Falling lemon leaves: [start frame, start x, drift, landing y]. They leave the canopy above the frame and flutter down. */
const LEAVES: Array<[number, number, number, number]> = [
  [296, 1650, -90, 912],
  [352, 1290, 70, 924],
  [410, 1740, -60, 930],
  [466, 1590, -110, 918],
  [522, 1330, 50, 928],
  // drifts down through the breathing pause
  [CONTENT_END - 40, 1700, -70, 922],
];
const LEAF_FALL = 150;

/**
 * A lemon leaf fluttering down: it sways side to side, rocks, and turns over (a squash across its width) as
 * it falls, then settles flat on the sand with a soft shadow. The flutter fades out over the last stretch.
 */
const FallingLeaf: React.FC<{ f: number; start: number; x0: number; drift: number; land: number; seed: number }> = ({ f, start, x0, drift, land, seed }) => {
  const t = f - start;
  if (t < 0) return null;
  const u = clamp(t / LEAF_FALL);
  const settle = ramp(u, 0.86, 1);
  const flutter = 1 - settle;
  const ph = seed * 1.9;
  const y = lerp(470, land, u * (0.85 + 0.15 * u));
  const x = x0 + drift * u + 28 * Math.sin(t * 0.075 + ph) * flutter;
  const rot = lerp(48 * Math.sin(t * 0.075 + ph + 0.9), 8 + 6 * seed, settle);
  const turn = lerp(Math.cos(t * 0.11 + ph), 1, settle);
  const lie = lerp(1, 0.5, settle);
  return (
    <g>
      <ellipse cx={x} cy={land + 2} rx={11} ry={2.4} fill="#3a2414" opacity={0.22 * ramp(u, 0.7, 1)} />
      <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${(1.15 * turn).toFixed(3)} ${(1.15 * lie).toFixed(3)})`}>
        <path d="M -10 0 Q -3 -6 10 0 Q -3 6 -10 0 Z" fill={turn > 0 ? "#5f8f3a" : "#86a85a"} />
        <path d="M -10 0 Q -3 -6 10 0 Q 0 -2 -10 0 Z" fill="#9cc066" opacity={0.45} />
        <path d="M -10 0 L 9 0" stroke="#3e6224" strokeWidth={0.8} />
        <path d="M -10 0 L -13 0.6" stroke="#4a3a22" strokeWidth={1} strokeLinecap="round" />
      </g>
    </g>
  );
};

/**
 * A plain tiger butterfly visiting once (452 to 580). It enters from beyond the right edge of the frame, flutters in
 * a playful loop on his right, in front of him at his eye line but never over his head or face (it must never read
 * as a hair ornament), then drifts down and settles on the back of go-saap A, just behind its head and right under
 * his gaze, while he strokes it and smiles (516 to 538). There it slowly opens and closes its wings, then lifts off
 * and flies away up and out to the right before the camera pulls back. The path is an eased, time-keyed Hermite
 * spline (no jumps), it stops softly on landing and starts softly on take-off. In flight the wings flap about the
 * body line (they foreshorten as they beat) and its little shadow skims the sand; at rest both wings fold upright.
 */
/** [frame, world x, world y, stop (zero velocity at this key)] */
const BF_KEYS: Array<[number, number, number, boolean]> = [
  [452, 2120, 700, false],
  [466, 1900, 668, false],
  [478, 1745, 722, false],
  [488, 1650, 690, false],
  [497, 1705, 662, false],
  [505, 1672, 752, false],
  [512, 1626, 836, false],
  [516, 1604, 861, true], // lands on A's back, behind its head
  [538, 1604, 861, true], // takes off
  [546, 1642, 795, false],
  [556, 1705, 712, false],
  [567, 1810, 646, false],
  [580, 1960, 575, false],
];
const BF_REST_A = 516;
const BF_REST_B = 538;

const bfPath = (f: number): [number, number] => {
  const k = BF_KEYS;
  let i = 0;
  while (i < k.length - 2 && f > k[i + 1][0]) i++;
  const tan = (j: number): [number, number] => {
    if (k[j][3]) return [0, 0];
    const a = k[Math.max(0, j - 1)];
    const b = k[Math.min(k.length - 1, j + 1)];
    return [(b[1] - a[1]) / (b[0] - a[0]), (b[2] - a[2]) / (b[0] - a[0])];
  };
  const [f0, x0, y0] = k[i];
  const [f1, x1, y1] = k[i + 1];
  const dt = f1 - f0;
  const t = clamp((f - f0) / dt);
  const m0 = tan(i);
  const m1 = tan(i + 1);
  const h00 = 2 * t * t * t - 3 * t * t + 1;
  const h10 = t * t * t - 2 * t * t + t;
  const h01 = -2 * t * t * t + 3 * t * t;
  const h11 = t * t * t - t * t;
  const x = h00 * x0 + h10 * dt * m0[0] + h01 * x1 + h11 * dt * m1[0];
  const y = h00 * y0 + h10 * dt * m0[1] + h01 * y1 + h11 * dt * m1[1];
  return [x, y];
};

/** Turns: [from, to, new facing] (1 = head to the left, -1 = head to the right). */
const BF_TURNS: Array<[number, number, number]> = [
  [485, 491, -1], // swings round to the right in the loop
  [496, 502, 1], // and back toward him as it comes down to land
  [538, 545, -1], // lifts off and heads away to the right
];
const bfFace = (f: number) => {
  let face = 1;
  for (const [t0, t1, to] of BF_TURNS) {
    if (f <= t0) break;
    const c = Math.cos(Math.PI * clamp((f - t0) / (t1 - t0)));
    // the facing eases from the old side to the new one through a narrow (foreshortened) turn
    const v = face * (0.5 + 0.5 * c) + to * (0.5 - 0.5 * c);
    face = Math.abs(v) < 0.25 ? (v < 0 ? -0.25 : 0.25) : v;
    if (f < t1) return face;
    face = to;
  }
  return face;
};

const Butterfly: React.FC<{ f: number }> = ({ f }) => {
  const a = BF_KEYS[0][0];
  const b = BF_KEYS[BF_KEYS.length - 1][0];
  if (f < a || f > b) return null;
  const [px, py] = bfPath(f);
  // rest weight: flight wobble and flapping hand over to the folded, slowly breathing wings on A's back
  const rest = ramp(f, BF_REST_A - 6, BF_REST_A) * (1 - ramp(f, BF_REST_B, BF_REST_B + 5));
  const fly = 1 - rest;
  const x = px + 6 * Math.sin(f * 0.23) * fly;
  const y = py + 10 * Math.sin(f * 0.31) * fly;
  const flap = 0.18 + 0.82 * Math.abs(Math.cos(f * 0.95));
  // at rest: wings folded upright together, opening a little and closing again, slowly
  const open = 0.5 - 0.5 * Math.cos(((f - BF_REST_A) * 2 * Math.PI) / 11);
  const upper = lerp(flap, 0.95, rest);
  const lower = lerp(-flap, 0.9 - 1.25 * open, rest);
  const tilt = lerp(12 * Math.sin(f * 0.21) - 6, -3, rest);
  // it faces the way it flies (head to the left by default), turning through a short foreshortened beat
  const sx = bfFace(f);
  const o = ramp(f, a, a + 6) * (1 - ramp(f, b - 6, b));
  const wing = (sy: number, key: string) => (
    <g key={key} transform={`scale(1 ${sy.toFixed(3)})`}>
      <path d="M 0 0 C -4 -6 -3 -15 4 -15 C 10 -14 11 -7 2 0 Z" fill="#f29a2e" stroke="#2b1a10" strokeWidth={0.9} />
      <path d="M 1 0 C 5 -1 12 1 11 6.5 C 8 9 3 6 1 0 Z" transform="scale(1 -1)" fill="#e9862a" stroke="#2b1a10" strokeWidth={0.9} />
      <circle cx={2} cy={-12.5} r={0.9} fill="#fff8ea" />
      <circle cx={5.5} cy={-12} r={0.8} fill="#fff8ea" />
    </g>
  );
  return (
    <g opacity={o}>
      <ellipse cx={x} cy={GROUND + 12} rx={7} ry={1.6} fill="#3a2414" opacity={0.12 * (1 - ramp(f, BF_REST_A - 10, BF_REST_A - 4) * (1 - ramp(f, BF_REST_B + 2, BF_REST_B + 8)))} />
      {/* soft contact shadow on A's back while it rests there */}
      <ellipse cx={BF_KEYS[7][1] + 1} cy={BF_KEYS[7][2] + 4} rx={6} ry={1.5} fill="#2e2414" opacity={0.2 * rest} />
      <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${tilt.toFixed(2)}) scale(${(1.4 * sx).toFixed(3)} 1.4)`}>
        {wing(lower, "lo")}
        <ellipse cx={0} cy={0} rx={5} ry={1.3} fill="#2b1a10" />
        <path d="M -4.5 -0.4 Q -8 -3 -10 -4 M -4.5 0.4 Q -8 -1.5 -10.5 -1.6" stroke="#2b1a10" strokeWidth={0.5} fill="none" />
        {wing(upper, "up")}
      </g>
    </g>
  );
};

/** Near-layer plants: [x, base y, height, kind (0 grass, 1 marigold, 2 white flowers), seed]. */
const FG_PLANTS: Array<[number, number, number, number, number]> = Array.from({ length: 30 }, (_, i) => {
  const r = hash01(i * 9.1 + 4);
  return [420 + i * 92 + 40 * (hash01(i * 3.1) - 0.5), 1014 + 32 * hash01(i * 5.7), 24 + 30 * hash01(i * 2.2), r < 0.2 ? 1 : r < 0.32 ? 2 : 0, i];
});

/**
 * Foreground grass and flowers on a near plane (depth 1.35), blurred, backlit and swaying. They sit along the
 * bottom edge of frame and pass across it as the camera arcs, under the pair rather than over them.
 */
const ForegroundPlants: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {FG_PLANTS.map(([x, y, h, kind, i]) => {
      const sway = 2.5 * Math.sin(f * 0.04 + i * 1.3) + 1.2 * noise1(f * 0.03, 300 + i);
      const blades = 6 + Math.floor(4 * hash01(i * 1.9));
      return (
        <g key={i} transform={`rotate(${sway.toFixed(2)} ${x.toFixed(1)} ${y.toFixed(1)})`}>
          {Array.from({ length: blades }, (_, j) => {
            const bx = x + (j - blades / 2) * 3.4;
            const hh = h * (0.55 + 0.45 * hash01(i * 13 + j * 3.7));
            const lean = 10 * (hash01(i * 7 + j * 1.3) - 0.5) + (j - blades / 2) * 1.6;
            const tx = bx + lean;
            const ty = y - hh;
            return (
              <path
                key={j}
                d={`M ${(bx - 1.8).toFixed(1)} ${y} Q ${(bx + lean * 0.3).toFixed(1)} ${(y - hh * 0.6).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q ${(bx + lean * 0.3 + 1.2).toFixed(1)} ${(y - hh * 0.55).toFixed(1)} ${(bx + 1.8).toFixed(1)} ${y} Z`}
                fill={j % 3 === 0 ? "#3b5620" : j % 3 === 1 ? "#55742a" : "#6b8a33"}
              />
            );
          })}
          {kind === 1 && (
            <g>
              <path d={`M ${x} ${y} Q ${x + 3} ${y - h * 0.7} ${x + 2} ${y - h - 8}`} stroke="#4a6a26" strokeWidth={2} fill="none" />
              <circle cx={x + 2} cy={y - h - 10} r={7} fill="#f2a52c" />
              <circle cx={x + 2} cy={y - h - 10} r={4.2} fill="#f7c04a" />
              <circle cx={x + 2} cy={y - h - 10} r={1.8} fill="#c8641a" />
            </g>
          )}
          {kind === 2 &&
            [-6, 0, 5].map((o, j) => (
              <g key={`w${j}`}>
                <path d={`M ${x + o * 0.4} ${y} L ${x + o} ${y - h - 2 + 3 * j}`} stroke="#4a6a26" strokeWidth={1.2} />
                <circle cx={x + o} cy={y - h - 3 + 3 * j} r={3.2} fill="#f6f1e3" />
                <circle cx={x + o} cy={y - h - 3 + 3 * j} r={1} fill="#e8c04a" />
              </g>
            ))}
          {/* backlight catching the tips */}
          <ellipse cx={x + 2} cy={y - h * 0.8} rx={8} ry={h * 0.25} fill="#e6d070" opacity={0.18} />
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Bengal cow: a zebu in side profile, facing +x (flip turns it to face the child)   */
/* Local units: origin on the ground line, feet at y = 0, withers near y = -190.   */
/* ------------------------------------------------------------------ */

const COW_HIDE = "#8d7258";
const COW_HIDE_DARK = "#5f4a3a";
const COW_NEAR = "#7d6349";
const COW_FAR = "#55422f";
const COW_HOOF = "#2e221a";
const COW_WHITE = "#ece4d0";
const COW_BROWN = "#6e4a2e";
const HORN = "#e8dcb6";
const HORN_FAR = "#b3a27a";

/** Barrel body with a zebu hump over the shoulders, a deep belly and a slightly sagging back. */
const COW_TORSO =
  "M -120 -160 C -120 -176 -80 -168 -40 -168 C 0 -170 20 -178 50 -186 C 74 -194 96 -180 104 -160 C 112 -140 112 -110 100 -90 C 92 -72 60 -58 20 -56 C -20 -54 -70 -60 -100 -72 C -118 -82 -124 -120 -120 -160 Z";
/** Neck rising from the hump toward a broad head. */
const COW_NECK = "M 60 -186 C 110 -200 150 -214 178 -216 L 190 -172 C 170 -160 150 -140 128 -110 C 118 -96 108 -92 100 -92 L 80 -120 C 66 -150 60 -170 60 -186 Z";
/** Broad head with a clear forehead, a long face and a squared muzzle. */
const COW_HEAD =
  "M 164 -218 C 182 -226 204 -222 214 -210 C 228 -194 238 -170 244 -150 C 248 -136 244 -122 232 -118 C 218 -114 204 -122 190 -140 C 180 -152 170 -180 164 -218 Z";
/** Loose skin fold under the neck (dewlap). */
const COW_DEWLAP = "M 126 -132 C 134 -112 120 -92 110 -66 C 104 -56 92 -60 94 -72 C 100 -96 108 -116 112 -130 Z";

/** One leg: a thick upper, a knee, a narrower cannon and a dark hoof. Hind legs have a backward hock. */
const CowLeg: React.FC<{ x: number; hind: boolean; col: string }> = ({ x, hind, col }) => {
  const knee: [number, number] = hind ? [x - 14, -38] : [x + 1, -36];
  const footX = hind ? x - 9 : x;
  return (
    <g>
      <Bone a={[x, -84]} b={knee} w={hind ? 22 : 24} col={col} />
      <circle cx={knee[0]} cy={knee[1]} r={hind ? 7 : 8} fill={col} />
      <Bone a={knee} b={[footX, -9]} w={12} col={col} />
      <ellipse cx={footX} cy={-4} rx={8} ry={4.2} fill={COW_HOOF} />
    </g>
  );
};

type CowProps = Pick<AnimalProps, "x" | "y" | "s" | "flip" | "f" | "lean">;

/**
 * Bengal cow, drawn in shaded layers: a vertical gradient (light back, dark belly), a belly shadow,
 * brown and white coat patches clipped to the body, a dewlap, horns, an ear and a tail with a tuft.
 * `lean` lifts and lowers the head (see cowLean). The head also turns slowly on its own, the tail swishes
 * now and then, and the upper body breathes. The legs stay planted.
 */
const Cow: React.FC<CowProps> = ({ x, y, s = 1, flip = false, f = 0, lean = 0.2 }) => {
  const headDeg = ((-(lean - 0.2) * 0.9 + 0.05 * Math.sin(f * 0.017)) * 180) / Math.PI;
  const earDeg = -8 + 5 * Math.sin(f * 0.09);
  // a short swish every 150 frames, plus a faint idle flick
  const k = f % 150;
  const swish = ramp(k, 0, 8) * (1 - ramp(k, 34, 50));
  const tailDeg = 16 * swish * Math.sin(k * 0.55) + 2.5 * Math.sin(f * 0.05);
  const breath = 2 * (0.5 + 0.5 * Math.sin(f * 0.11));
  return (
    <g transform={`translate(${x}, ${y}) scale(${flip ? -s : s}, ${s})`}>
      <defs>
        <linearGradient id="s03-cow-grad" gradientUnits="userSpaceOnUse" x1={0} y1={-196} x2={0} y2={-54}>
          <stop offset={0} stopColor="#d2bea0" />
          <stop offset={0.5} stopColor="#a68b6d" />
          <stop offset={1} stopColor="#5a4536" />
        </linearGradient>
        <clipPath id="s03-cow-clip">
          <path d={COW_TORSO} />
          <path d={COW_NECK} />
        </clipPath>
        <clipPath id="s03-cow-head-clip">
          <path d={COW_HEAD} />
        </clipPath>
      </defs>
      {/* ground shadow, beneath the hooves */}
      <ellipse cx={0} cy={0} rx={176} ry={11} fill="#2a1a0c" opacity={0.32} />
      {/* tail hangs from the tail head and swishes about it */}
      <g transform={`rotate(${tailDeg} -118 -160)`}>
        <path d="M -118 -160 C -134 -128 -137 -92 -131 -50" stroke={COW_HIDE_DARK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <path d="M -131 -54 C -140 -44 -141 -30 -132 -18 C -124 -26 -122 -44 -131 -54 Z" fill={COW_HOOF} />
      </g>
      {/* far legs sit behind the body */}
      <CowLeg x={42} hind={false} col={COW_FAR} />
      <CowLeg x={-62} hind col={COW_FAR} />
      {/* near legs: their tops are hidden under the belly */}
      <CowLeg x={66} hind={false} col={COW_NEAR} />
      <CowLeg x={-84} hind col={COW_NEAR} />
      <g transform={`translate(0, ${-breath})`}>
        <path d={COW_TORSO} fill="url(#s03-cow-grad)" />
        <path d={COW_NECK} fill="url(#s03-cow-grad)" />
        <g clipPath="url(#s03-cow-clip)">
          {/* coat patches follow the barrel, the hump and the neck */}
          <ellipse cx={-42} cy={-150} rx={50} ry={20} fill={COW_BROWN} opacity={0.85} transform="rotate(-6 -42 -150)" />
          <ellipse cx={66} cy={-176} rx={30} ry={14} fill="#7a5233" opacity={0.7} />
          <ellipse cx={-104} cy={-126} rx={26} ry={28} fill={COW_BROWN} opacity={0.8} />
          <ellipse cx={92} cy={-150} rx={18} ry={12} fill={COW_BROWN} opacity={0.6} />
          <ellipse cx={-6} cy={-98} rx={44} ry={20} fill={COW_WHITE} opacity={0.92} />
          <ellipse cx={-76} cy={-104} rx={20} ry={16} fill={COW_WHITE} opacity={0.8} />
          {/* belly darkening and a soft light along the top of the back */}
          <ellipse cx={4} cy={-56} rx={118} ry={22} fill="#2a1d14" opacity={0.38} />
          <ellipse cx={-6} cy={-178} rx={100} ry={10} fill="#fff4dc" opacity={0.16} />
        </g>
        <path d={COW_DEWLAP} fill={COW_HIDE_DARK} opacity={0.9} />
        <path d="M 116 -128 C 110 -104 104 -84 100 -66" stroke="#3e2e23" strokeWidth={1} fill="none" opacity={0.5} />
        {/* head: pivots at the neck top, lifted and lowered by headDeg */}
        <g transform={`rotate(${headDeg} 172 -196)`}>
          <path d="M 186 -220 C 186 -230 192 -236 200 -238 C 198 -231 198 -226 199 -218 Z" fill={HORN_FAR} />
          <path d="M 172 -214 C 168 -226 172 -234 182 -238 C 181 -230 181 -222 184 -212 Z" fill={HORN} />
          <g transform={`translate(170, -206) rotate(${earDeg})`}>
            <path d="M 0 0 C -18 -10 -38 -8 -50 2 C -36 10 -16 12 0 6 Z" fill={COW_HIDE_DARK} />
            <path d="M -4 1 C -16 -3 -30 -2 -40 3 C -28 6 -14 7 -4 4 Z" fill="#c49a80" opacity={0.7} />
          </g>
          <path d={COW_HEAD} fill="url(#s03-cow-grad)" />
          <g clipPath="url(#s03-cow-head-clip)">
            <ellipse cx={222} cy={-172} rx={6} ry={16} fill={COW_WHITE} opacity={0.8} transform="rotate(18 222 -172)" />
          </g>
          <ellipse cx={236} cy={-132} rx={11} ry={14} fill="#b98d7a" />
          <circle cx={243} cy={-140} r={2.2} fill="#4a3026" />
          <path d="M 226 -122 Q 236 -117 244 -124" stroke="#5a3e32" strokeWidth={1.2} fill="none" opacity={0.6} />
          <ellipse cx={204} cy={-196} rx={9} ry={3} fill={COW_HIDE_DARK} opacity={0.4} />
          <ellipse cx={206} cy={-190} rx={4.6} ry={4} fill="#1a110c" />
          <circle cx={207.4} cy={-191.4} r={1.2} fill="#ffffff" opacity={0.85} />
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/**
 * Cow idle. The head rotates with `lean` (this rig has no separate yaw), so a slow sway reads as a
 * head turn. Every 240 frames it also lifts its head to look up for about 0.9 s. The value stays inside
 * the rig's -1..1 range, and the look wraps back to zero, so there is no jump.
 */
const cowLean = (f: number) => {
  const k = f % 240;
  const look = ramp(k, 150, 172) * (1 - ramp(k, 206, 228));
  return 0.2 + 0.1 * Math.sin(f * 0.021) + 0.1 * noise1(f * 0.03, 11) + 0.22 * look;
};

/**
 * Ending fade to black (chapter break into the rice pot), measured from the real end, read from EP02_SCENES (never
 * hard-coded). The picture is seen up to VIS_END: the scene's durationFrames, or the start of the next scene if that
 * comes first (the rice pot scene starts on top of this one's last frames, black over its own local 0 to 11, so
 * anything drawn past VIS_END is never seen). The fade starts 20 frames before VIS_END and is fully black 3 frames
 * before it, so the chapter-break black is kept (3 frames here plus the rice pot's black beat) with no dead black.
 */
const NEXT_SCENE = SCENE ? EP02_SCENES[EP02_SCENES.indexOf(SCENE) + 1] : undefined;
const VIS_END = Math.max(
  CONTENT_END + 40,
  Math.min(DUR, NEXT_SCENE && SCENE ? NEXT_SCENE.startFrame - SCENE.startFrame : DUR),
);
const END_FADE0 = VIS_END - 20;
const END_FADE = 17; // fully black at VIS_END - 3
/** VIS_END on the story clock (VIS_END and END_FADE0 are REAL local frames: the fade is read against lifeF). */
const VIS_END_S = storyFrame(VIS_END, PAUSES);

/* ------------------------------------------------------------------ */
/* Subject focus: a calmer, softer background and light on the subjects  */
/* ------------------------------------------------------------------ */

/**
 * Depth-of-field blur that grows with distance (CSS px before the layer's own scale): the sky most, the jungle,
 * the palms, the hut, fence and lemon tree less, the cow a little; the floor (depth 1), the child and the go-saaps
 * stay sharp. The camera's own focus blur counts toward it, so close-ups (already shallow) get no more than this.
 * During the racks to Charu the 0.65 plane (her plane) is left sharp.
 */
const bgBlur = (d: number, cam: CamOut, rack: number) => {
  const focus = lerp(1, 0.65, rack);
  const dof = Math.max(cam.dof, 5 * rack);
  const camBlur = Math.min(14, Math.abs(d - focus) * dof);
  const want = 4.9 * (1 - d) * (Math.abs(d - 0.65) < 0.01 ? 1 - rack : 1);
  return Math.max(0, want - camBlur);
};
/** The background grade: a little less saturation and contrast, slightly warmer, softer and dimmer than the subjects. */
const bgFilter = (tension: number) =>
  `saturate(0.78) contrast(0.88) brightness(${(0.95 - 0.04 * tension).toFixed(3)}) sepia(0.12)`;

/** The world point the eye should go to: his head, drawn toward the nearest go-saap's head once it is close. */
const subjectAt = (f: number, head: { x: number; y: number }, a: SaapState) => {
  const k = 0.35 * ramp(f, 230, 300);
  return { x: lerp(head.x - 10, a.x - 130 * a.s, k), y: lerp(head.y + 40, a.y - 40, k) };
};
/** Screen point (percent of the frame) of a world point on the floor plane (depth 1). */
const screenPct = (cam: CamOut, x: number, y: number) => ({
  x: clamp((960 + cam.zoom * (x - 960 - cam.x)) / 19.2, 5, 95),
  y: clamp((540 + cam.zoom * (y - 540 - cam.y)) / 10.8, 8, 92),
});

/**
 * Warm rim light on the go-saaps from the sun at the upper right: the silhouette minus a copy shifted down and left
 * leaves a thin upper-right edge, softened and tinted. Faint ground shadows (alpha under 0.5) are left out of it.
 */
const SaapRimDefs: React.FC = () => (
  <defs>
    <filter id="s03-saap-rim" x="-8%" y="-30%" width="116%" height="160%" colorInterpolationFilters="sRGB">
      <feComponentTransfer in="SourceAlpha" result="solid">
        <feFuncA type="linear" slope={3} intercept={-1.5} />
      </feComponentTransfer>
      <feOffset in="solid" dx={-3.2} dy={2.6} result="shifted" />
      <feComposite in="solid" in2="shifted" operator="out" result="edge" />
      <feGaussianBlur in="edge" stdDeviation={1.3} result="edgeSoft" />
      <feComposite in="edgeSoft" in2="solid" operator="in" result="edgeIn" />
      <feFlood floodColor="#ffdc98" floodOpacity={0.72} />
      <feComposite in2="edgeIn" operator="in" result="rim" />
      <feMerge>
        <feMergeNode in="SourceGraphic" />
        <feMergeNode in="rim" />
      </feMerge>
    </filter>
    {/* warm key light pooled on the sand under them, and the soft key on the figures */}
    <radialGradient id="s03-pool-key">
      <stop offset={0} stopColor="#fff0c6" stopOpacity={0.55} />
      <stop offset={0.55} stopColor="#ffe2a6" stopOpacity={0.22} />
      <stop offset={1} stopColor="#ffe2a6" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="s03-key-g">
      <stop offset={0} stopColor="#ffd8a0" stopOpacity={0.6} />
      <stop offset={0.6} stopColor="#ffc982" stopOpacity={0.2} />
      <stop offset={1} stopColor="#ffc982" stopOpacity={0} />
    </radialGradient>
  </defs>
);

/* ------------------------------------------------------------------ */
/* The ending: close-up of Charu at the door                            */
/* ------------------------------------------------------------------ */

/**
 * After the narrated content (CU_CUT) the picture cuts to Charu at the door and pushes in slowly from a head-and-
 * shoulders shot to a tight close-up of her face (eyes and brows in the upper middle of the frame, eyes about y 420 to
 * 455, her face about 40 to 45 percent of the frame height at the end, chin well above y 820), then holds with only a
 * slow creep to the fade. The arc over the hold:
 * - fright and amazement (CU_CUT to about +26, 596 to 622): brows lifted and drawn together, eyes wide and wet
 *   (tears 0.3: a glisten and a bead on the lower lid), hand over her mouth, a small tremble of the head and lips, and
 *   a little extra widening of the eyes as it sinks in (+4 to +16);
 * - a slow breath of relief (+20 in, +28 to +48 out): the shoulders drop, the brows ease, the hand lowers from her
 *   mouth to her throat, and a soft smile comes through the tears (+30 to +46) while the eyes stay wet; one tear slowly
 *   runs down (tears 0.3 to 0.38 from +28 to +52);
 * - a slow blink (+38 to +52), which also takes in the rig's own blink in that window.
 * The background behind her (the doorway and the mud wall) stays soft and dim; a faint warm key lights her face.
 * The chapter-break fade to black (END_FADE0, VIS_END - 20) then ends the scene.
 */
/** Her face centre in her own rig units (feet at 0): the head centre sits about 303 above her feet. */
const CH_FACE: V2 = [3, -302];
const CH_THROAT = charuArm(1, CH_TURN, 10, -222); // right hand dropped from her mouth to her throat
const CU_S0 = 3.4; // her scale at the cut (head and shoulders: face, hands at mouth and chest)
const CU_S1 = 6.3; // at the end of the push (a tight close-up of her face)
/** The main push (eased in and out, in log zoom so the pace is even) runs CU_CUT to +44; a slow creep continues into the fade. */
const CU_PUSH_END = CU_CUT + 44;
const cuPush = (f: number) => 0.93 * segE(f, CU_CUT, CU_PUSH_END) + 0.07 * clamp((f - CU_CUT - 8) / Math.max(1, VIS_END_S - CU_CUT - 8));
/** Relief: she sees he is safe (CU_CUT + 26 to + 44, 622 to 640). */
const cuRelief = (f: number) => ramp(f, CU_CUT + 26, CU_CUT + 44);
/** The soft smile through the tears (CU_CUT + 30 to + 46). */
const cuSmile = (f: number) => ramp(f, CU_CUT + 30, CU_CUT + 46);
/** One slow breath: in (the shoulders lift, +18 to +26) and a long breath out (+28 to +48) that settles them lower. */
const cuBreath = (f: number) => 1.6 * ramp(f, CU_CUT + 18, CU_CUT + 26) * (1 - ramp(f, CU_CUT + 28, CU_CUT + 48)) - 1.2 * ramp(f, CU_CUT + 32, CU_CUT + 50);
/** The eyes widen a touch more as the sight sinks in (amazement). */
const cuAmaze = (f: number) => ramp(f, CU_CUT + 4, CU_CUT + 16) * (1 - cuRelief(f));
/** A small tremble that eases as relief comes (kept small: the face is large in frame). */
const cuTremble = (f: number) => (1 - 0.8 * cuRelief(f)) * (0.6 * Math.sin(f * 1.7) + 0.4 * Math.sin(f * 2.9 + 1));
/** A slow blink: the lids close over 5 frames, rest closed for 2, and lift over 7 (CU_CUT + 38 to + 52). */
const CU_BLINK = CU_CUT + 38;
const cuBlink = (f: number) => ramp(f, CU_BLINK, CU_BLINK + 5) * (1 - ramp(f, CU_BLINK + 7, CU_BLINK + 14));

const charuCloseActing = (f: number): Partial<Pose> => {
  const rel = cuRelief(f);
  const sm = cuSmile(f);
  const br = cuBreath(f);
  const tr = cuTremble(f);
  const am = cuAmaze(f);
  const down = ramp(f, CU_CUT + 28, CU_CUT + 46);
  return {
    bodyX: 0.3 * tr,
    // breath in lifts her (negative y), the long breath out lets the shoulders drop below where they started
    bodyY: -br,
    bodyTurn: CH_TURN,
    lean: 0.2 * tr - 0.6 * rel,
    headTurn: lerp(0.4, 0.34, rel),
    headTilt: 0.6 * tr + lerp(1.5, -3, rel),
    headNod: lerp(-3, 2.5, rel) - 0.8 * Math.max(0, br),
    // looking past camera at him in the courtyard (screen right)
    eyeX: 0.6,
    eyeY: lerp(0.3, 0.42, rel),
    // wide eyes (the gasp opens them), brows lifted and drawn together; softening with relief; the slow blink
    lid: Math.max(lerp(0, 0.08, rel), cuBlink(f)),
    brow: lerp(0.85 + 0.1 * am, 0.45, rel),
    browTilt: lerp(0.58, 0.4, rel),
    smile: lerp(0, 0.32, sm),
    gasp: lerp(0.55 + 0.12 * am, 0.1, rel),
    // wet eyes with a tear bead, still wet after the relief; one tear slowly runs down in the hold
    tears: lerp(0.3, 0.38, ramp(f, CU_CUT + 28, CU_CUT + 52)),
    cheeks: lerp(0.08, 0.24, sm),
    flush: lerp(0.12, 0.22, rel),
    rS: lerp(CH_MOUTH.S, CH_THROAT.S, down),
    rE: lerp(CH_MOUTH.E, CH_THROAT.E, down),
    lS: CH_CHEST.S,
    lE: CH_CHEST.E,
    rHand: "open",
    lHand: "open",
  };
};
/** Her lips: parted a little and trembling in the fright, closing into the soft smile with only a faint quiver left. */
const charuCloseMouth = (f: number): MouthState => {
  const rel = cuRelief(f);
  const q = 0.5 + 0.5 * Math.sin(f * 1.9 + 0.4 * Math.sin(f * 0.5));
  return {
    open: Math.max(0, 0.07 * (1 - rel) + 0.035 * q * (1 - 0.7 * rel)),
    width: lerp(0.85, 1, cuSmile(f)),
    round: 0.25 * (1 - rel),
    teeth: 0,
  };
};

const CharuCloseUp: React.FC<{ f: number; lifeF: number }> = ({ f, lifeF }) => {
  const p = cuPush(f);
  // log-zoom mix, so the push keeps an even pace from the wider start to the tight end
  const S = Math.exp(lerp(Math.log(CU_S0), Math.log(CU_S1), p));
  // her face on screen: a little left of centre, looking right into the frame; the face centre rises a little as the
  // push tightens, so her eyes and brows sit in the upper middle (eyes about y 455 at the cut, about 430 to 445 at the
  // end with her relieved nod) and her chin stays well above the captions band
  const fx = lerp(905, 870, p);
  const fy = lerp(470, 435, p);
  const px = fx - S * CH_FACE[0];
  const py = fy - S * CH_FACE[1];
  // the doorway behind her: further away, so it grows less in the push and drifts a little (parallax)
  const Sb = lerp(CU_S0, lerp(CU_S0, CU_S1, 0.5), p);
  const kb = Sb / CHARU.s;
  const wx = CHARU.x + CHARU.s * CH_FACE[0];
  const wy = CHARU.y + CHARU.s * CH_FACE[1];
  const bx = fx + 24 * p - kb * wx;
  const by = fy - kb * wy;
  return (
    // the same colour lift as Stage, so the close-up matches the rest of the scene
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#2a1a0e", filter: "brightness(1.10) saturate(1.18) contrast(1.04)" }}>
      {/* the soft background: the mud wall, the door frame and the dark doorway, out of focus and a little muted */}
      {/* (it dims a little more as the push tightens, so the eye stays on her face) */}
      <div style={{ position: "absolute", inset: -60, filter: `blur(${(18 + 4 * p).toFixed(1)}px) saturate(0.78) contrast(0.9) brightness(${(0.94 - 0.08 * p).toFixed(3)})` }}>
        <svg width={2040} height={1200} viewBox="-60 -60 2040 1200" style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(${bx.toFixed(2)} ${by.toFixed(2)}) scale(${kb.toFixed(4)})`}>
            <rect x={-900} y={800} width={3800} height={70} fill="#9c7448" />
            <Hut f={lifeF} />
          </g>
          {/* warm bounce light from the sunlit courtyard on the doorway behind her, so her head separates from the dark */}
          <ellipse cx={fx + 140} cy={fy + 40} rx={520 + 140 * p} ry={460 + 120 * p} fill="#e8b47a" opacity={0.28 - 0.06 * p} />
        </svg>
      </div>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <Puppet
          cast={CAST.charu}
          f={f}
          lifeF={lifeF}
          x={px}
          y={py}
          scale={S}
          acting={charuCloseActing}
          mouth={charuCloseMouth}
          stillness={0.15}
          light={{ keySide: 1 }}
        />
      </svg>
      {/* faint warm key from the courtyard on her face (screen right); it widens with the push to keep covering her face */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse ${(30 + 12 * p).toFixed(1)}% ${(40 + 14 * p).toFixed(1)}% at ${((fx + 90 + 40 * p) / 19.2).toFixed(1)}% ${((fy - 10) / 10.8).toFixed(1)}%, rgba(255,214,150,0.5) 0%, rgba(255,190,120,0.12) 55%, rgba(0,0,0,0) 100%)`,
          mixBlendMode: "screen",
          opacity: 0.45,
        }}
      />
      <Grade warmth={0.42} vignette={0.62} bloomAt={[50, 40]} grain={0.04} />
    </div>
  );
};

/** The chapter-break fade to black (END_FADE0 to END_FADE0 + END_FADE, i.e. VIS_END - 20 to VIS_END - 3, real frames), held black to the end. */
const EndFade: React.FC<{ t: number }> = ({ t: f }) =>
  f >= END_FADE0 ? (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: "#000",
        opacity: 0.5 - 0.5 * Math.cos(Math.PI * clamp((f - END_FADE0) / END_FADE)),
      }}
    />
  ) : null;

export const Scene03Goshaap: React.FC = () => {
  // f: story clock (holds in the pauses); lifeF: real local frame (life, light, the camera)
  const { f, lifeF, pause } = useStory(SCENE_ID);
  const lx = lifeAt(lifeF, pause);
  // the ending: cut to the close-up of Charu at the door, then the chapter-break fade to black
  if (f >= CU_CUT) {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <CharuCloseUp f={f} lifeF={lifeF} />
        <EndFade t={lifeF} />
      </div>
    );
  }
  const rig = boyRig(f, lx);
  const cam = camAt(lifeF);
  // no lateral orbit any more (CAM-13): the planes keep their places
  const orb = 0;
  // divine glow (Level 1, restrained): on Balak on every frame, from 0.2 at frame 0 to a steady 0.6 after a 30-frame ramp-up,
  // brightening gently while he laughs and while he pets the go-saap, and once more in P3 (the key beat: the go-saap
  // closes its eyes under his hand)
  const petGlow = ramp(f, 330, 372) * (1 - 0.5 * ramp(f, 520, 560));
  // in the breathing pause his glow pulses softly and slowly, like calm breathing
  const restGlow = restAt(f) * (0.5 + 0.5 * Math.sin((f - REST_FROM) * 0.12 - Math.PI / 2));
  const keyBeat = lx.w[2];
  const aura = lerp(0.2, 0.6, ramp(f, 0, 30)) + 0.2 * rig.laugh + 0.16 * petGlow + 0.08 * restGlow + 0.14 * keyBeat;
  const tension = tensionAt(f);
  const warm = warmAt(f);
  const sA = saapA(f, lx);
  const sB = saapB(f, lx);
  const sC = saapC(f, lx);
  // on the veranda plinth and the step he rides higher and tips forward; the halo follows his head
  const lift = liftAt(rig.Xw);
  const [hwx, hwy] = liftPt(rig.Xw, rig.Xw + FIG_S * rig.ox, GROUND + FIG_S * rig.oy);
  const headWorld = { x: hwx, y: hwy };
  // focus rack to Charu at the door (0.65 plane) and back, in P2
  const rack = rackAt(lx);
  // the light under the tree warms up for the play
  const play = ramp(f, 300, 360);
  // falling leaves keep falling in the pauses: each starts at its story frame and falls on the life clock
  const leaf = (i: number) => {
    const [start, x0, drift, land] = LEAVES[i];
    return <FallingLeaf key={`leaf${i}`} f={lifeF} start={realOf(start)} x0={x0} drift={drift} land={land} seed={i} />;
  };
  // subject focus: where the eye should go (world and screen), and the size of the clear zone around it
  const subj = subjectAt(f, headWorld, sA);
  const sp = screenPct(cam, subj.x, subj.y);
  const zoneX = Math.min(70, 30 * Math.pow(cam.zoom, 0.55));
  const zoneY = Math.min(80, 40 * Math.pow(cam.zoom, 0.55));
  // light veils (shafts, pollen, bokeh) thin out over the subjects so they never sit across them
  const veilMask = `radial-gradient(ellipse ${(zoneX * 0.75).toFixed(1)}% ${(zoneY * 0.75).toFixed(1)}% at ${sp.x.toFixed(1)}% ${sp.y.toFixed(1)}%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.3) 45%, #000 100%)`;
  const veil = (opacity: number): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    mixBlendMode: "screen",
    opacity,
    WebkitMaskImage: veilMask,
    maskImage: veilMask,
  });
  const blurAt = (d: number) => bgBlur(d, cam, rack);
  // the warm key on the subjects, a little lower in the cool tension
  const key = 0.2 + 0.06 * play - 0.06 * tension;

  return (
    <Stage cam={{ x: cam.x, y: cam.y, zoom: cam.zoom, dof: Math.max(cam.dof, 5 * rack), focus: lerp(1, 0.65, rack) }} background="#f2d9a6">
      {/* the background planes, calmed as one group: less saturation and contrast, a little warmer, softer and dimmer,
          with blur that grows with distance, so the child and the go-saaps hold the eye */}
      <div style={{ position: "absolute", inset: 0, filter: bgFilter(tension) }}>
      <Layer depth={0.15} extraBlur={blurAt(0.15)}>
        <Orb d={0.15} o={orb}>
          <DaySky f={lifeF} sunX={1480} sunY={230} />
        </Orb>
      </Layer>

      <Layer depth={0.35} extraBlur={blurAt(0.35)}>
        <Orb d={0.35} o={orb}>
          <Jungle f={lifeF} />
        </Orb>
      </Layer>

      <Layer depth={0.5} extraBlur={blurAt(0.5)}>
        <Orb d={0.5} o={orb}>
          <BackTrees f={lifeF} />
        </Orb>
      </Layer>

      <Layer depth={0.65} extraBlur={blurAt(0.65)}>
        <Orb d={0.65} o={orb}>
          {/* the back of the courtyard: beaten earth, the bamboo fence and bushes, the hut with Charu at its door, the lemon tree in the corner */}
          <rect x={-900} y={800} width={3800} height={70} fill="#9c7448" />
          <Fence f={lifeF} />
          <Hut f={lifeF}>
            <Puppet cast={CAST.charu} f={f} lifeF={lifeF} x={CHARU.x} y={CHARU.y} scale={CHARU.s} acting={charuActing} stillness={0.15} light={{ keySide: 1 }} />
          </Hut>
          <LemonTree f={lifeF} x={LEMON.x} y={LEMON.y} s={LEMON.s} />
        </Orb>
      </Layer>

      {/* cow idles in the background with a slow head sway and an occasional look: no narration cue refers to it, so it has no reaction */}
      <Layer depth={0.85} extraBlur={blurAt(0.85)}>
        <Orb d={0.85} o={orb}>
          <Cow x={COW.x} y={COW.y} s={COW.s} flip f={lifeF} lean={cowLean(lifeF)} />
        </Orb>
      </Layer>
      </div>

      <Layer depth={1}>
        <DivineDefs />
        <SaapRimDefs />
        <defs>
          <radialGradient id="s03-halo-g">
            <stop offset={0} stopColor={DIVINE.core} stopOpacity={0.55} />
            <stop offset={0.4} stopColor={DIVINE.core} stopOpacity={0.3} />
            <stop offset={0.75} stopColor={DIVINE.core} stopOpacity={0.1} />
            <stop offset={1} stopColor={DIVINE.core} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* the sunlit beaten-earth floor of the courtyard, with faint broom sweeps */}
        <path d="M -900 880 Q 960 868 2900 880 L 2900 1300 L -900 1300 Z" fill="#b88a58" />
        {[-200, 380, 900, 1700, 2300].map((x, i) => (
          <path key={x} d={`M ${x} ${960 + 30 * (i % 2)} q 90 -18 180 0`} stroke="#a57a4a" strokeWidth={2} fill="none" opacity={0.35} />
        ))}
        <ellipse cx={1300} cy={930} rx={420} ry={60} fill="#e7c48a" opacity={0.35 + 0.1 * play} />
        {/* the near end of the veranda he starts from, and its low step */}
        <NearPlinth />
        {/* the ground under them a little brighter: a soft warm pool of key light around him and the go-saaps */}
        <ellipse cx={rig.Xw + 90} cy={GROUND + 10} rx={460} ry={62} fill="url(#s03-pool-key)" opacity={0.6 + 0.2 * play - 0.15 * tension} />

        {/* the three go-saaps, back to front: B (out of the bushes at the jungle edge), C (behind him), A (in front, under
            his hand); the bushes at the edge of the courtyard hide B's start and C's tail. Each carries a soft warm rim. */}
        <g filter="url(#s03-saap-rim)">
          <Saap st={sB} />
        </g>
        <Bush x={2420} y={884} w={300} f={lifeF} seed={21} />
        <g filter="url(#s03-saap-rim)">
          <Saap st={sC} />
        </g>
        <Bush x={470} y={882} w={240} f={lifeF} seed={31} />
        <g filter="url(#s03-saap-rim)">
          <Saap st={sA} />
        </g>
        {/* two of the falling leaves pass behind him */}
        {leaf(1)}
        {leaf(3)}
        {/* soft halo behind the head: warm light falling off smoothly, with no visible ring; it swells a little as he laughs */}
        <circle cx={headWorld.x} cy={headWorld.y} r={160} fill="url(#s03-halo-g)" />
        <circle cx={headWorld.x} cy={headWorld.y} r={150} fill="url(#s03-halo-g)" opacity={Math.min(1, 0.45 * rig.laugh + 0.35 * petGlow)} />
        <DivineAura f={lifeF} x={headWorld.x} y={headWorld.y} level={aura} s={1} />
        <g transform={`translate(0 ${lift.dy.toFixed(2)}) rotate(${lift.rot.toFixed(3)} ${lift.px.toFixed(2)} ${GROUND})`}>
          <BoyFigure r={rig} aura={aura} />
        </g>
        {/* warm key light on him and the go-saaps (screen), so they read brighter than the calmed background */}
        <ellipse cx={subj.x} cy={subj.y - 20} rx={340} ry={230} fill="url(#s03-key-g)" style={{ mixBlendMode: "screen" }} opacity={key} />
        {leaf(0)}
        {leaf(2)}
        {leaf(4)}
        {leaf(5)}
        <Butterfly f={f} />
      </Layer>

      {/* warm sun shafts through the lemon tree in screen blend, with dust and pollen catching the light: kept subtle,
          and thinned over the subjects (veilMask) so they never sit across the child and the go-saaps */}
      <div style={veil(0.62)}>
        <Layer depth={0.95}>
          <Orb d={0.95} o={orb}>
            <SunShafts f={lifeF} orb={orb} glow={play} />
            <LightDust f={lifeF} orb={orb} level={0.4 + 0.25 * play} />
          </Orb>
        </Layer>
      </div>

      {/* near plane: grass and flowers along the bottom of frame, soft and out of focus. It comes in with the cut to the
          wide (where it is only a thin fringe at the bottom), so the opening eye-level follow is unchanged. */}
      <Layer depth={1.35} extraBlur={2.6} opacity={lifeF >= R_LINE2 ? 1 : 0}>
        <Orb d={1.35} o={orb}>
          <ForegroundPlants f={lifeF} />
        </Orb>
      </Layer>

      <div style={veil(0.5)}>
        <Layer depth={1.35}>
          <Orb d={1.35} o={orb}>
            <Bokeh f={lifeF} n={10} seed={7} />
          </Orb>
        </Layer>
      </div>

      {/* subject vignette: the background dims softly away from the child and the go-saaps (centred on them) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse ${zoneX.toFixed(1)}% ${zoneY.toFixed(1)}% at ${sp.x.toFixed(1)}% ${sp.y.toFixed(1)}%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 48%, rgba(46,28,12,0.3) 100%)`,
          opacity: 0.9,
        }}
      />
      {/* tension: the frame edges darken and cool while the go-saaps close in; it lifts and warms as they settle */}
      {tension > 0.005 && (
        <>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "#9fb0b8", mixBlendMode: "multiply", opacity: 0.22 * tension }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `radial-gradient(ellipse at ${sp.x.toFixed(1)}% ${sp.y.toFixed(1)}%, rgba(0,0,0,0) 36%, rgba(10,12,16,0.5) 74%, rgba(4,5,8,0.88) 100%)`,
              opacity: 0.8 * tension,
            }}
          />
        </>
      )}
      {warm > 0.005 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(ellipse at ${sp.x.toFixed(1)}% ${sp.y.toFixed(1)}%, rgba(255,214,140,0.5) 0%, rgba(255,170,90,0.16) 50%, rgba(0,0,0,0) 80%)`,
            mixBlendMode: "screen",
            opacity: 0.4 * warm,
          }}
        />
      )}
      <Grade warmth={0.45 - 0.2 * tension + 0.12 * warm} vignette={0.5 + 0.2 * tension} bloomAt={[sp.x, sp.y - 6]} grain={0.04} />
      {/* chapter break: a gentle fade to black, held black to the end (the rice pot scene starts on top at VIS_END and
          opens on black, then fades in); it falls inside the close-up of Charu (see CharuCloseUp), so it never shows here */}
      <EndFade t={lifeF} />
    </Stage>
  );
};
