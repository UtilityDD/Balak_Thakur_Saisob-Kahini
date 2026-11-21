import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { clamp, EASE, flicker, hash, track } from "../../cinematic/core/anim";
import { Glow, GlowDefs } from "../../cinematic/fx/Fx";

/**
 * Series 2 · Episode 1 · Scene 02 — Kaulipara Ancestral Home on the Padma at Dawn (1380 frames = 57.5s @ 24fps).
 * Broadcast 2D Studio Ghibli Painted Multi-Angle Plates + Local RTX 4060 JoyVASA 24.000fps Neural Lip-Sync + 4-Plane 2.5D Depth Parallax:
 *   - Shot 2A-0 (0..365f): Wide aerial establishing pan across prosperous Kaulipara on the golden Padma at dawn
 *     (`plate_2a0_kaulipara_village.jpg`) as Lady Narrator (`Sola`) introduces the sacred lineage of Bishnudas Thakur & Harnath Shiromani.
 *   - Shot 2A-1 (345..565f): Close architectural pan across the sunlit brick Baidik ancestral house & sacred Tulsi Mancha
 *     (`plate_2a_house_tulsi_pan.jpg` — 100% pure painted plate before the water spurt).
 *   - Shot 2A-Spurt (555..750f): Sudden water-jet eruption from the cracked courtyard earth beside the Tulsi Mancha
 *     (`p2a_wife_idle_24.mp4` -> `p2a_wife_02b_24.mp4`) as Harnath's wife startles and begins her warning (`02b_Harnath_Wife.wav` starts at f=672).
 *   - Shot 2B-1 (740..964f): 100% continuity-matched medium close-up on Harnath's wife (`p2b_wife_02b_24.mp4`, locked to `<Sequence from={672}>`!)
 *     with live neural facial expressions and Bengali lip-sync.
 *   - Shot 2C (964..1157f): 2-Part Dramatic Cut during the Villager's shocked cry (`02c_Villager_Shock.wav`):
 *     * 964..1065f: Zoomed pan across the bustling Kaulipara village roofs, post offices, tols & riverfront (`plate_2a0_kaulipara_village.jpg`)
 *     * 1065..1157f: Urgent reaction shot on the spurting Padma fracture & Harnath's wife (`p2a_wife_idle_24.mp4`) with live surging water droplets.
 *   - Shot 2B-2 (1157..1380f): Medium close-up on Harnath's wife leading everyone decisively to safety (`p2b_wife_02d_24.mp4` on `02d_Harnath_Wife_Lead.wav`),
 *     pulling back smoothly to the wide courtyard (`p2a_wife_idle_24.mp4`) at the end of the scene.
 */

export const Scene02PadmaKaulipara: React.FC = () => {
  const f = useCurrentFrame();
  const fl = flicker(f, 19);

  // Smooth cross-dissolve envelopes
  const fade2A1 = EASE.inOut(clamp((f - 345) / 20));
  const fadeSpurt = EASE.out(clamp((f - 555) / 12));
  const fadeOutroWide = EASE.inOut(clamp((f - 1335) / 24));

  // Subtle earth-tremor camera vibration when the subterranean Padma water bursts through the courtyard crack (f=558..595)
  let tremorX = 0;
  let tremorY = 0;
  if (f >= 558 && f <= 600) {
    const d = f - 558;
    const env = Math.exp(-d * 0.11);
    tremorX = Math.sin(d * 2.7) * 8 * env;
    tremorY = Math.cos(d * 3.1) * 6 * env;
  }

  // Camera pan & dolly trajectory driving all 4 parallax depth planes
  let camX = 0;
  let camY = 0;
  let camScale = 1.05;

  if (f < 365) {
    camScale = track(f, [[0, 1.05], [365, 1.16]]);
    camX = track(f, [[0, -34], [365, 32]]);
    camY = track(f, [[0, -10], [365, 8]]);
  } else if (f < 560) {
    camScale = track(f, [[365, 1.04], [560, 1.14]]);
    camX = track(f, [[365, 28], [560, -26]]);
    camY = track(f, [[365, -6], [560, 8]]);
  } else if (f < 745) {
    camScale = track(f, [[560, 1.04], [745, 1.13]]);
    camX = track(f, [[560, 18], [745, -18]]);
  } else if (f < 964) {
    camScale = track(f, [[745, 1.03], [964, 1.12]]);
    camX = track(f, [[745, 16], [964, -16]]);
    camY = track(f, [[745, 6], [964, -6]]);
  } else if (f < 1095) {
    // Shot 2C-1: Shocked elderly Kaulipara villager speaking (`p2c_villager_02c_24.mp4`, "কী বলছেন মা ঠাকরুন? আটটা পোস্ট অফিস, চব্বিশটা টোল—")
    camScale = track(f, [[964, 1.04], [1095, 1.14]]);
    camX = track(f, [[964, 18], [1095, -18]]);
  } else if (f < 1157) {
    // Shot 2C-2: Urgent cut to the spurting Padma fracture ("—এত বড় গ্রাম পদ্মায় ভেঙে যাবে?")
    camScale = track(f, [[1095, 1.08], [1157, 1.16]]);
    camX = track(f, [[1095, -18], [1157, 14]]);
  } else {
    // Shot 2B-2 (1157..1380): Harnath's wife leads the village to safety
    camScale = track(f, [[1157, 1.04], [1340, 1.13], [1380, 1.05]]);
    camX = track(f, [[1157, -16], [1340, 16], [1380, 0]]);
  }

  const totalX = camX + tremorX;
  const totalY = camY + tremorY;
  const showWaterJet = (f >= 558 && f < 964) || (f >= 1095 && f < 1157);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a120b", overflow: "hidden" }}>
      {/* PLANE 0 (0.45x Parallax): Warm Golden Sunrise Sky Horizon */}
      <div
        style={{
          position: "absolute",
          inset: -60,
          transform: `translate(${totalX * 0.45}px, ${totalY * 0.45}px) scale(${1 + (camScale - 1) * 0.45})`,
          background: "linear-gradient(180deg, #f6c98e 0%, #fae2b8 55%, #8a9e68 100%)",
          pointerEvents: "none",
        }}
      />

      {/* PLANE 1 (1.00x Parallax): Painted Studio Ghibli Plates & 24.000fps Time-Locked JoyVASA Streams */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${totalX}px, ${totalY}px) scale(${camScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* SHOT 2A-0 (0..368): Wide Painted Kaulipara Village on the Padma at Dawn */}
        {f < 368 && (
          <AbsoluteFill>
            <Img
              src={staticFile("images/s2_ep01/plate_2a0_kaulipara_village.jpg")}
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 2A-1 (345..568): Close Pan Across Brick Baidik Ancestral Home & Tulsi Mancha Before Spurt */}
        {f >= 345 && f < 568 && (
          <AbsoluteFill style={{ opacity: fade2A1 }}>
            <Img
              src={staticFile("images/s2_ep01/plate_2a_house_tulsi_pan.jpg")}
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}

        {/* SHOT 2A-SPURT-IDLE (555..672): Water Erupts From Crack Beside Tulsi Mancha — Living JoyVASA Reaction */}
        {f >= 555 && f < 672 && (
          <AbsoluteFill style={{ opacity: fadeSpurt }}>
            <Sequence from={555} durationInFrames={120}>
              <OffthreadVideo
                src={staticFile("video/s2_ep01/p2a_wife_idle_24.mp4")}
                muted
                style={{ width: 1920, height: 1080, objectFit: "cover" }}
              />
            </Sequence>
          </AbsoluteFill>
        )}

        {/* SHOT 2A-SPEAK (672..745): Wide Courtyard as Harnath's Wife Begins Her Urgent Warning (02b_Harnath_Wife.wav) */}
        {f >= 672 && f < 745 && (
          <Sequence from={672} durationInFrames={276}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p2a_wife_02b_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 2B-1 (745..964): Medium Close-Up on Harnath's Wife (locked to <Sequence from={672}> for ZERO lip-sync offset!) */}
        {f >= 745 && f < 964 && (
          <Sequence from={672} durationInFrames={292}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p2b_wife_02b_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 2C-1 (964..1095): Shocked Elderly Kaulipara Villager Speaking with JoyVASA Lip-Sync (02c_Villager_Shock.wav) */}
        {f >= 964 && f < 1095 && (
          <Sequence from={964} durationInFrames={179}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p2c_villager_02c_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 2C-2 (1095..1157): Urgent Cut Back to the Cracking Earth & Spurting Padma Water Jet */}
        {f >= 1095 && f < 1157 && (
          <Sequence from={1095} durationInFrames={65}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p2a_wife_idle_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 2B-2 (1157..1365): Medium Close-Up on Harnath's Wife Leading Everyone to Safety (02d_Harnath_Wife_Lead.wav) */}
        {f >= 1157 && f < 1365 && (
          <Sequence from={1157} durationInFrames={208}>
            <OffthreadVideo
              src={staticFile("video/s2_ep01/p2b_wife_02d_24.mp4")}
              muted
              style={{ width: 1920, height: 1080, objectFit: "cover" }}
            />
          </Sequence>
        )}

        {/* SHOT 2A-OUTRO (1335..1380): Smooth Pull-Back Dissolve to Kaulipara Courtyard Wide */}
        {f >= 1335 && (
          <AbsoluteFill style={{ opacity: fadeOutroWide }}>
            <Sequence from={1335} durationInFrames={48}>
              <OffthreadVideo
                src={staticFile("video/s2_ep01/p2a_wife_idle_24.mp4")}
                muted
                style={{ width: 1920, height: 1080, objectFit: "cover" }}
              />
            </Sequence>
          </AbsoluteFill>
        )}

        {/* Live Animated Water-Spurt Droplets & Tulsi Diya Glow */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <GlowDefs />
          <Glow x={760} y={670} r={190} kind="warm" o={0.22 * fl} />
          {showWaterJet &&
            Array.from({ length: 18 }, (_, i) => {
              const isCU = (f >= 745 && f < 964) || (f >= 1157 && f < 1345);
              const baseX = isCU ? 955 : 1052;
              const baseY = isCU ? 1020 : 945;
              const cycle = (f * (4.2 + (i % 4) * 0.6) + i * 19) % 110;
              const spread = ((i % 7) - 3) * (0.45 + cycle * 0.012);
              const dx = baseX + spread * 14 + Math.sin(f * 0.3 + i) * 5;
              const dy = baseY - cycle * 3.1 + 0.018 * cycle * cycle;
              const alpha = Math.sin((cycle / 110) * Math.PI) * 0.85;
              return <circle key={`drop-${i}`} cx={dx} cy={dy} r={2.5 + (i % 3)} fill="#e6f7ff" opacity={alpha} />;
            })}
        </svg>
      </div>

      {/* PLANE 2 (1.38x Parallax): Mid-Foreground Golden Morning River Mist, Sunbeam Rays & Floating Pollen Motes */}
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
            <filter id="s2-sc02-mist-blur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="28" />
            </filter>
            <filter id="s2-sc02-mote-blur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>
          {/* Drifting golden Padma morning mist banks */}
          {[0, 1].map((i) => {
            const mx = 480 + i * 960 + Math.sin(f * 0.018 + i * 2.2) * 160;
            return (
              <ellipse
                key={`dawn-mist-${i}`}
                cx={mx}
                cy={830 + i * 65}
                rx={620}
                ry={75}
                fill="#ffe9c2"
                opacity={0.14}
                filter="url(#s2-sc02-mist-blur)"
              />
            );
          })}
          {/* Soft golden morning sunlight motes in the garden periphery */}
          {Array.from({ length: 12 }, (_, i) => {
            const side = i % 2 === 0 ? 120 + hash(i * 4.1) * 420 : 1420 + hash(i * 6.3) * 380;
            const mx = side + Math.sin(f * 0.025 + i) * 28;
            const my = 140 + hash(i * 7.9) * 680 + Math.cos(f * 0.02 + i * 1.7) * 22;
            const op = 0.25 + 0.55 * Math.sin(f * 0.06 + i * 2.1) ** 2;
            return (
              <g key={`dawn-mote-${i}`} opacity={op}>
                <circle cx={mx} cy={my} r={6} fill="#ffd584" filter="url(#s2-sc02-mote-blur)" />
                <circle cx={mx} cy={my} r={2} fill="#fff7df" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* PLANE 3 (1.75x Parallax, Blurred DOF): Out-of-Focus Foreground Mango/Palm Foliage & Warm Sunrise Bokeh */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transform: `translate(${totalX * 1.75}px, ${totalY * 1.75}px) scale(${1 + (camScale - 1) * 1.55})`,
          transformOrigin: "50% 50%",
          filter: "blur(7px)",
        }}
      >
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {/* Foreground swaying palm & mango leaves framing the top-left and top-right corners */}
          {[0, 1, 2].map((i) => {
            const sway = Math.sin(f * 0.04 + i * 1.5) * 9;
            return (
              <path
                key={`sc02-fg-l-${i}`}
                d={`M -140 ${40 + i * 95} Q ${110 + sway} ${15 + i * 90 + sway} ${245 + sway} ${
                  95 + i * 100 + sway
                } Q ${95 + sway} ${95 + i * 95} -140 ${115 + i * 95} Z`}
                fill="#1f3318"
                opacity={0.72}
              />
            );
          })}
          {[0, 1].map((i) => {
            const sway = Math.sin(f * 0.045 + i * 1.8 + 1) * 10;
            return (
              <path
                key={`sc02-fg-r-${i}`}
                d={`M 2060 ${60 + i * 110} Q ${1810 - sway} ${35 + i * 105 + sway} ${1685 - sway} ${
                  115 + i * 115 + sway
                } Q ${1830 - sway} ${115 + i * 110} 2060 ${135 + i * 110} Z`}
                fill="#1f3318"
                opacity={0.68}
              />
            );
          })}
        </svg>
        {[0, 1, 2].map((i) => (
          <div
            key={`dawn-bokeh-${i}`}
            style={{
              position: "absolute",
              left: 220 + i * 680 + Math.sin(f * 0.02 + i * 2) * 30,
              top: 140 + (i % 2) * 580,
              width: 78 + i * 18,
              height: 78 + i * 18,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,224,150,0.24) 0%, rgba(255,190,95,0) 72%)",
            }}
          />
        ))}
      </div>

      {/* Soft cinematic vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(24, 14, 6, 0.34) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* FOLEY: Subterranean Padma Water Spurt & River Surge */}
      <Sequence from={556} durationInFrames={36}>
        <Audio src={staticFile("audio/sfx/ep02/water_splash.wav")} volume={0.38} />
      </Sequence>
      <Sequence from={1065} durationInFrames={36}>
        <Audio src={staticFile("audio/sfx/ep02/water_splash.wav")} volume={0.30} />
      </Sequence>
    </AbsoluteFill>
  );
};
