import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, lerp, makeActing, type PoseKey, track } from "../../../cinematic/core/anim";
import type { Cam } from "../../../cinematic/core/Stage";
import { cowTug, GentleCow, type GentleCowProps, solveGentleCow } from "../../../cinematic/animals/GentleCow";
import {
  BASE_POSE,
  bambooThump,
  GESTURES5,
  headShake as puppetHeadShake,
  jabPulse,
  type Lighting,
  type Pose,
  type PuppetAnchors,
  Puppet,
  throwUpPulse,
  turnBody,
  walkPose,
  type WalkOpts,
  walkTravel,
} from "../../../cinematic/rig/Puppet";
import { ujancharBgBlur } from "../../../cinematic/sets/UjancharHouse";
import { PEBBLE_PILE, pebbleSlot, type SeatedChildProps, type SeatedExpression, seatedChildHands } from "../../../episode03/rig/SeatedChild";
import { ContactShadow, GhibliCharFilterDefs, GhibliLayer, GhibliStage } from "../../GhibliStage";
import { GhibliFootstepDust } from "../../core/GhibliAtmosphere";
import { balakLivingBodyTransform } from "../../core/ghibliBalak";
import { GhibliDustPuff } from "../../core/GhibliLifeKit";
import { zoomProportionalDof } from "../../core/ghibliMotion";
import {
  GhibliKachariBackdrop,
  GhibliKachariFloorLayer,
  GhibliKachariForegroundAndGrade,
  KACHARI,
  KACHARI_BG,
  kachariKeepInSet,
  trellisPoint,
} from "../../episode05/GhibliKachariSet";
import { mouthFromRms } from "../../episode04/Ep04GhibliShared";
import { ep05GlowBeat } from "../Ep05BalakDivine";
import { EP05R_CAST, EP05R_GESTURES, EP05R_LIGHT, Ep05Haricharan, Ep05SeatedBalak, ep05SeatedProps } from "../Ep05RewriteCast";
import { PebblesArt } from "../Ep05RewriteProps";
import { ep05rPhraseLocal } from "../subtitles";
import { ep05rRoleRms } from "../timing";
import { camAt, frameOn, ramp, roleMouth, type Shot, shotAt, SkeletonTag, span, WarmWash } from "./RewriteKit";

/**
 * Scene 04 `04_cucumber_and_bamboo` (blueprint section 5, shots 22-33, AG9-AG12, P7-P9): the banana grove behind the
 * kachari, warm early afternoon. Acting pass 2026-11-28.
 *
 * STORY (book chapter নয়): Balak plays alone with his pebbles (AG9, 04a). The cow comes out of the grove behind him, eats
 * the cucumbers and tugs the vine until the root tears out (AG10, three tugs), then trots back past him and hides behind
 * the big banana clump (only her ear and tail show) while he watches. The back door bangs; Haricharan runs out with the
 * bamboo across his body in both hands and stops over the seated child, panting (AG11). 04b/04c/04d (jab at the vine,
 * the big-vine arm, the dangling cucumbers, the forehead slap; insert of the torn root on "গোড়াসুদ্ধ"). Balak's two
 * inner thoughts (04e + P7: a single pebble set down; 04g + P8: the slow push into his eyes) keep his MOUTH CLOSED
 * (ep05rRoleRms skips inner lines) with an inner-voice treatment: the background slowed to a third, a soft vignette and a
 * deeper depth of field. His answer (04h, 04j, 04k) is seated and respectful: an open palm toward the bamboo, then
 * toward the torn vine (away from the hidden cow), a slow head shake. Haricharan sputters (04i), explodes (04l: the
 * free hand flung up), thumps the bamboo once, turns and stomps back toward the door (AG12). P9 (GLOW BEAT 2): the cow
 * comes out from behind the clump, lowers her muzzle to his raised palm and he strokes her.
 *
 * HEIGHT AND THE BAMBOO: Haricharan stands (adult scale 1.1), Balak sits; the pole is held upright and planted, its top
 * leaning AWAY from the child (poleTilt -4), never swung or pointed at him or the cow. Both hands on the pole whenever his
 * free hand is not gesturing (Ep05Haricharan twoHand).
 *
 * Everything is keyed to the generated spans and caption phrases (span(), ep05rPhraseLocal), never to raw frames, except
 * small offsets inside a span. Scene-local frame f = the story clock (this episode has no held clock; pauses are
 * beats where only life moves).
 */

const SCENE_ID = "04_cucumber_and_bamboo";
const G = KACHARI.grove;
const B = { x: G.balak.x, y: G.balak.y };
const BS = 0.74 * (G.balak.s ?? 1.1);
const HS = G.haricharanStop.s ?? 1.1;
const HIDE = G.cowHide;
const DOOR = G.backDoor;
const DOOR_S = DOOR.s ?? 0.75;
const LIGHT: Lighting = EP05R_LIGHT.afternoon;
const LIGHT_DOOR: Lighting = { ...EP05R_LIGHT.afternoon, rimStrength: 0.15, brightness: 0.86 };
const HC_CAST = EP05R_CAST.haricharan;

/* ------------------------------------------------------------------ */
/* Spans and phrase cues                                               */
/* ------------------------------------------------------------------ */

const ag9 = span(SCENE_ID, "AG9_world_open");
const l4a = span(SCENE_ID, "04a_Narrator_ThatDay.wav");
const ag10 = span(SCENE_ID, "AG10_the_cow");
const ag11 = span(SCENE_ID, "AG11_haricharan");
const l4b = span(SCENE_ID, "04b_Haricharan_Q1.wav");
const l4c = span(SCENE_ID, "04c_Balak_WhatHappened.wav");
const l4d = span(SCENE_ID, "04d_Haricharan_Cucumber.wav");
const l4e = span(SCENE_ID, "04e_Balak_Inner1.wav");
const p7 = span(SCENE_ID, "P7");
const l4f = span(SCENE_ID, "04f_Haricharan_Q2.wav");
const l4g = span(SCENE_ID, "04g_Balak_Inner2.wav");
const p8 = span(SCENE_ID, "P8");
const l4h = span(SCENE_ID, "04h_Balak_Truth1.wav");
const l4i = span(SCENE_ID, "04i_Haricharan_Sputter.wav");
const l4j = span(SCENE_ID, "04j_Balak_Truth2.wav");
const l4k = span(SCENE_ID, "04k_Balak_Truth3.wav");
const l4l = span(SCENE_ID, "04l_Haricharan_Storm.wav");
const ag12 = span(SCENE_ID, "AG12_storms_off");
const p9 = span(SCENE_ID, "P9");
const ph = (snip: string, fb: number) => ep05rPhraseLocal(SCENE_ID, snip, fb);

const K = {
  // 04b
  konDike: ph("গরুটা কোন দিকে", l4b.from + 28),
  // 04d
  amar: ph("আমার অত বড়", l4d.from + 25),
  gota: ph("গোটা ঝাঁকা", l4d.from + 86),
  doga: ph("ডগায় ডগায়", l4d.from + 148),
  hoto: ph("হতচ্ছাড়া", l4d.from + 207),
  shudhu: ph("শুধু খায়নি", l4d.from + 268),
  gorasuddho: ph("গোড়াসুদ্ধ", l4d.to - 54),
  // 04f
  taratari: ph("তাড়াতাড়ি বল", l4f.from + 50),
  // 04g
  satya: ph("সত্যটা", l4g.from + 126),
  na: ph("না—গরুও", l4g.from + 160),
  // 04h
  ami4h: ph("আমি কিছুতেই", l4h.from + 144),
  // 04j
  oJe: ph("ও যে শশা", l4j.from + 78),
  taApnar: ph("তা আপনার গাছ", l4j.from + 131),
  // 04k
  oKiAr: ph("ও কি আর বুঝেছিল", l4k.from + 69),
  amiKhobor: ph("আমি ওর খবর", l4k.from + 170),
  // 04l
  okalati: ph("গরুর হয়ে", l4l.from + 36),
  jottosob: ph("যত্তসব", l4l.from + 80),
};

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

const keep = (c: Cam): Cam => kachariKeepInSet("grove", c);
const HX = 1120; // where Haricharan stops (left of Balak, facing him)

/** Balak's head centre (world) in his resting cross-legged seat: the close-ups are framed on it. */
const HEAD = seatedChildHands(ep05SeatedProps({ x: B.x, y: B.y, s: BS, f: 0, lifeF: 0, pose: "sitCross", flip: true })).head;

const CAMS = {
  wide: keep({ ...G.cam, focus: 1 }),
  trellis: keep(frameOn(590, 770, 1.6)),
  balakMed: keep(frameOn(1460, 800, 1.8)),
  wideDoor: keep({ x: -60, y: 40, zoom: 1.05, focus: 1 }),
  // dirty single on Haricharan: Balak's head in the lower right, clear of the captions band
  mcuH: keep(frameOn(1150, 690, 2.3)),
  cuB: keep(frameOn(HEAD.x + 6, HEAD.y + 42, 3.0)),
  two: keep(frameOn((HX + B.x) / 2 + 20, 760, 1.75)),
  insert: keep(frameOn(G.trellisRoot.x + 40, 860, 2.8)),
  inner1: keep(frameOn(HEAD.x - 20, 838, 2.1)),
  inner1Push: keep(frameOn(HEAD.x - 10, 832, 2.2)),
  eyesFrom: keep(frameOn(HEAD.x, HEAD.y + 18, 2.8)),
  eyesTo: keep(frameOn(HEAD.x, HEAD.y - 4, 4.48)),
  balakMcu: keep(frameOn(HEAD.x + 24, HEAD.y + 22, 2.6)),
  wide33: keep(frameOn(1150, 760, 1.25)),
  p9: keep(frameOn(1500, 800, 1.6)),
};

const SHOTS: Shot[] = [
  { name: "AG9", from: ag9.from, view: "grove", cam: CAMS.wide, note: "held wide; Balak with his pebbles" },
  { name: "Shot 22", from: l4a.from, view: "grove", cam: CAMS.wide, note: "hold; pebbles; the cow comes out of the grove" },
  { name: "AG10", from: ag10.from, view: "grove", cam: CAMS.trellis, note: "medium on the trellis: tugs, the root tears" },
  { name: "AG10 · cut", from: ag10.from + 44, view: "grove", cam: CAMS.balakMed, note: "medium on Balak: she trots past to the clump" },
  { name: "AG11", from: ag11.from, view: "grove", cam: CAMS.wideDoor, note: "the door bangs, Haricharan runs out" },
  { name: "Shot 23", from: l4b.from - 6, view: "grove", cam: CAMS.mcuH, note: "MCU Haricharan" },
  { name: "Shot 24", from: l4c.from - 6, view: "grove", cam: CAMS.cuB, note: "CU Balak looking up" },
  { name: "Shot 25", from: l4d.from - 7, view: "grove", cam: CAMS.two, push: { to: keep(frameOn(HX - 10, 690, 2.45)), a: l4d.from - 7, b: l4d.from + 36 }, note: "two-shot, then closer on Haricharan as he accuses" },
  { name: "Shot 25 · insert", from: K.gorasuddho, view: "grove", cam: CAMS.insert, note: "the torn root, bitten cucumbers" },
  { name: "Shot 26 · P7", from: l4e.from - 6, view: "grove", cam: CAMS.inner1, push: { to: CAMS.inner1Push, a: l4e.from, b: l4e.to }, note: "inner voice 1, mouth closed; P7 one pebble" },
  { name: "Shot 27", from: l4f.from - 6, view: "grove", cam: CAMS.mcuH, note: "he bends lower; the bamboo taps once" },
  { name: "Shot 28 · P8", from: l4g.from - 6, view: "grove", cam: CAMS.eyesFrom, push: { to: CAMS.eyesTo, a: l4g.from, b: l4g.to - 10 }, note: "inner voice 2: slow push into his eyes" },
  { name: "Shot 29", from: l4h.from - 6, view: "grove", cam: CAMS.cuB, note: "CU Balak: the open palm" },
  { name: "Shot 30", from: l4i.from - 4, view: "grove", cam: CAMS.mcuH, note: "eyes pop" },
  { name: "Shot 31", from: l4j.from - 7, view: "grove", cam: CAMS.balakMcu, note: "close on Biru as he answers" },
  { name: "Shot 32", from: l4k.from - 7, view: "grove", cam: CAMS.balakMcu, note: "close on Biru" },
  { name: "Shot 33 · AG12", from: l4l.from - 7, view: "grove", cam: CAMS.mcuH, note: "close on Haricharan as he storms" },
  { name: "Shot 33 · he goes", from: l4l.from + 48, view: "grove", cam: CAMS.wide33, note: "he thumps and stomps off" },
  { name: "P9 (GLOW 2)", from: p9.from, view: "grove", cam: CAMS.p9, note: "the cow comes out; he strokes her" },
];

/** Inner-voice windows (04e+P7, 04g+P8): background slowed, vignette, deeper focus. */
const INNER: Array<[number, number]> = [
  [l4e.from - 6, p7.to - 6],
  [l4g.from - 6, p8.to - 6],
];
const innerK = (f: number) => Math.max(...INNER.map(([a, b]) => ramp(f, a, a + 14) * (1 - ramp(f, b - 10, b))));
/** Background life clock: runs at a third of the speed inside the inner-voice windows (continuous). */
const bgClock = (f: number) => f - 0.68 * INNER.reduce((acc, [a, b]) => acc + clamp(f - a, 0, b - a), 0);

/* ------------------------------------------------------------------ */
/* Plane helpers (for the cow behind the clump and the door threshold) */
/* ------------------------------------------------------------------ */

type XY = { x: number; y: number };
const toScreen = (p: XY, d: number, c: Cam) => {
  const s = Math.pow(c.zoom, d);
  return { x: 960 + s * (p.x - 960 - c.x * d), y: 540 + s * (p.y - 540 - c.y * d) };
};
const fromScreen = (p: XY, d: number, c: Cam) => {
  const s = Math.pow(c.zoom, d);
  return { x: 960 + (p.x - 960) / s + c.x * d, y: 540 + (p.y - 540) / s + c.y * d };
};
const planeTo = (p: XY & { s?: number }, d1: number, d2: number, c: Cam) => {
  const q = fromScreen(toScreen(p, d1, c), d2, c);
  return { x: q.x, y: q.y, s: (p.s ?? 1) * Math.pow(c.zoom, d1 - d2) };
};

/* ------------------------------------------------------------------ */
/* The cow                                                             */
/* ------------------------------------------------------------------ */

const COW_SEED = 5;
const COW_T = { x: G.cowAtTrellis.x, y: G.cowAtTrellis.y, s: G.cowAtTrellis.s ?? 1.25 };
/** She comes out of the grove behind him during 04a and walks left to the vine. */
const COW_IN = { start: l4a.from + 50, end: ag10.from - 2 };
const TUGS = [ag10.from + 4, ag10.from + 18, ag10.from + 32];
const CUKE_AT = TUGS[1] + 8;
const TROT = ag10.from + 44; // = the cut to Balak
const HIDE_AT = ag11.from - 2;
const HIDE_ON_FLOOR = planeTo({ x: HIDE.x, y: HIDE.y, s: HIDE.s ?? 1.05 }, 0.85, 1, CAMS.balakMed);
const ENTRY_FROM = planeTo({ x: HIDE.x + 120, y: HIDE.y, s: HIDE.s ?? 1.05 }, 0.85, 1, CAMS.wide);
const P9_FROM = planeTo({ x: HIDE.x + 90, y: HIDE.y, s: HIDE.s ?? 1.05 }, 0.85, 1, CAMS.p9);
const P9_COW_S = 1.05;
const P9_TO = { x: B.x + 112 * BS + 245 * P9_COW_S, y: 934, s: P9_COW_S };
const STROKE_PALM = { x: 112, y: -120 };
const P9_NUZZLE = 10;

const trellisTornAt = (f: number) => {
  if (f < ag10.from - 4) return 0;
  if (f >= TROT) return 1;
  const base = track(f, [
    [ag10.from - 4, 0],
    [TUGS[0] + 9, 0.3, "out"],
    [TUGS[1] + 9, 0.58, "out"],
    [TUGS[2] + 9, 0.88, "out"],
    [TROT, 0.96],
  ]);
  return clamp(base + 0.05 * cowTug(f, TUGS));
};

type CowRender = { where: "none" | "floor" | "slot"; props: GentleCowProps; mask: number };

const balakFig = (p: XY, flip: boolean) => ({ x: B.x + (flip ? -p.x : p.x) * BS, y: B.y + p.y * BS });
const toBalakFig = (p: XY, flip: boolean) => ({ x: ((p.x - B.x) / BS) * (flip ? -1 : 1), y: (p.y - B.y) / BS });

const cowAt = (f: number): CowRender => {
  if (f >= p9.from - 4) {
    const palm = balakFig(STROKE_PALM, false);
    const pc = f - p9.from;
    return {
      where: "floor",
      mask: 1 - EASE.inOut(clamp((pc - 2) / 10)),
      props: {
        f,
        lifeF: f,
        s: P9_COW_S,
        flip: true,
        action: pc < P9_NUZZLE ? "walk" : "nuzzle",
        actionStart: pc < P9_NUZZLE ? p9.from - 10 : p9.from + P9_NUZZLE,
        prevAction: pc < P9_NUZZLE ? "hidden" : "walk",
        prevActionStart: p9.from - 10,
        path: [
          { f: p9.from - 4, x: P9_FROM.x, y: P9_FROM.y, s: P9_FROM.s },
          { f: p9.from + 16, x: P9_TO.x, y: P9_TO.y, s: P9_TO.s, ease: "out" },
        ],
        turn: track(pc, [
          [0, -0.12],
          [18, -0.04],
        ]),
        target: palm,
        seed: COW_SEED,
      },
    };
  }
  if (f < COW_IN.start) return { where: "none", props: { f, lifeF: f }, mask: 1 };
  if (f < ag10.from - 2) {
    // out of the grove behind him, a quiet walk to the vine (she faces left)
    return {
      where: "floor",
      mask: 1,
      props: {
        f,
        lifeF: f,
        flip: true,
        action: "walk",
        actionStart: COW_IN.start,
        path: [
          { f: COW_IN.start, x: ENTRY_FROM.x, y: ENTRY_FROM.y, s: ENTRY_FROM.s },
          { f: COW_IN.end, x: COW_T.x, y: COW_T.y, s: COW_T.s, ease: "out" },
        ],
        turn: track(f, [
          [COW_IN.start, 0.1],
          [COW_IN.start + 40, 0],
        ]),
        seed: COW_SEED,
      },
    };
  }
  if (f < TROT) {
    const torn = trellisTornAt(f);
    return {
      where: "floor",
      mask: 1,
      props: {
        f,
        lifeF: f,
        x: COW_T.x,
        y: COW_T.y,
        s: COW_T.s,
        flip: true,
        action: "graze",
        actionStart: ag10.from - 2,
        prevAction: "walk",
        prevActionStart: COW_IN.start,
        target: trellisPoint(torn, 0.9),
        tugs: TUGS,
        cucumber: clamp((f - CUKE_AT) / 4),
        seed: COW_SEED,
      },
    };
  }
  if (f < HIDE_AT + 2) {
    // the cut hides her turn: she trots back past him (behind him) and slows behind the clump
    return {
      where: "floor",
      mask: 1,
      props: {
        f,
        lifeF: f,
        action: f < HIDE_AT - 14 ? "trot" : "walk",
        actionStart: f < HIDE_AT - 14 ? TROT : HIDE_AT - 14,
        prevAction: f < HIDE_AT - 14 ? "graze" : "trot",
        prevActionStart: f < HIDE_AT - 14 ? ag10.from : TROT,
        path: [
          { f: TROT, x: COW_T.x + 30, y: COW_T.y - 2, s: 1.22 },
          { f: HIDE_AT, x: HIDE_ON_FLOOR.x, y: HIDE_ON_FLOOR.y, s: HIDE_ON_FLOOR.s, ease: "out" },
        ],
        turn: track(f, [
          [HIDE_AT - 20, 0],
          [HIDE_AT, 0.22],
        ]),
        cucumber: f < TROT + 24 ? 1 : 0,
        chew: true,
        seed: COW_SEED,
      },
    };
  }
  return {
    where: "slot",
    mask: 1,
    props: {
      f,
      lifeF: f,
      x: HIDE.x,
      y: HIDE.y,
      s: HIDE.s ?? 1.05,
      action: "hidden",
      actionStart: HIDE_AT,
      prevAction: "walk",
      prevActionStart: HIDE_AT - 14,
      turn: track(f, [
        [HIDE_AT, 0.22],
        [HIDE_AT + 24, 0],
      ]),
      seed: COW_SEED,
    },
  };
};

/** The screening clump (0.85 plane) as a mask shape, so a floor-plane cow reads as behind it. */
const ClumpMaskShapes: React.FC = () => {
  const { x, y } = HIDE;
  const trunk = (cx: number, base: number, s: number, key: string) => (
    <path key={key} d={`M ${cx - 32 * s} ${base} L ${cx - 15 * s} ${base - 470 * s} L ${cx + 15 * s} ${base - 470 * s} L ${cx + 33 * s} ${base} Z`} />
  );
  return (
    <g fill="#000">
      <path d={`M ${x - 122} ${y - 186} Q ${x - 40} ${y - 204} ${x + 60} ${y - 196} Q ${x + 180} ${y - 206} ${x + 310} ${y - 190} L ${x + 310} ${y + 60} L ${x - 122} ${y + 60} Z`} />
      {trunk(x - 70, y + 4, 1.12, "a")}
      {trunk(x + 52, y + 8, 1.18, "b")}
      {trunk(x + 200, y + 6, 1.12, "d")}
      {trunk(x + 262, y + 4, 1.0, "c")}
    </g>
  );
};

const FloorCow: React.FC<{ r: CowRender; cam: Cam; f: number }> = ({ r, cam, f }) => {
  const a = Math.pow(cam.zoom, 0.85 - 1);
  const o = planeTo({ x: 0, y: 0 }, 0.85, 1, cam);
  const groundL = planeTo({ x: HIDE.x - 40, y: 0 }, 0.85, 1, cam).x;
  const sol = solveGentleCow(r.props);
  return (
    <GhibliLayer depth={1}>
      <GhibliCharFilterDefs f={f} dapple shadeFactor={0.18} bounceColor="#7c9c78" sunColor="#ffe7aa" />
      <defs>
        <filter id="e5r04-clumpsoft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
        <mask id="e5r04-clump" maskUnits="userSpaceOnUse" x={-2000} y={-1000} width={7000} height={4000}>
          <rect x={-2000} y={-1000} width={7000} height={4000} fill="#fff" />
          <g opacity={r.mask}>
            <g transform={`translate(${o.x.toFixed(2)} ${o.y.toFixed(2)}) scale(${a.toFixed(5)})`} filter="url(#e5r04-clumpsoft)">
              <ClumpMaskShapes />
            </g>
            <rect x={groundL} y={870} width={4000} height={1200} fill="#000" filter="url(#e5r04-clumpsoft)" />
          </g>
        </mask>
      </defs>
      <g mask="url(#e5r04-clump)">
        <ContactShadow x={sol.x} y={sol.y + 2} rx={175 * sol.s} ry={16 * sol.s} opacity={0.28} />
        <g filter="url(#ghibli-char-ink)">
          <GentleCow {...r.props} />
        </g>
      </g>
    </GhibliLayer>
  );
};

/* ------------------------------------------------------------------ */
/* Haricharan                                                          */
/* ------------------------------------------------------------------ */

const PATH_X = [640, 860, 1060, 1180];
const PATH_Y = [900, 922, 940, 952];
const pathY = (x: number) => {
  if (x <= PATH_X[0]) return PATH_Y[0];
  for (let i = 0; i < PATH_X.length - 1; i++) if (x <= PATH_X[i + 1]) return lerp(PATH_Y[i], PATH_Y[i + 1], (x - PATH_X[i]) / (PATH_X[i + 1] - PATH_X[i]));
  return PATH_Y[PATH_Y.length - 1];
};
const HY = pathY(HX);

const DOOR_BANG = ag11.from; // the door creak SFX sits on AG11 + 0
const HC_IN_DOOR = DOOR_BANG + 1;
const HC_OUT = DOOR_BANG + 6;
const HC_ARRIVE = HC_OUT + 30;
const THRESH_IN = planeTo({ x: DOOR.x + 12, y: DOOR.y, s: DOOR_S }, 0.8, 1, CAMS.wideDoor);
const THRESH_OUT = planeTo({ x: DOOR.x + 12, y: DOOR.y, s: DOOR_S }, 0.8, 1, CAMS.wide33);
const THUMP1 = K.taratari - 13 + 4; // the tap lands about 4 f into "তাড়াতাড়ি বল" (hit = start + 13)
const THUMP2 = ag12.from + 6 - 13; // the AG12 thump lands on AG12 + 6
const TURN = ag12.from + 9;
const STOMP = ag12.from + 18;

const walkBase = { scale: HS, height: HC_CAST.height, seed: HC_CAST.seed, carrySide: 1 as const };
const W_DOOR_OUT: WalkOpts = { ...walkBase, scale: DOOR_S, start: HC_IN_DOOR - 4, dur: HC_OUT - HC_IN_DOOR + 4, fromX: DOOR.x - 14, toX: DOOR.x + 12, startIn: 2, stopIn: 1, kind: "run", bodyTurn: 0.85, rS: 22, rE: 55 };
const W_RUN: WalkOpts = { ...walkBase, start: HC_OUT, dur: HC_ARRIVE - HC_OUT, fromX: THRESH_IN.x, toX: HX, startIn: 4, stopIn: 6, kind: "run", bodyTurn: 0.85, rS: 22, rE: 55 };
const W_STOMP: WalkOpts = { ...walkBase, start: STOMP, dur: 62, fromX: HX, toX: THRESH_OUT.x, startIn: 8, stopIn: 4, kind: "stomp", bodyTurn: -0.85, rS: 8, rE: -24 };

const hcPlace = (f: number): { where: "none" | "door" | "floor"; x: number; y: number; s: number } => {
  if (f < HC_IN_DOOR || f >= p9.from) return { where: "none", x: 0, y: 0, s: HS };
  if (f < HC_OUT) return { where: "door", x: walkTravel(f, W_DOOR_OUT).bodyX, y: DOOR.y, s: DOOR_S };
  const stomping = f >= STOMP;
  const x = stomping ? walkTravel(f, W_STOMP).bodyX : walkTravel(f, W_RUN).bodyX;
  const th = stomping ? THRESH_OUT : THRESH_IN;
  if (x < PATH_X[0]) {
    const k = clamp((x - th.x) / (PATH_X[0] - th.x));
    return { where: "floor", x, y: lerp(th.y, PATH_Y[0], k), s: lerp(th.s, HS, k) };
  }
  return { where: "floor", x, y: pathY(x), s: HS };
};

const io = "inOut" as const;
const HC_KEYS: PoseKey<Pose>[] = [
  { f: -999, ...GESTURES5.angryBrows, ...EP05R_GESTURES.haricharanPoleAcross, bodyTurn: 0.85 },
  // stops short, plants the pole, a quick look into the grove
  { f: HC_ARRIVE + 4, in: 10, ease: io, poleDrop: 1, poleTilt: -4, rS: 10, rE: 18, bodyTurn: 0.3, headTurn: 0.32, eyeX: 0.6, eyeY: 0.1, headNod: 1, lean: 4 },
  // down at the child: "এই বীরু!"
  { f: l4b.from + 10, in: 9, ease: io, headTurn: 0.08, eyeX: 0.25, eyeY: 0.75, headNod: 9, lean: 6, brow: -0.25 },
  // "গরুটা কোন দিকে গেছে": a glance at the grove, back to him
  { f: K.konDike + 8, in: 10, ease: io, headTurn: 0.3, eyeX: 0.6, eyeY: 0.3, headNod: 4 },
  { f: K.konDike + 40, in: 10, ease: io, headTurn: 0.08, eyeX: 0.25, eyeY: 0.75, headNod: 9 },
  // 04c: listening, puzzled-impatient
  { f: l4c.from + 10, in: 12, ease: io, headTilt: 6, browTilt: -0.5, brow: -0.1, lean: 3 },
  // 04d "কী হয়েছে?": head back, incredulous
  { f: l4d.from + 6, in: 8, ease: io, headTilt: 2, headNod: 2, brow: 0.15, browTilt: -0.9, lean: 0 },
  // the jab at the vine: he turns toward it
  { f: K.amar - 4, in: 10, ease: io, bodyTurn: 0.12, headTurn: -0.28, eyeX: -0.6, eyeY: 0.1, headNod: 0 },
  { f: K.gota - 4, in: 12, ease: io, bodyTurn: 0.3, headTurn: 0.1, eyeX: 0.2, eyeY: 0.5, headNod: 5 },
  // "ডগায় ডগায় কচি কচি শশা!" (aggrieved, softer brows)
  { f: K.doga + 4, in: 10, ease: io, brow: 0.35, browTilt: 0.2, headTilt: 7 },
  // the forehead slap: head back a little
  { f: K.hoto + 10, in: 8, ease: io, headNod: -4, headTilt: -3, brow: 0.2, browTilt: -0.4, lid: 0.25 },
  // "শুধু খায়নি...": both hands back on the pole, leaning in
  { f: K.shudhu + 6, in: 12, ease: io, headNod: 7, headTilt: 4, brow: -0.25, browTilt: -0.9, lid: 0.12, lean: 6 },
  // 04e / P7: waits, glaring down
  { f: l4e.from + 10, in: 16, ease: io, lean: 3, headNod: 8, eyeY: 0.75, headTilt: 3 },
  // 04f: bends lower, impatient
  { f: l4f.from + 6, in: 14, ease: io, lean: 11, crouch: 0.14, headNod: 10, eyeY: 0.85, brow: -0.3 },
  // 04g: straightens a little, waiting
  { f: l4g.from + 30, in: 24, ease: io, lean: 5, crouch: 0.04, headNod: 7 },
  // 04h: listening; the brows climb in disbelief
  { f: l4h.from + 60, in: 30, ease: io, brow: 0.12, browTilt: -0.45, lean: 2, headTilt: 5 },
  // 04i: eyes pop, mouth hangs open, rocks back
  { f: l4i.from + 2, in: 6, ease: "backOut", gasp: 0.55, brow: 0.8, browTilt: 0.1, lid: -0.1, lean: -5, headNod: -5, headTilt: 0 },
  { f: l4j.from + 10, in: 14, ease: io, gasp: 0, brow: -0.1, browTilt: -0.8, lid: 0.1, lean: 1, headNod: 6, headTilt: 7 },
  // he follows Balak's palm to the torn vine
  { f: K.oJe + 6, in: 10, ease: io, headTurn: -0.3, eyeX: -0.6, eyeY: 0.2, headNod: 2 },
  { f: K.taApnar + 4, in: 12, ease: io, headTurn: 0.08, eyeX: 0.25, eyeY: 0.75, headNod: 7 },
  // 04k: the anger builds
  { f: K.amiKhobor, in: 20, ease: io, brow: -0.3, browTilt: -0.95, lean: 3, headTilt: 3 },
  // 04l: the explosion
  { f: l4l.from + 4, in: 6, ease: "backOut", lean: -3, headNod: -2, brow: 0.25, browTilt: -0.7, headTilt: -4 },
  { f: K.jottosob, in: 10, ease: io, lean: 1, headNod: 4, brow: -0.3, browTilt: -0.95 },
];
const HC_ACT = makeActing<Pose>(BASE_POSE, HC_KEYS);

/** Weight of the second hand on the pole (Ep05Haricharan twoHand): off while the free hand gestures. */
const twoHandAt = (f: number) => {
  const off1 = ramp(f, K.amar - 12, K.amar - 4) * (1 - ramp(f, K.shudhu + 2, K.shudhu + 12));
  const off2 = ramp(f, l4l.from - 6, l4l.from + 2);
  return clamp(1 - off1 - off2);
};

/** The big-vine arm: the free hand rises wide and holds, then falls (a partial throwUp). */
const vineArm = (f: number) => ramp(f, K.gota + 2, K.gota + 14) * (1 - ramp(f, K.doga - 18, K.doga - 2));
/** The dangling-cucumbers palm (reach, palm up) and the forehead slap (reach to the brow). */
const dogaW = (f: number) => ramp(f, K.doga, K.doga + 10) * (1 - ramp(f, K.hoto - 8, K.hoto + 2));
const slapW = (f: number) => ramp(f, K.hoto + 4, K.hoto + 10) * (1 - ramp(f, K.hoto + 34, K.hoto + 46));
const SLAP_WIN: [number, number] = [K.hoto - 2, K.hoto + 48];

const walkAt = (f: number): Partial<Pose> => {
  if (f >= W_DOOR_OUT.start && f < HC_OUT) return walkPose(f, W_DOOR_OUT);
  if (f >= HC_OUT && f <= HC_ARRIVE + 2) return walkPose(f, W_RUN);
  if (f >= STOMP) return walkPose(f, W_STOMP);
  return {};
};

const hcAct = (f: number): Partial<Pose> => {
  let k: Pose = HC_ACT(f);
  k = { ...k, ...walkAt(f) };
  k.jab = -jabPulse(f, K.amar, 20, 1);
  k.throwUp = -Math.max(0.72 * vineArm(f), throwUpPulse(f, l4l.from + 4, 12), 0.7 * throwUpPulse(f, K.okalati + 2, 8));
  const rw = dogaW(f) + slapW(f);
  k.reach = -clamp(rw);
  k.reachUp = dogaW(f) > slapW(f) ? 1 : 0;
  if (rw > 0.01) k.lHand = dogaW(f) > slapW(f) ? "cup" : "open";
  k.headTurn += puppetHeadShake(f, K.shudhu + 34, 30, 0.14) + puppetHeadShake(f, K.oKiAr + 30, 34, 0.1) + puppetHeadShake(f, K.okalati + 18, 28, 0.18) + puppetHeadShake(f, K.jottosob + 4, 40, 0.2);
  for (const t of [THUMP1, THUMP2]) {
    const th = bambooThump(f, t);
    k.poleLift += th.poleLift;
    k.lean += th.dLean;
    k.bodyY += th.dY;
    k.rS += th.dS;
  }
  if (f >= TURN) {
    const u = clamp((f - TURN) / 12);
    k.bodyTurn = turnBody(f, TURN, 12, 0.3, -0.85);
    k.headTurn = lerp(k.headTurn, 0, u);
    k.headTilt = lerp(k.headTilt, 2, u);
    k.poleDrop = clamp(1 - (f - TURN) / 10);
    k.poleTilt = lerp(-4, -14, u);
    k.eyeY = lerp(k.eyeY, 0.1, u);
    k.lean = lerp(k.lean, 0, u);
    k.crouch = 0;
  }
  if (f >= STOMP) k = { ...k, ...walkAt(f) };
  return k;
};

const hcRms = (f: number) => ep05rRoleRms(SCENE_ID, "haricharan", f);
const hcBreath = (f: number) =>
  f < HC_ARRIVE + 50 ? 2.5 : f < l4d.from ? lerp(2.5, 2.1, ramp(f, HC_ARRIVE + 50, l4d.from)) : f < l4i.from ? 1.9 : f < l4l.from ? 2.1 : 2.4;

/** Draws its child function at its own render time (after siblings that fill capture objects). */
const Late: React.FC<{ draw: () => React.ReactNode }> = ({ draw }) => <>{draw()}</>;

const Haricharan: React.FC<{ f: number; x: number; y: number; s: number; light: Lighting; cap: { a: PuppetAnchors | null } }> = ({ f, x, y, s, light, cap }) => {
  const slap = f >= SLAP_WIN[0] && f < SLAP_WIN[1];
  const head: { a: PuppetAnchors | null } = { a: null };
  const chest = (fr: number) => ({ x: x + 78 * s, y: y - 228 * s + 5 * s * Math.sin((fr - K.doga) * 0.33) });
  const reachAt = (fr: number) => {
    if (fr < K.hoto) return chest(fr);
    const h = head.a?.head;
    return h ? { x: h.x + 14 * s, y: h.y - 12 * s } : { x: x + 20 * s, y: y - 340 * s };
  };
  const common = {
    f,
    lifeF: f,
    x,
    y,
    scale: s,
    light,
    mouth: (fr: number) => mouthFromRms(hcRms(fr), fr),
    talk: (fr: number) => hcRms(fr),
    breathRate: hcBreath(f),
    pointAt: () => ({ x: 330, y: 770 }),
    pointReach: 0.88,
  };
  return (
    <>
      {slap && (
        <g style={{ display: "none" }} aria-hidden>
          <Puppet cast={HC_CAST} {...common} acting={(fr) => ({ ...hcAct(fr), reach: 0 })} anchors={(a) => (head.a = a)} />
        </g>
      )}
      <Ep05Haricharan {...common} acting={hcAct} twoHand={twoHandAt} reachAt={reachAt} reachExact anchors={(a) => (cap.a = a)} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Balak                                                               */
/* ------------------------------------------------------------------ */

const PEB0 = -30; // first pebble placed at PEB0 + 38
const PEB_END = PEB0 + 4 * 60; // four pebbles, the hand over the pile
const LOOKUP_AT = HC_ARRIVE - 4;
const P7_START = p7.from - 14; // the hand travels to the pile (handsTo, 14 f)
const P7_PICK = P7_START + 18;
const P7_PLACE = P7_PICK + 18;
const P7_BACK = p7.to + 2;
const PALM_4H = p8.to + 2;
const AMI_4H = K.ami4h - 4;
const PALM_4J = l4j.from + 2;
const TRELLIS_4J = K.oJe - 4;
const LAP_4J = K.taApnar + 4;
const WATCH = ag12.from + 12;

const palmOn = (p: XY) => ({ x: p.x - 4, y: p.y - 12 });
const P7_PILE = palmOn(PEBBLE_PILE);
const P7_SLOT = palmOn(pebbleSlot(4));
const TOWARD_POLE = { x: 175, y: -175 };
const TOWARD_HIM = { x: 170, y: -150 };
const TOWARD_VINE = { x: 215, y: -95 };

const arc = (a: XY, b: XY, t: number, lift: number) => {
  const u = EASE.inOut(clamp(t));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) - lift * Math.sin(u * Math.PI) };
};

const EXPR: Array<[number, SeatedExpression]> = [
  [0, "serene"],
  [l4e.from - 10, "thoughtful"],
  [K.na, "serene"],
  [l4j.from, "compassionate"],
];
const exprAt = (f: number) => {
  let i = 0;
  for (let k = 0; k < EXPR.length; k++) if (f >= EXPR[k][0]) i = k;
  return { expression: EXPR[i][1], prevExpression: EXPR[Math.max(0, i - 1)][1], expressionStart: EXPR[i][0] };
};

/** +1 = toward the side he faces (screen-left while flipped, toward Haricharan); -1 = behind him (screen-right). */
const lookAt = (f: number) =>
  track(f, [
    [COW_IN.start + 50, 0],
    [COW_IN.start + 64, 0.5],
    [ag10.from - 6, 0.55],
    [TROT + 4, -0.7, "out"],
    [HIDE_AT - 12, -0.65],
    [HIDE_AT - 2, 0.05],
    [DOOR_BANG + 2, 0.05],
    [DOOR_BANG + 8, 0.6, "out"],
    [LOOKUP_AT, 0.35],
    [l4e.from - 6, 0.35],
    [l4e.from + 8, 0.15],
    [WATCH, 0.3],
    [WATCH + 14, 0.6],
  ]);
const eyesDownAt = (f: number) =>
  track(f, [
    [HIDE_AT - 4, 0],
    [HIDE_AT + 4, 0.5],
    [DOOR_BANG, 0.5],
    [DOOR_BANG + 5, 0],
    [l4e.from - 6, 0],
    [l4e.from + 10, 0.35],
    [l4f.from, 0.35],
    [l4f.from + 12, 0],
    [l4g.from - 14, 0],
    [l4g.from + 4, 0.6],
    [K.satya - 6, 0.6],
    [K.satya + 10, 0],
    [K.na - 2, 0],
    [K.na + 14, 0.18],
    [p8.to, 0.18],
    [p8.to + 8, 0],
  ]);
const smileAt = (f: number) =>
  track(f, [
    [0, 0.22],
    [COW_IN.start + 60, 0.22],
    [COW_IN.start + 76, 0.38],
    [DOOR_BANG, 0.38],
    [DOOR_BANG + 6, 0.12],
    [K.na, 0.12],
    [K.na + 16, 0.26],
    [K.amiKhobor, 0.26],
    [K.amiKhobor + 18, 0.42],
    [WATCH, 0.3],
  ]);

const balakState = (f: number): Partial<SeatedChildProps> & { flip: boolean } => {
  if (f >= p9.from) return { flip: false, pose: "strokeCow", prevPose: "sitCross", poseStart: p9.from, prevPoseStart: WATCH };
  const flip = true;
  if (f < PEB_END) return { flip, pose: "playPebbles", poseStart: PEB0 };
  if (f < LOOKUP_AT) return { flip, pose: "sitCross", prevPose: "playPebbles", prevPoseStart: PEB0, poseStart: PEB_END };
  if (f < l4e.from - 6) return { flip, pose: "lookUp", prevPose: "sitCross", prevPoseStart: PEB_END, poseStart: LOOKUP_AT };
  const hands = {
    handTargets: { near: f < P7_PICK ? P7_PILE : arc(P7_PILE, P7_SLOT, (f - P7_PICK) / (P7_PLACE - P7_PICK), 9) },
    handShapes: { near: (f >= P7_PICK - 4 && f < P7_PLACE + 2 ? "grip" : "open") as "grip" | "open" },
  };
  if (f < P7_START) return { flip, pose: "sitCross", prevPose: "lookUp", prevPoseStart: LOOKUP_AT, poseStart: l4e.from - 6 };
  if (f < P7_BACK) return { flip, pose: "handsTo", prevPose: "sitCross", prevPoseStart: l4e.from - 6, poseStart: P7_START, ...hands };
  if (f < l4g.from - 16) return { flip, pose: "lookUp", prevPose: "handsTo", prevPoseStart: P7_START, poseStart: P7_BACK, ...hands };
  if (f < PALM_4H) return { flip, pose: "sitCross", prevPose: "lookUp", prevPoseStart: P7_BACK, poseStart: l4g.from - 16 };
  if (f < AMI_4H) return { flip, pose: "pointIn", prevPose: "sitCross", prevPoseStart: l4g.from - 16, poseStart: PALM_4H, pointAt: TOWARD_POLE };
  if (f < PALM_4J) return { flip, pose: "lookUp", prevPose: "pointIn", prevPoseStart: PALM_4H, poseStart: AMI_4H, pointAt: TOWARD_POLE };
  if (f < LAP_4J) {
    const pa = f < TRELLIS_4J ? TOWARD_HIM : arc(TOWARD_HIM, TOWARD_VINE, (f - TRELLIS_4J) / 16, 10);
    return { flip, pose: "pointIn", prevPose: "lookUp", prevPoseStart: AMI_4H, poseStart: PALM_4J, pointAt: pa };
  }
  if (f < WATCH) return { flip, pose: "lookUp", prevPose: "pointIn", prevPoseStart: PALM_4J, poseStart: LAP_4J, pointAt: TOWARD_VINE, headShake: K.oKiAr + 4 };
  return { flip, pose: "sitCross", prevPose: "lookUp", prevPoseStart: LAP_4J, poseStart: WATCH };
};

/** Pebbles on the ground: four laid by the first session, the fifth set down in P7. */
const pebblesT = (f: number) => (f < P7_PICK ? clamp(f - PEB0, -1, 239) : f < P7_PLACE + 2 ? 256 : 278);

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export const Scene04RewriteCucumberBamboo: React.FC = () => {
  const f = useCurrentFrame();
  const shot = shotAt(f, SHOTS);
  const raw = camAt(f, shot);
  const ik = innerK(f);
  const cam: Cam = { ...raw, focus: 1, dof: zoomProportionalDof(raw.zoom) + 0.9 * ik };
  const bgF = bgClock(f);

  // the cow
  const cowR = cowAt(f);
  const torn = trellisTornAt(f);
  const slotCow =
    cowR.where === "slot" ? (
      <GhibliLayer depth={0.85} extraBlur={ujancharBgBlur(0.85, 1, cam) * 0.45}>
        <GhibliCharFilterDefs f={f} dapple />
        <g filter="url(#ghibli-char-ink)">
          <GentleCow {...cowR.props} />
        </g>
      </GhibliLayer>
    ) : null;

  // Haricharan
  const hp = hcPlace(f);
  const doorOpen = f < DOOR_BANG ? 0 : track(f, [[DOOR_BANG, 0], [DOOR_BANG + 5, 1, "backOut"]]);
  const cap: { a: PuppetAnchors | null } = { a: null };
  const hcEl = (where: "door" | "floor") => <Haricharan f={f} x={hp.x} y={hp.y} s={hp.s} light={where === "door" ? LIGHT_DOOR : LIGHT} cap={cap} />;
  const dustOn = (f >= HC_OUT && f <= HC_ARRIVE + 2) || f >= STOMP;

  // Balak
  const st = balakState(f);
  const mouth = st.flip ? roleMouth(SCENE_ID, "balak", f) : 0;
  const glow = ep05GlowBeat(f, p9.from + 18, 30, 400, 60);
  let strokeProps: Partial<SeatedChildProps> = {};
  if (f >= p9.from) {
    const cow = solveGentleCow(cowR.props);
    const m = toBalakFig(cow.muzzle, false);
    const fh = toBalakFig(cow.forehead, false);
    strokeProps = { strokeAt: m, strokeDir: { x: fh.x - m.x, y: fh.y - m.y } };
  }
  const bProps = {
    x: B.x,
    y: B.y,
    s: BS,
    f,
    lifeF: f,
    mouth,
    talk: mouth > 0.06 ? 1 : 0,
    ...exprAt(f),
    ...st,
    ...strokeProps,
    face: { lookX: f >= p9.from ? 0.2 : lookAt(f), smile: f >= p9.from ? 0.6 : smileAt(f), eyesDown: f >= p9.from ? 0.15 : eyesDownAt(f) },
  };
  const carrying = f >= P7_PICK && f < P7_PLACE + 2;
  const hands = carrying ? seatedChildHands(ep05SeatedProps(bProps)) : null;

  return (
    <div style={{ position: "absolute", inset: 0, background: KACHARI_BG.grove, overflow: "hidden" }}>
      <GhibliStage cam={cam} background={KACHARI_BG.grove}>
        <GhibliKachariBackdrop
          view="grove"
          f={bgF}
          cam={cam}
          doorOpen={doorOpen}
          doorway={hp.where === "door" ? hcEl("door") : undefined}
          cow={slotCow}
        />
        <GhibliKachariFloorLayer view="grove" f={bgF} trellisTorn={torn} />
        {cowR.where === "floor" && <FloorCow r={cowR} cam={cam} f={f} />}
        <GhibliLayer depth={1}>
          <GhibliCharFilterDefs f={f} dapple shadeFactor={0.18} bounceColor="#7c9c78" sunColor="#ffe7aa" />
          {hp.where === "floor" && (
            <>
              <GhibliFootstepDust x={hp.x} y={hp.y} activity={dustOn ? 0.9 : 0} dir={f >= STOMP ? -1 : 1} s={hp.s} f={f} seed={21} />
              {hcEl("floor")}
              <Late
                draw={() => {
                  const base = cap.a?.poleBase;
                  if (!base) return null;
                  return (
                    <>
                      <GhibliDustPuff x={base.x} y={base.y} f={f} start={THUMP1 + 13} s={hp.s} />
                      <GhibliDustPuff x={base.x} y={base.y} f={f} start={THUMP2 + 13} s={hp.s} />
                    </>
                  );
                }}
              />
            </>
          )}
          <g filter="url(#ghibli-prop-watercolor)">
            <PebblesArt x={B.x} y={B.y} s={BS} flip t={pebblesT(f)} />
          </g>
          <g transform={balakLivingBodyTransform({ x: B.x, y: B.y, f, facing: st.flip ? -1 : 1, speechRms: mouth, tenderness: f >= p9.from ? 0.75 : 0, seed: 29 })}>
            <Ep05SeatedBalak {...bProps} glowK={glow} zoom={cam.zoom} />
            {hands && (
              <g>
                <ellipse cx={hands.nearPalm.x + hands.nearDir.x * 6 * BS} cy={hands.nearPalm.y + hands.nearDir.y * 6 * BS + 1} rx={3.4 * BS} ry={2.5 * BS} fill="#a69c8f" stroke="#3A2618" strokeWidth={0.6} />
              </g>
            )}
          </g>
        </GhibliLayer>
        <GhibliKachariForegroundAndGrade view="grove" f={bgF} zoom={cam.zoom} />
      </GhibliStage>
      <WarmWash amount={0.07 * ik} vignette={0.42 * ik} color="#ffe2b0" />
      <SkeletonTag sceneId={SCENE_ID} shot={shot} f={f} />
    </div>
  );
};
