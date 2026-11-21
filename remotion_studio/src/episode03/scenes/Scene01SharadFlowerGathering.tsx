import React from "react";
import { clamp, hash, makeActing, noise1, PoseKey, track } from "../../cinematic/core/anim";
import { Cam, Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { BASE_POSE, CastMember, Lighting, Pose, PropRenderer, Puppet } from "../../cinematic/rig/Puppet";
import { UjancharHouse, UJANCHAR_BG, UJANCHAR_JABA, ujancharGrade, ujancharKeepInSet } from "../../cinematic/sets/UjancharHouse";
import { cueLocalStory3, pausesFor3, storyToReal, useStory3 } from "../../episode/storyClock";
import { EP03_SCENES } from "../timing";

/**
 * Episode 3 · Scene 01 "Sharad dawn flower gathering" (01_sharad_flower_gathering).
 * The family's Ujanchar village house (the shared set, STO-17) at an autumn (শরৎ) dawn: soft gold light from the
 * low sun on the right, mist in the jungle and over the courtyard, dew glinting on the leaves. The women of the
 * house, just back from their morning bath (STO-01: loose damp hair down the back, simple cotton saris, a gamchha),
 * fill bamboo sajhi baskets with jaba (hibiscus) and jhumko by the fence; little Tuni picks fallen shiuli under the
 * shiuli tree. No deity, no divine light.
 *
 * Plan: 03_Episodes/Episode_03_Five_Year_Old_Wisdom/01_Script_and_Storyboard/Ep03_Shots_and_Pauses_DRAFT.md,
 * "Scene 01" (approved, STO-17). Camera grammar CAM-13, pauses CAM-14.
 *
 * Clocks. Every key is derived from the narration cues (cueLocalStory3) and the scene's pauses (pausesFor3), never a
 * hard-coded frame, so it stays in sync when timing changes. Story frames are converted to the scene's real local
 * frames (storyToReal), and the acting, camera and life run on the real clock: the pause moments the plan asks for
 * (the women picking on in P1, Tuni smelling her shiuli in P2, Mina and Rekha's shared smile in P3) are authored keys
 * INSIDE the pause windows, while no narrated action falls in a pause. The Puppets get lifeF for breathing and blinks.
 * VOICE_LAG: where the voice starts after its cue, measured from the clip silences (ffmpeg silencedetect, -35 dB).
 *
 * Shots (approved list):
 *   1  "শরতের মিষ্টি ভোর।"            held wide: the house, the tulsi mancha, the fence and hibiscus, the women small
 *   2  "শিউলি ফুলের গন্ধে ..."          one slow push (1.00 to 1.12) toward Tuni, starting on "শিউলি", landing as she lifts
 *                                        the sprig; hold
 *   3  "বাড়ির মেয়েরা ভোরবেলা স্নান সেরে"  cut to a medium wide of the row of women; hold
 *   4  "জবা আর ঝুমকো ফুলের সাজি ভরছে।"   one slow push to Mina's and Rekha's hands and baskets, starting on "জবা"; hold to
 *                                        the end. No handheld, no rack focus, no drift.
 * Pauses: P1 after "...ভোর।" (held wide: mist drifts, shiuli fall, birds cross, the women pick on, small and
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

const mod = (a: number, m: number) => ((a % m) + m) % m;
const A = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);

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

/** Basket with its handle apex at (0, 0). `fill` gives 0..1 flower level by frame. */
const basketProp =
  (fill: (f: number) => number, mix: FlowerKind[]): PropRenderer =>
  ({ f, scale, worldRot }) => {
    const n = Math.round(clamp(fill(f)) * SPOTS.length);
    // counter-rotated against the forearm, so the basket always hangs upright from the grip
    return (
      <g transform={`rotate(${-worldRot}) scale(${scale * 0.9})`}>
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
      </g>
    );
  };

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
      <Bloom x={0} y={6} r={kind === "jaba" ? 10 : 7.5} kind={kind} rot={20} />
    </g>
  );

/* ------------------------------------------------------------------ */
/* Cast: after the morning bath. Loose, damp hair down the back       */
/* (LooseHair, below), plain cotton saris; Mina has her gamchha over   */
/* her shoulders (STO-01, director's default for "স্নান সেরে").          */
/* ------------------------------------------------------------------ */

/** Sarala: mother of the house, white cotton sari with a red border (laal-paar). */
export const S01_SARALA: CastMember = {
  id: "sarala",
  age: "adult",
  sex: "f",
  height: 0.97,
  girth: 1.02,
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

/** Mina: sister-in-law, pale turmeric sari with a green border, a white gamchha round her shoulders. */
export const S01_MINA: CastMember = {
  id: "mina",
  age: "adult",
  sex: "f",
  height: 1.0,
  girth: 1.04,
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

/** Tuni: the young girl, rose frock, pigtails. */
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
  height: 1.02,
  girth: 1.0,
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
/* Layout (world px on the floor plane, depth 1)                       */
/* ------------------------------------------------------------------ */

const FIG_SCALE = 1.18;
const SHIULI_TREE = { x: 1330, y: 884 };
const JHUMKO = { x: 2120, y: 900, s: 1.35 };
const POS = {
  sarala: { x: 1700, y: 944 },
  mina: { x: 2010, y: 952 },
  tuni: { x: 1450, y: 980 },
  rekha: { x: 2440, y: 946 },
};

/* ------------------------------------------------------------------ */
/* Acting (real local frames, keyed to the beats T). Keys are          */
/* cumulative; `in` is the move length before `f`.                     */
/* ------------------------------------------------------------------ */

/**
 * A repeating pick cycle: reach into the shrub, take a flower (it appears in the hand), carry it to the basket and
 * let it go (the basket fills by one). Returns the keys and the release frames (for the basket fill).
 */
const pickCycles = (
  start: number,
  count: number,
  period: number,
  hand: "r" | "l",
  reach: Partial<Pose>,
  drop: Partial<Pose>,
  rest: Partial<Pose>,
  flower: string,
) => {
  const keys: PoseKey<Pose>[] = [];
  const releases: number[] = [];
  const P = hand === "r" ? "rProp" : "lProp";
  const H = hand === "r" ? "rHand" : "lHand";
  for (let k = 0; k < count; k++) {
    const t0 = start + k * period;
    keys.push({ f: t0 + 14, in: 14, ease: "inOut", ...reach, [H]: "cup", [P]: "" } as PoseKey<Pose>);
    keys.push({ f: t0 + 22, in: 8, ease: "out", headNod: (reach.headNod ?? 0) + 2, [H]: "hold", [P]: flower } as PoseKey<Pose>);
    keys.push({ f: t0 + 38, in: 16, ease: "inOut", ...drop, headNod: (drop.headNod ?? 0), [H]: "hold", [P]: flower } as PoseKey<Pose>);
    keys.push({ f: t0 + 44, in: 6, ease: "out", [H]: "open", [P]: "" } as PoseKey<Pose>);
    releases.push(t0 + 42);
    if (k === count - 1) keys.push({ f: t0 + 60, in: 16, ease: "inOut", ...rest, [H]: "relaxed", [P]: "" } as PoseKey<Pose>);
  }
  return { keys, releases };
};

/** Basket fill: starts at `base` and rises one flower per release, eased over 4 frames. */
const fillFrom = (base: number, releases: number[]) => (f: number) =>
  base + releases.reduce((acc, r) => acc + clamp((f - r) / 4) / SPOTS.length, 0);

/* Sarala: the basket held at her hip in front (left forearm across), drops with her right hand; picks jaba from the first shrub with her right hand. */
const SARALA_REST: Partial<Pose> = { rS: 6, rE: -8, lean: 0, headNod: 0 };
const SARALA_REACH: Partial<Pose> = { rS: 72, rE: -14, lean: 3, headNod: -6, headTurn: 0.35 };
const SARALA_DROP: Partial<Pose> = { rS: 28, rE: -78, lean: 2, headNod: 8, headTurn: 0.15 };
const saralaPicks1 = pickCycles(4, 2, 56, "r", SARALA_REACH, SARALA_DROP, SARALA_REST, "jaba");
const saralaPicks2 = pickCycles(T.l3 - 6, 2, 60, "r", SARALA_REACH, SARALA_DROP, SARALA_REST, "jaba");
const SARALA_ACT = alive(
  A([
    { f: 0, bodyTurn: 0.35, headTurn: 0.3, smile: 0.35, lS: 18, lE: -75, lHand: "hold", lProp: "basket", rS: 6, rE: -8, rHand: "relaxed" },
    ...saralaPicks1.keys,
    // P2: she glances across at Tuni, who is smelling her shiuli
    { f: T.p2.start - 14, in: 18, ease: "inOut", headTurn: -0.45, eyeX: -0.5, smile: 0.5, headTilt: -3 },
    { f: T.p2.end + 4, in: 20, ease: "inOut", headTurn: 0.3, eyeX: 0, smile: 0.4, headTilt: 0 },
    ...saralaPicks2.keys,
    // looks over to Mina and Rekha as the baskets fill
    { f: T.p3.start, in: 24, ease: "inOut", headTurn: 0.5, eyeX: 0.4, smile: 0.5 },
  ]),
  1,
);
const fillSarala = fillFrom(0.45, [...saralaPicks1.releases, ...saralaPicks2.releases]);

/* Mina: basket at her hip on the left forearm, picks jhumko from the bush on her right; in P3 she turns to Rekha and smiles. */
const MINA_REST: Partial<Pose> = { rS: 8, rE: -14, lean: 0, headNod: 0 };
const MINA_REACH: Partial<Pose> = { rS: 70, rE: -20, lean: 4, headNod: 2, headTurn: 0.3 };
const MINA_DROP: Partial<Pose> = { rS: 28, rE: -78, lean: 2, headNod: 9, headTurn: 0.1 };
const minaPicks1 = pickCycles(30, 2, 62, "r", MINA_REACH, MINA_DROP, MINA_REST, "jhumko");
const minaPicks2 = pickCycles(T.l3 + 20, 1, 60, "r", MINA_REACH, MINA_DROP, MINA_REST, "jhumko");
const minaPicks3 = pickCycles(T.l4 - 8, 1, 60, "r", MINA_REACH, MINA_DROP, MINA_REST, "jaba");
const MINA_ACT = alive(
  A([
    { f: 0, bodyTurn: 0.3, headTurn: 0.25, smile: 0.3, lS: 18, lE: -75, lHand: "hold", lProp: "basket", rS: 8, rE: -14, rHand: "relaxed" },
    ...minaPicks1.keys,
    ...minaPicks2.keys,
    ...minaPicks3.keys,
    // she settles the full basket and looks down into it
    { f: T.l4 + 70, in: 16, ease: "inOut", headNod: 7, eyeY: 0.5, smile: 0.5 },
    // P3: she looks across at Rekha's full basket and they share a smile
    { f: T.p3.start + 4, in: 20, ease: "inOut", headTurn: 0.55, eyeX: 0.5, eyeY: 0, headNod: 0, smile: 0.7, headTilt: 3 },
    { f: T.p3.start + 26, in: 14, ease: "inOut", headNod: 4 },
    { f: T.p3.end + 6, in: 16, ease: "inOut", headNod: 0, smile: 0.6 },
  ]),
  2,
);
const fillMina = fillFrom(0.4, [...minaPicks1.releases, ...minaPicks2.releases, ...minaPicks3.releases]);

/* Rekha: faces left toward her shrub and Mina; basket at her hip on the right forearm, picks jaba with her left hand. */
const REKHA_REST: Partial<Pose> = { lS: 8, lE: -14, lean: 0, headNod: 0 };
const REKHA_REACH: Partial<Pose> = { lS: 72, lE: -14, lean: -3, headNod: -4, headTurn: -0.35 };
const REKHA_DROP: Partial<Pose> = { lS: -7, lE: -49, lean: -2, headNod: 9, headTurn: -0.15 };
const rekhaPicks1 = pickCycles(18, 2, 58, "l", REKHA_REACH, REKHA_DROP, REKHA_REST, "jaba");
const rekhaPicks2 = pickCycles(T.l3 + 4, 1, 58, "l", REKHA_REACH, REKHA_DROP, REKHA_REST, "jaba");
const rekhaPicks3 = pickCycles(T.l4 + 6, 1, 56, "l", REKHA_REACH, REKHA_DROP, REKHA_REST, "jaba");
const REKHA_ACT = alive(
  A([
    { f: 0, bodyTurn: -0.35, headTurn: -0.3, smile: 0.35, rS: 18, rE: -75, rHand: "hold", rProp: "basket", lS: 8, lE: -14, lHand: "relaxed" },
    ...rekhaPicks1.keys,
    ...rekhaPicks2.keys,
    ...rekhaPicks3.keys,
    // she tucks the last flower in and looks over the basket
    { f: T.l4 + 74, in: 14, ease: "inOut", headNod: 6, eyeY: 0.4, smile: 0.5 },
    // P3: she meets Mina's look and smiles back
    { f: T.p3.start + 10, in: 20, ease: "inOut", headTurn: -0.55, eyeX: -0.5, eyeY: 0, headNod: 0, smile: 0.75, headTilt: -3 },
    { f: T.p3.start + 30, in: 14, ease: "inOut", headNod: 3 },
    { f: T.p3.end + 6, in: 16, ease: "inOut", headNod: 0, smile: 0.6 },
  ]),
  4,
);
const fillRekha = fillFrom(0.45, [...rekhaPicks1.releases, ...rekhaPicks2.releases, ...rekhaPicks3.releases]);

/*
 * Tuni: watches the shiuli fall (P1), crouches on "শিউলি" to pick one from the grass, rises with the sprig as the push
 * lands, holds it to her nose and smiles (P2), then turns to the women with it held at her chest.
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
    // turns to the women, the sprig at her chest
    { f: T.l3 + 20, in: 26, ease: "inOut", bodyTurn: 0.45, headTurn: 0.4, rS: 70, rE: -95, headTilt: 0, smile: 0.7 },
    { f: T.l4, in: 30, ease: "inOut", headTilt: -3, smile: 0.6 },
  ]),
  3,
);

const PROPS_SARALA: Record<string, PropRenderer> = { basket: basketProp(fillSarala, MIX_MIXED), jaba: heldFlower("jaba") };
const PROPS_MINA: Record<string, PropRenderer> = { basket: basketProp(fillMina, MIX_JHUMKO), jhumko: heldFlower("jhumko"), jaba: heldFlower("jaba") };
const PROPS_TUNI: Record<string, PropRenderer> = { sprig: Sprig };
const PROPS_REKHA: Record<string, PropRenderer> = { basket: basketProp(fillRekha, MIX_JABA), jaba: heldFlower("jaba") };

/* ------------------------------------------------------------------ */
/* Set pieces the scene adds to the Ujanchar house                     */
/* ------------------------------------------------------------------ */

/** Shiuli (night jasmine) tree at the back of the courtyard: sways from the trunk base, white flowers, orange stems. */
const ShiuliTree: React.FC<{ x: number; y: number; seed: number; f: number }> = ({ x, y, seed, f }) => {
  const angle = 0.6 * Math.sin(f * 0.026 + seed) + 0.45 * noise1(f * 0.016, seed + 4);
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      <ellipse cx={0} cy={4} rx={150} ry={14} fill="#2a1a0c" opacity={0.25} />
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
      <ellipse cx={110} cy={-500} rx={120} ry={90} fill="#a8c46a" opacity={0.16} />
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

/** The carpet of fallen shiuli on the beaten earth under the tree. */
const FallenShiuli: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    {Array.from({ length: 60 }, (_, i) => {
      const a = hash(i * 3.9 + 2) * Math.PI * 2;
      const r = Math.sqrt(hash(i * 5.3 + 1));
      return <Bloom key={i} x={x + Math.cos(a) * 260 * r} y={y + 40 + Math.sin(a) * 48 * r + 12} r={5} kind="shiuli" rot={i * 37} />;
    })}
  </g>
);

/** Jhumko bush: thin stems ending in small orange-yellow clusters; the tips nod in the breeze. */
const JhumkoBush: React.FC<{ x: number; y: number; s: number; seed: number; f: number }> = ({ x, y, s, seed, f }) => (
  <g transform={`translate(${x}, ${y}) scale(${s})`}>
    <ellipse cx={0} cy={3} rx={90} ry={9} fill="#2a1a0c" opacity={0.25} />
    <ellipse cx={-40} cy={-14} rx={30} ry={12} fill="#3c7638" />
    <ellipse cx={36} cy={-12} rx={28} ry={11} fill="#2c5f2c" />
    {Array.from({ length: 14 }, (_, i) => {
      const sway = 3 * noise1(f * 0.02, seed * 9 + i);
      const tx = (hash(seed + i * 4.4) - 0.5) * 170 + sway;
      const ty = -70 - hash(seed + i * 2.2) * 140;
      return (
        <g key={i}>
          <path d={`M 0 0 Q ${tx * 0.3} ${ty * 0.5} ${tx} ${ty}`} stroke="#3f6b35" strokeWidth={3} fill="none" />
          <ellipse cx={tx * 0.6} cy={ty * 0.6} rx={11} ry={5} fill="#3c7638" transform={`rotate(${tx * 0.3} ${tx * 0.6} ${ty * 0.6})`} />
          <circle cx={tx} cy={ty} r={7.5} fill="#f5a524" />
          <circle cx={tx + 5} cy={ty - 4} r={5.5} fill="#f8c24a" />
          <circle cx={tx - 4} cy={ty + 3} r={4.5} fill="#e88a1c" />
        </g>
      );
    })}
  </g>
);

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

/** Dew: tiny glints on the shrubs that catch the low sun and fade, each on its own slow rhythm. */
const Dew: React.FC<{ f: number; spots: Array<[number, number, number]> }> = ({ f, spots }) => (
  <g style={{ mixBlendMode: "screen" }}>
    {spots.map(([x, y, s], i) => {
      const tw = Math.max(0, Math.sin(f * (0.05 + hash(i * 1.7) * 0.05) + i * 2.1));
      return <circle key={i} cx={x} cy={y} r={2.2 * s + 1.6 * tw} fill="#fff6dc" opacity={0.25 + 0.6 * tw * tw} />;
    })}
  </g>
);
const DEW_SPOTS: Array<[number, number, number]> = Array.from({ length: 26 }, (_, i) => {
  const shrub = i % 3;
  const base = shrub === 0 ? { x: 1880, y: 720, rx: 140, ry: 90 } : shrub === 1 ? { x: 2330, y: 740, rx: 120, ry: 80 } : { x: 2120, y: 810, rx: 100, ry: 60 };
  const a = hash(i * 4.1 + 9) * Math.PI * 2;
  const r = Math.sqrt(hash(i * 2.3 + 5));
  return [base.x + Math.cos(a) * base.rx * r, base.y + Math.sin(a) * base.ry * r, 0.8 + hash(i) * 0.6];
});

/** Shiuli and jaba petals drifting across the near foreground (P3 asks for petals still drifting). */
const NearPetals: React.FC<{ f: number }> = ({ f }) => (
  <>
    {Array.from({ length: 10 }, (_, i) => {
      const x0 = hash(i * 3.1 + 11) * 3000 + 200;
      const y0 = hash(i * 5.7 + 12) * 900;
      const vy = 0.7 + hash(i * 7.3 + 13) * 0.7;
      const drift = 0.5 + hash(i * 2.9 + 14) * 1.1;
      const y = mod(y0 + vy * f, 900) + 60;
      const x = mod(x0 + drift * f, 3000) + 200 + Math.sin(f * 0.05 + i) * 26;
      return <Bloom key={i} x={x} y={y} r={7} kind={i % 4 === 0 ? "jaba" : "shiuli"} rot={f * 2 + i * 40} />;
    })}
  </>
);

/* ------------------------------------------------------------------ */
/* Camera (CAM-13): held shots, one motivated move per line, cue-keyed  */
/* ------------------------------------------------------------------ */

type Shot = { cx: number; cy: number; z: number };
const SHOTS: Record<"wide" | "tuni" | "row" | "hands", Shot> = {
  // the house: tulsi mancha at the left, the hut's end and lemon tree, the fence with the hibiscus, the women small
  wide: { cx: 1700, cy: 640, z: 1.0 },
  // the push lands on Tuni and the shiuli tree
  tuni: { cx: 1560, cy: 676, z: 1.12 },
  // the row of women at the bushes: Tuni, Sarala, Mina, Rekha
  row: { cx: 1950, cy: 690, z: 1.22 },
  // Mina's and Rekha's hands and baskets
  hands: { cx: 2230, cy: 712, z: 1.55 },
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
  return ujancharKeepInSet({ x: s.cx - 960, y: s.cy - 540, zoom: s.z, focus: 1, dof: 0.2, shake: 0 });
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

  const floor = (
    <>
      <FallenShiuli x={SHIULI_TREE.x + 60} y={SHIULI_TREE.y} />
      <ShiuliTree x={SHIULI_TREE.x} y={SHIULI_TREE.y} seed={1} f={lifeF} />
      <JhumkoBush x={JHUMKO.x} y={JHUMKO.y} s={JHUMKO.s} seed={21} f={lifeF} />
      <Dew f={lifeF} spots={DEW_SPOTS} />
      <FallingShiuli f={lifeF} x={SHIULI_TREE.x} y0={SHIULI_TREE.y - 520} y1={SHIULI_TREE.y + 90} />
      <LooseHair cast={S01_SARALA} acting={SARALA_ACT} f={f} lifeF={lifeF} x={POS.sarala.x} y={POS.sarala.y} scale={FIG_SCALE} />
      <LooseHair cast={S01_REKHA} acting={REKHA_ACT} f={f} lifeF={lifeF} x={POS.rekha.x} y={POS.rekha.y} scale={FIG_SCALE} />
      <LooseHair cast={S01_MINA} acting={MINA_ACT} f={f} lifeF={lifeF} x={POS.mina.x} y={POS.mina.y} scale={FIG_SCALE} />
      <Puppet cast={S01_SARALA} f={f} lifeF={lifeF} x={POS.sarala.x} y={POS.sarala.y} scale={FIG_SCALE} acting={SARALA_ACT} light={LIGHT} props={PROPS_SARALA} />
      <Puppet cast={S01_REKHA} f={f} lifeF={lifeF} x={POS.rekha.x} y={POS.rekha.y} scale={FIG_SCALE} acting={REKHA_ACT} light={LIGHT} props={PROPS_REKHA} />
      <Puppet cast={S01_MINA} f={f} lifeF={lifeF} x={POS.mina.x} y={POS.mina.y} scale={FIG_SCALE} acting={MINA_ACT} light={LIGHT} props={PROPS_MINA} />
      <Puppet cast={S01_TUNI} f={f} lifeF={lifeF} x={POS.tuni.x} y={POS.tuni.y} scale={FIG_SCALE} acting={TUNI_ACT} light={LIGHT} props={PROPS_TUNI} />
    </>
  );

  return (
    <Stage cam={cam} background={UJANCHAR_BG.dawn} opacity={Math.min(1, lifeF / 14)}>
      <UjancharHouse
        f={lifeF}
        time="dawn"
        cam={cam}
        cow={false}
        tulsi={{ x: 1000, lamp: "unlit" }}
        jaba={UJANCHAR_JABA}
        floor={floor}
        lightLevel={sunLift}
        leaves
        grade={false}
      />
      <Layer depth={1.15}>
        <NearPetals f={lifeF} />
      </Layer>
      <Grade {...ujancharGrade("dawn")} />
    </Stage>
  );
};
