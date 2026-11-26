import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { clamp, lerp } from "../../cinematic/core/anim";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { Hand } from "../../cinematic/rig/Hand";
import { headNods, type Pose, type PuppetAnchors } from "../../cinematic/rig/Puppet";
import { seatedEp6Anchors } from "../../episode03/rig/SeatedChild";
import { standingChildJoints } from "../../episode05/rig/StandingChild";
import { GhibliCharFilterDefs } from "../GhibliStage";
import {
  EP05R_CAST,
  EP05R_GESTURES,
  EP05R_LIGHT,
  EP05R_LOOKS,
  EP05R_SCALE,
  Ep05Haricharan,
  Ep05Person,
  Ep05SeatedBalak,
  Ep05StandingBalak,
  ep05SeatedProps,
  ep05StandingProps,
} from "./Ep05RewriteCast";
import {
  EP05_TORTOISE_TOP,
  Ep05BambooPole,
  Ep05ClerkDesk,
  Ep05Cow,
  Ep05Cucumber,
  Ep05CucumberVine,
  Ep05Inkpot,
  Ep05Ledger,
  Ep05LedgerStack,
  Ep05MangoLeaf,
  Ep05Mat,
  Ep05MatCutout,
  Ep05PalmFan,
  Ep05ReedPen,
  Ep05Tortoise,
  GhibliTippedBasket,
  PebblesArt,
  ep05LedgerPenPoint,
  ep05PenGripFor,
  ep05TortoiseAtJaw,
  ep05TortoiseJawRest,
  ep05VineAnchors,
  makePalmFanInHand,
} from "./Ep05RewriteProps";
import { ep05GlowBeat } from "./Ep05BalakDivine";

/**
 * Ep05RewriteCastQA (240 f): the Episode 5 rewrite's cast and props on watercolour paper.
 *   frames   0-119  PAGE 1, the cast lineup at true relative heights (K = 1.2), each labelled (chip, age, height at
 *                   K = 1); dashed lines at Balak's crown (standing and seated). Haricharan lifts the bamboo from
 *                   upright (one hand) into a two-hand hold across his body; the clerks hold the reed pen and fan.
 *   frames 120-239  PAGE 2, every prop in each state, animated: tortoises (side / top, turned over and paddling,
 *                   biting a hand, hanging from a hand and letting go), the cow (cud chewing, then the nuzzle), the
 *                   cucumber machan whole and collapsing, the bamboo, cucumbers, leaf, ledgers, inkpot, pen, fan,
 *                   clerks at work on the mat, mats, basket, pebbles.
 * Good stills: 60 (cast, two-hand pole), 100, 150, 200, 232.
 */

const INK = "#3A2618";
const PAPER = "#efe3cc";
const K = 1.2;
const GROUND = 905;

const Label: React.FC<{ x: number; y: number; chip: string; name: string; sub: string }> = ({ x, y, chip, name, sub }) => (
  <g>
    <text x={x} y={y} textAnchor="middle" fontFamily={BN_FONT} fontSize={30} fontWeight={700} fill="#5a3418">
      {chip}
    </text>
    <text x={x} y={y + 28} textAnchor="middle" fontFamily="Georgia, serif" fontSize={17} fill={INK}>
      {name}
    </text>
    <text x={x} y={y + 50} textAnchor="middle" fontFamily="Georgia, serif" fontSize={14} fill="#6a5040">
      {sub}
    </text>
  </g>
);

/** Reads its y lazily (at its own render, after the figures before it have reported their anchors). */
const Tick: React.FC<{ x: number; y: number | (() => number); text: string | (() => string) }> = ({ x, y: yIn, text: tIn }) => {
  const y = typeof yIn === "function" ? yIn() : yIn;
  const text = typeof tIn === "function" ? tIn() : tIn;
  return (
  <g>
    <path d={`M ${x - 46} ${y} L ${x + 46} ${y}`} stroke="#8a3a22" strokeWidth={1.4} strokeDasharray="5 4" opacity={0.75} />
    <text x={x + 48} y={y + 4} fontFamily="Georgia, serif" fontSize={12} fill="#8a3a22">
      {text}
    </text>
  </g>
  );
};

/* --------------------------------------------------------------------------------------------------------------- */
/* PAGE 1: cast lineup                                                                                             */
/* --------------------------------------------------------------------------------------------------------------- */

const CastPage: React.FC<{ f: number }> = ({ f }) => {
  const caps: Record<string, PuppetAnchors | null> = {};
  const cap = (id: string) => (a: PuppetAnchors) => {
    caps[id] = a;
  };
  /** top of the hair from the head centre (the Puppet head radius is 41 sqrt(h) for adults, a little hair above) */
  const topOf = (id: string, h: number) => (caps[id] ? caps[id]!.head.y - 1.1 * 41 * Math.sqrt(h) * K : GROUND);
  const hK1 = (top: number) => Math.round((GROUND - top) / K);

  const X = { balS: 150, balC: 330, binoy: 525, charu: 720, suren: 915, hari: 1130, senior: 1385, junior: 1595, mother: 1800 };

  // Balak standing and seated (BAL-26f, age 6)
  const stand = ep05StandingProps({ x: X.balS, y: GROUND, s: EP05R_SCALE.standingBalak.s * K, f, lifeF: f, pose: "standQuiet", expression: "serene", yaw: 0.25 });
  const sj = standingChildJoints(stand);
  const seat = ep05SeatedProps({ x: X.balC, y: GROUND, s: EP05R_SCALE.seatedBalak.s * K, f, lifeF: f, pose: "sitCross", expression: "serene" });
  const sa = seatedEp6Anchors(seat);

  // Haricharan: the pole upright in one fist (0-40); the second hand closes on it (40-56); he lifts it and carries it
  // slanting forward in both hands (72-100), held
  const across = clamp((f - 72) / 28);
  const hariAct = (fr: number): Partial<Pose> => {
    const a = clamp((fr - 72) / 28);
    const e = a * a * (3 - 2 * a);
    return {
      ...EP05R_GESTURES.haricharanAngry,
      rProp: "bamboo",
      rHand: "hold",
      bodyTurn: 0.28,
      poleDrop: 1 - e,
      poleTilt: lerp(3, EP05R_GESTURES.haricharanPoleAcross.poleTilt ?? 20, e),
      rS: lerp(6, EP05R_GESTURES.haricharanPoleAcross.rS ?? -6, e),
      rE: lerp(-8, EP05R_GESTURES.haricharanPoleAcross.rE ?? 46, e),
    };
  };
  const twoHand = (fr: number) => clamp((fr - 40) / 16);

  const people = (
    <>
      <Ep05Person cast={EP05R_CAST.binoy} x={X.binoy} y={GROUND} scale={K} f={f} lifeF={f} light={EP05R_LIGHT.lateMorning} acting={() => ({ bodyTurn: 0.2, headTilt: 5, smile: 0.3 })} anchors={cap("binoy")} />
      <Ep05Person cast={EP05R_CAST.charu} x={X.charu} y={GROUND} scale={K} f={f} lifeF={f} light={EP05R_LIGHT.lateMorning} softSleeves acting={() => ({ bodyTurn: 0.15, smile: 0.4 })} anchors={cap("charu")} />
      <Ep05Person cast={EP05R_CAST.surendra} x={X.suren} y={GROUND} scale={K} f={f} lifeF={f} light={EP05R_LIGHT.lateMorning} acting={() => ({ bodyTurn: 0.12, smile: 0.35 })} anchors={cap("surendra")} />
      <Ep05Haricharan x={X.hari} y={GROUND} scale={K} f={f} lifeF={f} light={EP05R_LIGHT.afternoon} acting={hariAct} twoHand={twoHand} showGrip breathRate={1.6} anchors={cap("haricharan")} />
      <Ep05Person
        cast={EP05R_CAST.seniorClerk}
        x={X.senior}
        y={GROUND}
        scale={K}
        f={f}
        lifeF={f}
        light={EP05R_LIGHT.lateAfternoon}
        acting={(fr) => ({ bodyTurn: -0.2, rProp: "reedPen", rHand: "hold", rS: 18, rE: 72, headNod: headNods(fr, 70, 2, 14, 4), eyeY: -0.3, brow: 0.3, smile: 0.1 })}
        anchors={cap("senior")}
      />
      <Ep05Person
        cast={EP05R_CAST.juniorClerk}
        x={X.junior}
        y={GROUND}
        scale={K}
        f={f}
        lifeF={f}
        light={EP05R_LIGHT.lateAfternoon}
        acting={() => ({ ...EP05R_GESTURES.juniorClerkFan, bodyTurn: -0.18 })}
        anchors={cap("junior")}
      />
      <Ep05Person cast={EP05R_CAST.binoyMother} x={X.mother} y={GROUND} scale={K} f={f} lifeF={f} light={EP05R_LIGHT.lateMorning} softSleeves acting={() => ({ bodyTurn: -0.2, smile: 0.3 })} anchors={cap("mother")} />
    </>
  );

  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <GhibliCharFilterDefs f={f} rimDir={-1} sunColor="#ffe2a6" />
      <text x={40} y={58} fontFamily="Georgia, serif" fontSize={30} fill={INK}>
        Episode 5 rewrite: cast lineup at true relative heights (adult scale K = {K})
      </text>
      <text x={40} y={86} fontFamily="Georgia, serif" fontSize={16} fill="#6a5040">
        Size order (CHR-09): Balak (six) &lt; Binoy (14-15) &lt; the adults. Heights in px at K = 1, ground to the top of the hair. Balak: BAL-26f look (ep05BalakLook.ts).
      </text>
      <path d={`M 30 ${GROUND} L 1890 ${GROUND}`} stroke="#8a6a4a" strokeWidth={1.2} opacity={0.5} />
      {/* Balak's crowns: standing and seated */}
      <path d={`M 40 ${sj.headTop.y} L 1890 ${sj.headTop.y}`} stroke="#c08a2a" strokeWidth={1} strokeDasharray="8 6" opacity={0.55} />
      <path d={`M 40 ${sa.headTop.y} L 1890 ${sa.headTop.y}`} stroke="#c08a2a" strokeWidth={1} strokeDasharray="2 6" opacity={0.55} />
      <text x={40} y={sj.headTop.y - 6} fontFamily="Georgia, serif" fontSize={12} fill="#a0701e">
        Balak standing crown
      </text>
      <text x={40} y={sa.headTop.y - 6} fontFamily="Georgia, serif" fontSize={12} fill="#a0701e">
        Balak seated crown
      </text>

      <Ep05StandingBalak {...stand} zoom={1} />
      <Ep05SeatedBalak {...seat} zoom={1} glowK={ep05GlowBeat(f, 30, 30, 40, 30)} />
      {people}

      {/* measured tops (drawn after the figures: their anchors are captured in this same render) */}
      <Tick x={X.balS} y={sj.headTop.y} text={`${hK1(sj.headTop.y)}`} />
      <Tick x={X.balC} y={sa.headTop.y} text={`${hK1(sa.headTop.y)} seated`} />
      <Tick x={X.binoy} y={() => topOf("binoy", EP05R_CAST.binoy.height)} text={() => `${hK1(topOf("binoy", EP05R_CAST.binoy.height))}`} />
      <Tick x={X.charu} y={() => topOf("charu", EP05R_CAST.charu.height)} text={() => `${hK1(topOf("charu", EP05R_CAST.charu.height))}`} />
      <Tick x={X.suren} y={() => topOf("surendra", EP05R_CAST.surendra.height)} text={() => `${hK1(topOf("surendra", EP05R_CAST.surendra.height))}`} />
      <Tick x={X.hari} y={() => topOf("haricharan", EP05R_CAST.haricharan.height)} text={() => `${hK1(topOf("haricharan", EP05R_CAST.haricharan.height))}`} />
      <Tick x={X.senior} y={() => topOf("senior", EP05R_CAST.seniorClerk.height)} text={() => `${hK1(topOf("senior", EP05R_CAST.seniorClerk.height))}`} />
      <Tick x={X.junior} y={() => topOf("junior", EP05R_CAST.juniorClerk.height)} text={() => `${hK1(topOf("junior", EP05R_CAST.juniorClerk.height))}`} />
      <Tick x={X.mother} y={() => topOf("mother", EP05R_CAST.binoyMother.height)} text={() => `${hK1(topOf("mother", EP05R_CAST.binoyMother.height))}`} />

      <Label x={X.balS} y={GROUND + 40} chip={EP05R_LOOKS.balak.chip} name="Balak (standing)" sub="about 6 · healthy, ref2" />
      <Label x={X.balC} y={GROUND + 40} chip={EP05R_LOOKS.balak.chip} name="Balak (seated)" sub="cross-legged · glow beat demo" />
      <Label x={X.binoy} y={GROUND + 40} chip={EP05R_LOOKS.binoy.chip} name="Binoy" sub="14-15 · jute bag" />
      <Label x={X.charu} y={GROUND + 40} chip={EP05R_LOOKS.charu.chip} name="Charu" sub="mid 20s" />
      <Label x={X.suren} y={GROUND + 40} chip={EP05R_LOOKS.surendra.chip} name="Surendra" sub="early 30s" />
      <Label x={X.hari} y={GROUND + 40} chip={EP05R_LOOKS.haricharan.chip} name="Haricharan" sub={f < 40 ? "about 30 · pole upright, one hand" : across > 0.5 ? "pole carried in both hands" : "pole upright, both hands"} />
      <Label x={X.senior} y={GROUND + 40} chip={EP05R_LOOKS.seniorClerk.chip} name="Senior clerk" sub="late 50s · reed pen" />
      <Label x={X.junior} y={GROUND + 40} chip={EP05R_LOOKS.juniorClerk.chip} name="Junior clerk" sub="early 40s · palm fan" />
      <Label x={X.mother} y={GROUND + 40} chip="বিনয়ের মা" name="Binoy's mother" sub="silent · womanA" />
    </svg>
  );
};

/* --------------------------------------------------------------------------------------------------------------- */
/* PAGE 2: props                                                                                                   */
/* --------------------------------------------------------------------------------------------------------------- */

const SKIN = { skin: "#eab98a", shade: "#c38e62" };

/** A child's forearm and hand stand-in (the shared Hand, back view) placed so its little-finger edge is ON `edge`;
 *  ang = the forearm's direction (deg, 0 = fingers pointing down). */
const childHand = (edge: { x: number; y: number }, ang: number, L = 60) => {
  const r = (ang * Math.PI) / 180;
  const loc = { x: 0.27 * L, y: 0.32 * L }; // the edge below the little finger, wrist-local (side +1, back view)
  const w = { x: edge.x - (loc.x * Math.cos(r) - loc.y * Math.sin(r)), y: edge.y - (loc.x * Math.sin(r) + loc.y * Math.cos(r)) };
  const el = (
    <g transform={`translate(${w.x}, ${w.y}) rotate(${ang})`}>
      <path d={`M ${-L * 0.21} ${-L * 2.4} L ${-L * 0.17} 2 L ${L * 0.17} 2 L ${L * 0.23} ${-L * 2.4} Z`} fill={SKIN.skin} />
      <path d={`M ${L * 0.05} ${-L * 2.3} L ${L * 0.08} 0`} stroke={SKIN.shade} strokeWidth={L * 0.1} opacity={0.35} />
      {/* the chadar over the upper forearm */}
      <path d={`M ${-L * 0.34} ${-L * 2.5} L ${-L * 0.3} ${-L * 1.35} Q 0 ${-L * 1.2} ${L * 0.33} ${-L * 1.35} L ${L * 0.38} ${-L * 2.5} Z`} fill="#fbf7ee" stroke="#d9cdb6" strokeWidth={1} />
      <Hand shape="relaxed" L={L} skin={SKIN.skin} shade={SKIN.shade} side={1} view="back" />
    </g>
  );
  return { el, edge };
};

const Cell: React.FC<{ x: number; y: number; w: number; h: number; title: string; children: React.ReactNode }> = ({ x, y, w, h, title, children }) => (
  <g>
    <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx={10} fill="#f6ecd8" opacity={0.55} stroke="#b89b74" strokeWidth={1} />
    <text x={x + 16} y={y + 28} fontFamily="Georgia, serif" fontSize={16} fill={INK}>
      {title}
    </text>
    {children}
  </g>
);

const PropsPage: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const CW = 480;
  const RH = 320;
  const Y0 = 82;
  const row = (i: number) => Y0 + i * RH;
  const col = (i: number) => i * CW;
  const e = (a: number, b: number) => {
    const u = clamp((t - a) / (b - a));
    return u * u * (3 - 2 * u);
  };

  /* row 1: tortoises */
  // A: side, plodding, and the top view
  const walkDist = Math.max(0, t - 6) * 0.9;
  // B: turned over, paddling, righted
  const over = e(8, 34) * (1 - e(84, 108));
  // C: bite on the ground and release: the hand edge just past the jaw's rest point
  const cT = { x: col(2) + 200, y: row(0) + 262, s: 2.2, lifeF: f, variant: 1 as const };
  const cJaw = ep05TortoiseJawRest(cT);
  const cHand = childHand({ x: cJaw.x + 6, y: cJaw.y - 4 }, 65);
  const cBite = { bite: e(20, 24), release: e(70, 88) };
  // D: hanging from the hand, then letting go
  const dBaseT = { s: 2.0, lifeF: f, variant: 2 as const };
  const dHandRest = { x: col(3) + 250, y: row(0) + 262 };
  const dGround = ep05TortoiseAtJaw(dHandRest, dBaseT);
  const dLift = e(10, 40);
  const dHand = childHand({ x: dHandRest.x, y: dHandRest.y - 175 * dLift }, 65 + 25 * dLift);
  const dHang = e(8, 40);
  const dRelease = e(66, 76);
  const dDrop = e(76, 86);

  /* row 2: cow and vine */
  const cowNuzzle = t >= 56;
  const palm = { x: col(0) + 372, y: row(1) + 232 };
  const tornK = e(14, 96);
  const vineA = ep05VineAnchors(col(2) + 300, row(1) + 286, 0.62, tornK);

  /* row 3: clerks */
  const penK = (t * 0.035) % 1;
  const ledgerAt = { x: col(2) + 196, y: row(2) + 288 };

  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <GhibliCharFilterDefs f={f} rimDir={-1} sunColor="#ffe2a6" />
      <text x={40} y={58} fontFamily="Georgia, serif" fontSize={30} fill={INK}>
        Episode 5 rewrite: props in every state (Ep05RewriteProps.tsx)
      </text>

      {/* ---------------- row 1 ---------------- */}
      <Cell x={col(0)} y={row(0)} w={CW} h={RH} title="Tortoise: side, plodding · top view (elev 76)">
        <Ep05Tortoise x={col(0) + 90 + walkDist} y={row(0) + 160} s={2.0} lifeF={f} walk={t > 6 ? 1 : 0} dist={walkDist} neck={0.9} variant={0} />
        <Ep05Tortoise x={col(0) + 330} y={row(0) + 268} s={2.0} lifeF={f} {...EP05_TORTOISE_TOP} yaw={-20} neck={0.5 + 0.5 * Math.sin(f * 0.05)} variant={3} />
      </Cell>
      <Cell x={col(1)} y={row(0)} w={CW} h={RH} title="Turned over (legs paddling) → righted">
        <Ep05Tortoise x={col(1) + 240} y={row(0) + 240} s={2.6} lifeF={f} view="threeQuarter" turnOver={over} rollDir={-1} neck={over > 0.5 ? 1 : 0.6} variant={0} />
        <text x={col(1) + 24} y={row(0) + 300} fontFamily="Georgia, serif" fontSize={13} fill="#6a5040">
          turnOver {over.toFixed(2)} · hands on tortoiseGrips(props)
        </text>
      </Cell>
      <Cell x={col(2)} y={row(0)} w={CW} h={RH} title="Bite on a hand edge → release (no mark)">
        {cHand.el}
        <Ep05Tortoise {...cT} neck={0.8} bite={cBite.bite} release={cBite.release} biteTarget={cHand.edge} />
        <text x={col(2) + 24} y={row(0) + 300} fontFamily="Georgia, serif" fontSize={13} fill="#6a5040">
          bite {cBite.bite.toFixed(2)} · release {cBite.release.toFixed(2)}
        </text>
      </Cell>
      <Cell x={col(3)} y={row(0)} w={CW} h={RH} title="Hanging from the hand → lets go, drops">
        {dHand.el}
        <Ep05Tortoise x={dGround.x} y={dGround.y} {...dBaseT} hangAt={dHand.edge} hang={dHang} release={dRelease} drop={dDrop} />
        <text x={col(3) + 24} y={row(0) + 300} fontFamily="Georgia, serif" fontSize={13} fill="#6a5040">
          hang {dHang.toFixed(2)} · release {dRelease.toFixed(2)} · drop {dDrop.toFixed(2)}
        </text>
      </Cell>

      {/* ---------------- row 2 ---------------- */}
      <Cell x={col(0)} y={row(1)} w={CW} h={RH} title={cowNuzzle ? "Cow: nuzzle to a raised palm" : "Cow: idle, chewing her cud"}>
        <Ep05Cow x={col(0) + 190} y={row(1) + 290} s={0.62} f={t} lifeF={f} action={cowNuzzle ? "nuzzle" : "idle"} actionStart={cowNuzzle ? 56 : 0} prevAction="idle" target={palm} />
        {cowNuzzle && <circle cx={palm.x} cy={palm.y} r={4} fill="none" stroke="#8a3a22" strokeWidth={1.2} />}
      </Cell>
      <Cell x={col(1)} y={row(1)} w={CW} h={RH} title="Cucumber vine on the machan: whole">
        <Ep05CucumberVine x={col(1) + 250} y={row(1) + 286} s={0.62} f={f} torn={0} />
      </Cell>
      <Cell x={col(2)} y={row(1)} w={CW} h={RH} title={`Vine pulled down, root out (torn ${tornK.toFixed(2)})`}>
        <Ep05CucumberVine x={col(2) + 300} y={row(1) + 286} s={0.62} f={f} torn={tornK} />
        {[vineA.root, vineA.tip, vineA.frontBar].map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="none" stroke="#8a3a22" strokeWidth={1.4} />
        ))}
      </Cell>
      <Cell x={col(3)} y={row(1)} w={CW} h={RH} title="Bamboo pole · cucumbers · the mango leaf">
        <Ep05BambooPole x1={col(3) + 30} y1={row(1) + 280} x2={col(3) + 430} y2={row(1) + 262} w={10} shadow />
        <Ep05BambooPole x1={col(3) + 70} y1={row(1) + 240} x2={col(3) + 150} y2={row(1) + 52} w={10} />
        <Ep05Cucumber x={col(3) + 230} y={row(1) + 110} s={1.6} rot={-8} bite={0} />
        <Ep05Cucumber x={col(3) + 230} y={row(1) + 160} s={1.6} rot={6} bite={1} />
        <Ep05Cucumber x={col(3) + 230} y={row(1) + 210} s={1.6} rot={-4} bite={2} />
        <Ep05MangoLeaf x={col(3) + 340} y={row(1) + 160} s={2.2} rot={-20} twirl={f * 0.02} />
      </Cell>

      {/* ---------------- row 3 ---------------- */}
      <Cell x={col(0)} y={row(2)} w={CW} h={RH} title="Ledger open (page lifting) · closed · stack">
        <Ep05Ledger x={col(0) + 150} y={row(2) + 190} s={1.7} open={1} pageLift={0.5 + 0.5 * Math.sin(f * 0.07)} />
        <Ep05Ledger x={col(0) + 345} y={row(2) + 160} s={1.2} open={0} />
        <Ep05LedgerStack x={col(0) + 360} y={row(2) + 280} s={1.3} count={3} />
      </Cell>
      <Cell x={col(1)} y={row(2)} w={CW} h={RH} title="Inkpot (pen in it) · reed pen · palm fan">
        <Ep05Inkpot x={col(1) + 100} y={row(2) + 250} s={2.2} pen />
        <Ep05ReedPen x={col(1) + 170} y={row(2) + 285} len={120} rot={55} />
        <Ep05PalmFan x={col(1) + 390} y={row(2) + 290} s={2.4} rot={12 * Math.sin(f * 0.3)} />
      </Cell>
      <Cell x={col(2)} y={row(2)} w={CW} h={RH} title="Clerks on the mat: writing · fanning">
        <Ep05Mat x={col(2) + 240} y={row(2) + 296} w={440} d={80} />
        <Ep05Ledger x={ledgerAt.x} y={ledgerAt.y} s={0.9} open={1} pageLift={0.3 + 0.3 * Math.sin(f * 0.09)} />
        <Ep05Person
          cast={EP05R_CAST.seniorClerk}
          x={col(2) + 120}
          y={row(2) + 268}
          scale={0.62}
          f={f}
          lifeF={f}
          seated
          sitStyle="crossLegged"
          light={EP05R_LIGHT.lateAfternoon}
          acting={() => ({ ...(t < 60 ? { ...EP05R_GESTURES.seniorClerkWrite, reach: 1 } : EP05R_GESTURES.seniorClerkPeer), bodyTurn: 0.3 })}
          reachAt={() => ep05PenGripFor(ep05LedgerPenPoint(ledgerAt.x, ledgerAt.y, 0.9, penK), 0.62)}
          reachExact
        />
        <Ep05Inkpot x={col(2) + 262} y={row(2) + 262} s={0.8} />
        <circle cx={ep05LedgerPenPoint(ledgerAt.x, ledgerAt.y, 0.9, penK).x} cy={ep05LedgerPenPoint(ledgerAt.x, ledgerAt.y, 0.9, penK).y} r={2} fill="#8a3a22" />
        <Ep05Person
          cast={EP05R_CAST.juniorClerk}
          x={col(2) + 360}
          y={row(2) + 276}
          scale={0.62}
          f={f}
          lifeF={f}
          seated
          sitStyle="crossLegged"
          light={EP05R_LIGHT.lateAfternoon}
          acting={() => ({ ...(t < 60 ? EP05R_GESTURES.juniorClerkFan : EP05R_GESTURES.juniorClerkLeanIn), bodyTurn: -0.3 })}
          props={t < 60 ? undefined : { palmFan: makePalmFanInHand(() => 0) }}
        />
      </Cell>
      <Cell x={col(3)} y={row(2)} w={CW} h={RH} title="Mat (SVG) · madur plate · basket · pebbles · desk">
        <Ep05MatCutout x={col(3) + 150} y={row(2) + 150} h={70} />
        <Ep05Mat x={col(3) + 130} y={row(2) + 290} w={200} d={44} tone="green" />
        <GhibliTippedBasket x={col(3) + 330} y={row(2) + 160} s={0.6} />
        <PebblesArt x={col(3) + 200} y={row(2) + 210} s={1.4} t={(t % 60) / 60 * 300} />
        <Ep05ClerkDesk x={col(3) + 380} y={row(2) + 300} h={110} />
      </Cell>
    </svg>
  );
};

export const Ep05RewriteCastQA: React.FC = () => {
  ensureBanglaFont();
  const frame = useCurrentFrame();
  const page2 = frame >= 120;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Img src={staticFile("images/ghibli_ep05/watercolor_paper_grain.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55, mixBlendMode: "multiply" }} />
      {page2 ? <PropsPage t={frame - 120} f={frame} /> : <CastPage f={frame} />}
    </AbsoluteFill>
  );
};
