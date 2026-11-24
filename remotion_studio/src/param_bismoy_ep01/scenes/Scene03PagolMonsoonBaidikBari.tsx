import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, flicker, hash, track } from "../../cinematic/core/anim";
import { Glow, GlowDefs } from "../../cinematic/fx/Fx";
import { Rain } from "../../cinematic/sets/S05_Sets";

/**
 * Series 2 · Episode 1 · Scene 03 — Manasa Puja Monsoon Evening at Baidik Bari (1246 frames = 51.9s @ 24fps).
 * Broadcast 2D Studio Ghibli Painted Multi-Angle Plates + Local RTX 4060 JoyVASA 24.000fps Neural Lip-Sync + 4-Plane 2.5D Depth Parallax:
 *   - Shot 3A (0..310f): Wide establishing shot of Baidik Bari & the sacred Tulsi Mancha on a slate-indigo Manasa Puja monsoon evening
 *     (`plate_3a_baidik_monsoon.jpg`) with glowing warm veranda diyas, 3-plane rain, lightning flashes, thunder camera-shake,
 *     and foreground thrashing palm-frond parallax while Lady Narrator (`Sola`) narrates the family's arrival at Dogachi / Medinimandal.
 *   - Shot 3C-1 (290..615f): Cross-dissolves to Mother Charushila Devi in the lamp-lit arched brick veranda of Baidik Bari
 *     (`p3c_charu_idle_24.mp4` — living, breathing, blinking 24fps JoyVASA stream of `plate_3c_charu_veranda.jpg`), with three luminous
 *     golden dream-vision motes drifting across the mid-foreground parallax plane as `Sola` describes her three miraculous dreams.
 *   - Shot 3B (615..908f): Lightning strike & thunder camera-shake cut to the ecstatic wandering mystic (`Pagol`) in the monsoon night courtyard
 *     (`p3b_pagol_03b_24.mp4` — 24fps JoyVASA neural lip-sync on `03b_Pagol_Omen.wav`), framed on the left by a 2.5D foreground Baidik Bari
 *     veranda arch pillar (`Plane 3` at `1.75x` parallax) + heavy monsoon rain & lightning illumination!
 *   - Shot 3C-2 (908..1246f): Cut back to Mother Charushila Devi in the lamp-lit Baidik Bari veranda (`p3c_charu_03c_24.mp4` — 24fps JoyVASA
 *     neural lip-sync on `03c_Charu_Wonder.wav`) as the camera slowly dollies in through 4-plane 2.5D depth parallax while she whispers in awe.
 */

export const Scene03PagolMonsoonBaidikBari: React.FC = () => {
  const f = useCurrentFrame();
  const fl = flicker(f, 15);

  // Lightning strikes & damped physical thunder camera-shake
  const strikes = [95, 235, 618, 760];
  let stormFlash = 0;
  let shakeX = 0;
  let shakeY = 0;
  let shakeRot = 0;

  for (const s of strikes) {
    const d = f - s;
    if (d >= 0 && d <= 14) {
      stormFlash = Math.max(stormFlash, d <= 2 ? 1.0 : Math.pow(clamp(1 - (d - 2) / 11), 2));
    }
    if (d >= 1 && d <= 26) {
      const env = Math.exp(-d * 0.16);
      shakeX += Math.sin(d * 2.5 + s) * 12 * env;
      shakeY += Math.cos(d * 2.9 + s) * 8 * env;
      shakeRot += Math.sin(d * 2.1) * 0.4 * env;
    }
  }

  const fadeCharuIntro = EASE.inOut(clamp((f - 290) / 22));
  const isExteriorOrPagol = f < 305 || (f >= 615 && f < 908);

  // Camera pan & dolly trajectory driving all 4 parallax depth planes
  let camX = 0;
  let camY = 0;
  let camScale = 1.05;

  if (f < 305) {
    camScale = track(f, [[0, 1.05], [305, 1.15]]);
    camX = track(f, [[0, -30], [305, 28]]);
    camY = track(f, [[0, -8], [305, 8]]);
  } else if (f < 615) {
    camScale = track(f, [[305, 1.03], [615, 1.13]]);
    camX = track(f, [[305, 22], [615, -20]]);
    camY = track(f, [[305, 6], [615, -6]]);
  } else if (f < 908) {
    camScale = track(f, [[615, 1.05], [908, 1.16]]);
    camX = track(f, [[615, -24], [908, 26]]);
    camY = track(f, [[615, 8], [908, -8]]);
  } else {
    camScale = track(f, [[908, 1.03], [1246, 1.15]]);
    camX = track(f, [[908, -18], [1246, 18]]);
    camY = track(f, [[908, 6], [1246, -8]]);
  }

  const totalX = camX + shakeX;
  const totalY = camY + shakeY;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0a18", overflow: "hidden" }}>
      {/* PLANE 0 (0.45x Parallax): Deep Monsoon Night Sky */}
      <div
        style={{
          position: "absolute",
          inset: -60,
          transform: `translate(${totalX * 0.45}px, ${totalY * 0.45}px) scale(${1 + (camScale - 1) * 0.45})`,
          background: "radial-gradient(circle at 55% 24%, #1e273a 0%, #0a0915 75%)",
          pointerEvents: "none",
        }}
      />

      {/* PLANE 1 (1.00x Parallax): Painted Studio Ghibli Plates & 24.000fps Time-Locked JoyVASA Neural Streams */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${totalX}px, ${totalY}px) scale(${camScale}) rotate(${shakeRot}deg)`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* SHOT 3A (0..312): Wide Baidik Bari Courtyard & Tulsi Mancha on a Monsoon Storm Evening */}
        {f < 312 && (
          <AbsoluteFill>
            <Img
              src={staticFile("images/s2_ep01/plate_3a_baidik_monsoon.jpg")}
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
                filter: stormFlash > 0.02 ? `brightness(${1 + stormFlash * 0.45})` : undefined,
              }}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 3C-1 (290..615): Mother Charushila Devi in the Lamp-Lit Baidik Bari Veranda (Three Divine Dreams) */}
        {f >= 290 && f < 615 && (
          <AbsoluteFill style={{ opacity: fadeCharuIntro }}>
            <Sequence from={290} durationInFrames={330}>
              <OffthreadVideo
                src={staticFile("video/s2_ep01/p3c_charu_idle_24.mp4")}
                muted
                style={{ width: 1920, height: 1080, objectFit: "cover" }}
              />
            </Sequence>
          </AbsoluteFill>
        )}

        {/* SHOT 3B (615..908): Ecstatic Wandering Mystic (Pagol) in the Monsoon Rain Courtyard (03b_Pagol_Omen.wav) */}
        {f >= 615 && f < 908 && (
          <Sequence from={615} durationInFrames={293}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p3b_pagol_03b_24.mp4")}
              muted
              style={{
                width: 1920,
                height: 1080,
                objectFit: "cover",
                filter: stormFlash > 0.02 ? `brightness(${1 + stormFlash * 0.4})` : undefined,
              }}
            />
          </Sequence>
        )}

        {/* SHOT 3C-2 (908..1246): Mother Charushila Devi Speaking in Hushed Wonder (03c_Charu_Wonder.wav) */}
        {f >= 908 && (
          <Sequence from={908} durationInFrames={338}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p3c_charu_03c_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* Far-Plane Monsoon Rain & Lightning Illumination */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <GlowDefs />
          <Rain
            f={f}
            n={isExteriorOrPagol ? 150 : 75}
            wind={-0.30}
            o={isExteriorOrPagol ? 0.62 : 0.28}
            area={isExteriorOrPagol ? [-200, -100, 2320, 1280] : [-100, -100, 620, 1280]}
          />
          {stormFlash > 0.02 && (
            <rect x={0} y={0} width={1920} height={1080} fill="#dcecff" opacity={stormFlash * 0.26} />
          )}
          {!isExteriorOrPagol && <Glow x={1420} y={520} r={280} kind="warm" o={0.22 * fl} />}
        </svg>
      </div>

      {/* PLANE 2 (1.38x Parallax): Mid-Foreground Monsoon Mist, Wind-Blown Rain & Three Golden Dream-Vision Motes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transform: `translate(${totalX * 1.38}px, ${totalY * 1.38}px) scale(${1 + (camScale - 1) * 1.25})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <filter id="s2-sc03-mist-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="26" />
            </filter>
            <filter id="s2-sc03-dream-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>

          {/* Rolling monsoon night mist */}
          {[0, 1].map((i) => {
            const mx = 420 + i * 980 + Math.sin(f * 0.02 + i * 2) * 150;
            return (
              <ellipse
                key={`sc03-mist-${i}`}
                cx={mx}
                cy={860 + i * 55}
                rx={580}
                ry={72}
                fill={isExteriorOrPagol ? "#8ca6c4" : "#d4b48c"}
                opacity={0.12}
                filter="url(#s2-sc03-mist-blur)"
              />
            );
          })}

          {isExteriorOrPagol && <Rain f={f + 43} n={110} wind={-0.36} o={0.48} area={[-240, -120, 2400, 1320]} />}

          {/* Three Luminous Golden Dream-Vision Orbs floating gently in the veranda arch periphery during Charushila's shots */}
          {!isExteriorOrPagol &&
            [0, 1, 2].map((k) => {
              const dx = 220 + k * 145 + Math.sin(f * 0.03 + k * 2.1) * 28;
              const dy = 260 + k * 150 + Math.cos(f * 0.025 + k * 1.7) * 24;
              const pulse = 0.35 + 0.55 * Math.sin(f * 0.07 + k * 2.0) ** 2;
              return (
                <g key={`dream-orb-${k}`} opacity={pulse}>
                  <circle cx={dx} cy={dy} r={18} fill="#ffbe55" filter="url(#s2-sc03-dream-glow)" />
                  <circle cx={dx} cy={dy} r={4} fill="#fff6dc" />
                </g>
              );
            })}
        </svg>
      </div>

      {/* PLANE 3 (1.75x Parallax, Blurred DOF): Out-of-Focus Foreground Baidik Bari Veranda Arch Pillars & Storm Foliage */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transform: `translate(${totalX * 1.75}px, ${totalY * 1.75}px) scale(${1 + (camScale - 1) * 1.55})`,
          transformOrigin: "50% 50%",
          filter: "blur(8px)",
        }}
      >
        {f < 305 ? (
          /* Shot 3A Exterior: Thrashing foreground monsoon palm fronds */
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {[0, 1, 2].map((i) => {
              const whip = Math.sin(f * 0.22 + i * 1.4) * 14;
              return (
                <path
                  key={`sc03-palm-l-${i}`}
                  d={`M -140 ${70 + i * 130} Q ${130 + whip} ${30 + i * 120 + whip} ${290 + whip} ${
                    135 + i * 135 + whip
                  } Q ${110 + whip} ${130 + i * 130} -140 ${155 + i * 130} Z`}
                  fill="#060b12"
                  opacity={0.82}
                />
              );
            })}
          </svg>
        ) : f >= 615 && f < 908 ? (
          /* Shot 3B Pagol in Monsoon Courtyard: Soft foreground banana leaf / veranda edge silhouette on far edges */
          <>
            <div
              style={{
                position: "absolute",
                left: -120,
                top: -50,
                width: 140,
                height: 1180,
                background: "linear-gradient(90deg, rgba(8,6,14,0.90) 0%, rgba(18,12,24,0.40) 70%, transparent 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                right: -120,
                top: -50,
                width: 140,
                height: 1180,
                background: "linear-gradient(270deg, rgba(8,6,14,0.88) 0%, rgba(18,12,24,0.35) 70%, transparent 100%)",
              }}
            />
          </>
        ) : (
          /* Shot 3C-1 & 3C-2 Charushila Veranda: Soft foreground veranda pillar on the left & warm diya bokeh */
          <div
            style={{
              position: "absolute",
              left: -110,
              top: -50,
              width: 165,
              height: 1180,
              background: "linear-gradient(90deg, rgba(10,7,18,0.90) 0%, rgba(24,16,38,0.45) 70%, transparent 100%)",
            }}
          />
        )}

        {[0, 1, 2].map((i) => (
          <div
            key={`sc03-bokeh-${i}`}
            style={{
              position: "absolute",
              left: 240 + i * 660 + Math.sin(f * 0.025 + i * 2) * 30,
              top: 160 + (i % 2) * 560,
              width: 68 + i * 18,
              height: 68 + i * 18,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,204,116,0.20) 0%, rgba(255,165,70,0) 72%)",
            }}
          />
        ))}
      </div>

      {/* Soft cinematic vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 56%, rgba(6, 4, 14, 0.46) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* FOLEY: Monsoon Rain & Thunder Accents */}
      <Sequence from={0} durationInFrames={1246}>
        <Audio src={staticFile("audio/sfx/monsoon_rain.wav")} loop volume={0.24} />
      </Sequence>
      <Sequence from={95} durationInFrames={110}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.30} />
      </Sequence>
      <Sequence from={618} durationInFrames={120}>
        <Audio src={staticFile("audio/sfx/ep02/thunder_roll.wav")} volume={0.38} />
      </Sequence>
    </AbsoluteFill>
  );
};
