import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, track } from "../../cinematic/core/anim";
import { Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { GlowDefs } from "../../cinematic/fx/Fx";
import { CAST } from "../../cinematic/rig/cast";
import { BASE_POSE, CastMember, Lighting, Pose, Puppet } from "../../cinematic/rig/Puppet";
import { BaidikBariDay, DaySky, Palm } from "../../cinematic/sets/S01_DaySets";

/**
 * Series 2 · Episode 1 · Scene 02 — Kaulipara Ancestral Home on the Padma at Dawn.
 * Local timeline (1165 frames):
 *   12..441  02a_Narrator_Lineage.wav (Golden dawn pan across Kaulipara & Tulsi altar)
 *  457..733  02b_Harnath_Wife.wav (Water spurts from crack in courtyard earth; wife startles & warns)
 *  749..928  02c_Villager_Shock.wav (Villager rushes in shocked at the eroding Padma)
 *  942..1147 02d_Harnath_Wife_Lead.wav (Wife leads villagers decisively to safety)
 */

const HARNATH_WIFE: CastMember = {
  ...CAST.manorama,
  id: "harnath_wife",
  height: 0.98,
  top: "#f2e7d5",
  topLight: "#fff9ee",
  topShade: "#ccbba0",
  topTrim: "#b82e2e",
  lowerColor: "#f2e7d5",
  lowerShade: "#ccbba0",
  lowerTrim: "#b82e2e",
  seed: 29,
};

const VILLAGER: CastMember = {
  ...CAST.listenerA,
  id: "kaulipara_villager",
  height: 1.0,
  seed: 51,
};

const TulsiMancha: React.FC<{ x: number; y: number; f: number; spurt: number }> = ({ x, y, f, spurt }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x={-48} y={-24} width={96} height={24} rx={4} fill="#b8845a" />
    <rect x={-36} y={-88} width={72} height={66} rx={3} fill="#d6a57a" />
    <rect x={-42} y={-96} width={84} height={12} rx={3} fill="#e8be96" />
    <path
      d={`M 0 -96 Q ${-14 + Math.sin(f * 0.08) * 3} -128 -26 -142 Q -6 -124 0 -96 Z`}
      fill="#3c7a38"
    />
    <path
      d={`M 0 -96 Q ${14 + Math.cos(f * 0.08) * 3} -132 28 -146 Q 6 -124 0 -96 Z`}
      fill="#4b8f44"
    />
    <path
      d={`M 0 -96 Q ${Math.sin(f * 0.1) * 4} -144 0 -162 Q 10 -132 0 -96 Z`}
      fill="#2e682c"
    />
    <path d="M -95 14 L -62 24 L -38 18 L -14 28" stroke="#3b2618" strokeWidth={3} fill="none" opacity={0.8} />
    {spurt > 0.02 && (
      <g opacity={spurt}>
        <path
          d={`M -62 24 Q ${-68 - spurt * 12} ${24 - spurt * 65} ${-76 - spurt * 18} ${24 - spurt * 95}`}
          stroke="#c8e6f5"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M -62 24 Q ${-52 + spurt * 10} ${24 - spurt * 58} ${-42 + spurt * 16} ${24 - spurt * 80}`}
          stroke="#e8f6ff"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        {[0, 1, 2, 3, 4].map((k) => (
          <circle
            key={k}
            cx={-62 + (k - 2) * 16 * spurt}
            cy={24 - spurt * (45 + (k % 3) * 22) + Math.sin(f * 0.6 + k) * 6}
            r={4.5}
            fill="#dff2ff"
          />
        ))}
      </g>
    )}
  </g>
);

export const Scene02PadmaKaulipara: React.FC = () => {
  const f = useCurrentFrame();

  const camX = track(f, [
    [0, -140],
    [420, -20],
    [740, 40],
    [1165, 110],
  ]);
  const camZoom = track(f, [
    [0, 0.94],
    [450, 1.05],
    [740, 1.08],
    [1165, 1.02],
  ]);

  const spurtT = EASE.out(clamp((f - 420) / 20)) * (1 - EASE.in(clamp((f - 540) / 45)));
  const alarmT = EASE.inOut(clamp((f - 455) / 35));
  const villagerIn = EASE.out(clamp((f - 720) / 55));
  const leadT = EASE.inOut(clamp((f - 945) / 45));

  const wifePose: Pose = {
    ...BASE_POSE,
    bodyTurn: villagerIn > 0.2 ? 0.35 : -0.35,
    headTurn: villagerIn > 0.2 ? 0.3 : -0.3,
    lean: 10 * (1 - alarmT) - 4 * alarmT,
    headTilt: 8 * (1 - alarmT) - 4 * alarmT,
    headNod: Math.sin(f * 0.06) * 1.4,
    rS: -30 - 55 * alarmT - 20 * leadT,
    rE: -28 - 22 * alarmT,
    lS: -20 - 35 * leadT,
    lE: -20,
    smile: 0.05,
    gasp: 0.4 * alarmT * (1 - leadT),
  };

  const villagerPose: Pose = {
    ...BASE_POSE,
    bodyTurn: -0.35,
    headTurn: -0.3,
    lean: -6,
    headTilt: -3,
    headNod: Math.sin(f * 0.07 + 1) * 1.5,
    rS: -52,
    rE: -45,
    lS: -40,
    lE: -35,
    smile: 0,
    gasp: 0.35,
  };

  const dawnLight: Lighting = { keySide: 1, rim: "#ffe2a8", rimStrength: 0.45, rimSide: 1 };

  return (
    <Stage cam={{ x: camX, y: 15, zoom: camZoom }}>
      <GlowDefs />
      <Layer depth={0.12}>
        <DaySky f={f} sunX={1520} sunY={220} />
      </Layer>

      {/* Distant Baidik-style Ancestral Home & Swollen Padma River */}
      <Layer depth={0.42}>
        {/* Seamless village ground meadow connecting house to riverbank */}
        <rect x={-600} y={580} width={3200} height={600} fill="#8a9a5b" />
        <g transform="translate(-140, -60) scale(0.84)">
          <BaidikBariDay f={f} />
        </g>
        {/* Padma river sweeping naturally along the right bank */}
        <path
          d="M 1140 695 Q 1480 670 2320 690 L 2320 1180 L 1040 1180 Q 1120 920 1140 695 Z"
          fill="#4a7c9b"
          opacity={0.95}
        />
        {[0, 1, 2, 3, 4].map((w) => (
          <path
            key={w}
            d={`M ${1180 + ((f * 1.4 + w * 180) % 800)} ${740 + w * 38} Q ${
              1260 + ((f * 1.4 + w * 180) % 800)
            } ${732 + w * 38} ${1340 + ((f * 1.4 + w * 180) % 800)} ${740 + w * 38}`}
            stroke="#c6e4f2"
            strokeWidth={3}
            fill="none"
            opacity={0.55}
          />
        ))}
      </Layer>

      {/* Sloped Earthen Courtyard Foreground & Tulsi Altar */}
      <Layer depth={0.72}>
        <path
          d="M -500 720 L 1180 720 Q 1260 720 1320 820 L 1460 1180 L -500 1180 Z"
          fill="#b89066"
        />
        <path d="M -500 720 L 1180 720 Q 1255 720 1315 815" stroke="#d6ae82" strokeWidth={10} fill="none" />
        <TulsiMancha x={670} y={845} f={f} spurt={spurtT} />

        <Puppet
          cast={HARNATH_WIFE}
          x={820 + leadT * 60}
          y={860}
          scale={1.08}
          flip={villagerIn <= 0.2}
          acting={() => wifePose}
          talk={(fr) => ((fr >= 457 && fr <= 733) || (fr >= 942 && fr <= 1147) ? 0.68 : 0)}
          light={dawnLight}
          f={f}
        />

        {villagerIn > 0.01 && (
          <g opacity={villagerIn}>
            <Puppet
              cast={VILLAGER}
              x={1360 - villagerIn * 210}
              y={868}
              scale={1.06}
              flip
              acting={() => villagerPose}
              talk={(fr) => (fr >= 749 && fr <= 928 ? 0.65 : 0)}
              light={dawnLight}
              f={f}
            />
          </g>
        )}
      </Layer>

      <Layer depth={0.94}>
        <Palm x={1760} y={960} s={1.2} f={f} seed={12} />
      </Layer>
      <Grade vignette={0.28} />
    </Stage>
  );
};
