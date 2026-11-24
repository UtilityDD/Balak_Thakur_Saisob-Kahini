import React from "react";
import { blink, clamp, EASE, flicker, hash, lerp, makeActing, noise1, TAU, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { BabyThakur, DivineDefs } from "../../cinematic/divine/Divine";
import { Bokeh, Flame, Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { CAST } from "../../cinematic/rig/cast";
import { BASE_POSE, Pose, Puppet, SceneLight, SceneLights } from "../../cinematic/rig/Puppet";
import { BaidikBariDay, Banana, DayHut, DaySky, VillageFields } from "../../cinematic/sets/S01_DaySets";
import { cueLocalStory, pausesFor, PauseState, useStory } from "../../episode/storyClock";
import { EP02_SCENES } from "../timing";

/**
 * Episode 2 · scene 01_shashthi_mystery: the Vedic house, then the long room of cots.
 * Approved shot list (Ep02_Shots_and_Pauses_DRAFT.md, Scene 01; STO-16, CAM-13, CAM-14):
 *  1. "মেদিনীমণ্ডলের বিরাট বৈদিক বাড়ি।" Held wide of the Vedic house EXTERIOR on a calm bright morning
 *     (the established set BaidikBariDay). P1 (after "...বাড়ি"): the wide holds; smoke rises from the
 *     kitchen roof, banana leaves stir, a crow crosses.
 *  2. "লম্বা ঘরে সারি সারি বিছানায়..." Hard cut inside on the line: the far-left cots, then ONE slow pan
 *     right along the row, ending on Balak's cot; hold. Charu walks in from the right and stops at his cot.
 *     P2 (after "...শুয়ে থাকে"): the pan has landed; Charu looks down at the calm baby; babies cry nearby.
 *  3. "কিন্তু বাবুকর্তার নতুন খোকাটি যেন সবার চেয়ে আলাদা!" ONE slow push in, starting on "নতুন খোকাটি",
 *     to a medium close two-shot (Balak, Charu bending to kiss him); hold through "আলাদা!".
 *     P3 (after "...আলাদা"): the kiss lands, Charu's eyes linger, he gazes up at her, his glow brightens
 *     gently (key beat); she starts to straighten.
 *  4. "অন্য বাচ্চারা যখন কাঁদে, সে তখন শান্ত হয়ে শুয়ে থাকে।" Cut 7 f before the line to a medium, low
 *     across the cots: a crying baby sharp in front (a nearer row of cots), Balak soft behind. On
 *     "সে তখন শান্ত" the focus racks to Balak; hold to the scene's end.
 * Clocks (storyClock): `f` story frame (camera keys, story beats), `lifeF` real frame (breathing, blinks,
 * crying babies, smoke, leaves, motes), `pause` for the pause moments. Charu has her own clock `cf`: the
 * story clock, except that it keeps running through P3 because the approved P3 picture is her kiss landing,
 * lingering and her straightening.
 * Look rules: the white-gold divine light is Balak's alone (steady, no pulse; it brightens only on the key
 * beat). No tilak, bangles or anklets on Balak. The day is calm and bright (no rain in the windows).
 */

const SCENE_ID = "01_shashthi_mystery";
/** The scene's real length, from timing.ts (it includes its pauses and the end breath). */
const SCENE_FRAMES = EP02_SCENES.find((s) => s.sceneId === SCENE_ID)?.durationFrames ?? 708;

/* ------------------------------------------------------------------ */
/* Narration anchors (story frames, from the subtitle data: CAM-13)    */
/* ------------------------------------------------------------------ */
const cue = (snippet: string, fbFrom: number, fbTo: number) => cueLocalStory(snippet, SCENE_ID) ?? { from: fbFrom, to: fbTo };
const L1 = cue("বৈদিক বাড়ি", 0, 101);
const L2 = cue("লম্বা ঘরে", 101, 197);
const L2B = cue("বয়সের শিশুরা", 197, 270);
const L3 = cue("নতুন খোকাটি", 270, 360);
const L3B = cue("সবার চেয়ে আলাদা", 360, 406);
const L4 = cue("অন্য বাচ্চারা", 406, 476);
const L4B = cue("সে তখন শান্ত", 476, 559);
/** "নতুন খোকাটি" starts a little after the middle of the cue "কিন্তু বাবুকর্তার নতুন খোকাটি যেন". */
const NEW_BABY = Math.round(L3.from + 0.47 * (L3.to - L3.from));

/** The three approved pauses, in story order: P1 after L1, P2 after L2, P3 after L3. */
const PAUSES = pausesFor(SCENE_ID);
const P1 = PAUSES[0] ?? { atStory: L1.to, frames: 0 };
const P2 = PAUSES[1] ?? { atStory: L2B.to, frames: 0 };
const P3 = PAUSES[2] ?? { atStory: L3B.to, frames: 0 };
const P1_INDEX = 0;
const P2_INDEX = 1;
const P3_INDEX = 2;
/** Shot 4 cuts in this many frames before line 4 (inside the end of P3). */
const CUT_LEAD = 7;

/** Charu's clock: the story clock, but it runs on through P3 (her kiss, linger and straighten). */
const charuClock = (f: number, pause: PauseState) => {
  if (pause.inPause && pause.index === P3_INDEX) return P3.atStory + pause.elapsed;
  return f >= P3.atStory ? f + P3.frames : f;
};
/** A story frame on Charu's clock (story frames after P3 are later by the P3 length). */
const C = (story: number) => (story >= P3.atStory ? story + P3.frames : story);

/* Cot row: seven identical cots, evenly spaced, centre cot holds Balak. */
const COT_Y = 850;
const COT_SPACING = 340;
const COT_COUNT = 7;
const CENTRE_INDEX = 3;
const COT_X = Array.from({ length: COT_COUNT }, (_, i) => 960 + (i - CENTRE_INDEX) * COT_SPACING);
/** Which other cots hold a crying baby. The rest are asleep. Balak's cot is the centre one. */
const CRYING = new Set([0, 2, 5, 6]);
/** The long room goes on to the left: two more cots, so the pan's first frame is full of cots, not bare wall. */
const EXTRA_LEFT = [
  { x: COT_X[0] - COT_SPACING, i: 10, cry: false },
  { x: COT_X[0] - 2 * COT_SPACING, i: 13, cry: true },
];

const CALM = { x: COT_X[CENTRE_INDEX], y: COT_Y - 56, s: 1.1 };
/** Balak's head in world space (BabyThakur head offset -50, -10 at scale CALM.s): about (905, 783). */
const BALAK_HEAD = { x: CALM.x - 50 * CALM.s, y: CALM.y - 10 * CALM.s };

/* Charu: enters from the right, stands beside the centre cot (at its foot end) and leans over it.
 * standX is where her feet stop; her feet stay planted for the rest of the scene.
 * She stands in the gap between Balak's cot and the next cot: Balak's feet reach about x 1055 and
 * her silhouette (arms and saree) is about +/-75 px wide, so at +180 she never covers him, and she
 * stays clear of the next baby's head (about x 1230). */
const CHARU = { standX: COT_X[CENTRE_INDEX] + 180, y: 860, s: 1.5 };
/** She stops at the cot before P2 (P2 shows her "just stopped"). */
const WALK_END = Math.min(252, P2.atStory - 18);

const WINDOWS = [
  { x: 220, y: 170, w: 260, h: 300 },
  { x: 1000, y: 170, w: 260, h: 300 },
  { x: 1720, y: 170, w: 260, h: 300 },
];

/** Other babies: warm skin tones and muted, non-festive cloth (no white-gold, no ornaments). */
const SKINS = ["#c98e66", "#a86e4a", "#dba87e", "#b97a52", "#e0b08a", "#9c6440", "#c48a5e"];
const CLOTHS = ["#c2553e", "#7ea37a", "#d8a04c", "#6f8fb0", "#b58fb0", "#c9a27a", "#8fa6a0"];

const DAY_LIGHTS: SceneLight[] = [{ x: 1880, y: 330, color: "#ffc878", intensity: 0.55, radius: 1400 }];

/* ------------------------------------------------------------------ */
/* Camera (story frames, keyed to the narration)                       */
/*  Shot 1 (exterior): a held wide, no move.                           */
/*  Shot 2: cut in on L2 framed on the far-left cots; one slow eased   */
/*          pan right, ending on Balak's cot at 82 % of line 2; hold   */
/*          (through P2, about 4 s) until the push.                    */
/*  Shot 3: one slow push in from "নতুন খোকাটি" to the two-shot of     */
/*          Balak and Charu kissing him (zoom 1.35); hold through      */
/*          "আলাদা!" and P3.                                           */
/*  Shot 4: a cut 7 f before L4; static; only the focus racks.         */
/* Base zoom 1.0 keeps every layer inside its background.              */
/* ------------------------------------------------------------------ */
/* The pan starts 125 px further left than centring the far-left cot, so the frame's right edge
 * (about world x 775) sits between cot 2 and Balak's cot: his cot is fully off frame, never half cut. */
const PAN_START_X = COT_X[0] - 960 - 125;
const PAN_END_X = 20;
const PAN_END = Math.round(L2.from + 0.82 * (L2B.to - L2.from));
const panX = (f: number) => track(f, [[L2.from, PAN_START_X], [PAN_END, PAN_END_X, "inOut"]]);
/** The push: starts on "নতুন খোকাটি", lasts about 2.6 s. */
const PUSH_IN = NEW_BABY;
const PUSH_LEN = 62;
const pushAt = (f: number) => EASE.inOut(clamp((f - PUSH_IN) / PUSH_LEN));

/** Charu's head at the bottom of the kiss (lean -20, nod, hips back): about world (1090, 460). */
const CHARU_KISS_HEAD = { x: 1090, y: 460 };
/** Camera that puts world point `at` at screen point `scr` at `zoom`. */
const frameOn = (at: { x: number; y: number }, scr: { x: number; y: number }, zoom: number) => ({
  x: at.x - 960 - (scr.x - 960) / zoom,
  y: at.y - 540 - (scr.y - 540) / zoom,
  zoom,
});
/* Two-shot: the midpoint of the two faces at screen (960, 460), zoom 1.35. Balak's face lands at about
 * screen y 678, Charu's at about 240: both in frame and above the caption band; the floor top stays
 * above the wall's lower edge and every plate covers the frame. */
const TWO_SHOT = frameOn(
  { x: (BALAK_HEAD.x + CHARU_KISS_HEAD.x) / 2, y: (BALAK_HEAD.y + CHARU_KISS_HEAD.y) / 2 },
  { x: 960, y: 460 },
  1.35,
);
/* Shot 4, low across the cots: Balak's face right of centre at screen (1150, 690), zoom 1.22, so Charu's
 * whole head stays in frame (about screen y 240 upright) and the floor top stays above the wall's lower edge. */
const LOW_SHOT = frameOn(BALAK_HEAD, { x: 1150, y: 690 }, 1.22);
/** The nearer cot (front row) for shot 4, on a nearer plane; its crying baby sits lower left. */
const FRONT_DEPTH = 1.3;
/* Its crying baby's face lands at about screen (560, 780): sharp, lower left, above the caption band. */
const FRONT = { x: 443, y: 1004, s: 1.5 };
/** Rack focus in shot 4: 0 = the front crying baby sharp, 1 = Balak sharp. Starts 4 f before "সে তখন শান্ত". */
const rackAt = (f: number) => EASE.inOut(clamp((f - (L4B.from - 4)) / 22));

/* ------------------------------------------------------------------ */
/* Balak's glow (Charu's clock): a gentle lift as the pan lands on him,  */
/* the key beat in P3 (the kiss) brightens it softly, then it settles.   */
/* ------------------------------------------------------------------ */
const glowAt = (cf: number) =>
  track(cf, [
    [PAN_END - 40, 0],
    [PAN_END, 1],
    [P3.atStory - 4, 1],
    [P3.atStory + 22, 1.45],
    [P3.atStory + P3.frames, 1.4],
    [C(L4.from) + 50, 1.1],
  ]);

/* ------------------------------------------------------------------ */
/* Charu's acting (keys on Charu's clock cf)                           */
/* ------------------------------------------------------------------ */

// Charu walks in from the right, stops at the calm newborn's cot and looks down at him (P2), then on
// "নতুন খোকাটি" leans over, cups her hands over him and bends to kiss his forehead at the end of line 3.
// In P3 the kiss lands, her eyes open and linger on him, and she straightens (on into shot 4).
// Arms at rest: a soft elbow bend (about 24 deg) and a slight lift from the body, never locked
// straight. In the bend both arms come forward (screen left, toward the cot): the right arm by a
// negative rS (it crosses in front of the chest), the left by a positive lS. bodyTurn stays at or
// above -0.34 so the rig keeps both arms on the near side and both follow the torso lean.
const ARMS_REST = { rS: 4, rE: -24, lS: 4, lE: -24 };
/** The reach starts 7 frames before "নতুন খোকাটি". */
const REACH = NEW_BABY - 7;
/** The kiss lands at the start of P3. */
const KISS = P3.atStory;
const charuKeys = makeActing<Pose>(BASE_POSE, [
  { f: 0, stride: 0.9, bodyTurn: -0.25, headTurn: -0.1, eyeY: 0.1, smile: 0.45, ...ARMS_REST },
  { f: WALK_END - 27, stride: 0.9 },
  { f: WALK_END, ease: "inOut", stride: 0, in: 27 },
  // she has just stopped: eyes and head find the calm baby (held through P2, with life)
  { f: WALK_END + 14, ease: "inOut", in: 14, bodyTurn: -0.3, headTurn: -0.18, headTilt: 4, eyeX: -0.2, eyeY: 0.6, smile: 0.5 },
  // after P2: a small weight settle while she watches him (no frozen hold before the reach)
  { f: P2.atStory + 18, ease: "inOut", in: 18, headTilt: 6, smile: 0.55, eyeY: 0.65 },
  // Anticipation: a small rise-and-dip (knees give, torso eases back) and the arms draw in a touch.
  { f: REACH, ease: "inOut", in: 14, lean: 2.5, crouch: 0.06, bodyTurn: -0.32, headTurn: -0.2, eyeX: -0.2, eyeY: 0.65, rS: 0, rE: -30, lS: 6, lE: -30 },
  // the bend, shared between hips and waist: the waist lean stays moderate; the hips shift back with the
  // skirt following them (hipBackAt, a shear around her planted feet) and the knees soften. The upper arms
  // lead forward while the forearms still trail folded.
  { f: REACH + 20, ease: "inOut", in: 20, lean: -11, crouch: 0.09, bodyTurn: -0.34, headNod: 7, headTilt: 6, headTurn: -0.28, eyeX: -0.25, eyeY: 0.8, lid: 0.3, brow: 0.15, smile: 0.55, rS: -16, rE: -42, lS: 18, lE: -36 },
  // the forearms open and both hands arrive forward over the cot and cup; the lean overshoots slightly
  { f: REACH + 34, ease: "inOut", in: 14, lean: -20, crouch: 0.11, headNod: 12, headTilt: 10, headTurn: -0.35, eyeY: 0.85, lid: 0.45, brow: 0.2, smile: 0.6, rS: -34, rE: -20, lS: 40, lE: -16, rHand: "cup", lHand: "cup" },
  // soft settle of the bend
  { f: REACH + 46, ease: "inOut", in: 12, lean: -19, crouch: 0.1 },
  // she gazes at him over the cot, the smile growing (small moves, never frozen)
  { f: Math.round((REACH + 46 + KISS - 22) / 2), ease: "inOut", in: 20, headTilt: 12, smile: 0.66, lid: 0.4 },
  // the kiss: head dips to his forehead, eyes close; it lands as P3 begins
  { f: KISS, ease: "inOut", in: 22, headNod: 15, headTilt: 10, lid: 0.95, smile: 0.7 },
  // P3: the kiss held a moment, then her eyes open and linger on him
  { f: KISS + 12, ease: "inOut", in: 12, headTilt: 11, smile: 0.72 },
  { f: KISS + 30, ease: "inOut", in: 18, headNod: 12, lid: 0.4, eyeY: 0.85, smile: 0.72, brow: 0.12 },
  // she straightens (late in P3, on into shot 4): hands open out of the cup, back to rest with a hair of overshoot
  { f: KISS + 76, ease: "inOut", in: 40, lean: 1.5, crouch: 0, bodyTurn: -0.15, headNod: 0, headTurn: 0.1, headTilt: 4, lid: 0.15, eyeY: 0.75, smile: 0.55, brow: 0.1, ...ARMS_REST, rHand: "relaxed", lHand: "relaxed" },
  { f: KISS + 90, ease: "inOut", in: 14, lean: 0 },
  // line 4: the gaze settles on the calm baby from 7 frames before "সে তখন শান্ত"
  { f: C(L4B.from) - 7 + 28, ease: "inOut", in: 28, eyeX: -0.25, eyeY: 0.7, headTurn: 0.1, headTilt: 4, smile: 0.5, lid: 0.25, brow: 0.1 },
]);
/** After the gaze settles she keeps watching him: a slow, small drift of the head and a soft settle of weight. */
const DRIFT_FROM = C(L4B.from) + 24;
const driftIn = (cf: number) => track(cf, [[DRIFT_FROM, 0], [DRIFT_FROM + 18, 1]]);
const driftPh = (cf: number) => Math.max(0, cf - DRIFT_FROM) * 0.11;
/** P2: she looks down at him, a soft head tilt and smile that rise and fall within the pause. */
const p2Bump = (pause: PauseState) => (pause.inPause && pause.index === P2_INDEX ? Math.sin(Math.PI * pause.t) : 0);

/** Charu's pose on her clock; `bump` is the P2 look (0..1). While she walks, the arms swing against the legs. */
const charuPose = (fr: number, bump = 0): Pose => {
  const k = charuKeys(fr);
  const b = driftIn(fr);
  const ph = driftPh(fr);
  const p: Pose =
    b > 0 || bump > 0
      ? {
          ...k,
          headTilt: k.headTilt + b * Math.sin(ph * 0.55) * 2.2 + bump * 3,
          headNod: k.headNod + b * (1 - Math.cos(ph * 0.4)) * 1.4 + bump * 3,
          lean: k.lean + b * Math.sin(ph * 0.35) * 0.9,
          smile: k.smile + b * 0.06 * (1 - Math.cos(ph * 0.3)) + bump * 0.1,
          lid: k.lid + bump * 0.12,
        }
      : k;
  const stride = Math.max(0, p.stride);
  if (stride <= 0.001) return p;
  const swing = -Math.sin(fr * 0.3 + CAST.charu.seed) * 5 * stride;
  const flex = Math.abs(swing) * 0.4;
  return { ...p, rS: p.rS + swing, lS: p.lS + swing, rE: p.rE - flex, lE: p.lE - flex };
};
const charuActing = (fr: number): Pose => charuPose(fr);

/** Hip shift during the bend, 0..1: the hips (and the skirt with them) move back while the feet stay planted. */
const hipBackAt = (f: number) =>
  track(f, [[0, 0], [REACH, 0], [REACH + 20, 0.55], [REACH + 34, 1], [KISS + 36, 1], [KISS + 76, 0]]);
/** Hip shift at full bend in screen px, over the hip height above the feet (about 224 px for Charu at scale 1.5). */
const HIP_BACK_PX = 14;
const CHARU_HIP_H = 224;

/**
 * Planted feet: the body travels exactly as fast as the bearing foot moves back relative to the
 * hips in the Puppet's leg rig (phase = f * 0.3 + seed, thigh swing 0.42 * stride, seen through the
 * body yaw), so the stance foot stays fixed on the floor. The path is integrated once, backwards
 * from the stop mark, so she still arrives at standX by WALK_END.
 */
const CHARU_THIGH = 80 * CAST.charu.height;
const CHARU_SHIN = 74 * CAST.charu.height;
const charuFootSpeed = (fr: number): number => {
  const p = charuActing(fr);
  const stride = Math.max(0, p.stride);
  if (stride <= 0.001) return 0;
  const sphi = Math.abs(Math.sin(clamp(p.bodyTurn, -1, 1) * 0.95));
  const ph = fr * 0.3 + CAST.charu.seed;
  // the bearing leg is the one whose foot moves backwards relative to the hips (cos < 0)
  const phS = Math.cos(ph) < 0 ? ph : ph + Math.PI;
  const th = 0.03 + Math.sin(phS) * 0.42 * stride;
  const kn = 0.05 + 0.12 * stride;
  const dth = Math.abs(Math.cos(phS)) * 0.42 * stride * 0.3;
  return CHARU.s * sphi * (CHARU_THIGH * Math.cos(th) + CHARU_SHIN * Math.cos(th - kn)) * dth;
};
const CHARU_X: number[] = (() => {
  const travelled: number[] = [0];
  let acc = 0;
  for (let fr = 0; fr < SCENE_FRAMES + 1; fr++) {
    acc += charuFootSpeed(fr + 0.5);
    travelled.push(acc);
  }
  return travelled.map((d) => CHARU.standX + (acc - d));
})();
const charuXAt = (f: number) => CHARU_X[Math.max(0, Math.min(CHARU_X.length - 1, Math.round(f)))];

/* ------------------------------------------------------------------ */
/* Room                                                                */
/* ------------------------------------------------------------------ */

/** Indoor room window: the calm bright morning outside (it matches the exterior of shot 1; no rain). */
const RoomWindow: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <g>
    <rect x={x - 18}y={y - 18} width={w + 36} height={h + 36} fill="#4a2c18" />
    <rect x={x} y={y} width={w} height={h} fill="url(#ep2s1-sky)" />
    {/* far village: a green band with banana-leaf silhouettes */}
    <rect x={x} y={y + h * 0.66} width={w} height={h * 0.34} fill="#6f7f4a" opacity={0.75} />
    <path d={`M ${x + w * 0.2} ${y + h * 0.7} q 18 -70 58 -58 q -34 14 -54 58 Z`} fill="#4f6a3a" />
    <path d={`M ${x + w * 0.62} ${y + h * 0.72} q 22 -80 70 -64 q -38 16 -62 66 Z`} fill="#4f6a3a" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={x + 22 + (i * (w - 44)) / 3} y={y} width={9} height={h} fill="#5a3820" />
    ))}
    <rect x={x} y={y + h} width={w} height={14} fill="#6a4228" />
  </g>
);

/** Soft lamp flicker around 1.0 (about +/-10 %), same seed as the flame so they breathe together. */
const lampFlicker = (f: number) => 1 + (flicker(f, 55) - 0.86) * 0.6;

const BackWall: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <GlowDefs />
    <defs>
      <linearGradient id="ep2s1-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#c9a070" />
        <stop offset="70%" stopColor="#a9774a" />
        <stop offset="100%" stopColor="#6e4628" />
      </linearGradient>
      <linearGradient id="ep2s1-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9cc4dc" />
        <stop offset="60%" stopColor="#dfe6d2" />
        <stop offset="100%" stopColor="#f3dfa8" />
      </linearGradient>
    </defs>
    <rect x={-800} y={-300} width={3800} height={1140} fill="url(#ep2s1-wall)" />
    {/* plaster patches and hairline cracks */}
    {Array.from({ length: 16 }, (_, i) => (
      <ellipse
        key={i}
        cx={-300 + hash(i * 3.3) * 2800}
        cy={-40 + hash(i * 5.1) * 560}
        rx={60 + hash(i * 7.7) * 140}
        ry={30 + hash(i * 2.2) * 70}
        fill="#4a2c18"
        opacity={0.04 + hash(i) * 0.04}
      />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={i}
        d={`M ${-100 + i * 650 + hash(i) * 120} ${80 + hash(i * 2) * 120} l 10 22 l -7 18 l 12 26`}
        stroke="#3a2214"
        strokeWidth={1.4}
        fill="none"
        opacity={0.35}
      />
    ))}
    {/* dado: darker lower band of the wall */}
    <rect x={-800} y={560} width={3800} height={200} fill="#5a3820" opacity={0.35} />
    {WINDOWS.map((w) => (
      <RoomWindow key={w.x} x={w.x} y={w.y} w={w.w} h={w.h} />
    ))}
    {/* niche with a clay lamp: warm light that flickers softly with the flame */}
    <path d="M 600 430 L 600 350 Q 640 310 680 350 L 680 430 Z" fill="#3a2214" />
    <Glow x={640} y={414} r={80 * (0.97 + 0.04 * lampFlicker(f))} kind="warm" o={0.5 * lampFlicker(f)} />
    <Flame x={640} y={424} s={1} f={f} seed={55} />
    <rect x={620} y={428} width={40} height={8} rx={4} fill="#8a4a24" />
    {/* shelf with brass pots */}
    <rect x={1500} y={300} width={260} height={14} fill="#5a3820" />
    {[1530, 1600, 1680].map((x, i) => (
      <g key={x} transform={`translate(${x}, 300)`}>
        <ellipse cx={0} cy={-22 - i * 2} rx={20 + (i % 2) * 6} ry={24 + (i % 2) * 4} fill={i % 2 ? "#c9932e" : "#a87420"} />
        <rect x={-8} y={-52 - i * 3} width={16} height={8} fill="#8a6018" />
      </g>
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* Cots and babies                                                     */
/* ------------------------------------------------------------------ */

/** One identical cot: same frame, mattress and white bedding pattern for every cot. */
const Cot: React.FC<{ x: number }> = ({ x }) => (
  <g transform={`translate(${x}, ${COT_Y})`}>
    {/* contact shadow on the floor: grounds the cot */}
    <ellipse cx={0} cy={5} rx={150} ry={9} fill="#000" opacity={0.28} />
    <rect x={-138} y={-130} width={12} height={130} fill="#5a3820" />
    <rect x={126} y={-130} width={12} height={130} fill="#5a3820" />
    <rect x={-136} y={-126} width={3} height={122} fill="#8a5c36" opacity={0.7} />
    <rect x={-138} y={-130} width={276} height={10} rx={3} fill="#6b4426" />
    <rect x={-130} y={-22} width={260} height={16} fill="#7a4e2c" />
    <rect x={-124} y={-34} width={248} height={14} rx={5} fill="#efe2c6" />
    <rect x={-124} y={-34} width={248} height={14} rx={5} fill="url(#ep2s1-bed)" />
  </g>
);

/** Other babies: swaddled, breathing, kicking, waving fists. Crying in waves or asleep. */
const CotBaby: React.FC<{ f: number; i: number; x: number; cry: boolean; boost?: number }> = ({ f, i, x, cry, boost = 0 }) => {
  const p = hash(i * 4.7 + 1) * TAU;
  // crying rhythm: irregular bursts, not a periodic loop
  const wail = cry
    ? clamp(
        (Math.sin(f * 0.29 + p) * 0.6 + Math.sin(f * 0.13 + p * 1.7) * 0.4 + noise1(f * 0.03, i + 5) * 0.5 - 0.05) * 1.5 + boost,
      )
    : 0;
  const skin = SKINS[i % SKINS.length];
  const cloth = CLOTHS[i % CLOTHS.length];
  // stirs: occasional soft wriggles at irregular, per-baby times (slow noise crossing a threshold)
  const stirRaw = clamp((noise1(f * 0.018 + i * 3.7, i + 33) - 0.3) / 0.45);
  const stir = stirRaw * stirRaw * (3 - 2 * stirRaw);
  const squirm = noise1(f * 0.09, i + 41);
  const rock = Math.sin(f * 0.16 + p) * (cry ? 2.5 : 1.2) + noise1(f * 0.05, i + 3) * 2 + stir * squirm * 3.5;
  // irregular breathing: the rate drifts (phase wobble) and each breath has its own depth
  const breathPh = f * 0.1 + p * 0.7 + 2.4 * noise1(f * 0.011, i + 21);
  const breath = Math.sin(breathPh) * (0.75 + 0.25 * noise1(f * 0.02, i + 27));
  // eyes blink on their own irregular timing (open-eyed babies only)
  const lidBlink = blink(f, i * 7 + 3);
  const kick = Math.sin(f * 0.27 + p * 1.3) * (0.5 + wail * 1.2) + stir * noise1(f * 0.11, i + 47) * 1.4;
  const armSwing = Math.sin(f * 0.21 + p * 0.9) * (0.4 + wail * 0.9) + stir * noise1(f * 0.07, i + 53) * 1.1;
  const headTilt = Math.sin(f * 0.05 + p) * 3 - wail * 2 + stir * noise1(f * 0.06, i + 45) * 6;
  const hair = "#2a1a12";
  // tears: small drops that fall from the squeezed eyes while crying
  const tearOn = cry && wail > 0.45;
  const drop = ((f * 0.9 + i * 7) % 24) / 24;
  return (
    <g transform={`translate(${x}, ${COT_Y}) translate(${rock}, -36)`}>
      <defs>
        <linearGradient id={`cloth-${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.5} />
          <stop offset="60%" stopColor="#000000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000000" stopOpacity={0.22} />
        </linearGradient>
        <radialGradient id={`face-${i}`} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#fff3e6" stopOpacity={0.8} />
          <stop offset="65%" stopColor={skin} />
          <stop offset="100%" stopColor="#7a4a2e" />
        </radialGradient>
      </defs>
      {/* shadow of the body on the mattress */}
      <ellipse cx={4} cy={-6} rx={64} ry={6} fill="#000" opacity={0.18} />
      {/* feet kicking out from under the swaddle */}
      <ellipse cx={-38 + kick * 2} cy={-6} rx={8} ry={5} fill={skin} />
      <ellipse cx={34 - kick * 2} cy={-5} rx={8} ry={5} fill={skin} />
      {/* swaddled body, breathing */}
      <g transform={`translate(0, -20) scale(1, ${1 + breath * 0.025})`}>
        <ellipse cx={0} cy={0} rx={58} ry={24} fill={cloth} />
        <ellipse cx={0} cy={0} rx={58} ry={24} fill={`url(#cloth-${i})`} />
        <path d="M -44 -12 Q -20 -22 6 -10" stroke="#000" strokeWidth={1.2} fill="none" opacity={0.2} />
        <path d="M 2 -14 Q 14 2 8 14" stroke="#000" strokeWidth={1} fill="none" opacity={0.15} />
        <path d="M -30 8 Q -10 14 14 8" stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.25} />
        {/* soft light on the top of the chest (it brightens as the chest rises) and a warm rim from the window side */}
        <path d="M -40 -8 Q -20 -24 6 -22" stroke="#fff3d6" strokeWidth={2.4} fill="none" opacity={0.3 + breath * 0.08} />
        <path d="M 40 -14 Q 60 -4 52 10" stroke="#ffd9a0" strokeWidth={2.2} fill="none" opacity={0.35} />
      </g>
      {/* small arms with waving fists; the fists show their small finger creases */}
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side * 30}, -32) rotate(${side < 0 ? -32 + armSwing * 10 : 32 - armSwing * 10})`}>
          <ellipse cx={0} cy={-8} rx={6} ry={11} fill={skin} />
          <circle cx={0} cy={-22} r={5.5} fill={skin} />
          <path d="M -3.5 -19 Q 0 -17.2 3.5 -19 M -3.5 -23.5 Q 0 -21.7 3.5 -23.5" stroke="#8a5a3c" strokeWidth={0.7} fill="none" opacity={0.6} />
        </g>
      ))}
      {/* head with a soft shaded face and a small hair tuft */}
      <g transform={`translate(-44, -46) rotate(${headTilt})`}>
        <circle cx={-23} cy={3} r={5} fill={skin} />
        <circle cx={23} cy={3} r={5} fill={skin} />
        <circle cx={0} cy={0} r={24} fill={`url(#face-${i})`} />
        <path d="M -12 -19 Q 0 -30 12 -19 Q 0 -22 -12 -19 Z" fill={hair} />
        {!cry ? (
          /* asleep: closed eyes, slow breathing mouth */
          <g stroke="#4a2a1a" strokeWidth={2} fill="none" strokeLinecap="round">
            <path d="M -13 -2 q 4 3 8 0" />
            <path d="M 5 -2 q 4 3 8 0" />
          </g>
        ) : wail > 0.6 ? (
          /* squeezed eyes while wailing */
          <g stroke="#4a2a1a" strokeWidth={2} fill="none" strokeLinecap="round">
            <path d="M -13 -2 q 4 -4 8 0" />
            <path d="M 5 -2 q 4 -4 8 0" />
          </g>
        ) : (
          /* open eyes between cries; they close briefly now and then */
          <g transform={`translate(0, -2) scale(1, ${1 - lidBlink * 0.92}) translate(0, 2)`}>
            <circle cx={-9} cy={-2} r={2.6} fill="#3a2418" />
            <circle cx={9} cy={-2} r={2.6} fill="#3a2418" />
            <circle cx={-8} cy={-3} r={0.8} fill="#fff" />
            <circle cx={10} cy={-3} r={0.8} fill="#fff" />
          </g>
        )}
        {tearOn && (
          <g fill="#bfe3ff">
            <circle cx={-10} cy={3 + drop * 14} r={1.6} opacity={(wail - 0.45) * 1.3 * (1 - drop)} />
            <circle cx={10} cy={3 + ((drop + 0.5) % 1) * 14} r={1.6} opacity={(wail - 0.45) * 1.3 * (1 - ((drop + 0.5) % 1))} />
          </g>
        )}
        <circle cx={-14} cy={8} r={5} fill="#f08a7a" opacity={0.35} />
        <circle cx={14} cy={8} r={5} fill="#f08a7a" opacity={0.35} />
        {cry ? (
          <ellipse cx={0} cy={11} rx={5} ry={1.5 + wail * 6} fill="#7a2a2a" />
        ) : (
          <ellipse cx={0} cy={11} rx={2.2} ry={1.2 + breath * 0.3} fill="#9a4a4a" opacity={0.7} />
        )}
        {wail > 0.8 && <circle cx={-10} cy={8 + wail * 4} r={1.6} fill="#cfe8ff" opacity={0.8} />}
      </g>
    </g>
  );
};

/** The other six cots and babies (drawn on their own plane so the rack focus can soften them). */
const CribRow: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      {/* one shared bedding pattern: every cot uses it, so the bedding matches exactly */}
      <pattern id="ep2s1-bed" patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width={0.1} height={1}>
        <rect x={0} y={0} width={0.5} height={1} fill="#d9c9a6" opacity={0.45} />
      </pattern>
    </defs>
    {EXTRA_LEFT.map((c) => (
      <g key={`x${c.i}`}>
        <Cot x={c.x} />
        <CotBaby f={f} i={c.i} x={c.x} cry={c.cry} />
      </g>
    ))}
    {COT_X.map((x, i) =>
      i === CENTRE_INDEX ? null : (
        <g key={i}>
          <Cot x={x} />
          <CotBaby f={f} i={i} x={x} cry={CRYING.has(i)} />
        </g>
      ),
    )}
  </g>
);

/** The centre cot with the calm newborn: the only divine light source (steady glow, no pulse). */
const BalakCot: React.FC<{ f: number; lifeF: number; lift: number; close: number }> = ({ f, lifeF, lift, close }) => {
  // P3: he gazes up at her as the kiss lands, then back to his calm look as she straightens
  const look = track(f, [[KISS - 12, 0], [KISS + 16, 1], [KISS + 70, 1], [KISS + 100, 0]]);
  return (
    <g>
      <Cot x={COT_X[CENTRE_INDEX]} />
      {/* his own white-gold glow lifts gently when the camera settles on him */}
      {lift > 0.01 && <circle cx={BALAK_HEAD.x} cy={BALAK_HEAD.y} r={120} fill="url(#dv-glow)" opacity={0.2 * lift} />}
      {/* on the key beat (the kiss) it brightens a little more, softly */}
      {close > 0.01 && <circle cx={BALAK_HEAD.x} cy={BALAK_HEAD.y} r={78} fill="url(#dv-glow)" opacity={0.3 * close} />}
      <BabyThakur
        f={f}
        lifeF={lifeF}
        x={CALM.x}
        y={CALM.y}
        s={CALM.s}
        open={0.8}
        aura={1}
        rot={0}
        headRoll={-40}
        smile={0.6 + 0.12 * look}
        lookX={0.3 + 0.18 * look}
        lookY={-0.3 - 0.25 * look}
        turn={0.1}
        wiggle={0.15}
      />
    </g>
  );
};

const Floor: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="ep2s1-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7a4e2c" />
        <stop offset="100%" stopColor="#3e2412" />
      </linearGradient>
    </defs>
    {/* wide enough that the opening pan (camera x -1145) never shows an empty edge */}
    <rect x={-1600} y={860} width={5200} height={300} fill="url(#ep2s1-floor)" />
    <rect x={-1600} y={856} width={5200} height={8} fill="#2e1a0c" opacity={0.6} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Shot 1: the Vedic house outside, a calm bright morning               */
/* ------------------------------------------------------------------ */

/** A crow crossing the sky in P1 (wings flapping, a slight bob). */
const Crow: React.FC<{ t: number; lifeF: number }> = ({ t, lifeF }) => {
  if (t <= 0 || t >= 1) return null;
  const x = lerp(1560, 260, t);
  const y = lerp(170, 120, t) + Math.sin(t * 9) * 6;
  const w = Math.sin(lifeF * 0.9) * 10;
  return (
    <g transform={`translate(${x}, ${y}) scale(-1.1, 1.1)`} fill="#1e1a1c">
      <ellipse cx={0} cy={0} rx={13} ry={5} />
      <circle cx={13} cy={-2} r={4.5} />
      <path d="M 17 -2 L 23 0 L 17 1 Z" fill="#3a3436" />
      <path d="M -12 0 L -22 -3 L -22 4 Z" />
      <path d={`M -3 -2 Q -10 ${-10 - w} -24 ${-6 - w * 1.6} Q -12 ${-4 - w * 0.4} -1 1 Z`} />
      <path d={`M 3 -2 Q 8 ${-12 - w} 18 ${-10 - w * 1.4} Q 10 ${-5 - w * 0.4} 4 1 Z`} opacity={0.85} />
    </g>
  );
};

/** Soft kitchen smoke rising from the outhouse roof and drifting left on the breeze (clear of the house). */
const KitchenSmoke: React.FC<{ lifeF: number; x: number; y: number }> = ({ lifeF, x, y }) => (
  <g>
    {Array.from({ length: 7 }, (_, k) => {
      const t = ((lifeF + k * 22) % 154) / 154;
      const r = 14 + t * 46;
      return (
        <circle
          key={k}
          cx={x + Math.sin(t * 4 + k) * 10 - t * t * 110}
          cy={y - t * 330}
          r={r}
          fill="#eee8e0"
          opacity={0.55 * Math.sin(Math.PI * Math.min(1, t * 1.25)) * (1 - t * 0.5)}
        />
      );
    })}
  </g>
);

const HOUSE_CAM: Cam = { x: 0, y: 20, zoom: 1, focus: 0.7, dof: 1.2 };
const HOUSE_SUN: SceneLight = { x: 1660, y: 140, color: "#ffe2a8", intensity: 0.5, radius: 1800 };

/** Shot 1 and P1: a held wide; only life moves (clouds, smoke, leaves, birds, the crow in P1). */
const HouseExterior: React.FC<{ lifeF: number }> = ({ lifeF }) => {
  // the crow crosses during P1 (it enters just before the pause and leaves frame after the cut)
  const crowT = (lifeF - (P1.atStory - 14)) / 60;
  // a soft breath of wind through the near banana leaves, a little stronger in P1
  const gust = 1.5 * Math.sin(lifeF * 0.045) + 1.2 * noise1(lifeF * 0.03, 9) + 1.6 * Math.sin(Math.PI * clamp((lifeF - P1.atStory + 6) / 34));
  return (
    <Stage cam={HOUSE_CAM} background="#cfe0d8" opacity={clamp(lifeF / 14)}>
      <SceneLights.Provider value={[HOUSE_SUN]}>
        <Layer depth={0.05}>
          <DaySky f={lifeF} sunX={1660} sunY={140} />
        </Layer>
        <Layer depth={0.3}>
          <VillageFields f={lifeF} />
        </Layer>
        <Layer depth={0.6}>
          <Crow t={crowT} lifeF={lifeF} />
        </Layer>
        <Layer depth={0.7}>
          {/* the kitchen outhouse behind the compound wall, smoke rising from its roof */}
          <DayHut x={40} y={760} s={0.9} f={lifeF} seed={2} />
          <BaidikBariDay f={lifeF} />
          <KitchenSmoke lifeF={lifeF} x={70} y={612} />
          {/* the swept earth courtyard in front of the house */}
          <path d="M -900 785 L 2800 785 L 2800 1300 L -900 1300 Z" fill="#d8c09a" />
          <path d="M -900 785 L 2800 785" stroke="#b8a07a" strokeWidth={6} />
        </Layer>
        <Layer depth={1.15}>
          {/* near banana clump at the right edge frames the house; its leaves stir */}
          <g transform={`rotate(${gust * 0.6} 1800 1150)`}>
            <Banana x={1800} y={1150} s={2.3} f={lifeF * 1.3} />
          </g>
          <g transform={`rotate(${-gust * 0.5} 1990 1170)`}>
            <Banana x={1990} y={1170} s={2.0} f={lifeF * 1.1 + 40} />
          </g>
        </Layer>
        <Grade warmth={0.22} vignette={0.5} bloomAt={[86, 13]} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export const Scene01Shashthi: React.FC = () => {
  const { f, lifeF, pause } = useStory(SCENE_ID);

  // shot 1 (and P1): the house outside; the hard cut inside lands on line 2
  const exterior = f < L2.from || (pause.inPause && pause.index === P1_INDEX);
  if (exterior) return <HouseExterior lifeF={lifeF} />;

  // shot 4 cuts in 7 frames before line 4, inside the end of P3
  const shot4 =
    (pause.inPause && pause.index === P3_INDEX && pause.elapsed >= pause.frames - CUT_LEAD) || (!pause.inPause && f >= P3.atStory);
  const push = pushAt(f);
  const rack = shot4 ? rackAt(f) : 0;
  const cam: Cam = shot4
    ? { ...LOW_SHOT, focus: 1, dof: 1.3 }
    : {
        x: lerp(panX(f), TWO_SHOT.x, push),
        y: lerp(0, TWO_SHOT.y, push),
        zoom: lerp(1, TWO_SHOT.zoom, push),
        focus: 1,
        // the wall falls a little further out of focus as the camera pushes in on the two of them
        dof: lerp(1.2, 1.7, push),
      };

  const cf = charuClock(f, pause);
  const bump = p2Bump(pause);
  const acting = bump > 0 ? (fr: number) => charuPose(fr, bump) : charuActing;
  const charuX = charuXAt(cf);
  const lift = glowAt(cf);
  const close = clamp((lift - 1) / 0.45);
  // hips back during the bend: a shear around her planted feet, so the skirt follows the hips
  const hipSkew = (Math.atan2(HIP_BACK_PX * hipBackAt(cf), CHARU_HIP_H) * 180) / Math.PI;

  // focus: in shot 3 the rest of the row softens as the camera pushes in; in shot 4 the front crying baby
  // starts sharp with Balak's plane soft, then the focus racks to Balak on "সে তখন শান্ত"
  const rowBlur = shot4 ? lerp(3.2, 1.2, rack) : push * 2.2;
  const balakBlur = shot4 ? lerp(3.2, 0, rack) : 0;
  const frontBlur = lerp(0, 4.5, rack);
  // the front baby cries hardest on "অন্য বাচ্চারা যখন কাঁদে", then settles back to waves
  const frontBoost = track(f, [[L4.from - 10, 0.35], [L4.to, 0.35], [L4B.from + 24, 0.1]]);

  return (
    <Stage cam={cam} background="#3a2818">
      <SceneLights.Provider value={DAY_LIGHTS}>
        <Layer depth={0.45}>
          <BackWall f={lifeF} />
        </Layer>
        <Layer depth={1}>
          <DivineDefs />
          <Floor />
        </Layer>
        <Layer depth={1} extraBlur={rowBlur}>
          <CribRow f={lifeF} />
        </Layer>
        <Layer depth={1} extraBlur={balakBlur}>
          <BalakCot f={cf} lifeF={lifeF} lift={lift} close={close} />
          <g transform={`translate(${charuX} ${CHARU.y}) skewX(${-hipSkew}) translate(${-charuX} ${-CHARU.y})`}>
            <Puppet
              cast={CAST.charu}
              f={cf}
              lifeF={lifeF}
              x={charuX}
              y={CHARU.y}
              scale={CHARU.s}
              acting={acting}
              light={{ keySide: 1, rim: "#e8a862", rimStrength: 0.45 }}
              stillness={0.25}
            />
          </g>
        </Layer>
        {shot4 && (
          <Layer depth={FRONT_DEPTH} extraBlur={frontBlur}>
            {/* a nearer row of cots ("সারি সারি বিছানা"): one crying baby close to the lens */}
            <g transform={`translate(${FRONT.x} ${FRONT.y}) scale(${FRONT.s}) translate(0 ${-COT_Y})`}>
              <Cot x={0} />
              <CotBaby f={lifeF} i={8} x={0} cry boost={frontBoost} />
            </g>
          </Layer>
        )}
        <Layer depth={1.35}>
          <Bokeh f={lifeF} n={12} seed={37} color="#ffc46b" area={[-600, -200, 4000, 1300]} size={[6, 20]} rise={0.3} />
        </Layer>
        <Grade warmth={0.4} vignette={0.6} bloomAt={[50, 46]} grain={0.05} />
      </SceneLights.Provider>
    </Stage>
  );
};
