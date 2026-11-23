import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ensureBanglaFont, BN_FONT } from "../../fonts";
import { RefTracedPose, ThakurRefTraced } from "../ThakurRefTraced";

/**
 * Balak Thakur gesture check (director review): the existing traced rig (ThakurRefTraced), unchanged, in every
 * seated gesture it supports.
 *  - ThakurGestureSheet: all seven gestures side by side, each easing in from the serene seated pose and holding
 *    (life keeps going: breathing, blinks).
 *  - ThakurGestureReel: one larger Balak moving through the gestures in turn (blending and timing check).
 */

const GESTURES: Array<{ pose: RefTracedPose; bn: string; en: string }> = [
  { pose: "sitCross", bn: "শান্ত হয়ে বসা", en: "Serene seat (plate 01)" },
  { pose: "bowHands", bn: "নমস্কার", en: "Namaskar" },
  { pose: "bless", bn: "আশীর্বাদ (অভয়)", en: "Blessing (abhaya)" },
  { pose: "palmRaise", bn: "কথা বলা / বোঝানো", en: "Speaking, teaching" },
  { pose: "pickLeaf", bn: "ফুল তোলা", en: "Reaching for a flower" },
  { pose: "placeFlowerOnFoot", bn: "পায়ে ফুল রাখা", en: "Flower on his foot" },
  { pose: "pour", bn: "জল ঢালা", en: "Pouring water" },
];

const PAPER = "#f3e6cc";

const Label: React.FC<{ x: number; y: number; bn: string; en: string; size?: number }> = ({ x, y, bn, en, size = 1 }) => (
  <g>
    <text x={x} y={y} textAnchor="middle" fontFamily={BN_FONT} fontWeight={600} fontSize={30 * size} fill="#3a2414">
      {bn}
    </text>
    <text x={x} y={y + 28 * size} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={17 * size} fill="#7a5a40">
      {en}
    </text>
  </g>
);

const Paper: React.FC = () => (
  <>
    <defs>
      <radialGradient id="gq-paper" cx="50%" cy="42%" r="75%">
        <stop offset="0%" stopColor="#fbf2de" />
        <stop offset="100%" stopColor="#e4d0ac" />
      </radialGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#gq-paper)" />
  </>
);

/** All seven gestures at once (4 + 3 grid). Each eases in from the seated pose at frame 12 and holds. */
export const ThakurGestureSheet: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const cells = GESTURES.map((g, i) => {
    const row = i < 4 ? 0 : 1;
    const col = row === 0 ? i : i - 4;
    const n = row === 0 ? 4 : 3;
    const cw = 1920 / n;
    return { ...g, cx: cw * col + cw / 2, base: row === 0 ? 452 : 972, ly: row === 0 ? 506 : 1026 };
  });
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Paper />
        <line x1={0} y1={540} x2={1920} y2={540} stroke="#c9b08a" strokeWidth={2} opacity={0.6} />
        {cells.map((c, i) => (
          <g key={c.pose}>
            <ellipse cx={c.cx} cy={c.base + 4} rx={150} ry={16} fill="#8a6a48" opacity={0.16} />
            <ThakurRefTraced
              x={c.cx}
              y={c.base}
              s={0.4}
              f={f}
              lifeF={f + i * 17}
              pose={c.pose}
              prevPose={c.pose === "sitCross" ? undefined : "sitCross"}
              poseStart={12}
              footFlowers={c.pose === "placeFlowerOnFoot" ? Math.min(2, Math.floor(f / 50)) : 0}
              halo={0.45}
            />
            <Label x={c.cx} y={c.ly - 470 + 470} bn={c.bn} en={c.en} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const GESTURE_REEL_STEP = 72; // 3 s per gesture
export const GESTURE_REEL_FRAMES = GESTURE_REEL_STEP * GESTURES.length + 24;

/** One Balak moving through every gesture in turn (3 s each), blending from the previous one. */
export const ThakurGestureReel: React.FC = () => {
  ensureBanglaFont();
  const f = useCurrentFrame();
  const i = Math.min(GESTURES.length - 1, Math.floor(f / GESTURE_REEL_STEP));
  const g = GESTURES[i];
  const prev = i > 0 ? GESTURES[i - 1].pose : undefined;
  const start = i * GESTURE_REEL_STEP;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Paper />
        <ellipse cx={960} cy={884} rx={330} ry={34} fill="#8a6a48" opacity={0.16} />
        <ThakurRefTraced
          x={960}
          y={880}
          s={0.85}
          f={f}
          pose={g.pose}
          prevPose={prev}
          poseStart={start}
          footFlowers={g.pose === "placeFlowerOnFoot" ? Math.min(2, Math.floor((f - start) / 30)) : 0}
          halo={0.5}
        />
        <Label x={960} y={980} bn={`${i + 1}. ${g.bn}`} en={g.en} size={1.25} />
      </svg>
    </AbsoluteFill>
  );
};
