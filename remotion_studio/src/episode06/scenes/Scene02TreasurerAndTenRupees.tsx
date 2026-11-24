import React from "react";
import { clamp, EASE, lerp, makeActing, PoseKey, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { CAST, CastEntry, EP06_CHILD_SCALE } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState } from "../../cinematic/rig/lipsync";
import {
  BASE_POSE,
  GESTURES6,
  Lighting,
  Pose,
  PuppetAnchors,
  Puppet,
  PuppetProps,
  STAMP,
  stampPulse,
  walkPlantFrames,
  walkPose,
  walkTravel,
  WalkOpts,
} from "../../cinematic/rig/Puppet";
import { Goat, Kite, KOLSHI_CARRY_POSE, KOLSHI_PUPPET_PROPS, kolshiWalkPose } from "../../cinematic/life/VillageLife";
import {
  LogShadow,
  LongShadow,
  shirtPocketAt,
  VILLAGE,
  VILLAGE_BG,
  VILLAGE_CAMS,
  VillageBackdrop,
  VillageFloorLayer,
  VillageForegroundLayer,
  villageGrade,
  villageKeepInSet,
  VillageLightLayer,
  villageFrameOn,
  villageScaleAt,
  VillageTime,
  VillageView,
} from "../../cinematic/sets/UjancharVillageField";
import { clipLocalStory6, cueLocalStory6, gapsFor6, pausesFor6, storyToReal, useStory6 } from "../../episode/storyClock";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { SeatedChild, SeatedChildProps, seatedEp6Anchors, treasurerAt, TREASURER_T } from "../../episode03/rig/SeatedChild";
import { GiveKey, GIVE_T, StandingChild, StandingChildProps, standingChildJoints, TWIST_AT } from "../../episode05/rig/StandingChild";
import {
  CopperCoins,
  FoldedShirt,
  Gamchha,
  Lozenge,
  LozengeColor,
  LozengeJar,
  lozengeJarAnchors,
  Marble,
  MarbleHeap,
  PaperTwist,
  paperTwistAnchors,
  StitchedBall,
  TenRupeeNote,
  Top,
  TwoAnnas,
} from "../props/Ep06Props";
import { EP06_SCENES } from "../timing";

/**
 * Episode 6, scene 02 (02_treasurer_and_ten_rupees): the treasurer and the ten-rupee note. Approved plan STO-21
 * (Ep06_Shots_and_Pauses_DRAFT.md, "Scene 02") plus the IMMERSIVE RE-CUT STO-22a (Ep06_Immersive_Recut_PLAN.md,
 * section 2: W2, T1, D1, D2, L1, R1, M1, G2). Book chapters 11 and 12 (book.xlsx rows 17, 18). CHR-08 scales.
 *
 * Set: UjancharVillageField ("field", "house", "lane"), "lateMorning" to shot 6, "afternoon" from shot 7, "sunset" in G2.
 *
 *   W2      open gap (a_world): the paper kite tugging high in the sky; the camera tilts down to the field: the goat
 *           tethered at the edge chewing (a bleat), the kolshi woman walking through far off, the ball game, Balak seated
 *           under the mango (settles on the shot-1 frame). Episode06.tsx draws the fade-in from the chapter break.
 *   1       mangoMedium: boy A hands him the stitched ball, B and D smirk, Balak takes it, delighted (takeBall).
 *   2       wide, cut on "কিন্তু": the boys drop their things on his gamchha; Balak sorts them (treasurer).
 *   T1      pause after "বিশ্বাস করত!" (runs on until "একদিন"): close inserts: boy C kisses his top and sets it down;
 *           Balak sets a cracked marble apart; Balak lines up the heaps and pats them.
 *   3 + D1  cut on "একদিন": a tight insert on the culprit's darting eyes; a dog barks off screen (sound only), he jumps
 *           (cut to the shirt), then slides the note out of the pocket and glances over his shoulder.
 *   4 + D2  cut on "তাঁর": the note pressed into Balak's hands, the whisper, the friend runs off. P2 (D2): Balak looks from
 *           the note to the boys playing to the village far off; the breeze lifts the note's corner; he folds it and
 *           rises onto his knees to go.
 *   L1      gap: (a) a tracking shot alongside Balak walking the lane, the note held to his chest, tall grass and the near
 *           fence streaming past in front; (b) the haystack: he is crouched behind it as the culprit crosses far ahead,
 *           then rises to hurry on (a light comic beat).
 *   5       cut on "ঠাকুর চুপিচুপি": the door step: his glance back, the note held up; the boudi takes it.
 *   AG3     the friend returns for the money; Balak's hand on his head, palms open; the friend stamps off.
 *   6 + R1  cut on "সত্য প্রকাশ": the courtyard, the note held up, the dada's hand on the culprit's shoulder, the two
 *           annas into Balak's palm. R1 (pause after "দু'আনা দিলেন—"): three reaction close-ups (the dada's raised
 *           brows, the boudi's smile behind her sari's end, the culprit flushing, eyes on his feet); then a close insert
 *           on the folded note in her hand (M1, part 1).
 *   M1 + 7  cut on "আর দয়ালু": the lozenge jar glinting, filling the frame, as the seller's hand lifts its lid; then the
 *           stall: the coins on the counter, the lozenges into the paper twist, the twist to Balak.
 *   8       cut on "সব বন্ধুদেরই": the boys come one by one, cupped palms; a lozenge in each (giveOut); the culprit last.
 *   G2      P3 (afterglow): the fallen log at sunset: the boys in a row with bulging cheeks, the culprit next to Balak
 *           nudging him shyly, long shadows; the culprit's shy smile; Balak's glow beat (key beat 2); a slow pull back from
 *           the two to the whole row. Episode06.tsx draws the series fade into the outro.
 *
 * Clocks: `f` story (holds in T1, P2, R1, P3; runs through W2, L1 and AG3) drives choreography and the story camera;
 * `lifeF` (real) drives every rig's life, the animals, the kite, the game and the pause sequences (T1, D2, R1, G2 run on
 * the real frames since their pause began). Balak has no line here: mouth closed.
 */

const SCENE_ID = "02_treasurer_and_ten_rupees";
const SCENE = EP06_SCENES.find((s) => s.sceneId === SCENE_ID);
const DUR = SCENE?.durationFrames ?? 1172;
const PAUSES = pausesFor6(SCENE_ID);
const GAPS = gapsFor6(SCENE_ID);
const real = (story: number) => storyToReal(story, PAUSES);
const io = "inOut" as const;

/* ------------------------------------------------------------------ */
/* Narration anchors (story frames, scene-local)                        */
/* ------------------------------------------------------------------ */

type GapRow = { fromStory: number; frames: number; beats: { id: string; fromStory: number; frames: number }[] };
const gapNamed = (beatId: string, fb: GapRow): GapRow => GAPS.find((g) => g.beats.some((b) => b.id === beatId)) ?? fb;
const beatFrom = (g: GapRow, id: string, fb: number) => g.beats.find((b) => b.id === id)?.fromStory ?? fb;
const cue = (snip: string, fb: number) => cueLocalStory6(snip, SCENE_ID) ?? { from: fb, to: fb + 40 };
/** The pauses by their place in the narration (T1 after "বিশ্বাস করত!", P2 the dilemma, R1 in 02b, P3 the end). */
const T1 = PAUSES[0] ?? { atStory: 303, frames: 36 };
const P2 = PAUSES[1] ?? { atStory: 467, frames: 48 };
const R1 = PAUSES[2] ?? { atStory: 807, frames: 24 };
const P3 = PAUSES[3] ?? { atStory: 966, frames: 84 };
const T1_REAL = real(T1.atStory);
const P2_STORY = P2.atStory;
const P2_REAL = real(P2.atStory);
const R1_REAL = real(R1.atStory);
const P3_STORY = P3.atStory;
const P3_REAL = real(P3.atStory);
const W2 = gapNamed("a_world", { fromStory: 0, frames: 60, beats: [] });
const L1 = gapNamed("a_lane_walk", { fromStory: 467, frames: 48, beats: [] });
const L1_B = beatFrom(L1, "b_haystack_duck", L1.fromStory + 24);
const AG3 = gapNamed("a_friend_returns", { fromStory: 640, frames: 60, beats: [] });
const AG3_B = beatFrom(AG3, "b_friend_stalks_off", AG3.fromStory + 36);
/** The 02a clip's first story frame (after W2); its measured voice onsets add to it (pauses hold the story clock). */
const A0 = clipLocalStory6("02a_Narrator_Friends.wav", SCENE_ID)?.from ?? W2.frames;
const K = {
  khela: cue("খেলার সাথীরা", A0 + 9).from,
  /** "কিন্তু দামি…" (phrase cue = voice 4.54 s) */
  kintu: cue("কিন্তু দামি", A0 + 109).from,
  /** "একদিন এক বন্ধু…" (voice 10.81 s) */
  ekdin: cue("একদিন এক বন্ধু", A0 + 259).from,
  /** "তাঁর কাছে…" by the VOICE: the stop before "তাঁর" ends at 14.87 s into 02a (the caption phrase starts 0.4 s late) */
  tar: A0 + 357,
  /** "ঠাকুর চুপিচুপি…" (voice: L1's end + 0.22 s) */
  chupi: cue("ঠাকুর চুপিচুপি", 520).from,
  /** "সত্য প্রকাশ…" (02b voice 0.22 s) */
  satya: cue("সত্য প্রকাশ", 710).from,
  /** "তাঁকে দু'আনা দিলেন" (phrase cue = voice 2.79 s); the coins land on "দু'আনা" about 10 f in */
  duana: cue("তাঁকে দু'আনা", 772).from + 10,
  /** "আর দয়ালু…" (voice 4.63 s) */
  ar: cue("আর দয়ালু", 816).from,
  /** "সব বন্ধুদেরই…" (voice 6.45 s) */
  sob: cue("সব বন্ধুদেরই", 860).from,
};

/** Shot boundaries (story frames). */
const CUT = {
  one: W2.fromStory + W2.frames,
  wide: K.kintu,
  shirt: K.ekdin,
  two: K.tar,
  laneB: L1_B,
  veranda: K.chupi,
  ag3: AG3.fromStory,
  court: K.satya,
  stall: K.ar,
  crowd: K.sob,
};
/** T1 runs on its own real clock from the pause's start until the cut on "একদিন" (36 f of pause + the voice's quiet). */
const T1_LEN = real(CUT.shirt) - T1_REAL;
const T1_PART = [0, Math.round(T1_LEN * 0.36), Math.round(T1_LEN * 0.68), T1_LEN];
/** D1: the eye insert, the dog's bark and his jump (story frames from the cut on "একদিন"). */
const D1 = { bark: CUT.shirt + 20, jump: CUT.shirt + 22 };
/** R1: three reaction close-ups (real frames from the pause's start), then the note insert until "আর দয়ালু". */
const R1_PART = [0, 8, 16, R1.frames];
/** M1: the jar close-up from "আর দয়ালু" (story frames). */
const M1_LEN = 13;

type ShotId =
  | "w2"
  | "s1"
  | "s2"
  | "t1a"
  | "t1b"
  | "t1c"
  | "s3e"
  | "s3"
  | "s4"
  | "l1a"
  | "l1b"
  | "s5"
  | "ag3"
  | "s6"
  | "r1a"
  | "r1b"
  | "r1c"
  | "n6"
  | "jar"
  | "s7"
  | "s8"
  | "g2";
const shotAt = (f: number, lifeF: number, inPause: boolean): ShotId => {
  if (lifeF >= P3_REAL) return "g2";
  if (lifeF >= T1_REAL && lifeF < T1_REAL + T1_LEN) {
    const t = lifeF - T1_REAL;
    return t < T1_PART[1] ? "t1a" : t < T1_PART[2] ? "t1b" : "t1c";
  }
  if (lifeF >= R1_REAL && lifeF < real(CUT.stall)) {
    const t = lifeF - R1_REAL;
    return t < R1_PART[1] ? "r1a" : t < R1_PART[2] ? "r1b" : t < R1_PART[3] ? "r1c" : "n6";
  }
  // P2 holds at L1's first story frame: stay on Balak (shot 4) for the whole pause (the TIM quirk: gapState says L1 there)
  if (inPause && lifeF >= P2_REAL && lifeF < P2_REAL + P2.frames) return "s4";
  if (f < CUT.one) return "w2";
  if (f < CUT.wide) return "s1";
  if (f < CUT.shirt) return "s2";
  if (f < D1.bark) return "s3e";
  if (f < CUT.two) return "s3";
  if (f < L1.fromStory) return "s4";
  if (f < CUT.laneB) return "l1a";
  if (f < CUT.veranda) return "l1b";
  if (f < CUT.ag3) return "s5";
  if (f < CUT.court) return "ag3";
  if (f < CUT.stall) return "s6";
  if (f < CUT.stall + M1_LEN) return "jar";
  if (f < CUT.crowd) return "s7";
  return "s8";
};
const SHOT_VIEW: Record<ShotId, VillageView> = {
  w2: "field",
  s1: "field",
  s2: "field",
  t1a: "field",
  t1b: "field",
  t1c: "field",
  s3e: "house",
  s3: "house",
  s4: "field",
  l1a: "lane",
  l1b: "lane",
  s5: "house",
  ag3: "field",
  s6: "house",
  r1a: "house",
  r1b: "house",
  r1c: "house",
  n6: "house",
  jar: "field",
  s7: "field",
  s8: "field",
  g2: "field",
};
const FC = VILLAGE_CAMS.field;
const HC = VILLAGE_CAMS.house;
const LC = VILLAGE_CAMS.lane;
const mixCam = (a: Cam, b: Cam, t: number): Cam => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)) });

/* ------------------------------------------------------------------ */
/* Scales (CHR-08) and small helpers                                     */
/* ------------------------------------------------------------------ */

type XY = { x: number; y: number };
const VF = VILLAGE.field;
const VH = VILLAGE.house;
/** Adult Puppet scale K at a floor depth y (field, and the friend's courtyard framed 0.85 wider). Children: scale K. */
const kF = (y: number) => 1.15 * villageScaleAt(y);
const kH = (y: number) => 1.15 * 0.85 * villageScaleAt(y);
const STAND = EP06_CHILD_SCALE.standingBalak;
const SEAT_S = EP06_CHILD_SCALE.seatedBalak.s;

const ease = (t: number) => EASE.inOut(clamp(t));
const lerpP = (a: XY, b: XY, t: number): XY => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
/** Keyed path of points: [[frame, point], ...] eased between keys. */
const pathAt = (f: number, keys: Array<[number, XY]>): XY => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, p0] = keys[i];
    const [f1, p1] = keys[i + 1];
    if (f <= f1) return lerpP(p0, p1, ease((f - f0) / Math.max(1, f1 - f0)));
  }
  return keys[keys.length - 1][1];
};

/** Renders its function when React reaches it (after the earlier siblings: Puppet anchors are filled by then). */
const Later: React.FC<{ r: () => React.ReactNode }> = ({ r }) => <>{r()}</>;

const LIGHT_AM: Lighting = { keySide: 1, rim: "#ffe9b8", rimStrength: 0.28, rimSide: 1 };
/** G2: the low sunset sun on the right: strong warm rims. */
const LIGHT_SUN: Lighting = { keySide: 1, rim: "#ffb35c", rimStrength: 0.62, rimSide: 1 };
const LIGHT_PM: Lighting = { keySide: 1, rim: "#ffc679", rimStrength: 0.42, rimSide: 1 };

/* ------------------------------------------------------------------ */
/* Puppet actors: keyed gestures + walks (feet planted, turns blended)    */
/* ------------------------------------------------------------------ */

interface Move {
  start: number;
  dur: number;
  toX: number;
  toY: number;
  kind?: WalkOpts["kind"];
  startIn?: number;
  stopIn?: number;
}
interface ActorSpec {
  cast: CastEntry;
  x0: number;
  y0: number;
  flip?: boolean;
  kOf: (y: number) => number;
  keys: PoseKey<Pose>[];
  moves?: Move[];
  add?: (f: number, p: Pose) => Pose;
}
interface Actor {
  cast: CastEntry;
  flip: boolean;
  place: (f: number) => { x: number; y: number; s: number };
  acting: (f: number) => Pose;
}

const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const o: Record<string, unknown> = { ...b };
  const ra = a as unknown as Record<string, unknown>;
  const rb = b as unknown as Record<string, unknown>;
  for (const k of Object.keys(rb)) {
    const va = ra[k];
    const vb = rb[k];
    o[k] = typeof va === "number" && typeof vb === "number" ? lerp(va, vb, t) : t < 0.5 ? va ?? vb : vb;
  }
  return o as unknown as Pose;
};

const makeActor = (a: ActorSpec): Actor => {
  const child = a.cast.age === "child";
  let x = a.x0;
  let y = a.y0;
  const segs = (a.moves ?? []).map((m) => {
    const s = { ...m, fromX: x, fromY: y };
    x = m.toX;
    y = m.toY;
    return s;
  });
  const opts: WalkOpts[] = segs.map((s) => ({
    start: s.start,
    dur: s.dur,
    fromX: s.fromX,
    toX: s.toX,
    scale: a.kOf((s.fromY + s.toY) / 2),
    height: a.cast.height,
    seed: a.cast.seed,
    flip: a.flip,
    kind: s.kind ?? "hurry",
    child,
    startIn: s.startIn ?? 6,
    stopIn: s.stopIn ?? 6,
  }));
  const ACT = makeActing<Pose>(BASE_POSE, a.keys);
  const place = (f: number) => {
    let px = a.x0;
    let py = a.y0;
    for (const s of segs) {
      if (f < s.start) break;
      const tr = walkTravel(f, { start: s.start, dur: s.dur, fromX: s.fromX, toX: s.toX, startIn: s.startIn ?? 6, stopIn: s.stopIn ?? 6 });
      const u = s.toX !== s.fromX ? (tr.bodyX - s.fromX) / (s.toX - s.fromX) : clamp((f - s.start) / s.dur);
      px = tr.bodyX;
      py = lerp(s.fromY, s.toY, clamp(u));
    }
    return { x: px, y: py, s: a.kOf(py) };
  };
  const acting = (f: number): Pose => {
    let p = ACT(f);
    for (const o of opts) {
      const end = o.start + o.dur;
      if (f >= o.start && f <= end) {
        p = mixPose(p, { ...p, ...walkPose(f, o) } as Pose, ease((f - o.start) / 6));
      } else if (f > end && f < end + 8) {
        p = mixPose({ ...p, ...walkPose(end, o) } as Pose, p, ease((f - end) / 8));
      }
    }
    return a.add ? a.add(f, p) : p;
  };
  return { cast: a.cast, flip: !!a.flip, place, acting };
};

const ActorFig: React.FC<{ A: Actor; f: number; lifeF: number; light: Lighting; extra?: Partial<PuppetProps> }> = ({ A, f, lifeF, light, extra }) => {
  const pl = A.place(f);
  return <Puppet cast={A.cast} f={f} lifeF={lifeF} x={pl.x} y={pl.y} scale={pl.s} flip={A.flip} acting={A.acting} light={light} {...extra} />;
};

/** A small giggle bob (smirking behind a hand): add to headNod. */
const giggle = (f: number, a: number, b: number, amp = 1.6, ph = 0) => clamp((f - a) / 6) * clamp((b - f) / 6) * amp * (0.5 - 0.5 * Math.cos((f + ph) * 0.95));
/** A small open mouth that moves (a whisper / sucking a sweet; no sync). */
const mouthWiggle = (f: number, amt: number): MouthState => ({ open: amt * (0.55 + 0.45 * Math.abs(Math.sin(f * 0.7))), width: 0.9, round: 0.35, teeth: 0.15 });

/* ------------------------------------------------------------------ */
/* Balak: seated (shots 1, 2, 4, AG3) and standing (5 to 8)              */
/* ------------------------------------------------------------------ */

const SEAT = { x: VF.balakSeat.x, y: VF.balakSeat.y, s: SEAT_S * kF(VF.balakSeat.y) };
/** Figure units (seated, facing right) to world and back. */
const WS = (p: XY): XY => ({ x: SEAT.x + p.x * SEAT.s, y: SEAT.y + p.y * SEAT.s });
const toSeat = (p: XY): XY => ({ x: (p.x - SEAT.x) / SEAT.s, y: (p.y - SEAT.y) / SEAT.s });
const seatBase = (f: number, lifeF: number): SeatedChildProps => ({ x: SEAT.x, y: SEAT.y, s: SEAT.s, f, lifeF, design: "plate", age: 6, build: "healthy", mouth: 0, talk: 0 });

/** Standing Balak. yaw 0.75 (not the rig's 1): the head turn is 1.35 yaw + the gaze's turn (up to +0.35), so his plate
 * head stays within about three-quarter whatever he looks at; the eyes carry the rest of the look. */
const STAND_YAW = 0.75;
const standBase = (x: number, y: number, k: number, f: number, lifeF: number): StandingChildProps => ({ x, y, s: STAND.s * k, headScale: STAND.headScale, f, lifeF, mouth: 0, talk: 0, yaw: STAND_YAW, build: "healthy" });
/** World point to the standing rig's figure units (facing right, unflipped). */
const toStand = (p: XY, x: number, y: number, s: number): XY => ({ x: (p.x - x) / s, y: (p.y - y) / s });

/* Prop scale on Balak's hands and on the cloth (Ep06Props: s = child scale / 0.56; the seated plate child's hand equals
 * the standing child's at 0.56/0.95 of its scale). */
const PROP_SEAT = (SEAT.s * 0.56) / 0.95 / 0.56;

/* The glow (BAL-05 to BAL-07): steady; it brightens gently only in P3 (key beat 2). */
const GLOW_BASE = 0.6;
const GroundGlow: React.FC<{ x: number; y: number; w: number; level: number }> = ({ x, y, w, level }) => (
  <g opacity={level}>
    <defs>
      <radialGradient id="e6s02-gg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff1c8" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#fff1c8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={x} cy={y} rx={w} ry={w * 0.17} fill="url(#e6s02-gg)" />
  </g>
);
const SeatedGlow: React.FC<{ props: SeatedChildProps; lifeF: number; beat?: number; boost?: number }> = ({ props, lifeF, beat = 0, boost = 0 }) => {
  const a = seatedEp6Anchors(props);
  return (
    <>
      <GroundGlow x={props.x} y={props.y + 3} w={150 * (props.s ?? 1)} level={0.45 + 0.4 * beat} />
      <BirulGlow cx={a.glowAnchor.cx} cy={a.glowAnchor.cy} r={a.glowAnchor.r * (1 + 0.15 * beat)} glow={GLOW_BASE + (1 - GLOW_BASE) * beat} f={lifeF} />
      {boost > 0.01 && <BirulGlow cx={a.glowAnchor.cx} cy={a.glowAnchor.cy} r={a.glowAnchor.r * 1.3} glow={0.6 * boost} f={lifeF} />}
    </>
  );
};
/** `boost` (P3 only, 0..1) layers a second soft halo so the gentle brightening reads on the bright afternoon ground. */
const StandingGlow: React.FC<{ props: StandingChildProps; lifeF: number; beat?: number; boost?: number }> = ({ props, lifeF, beat = 0, boost = 0 }) => {
  const j = standingChildJoints(props);
  const r = 148 * j.headScale;
  return (
    <>
      <GroundGlow x={props.x} y={props.y + 3} w={120 * (props.s ?? 1) * 1.6} level={0.4 + 0.4 * beat} />
      <BirulGlow cx={j.glowAnchor.x} cy={j.glowAnchor.y} r={r * (1 + 0.15 * beat)} glow={GLOW_BASE + (1 - GLOW_BASE) * beat} f={lifeF} />
      {boost > 0.01 && <BirulGlow cx={j.glowAnchor.x} cy={j.glowAnchor.y} r={r * 1.3} glow={0.6 * boost} f={lifeF} />}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* The ball game beyond (0.8 plane, life clock)                          */
/* ------------------------------------------------------------------ */

const GAME_K = 0.4;
const GAME_PASS = 34;
const GAME_BOUNCE = 20; // frame inside a pass where the ball bounces (thump)
const GAME_POS = [VF.game[0], VF.game[1], VF.game[3]];
/** Who plays beyond, per shot (never a boy who is in the foreground of that shot). */
const GAME_CAST: Record<string, CastEntry[]> = {
  s1: [CAST.culpritFriend, CAST.villageBoyC, CAST.villageBoyE],
  s2: [CAST.culpritFriend, CAST.villageBoyC, CAST.villageBoyE],
  s4: [CAST.villageBoyA, CAST.villageBoyC, CAST.villageBoyE],
  ag3: [CAST.villageBoyA, CAST.villageBoyC, CAST.villageBoyE],
};
const GAME_ORDER = [0, 1, 2, 1, 0, 2];
const gameKicker = (n: number) => GAME_ORDER[((n % GAME_ORDER.length) + GAME_ORDER.length) % GAME_ORDER.length];
/** Ball on the 0.8 plane at life frame lf: kicked along the ground from boy to boy with one bounce. */
const gameBall = (lf: number) => {
  const n = Math.floor(lf / GAME_PASS);
  const u = (lf - n * GAME_PASS) / GAME_PASS;
  const a = GAME_POS[gameKicker(n)];
  const b = GAME_POS[gameKicker(n + 1)];
  const fx = (p: typeof a) => p.x + (p === a ? 10 : -10) * Math.sign(b.x - a.x);
  const x = lerp(fx(a), fx(b), u);
  const y = lerp(a.y, b.y, u);
  const ub = GAME_BOUNCE / GAME_PASS;
  const air = u < ub ? 4 * 34 * (u / ub) * (1 - u / ub) : 4 * 8 * ((u - ub) / (1 - ub)) * (1 - (u - ub) / (1 - ub));
  return { x, y, air, spin: lf * 14 };
};
const gameBoyActing = (i: number) => (fr: number): Pose => {
  const n = Math.floor(fr / GAME_PASS);
  const kicking = gameKicker(n) === i;
  const nextKick = gameKicker(n + 1) === i;
  const ball = gameBall(fr);
  const me = GAME_POS[i];
  const turn = ball.x < me.x ? -0.55 : 0.55;
  const st = stampPulse(fr, (kicking ? n : nextKick ? n + 1 : n - 99) * GAME_PASS - 7);
  const lean = 3 * Math.sin(fr * 0.08 + i);
  return { ...BASE_POSE, bodyTurn: turn, lean, smile: 0.55, stamp: (turn > 0 ? -1 : 1) * st.stamp, bodyY: st.dY, rS: 12, rE: -24, lS: 12, lE: -24 };
};
const BallGame: React.FC<{ lifeF: number; light: Lighting; shot: string }> = ({ lifeF, light, shot }) => {
  const b = gameBall(lifeF);
  const cast = GAME_CAST[shot] ?? GAME_CAST.s1;
  return (
    <>
      {GAME_POS.map((p, i) => (
        <Puppet key={i} cast={cast[i]} f={lifeF} lifeF={lifeF} x={p.x} y={p.y} scale={GAME_K} acting={gameBoyActing(i)} light={light} />
      ))}
      <StitchedBall x={b.x} y={b.y} s={0.5} air={b.air / 2} spin={b.spin} squash={0.3} />
    </>
  );
};
/** Life frames of the background ball's bounces in [a, b). */
const gameThumps = (a: number, b: number) => {
  const out: number[] = [];
  for (let n = Math.floor(a / GAME_PASS); n * GAME_PASS < b; n++) {
    const t = n * GAME_PASS + GAME_BOUNCE;
    if (t >= a && t < b) out.push(t);
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* SHOT 1: the stitched ball (mangoMedium, P1 + story 0 .. kintu)         */
/* ------------------------------------------------------------------ */

const TB = K.khela + 5; // takeBall poseStart: his hands meet the ball at TB + 14, the giver lets go at TB + 18
const GIVE_BALL_FIG: XY = { x: 96, y: -100 };
const GIVE_BALL_W = WS(GIVE_BALL_FIG);
const BALL_S = (11.5 * SEAT.s) / 7.2; // the prop ball matched to the rig's BALL_R
const S1_GIVER = { x: 696, y: 968 }; // close enough that his hands reach the ball's point (no gap)
/** The giver's two hands on the ball (world): at his chest, then held out to Balak, then let go. */
const GIVER_HANDS: Array<[number, XY]> = [
  [TB - 10, { x: S1_GIVER.x - 40, y: S1_GIVER.y - 0.5 * 281 * kF(S1_GIVER.y) }],
  [TB + 11, GIVE_BALL_W],
];
const giverA = makeActor({
  cast: CAST.villageBoyA,
  x0: S1_GIVER.x,
  y0: S1_GIVER.y,
  flip: true,
  kOf: kF,
  keys: [
    { f: -999, bodyTurn: 0.55, hold: 1, smile: 0.45, ...GESTURES6.sly, eyeX: -0.2 },
    { f: TB - 10, ease: io, hold: 1 },
    { f: TB + 11, in: 20, ease: io, crouch: 0.5, lean: 10, headNod: 3, eyeY: 0.4, smile: 0.55 },
    { f: TB + 19, ease: io, hold: 1 },
    { f: TB + 30, in: 11, ease: io, hold: 0, crouch: 0, lean: 2, headNod: 0, eyeY: 0 },
    // a sly glance back to the smirkers, then back to the boy with the ball
    { f: TB + 46, in: 12, ease: io, headTurn: -0.45, eyeX: 0.7, smile: 0.7 },
    { f: TB + 76, in: 14, ease: io, headTurn: 0, eyeX: -0.3, smile: 0.5 },
  ],
});
const smirker = (c: CastEntry, at: XY, from: number, ph: number) =>
  makeActor({
    cast: c,
    x0: at.x,
    y0: at.y,
    flip: true,
    kOf: kF,
    keys: [
      { f: -999, bodyTurn: 0.5, smile: 0.4, eyeX: -0.2 },
      { f: from, in: 12, ease: io, mouthHand: -1, smile: 0.75, lid: 0.25, headTilt: 4, eyeX: -0.5 },
      { f: from + 70, ease: io, mouthHand: -1 },
      { f: from + 84, in: 14, ease: io, mouthHand: 0, smile: 0.5, lid: 0.12, headTilt: 0 },
    ],
    add: (f, p) => ({ ...p, headNod: p.headNod + giggle(f, from + 8, from + 74, 1.8, ph), bodyY: p.bodyY + 0.6 * giggle(f, from + 8, from + 74, 1.2, ph + 2) }),
  });
const smirkB = smirker(CAST.villageBoyB, { x: VF.smirkers[0].x, y: VF.smirkers[0].y }, K.khela + 12, 0);
const smirkD = smirker(CAST.villageBoyD, { x: VF.smirkers[1].x, y: VF.smirkers[1].y }, K.khela + 18, 3);

const s1Balak = (f: number, lifeF: number): SeatedChildProps => {
  const base = seatBase(f, lifeF);
  if (f < TB) return { ...base, pose: "sitCross", face: { lookX: 0.35, smile: 0.45 } };
  // a delighted look up at the giver (watchHeld 0) after the ball is in his lap
  const up = track(f, [
    [TB + 46, 0],
    [TB + 54, 1, io],
    [TB + 78, 1],
    [TB + 88, 0, io],
  ]);
  return { ...base, pose: "takeBall", prevPose: "sitCross", poseStart: TB, prevPoseStart: 0, giveAt: GIVE_BALL_FIG, watchHeld: 1 - up, face: { lookX: 0.5 * up, smile: 0.6 } };
};

/* ------------------------------------------------------------------ */
/* SHOT 2: the treasurer (wide)                                           */
/* ------------------------------------------------------------------ */

/** The spread gamchha in front of his knees (figure units, centre) and its scale. */
const CLOTH_FIG: XY = { x: 86, y: 1 };
const CLOTH_S = 0.5;
const ITEM_S = 0.9 * PROP_SEAT;
/** The ball lying behind him on the ground. */
const BALL_REST = WS({ x: -34, y: 3 });
/** Drop points (figure units, ground) and where Balak sets each on its heap. */
const ITEMS = {
  top: { drop: { x: 126, y: 2 }, heap: { x: 50, y: -3 } },
  coins: { drop: { x: 131, y: -4 }, heap: { x: 70, y: 3 } },
  stray: { drop: { x: 133, y: 5 }, heap: { x: 96, y: -3 } },
  marbles: { drop: { x: 112, y: -6 } },
  shirt: { drop: { x: 140, y: 0 } },
};
const TS = CUT.wide + 23; // treasurer poseStart: picks at TS + 14 + 40 k
const STEPS = [
  { from: ITEMS.top.drop, to: ITEMS.top.heap },
  { from: ITEMS.coins.drop, to: ITEMS.coins.heap },
  { from: ITEMS.stray.drop, to: ITEMS.stray.heap },
];
const STEP_KIND = ["top", "coins", "stray"] as const;
/** The boys' drop frames (their hand opens over the cloth; the thing falls FALL frames). */
const FALL = 5;
const DROP = { top: CUT.wide + 26, coins: CUT.wide + 58, marbles: CUT.wide + 92, shirt: CUT.wide + 128 };
const DROP_SPOT_X = 748; // where a boy stands to drop his things (world)
/** A boy's hand over the cloth for a drop (world), a little above the landing point. */
const dropHand = (fig: XY): XY => {
  const w = WS(fig);
  return { x: w.x + 6, y: w.y - 74 };
};
const dropper = (c: CastEntry, x0: number, y0: number, drop: number, fig: XY, run: XY, walkIn = 16, standY = 982) => {
  const arrive = drop - 16;
  const hand = dropHand(fig);
  return {
    hand,
    drop,
    A: makeActor({
      cast: c,
      x0,
      y0,
      flip: true,
      kOf: kF,
      moves: [
        { start: arrive - walkIn, dur: walkIn, toX: DROP_SPOT_X, toY: standY, kind: "hurry" },
        { start: drop + 16, dur: 34, toX: run.x, toY: run.y, kind: "run", startIn: 6, stopIn: 10 },
      ],
      keys: [
        { f: -999, bodyTurn: 0.5, smile: 0.4, reach: 0 },
        { f: arrive, ease: io, bodyTurn: 0.6, lean: 0, crouch: 0 },
        { f: drop - 2, in: 12, ease: io, reach: -1, reachUp: 0, lHand: "hold", crouch: 0.45, lean: 12, headNod: 3, eyeY: 0.5 },
        { f: drop, in: 2, ease: io, lHand: "open" },
        { f: drop + 12, in: 10, ease: io, reach: 0, crouch: 0, lean: 0, headNod: 0, eyeY: 0, lHand: "relaxed", smile: 0.55 },
      ],
    }),
  };
};
const D2 = {
  B: dropper(CAST.villageBoyB, VF.smirkers[0].x, VF.smirkers[0].y, DROP.top, ITEMS.top.drop, { x: 1320, y: 904 }),
  D: dropper(CAST.villageBoyD, VF.smirkers[1].x, VF.smirkers[1].y, DROP.coins, ITEMS.coins.drop, { x: 1560, y: 892 }),
  A: dropper(CAST.villageBoyA, 1090, 1012, DROP.marbles, ITEMS.marbles.drop, { x: 1220, y: 926 }, 14, 984),
  E: dropper(CAST.villageBoyE, 1270, 956, DROP.shirt, ITEMS.shirt.drop, { x: 1700, y: 880 }, 22, 980),
};
const s2Balak = (f: number, lifeF: number): SeatedChildProps => {
  const base = seatBase(f, lifeF);
  if (f < TS) return { ...base, pose: "sitCross", face: { lookX: 0.3, smile: 0.5 } };
  return { ...base, pose: "treasurer", prevPose: "sitCross", poseStart: TS, prevPoseStart: 0, pickPlace: STEPS };
};
/** One thing (top, coins, marble(s), shirt) at a world point. */
const ItemArt: React.FC<{ kind: "top" | "coins" | "stray" | "marbles" | "shirt"; at: XY; s?: number }> = ({ kind, at, s = ITEM_S }) => {
  if (kind === "top") return <Top x={at.x} y={at.y} s={s} lying string="coiled" />;
  if (kind === "coins") return <CopperCoins x={at.x} y={at.y} s={s} count={3} seed={4} />;
  if (kind === "stray") return <Marble x={at.x} y={at.y} s={s} color={2} seed={9} />;
  if (kind === "marbles") return <MarbleHeap x={at.x} y={at.y} s={s} count={6} seed={3} />;
  return <FoldedShirt x={at.x} y={at.y} s={0.62 * s} />;
};
/** A dropped thing: in the boy's hand until `drop`, then falling, then on the cloth (world). */
const droppedAt = (f: number, drop: number, hand: XY, fig: XY): { at: XY; inHand: boolean } | null => {
  const land = WS(fig);
  if (f < drop) return { at: { x: hand.x, y: hand.y + 6 }, inHand: true };
  const u = clamp((f - drop) / FALL);
  return { at: { x: lerp(hand.x + 2, land.x, u), y: lerp(hand.y + 6, land.y, u * u) }, inHand: false };
};

/** The treasury on the cloth at story frame f (before or after his sorting); `carry` drawn separately at the pinch. */
const Treasury: React.FC<{ f: number; lifeF: number; sorted?: boolean; extra?: boolean }> = ({ f, lifeF, sorted, extra }) => {
  const st = sorted ? { picked: 3, placed: 3, carrying: false, step: 2 } : f < TS ? { picked: 0, placed: 0, carrying: false, step: 0 } : treasurerAt(f - TS, STEPS);
  const cloth = WS(CLOTH_FIG);
  const items: React.ReactNode[] = [];
  STEP_KIND.forEach((k, i) => {
    const dropF = k === "top" ? DROP.top : k === "coins" ? DROP.coins : DROP.marbles;
    if (!sorted && f < dropF + FALL) return; // still in the boy's hand or falling: drawn with the boy
    if (i < st.placed) items.push(<ItemArt key={k} kind={k} at={WS(STEPS[i].to)} />);
    else if (i >= st.picked) items.push(<ItemArt key={k} kind={k} at={WS(STEPS[i].from)} />);
  });
  if (sorted || f >= DROP.marbles + FALL) items.unshift(<ItemArt key="mh" kind="marbles" at={WS(ITEMS.marbles.drop)} />);
  if (sorted || f >= DROP.shirt + FALL) items.push(<ItemArt key="sh" kind="shirt" at={WS(ITEMS.shirt.drop)} />);
  // T1: boy C's own top, set down after his kiss
  if (extra) items.push(<ItemArt key="ctop" kind="top" at={WS({ x: 104, y: 7 })} />);
  return (
    <>
      <Gamchha x={cloth.x} y={cloth.y} s={CLOTH_S} lifeF={lifeF} check="red" seed={2} />
      {items}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* SHOT 3: the note out of the pocket (house.shirtInsert)                 */
/* ------------------------------------------------------------------ */

const PEG = VH.shirtPeg;
const pocketAt = (lifeF: number) => shirtPocketAt(PEG.x, PEG.y, PEG.s ?? 0.86, lifeF, 1);
const NOTE_POCKET_S = 1.15;
const NOTE_H_UP = 15 * NOTE_POCKET_S; // the folded note standing up in the pocket: its long side vertical
/** D1: eyes dart (the insert) until the bark; the jump; then the hand rises to the pocket and slides the note out. */
const S3 = {
  reach: D1.jump + 12, // the hand rises to the pocket
  inPocket: D1.jump + 22,
  pullFrom: D1.jump + 28,
  pullTo: D1.jump + 42,
  glance: D1.jump + 48,
  glanceBack: D1.jump + 64,
  tuck: D1.jump + 68,
};
/** He stands just right of the shirt (between it and the door), facing it: his near hand reaches left to the pocket. */
const CULPRIT3 = { x: VH.shirtPocket.x + 44, y: VH.culpritAtShirt.y };
/** Note centre (world) over the shot: in the pocket, pulled up by the hand, then carried. */
const s3Note = (f: number, lifeF: number): { c: XY; inPocket: boolean } => {
  const p = pocketAt(lifeF);
  const down = { x: p.x + 1, y: p.y + NOTE_H_UP * 0.5 - 4 };
  const up = { x: p.x + 1, y: p.y - NOTE_H_UP * 0.5 - 3 };
  if (f < S3.pullFrom) return { c: down, inPocket: true };
  if (f < S3.pullTo) {
    const c = lerpP(down, up, ease((f - S3.pullFrom) / (S3.pullTo - S3.pullFrom)));
    return { c, inPocket: c.y > p.y - NOTE_H_UP * 0.5 };
  }
  const hand = s3Hand(f, lifeF);
  return { c: { x: hand.x - 2, y: hand.y + NOTE_H_UP * 0.5 - 6 }, inPocket: false };
};
/** The culprit's near hand (palm centre, world). */
const s3Hand = (f: number, lifeF: number): XY => {
  const p = pocketAt(lifeF);
  const rest = { x: CULPRIT3.x + 4, y: CULPRIT3.y - 92 };
  const top = { x: p.x - 1, y: p.y - 6 };
  const pulled = { x: p.x - 1, y: p.y - NOTE_H_UP - 4 };
  const chest = { x: CULPRIT3.x - 16, y: CULPRIT3.y - 134 };
  const waist = { x: CULPRIT3.x - 6, y: CULPRIT3.y - 104 };
  return pathAt(f, [
    [S3.reach, rest],
    [S3.inPocket, top],
    [S3.pullFrom, top],
    [S3.pullTo, pulled],
    [S3.pullTo + 12, chest],
    [S3.tuck, chest],
    [S3.tuck + 14, waist],
  ]);
};
const culprit3 = makeActor({
  cast: CAST.culpritFriend,
  x0: CULPRIT3.x,
  y0: CULPRIT3.y,
  flip: true,
  kOf: () => kH(872),
  keys: [
    { f: -999, bodyTurn: 0.62, ...GESTURES6.sly, eyeX: 0.4, reach: -1, reachUp: 0, lHand: "open" },
    { f: S3.inPocket, in: 8, ease: io, lHand: "hold", lean: 3, eyeY: 0.1 },
    { f: S3.pullTo, in: 10, ease: io, smile: 0.62, lean: 1 },
    // the glance over his shoulder (back toward us and the courtyard), eyes first
    { f: S3.glance, in: 10, ease: io, headTurn: -0.95, eyeX: -0.9, brow: 0.35, browTilt: 0.2, smile: 0.2 },
    { f: S3.glanceBack, in: 10, ease: io, headTurn: 0, eyeX: 0.3, brow: 0.1, browTilt: -0.35, smile: 0.62 },
    { f: S3.tuck + 14, in: 14, ease: io, bodyTurn: 0.3 },
  ],
  add: (f, p) => {
    // D1: darting eyes (left, right, left ...) with a small head follow until the bark; the jump at the bark
    const dart = f < D1.bark + 2 ? Math.sin((f - CUT.shirt) * 0.42) : 0;
    const env = clamp((f - CUT.shirt) / 4) * clamp((D1.bark + 2 - f) / 3);
    const u = f - D1.jump;
    const jumpUp = u > 0 && u < 12 ? Math.sin((Math.PI * u) / 12) : 0;
    const startle = track(f, [
      [D1.jump - 1, 0],
      [D1.jump + 2, 1, "out"],
      [D1.jump + 16, 0, io],
    ]);
    return {
      ...p,
      eyeX: p.eyeX + 0.85 * dart * env,
      headTurn: p.headTurn + 0.12 * dart * env,
      smile: p.smile * (1 - 0.8 * startle),
      bodyY: p.bodyY - 9 * jumpUp,
      hunch: Math.max(p.hunch, 0.7 * startle),
      brow: p.brow + 0.7 * startle,
      browTilt: p.browTilt + 0.5 * startle,
      gasp: Math.max(p.gasp, 0.3 * startle),
    };
  },
});

/* ------------------------------------------------------------------ */
/* SHOT 4 + P2: the note pressed into his hands (mangoTwo)                */
/* ------------------------------------------------------------------ */

const TN = CUT.two + 3; // takeNote poseStart (Balak's clock b): hands at TN + 14, the friend lets go at TN + 18
const GIVE_NOTE_FIG: XY = { x: 92, y: -104 };
const GIVE_NOTE_W = WS(GIVE_NOTE_FIG);
/** D2 (b clock, inside P2): the three looks, the breeze, the fold, the rise onto his knees. */
const DLM = { note: P2_STORY + 2, boys: P2_STORY + 8, house: P2_STORY + 18, back: P2_STORY + 28, breeze: P2_STORY + 20, fold: P2_STORY + 34, rise: P2_STORY + 40 };
const NOTE_FOLD = DLM.fold;
const WHISPER = TN + 22;
const RUN_OFF = TN + 34; // on Balak's clock b: he is off the frame a few frames into P2
const CROUCH4 = { x: VF.friendCrouch.x + 4, y: VF.friendCrouch.y };
const culprit4 = makeActor({
  cast: CAST.culpritFriend,
  x0: CROUCH4.x,
  y0: CROUCH4.y,
  flip: true,
  kOf: kF,
  moves: [{ start: RUN_OFF, dur: 17, toX: 1330, toY: 900, kind: "run", startIn: 4, stopIn: 2 }],
  keys: [
    { f: -999, bodyTurn: 0.5, ...GESTURES6.crouchGive, ...GESTURES6.sly, crouch: 0.7, hold: 1, eyeY: 0.3 },
    { f: TN + 18, ease: io, hold: 1 },
    { f: TN + 26, in: 8, ease: io, hold: 0 },
    { f: WHISPER, in: 10, ease: io, ...GESTURES6.whisper, crouch: 0.55 },
    { f: RUN_OFF - 2, in: 8, ease: io, mouthHand: 0, crouch: 0, lean: 0, smile: 0.6, headTilt: 0 },
  ],
});
const culprit4Mouth = (fr: number): MouthState => (fr >= WHISPER + 2 && fr < RUN_OFF - 2 ? mouthWiggle(fr, 0.16) : MOUTH_REST);
/** Balak in shot 4 on his clock b (= story frame before P2, running on through it). */
const s4Balak = (b: number, lifeF: number): SeatedChildProps => {
  const base = seatBase(b, lifeF);
  if (b < TN) return { ...base, pose: "sitCross", face: { lookX: 0.4, smile: 0.4 } };
  // D2 (P2): from the note to the boys playing (off right, up a little), to the friend's house far off between the trees
  // (further right), back to the note; eyes lead (the rig's head follows watchHeld / lookX)
  const away = track(b, [
    [DLM.boys - 1, 0],
    [DLM.boys + 6, 1, io],
    [DLM.back, 1],
    [DLM.back + 6, 0, io],
  ]);
  const far = track(b, [
    [DLM.house - 1, 0],
    [DLM.house + 6, 1, io],
  ]);
  // while the friend whispers he looks up at him
  const toFriend = track(b, [
    [TN + 34, 0],
    [WHISPER + 2, 1, io],
    [RUN_OFF + 6, 1],
    [RUN_OFF + 14, 0, io],
  ]);
  const look = Math.max(away, toFriend);
  return {
    ...base,
    pose: "takeNote",
    prevPose: "sitCross",
    poseStart: TN,
    prevPoseStart: 0,
    giveAt: GIVE_NOTE_FIG,
    foldAt: NOTE_FOLD,
    watchHeld: 1 - look,
    face: { lookX: away * lerp(0.8, 1, far) + 0.45 * toFriend, eyesDown: 0, smile: 0.25 * (1 - away) },
    // he rises onto his knees to go (the cut to the lane comes as P2 ends)
    kneel: 1.6 * ease((b - DLM.rise) / 9),
  };
};
/** D2: the breeze lifts a corner of the folded note before he closes his hands round it (0..1). */
const noteFlap = (b: number) => (b < DLM.breeze || b > DLM.fold + 2 ? 0 : 0.5 + 0.5 * Math.sin((b - DLM.breeze) * 0.9)) * clamp((b - DLM.breeze) / 3) * clamp((DLM.fold + 2 - b) / 3);

/* ------------------------------------------------------------------ */
/* SHOT 5: the note back to the boudi (house.verandaFoot)                 */
/* ------------------------------------------------------------------ */

const STEP_TOP = VH.doorStep;
const B5 = { x: STEP_TOP.x - 118, y: 902 };
const B5_K = kH(B5.y);
const B5_S = STAND.s * B5_K;
const BOUDI5 = { x: STEP_TOP.x - 4, y: STEP_TOP.y };
const BOUDI5_K = kH(882);
const S5 = {
  glance: CUT.veranda + 4,
  glanceBack: CUT.veranda + 18,
  raise: CUT.veranda + 22,
  bend: CUT.veranda + 26,
  reach: CUT.veranda + 40,
  take: CUT.veranda + 52,
  up: CUT.veranda + 62,
  soften: CUT.veranda + 80,
  nod: CUT.veranda + 92,
};
/** The folded note's scale in shot 5: its width spans his two pinches (noteW 40 figure units). */
const NOTE5_S = (40 * B5_S) / 15;
const NOTE5_LOW: XY = { x: 64, y: -300 };
const NOTE5_UP: XY = { x: 90, y: -392 };
const s5Balak = (f: number, lifeF: number): StandingChildProps => {
  const base = standBase(B5.x, B5.y, B5_K, f, lifeF);
  const gaze = [
    { start: -999, at: { x: 200, y: -560 } },
    { start: S5.glance, at: { x: -320, y: -330 } },
    { start: S5.glanceBack, at: { x: 210, y: -600 } },
  ];
  if (f < S5.take) {
    const noteAt = lerpP(NOTE5_LOW, NOTE5_UP, ease((f - S5.raise) / 18));
    return { ...base, pose: "holdOut", prevPose: "standQuiet", poseStart: -200, noteAt, noteW: 40, noteAngle: -8, gaze, expression: "thoughtful" };
  }
  return {
    ...base,
    pose: "standQuiet",
    prevPose: "holdOut",
    poseStart: S5.take + 2,
    prevPoseStart: -200,
    blendFrames: 16,
    noteAt: NOTE5_UP,
    noteW: 40,
    noteAngle: -8,
    gaze,
    expression: "serene",
    face: { smile: lerp(0.35, 0.6, ease((f - S5.soften) / 16)) },
  };
};
/**
 * Where a Puppet's hand holds a small thing, in WORLD px, from its anchors: while the arm is reaching (weight r of
 * Pose.reach) the palm is at the reach target; as the reach fades the thing settles just above the fist (`up`).
 */
const heldPoint = (wrist: XY, target: XY, r: number, up: XY): XY => ({ x: wrist.x + r * (target.x - wrist.x) + (1 - r) * up.x, y: wrist.y + r * (target.y - wrist.y) + (1 - r) * up.y });
const boudi5 = makeActor({
  cast: CAST.boudi,
  x0: BOUDI5.x,
  y0: BOUDI5.y,
  flip: true,
  kOf: () => BOUDI5_K,
  keys: [
    { f: -999, bodyTurn: 0.55, brow: 0.6, browTilt: 0.3, smile: 0.12, eyeY: 0.5, headNod: 2 },
    { f: S5.bend + 14, in: 14, ease: io, ...GESTURES6.bendToChild, brow: 0.55, smile: 0.2 },
    { f: S5.reach + 10, in: 10, ease: io, reach: -1, reachUp: 0.5, lHand: "open" },
    { f: S5.take, in: 4, ease: io, lHand: "hold" },
    { f: S5.take + 8, ease: io, reach: -1 },
    { f: S5.up + 14, in: 16, ease: io, reach: 0, ...GESTURES6.holdUpPaper, lProp: "", lean: 2, crouch: 0, headNod: 2, eyeY: -0.1, brow: 0.45 },
    { f: S5.soften + 14, in: 16, ease: io, smile: 0.62, brow: 0.3, browTilt: 0.35, eyeY: 0.45, headTilt: 5 },
  ],
  add: (f, p) => ({ ...p, headNod: p.headNod + 3 * clamp((f - S5.nod) / 6) * clamp((S5.nod + 18 - f) / 6) }),
});

/* ------------------------------------------------------------------ */
/* AG3: the friend comes back for the money (mangoMedium)                 */
/* ------------------------------------------------------------------ */

const AG = {
  arrive: AG3.fromStory + 12,
  palm: AG3.fromStory + 14,
  head: AG3.fromStory + 20, // handOnHead poseStart: the hand lands at +6
  fall: AG3_B - 2,
  stamp: AG3_B + 6,
  off: AG3_B + 20,
};
const GR = VF.gangReturn;
const friendAG = makeActor({
  cast: CAST.culpritFriend,
  x0: GR[0].x + 170,
  y0: GR[0].y - 10,
  flip: true,
  kOf: kF,
  moves: [
    { start: AG3.fromStory - 6, dur: 18, toX: GR[0].x, toY: GR[0].y, kind: "hurry" },
    { start: AG.off, dur: 30, toX: 1440, toY: 1004, kind: "stomp", startIn: 8, stopIn: 6 },
  ],
  keys: [
    { f: -999, bodyTurn: 0.55, ...GESTURES6.sly },
    { f: AG.palm + 10, in: 10, ease: io, ...GESTURES6.palmOut, smile: 0.35 },
    // his face falls (the money is gone), then the temper and the stamp
    { f: AG.fall + 4, in: 6, ease: io, smile: 0, brow: 0.75, browTilt: 0.5, gasp: 0.25 },
    { f: AG.stamp, in: 8, ease: io, reach: 0, ...GESTURES6.stampTemper, gasp: 0 },
    { f: AG.off, ease: io, bodyTurn: 0.55 },
  ],
  add: (f, p) => {
    const st = stampPulse(f, AG.stamp);
    return { ...p, stamp: -st.stamp, bodyY: p.bodyY + st.dY };
  },
});
const gangBoy = (c: CastEntry, at: XY, delay: number, ph: number) =>
  makeActor({
    cast: c,
    x0: at.x + 170,
    y0: at.y - 8,
    flip: true,
    kOf: kF,
    moves: [{ start: AG3.fromStory - 6 + delay, dur: 18, toX: at.x, toY: at.y, kind: "hurry" }],
    keys: [
      { f: -999, bodyTurn: 0.5, smile: 0.4, eyeX: -0.3 },
      { f: AG.head + 10, in: 8, ease: io, brow: 0.5, smile: 0.55, gasp: 0.1 },
      { f: AG.stamp + 4, in: 8, ease: io, mouthHand: -1, smile: 0.75, lid: 0.2 },
    ],
    add: (f, p) => ({ ...p, headNod: p.headNod + giggle(f, AG.stamp + 6, AG.stamp + 60, 1.6, ph) }),
  });
const gangAG = [gangBoy(CAST.villageBoyB, GR[1], 2, 0), gangBoy(CAST.villageBoyD, GR[2], 4, 2), gangBoy(CAST.villageBoyE, GR[3], 6, 4)];
const agBalak = (f: number, lifeF: number): SeatedChildProps => {
  const base = seatBase(f, lifeF);
  const after = AG.head + 44;
  if (f < AG.head) return { ...base, pose: "sitCross", face: { lookX: 0.4, smile: 0.5 } };
  if (f < after) return { ...base, pose: "handOnHead", prevPose: "sitCross", poseStart: AG.head, prevPoseStart: 0 };
  return { ...base, pose: "sitCross", prevPose: "handOnHead", poseStart: after, prevPoseStart: AG.head, face: { lookX: 0.5, smile: 0.5 } };
};

/* ------------------------------------------------------------------ */
/* SHOT 6: the truth out (house.courtyard)                                */
/* ------------------------------------------------------------------ */

const H6 = {
  out: CUT.court - 2,
  noteUp: CUT.court + 6,
  headDrop: CUT.court + 22,
  shoulder: CUT.court + 30,
  down: CUT.court + 34,
  palmOut: K.duana - 22,
  coins: K.duana,
  smile: K.duana + 12,
};
const DOOR6 = { x: VH.doorway.x, y: VH.doorway.y };
const VERANDA6 = { x: DOOR6.x + 62, y: DOOR6.y + 1 };
const GROUND6 = { x: DOOR6.x + 84, y: 912 };
const B6 = { x: 1062, y: 956 };
const B6_K = kH(B6.y);
const B6_S = STAND.s * B6_K;
const PALM6_FIG: XY = { x: 82, y: -335 };
const PALM6_W: XY = { x: B6.x + PALM6_FIG.x * B6_S, y: B6.y + PALM6_FIG.y * B6_S };
const boudi6 = makeActor({
  cast: CAST.boudi,
  x0: DOOR6.x,
  y0: DOOR6.y,
  flip: true,
  // on the veranda (raised) she stands at the depth of the door: map the veranda floor y to that depth
  kOf: (y: number) => kH(y < GROUND6.y ? lerp(866, GROUND6.y, (y - DOOR6.y) / (GROUND6.y - DOOR6.y)) : y),
  moves: [
    { start: H6.out, dur: 18, toX: VERANDA6.x, toY: VERANDA6.y, kind: "hurry" },
    { start: H6.down, dur: 18, toX: GROUND6.x, toY: GROUND6.y, kind: "hurry", startIn: 6, stopIn: 8 },
  ],
  keys: [
    { f: -999, bodyTurn: 0.55, ...GESTURES6.holdUpPaper, lProp: "", smile: 0.5, brow: 0.4 },
    { f: H6.noteUp + 10, in: 10, ease: io, smile: 0.62, headTilt: 4 },
    { f: H6.palmOut, in: 14, ease: io, lS: 4, lE: -60 },
    { f: H6.coins - 2, in: 12, ease: io, ...GESTURES6.bendToChild, reach: 1, reachUp: 0, rHand: "relaxed", smile: 0.62 },
    { f: H6.coins + 6, in: 4, ease: io, rHand: "open" },
    { f: H6.smile + 10, in: 14, ease: io, reach: 0, lean: 4, crouch: 0, headNod: 3, eyeY: 0.5, smile: 0.7 },
  ],
});
const DADA6 = { x: 828, y: 930 };
const CULPRIT6 = { x: 918, y: 942 };
const culprit6 = makeActor({
  cast: CAST.culpritFriend,
  x0: CULPRIT6.x,
  y0: CULPRIT6.y,
  kOf: kH,
  keys: [
    { f: -999, bodyTurn: 0.3, smile: 0.15, brow: 0.2, browTilt: -0.2, eyeX: 0.4, headTurn: 0.15 },
    // his head drops as she holds up the note; it stays down (his only punishment, with the hand on his shoulder)
    { f: H6.headDrop + 10, in: 12, ease: io, headNod: 8, headTilt: -4, eyeY: 0.55, eyeX: 0, headTurn: 0, smile: 0, brow: 0.55, browTilt: 0.6, behind: 1 },
  ],
});
const culpritShoulder = (f: number): XY => {
  const pl = culprit6.place(f);
  return { x: pl.x - 16 * pl.s, y: pl.y - 222 * pl.s };
};
const dada6 = makeActor({
  cast: CAST.friendDada,
  x0: DADA6.x,
  y0: DADA6.y,
  kOf: kH,
  keys: [
    { f: -999, bodyTurn: 0.55, ...GESTURES6.handsOnHips, eyeX: 0.5 },
    { f: H6.shoulder + 16, in: 16, ease: io, hips: 0, ...GESTURES6.handOnShoulder, browTilt: -0.25, eyeY: 0.35 },
  ],
});
const gang6 = [
  makeActor({ cast: CAST.villageBoyB, x0: VH.gang[0].x, y0: VH.gang[0].y, flip: true, kOf: kH, keys: [{ f: -999, bodyTurn: 0.45, smile: 0.3, eyeX: -0.3 }, { f: H6.noteUp + 12, in: 10, ease: io, brow: 0.6, gasp: 0.15, smile: 0.2 }] }),
  makeActor({ cast: CAST.villageBoyD, x0: VH.gang[1].x, y0: VH.gang[1].y, flip: true, kOf: kH, keys: [{ f: -999, bodyTurn: 0.4, smile: 0.3 }, { f: H6.headDrop + 6, in: 10, ease: io, mouthHand: -1, smile: 0.7, lid: 0.2 }] }),
  makeActor({ cast: CAST.villageBoyE, x0: VH.gang[2].x, y0: VH.gang[2].y, flip: true, kOf: kH, keys: [{ f: -999, bodyTurn: 0.5, smile: 0.35 }, { f: H6.coins + 4, in: 10, ease: io, brow: 0.55, gasp: 0.18, smile: 0.4 }] }),
];
const s6Balak = (f: number, lifeF: number): StandingChildProps => {
  const base = standBase(B6.x, B6.y, B6_K, f, lifeF);
  const gaze = [
    { start: -999, at: { x: 120, y: -640 } },
    { start: H6.down + 12, at: { x: 150, y: -520 } },
    { start: H6.coins + 4, at: { x: PALM6_FIG.x, y: PALM6_FIG.y + 10 } },
    { start: H6.smile + 4, at: { x: 150, y: -540 } },
  ];
  if (f < H6.palmOut) return { ...base, pose: "standQuiet", poseStart: -200, gaze, expression: "serene" };
  const palm = lerpP({ x: 40, y: -250 }, PALM6_FIG, ease((f - H6.palmOut) / 14));
  return { ...base, pose: "handInHands", prevPose: "standQuiet", poseStart: H6.palmOut, prevPoseStart: -200, blendFrames: 14, heldAt: palm, palmUp: 1, gaze, expression: "serene", face: { smile: lerp(0.4, 0.62, ease((f - H6.smile) / 14)) } };
};

/* ------------------------------------------------------------------ */
/* SHOT 7: the sweet stall (stallMedium, afternoon)                       */
/* ------------------------------------------------------------------ */

const B7 = { x: 2474, y: 992 };
const B7_K = kF(B7.y);
const B7_S = STAND.s * B7_K;
const JAR = { x: 2702, y: VF.counterTop.y, s: 1 };
const COIN_SPOT: XY = { x: 2534, y: VF.counterTop.y - 1 };
const TWIST_STAND: XY = { x: 2662, y: VF.counterTop.y - 13 };
const HANDOVER: XY = { x: 2560, y: 786 };
const S7 = {
  lid: CUT.stall + 3,
  lidOpen: CUT.stall + 11,
  scoop: CUT.stall + 15,
  pour: CUT.stall + 21,
  poured: CUT.stall + 27,
  pick: CUT.stall + 30,
  turn: CUT.stall + 30,
  hand: CUT.stall + 39,
  coinsDown: CUT.stall + M1_LEN + 5,
  twistFar: CUT.stall + 30,
  touch: CUT.stall + 40,
};
const s7LidOpen = (f: number) => (f < S7.lid + 2 ? 0 : clamp((f - S7.lid - 2) / (S7.lidOpen - S7.lid - 2)));
const s7TwistFill = (f: number) => lerp(0.15, 0.9, ease((f - S7.pour) / (S7.poured - S7.pour)));
/** The seller's near hand (palm centre): lid knob, into the jar, over the twist (pour), the twist, to Balak. */
const sellerHand = (f: number): XY => {
  const ja = lozengeJarAnchors({ x: JAR.x, y: JAR.y, s: JAR.s, lidOpen: s7LidOpen(f) });
  const knob = lozengeJarAnchors({ x: JAR.x, y: JAR.y, s: JAR.s, lidOpen: 0 }).lidKnob;
  return pathAt(f, [
    [S7.lid - 6, { x: VF.sellerHands.x + 10, y: VF.sellerHands.y + 6 }],
    [S7.lid, { x: knob.x, y: knob.y - 3 }],
    [S7.lidOpen, { x: ja.lidKnob.x, y: ja.lidKnob.y - 3 }],
    [S7.scoop, { x: ja.mouth.x, y: ja.mouth.y + 6 }],
    [S7.pour, { x: TWIST_STAND.x + 2, y: TWIST_STAND.y - 26 }],
    [S7.poured, { x: TWIST_STAND.x + 2, y: TWIST_STAND.y - 24 }],
    [S7.pick, { x: TWIST_STAND.x, y: TWIST_STAND.y - 4 }],
    [S7.hand, { x: HANDOVER.x + 4, y: HANDOVER.y - 2 }],
  ]);
};
/** The twist's grip (world): standing on the counter, then in the seller's hand, then in Balak's far hand. */
const s7Twist = (f: number): XY => {
  if (f < S7.pick) return TWIST_STAND;
  const h = sellerHand(f);
  return { x: h.x, y: h.y + 4 };
};
const seller = (light: Lighting, f: number, lifeF: number, shot8: boolean) => {
  const turnAt = shot8 ? -999 : S7.turn;
  return (
    <Puppet
      cast={CAST.sweetSeller}
      f={f}
      lifeF={lifeF}
      x={VF.sellerSeat.x}
      y={VF.sellerSeat.y}
      scale={0.9}
      seated
      light={light}
      acting={(fr) => {
        if (shot8) {
          // shot 8: back to the jar, closes its lid, then watches the boys, smiling
          const k = track(fr, [
            [CUT.crowd + 10, 0],
            [CUT.crowd + 22, 1, io],
            [CUT.crowd + 34, 1],
            [CUT.crowd + 46, 0, io],
          ]);
          return { ...BASE_POSE, bodyTurn: lerp(-0.35, 0.35, k), reach: -k, reachUp: 0, lHand: "open", smile: 0.6, eyeY: 0.3, headNod: 2 };
        }
        const t = clamp((fr - turnAt) / 10);
        return { ...BASE_POSE, bodyTurn: lerp(0.35, -0.35, ease(t)), reach: -1, reachUp: fr < S7.pick ? 0 : 0.3, lHand: fr >= S7.pick ? "hold" : "open", smile: 0.55, eyeY: fr < S7.turn ? 0.45 : 0.3, headNod: 2, lean: fr > S7.turn ? -12 * ease((fr - S7.turn) / 10) : 2 };
      }}
      reachAt={shot8 ? () => lozengeJarAnchors({ x: JAR.x, y: JAR.y, s: JAR.s, lidOpen: 1 }).lidKnob : sellerHand}
    />
  );
};
const s7Balak = (f: number, lifeF: number): StandingChildProps => {
  const base = standBase(B7.x, B7.y, B7_K, f, lifeF);
  const coinFig = toStand({ x: COIN_SPOT.x - 2, y: COIN_SPOT.y - 6 }, B7.x, B7.y, B7_S);
  const held = pathAt(f, [
    [CUT.stall, { x: 78, y: -330 }],
    [S7.coinsDown - 2, coinFig],
    [S7.coinsDown + 3, coinFig],
    [S7.coinsDown + 14, { x: 40, y: -230 }],
  ]);
  const far = f >= S7.twistFar ? toStand(s7Twist(Math.max(f, S7.touch)), B7.x, B7.y, B7_S) : undefined;
  const farT = far ? lerpP({ x: 20, y: -250 }, far, ease((f - S7.twistFar) / (S7.touch - S7.twistFar))) : undefined;
  const palmUp = 1 - ease((f - S7.coinsDown + 1) / 4);
  return {
    ...base,
    pose: "handInHands",
    poseStart: -200,
    heldAt: held,
    palmUp,
    handTargets: farT ? { far: farT } : undefined,
    gaze: [
      { start: -999, at: { x: 150, y: -560 } },
      { start: S7.coinsDown - 8, at: coinFig },
      { start: S7.coinsDown + 8, at: toStand(TWIST_STAND, B7.x, B7.y, B7_S) },
    ],
    expression: "serene",
    face: { smile: 0.5 },
  };
};

/* ------------------------------------------------------------------ */
/* SHOT 8 + P3: lozenges for every friend (stallWide, afternoon)          */
/* ------------------------------------------------------------------ */

const B8 = { x: 2400, y: 1000 };
const B8_K = kF(B8.y);
const B8_S = STAND.s * B8_K;
/** Two give spots just behind and to his right (the boys come to him one by one, he stays unhidden in front), and
 * their cupped palms in Balak's figure units. */
const G1 = { x: 2508, y: 984 };
const G2 = { x: 2532, y: 962 };
const R1_FIG: XY = { x: 72, y: -286 };
const R2_FIG: XY = { x: 94, y: -302 };
const fig8 = (p: XY): XY => ({ x: B8.x + p.x * B8_S, y: B8.y + p.y * B8_S });
const RP1 = fig8(R1_FIG);
const RP2 = fig8(R2_FIG);
/** The gives: the culprit's lands before P3 (G2 cuts to the log at sunset). */
const GIVE8 = { b: K.sob + 8, d: K.sob + 28, e: K.sob + 48, c: K.sob + 74 };
const GIVES: GiveKey[] = [
  { at: R1_FIG, start: GIVE8.b, yaw: STAND_YAW },
  { at: R2_FIG, start: GIVE8.d, yaw: STAND_YAW },
  { at: R1_FIG, start: GIVE8.e, yaw: STAND_YAW },
  { at: R2_FIG, start: GIVE8.c, yaw: STAND_YAW },
];
const LOZ_COL: LozengeColor[] = ["red", "yellow", "green", "red", "white", "yellow"];
interface Receiver {
  A: Actor;
  palm: (g: number) => XY;
  give: number;
  col: LozengeColor;
  eatAt: number;
}
/** A boy who walks to a give spot, holds out cupped palms (reachAt), receives at give + put, steps away and eats it. */
const receiver = (c: CastEntry, wait: XY, spot: XY, R: XY, give: number, away: XY, col: LozengeColor, eatAt: number, leave = true, approachDur = 14): Receiver => {
  const arrive = give - 4;
  const leaveAt = give + GIVE_T.put + 10; // he pops it in his mouth first (eatAt), then steps away
  const cupOff = { x: R.x - spot.x, y: R.y - spot.y };
  const A = makeActor({
    cast: c,
    x0: wait.x,
    y0: wait.y,
    flip: true,
    kOf: kF,
    moves: [
      { start: arrive - approachDur, dur: approachDur, toX: spot.x, toY: spot.y, kind: "hurry" },
      ...(leave ? [{ start: leaveAt, dur: 16, toX: away.x, toY: away.y, kind: "hurry" as const }] : []),
    ],
    keys: [
      { f: -999, bodyTurn: 0.7, smile: 0.4, brow: 0.35, eyeX: -0.5 },
      { f: arrive, in: 10, ease: io, ...GESTURES6.cuppedPalms, bodyTurn: 0.75 },
      { f: eatAt + 8, in: 8, ease: io, cupHands: 0, mouthHand: -1, gasp: 0, lean: 0, smile: 0.5 },
      { f: eatAt + 20, in: 10, ease: io, mouthHand: 0, smile: 0.85, brow: 0.3, eyeY: 0 },
    ],
  });
  /** The lozenge in his cupped palms, carried up to his mouth from eatAt (eaten by eatAt + 8). */
  const palm = (g: number): XY => {
    const pl = A.place(g);
    const cup = { x: pl.x + cupOff.x, y: pl.y + cupOff.y };
    const mouth = { x: pl.x - 10 * pl.s, y: pl.y - 0.84 * 236 * c.height * pl.s };
    return lerpP(cup, mouth, ease((g - eatAt) / 8));
  };
  return { A, palm, give, col, eatAt };
};
const REC = {
  // a front-row queue to his right; after their sweet the boys step back into a row behind
  b: receiver(CAST.villageBoyB, { x: 2650, y: 1002 }, G1, RP1, GIVE8.b, { x: 2712, y: 934 }, LOZ_COL[0], GIVE8.b + GIVE_T.put + 2, true, 14),
  d: receiver(CAST.villageBoyD, { x: 2768, y: 996 }, G2, RP2, GIVE8.d, { x: 2812, y: 930 }, LOZ_COL[1], GIVE8.d + GIVE_T.put + 2, true, 18),
  e: receiver(CAST.villageBoyE, { x: 2884, y: 1002 }, G1, RP1, GIVE8.e, { x: 2622, y: 938 }, LOZ_COL[2], GIVE8.e + GIVE_T.put + 2, true, 22),
  c: receiver(CAST.culpritFriend, { x: 3000, y: 960 }, G2, RP2, GIVE8.c, G2, "white", 9999, false, 28),
};
/** The two boys who already have theirs at the cut (to the right, sucking their lozenges). */
const eaterA = makeActor({ cast: CAST.villageBoyA, x0: 2912, y0: 932, flip: true, kOf: kF, keys: [{ f: -999, bodyTurn: 0.45, smile: 0.8, eyeX: -0.4, brow: 0.3 }] });
const eaterC = makeActor({ cast: CAST.villageBoyC, x0: 3090, y0: 940, flip: true, kOf: kF, keys: [{ f: -999, bodyTurn: 0.4, smile: 0.75, eyeX: -0.5 }, { f: K.sob + 40, in: 10, ease: io, headTilt: 5 }] });
/** The culprit in shot 8: hangs back, head low; comes when Balak holds one out; looks at the sweet in his palms. */
const culprit8Keys = (f: number): Partial<Pose> => {
  const look = ease((f - (GIVE8.c + GIVE_T.put + 2)) / 8);
  const head = f < GIVE8.c - 20 ? 1 : 1 - ease((f - (GIVE8.c - 20)) / 12);
  return { headNod: 6 * head + 4 * look, eyeY: 0.45 * head + 0.55 * look, smile: 0.08 + 0.2 * look, brow: 0.45, browTilt: 0.55, behind: head };
};
const s8Balak = (f: number, lifeF: number, twistNode: (props: StandingChildProps) => React.ReactNode): StandingChildProps => {
  const base: StandingChildProps = {
    ...standBase(B8.x, B8.y, B8_K, f, lifeF),
    pose: "giveOut",
    poseStart: K.sob - 60,
    gives: GIVES,
    twistAt: TWIST_AT,
    expression: "compassionate",
    // after the last give he looks into the culprit's face
    gaze: f >= GIVE8.c + GIVE_T.release ? [{ start: GIVE8.c + GIVE_T.release, at: { x: 185, y: -540 } }] : undefined,
    face: { smile: 0.55 },
  };
  return { ...base, layerFar: twistNode(base) };
};

/* ------------------------------------------------------------------ */
/* RE-CUT (STO-22a): W2 world, T1 treasury, L1 lane, R1 reactions, M1 jar, G2 log */
/* ------------------------------------------------------------------ */

/** Puppet figure heights (world px at scale 1): children 236 x cast height, adults 377 x cast height. */
const figH = (c: CastEntry) => (c.age === "child" ? 236 : 377) * c.height;
/** A Puppet's head centre (world) from its place: children's heads sit a little lower in their height. */
const headOf = (A: Actor, f: number): XY => {
  const pl = A.place(f);
  const H = figH(A.cast) * pl.s;
  return { x: pl.x, y: pl.y - (A.cast.age === "child" ? 0.85 : 0.9) * H };
};

/* ---------------- W2: the world before the words (open gap a_world) ---------------- */

const W2_CAM_END = FC.mangoMedium;
const W2_CAM_START: Cam = { x: FC.mangoMedium.x + 1000, y: -200, zoom: 2.3 };
/** The tilt from the kite down to the field: held on the sky, then down, settling on the shot-1 frame. */
const W2_TILT = { from: W2.fromStory + 10, to: W2.fromStory + 32 };
/** ...then the pan left onto the shot-1 frame (the boys come in whole from the left edge). */
const W2_PAN = { from: W2.fromStory + 28, to: W2.fromStory + W2.frames - 2 };
/** The kite on the 0.65 plane, placed so it sits upper right of centre in the sky frame (real frames from the scene's
 * start: the kite is life, it keeps flying). */
const KITE_D = 0.65;
const KITE_AT: XY = (() => {
  const c = villageKeepInSet("field", W2_CAM_START);
  const k = Math.pow(c.zoom, KITE_D);
  return { x: 960 + c.x * KITE_D + (640 - 960) / k, y: 540 + c.y * KITE_D + (230 - 540) / k };
})();
const KITE_TUGS = [14, 40, 130, 260];
/** The goat tethered at the field's edge (right of the boys), chewing; a bleat in W2 and one later. */
const GOAT = { x: 1342, y: 886, peg: { x: 1268, y: 902 } };
const GOAT_BLEATS = [30, 236];
/** The kolshi woman, far off on the mid field (0.8 plane), walking left to right through W2 and shot 1. */
const KOLSHI_WALK: WalkOpts = { start: -10, dur: 250, fromX: 260, toX: 1180, scale: 0.42, height: CAST.womanB.height, seed: CAST.womanB.seed, kind: "hurry", startIn: 1, stopIn: 10 };
const KOLSHI_Y = 800;
const KolshiWoman: React.FC<{ lifeF: number; light: Lighting }> = ({ lifeF, light }) =>
  lifeF > KOLSHI_WALK.start + KOLSHI_WALK.dur + 40 ? null : (
    <Puppet
      cast={CAST.womanB}
      f={lifeF}
      lifeF={lifeF}
      x={walkTravel(lifeF, KOLSHI_WALK).bodyX}
      y={KOLSHI_Y}
      scale={KOLSHI_WALK.scale}
      light={light}
      props={KOLSHI_PUPPET_PROPS}
      acting={(fr) => ({ ...BASE_POSE, ...(fr <= KOLSHI_WALK.start + KOLSHI_WALK.dur ? kolshiWalkPose(fr, KOLSHI_WALK) : KOLSHI_CARRY_POSE), smile: 0.2 })}
    />
  );
/** Life clocks of the kolshi woman's steps (for the sound agent): from walkPlantFrames. */
const KOLSHI_STEPS = walkPlantFrames(KOLSHI_WALK).map((p) => p.f);

/* ---------------- T1: the treasury in close-up (pause after "বিশ্বাস করত!") ---------------- */

/** T1 (a): boy C kisses his top and sets it on the gamchha. */
const T1C = { x: 718, y: 984 };
const T1C_K = kF(T1C.y);
const T1C_H = figH(CAST.villageBoyC) * T1C_K;
/** C's top on the cloth after he sets it down (figure units of the seated rig). */
const CTOP_FIG: XY = { x: 104, y: 7 };
const t1TopHand = (t: number): XY => {
  const chest = { x: T1C.x - 30, y: T1C.y - 0.58 * T1C_H };
  const lips = { x: T1C.x - 20, y: T1C.y - 0.72 * T1C_H };
  const down = { x: WS(CTOP_FIG).x + 6, y: WS(CTOP_FIG).y - 30 };
  return pathAt(t, [
    [1, chest],
    [6, lips],
    [9, lips],
    [T1_PART[1] - 1, down],
  ]);
};
const t1BoyC = makeActor({
  cast: CAST.villageBoyC,
  x0: T1C.x,
  y0: T1C.y,
  flip: true,
  kOf: kF,
  keys: [
    { f: -999, bodyTurn: 0.55, hold: 1, smile: 0.5, eyeY: 0.3, brow: 0.3 },
    // the kiss: eyes closed (lid), head forward to the top
    { f: 6, in: 5, ease: io, lid: 0.9, headNod: 3, smile: 0.2, lean: 4 },
    { f: 10, in: 3, ease: io, lid: 0.1, smile: 0.6 },
    { f: T1_PART[1] - 1, in: 6, ease: io, crouch: 0.45, lean: 14, headNod: 4, eyeY: 0.6 },
  ],
});
const t1BoyCMouth = (t: number): MouthState => (t >= 6 && t < 10 ? { open: 0.08, width: 0.55, round: 1, teeth: 0 } : MOUTH_REST);
/** T1 (b): the cracked marble set apart (a treasurer step on the T1 clock); (c) he pats the heaps. */
const CRACK = { from: { x: 100, y: -5 }, to: { x: 128, y: 7 } };
const T1B_START = T1_PART[1] - 12; // treasurer poseStart (T1 clock): grip at +14, set down at +28, let go at +31
const t1Balak = (t: number, lifeF: number): SeatedChildProps => {
  const base = seatBase(T1.atStory + t, lifeF);
  if (t < T1_PART[2]) return { ...base, pose: "treasurer", prevPose: "sitCross", poseStart: T1.atStory + T1B_START, prevPoseStart: 0, pickPlace: [CRACK], face: { smile: 0.4 } };
  // (c) both hands pat the heaps, first the near hand, then both, soft and quick; a small content smile
  const u = t - T1_PART[2];
  const pat = (ph: number) => 7 * Math.max(0, Math.sin((u + ph) * 0.75));
  return {
    ...base,
    f: T1.atStory + t,
    pose: "handsTo",
    prevPose: "treasurer",
    poseStart: T1.atStory + T1_PART[2],
    prevPoseStart: T1.atStory + T1B_START,
    handTargets: { near: { x: 70, y: 2 - pat(0) }, far: { x: 52, y: -3 - pat(2.2) * clamp((u - 4) / 4) } },
    face: { smile: 0.62, eyesDown: 0.5 },
  };
};
/** The cracked marble (a thin dark crack over it). */
const CrackedMarble: React.FC<{ at: XY; s: number }> = ({ at, s }) => (
  <g>
    <Marble x={at.x} y={at.y} s={s} color={1} seed={5} />
    <path d={`M ${at.x - 1.1 * s} ${at.y - 2.6 * s} L ${at.x + 0.2 * s} ${at.y - 1.6 * s} L ${at.x - 0.3 * s} ${at.y - 0.9 * s} L ${at.x + 0.9 * s} ${at.y - 0.2 * s}`} stroke="#3a3f4a" strokeWidth={0.35 * s} fill="none" opacity={0.8} />
  </g>
);

/* ---------------- L1: the চুপিচুপি walk down the lane (gap a_lane_walk, b_haystack_duck) ---------------- */

const VL = VILLAGE.lane;
const L1W = { x0: VL.l1Walk.x, x1: VL.haystackApproach.x, y: VL.pathLine.y };
const L1_K = kF(L1W.y);
const L1_HIDE = { x: VL.haystackHide.x, y: VL.haystackHide.y };
const L1_HIDE_K = kF(L1_HIDE.y);
/** Beat a: he walks briskly (about 2 steps a second... a child's quick steps: 5 steps in the beat). */
const l1aBalak = (f: number, lifeF: number): StandingChildProps => {
  const u = clamp((f - L1.fromStory) / (L1_B - L1.fromStory));
  const x = lerp(L1W.x0, L1W.x1, u);
  const steps = (f - L1.fromStory) / 5;
  const bob = -3.2 * Math.abs(Math.sin(Math.PI * steps));
  return {
    ...standBase(x, L1W.y + bob, L1_K, f, lifeF),
    pose: "holdOut",
    poseStart: -200,
    noteAt: { x: 46, y: -300 },
    noteW: 30,
    noteAngle: -10,
    gaze: [{ start: -999, at: { x: 260, y: -470 } }],
    expression: "thoughtful",
    face: { smile: 0.15 },
  };
};
/** Beat b: crouched behind the haystack, peeking round it at the culprit crossing far ahead; then up to hurry on. */
const L1_PEEK = L1_B + 6;
const L1_RISE = L1_B + 17;
const l1bBalak = (f: number, lifeF: number): StandingChildProps => {
  const base = { ...standBase(L1_HIDE.x, L1_HIDE.y, L1_HIDE_K, f, lifeF), expression: "playful" as const };
  const gaze = [
    { start: -999, at: { x: 330, y: -300 } },
    { start: L1_PEEK + 8, at: { x: 380, y: -330 } },
  ];
  if (f < L1_RISE) return { ...base, pose: "standBend", poseStart: L1_B - 4, bendAt: { x: 70, y: -150 }, gaze, face: { smile: 0.2 } };
  return { ...base, pose: "rise", prevPose: "standBend", poseStart: L1_RISE, prevPoseStart: L1_B - 4, bendAt: { x: 70, y: -150 }, gaze: [{ start: L1_RISE, at: { x: 300, y: -480 } }], face: { smile: 0.4 } };
};
/** The culprit crossing the cross lane far ahead (the `crossing` slot), left to right, during beat b. */
const L1_CROSS: WalkOpts = {
  start: L1_B + 1,
  dur: 18,
  fromX: VL.farCross[0].x,
  toX: VL.farCross[1].x,
  scale: kF(VL.farCross[0].y),
  height: CAST.culpritFriend.height,
  seed: CAST.culpritFriend.seed,
  kind: "run",
  child: true,
  startIn: 3,
  stopIn: 2,
};
/** The near foreground of the tracking shot: tall grass and a low bamboo rail streaming past below his knees. */
const LaneForeground: React.FC<{ cam: Cam; topScreenY: number }> = ({ cam, topScreenY }) => {
  const D = 1.25;
  const k = Math.pow(cam.zoom, D);
  const wy = 540 + cam.y * D + (topScreenY - 540) / k;
  const x0 = 960 + cam.x * D - 1100 / k;
  const x1 = 960 + cam.x * D + 1100 / k;
  const blades: React.ReactNode[] = [];
  const step = 6;
  for (let i = 0; i * step < x1 - x0 + 2 * step; i++) {
    const bx = Math.floor(x0 / step) * step + i * step;
    const tall = hashN(bx * 0.13) > 0.82;
    const h = (tall ? 70 : 26) + (tall ? 40 : 30) * hashN(bx * 0.37);
    const lean = 12 * (hashN(bx * 0.91) - 0.5);
    const tone = hashN(bx * 1.7);
    const col = tone > 0.66 ? "#6e8a3c" : tone > 0.33 ? "#587530" : "#46622a";
    blades.push(<path key={i} d={`M ${bx - 2.6} ${wy + 40} Q ${bx + lean * 0.4} ${wy + 20 - h * 0.5} ${bx + lean} ${wy + 26 - h} Q ${bx + 0.8 + lean * 0.4} ${wy + 20 - h * 0.5} ${bx + 3} ${wy + 40} Z`} fill={col} />);
    if (tall && tone > 0.5) blades.push(<ellipse key={`s${i}`} cx={bx + lean} cy={wy + 24 - h} rx={2.2} ry={5} fill="#c9b06a" />);
  }
  return (
    <Layer depth={D} extraBlur={2.2}>
      <defs>
        <linearGradient id="e6s02-lanefg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f6b2c" stopOpacity={0} />
          <stop offset="0.35" stopColor="#4a6428" stopOpacity={0.85} />
          <stop offset="1" stopColor="#3c5422" stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect x={x0} y={wy + 14} width={x1 - x0} height={600} fill="url(#e6s02-lanefg)" />
      {blades}
    </Layer>
  );
};
const hashN = (v: number) => {
  const s = Math.sin(v * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* ---------------- R1: reactions (pause after "দু'আনা দিলেন—"), then the note insert (M1 part 1) ---------------- */

/** Expression overlays for the three reaction close-ups (t = real frames since R1 began). */
const r1Dada = (t: number): Partial<Pose> => ({ brow: 0.95 * ease(t / 3), browTilt: 0.35, eyeX: 0.65, headTilt: -4, smile: 0.18, headNod: -1 });
const r1Boudi = (t: number): Partial<Pose> => ({ mouthHand: -1 * ease((t - 8) / 4), smile: 0.7, lid: 0.28, eyeY: 0.35, headTilt: 5 });
const r1Culprit = (t: number): Partial<Pose> => ({ flush: ease((t - 15) / 7), cheeks: 0.4, eyeY: 0.95, headNod: 10, headTilt: -5, smile: 0, brow: 0.5, browTilt: 0.7 });

/* ---------------- M1: the jar glinting (from "আর দয়ালু") ---------------- */

const JarGlint: React.FC<{ at: XY; t: number }> = ({ at, t }) => {
  const k = Math.max(0, Math.sin((Math.PI * t) / M1_LEN));
  return (
    <g opacity={0.85 * k}>
      <ellipse cx={at.x - 6} cy={at.y - 32} rx={2.6} ry={7} fill="#ffffff" opacity={0.75} />
      <path d={`M ${at.x - 6} ${at.y - 44} L ${at.x - 5.3} ${at.y - 33} L ${at.x - 6} ${at.y - 22} L ${at.x - 6.7} ${at.y - 33} Z`} fill="#fffaf0" />
      <path d={`M ${at.x - 14} ${at.y - 33} L ${at.x - 6} ${at.y - 32.4} L ${at.x + 2} ${at.y - 33} L ${at.x - 6} ${at.y - 33.6} Z`} fill="#fffaf0" />
    </g>
  );
};

/* ---------------- G2: the afterglow on the fallen log at sunset (P3) ---------------- */

const LOG = VF.logSeat;
const LOG_K = kF(VF.log.y);
/** Seven seats along the log: C, B, A, Balak, the culprit, D, E (Balak in the middle, the culprit on his right). */
const LOG_XS = [0, 1, 2, 3, 4, 5, 6].map((i) => lerp(LOG.x0 + 30, LOG.x1 - 30, i / 6));
const G2_BALAK = { x: LOG_XS[3], y: LOG.y };
const G2_KIDS: Array<{ c: CastEntry; x: number; flip: boolean; seed: number }> = [
  { c: CAST.villageBoyC, x: LOG_XS[0], flip: false, seed: 1 },
  { c: CAST.villageBoyB, x: LOG_XS[1], flip: false, seed: 2 },
  { c: CAST.villageBoyA, x: LOG_XS[2], flip: false, seed: 3 },
  { c: CAST.culpritFriend, x: LOG_XS[4], flip: true, seed: 4 },
  { c: CAST.villageBoyD, x: LOG_XS[5], flip: true, seed: 5 },
  { c: CAST.villageBoyE, x: LOG_XS[6], flip: true, seed: 6 },
];
/** G2 clock pc = real frames since P3 began (the story is held; it runs on 14 f after P3 to the scene's end). */
const G2T = { nudge1: 14, nudge2: 30, shy: 22, glow: 30, glowTo: 52, pull: 10, pullTo: P3.frames + 12 };
const g2KidActing = (kid: (typeof G2_KIDS)[number]) => (pc: number): Pose => {
  const culprit = kid.c === CAST.culpritFriend;
  const chew = 0.5 + 0.5 * Math.sin(pc * 0.55 + kid.seed);
  const swing = Math.sin(pc * 0.18 + kid.seed * 1.7);
  if (culprit) {
    const nudge = (at: number) => Math.max(0, Math.sin((Math.PI * (pc - at)) / 8)) * (pc > at && pc < at + 8 ? 1 : 0);
    const shy = ease((pc - G2T.shy) / 12);
    return {
      ...BASE_POSE,
      bodyTurn: 0.55,
      lean: 7 * (nudge(G2T.nudge1) + nudge(G2T.nudge2)) + 2,
      headTilt: 6 * shy,
      headNod: 4 - 3 * shy,
      eyeY: lerp(0.5, 0.15, shy),
      eyeX: -0.45,
      smile: lerp(0.15, 0.5, shy),
      brow: 0.35,
      browTilt: 0.4,
      cheeks: 0.55,
      rS: 8,
      rE: -40,
      lS: 8,
      lE: -40,
      bodyY: 0.8 * swing,
    };
  }
  const base: Pose = { ...BASE_POSE, bodyTurn: 0.45, smile: 0.75, cheeks: 0.85, eyeX: kid.x < G2_BALAK.x ? 0.35 : -0.35, headTilt: 3 * swing, rS: 10, rE: -40, lS: 8, lE: -40, lean: 1.5 * chew, bodyY: 0.8 * swing };
  switch (kid.seed) {
    case 1: // C: leaning back on his hands, face up to the warm light
      return { ...base, behind: 1, lean: -7 + 1.2 * chew, headTilt: -4 + 2 * swing, eyeY: -0.2, bodyTurn: 0.3 };
    case 2: // B: a hand on his cheek, full of sweet
      return { ...base, mouthHand: -0.8, cheeks: 1, headTilt: 7 + 2 * swing, smile: 0.85 };
    case 5: // D: an elbow on his knee, leaning in toward the others
      return { ...base, lean: 9 + 1.5 * chew, headNod: 3, rS: 34, rE: -100, lS: 20, lE: -60, eyeX: -0.5 };
    case 6: // E: rocking a little, arms round himself, giggling
      return { ...base, join: 0, lS: 40, lE: -120, rS: 40, rE: -120, headTilt: 5 * Math.sin(pc * 0.3), smile: 0.9 };
    default:
      return base;
  }
};
const g2KidMouth = (kid: (typeof G2_KIDS)[number]) => (pc: number): MouthState => ({ open: 0.05 + 0.05 * Math.max(0, Math.sin(pc * 0.55 + kid.seed)), width: 0.8, round: 0.5, teeth: 0 });
const g2Balak = (pc: number, lifeF: number): SeatedChildProps => ({
  x: G2_BALAK.x,
  y: G2_BALAK.y,
  s: SEAT_S * LOG_K,
  f: P3_STORY + pc,
  lifeF,
  design: "plate",
  age: 6,
  build: "healthy",
  mouth: 0,
  talk: 0,
  pose: "sitCross",
  // he turns his eyes to the culprit at the first nudge and smiles; the glow follows
  face: { lookX: 0.25 + 0.45 * ease((pc - G2T.nudge1 - 2) / 8), smile: lerp(0.45, 0.68, ease((pc - G2T.shy) / 16)) },
});
const g2Cam = (pc: number): Cam => {
  const a = FC.logTwo;
  const twoX = (G2_BALAK.x + LOG_XS[4]) / 2;
  const start = villageFrameOn(twoX, 800, 960, 560, 2.2);
  void a;
  return villageKeepInSet("field", mixCam(start, FC.logRow, ease((pc - G2T.pull) / (G2T.pullTo - G2T.pull))));
};

/* ---------------- the camera of every shot ---------------- */

const camAt = (shot: ShotId, f: number, lifeF: number): Cam => {
  switch (shot) {
    case "w2":
    {
      const ty = ease((f - W2_TILT.from) / (W2_TILT.to - W2_TILT.from));
      const tx = ease((f - W2_PAN.from) / (W2_PAN.to - W2_PAN.from));
      const z = Math.exp(lerp(Math.log(W2_CAM_START.zoom), Math.log(W2_CAM_END.zoom), ty));
      return villageKeepInSet("field", { x: lerp(W2_CAM_START.x, W2_CAM_END.x, tx), y: lerp(W2_CAM_START.y, W2_CAM_END.y, ty), zoom: z });
    }
    case "s1":
    case "ag3":
      return villageKeepInSet("field", FC.mangoMedium);
    case "s2":
      return villageKeepInSet("field", FC.wide);
    case "t1a":
      return villageFrameOn(T1C.x - 22, T1C.y - 0.7 * T1C_H, 960, 520, 4.2);
    case "t1b": {
      const c = WS({ x: 108, y: 0 });
      return villageFrameOn(c.x, c.y - 10, 960, 620, 8);
    }
    case "t1c":
      return villageFrameOn(SEAT.x + 60, SEAT.y - 56, 960, 640, 3.8);
    case "s3e": {
      const h = headOf(culprit3, f);
      return villageFrameOn(h.x - 2, h.y + 2, 960, 470, 8.5);
    }
    case "s3":
      return villageKeepInSet("house", HC.shirtInsert);
    case "s4":
      return villageKeepInSet("field", FC.mangoTwo);
    case "l1a":
      return villageKeepInSet("lane", mixCam(villageFrameOn(1320, 790, 960, 540, 1.65), villageFrameOn(1700, 790, 960, 540, 1.65), ease((f - L1.fromStory) / (L1_B - L1.fromStory))));
    case "l1b":
      return villageKeepInSet("lane", LC.haystackHold);
    case "s5":
      // a tighter two-shot than the set's verandaFoot working cam (Balak and the boudi fill the frame)
      return villageKeepInSet("house", villageFrameOn(1036, 748, 960, 520, 2.3));
    case "s6":
      // the courtyard a little tighter than the set's wide working cam (the dada to the gang)
      return villageKeepInSet("house", villageFrameOn(1196, 790, 960, 560, 1.55));
    case "r1a": {
      const h = headOf(dada6, f);
      return villageFrameOn(h.x + 2, h.y + 4, 960, 520, 8.5);
    }
    case "r1b": {
      const h = headOf(boudi6, f);
      return villageFrameOn(h.x + 2, h.y + 12, 960, 520, 9);
    }
    case "r1c": {
      const h = headOf(culprit6, f);
      return villageFrameOn(h.x + 22, h.y + 22, 960, 470, 9);
    }
    case "n6": {
      const pl = boudi6.place(f);
      const H = figH(CAST.boudi) * pl.s;
      return villageFrameOn(pl.x - 0.08 * H + 17, pl.y - 0.42 * H - 4, 640, 540, 16);
    }
    case "jar":
      return villageFrameOn(JAR.x - 2, JAR.y - 24, 960, 560, 13);
    case "s7":
      return villageKeepInSet("field", FC.stallMedium);
    case "s8":
      // medium wide on Balak and the boys before the stall
      return villageKeepInSet("field", villageFrameOn(2676, 800, 960, 560, 1.32));
    case "g2":
      return g2Cam(lifeF - P3_REAL);
  }
};

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

export const Scene02TreasurerAndTenRupees: React.FC = () => {
  const { f, lifeF, pause } = useStory6(SCENE_ID);
  const shot = shotAt(f, lifeF, pause.inPause);
  const view = SHOT_VIEW[shot];
  const cam = camAt(shot, f, lifeF);
  const pm = shot === "s7" || shot === "s8" || shot === "jar";
  const time: VillageTime = shot === "g2" ? "sunset" : pm ? "afternoon" : "lateMorning";
  const light = shot === "g2" ? LIGHT_SUN : pm ? LIGHT_PM : LIGHT_AM;
  const fieldLife = shot === "w2" || shot === "s1" || shot === "s2" || shot === "ag3" || shot === "t1c";

  let floor: React.ReactNode = null;
  let mid: React.ReactNode = null;
  let far: React.ReactNode = undefined;
  let inPocket: React.ReactNode = undefined;
  let doorway: React.ReactNode = undefined;
  let crossing: React.ReactNode = undefined;
  let sellerNode: React.ReactNode = undefined;
  let front: React.ReactNode = null;
  let logOn = false;
  let logShadows: LogShadow[] | undefined;
  let extraGrade = 0;

  const fig = (A: Actor, fr: number, extra?: Partial<PuppetProps>) => <ActorFig A={A} f={fr} lifeF={lifeF} light={light} extra={extra} />;
  const goat = <Goat x={GOAT.x} y={GOAT.y} s={kF(GOAT.y)} flip lifeF={lifeF} seed={3} peg={GOAT.peg} bleatAt={GOAT_BLEATS} />;
  if (fieldLife || shot === "t1a" || shot === "t1b" || shot === "s4") {
    mid = (
      <>
        <BallGame lifeF={lifeF} light={light} shot={shot === "w2" || shot.startsWith("t1") ? "s1" : shot} />
        <KolshiWoman lifeF={lifeF} light={light} />
      </>
    );
    far = <Kite x={KITE_AT.x} y={KITE_AT.y} s={0.5} lifeF={lifeF} seed={2} wind={0.7} tugAt={KITE_TUGS} />;
  }

  if (shot === "w2" || shot === "s1") {
    const bp = s1Balak(Math.max(f, CUT.one), lifeF);
    const anc = seatedEp6Anchors(bp);
    const hands = pathAt(f, GIVER_HANDS);
    const ball = anc.ball && anc.ball.inHands ? anc.ball : { x: hands.x, y: hands.y, r: 11.5 * SEAT.s, inHands: false };
    const inGiver = f < TB + 18;
    const ballNode = (c: XY) => <StitchedBall x={c.x} y={c.y + ball.r} s={BALL_S} shadow={false} squash={0.3} spin={inGiver ? -20 : -20 - 30 * ease((f - TB - 18) / 20)} />;
    floor = (
      <>
        {goat}
        {fig(smirkD, f)}
        {fig(smirkB, f)}
        <SeatedGlow props={bp} lifeF={lifeF} />
        {inGiver && ballNode({ x: ball.x, y: ball.y })}
        {fig(giverA, f, { holdAt: (fr) => pathAt(fr, GIVER_HANDS) })}
        <SeatedChild {...bp} propInHands={!inGiver ? ballNode({ x: ball.x, y: ball.y }) : undefined} />
      </>
    );
  } else if (shot === "s2") {
    const bp = s2Balak(f, lifeF);
    const anc = seatedEp6Anchors(bp);
    const st = f >= TS ? treasurerAt(f - TS, STEPS) : null;
    const boys = [
      { d: D2.B, kind: "top" as const, fig: ITEMS.top.drop },
      { d: D2.D, kind: "coins" as const, fig: ITEMS.coins.drop },
      { d: D2.A, kind: "marbles" as const, fig: ITEMS.marbles.drop },
      { d: D2.E, kind: "shirt" as const, fig: ITEMS.shirt.drop },
    ];
    const order = [...boys].sort((a, b) => a.d.A.place(f).y - b.d.A.place(f).y);
    floor = (
      <>
        {goat}
        <StitchedBall x={BALL_REST.x} y={BALL_REST.y} s={BALL_S} squash={0.35} spin={-30} />
        <Treasury f={f} lifeF={lifeF} />
        <SeatedGlow props={bp} lifeF={lifeF} />
        <SeatedChild {...bp} />
        {st?.carrying && <ItemArt kind={STEP_KIND[st.step]} at={anc.nearPinch} />}
        {order.map(({ d, kind, fig: dfig }) => {
          const it = droppedAt(f, d.drop, d.hand, dfig);
          const falling = it && f >= d.drop - 6 && f < d.drop + FALL; // in his fist (hidden) until his hand is over the cloth
          return (
            <React.Fragment key={kind}>
              {fig(d.A, f, { reachAt: () => d.hand })}
              {falling && it && <ItemArt kind={kind} at={it.at} />}
              {falling && kind === "marbles" && it && <ItemArt kind="stray" at={{ x: it.at.x + 5, y: it.at.y + 2 }} />}
            </React.Fragment>
          );
        })}
      </>
    );
  } else if (shot === "t1a" || shot === "t1b" || shot === "t1c") {
    // T1: the treasury in close-up, on its own real clock t (the story holds at T1, then runs to "একদিন")
    const t = lifeF - T1_REAL;
    const bp = t1Balak(t, lifeF);
    const anc = seatedEp6Anchors(bp);
    const st = treasurerAt(t - T1B_START, [CRACK]);
    const crackAt = t < T1B_START + TREASURER_T.grip ? WS(CRACK.from) : st.carrying && t < T1_PART[2] ? anc.nearPinch : WS(CRACK.to);
    const topIn = t < T1_PART[1] - 1;
    const topHand = t1TopHand(t);
    floor = (
      <>
        {shot === "t1c" && goat}
        <StitchedBall x={BALL_REST.x} y={BALL_REST.y} s={BALL_S} squash={0.35} spin={-30} />
        <Treasury f={f} lifeF={lifeF} sorted extra={!topIn} />
        {!(st.carrying && t < T1_PART[2]) && <CrackedMarble at={crackAt} s={ITEM_S} />}
        <SeatedGlow props={bp} lifeF={lifeF} />
        <SeatedChild {...bp} />
        {st.carrying && t < T1_PART[2] && <CrackedMarble at={crackAt} s={ITEM_S} />}
        {shot === "t1a" && (
          <>
            {fig(t1BoyC, t, { holdAt: () => topHand, mouth: t1BoyCMouth })}
            {topIn && <Top x={topHand.x} y={topHand.y + 9} s={1.5} string="wound" />}
          </>
        )}
      </>
    );
  } else if (shot === "s3e" || shot === "s3") {
    const n = s3Note(f, lifeF);
    const note = <TenRupeeNote x={n.c.x} y={n.c.y} s={NOTE_POCKET_S} state="folded" rot={84} />;
    inPocket = n.inPocket ? note : undefined;
    floor = (
      <>
        {fig(culprit3, f, { reachAt: (fr) => s3Hand(fr, lifeF + (fr - f)) })}
        {!n.inPocket && note}
      </>
    );
  } else if (shot === "s4") {
    // Balak's clock b runs on through P2 (D2: the three looks, the breeze, the fold, the rise)
    const b = lifeF - T1.frames;
    const bp = s4Balak(b, lifeF);
    const anc = seatedEp6Anchors(bp);
    const note = anc.note ?? { x: GIVE_NOTE_W.x, y: GIVE_NOTE_W.y, rot: 0, w: 15, h: 8, inHands: false, fold: 0 };
    const noteS = note.w / 15;
    const flap = noteFlap(b);
    const noteNode = (
      <g>
        <TenRupeeNote x={note.x} y={note.y} s={noteS * (1 - 0.2 * note.fold)} state="folded" rot={note.rot} />
        {flap > 0.01 && (
          <g transform={`translate(${note.x + note.w * 0.42} ${note.y - note.h * 0.45}) rotate(${note.rot - 30 * flap})`}>
            <path d={`M 0 0 L ${-note.w * 0.28} 0 L 0 ${-note.h * 0.75 * flap} Z`} fill="#c7d4da" />
          </g>
        )}
      </g>
    );
    const held = b < TN + 18;
    floor = (
      <>
        <SeatedGlow props={bp} lifeF={lifeF} />
        {held && <TenRupeeNote x={GIVE_NOTE_W.x} y={GIVE_NOTE_W.y} s={noteS} state="folded" rot={-6} />}
        <SeatedChild {...bp} propInHands={!held ? noteNode : undefined} />
        {fig(culprit4, b, { holdAt: () => GIVE_NOTE_W, mouth: culprit4Mouth })}
      </>
    );
  } else if (shot === "l1a" || shot === "l1b") {
    const bp = shot === "l1a" ? l1aBalak(f, lifeF) : l1bBalak(f, lifeF);
    const j = standingChildJoints(bp);
    const noteS = (30 * (bp.s ?? 0.6)) / 15;
    const noteNode = j.note ? <TenRupeeNote x={j.note.anchor.x} y={j.note.anchor.y} s={noteS} state="folded" rot={j.note.angle} /> : null;
    floor = (
      <>
        <LongShadow x={bp.x} y={bp.y} h={330 * L1_K} time={time} />
        <StandingGlow props={bp} lifeF={lifeF} />
        <StandingChild {...bp} layerMid={shot === "l1a" ? noteNode : undefined} />
        {shot === "l1b" && <TenRupeeNote x={j.pinchNear.x} y={j.pinchNear.y + 2} s={noteS * 0.9} state="folded" rot={-70} />}
      </>
    );
    if (shot === "l1b") {
      const tr = walkTravel(f, L1_CROSS);
      crossing = (
        <Puppet
          cast={CAST.culpritFriend}
          f={f}
          lifeF={lifeF}
          x={tr.bodyX}
          y={VL.farCross[0].y}
          scale={L1_CROSS.scale}
          light={light}
          acting={(fr) => ({ ...BASE_POSE, ...GESTURES6.sly, ...(fr >= L1_CROSS.start && fr <= L1_CROSS.start + L1_CROSS.dur + 2 ? walkPose(fr, L1_CROSS) : { bodyTurn: 0.6 }) })}
        />
      );
    } else {
      front = <LaneForeground cam={cam} topScreenY={835} />;
    }
  } else if (shot === "s5") {
    const bp = s5Balak(f, lifeF);
    const j = standingChildJoints(bp);
    const noteNode = j.note ? <TenRupeeNote x={j.note.anchor.x} y={j.note.anchor.y} s={NOTE5_S} state="folded" rot={j.note.angle} /> : null;
    const boudiA: { v: PuppetAnchors | null } = { v: null };
    const reachNote = (): XY => (j.note ? { x: j.note.far.x + 6, y: j.note.far.y - 3 } : { x: B5.x + 40, y: B5.y - 150 });
    floor = (
      <>
        <StandingGlow props={bp} lifeF={lifeF} />
        {fig(boudi5, f, { reachAt: reachNote, anchors: (a) => (boudiA.v = a) })}
        <StandingChild {...bp} layerMid={f < S5.take ? noteNode : undefined} />
        {f >= S5.take && (
          <Later
            r={() => {
              if (!boudiA.v) return null;
              const r = Math.abs(boudi5.acting(f).reach);
              const c = heldPoint(boudiA.v.lWrist, reachNote(), r, { x: -2, y: -9 * BOUDI5_K });
              return <TenRupeeNote x={c.x} y={c.y} s={NOTE5_S} state="folded" rot={lerp(-8, -70, 1 - r)} />;
            }}
          />
        )}
      </>
    );
  } else if (shot === "ag3") {
    const bp = agBalak(f, lifeF);
    const palmTarget = WS({ x: 150, y: -150 });
    floor = (
      <>
        {goat}
        <StitchedBall x={BALL_REST.x} y={BALL_REST.y} s={BALL_S} squash={0.35} spin={-30} />
        <Treasury f={f} lifeF={lifeF} sorted extra />
        <CrackedMarble at={WS(CRACK.to)} s={ITEM_S} />
        {gangAG.map((A, i) => (
          <React.Fragment key={i}>{fig(A, f)}</React.Fragment>
        ))}
        <SeatedGlow props={bp} lifeF={lifeF} />
        <SeatedChild {...bp} />
        {fig(friendAG, f, { reachAt: () => palmTarget })}
      </>
    );
  } else if (shot === "s6" || shot === "r1a" || shot === "r1b" || shot === "r1c" || shot === "n6") {
    const bp = s6Balak(f, lifeF);
    const boudiPl = boudi6.place(f);
    const inDoor = f < H6.out + 6;
    const coinsGiven = f >= H6.coins;
    const j = standingChildJoints(bp);
    const coinScale = B6_S / 0.56;
    const boudiA: { v: PuppetAnchors | null } = { v: null };
    const coinTarget: XY = { x: PALM6_W.x + 4, y: PALM6_W.y - 8 };
    const rt = lifeF - R1_REAL;
    const inR1 = rt >= 0 && lifeF < real(CUT.stall);
    // the reactions (R1): overlays on the pose of the one in close-up; after R1 she folds the note (M1, part 1)
    const over = (A: Actor, o: (t: number) => Partial<Pose>): Partial<PuppetProps> => ({ acting: (fr: number) => ({ ...A.acting(fr), ...o(rt) }) });
    const folded = inR1 && rt >= R1_PART[2];
    const boudiNode = (
      <>
        {fig(boudi6, f, { reachAt: () => coinTarget, anchors: (a) => (boudiA.v = a), ...(shot === "r1b" ? over(boudi6, r1Boudi) : {}) })}
        <Later
          r={() => {
            if (!boudiA.v) return null;
            // the note in her near (left) fist; the two annas lie in her far (right) hand until they drop
            const low = ease((f - H6.palmOut) / 14);
            const nh = { x: boudiA.v.lWrist.x - 1, y: boudiA.v.lWrist.y + lerp(-9, 8, low) * boudiPl.s };
            const r = Math.abs(boudi6.acting(f).reach);
            const ch = heldPoint(boudiA.v.rWrist, coinTarget, r, { x: 2, y: 7 * boudiPl.s });
            return (
              <>
                {folded ? (
                  <TenRupeeNote x={nh.x} y={nh.y + 2 * boudiPl.s} s={coinScale * 1.1} state="folded" rot={-12} />
                ) : (
                  <TenRupeeNote x={nh.x} y={nh.y} s={coinScale * 1.1} state="held" hold="one" bend={0.45} rot={lerp(-62, 70, low)} />
                )}
                {!coinsGiven && f >= H6.palmOut && <TwoAnnas x={ch.x} y={ch.y + 2} s={coinScale} arrangement="stacked" />}
              </>
            );
          }}
        />
      </>
    );
    doorway = inDoor ? boudiNode : undefined;
    floor = (
      <>
        {gang6.map((A, i) => (
          <React.Fragment key={i}>{fig(A, f)}</React.Fragment>
        ))}
        {!inDoor && f < H6.down + 4 && boudiNode}
        {fig(dada6, f, { reachAt: culpritShoulder, ...(shot === "r1a" ? over(dada6, r1Dada) : {}) })}
        {fig(culprit6, f, shot === "r1c" ? over(culprit6, r1Culprit) : undefined)}
        <StandingGlow props={bp} lifeF={lifeF} />
        <StandingChild {...bp} />
        {coinsGiven && <TwoAnnas x={j.handNear.x} y={j.handNear.y - 2} s={coinScale} arrangement="palm" />}
        {!inDoor && f >= H6.down + 4 && boudiNode}
      </>
    );
  } else if (shot === "jar" || shot === "s7") {
    extraGrade = 0.04;
    const bp = s7Balak(f, lifeF);
    const j = standingChildJoints(bp);
    const coinScale = B7_S / 0.56;
    const onCounter = f >= S7.coinsDown;
    const tw = s7Twist(f);
    const twist = <PaperTwist x={tw.x} y={tw.y} s={B7_S / 0.56} fill={s7TwistFill(f)} rot={f < S7.pick ? 0 : -8} seed={3} />;
    const twa = paperTwistAnchors({ x: TWIST_STAND.x, y: TWIST_STAND.y, s: B7_S / 0.56 });
    const pouring = f >= S7.pour - 2 && f < S7.poured + 2;
    const sh = sellerHand(f);
    sellerNode = seller(light, f, lifeF, false);
    floor = (
      <>
        <LozengeJar x={JAR.x} y={JAR.y} s={JAR.s} lidOpen={s7LidOpen(f)} fill={0.8} seed={2} />
        {shot === "jar" && <JarGlint at={{ x: JAR.x, y: JAR.y }} t={f - CUT.stall} />}
        {onCounter && <TwoAnnas x={COIN_SPOT.x} y={COIN_SPOT.y} s={coinScale} arrangement="pair" />}
        {f < S7.touch && twist}
        {f >= S7.scoop && f < S7.pour + 4 &&
          [0, 1, 2].map((i) => {
            const u = pouring ? clamp((f - S7.pour + i * 1.5) / 6) : 0;
            const at = { x: lerp(sh.x - 3 + 3 * i, twa.mouth.x - 2 + 2 * i, u), y: lerp(sh.y + 5, twa.mouth.y + 2, u * u) };
            return u < 1 ? <Lozenge key={i} x={at.x} y={at.y} s={B7_S / 0.56} color={LOZ_COL[i]} /> : null;
          })}
        <StandingGlow props={bp} lifeF={lifeF} />
        <StandingChild {...bp} />
        {f >= S7.touch && twist}
        {!onCounter && <TwoAnnas x={j.handNear.x} y={j.handNear.y - 2} s={coinScale} arrangement="palm" />}
      </>
    );
  } else if (shot === "s8") {
    extraGrade = 0.05;
    const twistNode = (props: StandingChildProps) => {
      const jj = standingChildJoints({ ...props, layerFar: undefined });
      if (!jj.twist) return null;
      const d = { x: jj.twist.mouth.x - jj.twist.grip.x, y: jj.twist.mouth.y - jj.twist.grip.y };
      const rot = (Math.atan2(d.x, -d.y) * 180) / Math.PI;
      const given = GIVES.filter((k) => f >= k.start + GIVE_T.pick).length;
      return <PaperTwist x={jj.twist.grip.x} y={jj.twist.grip.y} s={B8_S / 0.56} rot={rot} fill={0.9 - 0.14 * given} seed={3} />;
    };
    const bp = s8Balak(f, lifeF, twistNode);
    const j = standingChildJoints(bp);
    const lozS = (1.8 * B8_S) / 0.56; // marble-lozenges: big round sweets, readable in the medium wide
    const recs = [REC.b, REC.d, REC.e, REC.c];
    const order = [
      { A: eaterA, key: "ea" },
      { A: eaterC, key: "ec" },
      ...recs.map((r, i) => ({ A: r.A, key: `r${i}` })),
    ].sort((a, b) => a.A.place(f).y - b.A.place(f).y);
    const recOf = (key: string) => (key.startsWith("r") ? recs[Number(key.slice(1))] : null);
    const boy = (o: { A: Actor; key: string }) => {
      const r = recOf(o.key);
      return (
        <React.Fragment key={o.key}>
          {fig(o.A, f, r ? { reachAt: r.palm, mouth: (fr) => (fr >= r.eatAt + 10 ? mouthWiggle(fr, 0.06) : MOUTH_REST), ...(r === REC.c ? { acting: (fr: number) => ({ ...r.A.acting(fr), ...culprit8Keys(fr) }) } : {}) } : { mouth: (fr) => mouthWiggle(fr, 0.06) })}
          {r && f >= r.give + GIVE_T.release && f <= r.eatAt + 1 && <Lozenge x={r.palm(f).x} y={r.palm(f).y - 3} s={lozS} color={r.col} />}
        </React.Fragment>
      );
    };
    sellerNode = seller(light, f, lifeF, true);
    floor = (
      <>
        <LozengeJar x={JAR.x} y={JAR.y} s={JAR.s} lidOpen={1 - track(f, [[CUT.crowd + 30, 0], [CUT.crowd + 40, 1, io]])} fill={0.72} seed={2} />
        <TwoAnnas x={COIN_SPOT.x} y={COIN_SPOT.y} s={B8_S / 0.56} arrangement="pair" />
        {order.filter((o) => o.A.place(f).y < B8.y).map(boy)}
        <StandingGlow props={bp} lifeF={lifeF} />
        <StandingChild {...bp} />
        {j.give?.inHand && j.give.lozenge && <Lozenge x={j.give.lozenge.x} y={j.give.lozenge.y} s={lozS} color={recs[Math.max(0, j.give.index)]?.col ?? "red"} />}
        {order.filter((o) => o.A.place(f).y >= B8.y).map(boy)}
      </>
    );
  } else {
    // G2 (P3): the afterglow on the fallen log at sunset, on its own real clock pc
    const pc = lifeF - P3_REAL;
    const beat = track(pc, [
      [G2T.glow, 0],
      [G2T.glowTo, 1, io],
    ]);
    logOn = true;
    const kidH = (c: CastEntry) => figH(c) * LOG_K * 0.62;
    logShadows = [...G2_KIDS.map((k) => ({ x: k.x, h: kidH(k.c) })), { x: G2_BALAK.x, h: 175 * LOG_K }];
    const bp = g2Balak(pc, lifeF);
    floor = (
      <>
        {G2_KIDS.filter((k) => k.x < G2_BALAK.x).map((k) => (
          <Puppet key={k.c.id} cast={k.c} f={pc} lifeF={lifeF} x={k.x} y={LOG.y} scale={LOG_K} seated flip={k.flip} light={light} acting={g2KidActing(k)} mouth={g2KidMouth(k)} />
        ))}
        <SeatedGlow props={bp} lifeF={lifeF} beat={beat} boost={beat} />
        <SeatedChild {...bp} />
        {G2_KIDS.filter((k) => k.x > G2_BALAK.x).map((k) => (
          <Puppet key={k.c.id} cast={k.c} f={pc} lifeF={lifeF} x={k.x} y={LOG.y} scale={LOG_K} seated flip={k.flip} light={light} acting={g2KidActing(k)} mouth={g2KidMouth(k)} />
        ))}
      </>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
      <Stage cam={cam} background={VILLAGE_BG[time]}>
        <VillageBackdrop view={view} time={time} f={lifeF} cam={cam} mid={mid} far={far} />
        <VillageFloorLayer view={view} time={time} f={lifeF} seller={sellerNode} lozengeJar={false} doorway={doorway} inPocket={inPocket} crossing={crossing} log={logOn} logShadows={logShadows}>
          {floor}
        </VillageFloorLayer>
        <VillageLightLayer view={view} time={time} f={lifeF} />
        {front}
        <VillageForegroundLayer view={view} time={time} f={lifeF} grass={shot !== "l1a" && !shot.startsWith("r1") && shot !== "s3e" && shot !== "jar" && shot !== "t1b"} leaves={shot === "s1" || shot === "w2" || shot === "ag3" || shot === "s4"} />
        <Grade {...villageGrade(time)} />
        {extraGrade > 0 && <div style={{ position: "absolute", inset: 0, background: "#ffb45e", mixBlendMode: "soft-light", opacity: extraGrade * 3 }} />}
      </Stage>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Sound events and music anchors (for Episode06.tsx)                    */
/* ------------------------------------------------------------------ */

/**
 * S02_EVENTS: this scene's one-shots, placed on the action. `f` is a SCENE-LOCAL REAL frame (absolute = scene start +
 * f). `story` is the same moment on the story clock where it has one. `loopFrames` marks a run of footsteps (loop the
 * file for that many frames). Volumes follow AUD-02 (one-shots 0.15 to 0.45; the far ball game lower, it is far off).
 */
export interface S02Event {
  id: string;
  f: number;
  story?: number;
  file: string;
  volume: number;
  loopFrames?: number;
}
const ev = (id: string, story: number, file: string, volume: number, loopFrames?: number): S02Event => ({ id, f: real(story), story, file, volume, loopFrames });
/** An event at a REAL scene-local frame (life clock: animals, the kite, the pause sequences T1, D2, R1, G2). */
const evR = (id: string, f: number, file: string, volume: number, loopFrames?: number): S02Event => ({ id, f, file, volume, loopFrames });
const thumpsIn = (fromReal: number, toReal: number, tag: string) =>
  gameThumps(fromReal, toReal).map((lf, i): S02Event => ({ id: `ball_thump_${tag}_${i + 1}`, f: lf, file: "sfx/ep06/ball_thump", volume: 0.12 }));
/** The kolshi woman's steps while she is in a field shot (W2, shot 1, shot 2), very soft (far off). */
const KOLSHI_STEP_EVENTS = KOLSHI_STEPS.filter((lf) => lf >= 0 && lf < real(CUT.shirt)).map((lf, i) => evR(`kolshi_step_${i + 1}`, lf, "sfx/ep02/footsteps_mud", 0.06));

export const S02_EVENTS: S02Event[] = [
  // W2: the kite's tugs (a paper flutter), the goat's bleats; the ball game beyond in every field shot
  ...KITE_TUGS.filter((t) => t < real(CUT.shirt)).map((t, i) => evR(`kite_tug_${i + 1}`, t, "sfx/ep02/paper_rustle", 0.12)),
  ...GOAT_BLEATS.map((t, i) => evR(`goat_bleat_${i + 1}`, t + 5, "sfx/ep06/goat_bleat", i === 0 ? 0.22 : 0.16)),
  ...KOLSHI_STEP_EVENTS,
  ...thumpsIn(0, real(CUT.wide), "s1"),
  ...thumpsIn(real(CUT.wide), T1_REAL, "s2"),
  ...thumpsIn(real(CUT.two), P2_REAL + P2.frames, "s4"),
  ...thumpsIn(real(CUT.ag3), real(CUT.court), "ag3"),
  // shot 1: the stitched ball changes hands
  ev("ball_handed", TB + 16, "sfx/ep02/cloth_rustle", 0.15),
  // shot 2: the boys drop their things on the gamchha, running feet, Balak sorting
  ev("top_drop", DROP.top + FALL, "sfx/ep02/clay_thud", 0.15),
  ev("coins_drop", DROP.coins + FALL - 1, "sfx/ep06/coins_palm", 0.24),
  ev("marbles_drop", DROP.marbles + FALL - 22, "sfx/ep06/marbles_click", 0.28),
  ev("shirt_drop", DROP.shirt + FALL - 2, "sfx/ep02/cloth_rustle", 0.18),
  ...Object.values(D2).map((d, i) => ev(`boy_run_${i + 1}`, d.drop + 16, "sfx/ep02/footsteps_mud", 0.2, 30)),
  ...STEPS.map((_, i) => ev(`treasurer_set_${i + 1}`, TS + i * TREASURER_T.cycle + TREASURER_T.release, i === 1 ? "sfx/ep06/coins_palm" : "sfx/ep06/marbles_click", 0.15)),
  // T1: C's top set down after his kiss; the cracked marble set apart; the pats
  evR("t1_top_set", T1_REAL + T1_PART[1] - 2, "sfx/ep02/clay_thud", 0.15),
  evR("t1_marble_set", T1_REAL + T1B_START + TREASURER_T.release, "sfx/ep06/marbles_click", 0.15),
  // D1 and shot 3: the bark, his jump, the note out of the pocket
  ev("dog_bark", D1.bark, "sfx/ep06/dog_bark", 0.3),
  ev("culprit_jump", D1.jump, "sfx/ep02/cloth_rustle", 0.15),
  ev("note_out", S3.pullFrom + 2, "sfx/ep02/paper_rustle", 0.2),
  // shot 4: the note pressed into his hands; the friend runs off; D2: the breeze, his hands close round it
  ev("note_given", TN + 16, "sfx/ep02/paper_rustle", 0.18),
  evR("friend_runs", RUN_OFF + T1.frames, "sfx/ep02/footsteps_mud", 0.24, 16),
  evR("d2_breeze", DLM.breeze + T1.frames, "sfx/ep02/wind_soft", 0.15),
  evR("note_fold", NOTE_FOLD + T1.frames, "sfx/ep02/paper_rustle", 0.15),
  // L1: his quick steps along the lane, the duck behind the haystack, the culprit's running steps far ahead
  // L1 shares its first story frame with P2, so real(L1.fromStory) is P2's start: start the steps after P2.
  evR("l1_steps", P2_REAL + P2.frames, "sfx/ep02/footsteps_mud", 0.18, L1_B - L1.fromStory),
  ev("haystack_duck", L1_B, "sfx/ep02/cloth_rustle", 0.2),
  ev("culprit_far_run", L1_CROSS.start, "sfx/ep02/footsteps_mud", 0.12, L1_CROSS.dur),
  // shot 5: the note into the boudi's hand
  ev("note_to_boudi", S5.take, "sfx/ep02/paper_rustle", 0.18),
  // AG3: the gang's feet, the stamp, the friend stalking off
  ev("gang_arrive", AG3.fromStory - 4, "sfx/ep02/footsteps_mud", 0.22, 18),
  ev("friend_stamp", AG.stamp + STAMP.hit, "sfx/ep02/clay_thud", 0.3),
  ev("friend_stalks_off", AG.off + 2, "sfx/ep02/footsteps_mud", 0.24, Math.max(4, CUT.court - AG.off - 2)),
  // shot 6: the boudi's steps down, the two annas into his palm
  ev("boudi_steps", H6.down, "sfx/ep02/footsteps_floor", 0.18, 16),
  ev("coins_in_palm", H6.coins - 1, "sfx/ep06/coins_palm", 0.32),
  // M1 and shot 7: the jar lid (seen in the jar close-up), the coins on the counter, the lozenges, the twist
  ev("jar_lid_up", S7.lid + 1, "sfx/ep06/jar_lid_up", 0.24),
  ev("coins_on_counter", S7.coinsDown, "sfx/ep06/coins_palm", 0.22),
  ev("lozenges_pour", S7.pour + 2, "sfx/ep06/marbles_click", 0.16),
  ev("paper_twist", S7.pick, "sfx/ep02/paper_rustle", 0.2),
  // shot 8: the lid down, a lozenge into each palm
  ev("jar_lid_down", CUT.crowd + 38, "sfx/ep06/jar_lid_down", 0.2),
  ...GIVES.map((k, i) => ev(`lozenge_give_${i + 1}`, k.start + GIVE_T.release, "sfx/ep02/paper_rustle", 0.12)),
  // G2 (P3): the culprit's nudges, the glow beat
  evR("g2_nudge_1", P3_REAL + G2T.nudge1, "sfx/ep02/cloth_rustle", 0.12),
  evR("g2_nudge_2", P3_REAL + G2T.nudge2, "sfx/ep02/cloth_rustle", 0.12),
  evR("glow_shimmer", P3_REAL + G2T.glow, "sfx/soft_magical_shimmer", 0.12),
];

/** Music anchors (Ep06_Music_Cue_Sheet.md: S02.<name>) and other times, as SCENE-LOCAL REAL frames. */
export const S02_TIMES = {
  /** shot 1: the giver holds out the badly stitched ball (the smirks start) */
  ballGiven: real(K.khela + 2),
  /** shot 1: he takes it in both hands, delighted (the giver lets go) */
  ballTaken: real(TB + 18),
  /** D1: the dog's off-screen bark, and the culprit's jump 2 f later */
  dogBark: real(D1.bark),
  culpritJump: real(D1.jump),
  /** shot 3: the note slides out of the pocket */
  noteOut: real(S3.pullFrom + 4),
  /** shot 3: he glances over his shoulder */
  glanceBack: real(S3.glance),
  /** L1 b: the cut to the haystack: he is ducked behind it */
  haystackDuck: real(L1_B),
  /** shot 5: Balak's one glance back (চুপিচুপি) */
  glanceBack2: real(S5.glance),
  /** AG3 a: his hand lands on his head */
  handOnHead: real(AG.head + 6),
  /** AG3 b: the friend's foot lands */
  friendStamp: real(AG.stamp + STAMP.hit),
  /** shot 6: the two annas land in his palm */
  coinsInPalm: real(H6.coins),
  /** R1: the culprit's close-up (his face flushes, eyes on his feet) */
  r1_culprit: R1_REAL + R1_PART[2],
  /** M1: the cut to the lozenge jar glinting */
  jarCut: real(CUT.stall),
  t1Start: T1_REAL,
  p2Start: P2_REAL,
  r1Start: R1_REAL,
  p3Start: P3_REAL,
  /** G2 (P3): the glow beat's rise (key beat 2) */
  glow2: P3_REAL + G2T.glow,
  glowBeat: P3_REAL + G2T.glow,
  durationFrames: DUR,
};
