import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { BN_FONT, ensureBanglaFont } from "./fonts";
import { PebblesArt, SeatedChild, seatedChildHands, type SeatedChildProps, type SeatedPose, type HeldObject } from "../episode03/rig/SeatedChild";
import { ThakurHeadPlate, plateFaceState } from "./rig/ThakurHeadPlate";

/**
 * BAL-26 design QA: the director's reference plate 01 (Balak at about six, Ujanchar) next to the "plate" design of
 * the five-year-old rig (SeatedChild design="plate"), large in sitCross and serene, with a row of smaller versions
 * (serene, joyful, talking, three-quarter turn) and the classic Episode 3/4 design for comparison.
 * 96 frames so blinks (life frame 60) and breathing show. `sheet: "poses"` shows every pose in the plate design.
 */
export interface ThakurDesignQAProps {
  sheet?: "design" | "poses" | "turns" | "hands" | "faces" | "classic";
}

const PLATE = "images/reference/01_Thakur_Age06_Child_Ujanchar.jpg";
const PLATE_W = 1376;
const PLATE_H = 768;

const Label: React.FC<{ x: number; y: number; w: number; text: string; size?: number; align?: "left" | "center" }> = ({
  x,
  y,
  w,
  text,
  size = 24,
  align = "center",
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      textAlign: align,
      fontFamily: BN_FONT,
      fontSize: size,
      fontWeight: 600,
      color: "#4a3324",
      lineHeight: 1.15,
    }}
  >
    {text}
  </div>
);

/** A soft contact shadow on the ground under a seated figure. */
const Ground: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <ellipse cx={x} cy={y + 2 * s} rx={92 * s} ry={9 * s} fill="#6b4a2a" opacity={0.18} />
);

const DesignSheet: React.FC = () => {
  const f = useCurrentFrame();
  // Speech: an irregular open-close pattern, as lip sync would drive it.
  const talkMouth = Math.max(0, 0.55 * Math.sin(f * 0.75) + 0.3 * Math.sin(f * 1.9 + 1) + 0.15);
  const small: Array<{ label: string; props: Partial<SeatedChildProps> }> = [
    { label: "serene", props: { design: "plate", expression: "serene" } },
    { label: "joyful", props: { design: "plate", expression: "joyful" } },
    { label: "talking", props: { design: "plate", expression: "serene", talk: 1, mouth: talkMouth } },
    { label: "three-quarter turn", props: { design: "plate", expression: "serene", face: { lookX: 1 } } },
    { label: "classic (Ep 3, 4)", props: { design: "classic", expression: "serene" } },
  ];
  const BIG_S = 3.3;
  const BIG_X = 1500;
  const BIG_Y = 1040;
  const SM_S = 1.15;
  const SM_Y = 1000;
  // Plate 01 face crop (source pixels), shown at about the size of the big rig's head.
  const crop = { x: 560, y: 60, w: 260, h: 300, k: 1.45 };
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #f6ecd6 0%, #ecdcbc 70%, #dcc59c 100%)" }}>
      {/* Plate 01, whole */}
      <div style={{ position: "absolute", left: 30, top: 64, width: 900, height: (900 * PLATE_H) / PLATE_W, borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 18px rgba(80,50,20,0.25)" }}>
        <Img src={staticFile(PLATE)} style={{ width: "100%", height: "100%" }} />
      </div>
      <Label x={30} y={18} w={900} align="left" text="Reference plate 01: Balak at about six, Ujanchar (BAL-26)" size={28} />
      {/* Plate 01, face crop */}
      <div style={{ position: "absolute", left: 952, top: 64, width: crop.w * crop.k, height: crop.h * crop.k, borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 18px rgba(80,50,20,0.25)" }}>
        <Img
          src={staticFile(PLATE)}
          style={{ position: "absolute", left: -crop.x * crop.k, top: -crop.y * crop.k, width: PLATE_W * crop.k, height: PLATE_H * crop.k, maxWidth: "none" }}
        />
      </div>
      <Label x={952} y={18} w={crop.w * crop.k} text="plate 01, face" size={26} />

      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <Ground x={BIG_X} y={BIG_Y} s={BIG_S} />
        <SeatedChild x={BIG_X} y={BIG_Y} s={BIG_S} f={f} lifeF={f} pose="sitCross" expression="serene" design="plate" age={6} />
        {small.map((c, i) => {
          const x = 110 + i * 182;
          return (
            <g key={c.label}>
              <Ground x={x} y={SM_Y} s={SM_S} />
              <SeatedChild x={x} y={SM_Y} s={SM_S} f={f} lifeF={f + 23 * (i + 1)} pose="sitCross" {...c.props} />
            </g>
          );
        })}
      </svg>
      <Label x={1340} y={18} w={560} align="left" text={"Rig: design=\"plate\", age 6"} size={28} />
      <Label x={1340} y={56} w={560} align="left" text="sitCross, serene" size={24} />
      {small.map((c, i) => (
        <Label key={c.label} x={110 + i * 182 - 90} y={SM_Y + 18} w={180} text={c.label} size={22} />
      ))}
    </AbsoluteFill>
  );
};

/** Every pose in the plate design (verification of poses, held objects, hands and cloth). */
const POSES: Array<{ pose: SeatedPose; label: string; extra?: Partial<SeatedChildProps>; at?: number }> = [
  { pose: "sitCross", label: "sitCross" },
  { pose: "pour", label: "pour", at: 30 },
  { pose: "pickLeaf", label: "pickLeaf", at: 20 },
  { pose: "placeFlowerOnFoot", label: "placeFlowerOnFoot", at: 20 },
  { pose: "bless", label: "bless" },
  { pose: "bowHands", label: "bowHands" },
  { pose: "palmRaise", label: "palmRaise" },
  { pose: "lookUp", label: "lookUp" },
  { pose: "reaction", label: "reaction" },
  { pose: "kneelReach", label: "kneelReach", extra: { kneel: 1.5, reachFor: "doll" as HeldObject }, at: 22 },
  { pose: "holdInLap", label: "holdInLap clayLump", extra: { holding: "clayLump" as HeldObject } },
  { pose: "holdToChest", label: "holdToChest doll", extra: { holding: "doll" as HeldObject } },
  { pose: "offerUp", label: "offerUp gobinda", extra: { holding: "gobinda" as HeldObject } },
  { pose: "drinkBowl", label: "drinkBowl (drinking)", at: 36 },
  { pose: "pointIn", label: "pointIn", extra: { holding: "incense" as HeldObject } },
  { pose: "rollClay", label: "rollClay", extra: { holding: "clayLump" as HeldObject } },
  { pose: "toss", label: "toss", at: 12, extra: { holding: "clayLump" as HeldObject } },
  { pose: "sitCross", label: "kneel 2 (up on knees)", extra: { kneel: 2 } },
  { pose: "playPebbles", label: "playPebbles (carrying)", at: 82 },
  { pose: "strokeCow", label: "strokeCow (stroking)", at: 70 },
  { pose: "sitCross", label: "headShake (mid-swing)", extra: { expression: "compassionate" } },
];

/** `classic`: the same grid in the classic design (the byte-identical check for Episodes 1 to 4's rig). */
const PoseSheet: React.FC<{ classic?: boolean }> = ({ classic = false }) => {
  const f = useCurrentFrame();
  const cols = 7;
  const S = 1.12;
  const X0 = 135;
  const DX = 275;
  const rowY = (i: number) => 318 + Math.floor(i / cols) * 340;
  // The cow's muzzle for strokeCow drifts a little, as a live head would; the hand follows it.
  const muzzle = { x: 110 + 5 * Math.sin(f * 0.05), y: -114 + 4 * Math.sin(f * 0.07 + 1) };
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #f6ecd6 0%, #e6d3ae 100%)" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {POSES.map((p, i) => {
          const x = X0 + (i % cols) * DX;
          const y = rowY(i);
          // Each pose is shown `at` frames after it starts (default 40, settled).
          const at = p.at ?? 40;
          const start = f - at;
          const extra: Partial<SeatedChildProps> = { ...p.extra };
          if (p.pose === "strokeCow") extra.strokeAt = muzzle;
          if (p.label.startsWith("headShake")) extra.headShake = f - 9;
          return (
            <g key={p.label}>
              <Ground x={x} y={y} s={S} />
              {p.pose === "playPebbles" && <PebblesArt x={x} y={y} s={S} t={at} />}
              {p.pose === "strokeCow" && (
                <g transform={`translate(${x} ${y}) scale(${S})`}>
                  <ellipse cx={muzzle.x + 9} cy={muzzle.y + 2} rx={11} ry={8} fill="#8a6a50" opacity={0.85} />
                  <ellipse cx={muzzle.x + 4} cy={muzzle.y + 3} rx={2} ry={1.5} fill="#3a2a20" />
                </g>
              )}
              <SeatedChild x={x} y={y} s={S} f={f} lifeF={f} pose={p.pose} poseStart={start} design={classic ? "classic" : "plate"} age={classic ? 5 : 6} footFlowers={p.pose === "placeFlowerOnFoot" ? 1.5 : undefined} {...extra} />
            </g>
          );
        })}
      </svg>
      {POSES.map((p, i) => (
        <Label key={p.label} x={X0 + (i % cols) * DX - 135} y={rowY(i) + 10} w={270} text={p.label} size={19} />
      ))}
    </AbsoluteFill>
  );
};

/** The shared head through its whole turn range: three-quarter within -1..1, near profile at +-1.8. */
const TurnSheet: React.FC = () => {
  const f = useCurrentFrame();
  const turns = [-1.8, -1.4, -1, -0.5, 0, 0.5, 1, 1.4, 1.8];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #f6ecd6 0%, #e6d3ae 100%)" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {turns.map((t, i) => (
          <ThakurHeadPlate key={t} x={130 + i * 207} y={430} scale={2.3} age={6} state={plateFaceState({ f, lifeF: f + 30, turn: t, lookX: Math.max(-1, Math.min(1, t)) })} />
        ))}
      </svg>
      {turns.map((t, i) => (
        <Label key={t} x={130 + i * 207 - 100} y={600} w={200} text={`turn ${t}`} size={24} />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Episode 5 hand targets: handsTo with two targets on the ground (gripping a shell rim), one hand held at a moving
 * target, palmUp 0 to 1, and joyful at a medium-close framing. Red dots: seatedChildHands' palm centres, blue: the near
 * hand's little-finger edge (they must sit on the drawn hands).
 */
const HandsSheet: React.FC = () => {
  const f = useCurrentFrame();
  const S = 1.75;
  const Y = 520;
  const dots = (p: SeatedChildProps) => {
    const h = seatedChildHands(p);
    return (
      <g>
        <circle cx={h.nearPalm.x} cy={h.nearPalm.y} r={3.5} fill="#e0201c" />
        <circle cx={h.farPalm.x} cy={h.farPalm.y} r={3.5} fill="#e0201c" />
        <circle cx={h.nearLittleEdge.x} cy={h.nearLittleEdge.y} r={3} fill="#1c5ae0" />
      </g>
    );
  };
  const moving = { x: 74 + 12 * Math.sin(f * 0.09), y: -66 + 8 * Math.cos(f * 0.07) };
  const shell = { x: 92, y: -9 };
  const cells: Array<{ x: number; y: number; label: string; p: SeatedChildProps; marks?: React.ReactNode }> = [
    {
      x: 230,
      y: Y,
      label: "handsTo: grip a shell on the ground",
      p: { x: 230, y: Y, s: S, f, lifeF: f, pose: "handsTo", poseStart: f - 40, design: "plate", age: 6, expression: "joyful", handTargets: { near: { x: shell.x + 13, y: shell.y - 2 }, far: { x: shell.x - 13, y: shell.y - 2 } }, handShapes: { near: "grip", far: "grip" }, handTurns: { near: -1.6, far: -1.6 } },
      marks: <ellipse cx={230 + S * shell.x} cy={Y + S * (shell.y + 2)} rx={S * 15} ry={S * 8} fill="#6f6a4a" />,
    },
    {
      x: 700,
      y: Y,
      label: "handsTo: near hand follows a moving target",
      p: { x: 700, y: Y, s: S, f, lifeF: f, pose: "handsTo", poseStart: f - 40, design: "plate", age: 6, expression: "serene", handTargets: { near: moving } },
      marks: <circle cx={700 + S * moving.x} cy={Y + S * moving.y} r={S * 4} fill="none" stroke="#c0392b" strokeWidth={2} />,
    },
    { x: 1170, y: Y, label: "travel (12 f into handsTo)", p: { x: 1170, y: Y, s: S, f, lifeF: f, pose: "handsTo", prevPose: "sitCross", poseStart: f - 12, design: "plate", age: 6, handTargets: { near: { x: 100, y: -6 }, far: { x: 60, y: -6 } } } },
  ];
  const pu = [0, 0.5, 1];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #f6ecd6 0%, #e6d3ae 100%)" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {cells.map((c) => (
          <g key={c.label}>
            <Ground x={c.x} y={c.y} s={S} />
            {c.marks}
            <SeatedChild {...c.p} />
            {dots(c.p)}
          </g>
        ))}
        {pu.map((v, i) => {
          const p: SeatedChildProps = { x: 200 + i * 330, y: 1010, s: S, f, lifeF: f + 17 * i, pose: "handsTo", poseStart: f - 40, design: "plate", age: 6, expression: "joyful", handTargets: { near: { x: 70, y: -74 } }, palmUp: v };
          return (
            <g key={v}>
              <Ground x={p.x} y={p.y} s={S} />
              <SeatedChild {...p} />
              {dots(p)}
            </g>
          );
        })}
        {/* joyful at a medium-close framing: the upper body large */}
        <g>
          <SeatedChild x={1560} y={1500} s={4.6} f={f} lifeF={f} pose="sitCross" design="plate" age={6} expression="joyful" />
        </g>
      </svg>
      {cells.map((c) => (
        <Label key={c.label} x={c.x - 220} y={c.y + 14} w={440} text={c.label} size={22} />
      ))}
      {pu.map((v, i) => (
        <Label key={v} x={200 + i * 330 - 150} y={1030} w={300} text={`palmUp ${v} (hand held)`} size={22} />
      ))}
      <Label x={1380} y={1036} w={400} text="joyful, medium close" size={22} />
    </AbsoluteFill>
  );
};

/**
 * Episode 5 faces and body checks: serene, joyful, playful and surprised at a medium-close framing (head about 120 to
 * 300 px), then a forward lean to the ground (handsTo, both hands on a shell), a raised near arm held palm up (as in
 * Charu's hands) and the blink of surprise (blinkAt) mid-blink.
 */
const FacesSheet: React.FC = () => {
  const f = useCurrentFrame();
  const faces: Array<{ label: string; p: Partial<SeatedChildProps> }> = [
    { label: "serene", p: { expression: "serene" } },
    { label: "joyful", p: { expression: "joyful" } },
    { label: "playful", p: { expression: "playful" } },
    { label: "surprised", p: { expression: "surprised", prevExpression: "joyful", expressionStart: f - 8 } },
  ];
  const S2 = 2.1;
  const Y2 = 1010;
  const shell = { x: 94, y: -9 };
  const lower: Array<{ x: number; label: string; p: SeatedChildProps; marks?: React.ReactNode }> = [
    {
      x: 260,
      label: "lean: both hands on a shell (handsTo)",
      p: { x: 260, y: Y2, s: S2, f, lifeF: f, pose: "handsTo", poseStart: f - 40, design: "plate", age: 6, expression: "joyful", handTargets: { near: { x: shell.x + 13, y: shell.y - 2 }, far: { x: shell.x - 13, y: shell.y - 2 } }, handShapes: { near: "grip", far: "grip" }, handTurns: { near: -1.6, far: -1.6 } },
      marks: <ellipse cx={260 + S2 * shell.x} cy={Y2 + S2 * (shell.y + 2)} rx={S2 * 15} ry={S2 * 8} fill="#6f6a4a" />,
    },
    {
      x: 860,
      label: "near hand held palm up (handsTo + palmUp 1)",
      p: { x: 860, y: Y2, s: S2, f, lifeF: f, pose: "handsTo", poseStart: f - 40, design: "plate", age: 6, expression: "joyful", handTargets: { near: { x: 66, y: -70 } }, palmUp: 1 },
    },
    {
      x: 1460,
      label: "blinkAt: the blink of surprise (frame 2)",
      p: { x: 1460, y: Y2, s: S2, f, lifeF: f, pose: "handsTo", poseStart: f - 40, design: "plate", age: 6, expression: "surprised", prevExpression: "joyful", expressionStart: f - 3, blinkAt: f - 2, handTargets: { near: { x: 92, y: -8 } } },
    },
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #f6ecd6 0%, #e6d3ae 100%)" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          {faces.map((c, i) => (
            <clipPath key={c.label} id={`thqa-face-${i}`}>
              <rect x={i * 480 + 6} y={6} width={468} height={470} rx={12} />
            </clipPath>
          ))}
        </defs>
        {faces.map((c, i) => (
          <g key={c.label} clipPath={`url(#thqa-face-${i})`}>
            <rect x={i * 480 + 6} y={6} width={468} height={470} fill="#efe2c8" />
            <SeatedChild x={i * 480 + 240} y={1060} s={3.9} f={f} lifeF={f + 11 * i} pose="sitCross" design="plate" age={6} {...c.p} />
          </g>
        ))}
        {lower.map((c) => (
          <g key={c.label}>
            <Ground x={c.x} y={Y2} s={S2} />
            {c.marks}
            <SeatedChild {...c.p} />
          </g>
        ))}
      </svg>
      {faces.map((c, i) => (
        <Label key={c.label} x={i * 480 + 20} y={432} w={440} text={c.label} size={28} />
      ))}
      {lower.map((c) => (
        <Label key={c.label} x={c.x - 260} y={Y2 + 18} w={520} text={c.label} size={22} />
      ))}
    </AbsoluteFill>
  );
};

export const ThakurDesignQA: React.FC<ThakurDesignQAProps> = ({ sheet = "design" }) => {
  ensureBanglaFont();
  return sheet === "poses" ? <PoseSheet /> : sheet === "turns" ? <TurnSheet /> : sheet === "hands" ? <HandsSheet /> : sheet === "faces" ? <FacesSheet /> : sheet === "classic" ? <PoseSheet classic /> : <DesignSheet />;
};
