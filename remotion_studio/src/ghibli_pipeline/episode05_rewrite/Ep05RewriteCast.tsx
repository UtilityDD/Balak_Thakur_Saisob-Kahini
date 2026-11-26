import React from "react";
import { clamp, lerp } from "../../cinematic/core/anim";
import { CAST, EP06_CHILD_SCALE, type CastEntry } from "../../cinematic/rig/cast";
import { GESTURES5, Puppet, type CastMember, type Lighting, type Pose, type PuppetAnchors, type PuppetProps } from "../../cinematic/rig/Puppet";
import { SeatedChild, seatedEp6Anchors, type SeatedChildProps } from "../../episode03/rig/SeatedChild";
import { StandingChild, standingChildJoints, type StandingChildProps } from "../../episode05/rig/StandingChild";
import { ContactShadow } from "../GhibliStage";
import { GhibliBalakLapDetails } from "../core/ghibliBalak";
import { EP05_BALAK_AGE, EP05_BALAK_LOOK } from "./ep05BalakLook";
import { EP05_BALAK_INK, EP05_GLOW, Ep05BalakDivine, Ep05BalakGroundGlow, Ep05BalakInkDefs, ep05GlowLevel } from "./Ep05BalakDivine";
import { EP05_HAND_PROPS } from "./Ep05RewriteProps";

/**
 * EPISODE 5 REWRITE: THE CAST (blueprint section 2). Local definitions built on the shared rigs (Puppet, CAST,
 * SeatedChild, StandingChild); nothing shared is edited, so Episodes 1-6 and Ghibli Episode 4 render unchanged.
 *
 * ---------------------------------------------------------------------------------------------------------------
 * SIZES (CHR-08, CHR-09): K = the adult Puppet scale at that depth (Surendra, Charu ... use scale K).
 *   Balak standing   <Ep05StandingBalak s={EP05R_SCALE.standingBalak.s * K} headScale={EP05R_SCALE.standingBalak.headScale}>
 *   Balak seated     <Ep05SeatedBalak   s={EP05R_SCALE.seatedBalak.s * K}>  (cross-legged, plate design, age 6)
 *   Binoy (14-15)    <Puppet cast={EP05R_CAST.binoy} scale={K}>: about 1.3 Balak-heads taller than Balak, a little
 *                    shorter than Charu (EP05R_LOOKS has the measured heights).
 *   Adults           scale K. Size order in every frame: Balak < Binoy < the adults (CHR-09).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * API
 * ---------------------------------------------------------------------------------------------------------------
 *  EP05R_CAST        { charu, surendra, binoy, haricharan, seniorClerk, juniorClerk, binoyMother } (CastEntry)
 *  EP05R_LOOKS       the look sheet: name, caption chip, age, role, rig, measured height, build, head scale, palette.
 *  EP05R_SCALE       Balak's scales relative to K (above).
 *  EP05R_LIGHT       Lighting presets: lateMorning (sc 01-02, sun upper left), flashback (warmer), afternoon (sc 03-04),
 *                    lateAfternoon (sc 05 veranda, slant from the right), sunset (AG14 riverbank).
 *  EP05R_GESTURES    pose presets (spread into a pose key): binoyBreathless, binoySheepish, haricharanAngry,
 *                    haricharanPoleUpright, haricharanPoleCarried, haricharanPoleAcross (two hands), seniorClerkWrite,
 *                    seniorClerkPeer, seniorClerkShake, juniorClerkFan, juniorClerkLeanIn, juniorClerkFanStopped.
 *  EP05_HAND_PROPS   (from Ep05RewriteProps) Puppet `props` for rProp / lProp "reedPen" and "palmFan".
 *
 *  <Ep05Person {...PuppetProps} shadow? ink? />
 *      Any Puppet in the Ghibli ink (`#ghibli-char-ink`, so the layer needs <GhibliCharFilterDefs />) with its
 *      ContactShadow and the clerk hand props wired in. Use it for Charu, Surendra, Binoy, the clerks, Binoy's mother.
 *
 *  <Ep05Haricharan {...PuppetProps (cast optional)} twoHand? secondGrip? shadow? ink? />
 *      Haricharan with his bamboo held in BOTH hands. The pole is the Puppet's own rProp "bamboo" in his right fist
 *      (GESTURES5 / EP05R_GESTURES poses: carried, upright, planted, bambooThump); `twoHand` (0..1 or a function of the
 *      story clock) brings the other hand onto the pole at `secondGrip` (fraction of the pole length from the first fist
 *      toward the top; negative = toward the foot; default "auto": the point nearest the free shoulder). It is solved every frame from the pole's own anchors
 *      (a hidden first pass reads poleGrip / poleTip), so the second fist always closes on the pole (MOT-07).
 *      Key twoHand to 0 while that hand gestures (the jab at the trellis, the flung-up hand of 04l, the forehead slap).
 *      `anchors` still reports this frame's points (poleGrip, poleBase for the thump dust, poleTip, wrists).
 *
 *  <Ep05SeatedBalak {...SeatedChildProps} glowK? zoom? halo? ground? shadow? lapDetails? inkDefs? />
 *  <Ep05StandingBalak {...StandingChildProps} glowK? zoom? halo? ground? shadow? inkDefs? />
 *      Balak at six in the BAL-26f look (ep05BalakLook.ts, one switch) with his own fine ink line (Ep05BalakInkDefs, drawn
 *      by the component unless inkDefs={false}), the soft halo behind the head from the rig's own glow anchor, the faint
 *      ground glow and a contact shadow. glowK 0..1 = the two gentle beats (ep05GlowBeat in Ep05BalakDivine.tsx);
 *      zoom = cam.zoom of the layer. Hand / face points: seatedChildHands(props) / seatedEp6Anchors(props) and
 *      standingChildJoints(props) with THE SAME props object (ep05SeatedProps / ep05StandingProps build it).
 */

/* =============================================================================================================== */
/* Cast entries                                                                                                    */
/* =============================================================================================================== */

/** Senior clerk (বড়বাবু, late 50s): steel spectacles, thinning grey hair, white fatua and dhoti, an off-white chadar with
 *  a brown border over the shoulder, a reed pen in his hand at the ledger. Fussy and dry, never unkind. */
const SENIOR_CLERK: CastEntry = {
  id: "ep05SeniorClerk",
  age: "elder",
  sex: "m",
  height: 0.96,
  girth: 1.1,
  skin: "#cf9c72",
  skinLight: "#ebbe96",
  skinShade: "#ad7a52",
  lips: "#a0605a",
  hair: "#8d8780",
  hairLight: "#cfcac2",
  hairStyle: "balding",
  outfit: "kurta",
  top: "#f4eedf",
  topLight: "#fffbf1",
  topShade: "#d3c8b0",
  topTrim: "#9a8a68",
  sleeve: "half",
  lower: "dhoti",
  lowerColor: "#f8f3e7",
  lowerShade: "#d6ccb6",
  lowerTrim: "#7a5a34",
  dhotiLength: "calf",
  scarf: { color: "#ebe2cb", shade: "#c8b993", trim: "#7a4e2c", style: "drape" },
  mustache: "#b8b1a6",
  glasses: true,
  face: { faceLen: 1.06, jaw: 0.8, chin: 0.42, cheekPuff: 0.06 },
  look: { lashes: 0.2, kajal: 0, browWeight: 1.15, lipTint: "#97574c", mustache: 0.7, ageLines: 0.85, hairGrey: 0.75 },
  seed: 509,
};

/** Junior clerk (মুহুরিবাবু, early 40s, the "চরমপন্থী"): thin, oiled black hair parted, quick heavy eyebrows, a thin
 *  mustache, a long-sleeved cream kurta and dhoti, a palm-leaf fan in his left hand. */
const JUNIOR_CLERK: CastEntry = {
  id: "ep05JuniorClerk",
  age: "adult",
  sex: "m",
  height: 1.0,
  girth: 0.8,
  skin: "#bf885c",
  skinLight: "#dca77a",
  skinShade: "#9a643c",
  lips: "#8e4d42",
  hair: "#0f0a08",
  hairLight: "#6a5a50",
  hairStyle: "parted",
  outfit: "kurta",
  top: "#eee5cf",
  topLight: "#fbf5e4",
  topShade: "#c9bc9c",
  sleeve: "full",
  lower: "dhoti",
  lowerColor: "#f4eedd",
  lowerShade: "#d0c5ab",
  dhotiLength: "calf",
  mustache: "#0f0a08",
  face: { faceLen: 1.1, jaw: 0.72, chin: 0.4, cheekPuff: -0.02 },
  look: { lashes: 0.25, kajal: 0, browWeight: 1.4, lipTint: "#8a4a40", mustache: 0.45, ageLines: 0.25, hairGrey: 0.05 },
  seed: 521,
};

/**
 * The cast of the rewrite. Charu, Surendra, Haricharan and Binoy's mother are the shared CAST entries unchanged; Binoy
 * is CAST.binoy grown to 14-15 (CHR-09: clearly taller than six-year-old Balak, a little shorter than Charu, slim).
 */
export const EP05R_CAST = {
  charu: CAST.charu,
  surendra: CAST.surendra,
  binoy: { ...CAST.binoy, id: "binoy", height: 0.94, girth: 0.8 } as CastEntry,
  haricharan: CAST.haricharan,
  seniorClerk: SENIOR_CLERK,
  juniorClerk: JUNIOR_CLERK,
  binoyMother: CAST.womanA,
} satisfies Record<string, CastEntry>;

export type Ep05CastId = keyof typeof EP05R_CAST;

/** Balak's scales relative to the adult scale K (CHR-08 "meet halfway", BAL-26d healthy build, as Episode 6). */
export const EP05R_SCALE = {
  standingBalak: { s: EP06_CHILD_SCALE.standingBalak.s, headScale: EP06_CHILD_SCALE.standingBalak.headScale },
  seatedBalak: { s: EP06_CHILD_SCALE.seatedBalak.s },
} as const;

/* =============================================================================================================== */
/* Look sheet                                                                                                      */
/* =============================================================================================================== */

export interface Ep05LookEntry {
  name: string;
  chip: string;
  age: string;
  role: string;
  rig: string;
  /** measured on Ep05RewriteCastQA at K = 1: px from the ground to the top of the hair (standing) */
  heightK1: number;
  build: string;
  headScale: number;
  palette: Record<string, string>;
  notes: string;
}

export const EP05R_LOOKS: Record<"balak" | Ep05CastId, Ep05LookEntry> = {
  balak: {
    name: "Balak Thakur (Biru)",
    chip: "বীরু",
    age: "about 6",
    role: "the child saint; calm, unhurried, gentle eye-smile",
    rig: "StandingChild / SeatedChild, BAL-26f (plateLook ref2, healthy), age 6",
    heightK1: 265,
    build: "healthy six-year-old (BAL-26d)",
    headScale: 1.45,
    palette: { skin: "#f4d1a7", hair: "#1c1310", chadar: "#fbf8f1", dhoti: "#f6f1e6" },
    notes: "No tilak, bangles, anklets, jewellery or sacred thread. Divine light his alone: halo behind the head, faint rim and ground glow, two gentle beats (P3, P9).",
  },
  charu: {
    name: "Charu (Charushila Devi)",
    chip: "মা",
    age: "mid 20s",
    role: "Balak's mother",
    rig: "Puppet CAST.charu (kneel + two-hand hold of his hand: GESTURES5.holdChildHand)",
    heightK1: 347,
    build: "slim, height 0.95",
    headScale: 1,
    palette: { sari: "#fcf8f2", border: "#b8292f", blouse: "#a8202c", skin: "#e4b18c" },
    notes: "White sari with red border, sindoor, bindi (CHR-01..03).",
  },
  surendra: {
    name: "Surendra (Suren-babu)",
    chip: "বাবা",
    age: "early 30s",
    role: "Balak's father, works at the kachari",
    rig: "Puppet CAST.surendra (the shared copy of Episode 2's SURENDRA); footwear khadam on the veranda",
    heightK1: 366,
    build: "medium, height 1.0",
    headScale: 1,
    palette: { kurta: "#fbf8f0", dhoti: "#f7f3e8", shawl: "#7a5230", skin: "#c98f63" },
    notes: "Episode 2-6 continuity: white kurta, calf-length dhoti, brown shawl, parted black hair.",
  },
  binoy: {
    name: "Binoy",
    chip: "বিনয়",
    age: "14-15",
    role: "the neighbour's son; calls Surendra 'kaka'",
    rig: "Puppet CAST.binoy grown: height 0.94, girth 0.8 (CHR-09)",
    heightK1: 343,
    build: "slim teenager, youth face (soft jaw, round eyes)",
    headScale: 1,
    palette: { fatua: "#e9dfc6", dhoti: "#faf6ec", bag: "#b08a58", skin: "#d9a07a" },
    notes: "Short dark hair, unbleached fatua, knee-length dhoti, jute bag over the shoulder (slips off in AG7).",
  },
  haricharan: {
    name: "Haricharan",
    chip: "হরিচরণ",
    age: "about 30",
    role: "kachari hand who grew the cucumbers; blustering, comic, never menacing",
    rig: "Ep05Haricharan: Puppet CAST.haricharan + rProp bamboo, second hand on the pole (twoHand)",
    heightK1: 366,
    build: "lean, wiry, dark-skinned",
    headScale: 1,
    palette: { skin: "#9a5f3c", dhoti: "#ebe1c9", gamchha: "#c3442f", pole: "#8c8a45" },
    notes: "Bare-chested, malkochha dhoti, red-white checked gamchha. Never swings the bamboo at the child or the cow.",
  },
  seniorClerk: {
    name: "Senior clerk",
    chip: "বড়বাবু",
    age: "late 50s",
    role: "kachari sereshta; dry 'মনে হয়...'",
    rig: "Puppet (new local entry): seated cross-legged at the desk, rProp reedPen",
    heightK1: 350,
    build: "a little stout, height 0.96",
    headScale: 1,
    palette: { fatua: "#f4eedf", chadar: "#ebe2cb", border: "#7a4e2c", hair: "#8d8780" },
    notes: "Round steel spectacles, thinning grey hair, grey mustache, reed pen and red ledgers.",
  },
  juniorClerk: {
    name: "Junior clerk",
    chip: "মুহুরিবাবু",
    age: "early 40s",
    role: "the 'চরমপন্থী' muhuri; theatrical",
    rig: "Puppet (new local entry): seated, lProp palmFan",
    heightK1: 365,
    build: "thin, height 1.0",
    headScale: 1,
    palette: { kurta: "#eee5cf", dhoti: "#f4eedd", hair: "#0f0a08", fan: "#d2b06a" },
    notes: "Oiled black hair with a parting, heavy quick eyebrows, thin mustache, palm-leaf fan.",
  },
  binoyMother: {
    name: "Binoy's mother",
    chip: "(silent)",
    age: "30s",
    role: "at her door in scene 02",
    rig: "Puppet CAST.womanA + GESTURES5.handAtMouth",
    heightK1: 344,
    build: "height 0.94",
    headScale: 1,
    palette: { sari: "#fbf5ea", border: "#b8202c", blouse: "#7a2230" },
    notes: "Married: sindoor, red-bordered sari.",
  },
};

/* =============================================================================================================== */
/* Light and gestures                                                                                              */
/* =============================================================================================================== */

export const EP05R_LIGHT: Record<"lateMorning" | "flashback" | "afternoon" | "lateAfternoon" | "sunset", Lighting> = {
  lateMorning: { keySide: -1, rim: "#ffe2a6", rimStrength: 0.45, rimSide: -1, brightness: 1.02 },
  flashback: { keySide: -1, rim: "#ffd590", rimStrength: 0.55, rimSide: -1, brightness: 1.05 },
  afternoon: { keySide: -1, rim: "#ffc470", rimStrength: 0.55, rimSide: -1, brightness: 1.0 },
  lateAfternoon: { keySide: 1, rim: "#ffb860", rimStrength: 0.6, rimSide: 1, brightness: 0.99 },
  sunset: { keySide: 1, rim: "#ff9f50", rimStrength: 0.7, rimSide: 1, brightness: 0.95 },
};

/** Pose presets (spread into a pose key; lean values assume bodyTurn > 0, mirror for < 0). */
export const EP05R_GESTURES = {
  /** Binoy after the shout: breathing hard (pair with breathRate about 1.8), brows up, mouth a little open. */
  binoyBreathless: { lean: 3, brow: 0.55, browTilt: 0.35, smile: 0.08, gasp: 0.25 } as Partial<Pose>,
  /** Binoy, sheepish (02i): scratching his head with a half laugh. */
  binoySheepish: { ...GESTURES5.scratchHead, smile: 0.38, eyeY: 0.1 } as Partial<Pose>,
  /** Haricharan's bluster: knitted brows, no smile. */
  haricharanAngry: { ...GESTURES5.angryBrows } as Partial<Pose>,
  /** The bamboo upright beside him in his right fist, foot on the ground (talking). */
  haricharanPoleUpright: { ...GESTURES5.bambooUpright } as Partial<Pose>,
  /** The bamboo carried slanting forward on the run (one hand; add twoHand for both). */
  haricharanPoleCarried: { ...GESTURES5.bambooCarried } as Partial<Pose>,
  /** The bamboo carried slanting forward in both hands (Ep05Haricharan twoHand 1, secondGrip "auto"): the first fist at
   *  his waist, the pole passing within reach of the free shoulder (bodyTurn about 0.25-0.3). */
  haricharanPoleAcross: { rProp: "bamboo", rHand: "hold", poleDrop: 0, poleTilt: 20, rS: -6, rE: 46 } as Partial<Pose>,
  /** Senior clerk writing at the ledger (seated, rProp reedPen): bent over, eyes down. */
  seniorClerkWrite: { lean: 12, headNod: 7, eyeY: 0.7, lid: 0.2, rProp: "reedPen", rHand: "hold", rS: 34, rE: 78, smile: 0.12 } as Partial<Pose>,
  /** He looks up over his spectacles (05b): head lifts, eyes up, brows raised, pen stopped. */
  seniorClerkPeer: { lean: 6, headNod: 2, eyeY: -0.45, brow: 0.45, lid: 0.05, rProp: "reedPen", rHand: "hold", rS: 30, rE: 72, smile: 0.08 } as Partial<Pose>,
  /** The verdict (05d): pair with headShake(f, start, dur) on headTurn. */
  seniorClerkShake: { lean: 4, brow: 0.2, browTilt: 0.3, smile: 0.2, rProp: "reedPen", rHand: "hold", rS: 26, rE: 70 } as Partial<Pose>,
  /** Junior clerk fanning himself (lProp palmFan: the fan flutters on its own). */
  juniorClerkFan: { lProp: "palmFan", lHand: "hold", lS: 12, lE: 128, smile: 0.2 } as Partial<Pose>,
  /** He leans in, conspiratorial (05c). Give the fan renderer makePalmFanInHand(() => 0) to stop it mid-air. */
  juniorClerkLeanIn: { lean: 11, brow: 0.85, browTilt: -0.1, smile: 0.3, lProp: "palmFan", lHand: "hold", lS: 40, lE: 96 } as Partial<Pose>,
} as const;

/* =============================================================================================================== */
/* Ep05Person                                                                                                      */
/* =============================================================================================================== */

export type Ep05PersonProps = PuppetProps & { shadow?: boolean; ink?: boolean; shadowRx?: number };

/** A Puppet in the Ghibli ink with its contact shadow and the clerk hand props wired in. */
export const Ep05Person: React.FC<Ep05PersonProps> = ({ shadow = true, ink = true, shadowRx, props, ...pp }) => {
  const s = pp.scale ?? 1;
  const rx = shadowRx ?? (pp.seated ? 70 : 44) * s * pp.cast.height;
  return (
    <g filter={ink ? "url(#ghibli-char-ink)" : undefined}>
      {shadow && <ContactShadow x={pp.x} y={pp.y + 1} rx={rx} ry={rx * 0.22} opacity={0.3} />}
      <Puppet {...pp} props={{ ...EP05_HAND_PROPS, ...(props ?? {}) }} />
    </g>
  );
};

/* =============================================================================================================== */
/* Ep05Haricharan: the two-hand pole hold                                                                         */
/* =============================================================================================================== */

export type Ep05HaricharanProps = Omit<PuppetProps, "cast"> & {
  cast?: CastMember;
  /** 0..1 (or a function of the story clock) weight of the second hand on the pole */
  twoHand?: number | ((f: number) => number);
  /** where the second fist closes: fraction of the pole length from the first fist toward the top (negative = toward
   *  the foot), or "auto" (default): the point of the pole nearest the free shoulder */
  secondGrip?: number | "auto";
  shadow?: boolean;
  ink?: boolean;
  /** QA: a small ring at the second hand's target on the pole */
  showGrip?: boolean;
};

/** Draws its child function's result at its own render time (after the siblings before it have rendered). */
const Late: React.FC<{ draw: () => React.ReactNode }> = ({ draw }) => <>{draw()}</>;

export const Ep05Haricharan: React.FC<Ep05HaricharanProps> = ({
  cast = EP05R_CAST.haricharan,
  twoHand = 0,
  secondGrip = "auto",
  shadow = true,
  ink = true,
  showGrip = false,
  acting,
  anchors,
  reachAt,
  reachExact,
  ...pp
}) => {
  const k2 = (fr: number) => clamp(typeof twoHand === "function" ? twoHand(fr) : twoHand);
  // which arm holds the pole this frame (from the acting pose), so the OTHER arm is the second hand
  const poleArm = (fr: number): 1 | -1 | 0 => {
    const a = acting?.(fr) ?? {};
    return a.rProp === "bamboo" ? 1 : a.lProp === "bamboo" ? -1 : 0;
  };
  const kNow = k2(pp.f);
  const armNow = poleArm(pp.f);
  const active = kNow > 1e-3 && armNow !== 0;
  // pass 1 (hidden): the pole's anchors this frame (they depend on the pole arm only)
  const cap: { a: PuppetAnchors | null } = { a: null };
  const secondAt = (fr: number) => {
    const a = cap.a;
    if (!a || !a.poleGrip || !a.poleTip || !a.poleBase) return reachAt ? reachAt(fr) : { x: pp.x, y: pp.y - 200 };
    const L = Math.hypot(a.poleTip.x - a.poleBase.x, a.poleTip.y - a.poleBase.y) || 1;
    const ux = (a.poleTip.x - a.poleBase.x) / L;
    const uy = (a.poleTip.y - a.poleBase.y) / L;
    let k: number;
    if (secondGrip === "auto") {
      // the point of the pole nearest the free shoulder (about 1.5 head radii below the head centre), a little below it
      const sc = pp.scale ?? 1;
      const sh = { x: a.head.x, y: a.head.y + 1.55 * 41 * Math.sqrt(cast.height) * sc };
      k = clamp(((sh.x - a.poleGrip.x) * ux + (sh.y - a.poleGrip.y) * uy) / L - 0.04, -0.4, 0.7);
      // never inside the first fist
      if (Math.abs(k) < 0.13) k = k < 0 ? -0.13 : 0.13;
    } else k = secondGrip;
    return { x: a.poleGrip.x + ux * L * k, y: a.poleGrip.y + uy * L * k };
  };
  const actingTwo = (fr: number): Partial<Pose> => {
    const a = acting?.(fr) ?? {};
    const k = k2(fr);
    const arm = poleArm(fr);
    if (k <= 1e-3 || arm === 0) return a;
    const sign = -arm; // the other arm
    const handKey = sign === 1 ? "rHand" : "lHand";
    return {
      ...a,
      reach: lerp(a.reach ?? 0, sign, k),
      reachUp: lerp(a.reachUp ?? 0, 0.15, k),
      [handKey]: k > 0.35 ? "hold" : a[handKey as "rHand" | "lHand"] ?? "relaxed",
    };
  };
  const s = pp.scale ?? 1;
  const rx = 44 * s * cast.height;
  return (
    <g filter={ink ? "url(#ghibli-char-ink)" : undefined}>
      {active && (
        <g style={{ display: "none" }} aria-hidden>
          <Puppet {...pp} cast={cast} acting={acting} anchors={(a) => (cap.a = a)} />
        </g>
      )}
      {shadow && <ContactShadow x={pp.x} y={pp.y + 1} rx={rx} ry={rx * 0.22} opacity={0.3} />}
      <Puppet
        {...pp}
        cast={cast}
        props={{ ...EP05_HAND_PROPS, ...(pp.props ?? {}) }}
        acting={active ? actingTwo : acting}
        reachAt={active ? secondAt : reachAt}
        reachExact={active ? true : reachExact}
        anchors={anchors}
      />
      {showGrip && active && (
        <Late
          draw={() => {
            const p = secondAt(pp.f);
            return <circle cx={p.x} cy={p.y} r={5} fill="none" stroke="#d02020" strokeWidth={1.5} />;
          }}
        />
      )}
    </g>
  );
};

/* =============================================================================================================== */
/* Balak                                                                                                           */
/* =============================================================================================================== */

type BalakExtras = {
  /** 0..1 the gentle glow beat (ep05GlowBeat); 0 = his resting light */
  glowK?: number;
  /** cam.zoom of the layer he is in (fine ink line and face line stay about 1 px on screen) */
  zoom?: number;
  halo?: boolean;
  ground?: boolean;
  shadow?: boolean;
  /** draw <Ep05BalakInkDefs> here (default true; pass false if the layer already has it) */
  inkDefs?: boolean;
};

export type Ep05SeatedBalakProps = Omit<SeatedChildProps, "plateLook"> & BalakExtras & { lapDetails?: boolean };
export type Ep05StandingBalakProps = Omit<StandingChildProps, "plateLook"> & BalakExtras;

/** The SeatedChild props Ep05SeatedBalak draws (use the same object for seatedChildHands / seatedEp6Anchors). */
export const ep05SeatedProps = (p: Omit<SeatedChildProps, "plateLook">): SeatedChildProps => ({
  design: "plate",
  build: "healthy",
  age: EP05_BALAK_AGE,
  ...p,
  ...EP05_BALAK_LOOK,
});

/** The StandingChild props Ep05StandingBalak draws (use the same object for standingChildJoints). */
export const ep05StandingProps = (p: Omit<StandingChildProps, "plateLook">): StandingChildProps => ({
  build: "healthy",
  sturdy: true,
  age: EP05_BALAK_AGE,
  headScale: EP05R_SCALE.standingBalak.headScale,
  ...p,
  ...EP05_BALAK_LOOK,
});

export const Ep05SeatedBalak: React.FC<Ep05SeatedBalakProps> = ({ glowK = 0, zoom = 1, halo = true, ground = true, shadow = true, inkDefs = true, lapDetails = true, ...rest }) => {
  const props = ep05SeatedProps(rest);
  const s = props.s ?? 1;
  const g = clamp(glowK);
  const ga = seatedEp6Anchors(props).glowAnchor;
  return (
    <g>
      {inkDefs && <Ep05BalakInkDefs zoom={zoom} rim={ep05GlowLevel("rim", g)} />}
      {ground && <Ep05BalakGroundGlow x={props.x} y={props.y + 4 * s} rx={lerp(150, 178, g) * s} ry={lerp(27, 32, g) * s} level={ep05GlowLevel("ground", g)} />}
      {halo && <Ep05BalakDivine cx={ga.cx} cy={ga.cy} r={ga.r * lerp(0.56, 0.62, g)} glow={ep05GlowLevel("halo", g)} f={props.lifeF ?? props.f} motes={4} />}
      <g filter={`url(#${EP05_BALAK_INK})`}>
        {shadow && <ContactShadow x={props.x} y={props.y} rx={65 * s} ry={13 * s} opacity={0.28} sunDir={-1} castStretch={1.15} />}
        <SeatedChild {...props} inkZoom={zoom} />
        {lapDetails && <GhibliBalakLapDetails x={props.x} y={props.y} s={s} flip={props.flip} f={props.lifeF ?? props.f} />}
      </g>
    </g>
  );
};

export const Ep05StandingBalak: React.FC<Ep05StandingBalakProps> = ({ glowK = 0, zoom = 1, halo = true, ground = true, shadow = true, inkDefs = true, ...rest }) => {
  const props = ep05StandingProps(rest);
  const s = props.s ?? 1;
  const g = clamp(glowK);
  const j = standingChildJoints(props);
  return (
    <g>
      {inkDefs && <Ep05BalakInkDefs zoom={zoom} rim={ep05GlowLevel("rim", g)} />}
      {ground && <Ep05BalakGroundGlow x={props.x} y={props.y + 3 * s} rx={lerp(96, 112, g) * s * 2} ry={lerp(17, 20, g) * s * 2} level={ep05GlowLevel("ground", g)} />}
      {halo && <Ep05BalakDivine cx={j.glowAnchor.x} cy={j.glowAnchor.y} r={EP05_GLOW.haloR * j.headScale * lerp(1, 1.08, g)} glow={ep05GlowLevel("halo", g)} f={props.lifeF ?? props.f} motes={4} />}
      <g filter={`url(#${EP05_BALAK_INK})`}>
        {shadow && <ContactShadow x={(j.footNear.x + j.footFar.x) / 2} y={props.y} rx={60 * s * 2} ry={11 * s * 2} opacity={0.28} sunDir={-1} castStretch={1.1} />}
        <StandingChild {...props} inkZoom={zoom} />
      </g>
    </g>
  );
};
