import React from "react";
import { clamp, flicker, hash, lerp, makeActing, noise1, PoseKey, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { BabyThakur, DivineAura, DivineDefs } from "../../cinematic/divine/Divine";
import { Garland, Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { CAST, CastEntry } from "../../cinematic/rig/cast";
import { Hand } from "../../cinematic/rig/Hand";
import { BASE_POSE, CastMember, Pose, PropRenderer, Puppet, puppetBreath, SceneLight, SceneLights } from "../../cinematic/rig/Puppet";
import { MouthState } from "../../cinematic/rig/lipsync";
import { CourtyardBack, CourtyardFloor, HurricaneLantern, TulsiMancha } from "../../cinematic/sets/Interiors";
import { BaidikBariDay } from "../../cinematic/sets/S01_DaySets";
import { Rain, Splashes } from "../../cinematic/sets/S05_Sets";
import { cueLocalStory, pausesFor, storyToReal, useStory } from "../../episode/storyClock";
import { BullockCart, SEAT_Y } from "../rig/BullockCart";
import { EP02_SCENES } from "../timing";

/**
 * Episode 2 · scene 01e_father_letter: "The Father's News" (approved plan, STO-15 / STO-16, CAM-13, CAM-14:
 * `03_Episodes/Episode_02_Shashthi_and_GoShaap/01_Script_and_Storyboard/Ep02_Shots_and_Pauses_DRAFT.md`,
 * "01e_father_letter: the news lands, the farewell").
 *
 * A grey rainy DAY at the Baidik Bari (the Vedic house, BaidikBariDay), drizzle at the farewell. Every camera key
 * and cut is tied to a narration cue (cueLocalStory) or to one of the scene's three pauses (EP02_PAUSES), never to
 * a hard-coded frame. Clocks: `f` is the story clock (holds in a pause), `lifeF` the real local frame (breathing,
 * blinks, rain). Hard cuts, one set of figures per frame. Shots:
 *  1  OPEN pause + "অন্নপ্রাশনের আগেই বাবা": medium two-shot at the main door, held. Surendra in the doorway looks
 *     out at the rain, the lantern flickers beside the door; the dak-peon's umbrella appears at the edge, he
 *     arrives, furls it, greets him with a namaskar and draws the envelope from his satchel.
 *  3  "সুরেন্দ্রচন্দ্রের নতুন চাকরির খবর এল—": ONE slow push in (x1.4 of the two-shot) starting on the line; the
 *     peon presents the letter with both hands and Surendra takes it on "খবর", opens it and reads.
 *  4a NEWS pause, first second: same frame, held. His face lifts with quiet joy, he raises the letter toward the
 *     light; behind him, soft, the peon bows and leaves under his umbrella.
 *  4b NEWS pause, last two seconds: CUT (he turns and calls inside) to a medium wide of the doorway. Charu, Balak in
 *     her arms, and Thakurma come to the door: surprise, then joy; Charu glances back into the house (a touch of
 *     sadness at leaving); Balak looks at his father, calm.
 *  5  "সবাইকে নিয়ে তিনি চলে গেলেন উজানচর": CUT to the wide of the house front; one slow pan follows the family out
 *     of the main door, down the steps and along the path toward the gate (the father with umbrella and bundle,
 *     Charu carrying Balak, Thakurma with a basket); a woman waves from the door, an elder bows on the veranda.
 *  6  "কৃষ্ণনগরে।" + FAREWELL pause: CUT to a medium wide at the boundary gate, held. The family walks up and stops;
 *     two elders at the gate raise their hands in blessing (nobody but Charu touches Balak). In the pause the
 *     blessing finishes, Charu turns for a last look back at the house with wet eyes, and the rain eases.
 *  8  CUT to the rear wide, held (no pull-back): the family as silhouettes through the gate to the waiting cart,
 *     climbing on. Episode02.tsx cross-dissolves into the journey (EP02_DISSOLVES) over the scene's last 40
 *     frames; this scene keeps its content running to its last frame (no fade of its own).
 * Charu holds Balak in a cradle hold in every shot: her arms are solved onto him every frame, with the rig's own
 * breathing (puppetBreath), so both hands stay on him (never float). The white-gold divine light is Balak's alone.
 */

const SCENE_ID = "01e_father_letter";
/** Real scene length (frames), from the episode timing. */
export const SCENE01E_FRAMES = EP02_SCENES.find((s) => s.sceneId === SCENE_ID)?.durationFrames ?? 472;
/** The scene's pauses (sorted by atStory) and the real local frame where a story frame plays. */
const PAUSES = pausesFor(SCENE_ID);
const R = (story: number) => storyToReal(story, PAUSES);
/** A narration phrase's window in story frames (fallbacks: today's timing). */
const cueOf = (snippet: string, from: number, to: number) => cueLocalStory(snippet, SCENE_ID) ?? { from, to };
const L3 = cueOf("সুরেন্দ্রচন্দ্রের", 74, 160);
const L5 = cueOf("সবাইকে", 160, 249);
const L6 = cueOf("কৃষ্ণনগরে", 249, 275);
/** The inner pause nearest a story frame (the news pause follows line 3, the farewell pause follows line 6). */
const pauseNear = (story: number, frames: number): { atStory: number; frames: number } =>
  PAUSES.filter((p) => p.atStory > 0).reduce<{ atStory: number; frames: number } | undefined>(
    (best, p) => (!best || Math.abs(p.atStory - story) < Math.abs(best.atStory - story) ? p : best),
    undefined,
  ) ?? { atStory: story, frames };
const NEWS_P = pauseNear(L3.to, 72);
const FAREWELL_P = pauseNear(L6.to, 48);

/*
 * Shot boundaries and beats in REAL local frames (cue story frames converted with R). Shots 1 to 4b run on the
 * real clock: the open pause sits at the very start, so the voice keeps a constant offset there, and the
 * news-pause actions are the approved pause moment. Shot 5 and the rear shot run on the story clock; shot 6 holds
 * through the farewell pause on the real clock.
 */
/** "খবর" inside line 3 (in 01b_Narrator_Rain_p2 the word starts about 72% into the phrase). */
const H_TAKE = R(Math.round(L3.from + 0.72 * (L3.to - L3.from)));
const H_PUSH = R(L3.from);
const NEWS0 = R(NEWS_P.atStory);
const NEWS1 = NEWS0 + NEWS_P.frames;
/** 4a holds the close frame for the first third of the news pause (1 s of 3 s), then the cut to the doorway. */
const CUT_CALL = NEWS0 + Math.round(NEWS_P.frames / 3);
const CUT_HOUSE = Math.max(NEWS1, R(L5.from));
const CUT_GATE = R(L6.from);
const FAREWELL0 = R(FAREWELL_P.atStory);
const FAREWELL1 = FAREWELL0 + FAREWELL_P.frames;
const CUT_REAR = FAREWELL1;

/* ------------------------------------------------------------------ */
/* Cast: the father (new adult male) and Thakurma (the grandmother)              */
/* ------------------------------------------------------------------ */

export const SURENDRA: CastMember = {
  id: "surendra",
  age: "adult",
  sex: "m",
  height: 1.0,
  girth: 0.95,
  skin: "#c98f63",
  skinLight: "#e8b48a",
  skinShade: "#a86d46",
  lips: "#9c5a4e",
  hair: "#1a1210",
  hairLight: "#4e3a2e",
  hairStyle: "parted",
  outfit: "kurta",
  top: "#fbf8f0",
  topLight: "#ffffff",
  topShade: "#d4cab6",
  sleeve: "full",
  lower: "dhoti",
  lowerColor: "#f7f3e8",
  lowerShade: "#d2c7b0",
  dhotiLength: "calf",
  scarf: { color: "#7a5230", shade: "#5a3a20", trim: "#c99a5a", style: "shawl" },
  seed: 47,
};

/** Thakurma, the grandmother: an elderly woman in a white saree with a light shawl (defined here only). */
export const THAKURMA: CastMember = {
  id: "thakurma",
  age: "elder",
  sex: "f",
  height: 0.95,
  girth: 1.05,
  skin: "#b07a52",
  skinLight: "#cc9468",
  skinShade: "#84573a",
  lips: "#8a4f43",
  hair: "#e4e0d8",
  hairLight: "#f6f3ec",
  hairStyle: "veil",
  outfit: "blouse",
  top: "#f3efe6",
  topLight: "#ffffff",
  topShade: "#cfc6b2",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#fbf8f1",
  lowerShade: "#d9d0bc",
  scarf: { color: "#ece6d8", shade: "#bfb59f", trim: "#d8cdb4", style: "shawl" },
  seed: 131,
};

/**
 * The dak-peon (postal messenger) who brings the letter, defined only for this scene: a middle-aged man in a
 * khaki short kurta with half sleeves, a knee-length off-white dhoti, bare feet and an off-white cloth turban
 * (hairStyle "wrap" with no scarf, so the rig wraps it in its plain off-white cloth). His cloth satchel and
 * its strap are drawn over him by PeonSatchel; his umbrella is P_PEON_UMBRELLA.
 */
export const DAK_PEON: CastEntry = {
  id: "dakpeon",
  age: "adult",
  sex: "m",
  height: 0.96,
  girth: 0.92,
  skin: "#a8724a",
  skinLight: "#c99062",
  skinShade: "#7e5234",
  lips: "#84483c",
  hair: "#16100c",
  hairLight: "#3a2a20",
  hairStyle: "wrap",
  outfit: "kurta",
  top: "#b49e6e",
  topLight: "#cfbb8c",
  topShade: "#8c7a52",
  sleeve: "half",
  lower: "dhoti",
  lowerColor: "#eee6d2",
  lowerShade: "#c8bc9e",
  dhotiLength: "knee",
  look: { lashes: 0.2, kajal: 0, browWeight: 1.2, lipTint: "#8a4a40", mustache: 0.8, ageLines: 0.3, hairGrey: 0.12 },
  seed: 89,
};

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

/**
 * Letter, held in both of the father's hands in front of his chest. Written lines in a Bengali-style hand
 * (a headline bar with small strokes hanging from it), a fold crease and a signature, so it reads as a
 * letter in the close framing.
 *
 * It is carried by the far (left) hand: the prop origin sits at that hand's fingers, and the sheet is
 * drawn upright (the forearm's rotation is undone with worldRot), extending from that hand toward the
 * near hand, which is solved onto its other edge (fatherLetterArms). The far thumb is drawn over the
 * sheet's edge; the near hand is drawn after the prop, so it lies over the sheet. As he tucks it away
 * (LETTER_TUCK0 to LETTER_AWAY) the sheet folds up toward the far hand.
 */
const LETTER_LINES: Array<[number, number]> = [[-12, 22], [-3, 18], [6, 22], [15, 10]];
/** Sheet size in rig units, and its centre relative to the far hand's prop origin (upright frame). */
const LETTER_W = 60;
const LETTER_H = 44;
const LETTER_DY = 4;
/** 0 = open sheet, 1 = folded small (tucked away). */
const letterFold = (f: number) => smooth((f - LETTER_TUCK0) / (LETTER_AWAY - LETTER_TUCK0));
/** The letter sheet itself, centred on the origin (rig units), squeezed to kw x kh of its size as it folds. */
const LetterSheet: React.FC<{ kw: number; kh: number }> = ({ kw, kh }) => (
  <g transform={`rotate(-4) scale(${(LETTER_W / 62) * kw}, ${(LETTER_H / 46) * kh})`}>
    <rect x={-31} y={-23} width={62} height={46} fill="#e2d6b8" />
    <rect x={-30} y={-22} width={60} height={44} fill="#f6eed8" />
    <line x1={0} y1={-22} x2={0} y2={22} stroke="#c9b892" strokeWidth={1} opacity={0.7} />
    {LETTER_LINES.map(([y, w], i) => (
      <g key={i} stroke="#4a2e16" fill="none" opacity={0.78}>
        <line x1={-23} y1={y} x2={-23 + w * 2} y2={y} strokeWidth={1.6} />
        {Array.from({ length: Math.floor(w / 4) }, (_, j) => (
          <path key={j} d={`M ${-21 + j * 8} ${y} q ${1.5 + hash(i * 7 + j) * 2} 3 ${-1 + hash(i * 3 + j) * 3} 5`} strokeWidth={1.2} />
        ))}
      </g>
    ))}
    <path d="M 10 18 q 4 -4 8 0 q 3 3 6 -1" stroke="#4a2e16" strokeWidth={1.2} fill="none" opacity={0.7} />
  </g>
);
/** The father's far thumb, closing over the sheet's left edge (drawn at the far hand's prop origin). */
const FarThumb: React.FC = () => (
  <path d="M -1 -10 Q 4 -11 5 -4 Q 5 3 1 5 Q -3 4 -3 -3 Q -3 -9 -1 -10 Z" fill={SURENDRA.skin} stroke={SURENDRA.skinShade} strokeWidth={0.8} />
);
const P_LETTER: PropRenderer = ({ f, worldRot }) => {
  const fold = letterFold(f);
  const kw = 1 - 0.4 * fold;
  const kh = 1 - 0.65 * fold;
  return (
    <g transform={`rotate(${-worldRot})`}>
      <g transform={`translate(${(LETTER_W / 2) * kw}, ${LETTER_DY})`}>
        <LetterSheet kw={kw} kh={kh} />
      </g>
      <FarThumb />
    </g>
  );
};

/* Right arm holding the umbrella. Puppet units, adult rig: upper arm 56, forearm 52, hand 37. */
const UPPER_ARM = 56;
/** Elbow to grip: the forearm pivot sits at 50 and the handle is held 0.62 hand-lengths down the hand. */
const ELBOW_TO_GRIP = 50 + 0.62 * 37;
/** Canopy lean back over the head (deg), chosen so the canopy centre sits slightly forward of the head. */
const UMB_TILT = 10.5;

/**
 * Two-bone solve for the right arm (side +1): shoulder and elbow angles in degrees that put the
 * grip at (dx, dy) from the shoulder. The elbow hangs below the shoulder-to-grip line, so the
 * forearm rises up to the handle instead of pointing out like a stick.
 */
const solveRightArm = (dx: number, dy: number) => {
  const d = Math.hypot(dx, dy);
  const toGrip = Math.atan2(dx, dy);
  const cosA = clamp((UPPER_ARM * UPPER_ARM + d * d - ELBOW_TO_GRIP * ELBOW_TO_GRIP) / (2 * UPPER_ARM * d), -1, 1);
  const S = toGrip - Math.acos(cosA);
  const ex = UPPER_ARM * Math.sin(S);
  const ey = UPPER_ARM * Math.cos(S);
  const forearm = Math.atan2(dx - ex, dy - ey);
  const E = Math.atan2(Math.sin(forearm - S), Math.cos(forearm - S));
  return { S: (S * 180) / Math.PI, E: (E * 180) / Math.PI };
};

/** Grip 26 forward and 27 up from the shoulder: the handle sits at head height, elbow low. */
const UMB_ARM = solveRightArm(26, -27);

/**
 * Umbrella: the handle is gripped at the hand, the shaft runs up and leans back over the head,
 * and the canopy sits above. The prop counter-rotates the forearm so the shaft keeps its own
 * tilt; the wind adds a slow drift and a faster flutter (noise, not a fixed loop). `sway` adds a
 * step-driven rock (degrees) on top, for the side walk.
 */
const makeUmbrella =
  (skin: string, shade: string, sway: (f: number) => number = () => 0): PropRenderer =>
  ({ f, worldRot, scale }) => {
    const tilt = UMB_TILT + 2.4 * noise1(f * 0.04, 3) + 1.0 * noise1(f * 0.13, 8) + sway(f);
    return (
      <g transform={`scale(${scale})`}>
        <g transform={`rotate(${-(worldRot + tilt)})`}>
          <line x1={0} y1={14} x2={0} y2={-150} stroke="#3a2412" strokeWidth={6} strokeLinecap="round" />
          <path d="M -165 -118 Q -150 -228 0 -236 Q 150 -228 165 -118 Q 82 -100 0 -116 Q -82 -100 -165 -118 Z" fill="#5a3e28" />
          <path d="M 0 -236 Q 40 -228 80 -150 Q 30 -158 0 -170 Z" fill="#7a5638" opacity={0.7} />
          {[-120, -60, 0, 60, 120].map((x) => (
            <line key={x} x1={0} y1={-200} x2={x} y2={-114} stroke="#2a1a0e" strokeWidth={2} opacity={0.5} />
          ))}
        </g>
        {/* fingers close over the handle, in front of the shaft (hand frame, not tilted) */}
        <path d="M -10 -6 Q 0 -10 10 -6 Q 12 3 8 9 Q 0 12 -8 9 Q -12 3 -10 -6 Z" fill={skin} stroke={shade} strokeWidth={1} opacity={0.95} />
      </g>
    );
  };

const P_UMBRELLA: PropRenderer = makeUmbrella(SURENDRA.skin, SURENDRA.skinShade);
/** Side-walk umbrella: rocks a little with each of the father's steps (defined after the gait helpers). */
const P_UMBRELLA_WALK: PropRenderer = (ctx) => makeUmbrella(SURENDRA.skin, SURENDRA.skinShade, umbrellaSway)(ctx);

/** The father's cloth bundle (potli), hanging from his left hand by its knot (kept upright as the arm swings). */
const P_BUNDLE: PropRenderer = ({ worldRot, scale }) => (
  <g transform={`rotate(${-worldRot}) scale(${scale * 0.85})`}>
    <path d="M -5 -2 Q 0 -14 7 -3" stroke="#6a3a1e" strokeWidth={4} fill="none" />
    <path d="M -9 2 Q -13 8 -6 12 L 6 12 Q 13 8 9 2 Z" fill="#8a4a2e" />
    <path d="M -32 16 Q -42 58 0 64 Q 42 58 32 16 Q 16 8 0 10 Q -16 8 -32 16 Z" fill="#9a5a3a" />
    <path d="M -28 32 Q 0 42 28 32" stroke="#5a3218" strokeWidth={3} fill="none" opacity={0.5} />
    <path d="M -20 22 l 6 8 M 4 24 l 6 8 M -8 46 l 6 8 M 14 44 l 5 7" stroke="#e6b84c" strokeWidth={2} opacity={0.55} />
  </g>
);

/** Thakurma's wicker basket, held by its handle (kept upright), with a cloth and fruit for the journey. */
const P_BASKET: PropRenderer = ({ worldRot, scale }) => (
  <g transform={`rotate(${-worldRot}) scale(${scale * 0.8})`}>
    <path d="M -28 30 Q -30 -8 0 -8 Q 30 -8 28 30" stroke="#8a5a26" strokeWidth={5} fill="none" />
    <path d="M -10 22 Q 0 4 12 22 Z" fill="#d8b04a" />
    <ellipse cx={-14} cy={24} rx={10} ry={8} fill="#c8442a" />
    <path d="M -36 26 Q 0 18 36 26 L 34 32 Q 0 26 -34 32 Z" fill="#ece6d8" />
    <path d="M -40 30 L 40 30 L 31 72 Q 0 80 -31 72 Z" fill="#b8843e" />
    {[40, 50, 60].map((y) => (
      <path key={y} d={`M ${-38 + (y - 30) * 0.2} ${y} Q 0 ${y + 5} ${38 - (y - 30) * 0.2} ${y}`} stroke="#7a5022" strokeWidth={2} fill="none" opacity={0.7} />
    ))}
    {[-24, -8, 8, 24].map((x) => (
      <line key={x} x1={x} y1={31} x2={x * 0.8} y2={74} stroke="#8a5e2a" strokeWidth={1.6} opacity={0.6} />
    ))}
    <ellipse cx={0} cy={30} rx={40} ry={5} fill="#d8a85a" />
  </g>
);

/** Brass pot (ghoti / kalash style). Centre at origin. */
const BrassPot: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={48} rx={44} ry={9} fill="#7a4e14" />
    <path d="M -46 -10 Q -52 40 0 46 Q 52 40 46 -10 Z" fill="#c9932e" />
    <path d="M -22 -40 Q -18 -62 0 -66 Q 18 -62 22 -40 Z" fill="#e6b84c" />
    <rect x={-24} y={-48} width={48} height={12} rx={5} fill="#b07c22" />
    <path d="M -36 -4 Q -38 22 -18 36" stroke="#f0cf7a" strokeWidth={5} fill="none" opacity={0.55} strokeLinecap="round" />
  </g>
);

/** Folded child's blanket, red with a gold border. */
const P_BLANKET: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale * 0.7}) rotate(-8)`}>
    <rect x={-70} y={-40} width={140} height={80} rx={6} fill="#b8442a" />
    <rect x={-62} y={-32} width={124} height={64} rx={4} fill="none" stroke="#e6b84c" strokeWidth={5} />
    {[-30, 0, 30].map((x) => (
      <line key={x} x1={x} y1={-32} x2={x} y2={32} stroke="#8a2a1c" strokeWidth={3} opacity={0.5} />
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* Set pieces                                                          */
/* ------------------------------------------------------------------ */

/** Cloth bundle tied with a knot. */
const Bundle: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = "#9a5a3a" }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={72} ry={46} fill={c} />
    <ellipse cx={0} cy={18} rx={66} ry={24} fill="#000" opacity={0.18} />
    <path d="M -62 -8 Q 0 -26 62 -8" stroke="#4a2814" strokeWidth={6} fill="none" opacity={0.45} />
    <path d="M 58 -34 Q 78 -58 92 -40 Q 74 -30 62 -22 Z" fill={c} />
  </g>
);

/** Rough interior wall with plaster marks and a dado band. */
const RoomWall: React.FC<{ id: string; lampX: number; lampY: number; dark?: number }> = ({ id, lampX, lampY, dark = 0 }) => (
  <g>
    <defs>
      <radialGradient id={id} cx={lampX / 1920} cy={lampY / 1080} r="0.95">
        <stop offset="0%" stopColor="#c99a62" />
        <stop offset="40%" stopColor="#8a5e3a" />
        <stop offset="80%" stopColor="#3e2818" />
        <stop offset="100%" stopColor="#1c120a" />
      </radialGradient>
    </defs>
    <rect x={-400} y={-300} width={2720} height={1300} fill={`url(#${id})`} />
    <rect x={-400} y={-300} width={2720} height={1300} fill="#0b0816" opacity={dark} />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <ellipse key={i} cx={-100 + i * 380} cy={180 + (i % 3) * 110} rx={70 + (i % 2) * 40} ry={26} fill="#3a2214" opacity={0.12} />
    ))}
    <rect x={-400} y={700} width={2720} height={260} fill="#4a2e1e" opacity={0.3} />
  </g>
);

const RoomFloor: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="ep2e-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a3a24" />
        <stop offset="100%" stopColor="#24160c" />
      </linearGradient>
    </defs>
    <rect x={-400} y={960} width={2720} height={260} fill="url(#ep2e-floor)" />
    <rect x={-400} y={958} width={2720} height={4} fill="#2a1a0e" opacity={0.6} />
  </g>
);

/**
 * Grey rainy-day sky: a flat overcast, a little darker overhead and paler toward the horizon, with slow drifting
 * bands of heavier rain cloud (`f` drifts them; optional `clear` 0..1 thins them as the rain eases).
 */
const RainySky: React.FC<{ id: string; f?: number; clear?: number }> = ({ id, f = 0, clear = 0 }) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6f7987" />
        <stop offset="55%" stopColor="#8d97a3" />
        <stop offset="100%" stopColor="#b3bac2" />
      </linearGradient>
    </defs>
    <rect x={-400} y={-400} width={2720} height={1200} fill={`url(#${id})`} />
    {[0, 1, 2, 3].map((i) => (
      <ellipse key={i} cx={160 + i * 540 + 0.15 * f} cy={90 + (i % 2) * 70} rx={460} ry={70} fill="#5e6876" opacity={0.45 * (1 - 0.5 * clear)} />
    ))}
    {[0, 1, 2].map((i) => (
      <ellipse key={`l${i}`} cx={420 + i * 720 + 0.1 * f} cy={320 + (i % 2) * 40} rx={520} ry={46} fill="#7b8592" opacity={0.35 * (1 - 0.5 * clear)} />
    ))}
  </g>
);

/** Palm silhouette on the far bank. Base at (x, y). */
const Palm: React.FC<{ x: number; y: number; s: number; c: string }> = ({ x, y, s, c }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M 0 0 Q 16 -130 4 -250" stroke={c} strokeWidth={12} fill="none" strokeLinecap="round" />
    {[-150, -112, -66, -20, 22, 68, 112, 152].map((a, i) => (
      <path key={i} d="M 4 -250 Q 60 -296 156 -262 Q 88 -282 4 -244 Z" fill={c} transform={`rotate(${a}, 4, -250)`} />
    ))}
  </g>
);

/** Small hut silhouette on the far bank. Base at (x, y). */
const FarHut: React.FC<{ x: number; y: number; s: number; c: string }> = ({ x, y, s, c }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <rect x={-60} y={-90} width={120} height={90} fill={c} />
    <path d="M -78 -88 L 0 -150 L 78 -88 Z" fill={c} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Balak's divine light                                                  */
/* ------------------------------------------------------------------ */

/**
 * Balak Thakur, newborn, held against Charu's chest in a white cloth. The only divine light in
 * the scene: BabyThakur's soft halo and rising motes, kept calm (aura 0.8, low wiggle).
 * The white swaddle is drawn over the body in the baby's own frame, leaving the head free.
 * `limp` stills the limbs (no kicking or waving) while he is being held. `lifeF` keeps his breathing and blinks
 * going in a pause; `lookX` / `lookY` aim his calm gaze (baby frame: + x is toward his feet).
 */
const Swaddled: React.FC<{ f: number; lifeF?: number; x: number; y: number; dx: number; limp?: boolean; aura?: number; lookX?: number; lookY?: number; smile?: number }> = ({
  f,
  lifeF,
  x,
  y,
  dx,
  limp = false,
  aura = 0.8,
  lookX = 0.2,
  lookY = -0.4,
  smile = 0.45,
}) => (
  <g transform={`translate(${x}, ${y}) scale(0.7)`}>
    <BabyThakur
      f={f}
      lifeF={lifeF}
      x={0}
      y={0}
      open={1}
      aura={aura}
      lookX={lookX}
      lookY={lookY}
      turn={0.15}
      smile={smile}
      headRoll={-15}
      rot={-4}
      wiggle={limp ? 0 : 0.25}
      motion={{ dx, dy: 0, drot: 0 }}
    />
    <path
      d="M -18 -30 Q 22 -42 60 -30 Q 84 -10 80 22 Q 62 42 30 38 Q 2 36 -18 30 Q -24 0 -18 -30 Z"
      fill="#fffdf7"
      stroke="#e6dccb"
      strokeWidth={1.4}
    />
    <path d="M -10 -14 Q 20 -6 46 -14" stroke="#e6dccb" strokeWidth={1.4} fill="none" opacity={0.8} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Acting                                                              */
/* ------------------------------------------------------------------ */

/*
 * Two-bone arm solve shared by the father's letter hold and Charu's cradle, in the rig's own angle
 * convention. (vx, vy) is the target from the shoulder root in the figure's upper-body frame, `len` the
 * distance from the elbow to the point of the hand being placed. The solve works in a mirrored frame
 * where +x points away from the body, so S and E come out exactly as Puppet draws them for either side.
 * `pref` picks the elbow: +1 bends it outward, -1 inward, 0 takes the lower of the two.
 */
const R2D = 180 / Math.PI;
const D2R = Math.PI / 180;
type Pt = { x: number; y: number };
const solveArm2 = (side: 1 | -1, ua: number, len: number, vx: number, vy: number, pref: 1 | -1 | 0) => {
  const mx = side * vx;
  const d = clamp(Math.hypot(mx, vy), Math.abs(ua - len) + 1e-3, ua + len - 1e-3);
  const A = Math.acos(clamp((ua * ua + d * d - len * len) / (2 * ua * d), -1, 1));
  const aT = Math.atan2(mx, vy);
  const au = pref === 0 ? (Math.cos(aT - A) >= Math.cos(aT + A) ? aT - A : aT + A) : aT + pref * A;
  const af = Math.atan2(mx - ua * Math.sin(au), vy - ua * Math.cos(au));
  return { S: au * R2D, E: (af - au) * R2D };
};
/** Forward kinematics: the point `d` down the forearm from the elbow, relative to the shoulder root. */
const armPoint = (side: 1 | -1, ua: number, S: number, E: number, d: number): Pt => ({
  x: side * (ua * Math.sin(S * D2R) + d * Math.sin((S + E) * D2R)),
  y: ua * Math.cos(S * D2R) + d * Math.cos((S + E) * D2R),
});

/*
 * The father reads in a 3/4 view turned toward the lamp (bodyTurn -0.6), so his forearms reach forward
 * and the letter sits in front of his chest, held in both hands at chest height with the elbows low at
 * his sides. The arms are solved every frame from hand targets (upper-body frame, y measured from the
 * shoulder root): the far (left) hand carries the letter at its fingers, the near (right) hand holds the
 * sheet's other edge. He lifts it a little toward the lamp as the news lands (50 to 64), then from
 * LETTER_TUCK0 folds it and tucks it into his waist; at LETTER_AWAY it is gone and the arms ease back to
 * the keyed rest by 116, when he has turned to the doorway.
 */
const FATHER_ARM = {
  ua: 56 * SURENDRA.height,
  shX: 47 * SURENDRA.height * (0.85 + 0.15 * SURENDRA.girth) * 0.86,
  /** Elbow to the far hand's prop origin (the letter's edge), and to the near hand's middle. */
  propD: 52 * SURENDRA.height - 2 + 0.62 * 37 * SURENDRA.height,
  gripD: 52 * SURENDRA.height - 2 + 0.5 * 37 * SURENDRA.height,
};
const LETTER_TUCK0 = 90;
const LETTER_AWAY = 104;
const FATHER_READ_TURN = -0.6;
/** Far hand's prop origin: reading, lifted toward the lamp, and at the waist as it is tucked away. */
const LETTER_READ: Pt = { x: -102, y: 24 };
const LETTER_LIFT: Pt = { x: -108, y: 15 };
const LETTER_TUCK: Pt = { x: -72, y: 74 };
/** Near hand's middle relative to the far hand's prop origin: on the sheet's right edge. */
const NEAR_ON_LETTER: Pt = { x: 52, y: 8 };

const fatherLetterArms = (f: number, bodyTurn: number) => {
  const sx = FATHER_ARM.shX * Math.cos(clamp(bodyTurn, -1, 1) * 0.95);
  const lift = smooth((f - 50) / 14);
  const tuck = smooth((f - LETTER_TUCK0) / (LETTER_AWAY - LETTER_TUCK0));
  const read = { x: lerp(LETTER_READ.x, LETTER_LIFT.x, lift), y: lerp(LETTER_READ.y, LETTER_LIFT.y, lift) };
  const T = { x: lerp(read.x, LETTER_TUCK.x, tuck), y: lerp(read.y, LETTER_TUCK.y, tuck) };
  const N = { x: T.x + NEAR_ON_LETTER.x * (1 - 0.4 * letterFold(f)), y: T.y + NEAR_ON_LETTER.y };
  const far = solveArm2(-1, FATHER_ARM.ua, FATHER_ARM.propD, T.x + sx, T.y, 0);
  const near = solveArm2(1, FATHER_ARM.ua, FATHER_ARM.gripD, N.x - sx, N.y, 0);
  return { lS: far.S, lE: far.E, rS: near.S, rE: near.E };
};

const indoorKeys: PoseKey<Pose>[] = [
  // 1. Reads the letter by the lamp, turned toward it, eyes down on the sheet in his hands
  { f: 0, bodyTurn: FATHER_READ_TURN, headTurn: -0.05, headTilt: 4, eyeY: 0.7, eyeX: -0.75, smile: 0.05, brow: 0.35 },
  // holds the letter up to the lamp: motion starts at 52, 7 before cue "news came" (local 59)
  { f: 59, eyeY: 0.6, eyeX: -0.8, brow: 0.5, in: 7 },
  // face lifts with quiet joy, turning a little toward us: motion starts at 52 (cue local 59)
  { f: 66, headTurn: 0.3, headTilt: -4, eyeY: -0.4, eyeX: -0.3, smile: 0.6, brow: 0.8, browTilt: 0.3, tears: 0.15, in: 14 },
  // tucks the letter away (LETTER_TUCK0 to LETTER_AWAY), looking down at it
  { f: 100, headTurn: 0.1, eyeX: -0.5, eyeY: 0.5, in: 10 },
  // 2. turns to the doorway
  { f: 116, bodyTurn: 0.5, headTurn: 0.55, eyeX: 0.7, eyeY: 0, smile: 0.4, brow: 0.4, browTilt: 0, tears: 0, lS: 10, lE: -20, in: 12 },
  { f: 150, bodyTurn: 0.55, headTurn: 0.6, eyeX: 0.8, smile: 0.3, brow: 0.3, rS: 20, rE: -20, in: 30 },
  // ready to step out of the doorway: motion starts at 151 (7 before cue "took everyone away", local 158)
  { f: 158, bodyTurn: 0.35, headTurn: 0.1, eyeX: 0.2, eyeY: -0.1, smile: 0.5, brow: 0.5, in: 7 },
];

const indoorPose = makeActing<Pose>(BASE_POSE, indoorKeys);

/**
 * Lamp-room pose: body stays put. Until LETTER_AWAY both hands hold the letter (solved arms); then the
 * arms ease to the keyed rest over 12 frames.
 */
const indoorActing = (f: number): Partial<Pose> => {
  const p = indoorPose(f);
  const holding = f < LETTER_AWAY;
  const arms = fatherLetterArms(Math.min(f, LETTER_AWAY), FATHER_READ_TURN);
  const w = smooth((f - LETTER_AWAY) / 12);
  return {
    ...p,
    bodyX: 0,
    lS: lerp(arms.lS, p.lS, w),
    lE: lerp(arms.lE, p.lE, w),
    rS: lerp(arms.rS, p.rS, w),
    rE: lerp(arms.rE, p.rE, w),
    lHand: holding ? "hold" : "relaxed",
    rHand: holding ? "hold" : "relaxed",
    lProp: holding ? "letter" : "",
  };
};

/*
 * Gait. The rig steps its legs at a fixed rate (phase = f * GAIT_RATE + cast seed; the right leg
 * is half a cycle behind the left). Each walker's arm swing and body bob are keyed to that
 * walker's own beats, one key per half step, so they stay in time with the legs and ease
 * between keys. Different seeds give each figure its own rhythm.
 */
const GAIT_RATE = 0.3;
const GAIT_SEED = SURENDRA.seed;

/**
 * Gait keys for one walker. `arms` picks the swinging arms: "left" (the right hand is busy),
 * "both" (both free arms swing, mirrored so they move against each other in profile, as in a
 * walk seen from the side), or "none" (Charu's arms hold the newborn, so only the body bob is keyed).
 */
const gaitKeys = (from: number, to: number, swing: number, seed = GAIT_SEED, arms: "none" | "left" | "both" = "left"): PoseKey<Pose>[] => {
  const keys: PoseKey<Pose>[] = [];
  const nFrom = Math.ceil((from * GAIT_RATE + seed) / (Math.PI / 2));
  const nTo = Math.floor((to * GAIT_RATE + seed) / (Math.PI / 2));
  for (let n = nFrom; n <= nTo; n++) {
    const f = Math.round(((n * Math.PI) / 2 - seed) / GAIT_RATE);
    if (n % 2 !== 0) {
      // leg extremes: the arm swings opposite its leg, with a little variation per step
      const side = Math.sin((n * Math.PI) / 2);
      const sw = side * swing * (1 + 0.12 * (2 * hash(n) - 1));
      const k: PoseKey<Pose> = { f, bodyY: 0, in: 9 };
      if (arms !== "none") k.lS = sw;
      if (arms === "both") k.rS = sw;
      keys.push(k);
    } else {
      // legs pass each other: the body is at its highest (about 6 px at scale 1.4)
      keys.push({ f, bodyY: -4.2 * (0.85 + 0.3 * hash(n + 0.5)), in: 6 });
    }
  }
  return keys;
};

/*
 * Timeline (frames): letter handover at the main door 0-101, doorway lift 102-151, departure from the Baidik Bari 152-195, rear walk 196-303
 * (hard cuts between shots), cart turn 240-270, fade 264-303.
 * Departure beats: 152 the father steps out of the main door (Charu in the doorway behind him, Thakurma just
 * inside); 169-181 he goes down the steps; 168-178 the woman at the door raises her hand and waves; 178-190
 * the elder on the veranda bows; 185-193 Charu comes down the steps with Balak; 196 Thakurma is at the top
 * step and the father is walking on along the path toward the gate.
 * Cameras: handover 0-26 tracks the peon to the two-shot, push-in to 60 (see ShotHandover); doorway 110-156
 * push toward Charu's face; departure 152-176 tracks at walking pace, 176-196 eases to a wide frame (door,
 * watchers, steps, path and gate); rear 196-303 slow pull-back. Face close-ups ride on top of these (faceCam):
 * the father 70-101, Charu 104-152, Balak in her arms 152-196 (see "Face close-ups" below).
 */
const WALK0 = 150;
const WALK_SLOW = 214;
const WALK_END = 244;
const CHARU_S = 1.35;
const DOOR_CHARU = { x: 1290, y: 1010 };

const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};

/** Walking speed profile, 0 (standing) to 1 (full pace): eases in at the door, eases out at the cart. */
const speedAt = (g: number) => smooth((g - WALK0) / 24);

/** The rig's own leg phase (Puppet: phase = f * 0.3 + seed). sin(phase) > 0: the left leg is forward. */
const legPhase = (f: number, seed: number) => f * GAIT_RATE + seed;
/** The shoulders follow the hips by 2 frames; the forearm follows the upper arm by another 4. */
const SHOULDER_LAG = 2;
const FOREARM_LAG = 4;

type GaitOpts = {
  seed: number;
  speed: (f: number) => number;
  /** Arm swing amplitudes (deg) for the free arms; 0 keeps the keyed angle (umbrella, cradle). */
  swingL?: number;
  swingR?: number;
  /** Body rise as the legs pass (px, rig units). */
  bob?: number;
  /** Stride scale (shorter steps < 1; the walker's ground speed must scale by the same factor). */
  strideK?: number;
  /** How strongly the forearm trails the upper arm. */
  trail?: number;
};

/**
 * Continuous walk cycle tied to the rig's own leg phase, so arms and bob never drift off the legs.
 * Everything scales with the walk speed, so the walkers start from rest with the body and slow with it:
 * the feet stay planted instead of stepping on the spot or skating.
 *  - Arms swing from the shoulder, opposite their leg, a couple of frames behind the hips.
 *  - The forearm trails: the elbow angle follows the upper arm's swing from 4 frames earlier, so the
 *    hand lags at each reversal and the elbow bends a little more on the forward swing.
 *  - The body rises as the legs pass and settles at each foot strike (a smooth cos^2 curve).
 */
const withGait =
  (act: (f: number) => Pose, o: GaitOpts) =>
  (f: number): Pose => {
    const p = act(f);
    const s = o.speed(f);
    const ph = legPhase(f, o.seed);
    const trail = o.trail ?? 0.45;
    const swing = (g: number, amp: number) => amp * o.speed(g) * Math.sin(legPhase(g - SHOULDER_LAG, o.seed));
    const out: Pose = {
      ...p,
      stride: p.stride * s * (o.strideK ?? 1),
      bodyY: p.bodyY - (o.bob ?? 4.2) * s * Math.cos(ph) * Math.cos(ph),
    };
    if (o.swingL) {
      const S = swing(f, o.swingL);
      const lagged = swing(f - FOREARM_LAG, o.swingL);
      out.lS = p.lS + S;
      // the near (left) arm swings forward with negative S: the elbow softens a little more there
      out.lE = Math.min(-4, p.lE + trail * (lagged - S) - 0.25 * Math.max(0, -S));
    }
    if (o.swingR) {
      const S = swing(f, o.swingR);
      const lagged = swing(f - FOREARM_LAG, o.swingR);
      out.rS = p.rS + S;
      out.rE = Math.min(-4, p.rE + trail * (lagged - S));
    }
    return out;
  };

/** Walkers are in profile on the path (bodyTurn), so the legs travel across the screen and read as a stride. */
const WALK_TURN = 0.8;
/**
 * Stride keys for a walker: the leg swing scales with 1 / (figure scale * height). At the shared walk
 * speed, a planted foot then sweeps back at the body's pace (1.25 is the father's, at scale 1.4).
 */
const strideFor = (scale: number, height: number) => (1.25 * 1.4) / (scale * height);

/** Father: the existing umbrella hold, then the natural walk in profile. */
const outdoorKeys: PoseKey<Pose>[] = [
  // the umbrella goes into the right hand and rises over the head: motion starts at 151 (cue "took everyone away", local 158)
  { f: 163, bodyTurn: WALK_TURN, headTurn: 0.25, eyeX: 0.3, eyeY: -0.1, smile: 0.5, brow: 0.5, lE: -16, rS: UMB_ARM.S, rE: UMB_ARM.E, rHand: "hold", rProp: "umbrella", in: 12 },
  // he steps out first, the cloth bundle in his left hand; the walk eases in (arm swing and bob come from
  // withGait, on his own leg phase)
  { f: 146, stride: strideFor(1.4, 1.0), lean: 0, lHand: "hold", lProp: "bundle", in: 8 },
  // looks back to Charu and Thakurma: motion starts at 151 (cue local 158)
  { f: 165, bodyTurn: WALK_TURN, headTurn: -0.8, eyeX: -0.9, smile: 0.6, brow: 0.5, in: 14 },
  // turns to the road again, back to rest 20 frames after the cue ends (local 249)
  { f: 269, bodyTurn: 0.4, headTurn: 0.25, eyeX: 0.3, smile: 0.5, brow: 0.5, in: 20 },
];

const outdoorKeyed = makeActing<Pose>(BASE_POSE, outdoorKeys);
/** The umbrella hand rides each step a little (deg of shoulder), so the grip is not locked in space. */
const outdoorWalk = withGait(outdoorKeyed, { seed: SURENDRA.seed, speed: speedAt, swingL: 16 });
const outdoorPose = (f: number): Pose => {
  const p = outdoorWalk(f);
  return { ...p, rS: p.rS + 1.2 * speedAt(f) * Math.sin(2 * legPhase(f - SHOULDER_LAG, SURENDRA.seed)) };
};

/**
 * The umbrella rocks with the father's steps: once per stride with his weight, and a smaller pulse at
 * each foot strike, trailing the hand by 3 frames. About 2 degrees at full pace, none at rest.
 */
const umbrellaSway = (f: number) => {
  const ph = legPhase(f - 3, SURENDRA.seed);
  return speedAt(f) * (1.6 * Math.sin(ph + 0.9) + 0.5 * Math.sin(2 * ph));
};

/**
 * Charu in the side walk: walks in profile with a gentle, uneven stride. These keys give her body, head
 * and face; her arms are solved every frame into the cradle hold (walkCharuAct, below).
 */
const charuKeys: PoseKey<Pose>[] = [
  { f: 100, crouch: 0, rHand: "cup", lHand: "cup", headTurn: -0.1, headNod: 8, eyeX: 0.3, eyeY: 0.8, smile: 0.5, brow: 0.3 },
  // walks in profile, head bent toward the child (the bob comes from withGait)
  { f: 156, stride: strideFor(CHARU_S, CAST.charu.height), bodyTurn: WALK_TURN, lean: 2, headTilt: 4, in: 10 },
];

/**
 * Charu takes slightly shorter steps (CHARU_STEP) and walks a touch slower by the same factor, so her
 * planted foot still matches her ground speed. Her arms never swing: they hold the newborn close, and her
 * bob is gentler than the others' so he is carried smoothly.
 */
const CHARU_STEP = 0.9;
const charuAct = withGait(makeActing<Pose>(BASE_POSE, charuKeys), { seed: CAST.charu.seed, speed: speedAt, strideK: CHARU_STEP, bob: 3.2 });

/* ------------------------------------------------------------------ */
/* The cradle: Charu's arms are solved onto the newborn every frame     */
/* ------------------------------------------------------------------ */

/*
 * Charu's rig mirror. These helpers repeat Puppet's own leg, shoulder, lean and root transforms for
 * Charu, so the newborn and her hands can be placed in the same space Puppet draws in. Every Charu
 * Puppet in this scene uses stillness 1 (no idle layer, no anticipation, no arm lag), which keeps the
 * mirror exact; Puppet's raised-cosine pose blend is repeated as well (blendPose).
 */
const CH = CAST.charu.height;
const CG = CAST.charu.girth;
const CB = {
  thigh: 80 * CH,
  shin: 74 * CH,
  foot: 31 * CH,
  torsoLen: 108 * CH,
  sw: 47 * CH * (0.85 + 0.15 * CG),
  ua: 56 * CH,
  fa: 52 * CH,
  limbW: 8.8 * CH * (0.9 + 0.1 * CG),
  hand: 37 * CH,
};
/** Elbow to the middle of the hand: the point of the hand that is placed on the newborn. */
const CHARU_GRIP_D = CB.fa - 2 + 0.5 * CB.hand;
const CHARU_SEED = CAST.charu.seed;

/** Puppet's pose blend for adults: raised-cosine weights over 9 frames on the body channels. */
const BLEND_W = Array.from({ length: 9 }, (_, i) => 0.5 + 0.5 * Math.cos((Math.PI * (i - 4)) / 5));
const BLEND_KEYS = ["lean", "bodyX", "bodyY", "bodyTurn", "crouch", "stride", "rS", "rE", "lS", "lE"] as const;
const blendPose = (act: (f: number) => Partial<Pose>, f: number): Pose => {
  const ps = BLEND_W.map((_, i) => ({ ...BASE_POSE, ...act(f + i - 4) }));
  const base = ps[4];
  const out: Pose = { ...base };
  for (const k of BLEND_KEYS) {
    let s = 0;
    let w = 0;
    ps.forEach((q, i) => {
      const v = q[k];
      if (!Number.isFinite(v)) return;
      if ((k === "bodyX" || k === "bodyY") && Math.abs(v - base[k]) > 120) return;
      s += v * BLEND_W[i];
      w += BLEND_W[i];
    });
    out[k] = w > 0 ? s / w : base[k];
  }
  return out;
};

/** Where a Charu Puppet stands: its x, y, scale and seated flag, exactly as passed to Puppet. */
type CharuPlace = { x: number; y: number; s: number; seated: boolean };

/** Lowest point of one leg below the hip (Puppet's leg solve: stride, crouch and kneel, or seated). */
const charuLegLow = (side: 1 | -1, f: number, p: Pose, seated: boolean, nearSide: 1 | -1): number => {
  let th = 0.03;
  let kn = 0.05;
  let ab = 0.04;
  if (seated) {
    th = 1.42;
    ab = 0.95;
    kn = 2.7;
  } else {
    if (p.stride > 0) {
      const ph = f * 0.3 + CHARU_SEED + (side > 0 ? Math.PI : 0);
      th += Math.sin(ph) * 0.42 * p.stride;
      kn += (0.12 + Math.max(0, Math.sin(ph + 1.7)) * 0.9) * p.stride;
    }
    const crouch = clamp(p.crouch);
    if (crouch > 0) {
      const k = clamp(crouch / 0.6);
      th = lerp(th, 0.85, k);
      kn = lerp(kn, 1.55, k);
      ab = lerp(ab, 0.12, k);
      if (crouch > 0.6) {
        const k2 = clamp((crouch - 0.6) / 0.4);
        th = lerp(th, side === nearSide ? 1.45 : 0.05, k2);
        kn = lerp(kn, side === nearSide ? 1.5 : 1.8, k2);
      }
    }
  }
  const knee = Math.cos(th) * Math.cos(ab) * CB.thigh;
  const ankle = knee + Math.cos(th - kn) * CB.shin;
  return Math.max(ankle + 0.28 * CB.foot, knee + CB.limbW * 1.2);
};

/**
 * Charu's body at frame f for a blended pose p: shoulder roots in the upper-body frame (before the lean),
 * which arms are drawn behind the body (those skip the lean rotation, as in Puppet), and the transforms
 * between that frame and the world.
 */
const charuRig = (f: number, p: Pose, place: CharuPlace, t: number = f) => {
  const phi = clamp(p.bodyTurn, -1, 1) * 0.95;
  const cphi = Math.cos(phi);
  const sphi = Math.sin(phi);
  const nearSide: 1 | -1 = sphi > 0.05 ? -1 : 1;
  const hipY = -Math.max(charuLegLow(-1, f, p, place.seated, nearSide), charuLegLow(1, f, p, place.seated, nearSide));
  // the rig's own breathing (MOT-20), on the life clock t, exactly as Puppet draws it at stillness 1: the shoulders
  // (and the arms hanging from them) rise with the chest; no periodic squash (Puppet squashes with the lean only)
  const breath = puppetBreath({ t, f, seed: CHARU_SEED, stillness: 1 }).chest;
  const rootY = hipY - CB.torsoLen - breath + CB.limbW;
  const b = Math.min(0.032, Math.abs(p.lean) * 0.0028);
  const c = Math.cos(p.lean * D2R);
  const s = Math.sin(p.lean * D2R);
  const rot = (q: Pt, dir: 1 | -1): Pt => {
    const dy = q.y - hipY;
    return { x: q.x * c - dir * dy * s, y: hipY + dir * q.x * s + dy * c };
  };
  return {
    lean: p.lean,
    far: (side: 1 | -1) => (side > 0 ? p.rBack > 0.5 || sphi > 0.35 : p.lBack > 0.5 || sphi < -0.35),
    root: (side: 1 | -1): Pt => ({ x: side * CB.sw * 0.86 * cphi, y: rootY }),
    toWorld: (q: Pt, far = false): Pt => {
      const r = far ? q : rot(q, 1);
      return { x: place.x + p.bodyX + r.x * place.s * (1 + b), y: place.y + p.bodyY + r.y * place.s * (1 - b) };
    },
    toUpper: (w: Pt, far = false): Pt => {
      const l = { x: (w.x - place.x - p.bodyX) / (place.s * (1 + b)), y: (w.y - place.y - p.bodyY) / (place.s * (1 - b)) };
      return far ? l : rot(l, -1);
    },
  };
};
type CharuRig = ReturnType<typeof charuRig>;

/*
 * The newborn's frame: Swaddled's outer units (head centre at (-35, -7), feet at about +59), drawn at
 * Charu's scale, so one unit is 1 / CHARU_S of her rig units. `m` mirrors it (-1 puts his head on the
 * right), `rot` is its world rotation in degrees and `k` its world scale.
 */
type BabyPose = { x: number; y: number; rot: number; m: 1 | -1; k: number };
const babyPoint = (bp: BabyPose, q: Pt): Pt => {
  const c = Math.cos(bp.rot * D2R);
  const s = Math.sin(bp.rot * D2R);
  const qx = bp.m * q.x * bp.k;
  const qy = q.y * bp.k;
  return { x: bp.x + qx * c - qy * s, y: bp.y + qx * s + qy * c };
};

/*
 * The cradle hold. She faces `fwd` (-1 = screen left, +1 = screen right); the near arm is the one on the
 * side away from her facing. His body lies diagonally against her chest, head high on the near-shoulder
 * side and bottom low toward her front:
 *  - the near upper arm hangs almost straight (NEAR_HANG) and its forearm runs horizontally across her
 *    front, under his bottom and thighs, the cupped hand under his thighs (HOLD_NEAR);
 *  - the far arm comes round behind his back, its hand on his upper back below the head (HOLD_FAR).
 * The baby is placed from the near forearm, then both arms are solved onto him (so both hands touch him).
 */
const HOLD_TILT = 20;
const NEAR_HANG = 3;
const HOLD_NEAR: Pt = { x: 36, y: 18 };
const HOLD_FAR: Pt = { x: -12, y: 4 };

/** The held baby pose in world space, for a rig facing `fwd`. */
const cradlePose = (rig: CharuRig, fwd: 1 | -1, place: CharuPlace): BabyPose => {
  const near = -fwd as 1 | -1;
  const m = fwd;
  const tilt = HOLD_TILT * fwd;
  const sh = rig.root(near);
  const el = { x: sh.x + near * CB.ua * Math.sin(NEAR_HANG * D2R), y: sh.y + CB.ua * Math.cos(NEAR_HANG * D2R) };
  const grip = { x: el.x + fwd * CHARU_GRIP_D, y: el.y };
  // the near grip point of the baby, in Charu's rig units, rotated by the tilt
  const q = { x: (m * HOLD_NEAR.x) / CHARU_S, y: HOLD_NEAR.y / CHARU_S };
  const c = Math.cos(tilt * D2R);
  const s = Math.sin(tilt * D2R);
  const origin = { x: grip.x - (q.x * c - q.y * s), y: grip.y - (q.x * s + q.y * c) };
  const w = rig.toWorld(origin);
  return { x: w.x, y: w.y, rot: tilt + rig.lean, m, k: place.s / CHARU_S };
};

/** Arm angles that put the middle of the hand on world point `t`; elbows always bend outward. */
const armOnto = (rig: CharuRig, side: 1 | -1, t: Pt) => {
  const far = rig.far(side);
  const l = rig.toUpper(t, far);
  const r = rig.root(side);
  return solveArm2(side, CB.ua, CHARU_GRIP_D, l.x - r.x, l.y - r.y, 1);
};

/** Pose with both arms solved onto the baby: `nearQ` / `farQ` are the hand points in the baby frame. */
const cradleArms = (rig: CharuRig, fwd: 1 | -1, bp: BabyPose, nearQ: Pt, farQ: Pt): Partial<Pose> => {
  const near = -fwd as 1 | -1;
  const a = armOnto(rig, near, babyPoint(bp, nearQ));
  const b = armOnto(rig, -near as 1 | -1, babyPoint(bp, farQ));
  const R = near > 0 ? a : b;
  const L = near > 0 ? b : a;
  return { rS: R.S, rE: R.E, lS: L.S, lE: L.E, rHand: "cup", lHand: "cup", rProp: "", lProp: "" };
};

/**
 * Her near forearm and both hands in front of the newborn. A second copy of Charu (`children`) is clipped
 * to the exact outline of her near forearm (Puppet's forearm shape for the blended pose `p`) and drawn
 * over him; both hands are then drawn directly with the rig's own Hand, placed, lit and shaded exactly as
 * Puppet draws them (a far arm's hand is darker), so each hand lies on him with no fringe around it.
 */
const CradleFront: React.FC<{
  id: string;
  f: number;
  rig: CharuRig;
  p: Pose;
  place: CharuPlace;
  fwd: 1 | -1;
  lights: SceneLight[];
  opacity: number;
  children: React.ReactNode;
}> = ({ id, f, rig, p, place, fwd, lights, opacity, children }) => {
  if (opacity <= 0.01) return null;
  const near = -fwd as 1 | -1;
  const farSide = -near as 1 | -1;
  const L = CB.limbW * 0.88;
  const arm = (side: 1 | -1) => {
    const S = side > 0 ? p.rS : p.lS;
    const E = side > 0 ? p.rE : p.lE;
    const r = rig.root(side);
    const el = armPoint(side, CB.ua, S, 0, 0);
    return { S, E, r, el, ux: side * Math.sin((S + E) * D2R), uy: Math.cos((S + E) * D2R), far: rig.far(side) };
  };
  // the figure's light-driven brightness, as Puppet computes it
  const headX = place.x + p.bodyX;
  const headY = place.y + p.bodyY - 300 * place.s;
  const lightSum = lights.reduce(
    (acc, l) => acc + l.intensity * Math.pow(clamp(1 - Math.hypot(l.x - headX, l.y - headY) / l.radius), 1.5) * (l.flicker !== undefined ? flicker(f, l.flicker) : 1),
    0,
  );
  const bright = lights.length ? 0.9 + Math.min(0.35, lightSum * 0.3) : 1;
  // near forearm outline: Puppet's forearm (L*0.9 at the elbow, L at a quarter, L*0.6 at the wrist), inset a hair
  const a = arm(near);
  const prof: Array<[number, number]> = [[0, 0.9], [0.12, 0.97], [0.25, 1], [0.5, 0.88], [0.75, 0.73], [1, 0.6]].map(([t, w]) => [CB.fa * t, L * w - 0.3]);
  const at = (d: number, h: number) => rig.toWorld({ x: a.r.x + a.el.x + a.ux * d + a.uy * h, y: a.r.y + a.el.y + a.uy * d - a.ux * h }, a.far);
  const forearm = [...prof.map(([d, h]) => at(d, h)), ...[...prof].reverse().map(([d, h]) => at(d, -h))]
    .map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`)
    .join(" ");
  const hand = (side: 1 | -1) => {
    const q = arm(side);
    const wrist = rig.toWorld({ x: q.r.x + q.el.x + q.ux * (CB.fa - 2), y: q.r.y + q.el.y + q.uy * (CB.fa - 2) }, q.far);
    const rot = -side * (q.S + q.E) + (q.far ? 0 : rig.lean);
    return (
      <g
        transform={`translate(${wrist.x}, ${wrist.y}) scale(${place.s}) rotate(${rot})`}
        style={{ filter: `brightness(${(bright * (q.far ? 0.85 : 1)).toFixed(3)}) drop-shadow(0 0 1.4px rgba(59,36,28,0.52))` }}
      >
        <Hand
          shape="cup"
          L={CB.hand}
          skin={q.far ? CAST.charu.skinShade : CAST.charu.skin}
          shade={CAST.charu.skinShade}
          side={side}
          flex={noise1(f * 0.04, CHARU_SEED + side) * 0.5 + 0.5}
        />
      </g>
    );
  };
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={id}>
          <polygon points={forearm} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
      {hand(farSide)}
      {hand(near)}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Doorway: she kneels to the cot, slides her hands under him, lifts   */
/* ------------------------------------------------------------------ */

/*
 * Timeline (scene frames). DOWN0 to DOWN1 she kneels down to the cot and bends over it (knees and waist),
 * her hands reaching beside him; SLIDE0 to LIFT0 the hands slide in under his head and his bottom; LIFT0 to LIFT1
 * she straightens up slowly with him, easing the whole way, and draws him into the cradle at her chest.
 * While he rises her hands shift, behind him, from the lifting grip to the cradle grip (REGRIP), and her
 * near forearm comes in front of him (CRADLE_FRONT).
 */
const DOOR_TURN = -0.3;
const DOWN0 = 96;
const DOWN1 = 108;
const SLIDE0 = 104;
const LIFT0 = 113;
const LIFT1 = 147;
/** Kneeling on one knee and bent at the waist toward the cot. */
const DOOR_CROUCH: [number, number] = [0.8, 1.0];
const DOOR_LEAN: [number, number] = [-3, -7];
/**
 * The cot (a low chowki, in front of her: she kneels behind it), its quilt's top surface, and the
 * newborn lying on it (baby frame mirrored, head on the right).
 */
const COT = { x0: 1176, x1: 1372, top: 925 };
const BED: BabyPose = { x: 1276, y: 898, rot: 0, m: -1, k: 1 };
/** Hand points on the baby: beside him, then under his head and under his bottom. */
const REACH_NEAR: Pt = { x: -46, y: 8 };
const REACH_FAR: Pt = { x: 56, y: 8 };
const PICK_NEAR: Pt = { x: -28, y: 20 };
const PICK_FAR: Pt = { x: 35, y: 20 };
const DOOR_PLACE: CharuPlace = { x: DOOR_CHARU.x, y: DOOR_CHARU.y, s: CHARU_S, seated: false };

const liftK = (f: number) => smooth((f - LIFT0) / (LIFT1 - LIFT0));

const doorCharuKeys: PoseKey<Pose>[] = [
  // bending to the cot, eyes on him
  { f: 100, headTurn: -0.2, headNod: 6, eyeX: -0.2, eyeY: 0.9, smile: 0.3, brow: 0.3 },
  { f: 113, headTurn: -0.15, headNod: 10, eyeX: -0.1, eyeY: 1, smile: 0.45, ease: "inOut", in: 9 },
  // draws him to her chest and stands, with a soft smile, looking down at him
  { f: 147, headTurn: -0.1, headNod: 8, eyeX: 0.2, eyeY: 0.8, smile: 0.6, brow: 0.3, ease: "inOut", in: 30 },
];
const doorCharuKeyed = makeActing<Pose>(BASE_POSE, doorCharuKeys);

/** Body only: the bend down to the cot, then the slow straightening as she lifts him. */
const doorCharuBody = (f: number): Pose => {
  const down = smooth((f - DOWN0) / (DOWN1 - DOWN0));
  const up = liftK(f);
  return {
    ...doorCharuKeyed(f),
    bodyTurn: DOOR_TURN,
    crouch: lerp(lerp(DOOR_CROUCH[0], DOOR_CROUCH[1], down), 0, up),
    lean: lerp(lerp(DOOR_LEAN[0], DOOR_LEAN[1], down), 0, up),
    rHand: "cup",
    lHand: "cup",
  };
};

/** The newborn in the doorway shot: on the cot, then lifted along a gentle rising arc into the cradle. */
const doorBaby = (f: number, rig: CharuRig): BabyPose => {
  const e = liftK(f);
  if (e <= 0) return BED;
  const hold = cradlePose(rig, -1, DOOR_PLACE);
  // control point: he rises off the cot first, then is drawn in to her chest
  const cx = lerp(BED.x, hold.x, 0.3);
  const cy = lerp(BED.y, hold.y, 0.8);
  const u = 1 - e;
  return {
    x: u * u * BED.x + 2 * u * e * cx + e * e * hold.x,
    y: u * u * BED.y + 2 * u * e * cy + e * e * hold.y,
    rot: lerp(BED.rot, hold.rot, e),
    m: -1,
    k: 1,
  };
};

const qBezier = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
};

/** Hand points on the baby at frame f: reach beside him, slide under, then shift into the cradle behind him. */
const doorGrips = (f: number): { near: Pt; far: Pt } => {
  if (f < LIFT0) {
    const t = smooth((f - SLIDE0) / (LIFT0 - SLIDE0));
    return {
      near: { x: lerp(REACH_NEAR.x, PICK_NEAR.x, t), y: lerp(REACH_NEAR.y, PICK_NEAR.y, t) },
      far: { x: lerp(REACH_FAR.x, PICK_FAR.x, t), y: lerp(REACH_FAR.y, PICK_FAR.y, t) },
    };
  }
  // REGRIP: through the inside of his body (hidden behind the swaddle) to the cradle points
  const t = smooth((liftK(f) - 0.2) / 0.5);
  return { near: qBezier(PICK_NEAR, { x: 4, y: 2 }, HOLD_NEAR, t), far: qBezier(PICK_FAR, { x: 12, y: 0 }, HOLD_FAR, t) };
};

/** CRADLE_FRONT: the near forearm and the hands come in front of him as the cradle forms. */
const doorFront = (f: number) => smooth((liftK(f) - 0.6) / 0.08);

/** Charu's pose in the doorway shot: the keyed body, with both arms solved onto the newborn every frame. */
const doorCharuAct = (f: number): Pose => {
  const body = doorCharuBody(f);
  const rig = charuRig(f, blendPose(doorCharuBody, f), DOOR_PLACE);
  const g = doorGrips(f);
  return { ...body, ...cradleArms(rig, -1, doorBaby(f, rig), g.near, g.far) };
};

/* ------------------------------------------------------------------ */
/* Walk and rear shots: the newborn rides in the cradle                 */
/* ------------------------------------------------------------------ */

/** The walk: facing right; the hold is fixed to her shoulders, so her arms keep their shape as she walks. */
const walkPlace = (f: number): CharuPlace => ({ x: charuX(f), y: charuY(f), s: CHARU_WS, seated: false });
const walkCharuActAt =
  (t: number) =>
  (f: number): Pose => {
    const rig = charuRig(f, blendPose(charuAct, f), walkPlace(f), t);
    return { ...charuAct(f), ...cradleArms(rig, 1, cradlePose(rig, 1, walkPlace(f)), HOLD_NEAR, HOLD_FAR) };
  };

/**
 * Thakurma: carries the basket in the near (left) hand so it shows in profile, and follows Charu at a
 * steady pace. Her free right arm swings with the stride.
 */
const thakurmaKeys: PoseKey<Pose>[] = [
  { f: 0, bodyTurn: WALK_TURN, headTurn: 0.2, eyeX: 0.3, smile: 0.25, brow: 0.3, lS: 14, lE: -26, lHand: "hold", lProp: "basket", rS: 6, rE: -10, rHand: "relaxed" },
  { f: 156, stride: strideFor(1.25, THAKURMA.height), in: 10 },
  // a calm, warm glance ahead toward Charu and the child: motion starts at 151 (cue local 158)
  { f: 158, headTurn: 0.4, eyeX: 0.4, smile: 0.4, in: 7 },
  // back to rest 20 frames after the cue ends (local 249)
  { f: 269, headTurn: 0.2, eyeX: 0.3, smile: 0.3, in: 20 },
];

/** Both arms swing (the bag arm a little less, so the bag swings on a trailing forearm). */
const thakurmaAct = withGait(makeActing<Pose>(BASE_POSE, thakurmaKeys), { seed: THAKURMA.seed, speed: speedAt, strideK: CHARU_STEP, swingL: 10, swingR: 12, bob: 3.6 });

/* ------------------------------------------------------------------ */
/* Walk motion: the path, the family and the cart                      */
/* ------------------------------------------------------------------ */

const unitDist = (f: number) => {
  let d = 0;
  for (let g = WALK0; g < f; g++) d += speedAt(g);
  return d;
};
/**
 * Full walking pace in old px per frame at the 1.4 figure scale (the rig's own stride length): defined, as it
 * always was, as 1060 px over the original eased walk profile (which slowed to a stop at WALK_END), so every
 * stride-matched speed in the scene (the peon's too) is unchanged. The side walk itself no longer slows: the
 * family walks on at pace until the cut to the gate.
 */
const WALK_V = (() => {
  let d = 0;
  for (let g = WALK0; g < WALK_END; g++) d += smooth((g - WALK0) / 24) * (1 - smooth((g - WALK_SLOW) / 30));
  return 1060 / d;
})();
const walkDist = (f: number) => WALK_V * unitDist(f);

/*
 * The departure is staged in front of the Baidik Bari, the Episode 1 exterior (BaidikBariDay), drawn
 * BARI.K times its own size so its main door fits an adult. The walkers are drawn at WS times the old
 * 1.4 framing (the father 0.84, his head top about 310 px above his feet; the door is 324 px tall). Their
 * strides are keyed for the old scale, so their ground speed is scaled by WS too: the feet stay planted.
 */
const WS = 0.6;
const FATHER_WS = 1.4 * WS;
const CHARU_WS = CHARU_S * WS;
const THAKURMA_WS = 1.25 * WS;
/** The set's transform (set coords to stage): x = BARI.X + BARI.K * sx, y = BARI.Y + BARI.K * sy. */
const BARI = { K: 1.8, X: -1028, Y: -632 };
const bariX = (sx: number) => BARI.X + BARI.K * sx;
const bariY = (sy: number) => BARI.Y + BARI.K * sy;
/** The main door (set x 870 to 1050, centre 960; the arch springs at set y 600, crown 560, sill 740). */
const BARI_DOOR = { x: bariX(960), l: bariX(870), r: bariX(1050), crown: bariY(560) };
/** The veranda floor on the plinth (the door sill) and the courtyard path below it. */
const PLINTH_Y = bariY(740);
const PATH_Y = bariY(790);
/**
 * The steps in front of the main door: a broad flight of three, spanning STEPS_X0 to STEPS_X1. The family
 * walks right and comes down it on a diagonal, one step at each STEP_XS edge (30 px each, 700 to 790).
 */
const STEPS_X0 = 470;
const STEPS_X1 = 990;
const STEP_XS = [836, 876, 916];
const STEP_RISE = (PATH_Y - PLINTH_Y) / STEP_XS.length;
/** Ground height under a walker at x: the veranda floor, then down the steps to the path. */
const groundAt = (x: number) => PLINTH_Y + STEP_XS.reduce((acc, sx) => acc + STEP_RISE * smooth((x - sx + 9) / 18), 0);

/** At 152 the father is just out of the door; Charu is in the doorway, Thakurma just inside behind the jamb. */
const FAM_X0 = 770;
/** The family's group position along the path (the father leads). */
const famX = (f: number) => FAM_X0 + WS * walkDist(f);

/*
 * Departure camera (152-195). It dollies right with the family at their walking pace (it starts from rest
 * with them, since speedAt eases in), then from CAM_STOP0 to CAM_STOP1 it eases back to a wide frame that
 * holds the door and the woman in it, the steps, the elder on the veranda and the gate at the right.
 */
const CAM_STOP0 = 176;
const CAM_STOP1 = 196;
const departCamX = (f: number) => -150 + 0.93 * WS * walkDist(f);

/**
 * Spacing along the path, so each figure reads: Charu walks 200 (old px) behind the father, Thakurma 400.
 * Charu's shorter steps cover a little less ground, so she drifts back slowly (planted feet).
 */
const fatherX = (f: number) => famX(f);
const charuX = (f: number) => famX(f) - 200 * WS - (1 - CHARU_STEP) * WS * walkDist(f);
const thakurmaX = (f: number) => famX(f) - 400 * WS - (1 - CHARU_STEP) * WS * walkDist(f);
const fatherY = (f: number) => groundAt(fatherX(f));
const charuY = (f: number) => groundAt(charuX(f));
const thakurmaY = (f: number) => groundAt(thakurmaX(f));

/** Lamp light from the open main door and the lit veranda arches, shared by everyone in the departure. */
const EVE_LIGHTS: SceneLight[] = [
  { x: BARI_DOOR.x, y: 560, color: "#ffb05a", intensity: 0.75, radius: 900, flicker: 5 },
  { x: 1308, y: 600, color: "#ffb05a", intensity: 0.4, radius: 700, flicker: 9 },
];

/* ------------------------------------------------------------------ */
/* Lamp light: the room of the doorway shot                            */
/* ------------------------------------------------------------------ */

const LAMP_X = 520;
const LAMP_Y = 120;
const LAMP_LIGHTS: SceneLight[] = [{ x: LAMP_X, y: 200, color: "#ffb55a", intensity: 1.1, radius: 1150, flicker: 7 }];

/* ------------------------------------------------------------------ */
/* Face close-ups, synced to the narration                             */
/* ------------------------------------------------------------------ */

/*
 * Three narration-synced close-ups, each blended into its shot's own camera (local frames; cues from
 * subtitles.ts, local = absolute - SCENE01E_START, read from EP02_SCENES):
 *  1. ShotHandover 70-101: the father's face just after he opens the letter ("...নতুন চাকরির খবর এল", cue
 *     59-158). In 70-82, held to the cut at 102 (his face lifts with joy 78-90), the peon still beside him.
 *  2. ShotDoorway 104-152: Charu's face as the news lands, while she kneels to the cot and lifts him.
 *     In 104-122, held 122-132 (the camera rides up with her face as she rises), back 132-152.
 *  3. ShotWalk 152-196: Balak's face in her arms as the family sets out ("সবাইকে নিয়ে তিনি চলে গেলেন
 *     উজানচর", cue 158-249), his glow lifting a little. In 152-170, held 170-178, back 178-196 into the crane.
 * The face is anchored: its screen position eases from where the base camera puts it to the close-up
 * spot (centred in x, above the caption band in y) while the zoom eases, so the face never swims out of
 * frame; at weight 0 the base camera is returned unchanged.
 */
const closeW = (f: number, in0: number, in1: number, out0: number, out1: number) =>
  smooth((f - in0) / (in1 - in0)) * (1 - smooth((f - out0) / (out1 - out0)));

const faceCam = (base: Cam, face: Pt, zoom: number, sy: number, w: number): Cam => {
  if (w <= 0) return base;
  const bx = 960 + base.zoom * (face.x - base.x - 960);
  const by = 540 + base.zoom * (face.y - base.y - 540);
  const z = lerp(base.zoom, zoom, w);
  const sx = lerp(bx, 960, w);
  const syy = lerp(by, sy, w);
  return { ...base, zoom: z, x: face.x - 960 - (sx - 960) / z, y: face.y - 540 - (syy - 540) / z };
};

/** Adult standing head centre above the feet, in rig units (shoulder line, neck and 0.9 head radius). */
const ADULT_HEAD_Y = 318;
const CU_CHARU = { in0: 104, in1: 122, out0: 132, out1: 152, zoom: 1.42, sy: 430 };
/** Balak's close-up is zoomed further because the departure figures are drawn at WS (0.6) of the old scale. */
const CU_BALAK = { in0: 152, in1: 170, out0: 178, out1: 196, zoom: 1.8, sy: 420 };

/** Charu's head centre in world space, from her mirrored rig (as Puppet draws the head: x 0 in the leaned upper body). */
const charuFace = (rig: CharuRig): Pt =>
  rig.toWorld({ x: 0, y: rig.root(1).y - CB.limbW - 11 * CH - 0.9 * 41 * Math.sqrt(CH) });
/** The newborn's head centre in the baby frame (Swaddled outer units). */
const NB_FACE: Pt = { x: -35, y: -7 };

/* ------------------------------------------------------------------ */
/* Shot 1 — the letter arrives: the dak-peon at the Baidik Bari door   */
/* ------------------------------------------------------------------ */

/*
 * Beats (local frames; HAND_F is the cue "সুরেন্দ্রচন্দ্রের নতুন চাকরির খবর এল—", local 59):
 *   0-20   the peon comes along the veranda under his umbrella and stops beside the main door (the camera
 *          tracks him to the two-shot); the father waits in the doorway, watching him come
 *  18-30   he closes the umbrella (18-26) and lowers it, letting it hang from his right hand (22-30)
 *  30-43   namaskar: hands joined (30-34), a small bow (34-38) and up again; the father returns it, joined
 *          hands and a nod (28-38), and lowers his hands (40-46)
 *  39-52   the peon's near hand goes into the satchel (39-46) and draws out the envelope (45), lifting it to
 *          his chest (45-51); his other hand joins it underneath (47-52)
 *  52-59   (HAND_F-7 to HAND_F) he presents it with both hands and a small bow; the father reaches with both
 *          hands from 52 and takes it on the cue (59)
 *  61-72   the peon lets go (61); the father draws the letter to his chest (61-69) and opens it (63-72):
 *          the envelope's flap lifts and the sheet comes out and unfolds in his hands
 *  62-78   the peon straightens and steps back (62-70), then bows again with joined hands (70-78)
 *  68-101  close-up on the father's face (eased push-in 68-84 to head and shoulders, held to the cut): he
 *          reads, then beams (74-80: broad open smile, eye smile, lifted brows, a happy nod), glances up toward
 *          the house as if to call the family (82-88) and back to the letter, raising it to the light (80-92)
 *  79-101  the peon swings his umbrella up (79-86), opens it (82-90), turns (82-90) and walks off along the
 *          veranda into the rain (86 on), still in the frame at its left
 * Both figures run at stillness 1, so their hands land exactly where they are solved (as Charu's do).
 */
const HAND_F = 59;

/*
 * The handover was authored on its own clock `o` (the beats above). The shot plays it on the real clock h through
 * a piecewise-linear warp anchored to the narration (CAM-13): the peon's umbrella reaches the frame edge in the
 * open pause (o -47 at h 12) and he walks in at the rig's pace (planted feet); the furl, the namaskar, the satchel
 * and the presenting slow a little (a respectful, unhurried handover) so the father takes the letter on "খবর"
 * (o = HAND_F at H_TAKE); he opens and reads to the end of the line (o 72 at NEWS0), and in the first second of the
 * news pause his face lifts with joy, he raises the letter and the peon bows and leaves (o 90 at CUT_CALL).
 */
const ARRIVE_H = 12;
const HAND_WARP: Array<[number, number]> = (() => {
  const stopH = ARRIVE_H + 67;
  const span = Math.max(32, H_TAKE - stopH);
  const segs: Array<[number, number]> = [[34, 21], [43, 18], [52, 22], [HAND_F, 20]];
  const pts: Array<[number, number]> = [[0, -47 - ARRIVE_H], [stopH, 20]];
  let h = stopH;
  for (const [o, w] of segs) {
    h += (span * w) / 81;
    pts.push([h, o]);
  }
  pts.push([Math.max(h + 12, NEWS0), 72], [Math.max(h + 30, CUT_CALL), 90]);
  return pts;
})();
/** Real frame h of shots 1 to 4a -> the handover's own frame o (slope 1 before the first and after the last point). */
const handF = (h: number): number => {
  const P = HAND_WARP;
  if (h <= P[0][0]) return P[0][1] + (h - P[0][0]);
  for (let i = 1; i < P.length; i++) {
    if (h <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (h - P[i - 1][0]) / (P[i][0] - P[i - 1][0]));
  }
  return P[P.length - 1][1] + (h - P[P.length - 1][0]);
};

/** Where the two stand: the father just inside the open main door, the peon on the veranda to its left. */
const FATHER_DOOR_X = 625;
const PEON_S = FATHER_WS;
const PEON_STOP = 485;
/** The handover point (world): between them, a little below shoulder height. */
const HANDOVER: Pt = { x: FATHER_DOOR_X - 68, y: PLINTH_Y - 185 };
/** The peon walks at the family's pace, with the stride that keeps his feet planted at it (see strideFor). */
const PEON_STRIDE = strideFor(1.4, DAK_PEON.height);
const PEON_V = WS * WALK_V;
const PEON_LEAVE = 86;
const PEON_BACK = 16;

/** Peon walk speed (0..1): arriving (full pace at 0, stopped by 20), a small step back (62-70), leaving (86 on). */
const peonSpeed = (g: number) => {
  if (g < 40) return 1 - smooth((g - 4) / 16);
  if (g < PEON_LEAVE) return g > 62 && g < 70 ? 0.33 * Math.sin((Math.PI * (g - 62)) / 8) : 0;
  return smooth((g - PEON_LEAVE) / 10);
};
/** The peon's x on the veranda: he arrives at PEON_STOP, steps back PEON_BACK, then walks off to the left. */
const peonX = (f: number) => {
  const n = Math.round(f);
  let rem = 0;
  for (let g = n; g < 40; g++) rem += peonSpeed(g);
  let out = 0;
  for (let g = PEON_LEAVE; g < n; g++) out += peonSpeed(g);
  return PEON_STOP - PEON_V * (rem + out) - PEON_BACK * smooth((f - 62) / 8);
};

type Place = { x: number; y: number; s: number };
const peonPlace = (f: number): Place => ({ x: peonX(f), y: PLINTH_Y, s: PEON_S });
const FATHER_PLACE: Place = { x: FATHER_DOOR_X, y: PLINTH_Y, s: FATHER_WS };
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

/**
 * A standing or walking adult Puppet's body at frame f for a blended pose p (no crouch, not seated): the
 * same geometry charuRig mirrors for Charu, for any adult cast member. Shoulder roots are in the upper-body
 * frame (before the lean); arms drawn behind the body skip the lean rotation, as in Puppet.
 */
const standRig = (c: CastMember, f: number, p: Pose, place: Place, t: number = f) => {
  const h = c.height;
  const g = c.girth;
  const B = {
    thigh: 80 * h,
    shin: 74 * h,
    foot: 31 * h,
    torsoLen: 108 * h,
    sw: 47 * h * (0.85 + 0.15 * g),
    hw: 34 * h * g,
    ua: 56 * h,
    fa: 52 * h,
    limbW: 8.8 * h * (c.wiry ? 0.82 : 1) * (0.9 + 0.1 * g),
    hand: 37 * h,
  };
  const phi = clamp(p.bodyTurn, -1, 1) * 0.95;
  const cphi = Math.cos(phi);
  const sphi = Math.sin(phi);
  const legLow = (side: 1 | -1) => {
    let th = 0.03;
    let kn = 0.05;
    const ab = 0.04;
    if (p.stride > 0) {
      const ph = f * GAIT_RATE + c.seed + (side > 0 ? Math.PI : 0);
      th += Math.sin(ph) * 0.42 * p.stride;
      kn += (0.12 + Math.max(0, Math.sin(ph + 1.7)) * 0.9) * p.stride;
    }
    const knee = Math.cos(th) * Math.cos(ab) * B.thigh;
    const ankle = knee + Math.cos(th - kn) * B.shin;
    return Math.max(ankle + 0.28 * B.foot, knee + B.limbW * 1.2);
  };
  const hipY = -Math.max(legLow(-1), legLow(1));
  // the rig's own breathing on the life clock t (Puppet at stillness 1); squash with the lean only, as in Puppet
  const breath = puppetBreath({ t, f, seed: c.seed, stillness: 1 }).chest;
  const shY = hipY - B.torsoLen - breath;
  const rootY = shY + B.limbW;
  const b = Math.min(0.032, Math.abs(p.lean) * 0.0028);
  const cl = Math.cos(p.lean * D2R);
  const sl = Math.sin(p.lean * D2R);
  const rot = (q: Pt, dir: 1 | -1): Pt => {
    const dy = q.y - hipY;
    return { x: q.x * cl - dir * dy * sl, y: hipY + dir * q.x * sl + dy * cl };
  };
  const male = c.sex !== "f";
  return {
    B,
    sphi,
    hipY,
    shY,
    rootY,
    b,
    swp: B.sw * Math.sqrt(cphi * cphi + 0.3 * sphi * sphi),
    hwp: B.hw * Math.sqrt(cphi * cphi + 0.45 * sphi * sphi),
    far: (side: 1 | -1) => (side > 0 ? p.rBack > 0.5 || (sphi > 0.25 && male) || sphi > 0.35 : p.lBack > 0.5 || sphi < -0.35),
    root: (side: 1 | -1): Pt => ({ x: side * B.sw * 0.86 * cphi, y: rootY }),
    toWorld: (q: Pt, far = false): Pt => {
      const r = far ? q : rot(q, 1);
      return { x: place.x + p.bodyX + r.x * place.s * (1 + b), y: place.y + p.bodyY + r.y * place.s * (1 - b) };
    },
    toUpper: (w: Pt, far = false): Pt => {
      const l = { x: (w.x - place.x - p.bodyX) / (place.s * (1 + b)), y: (w.y - place.y - p.bodyY) / (place.s * (1 - b)) };
      return far ? l : rot(l, -1);
    },
  };
};
type StandRig = ReturnType<typeof standRig>;

/** Solve one arm so the point `d` from its elbow (the hand's grip or prop origin) lands on world point w. */
const reachArm = (rig: StandRig, side: 1 | -1, w: Pt, d: number) => {
  const u = rig.toUpper(w, rig.far(side));
  const r = rig.root(side);
  return solveArm2(side, rig.B.ua, d, u.x - r.x, u.y - r.y, 0);
};

/* --- the peon's umbrella: open overhead, closed and hanging from his hand by its crook, open again --- */
const peonUmbOpen = (f: number) => clamp(1 - smooth((f - 18) / 8) + smooth((f - 82) / 8));
const peonUmbHang = (f: number) => smooth((f - 22) / 8) * (1 - smooth((f - 79) / 7));
/**
 * The peon's black umbrella (a little smaller than the father's). Open, it is held up by the handle with the
 * canopy leaning back over his head and stirring in the wind; it furls to a slim roll (18-26), then swings
 * down to hang from his hand by its crook (22-30), and the reverse as he leaves (79-90).
 */
const P_PEON_UMBRELLA: PropRenderer = ({ f, worldRot, scale }) => {
  const k = peonUmbOpen(f);
  const hang = peonUmbHang(f);
  const tilt = UMB_TILT + (2.4 * noise1(f * 0.04, 5) + 1.0 * noise1(f * 0.13, 9)) * k;
  const ang = lerp(-tilt, 172 + 4 * Math.sin(f * 0.21), hang);
  const W = lerp(13, 165, k);
  const ey = lerp(-84, -118, k);
  const cy = lerp(-196, -228, k);
  const by = lerp(6, 16, k);
  return (
    <g transform={`scale(${scale * 0.75})`}>
      <g transform={`rotate(${-worldRot + ang})`}>
        <line x1={0} y1={12} x2={0} y2={-150} stroke="#3a2412" strokeWidth={6} strokeLinecap="round" />
        <line x1={0} y1={-230} x2={0} y2={-252} stroke="#2a1a0e" strokeWidth={4} strokeLinecap="round" />
        <path d={`M ${-W} ${ey} Q ${-W * 0.91} ${cy} 0 -236 Q ${W * 0.91} ${cy} ${W} ${ey} Q ${W * 0.5} ${ey + by} 0 ${ey + 2} Q ${-W * 0.5} ${ey + by} ${-W} ${ey} Z`} fill="#2e2622" />
        {k > 0.15 && <path d={`M 0 -236 Q ${40 * k} -228 ${80 * k} ${lerp(-120, -150, k)} Q ${30 * k} -158 0 -170 Z`} fill="#4a3e36" opacity={0.7 * k} />}
        {k > 0.15 &&
          [-120, -60, 0, 60, 120].map((x) => <line key={x} x1={0} y1={-200} x2={x * k} y2={lerp(-90, -114, k)} stroke="#120c08" strokeWidth={2} opacity={0.5 * k} />)}
        {k < 0.5 && <rect x={-W - 1} y={-152} width={2 * W + 2} height={6} fill="#5a4636" opacity={1 - 2 * k} />}
        {/* the crook handle */}
        <path d="M 0 10 Q 0 26 -9 26 Q -17 26 -17 17" stroke="#2a1a0e" strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      <path d="M -10 -6 Q 0 -10 10 -6 Q 12 3 8 9 Q 0 12 -8 9 Q -12 3 -10 -6 Z" fill={DAK_PEON.skin} stroke={DAK_PEON.skinShade} strokeWidth={1} opacity={0.95} />
    </g>
  );
};

/* --- the peon's acting --- */
const peonKeys: PoseKey<Pose>[] = [
  // walks in facing the door, the umbrella up in his right hand, the left arm swinging (withGait)
  { f: 0, bodyTurn: 0.6, headTurn: 0.2, eyeX: 0.4, eyeY: -0.05, smile: 0.35, brow: 0.3, stride: PEON_STRIDE, rS: UMB_ARM.S, rE: UMB_ARM.E, rHand: "hold", rProp: "pumb", lS: 4, lE: -14 },
  // looks up to the father in the doorway as he comes near
  { f: 14, headTurn: 0.35, eyeX: 0.6, eyeY: -0.1, smile: 0.45, brow: 0.45, in: 10 },
  // the closed umbrella comes down to his side, hanging from his hand (22-30)
  { f: 30, rS: 12, rE: -26, in: 8 },
  // namaskar: hands joined at the chest, then a small bow
  { f: 34, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", in: 5 },
  { f: 38, lean: 7, headNod: 10, eyeY: 0.3, smile: 0.5, in: 4 },
  // up again, hands down; his eyes go to the satchel at his hip
  { f: 43, lean: 2, headNod: 4, eyeY: 0.35, eyeX: 0.3, rS: 12, rE: -26, lS: 4, lE: -14, rHand: "hold", lHand: "hold", in: 5 },
  // presents the letter with both hands and a small bow: motion from HAND_F-7 (cue "news came", local 59)
  { f: HAND_F, lean: 7, headNod: 6, headTurn: 0.3, eyeX: 0.5, eyeY: 0.2, in: 7 },
  // straightens and steps back
  { f: 68, lean: 0, headNod: 0, eyeY: 0, smile: 0.55, lHand: "relaxed", in: 7 },
  // bows again with joined hands
  { f: 74, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", in: 5 },
  { f: 78, lean: 9, headNod: 12, eyeY: 0.4, in: 4 },
  // the umbrella swings up overhead (79-86) as he turns to go, then he faces left and walks off
  { f: 84, lean: 0, headNod: 0, eyeY: -0.05, rS: UMB_ARM.S, rE: UMB_ARM.E, rHand: "hold", lHand: "relaxed", lS: 4, lE: -14, in: 6 },
  { f: 90, bodyTurn: -0.75, headTurn: -0.3, eyeX: -0.5, smile: 0.4, in: 8 },
];
const peonBody = withGait(makeActing<Pose>(BASE_POSE, peonKeys), { seed: DAK_PEON.seed, speed: peonSpeed, swingL: 14 });

/* --- the father in the doorway --- */
const fatherDoorKeys: PoseKey<Pose>[] = [
  // open pause: stands just inside the door, looking out at the rain (eyes up to the sky, a slow small tilt)
  { f: -59, bodyTurn: FATHER_READ_TURN, headTurn: -0.25, headTilt: -3, eyeX: -0.45, eyeY: -0.35, smile: 0.15, brow: 0.3, lS: 6, lE: -10, rS: 6, rE: -10 },
  { f: -44, headTurn: -0.3, headTilt: -1, eyeX: -0.6, eyeY: -0.25, ease: "inOut", in: 14 },
  // the peon's umbrella comes along the veranda: he notices it and watches him come
  { f: -26, headTurn: -0.15, headTilt: 0, eyeX: -0.6, eyeY: 0.05, smile: 0.25, brow: 0.35, ease: "inOut", in: 12 },
  { f: 18, headTurn: -0.05, eyeX: -0.5, smile: 0.35, brow: 0.45, in: 10 },
  // returns the namaskar: joined hands and a nod
  { f: 34, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam", in: 6 },
  { f: 38, headNod: 8, eyeY: 0.25, smile: 0.4, in: 4 },
  { f: 46, headNod: 0, eyeY: 0.15, rS: 8, rE: -24, lS: 8, lE: -24, rHand: "relaxed", lHand: "relaxed", in: 6 },
  // looks down at the letter held out to him and takes it with both hands: motion from HAND_F-7 (cue local 59)
  { f: HAND_F, eyeY: 0.45, eyeX: -0.7, headTilt: 2, brow: 0.5, rHand: "hold", lHand: "hold", in: 7 },
  // opens it and reads, eyes down on the sheet
  { f: HAND_F + 13, headTurn: -0.05, headTilt: 4, eyeY: 0.7, eyeX: -0.75, smile: 0.1, brow: 0.35, in: 8 },
  // the news lands (74-80): a broad smile with an eye smile, brows lifted, a small happy nod over the sheet
  { f: 80, headNod: 4, headTilt: -3, eyeY: 0.45, eyeX: -0.6, smile: 1.15, brow: 1.0, browTilt: 0.35, cheeks: 0.25, tears: 0.1, ease: "inOut", in: 6 },
  // glances up from the letter toward the house, as if to call the family (82-88)
  { f: 88, headNod: -2, headTurn: 0.35, headTilt: -5, eyeY: -0.3, eyeX: 0.4, smile: 1.2, brow: 1.05, ease: "inOut", in: 6 },
  // and back down to the sheet, still beaming (93-99)
  { f: 99, headNod: 3, headTurn: 0.05, headTilt: -2, eyeY: 0.4, eyeX: -0.55, smile: 1.15, brow: 0.95, ease: "inOut", in: 6 },
];
const fatherDoorBody = makeActing<Pose>(BASE_POSE, fatherDoorKeys);
/** The rig's adult smile is a closed, small lift; from 74 his lips part into a broad, happy smile with teeth. */
const fatherDoorMouth = (f: number): MouthState => {
  const k = smooth((f - 74) / 6);
  return { open: 0.11 * k, width: 1 + 0.32 * k, round: 0, teeth: 0.8 * k };
};

/* --- the envelope / letter: one object in world space, carried from the satchel to the father's chest --- */
/*
 * Every rig mirror below takes the life clock t (the real frame the Puppets get as lifeF), so the shoulders
 * breathe exactly as Puppet draws them and the solved hands stay on the envelope and the sheet.
 */
const peonBodyRig = (f: number, t: number) => standRig(DAK_PEON, f, blendPose(peonBody, f), peonPlace(f), t);
const fatherBodyRig = (f: number, t: number) => standRig(SURENDRA, f, blendPose(fatherDoorBody, f), FATHER_PLACE, t);
/** The satchel (peon upper-body frame): its centre and its mouth, at the front of his hip. */
const bagCentre = (r: StandRig): Pt => ({ x: r.hwp * 0.9 + 6, y: r.hipY + 6 });
const bagMouth = (r: StandRig): Pt => ({ x: r.hwp * 0.9 + 4, y: r.hipY - 6 });
/** Reading: the far hand's prop origin (the sheet's left edge), lifted toward the light 80-92. */
const readT = (f: number) => lerpPt(LETTER_READ, LETTER_LIFT, smooth((f - 80) / 12));
const readCentre = (f: number, fr: StandRig): Pt => {
  const T = readT(f);
  return fr.toWorld({ x: T.x + LETTER_W / 2, y: fr.rootY + T.y + LETTER_DY }, true);
};
const MISSIVE_OUT = 45;
/** Centre of the envelope (then the open sheet) in world space, how far it is opened (0..1), and whether it shows. */
const missiveAt = (f: number, t: number) => {
  const pr = peonBodyRig(Math.min(f, HAND_F + 2), t);
  const mouth = pr.toWorld(bagMouth(pr));
  const m0 = { x: mouth.x, y: mouth.y + 6 * PEON_S };
  const chest = pr.toWorld({ x: 46, y: pr.rootY + 36 });
  let pt: Pt;
  if (f < HAND_F - 7) pt = lerpPt(m0, chest, smooth((f - MISSIVE_OUT) / 6));
  else if (f <= HAND_F) pt = lerpPt(chest, HANDOVER, smooth((f - (HAND_F - 7)) / 7));
  else pt = lerpPt(HANDOVER, readCentre(f, fatherBodyRig(f, t)), smooth((f - (HAND_F + 2)) / 8));
  return { ...pt, open: smooth((f - (HAND_F + 4)) / 9), visible: f >= MISSIVE_OUT };
};

/** Peon's hands on the envelope (rig units from its centre): both under its bottom edge, presenting it. */
const PEON_NEAR_OFF: Pt = { x: -12, y: 10 };
const PEON_FAR_OFF: Pt = { x: 8, y: 11 };
const PEON_GRIP = 52 * DAK_PEON.height - 2 + 0.5 * 37 * DAK_PEON.height;
/**
 * Peon: the keyed body, with his arms solved onto the satchel and the envelope while he handles it: the near
 * (left) hand dips into the satchel and carries the envelope up and out, the far hand joins underneath, and
 * after the father takes it (HAND_F + 2) both ease back to the keyed pose. `t` is the life clock.
 */
const peonActAt =
  (t: number) =>
  (f: number): Pose => {
    const p = peonBody(f);
    const wL = smooth((f - 39) / 6) * (1 - smooth((f - (HAND_F + 2)) / 6));
    const wR = smooth((f - 47) / 5) * (1 - smooth((f - (HAND_F + 2)) / 6));
    if (wL <= 0 && wR <= 0) return p;
    const pr = standRig(DAK_PEON, f, blendPose(peonBody, f), peonPlace(f), t);
    const m = missiveAt(Math.min(f, HAND_F + 2), t);
    const s = PEON_S;
    const dip = f < 48 ? 10 * Math.sin(Math.PI * clamp((f - 41) / 6)) : 0;
    const near = reachArm(pr, -1, { x: m.x + PEON_NEAR_OFF.x * s, y: m.y + (PEON_NEAR_OFF.y + dip) * s }, PEON_GRIP);
    const far = reachArm(pr, 1, { x: m.x + PEON_FAR_OFF.x * s, y: m.y + PEON_FAR_OFF.y * s }, PEON_GRIP);
    return { ...p, lS: lerp(p.lS, near.S, wL), lE: lerp(p.lE, near.E, wL), rS: lerp(p.rS, far.S, wR), rE: lerp(p.rE, far.E, wR) };
  };

/** Father's hands on it (rig units from its centre): receiving, at its top and right edge; reading, at the sheet's edges. */
const RECV_FAR: Pt = { x: -6, y: -11 };
const RECV_NEAR: Pt = { x: 18, y: 3 };
const READ_FAR: Pt = { x: -LETTER_W / 2, y: -LETTER_DY };
const READ_NEAR: Pt = { x: -LETTER_W / 2 + NEAR_ON_LETTER.x, y: -LETTER_DY + NEAR_ON_LETTER.y };
/**
 * Father: the keyed body; from HAND_F-7 both arms reach out and are solved onto the envelope, take it on the
 * cue and draw it to his chest, where the hands move to the open sheet's edges (the far hand carries its
 * left edge, the near hand holds its right edge). `t` is the life clock.
 */
const fatherDoorActAt =
  (t: number) =>
  (f: number): Pose => {
    const p = fatherDoorBody(f);
    const w = smooth((f - (HAND_F - 7)) / 7);
    if (w <= 0) return p;
    const fr = standRig(SURENDRA, f, blendPose(fatherDoorBody, f), FATHER_PLACE, t);
    const m = missiveAt(f, t);
    const k = smooth((f - (HAND_F + 2)) / 10);
    const fo = lerpPt(RECV_FAR, READ_FAR, k);
    const no = lerpPt(RECV_NEAR, READ_NEAR, k);
    const s = FATHER_WS;
    const far = reachArm(fr, -1, { x: m.x + fo.x * s, y: m.y + fo.y * s }, FATHER_ARM.propD);
    const near = reachArm(fr, 1, { x: m.x + no.x * s, y: m.y + no.y * s }, FATHER_ARM.gripD);
    return { ...p, lS: lerp(p.lS, far.S, w), lE: lerp(p.lE, far.E, w), rS: lerp(p.rS, near.S, w), rE: lerp(p.rE, near.E, w) };
  };

/**
 * The envelope, opening into the letter (rig units, centred on its middle). Closed: a buff envelope with a
 * red wax seal on its flap, a stamp, a postmark and the address. Opening: the flap lifts (0-0.35), the sheet
 * comes out and unfolds to the full letter (0.3-1) while the empty envelope slips away behind it.
 */
const Missive: React.FC<{ x: number; y: number; s: number; open: number }> = ({ x, y, s, open }) => {
  const flap = clamp(open / 0.35);
  const u = smooth((open - 0.3) / 0.7);
  const envO = 1 - smooth((open - 0.55) / 0.35);
  const tipY = -13 + 15 * (1 - 2 * flap);
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {envO > 0 && (
        <g opacity={envO} transform={`translate(0, ${8 * u}) scale(${1 - 0.15 * u})`}>
          <rect x={-20} y={-13} width={40} height={26} rx={1.5} fill="#e6d6ae" stroke="#b39a6a" strokeWidth={1} />
          <path d="M -20 13 L 0 1 L 20 13" stroke="#c4ad7c" strokeWidth={1} fill="none" />
          <path d="M -14 3 h 15 M -12 7 h 17 M -10 11 h 11" stroke="#4a2e16" strokeWidth={1} opacity={0.55} />
          <path d={`M -20 -13 L 0 ${tipY} L 20 -13 Z`} fill="#dccb9e" stroke="#b39a6a" strokeWidth={1} />
          {flap < 0.5 && <circle cx={0} cy={tipY - 2} r={2.6} fill="#a8322a" />}
          <rect x={11} y={-10} width={6} height={7} fill="#b8483a" stroke="#e6d6ae" strokeWidth={0.8} />
          <circle cx={10} cy={-5} r={4.5} stroke="#4a3e5a" strokeWidth={0.8} fill="none" opacity={0.55} />
        </g>
      )}
      {u > 0 && (
        <g transform={`translate(0, ${-6 * (1 - u)})`}>
          <LetterSheet kw={lerp(0.5, 1, u)} kh={lerp(0.3, 1, u)} />
        </g>
      )}
    </g>
  );
};

/**
 * The peon's cloth satchel: a strap from the top of his near shoulder across his chest to the bag at the
 * front of his hip. It is drawn over the Puppet in the Puppet's own frame (its scale, squash and lean), the
 * strap masked away wherever an arm drawn in front of the body passes, so it reads as lying under the arms;
 * the bag is drawn over the hand that dips into it.
 */
const PeonSatchel: React.FC<{ id: string; f: number; rig: StandRig; p: Pose; place: Place }> = ({ id, f, rig, p, place }) => {
  const { hipY, shY, swp } = rig;
  const frontX = rig.B.sw * 0.42 * rig.sphi;
  const bag = bagCentre(rig);
  const sway = 3 * Math.sin(f * 0.3 + 1) * clamp(p.stride / PEON_STRIDE);
  const arms = ([-1, 1] as const)
    .filter((sd) => !rig.far(sd))
    .map((sd) => {
      const r = rig.root(sd);
      const S = sd > 0 ? p.rS : p.lS;
      const E = sd > 0 ? p.rE : p.lE;
      const e = armPoint(sd, rig.B.ua, S, E, 0);
      const t = armPoint(sd, rig.B.ua, S, E, rig.B.fa - 2 + rig.B.hand);
      return `M ${r.x} ${r.y} L ${r.x + e.x} ${r.y + e.y} L ${r.x + t.x} ${r.y + t.y}`;
    });
  const p1 = { x: -swp * 0.5, y: shY + 1 };
  const p2 = { x: bag.x + 10, y: bag.y - 12 };
  const strap = `M ${p1.x} ${p1.y} Q ${frontX + 6} ${shY + rig.B.torsoLen * 0.5} ${p2.x} ${p2.y}`;
  return (
    <g transform={`translate(${place.x + p.bodyX}, ${place.y + p.bodyY}) scale(${place.s * (1 + rig.b)}, ${place.s * (1 - rig.b)})`}>
      <g transform={`rotate(${p.lean}, 0, ${hipY})`}>
        <defs>
          <mask id={id} maskUnits="userSpaceOnUse" x={-400} y={-700} width={800} height={900}>
            <rect x={-400} y={-700} width={800} height={900} fill="#fff" />
            {arms.map((d, i) => (
              <path key={i} d={d} stroke="#000" strokeWidth={rig.B.limbW * 3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
          </mask>
        </defs>
        <g mask={`url(#${id})`}>
          <path d={strap} stroke="#5e4026" strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d={strap} stroke="#8a6a46" strokeWidth={1} fill="none" strokeDasharray="3 3" opacity={0.7} />
        </g>
        <g transform={`translate(${bag.x}, ${bag.y}) rotate(${sway}, 0, -14)`}>
          <path d="M -19 -13 L 19 -13 L 17 14 Q 0 20 -17 14 Z" fill="#8a6440" stroke="#5e4026" strokeWidth={1.2} />
          <path d="M -15 2 Q 0 6 15 2" stroke="#6e4e30" strokeWidth={1} fill="none" opacity={0.6} />
          <path d="M -20 -15 L 20 -15 L 18 1 Q 0 6 -18 1 Z" fill="#7a5634" stroke="#5e4026" strokeWidth={1.2} />
          <circle cx={0} cy={2} r={2.2} fill="#c9a45a" />
        </g>
      </g>
    </g>
  );
};

/**
 * The father's face anchor for the push in (his head while he reads in the doorway).
 */
const FATHER_DOOR_FACE: Pt = { x: FATHER_DOOR_X + 2, y: PLINTH_Y - ADULT_HEAD_Y * SURENDRA.height * FATHER_WS };

/** The lantern hanging in the veranda arch beside the main door (it flickers behind the father). */
const LANTERN = { x: bariX(1100), y: bariY(668), s: 0.5 };
/** Rainy-day light: only warm sources (the lantern and the lamp inside the door), so every rim stays warm. */
const DAY_LIGHTS: SceneLight[] = [
  { x: LANTERN.x, y: LANTERN.y + 20, color: "#ffc27a", intensity: 0.35, radius: 520, flicker: 7 },
  { x: BARI_DOOR.x, y: 600, color: "#ffc890", intensity: 0.22, radius: 700 },
];
const DAY_GRADE = { warmth: 0.08, vignette: 0.42, bloomAt: [50, 40] as [number, number], tint: "#5d6878", tintAmount: 0.16 };
const FATHER_RIM = { keySide: -1 as const, rim: "#f2b68e", rimStrength: 0.45 };

/**
 * Shots 1, 3 and 4a: the main door in the rain. A held medium two-shot (the open pause and the line "অন্নপ্রাশনের
 * আগেই বাবা"), then ONE slow push in starting on "সুরেন্দ্রচন্দ্রের" to x1.4 of the two-shot, ending on Surendra
 * (face high in frame, the letter in his hands above the caption band), held through the first second of the news
 * pause. The push is anchored on his face, so it never swims; in it the peon goes soft behind him.
 */
const TWO_SHOT: Cam = { x: 556 - 960, y: 562 - 540, zoom: 1.8, focus: 1, dof: 1.2 };
const PUSH_K = 1.4;
const PUSH_FRAMES = 72;
const ShotHandover: React.FC<{ h: number }> = ({ h }) => {
  const o = handF(h);
  const wP = smooth((h - H_PUSH) / PUSH_FRAMES);
  const cam = faceCam(TWO_SHOT, FATHER_DOOR_FACE, TWO_SHOT.zoom * PUSH_K, 400, wP);
  const peonAct = peonActAt(h);
  const fatherAct = fatherDoorActAt(h);
  const place = peonPlace(o);
  const drawn = blendPose(peonAct, o);
  const rig = standRig(DAK_PEON, o, drawn, place, h);
  const m = missiveAt(o, h);
  const inBag = o < 48;
  const missive = m.visible ? <Missive x={m.x} y={m.y} s={FATHER_WS} open={m.open} /> : null;
  const thumbO = smooth((m.open - 0.6) / 0.3);
  return (
    <Stage cam={cam} background="#7d8794" opacity={1}>
      <SceneLights.Provider value={DAY_LIGHTS}>
        <Layer depth={0.08}>
          <RainySky id="ep2e-sky-door" />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <WetCourtyard f={h} />
          <BariRainyDay f={h} />
          <BariSteps />
          <HurricaneLantern x={LANTERN.x} y={LANTERN.y} f={h} s={LANTERN.s} />
          <Palm x={30} y={PATH_Y - 4} s={1.7} c="#3e4a40" />
          <TulsiMancha x={250} y={PATH_Y + 10} f={h} s={0.62} />
          {/* in the push the peon goes soft (out of focus behind the father) */}
          <defs>
            <filter id="ep2e-peon-soft" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation={1.6 * wP} />
            </filter>
          </defs>
          <g filter={wP > 0.01 ? "url(#ep2e-peon-soft)" : undefined} opacity={1 - 0.12 * wP}>
            <Puppet cast={DAK_PEON} f={o} lifeF={h} x={place.x} y={place.y} scale={PEON_S} acting={peonAct} light={WALK_RIM} props={{ pumb: P_PEON_UMBRELLA }} stillness={1} />
            {/* while it comes out of the satchel the envelope is drawn under the bag's flap */}
            {inBag && missive}
            <PeonSatchel id="ep2e-peon-strap" f={o} rig={rig} p={drawn} place={place} />
          </g>
          <Puppet cast={SURENDRA} f={o} lifeF={h} x={FATHER_DOOR_X} y={PLINTH_Y} scale={FATHER_WS} acting={fatherAct} mouth={fatherDoorMouth} light={FATHER_RIM} stillness={1} />
          {!inBag && missive}
          {thumbO > 0 && (
            <g opacity={thumbO} transform={`translate(${m.x - (LETTER_W / 2) * FATHER_WS}, ${m.y - LETTER_DY * FATHER_WS}) scale(${FATHER_WS})`}>
              <FarThumb />
            </g>
          )}
          <Splashes f={h} n={14} seed={9} y0={PLINTH_Y + 2} y1={PLINTH_Y + 12} x0={-200} x1={BARI_DOOR.l - 10} o={0.35} />
          <Splashes f={h} n={44} seed={4} y0={PATH_Y + 8} y1={1060} x0={-200} x1={2600} o={0.4} />
        </Layer>
        <Layer depth={1.35}>
          <Rain f={h} n={220} seed={3} wind={0.3} o={0.55} color="#e4ebf3" />
        </Layer>
        <Grade {...DAY_GRADE} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Shot 4b: he calls inside; Charu with Balak and Thakurma come to the door */
/* ------------------------------------------------------------------ */

/*
 * The last two seconds of the news pause, on the real clock (u = h - CUT_CALL). A medium wide of the main door:
 * Surendra, just inside it, turns his head over his shoulder and calls into the house (two short calls, u 3-16),
 * the open letter in both hands. Charu comes from inside, Balak in a cradle hold, walking into the doorway from
 * behind the right jamb (she shows from u 2 and stops by u 22); Thakurma follows (stops by u 30). Charu: surprise
 * (u 20-26), joy (u 28-34), a glance back into the house with a touch of sadness at leaving (u 36-44), then back to
 * her husband. Thakurma: surprise, then joy with a hand on her chest. Balak, calm, looks at his father. The peon
 * is still walking away along the veranda at the left under his umbrella (the same figure as in 4a).
 */
const CALL_CAM: Cam = { x: 705 - 960, y: 592 - 540, zoom: 1.6, focus: 1, dof: 1.2 };
const CALL_CHARU_STOP = 762;
const CALL_THAK_STOP = 846;
/** Walking speed (0..1) into the doorway: full pace, then easing to a stop. */
const callSpeedC = (u: number) => 1 - smooth((u - 10) / 14);
const callSpeedT = (u: number) => 1 - smooth((u - 16) / 14);
/** Ground left to cover from frame u (walking left, so x = stop + v * remaining). */
const remaining = (speed: (u: number) => number, u: number) => {
  let d = 0;
  for (let g = Math.round(u); g < 60; g++) d += speed(g);
  return d;
};
const callCharuX = (u: number) => CALL_CHARU_STOP + WS * WALK_V * CHARU_STEP * remaining(callSpeedC, u);
const callThakX = (u: number) => CALL_THAK_STOP + WS * WALK_V * remaining(callSpeedT, u);
const callCharuPlace = (u: number): CharuPlace => ({ x: callCharuX(u), y: PLINTH_Y, s: CHARU_WS, seated: false });

/** The father's call: the letter held in both hands (its far edge at LETTER_LIFT, lifted a little to show it at u 26-34). */
const callFatherKeys: PoseKey<Pose>[] = [
  // the state he ends 4a in: glancing up from the letter toward the house, beaming
  { f: -4, bodyTurn: FATHER_READ_TURN, headNod: -2, headTurn: 0.35, headTilt: -5, eyeY: -0.3, eyeX: 0.4, smile: 1.2, brow: 1.05, browTilt: 0.35, cheeks: 0.25, tears: 0.1, rHand: "hold", lHand: "hold" },
  // turns his head over his shoulder and calls into the house
  { f: 6, headTurn: 0.7, headTilt: -2, headNod: -3, eyeX: 0.95, eyeY: -0.1, smile: 0.85, brow: 1.1, ease: "inOut", in: 8 },
  // Charu appears: he turns a little toward her, beaming (the body stays turned enough that the far arm stays far)
  { f: 20, bodyTurn: -0.47, headTurn: 0.6, headNod: 0, eyeX: 0.85, eyeY: 0, smile: 1.15, brow: 1.0, ease: "inOut", in: 10 },
  // a happy nod as he shows her the letter
  { f: 30, headNod: 5, eyeY: 0.1, in: 6 },
  { f: 40, headNod: 0, headTurn: 0.55, eyeY: 0, ease: "inOut", in: 10 },
];
const callFatherBody = makeActing<Pose>(BASE_POSE, callFatherKeys);
const callLetterT = (u: number): Pt => lerpPt(LETTER_LIFT, { x: -100, y: 4 }, smooth((u - 26) / 8));
const callLetterCentre = (u: number, fr: StandRig): Pt => {
  const T = callLetterT(u);
  return fr.toWorld({ x: T.x + LETTER_W / 2, y: fr.rootY + T.y + LETTER_DY }, true);
};
const callFatherRig = (u: number, t: number) => standRig(SURENDRA, u, blendPose(callFatherBody, u), FATHER_PLACE, t);
/** Both hands stay on the sheet's edges every frame (solved), as in the reading hold of shots 3 and 4a. */
const callFatherActAt =
  (t: number) =>
  (u: number): Pose => {
    const p = callFatherBody(u);
    const fr = callFatherRig(u, t);
    const m = callLetterCentre(u, fr);
    const s = FATHER_WS;
    const far = reachArm(fr, -1, { x: m.x + READ_FAR.x * s, y: m.y + READ_FAR.y * s }, FATHER_ARM.propD);
    const near = reachArm(fr, 1, { x: m.x + READ_NEAR.x * s, y: m.y + READ_NEAR.y * s }, FATHER_ARM.gripD);
    return { ...p, lS: far.S, lE: far.E, rS: near.S, rE: near.E };
  };
/** Two short calls into the house, then the broad smile with teeth he had in 4a. */
const callFatherMouth = (u: number): MouthState => {
  const pulse = (a: number, b: number) => smooth((u - a) / 2) * (1 - smooth((u - b) / 3));
  const call = Math.max(pulse(3, 8), 0.8 * pulse(10, 15));
  return { open: 0.11 + 0.3 * call, width: 1.32 - 0.25 * call, round: 0.35 * call, teeth: 0.8 * (1 - call) };
};

const callCharuKeys: PoseKey<Pose>[] = [
  // comes into the doorway with Balak, looking ahead to her husband who called
  { f: -30, crouch: 0, rHand: "cup", lHand: "cup", stride: strideFor(CHARU_S, CH), bodyTurn: -WALK_TURN, lean: 1, headTilt: 2, headTurn: 0, headNod: 4, eyeX: -0.6, eyeY: 0.05, smile: 0.35, brow: 0.45 },
  // stops, turning a little toward the camera (the far arm stays far: bodyTurn below -0.42)
  { f: 22, bodyTurn: -0.5, lean: 0, ease: "inOut", in: 10 },
  // surprise: brows up, eyes wide on him
  { f: 24, brow: 1.0, browTilt: 0, eyeY: -0.1, eyeX: -0.7, smile: 0.15, headNod: 0, ease: "inOut", in: 5 },
  // then joy
  { f: 33, smile: 0.85, brow: 0.6, eyeY: 0, headNod: 4, ease: "inOut", in: 7 },
  // a glance back into the house: a touch of sadness at leaving it
  { f: 41, headTurn: 0.55, headNod: 6, eyeX: 0.85, eyeY: 0.15, smile: 0.3, brow: 0.5, browTilt: 0.45, tears: 0.15, ease: "inOut", in: 8 },
  // and back to him, a soft smile
  { f: 52, headTurn: 0, headNod: 3, eyeX: -0.65, eyeY: 0, smile: 0.55, browTilt: 0.2, ease: "inOut", in: 9 },
];
const callCharuBody = withGait(makeActing<Pose>(BASE_POSE, callCharuKeys), { seed: CHARU_SEED, speed: callSpeedC, strideK: CHARU_STEP, bob: 3.2 });
/** Her mouth: a small "oh" of surprise, then a parted smile. */
const callCharuMouth = (u: number): MouthState => {
  const oh = smooth((u - 21) / 3) * (1 - smooth((u - 28) / 4));
  const joy = smooth((u - 29) / 5) * (1 - smooth((u - 38) / 6));
  return { open: 0.04 + 0.14 * oh + 0.05 * joy, width: 1 - 0.12 * oh + 0.15 * joy, round: 0.65 * oh, teeth: 0.4 * joy };
};
/** Charu in 4b: the keyed walk and face, with both arms solved onto Balak every frame (t = life clock). */
const callCharuActAt =
  (t: number) =>
  (u: number): Pose => {
    const place = callCharuPlace(u);
    const rig = charuRig(u, blendPose(callCharuBody, u), place, t);
    return { ...callCharuBody(u), ...cradleArms(rig, -1, cradlePose(rig, -1, place), HOLD_NEAR, HOLD_FAR) };
  };

const callThakKeys: PoseKey<Pose>[] = [
  { f: -30, stride: strideFor(1.25, THAKURMA.height), bodyTurn: -WALK_TURN, headTurn: 0, eyeX: -0.5, eyeY: 0, smile: 0.3, brow: 0.4, lS: 6, lE: -12, lHand: "relaxed", rS: 6, rE: -12, rHand: "relaxed" },
  { f: 30, bodyTurn: -0.45, ease: "inOut", in: 10 },
  // surprise, then joy with her near hand on her chest (relaxed shape)
  { f: 31, brow: 0.95, eyeY: -0.1, eyeX: -0.75, smile: 0.2, in: 5 },
  { f: 40, smile: 0.75, brow: 0.6, headNod: 5, rS: -8, rE: -128, rHand: "relaxed", ease: "inOut", in: 9 },
];
const callThakBody = withGait(makeActing<Pose>(BASE_POSE, callThakKeys), { seed: THAKURMA.seed, speed: callSpeedT, swingL: 10, swingR: 12, bob: 3.6 });

const ShotCall: React.FC<{ h: number }> = ({ h }) => {
  const u = h - CUT_CALL;
  const o = handF(h);
  // the peon walking away along the veranda (the same figure and clock as in 4a)
  const peonAct = peonActAt(h);
  const pPlace = peonPlace(o);
  const pDrawn = blendPose(peonAct, o);
  const pRig = standRig(DAK_PEON, o, pDrawn, pPlace, h);
  // the father and his letter
  const fatherAct = callFatherActAt(h);
  const fr = callFatherRig(u, h);
  const letter = callLetterCentre(u, fr);
  // Charu, Balak in her cradle, and Thakurma, coming into the doorway
  const charuAct = callCharuActAt(h);
  const cPlace = callCharuPlace(u);
  const cDrawn = blendPose(charuAct, u);
  const cRig = charuRig(u, cDrawn, cPlace, h);
  const nb = cradlePose(charuRig(u, blendPose(callCharuBody, u), cPlace, h), -1, cPlace);
  const charu = <Puppet cast={CAST.charu} f={u} lifeF={h} x={cPlace.x} y={cPlace.y} scale={CHARU_WS} acting={charuAct} mouth={callCharuMouth} light={WALK_RIM} stillness={1} />;
  return (
    <Stage cam={CALL_CAM} background="#7d8794" opacity={1}>
      <SceneLights.Provider value={DAY_LIGHTS}>
        <Layer depth={0.08}>
          <RainySky id="ep2e-sky-call" />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <DivineDefs />
          <defs>
            {/* figures still inside the house are hidden behind the right jamb of the main door */}
            <clipPath id="ep2e-call-inside">
              <rect x={-1000} y={-1000} width={BARI_DOOR.r + 1000} height={3000} />
            </clipPath>
          </defs>
          <WetCourtyard f={h} />
          <BariRainyDay f={h} />
          <BariSteps />
          <HurricaneLantern x={LANTERN.x} y={LANTERN.y} f={h} s={LANTERN.s} />
          <Palm x={30} y={PATH_Y - 4} s={1.7} c="#3e4a40" />
          <TulsiMancha x={250} y={PATH_Y + 10} f={h} s={0.62} />
          <Puppet cast={DAK_PEON} f={o} lifeF={h} x={pPlace.x} y={pPlace.y} scale={PEON_S} acting={peonAct} light={WALK_RIM} props={{ pumb: P_PEON_UMBRELLA }} stillness={1} />
          <PeonSatchel id="ep2e-call-strap" f={o} rig={pRig} p={pDrawn} place={pPlace} />
          <g clipPath="url(#ep2e-call-inside)">
            <Puppet cast={THAKURMA} f={u} lifeF={h} x={callThakX(u)} y={PLINTH_Y} scale={THAKURMA_WS} acting={callThakBody} light={WALK_RIM} stillness={0.3} />
            {charu}
            {/* Balak in her cradle, calm, looking at his father; then her near forearm and both hands over him */}
            <g transform={`translate(${nb.x}, ${nb.y}) rotate(${nb.rot}) scale(${nb.m * nb.k}, ${nb.k})`}>
              <Swaddled f={u} lifeF={h} x={0} y={0} dx={0} limp lookX={0.75} lookY={-0.15} smile={0.5} />
            </g>
            <CradleFront id="ep2e-cradle-call" f={u} rig={cRig} p={cDrawn} place={cPlace} fwd={-1} lights={DAY_LIGHTS} opacity={1}>
              {charu}
            </CradleFront>
          </g>
          <Puppet cast={SURENDRA} f={u} lifeF={h} x={FATHER_DOOR_X} y={PLINTH_Y} scale={FATHER_WS} acting={fatherAct} mouth={callFatherMouth} light={FATHER_RIM} stillness={1} />
          <Missive x={letter.x} y={letter.y} s={FATHER_WS} open={1} />
          <g transform={`translate(${letter.x - (LETTER_W / 2) * FATHER_WS}, ${letter.y - LETTER_DY * FATHER_WS}) scale(${FATHER_WS})`}>
            <FarThumb />
          </g>
          <Splashes f={h} n={14} seed={9} y0={PLINTH_Y + 2} y1={PLINTH_Y + 12} x0={-200} x1={BARI_DOOR.l - 10} o={0.35} />
          <Splashes f={h} n={44} seed={4} y0={PATH_Y + 8} y1={1060} x0={-200} x1={2600} o={0.4} />
        </Layer>
        <Layer depth={1.35}>
          <Rain f={h} n={220} seed={3} wind={0.3} o={0.55} color="#e4ebf3" />
        </Layer>
        <Grade {...DAY_GRADE} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Set pieces: the Baidik Bari on a grey rainy day                    */
/* ------------------------------------------------------------------ */

/** Inner-courtyard scale (set units) for the view through the open main door. */
const CY_S = 0.17;

/** Mangal ghat: a brass pot crowned with mango leaves, either side of the door (set units). */
const MangalGhat: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x}, ${y}) scale(0.22)`}>
    <BrassPot x={0} y={0} />
    {[-30, -10, 10, 30].map((a) => (
      <path key={a} d="M 0 -60 q 14 -40 4 -86 q -16 42 -4 86 Z" fill="#4f8a3a" transform={`rotate(${a}, 0, -60)`} />
    ))}
  </g>
);

/**
 * The Baidik Bari on a grey rainy day, in its own set coordinates (BaidikBariDay, untouched): the day set under
 * a soft grey wash (the overcast takes the sun out of the brick), wet sheen on the cornices and the plinth, the
 * auspicious decorations for the journey (a marigold garland and a mango-leaf toran over the door, a mangal ghat
 * either side) and the open main door, with the inner courtyard (CourtyardBack and CourtyardFloor) seen through it
 * between the two carved door leaves folded back inside, and a warm lamp glowing in there.
 */
const BariRainyDay: React.FC<{ f: number }> = ({ f }) => {
  const lamp = clamp(0.86 + 1.2 * (flicker(f, 5) - 0.86), 0.6, 1);
  return (
    <g transform={`translate(${BARI.X}, ${BARI.Y}) scale(${BARI.K})`}>
      <defs>
        <clipPath id="ep2e-bari-door">
          <path d="M 870 740 L 870 600 Q 960 520 1050 600 L 1050 740 Z" />
        </clipPath>
      </defs>
      <BaidikBariDay f={f} />
      {/* overcast: a grey wash takes the sun out of the brick */}
      <rect x={-1300} y={226} width={4300} height={580} fill="#55606e" opacity={0.36} />
      {/* wet sheen along the cornices and the plinth edge */}
      <rect x={140} y={300} width={1640} height={3} fill="#e6edf4" opacity={0.3} />
      <rect x={140} y={523} width={1640} height={3} fill="#e6edf4" opacity={0.3} />
      <rect x={-700} y={712} width={3300} height={3} fill="#e6edf4" opacity={0.22} />
      {/* rain streaks running down the walls */}
      {Array.from({ length: 26 }, (_, i) => (
        <line key={i} x1={180 + i * 62} y1={310} x2={182 + i * 62} y2={340 + 30 * hash(i + 7)} stroke="#3c4652" strokeWidth={2} opacity={0.18} />
      ))}
      {/* the open main door: the inner courtyard beyond, and a lamp lit inside against the grey day */}
      <g clipPath="url(#ep2e-bari-door)">
        <rect x={860} y={510} width={200} height={240} fill="#5a5048" />
        <g transform={`translate(${960 - 960 * CY_S}, ${690 - 784 * CY_S}) scale(${CY_S})`}>
          <CourtyardBack f={f} />
          <CourtyardFloor f={f} />
        </g>
        <rect x={860} y={510} width={200} height={240} fill="#3c4250" opacity={0.3} />
        {/* carved wooden door leaves folded back inside the jambs: panels and brass studs */}
        {[870, 1028].map((x) => (
          <g key={x}>
            <rect x={x} y={560} width={22} height={180} fill="#4a2810" />
            <rect x={x + 3} y={590} width={16} height={60} fill="none" stroke="#2a1608" strokeWidth={1.4} />
            <rect x={x + 3} y={660} width={16} height={70} fill="none" stroke="#2a1608" strokeWidth={1.4} />
            <path d={`M ${x + 6} 620 q 5 -10 10 0 q -5 10 -10 0 Z`} fill="#6a3a18" />
            {[600, 640, 670, 700, 725].map((y) => (
              <circle key={y} cx={x + 11} cy={y} r={1.6} fill="#d8a84a" />
            ))}
          </g>
        ))}
        <Glow x={960} y={690} r={80} kind="warm" o={0.22 * lamp} />
      </g>
      {/* carved frame around the door */}
      <path d="M 864 740 L 864 598 Q 960 512 1056 598 L 1056 740" stroke="#5a3016" strokeWidth={6} fill="none" />
      <path d="M 858 740 L 858 596 Q 960 504 1062 596 L 1062 740" stroke="#8a5a2e" strokeWidth={2} fill="none" opacity={0.7} />
      {/* mango-leaf toran across the door, marigold garland on the gate block */}
      {Array.from({ length: 11 }, (_, i) => {
        const x = 874 + i * 17.2;
        const y = 592 - Math.sin((i / 10) * Math.PI) * 26;
        return <path key={i} d={`M ${x} ${y} q -4 10 0 18 q 4 -8 0 -18 Z`} fill={i % 2 ? "#3e7a2e" : "#5a9a3a"} />;
      })}
      <Garland x1={852} y1={506} x2={1068} y2={506} sag={26} s={0.45} f={f} />
      <MangalGhat x={838} y={728} />
      <MangalGhat x={1082} y={728} />
    </g>
  );
};

/** The flight of three steps from the veranda (the plinth top) down to the courtyard path, wet in the rain. */
const BariSteps: React.FC = () => (
  <g>
    {[0, 1, 2].map((i) => {
      const y = PLINTH_Y + i * STEP_RISE;
      const x0 = STEPS_X0 + i * 10;
      const x1 = STEPS_X1 - i * 10;
      return (
        <g key={i}>
          <rect x={x0} y={y} width={x1 - x0} height={STEP_RISE + 4} fill="#5a4a42" />
          <rect x={x0} y={y + 10} width={x1 - x0} height={STEP_RISE - 6} fill="#76645a" />
          <rect x={x0} y={y + 10} width={x1 - x0} height={2} fill="#e6edf4" opacity={0.35} />
        </g>
      );
    })}
    {/* side cheeks */}
    {[STEPS_X0 - 26, STEPS_X1].map((x) => (
      <g key={x}>
        <rect x={x} y={PLINTH_Y - 8} width={26} height={PATH_Y - PLINTH_Y + 8} fill="#64544a" />
        <rect x={x - 3} y={PLINTH_Y - 12} width={32} height={6} fill="#86726a" />
      </g>
    ))}
  </g>
);

/** Puddles on the courtyard path: [x, y, rx, colour, opacity]. They hold the pale grey sky. */
const PUDDLES: Array<[number, number, number, string, number]> = [
  [700, 834, 120, "#c4ccd4", 0.3],
  [1300, 846, 90, "#c4ccd4", 0.24],
  [330, 862, 100, "#b4bcc6", 0.26],
  [1060, 880, 140, "#b4bcc6", 0.24],
  [1640, 840, 110, "#c4ccd4", 0.22],
  [1980, 870, 120, "#b4bcc6", 0.26],
];

/** Wet courtyard path in front of the house: dark wet earth, puddles holding the sky, grass at the edge. */
const WetCourtyard: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="ep2e-wetpath" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5e5048" />
        <stop offset="100%" stopColor="#3a302a" />
      </linearGradient>
    </defs>
    <rect x={-900} y={PATH_Y - 6} width={4200} height={700} fill="url(#ep2e-wetpath)" />
    <path
      d={`M -900 ${PATH_Y + 30} Q 900 ${PATH_Y + 18} 3300 ${PATH_Y + 34} L 3300 ${PATH_Y + 96} Q 900 ${PATH_Y + 84} -900 ${PATH_Y + 102} Z`}
      fill="#6e5e52"
      opacity={0.85}
    />
    {PUDDLES.map(([x, y, rx, c, o], i) => (
      <ellipse key={i} cx={x} cy={y} rx={rx * (1 + 0.03 * Math.sin(f * 0.2 + i))} ry={8} fill={c} opacity={o} />
    ))}
    {Array.from({ length: 30 }, (_, i) => (
      <path
        key={i}
        d={`M ${-700 + i * 130} ${PATH_Y + 4 + hash(i) * 10} q 4 -14 10 -2 M ${-700 + i * 130 + 8} ${PATH_Y + 4 + hash(i) * 10} q 4 -10 8 0`}
        stroke="#4e6a3e"
        strokeWidth={2}
        fill="none"
        opacity={0.8}
      />
    ))}
  </g>
);

/**
 * The boundary gate at the right end of the courtyard path: two plastered pillars, an arch between them, and
 * the compound wall running on to the right. Through it the grey road shows, with the bullock cart waiting.
 */
const GATE = { l: 1820, r: 2040, pw: 50, top: 420, arch: 360 };
const BoundaryGate: React.FC = () => {
  const { l, r, pw, top, arch } = GATE;
  const mid = (l + r) / 2;
  return (
    <g>
      {/* the view through the gate: pale sky, far trees, the road and the waiting cart */}
      <rect x={l} y={arch} width={r - l} height={PATH_Y - arch} fill="#a8b0ba" />
      <rect x={l} y={PATH_Y - 130} width={r - l} height={60} fill="#6c7a6a" />
      <rect x={l} y={PATH_Y - 70} width={r - l} height={70} fill="#7a6a5c" />
      <g fill="#3a3028">
        <path d={`M ${mid - 60} ${PATH_Y - 40} L ${mid + 40} ${PATH_Y - 40} L ${mid + 40} ${PATH_Y - 50} Q ${mid - 10} ${PATH_Y - 100} ${mid - 60} ${PATH_Y - 50} Z`} />
        <circle cx={mid - 10} cy={PATH_Y - 26} r={16} fill="none" stroke="#3a3028" strokeWidth={4} />
        <ellipse cx={mid + 78} cy={PATH_Y - 48} rx={28} ry={12} />
        <rect x={mid + 58} y={PATH_Y - 40} width={4} height={24} />
        <rect x={mid + 92} y={PATH_Y - 40} width={4} height={24} />
        <line x1={mid + 40} y1={PATH_Y - 44} x2={mid + 66} y2={PATH_Y - 50} stroke="#3a3028" strokeWidth={3} />
      </g>
      {/* compound wall on to the right */}
      <rect x={r + pw} y={PATH_Y - 220} width={1400} height={220} fill="#8a6a58" />
      <rect x={r + pw} y={PATH_Y - 228} width={1400} height={10} fill="#a4826c" />
      <rect x={r + pw} y={PATH_Y - 218} width={1400} height={3} fill="#e6edf4" opacity={0.25} />
      {/* arch and pillars */}
      <path d={`M ${l - pw} ${top} L ${l - pw} ${top - 20} Q ${mid} ${arch - 90} ${r + pw} ${top - 20} L ${r + pw} ${top} L ${r} ${top} Q ${mid} ${arch - 30} ${l} ${top} Z`} fill="#8e6e5c" />
      {[l - pw, r].map((x, i) => (
        <g key={x}>
          <rect x={x} y={top} width={pw} height={PATH_Y - top} fill="#9a7a66" />
          <rect x={x + (i ? 0 : pw - 6)} y={top} width={6} height={PATH_Y - top} fill="#c0a08a" opacity={0.5} />
          <rect x={x - 6} y={top - 30} width={pw + 12} height={12} fill="#a8887a" />
        </g>
      ))}
    </g>
  );
};

/** A mango tree beyond the gate: a broad dark crown over a short trunk. Base at (x, y). */
const MANGO_CROWN: Array<[number, number, number, number]> = [[-110, -300, 130, 100], [60, -320, 150, 110], [-20, -400, 150, 100], [-150, -390, 90, 70], [140, -420, 100, 70]];
const MangoTree: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <path d="M -18 0 Q -10 -120 -24 -220 L 20 -220 Q 8 -120 18 0 Z" fill="#3a2e24" />
    {MANGO_CROWN.map(([cx, cy, rx, ry], i) => (
      <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={i % 2 ? "#36503a" : "#41603e"} />
    ))}
  </g>
);

/* The household seeing them off: a woman at the door (raises her hand), an elder in a veranda arch. */
const DOOR_WOMAN = { x: 405, s: 0.8 };
/** The elder stands in the second arch left of the door, clear of the walkers' path (no umbrella passes over him). */
const VERANDA_ELDER = { x: bariX(290 + 2 * 168), s: FATHER_WS };
const doorWomanKeyed = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.55, headTurn: 0.25, eyeX: 0.5, eyeY: 0.1, smile: 0.4, brow: 0.55, browTilt: 0.2, lS: 10, lE: -70 },
  // raises her right hand in farewell as the father reaches the steps (168-178)
  { f: 178, rS: 150, rE: 30, rHand: "open", headTurn: 0.45, eyeX: 0.75, smile: 0.5, in: 10 },
]);
/** A slow wave of the raised hand once it is up. */
const doorWomanAct = (f: number): Pose => {
  const p = doorWomanKeyed(f);
  return { ...p, rE: p.rE + 10 * smooth((f - 176) / 6) * Math.sin((f - 176) * 0.32) };
};
const verandaElderAct = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0.45, headTurn: 0.3, eyeX: 0.6, eyeY: 0.1, smile: 0.35, brow: 0.45, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam" },
  // a slow bow over his joined hands as the family comes down the steps (178-190)
  { f: 190, headNod: 8, headTurn: 0.4, in: 12 },
]);

const WALK_RIM = { keySide: -1 as const, rim: "#ffb070", rimStrength: 0.4 };

/* ------------------------------------------------------------------ */
/* Shot 5: the wide of the house front, the family sets out            */
/* ------------------------------------------------------------------ */

/**
 * The side walk was authored on its own clock (old frames: the father out of the door at 152, the walk easing in
 * from WALK0). It plays on the story clock with the cut on "সবাইকে" landing on old frame 152.
 */
const WALK_CUT_OLD = 152;
const walkOld = (f: number) => f - L5.from + WALK_CUT_OLD;

/**
 * Shot 5: CUT on "সবাইকে নিয়ে তিনি চলে গেলেন উজানচর" to the wide of the house front, and ONE slow pan following the
 * family out of the main door, down the steps and along the path toward the gate (the camera moves at a little
 * under their pace and eases in with them; no close-ups inside it). The whole family, the woman at the door and the
 * elder on the veranda stay in the frame, feet above the caption band.
 */
const ShotWalk: React.FC<{ f: number; lifeF: number }> = ({ f: fs, lifeF }) => {
  const f = walkOld(fs);
  const cam: Cam = { x: departCamX(f), y: 0, zoom: 1.04, focus: 1, dof: 1.2 };
  const v = charuX(f) - charuX(f - 1);
  // Charu's drawn pose and the newborn in her cradle, in the same space as her Puppet
  const walkCharuAct = walkCharuActAt(lifeF);
  const place = walkPlace(f);
  const drawn = blendPose(walkCharuAct, f);
  const rig = charuRig(f, drawn, place, lifeF);
  const nb = cradlePose(charuRig(f, blendPose(charuAct, f), place, lifeF), 1, place);
  const charu = <Puppet cast={CAST.charu} f={f} lifeF={lifeF} x={place.x} y={place.y} scale={CHARU_WS} acting={walkCharuAct} light={WALK_RIM} stillness={1} />;

  return (
    <Stage cam={cam} background="#7d8794" opacity={1}>
      <SceneLights.Provider value={DAY_LIGHTS}>
        <Layer depth={0.08}>
          <RainySky id="ep2e-sky-walk" f={lifeF} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <DivineDefs />
          <defs>
            {/* walkers still inside the house are hidden by the wall left of the door */}
            <clipPath id="ep2e-outdoor">
              <rect x={BARI_DOOR.l} y={-1000} width={6000} height={3000} />
            </clipPath>
          </defs>
          <WetCourtyard f={lifeF} />
          <BariRainyDay f={lifeF} />
          <BariSteps />
          <HurricaneLantern x={LANTERN.x} y={LANTERN.y} f={lifeF} s={LANTERN.s} />
          <Palm x={30} y={PATH_Y - 4} s={1.7} c="#3e4a40" />
          <TulsiMancha x={250} y={PATH_Y + 10} f={lifeF} s={0.62} />
          <MangoTree x={2230} y={PATH_Y - 10} s={1.1} />
          <BoundaryGate />
          {/* the household on the veranda, behind the walkers */}
          <Puppet cast={CAST.womanA} f={f} lifeF={lifeF} x={DOOR_WOMAN.x} y={PLINTH_Y} scale={DOOR_WOMAN.s} acting={doorWomanAct} light={WALK_RIM} stillness={0.3} />
          <Puppet cast={CAST.kedarkaka} f={f} lifeF={lifeF} x={VERANDA_ELDER.x} y={PLINTH_Y} scale={VERANDA_ELDER.s} acting={verandaElderAct} light={WALK_RIM} stillness={0.3} />
          {/* the family, out of the door and down the steps: Thakurma last, Charu with Balak, the father leading */}
          <g clipPath="url(#ep2e-outdoor)">
            <Puppet cast={THAKURMA} f={f} lifeF={lifeF} x={thakurmaX(f)} y={thakurmaY(f)} scale={THAKURMA_WS} acting={thakurmaAct} light={WALK_RIM} props={{ basket: P_BASKET }} stillness={0.3} />
            {charu}
            {/* the newborn in the cradle, then her near forearm and both hands drawn over him */}
            <g transform={`translate(${nb.x}, ${nb.y}) rotate(${nb.rot}) scale(${nb.m * nb.k}, ${nb.k})`}>
              <Swaddled f={f} lifeF={lifeF} x={0} y={0} dx={v * 0.5} />
            </g>
            <CradleFront id="ep2e-cradle-walk" f={f} rig={rig} p={drawn} place={place} fwd={1} lights={DAY_LIGHTS} opacity={1}>
              {charu}
            </CradleFront>
            <Puppet
              cast={SURENDRA}
              f={f}
              lifeF={lifeF}
              x={fatherX(f)}
              y={fatherY(f)}
              scale={FATHER_WS}
              acting={outdoorPose}
              light={FATHER_RIM}
              props={{ umbrella: P_UMBRELLA_WALK, bundle: P_BUNDLE }}
              stillness={0.1}
            />
          </g>
          <Splashes f={lifeF} n={44} seed={4} y0={PATH_Y + 8} y1={1060} x0={-200} x1={2600} o={0.4} />
        </Layer>
        <Layer depth={1.35}>
          <Rain f={lifeF} n={200} seed={3} wind={0.3} o={0.5} color="#e4ebf3" />
        </Layer>
        <Grade {...DAY_GRADE} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Shot 6: the gate, the elders' blessing, the last look back          */
/* ------------------------------------------------------------------ */

/*
 * On the real clock, u = h - CUT_GATE (the cut on "কৃষ্ণনগরে।"), held through the farewell pause. The family walks
 * up the last steps and stops in front of the gate (u 0-16); the two elders waiting in the gate raise their near
 * hands in blessing (u 4-16) and hold it over the family (nobody but Charu touches Balak); the father, Thakurma and
 * Charu bow their heads. In the pause the blessing finishes (the elders' hands come down to joined hands) and Charu
 * turns for a last look back at the house with wet eyes, Balak in her arms, while the rain eases to a drizzle.
 */
const GATE_CAM: Cam = { x: 1790 - 960, y: 610 - 540, zoom: 1.4, focus: 1, dof: 1.2 };
const GATE_STOP = { father: 1742, charu: 1612, thakurma: 1500 };
const GATE_ELDERS = [
  { cast: CAST.listenerB, x: 1884, turn: -0.5, delay: 0 },
  { cast: CAST.bhagabati, x: 1994, turn: -0.42, delay: 3 },
];
/** Walking speed (0..1): at pace on the cut, easing to a stop by u 16. */
const gateSpeed = (u: number) => 1 - smooth((u - 2) / 14);
/** Ground still to cover from u (walking right toward the gate, so x = stop - v * remaining). */
const gateLeft = (u: number) => {
  let d = 0;
  for (let g = Math.round(u); g < 40; g++) d += gateSpeed(g);
  return d;
};
const gateFatherX = (u: number) => GATE_STOP.father - WS * WALK_V * gateLeft(u);
const gateCharuX = (u: number) => GATE_STOP.charu - WS * WALK_V * CHARU_STEP * gateLeft(u);
const gateThakX = (u: number) => GATE_STOP.thakurma - WS * WALK_V * gateLeft(u);
const gateCharuPlace = (u: number): CharuPlace => ({ x: gateCharuX(u), y: PATH_Y, s: CHARU_WS, seated: false });
/** Pause beats on the shot's clock: the blessing finishes, then Charu's last look back. */
const G_PAUSE0 = FAREWELL0 - CUT_GATE;
const G_END = CUT_REAR - CUT_GATE;
const G_BLESS_END = G_PAUSE0 + 10;
const G_LOOK = G_PAUSE0 + Math.round(0.3 * FAREWELL_P.frames);

const gateFatherBody = withGait(
  makeActing<Pose>(BASE_POSE, [
    { f: -20, stride: strideFor(1.4, 1.0), bodyTurn: WALK_TURN, headTurn: 0.25, eyeX: 0.3, eyeY: -0.05, smile: 0.5, brow: 0.5, lE: -16, lHand: "hold", lProp: "bundle", rS: UMB_ARM.S, rE: UMB_ARM.E, rHand: "hold", rProp: "umbrella" },
    // stops before the elders and bows his head to receive the blessing
    { f: 16, bodyTurn: 0.6, headTurn: 0.15, eyeX: 0.45, in: 10, ease: "inOut" },
    { f: 22, headNod: 9, eyeY: 0.4, smile: 0.55, brow: 0.45, in: 8, ease: "inOut" },
    // the blessing done, he looks up with a grateful smile
    { f: G_BLESS_END + 8, headNod: 1, eyeY: 0, smile: 0.6, in: 10, ease: "inOut" },
    // and glances back to Charu as she looks at the house
    { f: G_LOOK + 10, headTurn: -0.55, eyeX: -0.8, smile: 0.4, brow: 0.55, browTilt: 0.2, in: 12, ease: "inOut" },
  ]),
  { seed: SURENDRA.seed, speed: gateSpeed, swingL: 16 },
);
const gateThakBody = withGait(
  makeActing<Pose>(BASE_POSE, [
    { f: -20, stride: strideFor(1.25, THAKURMA.height), bodyTurn: WALK_TURN, headTurn: 0.2, eyeX: 0.3, smile: 0.25, brow: 0.3, lS: 14, lE: -26, lHand: "hold", lProp: "basket", rS: 6, rE: -10, rHand: "relaxed" },
    // bows her head to the blessing, her free hand on her chest (relaxed shape)
    { f: 20, headNod: 8, eyeY: 0.35, smile: 0.4, in: 10, ease: "inOut" },
    { f: 28, rS: -8, rE: -128, rHand: "relaxed", in: 10, ease: "inOut" },
    // in the pause she watches Charu, tender
    { f: G_LOOK + 6, headNod: 2, headTurn: 0.35, eyeX: 0.6, eyeY: 0.05, smile: 0.35, browTilt: 0.3, in: 12, ease: "inOut" },
  ]),
  { seed: THAKURMA.seed, speed: gateSpeed, swingL: 10, swingR: 12, bob: 3.6 },
);
const gateCharuKeys: PoseKey<Pose>[] = [
  { f: -20, crouch: 0, rHand: "cup", lHand: "cup", stride: strideFor(CHARU_S, CH), bodyTurn: WALK_TURN, lean: 2, headTilt: 4, headTurn: -0.1, headNod: 8, eyeX: 0.3, eyeY: 0.8, smile: 0.5, brow: 0.3 },
  // looks up to the elders as she stops, then bows her head to the blessing
  { f: 16, lean: 0, headNod: 4, headTurn: 0.15, eyeX: 0.6, eyeY: 0, smile: 0.5, brow: 0.45, in: 10, ease: "inOut" },
  { f: 24, headNod: 10, eyeY: 0.45, in: 8, ease: "inOut" },
  // the last look back at the house: her body turns a little (staying turned enough that the far arm stays far),
  // the head turns over her shoulder, eyes wet
  { f: G_LOOK, bodyTurn: 0.47, headTurn: -0.95, headNod: 2, headTilt: -3, eyeX: -1, eyeY: -0.05, smile: 0.1, brow: 0.55, browTilt: 0.55, tears: 0.55, in: 14, ease: "inOut" },
  { f: G_LOOK + 20, headTurn: -0.9, eyeX: -0.95, in: 20, ease: "inOut" },
  // and slowly back toward Balak and the road
  { f: G_END + 6, bodyTurn: 0.62, headTurn: -0.15, headNod: 6, eyeX: 0.2, eyeY: 0.6, smile: 0.25, browTilt: 0.3, tears: 0.35, in: 14, ease: "inOut" },
];
const gateCharuBody = withGait(makeActing<Pose>(BASE_POSE, gateCharuKeys), { seed: CHARU_SEED, speed: gateSpeed, strideK: CHARU_STEP, bob: 3.2 });
const gateCharuActAt =
  (t: number) =>
  (u: number): Pose => {
    const place = gateCharuPlace(u);
    const rig = charuRig(u, blendPose(gateCharuBody, u), place, t);
    return { ...gateCharuBody(u), ...cradleArms(rig, 1, cradlePose(rig, 1, place), HOLD_NEAR, HOLD_FAR) };
  };
/** An elder in the gate: joined hands, then the near hand raised in blessing (abhaya), then joined hands again. */
const gateElderAct = (turn: number, d: number) => {
  const keyed = makeActing<Pose>(BASE_POSE, [
    { f: -20, bodyTurn: turn, headTurn: -0.15, eyeX: -0.6, eyeY: 0.05, smile: 0.4, brow: 0.5, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam" },
    // raises the near hand high, palm out, in blessing over the family as they stop (motion from u 4)
    { f: 16 + d, rS: -122, rE: -28, rHand: "abhaya", lS: 6, lE: -16, lHand: "relaxed", headNod: 5, smile: 0.55, eyeY: 0.2, in: 12, ease: "inOut" },
    // the blessing finishes: back to joined hands, a small bow
    { f: G_BLESS_END + d, rS: -6, rE: -150, rHand: "pranam", lS: -6, lE: -150, lHand: "pranam", headNod: 8, in: 12, ease: "inOut" },
    { f: G_BLESS_END + 16 + d, headNod: 3, eyeX: -0.5, smile: 0.45, in: 10, ease: "inOut" },
  ]);
  // a slow, small movement of the raised hand while it blesses (never a frozen hold)
  return (u: number): Pose => {
    const p = keyed(u);
    const up = smooth((u - (14 + d)) / 6) * (1 - smooth((u - (G_BLESS_END - 10 + d)) / 8));
    return { ...p, rS: p.rS + 3 * up * Math.sin((u - d) * 0.12), rE: p.rE + 2 * up * Math.sin((u - d) * 0.09 + 1) };
  };
};
const GATE_ELDER_ACTS = GATE_ELDERS.map((e) => gateElderAct(e.turn, e.delay));

const ShotGate: React.FC<{ h: number }> = ({ h }) => {
  const u = h - CUT_GATE;
  // the rain eases to a drizzle through the pause
  const ease = smooth((h - FAREWELL0) / Math.max(1, FAREWELL_P.frames));
  const charuAct = gateCharuActAt(h);
  const place = gateCharuPlace(u);
  const drawn = blendPose(charuAct, u);
  const rig = charuRig(u, drawn, place, h);
  const nb = cradlePose(charuRig(u, blendPose(gateCharuBody, u), place, h), 1, place);
  const charu = <Puppet cast={CAST.charu} f={u} lifeF={h} x={place.x} y={place.y} scale={CHARU_WS} acting={charuAct} light={WALK_RIM} stillness={1} />;
  return (
    <Stage cam={GATE_CAM} background="#7d8794" opacity={1}>
      <SceneLights.Provider value={DAY_LIGHTS}>
        <Layer depth={0.08}>
          <RainySky id="ep2e-sky-gate" f={h} clear={ease} />
        </Layer>
        <Layer depth={1}>
          <GlowDefs />
          <DivineDefs />
          <WetCourtyard f={h} />
          <BariRainyDay f={h} />
          <MangoTree x={2230} y={PATH_Y - 10} s={1.1} />
          <BoundaryGate />
          {/* the two elders waiting in the gate */}
          {GATE_ELDERS.map((e, i) => (
            <Puppet key={e.cast.id} cast={e.cast} f={u} lifeF={h} x={e.x} y={PATH_Y} scale={FATHER_WS} acting={GATE_ELDER_ACTS[i]} light={WALK_RIM} stillness={0.3} />
          ))}
          {/* the family: Thakurma, Charu with Balak, the father nearest the gate */}
          <Puppet cast={THAKURMA} f={u} lifeF={h} x={gateThakX(u)} y={PATH_Y} scale={THAKURMA_WS} acting={gateThakBody} light={WALK_RIM} props={{ basket: P_BASKET }} stillness={0.3} />
          {charu}
          <g transform={`translate(${nb.x}, ${nb.y}) rotate(${nb.rot}) scale(${nb.m * nb.k}, ${nb.k})`}>
            <Swaddled f={u} lifeF={h} x={0} y={0} dx={0} limp lookY={-0.55} />
          </g>
          <CradleFront id="ep2e-cradle-gate" f={u} rig={rig} p={drawn} place={place} fwd={1} lights={DAY_LIGHTS} opacity={1}>
            {charu}
          </CradleFront>
          <Puppet cast={SURENDRA} f={u} lifeF={h} x={gateFatherX(u)} y={PATH_Y} scale={FATHER_WS} acting={gateFatherBody} light={FATHER_RIM} props={{ umbrella: P_UMBRELLA, bundle: P_BUNDLE }} stillness={0.1} />
          <Splashes f={h} n={44} seed={4} y0={PATH_Y + 8} y1={1060} x0={-200} x1={2600} o={0.4 * (1 - 0.5 * ease)} />
        </Layer>
        <Layer depth={1.35}>
          <Rain f={h} n={Math.round(lerp(200, 90, ease))} seed={3} wind={0.3} o={lerp(0.5, 0.32, ease)} color="#e4ebf3" />
        </Layer>
        <Grade {...DAY_GRADE} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Shot 8: behind the family, through the gate to the cart             */
/* ------------------------------------------------------------------ */

/**
 * The rear walk was authored on its own clock (old frames: the walk from REAR0 = 196, through the gate, boarding
 * 240-270). It plays on the story clock from the end of the farewell pause, entering at old frame REAR_ENTER (the
 * father about to pass through the gate, Charu and Thakurma already in it) at a touch over real pace, so the family
 * is seated on the cart as the scene ends under the dissolve into the journey.
 */
const REAR0 = 196;
const REAR_ENTER = 212;
const REAR_K = 1.1;
const rearOld = (f: number) => REAR_ENTER + (f - FAREWELL_P.atStory) * REAR_K;
/** Depth of the father at REAR0 (1 = picture plane) and how far he recedes per frame. */
const REAR_Z0 = 1.6;
const REAR_V = 0.03;
/** Vanishing point of the path: the horizon line and the centre line of the road. */
const HORIZON = 720;
const VP_X = 960;
/** Screen y of the feet on the picture plane (depth 1). */
const NEAR_Y = 1040;
/** Lateral road offsets (picture-plane px): the father leads, Charu and Thakurma fall back on the left. */
const FATHER_X = 80;
const CHARU_X = -220;
const THAKURMA_X = -560;
const FATHER_S = 1.4;
const THAKURMA_S = 1.25;
/** The parked cart, waiting across the road just beyond the boundary gate, at the depth where the family boards. */
const CART_X_REAR = -300;
const CART_Z = 3.6;
const CART_S = FATHER_S / CART_Z;
/** Boarding from 240: each walker leaves the road and lifts onto the deck by 270. The seated pose switches on at 266. */
const BOARD0 = 240;
const BOARD_END = 270;
const SEAT_ON = 266;
/** Seats along the deck, in cart-local x: Thakurma at the back, Charu in the middle, the father at the front. */
const SEAT_DX = { thakurma: -105, charu: 0, father: 105 };

/**
 * The Baidik Bari's boundary wall and gate, across the courtyard at depth WALL_Z (picture-plane px for the
 * gate opening, the pillar width and the heights of the wall, the pillars and the arch crown). The walkers
 * pass through the opening (Thakurma at 203, Charu 209, the father 219); each is drawn in front of the wall
 * until it crosses WALL_Z and behind it afterwards, while it is inside the opening, so nothing pops.
 */
const WALL_Z = 2.3;
const GATE_X0 = -820;
const GATE_X1 = 480;
const GATE_PW = 120;
const WALL_H = 280;
const PILLAR_H = 820;
const ARCH_H = 1000;

const REAR_PALM_XS = [-120, 180, 430, 1240, 1520, 1800, 2100];
const REAR_HUT_XS = [640, 1420, 1830];
const REAR_RUT_XS = [-260, 200, 700, 1200, 1700, 2180];
const REAR_PUDDLES: Array<[number, number]> = [[-520, 1.3], [380, 1.5], [-240, 2.2], [620, 2.6], [-160, 3.4], [260, 3.9]];
/** The house behind the camera: a little warm light from its open door, low behind the frame (grey day). */
const REAR_LIGHTS: SceneLight[] = [{ x: VP_X, y: 1400, color: "#ffc890", intensity: 0.3, radius: 1600 }];
/** Patches of window light from the house behind, lying on the wet courtyard: [X0, X1, z near, z far]. */
const WINDOW_PATCHES: Array<[number, number, number, number]> = [[-1500, -1000, 1.12, 1.5], [-420, 60, 1.1, 1.42], [620, 1100, 1.14, 1.55]];
/** Rear-shot walkers are silhouettes, so the rig's own shading is hidden under SILHOUETTE. */
const REAR_WALK_LIGHT = { keySide: 1 } as const;
/**
 * Flat dark silhouette: brightness 0 removes every fill, face and fold detail, leaving the shape of
 * the umbrella, bundle, legs and arm swing (the rig has no back view). A thin soft warm rim outlines the
 * figures against the pale overcast.
 */
const SILHOUETTE: React.CSSProperties = {
  filter: "brightness(0) drop-shadow(0 -1.5px 1px rgba(255,222,180,0.55)) drop-shadow(0 0 5px rgba(230,200,170,0.25))",
};

/**
 * The father's silhouette: no halo or outline glow, only a very faint warm rim on the top edge so he
 * sits in the room. The divine glow stays on Balak alone.
 */
const FATHER_SILHOUETTE: React.CSSProperties = {
  filter: "brightness(0) drop-shadow(0 -1px 0.6px rgba(255,190,120,0.22))",
};

/** Depth of a walker: the father leads, Charu and Thakurma fall back a little each. */
const depthAt = (f: number, lag: number) => REAR_Z0 + Math.max(0, f - REAR0) * REAR_V + lag;
/** The road's lower edge sits below the frame; roadX extends a road line that meets y 1080 at x1080 down to it. */
const REAR_BOTTOM = 1240;
const roadX = (x1080: number) => VP_X + ((x1080 - VP_X) * (REAR_BOTTOM - HORIZON)) / (1080 - HORIZON);
/** Feet position on the road for lateral offset X at depth z. */
const roadPoint = (X: number, z: number) => ({ x: VP_X + X / z, y: HORIZON + (NEAR_Y - HORIZON) / z });

/** Boarding progress: 0 on the road, 1 on the deck. */
const boardK = (f: number) => smooth((f - BOARD0) / (BOARD_END - BOARD0));

/**
 * Screen placement of one walker. Before boarding it keeps its road position and walks away. From
 * BOARD0 it moves across to its seat (cart depth CART_Z) and lifts onto the deck. Returns the Puppet's
 * origin (feet line), its scale `s` and its depth `z`.
 */
const placeRider = (f: number, X0: number, lag: number, dx: number, figS: number) => {
  const k = boardK(f);
  const X = lerp(X0, CART_X_REAR + dx * FATHER_S, k);
  const z = lerp(depthAt(Math.min(f, BOARD0), lag), CART_Z, k);
  const s = figS / z;
  const p = roadPoint(X, z);
  return { x: p.x, y: p.y + k * SEAT_Y * s, s, z };
};

/* Rear walk: each walker keeps the rig's stride and arm swing, on a staggered start. */
const rearFatherKeys: PoseKey<Pose>[] = [
  { f: REAR0, stride: 0.85, bodyTurn: 0, headTurn: 0, headTilt: 0, eyeX: 0, eyeY: 0, smile: 0.2, brow: 0.2, rS: UMB_ARM.S, rE: UMB_ARM.E, rHand: "hold", rProp: "umbrella", lE: -16, lHand: "hold", lProp: "bundle" },
  ...gaitKeys(REAR0, BOARD0, 16),
  // on the cart: the stride stops and the left arm rests
  { f: BOARD_END, stride: 0, lS: BASE_POSE.lS, lE: BASE_POSE.lE, bodyY: 0, in: 16 },
];
const rearCharuKeys: PoseKey<Pose>[] = [
  { f: REAR0 + 2, stride: 0.8, lean: 2, headTilt: 4, headTurn: -0.1, headNod: 8, eyeX: 0.3, eyeY: 0.8, rS: 10, rE: -110, lS: 10, lE: -110, rHand: "cup", lHand: "cup", rProp: "", lProp: "" },
  ...gaitKeys(REAR0 + 2, BOARD0, 0, CAST.charu.seed, "none"),
  { f: BOARD_END, stride: 0, bodyY: 0, in: 16 },
];
const rearThakurmaKeys: PoseKey<Pose>[] = [
  { f: REAR0 + 4, stride: 0.7, bodyTurn: 0, headTurn: 0.1, rS: 14, rE: -26, rHand: "hold", rProp: "basket", lS: 6, lE: -10, lHand: "relaxed" },
  ...gaitKeys(REAR0 + 4, BOARD0, 12, THAKURMA.seed),
  { f: BOARD_END, stride: 0, lS: BASE_POSE.lS, lE: BASE_POSE.lE, bodyY: 0, in: 16 },
];
const rearFatherAct = makeActing<Pose>(BASE_POSE, rearFatherKeys);
const rearCharuBody = makeActing<Pose>(BASE_POSE, rearCharuKeys);
/** Where Charu's Puppet stands in the rear shot (it walks the road, then boards and sits on the deck). */
const rearCharuPlace = (f: number): CharuPlace => {
  const pC = placeRider(f, CHARU_X, 0.3, SEAT_DX.charu, CHARU_S);
  return { x: pC.x, y: pC.y, s: pC.s, seated: f >= SEAT_ON };
};
/**
 * Rear shot: the same cradle hold as the walk (front-view rig, so the canonical facing), fixed to her
 * shoulders, standing or seated; the silhouette's arms are solved onto the newborn every frame.
 */
const rearCharuActAt =
  (t: number) =>
  (f: number): Pose => {
    const place = rearCharuPlace(f);
    const rig = charuRig(f, blendPose(rearCharuBody, f), place, t);
    return { ...rearCharuBody(f), ...cradleArms(rig, -1, cradlePose(rig, -1, place), HOLD_NEAR, HOLD_FAR) };
  };
const rearThakurmaAct = makeActing<Pose>(BASE_POSE, rearThakurmaKeys);

/**
 * Head centre of the newborn in the baby frame (BabyThakur's hx, hy in Divine.tsx). The rear view has
 * no face, but the halo still sits on the head, as in the walk shot.
 */
const NB_HEAD = { x: -50, y: -10 };

/**
 * The newborn from behind: the white swaddle as a soft light shape, with no face. Baby frame at scale 0.7.
 * The halo runs at aura 0.8, the same level as the walk-shot swaddle, so the glow does not dip when the
 * shots dissolve (196 to 212). A head-centred radiance (the same treatment as BabyThakur) sits behind the swaddle.
 */
const RearSwaddle: React.FC<{ f: number }> = ({ f }) => (
  <g transform="scale(0.7)">
    <DivineAura f={f} x={NB_HEAD.x} y={NB_HEAD.y} level={0.8} s={0.9} />
    <circle cx={NB_HEAD.x} cy={NB_HEAD.y} r={96} fill="url(#dv-glow)" opacity={0.85 * 0.8} />
    <DivineAura f={f} x={-10} y={-4} level={0.8} s={0.8} />
    <path d="M -18 -30 Q 22 -42 60 -30 Q 84 -10 80 22 Q 62 42 30 38 Q 2 36 -18 30 Q -24 0 -18 -30 Z" fill="#fffdf7" stroke="#e6dccb" strokeWidth={1.4} />
    <path d="M -10 -14 Q 20 -6 46 -14" stroke="#e6dccb" strokeWidth={1.4} fill="none" opacity={0.8} />
  </g>
);

/**
 * A small standing zebu bullock in front of the parked cart, drawn as a backlit silhouette so it reads at
 * this distance: head with horns, ear and muzzle, the hump over the shoulders, four legs with hooves and a
 * tail. Cart-local units (road at y = 0, facing right), placed at (x, y) with scale s; the shaft and yoke
 * post continue the clipped cart's shaft to its neck. The tail swishes slowly and the head dips a little.
 */
/** The bullock stands close in front of the cart (its rump at the shaft's root), so at 247 its head and horns are clear of Thakurma walking past. */
const BULLOCK_DX = -125;
const StandingBullock: React.FC<{ f: number; x: number; y: number; s: number }> = ({ f, x, y, s }) => {
  const body = "#2e231b";
  const farC = "#1f1712";
  const tail = 7 * Math.sin(f * 0.06) + 3 * noise1(f * 0.03, 21);
  const nod = 2.5 * noise1(f * 0.025, 33);
  const leg = (lx: number, c: string, k = 0) => (
    <path d={`M ${lx - 10} -138 L ${lx + 10} -138 L ${lx + 7 + k} -8 L ${lx - 6 + k} -8 Z`} fill={c} />
  );
  return (
    <g style={{ filter: "drop-shadow(0 -1.5px 0.8px rgba(255,205,140,0.75))" }}>
      <g transform={`translate(${x}, ${y}) scale(${s})`}>
        {/* the cart's shaft, carried on to the bullock's neck */}
        <path d={`M 186 -146 L ${470 + BULLOCK_DX} -152`} stroke="#3a2414" strokeWidth={9} strokeLinecap="round" />
        <g transform={`translate(${BULLOCK_DX}, 0)`}>
        <ellipse cx={420} cy={-2} rx={150} ry={8} fill="#000" opacity={0.25} />
        {/* far legs */}
        {leg(318, farC, -3)}
        {leg(462, farC, 3)}
        {/* tail */}
        <g transform={`rotate(${tail}, 282, -190)`}>
          <path d="M 282 -192 Q 266 -150 272 -86" stroke={body} strokeWidth={7} fill="none" strokeLinecap="round" />
          <ellipse cx={272} cy={-78} rx={8} ry={14} fill={farC} />
        </g>
        {/* body, hump and dewlap */}
        <ellipse cx={392} cy={-170} rx={118} ry={50} fill={body} />
        <ellipse cx={470} cy={-214} rx={32} ry={26} fill={body} />
        <path d="M 488 -170 Q 506 -132 534 -150 L 540 -190 Z" fill={body} />
        {/* neck and head, dipping a little */}
        <g transform={`rotate(${nod}, 500, -196)`}>
          <path d="M 478 -214 Q 520 -230 548 -214 L 560 -178 Q 528 -168 494 -170 Z" fill={body} />
          <ellipse cx={560} cy={-190} rx={30} ry={20} fill={body} transform="rotate(32 560 -190)" />
          <ellipse cx={580} cy={-170} rx={14} ry={11} fill={farC} />
          <ellipse cx={534} cy={-206} rx={13} ry={6} fill={body} transform="rotate(-24 534 -206)" />
          {/* horns: two light curved horns rising from the poll */}
          <path d="M 546 -210 Q 536 -240 552 -258" stroke="#d8ccae" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M 558 -208 Q 562 -238 580 -248" stroke="#c9bc9c" strokeWidth={5} fill="none" strokeLinecap="round" />
        </g>
        <path d="M 468 -152 L 486 -204" stroke="#3a2414" strokeWidth={8} strokeLinecap="round" />
        {/* near legs and hooves */}
        {leg(338, body)}
        {leg(482, body)}
        {[318, 338, 462, 482].map((lx, i) => (
          <rect key={lx} x={lx - 7 + (i === 0 ? -3 : i === 2 ? 3 : 0)} y={-10} width={14} height={10} rx={2} fill="#1a1410" />
        ))}
        </g>
      </g>
    </g>
  );
};

/**
 * The boundary wall and gate of the Baidik Bari, across the courtyard at depth WALL_Z, in screen coords: a
 * low plastered wall either side, two pillars with a lamp on each, an arch over the opening. Their faces
 * catch the lamp light of the house behind the camera (a warm wash low on the wall).
 */
const RearGate: React.FC = () => {
  const z = WALL_Z;
  const yB = HORIZON + (NEAR_Y - HORIZON) / z;
  const px = (X: number) => VP_X + X / z;
  const gl = px(GATE_X0);
  const gr = px(GATE_X1);
  const pw = GATE_PW / z;
  const wallTop = yB - WALL_H / z;
  const pTop = yB - PILLAR_H / z;
  const crown = yB - ARCH_H / z;
  const mid = (gl + gr) / 2;
  const band = 34 / z;
  return (
    <g>
      <defs>
        <linearGradient id="ep2e-wall-lit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc890" stopOpacity={0} />
          <stop offset="100%" stopColor="#ffc890" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      {/* the wall, left and right of the gate (its inner face, in the soft grey daylight) */}
      <rect x={-1400} y={wallTop} width={gl - pw + 1400} height={yB - wallTop} fill="#7a5e50" />
      <rect x={gr + pw} y={wallTop} width={3400 - gr - pw} height={yB - wallTop} fill="#7a5e50" />
      <rect x={-1400} y={wallTop - 6} width={gl - pw + 1400} height={8} fill="#96786a" />
      <rect x={gr + pw} y={wallTop - 6} width={3400 - gr - pw} height={8} fill="#96786a" />
      <rect x={-1400} y={wallTop} width={4800} height={yB - wallTop} fill="url(#ep2e-wall-lit)" />
      {/* the arch over the opening */}
      <path
        d={`M ${gl - pw} ${pTop} L ${gl - pw} ${pTop - band} Q ${mid} ${crown - band * 2} ${gr + pw} ${pTop - band} L ${gr + pw} ${pTop} L ${gr} ${pTop} Q ${mid} ${crown} ${gl} ${pTop} Z`}
        fill="#7e604f"
      />
      {/* pillars, their inner edges catching the sky, a cap on each */}
      {[gl - pw, gr].map((x, i) => (
        <g key={i}>
          <rect x={x} y={pTop} width={pw} height={yB - pTop} fill="#86685a" />
          <rect x={x + (i ? 0 : pw - 5)} y={pTop} width={5} height={yB - pTop} fill="#b49684" opacity={0.6} />
          <rect x={x - 5} y={pTop - 12} width={pw + 10} height={12} fill="#9a7c6c" />
        </g>
      ))}
    </g>
  );
};

/** The two elders who blessed the family at the gate, now standing aside by the pillars (lateral X, depth). */
const REAR_ELDERS = [
  { cast: CAST.listenerB, X: GATE_X0 - GATE_PW - 110, z: WALL_Z - 0.08 },
  { cast: CAST.bhagabati, X: GATE_X1 + GATE_PW + 110, z: WALL_Z - 0.08 },
];
const rearElderAct = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: 0, headTurn: 0, rS: -6, rE: -150, lS: -6, lE: -150, rHand: "pranam", lHand: "pranam" },
]);

/**
 * Shot 8: CUT to the rear wide, held (no pull-back, CAM-13), on the story clock (rearOld). The family as
 * silhouettes walks through the gate to the waiting cart and climbs on (the rig has no back view); the elders
 * stand aside by the pillars with joined hands. The drizzle thins. Episode02.tsx dissolves into the journey over
 * the last 40 frames; this shot keeps running to the scene's last frame.
 */
const REAR_CAM: Cam = { x: 0, y: 0, zoom: 1.04, focus: 1, dof: 1.2 };
const ShotBehind: React.FC<{ f: number; lifeF: number }> = ({ f: fs, lifeF }) => {
  const f = rearOld(fs);
  // the family walks away from the house, through the gate, then climbs onto the waiting cart (BOARD0 to BOARD_END)
  const pF = placeRider(f, FATHER_X, 0, SEAT_DX.father, FATHER_S);
  const pC = placeRider(f, CHARU_X, 0.3, SEAT_DX.charu, CHARU_S);
  const pT = placeRider(f, THAKURMA_X, 0.5, SEAT_DX.thakurma, THAKURMA_S);
  const pCart = roadPoint(CART_X_REAR, CART_Z);
  const seated = f >= SEAT_ON;
  // the newborn in Charu's cradle, placed from her drawn body (standing, boarding or seated)
  const rearCharuAct = rearCharuActAt(lifeF);
  const cPlace = rearCharuPlace(f);
  const nb = cradlePose(charuRig(f, blendPose(rearCharuBody, f), cPlace, lifeF), -1, cPlace);
  const wallY = HORIZON + (NEAR_Y - HORIZON) / WALL_Z;

  // each walker as drawn (Thakurma at the back, then Charu with the newborn, the father in front)
  const thakurma = (
    <g style={SILHOUETTE}>
      <Puppet cast={THAKURMA} f={f} lifeF={lifeF} x={pT.x} y={pT.y} scale={pT.s} acting={rearThakurmaAct} light={REAR_WALK_LIGHT} props={{ basket: P_BASKET }} seated={seated} stillness={0.3} />
    </g>
  );
  const charu = (
    <>
      <g style={SILHOUETTE}>
        <Puppet cast={CAST.charu} f={f} lifeF={lifeF} x={pC.x} y={pC.y} scale={pC.s} acting={rearCharuAct} light={REAR_WALK_LIGHT} seated={seated} stillness={1} />
      </g>
      {/* the newborn sits outside the silhouettes, so the white swaddle and the halo stay bright; he lies in her solved hold */}
      <g transform={`translate(${nb.x}, ${nb.y}) rotate(${nb.rot}) scale(${nb.m * nb.k}, ${nb.k})`}>
        <RearSwaddle f={lifeF} />
      </g>
    </>
  );
  const father = (
    <g style={FATHER_SILHOUETTE}>
      <Puppet cast={SURENDRA} f={f} lifeF={lifeF} x={pF.x} y={pF.y} scale={pF.s} acting={rearFatherAct} light={REAR_WALK_LIGHT} props={{ umbrella: P_UMBRELLA, bundle: P_BUNDLE }} seated={seated} stillness={0.1} />
    </g>
  );
  // beyond the wall plane (drawn before the wall) or still in the courtyard (drawn after it)
  const walkers = (beyond: boolean) => (
    <>
      {pT.z > WALL_Z === beyond && thakurma}
      {pC.z > WALL_Z === beyond && charu}
      {pF.z > WALL_Z === beyond && father}
    </>
  );

  return (
    <Stage cam={REAR_CAM} background="#7d8794" opacity={1}>
      <SceneLights.Provider value={REAR_LIGHTS}>
        {/* grey overcast, the rain thinning */}
        <Layer depth={0.08}>
          <GlowDefs />
          <RainySky id="ep2e-sky-rear" f={lifeF} clear={0.6} />
          <ellipse cx={VP_X} cy={HORIZON - 10} rx={700} ry={90} fill="#c8ced4" opacity={0.3} />
        </Layer>
        {/* the far village: tree line and huts in the rain haze at the horizon */}
        <Layer depth={0.25}>
          <defs>
            <linearGradient id="ep2e-rear-mist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8c0c8" stopOpacity={0} />
              <stop offset="50%" stopColor="#b8c0c8" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#b8c0c8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={-800} y={684} width={4000} height={HORIZON - 684 + 2} fill="#5c6a60" />
          {REAR_HUT_XS.map((x) => (
            <FarHut key={x} x={x} y={712} s={0.5} c="#5a5650" />
          ))}
          <rect x={-800} y={628} width={4000} height={120} fill="url(#ep2e-rear-mist)" />
        </Layer>
        {/* coconut palms along the road, their feet on the far fields */}
        <Layer depth={0.4}>
          {REAR_PALM_XS.map((x, i) => (
            <Palm key={x} x={x} y={HORIZON - 6} s={0.45 + (i % 3) * 0.1} c="#3c4a40" />
          ))}
        </Layer>
        {/* wet green paddy either side of the road beyond the wall */}
        <Layer depth={0.7}>
          <rect x={-800} y={HORIZON} width={3600} height={700} fill="#5a7452" />
          {[740, 770, 810, 860, 930, 1020].map((y) => (
            <line key={y} x1={-800} y1={y} x2={2800} y2={y} stroke="#c4ccd4" strokeWidth={2} opacity={0.3} />
          ))}
        </Layer>
        {/* the courtyard, the gate, the road beyond, the waiting cart and the walkers */}
        <Layer depth={1}>
          <GlowDefs />
          <DivineDefs />
          <defs>
            <linearGradient id="ep2e-rear-houselight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffc890" stopOpacity={0} />
              <stop offset="100%" stopColor="#ffc890" stopOpacity={0.12} />
            </linearGradient>
          </defs>
          {/* the wet courtyard on this side of the wall (runs on below the frame) */}
          <rect x={-1400} y={wallY} width={4800} height={REAR_BOTTOM + 200 - wallY} fill="#4e4038" />
          {/* the beaten path from the house runs on through the gate as the road to the horizon; ruts */}
          <path d={`M ${VP_X - 10} ${HORIZON} L ${VP_X + 10} ${HORIZON} L ${roadX(2180)} ${REAR_BOTTOM} L ${roadX(-260)} ${REAR_BOTTOM} Z`} fill="#6a5a4c" />
          {REAR_RUT_XS.map((x) => (
            <line key={x} x1={VP_X} y1={HORIZON} x2={roadX(x)} y2={REAR_BOTTOM} stroke="#3e3228" strokeWidth={2} opacity={0.4} />
          ))}
          <rect x={-1400} y={wallY} width={4800} height={REAR_BOTTOM + 200 - wallY} fill="url(#ep2e-rear-houselight)" />
          {REAR_PUDDLES.map(([X, z]) => {
            const p = roadPoint(X, z);
            return <ellipse key={`${X}-${z}`} cx={p.x} cy={p.y} rx={120 / z} ry={9 / z} fill="#c4ccd4" opacity={0.26} />;
          })}
          {/* the waiting cart across the road beyond the gate: wheels still. At this size the rig's bullocks do not
              read, so the cart is clipped behind its shaft and a small standing bullock silhouette is drawn in their place */}
          <g transform={`translate(${pCart.x}, ${pCart.y}) scale(${CART_S})`}>
            <defs>
              <clipPath id="ep2e-rear-cart">
                <rect x={-400} y={-520} width={590} height={580} />
              </clipPath>
            </defs>
            <g clipPath="url(#ep2e-rear-cart)">
              <BullockCart roll={0} step={0} walk={0} dust={0} f={f} />
            </g>
          </g>
          <StandingBullock f={lifeF} x={pCart.x} y={pCart.y} s={CART_S} />
          {/* walkers already through the gate, then the wall and gate, then the elders and those still in the courtyard */}
          {walkers(true)}
          <RearGate />
          {REAR_ELDERS.map((e) => {
            const p = roadPoint(e.X, e.z);
            return (
              <g key={e.cast.id} style={SILHOUETTE}>
                <Puppet cast={e.cast} f={f} lifeF={lifeF} x={p.x} y={p.y} scale={FATHER_S / e.z} acting={rearElderAct} light={REAR_WALK_LIGHT} stillness={0.3} />
              </g>
            );
          })}
          {walkers(false)}
        </Layer>
        <Layer depth={1.35}>
          <Rain f={lifeF} n={90} seed={3} wind={0.3} o={0.3} color="#e4ebf3" />
        </Layer>
        <Grade {...DAY_GRADE} />
      </SceneLights.Provider>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/**
 * Shot changes are hard cuts on the narration and pause anchors, and exactly one shot draws per frame (no
 * translucent duplicates). No fade of its own: Episode02.tsx cross-dissolves into the journey (EP02_DISSOLVES).
 */
export const Scene01eFather: React.FC = () => {
  const { f, lifeF } = useStory(SCENE_ID);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#7d8794" }}>
      {lifeF < CUT_CALL && <ShotHandover h={lifeF} />}
      {lifeF >= CUT_CALL && lifeF < CUT_HOUSE && <ShotCall h={lifeF} />}
      {lifeF >= CUT_HOUSE && lifeF < CUT_GATE && <ShotWalk f={f} lifeF={lifeF} />}
      {lifeF >= CUT_GATE && lifeF < CUT_REAR && <ShotGate h={lifeF} />}
      {lifeF >= CUT_REAR && <ShotBehind f={f} lifeF={lifeF} />}
    </div>
  );
};
