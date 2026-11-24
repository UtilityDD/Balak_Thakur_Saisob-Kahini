import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam, Layer, Stage } from "../../cinematic/core/Stage";
import { BN_FONT, ensureBanglaFont } from "../../cinematic/fonts";
import { UJANCHAR_BG, UjancharHouse, ujancharKeepInSet } from "../../cinematic/sets/UjancharHouse";
import {
  LongShadow,
  UjancharVillageField,
  VILLAGE,
  VILLAGE_BG,
  VILLAGE_CAMS,
  villageKeepInSet,
  type VillageTime,
  type VillageView,
  type VPoint,
} from "../../cinematic/sets/UjancharVillageField";

/**
 * VillageFieldQA (Episode 6, 240 frames, 30-frame segments): the Ujanchar village set
 * (src/cinematic/sets/UjancharVillageField.tsx), the delivered views first, then the re-cut additions (STO-22a).
 *   0-29     field, working cam `wide`, late morning; placement points and figure-size ghosts from frame 10.
 *   30-59    field: the four other working cams (mangoMedium, mangoTwo, stallMedium, stallWide), points marked.
 *   60-89    house, working cam `courtyard`, late morning; points and ghosts from frame 70.
 *   90-119   house: verandaFoot and shirtInsert (a red test note in the `inPocket` slot rises out of the pocket), and
 *            the stall and the courtyard in the afternoon light.
 *   120-149  same village? UjancharHouse (Episode 2/3 set, morning) beside the field wide and the friend's courtyard,
 *            and the field wide in the afternoon.
 *   150-179  NEW lane, working cam `laneWide`, late morning; VILLAGE.lane points and ghosts from frame 158.
 *   180-209  NEW lane cams: laneTrackStart / laneTrackEnd (W1 a, afternoon, the two boys on the path), l1TrackEnd (L1,
 *            Balak approaching the haystack), haystackHold (L1: Balak crouched at the haystack, the culprit crossing
 *            the cross lane far ahead in the `crossing` slot, behind the fences).
 *   210-239  NEW sunset (G2): logRow and logTwo with six seated ghosts on the log and their long shadows (`logShadows`),
 *            the field wide at sunset with the log, the lane at sunset (logRow also has a standing ghost with a LongShadow).
 *  Every panel: the captions band (y 820) as a dashed line; the label says "clamped" when villageKeepInSet moved the cam.
 *  Ghosts: translucent figure outlines at the points (standing child 485 s tall, crouching child about 300 s, adult
 *  Puppet about 360 s, seated child about 235 s), so the captions band and scale can be judged before the cast is in.
 */

const SEG = 30;

const Label: React.FC<{ x: number; y: number; text: string; size?: number }> = ({ x, y, text, size = 28 }) => (
  <div style={{ position: "absolute", left: x, top: y, padding: "4px 14px", background: "rgba(20,14,8,0.66)", color: "#fff4dc", fontFamily: BN_FONT, fontSize: size, fontWeight: 600, borderRadius: 6, whiteSpace: "nowrap" }}>{text}</div>
);

type Kind = "stand" | "adult" | "seat" | "adultSeat" | "crouch" | "none";
const ADULT_NAMES = ["doorway", "verandaEdge", "boudiOut", "dada"];
const kindOf = (name: string, p: VPoint): Kind => {
  if (p.s === undefined || name.startsWith("mango") || name.startsWith("jar") || name === "lozengeJar" || name === "stall" || name === "shirtPeg") return "none";
  if (name === "haystack" || name === "log" || name === "logSeat") return "none";
  if (name === "haystackHide") return "crouch";
  if (name === "sellerSeat") return "adultSeat";
  if (name === "balakSeat") return "seat";
  if (ADULT_NAMES.includes(name)) return "adult";
  if (name === "gateGap") return "adult";
  return "stand";
};

/** A translucent ghost of a figure of the given kind and scale standing (or seated) at the point. */
const Ghost: React.FC<{ p: VPoint; kind: Kind }> = ({ p, kind }) => {
  if (kind === "none") return null;
  const s = p.s ?? 1;
  const h = kind === "stand" ? 485 * s : kind === "crouch" ? 300 * s : kind === "adult" ? 360 * s : kind === "seat" ? 235 * s : 200 * s;
  const w = kind === "seat" ? h * 0.75 : h * 0.3;
  const head = kind === "stand" ? h / 5.5 : kind === "crouch" ? h / 3.6 : h / 4.4;
  const col = kind === "adult" || kind === "adultSeat" ? "#3b8bff" : "#ff8a1e";
  return (
    <g opacity={0.42}>
      <rect x={p.x - w / 2} y={p.y - h + head * 0.9} width={w} height={h - head * 0.9} rx={w * 0.35} fill={col} />
      <circle cx={p.x} cy={p.y - h + head / 2} r={head / 2} fill={col} />
      {/* eye line: the face must be above y 820 on screen */}
      <line x1={p.x - head * 0.4} y1={p.y - h + head * 0.55} x2={p.x + head * 0.4} y2={p.y - h + head * 0.55} stroke="#fff" strokeWidth={3} />
    </g>
  );
};

const Mark: React.FC<{ p: VPoint; name: string; ghosts?: boolean }> = ({ p, name, ghosts = true }) => (
  <Layer depth={p.depth}>
    <g>
      {ghosts && <Ghost p={p} kind={kindOf(name, p)} />}
      <circle cx={p.x} cy={p.y} r={6} fill="#ff2a6a" stroke="#fff" strokeWidth={2} />
      <text x={p.x + 9} y={p.y - 8} fill="#fff" stroke="#000" strokeWidth={3} paintOrder="stroke" fontSize={16} fontFamily="sans-serif" fontWeight={700}>
        {name}
      </text>
    </g>
  </Layer>
);

const pointsFor = (view: VillageView) => {
  const V = VILLAGE[view] as unknown as Record<string, unknown>;
  const out: Array<{ p: VPoint; name: string }> = [];
  for (const [key, v] of Object.entries(V)) {
    if (Array.isArray(v)) v.forEach((q, i) => out.push({ p: q as VPoint, name: `${key}${i}` }));
    else if (v && typeof v === "object" && "depth" in (v as object)) out.push({ p: v as VPoint, name: key });
  }
  return out;
};

const BandLine: React.FC = () => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    <line x1={0} y1={820} x2={1920} y2={820} stroke="#00e5ff" strokeWidth={3} strokeDasharray="18 12" opacity={0.85} />
  </svg>
);

const camDiff = (a: Cam, b: Cam) => Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5;

/** One view of the set at a cam, with optional marks; reports whether the clamp moved the cam. */
const View: React.FC<{
  view: VillageView;
  time?: VillageTime;
  cam: Cam;
  f: number;
  marks?: boolean;
  ghosts?: boolean;
  leaves?: boolean;
  testNote?: number;
  log?: boolean;
  logShadows?: Array<{ x: number; h: number; w?: number }>;
  floor?: React.ReactNode;
  under?: React.ReactNode;
  crossing?: React.ReactNode;
}> = ({ view, time = "lateMorning", cam, f, marks = false, ghosts = true, leaves = false, testNote, log = false, logShadows, floor, under, crossing }) => {
  const c = villageKeepInSet(view, cam);
  const pocket = VILLAGE.house.shirtPocket;
  const note =
    testNote !== undefined ? (
      <g transform={`translate(${pocket.x}, ${pocket.y + 3 - 44 * testNote}) rotate(-4)`}>
        <rect x={-10} y={0} width={20} height={22} rx={2} fill="#ff2a4a" opacity={0.9} />
      </g>
    ) : undefined;
  return (
    <Stage cam={c} background={VILLAGE_BG[time]}>
      <UjancharVillageField view={view} time={time} f={f} cam={c} leaves={leaves} inPocket={note} log={log} logShadows={logShadows} floor={floor} under={under} crossing={crossing} />
      {marks && pointsFor(view).map((m) => <Mark key={m.name} p={m.p} name={m.name} ghosts={ghosts} />)}
    </Stage>
  );
};

/** A small picture-in-picture of a full 1920 x 1080 frame. */
const Inset: React.FC<{ x: number; y: number; w: number; label: string; children: React.ReactNode }> = ({ x, y, w, label, children }) => {
  const kk = w / 1920;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: 1080 * kk, overflow: "hidden", border: "3px solid #fff4dc", borderRadius: 6, boxShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${kk})` }}>
        {children}
        <BandLine />
      </div>
      <div style={{ position: "absolute", left: 8, top: 6, padding: "2px 10px", background: "rgba(20,14,8,0.66)", color: "#fff4dc", fontFamily: BN_FONT, fontSize: 22, fontWeight: 700, borderRadius: 4 }}>{label}</div>
    </div>
  );
};

const GRID: Array<[number, number]> = [
  [0, 0],
  [960, 0],
  [0, 540],
  [960, 540],
];

const Grid: React.FC<{ panels: Array<{ label: string; node: React.ReactNode }> }> = ({ panels }) => (
  <AbsoluteFill style={{ background: "#1a140c" }}>
    {panels.map((pn, i) => (
      <Inset key={i} x={GRID[i][0] + 4} y={GRID[i][1] + 4} w={952} label={pn.label}>
        {pn.node}
      </Inset>
    ))}
  </AbsoluteFill>
);

const lab = (view: VillageView, name: string, cam: Cam, time: VillageTime = "lateMorning") =>
  `${view}.${name}${time !== "lateMorning" ? ` (${time})` : ""}${camDiff(cam, villageKeepInSet(view, cam)) ? "  [clamped]" : ""}`;

export const VillageFieldQA: React.FC = () => {
  ensureBanglaFont();
  const frame = useCurrentFrame();
  const seg = Math.min(7, Math.floor(frame / SEG));
  const local = frame - seg * SEG;
  const FC = VILLAGE_CAMS.field;
  const HC = VILLAGE_CAMS.house;

  if (seg === 0 || seg === 2) {
    const view: VillageView = seg === 0 ? "field" : "house";
    const cam = seg === 0 ? FC.wide : HC.courtyard;
    return (
      <AbsoluteFill>
        <View view={view} cam={cam} f={frame} marks={local >= 10} leaves={view === "field"} />
        <BandLine />
        <Label x={24} y={20} text={seg === 0 ? `1  ${lab("field", "wide", cam)}: the playing field, late morning (shot 2)` : `3  ${lab("house", "courtyard", cam)}: the friend's house, late morning (shot 6)`} />
        {local >= 10 && <Label x={24} y={72} size={20} text="red dots: VILLAGE[view].* points; ghosts: orange = child (StandingChild / SeatedChild), blue = adult; cyan dashes: y 820" />}
      </AbsoluteFill>
    );
  }

  if (seg === 1) {
    return (
      <Grid
        panels={[
          { label: `${lab("field", "mangoMedium", FC.mangoMedium)} (shot 1, AG3, P1)`, node: <View view="field" cam={FC.mangoMedium} f={frame} marks /> },
          { label: `${lab("field", "mangoTwo", FC.mangoTwo)} (shot 4, P2)`, node: <View view="field" cam={FC.mangoTwo} f={frame} marks /> },
          { label: `${lab("field", "stallMedium", FC.stallMedium)} (shot 7)`, node: <View view="field" cam={FC.stallMedium} f={frame} marks /> },
          { label: `${lab("field", "stallWide", FC.stallWide)} (shot 8, P3)`, node: <View view="field" cam={FC.stallWide} f={frame} marks /> },
        ]}
      />
    );
  }

  if (seg === 3) {
    const t = Math.max(0, Math.min(1, (local - 8) / 30));
    return (
      <Grid
        panels={[
          { label: `${lab("house", "verandaFoot", HC.verandaFoot)} (shot 5)`, node: <View view="house" cam={HC.verandaFoot} f={frame} marks /> },
          { label: `${lab("house", "shirtInsert", HC.shirtInsert)} (shot 3): test note out ${t.toFixed(2)}`, node: <View view="house" cam={HC.shirtInsert} f={frame} marks ghosts={false} testNote={t} /> },
          { label: `${lab("field", "stallMedium", FC.stallMedium, "afternoon")} (shot 7)`, node: <View view="field" time="afternoon" cam={FC.stallMedium} f={frame} /> },
          { label: `${lab("house", "courtyard", HC.courtyard, "afternoon")}`, node: <View view="house" time="afternoon" cam={HC.courtyard} f={frame} /> },
        ]}
      />
    );
  }

  const LC = VILLAGE_CAMS.lane;
  const L = VILLAGE.lane;

  if (seg === 5) {
    return (
      <AbsoluteFill>
        <View view="lane" cam={LC.laneWide} f={frame} marks={local >= 8} />
        <BandLine />
        <Label x={24} y={20} text={`6  ${lab("lane", "laneWide", LC.laneWide)}: the Ujanchar village lane, late morning (W1 a, L1)`} />
        {local >= 8 && <Label x={24} y={72} size={20} text="red dots: VILLAGE.lane.* points; orange ghosts: children (crouching at haystackHide); cyan dashes: y 820" />}
      </AbsoluteFill>
    );
  }

  if (seg === 6) {
    const t = Math.max(0, Math.min(1, local / 29));
    const lerpP = (a: VPoint, b: VPoint, u: number): VPoint => ({ ...a, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
    const ghost = (p: VPoint, kind: Kind = "stand") => <Ghost p={p} kind={kind} />;
    const culprit = lerpP(L.farCross[0], L.farCross[1], t);
    return (
      <Grid
        panels={[
          {
            label: `${lab("lane", "laneTrackStart", LC.laneTrackStart, "afternoon")} (W1 a)`,
            node: (
              <View
                view="lane"
                time="afternoon"
                cam={LC.laneTrackStart}
                f={frame}
                floor={
                  <>
                    {ghost(L.w1Balak[0])}
                    {ghost(L.w1Elder[0])}
                  </>
                }
              />
            ),
          },
          {
            label: `${lab("lane", "laneTrackEnd", LC.laneTrackEnd, "afternoon")} (W1 a)`,
            node: (
              <View
                view="lane"
                time="afternoon"
                cam={LC.laneTrackEnd}
                f={frame}
                floor={
                  <>
                    {ghost(L.w1Balak[1])}
                    {ghost(L.w1Elder[1])}
                  </>
                }
              />
            ),
          },
          { label: `${lab("lane", "l1TrackEnd", LC.l1TrackEnd)} (L1 walk; from l1TrackStart)`, node: <View view="lane" cam={LC.l1TrackEnd} f={frame} floor={ghost(L.haystackApproach)} /> },
          {
            label: `${lab("lane", "haystackHold", LC.haystackHold)} (L1 duck): culprit crossing ${t.toFixed(2)}`,
            node: <View view="lane" cam={LC.haystackHold} f={frame} floor={ghost(L.haystackHide, "crouch")} crossing={ghost(culprit)} />,
          },
        ]}
      />
    );
  }

  if (seg === 7) {
    const S = VILLAGE.field.logSeat;
    const seated = (
      <>
        {S.seats.map((p, i) => (
          <Ghost key={i} p={p} kind="seat" />
        ))}
      </>
    );
    const shadows = S.seats.map((p) => ({ x: p.x, h: 235 * (p.s ?? 1) }));
    const strayShadow = <LongShadow x={2010} y={1000} h={485 * 0.56 * 1.13} w={70} time="sunset" />;
    return (
      <Grid
        panels={[
          { label: `${lab("field", "logRow", FC.logRow, "sunset")} (G2 end): six on the log, a standing child's LongShadow at the right`, node: <View view="field" time="sunset" cam={FC.logRow} f={frame} log logShadows={shadows} floor={<>{seated}<Ghost p={{ x: 2010, y: 1000, depth: 1, s: 0.56 * 1.128 }} kind="stand" /></>} under={strayShadow} /> },
          { label: `${lab("field", "logTwo", FC.logTwo, "sunset")} (G2 start): seats 2 and 3`, node: <View view="field" time="sunset" cam={FC.logTwo} f={frame} log logShadows={shadows} floor={seated} /> },
          {
            label: `${lab("field", "wide", FC.wide, "sunset")} with the log`,
            node: <View view="field" time="sunset" cam={FC.wide} f={frame} log logShadows={shadows} floor={seated} leaves />,
          },
          { label: lab("lane", "laneWide", LC.laneWide, "sunset"), node: <View view="lane" time="sunset" cam={LC.laneWide} f={frame} /> },
        ]}
      />
    );
  }

  const ujCam = ujancharKeepInSet({ x: 60, y: 110, zoom: 1 });
  return (
    <Grid
      panels={[
        {
          label: "REFERENCE: UjancharHouse (the family's house), morning, Episode 2 wide",
          node: (
            <Stage cam={ujCam} background={UJANCHAR_BG.morning}>
              <UjancharHouse f={frame} time="morning" cam={ujCam} />
            </Stage>
          ),
        },
        { label: lab("field", "wide", FC.wide), node: <View view="field" cam={FC.wide} f={frame} leaves /> },
        { label: lab("house", "courtyard", HC.courtyard), node: <View view="house" cam={HC.courtyard} f={frame} /> },
        { label: lab("field", "wide", FC.wide, "afternoon"), node: <View view="field" time="afternoon" cam={FC.wide} f={frame} leaves /> },
      ]}
    />
  );
};
