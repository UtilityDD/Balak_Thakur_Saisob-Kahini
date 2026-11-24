import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { makeActing, PoseKey } from "../../cinematic/core/anim";
import {
  BASE_POSE,
  GESTURES6,
  headShake,
  lookAround,
  pleadBob,
  Pose,
  Puppet,
  PuppetAnchors,
  PropRenderer,
  scoldPulse,
  stampPulse,
  STAMP,
  SWAT,
  swatPulse,
  throwUpPulse,
  walkPlantFrames,
  walkPose,
  walkTravel,
  WalkOpts,
} from "../../cinematic/rig/Puppet";
import { CAST, CastEntry, EP06_CHILD_SCALE } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState } from "../../cinematic/rig/lipsync";
import { StandingChild, standingChildJoints } from "../../episode05/rig/StandingChild";
import { SeatedChild } from "../../episode03/rig/SeatedChild";

const BAL_STAND = EP06_CHILD_SCALE.standingBalak;
const BAL_SEAT = EP06_CHILD_SCALE.seatedBalak;

/**
 * Cast06QA (Episode 6): the new people of Episode 6 and their gestures (240 frames).
 *  Top: a lineup at true relative scale (adult Puppet scale K, standing Balak at s = 0.56 K, headScale 1.35, RIG-EP05-02):
 *       Surendra in khadam, the friend's dada, the boudi, the sweet-seller, the elder brother, Balak, the culprit
 *       friend and village boys A to E.
 *  Bottom left: Surendra walking a few steps in khadam, cropped on the feet; the clack frames from walkPlantFrames
 *       flash "খট্" over the foot that lands.
 *  Bottom right: the new gestures, each labelled and animated. Red dots: the target points (pointAt, swatAt, reachAt,
 *       holdAt); green dots: anchors().feet.
 */

const io = "inOut" as const;
const K = 0.98; // adult Puppet scale in the lineup

/* ---------------- lineup ---------------- */
type LineItem = { kind: "puppet"; c: CastEntry; label: string } | { kind: "balak"; label: string };
const LINEUP: LineItem[] = [
  { kind: "puppet", c: CAST.surendra, label: "সুরেন্দ্র (surendra) খড়ম" },
  { kind: "puppet", c: CAST.friendDada, label: "বন্ধুর দাদা friendDada" },
  { kind: "puppet", c: CAST.boudi, label: "বৌদি boudi" },
  { kind: "puppet", c: CAST.sweetSeller, label: "ময়রা sweetSeller" },
  { kind: "puppet", c: CAST.elderBrother, label: "দাদা elderBrother" },
  { kind: "balak", label: "বালক (StandingChild)" },
  { kind: "puppet", c: CAST.culpritFriend, label: "culpritFriend" },
  { kind: "puppet", c: CAST.villageBoyA, label: "villageBoyA" },
  { kind: "puppet", c: CAST.villageBoyB, label: "villageBoyB" },
  { kind: "puppet", c: CAST.villageBoyC, label: "villageBoyC" },
  { kind: "puppet", c: CAST.villageBoyD, label: "villageBoyD" },
  { kind: "puppet", c: CAST.villageBoyE, label: "villageBoyE" },
];
const LINE_Y = 452;

const Lineup: React.FC<{ f: number }> = ({ f }) => {
  const w = 1920 / LINEUP.length;
  return (
    <g>
      <rect x={0} y={0} width={1920} height={500} fill="#e6dccb" />
      <rect x={0} y={LINE_Y} width={1920} height={48} fill="#c9b796" />
      {/* height guides every 50 px above the ground */}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d={`M 0 ${LINE_Y - 50 * (i + 1)} L 1920 ${LINE_Y - 50 * (i + 1)}`} stroke="#b9ab92" strokeWidth={1} strokeDasharray="4 6" />
      ))}
      {(() => {
        // Balak's crown and chin, carried across the lineup (CHR-08: as tall as boy C, head about 90% of a boy's)
        const bx = (1920 / LINEUP.length) * 5.5;
        const j = standingChildJoints({ x: bx, y: LINE_Y, s: BAL_STAND.s * K, headScale: BAL_STAND.headScale, f, lifeF: f, pose: "standQuiet" });
        return (
          <g>
            <path d={`M 0 ${j.headTop.y} L 1920 ${j.headTop.y}`} stroke="#c0392b" strokeWidth={1.2} strokeDasharray="8 5" opacity={0.7} />
            <path d={`M 0 ${j.chin.y} L 1920 ${j.chin.y}`} stroke="#2e6fb0" strokeWidth={1.2} strokeDasharray="8 5" opacity={0.6} />
          </g>
        );
      })()}
      {LINEUP.map((it, i) => {
        const x = w * i + w / 2;
        return (
          <g key={i}>
            {it.kind === "balak" ? (
              <StandingChild x={x} y={LINE_Y} s={BAL_STAND.s * K} headScale={BAL_STAND.headScale} f={f} lifeF={f} pose="standQuiet" />
            ) : (
              <Puppet
                cast={it.c}
                f={f}
                lifeF={f}
                x={x}
                y={LINE_Y}
                scale={K}
                acting={() => ({ bodyTurn: 0.35, smile: it.c.id === "elderBrother" ? 0.5 : 0.4 })}
                footwear={it.c.id === "surendra" ? "khadam" : undefined}
              />
            )}
            <text x={x} y={LINE_Y + 30} fontFamily={BN_FONT} fontSize={15} fill="#3a2a1c" textAnchor="middle">
              {it.label}
            </text>
          </g>
        );
      })}
      <text x={16} y={30} fontFamily={BN_FONT} fontSize={22} fontWeight={700} fill="#3a2a1c">
        Episode 6 cast at true relative scale (CHR-08: adults K = {K}; Balak s = {BAL_STAND.s}K, headScale {BAL_STAND.headScale}; boys headScale {EP06_CHILD_SCALE.childHead}); red/blue: Balak's crown and chin
      </text>
    </g>
  );
};

/* ---------------- khadam walk crop ---------------- */
const KH = { x0: 0, y0: 500, w: 560, h: 290 };
const KH_S = 2.0;
const KH_GROUND = 760;
/** A real walking pace at this scale; the camera tracks him (the ground marks scroll), so he stays in the crop. */
const KH_WALK: WalkOpts = { start: 20, dur: 120, fromX: 0, toX: 1750, scale: KH_S, height: CAST.surendra.height, seed: CAST.surendra.seed, kind: "hurry", bodyTurn: 0.85, stopIn: 14 };
const KH_PLANTS = walkPlantFrames(KH_WALK);

const KhadamWalk: React.FC<{ f: number }> = ({ f }) => {
  const a: { v: PuppetAnchors | null } = { v: null };
  const travel = walkTravel(f, KH_WALK).bodyX;
  const x = KH.x0 + 250;
  const hit = KH_PLANTS.find((p) => f >= p.f && f < p.f + 4);
  return (
    <g>
      <defs>
        <clipPath id="kh6clip">
          <rect x={KH.x0} y={KH.y0 + 64} width={KH.w} height={KH.h - 64} />
        </clipPath>
      </defs>
      <rect x={KH.x0} y={KH.y0} width={KH.w} height={KH.h} fill="#efe6d6" />
      <g clipPath="url(#kh6clip)">
        <rect x={KH.x0} y={KH_GROUND} width={KH.w} height={KH.h} fill="#bfa780" />
        {Array.from({ length: 12 }, (_, m) => {
          const gx = KH.x0 + ((((m * 90 - travel) % 1080) + 1080) % 1080) - 260;
          return <path key={m} d={`M ${gx} ${KH_GROUND + 14} l 22 0`} stroke="#9c8661" strokeWidth={3} strokeLinecap="round" />;
        })}
        <Puppet
          cast={CAST.surendra}
          f={f}
          lifeF={f}
          x={x}
          y={KH_GROUND}
          scale={KH_S}
          acting={(fr) => walkPose(fr, KH_WALK)}
          footwear="khadam"
          anchors={(v) => {
            a.v = v;
          }}
        />
        {a.v?.feet.map((ft) => (
          <circle key={ft.side} cx={ft.x} cy={ft.y} r={4} fill={ft.lift < 0.5 ? "#2e8b3e" : "#9bc79f"} />
        ))}
        {hit && a.v && (
          <text x={a.v.feet.find((ft) => ft.side === hit.side)!.x} y={KH_GROUND - 70} fontFamily={BN_FONT} fontSize={34} fontWeight={700} fill="#b0301e" textAnchor="middle">
            খট্
          </text>
        )}
      </g>
      <text x={KH.x0 + 14} y={KH.y0 + 28} fontFamily={BN_FONT} fontSize={20} fontWeight={700} fill="#3a2a1c">
        Surendra in khadam (footwear="khadam"), feet crop
      </text>
      <text x={KH.x0 + 14} y={KH.y0 + 54} fontFamily={BN_FONT} fontSize={15} fill="#5a4630">
        clack frames (walkPlantFrames): {KH_PLANTS.map((p) => `${p.f}${p.side > 0 ? "R" : "L"}`).join(" ")}
      </text>
    </g>
  );
};

/* ---------------- gesture panels ---------------- */
type Panel = {
  c: CastEntry;
  title: string;
  labels: Array<[number, string]>;
  acting: (f: number) => Pose;
  /** Target points relative to the figure's ground point, in figure px at scale 1 (facing +x). */
  pointAt?: [number, number];
  swatAt?: [number, number];
  reachAt?: (f: number) => [number, number];
  holdAt?: [number, number];
  breath?: (f: number) => number;
  mouth?: (f: number) => MouthState;
  walk?: WalkOpts;
  props?: Record<string, PropRenderer>;
};

const keysOf = (keys: PoseKey<Pose>[]) => makeActing<Pose>(BASE_POSE, keys);
const childTurn = 0.5;
const adultTurn = 0.6;

/** The ten-rupee note stand-in (the props agent draws the real one): a folded pale blue-grey paper in the fist. */
const noteProp: PropRenderer = ({ scale }) => (
  <g transform={`scale(${scale})`}>
    <rect x={-9} y={-16} width={18} height={12} rx={1} fill="#b9c8cf" stroke="#7d9099" strokeWidth={0.8} transform="rotate(-12)" />
    <text x={-3} y={-7} fontFamily={BN_FONT} fontSize={6} fill="#4e6670" transform="rotate(-12)">
      ১০
    </text>
  </g>
);

const scoldMouth = (f: number): MouthState => (f > 20 && f < 110 ? { open: 0.25 + 0.2 * Math.abs(Math.sin(f * 0.6)), width: 1.05, round: 0.1, teeth: 0.4 } : MOUTH_REST);

const PANELS: Panel[] = [
  {
    c: CAST.elderBrother,
    title: "scold finger-jab",
    labels: [[0, "GESTURES6.scold"], [20, "jab = -scoldPulse (pointAt)"]],
    acting: (() => {
      const k = keysOf([{ f: 0, bodyTurn: childTurn, smile: 0.2 }, { f: 18, in: 10, ease: io, ...GESTURES6.scold, bodyTurn: childTurn }, { f: 112, ease: io, lean: 4 }, { f: 128, in: 14, ease: io, lean: 0, browTilt: 0, brow: 0, smile: 0.2, headNod: 0 }]);
      return (f: number) => ({ ...k(f), jab: -scoldPulse(f, 20, 92) });
    })(),
    pointAt: [140, -190],
    mouth: scoldMouth,
  },
  {
    c: CAST.elderBrother,
    title: "one-hand swat",
    labels: [[0, `swatPulse x3 (palm lands at +${SWAT.hit})`]],
    acting: (() => {
      const k = keysOf([{ f: 0, bodyTurn: childTurn, ...GESTURES6.scold }]);
      return (f: number) => {
        const q = k(f);
        const s = [40, 120, 200].map((st) => swatPulse(f, st)).reduce((m, v) => (v.swat > m.swat ? v : m));
        return { ...q, swat: -s.swat, swatHit: s.swatHit, lean: q.lean + s.dLean };
      };
    })(),
    swatAt: [78, -142],
  },
  {
    c: CAST.elderBrother,
    title: "fright freeze (hunch)",
    labels: [[0, "calm"], [36, "GESTURES6.frightFreeze, breathRate 2.2"], [196, "release"]],
    acting: keysOf([{ f: 0, bodyTurn: childTurn, smile: 0.4 }, { f: 44, in: 6, ease: io, ...GESTURES6.frightFreeze, bodyTurn: childTurn }, { f: 190, ease: io, hunch: 1 }, { f: 214, in: 20, ease: io, hunch: 0, gasp: 0, brow: 0.2, browTilt: 0.2, lean: 0, rS: 6, rE: -8, lS: 6, lE: -8, rHand: "relaxed", lHand: "relaxed", smile: 0.2 }]),
    breath: (f) => (f > 40 && f < 200 ? 2.2 : 1),
  },
  {
    c: CAST.elderBrother,
    title: "peek + shush, then plead",
    labels: [[0, "GESTURES6.peekShush"], [118, "GESTURES6.plead + pleadBob"]],
    acting: (() => {
      const k = keysOf([{ f: 0, bodyTurn: childTurn }, { f: 22, in: 14, ease: io, ...GESTURES6.peekShush, bodyTurn: childTurn }, { f: 108, ease: io, shush: -1 }, { f: 124, in: 14, ease: io, ...GESTURES6.plead, shush: 0, bodyTurn: childTurn }]);
      return (f: number) => {
        const q = k(f);
        const b = pleadBob(f, 136, 96);
        return { ...q, headNod: q.headNod + b.headNod, lean: q.lean + b.lean };
      };
    })(),
  },
  {
    c: CAST.elderBrother,
    title: "sheepish, grin, run off",
    labels: [[0, "GESTURES6.sheepish (behind)"], [112, "GESTURES6.grin"], [150, "walkPose run, child"]],
    acting: (() => {
      const k = keysOf([{ f: 0, bodyTurn: childTurn }, { f: 20, in: 16, ease: io, ...GESTURES6.sheepish, bodyTurn: childTurn }, { f: 104, ease: io, behind: 1 }, { f: 120, in: 12, ease: io, ...GESTURES6.grin, behind: 0, headNod: 0, eyeY: 0, bodyTurn: childTurn }]);
      return (f: number) => ({ ...k(f), ...(f >= 150 ? walkPose(f, RUN_OFF) : {}) });
    })(),
    walk: undefined,
  },
  {
    c: CAST.surendra,
    title: "father: search, then ask",
    labels: [[0, "searchLook + lookAround"], [118, "GESTURES6.askBend (reachAt)"]],
    acting: (() => {
      const k = keysOf([{ f: 0, bodyTurn: adultTurn, ...GESTURES6.searchLook }, { f: 112, ease: io, lean: 0 }, { f: 132, in: 18, ease: io, ...GESTURES6.askBend, bodyTurn: adultTurn }, { f: 214, ease: io, lean: 12 }, { f: 236, in: 18, ease: io, reach: 0, lean: 0, crouch: 0, headNod: 0 }]);
      return (f: number) => {
        const q = k(f);
        const l = lookAround(f, 8, 100);
        return { ...q, headTurn: q.headTurn + l.headTurn, eyeX: q.eyeX + l.eyeX };
      };
    })(),
    reachAt: () => [98, -178],
  },
  {
    c: CAST.surendra,
    title: "father: throw up hand, head shake",
    labels: [[0, "GESTURES6.exasperated"], [30, "throwUp (far arm) + headShake"]],
    acting: (() => {
      const k = keysOf([{ f: 0, bodyTurn: adultTurn }, { f: 24, in: 12, ease: io, ...GESTURES6.exasperated, bodyTurn: adultTurn }]);
      return (f: number) => {
        const q = k(f);
        return { ...q, throwUp: throwUpPulse(f, 34, 12) + throwUpPulse(f, 140, 12), headTurn: headShake(f, 40, 50) + headShake(f, 146, 50) };
      };
    })(),
  },
  {
    c: CAST.culpritFriend,
    title: "crouch, press into hands; whisper",
    labels: [[0, "GESTURES6.sly"], [24, "GESTURES6.crouchGive (holdAt)"], [130, "GESTURES6.whisper"]],
    acting: keysOf([
      { f: 0, bodyTurn: childTurn, ...GESTURES6.sly },
      { f: 40, in: 16, ease: io, ...GESTURES6.crouchGive, bodyTurn: childTurn },
      { f: 112, ease: io, crouch: 0.75 },
      { f: 136, in: 18, ease: io, crouch: 0.45, hold: 0, ...GESTURES6.whisper },
    ]),
    holdAt: [92, -62],
    mouth: (f) => (f > 150 && f < 220 ? { open: 0.12 + 0.08 * Math.abs(Math.sin(f * 0.8)), width: 0.9, round: 0.3, teeth: 0.2 } : MOUTH_REST),
  },
  {
    c: CAST.culpritFriend,
    title: "open palm, then stamp",
    labels: [[0, "GESTURES6.palmOut"], [110, `stampTemper + stampPulse (lands +${STAMP.hit})`]],
    acting: (() => {
      const k = keysOf([{ f: 0, bodyTurn: childTurn, ...GESTURES6.sly }, { f: 24, in: 12, ease: io, ...GESTURES6.palmOut, bodyTurn: childTurn }, { f: 100, ease: io, reach: -1 }, { f: 114, in: 10, ease: io, reach: 0, ...GESTURES6.stampTemper }]);
      return (f: number) => {
        const q = k(f);
        const s1 = stampPulse(f, 130);
        const s2 = stampPulse(f, 172);
        return { ...q, stamp: -(s1.stamp + s2.stamp), bodyY: q.bodyY + s1.dY + s2.dY };
      };
    })(),
  },
  {
    c: CAST.friendDada,
    title: "hands on hips; hand on shoulder",
    labels: [[0, "GESTURES6.handsOnHips"], [126, "GESTURES6.handOnShoulder (reachAt)"]],
    acting: keysOf([
      { f: 0, bodyTurn: adultTurn },
      { f: 26, in: 16, ease: io, ...GESTURES6.handsOnHips, bodyTurn: adultTurn },
      { f: 116, ease: io, hips: 1 },
      { f: 140, in: 18, ease: io, hips: 0, ...GESTURES6.handOnShoulder, browTilt: -0.2 },
    ]),
    reachAt: () => [104, -178],
  },
  {
    c: CAST.villageBoyB,
    title: "boys: cupped palms",
    labels: [[0, "GESTURES6.cuppedPalms"]],
    acting: keysOf([{ f: 0, bodyTurn: childTurn, smile: 0.3 }, { f: 36, in: 14, ease: io, ...GESTURES6.cuppedPalms, bodyTurn: childTurn }, { f: 200, ease: io, cupHands: 1 }, { f: 222, in: 14, ease: io, cupHands: 0, gasp: 0, lean: 0 }]),
  },
  {
    c: CAST.boudi,
    title: "boudi: note held up; coins in palm",
    labels: [[0, "GESTURES6.holdUpPaper (props.note)"], [118, "bendToChild + placeInPalm (reachAt)"]],
    acting: keysOf([
      { f: 0, bodyTurn: adultTurn, smile: 0.4 },
      { f: 24, in: 14, ease: io, ...GESTURES6.holdUpPaper, bodyTurn: adultTurn },
      { f: 104, ease: io, lS: -32 },
      { f: 120, in: 10, ease: io, lS: 6, lE: -8, lHand: "relaxed", lProp: "" },
      { f: 144, in: 20, ease: io, ...GESTURES6.bendToChild, ...GESTURES6.placeInPalm, bodyTurn: adultTurn },
    ]),
    reachAt: () => [100, -128],
    props: { note: noteProp },
  },
];

const RUN_OFF: WalkOpts = { start: 150, dur: 70, fromX: 0, toX: 260, scale: 0.66, height: CAST.elderBrother.height, seed: CAST.elderBrother.seed, kind: "run", child: true, bodyTurn: childTurn };

const G = { x0: 560, y0: 500, cols: 6, rows: 2, w: (1920 - 560) / 6, h: 290 };

const GesturePanel: React.FC<{ f: number; p: Panel; i: number }> = ({ f, p, i }) => {
  const col = i % G.cols;
  const row = Math.floor(i / G.cols);
  const x0 = G.x0 + col * G.w;
  const y0 = G.y0 + row * G.h;
  const child = p.c.age === "child";
  const s = child ? 0.66 : 0.6;
  const gx = x0 + G.w * 0.36;
  const gy = y0 + G.h - 26;
  const runX = p.title.startsWith("sheepish") ? walkTravel(f, RUN_OFF).bodyX : 0;
  const W = (q: [number, number]) => ({ x: gx + q[0] * s, y: gy + q[1] * s });
  const label = p.labels.filter(([a]) => f >= a).slice(-1)[0]?.[1] ?? "";
  const id = `g6clip${i}`;
  const a: { v: PuppetAnchors | null } = { v: null };
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x0 + 2} y={y0 + 2} width={G.w - 4} height={G.h - 4} />
        </clipPath>
      </defs>
      <rect x={x0 + 2} y={y0 + 2} width={G.w - 4} height={G.h - 4} fill={i % 2 ? "#efe7d8" : "#e9e0cf"} />
      <rect x={x0 + 2} y={gy} width={G.w - 4} height={G.h - (gy - y0) - 2} fill="#cbb995" />
      <g clipPath={`url(#${id})`}>
        <Puppet
          cast={p.c}
          f={f}
          lifeF={f}
          x={gx + runX}
          y={gy}
          scale={s}
          acting={p.acting}
          mouth={p.mouth}
          breathRate={p.breath ? p.breath(f) : 1}
          pointAt={p.pointAt ? () => W(p.pointAt!) : undefined}
          swatAt={p.swatAt ? () => W(p.swatAt!) : undefined}
          reachAt={p.reachAt ? (fr) => W(p.reachAt!(fr)) : undefined}
          holdAt={p.holdAt ? () => W(p.holdAt!) : undefined}
          props={p.props}
          anchors={(v) => {
            a.v = v;
          }}
        />
        {[p.pointAt, p.swatAt, p.holdAt, p.reachAt ? p.reachAt(f) : undefined].map((q, k) =>
          q ? <circle key={k} cx={W(q).x} cy={W(q).y} r={3.2} fill="#e0242a" opacity={0.85} /> : null,
        )}
        {a.v?.feet.map((ft) => <circle key={`ft${ft.side}`} cx={ft.x} cy={ft.y} r={2.4} fill={ft.lift < 0.5 ? "#2e8b3e" : "#9bc79f"} />)}
      </g>
      <text x={x0 + 10} y={y0 + 22} fontFamily={BN_FONT} fontSize={15} fontWeight={700} fill="#3a2a1c">
        {p.title}
      </text>
      <text x={x0 + 10} y={y0 + 40} fontFamily={BN_FONT} fontSize={12} fill="#5a4630">
        {p.c.id}: {label}
      </text>
    </g>
  );
};

/* ---------------- seated Balak among two boys (CHR-08) ---------------- */
const SEAT = { x0: 0, y0: 790, w: 560, h: 290 };
const SEAT_K = 0.8;
const SEAT_GROUND = 1040;

const SeatedRow: React.FC<{ f: number }> = ({ f }) => {
  const bx = SEAT.x0 + 280;
  return (
    <g>
      <rect x={SEAT.x0} y={SEAT.y0} width={SEAT.w} height={SEAT.h} fill="#e9e0cf" />
      <rect x={SEAT.x0} y={SEAT_GROUND} width={SEAT.w} height={SEAT.y0 + SEAT.h - SEAT_GROUND} fill="#cbb995" />
      <Puppet cast={CAST.villageBoyA} f={f} lifeF={f} x={SEAT.x0 + 110} y={SEAT_GROUND} scale={SEAT_K} seated acting={() => ({ bodyTurn: 0.45, smile: 0.4, rS: 10, rE: -40, lS: 8, lE: -40 })} />
      <SeatedChild x={bx} y={SEAT_GROUND} s={BAL_SEAT.s * SEAT_K} design="plate" age={6} f={f} lifeF={f} pose="sitCross" />
      <Puppet cast={CAST.villageBoyC} f={f} lifeF={f} x={SEAT.x0 + 450} y={SEAT_GROUND} scale={SEAT_K} flip acting={() => ({ bodyTurn: 0.45, crouch: 1, smile: 0.4, lean: 8, rS: 14, rE: 40, lS: 8, lE: 30 })} />
      <text x={SEAT.x0 + 14} y={SEAT.y0 + 26} fontFamily={BN_FONT} fontSize={18} fontWeight={700} fill="#3a2a1c">
        Seated Balak (s = {BAL_SEAT.s}K) between boy A (seated) and boy C (crouching)
      </text>
    </g>
  );
};

export const Cast06QA: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#d8cfbf" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Lineup f={f} />
        <KhadamWalk f={f} />
        <SeatedRow f={f} />
        {PANELS.map((p, i) => (
          <GesturePanel key={i} f={f} p={p} i={i} />
        ))}
        <text x={1906} y={1072} fontFamily={BN_FONT} fontSize={14} fill="#3a2a1c" textAnchor="end">
          f {f}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
