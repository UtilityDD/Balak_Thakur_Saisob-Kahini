import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { clamp, makeActing, PoseKey } from "../../cinematic/core/anim";
import { Hand } from "../../cinematic/rig/Hand";
import {
  BAMBOO_THUMP,
  BASE_POSE,
  bambooThump,
  GESTURES5,
  jabPulse,
  Pose,
  Puppet,
  PuppetAnchors,
  shoutMouth,
  throwUpPulse,
  turnBody,
  walkPose,
  walkTravel,
  WalkOpts,
} from "../../cinematic/rig/Puppet";
import { CAST } from "../../cinematic/rig/cast";
import { MOUTH_REST, MouthState } from "../../cinematic/rig/lipsync";

/**
 * Cast05QA: the adults of Episode 5 in their actions (240 frames).
 * Top row (full figures, animated): Binoy (walks in, curious tilt, alarm with both hands on his head and a silent
 * shout, puzzled head scratch), Haricharan (runs in with the bamboo carried, stops short, plants it, jabs toward the
 * grove, flings up his hand and thumps the bamboo, turns and stomps off), Surendra (hurries in, bends to look,
 * puzzled), Charu (hurries in, kneels, takes the child's hand in both hands, turns it palm up and over, raises it to
 * her cheek, sighs). Bottom row: the same frames as face close-ups, plus Binoy's mother (CAST.womanA) with her hand
 * at her mouth. Red dots: the pole's foot and top and the hold point read back through PuppetProps.anchors.
 */

type Place = { x: number; y: number; scale: number };
type Who = "binoy" | "haricharan" | "surendra" | "charu" | "mother";

const io = "inOut" as const;

/** The Puppet's x offset from its walks (walkTravel goes on `x`, not Pose.bodyX: see WalkOpts.travelInBodyX). */
const travelOf = (segs: WalkOpts[], f: number) => {
  let x = segs.length ? segs[0].fromX : 0;
  for (const sg of segs) if (f >= sg.start) x = walkTravel(f, sg).bodyX;
  return x;
};
/** The walk segment running at f (its Pose channels), or nothing. */
const walkAt = (segs: WalkOpts[], f: number): Partial<Pose> => {
  const sg = segs.find((w) => f >= w.start && f <= w.start + w.dur + 2);
  return sg ? walkPose(f, sg) : {};
};

/* ---------------- Binoy ---------------- */
const binoyKeys: PoseKey<Pose>[] = [
  { f: 0, bodyTurn: 0.6, smile: 0.3 },
  { f: 50, in: 14, ease: io, ...GESTURES5.curiousTilt, bodyTurn: 0.6 },
  { f: 104, in: 8, ease: io, ...GESTURES5.handsOnHead, headTilt: 0, headTurn: 0, eyeY: 0 },
  { f: 152, ease: io, headHands: 1 },
  { f: 166, in: 14, ease: io, headHands: 0, brow: 0.2, browTilt: 0.2, smile: 0.1, lean: 0 },
  { f: 184, in: 14, ease: io, ...GESTURES5.scratchHead, scratch: -1 },
];
const binoyWalks = (pl: Place): WalkOpts[] => [{ start: 0, dur: 40, fromX: -300 * pl.scale, toX: 0, scale: pl.scale, height: CAST.binoy.height, seed: CAST.binoy.seed, kind: "hurry", bodyTurn: 0.6 }];
const binoyAct = (pl: Place) => {
  const keys = makeActing<Pose>(BASE_POSE, binoyKeys);
  return (f: number): Pose => ({ ...keys(f), ...walkAt(binoyWalks(pl), f) });
};
const binoyMouth = (f: number): MouthState => (f > 104 && f < 152 ? shoutMouth(f, 104, 48, 3) : MOUTH_REST);

/* ---------------- Haricharan ---------------- */
const HC_TURN = 168;
const HC_THUMP = 140;
const hcKeys: PoseKey<Pose>[] = [
  { f: 0, ...GESTURES5.bambooCarried, ...GESTURES5.angryBrows, bodyTurn: 0.85 },
  // stops short and plants the pole
  { f: 52, in: 10, ease: io, poleDrop: 1, poleTilt: 3, rS: 10, rE: 20 },
  { f: 62, in: 12, ease: io, headTurn: 0.1, eyeX: 0.2 },
  { f: 128, ease: io, headTurn: 0.1 },
  { f: 138, in: 8, ease: io, headTurn: -0.15, brow: 0.1, browTilt: -0.9 },
];
const hcWalks = (pl: Place): WalkOpts[] => [
  { start: 0, dur: 50, fromX: -340 * pl.scale, toX: 0, stopIn: 5, scale: pl.scale, height: 1, seed: CAST.haricharan.seed, kind: "run", carrySide: 1, bodyTurn: 0.85, rS: 22, rE: 55 },
  { start: HC_TURN + 12, dur: 60, fromX: 0, toX: -300 * pl.scale, scale: pl.scale, height: 1, seed: CAST.haricharan.seed, kind: "stomp", carrySide: 1, bodyTurn: -0.85, rS: 8, rE: -24 },
];
const hcAct = (pl: Place) => {
  const keys = makeActing<Pose>(BASE_POSE, hcKeys);
  return (f: number): Pose => {
    let k: Pose = keys(f);
    if (f <= 54) k = { ...k, ...walkAt(hcWalks(pl), f) };
    // the jab toward the grove (left arm: the free hand), then the flung-up hand with the thump
    k.jab = -jabPulse(f, 76, 22, 2, 6);
    k.throwUp = -throwUpPulse(f, HC_THUMP - 6, 10);
    const th = bambooThump(f, HC_THUMP);
    k.poleLift = th.poleLift;
    k.lean += th.dLean;
    k.bodyY += th.dY;
    k.rS += th.dS;
    // turns away and stomps off (left), the pole carried again
    if (f >= HC_TURN) {
      k.bodyTurn = turnBody(f, HC_TURN, 14, 0.85, -0.85);
      k.poleDrop = clamp(1 - (f - HC_TURN) / 12);
      // carried on the walk-off with its top trailing back, so it never crosses his face
      k.poleTilt = 3 - 17 * clamp((f - HC_TURN) / 12);
    }
    if (f >= HC_TURN + 12) k = { ...k, ...walkAt(hcWalks(pl), f) };
    return k;
  };
};
/** Off-line muttering (no lip sync: a shape that works, as he turns away). */
const hcMouth = (f: number): MouthState => (f > 140 && f < 160 ? shoutMouth(f, 140, 20, 7) : f > 70 && f < 104 ? { open: 0.18 + 0.1 * Math.sin(f * 0.7), width: 1.1, round: 0, teeth: 0.5 } : MOUTH_REST);

/* ---------------- Surendra ---------------- */
const suKeys: PoseKey<Pose>[] = [
  { f: 0, bodyTurn: 0.7, brow: 0.4, browTilt: 0.3, smile: 0.1 },
  { f: 76, in: 22, ease: io, ...GESTURES5.bendToLook, bodyTurn: 0.7 },
  { f: 134, ease: io, lean: 16 },
  { f: 158, in: 20, ease: io, ...GESTURES5.puzzled, lean: 2, crouch: 0, headNod: 0, eyeY: 0.1, rS: 10, rE: -60 },
];
const suWalks = (pl: Place): WalkOpts[] => [{ start: 0, dur: 44, fromX: -320 * pl.scale, toX: 0, scale: pl.scale, height: 1, seed: CAST.surendra.seed, kind: "hurry", bodyTurn: 0.7 }];
const suAct = (pl: Place) => {
  const keys = makeActing<Pose>(BASE_POSE, suKeys);
  return (f: number): Pose => ({ ...keys(f), ...walkAt(suWalks(pl), f) });
};

/* ---------------- Charu ---------------- */
const chKeys: PoseKey<Pose>[] = [
  { f: 0, bodyTurn: 0.8, brow: 0.6, browTilt: 0.6, smile: 0, gasp: 0.15 },
  { f: 70, in: 22, ease: io, kneel: 1, gasp: 0, eyeY: 0.3 },
  { f: 90, in: 16, ease: io, hold: 1 },
  { f: 100, ease: io, holdTurn: 0 },
  { f: 156, in: 52, ease: io, holdTurn: 1, browTilt: 0.2, brow: 0.2 },
  { f: 168, ease: io, cheek: 0 },
  { f: 192, in: 22, ease: io, cheek: 1, headTilt: 8, lid: 0.35, smile: 0.35 },
];
const chWalks = (pl: Place): WalkOpts[] => [{ start: 0, dur: 44, fromX: -300 * pl.scale, toX: 0, scale: pl.scale, height: CAST.charu.height, seed: CAST.charu.seed, kind: "hurry", bodyTurn: 0.8 }];
const chAct = (pl: Place) => {
  const keys = makeActing<Pose>(BASE_POSE, chKeys);
  return (f: number): Pose => ({ ...keys(f), ...walkAt(chWalks(pl), f) });
};
const chSigh = (f: number) => (f > 196 && f < 214 ? 1 : 0);
/** Where the child's hand is (relative to Charu's place, in her scale units). */
const childHand = (pl: Place) => ({ x: pl.x + 92 * pl.scale, y: pl.y - 128 * pl.scale });

/* ---------------- Binoy's mother ---------------- */
const moAct = makeActing<Pose>(BASE_POSE, [
  { f: 0, bodyTurn: -0.5, brow: 0.3, smile: 0.1 },
  { f: 60, in: 16, ease: io, ...GESTURES5.handAtMouth, mouthHand: 1, bodyTurn: -0.5 },
]);

const WALKS: Record<Who, (pl: Place) => WalkOpts[]> = {
  binoy: binoyWalks,
  haricharan: hcWalks,
  surendra: suWalks,
  charu: chWalks,
  mother: () => [],
};

const ACT: Record<Who, (pl: Place) => (f: number) => Pose> = {
  binoy: binoyAct,
  haricharan: hcAct,
  surendra: suAct,
  charu: chAct,
  mother: () => moAct,
};

const label = (f: number, who: Who) => {
  const pick = (list: Array<[number, string]>) => list.filter(([a]) => f >= a).slice(-1)[0]?.[1] ?? "";
  switch (who) {
    case "binoy":
      return pick([[0, "hurry walk in"], [44, "curious head tilt"], [98, "handsOnHead + shoutMouth (silent)"], [160, "scratchHead (left hand)"]]);
    case "haricharan":
      return pick([[0, "run in, bamboo carried"], [48, "stop short, plant the pole"], [74, "jab x2 toward pointAt"], [HC_THUMP - 6, `throwUp + bambooThump (hit ${HC_THUMP + BAMBOO_THUMP.hit})`], [HC_TURN, "turn"], [HC_TURN + 12, "stomp walk-off"]]);
    case "surendra":
      return pick([[0, "hurry walk in"], [54, "bendToLook"], [138, "puzzled"]]);
    case "charu":
      return pick([[0, "hurry walk in (hem lifts)"], [48, "kneel"], [74, "hold the child's hand"], [100, "holdTurn: palm up, then over"], [168, "cheek"], [196, "sigh of relief"]]);
    default:
      return "hand at mouth";
  }
};

const NAMES: Record<Who, string> = {
  binoy: "বিনয় Binoy (CAST.binoy)",
  haricharan: "হরিচরণ Haricharan (CAST.haricharan)",
  surendra: "সুরেন্দ্র Surendra (CAST.surendra)",
  charu: "চারু Charu (CAST.charu)",
  mother: "বিনয়ের মা (CAST.womanA)",
};

const CAST_OF: Record<Who, (typeof CAST)[string]> = {
  binoy: CAST.binoy,
  haricharan: CAST.haricharan,
  surendra: CAST.surendra,
  charu: CAST.charu,
  mother: CAST.womanA,
};

const Dot: React.FC<{ p: { x: number; y: number } | null; r?: number }> = ({ p, r = 4 }) => (p ? <circle cx={p.x} cy={p.y} r={r} fill="#e0242a" opacity={0.85} /> : null);

/** One figure (any scale), with the child's hand stand-in for Charu and the anchor dots. */
const Figure: React.FC<{ who: Who; f: number; pl: Place; dots: boolean }> = ({ who, f, pl, dots }) => {
  const a: { v: PuppetAnchors | null } = { v: null };
  const c = CAST_OF[who];
  const acting = ACT[who](pl);
  const grove = { x: pl.x + 330 * pl.scale, y: pl.y - 260 * pl.scale };
  const ch = childHand(pl);
  return (
    <g>
      {who === "haricharan" && dots && (
        <g>
          <circle cx={grove.x} cy={grove.y} r={14} fill="none" stroke="#3d7a3a" strokeWidth={3} strokeDasharray="5 4" />
          <text x={grove.x} y={grove.y - 22} fontFamily={BN_FONT} fontSize={18} fill="#2d5a2a" textAnchor="middle">
            grove (pointAt)
          </text>
        </g>
      )}
      <Puppet
        cast={c}
        f={f}
        lifeF={f}
        x={pl.x + travelOf(WALKS[who](pl), f)}
        y={pl.y}
        scale={pl.scale}
        acting={acting}
        mouth={who === "binoy" ? binoyMouth : who === "haricharan" ? hcMouth : undefined}
        breathRate={who === "haricharan" ? (f < 60 ? 2.5 : 2.0) : who === "binoy" && f > 100 && f < 160 ? 1.6 : 1}
        sigh={who === "charu" ? chSigh : undefined}
        holdAt={who === "charu" ? () => ch : undefined}
        pointAt={who === "haricharan" ? () => grove : undefined}
        anchors={(v) => {
          a.v = v;
        }}
      />
      {who === "charu" && <ChildHand f={f} at={() => a.v?.hold ?? ch} shoulder={{ x: ch.x + 64 * pl.scale, y: ch.y + 44 * pl.scale }} scale={pl.scale} />}
      {dots && a.v && (
        <g>
          <Dot p={a.v.poleBase} />
          <Dot p={a.v.poleTip} />
          <Dot p={who === "charu" ? a.v.hold : null} r={3} />
        </g>
      )}
      {who === "haricharan" && a.v?.poleBase && f >= HC_THUMP + BAMBOO_THUMP.hit && f < HC_THUMP + BAMBOO_THUMP.hit + 12 && (
        <ellipse cx={a.v.poleBase.x} cy={a.v.poleBase.y} rx={10 + (f - HC_THUMP - BAMBOO_THUMP.hit) * 3} ry={4 + (f - HC_THUMP - BAMBOO_THUMP.hit)} fill="#b89a6a" opacity={0.5 * (1 - (f - HC_THUMP - BAMBOO_THUMP.hit) / 12)} />
      )}
    </g>
  );
};

/**
 * Stand-in for Balak's held hand (the real one is the standing child rig's): a small forearm from the right and a
 * child's hand that turns back, palm up, over again with Charu's holdTurn. Drawn after Charu, so it reads her anchors.
 */
const ChildHand: React.FC<{ f: number; at: () => { x: number; y: number }; shoulder: { x: number; y: number }; scale: number }> = ({ f, at, shoulder, scale }) => {
  const p = at();
  const t = clamp((f - 104) / 52);
  const turn = Math.PI * (1 - Math.sin(Math.PI * t));
  const sh = shoulder;
  const ang = (Math.atan2(p.x - sh.x, p.y - sh.y) * 180) / Math.PI;
  const len = Math.hypot(p.x - sh.x, p.y - sh.y);
  const w = 5.5 * scale;
  return (
    <g>
      <g transform={`translate(${sh.x}, ${sh.y}) rotate(${-ang})`}>
        <path d={`M ${-w} 0 L ${-w * 0.8} ${len} L ${w * 0.8} ${len} L ${w} 0 Z`} fill="#c98a5e" />
        <g transform={`translate(0, ${len})`}>
          <Hand shape="relaxed" L={20 * scale} skin="#c98a5e" shade="#a26a42" side={-1} turn={turn} />
        </g>
      </g>
    </g>
  );
};

const TOP_Y = 640;
const TOP_S = 1.12;
const PANEL_W = 480;
const FACE_S = 2.5;

export const Cast05QA: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const top: Who[] = ["binoy", "haricharan", "surendra", "charu"];
  const faces: Who[] = ["binoy", "haricharan", "surendra", "charu", "mother"];
  const FACE_W = 1920 / faces.length;
  return (
    <AbsoluteFill style={{ backgroundColor: "#d8cfbf" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          {top.map((w, i) => (
            <clipPath key={w} id={`c5top${i}`}>
              <rect x={i * PANEL_W} y={0} width={PANEL_W} height={700} />
            </clipPath>
          ))}
          {faces.map((w, i) => (
            <clipPath key={w} id={`c5face${i}`}>
              <rect x={i * FACE_W + 4} y={706} width={FACE_W - 8} height={370} rx={10} />
            </clipPath>
          ))}
        </defs>
        {top.map((w, i) => {
          const pl = { x: i * PANEL_W + (w === "haricharan" ? 200 : 230), y: TOP_Y, scale: TOP_S };
          return (
            <g key={w}>
              <rect x={i * PANEL_W} y={0} width={PANEL_W} height={700} fill={i % 2 ? "#e2d9c8" : "#ddd3c1"} />
              <rect x={i * PANEL_W} y={TOP_Y} width={PANEL_W} height={60} fill="#c4b393" />
              <g clipPath={`url(#c5top${i})`}>
                <Figure who={w} f={f} pl={pl} dots />
              </g>
              <text x={i * PANEL_W + 16} y={34} fontFamily={BN_FONT} fontSize={24} fontWeight={700} fill="#3a2a1c">
                {NAMES[w]}
              </text>
              <text x={i * PANEL_W + 16} y={62} fontFamily={BN_FONT} fontSize={19} fill="#5a4630">
                {label(f, w)}
              </text>
            </g>
          );
        })}
        <rect x={0} y={700} width={1920} height={380} fill="#b9ad98" />
        {faces.map((w, i) => {
          // the close row: the same action, framed on the head and shoulders
          const h = CAST_OF[w].height;
          const cx = i * FACE_W + FACE_W / 2;
          const kneel = w === "charu" && f > 50;
          const pl = { x: cx - (w === "haricharan" ? 10 : 30), y: 706 + (kneel ? 560 : w === "surendra" ? 900 : 860) * h * (FACE_S / 2.5), scale: FACE_S };
          return (
            <g key={w}>
              <rect x={i * FACE_W + 4} y={706} width={FACE_W - 8} height={370} rx={10} fill="#efe7d8" />
              <g clipPath={`url(#c5face${i})`}>
                <Figure who={w} f={w === "charu" || w === "mother" ? f : Math.max(f, 47)} pl={pl} dots={false} />
              </g>
              <text x={i * FACE_W + 16} y={1064} fontFamily={BN_FONT} fontSize={18} fill="#3a2a1c">
                {NAMES[w].split(" (")[0]}
              </text>
            </g>
          );
        })}
        <text x={1904} y={1064} fontFamily={BN_FONT} fontSize={16} fill="#3a2a1c" textAnchor="end">
          f {f}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
