import React from "react";
import { useCurrentFrame } from "remotion";
import { clamp, EASE, flicker, hash, track } from "../../cinematic/core/anim";
import { Grade, Layer, Stage } from "../../cinematic/core/Stage";
import { Flame, Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { CAST } from "../../cinematic/rig/cast";
import { BASE_POSE, CastMember, Lighting, Pose, Puppet } from "../../cinematic/rig/Puppet";
import { BaidikBariDay } from "../../cinematic/sets/S01_DaySets";
import { Bolt, Rain, Splashes } from "../../cinematic/sets/S05_Sets";

/**
 * Series 2 · Episode 1 · Scene 03 — Manasa Puja Monsoon Evening at Baidik Bari.
 * Reuses the detailed Rig v2 `BaidikBariDay` exterior (regraded to cool slate storm)
 * + `Rain`, `Bolt`, `Splashes`, `CAST.charu`, and the Rig v2 `PAGOL` wandering mystic.
 * Local timeline (1140 frames):
 *   12..495   03a_Narrator_Charu.wav (Rain-swept Baidik Bari courtyard, Charushila in the arched doorway)
 *  511..788   03b_Pagol_Omen.wav (Lightning strike; ecstatic Pagol enters, raising arms & laughing)
 *  805..1105  03c_Charu_Wonder.wav (Pagol fades into the rain mist; slow push-in on Charushila in awe)
 */

const PAGOL: CastMember = {
  id: "pagol",
  age: "adult",
  sex: "m",
  height: 1.0,
  girth: 0.86,
  skin: "#b97a52",
  skinLight: "#d89a70",
  skinShade: "#8d5536",
  lips: "#94493f",
  hair: "#2a2420",
  hairLight: "#6a5a50",
  hairStyle: "tousled",
  outfit: "bare",
  top: "#b97a52",
  topLight: "#d89a70",
  topShade: "#8d5536",
  sleeve: "none",
  lower: "dhoti",
  lowerColor: "#c8712c",
  lowerShade: "#8a4818",
  lowerTrim: "#5a2b0d",
  dhotiLength: "knee",
  scarf: { color: "#b85c22", shade: "#7a3b14", trim: "#d68c4a", style: "drape" },
  seed: 73,
};

const STRIKES = [518, 650];
const flashAt = (f: number) => {
  let maxFlash = 0;
  for (const s of STRIKES) {
    const d = f - s;
    if (d >= 0 && d <= 12) {
      const v = d === 0 ? 0.6 : d === 1 ? 1 : 0.9 * Math.pow(clamp(1 - (d - 1) / 11), 2);
      maxFlash = Math.max(maxFlash, v);
    }
  }
  return maxFlash;
};

export const Scene03PagolMonsoonBaidikBari: React.FC = () => {
  const f = useCurrentFrame();
  const fl = flicker(f, 15);
  const flash = flashAt(f);

  const camZoom = track(f, [
    [0, 0.96],
    [495, 1.04],
    [790, 1.08],
    [1140, 1.22],
  ]);
  const camX = track(f, [
    [0, -40],
    [510, 0],
    [790, 70],
    [1140, 185],
  ]);
  const camY = track(f, [
    [0, -25],
    [510, 10],
    [1140, 35],
  ]);

  const pagolIn = EASE.out(clamp((f - 495) / 36));
  const pagolOut = 1 - EASE.inOut(clamp((f - 795) / 70));
  const pagolOpacity = Math.min(pagolIn, pagolOut);
  const pagolDance = f >= 510 && f <= 800 ? Math.sin(f * 0.22) : 0;

  const pagolPose: Pose = {
    ...BASE_POSE,
    bodyTurn: 0.35,
    headTurn: 0.25,
    lean: pagolDance * 8,
    headTilt: -8 + pagolDance * 6,
    headNod: pagolDance * 3,
    rS: -135 + pagolDance * 22,
    rE: -20,
    lS: -125 - pagolDance * 22,
    lE: -18,
    smile: 0.95,
  };

  const wonderT = EASE.inOut(clamp((f - 805) / 45));
  const charuPose: Pose = {
    ...BASE_POSE,
    bodyTurn: -0.35,
    headTurn: -0.3,
    lean: -3 * wonderT,
    headTilt: -2,
    headNod: Math.sin(f * 0.05) * 1.2,
    rS: -28 - 25 * wonderT,
    rE: -42 - 30 * wonderT,
    lS: -22,
    lE: -35,
    smile: 0.25 + 0.35 * wonderT,
  };

  const lampLight: Lighting = { keySide: -1, rim: "#ffba66", rimStrength: 0.72 * fl, rimSide: -1 };
  const stormLight: Lighting = { keySide: 1, rim: "#9eb8d8", rimStrength: 0.4 + 0.5 * flash, rimSide: 1 };

  return (
    <Stage cam={{ x: camX, y: camY, zoom: camZoom }}>
      <GlowDefs />
      <defs>
        <filter id="s2ep1-storm-grade">
          <feColorMatrix
            type="matrix"
            values="0.52 0.08 0.08 0 -0.04
                    0.06 0.58 0.14 0 -0.02
                    0.08 0.14 0.74 0  0.04
                    0    0    0    1  0"
          />
        </filter>
      </defs>

      {/* Storm Sky */}
      <Layer depth={0.1}>
        <rect x={-1000} y={-800} width={3920} height={1900} fill="#1b2432" />
        {Array.from({ length: 18 }, (_, i) => (
          <ellipse
            key={i}
            cx={-600 + hash(i * 2.3) * 3200 + f * 0.35}
            cy={-80 + hash(i * 4.1) * 360}
            rx={280 + hash(i * 6.7) * 320}
            ry={68 + hash(i * 8.1) * 45}
            fill={i % 2 ? "#283447" : "#3a4960"}
            opacity={0.78}
          />
        ))}
        {STRIKES.map((s, idx) => (
          <Bolt key={s} f={f} at={s} x={640 + idx * 280} seed={idx + 3} />
        ))}
      </Layer>

      {/* Reused Detailed Baidik Bari Exterior (regraded to cool slate storm) */}
      <Layer depth={0.45}>
        <defs>
          <filter id="s2ep1-storm-grade-layer">
            <feColorMatrix
              type="matrix"
              values="0.52 0.08 0.08 0 -0.04
                      0.06 0.58 0.14 0 -0.02
                      0.08 0.14 0.74 0  0.04
                      0    0    0    1  0"
            />
          </filter>
        </defs>
        <g filter="url(#s2ep1-storm-grade-layer)">
          <BaidikBariDay f={f} />
          <rect x={-700} y={740} width={3300} height={460} fill="#5c493a" />
        </g>

        {/* Warm flickering veranda lamp near Charushila */}
        <Glow x={1365} y={705} r={190} kind="warm" o={0.55 * fl} />
        <Flame x={1365} y={718} s={1.2} f={f} seed={21} />
      </Layer>

      {/* Characters in Courtyard & Veranda */}
      <Layer depth={0.76}>
        {pagolOpacity > 0.01 && (
          <g opacity={pagolOpacity}>
            <Puppet
              cast={PAGOL}
              x={810 + pagolIn * 85 + pagolDance * 14}
              y={895}
              scale={0.98}
              acting={() => pagolPose}
              talk={(fr) => (fr >= 511 && fr <= 788 ? 0.78 : 0)}
              light={stormLight}
              f={f}
            />
          </g>
        )}

        <Puppet
          cast={CAST.charu}
          x={1435}
          y={805}
          scale={0.92}
          flip
          acting={() => charuPose}
          talk={(fr) => (fr >= 805 && fr <= 1105 ? 0.52 : 0)}
          light={lampLight}
          f={f}
        />
      </Layer>

      {/* Heavy Monsoon Rain & Courtyard Splashes */}
      <Layer depth={0.94}>
        <Rain f={f} n={170} wind={-0.28} o={0.72} area={[-400, -300, 2720, 1500]} />
        <Splashes f={f} n={40} y0={810} y1={910} x0={200} x1={1720} o={0.75} />
        {flash > 0.02 && (
          <rect x={-600} y={-400} width={3120} height={1880} fill="#d8e8ff" opacity={flash * 0.35} />
        )}
      </Layer>
      <Grade vignette={0.44} />
    </Stage>
  );
};
