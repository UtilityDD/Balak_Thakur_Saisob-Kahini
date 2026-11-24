import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { Hand } from "../../cinematic/rig/Hand";
import { BirulGlow } from "../../episode03/rig/BirulGlow";
import { EP06_CHILD_SCALE } from "../../cinematic/rig/cast";
import { StandingChild } from "../../episode05/rig/StandingChild";
import {
  HAND_ON_HEAD_T,
  SeatedChild,
  TAKE_BALL_AT,
  TAKE_BALL_T,
  TAKE_NOTE_AT,
  TAKE_NOTE_T,
  TREASURER_STEPS,
  TREASURER_T,
  TREASURY_CLOTH,
  seatedEp6Anchors,
  treasurerAt,
  type SeatedChildProps,
  type SeatedPose,
} from "../../episode03/rig/SeatedChild";

/**
 * SeatedChild6QA (Episode 6, 240 f): the four new seated poses of Balak (SeatedChild, plate design, age 6), each large in
 * its own panel, animated with stand-in props placed from seatedEp6Anchors():
 *   A takeBall    a playmate's hand presents the stitched ball, Balak's hands come up under it, he draws it to his lap.
 *   B treasurer   the near hand sorts the boys' things on the spread gamchha into heaps; the far hand on its knee.
 *   C takeNote    the friend presses the folded note into his hands; he looks at it, troubled; folds his hands round it.
 *   D handOnHead  the hand claps to his head, then both palms open, empty (twice, with a rest between).
 * Stand-ins only: the real ball, note, items and boys come from the props and cast files.
 */

const INK = "#3b2a1a";
const S = 1.75;
const GIVER = { skin: "#b07049", shade: "#8a5232" };

const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const Label: React.FC<{ x: number; y: number; t: string; size?: number; w?: number }> = ({ x, y, t, size = 20, w = 600 }) => (
  <text x={x} y={y} fontSize={size} fill={INK} fontFamily={BN_FONT} fontWeight={w}>
    {t}
  </text>
);

/** A panel's ground: a soft earth band under the seat line. */
const Ground: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => (
  <rect x={x} y={y} width={w} height={h} fill="#c9a874" opacity={0.6} />
);

/** Stand-in stitched ball: worn cloth-and-rubber with a crude zigzag seam of thick thread. */
const BallArt: React.FC<{ x: number; y: number; r: number; rot: number }> = ({ x, y, r, rot }) => {
  const zig = Array.from({ length: 9 }, (_, i) => {
    const a = -0.9 + (1.8 * i) / 8;
    const rr = r * (i % 2 ? 0.78 : 0.62);
    return `${(Math.sin(a) * rr).toFixed(2)} ${(-Math.cos(a) * rr * 0.35 + r * 0.05).toFixed(2)}`;
  });
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)})`}>
      <circle r={r} fill="#a8916a" />
      <circle cx={-r * 0.12} cy={-r * 0.12} r={r * 0.88} fill="#d9c8a2" />
      <ellipse cx={-r * 0.35} cy={-r * 0.4} rx={r * 0.35} ry={r * 0.22} fill="#f6eedb" opacity={0.6} />
      <path d={`M${-r * 0.95} ${r * 0.1} Q0 ${r * 0.55} ${r * 0.95} ${r * 0.1}`} fill="none" stroke="#7d6a4a" strokeWidth={r * 0.08} />
      <path d={`M${zig.join(" L")}`} fill="none" stroke="#5a3b22" strokeWidth={r * 0.11} strokeLinejoin="round" />
    </g>
  );
};

/** Stand-in folded note: pale blue-grey paper with a printed border and "১০". */
const NoteArt: React.FC<{ x: number; y: number; w: number; h: number; rot: number; fold: number }> = ({ x, y, w, h, rot, fold }) => {
  const k = 1 - 0.25 * fold;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${k.toFixed(3)})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={1.2} fill="#a9bcc6" />
      <rect x={-w / 2 + 1.6} y={-h / 2 + 1.6} width={w - 3.2} height={h - 3.2} rx={0.8} fill="none" stroke="#5f7d8c" strokeWidth={0.9} />
      <line x1={-w / 2} y1={h * 0.05} x2={w / 2} y2={h * 0.05} stroke="#8aa1ad" strokeWidth={0.7} />
      <text x={w * 0.2} y={h * 0.32} fontSize={h * 0.62} fill="#3d5866" fontFamily={BN_FONT} fontWeight={700} textAnchor="middle">
        ১০
      </text>
    </g>
  );
};

/** Small treasury items (world size at S): marble, coin, top, marble. */
const ITEM_KIND = ["marble", "coin", "top", "marbleB"] as const;
const ItemArt: React.FC<{ x: number; y: number; k: (typeof ITEM_KIND)[number]; s: number }> = ({ x, y, k, s }) => {
  if (k === "coin")
    return (
      <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s})`}>
        <ellipse rx={3.6} ry={1.8} fill="#a8603a" />
        <ellipse cy={-0.4} rx={3.2} ry={1.4} fill="#c98454" />
      </g>
    );
  if (k === "top")
    return (
      <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s})`}>
        <path d="M-4 -3 Q0 -6 4 -3 L0.6 3.6 L-0.6 3.6 Z" fill="#b5652e" />
        <path d="M-4 -3 Q0 -1.5 4 -3" fill="none" stroke="#7a3d17" strokeWidth={0.8} />
        <line x1={0} y1={-5} x2={0} y2={-7} stroke="#6b4a2a" strokeWidth={1} />
      </g>
    );
  const col = k === "marble" ? "#5a8fc4" : "#4fa56e";
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s})`}>
      <circle r={2.7} fill={col} />
      <circle cx={-0.8} cy={-0.9} r={0.9} fill="#ffffff" opacity={0.7} />
    </g>
  );
};

/** A giver's hand (shared Hand, MOT-19) with its forearm coming in from the right edge. */
const GiverHand: React.FC<{ wx: number; wy: number; dir: { x: number; y: number }; turn: number; shape: "hold" | "open" | "relaxed" | "cup"; L: number }> = ({
  wx,
  wy,
  dir,
  turn,
  shape,
  L,
}) => {
  const rot = (Math.atan2(-dir.x, dir.y) * 180) / Math.PI;
  return (
    <g>
      <path d={`M${wx.toFixed(2)} ${wy.toFixed(2)} L${(wx - dir.x * 120).toFixed(2)} ${(wy - dir.y * 120).toFixed(2)}`} stroke={GIVER.shade} strokeWidth={L * 0.34} strokeLinecap="round" />
      <path d={`M${wx.toFixed(2)} ${wy.toFixed(2)} L${(wx - dir.x * 120).toFixed(2)} ${(wy - dir.y * 120).toFixed(2)}`} stroke={GIVER.skin} strokeWidth={L * 0.3} strokeLinecap="round" />
      <g transform={`translate(${wx.toFixed(2)} ${wy.toFixed(2)}) rotate(${rot.toFixed(2)})`}>
        <Hand shape={shape} L={L} skin={GIVER.skin} shade={GIVER.shade} side={-1} turn={turn} />
      </g>
    </g>
  );
};

/** Gamchha cloth: red-and-white checks on a perspective quad (world points). */
const Cloth: React.FC<{ pts: Array<{ x: number; y: number }>; id: string }> = ({ pts, id }) => {
  const d = `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")} Z`;
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill="#efe3cf" transform="translate(2 3)" opacity={0.35} />
      <path d={d} fill="#f3eadb" />
      <g clipPath={`url(#${id})`} opacity={0.55}>
        {Array.from({ length: 14 }, (_, i) => (
          <line key={`v${i}`} x1={minX + i * 12} y1={minY} x2={minX + i * 12 - 6} y2={maxY} stroke="#c0392b" strokeWidth={3.5} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`h${i}`} x1={minX} y1={minY + 2 + i * 7.5} x2={maxX} y2={minY + 2 + i * 7.5} stroke="#c0392b" strokeWidth={2.4} />
        ))}
      </g>
      <path d={d} fill="none" stroke="#a93226" strokeWidth={1.5} opacity={0.6} />
    </g>
  );
};

/**
 * BAL-26d colour and face match (render with --props='{"sheet":"healthy"}'): StandingChild build="healthy" beside
 * SeatedChild build="healthy" (both plate age 6, Episode 6 relative scales x 2.6), and the classic seated plate colours
 * for reference. No glow, so the skin and cloth colours compare cleanly.
 */
const HealthyMatch: React.FC<{ f: number }> = ({ f }) => {
  const K = 2.6;
  const G = 930;
  const st = EP06_CHILD_SCALE.standingBalak;
  const ss = EP06_CHILD_SCALE.seatedBalak.s;
  return (
    <AbsoluteFill style={{ backgroundColor: "#ead9b8" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <rect x={0} y={G - 10} width={1920} height={1080 - G + 10} fill="#c9a874" opacity={0.6} />
        <StandingChild x={430} y={G} s={st.s * K} headScale={st.headScale} f={f} lifeF={f} pose="standQuiet" build="healthy" />
        <SeatedChild x={1000} y={G} s={ss * K} f={f} lifeF={f} design="plate" age={6} pose="sitCross" build="healthy" />
        <SeatedChild x={1540} y={G} s={ss * K} f={f} lifeF={f + 37} design="plate" age={6} pose="sitCross" />
        <Label x={250} y={50} t="StandingChild build=healthy" />
        <Label x={820} y={50} t="SeatedChild build=healthy" />
        <Label x={1350} y={50} t="SeatedChild classic (reference)" />
        <Label x={18} y={1066} t="BAL-26d: seated and standing Balak in the healthy palette (PLATE_COLORS_HEALTHY) and the vivid face" size={16} w={500} />
      </svg>
    </AbsoluteFill>
  );
};

export const SeatedChild6QA: React.FC<{ sheet?: "poses" | "healthy" }> = ({ sheet = "poses" }) => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  if (sheet === "healthy") return <HealthyMatch f={f} />;
  const lifeF = f;

  const base = (x: number, y: number): Pick<SeatedChildProps, "x" | "y" | "s" | "f" | "lifeF" | "design" | "age"> => ({
    x,
    y,
    s: S,
    f,
    lifeF,
    design: "plate",
    age: 6,
  });
  /** World point of a figure-unit point for a rig at (x, y). */
  const Wp = (x: number, y: number, p: { x: number; y: number }) => ({ x: x + S * p.x, y: y + S * p.y });

  /* ---------------- A: takeBall ---------------- */
  const AX = 330;
  const AY = 480;
  const A0 = 24; // poseStart
  const aPose: SeatedPose = f < A0 ? "sitCross" : "takeBall";
  const aProps: SeatedChildProps = { ...base(AX, AY), pose: aPose, poseStart: A0, prevPose: f >= A0 ? "sitCross" : undefined, prevPoseStart: 0 };
  const aAnc = seatedEp6Anchors(aProps);
  const giveA = Wp(AX, AY, TAKE_BALL_AT);
  // The giver's hand holds the ball from above-right, comes in (0 to A0 + 6), lets go at take, withdraws.
  const tA = f - A0;
  const inA = sstep(-24, 6, tA);
  const outA = sstep(TAKE_BALL_T.take, TAKE_BALL_T.take + 14, tA);
  const giverA = {
    wx: giveA.x + 8 * S + 160 * (1 - inA) + 90 * outA,
    wy: giveA.y - 22 * S - 40 * outA,
  };
  const ballA = aAnc.ball ?? { x: giveA.x + 160 * (1 - inA), y: giveA.y, r: 11.5 * S, inHands: false };
  const ballRot = aAnc.ball?.inHands ? 20 * sstep(TAKE_BALL_T.take, TAKE_BALL_T.lap, tA) : 0;
  const ballLift = f < A0 ? { x: 160 * (1 - inA), y: 0 } : { x: 0, y: 0 };
  const aPhase =
    tA < 0 ? "sitCross, the ball comes in" : tA < TAKE_BALL_T.reach ? "hands come up under it" : tA < TAKE_BALL_T.take ? "receives (giver lets go at take)" : tA < TAKE_BALL_T.lap ? "draws it to his lap, delighted" : "keeps it in his lap";

  /* ---------------- B: treasurer ---------------- */
  const BX = 960 + 250;
  const BY = 470;
  const B0 = 14;
  const bPose: SeatedPose = f < B0 ? "sitCross" : "treasurer";
  const bProps: SeatedChildProps = { ...base(BX, BY), pose: bPose, poseStart: B0, prevPose: f >= B0 ? "sitCross" : undefined, prevPoseStart: 0 };
  const bAnc = seatedEp6Anchors(bProps);
  const tB = f - B0;
  const stB = treasurerAt(tB);
  const clothW = TREASURY_CLOTH.map((p) => Wp(BX, BY, p));
  const bPhase = tB < 0 ? "sitCross" : stB.picked >= TREASURER_STEPS.length && !stB.carrying && tB > TREASURER_STEPS.length * TREASURER_T.cycle ? "done: hand back to rest" : stB.carrying ? `carrying item ${stB.step + 1}` : `step ${stB.step + 1}: reach / set down`;

  /* ---------------- C: takeNote ---------------- */
  const CX = 330;
  const CY = 1020;
  const C0 = 24;
  const C_FOLD = C0 + 150;
  const cPose: SeatedPose = f < C0 ? "sitCross" : "takeNote";
  const cProps: SeatedChildProps = {
    ...base(CX, CY),
    pose: cPose,
    poseStart: C0,
    prevPose: f >= C0 ? "sitCross" : undefined,
    prevPoseStart: 0,
    foldAt: C_FOLD,
    // P2: from the note he looks off toward the village (lookX) and back, then folds his hands round it.
    watchHeld: 1 - sstep(C0 + 70, C0 + 82, f) * (1 - sstep(C0 + 104, C0 + 116, f)),
    face: { lookX: -0.8 * sstep(C0 + 70, C0 + 82, f) * (1 - sstep(C0 + 104, C0 + 116, f)) },
  };
  const cAnc = seatedEp6Anchors(cProps);
  const giveC = Wp(CX, CY, TAKE_NOTE_AT);
  const tC = f - C0;
  const inC = sstep(-24, 6, tC);
  const outC = sstep(TAKE_NOTE_T.take, TAKE_NOTE_T.take + 14, tC);
  const noteC = cAnc.note ?? { x: giveC.x + 160 * (1 - inC), y: giveC.y, rot: 0, w: 13 * S, h: 7.5 * S, inHands: false, fold: 0 };
  const giverC = { wx: giveC.x + 3 * S + 160 * (1 - inC) + 90 * outC, wy: giveC.y - 14 * S - 30 * outC };
  const cPhase =
    tC < 0
      ? "sitCross"
      : tC < TAKE_NOTE_T.take
        ? "palms up, the note pressed in"
        : tC < TAKE_NOTE_T.chest
          ? "draws it to his chest"
          : f < C0 + 70
            ? "looks at it, troubled (gentle brows)"
            : f < C0 + 116
              ? "looks to the village and back (watchHeld 0, face.lookX)"
              : f < C_FOLD
                ? "back to the note, thinking"
                : "folds his hands round it, decided (nod)";

  /* ---------------- D: handOnHead ---------------- */
  const DX = 960 + 330;
  const DY = 1020;
  const D1 = 30;
  const DR = 110;
  const D2 = 150;
  let dPose: SeatedPose = "sitCross";
  let dStart = 0;
  let dPrev: SeatedPose | undefined;
  let dPrevStart = 0;
  if (f >= D2) {
    dPose = "handOnHead";
    dStart = D2;
    dPrev = "sitCross";
    dPrevStart = DR;
  } else if (f >= DR) {
    dPose = "sitCross";
    dStart = DR;
    dPrev = "handOnHead";
    dPrevStart = D1;
  } else if (f >= D1) {
    dPose = "handOnHead";
    dStart = D1;
    dPrev = "sitCross";
  }
  const dProps: SeatedChildProps = { ...base(DX, DY), pose: dPose, poseStart: dStart, prevPose: dPrev, prevPoseStart: dPrevStart };
  const dAnc = seatedEp6Anchors(dProps);
  const tD = dPose === "handOnHead" ? f - dStart : -1;
  const dPhase =
    tD < 0 ? "sitCross (rest)" : tD < HAND_ON_HEAD_T.up ? "claps a hand to his head" : tD < HAND_ON_HEAD_T.off ? "palm on the hair" : tD < HAND_ON_HEAD_T.open ? "both palms open" : "palms open, empty, held out";

  const glow = 0.6;

  return (
    <AbsoluteFill style={{ backgroundColor: "#ead9b8" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <line x1={960} y1={0} x2={960} y2={1080} stroke="#b59a6e" strokeWidth={2} />
        <line x1={0} y1={540} x2={1920} y2={540} stroke="#b59a6e" strokeWidth={2} />

        {/* A: takeBall */}
        <defs>
          <clipPath id="sc6-a">
            <rect x={0} y={0} width={960} height={540} />
          </clipPath>
          <clipPath id="sc6-b">
            <rect x={960} y={0} width={960} height={540} />
          </clipPath>
          <clipPath id="sc6-c">
            <rect x={0} y={540} width={960} height={540} />
          </clipPath>
          <clipPath id="sc6-d">
            <rect x={960} y={540} width={960} height={540} />
          </clipPath>
        </defs>
        <g clipPath="url(#sc6-a)">
          <Ground x={0} y={AY - 20} w={960} h={80} />
          <BirulGlow cx={aAnc.glowAnchor.cx} cy={aAnc.glowAnchor.cy} r={aAnc.glowAnchor.r} glow={glow} f={lifeF} />
          <SeatedChild
            {...aProps}
            propInHands={<BallArt x={ballA.x + ballLift.x} y={ballA.y} r={ballA.r} rot={ballRot} />}
          />
          {outA < 1 && (
            <GiverHand wx={giverA.wx} wy={giverA.wy} dir={{ x: -0.42, y: 0.91 }} turn={Math.PI - 0.3} shape={outA > 0.3 ? "open" : "cup"} L={27 * 1.15 * S} />
          )}
        </g>
        <Label x={18} y={34} t="A  takeBall: receive the stitched ball, draw it to the lap" />
        <Label x={18} y={500} t={`t = ${tA}  ${aPhase}`} size={16} w={500} />
        <Label x={18} y={522} t={`ball ${aAnc.ball ? (aAnc.ball.inHands ? "in his hands" : "giver's") : "-"}  palms (${aAnc.nearPalm.x.toFixed(0)}, ${aAnc.nearPalm.y.toFixed(0)}) (${aAnc.farPalm.x.toFixed(0)}, ${aAnc.farPalm.y.toFixed(0)})`} size={14} w={400} />

        {/* B: treasurer */}
        <g clipPath="url(#sc6-b)">
          <Ground x={960} y={BY - 20} w={960} h={80} />
          <Cloth pts={clothW} id="sc6-cloth" />
          {TREASURER_STEPS.map((st, i) => {
            const k = ITEM_KIND[i % ITEM_KIND.length];
            if (i < stB.placed) {
              const p = Wp(BX, BY, st.to);
              // items laid on the same heap sit a little apart
              const same = TREASURER_STEPS.slice(0, i).filter((q) => q.to.x === st.to.x && q.to.y === st.to.y).length;
              return <ItemArt key={i} x={p.x + same * 6} y={p.y - 2 * S - same * 2} k={k} s={S} />;
            }
            if (i >= stB.picked) {
              const p = Wp(BX, BY, st.from);
              return <ItemArt key={i} x={p.x} y={p.y - 2 * S} k={k} s={S} />;
            }
            return null;
          })}
          <BirulGlow cx={bAnc.glowAnchor.cx} cy={bAnc.glowAnchor.cy} r={bAnc.glowAnchor.r} glow={glow} f={lifeF} />
          <SeatedChild {...bProps} />
          {stB.carrying && <ItemArt x={bAnc.nearPinch.x} y={bAnc.nearPinch.y} k={ITEM_KIND[stB.step % ITEM_KIND.length]} s={S} />}
        </g>
        <Label x={978} y={34} t="B  treasurer: sorting the boys' things on the gamchha" />
        <Label x={978} y={505} t={`t = ${tB}  ${bPhase}  (picked ${stB.picked}, placed ${stB.placed})`} size={16} w={500} />

        {/* C: takeNote */}
        <g clipPath="url(#sc6-c)">
          <Ground x={0} y={CY - 20} w={960} h={80} />
          <BirulGlow cx={cAnc.glowAnchor.cx} cy={cAnc.glowAnchor.cy} r={cAnc.glowAnchor.r} glow={glow} f={lifeF} />
          <SeatedChild {...cProps} propInHands={<NoteArt x={noteC.x} y={noteC.y} w={noteC.w} h={noteC.h} rot={noteC.rot} fold={noteC.fold} />} />
          {outC < 1 && (
            <GiverHand wx={giverC.wx} wy={giverC.wy} dir={{ x: -0.7, y: 0.71 }} turn={-1.7 + 1.0 * outC} shape={outC > 0.3 ? "open" : "hold"} L={27 * 1.15 * S} />
          )}
        </g>
        <Label x={18} y={574} t="C  takeNote: the folded note; troubled, then decided" />
        <Label x={18} y={1040} t={`t = ${tC}  ${cPhase}`} size={16} w={500} />
        <Label x={18} y={1062} t={`note ${cAnc.note ? `(${cAnc.note.x.toFixed(0)}, ${cAnc.note.y.toFixed(0)}) rot ${cAnc.note.rot.toFixed(1)} fold ${cAnc.note.fold.toFixed(2)}` : "-"}`} size={14} w={400} />

        {/* D: handOnHead */}
        <g clipPath="url(#sc6-d)">
          <Ground x={960} y={DY - 20} w={960} h={80} />
          <BirulGlow cx={dAnc.glowAnchor.cx} cy={dAnc.glowAnchor.cy} r={dAnc.glowAnchor.r} glow={glow} f={lifeF} />
          <SeatedChild {...dProps} />
        </g>
        <Label x={978} y={574} t="D  handOnHead: “ওটা কি এখনও আছে নাকি?”" />
        <Label x={978} y={1045} t={`t = ${tD}  ${dPhase}`} size={16} w={500} />
      </svg>
    </AbsoluteFill>
  );
};
