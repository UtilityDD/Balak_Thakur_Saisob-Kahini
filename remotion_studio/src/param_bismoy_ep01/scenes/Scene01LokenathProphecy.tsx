import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, flicker, hash, track } from "../../cinematic/core/anim";
import { Motes } from "../../cinematic/divine/Divine";
import { Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { Rain } from "../../cinematic/sets/S05_Sets";
import { LipSyncVideo } from "../LipSyncVideo";
import { KineticPlate } from "../KineticPlate";

/**
 * Series 2 · Episode 1 · Scene 01 (1776 frames = 74.0s @ 24fps)
 * Broadcast 2D Studio Ghibli / TV-Anime Implementation with:
 *   - Lady Narrator (`Sola`) with contextually bridged Bengali storytelling (`01a_Narrator_1919.wav`, f=12..640).
 *   - 2-Angle Live 1919 Cyclone Sequence (`Shot 1A-1` wide river storm f=0..168 + `Shot 1A-2` close tossing nouka boat & banyan f=162..325)
 *     featuring damped thunder camera-shake, rotational wind buffeting, 3-plane depth rain, flying banyan leaves, rolling river fog,
 *     and dynamic lightning bolt illumination.
 *   - 2-Angle Barodi Ashram Walk-Through Transition (`Shot 1B-0` outer banyan sanctuary, diya path, Tulsi Mancha & brass bell f=312..448
 *     + `Shot 1B-1` inner veranda with sacred smoldering dhuni, smoking dhunuchi, brass kamandalu & wooden khadaun sandals f=436..562)
 *     before arriving at Baba Lokenath's meditation seat (`Shot 1B-Idle` f=550..651).
 *   - True 4-Plane 2.5D Depth Parallax across all shots:
 *     * Plane 0 (0.45x): Far sky / moon / stars / distant lightning glow
 *     * Plane 1 (1.00x): Studio Ghibli painted plate / JoyVASA 24.000fps neural lip-sync video
 *     * Plane 2 (1.38x): Mid-foreground rolling mist banks, Gaussian-blurred dhunuchi incense wisps, flying storm leaves & fireflies
 *     * Plane 3 (1.75x, blurred DOF): Foreground silhouette framing elements (thrashing storm palm fronds, hanging banyan aerial roots
 *       `jhuri`, terracotta veranda pillars, and warm diya bokeh orbs).
 */

type SceneEnvironment = "storm_wide" | "storm_boat" | "ashram_banyan" | "ashram_dhuni" | "ashram_sanctum";

/** Plane 2 (1.38x parallax): Mid-foreground atmospheric mist, flying storm leaves, or soft Gaussian-blurred dhunuchi incense smoke. */
const MidgroundParallaxPlane: React.FC<{
  env: SceneEnvironment;
  camX: number;
  camY: number;
  camScale: number;
  f: number;
  fl: number;
}> = ({ env, camX, camY, camScale, f, fl }) => {
  const px = camX * 1.38;
  const py = camY * 1.38;
  const ps = 1 + (camScale - 1) * 1.25;
  const isStorm = env === "storm_wide" || env === "storm_boat";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        transform: `translate(${px}px, ${py}px) scale(${ps})`,
        transformOrigin: "50% 50%",
      }}
    >
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id="s2-soft-mist-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
          <filter id="s2-dhunuchi-wisp-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>

        {isStorm ? (
          <>
            {/* Rolling river fog / cyclone spray banks */}
            {[0, 1, 2].map((i) => {
              const drift = ((f * (2.6 + i * 0.7) + i * 620) % 2600) - 400;
              return (
                <ellipse
                  key={`fog-${i}`}
                  cx={drift}
                  cy={680 + i * 110}
                  rx={520 + i * 90}
                  ry={75 + i * 18}
                  fill="#9cb8cc"
                  opacity={0.14 + (i % 2) * 0.05}
                  filter="url(#s2-soft-mist-blur)"
                />
              );
            })}

            {/* Mid-near wind-whipped rain sheet */}
            <Rain f={f + 37} n={130} wind={-0.42} o={0.52} area={[-240, -120, 2400, 1320]} />

            {/* Wind-blown flying banyan & palm leaves whipping across the cyclone */}
            {Array.from({ length: 16 }, (_, i) => {
              const speed = 18 + (i % 5) * 4.5;
              const lx = 2200 - ((f * speed + i * 210) % 2500);
              const ly = 120 + ((i * 173 + f * (3.2 + (i % 3))) % 860) + Math.sin(f * 0.18 + i) * 28;
              const rot = (f * (7 + (i % 4) * 3) + i * 47) % 360;
              const sc = 0.7 + (i % 4) * 0.25;
              return (
                <g key={`leaf-${i}`} transform={`translate(${lx}, ${ly}) rotate(${rot}) scale(${sc})`} opacity={0.78}>
                  <path d="M -18 0 Q -4 -10 18 0 Q -4 10 -18 0 Z" fill="#0d1814" />
                  <path d="M -22 0 L 18 0" stroke="#1c2e26" strokeWidth={1.2} />
                </g>
              );
            })}
          </>
        ) : (
          <>
            {/* Soft drifting courtyard/veranda ground mist */}
            {[0, 1].map((i) => {
              const mx = 420 + i * 980 + Math.sin(f * 0.015 + i * 2) * 140;
              return (
                <ellipse
                  key={`ashram-mist-${i}`}
                  cx={mx}
                  cy={890 + i * 45}
                  rx={560}
                  ry={68}
                  fill="#ffd89c"
                  opacity={0.08 * fl}
                  filter="url(#s2-soft-mist-blur)"
                />
              );
            })}

            {/* Authentic Gaussian-blurred curling dhunuchi / dhuni incense smoke wisps (NEVER hard ovals) */}
            {(env === "ashram_dhuni" || env === "ashram_sanctum") &&
              [0, 1].map((k) => {
                const baseX = env === "ashram_dhuni" ? 1160 + k * 235 : 1040 + k * 90;
                const baseY = env === "ashram_dhuni" ? 765 : 860;
                const rise = (f * 1.15 + k * 110) % 320;
                const sway = Math.sin(f * 0.04 + k * 1.9) * 30;
                const fade = Math.sin((rise / 320) * Math.PI);
                return (
                  <path
                    key={`wisp-${k}`}
                    d={`M ${baseX} ${baseY - rise * 0.3} Q ${baseX + sway} ${baseY - rise * 0.7} ${baseX - sway * 0.7
                      } ${baseY - rise * 1.15}`}
                    stroke="#ffe9c8"
                    strokeWidth={32 + k * 8}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.11 * fade * fl}
                    filter="url(#s2-dhunuchi-wisp-blur)"
                  />
                );
              })}

            {/* Rising warm dhuni ember sparks directly above the sacred dhuni fire pit (x=1110..1235) in Shot 1B-1 */}
            {env === "ashram_dhuni" &&
              Array.from({ length: 14 }, (_, i) => {
                const cycle = (f * (1.4 + (i % 4) * 0.35) + i * 41) % 240;
                const ex = 1110 + (i % 7) * 20 + Math.sin(f * 0.09 + i) * 16;
                const ey = 775 - cycle * 1.5;
                const eo = Math.sin((cycle / 240) * Math.PI) * 0.85;
                return <circle key={`ember-${i}`} cx={ex} cy={ey} r={2.2 + (i % 2)} fill="#ff9e3b" opacity={eo} />;
              })}
          </>
        )}
      </svg>
    </div>
  );
};

/** Plane 3 (1.75x parallax, blurred DOF): Foreground framing silhouettes & warm bokeh creating true 2.5D depth separation. */
const ForegroundDOFPlane: React.FC<{
  env: SceneEnvironment;
  camX: number;
  camY: number;
  camScale: number;
  f: number;
}> = ({ env, camX, camY, camScale, f }) => {
  const px = camX * 1.75;
  const py = camY * 1.75;
  const ps = 1 + (camScale - 1) * 1.55;
  const isStorm = env === "storm_wide" || env === "storm_boat";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        transform: `translate(${px}px, ${py}px) scale(${ps})`,
        transformOrigin: "50% 50%",
        filter: isStorm ? "blur(5px)" : "blur(8px)",
      }}
    >
      {isStorm ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* Thrashing foreground palm fronds & banana leaf silhouettes framing left & right edges */}
          {[0, 1, 2, 3].map((i) => {
            const whip = Math.sin(f * 0.24 + i * 1.3) * 14 + Math.cos(f * 0.37 + i) * 7;
            return (
              <path
                key={`fg-palm-l-${i}`}
                d={`M -140 ${80 + i * 130} Q ${140 + whip} ${30 + i * 120 + whip} ${310 + whip * 1.4} ${140 + i * 135 + whip * 1.2
                  } Q ${120 + whip} ${135 + i * 130} -140 ${165 + i * 130} Z`}
                fill="#050b0e"
                opacity={0.82}
              />
            );
          })}
          {[0, 1, 2].map((i) => {
            const whip = Math.sin(f * 0.26 + i * 1.7 + 2) * 16;
            return (
              <path
                key={`fg-palm-r-${i}`}
                d={`M 2060 ${120 + i * 160} Q ${1770 - whip} ${85 + i * 155 + whip} ${1610 - whip * 1.3} ${195 + i * 165 + whip
                  } Q ${1790 - whip} ${190 + i * 160} 2060 ${210 + i * 160} Z`}
                fill="#050b0e"
                opacity={0.78}
              />
            );
          })}
          {/* Fast, large foreground rain streaks right in front of the lens */}
          <Rain f={f * 1.35 + 91} n={65} wind={-0.46} o={0.45} area={[-260, -140, 2440, 1340]} />
        </svg>
      ) : env === "ashram_banyan" ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* Hanging foreground banyan aerial roots (jhuri) ONLY on the left banyan-trunk edge + top canopy arch */}
          <path d="M -160 -80 Q 380 85 880 15 Q 1340 45 1620 -90 L -160 -140 Z" fill="#07050a" opacity={0.82} />
          {[-20, 45, 115].map((rx, idx) => {
            const sway = Math.sin(f * 0.035 + idx * 1.4) * 7;
            const len = idx === 0 ? 960 : idx === 1 ? 740 : 540;
            return (
              <path
                key={`jhuri-${rx}`}
                d={`M ${rx} -40 Q ${rx + 14 + sway} ${len * 0.45} ${rx - 8 + sway * 1.3} ${len}`}
                stroke="#08050a"
                strokeWidth={idx === 0 ? 42 : idx === 1 ? 24 : 15}
                strokeLinecap="round"
                fill="none"
                opacity={0.84}
              />
            );
          })}
        </svg>
      ) : env === "ashram_dhuni" ? (
        <>
          {/* Foreground terracotta/wooden veranda pillars on both edges sweeping past as camera glides through veranda */}
          <div
            style={{
              position: "absolute",
              left: -110,
              top: -60,
              width: 175,
              height: 1200,
              background: "linear-gradient(90deg, rgba(10,5,2,0.92) 0%, rgba(28,14,7,0.58) 68%, transparent 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -120,
              top: -60,
              width: 165,
              height: 1200,
              background: "linear-gradient(270deg, rgba(10,5,2,0.88) 0%, rgba(28,14,7,0.5) 68%, transparent 100%)",
            }}
          />
        </>
      ) : (
        /* Ashram Sanctum foreground pillar silhouette */
        <div
          style={{
            position: "absolute",
            left: -105,
            top: -50,
            width: 150,
            height: 1180,
            background: "linear-gradient(90deg, rgba(12,6,3,0.88) 0%, rgba(26,13,7,0.45) 70%, transparent 100%)",
          }}
        />
      )}

      {/* Out-of-focus foreground diya / lantern bokeh orbs */}
      {!isStorm &&
        [0, 1, 2, 3].map((i) => {
          const bx = 180 + i * 520 + Math.sin(f * 0.025 + i * 2.1) * 34;
          const by = 160 + (i % 2) * 560 + Math.cos(f * 0.02 + i) * 22;
          return (
            <div
              key={`bokeh-${i}`}
              style={{
                position: "absolute",
                left: bx,
                top: by,
                width: 64 + (i % 3) * 22,
                height: 64 + (i % 3) * 22,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,206,118,0.22) 0%, rgba(255,168,76,0) 72%)",
              }}
            />
          );
        })}
    </div>
  );
};

export const Scene01LokenathProphecy: React.FC = () => {
  const f = useCurrentFrame();
  const fl = flicker(f, 11);

  // Lightning strike frames across Shot 1A-1 (0..168) and Shot 1A-2 (168..320)
  const strikes = [58, 134, 210, 276];
  let stormFlash = 0;
  let shakeX = 0;
  let shakeY = 0;
  let shakeRot = 0;

  for (const s of strikes) {
    const d = f - s;
    if (d >= 0 && d <= 14) {
      stormFlash = Math.max(stormFlash, d <= 2 ? 1.0 : Math.pow(clamp(1 - (d - 2) / 11), 2));
    }
    // Damped physical thunder camera-shake on each lightning strike
    if (d >= 1 && d <= 26) {
      const env = Math.exp(-d * 0.16);
      shakeX += Math.sin(d * 2.5 + s) * 13 * env;
      shakeY += Math.cos(d * 2.9 + s) * 9 * env;
      shakeRot += Math.sin(d * 2.1) * 0.45 * env;
    }
  }

  // Continuous wind-buffeting vibration & boat-swell roll during the 1919 cyclone (f < 325)
  if (f < 325) {
    const stormFade = 1 - clamp((f - 305) / 20);
    shakeX += Math.sin(f * 0.42) * 2.4 * stormFade;
    shakeY += Math.cos(f * 0.55) * 1.8 * stormFade;
    if (f >= 162) {
      // Swell roll during close riverbank & tossing nouka boat shot (1A-2)
      shakeRot += Math.sin(f * 0.14) * 0.85 * stormFade;
    }
  }

  // Cross-dissolve envelopes between the 5 opening shots (f = 0..651)
  const shot1A2Fade = EASE.inOut(clamp((f - 160) / 16));
  const shot1B0Fade = EASE.inOut(clamp((f - 312) / 20));
  const shot1B1Fade = EASE.inOut(clamp((f - 436) / 20));
  const shot1BIdleFade = EASE.inOut(clamp((f - 550) / 20));
  const outroAshramFade = EASE.inOut(clamp((f - 1720) / 24));
  const clothBloom = EASE.out(clamp((f - 780) / 14)) * (1 - EASE.inOut(clamp((f - 845) / 28)));

  // Active environment for Plane 2 & Plane 3 multi-plane parallax
  let env: SceneEnvironment = "ashram_sanctum";
  if (f < 168) env = "storm_wide";
  else if (f < 322) env = "storm_boat";
  else if (f < 446) env = "ashram_banyan";
  else if (f < 560) env = "ashram_dhuni";

  // Dynamic camera trajectory (pan + dolly) per shot driving all 4 parallax planes
  let camX = 0;
  let camY = 0;
  let camScale = 1.05;

  if (f < 168) {
    // Shot 1A-1: Wide 1919 Cyclone over Padma/Meghna
    camScale = track(f, [[0, 1.06], [168, 1.15]]);
    camX = track(f, [[0, 34], [168, -28]]);
    camY = track(f, [[0, -10], [168, 8]]);
  } else if (f < 322) {
    // Shot 1A-2: Close riverbank & tossing nouka boat in gale
    camScale = track(f, [[168, 1.05], [322, 1.16]]);
    camX = track(f, [[168, -32], [322, 34]]);
    camY = track(f, [[168, 10], [322, -10]]);
  } else if (f < 446) {
    // Shot 1B-0: Barodi Ashram outer banyan gateway, diya path, Tulsi Mancha & temple bell
    camScale = track(f, [[322, 1.04], [446, 1.15]]);
    camX = track(f, [[322, 30], [446, -28]]);
    camY = track(f, [[322, 8], [446, -6]]);
  } else if (f < 560) {
    // Shot 1B-1: Barodi Ashram inner veranda — sacred dhuni, dhunuchi smoke, kamandalu & khadaun sandals
    camScale = track(f, [[446, 1.04], [560, 1.15]]);
    camX = track(f, [[446, -28], [560, 28]]);
    camY = track(f, [[446, 6], [560, -8]]);
  } else if (f < 725) {
    // Shot 1B-Idle (560..651) & Shot 1B-Speak (651..725): Arriving at Baba Lokenath & Jogesh
    camScale = track(f, [[560, 1.03], [725, 1.12]]);
    camX = track(f, [[560, 22], [725, -18]]);
  } else if (f < 779) {
    camScale = track(f, [[725, 1.03], [779, 1.09]]);
    camX = track(f, [[725, 10], [779, -10]]);
  } else if (f < 845) {
    camScale = track(f, [[779, 1.08], [845, 1.17]]);
    camY = track(f, [[779, 10], [845, -10]]);
  } else if (f < 1015) {
    camScale = track(f, [[845, 1.04], [1015, 1.14]]);
    camX = track(f, [[845, 26], [1015, -24]]);
  } else if (f < 1235) {
    camScale = track(f, [[1015, 1.03], [1235, 1.12]]);
    camX = track(f, [[1015, 12], [1235, -12]]);
  } else if (f < 1525) {
    camScale = track(f, [[1235, 1.03], [1525, 1.12]]);
    camX = track(f, [[1235, -16], [1525, 16]]);
  } else if (f < 1744) {
    camScale = track(f, [[1525, 1.04], [1744, 1.11]]);
    camX = track(f, [[1525, 10], [1744, -10]]);
  } else {
    camScale = track(f, [[1720, 1.10], [1776, 1.03]]);
  }

  const totalX = camX + shakeX;
  const totalY = camY + shakeY;

  return (
    <AbsoluteFill style={{ backgroundColor: "#090712", overflow: "hidden" }}>
      {/* PLANE 0 (0.45x Parallax): Deep Sky / Distant Horizon Glow */}
      <div
        style={{
          position: "absolute",
          inset: -60,
          transform: `translate(${totalX * 0.45}px, ${totalY * 0.45}px) scale(${1 + (camScale - 1) * 0.45})`,
          background:
            f < 322
              ? "radial-gradient(circle at 65% 24%, #1d2d3e 0%, #0a1018 70%)"
              : "radial-gradient(circle at 50% 25%, #24150c 0%, #09060c 75%)",
          pointerEvents: "none",
        }}
      />

      {/* PLANE 1 (1.00x Parallax): Main Painted Studio Plates & 24.000fps Time-Locked JoyVASA Neural Streams */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${totalX}px, ${totalY}px) scale(${camScale}) rotate(${shakeRot}deg)`,
          transformOrigin: "50% 48%",
        }}
      >
        {/* SHOT 1A-1 (0..176): Wide 1919 Cyclone East Bengal (Clean Sky by Default, Bolt Flashes on Thunder!) */}
        {f < 176 && (
          <AbsoluteFill>
            <Img
              src={staticFile("images/s2_ep01/4k/plate_1a_storm_clean.jpg")}
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
            {stormFlash > 0.01 && (
              <Img
                src={staticFile("images/s2_ep01/4k/plate_1a_storm_bengal.jpg")}
                style={{ width: 1920, height: 1080, objectFit: "cover", opacity: stormFlash }}
              />
            )}
          </AbsoluteFill>
        )}

        {/* SHOT 1A-2 (160..332): Close Riverbank Storm — Tossing Wooden Nouka Boat, Thrashing Banyan & Lantern Hut */}
        {f >= 160 && f < 332 && (
          <AbsoluteFill style={{ opacity: shot1A2Fade }}>
            <Img
              src={staticFile("images/s2_ep01/4k/plate_1a2_storm_boat.jpg")}
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
                filter: stormFlash > 0.02 ? `brightness(${1 + stormFlash * 0.45}) contrast(${1 + stormFlash * 0.12})` : undefined,
              }}
            />
          </AbsoluteFill>
        )}

        {/* Far-Plane Rain & Lightning Sky Flash during Storm (0..332) */}
        {f < 332 && (
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <Rain f={f} n={140} wind={-0.34} o={0.55} area={[-200, -100, 2320, 1280]} />
            {stormFlash > 0.02 && (
              <rect x={0} y={0} width={1920} height={1080} fill="#dcecff" opacity={stormFlash * 0.26} />
            )}
          </svg>
        )}

        {/* SHOT 1B-0 (312..456): Barodi Ashram Outer Banyan Sanctuary, Glowing Diya Path, Tulsi Mancha & Hanging Bell */}
        {f >= 312 && f < 456 && (
          <AbsoluteFill style={{ opacity: shot1B0Fade }}>
            <Img
              src={staticFile("images/s2_ep01/4k/plate_1b0_ashram_banyan.jpg")}
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 1B-1 (436..570): Barodi Ashram Inner Veranda — Smoldering Sacred Dhuni, Dhunuchi, Kamandalu & Khadaun */}
        {f >= 436 && f < 570 && (
          <AbsoluteFill style={{ opacity: shot1B1Fade }}>
            <Img
              src={staticFile("images/s2_ep01/4k/plate_1b1_ashram_dhuni.jpg")}
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 1B-IDLE (550..651): Arriving at Living Breathing/Blinking Baba Lokenath & Bowing Jogesh Chowdhury */}
        {f >= 550 && f < 651 && (
          <AbsoluteFill style={{ opacity: shot1BIdleFade }}>
            <Sequence from={328} durationInFrames={324}>
              <OffthreadVideo
                src={staticFile("video/s2_ep01/p1b_idle_24.mp4")}
                muted
                style={{ width: 1920, height: 1080, objectFit: "cover" }}
              />
            </Sequence>
          </AbsoluteFill>
        )}

        {/* SHOT 1B-SPEAK (651..725): Barodi Ashram Wide as Baba Lokenath Begins Speaking */}
        {f >= 651 && f < 725 && (
          <LipSyncVideo src="video/s2_ep01/p1b_01b_24.mp4" voice="01b_Lokenath_Prophecy.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1C-1 (725..779): Continuity-Matched Close-Up on Baba Lokenath ("আজ আমি তোকে মন্ত্রদীক্ষা দেব না...") */}
        {f >= 725 && f < 779 && (
          <LipSyncVideo src="video/s2_ep01/p1c_01b_24.mp4" voice="01b_Lokenath_Prophecy.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1D (779..845): Extreme Tactile Insert — Slender Hand Lifting Glowing Ochre Cloth */}
        {f >= 779 && f < 845 && (
          <AbsoluteFill>
            <Img
              src={staticFile("images/s2_ep01/4k/plate_1d_ochre_insert.jpg")}
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 1E (845..930): Dual-Character Handover Two-Shot ("এই গেরুয়া কাপড়খানি সযত্নে রেখে দে...") */}
        {f >= 845 && f < 930 && (
          <LipSyncVideo src="video/s2_ep01/p1e_dual_01b_24.mp4" voice="01b_Lokenath_Prophecy.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1G-1 (930..1015): Disciple Jogesh Chowdhury Devotional Listening with Real Eye Blinks & Natural Kinematics */}
        {f >= 930 && f < 1015 && (
          <AbsoluteFill>
            <Sequence from={930} durationInFrames={85}>
              <OffthreadVideo
                src={staticFile("video/s2_ep01/plate_b_jogesh_half_jogesh_listen.mp4")}
                muted
                style={{ width: 1920, height: 1080, objectFit: "cover" }}
              />
            </Sequence>
          </AbsoluteFill>
        )}

        {/* SHOT 1C-2 (1015..1105): Close-Up on Baba Lokenath Delivering the Grand Prophecy ("প্রায় অর্ধশত বছর পরে আসছেন এক পূর্ণব্রহ্ম অবতার!") */}
        {f >= 1015 && f < 1105 && (
          <LipSyncVideo src="video/s2_ep01/p1c_01b_24.mp4" voice="01b_Lokenath_Prophecy.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1H (1105..1170): Dramatic Over-The-Shoulder past Jogesh to Baba Lokenath */}
        {f >= 1105 && f < 1170 && (
          <AbsoluteFill>
            <KineticPlate
              src="images/s2_ep01/plate_1c_lokenath_ots.jpg"
              breathSpeed={0.24}
              breathAmp={2.8}
              swayAmp={1.8}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 1C-2B (1170..1235): Intimate Close-Up on Baba Lokenath ("তাঁর কাছেই তোর মুক্তি!") */}
        {f >= 1170 && f < 1235 && (
          <LipSyncVideo src="video/s2_ep01/p1c_01b_24.mp4" voice="01b_Lokenath_Prophecy.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1F-1 (1235..1325): Clean-Shaven Jogesh Chowdhury Reverse OTS Close-Up Speaking ("অর্ধশত বছর পরে… স্বয়ং পূর্ণব্রহ্ম?") */}
        {f >= 1235 && f < 1325 && (
          <LipSyncVideo src="video/s2_ep01/p1f_01c_24.mp4" voice="01c_Jogesh_Awe.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1C-LISTEN (1325..1415): Cut to Baba Lokenath Listening in Profound Stillness & Compassion */}
        {f >= 1325 && f < 1415 && (
          <AbsoluteFill>
            <KineticPlate
              src="images/s2_ep01/plate_1c_lokenath_matched.jpg"
              breathSpeed={0.22}
              breathAmp={2.6}
              swayAmp={1.6}
              eyes={{ left: [1036, 337], right: [1142, 345], rx: 20, ry: 5, color: "#3a2214" }}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 1F-2 (1415..1525): Jogesh Speaking with Devotional Longing ("বাবা, আমি কি ততদিন বেঁচে থাকব তাঁর দেখা পাওয়ার জন্য?") */}
        {f >= 1415 && f < 1525 && (
          <LipSyncVideo src="video/s2_ep01/p1f_01c_24.mp4" voice="01c_Jogesh_Awe.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1C-3 (1525..1615): Baba Lokenath's Warm Loving Smile Speaking ("নিশ্চয়ই থাকবি!") */}
        {f >= 1525 && f < 1615 && (
          <LipSyncVideo src="video/s2_ep01/p1c_01d_24.mp4" voice="01d_Lokenath_Smile.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1G-2 (1615..1675): Cut to Jogesh Listening with Devotional Gratitude & Awe with Real Eye Blinks */}
        {f >= 1615 && f < 1675 && (
          <AbsoluteFill>
            <Sequence from={1615} durationInFrames={60}>
              <OffthreadVideo
                src={staticFile("video/s2_ep01/plate_b_jogesh_half_jogesh_listen.mp4")}
                startFrom={120}
                muted
                style={{ width: 1920, height: 1080, objectFit: "cover" }}
              />
            </Sequence>
          </AbsoluteFill>
        )}

        {/* SHOT 1C-3B (1675..1725): Final Serene Divine Smile ("তাঁর ডাক এলে কালের সাধ্য নেই তোকে আটকে রাখে!") */}
        {f >= 1675 && f < 1725 && (
          <LipSyncVideo src="video/s2_ep01/p1c_01d_24.mp4" voice="01d_Lokenath_Smile.wav" scene="01_lokenath_prophecy" />
        )}

        {/* SHOT 1B-OUTRO (1725..1776): Serene Pull-Back Dissolve to Living Barodi Ashram Wide */}
        {f >= 1725 && (
          <AbsoluteFill style={{ opacity: outroAshramFade }}>
            <Sequence from={1720} durationInFrames={60}>
              <OffthreadVideo
                src={staticFile("video/s2_ep01/p1b_idle_24.mp4")}
                muted
                style={{ width: 1920, height: 1080, objectFit: "cover" }}
              />
            </Sequence>
          </AbsoluteFill>
        )}

        {/* LIVING ASHRAM GLOW & SOFT GOLDEN FIREFLY LAYER (f >= 315 — kept in garden arches/periphery, NEVER white dots on faces!) */}
        {f >= 315 && (
          <svg
            width={1920}
            height={1080}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}
          >
            <GlowDefs />
            <defs>
              <filter id="s2-firefly-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4.5" />
              </filter>
            </defs>
            <Glow x={env === "ashram_dhuni" ? 1140 : 320} y={env === "ashram_dhuni" ? 760 : 290} r={270} kind="warm" o={0.25 * fl} />
            <Glow x={1080} y={860} r={210} kind="warm" o={0.26 * fl} />
            {/* Soft golden Gaussian-blurred fireflies drifting in the background garden & arches */}
            {Array.from({ length: 12 }, (_, i) => {
              // Keep fireflies in outer left/right garden arches (avoiding center-right face zone x=520..1420, y=160..620)
              const side = i % 2 === 0 ? 120 + hash(i * 3.7) * 360 : 1440 + hash(i * 5.1) * 360;
              const fx = side + Math.sin(f * 0.03 + i * 1.7) * 26;
              const fy = 140 + hash(i * 8.3) * 640 + Math.cos(f * 0.025 + i * 2.1) * 22;
              const pulse = 0.25 + 0.7 * Math.pow(0.5 + 0.5 * Math.sin(f * 0.09 + i * 2.9), 2);
              return (
                <g key={`ff-${i}`} opacity={pulse}>
                  <circle cx={fx} cy={fy} r={7} fill="#ffbe55" filter="url(#s2-firefly-glow)" />
                  <circle cx={fx} cy={fy} r={2.2} fill="#fff4d2" />
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* PLANE 2 (1.38x Parallax): Mid-Foreground Mist, Flying Storm Leaves, Dhunuchi Smoke Wisps & Dhuni Sparks */}
      <MidgroundParallaxPlane env={env} camX={totalX} camY={totalY} camScale={camScale} f={f} fl={fl} />

      {/* PLANE 3 (1.75x Parallax, Blurred DOF): Near Foreground Silhouettes (Palm Fronds / Banyan Jhuri / Veranda Pillars) */}
      <ForegroundDOFPlane env={env} camX={totalX} camY={totalY} camScale={camScale} f={f} />

      {clothBloom > 0.01 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 54%, rgba(255,212,120,0.42) 0%, rgba(255,168,68,0) 62%)",
            opacity: clothBloom,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 48%, transparent 56%, rgba(8, 5, 16, 0.45) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* FOLEY, STORM THUNDER, ASHRAM TEMPLE BELL & MUSICAL SWELLS */}
      <Sequence from={0} durationInFrames={330}>
        <Audio src={staticFile("audio/sfx/monsoon_rain.wav")} loop volume={0.28} />
      </Sequence>
      <Sequence from={58} durationInFrames={110}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.38} />
      </Sequence>
      <Sequence from={134} durationInFrames={110}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.32} />
      </Sequence>
      <Sequence from={210} durationInFrames={110}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.36} />
      </Sequence>
      {/* Barodi Ashram Entrance Temple Bell Chime as camera passes the hanging brass bell in Shot 1B-0 */}
      <Sequence from={325} durationInFrames={96}>
        <Audio src={staticFile("audio/sfx/temple_bell_drop.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={782} durationInFrames={36}>
        <Audio src={staticFile("audio/sfx/ep02/cloth_rustle.wav")} volume={0.35} />
      </Sequence>
      <Sequence from={846} durationInFrames={72}>
        <Audio src={staticFile("audio/sfx/soft_magical_shimmer.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={1015} durationInFrames={230}>
        <Audio src={staticFile("audio/music/Divine_Motif.wav")} loop volume={0.18} />
      </Sequence>
    </AbsoluteFill>
  );
};
