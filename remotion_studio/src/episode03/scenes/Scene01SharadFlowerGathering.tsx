import React from "react";
import { clamp, hash, makeActing, noise1, PoseKey, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { GlowDefs } from "../../cinematic/fx/Fx";
import { MouthState } from "../../cinematic/rig/lipsync";
import { BASE_POSE, CastMember, Lighting, Pose, PropRenderer, Puppet } from "../../cinematic/rig/Puppet";
import { CourtyardBack, CourtyardFloor, TulsiMancha } from "../../cinematic/sets/Interiors";
import { Birds } from "../../cinematic/sets/S01_DaySets";
import { cueLocalStory3, pausesFor3, storyToReal, useStory3 } from "../../episode/storyClock";
import { EP03_SCENES } from "../timing";

/**
 * SHARED LAYOUT FOR SCENES 01 AND 02 (STO-18, 2026-11-22): the Vedic house inner courtyard at autumn dawn.
 * Coordinates are the courtyard set's own: CourtyardBack (Interiors.tsx) on a depth-0.55 layer, CourtyardFloor on the
 * depth-1 layer (floor from y 784, alpona centred at x 960, y 930). Every position below is on the depth-1 floor
 * layer (x, and y = the ground line where the trunk / base / feet stand). Exported as VEDIC_COURTYARD below.
 *   Shiuli tree ........ trunk base x 300,  y 872 (crown up to about y 300); fallen shiuli carpet round x 340, y 900.
 *   Jhumko tree ........ trunk base x 700,  y 868 (crown centre x 690, y 470, top about y 300), in an earthen ring bed.
 *   Big jaba tree ...... trunk base x 1080, y 866 (crown centre x 1040, y 420, top about y 250); its long low branch
 *                        leaves the crown at x 1100, y 455 and, pulled down, reaches right to about x 1700.
 *   Tulsi mancha ....... TulsiMancha (Interiors.tsx) at x 1700, y 842, scale 1.1 (where Episode 1 scene 07 had it on
 *                        this courtyard at dawn); the full sajis are set down at its foot, x 1590 to 1810, y about 858.
 *   Girls (scene 01) ... Sarala (eldest) x 1230, y 934 and Lata x 1562, y 930 hold the jaba branch down; Mina x 1350,
 *                        y 982 picks jaba from it and Rekha x 800, y 980 picks jhumko; little Tuni x 470, y 978 under
 *                        the shiuli tree. Every girl wears loose, damp hair (just bathed).
 *   Camera at zoom z ... depth-1 centre x within [-400 + 960/z, 2320 - 960/z]; see vedicKeepInSet below.
 *
 * Episode 3 · Scene 01 "Sharad dawn flower gathering" (01_sharad_flower_gathering).
 * The book, chapter 5: "বাড়ীর অল্পবয়স্কা মেয়েরা ভোরে উঠে স্নান করে সাজি হাতে ফুল তুলতে যেত ... বড় বড় জবা ফুল,
 * ঝুমকো ফুল। বেশ বড় বড় গাছ; দুই তিন জনে ডাল নামিয়ে ধরত, আর দুই তিন জনে ফুল তুলে সাজিতে রেখে দিত। একটা সাজি ভরে
 * গেলে সেটাকে তুলসীতলায় রেখে ..." So: Bhagabati Thakur's Vedic house (STO-18), the inner courtyard at an autumn
 * (শরৎ) dawn, soft gold light from the low sun on the right and mist; the young girls of the house, just bathed (loose
 * damp hair, plain cotton saris), at BIG jaba and jhumko trees taller than they are: Sarala and Lata hold the long jaba
 * branch down while Mina picks from it, Rekha picks jhumko, Tuni gathers fallen shiuli under the shiuli tree; full
 * sajis already stand at the tulsi mancha. Sarala and Lata hum softly (an unheard tune, no lip sync to the narrator).
 * No deity, no divine light.
 *
 * Plan: 03_Episodes/Episode_03_Five_Year_Old_Wisdom/01_Script_and_Storyboard/Ep03_Shots_and_Pauses_DRAFT.md,
 * "Scene 01" (approved, STO-17; place corrected by STO-18). Camera grammar CAM-13, pauses CAM-14.
 *
 * Clocks. Every key is derived from the narration cues (cueLocalStory3) and the scene's pauses (pausesFor3), never a
 * hard-coded frame, so it stays in sync when timing changes. Story frames are converted to the scene's real local
 * frames (storyToReal), and the acting, camera and life run on the real clock: the pause moments the plan asks for
 * (the girls picking on in P1, Tuni smelling her shiuli in P2, Mina and Rekha's shared smile in P3) are authored keys
 * INSIDE the pause windows, while no narrated action falls in a pause. The Puppets get lifeF for breathing and blinks.
 * VOICE_LAG: where the voice starts after its cue, measured from the clip silences (ffmpeg silencedetect, -35 dB).
 *
 * Never float (MOT-01 to MOT-07): the branch holders' arms are solved every frame (two-bone IK) onto grip points ON
 * the branch, and Mina's and Rekha's reaches are solved onto the very flowers they pick, which leave the tree at the
 * grab frame and appear in the hand.
 *
 * Shots (approved list):
 *   1  "শরতের মিষ্টি ভোর।"            held wide: the courtyard, the tulsi mancha at the right, the trees, the girls small
 *   2  "শিউলি ফুলের গন্ধে ..."          one slow push (1.00 to 1.12) toward Tuni, starting on "শিউলি", landing as she lifts
 *                                        the sprig; hold
 *   3  "বাড়ির মেয়েরা ভোরবেলা স্নান সেরে"  cut to a medium wide of the girls at the trees; hold
 *   4  "জবা আর ঝুমকো ফুলের সাজি ভরছে।"   one slow push to Mina's and Rekha's hands and baskets, starting on "জবা"; hold to
 *                                        the end. No handheld, no rack focus, no drift.
 * Pauses: P1 after "...ভোর।" (held wide: mist drifts, shiuli fall, birds cross, the girls pick on, small and
 * unhurried); P2 after "...উঠেছে।" (Tuni holds the sprig to her nose and smiles, Sarala glances across at her);
 * P3 end (the brimming baskets, Mina and Rekha share a smile, petals drifting) then the cross-dissolve to scene 02
 * (Episode03.tsx: this scene keeps drawing through it).
 * Subtitles and audio are handled by Episode03.tsx.
 */

const S01 = "01_sharad_flower_gathering";
const SCENE = EP03_SCENES.find((s) => s.sceneId === S01)!;
const DUR = SCENE.durationFrames;
const PZ = pausesFor3(S01);

/** Real local frame where a narration phrase starts (after a pause that holds at its first story frame). */
const lineReal = (snippet: string, fallback: number) => {
  const c = cueLocalStory3(snippet, S01);
  return c ? storyToReal(c.from + 1, PZ) - 1 : fallback;
};
/** Frames from a cue's start to the first syllable, measured on the clip parts (01a_Narrator_Dawn_p1..p3). */
const VOICE_LAG = { l1: 7, l2: 11, l3: 17, l4: 9 };
const pauseWin = (i: number, fbStart: number, fbLen: number) => {
  const p = PZ[i];
  const start = p ? storyToReal(p.atStory, PZ) : fbStart;
  return { start, end: start + (p ? p.frames : fbLen) };
};

/** Real local frames of the beats. */
const T = {
  l1: lineReal("শরতের", 0) + VOICE_LAG.l1,
  l2: lineReal("শিউলি", 91) + VOICE_LAG.l2,
  l3: lineReal("বাড়ির মেয়েরা", 247) + VOICE_LAG.l3,
  l4: lineReal("জবা আর", 335) + VOICE_LAG.l4,
  p1: pauseWin(0, 55, 36),
  p2: pauseWin(1, 223, 24),
  p3: pauseWin(2, 423, 36),
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type FlowerKind = "jaba" | "shiuli" | "jhumko";
type Pt = { x: number; y: number };

const mod = (a: number, m: number) => ((a % m) + m) % m;
const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);
const DEG = Math.PI / 180;

/**
 * Small breeze drift on a pose track (value noise, never a sine), so no two figures or moments repeat. Breathing,
 * blinks and idle sway come from the rig on lifeF.
 */
const alive = (act: (f: number) => Pose, seed: number): ((f: number) => Pose) => {
  return (f: number) => {
    const p = act(f);
    const n = (k: number, s: number) => noise1(f * k, seed * 7 + s);
    return {
      ...p,
      bodyX: p.bodyX + n(0.023, 1) * 1.0,
      lean: p.lean + n(0.017, 2) * 0.6,
      headTurn: p.headTurn + n(0.011, 3) * 0.04,
      headTilt: p.headTilt + n(0.013, 4) * 1.0,
      rS: p.rS + n(0.031, 5) * 0.8,
      lS: p.lS + n(0.029, 6) * 0.8,
    };
  };
};

/** Dawn: the low sun on the right gives a warm gold rim. */
const LIGHT: Lighting = { keySide: 1, rim: "#ffc786", rimStrength: 0.42 };

/** Small five- or six-petal flower, centred on (x, y). */
const Bloom: React.FC<{ x: number; y: number; r: number; kind: FlowerKind; rot?: number }> = ({ x, y, r, kind, rot = 0 }) => {
  const petal = kind === "jaba" ? "#d8222f" : kind === "shiuli" ? "#fbf7f0" : "#f5a524";
  const core = kind === "jaba" ? "#6f0a12" : kind === "shiuli" ? "#f0962c" : "#b8600e";
  const n = kind === "jhumko" ? 6 : 5;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
      {Array.from({ length: n }, (_, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={-r * 0.52}
          rx={r * (kind === "shiuli" ? 0.3 : 0.42)}
          ry={r * (kind === "shiuli" ? 0.56 : 0.6)}
          fill={petal}
          transform={`rotate(${(i * 360) / n})`}
        />
      ))}
      <circle r={r * 0.2} fill={core} />
    </g>
  );
};

/** A big open jaba (hibiscus) with its long stamen column, on the tree or the branch. */
const JabaBlossom: React.FC<{ x: number; y: number; r: number; rot?: number }> = ({ x, y, r, rot = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
    <Bloom x={0} y={0} r={r} kind="jaba" />
    <circle r={r * 0.62} fill="#b0141f" opacity={0.35} />
    <path d={`M 0 0 L ${r * 0.95} ${r * 0.55}`} stroke="#f2c14a" strokeWidth={Math.max(1.2, r * 0.1)} strokeLinecap="round" />
    <circle cx={r * 0.98} cy={r * 0.57} r={r * 0.13} fill="#ffd54a" />
  </g>
);

/** A hanging jhumko bloom (earring-like bell of orange-red frilled petals and a dangling stamen); (0, 0) is its top. */
const JhumkoBell: React.FC<{ x: number; y: number; s?: number; rot?: number }> = ({ x, y, s = 1, rot = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -9 2 Q 0 -6 9 2 Q 12 13 6 18 L 3 14 L 0 19 L -3 14 L -6 18 Q -12 13 -9 2 Z" fill="#ec5b2a" />
    <path d="M -5 3 Q 0 -1 5 3 Q 6 9 0 12 Q -6 9 -5 3 Z" fill="#f79a3e" opacity={0.85} />
    <path d="M 0 12 L 1 28" stroke="#f3c24a" strokeWidth={1.4} />
    <circle cx={1} cy={29} r={2.2} fill="#ffd24a" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Props: bamboo sajhi baskets. The origin is the handle apex, which   */
/* is the grip point, so the hand holds the handle and the basket      */
/* hangs below it, upright whatever the forearm angle.                */
/* ------------------------------------------------------------------ */

const SPOTS: Array<[number, number]> = [
  [-16, -12],
  [-4, -18],
  [10, -14],
  [20, -7],
  [-22, -5],
  [2, -7],
  [14, -2],
  [-9, -3],
  [-1, -24],
  [-12, -20],
  [8, -22],
];
const MIX_JABA: FlowerKind[] = ["jaba", "jaba", "shiuli"];
const MIX_JHUMKO: FlowerKind[] = ["jhumko", "jhumko", "jaba"];
const MIX_MIXED: FlowerKind[] = ["jaba", "jhumko", "shiuli"];

/** The basket body with its flowers, handle apex at (0, 0). */
const SajiBody: React.FC<{ level: number; mix: FlowerKind[] }> = ({ level, mix }) => {
  const n = Math.round(clamp(level) * SPOTS.length);
  return (
    <>
      <path d="M -24 17 Q 0 -17 24 17" stroke="#8c5f30" strokeWidth={3} fill="none" />
      <path d="M -26 19 Q -28 43 0 46 Q 28 43 26 19 Z" fill="#b8844a" />
      {[27, 34, 41].map((y) => (
        <path key={y} d={`M ${-25 + (y - 19) * 0.05} ${y} Q 0 ${y + 6} ${25 - (y - 19) * 0.05} ${y}`} stroke="#7a5227" strokeWidth={1.2} fill="none" opacity={0.6} />
      ))}
      <ellipse cx={0} cy={19} rx={26} ry={5.5} fill="#d6a867" stroke="#7a5227" strokeWidth={1.1} />
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = SPOTS[i];
        return <Bloom key={i} x={x} y={19 + y * 0.6} r={6.5} kind={mix[i % mix.length]} rot={i * 23} />;
      })}
    </>
  );
};

/** Basket with its handle apex at (0, 0). `fill` gives 0..1 flower level by frame. */
const basketProp =
  (fill: (f: number) => number, mix: FlowerKind[]): PropRenderer =>
  ({ f, scale, worldRot }) => (
    // counter-rotated against the forearm, so the basket always hangs upright from the grip
    <g transform={`rotate(${-worldRot}) scale(${scale * 0.9})`}>
      <SajiBody level={fill(f)} mix={mix} />
    </g>
  );

/** A saji standing on the ground (bottom at y). */
const GroundSaji: React.FC<{ x: number; y: number; s?: number; level: number; mix: FlowerKind[] }> = ({ x, y, s = 1.06, level, mix }) => (
  <g transform={`translate(${x}, ${y}) scale(${s}) translate(0, -46)`}>
    <ellipse cx={0} cy={46} rx={30} ry={6} fill="#1a0e08" opacity={0.3} />
    <SajiBody level={level} mix={mix} />
  </g>
);

/** A sprig of shiuli (Tuni's find). */
const Sprig: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale * 0.9}) translate(0, -18)`}>
    <path d="M 0 0 Q 6 -18 12 -34" stroke="#c4621c" strokeWidth={2} fill="none" strokeLinecap="round" />
    <Bloom x={12} y={-34} r={7} kind="shiuli" />
    <Bloom x={-2} y={-22} r={5.5} kind="shiuli" rot={30} />
    <Bloom x={24} y={-22} r={5.5} kind="shiuli" rot={-20} />
  </g>
);

/** One picked flower held between the fingers, on its way to the basket. */
const heldFlower =
  (kind: FlowerKind): PropRenderer =>
  ({ scale }) => (
    <g transform={`scale(${scale * 0.9})`}>
      {kind === "jhumko" ? <JhumkoBell x={0} y={-2} s={1.05} rot={10} /> : <Bloom x={0} y={6} r={kind === "jaba" ? 10 : 7.5} kind={kind} rot={20} />}
    </g>
  );

/* ------------------------------------------------------------------ */
/* Cast: the young girls of the house (বাড়ীর অল্পবয়স্কা মেয়েরা), just  */
/* bathed: loose damp hair down the back (LooseHair, below), plain      */
/* cotton saris, no sindoor; Mina has a gamchha round her shoulders.    */
/* The export names are kept (scene 02 imports them).                  */
/* ------------------------------------------------------------------ */

/** Sarala: the eldest girl, white cotton sari with a red border (laal-paar). */
export const S01_SARALA: CastMember = {
  id: "sarala",
  age: "adult",
  sex: "f",
  height: 0.95,
  girth: 0.94,
  skin: "#c98e62",
  skinLight: "#e6b088",
  skinShade: "#9e6443",
  lips: "#9c4f47",
  hair: "#1c1412",
  hairLight: "#4e3a30",
  hairStyle: "parted",
  outfit: "blouse",
  top: "#a8323a",
  topLight: "#c44c52",
  topShade: "#74222a",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#f1eadb",
  lowerShade: "#cfc3ab",
  lowerTrim: "#b52f36",
  scarf: { color: "#f1eadb", shade: "#cfc3ab", trim: "#b52f36", style: "drape" },
  seed: 101,
};

/** Mina: pale turmeric sari with a green border, a white gamchha round her shoulders. */
export const S01_MINA: CastMember = {
  id: "mina",
  age: "adult",
  sex: "f",
  height: 0.93,
  girth: 0.95,
  skin: "#d39a72",
  skinLight: "#eebf9a",
  skinShade: "#ad724e",
  lips: "#a85c55",
  hair: "#241915",
  hairLight: "#5a4438",
  hairStyle: "parted",
  outfit: "blouse",
  top: "#4f7a3a",
  topLight: "#6a9752",
  topShade: "#355427",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#e8cf86",
  lowerShade: "#bfa060",
  lowerTrim: "#4f7a3a",
  scarf: { color: "#eee5d3", shade: "#c9bca4", trim: "#b8453a", style: "neck" },
  seed: 207,
};

/** Tuni: the little girl, rose frock, pigtails. */
export const S01_TUNI: CastMember = {
  id: "tuni",
  age: "child",
  sex: "f",
  height: 0.9,
  girth: 0.98,
  skin: "#d9a07a",
  skinLight: "#f0c4a0",
  skinShade: "#b47853",
  lips: "#b0605a",
  hair: "#1a1211",
  hairLight: "#4a3830",
  hairStyle: "pigtails",
  outfit: "frock",
  top: "#e9829a",
  topLight: "#f6a6b6",
  topShade: "#b35a72",
  sleeve: "half",
  lower: "none",
  lowerColor: "#4f9a8e",
  lowerShade: "#2f6d63",
  seed: 311,
};

/** Rekha: soft sea-green cotton sari with a maroon border. */
export const S01_REKHA: CastMember = {
  id: "rekha",
  age: "adult",
  sex: "f",
  height: 0.94,
  girth: 0.93,
  skin: "#b97a52",
  skinLight: "#d89a70",
  skinShade: "#8d5536",
  lips: "#94493f",
  hair: "#1f1714",
  hairLight: "#45342c",
  hairStyle: "parted",
  outfit: "blouse",
  top: "#7a2f34",
  topLight: "#97474c",
  topShade: "#4e1c20",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#8fbcaa",
  lowerShade: "#5f8e7c",
  lowerTrim: "#7a2f34",
  scarf: { color: "#8fbcaa", shade: "#5f8e7c", trim: "#7a2f34", style: "drape" },
  seed: 419,
};

/** Lata: the youngest of the sari-clad girls, soft rose-pink cotton sari with a purple border. */
export const S01_LATA: CastMember = {
  id: "lata",
  age: "adult",
  sex: "f",
  height: 0.9,
  girth: 0.9,
  skin: "#c88a60",
  skinLight: "#e4ad86",
  skinShade: "#9c6242",
  lips: "#a0544c",
  hair: "#1d1513",
  hairLight: "#4c3a31",
  hairStyle: "parted",
  outfit: "blouse",
  top: "#5b3f7a",
  topLight: "#775a96",
  topShade: "#3d2954",
  sleeve: "half",
  lower: "saree",
  lowerColor: "#f0c9c4",
  lowerShade: "#c99c97",
  lowerTrim: "#5b3f7a",
  scarf: { color: "#f0c9c4", shade: "#c99c97", trim: "#5b3f7a", style: "drape" },
  seed: 523,
};

/**
 * Loose, damp hair falling down the back (just bathed), drawn BEHIND a standing Puppet in its own coordinates: it
 * follows the pose's bodyX, bodyY and lean (rotation about the hip), so it rides the figure; the rig's parted hair
 * cap sits on top of it. Proportions follow the rig's adult body (Puppet bodyFor). Only for standing figures
 * (crouch 0). The ends sway a little in the breeze; a few glossy strands read as wet.
 */
const LooseHair: React.FC<{ cast: CastMember; acting: (f: number) => Pose; f: number; lifeF: number; x: number; y: number; scale: number }> = ({
  cast,
  acting,
  f,
  lifeF,
  x,
  y,
  scale,
}) => {
  const p = acting(f);
  const h = cast.height;
  const R = 41 * Math.sqrt(h);
  const hipY = -162.7 * h;
  const shY = hipY - 108 * h;
  const headY = shY - 11 * h - R * 0.86;
  // in a three-quarter view the fall shows on the back side of the head
  const back = -Math.sign(p.bodyTurn || 0.001) * clamp(Math.abs(p.bodyTurn) / 0.5) * R * 0.32;
  const sw = 47 * h;
  const endY = shY + 108 * h * 0.62;
  const sway = 3 * noise1(lifeF * 0.03, cast.seed) + 2 * Math.sin(lifeF * 0.05 + cast.seed);
  const xb = back;
  const d = `M ${xb - R * 0.98} ${headY - R * 0.2}
    Q ${xb - R * 1.08} ${headY + R * 0.9} ${xb - sw * 0.78} ${shY + 10}
    Q ${xb - sw * 0.84 + sway * 0.5} ${shY + (endY - shY) * 0.55} ${xb - sw * 0.6 + sway} ${endY}
    Q ${xb + sway} ${endY + 12} ${xb + sw * 0.6 + sway} ${endY - 4}
    Q ${xb + sw * 0.82 + sway * 0.5} ${shY + (endY - shY) * 0.5} ${xb + sw * 0.76} ${shY + 8}
    Q ${xb + R * 1.08} ${headY + R * 0.9} ${xb + R * 0.98} ${headY - R * 0.2}
    Q ${xb} ${headY - R * 1.25} ${xb - R * 0.98} ${headY - R * 0.2} Z`;
  return (
    <g transform={`translate(${x + p.bodyX}, ${y + p.bodyY}) scale(${scale}) rotate(${p.lean}, 0, ${hipY})`}>
      <path d={d} fill={cast.hair} />
      {[-0.5, -0.15, 0.2, 0.5].map((k, i) => (
        <path
          key={i}
          d={`M ${xb + k * R * 1.4} ${headY + R * 0.4} Q ${xb + k * sw * 1.3 + sway * 0.3} ${shY + 20} ${xb + k * sw * 1.05 + sway * 0.8} ${endY - 6}`}
          stroke={cast.hairLight}
          strokeWidth={1.6}
          fill="none"
          opacity={0.55}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Layout (world px on the depth-1 floor plane; see the header)        */
/* ------------------------------------------------------------------ */

export const VEDIC_COURTYARD = {
  shiuli: { x: 300, y: 872 },
  jhumko: { x: 700, y: 868, crown: { x: 690, y: 470 } },
  jaba: { x: 1080, y: 866, crown: { x: 1040, y: 420 } },
  tulsi: { x: 1700, y: 842, s: 1.1 },
  sajisAtTulsi: [1596, 1652, 1752, 1806],
} as const;

const FIG_SCALE = 1.18;
const BACK_SCALE = 1.14; // the two branch holders stand a step further back
const SHIULI_TREE = VEDIC_COURTYARD.shiuli;
const POS = {
  sarala: { x: 1230, y: 934 },
  lata: { x: 1562, y: 930 },
  mina: { x: 1350, y: 982 },
  tuni: { x: 470, y: 978 },
  rekha: { x: 800, y: 980 },
};

/* ------------------------------------------------------------------ */
/* Two-bone arm IK onto a world point, in the Puppet rig's terms       */
/* (adult body proportions from Puppet bodyFor; an arm's direction at  */
/* angle A is (side * sin A, cos A); elbows bend outward).             */
/* ------------------------------------------------------------------ */

const armIK = (c: CastMember, p: Pose, x: number, y: number, scale: number, side: 1 | -1, target: Pt): { S: number; E: number } => {
  const h = c.height;
  const g = c.girth;
  const sw = 47 * h * (0.85 + 0.15 * g);
  const limbW = 8.8 * h * (0.9 + 0.1 * g);
  const a = 56 * h * scale;
  const b = (52 * h + 0.45 * 37 * h) * scale; // forearm plus the grip point inside the hand
  const hipY = -162.7 * h;
  const phi = clamp(p.bodyTurn, -1, 1) * 0.95;
  const lx = side * sw * 0.86 * Math.cos(phi);
  const ly = hipY - 108 * h + limbW - hipY;
  const cl = Math.cos(p.lean * DEG);
  const sl = Math.sin(p.lean * DEG);
  const shX = x + p.bodyX + (lx * cl - ly * sl) * scale;
  const shY = y + p.bodyY + (lx * sl + ly * cl + hipY) * scale;
  // target in the body frame (undo the lean)
  const dx = target.x - shX;
  const dy = target.y - shY;
  const ux = dx * cl + dy * sl;
  const uy = -dx * sl + dy * cl;
  const d = clamp(Math.hypot(ux, uy), Math.abs(a - b) + 1, a + b - 0.5);
  const ang = (vx: number, vy: number) => {
    let t = Math.atan2(side * vx, vy) / DEG;
    if (t < -90) t += 360;
    return t;
  };
  const phiT = ang(ux, uy);
  const alpha = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)) / DEG;
  const S = phiT - alpha;
  const ex = side * a * Math.sin(S * DEG);
  const ey = a * Math.cos(S * DEG);
  let E = ang(ux - ex, uy - ey) - S;
  while (E > 180) E -= 360;
  while (E < -180) E += 360;
  return { S, E };
};

/* ------------------------------------------------------------------ */
/* The long jaba branch, pulled down by Sarala and Lata               */
/* ------------------------------------------------------------------ */

/** Base control points: crown exit, Sarala's two grips, Lata's two grips, the free tip. */
const BRANCH_BASE: Pt[] = [
  { x: 1100, y: 455 },
  { x: 1186, y: 534 },
  { x: 1274, y: 542 },
  { x: 1522, y: 566 },
  { x: 1604, y: 580 },
  { x: 1702, y: 618 },
];
/** How much each control point takes of a pluck's shiver (the holders damp it). */
const BRANCH_GIVE = [0, 0.35, 0.6, 0.75, 0.6, 1];

/** Jaba flowers hanging under the branch that Mina picks, in pick order (positions are where her hand takes them). */
const MINA_FLOWERS: Pt[] = [
  { x: 1410, y: 584 },
  { x: 1430, y: 576 },
  { x: 1418, y: 596 },
  { x: 1440, y: 590 },
];
/** Jhumko bells under the jhumko crown that Rekha picks, in pick order. */
const REKHA_BELLS: Pt[] = [
  { x: 664, y: 668 },
  { x: 680, y: 656 },
  { x: 656, y: 682 },
  { x: 690, y: 664 },
];

/* ------------------------------------------------------------------ */
/* Acting (real local frames, keyed to the beats T). Keys are          */
/* cumulative; `in` is the move length before `f`.                     */
/* ------------------------------------------------------------------ */

/**
 * A repeating pick cycle: reach to the flower (per cycle), take it (it appears in the hand), carry it to the basket
 * and let it go (the basket fills by one). Returns the keys, the grab frames (the flower leaves the tree) and the
 * release frames (for the basket fill).
 */
const pickCycles = (
  start: number,
  count: number,
  period: number,
  hand: "r" | "l",
  reach: (k: number) => Partial<Pose>,
  drop: Partial<Pose>,
  rest: Partial<Pose>,
  flower: string,
) => {
  const keys: PoseKey<Pose>[] = [];
  const grabs: number[] = [];
  const releases: number[] = [];
  const P = hand === "r" ? "rProp" : "lProp";
  const H = hand === "r" ? "rHand" : "lHand";
  for (let k = 0; k < count; k++) {
    const t0 = start + k * period;
    const r = reach(k);
    keys.push({ f: t0 + 14, in: 14, ease: "inOut", ...r, [H]: "cup", [P]: "" } as PoseKey<Pose>);
    keys.push({ f: t0 + 22, in: 8, ease: "out", ...r, headNod: (r.headNod ?? 0) + 2, [H]: "hold", [P]: flower } as PoseKey<Pose>);
    keys.push({ f: t0 + 38, in: 16, ease: "inOut", ...drop, headNod: drop.headNod ?? 0, [H]: "hold", [P]: flower } as PoseKey<Pose>);
    keys.push({ f: t0 + 44, in: 6, ease: "out", [H]: "open", [P]: "" } as PoseKey<Pose>);
    grabs.push(t0 + 20);
    releases.push(t0 + 42);
    if (k === count - 1) keys.push({ f: t0 + 60, in: 16, ease: "inOut", ...rest, [H]: "relaxed", [P]: "" } as PoseKey<Pose>);
  }
  return { keys, grabs, releases };
};

/** Basket fill: starts at `base` and rises one flower per release, eased over 4 frames. */
const fillFrom = (base: number, releases: number[]) => (f: number) =>
  base + releases.reduce((acc, r) => acc + clamp((f - r) / 4) / SPOTS.length, 0);

/** A reach pose whose arm is solved onto a world point. */
const reachTo = (c: CastMember, pos: Pt, scale: number, side: 1 | -1, base: Partial<Pose>, target: Pt): Partial<Pose> => {
  const p = { ...BASE_POSE, ...base } as Pose;
  const { S, E } = armIK(c, p, pos.x, pos.y, scale, side, target);
  return side === 1 ? { ...base, rS: S, rE: E } : { ...base, lS: S, lE: E };
};

/* Mina: basket at her hip on the left forearm, picks jaba from the held branch with her right hand; in P3 she turns to Rekha and smiles. */
const MINA_REST: Partial<Pose> = { rS: 8, rE: -14, lean: 0, headNod: 0, headTurn: 0.1, eyeY: 0 };
const MINA_REACH_BASE: Partial<Pose> = { bodyTurn: 0.3, lean: 2, headNod: -7, headTurn: 0.35, eyeY: -0.6, eyeX: 0.3 };
const MINA_DROP: Partial<Pose> = { rS: 28, rE: -78, lean: 2, headNod: 9, headTurn: 0.1, eyeY: 0.4, eyeX: 0 };
const minaReach = (i: number) => reachTo(S01_MINA, POS.mina, FIG_SCALE, 1, MINA_REACH_BASE, MINA_FLOWERS[i]);
const minaPicks1 = pickCycles(30, 2, 62, "r", (k) => minaReach(k), MINA_DROP, MINA_REST, "jaba");
const minaPicks2 = pickCycles(T.l3 + 20, 1, 60, "r", () => minaReach(2), MINA_DROP, MINA_REST, "jaba");
const minaPicks3 = pickCycles(T.l4 - 8, 1, 60, "r", () => minaReach(3), MINA_DROP, MINA_REST, "jaba");
const MINA_GRABS = [...minaPicks1.grabs, ...minaPicks2.grabs, ...minaPicks3.grabs];
const MINA_ACT = alive(
  A([
    { f: 0, bodyTurn: 0.3, headTurn: 0.25, smile: 0.3, lS: 18, lE: -75, lHand: "hold", lProp: "basket", rS: 8, rE: -14, rHand: "relaxed" },
    ...minaPicks1.keys,
    ...minaPicks2.keys,
    ...minaPicks3.keys,
    // she settles the full basket and looks down into it
    { f: T.l4 + 70, in: 16, ease: "inOut", headNod: 7, eyeY: 0.5, smile: 0.5 },
    // P3: she looks across (left) at Rekha's full basket and they share a smile
    { f: T.p3.start + 4, in: 20, ease: "inOut", headTurn: -0.5, eyeX: -0.5, eyeY: 0, headNod: 0, smile: 0.7, headTilt: -3 },
    { f: T.p3.start + 26, in: 14, ease: "inOut", headNod: 4 },
    { f: T.p3.end + 6, in: 16, ease: "inOut", headNod: 0, smile: 0.6 },
  ]),
  2,
);
const fillMina = fillFrom(0.4, [...minaPicks1.releases, ...minaPicks2.releases, ...minaPicks3.releases]);

/* Rekha: faces left toward the jhumko tree; basket at her hip on the right forearm, picks jhumko with her left hand. */
const REKHA_REST: Partial<Pose> = { lS: 8, lE: -14, lean: 0, headNod: 0, eyeY: 0 };
const REKHA_REACH_BASE: Partial<Pose> = { bodyTurn: -0.35, lean: -3, headNod: -5, headTurn: -0.35, eyeY: -0.4 };
const REKHA_DROP: Partial<Pose> = { lS: -7, lE: -49, lean: -2, headNod: 9, headTurn: -0.15, eyeY: 0.4 };
const rekhaReach = (i: number) => reachTo(S01_REKHA, POS.rekha, FIG_SCALE, -1, REKHA_REACH_BASE, REKHA_BELLS[i]);
const rekhaPicks1 = pickCycles(18, 2, 58, "l", (k) => rekhaReach(k), REKHA_DROP, REKHA_REST, "jhumko");
const rekhaPicks2 = pickCycles(T.l3 + 4, 1, 58, "l", () => rekhaReach(2), REKHA_DROP, REKHA_REST, "jhumko");
const rekhaPicks3 = pickCycles(T.l4 + 6, 1, 56, "l", () => rekhaReach(3), REKHA_DROP, REKHA_REST, "jhumko");
const REKHA_GRABS = [...rekhaPicks1.grabs, ...rekhaPicks2.grabs, ...rekhaPicks3.grabs];
const REKHA_ACT = alive(
  A([
    { f: 0, bodyTurn: -0.35, headTurn: -0.3, smile: 0.35, rS: 18, rE: -75, rHand: "hold", rProp: "basket", lS: 8, lE: -14, lHand: "relaxed" },
    ...rekhaPicks1.keys,
    ...rekhaPicks2.keys,
    ...rekhaPicks3.keys,
    // she tucks the last flower in and looks over the basket
    { f: T.l4 + 74, in: 14, ease: "inOut", headNod: 6, eyeY: 0.4, smile: 0.5 },
    // P3: she turns her head (right) to meet Mina's look and smiles back
    { f: T.p3.start + 10, in: 20, ease: "inOut", bodyTurn: -0.1, headTurn: 0.45, eyeX: 0.5, eyeY: 0, headNod: 0, smile: 0.75, headTilt: 3 },
    { f: T.p3.start + 30, in: 14, ease: "inOut", headNod: 3 },
    { f: T.p3.end + 6, in: 16, ease: "inOut", headNod: 0, smile: 0.6 },
  ]),
  4,
);
const fillRekha = fillFrom(0.45, [...rekhaPicks1.releases, ...rekhaPicks2.releases, ...rekhaPicks3.releases]);

/** The branch at frame f: each of Mina's plucks makes it dip and shiver (damped), plus a slow breeze at the tip. */
const branchAt = (f: number): Pt[] => {
  let dip = 0;
  for (const g of MINA_GRABS) {
    const t = f - g;
    if (t >= 0 && t < 70) dip += 6 * Math.exp(-t / 13) * Math.sin(t * 0.42 + 0.35);
  }
  const breeze = 2.2 * noise1(f * 0.018, 77) + 1.2 * noise1(f * 0.041, 78);
  return BRANCH_BASE.map((p, i) => ({ x: p.x + BRANCH_GIVE[i] * breeze * 0.4, y: p.y + BRANCH_GIVE[i] * (dip + breeze) }));
};

/** A branch holder: base acting plus both arms solved every frame onto their grip points on the branch. */
const holder = (c: CastMember, pos: Pt, scale: number, base: (f: number) => Pose, grips: [number, number]) => (f: number): Pose => {
  const p = base(f);
  const br = branchAt(f);
  const L = armIK(c, p, pos.x, pos.y, scale, -1, br[grips[0]]);
  const R = armIK(c, p, pos.x, pos.y, scale, 1, br[grips[1]]);
  return { ...p, lS: L.S, lE: L.E, rS: R.S, rE: R.E, lHand: "hold", rHand: "hold" };
};

/* Sarala: holds the branch down near the crown, looks up at Mina's picking, glances at Tuni in P2, hums softly. */
const SARALA_ACT = holder(
  S01_SARALA,
  POS.sarala,
  BACK_SCALE,
  alive(
    A([
      { f: 0, bodyTurn: 0.15, headTurn: 0.25, headNod: -4, eyeY: -0.3, eyeX: 0.3, smile: 0.45 },
      { f: 60, in: 30, ease: "inOut", headTurn: 0.35, headTilt: 3, eyeY: -0.1 },
      { f: T.p1.end, in: 26, ease: "inOut", headTurn: 0.2, headTilt: -2, headNod: -6, eyeY: -0.5 },
      // P2: she glances across at Tuni, who is smelling her shiuli
      { f: T.p2.start - 14, in: 18, ease: "inOut", headTurn: -0.45, eyeX: -0.5, eyeY: 0.1, headNod: 0, smile: 0.55, headTilt: -3 },
      { f: T.p2.end + 4, in: 20, ease: "inOut", headTurn: 0.3, eyeX: 0.3, eyeY: -0.3, smile: 0.45, headTilt: 0, headNod: -4 },
      { f: T.l4 + 10, in: 26, ease: "inOut", headTurn: 0.4, headTilt: 4 },
      // P3: she looks over the brimming baskets with a smile
      { f: T.p3.start, in: 24, ease: "inOut", headTurn: 0.45, eyeX: 0.4, eyeY: 0.2, headNod: 3, smile: 0.6 },
    ]),
    1,
  ),
  [1, 2],
);

/* Lata: holds the branch near its far end, watches Mina, smiles, hums along with Sarala. */
const LATA_ACT = holder(
  S01_LATA,
  POS.lata,
  BACK_SCALE,
  alive(
    A([
      { f: 0, bodyTurn: -0.2, headTurn: -0.3, headNod: -3, eyeY: -0.2, eyeX: -0.4, smile: 0.5 },
      { f: 80, in: 30, ease: "inOut", headTurn: -0.2, headTilt: -3, eyeY: -0.4 },
      { f: T.l2 + 70, in: 30, ease: "inOut", headTurn: -0.4, headTilt: 2, eyeY: 0, smile: 0.55 },
      { f: T.l3 + 30, in: 28, ease: "inOut", headTurn: -0.28, headNod: -5, eyeY: -0.4 },
      { f: T.p3.start + 6, in: 24, ease: "inOut", headTurn: -0.45, headNod: 2, eyeY: 0.3, smile: 0.65 },
    ]),
    5,
  ),
  [3, 4],
);

/**
 * Soft humming of an unheard tune (মৃদু মৃদু সুরে গানের কলি): small rounded openings in slow phrases with rests, on the
 * life clock, never synced to the narrator.
 */
const hum =
  (seed: number) =>
  (f: number): MouthState => {
    const phrase = clamp((noise1(f / 64, seed) + 0.15) * 3);
    const syl = 0.5 + 0.5 * Math.sin(f * 0.19 + seed + 1.4 * noise1(f / 27, seed + 1));
    const round = 0.55 + 0.35 * noise1(f / 41, seed + 2);
    return { open: phrase * (0.06 + 0.16 * syl), width: 1 - 0.25 * round, round: round * phrase, teeth: 0 };
  };
const MOUTH_SARALA = hum(13);
const MOUTH_LATA = hum(29);

/*
 * Tuni: watches the shiuli fall (P1), crouches on "শিউলি" to pick one from the ground, rises with the sprig as the push
 * lands, holds it to her nose and smiles (P2), then turns to the girls with it held at her chest.
 */
const TUNI_ACT = alive(
  A([
    { f: 0, bodyTurn: 0.25, headTurn: 0.1, headTilt: -6, eyeY: -0.5, smile: 0.5, rS: 6, rE: -10, rHand: "relaxed", lS: 10, lE: -16, lHand: "relaxed" },
    // P1: her eyes follow a falling flower, a palm opens to it
    { f: T.p1.start - 6, in: 20, ease: "inOut", headTilt: -10, eyeY: -0.8, headTurn: 0.2, lS: 34, lE: -40, lHand: "open", smile: 0.6 },
    { f: T.p1.end - 6, in: 22, ease: "inOut", headTilt: 2, eyeY: 0.4, lS: 22, lE: -30 },
    // "শিউলি": crouch to the fallen flowers (starts 6 frames before the word)
    { f: T.l2 + 18, in: 24, ease: "inOut", crouch: 0.82, lean: 9, headTilt: 6, eyeY: 0.6, rS: -4, rE: -2, rHand: "cup", lS: 10, lE: -16, lHand: "relaxed" },
    { f: T.l2 + 34, in: 14, ease: "inOut", rS: -6, rE: 0, rHand: "hold", rProp: "sprig" },
    { f: T.l2 + 50, in: 14, ease: "inOut", crouch: 0.78, lean: 7, headTilt: 4 },
    // rises and lifts the sprig to look at it as the push lands
    { f: T.l2 + 84, in: 32, ease: "inOut", crouch: 0, lean: 0, rS: 96, rE: -100, rHand: "hold", rProp: "sprig", headTilt: 8, eyeY: -0.2, smile: 0.85 },
    // P2: to her nose, eyes close, a smile
    { f: T.p2.start - 8, in: 22, ease: "inOut", rS: 122, rE: -128, headTilt: 4, lid: 0.85, smile: 0.95, headNod: -3 },
    { f: T.p2.end + 6, in: 16, ease: "inOut", lid: 0, headNod: 0, smile: 0.9 },
    // turns to the girls, the sprig at her chest
    { f: T.l3 + 20, in: 26, ease: "inOut", bodyTurn: 0.45, headTurn: 0.4, rS: 70, rE: -95, headTilt: 0, smile: 0.7 },
    { f: T.l4, in: 30, ease: "inOut", headTilt: -3, smile: 0.6 },
  ]),
  3,
);

const PROPS_MINA: Record<string, PropRenderer> = { basket: basketProp(fillMina, MIX_JABA), jaba: heldFlower("jaba") };
const PROPS_TUNI: Record<string, PropRenderer> = { sprig: Sprig };
const PROPS_REKHA: Record<string, PropRenderer> = { basket: basketProp(fillRekha, MIX_JHUMKO), jhumko: heldFlower("jhumko") };

/* ------------------------------------------------------------------ */
/* Set pieces the scene adds to the Vedic house courtyard              */
/* ------------------------------------------------------------------ */

/** Raised earthen ring bed with a brick rim round a tree's foot (trees in a flagstone courtyard). */
const TreeBed: React.FC<{ x: number; y: number; rx: number }> = ({ x, y, rx }) => (
  <g>
    <ellipse cx={x} cy={y + 4} rx={rx + 10} ry={rx * 0.22 + 4} fill="#1a0e08" opacity={0.28} />
    <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.22} fill="#8a5a3a" />
    <ellipse cx={x} cy={y - 3} rx={rx - 7} ry={rx * 0.22 - 3} fill="#5a3a26" />
    <ellipse cx={x + rx * 0.3} cy={y - 4} rx={rx * 0.35} ry={rx * 0.06} fill="#7a5236" opacity={0.6} />
  </g>
);

/** Shiuli (night jasmine) tree: sways from the trunk base, white flowers, orange stems. */
const ShiuliTree: React.FC<{ x: number; y: number; seed: number; f: number }> = ({ x, y, seed, f }) => {
  const angle = 0.6 * Math.sin(f * 0.026 + seed) + 0.45 * noise1(f * 0.016, seed + 4);
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <path d="M -16 0 Q -6 -180 -2 -330 L 10 -330 Q 8 -180 18 0 Z" fill="#6e4b30" />
      <path d="M 0 -280 L -120 -420" stroke="#6e4b30" strokeWidth={8} strokeLinecap="round" />
      <path d="M 10 -300 L 130 -440" stroke="#6e4b30" strokeWidth={8} strokeLinecap="round" />
      <path d="M 0 -330 L -20 -500" stroke="#6e4b30" strokeWidth={7} strokeLinecap="round" />
      {Array.from({ length: 10 }, (_, i) => (
        <circle
          key={`c${i}`}
          cx={(hash(seed * 17 + i) - 0.5) * 360}
          cy={-470 + (hash(seed * 29 + i) - 0.5) * 190}
          r={86 + hash(seed * 41 + i) * 40}
          fill={i % 3 === 0 ? "#2f5a31" : i % 3 === 1 ? "#3d6b3a" : "#4d7f45"}
        />
      ))}
      {/* the sunlit (right) side of the crown */}
      <ellipse cx={110} cy={-500} rx={120} ry={90} fill="#ffd89a" opacity={0.14} />
      {Array.from({ length: 80 }, (_, i) => {
        const cx = (hash(seed * 100 + i * 3.7) - 0.5) * 400;
        const cy = -490 + (hash(seed * 100 + i * 5.1) - 0.5) * 260;
        return (
          <g key={`f${i}`}>
            <circle cx={cx} cy={cy} r={3.6} fill="#fbf7f0" />
            <circle cx={cx} cy={cy + 1.2} r={1.3} fill="#f0962c" />
          </g>
        );
      })}
    </g>
  );
};

/** The carpet of fallen shiuli on the flagstones under the tree. */
const FallenShiuli: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    {Array.from({ length: 60 }, (_, i) => {
      const a = hash(i * 3.9 + 2) * Math.PI * 2;
      const r = Math.sqrt(hash(i * 5.3 + 1));
      return <Bloom key={i} x={x + Math.cos(a) * 240 * r} y={y + 40 + Math.sin(a) * 44 * r + 12} r={5} kind="shiuli" rot={i * 37} />;
    })}
  </g>
);

/** Leafy crown made of overlapping clusters, darker below and warm-lit on the sun side (right). */
const Crown: React.FC<{ cx: number; cy: number; rx: number; ry: number; seed: number; tones: [string, string, string] }> = ({ cx, cy, rx, ry, seed, tones }) => (
  <g>
    {Array.from({ length: 20 }, (_, i) => {
      const a = hash(seed * 13 + i * 2.7) * Math.PI * 2;
      const r = Math.sqrt(hash(seed * 7 + i * 4.1)) * 0.78;
      const x = cx + Math.cos(a) * rx * r;
      const y = cy + Math.sin(a) * ry * r;
      return <circle key={i} cx={x} cy={y} r={(0.34 + hash(seed * 3 + i) * 0.16) * rx} fill={tones[i % 3]} />;
    })}
    <ellipse cx={cx} cy={cy + ry * 0.55} rx={rx * 0.8} ry={ry * 0.32} fill="#1c3a1c" opacity={0.28} />
    <ellipse cx={cx + rx * 0.45} cy={cy - ry * 0.3} rx={rx * 0.5} ry={ry * 0.45} fill="#ffd89a" opacity={0.13} />
    {Array.from({ length: 34 }, (_, i) => {
      const a = hash(seed * 31 + i * 1.9) * Math.PI * 2;
      const r = 0.55 + hash(seed * 37 + i) * 0.45;
      const x = cx + Math.cos(a) * rx * r;
      const y = cy + Math.sin(a) * ry * r;
      return <ellipse key={`l${i}`} cx={x} cy={y} rx={13} ry={6} fill={i % 2 ? "#4e8a44" : "#2e5e2c"} transform={`rotate(${a * 57 + 20} ${x} ${y})`} />;
    })}
  </g>
);

/** Big jaba tree (taller than the girls): trunk, forks, a broad crown dotted with big red jaba. */
const JabaTree: React.FC<{ f: number }> = ({ f }) => {
  const { x, y, crown } = VEDIC_COURTYARD.jaba;
  const sway = 0.25 * noise1(f * 0.014, 61);
  return (
    <g transform={`rotate(${sway} ${x} ${y})`}>
      <path d={`M ${x - 18} ${y} Q ${x - 10} ${y - 200} ${x - 24} ${y - 330} L ${x - 4} ${y - 334} Q ${x + 8} ${y - 200} ${x + 18} ${y} Z`} fill="#6a4a32" />
      <path d={`M ${x - 4} ${y - 30} Q ${x + 2} ${y - 200} ${x - 8} ${y - 320}`} stroke="#8a6446" strokeWidth={4} fill="none" opacity={0.6} />
      <path d={`M ${x - 14} ${y - 300} Q ${x - 90} ${y - 380} ${x - 170} ${y - 420}`} stroke="#6a4a32" strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d={`M ${x - 10} ${y - 310} Q ${x + 10} ${y - 380} ${x + 40} ${y - 470}`} stroke="#6a4a32" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d={`M ${x - 6} ${y - 320} Q ${x + 10} ${y - 380} ${x + 30} ${y - 410}`} stroke="#6a4a32" strokeWidth={12} fill="none" strokeLinecap="round" />
      <Crown cx={crown.x} cy={crown.y} rx={210} ry={170} seed={11} tones={["#2c5a2a", "#3a6c34", "#467a3c"]} />
      {Array.from({ length: 22 }, (_, i) => {
        const a = i * 2.39996 + 0.7;
        const r = 0.35 + 0.6 * Math.sqrt((i + 0.5) / 22);
        return <JabaBlossom key={i} x={crown.x + Math.cos(a) * 200 * r} y={crown.y + Math.sin(a) * 160 * r} r={12 + hash(i * 2.2) * 4} rot={i * 47} />;
      })}
    </g>
  );
};

/** Dense points along a Catmull-Rom spline through the control points. */
const spline = (pts: Pt[], per = 10): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push({ x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const nearestOn = (line: Pt[], x: number): Pt => line.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best), line[0]);

/** The long jaba branch held down by Sarala and Lata: tapered wood, leaves, flowers; Mina's flowers leave as she picks. */
const JabaBranch: React.FC<{ f: number }> = ({ f }) => {
  const line = spline(branchAt(f));
  const n = line.length;
  return (
    <g>
      {line.slice(1).map((p, i) => (
        <line key={`w${i}`} x1={line[i].x} y1={line[i].y} x2={p.x} y2={p.y} stroke="#6a4a32" strokeWidth={12 - (7 * i) / n} strokeLinecap="round" />
      ))}
      {line.map((p, i) => {
        if (i < 4) return null;
        const side = i % 2 ? 1 : -1;
        const len = 14 + hash(i * 3.3) * 8;
        const rot = side * (40 + hash(i * 1.7) * 30) + 90 * (side > 0 ? 1 : 0);
        return <ellipse key={`lf${i}`} cx={p.x + side * 4} cy={p.y + side * 9} rx={len} ry={6} fill={i % 3 ? "#3a6c34" : "#2c5a2a"} transform={`rotate(${rot * 0.3} ${p.x} ${p.y})`} />;
      })}
      {/* flowers along the branch that stay (well away from Mina's reach) */}
      {[0.07, 0.13, 0.9, 0.97].map((u, i) => {
        const p = line[Math.round(u * (n - 1))];
        return <JabaBlossom key={`b${i}`} x={p.x + 4} y={p.y + 12} r={12} rot={i * 61 + 15} />;
      })}
      {/* the ones Mina picks: each hangs on a short twig until her grab frame */}
      {MINA_FLOWERS.map((fl, i) => {
        if (f >= MINA_GRABS[i]) return null;
        const p = nearestOn(line, fl.x);
        const dy = p.y - BRANCH_BASE[3].y; // ride the branch's dip
        return (
          <g key={`m${i}`}>
            <path d={`M ${p.x} ${p.y} Q ${fl.x - 4} ${(p.y + fl.y + dy) / 2} ${fl.x} ${fl.y + dy * 0.7 - 8}`} stroke="#3f6b35" strokeWidth={2.2} fill="none" />
            <JabaBlossom x={fl.x} y={fl.y + dy * 0.7} r={11} rot={i * 77 + 30} />
          </g>
        );
      })}
    </g>
  );
};

/** Big jhumko tree: trunk, a lighter crown, and orange-red bells hanging on long stalks; Rekha's bells leave as she picks. */
const JhumkoTree: React.FC<{ f: number }> = ({ f }) => {
  const { x, y, crown } = VEDIC_COURTYARD.jhumko;
  const sway = 0.3 * noise1(f * 0.015, 63);
  return (
    <g transform={`rotate(${sway} ${x} ${y})`}>
      <path d={`M ${x - 15} ${y} Q ${x - 6} ${y - 180} ${x - 16} ${y - 300} L ${x + 2} ${y - 302} Q ${x + 6} ${y - 180} ${x + 15} ${y} Z`} fill="#6e4e34" />
      <path d={`M ${x - 8} ${y - 280} Q ${x - 70} ${y - 340} ${x - 130} ${y - 380}`} stroke="#6e4e34" strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d={`M ${x - 4} ${y - 290} Q ${x + 40} ${y - 340} ${x + 110} ${y - 360}`} stroke="#6e4e34" strokeWidth={8} fill="none" strokeLinecap="round" />
      {/* a low drooping bough toward Rekha */}
      <path d={`M ${x - 6} ${y - 300} Q ${x - 20} ${y - 250} ${x - 50} ${y - 236}`} stroke="#6e4e34" strokeWidth={6} fill="none" strokeLinecap="round" />
      <Crown cx={crown.x} cy={crown.y} rx={185} ry={155} seed={23} tones={["#33632e", "#447a3a", "#52894a"]} />
      {/* hanging bells under the crown */}
      {Array.from({ length: 18 }, (_, i) => {
        const bx = crown.x + (hash(i * 5.9 + 1) - 0.5) * 330;
        const top = crown.y + 70 + hash(i * 3.1 + 2) * 70 - Math.abs(bx - crown.x) * 0.35;
        const len = 18 + hash(i * 2.7 + 5) * 26;
        const sw = 2.5 * noise1(f * 0.03, i * 3 + 9);
        return (
          <g key={i}>
            <path d={`M ${bx} ${top} Q ${bx + sw * 0.5} ${top + len * 0.5} ${bx + sw} ${top + len}`} stroke="#3f6b35" strokeWidth={1.4} fill="none" />
            <JhumkoBell x={bx + sw} y={top + len} s={0.95} rot={-sw * 3} />
          </g>
        );
      })}
      {/* the bells Rekha picks */}
      {REKHA_BELLS.map((b, i) => {
        if (f >= REKHA_GRABS[i]) return null;
        const top = { x: b.x + 10, y: crown.y + 150 };
        return (
          <g key={`r${i}`}>
            <path d={`M ${top.x} ${top.y} Q ${b.x + 6} ${(top.y + b.y) / 2} ${b.x} ${b.y - 6}`} stroke="#3f6b35" strokeWidth={1.6} fill="none" />
            <JhumkoBell x={b.x} y={b.y - 8} s={1.05} rot={8} />
          </g>
        );
      })}
    </g>
  );
};

/** Shiuli drifting down from the tree on the breeze (life clock). Each flower has its own speed, drift and spin. */
const FallingShiuli: React.FC<{ f: number; x: number; y0: number; y1: number }> = ({ f, x, y0, y1 }) => (
  <>
    {Array.from({ length: 12 }, (_, i) => {
      const span = y1 - y0;
      const vy = 0.9 + hash(i * 7.3 + 3) * 0.8;
      const ph = hash(i * 8.2 + 7) * 6.28;
      const yy = mod(hash(i * 5.7 + 2) * span + vy * f, span);
      const xx = x + (hash(i * 3.1 + 1) - 0.5) * 360 + yy * (0.25 + hash(i * 2.9 + 4) * 0.3) + Math.sin(f * (0.04 + hash(i) * 0.03) + ph) * 18;
      const fade = clamp(yy / 40) * clamp((span - yy) / 40);
      return (
        <g key={i} opacity={fade}>
          <Bloom x={xx} y={y0 + yy} r={5.5} kind="shiuli" rot={f * (1.5 + hash(i * 9.9 + 8) * 2.5) + ph * 57} />
        </g>
      );
    })}
  </>
);

/** Dew: tiny glints on the leaves that catch the low sun and fade, each on its own slow rhythm. */
const Dew: React.FC<{ f: number; spots: Array<[number, number, number]> }> = ({ f, spots }) => (
  <g style={{ mixBlendMode: "screen" }}>
    {spots.map(([x, y, s], i) => {
      const tw = Math.max(0, Math.sin(f * (0.05 + hash(i * 1.7) * 0.05) + i * 2.1));
      return <circle key={i} cx={x} cy={y} r={2.2 * s + 1.6 * tw} fill="#fff6dc" opacity={0.25 + 0.6 * tw * tw} />;
    })}
  </g>
);
const DEW_SPOTS: Array<[number, number, number]> = Array.from({ length: 28 }, (_, i) => {
  const which = i % 3;
  const base = which === 0 ? { x: 1100, y: 400, rx: 170, ry: 130 } : which === 1 ? { x: 740, y: 450, rx: 150, ry: 120 } : { x: 320, y: 390, rx: 160, ry: 110 };
  const a = hash(i * 4.1 + 9) * Math.PI * 2;
  const r = Math.sqrt(hash(i * 2.3 + 5));
  return [base.x + Math.cos(a) * base.rx * r, base.y + Math.sin(a) * base.ry * r, 0.8 + hash(i) * 0.6];
});

/** Shiuli and jaba petals drifting across the near foreground (P3 asks for petals still drifting). */
const NearPetals: React.FC<{ f: number }> = ({ f }) => (
  <>
    {Array.from({ length: 10 }, (_, i) => {
      const x0 = hash(i * 3.1 + 11) * 2600 - 300;
      const y0 = hash(i * 5.7 + 12) * 900;
      const vy = 0.7 + hash(i * 7.3 + 13) * 0.7;
      const drift = 0.5 + hash(i * 2.9 + 14) * 1.1;
      const y = mod(y0 + vy * f, 900) + 60;
      const x = mod(x0 + drift * f, 2600) - 300 + Math.sin(f * 0.05 + i) * 26;
      return <Bloom key={i} x={x} y={y} r={7} kind={i % 4 === 0 ? "jaba" : "shiuli"} rot={f * 2 + i * 40} />;
    })}
  </>
);

/** Autumn dawn sky above the house: pale blue to rose to gold, the low sun's glow on the right, slow clouds. */
const DawnSky: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="s01v-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9fb3d2" />
        <stop offset="55%" stopColor="#e9c9b4" />
        <stop offset="85%" stopColor="#ffd9a4" />
        <stop offset="100%" stopColor="#ffe6bc" />
      </linearGradient>
      <radialGradient id="s01v-sun">
        <stop offset="0%" stopColor="#fff6dc" stopOpacity={0.95} />
        <stop offset="30%" stopColor="#ffe0a0" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#ffc070" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-2000} y={-1600} width={6000} height={2600} fill="url(#s01v-sky)" />
    <circle cx={1760} cy={240} r={560} fill="url(#s01v-sun)" />
    {Array.from({ length: 6 }, (_, i) => {
      const x = mod(hash(i * 4.4) * 2600 + f * (0.08 + hash(i) * 0.06), 2900) - 500;
      const y = 40 + hash(i * 2.2) * 150;
      const s = 0.7 + hash(i * 3.3) * 0.6;
      return (
        <g key={i} transform={`translate(${x}, ${y}) scale(${s})`} opacity={0.55}>
          <ellipse cx={0} cy={0} rx={170} ry={26} fill="#f6d2c0" />
          <ellipse cx={-50} cy={-14} rx={80} ry={24} fill="#fbe0cc" />
          <ellipse cx={50} cy={-10} rx={90} ry={22} fill="#f3c8b2" />
        </g>
      );
    })}
  </g>
);

/** Hazy crowns of the trees beyond the house, just over its roofline. */
const FarTrees: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {/* irregular clumps of small crowns, low over the roof, in the dawn haze */}
    {Array.from({ length: 70 }, (_, i) => {
      const clump = Math.floor(i / 5);
      const x = -560 + clump * 230 + (hash(clump * 1.3) - 0.5) * 90 + (hash(i * 3.7) - 0.5) * 120;
      const y = 200 - hash(clump * 2.9) * 40 - hash(i * 5.1) * 45;
      const r = 26 + hash(i * 4.7) * 26;
      const sway = 1.5 * noise1(f * 0.012, clump);
      return <circle key={i} cx={x + sway} cy={y} r={r} fill={i % 3 ? "#a7ab97" : "#9aa08c"} />;
    })}
    <defs>
      <linearGradient id="s01v-haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#f4dcc4" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#f6dcbc" stopOpacity={0.15} />
      </linearGradient>
    </defs>
    <rect x={-2000} y={100} width={6000} height={160} fill="url(#s01v-haze)" />
  </g>
);

/** Drifting dawn mist: soft gold-white banks, each on its own slow drift (life clock). */
const Mist: React.FC<{ f: number; y: number; h: number; n: number; seed: number; opacity: number; x0?: number; w?: number }> = ({ f, y, h, n, seed, opacity, x0 = -600, w = 3200 }) => (
  <g opacity={opacity}>
    <defs>
      <radialGradient id={`s01v-mist-${seed}`}>
        <stop offset="0%" stopColor="#fff4e2" stopOpacity={0.9} />
        <stop offset="60%" stopColor="#ffeed6" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#ffeed6" stopOpacity={0} />
      </radialGradient>
    </defs>
    {Array.from({ length: n }, (_, i) => {
      const x = x0 + mod(hash(seed * 9 + i * 3.3) * w + f * (0.25 + hash(seed + i) * 0.35), w);
      const yy = y + (hash(seed * 5 + i * 1.7) - 0.5) * h;
      const rx = 260 + hash(seed * 3 + i) * 240;
      return <ellipse key={i} cx={x} cy={yy} rx={rx} ry={h * 0.5 + 20} fill={`url(#s01v-mist-${seed})`} />;
    })}
  </g>
);

/** Soft shafts of low sunlight slanting in from the upper right through the mist. */
const SunShafts: React.FC<{ f: number; level: number }> = ({ f, level }) => (
  <g style={{ mixBlendMode: "screen" }}>
    <defs>
      <linearGradient id="s01v-shaft" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff0c4" stopOpacity={0.5} />
        <stop offset="100%" stopColor="#ffd890" stopOpacity={0} />
      </linearGradient>
    </defs>
    {[0, 1, 2, 3].map((i) => {
      const x = 1500 + i * 260;
      const w = 70 + hash(i * 3.1) * 70;
      const o = level * (0.16 + 0.05 * noise1(f * 0.01, i + 40));
      return <path key={i} d={`M ${x} -200 L ${x + w} -200 L ${x - 900 + w * 2} 1000 L ${x - 900} 1000 Z`} fill="url(#s01v-shaft)" opacity={o} />;
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Camera (CAM-13): held shots, one motivated move per line, cue-keyed  */
/* ------------------------------------------------------------------ */

/** Keep the frame inside the courtyard: the depth-1 floor (x -400..2320, bottom 1384) and the depth-0.55 back (x -300..2220). */
const vedicKeepInSet = (c: Cam): Cam => {
  const z = Math.max(1, c.zoom);
  let cx = c.x + 960;
  const h1 = 960 / z;
  cx = clamp(cx, -400 + h1, 2320 - h1);
  const h2 = 960 / Math.pow(z, 0.55);
  cx = clamp(cx, (-300 + h2 - 960) / 0.55 + 960, (2220 - h2 - 960) / 0.55 + 960);
  return { ...c, x: cx - 960, y: Math.min(c.y, 844 - 540 / z) };
};

type Shot = { cx: number; cy: number; z: number };
const SHOTS: Record<"wide" | "tuni" | "row" | "hands", Shot> = {
  // the courtyard: the trees and the girls small, the tulsi mancha with its sajis at the right
  wide: { cx: 960, cy: 560, z: 1.0 },
  // the push lands on Tuni and the shiuli tree
  tuni: { cx: 600, cy: 640, z: 1.12 },
  // the girls at the trees: Tuni, Rekha at the jhumko, Sarala and Lata holding the jaba branch, Mina picking
  row: { cx: 1010, cy: 630, z: 1.2 },
  // Rekha's and Mina's hands and baskets
  hands: { cx: 1070, cy: 690, z: 1.5 },
};
const PUSH2 = 84;
const PUSH4 = 56;
const CUT3 = T.l3 - 2;

const sstep = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const blend = (a: Shot, b: Shot, t: number): Shot => {
  const k = sstep(t);
  return { cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k, z: a.z * Math.pow(b.z / a.z, k) };
};

const shotAt = (f: number): Shot =>
  f < CUT3 ? blend(SHOTS.wide, SHOTS.tuni, (f - T.l2) / PUSH2) : blend(SHOTS.row, SHOTS.hands, (f - T.l4) / PUSH4);

const camAt = (f: number): Cam => {
  const s = shotAt(f);
  return vedicKeepInSet({ x: s.cx - 960, y: s.cy - 540, zoom: s.z, focus: 1, dof: 0.2, shake: 0 });
};

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export const Scene01SharadFlowerGathering: React.FC = () => {
  const { lifeF } = useStory3(S01);
  const f = lifeF; // acting runs on the real clock, keyed to the cue/pause beats T (see the header)
  const cam = camAt(f);
  // the low gold sun warms a touch as the dawn goes on
  const sunLift = track(f, [
    [0, 0.9],
    [DUR, 1.08, "inOut"],
  ]);
  const { tulsi } = VEDIC_COURTYARD;

  return (
    <Stage cam={cam} background="#ead2b6" opacity={Math.min(1, lifeF / 14)}>
      <Layer depth={0.12}>
        <DawnSky f={lifeF} />
      </Layer>
      <Layer depth={0.3}>
        {/* a few birds cross the dawn sky (they pass over during P1) */}
        <g transform={`translate(${5 * (lifeF - T.p1.start)}, 0)`}>
          <Birds f={lifeF} x={60} y={70} n={5} s={0.8} />
        </g>
      </Layer>
      <Layer depth={0.38}>
        <FarTrees f={lifeF} />
      </Layer>
      <Layer depth={0.55}>
        <GlowDefs />
        {/* floor-coloured apron under the back plinth, so no gap ever opens between the planes */}
        <rect x={-600} y={770} width={3200} height={900} fill="#5e463c" />
        <CourtyardBack f={lifeF} />
        {/* autumn dawn over the house: a warm wash, the sun side brighter, mist along the plinth */}
        <rect x={-600} y={150} width={3200} height={700} fill="#ffd9a0" opacity={0.24 * sunLift} style={{ mixBlendMode: "screen" }} />
        <defs>
          <linearGradient id="s01v-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffcf8a" stopOpacity={0} />
            <stop offset="100%" stopColor="#ffcf8a" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <rect x={-600} y={150} width={3200} height={700} fill="url(#s01v-side)" style={{ mixBlendMode: "screen" }} />
        <Mist f={lifeF} y={700} h={120} n={7} seed={3} opacity={0.55} />
        <Mist f={lifeF} y={240} h={80} n={5} seed={4} opacity={0.3} />
      </Layer>
      <Layer depth={0.8}>
        <SunShafts f={lifeF} level={sunLift} />
      </Layer>
      <Layer depth={1}>
        <GlowDefs />
        <CourtyardFloor f={lifeF} />
        {/* the low sun warms the flagstones, more on the right */}
        <rect x={-600} y={784} width={3200} height={700} fill="#ffcf96" opacity={0.2 * sunLift} style={{ mixBlendMode: "screen" }} />
        <Mist f={lifeF * 0.8} y={800} h={60} n={6} seed={7} opacity={0.4} />
        <TreeBed x={SHIULI_TREE.x} y={SHIULI_TREE.y + 2} rx={70} />
        <TreeBed x={VEDIC_COURTYARD.jhumko.x} y={VEDIC_COURTYARD.jhumko.y + 2} rx={64} />
        <TreeBed x={VEDIC_COURTYARD.jaba.x} y={VEDIC_COURTYARD.jaba.y + 2} rx={76} />
        <FallenShiuli x={SHIULI_TREE.x + 40} y={SHIULI_TREE.y - 12} />
        <ShiuliTree x={SHIULI_TREE.x} y={SHIULI_TREE.y} seed={1} f={lifeF} />
        <JhumkoTree f={lifeF} />
        <JabaTree f={lifeF} />
        {/* the tulsi mancha, and the sajis already filled and set down at its foot */}
        <TulsiMancha x={tulsi.x} y={tulsi.y} f={lifeF} s={tulsi.s} />
        {VEDIC_COURTYARD.sajisAtTulsi.map((x, i) => (
          <GroundSaji key={x} x={x} y={tulsi.y + 16 + (i % 2) * 6} level={1} mix={[MIX_JABA, MIX_JHUMKO, MIX_MIXED, MIX_JABA][i]} />
        ))}
        <Dew f={lifeF} spots={DEW_SPOTS} />
        <FallingShiuli f={lifeF} x={SHIULI_TREE.x} y0={SHIULI_TREE.y - 520} y1={SHIULI_TREE.y + 90} />
        {/* the branch first, so the holders' hands close over it */}
        <JabaBranch f={lifeF} />
        <LooseHair cast={S01_SARALA} acting={SARALA_ACT} f={f} lifeF={lifeF} x={POS.sarala.x} y={POS.sarala.y} scale={BACK_SCALE} />
        <Puppet cast={S01_SARALA} f={f} lifeF={lifeF} x={POS.sarala.x} y={POS.sarala.y} scale={BACK_SCALE} acting={SARALA_ACT} mouth={MOUTH_SARALA} light={LIGHT} />
        <LooseHair cast={S01_LATA} acting={LATA_ACT} f={f} lifeF={lifeF} x={POS.lata.x} y={POS.lata.y} scale={BACK_SCALE} />
        <Puppet cast={S01_LATA} f={f} lifeF={lifeF} x={POS.lata.x} y={POS.lata.y} scale={BACK_SCALE} acting={LATA_ACT} mouth={MOUTH_LATA} light={LIGHT} />
        {/* the holders' own sajis wait at their feet */}
        <GroundSaji x={POS.sarala.x - 70} y={POS.sarala.y + 14} level={0.55} mix={MIX_MIXED} />
        <GroundSaji x={POS.lata.x - 66} y={POS.lata.y + 16} level={0.45} mix={MIX_JABA} />
        <Puppet cast={S01_TUNI} f={f} lifeF={lifeF} x={POS.tuni.x} y={POS.tuni.y} scale={FIG_SCALE} acting={TUNI_ACT} light={LIGHT} props={PROPS_TUNI} />
        <LooseHair cast={S01_REKHA} acting={REKHA_ACT} f={f} lifeF={lifeF} x={POS.rekha.x} y={POS.rekha.y} scale={FIG_SCALE} />
        <Puppet cast={S01_REKHA} f={f} lifeF={lifeF} x={POS.rekha.x} y={POS.rekha.y} scale={FIG_SCALE} acting={REKHA_ACT} light={LIGHT} props={PROPS_REKHA} />
        <LooseHair cast={S01_MINA} acting={MINA_ACT} f={f} lifeF={lifeF} x={POS.mina.x} y={POS.mina.y} scale={FIG_SCALE} />
        <Puppet cast={S01_MINA} f={f} lifeF={lifeF} x={POS.mina.x} y={POS.mina.y} scale={FIG_SCALE} acting={MINA_ACT} light={LIGHT} props={PROPS_MINA} />
      </Layer>
      <Layer depth={1.06}>
        {/* a thin ground mist drifting past the girls' feet */}
        <Mist f={lifeF} y={1010} h={70} n={6} seed={9} opacity={0.22} />
      </Layer>
      <Layer depth={1.15}>
        <NearPetals f={lifeF} />
      </Layer>
      <Grade warmth={0.42} vignette={0.42} bloomAt={[82, 18]} grain={0.05} />
    </Stage>
  );
};
